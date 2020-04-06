# pylint: disable=wrong-import-position

from collections import defaultdict
import json
import os

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

import h5py
import networkx as nx
import numpy as np
from tqdm import tqdm

import tensorflow as tf
tf.compat.v1.logging.set_verbosity(tf.compat.v1.logging.ERROR)

from massif.data import hdf5utils
from massif.model import InceptionV1Model
from paths import DataPaths


def init_influences(model: InceptionV1Model, x=None):

    def get_influence(block_tensor, weights):
        return tf.math.reduce_max(
            tf.nn.depthwise_conv2d(
                block_tensor, weights,
                [1, 3, 3, 1], 'SAME'),
            [1, 2])

    t_influences = dict()
    for i, curr_layer in enumerate(model.LAYERS):
        if curr_layer == 'mixed3a':
            continue

        tw_1x1, tw_3x3_btl, tw_3x3, tw_5x5_btl, tw_5x5, tw_pool_reduce = \
            model.get_weights_for_layer(curr_layer, x)

        t_in, t_3x3_btl, t_5x5_btl = \
            model.get_block_tensors_for_layer(curr_layer, x)

        influences = dict()
        influences[curr_layer+'_concat_0'] = get_influence(t_in, tw_1x1)
        influences[curr_layer+'_concat_1'] = get_influence(t_3x3_btl, tw_3x3)
        influences[curr_layer+'_concat_2'] = get_influence(t_5x5_btl, tw_5x5)
        influences[curr_layer+'_concat_3'] = get_influence(t_in, tw_pool_reduce)
        influences[curr_layer+'_3x3'] = get_influence(t_in, tw_3x3_btl)
        influences[curr_layer+'_5x5'] = get_influence(t_in, tw_5x5_btl)

        for block, t in influences.items():
            ch_out = int(model.LAYER_BLK_SIZES[block])
            ch_in = int(t.shape[1] // ch_out)
            assert ch_in * ch_out == int(t.shape[1])

            t_reshaped = tf.reshape(t, [-1, ch_in, ch_out])
            t_transposed = tf.transpose(t_reshaped, [0, 2, 1])

            t_influences[block] = t_transposed

    return t_influences # {block: (batch_size, block_out, block_in)}


def compute_raw_edge_influences(input_filepath, output_filepath):
    assert input_filepath.exists()
    if output_filepath.exists():
        return

    print('Saving output to %s' % output_filepath)
    output_file = h5py.File(output_filepath, 'w')

    print('Loading data...')
    input_dataset = hdf5utils.load_image_dataset_from_file(input_filepath)

    print('Building tensorflow graph...')
    graph = tf.Graph()
    print(graph)
    with graph.as_default():
        model = InceptionV1Model()
        x = model.default_input_placeholder
        influences = init_influences(model, x)

        output_datasets = hdf5utils.create_raw_edge_influences_datasets(
            output_file, influences)

        pbar = tqdm(unit='imgs', total=len(input_dataset))
        with tf.Session(graph=graph) as sess:
            for batch in hdf5utils.minibatch(input_dataset, 16):
                for block, tensor in influences.items():
                    output = sess.run(tensor, feed_dict={x: np.array(batch)})
                    hdf5utils.add_items_to_dataset(
                        output, output_datasets[block])

                pbar.update(n=len(batch))

    print('********************')

def compute_benign_raw_edge_influences(class_name):
    input_filepath = \
        DataPaths.get_benign_images_datapath(class_name)
    output_filepath = \
        DataPaths.get_benign_raw_edge_influences_datapath(class_name)

    compute_raw_edge_influences(input_filepath, output_filepath)


def compute_attacked_raw_edge_influences(original_class, target_class,
                                         attack_name, attack_strength):
    input_filepath = \
        DataPaths.get_attacked_images_datapath(original_class, target_class,
                                               attack_name, attack_strength)
    output_filepath = \
        DataPaths.get_attacked_raw_edge_influences_datapath(
            original_class, target_class, attack_name, attack_strength)

    compute_raw_edge_influences(input_filepath, output_filepath)


def compute_influence_matrix(input_filepath, output_filepath):
    assert input_filepath.exists()
    if output_filepath.exists():
        return

    print('Reading from %s' % input_filepath)
    raw_edge_influences = hdf5utils.load_raw_edge_influences_datasets(
        input_filepath, sorted(InceptionV1Model.LAYER_BLK_SIZES.keys()))

    print('Computing median influences...')
    median_edge_influences = {
        block: np.median(raw_edge_influences[block], axis=0)
        for block in tqdm(raw_edge_influences.keys(), unit='blocks')}

    print('Building influence graph...')
    G = nx.DiGraph()
    Model = InceptionV1Model
    layers_reversed = list(reversed(Model.LAYERS))

    # iterate layers in reverse order,
    # skip first layer which has no previous layer
    pbar_layer = tqdm(total=len(layers_reversed) - 1, unit='layers')
    for i, layer in enumerate(layers_reversed[:-1]):
        prev_layer = layers_reversed[i + 1]
        pbar_layer.set_postfix(
            prev_layer=prev_layer,
            curr_layer=layer)

        # iterate over each neuron in the current layer
        pbar_neuron = tqdm(total=Model.LAYER_SIZES[layer],
                           unit='neurons', leave=False)
        for neuron_idx_in_layer in range(Model.LAYER_SIZES[layer]):
            curr_neuron = '%s-%d' % (layer, neuron_idx_in_layer)

            # get neuron block and index in block
            args = (neuron_idx_in_layer, layer)
            neuron_block = Model.get_neuron_block(*args)
            neuron_idx_in_block = Model.get_neuron_index_in_block(*args)

            influence_matrix = median_edge_influences[neuron_block]

            if neuron_block in {layer+'_concat_0', layer+'_concat_3'}:
                # direct connection with previous layer
                num_prev_neurons = influence_matrix.shape[-1]
                for prev_neuron_idx in range(num_prev_neurons):
                    prev_neuron = '%s-%d' % (prev_layer, prev_neuron_idx)
                    v = influence_matrix[neuron_idx_in_block][prev_neuron_idx]
                    G.add_edge(prev_neuron, curr_neuron, influence=v)

            elif neuron_block in {layer+'_concat_1', layer+'_concat_2'}:
                # connection to previous layer through intermediate blocks
                intermediate_block = layer+'_%s' % (
                    {layer+'_concat_1': '3x3',
                     layer+'_concat_2': '5x5'}[neuron_block])

                inter_inf_matrix = median_edge_influences[intermediate_block]

                num_inter_block_neurons = influence_matrix.shape[-1]
                num_prev_layer_neurons = inter_inf_matrix.shape[-1]

                # get all possible edge weights between
                # curr_neuron and ones in prev_layer
                neuron_edges = defaultdict(list)
                for inter_neuron_idx in range(num_inter_block_neurons):
                    v_inter = \
                        influence_matrix[neuron_idx_in_block][inter_neuron_idx]
                    for prev_neuron_idx in range(num_prev_layer_neurons):
                        v_prev = \
                            inter_inf_matrix[inter_neuron_idx][prev_neuron_idx]
                        neuron_edges[prev_neuron_idx].append(
                            min(v_inter, v_prev))

                # given a neuron in the prev_layer,
                # choose only one weight that has the maximum weights
                # between the previous neuron and the current neuron
                for prev_neuron_idx in neuron_edges.keys():
                    prev_neuron = '%s-%d' % (prev_layer, prev_neuron_idx)
                    max_v = max(neuron_edges[prev_neuron_idx])
                    G.add_edge(prev_neuron, curr_neuron, influence=max_v)

            else:
                raise RuntimeError('invalid neuron block: %s' % neuron_block)

            pbar_neuron.update()
        pbar_layer.update()

    print('Building final parsed dictionary...')
    parsed_influences = {
        layer: {'%s-%d' % (layer, neuron_idx): dict()
                for neuron_idx in range(layer_size)}
        for layer, layer_size in Model.LAYER_SIZES.items()
        if layer != 'mixed5b'} # skip last layer

    for source, target, data in tqdm(G.edges(data='influence')):
        layer = source.split('-')[0]
        parsed_influences[layer][source][target] = {'influence': data.item()}

    with open(output_filepath, 'w') as f:
        json.dump(parsed_influences, f)
    print('Saved to %s' % output_filepath)


def compute_benign_influence_matrix(class_name):
    input_filepath = \
        DataPaths.get_benign_raw_edge_influences_datapath(class_name)
    output_filepath = \
        DataPaths.get_benign_influence_matrix_datapath(class_name)

    compute_influence_matrix(input_filepath, output_filepath)


def compute_attacked_influence_matrix(original_class, target_class,
                                      attack_name, attack_strength):
    input_filepath = \
        DataPaths.get_attacked_raw_edge_influences_datapath(
            original_class, target_class, attack_name, attack_strength)
    output_filepath = \
        DataPaths.get_attacked_influence_matrix_datapath(
            original_class, target_class, attack_name, attack_strength)

    compute_influence_matrix(input_filepath, output_filepath)



if __name__ == "__main__":
    from constants import ATTACK_STRENGTHS

    class_pairs = [('ambulance', 'street_sign'),
                   ('brown_bear', 'american_black_bear'),
                   ('diamondback', 'vine_snake'),
                   ('giant_panda', 'armadillo'),
                   ('vine_snake', 'green_snake')]

    for original_class, target_class in class_pairs:
        compute_benign_influence_matrix(original_class)
        compute_benign_influence_matrix(target_class)

        for attack_strength in ATTACK_STRENGTHS:
            compute_attacked_influence_matrix(
                original_class, target_class, 'pgd', attack_strength)
        print('------------')

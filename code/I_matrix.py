'''
Import packages
'''

import os
import glob
import json
import tqdm
from time import time
import argparse
import numpy as np
import tensorflow as tf
from collections import defaultdict
import lucid.optvis.render as render
import lucid.modelzoo.vision_models as models
from keras.applications.inception_v3 import preprocess_input
from data_parser import _parse_function

'''
Main function
'''
def main():
    '''
    Parse the arguments
    '''
    args = parse_args()
    layer = args.layer
    gpu = args.gpu
    batch = args.batch

    os.environ["CUDA_VISIBLE_DEVICES"] = str(gpu)

    googlenet = models.InceptionV1()
    googlenet.load_graphdef()
    nodes = googlenet.graph_def.node

    # filenames = glob.glob('/media/fred/strawberry/imagenet-tf-records/*')
    # filenames = glob.glob('test-images/imagenet-tf-records/*')
    filenames = glob.glob('/raid/hpark407/imagenet-tf-records/*')
    I_mat_dirpath = '/raid/fhohman3/I-mat/'
    # chain_dirpath = './chain/'

    num_class = 1000
    all_layers = get_layers(nodes)
    mixed_layers = [layer for layer in all_layers if 'mixed' in layer]

    layers = {
        'mixed3a': 256,
        'mixed3b': 480,
        'mixed4a': 508,
        'mixed4b': 512,
        'mixed4c': 512,
        'mixed4d': 528,
        'mixed4e': 832,
        'mixed5a': 832,
        'mixed5b': 1024
    }

    layer_fragment_sizes = {layer: get_channel_sizes(layer, nodes) for layer in mixed_layers}
    weight_sizes = get_weight_sizes(nodes, all_layers)
    act_sizes = get_act_sizes(weight_sizes, mixed_layers)

    k = 5
    # chain_k = 3
    mixed_layer = layer.split('_')[0]
    prev_layer = get_prev_layer(all_layers, mixed_layer)

    a_sz = act_sizes[mixed_layer]
    f_sz = layer_fragment_sizes[mixed_layer]

    frag_sz = [f_sz[0], f_sz[1], f_sz[2], f_sz[3], a_sz[1], a_sz[2]]

    outlier_nodes = ['mixed3a-67', 'mixed3a-190', 'mixed3b-390', 'mixed3b-399', 'mixed3b-412']
    outlier_nodes_idx = [int(n.split('-')[1]) for n in outlier_nodes if layer in n]

    # Get top impactful previous neurons and generate I-matrices
    # Get layer info
    is_mixed = '_' not in layer
    branch = None if is_mixed else int(layer.split('_')[-1])

    # Initialize I
    num_channel = layers[layer] if is_mixed else act_sizes[layer[:-2]][branch]
    I_layer = gen_empty_I(num_class, num_channel)

    # Run
    with tf.Graph().as_default():
        # Get dataset
        dataset = tf.data.TFRecordDataset(filenames)
        dataset = dataset.map(_parse_function)
        dataset = dataset.map(lambda img, lab, syn: (preprocess_input(img), lab, syn))
        dataset = dataset.batch(batch)

        # Iterate tf-records
        iterator = dataset.make_one_shot_iterator()
        t_preprocessed_images, t_labels, t_synsets = iterator.get_next()

        # Import googlenet
        T = render.import_model(googlenet, t_preprocessed_images, None)

        # Get weight tensors
        t_w0, t_w1, t_w2, t_w3, t_w4, t_w5 = get_weight_tensors(mixed_layer)

        # Get intermediate layer tensors
        t_a0, t_a1, t_a2 = get_intermediate_layer_tensors(prev_layer, mixed_layer)

        # Define intermediate conv output tensors
        t_inf_0 = get_infs(t_a0, t_w0)
        t_inf_1 = get_infs(t_a1, t_w2)
        t_inf_2 = get_infs(t_a2, t_w4)
        t_inf_3 = get_infs(t_a0, t_w5)
        t_inf_4 = get_infs(t_a0, t_w1)
        t_inf_5 = get_infs(t_a0, t_w3)

        # Run with batch
        progress_counter = 0
        with tf.Session() as sess:
            start = time.time()

            try:
                with tqdm.tqdm(total=1281167, unit='imgs') as pbar:

                    while(True):
                        progress_counter += 1

                        # Run the session
                        if is_mixed:
                            labels, inf_0, inf_1, inf_2, inf_3 = sess.run([t_labels, t_inf_0, t_inf_1, t_inf_2, t_inf_3])

                        elif branch == 1:
                            labels, inf_4 = sess.run([t_labels, t_inf_4])

                        elif branch == 2:
                            labels, inf_5 = sess.run([t_labels, t_inf_5])

                        # Add up the counts
                        if is_mixed:
                            channel = 0
                            for frag, inf in enumerate([inf_0, inf_1, inf_2, inf_3]):
                                channel = update_I(layer, inf, channel, I_layer, labels, frag_sz[frag], k, outlier_nodes_idx)

                        elif branch == 1:
                            update_I(layer, inf_4, 0, I_layer, labels, frag_sz[4], k, outlier_nodes_idx)

                        elif branch == 2:
                            update_I(layer, inf_5, 0, I_layer, labels, frag_sz[5], k, outlier_nodes_idx)

                        pbar.update(len(labels))
                        # print(inf_0.shape, inf_1.shape, inf_2.shape, inf_3.shape, inf_4.shape, inf_5.shape)

            except tf.errors.OutOfRangeError:
                pass

            # Save I_layer
            with open(I_mat_dirpath + 'I_%s.json' % layer, 'w') as f:
                json.dump(I_layer, f, indent=2)

            end = time.time()
            print(end - start)
            print(progress_counter)
            print(progress_counter * batch)

    # Generate chains
    # pred_class = 270
    # channels = [1, 120]
    # generate_save_chain(pred_class, all_layers, I_mat_dirpath, channels)


def parse_args():
    '''
    Parse arguments and pass as arguments object
    '''

    parser = argparse.ArgumentParser('Summit')

    parser.add_argument('--layer', type=str, default='mixed3a',
                        help='name of layer to generate I matrix')

    parser.add_argument('--gpu', type=int, default=0,
                        help='gpu cuda visible device')

    parser.add_argument('--batch', type=int, default=500,
                        help='batch size for loading images')

    parser.add_argument('--num_class', type=int, default=1000,
                        help='the number of classes')

    parser.add_argument('--k', type=int, default=5,
                        help='TODO: need better name and explanation on this')

    return parser.parse_args()



def get_weight_tensors(layer):
    '''
    Get weight tensors for given layer
    * input
        - layer: the name of the layer in string (e.g., 'mixed3a')
    * output
        - t_w0: the tensor of layer_1x1_w:0
        - t_w1: the tensor of layer_3x3_bottleneck_w:0
        - t_w2: the tensor of layer_3x3_w:0
        - t_w3: the tensor of layer_5x5_bottleneck_w:0
        - t_w4: the tensor of layer_5x5_w:0
        - t_w5: the tensor of layer_pool_reduce_w:0
    '''
    # Get weight tensors
    t_w0 = tf.get_default_graph().get_tensor_by_name('import/%s_1x1_w:0' % layer)
    t_w1 = tf.get_default_graph().get_tensor_by_name('import/%s_3x3_bottleneck_w:0' % layer)
    t_w2 = tf.get_default_graph().get_tensor_by_name('import/%s_3x3_w:0' % layer)
    t_w3 = tf.get_default_graph().get_tensor_by_name('import/%s_5x5_bottleneck_w:0' % layer)
    t_w4 = tf.get_default_graph().get_tensor_by_name('import/%s_5x5_w:0' % layer)
    t_w5 = tf.get_default_graph().get_tensor_by_name('import/%s_pool_reduce_w:0' % layer)

    return t_w0, t_w1, t_w2, t_w3, t_w4, t_w5


def get_intermediate_layer_tensors(prev_layer, layer):
    # Get intermediate layer tensors
    t_a0 = tf.get_default_graph().get_tensor_by_name('import/%s:0' % prev_layer)
    t_a1 = tf.get_default_graph().get_tensor_by_name('import/%s_3x3_bottleneck:0' % layer)
    t_a2 = tf.get_default_graph().get_tensor_by_name('import/%s_5x5_bottleneck:0' % layer)
    return t_a0, t_a1, t_a2


def get_layers(graph_nodes):
    '''
    Get all layers
    * input
        - graph_nodes: tensorflow graph nodes
    * output
        - layers: list of all layers such as 'conv2d0' or 'mixed3a'
    '''
    layers = []
    for n in graph_nodes:
        node_name = n.name
        if node_name[-2:] == '_w':
            layer = node_name.split('_')[0]
            if layer not in layers:
                layers.append(layer)
    return layers

def init_I_mat(layer, layer_sizes, act_sizes, num_class):
    '''
    Initialize I matrix
    * Input
        - layer: the name of layer in string (e.g., 'mixed3a')
        - layer_sizes:
    '''

    # Check if the layer is mixed layer or intermediate branch layer
    is_mixed = '_' not in layer
    branch = None if is_mixed else int(layer.split('_')[-1])

    # Initialize I
    num_channel = layer_sizes[layer] if is_mixed else act_sizes[layer[:-2]][branch]
    I_mat_layer = gen_empty_I(num_class, num_channel)

    return I_mat_layer


def get_channel_sizes(layer, weight_nodes):
    '''
    Get channel sizes
    * input
        - layer: the name of layer in string (e.g., 'mixed3a')
        - weight_nodes: tensorflow nodes for all filters
    * output
        - channel_sizes: a list of the sizes of all pre-concatenated blocks
    '''

    # Initialize channel_sizes
    channel_sizes = []

    # Search for the pre-concatenated blocks in all nodes
    for n in weight_nodes:

        # Check if the node is in the layer
        is_in_layer = layer in n.name

        # Check if the node is bias node
        # We will get the size of the channel from bias nodes
        is_bias = '_b' == n.name[-2:]

        # Check if the nods is not the bottleneck node
        # We do not want to get the previous branched nodes
        is_not_bottleneck = 'bottleneck' not in n.name

        # If we get a non-bottleneck bias node for the given layer,
        #  get the size of the bias node
        if is_in_layer and is_bias and is_not_bottleneck:
            channel_size = get_shape_of_node(n)[0]
            channel_sizes.append(channel_size)

    return channel_sizes


def get_shape_of_node(n):
    '''
    Get the shape of a tensorflow node
    * input
        - n: tensorflow node
    * output
        - tensor_shape: shape of n in an array
    '''

    dims = n.attr['value'].tensor.tensor_shape.dim
    tensor_shape = [d.size for d in dims]
    return tensor_shape


def get_num_channel(layer, weight_nodes):
    '''
    Get the number of channels in the layer
    * input
        - layer: the name of layer (e.g. 'mixed5a' for normal layer, 'mixed5a_1' for 1st branch after mixed_5a layer)
        - is_branch: whether the layer is in a branch
    * output
        - num_channel: the number of channel
    '''

    is_branch = '_' in layer

    if is_branch:
        layer_name = layer[:-2]
        branch = int(layer[-1])
        branch_weights = [n for n in weight_nodes if layer_name in n.name and 'bottleneck_w' in n.name]
        branch_weight = branch_weights[branch - 1]
        num_channel = get_shape_of_node(branch_weight)[-1]
        return num_channel

    else:
        num_channel = np.sum(get_channel_sizes(layer, weight_nodes))
        return num_channel


def get_prev_layer(layers, layer):
    '''
    Get previous layer
    * input
        - layers: list of all layers
        - layer: the name of a layer
    * output
        - prev_layer: the name of a previuos layer
    '''
    prev_layer = layers[layers.index(layer) - 1]
    return prev_layer


def get_weight_sizes(nodes, layers):
    '''
    Get sizes of weight tensors
    * input
        - nodes: tensorflow nodes
        - layers: the list of layers
    * output
        - weight_sizes: a dictionary, where
            - key: a layer (e.g., 'mixed3a')
            - val: a dictionary, where
                - key: a weight in the layer (e.g., 'mixed3a_1x1_w')
                - val: the size of the weight (e.g., [1, 1, 192, 64])
    '''

    weight_sizes = {}
    for n in nodes:
        if '_w' in n.name and 'mixed' in n.name:
            layer = n.name.split('_')[0]
            if layer in layers:
                if layer not in weight_sizes:
                    weight_sizes[layer] = {}
                weight_sizes[layer][n.name] = get_shape_of_node(n)

    return weight_sizes


def get_act_sizes(weight_sizes, mixed_layers):
    act_sizes = {}
    for layer in mixed_layers:
        act_sizes[layer] = []
        for f_tile in ['1x1', '3x3', '5x5']:
            a_size = weight_sizes[layer]['{}_{}_w'.format(layer, f_tile)][2]
            act_sizes[layer].append(a_size)
    return act_sizes


# def get_topk_channels(t_a, t_w, c, num_prev_channel, mask, h, w, k):
#     '''
#     deprecated
#     '''
#     # Get masked stacked weight tensor
#     t_w_c = tf.slice(t_w, [0, 0, 0, c], [h, w, num_prev_channel, 1])
#     t_stacked_w_c = tf.squeeze(tf.stack([t_w_c for _ in range(num_prev_channel)], axis=2), axis=[-1])
#     zeros = tf.zeros_like(t_stacked_w_c)
#     t_masked_w = tf.where(mask, t_stacked_w_c, zeros, name='import/t_mask_c')

#     # Get conv2d tensor
#     t_conv2d_tensor_c = tf.nn.conv2d(t_a, t_masked_w, [1, 3, 3, 1], 'SAME')

#     # Get influences
#     t_inf_c = tf.math.reduce_sum(t_conv2d_tensor_c, [1, 2])

#     # Get top k impactful previous channels
#     t_top_inf_vals, t_top_prev_channels = tf.math.top_k(t_inf_c, k=k)

#     return t_top_prev_channels


def get_infs(t_a, t_w):
    '''
    Get inference scores, which is the reduce max of all depthwise convolution output
    * Input
        - t_a: the activation tensor of the previous layer
        - t_w: the weight tensor between the previous layer and the target layer
    * output
        - inf_scores: reduced max of depthwise convolution.
    '''

    inf_scores = tf.math.reduce_max(tf.nn.depthwise_conv2d(t_a, t_w, [1, 3, 3, 1], 'SAME'), [1, 2])
    return inf_scores


def gen_mask(height, width, num_channel):
    mask = np.zeros((height, width, num_channel, num_channel), dtype=bool)
    true_patch = np.ones((height, width), dtype=bool)
    for c in range(num_channel):
        mask[:, :, c, c] = true_patch

    return mask


def gen_empty_I(num_class, num_channel):
    '''
    Generate an empty initialized I
    * input
        - num_class: the number of class
        - num_channel: the number of the channel in the output layer
    * out
        - I: num_class * num_channel matrix, whose elements are an empty dict
    '''
    I = [[defaultdict(lambda: 0) for _ in range(num_channel)] for _ in range(num_class)]
    return I


def update_I(layer, influences, channel, I_layer, labels, num_out_channel, k, outlier_nodes_idx):

    start = time.time()
    num_in_channel = int(influences.shape[-1]/num_out_channel)

    temp = 0
    temp2 = 0
    for c in range(num_out_channel):

        # Get top prev channels
        influence_indices = [i*num_out_channel + c for i in range(num_in_channel)]

        all_batch_infs_c = influences[:, influence_indices]
        all_batch_topk_c = []

        for batch_inf in all_batch_infs_c:
            all_batch_topk_c.append(get_topk_ele(batch_inf, k, layer, outlier_nodes_idx))
        all_batch_topk_c = np.array(all_batch_topk_c)

        for pred_class, topks in zip(labels, all_batch_topk_c):
            # Make class be in range of 0 ~ 999
            pred_class = pred_class - 1

            # Add the count
            for top_prev in topks:
                I_layer[pred_class][channel][str(top_prev)] += 1
        channel += 1

    return channel


def get_topk_ele(arr, k, layer, outlier_nodes_idx):
    topk_and_more = np.argsort(arr)[-(k + len(outlier_nodes_idx)) :]
    topk = [channel for channel in topk_and_more if channel not in outlier_nodes_idx][-k:]
    return topk


def load_inf_matrix(mat_dirpath, layer):
    if mat_dirpath[-1] == '/':
        filepath = mat_dirpath + 'I_' + layer + '.json'
    else:
        filepath = mat_dirpath + '/I_' + layer + '.json'

    with open(filepath) as f:
        I_mat = json.load(f)

    return I_mat


# def gen_impactful_chains(Is, layer, channels, pred_class, all_layers, layer_fragment_sizes, chain_k):
#     '''
#     Generate impactful chains starting from channels in a layer to input layer
#     * input
#         - Is: influence matrices
#         - layer: starting layer
#         - channels: selected channels in the layer
#         - pred_class: predicted class
#         - all_layers: all layers
#         - k: the number of top impactful previous channels
#     * output
#         - chains: a dictionary, whose
#             - key: a layer
#             - val: a dictionary, which maps
#                 - key: a neuron in current layer
#                 - val: list of important neurons in the previous layer
#     '''

#     # Get layers starting from the given layer to the input layer
#     start_idx, end_idx = all_layers.index(layer), all_layers.index('mixed3a')
#     target_layers = all_layers[start_idx: end_idx - 1: -1]

#     # Initialize the chains
#     chains = {}

#     # Aggregate the chains across layers
#     curr_channels = channels[:]
#     for curr_layer in target_layers:
#         chains[curr_layer] = []
#         agg_prev_channels = []

#         for curr_channel in curr_channels:
#             prev_channels, prev_infs = get_top_prevs(Is, curr_layer, curr_channel, pred_class, layer_fragment_sizes[curr_layer], chain_k)
#             curr_channel_dict = {'channel': curr_channel, 'prev_channels': []}
#             for prev_c, prev_inf in zip(prev_channels, prev_infs):
#                 curr_channel_dict['prev_channels'].append({'prev_channel': prev_c, 'inf': prev_inf})
#             chains[curr_layer].append(curr_channel_dict)
#             agg_prev_channels += prev_channels
#         curr_channels = agg_prev_channels[:]

#     return chains


def get_top_prevs(I_layers, layer, channel, pred_class, layer_channels, k):
    '''
    Get top impactful channels in previous layer
    * input
        - I_layers: a dictionary for influence matrices for the layer
            - key: layer
            - val: influence matrix of the layer
        - layer: the name of layer
        - channel: channel in the layer
        - pred_class: the predicted class
        - k: the number of top impactful previous channels
    * output
        - top_prev_channels: top k impactful previous channels
        - top_prev_infs: influences of the top k impactful previous channels
    '''

    # Get influences
    infs = I_layers[layer][pred_class][channel]

    # Get top k previous channels
    top_prev_channels = sorted(infs, key=infs.get, reverse=True)[:k]
    top_prev_infs = [infs[c] for c in top_prev_channels]
    top_prev_channels = [int(c) for c in top_prev_channels]

    # Figure out which branch is connected to the channel
    branch = get_branch(layer, channel, layer_channels)

    # If the branch goes through inner layers
    if branch in [1, 2]:
        inner_layer = '{}_{}'.format(layer, branch)
        inf_inner = I_layers[inner_layer][pred_class]
        top_infs = defaultdict(lambda: 0)

        for prev_channel in top_prev_channels:
            prev_infs = inf_inner[prev_channel]
            for prev_prev_channel in prev_infs.keys():
                top_infs[prev_prev_channel] += prev_infs[prev_prev_channel]
        top_prev_prev_channels = sorted(top_infs, key=top_infs.get, reverse=True)[:k]
        top_prev_prev_infs = [top_infs[c] for c in top_prev_prev_channels]
        top_prev_prev_channels = [int(c) for c in top_prev_prev_channels]

        return top_prev_prev_channels, top_prev_prev_infs

    else:
        return top_prev_channels, top_prev_infs


def get_branch(layer, channel, layer_channels):
    '''
    Get branch of the channel in the layer
    * input
        - layer: the name of layer
        - channel: channel in the layer
        - layer_channels: fragment sizes of the layer
    * output
        - branch: branch of the channel
    '''

    channels = layer_channels[:]
    for i in range(len(channels) - 1):
        channels[i + 1] += channels[i]

    branch = np.searchsorted(channels, channel, side='right')

    return branch

def gen_I_matrix(layer, k, googlenet, batch, input_dir_path, mixed_layers, layer_sizes, act_sizes, layer_fragment_sizes, outlier_nodes, num_class):
    '''
    Generate I matrix for the given layer
    * input
        - layer: the name of layer (e.g., 'mixed3a', 'mixed3a_1')
    '''

    # Time checker
    start_time = time()

    # Get previous layer
    mixed_layer = layer.split('_')[0]
    prev_layer = get_prev_layer(mixed_layers, mixed_layer)

    # Outlier neurons in the layer
    outliers = [int(n.split('-')[1]) for n in outlier_nodes if layer in n]

    # Initiaize I matrix
    I_layer = init_I_mat(layer, layer_sizes, act_sizes, num_class)

    # Get file paths
    # file_paths = glob.glob('{}/*'.format(input_dir_path))
    file_paths = glob.glob('{}/train-00000-of-01024'.format(input_dir_path))

    # Get I-matrix
    with tf.Graph().as_default():

        # Define parsed dataset tensor
        dataset = tf.data.TFRecordDataset(file_paths)
        dataset = dataset.map(_parse_function)
        dataset = dataset.map(lambda img, lab, syn: (preprocess_input(img), lab, syn))
        dataset = dataset.batch(batch)

        # Define iterator through the datasets
        iterator = dataset.make_one_shot_iterator()
        t_preprocessed_images, t_labels, t_synsets = iterator.get_next()

        # Define actiavtion map render
        T = render.import_model(googlenet, t_preprocessed_images, None)

        # Get weight tensors
        t_w0, t_w1, t_w2, t_w3, t_w4, t_w5 = get_weight_tensors(mixed_layer)

        # Get intermediate layers' activation tensors
        t_a0, t_a1, t_a2 = get_intermediate_layer_tensors(prev_layer, mixed_layer)

        print(layer)
        print(t_a0.shape, t_w0.shape)

        # Define intermediate depthwise conv output tensors
        t_inf_0 = get_infs(t_a0, t_w0)
        t_inf_1 = get_infs(t_a1, t_w2)
        t_inf_2 = get_infs(t_a2, t_w4)
        t_inf_3 = get_infs(t_a0, t_w5)
        t_inf_4 = get_infs(t_a0, t_w1)
        t_inf_5 = get_infs(t_a0, t_w3)

        # Run with batch
        progress_counter = 0
        with tf.Session() as sess:

            try:
                with tqdm.tqdm(total=1281167, unit='imgs') as pbar:

                    while(True):
                        progress_counter += 1

                        # Run the session
                        if is_mixed:
                            labels, inf_0, inf_1, inf_2, inf_3 = \
                                sess.run([t_labels, t_inf_0, t_inf_1, t_inf_2, t_inf_3])

                        elif branch == 1:
                            labels, inf_4 = sess.run([t_labels, t_inf_4])

                        elif branch == 2:
                            labels, inf_5 = sess.run([t_labels, t_inf_5])

                        '''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''
                        no sess.run after this!
                        python code here on out
                        '''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

                        '''
                        Add up the counts (the number of images that pass through each edge)
                        '''

                        # If the target layer is mixed_*.
                        if is_mixed:

                            # Get sizes of each fragment
                            a_sz = act_sizes[mixed_layer]
                            f_sz = layer_fragment_sizes[mixed_layer]
                            frag_sz = [f_sz[0], f_sz[1], f_sz[2], f_sz[3], a_sz[1], a_sz[2]]

                            # Update I matrix
                            channel = 0
                            for frag, inf in enumerate([inf_0, inf_1, inf_2, inf_3]):
                                channel = update_I(layer, inf, channel, I_layer, labels, frag_sz[frag], k, outliers)

                        # If the target layer is branch_1
                        elif branch == 1:
                            update_I(layer, inf_4, 0, I_layer, labels, frag_sz[4], k, outliers)

                        # If the target layer is branch_2
                        elif branch == 2:
                            update_I(layer, inf_5, 0, I_layer, labels, frag_sz[5], k, outliers)

                        pbar.update(len(labels))

                        # print(inf_0.shape, inf_1.shape, inf_2.shape, inf_3.shape, inf_4.shape, inf_5.shape)

            except tf.errors.OutOfRangeError:
                pass

            # Save I_layer
            with open(I_mat_dirpath + 'I_%s.json' % layer, 'w') as f:
                json.dump(I_layer, f, indent=2)

            end = time.time()

            print(end - start)
            print(progress_counter)
            print(progress_counter * batch)

    return I_layer

# def generate_save_chain(pred_class, all_layers, I_mat_dirpath, chain_dirpath, channels, layer_fragment_sizes, chain_k):
#     '''
#     * input
#         - channels: starting channels in mixed5b
#     '''
#     # Get layers starting from the given layer to the input layer
#     start_idx, end_idx = all_layers.index('mixed5b'), all_layers.index('mixed3a')
#     target_layers = all_layers[start_idx: end_idx - 1: -1]

#     # Load I matrices
#     Is = {}
#     for layer in target_layers:
#         print('loading ', layer)
#         Is[layer] = load_inf_matrix(I_mat_dirpath, layer)
#         for branch in [1, 2]:
#             inner_layer = '{}_{}'.format(layer, branch)
#             Is[inner_layer] = load_inf_matrix(I_mat_dirpath, inner_layer)

#     # Get chains
#     chains = gen_impactful_chains(Is, 'mixed5b', channels, pred_class, all_layers, layer_fragment_sizes, chain_k)

#     # Save chains
#     filename = chain_dirpath + 'chain_{}.json'.format(pred_class)
#     with open(filename, 'w') as f:
#         json.dump(chains, f, indent=2)


if __name__ == '__main__':
    main()

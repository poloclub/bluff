'''
Massif: Project title
File name: A_matrix.py
Author: Haekyu Park
Date: Nov 13, 2019

This code generates attribution graph.
'''

import json
import networkx as nx
import model_helper
import I_matrix

def gen_full_graph(args, A, I):

    # Initialize an undirected graph
    G = nx.Graph()

    # Get layers
    layers = args.layers
    layer_sizes = args.layer_sizes

    # Add nodes from A
    for layer in layers[::-1]:
        # For all neurons in the currrent layer
        for neuron in range(layer_sizes[layer]):
            # Make source node id
            src = gen_node_name(layer, neuron)

            # Add the node
            node_weight = A[layer][neuron]
            G.add_node(src, weight=node_weight)

    # Add edges from I
    for layer_idx, layer in enumerate(layers[::-1][:-1]):

        # Get previous layer
        prev_layer = layers[::-1][layer_idx + 1]

        # For all neurons in the currrent layer
        for neuron in range(layer_sizes[layer]):

            # Make source node id
            src = gen_node_name(layer, neuron)

            # Get the block the neuron belongs to
            blk = model_helper.get_blk_of_neuron(args, layer, neuron)
            layer_key = '{}_{}'.format(layer, blk)
            neuron_th_in_blk = neuron - model_helper.get_num_neurons_in_prev_blks(args, layer, neuron)

            # Get the influences for the block
            I_blk = I[layer_key]

            # Get the number of previous neurons
            num_prev_neurons = I_blk.shape[-1]

            # If the neuron is connected to an intermediate layer
            if blk in [1, 2]:

                # Get I-matrix between the intermediate layer and prev_layer
                if blk == 1:
                    inter_layer_key = '{}_{}'.format(layer, 4)
                elif blk == 2:
                    inter_layer_key = '{}_{}'.format(layer, 5)
                I_inter = I[inter_layer_key]

                # Get the number of previous neurons
                num_prev_prev_neurons = I_inter.shape[-1]

                # Get all possible edge weights between
                #  the neuron in current layer and ones in prev_layer
                neuron_edges = {}
                for prev_neuron in range(num_prev_neurons):
                    inf = I_blk[neuron_th_in_blk][prev_neuron]
                    for prev_prev_neuron in range(num_prev_prev_neurons):
                        prev_inf = I_inter[prev_neuron][prev_prev_neuron]
                        if prev_prev_neuron not in neuron_edges:
                            neuron_edges[prev_prev_neuron] = []
                        neuron_edges[prev_prev_neuron].append(min(inf, prev_inf))

                # For given a neuron in the prev_layer,
                #  choose only one weight that has the maximum weights
                #  between the previous neuron and the current neuron
                for prev_prev_neuron in neuron_edges:
                    max_inf = max(neuron_edges[prev_prev_neuron])
                    tgt = gen_node_name(prev_layer, prev_prev_neuron)
                    G.add_edge(src, tgt, weight=max_inf)

            # If the neuron is directly connected to the previous layer
            elif blk in [0, 3]:
                num_prev_neurons = I_blk.shape[-1]
                for prev_neuron in range(num_prev_neurons):
                    inf = I_blk[neuron_th_in_blk][prev_neuron]
                    tgt = gen_node_name(prev_layer, prev_neuron)
                    G.add_edge(src, tgt, weight=inf)
            else:
                err_msg = 'ERROR: Cannot get the block of '
                err_msg += 'neuron ({}) in ({}).'.format(neuron, layer)
                err_msg += 'The block is expected to be in [0, 1, 2, 3], '
                err_msg += 'but {} is given.'.format(blk)
                print(err_msg)

    return G


def gen_node_name(layer, neuron):
    return layer + '-' + str(neuron)


def I_from_summit_to_massif(args, I_mat_summit_dir_path, correct_class, misclassified_class):

    # Initialize Is_correct_class and Is_mis_class
    Is_correct_class = I_matrix.init_I_summit_to_massif(args)
    Is_mis_class = I_matrix.init_I_summit_to_massif(args)

    # I_matrix for {layer}_{0, 1, 2, 3}
    for layer in args.layers:

        # Ignore mixed3a
        if layer == 'mixed3a':
            continue

        # Read summit I matrix
        I_mat_file_path = '{}/I_{}{}.json'.format(I_mat_summit_dir_path, layer, '')
        with open(I_mat_file_path) as f:
            I_mat = json.load(f)

        # For blk 0, 1, 2, 3
        start_neuron = 0
        for blk in range(4):

            layer_key = '{}_{}'.format(layer, blk)
            num_neurons_in_this_blk = args.layer_blk_sizes[layer_key]

            for neuron, link in enumerate(I_mat[correct_class][start_neuron: start_neuron + num_neurons_in_this_blk]):

                for prev_neuron in link:
                    inf = link[prev_neuron]
                    Is_correct_class[layer_key][neuron, int(prev_neuron)] = inf

            for neuron, link in enumerate(I_mat[misclassified_class][start_neuron: start_neuron + num_neurons_in_this_blk]):
                for prev_neuron in link:
                    inf = link[prev_neuron]
                    Is_mis_class[layer_key][neuron, int(prev_neuron)] = inf

            start_neuron += num_neurons_in_this_blk

    # I_matrix for {layer}_4
    for layer in args.layers:

        # Ignore mixed3a
        if layer == 'mixed3a':
            continue

        layer_key = '{}_{}'.format(layer, 4)

        I_mat_file_path = '{}/I_{}{}.json'.format(I_mat_summit_dir_path, layer, '_1')
        with open(I_mat_file_path) as f:
            I_mat = json.load(f)

        for neuron, link in enumerate(I_mat[correct_class]):
            for prev_neuron in link:
                inf = link[prev_neuron]
                Is_correct_class[layer_key][neuron, int(prev_neuron)] = inf

        for neuron, link in enumerate(I_mat[misclassified_class]):
            for prev_neuron in link:
                inf = link[prev_neuron]
                Is_mis_class[layer_key][neuron, int(prev_neuron)] = inf

    # I_matrix for {layer}_5
    for layer in args.layers:

        # Ignore mixed3a
        if layer == 'mixed3a':
            continue

        layer_key = '{}_{}'.format(layer, 5)

        I_mat_file_path = '{}/I_{}{}.json'.format(I_mat_summit_dir_path, layer, '_2')
        with open(I_mat_file_path) as f:
            I_mat = json.load(f)

        for neuron, link in enumerate(I_mat[correct_class]):
            for prev_neuron in link:
                inf = link[prev_neuron]
                Is_correct_class[layer_key][neuron, int(prev_neuron)] = inf

        for neuron, link in enumerate(I_mat[misclassified_class]):
            for prev_neuron in link:
                inf = link[prev_neuron]
                Is_mis_class[layer_key][neuron, int(prev_neuron)] = inf

    return Is_correct_class, Is_mis_class

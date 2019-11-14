'''
Massif: Project title
File name: A_matrix.py
Author: Haekyu Park
Date: Nov 13, 2019

This code generates attribution graph.
'''

import networkx as nx
import model_helper

def gen_full_graph(args, A, I):

    # Initialize an undirected graph
    G = nx.Graph()

    # Get layers
    layers = args.layers
    layer_sizes = args.layer_sizes

    for layer_idx, layer in enumerate(layers[::-1][:-1]):

        # Get previous layer
        prev_layer = layers[::-1][layer_idx + 1]

        # For all neurons in the currrent layer
        for neuron in range(layer_sizes[layer]):

            # Get the block the neuron belongs to
            blk = get_blk_of_neuron(args, layer, neuron)
            layer_key = '{}_{}'.format(layer, blk)
            neuron_th_in_blk = get_num_neurons_in_prev_blks

            # Get the influences for the block
            I_blk = I[layer_key]

            # If the neuron is connected to an intermediate layer
            if branch in [1, 2]:
                # TODO XXXXXX
                dfdfdfdfdfdf
            # If the neuron is directly connected to the previous layer
            elif branch in [0, 3]:
                num_prev_neurons = I_blk.shape[-1]
                for prev_neuron in range(num_prev_neurons):
                    inf = I_blk[neuron_th_in_blk][prev_neuron]
                    # TODO XXXXXX
            else:
                err_msg = 'ERROR: Cannot get the block of '
                err_msg += 'neuron ({}) in ({}).'.format(neuron, layer)
                err_msg += 'The block is expected to be in [0, 1, 2, 3], '
                err_msg += 'but {} is given.'.format(blk)
                print(err_msg)
    return G

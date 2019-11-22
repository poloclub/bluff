'''
Massif: Project title
File name: A_matrix.py
Author: Haekyu Park
Date: Oct 22, 2019

This code includes helper functions to generate A-matrix.
'''

import numpy as np
import tensorflow as tf


def gen_reduce_max_tensors(layers, T):
    '''
    Generate reduce max tensors for all layers
    * input
        - layers: the list of layers
        - T: activation map render
    * output
        - t_act_maxs: tensor of reduced max of activation map
    '''

    t_act_maxs = []

    for layer in layers:
        t_act = T(layer)
        t_act_max = tf.math.reduce_max(t_act, axis=[1, 2])
        t_act_maxs.append(t_act_max)

    return t_act_maxs


def init_A_matrices(args):
    '''
    Initialize A matrices
    * input:
        - args: parsed arguments
    * output
        - As: a dictionary, where
            - key: layer's name in string (e.g., "mixed3a")
            - val: 0-matrix (np.array(dtype=int))
                   of shape (#class, #neurons in the layer)
    '''

    # Get layer information
    layers = args.layers
    layer_sizes = args.layer_sizes
    num_classes = args.num_classes

    # Initialize A matrices
    As = {}
    for layer in layers:
        num_of_neurons = layer_sizes[layer]
        A = np.zeros([num_classes, num_of_neurons], dtype=int)
        As[layer] = A

    return As


def init_A_matrix_single_image(args):
    '''
    Initialize A matrix for a single input image
    * input:
        - args: parsed arguments
    * output
        - A: a dictionary, where
            - key: layer's name in string (e.g., "mixed3a")
            - val: 0-array, whose length is the number of neurons in the layer
    '''

    # Get layer information
    layers = args.layers
    layer_sizes = args.layer_sizes

    # Initialize A matrix
    A = {}
    for layer in layers:
        num_of_neurons = layer_sizes[layer]
        A[layer] = np.zeros(num_of_neurons)

    return A

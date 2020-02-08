'''
Massif: Interactive Interpretation of Adversarial Attacks on Deep Learning
File name: model_helper.py
Author: Haekyu Park
Date: Nov 22, 2019

This code includes helper functions to use InceptionV1 model.
'''

import numpy as np
import tensorflow as tf
import lucid.optvis.render as render


def get_predictions(model, imgs):
    '''
    Get classification predictions for imgs.
    * input
        - model: the classification model
        - imgs: the input imgs
    * output
        - prediction: the predicted classes for imgs
        - output: the output vector in the last layer in model
    '''
    output = get_activation_map(model, imgs, 'output2')
    prediction = np.argmax(output, 1)
    return prediction, output


def get_activation_map(model, imgs, layer):
    '''
    Get activation map
    * input
        - model: the classification model
        - imgs: the input imgs
        - layer: the layer name
    * output
        - act_map: the activagtion maps in the layer for imgs
    '''

    with tf.Graph().as_default(), tf.compat.v1.Session():
        t_input = tf.compat.v1.placeholder(tf.float32, [None, 224, 224, 3])
        T = render.import_model(model, t_input, None)
        act_map = T(layer).eval({t_input: imgs})

    return act_map


def get_all_layers_activation_score(model, imgs, layers, method='reduce_max'):
    '''
    Get all layers' activation score (in R^1) of all neuron.
    The activation score for a neuron (from R^2 to R^1) is currently
    defined as the reduced max of the activation map of the nueron.
    * input
        - model: the classification model
        - imgs: the input imgs
        - layers: all layers
    * output
        - act_scores: the activation scores of all neurons in all layers.
            This is a dictionary, where
                - key: a layer
                - val: a list of shape (# imgs, # neurons in the layer).
                       It includes the activation scores of all neurons
                       in the layer for all input images.
    '''

    act_scores = {layer: [] for layer in layers}
    with tf.Graph().as_default(), tf.compat.v1.Session():
        t_input = tf.compat.v1.placeholder(tf.float32, [None, 224, 224, 3])
        T = render.import_model(model, t_input, t_input)
        for layer in layers:
            t_act_map = T(layer)
            if method == 'reduce_max':
                t_act_score = tf.math.reduce_max(t_act_map, axis=[1, 2])
            act_score = t_act_score.eval({t_input: imgs})
            act_scores[layer] = act_score

    return act_scores


def get_weight_tensors(layer):
    '''
    Get weight tensors for the given layer in the inceptionV1 model
    * input
        - layer: the name of the layer in string (e.g., 'mixed3a')
    * output
        - t_w_1x1: the tensor of {layer}_1x1_w:0
        - t_w_3x3_b: the tensor of {layer}_3x3_bottleneck_w:0
        - t_w_3x3: the tensor of {layer}_3x3_w:0
        - t_w_5x5_b: the tensor of {layer}_5x5_bottleneck_w:0
        - t_w_5x5: the tensor of {layer}_5x5_w:0
        - t_w_pool_reduce: the tensor of {layer}_pool_reduce_w:0
    '''

    # Get weight tensors
    t_w_1x1 = tf.compat.v1.get_default_graph().get_tensor_by_name('import/%s_1x1_w:0' % layer)
    t_w_3x3_btl = tf.compat.v1.get_default_graph().get_tensor_by_name('import/%s_3x3_bottleneck_w:0' % layer)
    t_w_3x3 = tf.compat.v1.get_default_graph().get_tensor_by_name('import/%s_3x3_w:0' % layer)
    t_w_5x5_btl = tf.compat.v1.get_default_graph().get_tensor_by_name('import/%s_5x5_bottleneck_w:0' % layer)
    t_w_5x5 = tf.compat.v1.get_default_graph().get_tensor_by_name('import/%s_5x5_w:0' % layer)
    t_w_pool_reduce = tf.compat.v1.get_default_graph().get_tensor_by_name('import/%s_pool_reduce_w:0' % layer)

    return t_w_1x1, t_w_3x3_btl, t_w_3x3, t_w_5x5_btl, t_w_5x5, t_w_pool_reduce


def get_layer_block_tensors(prev_layer, layer):
    '''
    Get layer block tensors
    * input
        - prev_layer: the previous layer given in string (e.g., 'mixed3a')
        - layer: the current layer given in string (e.g., 'mixed3b')
    * output
        - t_l_input: the tensor of the previous layer
        - t_l_3x3: the tensor of the first branch block (3x3 bottleneck)
        - t_l_5x5: the tensor for the second branch block (5x5 bottleneck)
    '''

    # Get intermediate layer tensors
    t_l_input = tf.compat.v1.get_default_graph().get_tensor_by_name('import/%s:0' % prev_layer)
    t_l_3x3 = tf.compat.v1.get_default_graph().get_tensor_by_name('import/%s_3x3_bottleneck:0' % layer)
    t_l_5x5 = tf.compat.v1.get_default_graph().get_tensor_by_name('import/%s_5x5_bottleneck:0' % layer)
    return t_l_input, t_l_3x3, t_l_5x5


def get_depthwise_activation_map(args, model, img, layer, neuron):

    # Get previous layer
    prev_layer = args.layers[args.layers.index(layer) - 1]

    # Get previous layer's activation map
    prev_act_map = get_activation_map(model, [img], layer)
    prev_act_map = prev_act_map[0]

    # Get the filter for the corresponding neuron
    # ??




def get_all_layers_activation_map(model, imgs, layers):

    act_maps = {layer: [] for layer in layers}
    with tf.Graph().as_default(), tf.compat.v1.Session():
        t_input = tf.compat.v1.placeholder(tf.float32, [None, 224, 224, 3])
        T = render.import_model(model, t_input, None)
        for layer in layers:
            act_map = T(layer).eval({t_input: imgs})
            act_maps[layer] = act_map

    return act_maps


def get_blk_of_neuron(args, layer, neuron):
    blk_sizes = args.layer_blk_sizes
    num_neurons = 0
    for i in range(4):
        num_neurons += blk_sizes['{}_concat_{}'.format(layer, i)]
        if neuron < num_neurons:
            return i
    return 4


def get_num_neurons_in_prev_blks(args, layer, neuron):
    blk_sizes = args.layer_blk_sizes
    num_neurons = 0
    for i in range(4):
        num_neurons += blk_sizes['{}_concat_{}'.format(layer, i)]
        if neuron < num_neurons:
            break
    num_neurons -= blk_sizes['{}_concat_{}'.format(layer, i)]
    return num_neurons

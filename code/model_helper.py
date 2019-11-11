'''
Massif: Project title
File name: model_helper.py
Author: Haekyu Park
Date: Nov 6, 2019

This code includes helper functions to use InceptionV1 model.
'''

import numpy as np
import tensorflow as tf
import lucid.optvis.render as render


def get_predictions(model, imgs):
    output = get_activation_map(model, imgs, 'output2')
    return np.argmax(output, 1), output


def get_depthwise_activation_map(args, model, img, layer, neuron):

    # Get previous layer
    prev_layer = args.layers[args.layers.index(layer) - 1]

    # Get previous layer's activation map
    prev_act_map = get_activation_map(model, [img], layer)
    prev_act_map = prev_act_map[0]

    # Get the filter for the corresponding neuron



def get_activation_map(model, imgs, layer):

    with tf.Graph().as_default(), tf.Session():
        t_input = tf.compat.v1.placeholder(tf.float32, [None, 224, 224, 3])
        T = render.import_model(model, t_input, None)
        act_map = T(layer).eval({t_input: imgs})

    return act_map


def get_all_layers_activation_map(model, imgs, layers):

    act_maps = {layer: [] for layer in layers}
    with tf.Graph().as_default(), tf.Session():
        t_input = tf.compat.v1.placeholder(tf.float32, [None, 224, 224, 3])
        T = render.import_model(model, t_input, None)
        for layer in layers:
            act_map = T(layer).eval({t_input: imgs})
            act_maps[layer] = act_map

    return act_maps


def get_all_layers_activation_score(model, imgs, layers):

    act_scores = {layer: [] for layer in layers}
    with tf.Graph().as_default(), tf.Session():
        t_input = tf.placeholder(tf.float32, [None, 224, 224, 3])
        T = render.import_model(model, t_input, t_input)
        for layer in layers:
            t_act_map = T(layer)
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
        - t_w0: the tensor of {layer}_1x1_w:0
        - t_w1: the tensor of {layer}_3x3_bottleneck_w:0
        - t_w2: the tensor of {layer}_3x3_w:0
        - t_w3: the tensor of {layer}_5x5_bottleneck_w:0
        - t_w4: the tensor of {layer}_5x5_w:0
        - t_w5: the tensor of {layer}_pool_reduce_w:0
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
    '''
    Get intermediate (branched) layer tensors
    * input
        - prev_layer: the previous layer given in string (e.g., 'mixed3a')
        - layer: the current layer given in string (e.g., 'mixed3b')
    * output
        - t_a0: the tensor of the previous layer
        - t_a1: the tensor of the first branch (3x3 bottleneck)
        - t_a2: the tensor for the second branch (5x5 bottleneck)
    '''

    # Get intermediate layer tensors
    t_a0 = tf.get_default_graph().get_tensor_by_name('import/%s:0' % prev_layer)
    t_a1 = tf.get_default_graph().get_tensor_by_name('import/%s_3x3_bottleneck:0' % layer)
    t_a2 = tf.get_default_graph().get_tensor_by_name('import/%s_5x5_bottleneck:0' % layer)
    return t_a0, t_a1, t_a2


def get_blk_of_neuron(args, layer, neuron):
    blk_sizes = args.layer_blk_sizes
    num_neurons = 0
    for i in range(4):
        num_neurons += blk_sizes['{}_{}'.format(layer, i)]
        if neuron < num_neurons:
            return i
    return 4

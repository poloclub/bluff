'''
Massif: Project title
File name: A_matrix.py
Author: Haekyu Park
Date: Oct 18, 2019

This code includes helper functions to generate A-matrix.
'''

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
        t_act = T(layer) # layer = 'mixed3a'..
        t_act_max = tf.math.reduce_max(t_act, axis=[1, 2])
        t_act_maxs.append(t_act_max)

    return t_act_maxs

'''
Massif: Project title
File name: I_matrix.py
Author: Haekyu Park
Date: Nov 22, 2019

This code generates I-matrix (the matrix of influences between layers).
'''

import numpy as np
import tensorflow as tf
import model_helper


def init_I(args):
    '''
    Initialize I matrix
    * input
        - args: the parsed hyperparameters and constants
    * output
        - I: an initialized I-matrix, whose
            - key: a block in a layer (e.g., 'mixed3b_concat_0')
            - val: an empty 2d matrix (i.e., [[]])
    '''

    I = {}
    for layer in args.layers:
        if layer == 'mixed3a':
            continue
        for blk_header in args.blk_headers:
            I['{}_{}'.format(layer, blk_header)] = [[]]
    return I


def gen_I(influences, num_neurons):
    '''
    Generate an I-matrix with influences and num_neurons
    * input
        - influences: influence values
        - num_neurons: number of neurons of current layer
    * output
        - I: I matrix
    '''

    # Initialize the I matrix
    num_prev_neurons = int(influences.shape[-1] / num_neurons)
    I = np.zeros([num_neurons, num_prev_neurons])

    # Fill out the I matrix
    for neuron in range(num_neurons):
        # Get indices to extract current neuron's influences
        influence_indices = [i * num_neurons + neuron for i in range(num_prev_neurons)]

        # Extract influences corresponded to the current neuron
        influence_of_neuron = influences[influence_indices]

        # Save the influences
        I[neuron] = influence_of_neuron

    return I


def gen_aggregated_I_matrix(args, imgs, model):
    '''
    Generate I matrix of all layers for all input images.
    * input
        - args: the parsed hyperparameters and constants
        - imgs: input images
        - model: model
    * output
        - Is: I-matrices of all layers for all input images
    '''

    # Initialize I-matrix for all input images
    I = init_I(args)

    # Generate I-matrix
    with tf.Graph().as_default():
        # Import the model
        t_input = tf.compat.v1.placeholder(tf.float32, [None, 224, 224, 3])
        model.import_graph(t_input)

        # Gereate I-matrix for each layer
        for i, layer in enumerate(args.layers):

            # Skip the first layer, since we do dot care
            #  any connection with the previous neurons
            if layer == 'mixed3a':
                continue

            # Get layers' size
            prev_layer = args.layers[i - 1]

            # Get weight tensors
            t_w_1x1, t_w_3x3_btl, t_w_3x3, t_w_5x5_btl, t_w_5x5, t_w_pool_reduce \
                = model_helper.get_weight_tensors(layer)

            # Get layer block tensors
            t_l_input, t_l_3x3, t_l_5x5 \
                = model_helper.get_layer_block_tensors(prev_layer, layer)

            # Define influence
            t_inf_concat_0 = get_infs(t_l_input, t_w_1x1)
            t_inf_concat_1 = get_infs(t_l_3x3, t_w_3x3)
            t_inf_concat_2 = get_infs(t_l_5x5, t_w_5x5)
            t_inf_concat_3 = get_infs(t_l_input, t_w_pool_reduce)
            t_inf_3x3_btl = get_infs(t_l_input, t_w_3x3_btl)
            t_inf_5x5_btl = get_infs(t_l_input, t_w_5x5_btl)

            # Open the session
            with tf.Session() as sess:

                # Get the influence values
                infs = sess.run(
                        [t_inf_concat_0, t_inf_concat_1, t_inf_concat_2, \
                            t_inf_concat_3, t_inf_3x3_btl, t_inf_5x5_btl],
                        feed_dict={t_input: imgs}
                    )

                # Save the influence values
                for img_th, img in enumerate(imgs):
                    for blk_th, blk_header in enumerate(args.blk_headers):
                        blk = '{}_{}'.format(layer, blk_header)
                        median_infs = np.median(infs[blk_th], axis=0)
                        I[blk] = gen_I(median_infs, args.layer_blk_sizes[blk])

    return I


def gen_single_I_matrices(args, imgs, model):
    '''
    Generate I-matrices of all layers for each input image
    * input
        - args: the parsed hyperparameters and constants
        - imgs: input images
        - model: model
    * output
        - Is: I-matrices of all layers for all input images
    '''

    # Initialize I-matrices for all input images
    Is = {}
    for i in range(len(imgs)):
        Is[i] = init_I(args)

    # Generate I-matrices
    with tf.Graph().as_default():
        # Import the model
        t_input = tf.compat.v1.placeholder(tf.float32, [None, 224, 224, 3])
        model.import_graph(t_input)

        # Gereate I-matrix for each layer
        for i, layer in enumerate(args.layers):

            # Skip the first layer, since we do dot care
            #  any connection with the previous neurons
            if layer == 'mixed3a':
                continue

            # Get layers' size
            prev_layer = args.layers[i - 1]

            # Get weight tensors
            t_w_1x1, t_w_3x3_btl, t_w_3x3, t_w_5x5_btl, t_w_5x5, t_w_pool_reduce \
                = model_helper.get_weight_tensors(layer)

            # Get layer block tensors
            t_l_input, t_l_3x3, t_l_5x5 \
                = model_helper.get_layer_block_tensors(prev_layer, layer)

            # Define influence
            t_inf_concat_0 = get_infs(t_l_input, t_w_1x1)
            t_inf_concat_1 = get_infs(t_l_3x3, t_w_3x3)
            t_inf_concat_2 = get_infs(t_l_5x5, t_w_5x5)
            t_inf_concat_3 = get_infs(t_l_input, t_w_pool_reduce)
            t_inf_3x3_btl = get_infs(t_l_input, t_w_3x3_btl)
            t_inf_5x5_btl = get_infs(t_l_input, t_w_5x5_btl)

            # Open the session
            with tf.Session() as sess:

                # Get the influence values
                infs = sess.run(
                        [t_inf_concat_0, t_inf_concat_1, t_inf_concat_2, \
                            t_inf_concat_3, t_inf_3x3_btl, t_inf_5x5_btl],
                        feed_dict={t_input: imgs}
                    )

                # Save the influence values
                for img_th, img in enumerate(imgs):
                    for blk_th, blk_header in enumerate(args.blk_headers):
                        blk = '{}_{}'.format(layer, blk_header)
                        I = gen_I(infs[blk_th][img_th], args.layer_blk_sizes[blk])
                        Is[img_th][blk] = I

    return Is


def get_infs(t_l, t_w):
    '''
    Get inference scores, which is the reduce max of all depthwise convolution output
    * Input
        - t_l: the layer block tensor
        - t_w: the weight tensor
    * output
        - inf_scores: reduced max of depthwise convolution.
    '''

    inf_scores = tf.math.reduce_max(
                    tf.nn.depthwise_conv2d(t_l, t_w, [1, 3, 3, 1], 'SAME'),
                    [1, 2]
                )

    return inf_scores


def init_I_summit_to_massif(args):
    I = {}
    for layer in args.layers:
        if layer == 'mixed3a':
            continue

        prev_layer = args.layers[args.layers.index(layer) - 1]

        # inf-0
        num_curr_neurons = args.layer_blk_sizes['{}_{}'.format(layer, 0)]
        num_prev_neurons = args.layer_sizes[prev_layer]
        I['{}_0'.format(layer)] = np.zeros((num_curr_neurons, num_prev_neurons))

        # inf-1
        num_curr_neurons = args.layer_blk_sizes['{}_{}'.format(layer, 1)]
        num_prev_neurons = args.layer_blk_sizes['{}_{}'.format(layer, 4)]
        I['{}_1'.format(layer)] = np.zeros((num_curr_neurons, num_prev_neurons))

        # inf-2
        num_curr_neurons = args.layer_blk_sizes['{}_{}'.format(layer, 2)]
        num_prev_neurons = args.layer_blk_sizes['{}_{}'.format(layer, 5)]
        I['{}_2'.format(layer)] = np.zeros((num_curr_neurons, num_prev_neurons))

        # inf-3
        num_curr_neurons = args.layer_blk_sizes['{}_{}'.format(layer, 3)]
        num_prev_neurons = args.layer_sizes[prev_layer]
        I['{}_3'.format(layer)] = np.zeros((num_curr_neurons, num_prev_neurons))

        # inf-4
        num_curr_neurons = args.layer_blk_sizes['{}_{}'.format(layer, 4)]
        num_prev_neurons = args.layer_sizes[prev_layer]
        I['{}_4'.format(layer)] = np.zeros((num_curr_neurons, num_prev_neurons))

        # inf-5
        num_curr_neurons = args.layer_blk_sizes['{}_{}'.format(layer, 5)]
        num_prev_neurons = args.layer_sizes[prev_layer]
        I['{}_5'.format(layer)] = np.zeros((num_curr_neurons, num_prev_neurons))

    return I

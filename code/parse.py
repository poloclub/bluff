'''
Massif: Project title
File name: parse.py
Author: Haekyu Park
Date: Nov 5, 2019

This code parses arguments and constants.
'''

import argparse

def parse_args():
    '''
    Parse arguments and pass as arguments object. You might not be able to use
    this function in jupyter notebook.
    * input: N/A
    * output:
        - args: the parsed hyperparameters and constants
    '''


    '''
    Define the parser
    '''
    parser = argparse.ArgumentParser('Massif')


    '''
    Define constants
    '''
    # Layer info
    layer_sizes = {
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
    layer_blk_sizes = {
        # mixed 3b
        'mixed3b_0': 128,
        'mixed3b_1': 192,
        'mixed3b_2': 96,
        'mixed3b_3': 64,
        'mixed3b_4': 128,
        'mixed3b_5': 32,
        # mixed 4a
        'mixed4a_0': 192,
        'mixed4a_1': 208,
        'mixed4a_2': 48,
        'mixed4a_3': 64,
        'mixed4a_4': 96,
        'mixed4a_5': 16,
        # mixed 4b
        'mixed4b_0': 160,
        'mixed4b_1': 224,
        'mixed4b_2': 64,
        'mixed4b_3': 64,
        'mixed4b_4': 112,
        'mixed4b_5': 24,
        # mixed 4c
        'mixed4c_0': 128,
        'mixed4c_1': 256,
        'mixed4c_2': 64,
        'mixed4c_3': 64,
        'mixed4c_4': 128,
        'mixed4c_5': 24,
        # mixed 4d
        'mixed4d_0': 112,
        'mixed4d_1': 288,
        'mixed4d_2': 64,
        'mixed4d_3': 64,
        'mixed4d_4': 144,
        'mixed4d_5': 32,
        # mixed 4e
        'mixed4e_0': 256,
        'mixed4e_1': 320,
        'mixed4e_2': 128,
        'mixed4e_3': 128,
        'mixed4e_4': 160,
        'mixed4e_5': 32,
        # mixed 5a
        'mixed5a_0': 256,
        'mixed5a_1': 320,
        'mixed5a_2': 128,
        'mixed5a_3': 128,
        'mixed5a_4': 160,
        'mixed5a_5': 32,
        # mixed 5b
        'mixed5b_0': 384,
        'mixed5b_1': 384,
        'mixed5b_2': 128,
        'mixed5b_3': 128,
        'mixed5b_4': 192,
        'mixed5b_5': 48
    }
    layers = [
        'mixed3a',
        'mixed3b',
        'mixed4a',
        'mixed4b',
        'mixed4c',
        'mixed4d',
        'mixed4e',
        'mixed5a',
        'mixed5b'
    ]
    list(layer_sizes.keys())

    # Class info
    num_of_classes = 1000


    '''
    Parse hyperparameters
    '''
    parser.add_argument('--gpu', type=int, default=0, required=True,
                        help='GPU cuda visible device')

    parser.add_argument('--batch_A', type=int, default=200, required=True,
                        help='Batch size for loading images \
                            while generating A_matrix')

    parser.add_argument('--batch_I', type=int, default=200, required=True,
                        help='Batch size for loading images \
                            while generating I_matrix')

    parser.add_argument('--layer', type=str, default='mixed3a',
                        help='The name of layer to generate I_matrix')

    parser.add_argument('--k_A', type=float, default=0.1,
                        help='Probability mass threshold for A_matrix')


    '''
    Parse constants
    '''
    parser.add_argument('--num_classes', type=int, default=1000,
                        help='The number of classes')

    parser.add_argument('--layers', type=list, default=layers,
                        help='The list of name of layers')

    parser.add_argument('--layer_sizes', type=dict, default=layer_sizes,
                        help='A dictionary that maps \
                            name of layers and their size')

    parser.add_argument('--layer_blk_sizes', type=dict, default=layer_sizes,
                        help='A dictionary that maps \
                            name of layer blocks and their size')

    parser.add_argument('--img_width', type=int, default=224,
                        help='Image width')

    parser.add_argument('--img_height', type=int, default=224,
                        help='Image height')

    # Return the parsed argument and constants
    args = parser.parse_args()

    return args


class Args:
    '''
    Define default arguments and constants. You may need to use this class
    instead of parse_args() function, if the function does not work.
    '''

    '''
    Parse hyperparameters
    '''
    # GPU cuda visible device
    gpu = 0

    # Batch size for loading images while generating A_matrix
    batch_A = 200

    # Batch size for loading images while generating I_matrix
    batch_I = 200

    # The name of layer to generate I_matrix
    layer = 'mixed3b'

    # Probability mass threshold for A_matrix
    k_A = 0.1


    '''
    Parse constants
    '''
    # Layer info
    layer_sizes = {
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
    layers = list(layer_sizes.keys())
    layer_blk_sizes = {
        # mixed 3b
        'mixed3b_0': 128,
        'mixed3b_1': 192,
        'mixed3b_2': 96,
        'mixed3b_3': 64,
        'mixed3b_4': 128,
        'mixed3b_5': 32,
        # mixed 4a
        'mixed4a_0': 192,
        'mixed4a_1': 208,
        'mixed4a_2': 48,
        'mixed4a_3': 64,
        'mixed4a_4': 96,
        'mixed4a_5': 16,
        # mixed 4b
        'mixed4b_0': 160,
        'mixed4b_1': 224,
        'mixed4b_2': 64,
        'mixed4b_3': 64,
        'mixed4b_4': 112,
        'mixed4b_5': 24,
        # mixed 4c
        'mixed4c_0': 128,
        'mixed4c_1': 256,
        'mixed4c_2': 64,
        'mixed4c_3': 64,
        'mixed4c_4': 128,
        'mixed4c_5': 24,
        # mixed 4d
        'mixed4d_0': 112,
        'mixed4d_1': 288,
        'mixed4d_2': 64,
        'mixed4d_3': 64,
        'mixed4d_4': 144,
        'mixed4d_5': 32,
        # mixed 4e
        'mixed4e_0': 256,
        'mixed4e_1': 320,
        'mixed4e_2': 128,
        'mixed4e_3': 128,
        'mixed4e_4': 160,
        'mixed4e_5': 32,
        # mixed 5a
        'mixed5a_0': 256,
        'mixed5a_1': 320,
        'mixed5a_2': 128,
        'mixed5a_3': 128,
        'mixed5a_4': 160,
        'mixed5a_5': 32,
        # mixed 5b
        'mixed5b_0': 384,
        'mixed5b_1': 384,
        'mixed5b_2': 128,
        'mixed5b_3': 128,
        'mixed5b_4': 192,
        'mixed5b_5': 48
    }

    # Class info
    num_classes = 1000

    # Image info
    img_width = 224
    img_height = 224

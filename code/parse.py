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
    layers = list(layer_sizes.keys())

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

    # Class info
    num_classes = 1000

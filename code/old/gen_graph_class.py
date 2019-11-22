# Helper libraries
import cv2
import glob
import tqdm
import json
import argparse
import numpy as np
from time import time
import tensorflow as tf
import matplotlib.pyplot as plt
from networkx.readwrite import json_graph

# GoogLeNet
import lucid.modelzoo.vision_models as models

# Libraries provided by Massif project
import parse
import A_matrix
import I_matrix
import model_helper
import gen_graph

print(tf.VERSION)

googlenet = models.InceptionV1()
googlenet.load_graphdef()
args = parse.Args

parser = argparse.ArgumentParser()
parser.add_argument('--from', type=int, default=0)
parser.add_argument('--to', type=int, default=100)
args_main = parser.parse_args()
args_main = vars(args_main)
print(args_main)

# Directory Path
A_mat_summit_dir_path = '/Users/haekyu/data/summit/A-mat'
I_mat_summit_dir_path = '/Users/haekyu/data/summit/I-mat'
graph_dir_path = '/Users/haekyu/data/massif/full-graph'

for c in range(args_main['from'], args_main['to']):
    print('class:', c)

    # Read A matrices
    tic = time()
    A_class = A_matrix.init_A_matrix_single_image(args)
    for layer in args.layers:
        A_mat_path = '{}/A-0.03-{}.csv'.format(A_mat_summit_dir_path, layer)
        A_mat = np.loadtxt(A_mat_path, delimiter=',')
        A_class[layer] = A_mat[c]
    toc = time()
    print('Read A: %.2lf sec' % (toc - tic))

    # Read and parse the summit I matrices
    tic = time()
    I_class = gen_graph.I_from_summit_to_massif(args, I_mat_summit_dir_path, c)
    toc = time()
    print('Read I: %.2lf sec' % (toc - tic))

    tic = time()
    G_class = gen_graph.gen_full_graph(args, A_class, I_class)
    toc = time()
    print('Generate full graph: %.2lf sec' % (toc - tic))

    tic = time()
    G_class_json = json_graph.node_link_data(G_class)
    toc = time()
    print('Full graph into json format: %.2lf sec' % (toc - tic))

    tic = time()
    class_str_parsed_nodes = list(map(lambda x: {'weight': str(x['weight']), 'id': x['id']}, G_class_json['nodes']))
    class_str_parsed_links = list(map(lambda x: {'source': x['source'], 'target': x['target'], 'weight': str(x['weight'])}, G_class_json['links']))
    G_class_str_json = {'nodes': class_str_parsed_nodes, 'links': class_str_parsed_links}
    toc = time()
    print('Json str parsing: %.2lf sec' % (toc - tic))

    tic = time()
    file_path = '{}/{}.json'.format(graph_dir_path, 'G-{}'.format(c))
    with open(file_path, 'w') as f:
        json.dump(G_class_str_json, f)
    toc = time()
    print('Save graph: %.2lf sec' % (toc - tic))

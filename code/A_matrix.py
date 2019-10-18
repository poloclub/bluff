'''
Author: Haekyu Park
'''

import tensorflow as tf

def _parse_function(feature_proto, image_size=224):
    '''
    Parse imagenet-tf-records dataset
    * input
        - feature_proto: feature prototype
        - image_size: the image size
    * output
        - image: parsed images
        - label: parsed labels of the images
        - synset: parsed synset
    '''

    # Parse bytes features
    def _bytes_feature(value):
        return tf.train.Feature(
            bytes_list=tf.train.BytesList(value=[value]))
    # Parse int65 features
    def _int64_feature(value):
        return tf.train.Feature(
            int64_list=tf.train.Int64List(value=[value]))

    # Features to get from the dataset
    feature_set = {
        'image/filename': tf.io.FixedLenFeature([], tf.string),
        'image/encoded': tf.io.FixedLenFeature([], tf.string),
        'image/height': tf.io.FixedLenFeature([], tf.int64),
        'image/width': tf.io.FixedLenFeature([], tf.int64),
        'image/channels': tf.io.FixedLenFeature([], tf.int64),
        'image/class/label': tf.io.FixedLenFeature([], tf.int64),
        'image/class/synset': tf.io.FixedLenFeature([], tf.string)
    }

    # Parse features
    parsed_features = tf.parse_single_example(feature_proto, feature_set)

    # Get each parsed feature
    image_id = parsed_features['image/filename']
    image = parsed_features['image/encoded']
    height = parsed_features['image/height']
    width = parsed_features['image/width']
    channels = parsed_features['image/channels']
    label = parsed_features['image/class/label']
    synset = parsed_features['image/class/synset']

    # Decode images
    image = tf.image.decode_jpeg(image, channels=3)
    image = tf.image.resize_images(image, tf.constant([image_size, image_size]))

    return image, label, synset


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

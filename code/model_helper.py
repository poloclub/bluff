import numpy as np
import tensorflow as tf
import lucid.optvis.render as render


def get_predictions(model, imgs):
    output = get_activation_map(model, imgs, 'output2')
    return np.argmax(output, 1), output


def get_activation_map(model, imgs, layer):

    with tf.Graph().as_default(), tf.Session():
        t_input = tf.placeholder(tf.float32, [None, 224, 224, 3])
        T = render.import_model(model, t_input, t_input)
        act_map = T(layer).eval({t_input: imgs})

    return act_map


def get_all_layers_activation_map(model, imgs, layers):

    act_maps = {layer: [] for layer in layers}
    with tf.Graph().as_default(), tf.Session():
        t_input = tf.placeholder(tf.float32, [None, 224, 224, 3])
        T = render.import_model(model, t_input, t_input)
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

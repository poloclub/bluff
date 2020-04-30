'''
Massif: Interactive Interpretation of Adversarial Attacks on Deep Learning
File name: gen_adversarial_images.py
Author: Nilaksh Das, Haekyu Park
Date: Feb 2, 2020

This code generates adversarial attacked images.
'''


'''
Import packages
'''

# Packages for constructing adversarial attacks
from massif.data import tfutils
from massif.model import InceptionV1Model
from cleverhans.attacks import FastGradientMethod
from cleverhans.attacks import ProjectedGradientDescent
from massif.attackutils import get_one_hot_encoded_targets
from keras.applications.inception_v3 import preprocess_input

# Packages for running the TF session
from tqdm import tqdm
from glob import glob

# Other packages
import os
import random
import numpy as np
import tensorflow as tf
from absl import app, flags, logging

# Parse the arguments
O_ATTACK_NAME = 'PGD'

FLAGS = flags.FLAGS
flags.DEFINE_integer(
    'seed', 1000,
    'RNG seed for the experiment')
flags.DEFINE_integer(
    'label', None,
    'Attack images with this class label')
flags.DEFINE_integer(
    'target', None,
    'Target class label for attack')
flags.DEFINE_float(
    'eps', 0.1,
    'Maximum distortion of adversarial example '
    'compared to original input')
flags.DEFINE_enum(
    'ord', '2', ['inf', '1', '2'],
    'L-p norm to be used for perturbation.')
flags.DEFINE_float(
    'eps_iter', 0.05,
    'Step size for each attack iteration')
flags.DEFINE_float(
    'nb_iter', 10,
    'Number of attack iterations.')
flags.DEFINE_boolean(
    'debug', False,
    'Enables debug mode (won\'t save output to disk)')

flags.mark_flag_as_required('label')
flags.mark_flag_as_required('target')

# Define the default attack arguments
default_attack_kwargs = {
    'y': 389, # true label (from tfrecords label)
    'y_target': 178, # label to target (from lucid label)
    'eps': 0.1
}

def attack_images(model, tfrecords_dirpath, attack_type='PGD', attack_kwargs=default_attack_kwargs):
    '''
    Attack images (batch = 1 for now)
    '''

    # Get the true label
    true_label = attack_kwargs['y']
    attack_label = attack_kwargs['y_target']
    del attack_kwargs['y']

    # Define tfrecords input iterator
    tfrecord_filepaths = glob(os.path.join(tfrecords_dirpath, '*'))
    tf_dataset = tfutils.make_dataset(
                    tfrecord_filepaths,
                    batch_size=1,
                    filter_label=true_label,
                    preprocessing_fn=preprocess_input
                )
    iterator = tf_dataset.make_one_shot_iterator()
    x, y = iterator.get_next()

    # Run the Session
    attacked_imgs = []
    with tf.Session() as sess:

        # Set attack settings
        # PGD
        if attack_type == "PGD":
            attack = ProjectedGradientDescent(model, sess=sess)
        # FGM
        elif attack_type == "FGM":
            attack = FastGradientMethod(model, sess=sess)
        target_one_hot_encoded = get_one_hot_encoded_targets(attack_label)
        attack_kwargs['y_target'] = target_one_hot_encoded

        # Run the session to generate attacked images
        x_adv = attack.generate(x, **attack_kwargs)
        pbar = tqdm(unit='imgs')
        try:
            while True:
                attacked_img = sess.run(x_adv)
                predicted_class = get_predictions(model, attacked_img)
                print(predicted_class, attack_label)
                if predicted_class == attack_label:
                    attacked_imgs.append(attacked_img)
                pbar.update()
        except tf.errors.OutOfRangeError:
            pass

    if len(attacked_imgs) > 0:
        attacked_imgs = np.vstack(attacked_imgs)
    return attacked_imgs

def get_predictions(model, imgs):
    graph = tf.Graph()
    with tf.Session(graph=graph) as sess:
        x = tf.placeholder(tf.float32, (None, 224, 224, 3))
        y = model.get_probs(x)
        y = tf.argmax(y, 1)
        y_eval = sess.run(y, feed_dict={x: imgs})

    # One batch
    y_eval = y_eval[0]

    return y_eval

def save_attacked_imgs(attacked_img_dir, attacked_imgs):
    filepath = '{}/{}-{}'.format(attacked_img_dir, 'attacked', FLAGS.eps)
    np.save(filepath, attacked_imgs)

def main(argv):
    del argv

    # Random seed
    random.seed(FLAGS.seed)
    np.random.seed(FLAGS.seed)
    tf.set_random_seed(FLAGS.seed)

    # Directory path
    tfrecords_dirpath = 'GIVE/FILE/PATH'
    attacked_img_dir = 'GIVE/FILE/PATH'

    # model
    model = InceptionV1Model()

    # Attack
    attack_kwargs = {
        'y': FLAGS.label, # true label (from tfrecords label)
        'y_target': FLAGS.target, # label to target (from lucid label)
        'eps': FLAGS.eps
    }
    attacked_imgs = attack_images(
        model,
        tfrecords_dirpath,
        attack_type='PGD',
        attack_kwargs=attack_kwargs
    )
    save_attacked_imgs(attacked_img_dir, attacked_imgs)

if __name__ == '__main__':
    app.run(main)

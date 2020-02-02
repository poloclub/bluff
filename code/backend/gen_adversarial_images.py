'''
Massif: Interactive Interpretation of Adversarial Attacks on Deep Learning
File name: gen_adversarial_images.py
Author: Nilaksh Das, Haekyu Park
Date: Jan 31, 2020

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


# Define the default attack arguments
default_attack_kwargs = {
    'y': 2, # true label
    'y_target': 10, # label to target
    'eps': 0.1
}


def attack_images(model, tfrecords_dirpath, attack_type='PGD', attack_kwargs=default_attack_kwargs):

    # Define tfrecords input iterator
    tfrecord_filepaths = glob(os.path.join(tfrecords_dirpath, '*'))
    tf_dataset = tfutils.make_dataset(
                    tfrecord_filepaths,
                    batch_size=1,
                    filter_label=attack_kwargs['y'],
                    preprocessing_fn=preprocess_input
                )
    iterator = tf_dataset.make_one_shot_iterator()
    x, y = iterator.get_next()

    # Run the Session
    attacked_imgs = []
    del attack_kwargs['y']
    with tf.Session() as sess:

        # Set attack settings
        # PGD
        if attack_type == "PGD":
            attack = ProjectedGradientDescent(model, sess=sess)
        # FGM
        elif attack_type == "FGM":
            attack = FastGradientMethod(model, sess=sess)
        target_one_hot_encoded = get_one_hot_encoded_targets(attack_kwargs['y_target'])
        attack_kwargs['y_target'] = target_one_hot_encoded

        # Run the session to generate attacked images
        x_adv = attack.generate(x, **attack_kwargs)
        pbar = tqdm(unit='imgs')
        try:
            while True:
                attacked_img = sess.run(x_adv)
                attacked_imgs.append(attacked_img)
                pbar.update()
        except tf.errors.OutOfRangeError:
            pass

    if len(attacked_imgs) > 0:
        attacked_imgs = np.vstack(attacked_imgs)
    return attacked_imgs


def save_attacked_imgs(attacked_img_dir, attacked_imgs):
    filepath = '{}/{}'.format(attacked_img_dir, 'attacked')
    np.save(filepath, attacked_imgs)


if __name__ == '__main__':

    # Random seed
    seed = 100
    random.seed(seed)
    np.random.seed(seed)

    # Directory path
    tfrecords_dirpath = '/Users/haekyu/data/imagenet-tf-records'
    attacked_img_dir = '/Users/haekyu/data/massif/attacked/panda-armadillo'

    # model
    model = InceptionV1Model()

    # Attack
    attacked_imgs = attack_images(
        model,
        tfrecords_dirpath,
        attack_type='PGD',
        attack_kwargs=default_attack_kwargs
    )
    save_attacked_imgs(attacked_img_dir, attacked_imgs)

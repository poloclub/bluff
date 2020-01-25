import os
from glob import glob
import random

from absl import app, flags, logging
from cleverhans.attacks import ProjectedGradientDescent
import h5py
from keras.applications.inception_v3 import preprocess_input
import numpy as np
import tensorflow as tf
from tqdm import tqdm

from massif.attackutils import (
    get_attack_group_name,
    get_one_hot_encoded_targets)
from massif.constants import TFRECORDS_DIR, HDF5_DATA_PATH
from massif.data import hdf5utils, tfutils
from massif.model import InceptionV1Model


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
    'eps', 0.3,
    'Maximum distortion of adversarial example '
    'compared to original input')
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


def main(argv):
    del argv

    if FLAGS.debug:
        logging.info('Running in debug mode!!!')

    random.seed(FLAGS.seed)
    np.random.seed(FLAGS.seed)
    tf.set_random_seed(FLAGS.seed)

    tfrecord_filepaths = glob(os.path.join(TFRECORDS_DIR, '*'))
    tf_dataset = tfutils.make_dataset(tfrecord_filepaths,
                                      batch_size=1,
                                      filter_label=FLAGS.label,
                                      preprocessing_fn=preprocess_input)

    hdf5_dataset = None
    if not FLAGS.debug:
        hdf5_file = h5py.File(HDF5_DATA_PATH, 'a')
        hdf5_group = get_attack_group_name(O_ATTACK_NAME, FLAGS.label)
        hdf5_dataset = hdf5utils.create_image_dataset(
            hdf5_file, group=hdf5_group,
            attrs={'seed': FLAGS.seed,
                   'eps': FLAGS.eps,
                   'eps_iter': FLAGS.eps_iter,
                   'nb_iter': FLAGS.nb_iter,
                   'target': FLAGS.target})

    model = InceptionV1Model()
    iterator = tf_dataset.make_one_shot_iterator()
    x, y = iterator.get_next()

    with tf.Session() as sess:
        attack = ProjectedGradientDescent(model, sess=sess)
        target_one_hot_encoded = get_one_hot_encoded_targets(FLAGS.target)

        x_adv = attack.generate(
            x, eps=FLAGS.eps,
            nb_iter=FLAGS.nb_iter,
            eps_iter=FLAGS.eps_iter,
            y_target=target_one_hot_encoded)

        pbar = tqdm(unit='imgs')
        try:
            while True:
                attacked_imgs = sess.run(x_adv)

                if not FLAGS.debug:
                    hdf5utils.add_images_to_dataset(
                        attacked_imgs,
                        hdf5_dataset)

                pbar.update()
        except tf.errors.OutOfRangeError:
            pass


if __name__ == '__main__':
    app.run(main)

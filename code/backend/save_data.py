import os
from collections import namedtuple
import csv
from glob import glob
import json
import random

import h5py
from cleverhans.attacks import ProjectedGradientDescent
from keras.applications.inception_v3 import preprocess_input
import numpy as np
from scipy.stats import rankdata
import tensorflow as tf
from tqdm import tqdm

from massif.attackutils import get_one_hot_encoded_targets
from massif.data import hdf5utils
from massif.data import tfutils
from massif.model import InceptionV1Model


IMAGENET_LABELS_PATH = '/raid/home/ndas30/massif/data/imagenet-labels.txt'
TRAIN_TFRECORDS_DIR = '/raid/massif/data/imagenet-tf-records'
IMAGES_DIR = '/raid/massif/data/massif/images'
ACTIVATIONS_DIR = '/raid/massif/data/massif/activations'
NEURON_IMPORTANCES_DATA_PATH_FORMAT = \
    '/raid/massif/data/massif/neuron_data-{original}-{target}-{attack}.json'

ATTACK_STRENGTHS = [0.5, 1.0,
                    1.5, 2.0,
                    2.5, 3.0,
                    3.5, 4.0,
                    4.5, 5.0]


Label = namedtuple('Label', ['synset',
                             'lucid_label',
                             'tfrecord_label',
                             'name'])


def load_all_labels():
    labels = list()
    with open(IMAGENET_LABELS_PATH, 'r') as csvfile:
        reader = csv.DictReader(csvfile, delimiter='\t')
        for row in reader:
            row['lucid_label'] = int(row['lucid_label'])
            row['tfrecord_label'] = int(row['tfrecord_label'])
            labels.append(Label(**row))
    return labels


def load_labels_by_name():
    return {label.name: label
            for label in load_all_labels()}


def save_benign_images(label_name:str):
    output_filename = 'img-benign-%s.h5' % label_name.lower()
    output_filepath = os.path.join(IMAGES_DIR, output_filename)
    assert not os.path.exists(output_filepath)
    print('Saving images for class %s to %s' % (label_name, output_filepath))
    dataset = hdf5utils.create_image_dataset(
        h5py.File(output_filepath, 'w'),
        dataset_name='images')

    tfrecords_filepaths = glob(os.path.join(TRAIN_TFRECORDS_DIR, '*'))
    labels_by_name = load_labels_by_name()
    tf_dataset = tfutils.make_dataset(
        tfrecords_filepaths,
        preprocessing_fn=preprocess_input,
        filter_label=labels_by_name[label_name].tfrecord_label)

    iterator = tf_dataset.make_one_shot_iterator()
    x, _ = iterator.get_next()

    with tf.Session() as sess:
        pbar = tqdm(unit='imgs')
        try:
            while True:
                img = sess.run(x)
                hdf5utils.add_image_to_dataset(img, dataset)
                pbar.update()
        except tf.errors.OutOfRangeError:
            pass

    print(dataset)


def save_pgd_attacked_images(original_label_name, target_label_name, eps,
                             nb_iter=20, eps_iter=0.05, ord=2, seed=1000):

    random.seed(seed)
    np.random.seed(seed)
    tf.set_random_seed(seed)

    labels_by_name = load_labels_by_name()
    original_label = labels_by_name[original_label_name].lucid_label
    target_label = labels_by_name[target_label_name].lucid_label

    benign_dataset_path = os.path.join(
        IMAGES_DIR, 'img-benign-%s.h5' % original_label_name.lower())
    assert os.path.exists(benign_dataset_path)

    attacked_dataset_path = os.path.join(
        IMAGES_DIR, 'img-attacked-%s-%s-pgd-%0.02f.h5' % (
            original_label_name.lower(), target_label_name.lower(), eps))
    assert not os.path.exists(attacked_dataset_path)
    print('Saving attacked images to %s' % attacked_dataset_path)

    img_dataset = hdf5utils.load_image_dataset_from_file(benign_dataset_path)
    out_dataset = hdf5utils.create_image_dataset(
        h5py.File(attacked_dataset_path, 'w'), dataset_name='images')

    graph = tf.Graph()
    with graph.as_default():
        model = InceptionV1Model()
        x = model.default_input_placeholder
        y_pred = model.get_predicted_class(x)
        with tf.Session(graph=graph) as sess:
            attack = ProjectedGradientDescent(model, sess=sess)
            target_one_hot_encoded = get_one_hot_encoded_targets(target_label)

            x_adv = attack.generate(
                x, eps=eps,
                nb_iter=nb_iter,
                eps_iter=eps_iter,ord=ord,
                y_target=target_one_hot_encoded)

            num_attack_success = 0
            pbar = tqdm(unit='imgs', total=len(img_dataset))
            try:
                for img in img_dataset:
                    ben_img = np.array(img)
                    adv_img = sess.run(x_adv, feed_dict={x: [ben_img]})
                    attack_pred = sess.run(y_pred, feed_dict={x: adv_img})

                    adv_img = adv_img[0]
                    attack_pred = attack_pred[0]
                    assert not np.any(np.isnan(adv_img))
                    assert not np.isnan(attack_pred)

                    if attack_pred == target_label:
                        num_attack_success += 1
                        hdf5utils.add_image_to_dataset(adv_img, out_dataset)

                    pbar.set_postfix(num_attack_success=num_attack_success)
                    pbar.update()
            except tf.errors.OutOfRangeError:
                pass


def save_activation_scores(image_dataset_filepath:str):
    print('Initializing model...')
    model = InceptionV1Model()

    output_filename = os.path.basename(image_dataset_filepath)
    if output_filename.startswith('img-'):
        output_filename = 'act-%s' % output_filename[4:]
    output_filepath = os.path.join(ACTIVATIONS_DIR, output_filename)
    assert not os.path.exists(output_filepath)
    print('Saving activation scores to %s' % output_filepath)
    activation_scores_datasets = hdf5utils.create_activation_scores_datasets(
        h5py.File(output_filepath, 'w'), model)

    x = model.default_input_placeholder
    img_dataset = hdf5utils.load_image_dataset_from_file(image_dataset_filepath)
    pbar = tqdm(total=len(img_dataset))
    with tf.Session() as sess:
        for img in img_dataset:
            img_ = np.array(img)
            assert not np.any(np.isnan(img_))

            for layer in model.LAYERS:
                activation_scores = model.eval_activation_scores(
                    [img_], layer, sess=sess)
                activation_scores = activation_scores[0]

                layer_scores_dataset = activation_scores_datasets[layer]
                hdf5utils.add_activation_scores_for_image_to_dataset(
                    activation_scores, layer_scores_dataset)

            pbar.update()


def save_neuron_importances_to_db(original_label_name:str,
                                  target_label_name:str,
                                  attack_name, attack_strengths):

    def _calculate_importances_from_scores(scores):
        num_images, num_neurons = scores.shape
        median_activations = np.median(scores, axis=0)
        median_activation_percentiles = \
            rankdata(median_activations) / num_neurons
        return median_activations, median_activation_percentiles

    original_label_name = original_label_name.lower()
    target_label_name = target_label_name.lower()

    original_activation_scores_filepath = os.path.join(
        ACTIVATIONS_DIR, 'act-benign-%s.h5' % original_label_name)
    target_activation_scores_filepath = os.path.join(
        ACTIVATIONS_DIR, 'act-benign-%s.h5' % target_label_name)

    attacked_activation_scores_filepath = os.path.join(
        ACTIVATIONS_DIR, 'act-attacked-%s-%s-%s' % (
            original_label_name, target_label_name, attack_name))
    attacked_activation_scores_filepath = \
        attacked_activation_scores_filepath + '-%0.02f.h5'

    data = dict()
    model_klass = InceptionV1Model

    # Save original neuron importances
    original_activation_scores = \
        hdf5utils.load_activation_scores_datasets_from_file(
            original_activation_scores_filepath, model_klass.LAYERS)
    for layer in model_klass.LAYERS:
        data[layer] = dict()
        median_activations, median_activation_percentiles = \
            _calculate_importances_from_scores(
                original_activation_scores[layer])
        for i in range(model_klass.LAYER_SIZES[layer]):
            neuron = '%s-%d' % (layer, i)
            data[layer][neuron] = dict()
            data[layer][neuron]['original'] = {
                'median_activation': float(median_activations[i]),
                'median_activation_percentile': \
                    float(median_activation_percentiles[i])}

    # Save target neuron importances
    target_activation_scores = \
        hdf5utils.load_activation_scores_datasets_from_file(
            target_activation_scores_filepath, model_klass.LAYERS)
    for layer in model_klass.LAYERS:
        median_activations, median_activation_percentiles = \
            _calculate_importances_from_scores(
                target_activation_scores[layer])
        for i in range(model_klass.LAYER_SIZES[layer]):
            neuron = '%s-%d' % (layer, i)
            data[layer][neuron]['target'] = {
                'median_activation': float(median_activations[i]),
                'median_activation_percentile': \
                    float(median_activation_percentiles[i])}

    # Save attacked neuron importances
    for eps in attack_strengths:
        attacked_activation_scores = \
            hdf5utils.load_activation_scores_datasets_from_file(
                attacked_activation_scores_filepath % eps, model_klass.LAYERS)
        for layer in model_klass.LAYERS:
            median_activations, median_activation_percentiles = \
                _calculate_importances_from_scores(
                    attacked_activation_scores[layer])
            for i in range(model_klass.LAYER_SIZES[layer]):
                neuron = '%s-%d' % (layer, i)
                data[layer][neuron]['attacked-%s-%0.02f' % (attack_name, eps)] = {
                    'median_activation': float(median_activations[i]),
                    'median_activation_percentile': \
                        float(median_activation_percentiles[i])}

    with open(NEURON_IMPORTANCES_DATA_PATH_FORMAT.format(
            original=original_label_name,
            target=target_label_name,
            attack=attack_name), 'w') as f:
        json.dump(data, f, indent=2)


if __name__ == '__main__':
    #  dataset = hdf5utils.load_image_dataset_from_file(
        #  os.path.join(IMAGES_DIR, 'img-benign-giant_panda.h5'))
    #  print(dataset)
    #  print(dataset[0])

    # save_activation_scores(os.path.join(IMAGES_DIR, 'img-benign-armadillo.h5'))

    #  print(hdf5utils.load_activation_scores_datasets_from_file(
        #  os.path.join(ACTIVATIONS_DIR, 'act-benign-armadillo.h5'), InceptionV1Model.LAYERS))

    #  for eps in [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0]:
        #  save_pgd_attacked_images('giant_panda', 'armadillo', eps)

    #  for eps in [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0]:
        #  save_activation_scores(os.path.join(
            #  IMAGES_DIR, 'img-attacked-%s-%s-pgd-%0.02f.h5' % (
                #  'giant_panda', 'armadillo', eps)))

    save_neuron_importances_to_db('giant_panda', 'armadillo', 'pgd', ATTACK_STRENGTHS)

import time
from typing import List
import uuid

import h5py
import numpy as np


O_TIMESTAMP = 'timestamp'


def minibatch(dataset, batch_size):
    i, n = 0, len(dataset)
    while i + batch_size < n:
        yield dataset[i: i + batch_size]
        i += batch_size
    yield dataset[i:]


def create_dataset(f: h5py.File, data_shape,
                   group='/', attrs=None,
                   dataset_name=None):

    if attrs is None:
        attrs = dict()
    if dataset_name is None:
        dataset_name = str(uuid.uuid4())

    dataset_shape = (0,) + data_shape
    chunk_shape = (1,) + data_shape
    max_shape = (None,) + data_shape

    if group not in f:
        f.create_group(group)

    group = f[group]
    dataset = group.create_dataset(dataset_name,
                                   shape=dataset_shape,
                                   chunks=chunk_shape,
                                   maxshape=max_shape)

    attrs[O_TIMESTAMP] = time.time()
    for k, v in attrs.items():
        dataset.attrs[k] = v

    return dataset


def add_item_to_dataset(item, dataset):
    num_items = dataset.shape[0]
    data_shape = dataset.shape[1:]
    assert item.shape == data_shape

    dataset.resize(num_items + 1, axis=0)
    dataset[num_items] = item


def add_items_to_dataset(items, dataset):
    num_items_to_add = len(items)
    num_items_in_dataset = dataset.shape[0]
    data_shape = dataset.shape[1:]
    assert all(item.shape == data_shape
               for item in items)

    dataset.resize(num_items_in_dataset + num_items_to_add, axis=0)
    for i, img in enumerate(items):
        dataset[num_items_in_dataset + i] = img


def update_dataset_attributes(dataset, **attrs):
    for k, v in attrs.items():
        dataset.attrs[k] = v


def filter_datasets_by_attributes(f: h5py.File, group, **attrs):
    return [item for item in f[group].values()
            if (isinstance(item, h5py.Dataset)
                and all(item.attrs.get(k) == v
                        for k, v in attrs.items()))]


def get_latest_dataset_with_attributes(f: h5py.File, group, **attrs):
    datasets = filter_datasets_by_attributes(f, group, **attrs)
    dataset = max(datasets, key=lambda d: d.attrs[O_TIMESTAMP])

    if O_TIMESTAMP in attrs:
        assert dataset.attrs[O_TIMESTAMP] == O_TIMESTAMP
    assert all(attrs.get(k) == v
               for k, v in dataset.attrs.items()
               if k != O_TIMESTAMP), \
        '`attrs` does not uniquely identify any dataset'

    return dataset


def create_image_dataset(f: h5py.File,
                         img_size=224,
                         group='/',
                         attrs=None,
                         dataset_name=None):

    data_shape = (img_size, img_size, 3)
    return create_dataset(f, data_shape,
                          group=group, attrs=attrs,
                          dataset_name=dataset_name)


def create_activation_scores_datasets(f: h5py.File, model,
                                      group='/', attrs=None):

    datasets = dict()
    for layer in model.LAYERS:
        data_shape = (model.LAYER_SIZES[layer],)
        dataset = create_dataset(f, data_shape,
                                 group=group,
                                 attrs=attrs,
                                 dataset_name=layer)

        datasets[layer] = dataset

    return datasets


def create_raw_edge_influences_datasets(f: h5py.File, influence_tensors: dict,
                                        group='/', attrs=None):

    datasets = dict()
    for block, tensor in influence_tensors.items():
        data_shape = tuple(tensor.shape[1:].as_list())
        dataset = create_dataset(f, data_shape,
                                 group=group,
                                 attrs=attrs,
                                 dataset_name=block)

        datasets[block] = dataset

    return datasets


def add_image_to_dataset(img, dataset):
    add_item_to_dataset(img, dataset)


def add_images_to_dataset(imgs, dataset):
    add_items_to_dataset(imgs, dataset)


def add_activation_scores_for_image_to_dataset(activation_scores, dataset):
    add_item_to_dataset(activation_scores, dataset)


def load_image_dataset_from_file(filepath: str, group='/', dataset_name='images'):
    f = h5py.File(filepath, 'r')
    group = group.rstrip('/') if group != '/' else ''
    dataset = f['/'.join([group, dataset_name])]
    return dataset


def load_activation_scores_datasets_from_file(
        filepath: str, layers: List[str], group='/'):

    f = h5py.File(filepath, 'r')
    group = group.rstrip('/') if group != '/' else ''
    datasets = {layer: np.array(f['/'.join([group, layer])])
                for layer in layers}
    return datasets


def load_raw_edge_influences_datasets(filepath: str, blocks, group='/'):
    f = h5py.File(filepath, 'r')
    group = group.rstrip('/') if group != '/' else ''
    datasets = {block: f['/'.join([group, block])]
                for block in blocks}
    return datasets

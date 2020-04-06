from pathlib import Path
from typing import List


class classproperty:
    # pylint: disable=too-few-public-methods
    def __init__(self, func):
        self._func = func

    def __get__(self, instance, owner):
        return self._func(owner)


def namestr(*args, ext=None):
    name = '-'.join(list(map(str, args)))
    if ext is not None:
        name = '.'.join([name, ext])
    return name


# pylint: disable=no-self-argument

class CodePaths:
    _this_dir = Path(__file__).parent.resolve()

    @classproperty
    def base_dir(cls) -> Path:
        return cls._this_dir.parent.parent.resolve()

    @classproperty
    def data_dir(cls) -> Path:
        return cls.base_dir/'data'

    @classproperty
    def backend_code_dir(cls) -> Path:
        return cls.base_dir/'code'/'backend'


class DataPaths:
    _base_dir = Path('/raid/massif/data')

    @classproperty
    def base_dir(cls) -> Path:
        return cls._base_dir

    @classproperty
    def imagenet_tfrecords_dir(cls) -> Path:
        return cls.base_dir/'imagenet-tf-records'

    @classproperty
    def imagenet_tfrecords_filepaths(cls) -> List[str]:
        imagenet_dir = Path(cls.imagenet_tfrecords_dir)
        return list(map(str, imagenet_dir.glob('*')))

    @classproperty
    def massif_data_dir(cls) -> Path:
        return cls.base_dir/'massif'

    @classproperty
    def massif_images_dir(cls) -> Path:
        return cls.massif_data_dir/'images'

    @classproperty
    def massif_activations_dir(cls) -> Path:
        return cls.massif_data_dir/'activations'

    @classproperty
    def massif_edges_dir(cls) -> Path:
        return cls.massif_data_dir/'edges'

    @classmethod
    def _get_benign_generic_datapath(cls, dirpath, prefix, class_name, ext):
        dirpath = Path(dirpath).resolve()

        class_name = class_name.lower()
        filename = namestr(prefix, 'benign', class_name, ext=ext)

        return dirpath/filename

    @classmethod
    def _get_attacked_generic_datapath(cls, dirpath, prefix,
                                       original_class, target_class,
                                       attack_name, attack_strength, ext):

        dirpath = Path(dirpath).resolve()

        original_class = original_class.lower()
        target_class = target_class.lower()
        attack_name = attack_name.lower()
        attack_strength = '%0.04f' % attack_strength

        filename = namestr(prefix, 'attacked',
                           original_class, target_class,
                           attack_name, attack_strength,
                           ext=ext)

        return dirpath/filename

    @classmethod
    def _get_aggregate_generic_datapath(
            cls, aggregate_name,
            original_class,
            target_class,
            attack_name,
            ext='json') -> Path:
        # pylint: disable=too-many-arguments

        original_class = original_class.lower()
        target_class = target_class.lower()
        attack_name = attack_name.lower()

        filename = namestr(
            aggregate_name, original_class, target_class, attack_name, ext=ext)
        return cls.massif_data_dir/filename

    @classmethod
    def get_benign_images_datapath(cls, class_name) -> Path:
        return cls._get_benign_generic_datapath(
            dirpath=cls.massif_images_dir,
            prefix='img',
            class_name=class_name,
            ext='h5')

    @classmethod
    def get_attacked_images_datapath(
            cls, original_class, target_class,
            attack_name, attack_strength=0.0):

        return cls._get_attacked_generic_datapath(
            dirpath=cls.massif_images_dir,
            prefix='img',
            original_class=original_class, target_class=target_class,
            attack_name=attack_name, attack_strength=attack_strength,
            ext='h5')

    @classmethod
    def get_benign_activations_datapath(cls, class_name) -> Path:
        return cls._get_benign_generic_datapath(
            dirpath=cls.massif_activations_dir,
            prefix='act',
            class_name=class_name,
            ext='h5')

    @classmethod
    def get_attacked_activations_datapath(
            cls, original_class, target_class,
            attack_name, attack_strength=0.0) -> Path:

        return cls._get_attacked_generic_datapath(
            dirpath=cls.massif_activations_dir,
            prefix='act',
            original_class=original_class, target_class=target_class,
            attack_name=attack_name, attack_strength=attack_strength,
            ext='h5')

    @classmethod
    def get_neuron_data_datapath(
            cls, original_class, target_class, attack_name) -> Path:

        return cls._get_aggregate_generic_datapath(
            aggregate_name='neuron_data',
            original_class=original_class,
            target_class=target_class,
            attack_name=attack_name)

    @classmethod
    def get_neuron_vulnerabilities_datapath(
            cls, original_class, target_class, attack_name) -> Path:

        return cls._get_aggregate_generic_datapath(
            aggregate_name='neuron_vulnerabilities',
            original_class=original_class,
            target_class=target_class,
            attack_name=attack_name)

    @classmethod
    def get_top_neurons_datapath(
            cls, original_class, target_class, attack_name) -> Path:

        return cls._get_aggregate_generic_datapath(
            aggregate_name='top_neurons',
            original_class=original_class,
            target_class=target_class,
            attack_name=attack_name)


    @classmethod
    def get_benign_raw_edge_influences_datapath(cls, class_name) -> Path:
        return cls._get_benign_generic_datapath(
            dirpath=cls.massif_edges_dir,
            prefix='edg_inf_raw',
            class_name=class_name,
            ext='h5')

    @classmethod
    def get_attacked_raw_edge_influences_datapath(
            cls, original_class, target_class,
            attack_name, attack_strength=0.0):

        return cls._get_attacked_generic_datapath(
            dirpath=cls.massif_edges_dir,
            prefix='edg_inf_raw',
            original_class=original_class, target_class=target_class,
            attack_name=attack_name, attack_strength=attack_strength,
            ext='h5')

    @classmethod
    def get_benign_influence_matrix_datapath(cls, class_name) -> Path:
        return cls._get_benign_generic_datapath(
            dirpath=cls.massif_edges_dir,
            prefix='edg_inf_parsed',
            class_name=class_name,
            ext='json')

    @classmethod
    def get_attacked_influence_matrix_datapath(
            cls, original_class, target_class,
            attack_name, attack_strength=0.0):

        return cls._get_attacked_generic_datapath(
            dirpath=cls.massif_edges_dir,
            prefix='edg_inf_parsed',
            original_class=original_class, target_class=target_class,
            attack_name=attack_name, attack_strength=attack_strength,
            ext='json')

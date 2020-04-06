import argparse
import os

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

import tensorflow as tf
tf.compat.v1.logging.set_verbosity(tf.compat.v1.logging.ERROR)

from preprocess_scores import preprocess_scores
from save_data import (
    save_benign_images, save_pgd_attacked_images,
    save_benign_activations, save_attacked_activations,
    save_neuron_importances_to_db)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--gpu', default='0')
    subparsers = parser.add_subparsers()

    subparser1 = subparsers.add_parser('save_benign_images')
    subparser1.set_defaults(func=save_benign_images)
    subparser1.add_argument('--class_name', required=True)

    subparser2 = subparsers.add_parser('save_attacked_images')
    subparser2.set_defaults(func=save_pgd_attacked_images)
    subparser2.add_argument('--original_class', required=True)
    subparser2.add_argument('--target_class', required=True)
    subparser2.add_argument('--attack_strength', type=float, required=True)

    subparser3 = subparsers.add_parser('save_benign_activations')
    subparser3.set_defaults(func=save_benign_activations)
    subparser3.add_argument('--class_name', required=True)

    subparser4 = subparsers.add_parser('save_attacked_activations')
    subparser4.set_defaults(func=save_attacked_activations)
    subparser4.add_argument('--original_class', required=True)
    subparser4.add_argument('--target_class', required=True)
    subparser4.add_argument('--attack_name', default='pgd')
    subparser4.add_argument('--attack_strength', type=float, required=True)

    subparser5 = subparsers.add_parser('save_neuron_importances')
    subparser5.set_defaults(func=save_neuron_importances_to_db)
    subparser5.add_argument('--original_class', required=True)
    subparser5.add_argument('--target_class', required=True)
    subparser5.add_argument('--attack_name', default='pgd')

    subparser6 = subparsers.add_parser('preprocess_scores')
    subparser6.set_defaults(func=preprocess_scores)
    subparser6.add_argument('--original_class', required=True)
    subparser6.add_argument('--target_class', required=True)
    subparser6.add_argument('--attack_name', default='pgd')

    args = vars(parser.parse_args())
    func = args.pop('func')
    gpu = args.pop('gpu')

    os.environ['CUDA_VISIBLE_DEVICES'] = gpu

    func(**args)


if __name__ == "__main__":
    main()

import numpy as np


def get_attack_group_name(attack_name, class_label, split='validation'):
    return '/'.join([
        'imagenet', split,
        str(class_label),
        'attacked',
        attack_name])


def get_one_hot_encoded_targets(target, batch_size=1, num_classes=1000):
    if type(target) is int:
        target = [target] * batch_size
    assert len(target) == batch_size
    target = np.array(target)

    one_hot_encoded = np.zeros((batch_size, num_classes), dtype=np.int)
    one_hot_encoded[np.arange(batch_size), target] = 1

    return one_hot_encoded


if __name__ == '__main__':
    print(get_one_hot_encoded_targets([0, 1, 2], 3))

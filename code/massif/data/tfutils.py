import tensorflow as tf


def make_dataset(filenames,
                 image_size=224,
                 batch_size=None,
                 filter_label=None,
                 preprocessing_fn=None):

    def _parse_function(example_proto):
        feature_set = {
            'image/filename': tf.FixedLenFeature([], tf.string),
            'image/encoded': tf.FixedLenFeature([], tf.string),
            'image/height': tf.FixedLenFeature([], tf.int64),
            'image/width': tf.FixedLenFeature([], tf.int64),
            'image/channels': tf.FixedLenFeature([], tf.int64),
            'image/class/label': tf.FixedLenFeature([], tf.int64),
            'image/class/synset': tf.FixedLenFeature([], tf.string)}

        parsed_features = tf.parse_single_example(example_proto, feature_set)

        image = parsed_features['image/encoded']
        image = tf.image.decode_jpeg(image, channels=3)
        image = tf.image.resize_images(
            image, tf.constant([image_size, image_size]))

        label = parsed_features['image/class/label']

        return image, label

    dataset = tf.data.TFRecordDataset(filenames)
    dataset = dataset.map(_parse_function)

    if preprocessing_fn is not None:
        dataset = dataset.map(
            lambda image, label: (preprocessing_fn(image), label))

    if filter_label is not None:
        dataset = dataset.filter(
            lambda image, label: tf.math.equal(label, filter_label))

    if batch_size is not None:
        dataset = dataset.batch(batch_size, drop_remainder=True)

    return dataset


if __name__ == '__main__':
    from collections import defaultdict
    from glob import glob
    from tqdm import tqdm

    filenames = glob('../../data/tfrecords/*')
    dataset = make_dataset(filenames)
    iterator = dataset.make_one_shot_iterator()
    x, y = iterator.get_next()

    counts = defaultdict(int)

    try:
        pbar = tqdm(unit='imgs')
        with tf.Session() as sess:
            while True:
                x_eval, y_eval = sess.run([x, y])
                counts[y_eval] += 1
                pbar.set_postfix(curr_class=y_eval)
                pbar.update()

    except tf.errors.OutOfRangeError:
        pass

    print(sorted(counts.items(), key=lambda it: it[1], reverse=True))

from cleverhans.model import Model as CleverhansModel
import lucid.modelzoo.vision_models as models
import tensorflow as tf


class InceptionV1Model(CleverhansModel):
    SCOPE = 'inceptionv1'
    SOFTMAX_OP = 'softmax2'

    IMG_SIZE = 224
    NUM_CLASSES = 1000
    LAYER_SIZES = {
        'mixed3a': 256,
        'mixed3b': 480,
        'mixed4a': 508,
        'mixed4b': 512,
        'mixed4c': 512,
        'mixed4d': 528,
        'mixed4e': 832,
        'mixed5a': 832,
        'mixed5b': 1024}
    LAYER_BLK_SIZES = {
        # mixed 3b
        'mixed3b_0': 128,
        'mixed3b_1': 192,
        'mixed3b_2': 96,
        'mixed3b_3': 64,
        'mixed3b_4': 128,
        'mixed3b_5': 32,
        # mixed 4a
        'mixed4a_0': 192,
        'mixed4a_1': 208,
        'mixed4a_2': 48,
        'mixed4a_3': 64,
        'mixed4a_4': 96,
        'mixed4a_5': 16,
        # mixed 4b
        'mixed4b_0': 160,
        'mixed4b_1': 224,
        'mixed4b_2': 64,
        'mixed4b_3': 64,
        'mixed4b_4': 112,
        'mixed4b_5': 24,
        # mixed 4c
        'mixed4c_0': 128,
        'mixed4c_1': 256,
        'mixed4c_2': 64,
        'mixed4c_3': 64,
        'mixed4c_4': 128,
        'mixed4c_5': 24,
        # mixed 4d
        'mixed4d_0': 112,
        'mixed4d_1': 288,
        'mixed4d_2': 64,
        'mixed4d_3': 64,
        'mixed4d_4': 144,
        'mixed4d_5': 32,
        # mixed 4e
        'mixed4e_0': 256,
        'mixed4e_1': 320,
        'mixed4e_2': 128,
        'mixed4e_3': 128,
        'mixed4e_4': 160,
        'mixed4e_5': 32,
        # mixed 5a
        'mixed5a_0': 256,
        'mixed5a_1': 320,
        'mixed5a_2': 128,
        'mixed5a_3': 128,
        'mixed5a_4': 160,
        'mixed5a_5': 48,  # 32?
        # mixed 5b
        'mixed5b_0': 384,
        'mixed5b_1': 384,
        'mixed5b_2': 128,
        'mixed5b_3': 128,
        'mixed5b_4': 192,
        'mixed5b_5': 48}
    LAYERS = list(sorted(LAYER_SIZES.keys()))

    def __init__(self):
        super(InceptionV1Model, self).__init__()
        self._model = models.InceptionV1()
        self._model.load_graphdef()
        self._fprop_cache = dict()

    @property
    def input_image_size(self):
        return 224, 224

    def fprop(self, x, **kwargs):
        del kwargs  # unused

        if x not in self._fprop_cache:
            # https://github.com/tensorflow/lucid/blob/67e19f38c315e548034c3e4315dfee6f718df916/lucid/modelzoo/vision_base.py#L189
            graph = x.graph
            scope = graph.unique_name(
                '%sfprop%d' % (self.SCOPE, len(self._fprop_cache)), False)
            _, x_prep = self._model.create_input(x, forget_xy_shape=True)
            final_input_map = {self._model.input_name: x_prep}
            ops = tf.import_graph_def(
                self._model.graph_def, final_input_map,
                return_elements=[self.SOFTMAX_OP], name=scope)
            self._model.post_import(scope)

            softmax2_op = ops[0]
            logits = softmax2_op.inputs[0]
            logits = logits[:, :1000]

            self._fprop_cache[x] = {'logits': logits}

        return self._fprop_cache[x]


if __name__ == '__main__':
    from io import BytesIO
    import numpy as np
    from PIL import Image
    import requests

    tf.logging.set_verbosity(tf.logging.ERROR)

    model = InceptionV1Model()

    # Get an input image from url
    img_url = 'https://images.fineartamerica.com/images/artworkimages/mediumlarge/1/white-wolf-elaine-mikkelstrup.jpg'
    img_response = requests.get(img_url)
    img = Image.open(BytesIO(img_response.content))
    img = img.resize(model.input_image_size)
    img = np.array(img)

    graph = tf.Graph()
    with tf.Session(graph=graph) as sess:
        x = tf.placeholder(tf.float32, (None,) + model.input_image_size + (3,))
        y = model.get_probs(x)
        y = tf.arg_max(y, 1)
        y_eval = sess.run(y, feed_dict={x: [img]})
    print('%s should be 102 (white_wolf)' % y_eval)

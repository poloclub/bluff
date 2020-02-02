from cleverhans.model import Model as CleverhansModel
import lucid.modelzoo.vision_models as models
import tensorflow as tf


# Define InceptionV1 model wrapper for cleverhans
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
        'mixed3b_concat_0': 128,
        'mixed3b_concat_1': 192,
        'mixed3b_concat_2': 96,
        'mixed3b_concat_3': 64,
        'mixed3b_3x3': 128,
        'mixed3b_5x5': 32,
        # mixed 4a
        'mixed4a_concat_0': 192,
        'mixed4a_concat_1': 204, # 208?
        'mixed4a_concat_2': 48,
        'mixed4a_concat_3': 64,
        'mixed4a_3x3': 96,
        'mixed4a_5x5': 16,
        # mixed 4b
        'mixed4b_concat_0': 160,
        'mixed4b_concat_1': 224,
        'mixed4b_concat_2': 64,
        'mixed4b_concat_3': 64,
        'mixed4b_3x3': 112,
        'mixed4b_5x5': 24,
        # mixed 4c
        'mixed4c_concat_0': 128,
        'mixed4c_concat_1': 256,
        'mixed4c_concat_2': 64,
        'mixed4c_concat_3': 64,
        'mixed4c_3x3': 128,
        'mixed4c_5x5': 24,
        # mixed 4d
        'mixed4d_concat_0': 112,
        'mixed4d_concat_1': 288,
        'mixed4d_concat_2': 64,
        'mixed4d_concat_3': 64,
        'mixed4d_3x3': 144,
        'mixed4d_5x5': 32,
        # mixed 4e
        'mixed4e_concat_0': 256,
        'mixed4e_concat_1': 320,
        'mixed4e_concat_2': 128,
        'mixed4e_concat_3': 128,
        'mixed4e_3x3': 160,
        'mixed4e_5x5': 32,
        # mixed 5a
        'mixed5a_concat_0': 256,
        'mixed5a_concat_1': 320,
        'mixed5a_concat_2': 128,
        'mixed5a_concat_3': 128,
        'mixed5a_3x3': 160,
        'mixed5a_5x5': 48, # 32? 48?
        # mixed 5b
        'mixed5b_concat_0': 384,
        'mixed5b_concat_1': 384,
        'mixed5b_concat_2': 128,
        'mixed5b_concat_3': 128,
        'mixed5b_3x3': 192,
        'mixed5b_5x5': 48}
    LAYERS = list(sorted(LAYER_SIZES.keys()))

    def __init__(self):
        super(InceptionV1Model, self).__init__()
        self._model = models.InceptionV1()
        self._model.load_graphdef()
        self._fprop_cache = dict()
        self._scope_cache = dict()

        self._default_input_placeholder = self.make_input_placeholder()
        self.fprop(self._default_input_placeholder)

    @property
    def default_input_placeholder(self):
        return self._default_input_placeholder

    def fprop(self, x, **kwargs):
        del kwargs  # unused

        if x not in self._fprop_cache:
            # https://git.io/JeKpg
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

            if graph.get_name_scope() != '':
                scope = '%s/%s' % (graph.get_name_scope(), scope)

            self._scope_cache[x] = scope
            self._fprop_cache[x] = dict()
            for layer in self.LAYERS:
                self._fprop_cache[x][layer] = \
                    graph.get_tensor_by_name("%s/%s:0" % (scope, layer))
            self._fprop_cache[x][self.O_LOGITS] = logits

        return self._fprop_cache[x]

    def get_layer_names(self):
        return self.LAYERS + [self.O_LOGITS]

    def make_input_placeholder(self):
        return tf.placeholder(
            tf.float32, (None, self.IMG_SIZE, self.IMG_SIZE, 3))

    def get_weight_tensors_for_layer(self, layer, x=None):
        if x is None:
            x = self.default_input_placeholder
        if x not in self._scope_cache:
            self.fprop(x)

        graph = x.graph
        scope = self._scope_cache[x]
        t = graph.get_tensor_by_name
        t_w0 = t('%s/%s_1x1_w:0' % (scope, layer))
        t_w1 = t('%s/%s_3x3_bottleneck_w:0' % (scope, layer))
        t_w2 = t('%s/%s_3x3_w:0' % (scope, layer))
        t_w3 = t('%s/%s_5x5_bottleneck_w:0' % (scope, layer))
        t_w4 = t('%s/%s_5x5_w:0' % (scope, layer))
        t_w5 = t('%s/%s_pool_reduce_w:0' % (scope, layer))
        return t_w0, t_w1, t_w2, t_w3, t_w4, t_w5

    def eval_activation_map(self, imgs, layer, sess=None):
        sess = sess or tf.get_default_session() or tf.Session()

        x = self.default_input_placeholder
        t_act_map = self.fprop(x)[layer]
        with sess.as_default():
            act_map = t_act_map.eval({x: imgs})
        return act_map

    def eval_activation_score(self, imgs, layer, sess=None):
        sess = sess or tf.get_default_session() or tf.Session()

        x = self.default_input_placeholder
        t_act_map = self.fprop(x)[layer]
        t_act_score = tf.math.reduce_max(t_act_map, axis=[1, 2])
        with sess.as_default():
            act_score = t_act_score.eval({x: imgs})
        return act_score


if __name__ == '__main__':
    from io import BytesIO
    import numpy as np
    from PIL import Image
    import requests

    tf.logging.set_verbosity(tf.logging.ERROR)

    g = tf.Graph()
    with g.as_default():
        model = InceptionV1Model()
        x = model.make_input_placeholder()
        y = model.get_predicted_class(x)

    # Get an input image from url
    img_url = ('https://images.fineartamerica.com'
               '/images/artworkimages/mediumlarge'
               '/1/white-wolf-elaine-mikkelstrup.jpg')
    img_response = requests.get(img_url)
    img = Image.open(BytesIO(img_response.content))
    img = img.resize([model.IMG_SIZE] * 2)
    img = np.array(img)

    with tf.Session(graph=g) as sess:
        y_eval = sess.run(y, feed_dict={x: [img]})
    print('%s should be 102 (white_wolf)' % y_eval)

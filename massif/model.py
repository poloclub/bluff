from cleverhans.model import Model as CleverhansModel
import lucid.modelzoo.vision_models as models
import tensorflow as tf


class InceptionV1Model(CleverhansModel):
    SCOPE = 'inceptionv1'
    SOFTMAX_OP = 'softmax2'

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

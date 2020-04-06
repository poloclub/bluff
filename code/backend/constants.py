import os


BACKEND_CODE_DIR = os.path.dirname(__file__)
BASE_DIR = os.path.dirname(os.path.dirname(BACKEND_CODE_DIR))
DATA_DIR = os.path.join(BASE_DIR, 'data')

IMAGENET_LABELS_PATH = os.path.join(DATA_DIR, 'imagenet-labels.txt')

ATTACK_STRENGTHS = [n / 100. for n in range(5, 51, 5)]

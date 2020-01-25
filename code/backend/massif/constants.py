import os


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')

TFRECORDS_DIR = os.path.join(DATA_DIR, 'tfrecords')
HDF5_DATA_PATH = os.path.join(DATA_DIR, 'data.h5')

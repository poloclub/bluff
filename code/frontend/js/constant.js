// Class
export var class_pairs = {
  'ambulance': ['street_sign'],
  'brown_bear': ['american_black_bear'],
  'diamondback': ['vine_snake'],
  'giant_panda': ['armadillo'],
  'vine_snake': ['green_snake']
}

// Attack
export var attack_types = ['pgd', 'fgsm']
export var attack_strengths = {
  'pgd': [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50],
  'fgsm': [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50]
}

// Top_k for extracting interesting neurons
export var top_k = 10
export var rough_top_k = 10

// Data directory
export var data_dir = './data' 

// Layer
export var layers = ['mixed5b', 'mixed5a', 'mixed4e', 'mixed4d', 'mixed4c', 'mixed4b', 'mixed4a', 'mixed3b', 'mixed3a']

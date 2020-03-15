// Class
export var class_pairs = {
  'ambulance': ['street_sign'],
  'brown_bear': ['american_black_bear'],
  'diamondback': ['vine_snake'],
  'giant_panda': ['armadillo'],
  'vine_snake': ['green_snake']
}

// Attack
export var attack_types = ['pgd'] // ['pgd', 'fsgm']
export var attack_strengths = {
  'pgd': [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50],
  'fsgm': [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50]
}

// Top_k for extracting interesting neurons
export var top_k = 8
export var rough_top_k = 8
export var highlight_top_k = rough_top_k

// Feature vis / example patches
export var feature_vis_dir = '../../../summit/summit-data/data/feature-vis'







// Other filter information
export var top_ks = Array.from(Array(50).keys()).map(x => x + 1)
export var vulnerabilities = Array.from(Array(20).keys()).map(x => Math.round(x) / 4 + 0.25)
export var default_filters = {'topK': 4, 'vulnerability': 0}

// Bucket information
export var bucket_colors = {
  '1': fullColorHex(131, 170, 225),
  '2': fullColorHex(210, 69, 138),
  '3': fullColorHex(235, 59, 43),
  '4': fullColorHex(178, 227, 89),
  '5': fullColorHex(175, 140, 198),
  '6': fullColorHex(223, 149, 31),
  '7': fullColorHex(253, 205, 59),
}
export var graph_key_to_buckets = {
  'original': [1, 2, 4, 5],
  'attacked': [2, 3, 5, 6],
  'target': [4, 5, 6, 7]
}

// Domain keys
export var x_domain_keys = ['median_activation', 'median_activation_percentile']
export var vulnerability_domain_keys = ['overall_vulnerability', 'strengthwise_vulnerability']


// Layer
export var layers = ['mixed5b', 'mixed5a', 'mixed4e', 'mixed4d', 'mixed4c', 'mixed4b', 'mixed4a', 'mixed3b', 'mixed3a']

// Size info of attribution graph
export var div_width = 300
export var div_height = 600
export var ag_margin = {'top': 50, 'bottom': 50, 'left': 50, 'right': 50}


// Attribution graph margin
var ag_first_margin = 100
var ag_width = 350
var ag_padding = 50

export var ag_margins = {
  'original': ag_first_margin,
  'original-padding': ag_first_margin + ag_width,
  'attacked': ag_first_margin + ag_width + ag_padding,
  'attacked-padding': ag_first_margin + 2 * ag_width + ag_padding,
  'target': ag_first_margin + 2 * ag_width + 2 * ag_padding,
  'total': ag_first_margin + 3 * ag_width + 2 * ag_padding
}



function rgbToHex (rgb) { 
  var hex = Number(rgb).toString(16);
  if (hex.length < 2) {
       hex = "0" + hex;
  }
  return hex;
}

function fullColorHex (r,g,b) {   
  var red = rgbToHex(r);
  var green = rgbToHex(g);
  var blue = rgbToHex(b);
  return '#' + red+green+blue;
}
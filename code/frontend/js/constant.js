// Attack information
export var strengths = {'pgd': [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0]}
export var default_strengths = {'pgd': 0.5}
export var curr_strengths = {'pgd': default_strengths['pgd']}
export var attack_type = 'pgd'

// Other filter information
export var top_ks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
export var vulnerabilities = []
export var curr_filters = {'topK': 7, 'vulnerability': 0.5}
export var default_filters = {'topK': 7, 'vulnerability': 0.5}

export var neuron_img_width = 50
export var neuron_img_height = 50
export var neuron_img_padding = {'top-bottom': 5, 'left-right': 5}

export var layers = ['mixed5b', 'mixed5a', 'mixed4e', 'mixed4d', 'mixed4c', 'mixed4b', 'mixed4a', 'mixed3b', 'mixed3a']

// Size of attribution graph
export var div_width = 300
export var div_height = 600
export var ag_margin = {'top': 50, 'bottom': 50, 'left': 50, 'right': 50}

export var filter_bar_length = 150


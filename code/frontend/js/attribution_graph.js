////////////////////////////////////////////////////////////////////////////////////////////////
// Set data directory
////////////////////////////////////////////////////////////////////////////////////////////////
var node_data_path = '../../data/sample-graphs/sample-node.json'
var file_list = [node_data_path]

////////////////////////////////////////////////////////////////////////////////////////////////
// Global variables
////////////////////////////////////////////////////////////////////////////////////////////////
var layers = ['mixed_4d', 'mixed_4c', 'mixed_4b', 'mixed_4a']
var x_domain_keys = ['median_activation', 'median_activation_percentile']
var vul_type = 'overall_vulnerability'
var bucket_colors = {
  '1': fullColorHex(131, 170, 225),
  '2': fullColorHex(210, 69, 138),
  '3': fullColorHex(235, 59, 97),
  '4': fullColorHex(178, 227, 89),
  '5': fullColorHex(147, 100, 178),
  '6': fullColorHex(233, 159, 61),
  '7': fullColorHex(253, 205, 59),
}
var graph_key_to_buckets = {
  'original': [1, 2, 4, 5],
  'attacked': [2, 3, 5, 6],
  'target': [4, 5, 6, 7]
}

var x_domain_range = {}
var x_scale = {}
var y_scale = {}

var div_width = 300
var div_height = 600
var ag_margin = {'top': 50, 'bottom': 50, 'left': 50, 'right': 50}

var node_size_range = [15, 50]
var node_size_scale = null

////////////////////////////////////////////////////////////////////////////////////////////////
// Main part for drawing the attribution graphs 
////////////////////////////////////////////////////////////////////////////////////////////////
Promise.all(file_list.map(file => d3.json(file))).then(function(data) { 

  // Read the sample neurons
  var node_data = data[0]
  console.log(node_data)

  // Generate x, y scale
  x_domain_range['original'] = get_x_domain_range('original', node_data, attack_type, curr_eps)
  x_scale['original'] = gen_x_scale('original', attack_type, curr_eps)
  epss.forEach(eps => {
    var value_key = get_value_key('attacked', attack_type, eps)
    x_domain_range[value_key] = get_x_domain_range('attacked', node_data, attack_type, eps)
    x_scale[value_key] = gen_x_scale('attacked', attack_type, eps)
  })
  y_scale = gen_y_scale()

  // Generate node size scale 
  // TODO: need to get max, min vulnerability for all neurons
  node_size_scale = d3
    .scaleLinear()
    .domain([0, 90])
    .range(node_size_range)
  
  // Draw attribution graphs
  draw_neurons('original', node_data, x_domain_keys[0], attack_type, curr_eps, vul_type)
  draw_neurons('attacked', node_data, x_domain_keys[0], attack_type, curr_eps, vul_type)
  
})

function draw_neurons(graph_key, node_data, domain_key, attack_type, eps, vul_type) {
  
  // Draw neurons
  layers.forEach(layer => {
    
    d3.select('#g-ag-' + graph_key)
      .selectAll('g')
      .data(filter_nodes(graph_key, layer, eps))
      .enter()
      .append('rect')
      .attr('id', function(d) { return node_id(d) })
      .attr('width', function(d) { return node_size(d) })
      .attr('height', function(d) { return node_size(d) })
      .attr('x', function(d) { return x_coord_node(d, layer) })
      .attr('y', function(d) { return y_coord_node(d, layer) })
      .attr('rx', function(d) { return 0.3 * node_size(d) })
      .attr('fill', function(d) { return node_color(d) })

  })

  // Function for filtering the data by graph_key
  function filter_nodes(graph_key, layer, eps) {
    var filtered_nodes = d3
      .entries(node_data[layer])
      .filter(function(d) {
        var bucket = d['value']['buckets'][attack_type][eps.toFixed(1)]
        return graph_key_to_buckets[graph_key].includes(bucket)
      })
    return filtered_nodes
  }

  // Function for generate node id
  function node_id(d) {
    return ['node', d['key']].join('-')
  }

  // Functions for setting x, coordinates of a neuron
  function x_coord_node(d, layer) {
    var value_key = get_value_key(graph_key, attack_type, eps)
    var x_domain_val = d['value'][value_key][domain_key]
    var x_coord = x_scale[value_key][layer][domain_key](x_domain_val)
    return x_coord
  }

  function y_coord_node(d, layer) {
    var id = node_id(d)
    var height = parseFloat(d3.select('#' + id).attr('height'))
    var starting_y = y_scale(layer)
    return starting_y - height / 2
  }
  
  // Function for the size of neuron
  function node_size(d) {
    return node_size_scale(d['value'][vul_type][attack_type])
  }

  // Function for node color
  function node_color(d) {
    var bucket = String(d['value']['buckets'][attack_type][(eps).toFixed(1)])
    return bucket_colors[bucket]
  }
}

function get_value_key(graph_key, attack_type, eps) {
  var value_key = graph_key
  if (graph_key == 'attacked') {
    value_key = [graph_key, attack_type, eps.toFixed(2)].join('-')
  }
  return value_key
}

function get_x_domain_range(graph_key, node_data, attack_type, eps) {
  var value_key = get_value_key(graph_key, attack_type, eps)
  
  // Initialize x_range
  var x_range = {}

  // Get the x_range
  layers.forEach(layer => {

    // Initialize x_range in the current layer
    x_range[layer] = {}
    x_domain_keys.forEach(x_domain_key => {
      x_range[layer][x_domain_key] = [10000, -10000]
    })

    // Get x_range in the current layer
    var neurons = Object.keys(node_data[layer])
    neurons.forEach(neuron => {
      x_domain_keys.forEach(x_domain_key => {
        let curr_x_val = node_data[layer][neuron][value_key][x_domain_key]
        let prev_x_val_min = x_range[layer][x_domain_key][0]
        let prev_x_val_max = x_range[layer][x_domain_key][1]

        if (curr_x_val < prev_x_val_min) {
          x_range[layer][x_domain_key][0] = curr_x_val
        }

        if (curr_x_val > prev_x_val_max) {
          x_range[layer][x_domain_key][1] = curr_x_val
        }
      })
      
    })
  })

  return x_range
}

function gen_x_scale(graph_key, attack_type, eps) {
  // Get the value_key
  var value_key = get_value_key(graph_key, attack_type, eps)
  
  // Initialize x_scale for the given graph_key
  var x_scale_graph = {}

  // Generate x_scale for every layers
  layers.forEach(layer => {
    x_scale_graph[layer] = {}
    x_domain_keys.forEach(x_domain_key => {
      x_scale_graph[layer][x_domain_key] = d3
        .scaleLinear()
        .domain(x_domain_range[value_key][layer][x_domain_key])
        .range([ag_margin['left'], div_width - ag_margin['right']])
    })
  })

  return x_scale_graph
}

function gen_y_scale() {
  var num_layers = layers.length

  if (num_layers == 1) {
    var y_scale_layers = d3
      .scaleOrdinal()
      .domain(layers)
      .range([div_height / 2])
    return y_scale_layers
  
  } else {
    var unit_space = (div_height - ag_margin['top'] - ag_margin['bottom']) / (num_layers - 1)
    var y_scale_layers = d3
      .scaleOrdinal()
      .domain(layers)
      .range(Array.from(new Array(num_layers), (val, i) => (ag_margin['top'] + i * unit_space)))
    return y_scale_layers
  }

}

function get_css_val(css_key) {
  return getComputedStyle(document.body).getPropertyValue(css_key)
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
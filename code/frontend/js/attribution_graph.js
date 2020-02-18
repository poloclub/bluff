import { attack_type, curr_eps, epss } from './top_control.js';
import { layers, div_width, div_height, ag_margin } from './constant.js';

////////////////////////////////////////////////////////////////////////////////////////////////
// Set data directory
////////////////////////////////////////////////////////////////////////////////////////////////
var node_data_path = '../../data/sample-graphs/sample-node.json'
var file_list = [node_data_path]

////////////////////////////////////////////////////////////////////////////////////////////////
// Global variables
////////////////////////////////////////////////////////////////////////////////////////////////
var node_data;
var x_domain_keys = ['median_activation', 'median_activation_percentile']
var vul_type = 'overall_vulnerability'
var bucket_colors = {
  '1': fullColorHex(131, 170, 225),
  '2': fullColorHex(210, 69, 138),
  '3': fullColorHex(235, 59, 43),
  '4': fullColorHex(178, 227, 89),
  '5': fullColorHex(175, 140, 198),
  '6': fullColorHex(223, 149, 31),
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

var node_size_range = [15, 50]
var node_size_scale = null
var jitter_strength = 15
var x_coordinate_duration = 1500

////////////////////////////////////////////////////////////////////////////////////////////////
// Main part for drawing the attribution graphs 
////////////////////////////////////////////////////////////////////////////////////////////////
Promise.all(file_list.map(file => d3.json(file))).then(function(data) { 

  // Read the sample neurons
  node_data = data[0]
  console.log(node_data)

  // Generate x, y scale
  gen_x_y_scales()

  // Generate node size scale 
  gen_node_size_scale()

  // Draw nodes in the attribution graphs
  draw_neurons_all_graph_key()

})

function gen_x_y_scales() {
  x_domain_range['original'] = get_x_domain_range('original', node_data, attack_type, curr_eps)
  x_scale['original'] = gen_x_scale('original', attack_type, curr_eps)
  x_domain_range['target'] = get_x_domain_range('target', node_data, attack_type, curr_eps)
  x_scale['target'] = gen_x_scale('target', attack_type, curr_eps)
  epss.forEach(eps => {
    var value_key = get_value_key('attacked', attack_type, eps)
    x_domain_range[value_key] = get_x_domain_range('attacked', node_data, attack_type, eps)
    x_scale[value_key] = gen_x_scale('attacked', attack_type, eps)
  })
  y_scale = gen_y_scale()
}

function gen_node_size_scale() {
  // TODO: need to get max, min vulnerability for all neurons
  node_size_scale = d3
    .scaleLinear()
    .domain([0, 90])
    .range(node_size_range)
}

function filter_nodes(graph_key, layer, eps, node_data) {
  var filtered_nodes = d3
    .entries(node_data[layer])
    .filter(function(d) {
      var bucket = d['value']['buckets'][attack_type][eps.toFixed(1)]
      return graph_key_to_buckets[graph_key].includes(bucket)
    })
  return filtered_nodes
}

function draw_neurons(graph_key, layer, filtered_node_data, domain_key, attack_type, eps, vul_type) {

  // Filter out nodes that has already been displayed
  var node_to_be_not_displayed = filter_out_node_already_displayed()
  
  // Draw neurons
  d3.select('#g-ag-' + graph_key)
    .selectAll('g')
    .data(filtered_node_data)
    .enter()
    .append('rect')
    .attr('id', function(d) { return gen_node_id(d, graph_key) })
    .attr('class', 'node-' + graph_key)
    .attr('width', function(d) { return node_size(d) })
    .attr('height', function(d) { return node_size(d) })
    .attr('x', function(d) { return x_coord_node(d, layer, graph_key, eps, domain_key) })
    .attr('y', function(d) { return y_coord_node(d, layer) })
    .attr('rx', function(d) { return 0.3 * node_size(d) })
    .attr('fill', function(d) { return node_color(d) })
    .style('display', function(d) { return display_node(d) })

  // Function to filter out nodes that already displayed
  function filter_out_node_already_displayed() {
    var node_to_be_not_displayed = []
    filtered_node_data = filtered_node_data.filter(function(d) {
      var neuron_id = d['key']
      var node_id = ['node', graph_key, neuron_id].join('-')
      if (!does_exist(node_id) && eps != curr_eps) {
        node_to_be_not_displayed.push(node_id)
      } 
      return !does_exist(node_id)
    })
    return node_to_be_not_displayed
  }

  // Function for setting x coordinate of a neuron
  function x_coord_node(d, layer) {
    var value_key = get_value_key(graph_key, attack_type, eps)
    var x_domain_val = d['value'][value_key][domain_key]
    var x_coord = x_scale[value_key][layer][domain_key](x_domain_val)
    return x_coord
  }

  // Function for setting y coordinate of a neuron
  function y_coord_node(d, layer) {
    var id = gen_node_id(d, graph_key)
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

  // Function for setting display of a node
  function display_node(d) {
    var id = gen_node_id(d, graph_key)
      if (node_to_be_not_displayed.includes(id)){
        return 'none'
      } else {
        return 'block'
      }
  }
}

function draw_neurons_all_graph_key() {
  var original_target = ['original', 'target']
  original_target.forEach(graph_key => {
    layers.forEach(layer => {
      var filtered_nodes = filter_nodes(graph_key, layer, curr_eps, node_data)
      draw_neurons(graph_key, layer, filtered_nodes, x_domain_keys[0], attack_type, curr_eps, vul_type)
    })
    jitter_neurons(graph_key, node_data, x_domain_keys[0], attack_type, curr_eps, vul_type)
  })
  var graph_key = 'attacked'
  epss.forEach(eps => {
    layers.forEach(layer => {
      var filtered_nodes = filter_nodes(graph_key, layer, eps, node_data)
      draw_neurons(graph_key, layer, filtered_nodes, x_domain_keys[0], attack_type, eps, vul_type)
    })
    jitter_neurons(graph_key, node_data, x_domain_keys[0], attack_type, curr_eps, vul_type)
  })
}

export function update_neurons_with_new_strength() {
  update_neurons_with_new_strength_by_graph_key('original')
  update_neurons_with_new_strength_by_graph_key('attacked')
  update_neurons_with_new_strength_by_graph_key('target')
}

function update_neurons_with_new_strength_by_graph_key(graph_key) {
  
  // Update the node color
  d3.selectAll('.node-' + graph_key)
    .attr('fill', function(d) {
      var bucket = d['value']['buckets'][attack_type][curr_eps.toFixed(1)] 
      return bucket_colors[bucket]
    })

  
  if (graph_key == 'attacked') {
    // Display setting update of nodes in adversarial graph
    var filtered_neurons = []
    layers.forEach(layer => {
      var filtered_nodes = filter_nodes(graph_key, layer, curr_eps, node_data)
      filtered_neurons = filtered_neurons.concat(filtered_nodes.map(x => x['key']))
    })

    d3.selectAll('.node-' + graph_key)
      .style('display', function(d) {
        var neuron_id = d['key']
        if (filtered_neurons.includes(neuron_id)) {
          return 'block'
        } else {
          return 'none'
        }
      })

    // Update the nodes' x_coordinates 
    jitter_neurons(graph_key, node_data, x_domain_keys[0], attack_type, curr_eps, vul_type)
  }

}

// Function for generate node id
function gen_node_id(d, graph_key) {
  return ['node', graph_key, d['key']].join('-')
}

function jitter_neurons(graph_key, node_data, domain_key, attack_type, eps, vul_type) {
  // Get the value key
  var value_key = get_value_key(graph_key, attack_type, eps)

  // Get the node margin before rescaled by juttering
  var node_margin = jitter_strength

  layers.forEach(layer => {
    // Sort the neurons based on the domain values for the original x coords
    // XXX sorting could be slow if we have many neurons
    var filtered_nuerons = filter_nodes(graph_key, layer, eps, node_data)
    filtered_nuerons = filtered_nuerons.sort(function (a, b) {
      var val_a = a['value'][value_key][domain_key]
      var val_b = b['value'][value_key][domain_key]
      return d3.ascending(val_a, val_b)
    })

    // Get adjusted jittered x coordinates
    var adjusted_x_coord = {}
    var adjusted_x_range = [1000, 0]
    var prev_end_x_coord = 0
    filtered_nuerons.forEach(d => {
      var neuron = d['key']
      var node = d3.select('#' + gen_node_id(d, graph_key))
      var x_coord = parseFloat(node.attr('x'))
      var width = parseFloat(node.attr('width'))
      
      if (prev_end_x_coord + node_margin > x_coord) {
        x_coord = prev_end_x_coord + node_margin
      }
      adjusted_x_coord[neuron] = x_coord
      adjusted_x_range[0] = d3.min([adjusted_x_range[0], x_coord])
      adjusted_x_range[1] = d3.max([adjusted_x_range[1], x_coord])
      prev_end_x_coord = x_coord + width
    })

    // Compute a new scale for rescaling
    var rescale = d3
      .scaleLinear()
      .domain(adjusted_x_range)
      .range([0, div_width - ag_margin['right']])

    // Jittering
    filtered_nuerons.forEach(d => {
      var neuron = d['key']
      d3.select('#' + gen_node_id(d, graph_key))
        .transition()
        .duration(x_coordinate_duration)
        .attr('x', function(d) { return rescale(adjusted_x_coord[neuron]) })
    })
  })
  
}

// Functions for getting x coordinate of a neuron
function x_coord_node(d, layer, graph_key, eps, domain_key) {
  var value_key = get_value_key(graph_key, attack_type, eps)
  var x_domain_val = d['value'][value_key][domain_key]
  var x_coord = x_scale[value_key][layer][domain_key](x_domain_val)
  return x_coord
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
    var filtered_nodes = filter_nodes(graph_key, layer, eps, node_data)

    // Initialize x_range in the current layerㅁ
    x_range[layer] = {}
    x_domain_keys.forEach(x_domain_key => {
      x_range[layer][x_domain_key] = [10000, -10000]
    })

    // Get x_range in the current layer
    filtered_nodes.forEach(filtered_node => {
      x_domain_keys.forEach(x_domain_key => {
        let curr_x_val = filtered_node['value'][value_key][x_domain_key]
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
        .range([0, div_width - ag_margin['right']])
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

function does_exist(id) {
  var element = document.getElementById(id)
  if (element) {
    return true
  } else {
    return false
  }
}
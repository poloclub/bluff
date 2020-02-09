
////////////////////////////////////////////////////////////////////////////////////////////////
// Set data directory
////////////////////////////////////////////////////////////////////////////////////////////////
var node_data_path = '../../data/sample-graphs/sample-node.json'
var file_list = [node_data_path]

////////////////////////////////////////////////////////////////////////////////////////////////
// Global variables
////////////////////////////////////////////////////////////////////////////////////////////////
var layers = ['mixed_4b', 'mixed_4a']
var x_domain_keys = ['median_activation', 'median_activation_percentile']
var vul_type = 'overall_vulnerability'
var bucket_colors = {
  '1': '#5ab4ac',
  '2': '#af8dc3',
  '3': '#b2182b',
  '4': '#c7eae5',
  '5': '#ffffbf',
  '6': '#ef8a62',
  '7': '#d9ef8b'
}

var x_domain_range = {}
var x_scale = {}
var y_scale = {}

var div_width = 300
var div_height = 600
var ag_margin = {'top': 50, 'bottom': 50, 'left': 50, 'right': 50}

////////////////////////////////////////////////////////////////////////////////////////////////
// Main part for drawing the attribution graphs 
////////////////////////////////////////////////////////////////////////////////////////////////
Promise.all(file_list.map(file => d3.json(file))).then(function(data) { 

  // Read the sample neurons
  var node_data = data[0]
  console.log(node_data)

  // Generate x, y scale
  x_domain_range['original'] = get_x_domain_range('original', node_data)
  x_scale['original'] = gen_x_scale('original')
  y_scale = gen_y_scale()
  
  // Draw attribution graphs
  draw_neurons('original', node_data, x_domain_keys[0], attack_type, curr_eps, vul_type)
  
})

function draw_neurons(graph_key, node_data, domain_key, attack_type, eps, vul_type) {
  
  // Draw neurons
  layers.forEach(layer => {
    
    d3.select('#g-ag-' + graph_key)
      .selectAll('g')
      .data(filter_nodes(graph_key, layer))
      .enter()
      .append('rect')
      .attr('id', function(d) { return ['node', d['key']].join('-') })
      .attr('width', function(d) { return node_size(d) })
      .attr('height', function(d) { return node_size(d) })
      .attr('x', function(d) { return x_coord_node(d, layer) })
      .attr('y', y_scale(layer))
      .attr('rx', function(d) {return 0.3 * node_size(d)})
      .attr('fill', function(d) {
        var bucket = String(d['value']['buckets'][attack_type][(eps).toFixed(1)])
        return bucket_colors[bucket]
      })

  })

  // Functions for filtering the data
  function filter_nodes(graph_key, layer) {
    var filtered_nodes = d3
      .entries(node_data[layer])
      .filter(function(d) {
        if (graph_key == 'original') {
          return is_original(d)
        }
      })
    return filtered_nodes
  }

  function is_original(d) {
    var bucket = d['value']['buckets'][attack_type]['0.0']
    if ([1, 2, 4, 5].includes(bucket)) {
      return true
    } 
    return false
  }

  // Functions for setting x coordinate of a neuron
  function x_coord_node(d, layer) {
    var x_domain_val = d['value'][graph_key][domain_key]
    var x_coord = x_scale[graph_key][layer][domain_key](x_domain_val)
    return x_coord
  }

  // Function for the size of neuron
  function node_size(d) {
    return 0.4 * d['value'][vul_type][attack_type]
  }
}

function get_x_domain_range(graph_key, node_data) {
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
    console.log(node_data, layer)
    console.log(node_data[layer])
    var neurons = Object.keys(node_data[layer])
    neurons.forEach(neuron => {
      x_domain_keys.forEach(x_domain_key => {
        let curr_x_val = node_data[layer][neuron][graph_key][x_domain_key]
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

function gen_x_scale(graph_key) {
  // Initialize x_scale for the given graph_key
  var x_scale_graph = {}

  // Generate x_scale for every layers
  layers.forEach(layer => {
    x_scale_graph[layer] = {}
    x_domain_keys.forEach(x_domain_key => {
      x_scale_graph[layer][x_domain_key] = d3
        .scaleLinear()
        .domain(x_domain_range[graph_key][layer][x_domain_key])
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
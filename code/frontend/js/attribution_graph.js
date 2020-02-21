import { 
  layers, 
  div_width, 
  div_height, 
  ag_margin,
  attack_types,
  bucket_colors,
  x_domain_keys,
  vulnerability_domain_keys,
  strengths,
  graph_key_to_buckets
} from './constant.js';

import { 
  curr_attack_type,
  curr_strengths,
  curr_filters 
 } from './top_control.js'

////////////////////////////////////////////////////////////////////////////////////////////////
// Set data directory
////////////////////////////////////////////////////////////////////////////////////////////////
var neuron_data_dir = '../../../massif/neurons/'
var activation_data_path = neuron_data_dir + 'neuron_data-giant_panda-armadillo-pgd.json'
var vulnerability_data_path = neuron_data_dir + 'neuron_vulnerabilities-giant_panda-armadillo-pgd.json'
var top_neuron_data_path = neuron_data_dir + 'top_neurons-giant_panda-armadillo-pgd.json'
var file_list = [activation_data_path, vulnerability_data_path, top_neuron_data_path]

////////////////////////////////////////////////////////////////////////////////////////////////
// Global variables
////////////////////////////////////////////////////////////////////////////////////////////////
var activation_data = {}
var vulnerability_data = {}
var top_neuron_data = {}
var vul_type = 'strengthwise_vulnerability'

var x_domain_range = {}
var vulnerability_range = {}
var x_scale = {}
var y_scale = {}

var node_size_range = [7, 30]
var node_size_scale = {}
var jitter_strength = 0
var x_coordinate_duration = 1500

////////////////////////////////////////////////////////////////////////////////////////////////
// Main part for drawing the attribution graphs 
////////////////////////////////////////////////////////////////////////////////////////////////
Promise.all(file_list.map(file => d3.json(file))).then(function(data) { 

  // Read the neuron data
  activation_data = data[0]
  vulnerability_data = data[1]
  top_neuron_data = data[2]

  // Parse vulnerability data
  parse_vulnerability_data()
  var sorted_vulnerability_data = sort_vulnerability_data()
  window.activation_data = activation_data
  window.vulnerability_data = vulnerability_data
  window.top_neuron_data = top_neuron_data
  window.sorted_vulnerability_data = sorted_vulnerability_data

  // Generate x, y scale
  gen_x_y_scales()

  // Generate node size scale 
  gen_node_size_scale()

  // Draw nodes in the attribution graphs
  draw_neurons_all_graph_key()

})

////////////////////////////////////////////////////////////////////////////////////////////////
// Parse dataset
////////////////////////////////////////////////////////////////////////////////////////////////
function parse_vulnerability_data() {
  layers.forEach(layer => {
    for (var neuron in vulnerability_data[layer]) {
      attack_types.forEach(attack_type => {
        var accumulated_vul = 0
        strengths[attack_type].forEach((strength, i) => {
          var value_key = get_value_key('attacked', attack_type, strength)
          var curr_strengthwise_vul = vulnerability_data[layer][neuron]['strengthwise_vulnerability'][attack_type][value_key]
          accumulated_vul += curr_strengthwise_vul
          vulnerability_data[layer][neuron]['strengthwise_vulnerability'][attack_type][value_key] = accumulated_vul 
        })
        
      })
    }
  })
}

function sort_vulnerability_data() {
  // Sort neurons by overall vulnerability
  var sorted_vulnerability_data = {}
  attack_types.forEach(attack_type => {
    sorted_vulnerability_data[attack_type] = {}
    layers.forEach(layer => {
      sorted_vulnerability_data[attack_type][layer] = Object
        .keys(vulnerability_data[layer])
        .map(function(key) {
          return [key, vulnerability_data[layer][key]]
        })
      sorted_vulnerability_data[attack_type][layer].sort(function(a, b) {
        var a_overall_vul = a[1]['overall_vulnerability'][attack_type]
        var b_overall_vul = b[1]['overall_vulnerability'][attack_type]
        return b_overall_vul - a_overall_vul
      })

    })
  })
  return sorted_vulnerability_data
}

////////////////////////////////////////////////////////////////////////////////////////////////
// General functions for the interface
////////////////////////////////////////////////////////////////////////////////////////////////

function neuron_to_bucket(neuron_id, layer, top_k, attack_type) {
  
  var layer = neuron_id.split('-')[0]

  // See if the neuron is in the original graph's top neuron list
  var is_in_original = is_in_topk('original')

  // See if the neuron is in the attacked graph's top neuron list
  var is_in_attacked = false
  if (curr_strengths[attack_type] != 0) {
    var attacked_key = ['attacked', attack_type, curr_strengths[attack_type].toFixed(2)].join('-')
  is_in_attacked = is_in_topk(attacked_key)
  }

  // See if the neuron is in the target graph's top neuron list
  var is_in_target = is_in_topk('target')

  // Get the bucket
  var bucket = get_bucket_from_belongings(is_in_original, is_in_attacked, is_in_target)
  return bucket

  function is_in_topk(key) {
    return top_neuron_data[layer][key]
      .slice(0, top_k)
      .includes(neuron_id)
  }

  function get_bucket_from_belongings(is_in_original, is_in_attacked, is_in_target) {
    // Bucket 1
    if (is_in_original && !is_in_attacked && !is_in_target) {
      return 1
    }

    // Bucket 2
    if (is_in_original && is_in_attacked && !is_in_target) {
      return 2
    }

    // Bucket 3
    if (!is_in_original && is_in_attacked && !is_in_target) {
      return 3
    }

    // Bucket 4
    if (is_in_original && !is_in_attacked && is_in_target) {
      return 4
    }

    // Bucket 5
    if (is_in_original && is_in_attacked && is_in_target) {
      return 5
    }

    // Bucket 6
    if (!is_in_original && is_in_attacked && is_in_target) {
      return 6
    }

    // Bucket 7
    if (!is_in_original && !is_in_attacked && is_in_target) {
      return 7
    } 

    // Not included in any bucket
    return -1

  }
  
}

function filter_activations(graph_key, layer, top_k, attack_type, strength) {
  // Filter nodes' activation based on top neuron list

  var value_key = get_value_key(graph_key, attack_type, strength)

  var filtered_nodes = d3
    .entries(activation_data[layer])
    .filter(function(d) {
      var neuron_id = d['key']
      return top_neuron_data[layer][value_key].slice(0, top_k).includes(neuron_id)
    })
  
  return filtered_nodes
}

function get_value_key(graph_key, attack_type, strength) {
  // console.log(strength)
  var value_key = graph_key
  if (graph_key == 'attacked') {
    value_key = [graph_key, attack_type, strength.toFixed(2)].join('-')
  }
  return value_key
}

function does_exist(id) {
  var element = document.getElementById(id)
  if (element) {
    return true
  } else {
    return false
  }
}

function is_displayed(id) {
  var element = document.getElementById(id)
  if (element.style.display == 'none') {
    return false
  } else {
    return true
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////
// Functions for generating x, y scales
////////////////////////////////////////////////////////////////////////////////////////////////

function gen_x_y_scales() {

  // Generate x scale for original class
  x_domain_range['original'] = get_x_domain_range('original')
  x_scale['original'] = gen_x_scale('original')

  // Generate x scale for target class
  x_domain_range['target'] = get_x_domain_range('target')
  x_scale['target'] = gen_x_scale('target')

  attack_types.forEach(attack_type => {
    strengths[attack_type].forEach(strength => {
      var value_key = get_value_key('attacked', attack_type, strength)
      x_domain_range[value_key] = get_x_domain_range('attacked', attack_type, strength)
      x_scale[value_key] = gen_x_scale('attacked', attack_type, strength)
    })
  })

  // Generate y scale
  y_scale = gen_y_scale()
}

function get_x_domain_range(graph_key, attack_type, strength) {
  /*
  Get the range of domain values
  - input 
    + graph_key: one of ['original', 'adversarial', 'target']
    + attack_type: attack type
    + strength: the strength of attack
  */

  // Get the value key to access to the activation values
  var value_key = get_value_key(graph_key, attack_type, strength)
  
  // Initialize x_range
  var x_range = {}

  // Get the x_range
  layers.forEach(layer => {
    var filtered_nodes = filter_activations(graph_key, layer, 100, attack_type, strength)

    // Initialize x_range in the current layer
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

function gen_x_scale(graph_key, attack_type, strength) {

  // Get the value_key
  var value_key = get_value_key(graph_key, attack_type, strength)
  
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
  var unit_space = (div_height - ag_margin['top'] - ag_margin['bottom']) / (num_layers - 1)
  var y_scale_layers = d3
    .scaleOrdinal()
    .domain(layers)
    .range(Array.from(new Array(num_layers), (val, i) => (ag_margin['top'] + i * unit_space)))
  return y_scale_layers
}

////////////////////////////////////////////////////////////////////////////////////////////////
// Functions for generating vulnerability scales
////////////////////////////////////////////////////////////////////////////////////////////////

function gen_node_size_scale() {
  vulnerability_range = get_vulnerability_range()
  gen_node_size_scale()

  function gen_node_size_scale() {
    // Generate node size scale for all layer
    node_size_scale['all'] = {'overall_vulnerability': {}, 'strengthwise_vulnerability': {}}
    attack_types.forEach(attack_type => {

      // Overall vulnerability, all layer
      node_size_scale['all']['overall_vulnerability'][attack_type] = d3
        .scaleLinear()
        .domain(vulnerability_range['all']['overall_vulnerability'][attack_type])
        .range(node_size_range)
      
      // Strengthwise vulnerability, all layer
      strengths[attack_type].forEach(strength => {
        var value_key = get_value_key('attacked', attack_type, strength)
        node_size_scale['all']['strengthwise_vulnerability'][value_key] = d3
          .scaleLinear()
          .domain(vulnerability_range['all']['strengthwise_vulnerability'][value_key])
          .range(node_size_range)
      })
    })

    // Generate node size scale for layer by layer
    layers.forEach(layer => {
      node_size_scale[layer] = {'overall_vulnerability': {}, 'strengthwise_vulnerability': {}}
      attack_types.forEach(attack_type => {

        // Overall vulnerability, layer-by-layer
        node_size_scale[layer]['overall_vulnerability'][attack_type] = d3
          .scaleLinear()
          .domain(vulnerability_range[layer]['overall_vulnerability'][attack_type])

        // Strengthwise vulnerability, layer-by-layer
        strengths[attack_type].forEach(strength => {
          var value_key = get_value_key('attacked', attack_type, strength)
          node_size_scale[layer]['strengthwise_vulnerability'][value_key] = d3
            .scaleLinear()
            .domain(vulnerability_range[layer]['strengthwise_vulnerability'][value_key])
        })
      })
    })
  }

}

function get_vulnerability_range() {
  vulnerability_range = init_vul_range_dict()

  layers.forEach(layer => {
    for (var neuron_id in vulnerability_data[layer]) {
      attack_types.forEach(attack_type => {
        update_overall_vulnerability (layer, neuron_id, attack_type)
        update_strengthwise_vulnerability (layer, neuron_id, attack_type)
      })
    }
  })

  return vulnerability_range

  function init_vul_range_dict() {
    var vulnerability_range = {}

    // Vulnerability range of all layer
    vulnerability_range['all'] = {}
    vulnerability_range['all']['overall_vulnerability'] = {}
    vulnerability_range['all']['strengthwise_vulnerability'] = {}
    attack_types.forEach(attack_type => {
      vulnerability_range['all']['overall_vulnerability'][attack_type] = [1000, -1000]
      strengths[attack_type].forEach(strength => {
        var value_key = get_value_key('attacked', attack_type, strength)
        vulnerability_range['all']['strengthwise_vulnerability'][value_key] = [1000, -1000]
      })
    })

    // Vulnerability range of layer by layer
    layers.forEach(layer => {
      vulnerability_range[layer] = {}
      vulnerability_domain_keys.forEach(vulnerability_key => {
        vulnerability_range[layer][vulnerability_key] = {}
      })
      attack_types.forEach(attack_type => {
        vulnerability_range[layer]['overall_vulnerability'][attack_type] = [1000, -1000]
        strengths[attack_type].forEach(strength => {
          var value_key = get_value_key('attacked', attack_type, strength)
          vulnerability_range[layer]['strengthwise_vulnerability'][value_key] = [1000, -1000]
        })
      })
    })
    return vulnerability_range
  }

  function update_overall_vulnerability (layer, neuron_id, attack_type) {
    // Get the current overall vulnerability
    var overall_vul = vulnerability_data[layer][neuron_id]['overall_vulnerability'][attack_type]

    // Update overall vulnerability of all layer
    var min_all_overall_vul = vulnerability_range['all']['overall_vulnerability'][attack_type][0]
    var max_all_overall_vul = vulnerability_range['all']['overall_vulnerability'][attack_type][1]
    if (min_all_overall_vul > overall_vul) {
      vulnerability_range['all']['overall_vulnerability'][attack_type][0] = overall_vul
    }
    if (max_all_overall_vul < overall_vul) {
      vulnerability_range['all']['overall_vulnerability'][attack_type][1] = overall_vul
    }

    // Update overall vulnerability of each layer
    var min_overall_vul = vulnerability_range[layer]['overall_vulnerability'][attack_type][0]
    var max_overall_vul = vulnerability_range[layer]['overall_vulnerability'][attack_type][1]
    if (min_overall_vul > overall_vul) {
      vulnerability_range[layer]['overall_vulnerability'][attack_type][0] = overall_vul
    }
    if (max_overall_vul < overall_vul) {
      vulnerability_range[layer]['overall_vulnerability'][attack_type][1] = overall_vul
    }
  }

  function update_strengthwise_vulnerability (layer, neuron_id, attack_type) {
    strengths[attack_type].forEach(strength => {
      // Get the value key
      var value_key = get_value_key('attacked', attack_type, strength)

      // Get the current strengthwise vulnerability
      var strengthwise_vul = vulnerability_data[layer][neuron_id]['strengthwise_vulnerability'][attack_type][value_key]
      
      // Update the strengthwise vulnerability of all layer
      var min_all_strengthwise_vul = vulnerability_range['all']['strengthwise_vulnerability'][value_key][0]
      var max_all_strengthwise_vul = vulnerability_range['all']['strengthwise_vulnerability'][value_key][1]
      if (min_all_strengthwise_vul > strengthwise_vul) {
        vulnerability_range['all']['strengthwise_vulnerability'][value_key][0] = strengthwise_vul
      }
      if (max_all_strengthwise_vul < strengthwise_vul) {
        vulnerability_range['all']['strengthwise_vulnerability'][value_key][1] = strengthwise_vul
      }

      // Update the strengthwise vulnerability of lthe current layer
      var min_strengthwise_vul = vulnerability_range[layer]['strengthwise_vulnerability'][value_key][0]
      var max_strengthwise_vul = vulnerability_range[layer]['strengthwise_vulnerability'][value_key][1]
      if (min_strengthwise_vul > strengthwise_vul) {
        vulnerability_range[layer]['strengthwise_vulnerability'][value_key][0] = strengthwise_vul
      }
      if (max_strengthwise_vul < strengthwise_vul) {
        vulnerability_range[layer]['strengthwise_vulnerability'][value_key][1] = strengthwise_vul
      }
      
    })
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////
// Functions for drawing neurons
////////////////////////////////////////////////////////////////////////////////////////////////

function gen_node_id(neuron_id, graph_key) {
  return ['node', graph_key, neuron_id].join('-')
}

function draw_neurons_all_graph_key() {
  // Draw neurons of original and target class
  var original_target = ['original', 'target']
  original_target.forEach(graph_key => {
    layers.forEach(layer => {
      var filtered_activations = filter_activations(graph_key, layer, 100)
      draw_neurons(graph_key, 
                  layer, 
                  filtered_activations, 
                  x_domain_keys[0], 
                  curr_strengths[curr_attack_type])
    })
    jitter_neurons(graph_key)
  })

  // Draw neurons in adverrsarial graph
  var graph_key = 'attacked'
  strengths[curr_attack_type].forEach(strength => {
    layers.forEach(layer => {
      var filtered_activations = filter_activations(graph_key, 
                                                    layer, 
                                                    100, 
                                                    curr_attack_type, 
                                                    curr_strengths[curr_attack_type])
      draw_neurons(graph_key, 
                  layer, 
                  filtered_activations, 
                  x_domain_keys[0],
                  strength)
    })
    jitter_neurons(graph_key)
  })
}

function draw_neurons(graph_key, layer, filtered_activations, domain_key, strength) {

  // Get neurons excluding already-drawn ones
  var more_filtered_activations = filtered_activations.filter(function(d) {
    var neuron_id = d['key']
    var node_id = gen_node_id(neuron_id, graph_key)
    if (does_exist(node_id)) {
      return false
    } else {
      return true
    }
  })

  // Draw neurons
  d3.select('#g-ag-' + graph_key)
    .selectAll('g')
    .data(more_filtered_activations)
    .enter()
    .append('rect')
    .attr('id', function(d) { return gen_node_id(d['key'], graph_key) })
    .attr('class', function() { return node_class() })
    .attr('width', function(d) { return node_size(d, graph_key, strength) })
    .attr('height', function(d) { return node_size(d, graph_key, strength) })
    .attr('x', function(d) { return x_coord_node(d, graph_key, strength, domain_key) })
    .attr('y', function(d) { return y_coord_node(d, graph_key) })
    .attr('rx', function(d) { return 0.3 * node_size(d, graph_key, strength) })
    .attr('fill', function(d) { return node_color(d) })
    .style('display', function(d) { return display_node(d) })

  // Function for node class
  function node_class() {
    var class1 = 'node'
    var class2 = ['node', graph_key].join('-')
    var class3 = ['node', graph_key, layer].join('-')
    return [class1, class2, class3].join(' ')
  }

  // Function for node color
  function node_color(d) {
    var bucket = neuron_to_bucket(d['key'], layer, curr_filters['topK'], curr_attack_type)
    return bucket_colors[bucket]
  }

  // Function for setting display of a node
  function display_node(d) {
    var neuron_id = d['key']
    
    var value_key = get_value_key(graph_key, curr_attack_type, curr_strengths[curr_attack_type])
    var top_neurons = top_neuron_data[layer][value_key].slice(0, curr_filters['topK'])
    if ((strength == curr_strengths[curr_attack_type]) && top_neurons.includes(neuron_id)){
      return 'block'
    } else {
      return 'none'
    }
  }
}

// Function for the size of neuron based on the vulnerability
function node_size(d, graph_key, strength) {

  if ((graph_key != 'attacked') && (strength == 0)) {
    return node_size_range[0] - 5
  } 

  var neuron = d['key']
  var layer = neuron.split('-')[0]
  var value_key = get_value_key('attacked', curr_attack_type, strength)
  var vul_val = vulnerability_data[layer][neuron][vul_type][curr_attack_type][value_key]
  return node_size_scale['all'][vul_type][value_key](vul_val)
  
}

// Function for setting x coordinate of a neuron
function x_coord_node(d, graph_key, strength, domain_key) {
  var layer = d['key'].split('-')[0]
  var value_key = get_value_key(graph_key, curr_attack_type, strength)
  var x_domain_val = d['value'][value_key][domain_key]
  var x_coord = x_scale[value_key][layer][domain_key](x_domain_val)
  return x_coord
}

// Function for setting y coordinate of a neuron
function y_coord_node(d, graph_key) {
  var neuron = d['key']
  var id = gen_node_id(neuron, graph_key)
  var layer = neuron.split('-')[0]
  var height = parseFloat(d3.select('#' + id).attr('height'))
  var starting_y = y_scale(layer)
  return starting_y - height / 2
}

function jitter_neurons(graph_key) {

  // Get the value key
  var value_key = get_value_key(graph_key, curr_attack_type, curr_strengths[curr_attack_type])

  // jittering -> start from the x_scale!!
  layers.forEach(layer => {
    // Get the currently displayed nodes
    var displayed_nodes = d3
      .selectAll('.' + ['node', graph_key, layer].join('-'))
      .filter(function(d) {
        var neuron_id = d['key']
        var node_id = gen_node_id(neuron_id, graph_key)
        return is_displayed(node_id)
      })
    
    var displayed_neurons = displayed_nodes._groups[0]
      .sort(function (a, b) {
        var a_x = parseFloat(a.getAttribute('x'))
        var b_x = parseFloat(b.getAttribute('x'))
        return a_x - b_x
      })
      .map(node => {
        var node_id_split = node.id.split('-').slice(-2)
        var neuron_id = node_id_split.join('-')
        return neuron_id
      })

    // Get adjusted jittered x coordinates
    var adjusted_x_coord = {}
    var adjusted_x_range = [1000, 0]
    var prev_end_x_coord = 0
    displayed_neurons.forEach(neuron => {
      var node = d3.select('#' + gen_node_id(neuron, graph_key))
      var x_coord = parseFloat(node.attr('x'))
      var width = parseFloat(node.attr('width'))
      
      if (prev_end_x_coord > x_coord) {
        x_coord = prev_end_x_coord + jitter_strength
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
    displayed_neurons.forEach(neuron => {
      d3.select('#' + gen_node_id(neuron, graph_key))
        .transition()
        .duration(x_coordinate_duration)
        .attr('x', function(d) { return rescale(adjusted_x_coord[neuron]) })
    })
  })
  
}

////////////////////////////////////////////////////////////////////////////////////////////////
// Functions for updated attack strength
////////////////////////////////////////////////////////////////////////////////////////////////

export function update_neurons_with_new_strength() {
  update_neurons_with_new_strength_by_graph_key('original')
  update_neurons_with_new_strength_by_graph_key('target')
  update_neurons_with_new_strength_by_graph_key('attacked')  
}

function update_neurons_with_new_strength_by_graph_key(graph_key) {
  
  update_node_color()
  update_node_size()
  update_node_x_coordinates()

  function update_node_color() {
    d3.selectAll('.node-' + graph_key)
      .attr('fill', function(d) {
        var neuron_id = d['key']
        var layer = neuron_id.split('-')[0]
        var bucket = neuron_to_bucket(neuron_id, layer, curr_filters['topK'], curr_attack_type)
        return bucket_colors[bucket]
      })
  }

  function update_node_size() {
    if ((graph_key != 'attacked') || (curr_strengths[curr_attack_type] > 0)) {
      d3.selectAll('.node-' + graph_key)
        .attr('width', function(d) { return node_size(d, graph_key, curr_strengths[curr_attack_type]) })
        .attr('height', function(d) { return node_size(d, graph_key, curr_strengths[curr_attack_type]) })
        .attr('rx', function(d) { return 0.3 * node_size(d, graph_key, curr_strengths[curr_attack_type]) })
        .attr('y', function(d) { return y_coord_node(d, graph_key) })
    }
  }

  function update_node_x_coordinates() {
    if (graph_key == 'attacked') {
      if (curr_strengths[curr_attack_type] == 0) {
        d3.selectAll('.node-' + graph_key).style('display', 'none')
      } else {
        // Display setting update of nodes in adversarial graph
        var filtered_neurons = []
        layers.forEach(layer => {
          var filtered_nodes = filter_activations(graph_key, 
                                                  layer, 
                                                  curr_filters['topK'], 
                                                  curr_attack_type, 
                                                  curr_strengths[curr_attack_type])
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
        jitter_neurons(graph_key)
      }
    }
  }

}

////////////////////////////////////////////////////////////////////////////////////////////////
// Functions for updated vulnerability
////////////////////////////////////////////////////////////////////////////////////////////////
export function update_neurons_with_new_vulnerability() {
  update_neurons_with_new_vulnerability_by_graph_key('original')
  update_neurons_with_new_vulnerability_by_graph_key('target')
  update_neurons_with_new_vulnerability_by_graph_key('attacked')
}

function update_neurons_with_new_vulnerability_by_graph_key(graph_key) {
  update_opacity()
  // update_display()

  // Update nodes' opacity
  function update_opacity() {
    d3.selectAll('.node-' + graph_key)
      .style('opacity', function(d) {
        var vul = get_vulnerability(d)
        if (vul >= curr_filters['vulnerability']) {
          return 1
        } else {
          return 0.3
        }
      })
  }

  // Update nodes' display
  function update_display() {
    d3.selectAll('.node-' + graph_key)
      .style('display', function(d) {
        var vul = get_vulnerability(d)
        var neuron_id = d['key']
        var layer = neuron_id.split('-')[0]
        var bucket = neuron_to_bucket(neuron_id, layer, curr_filters['topK'], curr_attack_type)
        if ((vul >= curr_filters['vulnerability']) && (bucket != -1)) {
          return 'block'
        } else {
          return 'none'
        }
      })
    jitter_neurons(graph_key)
  }

  function get_vulnerability(d) {
    var neuron_id = d['key']
    var layer = neuron_id.split('-')[0]
    var vul = vulnerability_data[layer][neuron_id][vul_type]
    if (vul_type == 'overall_vulnerabiliity') {
      vul = vul[curr_attack_type]
    } else if (vul_type == 'strengthwise_vulnerability') {
      var value_key = get_value_key('attacked', curr_attack_type, curr_strengths[curr_attack_type])
      vul = vul[curr_attack_type][value_key]
    }
    return vul
  }
}






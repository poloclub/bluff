import { 
  layers,
  top_k,
  rough_top_k,
  attack_types,
  attack_strengths
} from './constant.js';

import {
  graph_margin,
  node_color
} from './style.js';

import { 
  selected_attack_info
} from './attack_control.js'

// //  import { gen_top_dropdown } from './header.js';

////////////////////////////////////////////////////////////////////////////////////////////////
// Set data directory
////////////////////////////////////////////////////////////////////////////////////////////////
// var neuron_data_dir = '../../../massif/neurons/'
var data_dir = '../../data/'
var activation_data_path = data_dir + 'neuron_data/neuron_data-giant_panda-armadillo-pgd.json'
var vulnerability_data_path = data_dir + 'neuron_vulnerabilities/neuron_vulnerabilities-giant_panda-armadillo-pgd.json'
var top_neuron_data_path = data_dir + 'top_neurons/top_neurons-giant_panda-armadillo-pgd.json'
var file_list = [activation_data_path, vulnerability_data_path, top_neuron_data_path]

////////////////////////////////////////////////////////////////////////////////////////////////
// Global variables
////////////////////////////////////////////////////////////////////////////////////////////////
var activation_data = {}
var vulnerability_data = {}
var top_neuron_data = {}
var extracted_neurons = {}

var unique_attack_only_neurons = {}

var sorted_vulnerability_data = {}
var vul_type = 'strengthwise_vulnerability'

var node_size = {}
var node_group_x = {}
var y_coords = {}

////////////////////////////////////////////////////////////////////////////////////////////////
// Main part for drawing the attribution graphs 
// ////////////////////////////////////////////////////////////////////////////////////////////////
Promise.all(file_list.map(file => d3.json(file))).then(function(data) { 

  // Read the neuron data
  activation_data = data[0]
  vulnerability_data = data[1]
  top_neuron_data = data[2]

  // Parse vulnerability data
  parse_vulnerability_data()
  sorted_vulnerability_data = sort_vulnerability_data()
  extracted_neurons = extract_neurons()

  // Generate x, y coordinate info
  gen_x_coords()
  gen_y_coords()

  // Draw nodes
  draw_neurons()

  window.activation_data = activation_data
  window.vulnerability_data = vulnerability_data
  window.top_neuron_data = top_neuron_data
  window.sorted_vulnerability_data = sorted_vulnerability_data
  window.extracted_neurons = extracted_neurons
  window.node_size = node_size
  window.node_group_x = node_group_x
  window.y_coords = y_coords


})

////////////////////////////////////////////////////////////////////////////////////////////////
// Parse dataset
////////////////////////////////////////////////////////////////////////////////////////////////
function parse_vulnerability_data() {
  layers.forEach(layer => {
    for (var neuron in vulnerability_data[layer]) {
      attack_types.forEach(attack_type => {
        var accumulated_vul = 0
        attack_strengths[attack_type].forEach((strength, i) => {
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

function extract_neurons() {
  var extracted_neurons = {}

  layers.forEach(layer => {
    extracted_neurons[layer] = {}

    // Extract original class' neurons
    var rough_original = top_neuron_data[layer]['original'].slice(0, rough_top_k)
  
    // Extract target class' neurons
    var rough_target = top_neuron_data[layer]['target'].slice(0, rough_top_k)

    // Extract intersection
    var extracted_original_target = get_intersection(rough_original, rough_target)
    var extracted_original = get_difference(rough_original, extracted_original_target).slice(0, top_k)
    var extracted_target = get_difference(rough_target, extracted_original_target).slice(0, top_k)
    extracted_neurons[layer]['original'] = extracted_original
    extracted_neurons[layer]['target'] = extracted_target
    extracted_neurons[layer]['original-and-target'] = extracted_original_target.slice(0, top_k)

    // Extract neurons in adversarial graph
    attack_strengths[selected_attack_info['attack_type']].forEach(strength => {
      var attacked_key = get_value_key('attacked', selected_attack_info['attack_type'], strength)
      var rough_attacked = top_neuron_data[layer][attacked_key].slice(0, rough_top_k)
      var extracted_attacked = get_difference(rough_attacked, rough_original)
      extracted_attacked = get_difference(rough_attacked, rough_target)
      extracted_neurons[layer]['only-' + attacked_key] = extracted_attacked.slice(0, parseInt(top_k / 2))
    })
  })

  return extracted_neurons

  function get_intersection(lst1, lst2) {
    var intersection = []
    lst1.forEach(e1 => {
      if (lst2.includes(e1)) {
        intersection.push(e1)
      }
    })
    return intersection
  }

  function get_difference(lst1, lst2) {
    // lst1 - lst2
    var diff = []
    lst1.forEach(e1 => {
      if (!(lst2.includes(e1))) {
        diff.push(e1)
      }
    })
    return diff
  }
  
}

////////////////////////////////////////////////////////////////////////////////////////////////
// General functions
////////////////////////////////////////////////////////////////////////////////////////////////

function get_value_key(graph_key, attack_type, strength) {
  var value_key = graph_key
  if (graph_key == 'attacked') {
    value_key = [graph_key, attack_type, strength.toFixed(2)].join('-')
  }
  return value_key
}

////////////////////////////////////////////////////////////////////////////////////////////////
// Functions for generating x, y scales
////////////////////////////////////////////////////////////////////////////////////////////////

function gen_x_coords() {

  // Count out the total number of unique neurons in attack only
  unique_attack_only_neurons = count_unique_neurons_neither_original_nor_target()
  var max_num_attacked_only = get_max_num_attacked_only()

  // Set node group x coordinates
  node_size = calculate_node_size()
  set_node_group_x_coords()

  function set_node_group_x_coords() {

    attack_types.forEach(attack_type => {
      node_group_x[attack_type] = {}        
      var w = node_size[attack_type]

      // Set original group
      node_group_x[attack_type]['original'] = {}
      node_group_x[attack_type]['original']['start_x'] = graph_margin['start_x']
      node_group_x[attack_type]['original']['end_x'] = node_group_x[attack_type]['original']['start_x'] + length_node_group(top_k, w)

      // Set intersection group
      node_group_x[attack_type]['original-and-target'] = {}
      node_group_x[attack_type]['original-and-target']['start_x'] = node_group_x[attack_type]['original']['end_x'] + graph_margin['group_lr']
      node_group_x[attack_type]['original']['end_x'] = node_group_x[attack_type]['original-and-target']['start_x'] + length_node_group(top_k, w)

      // Set attack only group
      node_group_x[attack_type]['attack-only'] = {}
      node_group_x[attack_type]['attack-only']['start_x'] = node_group_x[attack_type]['original']['end_x'] + graph_margin['group_lr']
      node_group_x[attack_type]['attack-only']['end_x'] = node_group_x[attack_type]['attack-only']['start_x'] + length_node_group(max_num_attacked_only[attack_type], w)

      // Set target group
      node_group_x[attack_type]['target'] = {}
      node_group_x[attack_type]['target']['start_x'] = node_group_x[attack_type]['attack-only']['end_x'] + graph_margin['group_lr']
      node_group_x[attack_type]['target']['end_x'] = node_group_x[attack_type]['target']['start_x'] + length_node_group(top_k, w) 
    })
  }

  function length_node_group(num, node_size) {
    return num * (node_size + graph_margin['node_lr']) - graph_margin['node_lr']
  }    
  
  function get_max_num_attacked_only() {
    var max_num_attacked_only = {}
    attack_types.forEach(attack_type => {
      max_num_attacked_only[attack_type] = 0
      layers.forEach(layer => {
        var num = unique_attack_only_neurons[attack_type][layer].length
        max_num_attacked_only[attack_type] = d3.max([max_num_attacked_only[attack_type], num])
      })
    })
    return max_num_attacked_only
  }

  function calculate_node_size() {
    
    // Initialize node_size
    var node_size = {}

    attack_types.forEach(attack_type => {
      // Get the maximum total number of neurons in a layer
      var num = max_num_attacked_only[attack_type] + (top_k * 3)
      
      // Get the node_size
      var size = graph_margin['end_x'] - graph_margin['start_x']
      size = size - 3 * graph_margin['group_lr'] - (num - 1) * graph_margin['node_lr']
      size = size / num
      node_size[attack_type] = parseInt(size)
    })

    return node_size
  }

  function count_unique_neurons_neither_original_nor_target() {
    var unique_neurons = {}
    attack_types.forEach(attack_type => {
      unique_neurons[attack_type] = {}
      layers.forEach(layer => {
        unique_neurons[attack_type][layer] = []
        attack_strengths[attack_type].forEach(strength => {
          var attacked_key = 'only-' + get_value_key('attacked', attack_type, strength)
          unique_neurons[attack_type][layer] = keep_unique(unique_neurons[attack_type][layer], extracted_neurons[layer][attacked_key])
        })
      })
    })
    return unique_neurons
  }

  function keep_unique(lst, items) {
    items.forEach(item => {
      if (!(lst.includes(item))) {
        lst.push(item)
      }
    })
    return lst
  }
}

function gen_y_coords() {
  var num_layers = layers.length
  var unit_height = (graph_margin['end_y'] - graph_margin['start_y']) / (num_layers - 1)
  layers.forEach((layer, i) => {
    y_coords[layer] = graph_margin['start_y'] + i * unit_height
  })
}

////////////////////////////////////////////////////////////////////////////////////////////////
// Functions for drawing neurons
////////////////////////////////////////////////////////////////////////////////////////////////

function draw_neurons() {
  // XXX

  // Draw neurons in original, original & target, target graph
  var graph_keys = ['original', 'original-and-target', 'target']
  graph_keys.forEach(graph_key => {
    layers.forEach(layer => {
      var neuron_data = extracted_neurons[layer][graph_key]
      append_nodes(graph_key, neuron_data)
    })
  })

  // Draw neurons of the current attack, of all strength first
  layers.forEach(layer => {
    var neuron_data = unique_attack_only_neurons[selected_attack_info['attack_type']][layer]
    append_nodes('attack-only', neuron_data)
  })

  // Update nodes' visibilities

  function append_nodes(graph_key, neuron_data) {
    d3.select('#g-ag')
      .selectAll('nodes')
      .data(neuron_data)
      .enter()
      .append('rect')
      .attr('id', function(neuron) { return get_node_id(neuron) })
      .attr('class', function(neuron) { return get_node_class(graph_key, neuron) })
      .attr('x', function(neuron, i) { return get_node_x(graph_key, i) })
      .attr('y', function(neuron) { return get_node_y(neuron) })
      .attr('width', node_size[selected_attack_info['attack_type']])
      .attr('height', node_size[selected_attack_info['attack_type']])
      .attr('rx', 0.25 * node_size[selected_attack_info['attack_type']])
      .attr('ry', 0.25 * node_size[selected_attack_info['attack_type']])
      .style('fill', node_color[graph_key])
  }
  
  function get_node_id(neuron_id) {
    return ['node', neuron_id].join('-')
  }

  function get_node_class(graph_key, neuron_id) {
    var layer = neuron_id.split('-')[0]
    var c1 = 'node'
    var c2 = ['node', graph_key].join('-')
    var c3 = ['node', layer].join('-')
    return [c1, c2, c3].join(' ')
  }

  function get_node_x(graph_key, i) {
    var start_x = node_group_x[selected_attack_info['attack_type']][graph_key]['start_x']
    var w = node_size[selected_attack_info['attack_type']]
    var p = graph_margin['node_lr']
    return start_x + i * (w + p)
  }

  function get_node_y(neuron_id) {
    var layer = neuron_id.split('-')[0]
    return y_coords[layer]
  }
}

function update_node_opacity() {

}

// function gen_node_id(neuron_id, graph_key) {
//   return ['node', graph_key, neuron_id].join('-')
// }

// function draw_neurons_all_graph_key() {
//   // Draw neurons of original and target class
//   var original_target = ['original', 'target']
//   original_target.forEach(graph_key => {
//     layers.forEach(layer => {
//       var filtered_activations = filter_activations(graph_key, layer, 100)
//       draw_neurons(graph_key, 
//                   layer, 
//                   filtered_activations, 
//                   x_domain_keys[0], 
//                   curr_strengths[curr_attack_type])
//     })
//     jitter_neurons(graph_key)
//   })

//   // Draw neurons in adverrsarial graph
//   var graph_key = 'attacked'
//   strengths[curr_attack_type].forEach(strength => {
//     layers.forEach(layer => {
//       var filtered_activations = filter_activations(graph_key, 
//                                                     layer, 
//                                                     100, 
//                                                     curr_attack_type, 
//                                                     curr_strengths[curr_attack_type])
//       draw_neurons(graph_key, 
//                   layer, 
//                   filtered_activations, 
//                   x_domain_keys[0],
//                   strength)
//     })
//     jitter_neurons(graph_key)
//   })
// }

// function draw_neurons(graph_key, layer, filtered_activations, domain_key, strength) {

//   // Get neurons excluding already-drawn ones
//   var more_filtered_activations = filter_out_already_displayed()

//   // Draw neurons
//   d3.select('#g-ag-' + graph_key)
//     .selectAll('g')
//     .data(more_filtered_activations)
//     .enter()
//     .append('rect')
//     .attr('id', function(d) { return gen_node_id(d['key'], graph_key) })
//     .attr('class', function() { return node_class() })
//     .attr('width', function(d) { return node_size(d, graph_key, strength) })
//     .attr('height', function(d) { return node_size(d, graph_key, strength) })
//     .attr('x', function(d) { return x_coord_node(d, graph_key, strength, domain_key) })
//     .attr('y', function(d) { return y_coord_node(d, graph_key) })
//     .attr('rx', function(d) { return 0.3 * node_size(d, graph_key, strength) })
//     .attr('fill', function(d) { return node_color(d) })
//     .style('display', function(d) { return display_node(d) })
//     .on('mouseover', function(d) { return mouseover_node(d) })
//     .on('mouseout', function(d) { return mouseout_node(d) })

//   // Function for node class
//   function node_class() {
//     var class1 = 'node'
//     var class2 = ['node', graph_key].join('-')
//     var class3 = ['node', graph_key, layer].join('-')
//     return [class1, class2, class3].join(' ')
//   }

//   // Filter out already displayed nodes
//   function filter_out_already_displayed() {
//     var more_filtered_activations = filtered_activations.filter(function(d) {
//       var neuron_id = d['key']
//       var node_id = gen_node_id(neuron_id, graph_key)
//       if (does_exist(node_id)) {
//         return false
//       } else {
//         return true
//       }
//     })
//     return more_filtered_activations
//   }

//   // Function for node color
//   function node_color(d) {
//     var bucket = neuron_to_bucket(d['key'], layer, curr_filters['topK'], curr_attack_type)
//     return bucket_colors[bucket]
//   }

//   // Function for setting display of a node
//   function display_node(d) {
//     var neuron_id = d['key']
    
//     var value_key = get_value_key(graph_key, curr_attack_type, curr_strengths[curr_attack_type])
//     var top_neurons = top_neuron_data[layer][value_key].slice(0, curr_filters['topK'])
//     if ((strength == curr_strengths[curr_attack_type]) && top_neurons.includes(neuron_id)){
//       return 'block'
//     } else {
//       return 'none'
//     }
//   }

//   // Function for mouseover on nodes
//   function mouseover_node(d) {
//     // Get element
//     var neuron_id = d['key']
//     var node_id = gen_node_id(neuron_id, graph_key)
//     var node = document.getElementById(node_id)

//     // Mouse pointer
//     node.style.cursor = 'pointer'

//     // Position of node
//     var node_rect = node.getBoundingClientRect()
//     var node_x = node_rect.right 
//     var node_y = (node_rect.top + node_rect.bottom) / 2 - 190

//     // Draw a box
//     var box_id = node_box_id(neuron_id)
//     if (!does_exist(box_id)) {

//       // Add nodebox
//       d3.select('#svg-ag-nodebox')
//         .append('g')
//         .attr('id', box_id)
//         .attr('transform', function() {
//           var x = node_x + node_box['left']
//           var y = node_y - node_box['height'] / 2
//           return 'translate(' + x + ',' + y +')'
//         })

//       // Draw background rect
//       draw_bg_rect(box_id)

//       // Draw a feature vis
//       draw_fv(box_id)

//       // Draw example patches
//       draw_examples(box_id)
//     } else {
//       d3.select('#' + box_id)
//         .style('display', 'block')
//         .attr('transform', function() {
//           var x = node_x + node_box['left']
//           var y = node_y - node_box['height'] / 2
//           console.log(node_x)
//           return 'translate(' + x + ',' + y +')'
//         })
//     }

//     function draw_bg_rect(box_id) {
//       d3.select('#' + box_id)
//         .append('rect')
//         .attr('id', box_id + '-bg')
//         .attr('class', 'nodebox-bg')
//         // .attr('x', node_x + node_box['left'])
//         // .attr('y', node_y - node_box['height'] / 2)
//         .attr('width', node_box['width'])
//         .attr('height', node_box['height'])
//     }

//     function draw_fv(box_id) {
//       d3.select('#' + box_id)
//         .append('image')
//         .attr('id', box_id + '-fv')
//         .attr('class', 'nodebox-fv')
//         .attr('xlink:href', vis_filename(neuron_id, 'channel'))
//         .attr('x', 0)
//         .attr('y', 0)
//         .attr('transform', function() { return fv_transform() })
//         .attr('width', node_box['fv-width'])
//         .attr('height', node_box['fv-height'])
//     }

//     function draw_examples(box_id) {
//       for(var i = 0; i < 4; i++) {
//         d3.select('#' + box_id)
//           .append('image')
//           .attr('id', box_id + '-ex-' + i)
//           .attr('class', 'nodebox-ex')
//           .attr('xlink:href', vis_filename(neuron_id, 'ex-' + i))
//           .attr('x', 0)
//           .attr('y', 0)
//           .attr('transform', function() { return ex_transform(i) })
//           .attr('width', node_box['fv-width'])
//           .attr('height', node_box['fv-height'])
//       }
//     }

//     function fv_transform() {
//       var x = node_box['fv-left']
//       var y = - node_box['fv-height'] / 2 + 50
//       return 'translate(' + x + ',' + y + ')'
//     }

//     function ex_transform(i) {
//       var x = node_box['left'] + node_box['ex-left'] + i * (node_box['ex-padding'] + node_box['ex-width']) - 10
//       var y = - node_box['ex-height'] / 2 + 50
//       return 'translate(' + x + ',' + y + ')'
//     }

//     function vis_filename(neuron_id, type) {
//       var filename = feature_vis_dir + '/'
//       if (type == 'channel') {
//         filename += 'channel/'
//         filename += [neuron_id, type].join('-')
//         filename += '.jpg'
//       } else if (type.includes('ex')) {
//         var ex = type.split('-')[1]
//         filename += 'dataset-p/'
//         filename += [neuron_id, 'dataset', 'p', ex].join('-')
//         filename += '.jpg'
//       }
//       return filename
//     }
//   }

//   // Function for mouseout
//   function mouseout_node(d) {
//     var neuron_id = d['key']
//     var box_id = node_box_id(neuron_id)
//     d3.select('#' + box_id).style('display', 'none')
//   }

//   // Define node box id
//   function node_box_id(neuron_id) {
//     return ['nodebox', graph_key, neuron_id].join('-')
//   }
// }

// // Function for the size of neuron based on the vulnerability
// function node_size(d, graph_key, strength) {

//   if ((graph_key != 'attacked') && (strength == 0)) {
//     return node_size_range[0] - 5
//   } 

//   var neuron = d['key']
//   var layer = neuron.split('-')[0]
//   var value_key = get_value_key('attacked', curr_attack_type, strength)
//   var vul_val = vulnerability_data[layer][neuron][vul_type][curr_attack_type][value_key]
//   return node_size_scale['all'][vul_type][value_key](vul_val)
  
// }

// // Function for setting x coordinate of a neuron
// function x_coord_node(d, graph_key, strength, domain_key) {
//   var layer = d['key'].split('-')[0]
//   var value_key = get_value_key(graph_key, curr_attack_type, strength)
//   var x_domain_val = d['value'][value_key][domain_key]
//   var x_coord = x_scale[value_key][layer][domain_key](x_domain_val)
//   return x_coord
// }

// // Function for setting y coordinate of a neuron
// function y_coord_node(d, graph_key) {
//   var neuron = d['key']
//   var id = gen_node_id(neuron, graph_key)
//   var layer = neuron.split('-')[0]
//   var height = parseFloat(d3.select('#' + id).attr('height'))
//   var starting_y = y_scale(layer)
//   return starting_y - height / 2
// }

// function jitter_neurons(graph_key) {

//   // Get the value key
//   var value_key = get_value_key(graph_key, curr_attack_type, curr_strengths[curr_attack_type])

//   // jittering -> start from the x_scale!!
//   layers.forEach(layer => {
//     // Get the currently displayed nodes
//     var displayed_nodes = d3
//       .selectAll('.' + ['node', graph_key, layer].join('-'))
//       .filter(function(d) {
//         var neuron_id = d['key']
//         var node_id = gen_node_id(neuron_id, graph_key)
//         return is_displayed(node_id)
//       })
    
//     var displayed_neurons = displayed_nodes._groups[0]
//       .sort(function (a, b) {
//         var a_x = parseFloat(a.getAttribute('x'))
//         var b_x = parseFloat(b.getAttribute('x'))
//         return a_x - b_x
//       })
//       .map(node => {
//         var node_id_split = node.id.split('-').slice(-2)
//         var neuron_id = node_id_split.join('-')
//         return neuron_id
//       })

//     // Get adjusted jittered x coordinates
//     var adjusted_x_coord = {}
//     var adjusted_x_range = [1000, 0]
//     var prev_end_x_coord = 0
//     displayed_neurons.forEach(neuron => {
//       var node = d3.select('#' + gen_node_id(neuron, graph_key))
//       var x_coord = parseFloat(node.attr('x'))
//       var width = parseFloat(node.attr('width'))
      
//       if (prev_end_x_coord > x_coord) {
//         x_coord = prev_end_x_coord + jitter_strength
//       }
//       adjusted_x_coord[neuron] = x_coord
//       adjusted_x_range[0] = d3.min([adjusted_x_range[0], x_coord])
//       adjusted_x_range[1] = d3.max([adjusted_x_range[1], x_coord])
//       prev_end_x_coord = x_coord + width
//     })

//     // Compute a new scale for rescaling
//     var rescale = d3
//       .scaleLinear()
//       .domain(adjusted_x_range)
//       .range([0, div_width - ag_margin['right']])

//     // Jittering
//     displayed_neurons.forEach(neuron => {
//       d3.select('#' + gen_node_id(neuron, graph_key))
//         .transition()
//         .duration(x_coordinate_duration)
//         .attr('x', function(d) { return rescale(adjusted_x_coord[neuron]) })
//     })
//   })
  
// }

// ////////////////////////////////////////////////////////////////////////////////////////////////
// // Functions for generating vulnerability scales
// ////////////////////////////////////////////////////////////////////////////////////////////////

// function gen_node_size_scale() {
//   vulnerability_range = get_vulnerability_range()
//   gen_node_size_scale()

//   function gen_node_size_scale() {
//     // Generate node size scale for all layer
//     node_size_scale['all'] = {'overall_vulnerability': {}, 'strengthwise_vulnerability': {}}
//     attack_types.forEach(attack_type => {

//       // Overall vulnerability, all layer
//       node_size_scale['all']['overall_vulnerability'][attack_type] = d3
//         .scaleLinear()
//         .domain(vulnerability_range['all']['overall_vulnerability'][attack_type])
//         .range(node_size_range)
      
//       // Strengthwise vulnerability, all layer
//       strengths[attack_type].forEach(strength => {
//         var value_key = get_value_key('attacked', attack_type, strength)
//         node_size_scale['all']['strengthwise_vulnerability'][value_key] = d3
//           .scaleLinear()
//           .domain(vulnerability_range['all']['strengthwise_vulnerability'][value_key])
//           .range(node_size_range)
//       })
//     })

//     // Generate node size scale for layer by layer
//     layers.forEach(layer => {
//       node_size_scale[layer] = {'overall_vulnerability': {}, 'strengthwise_vulnerability': {}}
//       attack_types.forEach(attack_type => {

//         // Overall vulnerability, layer-by-layer
//         node_size_scale[layer]['overall_vulnerability'][attack_type] = d3
//           .scaleLinear()
//           .domain(vulnerability_range[layer]['overall_vulnerability'][attack_type])

//         // Strengthwise vulnerability, layer-by-layer
//         strengths[attack_type].forEach(strength => {
//           var value_key = get_value_key('attacked', attack_type, strength)
//           node_size_scale[layer]['strengthwise_vulnerability'][value_key] = d3
//             .scaleLinear()
//             .domain(vulnerability_range[layer]['strengthwise_vulnerability'][value_key])
//         })
//       })
//     })
//   }

// }

// function get_vulnerability_range() {
//   vulnerability_range = init_vul_range_dict()

//   layers.forEach(layer => {
//     for (var neuron_id in vulnerability_data[layer]) {
//       attack_types.forEach(attack_type => {
//         update_overall_vulnerability (layer, neuron_id, attack_type)
//         update_strengthwise_vulnerability (layer, neuron_id, attack_type)
//       })
//     }
//   })

//   return vulnerability_range

//   function init_vul_range_dict() {
//     var vulnerability_range = {}

//     // Vulnerability range of all layer
//     vulnerability_range['all'] = {}
//     vulnerability_range['all']['overall_vulnerability'] = {}
//     vulnerability_range['all']['strengthwise_vulnerability'] = {}
//     attack_types.forEach(attack_type => {
//       vulnerability_range['all']['overall_vulnerability'][attack_type] = [1000, -1000]
//       strengths[attack_type].forEach(strength => {
//         var value_key = get_value_key('attacked', attack_type, strength)
//         vulnerability_range['all']['strengthwise_vulnerability'][value_key] = [1000, -1000]
//       })
//     })

//     // Vulnerability range of layer by layer
//     layers.forEach(layer => {
//       vulnerability_range[layer] = {}
//       vulnerability_domain_keys.forEach(vulnerability_key => {
//         vulnerability_range[layer][vulnerability_key] = {}
//       })
//       attack_types.forEach(attack_type => {
//         vulnerability_range[layer]['overall_vulnerability'][attack_type] = [1000, -1000]
//         strengths[attack_type].forEach(strength => {
//           var value_key = get_value_key('attacked', attack_type, strength)
//           vulnerability_range[layer]['strengthwise_vulnerability'][value_key] = [1000, -1000]
//         })
//       })
//     })
//     return vulnerability_range
//   }

//   function update_overall_vulnerability (layer, neuron_id, attack_type) {
//     // Get the current overall vulnerability
//     var overall_vul = vulnerability_data[layer][neuron_id]['overall_vulnerability'][attack_type]

//     // Update overall vulnerability of all layer
//     var min_all_overall_vul = vulnerability_range['all']['overall_vulnerability'][attack_type][0]
//     var max_all_overall_vul = vulnerability_range['all']['overall_vulnerability'][attack_type][1]
//     if (min_all_overall_vul > overall_vul) {
//       vulnerability_range['all']['overall_vulnerability'][attack_type][0] = overall_vul
//     }
//     if (max_all_overall_vul < overall_vul) {
//       vulnerability_range['all']['overall_vulnerability'][attack_type][1] = overall_vul
//     }

//     // Update overall vulnerability of each layer
//     var min_overall_vul = vulnerability_range[layer]['overall_vulnerability'][attack_type][0]
//     var max_overall_vul = vulnerability_range[layer]['overall_vulnerability'][attack_type][1]
//     if (min_overall_vul > overall_vul) {
//       vulnerability_range[layer]['overall_vulnerability'][attack_type][0] = overall_vul
//     }
//     if (max_overall_vul < overall_vul) {
//       vulnerability_range[layer]['overall_vulnerability'][attack_type][1] = overall_vul
//     }
//   }

//   function update_strengthwise_vulnerability (layer, neuron_id, attack_type) {
//     strengths[attack_type].forEach(strength => {
//       // Get the value key
//       var value_key = get_value_key('attacked', attack_type, strength)

//       // Get the current strengthwise vulnerability
//       var strengthwise_vul = vulnerability_data[layer][neuron_id]['strengthwise_vulnerability'][attack_type][value_key]
      
//       // Update the strengthwise vulnerability of all layer
//       var min_all_strengthwise_vul = vulnerability_range['all']['strengthwise_vulnerability'][value_key][0]
//       var max_all_strengthwise_vul = vulnerability_range['all']['strengthwise_vulnerability'][value_key][1]
//       if (min_all_strengthwise_vul > strengthwise_vul) {
//         vulnerability_range['all']['strengthwise_vulnerability'][value_key][0] = strengthwise_vul
//       }
//       if (max_all_strengthwise_vul < strengthwise_vul) {
//         vulnerability_range['all']['strengthwise_vulnerability'][value_key][1] = strengthwise_vul
//       }

//       // Update the strengthwise vulnerability of lthe current layer
//       var min_strengthwise_vul = vulnerability_range[layer]['strengthwise_vulnerability'][value_key][0]
//       var max_strengthwise_vul = vulnerability_range[layer]['strengthwise_vulnerability'][value_key][1]
//       if (min_strengthwise_vul > strengthwise_vul) {
//         vulnerability_range[layer]['strengthwise_vulnerability'][value_key][0] = strengthwise_vul
//       }
//       if (max_strengthwise_vul < strengthwise_vul) {
//         vulnerability_range[layer]['strengthwise_vulnerability'][value_key][1] = strengthwise_vul
//       }
      
//     })
//   }
// }


// ////////////////////////////////////////////////////////////////////////////////////////////////
// // Functions for updated attack strength
// ////////////////////////////////////////////////////////////////////////////////////////////////

// export function update_neurons_with_new_strength() {
//   update_neurons_with_new_strength_by_graph_key('original')
//   update_neurons_with_new_strength_by_graph_key('target')
//   update_neurons_with_new_strength_by_graph_key('attacked')  
// }

// function update_neurons_with_new_strength_by_graph_key(graph_key) {
  
//   update_node_display()
//   jitter_neurons(graph_key)
//   update_node_color()
//   update_node_size()

//   function update_node_display() {
//     if ((graph_key == 'attacked') && (curr_strengths[curr_attack_type] == 0)) {
//       d3.selectAll('.node-' + graph_key).style('display', 'none')
//     } else {
//       // Get nodes to display
//       var filtered_neurons = []
//       layers.forEach(layer => {
//         // Filter nodes by top-k value
//         var filtered_nodes = filter_activations(graph_key, 
//                                                 layer, 
//                                                 curr_filters['topK'], 
//                                                 curr_attack_type, 
//                                                 curr_strengths[curr_attack_type])
//         // Filter nodes one more by vulnerability
//         filtered_nodes = filtered_nodes.filter(function(d) {
//           var neuron_id = d['key']
//           var layer = neuron_id.split('-')[0]
//           var vul = vulnerability_data[layer][neuron_id][vul_type][curr_attack_type]
//           if (vul_type == 'strengthwise_vulnerability') {
//             var value_key = get_value_key('attacked', curr_attack_type, curr_strengths[curr_attack_type])
//             vul = vul[value_key]
//           }
//           return vul >= curr_filters['vulnerability']
//         })
//         filtered_neurons = filtered_neurons.concat(filtered_nodes.map(x => x['key']))
//       })

//       d3.selectAll('.node-' + graph_key)
//         .style('display', function(d) {
//           var neuron_id = d['key']
//           if (filtered_neurons.includes(neuron_id)) {
//             return 'block'
//           } else {
//             return 'none'
//           }
//         })
//     }
//   }

//   function update_node_color() {
//     d3.selectAll('.node-' + graph_key)
//       .attr('fill', function(d) {
//         var neuron_id = d['key']
//         var layer = neuron_id.split('-')[0]
//         var bucket = neuron_to_bucket(neuron_id, layer, curr_filters['topK'], curr_attack_type)
//         return bucket_colors[bucket]
//       })
//   }

//   function update_node_size() {
//     if ((graph_key != 'attacked') || (curr_strengths[curr_attack_type] > 0)) {
//       d3.selectAll('.node-' + graph_key)
//         .attr('width', function(d) { return node_size(d, graph_key, curr_strengths[curr_attack_type]) })
//         .attr('height', function(d) { return node_size(d, graph_key, curr_strengths[curr_attack_type]) })
//         .attr('rx', function(d) { return 0.3 * node_size(d, graph_key, curr_strengths[curr_attack_type]) })
//         .attr('y', function(d) { return y_coord_node(d, graph_key) })
//     }
//   }

// }

// ////////////////////////////////////////////////////////////////////////////////////////////////
// // Functions for updated vulnerability
// ////////////////////////////////////////////////////////////////////////////////////////////////
// export function update_neurons_with_new_vulnerability() {
//   update_neurons_with_new_vulnerability_by_graph_key('original')
//   update_neurons_with_new_vulnerability_by_graph_key('target')
//   update_neurons_with_new_vulnerability_by_graph_key('attacked')
// }

// function update_neurons_with_new_vulnerability_by_graph_key(graph_key) {
//   // update_opacity()
//   update_display()

//   // Update nodes' opacity
//   function update_opacity() {
//     d3.selectAll('.node-' + graph_key)
//       .style('opacity', function(d) {
//         var vul = get_vulnerability(d)
//         if (vul >= curr_filters['vulnerability']) {
//           return 1
//         } else {
//           return 0.3
//         }
//       })
//   }

//   // Update nodes' display
//   function update_display() {
//     d3.selectAll('.node-' + graph_key)
//       .style('display', function(d) {
//         var vul = get_vulnerability(d)
//         var neuron_id = d['key']
//         var layer = neuron_id.split('-')[0]
//         var bucket = neuron_to_bucket(neuron_id, layer, curr_filters['topK'], curr_attack_type)
//         var is_in_right_bucket = graph_key_to_buckets[graph_key].includes(bucket)
//         if ((vul >= curr_filters['vulnerability']) && is_in_right_bucket) {
//           return 'block'
//         } else {
//           return 'none'
//         }
//       })
//     jitter_neurons(graph_key)
//   }

//   function get_vulnerability(d) {
//     var neuron_id = d['key']
//     var layer = neuron_id.split('-')[0]
//     var vul = vulnerability_data[layer][neuron_id][vul_type]
//     if (vul_type == 'overall_vulnerabiliity') {
//       vul = vul[curr_attack_type]
//     } else if (vul_type == 'strengthwise_vulnerability') {
//       var value_key = get_value_key('attacked', curr_attack_type, curr_strengths[curr_attack_type])
//       vul = vul[curr_attack_type][value_key]
//     }
//     return vul
//   }
// }






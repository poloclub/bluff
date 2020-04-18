import { 
  layers,
  top_k,
  rough_top_k,
  attack_types,
  attack_strengths,
  data_dir
} from './constant.js';

import {
  graph_margin,
  node_color,
  node_style,
  node_hue_color,
  node_opacity,
  node_box_style,
  edge_style,
  text_color
} from './style.js';

import {
  selected_class,
  class_name_for_display,
  get_absolute_position
} from './header.js'

import { 
  selected_attack_info
} from './left_attack_control.js'

import {
  filter_pathways
} from './left_filter_pathways.js'

import {
  highlight_pathways
} from './left_highlight_pathways.js'

import {
  comp_attack
} from './left_attack_compare.js'


////////////////////////////////////////////////////////////////////////////////////////////////
// Global variables
////////////////////////////////////////////////////////////////////////////////////////////////
var activation_data = {}
var top_neuron_data = {}
var extracted_neurons = {}
var edge_data = {}
var benign_edge_data = {}
var most_inhibited_data = {}
var most_changed_data = {}
var most_activated_extracted_data = {}
var most_inhibited_extracted_data = {}
var most_changed_extracted_data = {}

var unique_attack_only_neurons = {}
var act_type = 'median_activation'
var activation_range = {}
var activation_y_scale = {}

var node_size = {}
export var node_group_x = {}
var y_coords = {}

var edge_stroke_scale = {}

var pinned_neurons = {}
var highlighted_edges = {}


////////////////////////////////////////////////////////////////////////////////////////////////
// Main part for drawing the attribution graphs 
////////////////////////////////////////////////////////////////////////////////////////////////

gen_filters()

export function reload_graph() {

  var file_list = data_file_path()
  remove_graph()
  draw_graph(file_list)

  function draw_graph(file_list) {
    Promise.all(file_list.map(file => d3.json(file))).then(function(data) { 
      
      // Read the neuron data
      activation_data = data[0]
      top_neuron_data = data[1]
      extracted_neurons = extract_neurons()
      edge_data = read_and_parse_edge_data(data, 2, extracted_neurons)
      benign_edge_data = data[2]

      // Parse most inhibited data
      parse_most_changed_data()
      
      // Parse most inhibited extracted neurons
      parse_most_extracted_data()
    
      // Get activation scale
      get_actiavtion_y_scale()

      window.activation_data = activation_data
      window.top_neuron_data = top_neuron_data
      window.extracted_neurons = extracted_neurons
      window.node_size = node_size
      window.node_group_x = node_group_x
      window.y_coords = y_coords
      window.activation_range = activation_range
      window.edge_data = edge_data
      window.most_inhibited_data = most_inhibited_data
      window.most_changed_data = most_changed_data
      window.most_inhibited_extracted_data = most_inhibited_extracted_data
      window.most_changed_extracted_data = most_changed_extracted_data
    
      // Generate x, y coordinate info
      gen_x_coords()
      gen_y_coords()

      // Update rounded-node filter
      update_rounded_image_filter()
    
      // Draw nodes
      write_layers()
      draw_neurons()

      // Draw edges
      update_edge_stroke_scale()
      update_edges(selected_attack_info['attack_strength'])
      update_edges_display()

      // Update the column labels
      update_column_title()

      // Go comparison mode if needed
      go_comparison_mode()
    
    })
  }

}

export function remove_graph() {
  d3.selectAll('.layer-text').remove()
  d3.selectAll('.g-node').remove()
  d3.selectAll('.node-box').remove()
  d3.selectAll('.edge').remove()
  pinned_neurons = {}
  highlighted_edges = {}
}

export function update_column_title() {

  // Remove all column labels
  d3.selectAll('.column-title').remove()

  add_label('original')
  add_label('original-and-target')
  add_label('target')
  add_label('attack-only')

  function add_label(column) {
    var label_x = node_group_x[selected_attack_info['attack_type']][column]

    var label = ''
    if ((column == 'original') || (column == 'target')) {
      label = class_name_for_display(selected_class[column])
    } else if (column == 'original-and-target') {
      label = 'BOTH'
    } else if (column == 'attack-only') {
      label = 'EXPLOITED BY ATTACK'
    }
     
    d3.select('#g-column-title')
      .append('text')
      .text(label)
      .attr('id', 'column-' + column)
      .attr('class', 'column-title')
      .style('fill', text_color[column])

    var [l, t, r, b] = get_absolute_position('column-' + column)
    var len_txt = r - l

    d3.select('#column-' + column)
      .attr('x', (label_x['start_x'] + label_x['end_x'] - len_txt) / 2)
  }

}


////////////////////////////////////////////////////////////////////////////////////////////////
// Parse dataset
////////////////////////////////////////////////////////////////////////////////////////////////

function read_and_parse_edge_data(data, i, neuron_data) {
  var edge_data = {}
  edge_data[0] = data[i]
  attack_strengths[selected_attack_info['attack_type']].forEach((s, j) => {
    edge_data[s] = data[i + j + 1]
  })

  edge_data = filter_parse_edge_data(edge_data)
  return edge_data

  function filter_parse_edge_data(edge_data) {

    var new_edge_data = {}
  
    for (var strength in edge_data) {
      
      new_edge_data[strength] = {}
  
      for (var layer in edge_data[strength]) {
        new_edge_data[strength][layer] = []
  
        for (var neuron in edge_data[strength][layer]) {
          
          if (is_in_neuron_data(neuron)) {
            
            for (var next_neuron in edge_data[strength][layer][neuron]) {
              if (is_in_neuron_data(next_neuron)) {
                var inf = edge_data[strength][layer][neuron][next_neuron]['inf']
                if (inf > 0) {
                  new_edge_data[strength][layer].push({
                    'curr': neuron,
                    'next': next_neuron,
                    'inf': inf
                  })
                }
              }
            }
          }
        }
  
      }
    }
  
    return new_edge_data
  }

  function is_in_neuron_data(neuron) {
    var layer = neuron.split('-')[0]
    var is_in = false
    for (var graph_key in neuron_data[layer]) {
      if (!is_in) {
        is_in = neuron_data[layer][graph_key].includes(neuron)
      }
    }
    return is_in
  }
}

function parse_most_changed_data() {
  most_inhibited_data = {}
  most_changed_data = {}

  layers.forEach(layer => {
    most_inhibited_data[layer] = {}
    most_changed_data[layer] = {}

    attack_strengths[selected_attack_info['attack_type']].forEach(strength => {
      var attack_key = get_value_key('attacked', selected_attack_info['attack_type'], strength)

      // Sort the neurons by how they are inhibited
      var sorted_inhibited = Object.entries(activation_data[layer]).sort(function(a, b) {
        var original_a = a[1]['original'][act_type]
        var original_b = b[1]['original'][act_type]
        var attacked_a = a[1][attack_key][act_type]
        var attacked_b = b[1][attack_key][act_type]
        return (original_b - attacked_b) - (original_a - attacked_a)
      })
      sorted_inhibited = sorted_inhibited.map(x => x[0])
      most_inhibited_data[layer][attack_key] = sorted_inhibited

      // Sort the neurons by how they are changed
      var sorted_changed = Object.entries(activation_data[layer]).sort(function(a, b) {
        var original_a = a[1]['original'][act_type]
        var original_b = b[1]['original'][act_type]
        var attacked_a = a[1][attack_key][act_type]
        var attacked_b = b[1][attack_key][act_type]
        return Math.abs(original_b - attacked_b) - Math.abs(original_a - attacked_a)
      })
      sorted_changed = sorted_changed.map(x => x[0])
      most_changed_data[layer][attack_key] = sorted_changed
    })
  })
}

function parse_most_extracted_data() {

  most_activated_extracted_data = {}
  most_inhibited_extracted_data = {}
  most_changed_extracted_data = {}

  // Get all extracted data
  layers.forEach(layer => {
    most_inhibited_extracted_data[layer] = {}
    most_changed_extracted_data[layer] = {}
    most_activated_extracted_data[layer] = {}

    // Get extracted neurons
    var neurons = {}
    for (var graph_key in extracted_neurons[layer]) {
      extracted_neurons[layer][graph_key].forEach(neuron => {
        neurons[neuron] = true
      })
    }

    // Most activated extracted data
    most_activated_extracted_data[layer]['original'] = Object.keys(neurons).sort(function(a, b) {
      var idx_a = top_neuron_data[layer]['original'].indexOf(a)
      var idx_b = top_neuron_data[layer]['original'].indexOf(b)
      return idx_b - idx_a
    })

    // Get most extracted neurons
    for (var attack_key in most_inhibited_data[layer]) {

      // Most activated extracted data
      most_activated_extracted_data[layer][attack_key] = Object.keys(neurons).sort(function(a, b) {
        var idx_a = top_neuron_data[layer][attack_key].indexOf(a)
        var idx_b = top_neuron_data[layer][attack_key].indexOf(b)
        return idx_b - idx_a
      })

      // Most inhibited extracted data
      most_inhibited_extracted_data[layer][attack_key] = Object.keys(neurons).sort(function(a, b) {
        var idx_a = most_inhibited_data[layer][attack_key].indexOf(a)
        var idx_b = most_inhibited_data[layer][attack_key].indexOf(b)
        return idx_a - idx_b
      })

      // Most changed extracted data
      most_changed_extracted_data[layer][attack_key] = Object.keys(neurons).sort(function(a, b) {
        var idx_a = most_changed_data[layer][attack_key].indexOf(a)
        var idx_b = most_changed_data[layer][attack_key].indexOf(b)
        return idx_a - idx_b
      })
    }
  })

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
    attack_types.forEach(attack_type => {
      attack_strengths[attack_type].forEach(strength => {
        var attacked_key = get_value_key('attacked', selected_attack_info['attack_type'], strength)
        var rough_attacked = top_neuron_data[layer][attacked_key].slice(0, rough_top_k)
        var extracted_attacked = get_difference(rough_attacked, rough_original)
        extracted_attacked = get_difference(extracted_attacked, rough_target)
        extracted_neurons[layer]['only-' + attacked_key] = extracted_attacked.slice(0, parseInt(top_k / 2))
      })
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

function get_actiavtion_y_scale() {

  get_activation_range()
  get_activation_scale()

  function get_activation_range() {
    layers.forEach(layer => {
      activation_range[layer] = [0, 0]
      for (var neuron in activation_data[layer]) {
        for (var key in activation_data[layer][neuron]) {
          var act = activation_data[layer][neuron][key][act_type]
          activation_range[layer][1] = d3.max([act, activation_range[layer][1]])
        }
        
      }
    })
  }

  function get_activation_scale() {
    layers.forEach(layer => {
      activation_y_scale[layer] = d3
        .scaleLinear()
        .domain(activation_range[layer])
        .range([0, node_box_style['act-plot-height']])
    })
  }
  
}

////////////////////////////////////////////////////////////////////////////////////////////////
// General functions
////////////////////////////////////////////////////////////////////////////////////////////////

function data_file_path() {
  
  var original_class = selected_class['original']
  var target_class = selected_class['target']
  var attack_type = selected_attack_info['attack_type']
  
  var class_info = [original_class, target_class].join('-')
  var activation_data_path = data_dir + ['/neuron-data/neuron_data', class_info, attack_type + '.json'].join('-')
  var top_neuron_data_path = data_dir + ['/top-neurons/top_neurons', class_info, attack_type + '.json'].join('-')
  var file_list = [activation_data_path, top_neuron_data_path]

  file_list.push(data_dir + ['/connection-data/edg_inf_parsed', 'benign', class_info.split('-')[0] + '.json'].join('-'))
  attack_strengths[attack_type].forEach(strength => {
    var st = strength.toFixed(4)
    var edge_data_path = data_dir + ['/connection-data/edg_inf_parsed', 'attacked', class_info, attack_type, st + '.json'].join('-')
    file_list.push(edge_data_path)
  })
  
  return file_list
}

function get_value_key(graph_key, attack_type, strength) {
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

function vis_filename(neuron_id, type) {
  var filename = data_dir + '/neuron-vis/'
  
  if (type == 'channel') {
    filename += 'feature-vis/'
    filename += [neuron_id, type].join('-')
    filename += '.jpg'
  } else if (type.includes('ex')) {
    var ex = type.split('-')[1]
    filename += 'example-patch/'
    filename += [neuron_id, 'dataset', 'p', ex].join('-')
    filename += '.jpg'
  }
  return filename
}

function get_translate_coords(id) {
  var transform = d3.select('#' + id).attr('transform')
  var [x, y]  = transform.split(',')
  x = parseFloat(x.slice(10))
  y = parseFloat(y.slice(0, -1))
  return [x, y]
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

      // Set both group
      node_group_x[attack_type]['original-and-target'] = {}
      node_group_x[attack_type]['original-and-target']['start_x'] = node_group_x[attack_type]['original']['end_x'] + graph_margin['group_lr']
      node_group_x[attack_type]['original-and-target']['end_x'] = node_group_x[attack_type]['original-and-target']['start_x'] + length_node_group(top_k, w)

      // Set target group
      node_group_x[attack_type]['target'] = {}
      node_group_x[attack_type]['target']['start_x'] = node_group_x[attack_type]['original-and-target']['end_x'] + graph_margin['group_lr']
      node_group_x[attack_type]['target']['end_x'] = node_group_x[attack_type]['target']['start_x'] + length_node_group(top_k, w) 

      // Set attack only group
      node_group_x[attack_type]['attack-only'] = {}
      node_group_x[attack_type]['attack-only']['start_x'] = node_group_x[attack_type]['target']['end_x'] + graph_margin['group_lr']
      node_group_x[attack_type]['attack-only']['end_x'] = node_group_x[attack_type]['attack-only']['start_x'] + length_node_group(max_num_attacked_only[attack_type], w)

      // // Set attack only group
      // node_group_x[attack_type]['attack-only'] = {}
      // node_group_x[attack_type]['attack-only']['start_x'] = node_group_x[attack_type]['original-and-target']['end_x'] + graph_margin['group_lr']
      // node_group_x[attack_type]['attack-only']['end_x'] = node_group_x[attack_type]['attack-only']['start_x'] + length_node_group(max_num_attacked_only[attack_type], w)

      // // Set target group
      // node_group_x[attack_type]['target'] = {}
      // node_group_x[attack_type]['target']['start_x'] = node_group_x[attack_type]['attack-only']['end_x'] + graph_margin['group_lr']
      // node_group_x[attack_type]['target']['end_x'] = node_group_x[attack_type]['target']['start_x'] + length_node_group(top_k, w) 
      
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

function write_layers() {
  d3.select('#g-layer')
    .selectAll('layers')
    .data(layers)
    .enter()
    .append('text')
    .attr('id', function(layer) { return 'layer-' + layer })
    .attr('class', 'layer-text')
    .text(function(layer) { return layer })
    .attr('x', layer_x())
    .attr('y', function(layer) { return y_coords[layer] + node_size[selected_attack_info['attack_type']] / 2 + 5})
}

function layer_x() {
  return graph_margin['start_x'] - 80
}

function draw_neurons() {

  // Initialize clicked neurons
  pinned_neurons = {}
  
  // Draw neurons in original, original & target, target graph
  var graph_keys = ['original', 'original-and-target', 'target', 'attack-only']
  graph_keys.forEach(graph_key => {
    append_node(graph_key)
  })

  // Update nodes' visibilities
  update_node_opacity()

  // Write neuron id
  draw_neuron_id()

  // Functions
  function append_node(graph_key) {

    layers.forEach(layer => {
      var neuron_data = get_neuron_data(graph_key, layer)
      append_node_rect(graph_key, neuron_data)
    })
    append_node_end_circles(graph_key)
    append_feature_vis(graph_key)
    
    append_comp_nodes(graph_key)

    function get_neuron_data(graph_key, layer) {
      var neuron_data = ''
      if (graph_key == 'attack-only') {
        neuron_data = unique_attack_only_neurons[selected_attack_info['attack_type']][layer]
      } else {
        neuron_data = extracted_neurons[layer][graph_key]
      }
      return neuron_data
    }

    function append_node_rect(graph_key, neuron_data) {
      d3.select('#g-node')
        .selectAll('nodes')
        .data(neuron_data)
        .enter()
        .append('g')
        .attr('id', function(neuron) { return 'g-' + get_node_id(neuron) })
        .attr('class', function(neuron, i) { return g_node_class(neuron, graph_key, i) })
        .attr('transform', function(neuron, i) { return g_transform(graph_key, neuron, i) })
        .append('rect')
        .attr('id', function(neuron) { return get_node_id(neuron) })
        .attr('class', function(neuron) { return get_node_class(graph_key, neuron) })
        .attr('width', node_size[selected_attack_info['attack_type']])
        .attr('height', node_size[selected_attack_info['attack_type']])
        .attr('rx', 0.2 * node_size[selected_attack_info['attack_type']])
        .attr('ry', 0.2 * node_size[selected_attack_info['attack_type']])
        .style('fill', node_color[graph_key])
        .on('mouseover', function(neuron) { return mouseover_node(neuron) })
        .on('mouseout', function(neuron) { return mouseout_node(neuron) })
        .on('click', function(neuron) { return click_node(neuron) })
    }

    function append_node_end_circles(graph_key) {
      var ns = node_size[selected_attack_info['attack_type']]
      var r = 0.13 * ns

      d3.selectAll('.g-node-' + graph_key)
        .append('circle')
        .attr('id', function(neuron) { return 'node-circle-curr-' + neuron })
        .attr('class', 'node-circle')
        .attr('cx', ns / 2)
        .attr('r', r)
        .attr('fill', node_color[graph_key])
        .style('display', 'none')

      d3.selectAll('.g-node-' + graph_key)
        .append('circle')
        .attr('id', function(neuron) { return 'node-circle-next-' + neuron })
        .attr('class', 'node-circle')
        .attr('cx', ns / 2)
        .attr('cy', ns)
        .attr('r', r)
        .attr('fill', node_color[graph_key])
        .style('display', 'none')
    }
  
    function append_feature_vis(graph_key) {
      d3.selectAll('.g-node-' + graph_key)
        .append('image')
        .attr('id', function(neuron) { return 'fv-' + neuron })
        .attr('class', 'fv fv-' + graph_key)
        .attr('width', node_size[selected_attack_info['attack_type']])
        .attr('height', node_size[selected_attack_info['attack_type']])
        .attr('xlink:href', function(neuron) { return vis_filename(neuron, 'channel') })
        .attr('clip-path', 'url(#rounded-edge)')
        .style('display', 'none')
        .on('mouseover', function(neuron) { return mouseover_node(neuron) })
        .on('mouseout', function(neuron) { return mouseout_node(neuron) })
        .on('click', function(neuron) { return click_node(neuron) })
    }
  
    function append_comp_nodes(graph_key) {
      d3.selectAll('.g-node-' + graph_key)
        .append('rect')
        .attr('id', function(neuron) { return 'inner-' + get_node_id(neuron) })
        .attr('class', 'inner-node inner-node-' + graph_key)
        .attr('width', 0.5 * node_size[selected_attack_info['attack_type']])
        .attr('height', 0.5 * node_size[selected_attack_info['attack_type']])
        .attr('rx', 0.1 * node_size[selected_attack_info['attack_type']])
        .attr('ry', 0.1 * node_size[selected_attack_info['attack_type']])
        .attr('x', 0.25 * node_size[selected_attack_info['attack_type']])
        .attr('y', 0.25 * node_size[selected_attack_info['attack_type']])
        .style('fill', node_color[graph_key])
        .style('display', 'none')
        .on('mouseover', function(neuron) { return mouseover_node(neuron) })
        .on('mouseout', function(neuron) { return mouseout_node(neuron) })
        .on('click', function(neuron) { return click_node(neuron) })
    }

    function g_node_class(neuron, graph_key, i) {
      var layer = neuron.split('-')[0]
      var c1 = 'g-node'
      var c2 = 'g-node-' + graph_key
      var c3 = 'g-node-' + layer + '-' + graph_key
      var c4 = 'g-node-' + graph_key + '-' + i
      var c5 = 'g-node-' + layer
      return [c1, c2, c3, c4, c5].join(' ')
    }
  }
  
  function draw_neuron_id() {
    var ns = node_size[selected_attack_info['attack_type']]

    d3.selectAll('.g-node')
      .append('text')
      .attr('id', function(neuron_id) { return 'neuron-id-' + neuron_id })
      .attr('class', 'neuron-id')
      .text(function(neuron_id) { return neuron_id.split('-')[1] })
      .attr('y', -3)
      .style('font-size', function() { return ns * 0.6 })
      .style('display', 'none')
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

  function mouseover_node(neuron) {

    // Mouse pointer
    var node_id = get_node_id(neuron)
    d3.select('#g-node-' + neuron).style('cursor', 'pointer')

    // Show feature vis
    turn_on_node_feature_vis(neuron)

    // Show feature vis of connected neurons
    turn_on_connected_node_feature_vis(neuron)

    // Flowline edges
    flow_edges()

    // Show neuron id
    d3.select('#neuron-id-' + neuron).style('display', 'block')
    
    // Show node box
    var node_box_id = get_node_box_id(neuron)
    show_node_box()

    // Functions

    function flow_edges() {
      d3.selectAll('.edge-from-' + neuron)
        .classed('flowline', true)
        .style('stroke-width', function() {
          var curr_stroke_width = parseFloat(d3.select(this).style('stroke-width'))
          return curr_stroke_width * edge_style['magnify']
        })
      d3.selectAll('.edge-into-' + neuron)
        .classed('flowline', true)
        .style('stroke-width', function() {
          var curr_stroke_width = parseFloat(d3.select(this).style('stroke-width'))
          return curr_stroke_width * edge_style['magnify']
        })
    }

    function show_node_box() {
      // Add node box if it does not exist
      if (!does_exist(node_box_id)) {
        add_node_box()
      }
      // Show node box if it exists
      else {
        var [node_x, node_y]  = get_translate_coords('g-' + node_id)

        d3.select('#' + node_box_id)
          .style('display', 'block')
          .attr('transform', function() {
            var x = node_x + node_box_style['left']
            var y = node_y + (node_size[selected_attack_info['attack_type']] - node_box_style['height']) / 2 + 100
            return 'translate(' + x + ',' + y +')'
          })
      } 
    }

    function add_node_box() {
      mk_node_box_g()
      mk_node_box_bg()
      draw_node_box_fv()
      draw_examples() 
      draw_activation_plot()
    }

    function mk_node_box_g() {
      var [node_x, node_y]  = get_translate_coords('g-' + node_id)
      
      d3.select('#g-node')
        .append('g')
        .attr('id', node_box_id)
        .attr('class', 'node-box')
        .attr('transform', function() {
          var x = node_x + node_box_style['left']
          var y = node_y + (node_size[selected_attack_info['attack_type']] - node_box_style['height']) / 2 + 100
          return 'translate(' + x + ',' + y +')'
        })
    }

    function mk_node_box_bg() {
      d3.select('#' + node_box_id)
        .append('rect')
        .attr('id', node_box_id + '-bg')
        .attr('class', 'nodebox-bg')
        .attr('width', node_box_style['width'])
        .attr('height', node_box_style['height'])
    }
    
    function draw_node_box_fv() {
      d3.select('#' + node_box_id)
        .append('image')
        .attr('id', node_box_id + '-fv')
        .attr('class', 'nodebox-fv')
        .attr('xlink:href', vis_filename(neuron, 'channel'))
        .attr('x', 0)
        .attr('y', 0)
        .attr('transform', function() { return fv_transform() })
        .attr('width', node_box_style['fv-width'])
        .attr('height', node_box_style['fv-height'])

      function fv_transform() {
        var x = node_box_style['fv-left']
        var y = node_box_style['fv-top']
        return 'translate(' + x + ',' + y + ')'
      }
    }

    function draw_examples() {
      for(var i = 0; i < 10; i++) {
        d3.select('#' + node_box_id)
          .append('image')
          .attr('id', node_box_id + '-ex-' + i)
          .attr('class', 'nodebox-ex')
          .attr('xlink:href', vis_filename(neuron, 'ex-' + i))
          .attr('x', 0)
          .attr('y', 0)
          .attr('transform', function() { return ex_transform(i) })
          .attr('width', node_box_style['ex-width'])
          .attr('height', node_box_style['ex-height'])
      }

      function ex_transform(i) {
        var x = node_box_style['fv-left'] + node_box_style['fv-width'] + node_box_style['fv-ex-padding']
        x += (i % 5) * (node_box_style['ex-padding'] + node_box_style['ex-width'])
        var y = node_box_style['ex-top'] + parseInt(i / 5) * (node_box_style['ex-height'] + node_box_style['ex-padding'])
        return 'translate(' + x + ',' + y + ')'
      }
    }

    function draw_activation_plot() {

      // Get activation data
      var layer = neuron.split('-')[0]
      var med_acts = get_activation_data()
      
      // Draw scatter plot
      draw_axis()
      draw_class_line()
      draw_lines()
      draw_dots()   
      
      // Functions
      function draw_class_line() {
        var start_x = get_start_x()
        var end_x = start_x + node_box_style['act-plot-width']
        var neuron = node_box_id.split('-').slice(-2).join('-')
        var layer = node_box_id.split('-')[2]
        var original_act_val = activation_data[layer][neuron]['original'][act_type]
        var target_act_val = activation_data[layer][neuron]['target'][act_type]

        // Add original class activation line
        d3.select('#' + node_box_id)
          .append('line')
          .attr('class', 'activation-original')
          .attr('x1', start_x)
          .attr('x2', end_x)
          .attr('y1', activation_y(original_act_val))
          .attr('y2', activation_y(original_act_val))
          .style('stroke', node_color['original'])

        // Add target class activation line
        d3.select('#' + node_box_id)
          .append('line')
          .attr('class', 'activation-target')
          .attr('x1', start_x)
          .attr('x2', end_x)
          .attr('y1', activation_y(target_act_val))
          .attr('y2', activation_y(target_act_val))
          .style('stroke', node_color['target'])
      }

      function draw_lines() {
        var coords = []
        med_acts.forEach((med_act, i) => {
          var x = activation_x(i)
          var y = activation_y(med_act)
          coords.push([x, y])
        })

        d3.select('#' + node_box_id)
          .append('path')
          .attr('id', node_box_id + '-scatter-line')
          .attr('class', 'node-box-scatter-line')
          .attr('d', d3.line()(coords))
      }

      function get_activation_data() {
        var med_acts = [activation_data[layer][neuron]['original'][act_type]]
        attack_strengths[selected_attack_info['attack_type']].forEach(strength => {
          var attack_key = get_value_key('attacked', selected_attack_info['attack_type'], strength)
          var med_act = activation_data[layer][neuron][attack_key][act_type]
          med_acts.push(med_act)
        })
        return med_acts
      }

      function draw_dots() {
        d3.select('#' + node_box_id)
          .selectAll('scatter-dots')
          .data(med_acts)
          .enter()
          .append('circle')
          .attr('id', function (a, i) { 
            if (i > 10) {
              console.log(node_box_id)
            }
            return node_box_id + '-circle-' + i
          })
          .attr('class', function(a, i) { return scatter_dots_class(i) })
          .attr('r', function(a, i) { return scatter_circle_r(i) })
          .attr('cy', function(a) { return activation_y(a) })
          .attr('cx', function(a, i) { return activation_x(i) })
          .style('fill', function(a, i) { return scatter_circle_color(i) })
      }

      function activation_x(i) {
        var start_x = get_start_x()
        var num_strength = attack_strengths[selected_attack_info['attack_type']].length
        var val_x = i * (node_box_style['act-plot-width']) / num_strength
        return start_x + val_x
      }

      function get_start_x() {
        var start_x = node_box_style['fv-left'] + node_box_style['fv-width'] + node_box_style['fv-ex-padding']
        start_x += 5 * (node_box_style['ex-padding'] + node_box_style['ex-width']) - node_box_style['ex-padding']
        start_x += node_box_style['act-ex-padding']
        return start_x
      }
  
      function activation_y(a) {
        var start_y = node_box_style['act-plot-top'] + node_box_style['act-plot-height']
        var val_y = activation_y_scale[layer](a)
        return start_y - val_y
      }

      function draw_axis() {
        d3.select('#' + node_box_id)
          .append('g')
          .attr('id', node_box_id + '-x-axis')
          .attr('class', 'node-box-axis node-box-x-axis')
          .attr('transform', function() {
            var x = activation_x(0)
            var y = node_box_style['act-plot-top'] + node_box_style['act-plot-height']
            return 'translate(' + x + ',' + y + ')'
          })

        d3.select('#' + node_box_id)
          .append('g')
          .attr('id', node_box_id + '-y-axis')
          .attr('class', 'node-box-axis node-box-y-axis')
          .attr('transform', function() {
            var x = activation_x(0)
            var y = node_box_style['act-plot-top']
            return 'translate(' + x + ',' + y + ')'
          })

        var max_attack_strength = attack_strengths[selected_attack_info['attack_type']].slice(-1)[0]
        var x_scale = d3
          .scaleLinear()
          .domain([0, max_attack_strength])
          .range([0, node_box_style['act-plot-width']])

        var layer = neuron.split('-')[0]
        var y_scale = d3
          .scaleLinear()
          .domain(activation_range[layer])
          .range([node_box_style['act-plot-height'], 0])

        var x_axis = d3
          .axisBottom()
          .scale(x_scale)
          .tickFormat(function(d, i) {
            if (i % 2 == 0) {
              return d
            }
          })

        var y_axis = d3
          .axisLeft()
          .scale(y_scale)
          .ticks(4)

        d3.select('#' + node_box_id + '-x-axis')
          .call(x_axis)
        
        d3.select('#' + node_box_id + '-y-axis')
          .call(y_axis)
      }
      
      function scatter_dots_class(i) {
        var c1 = 'node-box-scatter-circle'
        var c2 = 'node-box-scatter-circle-' + i
        return [c1, c2].join(' ')
      }

      function scatter_circle_color(i) {
        var curr_strength = selected_attack_info['attack_strength']
        var curr_attack_type = selected_attack_info['attack_type']
        var curr_strength_idx = 0
        if (curr_strength > 0) {
          curr_strength_idx = attack_strengths[curr_attack_type].indexOf(curr_strength) + 1
        }
        if (i == curr_strength_idx) {
          return 'red'
        } else {
          return 'gray'
        }
      }
      
      function scatter_circle_r(i) {
        var curr_strength = selected_attack_info['attack_strength']
        var curr_attack_type = selected_attack_info['attack_type']
        var curr_strength_idx = 0
        if (curr_strength > 0) {
          curr_strength_idx = attack_strengths[curr_attack_type].indexOf(curr_strength) + 1
        }
        if (i == curr_strength_idx) {
          return 4
        } else {
          return 2
        }
      }
      
    }
  }

  function mouseout_node(neuron) {

    // Turn of node box
    var node_box_id = get_node_box_id(neuron)
    d3.select('#' + node_box_id).style('display', 'none')

    // Turn off the neuron id
    d3.select('#neuron-id-' + neuron).style('display', 'none')

    // Set the feature vis
    back_to_previous_fv_opacity()
    back_to_previous_fv_display()

    // Return to previous edge setting
    back_to_previous_edges()

    function back_to_previous_fv_display() {
      turn_off_node_feature_vis(neuron)
      turn_off_connected_node_feature_vis(neuron)
    }

    function back_to_previous_fv_opacity() {
      d3.select('#fv-' + neuron)
        .style('opacity', function(neuron) {
          if (highlight_pathways['neurons']['selected'] == 'activated') {
            if (is_most_activated(neuron, selected_attack_info['attack_strength'])) {
              return node_opacity['activated']
            } 
          } else if (highlight_pathways['neurons']['selected'] == 'excited') {
            if (is_most_excited(neuron, selected_attack_info['attack_strength'])) {
              return node_opacity['activated']
            } 
          } else if (highlight_pathways['neurons']['selected'] == 'inhibited') {
            if (is_most_inhibited(neuron, selected_attack_info['attack_strength'])) {
              return node_opacity['activated']
            } 
          }
          return node_opacity['fv-deactivated']
        })
    }

    function back_to_previous_edges() {
      d3.selectAll('.edge-from-' + neuron)
        .classed('flowline', false)
        .style('stroke-width', function() {
          var curr_stroke_width = parseFloat(d3.select(this).style('stroke-width'))
          return curr_stroke_width / edge_style['magnify']
        })

      d3.selectAll('.edge-into-' + neuron)
        .classed('flowline', false)
        .style('stroke-width', function() {
          var curr_stroke_width = parseFloat(d3.select(this).style('stroke-width'))
          return curr_stroke_width / edge_style['magnify']
        })
    }
  }

  function click_node(neuron) {
    if (is_pinned(neuron)) {
      // Turn off the neuron
      turn_off_node_feature_vis(neuron)
      unpin_neuron(neuron)

      // Turn off edges
      // dehighlight_edges_of_pinned_neuron(neuron)
    } else {
      // Turn on the neuron
      console.log('click', neuron)
      turn_on_node_feature_vis(neuron)
      pin_neuron(neuron)

      // Turn on edges
      // highlight_edges_of_pinned_neuron(neuron)
    }
  }

  function get_node_box_id(neuron) {
    return ['node-box', neuron].join('-')
  }

  function turn_on_node_feature_vis(neuron) {
    d3.select('#fv-' + neuron)
      .style('display', 'block')
      .style('opacity', node_opacity['activated'])
    d3.select('#node-' + neuron)
      .style('display', 'none')
  }

  function turn_on_connected_node_feature_vis(neuron) {
    
    // Show next layer's connected neurons' feature vis
    var layer = neuron.split('-')[0]
    if (layer != 'mixed5b') {
      highlighted_edges[layer].forEach(edge_info => {
        if (edge_info['curr'] == neuron) {
          var next_neuron = edge_info['next']
          turn_on_node_feature_vis(next_neuron)
        }
      })
    }

    // Show previous layer's connected neurons' feature vis
    if (layer != 'mixed3a') {
      var prev_layer = layers[layers.indexOf(layer) + 1]
      highlighted_edges[prev_layer].forEach(edge_info => {
        if (edge_info['next'] == neuron) {
          var prev_neuron = edge_info['curr']
          turn_on_node_feature_vis(prev_neuron)
        }
      })
    }
    
  }

  function turn_off_node_feature_vis(neuron) {

    if (!is_pinned(neuron)) {
      d3.select('#neuron-id-' + neuron)
        .style('display', 'none')
      d3.select('#fv-' + neuron)
        .style('display', 'none')
      d3.select('#node-' + neuron)
        .style('display', 'block')
    }
    
  }

  function turn_off_connected_node_feature_vis(neuron) {
    
    // Show next layer's connected neurons' feature vis
    var layer = neuron.split('-')[0]
    if (layer != 'mixed5b') {
      highlighted_edges[layer].forEach(edge_info => {
        if (edge_info['curr'] == neuron) {
          var next_neuron = edge_info['next']
          turn_off_node_feature_vis(next_neuron)
        }
      })
    }

    // Show previous layer's connected neurons' feature vis
    if (layer != 'mixed3a') {
      var prev_layer = layers[layers.indexOf(layer) + 1]
      highlighted_edges[prev_layer].forEach(edge_info => {
        if (edge_info['next'] == neuron) {
          var prev_neuron = edge_info['curr']
          turn_off_node_feature_vis(prev_neuron)
        }
      })
    }
    
  }

}

function g_transform(graph_key, neuron, i) {
  var x = get_node_x(graph_key, i)
  var y = get_node_y(neuron)
  return 'translate(' + x + ',' + y + ')'
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

function pin_neuron(neuron) {
  var layer = neuron.split('-')[0]
  if (!(layer in pinned_neurons)) {
    pinned_neurons[layer] = {}
  }
  pinned_neurons[layer][neuron] = true
}

function unpin_neuron(neuron) {
  var layer = neuron.split('-')[0]
  if (neuron in pinned_neurons[layer])  {
    pinned_neurons[layer][neuron] = false
  }
}

function is_pinned(neuron) {
  var layer = neuron.split('-')[0]
  if (!(layer in pinned_neurons)) {
    return false
  } 

  if (!(neuron in pinned_neurons[layer])) {
    return false
  }

  return pinned_neurons[layer][neuron]
}

function add_highlighted_edges(neuron, next_neuron) {
  var edge_pair = [neuron, next_neuron].join('_')
  highlighted_edges[edge_pair] = true
}

function remove_highlighted_edges(neuron, next_neuron) {
  var edge_pair = [neuron, next_neuron].join('_')
  highlighted_edges[edge_pair] = false
}

function is_highlighted_edge(neuron, next_neuron) {
  var edge_pair = [neuron, next_neuron].join('_')
  if (!(edge_pair in highlighted_edges)) {
    return false
  }
  return highlighted_edges[edge_pair]
}

function highlight_edges_of_pinned_neuron(neuron) {

  var layer = neuron.split('-')[0]

  // Highlight edges with previous layer
  if (layer != 'mixed3a') {
    var prev_layer = layers[layers.indexOf(layer) + 1]
    if (prev_layer in pinned_neurons) {
      for (var prev_neuron in pinned_neurons[prev_layer]) {
        if (pinned_neurons[prev_layer][prev_neuron]) {
          add_highlighted_edges(prev_neuron, neuron)
          var edge_id = ['edge', prev_neuron, neuron].join('-')
          d3.select('#' + edge_id)
            .style('display', 'block')
            .classed('edge-shown', true)
          d3.select('#node-circle-curr-' + prev_neuron)
            .style('display', 'block')
          d3.select('#node-circle-next-' + neuron)
            .style('display', 'block')
        }
      }
    }
  }
  
  // Highlight edges with next layer
  if (layer != 'mixed5b') {
    var next_layer = layers[layers.indexOf(layer) - 1]
    if (next_layer in pinned_neurons) {
      for (var next_neuron in pinned_neurons[next_layer]) {
        if (pinned_neurons[next_layer][next_neuron]) {
          add_highlighted_edges(neuron, next_neuron)
          var edge_id = ['edge', neuron, next_neuron].join('-')
          d3.select('#' + edge_id)
            .style('display', 'block')
            .classed('edge-shown', true)
        }
      }
    }
  }

  update_node_circle_display()
}

function dehighlight_edges_of_pinned_neuron(neuron) {
  
  d3.selectAll('.edge-from-' + neuron)
    .style('display', 'none')
    .classed('edge-shown', false)
  d3.selectAll('.edge-into-' + neuron)
    .style('display', 'none')
    .classed('edge-shown', false)

  // Remove edges with previous layer
  var layer = neuron.split('-')[0]
  if (layer != 'mixed3a') {
    var prev_layer = layers[layers.indexOf(layer) + 1]
    if (prev_layer in pinned_neurons) {
      for (var prev_neuron in pinned_neurons[prev_layer]) {
        remove_highlighted_edges(prev_neuron, neuron)
      }
    }
  }
  
  // Highlight edges with next layer
  if (layer != 'mixed5b') {
    var next_layer = layers[layers.indexOf(layer) - 1]
    if (next_layer in pinned_neurons) {
      for (var next_neuron in pinned_neurons[next_layer]) {
        remove_highlighted_edges(neuron, next_neuron)
      }
    }
  }

  update_node_circle_display()
}

function update_node_circle_display() {
  d3.selectAll('.node-circle').style('display', 'none')

  for (var edge in highlighted_edges) {
    var [curr, next] = edge.split('_')
    if (highlighted_edges[edge]) {
      d3.select('#node-circle-curr-' + curr).style('display', 'block')
      d3.select('#node-circle-next-' + next).style('display', 'block')
    }
  }
}

export function update_node_opacity() {

  off_all_node()

  if (highlight_pathways['neurons']['selected'] == 'activated') {
    update_opacity_most_activated()
  } else if (highlight_pathways['neurons']['selected'] == 'changed') {
    if (selected_attack_info['attack_strength'] > 0) {
      update_opacity_most_changed()
    }
  } else if (highlight_pathways['neurons']['selected'] == 'excited') {
    if (selected_attack_info['attack_strength'] > 0) {
      update_opacity_most_excited()
    }
  } else if (highlight_pathways['neurons']['selected'] == 'inhibited') {
    if (selected_attack_info['attack_strength'] > 0) {
      update_opacity_most_inhibited()
    }
  }

  function update_opacity_most_activated() {
    if (selected_attack_info['attack_strength'] == 0) {
      d3.selectAll('.node-original')
        .style('fill-opacity', node_opacity['activated'])  
      d3.selectAll('.node-original-and-target')
        .style('fill-opacity', node_opacity['activated'])  
      d3.selectAll('.fv-original')
        .style('opacity', node_opacity['activated'])  
      d3.selectAll('.fv-original-and-target')
        .style('opacity', node_opacity['activated'])  
    }
    else {
      d3.selectAll('.node')
        .style('fill-opacity', function(neuron) {
          if (is_most_activated(neuron, selected_attack_info['attack_strength'])) {
            return node_opacity['activated']
          } else {
            return node_opacity['deactivated']
          }
        })
      d3.selectAll('.fv')
        .style('opacity', function(neuron) {
          if (is_most_activated(neuron, selected_attack_info['attack_strength'])) {
            return node_opacity['activated']
          } else {
            return node_opacity['fv-deactivated']
          }
        })
    }
  }

  function update_opacity_most_excited() {
    d3.selectAll('.node')
      .style('fill-opacity', function(neuron) {
        if (is_most_excited(neuron, selected_attack_info['attack_strength'])) {
          return node_opacity['activated']
        } else {
          return node_opacity['deactivated']
        }
      })
    d3.selectAll('.fv')
      .style('opacity', function(neuron) {
        if (is_most_excited(neuron, selected_attack_info['attack_strength'])) {
          return node_opacity['activated']
        } else {
          return node_opacity['fv-deactivated']
        }
      })
  }

  function update_opacity_most_inhibited() {
    d3.selectAll('.node')
      .style('fill-opacity', function(neuron) {
        if (is_most_inhibited(neuron, selected_attack_info['attack_strength'])) {
          return node_opacity['activated']
        } else {
          return node_opacity['deactivated']
        }
      })
    d3.selectAll('.fv')
      .style('opacity', function(neuron) {
        if (is_most_inhibited(neuron, selected_attack_info['attack_strength'])) {
          return node_opacity['activated']
        } else {
          return node_opacity['fv-deactivated']
        }
      })
  }

  function update_opacity_most_changed() {
    d3.selectAll('.node')
      .style('fill-opacity', function(neuron) {
        if (is_most_changed(neuron, selected_attack_info['attack_strength'])) {
          return node_opacity['activated']
        } else {
          return node_opacity['deactivated']
        }
      })
    d3.selectAll('.fv')
      .style('opacity', function(neuron) {
        if (is_most_changed(neuron, selected_attack_info['attack_strength'])) {
          return node_opacity['activated']
        } else {
          return node_opacity['fv-deactivated']
        }
      })
  }
  
}

function is_most_activated(neuron, strength) {
  var layer = neuron.split('-')[0]
  var num_neurons = document.getElementsByClassName('g-node-' + layer).length
  var num_highlight = parseInt(num_neurons * highlight_pathways['neurons']['top-k'] / 100)

  var key = 'original'
  if (strength > 0) {
    var key = get_value_key('attacked', selected_attack_info['attack_type'], strength)
  }

  var top_neurons_to_highlight = most_activated_extracted_data[layer][key].slice(0, num_highlight)
  if (top_neurons_to_highlight.includes(neuron)) {
    return true
  } else {
    return false
  }
}

function is_most_excited(neuron, strength) {
  if (strength == 0) {
    return false
  } else {
    var layer = neuron.split('-')[0]
    var num_neurons = document.getElementsByClassName('g-node-' + layer).length
    var num_highlight = parseInt(num_neurons * highlight_pathways['neurons']['top-k'] / 100)
    var attack_key = get_value_key('attacked', selected_attack_info['attack_type'], strength)
    var top_neurons_to_highlight = most_inhibited_extracted_data[layer][attack_key].slice(-num_highlight)
    if (top_neurons_to_highlight.includes(neuron)) {
      return true
    } else {
      return false
    }
  }
}

function is_most_inhibited(neuron, strength) {
  if (strength == 0) {
    return false
  } else {
    var layer = neuron.split('-')[0]
    var num_neurons = document.getElementsByClassName('g-node-' + layer).length
    var num_highlight = parseInt(num_neurons * highlight_pathways['neurons']['top-k'] / 100)
    var attack_key = get_value_key('attacked', selected_attack_info['attack_type'], strength)
    var top_neurons_to_highlight = most_inhibited_extracted_data[layer][attack_key].slice(0, num_highlight)
    if (top_neurons_to_highlight.includes(neuron)) {
      return true
    } else {
      return false
    }
  }
}

function is_most_changed(neuron, strength) {
  if (strength == 0) {
    return false
  } else {
    var layer = neuron.split('-')[0]
    var num_neurons = document.getElementsByClassName('g-node-' + layer).length
    var num_highlight = parseInt(num_neurons * highlight_pathways['neurons']['top-k'] / 100)
    var attack_key = get_value_key('attacked', selected_attack_info['attack_type'], strength)
    var top_neurons_to_highlight = most_changed_extracted_data[layer][attack_key].slice(0, num_highlight)
    if (top_neurons_to_highlight.includes(neuron)) {
      return true
    } else {
      return false
    }
  }
}

export function update_graph_by_filter_graph() {

  if (filter_pathways['filter'] == 'all') {
    d3.select('#g-strength-bar').classed('disabled', false).style('opacity', 1)
    d3.select('#g-highlight-option-contents').classed('disabled', false).style('opacity', 1)
    rearrange_all_neurons()
    rearrange_all_edges()
    rearrange_layers_full_graph()
  } else {
    d3.select('#g-strength-bar').classed('disabled', true).style('opacity', 0.3)
    d3.select('#g-highlight-option-contents').classed('disabled', true).style('opacity', 0.3)
    var displayable_neurons = get_displayable_neurons(filter_pathways['filter'])
    var node_transforms = get_node_transforms(displayable_neurons)
    rearrange_neurons(node_transforms)
    rearrange_edges(node_transforms)
    rearrange_layers(node_transforms)
  }

  // Functions
  function get_displayable_neurons(filter_option) {

    if (filter_option == 'highlighted') {
      return get_highlightd_displayable_neurons()
    } else if (filter_option == 'selected') {
      return get_pinned_displayable_neurons()
    }

    function get_highlightd_displayable_neurons() {
      var grouped_highlighted_neurons = {}
      var highlighted_neurons = get_highlighted_neurons()
      for (var layer in highlighted_neurons) {
        grouped_highlighted_neurons[layer] = {}
        highlighted_neurons[layer].forEach(neuron => {
          var graph_key = d3.select('#g-node-' + neuron).attr('class').split(' ')[1].split('g-node-')[1]
          if (!(graph_key in grouped_highlighted_neurons[layer])) {
            grouped_highlighted_neurons[layer][graph_key] = []
          }
          grouped_highlighted_neurons[layer][graph_key].push(neuron)
        })
      }
      return grouped_highlighted_neurons
    }

    function get_pinned_displayable_neurons() {
      var displayable_neurons = {}
      for (var layer in pinned_neurons) {
        displayable_neurons[layer] = {}
        for (var neuron in pinned_neurons[layer]) {
          if (pinned_neurons[layer][neuron]) {
            var graph_key = d3.select('#node-' + neuron).attr('class').split(' ')[1].split('node-')[1]
            if (!(graph_key in displayable_neurons[layer])) {
              displayable_neurons[layer][graph_key] = []
            }
            displayable_neurons[layer][graph_key].push(neuron)
          }
        }
      }
      return displayable_neurons
    }
    
  }

  function get_node_transforms(displayable_neurons) {
    // node_style
    var node_transforms = {}
    var graph_keys = ['original', 'original-and-target', 'target', 'attack-only']

    for (var layer in displayable_neurons) {
      
      var start_x = 0
      var end_x = 0
      var ns = node_size[selected_attack_info['attack_type']]

      node_transforms[layer] = {}
      graph_keys.forEach(graph_key => {
        if (graph_key in displayable_neurons[layer]) {
          displayable_neurons[layer][graph_key].forEach((neuron, i) => {
            node_transforms[layer][neuron] = start_x + (i * (ns + node_style['neuron-lr']))
            end_x = start_x + (i * (ns + node_style['neuron-lr']))
          })
          start_x = end_x + ns + node_style['group-lr']
        }
      })

      for (var neuron in node_transforms[layer]) {
        node_transforms[layer][neuron] = 500 + node_transforms[layer][neuron] - (end_x + ns) / 2
      }
    }

    return node_transforms
  }

  function rearrange_neurons(node_transforms) {
    d3.selectAll('.g-node').style('display', 'none')

    for (var layer in node_transforms) {
      for (var neuron in node_transforms[layer]) {
        var [x, y] = get_translate_coords('g-node-' + neuron)       
        x = node_transforms[layer][neuron]
        d3.select('#g-node-' + neuron)
          .style('display', 'block')
          .transition()
          .duration(1500)
          .attr('transform', function() { return 'translate(' + x + ',' + y + ')' })
      }
    }
  }

  function rearrange_edges(node_transforms) {
    
    var ns = node_size[selected_attack_info['attack_type']]

    d3.selectAll('.edge-shown')
      .classed('edge-shown', function(edge) {
        var curr = edge['curr']
        var next = edge['next']
        var curr_layer = curr.split('-')[0]
        var next_layer = next.split('-')[0]
        if (!(curr_layer in node_transforms)) {
          return false
        }
        if (!(next_layer in node_transforms)) {
          return false
        }
        if (!(curr in node_transforms[curr_layer])) {
          return false
        } 
        if (!(next in node_transforms[next_layer])) {
          return false
        } 
        return true
      })
      .style('display', function(edge) {
        var curr = edge['curr']
        var next = edge['next']
        var curr_layer = curr.split('-')[0]
        var next_layer = next.split('-')[0]
        if (!(curr_layer in node_transforms)) {
          return 'none'
        }
        if (!(next_layer in node_transforms)) {
          return 'none'
        }
        if (!(curr in node_transforms[curr_layer])) {
          return 'none'
        } 
        if (!(next in node_transforms[next_layer])) {
          return 'none'
        } 
        return 'block'
      })

    if (filter_pathways['filter'] != 'selected') {
      update_edges_display()
    }

    d3.selectAll('.edge-shown')
      .transition()
      .duration(1500)
      .attr('d', function(edge) { 
        var curr = edge['curr']
        var next = edge['next']
        var [curr_x, curr_y] = get_translate_coords('g-node-' + curr)
        var [next_x, next_y] = get_translate_coords('g-node-' + next)
        var curr_layer = curr.split('-')[0]
        var next_layer = next.split('-')[0]
        var new_curr_x = node_transforms[curr_layer][curr] + (ns / 2)
        var new_next_x = node_transforms[next_layer][next] + (ns / 2)
        var curve = gen_curve(new_curr_x, curr_y, new_next_x, (next_y + ns))
        return curve
      })

    
  }

  function rearrange_layers(node_transforms) {
    layers.forEach(layer => {
      var node_x_min = d3.min(Object.values(node_transforms[layer]))
      d3.select('#layer-' + layer)
        .transition()
        .duration(1500)
        .attr('transform', 'translate(' + (node_x_min - 150) + ',0)')
    })
  }

  function rearrange_all_neurons() {
    
    d3.selectAll('.g-node').style('display', 'block')

    var graph_keys = ['original', 'original-and-target', 'target', 'attack-only']
    layers.forEach(layer => {
      graph_keys.forEach(graph_key => {
        d3.selectAll('.g-node-' + layer + '-' + graph_key)
          .transition()
          .duration(1500)
          .attr('transform', function(neuron, i) { return g_transform(graph_key, neuron, i) })
      })
      
    })

  }

  function rearrange_all_edges() {

    update_edges_display()

    var ns = node_size[selected_attack_info['attack_type']]
    d3.selectAll('.edge-shown')
      .transition()
      .duration(1500)
      .attr('d', function(edge) { 
        var curr = edge['curr']
        var next = edge['next']
        
        var [curr_graph_key, curr_i] = get_graph_key_and_i(curr)
        var [next_graph_key, next_i] = get_graph_key_and_i(next)

        var curr_x = get_node_x(curr_graph_key, curr_i) + (ns / 2) 
        var curr_y = get_node_y(curr)
        var next_x = get_node_x(next_graph_key, next_i) + (ns / 2) 
        var next_y = get_node_y(next) + ns
        
        var curve = gen_curve(curr_x, curr_y, next_x, next_y)
        return curve
      })

    function get_graph_key_and_i(neuron) {
      var graph_key_i = d3.select('#g-node-' + neuron).attr('class').split(' ')[3].split('g-node-').slice(-1)[0]
      var graph_key = graph_key_i.split('-').slice(0, -1).join('-')
      var i = parseInt(graph_key_i.split('-').slice(-1)[0])
      return [graph_key, i]
    }
  }

  function rearrange_layers_full_graph() {
    d3.selectAll('.layer-text')
      .transition()
      .duration(1500)
      .attr('transform', layer_x())
  }

}

export function update_scatter_circle() {

  d3.selectAll('.node-box-scatter-circle')
    .attr('r', 2)
    .style('fill', 'gray')

  var curr_strength = selected_attack_info['attack_strength']
  var curr_attack_type = selected_attack_info['attack_type']
  var curr_strength_idx = 0
  if (curr_strength > 0) {
    curr_strength_idx = attack_strengths[curr_attack_type].indexOf(curr_strength) + 1
  }

  d3.selectAll('.node-box-scatter-circle-' + curr_strength_idx)
    .attr('r', 4)
    .style('fill', 'red')
  
}

export function go_comparison_mode() {
  if (comp_attack['on']) {

    off_all_node()

    var weak = comp_attack['weak']
    var strong = comp_attack['strong']

    if (highlight_pathways['neurons']['selected'] == 'activated') {
      update_opacity_compare_mode(highlight_pathways['neurons']['selected'])
    } else if (highlight_pathways['neurons']['selected'] == 'changed') {
      update_opacity_compare_mode(highlight_pathways['neurons']['selected'])
    }

    function update_opacity_compare_mode(filter_method) {
      update_opacity_outer_rect(filter_method)
      update_opacity_inner_rect(filter_method)
    }

    function update_opacity_outer_rect(filter_method) {
      
      var f = filter_function(filter_method)
      console.log(filter_method, f)

      d3.selectAll('.node')
        .style('fill-opacity', function(neuron) {
          if (f(neuron, strong)) {
            return node_opacity['activated']
          } else {
            return node_opacity['deactivated']
          }
        })
    }

    function update_opacity_inner_rect(filter_method) {
      var f = filter_function(filter_method)

      var graph_keys = ['original', 'original-and-target', 'target', 'attack-only']
      graph_keys.forEach(graph_key => {
        d3.selectAll('.inner-node-' + graph_key)
          .style('display', 'block')
          .style('fill', function(neuron) {
            if (f(neuron, weak)) {
              return node_color[graph_key]
            } else {
              return 'white'
            }
          })
          .style('fill-opacity', function(neuron) {
            if (f(neuron, weak)) {
              return node_opacity['activated']
            } else {
              return 1 - node_opacity['deactivated']
            }
          })
          .style('display', function(neuron) {
            if (!(f(neuron, weak)) && !(f(neuron, strong))) {
              return 'none'
            } else {
              return 'block'
            }
          })
      })

    }

    function filter_function(filter_method) {
      if (filter_method == 'activated') {
        return is_most_activated
      } else if (filter_method == 'excited') {
        return is_most_excited
      } else if (filter_method == 'inhibited') {
        return is_most_inhibited
      } 
    }
  }

}

function off_all_node() {
  d3.selectAll('.node')
    .style('fill-opacity', node_opacity['deactivated'])
  d3.selectAll('.inner-node')
    .style('display', 'none')
}

function update_rounded_image_filter() {

  d3.select('#rounded-edge-rect')
    .attr('width', node_size[selected_attack_info['attack_type']])
    .attr('height', node_size[selected_attack_info['attack_type']])
    .attr('rx', 0.2 * node_size[selected_attack_info['attack_type']])
    .attr('ry', 0.2 * node_size[selected_attack_info['attack_type']])
}

////////////////////////////////////////////////////////////////////////////////////////////////
// Functions for drawing edges
////////////////////////////////////////////////////////////////////////////////////////////////

function update_edge_stroke_scale() {
  edge_stroke_scale = {}

  var min_inf = 10000
  var max_inf = 0

  layers.slice(1).forEach(layer => {
    edge_data[0][layer].forEach(d => {
      var inf = d['inf']
      min_inf = d3.min([min_inf, inf])
      max_inf = d3.max([max_inf, inf])
    })
  })


  attack_strengths[selected_attack_info['attack_type']].forEach(strength => {

    layers.slice(1).forEach(layer => {
      edge_data[strength][layer].forEach(d => {
        var inf = d['inf']
        min_inf = d3.min([min_inf, inf])
        max_inf = d3.max([max_inf, inf])
      })
    })
    
  })

  edge_stroke_scale[0] = d3
    .scaleLinear()
    .domain([min_inf, max_inf])
    .range([edge_style['min-stroke'], edge_style['max-stroke']])
  attack_strengths[selected_attack_info['attack_type']].forEach(strength => {
    edge_stroke_scale[strength] = d3
      .scaleLinear()
      .domain([min_inf, max_inf])
      .range([edge_style['min-stroke'], edge_style['max-stroke']])
  })
}

export function update_edges(strength) {

  // Remove the previous edges
  d3.selectAll('.edge').remove()

  // Add new edges
  layers.slice(1).forEach(layer => {
    d3.select('#g-edge')
      .selectAll('edges')
      .data(edge_data[strength][layer])
      .enter()
      .append('g')
      .attr('id', function(d) { return 'g-' + get_edge_id(d)})
      .attr('class', 'g-edge')
      .append('path')
      .attr('id', function(d) { return get_edge_id(d) })
      .attr('class', function(d) { return get_edge_class(d, layer) })
      .style('stroke-width', function(d) { return edge_stroke_scale[strength](d['inf']) })
      .style('stroke', edge_style['edge-color'])
      .style('fill', 'none')
      .style('stroke', function(d) { return edge_stroke(d) })
      .attr('d', function(d) { return gen_edge_curve(d) })
      .style('display', 'none')
      .style('opacity', edge_style['edge-opacity'])
  })

  function get_edge_id(d) {
    return ['edge', d['curr'], d['next']].join('-')
  }

  function get_edge_class(d, layer) {
    var c1 = 'edge'
    var c2 = 'edge-from-' + d['curr']
    var c3 = 'edge-into-' + d['next']
    var c4 = 'edge-' + layer
    return [c1, c2, c3, c4].join(' ')
  }

  function edge_stroke(d) {
    var curr = d['curr']
    var next = d['next']
    var curr_key = d3.select('#node-' + curr).attr('class').split(' ')[1].split('node-')[1]
    var next_key = d3.select('#node-' + next).attr('class').split(' ')[1].split('node-')[1]
    return ['url(#color-gradient', next_key, curr_key].join('-') + ')'
  }

  function gen_edge_curve(d) {

    var curr_node_coords = get_translate_coords('g-node-' + d['curr'])
    var next_node_coords = get_translate_coords('g-node-' + d['next'])
  
    var x1 = curr_node_coords[0] + node_size[selected_attack_info['attack_type']] / 2
    var y1 = curr_node_coords[1]
    var x2 = next_node_coords[0] + node_size[selected_attack_info['attack_type']] / 2
    var y2 = next_node_coords[1] + node_size[selected_attack_info['attack_type']]
  
    return gen_curve(x1, y1, x2, y2)
  }

}

function gen_curve(x1, y1, x2, y2) {

  if (x1 == x2) {
    x1 = x1 + 0.1
    // return 'M ' + x1 + ' ' + y1 + ' L ' + x2 + ' ' + y2
  } else {
    
  }
  var c1_x = (3 * x1 + x2) / 4
    var c1_y = (3 * y1 + y2) / 4 - (y1 - y2) * 0.6
    var c2_x = (x1 + 3 * x2) / 4
    var c2_y = (y1 + 3 * y2) / 4 + (y1 - y2) * 0.6
  
    var path = 'M ' + x1 + ',' + y1
    path += ' C ' + c1_x + ' ' + c1_y
    path += ' ' + c2_x + ' ' + c2_y + ','
    path += ' ' + x2 + ' ' + y2
    return path
}

export function update_edges_display() {
  
  // Get currently highlighted neurons
  var highlighted_neurons = get_highlighted_neurons()

  // Get currently highligtable edges
  var potentially_highlighted_edges = get_highlightable_edges(highlighted_neurons)

  // Initialized whether edges be highlighted
  highlighted_edges = {}
  d3.selectAll('.edge').classed('edge-shown', false).style('display', 'none')

  // Highlight edges based on the selected option
  var most_option = highlight_pathways['connections']['selected']
  if (most_option == 'activated') {
    get_most_activated_highlightable_edges()
  } else if (most_option == 'changed') {
    get_most_changed_highlightable_edges()
  } else if (most_option == 'excited') {
    get_most_excited_highlightable_edges()
  } else if (most_option == 'inhibited') {
    get_most_inhibited_highlightable_edges()
  } else {
    console.log('ERROR: Unknown most_option:', most_option)
  }

  get_edges_to_highlight()
  highlight_top_edges()

  function get_most_activated_highlightable_edges() {
    // Sort the highlightable edges
    for (var layer in potentially_highlighted_edges) {
      var sorted_edges = potentially_highlighted_edges[layer].sort(function(a, b) {
        return b['inf'] - a['inf'] 
      })
      potentially_highlighted_edges[layer] = sorted_edges
    }
  }

  function get_most_excited_highlightable_edges() {
    
    // Sort the highlightable edges
    layers.slice(1).forEach(layer => {
      var sorted_edges = potentially_highlighted_edges[layer].sort(function(edge_1, edge_2) {
        // Get delta inf of edge_1
        var delta_inf_1 = edge_1['inf'] - get_benign_edge_inf(edge_1['curr'], edge_1['next'])
        
        // Get delta inf of edge_2
        var delta_inf_2 = edge_2['inf'] - get_benign_edge_inf(edge_2['curr'], edge_2['next'])

        return delta_inf_2 - delta_inf_1
      })
      potentially_highlighted_edges[layer] = sorted_edges
    })

  }

  function get_most_inhibited_highlightable_edges() {
    // Sort the highlightable edges
    layers.slice(1).forEach(layer => {
      var sorted_edges = potentially_highlighted_edges[layer].sort(function(edge_1, edge_2) {
        // Get delta inf of edge_1
        var delta_inf_1 = edge_1['inf'] - get_benign_edge_inf(edge_1['curr'], edge_1['next'])

        // Get delta inf of edge_2
        var delta_inf_2 = edge_2['inf'] - get_benign_edge_inf(edge_2['curr'], edge_2['next'])

        return delta_inf_1 - delta_inf_2
      })
      potentially_highlighted_edges[layer] = sorted_edges
    })
  }

  function get_most_changed_highlightable_edges() {
    
    // Sort the highlightable edges
    layers.slice(1).forEach(layer => {
      var sorted_edges = potentially_highlighted_edges[layer].sort(function(edge_1, edge_2) {
        // Get absolute delta inf of edge_1
        var delta_inf_1 = Math.abs(edge_1['inf'] - get_benign_edge_inf(edge_1['curr'], edge_1['next']))

        // Get delta inf of edge_2
        var delta_inf_2 = Math.abs(edge_2['inf'] - get_benign_edge_inf(edge_2['curr'], edge_2['next']))

        return delta_inf_2 - delta_inf_1
      })
      potentially_highlighted_edges[layer] = sorted_edges
    })

  }

  function get_benign_edge_inf(curr, next) {
    var layer = curr.split('-')[0]
    if (!(layer in benign_edge_data)) {
      return 0
    }

    if (!(curr in benign_edge_data[layer])) {
      return 0
    }

    if (!(next in benign_edge_data[layer][curr])) {
      return 0
    }

    return  benign_edge_data[layer][curr][next]['inf']
  }

  function get_edges_to_highlight() {
    for (var layer in potentially_highlighted_edges) {
      var all_edges = potentially_highlighted_edges[layer]
      var num_edges = Math.round(all_edges.length * highlight_pathways['connections']['top-k'] / 100)
      highlighted_edges[layer] = all_edges.slice(0, num_edges)
    }
  }

  function highlight_top_edges() {
    for (var layer in highlighted_edges) {
      highlighted_edges[layer].forEach(edge_info => {
        var edge_id = ['edge', edge_info['curr'], edge_info['next']].join('-')
        d3.select('#' + edge_id).classed('edge-shown', true).style('display', 'block')
      })
    }
  }

}

function get_highlighted_neurons() {
  var node_rects = document.getElementsByClassName('node')
  var highligted_rects = Array.from(node_rects).filter(function(rect) {
    var fill_opacity = parseFloat(rect.style.fillOpacity)
    return fill_opacity == 1
  })
  var highlighted_neurons_all_layers = highligted_rects.map(function(rect) {
    var rect_id = rect.id
    var neuron = rect_id.split('node-')[1]
    return neuron
  })

  var highlighted_neurons = {}
  highlighted_neurons_all_layers.forEach(neuron => {
    var layer = neuron.split('-')[0]
    if (!(layer in highlighted_neurons)) {
      highlighted_neurons[layer] = []
    }
    highlighted_neurons[layer].push(neuron)
  })

  return highlighted_neurons
}

function get_highlightable_edges(highlighted_neurons) {
  var no_highlighted_neurons = Object.keys(highlighted_neurons).length === 0
  var potentially_highlighted_edges = {}
  layers.slice(1).forEach(layer => {
    potentially_highlighted_edges[layer] = []
    if (!no_highlighted_neurons) {
      edge_data[selected_attack_info['attack_strength']][layer].forEach(edge_info => {
        var curr = edge_info['curr']
        var next = edge_info['next']
        var inf = edge_info['inf']
        var curr_layer = curr.split('-')[0]
        var next_layer = next.split('-')[0]
  
        if (highlighted_neurons[curr_layer].includes(curr) && highlighted_neurons[next_layer].includes(next)) {
          potentially_highlighted_edges[layer].push({
            'curr': curr,
            'next': next,
            'inf': inf,
          })
        }
      })
    }
  })
  return potentially_highlighted_edges
}

////////////////////////////////////////////////////////////////////////////////////////////////
// Functions for generating filters
////////////////////////////////////////////////////////////////////////////////////////////////

function gen_filters() {

  d3.select('#svg-ag')
    .append('defs')
    .attr('id', 'filter-defs')

  gen_hue_filter()
  gen_clip_path_filter()
  gen_edge_gradient_filter()

}

function gen_clip_path_filter() {
  d3.select('#svg-ag')
    .append('defs')
    .attr('id', 'clip-path-def')
    .append('clipPath')
    .attr('id', 'rounded-edge')
    .append('rect')
    .attr('id', 'rounded-edge-rect')
}

function gen_hue_filter() {

  // Define colored filter
  for (var graph_key in node_hue_color) {
    var color = node_color[graph_key]
    var rgb = hex2rgb(color)
    var r = rgb[0] / 255
    var g = rgb[1] / 255
    var b = rgb[2] / 255

    var mat = [r, 0, 0, 0, 0].join(' ') + '\n'
    mat += [g, 0, 0, 0, 0].join(' ') + '\n'
    mat += [b, 0, 0, 0, 0].join(' ') + '\n'
    mat += [-0.1, -0.1, -0.1, 0.7, 0].join(' ') + '\n'

    d3.select('#filter-defs')
      .append('filter')
      .attr('id', 'filter-' + graph_key)
      .attr('color-interpolation-filters', 'sRGB')
      .append('feColorMatrix')
      .attr('type', 'matrix')
      .attr('values', mat)
  }

  // Define identity filter
  var mat = '1 0 0 0 0\n'
  mat += '0 1 0 0 0\n'
  mat += '0 0 1 0 0\n'
  mat += '0 0 0 1 0\n'
  mat += '0 0 0 1 0\n'
  d3.select('#filter-defs')
    .append('filter')
    .attr('id', 'filter-identity')
    .attr('color-interpolation-filters', 'sRGB')
    .append('feColorMatrix')
    .attr('type', 'matrix')
    .attr('values', mat)
  
}

function hex2rgb(hex) {
  var rgb = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i
          ,(m, r, g, b) => '#' + r + r + g + g + b + b)
        .substring(1).match(/.{2}/g)
        .map(x => parseInt(x, 16))
  return rgb
}

function gen_edge_gradient_filter() {
  d3.select('#svg-ag')
    .append('defs')
    .attr('id', 'edge-color-gradient')

  for (var key1 in node_color) {
    for (var key2 in node_color) {

      d3.select('#edge-color-gradient')
        .append('linearGradient')
        .attr('id', ['color-gradient', key1, key2].join('-'))
        .attr('x1', '0%')
        .attr('x2', '0%')
        .attr('y1', '0%')
        .attr('y2', '100%')
      
      d3.select('#' + ['color-gradient', key1, key2].join('-'))
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', node_color[key1])

      d3.select('#' + ['color-gradient', key1, key2].join('-'))
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', node_color[key2])
    } 
  }
}
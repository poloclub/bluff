import { 
  layers,
  top_k,
  rough_top_k,
  highlight_top_k,
  attack_types,
  attack_strengths,
  feature_vis_dir
} from './constant.js';

import {
  graph_margin,
  node_color,
  node_opacity,
  node_box_style,
  filter_bar
} from './style.js';

import {
  selected_class
} from './header.js'

import { 
  selected_attack_info
} from './attack_control.js'

import {
  filter_pathways
} from './filter_pathways.js'

import {
  comp_attack
} from './mode_control.js'


////////////////////////////////////////////////////////////////////////////////////////////////
// Global variables
////////////////////////////////////////////////////////////////////////////////////////////////
var activation_data = {}
var vulnerability_data = {}
var top_neuron_data = {}
var extracted_neurons = {}
var most_decreased_data = {}

var unique_attack_only_neurons = {}

var act_type = 'median_activation'
// var act_type = 'median_activation_percentile'
var activation_range = {}
var activation_y_scale = {}

var sorted_vulnerability_data = {}
var vul_type = 'strengthwise_vulnerability'

var node_size = {}
var node_group_x = {}
var y_coords = {}

////////////////////////////////////////////////////////////////////////////////////////////////
// Main part for drawing the attribution graphs 
////////////////////////////////////////////////////////////////////////////////////////////////

export function reload_graph() {
  var file_list = data_file_path()
  remove_graph()
  draw_graph(file_list)
  
  function draw_graph(file_list) {
    Promise.all(file_list.map(file => d3.json(file))).then(function(data) { 

      // Read the neuron data
      activation_data = data[0]
      vulnerability_data = data[1]
      top_neuron_data = data[2]
      most_decreased_data = parse_most_changed_data()  
    
      // Get activation scale
      get_actiavtion_y_scale()
    
      // Parse vulnerability data
      parse_vulnerability_data()
      sorted_vulnerability_data = sort_vulnerability_data()
      extracted_neurons = extract_neurons()
    
      // Generate x, y coordinate info
      gen_x_coords()
      gen_y_coords()
    
      // Draw nodes
      write_layers()
      draw_neurons()

      window.activation_data = activation_data
      window.vulnerability_data = vulnerability_data
      window.top_neuron_data = top_neuron_data
      window.sorted_vulnerability_data = sorted_vulnerability_data
      window.extracted_neurons = extracted_neurons
      window.node_size = node_size
      window.node_group_x = node_group_x
      window.y_coords = y_coords
      window.activation_range = activation_range
      window.most_decreased_data = most_decreased_data
    
    })
  }

}

export function remove_graph() {
  d3.selectAll('.layer-text').remove()
  d3.selectAll('.g-node').remove()
  d3.selectAll('.node-box').remove()
}


////////////////////////////////////////////////////////////////////////////////////////////////
// Parse dataset
////////////////////////////////////////////////////////////////////////////////////////////////

function parse_most_changed_data() {
  var most_decreased_data = {}
  layers.forEach(layer => {
    most_decreased_data[layer] = {}

    attack_strengths[selected_attack_info['attack_type']].forEach(strength => {
      var attack_key = get_value_key('attacked', selected_attack_info['attack_type'], strength)
      var sorted = Object.entries(activation_data[layer]).sort(function(a, b) {
        var original_a = a[1]['original'][act_type]
        var original_b = b[1]['original'][act_type]
        var attacked_a = a[1][attack_key][act_type]
        var attacked_b = b[1][attack_key][act_type]
        return (original_b - attacked_b) - (original_a - attacked_a)
      })
      sorted = sorted.map(x => x[0])
      most_decreased_data[layer][attack_key] = sorted
    })
  })
  return most_decreased_data
}

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
  var data_dir = '../../data/'
  var original_class = selected_class['original']
  var target_class = selected_class['target']
  var attack_type = 'pgd'
  // var attack_type = selected_attack_info['attack_type']
  
  var class_info = [original_class, target_class].join('-')
  var activation_data_path = data_dir + ['neuron_data/neuron_data', class_info, attack_type + '.json'].join('-')
  var vulnerability_data_path = data_dir + ['neuron_vulnerabilities/neuron_vulnerabilities', class_info, attack_type + '.json'].join('-')
  var top_neuron_data_path = data_dir + ['top_neurons/top_neurons', class_info, attack_type + '.json'].join('-')
  var file_list = [activation_data_path, vulnerability_data_path, top_neuron_data_path]
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
  var filename = feature_vis_dir + '/'
  if (type == 'channel') {
    filename += 'channel/'
    filename += [neuron_id, type].join('-')
    filename += '.jpg'
  } else if (type.includes('ex')) {
    var ex = type.split('-')[1]
    filename += 'dataset-p/'
    filename += [neuron_id, 'dataset', 'p', ex].join('-')
    filename += '.jpg'
  }
  return filename
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
      node_group_x[attack_type]['original-and-target']['end_x'] = node_group_x[attack_type]['original-and-target']['start_x'] + length_node_group(top_k, w)

      // Set target group
      node_group_x[attack_type]['target'] = {}
      node_group_x[attack_type]['target']['start_x'] = node_group_x[attack_type]['original-and-target']['end_x'] + graph_margin['group_lr']
      node_group_x[attack_type]['target']['end_x'] = node_group_x[attack_type]['target']['start_x'] + length_node_group(top_k, w) 

      // Set attack only group
      node_group_x[attack_type]['attack-only'] = {}
      node_group_x[attack_type]['attack-only']['start_x'] = node_group_x[attack_type]['target']['end_x'] + graph_margin['group_lr']
      node_group_x[attack_type]['attack-only']['end_x'] = node_group_x[attack_type]['attack-only']['start_x'] + length_node_group(max_num_attacked_only[attack_type], w)

      
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
  d3.select('#g-ag')
    .selectAll('layers')
    .data(layers)
    .enter()
    .append('text')
    .attr('class', 'layer-text')
    .text(function(layer) { return layer })
    .attr('x', graph_margin['start_x'] - 80)
    .attr('y', function(layer) { return y_coords[layer] + node_size[selected_attack_info['attack_type']] / 2 + 5})
}

function draw_neurons() {
  // Draw neurons in original, original & target, target graph
  var graph_keys = ['original', 'original-and-target', 'target']
  graph_keys.forEach(graph_key => {
    layers.forEach(layer => {
      var neuron_data = extracted_neurons[layer][graph_key]
      var sorted_neurons = sorted_vulnerability_data[selected_attack_info['attack_type']][layer].map(x => x[0])
      var sorted_neruon_data = neuron_data.sort(function(a, b) {
        return sorted_neurons.indexOf(a) - sorted_neurons.indexOf(b)
      })
      
      append_nodes(graph_key, sorted_neruon_data)
    })
    append_comp_nodes(graph_key)
  })

  // Draw neurons of the current attack, of all strength first
  layers.forEach(layer => {
    var neuron_data = unique_attack_only_neurons[selected_attack_info['attack_type']][layer]
    append_nodes('attack-only', neuron_data) 
  })
  append_comp_nodes('attack-only')

  // Update nodes' visibilities
  update_node_opacity()

  // Write neuron id
  draw_neuron_id()

  // Functions
  function append_nodes(graph_key, neuron_data) {
    d3.select('#g-ag')
      .selectAll('nodes')
      .data(neuron_data)
      .enter()
      .append('g')
      .attr('id', function(neuron) { return 'g-' + get_node_id(neuron) })
      .attr('class', function(neuron) { return 'g-node g-node-' + graph_key })
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
  }

  function draw_neuron_id() {
    var ns = node_size[selected_attack_info['attack_type']]

    d3.selectAll('.g-node')
      .append('text')
      .attr('class', 'neuron-id')
      .text(function(neuron_id) { return neuron_id.split('-')[1] })
      .style('font-size', function() { return ns * 0.6 })
      .attr('y', -3)
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

  function mouseover_node(neuron) {
    // Mouse pointer
    var node_id = get_node_id(neuron)
    d3.select('#' + node_id).style('cursor', 'pointer')

    // Add node box if it does not exist
    var node_box_id = get_node_box_id(neuron)
    if (!does_exist(node_box_id)) {
      add_node_box()
    }
    // Show node box if it exists
    else {
      d3.select('#' + node_box_id).style('display', 'block')
    } 

    function add_node_box() {
      mk_node_box_g()
      mk_node_box_bg()
      draw_fv()
      draw_examples() 
      draw_activation_plot()
    }

    function mk_node_box_g() {
      var node_transform = d3.select('#g-' + node_id).attr('transform')
      var [node_x, node_y]  = node_transform.split(',')
      node_x = parseInt(node_x.match(/\d/g).join(''))
      node_y = parseInt(node_y.match(/\d/g).join(''))
      
      d3.select('#g-ag')
        .append('g')
        .attr('id', node_box_id)
        .attr('class', 'node-box')
        .attr('transform', function() {
          var x = node_x + node_box_style['left']
          var y = node_y + (node_size[selected_attack_info['attack_type']] - node_box_style['height']) / 2
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
    
    function draw_fv() {
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
      
      
      // Draw lines
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

        // console.log([0].concat(attack_strengths[selected_attack_info['attack_type']]))
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
    var node_box_id = get_node_box_id(neuron)
    d3.select('#' + node_box_id).style('display', 'none')
  }

  function get_node_box_id(neuron) {
    return ['node-box', neuron].join('-')
  }

}

export function update_node_opacity() {

  deactivate_all_nodes()

  if (filter_pathways['selected'] == 'activated') {
    update_opacity_most_activated()
  } else if (filter_pathways['selected'] == 'changed') {
    if (selected_attack_info['attack_strength'] > 0) {
      if (filter_pathways['sub-selected'] == 'increased') {
        update_opacity_most_increased()
      } else if (filter_pathways['sub-selected'] == 'decreased') {
        update_opacity_most_decreased()
      }
    }
  }

  function deactivate_all_nodes() {
    d3.selectAll('.node')
      .style('fill-opacity', node_opacity['deactivated'])
  }

  function update_opacity_most_activated() {
    if (selected_attack_info['attack_strength'] == 0) {
      d3.selectAll('.node-original')
        .style('fill-opacity', node_opacity['activated'])  
      d3.selectAll('.node-original-and-target')
        .style('fill-opacity', node_opacity['activated'])  
    }
    else {
      d3.selectAll('.node')
        .style('fill-opacity', function(neuron) {
          var layer = neuron.split('-')[0]
          var attack_key = get_value_key('attacked', selected_attack_info['attack_type'], selected_attack_info['attack_strength'])
          var top_neurons_to_highlight = top_neuron_data[layer][attack_key].slice(0, highlight_top_k)
          if (top_neurons_to_highlight.includes(neuron)) {
            return node_opacity['activated']
          } else {
            return node_opacity['deactivated']
          }
        })
    }
  }

  function update_opacity_most_increased() {
    d3.selectAll('.node')
      .style('fill-opacity', function(neuron) {
        var layer = neuron.split('-')[0]
        var attack_key = get_value_key('attacked', selected_attack_info['attack_type'], selected_attack_info['attack_strength'])
        var top_neurons_to_highlight = most_decreased_data[layer][attack_key].slice(-highlight_top_k)
        if (top_neurons_to_highlight.includes(neuron)) {
          return node_opacity['activated']
        } else {
          return node_opacity['deactivated']
        }
      })
  }

  function update_opacity_most_decreased() {
    d3.selectAll('.node')
      .style('fill-opacity', function(neuron) {
        var layer = neuron.split('-')[0]
        var attack_key = get_value_key('attacked', selected_attack_info['attack_type'], selected_attack_info['attack_strength'])
        var top_neurons_to_highlight = most_decreased_data[layer][attack_key].slice(0, highlight_top_k)
        if (top_neurons_to_highlight.includes(neuron)) {
          return node_opacity['activated']
        } else {
          return node_opacity['deactivated']
        }
      })
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
  var weak = comp_attack['weak']
  var strong = comp_attack['strong']

  d3.selectAll('.node')
    .style('fill-opacity', function(neuron) {
      var layer = neuron.split('-')[0]
      var attack_key = get_value_key('attacked', selected_attack_info['attack_type'], strong)
      var top_neurons_to_highlight = top_neuron_data[layer][attack_key].slice(0, highlight_top_k)
      if (top_neurons_to_highlight.includes(neuron)) {
        return node_opacity['activated']
      } else {
        return node_opacity['deactivated']
      }
    })


  var graph_keys = ['original', 'original-and-target', 'target', 'attack-only']
  graph_keys.forEach(graph_key => {
    d3.selectAll('.inner-node-' + graph_key)
    .style('display', 'block')
    .style('fill', function(neuron) {
      var layer = neuron.split('-')[0]
      var attack_key = get_value_key('attacked', selected_attack_info['attack_type'], weak)
      var top_neurons_to_highlight = top_neuron_data[layer][attack_key].slice(0, highlight_top_k)
      if (top_neurons_to_highlight.includes(neuron)) {
        return node_color[graph_key]
      } else {
        return 'white'
      }
    })
    .style('fill-opacity', function(neuron) {
      var layer = neuron.split('-')[0]
      var attack_key = get_value_key('attacked', selected_attack_info['attack_type'], weak)
      var top_neurons_to_highlight = top_neuron_data[layer][attack_key].slice(0, highlight_top_k)
      if (top_neurons_to_highlight.includes(neuron)) {
        return node_opacity['activated']
      } else {
        return 1 - node_opacity['deactivated']
      }
    })
    .style('display', function(neuron) {
      var layer = neuron.split('-')[0]
      var attack_key = get_value_key('attacked', selected_attack_info['attack_type'], weak)
      var top_neurons_to_highlight = top_neuron_data[layer][attack_key].slice(0, highlight_top_k)


      var strong_attack_key = get_value_key('attacked', selected_attack_info['attack_type'], strong)
      var top_neurons_strong = top_neuron_data[layer][strong_attack_key].slice(0, highlight_top_k)
      


      if (top_neurons_to_highlight.includes(neuron)) {
        return 'block'
      } else {
        if (top_neurons_strong.includes(neuron)) {
          return 'block'
        } else {
          return 'none'
        }
      }
    })
  })


  // d3.selectAll('.inner-node')
  //   .style('display', function(neuron) {
  //     var layer = neuron.split('-')[0]
  //     var attack_key = get_value_key('attacked', selected_attack_info['attack_type'], weak)
  //     var top_neurons_to_highlight = top_neuron_data[layer][attack_key].slice(0, highlight_top_k)
  //     if (top_neurons_to_highlight.includes(neuron)) {
  //       return 'block'
  //     } else {
  //       return 'none'
  //     }
  //   })
  //   // .style('display', 'block')
  //   .style('fill', function(neuron) {
  //     var original_color = d3.select(this)
  //     console.log(original_color)
  //     var layer = neuron.split('-')[0]
  //     var attack_key = get_value_key('attacked', selected_attack_info['attack_type'], weak)
  //     var top_neurons_to_highlight = top_neuron_data[layer][attack_key].slice(0, highlight_top_k)
  //     if (top_neurons_to_highlight.includes(neuron)) {
  //       // return node_opacity['activated']
  //     } else {
  //       return 'white'
  //     }
  //   })
  //   .style('fill-opacity', function(neuron) {
  //     var layer = neuron.split('-')[0]
  //     var attack_key = get_value_key('attacked', selected_attack_info['attack_type'], weak)
  //     var top_neurons_to_highlight = top_neuron_data[layer][attack_key].slice(0, highlight_top_k)
  //     if (top_neurons_to_highlight.includes(neuron)) {
  //       return node_opacity['activated']
  //     } else {
  //       return node_opacity['deactivated']
  //     }
  //   })

}
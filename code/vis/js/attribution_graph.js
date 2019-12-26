
////////////////////////////////////////////////////////////////////////////////////////////////
// Set data directory
////////////////////////////////////////////////////////////////////////////////////////////////
var feature_vis_dir = '../../../summit/summit-data/data/feature-vis'
var data_dir = '../../../massif/aggregated/panda-armadillo/'
var file_list = get_file_list(data_dir)


////////////////////////////////////////////////////////////////////////////////////////////////
// Global variable
////////////////////////////////////////////////////////////////////////////////////////////////
var svg_center_x = parseInt(d3.select('#g-ag').style('width').split('px')[0]) / 2
var svg_center_y = parseInt(d3.select('#g-ag').style('height').split('px')[0]) / 2
var neuron_img_width = parseInt(get_css_val('--neuron_img_width'))
var neuron_img_height = parseInt(get_css_val('--neuron_img_height'))
var neuron_img_padding = {
  'lr': parseInt(get_css_val('--neuron_img_lr')), 
  'tb': parseInt(get_css_val('--neuron_img_tb')),
  'ex-box': parseInt(get_css_val('--neuron_ex_box_padding'))
}
var neuron_group_lr_padding = parseInt(get_css_val('--neuron_group_lr'))
var ex_img_width = parseInt(get_css_val('--ex_img_width'))
var ex_img_height = parseInt(get_css_val('--ex_img_height'))
var ex_img_padding = {
  'lr': parseInt(get_css_val('--ex_img_lr')),
  'tb': parseInt(get_css_val('--ex_img_tb')),
  'ex-start-x': parseInt(get_css_val('--ex_start_x')),
  'ex-start-y': parseInt(get_css_val('--ex_start_y'))
}
var ag_start_y = parseInt(get_css_val('--ag_start_y'))

////////////////////////////////////////////////////////////////////////////////////////////////
// Main part for drawing the attribution graphs 
////////////////////////////////////////////////////////////////////////////////////////////////
Promise.all(file_list.map(file => d3.json(file))).then(function(data) {

  // Hyperparameters
  var topk = 4

  // Get the data
  var top_neurons = parse_top_neurons_all_attack(topk, data)
  var layers = Object.keys(top_neurons['benign'])
  var reversed_layers = layers.slice().reverse()
  
  // Define filters
  gen_hue_filter()

  // Fractionation of top neurons
  var fractionated_neuron_infos = init_fractionated_neuron_infos_all_attack(layers)
  fractionated_neuron_infos = fractionate_benign_neurons(top_neurons, fractionated_neuron_infos)
  fractionated_neuron_infos = fractionate_attacked_neurons(top_neurons, fractionated_neuron_infos)

  // Compute the x position of the neuron groups
  var neuron_groups_x_base = init_neuron_group_x_position()
  neuron_groups_x_base = add_neuron_group_x_position_both(neuron_groups_x_base, fractionated_neuron_infos)
  neuron_groups_x_base = add_neuron_group_x_position_benign(neuron_groups_x_base, fractionated_neuron_infos)
  neuron_groups_x_base = add_neuron_group_x_position_attacked(neuron_groups_x_base, fractionated_neuron_infos)

  // Draw neurons (nodes)
  draw_center_neuron_groups(reversed_layers, neuron_groups_x_base, fractionated_neuron_infos)
  var left_most_x = draw_benign_neuron_groups(reversed_layers, neuron_groups_x_base, fractionated_neuron_infos)
  draw_attacked_neuron_groups(reversed_layers, neuron_groups_x_base, fractionated_neuron_infos)

  // Compute graphs
  var top_graphs = {}
  top_graphs = parse_top_graphs_benign(data, top_graphs, fractionated_neuron_infos)
  top_graphs = parse_top_graphs_attacked(fractionated_neuron_infos, data, top_graphs)

  // Draw influences (edges)
  var edge_scale = define_edge_scale(top_graphs)
  draw_benign_edges(reversed_layers, top_graphs, edge_scale)
  draw_attacked_edges(reversed_layers, top_graphs, edge_scale, fractionated_neuron_infos)

  // Annotation
  annotate_layers(reversed_layers, neuron_groups_x_base, left_most_x)
  
})

function get_file_list(data_dir){
  // Top neurons
  var top_neurons_dir = data_dir + '/top-neurons'
  var file_lst = [top_neurons_dir + '/top-neurons-benign.json']
  epss.forEach(eps => {
    var file = top_neurons_dir + '/top-neurons-attacked-' + eps + '.json'
    file_lst.push(file)
  })

  // Graph
  var graph_dir = data_dir + '/top-graph'
  file_lst.push(graph_dir + '/G-top-benign.json')
  epss.forEach(eps => {
    var file = graph_dir + '/G-top-attacked-' + eps + '.json'
    file_lst.push(file)
  })

  return file_lst
}

function parse_top_neurons(top_neurons, topk) {
  var layers = Object.keys(top_neurons)
  layers.forEach(layer => {
    top_neurons[layer] = top_neurons[layer].slice(0, topk).map(function(neuron_info) {
      return {
        'neuron': parseInt(neuron_info['neuron']), 
        'weight': parseFloat(neuron_info['weight'])
      }
    })
  })
  return top_neurons
}

function parse_top_neurons_all_attack(topk, data) {
  var top_neurons = {}
  top_neurons['benign'] = parse_top_neurons(data[0], topk * 2)
  epss.forEach((eps, eps_i) => {
    var eps_1lf = (eps).toFixed(1)
    top_neurons['attacked-' + eps_1lf] = parse_top_neurons(data[eps_i + 1], topk)
  })
  return top_neurons
}

function parse_top_graph(neuron_infos, top_graph) {
  // Get top neurons in graph
  var layers = Object.keys(neuron_infos)
  var top_neurons_in_graph = []
  layers.forEach(layer => {
    neuron_infos[layer].forEach(neuron_info => {
      var neuron = neuron_info['neuron']
      top_neurons_in_graph.push(layer + '-' + neuron)
    })
  })

  // Initialize top graph
  var top_top_graph = {}
  layers.forEach(layer => {
    top_top_graph[layer] = {}
  })

  // Parse top graph
  top_graph['links'].forEach(edge => {
    // Check if the edge's weight is 0
    var weight = parseFloat(edge['weight'])
    if (weight == 0) {
      return
    }

    // Check if the source is in the top neurons list
    if (!(top_neurons_in_graph.includes(edge['source']))) {
      return
    }

    // Check if the target is in the top neurons list
    if (!(top_neurons_in_graph.includes(edge['target']))) {
      return
    }

    // Get layer and neuron number of source and target
    var [layer, neuron] = edge['source'].split('-')
    var [prev_layer, prev_neuron] = edge['target'].split('-')
    neuron = parseInt(neuron)
    prev_neuron = parseInt(prev_neuron)
    if (!(neuron in top_top_graph[layer])) {
      top_top_graph[layer][neuron] = []
    }
    top_top_graph[layer][neuron].push({'prev_neuron': prev_neuron, 'weight': weight})
    
  })

  return top_top_graph
}

function parse_top_graphs_benign(data, top_graphs, fractionated_neuron_infos) {
  // Get keys of benign neurons
  var keys = ['benign-attacked-both']
  epss.forEach(eps => {
    var benign_key = 'benign-' + (eps).toFixed(1)
    keys.push(benign_key)
  })

  // Aggregate benign neurons
  var aggregated_benign_neurons = {}
  keys.forEach(benign_key => {
    for (var layer in fractionated_neuron_infos[benign_key]) {
      if (!(layer in aggregated_benign_neurons)) {
        aggregated_benign_neurons[layer] = []
      }
      for (var neuron_info of fractionated_neuron_infos[benign_key][layer]) {
        aggregated_benign_neurons[layer].push(neuron_info)
      }
    }
  })

  // Parse the top graphs
  var top_graph_idx = 8
  top_graphs['benign'] = parse_top_graph(aggregated_benign_neurons, data[top_graph_idx])

  return top_graphs
}

function parse_top_graphs_attacked(fractionated_neuron_infos, data, top_graphs) {
  // Get keys of attacked neurons
  var keys = ['benign-attacked-both']
  epss.forEach(eps => {
    var attacked_key = 'attacked-' + (eps).toFixed(1)
    keys.push(attacked_key)
  })

  // Aggregate attacked neurons
  var aggregated_attacked_neurons = {}
  keys.forEach(attacked_key => {
    for (var layer in fractionated_neuron_infos[attacked_key]) {
      if (!(layer in aggregated_attacked_neurons)) {
        aggregated_attacked_neurons[layer] = []
      }
      for (var neuron_info of fractionated_neuron_infos[attacked_key][layer]) {
        aggregated_attacked_neurons[layer].push(neuron_info)
      }
    }
  })

  // Parse the top graphs
  var top_graph_idx = 8
  epss.forEach((eps, eps_idx) => {
    var attacked_key = 'attacked-' + (eps).toFixed(1)
    top_graphs[attacked_key] = parse_top_graph(aggregated_attacked_neurons, data[top_graph_idx + eps_idx])
  })
  return top_graphs
}

function parse_graph_all_attack(data) {
  var links = {}
  links['benign'] = data[epss.length]['links']
  console.log(links)

}
  
function init_fractionated_neuron_infos_all_attack(layers) {
  var fractionated_neuron_infos = {}
  epss.forEach(eps => {
    var eps_1lf = (eps).toFixed(1)
    fractionated_neuron_infos['benign-' + eps_1lf] = init_fractionated_neuron_infos(layers)
  })
  fractionated_neuron_infos['benign-attacked-both'] = init_fractionated_neuron_infos(layers)
  epss.forEach(eps => {
    var eps_1lf = (eps).toFixed(1)
    fractionated_neuron_infos['attacked-' + eps_1lf] = init_fractionated_neuron_infos(layers)
  })

  return fractionated_neuron_infos
}

function get_benign_attacked_neurons(fractionated_neuron_infos) {
  var benign_attacked_neurons = init_fractionated_neuron_infos(layers)
  var curr_eps_idx = epss.indexOf(curr_eps)
  layers.forEach(layer => {
    benign_attacked_neurons[layer] = benign_attacked_neurons[layer].concat(fractionated_neuron_infos['benign-attacked-both'][layer])
    epss.slice(curr_eps_idx + 1).forEach(other_eps => {
      var other_benign_neurons = fractionated_neuron_infos['benign-' + (other_eps).toFixed(1)]
      benign_attacked_neurons[layer] = benign_attacked_neurons[layer].concat(other_benign_neurons[layer])
    })
  })
  return benign_attacked_neurons
}

function extract_neurons_from_neuron_infos(neuron_infos) {
  return neuron_infos.map(neuron_info => neuron_info['neuron'])
}

function init_fractionated_neuron_infos(layers) {
  var fractionated_neuron_infos = {}
  layers.forEach(layer => {
    fractionated_neuron_infos[layer] = []
  })
  return fractionated_neuron_infos
}

function fractionate_benign_neurons(top_neurons, fractionated_neuron_infos) {

  var top_benign_neurons = top_neurons['benign']

  layers.forEach(layer => {
    for (let benign_neuron_info of top_benign_neurons[layer]) {

      // A neuron highly activated in benign images
      var benign_neuron = benign_neuron_info['neuron']

      // See if the neuron should be in benign-attacked-both
      var is_in_both_benign_all_attacked = false
      for (var eps of epss) {
        var attacked_key = 'attacked-' + (eps).toFixed(1)
        var attacked_neurons = extract_neurons_from_neuron_infos(top_neurons[attacked_key][layer])
        if (attacked_neurons.includes(benign_neuron)) {
          is_in_both_benign_all_attacked = true
          var benign_key = 'benign-attacked-both'
          fractionated_neuron_infos[benign_key][layer].push(benign_neuron_info)
          break
        }
      }
      if (is_in_both_benign_all_attacked) {
        continue
      }

      // Fractionate the neurons based on the eps
      epss.forEach((eps, eps_i) => {

        // See if the benign neuron is idle at this strength
        var become_idle_at_this_strength = true
        var this_strength_key = 'attacked-' + (eps).toFixed(1)
        var top_neurons_current_strength = extract_neurons_from_neuron_infos(top_neurons[this_strength_key][layer])
        if (top_neurons_current_strength.includes(benign_neuron)) {
          become_idle_at_this_strength = false
        }

        // See if the benign neuron has never become idle under weaker attacks
        if (become_idle_at_this_strength) {
          epss.slice(0, eps_i).forEach(weak_eps => {
            var got_idle_key = 'benign-' + (weak_eps).toFixed(1)
            var neurons_idle_already = extract_neurons_from_neuron_infos(fractionated_neuron_infos[got_idle_key][layer])
            if (neurons_idle_already.includes(benign_neuron)) {
              become_idle_at_this_strength = false
            }
          })
        }

        // Assign the benign neuron
        if (become_idle_at_this_strength) {
          var benign_only_key = 'benign-' + (eps).toFixed(1)
          fractionated_neuron_infos[benign_only_key][layer].push(benign_neuron_info)
          is_in_both_benign_all_attacked = false
        }
      })
    }
  })

  return fractionated_neuron_infos
}

function fractionate_attacked_neurons(top_neurons, fractionated_neuron_infos) {
  epss.forEach((eps, eps_i) => {
    var eps_1lf = (eps).toFixed(1)
    var attacked_key = 'attacked-' + eps_1lf
    var top_neurons_current_strength = top_neurons[attacked_key]
    
    layers.forEach(layer => {

      // Get top neurons at the current eps in current layer
      var top_neurons_at_curr_eps_layer = top_neurons_current_strength[layer]

      top_neurons_at_curr_eps_layer.forEach(neuron_info_curr_eps => {
        var curr_neuron = neuron_info_curr_eps['neuron']
        
        // See if the neuron is activated in benign
        var is_stucked_this_curr = true
        var benign_neurons = extract_neurons_from_neuron_infos(top_neurons['benign'][layer])
        if (benign_neurons.includes(curr_neuron)) {
          is_stucked_this_curr = false
        }

        // See if the neuron is activated in stronger attacks
        epss.slice(eps_i + 1).forEach(stronger_eps => {
          if (is_stucked_this_curr) { 
            var stronger_eps_1lf = (stronger_eps).toFixed(1)
            var top_neurons_in_stronger_strength = top_neurons['attacked-' + stronger_eps_1lf][layer]
            var stronger_neurons = extract_neurons_from_neuron_infos(top_neurons_in_stronger_strength)
            if (stronger_neurons.includes(curr_neuron)) {
              is_stucked_this_curr = false
            }
          }
        })

        // Assign the neuron info
        if (is_stucked_this_curr) {
          fractionated_neuron_infos[attacked_key][layer].push(neuron_info_curr_eps)
        }

      })
    })
  })

  return fractionated_neuron_infos
}

function init_neuron_group_x_position() {
  var neuron_groups_x_base = {}
  neuron_groups_x_base['both'] = {}
  epss.forEach(eps => {
    neuron_groups_x_base['benign-' + (eps).toFixed(1)] = {}
    neuron_groups_x_base['attacked-' + (eps).toFixed(1)] = {}
  })
  return neuron_groups_x_base
}

function add_neuron_group_x_position_both (neuron_groups_x_base, fractionated_neuron_infos) {
  var neuron_x_unit_len = neuron_img_width + neuron_img_padding['lr']
  layers.forEach(layer => {
    var num_neurons = fractionated_neuron_infos['benign-attacked-both'][layer].length
    neuron_groups_x_base['both'][layer] = svg_center_x - (num_neurons / 2) * neuron_x_unit_len + neuron_img_padding['lr']
  })
  return neuron_groups_x_base
}

function add_neuron_group_x_position_benign(neuron_groups_x_base, fractionated_neuron_infos) {
  var neuron_x_unit_len = neuron_img_width + neuron_img_padding['lr']
  epss.forEach((eps, eps_th) => {
    var eps_str = (eps).toFixed(1)

    layers.forEach(layer => {
      if (eps_th == 0) {
        var prev_x_base = neuron_groups_x_base['both'][layer]
        neuron_groups_x_base['benign-' + eps_str][layer] = prev_x_base - neuron_group_lr_padding
      } else {
        var prev_eps_str = (epss[eps_th - 1]).toFixed(1)
        var prev_x_base = neuron_groups_x_base['benign-' + prev_eps_str][layer]
        var num_prev_neurons = fractionated_neuron_infos['benign-' + prev_eps_str][layer].length
        neuron_groups_x_base['benign-' + eps_str][layer] = prev_x_base - (num_prev_neurons * neuron_x_unit_len) - neuron_group_lr_padding
      }
    })
  })
  return neuron_groups_x_base
}

function add_neuron_group_x_position_attacked(neuron_groups_x_base, fractionated_neuron_infos) {
  var curr_eps_idx = epss.indexOf(curr_eps)
  var neuron_x_unit_len = neuron_img_width + neuron_img_padding['lr']
  epss.slice(0, curr_eps_idx + 1).forEach((eps, eps_th) => {
    layers.forEach(layer => {
      var prev_x_base = NaN
      var prev_num_neurons = NaN
      if (eps_th == 0) {
        prev_x_base = neuron_groups_x_base['both'][layer]
        prev_num_neurons = fractionated_neuron_infos['benign-attacked-both'][layer].length
      } else {
        var prev_attacked_key = 'attacked-' + (epss[eps_th - 1]).toFixed(1)
        prev_x_base = neuron_groups_x_base[prev_attacked_key][layer]
        prev_num_neurons = fractionated_neuron_infos[prev_attacked_key][layer].length
      }
      neuron_groups_x_base['attacked-' + (eps).toFixed(1)][layer] = prev_x_base + (prev_num_neurons * neuron_x_unit_len) + neuron_group_lr_padding
    })
  })
  return neuron_groups_x_base
}

function draw_center_neuron_groups(reversed_layers, neuron_groups_x_base, fractionated_neuron_infos) {
  
  reversed_layers.forEach((layer, layer_th) => {
    var x_base = neuron_groups_x_base['both'][layer]
    fractionated_neuron_infos['benign-attacked-both'][layer].forEach((neuron_info, neuron_th) => {
      var neuron = neuron_info['neuron']
      var x = x_base + neuron_th * (neuron_img_width + neuron_img_padding['lr'])
      var y = ag_start_y + layer_th * (neuron_img_height + neuron_img_padding['tb'])

      // Draw neruon
      d3.select('#g-ag')
        .append('image')
        .attr('id', ['fv', layer, neuron].join('-'))
        .attr('xlink:href', vis_filename(feature_vis_dir, layer, neuron, 'channel'))
        .attr('width', neuron_img_width)
        .attr('height', neuron_img_height)
        .attr('x', x)
        .attr('y', y)
        .attr('filter', 'url(#filter-' + 2.0 + ')')
        .on('mouseover', function() {mouseover_neuron(layer, neuron)})
        .on('mouseout', function() {mouseout_neuron(layer, neuron)})

      // Add neuron number
      d3.select('#g-ag')
        .append('text')
        .attr('id', ['neuron', layer, neuron].join('-'))
        .attr('class', 'neuron-number')
        .text(neuron)
        .attr('x', x + 2)
        .attr('y', y + 13)
    })
  })
}

function draw_benign_neuron_groups(reversed_layers, neuron_groups_x_base, fractionated_neuron_infos) {
  // Get the left most neuron's x position
  var left_most_x = {}
  reversed_layers.forEach(layer => {left_most_x[layer] = 10000})

  // Draw benign neurons become idle under weaker attacks
  var curr_eps_idx = epss.indexOf(curr_eps)
  epss.slice(0, curr_eps_idx).forEach(eps => {
    var eps_str = (eps).toFixed(1)
    reversed_layers.forEach((layer, layer_th) => {
      var x_base = neuron_groups_x_base['benign-' + eps_str][layer]
      fractionated_neuron_infos['benign-' + eps_str][layer].forEach((neuron_info, neuron_th) => {
        var neuron = neuron_info['neuron']
        var x = x_base - neuron_img_width - neuron_th * (neuron_img_width + neuron_img_padding['lr'])
        var y = ag_start_y + layer_th * (neuron_img_height + neuron_img_padding['tb'])
        left_most_x[layer] = d3.min([x, left_most_x[layer]])

        // Draw neuron
        d3.select('#g-ag')
          .append('image')
          .attr('id', 'fv-' + [layer, neuron].join('-'))
          .attr('xlink:href', vis_filename(feature_vis_dir, layer, neuron, 'channel'))
          .attr('width', neuron_img_width)
          .attr('height', neuron_img_height)
          .attr('x', x)
          .attr('y', y)
          .attr('filter', 'url(#filter-' + 0 + ')')
          .on('mouseover', function() {mouseover_neuron(layer, neuron)})
          .on('mouseout', function() {mouseout_neuron(layer, neuron)})

        // Add annotation - neuron number
        d3.select('#g-ag')
          .append('text')
          .attr('id', ['neuron', layer, neuron].join('-'))
          .attr('class', 'neuron-number')
          .text(neuron)
          .attr('x', x + 2)
          .attr('y', y + 13)
      })
    })
  })

  // Aggregate other benign neurons
  var aggregated_benign_neurons = {}
  reversed_layers.forEach(layer => {
    aggregated_benign_neurons[layer] = []
    epss.slice(curr_eps_idx).forEach(weak_eps => {
      var weak_eps_str = (weak_eps).toFixed(1)
      aggregated_benign_neurons[layer] = aggregated_benign_neurons[layer].concat(
        fractionated_neuron_infos['benign-' + weak_eps_str][layer])
    })
  })

  // Draw the aggregated benign neurons
  var eps_str = (curr_eps).toFixed(1)
  reversed_layers.forEach((layer, layer_th) => {
    var x_base = neuron_groups_x_base['benign-' + eps_str][layer]
    aggregated_benign_neurons[layer].forEach((neuron_info, neuron_th) => {
      var neuron = neuron_info['neuron']
      var x = x_base - neuron_img_width - neuron_th * (neuron_img_width + neuron_img_padding['lr'])
      var y = ag_start_y + layer_th * (neuron_img_height + neuron_img_padding['tb'])
      left_most_x[layer] = d3.min([x, left_most_x[layer]])

      // Draw neuron
      d3.select('#g-ag')
        .append('image')
        .attr('id', 'fv-' + [layer, neuron].join('-'))
        .attr('xlink:href', vis_filename(feature_vis_dir, layer, neuron, 'channel'))
        .attr('width', neuron_img_width)
        .attr('height', neuron_img_height)
        .attr('x', x)
        .attr('y', y)
        .attr('filter', 'url(#filter-' + 0 + ')')
        .on('mouseover', function() {mouseover_neuron(layer, neuron)})
        .on('mouseout', function() {mouseout_neuron(layer, neuron)})

      // Add annotation - neuron number
      d3.select('#g-ag')
        .append('text')
        .attr('id', ['neuron', layer, neuron].join('-'))
        .attr('class', 'neuron-number')
        .text(neuron)
        .attr('x', x + 2)
        .attr('y', y + 13)
    })
  })
  return left_most_x
}

function draw_attacked_neuron_groups(reversed_layers, neuron_groups_x_base, fractionated_neuron_infos) {
  var curr_eps_idx = epss.indexOf(curr_eps)

  // Draw neurons stucked at lower level of attack
  epss.slice(0, curr_eps_idx).forEach(eps => {
    var eps_str = (eps).toFixed(1)
    reversed_layers.forEach((layer, layer_th) => {
      var x_base = neuron_groups_x_base['attacked-' + eps_str][layer]
      fractionated_neuron_infos['attacked-' + eps_str][layer].forEach((neuron_info, neuron_th) => {
        var neuron = neuron_info['neuron']
        var x = x_base + neuron_th * (neuron_img_width + neuron_img_padding['lr'])
        var y = ag_start_y + layer_th * (neuron_img_height + neuron_img_padding['tb'])

        // Draw neuron
        d3.select('#g-ag')
          .append('image')
          .attr('id', 'fv-' + [layer, neuron].join('-'))
          .attr('xlink:href', vis_filename(feature_vis_dir, layer, neuron, 'channel'))
          .attr('width', neuron_img_width)
          .attr('height', neuron_img_height)
          .attr('x', x)
          .attr('y', y)
          .attr('filter', 'url(#filter-' + 3.5 + ')')
          .on('mouseover', function() {mouseover_neuron(layer, neuron)})
          .on('mouseout', function() {mouseout_neuron(layer, neuron)})

        // Add annotation - neuron number
        d3.select('#g-ag')
          .append('text')
          .attr('id', ['neuron', layer, neuron].join('-'))
          .attr('class', 'neuron-number')
          .text(neuron)
          .attr('x', x + 2)
          .attr('y', y + 13)
      })
    })
  })

  // Aggregate fractionated neurons of current and higher level of attacks
  var aggregated_fractionated_neurons_attack = {}
  reversed_layers.forEach(layer => {
    aggregated_fractionated_neurons_attack[layer] = []
  })
  epss.slice(curr_eps_idx).forEach(eps => {
    var eps_str = (eps).toFixed(1)
    reversed_layers.forEach(layer => {
      fractionated_neuron_infos['attacked-' + eps_str][layer].forEach(neuron_info => {
        aggregated_fractionated_neurons_attack[layer].push(neuron_info)
      })
    })
  })

  // Draw neurons of current and higher level of attack
  var attacked_key = 'attacked-' + (curr_eps).toFixed(1)
  reversed_layers.forEach((layer, layer_th) => {
    var x_base = neuron_groups_x_base[attacked_key][layer]
    aggregated_fractionated_neurons_attack[layer].forEach((neuron_info, neuron_th) => {
      var neuron = neuron_info['neuron']
      var x = x_base + neuron_th * (neuron_img_width + neuron_img_padding['lr'])
      var y = ag_start_y + layer_th * (neuron_img_height + neuron_img_padding['tb'])
      
      // Draw neuron
      d3.select('#g-ag')
        .append('image')
        .attr('id', 'fv-' + [layer, neuron].join('-'))
        .attr('xlink:href', vis_filename(feature_vis_dir, layer, neuron, 'channel'))
        .attr('width', neuron_img_width)
        .attr('height', neuron_img_height)
        .attr('x', x)
        .attr('y', y)
        .attr('filter', 'url(#filter-' + 3.5 + ')')
        .on('mouseover', function() {mouseover_neuron(layer, neuron)})
        .on('mouseout', function() {mouseout_neuron(layer, neuron)})

      // Add annotation - neuron number
      d3.select('#g-ag')
        .append('text')
        .attr('id', ['neuron', layer, neuron].join('-'))
        .attr('class', 'neuron-number')
        .text(neuron)
        .attr('x', x + 2)
        .attr('y', y + 13)
    })
  })
}

function draw_benign_edges(reversed_layers, top_graphs, edge_scale) {
  reversed_layers.slice(0, -1).forEach((layer, layer_idx) => {
    var prev_layer = reversed_layers[layer_idx + 1]

    for (var neuron in top_graphs['benign'][layer]) {
      var curr_fv_id = ['fv', layer, neuron].join('-')
      var curr_neuron_x = parseInt(d3.select('#' + curr_fv_id).attr('x')) + (neuron_img_width / 2)
      var curr_neuron_y = parseInt(d3.select('#' + curr_fv_id).attr('y')) + neuron_img_height

      top_graphs['benign'][layer][neuron].forEach(edge_info => {
        var prev_neuron = edge_info['prev_neuron']
        var weight = edge_info['weight']
        var prev_fv_id = ['fv', prev_layer, prev_neuron].join('-')

        var prev_neuron_x = parseInt(d3.select('#' + prev_fv_id).attr('x')) + (neuron_img_width / 2)
        var prev_neuron_y = parseInt(d3.select('#' + prev_fv_id).attr('y'))

        d3.select('#g-ag')
          .append('path')
          .attr('d', gen_curve(curr_neuron_x, curr_neuron_y, prev_neuron_x, prev_neuron_y))
          .attr('stroke', 'gray')
          .attr('stroke-width', edge_scale(weight))
          .attr('stroke', 'blue')
          .attr('fill', 'none')
      })
    }
  })
}

function draw_attacked_edges(reversed_layers, top_graphs, edge_scale, fractionated_neuron_infos) {
  
  // epss.forEach(eps => {
  [1.0].forEach(eps => {
    var eps_edge_color = 'red'
    var attacked_key = 'attacked-' + (eps).toFixed(1)

    reversed_layers.slice(0, -1).forEach((layer, layer_idx) => {

      var prev_layer = reversed_layers[layer_idx + 1]
      
      for (var neuron in top_graphs[attacked_key][layer]) {
        var curr_fv_id = ['fv', layer, neuron].join('-')
        var curr_neuron_x = parseInt(d3.select('#' + curr_fv_id).attr('x')) + (neuron_img_width / 2)
        var curr_neuron_y = parseInt(d3.select('#' + curr_fv_id).attr('y')) + neuron_img_height

        // Add edges connecting only displayed neurons
        if (!(does_exist(curr_fv_id))) {
          continue
        }

        // Add edges not connected to any of the benign-only neurons
        var is_in_benign_only = false
        for (let benign_eps of epss) {
          var benign_key = 'benign-' + (benign_eps).toFixed(1)
          var benign_only_neurons = extract_neurons_from_neuron_infos(fractionated_neuron_infos[benign_key][layer])
          if (benign_only_neurons.includes(neuron)) {
            is_in_benign_only = true
            break
          }
        }
        if (is_in_benign_only) {
          continue
        }

        for (var edge_info of top_graphs[attacked_key][layer][neuron]) {

          var prev_neuron = edge_info['prev_neuron']
          var weight = edge_info['weight']
          var prev_fv_id = ['fv', prev_layer, prev_neuron].join('-')

          // Add edges connecting only displayed neurons
          if (!(does_exist(prev_fv_id))) {
            continue
          }

          // Add edges not connected to any of the benign-only neurons
          var is_in_benign_only = false
          for (let benign_eps of epss) {
            var benign_key = 'benign-' + (benign_eps).toFixed(1)
            var benign_only_neurons = extract_neurons_from_neuron_infos(fractionated_neuron_infos[benign_key][prev_layer])
            if (benign_only_neurons.includes(prev_neuron)) {
              is_in_benign_only = true
              break
            }
          }
          if (is_in_benign_only) {
            continue
          }
  
          var prev_neuron_x = parseInt(d3.select('#' + prev_fv_id).attr('x')) + (neuron_img_width / 2)
          var prev_neuron_y = parseInt(d3.select('#' + prev_fv_id).attr('y'))
          
          d3.select('#g-ag')
            .append('path')
            .attr('d', gen_curve(curr_neuron_x, curr_neuron_y, prev_neuron_x, prev_neuron_y))
            .attr('stroke-width', edge_scale(weight))
            .attr('stroke', eps_edge_color)
            .attr('fill', 'none')
        }
      }
    })
  })
  
}

function does_exist(element_id) {
  var element = document.getElementById(element_id)
  if (element) {
    return true
  } else {
    return false
  }
}
  
function extract_rgb(rgb) {  
  var regex = /[+-]?\d+(?:\.\d+)?/g;
  var rgb_vals = []
  var match;
  while (match = regex.exec(rgb)) {
    rgb_vals.push(parseInt(match[0]));
  }
  return rgb_vals
}

function gen_hue_filter() {
  // Define filter
  var fv_filter_defs = svg_ag
    .append('defs')
    .attr('id', 'filter-defs')

  // Get color info
  var rgb_from = get_css_val('--attack-from-color').toString().split(',')
  var rgb_from_vals = extract_rgb(rgb_from)
  var rgb_to = get_css_val('--attack-to-color').toString().split(',')
  var rgb_to_vals = extract_rgb(rgb_to)

  // Define the color hue
  var max_eps = d3.max(epss)
  var eps_to_R = d3
    .scaleLinear()
    .domain([0, max_eps])
    .range([rgb_from_vals[0] / 255, rgb_to_vals[0] / 255])
  var eps_to_G = d3
    .scaleLinear()
    .domain([0, max_eps])
    .range([rgb_from_vals[1] / 255, rgb_to_vals[1] / 255])
  var eps_to_B = d3
    .scaleLinear()
    .domain([0, max_eps])
    .range([rgb_from_vals[2] / 255, rgb_to_vals[2] / 255])
  
  var epss_with_benign = [0].concat(epss)

  epss_with_benign.forEach(eps => {
    var r = eps_to_R(eps)
    var g = eps_to_G(eps)
    var b = eps_to_B(eps)
    var mat = r + ' 0 0 0 0\n'
    mat += '0 ' + g + ' 0 0 0\n'
    mat += '0 0 ' + b + ' 0 0\n'
    mat += '0 1 0 0 0'
    var filter_eps = d3
      .select('#filter-defs')
      .append('filter')
      .attr('id', 'filter-' + eps)
      .attr('color-interpolation-filters', 'sRGB')

    filter_eps
      .append('feColorMatrix')
      .attr('type', 'matrix')
      .attr('values', mat)
  })
}

function vis_filename (dirpath, layer, neuron, type) {
  var filename = dirpath + '/'
  if (type == 'channel') {
    filename += 'channel/'
    filename += [layer, neuron, type].join('-')
    filename += '.jpg'
  } else if (type.includes('ex')) {
    var ex = type.split('-')[1]
    filename += 'dataset-p/'
    filename += [layer, neuron, 'dataset', 'p', ex].join('-')
    filename += '.jpg'
  }
  return filename
}

function gen_curve(x1, y1, x2, y2) {

  var c1_x = (3 * x1 + x2) / 4
  var c1_y = (3 * y1 + y2) / 4 + neuron_img_padding['tb'] * 0.4
  var c2_x = (x1 + 3 * x2) / 4
  var c2_y = (y1 + 3 * y2) / 4 - neuron_img_padding['tb'] * 0.4

  var path = 'M ' + x1 + ',' + y1
  path += ' C ' + c1_x + ' ' + c1_y
  path += ' ' + c2_x + ' ' + c2_y + ','
  path += ' ' + x2 + ' ' + y2
  return path
}

function define_edge_scale(top_graphs) {
  var min_weight = 10000000
  var max_weight = -1
  for (var graph_key in top_graphs) {
    for (var layer in top_graphs[graph_key]) {
      for (var neuron in top_graphs[graph_key][layer]) {
        top_graphs[graph_key][layer][neuron].forEach(prev_neuron_info => {
          var weight = prev_neuron_info['weight']
          min_weight = d3.min([min_weight, weight])
          max_weight = d3.max([max_weight, weight])
        })
      }
    }
  }

  var edge_scale = d3
    .scaleLinear()
    .domain([min_weight, max_weight])
    .range([0.1, 2])
  
  return edge_scale
}

function display_onoff(element_id, option) {
  var element = document.getElementById(element_id)
  console.log(element.style.display )
  if (option == 'onoff') {
    if (element.style.display == 'block') {
      element.style.display = 'none'
    } else {
      element.style.display = 'block'
    }
  } else if (option == 'on') {
    element.style.display = 'block'
  } else if (option == 'off') {
    element.style.display = 'none'
  }
  
}

function mouseover_neuron(layer, neuron) {
  // Mouse cursor
  var fv_id = ['fv', layer, neuron].join('-')
  d3.select('#' + fv_id).style('cursor', 'pointer')

  // Generate or display the example box
  var example_box_class = ['ex-box', layer, neuron].join('-')
  var example_box_rect_id = ['ex-rect', layer, neuron].join('-')
  if (does_exist(example_box_rect_id)) {
    d3.selectAll('.' + example_box_class)
      .style('display', 'block')
  } else {
    // Generate example box rectangle
    d3.select('#g-ag')
      .append('rect')
      .attr('id', example_box_rect_id)
      .attr('class', ['ex-box', example_box_class].join(' '))

    // Get the feature vis' x and y
    var fv_x = parseInt(d3.select('#' + fv_id).attr('x'))
    var fv_y = parseInt(d3.select('#' + fv_id).attr('y'))

    // Get the example rectangle's x and y
    var ex_box_x = fv_x + neuron_img_width + neuron_img_padding['ex-box']
    var ex_box_h = parseInt(d3.select('#' + example_box_rect_id).style('height'))
    var ex_box_y = fv_y + (neuron_img_height / 2) - (ex_box_h / 2)

    // Set the example rectangle's x and y
    d3.select('#' + example_box_rect_id)
      .attr('x', ex_box_x)
      .attr('y', ex_box_y)

    // Draw the text
    d3.select('#g-ag')
      .append('text')
      .attr('class', [example_box_class, 'ex-box-title'].join(' '))
      .text('Example patches')
      .attr('x', ex_box_x + ex_img_padding['ex-start-x'])
      .attr('y', ex_box_y + ex_img_padding['ex-start-y'] - 6)

    // Draw the examples 
    for(var i = 0; i < 10; i++) {
      d3.select('#g-ag')
        .append('image')
        .attr('id', 'ex-' + [layer, neuron].join('-'))
        .attr('class', example_box_class)
        .attr('xlink:href', vis_filename(feature_vis_dir, layer, neuron, 'ex-' + i))
        .attr('width', ex_img_width)
        .attr('height', ex_img_height)
        .attr('x', ex_box_x + ex_img_padding['ex-start-x'] + (ex_img_width + ex_img_padding['lr']) * (i % 5))
        .attr('y', ex_box_y + ex_img_padding['ex-start-y'] + (ex_img_height + ex_img_padding['tb']) * parseInt(i / 5))
    }
    
  }
}

function mouseout_neuron(layer, neuron) {
  var example_box_class = ['ex-box', layer, neuron].join('-')
  d3.selectAll('.' + example_box_class)
    .style('display', 'none')
}

function click_neuron(svg, layer, neuron) {
  console.log('click', layer, neuron)

  var curr_neuron = d3.select('#fv-' + [layer, neuron].join('-'))
  var x = curr_neuron.attr('x')
  var y = curr_neuron.attr('y')

  var popup_id = 'data-ex-popup-' + [layer, neuron].join('-')
  var popup = document.getElementById(popup_id)
  if (popup) {
    console.log('yes')
    display_onoff(popup_id, 'onoff')
  } else {
    console.log('no')
    // create the popup
    svg.append('svg:image')
      .attr('id', 'data-ex-popup-' + [layer, neuron].join('-'))
      .attr('xlink:href', vis_filename(feature_vis_dir, layer, neuron, 'example-4'))
      .attr('width', neuron_img_width)
      .attr('height', neuron_img_height)
      .attr('x', x)
      .attr('y', y)
      .style('display', 'block')
      .on('click', function() {
        d3.select(this)
        .style('display', 'none')
      })
  }
  console.log(popup)
}

function annotate_layers(reversed_layers, neuron_groups_x_base, left_most_x) {
  // Get the position of layer
  reversed_layers.forEach((layer, layer_th) => {
    var x = left_most_x[layer] - 80
    var y = ag_start_y + layer_th * (neuron_img_height + neuron_img_padding['tb']) + 30
    d3.select('#g-ag')
      .append('text')
      .text(layer)
      .attr('x', x)
      .attr('y', y)
  })
}

function get_css_val(css_key) {
  return getComputedStyle(document.body).getPropertyValue(css_key)
}

////////////////////////////////////////////////////////////////////////////////////////////////
// Set data directory
////////////////////////////////////////////////////////////////////////////////////////////////
var feature_vis_dir = '../../../summit/summit-data/data/feature-vis'
var data_dir = '../../../massif/aggregated/panda-armadillo/top-neurons'
var file_list = get_file_list(data_dir)


////////////////////////////////////////////////////////////////////////////////////////////////
// Global variable
////////////////////////////////////////////////////////////////////////////////////////////////
var svg_center_x = parseInt(d3.select('#svg-ag').style('width').split('px')[0]) / 2
var svg_center_y = parseInt(d3.select('#svg-ag').style('height').split('px')[0]) / 2
var neuron_img_width = parseInt(get_css_val('--neuron_img_width'))
var neuron_img_height = parseInt(get_css_val('--neuron_img_height'))
var neuron_img_padding = {'lr': parseInt(get_css_val('--neuron_img_lr')), 'tb': parseInt(get_css_val('--neuron_img_tb'))}
var neuron_group_lr_padding = parseInt(get_css_val('--neuron_group_lr'))
var ag_start_y = parseInt(get_css_val('--ag_start_y'))

////////////////////////////////////////////////////////////////////////////////////////////////
// Main part for drawing the attribution graphs 
////////////////////////////////////////////////////////////////////////////////////////////////
Promise.all(file_list.map(file => d3.json(file))).then(function(data) {

  // Hyperparameters
  var topk = 10

  // Get the data
  var top_neurons = parse_top_neurons_all_attack(topk, data)
  var layers = Object.keys(top_neurons['benign'])
  var reversed_layers = layers.slice().reverse()
  console.log(top_neurons)
  
  // Define filters
  gen_hue_filter()

  // Initialize the fractionated neuron infos
  var fractionated_neuron_infos = init_fractionated_neuron_infos_all_attack(layers)

  // Fractionation of top neurons in benign images
  fractionated_neuron_infos = fractionate_benign_neurons(top_neurons, fractionated_neuron_infos)
  
  // Fractionation of top neurons in attacked images
  fractionated_neuron_infos = fractionate_attacked_neurons(top_neurons, fractionated_neuron_infos)
  console.log(fractionated_neuron_infos)

  // Draw the dummy center
  d3.select('#svg-ag')
    .append('circle')
    .attr('cx', svg_center_x)
    .attr('cy', svg_center_y)
    .attr('r', 3)

  // Get the center -- benign-attacked-both neuron group
  var benign_attacked_neurons = init_fractionated_neuron_infos(layers)
  var curr_eps_idx = epss.indexOf(curr_eps)

  layers.forEach(layer => {
    benign_attacked_neurons[layer] = benign_attacked_neurons[layer].concat(fractionated_neuron_infos['benign-attacked-both'][layer])
    epss.slice(curr_eps_idx + 1).forEach(other_eps => {
      var other_benign_neurons = fractionated_neuron_infos['benign-only-' + (other_eps).toFixed(1)]
      benign_attacked_neurons[layer] = benign_attacked_neurons[layer].concat(other_benign_neurons[layer])
    })
  })

  // Initialize the position for the neuron groups
  var neuron_groups_x_base = {}
  neuron_groups_x_base['both'] = {}
  epss.slice(0, curr_eps_idx + 1).forEach(eps => {
    neuron_groups_x_base['benign-' + (eps).toFixed(1)] = {}
    neuron_groups_x_base['attacked-' + (eps).toFixed(1)] = {}
  })

  // Get the start x position of the neuron groups for benign-attacked-both
  var neuron_x_unit_len = neuron_img_width + neuron_img_padding['lr']
  layers.forEach(layer => {
    var num_neurons = benign_attacked_neurons[layer].length
    neuron_groups_x_base['both'][layer] = svg_center_x - (num_neurons / 2) * neuron_x_unit_len
  })

  // Get the start x position of the neuron groups for benign-only
  epss.slice(0, curr_eps_idx + 1).forEach((eps, eps_th) => {
    layers.forEach(layer => {
      var prev_x_base = NaN
      if (eps_th == 0) {
        prev_x_base = neuron_groups_x_base['both'][layer]
      } else {
        prev_x_base = neuron_groups_x_base['benign-' + (epss[eps_th - 1]).toFixed(1)][layer]
      }
      var num_neurons = fractionated_neuron_infos['benign-only-' + (eps).toFixed(1)][layer].length
      neuron_groups_x_base['benign-' + (eps).toFixed(1)][layer] = prev_x_base - neuron_group_lr_padding - (num_neurons * neuron_x_unit_len)
    })
  })

  console.log(neuron_groups_x_base)
  
  // Get the start x position of the neuron groups for attacked
  epss.slice(0, curr_eps_idx + 1).forEach((eps, eps_th) => {
    layers.forEach(layer => {
      var prev_x_base = NaN
      var prev_num_neurons = NaN
      if (eps_th == 0) {
        prev_x_base = neuron_groups_x_base['both'][layer]
        prev_num_neurons = benign_attacked_neurons[layer].length
      } else {
        prev_x_base = neuron_groups_x_base['attacked-' + (epss[eps_th - 1]).toFixed(1)][layer]
        prev_num_neurons = fractionated_neuron_infos['attacked-' + (epss[eps_th - 1]).toFixed(1)][layer].length
      }
      
      neuron_groups_x_base['attacked-' + (eps).toFixed(1)][layer] = prev_x_base + (prev_num_neurons * neuron_x_unit_len) + neuron_group_lr_padding
    })
  })
  

  // Draw the center -- benign-attacked-both
  reversed_layers.forEach((layer, layer_th) => {
    var x_base = neuron_groups_x_base['both'][layer]
    benign_attacked_neurons[layer].forEach((neuron_info, neuron_th) => {
      var neuron = neuron_info['neuron']
      d3.select('#svg-ag')
        .append('image')
        .attr('id', 'fv-' + [layer, neuron].join('-'))
        .attr('xlink:href', vis_filename(feature_vis_dir, layer, neuron, 'channel'))
        .attr('width', neuron_img_width)
        .attr('height', neuron_img_height)
        .attr('x', x_base + neuron_th * (neuron_img_width + neuron_img_padding['lr']))
        .attr('y', ag_start_y + layer_th * (neuron_img_height + neuron_img_padding['tb']))
        .attr('filter', 'url(#filter-' + 1.5 + ')')
        .on('click', function() {click_neuron(svg, layer, neuron)})
    })
    
  })
  
  // Draw left neurons -- benign-only
  epss.slice(0, curr_eps_idx + 1).forEach((eps, eps_th) => {
    var eps_str = (eps).toFixed(1)
    reversed_layers.forEach((layer, layer_th) => {
      var x_base = neuron_groups_x_base['benign-' + eps_str][layer]
      fractionated_neuron_infos['benign-only-' + eps_str][layer].forEach((neuron_info, neuron_th) => {
        var neuron = neuron_info['neuron']
        d3.select('#svg-ag')
          .append('image')
          .attr('id', 'fv-' + [layer, neuron].join('-'))
          .attr('xlink:href', vis_filename(feature_vis_dir, layer, neuron, 'channel'))
          .attr('width', neuron_img_width)
          .attr('height', neuron_img_height)
          .attr('x', x_base + neuron_th * (neuron_img_width + neuron_img_padding['lr']))
          .attr('y', ag_start_y + layer_th * (neuron_img_height + neuron_img_padding['tb']))
          .attr('filter', 'url(#filter-' + eps + ')')
          .on('click', function() {click_neuron(svg, layer, neuron)})
      })
    })
  })

  // Draw right neurons -- attacked
  reversed_layers.forEach((layer, layer_th) => {
    var eps_str = 0.5
    var x_base = neuron_groups_x_base['attacked-' + eps_str][layer]
    // console.log(x_base)
    fractionated_neuron_infos['attacked-' + eps_str][layer].forEach((neuron_info, neuron_th) => {
      var neuron = neuron_info['neuron']
      d3.select('#svg-ag')
        .append('image')
        .attr('id', 'fv-' + [layer, neuron].join('-'))
        .attr('xlink:href', vis_filename(feature_vis_dir, layer, neuron, 'channel'))
        .attr('width', neuron_img_width)
        .attr('height', neuron_img_height)
        .attr('x', x_base + neuron_th * (neuron_img_width + neuron_img_padding['lr']))
        .attr('y', ag_start_y + layer_th * (neuron_img_height + neuron_img_padding['tb']))
        .attr('filter', 'url(#filter-' + 3.5 + ')')
        .on('click', function() {click_neuron(svg, layer, neuron)})
    })
  })

  // Default - draw benign
  // for (const [layer_th, layer] of layers.reverse().entries()) {
  //   svg_ag.append('text')
  //     .text(layer)
  //     .attr('x', 30)
  //     .attr('y', 30 + (neuron_img_padding['top-bottom'] + neuron_img_height) * layer_th)
  // }
  
  // for (const [layer_th, layer] of layers.entries()) {
  //   x_base = 100
  //   draw_feature_vis(svg_ag, layer, layer_th, x_base, top_neurons['benign'][layer], 'channel', 0, topk)
  // }

  
})

function get_file_list(data_dir){
  var file_lst = [data_dir + '/top-neurons-benign.json']
  epss.forEach(eps => {
    var file = data_dir + '/top-neurons-attacked-' + eps + '.json'
    file_lst.push(file)
  })
  return file_lst
}


function parse_top_neurons_all_attack(topk, data){
  var top_neurons = {}
  top_neurons['benign'] = parse_top_neurons(data[0], topk)
  epss.forEach((eps, eps_i) => {
    var eps_1lf = (eps).toFixed(1)
    top_neurons['attacked-' + eps_1lf] = parse_top_neurons(data[eps_i + 1], topk)
  })
  return top_neurons
}
  
function init_fractionated_neuron_infos_all_attack(layers) {
  var fractionated_neuron_infos = {}
  epss.forEach(eps => {
    var eps_1lf = (eps).toFixed(1)
    fractionated_neuron_infos['benign-only-' + eps_1lf] = init_fractionated_neuron_infos(layers)
  })
  fractionated_neuron_infos['benign-attacked-both'] = init_fractionated_neuron_infos(layers)
  epss.forEach(eps => {
    var eps_1lf = (eps).toFixed(1)
    fractionated_neuron_infos['attacked-' + eps_1lf] = init_fractionated_neuron_infos(layers)
  })

  return fractionated_neuron_infos
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

  var fractionation_keys = Object.keys(fractionated_neuron_infos)
  var top_benign_neurons = top_neurons['benign']

  layers.forEach(layer => {
    for (let benign_neuron_info of top_benign_neurons[layer]) {

      // A neuron highly activated in benign images
      var benign_neuron = benign_neuron_info['neuron']

      // See if the neuron should be in benign-attacked-both
      var is_in_both_benign_all_attacked = true

      // Fractionate the neurons based on the eps
      epss.forEach((eps, eps_i) => {

        // See if the benign neuron is idle at this strength
        var got_idle_at_this_strength = true
        var this_strength_key = 'attacked-' + (eps).toFixed(1)
        var top_neurons_current_strength = extract_neurons_from_neuron_infos(top_neurons[this_strength_key][layer])
        if (top_neurons_current_strength.includes(benign_neuron)) {
          got_idle_at_this_strength = false
        }

        // See if the benign neuron has never become idle before with weaker attacks
        if (got_idle_at_this_strength) {
          epss.slice(0, eps_i).forEach(weak_eps => {
            var got_idle_key = 'benign-only-' + (weak_eps).toFixed(1)
            var neurons_idle_already = extract_neurons_from_neuron_infos(fractionated_neuron_infos[got_idle_key][layer])
            if (neurons_idle_already.includes(benign_neuron)) {
              got_idle_at_this_strength = false
            }
          })
        }

        // Assign the benign neuron
        if (got_idle_at_this_strength) {
          var benign_only_key = 'benign-only-' + (eps).toFixed(1)
          fractionated_neuron_infos[benign_only_key][layer].push(benign_neuron_info)
          is_in_both_benign_all_attacked = false
        }
      })

      // Assign the benign neuuron after looking thorugh all eps
      if (is_in_both_benign_all_attacked) {
        var benign_key = 'benign-attacked-both'
        fractionated_neuron_infos[benign_key][layer].push(benign_neuron_info)
      }
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
        if (is_stucked_this_curr) {
          epss.slice(eps_i + 1).forEach(stronger_eps => {
            var stronger_eps_1lf = (eps).toFixed(1)
            var top_neurons_in_stronger_strength = top_neurons['attacked-' + stronger_eps_1lf][layer]
            if (top_neurons_in_stronger_strength.includes(curr_neuron)) {
              is_stucked_this_curr = false
            }
          })
        }

        // Assign the neuron info
        if (is_stucked_this_curr) {
          fractionated_neuron_infos[attacked_key][layer].push(neuron_info_curr_eps)
        }

      })
    })
  })

  return fractionated_neuron_infos
}

function vis_filename (dirpath, layer, neuron, type) {
  var filename = dirpath + '/'
  if (type == 'channel') {
    filename += 'channel/'
    filename += [layer, neuron, type].join('-')
    filename += '.jpg'
  } else if (type.includes('example')) {
    var ex = type.split('-')[1]
    filename += 'dataset-p/'
    filename += [layer, neuron, 'dataset', 'p', ex].join('-')
    filename += '.jpg'
  }
  return filename
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

function draw_feature_vis(svg, layer, layer_th, x_base, neuron_lst, vis_type, eps, topk=-1) {
  // If topk is -1, then draw all neurons
  if (topk != -1) {
    var neurons = neuron_lst.slice(0, topk)
  } else {
    var neurons = neuron_lst
  }

  // Draw top neurons' feature vis
  for (const [neuron_th, neuron_info] of neurons.entries()) {
    neuron = neuron_info['neuron']
    // svg.append('rect')
    //   .attr('id', 'fv-bg-' + [layer, neuron].join('-'))
    //   .attr('width', neuron_img_width)
    //   .attr('height', neuron_img_height)
    //   .style('fill', 'red')
    //   .attr('x', x_base + (neuron_img_padding['left-right'] + neuron_img_width) * neuron_th)
    //   .attr('y', (neuron_img_padding['top-bottom'] + neuron_img_height) * layer_th)
    //   // .on('click', function() {
    //   //   click_neuron(svg, layer, neuron)
    //   // })

    svg.append('image')
      .attr('id', 'fv-' + [layer, neuron].join('-'))
      .attr('xlink:href', vis_filename(feature_vis_dir, layer, neuron, vis_type))
      .attr('width', neuron_img_width)
      .attr('height', neuron_img_height)
      .attr('x', x_base + (neuron_img_padding['left-right'] + neuron_img_width) * neuron_th)
      .attr('y', (neuron_img_padding['top-bottom'] + neuron_img_height) * layer_th)
      .attr('filter', 'url(#filter-' + eps + ')')
      .on('click', function() {
        click_neuron(svg, layer, neuron)
      })
  }
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

function get_css_val(css_key) {
  return getComputedStyle(document.body).getPropertyValue(css_key)
}
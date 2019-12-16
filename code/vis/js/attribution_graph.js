// Set data directory
var feature_vis_dir = '../../../summit/summit-data/data/feature-vis'
var data_dir = '../../../massif/aggregated/panda-armadillo/top-neurons'

// Main part for drawing the attribution graphs
Promise.all([
  // Read the data
  // TODO: Do not hard code this
  d3.json(data_dir + '/top-neurons-benign.json'),
  d3.json(data_dir + '/top-neurons-attacked-0.5.json'),
  d3.json(data_dir + '/top-neurons-attacked-1.json'),
  d3.json(data_dir + '/top-neurons-attacked-1.5.json'),
  d3.json(data_dir + '/top-neurons-attacked-2.json'),
  d3.json(data_dir + '/top-neurons-attacked-2.5.json'),
  d3.json(data_dir + '/top-neurons-attacked-3.json'),
  d3.json(data_dir + '/top-neurons-attacked-3.5.json')
]).then(function(data) {

  // Get the data
  // TODO: Do not hard code this
  var top_neurons = {}
  var topk = 15
  top_neurons['benign'] = parse_top_neurons(data[0], topk)
  top_neurons['attacked-0.5'] = parse_top_neurons(data[1], topk)
  top_neurons['attacked-1.0'] = parse_top_neurons(data[2], topk)
  top_neurons['attacked-1.5'] = parse_top_neurons(data[3], topk)
  top_neurons['attacked-2.0'] = parse_top_neurons(data[4], topk)
  top_neurons['attacked-2.5'] = parse_top_neurons(data[5], topk)
  top_neurons['attacked-3.0'] = parse_top_neurons(data[6], topk)
  top_neurons['attacked-3.5'] = parse_top_neurons(data[7], topk)

  // Define filters
  var fv_filter_defs = svg_ag
    .append('defs')
    .attr('id', 'filter-defs')
  gen_hue_filter()

  // Fractionate neurons
  // TODO: Do not hard code this
  var fractionated_neuron_infos = {}
  var layers = Object.keys(top_neurons['benign'])
  fractionated_neuron_infos['benign-only-0.5'] = init_fractionated_neuron_infos(layers)
  fractionated_neuron_infos['benign-only-1.0'] = init_fractionated_neuron_infos(layers)
  fractionated_neuron_infos['benign-only-1.5'] = init_fractionated_neuron_infos(layers)
  fractionated_neuron_infos['benign-only-2.0'] = init_fractionated_neuron_infos(layers)
  fractionated_neuron_infos['benign-only-2.5'] = init_fractionated_neuron_infos(layers)
  fractionated_neuron_infos['benign-only-3.0'] = init_fractionated_neuron_infos(layers)
  fractionated_neuron_infos['benign-only-3.5'] = init_fractionated_neuron_infos(layers)
  fractionated_neuron_infos['benign-attacked-both'] = init_fractionated_neuron_infos(layers)
  fractionated_neuron_infos['attacked-0.5'] = init_fractionated_neuron_infos(layers)
  fractionated_neuron_infos['attacked-1.0'] = init_fractionated_neuron_infos(layers)
  fractionated_neuron_infos['attacked-1.5'] = init_fractionated_neuron_infos(layers)
  fractionated_neuron_infos['attacked-2.0'] = init_fractionated_neuron_infos(layers)
  fractionated_neuron_infos['attacked-2.5'] = init_fractionated_neuron_infos(layers)
  fractionated_neuron_infos['attacked-3.0'] = init_fractionated_neuron_infos(layers)
  fractionated_neuron_infos['attacked-3.5'] = init_fractionated_neuron_infos(layers)

  var fractionation_keys = Object.keys(fractionated_neuron_infos)
  var top_neurons_keys = Object.keys(top_neurons)
  
  // Fractionation of top neurons in benign images
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
          fractionation_keys.slice(0, eps_i).forEach(got_idle_key => {
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
  
  // // Fractionation of top neurons in attacked images
  // fractionation_keys.slice(2).forEach((fractionation_key, fraction_index) => {
  //   var target_top_neuron_infos = top_neurons[fractionation_key]
    
  //   layers.forEach(layer => {

  //     var is_
  //     for (let target_neuron_info of target_top_neuron_infos[layer]) {
  //       fractionation_keys.slice(2 + fraction_index + 1).forEach(fractionation_other_key => {        
  //         var compare_top_neuron_infos = top_neurons[fractionation_other_key]
  //         // var compare_top_neurons = extract_neurons_from_neuron_infos(compare_top_neuron_infos)
  
  //       })
  //     }
      
      
  //   })
    
    
  // })

  console.log(fractionated_neuron_infos)
    
  


  
  // Default - draw benign
  for (const [layer_th, layer] of layers.reverse().entries()) {
    svg_ag.append('text')
      .text(layer)
      .attr('x', 30)
      .attr('y', 30 + (neuron_img_padding['top-bottom'] + neuron_img_height) * layer_th)
  }
  
  for (const [layer_th, layer] of layers.entries()) {
    console.log('%d: %s', layer_th, layer)
    x_base = 100
    draw_feature_vis(svg_ag, layer, layer_th, x_base, top_neurons['benign'][layer], 'channel', 0, topk)
  }

  
})

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
  // TODO: Do not hard code this
  // Get color info
  var rgb_from = get_css_val('--attack-from-color').toString().split(',')
  var rgb_from_vals = extract_rgb(rgb_from)
  var rgb_to = get_css_val('--attack-to-color').toString().split(',')
  var rgb_to_vals = extract_rgb(rgb_to)

  // Define the color hue
  var eps_to_R = d3
    .scaleLinear()
    .domain([0, 3.5])
    .range([rgb_from_vals[0] / 255, rgb_to_vals[0] / 255])
  var eps_to_G = d3
    .scaleLinear()
    .domain([0, 3.5])
    .range([rgb_from_vals[1] / 255, rgb_to_vals[1] / 255])
  var eps_to_B = d3
    .scaleLinear()
    .domain([0, 3.5])
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
      // .style('opacity', '0.5')
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
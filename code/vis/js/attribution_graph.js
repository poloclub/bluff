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
  top_neurons['benign'] = parse_top_neurons(data[0])
  top_neurons['attacked-0.5'] = parse_top_neurons(data[1])
  top_neurons['attacked-1'] = parse_top_neurons(data[2])
  top_neurons['attacked-1.5'] = parse_top_neurons(data[3])
  top_neurons['attacked-2'] = parse_top_neurons(data[4])
  top_neurons['attacked-2.5'] = parse_top_neurons(data[5])
  top_neurons['attacked-3'] = parse_top_neurons(data[6])
  top_neurons['attacked-3.5'] = parse_top_neurons(data[7])

  // Define filters
  // TODO: Do not hard code this
  var fv_filter_defs = svg_ag
    .append('defs')
    .attr('id', 'filter-defs')


  
  // Default - draw benign
  var topk = 10
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
    var mat = (r + ' ').repeat(5) + '\n'
    mat += (g + ' ').repeat(5) + '\n' 
    mat += (b + ' ').repeat(5) + '\n'
    mat += '1 1 1 1 0'
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

function parse_top_neurons(top_neurons) {
  var layers = Object.keys(top_neurons)
  layers.forEach(layer => {
    top_neurons[layer] = top_neurons[layer].map(function(neuron_info) {
      return {
        'neuron': parseInt(neuron_info['neuron']), 
        'weight': parseFloat(neuron_info['weight'])
      }
    })
  })
  return top_neurons
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
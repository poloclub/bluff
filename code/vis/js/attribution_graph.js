
var feature_vis_dir = '../../../summit/summit-data/data/feature-vis'

Promise.all([
  d3.json('vis-data/got_activated.json'),
  d3.json('vis-data/got_idle.json'),
  d3.json('vis-data/both_activated.json')
]).then(function(data) {

  var attacked_friendly_neurons = data[0]
  var benign_friendly_neurons = data[1]
  var both_friendly_neurons = data[2]
  var svg = svg_ag

  topk = 10
  
  for (const [layer_th, layer] of layers.reverse().entries()) {
    svg.append('text')
      .text(layer)
      .attr('x', 30)
      .attr('y', 30 + (neuron_img_padding['top-bottom'] + neuron_img_height) * layer_th)
  }
  
  for (const [layer_th, layer] of layers.entries()) {
    console.log('%d: %s', layer_th, layer)

    x_base = 100
    draw_feature_vis(svg, layer, layer_th, x_base, benign_friendly_neurons[layer], 'channel', topk)
    x_base += 55 + topk * (neuron_img_padding['left-right'] + neuron_img_width)
    draw_feature_vis(svg, layer, layer_th, x_base, both_friendly_neurons[layer], 'channel', topk)
    x_base += 55 + topk * (neuron_img_padding['left-right'] + neuron_img_width)
    draw_feature_vis(svg, layer, layer_th, x_base, attacked_friendly_neurons[layer], 'channel', topk)

  }
  
})



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

function draw_feature_vis(svg, layer, layer_th, x_base, neuron_lst, vis_type, topk=-1) {
  if (topk != -1) {
    var neurons = neuron_lst.slice(0, topk)
  } else {
    var neurons = neuron_lst
  }

  for (const [neuron_th, neuron] of neurons.entries()) {
    svg.append('svg:image')
      .attr('id', 'fv-' + [layer, neuron].join('-'))
      .attr('xlink:href', vis_filename(feature_vis_dir, layer, neuron, vis_type))
      .attr('width', neuron_img_width)
      .attr('height', neuron_img_height)
      .attr('x', x_base + (neuron_img_padding['left-right'] + neuron_img_width) * neuron_th)
      .attr('y', (neuron_img_padding['top-bottom'] + neuron_img_height) * layer_th)
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

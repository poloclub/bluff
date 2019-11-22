
var feature_vis_dir = '../../../summit/summit-data/data/feature-vis'

function vis_filename (dirpath, layer, neuron, type) {
  var filename = dirpath + '/'
  if (type == 'channel')
    filename += 'channel/'
  filename += layer + '-'
  filename += neuron + '-'
  filename += type + '.jpg'
  return filename
}

Promise.all([
  d3.json('vis-data/got_activated.json'),
  d3.json('vis-data/got_idle.json'),
  d3.json('vis-data/both_activated.json')
]).then(function(data) {
  console.log(data)
  console.log(data[0])
  console.log(data[1])
  console.log(data[2])

  var svg = d3
    .select('body')
    .append('svg')
  
  svg.append('svg:image')
    .attr("xlink:href", function() {
      return vis_filename(feature_vis_dir, 'mixed4a', 5, 'channel')
    })
    .attr('width', "50")
    .attr('height', "50")
    // .attr("xlink:href", vis_filename(feature_vis_dir, 'mixed4a', 0, 'channel'))
    // .attr('src', vis_filename(feature_vis_dir, 'mixed4a', 0, 'channel'))
})



// // Create the SVG element and set its dimensions.
// var width  = 800,
// height = 200,
// padding = 15;

// var div = d3.select('#svg-container'),
// svg = div.append('svg');

// svg.attr('width', width).attr('height', height);

// // Create the svg:defs element and the main gradient definition.
// var svgDefs = svg.append('defs');

// var mainGradient = svgDefs.append('linearGradient')
// .attr('id', 'mainGradient');

// // Create the stops of the main gradient. Each stop will be assigned
// // a class to style the stop using CSS.
// mainGradient.append('stop')
// .attr('class', 'stop-left')
// .attr('offset', '0');

// mainGradient.append('stop')
// .attr('class', 'stop-right')
// .attr('offset', '1');

// // Use the gradient to set the shape fill, via CSS.
// svg.append('rect')
// .classed('filled', true)
// .attr('x', padding)
// .attr('y', padding)
// .attr('width', (width / 2) - 1.5 * padding)
// .attr('height', height - 2 * padding);

// // Use the gradient to set the shape stroke, via CSS.
// svg.append('rect')
// .classed('outlined', true)
// .attr('x', width / 2 + padding / 2)
// .attr('y', padding)
// .attr('width', (width / 2) - 1.5 * padding)
// .attr('height', height - 2 * padding);


// canvas = d3.select('canvas')
// width = canvas.node().getBoundingClientRect().width
// height = canvas.node().getBoundingClientRect().height

// ctx = canvas.node().getContext('2d')
// image = ctx.createImageData(width, height)

// for (var x = 0; x <= width; x++) {
//   for (var y = 0; y <= height; y++) {
//     var i = (y * width + x) * 4
//     r = i+0
//     g = i+1
//     b = i+2
//     a = i+3
    
//     image.data[r] = x / width * 255
//     image.data[g] = 0
//     image.data[b] = y / height * 255
//     image.data[a] = 255
//   }
    
// }

// ctx.putImageData(image, 0, 0)

// // var context = canvas.node().getContext('2d');
// // var customBase = document.createElement('custom');
// // var custom = d3.select(customBase); // replacement of SVG
// canvas.append('svg').append('circle').attr('r', 100).attr('cx', 30).attr('cy', 30)
import { main_view_size } from './style.js';

// Add header
var header = document.createElement('div')
header.setAttribute('id', 'header')
document.body.appendChild(header)

// Generate main-div
d3.select('body')
  .append('div')
  .attr('id', 'div-main')

// Generate svg-main
d3.select('#div-main')
  .append('svg')
  .attr('id', 'svg-main')

// Generate svg and g for attribution graphs
var width = main_view_size['width']
var height = main_view_size['height']
d3.select('#svg-main')
  .append('svg')
  .attr('id', 'svg-ag')

d3.select('#svg-ag')
  .append('rect')
  .attr('class', 'main-bg')
  .style('width', width)
  .style('height', height)

d3.select('#svg-main')  
  .append('g')
  .attr('id', 'g-ag')

d3.select('#svg-main')  
  .append('rect')
  .attr('id', 'option-bg')
  .attr('class', 'main-bg')
  
// Generate svg for attack option
d3.select('#svg-main')
  .append('svg')
  .attr('id', 'svg-attack-option')

// Generate svg for mode option
d3.select('#svg-main')
  .append('svg')
  .attr('id', 'svg-mode-option')

// Generate svg for class option box
d3.select('#svg-main')
  .append('svg')
  .attr('id', 'svg-class-option-box')

// Make attribution graph view zoomable
d3.select('#svg-ag')
  .call(
    d3.zoom()
      .on('zoom', function(){
        d3.select('#g-ag')
          .attr('transform', d3.event.transform)
      })
  )


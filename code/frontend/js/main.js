
import { ag_margins } from './constant.js';

// Add header
var header = document.createElement('div')
header.setAttribute('id', 'header')
document.body.appendChild(header)

// Graph filter
var attribution_graph_option = document.createElement('div')
attribution_graph_option.setAttribute('id', 'ag-option')
document.body.appendChild(attribution_graph_option)

// Generate div for attribution graph
d3.select('body')
  .append('div')
  .attr('id', 'div-main')

// Generate svg for attribution graph and nodebox
d3.select('#div-main')
  .append('svg')
  .attr('id', 'svg-ag-wrapper')

// Generate the main svg for all attribution graphs
d3.select('#svg-ag-wrapper')
  .append('svg')
  .attr('id', 'svg-ag-all')
  .attr('width', ag_margins['total'])

// Generate attribution graph views
gen_attribution_graph_view('original')
add_padding_svg('original')
gen_attribution_graph_view('attacked')
add_padding_svg('attacked')
gen_attribution_graph_view('target')

// Generate svg for node box
d3.select('#svg-ag-wrapper')
  .append('svg')
  .attr('id', 'svg-ag-nodebox')

// Generate svg for class option box
d3.select('#svg-ag-wrapper')
  .append('svg')
  .attr('id', 'svg-class-option-box')

// Make attribution graph views zoomable
make_graph_view_zoomable('original')
make_graph_view_zoomable('attacked')
make_graph_view_zoomable('target')

// Function to generate attribution graph view
function gen_attribution_graph_view(graph_key) {
  d3.select('#svg-ag-all')
    .append('svg')
    .attr('id', 'svg-wrapper-ag-' + graph_key)
    .attr('class', 'svg-wrapper-ag')

  d3.select('#svg-wrapper-ag-' + graph_key)
    .append('g')
    .attr('id', 'g-wrapper-ag-' + graph_key)
    .attr('class', 'g-wrapper')
    .attr('transform', 'translate(' + ag_margins[graph_key] + ', 0)')

  d3.select('#g-wrapper-ag-' + graph_key)
    .append('rect')
    .attr('class', 'g-wrapper-rect')

  d3.select('#g-wrapper-ag-' + graph_key)
    .append('svg')
    .attr('id', 'svg-ag-' + graph_key)
    .attr('class', 'svg-ag')

  d3.select('#svg-ag-' + graph_key)
    .append('g')
    .attr('id', 'g-ag-' + graph_key)
    .attr('class', 'g-ag')
}

// Function to add padding svg between attribution graphs
function add_padding_svg(graph_key) {
  d3.select('#svg-ag-all')
    .append('svg')
    .attr('id', 'svg-padding-' + graph_key)
    .attr('class', 'svg-padding')

  d3.select('#svg-padding-' + graph_key)
    .append('g')
    .attr('id', 'g-padding-' + graph_key)
    .attr('class', 'g-padding')
    .attr('transform', 'translate(' + ag_margins[graph_key + '-padding'] + ', 0)')
  
  d3.select('#g-padding-' + graph_key) 
    .append('rect')
    .attr('class', 'g-padding-rect')
}

// Function to make attribution graph zoomable
function make_graph_view_zoomable(graph_key) {
  d3.select('#g-wrapper-ag-' + graph_key)
    .call(
      d3.zoom()
        .on('zoom', function(){
          d3.select('#g-ag-' + graph_key)
            .attr('transform', d3.event.transform)
        })
    )
}



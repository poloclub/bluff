import { gen_top_dropdown } from "./top_control.js";
import { div_width, ag_margins } from './constant.js';

// Graph filter
var attribution_graph_option = document.createElement('div')
attribution_graph_option.setAttribute('id', 'ag-option')
document.body.appendChild(attribution_graph_option)

// From class
var attack_from_class_control = gen_top_dropdown('graph-filter-from-dropdown', 'Attack from', 'Giant Panda')
attribution_graph_option.appendChild(attack_from_class_control)
attack_from_class_control.style.width = div_width + 'px'
attack_from_class_control.style.setProperty('transform', 'translateX(100px)')

// Adversarial
var adversarial_text = document.createElement('div')
attribution_graph_option.appendChild(adversarial_text)
adversarial_text.setAttribute('id', 'graph-adversarial')
adversarial_text.style.setProperty('display', 'inline')
adversarial_text.style.setProperty('transform', 'translate(280px, 5px)')
adversarial_text.style.setProperty('position', 'absolute')
adversarial_text.style.setProperty('font-size', '20px')
adversarial_text.innerHTML = 'ADVERSARIAL'

// To class
var attack_to_class_control = gen_top_dropdown('graph-filter-to-dropdown', 'Attack to', 'Armadillo')
attribution_graph_option.appendChild(attack_to_class_control)
attack_to_class_control.style.width = div_width + 'px'
attack_to_class_control.style.setProperty('transform', 'translateX(588px)')

// Generate div for attribution graph
d3.select('body')
  .append('div')
  .attr('id', 'div-ag')

// Generate the main svg for
d3.select('#div-ag')
  .append('svg')
  .attr('id', 'svg-ag-all')
  .attr('width', ag_margins['total'])

// Generate attribution graph views
gen_attribution_graph_view('original')
add_padding_svg('original')
gen_attribution_graph_view('attacked')
add_padding_svg('attacked')
gen_attribution_graph_view('target')

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





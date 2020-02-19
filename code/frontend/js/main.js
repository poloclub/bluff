import {gen_top_dropdown} from "./top_control.js";
import { layers, div_width, div_height, ag_margin } from './constant.js';

////////////////////////////////////////////////////////////////////////////////////////////////
// Global variable
////////////////////////////////////////////////////////////////////////////////////////////////

var div_margins = {
  'original': 100,
  'attacked': 100,
  'target': 100
}

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

// Newline
var dummy_newline = document.createElement('div')
document.body.appendChild(dummy_newline)

// Generate graph views
gen_attribution_graph_view('original')
gen_attribution_graph_view('attacked')
gen_attribution_graph_view('target')
make_graph_view_zoomable('original')
make_graph_view_zoomable('attacked')
make_graph_view_zoomable('target')

function gen_attribution_graph_view(graph_key) {

  // Generate div
  d3.select('body')
    .append('div')
    .attr('id', 'div-ag-' + graph_key)
    .attr('class', 'div-ag')
    .style('margin-left', div_margins[graph_key] + 'px')

  // Generate svg
  d3.select('#div-ag-' + graph_key)
    .append('svg')
    .attr('id', 'svg-ag-' + graph_key)
    .attr('class', 'svg-ag')

  // Generate g
  d3.select('#svg-ag-' + graph_key)
    .append('g')
    .attr('id', 'g-ag-' + graph_key)
    .attr('class', 'g-ag')

}

function make_graph_view_zoomable(graph_key) {
  d3.select('#div-ag-' + graph_key)
    .call(
      d3.zoom()
        .on('zoom', function(){
          d3.select('#g-ag-' + graph_key)
            .attr('transform', d3.event.transform)
        })
    )
}



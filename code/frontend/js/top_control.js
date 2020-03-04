import { 
  update_neurons_with_new_strength,
  update_neurons_with_new_vulnerability 
} from './attribution_graph.js';

import { 
  strengths, 
  top_ks, 
  default_strengths, 
  default_filters,
  filter_bar_length, 
  vulnerabilities
} from './constant.js';

import { gen_top_dropdown } from "./header.js";

export var curr_attack_type = 'pgd'
export var curr_strengths = {'pgd': default_strengths['pgd']}
export var curr_filters = {'topK': default_filters['topK'], 'vulnerability': default_filters['vulnerability']}

// Define top-control div
var top_control = document.createElement('div')
top_control.setAttribute('id', 'top-control')
document.body.appendChild(top_control)

// Section title
var top_control_title = document.createElement('div')
top_control_title.innerText = 'How to manipulate'
top_control_title.setAttribute('id', 'top-control-title')
top_control.appendChild(top_control_title)

// Horizontal line
var top_control_horizontal_line = document.createElement('hr')
top_control_horizontal_line.setAttribute('id', 'top-control-horizontal-line')
top_control_horizontal_line.setAttribute('noshade', 'true')
top_control.appendChild(top_control_horizontal_line)

// Attack dropdown
// TODO: need to add other attacks
var attack_type_control = gen_top_dropdown('top-control-attack-dropdown', 'Attack', curr_attack_type)
top_control.appendChild(attack_type_control)

// Attack strength control bar
gen_filter_bar(strengths[curr_attack_type], default_strengths[curr_attack_type], 'Attack Strength', 'attack')



//////////////////////////////////////////////////////////////////////////////////////////
// Functions for generating filter bar
//////////////////////////////////////////////////////////////////////////////////////////

// Generate filter bar
function gen_filter_bar(domains, default_val, title, filter_type) {

  // Generate filter bar svg
  var svg_filter_bar = d3
    .select('#top-control')
    .append('svg')
    .attr('id', 'filter-bar-' + filter_type)
    .attr('class', 'svg-filter-bar')
    .style('display', 'inline')

  // Append title text
  svg_filter_bar
    .append('text')
    .attr('id', 'filter-bar-title-' + filter_type)
    .attr('class', 'filter-bar-title')
    .text(title)
    .attr('x', 20)
    .attr('y', 23)

  // Append control background bar
  svg_filter_bar
    .append('rect')
    .attr('id', 'filter-bar-background-' + filter_type)
    .attr('class', 'filter-bar-background filter-bar-rect')
    .style('width', filter_bar_length)
  
  // Generate front bar scale
  var [domain_to_bar, bar_to_domain] = gen_front_bar_length_scale()

  // Append control front bar  
  svg_filter_bar
    .append('rect')
    .attr('id', 'filter-bar-front-' + filter_type)
    .attr('class', 'filter-bar-front filter-bar-rect')
    .style('width', domain_to_bar(default_val))

  // Append control circle
  svg_filter_bar
    .append('circle')
    .attr('id', 'filter-bar-circle-' + filter_type)
    .attr('class', 'filter-bar-circle')
    .style('cx', domain_to_bar(default_val))
    .on('mouseover', function(){ this.style.cursor = 'pointer'})
    .call(gen_control_circle_drag())

  // Append filter text
  svg_filter_bar
    .append('text')
    .attr('id', 'filter-bar-text-' + filter_type)
    .attr('class', 'filter-bar-text')
    .text(default_val)

  function gen_front_bar_length_scale() {
    var max_domain_val = d3.max(domains)

    var domain_to_front_bar_length = d3
      .scaleLinear()
      .domain([0, max_domain_val])
      .range([0, filter_bar_length])

    var front_bar_length_to_domain = d3
      .scaleLinear()
      .domain([0, filter_bar_length])
      .range([0, max_domain_val])
    
    return [domain_to_front_bar_length, front_bar_length_to_domain]
  }

  function gen_control_circle_drag() {

    var control_drag = d3
      .drag()
      .on('start', function() { circle_drag_start() })
      .on('drag', function() { circle_drag_ing() })
      .on('end', function() { circle_drag_end() })

    return control_drag
  }

  function circle_drag_start() {
    // Update the circle's color 
    d3.select('#filter-bar-circle-' + filter_type)
    .style('fill', 'gray')
    .style('stroke', 'none')
  }

  function circle_drag_ing() {
    // Get the position of the circle and the front bar
    var mouse_x = d3.mouse(document.getElementById('filter-bar-circle-' + filter_type))[0]
    mouse_x = d3.min([d3.max([0, mouse_x]), filter_bar_length])

    var max_domain_val = d3.max(domains)
    var domain_unit = max_domain_val / domains.length

    // Update the filter value
    if (filter_type == 'attack') {
      curr_strengths[curr_attack_type] = bar_to_domain(mouse_x)
      curr_strengths[curr_attack_type] = round_unit(curr_strengths[curr_attack_type], domain_unit)
      d3.select('#filter-bar-text-' + filter_type).text(curr_strengths[curr_attack_type]) 
    } else {
      curr_filters[filter_type] = bar_to_domain(mouse_x)
      curr_filters[filter_type] = round_unit(curr_filters[filter_type], domain_unit)
      d3.select('#filter-bar-text-' + filter_type).text(curr_filters[filter_type])
    }
      
    // Position the circle and the front bar
    d3.select('#filter-bar-circle-' + filter_type).style('cx', mouse_x)
    d3.select('#filter-bar-front-' + filter_type).style('width', mouse_x)

    // Update attribution graph
    if (filter_type == 'attack') {
      update_neurons_with_new_strength()
    } else if (filter_type == 'vulnerability') {
      update_neurons_with_new_vulnerability()
    }
  }

  function circle_drag_end() {

    // Update the circle's color 
    d3.select('#filter-bar-circle-' + filter_type)
      .style('fill', 'white')
      .style('stroke', 'gray')

    // Get the position of the circle and the front bar
    var mouse_x = d3.mouse(document.getElementById('filter-bar-circle-' + filter_type))[0]
    mouse_x = d3.min([d3.max([0, mouse_x]), filter_bar_length])

    // Sticky movement
    var bar_length_unit = filter_bar_length / domains.length
    mouse_x = round_unit(mouse_x, bar_length_unit)
    d3.select('#filter-bar-circle-' + filter_type).style('cx', mouse_x)
    d3.select('#filter-bar-front-' + filter_type).style('width', mouse_x)
  }

}

// Round by a specific unit
function round_unit(n, unit) {
  var new_unit = 1 / unit
  return Math.round(n * new_unit) / new_unit;
}

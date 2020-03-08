//////////////////////////////////////////////////////////////////////////////////////////
// Import variables and functions
//////////////////////////////////////////////////////////////////////////////////////////

import { 
  attack_types,
  attack_strengths, 
  filter_bar_length
} from './constant.js';

import {
  icons
} from './style.js'

import { 
  update_node_opacity,
  update_scatter_circle
} from './attribution_graph.js';

//////////////////////////////////////////////////////////////////////////////////////////
// Global variables
//////////////////////////////////////////////////////////////////////////////////////////

export var selected_attack_info = {
  'attack_type': 'pgd',
  'attack_strength': 0.3
}

var strength_bar_scale = {}

//////////////////////////////////////////////////////////////////////////////////////////
// Generate attack options
//////////////////////////////////////////////////////////////////////////////////////////

write_attack_option_title('How to manipulate')
gen_attack_dropdown()
gen_strength_bar_length_scale()
gen_filter_bar(
  'strength', 
  strength_bar_scale[selected_attack_info['attack_type']], 
  selected_attack_info['attack_strength'],
  attack_strengths[selected_attack_info['attack_type']]
)

//////////////////////////////////////////////////////////////////////////////////////////
// Main division
//////////////////////////////////////////////////////////////////////////////////////////

function write_attack_option_title(title) {
  d3.select('#svg-attack-option')
    .append('text')
    .attr('id', 'attack-option-title')
    .text(title)
}

//////////////////////////////////////////////////////////////////////////////////////////
// Attack type dropdown
//////////////////////////////////////////////////////////////////////////////////////////

function gen_attack_dropdown() {
  create_dropdown_title('Attack Method')
  create_dropdown_menu()

  function create_dropdown_title(title) {
    d3.select('#svg-attack-option')
      .append('g')
      .attr('id', 'g-attack-type')
      .append('text')
      .attr('id', 'attack-dropdown-title')
      .text(title)
  }

  function create_dropdown_menu() {
    // Generate dropdown box
    d3.select('#g-attack-type')
      .append('rect')
      .attr('id', 'attack-dropdown-box')

    // Append dropdown icon
    d3.select('#g-attack-type')
      .append('text')
      .attr('font-family', 'FontAwesome')
      .attr('id', 'attack-dropdown-icon')
      .text(icons['angle-down'])

    // Append selection text
    // TODO: Currently only PGD shown
    d3.select('#g-attack-type')
      .append('text')
      .attr('id', 'attack-dropdown-text')
      .text('PGD')

    // TODO
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
// Attack strength bar
//////////////////////////////////////////////////////////////////////////////////////////
function gen_strength_bar_length_scale() {
  attack_types.forEach(attack_type => {
    strength_bar_scale[attack_type] = {}

    var max_domain_val = d3.max(attack_strengths[attack_type])
    var domain_to_front_bar_length = d3
      .scaleLinear()
      .domain([0, max_domain_val])
      .range([0, filter_bar_length])
    var front_bar_length_to_domain = d3
      .scaleLinear()
      .domain([0, filter_bar_length])
      .range([0, max_domain_val])
    strength_bar_scale[attack_type]['val_to_len'] = domain_to_front_bar_length
    strength_bar_scale[attack_type]['len_to_val'] = front_bar_length_to_domain
  })
}

function gen_filter_bar(filter_type, bar_length_scale, default_val, domains) {
  create_filter_bar_title('Attack Strength', filter_type)
  gen_strength_bar(filter_type)

  function create_filter_bar_title(title, filter_type) {
    // Get parent id
    var parent_id = ''
    if (filter_type == 'strength') {
      parent_id = 'svg-attack-option'
    }

    d3.select('#' + parent_id)
      .append('g')
      .attr('id', ['g', filter_type, 'bar'].join('-'))
      .append('text')
      .attr('id', filter_type + '-bar-title')
      .text(title)
  }

  function gen_strength_bar(filter_type) {

    // Add background bar
    d3.select('#g-strength-bar')
      .append('rect')
      .attr('id', 'filter-bar-background-' + filter_type)
      .attr('class', 'filter-bar-background filter-bar-rect')
      .style('width', filter_bar_length)

    // Add front bar
    d3.select('#g-strength-bar')
      .append('rect')
      .attr('id', 'filter-bar-front-' + filter_type)
      .attr('class', 'filter-bar-front filter-bar-rect')
      .style('width', bar_length_scale['val_to_len'](default_val))

    // Add circle
    d3.select('#g-strength-bar')
      .append('circle')
      .attr('id', 'filter-bar-circle-' + filter_type)
      .attr('class', 'filter-bar-circle')
      .style('cx', 20)
      .style('cx', bar_length_scale['val_to_len'](default_val))
      .on('mouseover', function(){ this.style.cursor = 'pointer'})
      .call(gen_control_circle_drag())

    // Add value text
    d3.select('#g-strength-bar')
      .append('text')
      .attr('id', 'filter-bar-text-' + filter_type)
      .attr('class', 'filter-bar-text')
      .text(selected_attack_info['attack_strength'])

  }

  function gen_control_circle_drag() {
    var control_drag = d3
      .drag()
      .on('start', function() { circle_drag_start() })
      .on('drag', function() { circle_drag_ing() })
      .on('end', function() { circle_drag_end() })

    return control_drag

    function circle_drag_start() { 
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
  
      // Update the selected value
      if (filter_type == 'strength') {
        selected_attack_info['attack_strength'] = strength_bar_scale[selected_attack_info['attack_type']]['len_to_val'](mouse_x)
        selected_attack_info['attack_strength'] = round_unit(selected_attack_info['attack_strength'], domain_unit)
        d3.select('#filter-bar-text-' + filter_type).text(selected_attack_info['attack_strength']) 
      } 
        
      // Position the circle and the front bar
      d3.select('#filter-bar-circle-' + filter_type).style('cx', mouse_x)
      d3.select('#filter-bar-front-' + filter_type).style('width', mouse_x)
  
      // Update attribution graph
      if (filter_type == 'strength') {
        update_node_opacity()
        update_scatter_circle()
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

}

function round_unit(n, unit) {
  // Round by a specific unit
  var new_unit = 1 / unit
  return Math.round(n * new_unit) / new_unit;
}
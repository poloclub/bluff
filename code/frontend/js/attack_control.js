//////////////////////////////////////////////////////////////////////////////////////////
// Import variables and functions
//////////////////////////////////////////////////////////////////////////////////////////

import { 
  attack_types,
  attack_strengths, 
  attack_default_strengths,
  filter_bar_length
} from './constant.js';

import {
  icons
} from './style.js'

// import { 
//   update_neurons_with_new_strength,
//   update_neurons_with_new_vulnerability 
// } from './attribution_graph.js';

//////////////////////////////////////////////////////////////////////////////////////////
// Global variables
//////////////////////////////////////////////////////////////////////////////////////////

export var selected_attack_info = {
  'attack_type': 'pgd',
  'attack_strength': 0.1
}

//////////////////////////////////////////////////////////////////////////////////////////
// Generate attack options
//////////////////////////////////////////////////////////////////////////////////////////

write_attack_option_title('How to manipulate')
gen_attack_dropdown()
gen_filter_bar('strength')

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

function gen_filter_bar(filter_type) {
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
    // TODO: get the domain of the bar
    d3.select('#g-strength-bar')
      .append('rect')
      .attr('id', 'filter-bar-front-' + filter_type)
      .attr('class', 'filter-bar-front filter-bar-rect')
      .style('width', 20)
      // .style('width', domain_to_bar(default_val))

    // Add circle
    // TODO: get the domain of the bar and make it draggable
    d3.select('#g-strength-bar')
      .append('circle')
      .attr('id', 'filter-bar-circle-' + filter_type)
      .attr('class', 'filter-bar-circle')
      .style('cx', 20)
      // .style('cx', domain_to_bar(default_val))
      .on('mouseover', function(){ this.style.cursor = 'pointer'})
      // .call(gen_control_circle_drag())

    // Add value text
    // TODO: Don't use the fixed text
    d3.select('#g-strength-bar')
      .append('text')
      .attr('id', 'filter-bar-text-' + filter_type)
      .attr('class', 'filter-bar-text')
      .text(attack_default_strengths['pgd'])

  }

}


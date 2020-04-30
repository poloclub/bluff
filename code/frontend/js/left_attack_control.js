//////////////////////////////////////////////////////////////////////////////////////////
// Import variables and functions
//////////////////////////////////////////////////////////////////////////////////////////

import { 
  attack_types,
  attack_strengths, 
} from './constant.js';

import {
  icons,
  how_to_attack,
  filter_bar
} from './style.js'

import { 
  update_node_opacity,
  update_scatter_circle,
  update_edges_display,
  reload_graph
} from './attribution_graph.js';

//////////////////////////////////////////////////////////////////////////////////////////
// Global variables
//////////////////////////////////////////////////////////////////////////////////////////

export var selected_attack_info = {
  'attack_type': 'pgd',
  'attack_strength': 0.1
}

var strength_bar_scale = {}

// TODO move this to style.js
var bg_color = '#fafafa'

//////////////////////////////////////////////////////////////////////////////////////////
// Generate attack options
//////////////////////////////////////////////////////////////////////////////////////////

write_attack_option_title('ADVERSARIAL ATTACK')
strength_bar_scale = gen_strength_bar_length_scale(filter_bar['bar_length'])
gen_filter_bar(
  'strength', 
  strength_bar_scale[selected_attack_info['attack_type']], 
  selected_attack_info['attack_strength'],
  attack_strengths[selected_attack_info['attack_type']]
)
gen_attack_dropdown()

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
  create_dropdown_title('Method')
  create_dropdown_menu()
  gen_option_box()

  function create_dropdown_title(title) {
    d3.select('#svg-attack-option')
      .append('g')
      .attr('id', 'g-attack-type')
      .on('click', function() { click_attack_option() })
      .on('mouseover', function() { this.style.cursor = 'pointer'})

  }

  function create_dropdown_menu() {
    // Generate dropdown box
    d3.select('#g-attack-type')
      .append('rect')
      .attr('id', 'attack-dropdown-box')

    // Append dropdown icon
    d3.select('#g-attack-type')
      .append('text')
      .attr('id', 'attack-dropdown-icon')
      .attr('font-family', 'FontAwesome')
      .text(icons['caret-down'])
      .attr('transform', 'translate(' + how_to_attack['method-icon-x'] + ',' + how_to_attack['method-val-y'] + ')')

    // Append horizontal line
    d3.select('#g-attack-type')
      .append('line')
      .attr('id', 'attack-dropdown-line')
      .attr('x1', 0)
      .attr('x2', how_to_attack['method-line-x'])
      .attr('y1', how_to_attack['method-line-y'])
      .attr('y2', how_to_attack['method-line-y'])
      .attr('stroke', 'gray')
    // Append selection text
    // TODO: Currently only PGD shown
    d3.select('#g-attack-type')
      .append('text')
      .attr('id', 'attack-dropdown-text')
      .text('PGD')
      .attr('transform', 'translate(0,' + how_to_attack['method-val-y'] + ')')
  }

  function gen_option_box() {
    // Generate option box
    d3.select('#svg-attack-option')
      .append('g')
      .attr('id', 'g-attack-dropdown')
      .style('display', 'none')
      
    d3.select('#g-attack-dropdown')
      .append('rect')
      .attr('id', 'g-attack-dropdown-bg')
        
    // PGD
    d3.select('#g-attack-dropdown')
      .append('g')
      .attr('id', 'g-pgd')
      .on('mouseover', function () { mouseover_item('pgd') })
      .on('click', function () { click_item('pgd') })
      
    d3.select('#g-pgd')
      .append('rect')
      .attr('id', 'bg-pgd')
      .attr('class', 'attack-option-rect')

    d3.select('#g-pgd')
      .append('text')
      .attr('id', 'text-pgd')
      .attr('class', 'attack-option-text')
      .text('PGD')

    // FGSM
    d3.select('#g-attack-dropdown')
      .append('g')
      .attr('id', 'g-fgsm')
      .on('mouseover', function () { mouseover_item('fgsm') })
      .on('click', function () { click_item('fgsm') })
      
    d3.select('#g-fgsm')
      .append('rect')
      .attr('id', 'bg-fgsm')
      .attr('class', 'attack-option-rect')

    d3.select('#g-fgsm')
      .append('text')
      .attr('id', 'text-fgsm')
      .attr('class', 'attack-option-text')
      .text('FGSM')
  
  }

  function mouseover_item(method) {
    d3.selectAll('.attack-option-rect').style('fill', bg_color)
    d3.select('#bg-' + method).style('fill', 'lightgray').style('cursor', 'pointer')
  }

  function click_item(method) {
    d3.select('#attack-dropdown-text').text(method.toUpperCase())
    selected_attack_info['attack_type'] = method
    d3.select('#g-attack-dropdown').style('display', 'none')
    reload_graph()
  }

  function click_attack_option() {
    var display_setting = d3.select('#g-attack-dropdown').style('display')
    if (display_setting == 'none') {
      d3.select('#g-attack-dropdown').style('display', 'block')
    } else {
      d3.select('#g-attack-dropdown').style('display', 'none')
    }
    
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
// Attack strength bar
//////////////////////////////////////////////////////////////////////////////////////////
export function gen_strength_bar_length_scale(bar_len) {
  var strength_bar_scale = {}

  attack_types.forEach(attack_type => {
    strength_bar_scale[attack_type] = {}

    var max_domain_val = d3.max(attack_strengths[attack_type])
    var domain_to_front_bar_length = d3
      .scaleLinear()
      .domain([0, max_domain_val])
      .range([0, bar_len]) 
    var front_bar_length_to_domain = d3
      .scaleLinear()
      .domain([0, bar_len]) 
      .range([0, max_domain_val])
    strength_bar_scale[attack_type]['val_to_len'] = domain_to_front_bar_length
    strength_bar_scale[attack_type]['len_to_val'] = front_bar_length_to_domain
  })

  return strength_bar_scale
}

function gen_filter_bar(filter_type, bar_length_scale, default_val, domains) {
  create_filter_bar_title('Strength', filter_type)
  gen_bar(filter_type)

  function create_filter_bar_title(title, filter_type) {
    var parent_id = ''
    if (filter_type == 'strength') {
      parent_id = 'svg-attack-option'
    }

    d3.select('#' + parent_id)
      .append('g')
      .attr('id', ['g', filter_type, 'bar'].join('-'))
      .append('text')
      .attr('id', filter_type + '-bar-title')
      .text(title + ':')
  }

  function gen_bar(filter_type) {

    // Add background bar
    d3.select('#g-' + filter_type + '-bar')
      .append('rect')
      .attr('id', 'filter-bar-background-' + filter_type)
      .attr('class', 'filter-bar-background filter-bar-rect')
      .attr('width', filter_bar['bar_length'])

    // Add front bar
    d3.select('#g-' + filter_type + '-bar')
      .append('rect')
      .attr('id', 'filter-bar-front-' + filter_type)
      .attr('class', 'filter-bar-front filter-bar-rect')
      .attr('width', bar_length_scale['val_to_len'](default_val))

    // Add circle
    d3.select('#g-' + filter_type + '-bar')
      .append('circle')
      .attr('id', 'filter-bar-circle-' + filter_type)
      .attr('class', 'filter-bar-circle')
      .attr('cx', bar_length_scale['val_to_len'](default_val))
      .on('mouseover', function(){ circle_mouseover() })
      .call(gen_control_circle_drag())

    // Add value text
    d3.select('#g-' + filter_type + '-bar')
      .append('text')
      .attr('id', 'filter-bar-text-' + filter_type)
      .attr('class', 'filter-bar-text')
      .text(selected_attack_info['attack_strength'])

  }

  function circle_mouseover() {
    var is_disabled = d3.select('#g-' + filter_type + '-bar').attr('class')
    if (is_disabled) {
      is_disabled = is_disabled.includes('disabled')
    }
    if (is_disabled) {
      d3.select('#filter-bar-circle-' + filter_type).style('cursor', 'default')
    } else {
      d3.select('#filter-bar-circle-' + filter_type).style('cursor', 'pointer')
    }
  }

  function gen_control_circle_drag() {
    var control_drag = d3
      .drag()
      .on('start', function() { circle_drag_start() })
      .on('drag', function() { circle_drag_ing() })
      .on('end', function() { circle_drag_end() })

    return control_drag

    function circle_drag_start() { 
      var is_disabled = d3.select('#g-' + filter_type + '-bar').attr('class')
      if (is_disabled) {
        is_disabled = is_disabled.includes('disabled')
      }
      if (!is_disabled) {
        d3.select('#filter-bar-circle-' + filter_type)
          .style('fill', 'gray')
          .style('stroke', 'none')
      }
    }

    function circle_drag_ing() {
      var is_disabled = d3.select('#g-' + filter_type + '-bar').attr('class')
      if (is_disabled) {
        is_disabled = is_disabled.includes('disabled')
      }
      if (!is_disabled) {
        // Get the position of the circle and the front bar
        var mouse_x = d3.mouse(document.getElementById('filter-bar-circle-' + filter_type))[0]
        mouse_x = d3.min([d3.max([0, mouse_x]), filter_bar['bar_length']])
    
        var max_domain_val = d3.max(domains)
        var domain_unit = max_domain_val / domains.length
    
        // Update the selected value
        if (filter_type == 'strength') {
          selected_attack_info['attack_strength'] = strength_bar_scale[selected_attack_info['attack_type']]['len_to_val'](mouse_x)
          selected_attack_info['attack_strength'] = round_unit(selected_attack_info['attack_strength'], domain_unit)
          d3.select('#filter-bar-text-' + filter_type).text(selected_attack_info['attack_strength']) 
        } 
          
        // Position the circle and the front bar
        d3.select('#filter-bar-circle-' + filter_type).attr('cx', mouse_x)
        d3.select('#filter-bar-front-' + filter_type).attr('width', mouse_x)
    
        // Update attribution graph
        if (filter_type == 'strength') {
          update_node_opacity()
          update_scatter_circle()
          update_edges_display()
        } 
      }      
    }

    function circle_drag_end() {
      var is_disabled = d3.select('#g-' + filter_type + '-bar').attr('class')
      if (is_disabled) {
        is_disabled = is_disabled.includes('disabled')
      }
      if (!is_disabled) {
        // Update the circle's color 
        d3.select('#filter-bar-circle-' + filter_type)
          .style('fill', 'white')
          .style('stroke', 'gray')

        // Get the position of the circle and the front bar
        var mouse_x = d3.mouse(document.getElementById('filter-bar-circle-' + filter_type))[0]
        mouse_x = d3.min([d3.max([0, mouse_x]), filter_bar['bar_length']])

        // Sticky movement
        var bar_length_unit = filter_bar['bar_length'] / domains.length
        mouse_x = round_unit(mouse_x, bar_length_unit)
        d3.select('#filter-bar-circle-' + filter_type).style('cx', mouse_x)
        d3.select('#filter-bar-front-' + filter_type).style('width', mouse_x)
      }
    }
  }

}

export function round_unit(n, unit) {
  // Round by a specific unit
  var new_unit = 1 / unit
  return Math.round(n * new_unit) / new_unit;
}
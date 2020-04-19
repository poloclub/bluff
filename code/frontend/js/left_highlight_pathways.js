import {
  what_to_see, 
  highlight_pathways_style,
  icons,
  filter_bar
} from './style.js'

import {
  round_unit
} from './left_attack_control.js'

import {
  update_node_opacity,
  update_graph_by_filter_graph,
  go_comparison_mode,
  update_edges_display
} from './attribution_graph.js'

import {
  gen_pathways_option_g,
  write_mode_option_title,
  filter_pathways
} from './left_filter_pathways.js'


//////////////////////////////////////////////////////////////////////////////////////////
// Global variables
//////////////////////////////////////////////////////////////////////////////////////////

export var highlight_pathways = {
  'neurons': {
    'selected': 'activated',
    'top-k': 20
  },
  'connections': {
    'selected': 'activated',
    'top-k': 30
  } 
}

var domains = Array.from(Array(20).keys()).map(x => x * 5 + 5)
var bar_length_scale = d3
  .scaleLinear()
  .domain([0, d3.max(domains)])
  .range([0, filter_bar['bar_length']])
var domain_scale = d3
  .scaleLinear()
  .domain([0, filter_bar['bar_length']])
  .range([0, d3.max(domains)])

//////////////////////////////////////////////////////////////////////////////////////////
// Highlight pathways
//////////////////////////////////////////////////////////////////////////////////////////

gen_highlight_option_g()
write_text('highlight-option-text-1', 'g-highlight-mode', 'Highlight pathways most')
gen_dropdown('what', 'g-highlight-mode', highlight_pathways_style)
write_text('highlight-option-text-2', 'g-highlight-mode', 'by attack.')

write_text('highlight-option-neurons-text-1', 'g-highlight-neurons', 'Neurons: top')
write_text('topk-neurons', 'g-highlight-neurons', highlight_pathways['neurons']['top-k'])
write_text('highlight-option-neurons-text-2', 'g-highlight-neurons', '% in each layer')
gen_slider('topk-neurons', 'g-highlight-neurons', filter_bar)

write_text('highlight-option-connections-text-1', 'g-highlight-connections', 'Connections: top')
write_text('topk-connections', 'g-highlight-connections', highlight_pathways['connections']['top-k'])
write_text('highlight-option-connections-text-2', 'g-highlight-connections', '%')
gen_slider('topk-connections', 'g-highlight-connections', filter_bar)


//////////////////////////////////////////////////////////////////////////////////////////
// Functions
//////////////////////////////////////////////////////////////////////////////////////////

function gen_highlight_option_g() {
  d3.select('#svg-highlight-option')
    .append('g')
    .attr('id', 'g-highlight-option')

  write_mode_option_title('highlight', 'HIGHLIGHT PATHWAYS')

  d3.select('#g-highlight-option')
    .append('g')
    .attr('id', 'g-highlight-option-contents')

  d3.select('#g-highlight-option-contents')
    .append('g')
    .attr('id', 'g-highlight-mode')

  d3.select('#g-highlight-option-contents')
    .append('g')
    .attr('id', 'g-highlight-neurons')
  
  d3.select('#g-highlight-option-contents')
    .append('g')
    .attr('id', 'g-highlight-connections')
}

function write_text(id, parent_id, text, c) {
  d3.select('#' + parent_id)
    .append('text')
    .attr('id', id)
    .attr('class', c)
    .text(text)
}

function gen_dropdown(group_id, parent_id, styler) {
  d3.select('#' + parent_id)
    .append('g')
    .attr('id', 'highlight-option-' + group_id)
    .attr('transform', dropdown_translate(group_id, styler))
    .on('mouseover', function() { mouseover_dropdown(group_id) })
    .on('click', function() { click_dropdown(group_id) })

  gen_dropdown_bg_rect(group_id)
  gen_dropdown_line(group_id)
  gen_dropdown_text(group_id)
  gen_dropdown_icon(group_id)
  gen_dropdown_menu(group_id)

  function dropdown_translate(group_id, styler) {
    // TODO: Need to be correct when generalized
    var x = styler[group_id + '-x']
    var y = styler[group_id + '-y']
    return 'translate(' + x + ',' + y + ')'
  }

  function gen_dropdown_bg_rect(group_id) {
    d3.select('#highlight-option-' + group_id)
      .append('rect')
      .attr('id', 'highlight-option-' + group_id + '-rect')
      .attr('class', 'highlight-dropdown-rect')
      .attr('width', styler[group_id + '-rect-width'])
      .attr('height', styler[group_id + '-rect-height'])
  }

  function gen_dropdown_line(group_id) {
    d3.select('#highlight-option-' + group_id)
      .append('line')
      .attr('id', 'highlight-option-' + group_id + '-line')
      .attr('class', 'highlight-dropdown-line')
      .attr('x1', 0)
      .attr('x2', styler[group_id + '-rect-width'])
      .attr('y1', styler['line-y'])
      .attr('y2', styler['line-y'])
  }

  function gen_dropdown_text(group_id) {
    // TODO: Can be generalized later
    d3.select('#highlight-option-' + group_id)
      .append('text')
      .attr('id', 'highlight-option-' + group_id + '-text')
      .attr('class', 'highlight-dropdown-text')
      .text(highlight_pathways['neurons']['selected'])
  }

  function gen_dropdown_icon(group_id) {
    d3.select('#highlight-option-' + group_id)
      .append('text')
      .attr('id', 'highlight-option-' + group_id + '-icon')
      .attr('class', 'highlight-dropdown-icon')
      .attr('font-family', 'FontAwesome')
      .text(icons['caret-down'])
      .attr('x', highlight_pathways_style[group_id + '-icon-x'])
  }

  function gen_dropdown_menu(group_id) {
    // Setting
    gen_basic_bg(4)

    // Add activated
    add_item(0, 'activated', 'highlight-option-' + group_id)

    // Add changed
    add_item(1, 'changed', 'highlight-option-' + group_id)

    // Add excited
    add_item(2, 'excited', 'highlight-option-' + group_id)

    // Add inhibited
    add_item(3, 'inhibited', 'highlight-option-' + group_id)
    
    // Functions
    function gen_basic_bg(num_item) {
      d3.select('#g-highlight-option-contents')
        .append('g')
        .attr('id', 'g-dropdown-' + group_id)
        .attr('transform', g_dropdown_menu_transform())
        .style('display', 'none')

      d3.select('#g-dropdown-' + group_id) 
        .append('rect')
        .attr('id', 'dropdown-' + group_id + '-rect')
        .attr('class', 'dropdown-menu-bg-rect dropdown-menu-bg-rect-' + group_id)
        .attr('width', highlight_pathways_style[group_id + '-rect-width'])
        .attr('height', g_dropdown_menu_height(num_item))
        
      function g_dropdown_menu_transform() {
        // TODO: Need to be correct when generalized
        var x = styler[group_id + '-x']
        var y = styler[group_id + '-y'] + styler['menu-y']
        return 'translate(' + x + ',' + y + ')'
      }

      function g_dropdown_menu_height(num_item) {
        // TODO: Need to be correct when generalized
        return styler['menu-top-padding'] + num_item * styler['menu-height'] + styler['menu-bottom-padding']
      }
    }

    function add_item(i, item, dropdown_id) {
      d3.select('#g-dropdown-' + group_id)
        .append('g')
        .attr('id', 'g-dropdown-menu-' + group_id + '-' + item)
        .on('mouseover', function() { mouseover_item() })
        .on('click', function() { click_item() })
        .attr('transform', g_item_transform(i))
      
      gen_item_rect()
      gen_item_text()
      
      function g_item_transform(i) {
        var x = 0
        var y = styler['menu-top-padding'] + i * styler['menu-height']
        return 'translate(' + x + ',' + y + ')'
      }

      function gen_item_rect() {
        d3.select('#g-dropdown-menu-' + group_id + '-' + item)
          .append('rect')
          .attr('id', gen_item_component_id('rect'))
          .attr('class', gen_item_component_class('rect'))
          .attr('width', highlight_pathways_style['what-rect-width'])
          .attr('height', highlight_pathways_style['dropdown-menu-rect-height'])
      }

      function gen_item_text() {
        d3.select('#g-dropdown-menu-' + group_id + '-' + item)
          .append('text')
          .attr('id', gen_item_component_id('text'))
          .attr('class', gen_item_component_class('text'))
          .text(item)
      }

      function gen_item_component_class(component) {
        var c1 = 'dropdown-item-' + component
        var c2 = c1 + '-' + group_id
        return [c1, c2].join(' ')
      }

      function gen_item_component_id(component) {
        return ['dropdown-item', group_id, item, component].join('-')
      }

      function mouseover_item() {
        d3.select('#g-dropdown-menu-' + group_id + '-' + item).style('cursor', 'pointer')
        d3.selectAll('.dropdown-item-rect-' + group_id).style('fill', 'white')
        d3.select('#' + gen_item_component_id('rect')).style('fill', 'lightgray')
      }

      function click_item() {
        d3.select('#highlight-option-' + group_id + '-text').text(item)
        d3.select('#g-dropdown-' + group_id).style('display', 'none')
        highlight_pathways['neurons']['selected'] = item
        highlight_pathways['connections']['selected'] = item
        update_node_opacity()
        update_edges_display()
      }
    }
    
  }

  function mouseover_dropdown(group_id) {
    var is_disabled = d3.select('#g-highlight-option-contents').attr('class')
    if (is_disabled) {
      is_disabled = is_disabled.includes('disabled')
    }
    if (!is_disabled) {
      d3.select('#highlight-option-' + group_id).style('cursor', 'pointer')
    }
  }

  function click_dropdown(group_id) {
    var is_disabled = d3.select('#g-highlight-option-contents').attr('class')
    if (is_disabled) {
      is_disabled = is_disabled.includes('disabled')
    }
    if (!is_disabled) {
      d3.select('#g-highlight-option-' + group_id).style('cursor', 'pointer')
      toggle_display_element('g-dropdown-' + group_id)
    }
  }
}

function gen_slider(group_id, parent_id, styler) {
  // TODO: Need to be generalized
  gen_g_slider()
  gen_background_bar()
  gen_front_bar()
  gen_circle()

  function gen_g_slider() {
    d3.select('#' + parent_id)
      .append('g')
      .attr('id', slider_id('g'))
  }

  function slider_id(name) {
    if (name == 'g') {
      return 'g-slider-' + group_id
    } else if (name == 'background-rect') {
      return 'filter-bar-background-' + group_id
    } else if (name == 'front-rect') {
      return 'filter-bar-front-' + group_id
    } else if (name == 'circle') {
      return 'filter-bar-circle-' + group_id
    }
  }

  function gen_background_bar() {
    d3.select('#' + slider_id('g'))
      .append('rect')
      .attr('id', slider_id('background-rect'))
      .attr('class', 'filter-bar-background filter-bar-rect')
      .style('width', styler['bar_length'])

  }

  function gen_front_bar() {
    // TODO: Need to be generalized
    var group_type = group_id.split('-')[1]
    d3.select('#' + slider_id('g'))
      .append('rect')
      .attr('id', slider_id('front-rect'))
      .attr('class', 'filter-bar-front filter-bar-rect')
      .style('width', bar_length_scale(highlight_pathways[group_type]['top-k']))
  }

  function gen_circle() {
    // TODO: Need to be generalized
    var group_type = group_id.split('-')[1]
    d3.select('#' + slider_id('g'))
      .append('circle')
      .attr('id', slider_id('circle'))
      .attr('class', 'filter-bar-circle')
      .style('cx', bar_length_scale(highlight_pathways[group_type]['top-k']))
      .on('mouseover', function() { mouseover_circle() })
      .call(circle_drag())
  }

  function mouseover_circle() {
    var is_disabled = d3.select('#g-highlight-option-contents').attr('class')
    if (is_disabled) {
      is_disabled = is_disabled.includes('disabled')
    }
    if (is_disabled) {
      d3.select('#' + slider_id('circle')).style('cursor', 'default')
    } else {
      d3.select('#' + slider_id('circle')).style('cursor', 'pointer')
    }
  }

  function circle_drag() {
    var control_drag = d3
      .drag()
      .on('start', function() { circle_drag_start() })
      .on('drag', function() { circle_drag_ing() })
      .on('end', function() { circle_drag_end() })

    return control_drag

    function circle_drag_start() { 
      var is_disabled = d3.select('#g-highlight-option-contents').attr('class')
      if (is_disabled) {
        is_disabled = is_disabled.includes('disabled')
      }
      if (!is_disabled) {
        d3.select('#' + slider_id('circle'))
          .style('fill', 'gray')
          .style('stroke', 'none')
      }
    }

    function circle_drag_ing() {
      var is_disabled = d3.select('#g-highlight-option-contents').attr('class')
      if (is_disabled) {
        is_disabled = is_disabled.includes('disabled')
      }
      if (!is_disabled) {
        // Get the position of the circle and the front bar
        var mouse_x = d3.mouse(document.getElementById(slider_id('circle')))[0]
        mouse_x = d3.min([d3.max([0, mouse_x]), styler['bar_length']])
    
        var max_domain_val = d3.max(domains)
        var domain_unit = max_domain_val / domains.length
    
        // Update the selected value
        // TODO: Need to be generalized
        var group_type = group_id.split('-')[1]
        var topk_val = round_unit(domain_scale(mouse_x), domain_unit)
        highlight_pathways[group_type]['top-k'] = topk_val
        d3.select('#' + group_id).text(topk_val)

        // Position the circle and the front bar
        d3.select('#' + slider_id('circle')).style('cx', mouse_x)
        d3.select('#' + slider_id('front-rect')).style('width', mouse_x)
    
        // Update attribution graph
        update_node_opacity()
        update_edges_display()
      }
    }

    function circle_drag_end() {
      var is_disabled = d3.select('#g-highlight-option-contents').attr('class')
      if (is_disabled) {
        is_disabled = is_disabled.includes('disabled')
      }
      if (!is_disabled) {
        // Update the circle's color 
        d3.select('#' + slider_id('circle'))
          .style('fill', 'white')
          .style('stroke', 'gray')
    
        // Get the position of the circle and the front bar
        var mouse_x = d3.mouse(document.getElementById(slider_id('circle')))[0]
        mouse_x = d3.min([d3.max([0, mouse_x]), styler['bar_length']])
    
        // Sticky movement
        var bar_length_unit = styler['bar_length'] / domains.length
        mouse_x = round_unit(mouse_x, bar_length_unit)
        d3.select('#' + slider_id('circle')).style('cx', mouse_x)
        d3.select('#' + slider_id('front-rect')).style('width', mouse_x)
      }
    }
  }
}

function toggle_display_element(id) {
  var element = document.getElementById(id)
  var display = element.style.display
  if (display == 'none') {
    element.style.display = 'block'
  } else {
    element.style.display = 'none'
  }
}


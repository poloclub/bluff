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

var domains = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
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
write_text('highlight-option-text-1', 'g-highlight-mode', 'Highlight most')
gen_dropdown('what', 'g-highlight-mode', highlight_pathways_style)
write_text('highlight-option-text-2', 'g-highlight-mode', 'pathways by attack.')

write_text('highlight-option-neurons-text-1', 'g-highlight-neurons', 'Neurons: top')
write_text('topk-neurons', 'g-highlight-neurons', highlight_pathways['neurons']['top-k'])
write_text('highlight-option-neurons-text-2', 'g-highlight-neurons', '% in each layer')
gen_slider('topk-neurons', 'g-highlight-neurons', filter_bar)

write_text('highlight-option-connections-text-1', 'g-highlight-connections', 'Connections: top')
write_text('topk-connections', 'g-highlight-connections', highlight_pathways['connections']['top-k'])
write_text('highlight-option-connections-text-2', 'g-highlight-connections', '%')
gen_slider('topk-connections', 'g-highlight-connections', filter_bar)

// write_highlight_neurons()
// write_highlight_connections()
// gen_pathways_option_g('highlight')
// add_what_to_highlight_options('highlight', 'what', 'What to Highlight')
// add_how_many_to_highlight_options('highlight', 'many', 'How many to Highlight')
// add_how_many_to_highlight_options('connections')
// update_highlight_bottons('neurons')
// update_highlight_bottons('connections')

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
    d3.select('#highlight-option-' + group_id).style('cursor', 'pointer')
  }

  function click_dropdown(group_id) {
    d3.select('#g-highlight-option-' + group_id).style('cursor', 'pointer')
    toggle_display_element('g-dropdown-' + group_id)
  }
}

function gen_slider(group_id, parent_id, styler) {
  // XXXXXXXXXXXXXXXXXXX
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
      .on('mouseover', function(){ this.style.cursor = 'pointer'})
      .call(circle_drag())
  }

  function circle_drag() {
    var control_drag = d3
      .drag()
      .on('start', function() { circle_drag_start() })
      .on('drag', function() { circle_drag_ing() })
      .on('end', function() { circle_drag_end() })

    return control_drag

    function circle_drag_start() { 
      d3.select('#' + slider_id('circle'))
        .style('fill', 'gray')
        .style('stroke', 'none')
    }

    function circle_drag_ing() {
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

    function circle_drag_end() {

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




function write_highlight_neurons() {
  

  // 
  
  function write_text(id, text, c) {
    d3.select('#g-highlight-neurons')
      .append('text')
      .attr('id', id)
      .attr('class', c)
      .text(text)
  }

  function gen_topk_neurons_dropdown() {
    d3.select('#g-highlight-neurons')
      .append('g')
      .attr('id', 'highlight-option-k-neurons')

    d3.select('#highlight-option-k-neurons')
      .append('rect')
      .attr('id', 'highlight-option-k-neurons-rect')
      .attr('class', 'highlight-dropdown-rect')
      .attr('width', highlight_pathways_style['neurons-k-rect-width'])
      .attr('height', highlight_pathways_style['neurons-k-rect-height'])

    d3.select('#highlight-option-k-neurons')
      .append('line')
      .attr('id', 'highlight-option-k-neurons-line')
      .attr('class', 'highlight-dropdown-line')
      .attr('x1', 0)
      .attr('x2', highlight_pathways_style['neurons-k-rect-width'])
      .attr('y1', highlight_pathways_style['neurons-k-line-y'])
      .attr('y2', highlight_pathways_style['neurons-k-line-y'])

    d3.select('#highlight-option-k-neurons')
      .append('text')
      .attr('id', 'highlight-option-k-neurons-text')
      .attr('class', 'highlight-dropdown-text')
      .text(highlight_pathways['neurons']['top-k'])
    
    d3.select('#highlight-option-k-neurons')
      .append('text')
      .attr('id', 'highlight-option-k-neurons-icon')
      .attr('class', 'highlight-dropdown-icon')
      .attr('font-family', 'FontAwesome')
      .text(icons['caret-down'])
      .attr('x', highlight_pathways_style['neurons-k-icon-x'])

  }

}


function write_highlight_connections() {
  // What connections
  write_text('highlight-option-text-7', 'Out of all connections among such')
  write_text('highlight-option-text-8', 'neurons, highlight')
  gen_topk_connections_dropdown()
  write_text('highlight-option-text-9', '% of most')
  gen_most_what_connections_dropdown()
  write_text('highlight-option-text-10', 'connections by attack.')
  
  // Most changed connections
  write_text('highlight-option-text-11', 'Specifically, most', 'most-changed-connections')
  gen_most_changed_connections_dropdown('most-changed-connections')
  write_text('highlight-option-text-12', 'ones.', 'most-changed-connections')
  d3.selectAll('.most-changed-connections').style('display', 'none')

  function gen_topk_connections_dropdown() {
    d3.select('#g-highlight-connections')
      .append('g')
      .attr('id', 'highlight-option-k-connections')

    d3.select('#highlight-option-k-connections')
      .append('rect')
      .attr('id', 'highlight-option-k-connections-rect')
      .attr('class', 'highlight-dropdown-rect')
      .attr('width', highlight_pathways_style['connections-k-rect-width'])
      .attr('height', highlight_pathways_style['connections-k-rect-height'])

    d3.select('#highlight-option-k-connections')
      .append('line')
      .attr('id', 'highlight-option-k-connections-line')
      .attr('class', 'highlight-dropdown-line')
      .attr('x1', 0)
      .attr('x2', highlight_pathways_style['connections-k-rect-width'])
      .attr('y1', highlight_pathways_style['connections-k-line-y'])
      .attr('y2', highlight_pathways_style['connections-k-line-y'])

    d3.select('#highlight-option-k-connections')
      .append('text')
      .attr('id', 'highlight-option-k-connections-text')
      .attr('class', 'highlight-dropdown-text')
      .text(highlight_pathways['connections']['top-k'])
    
    d3.select('#highlight-option-k-connections')
      .append('text')
      .attr('id', 'highlight-option-k-connections-icon')
      .attr('class', 'highlight-dropdown-icon')
      .attr('font-family', 'FontAwesome')
      .text(icons['caret-down'])
      .attr('x', highlight_pathways_style['connections-k-icon-x'])

  }

  function gen_most_what_connections_dropdown() {
    gen_most_what_connections_g()
    gen_most_what_connections_rect()
    gen_most_what_connections_line()
    gen_most_what_connections_text()
    gen_most_what_connectinos_icon()
    gen_dropdown_menu()

    function gen_most_what_connections_g() {
      d3.select('#g-highlight-connections')
        .append('g')
        .attr('id', 'highlight-option-what-connections')
        .on('mouseover', function() { this.style.cursor = 'pointer' })
        .on('click', function() { click_most_what_connections() })
    }

    function gen_most_what_connections_rect() {
      d3.select('#highlight-option-what-connections')
        .append('rect')
        .attr('id', 'highlight-option-what-connections-rect')
        .attr('class', 'highlight-dropdown-rect')
        .attr('width', highlight_pathways_style['connections-what-rect-width'])
        .attr('height', highlight_pathways_style['connections-what-rect-height'])
    }

    function gen_most_what_connections_line() {
      d3.select('#highlight-option-what-connections')
        .append('line')
        .attr('id', 'highlight-option-what-connections-line')
        .attr('class', 'highlight-dropdown-line')
        .attr('x1', 0)
        .attr('x2', highlight_pathways_style['connections-what-rect-width'])
        .attr('y1', highlight_pathways_style['connections-what-line-y'])
        .attr('y2', highlight_pathways_style['connections-what-line-y'])
    }

    function gen_most_what_connections_text() {
      d3.select('#highlight-option-what-connections')
        .append('text')
        .attr('id', 'highlight-option-what-connections-text')
        .attr('class', 'highlight-dropdown-text')
        .text(highlight_pathways['connections']['selected'])
    }

    function gen_most_what_connectinos_icon() {
      d3.select('#highlight-option-what-connections')
        .append('text')
        .attr('id', 'highlight-option-what-connections-icon')
        .attr('class', 'highlight-dropdown-icon')
        .attr('font-family', 'FontAwesome')
        .text(icons['caret-down'])
        .attr('x', highlight_pathways_style['connections-what-icon-x'])
    } 

    function gen_dropdown_menu() {
      // Setting
      gen_basic_bg()

      // Add activated
      add_activated_connections()

      // Add changed
      add_changed_connections()

      // Add excited
      add_excited_connections()
      
      // Functions
      function gen_basic_bg() {
        d3.select('#g-highlight-option-contents')
          .append('g')
          .attr('id', 'g-dropdown-what-connections')
          // .style('display', 'none')

        d3.select('#g-dropdown-what-connections') 
          .append('rect')
          .attr('id', 'dropdown-what-connections-rect')
          .attr('class', 'dropdown-menu-bg-rect')
          .attr('width', highlight_pathways_style['connections-what-rect-width'])
          .attr('height', highlight_pathways_style['connections-what-dropdown-bg-rect-height'])
      }

      function add_activated_connections() {
        d3.select('#g-dropdown-what-connections')
          .append('g')
          .attr('id', 'g-dropdown-menu-activated-connections')
          .on('mouseover', function() { mouseover_activated() })
          .on('click', function() { click_activated() })

        d3.select('#g-dropdown-menu-activated-connections')
          .append('rect')
          .attr('id', 'dropdown-menu-rect-activated-connections')
          .attr('class', 'dropdown-item-bg-rect')
          .attr('width', highlight_pathways_style['connections-what-rect-width'])
          .attr('height', highlight_pathways_style['dropdown-menu-rect-height'])

        d3.select('#g-dropdown-menu-activated-connections')
          .append('text')
          .attr('id', 'dropdown-menu-text-activated-connections')
          .attr('class', 'dropdown-item-text')
          .text('activated')
      }

      function add_changed_connections() {
        d3.select('#g-dropdown-what-connections')
          .append('g')
          .attr('id', 'g-dropdown-menu-changed-connections')
          .on('mouseover', function() { mouseover_changed() })
          .on('click', function() { click_changed() })

        d3.select('#g-dropdown-menu-changed-connections')
          .append('rect')
          .attr('id', 'dropdown-menu-rect-changed-connections')
          .attr('class', 'dropdown-item-bg-rect')
          .attr('width', highlight_pathways_style['connections-what-rect-width'])
          .attr('height', highlight_pathways_style['dropdown-menu-rect-height'])

        d3.select('#g-dropdown-menu-changed-connections')
          .append('text')
          .attr('id', 'dropdown-menu-text-changed-connections')
          .attr('class', 'dropdown-item-text')
          .text('changed')
      }

      function add_excited_connections() {
        d3.select('#g-dropdown-what-connections')
          .append('g')
          .attr('id', 'g-dropdown-menu-excited-connections')
          .on('mouseover', function() { mouseover_excited() })
          .on('click', function() { click_excited() })

        d3.select('#g-dropdown-menu-excited-connections')
          .append('rect')
          .attr('id', 'dropdown-menu-rect-excited-connections')
          .attr('class', 'dropdown-item-bg-rect')
          .attr('width', highlight_pathways_style['connections-what-rect-width'])
          .attr('height', highlight_pathways_style['dropdown-menu-rect-height'])

        d3.select('#g-dropdown-menu-excited-connections')
          .append('text')
          .attr('id', 'dropdown-menu-text-excited-connections')
          .attr('class', 'dropdown-item-text')
          .text('excited')
      }

      function mouseover_activated() {
        d3.select('#g-dropdown-menu-activated-connections').style('cursor', 'pointer')
        d3.select('#dropdown-menu-rect-activated-connections').style('fill', 'lightgray')
        d3.select('#dropdown-menu-rect-changed-connections').style('fill', 'white')
      }

      function click_activated() {
        d3.select('#highlight-option-what-connections-text').text('activated')
        d3.select('#g-dropdown-what-connections').style('display', 'none')
        highlight_pathways['connections']['selected'] = 'activated'
        highlight_pathways['connections']['sub-selected'] = '-'
        d3.selectAll('.most-changed-connections').style('display', 'none')
        update_edges_display(highlight_pathways['connections']['top-k'], 'activated')
      }

      function mouseover_changed() {
        d3.select('#g-dropdown-menu-changed-connections').style('cursor', 'pointer')
        d3.select('#dropdown-menu-rect-activated-connections').style('fill', 'white')
        d3.select('#dropdown-menu-rect-changed-connections').style('fill', 'lightgray')
      }

      function click_changed() {
        d3.select('#highlight-option-what-connections-text').text('changed')
        d3.select('#g-dropdown-what-connections').style('display', 'none')
        highlight_pathways['connections']['selected'] = 'changed'
        highlight_pathways['connections']['sub-selected'] = 'excited'
        d3.selectAll('.most-changed-connections').style('display', 'block')
        d3.select('#highlight-option-changed-connections-text').text(highlight_pathways['connections']['sub-selected'])
        update_edges_display(highlight_pathways['connections']['top-k'], 'changed')
      }

      function mouseover_excited() {
        d3.select('#g-dropdown-menu-excited-connections').style('cursor', 'pointer')
        d3.select('#dropdown-menu-rect-excited-connections').style('fill', 'white')
        d3.select('#dropdown-menu-rect-changed-connections').style('fill', 'lightgray')
      }
    }

    function click_most_what_connections() {
      d3.select('#g-highlight-option-what-connections').style('cursor', 'pointer')
      d3.select('#g-dropdown-what-connections').style('display', 'block')
    }
  }

  function gen_most_changed_connections_dropdown(c) {
    d3.select('#g-highlight-connections')
      .append('g')
      .attr('id', 'highlight-option-changed-connections')
      .attr('class', c)

    d3.select('#highlight-option-changed-connections')
      .append('rect')
      .attr('id', 'highlight-option-changed-connections-rect')
      .attr('class', 'highlight-dropdown-rect')
      .attr('width', highlight_pathways_style['connections-changed-rect-width'])
      .attr('height', highlight_pathways_style['connections-changed-rect-height'])

      d3.select('#highlight-option-changed-connections')
      .append('line')
      .attr('id', 'highlight-option-changed-connections-line')
      .attr('class', 'highlight-dropdown-line')
      .attr('x1', 0)
      .attr('x2', highlight_pathways_style['connections-changed-rect-width'])
      .attr('y1', highlight_pathways_style['connections-changed-line-y'])
      .attr('y2', highlight_pathways_style['connections-changed-line-y'])

    d3.select('#highlight-option-changed-connections')
      .append('text')
      .attr('id', 'highlight-option-changed-connections-text')
      .attr('class', 'highlight-dropdown-text')
      .text(highlight_pathways['connections']['sub-selected'])
    
    d3.select('#highlight-option-changed-connections')
      .append('text')
      .attr('id', 'highlight-option-changed-connections-icon')
      .attr('class', 'highlight-dropdown-icon')
      .attr('font-family', 'FontAwesome')
      .text(icons['caret-down'])
      .attr('x', highlight_pathways_style['connections-changed-icon-x'])
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


// function add_what_to_highlight_options(type, subtitle, subtitle_txt) {
  
//   gen_subtitle_g()
//   // draw_subtitle()

//   gen_option_g(['g', type, subtitle].join('-'), type, subtitle, 'most-activated')
//   gen_option_g(['g', type, subtitle].join('-'), type, subtitle, 'most-changed')

//   gen_what_option(type, subtitle, 'most-activated', 'Most activated')
//   gen_what_option(type, subtitle, 'most-changed', 'Most changed by attack')

//   gen_sub_option(type, subtitle, 'most-changed', ['excited', 'inhibited'])

//   // Functions
//   function gen_subtitle_g() {
//     d3.select('#g-' + type + '-option')
//       .append('g')
//       .attr('id', 'g-' + type + '-' + subtitle)
//   }

//   function draw_subtitle() {
//     d3.select('#g-' + type + '-' + subtitle)
//       .append('text')
//       .attr('id', ['option', 'subtitle', type, subtitle].join('-'))
//       .text(subtitle_txt)
//   }

//   function gen_option_g(parent_g_id, type, subtitle, option) { 
//     d3.select('#' + parent_g_id)
//       .append('g')
//       .attr('id', ['g', type, subtitle, option].join('-'))
//       .attr('transform', function() {
//         var x = what_to_see['option-x']
//         var y = what_to_see[option + '-y']
//         return 'translate(' + x + ',' + y + ')'
//       })
//   }

//   function gen_what_option(type, subtitle, what_option, option_txt) {
//     gen_option_botton_rect()
//     gen_option_botton_check_icon()
//     gen_option_text()
  
//     function gen_option_botton_rect() {
//       d3.select('#' + ['g', type, subtitle, what_option].join('-'))
//         .append('rect')
//         .attr('id', ['what-to-see-option-checkbox', subtitle, what_option].join('-'))
//         .attr('class', 'what-to-see-option-checkbox what-to-see-option-checkbox-' + type)
//         .attr('width', what_to_see['bt-width'])
//         .attr('height', what_to_see['bt-height'])
//         .on('mouseover', function() { this.style.cursor = 'pointer' })
//         .on('click', function() { return click_highlight_option(subtitle, what_option) })
//     }
  
//     function gen_option_botton_check_icon() {
//       d3.select('#' + ['g', type, subtitle, what_option].join('-'))
//         .append('text')
//         .attr('id', ['what-to-see-icon', subtitle, what_option].join('-'))
//         .attr('class', 'what-to-see-option-checkbox-icon what-to-see-option-checkbox-icon-' + type + '-' + subtitle)
//         .attr('font-family', 'FontAwesome')
//         .text(icons['check-square'])
//         .attr('x', -0.5)
//         .attr('y', what_to_see[what_option + '-text-y'])
//         .style('display', 'none') 
//         .on('mouseover', function() { this.style.cursor = 'pointer' })
//         .on('click', function() { return click_highlight_option(subtitle, what_option) })
//     }
  
//     function gen_option_text() {
//       console.log('option-text:', option_txt)
//       d3.select('#' + ['g', type, subtitle, what_option].join('-'))
//         .append('text')
//         .text(option_txt)
//         .attr('id', ['what-to-see-option-text', subtitle, what_option].join('-'))
//         .attr('class', 'what-to-see-option-text')
//         .attr('x', what_to_see['option-text-x'])
//         .attr('y', what_to_see[what_option + '-text-y'])
//     }
  
//   }

//   function gen_sub_option(type, subtitle, what_option, suboptions) {
//     gen_suboption_botton_rect()
//     gen_suboption_botton_check_icon()
//     gen_suboption_text()
  
//     function gen_suboption_botton_rect() {
//       d3.select('#' + ['g', type, subtitle, what_option].join('-'))
//         .selectAll('suboptions')
//         .data(suboptions)
//         .enter()
//         .append('rect')  
//         .attr('class', 'what-to-see-option-checkbox what-to-see-option-checkbox-' + type)
//         .attr('width', what_to_see['bt-width'])
//         .attr('height', what_to_see['bt-height'])
//         .attr('x', what_to_see['most-changed-suboption-x'])
//         .attr('y', function(d, i) { 
//           return what_to_see['most-changed-suboption-t'] + i * what_to_see['most-changed-suboption-h'] 
//         })
//         .on('mouseover', function() {this.style.cursor = 'pointer'})
//         .on('click', function(suboption) { return click_sub_option(subtitle, suboption) })
//     }
  
//     function gen_suboption_botton_check_icon() {
//       d3.select('#' + ['g', type, subtitle, what_option].join('-'))
//         .selectAll('suboptions')
//         .data(suboptions)
//         .enter()
//         .append('text')
//         .attr('id', function(suboption) { return ['what-to-see-icon-sub', subtitle, suboption].join('-') })
//         .attr('class', 'what-to-see-option-checkbox-icon what-to-see-option-checkbox-icon-' + type + '-' + subtitle)
//         .attr('font-family', 'FontAwesome')
//         .text(icons['check-square'])
//         .attr('x', what_to_see['most-changed-suboption-x'] - 0.5)
//         .attr('y', function(d, i) { return suboption_text_y(i) - 0.5 })
//         .style('display', 'none')
//         .on('mouseover', function() {this.style.cursor = 'pointer'})
//         .on('click', function(suboption) { return click_sub_option(subtitle, suboption) })
//     }
  
//     function gen_suboption_text() {
//       d3.select('#' + ['g', type, subtitle, what_option].join('-'))
//         .selectAll('suboptions')
//         .data(suboptions)
//         .enter()
//         .append('text')
//         .attr('id', function(suboption) { return ['what-to-see-option-text-sub-', subtitle, suboption].join('-') })
//         .attr('class', 'what-to-see-option-text what-to-see-option-text-' + type)
//         .attr('x', what_to_see['most-changed-suboption-x'] + what_to_see['option-text-x'])
//         .attr('y', function(d, i) { return suboption_text_y(i) })
//         .text(function(d) { return 'Most ' + d })
//     }
  
//     function suboption_text_y(i) {
//       var start_y = what_to_see['most-changed-suboption-t'] + what_to_see[what_option + '-text-y']
//       return start_y + i * what_to_see['most-changed-suboption-h'] 
//     }
//   }

//   function click_sub_option(subtitle, suboption) {
//     highlight_pathways[subtitle]['selected'] = 'most-changed'
//     highlight_pathways[subtitle]['sub-selected'] = suboption
//     update_highlight_bottons(subtitle)
//     update_node_opacity()
//     go_comparison_mode()
//   }
  
//   function click_highlight_option(subtitle, what_option) {
//     highlight_pathways[subtitle]['selected'] = what_option
//     if (what_option == 'most-changed') {
//       highlight_pathways[subtitle]['sub-selected'] = 'excited'
//     } else {
//       highlight_pathways[subtitle]['sub-selected'] = '-'
//     }
//     update_highlight_bottons(subtitle)
//     update_node_opacity()
//   }
 
// }

// function add_how_many_to_highlight_options(type, subtitle, subtitle_txt) {
//   gen_g_how_many()
//   add_neuron_slider()

//   function gen_g_how_many() {
//     d3.select('#g-' + type + '-option')
//       .append('g')
//       .attr('id', ['g', type, subtitle].join('-'))
//   }

//   function add_neuron_slider() {
//     gen_slider_g('neurons')
//     gen_slider_title('neurons')
//   }

//   function gen_slider_g(subject) {
//     d3.select('#' + ['g', type, subtitle].join('-'))
//       .append('g')
//       .attr('id', ['g', type, subtitle, subject].join('-'))
//       .attr('class', 'highlight-slider')
//   }

//   function gen_slider_title(subject) {
//     var subject_text = subject[0].toUpperCase() + subject.slice(1)
//     d3.select('#' + ['g', type, subtitle, subject].join('-'))
//       .append('text')
//       .attr('id', ['title', type, subtitle, subject].join('-'))
//       .text(subject_text + ':')
//   }

//   function gen_slider_val(subject) {
//     // XXXXXXXX
//   }

//   // function 
// }

// function update_highlight_bottons(subtitle) {
//   d3.selectAll('.what-to-see-option-checkbox-icon-highlight-' + subtitle)
//     .style('display', 'none')

//   d3.select('#' + ['what-to-see-icon', subtitle, highlight_pathways[subtitle]['selected']].join('-'))
//     .style('display', 'block')

//   if (highlight_pathways[subtitle]['selected'] == 'most-changed') {
//     d3.select('#' + ['what-to-see-icon-sub', subtitle, highlight_pathways[subtitle]['sub-selected']].join('-'))
//       .style('display', 'block')
//     d3.select('#' + ['what-to-see-option-text-sub', subtitle, highlight_pathways[subtitle]['sub-selected']].join('-'))
//       .style('fill', 'gray')
//   }
// }










import {
  icons,
  filter_bar
} from './style.js'

import {
  attack_strengths
} from './constant.js'

import {
  selected_attack_info,
  round_unit
} from './left_attack_control.js'

import {
  write_mode_option_title,
  write_mode_option_help
} from './left_filter_pathways.js'

import { 
  go_comparison_mode,
  update_node_opacity
} from './attribution_graph.js'

import {
  gen_strength_bar_length_scale
} from './left_attack_control.js'


//////////////////////////////////////////////////////////////////////////////////////////
// Global variables
//////////////////////////////////////////////////////////////////////////////////////////

export var comp_attack = {
  'on': false,
  'weak': 0.05,
  'strong': 0.45
}

var bar_length_scale_cmp = {} 

//////////////////////////////////////////////////////////////////////////////////////////
// Make mode control
//////////////////////////////////////////////////////////////////////////////////////////

gen_mode_option_g()
write_mode_option_title('compare', 'COMPARE ATTACKS')
add_on_off_icon('compare', turn_on_comparison_mode, turn_off_comparison_mode)
gen_compare_contents_g()
add_compare_legend()
add_compare_strength_bar()
add_edge_option()

//////////////////////////////////////////////////////////////////////////////////////////
// Main division
//////////////////////////////////////////////////////////////////////////////////////////

function gen_mode_option_g() {
  d3.select('#svg-comparison-option')
    .append('g')
    .attr('id', 'g-compare-option')
}

function gen_compare_contents_g() {
  d3.select('#g-compare-option')
    .append('g')
    .attr('id', 'g-compare-contents')
    .classed('disabled', true).style('opacity', 0.3)
}

export function add_on_off_icon(option, turn_on_function, turn_off_function) {
  d3.select('#' + ['g', option, 'option'].join('-'))
    .append('text')
    .attr('id', option + '-on-off-icon')
    .attr('font-family', 'FontAwesome')
    .text(icons['toggle-off'])
    .on('mouseover', function() { this.style.cursor = 'pointer' })
    .on('click', function() { return toggle_on_off() })

  function toggle_on_off() {
    var icon = d3.select('#' + option + '-on-off-icon').text()
    if (icon == icons['toggle-off']) {
      turn_on_icon()
      turn_on_function()
    } else {
      turn_off_icon()
      turn_off_function()
    }
  }

  function turn_on_icon() {
    d3.select('#' + option + '-on-off-icon').text(icons['toggle-on'])
  }

  function turn_off_icon() {
    d3.select('#' + option + '-on-off-icon').text(icons['toggle-off'])
  }
}

function add_compare_legend() {
  gen_legned_g()
  add_legend('neither', 'N/A')
  add_legend('weaker', 'Weaker')
  add_legend('stronger', 'Stronger')
  add_legend('both', 'Weaker + Stronger')

  function gen_legned_g() {
    d3.select('#g-compare-contents')
      .append('g')
      .attr('id', 'g-compare-legend')
  }

  function add_legend(symbol_id, symbol_text) {
    d3.select('#g-compare-legend')
      .append('g')
      .attr('id', 'symbol-' + symbol_id)
    
    d3.select('#symbol-' + symbol_id)
      .append('g')
      .attr('id', 'symbol-rects-' + symbol_id)
    
    d3.select('#symbol-rects-' + symbol_id)
      .append('rect')
      .attr('id', 'outer-' + symbol_id)
      .attr('width', filter_bar['outer_rect'])
      .attr('height', filter_bar['outer_rect'])
      .style('rx', filter_bar['outer_rx'])

    d3.select('#symbol-rects-' + symbol_id)
      .append('rect')
      .attr('id', 'inner-' + symbol_id)
      .attr('width', filter_bar['inner_rect'])
      .attr('height', filter_bar['inner_rect'])
      .style('rx', filter_bar['inner_rx'])
      .attr('x', (filter_bar['outer_rect'] - filter_bar['inner_rect']) / 2)
      .attr('y', (filter_bar['outer_rect'] - filter_bar['inner_rect']) / 2)

    d3.select('#symbol-' + symbol_id)
      .append('text')
      .text(symbol_text)
      .attr('class', 'compare-legend-text')
      .attr('x', filter_bar['outer_rect'] + 7)
      .attr('y', 11.5)
  }
}

function turn_on_comparison_mode() {
  comp_attack['on'] = true

  // Attack strength off
  d3.select('#g-strength-bar').classed('disabled', true).style('opacity', 0.3)

  // Option on
  d3.select('#g-compare-contents').classed('disabled', false).style('opacity', 1)

  go_comparison_mode()
}

function turn_off_comparison_mode() {
  comp_attack['on'] = false

  // Attack strength on
  d3.select('#g-strength-bar').classed('disabled', false).style('opacity', 1)

  // Option off
  d3.select('#g-compare-contents').classed('disabled', true).style('opacity', 0.3)

  update_node_opacity()
}

function add_compare_strength_bar() {
  bar_length_scale_cmp = gen_strength_bar_length_scale(filter_bar['cmp_bar_length'])
  create_bar_g()
  gen_bar('compare', [comp_attack['weak'], comp_attack['strong']])

  function create_bar_g() {
    d3.select('#g-compare-contents')
      .append('g')
      .attr('id', 'g-compare-bar')
  }

  function gen_bar(filter_type, default_vals) {
    var bar_len = bar_length_scale_cmp[selected_attack_info['attack_type']]
    
    gen_horizontal_bar()
    gen_pointer('weak')
    gen_pointer('strong')
    gen_strength_txt('weak')
    gen_strength_txt('strong')

    function gen_horizontal_bar() {
      d3.select('#g-compare-bar')
        .append('g')
        .attr('id', 'g-compare-filter-bar')

      d3.select('#g-compare-filter-bar')
        .append('rect')
        .attr('id', 'filter-bar-' + filter_type)
        .style('width', filter_bar['cmp_bar_length'])
    }

    function gen_pointer(weak_or_strong) {

      gen_g_slider()
      gen_pointer_vertical_line()
      add_pointer()

      function gen_g_slider() {
        d3.select('#g-compare-filter-bar')
          .append('g')
          .attr('id', 'g-attack-' + weak_or_strong)
          .attr('transform', 'translate(' + get_x() + ',' + get_y() + ')')
      }

      function get_x() {
        var x = 0
        if (weak_or_strong == 'weak') {
          x = bar_len['val_to_len'](default_vals[0])
        } else {
          x = bar_len['val_to_len'](default_vals[1])
        }
        return x
      }

      function get_y() {
        var y2 = 0
        if (weak_or_strong == 'weak') {
          y2 = filter_bar['cmp_pointer_line_length'] + 2
        } else {
          y2 = -filter_bar['cmp_pointer_line_length']
        }
        return y2
      }

      function gen_pointer_vertical_line() {
        d3.select('#g-attack-' + weak_or_strong)
          .append('line')
          .attr('class', 'attack-pointer-line')
          .attr('x1', 0)
          .attr('x2', 0)
          .attr('y1', -get_y())
          .attr('y2', 0)
      }

      function add_pointer() {
        gen_outer_rect()
        gen_inner_rect()
        gen_pointer_circle()

        function gen_outer_rect() {
          d3.select('#g-attack-' + weak_or_strong)
            .append('rect')
            .attr('id', 'outer-rect-' + weak_or_strong)
            .attr('x', outer_delta_x())
            .attr('y', outer_delta_y())
            .attr('width', filter_bar['outer_rect'])
            .attr('height', filter_bar['outer_rect'])
            .style('rx', filter_bar['outer_rx'])
            .on('mouseover', function() { rect_mouseover() })
            .call(gen_slider_drag())

            function outer_delta_x() {
              return -filter_bar['outer_rect'] / 2
            }

            function outer_delta_y() {
              if (weak_or_strong == 'weak') {
                return 0
              } else {
                return -filter_bar['outer_rect']
              }
            }
        }

        function gen_inner_rect() {
          d3.select('#g-attack-' + weak_or_strong)
            .append('rect')
            .attr('id', 'inner-rect-' + weak_or_strong)
            .attr('x', inner_delta_x())
            .attr('y', inner_delta_y())
            .attr('width', filter_bar['inner_rect'])
            .attr('height', filter_bar['inner_rect'])
            .style('rx', filter_bar['inner_rx'])
            .on('mouseover', function() { rect_mouseover() })
            .call(gen_slider_drag())

          function inner_delta_x() {
            return -filter_bar['inner_rect'] / 2
          }

          function inner_delta_y() {
            if (weak_or_strong == 'weak') {
              return (filter_bar['outer_rect'] - filter_bar['inner_rect']) / 2
            } else {
              return -(filter_bar['outer_rect'] + filter_bar['inner_rect']) / 2
            }
          }
        }

        function rect_mouseover() {
          var is_disabled = d3.select('#g-compare-contents').attr('class')
          if (is_disabled) {
            is_disabled = is_disabled.includes('disabled')
          }
          if (is_disabled) {
            d3.select('#g-attack-' + weak_or_strong).style('cursor', 'default')
          } else {
            d3.select('#g-attack-' + weak_or_strong).style('cursor', 'pointer')
          }
        }
        
        function gen_pointer_circle() {
          d3.select('#g-attack-' + weak_or_strong)
            .append('circle')
            .attr('id', 'circle-' + weak_or_strong)
            .attr('r', 4)
            .attr('cx', 0)
            .attr('cy', -get_y())
            .style('display', 'none')
        }

        function gen_slider_drag() {
          var slider_drag = d3
            .drag()
            .on('start', function() { slider_drag_start() })
            .on('drag', function() { slider_drag_ing() })
            .on('end', function() { slider_drag_end() })
  
          return slider_drag
  
          function slider_drag_start() {
            var is_disabled = d3.select('#g-compare-contents').attr('class')
            if (is_disabled) {
              is_disabled = is_disabled.includes('disabled')
            }
            if (!is_disabled) {
              d3.select('#circle-' + weak_or_strong).style('display', 'block')
            }
          }
  
          function slider_drag_ing() {
            var is_disabled = d3.select('#g-compare-contents').attr('class')
            if (is_disabled) {
              is_disabled = is_disabled.includes('disabled')
            }
            if (!is_disabled) {
              // Get the position of pointer
              var mouse_x = get_mouse_x()
            
              // Domains
              var domains = attack_strengths[selected_attack_info['attack_type']]
              var max_domain_val = d3.max(domains)
              var domain_unit = max_domain_val / domains.length
          
              // Update the selected value
              comp_attack[weak_or_strong] = bar_len['len_to_val'](mouse_x)
              comp_attack[weak_or_strong] = round_unit(comp_attack[weak_or_strong], domain_unit)
              d3.select('#strength-val-' + weak_or_strong).text(comp_attack[weak_or_strong])
    
              // Position pointer
              d3.select('#g-attack-' + weak_or_strong)
                .attr('transform', 'translate(' + mouse_x + ',' + get_y() + ')')
              
              go_comparison_mode()
            }
          }
  
          function slider_drag_end() {
            var is_disabled = d3.select('#g-compare-contents').attr('class')
            if (is_disabled) {
              is_disabled = is_disabled.includes('disabled')
            }
            if (!is_disabled) {
              d3.select('#circle-' + weak_or_strong).style('display', 'none')
          
              // Get the position of the circle and the front bar
              var mouse_x = get_mouse_x()
          
              // Sticky movement
              var domains = attack_strengths[selected_attack_info['attack_type']]
              var bar_length_unit = filter_bar['cmp_bar_length'] / domains.length
              mouse_x = round_unit(mouse_x, bar_length_unit)
              d3.select('#g-attack-' + weak_or_strong)
                .attr('transform', 'translate(' + mouse_x + ',' + get_y() + ')')
            }
          }

          function get_mouse_x() {
            var mouse_x = d3.mouse(document.getElementById('filter-bar-compare'))[0]
            var [min_mouse_x, max_mouse_x] = [0, filter_bar['cmp_bar_length']]
            if (weak_or_strong == 'weak') {
              var [x, y] = extract_translate('g-attack-strong')
              max_mouse_x = x 
            } else {
              var [x, y] = extract_translate('g-attack-weak')
              min_mouse_x = x
            }
            mouse_x = d3.min([d3.max([min_mouse_x, mouse_x]), max_mouse_x])
            return mouse_x

            function extract_translate(id) {
              var t = d3.select('#' + id).attr('transform')
              var [x, y] = t.match(/\d+/g).map(Number)
              return [x, y]
            }
          }
        } 
      } 
    }

    function gen_strength_txt(weak_or_strong) {

      // Weak or strong label
      d3.select('#g-compare-filter-bar')
        .append('text')
        .attr('id', 'strength-' + weak_or_strong)
        .attr('class', 'compare-strength-label-text')
        .text(weak_or_strong.charAt(0).toUpperCase() + weak_or_strong.slice(1) + 'er')
        .attr('x', label_x())
        .attr('y', text_delta_y())

      // Inner or outer text
      d3.select('#g-compare-filter-bar')
        .append('text')
        .attr('id', 'strength-symbol-' + weak_or_strong)
        .attr('class', 'compare-strength-symbol-text')
        .text('(' + symbol_text(weak_or_strong) +'):')
        .attr('x', symbol_x())
        .attr('y', text_delta_y())
  
      // Strength value
      d3.select('#g-compare-filter-bar')
        .append('text')
        .attr('id', 'strength-val-' + weak_or_strong)
        .attr('class', 'compare-strength-val')
        .text(strength_val())
        .attr('x', val_x())
        .attr('y', text_delta_y())

      function symbol_text(weak_or_strong) {
        if (weak_or_strong == 'weak') {
          return 'inner'
        } else {
          return 'outer'
        }
      }
  
      function label_x() {
        if (weak_or_strong == 'weak') {
          return 0
        } else {
          return 61
        }
      }

      function symbol_x() {
        if (weak_or_strong == 'weak') {
          return 45
        } else {
          return 112
        }
      }
  
      function val_x() {
        if (weak_or_strong == 'weak') {
          return 90
        } else {
          return 158
        }
      }
  
      function text_delta_y() {
        if (weak_or_strong == 'weak') {
          return 2 * filter_bar['outer_rect'] + 8
        } else {
          return -2 * filter_bar['outer_rect'] + 3
        }
      }
  
      function strength_val() {
        if (weak_or_strong == 'weak') {
          return default_vals[0]
        } else {
          return default_vals[1]
        }
      }
    }
  }
}

function add_edge_option() {
  gen_edge_option_g()
  write_option_text('compare-option-text-1', 'Only show edges for')
  add_dropdown_menu()
  write_option_text('compare-option-text-2', 'attack')

  function gen_edge_option_g() {
    d3.select('#g-compare-contents')
      .append('g')
      .attr('id', 'g-compare-edge-option')
  }

  function write_option_text(id, text) {
    d3.select('#g-compare-edge-option')
      .append('text')
      .attr('id', id)
      .text(text)
      .attr('class', 'compare-edge-option-text')
  }

  function add_dropdown_menu() {
    
    gen_g_compare_edge_dropdown()
    gen_edge_dropdown_bg_rect()
    gen_edge_dropdown_val_text()
    gen_edge_dropdown_icon()
    gen_edge_dropdown_line()

    function gen_g_compare_edge_dropdown() {
      d3.select('#g-compare-edge-option')
        .append('g')
        .attr('id', 'g-compare-edge-dropdown')
    }

    function gen_edge_dropdown_bg_rect() {
      d3.select('#g-compare-edge-dropdown')
        .append('rect')
        .attr('id', 'edge-compare-dropdown-bg-rect')
        .style('fill', 'white')
        .attr('width', 60)
        .attr('height', 15)
        .attr('x', 115)
        .attr('y', -11)
    }

    function gen_edge_dropdown_val_text() {
      d3.select('#g-compare-edge-dropdown')
        .append('text')
        .attr('id', 'edge-compare-dropdown-text')
        .attr('class', 'compare-edge-option-text')
        .text('stronger')
        .attr('x', 115)
    }

    function gen_edge_dropdown_icon() {
      d3.select('#g-compare-edge-dropdown')
        .append('text')
        .attr('id', 'edge-compare-dropdown-icon')
        .attr('font-family', 'FontAwesome')
        .text(icons['caret-down'])
        .attr('x', 165)
        .attr('y', 2)
        .style('fill', 'gray')
    }

    function gen_edge_dropdown_line() {
      d3.select('#g-compare-edge-dropdown')
        .append('line')
        .attr('id', 'edge-compare-dropdown-line')
        .attr('x1', 115)
        .attr('x2', 175)
        .attr('y1', 2)
        .attr('y2', 2)
        .style('stroke', 'gray')
        .style('stroke-width', 1)
    }
    
  }
}

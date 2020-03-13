import {
  what_to_see,
  icons,
  filter_bar
} from './style.js'

import {
  selected_attack_info
} from './attack_control.js'

import { 
  go_comparison_mode
} from './attribution_graph.js'

import {
  round_unit,
  gen_strength_bar_length_scale
} from './attack_control.js'

export var comp_attack = {
  'weak': 0.05,
  'strong': 0.45
}


//////////////////////////////////////////////////////////////////////////////////////////
// Make mode control
//////////////////////////////////////////////////////////////////////////////////////////

gen_mode_option_g()

// Filter pathways
write_mode_option_title('filter', 'FILTER PATHWAYS')
write_mode_option_help('filter', ['Which pathways', 'do you want to see?'])
add_what_to_see_options()

// Comparison mode
var bar_length_scale_cmp = {} 
write_mode_option_title('compare', 'COMPARISON MODE')
add_on_off_icon()
write_mode_option_help('compare', ['Which adversarial strenghts', 'do you want to compare?'])
add_compare_strength_bar()

//////////////////////////////////////////////////////////////////////////////////////////
// Main division
//////////////////////////////////////////////////////////////////////////////////////////

function gen_mode_option_g() {
  d3.select('#svg-mode-option')
    .append('g')
    .attr('id', 'g-filter-option')

  d3.select('#svg-mode-option')
    .append('g')
    .attr('id', 'g-compare-option')
}

function write_mode_option_title(type, title) {
  d3.select('#' + ['g', type, 'option'].join('-'))
    .append('text')
    .attr('id', [type, 'option', 'title'].join('-'))
    .attr('class', 'option-title')
    .text(title)
}

function write_mode_option_help(type, lines) {
  d3.select('#' + ['g', type, 'option'].join('-'))
    .selectAll('help')
    .data(lines)
    .enter()
    .append('text')
    .attr('class', 'option-help')
    .attr('id', [type, 'option', 'help'].join('-'))
    .text(function(d) { return d })
    .attr('y', function(d, i) {return i * 17})
}

function add_what_to_see_options() {
  
  gen_option_g('activated')
  gen_option_g('changed')
  gen_option_title('activated')
  gen_option_title('changed')
  gen_sub_option('changed', ['Largest increased', 'Largest decreased'])

  function gen_option_g(option) { 
    d3.select('#g-filter-option')
      .append('g')
      .attr('id', 'g-most-' + option)
      .attr('transform', function() {
        var x = what_to_see['most-option-x']
        var y = what_to_see['most-' + option + '-y']
        return 'translate(' + x + ',' + y + ')'
      })
  }

  function gen_option_title(option) {
    d3.select('#g-most-' + option)
      .append('rect')
      .attr('class', 'what-to-see-option-checkbox')
      .attr('width', what_to_see['bt-width'])
      .attr('height', what_to_see['bt-height'])
      
    d3.select('#g-most-' + option)
      .append('text')
      .text('Most ' + option + ' by attack')
      .attr('class', 'what-to-see-option-text')
      .attr('x', what_to_see['most-option-text-x'])
      .attr('y', what_to_see['most-option-text-y'])
  }

  function gen_sub_option(option, suboptions) {
    d3.select('#g-most-' + option)
      .selectAll('suboptions')
      .data(suboptions)
      .enter()
      .append('rect')  
      .attr('class', 'what-to-see-option-checkbox')
      .attr('width', what_to_see['bt-width'])
      .attr('height', what_to_see['bt-height'])
      .attr('x', what_to_see['most-changed-suboption-x'])
      .attr('y', function(d, i) { 
        return what_to_see['most-changed-suboption-t'] + i * what_to_see['most-changed-suboption-h'] 
      })

    d3.select('#g-most-' + option)
      .selectAll('suboptions')
      .data(suboptions)
      .enter()
      .append('text')
      .attr('class', 'what-to-see-option-text')
      .attr('x', what_to_see['most-changed-suboption-x'] + what_to_see['most-option-text-x'])
      .attr('y', function(d, i) { 
        var start_y = what_to_see['most-changed-suboption-t'] + what_to_see['most-option-text-y']
        return start_y + i * what_to_see['most-changed-suboption-h'] 
      })
      .text(function(d) { return d })

  }

}

function add_on_off_icon() {
  d3.select('#g-compare-option')
    .append('text')
    .attr('id', 'compare-on-off-icon')
    .attr('font-family', 'FontAwesome')
    .text(icons['toggle-off'])
    .on('mouseover', function() { this.style.cursor = 'pointer' })
    .on('click', function() { return toggle_icon() })

  function toggle_icon() {
    var icon = d3.select('#compare-on-off-icon').text()
    if (icon == icons['toggle-off']) {
      d3.select('#compare-on-off-icon').text(icons['toggle-on'])
    } else {
      d3.select('#compare-on-off-icon').text(icons['toggle-off'])
    }
  }
}

function add_compare_strength_bar() {
  bar_length_scale_cmp = gen_strength_bar_length_scale(filter_bar['cmp_bar_length'])
  create_bar_g()
  create_bar_title('Strengths')
  gen_bar('compare', [0.05, 0.45])

  function create_bar_g() {
    d3.select('#g-compare-option')
      .append('g')
      .attr('id', 'g-compare-bar')
  }

  function create_bar_title(title) {
    d3.select('#g-compare-bar')
      .append('text')
      .text(title)
  }

  function gen_bar(filter_type, default_vals) {
    var bar_len = bar_length_scale_cmp[selected_attack_info['attack_type']]

    // Background bar
    d3.select('#g-compare-bar')
      .append('g')
      .attr('id', 'g-compare-filter-bar')

    d3.select('#g-compare-filter-bar')
      .append('rect')
      .attr('id', 'filter-bar-' + filter_type)
      .style('width', filter_bar['cmp_bar_length'])

    // Add weak strength
    gen_pointer('weak')

    // Add strong strength
    gen_pointer('strong')

    function gen_pointer(weak_or_strong) {

      // Generate g
      d3.select('#g-compare-filter-bar')
        .append('g')
        .attr('id', 'g-attack-' + weak_or_strong)

      // Add pointer vertical line
      d3.select('#g-attack-' + weak_or_strong)
        .append('line')
        .attr('class', 'attack-pointer-line')
        .attr('x1', get_x())
        .attr('x2', get_x())
        .attr('y1', 0)
        .attr('y2', get_y2())

      // Add pointer
      add_pointer()

      function get_x() {
        var x = 0
        if (weak_or_strong == 'weak') {
          x = bar_len['val_to_len'](default_vals[0])
        } else {
          x = bar_len['val_to_len'](default_vals[1])
        }
        return x
      }

      function get_y2() {
        var y2 = 0
        if (weak_or_strong == 'weak') {
          y2 = filter_bar['cmp_pointer_line_length'] + 2
        } else {
          y2 = -filter_bar['cmp_pointer_line_length']
        }
        return y2
      }

      function add_pointer() {
        // Add outer rect
        d3.select('#g-attack-' + weak_or_strong)
          .append('rect')
          .attr('id', 'outer-rect-' + weak_or_strong)
          .attr('x', get_x() - filter_bar['outer_rect'] / 2)
          .attr('y', outer_y())
          .attr('width', filter_bar['outer_rect'])
          .attr('height', filter_bar['outer_rect'])
          .style('rx', filter_bar['outer_rx'])

        // Add inner rect 
        d3.select('#g-attack-' + weak_or_strong)
          .append('rect')
          .attr('id', 'inner-rect-' + weak_or_strong)
          .attr('x', get_x() - filter_bar['inner_rect'] / 2)
          .attr('y', inner_y())
          .attr('width', filter_bar['inner_rect'])
          .attr('height', filter_bar['inner_rect'])
          .style('rx', filter_bar['inner_rx'])

        // Add strength
        d3.select('#g-attack-' + weak_or_strong)
          .append('text')
          .attr('id', 'strength-' + weak_or_strong)
          .text(weak_or_strong)
          .attr('x', get_x() + filter_bar['outer_rect'] / 2 + 5)
          .attr('y', text_y())

        // Add strength text
        d3.select('#g-attack-' + weak_or_strong)
          .append('text')
          .attr('id', 'strength-val-' + weak_or_strong)
          .attr('class', 'compare-strength-val')
          .text(strength_val())
          .attr('x', val_x())
          .attr('y', text_y())


        function outer_y() {
          if (weak_or_strong == 'weak') {
            return get_y2()
          } else {
            return get_y2() - filter_bar['outer_rect']
          }
        }

        function inner_y() {
          if (weak_or_strong == 'weak') {
            return get_y2() + (filter_bar['outer_rect'] - filter_bar['inner_rect']) / 2
          } else {
            return get_y2() - (filter_bar['outer_rect'] + filter_bar['inner_rect']) / 2
          }
        }

        function text_y() {
          return inner_y() + 8
        }

        function val_x() {
          if (weak_or_strong == 'weak') {
            return get_x() + filter_bar['outer_rect'] / 2 + 43
          } else {
            return get_x() + filter_bar['outer_rect'] / 2 + 50
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
}

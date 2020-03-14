import {
  what_to_see, icons
} from './style.js'

import {
  update_node_opacity
} from './attribution_graph.js'

//////////////////////////////////////////////////////////////////////////////////////////
// Global variables
//////////////////////////////////////////////////////////////////////////////////////////
export var filter_pathways = {
  'selected': 'activated',
  'sub-selected': '-'
}

//////////////////////////////////////////////////////////////////////////////////////////
// Filter pathways
//////////////////////////////////////////////////////////////////////////////////////////

gen_filter_pathways_option_g()
write_mode_option_title('filter', 'FILTER PATHWAYS')
write_mode_option_help('filter', ['Which pathways', 'do you want to see?'])
add_what_to_see_options()
update_bottons()

//////////////////////////////////////////////////////////////////////////////////////////
// Main division
//////////////////////////////////////////////////////////////////////////////////////////

function gen_filter_pathways_option_g() {
  d3.select('#svg-mode-option')
    .append('g')
    .attr('id', 'g-filter-option')
}

export function write_mode_option_title(type, title) {
  d3.select('#' + ['g', type, 'option'].join('-'))
    .append('text')
    .attr('id', [type, 'option', 'title'].join('-'))
    .attr('class', 'option-title')
    .text(title)
}

export function write_mode_option_help(type, lines) {
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
  gen_option('activated')
  gen_option('changed')
  gen_sub_option('changed', ['increased', 'decreased'])

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

  function gen_option(option) {
    gen_option_botton_rect()
    gen_option_botton_check_icon()
    gen_option_text()

    function gen_option_botton_rect() {
      d3.select('#g-most-' + option)
        .append('rect')
        .attr('class', 'what-to-see-option-checkbox')
        .attr('width', what_to_see['bt-width'])
        .attr('height', what_to_see['bt-height'])
        .on('mouseover', function() { this.style.cursor = 'pointer' })
        .on('click', function() { return click_option() })
    }

    function gen_option_botton_check_icon() {
      d3.select('#g-most-' + option)
        .append('text')
        .attr('id', 'what-to-see-icon-' + option)
        .attr('class', 'what-to-see-option-checkbox-icon')
        .attr('font-family', 'FontAwesome')
        .text(icons['check-square'])
        .attr('x', -0.5)
        .attr('y', what_to_see['most-option-text-y'] - 0.5)
        .style('display', 'none') 
        .on('mouseover', function() { this.style.cursor = 'pointer' })
        .on('click', function() { return click_option() })
    }

    function gen_option_text() {
      d3.select('#g-most-' + option)
        .append('text')
        .text('Most ' + option + ' by attack')
        .attr('id', 'what-to-see-option-text-' + option)
        .attr('class', 'what-to-see-option-text')
        .attr('x', what_to_see['most-option-text-x'])
        .attr('y', what_to_see['most-option-text-y'])
    }

    function click_option() {
      filter_pathways['selected'] = option
      if (option == 'changed') {
        filter_pathways['sub-selected'] = 'increased'
      } else {
        filter_pathways['sub-selected'] = '-'
      }
      update_bottons()
      update_node_opacity()
    }
  }

  function gen_sub_option(option, suboptions) {
    gen_suboption_botton_rect()
    gen_suboption_botton_check_icon()
    gen_suboption_text()

    function suboption_text_y(i) {
      var start_y = what_to_see['most-changed-suboption-t'] + what_to_see['most-option-text-y']
      return start_y + i * what_to_see['most-changed-suboption-h'] 
    }

    function gen_suboption_botton_rect() {
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
        .on('mouseover', function() {this.style.cursor = 'pointer'})
        .on('click', function(suboption) { return click_sub_option(suboption) })
    }

    function gen_suboption_botton_check_icon() {
      d3.select('#g-most-' + option)
        .selectAll('suboptions')
        .data(suboptions)
        .enter()
        .append('text')
        .attr('id', function(suboption) { return 'what-to-see-icon-sub-' + suboption })
        .attr('class', 'what-to-see-option-checkbox-icon')
        .attr('font-family', 'FontAwesome')
        .text(icons['check-square'])
        .attr('x', what_to_see['most-changed-suboption-x'] - 0.5)
        .attr('y', function(d, i) { return suboption_text_y(i) - 0.5 })
        .style('display', 'none')
        .on('mouseover', function() {this.style.cursor = 'pointer'})
        .on('click', function(suboption) { return click_sub_option(suboption) })
    }

    function gen_suboption_text() {
      d3.select('#g-most-' + option)
        .selectAll('suboptions')
        .data(suboptions)
        .enter()
        .append('text')
        .attr('id', function(suboption) { return 'what-to-see-option-text-sub-' + suboption })
        .attr('class', 'what-to-see-option-text')
        .attr('x', what_to_see['most-changed-suboption-x'] + what_to_see['most-option-text-x'])
        .attr('y', function(d, i) { return suboption_text_y(i) })
        .text(function(d) { return 'Largest ' + d })
    }

    function click_sub_option(suboption) {
      filter_pathways['selected'] = 'changed'
      filter_pathways['sub-selected'] = suboption
      update_bottons()
      update_node_opacity()
    }

  }

}

function update_bottons() {
  d3.selectAll('.what-to-see-option-checkbox-icon')
    .style('display', 'none')

  d3.selectAll('.what-to-see-option-text')
    .style('fill', 'lightgray')

  d3.select('#what-to-see-icon-' + filter_pathways['selected'])
    .style('display', 'block')

  d3.select('#what-to-see-option-text-' + filter_pathways['selected'])
    .style('fill', 'gray')

  if (filter_pathways['selected'] == 'changed') {
    d3.select('#what-to-see-icon-sub-' + filter_pathways['sub-selected'])
      .style('display', 'block')

    d3.select('#what-to-see-option-text-sub-' + filter_pathways['sub-selected'])
      .style('fill', 'gray')
  }
}
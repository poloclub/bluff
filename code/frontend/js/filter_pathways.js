import {
  what_to_see, 
  icons
} from './style.js'

import {
  update_node_opacity,
  update_node_display,
  go_comparison_mode
} from './attribution_graph.js'

//////////////////////////////////////////////////////////////////////////////////////////
// Global variables
//////////////////////////////////////////////////////////////////////////////////////////

export var filter_pathways = {
  'filter': 'all'  
}

export var highlight_pathways = {
  'selected': 'most-activated',
  'sub-selected': '-'
}


//////////////////////////////////////////////////////////////////////////////////////////
// Filter pathways
//////////////////////////////////////////////////////////////////////////////////////////
gen_pathways_option_g('filter')
write_mode_option_title('filter', 'FILTER GRAPH')
// write_mode_option_help('filter', ['Which pathways', 'do you want to see?'])
add_what_to_filter_options('filter')
update_filter_bottons()

//////////////////////////////////////////////////////////////////////////////////////////
// Highlight pathways
//////////////////////////////////////////////////////////////////////////////////////////

gen_pathways_option_g('highlight')
write_mode_option_title('highlight', 'HIGHLIGHT PATHWAYS')
// write_mode_option_help('highlight', ['Which pathways', 'do you want to highlight?'])
add_what_to_highlight_options('highlight')
update_highlight_bottons()

//////////////////////////////////////////////////////////////////////////////////////////
// Functions
//////////////////////////////////////////////////////////////////////////////////////////

function gen_pathways_option_g(type) {
  d3.select('#svg-pathway-option')
    .append('g')
    .attr('id', 'g-' + type + '-option')
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

function add_what_to_highlight_options(type) {
  gen_option_g('most-activated', type)
  gen_option_g('most-changed', type)
  gen_option(type, 'most-activated', 'Most activated by attack')
  gen_option(type, 'most-changed', 'Most changed by attack')
  gen_sub_option(type, 'most-changed', ['increased', 'decreased'])
}

function add_what_to_filter_options(type) {
  gen_option_g('all', type)
  gen_option_g('selected', type)
  gen_option(type, 'all', 'Show full graph')
  gen_option(type, 'selected', 'Show selected only')
}

function gen_option_g(option, type) { 
  d3.select('#g-' + type + '-option')
    .append('g')
    .attr('id', 'g-' + option)
    .attr('transform', function() {
      var x = what_to_see['option-x']
      var y = what_to_see[option + '-y']
      return 'translate(' + x + ',' + y + ')'
    })
}

function gen_option(type, option, option_txt) {
  gen_option_botton_rect()
  gen_option_botton_check_icon()
  gen_option_text()

  function gen_option_botton_rect() {
    d3.select('#g-' + option)
      .append('rect')
      .attr('class', 'what-to-see-option-checkbox what-to-see-option-checkbox-' + type)
      .attr('width', what_to_see['bt-width'])
      .attr('height', what_to_see['bt-height'])
      .on('mouseover', function() { this.style.cursor = 'pointer' })
      .on('click', function() { 
        if (type == 'highlight') {
          return click_highlight_option(option) 
        } else {
          return click_filter_option(option)
        } 
      })
  }

  function gen_option_botton_check_icon() {
    d3.select('#g-' + option)
      .append('text')
      .attr('id', 'what-to-see-icon-' + option)
      .attr('class', 'what-to-see-option-checkbox-icon what-to-see-option-checkbox-icon-' + type)
      .attr('font-family', 'FontAwesome')
      .text(icons['check-square'])
      .attr('x', -0.5)
      .attr('y', what_to_see[option + '-text-y'])
      .style('display', 'none') 
      .on('mouseover', function() { this.style.cursor = 'pointer' })
      .on('click', function() { 
        if (type == 'highlight') {
          return click_highlight_option(option) 
        } else {
          return click_filter_option(option)
        } 
      })
  }

  function gen_option_text() {
    d3.select('#g-' + option)
      .append('text')
      .text(option_txt)
      .attr('id', 'what-to-see-option-text-' + option)
      .attr('class', 'what-to-see-option-text what-to-see-option-text-' + type)
      .attr('x', what_to_see['option-text-x'])
      .attr('y', what_to_see[option + '-text-y'])
  }

}

function gen_sub_option(type, option, suboptions) {
  gen_suboption_botton_rect(type)
  gen_suboption_botton_check_icon(type)
  gen_suboption_text(type)

  function suboption_text_y(i) {
    var start_y = what_to_see['most-changed-suboption-t'] + what_to_see[option + '-text-y']
    return start_y + i * what_to_see['most-changed-suboption-h'] 
  }

  function gen_suboption_botton_rect(type) {
    d3.select('#g-' + option)
      .selectAll('suboptions')
      .data(suboptions)
      .enter()
      .append('rect')  
      .attr('class', 'what-to-see-option-checkbox what-to-see-option-checkbox-' + type)
      .attr('width', what_to_see['bt-width'])
      .attr('height', what_to_see['bt-height'])
      .attr('x', what_to_see['most-changed-suboption-x'])
      .attr('y', function(d, i) { 
        return what_to_see['most-changed-suboption-t'] + i * what_to_see['most-changed-suboption-h'] 
      })
      .on('mouseover', function() {this.style.cursor = 'pointer'})
      .on('click', function(suboption) { 
        if (type == 'highlight') {
          return click_sub_option(suboption) 
        } else {

        }
      })
  }

  function gen_suboption_botton_check_icon(type) {
    d3.select('#g-' + option)
      .selectAll('suboptions')
      .data(suboptions)
      .enter()
      .append('text')
      .attr('id', function(suboption) { return 'what-to-see-icon-sub-' + suboption })
      .attr('class', 'what-to-see-option-checkbox-icon what-to-see-option-checkbox-icon-' + type)
      .attr('font-family', 'FontAwesome')
      .text(icons['check-square'])
      .attr('x', what_to_see['most-changed-suboption-x'] - 0.5)
      .attr('y', function(d, i) { return suboption_text_y(i) - 0.5 })
      .style('display', 'none')
      .on('mouseover', function() {this.style.cursor = 'pointer'})
      .on('click', function(suboption) { return click_sub_option(suboption) })
  }

  function gen_suboption_text(type) {
    d3.select('#g-' + option)
      .selectAll('suboptions')
      .data(suboptions)
      .enter()
      .append('text')
      .attr('id', function(suboption) { return 'what-to-see-option-text-sub-' + suboption })
      .attr('class', 'what-to-see-option-text what-to-see-option-text-' + type)
      .attr('x', what_to_see['most-changed-suboption-x'] + what_to_see['option-text-x'])
      .attr('y', function(d, i) { return suboption_text_y(i) })
      .text(function(d) { return 'Largest ' + d })
  }

  function click_sub_option(suboption) {
    highlight_pathways['selected'] = 'most-changed'
    highlight_pathways['sub-selected'] = suboption
    update_highlight_bottons()
    update_node_opacity()
    go_comparison_mode()
  }

}

function update_highlight_bottons() {
  d3.selectAll('.what-to-see-option-checkbox-icon-highlight')
    .style('display', 'none')

  d3.select('#what-to-see-icon-' + highlight_pathways['selected'])
    .style('display', 'block')

  if (highlight_pathways['selected'] == 'most-changed') {
    d3.select('#what-to-see-icon-sub-' + highlight_pathways['sub-selected'])
      .style('display', 'block')

    d3.select('#what-to-see-option-text-sub-' + highlight_pathways['sub-selected'])
      .style('fill', 'gray')
  }
}

function click_highlight_option(option) {
  highlight_pathways['selected'] = option
  if (option == 'most-changed') {
    highlight_pathways['sub-selected'] = 'increased'
  } else {
    highlight_pathways['sub-selected'] = '-'
  }
  update_highlight_bottons()
  update_node_opacity()
}

function update_filter_bottons() {
  d3.selectAll('.what-to-see-option-checkbox-icon-filter')
    .style('display', 'none')

  d3.select('#what-to-see-icon-' + filter_pathways['filter'])
    .style('display', 'block')

}

function click_filter_option(option) {
  
  filter_pathways['filter'] = option
  update_filter_bottons()
  update_node_display()

}
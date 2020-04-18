import {
  what_to_see, 
  icons
} from './style.js'

import {
  update_graph_by_filter_graph
} from './attribution_graph.js'

//////////////////////////////////////////////////////////////////////////////////////////
// Global variables
//////////////////////////////////////////////////////////////////////////////////////////

export var filter_pathways = {
  'filter': 'all'  
}

//////////////////////////////////////////////////////////////////////////////////////////
// Filter pathways
//////////////////////////////////////////////////////////////////////////////////////////
gen_pathways_option_g('filter')
write_mode_option_title('filter', 'FILTER GRAPH')
add_options(
  'filter', 
  'g-filter-option', 
  [{'option': 'all', 'text': 'Show full graph'},
   {'option': 'selected', 'text': 'Show pinned only'},
   {'option': 'highlighted', 'text': 'Show highlighted only'}],
  click_filter_option
)
update_filter_bottons()

//////////////////////////////////////////////////////////////////////////////////////////
// Functions
//////////////////////////////////////////////////////////////////////////////////////////

export function gen_pathways_option_g(type) {
  d3.select('#svg-' + type + '-option')
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

function add_options(type, parent_g_id, options, click_function) {
  options.forEach(opt => {
    gen_option_g(parent_g_id, opt['option'])
    gen_option(type, click_function, opt['option'], opt['text'])
  })
}

function gen_option(type, click_function, option, option_txt) {
  gen_option_botton_rect()
  gen_option_botton_check_icon()
  gen_option_text()

  function gen_option_botton_rect() {
    d3.select('#g-' + option)
      .append('rect')
      .attr('id', 'what-to-see-option-checkbox-' + option)
      .attr('class', 'what-to-see-option-checkbox what-to-see-option-checkbox-' + type)
      .attr('width', what_to_see['bt-width'])
      .attr('height', what_to_see['bt-height'])
      .on('mouseover', function() { this.style.cursor = 'pointer' })
      .on('click', function() { return click_function(option) })
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
      .on('click', function() { return click_function(option) })
  }

  function gen_option_text() {
    d3.select('#g-' + option)
      .append('text')
      .text(option_txt)
      .attr('id', 'what-to-see-option-text-' + option)
      .attr('class', 'what-to-see-option-text')
      .attr('x', what_to_see['option-text-x'])
      .attr('y', what_to_see[option + '-text-y'])
  }

}

function gen_option_g(parent_g_id, option) { 
  d3.select('#' + parent_g_id)
    .append('g')
    .attr('id', 'g-' + option)
    .attr('transform', function() {
      var x = what_to_see['option-x']
      var y = what_to_see[option + '-y']
      return 'translate(' + x + ',' + y + ')'
    })
}

function click_filter_option(option) {
  
  filter_pathways['filter'] = option
  update_filter_bottons()
  update_graph_by_filter_graph()

}

function update_filter_bottons() {
  d3.selectAll('.what-to-see-option-checkbox-icon-filter')
    .style('display', 'none')

  d3.select('#what-to-see-icon-' + filter_pathways['filter'])
    .style('display', 'block')

}


import {
  what_to_see, 
  icons
} from './style.js'

import {
  update_node_opacity,
  update_graph_by_filter_graph,
  go_comparison_mode
} from './attribution_graph.js'

import {
  gen_pathways_option_g,
  write_mode_option_title
} from './left_filter_pathways.js'

//////////////////////////////////////////////////////////////////////////////////////////
// Global variables
//////////////////////////////////////////////////////////////////////////////////////////

export var highlight_pathways = {
  'neurons': {
    'selected': 'most-activated',
    'sub-selected': '-'
  },
  'connections': {
    'selected': 'most-activated',
    'sub-selected': '-'
  }
  
}

//////////////////////////////////////////////////////////////////////////////////////////
// Highlight pathways
//////////////////////////////////////////////////////////////////////////////////////////

gen_pathways_option_g('highlight')
write_mode_option_title('highlight', 'HIGHLIGHT PATHWAYS')
add_what_to_highlight_options('highlight', 'what', 'What to Highlight')
add_how_many_to_highlight_options('highlight', 'many', 'What to Highlight', 'neurons')
// add_how_many_to_highlight_options('connections')
// update_highlight_bottons('neurons')
// update_highlight_bottons('connections')

//////////////////////////////////////////////////////////////////////////////////////////
// Functions
//////////////////////////////////////////////////////////////////////////////////////////

function add_what_to_highlight_options(type, subtitle, subtitle_txt) {
  
  gen_subtitle_g()
  draw_subtitle()

  gen_option_g(['g', type, subtitle].join('-'), type, subtitle, 'most-activated')
  gen_option_g(['g', type, subtitle].join('-'), type, subtitle, 'most-changed')

  gen_option(type, subtitle, 'most-activated', 'Most activated')
  gen_option(type, subtitle, 'most-changed', 'Most changed by attack')

  gen_sub_option(type, subtitle, 'most-changed', ['excited', 'inhibited'])

  function gen_subtitle_g() {
    d3.select('#g-' + type + '-option')
      .append('g')
      .attr('id', 'g-' + type + '-' + subtitle)
  }

  function draw_subtitle() {
    // var subtitle_first_capital = subtitle[0].toUpperCase() + subtitle.slice(1)
    d3.select('#g-' + type + '-' + subtitle)
      .append('text')
      .attr('id', ['option', 'subtitle', type, subtitle].join('-'))
      .text(subtitle_txt)
  }
}

function add_how_many_to_highlight_options() {
  
}

function gen_option_g(parent_g_id, type, subtitle, option) { 
  d3.select('#' + parent_g_id)
    .append('g')
    .attr('id', ['g', type, subtitle, option].join('-'))
    .attr('transform', function() {
      var x = what_to_see['option-x']
      var y = what_to_see[option + '-y']
      return 'translate(' + x + ',' + y + ')'
    })
}

function gen_option(type, subtitle, option, option_txt) {
  gen_option_botton_rect()
  gen_option_botton_check_icon()
  gen_option_text()

  function gen_option_botton_rect() {
    d3.select('#' + ['g', type, subtitle, option].join('-'))
      .append('rect')
      .attr('id', ['what-to-see-option-checkbox', subtitle, option].join('-'))
      .attr('class', 'what-to-see-option-checkbox what-to-see-option-checkbox-' + type)
      .attr('width', what_to_see['bt-width'])
      .attr('height', what_to_see['bt-height'])
      .on('mouseover', function() { this.style.cursor = 'pointer' })
      .on('click', function() { return click_highlight_option(subtitle, option) })
  }

  function gen_option_botton_check_icon() {
    d3.select('#' + ['g', type, subtitle, option].join('-'))
      .append('text')
      .attr('id', ['what-to-see-icon', subtitle, option].join('-'))
      .attr('class', 'what-to-see-option-checkbox-icon what-to-see-option-checkbox-icon-' + type + '-' + subtitle)
      .attr('font-family', 'FontAwesome')
      .text(icons['check-square'])
      .attr('x', -0.5)
      .attr('y', what_to_see[option + '-text-y'])
      .style('display', 'none') 
      .on('mouseover', function() { this.style.cursor = 'pointer' })
      .on('click', function() { return click_highlight_option(subtitle, option) })
  }

  function gen_option_text() {
    console.log('option-text:', option_txt)
    d3.select('#' + ['g', type, subtitle, option].join('-'))
      .append('text')
      .text(option_txt)
      .attr('id', ['what-to-see-option-text', subtitle, option].join('-'))
      .attr('class', 'what-to-see-option-text')
      .attr('x', what_to_see['option-text-x'])
      .attr('y', what_to_see[option + '-text-y'])
  }

}

function gen_sub_option(type, subtitle, option, suboptions) {
  gen_suboption_botton_rect()
  gen_suboption_botton_check_icon()
  gen_suboption_text()

  function gen_suboption_botton_rect() {
    d3.select('#' + ['g', type, subtitle, option].join('-'))
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
      .on('click', function(suboption) { return click_sub_option(subtitle, suboption) })
  }

  function gen_suboption_botton_check_icon() {
    d3.select('#' + ['g', type, subtitle, option].join('-'))
      .selectAll('suboptions')
      .data(suboptions)
      .enter()
      .append('text')
      .attr('id', function(suboption) { return ['what-to-see-icon-sub', subtitle, suboption].join('-') })
      .attr('class', 'what-to-see-option-checkbox-icon what-to-see-option-checkbox-icon-' + type + '-' + subtitle)
      .attr('font-family', 'FontAwesome')
      .text(icons['check-square'])
      .attr('x', what_to_see['most-changed-suboption-x'] - 0.5)
      .attr('y', function(d, i) { return suboption_text_y(i) - 0.5 })
      .style('display', 'none')
      .on('mouseover', function() {this.style.cursor = 'pointer'})
      .on('click', function(suboption) { return click_sub_option(subtitle, suboption) })
  }

  function gen_suboption_text() {
    d3.select('#' + ['g', type, subtitle, option].join('-'))
      .selectAll('suboptions')
      .data(suboptions)
      .enter()
      .append('text')
      .attr('id', function(suboption) { return ['what-to-see-option-text-sub-', subtitle, suboption].join('-') })
      .attr('class', 'what-to-see-option-text what-to-see-option-text-' + type)
      .attr('x', what_to_see['most-changed-suboption-x'] + what_to_see['option-text-x'])
      .attr('y', function(d, i) { return suboption_text_y(i) })
      .text(function(d) { return 'Most ' + d })
  }

  function suboption_text_y(i) {
    var start_y = what_to_see['most-changed-suboption-t'] + what_to_see[option + '-text-y']
    return start_y + i * what_to_see['most-changed-suboption-h'] 
  }
}

function click_sub_option(subtitle, suboption) {
  highlight_pathways[subtitle]['selected'] = 'most-changed'
  highlight_pathways[subtitle]['sub-selected'] = suboption
  update_highlight_bottons(subtitle)
  update_node_opacity()
  go_comparison_mode()
}

function click_highlight_option(subtitle, option) {
  highlight_pathways[subtitle]['selected'] = option
  if (option == 'most-changed') {
    highlight_pathways[subtitle]['sub-selected'] = 'excited'
  } else {
    highlight_pathways[subtitle]['sub-selected'] = '-'
  }
  update_highlight_bottons(subtitle)
  update_node_opacity()
}

function update_highlight_bottons(subtitle) {
  d3.selectAll('.what-to-see-option-checkbox-icon-highlight-' + subtitle)
    .style('display', 'none')

  d3.select('#' + ['what-to-see-icon', subtitle, highlight_pathways[subtitle]['selected']].join('-'))
    .style('display', 'block')

  if (highlight_pathways[subtitle]['selected'] == 'most-changed') {
    d3.select('#' + ['what-to-see-icon-sub', subtitle, highlight_pathways[subtitle]['sub-selected']].join('-'))
      .style('display', 'block')
    console.log(highlight_pathways[subtitle]['sub-selected'])
    d3.select('#' + ['what-to-see-option-text-sub', subtitle, highlight_pathways[subtitle]['sub-selected']].join('-'))
      .style('fill', 'gray')
  }
}











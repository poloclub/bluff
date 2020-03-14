import {
  selected_class,
  class_name_for_display,
  get_absolute_position
} from './header.js'

import {
  node_group_x
} from './attribution_graph.js'

import { 
  selected_attack_info
} from './attack_control.js'

import {
  node_color
} from './style.js';

export function update_column_title() {
  console.log(node_color)

  // Remove all column labels
  d3.selectAll('.column-title').remove()

  add_label('original')
  add_label('original-and-target')
  add_label('target')
  add_label('attack-only')

  function add_label(column) {
    var label_x = node_group_x[selected_attack_info['attack_type']][column]

    var label = ''
    if ((column == 'original') || (column == 'target')) {
      label = class_name_for_display(selected_class[column])
    } else if (column == 'original-and-target') {
      label = 'BOTH'
    } else if (column == 'attack-only') {
      label = 'ATTACK-ONLY'
    }
     
    d3.select('#g-column-title')
      .append('text')
      .text(label)
      .attr('id', 'column-' + column)
      .attr('class', 'column-title')
      .style('fill', node_color[column])

    var [l, t, r, b] = get_absolute_position('column-' + column)
    var len_txt = r - l

    d3.select('#column-' + column)
      .attr('x', (label_x['start_x'] + label_x['end_x'] - len_txt) / 2)
  }

}
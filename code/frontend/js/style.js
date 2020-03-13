////////////////////////////////////////////////////////////////////////////////////////////////
// View size
////////////////////////////////////////////////////////////////////////////////////////////////

// Main view sizes
export var main_view_size = {
  'width': 1600,
  'height': 1000
}

// How to attack
export var how_to_attack = {
  'method-icon-x': 90,
  'method-val-y': 20,
  'method-line-x': 100,
  'method-line-y': 24
}

// Attribution graph group
export var graph_margin = {
  'start_x': 200,
  'end_x': 1200,
  'start_y': 300,
  'end_y': 700,
  'group_lr': 50,
  'node_lr': 5
}

// What to see option
export var what_to_see = {
  'most-option-x': 2,
  'most-option-text-x': 15,
  'most-option-text-y': 7,
  'most-activated-y': 65,
  'most-changed-y': 90,
  'most-changed-suboption-x': 15,
  'most-changed-suboption-t': 25,
  'most-changed-suboption-h': 22,
  'bt-width': 10,
  'bt-height': 10
}

// Size info of filter bar
export var filter_bar = {
  'bar_length': 100,
  'cmp_bar_length': 150,
  'cmp_pointer_line_length': 10,
  'outer_rect': 15,
  'inner_rect': 7,
  'outer_rx': 3,
  'inner_rx': 1.5,
}

////////////////////////////////////////////////////////////////////////////////////////////////
// Colors and icon
////////////////////////////////////////////////////////////////////////////////////////////////

// Color for dropdown menu
export var dropdown_color = {
  'mouseover': '#EEEEEE', 
  'mouseout': '#FFFFFF'
}

export var option_box_style = {
  'option-height': 25,
  'option-tb-margin': 0,
  'option-top': 8,
  'option-bot': 3,
  'highlight-opacity': 0.2
}

// Node colors
export var node_color = {
  'original': '#abdda4', // green
  'original-and-target': '#fdae61', // orange
  'target': '#2b83ba', // blue
  'attack-only': '#d7191c' // red
}

// Node opacity
export var node_opacity = {
  'activated': 1,
  'deactivated': 0.1
}

// Fontawsome icon (https://fontawesome.com/cheatsheet?from=io)
export var icons = {
  'angle-up': '\uf106', 
  'angle-down': '\uf107',
  'caret-up': '\uf0d8',
  'caret-down': '\uf0d7',
  'check-circle': '\uf058',
  'check-square': '\uf14a',
  'toggle-on': '\uf205',
  'toggle-off': '\uf204'
}

////////////////////////////////////////////////////////////////////////////////////////////////
// Nodes
////////////////////////////////////////////////////////////////////////////////////////////////

export var node_box_style = {
  'left': 40, 
  'width': 430, 
  'height': 85,
  'fv-left': 10,
  'fv-top': 10,
  'fv-width': 65,
  'fv-height': 65,
  'fv-ex-padding': 10,
  'ex-top': 10,
  'ex-padding': 5,
  'ex-width': 30,
  'ex-height': 30,
  'act-ex-padding': 35,
  'act-plot-top': 10 + 2,
  'act-plot-width': 120 - 2,
  'act-plot-height': 53
}
//////////////////////////////////////////////////////////////////////////////////////////
// Import variables
//////////////////////////////////////////////////////////////////////////////////////////

import { 
  class_pairs
} from './constant.js';

import {
  dropdown_color,
  option_box_style
} from './style.js'

//////////////////////////////////////////////////////////////////////////////////////////
// Global variables
//////////////////////////////////////////////////////////////////////////////////////////

export var selected_class = {'original': '-', 'target': '-'}

//////////////////////////////////////////////////////////////////////////////////////////
// Generate header
//////////////////////////////////////////////////////////////////////////////////////////

// Generate header template
draw_horizontal_line()
draw_title('Bluff')
draw_subtitle()

// Generate dropdown menu for selecting classes
gen_class_dropdown(class_pairs, 'header-subtitle-class-dropdown-original', 'original')
gen_class_dropdown(class_pairs, 'header-subtitle-class-dropdown-target', 'target')

//////////////////////////////////////////////////////////////////////////////////////////
// Main division
//////////////////////////////////////////////////////////////////////////////////////////

function draw_horizontal_line() {
  var header_horizontal_line = document.createElement('hr')
  header_horizontal_line.setAttribute('id', 'header-horizontal-line')
  header_horizontal_line.setAttribute('noshade', 'true')
  header.appendChild(header_horizontal_line)
}

function draw_title(title) {
  var header_title = document.createElement('div')
  var main_title = document.createElement('div') 
  var header = document.getElementById('header')
  header_title.setAttribute('id', 'header-title')
  main_title.setAttribute('id', 'main-title')
  main_title.innerText = title
  header.appendChild(header_title)
  header_title.appendChild(main_title)
}

function draw_subtitle() {
  // Generate subtitle
  var sub_title = document.createElement('div')
  var sub_title_1 = document.createElement('div')
  var sub_title_2 = document.createElement('div')
  var sub_title_2_1 = document.createElement('div')
  var sub_title_2_2 = document.createElement('div')
  var sub_title_2_3 = document.createElement('div')
  var sub_title_2_4 = document.createElement('div')
  sub_title.setAttribute('id', 'sub-title')
  sub_title_1.innerText = 'Understand how an attack make a model'
  sub_title_2_1.innerText = 'misclassify'
  sub_title_2_3.innerText = 'into'

  // Append the subtitle
  var header_title = document.getElementById('header-title')
  header_title.appendChild(sub_title)
  sub_title.appendChild(sub_title_1)
  sub_title.appendChild(sub_title_2)
  sub_title_2.appendChild(sub_title_2_1)
  sub_title_2.appendChild(sub_title_2_2)
  sub_title_2.appendChild(sub_title_2_3)
  sub_title_2.appendChild(sub_title_2_4)
  sub_title_1.setAttribute('id', 'header-sub-title-1')
  sub_title_2.setAttribute('id', 'header-sub-title-2')
  sub_title_2_1.setAttribute('class', 'header-sub-title')
  sub_title_2_2.setAttribute('class', 'header-sub-title')
  sub_title_2_3.setAttribute('class', 'header-sub-title')
  sub_title_2_4.setAttribute('class', 'header-sub-title')
  sub_title_2_2.setAttribute('id', 'header-subtitle-class-dropdown-original')
  sub_title_2_4.setAttribute('id', 'header-subtitle-class-dropdown-target')
}


//////////////////////////////////////////////////////////////////////////////////////////
// Generate dropdown menu
//////////////////////////////////////////////////////////////////////////////////////////

function gen_class_dropdown(class_pairs, parent_id, original_or_target) {
  // Add svgs
  d3.select('#svg-class-option-box')
    .append('svg')
    .attr('id', 'svg-class-option-box-' + original_or_target)

  // Create dropdown menu
  create_dropdown_menu()

  // Add options
  create_dropdown_options()

  // Functions to generate dropdown menu
  function create_dropdown_menu() {
    // Define dropdown menu
    var dropdown = document.createElement('div')
    dropdown.setAttribute('id', 'class-dropdown-' + original_or_target)
    dropdown.setAttribute('class', 'class-dropdown')
  
    // Define icon
    var dropdown_icon = document.createElement('div')
    dropdown_icon.setAttribute('id', 'class-dropdown-icon-' + original_or_target)
    dropdown_icon.setAttribute('class', 'class-dropdown-icon')
    dropdown_icon.innerHTML = '<i class="fas fa-angle-down class-dropdown-icon-unfolded"></i>'

    // Define display value, and show default value
    var display_val = document.createElement('div')
    display_val.setAttribute('id', 'class-dropdown-text-' + original_or_target)
    display_val.setAttribute('class', 'class-dropdown-text')
    display_val.innerText = get_default_class_name()
    
    // Append the element to the document
    var parent = document.getElementById(parent_id)
    parent.appendChild(dropdown)
    dropdown.appendChild(display_val)
    dropdown.appendChild(dropdown_icon)
  }

  function create_dropdown_options() {

    // Mouseover, mouseout on the dropdown menu
    var dropdown = document.getElementById('class-dropdown-' + original_or_target)
    dropdown.onmouseover = dropdown_mouseover
    dropdown.onmouseout = dropdown_mouseout
    dropdown.onclick = dropdown_click

    // Get x for option box
    var [x, d1, d2, y] = get_absolute_position('class-dropdown-' + original_or_target)

    // Generate option box
    if (original_or_target == 'original') {
      var original_classes = Object.keys(class_pairs)
      gen_option_box(original_classes)
      gen_option_highlight_box(original_classes)
      gen_option_text(original_classes)
    } else if (original_or_target == 'target') {
      var all_target_classes = get_all_target_classes()
      gen_option_box(all_target_classes)
      gen_option_highlight_box(all_target_classes)
      gen_option_text(all_target_classes)
    }
    d3.select('#svg-class-option-box-' + original_or_target).style('display', 'none')

    function dropdown_mouseover() {
      this.style.cursor = 'pointer'
      this.style['background-color'] = dropdown_color['mouseover']
    }

    function dropdown_mouseout() {
      this.style['background-color'] = dropdown_color['mouseout']
    }

    function dropdown_click() {
      var dropdown_icon = document.getElementById('class-dropdown-icon-' + original_or_target)

      // Double click -> no change
      if (dropdown_icon.innerHTML.includes('up')) {
        d3.select('#svg-class-option-box-' + original_or_target).style('display', 'none')
        dropdown_icon.innerHTML = '<i class="fas fa-angle-down"></i>'
      } 
      // One click -> show options
      else {
        d3.select('#svg-class-option-box-' + original_or_target).style('display', 'block')
        dropdown_icon.innerHTML = '<i class="fas fa-angle-up"></i>'

        // Show only available target class
        if (original_or_target == 'target') { 
          show_available_target_classes()
        }
      }
      
    }

    function get_all_target_classes() {
      var all_target_classes = {}
      for (var original in class_pairs) {
        class_pairs[original].forEach(target_class => {
          all_target_classes[target_class] = true
        })
      }
      return Object.keys(all_target_classes)
    }

    function show_available_target_classes() {
      var curr_original = selected_class['original']
      if (curr_original != '-') {

        // Get the available target classes
        var available_target_classes = class_pairs[curr_original]

        // Set height of the option box
        d3.select('#class-option-box-' + original_or_target)
          .attr('height', get_option_box_height(available_target_classes))

        // Display off all hl box and text
        d3.selectAll('.class-option-hl-box-' + original_or_target)
          .style('display', 'none')
        d3.selectAll('.class-option-text-' + original_or_target)
          .style('display', 'none')
        
        // Display on for available target classes
        available_target_classes.forEach((target_class, i) => {
          d3.select('#class-option-hl-box-' + original_or_target + '-' + target_class)
            .style('display', 'block')
            .attr('y', option_y(i))
          d3.select('#class-option-text-' + original_or_target + '-' + target_class)
            .style('display', 'block')
            .attr('y', 20 + option_y(i))
        })
      }
    }

    function get_option_box_height(lst) {
      var option_box_height = option_box_style['option-top'] + option_box_style['option-bot']
      option_box_height += option_box_style['option-height'] * lst.length + 2 * option_box_style['option-tb-margin']
      return option_box_height
    }

    function gen_option_box(lst) {
      d3.select('#svg-class-option-box-' + original_or_target)
        .append('rect')
        .attr('id', 'class-option-box-' + original_or_target)
        .attr('class', 'class-option-box')
        .attr('x', x + 2)
      d3.select('#class-option-box-' + original_or_target)
        .attr('height', get_option_box_height(lst))
    }

    function gen_option_highlight_box(lst) {
      d3.select('#svg-class-option-box-' + original_or_target)
        .selectAll('target-classes')
        .data(lst)
        .enter()
        .append('rect')
        .attr('id', function(class_name) { return get_hl_box_id(class_name) })
        .attr('class', get_hl_box_class())
        .attr('x', x + 2)
        .attr('y', function(class_name, i) { return option_y(i) })
        .attr('height', option_box_style['option-height'])
        .style('opacity', function(class_name) { return get_hl_box_opacity(class_name) })
        .on('mouseover', function(class_name) { return option_mouseover(class_name) })
        .on('click', function(class_name) { return option_click(class_name) })

      function get_hl_box_opacity(class_name) {
        var curr_class = curr_class_display_name(original_or_target)
          if (class_name_for_display(class_name) == curr_class) {
            return option_box_style['highlight-opacity']
          } else {
            return 0
          }
      }

      function get_hl_box_class() {
        var c1 = 'class-option-hl-box'
        var c2 = c1 + '-' + original_or_target
        return [c1, c2].join(' ')
      }
    }

    function gen_option_text(lst) {
      d3.select('#svg-class-option-box-' + original_or_target)
        .selectAll('target-classes')
        .data(lst)
        .enter()
        .append('text')
        .attr('id', function(d) { return ['class-option-text', original_or_target, d].join('-')})
        .attr('class', get_text_class())
        .text(function(d) { return class_name_for_display(d) })
        .attr('x', x + 15)
        .attr('y', function(d, i) { return 20 + option_y(i) })
        .on('mouseover', function(class_name) { return option_mouseover(class_name) })
        .on('click', function(class_name) { return option_click(class_name) })
      
      function get_text_class() {
        var c1 = 'class-option-text'
        var c2 = c1 + '-' + original_or_target
        return [c1, c2].join(' ')
      }
    }

    function option_y(i) {
      return option_box_style['option-top'] + i * (option_box_style['option-height'] + option_box_style['option-tb-margin'])
    }

    function get_hl_box_id(class_name) {
      return ['class-option-hl-box', original_or_target, class_name].join('-')
    }

    function get_text_id(class_name) {
      return ['class-option-text', original_or_target, class_name].join('-')
    }

    function option_mouseover(class_name) {
      d3.select('#' + get_hl_box_id(class_name)).style('cursor', 'pointer')
      d3.select('#' + get_text_id(class_name)).style('cursor', 'pointer')
      d3.selectAll('.class-option-hl-box').style('opacity', 0)
      d3.select('#' + get_hl_box_id(class_name)).style('opacity', option_box_style['highlight-opacity'])
    }

    function option_click(class_name) {

      // If a new original class selected, Unselect target class
      if (original_or_target == 'original') {
        if (class_name != selected_class['original']) {
          selected_class['target'] = '-'
          d3.select('#class-dropdown-text-target').text('- - - Select - - -')
        }
      }

      var curr_class_text = document.getElementById('class-dropdown-text-' + original_or_target)
      curr_class_text.innerText = class_name_for_display(class_name)
      selected_class[original_or_target] = class_name
      d3.select('#' + 'svg-class-option-box-' + original_or_target).style('display', 'none')
      var dropdown_icon = document.getElementById('class-dropdown-icon-' + original_or_target)
      dropdown_icon.innerHTML = '<i class="fas fa-angle-down"></i>'

      
    }
  }

  function get_default_class_name() {
    if (original_or_target == 'original') {
      return '- - - Select First - - -'
      return class_name_for_display(class_pairs[0]['original'])
    } else {
      return '- - - Select Next - - -'
      return class_name_for_display(class_pairs[0]['target'][0])
    }
  }

  function class_name_for_display(class_name) {
    return class_name.replace(/_/g, ' ').toUpperCase()
  }

  function curr_class_display_name(original_or_target) {
    var curr_class = document.getElementById('class-dropdown-text-' + original_or_target).innerText
    return curr_class
  }
  
}

function get_absolute_position(element_id) {
  var element = document.getElementById(element_id)
  var rect = element.getBoundingClientRect();
  return [rect.left, rect.top, rect.right, rect.bottom]
}

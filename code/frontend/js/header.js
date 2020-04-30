//////////////////////////////////////////////////////////////////////////////////////////
// Import variables
//////////////////////////////////////////////////////////////////////////////////////////

import { 
  class_pairs
} from './constant.js';

import {
  dropdown_color,
  option_box_style,
  text_color
} from './style.js'

import {
  remove_graph,
  reload_graph
} from './attribution_graph.js'

//////////////////////////////////////////////////////////////////////////////////////////
// Global variables
//////////////////////////////////////////////////////////////////////////////////////////

export var selected_class = {
  'original': '-', 
  'target': '-'
}

//////////////////////////////////////////////////////////////////////////////////////////
// Generate header
//////////////////////////////////////////////////////////////////////////////////////////

// Generate header template
draw_title('Bluff')
draw_subtitle()
add_code_link()

// Generate dropdown menu for selecting classes
gen_class_dropdown(class_pairs, 'header-subtitle-class-dropdown-original', 'original')
gen_class_dropdown(class_pairs, 'header-subtitle-class-dropdown-target', 'target')

//////////////////////////////////////////////////////////////////////////////////////////
// Main division
//////////////////////////////////////////////////////////////////////////////////////////

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
  var sub_title_3 = document.createElement('div')
  var sub_title_4 = document.createElement('div')
  var sub_title_5 = document.createElement('div')
  sub_title.setAttribute('id', 'sub-title')
  sub_title_1.innerText = 'Understand how neural networks misclassify'
  sub_title_3.innerText = 'into'
  sub_title_5.innerText = 'when attacked'
  sub_title_3.style.paddingLeft = '5px'
  sub_title_3.style.paddingRight = '5px'
  sub_title_5.style.paddingLeft = '5px'
  sub_title_5.style.paddingRight = '5px'

  // Append the subtitle
  var header_title = document.getElementById('header-title')
  header_title.appendChild(sub_title)
  sub_title.appendChild(sub_title_1)
  sub_title.appendChild(sub_title_2)
  sub_title.appendChild(sub_title_3)
  sub_title.appendChild(sub_title_3)
  sub_title.appendChild(sub_title_4)
  sub_title.appendChild(sub_title_5)
  sub_title.setAttribute('id', 'sub-title')
  sub_title.setAttribute('class', 'header-sub-title')
  sub_title_1.setAttribute('class', 'header-sub-title')
  sub_title_2.setAttribute('class', 'header-sub-title header-option-title')
  sub_title_3.setAttribute('class', 'header-sub-title')
  sub_title_4.setAttribute('class', 'header-sub-title header-option-title')
  sub_title_5.setAttribute('class', 'header-sub-title')
  sub_title_2.setAttribute('id', 'header-subtitle-class-dropdown-original')
  sub_title_4.setAttribute('id', 'header-subtitle-class-dropdown-target')
  sub_title_2.style.borderBottomColor = text_color['original-header']
  sub_title_2.style.borderBottomWidth = '1px'
  sub_title_2.style.borderBottomStyle = 'solid'
  sub_title_4.style.borderBottomColor = text_color['target-header']
  sub_title_4.style.borderBottomWidth = '1px'
  sub_title_4.style.borderBottomStyle = 'solid'
  sub_title_2.style.color = text_color['original-header']
  sub_title_4.style.color = text_color['target-header']
}

function add_code_link() {
  var header = document.getElementById('header-title')
  var source_code_link = document.createElement('div')
  header.appendChild(source_code_link)
  source_code_link.innerHTML = '<i class="fab fa-github"></i>'
  source_code_link.id = 'source-code-link'
  source_code_link.style.cursor = 'pointer'
  $("#source-code-link").click(function() {
    window.location = 'https://github.com/poloclub/bluff'
    return false;
  });
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
    dropdown_icon.innerHTML = '<i class="fas fa-sort-down"></i>'

    // Define display value, and show default value
    var display_val = document.createElement('div')
    display_val.setAttribute('id', 'class-dropdown-text-' + original_or_target)
    display_val.setAttribute('class', 'class-dropdown-text')
    display_val.innerText = get_default_class_name()

    // Append the element to the document
    var parent = document.getElementById(parent_id)
    parent.appendChild(dropdown)
    parent.appendChild(dropdown_icon)
    dropdown.appendChild(display_val)
    
  }

  function create_dropdown_options() {

    // Mouseover, mouseout on the dropdown menu
    var dropdown = document.getElementById('class-dropdown-' + original_or_target)
    dropdown.onmouseover = dropdown_mouseover
    dropdown.onmouseout = dropdown_mouseout
    dropdown.onclick = dropdown_click

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
    }

    function dropdown_mouseout() {
      // this.style['background-color'] = dropdown_color['mouseout']
    }

    function dropdown_click() {
      
      // Make dropdown option g be in the right position
      var dropdown_id = 'class-dropdown-text-' + original_or_target
      var [left, top, right, bottom] = get_absolute_position(dropdown_id)
      d3.select('#g-class-option-box-' + original_or_target)
        .attr('transform', 'translate(' + left + ',0)')

      var dropdown_icon = document.getElementById('class-dropdown-icon-' + original_or_target)

      // Double click -> no change
      if (dropdown_icon.innerHTML.includes('up')) {
        d3.select('#svg-class-option-box-' + original_or_target).style('display', 'none')
        dropdown_icon.innerHTML = '<i class="fas fa-sort-down"></i>'
        dropdown_icon.style.transform = 'translate(0px, 0px)'
      } 
      // One click -> show options
      else {
        d3.select('#svg-class-option-box-' + original_or_target).style('display', 'block')
        dropdown_icon.innerHTML = '<i class="fas fa-sort-up"></i>'
        dropdown_icon.style.transform = 'translate(0px, 5px)'

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
            .attr('y', option_y(i) + 20)
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
        .append('g')
        .attr('id', 'g-class-option-box-' + original_or_target)
        .attr('transform', g_option_transform())

      d3.select('#g-class-option-box-' + original_or_target)
        .append('rect')
        .attr('id', 'class-option-box-' + original_or_target)
        .attr('class', 'class-option-box')

      d3.select('#class-option-box-' + original_or_target)
        .attr('height', get_option_box_height(lst))

      function g_option_transform() {
        var option_div = 'header-subtitle-class-dropdown-' + original_or_target
        var [left, top, right, bottom] = get_absolute_position(option_div)
        return 'translate(' + left + ',0)'
      }
    }

    function gen_option_highlight_box(lst) {
      d3.select('#g-class-option-box-' + original_or_target)
        .selectAll('target-classes')
        .data(lst)
        .enter()
        .append('rect')
        .attr('id', function(class_name) { return get_hl_box_id(class_name) })
        .attr('class', get_hl_box_class())
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
      d3.select('#g-class-option-box-' + original_or_target)
        .selectAll('target-classes')
        .data(lst)
        .enter()
        .append('text')
        .attr('id', function(d) { return ['class-option-text', original_or_target, d].join('-')})
        .attr('class', get_text_class())
        .text(function(d) { return class_name_for_display(d) })
        .attr('x', 15)
        .attr('y', function(d, i) { return 17 + option_y(i)})
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

          // Reset class selectionss
          selected_class['target'] = '-'
          d3.select('#class-dropdown-text-target').text('- - - Select - - -')
          remove_graph()
          remove_column_labels()
          

          // Make target option box be in the right position
          var target_subtitle_div = 'header-subtitle-class-dropdown-target'
          var [left, top, right, bottom] = get_absolute_position(target_subtitle_div)
          d3.select('#g-class-option-box-target')
            .attr('transform', 'translate(' + left + ',0)')

        }
      }

      var curr_class_text = document.getElementById('class-dropdown-text-' + original_or_target)
      curr_class_text.innerText = class_name_for_display(class_name)
      selected_class[original_or_target] = class_name
      d3.select('#' + 'svg-class-option-box-' + original_or_target).style('display', 'none')
      var dropdown_icon = document.getElementById('class-dropdown-icon-' + original_or_target)
      dropdown_icon.innerHTML = '<i class="fas fa-sort-down"></i>'
      dropdown_icon.style.transform = 'translate(0px, 0px)'

      if (original_or_target == 'target') {
        reload_graph()
      }
      
    }
  }

  function remove_column_labels() {
    d3.select('#column-original').remove()
    d3.select('#column-original-and-target').remove()
    d3.select('#column-target').remove()
    d3.select('#column-attack-only').remove()
  }

  function get_default_class_name() {
    if (original_or_target == 'original') {
      return '- - - Select First - - -'
    } else {
      return '- - - Select Next - - -'
    }
  }

  function curr_class_display_name(original_or_target) {
    var curr_class = document.getElementById('class-dropdown-text-' + original_or_target).innerText
    return curr_class
  }
  
}

export function class_name_for_display(class_name) {
  return class_name.replace(/_/g, ' ').toUpperCase()
}

export function get_absolute_position(element_id) {
  var element = document.getElementById(element_id)
  var rect = element.getBoundingClientRect();
  return [rect.left, rect.top, rect.right, rect.bottom]
}

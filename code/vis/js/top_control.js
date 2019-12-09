
// Define top-control div
var top_control = document.createElement('div')
top_control.setAttribute('id', 'top-control')
document.body.appendChild(top_control)

// Horizontal line
var top_control_horizontal_line = document.createElement('hr')
top_control_horizontal_line.setAttribute('id', 'top-control-horizontal-line')
top_control_horizontal_line.setAttribute('noshade', 'true')
top_control.appendChild(top_control_horizontal_line)

// Attack dropdown
var attack_type_control = gen_top_dropdown('top-control-attack-dropdown', 'Attack', 'FGM')
top_control.appendChild(attack_type_control)

// From class
var attack_from_class_control = gen_top_dropdown('top-control-from-dropdown', 'Attack from', 'Giant Panda', '#4488EE')
top_control.appendChild(attack_from_class_control)

// To class
var attack_to_class_control = gen_top_dropdown('top-control-to-dropdown', 'Attack to', 'Armadillo', '#FF5555')
top_control.appendChild(attack_to_class_control)

// Generate dropdown options
function gen_top_dropdown(dropdown_id, title, default_val, title_color) {
  // Define element
  var control = document.createElement('div')
  var control_title = document.createElement('div')
  var control_val = document.createElement('div')
  var control_title_color_box = document.createElement('div')
  var control_icon = document.createElement('div')
  
  // Define control overview
  control.setAttribute('id', dropdown_id)
  control.setAttribute('class', 'top-control-dropdown')

  // Define title
  control_title.setAttribute('id', dropdown_id + '-title')
  control_title.setAttribute('class', 'top-control-dropdown-title')
  control_title.innerText = title + ': '

  // Define value
  control_val.setAttribute('id', dropdown_id + '-val')
  control_val.setAttribute('class', 'top-control-dropdown-val')
  control_val.innerText = default_val

  // Define color box representing the title
  control_title_color_box.setAttribute('id', dropdown_id + '-colorbox')
  control_title_color_box.setAttribute('class', 'top-control-dropdown-colorbox')
  control_title_color_box.style.setProperty('background-color', title_color)

  // Define icon
  control_icon.setAttribute('id', dropdown_id + '-icon')
  control_icon.setAttribute('class', 'top-control-dropdown-icon')
  control_icon.innerHTML = '<i class="fas fa-caret-down"></i>'

  // Append the element to the document
  control.appendChild(control_title)
  control.appendChild(control_val)
  control.appendChild(control_title_color_box)
  control.appendChild(control_icon)
  return control
}
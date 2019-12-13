// TODO: Do not hard code this
var epss = [0.5, 1, 1.5, 2, 2.5, 3, 3.5]

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
var attack_type_control = gen_top_dropdown('top-control-attack-dropdown', 'Attack', 'FGM', null)
top_control.appendChild(attack_type_control)

// From class
var from_color = get_css_val('--attack-from-color')
console.log(from_color)
var attack_from_class_control = gen_top_dropdown('top-control-from-dropdown', 'Attack from', 'Giant Panda', from_color)
top_control.appendChild(attack_from_class_control)

// To class
var to_color = get_css_val('--attack-to-color')
var attack_to_class_control = gen_top_dropdown('top-control-to-dropdown', 'Attack to', 'Armadillo', to_color)
top_control.appendChild(attack_to_class_control)

// Attack strength control bar
var svg_attack_strength_control = d3
  .select('#top-control')
  .append('svg')
  .attr('id', 'svg-attack-strength')

svg_attack_strength_control
  .append('text')
  .attr('id', 'attack-strength-title')
  .text('Attack strength')
  .attr('x', 0)
  .attr('y', 23)

svg_attack_strength_control
  .append('rect')
  .attr('id', 'attack-strength-slidebar-background')
  .attr('class', 'attack-strength-slidebar')

var default_strength = 0.5
var max_attack_strength = 5
var strength_bar_length = 180
var front_bar_length = d3
  .scaleLinear()
  .domain([0, max_attack_strength])
  .range([0, strength_bar_length])
var bar_length_to_strength = d3
  .scaleLinear()
  .domain([0, strength_bar_length])
  .range([0, max_attack_strength])

svg_attack_strength_control
  .append('rect')
  .attr('id', 'attack-strength-slidebar-front')
  .attr('class', 'attack-strength-slidebar')
  .style('width', front_bar_length(default_strength))

var strength_drag = d3
  .drag()
  .on('start', function() {
    this.style.fill = d3.select(this).style('stroke')
  })
  .on('drag', function() {
    // XXX NEED TO QUANTIZE THE VALUE (only the printed value) with epss
    let mouse_x = d3.min([d3.max([0, d3.mouse(this)[0]]), strength_bar_length])
    let new_strength = bar_length_to_strength(mouse_x)
    d3.select('#attack-strength-circle').style('cx', mouse_x)
    d3.select('#attack-strength-slidebar-front').style('width', mouse_x)
    d3.select('#attack-strength-val').text(new_strength)
  })
  .on('end', function() {
    this.style.fill = 'white'
  })

svg_attack_strength_control
  .append('circle')
  .attr('id', 'attack-strength-circle')
  .style('cx', front_bar_length(default_strength))
  .on('mouseover', function() {this.style.cursor = 'pointer'})
  .call(strength_drag)

svg_attack_strength_control
  .append('text')
  .attr('id', 'attack-strength-val')
  .text(default_strength)
  .attr('x', 350)
  .attr('y', 23)

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
  control_title_color_box.style.setProperty('background', title_color)

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

function get_css_val(css_key) {
  return getComputedStyle(document.body).getPropertyValue(css_key)
}

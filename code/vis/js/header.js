
// Define header
var header = document.createElement('div')
header.setAttribute('id', 'header')
document.body.appendChild(header)

// Horizontal line
var header_horizontal_line = document.createElement('hr')
header_horizontal_line.setAttribute('id', 'header-horizontal-line')
header_horizontal_line.setAttribute('noshade', 'true')
header.appendChild(header_horizontal_line)

// Title
var header_title = document.createElement('div')
var main_title = document.createElement('div') 
var sub_title = document.createElement('div')
header_title.setAttribute('id', 'header-title')
main_title.setAttribute('id', 'main-title')
sub_title.setAttribute('id', 'sub-title')
main_title.innerText = 'Massif'
sub_title.innerText = ': title title title title'
header.appendChild(header_title)
header_title.appendChild(main_title)
header_title.appendChild(sub_title)
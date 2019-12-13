// Attribution graph title
var attribution_graph_title = document.createElement('div')
attribution_graph_title.innerText = 'ATTRIBUTION GRAPH'
attribution_graph_title.setAttribute('id', 'ag-title')
document.body.appendChild(attribution_graph_title)

// Analysis title
var analysis_title = document.createElement('div')
analysis_title.innerText = 'ANALYSIS'
analysis_title.setAttribute('id', 'analysis-title')
document.body.appendChild(analysis_title)

// Newline
var dummy_newline = document.createElement('div')
document.body.appendChild(dummy_newline)

// Define left svg
var svg_left = d3
  .select('body')
  .append('svg')
  .attr('id', 'svg-left')

// Define svg for attribution graph
var svg_ag = svg_left
  .append('svg')
  .attr('id', 'svg-ag')

// Define analysis div
var analysis_div = document.createElement('div')
analysis_div.setAttribute('id', 'analysis-txt')
analysis_div.innerText = "Analysis text"
document.body.appendChild(analysis_div)

function get_css_val(css_key) {
  return getComputedStyle(document.body).getPropertyValue(css_key)
}


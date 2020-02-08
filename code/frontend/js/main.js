////////////////////////////////////////////////////////////////////////////////////////////////
// Global variable
////////////////////////////////////////////////////////////////////////////////////////////////
var g_coords = {
  'original': {'x': 50, 'y': 50},
  'adversarial': {'x': 400, 'y': 50},
  'target': {'x': 750, 'y': 50}
}
var div_margins = {
  'original': 100 + 50,
  'adversarial': 50,
  'target': 50
}
var g_width = 300;
var g_height = 600;



// Attribution graph title
var attribution_graph_title = document.createElement('div')
attribution_graph_title.innerText = 'ATTRIBUTION GRAPH'
attribution_graph_title.setAttribute('id', 'ag-title')
document.body.appendChild(attribution_graph_title)

// Analysis title
// var analysis_title = document.createElement('div')
// analysis_title.innerText = 'ANALYSIS'
// analysis_title.setAttribute('id', 'analysis-title')
// document.body.appendChild(analysis_title)

// Newline
var dummy_newline = document.createElement('div')
document.body.appendChild(dummy_newline)

// Generate graph views
gen_attribution_graph_view('original')
gen_attribution_graph_view('adversarial')
gen_attribution_graph_view('target')
make_graph_view_zoomable('original')
make_graph_view_zoomable('adversarial')
make_graph_view_zoomable('target')



// Define analysis div
// var analysis_div = document.createElement('div')
// analysis_div.setAttribute('id', 'analysis-txt')
// analysis_div.innerText = "Analysis text"
// document.body.appendChild(analysis_div)

function gen_attribution_graph_view(graph_key) {

  // Generate div
  d3.select('body')
    .append('div')
    .attr('id', 'div-ag-' + graph_key)
    .attr('class', 'div-ag')
    .style('margin-left', div_margins[graph_key] + 'px')

  // Generate svg
  d3.select('#div-ag-' + graph_key)
    .append('svg')
    .attr('id', 'svg-ag-' + graph_key)
    .attr('class', 'svg-ag')

  // Generate g
  d3.select('#svg-ag-' + graph_key)
    .append('g')
    .attr('id', 'g-ag-' + graph_key)
    .attr('class', 'g-ag')

  // .... delete this
  d3.select('#g-ag-' + graph_key)
    .append('circle').attr('r', '10px').attr('cy', 300).attr('cx', 150)
  d3.select('#g-ag-' + graph_key)
    .append('circle').attr('r', '5px')
  d3.select('#g-ag-' + graph_key)
    .append('circle').attr('r', '5px').attr('cx', 300)
  d3.select('#g-ag-' + graph_key)
    .append('circle').attr('r', '5px').attr('cy', 600)
  d3.select('#g-ag-' + graph_key)
    .append('circle').attr('r', '5px').attr('cy', 600).attr('cx', 300)
}

function make_graph_view_zoomable(graph_key) {
  d3.select('#div-ag-' + graph_key)
    .call(
      d3.zoom()
        .on('zoom', function(){
          d3.select('#g-ag-' + graph_key)
            .attr('transform', d3.event.transform)
        })
    )
}

function graph_region_on_mouse(mouse_coords) {
  var mouse_x = mouse_coords[0]
  
  var limit = g_coords['original']['x'] + g_width
  if (mouse_x < limit) {
    return 'original'
  }

  limit = g_coords['adversarial']['x'] + g_width
  if (mouse_x < limit) {
    return 'adversarial'
  } 

  return 'target'
}

function get_css_val(css_key) {
  return getComputedStyle(document.body).getPropertyValue(css_key)
}


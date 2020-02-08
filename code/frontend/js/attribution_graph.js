
////////////////////////////////////////////////////////////////////////////////////////////////
// Set data directory
////////////////////////////////////////////////////////////////////////////////////////////////
var node_data_path = '../../data/sample-graphs/sample-node.json'
var file_list = [node_data_path]

////////////////////////////////////////////////////////////////////////////////////////////////
// Main part for drawing the attribution graphs 
////////////////////////////////////////////////////////////////////////////////////////////////
Promise.all(file_list.map(file => d3.json(file))).then(function(data) { 

  // Read the sample neurons
  var neuron_data = data[0]
  
  // Make the svgs
})


function get_css_val(css_key) {
  return getComputedStyle(document.body).getPropertyValue(css_key)
}
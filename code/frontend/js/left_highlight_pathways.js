import {
  what_to_see, 
  highlight_pathways_style,
  icons
} from './style.js'

import {
  update_node_opacity,
  update_graph_by_filter_graph,
  go_comparison_mode,
  update_edges_display
} from './attribution_graph.js'

import {
  gen_pathways_option_g,
  write_mode_option_title
} from './left_filter_pathways.js'

//////////////////////////////////////////////////////////////////////////////////////////
// Global variables
//////////////////////////////////////////////////////////////////////////////////////////

export var highlight_pathways = {
  'neurons': {
    'selected': 'activated',
    'top-k': 3
  },
  'connections': {
    'selected': 'activated',
    'top-k': 20
  } 
}

//////////////////////////////////////////////////////////////////////////////////////////
// Highlight pathways
//////////////////////////////////////////////////////////////////////////////////////////

gen_highlight_option_g()
write_highlight_neurons()
// write_highlight_connections()
// gen_pathways_option_g('highlight')
// add_what_to_highlight_options('highlight', 'what', 'What to Highlight')
// add_how_many_to_highlight_options('highlight', 'many', 'How many to Highlight')
// add_how_many_to_highlight_options('connections')
// update_highlight_bottons('neurons')
// update_highlight_bottons('connections')

//////////////////////////////////////////////////////////////////////////////////////////
// Functions
//////////////////////////////////////////////////////////////////////////////////////////

function gen_highlight_option_g() {
  d3.select('#svg-highlight-option')
    .append('g')
    .attr('id', 'g-highlight-option')

  write_mode_option_title('highlight', 'HIGHLIGHT PATHWAYS')

  d3.select('#g-highlight-option')
    .append('g')
    .attr('id', 'g-highlight-option-contents')

  d3.select('#g-highlight-option-contents')
    .append('g')
    .attr('id', 'g-highlight-neurons')
  
  d3.select('#g-highlight-option-contents')
    .append('g')
    .attr('id', 'g-highlight-connections')
}

function write_highlight_neurons() {
  // What neurons
  write_text('highlight-option-text-1', 'Highlight')
  gen_topk_neurons_dropdown()
  write_text('highlight-option-text-2', 'most')
  gen_most_what_neurons_dropdown()
  write_text('highlight-option-text-3', 'neurons by attack in each layer.')

  // // Most changed neurons
  
  // write_text('highlight-option-text-4', 'Specifically, most', 'most-changed-neurons')
  // gen_most_changed_neurons_dropdown('most-changed-neurons')
  // write_text('highlight-option-text-6', 'ones.', 'most-changed-neurons')
  // d3.selectAll('.most-changed-neurons').style('display', 'none')
  
  function write_text(id, text, c) {
    d3.select('#g-highlight-neurons')
      .append('text')
      .attr('id', id)
      .attr('class', c)
      .text(text)
  }

  function gen_topk_neurons_dropdown() {
    d3.select('#g-highlight-neurons')
      .append('g')
      .attr('id', 'highlight-option-k-neurons')

    d3.select('#highlight-option-k-neurons')
      .append('rect')
      .attr('id', 'highlight-option-k-neurons-rect')
      .attr('class', 'highlight-dropdown-rect')
      .attr('width', highlight_pathways_style['neurons-k-rect-width'])
      .attr('height', highlight_pathways_style['neurons-k-rect-height'])

    d3.select('#highlight-option-k-neurons')
      .append('line')
      .attr('id', 'highlight-option-k-neurons-line')
      .attr('class', 'highlight-dropdown-line')
      .attr('x1', 0)
      .attr('x2', highlight_pathways_style['neurons-k-rect-width'])
      .attr('y1', highlight_pathways_style['neurons-k-line-y'])
      .attr('y2', highlight_pathways_style['neurons-k-line-y'])

    d3.select('#highlight-option-k-neurons')
      .append('text')
      .attr('id', 'highlight-option-k-neurons-text')
      .attr('class', 'highlight-dropdown-text')
      .text(highlight_pathways['neurons']['top-k'])
    
    d3.select('#highlight-option-k-neurons')
      .append('text')
      .attr('id', 'highlight-option-k-neurons-icon')
      .attr('class', 'highlight-dropdown-icon')
      .attr('font-family', 'FontAwesome')
      .text(icons['caret-down'])
      .attr('x', highlight_pathways_style['neurons-k-icon-x'])

  }

  function gen_most_what_neurons_dropdown() {
    d3.select('#g-highlight-neurons')
      .append('g')
      .attr('id', 'highlight-option-what-neurons')
      .on('mouseover', function() { mouseover_most_what_neurons() })
      .on('click', function() { click_most_what_neurons() })

    gen_dropdown_bg_rect()
    gen_dropdown_line()
    gen_dropdown_text()
    gen_dropdown_icon()
    gen_dropdown_menu()

    function gen_dropdown_bg_rect() {
      d3.select('#highlight-option-what-neurons')
        .append('rect')
        .attr('id', 'highlight-option-what-neurons-rect')
        .attr('class', 'highlight-dropdown-rect')
        .attr('width', highlight_pathways_style['neurons-what-rect-width'])
        .attr('height', highlight_pathways_style['neurons-what-rect-height'])
    }

    function gen_dropdown_line() {
      d3.select('#highlight-option-what-neurons')
        .append('line')
        .attr('id', 'highlight-option-what-neurons-line')
        .attr('class', 'highlight-dropdown-line')
        .attr('x1', 0)
        .attr('x2', highlight_pathways_style['neurons-what-rect-width'])
        .attr('y1', highlight_pathways_style['neurons-what-line-y'])
        .attr('y2', highlight_pathways_style['neurons-what-line-y'])
    }

    function gen_dropdown_text() {
      d3.select('#highlight-option-what-neurons')
        .append('text')
        .attr('id', 'highlight-option-what-neurons-text')
        .attr('class', 'highlight-dropdown-text')
        .text(highlight_pathways['neurons']['selected'])
    }

    function gen_dropdown_icon() {
      d3.select('#highlight-option-what-neurons')
        .append('text')
        .attr('id', 'highlight-option-what-neurons-icon')
        .attr('class', 'highlight-dropdown-icon')
        .attr('font-family', 'FontAwesome')
        .text(icons['caret-down'])
        .attr('x', highlight_pathways_style['neurons-what-icon-x'])
    }

    function gen_dropdown_menu() {
      // Setting
      gen_basic_bg()

      // Add activated
      add_activated_neurons()

      // Add changed
      add_changed_neurons()

      // Add excited
      add_excited_neurons()

      // Add inhibited
      add_inhibited_neurons()
      
      // Functions
      function gen_basic_bg() {
        d3.select('#g-highlight-option-contents')
          .append('g')
          .attr('id', 'g-dropdown-what-neurons')
          .style('display', 'none')

        d3.select('#g-dropdown-what-neurons') 
          .append('rect')
          .attr('id', 'dropdown-what-neurons-rect')
          .attr('class', 'dropdown-menu-bg-rect')
          .attr('width', highlight_pathways_style['neurons-what-rect-width'])
          .attr('height', highlight_pathways_style['neurons-what-dropdown-bg-rect-height'])
      }

      function add_activated_neurons() {
        d3.select('#g-dropdown-what-neurons')
          .append('g')
          .attr('id', 'g-dropdown-menu-activated-neurons')
          .on('mouseover', function() { mouseover_activated() })
          .on('click', function() { click_activated() })

        d3.select('#g-dropdown-menu-activated-neurons')
          .append('rect')
          .attr('id', 'dropdown-menu-rect-activated-neurons')
          .attr('class', 'dropdown-item-bg-rect dropdown-item-bg-rect-neurons')
          .attr('width', highlight_pathways_style['neurons-what-rect-width'])
          .attr('height', highlight_pathways_style['dropdown-menu-rect-height'])

        d3.select('#g-dropdown-menu-activated-neurons')
          .append('text')
          .attr('id', 'dropdown-menu-text-activated-neurons')
          .attr('class', 'dropdown-item-text')
          .text('activated')

        function mouseover_activated() {
          d3.select('#g-dropdown-menu-activated-neurons').style('cursor', 'pointer')
          d3.selectAll('.dropdown-item-bg-rect-neurons').style('fill', 'white')
          d3.select('#dropdown-menu-rect-activated-neurons').style('fill', 'lightgray')
        }
  
        function click_activated() {
          d3.select('#highlight-option-what-neurons-text').text('activated')
          d3.select('#g-dropdown-what-neurons').style('display', 'none')
          highlight_pathways['neurons']['selected'] = 'activated'
          highlight_pathways['neurons']['sub-selected'] = '-'
          d3.selectAll('.most-changed-neurons').style('display', 'none')
          update_node_opacity()
        }
      }

      function add_changed_neurons() {
        d3.select('#g-dropdown-what-neurons')
          .append('g')
          .attr('id', 'g-dropdown-menu-changed-neurons')
          .on('mouseover', function() { mouseover_changed() })
          .on('click', function() { click_changed() })

        d3.select('#g-dropdown-menu-changed-neurons')
          .append('rect')
          .attr('id', 'dropdown-menu-rect-changed-neurons')
          .attr('class', 'dropdown-item-bg-rect dropdown-item-bg-rect-neurons')
          .attr('width', highlight_pathways_style['neurons-what-rect-width'])
          .attr('height', highlight_pathways_style['dropdown-menu-rect-height'])

        d3.select('#g-dropdown-menu-changed-neurons')
          .append('text')
          .attr('id', 'dropdown-menu-text-changed-neurons')
          .attr('class', 'dropdown-item-text')
          .text('changed')

        function mouseover_changed() {
          d3.select('#g-dropdown-menu-changed-neurons').style('cursor', 'pointer')
          d3.selectAll('.dropdown-item-bg-rect-neurons').style('fill', 'white')
          d3.select('#dropdown-menu-rect-changed-neurons').style('fill', 'lightgray')
        }
  
        function click_changed() {
          d3.select('#highlight-option-what-neurons-text').text('changed')
          d3.select('#g-dropdown-what-neurons').style('display', 'none')
          highlight_pathways['neurons']['selected'] = 'changed'
          d3.selectAll('.most-changed-neurons').style('display', 'block')
          d3.select('#highlight-option-changed-neurons-text').text(highlight_pathways['neurons']['sub-selected'])
          update_node_opacity()
        }
      }

      function add_excited_neurons() {
        d3.select('#g-dropdown-what-neurons')
          .append('g')
          .attr('id', 'g-dropdown-menu-excited-neurons')
          .on('mouseover', function() { mouseover_excited() })
          .on('click', function() { click_excited() })

        d3.select('#g-dropdown-menu-excited-neurons')
          .append('rect')
          .attr('id', 'dropdown-menu-rect-excited-neurons')
          .attr('class', 'dropdown-item-bg-rect dropdown-item-bg-rect-neurons')
          .attr('width', highlight_pathways_style['neurons-what-rect-width'])
          .attr('height', highlight_pathways_style['dropdown-menu-rect-height'])

        d3.select('#g-dropdown-menu-excited-neurons')
          .append('text')
          .attr('id', 'dropdown-menu-text-excited-neurons')
          .attr('class', 'dropdown-item-text')
          .text('excited')

        function mouseover_excited() {
          d3.select('#g-dropdown-menu-excited-neurons').style('cursor', 'pointer')
          d3.selectAll('.dropdown-item-bg-rect-neurons').style('fill', 'white')
          d3.select('#dropdown-menu-rect-excited-neurons').style('fill', 'lightgray')
        }
  
        function click_excited() {
          d3.select('#highlight-option-what-neurons-text').text('excited')
          d3.select('#g-dropdown-what-neurons').style('display', 'none')
          highlight_pathways['neurons']['selected'] = 'excited'
          d3.selectAll('.most-excited-neurons').style('display', 'block')
          d3.select('#highlight-option-excited-neurons-text').text(highlight_pathways['neurons']['selected'])
          update_node_opacity()
        }
      }

      function add_inhibited_neurons() {
        d3.select('#g-dropdown-what-neurons')
          .append('g')
          .attr('id', 'g-dropdown-menu-inhibited-neurons')
          .on('mouseover', function() { mouseover_inhibited() })
          .on('click', function() { click_inhibited() })

        d3.select('#g-dropdown-menu-inhibited-neurons')
          .append('rect')
          .attr('id', 'dropdown-menu-rect-inhibited-neurons')
          .attr('class', 'dropdown-item-bg-rect dropdown-item-bg-rect-neurons')
          .attr('width', highlight_pathways_style['neurons-what-rect-width'])
          .attr('height', highlight_pathways_style['dropdown-menu-rect-height'])

        d3.select('#g-dropdown-menu-inhibited-neurons')
          .append('text')
          .attr('id', 'dropdown-menu-text-inhibited-neurons')
          .attr('class', 'dropdown-item-text')
          .text('inhibited')

        function mouseover_inhibited() {
          d3.select('#g-dropdown-menu-inhibited-neurons').style('cursor', 'pointer')
          d3.selectAll('.dropdown-item-bg-rect-neurons').style('fill', 'white')
          d3.select('#dropdown-menu-rect-inhibited-neurons').style('fill', 'lightgray')
        }
  
        function click_inhibited() {
          d3.select('#highlight-option-what-neurons-text').text('inhibited')
          d3.select('#g-dropdown-what-neurons').style('display', 'none')
          highlight_pathways['neurons']['selected'] = 'inhibited'
          d3.selectAll('.most-inhibited-neurons').style('display', 'block')
          d3.select('#highlight-option-inhibited-neurons-text').text(highlight_pathways['neurons']['selected'])
          update_node_opacity()
        }
      }
      
    }

    function mouseover_most_what_neurons() {
      d3.select('#highlight-option-what-neurons').style('cursor', 'pointer')
    }

    function click_most_what_neurons() {
      d3.select('#g-highlight-option-what-neurons').style('cursor', 'pointer')
      d3.select('#g-dropdown-what-neurons').style('display', 'block')
    }
  }

  // function gen_most_changed_neurons_dropdown(c) {
    
  //   d3.select('#g-highlight-neurons')
  //     .append('g')
  //     .attr('id', 'highlight-option-changed-neurons')
  //     .attr('class', c)
  //     .on('mouseover', function() { mouseover_most_changed_neurons() }) 
  //     .on('click', function() { click_most_changed_neurons() }) 

  //   gen_dropdown_bg()
  //   gen_dropdown_line()
  //   gen_dropdown_text()
  //   gen_dropdown_icon()
  //   gen_dropdown_menu()
    
  //   function gen_dropdown_bg() {
  //     d3.select('#highlight-option-changed-neurons')
  //       .append('rect')
  //       .attr('id', 'highlight-option-changed-neurons-rect')
  //       .attr('class', 'highlight-dropdown-rect')
  //       .attr('width', highlight_pathways_style['neurons-changed-rect-width'])
  //       .attr('height', highlight_pathways_style['neurons-changed-rect-height'])
  //   }

  //   function gen_dropdown_line() {
  //     d3.select('#highlight-option-changed-neurons')
  //       .append('line')
  //       .attr('id', 'highlight-option-changed-neurons-line')
  //       .attr('class', 'highlight-dropdown-line')
  //       .attr('x1', 0)
  //       .attr('x2', highlight_pathways_style['neurons-changed-rect-width'])
  //       .attr('y1', highlight_pathways_style['neurons-changed-line-y'])
  //       .attr('y2', highlight_pathways_style['neurons-changed-line-y'])
  //   }

  //   function gen_dropdown_text() {
  //     d3.select('#highlight-option-changed-neurons')
  //       .append('text')
  //       .attr('id', 'highlight-option-changed-neurons-text')
  //       .attr('class', 'highlight-dropdown-text')
  //       .text(highlight_pathways['neurons']['sub-selected'])
  //   }

  //   function gen_dropdown_icon() {
  //     d3.select('#highlight-option-changed-neurons')
  //       .append('text')
  //       .attr('id', 'highlight-option-changed-neurons-icon')
  //       .attr('class', 'highlight-dropdown-icon')
  //       .attr('font-family', 'FontAwesome')
  //       .text(icons['caret-down'])
  //       .attr('x', highlight_pathways_style['neurons-changed-icon-x'])
  //   }

    // function gen_dropdown_menu() {
    //   // Setting
    //   gen_basic_bg()

    //   // Add excited
    //   add_excited_neurons()

    //   // Add inhibited
    //   add_inhibited_neurons()
      
    //   // Functions
    //   function gen_basic_bg() {
    //     d3.select('#g-highlight-option-contents')
    //       .append('g')
    //       .attr('id', 'g-dropdown-changed-neurons')
    //       .style('display', 'none')

    //     d3.select('#g-dropdown-changed-neurons') 
    //       .append('rect')
    //       .attr('id', 'dropdown-changed-neurons-rect')
    //       .attr('class', 'dropdown-menu-bg-rect')
    //       .attr('width', highlight_pathways_style['neurons-changed-rect-width'])
    //       .attr('height', highlight_pathways_style['neurons-changed-dropdown-bg-rect-height'])
    //   }

    //   function add_excited_neurons() {
    //     d3.select('#g-dropdown-changed-neurons')
    //       .append('g')
    //       .attr('id', 'g-dropdown-menu-excited-neurons')
    //       .on('mouseover', function() { mouseover_excited() })
    //       .on('click', function() { click_excited() })

    //     d3.select('#g-dropdown-menu-excited-neurons')
    //       .append('rect')
    //       .attr('id', 'dropdown-menu-rect-excited-neurons')
    //       .attr('class', 'dropdown-item-bg-rect')
    //       .attr('width', highlight_pathways_style['neurons-changed-rect-width'])
    //       .attr('height', highlight_pathways_style['dropdown-menu-rect-height'])

    //     d3.select('#g-dropdown-menu-excited-neurons')
    //       .append('text')
    //       .attr('id', 'dropdown-menu-text-excited-neurons')
    //       .attr('class', 'dropdown-item-text')
    //       .text('excited')
    //   }

    //   function add_inhibited_neurons() {
    //     d3.select('#g-dropdown-changed-neurons')
    //       .append('g')
    //       .attr('id', 'g-dropdown-menu-inhibited-neurons')
    //       .on('mouseover', function() { mouseover_inhibited() })
    //       .on('click', function() { click_inhibited() })

    //     d3.select('#g-dropdown-menu-inhibited-neurons')
    //       .append('rect')
    //       .attr('id', 'dropdown-menu-rect-inhibited-neurons')
    //       .attr('class', 'dropdown-item-bg-rect')
    //       .attr('width', highlight_pathways_style['neurons-changed-rect-width'])
    //       .attr('height', highlight_pathways_style['dropdown-menu-rect-height'])

    //       d3.select('#g-dropdown-menu-inhibited-neurons')
    //       .append('text')
    //       .attr('id', 'dropdown-menu-text-inhibited-neurons')
    //       .attr('class', 'dropdown-item-text')
    //       .text('inhibited')

    //   }

    //   function mouseover_excited() {
    //     d3.select('#g-dropdown-menu-excited-neurons').style('cursor', 'pointer')
    //     d3.select('#dropdown-menu-rect-excited-neurons').style('fill', 'lightgray')
    //     d3.select('#dropdown-menu-rect-inhibited-neurons').style('fill', 'white')
    //   }

    //   function click_excited() {
    //     d3.select('#highlight-option-changed-neurons-text').text('excited')
    //     d3.select('#g-dropdown-changed-neurons').style('display', 'none')
    //     highlight_pathways['neurons']['selected'] = 'changed'
    //     highlight_pathways['neurons']['sub-selected'] = 'excited'
    //     update_node_opacity()
    //   }

    //   function mouseover_inhibited() {
    //     d3.select('#g-dropdown-menu-inhibited-neurons').style('cursor', 'pointer')
    //     d3.select('#dropdown-menu-rect-excited-neurons').style('fill', 'white')
    //     d3.select('#dropdown-menu-rect-inhibited-neurons').style('fill', 'lightgray')
    //   }

    //   function click_inhibited() {
    //     d3.select('#highlight-option-changed-neurons-text').text('inhibited')
    //     d3.select('#g-dropdown-changed-neurons').style('display', 'none')
    //     highlight_pathways['neurons']['selected'] = 'changed'
    //     highlight_pathways['neurons']['sub-selected'] = 'inhibited'
    //     update_node_opacity()
    //   }
    // }

    // function mouseover_most_changed_neurons() {
    //   d3.select('#highlight-option-changed-neurons').style('cursor', 'pointer')
    // }

    // function click_most_changed_neurons() {
    //   d3.select('#g-dropdown-changed-neurons').style('display', 'block')
    // }

  // }

}

function write_highlight_connections() {
  // What connections
  write_text('highlight-option-text-7', 'Out of all connections among such')
  write_text('highlight-option-text-8', 'neurons, highlight')
  gen_topk_connections_dropdown()
  write_text('highlight-option-text-9', '% of most')
  gen_most_what_connections_dropdown()
  write_text('highlight-option-text-10', 'connections by attack.')
  
  // Most changed connections
  write_text('highlight-option-text-11', 'Specifically, most', 'most-changed-connections')
  gen_most_changed_connections_dropdown('most-changed-connections')
  write_text('highlight-option-text-12', 'ones.', 'most-changed-connections')
  d3.selectAll('.most-changed-connections').style('display', 'none')

  function write_text(id, text, c) {
    d3.select('#g-highlight-connections')
      .append('text')
      .attr('id', id)
      .attr('class', c)
      .text(text)
  }

  function gen_topk_connections_dropdown() {
    d3.select('#g-highlight-connections')
      .append('g')
      .attr('id', 'highlight-option-k-connections')

    d3.select('#highlight-option-k-connections')
      .append('rect')
      .attr('id', 'highlight-option-k-connections-rect')
      .attr('class', 'highlight-dropdown-rect')
      .attr('width', highlight_pathways_style['connections-k-rect-width'])
      .attr('height', highlight_pathways_style['connections-k-rect-height'])

    d3.select('#highlight-option-k-connections')
      .append('line')
      .attr('id', 'highlight-option-k-connections-line')
      .attr('class', 'highlight-dropdown-line')
      .attr('x1', 0)
      .attr('x2', highlight_pathways_style['connections-k-rect-width'])
      .attr('y1', highlight_pathways_style['connections-k-line-y'])
      .attr('y2', highlight_pathways_style['connections-k-line-y'])

    d3.select('#highlight-option-k-connections')
      .append('text')
      .attr('id', 'highlight-option-k-connections-text')
      .attr('class', 'highlight-dropdown-text')
      .text(highlight_pathways['connections']['top-k'])
    
    d3.select('#highlight-option-k-connections')
      .append('text')
      .attr('id', 'highlight-option-k-connections-icon')
      .attr('class', 'highlight-dropdown-icon')
      .attr('font-family', 'FontAwesome')
      .text(icons['caret-down'])
      .attr('x', highlight_pathways_style['connections-k-icon-x'])

  }

  function gen_most_what_connections_dropdown() {
    gen_most_what_connections_g()
    gen_most_what_connections_rect()
    gen_most_what_connections_line()
    gen_most_what_connections_text()
    gen_most_what_connectinos_icon()
    gen_dropdown_menu()

    function gen_most_what_connections_g() {
      d3.select('#g-highlight-connections')
        .append('g')
        .attr('id', 'highlight-option-what-connections')
        .on('mouseover', function() { this.style.cursor = 'pointer' })
        .on('click', function() { click_most_what_connections() })
    }

    function gen_most_what_connections_rect() {
      d3.select('#highlight-option-what-connections')
        .append('rect')
        .attr('id', 'highlight-option-what-connections-rect')
        .attr('class', 'highlight-dropdown-rect')
        .attr('width', highlight_pathways_style['connections-what-rect-width'])
        .attr('height', highlight_pathways_style['connections-what-rect-height'])
    }

    function gen_most_what_connections_line() {
      d3.select('#highlight-option-what-connections')
        .append('line')
        .attr('id', 'highlight-option-what-connections-line')
        .attr('class', 'highlight-dropdown-line')
        .attr('x1', 0)
        .attr('x2', highlight_pathways_style['connections-what-rect-width'])
        .attr('y1', highlight_pathways_style['connections-what-line-y'])
        .attr('y2', highlight_pathways_style['connections-what-line-y'])
    }

    function gen_most_what_connections_text() {
      d3.select('#highlight-option-what-connections')
        .append('text')
        .attr('id', 'highlight-option-what-connections-text')
        .attr('class', 'highlight-dropdown-text')
        .text(highlight_pathways['connections']['selected'])
    }

    function gen_most_what_connectinos_icon() {
      d3.select('#highlight-option-what-connections')
        .append('text')
        .attr('id', 'highlight-option-what-connections-icon')
        .attr('class', 'highlight-dropdown-icon')
        .attr('font-family', 'FontAwesome')
        .text(icons['caret-down'])
        .attr('x', highlight_pathways_style['connections-what-icon-x'])
    } 

    function gen_dropdown_menu() {
      // Setting
      gen_basic_bg()

      // Add activated
      add_activated_connections()

      // Add changed
      add_changed_connections()

      // Add excited
      add_excited_connections()
      
      // Functions
      function gen_basic_bg() {
        d3.select('#g-highlight-option-contents')
          .append('g')
          .attr('id', 'g-dropdown-what-connections')
          // .style('display', 'none')

        d3.select('#g-dropdown-what-connections') 
          .append('rect')
          .attr('id', 'dropdown-what-connections-rect')
          .attr('class', 'dropdown-menu-bg-rect')
          .attr('width', highlight_pathways_style['connections-what-rect-width'])
          .attr('height', highlight_pathways_style['connections-what-dropdown-bg-rect-height'])
      }

      function add_activated_connections() {
        d3.select('#g-dropdown-what-connections')
          .append('g')
          .attr('id', 'g-dropdown-menu-activated-connections')
          .on('mouseover', function() { mouseover_activated() })
          .on('click', function() { click_activated() })

        d3.select('#g-dropdown-menu-activated-connections')
          .append('rect')
          .attr('id', 'dropdown-menu-rect-activated-connections')
          .attr('class', 'dropdown-item-bg-rect')
          .attr('width', highlight_pathways_style['connections-what-rect-width'])
          .attr('height', highlight_pathways_style['dropdown-menu-rect-height'])

        d3.select('#g-dropdown-menu-activated-connections')
          .append('text')
          .attr('id', 'dropdown-menu-text-activated-connections')
          .attr('class', 'dropdown-item-text')
          .text('activated')
      }

      function add_changed_connections() {
        d3.select('#g-dropdown-what-connections')
          .append('g')
          .attr('id', 'g-dropdown-menu-changed-connections')
          .on('mouseover', function() { mouseover_changed() })
          .on('click', function() { click_changed() })

        d3.select('#g-dropdown-menu-changed-connections')
          .append('rect')
          .attr('id', 'dropdown-menu-rect-changed-connections')
          .attr('class', 'dropdown-item-bg-rect')
          .attr('width', highlight_pathways_style['connections-what-rect-width'])
          .attr('height', highlight_pathways_style['dropdown-menu-rect-height'])

        d3.select('#g-dropdown-menu-changed-connections')
          .append('text')
          .attr('id', 'dropdown-menu-text-changed-connections')
          .attr('class', 'dropdown-item-text')
          .text('changed')
      }

      function add_excited_connections() {
        d3.select('#g-dropdown-what-connections')
          .append('g')
          .attr('id', 'g-dropdown-menu-excited-connections')
          .on('mouseover', function() { mouseover_excited() })
          .on('click', function() { click_excited() })

        d3.select('#g-dropdown-menu-excited-connections')
          .append('rect')
          .attr('id', 'dropdown-menu-rect-excited-connections')
          .attr('class', 'dropdown-item-bg-rect')
          .attr('width', highlight_pathways_style['connections-what-rect-width'])
          .attr('height', highlight_pathways_style['dropdown-menu-rect-height'])

        d3.select('#g-dropdown-menu-excited-connections')
          .append('text')
          .attr('id', 'dropdown-menu-text-excited-connections')
          .attr('class', 'dropdown-item-text')
          .text('excited')
      }

      function mouseover_activated() {
        d3.select('#g-dropdown-menu-activated-connections').style('cursor', 'pointer')
        d3.select('#dropdown-menu-rect-activated-connections').style('fill', 'lightgray')
        d3.select('#dropdown-menu-rect-changed-connections').style('fill', 'white')
      }

      function click_activated() {
        d3.select('#highlight-option-what-connections-text').text('activated')
        d3.select('#g-dropdown-what-connections').style('display', 'none')
        highlight_pathways['connections']['selected'] = 'activated'
        highlight_pathways['connections']['sub-selected'] = '-'
        d3.selectAll('.most-changed-connections').style('display', 'none')
        update_edges_display(highlight_pathways['connections']['top-k'], 'activated')
      }

      function mouseover_changed() {
        d3.select('#g-dropdown-menu-changed-connections').style('cursor', 'pointer')
        d3.select('#dropdown-menu-rect-activated-connections').style('fill', 'white')
        d3.select('#dropdown-menu-rect-changed-connections').style('fill', 'lightgray')
      }

      function click_changed() {
        d3.select('#highlight-option-what-connections-text').text('changed')
        d3.select('#g-dropdown-what-connections').style('display', 'none')
        highlight_pathways['connections']['selected'] = 'changed'
        highlight_pathways['connections']['sub-selected'] = 'excited'
        d3.selectAll('.most-changed-connections').style('display', 'block')
        d3.select('#highlight-option-changed-connections-text').text(highlight_pathways['connections']['sub-selected'])
        update_edges_display(highlight_pathways['connections']['top-k'], 'changed')
      }

      function mouseover_excited() {
        d3.select('#g-dropdown-menu-excited-connections').style('cursor', 'pointer')
        d3.select('#dropdown-menu-rect-excited-connections').style('fill', 'white')
        d3.select('#dropdown-menu-rect-changed-connections').style('fill', 'lightgray')
      }
    }

    function click_most_what_connections() {
      d3.select('#g-highlight-option-what-connections').style('cursor', 'pointer')
      d3.select('#g-dropdown-what-connections').style('display', 'block')
    }
  }

  function gen_most_changed_connections_dropdown(c) {
    d3.select('#g-highlight-connections')
      .append('g')
      .attr('id', 'highlight-option-changed-connections')
      .attr('class', c)

    d3.select('#highlight-option-changed-connections')
      .append('rect')
      .attr('id', 'highlight-option-changed-connections-rect')
      .attr('class', 'highlight-dropdown-rect')
      .attr('width', highlight_pathways_style['connections-changed-rect-width'])
      .attr('height', highlight_pathways_style['connections-changed-rect-height'])

      d3.select('#highlight-option-changed-connections')
      .append('line')
      .attr('id', 'highlight-option-changed-connections-line')
      .attr('class', 'highlight-dropdown-line')
      .attr('x1', 0)
      .attr('x2', highlight_pathways_style['connections-changed-rect-width'])
      .attr('y1', highlight_pathways_style['connections-changed-line-y'])
      .attr('y2', highlight_pathways_style['connections-changed-line-y'])

    d3.select('#highlight-option-changed-connections')
      .append('text')
      .attr('id', 'highlight-option-changed-connections-text')
      .attr('class', 'highlight-dropdown-text')
      .text(highlight_pathways['connections']['sub-selected'])
    
    d3.select('#highlight-option-changed-connections')
      .append('text')
      .attr('id', 'highlight-option-changed-connections-icon')
      .attr('class', 'highlight-dropdown-icon')
      .attr('font-family', 'FontAwesome')
      .text(icons['caret-down'])
      .attr('x', highlight_pathways_style['connections-changed-icon-x'])
  }
}



// function add_what_to_highlight_options(type, subtitle, subtitle_txt) {
  
//   gen_subtitle_g()
//   // draw_subtitle()

//   gen_option_g(['g', type, subtitle].join('-'), type, subtitle, 'most-activated')
//   gen_option_g(['g', type, subtitle].join('-'), type, subtitle, 'most-changed')

//   gen_what_option(type, subtitle, 'most-activated', 'Most activated')
//   gen_what_option(type, subtitle, 'most-changed', 'Most changed by attack')

//   gen_sub_option(type, subtitle, 'most-changed', ['excited', 'inhibited'])

//   // Functions
//   function gen_subtitle_g() {
//     d3.select('#g-' + type + '-option')
//       .append('g')
//       .attr('id', 'g-' + type + '-' + subtitle)
//   }

//   function draw_subtitle() {
//     d3.select('#g-' + type + '-' + subtitle)
//       .append('text')
//       .attr('id', ['option', 'subtitle', type, subtitle].join('-'))
//       .text(subtitle_txt)
//   }

//   function gen_option_g(parent_g_id, type, subtitle, option) { 
//     d3.select('#' + parent_g_id)
//       .append('g')
//       .attr('id', ['g', type, subtitle, option].join('-'))
//       .attr('transform', function() {
//         var x = what_to_see['option-x']
//         var y = what_to_see[option + '-y']
//         return 'translate(' + x + ',' + y + ')'
//       })
//   }

//   function gen_what_option(type, subtitle, what_option, option_txt) {
//     gen_option_botton_rect()
//     gen_option_botton_check_icon()
//     gen_option_text()
  
//     function gen_option_botton_rect() {
//       d3.select('#' + ['g', type, subtitle, what_option].join('-'))
//         .append('rect')
//         .attr('id', ['what-to-see-option-checkbox', subtitle, what_option].join('-'))
//         .attr('class', 'what-to-see-option-checkbox what-to-see-option-checkbox-' + type)
//         .attr('width', what_to_see['bt-width'])
//         .attr('height', what_to_see['bt-height'])
//         .on('mouseover', function() { this.style.cursor = 'pointer' })
//         .on('click', function() { return click_highlight_option(subtitle, what_option) })
//     }
  
//     function gen_option_botton_check_icon() {
//       d3.select('#' + ['g', type, subtitle, what_option].join('-'))
//         .append('text')
//         .attr('id', ['what-to-see-icon', subtitle, what_option].join('-'))
//         .attr('class', 'what-to-see-option-checkbox-icon what-to-see-option-checkbox-icon-' + type + '-' + subtitle)
//         .attr('font-family', 'FontAwesome')
//         .text(icons['check-square'])
//         .attr('x', -0.5)
//         .attr('y', what_to_see[what_option + '-text-y'])
//         .style('display', 'none') 
//         .on('mouseover', function() { this.style.cursor = 'pointer' })
//         .on('click', function() { return click_highlight_option(subtitle, what_option) })
//     }
  
//     function gen_option_text() {
//       console.log('option-text:', option_txt)
//       d3.select('#' + ['g', type, subtitle, what_option].join('-'))
//         .append('text')
//         .text(option_txt)
//         .attr('id', ['what-to-see-option-text', subtitle, what_option].join('-'))
//         .attr('class', 'what-to-see-option-text')
//         .attr('x', what_to_see['option-text-x'])
//         .attr('y', what_to_see[what_option + '-text-y'])
//     }
  
//   }

//   function gen_sub_option(type, subtitle, what_option, suboptions) {
//     gen_suboption_botton_rect()
//     gen_suboption_botton_check_icon()
//     gen_suboption_text()
  
//     function gen_suboption_botton_rect() {
//       d3.select('#' + ['g', type, subtitle, what_option].join('-'))
//         .selectAll('suboptions')
//         .data(suboptions)
//         .enter()
//         .append('rect')  
//         .attr('class', 'what-to-see-option-checkbox what-to-see-option-checkbox-' + type)
//         .attr('width', what_to_see['bt-width'])
//         .attr('height', what_to_see['bt-height'])
//         .attr('x', what_to_see['most-changed-suboption-x'])
//         .attr('y', function(d, i) { 
//           return what_to_see['most-changed-suboption-t'] + i * what_to_see['most-changed-suboption-h'] 
//         })
//         .on('mouseover', function() {this.style.cursor = 'pointer'})
//         .on('click', function(suboption) { return click_sub_option(subtitle, suboption) })
//     }
  
//     function gen_suboption_botton_check_icon() {
//       d3.select('#' + ['g', type, subtitle, what_option].join('-'))
//         .selectAll('suboptions')
//         .data(suboptions)
//         .enter()
//         .append('text')
//         .attr('id', function(suboption) { return ['what-to-see-icon-sub', subtitle, suboption].join('-') })
//         .attr('class', 'what-to-see-option-checkbox-icon what-to-see-option-checkbox-icon-' + type + '-' + subtitle)
//         .attr('font-family', 'FontAwesome')
//         .text(icons['check-square'])
//         .attr('x', what_to_see['most-changed-suboption-x'] - 0.5)
//         .attr('y', function(d, i) { return suboption_text_y(i) - 0.5 })
//         .style('display', 'none')
//         .on('mouseover', function() {this.style.cursor = 'pointer'})
//         .on('click', function(suboption) { return click_sub_option(subtitle, suboption) })
//     }
  
//     function gen_suboption_text() {
//       d3.select('#' + ['g', type, subtitle, what_option].join('-'))
//         .selectAll('suboptions')
//         .data(suboptions)
//         .enter()
//         .append('text')
//         .attr('id', function(suboption) { return ['what-to-see-option-text-sub-', subtitle, suboption].join('-') })
//         .attr('class', 'what-to-see-option-text what-to-see-option-text-' + type)
//         .attr('x', what_to_see['most-changed-suboption-x'] + what_to_see['option-text-x'])
//         .attr('y', function(d, i) { return suboption_text_y(i) })
//         .text(function(d) { return 'Most ' + d })
//     }
  
//     function suboption_text_y(i) {
//       var start_y = what_to_see['most-changed-suboption-t'] + what_to_see[what_option + '-text-y']
//       return start_y + i * what_to_see['most-changed-suboption-h'] 
//     }
//   }

//   function click_sub_option(subtitle, suboption) {
//     highlight_pathways[subtitle]['selected'] = 'most-changed'
//     highlight_pathways[subtitle]['sub-selected'] = suboption
//     update_highlight_bottons(subtitle)
//     update_node_opacity()
//     go_comparison_mode()
//   }
  
//   function click_highlight_option(subtitle, what_option) {
//     highlight_pathways[subtitle]['selected'] = what_option
//     if (what_option == 'most-changed') {
//       highlight_pathways[subtitle]['sub-selected'] = 'excited'
//     } else {
//       highlight_pathways[subtitle]['sub-selected'] = '-'
//     }
//     update_highlight_bottons(subtitle)
//     update_node_opacity()
//   }
 
// }

// function add_how_many_to_highlight_options(type, subtitle, subtitle_txt) {
//   gen_g_how_many()
//   add_neuron_slider()

//   function gen_g_how_many() {
//     d3.select('#g-' + type + '-option')
//       .append('g')
//       .attr('id', ['g', type, subtitle].join('-'))
//   }

//   function add_neuron_slider() {
//     gen_slider_g('neurons')
//     gen_slider_title('neurons')
//   }

//   function gen_slider_g(subject) {
//     d3.select('#' + ['g', type, subtitle].join('-'))
//       .append('g')
//       .attr('id', ['g', type, subtitle, subject].join('-'))
//       .attr('class', 'highlight-slider')
//   }

//   function gen_slider_title(subject) {
//     var subject_text = subject[0].toUpperCase() + subject.slice(1)
//     d3.select('#' + ['g', type, subtitle, subject].join('-'))
//       .append('text')
//       .attr('id', ['title', type, subtitle, subject].join('-'))
//       .text(subject_text + ':')
//   }

//   function gen_slider_val(subject) {
//     // XXXXXXXX
//   }

//   // function 
// }

// function update_highlight_bottons(subtitle) {
//   d3.selectAll('.what-to-see-option-checkbox-icon-highlight-' + subtitle)
//     .style('display', 'none')

//   d3.select('#' + ['what-to-see-icon', subtitle, highlight_pathways[subtitle]['selected']].join('-'))
//     .style('display', 'block')

//   if (highlight_pathways[subtitle]['selected'] == 'most-changed') {
//     d3.select('#' + ['what-to-see-icon-sub', subtitle, highlight_pathways[subtitle]['sub-selected']].join('-'))
//       .style('display', 'block')
//     d3.select('#' + ['what-to-see-option-text-sub', subtitle, highlight_pathways[subtitle]['sub-selected']].join('-'))
//       .style('fill', 'gray')
//   }
// }









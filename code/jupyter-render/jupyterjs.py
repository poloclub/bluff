from IPython.core.display import HTML, Javascript
from string import Template

html_template = Template('''
<style> $css_text </style>
<div id="graph-div"></div>
<script> $js_text </script>
''')

js_template = Template('''
var s = document.createElement('script');
s.src = '//cdnjs.cloudflare.com/ajax/libs/require.js/2.3.5/require.min.js';
document.body.appendChild(s);

require.config({
    paths: {
        d3: '$d3_path'
    }
});

require(['d3'], function (d3) {$js_text});
''')

class JupyterJavaScript:
    def __init__(self, js_path, css_path, d3_path, relative=True):
        self.js = open(js_path, 'r').read()
        self.css = open(css_path, 'r').read()
        self.d3_path = d3_path
        self.graph_div_id = "graph-div"

    def generate_js_text(self, data: dict) -> str:
        data["graph_div_id"] = self.graph_div_id
        js_text = Template(self.js).substitute(data)
        js_with_require_statement = js_template.substitute({
            'd3_path': self.d3_path,
            'js_text': js_text
        })
        return js_with_require_statement
    
    def generate_html(self, data: dict) -> HTML:
        return HTML(html_template.substitute({
            'css_text': self.css,
            'js_text': self.generate_js_text(data)
        }))


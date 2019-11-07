from IPython.core.display import HTML, Javascript
from string import Template

# html_template = Template('''
# <script src="$d3_path"></script>
# <style> $css_text </style>
# <div id="graph-div"></div>
# <script> $js_text </script>
# ''')
html_template = Template('''
<style> $css_text </style>
<div id="graph-div"></div>
<script> $js_text </script>
''')

js_template = Template('''
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

    def generate_js_text(self, data: dict) -> str:
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


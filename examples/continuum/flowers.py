from flowersdata import FlowerData

import chaco.api as chacoapi
import chaco.tools.api as toolsapi
from traits.api import HasTraits, Instance
from enable.api import Component, ComponentEditor
from traitsui.api import Item, Group, View, Handler, Action
size=(700,700)
pd = chacoapi.ArrayPlotData()
def _create_plot_component():
    varnames = FlowerData['traits']
    species_map = {}
    for idx, spec in enumerate(FlowerData['species']):
        species_map[spec] = idx
    container = chacoapi.GridContainer(
        padding=40, fill_padding=True, bgcolor="lightgray", use_backbuffer=True,
        shape=(4,4), spacing=(20,20))
    for varname in varnames:
        pd.set_data(varname, [x[varname] for x in FlowerData['values']])
    pd.set_data('species', [species_map[x['species']] for x in FlowerData['values']])

    for x in range(4):
        for y in range(4):
            xname = varnames[x]
            yname = varnames[y]
            
            plot = chacoapi.Plot(pd, use_backbuffer=True,
                    unified_draw=True, backbuffer_padding=True)
            # TODO: Why is backbuffer_padding not working with grid plot container?!
            plot.padding = 20

            plot._pid = x*4 + y
            plot.plot((varnames[x], varnames[y], 'species'),
                      type="cmap_scatter",
                      color_mapper=chacoapi.jet,
                      name='hello',
                      marker = "circle")
            plot.border_width = 1
            plot.padding = 0
            plot.padding_top = 30
            my_plot = plot.plots["hello"][0]
            my_plot.index_name = varnames[x]
            my_plot.value_name = varnames[y]
            my_plot.color_name = 'species'
            my_plot.data_source = id(pd)
            
            lasso_selection = toolsapi.LassoSelection(
                component=my_plot,
                selection_datasource=my_plot.index
                )
            lasso_overlay = chacoapi.LassoOverlay(lasso_selection=lasso_selection,
                                                  component=my_plot)
            my_plot.tools.append(lasso_selection)
            my_plot.overlays.append(lasso_overlay)
            my_plot.active_tool = lasso_selection
            container.add(plot)
            
            
    return container

     
class DemoHandler(Handler):
    def do_export(self, obj):
        objs = {}
        demo.plot.add_json(objs)
        #hack to add plot data to serialized json
        pd.add_json(objs)
        #hack to tell us to add 'selection tool'
        objs[str(id(pd))]['tools'] = ['select'];
        print objs
        self.render_html_objs(str(id(demo.plot)), objs)
    
    def render_html_objs(self, main_id, objs):
        import jinja2
        import os
        import os.path
        import simplejson
        fpath = os.path.join(os.path.dirname(__file__), 'export_template.html')
        template = jinja2.Template(open(fpath).read())
        html_output = template.render(title='graph')
        fpath = os.path.join(os.path.dirname(__file__), 'main_template.js')
        template = jinja2.Template(open(fpath).read())
        main_js = template.render(export_data=simplejson.dumps(objs),
                                  main_id = main_id)
        fpath = os.path.join(os.path.dirname(__file__), 'export.html')
        with open(fpath, "w+") as f:
            f.write(html_output)
        fpath = os.path.join(os.path.dirname(__file__), 'main.js')
        with open(fpath, "w+") as f:
            f.write(main_js)
        
class Demo(HasTraits):
    plot = Instance(Component)
    traits_view = View(
        Group(
            Item('plot', editor=ComponentEditor(size=size),
                 show_label=False),
            orientation = "vertical"
            ),
        handler=DemoHandler,
        buttons=[
            Action(name='Export', action='do_export')
            ],
        resizable=True, title='hello' )

    def _plot_default(self):
        plot = _create_plot_component()
        return plot
     
demo = Demo()

if __name__ == "__main__":
    demo.configure_traits()



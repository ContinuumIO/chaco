from flowersdata import FlowerData

import chaco.api as chacoapi
import chaco.tools.api as toolsapi
from traits.api import HasTraits, Instance
from enable.api import Component, ComponentEditor
from traitsui.api import Item, Group, View
size=(1000,800)

def _create_plot_component():
    varnames = FlowerData['traits']
    species_map = {}
    for idx, spec in enumerate(FlowerData['species']):
        species_map[spec] = idx
    container = chacoapi.GridContainer(
        padding=40, fill_padding=True, bgcolor="lightgray", use_backbuffer=True,
        shape=(4,4), spacing=(20,20))
    pd = chacoapi.ArrayPlotData()
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
            my_plot.render_method = "banded"
            #my_plot.use_backbuffer=True
            #my_plot.unified_draw = True
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

class Demo(HasTraits):
    plot = Instance(Component)
    traits_view = \
        View(
            Group(
                Item('plot', editor=ComponentEditor(size=size),
                        show_label=False),
                orientation = "vertical"
                ),
            resizable=True, title='hello' )

    def _plot_default(self):
         return _create_plot_component()

demo = Demo()

if __name__ == "__main__":
    demo.configure_traits()



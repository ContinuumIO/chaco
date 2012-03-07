window.export_data = {{ export_data }};
window.main_id = "{{ main_id }}";
_.uniqueId = function (prefix) {
    //from ipython project
    // http://www.ietf.org/rfc/rfc4122.txt
    var s = [];
    var hexDigits = "0123456789ABCDEF";
    for (var i = 0; i < 32; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[12] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[16] = hexDigits.substr((s[16] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    var uuid = s.join("");
    return prefix + "-" + uuid;
};

window.default_render_namespace = {}
chaco = {}
chaco.datasource_from_data = function(namespace, all_objs, obj_id){
    var obj = all_objs[obj_id];
    var obj_type = obj['type']
    var model;
    var collection;
}
chaco.from_data = function(render_namespace, all_objs, obj_id, el){
    var obj = all_objs[obj_id];
    var obj_type = obj['type']
    var model;
    var collection;
    var view;
    if (obj_type ==='GridPlotContainer'){
	if (!render_namespace['GridPlotContainers']){
	    render_namespace['GridPlotContainers'] = new chaco.GridPlotContainers();
	}
	collection = render_namespace['GridPlotContainers'];
	model = collection.create(obj);
	args = {'collection' : collection,
		'model' : model};
	if(el){args['el'] = el}
	view = new chaco.GridPlotContainerView(args);

    }else if (obj_type == 'Plot'){
	obj = _.clone(obj);
	var sub_plot_id = _.values(obj['plots'])[0];
	var sub_obj = _.clone(all_objs[sub_plot_id]);
	if (sub_obj['type'] === 'ColormappedScatterPlot'){
	    _.extend(obj, sub_obj);
	    if (!render_namespace['ColormappedScatterPlots']){
		render_namespace['ColormappedScatterPlots'] = new chaco.ColormappedScatterPlots();
	    }
	    collection = render_namespace['ColormappedScatterPlots'];
	    model = collection.create(obj);
	    args = {'collection' : collection,
		    'model' : model};
	    if(el){args['el'] = el}
	    view = new chaco.ColormappedScatterPlotview(args);
	}
    }
    return {'collection' : collection,
	    'model' : model,
	    'view' : view}
}
//grid plot container model collection view
chaco.GridPlotContainer = Backbone.Model.extend({
    initialize : function(attributes, options){
	if (!attributes['id']){
	    this.set({'id' : _.uniqueId('view')}, 
		     {silent : true})
	}
    },
    defaults : {
	'shape' : [],
	'component_grid' : [[]],
	'height' :  0,
	'width' :  0,
    }
});

chaco.GridPlotContainers = Backbone.Collection.extend({
    model : chaco.GridPlotContainer,
    url : "/",
    localStorage : new Store('GridPlotContainers', true)
});

chaco.GridPlotContainerView = Backbone.View.extend({
    initialize : function(options){
	if (!options['id']){
	    this.id  = _.uniqueId('view');
	}
    },
    render : function(){
	var that = this;
	this.$el = $(this.el);
	this.$el.height(this.model.get('height'));
	this.$el.width(this.model.get('width'));
	_.each(this.model.get('component_grid'), function(row){
	    _.each(row, function(objid){
		results = chaco.from_data(window.default_render_namespace,
					  window.export_data, 
					  objid);
		that.$el.append(results['view'].$el);
	    });
	    that.$el.append($("<br/>"));
	});
    }
});

//color mapped scatter plot model, collection, view
chaco.ColormappedScatterPlot = Backbone.Model.extend({
    initialize : function(attributes, options){
	if (!attributes['id']){
	    this.set({'id' : _.uniqueId('view')}, 
		     {silent : true})
	}
    },
    defaults : {
	'height' :  0,
	'width' :  0,
	'color_name' : '',
	'index_name' : '',
	'value_name' : '',
	'data_source' : null
    },
    render : function(){
	
    }
});
chaco.ColormappedScatterPlots = Backbone.Collection.extend({
    model : chaco.ColormappedScatterPlot,
    url : "/",
    localStorage : new Store('ColormappedScatterPlots', true)
});
chaco.ColormappedScatterPlotview = Backbone.View.extend({
    initialize : function(options){
	if (!options['id']){
	    this.id  = _.uniqueId('view');
	}
    },
});

$(function(){
    results = chaco.from_data(window.default_render_namespace,
			      window.export_data, 
			      window.main_id, 
			      $('#chart')[0]);
    results['view'].render();
});
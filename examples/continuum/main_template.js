window.export_data = {{ export_data }};
window.main_id = "{{ main_id }}";
Backbone.create_or_get = function(collection, attributes){
	var obj = null;
	if (attributes['id']){
	    if(collection.get(attributes['id'])){
		obj = collection.get(attributes['id']);
	    }
	}
	if (!obj){
	    obj = collection.create(attributes);
	}
	return obj;
}

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
window.default_namespace = {}
chaco = {}
chaco.datasource_from_data = function(namespace, all_objs, obj_id){
    var obj = all_objs[obj_id];
    var obj_type = obj['type']
    var model;
    var collection;
    if (obj_type === 'ArrayPlotData'){
	if (!namespace['ArrayPlotDatas']){
	    namespace['ArrayPlotDatas'] = new chaco.ArrayPlotDatas()
	}
	collection = namespace['ArrayPlotDatas'];
	model = Backbone.create_or_get(collection, obj);
    }
    return {'collection' : collection,
	    'model' : model}
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
	model = Backbone.create_or_get(collection, obj);
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
	    model = Backbone.create_or_get(collection, obj);
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
	    var rowdiv = $("<div class='row'></div>");
	    that.$el.append(rowdiv);
	    _.each(row, function(objid){
		results = chaco.from_data(window.default_render_namespace,
					  window.export_data, 
					  objid);
		results['view'].render();
		rowdiv.append(results['view'].$el);
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
	if (this.get('data_source')){
	    var source = chaco.datasource_from_data(
		window.default_namespace, 
		export_data, 
		this.get('data_source'))
	    source = source['model'];
	    source.on('change', function(){this.trigger('change')});
	    this.set({'data_source_model' : source});
	}
    },
    get_data : function(name){
	return this.get('data_source_model').get('arrays')[name];
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
chaco.linear_axes = function(data, display_size, reverse){
    var domain, range
    domain = [d3.min(data), d3.max(data)];
    if (reverse){
	range = [0, display_size];
    }else{
	range = [display_size, 0];
    }
    return d3.scale.linear().domain(domain).range(range);
}
chaco.ColormappedScatterPlotview = Backbone.View.extend({
    initialize : function(options){
	if (!options['id']){
	    this.id  = _.uniqueId('view');
	}
	//axes objects
	var that = this;
	var model = this.model;
	var arrays = model.get('arrays');
	this.index_axis = chaco.linear_axes(
	    model.get_data(model.get('index_name')),
	    model.get('width'),
	    false);
	this.range_axis = chaco.linear_axes(
	    model.get_data(model.get('value_name')),
			   model.get('height'),
			   true);
    },
    render : function(){
	var model = this.model;
	var svg = d3.select(this.el).append('svg')
	    .attr('width', model.get('width'))
	    .attr('height', model.get('height'));
	svg.append('rect')
	    .attr("class", "frame")
	    .attr("width", model.get('width'))
	    .attr("height", model.get('height'));
	this.$el.addClass('plot');
	this.$el.css({ 'position' : 'absolute', 
		       'bottom' : model.get('x') + 'px', 
		       'left' : model.get('y') + 'px'});
	var that = this;
	svg.selectAll('circle')
	    .data(model.get('data_source_model').to_d3())
	    .enter().append('circle')
	    .attr('class', function(d){
		return "" + d[model.get('color_name')];
	    })
	    .attr('cx', function(d){
		return that.index_axis(d[model.get('index_name')]);
	    })
	    .attr('cy', function(d){
		return that.range_axis(d[model.get('value_name')]);
	    })
	    .attr('r', 3);
	console.log(['sdfsdfds']);
    },
});

//ArrayPlotData collection and model
chaco.ArrayPlotData = Backbone.Model.extend({
    initialize : function(attributes, options){
	if (!attributes['id']){
	    this.set({'id' : _.uniqueId('view')}, 
		     {silent : true})
	}
	var that = this;
	this.bind('change:arrays', function(){
	    delete that['_to_d3'];
	});
    },
    to_d3 : function(force){
	//go from bunch of arrays to array of dicts
	if (!force && this._to_d3){
	    return this._to_d3
	}else{
	    data = []
	    _.each(this.get('arrays'), function(array, k){
		_.each(array, function(val, idx){
		    if(!data[idx]){
			data[idx] = {};
		    }
		    data[idx][k] = val;
		});
	    });
	    this._to_d3 = data;
	    return this._to_d3;
	}
    }
});

chaco.ArrayPlotDatas = Backbone.Collection.extend({
    model : chaco.ArrayPlotData,
    url : "/",
    localStorage : new Store('ArrayPlotDatas', true)
});

$(function(){
    results = chaco.from_data(window.default_render_namespace,
			      window.export_data, 
			      window.main_id, 
			      $('#chart')[0]);
    results['view'].render();
});

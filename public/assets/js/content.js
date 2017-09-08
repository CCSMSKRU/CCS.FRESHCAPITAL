var MB = MB || {};

MB.Content = function (options) {
	var instance = this;
	if (options.world === "page") {
		instance.world    = "page";
		instance.filename = options.filename;
	} else {
		instance.world    = "modal";
        instance.type = "content"
		instance.filename = options.filename;
		instance.id       = options.id;
		if (options.params) {
			for (var key in options.params) {
				instance[key] = options.params[key];
			}
		}	
	}
};

MB.Content.find = function (id) {
    if (MB.O.contents[id]!==undefined) return MB.O.contents[id];
    if (MB.O.tables[id]!==undefined) return MB.O.tables[id];
    if (MB.O.forms[id]!==undefined) return MB.O.forms[id];
};

MB.Content.hasloaded = function (name) {
    if (MB.O.contents.hasOwnProperty(name)) {
        return true;
    } else {
        return false;
    }
};

// Content's instances methods
MB.Content.fn = MB.Content.prototype;
MB.Content.fn.parent = MB.Content.prototype.constructor;

MB.Content.fn.create = function (callback) {
	var instance = this;
    instance.makedir(function () {
        instance.makecontainer(function () {
        	instance.loadhtml(function () {
        		callback();
        	});
        });
    });
};

MB.Content.fn.makedir = function (callback) {
    var instance = this;
    if (instance.world === "modal") {
        MB.O.contents[instance.id] = instance;
    } else {
        MB.O.contents[instance.filename] = instance;
    }
    callback();
};

MB.Content.fn.makecontainer = function (callback) {
    var instance = this;
    var $worldcontainer = $("." + instance.world + "-content-wrapper");
    if (instance.world === "page") {
    	var $container = $("<div id='" + instance.world + "_" + instance.filename + "_wrapper' class='" + instance.world + "-item'></div>");
    } else {
    	var $container = $("<div id='" + instance.world + "_" + instance.id + "_wrapper' class='" + instance.world + "-item'></div>");
    }
    $worldcontainer.append($container);
    instance.$worldcontainer = $worldcontainer;
    instance.$container = $container;
    callback();
};

MB.Content.fn.loadhtml = function (callback) {
	var instance = this;
	var url = "html/contents/" + instance.filename + "/" + instance.filename + ".html";
	instance.$container.load(url, function (res, status, xhr) {
		if (status === "success") {
			callback();
		}
	});
};

MB.Content.fn.init = function () {
	var instance = this;
    if (window[instance.filename + "_init"]) {
        window[instance.filename + "_init"](instance.id);
    } else {
        console.log(7);
    }
};

MB.Content.fn.getWidth = function () {
	var instance = this;
	return $(window).width() - 80;
};

MB.Content.fn.getHeight = function () {
	var instance = this;
	return $(window).height() - 150;
};

MB.Content.fn.createmodallistitem = function () {
    var instance = this;
    $(".modals-list").append("<li data-type='content' data-object='" + instance.id + "'><i class='cross fa fa-times-circle'></i>" + instance.id + "</li>");
};

MB.Content.fn.removemodallistitem = function () {
    var instance = this;
    console.log(5);
    console.log($("[data-object='" + instance.id + "']"));
    $(".modals-list").find("[data-object='" + instance.id + "']").remove();
};

MB.Content.fn.showit = function (init) {
    var instance = this;
    if (instance.world === "modal") {
        if (init) {
            instance.createmodallistitem();  
        }
        var query = "#modal_" + MB.User.activemodal + "_wrapper";
        $(query).hide();
        var query = "#modal_" + instance.id + "_wrapper";
        $(query).show();
        MB.User.lastmodal = MB.User.activemodal;
        MB.User.activemodal = instance.id;
        MB.User.loadedmodals.push(instance.id);
        MB.User.countmodals++;             
    } else {
        var query = "#page_" + MB.User.activepage + "_wrapper";
        $(query).hide();
        var query = "#page_" + instance.filename + "_wrapper";
        $(query).show();
        MB.User.lastpage = MB.User.activepage;
        MB.User.activepage = instance.filename;
        MB.User.loadedpages.push(instance.filename);
        MB.User.countpages++;          
    }      	
};

MB.Content.fn.closeit = function () {
    var instance = this;
    if (instance.world === "page") {
        var query = "#page_" + instance.id + "_wrapper";
        $(query).hide();
    } else {
        var query = "#modal_" + instance.id + "_wrapper";
        $(query).hide();
        instance.removemodallistitem();
    }
};


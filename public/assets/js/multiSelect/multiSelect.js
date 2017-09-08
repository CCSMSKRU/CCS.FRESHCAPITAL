(function multiSelect (){
    var multiSelect;
    var main;

    function List(){
        this.items = [];
    }

    function MultiSelect(params) {
        this.id = params.id;
        this.data = params.data;
        this.target = params.target;
	    this.icon = params.icon;
	    this.iconSelected = params.iconSelected;
	    this.classSelected = params.classSelected;
	    this.dataAttributeName = params.dataAttributeName;
        this.wrapper = null;
        this.wrapperClass = "drop-list-wrapper";
        this.handlers = [];
        this.isShow = false;
	    this.allSelected = [];
    }

    function init(params) {
        var instance;
        var list = main.list;

        for (var i = 0; i < list.items.length; i++) {
            var item = list.items[i];
            if(item.isShow) return item;
        }

        instance = new MultiSelect(params);
        list.clear();
        list.addItem(instance);
        instance.create();

        return instance;
    }

    List.prototype.addItem = function(item){
        this.items.push(item);
    };

    List.prototype.clear = function(){
        var _t = this;
        for (var i = 0; i < _t.items.length; i++) {
            _t.items[i].clear();
        }

        _t.items = [];
    };

    MultiSelect.prototype.create = function() {
        var _t = this;$(".classicTableFunctional").closest(".drop-list-wrapper");
        var top = _t.target.offset().top + _t.target.outerHeight();
        var left = _t.target.offset().left + _t.target.outerWidth()/2;
        var wrapper = $("<div></div>");
        var container = $("<div></div>");
	    var all = _t.allSelected;
	    var item;
        var listItem;
        var listIcon;
        var listSpan;
        var selectItem = function(event) {
            var target = $(event.target);
            var name;
            var selected;
	        var isAdd = true;

            if(!target.hasClass("drop-list-item")) target = target.closest(".drop-list-item");
            name = target.data(_t.dataAttributeName);
            selected = !target.hasClass(_t.classSelected);

            if(selected) {
                target.addClass(_t.classSelected);
                target.children("i").removeClass(_t.icon).addClass(_t.iconSelected);
            }
            else{
                target.removeClass(_t.classSelected);
                target.children("i").removeClass(_t.iconSelected).addClass(_t.icon);
            }



	        if(selected) all.push(name);
	        else {
		        for (var i = 0; i < all.length; i++) {
			        if(name == all[i]) {
				        all.splice(i, 1);
				        break;
			        }
		        }
	        }

            $(_t).trigger('toggle', {current: {name: name, hidden: selected}, all: all});
        };

        wrapper.addClass(_t.wrapperClass);
        container.addClass("drop-list-container");

        for (var i = 0; i < _t.data.length; i++) {
            item = _t.data[i];
            listItem = $("<div></div>");
            listIcon = $("<i></i>");
            listSpan = $("<span></span>");

            listSpan.html(item.title);

            if(item.selected) {
	            listIcon.addClass("fa "+_t.iconSelected);
	            all.push(item.name);
            }
            else listIcon.addClass("fa "+_t.icon);

            listItem.attr("data-"+_t.dataAttributeName, item.name);
            listItem.addClass("drop-list-item");
            if(item.selected) listItem.addClass(_t.classSelected);
            listItem.append(listIcon);
            listItem.append(listSpan);
            listItem.on("click", selectItem);
            container.append(listItem);
        }
        wrapper.append('<div class="drop-list-corner"></div>');
        wrapper.append('<div class="drop-list-corner2"></div>');
        wrapper.append(container);
        $(document.body).append(wrapper);
        wrapper.offset({ top: top+5, left: left - (wrapper.width()-5)});
        _t.setHandlers();

        _t.wrapper = wrapper;
    };

    MultiSelect.prototype.setHandlers = function() {
        var _t = this;
        var documentClickHandler = function(event) {
            var target = $(event.target);
            var isEqual = false;

            if(target.get(0) != _t.target.get(0) || _t.isShow) {
                if(!_t.isShow) {
                    $(target).parents().each(function(){
                        if(this == _t.target.get(0)) {
                            isEqual = true;
                            return false;
                        }
                    });
                }
            }
            else isEqual = true;

            if(!isEqual && (target.hasClass(_t.wrapperClass) || target.closest("."+_t.wrapperClass).length)) isEqual = true;

            if(!isEqual) {
	            _t.target.removeClass("opened");
                $(_t).trigger('close');
                main.list.clear();
            }

            _t.isShow = isEqual;
        };
        _t.handlers.push({target: document, action: "click", handler: documentClickHandler});

        for (var i = 0; i < _t.handlers.length; i++) {
            var handler = _t.handlers[i];
            $(handler.target).on(handler.action, handler.handler);
        }
    };

    MultiSelect.prototype.clear = function() {
        var _t = this;

        $(_t.wrapper).remove();

        for (var i = 0; i < _t.handlers.length; i++) {
            var handler = _t.handlers[i];
            $(handler.target).off(handler.action, handler.handler);
        }
    };

    main = {
        list: new List(),
        init: init
    };

    MB.Core.multiSelect = main;
})();

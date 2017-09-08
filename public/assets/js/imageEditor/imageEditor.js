(function imageEditor (){
    var imageEditor;
    var main;

    function ImageEditor(params) {
        this.id = params.id;
        this.src = params.src;
        this.target = params.target;
        this.wrapperClass = "imageEditor-wrapper";
        this.isShow = false;
        this.handlers = [];
        this.path = window.connectHost+"/upload/";
        this.img = null;
        this.data = {name: "", data: null};
    }

    function List(){
        this.items = [];
    }

    function init(params) {
        var instance = new ImageEditor(params);
        var list = main.list;

        list.addItem(instance);
        instance.render(true);

        return instance;
    }

    List.prototype.getItem = function(id){
        var _t = this;
        for (var i = 0; i < _t.items.length; i++) {
            if(_t.items[i].id == id) return _t.items[i];
        }
    };

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

    ImageEditor.prototype.render = function(open) {
        var _t = this;
        var top = _t.target.offset().top + _t.target.outerHeight();
        var left = _t.target.offset().left ;
        var container = $("<div></div>");
        var wrapper = $("<div></div>");
        var preUrl = window.currentConnection.protocol + '://' + window.currentConnection.address + '/upload/';

        _t.src = (_t.src.length > 0)?(_t.src.indexOf('http') > -1)? _t.src : preUrl + _t.src: '';

        var tpl = '<div class="imageEditor-top">{{^isUpload}}{{#data}}<img class="imageEditor-img" src="{{data}}"/>{{/data}}{{^data}}<img class="imageEditor-img" src="'+_t.src+'"/>{{/data}}{{/isUpload}}</div>' +
            '<div class="imageEditor-bottom">' +
            '{{^isUpload}}<div class="imageEditor-button imageEditor-load"><i class="fa fa-edit"></i> <span>Изменить</span></div>{{/isUpload}}' +
            '{{#isUpload}}<div class="imageEditor-button imageEditor-load"><i class="fa fa-upload"></i> <span>Загрузить</span></div>{{/isUpload}}' +
                 '<div class="imageEditor-button imageEditor-delete"><i class="fa fa-trash-o"></i> <span>Удалить</span></div>' +
            '</div>';
        var mo = {
            isUpload: !_t.src && !_t.data.data,
            data: _t.data.data
        };

        wrapper.addClass(_t.wrapperClass);
        container.addClass("imageEditor-container");

        container.append(Mustache.to_html(tpl, mo));

        wrapper.append('<div class="imageEditor-corner"></div>');
        wrapper.append('<div class="imageEditor-corner2"></div>');
        wrapper.append(container);
        $(document.body).append(wrapper);

        wrapper.offset({ top: top+9, left: left - (5)});

        _t.wrapper = wrapper;
        _t.img = _t.wrapper.find(".imageEditor-img");

        _t.setHandlers();

        if(open) _t.open();
    };

    ImageEditor.prototype.open = function() {
        var _t = this;
        _t.wrapper.addClass("opened");
    };

    ImageEditor.prototype.setHandlers = function() {
        var _t = this;
        var documentClickHandler = function(event) {
            var target = $(event.target);
            var isEqual = false;

            if(!_t.wrapper.hasClass("opened")) return;

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
                _t.wrapper.removeClass("opened");
                $(_t).trigger('close');
               // main.list.clear();
            }

            _t.isShow = isEqual;
        };
        _t.handlers.push({target: document, action: "click", handler: documentClickHandler});

        for (var i = 0; i < _t.handlers.length; i++) {
            var handler = _t.handlers[i];
            $(handler.target).on(handler.action, handler.handler);
        }

        _t.wrapper.find(".imageEditor-load").on("click", function() {
            var il = MB.Core.fileLoader;
            var preUrl = window.currentConnection.protocol + '://' + window.currentConnection.address + '/upload/';
            il.start({
                success: function (fileUID) {
                    _t.data = {name: preUrl + fileUID.name, data: fileUID.base64Data};
                    $(_t).trigger('update');
                    _t.clear();
                    _t.render(true);
                }
            });
        });

        _t.wrapper.find(".imageEditor-delete").on("click", function() {
            _t.data = {name: "", data: null};
            _t.src = null;

            $(_t).trigger('update');
            _t.clear();
            _t.render(false);
        });
    };

    ImageEditor.prototype.clear = function() {
        var _t = this;

        $(_t.wrapper).remove();

        for (var i = 0; i < _t.handlers.length; i++) {
            var handler = _t.handlers[i];
            $(handler.target).off(handler.action, handler.handler);
        }

        _t.handlers = [];
        _t.isShow = false;
    };

    main = {
        list: new List(),
        init: init
    };

    MB.Core.imageEditor = main;

})();

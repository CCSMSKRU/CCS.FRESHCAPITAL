(function(){

    MB = MB || {};
    MB.Core = MB.Core || {};

    MB.ContentsNew = function(){
        this.items = [];
    };
    MB.Contents = new MB.ContentsNew();

    MB.ContentNew = function(params){
        this.id = params.id || MB.Core.guid();
        this.name = params.filename || 'unnamed';
        this.activeId = params['params']['hall_scheme_id'] || params['params']['action_id'] || params['params']['activeId'] || undefined;
        this.label = params['params']['label'] || undefined;
        this.title = params['params']['title'] || undefined;
        this.params = params['params'];
        this.eternal = params['eternal'];
        this.noExpand = params['noExpand'];
        this.modalInstance = undefined;
    };

    MB.ContentsNew.prototype.addItem = function(item){
        this.items.push(item);
    };

    MB.ContentsNew.prototype.getItem = function(id){
        for(var i in this.items){
            if(this.items[i].id == id){
                return this.items[i];
            }
        }
    };

    MB.ContentsNew.prototype.removeItem = function(id){
        for(var i in this.items){
            if(this.items[i].id == id){
                this.items.splice(i, 1);
            }
        }
    };


    MB.ContentNew.prototype.create = function(callback){
        var _t = this;

        _t.getTemplate(function(){
            MB.Contents.addItem(_t);
            _t.render(function(){
                _t.getScript(function(){
                    _t.setHandlers(function(){
                        if(typeof callback == 'function'){
                            callback(_t);
                        }
                    });
                });
            });
        });
    };

	MB.ContentNew.prototype.show = function(){
		var _t = this;
        if (_t.noExpand && !_t.modalInstance.footerButtonIsRemove) {
            if (_t.modalInstance.collapsed) _t.modalInstance.footerButton.find('.mw-try-light').fadeTo(150,0.5).fadeTo(800,0);
            return;
        }
		_t.modalInstance.show();
	};

    MB.ContentNew.prototype.getTemplate = function(callback){
        var _t = this;
        var url = "html/contents/" + _t.name + "_new/" + _t.name + ".html";

        $.ajax({
            url:url,
            success: function(res, status, xhr){
                _t.template = res;
                if(typeof callback == 'function'){
                    callback();
                }
            }
        });
    };

    MB.ContentNew.prototype.getScript = function(callback){
        var _t = this;
	    var load = function(url) {
		    $.ajax({
			    crossDomain: true,
			    dataType: "script",
			    url: url,
			    success: function(){
				    if(typeof callback == 'function'){
					    callback();
				    }
			    },
			    error: function(){
				    if(typeof callback == 'function'){
					    callback();
				    }
			    }
		    });

		    /*$.getScript( url, function() {
			    if(typeof callback == 'function'){
				    callback();
			    }
		    });*/
	    };
        MB.Contents.justAddedId = _t.id;
	    load("html/contents/" + _t.name + "_new/" + _t.name + ".js");
    };

    MB.ContentNew.prototype.reload = function(callback){

    };

    MB.ContentNew.prototype.render = function(callback){
        var _t = this;

        var modalWindow = MB.Core.modalWindows.init({
            className :        'contentModal',
            wrapId :           _t.id,
            resizable :        true,
            title :            (_t.title)? _t.title : _t.name,
            content :          _t.template,
            startPosition :    'fullscreen',
            hideSaveButton:    true,
            draggable :        true,
            top :              0,
            left :             0,
            waitForPosition :  undefined,
            active :           true,
            inMove :           false,
            minHeight :        700,
            minWidth :         1300,
            activeHeaderElem : undefined,
            footerButton :     undefined,
	        eternal :          _t.eternal,
            contentHeight :    0,
            params:_t.params || {}
        }).render(function(modalInstance){
            _t.modalInstance = modalInstance;
            if(typeof callback == 'function'){
                callback();
            }
        });
    };

    MB.ContentNew.prototype.setHandlers = function(callback){
        var _t = this;
        var modalWindow = MB.Core.modalWindows.windows.getWindow(_t.id);

        $(modalWindow).off('close').on('close', function(){
            MB.Contents.removeItem(_t.id);
        });

        if(typeof callback == 'function'){
            callback();
        }
    };

}());

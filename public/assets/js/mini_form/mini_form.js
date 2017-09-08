(function(){
    MB = MB || {};
    MB.Core = MB.Core || {};

    var MiniForms = function(){
        this.forms = [];
    };

    var MiniFrom = function(params){
        var name = (params.name.indexOf('modalmini_') != -1)? params.name.substr(params.name.indexOf('modalmini_')+10): params.name;
        this.id = params.id || MB.Core.guid();
        this.name = name;
        if(!this.name){
            console.warn('mini form, incoming invalid name');
        }
        return this;
    };

    MiniForms.prototype.addItem = function(item){
        this.forms.push(item);
    };

    MiniForms.prototype.getItem = function(id){
        for(var i in this.forms){
            var frm = this.forms[i];
            if(frm.id == id){
                return frm;
            }
        }
    };

    MiniForms.prototype.removeItem = function(id){
        for(var i in this.forms){
            var frm = this.forms[i];
            if(frm.id == id){
                this.forms.splice(i, 1);
            }
        }
    };


    MiniFrom.prototype.createForm = function(callback){
        var _t = this;

        _t.getTemplate(function(){
            _t.populate(function(){
                miniForms.addItem(_t);
                _t.getFormScript(function(){
                });
            });
        });

        if(typeof callback == 'function'){
            callback();
        }
    };

    MiniFrom.prototype.getTemplate = function(callback){
        var _t = this;
        var path = "html/contents/" + _t.name + "/" + _t.name + ".html";
        $.ajax({
            url:path,
            success: function(res, status, xhr){
                _t.template = res;
                if(typeof callback == 'function'){
                    callback();
                }
            }
        });
    };

    MiniFrom.prototype.getFormScript = function(callback){
        var _t = this;
        var path = "html/contents/" + _t.name + "/" + _t.name + ".js";
        $.getScript( path , function() {
            if(typeof callback == 'function'){
                callback();
            }
        });
    };

    MiniFrom.prototype.populate = function(callback){
        var _t = this;
        var titles = {
            generaterepertuar : 'Генерация репертуара'
        };
        _t.modal = MB.Core.modalWindows.init({
            wrapper :          undefined,
            className :        'mini_form',
            wrapId :           _t.id,
            resizable :        true,
            title :            (titles[_t.name])? titles[_t.name]: 'unnamed',
            status :           '',
            content :          _t.template,
            hideSaveButton:    true,
            bottomButtons :    undefined,
            startPosition :    'shift',
            draggable :        true,
            top :              0,
            left :             0,
            waitForPosition :  undefined,
            active :           true,
            inMove :           false,
            height :           'auto',
            width :            600,
            minHeight :        800,
            minWidth :         700,
            activeHeaderElem : undefined,
            footerButton :     undefined,
            contentHeight :    0,
            containType:       'miniForm',
            containId:         _t.id
        }).render(function(){
            if(typeof callback == 'function'){
                callback();
            }
        });
    };

    var miniForms = new MiniForms();

    MB.Core.mini_form = {
        list: miniForms,
        init: function(params){
            var inst = new MiniFrom(params);
            inst.createForm();
        }
    };


}());

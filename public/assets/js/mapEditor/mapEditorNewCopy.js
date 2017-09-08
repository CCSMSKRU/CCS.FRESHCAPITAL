//contentWrapper
(function(){
    MB = MB || {};
    MB.ME = {};

    var MapEditors = function(){
        this.items = [];
    };

    var LayerGroups = function(){
        this.items = [];
    };

    var Layers = function(){
        this.items = [];
    };

    MB.ME.MapEditor = function(p){
        this.id = p.id || MB.Core.guid();
        this.contentInstance = MB.Contents.getItem(p.id);
        this.layerGroups = [];
        this.zones = new Zones({editorId: p.id});

        MB.ME.MapEditors.addItem(this);
    };

    MB.ME.LayerGroup = function(p){
        this.id = p.id || MB.Core.guid();
        this.visibility = {
            visible_editor: !!(p.visibility.visible_editor),
            visible_admin: !!(p.visibility.visible_admin),
            visible_casher: !!(p.visibility.visible_casher),
            visible_iframe: !!(p.visibility.visible_iframe),
            visible_client_screen: !!(p.visibility.visible_client_screen)
        };
        this.sort_no = p.sort_no || 0;
        this.layers = p.layers || [];
        this.title = p.title || 'Группа';
        this.editorId = p.editorId || undefined;
    };

    MB.ME.Layer = function(p){
        this.id = p.id || MB.Core.guid();                                                                               // id (String)
        this.visibility = {
            visible_editor: !!(p.visibility.visible_editor),                                                            // видимость в редакторе (bool)
            visible_admin: !!(p.visibility.visible_admin),                                                              // видимость для админа (bool)
            visible_casher: !!(p.visibility.visible_casher),                                                            // видимость для кассира (bool)
            visible_iframe: !!(p.visibility.visible_iframe),                                                            // видимость в виджете  (bool)
            visible_client_screen: !!(p.visibility.visible_client_screen)                                               // видимость на экране пользователя (bool)
        };
        this.sort_no = p.sort_no || 0;                                                                                  // номер сортировки (int)
        this.parent_group = p.parent_group || undefined;                                                                // id группы слоев  (String guid)
        this.type = p.type || undefined;                                                                                // тип (BACKGROUND, IMAGE, PLACES, LABEL, FIGURE)  (String)
        this.x = p.x || 0;                                                                                              // X (float)
        this.y = p.y || 0;                                                                                              // Y (float)
        this.scaleCoeff = p.scaleCoeff || 0;                                                                            // Scale (float)
        this.opacity = p.opacity || 1;                                                                                  // Прозрачность (float)
        this.rotation = p.rotation || 0;                                                                                // Вращение (float)
        this.title = p.title || 'unnamed';                                                                              // Наименование  (String)
        this.image = p.image || undefined;                                                                              // Изображение  (String url or base64data)
        this.imageTitle = p.imageTitle || 'unnamed';                                                                    // Название изображения  (String)
        this.fontFamily = p.fontFamily || 'arial, sans-serif';                                                          // Шрифт  (String)
        this.fontSize = p.fontSize || '1em';                                                                            // Размер шрифта (int)
        this.fontWeight = p.fontWeight || 'normal';                                                                     // Жиронсть шрифта  (String)
        this.fontStyle = p.fontStyle || 'normal';                                                                       // Стиль шрифта  (String)
        this.color = p.color || '#000000';                                                                              // Цвет шрифта  (String)
        this.places = p.places || [];                                                                                   // Места (array)
    };

    MB.ME.LayerGroups = new LayerGroups();
    MB.ME.Layers = new Layers();
    MB.ME.MapEditors = new MapEditors();


    MapEditors.prototype.addItem = function(item){
        this.items.push(item);
    };
    MapEditors.prototype.getItem = function(id){
        for(var i in this.items){
            if(this.items[i].id == id){
                return this.items[i];
            }
        }
    };
    MapEditors.prototype.removeItem = function(id){
        for(var i in this.items){
            if(this.items[i].id == id){
                this.items.splice(i,1);
            }
        }
    };

    LayerGroups.prototype.addItem = function(item){
        this.items.push(item);
    };
    LayerGroups.prototype.getItem = function(id){
        for(var i in this.items){
            if(this.items[i].id == id){
                return this.items[i];
            }
        }
    };
    LayerGroups.prototype.removeItem = function(id){
        for(var i in this.items){
            if(this.items[i].id == id){
                this.items.splice(i,1);
            }
        }
    };

    Layers.prototype.addItem = function(item){
        this.items.push(item);
    };
    Layers.prototype.getItem = function(id){
        for(var i in this.items){
            if(this.items[i].id == id){
                return this.items[i];
            }
        }
    };
    Layers.prototype.removeItem = function(id){
        for(var i in this.items){
            if(this.items[i].id == id){
                this.items.splice(i,1);
            }
        }
    };

    MB.ME.MapEditor.prototype.init = function(cb){
        var _t = this;
        _t.wrapper = MB.Core.modalWindows.windows.getWindow(_t.contentInstance.id).wrapper;
        _t.setListeners(function(){
        });
        //uiUl();
        if(typeof cb == 'function'){
            cb();
        }
    };

    MB.ME.MapEditor.prototype.renderLayersTree = function(cb){
        var _t = this;
        var sideBar = _t.wrapper.find('.map-editor-sidebar-wrapper');
        var tpl = _t.wrapper.find('.me-layers').html();
        var layersWrapper = sideBar.find('.map-editor-layers-wrapper');

        var mO = {
            lgs: []
        };
        for(var i in _t.layerGroups){
            var lgId = _t.layerGroups[i];
            var lg = MB.ME.LayerGroups.getItem(lgId);
            var lgmO = {
                id: lgId,
                title: lg.title,
                isVisible: 'checked',
                ls: []
            };

            for(var k in lg.layers){
                var lId = lg.layers[k];
                var l = MB.ME.Layers.getItem(lId);
                var type = l.type;
                var typeIcon = '';
                switch(type){
                    case 'BACKGROUND':
                        typeIcon = 'fa-picture-o';
                        break;
                    case 'IMAGE':
                        typeIcon = 'fa-dot-circle-o';
                        break;
                    case 'PLACES':
                        typeIcon = 'fa-th';
                        break;
                    case 'LABEL':
                        typeIcon = 'fa-font';
                        break;
                    case 'FIGURE':
                        typeIcon = 'fa-square';
                        break;
                    default:
                        typeIcon = 'fa-wrench';
                        break;
                }
                lgmO.ls.push({
                    id:              lId,
                    typeIcon:        typeIcon,
                    title:           l.title,
                    isVisible: 'checked'
                });
            }
            mO.lgs.push(lgmO);
        }

        layersWrapper.append(Mustache.to_html(tpl, mO));

        if(typeof cb == 'function'){
            cb();
        }
    };

    MB.ME.MapEditor.prototype.renderZonesTree = function(cb){
        var _t = this;

        var tpl = _t.wrapper.find('.me-figures').html();
        var fromLs = JSON.parse(localStorage.getItem('me-zones'));
        var zonesObj;

        for(var i in fromLs){
            if(fromLs[i].editor == _t.id){
                zonesObj = fromLs[i].zones;
            }
        }

        _t.wrapper.find('.map-editor-figure-list').html(Mustache.to_html(tpl, zonesObj));
        _t.setZonesHandlers();

        if(typeof cb == 'function'){
            cb();
        }
    };

    MB.ME.MapEditor.prototype.setListeners = function(cb){
        var _t = this;
        var $cInst = $(_t.contentInstance);

        $cInst.off('layerUpdate').on('layerUpdate', function(e){
            for(var i in MB.ME.LayerGroups.items){
                var lg = MB.ME.LayerGroups.items[i];
                if(lg.editorId == _t.id){
                    _t.layerGroups.push(lg.id);
                }
            }
            _t.renderLayersTree(function(){
                _t.setHandlers(function(){

                });
            });
        });

        $cInst.off('zonesUpdate').on('zonesUpdate', function(e, zones){



            if(typeof zones == 'object'){
                for(var i in zones){
                    var zItem = zones[i];
                    var zone = new MB.ME.Zone({
                        id: zItem['AREA_GROUP_ID'],
                        title: zItem['NAME'],
                        editorId: _t.id
                    });
                    _t.uploadFormLs();
                    _t.renderZonesTree();
                }
            }
        });

        if(typeof cb == 'function'){
            cb();
        }
    };

    MB.ME.MapEditor.prototype.setHandlers = function(cb){
        var _t = this;
        var lgs = _t.wrapper.find('.me-lg');
        var ls = _t.wrapper.find('.me-l');
        var rem_lg = _t.wrapper.find('.me-lg-remove');
        var rem_l = _t.wrapper.find('.me-l-remove');
        var ddToggler = _t.wrapper.find('.me-lg-icon-wrap');

        var addZone = _t.wrapper.find('.me-add-zone');
        var addFigure = _t.wrapper.find('.me-add-figure');
        var addPoint = _t.wrapper.find('.me-add-point');

        ddToggler.off('click').on('click', function(e){
            var lg = $(this).parents('.me-lg');
            var icon = lg.find('.me-lg-icon-wrap i');

            if(lg.hasClass('opened')){
                icon.removeClass('fa-folder-open-o').addClass('fa-folder-o');
                lg.removeClass('opened');
            }else{
                icon.removeClass('fa-folder-o').addClass('fa-folder-open-o');
                lg.addClass('opened');
            }
            e.stopPropagation();
        });

        lgs.off('click').on('click', function(e){
            if($(e.target).parents('.me-lg-dd-wrap').length > 0){
                return;
            }

            if($(this).hasClass('selected')){
                $(this).removeClass('selected');
            }else{
                $(this).addClass('selected');
            }

        });


        addZone.off('click').on('click', function(){
            var newZoneId = MB.Core.guid();
            bootbox.dialog({
                title: 'Add zone',
                message: '<label>Title: <input type="text" class="me-new-zone" data-editor="'+_t.id+'" /></label>',
                buttons: {
                    success: {
                        label: "Подтвердить",
                        className: '',
                        callback: function() {
                            var zone = new MB.ME.Zone({
                                id: newZoneId,
                                title: $('.me-new-zone[data-editor="'+_t.id+'"]').val(),
                                editorId: _t.id
                            });
                            console.log(_t);
                            _t.uploadFormLs();
                            _t.renderZonesTree();
                        }
                    },
                    error: {
                        label: "Отмена",
                        className: '',
                        callback: function(){

                        }
                    }
                }
            });
        });

        addFigure.off('click').on('click', function(){
            var newFigureId = MB.Core.guid();
            if(_t.wrapper.find('.me-zone-item.selected').length == 0){
                toastr['error']('Выберите какую-нибудь зону');
            }else{
                var figure = new MB.ME.Figure({
                    id: newFigureId ,
                    parentId: _t.wrapper.find('.me-zone-item.selected').data('id'),
                    editorId: _t.id
                });
                _t.uploadFormLs();
                _t.renderZonesTree();
            }
        });

        if(typeof cb == 'function'){
            cb();
        }
    };

    MB.ME.MapEditor.prototype.setZonesHandlers = function(){
        var _t = this;
        var $parentList = _t.wrapper.find('.map-editor-figure-list');
        var $zones = _t.wrapper.find('.me-zone-item');
        var $figures = _t.wrapper.find('.me-figure-item');
        var $points = _t.wrapper.find('.me-point-item');

        $zones.off('click').on('click', function(){
            $parentList.find('li.selected').removeClass('selected');
            $(this).addClass('selected');
            _t.zones.deselectAll();
            var inst = _t.zones.getChild($(this).data('id'));
            inst.selected = 'selected';
        });

        $figures.off('click').on('click', function(e){
            $parentList.find('li.selected').removeClass('selected');
            $(this).addClass('selected');
            _t.zones.deselectAll();
            var inst = _t.zones.getChild($(this).data('id'));
            inst.selected = 'selected';
            e.stopPropagation();
        });

    };

    MB.ME.MapEditor.prototype.uploadFormLs = function(){
        var _t = this;
        var ls = localStorage.getItem('me-zones');

        if(ls == null){
            var lsItem = {
                editor: _t.id,
                zones: _t.zones
            };
            localStorage.setItem('me-zones', JSON.stringify([lsItem]));
        }else{
            ls = JSON.parse(ls);
            var found = undefined;
            for(var i in ls){
                var item = ls[i];
                if(item.editor == _t.id){
                    found = i;
                }
            }
            if(found !== undefined){
                ls[found].zones = _t.zones;
                localStorage.setItem('me-zones', JSON.stringify(ls));
            }else{
                var newLsZones = {
                    editor: _t.id,
                    zones: _t.zones
                };
                ls.push(newLsZones);
                localStorage.setItem('me-zones', JSON.stringify(ls));
            }
        }

        console.log('From ls', JSON.parse(localStorage.getItem('me-zones')));
    };

    MB.ME.MapEditor.prototype.storeZones = function(){
        var _t = this;
        localStorage.setItem('me-zones', JSON.stringify(_t.zones));
    };

//-------------------------------


    var Zones = function(p){
        this.editorId = p.editorId || undefined;
        this.items = [];
    };



    Zones.prototype.addItem = function(item){
        this.items.push(item);
    };
    Zones.prototype.getItem = function(id){
        for(var i in this.items){
            if(this.items[i].id == id){
                return this.items[i];
            }
        }
    };
    Zones.prototype.getChild = function(id){
        for(var i in this.items){
            var ii = this.items[i];
            if(ii.id == id){
                return ii;
            }
            for(var k in ii.items){
                var ki = ii.items[k];
                if(ki.id == id){
                    return ki;
                }
                for(var j in ki.items){
                    var ji = ki.items[j];
                    if(ji.id == id){
                        return ji;
                    }
                }
            }
        }
    };

    Zones.prototype.deselectAll = function(){
        for(var i in this.items){
            var ii = this.items[i];
            if(ii.selected == 'selected'){
                ii.selected = '';
            }
            for(var k in ii.items){
                var ki = ii.items[k];
                if(ki.selected == 'selected'){
                    ki.selected = '';
                }
                for(var j in ki.items){
                    var ji = ki.items[j];
                    if(ji.selected == 'selected'){
                        ji.selected = '';
                    }
                }
            }
        }
    };




    Zones.prototype.removeItem = function(id){
        for(var i in this.items){
            if(this.items[i].id == id){
                this.items.splice(i,1);
            }
        }
    };

    MB.ME.Zone = function(p){
        this.items = [];
        this.id = p.id || MB.Core.guid();
        this.title = p.title || 'unnamed';
        this.editorId = p.editorId;

        var editor = MB.ME.MapEditors.getItem(p.editorId);
        editor.zones.addItem(this);
    };

    MB.ME.Zone.prototype.addItem = function(item){
        this.items.push(item);
    };
    MB.ME.Zone.prototype.getItem = function(id){
        for(var i in this.items){
            if(this.items[i].id == id){
                return this.items[i];
            }
        }
    };
    MB.ME.Zone.prototype.removeItem = function(id){
        for(var i in this.items){
            if(this.items[i].id == id){
                this.items.splice(i,1);
            }
        }
    };

    MB.ME.Figure = function(p){
        this.items = [];
        this.parentId = p.parentId || undefined;
        this.id = p.id || MB.Core.guid();
        this.editorId = p.editorId;
        this.selected = '';

        var editor = MB.ME.MapEditors.getItem(p.editorId);
        for(var i in editor.zones.items){
            var zone = editor.zones.items[i];
            if(zone.id == p.parentId){
                zone.addItem(this);
            }
        }
    };

    MB.ME.Figure.prototype.addItem = function(item){
        this.items.push(item);
    };
    MB.ME.Figure.prototype.getItem = function(id){
        for(var i in this.items){
            if(this.items[i].id == id){
                return this.items[i];
            }
        }
    };
    MB.ME.Figure.prototype.removeItem = function(id){
        for(var i in this.items){
            if(this.items[i].id == id){
                this.items.splice(i,1);
            }
        }
    };

    MB.ME.Point = function(p){
        this.parentId = p.parentId || undefined;
        this.id = p.id || MB.Core.guid();
        this.x = p.x || 0;
        this.y = p.y || 0;
        this.editorId = p.editorId;
        this.selected = '';

        var editor = MB.ME.MapEditors.getItem(p.editorId);
        for(var i in editor.zones.items){
            var zone = editor.zones.items[i];
            for(var k in zone.items){
                if(zone.items[k].id == p.parentId){
                    zone.items[k].addItem(this);
                }
            }
        }
    };






}());
//contentWrapper
(function () {
    MB = MB || {};
    MB.ME = {};

    var MapEditors = function () {
        this.items = [];
    };

    var LayerGroups = function () {
        this.items = [];
    };

    var Layers = function () {
        this.items = [];
    };

    MB.ME.MapEditor = function (p) {
        this.id = p.id || MB.Core.guid();
        this.contentInstance = MB.Contents.getItem(p.id);
        this.layerGroups = [];
        this.zones = new Zones({editorId: p.id});

        MB.ME.MapEditors.addItem(this);
    };

    MB.ME.LayerGroup = function (p) {
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

    MB.ME.Layer = function (p) {
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


    MapEditors.prototype.addItem = function (item) {
        this.items.push(item);
    };
    MapEditors.prototype.getItem = function (id) {
        for (var i in this.items) {
            if (this.items[i].id == id) {
                return this.items[i];
            }
        }
    };
    MapEditors.prototype.removeItem = function (id) {
        for (var i in this.items) {
            if (this.items[i].id == id) {
                this.items.splice(i, 1);
            }
        }
    };

    LayerGroups.prototype.addItem = function (item) {
        this.items.push(item);
    };
    LayerGroups.prototype.getItem = function (id) {
        for (var i in this.items) {
            if (this.items[i].id == id) {
                return this.items[i];
            }
        }
    };
    LayerGroups.prototype.removeItem = function (id) {
        for (var i in this.items) {
            if (this.items[i].id == id) {
                this.items.splice(i, 1);
            }
        }
    };

    Layers.prototype.addItem = function (item) {
        this.items.push(item);
    };
    Layers.prototype.getItem = function (id) {
        for (var i in this.items) {
            if (this.items[i].id == id) {
                return this.items[i];
            }
        }
    };
    Layers.prototype.removeItem = function (id) {
        for (var i in this.items) {
            if (this.items[i].id == id) {
                this.items.splice(i, 1);
            }
        }
    };

    MB.ME.MapEditor.prototype.init = function (cb) {
        var _t = this;
        _t.wrapper = MB.Core.modalWindows.windows.getWindow(_t.contentInstance.id).wrapper;

        /*var meZonesObj = {
         items:[]
         };
         localStorage.setItem('me-zones', JSON.stringify(meZonesObj));*/

        _t.setListeners(function () {
        });
        //uiUl();
        if (typeof cb == 'function') {
            cb();
        }
    };

    MB.ME.MapEditor.prototype.renderLayersTree = function (cb) {
        var _t = this;
        var sideBar = _t.wrapper.find('.map-editor-sidebar-wrapper');
        var tpl = _t.wrapper.find('.me-layers').html();
        var layersWrapper = sideBar.find('.map-editor-layers-wrapper');

        var mO = {
            lgs: []
        };
        for (var i in _t.layerGroups) {
            var lgId = _t.layerGroups[i];
            var lg = MB.ME.LayerGroups.getItem(lgId);
            var lgmO = {
                id: lgId,
                title: lg.title,
                isVisible: 'checked',
                ls: []
            };

            for (var k in lg.layers) {
                var lId = lg.layers[k];
                var l = MB.ME.Layers.getItem(lId);
                var type = l.type;
                var typeIcon = '';
                switch (type) {
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
                    id: lId,
                    typeIcon: typeIcon,
                    title: l.title,
                    isVisible: 'checked'
                });
            }
            mO.lgs.push(lgmO);
        }

        layersWrapper.append(Mustache.to_html(tpl, mO));

        if (typeof cb == 'function') {
            cb();
        }
    };

    MB.ME.MapEditor.prototype.renderZonesTree = function (cb) {
        var _t = this;

        var tpl = _t.wrapper.find('.me-figures').html();
        var fromLs = JSON.parse(localStorage.getItem('me-zones'));

        _t.wrapper.find('.map-editor-figure-list').html(Mustache.to_html(tpl, _t.zones));
        _t.setZonesHandlers();

        if (typeof cb == 'function') {
            cb();
        }
    };

    MB.ME.MapEditor.prototype.setListeners = function (cb) {
        var _t = this;
        var $cInst = $(_t.contentInstance);

        $cInst.off('layerUpdate').on('layerUpdate', function (e) {
            for (var i in MB.ME.LayerGroups.items) {
                var lg = MB.ME.LayerGroups.items[i];
                if (lg.editorId == _t.id) {
                    _t.layerGroups.push(lg.id);
                }
            }
            _t.renderLayersTree(function () {
                _t.setHandlers(function () {

                });
            });
        });

        $cInst.off('zonesUpdate').on('zonesUpdate', function (e, zones) {
            if (typeof zones == 'object') {
                for (var i in zones) {
                    var zItem = zones[i];
                    var zone = new MB.ME.Zone({
                        id: zItem['AREA_GROUP_ID'],
                        title: zItem['NAME'],
                        editorId: _t.id
                    });
                }
                _t.renderZonesTree();
            }
        });

        $cInst.off('addPoint').on('addPoint', function (e, p) {
            var figure = _t.zones.getSelected();
            if (_t.wrapper.find('.me-figure-item[data-id="' + figure.id + '"]').length == 0) {
                toastr['error']('Выберите фигуру');
            } else {
                var point = new MB.ME.Point({
                    id: MB.Core.guid(),
                    parentId: figure.id,
                    editorId: _t.id,
                    x: p.x,
                    y: p.y
                });
                _t.renderZonesTree();
            }
        });

        if (typeof cb == 'function') {
            cb();
        }
    };

    MB.ME.MapEditor.prototype.setHandlers = function (cb) {
        var _t = this;
        var $cInst = $(_t.contentInstance);
        var lgs = _t.wrapper.find('.me-lg');
        var ls = _t.wrapper.find('.me-l');
        var rem_lg = _t.wrapper.find('.me-lg-remove');
        var rem_l = _t.wrapper.find('.me-l-remove');
        var ddToggler = _t.wrapper.find('.me-lg-icon-wrap');

        var addZone = _t.wrapper.find('.me-add-zone');
        var addFigure = _t.wrapper.find('.me-add-figure');
        var render = _t.wrapper.find('.me-render-zones');
        var loadLS = _t.wrapper.find('.me-load-zones');
        var saveLS = _t.wrapper.find('.me-save-zones');
        var clearLS = _t.wrapper.find('.me-clear-zones');
        var saveDB = _t.wrapper.find('.me-save-db-zones');

        ddToggler.off('click').on('click', function (e) {
            var lg = $(this).parents('.me-lg');
            var icon = lg.find('.me-lg-icon-wrap i');

            if (lg.hasClass('opened')) {
                icon.removeClass('fa-folder-open-o').addClass('fa-folder-o');
                lg.removeClass('opened');
            } else {
                icon.removeClass('fa-folder-o').addClass('fa-folder-open-o');
                lg.addClass('opened');
            }
            e.stopPropagation();
        });

        lgs.off('click').on('click', function (e) {
            if ($(e.target).parents('.me-lg-dd-wrap').length > 0) {
                return;
            }

            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected');
            } else {
                $(this).addClass('selected');
            }

        });

        addFigure.off('click').on('click', function () {
            var newFigureId = MB.Core.guid();
            if (_t.wrapper.find('.me-zone-item.selected').length == 0) {
                toastr['error']('Выберите какую-нибудь зону');
            } else {
                var figure = new MB.ME.Figure({
                    id: newFigureId,
                    parentId: _t.wrapper.find('.me-zone-item.selected').data('id'),
                    editorId: _t.id
                });

                _t.renderZonesTree();
            }
        });

        render.off('click').on('click', function () {
            $cInst.trigger('renderZones');
        });

        clearLS.off('click').on('click', function () {

        });

        loadLS.off('click').on('click', function () {
            var zones = JSON.parse(localStorage.getItem('me-zones')).items;

            function getOne(inLS, inModel) {
                for (var i in inModel) {
                    var one = inModel[i].items;
                    var inst = inModel.getItem(inLS.id);
                    if (inst) {
                        return inst;
                    }

                }
                return false;
            }

            for (var i in zones) {
                var zoneInst = getOne(zones[i], _t.zones);
                if (!zoneInst) {
                    continue;
                    //zoneInst = new MM.ME.Zone(zones[i]);
                }
                zoneInst.items = [];
                for (var i2 in zones[i].items) {
                    var figureLS = zones[i].items[i2];
                    var figureInst = getOne(figureLS, zoneInst);
                    if (!figureInst) {
                        figureLS.editorId = _t.id;
                        figureInst = new MB.ME.Figure(figureLS);
                    }
                    figureInst.items = [];
                    for (var i3 in figureLS.items) {
                        var pointLS = figureLS.items[i3];
                        pointLS.editorId = _t.id;
                        var pointInst = new MB.ME.Point(pointLS);
                    }
                }
            }
            _t.renderZonesTree();

        });

        saveLS.off('click').on('click', function () {
            var items = _t.zones.items;
            localStorage.setItem('me-zones', JSON.stringify({items: items}));
        });

        clearLS.off('click').on('click', function () {

//            <query>
//                <area_group_id_list>1590</area_group_id_list>
//                <hall_scheme_object_id>3380</hall_scheme_object_id>
//                <command>operation</command>
//                <object>set_hall_scheme_object_area_group</object>
//                <sid>RSFHbYwucAUbpAgUoYOEaSejlPDWXUAqEwbvWfxriTsTkicqiH</sid>
//                <in_out_key>rCfN1q_mL3sd1A1vIRVo</in_out_key>
//            </query>

//            var o = {
//                command: "modify",
//                object: "action_scheme_object",
//                params: {
//                    action_scheme_object_id: "5027",
//                    visible_sectors: "FALSE"
//                }
//            };




            function setObjectToAreaGroup(name){
                var area_group_id = 1;
                var object_id = 1;
                var l = JSON.parse(localStorage.getItem('me-zones'));

                var totalArray = [];
                var objects;
                var areas;
                var getObj = {
                    command: 'get',
                    object: 'hall_scheme_object',
                    params: {
                        where: 'hall_scheme_id = 1215'
                    }
                };
                socketQuery(getObj, function(res){
                    console.log(JSON.parse(res)['results'][0]);
                    objects = jsonToObj(JSON.parse(res)['results'][0]);
                    var bgs = [];
                    for(var i in objects){
                        var obj = objects[i];
                        if(obj.OBJECT_TYPE == 'BACKGROUND'){
                            bgs.push({
                                id: obj.HALL_SCHEME_OBJECT_ID,
                                name: obj.NAME
                            });
                        }
                    }

//                    console.log(bgs);

                    var getAreas = {
                        command: 'get',
                        object: 'hall_scheme_area_group',
                        params: {
                            where: 'hall_scheme_id = 1215'
                        }
                    };

                    socketQuery(getAreas, function(aRes){
                        areas = jsonToObj(JSON.parse(aRes)['results'][0]);
//                        console.log(areas);

                        for(var i in areas){
                            var aId = areas[i].AREA_GROUP_ID;
                            var aName = areas[i].NAME;

                            for(var k in bgs){
                                var obj = bgs[k];
//                                console.log(obj.name , aName);
                                if(obj.name == aName){
                                    totalArray.push({
                                        area_group_id: aId,
                                        object_id: obj.id
                                    });
                                }
                            }
                        }

                        console.log(totalArray);

                        for(var j in totalArray){
                            var iter = totalArray[j];
                            var o = {
                                command: 'operation',
                                object: 'set_hall_scheme_object_area_group',
                                params: {
                                    area_group_id_list: iter.area_group_id,
                                    hall_scheme_object_id: iter.object_id
                                }
                            };

                            socketQuery(o, function(res){
                                console.log(JSON.parse(res));
                            });
                        }

                    });


                });


                for(var i in l.items){
                    var item = l.items[i];

                }

                var o = {
                    command: 'operation',
                    object: 'set_hall_scheme_object_area_group',
                    params: {
                        area_group_id_list: area_group_id,
                        hall_scheme_object_id: object_id
                    }
                };
//                socketQuery(o, function(res){
//                    console.log(res);
//                });
            }

//            localStorage.setItem('me-zones', JSON.stringify({items:[]}));

            function removeById(id){
                var l = JSON.parse(localStorage.getItem('me-zones'));
                for(var i in l.items){
                    var elem = l.items[i];
                    if(elem.id == id){
                        l.items[i].items = [];
                    }
                }
                localStorage.setItem('me-zones', JSON.stringify(l));
            }

            function getByZone(name){
                var l = JSON.parse(localStorage.getItem('me-zones'));
                var resArr = [];
                for(var i in l.items){
                    var elem = l.items[i];
                    if(elem.title == name){
                        resArr.push(elem);
                    }
                }
                return resArr;
            }
//
//            getByZone('VIP_B_16');


        });

        saveDB.off('click').on('click', function () {
            var zone = _t.wrapper.find('.me-zone-item.selected');
            var zoneId;

            console.log(zone);

            if (zone.length == 0) {
                toastr['error']('Выберите зону');
            } else {
                zoneId = zone.data('id');
                var zoneInst = _t.zones.getItem(zoneId);
                var zoneString = '';

                for (var i in zoneInst.items) {
                    var f = zoneInst.items[i];
                    for (var k in f.items) {
                        var p = f.items[k];
                        p.x = _t.map.round(+p.x, 100);
                        p.y = _t.map.round(+p.y, 100);
                        zoneString += p.x + ',' + p.y;
                        if (k < f.items.length - 1) {
                            zoneString += ';';
                        }
                    }
                    if (i < zoneInst.items.length - 1) {
                        zoneString += '|';
                    }
                }

                if (_t.map) {
                    $(_t.map.container).trigger('modifyAreaGroup', {
                        zone_id: zoneId,
                        area_group_stroke: zoneString
                    });
                } else {
                    console.warn('map is not loaded yet');
                }

            }
        });


        if (typeof cb == 'function') {
            cb();
        }
    };

    MB.ME.MapEditor.prototype.setZonesHandlers = function () {
        var _t = this;
        var $cInst = $(_t.contentInstance);
        var $parentList = _t.wrapper.find('.map-editor-figure-list');
        var $zones = _t.wrapper.find('.me-zone-item');
        var $figures = _t.wrapper.find('.me-figure-item');
        var $points = _t.wrapper.find('.me-points-item');

        $zones.off('click').on('click', function () {
            $parentList.find('li.selected').removeClass('selected');
            $(this).addClass('selected');
            _t.zones.deselectAll();
            var inst = _t.zones.getChild($(this).data('id'));
            inst.selected = 'selected';
        });

        $figures.off('click').on('click', function (e) {
            $parentList.find('li.selected').removeClass('selected');
            $(this).addClass('selected');
            _t.zones.deselectAll();
            var inst = _t.zones.getChild($(this).data('id'));
            inst.selected = 'selected';
            e.stopPropagation();
        });

        $points.off('click').on('click', function (e) {
            return;
            console.log('ad');

            var id = $(this).data('id');
            var x = $(this).data('x');
            var y = $(this).data('y');
            var inst = _t.zones.getChild(id);
            var html = '<label>X: <input type="number" class="move-point-x" data-editor="' + _t.id + '" value="' + x + '"/></label><label>Y: <input type="number" class="move-point-y" data-editor="' + _t.id + '" value="' + x + '"/></label><div class="fn-btn fn-small-btn render-point" data-editor="' + _t.id + '">Отрисовать</div>';

            bootbox.dialog({
                message: html,
                title: "Move point",
                buttons: {
                    success: {
                        label: "Закрыть",
                        className: "green",
                        callback: function () {

                        }
                    },
                    danger: {
                        label: "Cancel",
                        className: "red",
                        callback: function () {
                        }
                    }
                }
            });

            var inpX = $('.move-point-x[data-editor="' + _t.id + '"]');
            var inpY = $('.move-point-y[data-editor="' + _t.id + '"]');
            var render = $('.render-point[data-editor="' + _t.id + '"]');

//            inpX.on('input', function(){
//                var xVal = $('.move-point-x[data-editor="'+_t.id+'"]').val();
//                var yVal = $('.move-point-y[data-editor="'+_t.id+'"]').val();
//                inst.x = xVal;
//                inst.y = yVal;
//                $cInst.trigger('renderZones');
//            });

//            inpY.on('input', function(){
//
//
//            });

            render.off('click').on('click', function () {
                var xVal = $('.move-point-x[data-editor="' + _t.id + '"]').val();
                var yVal = $('.move-point-y[data-editor="' + _t.id + '"]').val();
                inst.x = xVal;
                inst.y = yVal;
                $cInst.trigger('renderZones');
            });
            e.stopPropagation();
        });


        //modifyAreaGroup

    };

//-------------------------------


    var Zones = function (p) {
        this.editorId = p.editorId || undefined;
        this.items = [];
    };


    Zones.prototype.addItem = function (item) {
        this.items.push(item);
    };
    Zones.prototype.getItem = function (id) {
        for (var i in this.items) {
            if (this.items[i].id == id) {
                return this.items[i];
            }
        }
    };
    Zones.prototype.getChild = function (id) {
        for (var i in this.items) {
            var ii = this.items[i];
            if (ii.id == id) {
                return ii;
            }
            for (var k in ii.items) {
                var ki = ii.items[k];
                if (ki.id == id) {
                    return ki;
                }
                for (var j in ki.items) {
                    var ji = ki.items[j];
                    if (ji.id == id) {
                        return ji;
                    }
                }
            }
        }
    };

    Zones.prototype.deselectAll = function () {
        for (var i in this.items) {
            var ii = this.items[i];
            if (ii.selected == 'selected') {
                ii.selected = '';
            }
            for (var k in ii.items) {
                var ki = ii.items[k];
                if (ki.selected == 'selected') {
                    ki.selected = '';
                }
                for (var j in ki.items) {
                    var ji = ki.items[j];
                    if (ji.selected == 'selected') {
                        ji.selected = '';
                    }
                }
            }
        }
    };

    Zones.prototype.getSelected = function () {
        for (var i in this.items) {
            var ii = this.items[i];
            if (ii.selected == 'selected') {
                return ii;
            }
            for (var k in ii.items) {
                var ki = ii.items[k];
                if (ki.selected == 'selected') {
                    return ki;
                }
                for (var j in ki.items) {
                    var ji = ki.items[j];
                    if (ji.selected == 'selected') {
                        return ji;
                    }
                }
            }
        }
    };


    Zones.prototype.removeItem = function (id) {
        for (var i in this.items) {
            if (this.items[i].id == id) {
                this.items.splice(i, 1);
            }
        }
    };

    MB.ME.Zone = function (p) {
        this.items = [];
        this.id = p.id || MB.Core.guid();
        this.title = p.title || 'unnamed';
        this.editorId = p.editorId;
        var editor = MB.ME.MapEditors.getItem(p.editorId);
        editor.zones.addItem(this);
    };

    MB.ME.Zone.prototype.addItem = function (item) {
        this.items.push(item);
    };
    MB.ME.Zone.prototype.getItem = function (id) {
        for (var i in this.items) {
            if (this.items[i].id == id) {
                return this.items[i];
            }
        }
    };
    MB.ME.Zone.prototype.removeItem = function (id) {
        for (var i in this.items) {
            if (this.items[i].id == id) {
                this.items.splice(i, 1);
            }
        }
    };

    MB.ME.Figure = function (p) {
        this.items = [];
        this.parentId = p.parentId || undefined;
        this.id = p.id || MB.Core.guid();
        this.editorId = p.editorId;
        this.selected = '';

        var editor = MB.ME.MapEditors.getItem(p.editorId);
        for (var i in editor.zones.items) {
            var zone = editor.zones.items[i];
            if (zone.id == p.parentId) {
                zone.addItem(this);
            }
        }
    };

    MB.ME.Figure.prototype.addItem = function (item) {
        this.items.push(item);
    };
    MB.ME.Figure.prototype.getItem = function (id) {
        for (var i in this.items) {
            if (this.items[i].id == id) {
                return this.items[i];
            }
        }
    };
    MB.ME.Figure.prototype.removeItem = function (id) {
        for (var i in this.items) {
            if (this.items[i].id == id) {
                this.items.splice(i, 1);
            }
        }
    };

    MB.ME.Point = function (p) {
        this.parentId = p.parentId || undefined;
        this.id = p.id || MB.Core.guid();
        this.x = p.x || 0;
        this.y = p.y || 0;
        this.editorId = p.editorId;
        this.selected = '';

        var editor = MB.ME.MapEditors.getItem(p.editorId);
        for (var i in editor.zones.items) {
            var zone = editor.zones.items[i];
            for (var k in zone.items) {
                if (zone.items[k].id == p.parentId) {
                    zone.items[k].addItem(this);
                }
            }
        }
    };


    MB.Core.mod = function mod(w, h) {
        var arr = [];
        for (var i in MB.User.mapEditor_map.selection) {
            var place = MB.User.mapEditor_map.selection[i];

            MB.User.mapEditor_map.squares[place].w = w;
            MB.User.mapEditor_map.squares[place].h = h;

            arr.push({
                hall_scheme_item_id: place,
                W: w,
                H: h
            });
        }
        MB.User.mapEditor_map.container.trigger('modifySquare', [arr]);
        MB.User.mapEditor_map.render();
        MB.User.mapEditor_map.reLoadLayout();
    }


}());
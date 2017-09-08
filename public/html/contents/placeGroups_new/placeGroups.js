(function () {

    var contentID = MB.Contents.justAddedId;
    var contentInstance = MB.Contents.getItem(contentID);
    var contentWrapper = $('#mw-' + contentInstance.id);
    var modalInstance = MB.Core.modalWindows.windows.getWindow(contentID);

    modalInstance.stick = 'top';
    modalInstance.stickModal();

    var one_action_map;
    var sid = MB.User.sid;
    var environment = contentInstance;
    var splitByAreaGroups = modalInstance.params.hall_scheme['SPLIT_BY_AREA_GROUP'] == "TRUE";
    var scaleByBackground = modalInstance.params.hall_scheme['SCALE_BY_BACKGROUND'] == "TRUE";
    var lastSelectedSector;
    var expectationOfReturn = false;


    var mapContainer = contentWrapper.find('.one-action-canvas-container');

    one_action_map = new Map1({
        container: mapContainer,
        cWidth: $(window).width() - 440,
        cHeight: $(window).height() - 93,
        mode: "admin",
        doc_root: connectHost + "/",
        scaleByBackground: scaleByBackground
    });

    MB.User.map = one_action_map;

    var socketObject = {
        sid: sid,
        type: "hall_scheme_for_additional_service_group",
        param: "additional_service_group_id",
        id: environment.activeId,
        portion: 30,
        save: {
            command: "operation",
            object: "change_hall_scheme_item_fund_group_by_list",
            field_name: "fund_zone_item_id"
        },
        load: {
            command: "get",
            object: "hall_scheme_for_additional_service_group",
            params: {
                hall_scheme_id: environment.activeId
            },
            columns: "",
            field_name: "additional_service_group_id"
        }
    };
    var o = {
        command: "get",
        object: "hall_scheme_for_additional_service_group",
        sid: sid,
        params: {
            hall_scheme_id: contentInstance.activeId
        }
    };
    var layerO = {
        command: "get",
        object: "hall_scheme_layer",
        sid: sid,
        params: {
            where: "HALL_SCHEME_ID = " + contentInstance.activeId + " and VISIBLE_ADMIN='TRUE'",
            columns: "HALL_SCHEME_LAYER_ID",
            order_by: "SORT_NO"
        }
    };
    var objectO = {
        command: "get",
        object: "hall_scheme_object",
        sid: sid,
        where_field: "HALL_SCHEME_LAYER_ID",
        params: {
            hall_scheme_id: environment.activeId,
            /*columns:"ACTION_SCHEME_OBJECT_ID,OBJECT_TYPE,OBJECT_TYPE,ROTATION,FONT_FAMILY,FONT_SIZE,FONT_STYLE,FONT_WIEGH,COLOR,X,Y,BACKGROUND_URL_SCALE,BACKGROUND_URL_ORIGINAL,BACKGROUND_COLOR",*/
            order_by: "SORT_NO"
        }
    };
    var sectorO = {
        command: "get",
        object: "hall_scheme_area_group",
        params: {
            where: "HALL_SCHEME_ID = " + environment.activeId
        }
    };
    one_action_map.openSocket(socketObject);

    if (splitByAreaGroups) {
        setSideBar("sectors");
        one_action_map.loadSectors({
            socketObject: socketObject,
            squareO: o,
            layerO: layerO,
            objectO: objectO,
            sectorO: sectorO,
            action_id: objectO.params.action_id
        },function(){
            one_action_map.loadRenderItems({
                layerO: layerO,
                objectO: objectO
            }, function () {
                one_action_map.render();
                pg.init();
                pg.disablePg();
                MB.Core.spinner.stop(mapContainer);
                one_action_map.loading = false;
            });
        });
    }
    else {
        setSideBar("squares");
        one_action_map.loadSquares(o, function () {
            one_action_map.loadRenderItems({
                layerO: layerO,
                objectO: objectO
            }, function () {
                one_action_map.render();
//                alert(123);
            });

            one_action_map.setLayout(function () {
                one_action_map.setMinMax(function () {
                    one_action_map.setScaleCoff(function () {
                        one_action_map.render(function () {
                            one_action_map.reLoadLayout(function () {

                            });
                        });
                        one_action_map.setEvents();
                        pg.init();
                    });

                });
            });
        });
    }


    function sectorClickHandler() {
        var sectorSelected = false;
        var selectedSectors = [];
        for (var i in one_action_map.sectors) {
            var sec = one_action_map.sectors[i];
            if (sec.selected) {
                lastSelectedSector = sec;
                sectorSelected = true;
                selectedSectors.push(sec);
            }
        }
        if (!sectorSelected) {

        } else {
            MB.Core.spinner.start(mapContainer);

            one_action_map.sectorsSelect(function () {
                MB.Core.spinner.stop(mapContainer);
                setSideBar("squares");
                if(!pg.inited){
                    pg.init();
                }else{
                    pg.enablePg();
                }

            });
        }
    }

    function backToSectors() {
        MB.Core.spinner.start(mapContainer);
        one_action_map.backToSectors(function () {
            setSideBar("sectors");
            MB.Core.spinner.stop(mapContainer);
            pg.disablePg();
        });
    }

    function saveDialog(saveCallback, notSaveCallback) {
        bootbox.dialog({
            message: "Выделенные места для несохраненных групп будут утеряны.",
            title: "",
            buttons: {
                save: {
                    label: "Сохранить",
                    className: "green",
                    callback: function () {
                        saveCallback();
                    }
                },
                notSave: {
                    label: "Не сохранять",
                    className: "red",
                    callback: function () {
                        notSaveCallback();
                    }
                },
                cancel: {
                    label: "Отмена",
                    className: "blue",
                    callback: function () {

                    }
                }
            }
        });
    }

    function setSideBar(mode) {
        var wrapper = contentWrapper.find('.content-sidebar-upper-buttons-wrapper');
        var buttons = [
            {
                mode: "squares",
                widthClass: "wid8pr",
                nameClass: "back_to_sectors",
                disabled: function(){
                    return !splitByAreaGroups;
                },
                icon: "fa-reply",
                title: ""
            },{
                mode: "sectors",
                widthClass: "wid8pr",
                nameClass: "back_to_squares",
                disabled: function(){
                    return !lastSelectedSector;
                },
                icon: "fa-mail-forward",
                title: ""
            },{
                mode: "all",
                widthClass: "wid23pr",
                nameClass: "block_all_places",
                disabled: function(){
                    return mode == "sectors";
                },
                icon: "fa-th",
                title: "Выбрать все"
            },{
                mode: "all",
                widthClass: "wid23pr",
                nameClass: "clear_tickets_stack",
                disabled: function(){
                    return mode == "sectors";
                },
                icon: "fa-eraser",
                title: "Очистить"
            },{
                mode: "all",
                widthClass: "wid23pr",
                nameClass: "reloadMap",
                disabled: function(){
                    return mode == "sectors";
                },
                icon: "fa-refresh",
                title: "Обновить"
            },{
                mode: "all",
                widthClass: "wid23pr",
                nameClass: "saveZone",
                disabled: function(){
//                    return pg.inited && pg.places.length > 0;
                },
                icon: "fa-save",
                title: "Сохранить"
            }
        ];

        wrapper.empty();

        for (var i = 0; i < buttons.length; i++) {
            var button = buttons[i];
            var div = $("<div></div>");
            var icon = $("<i></i>");
            var span = $("<span></span>");
            if(button.mode == mode || button.mode == "all") {
                div.addClass("content-sidebar-upper-button " + button.widthClass + " " +  button.nameClass);
                if(button.disabled()) div.addClass("disabled");
                icon.addClass("fa " + button.icon);
                span.html(button.title);
                div.append(icon).append(span);
                wrapper.append(div);
            }
        }
//        toggleUnusedPrices(mode == "sectors");
        setHandlers();
    }

    function setHandlers() {
        contentWrapper.find('.back_to_sectors').off('click').on('click', function () {
            var elem = $(this);
            if (elem.hasClass("disabled")) return;

            if(pg.inited && pg.places.length > 0){
                saveDialog(function(){
                    expectationOfReturn = true;
                }, backToSectors);
            }
            else backToSectors();

        });

        contentWrapper.find('.back_to_squares').off('click').on('click', function () {
            var elem = $(this);

            if (elem.hasClass("disabled")) return;

            lastSelectedSector.selected = true;
            sectorClickHandler();
        });

        //Обновить
        contentWrapper.find('.reloadMap').off('click').on('click', function () {
            one_action_map.reLoad(function () {

            });

        });

        //Сохранить
        contentWrapper.find('.saveZone').on('click', function (event) {
            var elem = $(event.target);

            if(elem.hasClass("disabled")) return;

            pg.save();
//            saveFunds();
        });

    }

    var colors = ['red','blue','green','yellow','orange','purple']; // Гаммы для последовательной генерации цветов создаваемых групп доступов

    var pg = {

        places: [],

        inited: false,

        wrapper: contentWrapper.find('.pg-sidebar-wrapper'),

        listContainer: contentWrapper.find('.placeGroups-list-wrapper'),

        enablePg: function(){
            pg.wrapper.removeClass('disabled');
        },

        disablePg: function(){
            pg.wrapper.addClass('disabled');
        },

        init: function(){
            pg.getData(function(){
                pg.populate();
                pg.setHandlers();
                pg.inited = true;
            });
        },

        reload: function(){
            pg.getData(function(){
                pg.populate();
                pg.setHandlers();
            });
        },

        getInnerPlace: function(id){
            for(var i in pg.places){
                var p = pg.places[i];
                if(p.id == id){
                    return p;
                }
            }
            return false;
        },

        getData: function(cb){

            var o = {
                command: 'get',
                object: 'hall_scheme_additional_service_group',
                params: {
                    where: 'hall_scheme_id = '+contentInstance.activeId
                }
            };
            socketQuery(o, function(res){
                var jsonRes = JSON.parse(res);
                var jRes = socketParse(res);
                pg.data = jRes;
                if(typeof cb == 'function'){
                    cb();
                }
            });

        },

        populate: function(){
            var tpl = '<div class="pg-list ag-r-list-wrapper">' +
                        '{{#pgs}}' +
                            '<div class="ag-group-wrapper" data-id="{{ADDITIONAL_SERVICE_GROUP_ID}}">' +
                                '<div class="ag-group-header">' +
                                    '<div class="ag-group-toggler pg-in-group-count"> {{PLACE_COUNT}} ' +
//                                        '<i class="fa fa-circle-o"></i>' +
//                                        '<i class="fa fa-angle-down"></i>' +
//                                        '<i class="fa fa-angle-double-up"></i>' +
                                    '</div>'+
                                    '<div class="ag-group-select"></div>'+
                                    '<div class="ag-group-selected"></div>'+
                                    '<div class="ag-group-color" style="background-color: {{COLOR}}"></div>'+
                                    '<div class="ag-group-title">{{NAME}}</div>'+
                                    '<div class="ag-group-modify-wrapper">' +
                                        '<div class="ag-group-modify-color"><input class="ag-group-modify-color" type="text" value="{{COLOR}}"/></div>' +
                                        '<div class="ag-group-modify-title"><input class="ag-group-modify-title" type="text" value="{{NAME}}"/></div>' +
                                    '</div>'+
                                    '<div class="ag-group-funcs">' +
                                        '<div class="ag-group-modify visibleHover" data-id="{{ADDITIONAL_SERVICE_GROUP_ID}}"><i class="fa fa-edit"></i></div>' +
                                        '<div class="ag-group-remove visibleHover" data-id="{{ADDITIONAL_SERVICE_GROUP_ID}}"><i class="fa fa-trash-o"></i></div>' +
                                        '<div class="ag-group-modify-confirm visibleHover" data-id="{{ADDITIONAL_SERVICE_GROUP_ID}}"><i class="fa fa-check"></i></div>' +
                                        '<div class="ag-group-modify-cancel visibleHover" data-id="{{ADDITIONAL_SERVICE_GROUP_ID}}"><i class="fa fa-times"></i></div>' +
                                    '</div>'+
                                '</div>'+
                            '</div>'+
                        '{{/pgs}}</div>';

            var mO = {
                pgs: []
            };

            mO.pgs = pg.data;

            pg.listContainer.html(Mustache.to_html(tpl, mO));
            pg.setHandlers();
        },

        addGroup: function(wrap, cb){
            var def_color = randomColor({
                luminosity: 'bright',
                hue: colors[pg.data.length % colors.length ]
            });

            var title = (wrap.find('#ag-new-group-name').val().length == 0)? 'Групперовка № '+(pg.data.length+1) : wrap.find('#ag-new-group-name').val();
            var color = (wrap.find('#ag-new-group-color').val().length == 0)? def_color : wrap.find('#ag-new-group-color').val();

            var o = {
                command: 'new',
                object: 'hall_scheme_additional_service_group', //additional_service_group
                params: {
                    hall_scheme_id: contentInstance.activeId,
                    name: title,
                    color: color
                }
            };

            MB.Core.spinner.start(wrap);

            socketQuery(o, function(res){
                var jsonRes = JSON.parse(res);
                var jRes = socketParse(res);

                pg.data.push({
                    ADDITIONAL_SERVICE_GROUP_ID: jsonRes['results'][0].id,
                    COLOR: color,
                    HALL_SCHEME_ID: contentInstance.activeId,
                    NAME: title,
                    PLACE_COUNT: 0
                });

                pg.populate();
                MB.Core.spinner.stop(wrap);
                if(typeof cb == 'function'){
                    cb();
                }
            });
        },

        removeGroup: function(id, cb){

            var o = {
                command: 'remove',
                object: 'hall_scheme_additional_service_group', //additional_service_group
                params: {
                    hall_scheme_id: contentInstance.activeId,
                    additional_service_group_id: id
                }
            };

            socketQuery(o, function(res){
                var jsonRes = JSON.parse(res);
                var jRes = socketParse(res);


                for(var i in pg.data){
                    var gr = pg.data[i];
                    if(gr.ADDITIONAL_SERVICE_GROUP_ID == id){
                        pg.data.splice(i,1);
                    }
                }

                pg.populate();
                if(typeof cb == 'function'){
                    cb();
                }
            });

        },

        modifyGroup: function(id, color, title, cb){

            var o = {
                command: 'modify',
                object: 'hall_scheme_additional_service_group', //additional_service_group
                params: {
                    hall_scheme_id: contentInstance.activeId,
                    additional_service_group_id: id,
                    color: color,
                    name: title
                }
            };

            socketQuery(o, function(res){
                var jsonRes = JSON.parse(res);
                var jRes = socketParse(res);


                for(var i in pg.data){
                    var gr = pg.data[i];
                    if(gr.ADDITIONAL_SERVICE_GROUP_ID == id){
                        gr.COLOR = color;
                        gr.NAME = title;
                    }
                }

                pg.populate();
                if(typeof cb == 'function'){
                    cb();
                }

            });

        },

        getGroup: function(id){
            for(var i in pg.data){
                var gr = pg.data[i];
                if(gr.ADDITIONAL_SERVICE_GROUP_ID == id){
                    return gr;
                }
            }

            return false;
        },

        deselectGroups: function(){
            pg.wrapper.find('.ag-group-wrapper').removeClass('selected');
        },

        setHandlers: function(){
            pg.wrapper.find('.ag-add-group-wrapper').off('click').on('click', function(e){
                e = e || window.event;
                var wrap = $(this);

                if($(this).hasClass('opened')){
                    if($(e.target).hasClass('ag-add-group-cancel') || $(e.target).parents('.ag-add-group-cancel').length > 0){
                        $(this).removeClass('opened');
                    }else if($(e.target).hasClass('ag-add-group-confirm') || $(e.target).parents('.ag-add-group-confirm').length > 0){

                        pg.addGroup(wrap, function(){
//                            pg.reRender();
                            wrap.removeClass('opened');
                        });
                    }
                }else{
                    $(this).addClass('opened');
                }
            });

            pg.wrapper.find('.ag-group-remove').off('click').on('click', function(){
                var id = $(this).data('id');
                var name = $(this).parents('.ag-group-wrapper').find('.ag-group-title').text();
                bootbox.dialog({
                    title: 'Вы уверены?',
                    message: 'Удалить группу доступов "'+ name + '"',
                    buttons: {
                        success: {
                            label:'Удалить',
                            callback: function(){
                                pg.removeGroup(id, function(){

                                });
                            }
                        },
                        error: {
                            label:'Отмена',
                            callback: function(){

                            }
                        }
                    }
                })

            });

            pg.wrapper.find('.ag-group-wrapper').off('click').on('click', function(e){

                var isSelector = $(e.target).hasClass('ag-group-selected') || $(e.target).hasClass('ag-group-select');
                var wasSelected = $(this).hasClass('selected');

                pg.deselectGroups();

                if(isSelector){
                    if(wasSelected){
                        $(this).removeClass('selected');
                    }else{
                        $(this).addClass('selected');
                    }
                }

            });

            pg.wrapper.find('.ag-group-modify').off('click').on('click', function(){
                var wrap = $(this).parents('.ag-group-wrapper');
                if(!wrap.hasClass('ag-inModify')){
                    wrap.addClass('ag-inModify');
                }
            });

            pg.wrapper.find('.ag-group-modify-confirm').off('click').on('click', function(){
                var wrap = $(this).parents('.ag-group-wrapper');
                var color = wrap.find('input.ag-group-modify-color').val();
                var title = wrap.find('input.ag-group-modify-title').val();
                var grp = pg.getGroup(wrap.data('id'));

                color = (color.length == 7)? color : grp.COLOR;
                title = (title.length > 0)? title : grp.NAME;

                pg.modifyGroup(wrap.data('id'), color, title, function(){
                    if(wrap.hasClass('ag-inModify')){
                        wrap.removeClass('ag-inModify');
                    }
                });


            });

            pg.wrapper.find('.ag-group-modify-cancel').off('click').on('click', function(){
                var wrap = $(this).parents('.ag-group-wrapper');
                var color = wrap.find('input.ag-group-modify-color');
                var title = wrap.find('input.ag-group-modify-title');
                var colorPlate = wrap.find('.ag-group-color');
                var grp = pg.getGroup(wrap.data('id'));

                color.val(grp.COLOR);
                title.val(grp.NAME);
                colorPlate.css('backgroundColor',grp.COLOR);

                if(wrap.hasClass('ag-inModify')){
                    wrap.removeClass('ag-inModify');
                }
            });

            // MAP ---------------------------------------

            one_action_map.container.off('addToSelection').on('addToSelection', function(){

                if(pg.wrapper.find('.ag-group-wrapper.selected').length == 0){
                    toastr['info']('Выберите групперовку, в которую определить места.');
                    one_action_map.clearSelection();
                    one_action_map.reLoad();
                }else{
                    pg.addPlacesToGroup();
                }
            });

        },

        addPlacesToGroup: function(){
            var grp = pg.wrapper.find('.ag-group-wrapper.selected').eq(0);
            var grpId = grp.data('id');


            var resetArray = [];

            var flatPgPlaces = [];
            for(var p in pg.places){
                var pgp = pg.places[p];
                flatPgPlaces.push(pgp.id);
            }

            for(var i in one_action_map.selection){
                var sq = one_action_map.squares[one_action_map.selection[i]];
                var lastSel = one_action_map.selection[one_action_map.selection.length-1];
                var idx = flatPgPlaces.indexOf(sq.id);

                if(idx > -1){
                    if(sq.additional_service_group_id != grpId){
                        resetArray.push({
                            id: sq.id,
                            additional_service_group_id: grpId
                        });
                    }

                }else{
                    pg.places.push({
                        id: sq.id,
                        additional_service_group_id: grpId
                    });
                }
            }

//            flatPgPlaces = [];
//            for(var p2 in pg.places){
//                var pgp2 = pg.places[p2];
//                flatPgPlaces.push(pgp2.id);
//            }



            for(var r in resetArray){
                var ri = resetArray[r];
                for(var g in pg.places){
                    var gp = pg.places[g];
                    if(gp.id == ri.id){
                        gp.additional_service_group_id = ri.additional_service_group_id;
                    }
                }
            }


            for(var pl in one_action_map.selection){
                var plc = one_action_map.squares[one_action_map.selection[pl]];

                plc.color0 = pg.getGroup(pg.getInnerPlace(plc.id).additional_service_group_id).COLOR;
                plc.colorSelected = pg.getGroup(pg.getInnerPlace(plc.id).additional_service_group_id).COLOR;
            }

            one_action_map.clearSelection();
            one_action_map.render();

//            console.log(pg.places);
        },

        save: function(){
            var ids = [];
            var sgIds = [];

            for(var i in pg.places){
                var p = pg.places[i];
                ids.push(p.id);
                sgIds.push(p.additional_service_group_id);
            }

            var o = {
                command:"operation",
                object:"modify_hall_scheme_item",
                params:{
                    hall_scheme_item_id: ids.join('|!|'),
                    additional_service_group_id: sgIds.join('|!|')
                }
            };

            socketQuery(o, function(res){
                var jsonRes = JSON.parse(res);
                var jRes = socketParse(res);

                if(jsonRes.results[0].code == 0){
                    one_action_map.reLoad(function(){
                        pg.places = [];
                        pg.reload();
                    });
                }
            });

        },

        update: function(){

        }
    };


    mapContainer.off('sector_click').on('sector_click', function () {
        sectorClickHandler();
    });

}());

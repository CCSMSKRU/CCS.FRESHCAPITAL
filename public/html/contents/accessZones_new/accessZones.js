(function () {
    var modal = $('.mw-wrap').last();
    var contentID = MB.Contents.justAddedId;
    var contentInstance = MB.Contents.getItem(contentID);
    var contentWrapper = $('#mw-' + contentInstance.id);
    var modalInstance = MB.Core.modalWindows.windows.getWindow(contentID);

    modalInstance.stick = 'top';
    modalInstance.stickModal();

    var environment = contentInstance;
    var sid = MB.User.sid;
    var mapContainer = contentWrapper.find('.form-with-map-canvas-container');
    var splitByAreaGroups = false;//modalInstance.params.hall_scheme['SPLIT_BY_AREA_GROUP'] == "TRUE";
    var scaleByBackground = modalInstance.params.hall_scheme['SCALE_BY_BACKGROUND'] == "TRUE";
    var lastSelectedSector;
    var expectationOfReturn = false;

    var accessObj = {
        users: {
            getObject: 'user',
            getLowerObject: 'cash_desk',
            where: "",
            isLowByTop: false,
            activated: false,
            tl_pk:'USER_ID',
            ll_pk:'CASH_DESK_ID',
            tl_name:'FULLNAME',
            ll_name:'CASH_DESK_NAME',
            group_table: 'hall_scheme_access_user_group',
            gr_pk: 'hs_access_user_group_id',
            group_item_table: 'hall_scheme_access_user_group_item',
            gr_i_pk:'hs_access_user_group_item_id',
            env_name: 'hall_scheme_id',
            env_id: contentInstance.activeId,
            env_item_name: 'hall_scheme_item_id'
        },
        agents: {
            getObject: 'agent',
            getLowerObject: 'user',
            where: "USER_TYPE = 'AGENT'",
            isLowByTop: true,
            activated: false,
            tl_pk:'AGENT_ID',
            ll_pk:'USER_ID',
            tl_name:'NAME',
            ll_name:'FULLNAME',
            group_table: 'hall_scheme_access_agent_group',//+
            gr_pk: 'hs_access_agent_group_id', // +
            group_item_table: 'hall_scheme_access_agent_group_item', //+
            gr_i_pk:'hs_access_agent_group_item_id', //+
            env_name: 'hall_scheme_id',
            env_id: contentInstance.activeId,
            env_item_name: 'hall_scheme_item_id'
        },
        gateways: {
            getObject: 'sys_gateway',
            getLowerObject: '',
            where: "",
            isLowByTop: false,
            activated: false,
            tl_pk:'SYS_GATEWAY_ID',
            ll_pk:'',
            tl_name:'NAME',
            ll_name:'',
            group_table: 'hall_scheme_access_user_group',
            gr_pk: 'hs_access_user_group_id',
            group_item_table: 'hall_scheme_access_user_group_item',
            gr_i_pk:'hs_access_user_group_item_id',
            env_name: 'hall_scheme_id',
            env_id: contentInstance.activeId,
            env_item_name: 'hall_scheme_item_id'
        },
        frames: {
            getObject: 'sale_site',
            getLowerObject: 'sale_frame',
            where: "",
            isLowByTop: false,
            activated: false,
            tl_pk:'SALE_SITE_ID',
            ll_pk:'SALE_FRAME_ID',
            tl_name:'NAME',
            ll_name:'NAME',
            group_table: 'hall_scheme_access_frame_group',
            gr_pk: 'hs_access_frame_group_id',
            group_item_table: 'hall_scheme_access_frame_group_item',
            gr_i_pk:'hs_access_frame_group_item_id',
            env_name: 'hall_scheme_id',
            env_id: contentInstance.activeId,
            env_item_name: 'hall_scheme_item_id'
        }
    };


    $(modalInstance).off('switchTab').on('switchTab', function(){

        var tab = contentWrapper.find('.modal_tab.active');
        var initObj = accessObj[tab.data('tab')];

        if(!initObj.activated){
            var ag = new AccessGroup({
                getObject:initObj.getObject,
                getLowerObject:initObj.getLowerObject,
                where:initObj.where,
                isLowByTop: initObj.isLowByTop,
                wrapper:tab,
                tl_pk:initObj.tl_pk,
                ll_pk:initObj.ll_pk,
                tl_name:initObj.tl_name,
                ll_name:initObj.ll_name,
                group_table: initObj.group_table,
                gr_pk: initObj.gr_pk,
                group_item_table: initObj.group_item_table,
                gr_i_pk: initObj.gr_i_pk,
                env_name: initObj.env_name,
                env_id: initObj.env_id,
                env_item_name: initObj.env_item_name
            });
            ag.init(function(inst){
                initObj.activated = true;
                console.log(inst);
            });
        }

    });




    var m = new Map1({
        container: mapContainer,
        mode:"admin",
        cWidth: $(window).width() - 864,
        cHeight: $(window).height() - 93,
        doc_root: connectHost + "/",
        scaleByBackground: scaleByBackground
    });

    MB.User.map = m;

    var socketObject = {
        sid: sid,
        type:"hall_scheme_item",
        param:"hall_scheme_id",
        id: environment.activeId,
        portion: 30,
        save: {
//            command: "operation",
//            object: "",
//            field_name: "HALL_SCHEME_ID"
        },
        load: {
            command: "get",
            object: "hall_scheme_item",
            params: {
                hall_scheme_id: environment.activeId
            },
//            columns: "ACTION_SCHEME_ID,PRICE,STATUS,STATUS_TEXT,FUND_GROUP_NAME,PRICE_GROUP_NAME,BLOCK_COLOR,COLOR",
            field_name: "hall_scheme_id"
        }
    };

    var o = {
        command: "get",
        object: "hall_scheme_item",
        sid: sid,
        params: {
            hall_scheme_id: environment.activeId
        }
    };
    var layerO = {
        command: "get",
        object: "hall_scheme_layer",
        sid: sid,
        params: {
            hall_scheme_id: environment.activeId,
            where: "VISIBLE_ADMIN='TRUE'",
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

    m.openSocket(socketObject);

    if (splitByAreaGroups) {
        setSideBar("sectors");
        m.loadSectors({
            socketObject: socketObject,
            squareO: o,
            layerO: layerO,
            objectO: objectO,
            sectorO: sectorO,
            hall_scheme_id: objectO.params.hall_scheme_id
        },function(){
            m.loadRenderItems({
                layerO: layerO,
                objectO: objectO
            }, function () {
                m.render();
                MB.Core.spinner.stop(mapContainer);
                m.loading = false;

                var ag = new AccessGroup({
                    getObject:          accessObj.users.getObject,
                    getLowerObject:     accessObj.users.getLowerObject,
                    where:              accessObj.users.where,
                    isLowByTop:         accessObj.users.isLowByTop,
                    wrapper:            contentWrapper.find('.modal_tab.active'),
                    tl_pk:              accessObj.users.tl_pk,
                    ll_pk:              accessObj.users.ll_pk,
                    tl_name:            accessObj.users.tl_name,
                    ll_name:            accessObj.users.ll_name,
                    group_table:        accessObj.users.group_table,
                    gr_pk:              accessObj.users.gr_pk,
                    group_item_table:   accessObj.users.group_item_table,
                    gr_i_pk:            accessObj.users.gr_i_pk,
                    env_name:           accessObj.users.env_name,
                    env_id:             accessObj.users.env_id,
                    env_item_name:      accessObj.users.env_item_name,
                    map_inst:           m
                });

                ag.init(function(inst){
                    accessObj.users.activated = true;
                    console.log(inst);
                });
            });
        });
    }
    else {
        setSideBar("squares");
        m.loadSquares(o, function () {
            var ag = new AccessGroup({
                getObject:          accessObj.users.getObject,
                getLowerObject:     accessObj.users.getLowerObject,
                where:              accessObj.users.where,
                isLowByTop:         accessObj.users.isLowByTop,
                wrapper:            contentWrapper.find('.modal_tab.active'),
                tl_pk:              accessObj.users.tl_pk,
                ll_pk:              accessObj.users.ll_pk,
                tl_name:            accessObj.users.tl_name,
                ll_name:            accessObj.users.ll_name,
                group_table:        accessObj.users.group_table,
                gr_pk:              accessObj.users.gr_pk,
                group_item_table:   accessObj.users.group_item_table,
                gr_i_pk:            accessObj.users.gr_i_pk,
                env_name:           accessObj.users.env_name,
                env_id:             accessObj.users.env_id,
                env_item_name:      accessObj.users.env_item_name,
                map_inst:           m
            });
            ag.init(function(inst){
                accessObj.users.activated = true;
                console.log(inst);
            });
            m.loadRenderItems({
                layerO: layerO,
                objectO: objectO
            }, function () {
                m.render();

            });
            m.setLayout(function () {
                m.setMinMax(function () {
                    m.setScaleCoff(function () {
                        m.render(function () {
                            m.reLoadLayout(function (){

                            });
                        });
                        m.setEvents();
                    });

                });
            });
        });
    }


//    (function(){
//        /*8763*/
//
//        var o = {
//            command: 'modify',
//            object: 'hall_scheme_object',
//            params:{
//                hall_scheme_object_id: 8763,
//                hall_scheme_id:1932,
//                VISIBLE_SECTOR: 'TRUE'
//            }
//        }
//        socketQuery(o, function(res){
//            var jsonRes = JSON.parse(res);
//            var jRes = socketParse(res);
//            console.log(jRes);
//        });
//    }());

    //---------------------------------------


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
                    return true;
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
                div.append(icon).append('&nbsp;&nbsp;').append(span);
                wrapper.append(div);
            }
        }
        setHandlers();
    }
    function setHandlers() {
        contentWrapper.find('.back_to_sectors').off('click').on('click', function () {
            var elem = $(this);
            if (elem.hasClass("disabled")) return;

            if(!fundZones.checkSelection()){
                saveDialog(function(){
                    MB.Core.spinner.start(mapContainer);
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
        //Очистить
        contentWrapper.find(".clear_tickets_stack").off('click').on('click', function () {
            bootbox.dialog({
                message: "Вы уверены что хотите очистить все места?",
                title: "",
                buttons: {
                    yes_btn: {
                        label: "Да, уверен",
                        className: "green",
                        callback: function () {
                            socketQuery({
                                command: "operation", object: "fill_fund_zone_by_fund_group", params: {
                                    fund_zone_id: environment.fund_zone_id,
                                    fund_group_id: "",
                                    all: 1
                                }
                            }, function () {
                                one_action_map.reLoad(function () {
                                    fundZones.load();
                                });
                            });
                        }
                    },
                    cancel: {
                        label: "Отмена",
                        className: "blue"
                    }
                }
            });
        });
        //Обновить
        contentWrapper.find('.reloadMap').off('click').on('click', function () {
//            one_action_map.reLoad(function () {
//                fundZones.load();
//            });
//		tickets_stack.load();
        });
        //Выбрать все
        contentWrapper.find(".block_all_places").off('click').on('click', function () {
            var selected = contentWrapper.find('.fundZones-funds-list li.selected');
            if (selected.length) {
                bootbox.dialog({
                    message: "Раскрасить все этим поясом?",
                    title: "",
                    buttons: {
                        all_place: {
                            label: "Да, все места",
                            className: "green",
                            callback: function () {
                                socketQuery({
                                    command: "operation", object: "fill_fund_zone_by_fund_group", params: {
                                        fund_zone_id: environment.fund_zone_id,
                                        fund_group_id: selected.attr('data-id'),
                                        all: 1
                                    }
                                }, function () {
                                    one_action_map.reLoad(function () {
                                        fundZones.load();
                                    });
                                });
                            }
                        },
                        free_only: {
                            label: "Только свободные",
                            className: "yellow",
                            callback: function () {
                                socketQuery({
                                    command: "operation", object: "fill_fund_zone_by_fund_group", params: {
                                        fund_zone_id: environment.fund_zone_id,
                                        fund_group_id: selected.attr('data-id'),
                                        all: 0
                                    }
                                }, function () {
                                    one_action_map.reLoad(function () {
                                        fundZones.load();
                                    });
                                });
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
            } else {
                bootbox.dialog({
                    message: "Выберите хотя бы один пояс",
                    title: "",
                    buttons: {
                        cancel: {
                            label: "ОК",
                            className: "blue",
                            callback: function () {

                            }
                        }
                    }
                });
            }
        });
        //Сохранить
        contentWrapper.find('.saveZone').on('click', function (event) {
            var elem = $(event.target);

            if(elem.hasClass("disabled")) return;

            saveFunds();
        });
    }

    setSideBar();
    setHandlers();



}());

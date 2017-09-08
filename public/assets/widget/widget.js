(function(){
    var wrapper = $('#multibooker-widget-wrapper');

    //wrapper.html('<div style="background-color:white;opacity: 0.9; border-radius: 5px; padding: 5px; color:black; font-size: 14px;">' +
    //'Ведется обновление системы! Сервис временно недоступен.<br>Просим прощения за неудобства.</div>');
    //return console.log('Сервис временно недоступен');

    if($(window).outerWidth() <= 640){
        wrapper.attr('width', '');
    }

    var initData = wrapper.data();
    var isKK15 = initData['frame'] == 'sdfsd9f8uorj83421o901hndhfs78df5t61yu4g1dck3h1239186yhoi';

    var interval;
    var zoomInterval;
    var widget;
    var entryTickets;
    var headerFooterHeight;
    var footerHeight;
    var footerHeight222;


    if(initData['actions']){
        if(typeof initData['actions'] !== 'string'){
            initData['actions'] = initData['actions'].toString();
        }
    }else{
        initData['actions'] = '';
    }


    widget = {
        maps:{},
        as_was_shown: false,
        map: undefined,
        active_action_id: undefined,
        active_action: undefined,
        active_action_is_wo: undefined,
        tp_zones: [],
        max_tp_oreder_count: 10,
        additionalServices: undefined,
        isServices: false,
//        useAddToPrice: false,

        init: function(){
            var self = this;
            try{
                widget.clearLS();
                widget.clearTicketPassLS();
            }catch(e){
                console.warn('back back it!', e);
            }
            widget.getScripts(function(){
                widget.getActions(function(){
                    widget.isMultiAction = initData['actions'].split(',').length;
                    widget.removeFinishedActionsFromLs();
                    var action = widget.getActionById();
                    widget.active_action = action;
                    widget.active_action_id = action['ACTION_ID'];
                    widget.active_action_is_wo = action.ACTION_TYPE == "ACTION_WO_PLACES";

                    if(widget.isMultiAction > 1){
                        wrapper.addClass('mbw-multiactions');
                    }

                    widget.populateWidget(function(){
                        widget.loader(true);
                        self.entryTicketsInit(widget.isMultiAction > 1, function() {
                        });

                        if(widget.isMultiAction == 1){
                            self.initAdditionalServices();
                        }

                    });
                });
            });
        },

        entryTicketsInit: function(isMultiple, callback) {
            if(isMultiple && typeof isMultiple != 'function'){
                widget.setHandlers();
            }else{
                var action = widget.getActionById(widget.active_action_id);

                entryTickets = new EntryTickets({
                    parent: wrapper.find(".mbw-content"),
                    actionId: action.ACTION_ID,
                    canvasHeight: widget.canvasContainerHeight,
                    frame: initData.frame,
                    limit: widget.max_tp_oreder_count
                });

                entryTickets.init(function(){
                    if(widget.active_action_is_wo){
                        entryTickets.check("squares", true);
                        widget.populateBasket();
                        widget.loader(false);
                        callback();
                    }else{
                        widget.renderCanvas(action,function(){
                            window.map = widget.map;
                            var alias = ('action_' + action['ACTION_ID']);
                            callback();
                            widget.loader(false);
                            widget.populateMapFromLs(action['ACTION_ID'], function(){
                                widget.setBasketHandlers(function(){
                                });
                            });
                        });
                    }
                    widget.setHandlers();
                });
            }
        },

        resize: function(){
            var w = $(window).outerWidth();
            var h = $(window).outerHeight();

//            console.log(w,h, document);
        },

        getScripts: function(callback){
//            $.getScript(initData.host + 'assets/js/plugins/mustache.js', function(res){});
            $.getScript(initData.host + 'socket.io/socket.io.js', function(res){
                $.getScript(initData.host + 'assets/widget/core.js', function(res){
                    $.getScript(initData.host + 'assets/js/no_select.js', function(res){
                        $.getScript(initData.host + 'assets/js/libs/jquery/plugins/jquery.mousewheel.min.js', function(res){
                            $.getScript(initData.host + 'assets/js/entryTickets.js', function(res){
                                $.getScript(initData.host + 'assets/js/map.js', function(res){
                                    $.getScript(initData.host + 'assets/js/plugins/mustache.js', function(res){
                                        if(typeof callback == 'function'){
                                            callback();
                                        }
                                    });
                                });
                            });
                        });
                    });
                    if (typeof Hammer !== "function"){
                        $.getScript((doc_root || params.host) + 'assets/js/libs/hammer.min.js', function (res) {});
                    }



                    var cssLinks = '' +
                        '<!--[if lt IE 9]>'+
                        '<script src="http://css3-mediaqueries-js.googlecode.com/svn/trunk/css3-mediaqueries.js"></script>'+
                        '<![endif]-->'+
                        '<link rel="stylesheet" type="text/css" href="'+initData.host+'assets/widget/style_new.css"/><link rel="stylesheet" type="text/css" href="'+initData.host+'assets/widget/font-awesome-4.2.0/css/font-awesome.min.css"/>' +
                        '<link rel="stylesheet" type="text/css" href="'+initData.host+'assets/css/map.css"/><link rel="stylesheet" type="text/css" href="'+initData.host+'assets/widget/font-awesome-4.2.0/css/font-awesome.min.css"/>';

                    $('body').append(cssLinks);
                });
            });
        },

        mergeExternalActions: function(obj){
            var updateArr = [];
            //delete me
            var initDataActions = initData['actions'].split(',');
            for(var i in initDataActions){
                var inActId = initDataActions[i];
                for(var k in obj.data){
                    var incAct = obj.data[k];
                    if(incAct[obj.data_columns.indexOf('EXTERNAL_ACTION_ID')] == inActId){
                        updateArr.push(incAct[obj.data_columns.indexOf('ACTION_ID')]);
                    }
                }
            }
            if(updateArr.length > 0){
                initData['actions'] = updateArr.join(',');
            }
        },

        sortActions: function(obj){
//            debugger;
//            console.log('!', obj);

            var resultArr = [];
            for(var i in initData['actions'].split(',')){
                var idxId = initData['actions'].split(',')[i];
                for(var k in obj.data){
                    var act = obj.data[k];
//                    var isExternal = (act[obj.data_columns.indexOf('EXTERNAL_ACTION_ID')].length > 0 && act[obj.data_columns.indexOf('GATEWAY_ID')].length > 0)

                    if(act[obj.data_columns.indexOf('ACTION_ID')] == idxId || act[obj.data_columns.indexOf('EXTERNAL_ACTION_ID')] == idxId){
                        resultArr.push(act);
                    }
                }
            }

//            console.log(obj, resultArr);

            obj.data = resultArr;
            return obj;
        },

        loader: function(state){
            var loader = wrapper.find('.mbw-loader');
            if(state == true){
                loader.show();
            }else{
                loader.hide();
            }
        },

        renderScene: function(action_id){
            var sceneInfo = widget.getActionById(action_id)['SCENE_INFO'];
//            console.log('sceneInfo', sceneInfo);
            var sX = -Infinity;
            var sY = -Infinity;
            var sTest = -Infinity;
            var map = widget.map;
            var pos = 'top';
            if (sceneInfo != '') {
                try {
                    var sceneInfoJ = JSON.parse(sceneInfo);
                    sX = +sceneInfoJ.x;
                    sY = +sceneInfoJ.y;
                    sTest = sceneInfoJ.text;
                    if (sY < map.minY) {
                        pos = 'top';
                    }else if (sY > map.maxY) {
                        pos = 'bottom';
                    }else if (sX < map.minX){
                        pos = 'left';
                    }else if(sX > map.maxX){
                        pos = 'right';
                    }else{
                        pos = 'none';
                    }
                } catch (e) {
                    console.log('Не корректный JSON');
                }
            }
            var sceneBox = wrapper.find('.mbw-fix-scene');
            sceneBox.removeClass('top bottom left right none');
            sceneBox.addClass(pos);
            return;
            var bunnerElem = wrapper.find('.mbw-scene-bunner');
            var map = widget.map;
            var sceneInfo = widget.getActionById(widget.active_action_id)['SCENE_INFO'];
            if(sceneInfo == ''){
                bunnerElem.hide(0);
                return;
            }
            sceneInfo = (sceneInfo == '')? {}: JSON.parse(widget.getActionById(widget.active_action_id)['SCENE_INFO']);
            var cY1 = - map.YCoeff / map.scaleCoeff;
            var cX1 = - map.XCoeff / map.scaleCoeff;

            var cY2 = (map.cHeight - map.YCoeff) / map.scaleCoeff;
            var cX2 = (map.cWidth - map.XCoeff) / map.scaleCoeff;

            var minSchY = map.minY;
            var minSchX = map.minX;
            var maxSchY = map.maxY;
            var maxSchX = map.maxX;

            var sceneAbsY = sceneInfo.y;
            var sceneAbsX = sceneInfo.x;

            var schCenterY = (maxSchY - minSchY) / 2;
            var schCenterX = (maxSchX - minSchX) / 2;

            var angle = map.get_angle({x: schCenterX, y: schCenterY},{x: sceneAbsX, y:sceneAbsY});

            var b = schCenterY - cY1;
            var a = b * Math.tan(angle);
            var bunnerX = schCenterX + a;

//            var bunnerCanvasX = bunnerX * map.scaleCoeff + map.XCoeff;
//            var bunnerCanvasY = (sceneAbsY + map.scaleCoeff + map.YCoeff > 0)? sceneAbsY + map.scaleCoeff + map.YCoeff : 0;


            var bunCanY =  sceneAbsY * map.scaleCoeff + map.YCoeff;
            if(bunCanY <= 0 || bunCanY >= map.cHeight){
                if(bunCanY <= 0){
                    bunCanY = 0;
                }else if(bunCanY >= map.cHeight - bunnerElem.outerHeight()){
                    bunCanY = map.cHeight - bunnerElem.outerHeight();
                }
            }
            var bunCanX =  sceneAbsX * map.scaleCoeff + map.XCoeff;
            if(bunCanX <= 0 || bunCanX >= map.cWidth){
                if(bunCanX <= 0){
                    bunCanX = 0;
                }else if(bunCanX >= map.cWidth - bunnerElem.outerWidth()){
                    bunCanX = map.cWidth - bunnerElem.outerWidth();
                }
            }


            bunnerElem.css({
                top: bunCanY + 'px',
                left: bunCanX + 'px'
            });

//            bunnerElem.css({
//                top: bunnerCanvasY + 'px',
//                left: bunnerCanvasX + 'px'
//            });

        },

        getActions: function(callback){
            //wrapper.html('Сервис временно недоступен. Ведутся технические работы.');
            //return console.log('Сервис временно недоступен');
            var o = {
                command: 'get_actions',
                params: {
                    action_id: initData['actions'],
                    frame: initData.frame
                }
            };
            socketQuery(o, function(r){
                if (r == 'NOT_AVALIBLE'){
                    wrapper.html('<div class="mbw-service-unavailable">Сервис временно недоступен</div>');
                    $(document).trigger('mbw_service_unavailable');
                    return console.log('Сервис временно недоступен');
                }
                try {
                    var res = JSON.parse(r)['results'][0];
                } catch (e) {
                    wrapper.html('<div class="mbw-service-unavailable">Сервис временно недоступен</div>');
                    $(document).trigger('mbw_service_unavailable');
                    return console.log('Сервис временно недоступеню Не удалось распарсить ответ.',r);
                }
                if (res.code){
                    wrapper.html('<div class="mbw-service-unavailable">Сервис временно недоступен</div>');
                    $(document).trigger('mbw_service_unavailable');
                    return console.log('Сервис временно недоступен', res);
                }

                if(res['extra_data']['SYSDATE']){
                    widget.sysDate = widget.convertDateFormat(res['extra_data']['SYSDATE']);
                }
                if(initData['actions'].length == 0 ){
                    var initDataActionsArr = [];
                    for(var i in res.data){
                        var item = res.data[i];
                        var id = item[res.data_columns.indexOf('ACTION_ID')];
                        initDataActionsArr.push(id);
                    }
                    initData['actions'] = initDataActionsArr.join(',');
                }


                widget.mergeExternalActions(res);
//                debugger;
                widget.actions = jsonToObj(widget.sortActions(res));
                /**
                 * Возвращает информацию по мероприятию. Если id не указано, возвращает первое в списке мероприятие
                 * @param id мероприятия
                 * @returns {*}
                 */

                if(typeof callback == 'function'){
                    callback();
                }
            });
        },



        getAdditionalServices: function(cb){

            var action_scheme_ids = widget.getSelectedPlacesIds();
            var o = {
                command: 'get_action_additional_service',
                params: {
//                    action_id: widget.active_action_id,
                    action_scheme_id: action_scheme_ids.join(',')
                }
            };

            socketQuery(o, function(res){
                try {
                    var jRes = JSON.parse(res)['results'][0];
                } catch (e) {
                    cb();
                    return console.log('Сервис временно недоступен. Не удалось распарсить ответ.',res);
                }
                if (jRes.code){
                    cb();
                    return console.log('Сервис временно недоступен', jRes);
                }
                res = jsonToObj(jRes);
                widget.additionalServices = res;
                console.log(widget.additionalServices);
                if(typeof cb == 'function'){
                    cb();
                }

//                if(jRes.data.length == 0){
//                    wrapper.find('.mbw-additional-service-button').hide(0);
//                    wrapper.find('.mbw-addit-service').hide(0);
//
//                    widget.isServices = false;
//                    return false;
//                }else{
//                    wrapper.find('.mbw-additional-service-button').show(0);
//                    wrapper.find('.mbw-addit-service').show(0);
//                    widget.isServices = true;
//                    if(typeof cb == 'function'){
//                        cb();
//                    }
//                }
            });
        },

        getSelectedASGroups: function(){
            var storedPlaces = JSON.parse(localStorage.getItem('mbw-basket'));
            var storedTickets = JSON.parse(localStorage.getItem('mbw-tp-basket'));

            var ags = [];
            var flatAgs = [];

            if(storedPlaces != null){
                for(var i in storedPlaces.actions){
                    var a = storedPlaces.actions[i];
                    for(var k in a.places){
                        var plc = a.places[k];
                        if(flatAgs.indexOf(plc.additionalServiceGroupId) == -1){
                            if(plc.additionalServiceGroupId != ''){
                                ags.push({
                                    name: plc.additionalServiceGroup,
                                    id: plc.additionalServiceGroupId
                                });
                                flatAgs.push(plc.additionalServiceGroupId);
                            }
                        }
                    }
                }
            }
            if(storedTickets != null){
                for(var i2 in storedTickets.actions){
                    var a2 = storedTickets.actions[i2];
                    for(var k2 in a.places){
                        var plc2 = a.places[k2];
                        if(flatAgs.indexOf(plc2.additionalServiceGroupId) == -1){
                            if(plc.additionalServiceGroupId != ''){
                                ags.push({
                                    name: plc2.additionalServiceGroup,
                                    id: plc2.additionalServiceGroupId
                                });
                                flatAgs.push(plc2.additionalServiceGroupId);
                            }
                        }
                    }
                }
            }

            return ags;
        },

        getSelectedPlacesIds: function(){
            var storedPlaces = JSON.parse(localStorage.getItem('mbw-basket'));
            var storedTickets = JSON.parse(localStorage.getItem('mbw-tp-basket'));

            var plcs = [];
            var flatPlcs = [];

            if(storedPlaces != null){
                for(var i in storedPlaces.actions){
                    var a = storedPlaces.actions[i];
                    for(var k in a.places){
                        var plc = a.places[k];
//                        if(flatPlcs.indexOf(plc.additionalServiceGroupId) == -1){
                        if(plc.additionalServiceGroupId != ''){
                            flatPlcs.push(plc.id);
                        }
//                        }
                    }
                }
            }
            if(storedTickets != null){
                for(var i2 in storedTickets.actions){
                    var a2 = storedTickets.actions[i2];
                    for(var k2 in a.places){
                        var plc2 = a.places[k2];
//                        if(flatPlcs.indexOf(plc2.additionalServiceGroupId) == -1){
                        if(plc.additionalServiceGroupId != ''){
                            flatPlcs.push(plc.id);
                        }
//                        }
                    }
                }
            }

            return flatPlcs;
        },

        getSelectedPlaces: function(){
            var storedPlaces = JSON.parse(localStorage.getItem('mbw-basket'));
            var storedTickets = JSON.parse(localStorage.getItem('mbw-tp-basket'));

            var plcs = [];
            var flatPlcs = [];

            if(storedPlaces != null){
                for(var i in storedPlaces.actions){
                    var a = storedPlaces.actions[i];
                    for(var k in a.places){
                        var plc = a.places[k];
//                        if(flatPlcs.indexOf(plc.additionalServiceGroupId) == -1){
                        if(plc.additionalServiceGroupId != ''){
                            plcs.push({
                                name:               plc.additionalServiceGroup,
                                id:                 plc.additionalServiceGroupId,
                                plc_id:             plc.id,
                                plc_line_title:     (plc.line_title)? plc.line_title : 'Ряд',
                                plc_line:           plc.line,
                                plc_place_title:    (plc.place_title)? plc.place_title: 'Место',
                                plc_place:          plc.place
                            });
                            flatPlcs.push(plc.additionalServiceGroupId);
                        }
//                        }
                    }
                }
            }
            if(storedTickets != null){
                for(var i2 in storedTickets.actions){
                    var a2 = storedTickets.actions[i2];
                    for(var k2 in a.places){
                        var plc2 = a.places[k2];
//                        if(flatPlcs.indexOf(plc2.additionalServiceGroupId) == -1){
                        if(plc.additionalServiceGroupId != ''){
                            plcs.push({
                                name: plc2.additionalServiceGroup,
                                id: plc2.additionalServiceGroupId,
                                plc_id:             plc2.id,
                                plc_line_title:     (plc2.line_title)? plc2.line_title : 'Ряд',
                                plc_line:           plc2.line,
                                plc_place_title:    (plc2.place_title)? plc2.place_title: 'Место',
                                plc_place:          plc2.place
                            });
                            flatPlcs.push(plc2.additionalServiceGroupId);
                        }
//                        }
                    }
                }
            }

            return plcs;
        },

        getPlaceDataById: function(id){
            var places = widget.getSelectedPlaces();
            for(var i in places){
                if(places[i]['plc_id'] == id){
                    return places[i];
                }
            }
            return false;
        },

        initAdditionalServices: function(cb){
            var _t = this;
            if(widget.active_action.SERVICE_AVALIBLE_FOR_SALE == 'TRUE'){
                if(widget.getSelectedPlacesIds().length > 0){
                    wrapper.find('.mbw-additional-service-button').show(0);
                    wrapper.find('.mbw-addit-service').show(0);
                    widget.getAdditionalServices(function(){
                        widget.prepareAdditionalServiceObj();
                        widget.populateAdditionalServices();
                        widget.additionalServiceBasket.disableBtns();
                        widget.setAdditionalServicesHandlers();
                        widget.calculateTotal();
                        return false;
                    });
                }else{
                    widget.additionalServiceBasket.list = [];
                    wrapper.find('.mbw-additional-service-button').hide(0);
                    wrapper.find('.mbw-addit-service').hide(0);
                    wrapper.find('.mbw-services-wrapper').removeClass('mbw-opened');
                }


            }else{
                wrapper.find('.mbw-additional-service-button').hide(0);
                wrapper.find('.mbw-addit-service').hide(0);
                wrapper.find('.mbw-services-wrapper').removeClass('mbw-opened');
            }

//            widget.getAdditionalServices(function(){
//                widget.prepareAdditionalServiceObj();
//                widget.populateAdditionalServices();
//                widget.setAdditionalServicesHandlers();
//                widget.additionalServiceBasket.disableBtns();
//                if(typeof cb == 'function'){
//                    cb();
//                }
//            });
        },

        reRenderAdditionalServices: function(){
            if(widget.active_action.SERVICE_AVALIBLE_FOR_SALE == 'TRUE'){
                if(widget.getSelectedPlacesIds().length > 0){
                    widget.prepareAdditionalServiceObj();
                    widget.populateAdditionalServices();
                    widget.additionalServiceBasket.disableBtns();
                    widget.setAdditionalServicesHandlers();
                    widget.calculateTotal();
                }else{
                    widget.additionalServiceBasket.list = [];
                    widget.calculateTotal();
                }
            }
        },

        updateAdditionalServices: function(){

            if(widget.active_action.SERVICE_AVALIBLE_FOR_SALE == 'TRUE'){
                if(widget.getSelectedPlacesIds().length > 0){
                    wrapper.find('.mbw-additional-service-button').show(0);
                    wrapper.find('.mbw-addit-service').show(0);
                    widget.getAdditionalServices(function(){
                        widget.prepareAdditionalServiceObj();
                        widget.populateAdditionalServices();
                        widget.additionalServiceBasket.disableBtns();
                        widget.setAdditionalServicesHandlers();
                        widget.calculateTotal();
                        return false;
                    });
                }else{
                    widget.additionalServiceBasket.list = [];
                    widget.calculateTotal();
                    wrapper.find('.mbw-additional-service-button').hide(0);
                    wrapper.find('.mbw-addit-service').hide(0);
                    wrapper.find('.mbw-services-wrapper').removeClass('mbw-opened');
                }
            }else{
                wrapper.find('.mbw-additional-service-button').hide(0);
                wrapper.find('.mbw-addit-service').hide(0);
                wrapper.find('.mbw-services-wrapper').removeClass('mbw-opened');
            }


            return false;


            widget.prepareAdditionalServiceObj();
            widget.populateAdditionalServices();
            widget.additionalServiceBasket.disableBtns();
            widget.setAdditionalServicesHandlers();
            widget.calculateTotal();
        },

        prepareAdditionalServiceObj: function(){

            var mO = {
                places: [],
                cart: [],
                dependServiceNotification: '',
                totalServiceAmount: widget.additionalServiceBasket.getTotal().toFixed(2)
            };

            // ВЕРХНИЙ УРОВЕНЬ - МЕСТА
            (function(){

                console.log(widget.additionalServices);

                for(var i in widget.additionalServices){
                    var ser = widget.additionalServices[i];
                    var plc = widget.getPlaceDataById(ser['ACTION_SCHEME_ID']);
                    var found = false;


                    for(var k in mO.places){
                        if(mO.places[k].id == ser['ACTION_SCHEME_ID']){
                            found = true;
                        }
                    }

                    if(!found){
                        mO.places.push({
                            line_title:         plc.plc_line_title,
                            line:               plc.plc_line,
                            place_title:        plc.plc_place_title,
                            place:              plc.plc_place,
                            id:                 plc.plc_id,
                            place_label:        plc.plc_line_title + ' ' + plc.plc_line + ', ' + plc.plc_place_title + ' ' + plc.plc_place,
                            service_groups:           []
                        });
                    }
                }
            }());

            // ГРУППЫ УСЛУГ В МЕСТА
            (function(){
                for(var i in widget.additionalServices){
                    var ser = widget.additionalServices[i];
                    var plc = widget.getPlaceDataById(ser['ACTION_SCHEME_ID']);
                    for(var k in mO.places){
                        var mOplc = mO.places[k];
                        if(mOplc.id == ser['ACTION_SCHEME_ID']){

                            var grpFound = false;

                            for(var l in mOplc.service_groups){
                                var grp = mOplc.service_groups[l];
                                if(grp.grp_id == ser['ACTION_ADD_SERVICE_GROUP_ID']){
                                    grpFound = true;
                                }
                            }

                            if(!grpFound){
                                mOplc.service_groups.push({
                                    grp_id: ser['ACTION_ADD_SERVICE_GROUP_ID'],
                                    grp_name: ser['ACTION_ADD_SERVICE_GROUP_NAME'],
                                    services: []
                                });
                            }
                        }
                    }
                }
            }());

            // УСЛУГИ В ГРУППЫ УСЛУГ
            (function(){
                for(var i in widget.additionalServices){
                    var ser = widget.additionalServices[i];
                    var plc = widget.getPlaceDataById(ser['ACTION_SCHEME_ID']);
                    for(var k in mO.places){
                        var mOplc = mO.places[k];

                        for(var l in mOplc.service_groups){
                            var mOgrp = mOplc.service_groups[l];

                            if(mOplc.id == ser['ACTION_SCHEME_ID'] && mOgrp.grp_id == ser['ACTION_ADD_SERVICE_GROUP_ID']){
                                mOgrp.services.push(ser);
                                mOgrp.services[mOgrp.services.length - 1].checked = false;
                            }
                        }


                    }
                }
            }());

            // ПРОСТАВИМ ЗНАЧЕНИЯ ИЗ КОРЗИНЫ И УДАЛИМ ЗАКАЗАННЫЕ ЕСЛИ МЕСТО В КОТОРОМ ОНИ БЫЛИ ДЕСЕЛЕКТНУЛИ
            (function(){
                for(var i in widget.additionalServiceBasket.list){
                    var found = false;
                    var inbItem = widget.additionalServiceBasket.list[i];

                    for(var k in mO.places){
                        var plc = mO.places[k];

                        for(var l in plc.service_groups){
                            var grp = plc.service_groups[l];

                            if(inbItem.plc_id == plc.plc_id){
                                for(var j in grp.services){
                                    var ser = grp.services[j];
                                    if(ser['ACTION_ADDITIONAL_SERVICE_ID'] == inbItem['ACTION_ADDITIONAL_SERVICE_ID'] && ser['ACTION_SCHEME_ID'] == inbItem['ACTION_SCHEME_ID']){
                                        found = true;
                                        ser.checked = true;
                                    }
                                }
                            }
                        }

                    }

                    if(!found){
                        delete widget.additionalServiceBasket.list[i];
                        clearEmpty(widget.additionalServiceBasket.list);
                    }
                }
            }());

            // ВСТАВИМ ИЗ КОРЗИНЫ В MO
            (function(){
                for(var i in widget.additionalServiceBasket.list){
                    var inBItem = widget.additionalServiceBasket.list[i];
                    mO.cart.push(inBItem);
                }
            }());



            if(mO.places.length == 0){
                mO.dependServiceNotification = '<div class="mbw-service-depend-notification-wrapper"><i class="fa fa-exclamation-triangle"></i>&nbsp;&nbsp;<span class="mbw-switch-lang" data-keyword="serviceDependNotification">Необходимо предварительно выбрать места для которых доступны услуги.</span></div>'
            }

            widget.additionalServiceData = mO;









            return false;



            var mO = {
                ser_ags: [],
                ser_other_ags: [],
                ser_cart_items: [],
                dependServiceNotification: '',
                totalServiceAmount: widget.additionalServiceBasket.getTotal().toFixed(2)
            };
            var agServiceExsist = false;

//            var ags = widget.getSelectedASGroups();
            var ags = widget.getSelectedPlaces();

            if(ags.length > 0){
                for(var i in ags){
                    var ag = ags[i];
                    mO.ser_ags.push({
                        ser_ag_id: ag.plc_id,
                        ser_ag_title: ag.plc_line_title + ': ' + ag.plc_line + ' ' + ag.plc_place_title + ': ' + ag.plc_place,//ag.name,
                        ACTION_ADD_SERVICE_TYPE: '1',
                        ACTION_ADD_SERVICE_TYPE_RU: '1',
                        ser_ag_items: []
                    });
                }
            }

            for(var i2 in mO.ser_ags){
                var ag2 = mO.ser_ags[i2];

                for(var l in widget.additionalServices){
                    var ser = widget.additionalServices[l];
                    if(ser['LINK_TO_AREA_GROUP'] == 'TRUE'){

                        ag2.ser_ag_items.push(cloneObj(ser));
                        ag2.ser_ag_items[ag2.ser_ag_items.length - 1]['ser_item_count'] = widget.additionalServiceBasket.getCount(ag2.ser_ag_id, ser.ACTION_ADDITIONAL_SERVICE_ID);
                        ag2.ser_ag_items[ag2.ser_ag_items.length - 1]['ser_ag_id'] = ag2.ser_ag_id;
                        ag2.ser_ag_items[ag2.ser_ag_items.length - 1]['ser_ag_title'] = ag2.ser_ag_title;
                    }
                }
            }

            for(var l2 in widget.additionalServices){
                var ser2 = widget.additionalServices[l2];
                if(ser2['LINK_TO_AREA_GROUP'] == 'FALSE'){

                    mO.ser_other_ags.push(cloneObj(ser2));

                    mO.ser_other_ags[mO.ser_other_ags.length - 1]['ser_item_count'] = widget.additionalServiceBasket.getCount('other', ser2.ACTION_ADDITIONAL_SERVICE_ID);
                    mO.ser_other_ags[mO.ser_other_ags.length - 1]['ser_ag_id'] = 'other';
                    mO.ser_other_ags[mO.ser_other_ags.length - 1]['ser_ag_title'] = '';
                }else{
                    agServiceExsist = true;
                }
            }


            //populate additional services basket
            (function(){

                for(var i in widget.additionalServiceBasket.list){
                    var inbItem = widget.additionalServiceBasket.list[i];
                    mO.ser_cart_items.push(inbItem);
                }

            }());

            if(mO.ser_ags.length == 0 && agServiceExsist){
                mO.dependServiceNotification = '<div class="mbw-service-depend-notification-wrapper"><i class="fa fa-exclamation-triangle"></i>&nbsp;&nbsp;<span class="mbw-switch-lang" data-keyword="serviceDependNotification">Необходимо предварительно выбрать места для которых доступны услуги.</span></div>'
            }

            widget.additionalServiceData = mO;
        },

        populateAdditionalServices: function(){
//            widget.isServices = true;

            var serScTop = widgetWrapper.find('.mbw-services-list').scrollTop();
            var serBasketScTop = widgetWrapper.find('.mbw-ser-cart-list').scrollTop();

            var servicesHtml = '<div class="mbw-services-wrapper">'+
                '<div class="mbw-services-header">'+
                '<span class="mbw-switch-lang" data-keyword="additionalServices">Дополнительные услуги</span>'+
                '<div class="mbw-services-dd-toggler">'+
                '<i class="fa fa-times"></i>'+
                '</div>'+
                '</div>'+

                '<div class="mbw-services-list">'+
                '{{{dependServiceNotification}}}' +
                '{{#places}}'+
                '<div class="mbw-ser-ag-wrapper" data-id="{{id}}">'+
                '<div class="mbw-ser-ag-title">{{place_label}}</div>'+
                '<div class="mbw-ser-ag-dd-toggler mbw-unsel"><i class="fa fa-angle-down"></i></div>'+
                '<div class="mbw-ser-type-wrapper mbw-unsel" data-id="{{ACTION_ADD_SERVICE_TYPE}}">'+
//                                                    '<div class="mbw-ser-type-title">{{ACTION_ADD_SERVICE_TYPE_RU}}</div>'+
                '{{#service_groups}}' +
                '<div class="mbw-ser-group-wrapper" data-grpid="{{grp_id}}">' +
                '<div class="mbw-ser-group-title">{{grp_name}}</div>' +
                '<div class="mbw-ser-group-services-list" data-grpid="{{grp_id}}">' +
                '{{#services}}'+
                '<div class="mbw-ser-item-wrapper" data-id="{{ACTION_ADDITIONAL_SERVICE_ID}}">'+
                '<div class="mbw-ser-item-inner">'+
                '<div class="mbw-ser-item-title">{{ADDITIONAL_SERVICE_NAME}}</div>'+
                '<div class="mbw-ser-item-price mbw-unsel">{{PRICE}} <span class="mbw-switch-lang" data-keyword="rub">руб.</span></div>'+
                '<div class="mbw-ser-item-checkbox mbw-unsel" data-checked="{{checked}}" data-plcid="{{ACTION_SCHEME_ID}}" data-serid="{{ACTION_ADDITIONAL_SERVICE_ID}}">' +
                '<i class="fa fa-plus icon-checked-vis"></i>' +
                '<i class="fa fa-times icon-checked-invis"></i>' +
                '</div>'+
                    //                                                                '<div class="mbw-ser-item-count mbw-unsel">{{ser_item_count}}</div>'+
                    //                                                                '<div class="mbw-ser-item-minus mbw-unsel" data-agid="{{ser_ag_id}}" data-serid="{{ACTION_ADDITIONAL_SERVICE_ID}}"><i class="fa fa-minus"></i></div>'+
                    //                                                                '<div class="mbw-ser-item-plus mbw-unsel" data-agid="{{ser_ag_id}}" data-serid="{{ACTION_ADDITIONAL_SERVICE_ID}}"><i class="fa fa-plus"></i></div>'+
                '</div>'+
                '</div>'+
                '{{/services}}'+
                '</div>' +
                '</div>' +
                '{{/service_groups}}' +
                '</div>'+
                '</div>'+
                '{{/places}}'+

                '</div>'+
                '<div class="mbw-ser-cart-wrapper">'+
                '<div class="mbw-ser-cart-list">'+
                '{{#cart}}'+
                '<div class="mbw-ser-cart-item" data-plcid="{{ACTION_SCHEME_ID}}" data-serid="{{ACTION_ADDITIONAL_SERVICE_ID}}">'+
                '<div class="mbw-ser-cart-item-ag">{{plc_label}}</div>'+
                '<div class="mbw-ser-cart-item-title">{{ADDITIONAL_SERVICE_NAME}}</div>'+
//                                            '<div class="mbw-ser-cart-item-remove"><i class="fa fa-trash-o"></i></div>'+
                '<div class="mbw-ser-cart-item-price">{{PRICE}} <span class="mbw-switch-lang" data-keyword="rub">руб.</span></div>'+
                '<div class="mbw-ser-cart-item-remove" data-plcid="{{ACTION_SCHEME_ID}}" data-serid="{{ACTION_ADDITIONAL_SERVICE_ID}}"><i class="fa fa-times"></i></div>'+
//                                        '<div class="mbw-ser-cart-item-total">{{ser_cart_item_total}} <span class="mbw-switch-lang" data-keyword="rub">руб.</span></div>'+
//                                        '<div class="mbw-ser-cart-item-minus mbw-unsel" data-agid="{{ser_cart_item_ag_id}}" data-serid="{{ser_cart_item_id}}"><i class="fa fa-minus"></i></div>'+
//                                        '<div class="mbw-ser-cart-item-plus mbw-unsel" data-agid="{{ser_cart_item_ag_id}}" data-serid="{{ser_cart_item_id}}"><i class="fa fa-plus"></i></div>'+
                '</div>'+
                '{{/cart}}'+
                '</div>'+
                '<div class="mbw-ser-cart-total-wrapper">'+
                '<div class="mbw-ser-cart-total-amount"><span class="mbw-switch-lang" data-keyword="as-total">Итого за услуги</span>: <span class="mbw-ser-cart-total">{{totalServiceAmount}}</span> <span class="mbw-switch-lang" data-keyword="rub">руб.</span></div>'+
                '</div>'+
                '</div>'+
                '</div>'+
                '</div>';


            var wasOpened = (widgetWrapper.find('.mbw-services-wrapper').hasClass('mbw-opened'))? 'mbw-opened': '';
            widgetWrapper.find('.mbw-services-wrapper').remove();
            widgetWrapper.find('.mbw-header').append(Mustache.to_html(servicesHtml, widget.additionalServiceData));

            widget.additionalServiceDD = widgetWrapper.find('.mbw-services-wrapper');
            widget.additionalServiceDD.addClass(wasOpened);
            headerFooterHeight = wrapper.find('.mbw-header').outerHeight() + wrapper.find('.mbw-footer').outerHeight() + wrapper.find('.mbw-mobile-choose-sector-header').outerHeight();

            if($(window).outerWidth() <= 640){
                widget.additionalServiceDD.height(widget.canvasContainerHeight + 'px');
                widget.additionalServiceDD.css('bottom', -widget.canvasContainerHeight - 78 + 'px');
            }else{
                widget.canvasContainerHeight = ($(window).height() - headerFooterHeight);
            }
            widget.additionalServiceDD.height(widget.canvasContainerHeight + 'px');

            widgetWrapper.find('.mbw-services-list').scrollTop(serScTop);
            widgetWrapper.find('.mbw-ser-cart-list').scrollTop(serBasketScTop);
        },

        populateWidget: function(callback){

            var ddToggleHtml = '';
            var moveLang = '';
            var invisBtns = '';
            var hideDD = '';
            var curAct = widget.getActionById(widget.active_action_id);
            var sbag = curAct['SPLIT_BY_AREA_GROUP'] == 'TRUE';

            if(initData['actions'].split(',').length > 1){

            }else{
                moveLang = 'moveLang';
                hideDD = 'hidden';
            }

            var fixSceneHtml = (initData['showscene'])? '<div class="mbw-fix-scene"><span class="mbw-switch-lang" data-keyword="fix-scene">Сцена</span><br><i class="fa fa-angle-down"></i></div>':'';

            if(sbag && widget.isMultiAction > 1){
                invisBtns = 'hidden';
            }else{
                if(widget.isMultiAction > 1){
                    wrapper.addClass('zonesView');
                }
            }

            var zoomsHidden = '';//(sbag)? 'hidden' : '';

            var mO = {
                title: '',
                actions: []
            };

            var afishaTogglerHtml = '';
            var afishaDDOpened = '';
            var beforeAfishaShown = '';

            var additionalServicesButton = '';
            var totalAdditionalBlock = '';


//            if(widget.isServices){
            additionalServicesButton = '<div class="mbw-additional-service-button"><span class="mbw-switch-lang" data-keyword="serviceButton">Услуги</span></div>';

            totalAdditionalBlock =  '<div class="mbw-addit-service">' +
            '<span class="mbw-switch-lang" data-keyword="serviceButton">Услуги</span>: ' +
            '<span class="mbw-addit-service-insert">0</span> ' +
            '<span class="mbw-switch-lang" data-keyword="rub">руб.</span>' +
            '</div>';
//            }

            var kkTitle = (isKK15)? 'Выбрать дату' : 'Афиша';

            if(widget.isMultiAction > 1){
                afishaTogglerHtml = '<div class="mbw-dd-toggler hidden'+hideDD+'"><span class="mbw-switch-lang" data-keyword="afisha">'+kkTitle+'</span> <i class="fa fa-list-ul"></i></div></div>';
                afishaDDOpened = 'opened';
                beforeAfishaShown = 'mbw-before-afisha-shown';
            }else{
                afishaTogglerHtml = '<div class="mbw-dd-toggler '+hideDD+'"><span class="mbw-switch-lang" data-keyword="allEvents">Все мероприятия</span> <i class="fa fa-angle-down"></i></div></div>';
                afishaDDOpened = '';
                beforeAfishaShown = '';
            }

            var tpl = '<div class="mbw-header"><div class="mbw-header-inner"><div class="mbw-title" title="{{title}}">{{{title}}}</div>' +
                '<div class="mbw-lang-switcher '+moveLang+' '+ beforeAfishaShown +'">' +
                '<div class="mbw-lang active" data-lang="rus">RUS</div>' +
                '<div class="mbw-lang" data-lang="eng">ENG</div>' +
                '</div>' +
                afishaTogglerHtml +
//                '<div class="mbw-dd-toggler '+hideDD+'"><span class="mbw-switch-lang" data-keyword="allEvents">Все мероприятия</span> <i class="fa fa-angle-down"></i></div></div>' +
                '<div class="mbw-dd '+ afishaDDOpened+ ' ' +hideDD+'">' +
                '<ul>' +
                '<li class="mbw-first-li">' +
                '<div class="mbw-left-title"><span class="mbw-switch-lang" data-keyword="action">Мероприятие</span></div>' +
                '<div class="mbw-right-title"><span class="mbw-switch-lang" data-keyword="freePlaceCount">Свободных мест</span></div>' +
                '</li>' +
                '{{#actions}}' +
                '<li data-action-id="{{id}}">' +
                '<div class="mbw-left-title">{{title}}</div>' +
                '<div class="mbw-right-title">{{freePlaceCount}}</div>' +
                '</li>' +
                '{{/actions}}' +
                '</ul>' +
                '</div>' +
                '</div>' +

                '<div class="mbw-content">' +
                '<div class="mbw-canvas-wrapper"></div>' +
                '<div class="mbw-zoom-in '+zoomsHidden+'"><i class="fa fa-plus"></i></div>' +
                '<div class="mbw-zoom-out '+zoomsHidden+'"><i class="fa fa-minus"></i></div>' +
                '<div class="mbw-priceGroups-wrapper"><ul></ul></div>' +
                '<div class="mbw-loader" style="background-image: url(\''+initData.host+'assets/widget/preloader.GIF\')"></div>' +
                '<div class="mbw-prompt-wrapper"></div>' +
                '<div class="mbw-prompt-wrapper-full"></div>' +
                '<div class="mbw-alerter-wrapper"></div>' +
                '<div class="mbw-modal-wrapper"></div>' +
                fixSceneHtml +
                    //'<div class="mbw-scene-bunner"><span class="mbw-switch-lang" data-keyword="scene">Сцена</span></div>' +
                '</div>' +
                '<div class="mbw-footer">' +
                '<div class="mbw-footer-fader"></div>' +
                '<div class="mbw-back /*'+invisBtns+'*/">' +
                '<span class="mbw-switch-lang" data-keyword="back-to-zones">Вернуться</span>' +
                '</div>' +
                '<div class="mbw-mobile mbw-mobile-choose-sector-wrapper">' +
                '<div class="mbw-mobile-choose-sector-header">' +
                '<div class="mbw-back"><i class="fa fa-mail-reply"></i></div>' +
                '<div class="mbw-mobile-choose-sector-title">' +
                '<span class="mbw-switch-lang" data-keyword="choose_sector">Выбрать сектор</span>' +
                '</div>'+
                '<div class="mbw-zoom-out"><i class="fa fa-minus"></i></div>' +
                '<div class="mbw-zoom-in"><i class="fa fa-plus"></i></div>' +
                '<div class="mbw-mobile-choose-sector-close"><i class="fa fa-angle-down"></i></div>' +
                '</div>' +
                '<div class="mbw-mobile-choose-sector-content">' +
                    //'<ul>{{#sectors}}<li data-id="{{id}}">{{title}}{{places_count}}{{prices}}</li>{{/sectors}}</ul>' +
                '</div>' +
                '</div>' +
                '<div style="display: none!important" class="mbw-forward '+invisBtns+'">' +
                '<span class="mbw-switch-lang" data-keyword="go-to-hall">Перейти к местам</span>' +
                '</div>' +
                '<div class="mbw-basket-wrapper">'+additionalServicesButton+
                '<div class="mbw-total-wrapper">' +
                '<i class="mbw-basket-sign fa fa-shopping-cart"></i>'+
                '<div class="mbw-total-inner">' +
                '<div class="mbw-service-fee-total">' +
                '<span class="mbw-switch-lang" data-keyword="service-fee">Сервисный сбор</span>: ' +
                '<span class="mbw-service-fee-insert">0</span> ' +
                '<span class="mbw-switch-lang" data-keyword="rub">руб.</span>' +
                '</div>' + totalAdditionalBlock +
                '<div class="mbw-total-amount">' +
                '<span class="mbw-switch-lang" data-keyword="total-amount">Итого</span>: ' +
                '<span class="mbw-total-amount-insert">0</span> ' +
                '<span class="mbw-switch-lang" data-keyword="rub">руб.</span>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '<div class="mbw-clear-basket-wrapper">' +
                '<span class="mbw-switch-lang" data-keyword="clear-basket">Очистить<br />корзину</span>' +
                '<i class="mbw-mobile fa fa-trash-o"></i>' +
                '</div>' +
                '<div class="mbw-purchase-order mbw-ta-center">' +
                '<span class="mbw-switch-lang" data-keyword="purchase-order">Купить</span>' +
                '<i class="mbw-mobile fa fa-shopping-cart"></i>' +
                '</div>' +
                '<div class="mbw-basket-dd-wrapper">' +
                '<div class="mbw-basket-dd-header">' +
                '<div class="mbw-basket-dd-title">' +
                '<span class="mbw-switch-lang" data-keyword="basket">Корзина</span>' +
                '</div>'+
                '<div class="mbw-basket-dd-close"><i class="fa fa-angle-down"></i></div>' +
                '</div>' +
                '<div class="mbw-basket-dd-content">' +
                '<ul><li class="mbw-empty-basket"><span class="mbw-switch-lang" data-keyword="emptyBasket">Корзина пуста</span></li></ul>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '<form method="POST" action="https://secure.acquiropay.com/" class="mbw-form-pay"></form>' +
                '</div>';


            if (!widget.actions[0]){
                wrapper.html('<div class="action_error">Мероприятие не доступно для продажи</div>');
                return;
            }
            if(widget.isMultiAction > 1){
                mO.title = '<span class="mbw-slide-title mbw-switch-lang" data-keyword="select_action">Выберите мероприятие</span>';//widget.actions[0]['ACTION_NAME'] +' - '+ widget.actions[0]['ACTION_DATE'] +', '+widget.actions[0]['HALL'];
            }else{
                mO.title = '<span class="mbw-slide-title">'+ widget.actions[0]['ACTION_NAME'] +' - '+ widget.actions[0]['ACTION_DATE'] +', '+widget.actions[0]['HALL'] + '</span>';
            }

            for(var i in widget.actions){
                var action = widget.actions[i];
                if(typeof action == 'function'){
                    continue;
                }
                mO.actions.push({
                    id: action['ACTION_ID'],
                    title: action['ACTION_NAME']+ ' - ' +action['ACTION_DATE'] + ', '+ action['HALL'],
                    freePlaceCount: (widget.active_action_is_wo)? action['ACTION_DATE'] : action['FREE_PLACE_COUNT']
                });
            }



            wrapper.addClass(initData['widget_theme']);
            if (isNaN(+initData['width']) || initData['width']==''){
                initData['width'] = wrapper.parent().width()
            }
            wrapper.width(initData['width']);
            wrapper.html(Mustache.to_html(tpl, mO));

            if(widget.isServices){
                wrapper.addClass('mbw-additional-services');
            }

            widget.runSlideTitle();
            widget.canvasContainer = wrapper.find('.mbw-canvas-wrapper');
            var basketWrapper = wrapper.find('.mbw-basket-dd-wrapper');
            var basketContent = wrapper.find('.mbw-basket-dd-content');

            var sectorsWrapper = wrapper.find('.mbw-mobile-choose-sector-wrapper');
            var sectorsContent = wrapper.find('.mbw-mobile-choose-sector-content');
            var test =  wrapper.find('.mbw-mobile-choose-sector-header').outerHeight();

            headerFooterHeight = wrapper.find('.mbw-header').outerHeight() + wrapper.find('.mbw-footer').outerHeight() + wrapper.find('.mbw-mobile-choose-sector-header').outerHeight();
            footerHeight = wrapper.find('.mbw-footer').outerHeight() + wrapper.find('.mbw-mobile-choose-sector-header').outerHeight();
            widget.canvasContainer.width(initData['width']+'px');
            widget.canvasContainerHeight = ($(window).outerHeight() - headerFooterHeight);
            if(widget.active_action_is_wo){
            }else{
                if($(window).outerWidth() <= 640){
                    basketWrapper.height(widget.canvasContainerHeight + 'px');
                    basketWrapper.css('bottom', -widget.canvasContainerHeight - 78 + 'px');
                    basketContent.height(widget.canvasContainerHeight - wrapper.find('.mbw-basket-dd-header').outerHeight()  + 'px');

                    sectorsWrapper.height(widget.canvasContainerHeight + 'px');
                    sectorsWrapper.css('bottom', -(widget.canvasContainerHeight - 118) + 'px');
                    sectorsContent.height(widget.canvasContainerHeight - wrapper.find('.mbw-mobile-choose-sector-header').outerHeight()  + 'px');
                }else{
                    widget.canvasContainerHeight = ($(window).height() - headerFooterHeight);
                }
                widget.canvasContainer.height(widget.canvasContainerHeight + 'px');
            }

            //console.log(widget.canvasContainer);

            widget.basketUl = wrapper.find('.mbw-basket-dd-content ul');
            widget.totalFee = wrapper.find('.mbw-service-fee-insert');
            widget.totalAddititonalServices = wrapper.find('.mbw-addit-service-insert');
            widget.totalAmount = wrapper.find('.mbw-total-amount-insert');
            widget.clearBasket = wrapper.find('.mbw-clear-basket-wrapper');
            widget.priceGroups = wrapper.find('.mbw-priceGroups-wrapper ul');

            var offsetTop = parseInt(wrapper.offset().top);

            if(document.location.href.indexOf('mirbileta') == -1){
                $("body").scrollTop(offsetTop);
            }else{
                $("body").animate({
                    scrollTop: offsetTop
                }, 400, function(){

                });
            }


            if(typeof callback == 'function'){
                callback();
            }
        },                      //POPULATE WIDGET

        getActionById: function(id){
            if (!id) {
                return widget.actions[0];
            }
            for (var i in widget.actions) {
                if (isNaN(+i)) {
                    continue;
                }
                if (+widget.actions[i].ACTION_ID === +id) {
                    return widget.actions[i];
                }
            }
            return false;
        },

        renderCanvas: function(obj, callback){

            if (typeof callback !== "function") {
                callback = function(){};
            }

            if (typeof obj !== "object"){
                return callback();
            }

            var action_id = +obj.ACTION_ID;
            var frame = obj.FRAME;
            var alias = ('action_' + action_id);
            if (typeof widget.map==="object"){
                if (typeof widget.map.destroy === 'function'){
                    widget.map.destroy();
                    delete widget.map;
                }
            }
            widget.map = new Map1({
                container:widget.canvasContainer,
                mode:"iFrame",
                displayNavigator:'none',
                /*cWidth:width,*/
                /*cHeight:598,*/
                cHeight: widget.canvasContainerHeight,
                doc_root:doc_root || host,
                selectionLimit:10,
                /*bgColor:"#423c30",*/
                bgColor:(obj.BG_COLOR && obj.BG_COLOR!=="")? obj.BG_COLOR : "#f7f7f7",
                zonesBgColor:"#423c30",
                scaleByBackground: obj.SCALE_BY_BACKGROUND == "TRUE"
            });
            entryTickets.map = widget.map;

            /*wrapper.find("*").each(function(){
             preventSelection($(this)[0]);
             });*/
            var socketObject = {
                type:"action_scheme",
                param:"action_id",
                id:action_id,
                portion:30,
                save:{},
                load:{
                    command:"get_action_scheme",
                    params:{
                        action_id:action_id,
                        frame:frame
                    },
                    /*columns:"ACTION_SCHEME_ID,PRICE,STATUS,STATUS_TEXT,FUND_GROUP_NAME,PRICE_GROUP_NAME,BLOCK_COLOR,COLOR",*/
                    field_name:"action_scheme_id"
                }
            };
            var squareO = {
                command: socketObject.load.command,
                params: socketObject.load.params
            };
            var layerO = {
                command: "get_action_scheme_layer",
                params: socketObject.load.params
            };
            var objectO = {
                command: "get_action_scheme_object",
                params:{
                    action_id:action_id
                },
                param_field:"ACTION_SCHEME_LAYER_ID"
            };
            var sectorO = {
                command: "get_action_sectors",
                params: {
                    action_id:action_id,
                    frame: frame
                }
            };

            /*            var socketObject = {
             sid: sid,
             type: "action_scheme",
             param: "action_id",
             id: environment.activeId,
             portion: 1000,
             save: {
             command: "operation",
             object: "block_place_list",
             params: {
             action_id: environment.activeId
             },
             field_name: "action_scheme_id"
             },
             load: {
             command: "get",
             object: "action_scheme",
             params: {
             action_id: environment.activeId
             },
             columns: "ACTION_SCHEME_ID,PRICE,STATUS,STATUS_TEXT,FUND_GROUP_NAME,PRICE_GROUP_NAME,BLOCK_COLOR,COLOR",
             field_name: "action_scheme_id"
             }
             };*/
            widget.map.openSocket(socketObject);
            var curAct = widget.getActionById(widget.active_action_id);
            var sbag = curAct['SPLIT_BY_AREA_GROUP'] == 'TRUE'; //split_by_area_group

            if(sbag){
                widget.map.loadSectors({
                    socketObject:socketObject,
                    squareO:squareO,
                    layerO:layerO,
                    objectO:objectO,
                    sectorO:sectorO,
                    action_id:action_id,
                    frame:frame,
                    theme:initData['widget_theme']
                },function(){
                    /*layerO.params.VISIBLE = 'SECTOR';*/
                    objectO.params.VISIBLE = 'SECTOR';
                    entryTickets.check("sectors", true);
                    widget.map.loadRenderItems({
                        layerO: layerO,
                        objectO: objectO
                    }, function () {
                        widget.map.render();
                        widget.map.loading = false;
                    });
                    widget.populateSectors();
                    widget.renderScene(action_id);
                    callback();
                });
                console.log('go go render zones');
            }else{
                console.log('go go render hall scheme');
                widget.map.loadSquares(squareO, function () {
                    layerO.params.VISIBLE = 'IFRAME';
                    objectO.params.VISIBLE = 'IFRAME';
                    widget.map.loadRenderItems({
                        layerO: layerO,
                        objectO: objectO
                    }, function () {
                        widget.map.render();
                        widget.map.loading = false;
                    });
                    widget.map.setLayout(function () {
                        widget.map.setMinMax(function () {
                            widget.renderScene();
                            widget.map.setScaleCoff(function () {
                                widget.map.render(function () {
                                    entryTickets.check("squares");
                                    widget.updateMap();
                                    widget.map.reLoadLayout(function () {
                                        widget.populateLegend();
                                        if(typeof callback == 'function'){
                                            callback();
                                        }

                                    });
                                });
                                widget.map.setEvents();
                            });

                        });
                    });
                });

            }

            //map.openSocket(socketObject);
            /*widget.map.loadSquares(squareO, function () {

             widget.map.loadRenderItems({
             layerO: layerO,
             objectO: objectO
             }, function () {
             //map.render();
             });
             widget.map.setLayout(function () {
             widget.map.setMinMax(function () {
             widget.map.setScaleCoff(function () {
             widget.map.render(function () {
             widget.map.reLoadLayout(function () {
             widget.populateLegend();
             if(typeof callback == 'function'){
             callback();
             }

             });
             });
             widget.map.setEvents();
             });

             });
             });
             });*/
        },                   //RENDER CANVAS

        populateSectors: function(){
            var sectorsContent = widget.sectorsWrapper.find('.mbw-mobile-choose-sector-content');
            var tpl = '<div class="mbw-sec-thead">' +
                '<div class="mbw-inline mbw-sec-th-title">' +
                '<span class="mbw-switch-lang" data-keyword="th-title">Сектор:</span>' +
                '</div>' +
                '<div class="mbw-inline mbw-sec-th-prices">' +
                '<span class="mbw-switch-lang" data-keyword="th-prices">Цены (руб.):</span>' +'' +
                '</div>' +
                '<div class="mbw-inline mbw-sec-th-count">' +
                '<span class="mbw-switch-lang" data-keyword="th-count">Своб. мест:</span>' +
                '</div>' +
                '</div>' +
                '<ul>' +
                '{{#sectors}}<li class="mbw-sector-item" data-id="{{action_group_id}}">' +
                '<div class="mbw-sec-title mbw-inline">{{name}}</div>' +
                '<div class="mbw-sec-prices mbw-inline">{{prices}}</div>' +
                '<div class="mbw-sec-count mbw-inline">{{free_places}}</div>' +
                '</li>{{/sectors}}' +
                '</ul>';

            var mO = {
                sectors:[]
            };

            for(var i in widget.map.sectors){
                var sec = widget.map.sectors[i];
                var minp = sec.min_price;
                var maxp = sec.max_price;
                widget.map.sectors[i].prices = (minp == maxp)? minp : minp+' - '+maxp;
                if(+sec.free_places > 0){
                    mO.sectors.push(sec);
                }
            }

            sectorsContent.html(Mustache.to_html(tpl, mO));
            var sectors = wrapper.find('.mbw-sector-item');
            sectors.off('click').on('click', function(){
                var secId = $(this).data('id');
                for(var i in widget.map.sectors){
                    var sec = widget.map.sectors[i];
                    sec.selected = false;
                    if(sec.action_group_id == secId){
                        widget.map.sectors[i].selected = true;
                    }
                }
                widget.loader(true);

                var bottomClose = widget.sectorsWrapper.height() - 118;

                widget.sectorsWrapper.animate({
                    bottom: -bottomClose+'px'
                }, 200,function(){
                    widget.sectorsWrapper.addClass('places-state');
                    widget.sectorsWrapper.removeClass('opened');
                });
                widget.map.sectorsSelect(function () {
                    entryTickets.close();
                    widget.updateMap();
                    widget.populateLegend();
                    entryTickets.check("squares");
                    widget.loader(false);
                });
                widget.backBtn.show(0);
                wrapper.addClass('hallView');
                wrapper.removeClass('zonesView');
            });

        },

        setSectorPlateState: function(state){ // sectors / places | UNUSED!

            if(state == 'sectors'){

            }else if(state == 'places'){

            }else{

            }
        },

        getTotalTicketPassOrderedCount: function(){
            var inls = localStorage.getItem('mbw-tp-basket');
            var result = 0;
            if (inls == null){
                return result;
            }else{
                inls = JSON.parse(inls);
            }
            for(var i in inls){
                var lsi = inls[i];
                for(var k in lsi){
                    var a = lsi[k];
                    for(var j in a.groups){
                        var g = a.groups[j];
                        result += +g.count;
                    }
                }
            }

            console.log('now ordered', result);

            return result;
        },

        getTicketPassPreorderedCountFromLs: function(action_id, id){
            var inls = localStorage.getItem('mbw-tp-basket');
            var result = {count: 0};
            if (inls == null){
                return result;
            }else{
                inls = JSON.parse(inls);
            }
            for(var i in inls){
                var lsi = inls[i];
                for(var k in lsi){
                    var a = lsi[k];
                    if(a.id == action_id){
                        for(var j in a.groups){
                            var g = a.groups[j];
                            if(g.id == id){
                                result = g;
                            }
                        }
                    }
                }
            }

            return result;
        },

        populateMapFromLs: function(actionId, callback){
            var active_id = widget.getActionById(actionId);
            var alias = ('action_' + active_id['ACTION_ID']);
            if(typeof active_id == 'object'){
                var mapInstance = widget.map;
                var storedTickets = localStorage.getItem('mbw-basket');
                if(storedTickets == null){
                    return;
                }
                storedTickets = JSON.parse(storedTickets);

                for(var i in storedTickets.actions){
                    var act = storedTickets.actions[i];
                    if(act.id == actionId){
                        var selArr = [];
                        for(var pl in act.places){
                            var square = widget.map.squares[act.places[pl].id];
                            if (!square){
                                continue;
                            }
                            if(square.status !== 0){
                                selArr.push(act.places[pl].id);
                            }
                        }
                        mapInstance.addToSelectionArray(selArr);
                    }
                }
            }

            if(typeof callback == 'function'){
                callback();
            }
        },

        switchLanguage: function(lang){
            var keywords = [
                {
                    key: 'fix-scene',
                    rus: 'Сцена',
                    eng: 'Scene'
                },
                {
                    key: 'go-to-hall',
                    rus: 'Перейти к местам',
                    eng: 'Show places'
                },
                {
                    key: 'action',
                    rus: 'Мероприятие',
                    eng: 'Event'
                },
                {
                    key: 'scene',
                    rus: 'Сцена',
                    eng: 'Scene'
                },
                {
                    key: 'emptyBasket',
                    rus: 'Корзина пуста',
                    eng: 'Cart is empty'
                },
                {
                    key: 'allEvents',
                    rus: 'Все мероприятия',
                    eng: 'All Events'
                },
                {
                    key: 'freePlaceCount',
                    rus: 'Свободных мест',
                    eng: 'Places free'
                },
                {
                    key: 'back-to-zones',
                    rus: 'Вернуться',
                    eng: 'Back'
                },
                {
                    key: 'service-fee',
                    rus: 'Сервисный сбор',
                    eng: 'Service fee'
                },
                {
                    key: 'rub',
                    rus: 'руб.',
                    eng: 'rub.'
                },
                {
                    key: 'total-amount',
                    rus: 'Итого',
                    eng: 'Total'
                },
                {
                    key: 'clear-basket',
                    rus: 'Очистить<br />корзину',
                    eng: 'Clear<br />basket'
                },
                {
                    key: 'purchase-order',
                    rus: 'Купить',
                    eng: 'Buy'
                },
                {
                    key: 'basket',
                    rus: 'Корзина',
                    eng: 'Cart'
                },
                {
                    key: 'choose_sector',
                    rus: 'Выбрать сектор',
                    eng: 'Choose sector'
                },
                {
                    key: 'th-title',
                    rus: 'Сектор:',
                    eng: 'Sector:'
                },
                {
                    key: 'th-prices',
                    rus: 'Цены (руб.):',
                    eng: 'Prices (rub.):'
                },
                {
                    key: 'th-count',
                    rus: 'Своб. мест:',
                    eng: 'free places:'
                },
                {
                    key: 'unavailable_places',
                    rus: 'Недоступные',
                    eng: 'Unavailable'
                },
                {
                    key: 'select_action',
                    rus: 'Выберите мероприятие',
                    eng: 'Choose event'
                },
                {
                    key: 'afisha',
                    rus: (isKK15)? 'Выбрать дату' : 'Афиша',
                    eng: (isKK15)? 'Choose date' : 'Events'
                },
                {
                    key: 'closeAfisha',
                    rus: 'Закрыть',
                    eng: 'Close'
                },
                {
                    key: 'serviceButton',
                    rus: 'Услуги',
                    eng: 'Services'
                },
                {
                    key: 'additionalServices',
                    rus: 'Дополнительные услуги',
                    eng: 'Additional services'
                },
                {
                    key: 'otherServices',
                    rus: 'Прочие услуги',
                    eng: 'Other services'
                },
                {
                    key: 'serviceDependNotification',
                    rus: 'Необходимо предварительно выбрать места для которых доступны услуги.',
                    eng: 'You must first choose a places for which the services is available.'
                },
                {
                    key: 'as-total',
                    rus: 'Итого за услуги',
                    eng: 'Total for services'
                }
            ];
            var blocks = wrapper.find('.mbw-switch-lang');
            for(var i=0; i<blocks.length; i++){
                var block = blocks.eq(i);

                for(var k in keywords){
                    var item = keywords[k];
                    if(item.key == block.data('keyword')){
                        block.html(item[lang]);
                    }
                }
            }
        },

        getGroupDataById: function(action_id, id){
            var res = undefined;
            for(var i in widget.tp_zones){
                var z = widget.tp_zones[i];
                for(var k in z){
                    var g = z[k];
                    if(g['ACTION_ID'] == action_id && g['ACTION_SCHEME_TICKET_ZONE_ID'] == id){
                        res = g;
                        break;
                    }
                }
            }

            return res;
        },

        convertDateFormat: function(str){
            //working example 'dd.mm.yyyy hh:mm:ss';
            var primalStr = str;
            var d = primalStr.substr(0,2);
            var m = primalStr.substr(3,2);
            var y = primalStr.substr(6,4);
            var t = primalStr.substr(10);

            return m+'.'+d+'.'+y+' '+t;
        },

        updateLsTicketPass: function(action_id){
            var list = entryTickets.selection;
            var inls = {
                actions: []
            };

            localStorage.setItem('mbw-tp-basket',JSON.stringify(inls));

            var current_action = false;
            for (var j in inls.actions) {
                var action = inls.actions[j];
                if (action.id == action_id){
                    current_action = action;
                    break;
                }
            }

//            console.log(current_action);

            if (!current_action) {
                var lenght = inls.actions.push({
                    id: widget.active_action_id,
                    date: widget.convertDateFormat(widget.getActionById(widget.active_action_id).ACTION_FINISH_SALE_DATE),
                    groups: []
                });
                current_action = inls.actions[lenght-1];
            }

            for (var i in list) {
                var ticketZone = list[i];
                if(+ticketZone.count > 0) {
                    current_action.groups.push({
                        id: i,
                        count: ticketZone.count,
                        price: ticketZone.price,
                        name: ticketZone.name,
                        sector: ticketZone.sector
                    });
                }
            }

            localStorage.setItem('mbw-tp-basket', JSON.stringify(inls));
            widget.populateBasket();
        },

        addToLS: function(places,callback){
            if (typeof places!=="object"){
                console.log('addToLS не передан places');
                return;
            }

            var inls = localStorage.getItem('mbw-basket');
            if (inls == null){
                inls = {
                    actions: []
                };
                localStorage.setItem('mbw-basket',JSON.stringify(inls));
            }else{
                inls = JSON.parse(inls);
            }

            //поверим есть ли в LS action_id
            var current_action = false;
            for (var j in inls.actions) {
                var action = inls.actions[j];
                if (action.id===widget.active_action_id){
                    current_action = action;
                    break;
                }
            }

            if (!current_action) {
                var lenght = inls.actions.push({
                    id: widget.active_action_id,
                    date: widget.convertDateFormat(widget.getActionById(widget.active_action_id).ACTION_FINISH_SALE_DATE),
                    places: []
                });
                current_action = inls.actions[lenght-1];
            }
            for (var i in places) {
                var place = places[i];
                var alreadyAdded = false;
                for (var i2 in current_action.places) {
                    var placeInLS = current_action.places[i2];
                    if (placeInLS.id == place.id){
                        alreadyAdded = true;
                        break;
                    }
                }
                if (!alreadyAdded){
                    current_action.places.push(place);
                }
            }
            localStorage.setItem('mbw-basket', JSON.stringify(inls));
        },

        removeFinishedActionsFromLs: function(){
            var inls = localStorage.getItem('mbw-basket');
            if (inls == null){
                return;
            }else{
                inls = JSON.parse(inls);
                if(inls.actions){
                    var toRemoveIds = [];
                    for(var i in inls.actions){
                        var lsAct = inls.actions[i];
                        var lsActDate = new Date(lsAct.date);
                        if(new Date(widget.sysDate) > lsActDate){
                            toRemoveIds.push(lsAct.id);
                        }
                    }

                    for(var k in toRemoveIds){
                        var remId = toRemoveIds[k];
                        for(var j in inls.actions){
                            var la = inls.actions[j];
                            if(la.id == remId){
                                inls.actions.splice(j,1);
                            }
                        }
                    }
                    localStorage.setItem('mbw-basket', JSON.stringify(inls));
                }
            }
        },

        removeFromLS:function(action_id,place_id){
            if (!action_id || !place_id){
                console.log('removeFromLS не передан action_id || place_id');
                return [];
            }
            var removedIds = [];
            var inls = localStorage.getItem('mbw-basket');
            if (inls == null){
                return [];
            }
            inls = JSON.parse(inls);
            for (var i in inls.actions) {
                var act = inls.actions[i];
                if (act.id==action_id){
                    var place_group_id, place;
                    for (var i2 in act.places) {
                        place = act.places[i2];
                        if (place.id==place_id){
                            place_group_id = place.place_group_id;
                            break;
                        }
                    }
                    var arrLength = act.places.length;
                    for (var i3 = 0; i3<arrLength; i3++){
                        place = act.places[i3];
                        if ((place.place_group_id==place_group_id && place_group_id!=='') || place.id==place_id){
                            removedIds.push(place.id);
                            delete act.places[i3];
                            if (place_group_id=='') break;
                        }
                    }
                    clearEmpty(act.places);
                    break;
                }
            }
            localStorage.setItem('mbw-basket', JSON.stringify(inls));
            return removedIds;
        },

        clearLS:function(){
            var inls = {
                actions: []
            };
            localStorage.setItem('mbw-basket',JSON.stringify(inls));
        },

        clearTicketPassLS: function(){
            var inls = {
                actions: []
            };
            localStorage.setItem('mbw-tp-basket',JSON.stringify(inls));
            if(entryTickets) entryTickets.clearTickets();
        },

        updateMap:function(){
            var inls = localStorage.getItem('mbw-basket');
            var mapInstance = widget.map;

            if(!mapInstance) return;

            if (inls == null || typeof mapInstance.squares!=="object"){
                return;
            }
            inls = JSON.parse(inls);
            // mapInstance.clearSelection(true);
            for (var i in inls.actions) {
                var action = inls.actions[i];
                if (action.id == widget.active_action_id){
                    var places = action.places;
                    var placesArray = [];
                    for (var i2 in places) {
                        placesArray.push(places[i2].id)
                    }

                    //console.log(placesArray);

                    mapInstance.addToSelectionArray(placesArray, false, true);
                }
            }
            mapInstance.render();

        },

        switchTitle: function(){
            var action = widget.getActionById(widget.active_action_id);
            var title = '<span class="mbw-slide-title">'+ action['ACTION_NAME'] +' - '+ action['ACTION_DATE'] +', '+action['HALL']+ '</span>';
            wrapper.find('.mbw-title').html(title);
            widget.runSlideTitle();
        },

        getAdditionalService: function(plc_id, ser_id){

            for(var i in widget.additionalServices){
                var ser = widget.additionalServices[i];
                if(ser['ACTION_SCHEME_ID'] == plc_id && ser['ACTION_ADDITIONAL_SERVICE_ID'] == ser_id){
                    return ser;
                }
            }

            return false;

            if(agid == 'other'){
                for(var i in widget.additionalServiceData.ser_other_ags){
                    var ser = widget.additionalServiceData.ser_other_ags[i];
                    if(ser['ACTION_ADDITIONAL_SERVICE_ID'] == serid){
                        return ser;
                    }
                }
            }else{
                for(var k in widget.additionalServiceData.ser_ags){
                    var ag = widget.additionalServiceData.ser_ags[k];

                    if(ag.ser_ag_id == agid){
                        for(var j in ag.ser_ag_items){
                            var jitem =  ag.ser_ag_items[j];

                            if(jitem['ACTION_ADDITIONAL_SERVICE_ID'] == serid){
                                return jitem;
                            }
                        }
                    }
                }
            }
            return false;
        },

        getBlockedPlacesCount: function(){
            var storedPlaces = JSON.parse(localStorage.getItem('mbw-basket'));
            var storedTickets = JSON.parse(localStorage.getItem('mbw-tp-basket'));

            var count = 0;
            if(storedPlaces != null){
                for(var i in storedPlaces.actions){
                    var a = storedPlaces.actions[i];
                    count += a.places.length;
                }
            }

            if(storedTickets != null){
                for(var i2 in storedTickets.actions){
                    var a2 = storedTickets.actions[i2];
                    count += a2.places.length;
                }
            }


            return count;
        },

        getBlockedPlacesInAg: function(id){
            var storedPlaces = JSON.parse(localStorage.getItem('mbw-basket'));
            var storedTickets = JSON.parse(localStorage.getItem('mbw-tp-basket'));

            var count = 0;

            for(var i in storedPlaces.actions){
                var a = storedPlaces.actions[i];

                for(var k in a.places){
                    var plc = a.places[k];
                    if(plc.additionalServiceGroupId == id){
                        count++;
                    }
                }


            }

            for(var i2 in storedTickets.actions){
                var a2 = storedTickets.actions[i2];
                for(var l in a2.places){
                    var plc2 = a2.places[l];
                    if(plc2.additionalServiceGroupId == id){
                        count++;
                    }
                }
            }
            return count;
        },

        additionalServiceBasket: {
            list: [],

            disableBtns: function(){

                var plusBtns = wrapper.find('.mbw-ser-item-plus, .mbw-ser-cart-item-plus');
                var minusBtns = wrapper.find('.mbw-ser-item-minus, .mbw-ser-cart-item-minus');

                for(var i = 0; i< plusBtns.length; i++){
                    var pBtn = plusBtns.eq(i);
                    var agid = pBtn.data('agid');
                    var serid = pBtn.data('serid');
                    var obj = widget.getAdditionalService(agid, serid);

                    if(!widget.additionalServiceBasket.checkLimit(obj)){
                        pBtn.addClass('mbw-disabled');
                    }else{
                        pBtn.removeClass('mbw-disabled');
                    }
                }
                for(var k = 0; k< minusBtns.length; k++){
                    var mBtn = minusBtns.eq(k);
                    var agid2 = mBtn.data('agid');
                    var serid2 = mBtn.data('serid');
                    var obj2 = widget.getAdditionalService(agid2, serid2);

                    if(obj2.ser_item_count == 0){
                        mBtn.addClass('mbw-disabled');
                    }else{
                        mBtn.removeClass('mbw-disabled');
                    }
                }

            },

            checkoutByPlaceDeselection: function(){

                for(var i in widget.additionalServiceBasket.list){
                    var bitem = widget.additionalServiceBasket.list[i];
                    var plcs = widget.getSelectedPlacesIds();
                    var plc_id = bitem['ACTION_SCHEME_ID'];
                    var ser_id = bitem['ACTION_ADDITIONAL_SERVICE_ID'];
                    var found = false;
                    for(var k in plcs){
                        var plc = plcs[k];
                        if(plc_id == plc){
                            found = true;
                        }
                    }

                    if(!found){
                        delete widget.additionalServiceBasket.list[i];
                    }
                }

                clearEmpty(widget.additionalServiceBasket.list);
                widget.reRenderAdditionalServices();



//                if(widget.additionalServiceData.ser_ags.length == 0){
//                    for(var k in widget.additionalServiceBasket.list){
//                        var kitem = widget.additionalServiceBasket.list[k];
//                        if(kitem.ser_cart_item_ag_id != 'other'){
//                            kitem.ser_cart_item_count = 0;
//                        }
//
//                        var obj = widget.getAdditionalService(kitem.ser_cart_item_ag_id, kitem.ser_cart_item_id);
//                        obj.ser_item_count = 0;
//                    }
//
//
//                    widget.additionalServiceBasket.clearEmpty();
//                    widget.reRenderAdditionalServices();
//                }
            },

            clearBasketHandler: function(){
                widget.additionalServiceBasket.list = [];
                widget.updateAdditionalServices();

                return false;

                for(var i in widget.additionalServiceBasket.list){
                    var item = widget.additionalServiceBasket.list[i];
                    var obj = widget.getAdditionalService(item.ser_cart_item_ag_id, item.ser_cart_item_id);
                    if(item.ser_cart_item_ag_id == 'other'){
                        if(obj.ACTION_ADD_SERVICE_TYPE == 'COUNT_LIMIT_BY_TICKET'){
                            obj.ser_item_count = 0;
                            delete widget.additionalServiceBasket.list[i];
                        }
                    }else{
                        obj.ser_item_count = 0;
                        delete widget.additionalServiceBasket.list[i];
                    }
                }

                function removeDeleted(arr){
                    for(var k in arr){
                        var kitem = arr[k];
                        if(kitem === undefined){
                            arr.splice(i,1);
                            return removeDeleted(arr);
                            break;
                        }
                    }
                }
                removeDeleted(widget.additionalServiceBasket.list);

                widget.updateAdditionalServices();

            },

            getSameServiceCount: function(id){
                var total = 0;
                for(var i in widget.additionalServiceBasket.list){
                    var item = widget.additionalServiceBasket.list[i];
                    if(item.ser_cart_item_id == id){
                        total += parseInt(item.ser_cart_item_count);
                    }
                }
                return total;
            },

            checkCurrentLimit: function(obj){
                var type =      obj.ACTION_ADD_SERVICE_TYPE;
                var limit =     obj.COUNT_LIMIT;
                var quantity =  obj.QUANTITY;
                var ccount =    obj.ser_item_count;

                switch (type){
                    case 'WO_LIMIT':
                        return widget.additionalServiceBasket.getSameServiceCount(obj.ACTION_ADDITIONAL_SERVICE_ID) <= quantity;
                        break;
                    case 'COUNT_LIMIT_BY_ORDER':
                        var sameServiceCount = widget.additionalServiceBasket.getSameServiceCount(obj.ACTION_ADDITIONAL_SERVICE_ID);
                        return sameServiceCount <= quantity && sameServiceCount <= limit;
                        break;
                    case 'COUNT_LIMIT_BY_TICKET':
                        if(obj.LINK_TO_AREA_GROUP == 'TRUE'){
                            return ccount <= quantity && ccount <= widget.getBlockedPlacesInAg(obj.ser_ag_id);
                        }else{
                            var sameServiceCount = widget.additionalServiceBasket.getSameServiceCount(obj.ACTION_ADDITIONAL_SERVICE_ID);
                            return sameServiceCount <= quantity && sameServiceCount <= widget.getBlockedPlacesCount();
                        }
                        break;
                    default:
                        console.log('COME TO DEFAULT');
                        return false;
                        break;
                }
            },

            checkLimit: function(obj){
                var type =      obj.ACTION_ADD_SERVICE_TYPE;
                var limit =     obj.COUNT_LIMIT;
                var quantity =  obj.QUANTITY;
                var ccount =    obj.ser_item_count;

                switch (type){
                    case 'WO_LIMIT':
                        return widget.additionalServiceBasket.getSameServiceCount(obj.ACTION_ADDITIONAL_SERVICE_ID) < quantity;
                        break;
                    case 'COUNT_LIMIT_BY_ORDER':
                        var sameServiceCount = widget.additionalServiceBasket.getSameServiceCount(obj.ACTION_ADDITIONAL_SERVICE_ID);
                        return sameServiceCount+1 <= quantity && sameServiceCount+1 <= limit;
                        break;
                    case 'COUNT_LIMIT_BY_TICKET':
                        var sameServiceCount = widget.additionalServiceBasket.getSameServiceCount(obj.ACTION_ADDITIONAL_SERVICE_ID);
                        if(obj.LINK_TO_AREA_GROUP == 'TRUE'){
                            return ccount < quantity && ccount < widget.getBlockedPlacesInAg(obj.ser_ag_id);
                        }else{
                            return sameServiceCount < quantity && sameServiceCount < widget.getBlockedPlacesCount();
                        }
                        break;
                    default:
                        console.log('COME TO DEFAULT');
                        return false;
                        break;
                }
            },

            update: function(){
                widget.additionalServiceBasket.list = [];
                var chks = widgetWrapper.find('.mbw-ser-item-checkbox');
                for(var i=0; i<chks.length; i++){
                    var chk = chks.eq(i);
                    var state = chk.data('checked') == true || chk.data('checked') == 'true' || chk.attr('data-checked') == 'true' || chk.attr('data-checked') == true;
                    var ser = widget.getAdditionalService(chk.data('plcid'), chk.data('serid'));
                    var plc = widget.getPlaceDataById(chk.data('plcid'));

                    if(state){
                        widget.additionalServiceBasket.list.push({
                            ACTION_ADDITIONAL_SERVICE_ID: ser['ACTION_ADDITIONAL_SERVICE_ID'],
                            ADDITIONAL_SERVICE_NAME: ser['ADDITIONAL_SERVICE_NAME'],
                            ACTION_SCHEME_ID: ser['ACTION_SCHEME_ID'],
                            plc_label: plc.plc_line_title + ' ' + plc.plc_line + ', ' + plc.plc_place_title + ' ' + plc.plc_place,
                            PRICE:ser['PRICE']
                        });
                    }
                }

                widget.reRenderAdditionalServices();
            },

            removeItem: function(plc_id, ser_id){

            },

            incItem: function(agid, serid){
                var obj = widget.getAdditionalService(agid, serid);
                if(widget.additionalServiceBasket.checkLimit(obj)){
                    if(widget.additionalServiceBasket.list.length == 0){
                        widget.additionalServiceBasket.list.push({
                            ser_cart_item_ag_id:        agid,
                            ser_cart_item_ag_title:     obj.ser_ag_title,
                            ser_cart_item_id:           obj.ACTION_ADDITIONAL_SERVICE_ID,
                            ser_cart_item_title:        obj.ADDITIONAL_SERVICE_NAME,
                            ser_cart_item_price:        obj.PRICE,
                            ser_cart_item_count:        obj.ser_item_count + 1,
                            ser_cart_item_total:        ((obj.ser_item_count + 1) * obj.PRICE)
                        });
                    }else{
                        var found = false;
                        for(var i in widget.additionalServiceBasket.list){
                            var bitem = widget.additionalServiceBasket.list[i];
                            if(bitem.ser_cart_item_ag_id == agid && bitem.ser_cart_item_id == serid){
                                bitem.ser_cart_item_count ++;
                                bitem.ser_cart_item_total = bitem.ser_cart_item_count * bitem.ser_cart_item_price;
                                found = true;
                            }
                        }
                        if(!found){
                            widget.additionalServiceBasket.list.push({
                                ser_cart_item_ag_id:        agid,
                                ser_cart_item_ag_title:     obj.ser_ag_title,
                                ser_cart_item_id:           obj.ACTION_ADDITIONAL_SERVICE_ID,
                                ser_cart_item_title:        obj.ADDITIONAL_SERVICE_NAME,
                                ser_cart_item_price:        obj.PRICE,
                                ser_cart_item_count:        obj.ser_item_count + 1,
                                ser_cart_item_total:        ((obj.ser_item_count + 1) * obj.PRICE)
                            });
                        }
                    }
                    obj.ser_item_count++;
                    widget.updateAdditionalServices();
                }else{
                    console.log('OVER');
                }

            },

            decItem: function(agid, serid){
                var obj = widget.getAdditionalService(agid, serid);
                if(widget.additionalServiceBasket.list.length == 0){
                    return;
                }else{
                    for(var i in widget.additionalServiceBasket.list){
                        var bitem = widget.additionalServiceBasket.list[i];
                        if(bitem.ser_cart_item_ag_id == agid && bitem.ser_cart_item_id == serid){
                            if(bitem.ser_cart_item_count > 0){
                                bitem.ser_cart_item_count --;
                                bitem.ser_cart_item_total = bitem.ser_cart_item_count * bitem.ser_cart_item_price;
                            }
                        }
                    }
                }
                obj.ser_item_count--;
                widget.additionalServiceBasket.clearEmpty();
                widget.updateAdditionalServices();
            },

            getCount: function(agid, serid){
                if(widget.additionalServiceBasket.list.length == 0){
                    return 0;
                }else{
                    var found = false;
                    for(var i in widget.additionalServiceBasket.list){
                        var bitem = widget.additionalServiceBasket.list[i];
                        if(bitem.ser_cart_item_ag_id == agid && bitem.ser_cart_item_id == serid){
                            found = true;
                            return bitem.ser_cart_item_count
                        }
                    }
                    if(!found){
                        return 0;
                    }
                }
            },

            clearEmpty: function(){
                for(var i in widget.additionalServiceBasket.list){
                    var item = widget.additionalServiceBasket.list[i];
                    if(item.ser_cart_item_count == 0){
                        widget.additionalServiceBasket.list.splice(i, 1);
                    }
                }
            },

            getTotal: function(){
                var total = 0;
                for(var i in widget.additionalServiceBasket.list){
                    var item = widget.additionalServiceBasket.list[i];
                    total += parseInt(item.PRICE);
                }

                return parseFloat(total);
            }
        },

        setAdditionalServicesHandlers: function(){

            widgetWrapper.find('.mbw-additional-service-button').off('click').on('click', function(){
                widget.as_was_shown = true;
                if(widget.additionalServiceDD.hasClass('mbw-opened')){
                    widget.additionalServiceDD.removeClass('mbw-opened');
                }else{
                    widget.additionalServiceDD.addClass('mbw-opened');
                }
            });

            widgetWrapper.find('.mbw-services-dd-toggler').off('click').on('click', function(){
                if(widget.additionalServiceDD.hasClass('mbw-opened')){
                    widget.additionalServiceDD.removeClass('mbw-opened');
                }else{
                    widget.additionalServiceDD.addClass('mbw-opened');
                }
            });

            widgetWrapper.find('.mbw-ser-item-minus, .mbw-ser-cart-item-minus').off('click').on('click', function(){
                var agId = $(this).data('agid');
                var serId = $(this).data('serid');
                if($(this).hasClass('mbw-disabled')){
                    return;
                }

                widget.additionalServiceBasket.decItem(agId, serId);



            });

            widgetWrapper.find('.mbw-ser-item-plus, .mbw-ser-cart-item-plus').off('click').on('click', function(){
                var agId = $(this).data('agid');
                var serId = $(this).data('serid');

                if($(this).hasClass('mbw-disabled')){
                    return;
                }

                widget.additionalServiceBasket.incItem(agId, serId);


            });

            widgetWrapper.find('.mbw-ser-ag-dd-toggler').off('click').on('click', function(){
                var p = $(this).parents('.mbw-ser-ag-wrapper');

                if(p.hasClass('mbw-closed')){
                    p.removeClass('mbw-closed');
                    $(this).html('<i class="fa fa-angle-down"></i>');
                }else{
                    p.addClass('mbw-closed');
                    $(this).html('<i class="fa fa-angle-up"></i>');
                }
            });

            widgetWrapper.find('.mbw-ser-item-checkbox').off('click').on('click', function(){

                var plc_id = $(this).data('plcid');
                var ser_id = $(this).data('serid');
                var grp = $(this).parents('.mbw-ser-group-services-list').eq(0);
                var checksInGrp = grp.find('.mbw-ser-item-checkbox');

                if($(this).data('checked') == true || $(this).data('checked') == 'true' || $(this).attr('data-checked') == 'true' || $(this).attr('data-checked') == true){
                    $(this).data('checked', 'false');
                    $(this).attr('data-checked', 'false');
                }else{
                    for(var i = 0; i< checksInGrp.length; i++){
                        var chk = checksInGrp.eq(i);
                        chk.data('checked', 'false');
                        chk.attr('data-checked', 'false');
                    }
                    $(this).data('checked', 'true');
                    $(this).attr('data-checked', 'true');
                }

                widget.additionalServiceBasket.update();
            });

            widgetWrapper.find('.mbw-ser-cart-item-remove').off('click').on('click', function(){
                var plc_id = $(this).data('plcid');
                var ser_id = $(this).data('serid');
                var chk = widgetWrapper.find('.mbw-ser-item-checkbox[data-serid="'+ser_id+'"][data-plcid="'+plc_id+'"]');
                chk.data('checked', 'false');
                chk.attr('data-checked', 'false');
                widget.additionalServiceBasket.update();
            });
        },

        setHandlers: function(callback){
            widget.basketToggler = wrapper.find('.mbw-total-wrapper');
            widget.basketDD = wrapper.find('.mbw-basket-dd-wrapper');
            widget.closeDD = wrapper.find('.mbw-basket-dd-close');
            widget.actionsDDToggler = wrapper.find('.mbw-dd-toggler');
            widget.actionsDD = wrapper.find('.mbw-dd');
            widget.langSwitcher = wrapper.find('.mbw-lang-switcher .mbw-lang');
            widget.zoomIn = wrapper.find('.mbw-zoom-in');
            widget.zoomOut = wrapper.find('.mbw-zoom-out');
            widget.purchaseBtn = wrapper.find('.mbw-purchase-order');
            widget.backBtn = wrapper.find('.mbw-back');
            widget.forwardBtn = wrapper.find('.mbw-forward');
            widget.sectorsWrapper = wrapper.find('.mbw-mobile-choose-sector-wrapper');
            widget.sectorsHeader = wrapper.find('.mbw-mobile-choose-sector-header');
            widget.sectorsClose = wrapper.find('.mbw-mobile-choose-sector-close');


            var mbw_tap_zoomIn = new Hammer(widget.zoomIn[0], {});
            var mbw_tap_zoomOut = new Hammer(widget.zoomOut[0], {});

            var mbw_tap_zoomIn_mobile = new Hammer(widget.zoomIn[1], {});
            var mbw_tap_zoomOut_mobile = new Hammer(widget.zoomOut[1], {});



            widget.basketToggler.off('click').on('click', function(){

                var bottomClose = widget.basketDD.height() - 78;

                if(widget.basketDD.hasClass('opened')){
                    widget.basketDD.animate({
                        bottom: -bottomClose+'px'
                    }, 200,function(){
                        widget.basketDD.removeClass('opened');
                    });
                }else{
                    widget.basketDD.animate({
                        bottom: 78+'px'
                    }, 200,function(){
                        widget.basketDD.addClass('opened');
                    });
                }
            });

            widget.sectorsHeader.off('click').on('click', function(){
                var bottomClose = widget.sectorsWrapper.height() - 118;

                if(widget.sectorsWrapper.hasClass('opened')){
                    widget.sectorsWrapper.animate({
                        bottom: -bottomClose+'px'
                    }, 200,function(){
                        widget.sectorsWrapper.removeClass('opened');
                    });
                }else{
                    widget.sectorsWrapper.animate({
                        bottom: 78+'px'
                    }, 200,function(){
                        widget.sectorsWrapper.addClass('opened');
                    });
                }
            });

            widget.closeDD.off('click').on('click', function(){
                var bottomClose = widget.basketDD.height() - 78;
                widget.basketDD.animate({
                    bottom: -bottomClose+'px'
                }, 200,function(){
                    widget.basketDD.removeClass('opened');
                });
            });

            widget.actionsDDToggler.off('click').on('click', function(){

                var lang = (wrapper.find('.mbw-lang.active').data('lang') == 'rus')? 'rus':'eng';
                var afishaWord = (isKK15)? (lang == 'rus')? 'Выбрать дату' : 'Choose date' : (lang == 'rus')? 'Афиша' : 'Events';
                var closeWord = (lang == 'rus')? 'Закрыть' : 'Close';

                if(widget.actionsDD.hasClass('opened')){
                    widget.actionsDD.removeClass('opened');
                    widget.actionsDDToggler.html('<span class="mbw-switch-lang" data-keyword="afisha">'+afishaWord+'</span> <i class="fa fa-list-ul"></i>');
                }else{
                    widget.actionsDD.addClass('opened');
                    widget.actionsDDToggler.html('<span class="mbw-switch-lang" data-keyword="closeAfisha">'+closeWord+'</span> <i class="fa fa-times"></i>');
                }
            });

            widget.langSwitcher.off('click').on('click', function(){
                var other = undefined;
                if(!$(this).hasClass('active')){
                    if($(this).attr('data-lang') == 'rus'){
                        other = wrapper.find('.mbw-lang-switcher .mbw-lang[data-lang="eng"]');
                        widget.switchLanguage('rus');
                    }else{
                        other = wrapper.find('.mbw-lang-switcher .mbw-lang[data-lang="rus"]');
                        widget.switchLanguage('eng');
                    }
                    $(this).addClass('active');
                    other.removeClass('active');
                }

            });

            widget.actionsDD.find('li:not(".mbw-first-li")').off('click').on('click', function(){
                var actId = $(this).data('action-id');
                var lang = (wrapper.find('.mbw-lang.active').data('lang') == 'rus')? 'rus':'eng';
                var afishaWord = (isKK15)? (lang == 'rus')? 'Выбрать дату' : 'Choose date' : (lang == 'rus')? 'Афиша' : 'Events';
                var closeWord = (lang == 'rus')? 'Закрыть' : 'Close';

                widget.actionsDDToggler.removeClass('hidden');
                wrapper.find('.mbw-lang-switcher').removeClass('mbw-before-afisha-shown');

                if(widget.active_action_is_wo){
                    widget.loader(true);
                    widget.active_action_id = actId;
                    widget.active_action = widget.getActionById(widget.active_action_id);
                    widget.initAdditionalServices(function(){});
                    widget.populateBasket();
                    entryTickets.close();
                    widget.actionsDD.removeClass('opened');
                    widget.actionsDDToggler.html('<span class="mbw-switch-lang" data-keyword="afisha">'+afishaWord+'</span> <i class="fa fa-list-ul"></i>');

                }else{
                    if(widget.map){
                        widget.glowPriceGroup('', false);
                    }

                    widget.loader(true);
                    if(entryTickets){
                        entryTickets.close();
                    }

                    widget.backBtn.hide(0);
                    var curAct = widget.getActionById(widget.active_action_id);
                    var sbag = curAct['SPLIT_BY_AREA_GROUP'] == 'TRUE';
//                    if(sbag){
//                        widget.forwardBtn.show(0);
//                    }
                    widget.actionsDD.removeClass('opened');
                    widget.actionsDDToggler.html('<span class="mbw-switch-lang" data-keyword="afisha">'+afishaWord+'</span> <i class="fa fa-list-ul"></i>');

                    widget.active_action_id = actId;
                    widget.active_action = widget.getActionById(widget.active_action_id);
                    widget.initAdditionalServices(function(){});
                    widget.entryTicketsInit(false, function() {
                        widget.setHandlers();
                        widget.switchTitle();
                        widget.loader(false);
                        widget.populateMapFromLs(actId, function(){
                            widget.setBasketHandlers();
                        });
                    });
                    /*widget.renderCanvas(widget.getActionById(actId),function(){
                     widget.active_action_id = actId;
                     widget.setHandlers();
                     widget.switchTitle();
                     widget.loader(false);
                     widget.populateMapFromLs(actId, function(){
                     widget.setBasketHandlers();
                     });
                     });*/
                }
            });

            widget.canvasContainer.on('addToSelection', function(){
                var placesArr = [];
                for(var i in widget.map.selection){
                    var square = widget.map.squares[widget.map.selection[i]];
                    if (!square){
                        continue;
                    }
                    if (square.status == 0){
                        continue;
                    }

                    placesArr.push(square);
                }
                widget.addToLS(placesArr);
                widget.populateBasket();
                widget.updateAdditionalServices();
            });
            if(entryTickets){
                entryTickets.parent.on('selected_ticket', function(){
                    widget.updateLsTicketPass(widget.active_action_id);
                });
            }


            widget.canvasContainer.on('removeFromSelection', function(e, sel, removedIds){
                for(var i in removedIds){
                    widget.removeFromLS(widget.active_action_id, removedIds[i]);
                }
                widget.populateBasket();
            });

            widget.zoomIn.off('click').on('click', function(e){
                e = e || window.event;
                e.stopPropagation();
            });

            widget.zoomOut.off('click').on('click', function(e){
                e = e || window.event;
                e.stopPropagation();
            });

            widget.zoomIn.off('mousedown').on('mousedown', function(e){
                e = e || window.event;
                var cX = +widget.map.cWidth / 2;
                var cY = +widget.map.cHeight / 2;
                zoomInterval = window.setInterval(function(){
                    widget.canvasContainer.trigger("scale_map", [cX, cY, 1]);
                },50);
                e.stopPropagation();
            });

            widget.zoomOut.off('mousedown').on('mousedown', function(e){
                e = e || window.event;

                var cX = +widget.map.cWidth / 2;
                var cY = +widget.map.cHeight / 2;
                zoomInterval = window.setInterval(function(){
                    widget.canvasContainer.trigger("scale_map", [cX, cY, -1]);
                },50);
                e.stopPropagation();
            });

            mbw_tap_zoomIn.off('tap').on('tap', function(e){
                e = e || window.event;

                var cX = +widget.map.cWidth / 2;
                var cY = +widget.map.cHeight / 2;
                widget.canvasContainer.trigger("scale_map", [cX, cY, 1]);
                e.stopPropagation();
            });

            mbw_tap_zoomOut.off('tap').on('tap', function(e){
                e = e || window.event;
                var cX = +widget.map.cWidth / 2;
                var cY = +widget.map.cHeight / 2;
                widget.canvasContainer.trigger("scale_map", [cX, cY, -1]);
                e.stopPropagation();
            });

            mbw_tap_zoomIn_mobile.off('tap').on('tap', function(e){
                e = e || window.event;

                var cX = +widget.map.cWidth / 2;
                var cY = +widget.map.cHeight / 2;
                widget.canvasContainer.trigger("scale_map", [cX, cY, 1]);
                e.stopPropagation();
            });

            mbw_tap_zoomOut_mobile.off('tap').on('tap', function(e){
                e = e || window.event;
                var cX = +widget.map.cWidth / 2;
                var cY = +widget.map.cHeight / 2;
                widget.canvasContainer.trigger("scale_map", [cX, cY, -1]);
                e.stopPropagation();
            });

            widget.purchaseBtn.off('click').on('click', function(){
                var purchaseAvailiable = false;
                var storedTickets = localStorage.getItem('mbw-tp-basket');
                var storedPlaces = localStorage.getItem('mbw-basket');
                var storedServices = widget.additionalServiceBasket.list;

                var lang = (wrapper.find('.mbw-lang.active').data('lang') == 'rus')? 'rus':'eng';
                var ttl = (lang == 'rus')? 'Внимание' : 'Attention';
                var text = (lang == 'rus')? 'Выберите места' : 'You have to select places first';
                var i;

                if(!storedTickets && !storedPlaces && storedServices.length == 0){
                    widget.alerter(ttl, text, function(){});
                    return;
                }

                storedTickets = JSON.parse(storedTickets);
                storedPlaces = JSON.parse(storedPlaces);

                for (i in storedTickets.actions) {
                    if(storedTickets.actions[i].groups.length) {
                        purchaseAvailiable = true;
                        break;
                    }
                }

                if(!purchaseAvailiable) {
                    for (i in storedPlaces.actions) {
                        if(storedPlaces.actions[i].places.length) {
                            purchaseAvailiable = true;
                            break;
                        }
                    }
                }

                if(!purchaseAvailiable){
                    if(storedServices.length > 0){
                        purchaseAvailiable = true;
                    }
                }

                if(purchaseAvailiable == false){
                    widget.alerter(ttl, text, function(){});
                    return;
                }

                if(purchaseAvailiable){

                    if(initData['withdelivery']){

                        if(initData['frame'] == 'eTicketStore_HsgjxcaKDFSdnd'){
                            widget.openDeliveryForm();
                        }else{
                            widget.selectOrderType();
                        }

                    }else{

                        if(widget.active_action.SERVICE_AVALIBLE_FOR_SALE == 'TRUE'){

                            if(widget.additionalServiceData){
                                if(widget.additionalServiceData.places && widget.additionalServiceData.places.length > 0){
                                    if(widget.as_was_shown == false){
                                        var lang2 = (wrapper.find('.mbw-lang.active').data('lang') == 'rus')? 'rus':'eng';
                                        var asTitle = (lang2 == 'rus')? '<span class="mbw-switch-lang" data-keyword="suggest-as-title">Дополнительные услуги</span>' : '<span class="mbw-switch-lang" data-keyword="suggest-as-title">Additional services</span>' ;
                                        var asHtml =  (lang2 == 'rus')? '<span class="mbw-switch-lang" data-keyword="suggest-as-html">На данное мероприятие доступны дополнительные услуги, хотите взглянуть?</span>' : '<span class="mbw-switch-lang" data-keyword="suggest-as-title">Additional services is allowed on this performance, would you like to look?</span>' ;
                                        var okTitle = (lang2 == 'rus')? '<span class="mbw-switch-lang" data-keyword="suggest-as-ok-title">Да, покажите!</span>' : '<span class="mbw-switch-lang" data-keyword="suggest-as-ok-title">Yes</span>' ;
                                        var cancelTitle = (lang2 == 'rus')? '<span class="mbw-switch-lang" data-keyword="suggest-as-cancel-title">Нет, спасибо</span>' : '<span class="mbw-switch-lang" data-keyword="suggest-as-cancel-title">No, thanks</span>' ;

                                        widget.prompt(asTitle, asHtml,

                                            function(){
                                                if(!widget.additionalServiceDD.hasClass('mbw-opened')){
                                                    widget.additionalServiceDD.addClass('mbw-opened');
                                                }
                                            }, function(){
                                                widget.purchase();
                                            }, false, okTitle, cancelTitle);

                                        widget.as_was_shown = true;
                                    }else{
                                        widget.purchase();
                                    }
                                }else{
                                    widget.purchase();
                                }
                            }else{
                                widget.purchase();
                            }
                        }else{
                            widget.purchase();
                        }


                    }
                }


            });

            widget.canvasContainer.on('sector_click', function(){
                var sectorSelected = false;
                for(var i in widget.map.sectors){
                    var sec = widget.map.sectors[i];
                    if(sec.selected){
                        sectorSelected = true;
                    }
                }
                if(!sectorSelected){
                    var lang = (wrapper.find('.mbw-lang.active').data('lang') == 'rus')? 'rus':'eng';
                    var title = (lang == 'rus')? 'Внимание': 'Attention';
                    var text = (lang == 'rus')? 'Выберите сектор(ы) схемы зала': 'You have to select hall scheme area group(s) first';
                    widget.alerter(title, text, function(){

                    });
                }else{
                    widget.loader(true);

                    widget.sectorsWrapper.addClass('places-state');
                    widget.map.sectorsSelect(function(){
                        entryTickets.check("squares");
                        widget.updateMap();
                        widget.populateLegend();
                        widget.loader(false);
                    });
                    wrapper.addClass('hallView');
                    wrapper.removeClass('zonesView');
                    widget.forwardBtn.hide(0);
                    widget.backBtn.show(0);
                }
            });

            widget.forwardBtn.off('click').on('click', function(){
                var sectorSelected = false;
                for(var i in widget.map.sectors){
                    var sec = widget.map.sectors[i];
                    if(sec.selected){
                        sectorSelected = true;
                    }
                }
                if(!sectorSelected){
                    var lang = (wrapper.find('.mbw-lang.active').data('lang') == 'rus')? 'rus':'eng';
                    var title = (lang == 'rus')? 'Внимание': 'Attention';
                    var text = (lang == 'rus')? 'Выберите сектор(ы) схемы зала': 'You have to select hall scheme area group(s) first';
                    widget.alerter(title, text, function(){

                    });
                }else{
                    widget.loader(true);
                    widget.map.sectorsSelect(function(){
                        widget.updateMap();
                        widget.populateLegend();
                        entryTickets.check("squares");
                        widget.loader(false);
                    });
                    wrapper.addClass('hallView');
                    wrapper.removeClass('zonesView');
                    widget.forwardBtn.hide(0);
                    widget.backBtn.show(0);
                }
            });

            widget.backBtn.off('click').on('click', function(e){
                e = e || window.event;
                e.stopPropagation();
                wrapper.find('.mbw-priceGroups-wrapper li').hide(0);

                wrapper.removeClass('hallView');
                wrapper.addClass('zonesView');

                widget.loader(true);
                entryTickets.close();
                widget.map.backToSectors();
                entryTickets.check("sectors");
                widget.loader(false);
                widget.backBtn.hide(0);
                widget.sectorsWrapper.removeClass('places-state');
                widget.sectorsWrapper.removeClass('tickets-state');
                //widget.forwardBtn.show(0);
            });

            wrapper.find('.mbw-zoom-in, .mbw-zoom-out, .mbw-priceGroups-wrapper, .mbw-scene-bunner, .mbw-basket-dd-wrapper, .mbw-dd, .mbw-fix-scene').off('mouseenter').on('mouseenter', function(){
                widget.canvasContainer.trigger("leave_container");
            });
            widget.canvasContainer.on('leave_container', function(){
                clearInterval(zoomInterval);
            });

            if(entryTickets){
                entryTickets.parent.on('show_tickets_list', function(){
                    widget.sectorsWrapper.addClass('tickets-state');
                    widget.forwardBtn.hide(0);
                    widget.backBtn.show(0);
                });
            }


            $(document).on('mouseup', function(){
                clearInterval(zoomInterval);
            });
        },                          //SET HANDLERS

        setBasketHandlers: function(callback){
            if(widget.incBtn && widget.decBtn){
                widget.incBtn.off('mouseup').on('mouseup', function(){
                    var id = $(this).data('id');
                    var actId = $(this).data('action_id');
                    var count = $(this).data('count');

                    entryTickets.updateTickets(id, (+count +1));

                    widget.updateLsTicketPass(actId);
                });

                widget.decBtn.off('mouseup').on('mouseup', function(){
                    var id = $(this).data('id');
                    var actId = $(this).data('action_id');
                    var count = $(this).data('count');

                    entryTickets.updateTickets(id, (+count -1));

                    widget.updateLsTicketPass(actId);
                    widget.additionalServiceBasket.checkoutByPlaceDeselection();
                });
            }

            if(widget.removeBtns){
                widget.removeBtns.off('click').on('click', function(){
                    var id = $(this).data('id');
                    var actId = $(this).data('action_id');

                    var removedIds = widget.removeFromLS(actId, id);
                    widget.updateMap();
                    widget.populateBasket();
                    widget.map.removeFromSelection(removedIds);
                    widget.additionalServiceBasket.checkoutByPlaceDeselection();
                });
            }

            widget.clearBasket.off('click').on('click', function(){
                widget.clearTicketPassLS();
                widget.clearLS();
                widget.populateBasket();

                if(widget.active_action.SERVICE_AVALIBLE_FOR_SALE == 'TRUE'){
                    widget.additionalServiceBasket.clearBasketHandler();
                }
                if(widget.map) {
                    widget.updateMap();
                    widget.map.removeFromSelection(widget.map.selection);
                }
            });

            if(typeof callback == 'function'){
                callback();
            }
        },

        populateBasket: function(){
            var storedPlaces = localStorage.getItem('mbw-basket');
            var storedTickets = localStorage.getItem('mbw-tp-basket');

            widget.basketUl.empty();

            if(storedPlaces == null && storedTickets == null){
                widget.basketUl.html('<li class="mbw-empty-basket"><span class="mbw-switch-lang" data-keyword="emptyBasket">Корзина пуста</span></li>');
                widget.switchLanguage(wrapper.find('.mbw-lang.active').data('lang'));
                widget.calculateTotal();
                widget.setBasketHandlers();
                return;
            }

            var places_tpl ='{{#basketItems}}<li>' +
                '<div class="mbw-basket-item-wrapper">' +
                '<div class="mbw-basket-item-title">{{{title}}}</div>' +
                '<div class="mbw-basket-item-info-wrapper">' +
                '<div class="mbw-basket-item-zone">{{zone}}</div>' +
                '<div class="mbw-basket-item-seat">{{line_title}}: {{line}}  {{place_title}}: {{place}}</div>' +
                '</div>' +
                '<div class="mbw-basket-item-price">{{price}} <span class="mbw-switch-lang" data-keyword="rub">руб.</span></div>' +
                '</div>' +
                '<div class="mbw-basket-item-remove" data-id="{{id}}" data-action_id="{{action_id}}">' +
                '<i class="fa fa-trash-o"></i>' +
                '</div>' +
                '{{/basketItems}}</li>';
            var tickets_tpl ='{{#groups}}<li>' +
                '<div class="mbw-basket-item-wrapper mbw-basket-item-ticketpass-wrapper">' +
                '<div class="mbw-basket-item-title">{{{action_title}}}</div>' +
                '<div class="mbw-basket-item-info-wrapper">' +
                '<div class="mbw-basket-item-zone">{{title}}</div>' +
                '<div class="mbw-basket-item-zone">{{name}}</div>' +
                '<div class="mbw-basket-item-zone">{{sector}}</div>' +
                '<div class="mbw-basket-item-seat">Билетов: {{count}}</div>' +
                '</div>' +
                '<div class="mbw-basket-item-price">{{price}} <span class="mbw-switch-lang" data-keyword="rub">руб.</span></div>' +
                '</div>' +
                '<div class="mbw-basket-item-remove mbw-basket-item-dec" data-count="{{count}}" data-id="{{id}}" data-action_id="{{action_id}}"><i class="fa fa-minus"></i></div>' +
                '<div class="mbw-basket-item-remove mbw-basket-item-inc" data-count="{{count}}" data-id="{{id}}" data-action_id="{{action_id}}"><i class="fa fa-plus"></i></div>' +
                '{{/groups}}</li>';

            if(storedPlaces) {
                storedPlaces = JSON.parse(storedPlaces);

                var mO = {
                    basketItems: []
                };

                for(var i in storedPlaces.actions){
                    var act = storedPlaces.actions[i];
                    for(var k in act.places){
                        var plcData = act.places[k];
                        if(widget.map.squares[act.places[k].id]){
                            if(widget.map.squares[act.places[k].id].status == 0){
                                continue;
                            }
                        }
                        mO.basketItems.push({
                            action_id:      act.id,
                            id:             plcData.id,
                            title:          (widget.getActionById(act.id)['ACTION_NAME'] == '')? '&nbsp;': widget.getActionById(act.id)['ACTION_NAME'],
                            zone:           plcData.areaGroup,
                            place_title:    plcData.place_title || 'м',
                            place:          plcData.place,
                            line_title:     plcData.line_title || 'р',
                            line:           plcData.line,
                            price:          widget.splitPrice(plcData.salePrice)
                        });
                    }
                }
                widget.basketUl.append(Mustache.to_html(places_tpl, mO));
            }

            if(storedTickets) {
                storedTickets = JSON.parse(storedTickets);
                var ticketsO = {
                    groups: []
                };

                for(var i in storedTickets.actions){
                    var act = storedTickets.actions[i];
                    var actData = widget.getActionById(act.id);
                    for(var k in act.groups){
                        var g = act.groups[k];
                        ticketsO.groups.push({
                            action_id: act.id,
                            action_title: actData['ACTION_NAME'] +'   <b>'+ actData['ACTION_DATE']+'</b>',
                            title: g.title,
                            price: +g.price * +g.count,
                            count: g.count,
                            id: g.id,
                            name: g.name,
                            sector: g.sector
                        });
                    }
                }
                widget.basketUl.append(Mustache.to_html(tickets_tpl, ticketsO));

            }

            if((ticketsO && ticketsO.groups.length == 0) && (mO && mO.basketItems.length == 0)){
                widget.basketUl.html('<li class="mbw-empty-basket"><span class="mbw-switch-lang" data-keyword="emptyBasket">Корзина пуста</span></li>');
                widget.switchLanguage(wrapper.find('.mbw-lang.active').data('lang'));
                widget.calculateTotal();
                widget.setBasketHandlers();
            }else{
                widget.removeBtns = widget.basketUl.find('.mbw-basket-item-remove');
                widget.incBtn = widget.basketUl.find('.mbw-basket-item-inc');
                widget.decBtn = widget.basketUl.find('.mbw-basket-item-dec');
                widget.calculateTotal();
                widget.setBasketHandlers();
            }
        },

        calculateTotal: function(){
            var totalAmount, totalFee;
            var storedPlaces = localStorage.getItem('mbw-basket');
            var storedTickets = localStorage.getItem('mbw-tp-basket');

            totalAmount = 0;
            totalFee = 0;

            if(storedPlaces) {
                storedPlaces = JSON.parse(storedPlaces);

                for(var i in storedPlaces.actions){
                    var act = storedPlaces.actions[i];
                    var actFee = +widget.getActionById(act.id)['SERVICE_FEE'];

                    for(var k in act.places){
                        var plcData = act.places[k];
                        actFee = +actFee || 0;
                        plcData.salePrice = +plcData.salePrice || 0;

                        totalFee += +plcData.salePrice / 100 * actFee;
                        totalAmount += +plcData.salePrice;
                    }
                }
            }

            if(storedTickets) {
                storedTickets = JSON.parse(storedTickets);

                for(var i in storedTickets.actions){
                    var act = storedTickets.actions[i];
                    var actFee = +widget.getActionById(act.id)['SERVICE_FEE'];

                    for(var k in act.groups){
                        var g = act.groups[k];
                        actFee = +actFee || 0;
                        g.price = +g.price || 0;
                        g.count = +g.count || 0;

                        totalFee += (+g.price / 100 * actFee) * g.count;
                        totalAmount += (+g.price) * g.count;
                    }
                }
            }

            widget.totalFee.html(widget.splitPrice(totalFee.toFixed(2)));
            widget.totalAddititonalServices.html(widget.splitPrice(widget.additionalServiceBasket.getTotal().toFixed(2)));
            widget.totalAmount.html(widget.splitPrice((widget.additionalServiceBasket.getTotal() + totalAmount + totalFee).toFixed(2)));

        },

        glowPriceGroup: function(id, state){
            var idx = 0;
            function disLight(){
                for(var i in widget.map.squares){
                    widget.map.squares[i].lighted_now = false;
                }
                widget.map.render();
            }
            if(!state){
                clearInterval(interval);
                disLight();
            }else{
                clearInterval(interval);
                disLight();
                var prcGrpPlaces = [];
                for(var i in widget.map.squares){
                    var sqr = widget.map.squares[i];
                    if(sqr.salePrice == id && sqr.status!=0){
                        prcGrpPlaces.push(sqr.id);
                    }
                }
                interval = window.setInterval(function(){
                    for(var k in prcGrpPlaces){
                        var sqr = prcGrpPlaces[k];
                        if (typeof widget.map.squares[sqr]!='object'){
                            continue;
                        }
                        if(idx%2 == 0){
                            widget.map.squares[sqr].lighted_now = true;
                        }else{
                            widget.map.squares[sqr].lighted_now = false;
                        }
                    }
                    idx++;
                    widget.map.render();
                }, 350);
            }


        },

        splitPrice: function(str){
            str = str.toString();
            var endOfStr = '';
            if(str.indexOf('.') > -1){
                endOfStr = str.substr(str.indexOf('.'));
                str = str.substr(0, str.length - endOfStr.length);
            }
            var arrStr = str.split('');
            var res = [];
            var idx = 1;
            for(var i = arrStr.length-1; i >= 0; i--){
                res.unshift(arrStr[i]);
                if(idx%3 == 0 && idx>0){
                    res.unshift(' ');
                }
                idx++;
            }
            if(res[0] == ' '){
                res.shift();
            }
            return res.join('')+endOfStr;
        },

        populateLegend: function(){

            console.log(widget.map.mode);

            var lang = (wrapper.find('.mbw-lang.active').data('lang') == 'rus')? 'rus':'eng';
            var squares = widget.map.squares;
            var mO = {
                priceGroups:[]
            };
            var obj = {};
            var total_free_count = 0;
            var tpl = '{{#priceGroups}}<li {{#status}}data-id="{{salePrice}}"{{/status}}><div class="mbw-legend-item-color" style="background-color: {{color}}"></div>' +
                '<div class="mbw-legend-item-price">{{^status}}<span class="mbw-switch-lang" data-keyword="unavailable_places">{{price}}</span>{{/status}}{{#status}}{{price}} <span class="mbw-switch-lang" data-keyword="rub">руб.</span>{{/status}}' +
                '</div></li>{{/priceGroups}}';

            var unavlByLang = (lang == 'rus')? 'Недоступные' : 'Unavailable' ;

            for (var i1 in squares) {
                var square = squares[i1];

                if (obj[square.salePrice || 0] === undefined) {
                    obj[square.salePrice || 0] = {
                        price: widget.splitPrice(square.salePrice) || unavlByLang,
                        salePrice: square.salePrice,
                        count: 1,
                        color: square.color0,
                        status: square.status != 0,
                        priceGroup: square.priceGroup
                    };
                } else if(square.status != 0 || +square.salePrice > 0) {
                    obj[square.salePrice].count++;
                }
                total_free_count++;
            }

            for(var i in obj){
                mO.priceGroups.push(obj[i]);
            }



            mO.priceGroups = mO.priceGroups.sort(function(a,b){

                var aPrice = +a.price.replace(/\s/ig, '');
                var bPrice = +b.price.replace(/\s/ig, '');

                aPrice = isNaN(aPrice)? 0 : aPrice;
                bPrice = isNaN(bPrice)? 0 : bPrice;

                if (aPrice > bPrice){
                    return 1;
                }else if (aPrice < bPrice){
                    return -1;
                }
                return 0;
            });


            widget.priceGroups.html(Mustache.to_html(tpl, mO));
            widget.priceGroupsItems = widget.priceGroups.find('li');

//            console.log('pgi', mO);

            widget.priceGroupsItems.off('click').on('click', function(){
                var pgId = $(this).data('id');
                if(!pgId) return;
                if($(this).hasClass('active')){
                    widget.priceGroupsItems.removeClass('active');
                    widget.glowPriceGroup('', false);
                }else{
                    widget.priceGroupsItems.removeClass('active');
                    $(this).addClass('active');
                    widget.glowPriceGroup(pgId, true);
                }
            });
        },

        selectOrderType: function(){
            var lang = (wrapper.find('.mbw-lang.active').data('lang') == 'rus')? 'rus':'eng';
            var title = (lang == 'rus')?'Выберите тип заказа': 'Choose order type';
            var eticket_text = (lang == 'rus')?'Электронный билет (оплата картой)': 'E-ticket (card)';
            var delivery_text = (lang == 'rus')?'Доставка курьером (наличные)': 'Delivery by courier (cash)';
            var tpl = '<div class="mb-select-order-type-wrapper"><div data-otype="ETICKET" class="mw-o-t-btn active"><i class="fa fa-ticket"></i>&nbsp;&nbsp;'+eticket_text+'</div><div data-otype="DELIVERY" class="mw-o-t-btn"><i class="fa fa-truck"></i>&nbsp;&nbsp;'+delivery_text+'</div></div>';

            widget.alerter(title, tpl, function(){
                var type = (wrapper.find('.mw-o-t-btn.active').data('otype') == 'ETICKET')? 'ETICKET' : (wrapper.find('.mw-o-t-btn.active').data('otype') == 'DELIVERY')? 'DELIVERY': undefined;
                if(type == 'ETICKET'){
                    widget.purchase();
                    return false;
                }else if(type == 'DELIVERY'){
                    widget.openDeliveryForm();
                }else{
                    console.warn('User have to select order type!');
                    return false;
                }
            });

            wrapper.find('.mw-o-t-btn').off('click').on('click', function(){
                wrapper.find('.mw-o-t-btn').removeClass('active');
                $(this).addClass('active');
            });

        },

        openDeliveryForm: function(){
            var lang = (wrapper.find('.mbw-lang.active').data('lang') == 'rus')? 'rus':'eng';
            var title = (lang == 'rus')?'Заполните поля доставки': 'Delivery details';
            var storedTickets = localStorage.getItem('mbw-tp-basket');
            var storedPlaces = localStorage.getItem('mbw-basket');

            if(storedTickets == null && storedPlaces == null){
                alert('Mister, prevent please empty basket purchasing!');
                return;
            }

            storedTickets = JSON.parse(storedTickets);
            storedPlaces = JSON.parse(storedPlaces);

            var placesConcatArr = [];
            var placesArr = [];
            var actionsArr = [];
            var zonesArr = [];
            var countsArr = [];
            var pricesArr = [];
            var areaGroups = {};
            var concatStr = '';
            var i, j, action, k;

            if(storedPlaces) {
                for(i in storedTickets.actions){
                    var act = storedTickets.actions[i];
                    for(k in act.places){
                        var plc = act.places[k];
                        var ag = plc.areaGroup;
                        if(areaGroups[ag]){
                            areaGroups[ag]['places'].push({
                                line: plc.line,
                                place: plc.place
                            })
                        }else{
                            areaGroups[ag] = {
                                places: [{
                                    line: plc.line,
                                    place: plc.place
                                }]
                            }
                        }
                    }
                }

//		        console.log(areaGroups);

                for(i in areaGroups){
                    var ag = areaGroups[i];
                    concatStr += i + ': (';
                    for(k in ag.places){
                        var plc = ag.places[k];
                        concatStr += 'р' + plc.line + ' м' + plc.place + '; ';
                    }
                    concatStr += ');  ';
                }
            }

            var placesList = concatStr;
//            var amount = 1;
//            var fee = 1;
//            +' На сумму: '+amount+' руб. Сервисный сбор: '+ fee+' руб.
//            +' Amount: '+amount+' rub. Service fee: '+ fee+' rub.'
            var places = (lang == 'rus')?'Выбранные места: '+placesList: 'Chosen places: '+placesList;
            var subtitle = (lang == 'rus')?'Поля отмеченные * обязательны к заполнению, пожалуйста, постарайтесь заполнить все корректно.': 'Fields marked * is required, please, try to fill them correctly';
            var okText = (lang == 'rus')? 'Отправить' : 'Confirm';
            var closeText = (lang == 'rus')? 'Закрыть' : 'Close';
            var deliverTitle = (lang == 'rus')? 'Доставка по Москве 300 руб. <span class="mbw-del-see-details">Подробнее...</span>' : 'Delivery in Moscow 300 rubles. <span class="mbw-del-see-details">details...</span>';
            var deliveryRules = '';

            var closedText = (lang == 'rus')? 'Подробнее...' : 'details...';
            var openedText = (lang == 'rus')? 'Скрыть' : 'Hide details';

            if(lang == 'rus'){
                deliveryRules = '<div class="mbw-del-wrap">'+
                '<div class="wid50pr">• в пределах МКАД г. Москвы - 300 (триста) рублей<br/>'+
                '• населенные пункты г. Москвы и МО за пределами МКАД г. Москвы (до 20 км от МКАД г. Москвы):<br/>'+
                '• до 5 км от МКАД г. Москвы, включая станции метро Мякинино, Волоколамская, Митино, Бульвар Дм.Донского, ул. Старокачаловская, ул. Скобелевская, Бульвар адмирала Ушакова, ул.Горчакова, Бунинская аллея - 500 (пятьсот)рублей</div>'+
                '<div class="wid50pr">• от 5 до 10 км от МКАД г. Москвы – 700 (семьсот) рублей ;<br/>'+
                '• от 10 до 15 км от МКАД г. Москвы - 900 (девятьсот) рублей;<br/>'+
                '• от 15 до 20 км от МКАД г. Москвы – 1 100 (одна тысяча сто) рублей.<br/>'+
                '*Далее 20 км от МКАД г. Москвы доставка не осуществляется</div></div>';
            }else{
                deliveryRules = '<div class="mbw-del-wrap">'+
                '<div class="wid50pr">• inside of MKAD, Moscow - 300 rubles<br/>'+
                '• inhabited localities of Moscow and Moscow region outside of MKAD (up to 20 km from MKAD):<br/>'+
                '• up to 5 km from MKAD, includes metro stations Myakinino, Volokolamskaya, Mitino, Bul`var Dmitriya Donskogo, Starokachalovskaya st, Skobelevskaya st, Bul`var admirala Ushakova, Gorchakova st, Buninskaya alleya - 500 rubles</div>'+
                '<div class="wid50pr">• from 5km to 10km from MKAD - 700 rubles;<br/>'+
                '• from 10km to 15km from MKAD - 900 rubles;<br/>'+
                '• from 15km to 20km from MKAD - 1100 rubles.<br/>'+
                '*over 20km from MKAD no delivery</div></div>';
            }


            var tpl = '<div class="mbw-delivery-wrapper">' +
                '<div class="mbw-delivery-places">'+places+'</div>'+
                '<div class="mbw-delivery-subtitle">'+subtitle+'</div>'+
                '<div class="wid50pr">'+
                '<div class="mbw-d-field-wrapper"><label>ФИО*</label><input type="text" class="mbw-d-field" data-type="text" data-name="DL_FIO,CRM_USER_NAME" /></div>' +
                '<div class="mbw-d-field-wrapper"><label>Телефон*</label><input type="text" class="mbw-d-field" data-type="phone" data-name="DL_PHONE1,CRM_USER_PHONE" /></div>' +
                '<div class="mbw-d-field-wrapper"><label>Почта*</label><input type="text" class="mbw-d-field" data-type="email" data-name="CRM_USER_EMAIL" /></div>' +
                '<div class="mbw-d-field-wrapper"><label>Комментарий</label><textarea class="mbw-d-field" data-type="text" data-name="DL_COMMENTS,COMMENTS" ></textarea></div>' +
                '</div>'+
                '<div class="wid50pr">'+
                '<div class="mbw-d-field-wrapper"><label>Город*</label><input type="text" class="mbw-d-field" data-type="text" data-name="DL_CITY" /></div>' +
                '<div class="mbw-d-field-wrapper"><label>Улица*</label><input type="text" class="mbw-d-field" data-type="text" data-name="DL_STREET" /></div>' +
                '<div class="mbw-d-field-wrapper"><label>Дом*</label><input type="text" class="mbw-d-field" data-type="text" data-name="DL_BLD" /></div>' +
                '<div class="mbw-d-field-wrapper"><label>Корпус</label><input type="text" class="mbw-d-field" data-type="text" data-name="DL_KORPUS" /></div>' +
                '<div class="mbw-d-field-wrapper"><label>Квартира/офис*</label><input type="text" class="mbw-d-field" data-type="text" data-name="DL_FLAT" /></div>' +
                '</div>'+
                '<div class="mbw-delivery-rules-header">'+deliverTitle+'</div>'+
                '<div class="mbw-delivery-rules-dd">'+deliveryRules+'</div>'+
                '</div>';

            var modalContainer = wrapper.find('.mbw-modal-wrapper');

            var pTpl =   '<div class="mbw-modal-title">{{title}}<div class="mbw-fn-modal-close mbw-header-modal-close fa fa-times"></div></div>' +
                '<div class="mbw-modal-content">{{{html}}}</div>' +
                '<div class="mbw-modal-footer"><div class="mbw-modal-btn mbw-modal-ok">'+okText+'</div><div class="mbw-modal-btn mbw-fn-modal-close mbw-modal-close">'+closeText+'</div></div></div>';

            var mO = {
                title: title,
                html: tpl
            };
            modalContainer.html(Mustache.to_html(pTpl, mO));
            //   modalContainer.find('.mbw-delivery-wrapper').height(wrapper.find('.mbw-content').outerHeight() - 100);
            modalContainer.find('.mbw-delivery-wrapper').css('maxHeight', wrapper.find('.mbw-content').outerHeight() - 20);
            modalContainer.find('.mbw-modal-ok').off('click').on('click', function(){
                var formValid = true;
                var flds = modalContainer.find('.mbw-d-field');
                var purchaseObj = {};
                var time;

                flds.removeClass('invalid');

                if(time){clearTimeout(time);}

                for(var fl=0; fl<flds.length; fl++){
                    var fldItem = flds.eq(fl);
                    if(fldItem.data('name') == 'DL_COMMENTS,COMMENTS' || fldItem.data('name') == 'DL_KORPUS'){
                        continue;
                    }
                    if(!widget.validate(fldItem.val(), fldItem.data('type'))){
                        fldItem.addClass('invalid');
                        formValid = false;
                        time = window.setTimeout(function(){
                            flds.removeClass('invalid');
                        }, 3000);
                    }
                }

                if(formValid){

                    purchaseObj = {
                        command: 'create_order_mixed',
                        params: {
                            frame: initData['frame'],
                            delivery: 'TRUE'
                        }
                    };

                    if(storedTickets) {
                        zonesArr = [];
                        countsArr = [];
                        actionsArr = [];

                        for(i in storedTickets.actions){
                            action = storedTickets.actions[i];
                            for(k in action.groups){
                                var group = action.groups[k];
                                zonesArr.push(group.id);
                                countsArr.push(group.count);
                                actionsArr.push(action.id);
                            }
                        }

                        purchaseObj.params.wo_action_id =                   actionsArr.join(',');
                        purchaseObj.params.action_scheme_ticket_zone_id =   zonesArr.join(',');
                        purchaseObj.params.ticket_count =                   countsArr.join(',');
                    }

                    if(storedPlaces) {
                        placesArr = [];
                        pricesArr = [];
                        actionsArr = [];

                        for(i in storedPlaces.actions){
                            action = storedPlaces.actions[i];
                            for(k in action.places){
                                var place = action.places[k];
                                placesArr.push(place.id);
                                pricesArr.push(place.salePrice);
                                actionsArr.push(action.id);
                            }
                        }

                        purchaseObj.params.action_id =                      actionsArr.join(',');
                        purchaseObj.params.action_scheme_id =               placesArr.join(',');
                        purchaseObj.params.ticket_price =                   pricesArr.join(',');
                    }

                    for(var f=0; f<flds.length; f++ ){
                        var fld = flds.eq(f);
                        var name = fld.data('name');
                        var namesArr = name.split(',');
                        for(var n in namesArr){
                            purchaseObj.params[namesArr[n]] = fld.val();
                        }
                    }

                    console.log('PURCHASE OBJ', purchaseObj);

                    socketQuery(purchaseObj, function(res){
                        res = JSON.parse(res);
//                        console.log(res);
                        var oId = res.results[0].ORDER_ID;
                        var successOrderResponse = '';
                        var errorOrderResponse = '';
                        var respSuccessHeader = (lang == 'rus')? 'Успех!' : 'Success!';
                        var respErrorHeader = (lang == 'rus')? 'Ошибка!' : 'Error!';
                        var respBtn = (lang == 'rus')? '<div class="mbw-modal-btn mbw-modal-close">Закрыть</div>': '<div class="mbw-modal-btn mbw-modal-close">Close</div>';
                        if(lang == 'rus'){
                            successOrderResponse = '<div class="mbw-order-creation-response">Ваш заказ успешно создан, номер заказа: <span class="mbw-green">'+oId+'</span>.<br/>Детали заказа отправлены на указанную вами почту,<br/>наш менеджер свяжется с вами для уточнения деталей</div>';
                        }else{
                            successOrderResponse = '<div class="mbw-order-creation-response">Your order was successfully created, order number: <span class="mbw-green">'+oId+'</span>.<br/>Order details was sent you to email,<br/>our manager will contact you to clarify details</div>';
                        }

                        if(lang == 'rus'){
                            errorOrderResponse = '<div class="mbw-order-creation-response">При создании заказа произошел сбой, попробуйте повторить попытку позднее.<br/><br/>Приносим свои извинения.</div>';
                        }else{
                            errorOrderResponse = '<div class="mbw-order-creation-response">An error was captured while creating your order, please try again later.<br/><br/>We apologize.</div>';
                        }

                        if(res.results[0].code == 0){
                            modalContainer.find('.mbw-modal-title').html(respSuccessHeader);
                            modalContainer.find('.mbw-modal-content').html(successOrderResponse);
                            modalContainer.find('.mbw-modal-footer .mbw-modal-ok').remove();
                        }else{
                            console.log(res.results[0]);
                            modalContainer.find('.mbw-modal-title').html(respErrorHeader);
                            modalContainer.find('.mbw-modal-content').html(errorOrderResponse);
                            modalContainer.find('.mbw-modal-footer .mbw-modal-ok').remove();
                        }


                    });
                }
            });

            modalContainer.find('.mbw-fn-modal-close').off('click').on('click', function(){
                modalContainer.html('');
                widget.clearLS();
                widget.clearTicketPassLS();
                if(widget.map){
                    widget.map.clearSelection();
                    if (typeof widget.map.reLoad == 'function') {
                        widget.map.reLoad();
                    }
                }
                widget.populateBasket();
            });

            modalContainer.find('.mbw-del-see-details').off('click').on('click', function(){
                if($(this).hasClass('opened')){
                    modalContainer.find('.mbw-delivery-rules-dd').hide(0);
                    $(this).html(closedText);
                    $(this).removeClass('opened');
                }else{
                    modalContainer.find('.mbw-delivery-rules-dd').show(0);
                    $(this).html(openedText);
                    $(this).addClass('opened');
                }

            });

        },

        validate: function(val, type){
            var res = false;
            var reg;
            switch (type){
                case 'text':
                    res = val.length > 0;
                    break;
                case 'phone':
                    res = val.length > 0;
                    break;
                case 'email':
                    reg = new RegExp(/^[-a-z0-9!#$%&'*+/=?^_`{|}~]+(\.[-a-z0-9!#$%&'*+/=?^_`{|}~]+)*@([a-z0-9]([-a-z0-9]{0,61}[a-z0-9])?\.)*(aero|arpa|asia|biz|cat|com|coop|edu|gov|info|int|jobs|mil|mobi|museum|name|net|org|pro|tel|travel|[a-z][a-z])$/);
                    res = reg.test(val);
                    break;
                default:
                    res = val.length > 0;
                    break;
                    break;
            }
//            console.log(res);
            return res;
        },

        getFirstPlaceIdByASId: function(asid){
            var storedPlaces = JSON.parse(localStorage.getItem('mbw-basket'));
            var storedTickets = JSON.parse(localStorage.getItem('mbw-tp-basket'));

            if(storedPlaces != null){
                for(var i in storedPlaces.actions){
                    var a = storedPlaces.actions[i];
                    for(var k in a.places){
                        var plc = a.places[k];
                        if(plc.additionalServiceGroupId == asid){
                            return plc.id;
                        }
                    }
                }
            }
            if(storedTickets != null){
                for(var i2 in storedTickets.actions){
                    var a2 = storedTickets.actions[i2];
                    for(var k2 in a2.places){
                        var plc2 = a2.places[k2];
                        if(plc2.additionalServiceGroupId == asid){
                            return plc2.id;
                        }
                    }
                }
            }
            return 0;
        },

        purchase: function(){
            var pdfPath = widget.actions[0]['RULES_PDF_PATH'] || 'rules.pdf';
            var lang = (wrapper.find('.mbw-lang.active').data('lang') == 'rus')? 'rus':'eng';
            var pTitle = (lang == 'rus')?'Внимание': 'Attention';
            var pth = (pdfPath.indexOf('http://')==-1 && pdfPath.indexOf('https://')==-1)?doc_root + pdfPath : pdfPath;
            var pHtml = (lang == 'rus')?'<div><label><input type="checkbox" class="mbw-i-agree" /> Я принимаю <a target="_blank" href="'+pth+'">условия пользовательского соглашения</a></label></div><div class="mbw-prompt-bottom-text">У Вас есть 15 минут на оплату, после чего билеты вернутся в продажу.</div>' : '<div><label><input type="checkbox" class="mbw-i-agree" /> I agree the <a target="_blank" href="'+pth+'">user agreement</a></label></div><div class="mbw-prompt-bottom-text">You have 15 minutes to purchase tickets, later they will automatically returned back to sale.</div>';

            var pOkCallback = function(data){
                var actionsArr, zonesArr, countsArr, placesArr, pricesArr;
                widget.loader(true);
                var i, k, action;
                var storedTickets = localStorage.getItem('mbw-tp-basket');
                var storedPlaces = localStorage.getItem('mbw-basket');
                var storedServices = widget.additionalServiceBasket.list;
                if(storedTickets == null && storedPlaces == null && storedServices.length == 0){
                    console.log('Mister, prevent please empty basket purchasing!');
                    return;
                }

                storedTickets = JSON.parse(storedTickets);
                storedPlaces = JSON.parse(storedPlaces);

                var purchaseObj = {
                    command: 'create_order_mixed',
                    params: {
                        frame: initData['frame']
                    }
                };

                if(data){
                    purchaseObj.params['CRM_USER_NAME'] = data.name;
                    purchaseObj.params['CRM_USER_EMAIL'] = data.email;
                    purchaseObj.params['CRM_USER_PHONE'] = data.phone;
                }

                if(storedTickets) {
                    zonesArr = [];
                    countsArr = [];
                    actionsArr = [];

                    for(i in storedTickets.actions){
                        action = storedTickets.actions[i];
                        for(k in action.groups){
                            var group = action.groups[k];
                            zonesArr.push(group.id);
                            countsArr.push(group.count);
                            actionsArr.push(action.id);
                        }
                    }

                    purchaseObj.params.wo_action_id =                           actionsArr.join(',');
                    purchaseObj.params.action_scheme_ticket_zone_id =           zonesArr.join(',');
                    purchaseObj.params.ticket_count =                           countsArr.join(',');
                }

                if(storedPlaces) {
                    placesArr = [];
                    pricesArr = [];
                    actionsArr = [];

                    for(i in storedPlaces.actions){
                        action = storedPlaces.actions[i];
                        for(k in action.places){
                            var place = action.places[k];
                            placesArr.push(place.id);
                            pricesArr.push(place.salePrice);
                            actionsArr.push(action.id);
                        }
                    }

                    purchaseObj.params.action_id =                              actionsArr.join(',');
                    purchaseObj.params.action_scheme_id =                       placesArr.join(',');
                    purchaseObj.params.ticket_price =                           pricesArr.join(',');
                }

                if(storedServices.length > 0){

                    var action_additional_service_ids = [];
                    var action_additional_service_counts = [];
                    var action_additional_action_scheme_ids = [];

                    for(var i in storedServices){
                        var ser = storedServices[i];

                        action_additional_service_ids.push(ser['ACTION_ADDITIONAL_SERVICE_ID']);
                        action_additional_service_counts.push(1);
                        action_additional_action_scheme_ids.push(ser['ACTION_SCHEME_ID']);
                    }

                    purchaseObj.params.action_additional_service_id =               action_additional_service_ids.join(',');
                    purchaseObj.params.action_additional_service_count =            action_additional_service_counts.join(',');
                    purchaseObj.params.action_additional_action_scheme_id =         action_additional_action_scheme_ids.join(',');
                }

                console.log('purchaseObj', purchaseObj);

                socketQuery(purchaseObj, function(res){
                    widget.loader(false);
                    res = JSON.parse(res);
                    if(res['results'][0]['code'] == 0){
                        if(widget.active_action_is_wo){
                            localStorage.removeItem('mbw-tp-basket');
                            widget.populateBasket();
                            if(widget.isServices){
                                widget.additionalServiceBasket.clearBasketHandler();
                            }
                            widget.toPaymentSystem(res['results'][0]);
                        }else{
                            localStorage.removeItem('mbw-basket');
                            widget.map.clearSelection();
                            if (typeof widget.map.reLoad == 'function') {
                                widget.map.reLoad();
                            }
                            widget.populateBasket();
                            if(widget.isServices){
                                widget.additionalServiceBasket.clearBasketHandler();
                            }
                            widget.toPaymentSystem(res['results'][0]);
                        }
                    }else if(res['results'][0]['code'] == 20111){

                        if(widget.active_action_is_wo){
                            var lang = (wrapper.find('.mbw-lang.active').data('lang') == 'rus')? 'rus':'eng';
                            var title = (lang == 'rus')? 'Ошибка': 'Error';
                            var text = (lang == 'rus')? 'Что-то пошло не так, попробуйте повторить попытку позднее': 'Something goes wrong, try again later';
                            widget.alerter(title, text, function(){});
                            widget.additionalServiceBasket.clearBasketHandler();

                        }else{
                            var errPlaces = [];
                            var errActions = [];

                            if (!res['results'][0]['invalid_id']) {
                                widget.alerter('Ошибка', 'Некоторые места уже заняты, схема будет обновлена.', function () {
                                    localStorage.removeItem('mbw-basket');
                                    if (typeof widget.map.clearSelection == 'function') {
                                        widget.map.clearSelection();
                                    }
                                    if (typeof widget.map.reLoad == 'function') {
                                        widget.map.reLoad();
                                    }
                                    widget.populateBasket();
                                });
                                return;
                            }

                            for(var e in res['results'][0]['invalid_id'].split(',')){
                                var errPlc = res['results'][0]['invalid_id'].split(',')[e];
                                var errAct = res['results'][0]['invalid_action_id'].split(',')[e];
                                if(errPlaces.indexOf(errPlc) == -1){
                                    errPlaces.push(errPlc);
                                    errActions.push(errAct);
                                }
                            }

                            var errTitle = (lang == 'rus')? 'Ошибка': 'Error';
                            var errText = (lang == 'rus')? 'Что-то пошло не так, попробуйте повторить попытку позднее': 'Something goes wrong, try again later';
                            var errHtml = '';
                            for(var h in errPlaces){
                                var eP = errPlaces[h];
                                var eA = errActions[h];
                                errHtml += eA +': '+eP+ '<br/>';
                            }
                            var errOk = function(){
                                for(var i in storedTickets.actions){
                                    var act = storedTickets.actions[i];
                                    var inArIdx = errActions.indexOf(act);
                                    if(inArIdx > -1){
                                        for(var k in act.places){
                                            var plc = act.places[k];
                                            var inArPlcIdx = errPlaces.indexOf(plc);
                                            if(inArPlcIdx > -1){
                                                act.places.splice(k,1);
                                            }
                                        }
                                    }
                                }

                                localStorage.setItem('mbw-basket', JSON.stringify(storedTickets));
                                widget.map.clearSelection();
                                widget.map.reLoad();
                                widget.additionalServiceBasket.clearBasketHandler();
                                widget.populateBasket();
                            };

                            widget.alerter(errTitle, errText, errOk);
//                            console.log(errHtml);
                            //widget.alerter(errTitle, errHtml, errOk);
                        }


                    }else{
                        var lang = (wrapper.find('.mbw-lang.active').data('lang') == 'rus')? 'rus':'eng';
                        var title = (lang == 'rus')? 'Ошибка': 'Error';
                        var text = (lang == 'rus')? 'Что-то пошло не так, попробуйте повторить попытку позднее': 'Something goes wrong, try again later';
                        widget.alerter(title, text, function(){

                            if(widget.active_action_is_wo){
                                widget.additionalServiceBasket.clearBasketHandler();
                            }else{
                                localStorage.removeItem('mbw-basket');
                                if(typeof widget.map.clearSelection == 'function'){
                                    widget.map.clearSelection();
                                }
                                if(typeof widget.map.reLoad == 'function'){
                                    widget.map.reLoad();
                                }
                                widget.additionalServiceBasket.clearBasketHandler();                                widget.additionalServiceBasket.clearBasketHandler();
                                widget.populateBasket();
                            }

                        });
//                        console.log('ERROR', res);
                    }
                });

            };
            var pCancelCallback = function(){};

            console.log('REQUEST_CUSTOMER_DETAILS', widget.active_action.REQUEST_CUSTOMER_DETAILS);
            
            if(widget.active_action.REQUEST_CUSTOMER_DETAILS == 'TRUE'){
                widget.promptWithCustomerDetails(pTitle, pHtml, pOkCallback, pCancelCallback, true);
            }else{
                widget.prompt(pTitle, pHtml, pOkCallback, pCancelCallback, true);
            }
        },

        alerter: function(title, html, ok){
            var lang = (wrapper.find('.mbw-lang.active').data('lang') == 'rus')? 'rus':'eng';
            var okText = (lang == 'rus')? 'Ок' : 'Confirm';
            var promptContainer = wrapper.find('.mbw-alerter-wrapper');
            var tpl =   '<div class="mbw-prompt-title">{{title}}</div>' +
                '<div class="mbw-prompt-content">{{{html}}}</div>' +
                '<div class="mbw-prompt-footer"><div class="mbw-prompt-btn mbw-prompt-ok">'+okText+'</div></div>';
            var mO = {
                title: title,
                html: html
            };
            promptContainer.html(Mustache.to_html(tpl, mO));
            promptContainer.find('.mbw-prompt-ok').off('click').on('click', function(){
                if(typeof ok == 'function'){
                    ok();
                }
                promptContainer.html('');
            });
        },

        prompt: function(title, html, ok, cancel, okDisabled, okTitle, cancelTitle){
            var lang = (wrapper.find('.mbw-lang.active').data('lang') == 'rus')? 'rus':'eng';
            var okText = (lang == 'rus')? (okTitle)? okTitle: 'Подтвердить' : (okTitle)? okTitle: 'Confirm' ;
            var cancelText = (lang == 'rus')? (cancelTitle)? cancelTitle: 'Отмена' : (cancelTitle)? cancelTitle: 'Cancel' ;
            var promptContainer = wrapper.find('.mbw-prompt-wrapper');
            var isDisabled = (okDisabled)? 'disabled' : '';

            var tpl =   '<div class="mbw-prompt-title">{{{title}}}</div>' +
                '<div class="mbw-prompt-content">{{{html}}}</div>' +
                '<div class="mbw-prompt-footer"><div class="mbw-prompt-btn mbw-prompt-cancel">{{{cancelText}}}</div><div class="mbw-prompt-btn mbw-prompt-ok '+isDisabled+'">{{{okText}}}</div></div>';

            var mO = {
                title: title,
                html: html,
                okText: okText,
                cancelText: cancelText
            };

            promptContainer.html(Mustache.to_html(tpl, mO));

            var isAgree = promptContainer.find('.mbw-i-agree');

            isAgree.off('change').on('change', function(){
                if(isAgree[0].checked){
                    promptContainer.find('.mbw-prompt-ok').removeClass('disabled');
                }else{
                    promptContainer.find('.mbw-prompt-ok').addClass('disabled');
                }
            });

            promptContainer.find('.mbw-prompt-ok').off('click').on('click', function(){

                if(!okDisabled){
                    if(typeof ok == 'function'){
                        ok();
                        promptContainer.html('');
                    }
                }else{
                    if($(this).hasClass('disabled')){
                        return;
                    }else{
                        if(isAgree[0].checked){
                            if(typeof ok == 'function'){
                                ok();
                                promptContainer.html('');
                            }
                        }
                    }
                }


            });
            promptContainer.find('.mbw-prompt-cancel').off('click').on('click', function(){

                promptContainer.html('');
                if(typeof cancel == 'function'){
                    cancel();
                }

            });
        },

        promptWithCustomerDetails: function(title, html, ok, cancel, okDisabled, okTitle, cancelTitle){

            widget.fadeFooter(true);

            var lang = (wrapper.find('.mbw-lang.active').data('lang') == 'rus')? 'rus':'eng';
            var okText = (lang == 'rus')? (okTitle)? okTitle: 'Подтвердить' : (okTitle)? okTitle: 'Confirm' ;
            var cancelText = (lang == 'rus')? (cancelTitle)? cancelTitle: 'Отмена' : (cancelTitle)? cancelTitle: 'Cancel' ;
            var promptContainer = wrapper.find('.mbw-prompt-wrapper-full');
            var isDisabled = (okDisabled)? 'disabled' : '';

            var exceptTitle = (lang == 'rus')? 'Оформелние заказа' : 'Checkout details';
            var fio = (lang == 'rus')? 'ФИО*' : 'Name*';
            var email = (lang == 'rus')? 'E-mail*' : 'E-mail*';
            var phone = (lang == 'rus')? 'Телефон*' : 'Phone*';
            var info = (lang == 'rus')? 'Заполните все поля, будьте внимательны, электронные билеты будут отправлены на указанный вами адрес электронной почты' : 'Fill in all fields, be careful, electronic tickets will be sent to specified e-mail address';

            var additHtml = '<div class="mbw-crm-info">'+info+'</div>' +
                            '<div class="mbw-crm-fld" data-name="name"><label>'+fio+'</label><input type="text" /></div>' +
                            '<div class="mbw-crm-fld" data-name="email"><label>'+email+'</label><input type="email" /></div>' +
                            '<div class="mbw-crm-fld mbw-marBot20" data-name="phone"><label>'+phone+'</label><input type="text" /></div>';

            var tpl =   '<div class="mbw-prompt-title-full">'+exceptTitle+'</div>' +
                '<div class="mbw-prompt-content-full"><div class="mbw-prompt-content-full-inner">'+additHtml+' {{{html}}}</div></div>' +
                '<div class="mbw-prompt-footer-full"><div class="mbw-prompt-btn mbw-prompt-cancel">{{{cancelText}}}</div><div class="mbw-prompt-btn mbw-prompt-ok '+isDisabled+'">{{{okText}}}</div></div>';

            var mO = {
                title: title,
                html: html,
                okText: okText,
                cancelText: cancelText
            };

            promptContainer.html(Mustache.to_html(tpl, mO));

            promptContainer.show(0);

            var isAgree = promptContainer.find('.mbw-i-agree');

            var flds = promptContainer.find('.mbw-crm-fld input[type="text"], .mbw-crm-fld input[type="email"]');

            flds.off('input').on('input', function(){

                var fld = $(this);
                var name = fld.parents('.mbw-crm-fld').data('name');
                var val = fld.val();
                flds.removeClass('mbw-invalid');

                for(var i=0; i<flds.length; i++){
                    var f = flds.eq(i);
                    var n = f.parents('.mbw-crm-fld').data('name');
                    var v = f.val();

                    switch (n){
                        case 'name':
                            if(v.length == 0){
                                f.addClass('mbw-invalid');
                            }
                            break;
                        case 'email':
                            var eReg = new RegExp(/^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,3})$/);
                            if(!eReg.test(v)){
                                f.addClass('mbw-invalid');
                            }
                            break;
                        case 'phone':
                            if(v.length == 0){
                                f.addClass('mbw-invalid');
                            }
                            break;
                        default :
                            break;
                    }

                    if(promptContainer.find('.mbw-invalid').length > 0 || isAgree[0].checked == false){
                        promptContainer.find('.mbw-prompt-ok').addClass('disabled');
                    }else{
                        promptContainer.find('.mbw-prompt-ok').removeClass('disabled');
                    }
                }

            });

            isAgree.off('change').on('change', function(){
                for(var i=0; i<flds.length; i++){
                    var f = flds.eq(i);
                    var n = f.parents('.mbw-crm-fld').data('name');
                    var v = f.val();

                    switch (n){
                        case 'name':
                            if(v.length == 0){
                                f.addClass('mbw-invalid');
                            }
                            break;
                        case 'email':
                            var eReg = new RegExp(/^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,3})$/);
                            if(!eReg.test(v)){
                                f.addClass('mbw-invalid');
                            }
                            break;
                        case 'phone':
                            if(v.length == 0){
                                f.addClass('mbw-invalid');
                            }
                            break;
                        default :
                            break;
                    }

                    if(promptContainer.find('.mbw-invalid').length > 0 || isAgree[0].checked == false){
                        promptContainer.find('.mbw-prompt-ok').addClass('disabled');
                    }else{
                        promptContainer.find('.mbw-prompt-ok').removeClass('disabled');
                    }
                }
            });


            promptContainer.find('.mbw-prompt-ok').off('click').on('click', function(){

                var name = promptContainer.find('.mbw-crm-fld[data-name="name"] input[type="text"]').val();
                var email = promptContainer.find('.mbw-crm-fld[data-name="email"] input[type="text"]').val();
                var phone = promptContainer.find('.mbw-crm-fld[data-name="phone"] input[type="text"]').val();

                if(!okDisabled){
                    if(typeof ok == 'function'){
                        ok({name: name, email: email, phone: phone});
                        promptContainer.html('');
                        promptContainer.hide(0);
                        widget.fadeFooter(false);
                    }
                }else{
                    if($(this).hasClass('disabled')){
                        return;
                    }else{
                        if(isAgree[0].checked){
                            if(typeof ok == 'function'){
                                ok({name: name, email: email, phone: phone});
                                promptContainer.html('');
                                promptContainer.hide(0);
                                widget.fadeFooter(false);
                            }
                        }
                    }
                }


            });
            promptContainer.find('.mbw-prompt-cancel').off('click').on('click', function(){
                promptContainer.html('');
                promptContainer.hide(0);
                widget.fadeFooter(false);
                if(typeof cancel == 'function'){
                    cancel();
                }

            });
        },

        fadeFooter: function(state){
            if(state){
                widgetWrapper.find('.mbw-footer-fader').show(0);
            }else{
                widgetWrapper.find('.mbw-footer-fader').hide(0);
            }
        },

        /*
        * <form method="POST" action="http://checkout.test.paycom.uz">
         <input type="hidden" name="merchant" value="{Merchant ID}" />
         <input type="hidden" name="amount" value="{сумма чека в ТИИНАХ}" />
         <input type="hidden" name="account[{field_name}]" value="{field_vallue}" />

         <!-- ============= Не обязательные поля ====================== -->
         <input type="hidden" name="lang" value="ru" />
         <input type="hidden" name="callback" value="{url для возврата после платежа}" />

         <input type="hidden" name="description" value="{Описание платежа}" />
         <input type="hidden" name="detail" value="{JSON объект детализации в BASE64}" />
         <!-- ================================================== -->

         <button type="submit">Оплатить с помощью <b>PAYCOM</b></button>
         </form>*/
        toPaymentSystem: function(obj){
            if (typeof obj!= "object"){
                return console.log('В toPaymentSystem не передан obj');
            }
            var paymentSystem = obj['PAYMENT_SYSTEM'];
            if (!paymentSystem){
                return console.log('В toPaymentSystem не передан PAYMENT_SYSTEM');
            }
            if (typeof widget[paymentSystem]!='function'){
                return console.log('Нет функции обработки для данной платежной системы', paymentSystem);
            }
            widget[paymentSystem](obj);
        },

        PAYCOM: function(obj){
            var values = {};
            var merchant = obj['merchant'];
            var product_id = obj['PRODUCT_ID'];

            values['merchant'] = obj['MERCHANT'];
            values['amount'] = obj['AMOUNT'];
            values['account[order_id]'] = obj['ORDER_ID'];
            values['callback'] = document.location.href;
            values['amount'] = obj['AMOUNT'];
            values['lang'] = 'ru';
            values['description'] = obj['DESCRIPTION'];
            values['detail'] = '';

            var html = "";
            for(var key in values){

                html+= key+'<input type="text" name="'+key+'" value="'+values[key]+'" />';
            }

            wrapper.find(".mbw-form-pay").attr('action',obj['POST_ACTION']);
            wrapper.find(".mbw-form-pay").html(html);
            wrapper.find(".mbw-form-pay").submit();
            if(!widget.active_action_is_wo){
                widget.map.clearSelection();
                widget.map.reLoad();
            }
        },

        ACQUIROPAY: function(obj){
            var values = {};
            var merchant_id = obj['MERCHANT_ID'];
            var product_id = obj['PRODUCT_ID'];

            values['merchant_id'] = merchant_id;
            values['product_id'] = product_id;
            values['amount'] = obj['AMOUNT'];
            values['cf'] = obj['CF'];
            values['cf2'] = obj['CF2'];
            values['cf3'] = obj['CF3'];
            values['params'] = params;

            values['cb_url'] = obj['CB_URL'];
            //values['ok_url'] = doc_root+"assets/widget/payment_ok.php?back="+document.location.href;
            values['ok_url'] = doc_root+"cgi-bin/payment_ok?back="+document.location.href;
            values['ko_url '] = doc_root+"assets/widget/payment_ko.html";
            values['token'] = obj['TOKEN'];

            var html = "";
            for(var key in values){

                html+= key+'<input type="text" name="'+key+'" value="'+values[key]+'" />';
            }

            wrapper.find(".mbw-form-pay").attr('action',obj['POST_ACTION']);
            wrapper.find(".mbw-form-pay").html(html);
            wrapper.find(".mbw-form-pay").submit();
            if(!widget.active_action_is_wo){
                widget.map.clearSelection();
                widget.map.reLoad();
            }
        },

        runSlideTitle: function(){
            var title = wrapper.find('.mbw-slide-title');
            var charLength = title.html().length;
            var charWidth = 12;
            var titlePadRight = wrapper.hasClass('.mbw-multiactions') ? 100 : 50;
            var titlePadLeft = 19;
            var visWidth = wrapper.find('.mbw-title').outerWidth() - (titlePadRight + titlePadLeft);
            var stringWidth = charLength * charWidth;
            var int = undefined;
            if($(window).outerWidth() <= 640){

                if(visWidth < stringWidth){

                    var inc = 0;

                    int = window.setInterval(function(){
                        title.css('marginLeft', -inc + 'px');
                        inc+=2;
                        if(inc >= stringWidth - 100){
                            inc = -(visWidth - 100);
                        }
                    }, 75);
                }
            }
        }
    };


    widget.init();

}());

//
//17 сентября - Гала-концерт, посвященный 25-летию театра "Кремлевский балет"
//19 сентября - Волшебная флейта
//20 сентября - Дон Кихот
//21 сентября - Лебединое озеро
//22 сентября 1001 ночь
//27 сентября - Спящая красавица
//28 сентября - Эсмеральда
//29 сентября - Ромео и Джульетта
//30 сентября - Корсар
//11 ноября - “Armenia”  music awards  2015
//18 октября - ГАХА "Березка"
//7 ноября - Самые лучшие песни


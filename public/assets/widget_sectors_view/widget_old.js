(function(){

    var wrapper = $('#multibooker-widget-wrapper');
    var initData = wrapper.data();
    var interval;
    var zoomInterval;
    var widget;
    if(typeof initData['actions'] !== 'string'){
        initData['actions'] = initData['actions'].toString();
    }

    widget = {
        maps:{},
        map: undefined,
        active_action_id: undefined,
        active_action: undefined,
        tp_zones: [],
        max_tp_oreder_count: 10,

        init: function(){

            try{
                widget.clearLS();
                widget.clearTicketPassLS();
            }catch(e){
                console.warn('back back it!', e);
            }

            widget.getScripts(function(){
                widget.getActions(function(){
                    widget.removeFinishedActionsFromLs();
                    widget.populateWidget(function(){
                        widget.loader(true);
                        widget.setHandlers(function(){
                            if(initData['ticketpass']){
                                var active_id = widget.getActionById();
                                widget.active_action_id = active_id['ACTION_ID'];
                                widget.populateTicketPassBasket();
                                widget.renderTicketPass(active_id, function(){

                                });
                            }else{
                                widget.renderCanvas(widget.getActionById(),function(){
                                    window.map = widget.map;
                                    var active_id = widget.getActionById();
                                    var alias = ('action_' + active_id['ACTION_ID']);

                                    if(typeof active_id == 'object'){
                                        widget.active_action_id = active_id['ACTION_ID'];
                                    }
                                    widget.loader(false);
                                    widget.populateMapFromLs(widget.getActionById()['ACTION_ID'], function(){
                                        widget.setBasketHandlers(function(){
                                        });
                                    });
                                });
                            }
                        });
                    });
                });
            });
        },

        getScripts: function(callback){
            $.getScript(initData.host + 'assets/js/plugins/mustache.js', function(res){});




            $.getScript(initData.host + 'socket.io/socket.io.js', function(res){
                $.getScript(initData.host + 'assets/widget/core.js', function(res){

                    $.getScript(initData.host + 'assets/js/no_select.js', function(res){
                        $.getScript(initData.host + 'assets/js/libs/jquery/plugins/jquery.mousewheel.min.js', function(res){
	                        $.getScript(initData.host + 'assets/js/map.js', function(res){
		                        if(typeof callback == 'function'){
			                        callback();
		                        }
	                        });
                        });
                    });
                    if (typeof Hammer !== "function") {
                        $.getScript((doc_root || params.host) + 'assets/js/libs/hammer.min.js', function (res) {
                        });
                    }

                    var cssLinks = '' +
                        '<link rel="stylesheet" type="text/css" href="'+initData.host+'assets/widget/style.css"/><link rel="stylesheet" type="text/css" href="'+initData.host+'assets/widget/font-awesome-4.2.0/css/font-awesome.min.css"/>' +
                        '<link rel="stylesheet" type="text/css" href="'+initData.host+'assets/css/map.css"/><link rel="stylesheet" type="text/css" href="'+initData.host+'assets/widget/font-awesome-4.2.0/css/font-awesome.min.css"/>';
                    $('body').append(cssLinks);
                    /*if(typeof callback == 'function'){
                     callback();
                     }*/
                });
            });
        },

        mergeExternalActions: function(obj){
            var updateArr = [];
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
            console.log('sceneInfo', sceneInfo);
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
            wrapper.html('Сервис временно недоступен. Ведутся технические работы.');
            return console.log('Сервис временно недоступен');
            var o = {
                command: 'get_actions',
                params: {
//                    external_action_id: initData['actions'],
                    action_id: initData['actions'],
                    frame: initData.frame
                }
            };
            socketQuery(o, function(res){
                if (res == 'NOT_AVALIBLE'){
                    wrapper.html('Сервис временно недоступен');
                    return console.log('Сервис временно недоступен');
                }
	            res = JSON.parse(res);
                widget.sysDate = widget.convertDateFormat(res['results'][0]['extra_data']['SYSDATE']);
                console.log(initData['actions'].length, res);
                if(initData['actions'].length == 0 ){
                    var initDataActionsArr = [];
                    for(var i in res['results'][0].data){
                        var item = res['results'][0].data[i];
                        var id = item[res['results'][0].data_columns.indexOf('ACTION_ID')];
                        initDataActionsArr.push(id);
                    }
                    initData['actions'] = initDataActionsArr.join(',');
                }


                widget.mergeExternalActions(res['results'][0]);
//                debugger;
                widget.actions = jsonToObj(widget.sortActions(res['results'][0]));
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

        populateWidget: function(callback){
            var ddToggleHtml = '';
            var moveLang = '';
            var invisBtns = '';
            var hideDD = '';
            if(initData['actions'].split(',').length > 1){

            }else{
                moveLang = 'moveLang';
                hideDD = 'hidden';
            }

            var fixSceneHtml = (initData['showscene'])? '<div class="mbw-fix-scene"><span class="mbw-switch-lang" data-keyword="fix-scene">Сцена</span><br><i class="fa fa-angle-down"></i></div>':'';

            if(initData['iszones'] == false){
                invisBtns = 'hidden';
            }else{
                wrapper.addClass('zonesView');
            }

            var zoomsHidden = (initData['ticketpass'])? 'hidden' : '';

            var mO = {
                title: '',
                actions: []
            };

            var tpl = '<div class="mbw-header"><div class="mbw-header-inner"><div class="mbw-title" title="{{title}}">{{title}}</div>' +
                '<div class="mbw-lang-switcher '+moveLang+'">' +
                '<div class="mbw-lang active" data-lang="rus">RUS</div>' +
                '<div class="mbw-lang" data-lang="eng">ENG</div>' +
                '</div>' +
                '<div class="mbw-dd-toggler '+hideDD+'"><span class="mbw-switch-lang" data-keyword="allEvents">Все мероприятия</span> <i class="fa fa-angle-down"></i></div></div>' +
                '<div class="mbw-dd '+hideDD+'">' +
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
                '<div class="mbw-alerter-wrapper"></div>' +
                '<div class="mbw-modal-wrapper"></div>' +
                fixSceneHtml +
                //'<div class="mbw-scene-bunner"><span class="mbw-switch-lang" data-keyword="scene">Сцена</span></div>' +
                '</div>' +

                '<div class="mbw-footer">' +
                '<div class="mbw-back '+invisBtns+'">' +
                '<span class="mbw-switch-lang" data-keyword="back-to-zones">Вернуться</span>' +
                '</div>' +
                '<div style="display: none!important" class="mbw-forward '+invisBtns+'">' +
                '<span class="mbw-switch-lang" data-keyword="go-to-hall">Перейти к местам</span>' +
                '</div>' +
                '<div class="mbw-basket-wrapper">' +
                '<div class="mbw-total-wrapper">' +
                '<i class="mbw-basket-sign fa fa-shopping-cart"></i>'+
                '<div class="mbw-total-inner">' +
                '<div class="mbw-service-fee-total">' +
                '<span class="mbw-switch-lang" data-keyword="service-fee">Сервисный сбор</span>: ' +
                '<span class="mbw-service-fee-insert">0</span> ' +
                '<span class="mbw-switch-lang" data-keyword="rub">руб.</span>' +
                '</div>' +
                '<div class="mbw-total-amount">' +
                '<span class="mbw-switch-lang" data-keyword="total-amount">Итого</span>: ' +
                '<span class="mbw-total-amount-insert">0</span> ' +
                '<span class="mbw-switch-lang" data-keyword="rub">руб.</span>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '<div class="mbw-clear-basket-wrapper">' +
                '<span class="mbw-switch-lang" data-keyword="clear-basket">Очистить<br />корзину</span>' +
                '</div>' +
                '<div class="mbw-purchase-order">' +
                '<span class="mbw-switch-lang" data-keyword="purchase-order">Оплатить</span>' +
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
            mO.title = widget.actions[0]['ACTION_NAME'] +' - '+ widget.actions[0]['ACTION_DATE'] +', '+widget.actions[0]['HALL'];
            for(var i in widget.actions){
                var action = widget.actions[i];
                if(typeof action == 'function'){
                    continue;
                }
                mO.actions.push({
                    id: action['ACTION_ID'],
                    title: action['ACTION_NAME'],
                    freePlaceCount: (initData['ticketpass'])? action['ACTION_DATE'] : action['FREE_PLACE_COUNT']
                });
            }


            wrapper.addClass(initData['widget_theme']);
            if (isNaN(+initData['width']) || initData['width']==''){
                initData['width'] = wrapper.parent().width()
            }
            wrapper.width(initData['width']);
            wrapper.html(Mustache.to_html(tpl, mO));
            widget.canvasContainer = wrapper.find('.mbw-canvas-wrapper');
            var headerFooterHeight = wrapper.find('.mbw-header').outerHeight() + wrapper.find('.mbw-footer').outerHeight();
            widget.canvasContainer.width(initData['width']+'px');
            if(initData['ticketpass']){
            }else{
                widget.canvasContainerHeight = ($(window).height() - headerFooterHeight) - 40;
                widget.canvasContainer.height(widget.canvasContainerHeight + 'px');
            }

            //console.log(widget.canvasContainer);

            widget.basketUl = wrapper.find('.mbw-basket-dd-content ul');
            widget.totalFee = wrapper.find('.mbw-service-fee-insert');
            widget.totalAmount = wrapper.find('.mbw-total-amount-insert');
            widget.clearBasket = wrapper.find('.mbw-clear-basket-wrapper');
            widget.priceGroups = wrapper.find('.mbw-priceGroups-wrapper ul');


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
            if(initData['iszones']){
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
                    widget.map.loadRenderItems({
                        layerO: layerO,
                        objectO: objectO
                    }, function () {
                        widget.map.render();
                        widget.map.loading = false;
//
                    });
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

        renderTicketPass: function(obj, cb){
            var o = {
                command: 'get_action_scheme_ticket_zone',
                params: {
                    action_id: obj['ACTION_ID']
                }
            };
            var tp_wrapper = wrapper.find('.mbw-canvas-wrapper');

            var tpl = '<ul class="ticket-pass-list-wrapper">' +
                '{{#zones}}<li class="ticket-pass-item" data-id="{{ACTION_SCHEME_TICKET_ZONE_ID}}">' +
                '<div class="flLeft ticket-pass-order-item-wrapper">' +
                '<div class="ticket-pass-order-btn flLeft ticket-pass-order-btn-minus"><i class="fa fa-minus"></i></div>' +
                '<div class="ticket-pass-order-count flLeft"><input type="text" class="ticket-pass-order-count-control" value="{{count}}" disabled/></div>' +
                '<div class="ticket-pass-order-btn flLeft ticket-pass-order-btn-plus"><i class="fa fa-plus"></i></div>' +
                '</div>' +
                '<div class="flLeft padTop9">{{NAME}} - {{TICKET_PRICE}} руб.</div>' +
                '<div class="flRight padTop9 padR20">{{FREE_TICKET_COUNT}} мест.</div>' +
                '</li>{{/zones}}</ul>';

            socketQuery(o, function(res){
                res = jsonToObj(JSON.parse(res)['results'][0]);
                widget.tp_zones.push(res);
                var data = {zones: []};
                for(var i in res){
                    res[i].count = widget.getTicketPassPreorderedCountFromLs(res[i]['ACTION_ID'], res[i]['ACTION_SCHEME_TICKET_ZONE_ID']).count;
                    data.zones.push(res[i]);
                }
                tp_wrapper.html(Mustache.to_html(tpl, data));

                tp_wrapper.find(".ticket-pass-order-item-wrapper").find('*').each(function(idx, elem){
                    preventSelection(elem);
                });

                widget.loader(false);

                widget.setTicketPassHandlers(function(){

                });

                if(typeof cb == 'function'){
                    cb();
                }
            });

        },

        setTicketPassHandlers: function(){

            var tp_wrapper = wrapper.find('.mbw-canvas-wrapper');
            var zones = tp_wrapper.find('li.ticket-pass-item');
            var inc = tp_wrapper.find('.ticket-pass-order-btn-plus');
            var dec = tp_wrapper.find('.ticket-pass-order-btn-minus');
            var inp = tp_wrapper.find('.ticket-pass-order-count-control');

            function testInt(val){
                var reg = new RegExp('^[0-9]$');
                return reg.test(val);
            }

            inc.off('click').on('click', function(){
                var nowOrdered = widget.getTotalTicketPassOrderedCount();
                var par = $(this).parents('.ticket-pass-item').eq(0);
                var tInp = par.find('.ticket-pass-order-count-control');
                var val = (tInp.val() == '')? 0 : parseInt(tInp.val());

//                console.log(val, nowOrdered, widget.max_tp_oreder_count);

                if(val + (nowOrdered-val) < widget.max_tp_oreder_count){
                    var setMe = val+1;
                    tInp.val(setMe);
                    widget.updateLsTicketPass(widget.active_action_id, par.data('id'), setMe);
                }
            });

            dec.off('click').on('click', function(){
                var par = $(this).parents('.ticket-pass-item').eq(0);
                var tInp = par.find('.ticket-pass-order-count-control');
                var val = (tInp.val() == '')? 0 : parseInt(tInp.val());
                if(val > 0){
                    var setMe = val-1;
                    tInp.val(setMe);
                    widget.updateLsTicketPass(widget.active_action_id, par.data('id'), setMe);
                }else{

                }
            });

            inp.off('input').on('input', function(){
                var par = $(this).parents('.ticket-pass-item').eq(0);
                var val = $(this).val();
                var valArr = val.split('');
                var setMe = '';
                if(!testInt(valArr[valArr.length-1])){
                    valArr.pop();
                    setMe = valArr.join('');
                    $(this).val(setMe);
                }else{
                    setMe = val;
                    widget.updateLsTicketPass(widget.active_action_id, par.data('id'), setMe);
                }
            });

//            console.log(widget);
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
                    rus: 'Оплатить',
                    eng: 'Purchase'
                },
                {
                    key: 'basket',
                    rus: 'Корзина',
                    eng: 'Cart'
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

        updateLsTicketPass: function(action_id, group_id, count){
            var inls = localStorage.getItem('mbw-tp-basket');
            if (inls == null){
                inls = {
                    actions: []
                };
                localStorage.setItem('mbw-tp-basket',JSON.stringify(inls));
            }else{
                inls = JSON.parse(inls);
            }

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

            var gFound = false;
            for(var i in current_action.groups){
                var g = current_action.groups[i];
                if(g.id == group_id){
                    g.count = count;
                    gFound = true;
                }
            }

            if(!gFound){
                var zData = widget.getGroupDataById(current_action.id, group_id);
                var title = (zData)? zData['NAME'] : '';
                var price = (zData)? zData['TICKET_PRICE']: '';
                current_action.groups.push({
                    title: title,
                    id: group_id,
                    price: price,
                    count: count
                });
            }

//            console.log(inls);

            function removeEmpty(){
                for(var l in inls){
                    var lsi = inls[l];

                    for(var act in lsi){
                        var a = lsi[act];
                        for(var g in a.groups){
                            var gr = a.groups[g];
                            if(gr.count == 0){
                                inls[l][act].groups.splice(g, 1);
                                removeEmpty();
                            }
                        }
                    }
                }
            }
            removeEmpty();

            localStorage.setItem('mbw-tp-basket', JSON.stringify(inls));
            widget.populateTicketPassBasket();
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
                return;
            }
            var inls = localStorage.getItem('mbw-basket');
            if (inls == null){
                return;
            }
            inls = JSON.parse(inls);
            for (var i in inls.actions) {
                var act = inls.actions[i];
                if (act.id==action_id){
                    for (var i2 in act.places) {
                        var place = act.places[i2];
                        if (place.id==place_id){
                            act.places.splice(i2,1);
                            break;
                        }
                    }
                    break;
                }
            }
            localStorage.setItem('mbw-basket', JSON.stringify(inls));
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
        },

        updateMap:function(){
            var inls = localStorage.getItem('mbw-basket');
            var mapInstance = widget.map;
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
            var title = action['ACTION_NAME'] +' - '+ action['ACTION_DATE'] +', '+action['HALL'];
            wrapper.find('.mbw-title').html(title);
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

            var mbw_tap_zoomIn = new Hammer(widget.zoomIn[0], {});
            var mbw_tap_zoomOut = new Hammer(widget.zoomOut[0], {});

            widget.basketToggler.off('click').on('click', function(){
                if(widget.basketDD.hasClass('opened')){
                    widget.basketDD.animate({
                        bottom: -322+'px'
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

            widget.closeDD.off('click').on('click', function(){
                widget.basketDD.animate({
                    bottom: -322+'px'
                }, 200,function(){
                    widget.basketDD.removeClass('opened');
                });
            });

            widget.actionsDDToggler.off('click').on('click', function(){
                if(widget.actionsDD.hasClass('opened')){
                    widget.actionsDD.animate({
                        top: -100+'%'
                    }, 200,function(){
                        widget.actionsDD.removeClass('opened');
                    });
                }else{
                    widget.actionsDD.animate({
                        top: 50+'px'
                    }, 200,function(){
                        widget.actionsDD.addClass('opened');
                    });
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
                if(initData['ticketpass']){
                    widget.loader(true);
                    widget.active_action_id = actId;
                    widget.populateTicketPassBasket();
                    widget.renderTicketPass(widget.getActionById(actId), function(){});
                    widget.actionsDD.animate({
                        top: -100+'%'
                    }, 200,function(){
                        widget.actionsDD.removeClass('opened');
                    });
                }else{
                    widget.glowPriceGroup('', false);
                    widget.loader(true);
                    widget.backBtn.hide(0);
                    if(initData['iszones']){
                        widget.forwardBtn.show(0);
                    }
                    widget.actionsDD.animate({
                        top: -100+'%'
                    }, 200,function(){
                        widget.actionsDD.removeClass('opened');
                    });
                    widget.renderCanvas(widget.getActionById(actId),function(){
                        widget.active_action_id = actId;
                        widget.setHandlers();
                        widget.switchTitle();
                        widget.loader(false);
                        widget.populateMapFromLs(actId, function(){
                            widget.setBasketHandlers();
                        });
                    });
                }
            });

            widget.canvasContainer.on('addToSelection', function(){
                var placesArr = [];
                for(var i in widget.map.selection){
                    if (!widget.map.squares[widget.map.selection[i]]){
                        continue;
                    }
                    placesArr.push(widget.map.squares[widget.map.selection[i]]);
                }
                widget.addToLS(placesArr);
                widget.populateBasket();
            });

            widget.canvasContainer.on('removeFromSelection', function(e, sel, removedIds){
                for(var i in removedIds){
                    widget.removeFromLS(widget.active_action_id, removedIds[i]);
                }
                widget.populateBasket();
            });

            widget.zoomIn.off('mousedown').on('mousedown', function(){
                var cX = +widget.map.cWidth / 2;
                var cY = +widget.map.cHeight / 2;
                zoomInterval = window.setInterval(function(){
                    widget.canvasContainer.trigger("scale_map", [cX, cY, 1]);
                },50);
            });

            widget.zoomOut.off('mousedown').on('mousedown', function(){
                var cX = +widget.map.cWidth / 2;
                var cY = +widget.map.cHeight / 2;
                zoomInterval = window.setInterval(function(){
                    widget.canvasContainer.trigger("scale_map", [cX, cY, -1]);
                },50);
            });

            mbw_tap_zoomIn.off('tap').on('tap', function(){
                var cX = +widget.map.cWidth / 2;
                var cY = +widget.map.cHeight / 2;
                widget.canvasContainer.trigger("scale_map", [cX, cY, 1]);
            });

            mbw_tap_zoomOut.off('tap').on('tap', function(){
                var cX = +widget.map.cWidth / 2;
                var cY = +widget.map.cHeight / 2;
                widget.canvasContainer.trigger("scale_map", [cX, cY, -1]);
            });

            widget.purchaseBtn.off('click').on('click', function(){
                var purchaseAvaliable = false;
                var storedTickets = (initData['ticketpass'])? localStorage.getItem('mbw-tp-basket') : localStorage.getItem('mbw-basket');
                var lang = (wrapper.find('.mbw-lang.active').data('lang') == 'rus')? 'rus':'eng';
                var ttl = (lang == 'rus')? 'Внимание' : 'Attention';
                var text = (lang == 'rus')? 'Выберите места' : 'You have to select places first';

                if(storedTickets == null){
                    widget.alerter(ttl, text, function(){});
                    return;
                }
                storedTickets = JSON.parse(storedTickets);

                if(initData['ticketpass']){
                    purchaseAvaliable = widget.getTotalTicketPassOrderedCount() > 0;
                }else{
                    for(var i in storedTickets.actions){
                        var act = storedTickets.actions[i];
                        for(var k in act.places){
                            var plc = act.places[k];
                            purchaseAvaliable = true;
                        }
                    }
                }

                if(purchaseAvaliable == false){
                    widget.alerter(ttl, text, function(){});
                    return;
                }


                if(purchaseAvaliable){

                    if(initData['withdelivery']){
                        widget.selectOrderType();
                    }else{
                        widget.purchase();
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

                    widget.map.sectorsSelect(function(){
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
                        widget.loader(false);

                    });
                    wrapper.addClass('hallView');
                    wrapper.removeClass('zonesView');
                    widget.forwardBtn.hide(0);
                    widget.backBtn.show(0);
                }
            });

            widget.backBtn.off('click').on('click', function(){
                wrapper.find('.mbw-priceGroups-wrapper li').hide(0);

                wrapper.removeClass('hallView');
                wrapper.addClass('zonesView');

                widget.loader(true);
                widget.map.backToSectors(function(){
                    widget.loader(false);
                });
                widget.backBtn.hide(0);
                //widget.forwardBtn.show(0);
            });

            wrapper.find('.mbw-zoom-in, .mbw-zoom-out, .mbw-priceGroups-wrapper, .mbw-scene-bunner, .mbw-basket-dd-wrapper, .mbw-dd, .mbw-fix-scene').off('mouseenter').on('mouseenter', function(){
                widget.canvasContainer.trigger("leave_container");
            });
            widget.canvasContainer.on('leave_container', function(){
                clearInterval(zoomInterval);
            });
            $(document).on('mouseup', function(){
                clearInterval(zoomInterval);
            });

            /*widget.canvasContainer.on('mousemove', function(){
             widget.renderScene();
             });
             */
            if(typeof callback == 'function'){
                callback();
            }
        },                          //SET HANDLERS

        setTicketPassBasketHandlers: function(cb){

            if(widget.incBtn && widget.decBtn){
                widget.incBtn.off('click').on('click', function(){
                    var nowOrdered = widget.getTotalTicketPassOrderedCount();
                    var id = $(this).data('id');
                    var actId = $(this).data('action_id');
                    var count = $(this).data('count');
                    if(count + (nowOrdered-count) < widget.max_tp_oreder_count){
                        widget.updateLsTicketPass(actId, id, (+count +1));
                        widget.renderTicketPass(widget.getActionById(widget.active_action_id), function(){});
                    }
                });

                widget.decBtn.off('click').on('click', function(){
                    var id = $(this).data('id');
                    var actId = $(this).data('action_id');
                    var count = $(this).data('count');

                    if(count > 0){
//                        console.log(actId, id, (+count -1));
                        widget.updateLsTicketPass(actId, id, (+count -1));
                        widget.renderTicketPass(widget.getActionById(widget.active_action_id), function(){});
                    }
                });
            }

            widget.clearBasket.off('click').on('click', function(){
                widget.clearTicketPassLS();
                widget.renderTicketPass(widget.getActionById(widget.active_action_id), function(){});
                widget.populateTicketPassBasket();
            });

            if(typeof cb == 'function'){
                cb();
            }
        },

        setBasketHandlers: function(callback){
            if(widget.removeBtns){
                widget.removeBtns.off('click').on('click', function(){
                    var id = $(this).data('id');
                    var actId = $(this).data('action_id');

                    widget.removeFromLS(actId, id);
                    widget.updateMap();
                    widget.populateBasket();
	                widget.map.removeFromSelection(id);
                });
            }

            widget.clearBasket.off('click').on('click', function(){
			    widget.clearLS();
                widget.updateMap();
                widget.populateBasket();
	            widget.map.removeFromSelection(widget.map.selection);
            });


            if(typeof callback == 'function'){
                callback();
            }
        },

        populateTicketPassBasket: function(){
            var storedTickets = localStorage.getItem('mbw-tp-basket');
            if(storedTickets == null){
                widget.basketUl.html('<li class="mbw-empty-basket"><span class="mbw-switch-lang" data-keyword="emptyBasket">Корзина пуста</span></li>');
                widget.switchLanguage(wrapper.find('.mbw-lang.active').data('lang'));
                widget.calculateTotal();
                widget.setBasketHandlers();
                return;
            }
//            alert(1);
            storedTickets = JSON.parse(storedTickets);
            var bi_tpl ='{{#groups}}<li>' +
                '<div class="mbw-basket-item-wrapper mbw-basket-item-ticketpass-wrapper">' +
                '<div class="mbw-basket-item-title">{{{action_title}}}</div>' +
                '<div class="mbw-basket-item-info-wrapper">' +
                '<div class="mbw-basket-item-zone">{{title}}</div>' +
                '<div class="mbw-basket-item-seat">Билетов: {{count}}</div>' +
                '</div>' +
                '<div class="mbw-basket-item-price">{{price}} <span class="mbw-switch-lang" data-keyword="rub">руб.</span></div>' +
                '</div>' +
                '<div class="mbw-basket-item-remove mbw-basket-item-dec" data-count="{{count}}" data-id="{{id}}" data-action_id="{{action_id}}"><i class="fa fa-minus"></i></div>' +
                '<div class="mbw-basket-item-remove mbw-basket-item-inc" data-count="{{count}}" data-id="{{id}}" data-action_id="{{action_id}}"><i class="fa fa-plus"></i></div>' +
                '{{/groups}}</li>';

            var mO = {
                groups: []
            };


            for(var i in storedTickets.actions){
                var act = storedTickets.actions[i];
                var actData = widget.getActionById(act.id);
                for(var k in act.groups){
                    var g = act.groups[k];
                    mO.groups.push({
                        action_id: act.id,
                        action_title: actData['ACTION_NAME'] +'   <b>'+ actData['ACTION_DATE']+'</b>',
                        title: g.title,
                        price: +g.price * +g.count,
                        count: g.count,
                        id: g.id
                    });
                }

            }

            if(mO.groups.length == 0){
                widget.basketUl.html('<li class="mbw-empty-basket"><span class="mbw-switch-lang" data-keyword="emptyBasket">Корзина пуста</span></li>');
                widget.switchLanguage(wrapper.find('.mbw-lang.active').data('lang'));
                widget.calculateTotal();
//                widget.setTicketPassBasketHandlers();
            }else{
                widget.basketUl.html(Mustache.to_html(bi_tpl, mO));
                widget.incBtn = widget.basketUl.find('.mbw-basket-item-inc');
                widget.decBtn = widget.basketUl.find('.mbw-basket-item-dec');
                widget.calculateTotal();
                widget.setTicketPassBasketHandlers();
            }
        },

        populateBasket: function(){
            var storedTickets = localStorage.getItem('mbw-basket');
            if(storedTickets == null){
                widget.basketUl.html('<li class="mbw-empty-basket"><span class="mbw-switch-lang" data-keyword="emptyBasket">Корзина пуста</span></li>');
                widget.switchLanguage(wrapper.find('.mbw-lang.active').data('lang'));
                widget.calculateTotal();
                widget.setBasketHandlers();
                return;
            }
            storedTickets = JSON.parse(storedTickets);
            var bi_tpl ='{{#basketItems}}<li>' +
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

            var mO = {
                basketItems: []
            };


            for(var i in storedTickets.actions){
                var act = storedTickets.actions[i];
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
                        place_title:    plcData.place_title,
                        place:          plcData.place,
                        line_title:     plcData.line_title,
                        line:           plcData.line,
                        price:          widget.splitPrice(plcData.salePrice)
                    });
                }
            }
            if(mO.basketItems.length == 0){
                widget.basketUl.html('<li class="mbw-empty-basket"><span class="mbw-switch-lang" data-keyword="emptyBasket">Корзина пуста</span></li>');
                widget.switchLanguage(wrapper.find('.mbw-lang.active').data('lang'));
                widget.calculateTotal();
                widget.setBasketHandlers();
            }else{
                widget.basketUl.html(Mustache.to_html(bi_tpl, mO));
                widget.removeBtns = widget.basketUl.find('.mbw-basket-item-remove');
                widget.calculateTotal();
                widget.setBasketHandlers();
            }
        },

        calculateTotal: function(){
            var storedTickets, totalAmount, totalFee;
            if(initData['ticketpass']){
                storedTickets = localStorage.getItem('mbw-tp-basket');
                if(storedTickets == null){
                    widget.totalFee.html(0);
                    widget.totalAmount.html(0);
                    return;
                }
                storedTickets = JSON.parse(storedTickets);
                totalAmount = 0;
                totalFee = 0;

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

                widget.totalFee.html(widget.splitPrice(totalFee.toFixed(2)));
                widget.totalAmount.html(widget.splitPrice((totalAmount + totalFee).toFixed(2)));
            }else{
                storedTickets = localStorage.getItem('mbw-basket');
                if(storedTickets == null){
                    widget.totalFee.html(0);
                    widget.totalAmount.html(0);
                    return;
                }
                storedTickets = JSON.parse(storedTickets);
                totalAmount = 0;
                totalFee = 0;

                for(var i in storedTickets.actions){
                    var act = storedTickets.actions[i];
                    var actFee = +widget.getActionById(act.id)['SERVICE_FEE'];

                    for(var k in act.places){
                        var plcData = act.places[k];
                        actFee = +actFee || 0;
                        plcData.salePrice = +plcData.salePrice || 0;

                        totalFee += +plcData.salePrice / 100 * actFee;
                        totalAmount += +plcData.salePrice;
                    }
                }

                widget.totalFee.html(widget.splitPrice(totalFee.toFixed(2)));
                widget.totalAmount.html(widget.splitPrice((totalAmount + totalFee).toFixed(2)));
            }


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
            var squares = widget.map.squares;
            var mO = {
                priceGroups:[]
            };
            var obj = {};
            var total_free_count = 0;
            var tpl = '{{#priceGroups}}<li data-id="{{salePrice}}"><div class="mbw-legend-item-color" style="background-color: {{color}}"></div><div class="mbw-legend-item-price">{{price}} <span class="mbw-switch-lang" data-keyword="rub">руб.</span></div></li>{{/priceGroups}}';

            for (var i1 in squares) {
                var square = squares[i1];
                if (square.status == 0 || +square.salePrice <= 0){
                    continue;
                }else{
                    console.log(+square.salePrice);
                }
                if (obj[square.salePrice] === undefined) {
                    obj[square.salePrice] = {
                        price: widget.splitPrice(square.salePrice),
                        salePrice: square.salePrice,
                        count: 1,
                        color: square.color0,
                        priceGroup: square.priceGroup
                    };
                } else {
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
                if (aPrice > bPrice){
                    return 1;
                }else if (aPrice < bPrice){
                    return -1;
                }
                return 0;
            });


            console.log(mO);

            widget.priceGroups.html(Mustache.to_html(tpl, mO));
            widget.priceGroupsItems = widget.priceGroups.find('li');

            widget.priceGroupsItems.off('click').on('click', function(){
                var pgId = $(this).data('id');
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
            var storedTickets = (initData['ticketpass'])? localStorage.getItem('mbw-tp-basket') : localStorage.getItem('mbw-basket');
            if(storedTickets == null){
                console.warn('Mister, prevent please empty basket purchasing!');
                return;
            }
            storedTickets = JSON.parse(storedTickets);
            var placesConcatArr = [];
            var placesArr = [];
            var actionsArr = [];
            var areaGroups = {};

            for(var i in storedTickets.actions){
                var act = storedTickets.actions[i];
                for(var k in act.places){
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

            console.log(areaGroups);
            var concatStr = '';
            for(var i in areaGroups){
                var ag = areaGroups[i];
                concatStr += i + ': (';
                for(var k in ag.places){
                    var plc = ag.places[k];
                    concatStr += 'р' + plc.line + ' м' + plc.place + '; ';
                }
                concatStr += ');  ';
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
            modalContainer.find('.mbw-delivery-wrapper').height(wrapper.find('.mbw-content').outerHeight() - 100);
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

                    if(initData['ticketpass']){
                        var zonesArr = [];
                        var countsArr = [];
                        for(var i in storedTickets){
                            var lsi = storedTickets[i];
                            for(var k in lsi){
                                var a = lsi[k];
                                for(var l in a.groups){
                                    var g = a.groups[l];
                                    zonesArr.push(g.id);
                                    countsArr.push(g.count);
                                }
                            }
                        }

                        purchaseObj = {
                            command: 'create_order_without_places',
                            params: {
                                frame: initData['frame'],
	                            wo_action_id: initData['actions'],
                                action_scheme_ticket_zone_id: [],
                                ticket_count:[],
                                delivery: 'TRUE'
                            }
                        };


                        for(var i = 0; i < zonesArr.length; i++){
                            var z = zonesArr[i];
                            var c = countsArr[i];
                            var idx = i+1;

                            purchaseObj.params['action_scheme_ticket_zone_id'].push(z);
                            purchaseObj.params['ticket_count'].push(c);
                        }

                        purchaseObj.params['action_scheme_ticket_zone_id'] = purchaseObj.params['action_scheme_ticket_zone_id'].join(',');
                        purchaseObj.params['ticket_count'] = purchaseObj.params['ticket_count'].join(',');

                    }else{
                        for(var i in storedTickets.actions){
                            var act = storedTickets.actions[i];
                            for(var k in act.places){
                                var plc = act.places[k];
                                placesArr.push(plc.id);
                                actionsArr.push(act.id.toString());
                            }
                        }

                        if(placesArr.length == 0 || actionsArr == 0){
                            alert('Mister, prevent please empty basket purchasing!');
                            return;
                        }

                        purchaseObj = {
                            command: 'create_order',
                            params:{
                                action_scheme_id: placesArr.join(','),
                                action_id: actionsArr.join(','),
                                frame: initData['frame'],
                                delivery: 'TRUE'
                            }
                        };


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
                        console.log(res);
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
                    widget.map.reLoad();
                }if(initData['ticketpass']){
                    widget.renderTicketPass(widget.getActionById(widget.active_action_id), function(){});
                }
                widget.populateBasket();
                widget.populateTicketPassBasket();
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
            console.log(res);
            return res;
        },

        purchase: function(){
            var pdfPath = widget.actions[0]['RULES_PDF_PATH'] || 'rules.pdf';
            var lang = (wrapper.find('.mbw-lang.active').data('lang') == 'rus')? 'rus':'eng';
            var pTitle = (lang == 'rus')?'Внимание': 'Attention';
            var pth = (pdfPath.indexOf('http://')==-1 && pdfPath.indexOf('https://')==-1)?doc_root + pdfPath : pdfPath;
            var pHtml = (lang == 'rus')?'<label><input type="checkbox" class="mbw-i-agree" /> Я принимаю <a target="_blank" href="'+pth+'">условия пользовательского соглашения</a></label>' : '<label><input type="checkbox" class="mbw-i-agree" /> I agree the <a target="_blank" href="' + +pth+'">user agreement</a></label>';

            var pOkCallback = function(){
                widget.loader(true);
                var placesArr = [];
                var actionsArr = [];

                var storedTickets = (initData['ticketpass'])? localStorage.getItem('mbw-tp-basket') : localStorage.getItem('mbw-basket');
                if(storedTickets == null){
                    alert('Mister, prevent please empty basket purchasing!');
                    return;
                }
                storedTickets = JSON.parse(storedTickets);

                var purchaseObj = {};

                if(initData['ticketpass']){
                    var zonesArr = [];
                    var countsArr = [];
                    for(var i in storedTickets){
                        var lsi = storedTickets[i];
                        for(var k in lsi){
                            var a = lsi[k];
                            for(var l in a.groups){
                                var g = a.groups[l];
                                zonesArr.push(g.id);
                                countsArr.push(g.count);
                            }
                        }
                    }

                    purchaseObj = {
                        command: 'create_order_without_places',
                        params: {
                            frame: initData['frame'],
	                        wo_action_id: initData['actions'],
                            action_scheme_ticket_zone_id: [],
                            ticket_count:[]
                        }
                    };


                    for(var i = 0; i < zonesArr.length; i++){
                        var z = zonesArr[i];
                        var c = countsArr[i];
                        var idx = i+1;

                        purchaseObj.params['action_scheme_ticket_zone_id'].push(z);
                        purchaseObj.params['ticket_count'].push(c);
                    }

                    purchaseObj.params['action_scheme_ticket_zone_id'] = purchaseObj.params['action_scheme_ticket_zone_id'].join(',');
                    purchaseObj.params['ticket_count'] = purchaseObj.params['ticket_count'].join(',');

                }else{
                    for(var i in storedTickets.actions){
                        var act = storedTickets.actions[i];
                        for(var k in act.places){
                            var plc = act.places[k];
                            placesArr.push(plc.id);
                            actionsArr.push(act.id.toString());
                        }
                    }

                    if(placesArr.length == 0 || actionsArr == 0){
                        alert('Mister, prevent please empty basket purchasing!');
                        return;
                    }

                    purchaseObj = {
                        command: 'create_order',
                        params:{
                            action_scheme_id: placesArr.join(','),
                            action_id: actionsArr.join(','),
                            frame: initData['frame']
                        }
                    };
                }

                socketQuery(purchaseObj, function(res){
                    widget.loader(false);
                    res = JSON.parse(res);
                    if(res['results'][0]['code'] == 0){
                        if(initData['ticketpass']){
                            localStorage.removeItem('mbw-tp-basket');
                            widget.populateTicketPassBasket();
                            widget.toAcquiropay(res['results'][0]);
                        }else{
                            localStorage.removeItem('mbw-basket');
                            widget.map.clearSelection();
                            widget.map.reLoad();
                            widget.populateBasket();
                            widget.toAcquiropay(res['results'][0]);
                        }
                    }else if(res['results'][0]['code'] == 20111){

                        if(initData['ticketpass']){
                            var lang = (wrapper.find('.mbw-lang.active').data('lang') == 'rus')? 'rus':'eng';
                            var title = (lang == 'rus')? 'Ошибка': 'Error';
                            var text = (lang == 'rus')? 'Что-то пошло не так, попробуйте повторить попытку позднее': 'Something goes wrong, try again later';
                            widget.alerter(title, text, function(){});

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
                                widget.populateBasket();
                            };
                            widget.alerter(errTitle, errText, errOk);
                            console.log(errHtml);
                            //widget.alerter(errTitle, errHtml, errOk);
                        }


                    }else{
                        var lang = (wrapper.find('.mbw-lang.active').data('lang') == 'rus')? 'rus':'eng';
                        var title = (lang == 'rus')? 'Ошибка': 'Error';
                        var text = (lang == 'rus')? 'Что-то пошло не так, попробуйте повторить попытку позднее': 'Something goes wrong, try again later';
                        widget.alerter(title, text, function(){

                            if(initData['ticketpass']){

                            }else{
                                localStorage.removeItem('mbw-basket');
                                if(typeof widget.map.clearSelection == 'function'){
                                    widget.map.clearSelection();
                                }
                                if(typeof widget.map.reLoad == 'function'){
                                    widget.map.reLoad();
                                }
                                widget.populateBasket();
                            }

                        });
                        console.log('ERROR', res);
                    }
                });

            };
            var pCancelCallback = function(){};
            widget.prompt(pTitle, pHtml, pOkCallback, pCancelCallback);
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

        prompt: function(title, html, ok, cancel){
            var lang = (wrapper.find('.mbw-lang.active').data('lang') == 'rus')? 'rus':'eng';
            var okText = (lang == 'rus')? 'Подтвердить' : 'Confirm' ;
            var cancelText = (lang == 'rus')? 'Отмена' : 'Cancel' ;
            var promptContainer = wrapper.find('.mbw-prompt-wrapper');
            var tpl =   '<div class="mbw-prompt-title">{{title}}</div>' +
                '<div class="mbw-prompt-content">{{{html}}}</div>' +
                '<div class="mbw-prompt-footer"><div class="mbw-prompt-btn mbw-prompt-cancel">'+cancelText+'</div><div class="mbw-prompt-btn mbw-prompt-ok disabled">'+okText+'</div></div>';
            var mO = {
                title: title,
                html: html
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
            });
            promptContainer.find('.mbw-prompt-cancel').off('click').on('click', function(){
                if(typeof cancel == 'function'){
                    cancel();
                }
                promptContainer.html('');
            });
        },

        toAcquiropay: function(obj){
            var values = {};
            var merchant_id = obj['MERCHANT_ID'];
            var product_id = obj['PRODUCT_ID'];

            values['merchant_id'] = merchant_id;
            values['product_id'] = product_id;
            values['amount'] = obj['AMOUNT'];
            values['cf'] = obj['ORDER_ID'];
            values['cf2'] = obj['CF2'];
            values['cf3'] = obj['CF3'];
            values['params'] = params;

            values['cb_url'] = obj['CB_URL'];
            values['ok_url'] = doc_root+"assets/widget/payment_ok.php?back="+document.location.href;
            values['ko_url '] = doc_root+"assets/widget/payment_ko.html";
            values['token'] = obj['TOKEN'];

            var html = "";
            for(var key in values){

                html+= key+'<input type="text" name="'+key+'" value="'+values[key]+'" />';
            }

            wrapper.find(".mbw-form-pay").html(html);
            wrapper.find(".mbw-form-pay").submit();
            if(!initData['ticketpass']){
                widget.map.clearSelection();
                widget.map.reLoad();
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
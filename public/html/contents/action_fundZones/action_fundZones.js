

function action_fundZones_init(id){
    var environment = MB.Content.find(id);
    var action_fundZones_map;
    var sid = MB.User.sid;
    environment.selected_group = 0;
    var newerGuid =  environment.parentGuid ||  MB.Core.guid();

    environment.select_fund  = {};



    function loadFundGroups(){
        /// загрузка фондов
        var isUsedOnly = ($("#modal_"+id+"_wrapper").find('input.showOnlyUsed').attr('checked') == 'checked')? "FALSE": "TRUE";
        MB.Core.sendQuery({command:"get",object:"fund_group_for_action_scheme",sid:sid,params:{action_id:environment.action_id, show_all:isUsedOnly}},function(data){
            //var obj = xmlToObject(data,"ROW");
            var obj = MB.Core.jsonToObj(data);
            var html = '';
            var FUND_GROUP_ID,NAME,COLOR,PLACE_COUNT,NAME_WITH_STATUS;
            for (var k in obj){
                FUND_GROUP_ID = obj[k].FUND_GROUP_ID;
                NAME = obj[k].NAME;
                NAME_WITH_STATUS = obj[k].NAME_WITH_STATUS;
                PLACE_COUNT = obj[k].PLACE_COUNT;
                COLOR = obj[k].COLOR;
                html += '<li id="one_fund_group'+FUND_GROUP_ID+'" class="one_fund_group">' +
                            '<div class="colorCircle" style="background-color:'+COLOR+'" ></div>' +
                            '<div class="info">' +
                                '<a href="#">'+NAME_WITH_STATUS+'</a>'+
                                '<span>'+PLACE_COUNT+' мест</span>' +
                            '</div>'+
                        '</li>';


                    /*'<tr>'+
                    '<td class="highlight one_fund_group" id="one_fund_group'+FUND_GROUP_ID+'" >'+
                    '<div class="fund_color" style="border-left: 10px solid '+COLOR+';border-bottom: 0px solid '+COLOR+';"></div>'+
                    '<a href="#">'+NAME_WITH_STATUS+'</a>'+
                    '</td>'+
                    '<td class="hidden-xs">'+PLACE_COUNT+'</td>'+
                    '</tr>';*/




                /* html += '<div class="one_fund_group" id="one_fund_group'+FUND_GROUP_ID+'" style="background-color:'+COLOR+';">' +
                 '<div class="select_point"></div>'+
                 '<span>'+NAME_WITH_STATUS+'</span>' +
                 '<span class="pf_right">'+PLACE_COUNT+'</span>' +
                 '</div>';*/
            }
            $("#TOTAL_PLACE_COUNT").html(data.TOTAL_PLACE_COUNT);
            $("#TOTAL_SELECTED_PLACE_COUNT").html(data.TOTAL_SELECTED_PLACE_COUNT);
            $("#TOTAL_NOT_SELECTED_PLACE_COUNT").html(data.TOTAL_NOT_SELECTED_PLACE_COUNT);
            $("#TOTAL_EXCLUDED_PLACE_COUNT").html(data.TOTAL_EXCLUDED_PLACE_COUNT);


            $("#for_fund_groups").html(html);
            $(".one_fund_group").off('click').on('click', function(){
                if(action_fundZones_map.shiftState==16){
                    var id = this.id.replace(/[^0-9]/ig,"");

                    bootbox.dialog({
                        message: "Раскрасить все этим фондом?",
                        title: "",
                        buttons: {
                            success: {
                                label: "Да, все места",
                                className: "green",
                                callback: function() {

                                    bootbox.dialog({
                                        message: "Перевод выделеных мест в другой фонд может повлиять на доступность для продажи этих мест.<br>" +
                                            "Эта операция будет применена только для свободных на текущий момент мест.<br>" +
                                            "Вы уверены, что хотите выполнить перераспределение?",
                                        title: "<span style='color:#f00;'>Перераспределение.</span>",
                                        buttons: {
                                            ok: {
                                                label: "Выполнить перераспределение",
                                                className: "red",
                                                callback: function() {
                                                    MB.Core.sendQuery({command:"operation",object:"fill_action_scheme_by_fund_group",sid:sid,params:{
                                                        action_id:environment.action_id,
                                                        fund_group_id:id,
                                                        all:1
                                                    }},function(){
                                                        loadFundGroups();
                                                        action_fundZones_map.reLoad();
                                                    });
                                                }
                                            },
                                            cancel: {
                                                label: "Отмена",
                                                className: "green",
                                                callback:function(){
                                                    action_fundZones_map.clearSelection(true);
                                                    action_fundZones_map.render();
                                                }
                                            }
                                        }
                                    });


                                }
                            },
                            free_only: {
                                label: "Только свободные",
                                className: "yellow",
                                callback: function() {

                                    bootbox.dialog({
                                        message: "Перевод выделеных мест в другой фонд может повлиять на доступность для продажи этих мест.<br>" +
                                            "Эта операция будет применена только для свободных на текущий момент мест.<br>" +
                                            "Вы уверены, что хотите выполнить перераспределение?",
                                        title: "<span style='color:#f00;'>Перераспределение.</span>",
                                        buttons: {
                                            ok: {
                                                label: "Выполнить перераспределение",
                                                className: "red",
                                                callback: function() {
                                                    MB.Core.sendQuery({command:"operation",object:"fill_action_scheme_by_fund_group",sid:sid,params:{
                                                        action_id:environment.action_id,
                                                        fund_group_id:id,
                                                        all:0
                                                    }},function(){
                                                        loadFundGroups();
                                                        action_fundZones_map.reLoad();
                                                    });
                                                }
                                            },
                                            cancel: {
                                                label: "Отмена",
                                                className: "green",
                                                callback:function(){
                                                    action_fundZones_map.clearSelection(true);
                                                    action_fundZones_map.render();
                                                }
                                            }
                                        }
                                    });
                                }
                            },
                            cancel: {
                                label: "Отмена",
                                className: "blue",
                                callback: function() {

                                }
                            }
                        }
                    });


                    return;
                }

                $(".fund_color").css("borderBottomWidth","0");
                $(".fund_color",this).css("borderBottomWidth","2px");
                environment.selected_group = this.id.replace(/[^0-9]+/ig,'');
            });

           /* $("#fund_manager span").click(function(){
                modal_show("fund_groups/fund_groupsModal.html",{zIndex:1003,zIndexFade:1002},null,function(){
                    loadFundGroups();
                });
            });*/

            if (environment.selected_group!=0)
            {
                action_fundZones_map.shiftState = 0;
                $("#one_fund_group"+environment.selected_group).click();
            }

        });
    }







    //MB.Core.sendQuery({command:"get",object:"hall_scheme_fundzone",sid:sid,params:{where: "hall_scheme_id = "+environment.hall_scheme_id+" and DEFAULT_FUND_ZONE_ID=1"}},function(data0){
    MB.Core.sendQuery({command:"get",object:"action",sid:sid,params:{where: "action_id = "+environment.action_id}},function(data0){
        var obj = MB.Core.jsonToObj(data0);
        environment.action_id = obj[0].ACTION_ID;




        /*******____________________________________________________________________________________****///
        action_fundZones_map = new Map1({
            container: $("#modal_"+id+"_wrapper #box_for_action_fundZones_map"),
            mode:"admin"
            /*,
             cWidth:environment.getWidth(),
             cHeight:environment.getHeight()*/
        });


        var socketObject = {
            sid:sid,
            type:"action_scheme_fund_group",
            param:"action_id",
            id:environment.action_id,
            portion:200,
            save:{
                command:"operation",
                object:"change_action_scheme_fund_group_by_list",
                /*object:"change_action_scheme_fund_group",*/
                field_name:"ACTION_SCHEME_ID"
            },
            load:{
                command:"get",
                object:"action_scheme_fund_group",
                params:{
                    action_id:environment.action_id
                },
                columns:"ACTION_SCHEME_ID,PRICE,STATUS,STATUS_TEXT,FUND_GROUP_NAME,PRICE_GROUP_NAME,BLOCK_COLOR,COLOR",
                field_name:"ACTION_SCHEME_ID"
            }
        };

        var o = {
            command:"get",
            object:"action_scheme_fund_group",
            sid:sid,
            params:{
                action_id:environment.action_id
            }
        };
        var layerO = {
            command:"get",
            object:"action_scheme_layer",
            sid:sid,
            params:{
                action_id:environment.action_id,
                where:"ACTION_ID = "+environment.action_id+" and VISIBLE_ADMIN='TRUE'",
                columns:"ACTION_SCHEME_LAYER_ID",
                order_by:"SORT_NO"
            }
        };
        var objectO = {
            command:"get",
            object:"action_scheme_object",
            sid:sid,
            where_field:"ACTION_SCHEME_LAYER_ID",
            params:{
                action_id:environment.action_id,
                /*columns:"ACTION_SCHEME_OBJECT_ID,OBJECT_TYPE,OBJECT_TYPE,ROTATION,FONT_FAMILY,FONT_SIZE,FONT_STYLE,FONT_WIEGH,COLOR,X,Y,BACKGROUND_URL_SCALE,BACKGROUND_URL_ORIGINAL,BACKGROUND_COLOR",*/
                order_by:"SORT_NO"
            }
        };
        action_fundZones_map.openSocket(socketObject);


        action_fundZones_map.loadSquares(o,function(){
            action_fundZones_map.loadRenderItems({
                layerO:layerO,
                objectO:objectO
            },function(){
                action_fundZones_map.render();
            });



            action_fundZones_map.setLayout(function(){
                    action_fundZones_map.setMinMax(function(){
                        action_fundZones_map.setScaleCoff(function(){
                            action_fundZones_map.render(function(){
                                action_fundZones_map.reLoadLayout(function(){});
                            });

                            action_fundZones_map.setEvents();
                        });

                    });
                });

            loadFundGroups();
            environment.onFocus = function(){
                loadFundGroups();
                action_fundZones_map.reLoad();
                action_fundZones_map.render();
            };
            environment.onClose = function(){
                action_fundZones_map.closeSocket();
            };
        });

        var wrap = $("#"+environment.world+"_"+environment.id+"_wrapper");
        wrap.children("*").each(function(){
            if (this.id!="")
                preventSelection(document.getElementById(this.id));
        });
        action_fundZones_map.sendSelection = function(){
            console.log('sendSelection');
            var fund_group_id = environment.selected_group;
            if (+fund_group_id<=0 && action_fundZones_map.mouseKey==1){
                bootbox.dialog({
                    message: "Пожалуйста, выберите фонд.",
                    title: "Фонд не выбран.",
                    buttons: {
                        ok: {
                            label: "Ок",
                            className: "blue",
                            callback: function() {
                                action_fundZones_map.clearSelection(true);
                                action_fundZones_map.render();
                            }
                        }
                    }
                });
                return;
            }


            if (action_fundZones_map.mouseKey==3) fund_group_id = "";

            var obj = {
                event:"save_and_update",

                save_params:{
                    params:{
                        fund_group_id:fund_group_id
                    },
                    list:action_fundZones_map.selection,
                    portion:500
                },
                load_params:{
                    list:action_fundZones_map.selection,
                    portion:500
                }

            };

            bootbox.dialog({
                message: "Перевод выделеных мест в другой фонд может повлиять на доступность для продажи этих мест.<br>" +
                    "Эта операция будет применена только для свободных на текущий момент мест.<br>" +
                    "Вы уверены, что хотите выполнить перераспределение?",
                title: "<span style='color:#f00;'>Перераспределение.</span>",
                buttons: {
                    ok: {
                        label: "Выполнить перераспределение",
                        className: "red",
                        callback: function() {
                            action_fundZones_map.toSocket(obj);
                            action_fundZones_map.clearSelection();
                        }
                    },
                    cancel: {
                        label: "Отмена",
                        className: "green",
                        callback:function(){
                            action_fundZones_map.clearSelection(true);
                            action_fundZones_map.render();
                        }
                    }
                }
            });



        };
        action_fundZones_map.sendSelectionCallback = function(){
            //loadFundGroups();
        };
        action_fundZones_map.sendSelectionCallbackFull = function(){
            loadFundGroups();
        };



        /*******____________________________________________________________________________________****///



    });


    $("#modal_"+id+"_wrapper").find('input.showOnlyUsed').on('change', function(){
        loadFundGroups();
    });

    uiTabs();
    uiUl();
    inlineEditing();
    $('input[type="checkbox"]').uniform();

    var Modaltitle = '';
    if(environment.title){
        Modaltitle = 'Схема перераспределения для "'+environment.title+'"';
    }else{
        Modaltitle = 'Схема перераспределения';
        console.warn('environment.title не приходит!');
    }

    $('#modal_'+id+'_wrapper .pageHeaderInner h3').html(Modaltitle);

    $('#modal_'+id+'_wrapper #toPricing').on('click', function(){
        MB.Core.switchModal({
            type:"content",
            filename:"action_priceZones",
            params:{
                action_id: environment.action_id,
                label: 'Схема переоценки',
                title: environment.title,
                newerGuid: newerGuid,
                parentGuid:id
            }});

    });

    $('#modal_'+id+'_wrapper #toFunds').on('click', function(){
        MB.Core.switchModal({type:"table",name:"table_fund_group",params:{callback: function(){
            loadFundGroups();
        }}});
    });

    $(document).on('fundClose', function(event, param){
        console.log(param);
        if(param == id){
            $(document).off('modalClose');
        }
    });

}


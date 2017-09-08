


function fundZones_init(id){
    var environment = MB.Content.find(id);
    var fundZones_map;
    var sid = MB.User.sid;
    environment.selected_group = 0;
    var newerGuid = environment.parentGuid || MB.Core.guid();

    environment.select_fund  = {};

    function loadFundZoneById(fund_zone_id){
        if (isNaN(+fund_zone_id) || fund_zone_id == "") return;
        MB.Core.sendQuery({command:"get",object:"hall_scheme_fundzone",sid:sid,params:{where: "fund_zone_id = "+fund_zone_id}},function(data){
            //var obj = xmlToObject(data,"ROW");
            var obj = MB.Core.jsonToObj(data);
            $("#hall_scheme_fundzone").html(obj[0].NAME);
        });
    }

    function loadFundGroups(){
        /// загрузка фондов
        var isUsedOnly = ($("#modal_"+id+"_wrapper").find('input.showOnlyUsed').attr('checked') == 'checked')? "FALSE": "TRUE";
        MB.Core.sendQuery({command:"get",object:"hall_scheme_fund_group",sid:sid,params:{fund_zone_id:environment.fund_zone_id,show_all:isUsedOnly}},function(data){
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
                html += '<li class="one_fund_group" id="one_fund_group'+FUND_GROUP_ID+'">' +
                        '<div class="colorCircle" style="background-color:'+obj[k].COLOR +'" ></div>' +
                        '<div class="info">' +
                        '<a href="#">'+NAME_WITH_STATUS+'</a>'+
                        '<span>'+PLACE_COUNT+' мест</span>' +
                        '</div>'+
                        '</li>';


            }
            $("#TOTAL_PLACE_COUNT").html(data.TOTAL_PLACE_COUNT);
            $("#TOTAL_SELECTED_PLACE_COUNT").html(data.TOTAL_SELECTED_PLACE_COUNT);
            $("#TOTAL_NOT_SELECTED_PLACE_COUNT").html(data.TOTAL_NOT_SELECTED_PLACE_COUNT);
            $("#TOTAL_EXCLUDED_PLACE_COUNT").html(data.TOTAL_EXCLUDED_PLACE_COUNT);


            $("#for_fund_groups").html(html);
            $(".one_fund_group").off('click').on('click', function(){
                if(fundZones_map.shiftState==16){
                    var id = this.id.replace(/[^0-9]/ig,"");

                    bootbox.dialog({
                        message: "Раскрасить все этим фондом?",
                        title: "",
                        buttons: {
                            success: {
                                label: "Да, все места",
                                className: "green",
                                callback: function() {
                                    socketQuery({command:"operation",object:"fill_fund_zone_by_fund_group",params:{
                                        fund_zone_id:environment.fund_zone_id,
                                        fund_group_id:id,
                                        all:1
                                    }},function(){
                                        loadFundGroups();
                                        fundZones_map.reLoad();
                                    });
                                }
                            },
                            free_only: {
                                label: "Только свободные",
                                className: "yellow",
                                callback: function() {
                                    socketQuery({command:"operation",object:"fill_fund_zone_by_fund_group",params:{
                                        fund_zone_id:environment.fund_zone_id,
                                        fund_group_id:id,
                                        all:0
                                    }},function(){
                                        loadFundGroups();
                                        fundZones_map.reLoad();
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
            });
*/
            if (environment.selected_group!=0)
            {
                fundZones_map.shiftState = 0;
                $("#one_fund_group"+environment.selected_group).click();
            }

        });

        uiTabs();
        uiUl();
        $('input[type="checkbox"]').uniform();
    }
    //MB.Core.sendQuery({command:"get",object:"hall_scheme_fundzone",sid:sid,params:{where: "hall_scheme_id = "+environment.hall_scheme_id+" and DEFAULT_FUND_ZONE_ID=1"}},function(data0){
    MB.Core.sendQuery({command:"get",object:"hall_scheme",sid:sid,params:{where: "hall_scheme_id = "+environment.hall_scheme_id}},function(data0){
        //var obj = xmlToObject(data,"ROW");
        var obj = MB.Core.jsonToObj(data0);
        if (+obj[0].FUND_ZONE_ID==0){
            //var html = '<div>Распределение не выбрано</div>';
            var html = '<span style="color:#ff0000;">Выбрать распределение</span>';
        }else{
            //html = '<div>'+obj[0].NAME+'</div>';
            html = obj[0].FUND_ZONE;
            environment.select_fund.selected = obj[0].FUND_ZONE_ID;
            environment.fund_zone_id = obj[0].FUND_ZONE_ID;
            loadFundGroups();
        }

        $("#hall_scheme_fundzone").html(html);
        $(document).on('click', '#hall_scheme_fundzone_btn', function(){
            MB.Core.switchModal({
                type: "form",
                ids: [environment.hall_scheme_id],
                name: "form_hall_scheme_fund_zone",
                params:{
                    tblselectedrow:environment.fund_zone_id,
                    tblcallbacks: {
                        select: {
                            name: "Выбрать",
                            callback: function (id) {
                                MB.Modal.close("form_hall_scheme_fund_zone");
                                environment.fund_zone_id = id;
                                fundZones_map.loadObj.params.fund_zone_id = id;
                                fundZones_map.reLoad();
                                loadFundZoneById(environment.fund_zone_id);
                                loadFundGroups();
                            }
                        }
                    }

                }
            });


        });




        fundZones_map = new Map1({
            container: $("#modal_"+id+"_wrapper #box_for_fundZones_map"),
            mode:"admin"
            /*,
            cWidth:environment.getWidth(),
            cHeight:environment.getHeight()*/
        });


        var socketObject = {
            sid:sid,
            type:"hall_scheme_fundzone_item",
            param:"fund_zone_id",
            id:environment.fund_zone_id,
            portion:30,
            save:{
                command:"operation",
                object:"change_hall_scheme_item_fund_group_by_list",
                field_name:"fund_zone_item_id"
            },
            load:{
                command:"get",
                object:"hall_scheme_fundzone_item",
                params:{
                    fund_zone_id:environment.fund_zone_id
                },
                columns:"FUND_ZONE_ITEM_ID,PRICE,STATUS,STATUS_TEXT,FUND_GROUP_NAME,PRICE_GROUP_NAME,BLOCK_COLOR,COLOR",
                field_name:"fund_zone_item_id"
            }
        };

        var o = {
            command:"get",
            object:"hall_scheme_fundzone_item",
            sid:sid,
            params:{
                fund_zone_id:environment.fund_zone_id
            }
        };
        var layerO = {
            command:"get",
            object:"hall_scheme_layer",
            sid:sid,
            params:{
                where:"HALL_SCHEME_ID = "+environment.hall_scheme_id+" and VISIBLE_ADMIN='TRUE'",
                columns:"HALL_SCHEME_LAYER_ID",
                order_by:"SORT_NO"
            }
        };
        var objectO = {
            command:"get",
            object:"hall_scheme_object",
            sid:sid,
            where_field:"HALL_SCHEME_LAYER_ID",
            params:{

                /*columns:"ACTION_SCHEME_OBJECT_ID,OBJECT_TYPE,OBJECT_TYPE,ROTATION,FONT_FAMILY,FONT_SIZE,FONT_STYLE,FONT_WIEGH,COLOR,X,Y,BACKGROUND_URL_SCALE,BACKGROUND_URL_ORIGINAL,BACKGROUND_COLOR",*/
                order_by:"SORT_NO"
            }
        };
        fundZones_map.openSocket(socketObject);

        fundZones_map.loadSquares(o,function(){
            fundZones_map.loadRenderItems({
                layerO:layerO,
                objectO:objectO
            },function(){
                fundZones_map.render();
            });


                fundZones_map.setLayout(function(){
                    fundZones_map.setMinMax(function(){
                        fundZones_map.setScaleCoff(function(){
                            fundZones_map.render(function(){
                                fundZones_map.reLoadLayout(function(){});
                            });

                            fundZones_map.setEvents();
                        });

                    });
                });

            loadFundGroups();
            environment.onFocus = function(){
                loadFundGroups();
                fundZones_map.reLoad();
                fundZones_map.render();
            };
            environment.onClose = function(){
                log("fundZones_map onClose");
                fundZones_map.closeSocket();
            };
        });

        var wrap = $("#"+environment.world+"_"+environment.id+"_wrapper");
        wrap.children("*").each(function(){
            preventSelection($(this)[0]);
            /*if (this.id!="")
                preventSelection(document.getElementById(this.id));*/
        });
        fundZones_map.sendSelection = function(){
            var fund_group_id = environment.selected_group;
            if (+fund_group_id<=0 && fundZones_map.mouseKey==1){
                bootbox.dialog({
                    message: "Пожалуйста, выберите фонд.",
                    title: "Фонд не выбран.",
                    buttons: {
                        ok: {
                            label: "Ок",
                            className: "blue",
                            callback: function() {
                                fundZones_map.clearSelection(true);
                                fundZones_map.render();
                            }
                        }
                    }
                });
                return;
            }


            if (fundZones_map.mouseKey==3) fund_group_id = "";

            var obj = {
                event:"save_and_update",

                save_params:{
                    params:{
                        fund_group_id:fund_group_id
                    },
                    list:fundZones_map.selection,
                    portion:200
                },
                load_params:{
                    list:fundZones_map.selection,
                    portion:40,
                    params:{
                        fund_zone_id:environment.fund_zone_id
                    }
                }

            };

            /*var obj = {
                command:"operation",
                object:"change_hall_scheme_item_fund_group_by_list",
                sid:sid,
                params:{
                    fund_group_id:fund_group_id
                },
                list:{
                    fund_zone_item_id:fundZones_map.selection
                }
            };*/
            fundZones_map.toSocket(obj);
            fundZones_map.clearSelection();

        };
        fundZones_map.sendSelectionCallback = function(){
            //loadFundGroups();
        };
        fundZones_map.sendSelectionCallbackFull = function(){
            loadFundGroups();
        };
        
        
        
        

        /*fundZones_map.load({
                object:(typeof environment.fund_zone_id!="undefined") ? "hall_scheme_fundzone_item" : "hall_scheme_item",
                params:(typeof environment.fund_zone_id!="undefined") ? {fund_zone_id:environment.fund_zone_id}:{hall_scheme_id :environment.hall_scheme_id},
                reLoadCallback:function(){
                    loadFundGroups();
                },
                loadObjectsParam:{
                    object:"hall_scheme_object",
                    params:{
                        where:"hall_scheme_id ="+ environment.hall_scheme_id
                    }
                }
            },function(){
                if (typeof environment.fund_zone_id!="undefined") loadFundGroups();
                fundZones_map.render();
            }
        );*/

       /* fundZones_map.sendSelection = function(keyBTN){
            if (fundZones_map.selection[0]==undefined) return;
            //if (isNaN(+environment.select_fund.selected)) {
            if (+environment.selected_group<=0 && keyBTN!=0) {

                bootbox.dialog({
                    message: "Пожалуйста, выберите фонд.",
                    title: "Фонд не выбран.",
                    buttons: {
                        ok: {
                            label: "Ок",
                            className: "blue",
                            callback: function() {
                                fundZones_map.clearSelection();
                            }
                        }
                    }
                });

                return;
            }
            var fund_group_id =  (environment.selected_group!=0) ? environment.selected_group : "";
            if (keyBTN==0)
                fund_group_id = "";

            MB.Core.sendQuery({command:"operation",object:"change_hall_scheme_item_fund_group",sid:sid,params:{fund_zone_item_id:fundZones_map.selection.join(","),fund_group_id:fund_group_id}},function(){
                fundZones_map.selection = [];
                fundZones_map.reLoad();
                loadFundGroups();

            });

        };






     *//*   var cWidth = $("#content_box").width();
        var cHeight = $("#content_box").height();*//*
        $("div").each(function(){
            if (this.id!="")
                preventSelection(document.getElementById(this.id));
        });
*/
       /* fundZones_map.box.contextmenu(function(e){
            return false;
        });*/


    });


    var Modaltitle = '';
    if(environment.title){
        Modaltitle = 'Схема распределения для "'+environment.title+'"';
    }else{
        Modaltitle = 'Схема распределения';
        console.warn('environment.title не приходит!');
    }
    $('#modal_'+id+'_wrapper .pageHeaderInner h3').html(Modaltitle);

    $('#modal_'+id+'_wrapper #toPricing').on('click', function(){
        MB.Core.switchModal({type:"content",filename:"priceZones", params:{
            hall_scheme_id: environment.hall_scheme_id,
            label: 'Схема распоясовки',
            title: environment.title,
            newerGuid: newerGuid,
            parentGuid:id
        }});

    });

    $('#modal_'+id+'_wrapper #toFunds').on('click', function(){

        MB.Core.switchModal({type:"table",name:"table_fund_group",sid:MB.User.sid,params:{callback: function(){
            loadFundGroups();
        }}});
    });
    $("#modal_"+id+"_wrapper").find('input.showOnlyUsed').on('change', function(){
        loadFundGroups();
    });

    /// Кнопка очистить
    $("#modal_"+id+"_wrapper").find("#clear_btn").on('click',function(){
        bootbox.dialog({
            message: "Очистить схему?",
            title: "",
            buttons: {
                success: {
                    label: "Да",
                    className: "green",
                    callback: function() {
                        socketQuery({command:"operation",object:"fill_fund_zone_by_fund_group",params:{
                            fund_zone_id:environment.fund_zone_id,
                            fund_group_id:"",
                            all:1
                        }},function(){
                            loadFundGroups();
                            fundZones_map.reLoad();
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
    });



        /*$("#go_to_price").click(function(){
            if (isNaN(+price_zone_id))
                MB.Core.sendQuery({command:"get",object:"hall_scheme",sid:sid,params:{where:"hall_scheme_id = "+environment.hall_scheme_id}},function(data){
                    //var obj = xmlToObject(data,"ROW");
                    var obj = MBOOKER.Fn.jsonToObj(data);
                    price_zone_id = obj[0].PRICE_ZONE_ID;
                    switch_content("priceZones");
                });
            else
                switch_content("priceZones");
        });*/


}

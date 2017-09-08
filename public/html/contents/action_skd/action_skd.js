//MB.Core.switchModal({type:"content",filename:"action_skd",params:{action_id:366, title: 'Actionn title', age_category:6, date_time: '02/11/2014-19:00', hall: 'Светлановский зал'}});
var action_skd_init = function(id){
	var action_skd_map;
    var sid = MB.User.sid;
    var environment = MB.Content.find(id) || {};

    var tickets_stack,action_price_info;
    var interval;
    

    var Modaltitle = '';    
    var refreshSKDHtml = '<div id="refreshSKD" class="btn green newStyle"><i class="fa fa-refresh"></i></div>'

    Modaltitle = 'Сеанс: '+environment.date_time +' "'+ environment.title+'" ('+environment.age_category+')'+' | '+environment.hall;

    $('#clientScreenTitle').html(Modaltitle);
    $('#clientScreenTitle').append(refreshSKDHtml);

    var refreshSKD = $('#refreshSKD');

    refreshSKD.on('click', function(){
        action_skd_map.reLoad();
    });
    
    $('#clientScreen').css('position','inherit');
    $('#clientScreenContent').css('overflow','inherit');

    var w = $(window).width()-30;
    var h = $(window).height()-190;
    var w70 = w -17 - w*3/10;
    $("#clientScreenContent1").height(h);

    action_skd_map = new Map1({
        container: $("#clientScreenContent1"),
        cWidth:w,
        cHeight:h,
        //doc_root: "/multibooker/html/contents/action_skd/",
        /*mode:"iFrame"*/
        mode:"client_screen"
    });


    var squareO = {
        command:"get",
        object:"action_scheme_enter_in_hall", //Какая команда для СКД
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
            where:"ACTION_ID = "+environment.action_id+" and VISIBLE_CASHER='TRUE'",
            columns:"ACTION_SCHEME_LAYER_ID",
            order_by:"SORT_NO",
            action_id:environment.action_id
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
    //action_skd_map.openSocket(socketObject);

    action_skd_map.loadSquares(squareO,function(){
        action_skd_map.loadRenderItems({
            layerO:layerO,
            objectO:objectO
        },function(){
            action_skd_map.render();
        });

        //action_skd_map.loadObjects(o2,function(){
        action_skd_map.setLayout(function(){
            action_skd_map.setMinMax(function(){
                action_skd_map.setScaleCoff(function(){
                    action_skd_map.render(function(){
                        action_skd_map.reLoadLayout(function(){
                            
                        });
                    });

                    action_skd_map.setEvents();
                });

            });
        });
        //});

        uiTabs();
        uiUl();

    });


    interval = window.setInterval(function(){
        action_skd_map.reLoad();
    }, 30000);

    environment.onClose = function(){
        clearInterval(interval);
    };
};

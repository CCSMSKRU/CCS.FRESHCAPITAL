
//var sid = "";



/*________________________________________________________________________________**/

function clientScreen_init(id){
    var one_action_map;
    var sid = MB.User.sid;
    var environment = MB.Content.find(id);

    console.log(id);
    var tickets_stack,action_price_info;
    var interval;


    var Modaltitle = '';
    if(environment.title){
        Modaltitle = environment.title;
    }else{
        Modaltitle = 'Мероприятие';
        console.warn('environment.title не приходит!');
    }

    $('#modal_'+id+'_wrapper .pageHeaderInner h3').html(Modaltitle);

    var w = $("#modal_"+id+"_wrapper").width();
    var h = $("#modal_"+id+"_wrapper").height()-185;
    var w70 = w -17 - w*3/10;

    one_action_map = new Map1({
        container: $("#modal_"+id+"_wrapper #box_for_one_action_map"),
        cWidth:w,
        cHeight:h,
        mode:"casher"
    });
    var socketObject = {
        sid:sid,
        type:"action_scheme",
        param:"action_id",
        id:environment.action_id,
        portion:30,
        save:{
            command:"operation",
            object:"block_place_list",
            field_name:"action_scheme_id"
        },
        load:{
            command:"get",
            object:"action_scheme",
            params:{
                action_id:environment.action_id
            },
            columns:"ACTION_SCHEME_ID,PRICE,STATUS,STATUS_TEXT,FUND_GROUP_NAME,PRICE_GROUP_NAME,BLOCK_COLOR,COLOR",
            field_name:"action_scheme_id"
        }
    };

    var o = {
        command:"get",
        object:"action_scheme",
        sid:sid,
        params:{
            action_id:environment.action_id
        }
    };
    var o2 = {
        command:"get",
        object:"action_scheme_object",
        sid:sid,
        params:{
            where:"ACTION_ID = "+environment.action_id
        }
    };

    var squareO = {
        command:"get",
        object:"action_scheme",
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
            order_by:"SORT_NO"
        }
    };
    var objectO = {
        command:"get",
        object:"action_scheme_object",
        sid:sid,
        where_field:"ACTION_SCHEME_LAYER_ID",
        params:{

            /*columns:"ACTION_SCHEME_OBJECT_ID,OBJECT_TYPE,OBJECT_TYPE,ROTATION,FONT_FAMILY,FONT_SIZE,FONT_STYLE,FONT_WIEGH,COLOR,X,Y,BACKGROUND_URL_SCALE,BACKGROUND_URL_ORIGINAL,BACKGROUND_COLOR",*/
            order_by:"SORT_NO"
        }
    };
    one_action_map.openSocket(socketObject);

    one_action_map.loadSquares(squareO,function(){
        one_action_map.loadRenderItems({
            layerO:layerO,
            objectO:objectO
        },function(){
            one_action_map.render();
        });

        //one_action_map.loadObjects(o2,function(){
        one_action_map.setLayout(function(){
            one_action_map.setMinMax(function(){
                one_action_map.setScaleCoff(function(){
                    one_action_map.render(function(){
                        one_action_map.reLoadLayout(function(){});
                    });

                    one_action_map.setEvents();
                });

            });
        });
        //});

        uiTabs();
        uiUl();

    });

}





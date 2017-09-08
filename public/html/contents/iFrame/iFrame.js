function log(s){
    console.log(s);
}





function iFrame_init(){
    var width = 995;
    var height = 550;
    var href = document.location.href;
    var action_id = 0;
    function error(s){
        var msg = "Ошибка зала";
        if (s!=undefined)
            msg = s;
        $("#box_for_action_web").html(msg);
    }
    if (href.indexOf("?")>0){
        var params = href.replace(/.+\?/ig,'');
        width = (params.match(/width=/)!=null) ? String(params.match(/width=[0-9]+/)).replace(/width=/,'') : 995;
        height = (params.match(/height=/)!=null) ? String(params.match(/height=[0-9]+/)).replace(/height=/,'') : 550;
        action_id = (params.match(/action_id=/)!=null) ? String(params.match(/action_id=[0-9]+/)).replace(/action_id=/,'') : 0;
        if (action_id==0) {
            error("Мероприятие не указано.");
            return;
        }
        action_web = new MapWeb({
            box:"box_for_action_web",
            box2:"box_for_action_web_zoom",
            name:"action_web",
            cWidth:width,
            cHeight:height
        });
        action_web.load({
                command:"get_action_scheme",
                params:{
                    action_id:action_id
                },
                loadObjectsParam:{
                    object:"action_scheme_object",
                    params:{
                        where:"ACTION_ID = "+action_id
                    }
                },
                reLoadCallback:function(){

                }
            },function(){
                $("a.reload").click(function(){
                    action_web.reLoad();

                });
            }
        );
    }else{
        error("Мероприятие не указано.");
        return;
    }

    //var width =
    //$("#box_for_map").
}

$(document).ready(function(){
    iFrame_init();
});

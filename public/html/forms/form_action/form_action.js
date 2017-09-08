(function () {
    var instance = MB.O.forms["form_action"];
    instance.custom = function (callback) {
        // var Tabs = new TabsClass();
        var id = MB.O.forms.form_action.activeId;
        var CustomButtons = {
            create_action_scheme: {
                name: "Создать схему мероприятия",
                id: "createActionScheme",
                style: "blue", 
                disabled:function(){
                    var obj = MB.O.forms.form_action.data;
                    var obj_true = {};
                    var objIndex = {};
                    if(obj!=undefined){
                        for (i in obj['data']){
                            for(var index in obj['names']){
                                if(obj_true[i] == undefined){obj_true[i] = {};}
                                obj_true[i][obj['names'][index]] = obj['data'][i][index];
                            }
                        }
                        if(obj_true[0]['ACTION_SCHEME_CREATED']=="TRUE"){
                            return true;
                        }
                        else {
                            return false;
                        }
                    }
                    //var table = MB.O.tables["table_action"];

                    /*
                    var id = options.$trigger.data("row");
                    var field_num = instance.data.names.indexOf('ACTION_SCHEME_CREATED');
                    var row_num;
                    for (var i in instance.data.data){
                        if (instance.data.data[i][0]==id){
                            row_num = i;
                            break;
                        }
                    }
                    if (row_num==undefined) return true;
                    var is_created = !!(instance.data.data[row_num][field_num]=="TRUE");
                    if (is_created) return true;
                    return false;
                    */
                },
                callback: function (key, options) {

                    var obj = MB.Core.jsonToObj(instance.data);

                    var actionId = instance.activeId;
                    var html = '';
                    html+= '<div class="row">';
                    html+= '<div class="col-md-2">';
                    html+= 'Количество';
                    html+= '</div>';
                    html+= '<div class="col-md-2">';
                    html+= '<input class="form-control field" name="ticket_count" value="" />'; //place_count
                    html+= '</div>';
                    html+= '</div>';
                    html+= '<div class="row">';
                    html+= '<div class="col-md-2">';
                    html+= 'Цена';
                    html+= '</div>';
                    html+= '<div class="col-md-2">';
                    html+= '<input class="form-control field" name="ticket_price" value="" />'; //price
                    html+= '</div>';
                    html+= '</div>';
                    html+= '<div class="row">';
                    html+= '<div class="col-md-2">';
                    html+= 'Зона';
                    html+= '</div>';
                    html+= '<div class="col-md-2">';
                    html+= '<input class="form-control field" name="name" value="" />'; //price
                    html+= '</div>';
                    html+= '</div>';
                    if(obj[0]['HALL_SCHEME_ID'] == ""){
                        var modalObj = {
                            selector: "#portlet-config",
                            title: 'Создать билеты на мероприятие №<b>'+actionId+'</b>',
                            content: html,
                            buttons: {
                                ok1: {
                                    label:"Создать билеты на мероприятие",
                                    color:"green",
                                    dopAttr:"",
                                    callback: function(){
                                        var params = {};
                                        $(modalObj.selector).find("input").each(function(){
                                            params[$(this).attr("name")] = $(this).val();
                                        });
                                        var o = {
                                            command: "operation",
                                            object: "create_action_scheme_without_places", //create_tickets_without_places
                                            sid: MB.User.sid,
                                            params: params
                                        };
                                        o["ACTION_ID"] = actionId;
                                        MB.Core.sendQueryForObj(o,function(res){
                                            if(res.RC==0){
                                                toastr.success(res.MESSAGE, "Ок");
                                                instance.reload("data");
                                                $(modalObj.selector).modal("hide");
                                            }
                                            else {
                                                toastr.error(res.MESSAGE, "");
                                            }
                                        });
                                    }
                                },
                                cancel: {
                                    label:"Закрыть",
                                    color:"default",
                                    dopAttr:'data-dismiss="modal"',
                                    callback: function(){

                                    }
                                }
                            }
                        }
                        MB.Core.ModalMiniContent(modalObj);
                    }
                    else {
                        bootbox.dialog({
                            message:"Подтвердите создание схемы мероприятия.",
                            title:"Создание схемы мероприятия",
                            buttons:{
                                ok:{
                                    label:"Создать схему",
                                    className:"yellow",
                                    callback:function(){
                                        var id = MB.O.forms.form_action.activeId;
                                        MB.Core.sendQuery({command:"operation",object:"create_action_scheme",sid:MB.User.sid,params:{action_id:id}},function(data){
                                            if (data.RC==0){
                                                bootbox.dialog({
                                                    message:"Схема успешно создана",
                                                    title:"Создание схемы мероприятия",
                                                    buttons:{
                                                        ok:{
                                                            label:"Ок",
                                                            className:"green",
                                                            callback:function(){
                                                                instance.reload("data after add");
                                                            }
                                                        }
                                                    }
                                                });
                                            }else{
                                                bootbox.dialog({
                                                    message:data.MESSAGE,
                                                    title:"Ошибка создания схемы мероприятия",
                                                    buttons:{
                                                        ok:{
                                                            label:"Ок",
                                                            className:"red",
                                                            callback:function(){
                                                                instance.reload("data");
                                                            }
                                                        }
                                                    }
                                                });

                                            }
                                            //instance.reload("data");
                                        });

                                    }
                                },
                                cancel:{
                                    label:"Отмена",
                                    className:"blue",
                                    callback:function(){

                                    }
                                }
                            }
                        });
                    }
                    //instance.data
                }
            },
            delete_action_scheme:{
                name: "Удалить схему мероприятия",
                id: "deleteActionScheme", 
                style: "red",
                disabled:function(key, options){
                    var obj = MB.O.forms.form_action.data;
                    var obj_true = {};
                    var objIndex = {};
                    if(obj!=undefined){
                        for (i in obj['data']){
                            for(var index in obj['names']){
                                if(obj_true[i] == undefined){obj_true[i] = {};}
                                obj_true[i][obj['names'][index]] = obj['data'][i][index];
                            }
                        }
                        if(obj_true[0]['ACTION_SCHEME_CREATED']=="TRUE"){
                            return false;
                        }
                        else {
                            return true;
                        }
                    }
                    /*
                    var id = options.$trigger.data("row");
                    var field_num = instance.data.names.indexOf('ACTION_SCHEME_CREATED');
                    var row_num;
                    for (var i in instance.data.data){
                        if (instance.data.data[i][0]==id){
                            row_num = i;
                            break;
                        }
                    }
                    if (row_num==undefined) return true;
                    var is_created = !!(instance.data.data[row_num][field_num]=="TRUE");
                    if (!is_created) return true;
                    return false;
                    */
                },
                callback: function (key, options) {
                    bootbox.dialog({
                        message:"Вы уверены что хотите удалить схему мероприятия?",
                        title:"Предупреждение",
                        buttons:{
                            ok:{
                                label:"Да, уверен",
                                className:"yellow",
                                callback:function(){
                                    var id = MB.O.forms.form_action.activeId;
                                    MB.Core.sendQuery({command:"operation",object:"delete_action_scheme",sid:MB.User.sid,params:{action_id:id}},function(data){
                                        if (data.RC==0){
                                            bootbox.dialog({
                                                message:"Схема мероприятия успешно удалена.",
                                                title:"",
                                                buttons:{
                                                    ok:{
                                                        label:"Ок",
                                                        className:"green",
                                                        callback:function(){
                                                            instance.reload("data");
                                                        }
                                                    }
                                                }
                                            });
                                        }else{
                                            bootbox.dialog({
                                                message:data.MESSAGE,
                                                title:"Ошибка",
                                                buttons:{
                                                    ok:{
                                                        label:"Ок",
                                                        className:"blue",
                                                        callback:function(){
                                                            instance.reload("data");
                                                        }
                                                    }
                                                }
                                            });
                                        }
                                    });

                                }
                            },
                            cancel:{
                                label:"Отменить",
                                className:"blue",
                                callback:function(){

                                }
                            }
                        }
                    });
                }
            },
            goToFundZone:{
                name: "Перейти к перераспределению",
                id: "goToFundZone", 
                style: "blue",
                disabled:function(){
                    var obj = MB.O.forms.form_action.data;
                    var obj_true = {};
                    var objIndex = {};
                    if(obj!=undefined) {
                        for (i in obj['data']){
                            for(var index in obj['names']){
                                if(obj_true[i] == undefined){obj_true[i] = {};}
                                obj_true[i][obj['names'][index]] = obj['data'][i][index];
                            }
                        }
                        if(obj_true[0]['ACTION_SCHEME_CREATED']=="TRUE"){
                            return false;
                        }
                        else {
                            return true;
                        }
                    }
                    
                },
                callback:function(){
                    var action_id = MB.O.forms.form_action.data.data[0][MB.O.forms.form_action.data.names.indexOf("ACTION_ID")];
                    var title = instance.data.data[0][instance.data.names.indexOf('NAME')]+' | '+instance.data.data[0][instance.data.names.indexOf('HALL')];
                    MB.Core.switchModal({type:"content",filename:"action_fundZones",sid:MB.User.sid,params:{action_id:action_id, title: title, label: 'Схема перераспределения'}});
                }
            },
            goToPriceZone:{
                name: "Перейти к переоценке",
                id: "goToPriceZone", 
                style: "blue",
                disabled:function(){
                    log("DISABLED")
                    var obj = MB.O.forms.form_action.data;
                    var obj_true = {};
                    var objIndex = {};
                    if(obj!=undefined) {
                        for (i in obj['data']){
                            for(var index in obj['names']){
                                if(obj_true[i] == undefined){obj_true[i] = {};}
                                obj_true[i][obj['names'][index]] = obj['data'][i][index];
                            }
                        }
                        if(obj_true[0]['ACTION_SCHEME_CREATED']=="TRUE"){
                            return false;
                        }
                        else {
                            return true;
                        }
                    }
                },
                callback:function(){
                    var hall_scheme_id = instance.data.data[0][instance.data.names.indexOf("HALL_SCHEME_ID")];
                    var action_id = MB.O.forms.form_action.data.data[0][MB.O.forms.form_action.data.names.indexOf("ACTION_ID")];
                    var title = instance.data.data[0][instance.data.names.indexOf('NAME')]+' | '+instance.data.data[0][instance.data.names.indexOf('HALL')];
                    MB.Core.switchModal({type:"content",filename:"action_priceZones",sid:MB.User.sid,params:{action_id:action_id, hall_scheme_id:hall_scheme_id, title: title, label: 'Схема переоценки'}});                    
                }
            }
        };
        var actionButtons = new MB.Core.CreateButtonsInForm(instance,CustomButtons,"formAction");

        $(".form-create-button").click(function(){
            actionButtons.trigger(instance);
        });

        // Табы 

        $("#TAB_shows_part").off().on("click", function(){
            var id = MB.O.forms["form_action"].activeId;

            if(!MB.O.tables['tbl_action_part']){
                //$(".form_action-content-wrapper").html("");
            }

            var table = new MB.Table({
                world: "form_action",
                name: "tbl_action_part",
                params: {
                    parent: instance
                    // parentkeyvalue: id,
                    // parentobject: "form_show",
                    // parentobjecttype: "form"
                }
            });
            table.create(function () {});
        });
        
        // Таб Доступ агентов
        $("#TAB_action_agent_access").click(function(){
            var id = MB.O.forms.form_action.activeId;
            var MultiplySelect_user_access = new MultiplySelectClass({
                selector:"#action_agent_access",
                thisId:id,
                subcommandEx:"action_access",
                subcommandAll:"agent_active_lov",
                pKey:"ACTION_ID",
                pKeyEx:"AGENT_ID",
                pKeyAll:"ACTION_ACCESS_ID",
                name: "AGENT_NAME",
                type: "all"
            });
            MultiplySelect_user_access.init(function(){});
        });
        
        callback();
    };
})();
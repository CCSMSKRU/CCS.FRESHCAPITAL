
MB.modalmini = function(obj){
    if(obj.objectname != undefined){
        this.objectname = obj.objectname;
        this.obj   = this.objectname.substr(this.objectname.indexOf("_")+1);
        var objSplit = this.obj.split("-");
        this.objType = objSplit[0];
        this.objName = objSplit[1];
        if(this.objName == undefined){
            this.objName = this.objType;
        }
    } else {log("Не передаете objectname!")}
    if(obj.world != undefined){
        this.world      = obj.world;
    }else {log("Не передаете world!")}
    if(obj.pageswrap != undefined){
        this.pageswrap  = obj.pageswrap;
        log(this.pageswrap)
    }else {log("Не передаете pageswrap!")}
    this.html           = {};
}


MB.modalmini.prototype.init = function(){
    var _this = this;
    this.modalMiniObj = {
        report:{
            casher_report:{
                Name:"Кассовый отчет",
                subcommand:"casher_report"
            },
            k17:{
                Name:"Отчет расхода бланков",
                subcommand:"casher_report_k_17"
            },
            journal_of_operations:{
                Name:"Полный журнал операций",
                subcommand:"casher_journal_of_operations",
            },
            reg_root:{
                Name:"Реестр на передачу корешков билетов",
                subcommand:"register_transfer_of_roots",
            },
            sale_of_tickets_for_action:{
                Name: "Отчет о продаже билетов по мероприятию",
                subcommand:"sale_of_tickets_for_action"
            },
            delivery_note:{
                Name: "Отчет о продаже билетов по мероприятию",
                subcommand:"delivery_note"
            },
            return_note:{
                Name: "Накладная на возврат билетов",
                subcommand:"return_note"
            },
            action_sales_by_agents:{
                Name: "Отчет о продаже билетов уполномочиными",
                subcommand:"action_sales_by_agents"
            },
            raportichka:{
                Name: "Рапортичка",
                subcommand:"raportichka"
            }
        },
        generaterepertuar:{
            generaterepertuar:{
                Name: "Генерация репертуара"
            }
        },
        printer_settings:{
            printer_settings:{
                Name: "Настройки принтера"
            }
        },
        ticketForAction:{
            ticketForAction:{
                Name: "Электронные билеты на мероприятие",
                subcommand:"web_tickets_for_action"
            }
        }

    };
    _this.show();
};

// ------------------
// Формирование HTML
// ------------------

MB.modalmini.prototype.titleHtml = function(){
    var _this = this;
    if(_this.modalMiniObj[_this.objType][_this.objName]!=undefined){
        var titleTex = _this.modalMiniObj[_this.objType][_this.objName]['Name'];
    }
    else {
        var titleTex = "В библеотеке не указанно название";
    }
    var html = '<h4>'+titleTex+'</h4>';
    return html;
};

MB.modalmini.prototype.contentHtml = function(callback){
    var _this = this;
    log("objType");
    log(_this.objType);
    switch(_this.objType){
        case "report":
            $.get( "html/report/report_"+_this.objName+"/modal_"+_this.objName+".html", function( html ) {
                callback(html); 
            }); 
        break; 
        case "generaterepertuar":
            $.get( "html/contents/"+_this.objType+"/"+_this.objType+".html", function( html ) {
                callback(html); 
            }); 
        break; 
        case "ticketForAction":
            $.get( "html/contents/"+_this.objType+"/"+_this.objType+".html", function( html ) {
                callback(html); 
            }); 
        break;
        case "printer_settings":
            $.get( "html/contents/"+_this.objType+"/"+_this.objType+".html", function( html ) {
                callback(html);
            });
        break;
    }
};

MB.modalmini.prototype.show = function(){
    var _this = this;
    _this.contentHtml(function(content){
        var title   = _this.titleHtml();

        var buttonY;
        if(_this.objType == 'printer_settings'){
            buttonY = "Oк";
        }else{
            buttonY = "Сформировать";
        }
        var buttonN = "Закрыть"; 
        ModalContent({selector:"#portlet-config",title:title,content:content,buttonY:buttonY,buttonN:buttonN});
        _this.HandleActions();
    })    
};


function ModalContent(obj){
    var ModalDiv = $(obj.selector);
    var ModalHeader =   ModalDiv.find(".modal-header");
    var ModalBody =     ModalDiv.find(".modal-body");
    var ModalOk =       ModalDiv.find(".OkModal");
    var ModalCancel =   ModalDiv.find(".close_modal");
    ModalHeader.html(obj.title);
    ModalBody.html(obj.content);
    if(obj.buttonY){
        ModalOk.html(obj.buttonY);
    }else{
        ModalOk.attr('data-dismiss','modal');
    }
    ModalCancel.html(obj.buttonN);
    ModalDiv.modal("show");
}



// ------------------
// События
// ------------------

MB.modalmini.prototype.HandleActions = function(){
    var _this = this;
    switch(_this.objName){
        case ("casher_report"):case ("k17"):case ("journal_of_operations"):
            $(".date_inp").datepicker({format:"dd.mm.yyyy"});
            MB.Core.sendQuery({command:"get",object:"user_active",sid:MB.User.sid},function(result){
                var obj = MB.Core.jsonToObj(result);
                var currentUser = result['CURRENT_USER_ID'];
                for (var key in obj){
                    if(currentUser == obj[key]['USER_ID']){
                        $("#cashier_list").append('<option value="'+obj[key]['USER_ID']+'" selected>'+obj[key]['FULLNAME']+'</option>');
                    }
                    else {
                        $("#cashier_list").append('<option value="'+obj[key]['USER_ID']+'">'+obj[key]['FULLNAME']+'</option>');
                    }
                }
                
                $(".OkModal").click(function(){
                    var arr ={};
                    arr['user_id'] = $("#cashier_list").val();
                    arr['from_date'] = $("#from_date").val();
                    arr['to_date'] = $("#to_date").val();
                    arr['payment_type'] = $("[name=cash_visa]:checked").val();
                    _this.goToPrint(arr);
                });
                _this.thisDate();
            });
        break;
        case "reg_root":
            MB.Core.sendQuery({command:"get",object:"action_active",sid:MB.User.sid},function(resultAction){
                MB.Core.sendQuery({command:"get",object:"user_active",sid:MB.User.sid},function(resultUser){
                    var objAction = MB.Core.jsonToObj(resultAction);
                    for (var key in objAction){
                        $("#action_list").append('<option value="'+objAction[key]['ACTION_ID']+'">'+objAction[key]['ACTION_WITH_DATE']+'</option>');
                    }
                    var objUser = MB.Core.jsonToObj(resultUser);
                    var currentUser = resultUser['CURRENT_USER_ID'];
                    for (var key in objUser){
                        if(currentUser == objUser[key]['USER_ID']){
                            $("#cashier_list").append('<option value="'+objUser[key]['USER_ID']+'" selected>'+objUser[key]['FULLNAME']+'</option>');
                        }
                        else {
                            $("#cashier_list").append('<option value="'+objUser[key]['USER_ID']+'">'+objUser[key]['FULLNAME']+'</option>');
                        }
                    }
                    $(".OkModal").click(function(){
                        var arr ={};
                        arr['user_id'] = $("#cashier_list").val();
                        arr['action_id'] = $("#action_list").val();
                        _this.goToPrint(arr);
                        //send_query({command:""})
                    });
                })
            })
        break;
        case "sale_of_tickets_for_action":case "return_note":case "action_sales_by_agents":case "raportichka":
            console.log("CASE");
            MB.Core.sendQuery({command:"get",object:"action_active",sid:MB.User.sid},function(resultAction){
                console.log("CALLBACK");
                var objAction = MB.Core.jsonToObj(resultAction);
                for (var key in objAction){
                    $("#action_list").append('<option value="'+objAction[key]['ACTION_ID']+'">'+objAction[key]['ACTION_WITH_DATE']+'</option>');
                }
            });
            $(".OkModal").click(function(){
                var arr ={};
                arr['action_id'] = $("#action_list").val();
                _this.goToPrint(arr);
                //send_query({command:""})
            });
        break;
        case "delivery_note":
            MB.Core.sendQuery({command:"get",object:"order",sid:MB.User.sid},function(resultAction){
                var objAction = MB.Core.jsonToObj(resultAction);
                for (var key in objAction){
                    $("#action_list").append('<option value="'+objAction[key]['ORDER_ID']+'">'+objAction[key]['ORDER_ID']+'</option>');
                }
            });
            $(".OkModal").click(function(){
                var arr ={};
                arr['order_id'] = $("#action_list").val();
                _this.goToPrint(arr);
                //send_query({command:""})
            });
        break;
        case "generaterepertuar":
            $(".date_input").datepicker({format:"dd.mm.yyyy"});
            $(".time_input").timepicker({showMeridian:false,time_input:true,disableFocus:true,modalBackdrop:true,showInputs:true});

            sid = MB.User.sid;

            MB.Core.sendQuery({command:"get",object:"action",sid:sid}, function(result){var obj = MB.Core.jsonToObj(result);
                var html = "";
                for (i in obj){
                    html+= '<option value="'+obj[i]['ACTION_ID']+'">'+obj[i]['ACTION_WITH_DATE']+'</option>'
                }
                $("#repertoire_select").html(html).select2();

                $("#repertoire_params input[type='checkbox']").uniform();
            });
            $("#week_all").click(function(){
                if($(this).attr("checked")=="checked"){
                    $(".week").find("input").each(function(){
                        $(this).attr("checked",true)
                    })
                }
                else {
                    $(".week").find("input").each(function(){
                        $(this).removeAttr("checked")
                    })
                }
            })
            $(".time_input").live("change",function(){
                if($(this).val()!=""){
                    var parent = $(this).parents(".times");
                    var html = '<div class="col-md-2">';
                    html+= '<input type="text" class="time_input  form-control"/>';
                    html+= '</div>';
                    var check = 1;
                    parent.find("input").each(function(){
                        if($(this).val()=="") {
                            check = 0;
                        }
                    })
                    if(check==1){
                        parent.append(html);
                        $(".time_input").timepicker({showMeridian:false});
                    }
                }
            })
            $(".OkModal").click(function(){
                var okBtn = $(this);
                var params = {};
                $(".week").find("input").each(function(){
                    var key = $(this).attr("id").replace("week_","");
                    if($(this).attr("checked")){var val = "TRUE";}else {var val = "FALSE";}
                    params[key] = val;
                });
                $(".dates").find("input").each(function(){
                    var key = $(this).attr("id").replace("dates_","");
                    var val = $(this).val();
                    params[key] = val;
                });
                var times = "";
                $(".times").find("input").each(function(){
                    if($(this).val()!=""){
                        times+= $(this).val()+",";
                    }
                    
                })
                params['time_list'] = times.substring(0, times.length - 1);
                params['action_id'] = $("#repertoire_select").val();
                MB.Core.sendQuery({command:"operation",object:"generate_repertuar",sid:sid,params:params},function(result){
                    if(result['RC']==0){
                        toastr.success(" "+result.MESSAGE);
                    }
                    else {

                        toastr.error("Ошибка: "+result.MESSAGE);
                    }
                    okBtn.parents('.modal-dialog').find('[data-dismiss="modal"]').click();
                });
            })
        break;
        case "ticketForAction":
            MB.Core.sendQuery({command:"get",object:"action_active",sid:MB.User.sid},function(resultAction){
                var objAction = MB.Core.jsonToObj(resultAction);
                for (var key in objAction){
                    $("#action_listForTicket").append('<option value="'+objAction[key]['ACTION_ID']+'">'+objAction[key]['ACTION_WITH_DATE']+'</option>');
                }
            });
            $(".OkModal").click(function(){
                var arr ={};
                arr['action_id'] = $("#action_listForTicket").val();
                
                var width = MB.Core.getClientWidth();
                var height = MB.Core.getClientHeight()+50;
                var get = "?sid="+MB.User.sid;
                get+= "&action_id="+arr['action_id'];
                var report_page = window.open( "/content/sendmail/ticket_for_action.html"+get,'new','width='+width+',height='+height+',toolbar=1');
                //_this.goToPrint(arr);
                //send_query({command:""})
            });
        break;
        case "printer_settings":
            $(".OkModal").attr('data-dismiss','modal');
        break;
    }


}


MB.modalmini.prototype.goToPrint = function(arr){
    var _this = this;
    var width = MB.Core.getClientWidth();
    var height = MB.Core.getClientHeight()+50;
    var get = "?sid="+MB.User.sid;
    for(key in arr){
        get+= "&"+key+"="+arr[key];
    }
    get+= "&subcommand="+_this.modalMiniObj[_this.objType][_this.objName]['subcommand'];
    //var report_page = window.open('html/contents/report/report_print.html'+get,'new','width='+width+',height='+height+',toolbar=1');
    var report_page = window.open( "html/report/report_"+_this.objName+"/print_"+_this.objName+".html"+get,'new','width='+width+',height='+height+',toolbar=1');

}


MB.modalmini.prototype.thisDate =function(){
    MB.Core.sendQuery({command:"get",object:"sysdate",sid:MB.User.sid},function(res){
        $("#from_date,#to_date").val(res.SYSDATE)
    })
}


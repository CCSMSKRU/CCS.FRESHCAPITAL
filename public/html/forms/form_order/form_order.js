(function () {
	var instance = MB.O.forms["form_order"];
	instance.custom = function (callback) {
/*
		var agentrealizationaccess      = instance.data.data[0][instance.data.names.indexOf("AGENT_REALIZATION_ACCESS")],
			countOnRealizationTickets     = instance.data.data[0][instance.data.names.indexOf("COUNT_REALIZATION_TICKETS")],
			counttorealizationtickets   = instance.data.data[0][instance.data.names.indexOf("COUNT_TO_REALIZATION_TICKETS")],
			countToPaytickets           = instance.data.data[0][instance.data.names.indexOf("COUNT_TO_PAY_TICKETS")],
			countReservedTickets        = instance.data.data[0][instance.data.names.indexOf("COUNT_RESERVED_TICKETS")],
			countClosedTickets          = instance.data.data[0][instance.data.names.indexOf("COUNT_CLOSED_TICKETS")];
			countPaidTickets            = instance.data.data[0][instance.data.names.indexOf("COUNT_PAID_TICKETS")];
		*/


        var availability = undefined;
        var oAvaliable = {
            command: 'operation',
            object: 'check_user_access_to_opeartion',
            params: {
                check_command: 'operation',
                check_object: 'on_realization_order'
            }
        };
        MB.Core.sendQuery(oAvaliable, function(res){
            availability = (res["RESULT"] == "TRUE");

            var agentrealizationaccess              = instance.data.data[0][instance.data.names.indexOf("AGENT_REALIZATION_ACCESS")],
                countReservedTickets                = instance.data.data[0][instance.data.names.indexOf("COUNT_RESERVED_TICKETS")],
                countToPaytickets                   = instance.data.data[0][instance.data.names.indexOf("COUNT_TO_PAY_TICKETS")],
                countPaidTickets                    = instance.data.data[0][instance.data.names.indexOf("COUNT_PAID_TICKETS")],
                countOnRealizationTickets           = instance.data.data[0][instance.data.names.indexOf("COUNT_ON_REALIZATION_TICKETS")],
                countClosedTickets                  = instance.data.data[0][instance.data.names.indexOf("COUNT_CLOSED_TICKETS")],
                countClosedRealizationTicket        = instance.data.data[0][instance.data.names.indexOf("COUNT_CLOSED_REALIZATION_TICK")],
                countOnRealizationNotPrinted        = instance.data.data[0][instance.data.names.indexOf("COUNT_ON_REALIZ_NOTPRINTED")],
                countClosedRealizationNotPrinted    = instance.data.data[0][instance.data.names.indexOf("COUNT_CLOSED_REALIZ_NOTPRINTED")];

            var orderstatus = instance.data.data[0][instance.data.names.indexOf("STATUS")];

            var crmusername = instance.data.data[0][instance.data.names.indexOf("CRM_USER_NAME")],
                crmuserphone = instance.data.data[0][instance.data.names.indexOf("CRM_USER_PHONE")],
                crmuseremail = instance.data.data[0][instance.data.names.indexOf("CRM_USER_EMAIL")],
                customerid = instance.data.data[0][instance.data.names.indexOf("CUSTOMER_ID")];

            instance.lockagentarea = function () {
                instance.$container.find(".agenttab").parent().addClass("disabled");
                instance.$container.find(".agenttab").on("click", function (e) {
                    return false;
                });
            };

            instance.lockpersonarea = function () {
                instance.$container.find(".privatepersontab").parent().removeClass("active");
                instance.$container.find("#privatepersontab").removeClass("active");
                instance.$container.find(".privatepersontab").parent().addClass("disabled");
                instance.$container.find(".privatepersontab").on("click", function (e) {
                    return false;
                });
                instance.$container.find(".agenttab").parent().addClass("active");
                instance.$container.find("#agenttab").addClass("active");
            };

            instance.lockallareas = function () {
                // instance.$container.find(".tab-content .tab-pane.active").removeClass("active");
                // instance.$container.find(".tab-content nav li.active").removeClass("active");
                instance.$container.find(".privatepersontab").parent().addClass("disabled");
                instance.$container.find(".privatepersontab").on("click", function (e) {
                    return false;
                });
                instance.$container.find(".agenttab").parent().addClass("disabled");
                instance.$container.find(".agenttab").on("click", function (e) {
                    return false;
                });
            };


            if (orderstatus === "RESERVED") {
                if (crmusername || crmuserphone || crmuseremail) {
                    instance.lockagentarea();
                } else if (customerid) {
                    instance.lockpersonarea();
                } else {
                    // instance.lockallareas();
                }
            } else {
                instance.lockallareas();
            }

            instance.$container.find(".custombutton").remove();


            $('#RESERVED_TO_DATE_CONTROLLER').datetimepicker({
                autoclose: true,
                format: 'dd-mm-yyyy hh:ii'
            });

            $('#RESERVED_TO_DATE_CONTROLLER').on('change', function(){
                console.log(new Date());
            });

            $('#confirm_reserved_to_date').off('click').on('click', function(){
                var o = {
                    command: 'operation',
                    object: 'set_reserved_date_to_ticket',
                    sid: MB.User.sid,
                    params:{
                        reserv_date: $('#RESERVED_TO_DATE_CONTROLLER').val()+":00",
                        order_id: instance.activeId
                    }
                };

                MB.Core.sendQuery(o, function(ress){
                    toastr[ress.TOAST_TYPE](ress.MESSAGE);
                    instance.reload('data');
                })
            });

            $("[data-returnscolumn=CUSTOMER_ID]").change(function(){
                $("#clientGroupInp").find("input").each(function(){
                    $(this).val("");
                    $(this).addClass("edited");
                });
                $("#clientGroupInp").find(".select2-chosen").html("");
            });
            $("#clientGroupInp").find("input").change(function(){
                $("#agentGroupInp").find(".select2-chosen").html("");
                $("[data-returnscolumn=CUSTOMER_ID]").val("");
                $("[data-returnscolumn=CUSTOMER_ID]").addClass("edited");

                $("#clientGroupInp").find("input").each(function(){
                    $(this).val("");
                    $(this).addClass("edited");
                });
            });

            var html = ''+
            '<span class="input-group-btn">'+
                '<button class="btn blue" type="button"><i class="fa fa-rub"></i></button>'+
            '</span>';

            if($("[data-column=DISCOUNT]").find(".input-group-btn").length==0){
                $("[data-column=DISCOUNT]").append(html);
                $("[data-column=DISCOUNT]").find("button").click(function(){
                    var orderId = instance.activeId;
                    var discount = instance.data.data[0][instance.data.names.indexOf("DISCOUNT")];
                    bootbox.dialog({
                        message:'Вы уверены, что хотите поменять скидку на "Зарезервированные" и "Готовые к оплате" билеты ?<br/><input type="text" class="orderDiscount" value="'+discount+'" size="4" /> ',
                        title:"Изменение скидки по заказу "+orderId+"",
                        buttons:{
                            ok:{
                                label:"Да, уверен",
                                className:"yellow",
                                callback:function(){
                                    MB.Core.sendQuery({command:"operation",object:"change_order_discount",sid:MB.User.sid,params:{ORDER_ID: orderId,DISCOUNT:$(".orderDiscount").val()}},function(data){
                                        if (data.RC==0){
                                            toastr.success("Скидка заказа "+orderId+" успешно изменена!");
                                            instance.reload("data");
                                        }else{
                                            toastr.error(data.MESSAGE);
                                            instance.reload("data");
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
                })

            }

            $("#reject_bso").off('click').on('click', function(){
                var defectTypes = undefined;
                var series = undefined;
                var removeBtnHtml = '<div class="removeRow"><i class="fa fa-times"></i></div>';
                var o = {
                    command: 'get',
                    object: 'order_ticket',
                    params: {
                        where: "ORDER_ID = "+instance.activeId+" and PRINT_STATUS = 'PRINTED'"
                    }
                };

                MB.Core.sendQuery({command:"get",object:"ticket_defect_type",sid:MB.User.sid}, function(result){
                    var obj = MB.Core.jsonToObj(result);
                    defectTypes = obj;


                    MB.Core.sendQuery({command:"get",object:"ticket_pack_series_lov",sid:MB.User.sid}, function(seriesRes){
                        series = MB.Core.jsonToObj(seriesRes);


                        MB.Core.sendQuery(o, function(res){
                            console.log('DATA', res);
                            if(res.DATA.length > 0){}

                                var thHtml = '<div class="row"><div class="col-md-5">Билет</div><div class="col-md-6">Причина брака</div></div>';
                                var thHtml2 = '<div class="row"><div class="col-md-3">Серия</div><div class="col-md-3">Номер</div><div class="col-md-5">Причина брака</div></div>';
                                var musObj = {
                                    seriesOptions: [],
                                    defectTypeOptions:[],
                                    series: [],
                                    isAvaliableAdd: res.DATA.length > 1,
                                    isAvaliableRemove: true
                                };
                                var tpl = '<div class="row posRel marBot5 rejectRow">' +
                                    '<div class="col-md-5">' +
                                    '<div class="form-group">' +
                                    '<select multiple class="bsoSeriesList form-control">{{#seriesOptions}}<option value="{{id}}">{{serial}} - {{number}}</option>{{/seriesOptions}}</select>' +
                                    '</div>'+
                                    '</div>'+
                                    '<div class="col-md-6">' +
                                    '<div class="form-group">' +
                                    '<select class="bsoDefectType form-control">{{#defectTypeOptions}}<option value="{{id}}">{{title}}</option>{{/defectTypeOptions}}</select>' +
                                    '</div>'+
                                    '</div>'+
                                    '</div>';


                                for(var i in res.DATA){
                                    var item = res.DATA[i];
                                    var tmpObj = {
                                        id: item[res.NAMES.indexOf('ORDER_TICKET_ID')],
                                        serial: item[res.NAMES.indexOf('SCA_SERIES')],
                                        number: item[res.NAMES.indexOf('SCA_NUMBER')]
                                    };
                                    musObj.seriesOptions.push(tmpObj);
                                }
                                for(var k in defectTypes){
                                    var kItem = defectTypes[k];
                                    var kTmpObj = {
                                        id: defectTypes[k].TICKET_DEFECT_TYPE_ID,
                                        title: defectTypes[k].TICKET_DEFECT_TYPE
                                    };
                                    musObj.defectTypeOptions.push(kTmpObj);
                                }

                                for(var j in series){
                                    var jItem = series[j];
                                    var jObj = {
                                        id: jItem.SCA_SERIES,
                                        title: jItem.SCA_SERIES
                                    };
                                    musObj.series.push(jObj);
                                }


                                bootbox.dialog({
                                    message: thHtml+Mustache.to_html(tpl, musObj),//(musObj.seriesOptions.length > 0)? thHtml+Mustache.to_html(tpl, musObj) + thHtml2+Mustache.to_html(tpl2, musObj): thHtml2+Mustache.to_html(tpl2, musObj),
                                    title: "Забраковать БСО",
                                    buttons:{
                                        ok:{
                                            label:"Подтвердить",
                                            className:"yellow",
                                            callback:function(){
                                                var sendObj = [];
                                                var iterator = 0;
                                                function sendReject(iterator){
                                                    if(iterator >= sendObj.length){
                                                        return;
                                                    }
                                                    var o = {
                                                        command: 'operation',
                                                        object: 'defect_blank_by_id',
                                                        sid: MB.User.sid,
                                                        params: sendObj[iterator]
                                                    };
                                                    MB.Core.sendQuery(o, function(res){
                                                        if(res){
                                                            toastr[res.TOAST_TYPE](res.MESSAGE, res.TITLE);
                                                            iterator++;
                                                            sendReject(iterator);
                                                        }
                                                    });
                                                }
                                                function validate(str, type){
                                                    var regExp = new RegExp('/^$|\s+');
                                                    return regExp.test(str);
                                                }
                                                for(var i=0; i < $('.rejectRow').length; i++){
                                                    var row = $('.rejectRow').eq(i);
                                                    var series = row.find('.bsoSeriesList').select2('val');
                                                    //var number = row.find('select.bsoSeriesList option:selected').data('number');
                                                    var type = row.find('.bsoDefectType');

                                                    //console.log(series);

                                                    for(var k in series){
                                                        var tmpObj = {
                                                            order_ticket_id: series[k],
                                                            ticket_defect_type_id: type.select2('val')
                                                        };
                                                        sendObj.push(tmpObj);
                                                    }
                                                }
//                                                for(var k=0; k < $('.rejectRow2').length; k++){
//                                                    var kRow = $('.rejectRow2').eq(k);
//                                                    var kSeries = kRow.find('.bsoSeriesList2').select2('val');
//                                                    var kNumber = kRow.find('.bsoNumber').val();
//                                                    var kType = kRow.find('.bsoDefectType2').select2('val');
//
//                                                    var kObj = {
//                                                        sca_series: kSeries,
//                                                        sca_number: kNumber,
//                                                        ticket_defect_type_id: kType
//                                                    };
//
//                                                    if(kObj.sca_series == '-10' || kObj.sca_number == '' || kObj.sca_number == ' '){
//                                                        continue;
//                                                    }
//
//                                                    sendObj.push(kObj);
//                                                }
                                                sendReject(iterator);
                                                instance.reload('data');
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


                                $('.bsoSeriesList').parents('.bootbox.modal').eq(0).removeAttr('tabindex');
                                $('.bsoSeriesList, .bsoDefectType').select2({closeOnSelect: false});
                                $('.bsoSeriesList2, .bsoDefectType2').select2({closeOnSelect: false});

                                function setHandlers(){
                                    $('.rejectRow').removeClass('underline');
                                    $('.rejectRow:last').addClass('underline');
                                    $('.rejectRow .addRow').off('click').on('click', function(){
                                        var container = $(this).parents('.bootbox-body');
                                        var exclude = [];
                                        if(container.find('.rejectRow').length >=  res.DATA.length){
                                            return;
                                        }
                                        // delete selected
                                        for(var i=0; i< $('.rejectRow').length; i ++){
                                            var row = $('.rejectRow').eq(i);
                                            var selectedTickets = row.find('.bsoSeriesList').select2('val');
                                            for(var l in selectedTickets){
                                                exclude.push(selectedTickets[l]);
                                            }
                                        }
                                        console.log(exclude);
                                        container.find('.rejectRow:last').after(Mustache.to_html(tpl,musObj));
                                        $(this).before(removeBtnHtml);
                                        $(this).remove();

                                        $('.bsoSeriesList:last, .bsoDefectType:last').select2();
        //                                populateSelects(function(){
        //                                    setHandlers();
        //                                });
                                        setHandlers();
                                    });
                                    $('.rejectRow .removeRow').off('click').on('click', function(){
                                        var container = $(this).parents('.bootbox-body');
                                        $(this).parents('.row').eq(0).remove();
                                        container.find('.rejectRow:last').find('.addRow').remove();
                                        container.find('.rejectRow:last').append('<div class="addRow"><i class="fa fa-plus"></i></div>');
                                        setHandlers();
                                    });


                                    $('.rejectRow2 .addRow').off('click').on('click', function(){
                                        var container = $(this).parents('.bootbox-body');
                                        container.find('.rejectRow2:last').after(Mustache.to_html(tpl2,musObj));
                                        $(this).before(removeBtnHtml);
                                        $(this).remove();

                                        $('.bsoSeriesList2:last, .bsoDefectType2:last').select2();
                                        setHandlers();
                                    });
                                    $('.rejectRow2 .removeRow').off('click').on('click', function(){
                                        var container = $(this).parents('.bootbox-body');
                                        $(this).parents('.row').eq(0).remove();
                                        container.find('.rejectRow2:last').find('.addRow').remove();
                                        container.find('.rejectRow2:last').append('<div class="addRow"><i class="fa fa-plus"></i></div>');
                                        setHandlers();
                                    });
                                }
                                setHandlers();
                        });
                    });
                });
            });

            var buttons = {
                "payorder":{
                    html: "<button type='button' id='btn_payorder' class='btn blue-stripe custombutton payorder'><i class='fa fa-credit-card'></i> Заказ к оплате </button>",
                    callback:function(){
                        var o = {
                            command: "operation",
                            object: "to_pay_order",
                            sid: MB.User.sid
                        };
                        o["ORDER_ID"] = instance.activeId;
                        sendQueryForObj(o);
                    },
                    disabled: function (key, options) {
                        if (countReservedTickets > 0) {
                            return false;
                        } else {
                            return true;

                        }
                    }
                },
                "cancelorder":{
                    html: "<button type='button' id='btn_cancelorder' class='btn red-stripe custombutton cancelorder'><i class='fa fa-credit-card'></i> Отменить заказ </button>",
                    callback:function(){
                        bootbox.dialog({
                            message: 'Вы уверены?',
                            title: "Отмена заказа",
                            buttons: {
                                ok: {
                                    label: "Да, уверен",
                                    className: "yellow",
                                    callback: function(){
                                        var o = {
                                            command: "operation",
                                            object: "cancel_order",
                                            sid: MB.User.sid
                                        };
                                        o["ORDER_ID"] = instance.activeId;
                                        sendQueryForObj(o);
                                    }
                                },
                                cancel: {
                                    label: "Отменить",
                                    className: "blue",
                                    callback: function(){}
                                }
                            }
                        });
                    },
                    disabled: function (key, options) {
                        if (countReservedTickets > 0 || countToPaytickets > 0) {
                            return false;
                        } else {
                            return true;

                        }
                    }
                },
                "returnorder":{
                    html: "<button type='button' id='btn_returnorder' class='btn red-stripe custombutton returnorder'><i class='fa fa-credit-card'></i> Вернуть заказ </button>",
                    callback:function(){
                        var tbl_order_ticket_instance = MB.O.tables[instance.profile.general.childobject];
                        var order_id = tbl_order_ticket_instance.data.data[0][tbl_order_ticket_instance.data.names.indexOf("ORDER_ID")];
                        var o = {
                            command: "operation",
                            object: "return_order",
                            sid: MB.User.sid
                        };
                        o["ORDER_ID"] = order_id;
                        sendQueryForObj(o);
                    },
                    disabled: function (key, options) {
                        if (countClosedTickets > 0 || countOnRealizationTickets > 0  || countClosedRealizationTicket > 0) {
                            return false;
                        } else {
                            return true;
                        }
                    }
                },
                "printorder":{
                    html: "<button type='button' id='btn_printorder' class='btn green-stripe custombutton printorder'><i class='fa fa-credit-card'></i> Распечатать заказ </button>",
                    callback:function(){
                        send('print_order',{guid:MB.Core.getUserGuid(),order_id:instance.activeId},function(result){
                            instance.reload('data');
                        });
                    },
                    disabled: function (key, options) {
                        if (countPaidTickets > 0 || countToPaytickets > 0 || countOnRealizationNotPrinted > 0 || countClosedRealizationNotPrinted > 0) {
                            return false;
                        } else {
                            return true;
                        }
                    }
                },
                "printorderEMUL":{
                    html: "<button type='button' id='btn_printorder' class='btn green-stripe custombutton printorder'><i class='fa fa-credit-card'></i> Эмуляция печати </button>",
                    callback:function(){
                        var o = {
                         command: "operation",
                         object: "print_order_without_printing",
                         sid: MB.User.sid
                         };
                         o["ORDER_ID"] = instance.activeId;
                         sendQueryForObj(o,function(){
                             instance.reload('data');
                         });
                    },
                    disabled: function (key, options) {
                        if (countPaidTickets > 0 || countToPaytickets > 0 || countOnRealizationNotPrinted > 0 || countClosedRealizationNotPrinted > 0) {
                            return false;
                        } else {
                            return true;
                        }
                    }
                },
                "realizationorder":{
                    html: "<button type='button' id='btn_realizationorder' class='btn purple-stripe custombutton realizationorder'><i class='fa fa-credit-card'></i> Выдать по квоте </button>",
                    callback:function(){
                        var o = {
                            command: "operation",
                            object: "on_realization_order",
                            sid: MB.User.sid
                        };
                        o["ORDER_ID"] = instance.activeId;
                        sendQueryForObj(o);
                    },
                    disabled: function (key, options) {
                        return !(agentrealizationaccess.bool() && countToPaytickets > 0 && availability);
                    }
                },
                "realizationorderprint":{
                    html: "<button type='button' id='btn_realizationorderprint' class='btn purple-stripe custombutton realizationorderprint'><i class='fa fa-credit-card'></i> Выдать по квоте и распечатать </button>",
                    callback:function(){
                        var o = {
                            command: "operation",
                            object: "on_realization_print_order",
                            sid: MB.User.sid
                        };
                        o["ORDER_ID"] = instance.activeId;
                        sendQueryForObj(o);
                    },
                    disabled: function (key, options) {
                        return !(agentrealizationaccess.bool()  && orderstatus === "TO_PAY" && availability);
                    }
                },
                "closerealizationorder":{
                    html: "<button type='button' id='btn_closerealizationorder' class='btn purple-stripe custombutton closerealizationorder'><i class='fa fa-credit-card'></i> Закрыть квоту </button>",
                    callback:function(){
                        var o = {
                            command: "operation",
                            object: "close_realization_order",
                            sid: MB.User.sid
                        };
                        o["ORDER_ID"] = instance.activeId;
                        sendQueryForObj(o);
                    },
                    disabled: function (key, options) {
                        if (agentrealizationaccess.bool() && countOnRealizationTickets > 0) {
                            return false;
                        } else {
                            return true;
                        }
                    }
                },
                "deliverynoteorder":{
                    html: "<button type='button' id='btn_deliverynoteorder' class='btn purple-stripe custombutton deliverynoteorder'><i class='fa fa-credit-card'></i> Накладная на выдачу</button>",
                    callback:function(){
                            var width = MB.Core.getClientWidth();
                            var height = MB.Core.getClientHeight()+50;
                            var get = "?sid="+MB.User.sid+"&ORDER_ID="+instance.activeId;
                            get+= "&subcommand=delivery_note2";
                            //var report_page = window.open('html/contents/report/report_print.html'+get,'new','width='+width+',height='+height+',toolbar=1');
                            var report_page = window.open( "html/report/print_report.html"+get,'new','width='+width+',height='+height+',toolbar=1');
                   },
                   disabled: function(){
                       return function(){
                           var tbl_order_ticket_instance = MB.O.tables[instance.profile.general.childobject];
                           var isNotAvaliable = true;
                           var name = tbl_order_ticket_instance.data.names.indexOf("STATUS");
                           for(var i in tbl_order_ticket_instance.data.data){
                               var item = tbl_order_ticket_instance.data.data[i];
                               if(item[name] == 'ON_REALIZATION'){
                                   isNotAvaliable = false;
                               }
                           }
                           return isNotAvaliable;
                       }();
                   }
                },
                "returndeliverynoteorder":{
                    html: "<button type='button' id='btn_returndeliverynoteorder' class='btn purple-stripe custombutton returndeliverynoteorder'><i class='fa fa-credit-card'></i> Накладная на возврат квоты</button>",
                    callback:function(){
                        var width = MB.Core.getClientWidth();
                        var height = MB.Core.getClientHeight()+50;
                        var get = "?sid="+MB.User.sid+"&ORDER_ID="+instance.activeId;
                        get+= "&subcommand=return_delivery_note";
                        var report_page = window.open("html/report/print_report.html"+get,'new','width='+width+',height='+height+',toolbar=1');
                    },
                    disabled: function(){
                        return function(){
                            var tbl_order_ticket_instance = MB.O.tables[instance.profile.general.childobject];
                            var isNotAvaliable = true;
                            var name = tbl_order_ticket_instance.data.names.indexOf("STATUS");
                            for(var i in tbl_order_ticket_instance.data.data){
                                var item = tbl_order_ticket_instance.data.data[i];
                                if(item[name] == 'RETURNED_REALIZATION'){
                                    isNotAvaliable = false;
                                }
                            }
                            return isNotAvaliable;
                        }();
                    }
                },
                "resendEmail":{
                    html: "<button type='button' id='btn_resendEmail' class='btn purple-stripe custombutton resendEmail'><i class='fa fa-credit-card'></i> Отправить эл. билет</button>",
                    callback:function(){
                        MB.Core.sendQuery({
                            command: 'operation',
                            object: 'resend_tickets_for_customer',
                            sid: MB.User.sid,
                            order_id: instance.activeId
                        }, function(res){
                            //console.log(res);
                        });
                    },
                    disabled: function(){
                        return function(){
                            var tbl_order_ticket_instance = MB.O.tables[instance.profile.general.childobject];
                            var isNotAvaliable = true;
                            var name = tbl_order_ticket_instance.data.names.indexOf("STATUS");
                            for(var i in tbl_order_ticket_instance.data.data){
                                var item = tbl_order_ticket_instance.data.data[i];
                                if(item[name] == 'PAID'){
                                    isNotAvaliable = false;
                                }
                            }
                            return isNotAvaliable;
                        }();
                    }
                }
                // $("#modal_form_order_wrapper").find(".actions").append('<div class="btn default save_button deliveriNote">Накладная</div>');
                // $(".deliveriNote").click(function(){
                //     var width = MBOOKER.Fn.getClientWidth();
                //     var height = MBOOKER.Fn.getClientHeight()+50;
                //     var get = "?sid="+MB.User.sid+"&ORDER_ID="+instance.activeId;
                //     get+= "&subcommand=delivery_note";
                //     //var report_page = window.open('html/contents/report/report_print.html'+get,'new','width='+width+',height='+height+',toolbar=1');
                //     var report_page = window.open( "html/report/report_delivery_note/print_delivery_note.html"+get,'new','width='+width+',height='+height+',toolbar=1');
                // })
            };

            var html = '';
            for(var key in buttons){
                instance.$container.find(".order-buttons").append(buttons[key].html);
                if(buttons[key].disabled()){
                    instance.$container.find(".order-buttons").find("."+key).attr("disabled",true);
                }
            }
            instance.$container.find(".order-buttons").on("click",function(e){
                var buttonName = e.target.id.replace("btn_","");
                var buttonObj = buttons[buttonName];
                buttonObj.callback();
            });

            function sendQueryForObj(o){
                MB.Core.sendQuery(o, function (res) {
                    if (parseInt(res.RC) === 0) {
                        toastr.success(res.MESSAGE, "Ок");
                        instance.reload("data");
                    }
                    else {
                        toastr.error(res.MESSAGE, "");
                    }
                });
            }

            $(".form_order-content-wrapper").html("");
            var table = new MB.Table({
                world: "form_order",
                name: "tbl_order_ticket",
                params: {
                    parent: instance
                    // parentkeyvalue: instance.activeId,
                    // parentobject: instance.name,
                    // parentobjecttype: "form"
                }
            });
            table.create(function () {
                var orderId = instance.activeId;
                var OrderPayment = new MB.OrderPaymentClass({orderId:orderId,table:"no"});
                html = OrderPayment.renderOrderPaymentTypeForm(instance.data);
                $(".order_payment").html(html);
                var updaView = OrderPayment.updateView();
                updaView.all(instance.data);
                OrderPayment.handlerOrderAmount(instance.data);
                // var html = MB.Core.renderOrderPaymentType(instance.data);


            });

            instance.$container.find("a[href='#orderhistory']").off().on("click", function (e) {
                $(".form_order_2-content-wrapper").html("");
                log(instance)
                var table = new MB.Table({
                    world: "form_order_2",
                    name: "tbl_order_history_log",
                    params: {
                        parent: instance
                        // parentkeyvalue: instance.activeId,
                        // parentobject: instance.name,
                        // parentobjecttype: "form"
                    }
                });
                table.create(function () {});



                // var orderhistorytable = new MB.Form({
                //     name: "tbl_order_history_log",
                //     world: "form_order_2",
                //     params: {

                //     }
                // });
                // orderhistorytable.create();
            });

            $('#cScreen_order').on('click', function(){
                function initAfisha(){
                    toClientscreen({
                        type: 'preorder',
                        order: instance.data.data[0][instance.data.names.indexOf("ORDER_ID")]
                    });
                    if(MB.Core.cSreenWindow){
                        MB.Core.cSreenWindow.window.onbeforeunload = function(){
                            MB.Core.cSreenWindow = undefined
                        }
                    }
                }
                if(MB.Core.cSreenWindow == undefined){
                    MB.Core.cSreenWindow = window.open(MB.Core.doc_root+"clientscreenview");
                    MB.Core.cSreenWindow.window.onload = function(){
                        window.setTimeout(function(){
                            initAfisha();
                        }, 300);
                    }
                }else{
                    initAfisha();
                }
            });

            callback();
            console.log((function(){var d = new Date(); return 'END' + d + d.getMilliseconds()}()))
        });
	};
})();
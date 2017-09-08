(function () {
    var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);
    var formInstance = tableInstance.parentObject;
    var totalOrderAmount = formInstance.data.data[0]["TOTAL_ORDER_AMOUNT"];
    // SET_TO_PAY - Готов к оплате
    // SET_CLOSED - Продан
    // SET_CANCELED - Отменен
    // SET_RETURNED - Возвращен

    function disableFullPurchaseBtn(){
        var res = 0;
        var totalAmount = 0;

        for(var i in tableInstance.data.data){
            var s = tableInstance.data.data[i];
            if(s.STATUS == 'RESERVED' || s.STATUS == 'TO_PAY'){
                res ++;
                totalAmount += parseFloat(s.PRICE);
            }
        }

        if(res > 0){
            tableInstance.parentObject.container.find('.pay-reserved-services').removeClass('disabled');
        }else{
            tableInstance.parentObject.container.find('.pay-reserved-services').addClass('disabled');
        }

        tableInstance.parentObject.container.find('.reserved-services-total-amount').html(totalAmount + ' руб.');
        tableInstance.parentObject.container.find('.total-order-amount-with-services').html('ИТОГО Билеты + Услуги: <b>' + parseFloat(parseFloat(totalAmount) + parseFloat(totalOrderAmount)) + '</b> руб.');

        formInstance.recountTotalTablesValues();

    }

    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option1',
            title: 'Оплатить услугу',
            disabled: function () {
                var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];
                return  row['STATUS'] != 'RESERVED' && row['STATUS'] != 'TO_PAY';
            },
            callback: function () {
                var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];

                var o = {
                    command: 'operation',
                    object: 'set_order_additional_service_status',
                    params: {
                        order_additional_service_id: row['ORDER_ADDITIONAL_SERVICE_ID'],
                        event: 'SET_CLOSED'
                    }
                };

                socketQuery(o, function(res){
                    var jRes = JSON.parse(res)['results'][0];

                    toastr[jRes.toastr.type](jRes.toastr.message);

                    tableInstance.reload(function(){
                        disableFullPurchaseBtn();
                    });
                });
            }
        },
        {
            name: 'option2',
            title: 'Отменить услугу',
            disabled: function () {
                var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];
                return  row['STATUS'] != 'RESERVED';
            },
            callback: function () {
                var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];

                var o = {
                    command: 'operation',
                    object: 'set_order_additional_service_status',
                    params: {
                        order_additional_service_id: row['ORDER_ADDITIONAL_SERVICE_ID'],
                        event: 'SET_CANCELED'
                    }
                };

                socketQuery(o, function(res){
                    var jRes = JSON.parse(res)['results'][0];
                    tableInstance.reload(function(){
                        disableFullPurchaseBtn();
                    });
                });
            }
        },
        {
            name: 'option3',
            title: 'Вернуть услугу',
            disabled: function () {
                var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];
                return row['STATUS'] != 'CLOSED' && row['STATUS'] != 'PAID';
            },
            callback: function () {
                var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];

                var o = {
                    command: 'operation',
                    object: 'set_order_additional_service_status',
                    params: {
                        order_additional_service_id: row['ORDER_ADDITIONAL_SERVICE_ID'],
                        event: 'SET_RETURNED'
                    }
                };

                socketQuery(o, function (res) {
                    var jRes = JSON.parse(res)['results'][0];
                    tableInstance.reload(function () {
                        disableFullPurchaseBtn();
                    });
                });
            }
        },
        {
            name: 'option4',
            title: 'Распечатать',
            disabled: function () {
                var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];
                return  row['STATUS'] != 'CLOSED' && row['STATUS'] != 'PAID';
            },
            callback: function () {
                var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];
                var ticket_id = row['ORDER_ADDITIONAL_SERVICE_ID'];
                var o = {
                    command: 'operation',
                    object: 'gererate_pdf_for_order_additional_service',
                    params: {
                        order_additional_service_id: ticket_id
                    }
                };

                var timeOut = toastr.options.timeOut;
                var extendedTimeOut = toastr.options.extendedTimeOut;
                toastr.options.timeOut = 1000000;
                toastr.options.extendedTimeOut = 100;
                var info = toastr.info('Идет процесс формирования билета...');
                toastr.options.timeOut = timeOut;
                toastr.options.extendedTimeOut = extendedTimeOut;

                socketQuery(o, function(res){
                    var jRes = JSON.parse(res)['results'][0];
                    info.fadeOut(600);
                    if (+jRes.code) {
                        return toastr[jRes.toastr.type](jRes.toastr.message);
                    }
                    var filename = jRes.filename;
                    var id = 'need_be_removed'+ticket_id;
                    //$("body").prepend('<a style="display:none;" target="_blank" id="'+ id +'" href="'+ connectHost +'/' + filename +'" download></a>');
                    $("body").prepend('<a style="display:none;" target="_blank" id="'+ id +'" href="'+ connectHost +'/' + filename +'"></a>');
                    var btn = $('#'+id);
                    btn.on("click",function (e) {
                        $(this).remove();
                    });
                    btn[0].click();
                    toastr.success('Готово');
                });
            }
        }
    ];
}());

(function(){
    var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);
    var formInstance = tableInstance.parentObject;
    var order_id = formInstance.activeId;
    var template = '<div class="nb btn btnDouble blue flright printAllServices" style="float: right; width:230px;">' +
        '<i class="fa fa-print"></i>' +
        '<div class="btnDoubleInner">Напечатать сертификаты</div>' +
        '</div>';
    var container = tableInstance.ct_instance.container;
    container.prepend(template);
    var btn = container.find('.printAllServices');

    btn.off('click').on('click', function () {
        var o = {
            command: 'operation',
            object: 'gererate_pdf_for_order_additional_service',
            params: {
                order_id: order_id
            }
        };

        var timeOut = toastr.options.timeOut;
        var extendedTimeOut = toastr.options.extendedTimeOut;

        toastr.options.timeOut = 1000000;
        toastr.options.extendedTimeOut = 100;
        var info = toastr.info('Идет процесс формирования билета...');
        toastr.options.timeOut = timeOut;
        toastr.options.extendedTimeOut = extendedTimeOut;

        socketQuery(o, function(res){
            var jRes = JSON.parse(res)['results'][0];
            info.fadeOut(600);
            if (+jRes.code) {
                return toastr[jRes.toastr.type](jRes.toastr.message);
            }
            var filename = jRes.filename;
            var id = 'need_be_removed'+order_id;
            //$("body").prepend('<a style="display:none;" target="_blank" id="'+ id +'" href="'+ connectHost +'/' + filename +'" download></a>');
            $("body").prepend('<a style="display:none;" target="_blank" id="'+ id +'" href="'+ connectHost +'/' + filename +'"></a>');
            var btn = $('#'+id);
            btn.on("click",function (e) {
                $(this).remove();
            });
            btn[0].click();
            toastr.success('Готово');
        });
    });



})();
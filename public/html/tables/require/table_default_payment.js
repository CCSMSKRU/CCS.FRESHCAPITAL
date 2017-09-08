(function () {

    var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);


    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option1',
            title: 'Открыть календарь',
            disabled: function(){
                return false;
            },
            callback: function(){

                var row = tableInstance.ct_instance.selectedRowIndex;

                var calendarFormId = MB.Core.guid();
                var calendar_id = tableInstance.data.data[row].calendar_id;


                var openInModalO = {
                    id: calendarFormId,
                    name: 'form_merchant_financing_calendar',
                    class: 'merchant_financing_calendar',
                    client_object: 'form_merchant_financing_calendar',
                    type: 'form',
                    ids: [calendar_id],
                    position: 'center',
                    tablePKeys: {data_columns: ['id'], data: [calendar_id]}
                };

                var form = new MB.FormN(openInModalO);
                form.create(function () {
                    var modal = MB.Core.modalWindows.windows.getWindow(calendarFormId);
                });

            }
        },
        {
            name: 'option2',
            title: 'Оплатить пропущенный платеж',
            disabled: function(){
                var row = tableInstance.ct_instance.selectedRowIndex;
                return (tableInstance.data.data[row].status_sysname != 'DEFAULT' && tableInstance.data.data[row].status_sysname != 'PARTIAL_PAID');
            },
            callback: function(){



                var html = '<div class="row">' +
                    '<div class="col-md-12">' +
                    '<div class="form-group">' +
                    '<label>Укажите дату зачисления платежа (будьте внимательны):</label>' +
                    '<input type="text" id="payment-date-input" class="form-control" value="" />' +
                    '<label>Укажите сумму (не обязательно):</label>' +
                    '<input type="text" id="payment-amount-input" class="form-control" value="" />' +
                    '</div>' +
                    '</div>' +
                    '</div>';

                bootbox.dialog({
                    title: 'Внимание!',
                    message: html,
                    buttons: {
                        success: {
                            label: 'Подтвердить',
                            callback: function(){
                                MB.loader(true, 'Секундочку, закрываем этот платеж');

                                var p_date = $('#payment-date-input').val();
                                var p_amount = $('#payment-amount-input').val();

                                var row = tableInstance.ct_instance.selectedRowIndex;
                                var p_id = tableInstance.data.data[row].id;

                                var o = {
                                    command: 'makePayment',
                                    object: 'merchant_financing_payment',
                                    client_object: 'tbl_merchant_financing_payment',
                                    params: {
                                        id: p_id,
                                        payment_date: p_date,
                                        paid_amount: p_amount
                                    }
                                };


                                socketQuery(o, function(res2){

                                    if(!res2.code){
                                        tableInstance.reload();
                                        MB.loader(false, 'Секундочку, закрываем этот платеж');
                                    }
                                    MB.loader(false, 'Секундочку, закрываем этот платеж');
                                });

                            }
                        },
                        error: {
                            label: 'Отмена',
                            callback: function(){
                                MB.loader(false, 'Секундочку, закрываем этот платеж');
                            }
                        }
                    }
                });

                $('#payment-date-input').datepicker({
                    language: 'ru',
                    format: 'dd.mm.yyyy',
                    autoclose: true,
                    todayBtn: 'linked'
                });
            }
        },
        {
            name: 'option3',
            title: 'Перенести в конец',
            disabled: function(){
                var row = tableInstance.ct_instance.selectedRowIndex;
                return tableInstance.data.data[row].status_sysname != 'DEFAULT';
            },
            callback: function(){

                var html = '<div class="row">' +
                    '<div class="col-md-12">' +
                    '<h3>Переносим платеж в конец, Вы уверены?</h3>' +
                    '</div>' +
                    '</div>';

                bootbox.dialog({
                    title: 'Внимание!',
                    message: html,
                    buttons: {
                        success: {
                            label: 'Подтвердить',
                            callback: function(){

                                MB.loader(true, 'Секундочку, переносим этот платеж');
                                //var p_date = $('#payment-date-input').val();

                                var row = tableInstance.ct_instance.selectedRowIndex;
                                var p_id = tableInstance.data.data[row].id;

                                var o = {
                                    command: 'pushDefaultPayment',
                                    object: 'merchant_financing_payment',
                                    client_object: 'tbl_merchant_financing_payment',
                                    params: {
                                        id: p_id
                                        //payment_date: p_date
                                    }
                                };


                                socketQuery(o, function(res2){

                                    if(!res2.code){
                                        tableInstance.reload();
                                        MB.loader(false, 'Секундочку, закрываем этот платеж');
                                    }
                                    MB.loader(false, 'Секундочку, закрываем этот платеж');
                                });

                            }
                        },
                        error: {
                            label: 'Отмена',
                            callback: function(){
                                MB.loader(false, 'Секундочку, закрываем этот платеж');
                            }
                        }
                    }
                });

                //$('#payment-date-input').datepicker({
                //    language: 'ru',
                //    format: 'dd.mm.yyyy',
                //    autoclose: true,
                //    todayBtn: 'linked'
                //});
            }
        }

    ];

}());

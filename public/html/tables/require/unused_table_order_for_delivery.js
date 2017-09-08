(function () {

    var tableNId = $('.page-content-wrapper .classicTableWrap').data('id');
    var tableInstance = MB.Tables.getTable(tableNId);

    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option1',
            title: 'Открыть в форме', // a,a
            disabled: function () {
                return false;
            },
            callback: function () {
                tableInstance.openRowInModal();

            }
        },
        {

            //NO_DELIVERY^

            // NEED_DELIVERY^
            // WAIT_DELIVERY^
            // IN_DELIVERY^
            // CLOSED_DELIVERY^
            // FAILED_DELIVERY

            name: 'option2',
            title: 'Требуется доставка', // a,a
            disabled: function () {
                var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];
                console.log(row['DELIVERY_STATUS']);
                return row['DELIVERY_STATUS'] != 'NEED_DELIVERY' && row['DELIVERY_STATUS'] != 'FAILED_DELIVERY';
            },
            callback: function () {
                tableInstance.makeOperation('set_delivery_status_wait_delivery', function(res){

                });
            }
        },
        {
            name: 'option3',
            title: 'Выдать курьеру',
            disabled: function () {
                var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];
                return row['DELIVERY_STATUS'] != 'WAIT_DELIVERY';
            },
            callback: function () {
                var tpl = '<label>Выберите курьера:</label><div id="select-delivery-man" class="fn-control fn-select3-wrapper"></div>';
                var delManSelInstance = undefined;
                var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];
                if(row['DELIVERY_MAN'].length == 0){
                    bootbox.dialog({
                        title: 'Выдать заказ курьеру',
                        message: tpl,
                        buttons:{
                            success: {
                                label: 'Выдать',
                                callback: function(){
                                    var delMan = (delManSelInstance.value.id == '' || delManSelInstance.value.id == 'empty' || delManSelInstance.value.id == '-10')? false: delManSelInstance.value.id;
                                    if(delMan !== false){
                                        var o = {
                                            command: 'modify',
                                            object: 'order',
                                            params: {
                                                delivery_man_id: delMan,
                                                order_id: tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex]['ORDER_ID']
                                            }
                                        };
                                        socketQuery(o, function(res){
                                            res = JSON.parse(res)['results'][0];
                                            if(res.code == 0){
                                                tableInstance.makeOperation('set_delivery_status_in_delivery', function(res){

                                                });
                                            }else{
                                                toastr[res.toastr.type](res.toastr.message);
                                            }
                                        });

                                    }else{
                                        toastr['info']('Выберите курьера');
                                        return false;
                                    }
                                }
                            },
                            error: {
                                label: 'Отмена',
                                callback: function(){

                                }
                            }
                        }
                    });
                }else{
                    tableInstance.makeOperation('set_delivery_status_in_delivery', function(res){

                    });
                }

                var delManSelId = MB.Core.guid();
                delManSelInstance = MB.Core.select3.init({
                    id: delManSelId,
                    wrapper: $('#select-delivery-man'),
                    getString: 'DELIVERY_MAN',
                    column_name: 'DELIVERY_MAN_ID',
                    view_name: '',
                    value: {
                        id: '-10',
                        name: 'Выберите курьера'
                    },
                    data: [],
                    fromServerIdString: 'DELIVERY_MAN_ID',
                    fromServerNameString: 'DELIVERY_MAN_NAME',
                    searchKeyword: 'DELIVERY_MAN_NAME',
                    withEmptyValue: false,
                    isSearch: true
                });
            }
        },
        {
            name: 'option4',
            title: 'Доставлено успешно',
            disabled: function () {
                var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];
                return row['DELIVERY_STATUS'] != 'IN_DELIVERY';
            },
            callback: function () {
                tableInstance.makeOperation('set_delivery_status_closed_delivery', function(res){

                });
            }
        },
        {
            name: 'option5',
            title: 'Доставлено НЕуспешно',
            disabled: function () {
                var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];
                return row['DELIVERY_STATUS'] != 'IN_DELIVERY';
            },
            callback: function () {
                var tpl = '<label>Выберите что сделать с заказом:</label>';
                bootbox.dialog({
                    title: 'Неуспешная доставка',
                    message: tpl,
                    buttons:{
                        another_day: {
                            label: 'Перенести доставку',
                            className: 'bb-wide-btn',
                            callback: function(){
                                var newDeliveryDate = '<label>Новая дата доставки:</label><input id="newDeliveryDate" type="text" class="fn-control fn-datepicker-wrapper "/>';
                                bootbox.dialog({
                                    title: 'Перенос даты доставки',
                                    message: newDeliveryDate,
                                    buttons:{
                                        success: {
                                            label: 'Подтвердить',
                                            callback: function(){

                                                var delDate = ($('#newDeliveryDate').val() == '')? false : $('#newDeliveryDate').val() + ' 00:00:00';
                                                if(delDate !== false){
                                                    var o = {
                                                        command: 'modify',
                                                        object: 'order',
                                                        params: {
                                                            delivery_man_id: '',
                                                            delivery_date: delDate,
                                                            order_id: tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex]['ORDER_ID']
                                                        }
                                                    };
                                                    socketQuery(o, function(res){
                                                        res = JSON.parse(res)['results'][0];
                                                        if(res.code == 0){
                                                            tableInstance.makeOperation('set_delivery_status_wait_delivery', function(res){

                                                            });
                                                        }
                                                    });
                                                }else{
                                                    toastr['info']('Выберите новую дату доставки');
                                                    return false;
                                                }
                                            }
                                        },
                                        error: {
                                            label: 'Отмена',
                                            callback: function(){

                                            }
                                        }
                                    }
                                });

                                $('#newDeliveryDate').datepicker2({
                                    format: "dd.mm.yyyy",
                                    weekStart: 1
                                });
                            }
                        },
                        stayFailed: {
                            label: 'Отменить заказ и выставить статус "Неуспешная доставка"',
                            className: 'bb-wide-btn',
                            callback: function(){
                                tableInstance.makeOperation('set_delivery_status_failed_delivery', function(res){

                                });
                            }
                        },
                        error: {
                            label: 'Отмена',
                            className: 'bb-wide-btn',
                            callback: function(){

                            }
                        }

                    }
                });
            }
        }
    ];
}());

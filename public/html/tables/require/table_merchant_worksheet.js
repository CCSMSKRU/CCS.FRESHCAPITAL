(function () {

    var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);


    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option1',
            title: 'Открыть в форме',
            disabled: function(){
                return false;
            },
            callback: function(){
                tableInstance.openRowInModal();
            }
        },
        {
            name: 'option2',
            title: 'Отправить предложение',
            disabled: function(){
                return false;
            },
            callback: function(){

                var data = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];


                var req_html =  '<div class="row"><div class="col-md-12">Вы собираетесь отправить предложение:</div>' +
                    '<div class="col-md-12">Под следующие ставки:<br/></div>' +
                    '<div class="col-md-12"><ul class="classic-ul">' +
                    '<li>Сумма фондирования:   <b>' + data.founding_amount + '</b>   руб.</li>' +
                    '<li>Сумма возврата:   <b>' +     data.amount_to_return + '</b>   руб.</li>' +
                    '<li>Кол-во платежей:   <b>' +    data.payments_count + '</b></li>' +
                    '<li>Сумма платежа:   <b>' +      data.payment_amount + '</b>   руб.</li>' +
                    '<li>Ставка факторинга:   <b>' +  data.factoring_rate + '</b>  %</li>' +
                    '</ul></div></div>';

                bootbox.dialog({
                    title: 'Первичное предложение',
                    message: req_html,
                    buttons: {
                        success: {
                            label: 'Отправить запрос',
                            callback: function(){

                                var o = {
                                    command: 'sendOffer',
                                    object: tableInstance.class,
                                    client_object: tableInstance.client_object,
                                    params: {
                                        id: data.id
                                    }
                                };

                                socketQuery(o, function(res){
                                    tableInstance.reload();
                                });
                            }
                        },
                        success_without_sending: {
                            label: 'Пропустить этот шаг',
                            callback: function(){

                                var o = {
                                    command: 'sendOffer',
                                    object: tableInstance.class,
                                    client_object: tableInstance.client_object,
                                    params: {
                                        id: data.id,
                                        without_sending:true
                                    }
                                };

                                socketQuery(o, function(res){
                                    tableInstance.reload();
                                });
                            }
                        },
                        error: {
                            label: 'Отмена',
                            callback: function(){

                            }
                        }
                    }
                });
            }
        }
    ];

}());

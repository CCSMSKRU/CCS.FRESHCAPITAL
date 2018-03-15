(function () {

    var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);

    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option1',
            title: 'Открыть в форме',
            disabled: function () {
                return false;
            },
            callback: function () {

                var row = tableInstance.ct_instance.selectedRowIndex;

                var financingFormId = MB.Core.guid();

                var financing_id = tableInstance.data.data[row].id;

	            var work_statuses = ['SETTING_UP_EQUIPMENT', 'ACQUIRING_IN_PROCCESS', 'READY_TO_WORK', 'CLOSED', 'WAIT_BANK_CONFIRM', 'BANK_CONFIRM'];
	            console.error(tableInstance.data.data[row]);
	            var form_name = (work_statuses.indexOf(tableInstance.data.data[row].status_sysname) == -1 ) ?
		            (tableInstance.data.data[row].financing_request_type_sysname == 'POS' ? 'form_merchant_financing_equipment' : 'form_merchant_financing') :
		            (tableInstance.data.data[row].financing_request_type_sysname == 'POS' ? 'form_merchant_financing_equipment_work_2' : 'form_merchant_financing_work_2');


                var openInModalO = {
                    id: financingFormId,
                    name: form_name,
                    class: 'merchant_financing',
                    client_object: form_name,
                    type: 'form',
                    ids: [financing_id],
                    position: 'center',
                    tablePKeys: {data_columns: ['id'], data: [financing_id]}
                };

                var form = new MB.FormN(openInModalO);
                form.create(function () {
                    var modal = MB.Core.modalWindows.windows.getWindow(financingFormId);
                });

            }
        },
        {
            name: 'option2',
            title: 'Изменить тип на "ПРОЦЕНТНЫЙ"',
            disabled: function () {
                return false;
            },
            callback: function () {

                var row = tableInstance.ct_instance.selectedRowIndex;
                var financing_id = tableInstance.data.data[row].id;


                var tpl = '<div class="form-group">' +
                    'Данная операция изменит тип финансирования на процентный.<br/>Укажите максимальный процент списания в день.' +
                    '<div class="form-group">' +
                    '<label>Процент списания:</label>' +
                    '<input type="number" id="day_percent" value="" class="form-control"/>' +
                    '<label>До какой даты созданы платежные дни (например 01.01.2017) (если до сегодня/вчера, то можно не указывть).:</label>' +
                    '<input type="text" id="oper_date" value="" class="form-control"/>' +
                    '</div>';

                bootbox.dialog({
                    title: 'Внимание! Перевод финансирования на процентный тип.',
                    message: tpl,
                    buttons: {
                        success: {
                            label: 'Перевести',
                            callback: function(){

                                var day_percent = $('#day_percent').val();
                                var oper_date = $('#oper_date').val();

                                var o = {
                                    command:'changeToPercent',
                                    object:'merchant_financing',
                                    params:{
                                        id:financing_id,
                                        day_percent: day_percent,
                                        operation_date:oper_date
                                    }
                                };

                                tableInstance.parentObject.loader(true, 'Подождите, переводим финансирование в процентный тип, это может занять до нескольких минут.');

                                socketQuery(o, function (err, res) {
                                    console.log(err, res);

                                    tableInstance.parentObject.reload();

                                    tableInstance.parentObject.loader(false, 'Подождите, переводим финансирование в процентный тип, это может занять до нескольких минут.');


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
        },
        {
            name: 'option3',
            title: 'Скачать сертификат',
            disabled: function () {
                return false;
            },
            callback: function () {

                var row = tableInstance.ct_instance.selectedRowIndex;
                var financing_id = tableInstance.data.data[row].id;

                var o = {
                    command:'get',
                    object: 'investor',
                    class: 'investor',
                    params:{

                    }
                };

                socketQuery(o, function(res){
                    console.log(res);

                    var tpl = '<select id="sel-invetor">{{#inv}}<option value="{{id}}">{{name}}</option>{{/inv}}</select>';
                    var mO = {
                        inv: []
                    };

                    for(var i in res.data){
                        var inv = res.data[i];
                        mO.inv.push({
                            id: inv.id,
                            name: inv.name
                        });
                    }

                    var req_html = '<div class="inv-select-holder">'+Mustache.to_html(tpl, mO)+'</div>';

                    bootbox.dialog({
                        title: 'Выберите инвестора',
                        message: req_html,
                        buttons: {
                            success: {
                                label: 'Подтверждаю',
                                callback: function(){

                                    var investor_id = $(".inv-select-holder .select3-output").attr('data-id');

                                    var g = {
                                        command: 'get',
                                        object: 'investment_plan_merchant_investor',
                                        class: 'investment_plan_merchant_investor',
                                        params: {
                                            param_where: {
                                                merchant_financing_id: financing_id,
                                                investor_id: investor_id
                                            }
                                        }
                                    };

                                    socketQuery(g, function(res){

                                        if(Object.keys(res.data).length > 0 && res.data[0].amount > 0){

                                            var commited = res.data[0].commited_date;

                                            var o2 = {
                                                command:'certificate',
                                                object:'investor',
                                                params:{
                                                    id: investor_id,
                                                    report_date: commited
                                                }
                                            };


                                            socketQuery(o2, function(res){

                                                if(!res.code){
                                                    var fileName = res.path + res.filename;
                                                    var linkName = 'my_download_link' + MB.Core.guid();

                                                    var nameRu = res.name_ru || res.filename;

                                                    $("body").prepend('<a id="'+linkName+'" href="' + res.path + res.filename +'" download="'+ nameRu +'" style="display:none;"></a>');
                                                    var jqElem = $('#'+linkName);
                                                    jqElem[0].click();
                                                    jqElem.remove();


                                                }

                                            });

                                        }else{
                                            toastr['info']('Выбраный инвестор не участвует в финансировании данного торговца.');
                                            return false;
                                        }




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


                    $('#sel-invetor').select3();

                });

            }
        }
    ];

}());


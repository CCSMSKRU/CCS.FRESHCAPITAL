(function () {

    var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);

    var parentForm = tableInstance.parentObject;

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

                var work_statuses = ['ACQUIRING_IN_PROCCESS', 'READY_TO_WORK','CLOSED', 'WAIT_BANK_CONFIRM','BANK_CONFIRM'];
                var form_name = (parentForm.data.data[0].financing_type_sysname == 'PERCENT')? 'form_merchant_financing_calendar_percent' : 'form_merchant_financing_calendar';


                var openInModalO = {
                    id: financingFormId,
                    name: form_name,
                    class: 'merchant_financing_calendar',
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
            title: 'Переформировать календарь. ОПАСНО',
            disabled: function () {
                return false;
            },
            callback: function () {

                var row = tableInstance.ct_instance.selectedRowIndex;
                var calendar_id = tableInstance.data.data[row].id;


                var tpl = '<div class="form-group">' +
                            '<label>Выберите тип календаря: ' +
                            '<span class="cal_type_ex">gov</span> - производственный, ' +
                            '<span class="cal_type_ex">five_two</span> - пять / два, ' +
                            '<span class="cal_type_ex">seven</span> - без перерывов</label>' +
                            '<input type="text" id="cal_type" value="" class="form-control"/>' +
                            '</div>' +
                    '<div class="form-group">' +
                    '<label>Данная операция внесет серьезные изменения в текущий календарь, введите слово <b>"ПОДТВЕРЖДАЮ"</b> для продолжения операции.</label>' +
                    '<input type="text" id="confrimation" value="" class="form-control"/>' +
                    '</div>';

                bootbox.dialog({
                    title: 'Внимание!',
                    message: tpl,
                    buttons: {
                        success: {
                            label: 'Выполнить',
                            callback: function(){


                                if($('#confrimation').val() == "ПОДТВЕРЖДАЮ"){

                                    if($('#cal_type').val() == "gov" || $('#cal_type').val() == "five_two" || $('#cal_type').val() == "seven"){

                                        var o = {
                                            command:'reCreateCalendar',
                                            object:'merchant_financing_calendar',
                                            params:{
                                                calendar_id:calendar_id,
                                                calendar_type: $('#cal_type').val()
                                            }
                                        };

                                        socketQuery(o, function (err, res) {
                                            console.log(err, res);
                                        });

                                    }else{
                                        toastr['info']('Некорректо заполнен тип календаря, допустимые значения: gov, five_two, seven');
                                        return false;
                                    }

                                }else{
                                    toastr['info']('Некорректо заполнено контрольное поле');
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



            }
        }
    ];

}());





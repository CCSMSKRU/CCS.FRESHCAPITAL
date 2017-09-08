(function () {

    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_investor', formID);
    var formWrapper = $('#mw-' + formInstance.id);

    var modalInstance = MB.Core.modalWindows.windows.getWindow(formID);
    modalInstance.stick = 'top';
    modalInstance.stickModal();


    formInstance.lowerButtons = [
        {
            title: 'Внести средства на счет',
            color: "blue",
            icon: "fa-money",
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: [],
                matching: [],
                colValues: []
            }],
            handler: function () {
                var data = formInstance.data.data[0];
                var today = moment(new Date()).format('DD.MM.YYYY');
                // var html = '<label>Укажите сумму:</label><input class="form-control" id="inc-founds-amount" type="number" />';
                var html = '<div class="form-group"><label>Дата внесения средств:</label><input class="form-control" id="inc-founds-date" type="text" value="'+today+'" /></div>'+
                    '<div class="form-group"><label>Укажите сумму:</label><input class="form-control" id="inc-founds-amount" type="number" /></div>';

                bootbox.dialog({
                    title: "Внесение средств на счет инвестора",
                    message: html,
                    buttons: {
                        success: {
                            label: 'Подтвердить',
                            callback: function(){

                                var o = {
                                    command: 'toDefaultDeposit',
                                    object: 'investor',
                                    params: {
                                        id: formInstance.activeId,
                                        amount: $('#inc-founds-amount').val(),
                                        operation_date: $('#inc-founds-date').val()
                                    }
                                };

                                socketQuery(o, function(r){

                                    if(r.code) {return}

                                    formInstance.reload();

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
            title: 'Вывести средства со счета',
            color: "blue",
            icon: "fa-arrow-circle-o-up",
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: [],
                matching: [],
                colValues: []
            }],
            handler: function () {
                var data = formInstance.data.data[0];

                var today = moment(new Date()).format('DD.MM.YYYY');

                var html = '<div class="form-group"><label>Дата вывода средств:</label><input class="form-control" id="rem-founds-date" type="text" value="'+today+'" /></div>'+
                           '<div class="form-group"><label>Укажите сумму:</label><input class="form-control" id="rem-founds-amount" type="number" /></div>'+
                           '<div class="form-group"><label>Комментарий:</label><input class="form-control" id="rem-founds-comment" type="text" /></div>';

                bootbox.dialog({
                    title: "Вывод средств со счета инвестора",
                    message: html,
                    buttons: {
                        success: {
                            label: 'Подтвердить',
                            callback: function(){

                                var o = {
                                    command: 'withdrowlDefaultDeposit',
                                    object: 'investor',
                                    params: {
                                        id: formInstance.activeId,
                                        amount: $('#rem-founds-amount').val(),
                                        operation_date: $('#rem-founds-date').val(),
                                        purpose: $('#rem-founds-comment').val()
                                    }
                                };

                                socketQuery(o, function(r){

                                    if(r.code) {return}

                                    formInstance.reload();

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

                $('#rem-founds-date').datepicker({
                    language: 'ru',
                    format: 'dd.mm.yyyy',
                    autoclose: true,
                    todayBtn: 'linked'
                });
            }
        }

    ];


    var fi = {

        default_account: undefined,

        init: function(){

            fi.getDefaultAccount(function(){

                fi.populateAccountTables(function(){

                });

            });

        },

        getDefaultAccount: function(cb){

            var o = {
                command: 'getDefault',
                object: 'investor_account',
                params: {
                    investor_id: formInstance.activeId
                }
            };

            socketQuery(o, function(r){

                if(r.code){return;}

                fi.default_account = r;

                if(typeof cb == 'function'){
                    cb();
                }

            });

        },

        populateAccountTables: function(){

            console.log(fi.default_account);


            // Выводим операции счета

            var childTbl = new MB.TableN({
                id: MB.Core.guid(),
                class: 'investor_account_operation',
                client_object: 'tbl_investor_account_operation',
                parentObject: formInstance,
                parent_id: fi.default_account.account.id
            });


            childTbl.create(formWrapper.find('.tbl-account-operation-holder'), function () {
                console.log('new table rendered');
            });

            // Выводим хистори лог счета

            var childTbl2 = new MB.TableN({
                id: MB.Core.guid(),
                class: 'investor_account_history_log',
                client_object: 'tbl_investor_account_history_log',
                parentObject: formInstance,
                parent_id: fi.default_account.account.id
            });


            childTbl2.create(formWrapper.find('.tbl-account-history-log-holder'), function () {
                console.log('new table rendered');
            });


        }

    };

    fi.init();

}());

(function () {

    var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);
    var parentForm = tableInstance.parentObject;

    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option1',
            title: 'Внести на счет',
            disabled: function(){
                return false;
            },
            callback: function(){

                var row = tableInstance.ct_instance.selectedRowIndex;
                var id = tableInstance.data.data[row].id;

                var html = '<label>Укажите сумму:</label><input class="form-control" id="inc-founds-amount-2" type="number" />';

                bootbox.dialog({
                    title: "Внесение средств на счет инвестора",
                    message: html,
                    buttons: {
                        success: {
                            label: 'Подтвердить',
                            callback: function(){

                                var o = {
                                    command: 'toDeposit',
                                    object: 'investor_account',
                                    params: {
                                        id: id,
                                        amount: $('#inc-founds-amount-2').val()
                                    }
                                };

                                socketQuery(o, function(r){

                                    if(r.code) {return}

                                    parentForm.reload();

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





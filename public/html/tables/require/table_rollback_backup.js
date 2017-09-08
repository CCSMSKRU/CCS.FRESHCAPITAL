(function () {

    var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);


    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option3',
            title: 'Откатить изменния',
            disabled: function(){
                return false;
            },
            callback: function(){

                var row = tableInstance.ct_instance.selectedRowIndex;

                bootbox.dialog({
                    title: 'Вы уверены?',
                    message: 'Откатить изменения?<br>',
                    buttons: {
                        confirm: {
                            label: 'Да, подтверждаю',
                            callback: function(){
                                var row = tableInstance.ct_instance.selectedRowIndex;
                                var id = tableInstance.data.data[row].id;
                                var o = {
                                    command: 'rollback',
                                    object: 'rollback_backup',
                                    params: {id: id}
                                };

                                socketQuery(o, function (res) {
                                    console.log(res);
                                });
                            }
                        },
                        cancel: {
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

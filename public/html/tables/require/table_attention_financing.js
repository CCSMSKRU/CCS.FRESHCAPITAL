(function () {

    var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);


    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option3',
            title: 'Снять с "карандаша"',
            disabled: function(){
                return false;
            },
            callback: function(){

                var row = tableInstance.ct_instance.selectedRowIndex;

                bootbox.dialog({
                    title: 'Вы уверены?',
                    message: 'Снять с "карандаша"',
                    buttons: {
                        confirm: {
                            label: 'Снять',
                            callback: function(){
                                var row = tableInstance.ct_instance.selectedRowIndex;
                                var id = tableInstance.data.data[row].id;
                                var o = {
                                    command: 'onAttentionCancel',
                                    object: 'merchant_financing',
                                    params: {id: id}
                                };

                                socketQuery(o, function (res) {
                                    tableInstance.reload();
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

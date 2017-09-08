(function () {

    var tableNId = $('.page-content-wrapper .classicTableWrap').data('id');
    var tableInstance = MB.Tables.getTable(tableNId);


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
            title: 'Подтвердить регистрацию',
            disabled: function(){
                return false;
            },
            callback: function(){
                var column_name = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex]['column_name'];
                var column_class = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex]['name'];
                var column_co = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex]['client_object'];
                var row_id = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex]['id'];
                var max = tableInstance.data.extra_data.count_all;

                var o = {
                    command: 'confirmUser',
                    object: 'User',
                    params: {
                        id: row_id
                    }
                };

                socketQuery(o, function (res) {
                    toastr[res.toastr.type](res.toastr.message);
                    tableInstance.reload();
                });

            }
        }
    ];

}());

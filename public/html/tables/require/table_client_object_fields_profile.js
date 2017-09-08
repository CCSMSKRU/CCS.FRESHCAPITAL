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
            title: 'Установить позицию колонки',
            disabled: function(){
                return false;
            },
            callback: function(){
                var column_name = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex]['column_name'];
                var column_class = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex]['class'];
                var column_co = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex]['client_object'];
                var max = tableInstance.data.extra_data.count_all;

                bootbox.dialog({
                    title: 'Укажите позицию колонки',
                    message: '<input type="number" class="form-control" id="new_column_position" min="1" value=""/>',
                    buttons: {
                        success: {
                            label: 'Подтвердить',
                            callback: function(){
                                var val = $('#new_column_position').val();
                                if(val != '' && +val >= 1){
                                    var o = {
                                        command: 'setColumnPosition',
                                        object: column_class,
                                        client_object: column_co,
                                        params: {
                                            column: column_name,
                                            position: val
                                        }
                                    };
                                    if(column_co){
                                        o.client_object = column_co;
                                    }
                                    socketQuery(o, function(res){
                                        console.log(res);
                                        tableInstance.reload();
                                    });

                                }else{
                                    toastr['info']('Укажите корректную позицию');
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


                setTimeout(function(){
                    $('#new_column_position').focus();
                },  500);

                console.log('pos',$('#new_column_position'));


            }
        }
    ];

}());

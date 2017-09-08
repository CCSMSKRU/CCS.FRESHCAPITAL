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
            title: 'Синхронизировать с классом',
            disabled: function(){
                return false;
            },
            callback: function(){
                var column_name = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex]['column_name'];
                var column_class = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex]['name'];
                var column_co = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex]['client_object'];

                var class_id = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex]['class_id'];
                var co_id = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex]['id'];

                var max = tableInstance.data.extra_data.count_all;

                var o = {
                    command: 'syncFieldsProfile',
                    object: 'Client_object_profile',
                    params: {
                        class_id:class_id,
                        client_object_id:co_id
                    }
                };

                bootbox.dialog({
                    title: 'Синхронизация с классом',
                    message:
                    '<label class="row-label"><input type="checkbox" id="sync_fields_checkbox" > Синхранизировать поля</label>' +
                    '<input type="text" class="row-label form-control" id="sync_fields_list" value="*">' +
                    '<label class="row-label"><input type="checkbox" id="remove_fields" > Удалять поля</label>' +
                    '<label style="padding-left: 40px;" class="row-label"><input type="checkbox" id="remove_fields_physical" checked> Удалять физически</label>',
                    buttons:{
                        success: {
                            label: 'Синхранизировать',
                            callback: function(){
                                var sync_fields_checkbox =      $('#sync_fields_checkbox')[0].checked;
                                var remove_fields =             $('#remove_fields')[0].checked;
                                var remove_fields_physical =    $('#remove_fields_physical')[0].checked;
                                var sync_fields_list =          $('#sync_fields_list').val();

                                if(sync_fields_checkbox && sync_fields_list.length > 0){
                                    o.params.sync_fields = sync_fields_list;
                                }

                                if(remove_fields){
                                    o.params.remove_fields = remove_fields;
                                    o.params.remove_fields_physical = remove_fields_physical;
                                }

                                socketQuery(o, function (res) {
                                    toastr[res.toastr.type](res.toastr.message);
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
        },
        {
            name: 'option3',
            title: 'Синхронизировать с классом (обновить класс)',
            disabled: function(){
                return false;
            },
            callback: function(){
                var column_name = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex]['column_name'];
                var column_class = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex]['name'];
                var column_co = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex]['client_object'];

                var class_id = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex]['class_id'];
                var co_id = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex]['id'];

                var max = tableInstance.data.extra_data.count_all;

                var o = {
                    command: 'syncFieldsProfileToClass',
                    object: 'Client_object_profile',
                    params: {
                        class_id:class_id,
                        client_object_id:co_id
                    }
                };

                bootbox.dialog({
                    title: 'Синхронизация с классом (обновить класс)',
                    message:
                    '<label class="row-label">Синхранизировать поля</label>' +
                    '<input type="text" class="row-label form-control" id="sync_fields_list" value="*">',
                    buttons:{
                        success: {
                            label: 'Синхранизировать',
                            callback: function(){
                                var sync_fields_list =          $('#sync_fields_list').val();
                                o.params.sync_fields = sync_fields_list;

                                socketQuery(o, function (res) {
                                    toastr[res.toastr.type](res.toastr.message);
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

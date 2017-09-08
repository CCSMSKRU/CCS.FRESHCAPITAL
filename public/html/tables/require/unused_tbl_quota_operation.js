(function () {
    var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);
    var formInstance = tableInstance.parentObject;
    var formWrapper = $('#mw-'+formInstance.id);

    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option0',
            title: 'Скачать файл',
            disabled: function(){
                return false;
            },
            callback: function(){
                var sel = tableInstance.ct_instance.selectedRowIndex;
                var id = tableInstance.data.data[sel]['QUOTA_OPERATION_ID'];

                var o = {
                    /*output_format: "xml",*/
                    command: "get",
                    object: "export_quota_operation",
                    sid: MB.User.sid,
                    params: {
                        quota_operation_id: id
                    }
                };
                getFile({o: o, fileName: 'order_'+formInstance.activeId});

            }
        },
        {
            name: 'option01',
            title: 'Скачать в формате xml для Concert.ru',
            disabled: function(){
                return false;
            },
            callback: function(){
                var sel = tableInstance.ct_instance.selectedRowIndex;
                var id = tableInstance.data.data[sel]['QUOTA_OPERATION_ID'];

                var o = {
                    //output_format: "xml",
                    command: "get",
                    object: "export_quota_operation",
                    sid: MB.User.sid,
                    params: {
                        quota_operation_id: id,
                        export_format:'CONCERT'
                    }
                };
                getFile({o: o, fileName: 'order_'+formInstance.activeId});

            }
        },
        {
            name: 'option6',
            title: 'Скачать XML для SKIDATA',
            disabled: function(){
                return false;
            },
            callback: function(){
                var sel = tableInstance.ct_instance.selectedRowIndex;
                var id = tableInstance.data.data[sel]['QUOTA_OPERATION_ID'];

                var o = {
                    /*output_format: "xml",*/
                    command: "get",
                    object: "export_quota_operation_skidata",
                    sid: MB.User.sid,
                    params: {
                        quota_operation_id: id
                    }
                };
                getFile({o: o, fileName: 'SKIDATA_QUOTA_'+id});

            }
        },
        {
            name: 'option5',
            title: 'Отправить выданную квоту агенту по почте',
            disabled: function(){
                var c = tableInstance.ct_instance.isDisabledCtx({
                    col_names: ['QUOTA_OPERATION_TYPE'],
                    matching: ['equal'],
                    col_values: ['ISSUE_QUOTA']
                });

                return !~c.indexOf(true);
            },
            callback: function(){
                var sel = tableInstance.ct_instance.getIndexesByData(true);
                var rowid = tableInstance.data.data[sel]['QUOTA_OPERATION_ID'];

                var o = {
                    command: 'operation',
                    object: 'send_quota_operation_to_email',
                    params: {
                        quota_operation_id: rowid
                    }
                };
                socketQuery(o, function(res){
                    socketParse(res);
                });
            }
        },
        {
            name: 'option1',
            title: 'Посмотреть места по операции',
            disabled: function(){
                return false;
            },
            callback: function(){
                tableInstance.openRowInModal();
            }
        },
        {
            name: 'option2',
            title: 'Применить операцию',
            disabled: function(){
                var c = tableInstance.ct_instance.isDisabledCtx({
                    col_names: ['STATUS'],
                    matching: ['equal'],
                    col_values: ['LOADED']
                });

                return !~c.indexOf(true);
            },
            callback: function(){
                tableInstance.makeOperation('apply_quota_operation', function(){
                    formInstance.reload();
                });
            }
        },
        {
            name: 'option3',
            title: 'Распечатать накладную',
            disabled: function(){

            },
            callback: function(){
                var sel = tableInstance.ct_instance.getIndexesByData(true);
                var rowid = tableInstance.data.data[sel]['QUOTA_OPERATION_ID'];

                var name = 'report_quota_delivery_note';
                var subcommand = '?sid='+MB.User.sid+'&object='+name+'&QUOTA_OPERATION_ID='+rowid ;
                var excelObj = {
                    sid: MB.User.sid,
                    object: name,
                    QUOTA_OPERATION_ID: rowid
                };

                bootbox.dialog({
                    title: 'Выберите действие',
                    message: 'Распечатать накладную или сохранить Excel?',
                    buttons: {
                        justReport: {
                            label: 'Распечатать накладную',
                            callback: function(){
                                var urlString = '<iframe class="iFrameForPrint" src="html/report/print_report.html' + subcommand + '" width="" height"" align"left"></iframe>';
                                $("body").append(urlString);
                            }
                        },
                        excelReport: {
                            label: 'Сохранить Excel',
                            callback: function(){
                                socketQuery({
                                    command: "get",
                                    object: name,
                                    xls: true,
                                    params: excelObj
                                }, function(res) {
                                    res = socketParse(res, false);
                                    window.open("data:application/vnd.ms-excel," + "﻿" + encodeURIComponent(res["data"]), "_self");
                                    if(typeof callback == 'function'){
                                        callback();
                                    }
                                });

                            }
                        }
                    }
                });
            }
        },
        {
            name: 'option4',
            title: 'Распечатать накладную без штрихкодов',
            disabled: function(){

            },
            callback: function(){
                var sel = tableInstance.ct_instance.getIndexesByData(true);
                var rowid = tableInstance.data.data[sel]['QUOTA_OPERATION_ID'];

                var name = 'report_quota_delivery_note_no_barcodes';
                var subcommand = '?sid='+MB.User.sid+'&object='+name+'&QUOTA_OPERATION_ID='+rowid ;
                var excelObj = {
                    sid: MB.User.sid,
                    object: name,
                    QUOTA_OPERATION_ID: rowid
                };

                bootbox.dialog({
                    title: 'Выберите действие',
                    message: 'Распечатать накладную или сохранить Excel?',
                    buttons: {
                        justReport: {
                            label: 'Распечатать накладную',
                            callback: function(){
                                var urlString = '<iframe class="iFrameForPrint" src="html/report/print_report.html' + subcommand + '" width="" height"" align"left"></iframe>';
                                $("body").append(urlString);
                            }
                        },
                        excelReport: {
                            label: 'Сохранить Excel',
                            callback: function(){
                                socketQuery({
                                    command: "get",
                                    object: name,
                                    xls: true,
                                    params: excelObj
                                }, function(res) {
                                    res = socketParse(res, false);
                                    window.open("data:application/vnd.ms-excel," + "﻿" + encodeURIComponent(res["data"]), "_self");
                                    if(typeof callback == 'function'){
                                        callback();
                                    }
                                });
                            }
                        }
                    }
                });


            }
        }
    ]
}());

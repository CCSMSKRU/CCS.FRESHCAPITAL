(function () {

    var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);
    var parentForm = tableInstance.parentObject;

    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option1',
            title: 'Загрузить документ',
            disabled: function(){
                return parentForm.data.data[0].merchant_status_sysname == 'NEW';
            },
            callback: function(){
                // Загрузить файл,
                // отправить операцию загрузить документ
                var loader = MB.Core.fileLoader;
                loader.start({
                    params:{
                        not_public:true
                    },
                    success: function (uid) {
                        console.log('uid', uid);
                        var filename = uid.name;
                        var row = tableInstance.ct_instance.selectedRowIndex;
                        var id = tableInstance.data.data[row].id;

                        var o = {
                            command:'uploadDocument',
                            object:'Merchant_document',
                            params:{
                                filename: filename,
                                id: id
                            }
                        };
                        socketQuery(o, function (res) {
                            tableInstance.reload();
                        });
                    }
                });
            }
        },
        {
            name: 'option2',
            title: 'Скачать',
            disabled: function(){
                var row = tableInstance.ct_instance.selectedRowIndex;
                var status = tableInstance.data.data[row].status_sysname;

                return status == 'CREATED' || status == 'REQUESTED';
            },
            callback: function(){
                var row = tableInstance.ct_instance.selectedRowIndex;
                var file_id = tableInstance.data.data[row].file_id;
                var document_name = tableInstance.data.data[row].document_name;
                var o = {
                    command:'download',
                    object:'File',
                    params:{
                        id:file_id
                    }
                };
                socketQuery(o, function (res) {
                    var fileName = res.path + res.filename;
                    var linkName = 'my_download_link' + MB.Core.guid();
                    $("body").prepend('<a id="'+linkName+'" href="' + res.path + '?filename='+ res.filename +'" download="'+ document_name + res.extension +'" style="display:none;"></a>');
                    var jqElem = $('#'+linkName);
                    jqElem[0].click();
                    jqElem.remove();
                    //$("#my_download_link").remove();
                });

                //bootbox.alert('Файл в системе, недоступен для внешнего мира, выгрузка в процессе разработки.');

                //tableInstance.openRowInModal();
            }
        },
        {
            name: 'option3',
            title: 'Отменить документ',
            disabled: function(){
                return !(tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex]['status_sysname'] == 'REQUESTED');
            },
            callback: function(){
                //tableInstance.openRowInModal();
            }
        }
    ];

}());





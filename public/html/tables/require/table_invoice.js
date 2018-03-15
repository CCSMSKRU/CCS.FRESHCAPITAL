(function () {

    var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);

    console.error('table_invoice');

    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option1',
            title: 'Скачать',
            disabled: function(){
                return false;
            },
            callback: function(){

                var row = tableInstance.ct_instance.selectedRowIndex;
                var id = tableInstance.data.data[row].id;
                var financing_id = tableInstance.data.data[row].merchant_financing_id;

                var fo = {
                    command:'get',
                    object:'merchant_financing',
                    params:{
                        param_where: {
                            id: financing_id
                        },
                        collapseData:false
                    }
                };


                socketQuery(fo, function(res){

                    var o = {
                        command: 'downloadInvoice',
                        object: 'invoice',
                        params: {
                            id: id,
                            fin_id: financing_id
                        }
                    };


                    if(!res[0].through_number){

                        bootbox.dialog({
                            title: 'Сформировать счёт',
                            message: '<div class="form-group"><label>Укажите номер договора:</label><input type="text" class="form-control" id="invoice-arg-number" /></div>',
                            buttons: {
                                success: {
                                    label: 'Подтвердить',
                                    callback: function(){

                                        o.params.through_number = $('#invoice-arg-number').val();

                                        socketQuery(o, function(res){

                                            if(!res.code){
                                                var fileName = res.path + res.filename;
                                                var linkName = 'my_download_link' + MB.Core.guid();

                                                var nameRu = res.name_ru || res.filename;

                                                $("body").prepend('<a id="'+linkName+'" href="' + res.path + res.filename +'" download="'+ nameRu+'" style="display:none;"></a>');
                                                var jqElem = $('#'+linkName);
                                                jqElem[0].click();
                                                jqElem.remove();
                                            }

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

                    }else{

                        socketQuery(o, function(res){

                            if(!res.code){
                                var fileName = res.path + res.filename;
                                var linkName = 'my_download_link' + MB.Core.guid();

                                var nameRu = res.name_ru || res.filename;

                                $("body").prepend('<a id="'+linkName+'" href="' + res.path + res.filename +'" download="'+ nameRu+'" style="display:none;"></a>');
                                var jqElem = $('#'+linkName);
                                jqElem[0].click();
                                jqElem.remove();
                            }

                        });
                    }
                });
            }
        }
    ];


}());

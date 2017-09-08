(function () {

    var tableNId = $('.page-content-wrapper .classicTableWrap').data('id');
    var tableInstance = MB.Tables.getTable(tableNId);



    tableInstance.ct_instance.lowerButtons = [
        {
            title: 'Создать класс',
            color: "dark",
            icon: 'fa-plus',
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: [],
                matching: [],
                colValues: []
            }],
            handler: function() {
                var o = {
                    command: 'createClass',
                    object: 'Table',
                    params: {

                    }
                };

                return false;

                socketQuery(o,function(res){

                });
            }
        }
    ];

    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option1',
            title: 'Создать таблицу в базе',
            disabled: function () {
                return false;
            },
            callback: function () {
                var row = tableInstance.ct_instance.selectedRowIndex;
                var name = tableInstance.data.data[row]['name'];
                var object = tableInstance.data.data[row]['object'];

                bootbox.dialog({
                    title: 'Укажите имя файла',
                    message: '<input id="set_file_name" type="text" value=""/>',
                    buttons: {
                        success: {
                            label: 'Огонь!',
                            callback: function () {
                                socketQuery({
                                    command: 'create',
                                    object: 'Table', // constant
                                    object_params: {
                                        name: name
                                    },
                                    params: {
                                        object: object,
                                        filename: $('#set_file_name').val()
                                    }
                                }, function (res) {
                                    console.log(res);
                                });
                            }
                        },
                        nothing: {
                            label: 'И так сойдет',
                            callback: function () {
                                socketQuery({
                                    command: 'create',
                                    object: 'Table', // constant
                                    object_params: {
                                        name: name
                                    },
                                    params: {
                                        object: object
                                    }
                                }, function (res) {
                                    console.log(res);
                                });
                            }
                        },
                        error: {
                            label: 'Отмена',
                            callback: function () {

                            }
                        }

                    }
                });


            }
        },
        {
            name: 'option2',
            title: 'Удалить таблицу из базы',
            disabled: function () {
                return false;
            },
            callback: function () {
                var row = tableInstance.ct_instance.selectedRowIndex;
                var name = tableInstance.data.data[row]['name'];
                var object = tableInstance.data.data[row]['object'];

                socketQuery({
                    command: 'drop',
                    object: 'Table', // constant
                    object_params: {
                        name: name
                    },
                    params: {
                        object: object
                    }
                }, function (res) {
                    console.log(res);
                });
            }
        }
    ];


}());





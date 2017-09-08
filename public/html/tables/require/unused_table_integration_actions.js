(function(){

    var tableNId = $('.page-content-wrapper .classicTableWrap').data('id');
    var tableInstance = MB.Tables.getTable(tableNId);

    tableInstance.ct_instance.lowerButtons = [
        {
            title: 'Загрузить мерприятия из шлюза',
            color: "dark",
            icon: null,
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: [],
                matching: [],
                colValues: []
            }],
            handler: function() {
                tableInstance.makeOperation('integration_load_all_actions', function(){
                    tableInstance.reload();
                });
            }
        },{
            title: 'Удалить неиспользуемые',
            color: "dark",
            icon: null,
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: [],
                matching: [],
                colValues: []
            }],
            handler: function() {
                tableInstance.makeOperation('integration_delete_unused_actions', function(){
                    tableInstance.reload();
                });
            }
        },{
            title: 'Импортировать все загруженные',
            color: "dark",
            icon: null,
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: [],
                matching: [],
                colValues: []
            }],
            handler: function() {
                var o = {
                    command: 'get',
                    object: 'sys_gateway',
                    params: {}
                };

                socketQuery(o, function(res){
                    res = socketParse(res);
                    console.log('GATES', res);

                    var html = '<label>Выберите шлюз:</label><select class="select3 gateways-select">';
                    for(var i in res){
                        var gateway = res[i];
                        html+='<option value="'+gateway.GATEWAY_ID+'">'+gateway.NAME+'</option>';
                    }
                    html+='</select>';

                    console.log(html);
                    var selInst;
                    var selVal;

                    bootbox.dialog({
                        title: 'Импортировать все мероприятия',
                        message: html,
                        buttons:{
                            success: {
                                label: 'Применить',
                                callback: function(){
                                    socketQuery({
                                        command: 'operation',
                                        object: 'integration_import_all_action',
                                        params: {
                                            gateway_id: selVal
                                        }
                                    }, function(res){
                                        socketParse(res);
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
                    selInst = $('.gateways-select').select3();
                    $(selInst).off('changeVal').on('changeVal', function(){
                        selVal = selInst.value.id;
                    });
                });
            }
        }];

    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option1',
            title: 'Импортировать мероприятие [node function]',
            disabled: function(){
                var c1 = tableInstance.ct_instance.isDisabledCtx({
                        col_names: ['IMPORT_ACTION_STATUS', 'GATEWAY_ID'],
                        matching: ['equal', 'equal'],
                        col_values: ['NOT_IMPORTED', 5]
                    }),
                    c2 = tableInstance.ct_instance.isDisabledCtx({
                        col_names: ['IMPORT_ACTION_STATUS', 'GATEWAY_ID'],
                        matching: ['equal', 'equal'],
                        col_values: ['ERROR', 5]
                    }),
                    c3 = tableInstance.ct_instance.isDisabledCtx({
                        col_names: ['IMPORT_ACTION_STATUS', 'GATEWAY_ID'],
                        matching: ['equal', 'equal'],
                        col_values: ['NOT_IMPORTED', 41]
                    }),
                    c4 = tableInstance.ct_instance.isDisabledCtx({
                        col_names: ['IMPORT_ACTION_STATUS', 'GATEWAY_ID'],
                        matching: ['equal', 'equal'],
                        col_values: ['ERROR', 41]
                    }),

                    c = [];

                for (var i in c1) c.push(c1[i] || c2[i] || c3[i] || c4[i]);
                return !~c.indexOf(true);
            },
            callback: function(){
                var sel = tableInstance.ct_instance.selectedRowIndex;
                var eventObj = {};
                eventObj.id =           tableInstance.data.data[sel]['EXTERNAL_ACTION_ID'];
                eventObj.name =         tableInstance.data.data[sel]['ACTION_NAME'];
                eventObj.date_time =    tableInstance.data.data[sel]['ACTION_DATE'];
                eventObj.hall_id =      tableInstance.data.data[sel]['HALL_ID'] || 0;
                eventObj.hall_scheme_id = tableInstance.data.data[sel]['HALL_SCHEME_ID'] || 0;
                eventObj.gateway =      tableInstance.data.data[sel]['GATEWAY_ID'];
                eventObj.age_id =       tableInstance.data.data[sel]['AGE_CATEGORY_ID'];
        eventObj.split_by_area_group =  tableInstance.data.data[sel]['SPLIT_BY_AREA_GROUP'];
                eventObj.command =      "IMPORT_EVENTS";

                if(eventObj.gateway == 5) {
                    console.log("Импортирование мероприятий с ponominalu.ru");
                }
                if(eventObj.gateway == 41) {
                    console.log("Импортирование мероприятий с Crocus");
                }

                if(eventObj.hall_id > 0) {
                    MB.Core.spinner.start($(".page-content-wrapper"));
                    tableInstance.ct_instance.wrapper.find('.ct-fader').css({
                        opacity: 0.7,
                        display: 'block'
                    });

                    DOQuery(eventObj, function(obj){
                        console.log("Ответ от сервера:", obj);
                        MB.Core.spinner.stop(tableInstance.ct_instance.wrapper);
                        tableInstance.ct_instance.wrapper.find('.ct-fader').css({
                            opacity: 0,
                            display: 'none'
                        });

                        if(obj != null) {
                            if (obj.problems.length > 0) {
                                for (var p in obj.problems) {
                                    toastr["error"](obj.problems[p]);
                                }
                            } else {
                                toastr["success"]("Мероприятие импортировано");
                            }
                        } else {
                            toastr["error"]("Ошибка импортирования");
                        }
                    });

                } else {
                    toastr["error"]("Выберите зал");
                }
            }
        },
        {
            name: 'option2',
            title: 'Обновить мероприятие [node function]',
            disabled: function(){
                var c1 = tableInstance.ct_instance.isDisabledCtx({
                        col_names: ['IMPORT_ACTION_STATUS', 'GATEWAY_ID'],
                        matching: ['equal', 'equal'],
                        col_values: ['IMPORTED', 5]
                    }),
                    c2 = tableInstance.ct_instance.isDisabledCtx({
                        col_names: ['IMPORT_ACTION_STATUS', 'GATEWAY_ID'],
                        matching: ['equal', 'equal'],
                        col_values: ['IMPORTED', 41]
                    }),
                    c = [];

                for (var i in c1) c.push(c1[i] || c2[i]);
                return !~c.indexOf(true);
            },
            callback: function() {
                var sel = tableInstance.ct_instance.selectedRowIndex;
                var eventObj = {};
                eventObj.id = tableInstance.data.data[sel]['EXTERNAL_ACTION_ID'];
                eventObj.gateway = tableInstance.data.data[sel]['GATEWAY_ID'];
                eventObj.action_id = tableInstance.data.data[sel]['ACTION_ID'];
                eventObj.hall_scheme_id = tableInstance.data.data[sel]['HALL_SCHEME_ID'] || 0;
                eventObj.command = "REFRESH_EVENTS";

                if (eventObj.gateway == 5) {
                    console.log("Обновление мероприятий с ponominalu.ru");
                }
                if (eventObj.gateway == 41) {
                    console.log("Обновление мероприятий с Crocus");
                }

                MB.Core.spinner.start($(".page-content-wrapper"));
                tableInstance.ct_instance.wrapper.find('.ct-fader').css({
                    opacity: 0.7,
                    display: 'block'
                });

                DOQuery(eventObj, function (obj) {
                    console.log("Ответ от сервера:", obj);
                    MB.Core.spinner.stop(tableInstance.ct_instance.wrapper);
                    tableInstance.ct_instance.wrapper.find('.ct-fader').css({
                        opacity: 0,
                        display: 'none'
                    });

                    if (obj != null) {
                        if (obj.problems.length > 0) {
                            for (var p in obj.problems) {
                                toastr["error"](obj.problems[p]);
                            }
                        } else {
                            toastr["success"]("Мероприятие обновлено");
                        }
                    } else {
                        toastr["error"]("Ошибка обновления");
                    }
                });
            }
        },
        {
            name: 'option3',
            title: 'Импортировать мероприятие',
            disabled: function(){

                var c1 = tableInstance.ct_instance.isDisabledCtx({
                        col_names: ['IMPORT_ACTION_STATUS'],
                        matching: ['equal'],
                        col_values: ['NOT_IMPORTED']
                    }),
                    c2 = tableInstance.ct_instance.isDisabledCtx({
                        col_names: ['IMPORT_ACTION_STATUS'],
                        matching: ['equal'],
                        col_values: ['ERROR']
                    }),
                    c = [];

                for (var i in c1) c.push(c1[i] || c2[i]);
                return !~c.indexOf(true);

            },
            callback: function(){
                var flat = tableInstance.ct_instance.selection2.data;
                var selId = tableInstance.ct_instance.selectedRowIndex;
                var ext_id = tableInstance.data.data[selId]['EXTERNAL_ACTION_ID'];
                var gate_id = tableInstance.data.data[selId]['GATEWAY_ID'];

                tableInstance.ct_instance.notify(true, 'Подождите, идет процесс импорта...');

                socketQuery({
                    command: 'operation',
                    object: 'integration_import_action',
                    params: {
                        gateway_id: gate_id,
                        external_action_id: ext_id
                    }
                }, function(res){
                    socketParse(res);
                    tableInstance.ct_instance.notify(false, '');
                });

//                for(var i in flat){
//
//                }
            }
        },
        {
            name: 'option4',
            title: 'Сбросить статус обновления',
            disabled: function(){
                var c1 = tableInstance.ct_instance.isDisabledCtx({
                        col_names: ['IMPORT_ACTION_STATUS'],
                        matching: ['equal'],
                        col_values: ['UPDATING']
                    });

                return !~c1.indexOf(true);

            },
            callback: function(){
                tableInstance.makeOperation('integration_set_updating_to_imported', function(){
                });
            }
        }
    ];

    $(document).on("toClient", function (e, obj) {
        MB.Core.spinner.stop(tableInstance.ct_instance.wrapper);
        tableInstance.ct_instance.wrapper.find('.ct-fader').css({
            opacity: 0,
            display: 'none'
        });
    });
    
}());


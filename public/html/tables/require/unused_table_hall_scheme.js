(function () {
    var tableNId = $('.page-content-wrapper .classicTableWrap').data('id');
    var tableInstance = MB.Tables.getTable(tableNId);
    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option6',
            title: 'Перейти к новому редактору',
            disabled: function () {
                return false;
            },
            callback: function () {
                var sel = tableInstance.ct_instance.getIndexesByData(true);
                var id = tableInstance.data.data[sel]['HALL_SCHEME_ID'];
                var titlePrice = tableInstance.data.data[sel]['PRICE_ZONE'] + ' для ' + tableInstance.data.data[sel]['NAME'];

                socketQuery({
                    command: "get",
                    object: "hall_scheme",
                    params: {where: "hall_scheme_id = " + id}
                }, function (data) {
                    var obj = socketParse(data);
                    var hall_id = obj[0].HALL_ID;
                    MB.Core.switchModal({
                        type: "content",
                        isNew: true,
                        filename: "mapEditor",
                        params: {hall_scheme_id: id, hall_id: hall_id, title: titlePrice, label: 'Редактор зала '}
                    });
                });
            }
        },
        {
            name: 'option7',
            title: 'Перейти к схемам распределения',
            disabled: function () {
                return false;
            },
            callback: function () {
                var sel = tableInstance.ct_instance.selectedRowIndex;
                var id = tableInstance.data.data[sel]['HALL_SCHEME_ID'];
                var titlePrice = tableInstance.data.data[sel]['FUND_ZONE'] + ' для ' + tableInstance.data.data[sel]['NAME'];

                socketQuery({
                    command: "get",
                    object: "hall_scheme",
                    params: {
                        where: "hall_scheme_id = " + id
                    }
                }, function (res) {
                    var obj = socketParse(res);
                    var hall_id = obj[0].HALL_ID;
                    MB.Core.switchModal({
                        type: "content",
                        isNew: true,
                        filename: "fundZones",
                        params: {
	                        hall_scheme: tableInstance.data.data[sel],
                            hall_scheme_id: id,
                            hall_id: hall_id,
                            title: titlePrice,
                            hall_scheme_res: obj,
                            label: 'Редактор зала '
                        }
                    });
                });
            }
        },
        {
            name: 'option10',
            title: 'Перейти к распределению доступов',
            disabled: function () {
                return false;
            },
            callback: function () {
                var sel = tableInstance.ct_instance.selectedRowIndex;
                var id = tableInstance.data.data[sel]['HALL_SCHEME_ID'];
                var titlePrice = tableInstance.data.data[sel]['FUND_ZONE'] + ' для ' + tableInstance.data.data[sel]['NAME'];

                socketQuery({
                    command: "get",
                    object: "hall_scheme",
                    params: {
                        where: "hall_scheme_id = " + id
                    }
                }, function (res) {
                    var obj = socketParse(res);
                    var hall_id = obj[0].HALL_ID;
                    MB.Core.switchModal({
                        type: "content",
                        isNew: true,
                        filename: "accessZones",
                        params: {
                            hall_scheme: tableInstance.data.data[sel],
                            hall_scheme_id: id,
                            hall_id: hall_id,
                            title: titlePrice,
                            hall_scheme_res: obj,
                            label: 'Распределение доступов '
                        }
                    });
                });
            }
        },
        {
            name: 'option8',
            title: 'Перейти к схемам распоясовки',
            disabled: function () {
                return false;
            },
            callback: function () {
                var sel = tableInstance.ct_instance.getIndexesByData(true);
                var id = tableInstance.data.data[sel]['HALL_SCHEME_ID'];
                var titlePrice = tableInstance.data.data[sel]['PRICE_ZONE'] + ' для ' + tableInstance.data.data[sel]['NAME'];

                MB.Core.switchModal({
                    type: "content",
                    filename: "priceZones",
                    isNew: true,
                    params: {
	                    hall_scheme: tableInstance.data.data[sel],
	                    scheme: 'hall_scheme',
	                    zone: 'price_zone',
                        hall_scheme_id: id,
                        title: titlePrice,
                        label: 'Схема распоясовки'
                    }
                });
            }
        },
        {
            name: 'option1',
            title: 'Открыть в форме',
            disabled: function () {
                return false;
            },
            callback: function () {
                tableInstance.openRowInModal();
            }
        },
        {
            name: 'option4',
            title: 'Перейти к редактору',
            disabled: function () {
                return false;
            },
            callback: function () {
                var sel = tableInstance.ct_instance.getIndexesByData(true);
                var id = tableInstance.data.data[sel]['HALL_SCHEME_ID'];
                var titlePrice = tableInstance.data.data[sel]['PRICE_ZONE'] + ' для ' + tableInstance.data.data[sel]['NAME'];

                socketQuery({
                    command: "get",
                    object: "hall_scheme",
                    params: {where: "hall_scheme_id = " + id}
                }, function (data) {
                    var obj = socketParse(data);
                    var hall_id = obj[0].HALL_ID;
                    MB.Core.switchModal({
                        type: "content",
                        filename: "mapEditorOld",
                        isNew: true,
                        params: {
	                        id: id,
	                        scheme: 'hall_scheme',
	                        title: titlePrice
                        }
                    });
                });
            }
        },
        {
            name: 'option11',
            title: 'Перейти к группировке мест',
            disabled: function () {
                return false;
            },
            callback: function () {
                var sel = tableInstance.ct_instance.getIndexesByData(true);
                var id = tableInstance.data.data[sel]['HALL_SCHEME_ID'];
                var title = 'Группировка мест для ' + tableInstance.data.data[sel]['NAME'];

                socketQuery({
                    command: "get",
                    object: "hall_scheme",
                    params: {where: "hall_scheme_id = " + id}
                }, function (data) {
                    var obj = socketParse(data);
                    var hall_id = obj[0].HALL_ID;
                    MB.Core.switchModal({
                        type: "content",
                        filename: "placeGroups",
                        isNew: true,
                        params: {
                            hall_scheme: tableInstance.data.data[sel],
                            hall_scheme_id: id,
                            hall_id: hall_id,
                            hall_scheme_res: obj,
                            id: id,
                            scheme: 'hall_scheme',
                            title: title
                        }
                    });
                });
            }
        },
        {
            name: 'option5',
            title: 'Создать копию',
            disabled: function () {
                return false;
            },
            callback: function () {

                var sel = tableInstance.ct_instance.getIndexesByData(true);
                var id = tableInstance.data.data[sel]['HALL_SCHEME_ID'];
                var titlePrice = tableInstance.data.data[sel]['PRICE_ZONE'] + ' для ' + tableInstance.data.data[sel]['NAME'];
                var hallName = tableInstance.data.data[sel]['NAME'] + ' (Копия)';

                function ModalMiniContent(obj) {
                    var ModalDiv = $(obj.selector);
                    var ModalHeader = ModalDiv.find(".modal-header");
                    var ModalBody = ModalDiv.find(".modal-body");
                    ModalHeader.html(obj.title);
                    ModalBody.html(obj.content);
                    $(".modal-footer").html("");
                    for (key in obj['buttons']) {
                        (function (key) {
                            var val = obj['buttons'][key];
                            var html = "";
                            html += '<button type="button" class="btn ' + val['color'] + ' btn_' + key + '" ' + val['dopAttr'] + '>' + val['label'] + '</button>';
                            $(".modal-footer").append(html);
                            $(".btn_" + key).click(function () {
                                val.callback();
                            })
                        })(key)
                    }

                    ModalDiv.modal("show");
                }

                bootbox.dialog({
                    message: "<p>Схему зала можно скопировать в двух режимах. В первом будет скопирована только физическая модель зала (расположения мест, надписей, изображений), а во втором, также, будут скопированы все схемы распределения/распоясовки/расценки.</p><input type='text' class='copySchemeName bootbox-input bootbox-input-text form-control' value='" + hallName + "'>",
                    title: "Копирование схемы зала",
                    buttons: {
                        success: {
                            label: "Скопировать только места",
                            className: "btn-success",
                            callback: function () {
                                var info = toastr["info"]("Идет процесс копирования", "Подождите...", {
                                    timeOut: 1000000
                                });
                                var copySchemeName = $(".copySchemeName").val();
                                socketQuery({
                                    command: "operation",
                                    object: "copy_hall_scheme",
                                    params: {
                                        hall_scheme_id: id,
                                        all: 0,
                                        name: copySchemeName
                                    }
                                }, function (data) {
                                    info.fadeOut(600);
                                    if (socketParse(data)) tableInstance.reload();
                                });
                            }
                        },
                        success2: {
                            label: "Полная копия",
                            className: "btn-success",
                            callback: function () {
                                var info = toastr["info"]("Идет процесс копирования", "Подождите...", {
                                    timeOut: 1000000
                                });
                                var copySchemeName = $(".copySchemeName").val();
                                socketQuery({
                                    command: "operation",
                                    object: "copy_hall_scheme",
                                    params: {
                                        hall_scheme_id: id,
                                        name: copySchemeName
                                    }
                                }, function (data) {
                                    info.fadeOut(600);
                                    if (socketParse(data)) tableInstance.reload();
                                });
                            }
                        },
                        close: {
                            label: "Закрыть",
                            className: "btn-primary",
                            callback: function () {}
                        }
                    }
                });
            }
        }
    ];
    (function () {

        var il = MB.Core.fileLoader;
        var beforeBtn = tableInstance.wrapper.find('.ct-btn-create-inline');
        var btnHtml = '<li class="ct-environment-btn import_hall_scheme"><div class="nb btn btnDouble green"><i class="fa fa-plus"></i><div class="btnDoubleInner">Импортировать схему</div></div></li>';
        beforeBtn.before(btnHtml);
        var importBtn = tableInstance.wrapper.find('.import_hall_scheme');
        var guid = MB.Core.guid();
        var modalHtml = '<div class="row form-body" id="bootbox'+guid+'">' +
            '<div class="padder5">' +
            '<label class="wid100pr">Зал:' +
            '<div id="searchHall" data-id="hall_id"></div>' +
            '</label>' +
            '</div>' +
            '</div>';


        importBtn.off('click').on('click', function () {
            var selInstance;
            bootbox.dialog({
                /*message: "Импорт схемы зала занимает много времени, вы уверены что хотите приступить?",*/
                message: modalHtml,
                title: "Импорт схемы из файла",
                callback:function(){
//                    alert(123);
                },
                buttons: {
                    success: {
                        label: "Выбрать файл и начать импорт.",
                        className: "green",
                        callback: function () {
                            var hall_id = selInstance.value.id;
                            if (hall_id<0){
                                return toastr.error('Зал для импорта не выбран');
                            }
                            il.start({
                                success:function(fileUID){
                                    var timeOut = toastr.options.timeOut;
                                    var extendedTimeOut = toastr.options.extendedTimeOut;
                                    toastr.options.timeOut = 1000000;
                                    toastr.options.extendedTimeOut = 100;
                                    var info = toastr.info('Идет процесс импорта...');
                                    toastr.options.timeOut = timeOut;
                                    toastr.options.extendedTimeOut = extendedTimeOut;
                                    DOQuery({
                                        command: 'IMPORT_SOME',
                                        name:'hall_scheme',
                                        requiredFields:{
                                            hall_id: hall_id
                                        },
                                        file_name: 'upload/'+fileUID.name
                                    }, function (r) {
                                        info.fadeOut(600);
                                        if (r.err) console.log(r.err);
                                        toastr[r.type](r.message);
                                        tableInstance.reload();
                                    });

                                }
                            });
                        }
                    },
                    error: {
                        label: "Отмена",
                        className: "yellow",
                        callback: function () {

                        }
                    }
                }
            });

            var bootboxContainer = $("#bootbox"+guid);
            selInstance = MB.Core.select3.init({
                id: guid,
                wrapper: bootboxContainer.find('#searchHall'),
                getString: 'HALL',
                column_name: 'HALL_ID',
                view_name: '',
                value: {
                    id: '-10',
                    name: 'Выберите зал'
                },
                data: [],
                fromServerIdString: 'HALL_ID',
                fromServerNameString: 'NAME',
                searchKeyword: 'NAME',
                withEmptyValue: false,
                isSearch: true,
                parentObject: bootboxContainer
            });

        });
    }());

}());




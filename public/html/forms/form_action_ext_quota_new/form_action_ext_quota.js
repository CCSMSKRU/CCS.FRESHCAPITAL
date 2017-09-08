(function () {
    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_action_ext_quota', formID);
    var formWrapper = $('#mw-' + formInstance.id);

    var modalInstance = MB.Core.modalWindows.windows.getWindow(formID);
    modalInstance.stick = 'top';
    modalInstance.stickModal();

    var actionMap;
    var environment = formInstance;
    var sid = MB.User.sid;


    environment.action_id = formInstance.activeId;
    environment.emptyModifyJson = '{"toDel":{"type":"toDel","title":"На удаление","squares":{}}}';
    environment.emptyModifyObj = JSON.parse(environment.emptyModifyJson);
    environment.modifyObj = $.extend(true, {}, environment.emptyModifyObj);
    environment.selectedSquares = 0;

    var mapWrapper = formWrapper.find('.form-with-map-canvas-container'),
        splitByAreaGroup,
        openSector;

    socketQuery({
        "command": "get",
        "object": "action",
        "params": {"where": "ACTION_ID = '" + environment.activeId + "'"}
    }, function (res) {
        splitByAreaGroup = socketParse(res)[0]['SPLIT_BY_AREA_GROUP'] == 'TRUE';
    });


    function setHeights(isFirst) {
        var wrapper = formWrapper.find('.form-with-map-big-sidebar-wrapper'),
            excludeBlocks = wrapper.children('.excludeHeight'),
            setHeightBlocks = wrapper.children().not(excludeBlocks),
            totalHeight = (isFirst) ? $(window).height() - 95 : modalInstance.wrapper.outerHeight() - 55,
            freeHeight = (function () {
                var freeH = totalHeight;
                excludeBlocks.each(function () {
                    freeH -= $(this).outerHeight();
                });
                return freeH;
            }()),
            setHeightBlocksCount = setHeightBlocks.length,
            newBlockHeight = Math.floor(freeHeight / setHeightBlocksCount),
            lonePixels = freeHeight % setHeightBlocksCount;

        setHeightBlocks.each(function () {
            $(this).height(newBlockHeight);
        });
        setHeightBlocks.last().height(newBlockHeight + lonePixels);
    }

        function renderModifyTable() {
            var obj = environment.modifyObj,
                finalObj = {},
                htmlAdd = ['<div class="modifyTable">' +
                '<div class="headQ addQ"><i class="fa fa-cloud-download addQ"></i>Места на добавление</div>' +
                '<div class="divider autoScroll newScroll">' +
                '<table class="table content-sidebar-table add"><tr class="addQ"><th>Сектор</th><th>Ряд</th><th>Место</th><th>Цена</th><th>&nbsp;</th></tr>'],
                htmlDel = ['<div class="modifyTable">' +
                '<div class="headQ delQ"><i class="fa fa-cloud-upload delQ"></i>Места на возврат</div>' +
                '<div class="divider autoScroll newScroll">' +
                '<table class="table content-sidebar-table del"><tr class="delQ"><th>Сектор</th><th>Ряд</th><th>Место</th><th>Цена</th><th><i class="fa fa-trash-o delete"></i></th></tr>'],
                row,
                i;

            var createObject = function(type) {
                finalObj[type] = {};
                finalObj[type].squares = [];
                finalObj[type].title = obj[type].title;
                finalObj[type].type = obj[type].type;

                for (i in obj[type].squares) finalObj[type].squares.push(obj[type].squares[i]);

                finalObj[type].squares.sort(function(a, b) {
                    return +a.line - +b.line
                });
            };

            for (i in obj) {
                createObject(i);
            }

            for (i in finalObj) {
                var group = finalObj[i],
                    squares = group.squares,
                classes = ['group', group.type];
            if (group.selected) classes.push('selected');
            row = '<tr class="' + classes.join(' ') + '" data-val="' + group.title + '">' +
                '<td colspan="4"><i class="fa ' + (group.collapsed ? 'fa-angle-down' : 'fa-angle-up') + ' toggleSlide"></i> по ' + group.title + ' руб.</td>' +
                '<td class="controls"><i class="fa fa-pencil edit"></i><i class="fa fa-trash-o delete"></i></td>' +
                '</tr>';
            if (group.type != 'toDel') htmlAdd.push(row);
            for (var j in squares) {
                var square = squares[j];
                row = '<tr data-id="' + j + '"' + (group.collapsed ? ' class="hidden"' : '') + '">' +
                    '<td>' + square.areaGroup + '</td>' +
                    '<td>' + square.line + '</td>' +
                    '<td>' + square.place + '</td>' +
                    '<td>' + square.salePrice + '</td>' +
                    '<td class="ctrls"><i class="fa fa-trash-o delete"></i></td>' +
                    '</tr>';
                if (group.type == 'toDel') htmlDel.push(row);
                else htmlAdd.push(row);
            }
        }
        htmlAdd.push('</table></div></div>');
        htmlDel.push('</table></div></div>');
        formWrapper.find('.modifyTables').html(htmlAdd.join('') + htmlDel.join(''));
        formWrapper.find('.mainControls').removeClass('hidden');
        highlightSelectedSquares();
        if (environment.selectedSquares) formWrapper.find('.acceptChanges').removeClass('disabled');
        else formWrapper.find('.acceptChanges').addClass('disabled');


        formWrapper.find('.modifyTables .group.price').off('click').on('click', function () {
            var val = $(this).attr('data-val'),
                obj = environment.modifyObj;
            environment.selectedPriceGroup = val;
            formWrapper.find('.modifyTables .group.price').removeClass('selected');
            $(this).addClass('selected');
            for (var i in obj) delete obj[i].selected;
            obj[val].selected = true;
        });
        formWrapper.find('.modifyTables .group .controls .delete, .delQ .delete').off('click').on('click', function () {
            var $t = $(this),
                $parent = $t.parents('tr').eq(0),
                isToDel = $parent.hasClass('delQ');
            bootbox.dialog({
                title: '',
                message: (isToDel ? 'Очистить' : 'Удалить') + ' группу?',
                buttons: {
                    success: {
                        label: 'Да',
                        className: '',
                        callback: function () {
                            var id = $parent.attr('data-val') || 'toDel',
                                obj = environment.modifyObj,
                                sq = obj[id].squares,
                                squares = actionMap.squares,
                                colors = environment.defaultColors;
                            if (obj[id].selected) environment.selectedPriceGroup = null;
                            for (var i in sq) {
                                squares[i].color0 = colors[i];
                                environment.selectedSquares--;
                            }
                            if (isToDel) obj[id].squares = {};
                            else delete obj[id];
                            renderModifyTable();
                        }
                    },
                    cancel: {
                        label: 'Отмена',
                        className: '',
                        callback: function () {
                        }
                    }
                }
            });
        });
        formWrapper.find('.modifyTables .group.price .controls .edit').off('click').on('click', function () {
            var $t = $(this),
                rnd = 'bb' + +(new Date()),
                obj = environment.modifyObj,
                oldVal = $t.parents('tr').eq(0).attr('data-val'),
                objToRename = $.extend({}, obj[oldVal]);
            bootbox.dialog({
                title: 'Введите новую цену',
                message: '<input class="form-control" id="' + rnd + '">',
                buttons: {
                    success: {
                        label: 'Сохранить',
                        className: '',
                        callback: function () {
                            var val = parseInt($('#' + rnd).val());
                            val = isNaN(val) ? '0' : val.toString();
                            if (obj[val]) {
                                if (confirm('Группа мест с такой ценой уже есть. Совместить группы?')) {
                                    for (var i in obj[oldVal].squares) obj[val].squares[i] = obj[oldVal].squares[i];
                                    if (obj[oldVal].selected) {
                                        obj[val].selected = true;
                                        environment.selectedPriceGroup = val;
                                    }
                                    delete obj[oldVal];
                                    renderModifyTable();
                                }
                                return;
                            }
                            delete obj[oldVal];
                            objToRename.title = val;
                            obj[val] = objToRename;
                            if (obj[val].selected) environment.selectedPriceGroup = val;
                            renderModifyTable();
                        }
                    },
                    cancel: {
                        label: 'Отмена',
                        className: '',
                        callback: function () {
                        }
                    }
                }
            });
        });

        formWrapper.find('.modifyTables .ctrls .delete').off('click').on('click', function () {
            var $parent = $(this).parents('tr').eq(0),
                id = $parent.attr('data-id'),
                prev = $parent.prevAll('group').eq(0),
                group = (prev.length) ? $parent.prevAll('group').eq(0).attr('data-val') : 'toDel';
            delete environment.modifyObj[group].squares[id];
            actionMap.squares[id].color0 = environment.defaultColors[id];
            environment.selectedSquares--;
            renderModifyTable()
        });
        formWrapper.find('.modifyTables').off('click').on('click', '.toggleSlide', function () {
            var group = $(this).parents('tr').eq(0).attr('data-val');
            if ($(this).hasClass('fa-angle-up')) {
                $(this).removeClass('fa-angle-up').addClass('fa-angle-down');
                environment.modifyObj[group].collapsed = true;
            } else {
                $(this).removeClass('fa-angle-down').addClass('fa-angle-up');
                delete environment.modifyObj[group].collapsed;
            }
            renderModifyTable();
        });
    }

    function highlightSelectedSquares() {
        var obj = environment.modifyObj;
        for (var i in obj) {
            var group = obj[i].squares;
            for (var j in group) {
                var color = (i == 'toDel') ? '#F88' : '#AFF281';
                actionMap.squares[j].color0 = color;
            }
        }
        actionMap.render();
    }

    environment.loadMap = function () {
        environment.selectedPriceGroup = null;
        mapWrapper.empty();
        if (actionMap) actionMap.destroy();

        var socketObject = {
            sid: sid,
            type: "action_scheme",
            param: "action_id",
            id: environment.action_id,
            portion: 30,
            save: {
                command: "operation",
                object: "block_place_list",
                params: {
                    action_id: environment.action_id
                },
                field_name: "action_scheme_id"
            },
            load: {
                command: "get",
                object: "action_scheme",
                params: {
                    action_id: environment.action_id
                },
                columns: "ACTION_SCHEME_ID,PRICE,STATUS,STATUS_TEXT,FUND_GROUP_NAME,PRICE_GROUP_NAME,BLOCK_COLOR,COLOR",
                field_name: "action_scheme_id"
            }
        };


        actionMap = new Map1({
            container: mapWrapper,
            cWidth: $(window).width() / 100 * 55,
            cHeight: $(window).height() - 93,
            mode: "admin"
        });

        MB.User.map = actionMap;

        actionMap.sendSelection = function () {
            var sel = actionMap.selection,
                obj = environment.modifyObj,
                selectedGroup = environment.selectedPriceGroup;
            if (actionMap.mouseKey == 1) {
                for (var i in sel) {
                    var id = sel[i],
                        square = actionMap.squares[id];
                    if (square.status == 1) {
                        if (obj['toDel'].squares[id] === undefined) {
                            obj['toDel'].squares[id] = square;
                            environment.selectedSquares++;
                        }
                    } else if (square.status == 2) {
                        if (typeof selectedGroup != 'string') {
                            toastr.error('Для добавления мест в квоту создайте или выберите ценовую группу');
                            break;
                        }
                        var isFree = true;
                        for (var j in obj) {
                            var group = obj[j].squares;
                            for (var k in group) {
                                if (k == id) {
                                    isFree = false;
                                    break;
                                }
                            }
                        }
                        if (isFree) {
                            obj[selectedGroup].squares[id] = square;
                            environment.selectedSquares++;
                        }
                    }
                }
            } else if (actionMap.mouseKey == 3) {
                for (var i in sel) {
                    var id = sel[i];
                    for (var j in obj) {
                        var group = obj[j];
                        for (var k in group.squares) {
                            if (k == id) {
                                delete group.squares[k];
                                actionMap.squares[id].color0 = environment.defaultColors[id];
                                environment.selectedSquares--;
                            }
                        }
                    }
                }
            }

            formInstance.enableSaveButton(environment.selectedSquares > 0);

            actionMap.clearSelection(true);
            actionMap.render();
            renderModifyTable();
        };

        actionMap.sendSelectionCallback = function () {
        };

        actionMap.sendSelectionCallbackFull = function () {
        };

        actionMap.openSocket(socketObject);
        var squareO = {
            command: "get",
            object: "action_scheme_ext_quota",
            sid: sid,
            params: {
                action_id: environment.action_id,
                ext_quota_id: environment.active_quote
            }
        };
        var layerO = {
            command: "get",
            object: "action_scheme_layer",
            sid: sid,
            params: {
                action_id: environment.action_id,
                /*where: "ACTION_ID = " + environment.action_id + " and VISIBLE_CASHER='TRUE'",*/
                where: " VISIBLE_CASHER='TRUE'",
                /*columns: "ACTION_SCHEME_LAYER_ID",*/
                order_by: "SORT_NO"
            }
        };
        var objectO = {
            command: "get",
            object: "action_scheme_object",
            sid: sid,
            where_field: "ACTION_SCHEME_LAYER_ID",
            params: {
                action_id: environment.action_id,
                /*columns:"ACTION_SCHEME_OBJECT_ID,OBJECT_TYPE,OBJECT_TYPE,ROTATION,FONT_FAMILY,FONT_SIZE,FONT_STYLE,FONT_WIEGH,COLOR,X,Y,BACKGROUND_URL_SCALE,BACKGROUND_URL_ORIGINAL,BACKGROUND_COLOR",*/
                order_by: "SORT_NO"
            }
        };
        var sectorO = {
            command: "get",
            object: "action_scheme_area_group",
            params: {
                where: "ACTION_ID = " + environment.activeId
            }
        };
        console.log(splitByAreaGroup);
        if (splitByAreaGroup && typeof openSector != "number") {
            formWrapper.find('.backToSectors').addClass('hidden');
            actionMap.loadSectors({
                socketObject: socketObject,
                squareO: squareO,
                layerO: layerO,
                objectO: objectO,
                sectorO: sectorO,
                action_id: objectO.params.action_id
            }, function () {
                actionMap.loadRenderItems({
                    layerO: layerO,
                    objectO: objectO
                }, function () {
                    actionMap.render();
                    MB.Core.spinner.stop(mapWrapper);
                    mapWrapper.off('sector_click').on('sector_click', function () {
                        for (var i in actionMap.sectors) {
                            var sec = actionMap.sectors[i];
                            if (sec.selected) {
                                console.log(sec);
                                openSector = sec.action_group_id;
                                environment.loadMap();
                                break;
                            }
                        }

                    });
                    actionMap.loading = false;
                });
            });
        }
        else {
            if (typeof openSector == "number") {
                squareO.params.where = "AREA_GROUP_ID = " + openSector;
                openSector = null;
                formWrapper.find('.backToSectors').removeClass('hidden').off('click').on('click', function () {
                    environment.loadMap();
                });
            }
            actionMap.loadSquares(squareO, function () {
                actionMap.loadRenderItems({
                    layerO: layerO,
                    objectO: objectO
                }, function () {
                    actionMap.render();
                });
                actionMap.setLayout(function () {
                    actionMap.setMinMax(function () {
                        actionMap.setScaleCoff(function () {
                            actionMap.render(function () {
                                actionMap.reLoadLayout(function () {
                                    environment.modifyObj = $.extend(true, {}, environment.emptyModifyObj);
                                    var squares = actionMap.squares,
                                        colors = environment.defaultColors = {};
                                    for (var i in squares) colors[i] = squares[i].color0;
                                    renderModifyTable();
                                });
                            });
                            actionMap.setEvents();
                        });
                    });
                });
            });
        }
    };


    formWrapper.find('.acceptChanges').off('click').on('click', function () {
        if ($(this).hasClass('disabled')) return;
        return bootbox.prompt({
            title: 'Эта операция вснесёт серьёзные правки в существующие квоты! Чтобы подтвердить, введите "ОК"',
            buttons: {
                confirm: {
                    label: "Принять",
                    assName: "green",
                    callback: function() {}
                },
                cancel: {
                    label: "Отменить",
                    className: "red",
                    callback: function() {}
                }
            },
            callback: function(result) {
                if (result === null) {

                } else if(result == "OK" || result == "ОК") {
                    var totalCb = +!!objLen(environment.modifyObj.toDel.squares) + +!!(objLen(environment.modifyObj) - 1),
                        curCb = 0,
                        operationId,
                        tryToReload = function (res) {
                            if (res) operationId = res.operation_id;

                            if (++curCb == totalCb) socketQuery({
                                command: 'operation',
                                object: 'apply_ext_quota_operation',
                                params: {
                                    ext_quota_operation_id: operationId
                                }
                            }, function () {
                                environment.loadMap();
                            });
                        },
                        obj = environment.modifyObj,
                        addIds = {ids: [], prices: []},
                        delIds = [];
                    for (var i in obj) {
                        var group = obj[i], squares = group.squares,
                            type = group.type,
                            price = group.title;
                        for (var j in squares) {
                            if (type == 'toDel') {
                                delIds.push(j);
                            } else {
                                addIds.ids.push(j);
                                addIds.prices.push(price);
                            }
                        }
                    }
                    if (addIds.ids.length) {
                        socketQuery({
                            command: 'operation',
                            object: 'ext_quota_open',
                            params: {
                                action_id: formInstance.action_id,
                                ext_quota_id: formInstance.active_quote,
                                action_scheme_id_list: addIds.ids.join('|!|'),
                                price_list: addIds.prices.join('|!|')
                            }
                        }, function (res) {
                            tryToReload(socketParse(res));
                        });
                    }
                    if (delIds.length) {
                        socketQuery({
                            command: 'operation',
                            object: 'ext_quota_return',
                            params: {
                                action_id: formInstance.action_id,
                                all: 'FALSE',
                                action_scheme_id_list: delIds.join(',')
                            }
                        }, function (res) {
                            socketParse(res);
                            tryToReload();
                        });
                    }
                }
            }
        });
    });
    formWrapper.find('.add_price_group').off('click').on('click', function () {
        var rnd = 'bb' + +(new Date()),
            obj = environment.modifyObj;
        bootbox.dialog({
            title: 'Введите цену для новой группы',
            message: '<input class="form-control" id="' + rnd + '">',
            buttons: {
                success: {
                    label: 'Создать',
                    className: '',
                    callback: function () {
                        var val = parseInt($('#' + rnd).val());
                        val = isNaN(val) ? '0' : val.toString();
                        if (obj[val] === undefined) obj[val] = {'type': 'price', 'title': val, 'squares': {}};
                        renderModifyTable();
                        formWrapper.find('.group.price[data-val="' + val + '"]').click();
                    }
                },
                cancel: {
                    label: 'Отмена',
                    className: '',
                    callback: function () {
                    }
                }
            }
        });
    });

    setHeights(true);


//	formWrapper.find('.return_all_quota').off('click').on('click', function () {
//		if ($(this).hasClass('disabled')) return;
//		var rand = Date.now();
//		bootbox.dialog({
//			message: '<p>Если вы уверены, что хотите вернуть ВСЕ КВОТЫ, введите слово <b>СОГЛАСЕН</b></p><input id="bbx' + rand + '">',
//			title: "Внимание!",
//			buttons: {
//				yes_btn: {
//					label: "Да, уверен",
//					className: "green",
//					callback: function () {
//						if ($('#bbx' + rand).val().trim().toLowerCase() != 'согласен') {
//							toastr.info('Вы ввели неверную фразу для подтверждения возврата квот')
//							return;
//						}
//						var o = {
//							command: 'operation',
//							object: 'ext_quota_return',
//							params: {
//								action_id: formInstance.action_id,
//								all: 'TRUE'
//							}
//						};
//						socketQuery(o, function (res) {
//							socketParse(res);
//							formInstance.reload();
//						});
//					}
//				},
//				cancel: {
//					label: "Отмена",
//					className: "blue"
//				}
//			}
//		});
//	});
}());

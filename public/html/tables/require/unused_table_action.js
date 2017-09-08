(function () {
//По каждому пункту меню:
	//- Доступно если:
	// А) Все выбранные строки соответсвуют условиям
	// Б) Некоторые из выбранных строк соответствуют уловиям
	// В) Игнорировать выделение, смотреть соответствие только для выбранного пункта
	// Г) ... что-то еще
	//- Выполняется для:
	// А) всех доступных к выполнению
	// Б) Выбранный пункт
	// В) ... что-то еще
	// Г) описание происходящего если оно "необычное"

	var tableNId = $('.page-content-wrapper .classicTableWrap').data('id');
	var tableInstance = MB.Tables.getTable(tableNId);
	tableInstance.ct_instance.ctxMenuData = [
		{
			name: 'option1',
			title: 'Открыть в форме', // a,a
			disabled: function () {
				return false;
			},
			callback: function () {
				var row = tableInstance.ct_instance.selectedRowIndex;
				var type = tableInstance.data.data[row]['ACTION_TYPE'];
				var id = tableInstance.data.data[row]['ACTION_ID'];
				var label = tableInstance.data.data[row]['NAME'];
				if (type == 'EXT_QUOTA') {
					MB.Core.switchModal({
						type: "form",
						name: "form_action_ext_quota",
						isNewModal: true,
						ids: [id],
						params: {
							action_id: id,
							label: label + ' (Внешние квоты)'
						}
					});
				} else {
					tableInstance.openRowInModal();
				}
			}
		},
		{
			name: 'option2',
			title: 'Создать схему мероприятия',//б,а
			disabled: function () {

				var c = tableInstance.ct_instance.isDisabledCtx({
					col_names:  ['ACTION_SCHEME_CREATED', 'ACTION_TYPE', 'ACTION_INTEGRATION_TYPE'],
					matching:   ['equal', 'not_equal', 'equal'],
					col_values: ['FALSE', 'ACTION_WO_PLACES', 'ACTION']
				});

				return !~c.indexOf(true);
			},
			callback: function () {

				var c = tableInstance.ct_instance.isDisabledCtx({
						col_names: ['ACTION_SCHEME_CREATED', 'ACTION_TYPE', 'ACTION_INTEGRATION_TYPE'],
						matching: ['equal', 'not_equal', 'not_equal'],
						col_values: ['FALSE', 'ACTION_WO_PLACES', 'MULTIBOOKER']
					}),
					d = tableInstance.ct_instance.selection2.data,
					rows = [];

				for (var i in c) if (c[i]) rows.push(d[i]);

				if (rows.length) createScheme(rows);

				function createScheme(rows) {
					var el = rows.splice(0, 1)[0];

					bootbox.dialog({
						message: "Подтвердите создание схемы мероприятия " + el['NAME'],
						title: "Создание схемы мероприятия",
						buttons: {
							ok: {
								label: "Создать схему",
								className: "yellow",
								callback: function () {
									var id = el['ACTION_ID'];
									var o = {
										command: 'operation',
										object: 'create_action_scheme',
										params: {
											action_id: id
										}
									};
									tableInstance.ct_instance.notify({
										type: true,
										text: 'Идет процесс создания схемы мероприятия...'
									});
									socketQuery(o, function (res) {
										socketParse(res);
										tableInstance.ct_instance.notify({type: false});
										if (rows.length) createScheme(rows);
										else tableInstance.reload();
									});
								}
							},
							cancel: {
								label: "Отмена",
								className: "blue",
								callback: function () {
									if (rows.length) createScheme(rows);
									else tableInstance.reload();
								}
							}
						}
					});
				}
			}
		},
		{
			name: 'option3',
			title: 'Создать / редактирвать входные билеты',
			disabled: function () {

//				var c1 = tableInstance.ct_instance.isDisabledCtx({
//						col_names: ['ACTION_TYPE', 'ACTION_INTEGRATION_TYPE'],
//						matching: ['equal', 'not_equal'],
//						col_values: ['ACTION_WO_PLACES', 'MULTIBOOKER']
//					}),
//					c2 = tableInstance.ct_instance.isDisabledCtx({
//						col_names: ['ACTION_SCHEME_CREATED', 'ACTION_INTEGRATION_TYPE'],
//						matching: ['equal', 'not_equal'],
//						col_values: ['FALSE', 'MULTIBOOKER']
//					}),
//					c = [];
//
//				for (var i in c1) c.push(c1[i] || c2[i]);
//
//				return !~c.indexOf(true);
			},
			callback: function () {
                var row = tableInstance.ct_instance.selectedRowIndex;
                var pk = tableInstance.data.data[row][tableInstance.profile.extra_data.object_profile.primary_key];

                console.log(pk);

                MB.Core.switchModal({
                    type: 'form',
                    filename: 'form_action_scheme_ticket_zone',
                    isNewModal: true,
                    ids: [pk],
                    name: 'form_action_scheme_ticket_zone'
                }, function(res){

                });

//				var c1 = tableInstance.ct_instance.isDisabledCtx({
//						col_names: ['ACTION_TYPE', 'ACTION_INTEGRATION_TYPE'],
//						matching: ['equal', 'not_equal'],
//						col_values: ['ACTION_WO_PLACES', 'MULTIBOOKER']
//					}),
//					c2 = tableInstance.ct_instance.isDisabledCtx({
//						col_names: ['ACTION_SCHEME_CREATED', 'ACTION_INTEGRATION_TYPE'],
//						matching: ['equal', 'not_equal'],
//						col_values: ['FALSE', 'MULTIBOOKER']
//					}),
//					c = [],
//					d = tableInstance.ct_instance.selection2.data,
//					rows = [];
//
//				for (var i in c1) c.push(c1[i] || c2[i]);
//				for (var i in c) if (c[i]) rows.push(d[i]);
//
//				if (rows.length) createSchemeWOPlaces(rows);
//
//				function createSchemeWOPlaces(rows) {
//					var el = rows.splice(0, 1)[0];
//
//					var id = el['ACTION_ID'];
//					var formId = MB.Core.guid();
//					var form = new MB.FormN({
//						id: formId,
//						name: 'form_action_scheme_ticket_zone',
//						type: 'form',
//						ids: [id]
//					});
//
//					form.create(function () {
//						var modal = MB.Core.modalWindows.windows.getWindow(formId);
//						$(modal).on('close', function () {
//							if (rows.length) createSchemeWOPlaces(rows);
//							else tableInstance.reload();
//						});
//					});
//				}
			}
		},
		{
			name: 'option4',
			title: 'Удалить схему мероприятия',//б,а
			disabled: function () {
				var c = tableInstance.ct_instance.isDisabledCtx({
					col_names: ['ACTION_SCHEME_CREATED', 'ACTION_INTEGRATION_TYPE'],
					matching: ['equal', 'not_equal'],
					col_values: ['TRUE', 'MULTIBOOKER']
				});

				return !~c.indexOf(true);
			},
			callback: function () {

				var c = tableInstance.ct_instance.isDisabledCtx({
						col_names: ['ACTION_SCHEME_CREATED', 'ACTION_INTEGRATION_TYPE'],
						matching: ['equal', 'not_equal'],
						col_values: ['TRUE', 'MULTIBOOKER']
					}),
					d = tableInstance.ct_instance.selection2.data,
					rows = [];

				for (var i in c) if (c[i]) rows.push(d[i]);

				var mess = (rows.length > 1) ? "Вы уверены что хотите удалить схемы выбранных мероприятий?" : "Вы уверены что хотите удалить схему мероприятия?";

				bootbox.dialog({
					message: mess,
					title: "Подтверждение",
					buttons: {
						ok: {
							label: "Удалить",
							className: "yellow",
							callback: function () {
								var count = 1;
								tableInstance.ct_instance.notify({
									type: true,
									text: 'Идет процесс удаления схемы мероприятия...'
								});
								for (var i in rows) {
									var id = rows[i]['ACTION_ID'];

									var o = {
										command: 'operation',
										object: 'delete_action_scheme',
										params: {
											action_id: id
										}
									};

									socketQuery(o, function (res) {
										socketParse(res);
										if (count == rows.length) {
											tableInstance.ct_instance.notify({type: false});
											tableInstance.reload();
										}
										count++;
									});
								}
							}
						},
						cancel: {
							label: "Отмена",
							className: "blue",
							callback: function () {

							}
						}
					}
				});
			}
		},
		{
			name: 'option5',
			title: 'Удалить схему мероприятия [БЕЗ ПРОВЕРКИ БИЛЕТОВ!]',//б,а
			disabled: function () {
				var sel = tableInstance.ct_instance.selectedRowIndex;
				var ACTION_INTEGRATION_TYPE = tableInstance.data.data[sel]['ACTION_INTEGRATION_TYPE'];
				var ACTION_SCHEME_CREATED = tableInstance.data.data[sel]['ACTION_SCHEME_CREATED'];
				return ACTION_INTEGRATION_TYPE == 'MULTIBOOKER' || !((ACTION_SCHEME_CREATED == "TRUE"));
			},
			callback: function () {
				var sel = tableInstance.ct_instance.selectedRowIndex;
				var ACTION_ID = tableInstance.data.data[sel]['ACTION_ID'];

                bootbox.dialog({
                    title: 'Удаление схемы мероприятия',
                    message: 'ВНИМАНИЕ! Это системная функция не пользуйтесь ей если не уверены в том, что оно вам действительно необходимо!',
                    buttons: {
                        success: {
                            label: 'Подтвердить',
                            callback: function(){
                                tableInstance.ct_instance.notify({
                                    type: true,
                                    text: 'Идет процесс удаления схемы мероприятия...'
                                });
                                var o = {
                                    command: 'operation',
                                    object: 'delete_action_scheme_admin',
                                    params: {
                                        action_id: ACTION_ID
                                    }
                                };

                                socketQuery(o, function (res) {
                                    socketParse(res);
                                    tableInstance.ct_instance.notify({type: false});
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
			name: 'option10',
			title: 'Перейти к перераспределению',//в,б
			disabled: function () {
				var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];
				return  row['ACTION_INTEGRATION_TYPE'] == 'MULTIBOOKER' || row['ACTION_SCHEME_CREATED'] == 'FALSE' || row['ACTION_TYPE'] == 'ACTION_WO_PLACES';
			},
			callback: function () {
				var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];
				var id = row['ACTION_ID'];
				var title = row['NAME'] + ' | ' + row['HALL'];
				MB.Core.switchModal({
					type: "content",
					filename: "action_fundZones",
					isNew: true,
					params: {
						action_id: id,
						action: row,
						title: title,
						label: 'Схема перераспределения'
					}
				});
				/*socketQuery({
					command: "get",
					object: "action_scheme_fund_group",
					params: {
						action_id: id
					}
				}, function (res) {
					res = socketParse(res, {subData: true});
					MB.Core.switchModal({
						type: "content",
						filename: "action_fundZones",
						isNew: true,
						params: {
							action_id: id,
							action: row,
							title: title,
							label: 'Схема перераспределения',
							action_scheme_res: res
						}
					});
				});*/

			}
		},
		{
			name: 'option11',
			title: 'Перейти к переоценке',//в,б
			disabled: function () {
				var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];
				return row['ACTION_INTEGRATION_TYPE'] == 'MULTIBOOKER' || row['ACTION_SCHEME_CREATED'] == 'FALSE' || row['ACTION_TYPE'] == 'ACTION_WO_PLACES';
			},
			callback: function () {
				var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];
				var id = row['ACTION_ID'];
				var title = row['NAME'] + ' | ' + row['HALL'];

				MB.Core.switchModal({
					type: "content",
					filename: "action_priceZones",
					isNew: true,
					params: {
						scheme: 'action_scheme',
						zone: 'action',
						action_id: id,
						action: row,
						title: title,
						label: 'Схема переоценки'
					}
				});
			}
		},
		{
			name: 'option7',
			title: 'Перейти к редактору',//в,б
			disabled: function () {
				var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];
				return row['ACTION_SCHEME_CREATED'] == 'FALSE' || row['HALL_SCHEME'] == '' || row['ACTION_TYPE'] == 'ACTION_WO_PLACES';
			},
			callback: function () {
				var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];

				var hall_scheme_id = row['HALL_SCHEME_ID'];
				var action_id = row['ACTION_ID'];
				var hall_id = row['HALL_ID'];

				MB.Core.switchModal({
					type: "content",
					filename: "mapEditorOld",
					isNew: true,
					params: {
						scheme: 'action_scheme',
						id: action_id,
						title: 'Редактор мероприятия:' + action_id
					}
				});
			}
		},
        {
            name: 'option15',
            title: 'Перейти к перегруппировке',//в,б
            disabled: function () {
                var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];
                return  row['ACTION_INTEGRATION_TYPE'] == 'MULTIBOOKER' || row['ACTION_SCHEME_CREATED'] == 'FALSE' || row['ACTION_TYPE'] == 'ACTION_WO_PLACES';
            },
            callback: function () {
                var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];
                var id = row['ACTION_ID'];
                var title = row['NAME'] + ' | ' + row['HALL'];

                MB.Core.switchModal({
                    type: "content",
                    filename: "action_placeGroups",
                    isNew: true,
                    params: {
                        action_id: id,
                        action: row,
                        title: title,
                        label: 'Схема перегруппировки'
                    }
                });
            }
        },
        {
            name: 'option8',
            title: 'Доступ агентов',//в,б
            disabled: function () {
                return false;
                /*var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];
                return row['ACTION_SCHEME_CREATED'] == 'ЕКГУ' || row['HALL_SCHEME'] == '' || row['ACTION_TYPE'] == 'ACTION_WO_PLACES';*/
            },
            callback: function () {
                var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];
                var action_id = row['ACTION_ID'];
                MB.Core.switchModal({
                    type: "form",
                    name: "form_action_access",
                    isNewModal: true,
                    ids: [action_id],
                    params: {
                        action_id: action_id,
                        label: 'Доступ агентов к мероприятию и сервисный сбор'
                    }
                });
            }
        },
        {
            name: 'option9',
            title: 'Сервисный сбор на мероприятие',//в,б
            disabled: function () {
                return false;
                /*var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];
                 return row['ACTION_SCHEME_CREATED'] == 'ЕКГУ' || row['HALL_SCHEME'] == '' || row['ACTION_TYPE'] == 'ACTION_WO_PLACES';*/
            },
            callback: function () {
                var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];
                var action_id = row['ACTION_ID'];
                MB.Core.switchModal({
                    type: "form",
                    name: "form_action_contract_service_fee",
                    isNewModal: true,
                    ids: [action_id],
                    params: {
                        action_id: action_id,
                        label: 'Сервисный сбор на мероприятие'
                    }
                });
            }
        },
        {
            name: 'option12',
            title: 'Скачать баркоды для SKIDATA',//в,б
            disabled: function () {
                var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];
                return row['ACTION_SCHEME_CREATED'] == 'FALSE' || row['HALL_SCHEME'] == '' || row['ACTION_TYPE'] == 'ACTION_WO_PLACES';
            },
            callback: function(){
                var sel = tableInstance.ct_instance.selectedRowIndex;
                var id = tableInstance.data.data[sel]['ACTION_ID'];

                var o = {
                    command: "get",
                    object: "export_action_scheme_skidata",
                    sid: MB.User.sid,
                    params: {
                        action_id: id
                    }
                };
                getFile({o: o, fileName: 'SKIDATA_ACTION_'+id});

            }
        },
        {
            name: 'option13',
            title: 'Скачать ШК в CSV по проданным местам',//в,б
            disabled: function () {
                var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];
                return row['ACTION_SCHEME_CREATED'] == 'FALSE' || row['HALL_SCHEME'] == '';
            },
            callback: function(){
                var sel = tableInstance.ct_instance.selectedRowIndex;
                var id = tableInstance.data.data[sel]['ACTION_ID'];

                var o = {
                    output_format: "xml",
                    command: "get",
                    ext:'csv',
                    object: "export_action_sold_places_barcodes_csv",
                    sid: MB.User.sid,
                    params: {
                        action_id: id
                    }
                };
                getFileAsIs({o: o, fileName: 'SOLD_BARCODES_CSV_'+id});

            }
        },
        {
            name: 'option14',
            title: 'Создать схему зала на основе схемы мероприятия',
            disabled: function () {
                var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];
                return row['ACTION_SCHEME_CREATED'] == 'FALSE' || row['HALL_SCHEME'] == '';
            },
            callback: function(){
                var sel = tableInstance.ct_instance.selectedRowIndex;
                var id = tableInstance.data.data[sel]['ACTION_ID'];

                var o = {
                    command: "operation",
                    object: "create_hall_scheme_from_action",
                    params: {
                        action_id: id,
                        all: '1'//0
                    }
                };

                toastr['info']('Идет процесс создания схемы зала на основе мероприятия № '+id+' ...');

                socketQuery(o, function(res){
                    var jsonRes = JSON.parse(res['results'][0]);
                    var jRes = socketParse(res);

                    console.log(jsonRes);
                    toastr['success']('Cхема зала на основе мероприятия № '+id+' создана, id: '+123);
                });

            }
        }
	];

}());


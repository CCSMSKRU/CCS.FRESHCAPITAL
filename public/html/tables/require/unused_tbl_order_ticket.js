(function () {


	var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);
    var formWrapper = tableInstance.parentObject.container;
    var formInstance = tableInstance.parentObject;
    var totalOrderAmount = formInstance.data.data[0]["TOTAL_ORDER_AMOUNT"];

    var serTblInst;

    for(var i2 in tableInstance.parentObject.tblInstances){
        var item2 = tableInstance.parentObject.tblInstances[i2];
        if(item2.name == 'tbl_order_additional_service'){
            serTblInst = item2;
        }
    }
	var totalTickets = tableInstance.data.data.length;
	var totalAmount = 0;

    function countReservedServices(){
        var res = 0;
        var totalAmount = 0;
        for(var i in serTblInst.data.data){
            var s = serTblInst.data.data[i];
            if(s.STATUS == 'RESERVED' || s.STATUS == 'TO_PAY'){
                res ++;
                totalAmount += parseFloat(s.PRICE);
            }
        }
        formWrapper.find('.reserved-services-total-amount').html(totalAmount + ' руб.');
        formWrapper.find('.total-order-amount-with-services').html('ИТОГО Билеты + Услуги: <b>' + parseFloat(parseFloat(totalAmount) + parseFloat(totalOrderAmount)) + '</b> руб.');
        formInstance.recountTotalTablesValues();
        return res;
    }

	for (var i in tableInstance.data.data) {
		var item = tableInstance.data.data[i];
		var price = item['PRICE'];
		totalAmount += +price;
	}

	tableInstance.ct_instance.ctxMenuData = [
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
			name: 'option2',
			title: function () {
				return (tableInstance.ct_instance.getIndexesByData().length > 1) ? 'Билеты к оплате' : 'Билет к оплате';
			},
			disabled: function () {
				var selArr = tableInstance.ct_instance.getIndexesByData();
				var result = 0;
				for (var i in selArr) {
					var item = tableInstance.ct_instance.data.data[selArr[i]];
					if (item['STATUS'] !== 'RESERVED') {
						result += 1;
					}
				}
				return result > 0;
			},
			callback: function () {
				tableInstance.makeOperation('to_pay_ticket', function(){
                    countReservedServices();
                });
			}
		},
		{
			name: 'option3',
			title: function () {
				return (tableInstance.ct_instance.getIndexesByData().length > 1) ? 'Отменить билеты' : 'Отменить билет';
			},
			disabled: function () {
				var selArr = tableInstance.ct_instance.getIndexesByData();
				var result = 0;
				for (var i in selArr) {
					var item = tableInstance.ct_instance.data.data[selArr[i]];
					if (item['STATUS'] !== 'TO_PAY' && item['STATUS'] !== 'RESERVED') result += 1;
				}
				return result > 0;
			},
			callback: function () {
				tableInstance.makeOperation('cancel_ticket', function(){
                    countReservedServices();
                });
			}
		},
		{
			name: 'option4',
			title: function () {
				return (tableInstance.ct_instance.getIndexesByData().length > 1) ? 'Вернуть билеты' : 'Вернуть билет';
			},
			disabled: function () {
				var selArr = tableInstance.ct_instance.getIndexesByData();
				var result = 0;
				for (var i in selArr) {
					var item = tableInstance.ct_instance.data.data[selArr[i]];
					if (item['STATUS'] !== 'CLOSED' && item['STATUS'] !== 'ON_REALIZATION' && item['STATUS'] !== 'CLOSED_REALIZATION') result += 1;
				}
				return result > 0;
			},
			callback: function () {
				tableInstance.makeOperation('return_ticket', function(){
                    countReservedServices();
                });
			}
		},
		{
			name: 'option5',
			title: function () {
				return (tableInstance.ct_instance.getIndexesByData().length > 1) ? 'Напечатать билеты' : 'Напечатать билет';
			},
			disabled: function () {
				var selArr = tableInstance.ct_instance.getIndexesByData();
				var result = 0;
				for (var i in selArr) {
					var item = tableInstance.ct_instance.data.data[selArr[i]];
					if (item['STATUS'] !== 'TO_PAY' || item['PRINT_STATUS'] !== 'NOT_PRINTED') {
						result += 1;
					}
				}
				return result > 0;
			},
			callback: function () {
				var selArr = tableInstance.ct_instance.getIndexesByData();
				for (var i in selArr) {
					var item = tableInstance.ct_instance.data.data[selArr[i]];
					send('print_ticket', {
						guid: MB.Core.getUserGuid(),
						ticket_id: item['ORDER_TICKET_ID']
					}, function (res) {
						console.log('print_ticket', res);
						tableInstance.reload();
                        countReservedServices();
					});
				}
				//tableInstance.makeOperation('print_ticket');
			}
		},
		{
			name: 'option6',
			title: function () {
				return (tableInstance.ct_instance.getIndexesByData().length > 1) ? 'Забраковать бланки' : 'Забраковать бланк';
			},
			disabled: function () {
				var selArr = tableInstance.ct_instance.getIndexesByData();
				var result = 0;
				for (var i in selArr) {
					var item = tableInstance.ct_instance.data.data[selArr[i]];

					if (item['PRINT_STATUS'] !== 'PRINTED') {
						result += 1;
					} else {
						if (item['STATUS'] !== 'CLOSED' && item['STATUS'] !== 'CLOSED_REALIZATION') result += 1;
					}
				}
				return result > 0;
			},
			callback: function () {
                var sel = tableInstance.ct_instance.selectedRowIndex;
                var pk = tableInstance.data.data[sel][tableInstance.primary_keys[0]];
                var o = {
                    command: 'operation',
                    object: 'defect_blank',
                    params: {}
                };

                o.params[tableInstance.primary_keys[0]] = pk;

                var tpl = '<div>Вы уверены что хотите забраковать бланк:</div><br /><span>Серия: </span><b>{{serial}}</b>&nbsp;&nbsp;&nbsp;<span>Номер: </span><b>{{number}}</b>';
                var mO = {
                    serial: tableInstance.data.data[sel]['SCA_SERIES'],
                    number: tableInstance.data.data[sel]['SCA_NUMBER']
                };
                bootbox.dialog({
                    title: 'Забраковать бланк',
                    message: Mustache.to_html(tpl, mO),
                    buttons: {
                        success: {
                            label: 'Подтверджаю',
                            callback: function(){
                                socketQuery(o, function(res){
                                    var jRes = socketParse(res);
                                    tableInstance.reload();
                                    countReservedServices();
                                });
                            }
                        },
                        error: {
                            label: 'Отмена',
                            callback: function(){}
                        }
                    }
                });
			}
		},
		{
			name: 'option7',
			title: function () {
				return (tableInstance.ct_instance.getIndexesByData().length > 1) ? 'Забраковать билеты' : 'Забраковать билет';
			},
			disabled: function () {
				var selArr = tableInstance.ct_instance.getIndexesByData();
				var result = 0;
				for (var i in selArr) {
					var item = tableInstance.ct_instance.data.data[selArr[i]];
					if (item['STATUS'] !== 'CLOSED' && item['STATUS'] !== 'PAID') result += 1;
				}
				return result > 0;
			},
			callback: function () {
				tableInstance.makeOperation('defect_blank', function(){
                    countReservedServices();
                });
			}
		},
        {
            name: 'option8',
            title: function () {
                return (tableInstance.ct_instance.getIndexesByData().length > 1) ? 'Закрыть квоту' : 'Закрыть квоту';
            },
            disabled: function () {
                var selArr = tableInstance.ct_instance.getIndexesByData();
                var result = 0;
                for (var i in selArr) {
                    var item = tableInstance.ct_instance.data.data[selArr[i]];
                    if (item['STATUS'] !== 'ON_REALIZATION') result += 1;
                }
                return result > 0;
            },
            callback: function () {
                tableInstance.makeOperation('close_realization_ticket', function(){
                    countReservedServices();
                });
            }
        },
        {
            name: 'option9',
            title: function () {
                return (tableInstance.ct_instance.getIndexesByData().length > 1) ? 'Выставить проход' : 'Выставить проход';
            },
            disabled: function () {
                var selArr = tableInstance.ct_instance.getIndexesByData();
                var result = 0;
                for (var i in selArr) {
                    var item = tableInstance.ct_instance.data.data[selArr[i]];
                    if (item['STATUS'] !== 'CLOSED_REALIZATION' && item['STATUS'] !== 'CLOSED'
                        && item['STATUS'] !== 'PAID' && item['STATUS'] !== 'ON_REALIZATION') result += 1;
                }
                return result > 0;
            },
            callback: function () {
                var selArr = tableInstance.ct_instance.getIndexesByData();
                var square_list = '';
                for (var i in selArr) {
                    var item = tableInstance.ct_instance.data.data[selArr[i]];
                    square_list += item['ACTION_SCHEME_ID'] + ",";
                }
                square_list = square_list.slice(0, -1);

                socketQuery({
                    command: "operation",
                    object: "set_enter_in_hall_status_entered_for_place",
                    params: {
                        ACTION_SCHEME_ID: square_list
                    }
                }, function (data) {
                    socketParse(data);
                });
            }
        },
        {
            name: 'option10',
            title: function () {
                return (tableInstance.ct_instance.getIndexesByData().length > 1) ? 'Отменить проход' : 'Отменить проход';
            },
            disabled: function () {
                var selArr = tableInstance.ct_instance.getIndexesByData();
                var result = 0;
                for (var i in selArr) {
                    var item = tableInstance.ct_instance.data.data[selArr[i]];
                    if (item['STATUS'] !== 'CLOSED_REALIZATION' && item['STATUS'] !== 'CLOSED'
                        && item['STATUS'] !== 'PAID' && item['STATUS'] !== 'ON_REALIZATION') result += 1;
                }
                return result > 0;
            },
            callback: function () {
                var selArr = tableInstance.ct_instance.getIndexesByData();
                var square_list = '';
                for (var i in selArr) {
                    var item = tableInstance.ct_instance.data.data[selArr[i]];
                    square_list += item['ACTION_SCHEME_ID'] + ",";
                }
                square_list = square_list.slice(0, -1);

                socketQuery({
                    command: "operation",
                    object: "set_enter_in_hall_status_not_entered_for_place",
                    params: {
                        ACTION_SCHEME_ID: square_list
                    }
                }, function (data) {
                    socketParse(data);
                });
            }
        },
        {
            name: 'option11',
            title: 'Добавить услуги',
            disabled: function () {
                var c1 = tableInstance.ct_instance.isDisabledCtx({
                    col_names: ['STATUS','STATUS','STATUS'],
                    matching: ['equal','equal','equal'],
                    col_values: ['CLOSED','TO_PAY','RESERVED']
                });
                return c1[0];
            },
            callback: function () {
                var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];
                var id = row['ORDER_TICKET_ID'];

                var o = {
                    command: 'get',
                    object: 'avalible_additional_service_for_order_ticket',
                    params: {
                        order_ticket_id: id
                    }
                };
                socketQuery(o, function(res){
                    var jRes = socketParse(res);
                    var modalId = MB.Core.guid();

                    var tpl = '<div class="modal_'+modalId+'">{{#services}}<div class="one-action-ser-item-wrapper" data-id="{{ACTION_ADDITIONAL_SERVICE_ID}}">' +
                        '<div class="one-action-ser-item-inner">' +
                        '<div class="one-action-ser-item-title">{{ADDITIONAL_SERVICE_NAME}}</div>' +
                        '<div class="one-action-ser-item-price mbw-unsel">{{PRICE}} руб.</div>' +
                        '<div class="one-action-ser-item-count mbw-unsel" data-serid="{{ACTION_ADDITIONAL_SERVICE_ID}}">0</div>' +
                        '<div class="one-action-ser-item-minus mbw-unsel one-action-disabled" data-serid="{{ACTION_ADDITIONAL_SERVICE_ID}}"><i class="fa fa-minus"></i></div>' +
                        '<div class="one-action-ser-item-plus mbw-unsel" data-serid="{{ACTION_ADDITIONAL_SERVICE_ID}}"><i class="fa fa-plus"></i></div>' +
                        '</div></div>{{/services}}</div>';
                    var mO = {
                        services: jRes
                    };
                    var wrapper;
                    var count;

                    bootbox.dialog({
                        title: "Добавить услуги",
                        message: Mustache.to_html(tpl,mO),
                        buttons: {
                            success: {
                                label: "Подтвердить",
                                callback: function () {

                                    var addSerArr = [];
                                    var countArr = [];

                                    for(var i=0; i<count.length;i++){
                                        var c = count.eq(i);

                                        if(parseInt(c.html()) > 0){
                                            addSerArr.push(c.data('serid'));
                                            countArr.push(parseInt(c.html()));
                                        }
                                    }


                                    if(addSerArr.length > 0){
                                        var o = {
                                            command: 'operation',
                                            object: 'add_order_additional_service',
                                            params: {
                                                action_additional_service_id:   addSerArr.join(','),
                                                order_ticket_id:                id,
                                                service_count:                  countArr.join(',')
                                            }
                                        };

                                        socketQuery(o, function(res){
                                            var jRes = JSON.parse(res)['results'][0];

                                            if(!serTblInst){
                                                for(var i in tableInstance.parentObject.tblInstances){
                                                    var item = tableInstance.parentObject.tblInstances[i];
                                                    if(item.name == 'tbl_order_additional_service'){
                                                        serTblInst = item;
                                                    }
                                                }
                                            }

                                            serTblInst.reload(function(){
                                                if(countReservedServices() > 0){
                                                    formWrapper.find('.pay-reserved-services').removeClass('disabled');
                                                }else{
                                                    formWrapper.find('.pay-reserved-services').addClass('disabled');
                                                }
                                            });
                                        });
                                    }


                                }
                            },
                            cancel: {
                                label: "Отмена",
                                className: "blue"
                            }
                        }
                    });

                    wrapper = $('.modal_'+modalId);
                    var plus = wrapper.find('.one-action-ser-item-plus');
                    var minus = wrapper.find('.one-action-ser-item-minus');
                    count = wrapper.find('.one-action-ser-item-count');

                    function getAs(id){
                        for(var i in jRes){
                            var item = jRes[i];
                            if(item['ACTION_ADDITIONAL_SERVICE_ID'] == id){
                                return item;
                            }
                        }
                        return false;
                    }

                    function disabledBtns(){
                        for(var i=0; i< minus.length; i++){
                            var mBtn = minus.eq(i);
                            var ser = mBtn.parents('.one-action-ser-item-wrapper').eq(0);
                            var count = parseInt(ser.find('.one-action-ser-item-count').html());
                            var id = mBtn.data('serid');

                            if(count > 0){
                                mBtn.removeClass('one-action-disabled');
                            }else{
                                mBtn.addClass('one-action-disabled');
                            }
                        }

                        for(var k=0; k< plus.length; k++){
                            var pBtn = plus.eq(k);
                            var pSer = pBtn.parents('.one-action-ser-item-wrapper').eq(0);
                            var pCount = parseInt(pSer.find('.one-action-ser-item-count').html());
                            var pId = pBtn.data('serid');

                            if(pCount < getAs(pId)['QUANTITY']){
                                pBtn.removeClass('one-action-disabled');
                            }else{
                                pBtn.addClass('one-action-disabled');
                            }
                        }
                    }

                    plus.off('click').on('click', function(){
                        if($(this).hasClass('one-action-disabled')){return false;}

                        var count = $(this).parents('.one-action-ser-item-wrapper').eq(0).find('.one-action-ser-item-count').eq(0);
                        count.html(parseInt(count.html()) + 1);
                        disabledBtns();
                    });

                    minus.off('click').on('click', function(){
                        if($(this).hasClass('one-action-disabled')){return false;}

                        var count = $(this).parents('.one-action-ser-item-wrapper').eq(0).find('.one-action-ser-item-count').eq(0);
                        count.html(parseInt(count.html()) - 1);
                        disabledBtns();
                    });



                });


            }
        }
	];

	tableInstance.ct_instance.totalValues = [
		{
			key: 'Билетов',
			value: totalTickets
		},
		{
			key: 'На сумму',
			value: totalAmount + ' руб.'
		}
	];

	var totalValues = '';
	if (tableInstance.ct_instance.totalValues) {
		totalValues += '(';
		for (var i in tableInstance.ct_instance.totalValues) {
			var k = tableInstance.ct_instance.totalValues[i]['key'];
			var v = tableInstance.ct_instance.totalValues[i]['value'];
			totalValues += k + ': ' + v + ((i == tableInstance.ct_instance.totalValues.length - 1) ? '' : ';');
		}
		totalValues += ')';
	}

//	tableInstance.wrapper.find('.ct-total-values-wrapper').html(totalValues);

	return;


	var instance = MB.O.tables["tbl_order_ticket"];
	if (instance) {
		var parent = MB.O.forms["form_order"];
		instance.custom = function (callback) {
			var handsontableInstance = instance.$container.find(".handsontable").handsontable("getInstance");
			handsontableInstance.updateSettings({contextMenu: false});
			handsontableInstance.updateSettings({
				contextMenu: {
					callback: function (key, options) {
						var arr, data, handsontableInstance, i, value, _i, _len;
						switch (key) {
							case "openInModal":
								MB.Table.createOpenInModalContextMenuItem(instance, key, options);
								break;
							case "goToPay":
								var handsontableInstance = instance.$container.find(".handsontable").handsontable("getInstance");
								var selectedRows = MB.Table.getSelectedRowsInterval(handsontableInstance);
								for (var i = selectedRows[0]; i <= selectedRows[1]; ++i) {
									var ticketId = instance.data.data[i]["ORDER_TICKET_ID"];
									var o = {
										command: "operation",
										object: "to_pay_ticket"
									}
									o["ORDER_TICKET_ID"] = ticketId;
									sendQueryForObj(o);
								}
								break;
							case "goToCancel":
								var handsontableInstance = instance.$container.find(".handsontable").handsontable("getInstance");
								var selectedRows = MB.Table.getSelectedRowsInterval(handsontableInstance);
								for (var i = selectedRows[0]; i <= selectedRows[1]; ++i) {
									var ticketId = instance.data.data[i]["ORDER_TICKET_ID"];
									bootbox.dialog({
										message: 'Вы уверены?',
										title: "Отмена заказа",
										buttons: {
											ok: {
												label: "Да, уверен",
												className: "yellow",
												callback: function () {
													var o = {
														command: "operation",
														object: "cancel_ticket"
													};
													o["ORDER_TICKET_ID"] = ticketId;
													sendQueryForObj(o);
												}
											},
											cancel: {
												label: "Отменить",
												className: "blue",
												callback: function () {
												}
											}
										}
									});


								}
								break;
							case "goToReturn":
								var handsontableInstance = instance.$container.find(".handsontable").handsontable("getInstance");
								var selectedRows = MB.Table.getSelectedRowsInterval(handsontableInstance);
								for (var i = selectedRows[0]; i <= selectedRows[1]; ++i) {
									var ticketId = instance.data.data[i]["ORDER_TICKET_ID"];
									var o = {
										command: "operation",
										object: "return_ticket"
									};
									o["ORDER_TICKET_ID"] = ticketId;
									sendQueryForObj(o);
								}
								break;
							case "goToPrint":
								var handsontableInstance = instance.$container.find(".handsontable").handsontable("getInstance");
								var selectedRows = MB.Table.getSelectedRowsInterval(handsontableInstance);
								for (var i = selectedRows[0]; i <= selectedRows[1]; ++i) {
									var ticketId = instance.data.data[i]["ORDER_TICKET_ID"];
									/* var o = {
									 command: "operation",
									 object: "print_ticket",
									 sid: MB.User.sid
									 };
									 o["ORDER_TICKET_ID"] = ticketId;
									 sendQueryForObj(o);*/
									send('print_ticket', {guid: MB.Core.getUserGuid(), ticket_id: ticketId}, function (result) {
										instance.reload('data');

									});
								}
								break;
							case "goToDefectBlank":
								var handsontableInstance = instance.$container.find(".handsontable").handsontable("getInstance");
								var selectedRows = MB.Table.getSelectedRowsInterval(handsontableInstance);
								var ticketNumber = instance.data.data[selectedRows[0]]["SCA_NUMBER"];

								var instance2 = parent;
								var defectTypes = undefined;
								var series = undefined;
								var removeBtnHtml = '<div class="removeRow"><i class="fa fa-times"></i></div>';
								var o = {
									command: 'get',
									object: 'ticket',
									params: {
										where: "ORDER_ID = " + instance2.activeId + " and STATUS = 'PRINTED'"
									}
								};

								socketQuery({command: "get", object: "ticket_defect_type"}, function (result) {
									defectTypes = socketParse(result);

									socketQuery({
										command: "get",
										object: "ticket_pack_series_lov"
									}, function (seriesRes) {
										series = socketParse(seriesRes);

										socketQuery(o, function (res) {
											res = socketParse(res);

											var thHtml = '<div class="row"><div class="col-md-5">Билет</div><div class="col-md-6">Причина брака</div></div>';
											var thHtml2 = '<div class="row"><div class="col-md-3">Серия</div><div class="col-md-3">Номер</div><div class="col-md-5">Причина брака</div></div>';
											var musObj = {
												seriesOptions: [],
												defectTypeOptions: [],
												series: [],
												isAvaliableAdd: res.length > 1,
												isAvaliableRemove: true
											};
											var tpl = '<div class="row posRel marBot5 rejectRow">' +
												'<div class="col-md-5">' +
												'<div class="form-group">' +
												'<select class="bsoSeriesList form-control">{{#seriesOptions}}<option {{isSelected}} data-series="{{serial}}" data-number="{{number}}" value="{{id}}">{{serial}} - {{number}}</option>{{/seriesOptions}}</select>' +
												'</div>' +
												'</div>' +
												'<div class="col-md-6">' +
												'<div class="form-group">' +
												'<select class="bsoDefectType form-control">{{#defectTypeOptions}}<option value="{{id}}">{{title}}</option>{{/defectTypeOptions}}</select>' +
												'</div>' +
												'</div>' +
												'{{#isAvaliableAdd}}<div class="addRow"><i class="fa fa-plus"></i></div>{{/isAvaliableAdd}}' +
												'{{#isAvaliableRemove}}<div class="removeRow"><i class="fa fa-times"></i></div>{{/isAvaliableRemove}}' +
												'</div>';

											var tpl2 = '<div class="row posRel marBot5 rejectRow2">' +
												'<div class="col-md-3">' +
												'<div class="form-group">' +
												'<select class="bsoSeriesList2 form-control">' +
												'<option value="-10"> </option>' +
												'{{#series}}<option value="{{id}}">{{title}}</option>{{/series}}' +
												'</select>' +
												'</div>' +
												'</div>' +
												'<div class="col-md-3">' +
												'<div class="form-group">' +
												'<input class="bsoNumber form-control smallInput" type="text"/>' +
												'</div>' +
												'</div>' +
												'<div class="col-md-5">' +
												'<div class="form-group">' +
												'<select class="bsoDefectType2 form-control">{{#defectTypeOptions}}<option value="{{id}}">{{title}}</option>{{/defectTypeOptions}}</select>' +
												'</div>' +
												'</div>' +
												'<div class="addRow"><i class="fa fa-plus"></i></div>' +
												'<div class="removeRow"><i class="fa fa-times"></i></div>' +
												'</div>';

											for (var i in res) {
												var item = res[i];
												var tmpObj = {
													isSelected: (item['SCA_NUMBER'] == ticketNumber) ? 'selected' : '',
													id: item['TICKET_ID'],
													serial: item['SCA_SERIES'],
													number: item['SCA_NUMBER']
												};
												musObj.seriesOptions.push(tmpObj);
											}
											for (var k in defectTypes) {
												var kItem = defectTypes[k];
												var kTmpObj = {
													id: defectTypes[k].TICKET_DEFECT_TYPE_ID,
													title: defectTypes[k].TICKET_DEFECT_TYPE
												};
												musObj.defectTypeOptions.push(kTmpObj);
											}

											for (var j in series) {
												var jItem = series[j];
												var jObj = {
													id: jItem.SCA_SERIES,
													title: jItem.SCA_SERIES
												};
												musObj.series.push(jObj);
											}

											bootbox.dialog({
												message: (musObj.seriesOptions.length > 0) ? thHtml + Mustache.to_html(tpl, musObj) + thHtml2 + Mustache.to_html(tpl2, musObj) : thHtml2 + Mustache.to_html(tpl2, musObj),
												title: "Забраковать БСО",
												buttons: {
													ok: {
														label: "Подтвердить",
														className: "yellow",
														callback: function () {
															var sendObj = [];
															var iterator = 0;

															function sendReject(iterator) {
																if (iterator >= sendObj.length) {
																	return;
																}
																var o = {
																	command: 'operation',
																	object: 'defect_blank_by_number',
																	params: sendObj[iterator]
																};
																socketQuery(o, function (res) {
																	if (socketParse(res)) {
																		iterator++;
																		sendReject(iterator);
																	}
																});
															}

															function validate(str, type) {
																var regExp = new RegExp('/^$|\s+');
																return regExp.test(str);
															}

															for (var i = 0; i < $('.rejectRow').length; i++) {
																var row = $('.rejectRow').eq(i);
																var series = row.find('select.bsoSeriesList option:selected').data('series');
																var number = row.find('select.bsoSeriesList option:selected').data('number');
																var type = row.find('.bsoDefectType');

																var tmpObj = {
																	sca_series: series,
																	sca_number: number,
																	ticket_defect_type_id: type.select2('val')
																};

																sendObj.push(tmpObj);
															}
															for (var k = 0; k < $('.rejectRow2').length; k++) {
																var kRow = $('.rejectRow2').eq(k);
																var kSeries = kRow.find('.bsoSeriesList2').select2('val');
																var kNumber = kRow.find('.bsoNumber').val();
																var kType = kRow.find('.bsoDefectType2').select2('val');

																var kObj = {
																	sca_series: kSeries,
																	sca_number: kNumber,
																	ticket_defect_type_id: kType
																};

																if (kObj.sca_series == '-10' || kObj.sca_number == '' || kObj.sca_number == ' ') {
																	continue;
																}

																sendObj.push(kObj);
															}
															sendReject(iterator);
															instance2.reload('data');
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


											$('.bsoSeriesList').parents('.bootbox.modal').eq(0).removeAttr('tabindex');
											$('.bsoSeriesList, .bsoDefectType').select2();
											$('.bsoSeriesList2, .bsoDefectType2').select2();


											function setHandlers() {
												$('.rejectRow').removeClass('underline');
												$('.rejectRow:last').addClass('underline');
												$('.rejectRow .addRow').off('click').on('click', function () {
													var container = $(this).parents('.bootbox-body');
													if (container.find('.rejectRow').length >= res.data.length) {
														return;
													}
													container.find('.rejectRow:last').after(Mustache.to_html(tpl, musObj));
													$(this).before(removeBtnHtml);
													$(this).remove();

													$('.bsoSeriesList:last, .bsoDefectType:last').select2();
													//                                populateSelects(function(){
													//                                    setHandlers();
													//                                });
													setHandlers();
												});
												$('.rejectRow .removeRow').off('click').on('click', function () {
													var container = $(this).parents('.bootbox-body');
													$(this).parents('.row').eq(0).remove();
													container.find('.rejectRow:last').find('.addRow').remove();
													container.find('.rejectRow:last').append('<div class="addRow"><i class="fa fa-plus"></i></div>');
													setHandlers();
												});


												$('.rejectRow2 .addRow').off('click').on('click', function () {
													var container = $(this).parents('.bootbox-body');
													container.find('.rejectRow2:last').after(Mustache.to_html(tpl2, musObj));
													$(this).before(removeBtnHtml);
													$(this).remove();

													$('.bsoSeriesList2:last, .bsoDefectType2:last').select2();
													setHandlers();
												});
												$('.rejectRow2 .removeRow').off('click').on('click', function () {
													var container = $(this).parents('.bootbox-body');
													$(this).parents('.row').eq(0).remove();
													container.find('.rejectRow2:last').find('.addRow').remove();
													container.find('.rejectRow2:last').append('<div class="addRow"><i class="fa fa-plus"></i></div>');
													setHandlers();
												});
											}

											setHandlers();
										});
									});
								});
								break;
							case "goToDefectTicket":
								var handsontableInstance = instance.$container.find(".handsontable").handsontable("getInstance");
								var selectedRows = MB.Table.getSelectedRowsInterval(handsontableInstance);
								for (var i = selectedRows[0]; i <= selectedRows[1]; ++i) {
									var ticketId = instance.data.data[i]["ORDER_TICKET_ID"];
									var o = {
										command: "operation",
										object: "defect_ticket"
									};
									o["ORDER_TICKET_ID"] = ticketId;
									sendQueryForObj(o);
								}
								break;
							case "goToRealization":
								var handsontableInstance = instance.$container.find(".handsontable").handsontable("getInstance");
								var selectedRows = MB.Table.getSelectedRowsInterval(handsontableInstance);
								for (var i = selectedRows[0]; i <= selectedRows[1]; ++i) {
									var ticketId = instance.data.data[i]["ORDER_TICKET_ID"];
									var o = {
										command: "operation",
										object: "on_realization_ticket"
									};
									o["ORDER_TICKET_ID"] = ticketId;
									sendQueryForObj(o);
								}
								break;
							case "goToRealizationPrint":
								console.log('Функция временно не доступна');

								/* send('print_order',{guid:MB.Core.getUserGuid(),order_id:instance.activeId},function(){
								 instance.reload('data');

								 });*/

								/*var handsontableInstance = instance.$container.find(".handsontable").handsontable("getInstance");
								 var selectedRows = MB.Table.getSelectedRowsInterval(handsontableInstance);
								 for(var i = selectedRows[0];i<=selectedRows[1];++i){
								 var ticketId = instance.data.data[i][instance.data.names.indexOf("ORDER_TICKET_ID")];
								 var o = {
								 command: "operation",
								 object: "on_realization_print_ticket",
								 sid: MB.User.sid
								 };
								 o["ORDER_TICKET_ID"] = ticketId;
								 sendQueryForObj(o);
								 }*/
								break;
							case "goToCloseRealization":
								var handsontableInstance = instance.$container.find(".handsontable").handsontable("getInstance");
								var selectedRows = MB.Table.getSelectedRowsInterval(handsontableInstance);
								for (var i = selectedRows[0]; i <= selectedRows[1]; ++i) {
									var ticketId = instance.data.data[i]["ORDER_TICKET_ID"];
									var o = {
										command: "operation",
										object: "close_realization_ticket"
									};
									o["ORDER_TICKET_ID"] = ticketId;
									sendQueryForObj(o);
								}
								break;
						}
					},
					items: {
						openInModal: {
							name: "Открыть в форме"
						},
						goToPay: {
							name: "Билет к оплате",
							disabled: function () {
								var selectedRows = MB.Table.getSelectedRowsInterval(handsontableInstance);
								var disableStatus = false;
								if (selectedRows[0] != selectedRows[1]) {
									var countCallbacks = 0;
									for (var i = selectedRows[0]; i <= selectedRows[1]; ++i) {
										var ticketStatus = instance.data.data[i]["STATUS"];
										if (ticketStatus !== "RESERVED") {
											disableStatus = true
										}

									}
								} else {
									var i = selectedRows[0];
									ticketStatus = instance.data.data[i]["STATUS"];
									if (ticketStatus !== "RESERVED") {
										disableStatus = true
									}
								}
								return disableStatus;
							}
						},
						goToCancel: {
							name: "Отменить билет",
							disabled: function () {
								var selectedRows = MB.Table.getSelectedRowsInterval(handsontableInstance);
								var disableStatus = false;
								if (selectedRows[0] != selectedRows[1]) {
									var countCallbacks = 0;
									for (var i = selectedRows[0]; i <= selectedRows[1]; ++i) {
										var ticketStatus = instance.data.data[i]["STATUS"];
										if (!(ticketStatus === "RESERVED" || ticketStatus === "TO_PAY" || ticketStatus === "PAID")) {
											disableStatus = true;
										}

									}
								} else {
									var i = selectedRows[0];
									var ticketStatus = instance.data.data[i]["STATUS"];
									if (!(ticketStatus === "RESERVED" || ticketStatus === "TO_PAY" || ticketStatus === "PAID")) {
										disableStatus = true;
									}
								}
								return disableStatus;
							}
						},
						goToReturn: {
							name: "Вернуть билет",
							disabled: function () {
								var selectedRows = MB.Table.getSelectedRowsInterval(handsontableInstance);
								var disableStatus = false;
								if (selectedRows[0] != selectedRows[1]) {
									var countCallbacks = 0;
									for (var i = selectedRows[0]; i <= selectedRows[1]; ++i) {
										var ticketStatus = instance.data.data[i]["STATUS"];
										if (!(ticketStatus === "CLOSED" || ticketStatus === "CLOSED_REALIZATION" || ticketStatus === "ON_REALIZATION")) {
											disableStatus = true;
										}

									}
								} else {
									var i = selectedRows[0];
									ticketStatus = instance.data.data[i]["STATUS"];
									if (!(ticketStatus === "CLOSED" || ticketStatus === "CLOSED_REALIZATION" || ticketStatus === "ON_REALIZATION")) {
										disableStatus = true;
									}
								}
								return disableStatus;
							}
						},
						goToPrint: {
							name: "Напечатать билет",
							disabled: function () {
								var selectedRows = MB.Table.getSelectedRowsInterval(handsontableInstance);
								var disableStatus = false;
								if (selectedRows[0] != selectedRows[1]) {
									var countCallbacks = 0;
									for (var i = selectedRows[0]; i <= selectedRows[1]; ++i) {
										var ticketStatus = instance.data.data[i]["STATUS"];
										var ticketPrinted = instance.data.data[i]["PRINTED"];
										log(ticketPrinted)
										log(ticketStatus)
										if (!(ticketStatus == "TO_PAY" || (ticketStatus == "ON_REALIZATION" && ticketPrinted == "NOT_PRINTED") || (ticketStatus == "CLOSED_REALIZATION" && ticketPrinted == "NOT_PRINTED"))) {
											disableStatus = true;
										}

									}
								} else {
									var i = selectedRows[0];
									var ticketStatus = instance.data.data[i]["STATUS"];
									var ticketPrinted = instance.data.data[i]["PRINTED"];
									if (!(ticketStatus == "TO_PAY" || (ticketStatus == "ON_REALIZATION" && ticketPrinted == "NOT_PRINTED") || (ticketStatus == "CLOSED_REALIZATION" && ticketPrinted == "NOT_PRINTED"))) {
										disableStatus = true;
									}
								}
								return disableStatus;
							}
						},
						goToDefectBlank: {
							name: "Забраковать бланк",
							disabled: function () {
								var selectedRows = MB.Table.getSelectedRowsInterval(handsontableInstance);
								var disableStatus = false;
								if (selectedRows[0] != selectedRows[1]) {
									var countCallbacks = 0;
									for (var i = selectedRows[0]; i <= selectedRows[1]; ++i) {
										var ticketStatus = instance.data.data[i]["STATUS"];
										var ticketPrinted = instance.data.data[i]["PRINTED"];
										if (!(ticketStatus == "CLOSED" || (ticketStatus == "ON_REALIZATION" && ticketPrinted == "PRINTED") || (ticketStatus == "CLOSED_REALIZATION" && ticketPrinted == "PRINTED"))) {
											disableStatus = true;
										}

									}
								} else {
									var i = selectedRows[0];
									var ticketStatus = instance.data.data[i]["STATUS"];
									var ticketPrinted = instance.data.data[i]["PRINTED"];
									if (!(ticketStatus == "CLOSED" || (ticketStatus == "ON_REALIZATION" && ticketPrinted == "PRINTED") || (ticketStatus == "CLOSED_REALIZATION" && ticketPrinted == "PRINTED"))) {
										disableStatus = true;
									}
								}
								return disableStatus;
							}
						},
						goToDefectTicket: {
							name: "Забраковать билет",
							disabled: function () {
								var selectedRows = MB.Table.getSelectedRowsInterval(handsontableInstance);
								var disableStatus = false;
								if (selectedRows[0] != selectedRows[1]) {
									var countCallbacks = 0;
									for (var i = selectedRows[0]; i <= selectedRows[1]; ++i) {
										var ticketStatus = instance.data.data[i]["STATUS"];
										var ticketPrinted = instance.data.data[i]["PRINTED"];
										if (!(ticketStatus == "CLOSED" || (ticketStatus == "ON_REALIZATION" && ticketPrinted == "PRINTED") || (ticketStatus == "CLOSED_REALIZATION" && ticketPrinted == "PRINTED"))) {
											disableStatus = true;
										}

									}
								} else {
									var i = selectedRows[0];
									var ticketStatus = instance.data.data[i]["STATUS"];
									var ticketPrinted = instance.data.data[i]["PRINTED"];
									if (!(ticketStatus == "CLOSED" || (ticketStatus == "ON_REALIZATION" && ticketPrinted == "PRINTED") || (ticketStatus == "CLOSED_REALIZATION" && ticketPrinted == "PRINTED"))) {
										disableStatus = true;
									}
								}
								return disableStatus;
							}
						},
						goToRealization: {
							name: "Выдать по квоте",
							disabled: function () {
								var selectedRows = MB.Table.getSelectedRowsInterval(handsontableInstance);
								var parent = instance.parent
								var agentrealizationaccess = parent.data.data[0]["AGENT_REALIZATION_ACCESS"].bool();
								var disableStatus = false;
								if (!agentrealizationaccess) {
									return true;
								}
								if (selectedRows[0] != selectedRows[1]) {
									var countCallbacks = 0;
									for (var i = selectedRows[0]; i <= selectedRows[1]; ++i) {
										var ticketStatus = instance.data.data[i]["STATUS"];
										var ticketPrinted = instance.data.data[i]["PRINTED"];
										if (!(ticketStatus == "TO_PAY")) {
											disableStatus = true;
										}

									}
								} else {
									var i = selectedRows[0];
									var ticketStatus = instance.data.data[i]["STATUS"];
									var ticketPrinted = instance.data.data[i]["PRINTED"];
									if (!(ticketStatus == "TO_PAY")) {
										disableStatus = true;
									}
								}
								return disableStatus;
							}
						},
						goToRealizationPrint: {
							name: "Выдать по квоте и распечатать",
							disabled: function () {
								var selectedRows = MB.Table.getSelectedRowsInterval(handsontableInstance);
								var parent = instance.parent
								var agentrealizationaccess = parent.data.data[0]["AGENT_REALIZATION_ACCESS"].bool();
								var disableStatus = false;
								if (!agentrealizationaccess) {
									return true;
								}
								if (selectedRows[0] != selectedRows[1]) {
									var countCallbacks = 0;
									for (var i = selectedRows[0]; i <= selectedRows[1]; ++i) {
										var ticketStatus = instance.data.data[i]["STATUS"];
										var ticketPrinted = instance.data.data[i]["PRINTED"];
										if (!(ticketStatus == "TO_PAY")) {
											disableStatus = true;
										}

									}
								} else {
									var i = selectedRows[0];
									var ticketStatus = instance.data.data[i]["STATUS"];
									var ticketPrinted = instance.data.data[i]["PRINTED"];
									if (!(ticketStatus == "TO_PAY")) {
										disableStatus = true;
									}
								}
								return disableStatus;
							}
						},
						goToCloseRealization: {
							name: "Закрыть квоту",
							disabled: function () {
								var selectedRows = MB.Table.getSelectedRowsInterval(handsontableInstance);
								var parent = instance.parent
								var agentrealizationaccess = parent.data.data[0]["AGENT_REALIZATION_ACCESS"].bool();
								var disableStatus = false;
								if (!agentrealizationaccess) {
									return true;
								}
								if (selectedRows[0] != selectedRows[1]) {
									var countCallbacks = 0;
									for (var i = selectedRows[0]; i <= selectedRows[1]; ++i) {
										var ticketStatus = instance.data.data[i]["STATUS"];
										var ticketPrinted = instance.data.data[i]["PRINTED"];
										if (!(ticketStatus === "ON_REALIZATION")) {
											disableStatus = true;
										}

									}
								} else {
									var i = selectedRows[0];
									var ticketStatus = instance.data.data[i]["STATUS"];
									var ticketPrinted = instance.data.data[i]["PRINTED"];
									if (!(ticketStatus === "ON_REALIZATION")) {
										disableStatus = true;
									}
								}
								return disableStatus;
							}
						}
					}
				}
			});


			function sendQueryForObj(o) {
				socketQuery(o, function (res) {
					if (socketParse(res)) MB.O.forms["form_order"].reload("data");
				});
			}

			callback();
		};
	}
}());

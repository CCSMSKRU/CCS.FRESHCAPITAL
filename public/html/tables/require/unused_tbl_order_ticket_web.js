(function () {

	var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);
    var formWrapper = tableInstance.parentObject.container;
    var formInstance = tableInstance.parentObject;
    var totalOrderAmount = formInstance.data.data[0]["TOTAL_ORDER_AMOUNT"];
    var serTblInst;

    for(var i in tableInstance.parentObject.tblInstances){
        var item = tableInstance.parentObject.tblInstances[i];
        if(item.name == 'tbl_order_additional_service'){
            serTblInst = item;
        }
    }

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
        return res;
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
			name: 'option3',
			title: 'Вернуть билет',
			disabled: function () {
				var c1 = tableInstance.ct_instance.isDisabledCtx({
					col_names: ['STATUS'],
					matching: ['not_equal'],
					col_values: ['PAID']
				});

				return c1[0];
			},
			callback: function () {
				bootbox.dialog({
					message: "Вы уверены, что хотите вернуть билет?",
					title: "Внимание!",
					buttons: {
						yes_btn: {
							label: "Да, уверен",
							className: "green",
							callback: function () {
								tableInstance.makeOperation('return_ticket_web');
							}
						},
						cancel: {
							label: "Отмена",
							className: "blue"
						}
					}
				});
			}
		},
        {
            name: 'option2',
            title: 'Добавить услуги',
            disabled: function () {
                var c1 = tableInstance.ct_instance.isDisabledCtx({
                    col_names: ['STATUS','STATUS'],
                    matching: ['equal','equal'],
                    col_values: ['PAID','RESERVED']
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

                    console.log(jRes);
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
        },
		{
			name: 'option4',
			title: 'Выставить стаус оплаты на Оплата возвращена',
			disabled: function () {
				var c1 = tableInstance.ct_instance.isDisabledCtx({
					col_names: ['WEB_PAYMENT_STATUS'],
					matching: ['not_equal'],
					col_values: ['PAYMENT_NOT_RETURNED']
				});

				return c1[0];
			},
			callback: function () {
				tableInstance.makeOperation('set_web_payment_status_to_payment_returned');
			}
		},
		{
			name: 'option5',
			title: 'Повторная отмена оплаты по билету',
			disabled: function () {
				var c1 = tableInstance.ct_instance.isDisabledCtx({
					col_names: ['WEB_PAYMENT_STATUS'],
					matching: ['not_equal'],
					col_values: ['PAYMENT_NOT_RETURNED']
				});

				return c1[0];
			},
			callback: function () {
				bootbox.dialog({
					message: "Вы уверены, что хотите отменить билет?",
					title: "Внимание!",
					buttons: {
						yes_btn: {
							label: "Да, уверен",
							className: "green",
							callback: function () {
								tableInstance.makeOperation('return_payment_for_web_ticket');
							}
						},
						cancel: {
							label: "Отмена",
							className: "blue"
						}
					}
				});
			}
		},
		{
			name: 'option6',
			title: 'Выставить статус с "Необходима ручная отмена" на "Возвращен"',
			disabled: function () {
				var c2 = tableInstance.ct_instance.isDisabledCtx({
					col_names: ['STATUS'],
					matching: ['equal'],
					col_values: ['NEED_CANCEL']
				});

				return !~c2.indexOf(true);
			},
			callback: function () {
				tableInstance.makeOperation('set_to_returned_from_need_cancel');
			}
		},
        {
            name: 'option7',
            title: 'Выставить проход',
            disabled: function () {
                var c2 = tableInstance.ct_instance.isDisabledCtx({
                    colNames: ['STATUS', 'STATUS', 'STATUS', 'STATUS'],
                    matching: ['not_equal', 'not_equal', 'not_equal', 'not_equal'],
                    colValues: ['PAID', 'CLOSED', 'ON_REALIZATION', 'CLOSED_REALIZATION']
                });

                return !~c2.indexOf(true);
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
            name: 'option8',
            title: 'Отменить проход',
            disabled: function () {
                var c2 = tableInstance.ct_instance.isDisabledCtx({
                    colNames: ['STATUS', 'STATUS', 'STATUS', 'STATUS'],
                    matching: ['not_equal', 'not_equal', 'not_equal', 'not_equal'],
                    colValues: ['PAID', 'CLOSED', 'ON_REALIZATION', 'CLOSED_REALIZATION']
                });

                return !~c2.indexOf(true);
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
        }
	];


	//tableInstance.ct_instance.ctxMenuData = [
	//	{
	//		name: 'option1',
	//		title: 'Открыть в форме',
	//		disabled: function () {
	//			return false;
	//		},
	//		callback: function () {
	//			tableInstance.openRowInModal();
	//		}
	//	},
	//	{
	//		name: 'option2',
	//		title: function () {
	//			return 'Билет к оплате';
	//		},
	//		disabled: function () {
	//			var c = tableInstance.ct_instance.isDisabledCtx({
	//				col_names: ['STATUS'],
	//				matching: ['equal'],
	//				col_values: ['RESERVED']
	//			});
	//
	//			return !~c.indexOf(true);
	//		},
	//		callback: function () {
	//			tableInstance.makeOperation({
	//				operationName: 'to_pay_ticket',
	//				params: {
	//					col_names: ['STATUS'],
	//					matching: ['equal'],
	//					col_values: ['RESERVED']
	//				},
	//				revert: true
	//			}, function () {
	//				tableInstance.parentObject.reload();
	//			});
	//		}
	//	},
	//	{
	//		name: 'option3',
	//		title: function () {
	//			return 'Отменить билет';
	//		},
	//		disabled: function () {
	//			var c1 = tableInstance.ct_instance.isDisabledCtx({
	//				col_names: ['STATUS'],
	//				matching: ['equal'],
	//				col_values: ['RESERVED']
	//			});
	//			var c2 = tableInstance.ct_instance.isDisabledCtx({
	//				col_names: ['STATUS'],
	//				matching: ['equal'],
	//				col_values: ['TO_PAY']
	//			});
	//			var c = [];
	//			for (var i in c1) c.push(c1[i] || c2[i]);
	//
	//			return !~c.indexOf(true);
	//		},
	//		callback: function () {
	//			bootbox.dialog({
	//				message: "Вы уверены, что хотите отменить выбранные билеты?",
	//				title: "Внимание!",
	//				buttons: {
	//					yes_btn: {
	//						label: "Да, уверен",
	//						className: "green",
	//						callback: function () {
	//							tableInstance.makeOperation({
	//								operationName: 'cancel_ticket',
	//								params: [
	//									{
	//										col_names: ['STATUS'],
	//										matching: ['equal'],
	//										col_values: ['RESERVED']
	//									},
	//									{
	//										col_names: ['STATUS'],
	//										matching: ['equal'],
	//										col_values: ['TO_PAY']
	//									}
	//								],
	//								revert: true
	//							}, function () {
	//								tableInstance.parentObject.reload();
	//							});
	//						}
	//					},
	//					cancel: {
	//						label: "Отмена",
	//						className: "blue"
	//					}
	//				}
	//			});
	//		}
	//	},
	//	{
	//		name: 'option4',
	//		title: function () {
	//			return 'Вернуть билет';
	//		},
	//		disabled: function () {
	//			var c1 = tableInstance.ct_instance.isDisabledCtx({
	//				col_names: ['STATUS'],
	//				matching: ['equal'],
	//				col_values: ['CLOSED']
	//			});
	//			var c2 = tableInstance.ct_instance.isDisabledCtx({
	//				col_names: ['STATUS'],
	//				matching: ['equal'],
	//				col_values: ['ON_REALIZATION']
	//			});
	//			var c3 = tableInstance.ct_instance.isDisabledCtx({
	//				col_names: ['STATUS'],
	//				matching: ['equal'],
	//				col_values: ['CLOSED_REALIZATION']
	//			});
	//			var c = [];
	//			for (var i in c1) c.push(c1[i] || c2[i] || c3[i]);
	//
	//			return !~c.indexOf(true);
	//		},
	//		callback: function () {
	//			bootbox.dialog({
	//				message: "Вы уверены, что хотите вернуть выбранные билеты?",
	//				title: "Внимание!",
	//				buttons: {
	//					yes_btn: {
	//						label: "Да, уверен",
	//						className: "green",
	//						callback: function () {
	//							tableInstance.makeOperation({
	//								operationName: 'return_ticket',
	//								params: [{
	//									col_names: ['STATUS'],
	//									matching: ['equal'],
	//									col_values: ['CLOSED']
	//								}, {
	//									col_names: ['STATUS'],
	//									matching: ['equal'],
	//									col_values: ['ON_REALIZATION']
	//								}, {
	//									col_names: ['STATUS'],
	//									matching: ['equal'],
	//									col_values: ['CLOSED_REALIZATION']
	//								}],
	//								revert: true
	//							}, function () {
	//								tableInstance.parentObject.reload();
	//							});
	//						}
	//					},
	//					cancel: {
	//						label: "Отмена",
	//						className: "blue"
	//					}
	//				}
	//			});
	//		}
	//	},
	//	{
	//		name: 'option5',
	//		title: function () {
	//			return 'Напечатать билет';
	//		},
	//		disabled: function () {
	//			var c = tableInstance.ct_instance.isDisabledCtx({
	//				col_names: ['PRINT_STATUS', 'STATUS'],
	//				matching: ['equal', 'equal'],
	//				col_values: ['NOT_PRINTED', 'TO_PAY']
	//			});
	//
	//			return !~c.indexOf(true);
	//		},
	//		callback: function () {
	//			var d = tableInstance.ct_instance.getFlatSelectionArray(),
	//				c = tableInstance.ct_instance.isDisabledCtx({
	//					col_names: ['PRINT_STATUS', 'STATUS'],
	//					matching: ['equal', 'equal'],
	//					col_values: ['NOT_PRINTED', 'TO_PAY']
	//				});
	//
	//			var selArr = [];
	//			for (var i in c) if (c[i]) selArr.push(d[i]);
	//
	//
	//			for (var i in selArr) {
	//				var item = selArr[i];
	//				send('print_ticket', {
	//					guid: MB.Core.getUserGuid(),
	//					ticket_id: item['ORDER_TICKET_ID']
	//				}, function (res) {
	//					console.log('print_ticket', res);
	//					tableInstance.parentObject.reload();
	//					tableInstance.reload();
	//				});
	//			}
	//		}
	//	},
	//	{
	//		name: 'option6',
	//		title: function () {
	//			return 'Забраковать бланк';
	//		},
	//		disabled: function () {
	//			var c1 = tableInstance.ct_instance.isDisabledCtx({
	//				col_names: ['STATUS', 'PRINT_STATUS'],
	//				matching: ['equal', 'equal'],
	//				col_values: ['CLOSED', 'PRINTED']
	//			});
	//			var c2 = tableInstance.ct_instance.isDisabledCtx({
	//				col_names: ['STATUS', 'PRINT_STATUS'],
	//				matching: ['equal', 'equal'],
	//				col_values: ['CLOSED_REALIZATION', 'PRINTED']
	//			});
	//			var c = [];
	//			for (var i in c1) c.push(c1[i] || c2[i]);
	//
	//			return !~c.indexOf(true);
	//		},
	//		callback: function () {
	//			bootbox.dialog({
	//				message: "Вы уверены, что хотите забраковать бланки?",
	//				title: "Внимание!",
	//				buttons: {
	//					yes_btn: {
	//						label: "Да, уверен",
	//						className: "green",
	//						callback: function () {
	//							tableInstance.makeOperation({
	//								operationName: 'defect_blank',
	//								params: [{
	//									col_names: ['STATUS', 'PRINT_STATUS'],
	//									matching: ['equal', 'equal'],
	//									col_values: ['CLOSED', 'PRINTED']
	//								}, {
	//									col_names: ['STATUS', 'PRINT_STATUS'],
	//									matching: ['equal', 'equal'],
	//									col_values: ['CLOSED_REALIZATION', 'PRINTED']
	//								}],
	//								revert: true
	//							}, function () {
	//								tableInstance.parentObject.reload();
	//							});
	//						}
	//					},
	//					cancel: {
	//						label: "Отмена",
	//						className: "blue"
	//					}
	//				}
	//			});
	//		}
	//	}
	//	,
	//	{
	//		name: 'option7',
	//		title: function () {
	//			return 'Забраковать билет';
	//		},
	//		disabled: function () {
	//			var c1 = tableInstance.ct_instance.isDisabledCtx({
	//				col_names: ['STATUS'],
	//				matching: ['equal'],
	//				col_values: ['CLOSED']
	//			});
	//			var c2 = tableInstance.ct_instance.isDisabledCtx({
	//				col_names: ['STATUS'],
	//				matching: ['equal'],
	//				col_values: ['PAID']
	//			});
	//
	//			var c = [];
	//			for (var i in c1) c.push(c1[i] || c2[i]);
	//
	//			return !~c.indexOf(true);
	//		},
	//		callback: function () {
	//			var rand = Date.now();
	//			bootbox.dialog({
	//				message: '<p>Если вы уверены, что хотите забраковать билеты, введите слово <b>СОГЛАСЕН</b></p><input id="bbx' + rand + '">',
	//				title: "Внимание!",
	//				buttons: {
	//					yes_btn: {
	//						label: "Да, уверен",
	//						className: "green",
	//						callback: function () {
	//							if ($('#bbx' + rand).val().trim().toLowerCase() != 'согласен') {
	//								toastr.info('Вы ввели неверную фразу для подтверждения забраковки билетов')
	//								return;
	//							}
	//							tableInstance.makeOperation({
	//								operationName: 'defect_blank',
	//								params: [{
	//									col_names: ['STATUS'],
	//									matching: ['equal'],
	//									col_values: ['CLOSED']
	//								}, {
	//									col_names: ['STATUS'],
	//									matching: ['equal'],
	//									col_values: ['PAID']
	//								}],
	//								revert: true
	//							}, function () {
	//								tableInstance.parentObject.reload();
	//							});
	//						}
	//					},
	//					cancel: {
	//						label: "Отмена",
	//						className: "blue"
	//					}
	//				}
	//			});
	//		}
	//	}
	//];

}());

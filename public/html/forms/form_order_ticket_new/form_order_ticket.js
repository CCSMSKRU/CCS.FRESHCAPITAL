(function () {

	var modal = $('.mw-wrap').last();
	var formID = modal.attr('id').substr(3);
	var formInstance = MB.Forms.getForm('form_order_ticket', formID);
	var formWrapper = $('#mw-' + formInstance.id);

	formWrapper.find('.mw-save-form').hide(0);

	var barcode = formWrapper.find('.form-ro-barcode');
	barcode.html(DrawCode39Barcode(barcode.attr('data-barcode'), 0));

	formInstance.lowerButtons = [
		//{
		//	title: 'Отменить билет',
		//	color: "red",
		//	icon: "fa-times",
		//	type: "DOUBLE",
		//	hidden: false,
		//	condition: [{
		//		colNames: ['STATUS', 'STATUS'],
		//		matching: ['not_equal', 'not_equal'],
		//		colValues: ['RESERVED', 'PAID']
		//	}],
		//	handler: function () {
		//		bootbox.dialog({
		//			message: "Вы уверены, что хотите отменить билет?",
		//			title: "Внимание!",
		//			buttons: {
		//				yes_btn: {
		//					label: "Да, уверен",
		//					className: "green",
		//					callback: function () {
		//						formInstance.makeOperation('cancel_web_ticket');
		//					}
		//				},
		//				cancel: {
		//					label: "Отмена",
		//					className: "blue"
		//				}
		//			}
		//		});
		//	}
		//},
		{
			title: 'Вернуть билет',
			color: "blue",
			icon: "fa-reply",
			type: "DOUBLE",
			hidden: false,
			condition: [{
				colNames: ['STATUS', 'STATUS', 'STATUS', 'STATUS'],
				matching: ['not_equal', 'not_equal', 'not_equal', 'not_equal'],
				colValues: ['ON_REALIZATION', 'PAID', 'CLOSED_REALIZATION', 'CLOSED']
			}],
			handler: function () {
				bootbox.dialog({
					message: "Вы уверены, что хотите вернуть билет?",
					title: "Внимание!",
					buttons: {
						yes_btn: {
							label: "Да, уверен",
							className: "green",
							callback: function () {
								formInstance.makeOperation('return_ticket');
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
			title: 'Напечатать билет',
			color: "green",
			icon: "fa-print",
			type: "DOUBLE",
			hidden: false,
			condition: [{
				colNames: ['STATUS', 'PRINT_STATUS'],
				matching: ['not_equal', 'not_equal'],
				colValues: ['TO_PAY', 'NOT_PRINTED']
			}],
			handler: function () {
				send('print_ticket', {
					guid: MB.Core.getUserGuid(),
					ticket_id: formInstance.activeId
				}, function (res) {
					console.log('print_ticket', res);
					formInstance.reload();
				});
			}
		},
		{
			title: 'Печать накладной',
			color: "blue",
			icon: "fa-print",
			type: "DOUBLE",
			hidden: false,
			condition: [{
				colNames: [],
				matching: [],
				colValues: []
			}],
			handler: function () {
				console.log(formInstance);
				var get = "?sid=" + MB.User.sid + "&ACTIVE_ID=" + formInstance.activeId + "&name=" + formInstance.name;
				get += "&subcommand=delivery_note_order";
				var iframe = $('<iframe style="width:0; height:0; overflow: hidden;" class="printIframe" src="html/forms/print_form.html' + get + '"></iframe>');
				iframe.appendTo('body');
			}
		},
		{
			title: 'Забраковать бланк',
			color: "red",
			icon: "fa-trash-o",
			type: "DOUBLE",
			hidden: false,
			condition: [{
				colNames: ['PRINT_STATUS', 'STATUS', 'STATUS'],
				matching: ['not_equal', 'not_equal', 'not_equal'],
				colValues: ['PRINTED', 'CLOSED', 'CLOSED_REALIZATION']
			}],
			handler: function () {
				bootbox.dialog({
					message: "Вы уверены, что хотите забраковать бланк?",
					title: "Внимание!",
					buttons: {
						yes_btn: {
							label: "Да, уверен",
							className: "green",
							callback: function () {
								formInstance.makeOperation('defect_blank');
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
			title: 'Забраковать билет',
			color: "red",
			icon: "fa-ticket",
			type: "DOUBLE",
			hidden: false,
			condition: [{
				colNames: ['STATUS', 'STATUS'],
				matching: ['not_equal', 'not_equal'],
				colValues: ['PAID', 'CLOSED']
			}],
			handler: function () {
				var rand = Date.now();
				bootbox.dialog({
					message: '<p>Если вы уверены, что хотите забраковать билет, введите слово <b>СОГЛАСЕН</b></p><input id="bbx' + rand + '">',
					title: "Внимание!",
					buttons: {
						yes_btn: {
							label: "Да, уверен",
							className: "green",
							callback: function () {
								if ($('#bbx' + rand).val().trim().toLowerCase() != 'согласен') {
									toastr.info('Вы ввели неверную фразу для подтверждения забраковки билета')
									return;
								}
								formInstance.makeOperation('defect_ticket');
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
            title: 'Выставить проход',
            color: "red",
            icon: "fa-ticket",
            type: "DOUBLE",
            hidden: false,
            condition: [{
                colNames: ['STATUS', 'STATUS', 'STATUS', 'STATUS'],
                matching: ['not_equal', 'not_equal', 'not_equal', 'not_equal'],
                colValues: ['PAID', 'CLOSED', 'ON_REALIZATION', 'CLOSED_REALIZATION']
            }],
            handler: function () {
                var rand = Date.now();
                bootbox.dialog({
                    message: "Вы уверены что хотите выставить проход в зал?",
                    title: "Выставление прохода",
                    buttons: {
                        yes_btn: {
                            label: "Да, уверен",
                            className: "yellow",
                            callback: function () {
                                socketQuery({
                                    command: "operation",
                                    object: "set_enter_in_hall_status_entered_for_place",
                                    params: {
                                        ACTION_SCHEME_ID: formInstance.data.data[0]['ACTION_SCHEME_ID']
                                    }
                                }, function (data) {
                                    socketParse(data);
                                });
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
            title: 'Отменить проход',
            color: "red",
            icon: "fa-ticket",
            type: "DOUBLE",
            hidden: false,
            condition: [{
                colNames: ['STATUS', 'STATUS', 'STATUS', 'STATUS'],
                matching: ['not_equal', 'not_equal', 'not_equal', 'not_equal'],
                colValues: ['PAID', 'CLOSED', 'ON_REALIZATION', 'CLOSED_REALIZATION']
            }],
            handler: function () {
                var rand = Date.now();
                bootbox.dialog({
                    message: "Вы уверены что хотите отменить проход в зал?",
                    title: "Отмена прохода",
                    buttons: {
                        yes_btn: {
                            label: "Да, уверен",
                            className: "yellow",
                            callback: function () {
                                formInstance.makeOperation('clear_enter_in_hall_status');
                            }
                        },
                        cancel: {
                            label: "Отмена",
                            className: "blue"
                        }
                    }
                });
            }
        }
	];


    formWrapper.find('.form-field-parent-object-link').off('click').on('click', function(){
        var formId = MB.Core.guid();
        var tablePKeys = {data_columns: ['ORDER_ID'], data: [formInstance.data.data[0]['ORDER_ID']]};
        var openInModalO = {
            id: formId,
            name: ([formInstance.data.data[0]['ORDER_TYPE']] == 'ORDER')? 'form_order' : 'form_order_web',
            type: 'form',
            ids: [formInstance.data.data[0]['ORDER_ID']],
            position: 'shift',
            tablePKeys: tablePKeys
        };
        var form = new MB.FormN(openInModalO);
        form.create(function () {
            var modal = MB.Core.modalWindows.windows.getWindow(formId);
            $(modal).on('close', function () {
                formInstance.reload();
            });

            $(form).on('update', function () {
                formInstance.reload();
            });
        });
    });

	return;
	var instance = MB.O.forms["form_order_ticket"];
	instance.custom = function (callback) {
		log(instance)
		var action_id = instance.data.data[0]["ACTION_ID"];
		var ticketstatus = instance.data.data[0]["STATUS"];
		var agentrealizationaccess = instance.data.data[0]["AGENT_REALIZATION_ACCESS"].bool();
		var ticketid = instance.activeId;
		log(agentrealizationaccess);
		var buttons = {
			"payticket": {
				html: "<button type='button' id='btn_payticket' class='btn blue-stripe custombutton payticket'><i class='fa fa-credit-card'></i> К оплате</button>",
				callback: function () {
					var o = {
						command: "operation",
						object: "to_pay_ticket"
					};
					o["ORDER_TICKET_ID"] = ticketid;
					sendQueryForObj(o);
				},
				disabled: function (key, options) {
					if (ticketstatus === "RESERVED") {
						return false;
					} else {
						return true;
					}
				}
			},
			"cancelticket": {
				html: "<button type='button' id='btn_cancelticket' class='btn red-stripe custombutton cancelticket'><i class='fa fa-credit-card'></i> Отменить билет</button>",
				callback: function () {
					var o = {
						command: "operation",
						object: "cancel_ticket"
					};
					o["ORDER_TICKET_ID"] = ticketid;
					sendQueryForObj(o);
				},
				disabled: function (key, options) {
					if (ticketstatus === "RESERVED" || ticketstatus === "TO_PAY") {
						return false;
					} else {
						return true;
					}
				}
			},
			"returnticket": {
				html: "<button type='button' id='btn_returnticket' class='btn red-stripe custombutton returnticket'><i class='fa fa-credit-card'></i> Вернуть билет</button>",
				callback: function () {
					var o = {
						command: "operation",
						object: "return_ticket"
					};
					o["ORDER_TICKET_ID"] = ticketid;
					sendQueryForObj(o);
				},
				disabled: function (key, options) {
					if (ticketstatus === "CLOSED" || ticketstatus === "CLOSED_REALIZATION" || ticketstatus === "REALIZATION" || ticketstatus === "PAID") {
						return false;
					} else {
						return true;
					}
				}
			},
			"printticket": {
				html: "<button type='button' id='btn_printticket' class='btn green-stripe custombutton printticket'><i class='fa fa-credit-card'></i> Напечатать билет</button>",
				callback: function () {

					send('print_ticket', {guid: MB.Core.getUserGuid(), ticket_id: ticketid}, function (result) {
						instance.reload('data');

					});

					/*var o = {
					 command: "operation",
					 object: "print_ticket",
					 sid: MB.User.sid
					 };
					 o["ORDER_TICKET_ID"] = ticketid;
					 sendQueryForObj(o);*/
				},
				disabled: function (key, options) {
					if (ticketstatus === "IN_PRINT" || ticketstatus === "TO_PAY" || ticketstatus === "PAID") {
						return false;
					} else {
						return true;
					}
				}
			},
			"defectblanck": {
				html: "<button type='button' id='btn_defectblanck' class='btn red-stripe custombutton defectblanck'><i class='fa fa-credit-card'></i> Забраковать бланк</button>",
				callback: function () {
					var o = {
						command: "operation",
						object: "defect_blank"
					};
					o["ORDER_TICKET_ID"] = ticketid;
					sendQueryForObj(o);
				},
				disabled: function (key, options) {
					if (ticketstatus === "CLOSED" || ticketstatus === "CLOSED_REALIZATION" || ticketstatus === "REALIZATION") {
						return false;
					} else {
						return true;
					}
				}
			},
			"defectticket": {
				html: "<button type='button' id='btn_defectticket' class='btn red-stripe custombutton defectticket'><i class='fa fa-credit-card'></i> Забраковать билет</button>",
				callback: function () {
					var o = {
						command: "operation",
						object: "defect_ticket"
					};
					o["ORDER_TICKET_ID"] = ticketid;
					sendQueryForObj(o);
				},
				disabled: function (key, options) {
					if (ticketstatus === "CLOSED" || ticketstatus === "CLOSED_REALIZATION" || ticketstatus === "REALIZATION") {
						return false;
					} else {
						return true;
					}
				}
			},
			"realizationticket": {
				html: "<button type='button' id='btn_realizationticket' class='btn purple-stripe custombutton realizationticket'><i class='fa fa-credit-card'></i> Выдать билет на реализацию</button>",
				callback: function () {
					var o = {
						command: "operation",
						object: "on_realization_ticket"
					};
					o["ORDER_TICKET_ID"] = ticketid;
					sendQueryForObj(o);
				},
				disabled: function (key, options) {
					if (agentrealizationaccess || ticketstatus === "TO_PAY") {
						return false;
					} else {
						return true;
					}
				}
			},
			"closerealizationticket": {
				html: "<button type='button' id='btn_closerealizationticket' class='btn purple-stripe custombutton closerealizationticket'><i class='fa fa-credit-card'></i> Закрыть реализацию билета</button>",
				callback: function () {
					var o = {
						command: "operation",
						object: "on_realization_print_ticket"
					};
					o["ORDER_TICKET_ID"] = ticketid;
					sendQueryForObj(o);
				},
				disabled: function (key, options) {
					if (agentrealizationaccess || ticketstatus === "REALIZATION") {
						return false;
					} else {
						return true;
					}
				}
			},
			"cancel_enter": {
				html: "<button type='button' id='btn_cancel_enter' class='btn purple-stripe custombutton cancel_enter'><i class='fa fa-credit-card'></i> Отменить проход</button>",
				callback: function () {
					var b1 = bootbox.dialog({
						message: "Вы уверены что хотите отменить проход в зал?",
						title: "Отмена прохода",
						buttons: {
							yes_btn: {
								label: "Да, уверен",
								className: "yellow",
								callback: function () {
									//clear_enter_in_hall_status  (order_ticket_id, action_id, barcode)
									var o = {
										command: "operation",
										object: "clear_enter_in_hall_status"
									};
									o["ORDER_TICKET_ID"] = ticketid;
									sendQueryForObj(o);
								}
							},
							cancel: {
								label: "Отмена",
								className: "blue"
							}
						}
					});


				},
				disabled: function (key, options) {
					return false;
				}
			},
			"cancel_enter_all": {
				html: "<button type='button' id='btn_cancel_enter_all' class='btn purple-stripe custombutton cancel_enter_all'><i class='fa fa-credit-card'></i> Отменить проход ДЛЯ ВСЕГО МЕРОПРИЯТИЯ</button>",
				callback: function () {
					bootbox.dialog({
						message: "Вы уверены что хотите отменить проход в зал ДЛЯ ВСЕГО МЕРОПРИЯТИЯ?",
						title: "Отмена прохода ДЛЯ ВСЕГО МЕРОПРИЯТИЯ",
						buttons: {
							yes_btn: {
								label: "ДА, Я УВЕРЕН.",
								className: "RED",
								callback: function () {
									//clear_enter_in_hall_status  (order_ticket_id, action_id, barcode)
									var o = {
										command: "operation",
										object: "clear_all_enter_in_hall_status"
									};
									o["ACTION_ID"] = action_id;
									sendQueryForObj(o);
								}
							},
							cancel: {
								label: "Отмена",
								className: "green"
							}
						}
					});


				},
				disabled: function (key, options) {
					return false;
				}
			}
		};

		//
		// Action Buttons
		//
		instance.$container.find(".control-buttons").html("");
		var html = '';
		for (var key in buttons) {
			instance.$container.find(".control-buttons").append(buttons[key].html);
			log(buttons[key].disabled())
			if (buttons[key].disabled()) {
				instance.$container.find(".control-buttons").find("." + key).attr("disabled", true);
			}
		}
		instance.$container.find(".control-buttons").on("click", function (e) {
			var buttonName = e.target.id.replace("btn_", "");
			var buttonObj = buttons[buttonName];
			buttonObj.callback();
		})


		function sendQueryForObj(o) {
			socketQuery(o, function (res) {
				if (socketParse(res)) instance.reload("data");
			});
		}


		function createObj(obj) {
			var ticketid = obj.ticketid;
			var key = obj.key;
			var object = obj.object;
			if (obj.btnStyle != undefined) {
				var btnStyle = obj.btnStyle;
			}
			else {
				var btnStyle = "btn-default";
			}
			if (obj.btnIcon != undefined) {
				var btnIcon = obj.btnIcon;
			}
			else {
				var btnIcon = "<i class='fa fa-credit-card'></i>";
			}
			var btnText = " Закрыть реализацию билета";


			var property = {
				html: "<button type='button' id='btn_closerealizationticket' class='btn " + btnStyle + " custombutton " + key + "'>" + btnIcon + " " + btnText + "</button>",
				callback: function () {
					var o = {
						command: "operation",
						object: object
					};
					o["ORDER_TICKET_ID"] = ticketid;
					sendQueryForObj(o);
				},
				disabled: function (key, options) {
					if (agentrealizationaccess || ticketstatus === "REALIZATION") {
						return false;
					} else {
						return true;
					}
				}
			}
			return property;
		}

		/*
		 var html = '';
		 html += "<button type='button' class='btn btn-default custombutton payticket'><i class='fa fa-cogs'></i> К оплате</button>";
		 html += "<button type='button' class='btn btn-default custombutton cancelticket'><i class='fa fa-cogs'></i> Отменить билет</button>";
		 html += "<button type='button' class='btn btn-default custombutton returnticket'><i class='fa fa-cogs'></i> Вернуть билет</button>";
		 html += "<button type='button' class='btn btn-default custombutton printticket'><i class='fa fa-cogs'></i> Напечатать билет</button>";
		 html += "<button type='button' class='btn btn-default custombutton defectblanck'><i class='fa fa-cogs'></i> Забраковать бланк</button>";
		 html += "<button type='button' class='btn btn-default custombutton defectticket'><i class='fa fa-cogs'></i> Забраковать билет</button>";
		 html += "<button type='button' class='btn btn-default custombutton defectticket'><i class='fa fa-cogs'></i> Выдадть билет на реализацию билет</button>";
		 html += "<button type='button' class='btn btn-default custombutton defectticket'><i class='fa fa-cogs'></i> Закрыть реализацию билета</button>";
		 instance.$container.find(".control-buttons").append(html);
		 */


		callback();
	};
})();

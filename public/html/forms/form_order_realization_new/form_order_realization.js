(function () {

	var modal = $('.mw-wrap').last();
	var formID = MB.Forms.justLoadedId;
	var formInstance = MB.Forms.getForm('form_order_realization', formID);
	var formWrapper = $('#mw-' + formInstance.id);
	var tableID = formWrapper.find('.classicTableWrap').attr('data-id');
	var tableInstance = MB.Tables.getTable(tableID);
	var tableWrapper = $('.classicTableWrap-' + tableInstance.id);

	var agentrealizationaccess = formInstance.data.data[0]["AGENT_REALIZATION_ACCESS"],
		countReservedTickets = formInstance.data.data[0]["COUNT_RESERVED_TICKETS"],
		countToPaytickets = formInstance.data.data[0]["COUNT_TO_PAY_TICKETS"],
		countPaidTickets = formInstance.data.data[0]["COUNT_PAID_TICKETS"],
		countOnRealizationTickets = formInstance.data.data[0]["COUNT_ON_REALIZATION_TICKETS"],
		countClosedTickets = formInstance.data.data[0]["COUNT_CLOSED_TICKETS"],
		countClosedRealizationTicket = formInstance.data.data[0]["COUNT_CLOSED_REALIZATION_TICK"],
		countOnRealizationNotPrinted = formInstance.data.data[0]["COUNT_ON_REALIZ_NOTPRINTED"],
		order_status = formInstance.data.data[0]["STATUS"],
		order_status_ru = formInstance.data.data[0]["STATUS_RU"],
		countClosedRealizationNotPrinted = formInstance.data.data[0]["COUNT_CLOSED_REALIZ_NOTPRINTED"];

	//---------------------------------------------------------

	var statusBlock = formWrapper.find('.order-status');
	var statusColors = [
		{
			status: 'TO_PAY',
			color: 'yellow'
		},
		{
			status: 'RETURNED_REALIZATION',
			color: 'red'
		},
		{
			status: 'RETURNED',
			color: 'red'
		},
		{
			status: 'RESERVED',
			color: 'yellow'
		},
		{
			status: 'PAYMENT_NOT_RETURN',
			color: 'red'
		},
		{
			status: 'PAID',
			color: 'green'
		},
		{
			status: 'ON_REALIZATION',
			color: 'blue'
		},
		{
			status: 'IN_PRINT',
			color: 'grey'
		},
		{
			status: 'DEFECTIVE',
			color: 'grey'
		},
		{
			status: 'CLOSED_REALIZATION',
			color: 'green'
		},
		{
			status: 'CLOSED',
			color: 'green'
		},
		{
			status: 'CANCELED',
			color: 'grey'
		}
	];

	function setColorByStatus() {
		var statusS = statusBlock.attr('data-color');
		for (var s in statusColors) {
			var item = statusColors[s];
			if (statusS == item.status) {
				statusBlock.addClass(item.color);
			}
		}
	}

	setColorByStatus();


	//----------------------------------------------------------

//    var selInstance = undefined;
//    var crmUserSelectId = MB.Core.guid();
//    selInstance = MB.Core.select3.init({
//        id: crmUserSelectId,
//        wrapper: formWrapper.find('#searchCrmUser .fn-select3-wrapper'),
//        getString: 'CRM_USER',
//        column_name: 'CRM_USER_ID',
//        view_name: '',
//        value: {
//            id: '-10',
//            name: 'Выберите пользователя'
//        },
//        data: [],
//        fromServerIdString: 'CRM_USER_ID',
//        fromServerNameString: 'CRM_USER_INFO',
//        searchKeyword: 'CRM_USER_INFO',
//        withEmptyValue: true
//    });
//    var crmUserSelect = MB.Core.select3.list.getSelect(crmUserSelectId);
//    $(crmUserSelect).on('changeVal', function(e, was, now){
//        var fields = {
//            name: $('.fn-field[data-column="CRM_USER_NAME"] input[type="text"]'),
//            phone: $('.fn-field[data-column="CRM_USER_PHONE"] input[type="text"]'),
//            email: $('.fn-field[data-column="CRM_USER_EMAIL"] input[type="text"]')
//        };
//
//        if(now.id == 'empty' || now.id == ''){
//            fields.name.val('');
//            fields.phone.val('');
//            fields.email.val('');
//
//            fields.name.trigger('input');
//            fields.phone.trigger('input');
//            fields.email.trigger('input');
//
//        }else{
//            MB.Core.sendQuery({
//                command: 'get',
//                object: 'crm_user',
//                sid: MB.User.sid,
//                params: {
//                    where: 'CRM_USER_ID = '+now.id
//                }
//            }, function(res){
//                if(res['TOAST_TYPE'] != 'error'){
//
//                    console.log(1231231);
//
//                    fields.name.val(res.data[0][res.NAMES.indexOf('CRM_NAME')]);
//                    fields.phone.val(res.data[0][res.NAMES.indexOf('PHONE')]);
//                    fields.email.val(res.data[0][res.NAMES.indexOf('EMAIL')]);
//
//                    fields.name.trigger('input');
//                    fields.phone.trigger('input');
//                    fields.email.trigger('input');
//                }
//            });
//        }
//    });

//    var cardTypes = undefined;
//    var cardTypesDD = '<ul>{{#cardTypes}}<li data-id="{{id}}">{{name}}</li>{{/cardTypes}}</ul>';
//    var cardTypesWrapper = formWrapper.find('.cardTypeDD-wrapper');
//    var cardTypesActions = {};


//    (function(){
//        socketQuery({
//            command: 'get',
//            object: 'PAYMENT_CARD_TYPE'
//        },function(res){
//            res = JSON.parse(res).results[0];
//            cardTypes = res;
//            var mObj = {
//                cardTypes: []
//            };
//            for(var i in cardTypes.data){
//                var card = cardTypes.data[i];
//                mObj.cardTypes.push({
//                    id: card[cardTypes.data_columns.indexOf('PAYMENT_CARD_TYPE_ID')],
//                    name: card[cardTypes.data_columns.indexOf('PAYMENT_CARD_TYPE')]
//                });
//            }
//            cardTypesDD = Mustache.to_html(cardTypesDD, mObj);
//            cardTypesWrapper.html(cardTypesDD);
//
//            cardTypesWrapper.find('li').off('click').on('click', function(){
//                var o = {
//                    command: 'operation',
//                    object: 'set_order_payment_type',
//                    order_id: formInstance.activeId,
//                    payment_type: 'CARD',
//                    payment_card_type_id: $(this).attr('data-id')
//                };
//                socketQuery(o, function(res){
//                    formInstance.reload();
//                    $('.payTypeSwitcher').removeClass('active');
//                    $('.payTypeSwitcher[data-type="CARD"]').addClass('active');
//                    cardTypesWrapper.addClass('hidden');
//                });
//
//            });
//
//            $(document).on('click', function(e){
//                if( $(e.target).parents('.cardTypeDD-wrapper').length == 0
//                    && !$(e.target).hasClass('cardTypeDD-wrapper')
//                    && $(e.target).parents('[data-type="CARD"]').length == 0
//                    && $(e.target).attr('data-type') != 'CARD'){
//                    cardTypesWrapper.addClass('hidden');
//                }
//            });
//
//        });
//
//
//    }());

//    formWrapper.find('.payTypeSwitcher').off('click').on('click', function(){
//        var _this = $(this);
//        if(!$(this).hasClass('active')){
//
//            if($(this).attr('data-type') == 'CARD'){
//                cardTypesWrapper.removeClass('hidden');
//            }else if($(this).attr('data-type') == 'CASH'){
//                var o = {
//                    command: 'operation',
//                    object: 'set_order_payment_type',
//                    order_id: formInstance.activeId,
//                    payment_type: 'CASH'
//                };
//                socketQuery(o, function(res){
//                    formInstance.reload();
//                    $('.payTypeSwitcher').removeClass('active');
//                    _this.addClass('active');
//                });
//            }else if($(this).attr('data-type') == 'BANK'){
//                var o2 = {
//                    command: 'operation',
//                    object: 'set_order_payment_type',
//                    order_id: formInstance.activeId,
//                    payment_type: 'PAYORD'
//                };
//                socketQuery(o2, function(res){
//                    formInstance.reload();
//                    $('.payTypeSwitcher').removeClass('active');
//                    _this.addClass('active');
//                });
//            }
//        }
//    });

	$('.fn-field.fn-readonly-field').each(function () {
		var $t = $(this),
			isAppend = $t.parents('.withAppend').eq(0);

		if (isAppend.length > 0 && !$t.hasClass('appended')) {
			$t.addClass('appended').find('div.fn-readonly').html($t.find('div.fn-readonly').html() + isAppend.data('append'));
		}
	});
	uiTabs();
	var confirmReserve = formWrapper.find('#confirmReserve');
	var reserveToDate = formWrapper.find('input#reserveToDate');
	reserveToDate.datetimepicker({
		format: "dd.mm.yyyy hh:ii",
		autoclose: true,
		todayHighlight: true,
		startDate: new Date,
		minuteStep: 10,
		keyboardNavigation: true,
		todayBtn: true,
		firstDay: 1,
		weekStart: 1,
		language: "ru"
	}).on('changeDate', function (e) {
		var val = $(this).val();
		if (val == '') {
			confirmReserve.addClass('disabled');
		} else {
			confirmReserve.removeClass('disabled');
		}
	});
	reserveToDate.on('input', function () {
		var val = $(this).val();
		if (val == '') {
			confirmReserve.addClass('disabled');
		} else {
			confirmReserve.removeClass('disabled');
		}
	});
	confirmReserve.on('click', function () {
		if (!$(this).hasClass('disabled')) {
			var o = {
				command: 'operation',
				object: 'set_reserved_date_to_ticket',
				params: {
					order_id: formInstance.activeId,
					reserv_date: reserveToDate.val()
				}
			};
			socketQuery(o, function (res) {
				socketParse(res);
				tableInstance.reload();
			});
		}
	});

	var setDiscount = formWrapper.find('#setDiscount');
	var confirmDiscount = formWrapper.find('#confirmDiscount');

	setDiscount.off('change').on('change', function () {
		var val = $(this).val();
		var intReg = new RegExp(/^\-?[0-9]+$/);
		if (+countToPaytickets > 0 || +countReservedTickets > 0) {
			if (!intReg.test(val)) {
				$(this).val('');
				confirmDiscount.addClass('disabled');
			} else {
				confirmDiscount.removeClass('disabled');
			}
		}
	});

	confirmDiscount.off('click').on('click', function () {
		if ($(this).hasClass('disabled')) {
			return;
		}

		var val = setDiscount.val();
		var o = {
			command: 'operation',
			object: 'change_order_discount',
			params: {
				order_id: formInstance.activeId,
				discount: val
			}
		};
		socketQuery(o, function (res) {
			socketParse(res);
			tableInstance.reload();
		});

	});

	//reserved or to_pay;


	var reportBtn = formWrapper.find('.reportBtn');
	var reportDD = formWrapper.find('.reportBtn-dd');
	reportBtn.on('click', function () {
		if ($(this).hasClass('disabled')) {
			return;
		}
		if ($(this).hasClass('opened')) {
			reportDD.hide(100, function () {
				reportBtn.removeClass('opened');
			});
		} else {
			reportDD.show(100, function () {
				reportBtn.addClass('opened');
			});
		}
	});

	var delivery_note2 = formWrapper.find('.delivery_note2_btn');
	delivery_note2.off('click').on('click', function () {
		var width = MB.Core.getClientWidth();
		var height = MB.Core.getClientHeight() + 50;
		var get = "?sid=" + MB.User.sid + "&ORDER_ID=" + formInstance.activeId;
		get += "&subcommand=delivery_note_order";
		var report_page = window.open("html/report/print_report.html" + get, 'new', 'width=' + width + ',height=' + height + ',toolbar=1');
	});

	var return_delivery_note = formWrapper.find('.return_delivery_note_btn');
	return_delivery_note.off('click').on('click', function () {
		var width = MB.Core.getClientWidth();
		var height = MB.Core.getClientHeight() + 50;
		var get = "?sid=" + MB.User.sid + "&ORDER_ID=" + formInstance.activeId;
		get += "&subcommand=return_delivery_note";
		var report_page = window.open("html/report/print_report.html" + get, 'new', 'width=' + width + ',height=' + height + ',toolbar=1');
	});


	var printBtn = formWrapper.find('.printBtn');
	printBtn.off('click').on('click', function () {
		if ($(this).hasClass('disabled')) {
			return;
		}
		send('print_order', {
			guid: MB.Core.getUserGuid(),
			order_id: formInstance.activeId
		}, function (res) {
			console.log('print_order', res);
			tableInstance.reload();
			disableButtons();
		});
	});
	//-------------------------------------------------------------
	// CONTEXT MENU

	tableInstance.ct_instance.ctxMenuData = [
		{
			name: 'option1',
			title: 'Открыть в форме',
			disabled: function () {
				return false;
			},
			callback: function () {
				var selArr = tableInstance.ct_instance.getIndexesByData();

				var openInModalO = {
					id: MB.Core.guid(),
					name: tableInstance.profile['extra_data']['object_profile']['open_form_client_object'],
					type: 'form',
					ids: [tableInstance.ct_instance.data.data[tableInstance.ct_instance.selectedRowIndex][tableInstance.profile['extra_data']['object_profile']['primary_key'].split(',')[0]]],
					position: 'center'
				};

				var form = new MB.FormN(openInModalO);
				form.create();

//                for(var i in selArr){
//                    var item = tableInstance.ct_instance.data.data[selArr[i]];
//
//                }
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
				tableInstance.makeOperation('to_pay_ticket');
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
					if (
						item['STATUS'] !== 'TO_PAY'
						&& item['STATUS'] !== 'RESERVED'
					) {
						result += 1;
					}
				}
				return result > 0;
			},
			callback: function () {
				tableInstance.makeOperation('cancel_ticket');
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
					if (
						item['STATUS'] !== 'CLOSED'
						&& item['STATUS'] !== 'ON_REALIZATION'
						&& item['STATUS'] !== 'CLOSED_REALIZATION'
					) {
						result += 1;
					}
				}
				return result > 0;
			},
			callback: function () {
				tableInstance.makeOperation('return_ticket');
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
					}
				}
				return result > 0;
			},
			callback: function () {
				tableInstance.makeOperation('defect_blank');
			}
		}
	];

	//-------------------------------------------------------------
	// ЗАКАЗ К ОПЛАТЕ, ОТМЕНИТЬ ЗАКАЗ, ВЕРНУТЬ ЗАКАЗ

	function disableButtons() {

		agentrealizationaccess = formInstance.data.data[0]["AGENT_REALIZATION_ACCESS"],
			countReservedTickets = formInstance.data.data[0]["COUNT_RESERVED_TICKETS"],
			countToPaytickets = formInstance.data.data[0]["COUNT_TO_PAY_TICKETS"],
			countPaidTickets = formInstance.data.data[0]["COUNT_PAID_TICKETS"],
			countOnRealizationTickets = formInstance.data.data[0]["COUNT_ON_REALIZATION_TICKETS"],
			countClosedTickets = formInstance.data.data[0]["COUNT_CLOSED_TICKETS"],
			countClosedRealizationTicket = formInstance.data.data[0]["COUNT_CLOSED_REALIZATION_TICK"],
			countOnRealizationNotPrinted = formInstance.data.data[0]["COUNT_ON_REALIZ_NOTPRINTED"],
			order_status = formInstance.data.data[0]["STATUS"],
			order_status_ru = formInstance.data.data[0]["STATUS_RU"],
			countClosedRealizationNotPrinted = formInstance.data.data[0]["COUNT_CLOSED_REALIZ_NOTPRINTED"];

		reportBtn.addClass('disabled');
		reportDD.hide(0);
		printBtn.addClass('disabled');
		formWrapper.find('#to_pay_order').addClass('disabled');
		formWrapper.find('#cancel_order').addClass('disabled');
		formWrapper.find('#return_order').addClass('disabled');
		statusBlock.attr('class', 'order-status');
		confirmDiscount.addClass('disabled');

		if (+countReservedTickets > 0) {
			formWrapper.find('#to_pay_order').removeClass('disabled');
		}
		if (+countReservedTickets > 0 || +countToPaytickets > 0) {
			formWrapper.find('#cancel_order').removeClass('disabled');
		}
		if (+countClosedTickets > 0 || +countOnRealizationTickets > 0 || +countClosedRealizationTicket > 0) {
			formWrapper.find('#return_order').removeClass('disabled');
		}
		if (formInstance.data.data[0]['STATUS'] !== 'CANCELED' && formInstance.data.data[0]['STATUS'] !== 'PAYMENT_NOT_RETURN') {
			reportBtn.removeClass('disabled');
		}
		if (+countToPaytickets > 0) {
			printBtn.removeClass('disabled');
		}
		statusBlock.attr('data-color', order_status).html(order_status_ru);
		if (+countToPaytickets > 0 || +countReservedTickets > 0) {
			var intReg = new RegExp(/^\-?[0-9]+$/);
			if (intReg.test(setDiscount.val())) {
				confirmDiscount.removeClass('disabled');
			}
		}
		setColorByStatus();
	}

	disableButtons();


	formWrapper.find('#to_pay_order').on('click', function () {
		if ($(this).hasClass('disabled')) {
			return
		}
		formInstance.makeOperation('to_pay_order', function () {
			disableButtons();
		});
	});
	formWrapper.find('#cancel_order').on('click', function () {
		if ($(this).hasClass('disabled')) {
			return
		}
		formInstance.makeOperation('cancel_order', function () {
			disableButtons();
		});
	});
	formWrapper.find('#return_order').on('click', function () {
		if ($(this).hasClass('disabled')) {
			return
		}
		formInstance.makeOperation('return_order', function () {
			disableButtons();
		});
	});

	//-----------------------------------------------------------


}());

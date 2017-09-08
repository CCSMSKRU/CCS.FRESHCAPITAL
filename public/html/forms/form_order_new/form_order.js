(function () {

	var formID = MB.Forms.justLoadedId;

	var formInstance = MB.Forms.getForm('form_order', formID);
	var formWrapper = $('#mw-' + formInstance.id);

	var tableID = formWrapper.find('.classicTableWrap').eq(0).attr('data-id');
	var tableInstance = MB.Tables.getTable(tableID);

    var tableServicesID = formWrapper.find('.classicTableWrap').eq(1).attr('data-id');
    var tableServicesInstance = MB.Tables.getTable(tableServicesID);

    var modalInstance = MB.Core.modalWindows.windows.getWindow(formID);

    var countReservedTickets = formInstance.data.data[0]["COUNT_RESERVED_TICKETS"],
		countToPaytickets = formInstance.data.data[0]["COUNT_TO_PAY_TICKETS"],
        order_status = formInstance.data.data[0]["STATUS"],
        order_status_ru = formInstance.data.data[0]["STATUS_RU"],
        totalOrderAmount = formInstance.data.data[0]["TOTAL_ORDER_AMOUNT"],
        ticketCount = formInstance.data.data[0]["TICKETS_COUNT"];

    // TABLES CUSTOM TOTAL VALUES


    formInstance.recountTotalTablesValues = function(){
        if(tableServicesInstance){
            tableServicesInstance.reload(function(){
                var tblWrap1 = tableInstance.wrapper;
                var tblWrap2 = tableServicesInstance.wrapper;

                var tpl =   '<div class="totalBlock">{{#totals}}<div data-type="text" class="flLeft marLeft5 fn-field fn-readonly-field appended">' +
                    '<label>{{label}}:</label>' +
                    '<div class="fn-readonly">{{value}}' +
                    '<span class="appendText"> {{appendValue}}</span>' +
                    '</div></div>{{/totals}}</div>';

                var mO1 = {
                    totals: [
                        {
                            label: 'Билетов',
                            value: ticketCount,
                            appendValue: ''
                        },
                        {
                            label: 'На сумму',
                            value: totalOrderAmount,
                            appendValue: 'руб.'
                        }
                    ]
                };

                var mO2 = {
                    totals: [
                        {
                            label: 'Услуг',
                            value: countReservedServicesCount(),
                            appendValue: ''
                        },
                        {
                            label: 'На сумму',
                            value: countReservedServicesAmount(),
                            appendValue: 'руб.'
                        }
                    ]
                };

                tblWrap1.find('.totalBlock').remove();
                tblWrap2.find('.totalBlock').remove();

                tblWrap1.append(Mustache.to_html(tpl, mO1));
                tblWrap2.append(Mustache.to_html(tpl, mO2));
            });
        }
    };

    formInstance.recountTotalTablesValues();

    function countReservedServicesCount(){
        var res = 0;
        for(var i in tableServicesInstance.data.data){
            var s = tableServicesInstance.data.data[i];
            if(s.STATUS == 'RESERVED' || s.STATUS == 'TO_PAY'){
                res ++;
            }
        }
        return res;
    }

    function countReservedServicesAmount(){
        var res = 0;
        for(var i in tableServicesInstance.data.data){
            var s = tableServicesInstance.data.data[i];
            if(s.STATUS == 'RESERVED' || s.STATUS == 'TO_PAY'){
                res += parseFloat(s.PRICE);
            }
        }

        return res;
    }

    function countReservedServices(){
        var res = 0;
        var totalAmount = 0;
        if(tableServicesInstance){
            for(var i in tableServicesInstance.data.data){
                var s = tableServicesInstance.data.data[i];
                if(s.STATUS == 'RESERVED' || s.STATUS == 'TO_PAY'){
                    res ++;
                    totalAmount += parseFloat(s.PRICE);
                }
            }
        }else{
            res = 0;
            totalAmount = 0;
        }

        formWrapper.find('.reserved-services-total-amount').html(totalAmount + ' руб.');

        formWrapper.find('.total-order-amount-with-services').html('ИТОГО Билеты + Услуги: <b>' + parseFloat(parseFloat(totalAmount) + parseFloat(totalOrderAmount)) + '</b> руб.');

        formInstance.recountTotalTablesValues();

        return res;
    }

    if(countReservedServices() > 0){
        formWrapper.find('.pay-reserved-services').removeClass('disabled');
    }else{
        formWrapper.find('.pay-reserved-services').addClass('disabled');
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    formWrapper.find(".address_wrapper input").suggestions({
        serviceUrl: "https://dadata.ru/api/v2",
        token: "4c6f9269ee68046587315628da6db92052b4fd10",
        type: "ADDRESS",
        count: 5,
        /* Вызывается, когда пользователь выбирает одну из подсказок */
        onSelect: function(suggestion) {
            console.log(suggestion);
            var geo_lat = suggestion.data.geo_lat,
                geo_lon = suggestion.data.geo_lon;
            console.log(geo_lat, geo_lon);

            if(suggestion.data.city != null) {
                formWrapper.find("div[data-type='DL_CITY']").find(".fn-readonly").html(suggestion.data.city);
                formWrapper.find("input[data-column='DL_CITY']").val(suggestion.data.city);
            } else {
                if(suggestion.data.settlement != null) {
                    formWrapper.find("div[data-type='DL_CITY']").find(".fn-readonly").html(suggestion.data.settlement);
                    formWrapper.find("input[data-column='DL_CITY']").val(suggestion.data.settlement);
                } else {
                    if(suggestion.data.area != null) {
                        formWrapper.find("div[data-type='DL_CITY']").find(".fn-readonly").html(suggestion.data.area);
                        formWrapper.find("input[data-column='DL_CITY']").val(suggestion.data.area);
                    }
                }
            }
            formWrapper.find("div[data-type='DL_STREET']").find(".fn-readonly").html(suggestion.data.street_with_type);
            formWrapper.find("div[data-type='DL_BLD']").find(".fn-readonly").html(suggestion.data.house);
            formWrapper.find("div[data-type='DL_KORPUS']").find(".fn-readonly").html(suggestion.data.block);
            formWrapper.find("div[data-type='DL_FLAT']").find(".fn-readonly").html(suggestion.data.flat);

            formWrapper.find("input[data-column='DL_STREET']").val(suggestion.data.street_with_type);
            formWrapper.find("input[data-column='DL_BLD']").val(suggestion.data.house);
            formWrapper.find("input[data-column='DL_KORPUS']").val(suggestion.data.block);
            formWrapper.find("input[data-column='DL_FLAT']").val(suggestion.data.flat);

            formWrapper.find("input[data-column='DL_CITY']").trigger("input");
            formWrapper.find("input[data-column='DL_STREET']").trigger("input");
            formWrapper.find("input[data-column='DL_BLD']").trigger("input");
            formWrapper.find("input[data-column='DL_KORPUS']").trigger("input");
            formWrapper.find("input[data-column='DL_FLAT']").trigger("input");
            formWrapper.find(".address_wrapper input").trigger("input");
        }
    });

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

    var printedTicketsCount = formInstance.data.data[0]["PRINTED_TICKETS_COUNT"];
    var ticketsCount = formInstance.data.data[0]["TICKETS_COUNT"];

    formInstance.lowerButtons = [
        {
            title: 'Заказ к оплате',
            color: "green",
            icon: null,
            type: "SINGLE",
            hidden: true,//(formInstance.data.data[0]["COUNT_RESERVED_TICKETS"] == 0),
            condition: [{
                colNames: ['COUNT_RESERVED_TICKETS'],
                matching: ['equal'],
                colValues: ['0']
            }],
            handler: function () {
                if ($(this).hasClass('disabled')) {
                    return
                }
                formInstance.makeOperation('to_pay_order', function () {
                });
            }
        },
        {
            title: 'Отменить заказ',
            color: "red",
            icon: null,
            type: "SINGLE",
            hidden: false,
            condition: [
                {
                    colNames: ['COUNT_RESERVED_TICKETS', 'COUNT_TO_PAY_TICKETS'],
                    matching: ['equal', 'equal'],
                    colValues: ['0','0']
                }
            ],
            handler: function() {
                if ($(this).hasClass('disabled')) {
                    return
                }
                bootbox.dialog({
                    message: "Вы уверены, что хотите отменить заказ?",
                    title: "Внимание!",
                    buttons: {
                        yes_btn: {
                            label: "Да, уверен",
                            className: "green",
                            callback: function () {
                                formInstance.makeOperation('cancel_order', function () { });
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
            title: 'Вернуть заказ',
            color: "blue",
            icon: null,
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: ['COUNT_CLOSED_TICKETS', 'COUNT_ON_REALIZATION_TICKETS', 'COUNT_CLOSED_REALIZATION_TICK'],
                matching: ['equal', 'equal', 'equal'],
                colValues: ['0', '0', '0']
            }],
            handler: function() {
                if ($(this).hasClass('disabled')) {
                    return
                }
                bootbox.dialog({
                    message: "Вы уверены, что хотите вернуть заказ?",
                    title: "Внимание!",
                    buttons: {
                        yes_btn: {
                            label: "Да, уверен",
                            className: "green",
                            callback: function () {
                                formInstance.makeOperation('return_order', function () { });
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
            title: 'Демо печать',
            color: "blue",
            icon: null,
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: ['NOT_PRINTED_TICKETS_COUNT'],
                matching: ['equal'],
                colValues: ['0']
            }],
            handler: function() {
                if ($(this).hasClass('disabled')) {
                    return
                }
                formInstance.makeOperation('print_order_without_printing', function () {
                    formInstance.reload();
                    //disableButtons();
                });
            }
        },
        {
            title: 'Показать заказ',
            color: "blue",
            icon: null,
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: [],
                matching: [],
                colValues: []
            }],
            handler: function() {
                if ($(this).hasClass('disabled')) {
                    return
                }
                toClientscreen({type: "preorder", id: formInstance.activeId});
            }
        },
        {
            title: 'Печать '+printedTicketsCount+" / "+ticketsCount,
            color: "black",
            icon: "fa-print",
            type: "SINGLE",
            hidden: false,
            position: "RIGHT",
            condition: [{
                colNames: ['NOT_PRINTED_TICKETS_COUNT'],
                matching: ['equal'],
                colValues: ['0']
            }],
            handler: function() {
                if ($(this).hasClass('disabled')) {
                    return;
                }

                formInstance.makeOperation('to_pay_order', function(res){
                    if(res.code == '0'){
                        send('print_order', {
                            guid: MB.Core.getUserGuid(),
                            order_id: formInstance.activeId
                        }, function (res) {
                            console.log('print_order', res);
                            tableInstance.reload();
                            formInstance.reload();
                        });
                    }
                });
            }
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

    var fo_deliveryForm = formWrapper.find(".fo_deliveryForm");
    var switchBttnWrap = formWrapper.find(".switchBttnWrap");
    var fo_userInfoForm = formWrapper.find(".fo_userInfoForm");
    var animationTime = 350;

    switchBttnWrap.off("click").on("click", function() {
        if(switchBttnWrap.attr("bttn-status") == "delivery") {
            switchBttnWrap.attr("bttn-status", "user");
            switchBttnWrap.find(".switchBttn").text("Пользователь");
            fo_userInfoForm.hide();
            fo_userInfoForm.css({
                "top": formWrapper.find(".leftBlock").height() + "px"
            });
            fo_deliveryForm.show();
            fo_deliveryForm.animate({
                "top": "8px"
            }, animationTime);
            switchBttnWrap.animate({
                "top": (formWrapper.find(".leftBlock").height() - switchBttnWrap.height()) + "px"
            }, animationTime);
        } else {
            switchBttnWrap.attr("bttn-status", "delivery");
            switchBttnWrap.find(".switchBttn").text("Доставка");
            fo_deliveryForm.hide();
            fo_deliveryForm.css({
                "top": "-" + (fo_deliveryForm.height() + "px")
            });
            fo_userInfoForm.show();
            fo_userInfoForm.animate({
                "top": (switchBttnWrap.height() + 5) + "px"
            }, animationTime);
            switchBttnWrap.animate({
                "top": "0px"
            }, animationTime);
        }
    });

    $(modalInstance).off('resize').on('resize', function(e){
        if(switchBttnWrap.attr("bttn-status") == "delivery") {
            fo_deliveryForm.css({
                "top": "-" + (fo_deliveryForm.height() + "px")
            });
        } else {
            switchBttnWrap.css({
                "top": (formWrapper.find(".leftBlock").height() - switchBttnWrap.height()) + "px"
            });
            fo_userInfoForm.css({
                "top": formWrapper.find(".leftBlock").height() + "px"
            });
        }
    });

    //----------------------------------------------------------

	var typeSwitchers = formWrapper.find('.type-switch');

	var switcher = {
		switchForm: function (type, triggered) {
			if (type == 'agent') {
				formWrapper.find('.switchVisible[data-visible="agent"]').show(0);
				formWrapper.find('.switchable[data-visible="agent"]').show(0);
				formWrapper.find('.switchable[data-visible="casher"]').hide(0);
			} else {
				formWrapper.find('.switchVisible[data-visible="agent"]').hide(0);
				formWrapper.find('.switchable[data-visible="agent"]').hide(0);
				formWrapper.find('.switchable[data-visible="casher"]').show(0);
			}
			if (triggered) {
				switcher.reloadChildTbl(type, function () {

				});
			}

		},
		reloadChildTbl: function (type, callback) {
			MB.Core.spinner.start(formWrapper.find('.childObjectWrapper'));
			if (type == 'agent') {
				formInstance.createChildTables('tbl_order_ticket', function () {
					MB.Core.spinner.stop(formWrapper.find('.childObjectWrapper'));
				});
			} else {
				formInstance.createChildTables('tbl_order_ticket_casher', function () {
					MB.Core.spinner.stop(formWrapper.find('.childObjectWrapper'));
				});
			}
			if (typeof callback == 'function') {
				callback();
			}
		}
	};

	typeSwitchers.off('mousedown').on('mousedown', function (e) {
		e = e || window.event;
		var isAgent = $(this).attr('data-type') == 'agent';
		var other = (isAgent) ? formWrapper.find('.type-switch[data-type="casher"]') : formWrapper.find('.type-switch[data-type="agent"]');
		if (!$(this).hasClass('active')) {
			$(this).addClass('active');
			other.removeClass('active');
			if (isAgent) {
				switcher.switchForm('agent', true);
			} else {
				switcher.switchForm('casher', true);
			}
		}
		e.stopPropagation();
	});

	switcher.switchForm('casher', false);

	if (formWrapper.find('#searchCrmUser .fn-select3-wrapper .select3-select').length == 0) {
		var selInstance = undefined;
		var crmUserSelectId = MB.Core.guid();
		selInstance = MB.Core.select3.init({
			id: crmUserSelectId,
			wrapper: formWrapper.find('#searchCrmUser .fn-select3-wrapper'),
			getString: 'CRM_USER',
			column_name: 'CRM_USER_ID',
			view_name: '',
			value: {
				id: '-10',
				name: 'Выберите пользователя'
			},
			data: [],
			fromServerIdString: 'CRM_USER_ID',
			fromServerNameString: 'CRM_USER_INFO',
			searchKeyword: 'CRM_USER_INFO',
			withEmptyValue: true,
            isSearch: true,
			parentObject: formInstance
		});
	}

	var crmUserSelect = MB.Core.select3.list.getSelect(crmUserSelectId);
	$(crmUserSelect).off('changeVal').on('changeVal', function (e, was, now) {
		var fields = {
			name: $('.fn-field[data-column="CRM_USER_NAME"] input[type="text"]'),
			phone: $('.fn-field[data-column="CRM_USER_PHONE"] input[type="text"]'),
			email: $('.fn-field[data-column="CRM_USER_EMAIL"] input[type="text"]')
		};

		if (now.id == 'empty' || now.id == '') {
			fields.name.val('');
			fields.phone.val('');
			fields.email.val('');

			fields.name.trigger('input');
			fields.phone.trigger('input');
			fields.email.trigger('input');

		} else {
			socketQuery({
				command: 'get',
				object: 'crm_user',
				params: {
					where: 'CRM_USER_ID = ' + now.id
				}
			}, function (res) {
				if (res = socketParse(res)) {
					fields.name.val(res[0]['CRM_NAME']);
					fields.phone.val(res[0]['PHONE']);
					fields.email.val(res[0]['EMAIL']);

					fields.name.trigger('input');
					fields.phone.trigger('input');
					fields.email.trigger('input');
				}
			});
		}
	});

	var cardTypes = undefined;
	var cardTypesDD = '<ul>{{#cardTypes}}<li data-id="{{id}}">{{name}}</li>{{/cardTypes}}</ul>';
	var cardTypesWrapper = formWrapper.find('.cardTypeDD-wrapper');
	var cardTypesActions = {};
	(function () {
		socketQuery({
			command: 'get',
			object: 'PAYMENT_CARD_TYPE'
		}, function (res) {
			res = socketParse(res);
			cardTypes = res;
			var mObj = {
				cardTypes: []
			};
			for (var i in cardTypes) {
				var card = cardTypes[i];
				mObj.cardTypes.push({
					id: card['PAYMENT_CARD_TYPE_ID'],
					name: card['PAYMENT_CARD_TYPE']
				});
			}
			cardTypesDD = Mustache.to_html(cardTypesDD, mObj);
			cardTypesWrapper.html(cardTypesDD);

			cardTypesWrapper.find('li').off('click').on('click', function () {
				var o = {
					command: 'operation',
					object: 'set_order_payment_type',
					order_id: formInstance.activeId,
					payment_type: 'CARD',
					payment_card_type_id: $(this).attr('data-id')
				};
				socketQuery(o, function (res) {
					tableInstance.reload();
                    tableServicesInstance.reload();
					$('.payTypeSwitcher').removeClass('active');
					$('.payTypeSwitcher[data-type="CARD"]').addClass('active');
					cardTypesWrapper.addClass('hidden');
				});

			});

			$(document).on('click', function (e) {
				if ($(e.target).parents('.cardTypeDD-wrapper').length == 0
					&& !$(e.target).hasClass('cardTypeDD-wrapper')
					&& $(e.target).parents('[data-type="CARD"]').length == 0
					&& $(e.target).attr('data-type') != 'CARD') {
					cardTypesWrapper.addClass('hidden');
				}
			});
		});
	}());

	formWrapper.find('.payTypeSwitcher').off('click').on('click', function () {
		var _this = $(this);
//        if(!$(this).hasClass('active')){

		if ($(this).attr('data-type') == 'CARD') {
			cardTypesWrapper.removeClass('hidden');
		} else if ($(this).attr('data-type') == 'CASH') {
			var o = {
				command: 'operation',
				object: 'set_order_payment_type',
				order_id: formInstance.activeId,
				payment_type: 'CASH'
			};
			socketQuery(o, function (res) {
				tableInstance.reload();
                tableServicesInstance.reload();
				$('.payTypeSwitcher').removeClass('active');
				_this.addClass('active');
			});
		} else if ($(this).attr('data-type') == 'PAYORD') {
			var o2 = {
				command: 'operation',
				object: 'set_order_payment_type',
				order_id: formInstance.activeId,
				payment_type: 'PAYORD'
			};
			socketQuery(o2, function (res) {
				tableInstance.reload();
                tableServicesInstance.reload();
				$('.payTypeSwitcher').removeClass('active');
				_this.addClass('active');
			});
		}
//        }
	});
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
				res = JSON.parse(res);
				var toastObj = res.results[0]['toastr'];
				toastr[toastObj['type']](toastObj['message']);
				tableInstance.reload();
			});
		}
	});



//---------***********************************

    var confirmTarif = formWrapper.find('.confirmTarif');
    var tarifSelInstance = undefined;
    var tarifSelectId = MB.Core.guid();
    tarifSelInstance = MB.Core.select3.init({
        id: tarifSelectId,
        wrapper: formWrapper.find('#setTarif .fn-select3-wrapper'),
        getString: 'TARIFF',
        column_name: 'TARIFF_ID',
        view_name: '',
        value: {
            id: '-10',
            name: 'Выберите тариф'
        },
        data: [],
        absolutePosition: true,
        fromServerIdString: 'TARIFF_ID',
        fromServerNameString: 'NAME',
        searchKeyword: 'NAME',
        withEmptyValue: true,
        isSearch: true,
        parentObject: formInstance
    });
//    if (formWrapper.find('#setTarif .fn-select3-wrapper .select3-select').length == 0) {
//
//    }

    var tarifSelect = tarifSelInstance;//MB.Core.select3.list.getSelect(tarifSelectId);
    $(tarifSelInstance).off('changeVal').on('changeVal', function (e, was, now) {
        if (now.id != 'empty' && now.id != '') {
            confirmTarif.removeClass('disabled');
        }else{
            confirmTarif.addClass('disabled');
        }
    });
    confirmTarif.off('click').on('click', function () {
        if (!$(this).hasClass('disabled')) {
            var o = {
                command: 'operation',
                object: 'set_tariff_for_order',
                params: {
                    order_id: formInstance.activeId,
                    tariff_id: tarifSelect.value.id
                }
            };
            socketQuery(o, function (res) {
                res = JSON.parse(res);
                for(var i in res.results[0].execute_result){
                    var execRes = res.results[0].execute_result[i];
                    var ticketId = res.results[0].order_ticket_id[i];
                    if(execRes == 'TRUE'){
                        toastr['success']('Билету с id '+ticketId+' присвоен тариф '+ tarifSelect.value.name);
                    }else{
                        toastr['error']('Не удалось присвоить тариф '+ tarifSelect.value.name +' билету с id '+ticketId);
                    }
                }
                formInstance.reload();
            });
        }
    });


//---------***********************************


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

    var refreshPayButtons = function(){
        var lastItem = '', isMixed = false, currentItem;
        for (var i in tableInstance.data.data) {
            currentItem = tableInstance.data.data[i]['PAYMENT_TYPE'];
            console.log('#ITEMS: ', lastItem, currentItem);
            if (lastItem != '' && lastItem != currentItem) {
                isMixed = true;
                break;
            }
            lastItem = currentItem;
        }
        formWrapper.find('.payTypeSwitcher').removeClass('active');
        if (!isMixed) formWrapper.find('.payTypeSwitcher[data-type="'+currentItem+'"]').addClass('active');
    };

    $(modalInstance).on('save', refreshPayButtons); //TODO вызывается мильён раз. разобраться

    refreshPayButtons();

    statusBlock.attr('data-color', order_status).html(order_status_ru);

    if (+countToPaytickets > 0 || +countReservedTickets > 0) {
        var intReg = new RegExp(/^\-?[0-9]+$/);
//        if(tarifSelect.val)
//        if (intReg.test(setTarif.val())) {
//            confirmTarif.removeClass('disabled');
//        }
    }



//        if(order_status == 'TO_PAY'){
//            cardTypesWrapper.find('li').addClass('disabled');
//        }
    setColorByStatus();

//    formWrapper.find('.quote1').off('click').on('click', function(){
//        if($(this).hasClass('disabled')){return}
//        formInstance.makeOperation('on_realization_order', function(){
//            //disableButtons();
//        });
//    });
//    formWrapper.find('.quote2').off('click').on('click', function(){
//        if($(this).hasClass('disabled')){return}
//        formInstance.makeOperation('on_realization_print_order', function(){
//            //disableButtons();
//        });
//    });
//    formWrapper.find('.quote3').off('click').on('click', function(){
//        if($(this).hasClass('disabled')){return}
//        formInstance.makeOperation('close_realization_order', function(){
//            //disableButtons();
//        });
//    });


	//-----------------------------------------------------------


    var asmId = MB.Core.guid();

    formWrapper.find('.add-service-to-order').off('click').on('click', function(){
        asm.init();
    });

    formWrapper.find('.pay-reserved-services').off('click').on('click', function(){
        if($(this).hasClass('disabled')){
            return false;
        }

        var o = {
            command: 'operation',
            object: 'set_order_additional_service_status_by_order',
            params: {
                order_id: formInstance.activeId,
                event: 'SET_CLOSED'
            }
        };

        socketQuery(o, function(res){
            var jRes = JSON.parse(res)['results'][0];
            toastr[jRes.toastr.type](jRes.toastr.message);

            tableServicesInstance.reload(function(){
                if(countReservedServices() > 0){
                    formWrapper.find('.pay-reserved-services').removeClass('disabled');
                }else{
                    formWrapper.find('.pay-reserved-services').addClass('disabled');
                }
            });
        });
    });

    var asm = {
        wrapper: undefined,

        init: function(){

            asm.initModalWindow(function(){
                asm.wrapper = $('#mw-' + asmId);
                asm.setHandlers();
            });
        },

        initModalWindow: function(bb,cb){
            asm.runAction();
        },

        runAction: function(){
            bootbox.dialog({
                title: 'Выберите мероприятие',
                message: '<div class="asm-select-action-wrapper"></div>',
                buttons: {
                    success: {
                        label: 'Далее',
                        callback: function(){
                            var act_id = selInstance.value.id;
                            if(act_id == '-1' || !act_id){
                                toastr['info']('Выберите мероприятие');
                                return false;
                            }else{
                                asm.runASGroup(act_id);
                            }
                        }
                    },
                    error: {
                        label: 'Отмена',
                        callback: function(){

                        }
                    }
                }
            });

            var wrapper = $('#mw-' + asmId);
            var selWrap = $('.asm-select-action-wrapper');
            var actions = [];
            var actionsFull = [];
            (function(){
                for(var i in tableInstance.data.data){
                    var t = tableInstance.data.data[i];
                    var t_action = t.ACTION_ID;
                    var t_action_name = t.ACTION;
                    if(actions.indexOf(t_action) == -1){
                        actions.push(t_action);
                        actionsFull.push({
                            id: t_action,
                            name: t_action_name
                        });
                    }
                }
            }());

            (function(){
                var selectHtml = '<select class="asm-select-action" data-withempty="true">';
                for(var i in actionsFull){
                    var a = actionsFull[i];
                    selectHtml += '<option value="'+ a.id+'">'+ a.name+'</option>';
                }

                selectHtml += '</select>';
                selWrap.html(selectHtml);
            }());

            var selInstance = selWrap.find('.asm-select-action').select3({

            });
        },

        runASGroup: function(act_id){

            var avlASGroups = [];

            for(var i in tableInstance.data.data){
                var ticket = tableInstance.data.data[i];
                var action_id = ticket['ACTION_ID'];
                var plcGrpId = ticket['ADDITIONAL_SERVICE_GROUP_ID'];
                var status = ticket['STATUS'];
                var isAvlStatus = (status == 'CLOSED')? true: (status == 'TO_PAY')? true: (status == 'RESERVED')? true : false;
                if(action_id == act_id && isAvlStatus){
                    if(avlASGroups.indexOf(plcGrpId) == -1){
                        avlASGroups.push(plcGrpId);
                    }
                }
            }

            var o = {
                command: 'get',
                object: 'action_scheme_additional_service_group',
                params: {
                    where: 'ACTION_ID = '+act_id
                }
            };

            if(avlASGroups.length > 0){
                o.params.where += ' and ADDITIONAL_SERVICE_GROUP_ID in ('+avlASGroups.join(',')+')';
            }else{
                o.params.where += ' and ADDITIONAL_SERVICE_GROUP_ID = 0';
            }


            socketQuery(o, function(res){
                var jRes = JSON.parse(res)['results'][0];
                var pRes = socketParse(res);

                console.log(pRes);

                bootbox.dialog({
                    title: 'Выберите групперовку мест',
                    message: '<div class="asm-select-asg-wrapper"></div>',
                    buttons: {
                        success: {
                            label: 'Далее',
                            callback: function(){
                                var asg_id = selInstance.value.id;
                                if(asg_id == '-1' || !asg_id){
                                    toastr['info']('Выберите групперовку мест');
                                    return false;
                                }else{
                                    asm.runAService(act_id, asg_id);
                                }
                            }
                        },
                        error: {
                            label: 'Отмена',
                            callback: function(){

                            }
                        }
                    }
                });

                var wrapper = $('#mw-' + asmId);
                var selWrap = $('.asm-select-asg-wrapper');

                var asgs = [];
                var asgsFull = [];

                (function(){
                    for(var i in pRes){
                        var t = pRes[i];

                        var t_asg_id = t.ADDITIONAL_SERVICE_GROUP_ID;
                        var t_asg_name = t.NAME;

                        if(asgs.indexOf(t_asg_id) == -1){
                            asgs.push(t_asg_id);
                            asgsFull.push({
                                id: t_asg_id,
                                name: t_asg_name
                            });
                        }
                    }
                }());

                (function(){
                    var selectHtml = '<select class="asm-select-asg" data-withempty="true">';

                    selectHtml += '<option value="without_group">Без групперовки</option>';

                    for(var i in asgsFull){
                        var a = asgsFull[i];
                        selectHtml += '<option value="'+ a.id+'">'+ a.name+'</option>';
                    }

                    selectHtml += '</select>';
                    selWrap.html(selectHtml);
                }());

                var selInstance = selWrap.find('.asm-select-asg').select3({

                });

            });




        },

        runAService: function(act_id, asg_id){
            var asCart = [];

            var o = {
                command: 'get',
                object: 'action_additional_service',
                params: {
                    where: "ACTION_ID = "+act_id
                }
            };

            if(asg_id == 'without_group'){
                o.params.where += " and LINK_TO_AREA_GROUP = 'FALSE'"
            }else{
                o.params.where += " and LINK_TO_AREA_GROUP = 'TRUE'"
            }

            socketQuery(o, function (res) {
                //var jRes = JSON.parse(res)['results'][0];
                var pRes = socketParse(res);
                asm.asData = pRes;

                if(asm.asData.length == 0){
                    toastr['info']('Нет доступных услуг по выбранным параметрам');
                    return false;
                }

                var html = '<div class="as-add-list">';
                for(var i in pRes){
                    var item = pRes[i];

                    var id = item['ACTION_ADDITIONAL_SERVICE_ID'];
                    var name = item['ADDITIONAL_SERVICE_NAME'];
                    var price = item['PRICE'];

                    html += '<div class="one-action-ser-item-wrapper" data-id="'+id+'">'+
                        '<div class="one-action-ser-item-inner">'+
                        '<div class="one-action-ser-item-title">'+name+'</div>'+
                        '<div class="one-action-ser-item-price">'+price+' руб.</div>'+
                        '<div class="one-action-ser-item-count">0</div>'+
                        '<div class="one-action-ser-item-minus one-action-unsel one-action-disabled" data-agid="'+asg_id+'" data-serid="'+id+'">'+
                        '<i class="fa fa-minus"></i>'+
                        '</div>'+
                        '<div class="one-action-ser-item-plus one-action-unsel" data-agid="'+asg_id+'" data-serid="'+id+'">'+
                        '<i class="fa fa-plus"></i>'+
                        '</div>'+
                        '</div>'+
                        '</div>';

                }
                html+='</div><div class="as-add-total-amount-wrapper">Итого: <span class="as-add-total-amount">0 руб.</span></div>';

                bootbox.dialog({
                    title: 'Выберите услуги',
                    message: html,
                    className: 'asm_modal_'+asmId,
                    buttons: {
                        success: {
                            label: 'Добавить',
                            callback: function () {

                                var addSerArr = [];
                                var placeArr = [];
                                var countArr = [];

                                for(var i in asm.asCart.store){
                                    var item = asm.asCart.store[i];
                                    addSerArr.push(item.serId);

                                    console.log('AAA', item.agId);


                                    if(item.agId == 'without_group'){
                                        placeArr.push('0');
                                    }else{
                                        placeArr.push(asm.getFirstPlaceFromOrder(item.agId,act_id).ACTION_SCHEME_ID);
                                    }
                                    countArr.push(item.count);
                                }

                                for(var k in placeArr){
                                    if(placeArr[k] == 'NOT_FOUND'){
                                        toastr['error']('Нет мест в выбранной групперовке');
                                        return false;
                                        break;
                                    }
                                }

                                if(asm.asCart.store.length > 0){
                                    var o = {
                                        command: 'operation',
                                        object: 'add_order_additional_service',
                                        params: {
                                            order_id: formInstance.activeId,
                                            action_additional_service_id: addSerArr.join(','),
                                            action_scheme_id: placeArr.join(','),
                                            service_count: countArr.join(',')
                                        }
                                    };
                                }

                                socketQuery(o, function(res){
                                    var jRes = JSON.parse(res)['results'][0];
                                    console.log(jRes);
                                    asm.asCart.store = [];

                                    tableServicesInstance.reload(function(){
                                        if(countReservedServices() > 0){
                                            formWrapper.find('.pay-reserved-services').removeClass('disabled');
                                        }else{
                                            formWrapper.find('.pay-reserved-services').addClass('disabled');
                                        }
                                    });
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

                asm.bbWrapper = $('.asm_modal_'+asmId);

                asm.asCart.disableBtns();

                asm.bbWrapper.find('.one-action-ser-item-plus').off('click').on('click', function(){
                    var agId = $(this).data('agid');
                    var serId = $(this).data('serid');

                    if($(this).hasClass('one-action-disabled')){
                        return;
                    }

                    asm.asCart.incItem(agId,serId);
                });

                asm.bbWrapper.find('.one-action-ser-item-minus').off('click').on('click', function(){
                    var agId = $(this).data('agid');
                    var serId = $(this).data('serid');

                    if($(this).hasClass('one-action-disabled')){
                        return;
                    }

                    asm.asCart.decItem(agId,serId);
                });

            });

        },

        getFirstPlaceFromOrder: function(agId, action_id){
            for(var i in tableInstance.data.data){
                var ticket = tableInstance.data.data[i];
                var act_id = ticket['ACTION_ID'];
                var plcGrpId = ticket['ADDITIONAL_SERVICE_GROUP_ID'];
                var status = ticket['STATUS'];
                if(act_id == action_id && plcGrpId == agId && status == 'PAID'){
                    return ticket;
                }
            }
            return 'NOT_FOUND';
        },

        getSer: function(agId, serId){
            for(var i in asm.asData){
                var item = asm.asData[i];
                if(item['ACTION_ADDITIONAL_SERVICE_ID'] == serId){
                    return item;
                }
            }
            return false;
        },

        asCart: {
            store: [],

            getStoreItem: function(agId, serId){
                for(var i in asm.asCart.store){
                    var s = asm.asCart.store[i];
                    if(s.agId == agId && s.serId == serId){
                        return s;
                    }
                }
                return false;
            },

            disableBtns: function(){
                for(var i=0; i< asm.bbWrapper.find('.one-action-ser-item-minus').length; i++){
                    var mBtn = asm.bbWrapper.find('.one-action-ser-item-minus').eq(i);
                    var m_agId = mBtn.data('agid');
                    var m_serId = mBtn.data('serid');

                    if(asm.asCart.getStoreItem(m_agId, m_serId).count > 0){
                        mBtn.removeClass('one-action-disabled');
                    }else{
                        mBtn.addClass('one-action-disabled');
                    }

                }

                for(var k=0; k< asm.bbWrapper.find('.one-action-ser-item-plus').length; k++){
                    var pBtn = asm.bbWrapper.find('.one-action-ser-item-plus').eq(k);
                    var p_agId = pBtn.data('agid');
                    var p_serId = pBtn.data('serid');
                    if(!asm.asCart.checkCurrentLimit(p_agId, p_serId)){
                        pBtn.addClass('one-action-disabled');
                    }else{
                        pBtn.removeClass('one-action-disabled');
                    }
                }

            },

            checkCurrentLimit: function(agId, serId){

                for(var i in asm.asCart.store){
                    var s = asm.asCart.store[i];
                    if(s.agId == agId && s.serId == serId){
                        return s.count < asm.getSer(agId, serId).QUANTITY;
                    }
                }
                return asm.getSer(agId, serId).QUANTITY > 0;
            },

            clearEmpty: function(){
                for(var i in asm.asCart.store){
                    var s = asm.asCart.store[i];
                    if(s.count <= 0){
                        delete asm.asCart.store[i];
                    }
                }

                function clearUndefined(arr){
                    for(var k in arr){
                        var s2 = arr[k];
                        if(s2 === undefined){
                            arr.splice(k,1);
                            clearUndefined(arr);
                            break;
                        }
                    }
                }


                clearUndefined(asm.asCart.store);

                console.log('STORE', asm.asCart.store);
            },

            incItem: function(agId,serId){
                var found = false;
                var setCount = 0;
                for(var i in asm.asCart.store){
                    var s = asm.asCart.store[i];
                    if(s.agId == agId && s.serId == serId){
                        s.count ++ ;
                        setCount = s.count;
                        found = true;
                    }
                }
                if(!found){
                    asm.asCart.store.push({
                        agId:agId,
                        serId:serId,
                        count:1
                    });
                    setCount = 1;
                }

                asm.bbWrapper.find('.one-action-ser-item-wrapper[data-id="'+serId+'"] .one-action-ser-item-count').html(setCount);

                asm.asCart.clearEmpty();
                asm.asCart.disableBtns();
                asm.asCart.updateAmount();
            },

            decItem: function(agId,serId){
                var found = false;
                var setCount = 0;
                for(var i in asm.asCart.store){
                    var s = asm.asCart.store[i];
                    if(s.agId == agId && s.serId == serId){
                        s.count -- ;
                        setCount = s.count;
                        found = true;
                    }
                }

                asm.bbWrapper.find('.one-action-ser-item-wrapper[data-id="'+serId+'"] .one-action-ser-item-count').html(setCount);

                asm.asCart.clearEmpty();
                asm.asCart.disableBtns();
                asm.asCart.updateAmount();
            },

            updateAmount: function(){
                var totalAmount = 0;
                for(var i in asm.asCart.store){
                    var s = asm.asCart.store[i];
                    totalAmount += parseInt(s.count) * parseFloat(asm.getSer(s.agId, s.serId)['PRICE']).toFixed(2);
                }

                asm.bbWrapper.find('.as-add-total-amount').html(totalAmount + ' руб.');

            }
        }

    };

}());

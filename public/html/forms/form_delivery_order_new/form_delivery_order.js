(function () {
	var formID = MB.Forms.justLoadedId;

	var formInstance = MB.Forms.getForm('form_delivery_order', formID);
	var formWrapper = $('#mw-' + formInstance.id);

	var tableID = formWrapper.find('.classicTableWrap').attr('data-id');
	var tableInstance = MB.Tables.getTable(tableID);
    var modalInstance = MB.Core.modalWindows.windows.getWindow(formID);

    var countReservedTickets = formInstance.data.data[0]["COUNT_RESERVED_TICKETS"],
		countToPaytickets = formInstance.data.data[0]["COUNT_TO_PAY_TICKETS"],
        order_status = formInstance.data.data[0]["STATUS"],
        order_status_ru = formInstance.data.data[0]["STATUS_RU"],
        delivery_status = formInstance.data.data[0]["DELIVERY_STATUS"];

    //DELIVERY

    formWrapper.find("input[data-column='DL_FULL_ADDRESS']").attr("placeholder", "Введите адрес");
    formWrapper.find("input[data-column='DELIVERY_DATE_FROM']").attr("placeholder", "Дата доставки");
    var select3Ints = MB.Core.select3.list.getSelect(formWrapper.find(".delivery_man_name .select3-wrapper").attr("id"));
    if(!(select3Ints.value.id > 0)) {
        select3Ints.value.id = '-1';
        select3Ints.value.name = 'Курьер';
        select3Ints.setValue();
    }

    var myMap,
        coords = [55.749491, 37.591512],
        zoom = 8,
        metroLinesCatalog = [
            { name: "Россия, Москва, Сокольническая линия", title: "Сокольническая", color: "rgb(237, 27, 53)"},
            { name: "Россия, Москва, Замоскворецкая линия", title: "Замоскворецкая", color: "rgb(68, 184, 92)"},
            { name: "Россия, Москва, Арбатско-Покровская линия", title: "Арбатско-Покровская", color: "rgb(0, 120, 191)"},
            { name: "Россия, Москва, Филевская линия", title: "Филевская", color: "rgb(25, 193, 243)"},
            { name: "Россия, Москва, Кольцевая линия", title: "Кольцевая", color: "rgb(137, 78, 53)"},
            { name: "Россия, Москва, Калужско-Рижская линия", title: "Калужско-Рижская", color: "rgb(245, 134, 49)"},
            { name: "Россия, Москва, Таганско-Краснопресненская линия", title: "Таганско-Краснопресненская", color: "rgb(142, 71, 156)"},
            { name: "Россия, Москва, Калининская линия", title: "Калининская", color: "rgb(255, 203, 49)"},
            { name: "Россия, Москва, Серпуховско-Тимирязевская линия", title: "Серпуховско-Тимирязевская", color: "rgb(161, 162, 163)"},
            { name: "Россия, Москва, Люблинско-Дмитровская линия", title: "Люблинско-Дмитровская", color: "rgb(179, 212, 69)"},
            { name: "Россия, Москва, Каховская линия", title: "Каховская", color: "rgb(121, 205, 205)"},
            { name: "Россия, Москва, Бутовская линия", title: "Бутовская", color: "rgb(172, 191, 225)"}
        ];

    function findMetroOnMap (coordinates, callback) {
        if (myMap && window.ymaps) {
            ymaps.geocode(coordinates).then(function (res) {
                    myMap.geoObjects.removeAll();
                    var address = res.geoObjects.get(0).geometry.getCoordinates();
                    ymaps.geocode(myMap.getCenter(), {
                        kind: 'metro',
                        results: 1
                    }).then(function (met) {
                        met.geoObjects.options.set('preset', 'islands#redCircleIcon');
                        var metro = met.geoObjects;
                        myMap.geoObjects.add(metro);

                        if (callback != undefined) {
                            callback(met);
                        }
                    });

                    var myPlacemark = new ymaps.Placemark(address);
                    myMap.geoObjects.add(myPlacemark);
                },
                function (err) {
                    console.log("Ошибка yandex maps 1", err);
                });
        } else {
            console.log("myMap && window.ymaps", myMap, window.ymaps)
        }
    }

    function initYMap () {
        var mapID = "map-" + formInstance.id;
        formWrapper.find(".yandex_map").html("");
        formWrapper.find(".yandex_map").attr("id", mapID);
        formWrapper.find(".yandex_map").css("width", $('body').width() / 3);
        formWrapper.find(".yandex_map").css("height", $('body').height() * 0.6);

        ymaps.geocode(formInstance.data.data[0]["DL_FULL_ADDRESS"]).then(function (res) {
            if (res.geoObjects.get(0) != undefined) {
                coords = res.geoObjects.get(0).geometry.getCoordinates();
                zoom = 13;
            }
            myMap = new ymaps.Map(
                mapID,
                {
                    center: coords,
                    zoom: zoom,
                    type: 'yandex#map',
                    controls: []
                }, {
                    suppressMapOpenBlock: true
                }
            );
            if (res.geoObjects.get(0) != undefined) {
                findMetroOnMap(coords);
            }
        });
    }

    if(window.ymaps == undefined) {
        $.getScript("https://api-maps.yandex.ru/2.1/?lang=ru_RU", function () {
            ymaps.ready(initYMap);
        });
    } else {
        ymaps.ready(initYMap);
    }

    formWrapper.find(".address_wrapper input").suggestions({
        serviceUrl: "https://dadata.ru/api/v2",
        token: "4c6f9269ee68046587315628da6db92052b4fd10",
        type: "ADDRESS",
        count: 5,
        onSelect: function(suggestion) {
            var geo_lat = suggestion.data.geo_lat,
                geo_lon = suggestion.data.geo_lon;

            if(window.ymaps) {
                coords = [geo_lat, geo_lon];
                myMap.setCenter(coords, 13);
                findMetroOnMap(coords, function(met) {
                    met.geoObjects.each(function (obj) {
                        for (var l in metroLinesCatalog) {
                            if (metroLinesCatalog[l].name == obj.properties.get('description')) {
                                formWrapper.find("div[data-type='DL_METRO_LINE'] .fn-readonly").html(metroLinesCatalog[l].title);
                                formWrapper.find("input[data-column='DL_METRO_LINE']").val(metroLinesCatalog[l].title);
                                formWrapper.find("input[data-column='DL_METRO_LINE']").trigger("input");
                                formWrapper.find(".metro_line_icon").css("border-color", metroLinesCatalog[l].color);
                                break;
                            }
                        }
                        formWrapper.find("div[data-type='DL_METRO_STATION'] .fn-readonly")
                            .html(obj.properties.get('name').replace("метро", "").trim());
                        formWrapper.find("input[data-column='DL_METRO_STATION']")
                            .val(obj.properties.get('name').replace("метро", "").trim());
                        formWrapper.find("input[data-column='DL_METRO_STATION']").trigger("input");
                    });
                } )
            } else {
                console.log("Ошибка yandex maps 2", window.ymaps);
            }

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

    function showDeliveredBttns(isSuccess) {
        if(isSuccess) {
            formWrapper.find(".delivery_button_closed").show();
            formWrapper.find(".delivery_button_closed .delivery_button_label")
                .html("Доставлен успешно (" + formInstance.data.data[0]["DATE_DELIVERED"] + ")");
        } else {
            formWrapper.find(".delivery_button_failed").show();
            formWrapper.find(".delivery_button_failed .delivery_button_label")
                .html("Доставлен неуспешно (" + formInstance.data.data[0]["DATE_DELIVERED"] + ")");
        }

        formWrapper.find(".delivery_courier_wrap").html('<div class="delivery_courier">'
        + formInstance.data.data[0]["DELIVERY_MAN_NAME"] + '</div>');
        formWrapper.find(".delivery_date_wrap").html('<div class="delivery_date2">'
        + formInstance.data.data[0]["DELIVERY_DATE_FROM"] + '</div>');
    }

    if(formInstance.data.data[0]["DL_METRO_LINE"].length > 0) {
        for(var l in metroLinesCatalog) {
            if(metroLinesCatalog[l].title == formInstance.data.data[0]["DL_METRO_LINE"]) {
                formWrapper.find(".metro_line_icon").css("border-color", metroLinesCatalog[l].color);
                break;
            }
        }
    }

    if(delivery_status == "NEED_DELIVERY") {
        formWrapper.find(".delivery_button_need").show();
    }
    if(delivery_status == "WAIT_DELIVERY") {
        formWrapper.find(".delivery_button_give").show();
    }
    if(delivery_status == "IN_DELIVERY") {
        formWrapper.find(".successful_delivery_button").show();
        formWrapper.find(".unsuccessful_delivery_button").show();
    }
    if(delivery_status == "CLOSED_DELIVERY") {
        showDeliveredBttns(true);
    }
    if(delivery_status == "FAILED_DELIVERY") {
        showDeliveredBttns(false);
    }

    formWrapper.find(".need_delivery").off("click").on("click", function(e) {
        var changes = formInstance.changes,
            bool = true;
        for(var c in changes) {
            if(changes[c]["column_name"] == "DELIVERY_DATE_FROM") {
                bool = false;
                break;
            }
        }
        if(bool) {
            if (!(formInstance.data.data[0]["DELIVERY_DATE_FROM"].length > 0)) {
                bool = false;
            }
            if(bool) {
                socketQuery({
                    command: 'operation',
                    object: 'set_order_delivery_status',
                    params: {
                        order_id: formInstance.activeId,
                        event: 'SET_WAIT_DELIVERY'
                    }
                }, function (data) {
                    if (data = socketParse(data)) {
                        $(e.currentTarget).closest(".delivery_button").hide();
                        formWrapper.find(".give_to_courier").closest(".delivery_button").show();
                        formInstance.reload();
                    }
                });
            } else {
                toastr.error("Введите дату доставки!");
            }
        } else {
            toastr.error("Сохраните изменения!");
        }
    });

    formWrapper.find(".give_to_courier").off("click").on("click", function(e) {
        var changes = formInstance.changes,
            bool = true;
        for(var c in changes) {
            if(changes[c]["column_name"] == "DELIVERY_MAN_ID") {
                bool = false;
                break;
            }
        }
        if(bool) {
            if (!(formInstance.data.data[0]["DELIVERY_MAN_ID"] > 0)) {
                bool = false;
            }
            if(bool) {
            socketQuery({
                command: 'operation',
                object: 'set_order_delivery_status',
                params: {
                    order_id: formInstance.activeId,
                    event: 'SET_IN_DELIVERY'
                }
            }, function (data) {
                if (data = socketParse(data)) {
                    $(e.currentTarget).closest(".delivery_button").hide();
                    formWrapper.find(".successful_delivery_button").show();
                    formWrapper.find(".unsuccessful_delivery_button").show();
                    formInstance.reload();
                }
            });
            } else {
                toastr.error("Необходимо назначить курьера!");
            }
        } else {
            toastr.error("Сохраните изменения!");
        }
    });

    formWrapper.find(".successful_delivery").off("click").on("click", function(e) {
        socketQuery({
            command: 'operation',
            object: 'set_order_delivery_status',
            params: {
                order_id: formInstance.activeId,
                event: 'SET_CLOSED_DELIVERY'
            }
        }, function (data) {
            if(data = socketParse(data)) {
                formWrapper.find(".successful_delivery_button").hide();
                formWrapper.find(".unsuccessful_delivery_button").hide();
                formInstance.reload(function() {
                    showDeliveredBttns(true);
                });
            }
        });
    });

    formWrapper.find(".unsuccessful_delivery").off("click").on("click", function(e) {
        socketQuery({
            command: 'operation',
            object: 'set_order_delivery_status',
            params: {
                order_id: formInstance.activeId,
                event: 'SET_FAILED_DELIVERY'
            }
        }, function (data) {
            if(data = socketParse(data)) {
                formWrapper.find(".successful_delivery_button").hide();
                formWrapper.find(".unsuccessful_delivery_button").hide();
                formInstance.reload(function() {
                    showDeliveredBttns(false);
                });
            }
        });
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
            hidden: false,
            condition: [{
                colNames: ['COUNT_RESERVED_TICKETS'],
                matching: ['equal'],
                colValues: ['0']
            }],
            handler: function() {
                if ($(this).hasClass('disabled')) {
                    return
                }
                formInstance.makeOperation('to_pay_order', function () {});
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
//        {
//            title: 'Показать заказ',
//            color: "blue",
//            icon: null,
//            type: "SINGLE",
//            hidden: false,
//            condition: [{
//                colNames: [],
//                matching: [],
//                colValues: []
//            }],
//            handler: function() {
//                if ($(this).hasClass('disabled')) {
//                    return
//                }
//                toClientscreen({type: "preorder", id: formInstance.activeId});
//            }
//        },
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
                send('print_order', {
                    guid: MB.Core.getUserGuid(),
                    order_id: formInstance.activeId
                }, function (res) {
                    console.log('print_order', res);
                    tableInstance.reload();
                    formInstance.reload();
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
                "top": "0px"
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
//        if (intReg.test(setDiscount.val())) {
//            confirmDiscount.removeClass('disabled');
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


}());

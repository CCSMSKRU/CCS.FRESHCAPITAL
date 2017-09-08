(function () {
	var modal = $('.mw-wrap').last();
	var contentID = MB.Contents.justAddedId;
	var contentInstance = MB.Contents.getItem(contentID);
	var contentWrapper = $('#mw-' + contentInstance.id);
	var modalInstance = MB.Core.modalWindows.windows.getWindow(contentID);

	modalInstance.stick = 'top';
	modalInstance.stickModal();


	// Variables
	var one_action_map;
	var sid = MB.User.sid;
	var environment = contentInstance;
	var tickets_stack, action_price_info, interval;

	// Map
	var mapWrapper = contentWrapper.find('.one-action-canvas-container');

	one_action_map = new Map1({
		container: mapWrapper,
		cWidth: $(window).width() - 440,
		cHeight: $(window).height() - 93,
		mode: "casher"
	});

	MB.User.map = one_action_map;
	var socketObject = {
		sid: sid,
		type: "action_scheme",
		param: "action_id",
		id: environment.activeId,
		portion: 30,
		save: {
			command: "operation",
			object: "block_place_list",
			params: {
				action_id: environment.activeId
			},
			field_name: "action_scheme_id"
		},
		load: {
			command: "get",
			object: "action_scheme",
			params: {
				action_id: environment.activeId
			},
			columns: "ACTION_SCHEME_ID,PRICE,STATUS,STATUS_TEXT,FUND_GROUP_NAME,PRICE_GROUP_NAME,BLOCK_COLOR,COLOR",
			field_name: "action_scheme_id"
		}
	};
	var squareO = {
		command: "get",
		object: "action_scheme",
		sid: sid,
		params: {
			action_id: environment.activeId
		}
	};
	var layerO = {
		command: "get",
		object: "action_scheme_layer",
		sid: sid,
		params: {
			action_id: environment.activeId,
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
			action_id: environment.activeId,
			/*columns:"ACTION_SCHEME_OBJECT_ID,OBJECT_TYPE,OBJECT_TYPE,ROTATION,FONT_FAMILY,FONT_SIZE,FONT_STYLE,FONT_WIEGH,COLOR,X,Y,BACKGROUND_URL_SCALE,BACKGROUND_URL_ORIGINAL,BACKGROUND_COLOR",*/
			order_by: "SORT_NO"
		}
	};
	one_action_map.openSocket(socketObject);
	one_action_map.loadSquares(squareO, function () {
		one_action_map.loadRenderItems({
			layerO: layerO,
			objectO: objectO
		}, function () {
			one_action_map.render();
		});
		//one_action_map.loadObjects(o2,function(){
		one_action_map.setLayout(function () {
			one_action_map.setMinMax(function () {
				one_action_map.setScaleCoff(function () {
					one_action_map.render(function () {
						one_action_map.reLoadLayout(function () {
							tickets_stack.load();
							action_price_info.load();
						});
					});
					one_action_map.setEvents();
				});
			});
		});

//        tickets_stack.load();
//        action_price_info.load();


//        uiTabs();
//        uiUl();


		one_action_map.container.on("click", function () {
			if (one_action_map.contextmenu1 != undefined) one_action_map.contextmenu1.delete();
		});

		one_action_map.container.on('myContextMenu', function (e, x, y) {
			var square_id = one_action_map.mouseOnElement(x, y);
			if (!square_id || one_action_map.squares[square_id].order_id == -1) {
				if (one_action_map.contextmenu1 != undefined) one_action_map.contextmenu1.delete();
				return;
			}
			console.log(one_action_map.squares[square_id].order_id);
			var square = one_action_map.squares[square_id];

			one_action_map.contextmenu1 = MB.Core.contextMenu.init(undefined, {
				/*position:{
				 x:1,
				 y:1
				 },*/
				items: [
					{
						title: 'Перейти к заказу',
						iconClass: 'fa-bars',
						disabled: false,
						callback: function (params) {
							one_action_map.changed = true;
							one_action_map.blockedArray = [];
							for (var i in one_action_map.squares) {
								if (+one_action_map.squares[i].order_id === +square.order_id) {
									one_action_map.blockedArray.push(i);
								}
							}
							var form_name = "form_order";
							//ORDER^WEB_ORDER^EXT_AGENT_ORDER^QUOTA
							switch (square.order_type){
								case "QUOTA":
								form_name = "form_order_realization";
									break;
								case "WEB_ORDER":
									form_name = "form_order_web";
									break;
							}

							MB.Core.switchModal({
								type: "form",
								name: form_name,
								isNewModal: true,
								ids: [square.order_id],
								params: {label: "Заказ №: " + square.order_id}
							});
						}
					},
					{
						title: 'Перейти к билету',
						iconClass: 'fa-barcode',
						disabled: false,
						callback: function (params) {
							one_action_map.changed = true;
							one_action_map.blockedArray = [square.id];
							var form_name = "form_order_ticket";
							switch (square.order_type){
								case "QUOTA":
								form_name = "form_order_ticket_realization";
									break;
								case "WEB_ORDER":
									form_name = "form_order_ticket";
									break;
							}
							MB.Core.switchModal({
								type: "form",
								name: form_name,
								isNewModal: true,
								ids: [square.ticket_id],
								params: {label: "Билет №: " + square.ticket_id}
							});
						}
					}
				]
			});

		});
	});

	contentWrapper.children("*").each(function () {
		if (this.id != "")
			preventSelection(document.getElementById(this.id));
	});

	one_action_map.sendSelection = function () {
		one_action_map.oldSelection = one_action_map.selection;
		var object = "block_place_list";
		if (one_action_map.mouseKey == 3)
			object = "unblock_place_list";

		var obj = {
			event: "save_and_update",
			save_params: {
				object: object,
				params: {
					action_id: environment.activeId
				},
				list: one_action_map.selection,
				portion: 200
			},
			load_params: {
				list: one_action_map.selection,
				portion: 20
			}

		};
		one_action_map.toSocket(obj);
		one_action_map.clearSelection();

	};

	one_action_map.sendSelectionCallback = function () {
		/*tickets_stack.load();
		 action_price_info.load();*/
	};

	one_action_map.sendSelectionCallbackFull = function () {
		tickets_stack.load();
		action_price_info.load();
	};

	one_action_map.container.on("click", function () {
		if (one_action_map.contextmenu1 != undefined) one_action_map.contextmenu1.delete();
	});
	one_action_map.container.on('myContextMenu', function (e, x, y) {
		var square_id = one_action_map.mouseOnElement(x, y);
		if (!square_id || one_action_map.squares[square_id].order_id == -1) {
			if (one_action_map.contextmenu1 != undefined) one_action_map.contextmenu1.delete();
			return;
		}
		console.log(one_action_map.squares[square_id].order_id);
		var square = one_action_map.squares[square_id];
		one_action_map.contextmenu1 = MB.Core.contextMenu.init(undefined, {
			/*position:{
			 x:1,
			 y:1
			 },*/
			items: [
				{
					title: 'Перейти к заказу',
					iconClass: 'fa-bars',
					disabled: false,
					callback: function (params) {
						one_action_map.changed = true;
						one_action_map.blockedArray = [];
						for (var i in one_action_map.squares) {
							if (+one_action_map.squares[i].order_id === +square.order_id) {
								one_action_map.blockedArray.push(i);
							}
						}
						var form_name = "form_order";
						switch (square.order_type){
							case "QUOTA":
							form_name = "form_order_realization";
								break;
							case "WEB_ORDER":
								form_name = "form_order_web";
								break;
						}
						MB.Core.switchModal({
							type: "form",
							name: form_name,
							isNewModal: true,
							ids: [square.order_id],
							params: {label: "Заказ №: " + square.order_id}
						});
					}
				},
				{
					title: 'Перейти к билету',
					iconClass: 'fa-barcode',
					disabled: false,
					callback: function (params) {
						one_action_map.changed = true;
						one_action_map.blockedArray = [square.id];
						var form_name = "form_order_ticket";
						switch (square.order_type){
							case "QUOTA":
							form_name = "form_order_ticket_realization";
								break;
							case "WEB_ORDER":
								form_name = "form_order_ticket";
								break;
						}
						MB.Core.switchModal({
							type: "form",
							name: form_name,
							isNewModal: true,
							ids: [square.ticket_id],
							params: {label: "Билет №: " + square.ticket_id}
						});
					}
				}
			]
		});

	});

	// /Map

	function setHeights(isFirst) {
		var tElem = contentWrapper.find('.set-height-tickets');
		var pElem = contentWrapper.find('.set-height-prices');
		var excludeHs = 0;
		var sideBarH = (isFirst) ? $(window).height() - 93 : modalInstance.wrapper.outerHeight() - 55;

		for (var i = 0; i < contentWrapper.find('.excludeHeight').length; i++) {
			var ex = contentWrapper.find('.excludeHeight').eq(i);
			excludeHs += ex.outerHeight();
		}

		var full = sideBarH - excludeHs;
		var half = Math.floor(full / 2);
		var pElemRowH = (pElem.find('li').eq(0).length > 0) ? pElem.find('li').eq(0).outerHeight() : 86;

		if (half % pElemRowH == 0) {
			tElem.height(half + 'px');
			pElem.height(half + 'px');

		} else {
			var lower = 0;
			var bigger = 0;
			var finBigger = 0;
			var finLower = 0;

			for (var k = half; k < (half * 2); k++) {
				bigger++;
				if (k % pElemRowH == 0) {
					finBigger = k;
					break;
				}
			}

			for (var j = half; j > 0; j--) {
				lower++;
				if (k % pElemRowH == 0) {
					finLower = k;
					break;
				}
			}

			if (bigger <= lower) {
				pElem.height(finBigger + 'px');
				tElem.height(full - finBigger + 'px');
			} else {
				pElem.height(finLower + 'px');
				tElem.height(full - finLower + 'px');
			}
		}
		var realPElemH = Math.ceil(pElem.find('li').length / 5) * pElemRowH;

		if (pElem.height() > realPElemH) {
			pElem.height(realPElemH + 'px');
			tElem.height(full - realPElemH + 'px');
		}
	}

	$(modalInstance).off('resize').on('resize', function () {
		setHeights(false);
        one_action_map.resize();
	});

	$(modalInstance).off('focus').on('focus', function () {
        one_action_map.reLoadList(one_action_map.blockedArray);
        tickets_stack.load();
        action_price_info.load();
//		if (one_action_map.changed) {
//			one_action_map.reLoadList(one_action_map.blockedArray);
//		}
        //contentInstance.reload();
	});

	$(modalInstance).off('close').on('close', function () {
		one_action_map.closeSocket();
		if (one_action_map.changed) {
			one_action_map.reLoadList(one_action_map.blockedArray);
			//one_action_map.reLoad();
		}
	});

	$(window).resize(function () {
		setHeights(false);
//        one_action_map.resize();
	});

	// price zones

	action_price_info = {
		box: "action_price_info",
		load: function () {
			var squares = one_action_map.squares;
			var obj = {};
			var total_free_count = 0;
			var html = '';
			var container = contentWrapper.find("." + this.box);
			for (var i1 in squares) {
				var square = squares[i1];
				if (square.status == 0 || +square.price <= 0 || +square.blocked !== 0) continue;
				if (obj[square.priceGroup] === undefined) {
					obj[square.priceGroup] = {
						price: square.salePrice,
						count: 1,
						color: square.color0,
						priceGroup: square.priceGroup
					};
				} else {
					obj[square.priceGroup].count++;
				}
				total_free_count++;

			}

			contentWrapper.find('.totalFreeCount').html(total_free_count);

			var o2 = [];
			for (var k in obj) {
				o2.push(obj[k]);
			}

			o2.sort(function (a, b) {
				if (+a.price < +b.price) return -1;
				else if (+a.price > +b.price) return 1;
				return 0;
			});

			for (var i in o2) {

				var placesText = '';
				var strPlacesCount = o2[i].count.toString();
				if (strPlacesCount.length == 1) {
					if (o2[i].count == 1) {
						placesText = 'место';
					} else if (o2[i].count > 1 && o2[i].count < 5) {
						placesText = 'места';
					} else {
						placesText = 'мест';
					}
				} else if (strPlacesCount.length == 2) {
					if (strPlacesCount.substr(0, 1) == '1') {
						placesText = 'мест';
					} else {
						if (strPlacesCount.substr(1, 1) == '1') {
							placesText = 'место';
						} else if (+strPlacesCount.substr(1, 1) > 1 && +strPlacesCount.substr(1, 1) < 5) {
							placesText = 'места';
						} else {
							placesText = 'мест';
						}
					}
				} else {
					if (strPlacesCount.substr(strPlacesCount.length - 2, 1) == '1') {
						placesText = 'мест';
					} else {
						if (strPlacesCount.substr(strPlacesCount.length - 1, 1) == '1') {
							placesText = 'место';
						} else if (+strPlacesCount.substr(strPlacesCount.length - 1, 1) > 1 && +strPlacesCount.substr(strPlacesCount.length - 1, 1) < 5) {
							placesText = 'места';
						} else {
							placesText = 'мест';
						}
					}
				}

				html += '<li data-squares="' + o2[i].priceGroup + '" class="">' +
				'<div class="a_p_i-inner">' +
				'<div class="a_p_i-color" style="background-color:' + o2[i].color + '"></div>' +
				'<div class="a_p_i-price">' + o2[i].price + ' руб.</div>' +
				'<div class="a_p_i-places">' + o2[i].count + ' ' + placesText + '</div>' +
				'</div>' +
				'</li>';
			}

			var squaresInPrice;
			container.html(html);
			uiUl();
			container.find('li').off('click').on('click', function () {

				//console.log($(this).hasClass('selected'));

				var tmpPriceGrp = $(this).data('squares');
				toClientscreen({
					type: 'highlight',
					priceGrpId: tmpPriceGrp
				});
				if ($(this).hasClass('selected')) {
					clearInterval(interval);
					for (var lig in one_action_map.squares) {
						if (one_action_map.squares[lig].lighted_now != undefined) {
							one_action_map.squares[lig].lighted_now = false;
						}
					}
					one_action_map.render();
				} else {
					clearInterval(interval);

					if (one_action_map.shiftState == 17) {

					} else {
						squaresInPrice = [];
						for (var lig in one_action_map.squares) {
							if (!one_action_map.squares[lig].lighted_now) one_action_map.squares[lig].lighted_now = false;
							one_action_map.squares[lig].lighted_now = false;
						}
					}


					for (var sq in one_action_map.squares) {
						var sqItem = one_action_map.squares[sq];
						if (sqItem.priceGroup == tmpPriceGrp) {
							if (sqItem.status != 0) {
								squaresInPrice.push(sqItem.id);

							}
						}
					}


					var inter = 0;
					interval = window.setInterval(function () {

						for (var ligInt in squaresInPrice) {
							var ligItem = squaresInPrice[ligInt];
							if (!one_action_map.squares[ligItem].lighted_now) one_action_map.squares[ligItem].lighted_now = false;

							if (inter % 2 == 0) {
								one_action_map.squares[ligItem].lighted_now = true;
							} else {
								one_action_map.squares[ligItem].lighted_now = false;
							}
						}
						inter++;
						one_action_map.render();
					}, 400);

				}
			});

			setHeights(false);
		}
	};

	// tickets stack

	tickets_stack = {
		box: "tickets_box",
		load: function () {
			if (environment.order_id == undefined) {
				var self = this;
				socketQuery({
					command: "get",
					object: "user_blocked_places",
					columns: "ACTION_SCHEME_ID,ACTION_NAME,AREA_GROUP,LINE,PLACE,PRICE",
					params: {
						order_by: "ACTION_NAME,LINE,PLACE"
					}
				}, function (data) {
					contentWrapper.find("." + self.box).html("");
					var obj = socketParse(data, {subData: true});
					for (var k in obj.data) {
						contentWrapper.find("." + self.box).append('<tr class="one_place" id="one_place' + obj.data[k]["ACTION_SCHEME_ID"] + '">' +
						'<td class="action_name_ellipsis">' +
						obj.data[k]["ACTION_NAME"] +
						'</td>' +
						'<td class="area_ellipsis">' +
						obj.data[k]["AREA_GROUP"] +
						'</td>' +
						'<td>' +
						obj.data[k]["LINE"] +
						'</td>' +
						'<td>' +
						obj.data[k]["PLACE"] +
						'</td>' +
						'<td>' +
						'<div class="one_action-place-hint-wrapper">' +
						'<div><span class="bold fs11">Мероприятие:</span><br/> ' + obj.data[k]["ACTION_NAME"] + '</div>' +
						'<div><span class="bold fs11">Сектор:</span><br/> ' + obj.data[k]["AREA_GROUP"] + '</div>' +
						'<div><span class="bold fs11">Ряд:</span> ' + obj.data[k]["LINE"] + '</div>' +
						'<div><span class="bold fs11">Место:</span> ' + obj.data[k]["PLACE"] + '</div>' +
						'<div><span class="bold fs11">Цена:</span> ' + obj.data[k]["PRICE"] + '</div>' +
						'</div>' +
						obj.data[k]["PRICE"] +
						'</td>' +
						'</tr>');
					}
					contentWrapper.find('.totalPlaces').html(obj.TOTAL_TICKETS);
					var TOTAL_AMOUNT = (obj.TOTAL_AMOUNT != "") ? obj.TOTAL_AMOUNT : 0;
					contentWrapper.find('.totalAmount').html(TOTAL_AMOUNT);

					setHeights(false);
				});
			}
		},
		clear_blocked_place: function () {
			//clear_blocked_place
			socketQuery({
				command: "operation",
				object: "clear_blocked_place",
				params: {action_id: environment.activeId}
			}, function (data) {
				one_action_map.reLoad(function () {
					action_price_info.load();
					socketParse(data);
				});
				tickets_stack.load();
			});
		},
		clear_blocked_placeAll: function () {
			//clear_blocked_place
			socketQuery({command: "operation", object: "clear_blocked_place"}, function (data) {
				one_action_map.reLoad(function () {
					socketParse(data);
					action_price_info.load();
				});
				tickets_stack.load();
			});
		},
		block_all_places: function () {
			var self = this;
			socketQuery({
				command: "operation",
				object: "block_all_places",
				params: {action_id: environment.activeId}
			}, function (data) {
				one_action_map.reLoad(function () {
					action_price_info.load();
					socketParse(data);
				});
				tickets_stack.load();
			});
		}
	};

	//HANDLERS

	contentWrapper.find('.one-action-clear-highlight').on('click', function () {
		clearInterval(interval);
		for (var lig in one_action_map.squares) {
			if (one_action_map.squares[lig].lighted_now != undefined) {
				one_action_map.squares[lig].lighted_now = false;
			}
		}
		one_action_map.render();
		contentWrapper.find('.action_price_info li.selected').removeClass('selected');
//        toClientscreen({
//            type: 'stopHightlight'
//        });
	});
	//Очистить
	contentWrapper.find(".clear_tickets_stack").off('click').on('click', function () {
		bootbox.dialog({
			message: "Вы уверены что хотите отменить выбор мест?",
			title: "",
			buttons: {
				yes_btn: {
					label: "Да, уверен",
					className: "green",
					callback: function () {
						tickets_stack.clear_blocked_place();
					}
				},
				yes_to_all: {
					label: "Да, для всех залов",
					className: "red",
					callback: function () {
						tickets_stack.clear_blocked_placeAll();
					}
				},
				cancel: {
					label: "Отмена",
					className: "blue"
				}
			}
		});
	});
	//Создать заказ
	contentWrapper.find(".prepare_order").off('click').on('click', function () {
		var params = {
			action_id: environment.action_id
		};
		var object = "create_reserv_order";
		one_action_map.getBlocked();
		socketQuery({command: "operation", object: object, params: params}, function (data) {
			if (data = socketParse(data, false)) {
                one_action_map.reLoadList(one_action_map.blockedArray);
                tickets_stack.load();
                action_price_info.load();
				one_action_map.changed = true;
				MB.Core.switchModal({type: "form", isNewModal: true, name: "form_order", ids: [data['order_id']]}, function(instance){
                    var formInstance = instance;
                    var formModalInstance = MB.Core.modalWindows.windows.getWindow(formInstance.id);
                    $(formModalInstance).off('close').on('close', function(){
                        one_action_map.reLoadList(one_action_map.blockedArray);
                        tickets_stack.load();
                        action_price_info.load();
                    });
                });
			}
		});
	});
	//Создать квоту
	contentWrapper.find(".prepare_quote").off('click').on('click', function () {
		var params = {
			action_id: environment.action_id
		};
		var object = "create_reserved_quota";
		one_action_map.getBlocked();
		socketQuery({command: "operation", object: object, params: params}, function (data) {
			if (data = socketParse(data, false)) {
                one_action_map.reLoadList(one_action_map.blockedArray);
                tickets_stack.load();
                action_price_info.load();
				one_action_map.changed = true;
				MB.Core.switchModal({type: "form", isNewModal: true, parentObject: contentInstance,  name: "form_quote", ids: [data['ORDER_ID']]}, function(instance){
                    var formInstance = instance;
                    var formModalInstance = MB.Core.modalWindows.windows.getWindow(formInstance.id);
                    $(formModalInstance).off('close').on('close', function(){
                        one_action_map.reLoadList(one_action_map.blockedArray);
                        tickets_stack.load();
                        action_price_info.load();
                    });
                });
			}
		});
	});
	//Обновить
	contentWrapper.find('.reloadMap').off('click').on('click', function () {
		one_action_map.reLoad(function () {
			action_price_info.load();
		});
		tickets_stack.load();
	});
	//Выбрать все
	contentWrapper.find(".block_all_places").off('click').on('click', function () {
		tickets_stack.block_all_places();
	});
	//Показать
	contentWrapper.find(".toClientscreen").off('click').on('click', function () {
		toClientscreen({type:'hall', id: contentInstance.activeId});
	});
	//В бронь
	contentWrapper.find('.adminReserv').off('click').on('click', function () {
		one_action_map.getBlocked();
		socketQuery({command: "operation", object: "create_admin_place_reserv"}, function (data) {
			socketParse(data);
			one_action_map.reLoadList(one_action_map.blockedArray);

		});
	});
	//Из брони
	contentWrapper.find('.adminReserv_cancel').off('click').on('click', function () {
		one_action_map.getBlocked();
		socketQuery({command: "operation", object: "remove_admin_place_reserv"}, function (data) {
			socketParse(data);
			one_action_map.reLoadList(one_action_map.blockedArray);
		});
	});
}());



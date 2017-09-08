(function () {

	var formID = MB.Forms.justLoadedId;
	var formInstance = MB.Forms.getForm('form_modify_order', formID);
	var formWrapper = $('#mw-' + formInstance.id);
	var modalInstance = MB.Core.modalWindows.windows.getWindow(formID);

	modalInstance.stick = 'top';
	modalInstance.stickModal();

	// Variables
	var one_action_map;
	var sid = MB.User.sid;
	var environment = formInstance;
	var tickets_stack, action_price_info, interval;
	var action_id;

	var selectAction = $('.select-action');
	var selectActionId = MB.Core.guid();
	var selActionInstance, model, currentSelection = [], curAction, actionsShown;
	var timerH;


	var modifyOrder = {
		sectors: [],
		highlightActionSchemeItems: function (ids) {
			var flag = false;
			var hColors = (function () {
				var c = [];
				for (var i in ids) {
					var color = '#fff';
					for (var j in curAction.sectors) {
						if (ids[i] == curAction.sectors[j].ACTION_SCHEME_ID && curAction.sectors[j].modified) {
							color = '#f00';
							break;
						}
					}
					c[i] = color;
				}
				return c;
			}());

			clearInterval(timerH);
			timerH = window.setInterval(function () {
				for (var i in ids)
					if (flag) {
						one_action_map.squares[ids[i]].color0 = hColors[i];
					} else {
						one_action_map.squares[ids[i]].color0 = '#000';
					}
				for (var i in one_action_map.oldSelection) {
					var id = one_action_map.oldSelection[i];
					one_action_map.squares[id].status = 1;
				}
				one_action_map.render();
				flag = !flag;
			}, 200);
		},
		getTickets: function (cb) {
			var o = {
				command: 'get',
				object: 'order_ticket',
				params: {
					where: 'ORDER_ID=' + formInstance.activeId + " and (STATUS = 'TO_PAY' or STATUS = 'RESERVED')"
				}
			};
			socketQuery(o, function (res) {
				res = socketParse(res);

				model = {
					actions: []
				};

				function isActionInModel(action_id) {
					for (var k in model.actions) {
						var a = model.actions[k];
						if (a.id == action_id) {
							return a;
						}
					}
					return false;
				}

				for (var i in res) {
					var t = res[i];
					t.isFromOrder = true,
						t.type = 'DB';
					t.classname = 'regular';

					if (model.actions.length == 0) {
						model.actions.push({
							id: t.ACTION_ID,
							name: t.ACTION,
							sectors: []
						});

						model.actions[0].sectors.push(t);

					} else {
						var inModelAction = isActionInModel(t.ACTION_ID);
						if (inModelAction) {
							inModelAction.sectors.push(t);
						} else {
							model.actions.push({
								id: t.ACTION_ID,
								name: t.ACTION,
								sectors: []
							});
							model.actions[model.actions.length - 1].sectors.push(t);
						}
					}
				}

				if (model && model.actions.length) {
					var act = curAction || model.actions[0];
					selActionInstance.value.id = act.id;
					selActionInstance.value.name = act.name;
					selActionInstance.setValue();
				}

				if (typeof cb == 'function') {
					cb();
				}
			});
		},
		render: function () {
			var wrapper = formWrapper.find('.tickets-wrapper');

			var html = '<ul>';
			if (!actionsShown) actionsShown = [];
			for (var i in model.actions) {
				if (actionsShown[i] === undefined) actionsShown[i] = true;
				var action = model.actions[i];
				var isFirst = (actionsShown[i]) ? ' class="active"' : '';
				html += '<li' + isFirst + ' data-action-id="' + action.id + '"><p><span></span>' + action.name + '</p><ul class="places">';
				for (var j in action.sectors) {
					var ticket = action.sectors[j],
						trash = (ticket.isFromOrder) ? '<i class="fa fa-trash-o removeFromOrder"></i>' : '',
						orderId = ticket.ORDER_TICKET_ID || '',
						square = ticket.ACTION_SCHEME_ID || '';
					html += '<li' +
					(ticket.modified ? (ticket.isFromOrder ? ' class="toRemove"' : ' class="toAdd"' ) : '') +
					' data-order-id="' + orderId + '" data-square="' + square + '"><div>' + ticket.ACTION_SCHEME_ID + '</div><div>' +
					ticket.AREA_GROUP + '</div><div>' +
					ticket.LINE_TITLE + ' ' +
					ticket.LINE + '</div><div>' +
					ticket.PLACE_TITLE + ' ' +
					ticket.PLACE + '</div>' + trash + '<i class="fa fa-times fa-1 unModify"></i></li>'
				}
				html += '</ul></li>';
			}
			html += '</ul>';

			wrapper.html(html);

			//события для списка билетов справа
			formWrapper.find('.tickets-wrapper p span').off('click').on('click', function (e) {
				e.stopPropagation();
				var p = $(this).parents('li').eq(0);
				p.toggleClass('active');
				if (p.hasClass('active')) {
					p.find('.places').slideDown(250);
				} else {
					p.find('.places').slideUp(250);
				}
				actionsShown[p.index()] = p.hasClass('active');
			});

			formWrapper.find('.tickets-wrapper p').off('click').on('click', function (e) {
				e.stopPropagation();
				selActionInstance.value.id = $(this).parents('li').eq(0).attr('data-action-id');
				selActionInstance.value.name = $(this).parents('p').eq(0).text();
				selActionInstance.setValue();
			});

			formWrapper.find('.tickets-wrapper .removeFromOrder').off('click').on('click', function () {
				var square = $(this).parents('li').eq(0).attr('data-square'),
					orderId = $(this).parents('li').eq(0).attr('data-order-id'),
					actionId = $(this).parents('li').eq(1).attr('data-action-id');

				for (var i in model.actions) {
					var act = model.actions[i];
					if (act.id == actionId) {
						for (var j in act.sectors) {
							var tick = act.sectors[j];
							if (tick.ACTION_SCHEME_ID == square) {
								tick.modified = true;
								break;
							}
						}
						break;
					}
				}
				modifyOrder.render();
				one_action_map.render();
				var toHighlight = [];
				if (curAction)
					for (var i in curAction.sectors) {
						if (curAction.sectors[i].isFromOrder) {
							one_action_map.squares[curAction.sectors[i].ACTION_SCHEME_ID].status = 1;
							toHighlight.push(curAction.sectors[i].ACTION_SCHEME_ID);
						}
					}
				modifyOrder.highlightActionSchemeItems(toHighlight);
			});

			formWrapper.find('.tickets-wrapper .unModify').off('click').on('click', function () {
				var square = $(this).parents('li').eq(0).attr('data-square'),
					orderId = $(this).parents('li').eq(0).attr('data-order-id'),
					actionId = $(this).parents('li').eq(1).attr('data-action-id');
				for (var i in model.actions) {
					var act = model.actions[i];
					if (act.id == actionId) {
						for (var j in act.sectors) {
							var tick = act.sectors[j];
							if (tick.ACTION_SCHEME_ID == square) {
								delete tick.modified;
								if (!tick.isFromOrder) act.sectors.splice(j, 1);
								break;
							}
						}
						break;
					}
				}
				if (!~orderId) {
					var obj = {
						event: "save_and_update",
						save_params: {
							object: 'unblock_place_list',
							params: {
								action_id: actionId
							},
							list: [square],
							portion: 200
						},
						load_params: {
							list: [square],
							portion: 20
						}

					};
					one_action_map.toSocket(obj);
				}

				modifyOrder.render();
				one_action_map.render();
				var toHighlight = [];
				if (curAction)
					for (var i in curAction.sectors) {
						if (curAction.sectors[i].isFromOrder) {
							console.log(curAction.sectors);
							one_action_map.squares[curAction.sectors[i].ACTION_SCHEME_ID].status = 1;
							toHighlight.push(curAction.sectors[i].ACTION_SCHEME_ID);
						}
					}
				modifyOrder.highlightActionSchemeItems(toHighlight);


			});
		}
	};

	selActionInstance = new MB.Core.select3.init({
		id: selectActionId,
		wrapper: selectAction,
		getString: 'ACTION',
		column_name: 'ACTION_ID',
		view_name: '',
		data: [],
		absolutePosition: true,
		fromServerIdString: 'ACTION_ID',
		fromServerNameString: 'NAME',
		searchKeyword: 'NAME',
		withEmptyValue: false,
		isSearch: true,
		parentObject: formInstance
	});

	var mapWrapper = formWrapper.find('.one-action-canvas-container');
	one_action_map = new Map1({
		container: mapWrapper,
		cWidth: $(window).width() - 440,
		cHeight: $(window).height() - 93,
		mode: "casher"
	});
	MB.Core.spinner.stop(mapWrapper);

	$(selActionInstance).off('changeVal').on('changeVal', function (e, was, now) {
		environment.action_id = now.id;
		environment.action_name = now.name;
		MB.Core.spinner.start(mapWrapper);
		one_action_map.destroy();
		one_action_map.ctx.clearRect(0, 0, one_action_map.cWidth, one_action_map.cHeight);

		populateMap(environment.action_id, function () {
			curAction = (function () {
				for (var i in model.actions)
					if (model.actions[i].id == environment.action_id) return model.actions[i];
				return false;
			}());

			socketQuery({
				command: "get",
				object: "user_blocked_places",
				columns: "ACTION_SCHEME_ID,ACTION_NAME,AREA_GROUP,LINE,PLACE,PRICE",
				params: {
					order_by: "ACTION_NAME,LINE,PLACE"
				}
			}, function (res) {
				res = socketParse(res);
				for (var i in res) {
					var makeNew = true;
					if (res[i].ACTION_ID == curAction.id) {
						for (var j in curAction.sectors) {
							var ticket = curAction.sectors[j];
							if (res[i].ACTION_SCHEME_ID == ticket.ACTION_SCHEME_ID) {
								ticket.modified = true;
								makeNew = false;
								break;
							}
						}
						if (makeNew) curAction.sectors.push({
							modified: true,
							ACTION_SCHEME_ID: res[i].ACTION_SCHEME_ID,
							ORDER_TICKET_ID: res[i].ORDER_TICKET_ID,
							AREA_GROUP: res[i].AREA_GROUP,
							LINE_TITLE: res[i].LINE_TITLE,
							LINE: res[i].LINE,
							PLACE_TITLE: res[i].PLACE_TITLE,
							PLACE: res[i].PLACE
						});

					}
				}

				var toHighlight = [];
				if (curAction)
					for (var i in curAction.sectors) {
						if (curAction.sectors[i].isFromOrder) {
							console.log(curAction.sectors);
							one_action_map.squares[curAction.sectors[i].ACTION_SCHEME_ID].status = 1;
							toHighlight.push(curAction.sectors[i].ACTION_SCHEME_ID);
						}
					}
				modifyOrder.highlightActionSchemeItems(toHighlight);
				modifyOrder.render();
				MB.Core.spinner.stop(mapWrapper);
			});
//            updateMapByOrder(function(){
//
//            });
		});
	});

	function populateMap(action_id, cb) {
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
		var squareO = {
			command: "get",
			object: "action_scheme",
			sid: sid,
			params: {
				action_id: environment.action_id
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
								if (typeof cb == 'function') {
									cb();
								}
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
								switch (square.order_type) {
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
								switch (square.order_type) {
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

		formWrapper.children().each(function () {
			if (this.id != "")
				preventSelection(document.getElementById(this.id));
		});

		function modifyModel(remove) {
			var curActionIndex;
			for (var i in model.actions)
				if (model.actions[i].id == environment.action_id) {
					curActionIndex = i;
					break;
				}
			if (curActionIndex === undefined) {
				curActionIndex = model.actions.length;
				model.actions.push({
					id: environment.action_id,
					name: environment.action_name,
					sectors: []
				});
				curAction = model.actions[curActionIndex];
				actionsShown = null;
			}

			for (var i in one_action_map.selection) {
				var sqr = one_action_map.selection[i];
				var place = one_action_map.squares[sqr];
				var makeNew = true;
				for (var j in curAction.sectors) {
					var ticket = curAction.sectors[j];
					if (sqr == ticket.ACTION_SCHEME_ID) {
						if (remove) {
							delete ticket.modified;
							if (!ticket.isFromOrder) curAction.sectors.splice(j, 1);
						} else {
							ticket.modified = true;
						}
						makeNew = false;
						break;
					} else if (remove) makeNew = false;
				}
				if (makeNew) curAction.sectors.push({
					modified: true,
					ACTION_SCHEME_ID: sqr,
					ORDER_TICKET_ID: place['ticket_id'],
					AREA_GROUP: place['areaGroup'],
					LINE_TITLE: place['line_title'],
					LINE: place['line'],
					PLACE_TITLE: place['place_title'],
					PLACE: place['place']
				});
			}

			var toHighlight = (function () {
				var c = [];
				for (var i in curAction.sectors)
					if (curAction.sectors[i].isFromOrder) c.push(curAction.sectors[i].ACTION_SCHEME_ID);
				return c;
			}());
			modifyOrder.highlightActionSchemeItems(toHighlight);


			if (!curAction.sectors.length) {
				model.actions.splice(curActionIndex, 1);
				actionsShown = null;
			}

			modifyOrder.render();
		}

		one_action_map.sendSelection = function () {
			var rmbKey = false;
			var object = "block_place_list";
			if (one_action_map.mouseKey == 3) {
				object = "unblock_place_list";
				rmbKey = true;
			}

			one_action_map.oldSelection = one_action_map.selection;

			modifyModel(rmbKey);

			var obj = {
				event: "save_and_update",
				save_params: {
					object: object,
					params: {
						action_id: environment.action_id
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
			one_action_map.clearSelection(true);
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
							switch (square.order_type) {
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
							switch (square.order_type) {
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
	}

	modifyOrder.getTickets(function () {
		modifyOrder.render();
	});

	// Map


	// /Map

	function setHeights(isFirst) {
		var tElem = formWrapper.find('.set-height-tickets');
		var pElem = formWrapper.find('.set-height-prices');
		var excludeHs = 0;
		var sideBarH = (isFirst) ? $(window).height() - 93 : modalInstance.wrapper.outerHeight() - 55;

		for (var i = 0; i < formWrapper.find('.excludeHeight').length; i++) {
			var ex = formWrapper.find('.excludeHeight').eq(i);
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
		//formInstance.reload();
	});

	$(modalInstance).off('close').on('close', function () {
		one_action_map.closeSocket();
		socketQuery({command: "operation", object: "clear_blocked_place"});
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
			var container = formWrapper.find("." + this.box);
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

			formWrapper.find('.totalFreeCount').html(total_free_count);

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
					formWrapper.find("." + self.box).html("");
					var obj = socketParse(data);
					data = socketParse(data, false);
					for (var k in obj) {
						formWrapper.find("." + self.box).append('<tr class="one_place" id="one_place' + obj[k]["ACTION_SCHEME_ID"] + '">' +
						'<td class="action_name_ellipsis">' +
						obj[k]["ACTION_NAME"] +
						'</td>' +
						'<td class="area_ellipsis">' +
						obj[k]["AREA_GROUP"] +
						'</td>' +
						'<td>' +
						obj[k]["LINE"] +
						'</td>' +
						'<td>' +
						obj[k]["PLACE"] +
						'</td>' +
						'<td>' +
						'<div class="one_action-place-hint-wrapper">' +
						'<div><span class="bold fs11">Мероприятие:</span><br/> ' + obj[k]["ACTION_NAME"] + '</div>' +
						'<div><span class="bold fs11">Сектор:</span><br/> ' + obj[k]["AREA_GROUP"] + '</div>' +
						'<div><span class="bold fs11">Ряд:</span> ' + obj[k]["LINE"] + '</div>' +
						'<div><span class="bold fs11">Место:</span> ' + obj[k]["PLACE"] + '</div>' +
						'<div><span class="bold fs11">Цена:</span> ' + obj[k]["PRICE"] + '</div>' +
						'</div>' +
						obj[k]["PRICE"] +
						'</td>' +
						'</tr>');
					}
					formWrapper.find('.totalPlaces').html(data.TOTAL_TICKETS);
					var TOTAL_AMOUNT = (data.TOTAL_AMOUNT != "") ? data.TOTAL_AMOUNT : 0;
					formWrapper.find('.totalAmount').html(TOTAL_AMOUNT);

					setHeights(false);
				});
			}
		},
		clear_blocked_place: function () {
			//clear_blocked_place
			socketQuery({
				command: "operation",
				object: "clear_blocked_place",
				params: {action_id: environment.action_id}
			}, function (data) {
				one_action_map.reLoad(function () {
					socketParse(data);
					action_price_info.load();
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
				params: {action_id: environment.action_id}
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

	formWrapper.find('.one-action-clear-highlight').on('click', function () {
		clearInterval(interval);
		for (var lig in one_action_map.squares) {
			if (one_action_map.squares[lig].lighted_now != undefined) {
				one_action_map.squares[lig].lighted_now = false;
			}
		}
		one_action_map.render();
		formWrapper.find('.action_price_info li.selected').removeClass('selected');
//        toClientscreen({
//            type: 'stopHighlight'
//        });
	});
	//Очистить
	formWrapper.find(".clear_tickets_stack").off('click').on('click', function () {
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
	formWrapper.find(".prepare_order").off('click').on('click', function () {
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
				MB.Core.switchModal({
					type: "form",
					isNewModal: true,
					name: "form_order",
					ids: [data['order_id']]
				}, function (instance) {
					var formInstance = instance;
					var formModalInstance = MB.Core.modalWindows.windows.getWindow(formInstance.id);
					$(formModalInstance).off('close').on('close', function () {
						one_action_map.reLoadList(one_action_map.blockedArray);
						tickets_stack.load();
						action_price_info.load();
					});
				});
			}
		});
	});
	//Создать квоту
	formWrapper.find(".prepare_quote").off('click').on('click', function () {
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
				MB.Core.switchModal({
					type: "form",
					isNewModal: true,
					parentObject: formInstance,
					name: "form_quote",
					ids: [data['ORDER_ID']]
				}, function (instance) {
					var formInstance = instance;
					var formModalInstance = MB.Core.modalWindows.windows.getWindow(formInstance.id);
					$(formModalInstance).off('close').on('close', function () {
						one_action_map.reLoadList(one_action_map.blockedArray);
						tickets_stack.load();
						action_price_info.load();
					});
				});
			}
		});
	});
	//Обновить
	formWrapper.find('.reloadMap').off('click').on('click', function () {
		one_action_map.reLoad(function () {
			action_price_info.load();
		});
		tickets_stack.load();
	});
	//Выбрать все
	formWrapper.find(".block_all_places").off('click').on('click', function () {
		tickets_stack.block_all_places();
	});
	//Показать
	formWrapper.find(".toClientscreen").off('click').on('click', function () {
		toClientscreen({type: 'hall', id: formInstance.activeId});
	});
	//В бронь
	formWrapper.find('.adminReserv').off('click').on('click', function () {
		one_action_map.getBlocked();
		socketQuery({command: "operation", object: "create_admin_place_reserv"}, function (data) {
			socketParse(data);
			one_action_map.reLoadList(one_action_map.blockedArray);
		});
	});
	//Из брони
	formWrapper.find('.adminReserv_cancel').off('click').on('click', function () {
		one_action_map.getBlocked();
		socketQuery({command: "operation", object: "remove_admin_place_reserv"}, function (data) {
			socketParse(data);
			one_action_map.reLoadList(one_action_map.blockedArray);
		});
	});

	formWrapper.find('.tickets-acceptChanges').off('click').on('click', function () {
		bootbox.dialog({
			message: "Выбранные изменения вступят в силу, вы уверены?",
			title: "Внимание!",
			buttons: {
				success: {
					label: "Да, уверен",
					className: "red",
					callback: function () {
						var modified = {toAdd: [], toRemove: []};
						for (var i in model.actions) {
							var act = model.actions[i];
							for (var j in act.sectors) {
								var tick = act.sectors[j];
								if (tick.modified) {
									if (tick.isFromOrder) {
										modified.toRemove.push(tick.ORDER_TICKET_ID);
									} else {
										modified.toAdd.push(tick.ACTION_SCHEME_ID);
									}
								}
							}
						}

						var callbacksCount = modified.toRemove.length + (modified.toAdd.length ? 1 : 0),
							curCbCount = 0,
							tryToFinish = function () {
								curCbCount++;
								if (callbacksCount == curCbCount) {
									modifyOrder.getTickets();
								}
							};

						if (modified.toAdd.length) socketQuery({
							command: "operation",
							object: 'add_tickets_to_order',
							params: {ORDER_ID: formInstance.activeId}
						}, function (res) {
							socketParse(res);
							tryToFinish();
						});

						for (var i in modified.toRemove) {
							socketQuery({
								command: "operation",
								object: "cancel_ticket",
								ORDER_TICKET_ID: modified.toRemove[i]
							}, function (res) {
								socketParse(res);
								tryToFinish();
							});
						}
					}
				},
				danger: {
					label: "Нет",
					className: "green"
				}
			}
		});
	});

	formWrapper.find('.tickets-cancelChanges').off('click').on('click', function () {
		socketQuery({command: "operation", object: "clear_blocked_place"}, function (res) {
			socketParse(res);
			modifyOrder.getTickets();
		});
	});

}());

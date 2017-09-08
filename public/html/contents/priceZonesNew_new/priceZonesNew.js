(function () {
	var contentID = MB.Contents.justAddedId;
	var contentInstance = MB.Contents.getItem(contentID);
	var contentWrapper = $('#mw-' + contentInstance.id);
	var modalInstance = MB.Core.modalWindows.windows.getWindow(contentID);
	modalInstance.stick = 'top';
	modalInstance.stickModal();

	var sid = MB.User.sid;
	var priceZones_map;
	var environment = contentInstance,
		showUnused = true;
	var scheme = modalInstance.params.scheme || "hall_scheme";
	var zone = modalInstance.params.zone || "price_zone";

	var priceZones = {
		list: [],
		defaultColor: null,
		addSquaresToPriceZone: function(priceZoneId, squares) {
			var me = this;
			for (var i in me.list) {
				var priceZone = me.list[i];
				if(priceZone.id == priceZoneId) {
					var addSelection = priceZone.addSelection;
					var removeSelection = priceZone.removeSelection;
					var finalSelection = [];
					for (var j in squares) {
						var isAdd = true;
						var l;
						for (l in removeSelection) {
							if(squares[j].id == removeSelection[l]) {
								priceZone.removeSelection.splice(l, 1);
								isAdd = false;
								break;
							}
						}
						if(isAdd) {
							for (l in addSelection) {
								if(squares[j].id == addSelection[l]) {
									isAdd = false;
									break;
								}
							}
						}
						if(isAdd) finalSelection.push(squares[j].id)
					}
					priceZone.addSelection = priceZone.addSelection.concat(finalSelection);
					priceZone.placeCount = priceZone.addSelection.length;
					break;
				}
			}
		},
		removeSquaresFromPriceZone: function(squares) {
			var me = this;
			for (var i in me.list) {
				var priceZone = me.list[i];
				var addSelection = priceZone.addSelection;
				for (var j in squares) {
					var isAdd = false;
					for (var l = 0; l < addSelection.length; l++) {
						if(squares[j].id == addSelection[l]) {
							isAdd = true;
							break;
						}
					}
					if(isAdd) {
						priceZone.addSelection.splice(l, 1);
						priceZone.placeCount = priceZone.addSelection.length;
					}
					else if(priceZone.id == squares[j].priceGroupID) {
						priceZone.removeSelection.push(squares[j].id);
					}
				}
			}
		},
		checkSelection: function() {
			var me = this;
			for (var i in me.list) {
				var priceZone = me.list[i];
				if(priceZone.addSelection.length || priceZone.removeSelection.length) return false;
			}

			return true;
		},
		getPriceZoneFromListById: function (id) {
			var me = this;
			for (var i in me.list) {
				var priceZone = me.list[i];
				if(priceZone.id == id) return priceZone;
			}
		},
		getPriceZoneWithSquares: function() {
			var priceZones = [];
			var me = this;
			for (var i in me.list) {
				var priceZone = me.list[i];
				if(priceZone.addSelection.length || priceZone.removeSelection.length) priceZones.push(priceZone);
			}

			return priceZones;
		},
		getPriceZoneById: function (id) {
			if (isNaN(+id) || id == "") {
				return;
			}

			socketQuery({
				command: "get",
				object: "hall_scheme_pricezone",
				params: {
					where: "price_zone_id = " + id
				}
			}, function (data) {
				var obj = socketParse(data);
				contentWrapper.find(".hall_scheme_pricezone").html(obj[0].NAME);
			});
		},

		loadPricingById: function (id) {
			if (isNaN(+id) || id == "") return;
			socketQuery({
				command: "get",
				object: "action_scheme_pricing",
				params: {
					where: "ACTION_PRICING_ID = " + id
				}
			}, function (data) {
				var obj = socketParse(data);
				contentWrapper.find(".pricing_select").html(obj[0].NAME);
			});
		},

		loadPriceZoneGroups: function () {
			var spin = $('.one-action-sidebar-wrapper');
			var me = this;
			MB.Core.spinner.start(spin);
			if (typeof environment.activeId == "undefined") {
				return;
			}

			socketQuery({
				command: "get",
				object: "price_group_for_action_scheme",
				params: {
					action_id: environment.activeId,
					show_all: showUnused
				}
			}, function (data) {
				var obj = socketParse(data, {subData: true});
				me.list = [];
				for (var i in obj.data) {
					var priceGroup = obj.data[i];
					me.list.push({id: priceGroup.PRICE_GROUP_ID, color: priceGroup.COLOR, name: priceGroup.NAME, placeCount: priceGroup.PLACE_COUNT, addSelection: [], removeSelection: []});
				}

				contentWrapper.find(".TOTAL_PLACE_COUNT").html(obj['extra_data']['TOTAL_PLACE_COUNT']);
				contentWrapper.find(".TOTAL_SELECTED_PLACE_COUNT").html(obj['extra_data']['TOTAL_SELECTED_PLACE_COUNT']);
				contentWrapper.find(".TOTAL_NOT_SELECTED_PLACE_COUNT").html(obj['extra_data']['TOTAL_NOT_SELECTED_PLACE_COUNT']);

				me.defaultColor = obj['extra_data']['DEFAULT_COLOR'];

				environment.selected_group = "";

				me.renderTemplate();

				setHeights(false);

				MB.Core.spinner.stop(spin);
			});
		},
		renderTemplate: function() {
			var me = this;
			var tpl = '{{#prices}}' +
				'<li data-id="{{id}}" class="one_price_group">' +
				'<div class="content-items-item-color" style="background-color: {{color}}"></div>' +
				'<div class="content-items-item-title">{{name}}</div>' +
				'<div class="content-items-item-count">{{placeCount}} мест</div>' +
				'</li>' +
				'{{/prices}}';
			var mo = {
				prices: me.list
			};

			contentWrapper.find(".for_price_groups").html(Mustache.to_html(tpl, mo)).off('click').on('click', 'li', function () {
				var id = $(this).attr('data-id');

				if (MB.keys['16'] === true) {
					if ($(this).hasClass('selected')) {

					} else {
						contentWrapper.find(".for_price_groups").find('li').removeClass('selected');
						$(this).addClass('selected');
					}
				} else {
					if ($(this).hasClass('selected')) {

					} else {
						contentWrapper.find(".for_price_groups").find('li').removeClass('selected');
						$(this).addClass('selected');
						environment.selected_group = id;
					}
				}
			});

			toggleSaveButton(priceZones.checkSelection());
		},
		loadPricingList: function () {
			/// загрузка расценок
			if (typeof environment.price_zone_id == "undefined") return;
			socketQuery({
				command: "get",
				object: "action_scheme_pricing",
				params: {where: "action_id = " + environment.activeId + " and DEFAULT_ACTION_PRICING_ID='TRUE'"}
			}, function (data) {
				var obj = socketParse(data);
				if (!obj) return;
				if (+obj[0].ACTION_PRICING_ID == 0) {
					var html = 'Нет записей';
				} else {
					html = obj[0].NAME;
					environment.price_zone_pricing_id = obj[0].ACTION_PRICING_ID;
				}

				contentWrapper.find("#pricing_select").html(html);


				contentWrapper.find('#pricing_select_btn').off('click').on('click', function (e) {

					MB.Core.switchModal({
						type: "form",
						ids: [environment.price_zone_id],
						name: "form_action_scheme_pricing",
						params: {
							tblselectedrow: environment.price_zone_pricing_id,
							tblcallbacks: {
								select: {
									name: "Выбрать",
									callback: function (id) {
										MB.Modal.close("form_price_zone_pricing");
										environment.price_zone_pricing_id = id;
										priceZones_map.loadObj.params.price_zone_pricing_id = id;
										priceZones_map.reLoad();
										loadPricingById(environment.price_zone_pricing_id);
										loadCurrentPricing();

									}
								}
							}
						}
					});
				});
				loadCurrentPricing();
			});
		}

	};

	function loadPricingById(pricing_id) {
		if (isNaN(+pricing_id) || pricing_id == "") return;
		socketQuery({
			command: "get",
			object: "action_scheme_pricing",
			params: {where: "ACTION_PRICING_ID = " + pricing_id}
		}, function (data) {
			if (data = socketParse(data)) contentWrapper.find("#pricing_select").html(data[0].NAME);
		});
	}

	function loadPriceZoneGroups() {
		/// загрузка ценовых групп
		if (typeof environment.price_zone_id == "undefined") return;
		socketQuery({
			command: "get",
			object: "price_group_for_action_scheme",
			params: {action_id: environment.activeId, show_all: showUnused}
		}, function (data) {
			var obj = socketParse(data);
			if (!obj) return;
			var html = '';
			var PRICE_GROUP_ID, NAME, PRICE, COLOR, PLACE_COUNT, OBJVERSION;
			for (var k in obj) {
				PRICE_GROUP_ID = obj[k].PRICE_GROUP_ID;
				NAME = obj[k].NAME;
				PRICE = obj[k].PRICE;
				PLACE_COUNT = obj[k].PLACE_COUNT;
				COLOR = obj[k].COLOR;
				OBJVERSION = obj[k].OBJVERSION;
				html += '<li id="one_price_group' + PRICE_GROUP_ID + '" class="one_price_group">' +
				'<div class="colorCircle" style="background-color: ' + COLOR + '" ></div>' +
				'<div class="info">' +
				'<a href="#">' + NAME + '</a>' +
				'<span>' + PLACE_COUNT + ' мест</span>' +
				'</div>' +
				'</li>';

				/*'<tr>'+
				 '<td class="highlight one_price_group" id="one_price_group'+PRICE_GROUP_ID+'" >'+
				 '<div class="price_color" style="border-left: 10px solid '+COLOR+';border-bottom: 0px solid '+COLOR+';"></div>'+
				 '<a href="#">'+NAME+'</a>'+
				 '</td>'+
				 '<td class="hidden-xs">'+PLACE_COUNT+'</td>'+
				 '</tr>';*/

			}

			contentWrapper.find("#TOTAL_PLACE_COUNT").html(data.TOTAL_PLACE_COUNT);
			contentWrapper.find("#TOTAL_SELECTED_PLACE_COUNT").html(data.TOTAL_SELECTED_PLACE_COUNT);
			contentWrapper.find("#TOTAL_NOT_SELECTED_PLACE_COUNT").html(data.TOTAL_NOT_SELECTED_PLACE_COUNT);

			contentWrapper.find("#for_price_groups").html(html);


			contentWrapper.find(".one_price_group").off('click').on('click', function () {
				var id = this.id.replace(/[^0-9]/ig, "");
				if (priceZones_map.shiftState == 16) {

					bootbox.dialog({
						message: "Раскрасить все этим поясом?",
						title: "",
						buttons: {
							all_place: {
								label: "Да, все места",
								className: "green",
								callback: function () {
									socketQuery({
										command: "operation",
										object: "fill_action_scheme_by_price_group",
										params: {
											action_id: environment.activeId,
											price_group_id: id,
											all: 1
										}
									}, function () {
										priceZones.loadPriceZoneGroups();
										loadCurrentPricing();
										priceZones_map.reLoad();
									});
								}
							},
							free_only: {
								label: "Только свободные",
								className: "yellow",
								callback: function () {
									socketQuery({
										command: "operation",
										object: "fill_action_scheme_by_price_group",
										params: {
											action_id: environment.activeId,
											price_group_id: id,
											all: 0
										}
									}, function () {
										priceZones.loadPriceZoneGroups();
										loadCurrentPricing();
										priceZones_map.reLoad();
									});
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


					return;
				}

				contentWrapper.find(".price_color").css("borderBottomWidth", "0");
				contentWrapper.find(".price_color", this).css("borderBottomWidth", "2px");
				environment.selected_group = this.id.replace(/[^0-9]+/ig, '');
			});

			if (environment.selected_group != 0) {
				priceZones_map.shiftState = 0;
				contentWrapper.find("#one_price_group" + environment.selected_group).click();
			}

		});


	}

	function loadPricingList() {
		/// загрузка расценок
		if (typeof environment.activeId == "undefined") return;
		socketQuery({
			command: "get",
			object: "action_scheme_pricing",
			params: {
				where: "action_id = " + environment.activeId + " and DEFAULT_ACTION_PRICING_ID='TRUE'"
			}
		}, function (data) {
			var obj = socketParse(data);
			if (!obj) return;
			if (+obj[0].ACTION_PRICING_ID == 0) {
				var html = 'Нет записей';
			} else {
				html = obj[0].NAME;
				environment.price_zone_pricing_id = obj[0].ACTION_PRICING_ID;
			}

			contentWrapper.find("#pricing_select").html(html);


			contentWrapper.find('#pricing_select_btn').off('click').on('click', function (e) {

				MB.Core.switchModal({
					type: "form",
					ids: [environment.activeId],
					name: "form_action_scheme_pricing",
					isNewModal: true,
					params: {
						tblselectedrow: environment.price_zone_pricing_id,
						tblcallbacks: {
							select: {
								name: "Выбрать",
								callback: function (id) {
									console.log(id);
									MB.Modal.close("form_action_scheme_pricing");
									environment.price_zone_pricing_id = id;

									priceZones_map.loadObj.params.price_zone_pricing_id = id;
									priceZones_map.reLoad();
									loadPricingById(environment.price_zone_pricing_id);
									loadCurrentPricing();


									//loadFundGroups();
								}
							}
						}
					}
				});
			});

			loadCurrentPricing();

		});
	}

	function loadCurrentPricing() {
		/// загрузка конкретной расценки
		if (!!environment.CurrentPricingNotSaved) {
			console.log('расценка не сохранена');

			bootbox.dialog({
				message: 'Расценка не сохранена',
				title: "",
				buttons: {
					save: {
						label: "Сохранить",
						className: "green",
						callback: function () {
							contentWrapper.find("#pricing_save_button").click();
						}
					},
					refresh: {
						label: "Обновить",
						className: "yellow",
						callback: function () {
							environment.CurrentPricingNotSaved = false;
							$('#pricing_save_button').removeClass('active');
							loadCurrentPricing();
						}
					}

				}
			});

			return;

		}

		socketQuery({
			command: "get",
			object: "action_scheme_pricing_item",
			params: {
				where: "action_pricing_id=" + environment.price_zone_pricing_id
			}
		}, function (data) {

			var obj = socketParse(data);
			console.log(obj);
			var html = '';
			var PRICE_ZONE_PRICING_ITEM_ID, PRICE_GROUP_ID, PRICE_GROUP, PLACE_COUNT, PRICE, AMOUNT, TOTAL_AMOUNT, COLOR, OBJVERSION, TOTAL_PLACE_COUNT = 0, TOTAL_ZONES = 0;
			TOTAL_AMOUNT = 0;
			for (var k in obj) {
				PRICE_ZONE_PRICING_ITEM_ID = obj[k].ACTION_PRICING_ITEM_ID;
				PRICE_GROUP_ID = obj[k].PRICE_GROUP_ID;
				PRICE_GROUP = obj[k].PRICE_GROUP;
				PLACE_COUNT = +obj[k].PLACE_COUNT;
				PRICE = +obj[k].PRICE;
				AMOUNT = +obj[k].AMOUNT;
				COLOR = obj[k].COLOR;
				OBJVERSION = obj[k].OBJVERSION;


				html +=
					'<tr class="pricing_row" id="pricing_row' + PRICE_ZONE_PRICING_ITEM_ID + '" data-price-id="' + PRICE_GROUP_ID + '">' +
					'<td>' + PRICE_GROUP +
					'</td>' +
					'<td>' +
					PLACE_COUNT +
					'</td>' +
					'<td class="highlight pricing_cell_cost_input_box cost">' +
					'<input type="text" class="pricing_cell_cost_input" id="pricing_cell_cost_input' + PRICE_ZONE_PRICING_ITEM_ID + '" value="' + PRICE + '">' +
					'</td>' +
					'<td>' +
					AMOUNT +
					'</td>' +
					'<input type="hidden" id="pricing_row_objversion' + PRICE_ZONE_PRICING_ITEM_ID + '" value="' + OBJVERSION + '">' +
					'</tr>';

				TOTAL_ZONES++;
				TOTAL_PLACE_COUNT += PLACE_COUNT;
				TOTAL_AMOUNT += AMOUNT;
			}
			//html += ;
			contentWrapper.find(".price-zone-pricing-wrapper tbody").html(html);
			//$(".pricing_cell_cost_input").editable();

			function count_total() {
				var total_amount = 0;
				contentWrapper.find(".pricing_row").each(function () {
					var count = (!isNaN(+$(this).children(".count").text())) ? +$(this).children(".count").text() : 0;
					var price = (!isNaN(+$(this).children(".cost").children(".pricing_cell_cost_input").val())) ? +$(this).children(".cost").children(".pricing_cell_cost_input").val() : 0;
					total_amount += count * price;
				});
				contentWrapper.find(".TOTAL_SUMM").html(TOTAL_AMOUNT);
			}

			contentWrapper.find(".TOTAL_PRICING_ZONES_COUNT").html(TOTAL_ZONES);
			contentWrapper.find(".TOTAL_PLACES_IN_PRICING_ZONES").html(TOTAL_PLACE_COUNT);
			contentWrapper.find(".TOTAL_SUMM").html(TOTAL_AMOUNT);
			setHeights(false);
			//$(".pricing_cell_cost_input").mask("?9999999999",{placeholder:''});
			contentWrapper.find(".pricing_cell_cost_input").focus(function () {
				var self = $(this);
				window.setTimeout(function () {
					self.select();
				}, 20);
			}).keyup(function (e) {
				if (e.which == 13) {
					if ($(this).parents(".pricing_row").next(".pricing_row").length > 0)
						$(this).parents(".pricing_row").next(".pricing_row").children(".cost").children(".pricing_cell_cost_input").focus();
				}
				var count = (!isNaN(+$(this).parents(".pricing_row").children(".count").text())) ? +$(this).parents(".pricing_row").children(".count").text() : 0;
				var price = +$(this).val();
				$(this).parents(".pricing_row").children(".amount").children("span").html(count * price);
				count_total();
			}).off('change').on('change input', function () {
				var $t = $(this),
					$cnt = $t.parents('tr').eq(0).find('td:eq(1)'),
					$smm = $t.parents('tr').eq(0).find('td:last');
				var summ = (isNaN($t.val() * $cnt.text())) ? '' : $t.val() * $cnt.text();
				environment.CurrentPricingNotSaved = true;
				$('#pricing_save_button').addClass('active');
				$smm.text(summ);
			});

			contentWrapper.find("#pricing_save_button").off('click').on('click', function () {
				contentWrapper.find(".pricing_row").each(function () {
					var id = this.id.replace(/[^0-9]/ig, ""),
						priceGroupId = $(this).attr('data-price-id');
					socketQuery({
						command: "modify",
						object: "action_scheme_pricing_item",
						params: {
							action_pricing_item_id: id,
							price: +$("#pricing_cell_cost_input" + id).val()
						}
					}, function (data) {
						socketParse(data, function () {
							var items = [];
							for (var i in priceZones_map.squares) {
								if (priceZones_map.squares[i].priceGroupID == priceGroupId) items.push(priceZones_map.squares[i].id);
							}
							priceZones_map.toSocket({event: "load", load_params: {list: items}});
						});
						environment.CurrentPricingNotSaved = false;
						$('#pricing_save_button').removeClass('active');
						if (contentWrapper.find(".pricing_row").length - 1 == $(this).index()) loadCurrentPricing();
					});
				});
				bootbox.dialog({
					message: "Расценка успешно сохранена.",
					title: "",
					buttons: {
						ok: {
							label: "Ок",
							className: "green",
							callback: function () {
							}
						}
					}
				});
			});
			$("#pricing_reset_btn").off('click').on('click', function () {
				contentWrapper.find('.pricing_row .pricing_cell_cost_input').each(function () {
					$(this).val('0').parents('tr').eq(0).find('td:last').text('0');
					environment.CurrentPricingNotSaved = true;
					$('#pricing_save_button').addClass('active');
				});
			});

		});
	}


	function setHeights(isFirst) {
		var tElem = contentWrapper.find('.for_price_groups');
		var pElem = contentWrapper.find('.price-zone-pricing-wrapper');
		var excludeHs = 0;
		var sideBarH = (isFirst) ? $(window).height() - 93 : modalInstance.wrapper.outerHeight() - 55;

		for (var i = 0; i < contentWrapper.find('.excludeHeight').length; i++) {
			var ex = contentWrapper.find('.excludeHeight').eq(i);
			excludeHs += ex.outerHeight();
		}

		var full = sideBarH - excludeHs;
		var half = Math.floor(full / 2);

		console.log('FULL', sideBarH, excludeHs);

		tElem.height(half - 3 + 'px');
		pElem.height(half - 3 + 'px');
	}

	function toggleSaveButton(disable) {
		var saveButton = contentWrapper.find('.savePriceZone');
		if(disable) saveButton.addClass("disabled");
		else saveButton.removeClass("disabled");
	}


	socketQuery({
		command: "get",
		object: "action",
		params: {where: "action_id = " + environment.activeId}
	}, function (data0) {


		var obj = socketParse(data0);
		environment.hall_scheme_id = obj[0].HALL_SCHEME_ID;

		priceZones_map = new Map1({
			container: contentWrapper.find('.one-action-canvas-container'),
			mode: "admin",
			cWidth: $(window).width() - 440,
			cHeight: $(window).height() - 93
		});

		var socketObject = {
			sid: sid,
			type: "action_scheme_price_group"+MB.Core.guid(),
			param: "action_id",
			id: environment.activeId,
			portion: 200,
			save: {
				command: "operation",
				object: "change_action_scheme_price_group_by_list",
				field_name: "ACTION_SCHEME_ID"
			},
			load: {
				command: "get",
				object: "action_scheme_price_group",
				params: {
					action_id: environment.activeId
				},
				columns: "ACTION_SCHEME_ID,PRICE,STATUS,STATUS_TEXT,price_GROUP_NAME,PRICE_GROUP_NAME,BLOCK_COLOR,COLOR",
				field_name: "ACTION_SCHEME_ID"
			}
		};

		var o = {
			command: "get",
			object: "action_scheme_price_group",
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
				where: "VISIBLE_ADMIN='TRUE'",
				columns: "ACTION_SCHEME_LAYER_ID",
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
		priceZones_map.openSocket(socketObject);

		priceZones_map.loadSquares(o, function () {
			priceZones_map.loadRenderItems({
				layerO: layerO,
				objectO: objectO
			}, function () {
				priceZones_map.render();
			});

			priceZones_map.setLayout(function () {
				priceZones_map.setMinMax(function () {
					priceZones_map.setScaleCoff(function () {
						priceZones_map.render(function () {

							$(modalInstance).off('resize').on('resize', function () {
//                                setHeights(false);
								priceZones_map.resize();
							});

							priceZones_map.reLoadLayout(function () {
							});
						});

						priceZones_map.setEvents();
					});

				});
			});

			priceZones.loadPriceZoneGroups();
			loadPricingList();
			environment.onFocus = function () {
				priceZones.loadPriceZoneGroups();
				loadPricingList();
				priceZones_map.reLoad();
				priceZones_map.render();
			};
			environment.onClose = function () {
				log("priceZones_map onClose");
				priceZones_map.closeSocket();
			};
		});

		var wrap = $("#" + environment.world + "_" + environment.id + "_wrapper");
		wrap.children("*").each(function () {
			if (this.id != "")
				preventSelection(document.getElementById(this.id));
		});

		priceZones_map.sendSelection = function () {
			console.log(environment.selected_group);
			if (environment.selected_group === undefined && priceZones_map.mouseKey == 1) {
				toastr['warning']('Пожалуйста, выберите пояс');
				priceZones_map.clearSelection(true);
				priceZones_map.render();
				return;
			}
			var mk = priceZones_map.mouseKey;
			var price_group_id = environment.selected_group;
			var priceGroup = priceZones.getPriceZoneFromListById(price_group_id);
			var priceGroupColor = priceZones.defaultColor;
			var priceGroupID = "";
			var priceGroupName = "";
			var selection = priceZones_map.selection;
			var squares = [];
			if (+price_group_id <= 0 && mk == 1) {
				bootbox.dialog({
					message: "Пожалуйста, выберите  ценовой пояс.",
					title: "Ценовой пояс не выбран.",
					buttons: {
						ok: {
							label: "Ок",
							className: "blue",
							callback: function () {
								priceZones_map.clearSelection(true);
								priceZones_map.render();
							}
						}
					}
				});
				return;
			}


			if (mk == 3) price_group_id = "";
			else if (mk == 1) {
				priceGroupColor = priceGroup.color;
				priceGroupName = priceGroup.name;
				priceGroupID = priceGroup.id;
			}

			for (var i in selection) {
				var squareId = selection[i];
				var square = priceZones_map.squares[squareId];
				squares.push({id:square.id, priceGroupID: square.priceGroupID});
				square.color0 = priceGroupColor;
				square.priceGroup = priceGroupName;
				square.priceGroupID = priceGroupID;
				square.lighted = false;
				priceZones_map.renderSquareImage(square)
			}

			if (mk == 1) priceZones.addSquaresToPriceZone(priceGroupID, squares);
			else if(mk == 3) priceZones.removeSquaresFromPriceZone(squares);

			priceZones.renderTemplate();
			priceZones_map.clearSelection();
		};

		priceZones_map.sendSelectionCallback = function () {
			priceZones.loadPriceZoneGroups();
			loadCurrentPricing();

		};
		priceZones_map.sendSelectionCallbackFull = function () {
			priceZones.loadPriceZoneGroups();
			loadCurrentPricing();
		};


		contentWrapper.find('.change-price-zone-scheme').off('click').on('click', function () {
			MB.Core.switchModal({
				type: 'form',
				isNewModal: true,
				name: 'form_hall_scheme_price_zone',
				ids: [contentInstance.activeId],
				params: {
					setPriceZoneSchemeCb: function (id, title) {
						environment.price_zone_id = id;
						environment.price_zone_title = title;
						priceZones_map.loadObj.params.price_zone_id = id;
						priceZones_map.reLoad();
						priceZones.loadPriceZoneGroups();
						priceZones.loadPricingList();
					}
				}
			}, function (res) {
				console.log(res);
			});
		});

		contentWrapper.find('pricing_refresh_button, .reloadMap').on('click', function () {
			loadPriceZoneGroups();
			loadCurrentPricing();
			priceZones_map.reLoad();
		});

		contentWrapper.find('.savePriceZone').on('click', function () {
			var list = priceZones.getPriceZoneWithSquares();
			var sendQuery = function(squares, priceZoneId) {
				var obj = {
					event: "save_and_update",

					save_params: {
						params: {
							price_group_id: priceZoneId
						},
						list: squares,
						portion: 200
					},
					load_params: {
						list: squares,
						portion: 200
					}
				};

				priceZones_map.toSocket(obj);
			};
			for (var i in list) {
				var priceZone = list[i];
				if(priceZone.addSelection.length) sendQuery(priceZone.addSelection, priceZone.id);
				if(priceZone.removeSelection.length) sendQuery(priceZone.removeSelection, "");
			}
		});


		/// Кнопка очистить
		contentWrapper.find(".clear_tickets_stack").on('click', function () {
			console.log(environment.price_zone_id, environment.price_group_id)
			bootbox.dialog({
				message: "Очистить схему?",
				title: "",
				buttons: {
					success: {
						label: "Да",
						className: "green",
						callback: function () {
							socketQuery({
								command: "operation", object: "fill_action_scheme_by_price_group", params: {
									action_id: environment.activeId,
									price_group_id: "",
									all: 1
								}
							}, function () {
								priceZones.loadPriceZoneGroups();
								loadCurrentPricing();
								priceZones_map.reLoad();
							});
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
		});

		/// Выбрать всё
		contentWrapper.find(".block_all_places").on('click', function () {
			var selected = contentWrapper.find('.for_price_groups li.selected');
			if (selected.length) {
				bootbox.dialog({
					message: "Раскрасить все этим поясом?",
					title: "",
					buttons: {
						all_place: {
							label: "Да, все места",
							className: "green",
							callback: function () {
								socketQuery({
									command: "operation", object: "fill_action_scheme_by_price_group", params: {
										action_id: environment.activeId,
										price_group_id: selected.attr('data-id'),
										all: 1
									}
								}, function () {
									loadPriceZoneGroups();
									loadCurrentPricing();
									priceZones.loadPriceZoneGroups();
									priceZones_map.reLoad();
								});
							}
						},
						free_only: {
							label: "Только свободные",
							className: "yellow",
							callback: function () {
								socketQuery({
									command: "operation",
									object: "fill_action_scheme_by_price_group",
									params: {
										action_id: environment.activeId,
										price_group_id: selected.attr('data-id'),
										all: 0
									}
								}, function () {
									loadPriceZoneGroups();
									loadCurrentPricing();
									priceZones.loadPriceZoneGroups();
									priceZones_map.reLoad();
								});
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
			} else {
				bootbox.dialog({
					message: "Выберите хотя бы один пояс",
					title: "",
					buttons: {
						cancel: {
							label: "ОК",
							className: "blue",
							callback: function () {

							}
						}
					}
				});
			}
		});

		contentWrapper.find('.toggleUnusedPrices').on('click', function () {
			var t = $(this);
			if (t.hasClass('active')) {
				showUnused = false;
				t.removeClass('active').html('<i class="fa fa-eye-slash"></i>&nbsp;&nbsp;Показать неиспользуемые фонды');
			} else {
				showUnused = true;
				t.addClass('active').html('<i class="fa fa-eye"></i>&nbsp;&nbsp;Cкрыть неиспользуемые фонды');
			}
			priceZones.loadPriceZoneGroups();
		});

		contentWrapper.find('.go-to-fund-zones').on('click', function () {
			var id = environment.activeId;

			socketQuery({
				command: "get",
				object: "hall_scheme",
				params: {
					where: "hall_scheme_id = " + id
				}
			}, function (res) {
				var obj = MB.Core.jsonToObj(JSON.parse(res)['results'][0])[0];
				var titlePrice = obj.FUND_ZONE + ' для ' + obj.NAME;
				console.log(obj);
				var hall_id = obj.HALL_ID;
				MB.Core.switchModal({
					type: "content",
					isNew: true,
					filename: "fundZones",
					params: {
						hall_scheme_id: id,
						hall_id: hall_id,
						title: titlePrice,
						hall_scheme_res: JSON.parse(res)['results'][0], //nado obj
						label: 'Редактор зала '
					}
				});
			});
		});
		contentWrapper.find('.go-to-price-groups').on('click', function () {
			modalInstance.collapse();
			MB.Core.switchPage({
				type: "table",
				name: 'table_price_group',
				isNewTable: true
			});
		});

	});


}());

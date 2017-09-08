/*environment.reload = function(d){
 log("priceZones ReLoaded");
 };*/







//action_priceZones_init();
function action_priceZones_init(id) {

	var environment = MB.Content.find(id);
	var action_priceZones_map;
	var sid = MB.User.sid;

	environment.select_price = {};
	environment.select_pricing = {};
	environment.selected_group = 0;
	var price_zone_pricing_id;
	var newerGuid = environment.parentGuid || MB.Core.guid();
	var modalWrapper = $('#modal_' + id + '_wrapper');
	//action_priceZones_map.shiftState = 0;


	function loadPriceZoneById(price_zone_id) {
		if (isNaN(+price_zone_id) || price_zone_id == "") return;
		MB.Core.sendQuery({
			command: "get",
			object: "hall_scheme_pricezone",
			sid: sid,
			params: {where: "price_zone_id = " + price_zone_id}
		}, function (data) {
			//var obj = xmlToObject(data,"ROW");
			var obj = MB.Core.jsonToObj(data);
			$("#hall_scheme_pricezone").html(obj[0].NAME);
		});
	}

	function loadPricingById(pricing_id) {
		if (isNaN(+pricing_id) || pricing_id == "") return;
		//MB.Core.sendQuery({command:"get",object:"price_zone_pricing",sid:sid,params:{where: "price_zone_pricing_id = "+pricing_id}},function(data){
		MB.Core.sendQuery({
			command: "get",
			object: "action_scheme_pricing",
			sid: sid,
			params: {where: "ACTION_PRICING_ID = " + pricing_id}
		}, function (data) {
			//var obj = xmlToObject(data,"ROW");
			var obj = MB.Core.jsonToObj(data);
			$("#pricing_select").html(obj[0].NAME);
		});
	}


	function loadPriceZoneGroups() {
		/// загрузка ценовых групп

		var isUsedOnly = ($("#modal_" + id + "_wrapper").find('input.showOnlyUsed').attr('checked') == 'checked') ? "FALSE" : "TRUE";

		if (typeof environment.action_id == "undefined") return;
		MB.Core.sendQuery({
			command: "get",
			object: "price_group_for_action_scheme",
			sid: sid,
			params: {action_id: environment.action_id, show_all: isUsedOnly}
		}, function (data) {
			var obj = MB.Core.jsonToObj(data);
			var html = '';
			var PRICE_GROUP_ID, NAME, PRICE, COLOR, PLACE_COUNT, OBJVERSION;
			for (var k in obj) {
				PRICE_GROUP_ID = obj[k].PRICE_GROUP_ID;
				NAME = obj[k].NAME;
				PRICE = obj[k].PRICE;
				PLACE_COUNT = obj[k].PLACE_COUNT;
				COLOR = obj[k].COLOR;
				OBJVERSION = obj[k].OBJVERSION;
				html += '<li id="one_price_group' + PRICE_GROUP_ID + '"  class="one_price_group">' +
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

			$("#TOTAL_PLACE_COUNT").html(data.TOTAL_PLACE_COUNT);
			$("#TOTAL_SELECTED_PLACE_COUNT").html(data.TOTAL_SELECTED_PLACE_COUNT);
			$("#TOTAL_NOT_SELECTED_PLACE_COUNT").html(data.TOTAL_NOT_SELECTED_PLACE_COUNT);

			$("#for_price_groups").html(html);


			$(".one_price_group").off('click').on('click', function () {
				var id = this.id.replace(/[^0-9]/ig, "");
				if (action_priceZones_map.shiftState == 16) {

					bootbox.dialog({
						message: "Раскрасить все этим поясом?",
						title: "",
						buttons: {
							all_place: {
								label: "Да, все места",
								className: "green",
								callback: function () {


									bootbox.dialog({
										message: "Перевод выделеных мест в другой ценовой пояс может повлиять на стоимость этих мест.<br>" +
										"Эта операция будет применена только для свободных на текущий момент мест.<br>" +
										"Вы уверены, что хотите выполнить переоценку?",
										title: "<span style='color:#f00;'>Переоценка.</span>",
										buttons: {
											ok: {
												label: "Выполнить переоценку",
												className: "red",
												callback: function () {
													MB.Core.sendQuery({
														command: "operation",
														object: "fill_action_scheme_by_price_group",
														sid: sid,
														params: {
															action_id: environment.action_id,
															price_group_id: id,
															all: 1
														}
													}, function () {
														loadPriceZoneGroups();
														loadCurrentPricing();
														action_priceZones_map.reLoad();
													});
												}
											},
											cancel: {
												label: "Отмена",
												className: "green",
												callback: function () {
													action_priceZones_map.selection = [];
													action_priceZones_map.reLoad();
												}
											}
										}
									});
								}
							},
							free_only: {
								label: "Только свободные",
								className: "yellow",
								callback: function () {
									bootbox.dialog({
										message: "Перевод выделеных мест в другой ценовой пояс может повлиять на стоимость этих мест.<br>" +
										"Эта операция будет применена только для свободных на текущий момент мест.<br>" +
										"Вы уверены, что хотите выполнить переоценку?",
										title: "<span style='color:#f00;'>Переоценка.</span>",
										buttons: {
											ok: {
												label: "Выполнить переоценку",
												className: "red",
												callback: function () {
													MB.Core.sendQuery({
														command: "operation",
														object: "fill_action_scheme_by_price_group",
														sid: sid,
														params: {
															action_id: environment.action_id,
															price_group_id: id,
															all: 0
														}
													}, function () {
														loadPriceZoneGroups();
														loadCurrentPricing();
														action_priceZones_map.reLoad();
													});
												}
											},
											cancel: {
												label: "Отмена",
												className: "green",
												callback: function () {
													action_priceZones_map.selection = [];
													action_priceZones_map.reLoad();
												}
											}
										}
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

				$(".price_color").css("borderBottomWidth", "0");
				$(".price_color", this).css("borderBottomWidth", "2px");
				environment.selected_group = id;
			});
			if (environment.selected_group != 0) {
				action_priceZones_map.shiftState = 0;
				$("#one_price_group" + environment.selected_group).click();
			}

		});
	}


	function loadPricingList() {
		/// загрузка расценок
		if (typeof environment.action_id == "undefined") return;
		MB.Core.sendQuery({
			command: "get",
			object: "action_scheme_pricing",
			sid: sid,
			params: {where: "action_id = " + environment.action_id + " and DEFAULT_ACTION_PRICING_ID='TRUE'"}
		}, function (data) {
			var obj = MB.Core.jsonToObj(data);
			if (+obj[0].ACTION_PRICING_ID == 0) {
				var html = 'Нет записей';
			} else {
				html = obj[0].NAME;
				environment.price_zone_pricing_id = obj[0].ACTION_PRICING_ID;
			}


			$("#pricing_select").html(html);
			$('#modal_' + id + '_wrapper #pricing_select_btn').off('click').on('click', function () {
				MB.Core.switchModal({
					type: "form",
					ids: [environment.action_id],
					name: "form_action_scheme_pricing",
					params: {
						tblselectedrow: environment.price_zone_pricing_id,

						tblcallbacks: {

							select: {
								name: "Выбрать",
								callback: function (id) {
									MB.Modal.close("form_action_scheme_pricing");
									environment.price_zone_pricing_id = id;
									//action_priceZones_map.loadParams.params.price_zone_pricing_id = id;
									action_priceZones_map.reLoad();
									loadPricingById(environment.price_zone_pricing_id);
									loadCurrentPricing();
									//loadFundGroups();
								}
							}
							/*custom1:{
							 name: "Выбрать",
							 callback: function (key, options) {
							 MB.Modal.close("form_action_scheme_pricing");
							 environment.price_zone_pricing_id =  options.$trigger.data("row");
							 loadPricingById(environment.price_zone_pricing_id);

							 //loadPricingList();
							 loadCurrentPricing();
							 }
							 },
							 custom2:{
							 name: "Установить эту схему расценки!",
							 callback: function (key, options) {
							 var id = options.$trigger.data("row");
							 //if (id == environment.price_zone_pricing_id) return;
							 bootbox.dialog({
							 message: "Выбор этой схемы расценки приведет к переоценке мест в зале.<br>" +
							 "Эта операция будет применена только для свободных на текущий момент мест.<br>" +
							 "Вы уверены, что хотите выполнить переоценку?",
							 title: "<span style='color:#f00;'>Переоценка.</span>",
							 buttons: {
							 ok: {
							 label: "Выполнить переоценку",
							 className: "red",
							 callback: function() {

							 var  o = {
							 command: "operation",
							 object: "set_default_action_pricing_id",
							 sid: MB.User.sid,
							 action_id:environment.action_id,
							 objversion:environment.action_objversion,
							 action_pricing_id:id
							 };
							 MB.Core.sendQuery(o, function (res) {

							 toastr.success("Схема расценки #" + id + " установлена для мероприятия #" + environment.action_id + " успешно!", "custom func");
							 //instance.reload("data");
							 environment.action_objversion = res.OBJVERSION;
							 MB.Modal.close("form_action_scheme_pricing");
							 environment.price_zone_pricing_id =  id;

							 loadPricingById(environment.price_zone_pricing_id);
							 //loadPricingList();
							 loadCurrentPricing();
							 });
							 }
							 },
							 cancel: {
							 label: "Отмена",
							 className: "green",
							 callback:function(){

							 }
							 }
							 }
							 });
							 }
							 }
							 */
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
			bootbox.dialog({
				message: 'Расценка не сохранена',
				title: "",
				buttons: {
					save: {
						label: "Сохранить",
						className: "green",
						callback: function () {
							$("#pricing_save_btn").click();
						}
					},
					refresh: {
						label: "Обновить",
						className: "yellow",
						callback: function () {
							environment.CurrentPricingNotSaved = false;
							loadCurrentPricing();
						}
					}

				}
			});

			return;

		}
		MB.Core.sendQuery({
			command: "get",
			object: "action_scheme_pricing_item",
			sid: sid,
			params: {
				where: "action_pricing_id=" + environment.price_zone_pricing_id
			}
		}, function (data) {
			var obj = MB.Core.jsonToObj(data);
			var html = '';
			var PRICE_ZONE_PRICING_ITEM_ID, PRICE_GROUP_ID, PRICE_GROUP, PLACE_COUNT, PRICE, AMOUNT, TOTAL_AMOUNT, COLOR, OBJVERSION, NOMINAL_PRICE, PRICE_MARGIN;
			TOTAL_AMOUNT = 0;
			var data = {items: []};
			for (var j in obj) {
				var tmpObj = {
					PRICE_ZONE_PRICING_ITEM_ID: obj[j].ACTION_PRICING_ITEM_ID,
					PRICE_GROUP_ID: obj[j].ACTION_PRICING_ID,
					PRICE_GROUP: obj[j].PRICE_GROUP,
					PLACE_COUNT: +obj[j].PLACE_COUNT,
					PRICE: +obj[j].PRICE,
					AMOUNT: +obj[j].AMOUNT,
					COLOR: obj[j].COLOR,
					OBJVERSION: obj[j].OBJVERSION,
					NOMINAL_PRICE: obj[j].NOMINAL_PRICE,
					PRICE_MARGIN: obj[j].PRICE_MARGIN
				}
				data.items.push(tmpObj);
			}

			for (var k in obj) {
				PRICE_ZONE_PRICING_ITEM_ID = obj[k].ACTION_PRICING_ITEM_ID;
				PRICE_GROUP_ID = obj[k].ACTION_PRICING_ID;
				PRICE_GROUP = obj[k].PRICE_GROUP;
				PLACE_COUNT = +obj[k].PLACE_COUNT;
				PRICE = +obj[k].PRICE;
				AMOUNT = +obj[k].AMOUNT;
				COLOR = obj[k].COLOR;
				OBJVERSION = obj[k].OBJVERSION;
				NOMINAL_PRICE = obj[k].NOMINAL_PRICE;
				PRICE_MARGIN = obj[k].PRICE_MARGIN;


				html +=
					'<tr class="pricing_row" id="pricing_row' + PRICE_ZONE_PRICING_ITEM_ID + '">' +
					'<td class="highlight">' +
					'<div class="price_color" style="background-color: ' + COLOR + '"></div>' +
					'<a href="#">' + PRICE_GROUP + '</a>' +

					'</td>' +
					'<td class="highlight count">' +
					PLACE_COUNT +
					'</td>' +
					'<td class="highlight pricing_cell_nominal nominal">' + NOMINAL_PRICE + '</td>' +
					'<td class="highlight pricing_cell_price_margin_input_box price_margin">' +
					'<input type="text" class="pricing_cell_price_margin_input" id="pricing_cell_price_margin_input' + PRICE_ZONE_PRICING_ITEM_ID + '" value="' + PRICE_MARGIN + '">' +
					'</td>' +
					'<td class="highlight pricing_cell_cost_input_box cost">' +
						/*                    '<a href="#" id="pricing_cell_cost_input'+PRICE_ZONE_PRICING_ITEM_ID+'" data-type="text" data-pk="1" data-placement="right" data-placeholder="Required" data-original-title="Enter your firstname" class="pricing_cell_cost_input editable editable-click editable-empty" style="display: inline;">' +
						 PRICE+"000L"+
						 '</a>'+*/
					'<input type="text" class="pricing_cell_cost_input" id="pricing_cell_cost_input' + PRICE_ZONE_PRICING_ITEM_ID + '" value="' + PRICE + '">' +
						//'<a class="pricing_cell_cost_input" id="pricing_cell_cost_input'+PRICE_ZONE_PRICING_ITEM_ID+'"  href="#">'+PRICE +'</a>'+
					'</td>' +
					'<td class="highlight amount">' +
					'<span>' + AMOUNT + '</span>' +
					'</td>' +
					'<input type="hidden" id="pricing_row_objversion' + PRICE_ZONE_PRICING_ITEM_ID + '" value="' + OBJVERSION + '">' +
					'</tr>';

				TOTAL_AMOUNT += AMOUNT;
			}

			//html += ;
			$("#for_pricing_row").html(html);
			//$(".pricing_cell_cost_input").editable();

			function count_total() {
				var total_amount = 0;
				$(".pricing_row").each(function () {
					var count = (!isNaN(+$(this).children(".count").text())) ? +$(this).children(".count").text() : 0;
					var price = (!isNaN(+$(this).children(".cost").children(".pricing_cell_cost_input").val())) ? +$(this).children(".cost").children(".pricing_cell_cost_input").val() : 0;
					total_amount += count * price;
				});
				$("#pricing_global_amount").html(total_amount + " руб.");


			}

			$("#pricing_global_amount").html(TOTAL_AMOUNT + " руб.");
			//$(".pricing_cell_cost_input").mask("?9999999999",{placeholder:''});
			$(".pricing_cell_cost_input").focus(function () {
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
				var nominal = (!isNaN(+$(this).parents(".pricing_row").children(".nominal").text())) ? +$(this).parents(".pricing_row").children(".nominal").text() : 0;

				$(this).parents(".pricing_row").children(".amount").children("span").html(count * price);
				$(this).parents(".pricing_row").children(".price_margin").children("input").val((price / nominal * 100).toFixed(2));

				count_total();
			}).off('change').on('change', function () {
				environment.CurrentPricingNotSaved = true;
			});

			$(".pricing_cell_price_margin_input").focus(function () {
				var self = $(this);
				window.setTimeout(function () {
					self.select();
				}, 20);
			}).keyup(function (e) {
				if (e.which == 13) {
					if ($(this).parents(".pricing_row").next(".pricing_row").length > 0)
						$(this).parents(".pricing_row").next(".pricing_row").children(".price_margin").children(".pricing_cell_price_margin_input").focus();
				}
				var count = (!isNaN(+$(this).parents(".pricing_row").children(".count").text())) ? +$(this).parents(".pricing_row").children(".count").text() : 0;
				var price = (!isNaN(+$(this).parents(".pricing_row").children(".cost").find('input').val())) ? +$(this).parents(".pricing_row").children(".cost").find('input').val() : 0;
				var price_margin = +$(this).val();
				var nominal = (!isNaN(+$(this).parents(".pricing_row").children(".nominal").text())) ? +$(this).parents(".pricing_row").children(".nominal").text() : 0;

				$(this).parents(".pricing_row").children(".cost").children("input").val(nominal / 100 * price_margin);
				$(this).parents(".pricing_row").children(".amount").children("span").html(count * price);

				count_total();
			}).off('change').on('change', function () {
				environment.CurrentPricingNotSaved = true;
			});

			hideBasisBlocks();
		});
	}


	//MB.Core.sendQuery({command:"get",object:"hall_scheme",sid:sid,params:{where:"hall_scheme_id = "+environment.hall_scheme_id}},function(data){
	MB.Core.sendQuery({
		command: "get",
		object: "action",
		sid: sid,
		params: {where: "action_id = " + environment.action_id}
	}, function (data0) {


		var obj = MB.Core.jsonToObj(data0);
		environment.hall_scheme_id = obj[0].HALL_SCHEME_ID;
		environment.action_objversion = obj[0].OBJVERSION;


		$("#pricing_save_btn").click(function () {
			$(".pricing_row").each(function () {
				var id = this.id.replace(/[^0-9]/ig, "");
				MB.Core.sendQuery({
					command: "modify",
					object: "action_scheme_pricing_item",
					sid: sid,
					params: {
						action_pricing_item_id: id,
						objversion: $("#pricing_row_objversion" + id).val(),
						price: +$("#pricing_cell_cost_input" + id).val()
					}
				}, function (data) {
					if (data.RC == 0) {

					} else {
						bootbox.dialog({
							message: data.MESSAGE,
							title: "Ошибка",
							buttons: {
								ok: {
									label: "Ок",
									className: "red",
									callback: function () {
									}
								}
							}
						});
					}
					environment.CurrentPricingNotSaved = false;
					loadCurrentPricing();
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
		$("#pricing_reset_btn").click(function () {
			loadCurrentPricing();
		});

		action_priceZones_map = new Map1({
			container: $("#modal_" + id + "_wrapper #box_for_action_priceZones_map"),
			mode: "admin"
			/*,
			 cWidth:environment.getWidth(),
			 cHeight:environment.getHeight()*/
		});


		var socketObject = {
			sid: sid,
			type: "action_scheme_price_group",
			param: "action_id",
			id: environment.action_id,
			portion: 30,
			save: {
				command: "operation",
				object: "change_action_scheme_price_group_by_list",
				field_name: "ACTION_SCHEME_ID"
			},
			load: {
				command: "get",
				object: "action_scheme_price_group",
				params: {
					action_id: environment.action_id
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
				action_id: environment.action_id
			}
		};
		var layerO = {
			command: "get",
			object: "action_scheme_layer",
			sid: sid,
			params: {
				where: "ACTION_ID = " + environment.action_id + " and VISIBLE_ADMIN='TRUE'",
                action_id:environment.action_id,
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

				/*columns:"ACTION_SCHEME_OBJECT_ID,OBJECT_TYPE,OBJECT_TYPE,ROTATION,FONT_FAMILY,FONT_SIZE,FONT_STYLE,FONT_WIEGH,COLOR,X,Y,BACKGROUND_URL_SCALE,BACKGROUND_URL_ORIGINAL,BACKGROUND_COLOR",*/
				order_by: "SORT_NO"
			}
		};
		action_priceZones_map.openSocket(socketObject);

		action_priceZones_map.loadSquares(o, function () {

			action_priceZones_map.loadRenderItems({
				layerO: layerO,
				objectO: objectO
			}, function () {
				action_priceZones_map.render();
			});

			action_priceZones_map.setLayout(function () {
				action_priceZones_map.setMinMax(function () {
					action_priceZones_map.setScaleCoff(function () {
						action_priceZones_map.render(function () {
							action_priceZones_map.reLoadLayout(function () {
							});
						});

						action_priceZones_map.setEvents();
					});

				});
			});

			loadPriceZoneGroups();
			loadPricingList();
			environment.onFocus = function () {
				loadPriceZoneGroups();
				loadPricingList();
				action_priceZones_map.reLoad();
				action_priceZones_map.render();
			};
			environment.onClose = function () {
				action_priceZones_map.closeSocket();
			};
		});

		var wrap = $("#" + environment.world + "_" + environment.id + "_wrapper");
		wrap.children("*").each(function () {
			if (this.id != "")
				preventSelection(document.getElementById(this.id));
		});
		action_priceZones_map.sendSelection = function () {
			var price_group_id = environment.selected_group;
			if (+price_group_id <= 0 && action_priceZones_map.mouseKey == 1) {
				bootbox.dialog({
					essage: "Пожалуйста, выберите ценовой пояс.",
					title: "Ценовой пояс не выбран.",
					buttons: {
						ok: {
							label: "Ок",
							className: "blue",
							callback: function () {
								action_priceZones_map.clearSelection(true);
								action_priceZones_map.render();
							}
						}
					}
				});
				return;
			}


			if (action_priceZones_map.mouseKey == 3) price_group_id = "";

			var obj = {
				event: "save_and_update",

				save_params: {
					params: {
						price_group_id: price_group_id
					},
					list: action_priceZones_map.selection,
					portion: 200
				},
				load_params: {
					list: action_priceZones_map.selection,
					portion: 40
				}

			};

			bootbox.dialog({
				message: "Перевод выделеных мест в другой ценовой пояс может повлиять на стоимость этих мест.<br>" +
				"Эта операция будет применена только для свободных на текущий момент мест.<br>" +
				"Вы уверены, что хотите выполнить переоценку?",
				title: "<span style='color:#f00;'>Переоценка.</span>",
				buttons: {
					ok: {
						label: "Выполнить переоценку",
						className: "red",
						callback: function () {
							action_priceZones_map.toSocket(obj);
							action_priceZones_map.clearSelection();
						}
					},
					cancel: {
						label: "Отмена",
						className: "green",
						callback: function () {
							action_priceZones_map.clearSelection(true);
							action_priceZones_map.render();
						}
					}
				}
			});


		};
		action_priceZones_map.sendSelectionCallback = function () {
			//loadpriceGroups();
		};
		action_priceZones_map.sendSelectionCallbackFull = function () {
			loadPriceZoneGroups();
			loadPricingList();
		};


	});


	$("#map_refresh").click(function () {
		action_priceZones_map.reLoad();
	});

	$("#modal_" + id + "_wrapper").find('input.showOnlyUsed').on('change', function () {
		loadPriceZoneGroups();
	});

	uiTabs();
	uiUl();
	inlineEditing();
	$('input[type="checkbox"]').uniform();

	var Modaltitle = '';
	if (environment.title) {
		Modaltitle = 'Схема переоценки для "' + environment.title + '"';
	} else {
		Modaltitle = 'Схема переоценки';
		console.warn('environment.title не приходит!');
	}

	$('#modal_' + id + '_wrapper .pageHeaderInner h3').html(Modaltitle);


	$('#modal_' + id + '_wrapper #toFundsZones').on('click', function () {
		MB.Core.switchModal({
			type: "content", filename: "action_fundZones", params: {
				action_id: environment.action_id,
				label: 'Схема перераспределения',
				title: environment.title,
				newerGuid: newerGuid,
				parentGuid: id
			}
		});
	});

	$('#modal_' + id + '_wrapper #toPriceGroups').on('click', function () {
		MB.Core.switchModal({
			type: "table", name: "table_price_group", params: {
				callback: function () {
					loadPriceZoneGroups();
				}
			}
		});
		// waiting
	});

	function hideBasisBlocks() {
		MB.Core.sendQuery({
			command: "get",
			object: "action",
			sid: sid,
			params: {
				where: "action_id = " + environment.action_id
			}
		}, function (res) {
			var isFromBasis = res.DATA[0][res.NAMES.indexOf('BASIS_ID_PERFORMANCE')] != "";
			if (!isFromBasis) {
				$('td.nominal, td.price_margin, th.price_marginTH, th.nominalTh').hide(0);
			}
		});
	}


}





































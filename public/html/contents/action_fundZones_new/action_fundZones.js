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
/*	var hs_res = contentInstance.params['action_scheme_res'];
	var fz_id = hs_res.data[0]['ACTION_ID'];
	var fz_title = hs_res.data[0]['STATUS_TEXT'];*/
	var showUnused = true;
	//contentInstance.fund_zone_id = fz_id;
//	contentInstance.fund_zone_title = fz_title;
	var environment = contentInstance;
	environment.selected_group = 0;
	environment.action_id = modalInstance.params.action['ACTION_ID'];

	var splitByAreaGroups = modalInstance.params.action['SPLIT_BY_AREA_GROUP'] == "TRUE";
	var scaleByBackground = modalInstance.params.action['SCALE_BY_BACKGROUND'] == "TRUE";
	var lastSelectedSector;
	var expectationOfReturn = false;

	var fundZones = {
		list: [],
		defaultColor: null,
		load: function () {
			var me = this;
			var total_total = contentWrapper.find('.fz-total-total');
			var total_selected = contentWrapper.find('.fz-total-selected');
			var total_unused = contentWrapper.find('.fz-total-unused');
			var total_excluded = contentWrapper.find('.fz-total-excluded');

			/*var hs_res = contentInstance.params['action_scheme_res'];
			var fz_id = hs_res.data[0]['FUND_ZONE_ID'];*/
			MB.Core.spinner.start(spin);
			var o = {
				command: "get",
				object: "fund_group_for_action_scheme",
				params: {
					show_all: showUnused,
					action_id: environment.action_id
				}
			};
			socketQuery(o, function (res) {
				res = socketParse(res, {subData: true});
				me.list = [];
				total_total.html(res['extra_data']['TOTAL_PLACE_COUNT']);
				total_selected.html(res['extra_data']['TOTAL_SELECTED_PLACE_COUNT']);
				total_unused.html(res['extra_data']['TOTAL_NOT_SELECTED_PLACE_COUNT']);
				total_excluded.html(res['extra_data']['TOTAL_EXCLUDED_PLACE_COUNT']);


				for (var i in res.data) {
					var fundZone = res.data[i];
					me.list.push({
						id: fundZone.FUND_GROUP_ID,
						color: fundZone.COLOR,
						name: fundZone.NAME_WITH_STATUS,
						placeCount: fundZone.PLACE_COUNT,
						placeCountSaved: fundZone.PLACE_COUNT,
						addSelection: [],
						removeSelection: [],
						selected: (fundZone['FUND_GROUP_ID'] == environment.selected_group) ? 'selected' : ''});
				}

				me.defaultColor = res['extra_data']['DEFAULT_COLOR'];
				environment.selected_group = "";
				me.renderTemplate();
				MB.Core.spinner.stop(spin);
			});
		},
		renderTemplate: function (arr) {
			var me = this;
			var title = contentWrapper.find('.fz-title');
			var ul = contentWrapper.find('.fundZones-funds-list');
			var tpl = '{{#funds}}<li data-id="{{id}}" data-fz-id="{{id}}" class="{{selected}}">' +
				'<div class="fundZones-funds-item-color" style="background-color: {{color}}"></div>' +
				'<div class="fundZones-funds-item-title">{{name}}</div>' +
				'<div class="fundZones-funds-item-count">{{placeCount}} мест</div>' +
				'</li>{{/funds}}';
			var mo;

			if(!arr || arr.length == me.list.length) {
				arr = me.list;
			}

			mo = {
				funds: arr
			};

			ul.html(Mustache.to_html(tpl, mo));
			title.html(environment.fund_zone_title);

			fundZones.setHandlers();

			toggleSaveButton(fundZones.checkSelection());
		},
		setHandlers: function () {
			var title = contentWrapper.find('.fz-title');
			var ul = contentWrapper.find('.fundZones-funds-list');

			ul.find('li').off('click').on('click', function () {

				var id = $(this).data('id');
				var fz_id = $(this).data('fz-id');

				if (MB.keys['16'] === true) {
					if ($(this).hasClass('selected')) {

					} else {
						ul.find('li').removeClass('selected');
						$(this).addClass('selected');
					}
				} else {
					if ($(this).hasClass('selected')) {

					} else {
						ul.find('li').removeClass('selected');
						$(this).addClass('selected');
						environment.selected_group = id;
					}
				}
			});
		},
		getFundsFromListById: function (id) {
			var me = this;
			for (var i in me.list) {
				var fundZone = me.list[i];
				if(fundZone.id == id) return fundZone;
			}
		},
		getFundsWithSquares: function() {
			var fundZones = [];
			var me = this;
			for (var i in me.list) {
				var fundZone = me.list[i];
				if(fundZone.addSelection.length || fundZone.removeSelection.length) fundZones.push(fundZone);
			}

			return fundZones;
		},
		addSquaresToFund: function(fundZoneId, squares) {
			var me = this;
			for (var i in me.list) {
				var fundZone = me.list[i];
				if(fundZone.id == fundZoneId) {
					var addSelection = fundZone.addSelection;
					var removeSelection = fundZone.removeSelection;
					var finalSelection = [];
					for (var j in squares) {
						var isAdd = true;
						var l;
						for (l in removeSelection) {
							if(squares[j].id == removeSelection[l]) {
								fundZone.removeSelection.splice(l, 1);
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
					fundZone.addSelection = fundZone.addSelection.concat(finalSelection);
					me.updatePlaceCount(fundZone);
					break;
				}
			}
		},
		removeSquaresFromFund: function(squares) {
			var me = this;
			for (var i in me.list) {
				var fundZone = me.list[i];
				var addSelection = fundZone.addSelection;
				for (var j in squares) {
					var isAdd = false;
					for (var l = 0; l < addSelection.length; l++) {
						if(squares[j].id == addSelection[l]) {
							isAdd = true;
							break;
						}
					}
					if(isAdd) {
						fundZone.addSelection.splice(l, 1);
					}
					else if(fundZone.id == squares[j].fundGroupID) {
						fundZone.removeSelection.push(squares[j].id);
					}
					me.updatePlaceCount(fundZone);
				}
			}
		},
		updatePlaceCount: function(fund) {
			fund.placeCount = (fund.placeCountSaved + fund.addSelection.length) - fund.removeSelection.length;
		},
		checkSelection: function() {
			var me = this;
			for (var i in me.list) {
				var FundZone = me.list[i];
				if(FundZone.addSelection.length || FundZone.removeSelection.length) return false;
			}

			return true;
		}
	};
	var spin = $('.fundZones-funds-list-wrapper');
	fundZones.load();

	// Map
	var mapContainer = contentWrapper.find('.one-action-canvas-container');

	one_action_map = new Map1({
		container: mapContainer,
		cWidth: $(window).width() - 440,
		cHeight: $(window).height() - 93,
		mode: "admin",
		doc_root: connectHost + "/",
		scaleByBackground: scaleByBackground
	});

	MB.User.map = one_action_map;

	var socketObject = {
		sid: sid,
		type: "action_scheme_fund_group",
		param: "action_id",
		id: environment.action_id,
		portion: 30,
		save: {
			command: "operation",
			object: "change_action_scheme_fund_group_by_list",
			/*object:"change_action_scheme_fund_group",*/
			field_name: "ACTION_SCHEME_ID"
		},
		load: {
			command: "get",
			object: "action_scheme_fund_group",
			params: {
				action_id: environment.action_id
			},
			columns: "ACTION_SCHEME_ID,PRICE,STATUS,STATUS_TEXT,FUND_GROUP_NAME,PRICE_GROUP_NAME,BLOCK_COLOR,COLOR",
			field_name: "ACTION_SCHEME_ID"
		}
	};

	var o = {
		command: "get",
		object: "action_scheme_fund_group",
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
			action_id: environment.action_id,
			/*columns:"ACTION_SCHEME_OBJECT_ID,OBJECT_TYPE,OBJECT_TYPE,ROTATION,FONT_FAMILY,FONT_SIZE,FONT_STYLE,FONT_WIEGH,COLOR,X,Y,BACKGROUND_URL_SCALE,BACKGROUND_URL_ORIGINAL,BACKGROUND_COLOR",*/
			order_by: "SORT_NO"
		}
	};
	var sectorO = {
		command: "get",
		object: "action_scheme_area_group",
		params: {
			where: "ACTION_ID = " + environment.activeId
		}
	};
	one_action_map.openSocket(socketObject);

	if (splitByAreaGroups) {
		setSideBar("sectors");
		one_action_map.loadSectors({
			socketObject: socketObject,
			squareO: o,
			layerO: layerO,
			objectO: objectO,
			sectorO: sectorO,
			action_id: objectO.params.action_id
		},function(){
			one_action_map.loadRenderItems({
				layerO: layerO,
				objectO: objectO
			}, function () {
				one_action_map.render();
				MB.Core.spinner.stop(mapContainer);
				one_action_map.loading = false;
			});
		});
	}
	else {
		setSideBar("squares");
		one_action_map.loadSquares(o, function () {
			one_action_map.loadRenderItems({
				layerO: layerO,
				objectO: objectO
			}, function () {
				one_action_map.render();
			});
			one_action_map.setLayout(function () {
				one_action_map.setMinMax(function () {
					one_action_map.setScaleCoff(function () {
						one_action_map.render(function () {
							one_action_map.reLoadLayout(function () {
							});
						});
						one_action_map.setEvents();
					});

				});
			});
		});
	}

	function toggleSaveButton(disable) {
		var saveButton = contentWrapper.find('.saveZone');
		if(disable) saveButton.addClass("disabled").removeClass("active");
		else saveButton.addClass("active").removeClass("disabled");
	}

	function setSideBar(mode) {
		var wrapper = contentWrapper.find('.content-sidebar-upper-buttons-wrapper');
		var buttons = [
			{
				mode: "squares",
				widthClass: "wid8pr",
				nameClass: "back_to_sectors",
				disabled: function(){
					return !splitByAreaGroups;
				},
				icon: "fa-reply",
				title: ""
			},{
				mode: "sectors",
				widthClass: "wid8pr",
				nameClass: "back_to_squares",
				disabled: function(){
					return !lastSelectedSector;
				},
				icon: "fa-mail-forward",
				title: ""
			},{
				mode: "all",
				widthClass: "wid23pr",
				nameClass: "block_all_places",
				disabled: function(){
					return mode == "sectors";
				},
				icon: "fa-th",
				title: "Выбрать все"
			},{
				mode: "all",
				widthClass: "wid23pr",
				nameClass: "clear_tickets_stack",
				disabled: function(){
					return mode == "sectors";
				},
				icon: "fa-eraser",
				title: "Очистить"
			},{
				mode: "all",
				widthClass: "wid23pr",
				nameClass: "reloadMap",
				disabled: function(){
					return mode == "sectors";
				},
				icon: "fa-refresh",
				title: "Обновить"
			},{
				mode: "all",
				widthClass: "wid23pr",
				nameClass: "saveZone",
				disabled: function(){
					return fundZones.checkSelection();
				},
				icon: "fa-save",
				title: "Сохранить"
			}
		];

		wrapper.empty();

		for (var i = 0; i < buttons.length; i++) {
			var button = buttons[i];
			var div = $("<div></div>");
			var icon = $("<i></i>");
			var span = $("<span></span>");
			if(button.mode == mode || button.mode == "all") {
				div.addClass("content-sidebar-upper-button " + button.widthClass + " " +  button.nameClass);
				if(button.disabled()) div.addClass("disabled");
				icon.addClass("fa " + button.icon);
				span.html(button.title);
				div.append(icon).append(span);
				wrapper.append(div);
			}
		}
		toggleUnusedPrices(mode == "sectors");
		setHandlers();
	}

	function sectorClickHandler() {
		var sectorSelected = false;
		var selectedSectors = [];
		for (var i in one_action_map.sectors) {
			var sec = one_action_map.sectors[i];
			if (sec.selected) {
				lastSelectedSector = sec;
				sectorSelected = true;
				selectedSectors.push(sec);
			}
		}
		if (!sectorSelected) {

		} else {
			MB.Core.spinner.start(mapContainer);

			one_action_map.sectorsSelect(function () {
				MB.Core.spinner.stop(mapContainer);
				setSideBar("squares");
			});
		}
	}

	function backToSectors() {
		MB.Core.spinner.start(mapContainer);
		one_action_map.backToSectors(function () {
			setSideBar("sectors");
			MB.Core.spinner.stop(mapContainer);
		});
	}

	function toggleUnusedPrices(show) {
		var elem = contentWrapper.find(".toggleUnusedFunds");

		if (show) {
			showUnused = false;
			elem.removeClass('active').html('<i class="fa fa-eye-slash"></i>&nbsp;&nbsp;Показать неиспользуемые фонды');
		} else {
			showUnused = true;
			elem.addClass('active').html('<i class="fa fa-eye"></i>&nbsp;&nbsp;Cкрыть неиспользуемые фонды');
		}

		fundZones.load();
	}

	function saveFunds() {
        MB.Core.spinner.start(contentWrapper);
        MB.Core.fader.start(contentWrapper);
		var list = fundZones.getFundsWithSquares();
		var sendQuery = function(squares, fundZoneId) {
			var obj = {
				event: "save_and_update",

				save_params: {
					params: {
						fund_group_id: fundZoneId
					},
					list: squares,
					portion: 200
				},
				load_params: {
					list: squares,
					portion: 200
				}
			};

			one_action_map.toSocket(obj);
		};
		for (var i in list) {
			var fundZone = list[i];
			if(fundZone.addSelection.length) sendQuery(fundZone.addSelection, fundZone.id);
			if(fundZone.removeSelection.length) sendQuery(fundZone.removeSelection, "");
		}
	}

	function saveDialog(saveCallback, notSaveCallback) {
		bootbox.dialog({
			message: "Выделенные места для несохраненных фондов будут утеряны.",
			title: "",
			buttons: {
				save: {
					label: "Сохранить",
					className: "green",
					callback: function () {
						saveCallback();
						saveFunds();
					}
				},
				notSave: {
					label: "Не сохранять",
					className: "red",
					callback: function () {
						notSaveCallback();
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
	}

	function setHandlers() {
		contentWrapper.find('.back_to_sectors').off('click').on('click', function () {
			var elem = $(this);
			if (elem.hasClass("disabled")) return;

			if(!fundZones.checkSelection()){
				saveDialog(function(){
					MB.Core.spinner.start(mapContainer);
					expectationOfReturn = true;
				}, backToSectors);
			}
			else backToSectors();

		});

		contentWrapper.find('.back_to_squares').off('click').on('click', function () {
			var elem = $(this);

			if (elem.hasClass("disabled")) return;

			lastSelectedSector.selected = true;
			sectorClickHandler();
		});
		
		//Очистить
		contentWrapper.find(".clear_tickets_stack").off('click').on('click', function () {
			bootbox.dialog({
				message: "Вы уверены что хотите очистить места?",
				title: "",
				buttons: {
					yes_btn: {
						label: "Да, уверен",
						className: "green",
						callback: function () {
							socketQuery({
								command: "operation", object: "fill_action_scheme_by_fund_group", params: {
									action_id: environment.action_id,
									fund_group_id: '',
									all: 1
								}
							}, function (r) {
								console.log(r);
								one_action_map.reLoad(function () {
									fundZones.load();
								});
							});
						}
					},
					cancel: {
						label: "Отмена",
						className: "blue"
					}
				}
			});
		});
		//Обновить
		contentWrapper.find('.reloadMap').off('click').on('click', function () {
			one_action_map.reLoad(function () {
				fundZones.load();
			});
//		tickets_stack.load();
		});
		//Выбрать все
		contentWrapper.find(".block_all_places").off('click').on('click', function () {
			var selected = contentWrapper.find('.fundZones-funds-list li.selected');
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
									command: "operation", object: "fill_action_scheme_by_fund_group", params: {
										action_id: environment.action_id,
										fund_group_id: selected.attr('data-id'),
										all: 1
									}
								}, function (r) {
									console.log(r);
									one_action_map.reLoad(function () {
										fundZones.load();
									});
								});
							}
						},
						free_only: {
							label: "Только свободные",
							className: "yellow",
							callback: function () {
								socketQuery({
									command: "operation", object: "fill_action_scheme_by_fund_group", params: {
										action_id: environment.action_id,
										fund_group_id: selected.attr('data-id'),
										all: 0
									}
								}, function (r) {
									console.log(r);
									one_action_map.reLoad(function () {
										fundZones.load();
									});
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
		//Сохранить
		contentWrapper.find('.saveZone').on('click', function (event) {
			var elem = $(event.target);

			if(elem.hasClass("disabled")) return;

			saveFunds();
		});
	}

	contentWrapper.children().each(function () {
		if (this.id != "")
			preventSelection(document.getElementById(this.id));
	});

	one_action_map.sendSelection = function () {
		if (environment.selected_group === undefined && one_action_map.mouseKey == 1) {
			toastr['warning']('Пожалуйста, выберите фонд');
			one_action_map.clearSelection(true);
			one_action_map.render();
			return;
		}
		var mk = one_action_map.mouseKey;
		var selected_group_id = environment.selected_group;
		var fundGroup = fundZones.getFundsFromListById(selected_group_id);
		var fundGroupColor = fundZones.defaultColor;
		var fundGroupId = "";
		var fundGroupName = "";
		var selection = one_action_map.selection;
		var squares = [];
		if (+selected_group_id <= 0 && mk == 1) {
			bootbox.dialog({
				message: "Пожалуйста, выберите  фонд.",
				title: "Фонд не выбран.",
				buttons: {
					ok: {
						label: "Ок",
						className: "blue",
						callback: function () {
							one_action_map.clearSelection(true);
							one_action_map.render();
						}
					}
				}
			});
			return;
		}


		if (mk == 1) {
			fundGroupColor = fundGroup.color;
			fundGroupName = fundGroup.name;
			fundGroupId = fundGroup.id;
		}

		for (var i in selection) {
			var squareId = selection[i];
			var square = one_action_map.squares[squareId];
			squares.push({id:square.id, fundGroupID: square.fundGroupID});
			square.color0 = fundGroupColor;
			square.fundGroup = fundGroupName;
			square.fundGroupID = fundGroupId;
			square.lighted = false;
			one_action_map.renderSquareImage(square)
		}

		if (mk == 1) fundZones.addSquaresToFund(fundGroupId, squares);
		else if(mk == 3) fundZones.removeSquaresFromFund(squares);

		fundZones.renderTemplate();
		one_action_map.clearSelection();
	};

	one_action_map.sendSelectionCallback = function () {
//		fundZones.load();
	};

	one_action_map.sendSelectionCallbackFull = function () {
		if(expectationOfReturn) {
			backToSectors();
			expectationOfReturn = false;
		}
		else fundZones.load();
        MB.Core.spinner.stop(contentWrapper);
        MB.Core.fader.stop(contentWrapper);
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
						if (square.textStatus.indexOf('Доверено распостранение') >= 0) {
							form_name = "form_order_realization";
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
						if (square.textStatus.indexOf('Доверено распостранение') >= 0) {
							form_name = "form_order_ticket_realization";
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
		var tElem = contentWrapper.find('.fundZones-funds');
		var excludeHs = 0;
		var sideBarH = (isFirst) ? $(window).height() - 93 : modalInstance.wrapper.outerHeight() - 55;

		for (var i = 0; i < contentWrapper.find('.excludeHeight').length; i++) {
			var ex = contentWrapper.find('.excludeHeight').eq(i);
			excludeHs += ex.outerHeight();
		}

		var full = sideBarH - excludeHs;
		tElem.height(full - 3 + 'px');
	}

	mapContainer.off('sector_click').on('sector_click', function () {
		sectorClickHandler();
	});

	$(modalInstance).off('resize').on('resize', function () {
		setHeights(false);
		console.log('resize');
		one_action_map.resize();
	});

	$(modalInstance).off('focus').on('focus', function () {
		one_action_map.reLoadList(one_action_map.blockedArray);
//        tickets_stack.load();
//        action_price_info.load();
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

	contentWrapper.on('input', '.zones-search', function(){
		var val = $(this).val().toLowerCase();
		var finalArr = [];

		for (var i = 0; i < fundZones.list.length; i++) {
			var zone = fundZones.list[i];
			var title = zone.name.toLowerCase();
			if(title.indexOf(val) != -1) {
				finalArr.push(zone);
			}
		}

		fundZones.renderTemplate(finalArr);
	});

	//Скрыть / показать неиспользуемые фонды
	contentWrapper.find('.toggleUnusedFunds').off('click').on('click', function () {
		var elem = $(this);
		if(!fundZones.checkSelection()){
			saveDialog(function(){
				toggleUnusedPrices(elem.hasClass('active'));
			},function(){
				one_action_map.reLoad();
				toggleUnusedPrices(elem.hasClass('active'));
			});
		}
		else toggleUnusedPrices(elem.hasClass('active'));
	});
	//К расценкам
	contentWrapper.find('.go-to-funds').off('click').on('click', function () {
		MB.Core.switchPage({
			type: "table",
			name: "table_fund_group",
			isNewTable: true
		});
		modalInstance.collapse();
	});

	contentWrapper.find('.go-to-price-zones').off('click').on('click', function () {
		MB.Core.switchModal({
			type: "content",
			filename: "FundZones",
			isNew: true,
			params: {
				hall_scheme_id: environment.activeId,
				label: 'Схема распоясовки',
				title: environment.title
//                newerGuid: newerGuid,
//                parentGuid:id
			}
		});
	});

}());

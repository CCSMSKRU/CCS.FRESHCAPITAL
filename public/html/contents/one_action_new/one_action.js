(function () {
	var modal = $('.mw-wrap').last();
	var contentID = MB.Contents.justAddedId;
	var contentInstance = MB.Contents.getItem(contentID);
	var contentWrapper = $('#mw-' + contentInstance.id);
	var modalInstance = MB.Core.modalWindows.windows.getWindow(contentID);

    var additServicesWrapper = contentWrapper;
    var storedPlaces = [];
    var storedTickets = [];
    var totalPlaces = 0;
    var serviceAmount = 0;
    var totalAmount = 0;
	modalInstance.stick = 'top';
	modalInstance.stickModal();

    var printScheme = function(obj){
        var spinnerContainer = contentWrapper;
        MB.Core.spinner.start(spinnerContainer);
        var o = {
            command: 'get',
            object: 'action',
            params: {
                where: 'action_id = '+ contentInstance.activeId
            }
        };
        var dataUrl = obj.map.getCanvasImage();
        socketQuery(o, function(res){
            res = socketParse(res)[0];

            var mO = {
                ACTION_WITH_DATE: res.NAME +' '+res.ACTION_DATE,
                HALL: res.HALL,
                dataUrl: dataUrl,
                prices: [],
                ticketsSold:res.SOLD_PLACE_COUNT,
                soldAmount:'',
                casherSells: '',
                casherPercent: '',
                webSells: '',
                webPercent: '',
                user:MB.User.fullname,
                date: moment().format('DD.MM.YYYY HH:MM')
            };

            var o2 = {
                command:'get',
                object: 'action_scheme_legend_price',
                params: {
                    action_id : contentInstance.activeId
                }
            };

            socketQuery(o2, function(res2){
                res2 = jsonToObj(JSON.parse(res2)['results'][0]);
                for(var i in res2){
                    var pg = res2[i];
                    mO.prices.push({
                        color: pg.COLOR,
                        price: pg.PRICE,
                        places: pg.FREE_PLACE_COUNT
                    });
                }

                var o3 ={
                    command: 'get',
                    object: 'action_sold_tickets_info',
                    params: {
                        where: 'action_id = '+contentInstance.activeId
                    }
                };

                socketQuery(o3, function(res3){
                    res3 = socketParse(res3);

                    mO.soldAmount =     res3[0].SUM_PAID_AND_CLOSED_TOTAL;
                    mO.casherSells =    res3[0].SUM_CLOSED_TICKETS;
                    mO.casherPercent =  res3[0].CLOSED_TICKET_PERCENT;
                    mO.webSells =       res3[0].SUM_PAID_WEB_TICKETS;
                    mO.webPercent =     res3[0].PAID_TICKET_PERCENT;

                    var tpl = '' +
                        '<style>' +
                        'body,html{position:relative; height 100%; width: 100%;}' +
                        '.pc-title{ height:40px; width:100%; font-family: arial, sans-serif;  border-bottom: 1px solid #000;}' +
                        '.pc-canvas{text-align: center; width:100%; height: 600px; padding-top: 40px; padding-bottom: 100px; box-sizing: border-box;   padding-right: 190px;}' +
                        '.pc-canvas img{ height: 100%; margin: 0 auto;}' +
                        '.pc-info{ position: absolute; bottom: 0;width:100%; font-family: openSans, arial, sans-serif;bottom:0; height: 100px; font-size: 12px;}' +
                        '.pc-prices{  font-size: 12px;font-family: openSans, arial, sans-serif;position: absolute;right: 0px;top: 45px;background-color: #fff;float: left;width: 190px;margin: 0;padding: 0;box-sizing: border-box;}' +
                        '.pc-sold{   margin-top: 10px; float: left; width:40%; height: 100px; font-size: 11px;}' +
                        '.pc-legal{ position:absolute; right: 20px; bottom: 0; text-align: right;}' +
                        '.pc-price{ float: left;height: 25px;white-space: nowrap;list-style: none;width: 100%;padding-top: 3px;box-sizing: border-box;}' +
                        '.pc-p-color{     display: block;font-family: times new roman;vertical-align: middle;margin-right: 0;font-size: 130px;float: left;margin-top: -29px;line-height: 0;}' +
                        '.pc-p-price{    float: left;height: 25px;white-space: nowrap;list-style: none;padding-top: 3px;margin-left: 30px;box-sizing: border-box;}' +
                        '.pc-p-places{     line-height: 20px;display: inline-block;vertical-align: middle;height: 20px;}' +
                        '.pc-legal{  margin-left: 20px;text-align: right;float: right;margin-right: 40px;}' +
                        '.pc-legal span{ white-space: nowrap;}' +
                        '.pt-summ{ color: red;}' +
                        '</style>' +
                        '<div class="pc-title">{{ACTION_WITH_DATE}} / {{HALL}}</div>'+
                        '<div class="pc-canvas"><img src="{{dataUrl}}"></div>' +
                        '<ul class="pc-prices">' +
                        '{{#prices}}' +
                        '<li class="pc-price">' +
                        '<div class="pc-p-color" style="background-color: {{color}}; color: {{color}};">.</div>' +
                        '<div class="pc-p-price">{{price}} руб.</div>' +
                        '<div class="pc-p-places">({{places}} мест)</div>' +
                        '</li>' +
                        '{{/prices}}' +
                        '</ul>' +
                        '<div class="pc-info">' +
                        '<div class="pc-sold">' +
                        '<span>Продано:&nbsp;<span class="pt-summ">{{ticketsSold}}</span>&nbsp;билетов,&nbsp;на&nbsp;сумму:&nbsp;<span class="pt-summ">{{soldAmount}}</span>&nbsp;руб.</span><br />' +
                        '<span>Из&nbsp;них&nbsp;в&nbsp;кассах:&nbsp;<span class="pt-summ">{{casherSells}}</span>&nbsp;руб.&nbsp;({{casherPercent}}%)<br />через&nbsp;WEB:&nbsp;<span class="pt-summ">{{webSells}}</span>&nbsp;руб.&nbsp;({{webPercent}}%)</span>' +
                        '</div>'+
                        '<div class="pc-legal">' +
                        '<span><b>Сформировал(а): </b>{{user}}</span><br />' +
                        '<span><b>Дата формирования: </b>{{date}}</span>' +
                        '</div>' +
                        '</div>';


                    var windowContent = '<!DOCTYPE html>';
                    windowContent += '<html>';
                    windowContent += '<head><title>Print canvas</title></head>';
                    windowContent += '<body>';
                    windowContent += Mustache.to_html(tpl, mO);
                    windowContent += '</body>';
                    windowContent += '</html>';
                    MB.Core.spinner.stop(spinnerContainer);
                    var printWin = window.open('', '', 'width=' + obj.cWidth + ',height=' + obj.cHeight);
                    printWin.document.open();
                    printWin.document.write(windowContent);
                    printWin.document.close();
                    printWin.focus();
                    printWin.print();
                    printWin.close();

                });
            });
        });
    };

	// Variables
	var one_action_map;
	var entryTickets;
	var sid = MB.User.sid;
	var environment = contentInstance;
	var splitByAreaGroups = environment.params.action['SPLIT_BY_AREA_GROUP'] == "TRUE";
	var scaleByBackground = environment.params.action['SCALE_BY_BACKGROUND'] == "TRUE";
	var actionType = environment.params.action['ACTION_TYPE'];
	var activeActionIsWo = actionType == "ACTION_WO_PLACES";
	var tickets_stack, sectors_stack, action_price_info, interval, templates;
	var lastSelectedSector;
	// Map
	var mapContainer = contentWrapper.find('.one-action-canvas-container');
	var clientScreenActive = false;
	var isSectors = false;

	// price zones

	action_price_info = {
		box: "action_price_info",
		load: function () {
			var squares = one_action_map.squares;
			var obj = {};
			var total_free_count = 0;
            var totalPrice = 0;
			var html = '';
			var container = contentWrapper.find("." + this.box);
			for (var i1 in squares) {
				var square = squares[i1];
				if (square.status == 0 || +square.salePrice <= 0 || +square.blocked !== 0) continue;
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
                totalPrice += +square.salePrice;

			}

            console.log('totalPrice', totalPrice);

			contentWrapper.find('.totalFreeCount').html(total_free_count + ' На сумму: ' + totalPrice + ' руб.');

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
		ticketsBox: "tickets_box",
		entryTicketsBox: "entryTickets_box",
		load: function () {
            storedPlaces = [];
            storedTickets = [];

			if (environment.order_id == undefined) {
				var self = this;
				socketQuery({
					command: "get",
					object: "user_blocked_places",
					columns: "ACTION_SCHEME_ID,ADDITIONAL_SERVICE_GROUP_ID,ADDITIONAL_SERVICE_GROUP_NAME,ACTION_NAME,AREA_GROUP,AREA_GROUP_ID,LINE,PLACE,PRICE",
					params: {
						order_by: "ACTION_NAME,LINE,PLACE"
					}
				}, function (data) {
					contentWrapper.find("." + self.box).html("");
					var obj = socketParse(data, {subData: true});
                    console.log('DATA777', obj);
                    contentWrapper.find("." + self.ticketsBox).empty();
                    contentWrapper.find("." + self.entryTicketsBox).empty();
					for (var k in obj.data) {
						var item = obj.data[k];

						if(!item["TZ_COUNT"]) {
                            self.renderTicketsListItem(item);
                            storedPlaces.push(item);
                        }else {
                            self.renderEntryTicketsListItem(item);
                            storedTickets.push(item);
                        }

					}


                    totalPlaces = obj.extra_data.TOTAL_TICKETS;
                    serviceAmount = additional_services.additionalServiceBasket.getTotal();
                    totalAmount = (obj.extra_data.TOTAL_AMOUNT != "") ? obj.extra_data.TOTAL_AMOUNT : 0;

                    tickets_stack.populateTotal();

					contentWrapper.find('.totalPlaces').html(obj.extra_data.TOTAL_TICKETS);
					contentWrapper.find('.serviceAmount').html(additional_services.additionalServiceBasket.getTotal());
					contentWrapper.find('.totalAmount').html(TOTAL_AMOUNT);

                    var TOTAL_AMOUNT = (obj.extra_data.TOTAL_AMOUNT != "") ? obj.extra_data.TOTAL_AMOUNT : 0;

					setHeights(false);

                    if(!additional_services.inited){
                        additional_services.initAdditionalServices();
                    }else{
                        additional_services.additionalServiceBasket.checkoutByPlaceDeselection();
                        additional_services.updateAdditionalServices();
                    }

				});
			}
		},
        populateTotal: function(){
            serviceAmount = additional_services.additionalServiceBasket.getTotal();
            contentWrapper.find('.totalPlaces').html(totalPlaces);
            contentWrapper.find('.serviceAmount').html(serviceAmount);
            contentWrapper.find('.totalAmount').html(parseInt(totalAmount) + parseInt(serviceAmount));
        },
		renderTicketsListItem: function(item) {
			var self = this;
			var tpl = '<tr class="one_place" id="one_place' + item["ACTION_SCHEME_ID"] + '">' +
				'<td class="action_name_ellipsis">' +
				item["ACTION_NAME"] +
				'</td>' +
				'<td class="area_ellipsis">' +
				item["AREA_GROUP"] +
				'</td>' +
				'<td>' +
				item["LINE"] +
				'</td>' +
				'<td>' +
				item["PLACE"] +
				'</td>' +
				'<td>' +
				'<div class="one_action-place-hint-wrapper">' +
				'<div><span class="bold fs11">Мероприятие:</span><br/> ' + item["ACTION_NAME"] + '</div>' +
				'<div><span class="bold fs11">Сектор:</span><br/> ' + item["AREA_GROUP"] + '</div>' +
				'<div><span class="bold fs11">Ряд:</span> ' + item["LINE"] + '</div>' +
				'<div><span class="bold fs11">Место:</span> ' + item["PLACE"] + '</div>' +
				'<div><span class="bold fs11">Цена:</span> ' + item["PRICE"] + '</div>' +
				'</div>' +
				item["PRICE"] +
				'</td>' +
				'</tr>';

			contentWrapper.find("." + self.ticketsBox).append(tpl);
		},
		renderEntryTicketsListItem: function(item) {
			var self = this;
			var tpl = '<tr class="one_place" id="one_place' + item["ACTION_SCHEME_ID"] + '">' +
				'<td class="action_name_ellipsis">' +
				item["ACTION_NAME"] +
				'</td>' +
				'<td class="area_ellipsis">' +
				item["TZ_NAME"] +
				'</td>' +
				'<td>' +
				item["TZ_COUNT"] +
				'</td>' +
				'<td>' +
				'<div class="one_action-place-hint-wrapper">' +
				'<div><span class="bold fs11">Мероприятие:</span><br/> ' + item["ACTION_NAME"] + '</div>' +
				'<div><span class="bold fs11">Зона:</span><br/> ' + item["TZ_NAME"] + '</div>' +
				'<div><span class="bold fs11">Количество:</span> ' + item["TZ_COUNT"] + '</div>' +
				'<div><span class="bold fs11">Цена:</span> ' + item["PRICE"] + '</div>' +
				'</div>' +
				item["PRICE"] +
				'</td>' +
				'</tr>';

			contentWrapper.find("." + self.entryTicketsBox).append(tpl);
		},
		clear_blocked_place: function () {
			//clear_blocked_place
			socketQuery({
				command: "operation",
				object: "clear_blocked_place",
				params: {action_id: environment.activeId}
			}, function (data) {
                if (typeof one_action_map.reLoad == 'function') {
                    one_action_map.reLoad(function () {
                        action_price_info.load();
                        socketParse(data);
                    });
                }
				tickets_stack.load();
                entryTickets.clearTickets(true);
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
                entryTickets.clearTickets(true);
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

	sectors_stack = {
		render: function () {
			var sectors = one_action_map.sectors;
			var wrapper = $(".sector-list");
			var item;
			var getSector = function (actionGroupId) {
				for (var i in sectors) {
					if (sectors.hasOwnProperty(i)) {
						if (sectors[i].action_group_id == actionGroupId) {
							return sectors[i];
						}
					}
				}

				return null;
			};
			var clearSectors = function () {
				for (var i in sectors) {
					sectors[i].light = -1;
				}
			};
			var clickHandler = function () {
				var elem = $(this);
				var sector = getSector(elem.data("action-group-id"));
				sector.selected = true;
				clearSectors();
				sectorClickHandler();
			};
			var mouseEnterHandler = function () {
				var elem = $(this);
				one_action_map.fillSelectedSector(getSector(elem.data("action-group-id")));
			};
			var mouseLeaveHandler = function () {
				clearSectors();
			};

			wrapper.empty();

			for (var i in sectors) {
				if (sectors.hasOwnProperty(i)) {
					var sector = sectors[i];
					if (+sector.free_places == 0) continue;
					item = $("<li></li>");
					item.attr("data-action-group-id", sector.action_group_id);
					item.html('<span class="sector-item-name">' + sector.name + '</span><span class="sector-item-places">Мест (' + sector.free_places + ')</span>');
					if (+sector.free_places > 0) item.on("click", clickHandler);
					else item.addClass("disabled");
					item.on("mouseenter", mouseEnterHandler);
					item.on("mouseleave", mouseLeaveHandler);
					wrapper.append(item);
				}
			}
		}
	};

	templates = {
		places: null,
		sectors: null,
		tickets: null,
		data: {
			places: {
				url: "html/contents/one_action_new/one_action_places.html",
				template: null
			},
			sectors: {
				url: "html/contents/one_action_new/one_action_sectors.html",
				template: null
			},
			tickets: {
				url: "html/contents/one_action_new/one_action_tickets.html",
				template: null
			}
		},
		load: function (callback) {
			var _t = this;
			var data = _t.data;
			var total = 0;
			var loaded = 0;
			var loadTemplate = function (item) {
				$.ajax({
					url: item.url,
					success: function (res) {
						item.template = res;
						loaded++;
						if (loaded == total && typeof callback == 'function') {
							callback();
						}
					}
				});
			};
			for (var i in data) {
				if (data.hasOwnProperty(i)) {
					loadTemplate(data[i]);
					total++;
				}
			}
		},
		setSidebar: function (type) {
			var _t = this;
			var sidebarWrapper = $(".one-action-sidebar-wrapper");
			sidebarWrapper.html(_t.data[type].template);

			if(actionType == "ACTION_WO_PLACES") sidebarWrapper.find(".tickets_list").remove();
			else if(actionType == "ACTION") sidebarWrapper.find(".entryTickets_list").remove();

			tickets_stack.load();
			action_price_info.load();
			if (type == "sectors") {
				sectors_stack.render();
				if (lastSelectedSector) contentWrapper.find('.back_to_squares').removeClass("disabled");
			}

			addHandlers();
		}
	};

	entryTickets = new EntryTickets({
		parent: mapContainer,
		actionId: environment.activeId,
		canvasHeight: $(window).height() - 95,
		limit: 100,
		isConfirmButton: true
	});
	entryTickets.init(function(){
		if(activeActionIsWo){

		}
		else {
			one_action_map = new Map1({
				container: mapContainer,
				cWidth: $(window).width() - 440,
				cHeight: $(window).height() - 93,
                contentID: contentID,
				mode: "casher",
				doc_root: connectHost + "/",
				scaleByBackground: scaleByBackground
			});

            //temp

            contentWrapper.find('.mw-actionBtns').prepend('<div class="print-canvas-report fa fa-print"></div>');
            $('.print-canvas-report').on('click', function(){
                printScheme({
                    cWidth: one_action_map.cWidth,
                    cHeight: one_action_map.cHeight,
                    map: one_action_map
                });
            });

			entryTickets.map = one_action_map;

			MB.User.map = one_action_map;
			var socketObject = {
				sid: sid,
				type: "action_scheme",
				param: "action_id",
				id: environment.activeId,
				portion: 200,
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
					/*columns: "ACTION_SCHEME_ID,PRICE,STATUS,STATUS_TEXT,FUND_GROUP_NAME,PRICE_GROUP_NAME,BLOCK_COLOR,COLOR",*/
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
					where: " VISIBLE_CASHER ='TRUE'",
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
			var sectorO = {
				command: "get",
				object: "action_scheme_area_group",
				params: {
					where: "ACTION_ID = " + environment.activeId
				}
			};

			templates.load(function () {
				one_action_map.openSocket(socketObject);
				MB.Core.spinner.start(mapContainer);
				if (splitByAreaGroups) {
					one_action_map.loadSectors({
						socketObject: socketObject,
						squareO: squareO,
						layerO: layerO,
						objectO: objectO,
						sectorO: sectorO,
						action_id: objectO.params.action_id
					},function(){
						one_action_map.loadRenderItems({
							layerO: layerO,
							objectO: objectO
						}, function () {
							isSectors = true;
							entryTickets.check("sectors", true);
							templates.setSidebar("sectors");
							one_action_map.render();
                            tickets_stack.load();
                            MB.Core.spinner.stop(mapContainer);
							one_action_map.loading = false;

						});

					});

					console.log('go go render zones');
				} else {
					templates.setSidebar("places");
					$(".back_to_sectors").remove();
					$(".content-sidebar-upper-button").removeClass("wid30pr").addClass("wid33pr");
					one_action_map.loadSquares(squareO, function () {
						one_action_map.loadRenderItems({
							layerO: layerO,
							objectO: objectO
						}, function () {
							one_action_map.setLayout(function () {
								one_action_map.setMinMax(function () {
									one_action_map.setScaleCoff(function () {
										one_action_map.render(function () {
											one_action_map.reLoadLayout(function () {
												isSectors = false;
												entryTickets.check("squares");
												tickets_stack.load();
												action_price_info.load();
												MB.Core.spinner.stop(mapContainer);
											});
										});

									});
								});
							});
							//one_action_map.render();
						});
                        one_action_map.setEvents();
						//one_action_map.loadObjects(o2,function(){

						//SENSITIVE_TO_SCALING
						tickets_stack.load();

						action_price_info.load();
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
                                            var id = square.order_id;
                                            //ORDER^WEB_ORDER^EXT_AGENT_ORDER^QUOTA

                                            switch (square.order_type) {
                                                case "QUOTA":
                                                    form_name = "form_quote";
                                                    id = square.quota_id;
                                                    break;
                                                case "WEB_ORDER":
                                                    form_name = "form_order_web";
                                                    break;
                                            }

                                            MB.Core.switchModal({
                                                type: "form",
                                                name: form_name,
                                                isNewModal: true,
                                                ids: [id],
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
                                    },
                                    {
                                        title: 'История места',
                                        iconClass: 'fa-th',
                                        disabled: false,
                                        callback: function (params) {
                                            var form_name = "form_action_scheme_item_history";
                                            MB.Core.switchModal({
                                                type: "form",
                                                name: form_name,
                                                isNewModal: true,
                                                ids: [square.id],
                                                params: {
                                                    action_id: contentInstance.activeId,
                                                    label: "Место №: " + square.id
                                                }
                                            });
                                        }
                                    }
                                ]
                            });

						});
					});
				}
			});
		}
	});


	function setHeights(isFirst) {
		var tElem = contentWrapper.find('.set-height-tickets');
		var sElem = contentWrapper.find('.set-height-sectors');
		var pElem = contentWrapper.find('.set-height-prices');
		var excludeHs = 0;
		var sideBarH = (isFirst) ? $(window).height() - 93 : modalInstance.wrapper.outerHeight() - 55;

		if(!pElem.length) pElem = sElem;

		for (var i = 0; i < contentWrapper.find('.excludeHeight').length; i++) {
			var ex = contentWrapper.find('.excludeHeight').eq(i);
			excludeHs += ex.outerHeight();
		}

		var full = sideBarH - excludeHs;
		var half = Math.floor(full / 2);
		var pElemRowH = 150;

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
				isSectors = false;
				entryTickets.check("squares");
				templates.setSidebar("places");
				MB.Core.spinner.stop(mapContainer);
			});
		}
	}

	function addHandlers() {
		entryTickets.parent.off('show_tickets_list').on('show_tickets_list', function(){
			isSectors = false;
			templates.setSidebar("tickets");
		});

		entryTickets.parent.off('selected_ticket').on('selected_ticket', function(event, data){
			var selection = entryTickets.selection;
			var oldSelection = entryTickets.oldSelection;
            var block = {count: [], ticketZoneId: []};
            var unBlock = {count: [], ticketZoneId: []};
            var ticketZone;
            var oldTicketZone;
            var sendQuery = function(type, params){
                socketQuery({
                    command: "operation",
                    object: type+"_wo_place",
                    params: {
                        wo_action_id: environment.activeId,
                        ticket_count: params.count.join(),
                        action_scheme_ticket_zone_id: params.ticketZoneId.join()
                    }
                }, function (res) {
                    if (!(res = socketParse(res))) return;
                    tickets_stack.load();
                    entryTickets.updateTickets(0, 0, true);
                });
            };

            for (var i in selection) {
                ticketZone = selection[i];
                oldTicketZone = oldSelection[i];
                if(oldTicketZone) {
                    if(+ticketZone.count > +oldTicketZone.count) {
                        block.count.push(ticketZone.count);
                        block.ticketZoneId.push(i);
                    }

                    else if (+ticketZone.count < +oldTicketZone.count) {
                        unBlock.count.push(oldTicketZone.count);
                        unBlock.ticketZoneId.push(i);
                    }
                }
                else {
                    block.count.push(ticketZone.count);
                    block.ticketZoneId.push(i);
                }
            }

            console.log(block)
            console.log(unBlock)
            if(block.count.length) sendQuery("block", block);
            if(unBlock.ticketZoneId.length) sendQuery("unBlock", unBlock);

		});

		mapContainer.off('sector_click').on('sector_click', function () {
			sectorClickHandler();
		});

		contentWrapper.children("*").each(function () {
			if (this.id != "")
				preventSelection(document.getElementById(this.id));
		});

		one_action_map.sendSelection = function () {
			one_action_map.d1 = new Date();
			one_action_map.oldSelection = one_action_map.selection;
			var object = "block_place_list";
			if (one_action_map.mouseKey == 3)
				object = "unblock_place_list";

			var obj = {
				/*event: "save_and_update",*/
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
					portion: 200
				}

			};
			one_action_map.toSocket(obj);
			one_action_map.clearSelection();

		};

		one_action_map.sendSelectionCallback = function () {
                //tickets_stack.load();
                //action_price_info.load();
			var d2 = new Date();
			console.log('sendSelection:', d2 - one_action_map.d1);
		};

		one_action_map.sendSelectionCallbackFull = function () {
			tickets_stack.load();
			action_price_info.load();
			var d2 = new Date();
			console.log('sendSelectionFULL:', d2 - one_action_map.d1);

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
							switch (square.order_type) {
								case "QUOTA":

									form_name = "form_quote";
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
								/*case "QUOTA":
								 form_name = "form_quota_ticket_realization";
								 break;*/
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
					},
                    {
                        title: 'История места',
                        iconClass: 'fa-th',
                        disabled: false,
                        callback: function (params) {
                            var form_name = "form_action_scheme_item_history";
                            MB.Core.switchModal({
                                type: "form",
                                name: form_name,
                                isNewModal: true,
                                ids: [square.id],
                                params: { action_id: contentInstance.activeId, label: "Место №: " + square.id}
                            });
                        }
                    }
				]
			});

		});

        contentWrapper.find('.toggle-scheme-services').off('click').on('click', function(){
            if(contentWrapper.find('.one-action-additional-services-wrapper').hasClass('one-action-opened')){
                contentWrapper.find('.one-action-additional-services-wrapper').removeClass('one-action-opened');
                $(this).html('Доп. услуги');
            }else{
                contentWrapper.find('.one-action-additional-services-wrapper').addClass('one-action-opened');
                $(this).html('Схема зала');
            }

        });

		// Map

		$(modalInstance).off('resize').on('resize', function () {
			var currentMode = (isSectors)?"sectors":"squares";
			setHeights(false);
			if(!entryTickets.check(currentMode)) one_action_map.resize();
		});

		$(modalInstance).off('focus').on('focus', function () {
			one_action_map.reLoadList(one_action_map.blockedArray);
			/* tickets_stack.load();
			 action_price_info.load();*/
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
            one_action_map.destroy();
		});

		$(window).resize(function () {
			setHeights(false);
		});

		//HANDLERS

		//Вернуться
		contentWrapper.find('.back_to_sectors').off('click').on('click', function () {
			MB.Core.spinner.start(mapContainer);
			one_action_map.backToSectors(function () {
				isSectors = true;
				entryTickets.check("sectors");
				templates.setSidebar("sectors");
				MB.Core.spinner.stop(mapContainer);
			});
		});

		contentWrapper.find('.back_to_squares').off('click').on('click', function () {
			var elem = $(this);

			if (elem.hasClass("disabled")) return;

			lastSelectedSector.selected = true;
			sectorClickHandler();
		});

		contentWrapper.find('.close_tickets_list').off('click').on('click', function () {
			entryTickets.close();
			entryTickets.check("sectors");
			templates.setSidebar("sectors");
		});

		contentWrapper.find('.one-action-clear-highlight').on('click', function () {
			if(clientScreenActive) {
				toClientscreen({
					type: 'highlight'
				});
			}

			if (interval) clearInterval(interval);
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
        //Создать заказ на доставку
        contentWrapper.find(".prepare_delivery").off('click').on('click', function () {
            var params = {
                action_id: environment.activeId,
                delivery: 'TRUE'
            };
            var object = "create_reserv_order";
            one_action_map.getBlocked();
            socketQuery({command: "operation", object: object, params: params}, function (res) {
                if (!(res = socketParse(res))) return;
                one_action_map.reLoadList(one_action_map.blockedArray);
                tickets_stack.load();
                action_price_info.load();
                one_action_map.changed = true;
                MB.Core.switchModal({
                    type: "form",
                    isNewModal: true,
                    parentObject: contentInstance,
                    name: "form_delivery_order",
                    ids: [res['order_id']],
                    tablePKeys: res.primary_keys
                }, function (instance) {
                    var formInstance = instance;
                    var formModalInstance = MB.Core.modalWindows.windows.getWindow(formInstance.id);
                    entryTickets.clearTickets(true);

                    $(formModalInstance).off('close').on('close', function () {
                        one_action_map.reLoadList(one_action_map.blockedArray);
                        tickets_stack.load();
                        action_price_info.load();
                        entryTickets.clearTickets(true);
                    });
                });
            });
        });


        //Печать сразу
        contentWrapper.find(".one-action-print-order").off('click').on('click', function () {
            var params = {
                action_id: environment.activeId
            };
            var object = "create_to_pay_order";
            one_action_map.getBlocked();
            socketQuery({command: "operation", object: object, params: params}, function (res) {
                if (!(res = socketParse(res))) return;
                one_action_map.reLoadList(one_action_map.blockedArray);
                tickets_stack.load();
                action_price_info.load();
                one_action_map.changed = true;

                send('print_order', {
                    guid: MB.Core.getUserGuid(),
                    order_id: [res['order_id']]
                }, function (res) {
                    console.log('print_order', res);
                });
            });
        });

		//Создать заказ
		contentWrapper.find(".prepare_order").off('click').on('click', function () {
			var params = {
				action_id: environment.activeId
			};
            console.log("params", params);
			var object = "create_reserv_order";//"create_to_pay_order";
			one_action_map.getBlocked();
			socketQuery({command: "operation", object: object, params: params}, function (res) {
				if (!(res = socketParse(res))) return;
				one_action_map.reLoadList(one_action_map.blockedArray);
				tickets_stack.load();
				action_price_info.load();
				one_action_map.changed = true;
				MB.Core.switchModal({
					type: "form",
					isNewModal: true,
					parentObject: contentInstance,
					name: "form_order",
					ids: [res['order_id']],
					tablePKeys: res.primary_keys
				}, function (instance) {
					var formInstance = instance;
					var formModalInstance = MB.Core.modalWindows.windows.getWindow(formInstance.id);
                    entryTickets.clearTickets(true);

                    $(formModalInstance).off('close').on('close', function () {
						one_action_map.reLoadList(one_action_map.blockedArray);
						tickets_stack.load();
						action_price_info.load();
						entryTickets.clearTickets(true);
                    });
				});
			});
		});
		//Создать квоту
		contentWrapper.find(".prepare_quote").off('click').on('click', function () {
			var object = "create_reserved_quota";
			one_action_map.getBlocked();
			socketQuery({command: "operation", object: object}, function (data) {
				if (!(data = socketParse(data))) return;
				one_action_map.reLoadList(one_action_map.blockedArray);
				tickets_stack.load();
				action_price_info.load();
				one_action_map.changed = true;
				MB.Core.switchModal({
					type: "form",
					isNewModal: true,
					parentObject: contentInstance,
					name: "form_quote",
					ids: [data['quota_id']],
					tablePKeys: data.primary_keys
				}, function (instance) {
					var formInstance = instance;
					var formModalInstance = MB.Core.modalWindows.windows.getWindow(formInstance.id);
					$(formModalInstance).off('close').on('close', function () {
						one_action_map.reLoadList(one_action_map.blockedArray);
						tickets_stack.load();
						action_price_info.load();
                        entryTickets.clearTickets(true);
                    });
				});
			});
		});
		//Создать приглашение
		contentWrapper.find(".prepare_invitation").off('click').on('click', function () {
			var object = "create_invitation";
			one_action_map.getBlocked();
			socketQuery({command: "operation", object: object}, function (data) {
				if (!(data = socketParse(data))) return;
				one_action_map.reLoadList(one_action_map.blockedArray);
				tickets_stack.load();
				action_price_info.load();
				one_action_map.changed = true;
				MB.Core.switchModal({
					type: "form",
					isNewModal: true,
					parentObject: contentInstance,
					name: "form_invitation",
					ids: [data['invitation_id']],
					tablePKeys: data.primary_keys
				}, function (instance) {
					var formInstance = instance;
					var formModalInstance = MB.Core.modalWindows.windows.getWindow(formInstance.id);
					$(formModalInstance).off('close').on('close', function () {
						one_action_map.reLoadList(one_action_map.blockedArray);
						tickets_stack.load();
						action_price_info.load();
                        entryTickets.clearTickets(true);
                    });
				});
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
			var selectedSectors = [];

			for (var i in one_action_map.sectors) {
				var sec = one_action_map.sectors[i];
				if (sec.selected) {
					selectedSectors.push(sec);
					break;
				}
			}

			if(!selectedSectors.length) toClientscreen({type: 'hall', title: contentInstance.title, id: contentInstance.activeId, splitByAreaGroups: splitByAreaGroups});
			else toClientscreen({type: 'hallSector', title: contentInstance.title, id: contentInstance.activeId, selectedSectors: selectedSectors});

			clientScreenActive = true;
		});
		//В бронь
		contentWrapper.find('.adminReserv').off('click').on('click', function () {
			one_action_map.getBlocked();
			socketQuery({command: "operation", object: "create_admin_place_reserv"}, function (data) {
				socketParse(data);
                if(typeof one_action_map.reLoadList == "function") one_action_map.reLoadList(one_action_map.blockedArray);
                entryTickets.clearTickets(true);
			});
		});
		//Из брони
		contentWrapper.find('.adminReserv_cancel').off('click').on('click', function () {
			one_action_map.getBlocked();
			socketQuery({command: "operation", object: "remove_admin_place_reserv"}, function (data) {
				socketParse(data);
                if(typeof one_action_map.reLoadList == "function") one_action_map.reLoadList(one_action_map.blockedArray);
			});
		});
	}

    // SERVICES

    var additional_services = {

        inited : false,

        getAdditionalServices: function(cb){
            var o = {
                command: 'get',
                object: 'action_additional_service',
                params: {
                    where: 'ACTION_ID = '+contentInstance.activeId
                }
            };

            socketQuery(o, function(res){
                res = jsonToObj(JSON.parse(res)['results'][0]);
                console.log('REEEES', res);
                additional_services.additionalServices = res;
                if(typeof cb == 'function'){
                    cb();
                }
            });
        },

        getSelectedASGroups: function(){

            var ags = [];
            var flatAgs = [];


            if(storedPlaces != null){
                for(var i in storedPlaces){
                    var a = storedPlaces[i];
                    if(flatAgs.indexOf(a.ADDITIONAL_SERVICE_GROUP_ID) == -1){
                        if(a.ADDITIONAL_SERVICE_GROUP_ID != ''){
                            ags.push({
                                name: a.ADDITIONAL_SERVICE_GROUP_NAME,
                                id: a.ADDITIONAL_SERVICE_GROUP_ID
                            });
                            flatAgs.push(a.ADDITIONAL_SERVICE_GROUP_ID);
                        }
                    }
                }
            }

            if(storedTickets != null){
                for(var i2 in storedTickets){
                    var a2 = storedTickets[i2];
                    if(flatAgs.indexOf(a2.ADDITIONAL_SERVICE_GROUP_ID) == -1){
                        if(a.ADDITIONAL_SERVICE_GROUP_ID != ''){
                            ags.push({
                                name: a2.ADDITIONAL_SERVICE_GROUP_NAME,
                                id: a2.ADDITIONAL_SERVICE_GROUP_ID
                            });
                            flatAgs.push(a2.ADDITIONAL_SERVICE_GROUP_ID);
                        }
                    }
                }
            }

            return ags;
        },

        initAdditionalServices: function(){
            additional_services.getAdditionalServices(function(){
                additional_services.prepareAdditionalServiceObj();
                additional_services.populateAdditionalServices();
                additional_services.setAdditionalServicesHandlers();
                additional_services.additionalServiceBasket.disableBtns();
                additional_services.inited = true;
            });
        },

        updateAdditionalServices: function(){
            additional_services.prepareAdditionalServiceObj();
            additional_services.populateAdditionalServices();
            additional_services.additionalServiceBasket.disableBtns();
            additional_services.setAdditionalServicesHandlers();
            tickets_stack.populateTotal();
//            additional_services.calculateTotal();
        },

        prepareAdditionalServiceObj: function(){
            var mO = {
                ser_ags: [],
                ser_other_ags: [],
                ser_cart_items: [],
                dependServiceNotification: '',
                totalServiceAmount: additional_services.additionalServiceBasket.getTotal().toFixed(2)
            };
            var agServiceExsist = false;

            var ags = additional_services.getSelectedASGroups();

            if(ags.length > 0){
                for(var i in ags){
                    var ag = ags[i];
                    mO.ser_ags.push({
                        ser_ag_id: ag.id,
                        ser_ag_title: ag.name,
                        ACTION_ADD_SERVICE_TYPE: '1',
                        ACTION_ADD_SERVICE_TYPE_RU: '1',
                        ser_ag_items: []
                    });
                }
            }

            for(var i2 in mO.ser_ags){
                var ag2 = mO.ser_ags[i2];

                for(var l in additional_services.additionalServices){
                    var ser = additional_services.additionalServices[l];
                    if(ser['LINK_TO_AREA_GROUP'] == 'TRUE'){

                        ag2.ser_ag_items.push(cloneObj(ser));
                        ag2.ser_ag_items[ag2.ser_ag_items.length - 1]['ser_item_count'] = additional_services.additionalServiceBasket.getCount(ag2.ser_ag_id, ser.ACTION_ADDITIONAL_SERVICE_ID);
                        ag2.ser_ag_items[ag2.ser_ag_items.length - 1]['ser_ag_id'] = ag2.ser_ag_id;
                        ag2.ser_ag_items[ag2.ser_ag_items.length - 1]['ser_ag_title'] = ag2.ser_ag_title;
                    }
                }
            }

            for(var l2 in additional_services.additionalServices){
                var ser2 = additional_services.additionalServices[l2];
                if(ser2['LINK_TO_AREA_GROUP'] == 'FALSE'){

                    mO.ser_other_ags.push(cloneObj(ser2));

                    mO.ser_other_ags[mO.ser_other_ags.length - 1]['ser_item_count'] = additional_services.additionalServiceBasket.getCount('other', ser2.ACTION_ADDITIONAL_SERVICE_ID);
                    mO.ser_other_ags[mO.ser_other_ags.length - 1]['ser_ag_id'] = 'other';
                    mO.ser_other_ags[mO.ser_other_ags.length - 1]['ser_ag_title'] = '';
                }else{
                    agServiceExsist = true;
                }
            }


            //populate additional services basket
            (function(){

                for(var i in additional_services.additionalServiceBasket.list){
                    var inbItem = additional_services.additionalServiceBasket.list[i];
                    mO.ser_cart_items.push(inbItem);
                }

            }());

            if(mO.ser_ags.length == 0 && agServiceExsist){
                mO.dependServiceNotification = '<div class="one-action-service-depend-notification-wrapper"><i class="fa fa-exclamation-triangle"></i>&nbsp;&nbsp;Для некоторых услуг необходимо предварительно выбрать места в зале.</div>';
            }

            additional_services.additionalServiceData = mO;
        },

        populateAdditionalServices: function(){
            additional_services.isServices = true;
            var servicesHtml = '';
            if(additional_services.isServices){
                servicesHtml = '<div class="one-action-services-wrapper">'+


                    '<div class="one-action-services-list">'+
                    '{{{dependServiceNotification}}}' +
                    '{{#ser_ags}}'+
                    '<div class="one-action-ser-ag-wrapper" data-id="{{ser_ag_id}}">'+
                    '<div class="one-action-ser-ag-title">{{ser_ag_title}}</div>'+
                    '<div class="one-action-ser-ag-dd-toggler one-action-unsel"><i class="fa fa-angle-down"></i></div>'+
                    '<div class="one-action-ser-type-wrapper one-action-unsel" data-id="{{ACTION_ADD_SERVICE_TYPE}}">'+
//                                                    '<div class="one-action-ser-type-title">{{ACTION_ADD_SERVICE_TYPE_RU}}</div>'+
                    '{{#ser_ag_items}}'+
                    '<div class="one-action-ser-item-wrapper" data-id="{{ACTION_ADDITIONAL_SERVICE_ID}}">'+
                    '<div class="one-action-ser-item-inner">'+
                    '<div class="one-action-ser-item-title">{{ADDITIONAL_SERVICE_NAME}}</div>'+
                    '<div class="one-action-ser-item-price one-action-unsel">{{PRICE}} <span class="one-action-switch-lang" data-keyword="rub">руб.</span></div>'+
                    '<div class="one-action-ser-item-count one-action-unsel">{{ser_item_count}}</div>'+
                    '<div class="one-action-ser-item-minus one-action-unsel" data-agid="{{ser_ag_id}}" data-serid="{{ACTION_ADDITIONAL_SERVICE_ID}}"><i class="fa fa-minus"></i></div>'+
                    '<div class="one-action-ser-item-plus one-action-unsel" data-agid="{{ser_ag_id}}" data-serid="{{ACTION_ADDITIONAL_SERVICE_ID}}"><i class="fa fa-plus"></i></div>'+
                    '</div>'+
                    '</div>'+
                    '{{/ser_ag_items}}'+
                    '</div>'+
                    '</div>'+
                    '{{/ser_ags}}'+


                    '<div class="one-action-ser-ag-wrapper one-action-ser-other-services-wrapper" data-id="other">'+
                    '<div class="one-action-ser-ag-title">'+
                    '<span class="one-action-switch-lang" data-keyword="otherServices">Прочие услуги</span>'+
                    '</div>'+
                    '<div class="one-action-ser-ag-dd-toggler"><i class="fa fa-angle-down"></i></div>'+
                    '<div class="one-action-ser-type-wrapper" data-id="{{ser_type_id}}">'+
                    '<div class="one-action-ser-type-title">{{ser_type_title}}</div>'+

                    '{{#ser_other_ags}}'+
                    '<div class="one-action-ser-item-wrapper" data-id="{{ACTION_ADDITIONAL_SERVICE_ID}}">'+
                    '<div class="one-action-ser-item-inner">'+
                    '<div class="one-action-ser-item-title">{{ADDITIONAL_SERVICE_NAME}}</div>'+
                    '<div class="one-action-ser-item-price">{{PRICE}} <span class="one-action-switch-lang" data-keyword="rub">руб.</span></div>'+
                    '<div class="one-action-ser-item-count">{{ser_item_count}}</div>'+
                    '<div class="one-action-ser-item-minus one-action-unsel" data-agid="{{ser_ag_id}}" data-serid="{{ACTION_ADDITIONAL_SERVICE_ID}}"><i class="fa fa-minus"></i></div>'+
                    '<div class="one-action-ser-item-plus one-action-unsel" data-agid="{{ser_ag_id}}" data-serid="{{ACTION_ADDITIONAL_SERVICE_ID}}"><i class="fa fa-plus"></i></div>'+
                    '</div>'+
                    '</div>'+
                    '{{/ser_other_ags}}'+
                    '</div>'+
                    '</div>'+

                    '</div>'+
                    '<div class="one-action-ser-cart-wrapper">'+
                    '<div class="one-action-ser-cart-list">'+
                    '{{#ser_cart_items}}'+
                    '<div class="one-action-ser-cart-item" data-id="{{ser_cart_item_id}}">'+
                    '<div class="one-action-ser-cart-item-ag" data-id="{{ser_cart_item_ag_id}}">{{ser_cart_item_ag_title}}</div>'+
                    '<div class="one-action-ser-cart-item-title">{{ser_cart_item_title}}</div>'+
//                                            '<div class="one-action-ser-cart-item-remove"><i class="fa fa-trash-o"></i></div>'+
                    '<div class="one-action-ser-cart-item-price">{{ser_cart_item_price}} <span class="one-action-switch-lang" data-keyword="rub">руб.</span></div>'+
                    '<div class="one-action-ser-cart-item-count">х{{ser_cart_item_count}}</div>'+
                    '<div class="one-action-ser-cart-item-total">{{ser_cart_item_total}} <span class="one-action-switch-lang" data-keyword="rub">руб.</span></div>'+
                    '<div class="one-action-ser-cart-item-minus one-action-unsel" data-agid="{{ser_cart_item_ag_id}}" data-serid="{{ser_cart_item_id}}"><i class="fa fa-minus"></i></div>'+
                    '<div class="one-action-ser-cart-item-plus one-action-unsel" data-agid="{{ser_cart_item_ag_id}}" data-serid="{{ser_cart_item_id}}"><i class="fa fa-plus"></i></div>'+
                    '</div>'+
                    '{{/ser_cart_items}}'+
                    '</div>'+
                    '<div class="one-action-ser-cart-total-wrapper">'+
                    '<div class="one-action-ser-cart-total-amount">Итого: <span class="one-action-ser-cart-total">{{totalServiceAmount}}</span> <span class="one-action-switch-lang" data-keyword="rub">руб.</span></div>'+
                    '</div>'+
                    '</div>'+
                    '</div>'+
                    '</div>';

                var wasOpened = (additServicesWrapper.find('.one-action-services-wrapper').hasClass('one-action-opened'))? 'one-action-opened': '';
                additServicesWrapper.find('.one-action-services-wrapper').remove();
                additServicesWrapper.find('.one-action-additional-services-wrapper').append(Mustache.to_html(servicesHtml, additional_services.additionalServiceData));

                additional_services.additionalServiceDD = additServicesWrapper.find('.one-action-services-wrapper');
                additional_services.additionalServiceDD.addClass(wasOpened);

                //asda


//                headerFooterHeight = additional_services.find('.one-action-header').outerHeight() + additional_services.find('.one-action-footer').outerHeight() + additional_services.find('.one-action-mobile-choose-sector-header').outerHeight();
//
//                if($(window).outerWidth() <= 640){
//                    additional_services.additionalServiceDD.height(additional_services.canvasContainerHeight + 'px');
//                    additional_services.additionalServiceDD.css('bottom', -additional_services.canvasContainerHeight - 78 + 'px');
//                }else{
//                    additional_services.canvasContainerHeight = ($(window).height() - headerFooterHeight);
//                }
//                additional_services.additionalServiceDD.height(additional_services.canvasContainerHeight + 'px');
            }
        },

        getAdditionalService: function(agid, serid){
            if(agid == 'other'){
                for(var i in additional_services.additionalServiceData.ser_other_ags){
                    var ser = additional_services.additionalServiceData.ser_other_ags[i];
                    if(ser['ACTION_ADDITIONAL_SERVICE_ID'] == serid){
                        return ser;
                    }
                }
            }else{
                for(var k in additional_services.additionalServiceData.ser_ags){
                    var ag = additional_services.additionalServiceData.ser_ags[k];

                    if(ag.ser_ag_id == agid){
                        for(var j in ag.ser_ag_items){
                            var jitem =  ag.ser_ag_items[j];

                            if(jitem['ACTION_ADDITIONAL_SERVICE_ID'] == serid){
                                return jitem;
                            }
                        }
                    }
                }
            }
            return false;
        },

        getBlockedPlacesCount: function(){
//            var storedPlaces = JSON.parse(localStorage.getItem('one-action-basket'));
//            var storedTickets = JSON.parse(localStorage.getItem('one-action-tp-basket'));

//            var count = 0;
//            if(storedPlaces != null){
//                for(var i in storedPlaces.actions){
//                    var a = storedPlaces.actions[i];
//                    count += a.places.length;
//                }
//            }
//
//            if(storedTickets != null){
//                for(var i2 in storedTickets.actions){
//                    var a2 = storedTickets.actions[i2];
//                    count += a2.places.length;
//                }
//            }


//            return count;

            console.log('getBlockedPlacesCount');
        },

        getBlockedPlacesInAg: function(id){
//            var storedPlaces = JSON.parse(localStorage.getItem('one-action-basket'));
//            var storedTickets = JSON.parse(localStorage.getItem('one-action-tp-basket'));
//
//            var count = 0;
//
//            for(var i in storedPlaces.actions){
//                var a = storedPlaces.actions[i];
//
//                for(var k in a.places){
//                    var plc = a.places[k];
//                    if(plc.areaGroupId == id){
//                        count++;
//                    }
//                }
//
//
//            }
//
//            for(var i2 in storedTickets.actions){
//                var a2 = storedTickets.actions[i2];
//                for(var l in a2.places){
//                    var plc2 = a2.places[l];
//                    if(plc2.areaGroupId == id){
//                        count++;
//                    }
//                }
//            }
//            return count;
            console.log('getBlockedPlacesInAg');
        },

        additionalServiceBasket: {
            list: [],

            disableBtns: function(){

                var plusBtns = additServicesWrapper.find('.one-action-ser-item-plus, .one-action-ser-cart-item-plus');
                var minusBtns = additServicesWrapper.find('.one-action-ser-item-minus, .one-action-ser-cart-item-minus');

                for(var i = 0; i< plusBtns.length; i++){
                    var pBtn = plusBtns.eq(i);
                    var agid = pBtn.data('agid');
                    var serid = pBtn.data('serid');
                    var obj = additional_services.getAdditionalService(agid, serid);

                    if(!additional_services.additionalServiceBasket.checkLimit(obj)){
                        pBtn.addClass('one-action-disabled');
                    }else{
                        pBtn.removeClass('one-action-disabled');
                    }
                }
                for(var k = 0; k< minusBtns.length; k++){
                    var mBtn = minusBtns.eq(k);
                    var agid2 = mBtn.data('agid');
                    var serid2 = mBtn.data('serid');
                    var obj2 = additional_services.getAdditionalService(agid2, serid2);

                    if(obj2.ser_item_count == 0){
                        mBtn.addClass('one-action-disabled');
                    }else{
                        mBtn.removeClass('one-action-disabled');
                    }
                }

            },

            checkoutByPlaceDeselection: function(){

                additional_services.updateAdditionalServices();

                var flatAgs = [];
                for(var l in additional_services.additionalServiceData.ser_ags){
                    var ag = additional_services.additionalServiceData.ser_ags[l];
                    flatAgs.push(ag.ser_ag_id);
                }

                for(var j in additional_services.additionalServiceBasket.list){
                    var jitem = additional_services.additionalServiceBasket.list[j];


                    if(jitem.ser_cart_item_ag_id != 'other' && flatAgs.indexOf(jitem.ser_cart_item_ag_id) == -1){
                        jitem.ser_cart_item_count = 0;
                        console.log('UAAA', jitem);
                        additional_services.additionalServiceBasket.clearEmpty();
                        additional_services.updateAdditionalServices();
                    }
                }

                for(var i in additional_services.additionalServiceBasket.list){
                    var bitem = additional_services.additionalServiceBasket.list[i];

                    if(additional_services.additionalServiceBasket.checkCurrentLimit(additional_services.getAdditionalService(bitem.ser_cart_item_ag_id, bitem.ser_cart_item_id)) === false){
                        additional_services.additionalServiceBasket.decItem(bitem.ser_cart_item_ag_id, bitem.ser_cart_item_id);
                    }
                }


                if(additional_services.additionalServiceData.ser_ags.length == 0){
                    for(var k in additional_services.additionalServiceBasket.list){
                        var kitem = additional_services.additionalServiceBasket.list[k];
                        if(kitem.ser_cart_item_ag_id != 'other'){
                            kitem.ser_cart_item_count = 0;
                        }

                        var obj = additional_services.getAdditionalService(kitem.ser_cart_item_ag_id, kitem.ser_cart_item_id);
                        obj.ser_item_count = 0;
                    }


                    additional_services.additionalServiceBasket.clearEmpty();
                    additional_services.updateAdditionalServices();
                }

            },

            clearBasketHandler: function(){

                for(var i in additional_services.additionalServiceBasket.list){
                    var item = additional_services.additionalServiceBasket.list[i];
                    var obj = additional_services.getAdditionalService(item.ser_cart_item_ag_id, item.ser_cart_item_id);
                    if(item.ser_cart_item_ag_id == 'other'){
                        if(obj.ACTION_ADD_SERVICE_TYPE == 'COUNT_LIMIT_BY_TICKET'){
                            obj.ser_item_count = 0;
                            delete additional_services.additionalServiceBasket.list[i];
                        }
                    }else{
                        obj.ser_item_count = 0;
                        delete additional_services.additionalServiceBasket.list[i];
                    }
                }

                function removeDeleted(arr){
                    for(var k in arr){
                        var kitem = arr[k];
                        if(kitem === undefined){
                            arr.splice(i,1);
                            return removeDeleted(arr);
                            break;
                        }
                    }
                }
                removeDeleted(additional_services.additionalServiceBasket.list);

                additional_services.updateAdditionalServices();

            },

            getSameServiceCount: function(id){
                var total = 0;
                for(var i in additional_services.additionalServiceBasket.list){
                    var item = additional_services.additionalServiceBasket.list[i];
                    if(item.ser_cart_item_id == id){
                        total += parseInt(item.ser_cart_item_count);
                    }
                }
                return total;
            },

            checkCurrentLimit: function(obj){
                var type =      obj.ACTION_ADD_SERVICE_TYPE;
                var limit =     obj.COUNT_LIMIT;
                var quantity =  obj.QUANTITY;
                var ccount =    obj.ser_item_count;

                return additional_services.additionalServiceBasket.getSameServiceCount(obj.ACTION_ADDITIONAL_SERVICE_ID) <= quantity;

            },

            checkLimit: function(obj){
                var type =      obj.ACTION_ADD_SERVICE_TYPE;
                var limit =     obj.COUNT_LIMIT;
                var quantity =  obj.QUANTITY;
                var ccount =    obj.ser_item_count;


                return additional_services.additionalServiceBasket.getSameServiceCount(obj.ACTION_ADDITIONAL_SERVICE_ID) < quantity;

            },

            incItem: function(agid, serid){
                var obj = additional_services.getAdditionalService(agid, serid);
                if(additional_services.additionalServiceBasket.checkLimit(obj)){
                    if(additional_services.additionalServiceBasket.list.length == 0){
                        additional_services.additionalServiceBasket.list.push({
                            ser_cart_item_ag_id:        agid,
                            ser_cart_item_ag_title:     obj.ser_ag_title,
                            ser_cart_item_id:           obj.ACTION_ADDITIONAL_SERVICE_ID,
                            ser_cart_item_title:        obj.ADDITIONAL_SERVICE_NAME,
                            ser_cart_item_price:        obj.PRICE,
                            ser_cart_item_count:        obj.ser_item_count + 1,
                            ser_cart_item_total:        ((obj.ser_item_count + 1) * obj.PRICE)
                        });
                    }else{
                        var found = false;
                        for(var i in additional_services.additionalServiceBasket.list){
                            var bitem = additional_services.additionalServiceBasket.list[i];
                            if(bitem.ser_cart_item_ag_id == agid && bitem.ser_cart_item_id == serid){
                                bitem.ser_cart_item_count ++;
                                bitem.ser_cart_item_total = bitem.ser_cart_item_count * bitem.ser_cart_item_price;
                                found = true;
                            }
                        }
                        if(!found){
                            additional_services.additionalServiceBasket.list.push({
                                ser_cart_item_ag_id:        agid,
                                ser_cart_item_ag_title:     obj.ser_ag_title,
                                ser_cart_item_id:           obj.ACTION_ADDITIONAL_SERVICE_ID,
                                ser_cart_item_title:        obj.ADDITIONAL_SERVICE_NAME,
                                ser_cart_item_price:        obj.PRICE,
                                ser_cart_item_count:        obj.ser_item_count + 1,
                                ser_cart_item_total:        ((obj.ser_item_count + 1) * obj.PRICE)
                            });
                        }
                    }
                    obj.ser_item_count++;
                    additional_services.updateAdditionalServices();
                }else{
                    console.log('OVER');
                }

            },

            decItem: function(agid, serid){
                var obj = additional_services.getAdditionalService(agid, serid);
                if(additional_services.additionalServiceBasket.list.length == 0){
                    return;
                }else{
                    for(var i in additional_services.additionalServiceBasket.list){
                        var bitem = additional_services.additionalServiceBasket.list[i];
                        if(bitem.ser_cart_item_ag_id == agid && bitem.ser_cart_item_id == serid){
                            if(bitem.ser_cart_item_count > 0){
                                bitem.ser_cart_item_count --;
                                bitem.ser_cart_item_total = bitem.ser_cart_item_count * bitem.ser_cart_item_price;
                            }
                        }
                    }
                }
                obj.ser_item_count--;
                additional_services.additionalServiceBasket.clearEmpty();
                additional_services.updateAdditionalServices();
            },

            getCount: function(agid, serid){
                if(additional_services.additionalServiceBasket.list.length == 0){
                    return 0;
                }else{
                    var found = false;
                    for(var i in additional_services.additionalServiceBasket.list){
                        var bitem = additional_services.additionalServiceBasket.list[i];
                        if(bitem.ser_cart_item_ag_id == agid && bitem.ser_cart_item_id == serid){
                            found = true;
                            return bitem.ser_cart_item_count
                        }
                    }
                    if(!found){
                        return 0;
                    }
                }
            },

            clearEmpty: function(){
                for(var i in additional_services.additionalServiceBasket.list){
                    var item = additional_services.additionalServiceBasket.list[i];
                    if(item.ser_cart_item_count == 0){
                        additional_services.additionalServiceBasket.list.splice(i, 1);
                    }
                }
            },

            getTotal: function(){
                var total = 0;
                for(var i in additional_services.additionalServiceBasket.list){
                    var item = additional_services.additionalServiceBasket.list[i];
                    total += parseInt(item.ser_cart_item_total);
                }
                return parseFloat(total);
            }
        },

        setAdditionalServicesHandlers: function(){

            if(additional_services.isServices){

                additServicesWrapper.find('.one-action-additional-service-button').off('click').on('click', function(){
                    if(additional_services.additionalServiceDD.hasClass('one-action-opened')){
                        additional_services.additionalServiceDD.removeClass('one-action-opened');
                    }else{
                        additional_services.additionalServiceDD.addClass('one-action-opened');
                    }
                });

                additServicesWrapper.find('.one-action-services-dd-toggler').off('click').on('click', function(){
                    if(additional_services.additionalServiceDD.hasClass('one-action-opened')){
                        additional_services.additionalServiceDD.removeClass('one-action-opened');
                    }else{
                        additional_services.additionalServiceDD.addClass('one-action-opened');
                    }
                });

                additServicesWrapper.find('.one-action-ser-item-minus, .one-action-ser-cart-item-minus').off('click').on('click', function(){
                    var agId = $(this).data('agid');
                    var serId = $(this).data('serid');
                    if($(this).hasClass('one-action-disabled')){
                        return;
                    }

                    additional_services.additionalServiceBasket.decItem(agId, serId);



                });

                additServicesWrapper.find('.one-action-ser-item-plus, .one-action-ser-cart-item-plus').off('click').on('click', function(){
                    var agId = $(this).data('agid');
                    var serId = $(this).data('serid');

                    if($(this).hasClass('one-action-disabled')){
                        return;
                    }

                    additional_services.additionalServiceBasket.incItem(agId, serId);


                });

                additServicesWrapper.find('.one-action-ser-ag-dd-toggler').off('click').on('click', function(){
                    var p = $(this).parents('.one-action-ser-ag-wrapper');

                    if(p.hasClass('one-action-closed')){
                        p.removeClass('one-action-closed');
                        $(this).html('<i class="fa fa-angle-down"></i>');
                    }else{
                        p.addClass('one-action-closed');
                        $(this).html('<i class="fa fa-angle-up"></i>');
                    }
                });
            }
        }
    };



}());
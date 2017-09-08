(function () {
	var contentID = MB.Contents.justAddedId;
	var contentInstance = MB.Contents.getItem(contentID);
	var contentWrapper = $('#mw-' + contentInstance.id);

	//["PRINT_QUEUE_ID", "CONTRACT_ID", "ORDER_ID", "ORDER_TICKET_ID", "PRINTED", "TICKET_PACK_ID", "SCA_SERIES",
	// "SCA_NUMBER", "PRINTER_ID", "IP_ADDRESS", "PORT", "PRINTER_TYPE", "ORGANIZER_NAME", "ORGANIZER_ADDRESS", "OKUN",
	// "SHOW_SEASON", "ACTION_NAME", "ACTION_NAME2", "HALL_NAME", "ACTION_DATE", "ACTION_TIME", "AGE_CAT", "AREA_NAME",
	// "LINE", "PLACE", "PRICE", "CASHER_NAME", "PRINT_DATE_TIME", "TICKET_NO", "PERSON_NAME", "PERSON_ADDRESS",
	// "PERSON_PHONE", "LOGO_ID", "EXT_ID", "USER_ID", "ACTION_ID", "BARCODE", "SUBSCRIPTION_ID", "TICKET_PACK_TYPE",
	// "PRINT_STATUS", "PRINT_STATUS_RU", "EXTERNAL_ORDER_ID"]


	var tickets = {
		tempPage: 1,
		/**
		 * Устанавливает по сколько билетов выводить на стр. Если передан второй параметр, перерисует форму
		 * @param obj
		 * @param render
		 */
		setPortion: function (obj, render) {
			if (typeof obj !== 'object') {
				console.log('В tickets.setPortion не передан объект');
				return;
			}
			//tickets.portion = +num;
			for (var i in obj) {
				var pack = tickets.blank_types[i];
				pack.portion = +obj[i];
			}
			if (render) {
				tickets.renderTickets();
			}
		},
		blank_types: {},
		updateStatus: function (blank_types, status) {
			if (typeof tickets.blank_types[blank_types] !== 'object') {
				return false;
			}
			tickets.blank_types[blank_types].status = status;
			var btn = $('[data-type="' + blank_types + '"].print_next_btn');
			btn.removeClass('disabled');
		},
		/**
		 * Функция подготавливает клиентскую модель билета на основе серверной и возвращает объект
		 * !Внимание! Функция не добавляет получившийся объект в items
		 * @param obj
		 * @returns {{print_queue_id: (*|string), order_ticket_id: (.params.ORDER_TICKET_ID|*|o.ORDER_TICKET_ID|string), action: string, place: string, price: (templates.BARVIKHA.STANDART.PRICE|*|templates.BARVIKHA.SUBSCRIPTION.PRICE|SUBSCRIPTION.PRICE|tmpObj.PRICE|string), sca: string, print_status: (*|string), print_status_ru: (*|string), barcode: (*|thObj.barcode), blank_type: (resObj.TICKET_PACK_TYPE|*)}}
		 */
		newItem: function (obj) {
			if (typeof obj !== "object") {
				return false;
			}
			return {
				print_queue_id: obj.PRINT_QUEUE_ID || '-',
				order_ticket_id: obj.ORDER_TICKET_ID || '-',
				action: obj.ACTION_NAME || obj.ACTION + ' (' + (obj.ACTION_DATE || obj.ACTION_DATE + ' ' + obj.ACTION_TIME) + ')',
				place: obj.AREA_NAME || obj.AREA_GROUP + ' ' + (obj.LINE_WITH_TITLE || obj.LINE) + ' ' + (obj.PLACE_WITH_TITLE || obj.PLACE),
				price: obj.PRICE || '',
				sca: (obj.SCA_SERIES) ? obj.SCA_SERIES + '-' + obj.SCA_NUMBER : '',
				print_status: obj.PRINT_STATUS || '-',
                spinner_display:'inline',
				print_status_ru: obj.PRINT_STATUS_RU || '-',
				ticket_status_ru: obj.STATUS_RU || 'Ожидает оплаты',
				barcode: obj.BARCODE,
				blank_type: obj.TICKET_PACK_TYPE
			};
		},
		/**
		 * Добавляет билеты в скоуп
		 * @param packs билеты
		 * @param clear Очищать  скоуп перед заполнением или нет | false
		 * @returns {*}
		 */
		addItems: function (packs, clear) {
			if (typeof packs !== 'object') {
				return false;
			}
			if (clear) {
				tickets.blank_types = {};
			}
			for (var i0 in packs) {
				var one_pack = packs[i0];
				for (var i in one_pack) {
					if (typeof tickets.blank_types[i0] !== 'object') {
						tickets.blank_types[i0] = [];
					}
					var item = tickets.newItem(one_pack[i]);
					if (item) {
						tickets.blank_types[i0].push(item);
					}
				}
			}
			return tickets.blank_types;
		},
		getItem: function (obj, many) {
			if (typeof obj !== 'object') {
				return false;
			}
			var finded = [];
			var stop = false;
			var count = 0;
			for (var i in tickets.blank_types) {
				if (stop) {
					break;
				}
				var records = tickets.blank_types[i];
				for (var j in  records) {
					var isFinded = false;
					for (var k in obj) {
						isFinded = (records[j][k] == obj[k]);
					}
					if (isFinded) {
						count++;
						finded.push(records[j]);
						if (!many || many === count) {
							stop = true;
							break;
						}
					}
				}
			}
			return (many) ? finded : finded[0];
		},
        getFromServer: function(ids, callback){
            var o = {
                command:"get",
                object:"order_ticket",
                params:{
                    where: "order_ticket_id in (" + ids + ")"
                }
            };
            socketQuery(o, function(data){
                if (data.code && data.code !== 0){
                    return console.log('Ошибка при получении данных.', data);
                }
                data = JSON.parse(data);
                var DATA = jsonToObj(data['results'][0]);
                var tis = [];
                for (var i in DATA) {
                    var item = DATA[i];
                    tis.push(tickets.newItem(item));
                }
                if (typeof callback ==='function'){
                    callback(tis);
                }
            });
        },
		updateItem: function (changes, where, many) {
			if (typeof where !== 'object' || typeof changes !== 'object') {
				return false;
			}
			var item = tickets.getItem(where, many);
			if (!item) {
				return false;
			}
			if (many) {
				for (var i in item) {
                    item[i].spinner_display = (changes.print_status == "IN_PRINT") ? "inline" : "none";
					for (var j in changes) {
                        changes[j].spinner_display = (changes[j].print_status=="IN_PRINT")?"inline":"none";
						item[i][j] = changes[j];
					}
				}
			} else {
                item.spinner_display = (changes.print_status == "IN_PRINT") ? "inline" : "none";
				for (var j2 in changes) {
					item[j2] = changes[j2];
				}
			}
			return item;
		},
		removeItem: function (where, many) {
			if (typeof where !== 'object') {
				return false;
			}
			var count = 0;
			var stop = false;
			for (var i in tickets.blank_types) {
				if (stop) {
					break;
				}
				var records = tickets.blank_types[i];
				for (var j in  records) {
					var isFinded = false;
					for (var k in where) {
						isFinded = (records[j][k] == where[k]);
					}
					if (isFinded) {
						count++;
						delete tickets.blank_types[i][j];
						if (!many || many === count) {
							stop = true;
							break;
						}
					}
				}
			}

			function clearEmpty(obj) {
				for (var i = 0; i < obj.length; i++) {
					if (obj[i] === undefined) {
						obj.splice(i, 1);
						clearEmpty(obj);
					}
				}
			}

			for (var i1 in tickets.blank_types) {
				clearEmpty(tickets.blank_types[i1]);
			}
			return count;
		},
		renderTickets: function (cb) {
			console.log('BLTYPES', tickets.blank_types);
			var container = contentWrapper.find('.printStack-parent-wrapper');

			var tpl = '<div class="tabsParent sc_tabulatorParent floated">' +
				'<div class="tabsTogglersRow sc_tabulatorToggleRow">' +
				'{{#tabs}}' +
				'<div class="tabToggle sc_tabulatorToggler {{opened}}" dataitem="{{dataitem}}">' +
				'<span class="childObjectTabTitle" data-name="{{name}}" data-item="{{dataitem}}">{{{tab_title}}}</span>' +
				'</div>' +
				'{{/tabs}}' +
				'</div>' +

				'<div class="ddRow sc_tabulatorDDRow">' +
				'{{#tabContents}}' +
				'<div class="tabulatorDDItem noMinHeight noMaxHeight sc_tabulatorDDItem {{opened}}" data-tickets_count="{{ticketsCount}}" dataitem="{{dataitem}}">' +
				'<div class="childObjectWrapper printStack-tab" data-item="{{dataitem}}">' +

				'<div class="printStack-tickets-list-wrapper">' +
				'<div class="printStack-tickets-header">' +
				'<h4>Билеты в печати:</h4>' +
				'</div>' +

				'<div class="printStack-tickets-list-header-wrapper">' +
				'<ul class="printStack-tickets-list-header">' +
				'<li>' +
				'<div class="printStack-ticket-insert">-</div>' +
				'<div class="printStack-ticket-place">Место</div>' +
				'<div class="printStack-ticket-status">Статус печати</div>' +
				'<div class="flRight">БСО Серия</div>' +
				'</li>' +
				'</ul>' +
				'</div>' +
				'<div class="printStack-tickets-pages-vis">' +
				'<div class="printStack-tickets-pages-train" style="width: {{trainWidth}}%">' +

				'{{#pages}}' +
				'<ul class="printStack-tickets-list" data-page="{{page_no}}" style="width: {{pageWidth}}%">' +
				'{{#tickets}}' +
				'<li data-id="{{ticketId}}">' +
				'<div class="printStack-ticket-insert"><i class="fa fa-mail-forward"></i></div>' +
				'<div class="printStack-ticket-place">{{place}}</div>' +
				'<div class="printStack-ticket-status"><i class="statusIcon fa fa-spin fa-spinner"></i>  {{print_status_ru}}</div>' +
				'<div class="printStack-ticket-bso">{{bso}}</div>' +
				'</li>' +
				'{{/tickets}}' +
				'</ul>' +
				'{{/pages}}' +
				'</div>' +
				'</div>' +

				'<div class="printStack-pagination-wrapper">' +
				'<ul class="printStack-pagination">' +
				'<li class="printStack-pagination-btn prev fa fa-angle-left"></li>' +
				'<li class="printStack-pagination-input-wrapper"><input type="text" class="printStack-pagination-input" value="' + tickets.tempPage + '"/></li>' +
				'{{#pages}}' +
				'<li data-no="{{page_no}}" class="{{active}} hiddenPSPage">{{vis_no}}</li>' +
				'{{/pages}}' +
				'<li class="printStack-pagination-btn next fa fa-angle-right"></li>' +
				'<li class="printStack-pagination-pagescount">Страниц: {{pagesCount}}</li>' +
				'</ul>' +

				'</div>' +
				'<div class="print_stack_buttons_wrapper">' +
				'<div class="print_next_btn fn-btn fn-small-btn blue flLeft splicedRoundedBtn disabled" data-type="{{dataitem}}">Печатать далее</div>' +
				'<div class="pause_btn fn-btn fn-small-btn blue flLeft splicedRoundedBtn" data-type="{{dataitem}}">Приостановить</div>' +
				'<div class="cancel_all_btn fn-btn fn-small-btn blue flLeft splicedRoundedBtn" data-type="{{dataitem}}">Очистить очередь</div>' +
				'</div>' +
				'</div>' +

				'</div>' +
				'</div>' +
				'{{/tabContents}}' +
				'</div>' +
				'</div>';

			var mO = {
				tabs: [],
				tabContents: []
			};
			var iter = 0;

			function getTrainWidth(obj) {
				var width = 0;
				var iidx = 0;
				for (var i in obj) {
					var st = obj[i];
					if (iidx == 0) {
						width += 100;
					} else if (iidx % obj.portion == 0) {
						width += 100;
					}
					iidx++;
				}
				return width;
			}

			function getPagesObject(obj) {
				var pages = [];

				var iidx = 0;
				for (var i in obj) {
					var st = obj[i];
					if (iidx == 0) {
						pages.push({
							pageWidth: 100 / (getTrainWidth(obj) / 100),
							page_no: iidx / obj.portion,
							vis_no: iidx / obj.portion + 1,
							active: 'active',
							tickets: []
						});
					} else if (iidx % obj.portion == 0) {
						pages.push({
							pageWidth: 100 / (getTrainWidth(obj) / 100),
							page_no: iidx / obj.portion,
							vis_no: iidx / obj.portion + 1,
							active: '',
							tickets: []
						});
					}
					iidx++;
				}

				var idx = 0;

				for (var j = 0; j < obj.length; j++) {
					var t = obj[j];
					var pIdx = Math.floor(idx / obj.portion);

					pages[pIdx].tickets.push({
						ticketId: t.order_ticket_id,
						place: t.place,
						print_status_ru: t.print_status_ru,
						bso: t.sca
					});

					idx++;
				}

				return pages;
			}


			console.log(tickets.blank_types);

			for (var i in tickets.blank_types) {
				var bt = tickets.blank_types[i];
				if (typeof bt !== 'object') {
					continue;
				}
				mO.tabs.push({
					opened: (iter == 0) ? 'opened' : '',
					dataitem: i,
					name: i,
					tab_title: i
				});
				mO.tabContents.push({
					opened: (iter == 0) ? 'opened' : '',
					dataitem: i,
					ticketsCount: bt.length,
					trainWidth: getTrainWidth(bt),
					pages: getPagesObject(bt),
					pagesCount: getPagesObject(bt).length
				});
				iter++;
			}


			console.log('MUS', mO);

			container.html(Mustache.to_html(tpl, mO));

			uiTabs();

			if (typeof cb == 'function') {
				cb();
			}
			tickets.setHandlers();
		},
		renderTicket: function (id) {
			var tpl = '<li data-id="{{order_ticket_id}}">' +
				'<div class="printStack-ticket-insert">' +
				'<i class="fa fa-mail-forward"></i>' +
				'</div>' +
				'<div class="printStack-ticket-place">{{place}}</div>' +
				'<div class="printStack-ticket-status">' +
				'<i class="statusIcon fa fa-spin fa-spinner" style="display:{{spinner_display}};"></i>  {{print_status_ru}}' +
				'</div>' +
				'<div class="printStack-ticket-bso">{{sca}}</div>' +
				'</li>';
			var o = tickets.getItem({order_ticket_id: id});
			var toReplaceTicket = contentWrapper.find('.printStack-tickets-list li[data-id="' + id + '"]');

			toReplaceTicket.replaceWith(Mustache.to_html(tpl, o));
			console.log(o, toReplaceTicket);
			tickets.setHandlers();

		},
		setHandlers: function (callback) {
//            var pis = contentWrapper.find('.printStack-pagination li');
			var tis = contentWrapper.find('.printStack-tickets-list li');
			var printBtn = contentWrapper.find('.print_next_btn');
			var pauseBtn = contentWrapper.find('.pause_btn');
			var CancelAllBTN = contentWrapper.find('.cancel_all_btn');
			var CancelAllTicketsBTN = contentWrapper.find('.cancel_all_tickets_btn');

//            pis.off('click').on('click', function(){
//                var self = $(this);
//                if($(this).hasClass('active')){
//                    return;
//                }
//                var tab = $(this).parents('.printStack-tab');
//                var train = tab.find('.printStack-tickets-pages-train');
//                var no = parseInt($(this).data('no'));
//
//                train.animate({
//                    marginLeft: '-'+ (no*100) + '%'
//                }, 350, function(){
//                    tab.find('.printStack-pagination li').removeClass('active');
//                    self.addClass('active');
//                });
//            });
			tis.off('click').on('click', function () {
				var self = $(this);
				var tab = $(this).parents('.printStack-tab');
				var train = tab.find('.printStack-tickets-pages-train');
				var ticketId = $(this).data('id');
				console.log('click on row № ' + ticketId);
			});
            tis.off('contextmenu').on('contextmenu', function () {
                var id = $(this).data('id');
                var ticket = tickets.getItem({order_ticket_id:id});
                var contextmenu1 = MB.Core.contextMenu.init(undefined, {
                    /*position:{
                     x:1,
                     y:1
                     },*/
                    items: [
                        {
                            title: 'Обновить',
                            iconClass: 'fa-refresh',
                            disabled: false,
                            callback: function (params) {
                                tickets.getFromServer(id,function(res){
                                    for (var i in res) {
                                        var orderTicketId = res[i].order_ticket_id;
                                        tickets.updateItem(res[i],{order_ticket_id: orderTicketId});
                                        tickets.renderTicket(orderTicketId);
                                    }
                                });
                            }
                        },
                        {
                            title: 'Перепечатать',
                            iconClass: 'fa-print',
                            disabled: function(){
                                return !(ticket.print_status == "NOT_PRINTED");
                                //return !(ticket.print_status == "PRINTED");
                            },
                            callback: function (params) {
                                tickets.getFromServer(id,function(res){
                                    for (var i in res) {
                                        var orderTicketId = res[i].order_ticket_id;
                                        tickets.updateItem(res[i],{order_ticket_id: orderTicketId});
                                        tickets.renderTicket(orderTicketId);
                                    }
                                });
                            }
                        },
                        {
                            title: 'Перейти к билету',
                            iconClass: 'fa-barcode',
                            disabled: false,
                            callback: function (params) {

                            }
                        }
                    ]
                });
            });
			$('.printStack-ticket-bso').off('click').on('click', function () {
				tickets.renderTicket($(this).parents('li').data('id'));
			});
			printBtn.off('click').on('click', function () {
				if ($(this).hasClass('disabled')) {
					return;
				}
				$(this).addClass('disabled');

				var type = $(this).data('type');

				if (tickets.blank_types[type].status == 'PRINT_WAIT_NEXT') {
					printQuery({command: 'PRINT_NEXT_PORTION', type: type});
                    nextPage.click();
					//tickets.updateStatus(type);
				}else if (tickets.blank_types[type].status == "PRINT_PAUSED"){
                    printQuery({command: 'PRINT_NEXT_PORTION', type: type});
                }


			});
            pauseBtn.off('click').on('click', function () {
                /*if ($(this).hasClass('disabled')){
                 return;
                 }
                 $(this).addClass('disabled');*/
                var type = $(this).data('type');
                printQuery({command: 'PAUSE_PRINT', type: type});

            });
			CancelAllBTN.off('click').on('click', function () {
				/*if ($(this).hasClass('disabled')){
				 return;
				 }
				 $(this).addClass('disabled');*/
				var type = $(this).data('type');
				printQuery({command: 'CLEAR_NOT_PRINTED_TICKETS', type: type});
			});

			CancelAllTicketsBTN.off('click').on('click', function () {
				/*if ($(this).hasClass('disabled')){
				 return;
				 }
				 $(this).addClass('disabled');*/
				var confirm = prompt('Эта операция очистит очередь печати. Чтобы подтвердить, введите "СОГЛАСЕН"');
				if (confirm == 'СОГЛАСЕН') {
					var type = $(this).data('type');
					printQuery({command: 'CLEAR_NOT_PRINTED_TICKETS'});
				}

			});

			var nextPage = contentWrapper.find('.printStack-pagination-btn.next');
			var prevPage = contentWrapper.find('.printStack-pagination-btn.prev');
			var pageInp = contentWrapper.find('.printStack-pagination-input');


			function pageTo(tab, train, no) {
				var localNo = no - 1;
				train.animate({
					marginLeft: '-' + (localNo * 100) + '%'
				}, 350, function () {
					tab.find('.printStack-pagination li').removeClass('active');
					tickets.tempPage = no;
//                    pageInp.val(tickets.tempPage);
//                    self.addClass('active');
				});
			}

			pageInp.off('change').on('change', function () {
				var tab = $(this).parents('.printStack-tab');
				var train = tab.find('.printStack-tickets-pages-train');
				var no = parseInt($(this).val());
				if (no) {
					pageTo(tab, train, no);
					if (no > tab.find('.printStack-tickets-list li').length / 2) {

					} else {

					}
				}

			});

			nextPage.off('click').on('click', function () {

				var tab = $(this).parents('.printStack-tab');
				var train = tab.find('.printStack-tickets-pages-train');
				var no = parseInt(tickets.tempPage);
				pageInp.val(tickets.tempPage + 1);
				pageInp.trigger('change');
			});

			prevPage.off('click').on('click', function () {
				if (tickets.tempPage == 1) {
					return;
				}

				var tab = $(this).parents('.printStack-tab');
				var train = tab.find('.printStack-tickets-pages-train');
				var no = parseInt(tickets.tempPage);
				pageInp.val(tickets.tempPage - 1);
				pageInp.trigger('change');
			});
            if (typeof callback === 'function'){
                callback();
            }
		}
	};

	contentInstance.setHandlers = tickets.setHandlers;
	contentInstance.updateStatus = tickets.updateStatus;
	contentInstance.addItems = tickets.addItems;
	contentInstance.renderTickets = tickets.renderTickets;
	contentInstance.renderTicket = tickets.renderTicket;
	contentInstance.getItem = tickets.getItem;
	contentInstance.updateItem = tickets.updateItem;
	contentInstance.removeItem = tickets.removeItem;
	contentInstance.setPortion = tickets.setPortion;
}());


//var o  = {command:"get",object:"order_ticket",params:{where:"order_ticket_id in (14657,14655)"}};
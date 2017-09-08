(function () {

	var formID = MB.Forms.justLoadedId;
	var formInstance = MB.Forms.getForm('form_action_ro', formID);
	var formWrapper = $('#mw-' + formInstance.id);
	var goToPay = function () {
		var act = formInstance.data.data[0];
		var actionId = act['ACTION_ID'];

		if (act["ACTION_TYPE"] !== "ACTION_WO_PLACES") {


			//console.log('ACR', act, names);

			var action_label = act['ACTION_NAME'] + " " + act['ACTION_DATE'] + " | " + act['HALL_NAME'];

			MB.Core.switchModal({
				type: "content",
				isNew: true,
				filename: "one_action",
				params: {
					activeId: actionId,
					action_id: actionId,
					title: action_label,
					label: 'Продажа',
					action_name: action_label
				}
			});

//					MB.Core.switchModal({
//						type: "content",
//						filename: "one_action",
//						params: {action_id: actionId, title: action_label, label: 'Продажа', action_name: action_label}
//					});

		} else {

			var o = {
				command: 'get',
				object: 'action_scheme_ticket_zone',
				params: {
					where: 'action_id = ' + actionId
				}
			};
			socketQuery(o, function (res) {
				var data;
				if(!(data = socketParse(res))) return;
				var tpl = '{{#zones}}<div data-id="{{id}}" class="row marTop10 wp-zone-item"><div class="col-md-12"><div class="form-group"><label class="control-label">{{label}} (Осталось билетов: {{max}} стоимость: {{price}})</label><input max="{{max}}" min="0" class="col-md-6 form-control orderTicketCount marTop5" type="number" value=""/></div></div></div>{{/zones}}';
				var mo = {
					zones: []
				};
				for (var i in data) {
					var to = {
						id: data[i]['ACTION_SCHEME_TICKET_ZONE_ID'],
						label: data[i]['NAME'],
						max: data[i]['FREE_TICKET_COUNT'],
						price: data[i]['TICKET_PRICE']
					};
					mo.zones.push(to);
				}
				bootbox.dialog({
					title: 'Выберите входные билеты',
					message: ' ' + Mustache.to_html(tpl, mo),
					buttons: {
						ok: {
							label: "Ок",
							className: "blue",
							callback: function () {
								var o = {
									command: 'operation',
									object: 'create_to_pay_order_without_places',
									action_id: actionId,
									action_scheme_ticket_zone_id: [],
									ticket_count: []
								};
								$('.wp-zone-item').each(function(){
									var t = $(this);
									var id = t.attr('data-id');
									var val = t.find('.orderTicketCount').val();
									if (!val) return;
									o.action_scheme_ticket_zone_id.push(id);
									o.ticket_count.push(val);
								});
								socketQuery(o, function (res) {
									if(!(res = socketParse(res))) return;
									var formId = MB.Core.guid();
									var form = new MB.FormN({
										id: formId,
										name: 'form_order',
										type: 'form',
										ids: [res.order_id]
									});
									form.create(function () {
										var modal = MB.Core.modalWindows.windows.getWindow(formId);
										$(modal).on('close', function () {
											formInstance.reload();
										});

										$(form).on('update', function () {
											formInstance.reload();
										});
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
			});
		}
	};

	formInstance.lowerButtons = [
		{
			title: 'Электронные билеты',
			color: "blue",
			icon: null,
			type: "SINGLE",
			hidden: false,
			condition: [{
				colNames: [],
				matching: [],
				colValues: []
			}],
			handler: function () {
				var id = formInstance.activeId;
				var iFrame;
				var width = MB.Core.getClientWidth();
				var height = MB.Core.getClientHeight();
				$(".create_action_ticket_list_frame").remove();
                var order_by_type = undefined;
                bootbox.dialog({
                    title: 'Сортировка',
                    message: 'Выберите тип сортировки, по покупателю или по сектору, ряду и месту',
                    buttons: {
                        by_user: {
                            label: 'По покупателю',
                            callback: function(){
                                order_by_type = 'user';
                                iFrame = "<iframe class=\"create_action_ticket_list_frame iFrameForPrint\" style=\"display:none;\" src=\"" + "html/report/action_ticket_list/action_ticket_list.html?action_id=" + id + "&order_by_type="+order_by_type+"&where= and status = 'PAID'\" width=\"" + width + "\" height=\"" + height + " \" align=\"left\"></iframe>";
                                $("body").append(iFrame);
                            }
                        },
                        by_place: {
                            label: 'Сектор, ряд, место',
                            callback: function(){
                                order_by_type = 'place';
                                iFrame = "<iframe class=\"create_action_ticket_list_frame iFrameForPrint\" style=\"display:none;\" src=\"" + "html/report/action_ticket_list/action_ticket_list.html?action_id=" + id + "&order_by_type="+order_by_type+"&where= and status = 'PAID'\" width=\"" + width + "\" height=\"" + height + " \" align=\"left\"></iframe>";
                                $("body").append(iFrame);
                            }
                        },
                        error: {
                            label: 'Отмена',
                            callback: function(){

                            }
                        }
                    }
                });


			}
		},
        {
            title: 'Эл. Услуги',
            color: "blue",
            icon: null,
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: [],
                matching: [],
                colValues: []
            }],
            handler: function () {
                var id = formInstance.activeId;
                var iFrame;
                var width = MB.Core.getClientWidth();
                var height = MB.Core.getClientHeight();
                $(".create_web_service_ticket_list_frame").remove();
                var order_by_type = undefined;

                bootbox.dialog({
                    title: 'Сортировка',
                    message: 'Выберите тип сортировки, по покупателю или по сектору, ряду и месту',
                    buttons: {
                        by_user: {
                            label: 'По покупателю',
                            callback: function(){
                                order_by_type = 'user';
                                iFrame = "<iframe class=\"create_web_service_ticket_list_frame iFrameForPrint\" style=\"display:none;\" src=\"" + "html/report/action_web_service_list/action_web_service_list.html?action_id=" + id + "&order_by_type="+order_by_type+"&where= and status = 'PAID'\" width=\"" + width + "\" height=\"" + height + " \" align=\"left\"></iframe>";
                                $("body").append(iFrame);
                            }
                        },
                        by_place: {
                            label: 'Сектор, ряд, место',
                            callback: function(){
                                order_by_type = 'place';
                                iFrame = "<iframe class=\"create_web_service_ticket_list_frame iFrameForPrint\" style=\"display:none;\" src=\"" + "html/report/action_web_service_list/action_web_service_list.html?action_id=" + id + "&order_by_type="+order_by_type+"&where= and status = 'PAID'\" width=\"" + width + "\" height=\"" + height + " \" align=\"left\"></iframe>";
                                $("body").append(iFrame);
                            }
                        },
                        error: {
                            label: 'Отмена',
                            callback: function(){

                            }
                        }
                    }
                });


            }
        },
		{
			title: 'Все билеты',
			color: "blue",
			icon: null,
			type: "SINGLE",
			hidden: false,
			condition: [{
				colNames: [],
				matching: [],
				colValues: []
			}],
			handler: function () {
				var id = formInstance.activeId;
				var iFrame;
				var width = MB.Core.getClientWidth();
				var height = MB.Core.getClientHeight();
				$(".create_action_ticket_list_frame").remove();
				var where = " and status IN ('PAID','CLOSED','ON_REALIZATION','CLOSED_REALIZATION')";

                var order_by_type = undefined;
                bootbox.dialog({
                    title: 'Сортировка',
                    message: 'Выберите тип сортировки, по покупателю или по сектору, ряду и месту',
                    buttons: {
                        by_user: {
                            label: 'По покупателю',
                            callback: function(){
                                order_by_type = 'user';
                                iFrame = "<iframe class=\"create_action_ticket_list_frame iFrameForPrint\" style=\"display:none;\" src=\"" + "html/report/action_ticket_list/action_ticket_list.html?action_id=" + id + "&order_by_type="+order_by_type+"&where=" + where + "\" width=\"" + width + "\" height=\"" + height + " \" align=\"left\"></iframe>";
                                $("body").append(iFrame);
                            }
                        },
                        by_place: {
                            label: 'Сектор, ряд, место',
                            callback: function(){
                                order_by_type = 'place';
                                iFrame = "<iframe class=\"create_action_ticket_list_frame iFrameForPrint\" style=\"display:none;\" src=\"" + "html/report/action_ticket_list/action_ticket_list.html?action_id=" + id + "&order_by_type="+order_by_type+"&where=" + where + "\" width=\"" + width + "\" height=\"" + height + " \" align=\"left\"></iframe>";
                                $("body").append(iFrame);
                            }
                        },
                        error: {
                            label: 'Отмена',
                            callback: function(){

                            }
                        }
                    }
                });


			}
		},
        {
            title: 'Все Услуги',
            color: "blue",
            icon: null,
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: [],
                matching: [],
                colValues: []
            }],
            handler: function () {
                var id = formInstance.activeId;
                var iFrame;
                var width = MB.Core.getClientWidth();
                var height = MB.Core.getClientHeight();
                $(".create_all_service_ticket_list_frame").remove();
                var where = " and status IN ('PAID','CLOSED','ON_REALIZATION','CLOSED_REALIZATION')";
                var order_by_type = undefined;

                bootbox.dialog({
                    title: 'Сортировка',
                    message: 'Выберите тип сортировки, по покупателю или по сектору, ряду и месту',
                    buttons: {
                        by_user: {
                            label: 'По покупателю',
                            callback: function(){
                                order_by_type = 'user';
                                iFrame = "<iframe class=\"create_action_all_service_list_frame iFrameForPrint\" style=\"display:none;\" src=\"" + "html/report/action_all_service_list/action_all_service_list.html?action_id=" + id + "&order_by_type="+order_by_type+"&where=" + where + "\" width=\"" + width + "\" height=\"" + height + " \" align=\"left\"></iframe>";
                                $("body").append(iFrame);
                            }
                        },
                        by_place: {
                            label: 'Сектор, ряд, место',
                            callback: function(){
                                order_by_type = 'place';
                                iFrame = "<iframe class=\"create_action_all_service_list_frame iFrameForPrint\" style=\"display:none;\" src=\"" + "html/report/action_all_service_list/action_all_service_list.html?action_id=" + id + "&order_by_type="+order_by_type+"&where=" + where + "\" width=\"" + width + "\" height=\"" + height + " \" align=\"left\"></iframe>";
                                $("body").append(iFrame);
                            }
                        },
                        error: {
                            label: 'Отмена',
                            callback: function(){

                            }
                        }
                    }
                });



            }
        },
		{
			title: 'Перейти к продаже',
			color: "green",
			icon: null,
			type: "SINGLE",
			hidden: false,
			condition: [{
				colNames: [],
				matching: [],
				colValues: []
			}],
			handler: goToPay
		}
	];

	formWrapper.find('.mw-save-form').hide(0);

	var hallAddrWrapper = formWrapper.find('.form-ro-get-hall-address');
	var hallId = hallAddrWrapper.data('hall_id');
	if (hallId.toString().length > 0) {
		var o = {
			command: 'get',
			object: 'hall',
			params: {
				where: 'HALL_ID = ' + hallId
			}
		};
		socketQuery(o, function (res) {
			if(!(res = socketParse(res))) return;
			var addr = res[0]['ADDR'];
			hallAddrWrapper.html('( ' + addr + ' )');
		});
	}

	for (var i = 0; i < formWrapper.find('.form-ro-value').length; i++) {
		var item = formWrapper.find('.form-ro-value').eq(i);
		if (item.html() == '') {
			item.html(' - ');
		}
	}


//    var defaultImagePath = 'assets/img/default-action-image.png';
//    var posterImageWrapper = formWrapper.find('.posterImageWrapper');
//    var imageUrl = (posterImageWrapper.find('img').attr('data-image') == '')? defaultImagePath : 'upload/'+posterImageWrapper.find('img').attr('data-image');
//    var imageName = (posterImageWrapper.find('img').attr('data-image') == '')? 'Постер мероприятия': posterImageWrapper.find('img').attr('data-image');
//
//    posterImageWrapper.find('img').attr('src', imageUrl);
//    posterImageWrapper.find('.fn-field-image-name').html(imageName);


})();
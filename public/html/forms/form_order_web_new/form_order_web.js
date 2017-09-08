(function () {
	var modal = $('.mw-wrap').last();
	var formID = modal.attr('id').substr(3);
	var formInstance = MB.Forms.getForm('form_order_web', formID);
	var formWrapper = $('#mw-' + formInstance.id);

	var tableTicketsID = formWrapper.find('.classicTableWrap').eq(0).attr('data-id');
	var tableTicketsInstance = MB.Tables.getTable(tableTicketsID);

    var tableServicesID = formWrapper.find('.classicTableWrap').eq(1).attr('data-id');
    var tableServicesInstance = MB.Tables.getTable(tableServicesID);

    function countReservedServices(){
        var res = 0;
        var totalAmount = 0;
        for(var i in tableServicesInstance.data.data){
            var s = tableServicesInstance.data.data[i];
            if(s.STATUS == 'RESERVED' || s.STATUS == 'TO_PAY'){
                res ++;
                totalAmount += parseFloat(s.PRICE);
            }
        }
        formWrapper.find('.reserved-services-total-amount').html(totalAmount + ' руб.');
        return res;
    }

    if(countReservedServices() > 0){
        formWrapper.find('.pay-reserved-services').removeClass('disabled');
    }else{
        formWrapper.find('.pay-reserved-services').addClass('disabled');
    }

	formWrapper.find('.mw-save-form').hide(0);

	formInstance.lowerButtons = [
		{
			title: 'Печать',
			color: "blue",
			icon: "fa-print",
			type: "SINGLE",
			hidden: false,
			condition: [{
				colNames: [],
				matching: [],
				colValues: []
			}],
			handler: function () {

			}
		},
		{
			title: 'Вернуть заказ',
			color: "red",
			icon: 'fa-times',
			type: "SINGLE",
			hidden: false,
			condition: [
				{
					colNames: ['COUNT_PAID_TICKETS'],
					matching: ['>'],
					colValues: [0]
				}
			],
			revert: true,
			handler: function () {
				bootbox.dialog({
					message: "Вы уверены, что хотите отменить заказ?",
					title: "Внимание!",
					buttons: {
						yes_btn: {
							label: "Да, уверен",
							className: "green",
							callback: function () {
								formInstance.makeOperation('return_order_web');
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
			title: 'Отменить заказ',
			color: "red",
			icon: 'fa-times',
			type: "SINGLE",
			hidden: false,
			condition: [
				{
					colNames: ['COUNT_RESERVED_TICKETS'],
					matching: ['>'],
					colValues: [0]
				}
			],
			revert: true,
			handler: function () {
				bootbox.dialog({
					message: "Вы уверены, что хотите отменить заказ?",
					title: "Внимание!",
					buttons: {
						yes_btn: {
							label: "Да, уверен",
							className: "green",
							callback: function () {
								formInstance.makeOperation('cancel_web_order');
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
			title: 'Повторная отмена оплаты по заказу',
			color: "blue",
			type: "SINGLE",
			hidden: false,
			condition: [
				{
					colNames: ['COUNT_PAYMENT_NOT_RETURNED'],
					matching: ['>'],
					colValues: [0]
				}
			],
			revert: true,
			handler: function () {
				bootbox.dialog({
					message: "Вы уверены, что хотите отменить билет?",
					title: "Внимание!",
					buttons: {
						yes_btn: {
							label: "Да, уверен",
							className: "green",
							callback: function () {
								formInstance.makeOperation('return_payment_web_order');
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
			title: 'Выставить стаус оплаты на Оплата возвращена',
			color: "blue",
			type: "SINGLE",
			hidden: false,
			condition: [{
				colNames: ['COUNT_PAYMENT_NOT_RETURNED'],
				matching: ['>'],
				colValues: [0]
			}],
			revert: true,
			handler: function () {
				formInstance.makeOperation('set_web_order_payment_status_return');
			}
		},
		{
			title: 'Выставить статус с "Необходима ручная отмена" на "Возвращен"',
			color: "blue",
			type: "SINGLE",
			hidden: false,
			condition: [{
				colNames: ['COUNT_NEED_CANCEL'],
				matching: ['>'],
				colValues: [0]
			}],
			revert: true,
			handler: function () {
				formInstance.makeOperation('set_order_return_from_need_cancel');
			}
		}
	];

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
            tableServicesInstance.reload(function(){
                if(countReservedServices() > 0){
                    formWrapper.find('.pay-reserved-services').removeClass('disabled');
                }else{
                    formWrapper.find('.pay-reserved-services').addClass('disabled');
                }
            });
        });
    });

	var asmId = MB.Core.guid();

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
				for(var i in tableTicketsInstance.data.data){
					var t = tableTicketsInstance.data.data[i];
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

            for(var i in tableTicketsInstance.data.data){
                var ticket = tableTicketsInstance.data.data[i];
                var action_id = ticket['ACTION_ID'];
                var plcGrpId = ticket['ADDITIONAL_SERVICE_GROUP_ID'];
                var status = ticket['STATUS'];
                if(action_id == act_id && status == 'PAID'){
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
            for(var i in tableTicketsInstance.data.data){
                var ticket = tableTicketsInstance.data.data[i];
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

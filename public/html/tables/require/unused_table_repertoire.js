(function () {
	var tableNId = $('.page-content-wrapper .classicTableWrap').data('id');
	var tableInstance = MB.Tables.getTable(tableNId);
	tableInstance.ct_instance.ctxMenuData = [
		{
			name: 'option2',
			title: 'Перейти к продаже',
			disabled: function () {
				return false;
			},
			callback: function () {
				var sel = tableInstance.ct_instance.getIndexesByData(true);
				var act = tableInstance.data.data[sel];
				var actionId = act['ACTION_ID'];
				if (act["ACTION_TYPE"] !== "ACTION_WO_PLACES") {

					var field_num = 'ACTION_NAME';
					var action_date = 'ACTION_DATE';
					var hallIndex = 'HALL_NAME';


					var action_label = act[field_num] + " " + act[action_date] + " | " + act[hallIndex];

					MB.Core.switchModal({
						type: "content",
						isNew: true,
						filename: "one_action",
						params: {
							activeId: actionId,
							action_id: actionId,
							action: act,
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
						if (!(res = socketParse(res))) return;

						var tpl = '{{#zones}}<div data-id="{{id}}" class="row marTop10 wp-zone-item"><div class="col-md-12"><div class="form-group"><label class="control-label">{{label}} (Осталось билетов: {{max}} стоимость: {{price}})</label><input max="{{max}}" min="0" class="col-md-6 form-control orderTicketCount marTop5" type="number" value=""/></div></div></div>{{/zones}}';
						var mo = {
							zones: []
						};
						for (var i in res) {
							var it = res[i];
							var to = {
								id: it['ACTION_SCHEME_TICKET_ZONE_ID'],
								label: it['NAME'],
								max: it['FREE_TICKET_COUNT'],
								price: it['TICKET_PRICE']
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
													tableInstance.reload();
												});

												$(form).on('update', function () {
													tableInstance.reload();
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
			}
		},
		{
			name: 'option1',
			title: 'Открыть в форме',
			disabled: function () {
				return false;
			},
			callback: function () {
				tableInstance.openRowInModal();
			}
		},
		{
			name: 'option3',
			title: 'Показать по зонам',
			disabled: function () {
				return true;
			},
			callback: function () {
				var selArr = tableInstance.ct_instance.getIndexesByData();
			}
		}
	];

    var rr = {
        selRanges:  undefined,
        years:      undefined,
        tabs:       undefined,
        currRange:  undefined,
        rSel:       undefined,
        ySel:       undefined,
        year:       undefined,

        init: function(){
            rr.getCurrRange();
            rr.getData(function(){
                rr.render();
                rr.setHandlers();
            });
        },
        getCurrRange: function(){
            var inLs = localStorage.getItem('mb-rep-range');
            if(inLs !== null){
                rr.currRange = inLs;
            }else{
                localStorage.setItem('mb-rep-range', 30);
                rr.currRange = 30;
            }
        },
        getData: function(cb){
            socketQuery({
                command: 'get',
                object: 'action_range'
            }, function(r){
                rr.selRanges = socketParse(r);
                socketQuery({
                    command: 'get',
                    object: 'actions_for_sale_year_list'
                }, function(r2){
                    rr.years = socketParse(r2);

//                    console.log('RANGE', rr.currRange);

                    var o = {
                        command: 'get',
                        object: 'actions_for_sale_range',
                        params: {
                            range_days: rr.currRange
                        }
                    };

                    console.log('AAA', rr.year);

                    if(rr.year){
                        o.params.year = rr.year;
                    }
                    socketQuery(o , function(res){
                        rr.tabs = socketParse(res);
                        rr.year = rr.tabs.year;
                        if(typeof cb == 'function'){
                            cb();
                        }
                    });
                });
            });
        },
        render: function(){
            var tpl = '<div class="rep-ranges-wrapper">' +
                '<div class="rr-sel-wrapper"><div class="rr-sel-title">Диапазон:</div><select data-absolute="true" class="select3 rr-ranges-sel">{{#ranges}}<option {{selected}} value="{{DB_VALUES}}">{{CLIENT_VALUES}}</option>{{/ranges}}</select></div>' +
                '<div class="rr-year-wrapper"><div class="rr-sel-title">Год:</div><select data-absolute="true" class="select3 rr-years-sel">{{#years}}<option {{selected}} value="{{YEAR}}">{{YEAR_TITLE}}</option>{{/years}}</select></div>' +
                '<div class="rr-list-overflow-wrapper">' +
                '<div class="rep-train" style="width: {{slideWidth}}">' +
                '<div class="rr-list-wrapper" data-shift="0">' +
                '{{#rr-items}}<div class="rr-item-wrapper" data-from="{{FROM_DATE}}" data-to="{{TO_DATE}}"><div class="rr-item-under"></div><div class="rr-item-title">{{{TAB_TITLE}}}</div></div>{{/rr-items}}' +
                '</div>' +
                '</div>' +
                '</div>' +
                '<div class="rep-left-shadow"><i class="fa fa-arrow-circle-o-left"></i></div>' +
                '<div class="rep-right-shadow"><i class="fa fa-arrow-circle-o-right"></i></div>' +
                '</div>';

            var mO = {};

            mO['ranges'] =      rr.selRanges;
            mO['years'] =       rr.years;
            mO['rr-items'] =    rr.tabs;
            mO['slideWidth'] =  rr.tabs.length * 107 + 'px';


//            console.log(rr.tabs, rr.tabs.length * 107 + 'px');

            var rSelVal = {};
            var ySelVal = {};

            for(var i in mO.ranges){

                if(mO.ranges[i].DB_VALUES == rr.currRange){
                    rSelVal.id = mO.ranges[i].DB_VALUES;
                    rSelVal.name = mO.ranges[i].CLIENT_VALUES;
//                    mO.ranges[i]['selected'] = 'selected';
                }
            }

            for(var k in mO.years){

                if(mO.years[k].YEAR == rr.year){
                    ySelVal.id = mO.years[k].YEAR;
                    ySelVal.name = mO.years[k].YEAR_TITLE;
//                    mO.years[k]['selected'] = 'selected';
                }
            }



            tableInstance.wrapper.find('.ct-environment-wrapper').after(Mustache.to_html(tpl, mO));

            rr.rSel = $('.rr-ranges-sel').select3();
            rr.ySel = $('.rr-years-sel').select3();

            rr.rSel.value = rSelVal;
            rr.ySel.value = ySelVal;

            rr.rSel.setValue();
            rr.ySel.setValue();

            for(var i=tableInstance.wrapper.find('.rr-item-wrapper').length; i>-1; i-- ){
                tableInstance.wrapper.find('.rr-item-wrapper').eq(i).css('zIndex',900-i);
                tableInstance.wrapper.find('.rr-item-wrapper').eq(i).find('.rr-item-under').css('zIndex',100-i);
                tableInstance.wrapper.find('.rr-item-wrapper').eq(i).find('.rr-item-title').css('zIndex',101-i);
            }
        },
        setHandlers: function(){
            var tabs = tableInstance.wrapper.find('.rr-item-wrapper');
            var ml = tableInstance.wrapper.find('.rep-left-shadow');
            var mr = tableInstance.wrapper.find('.rep-right-shadow');
            var train = tableInstance.wrapper.find('.rr-list-wrapper');
            var vis = tableInstance.wrapper.find('.rr-list-overflow-wrapper');

            var inAnimate = false;
            tabs.off('click').on('click', function(){
                var from = $(this).data('from');
                var to = $(this).data('to');
                tabs.removeClass('active');
                $(this).addClass('active');

                var wObj = {
                    name: 'ACTION_DATE',
                    value: {from: from, to: to},
                    type: 'daterange'
                };
                tableInstance.ct_instance.addWhere(wObj);
                tableInstance.reload()
            });

            $(rr.rSel).off('changeVal').on('changeVal', function(e, was, now){
                rr.reinit();
            });

            $(rr.ySel).off('changeVal').on('changeVal', function(e, was, now){
                rr.year = now.id;
                rr.reinit();
            });


            function hideArrows(){
                ml.show();
                mr.show();
                var curShift = parseInt(train.data('shift'));
                var oiw = tableInstance.wrapper.find('.rr-item-wrapper').eq(0).width();
                var delta = Math.floor(vis.width() / oiw);
                if(curShift == 0){
                    ml.hide();
                }
                if(((Math.abs(curShift) / oiw) + delta ) == tabs.length || tabs.length < delta){
                    mr.hide();
                }

            }

            mr.off('click').on('click', function(){
//                if(inAnimate){return false;}
//                inAnimate = true;
                var oiw = tableInstance.wrapper.find('.rr-item-wrapper').eq(0).width();
                var curShift = parseInt(train.data('shift'));
                var delta = Math.floor(vis.width() / oiw);
                if(((Math.abs(curShift) / oiw) + delta ) == tabs.length || tabs.length < delta){
                    inAnimate = false;
                    return false;
                }
                train.data('shift', +curShift - oiw);
                hideArrows();
                train.animate({
                    marginLeft: +curShift - oiw + 'px'
                },{
                    queue: false,
                    duration: 150,
                    complete: function(){
//                        inAnimate = false;
                    }
                });
                console.log(curShift);
            });

            ml.off('click').on('click', function(){
//                if(inAnimate){return false;}
//                inAnimate = true;
                var oiw = tableInstance.wrapper.find('.rr-item-wrapper').eq(0).width();
                var curShift = parseInt(train.data('shift'));
                if(curShift == 0){
                    return false;
                }
                train.data('shift', +curShift + oiw);
                hideArrows();
                train.animate({
                    marginLeft: +curShift + oiw + 'px'
                },{
                    queue: false,
                    duration: 150,
                    complete: function(){
//                        inAnimate = false;
                    }
                });
                console.log(curShift);
            });

            vis.on('mousewheel', function(event){
                var dir = (event.originalEvent.deltaY == 100)? 'down': 'up';
                var curShift = parseInt(train.data('shift'));
                var oiw = tableInstance.wrapper.find('.rr-item-wrapper').eq(0).width();
                var delta = Math.floor(vis.width() / oiw);
                var moveVal = (dir == 'up')? +curShift + oiw : +curShift - oiw;

                if(dir == 'up' && curShift == 0){
                    return false;
                }

                if(dir == 'down' && ((Math.abs(curShift) / oiw) + delta ) == tabs.length || tabs.length < delta){
                    return false;
                }

                train.data('shift', moveVal);
                hideArrows();
                train.animate({
                    marginLeft: moveVal + 'px'
                },{
                    queue: false,
                    duration: 150
                });

                console.log(dir);
            });

            hideArrows();
        },
        reinit: function(){
            localStorage.setItem('mb-rep-range', rr.rSel.value.id);
            rr.getCurrRange();
            rr.getData(function(){
                tableInstance.wrapper.find('.rep-ranges-wrapper').remove();
                rr.render();
                rr.setHandlers();
            });
        }

    };

    rr.init();

}());
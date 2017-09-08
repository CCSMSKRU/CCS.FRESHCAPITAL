(function () {
	var tableNId = $('.page-content-wrapper .classicTableWrap').data('id');
	var tableInstance = MB.Tables.getTable(tableNId);

	tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option1',
            title: 'Открыть в форме',
            disabled: function(){
                return false;
            },
            callback: function(){
                tableInstance.openRowInModal();
            }
        },
		{
			name: 'option2',
			title: 'Вернуть бланки БСО',
			disabled: function () {
				var c = tableInstance.ct_instance.isDisabledCtx({
					col_names: ['STATUS'],
					matching: ['equal'],
					col_values: ['ISSUED']
				});

				return !~c.indexOf(true);
				//ISSUED
			},
			callback: function () {
				tableInstance.makeOperation('return_ticket_pack', function () {

				});
			}
		},
        {
            name: 'option3',
            title: 'Снова выдать',
            disabled: function () {
                var c = tableInstance.ct_instance.isDisabledCtx({
                    col_names: ['STATUS'],
                    matching: ['equal'],
                    col_values: ['RETURNED']
                });

                return !~c.indexOf(true);
                //ISSUED
            },
            callback: function () {
                tableInstance.makeOperation('issue_ticket_pack', function () {

                });
            }
        }
	];

	(function () {
		var beforeBtn = tableInstance.wrapper.find('.ct-btn-create-inline');
		var btnHtml = '<li class="ct-environment-btn add_few_blanks"><div class="nb btn btnDouble green"><i class="fa fa-plus"></i><div class="btnDoubleInner">Добавить несколько комплектов бланков</div></div></li>';
		beforeBtn.before(btnHtml);
		var addFew = tableInstance.wrapper.find('.add_few_blanks');
		var modalHtml = '<div class="row form-body">' +
			'<div class="padder5">' +
			'<label class="wid100pr">Тип Бланков' +
			'<select class="MEselect2 labelSettingControl form-control" data-id="ticket_pack_type"></select>' +
			'</label>' +
			'</div>' +
			'<div class="padder5">' +
			'<label class="wid100pr">Серия' +
			'<input type="text" class="form-control bigInput marBot10 " placeholder="" data-id="sca_series"/>' +
			'</label>' +
			'</div>' +
			'<div class="padder5">' +
			'<label class="wid100pr">Начальный №' +
			'<input type="text" class="form-control bigInput marBot10 " placeholder="" data-id="start_no"/>' +
			'</label>' +
			'</div>' +
			'<div class="padder5">' +
			'<label class="wid100pr">Кол-во комплектов' +
			'<input type="text" class="form-control bigInput marBot10 " placeholder="" data-id="packs_no"/>' +
			'</label>' +
			'</div>' +
			'<div class="padder5">' +
			'<label class="wid100pr">Кол-во в комплекте' +
			'<input type="text" class="form-control bigInput marBot10 " placeholder="" data-id="ticket_in_pack"/>' +
			'</label>' +
			'</div>' +
			'</div>';

		addFew.off('click').on('click', function () {
			bootbox.dialog({
				message: modalHtml,
				title: "Добавить несколько комплектов бланков",
				buttons: {
					success: {
						label: "Добавить",
						className: "green",
						callback: function () {
							var controls = {
								ticket_pack_type: $('select[data-id="ticket_pack_type"]'),
								sca_series: $('input[data-id="sca_series"]'),
								start_no: $('input[data-id="start_no"]'),
								packs_no: $('input[data-id="packs_no"]'),
								ticket_in_pack: $('input[data-id="ticket_in_pack"]')
							};
							var paramsObject = {
								ticket_pack_type: controls.ticket_pack_type.val(),
								sca_series: controls.sca_series.val(),
								start_no: controls.start_no.val(),
								packs_no: controls.packs_no.val(),
								ticket_in_pack: controls.ticket_in_pack.val()
							};

							console.log(controls.ticket_pack_type.val());

							socketQuery({
								command: "operation",
								object: "add_batch_ticket_pack",
								params: paramsObject
							}, function (res) {
								socketParse(res);
								instance.reload("data");
							});
						}
					},
					error: {
						label: "Отмена",
						className: "red",
						callback: function () {

						}
					}
				}
			});

			var controls = {
				ticket_pack_type: $('select[data-id="ticket_pack_type"]'),
				sca_series: $('input[data-id="sca_series"]'),
				start_no: $('input[data-id="start_no"]'),
				packs_no: $('input[data-id="packs_no"]'),
				ticket_in_pack: $('input[data-id="ticket_in_pack"]')
			};

			socketQuery({
				command: "get",
				object: "ticket_pack_type"
			}, function (res) {
				if (res = socketParse(res)) {
					var optHtml = '';
					for (var i in res) {
						var item = res[i];
						var value = item["TICKET_PACK_TYPE"];
						var title = item["NAME"];
						optHtml += '<option value="' + value + '">' + title + '</option>';
					}
					controls.ticket_pack_type.html(optHtml).select2();
				}
			});
			controls.start_no.val('1');
			controls.packs_no.val('1');
			controls.ticket_in_pack.val('1000');
		});
	}());

}());


//(function () {
//    return;
//    var sid = MB.User.sid;
//    var instance = MB.O.tables["table_ticket_pack"];
//    instance.custom = function (callback) {
//        var handsontableInstance = instance.$container.find(".handsontable").handsontable("getInstance");
//        var beforeBtn = instance.$container.find('.duplicate_button');
//        var btnHtml = '<a href="#" class="btn btn-primary add_few_blanks"> <i class="fa fa-file-text-o"></i> Добавить несколько комплектов бланков</a>';
//        beforeBtn.before(btnHtml);
//        var addFew = instance.$container.find('.add_few_blanks');
//        var modalHtml = '<div class="row form-body">' +
//                            '<div class="padder5">'+
//                                '<label class="wid100pr">Тип Бланков'+
//                                    '<select class="MEselect2 labelSettingControl form-control" data-id="ticket_pack_type"></select>'+
//                                '</label>'+
//                            '</div>'+
//                            '<div class="padder5">'+
//                            '<label class="wid100pr">Серия'+
//                            '<input type="text" class="form-control bigInput marBot10 " placeholder="" data-id="sca_series"/>'+
//                            '</label>'+
//                            '</div>'+
//                            '<div class="padder5">'+
//                            '<label class="wid100pr">Начальный №'+
//                            '<input type="text" class="form-control bigInput marBot10 " placeholder="" data-id="start_no"/>'+
//                            '</label>'+
//                            '</div>'+
//                            '<div class="padder5">'+
//                            '<label class="wid100pr">Кол-во комплектов'+
//                            '<input type="text" class="form-control bigInput marBot10 " placeholder="" data-id="packs_no"/>'+
//                            '</label>'+
//                            '</div>'+
//                            '<div class="padder5">'+
//                            '<label class="wid100pr">Кол-во в комплекте'+
//                            '<input type="text" class="form-control bigInput marBot10 " placeholder="" data-id="ticket_in_pack"/>'+
//                            '</label>'+
//                            '</div>'+
//                        '</div>';
//
//        addFew.on('click', function(){
//            bootbox.dialog({
//                message: modalHtml,
//                title: "Добавить несколько комплектов бланков",
//                buttons: {
//                    success: {
//                        label: "Добавить",
//                        className: "green",
//                        callback:function(){
//                            var controls ={
//                                ticket_pack_type: $('select[data-id="ticket_pack_type"]'),
//                                sca_series: $('input[data-id="sca_series"]'),
//                                start_no: $('input[data-id="start_no"]'),
//                                packs_no: $('input[data-id="packs_no"]'),
//                                ticket_in_pack: $('input[data-id="ticket_in_pack"]')
//                            };
//                            var paramsObject = {
//                                ticket_pack_type:   controls.ticket_pack_type.val(),
//                                sca_series:         controls.sca_series.val(),
//                                start_no:           controls.start_no.val(),
//                                packs_no:           controls.packs_no.val(),
//                                ticket_in_pack:     controls.ticket_in_pack.val()
//                            };
//
//                            console.log(controls.ticket_pack_type.val());
//
//                            MB.Core.sendQuery({
//                                command: "operation",
//                                object: "add_batch_ticket_pack",
//                                sid: MB.User.sid,
//                                params: paramsObject
//                            }, function(res){
//                                toastr[res.TOAST_TYPE](res.MESSAGE);
//                                instance.reload("data");
//                            });
//                        }
//                    },
//                    error: {
//                        label: "Отмена",
//                        className: "red",
//                        callback:function(){
//
//                        }
//                    }
//                }
//            });
//
//            var controls ={
//                ticket_pack_type: $('select[data-id="ticket_pack_type"]'),
//                sca_series: $('input[data-id="sca_series"]'),
//                start_no: $('input[data-id="start_no"]'),
//                packs_no: $('input[data-id="packs_no"]'),
//                ticket_in_pack: $('input[data-id="ticket_in_pack"]')
//            };
//
//            MB.Core.sendQuery({
//                command: "get",
//                object: "ticket_pack_type",
//                sid: MB.User.sid
//            }, function(res){
//                var optHtml = '';
//                for(var i in res.DATA){
//                    var item = res.DATA[i];
//                    var value = item[res.NAMES.indexOf("TICKET_PACK_TYPE")];
//                    var title = item[res.NAMES.indexOf("NAME")];
//                    optHtml += '<option value="'+value+'">'+title+'</option>';
//                }
//                controls.ticket_pack_type.html(optHtml).select2();
//            });
//            controls.start_no.val('1');
//            controls.packs_no.val('1');
//            controls.ticket_in_pack.val('1000');
//        });
//        if(typeof callback == "function"){
//            callback();
//        }
//
//        handsontableInstance.updateSettings({contextMenu: false});
//        handsontableInstance.updateSettings({
//            contextMenu: {
//                callback: function(key, options) {
//                    var arr, data, handsontableInstance, i, value, _i, _len;
//                    switch(key){
//                        case "openInModal":
//                            MB.Table.createOpenInModalContextMenuItem(instance, key, options);
//                            break;
//                        case "printDeliveryNote":
//                            $('.iFrameForPrint').remove();
//                            var handsontableInstance = instance.$container.find(".handsontable").handsontable("getInstance");
//                            var selectedRows = MB.Table.getSelectedRowsInterval(handsontableInstance);
//                            var row_num = selectedRows[0];
//                            var delivery_note = instance.data.data[row_num][instance.data.names.indexOf("DELIVERY_NOTE")];
//
//                            var getStr = "?sid=" + MB.User.sid+"&delivery_note="+delivery_note+"&subcommand=delnote_ticket_pack";
//                            var iFrame = "<iframe class=\"iFrameForPrint\" src=\"" + "html/report/print_report.html" + getStr + "\" width=\"0\" height=\"0\" align=\"left\"></iframe>";
//                            $("body").append(iFrame);
//                            break;
//                    }
//                },
//                items: {
//                    openInModal: {
//                        name: "Открыть в форме...",
//                        disabled: true
//                    },
//                    printDeliveryNote: {
//                        name: "Напечатать наклдную"
//                    }
//                }
//            }
//        });
//
//        callback();
//    };
//}());


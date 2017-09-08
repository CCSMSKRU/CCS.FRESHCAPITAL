(function () {

	var formID = MB.Forms.justLoadedId;
	var formInstance = MB.Forms.getForm('form_action', formID);
	var formWrapper = $('#mw-' + formInstance.id);

	var modalInstance = MB.Core.modalWindows.windows.getWindow(formID);
	modalInstance.stick = 'top';
	modalInstance.stickModal();

    formInstance.lowerButtons = [
        {
            title: 'Создать схему мероприятия',
            color: "green",
            icon: null,
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: ['ACTION_SCHEME_CREATED'],
                matching: ['equal'],
                colValues: ['TRUE']
            }],
            handler: function() {
                if ($(this).hasClass('disabled')) return;
                bootbox.dialog({
                    message: "Подтвердите создание схемы мероприятия. Это может занять некоторое время",
                    title: "Создание схемы мероприятия",
                    buttons: {
                        ok: {
                            label: "Создать схему",
                            className: "yellow",
                            callback: function () {
                                MB.Core.spinner.start(formWrapper);
                                var o = {
                                    command: 'operation',
                                    object: 'create_action_scheme',
                                    params: {
                                        action_id: formInstance.activeId
                                    }
                                };
                                //tableInstance.ct_instance.notify({type: true, text: 'Идет процесс создания схемы мероприятия...'});
                                socketQuery(o, function (res) {
                                    MB.Core.spinner.stop(formWrapper);
                                    socketParse(res);
                                    formInstance.reload();
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
            }
        },
        {
            title: 'Печать',
            color: "blue",
            icon: null,
            type: "SINGLE",
            hidden: false,
            condition: [
                {
                    colNames: [],
                    matching: [],
                    colValues: []
                }
            ],
            handler: function() {
                if ($(this).hasClass('disabled')) return;
                var get = "?sid=" + MB.User.sid + "&ACTIVE_ID=" + formInstance.activeId + "&name=" + formInstance.name;
                get += "&subcommand=delivery_note_order";
                var iframe = $('<iframe style="width:0; height:0; overflow: hidden;" class="printIframe" src="html/forms/print_form.html' + get + '"></iframe>');
                iframe.appendTo('body');
            }
        },
        {
            title: 'Переоценить',
            color: "blue",
            icon: null,
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: ['ACTION_SCHEME_CREATED'],
                matching: ['equal'],
                colValues: ['FALSE']
            }],
            //condition: [{
            //    colNames: ['ACTION_SCHEME_CREATED', 'ACTION_TYPE'],
            //    matching: ['equal', 'equal'],
            //    colValues: ['FALSE', 'ACTION_WO_PLACES']
            //}],
            handler: function() {
                if ($(this).hasClass('disabled')) return;
                modalInstance.collapse();
                var title = formInstance.profile.extra_data['object_profile']['client_object_name'] + ' ' + formInstance.activeId;
                MB.Core.switchModal({
                    type: "content",
                    filename: "action_priceZones",
                    params: {action_id: formInstance.activeId, title: title, label: 'Схема переоценки'}
                });
            }
        },
        {
            title: 'Перераспределить',
            color: "blue",
            icon: null,
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: ['ACTION_SCHEME_CREATED'],
                matching: ['equal'],
                colValues: ['FALSE']
            }],
            //condition: [{
            //    colNames: ['ACTION_SCHEME_CREATED', 'ACTION_TYPE'],
            //    matching: ['equal', 'equal'],
            //    colValues: ['FALSE', 'ACTION_WO_PLACES']
            //}],
            handler: function() {
                if ($(this).hasClass('disabled')) return;
                modalInstance.collapse();
                var title = formInstance.profile.extra_data['object_profile']['client_object_name'] + ' ' + formInstance.activeId;
                MB.Core.switchModal({
                    type: "content",
                    filename: "action_fundZones",
                    params: {action_id: formInstance.activeId, title: title, label: 'Схема перераспределения'}
                });
            }
        },
        {
            title: 'Редактировать схему зала',
            color: "blue",
            icon: null,
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: ['ACTION_SCHEME_CREATED'],
                matching: ['equal'],
                colValues: ['FALSE']
            }],
            //condition: [{
            //    colNames: ['ACTION_SCHEME_CREATED', 'HALL_SCHEME', 'ACTION_TYPE'],
            //    matching: ['equal', 'equal', 'equal'],
            //    colValues: ['FALSE', '', 'ACTION_WO_PLACES']
            //}],
            handler: function() {
                if ($(this).hasClass('disabled')) return;
                modalInstance.collapse();
                var hall_scheme_id = formInstance.data.data['HALL_SCHEME_ID'];
                var hall_id = formInstance.data.data['HALL_ID'];

                MB.Core.switchModal({
                    type: "content",
                    filename: "action_mapEditor",
                    params: {
                        hall_scheme_id: hall_scheme_id,
                        action_id: formInstance.activeId,
                        hall_id: hall_id,
                        title: 'Редактор схемы мероприятия, схема зала:' + hall_scheme_id,
                        label: 'Редактор схемы мероприятия '
                    }
                });
            }
        },
        {
            title: 'Печать БСО',
            color: "red",
            icon: null,
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: ['ACTION_SCHEME_CREATED'],
                matching: ['equal'],
                colValues: ['FALSE']
            }],
            handler: function() {
                if ($(this).hasClass('disabled')) return;
                modalInstance.collapse();
                var action_id = formInstance.activeId;

                var guid = MB.Core.guid();
                var modalHtml = '<div class="row form-body" id="bootbox'+guid+'">' +
                    '<label class="form-control">Укажите, какими порциями печатать бланки:</label>' +
                    '<input type="text" class="form-control action_print_portion" value="500">' +
                    '</div>';
                bootbox.dialog({
                    message:modalHtml,
                    title: "Билеты по мероприятию "+formInstance.name,
                    buttons: {
                        start: {
                            label: "Печатать",
                            className: "orange",
                            callback:function(){
                                var bootboxContainer = $("#bootbox"+guid);
                                var inputBox = bootboxContainer.find('.action_print_portion');
                                var action_print_portion = inputBox.val();
                                if (isNaN(+action_print_portion) || +action_print_portion<=0){
                                    toastr.error('Некорректно указано количество билетов в порции.');
                                    return inputBox.val('500');
                                }
                                send('print_action', {
                                    guid: MB.Core.getUserGuid(),
                                    action_id: action_id,
                                    portion:action_print_portion
                                }, function (res) {
                                    console.log('print_action', res);
                                    /*formInstance.reload();*/
                                });
                            }
                        },
                        close: {
                            label: "Закрыть",
                            className: "green"
                        }
                    }
                });


            }
        },
        {
            title: 'Отменить проходы',
            color: "red",
            icon: null,
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: ['ACTION_SCHEME_CREATED'],
                matching: ['equal'],
                colValues: ['FALSE']
            }],
            handler: function() {
                if ($(this).hasClass('disabled')) return;
                var action_id = formInstance.activeId;

                bootbox.dialog({
                    message: "Вы уверены что хотите отменить проход в зал ДЛЯ ВСЕГО МЕРОПРИЯТИЯ?",
                    title: "Отмена прохода ДЛЯ ВСЕГО МЕРОПРИЯТИЯ",
                    buttons: {
                        yes_btn: {
                            label: "ДА, Я УВЕРЕН.",
                            className: "RED",
                            callback: function () {
                                var o = {
                                    command: 'operation',
                                    object: 'clear_all_enter_in_hall_status',
                                    params: {
                                        action_id: formInstance.activeId
                                    }
                                };
                                //tableInstance.ct_instance.notify({type: true, text: 'Идет процесс создания схемы мероприятия...'});
                                socketQuery(o, function (res) {
                                    socketParse(res);
                                    //formInstance.reload();
                                });
                            }
                        },
                        cancel: {
                            label: "Отмена",
                            className: "green"
                        }
                    }
                });


            }
        }




        /*callback: function () {
        bootbox.dialog({
            message: "Вы уверены что хотите отменить проход в зал ДЛЯ ВСЕГО МЕРОПРИЯТИЯ?",
            title: "Отмена прохода ДЛЯ ВСЕГО МЕРОПРИЯТИЯ",
            buttons: {
                yes_btn: {
                    label: "ДА, Я УВЕРЕН.",
                    className: "RED",
                    callback: function () {
                        //clear_enter_in_hall_status  (order_ticket_id, action_id, barcode)
                        var o = {
                            command: "operation",
                            object: "clear_all_enter_in_hall_status"
                        };
                        o["ACTION_ID"] = action_id;
                        sendQueryForObj(o);
                    }
                },
                cancel: {
                    label: "Отмена",
                    className: "green"
                }
            }
        });


    },*/

    ];


	var defaultImagePath = 'assets/img/default-action-image.png';
	var posterImageWrapper = formWrapper.find('.posterImageWrapper');
	var imageUrl = (posterImageWrapper.find('input.fn-control').attr('value') == '') ? defaultImagePath : 'upload/' + posterImageWrapper.find('input.fn-control').attr('value');
	var imageName = (posterImageWrapper.find('input.fn-control').attr('value') == '') ? 'Постер мероприятия' : posterImageWrapper.find('input.fn-control').attr('value');

	posterImageWrapper.find('img').attr('src', imageUrl);
	posterImageWrapper.find('.fn-field-image-name').html(imageName);

	var il = MB.Core.fileLoader;

	formWrapper.find('.fn-field-image-change').off('click').on('click', function () {
		il.start({
			success: function (fileUID) {
				var tmpObj = {
					data: fileUID.base64Data,
					name: fileUID.name,
					id: fileUID.uid
				};
				formWrapper.find('.fn-field-image-input').val(tmpObj.name).trigger('input');
				formWrapper.find('.fn-filed-image-image img').attr('src', tmpObj.data);
				formWrapper.find('.fn-field-image-name').html(tmpObj.name);
			}
		});
	});

	formWrapper.find('.fn-field-image-delete').off('click').on('click', function () {
		formWrapper.find('.fn-field-image-input').val('').trigger('input');
		formWrapper.find('.fn-filed-image-image img').attr('src', defaultImagePath);
		formWrapper.find('.fn-field-image-name').html('Постер мероприятия');
	});


//	var hallSelectWrapper = formWrapper.find('.hall-Select');
//	var hallSchemeSelectWrapper = formWrapper.find('.hall-scheme-Select');
//
//	var hallSelect = MB.Core.select3.list.getSelect(hallSelectWrapper.find('.select3-wrapper').attr('id'));
//	var hallSchemeSelect = MB.Core.select3.list.getSelect(hallSchemeSelectWrapper.find('.select3-wrapper').attr('id'));
//
//	$(hallSelect).on('changeVal', function (e, was, now) {
//		var strWhere = '';
//		if (now.id != '') {
//			strWhere = 'HALL_ID = ' + now.id;
//			hallSchemeSelect.whereString = strWhere;
//		} else {
//			strWhere = '';
//			hallSchemeSelect.whereString = strWhere;
//		}
//	});

})();
(function () {

	var formID = MB.Forms.justLoadedId;
	var formInstance = MB.Forms.getForm('form_user_allowed_contract', formID);
	var formWrapper = $('#mw-' + formInstance.id);

	var modalInstance = MB.Core.modalWindows.windows.getWindow(formID);
	modalInstance.stick = 'top';
	modalInstance.stickModal();

/*    formInstance.lowerButtons = [
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
        }
    ];*/


})();
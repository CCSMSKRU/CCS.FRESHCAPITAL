(function () {

	var formID = MB.Forms.justLoadedId;

	var formInstance = MB.Forms.getForm('form_invitation', formID);
	var formWrapper = $('#mw-' + formInstance.id);

//    var tableID = formWrapper.find('.classicTableWrap').attr('data-id');
//    var tableInstance = MB.Tables.getTable(tableID);
	var modalInstance = MB.Core.modalWindows.windows.getWindow(formID);

	if (formWrapper.find('#searchCrmUser .fn-select3-wrapper .select3-select').length == 0) {
		var selInstance = undefined;
		var crmUserSelectId = MB.Core.guid();
		selInstance = MB.Core.select3.init({
			id: crmUserSelectId,
			wrapper: formWrapper.find('#searchCrmUser .fn-select3-wrapper'),
			getString: 'CRM_USER',
			column_name: 'CRM_USER_ID',
			view_name: '',
			value: {
				id: '-10',
				name: 'Выберите пользователя'
			},
			data: [],
			fromServerIdString: 'CRM_USER_ID',
			fromServerNameString: 'CRM_USER_INFO',
			searchKeyword: 'CRM_USER_INFO',
			withEmptyValue: true,
			isSearch: true,
			parentObject: formInstance
		});
	}

	var crmUserSelect = MB.Core.select3.list.getSelect(crmUserSelectId);
	$(crmUserSelect).off('changeVal').on('changeVal', function (e, was, now) {
		var fields = {
			name: $('.fn-field[data-column="CRM_USER_NAME"] input[type="text"]'),
			phone: $('.fn-field[data-column="CRM_USER_PHONE"] input[type="text"]'),
			email: $('.fn-field[data-column="CRM_USER_EMAIL"] input[type="text"]')
		};

		if (now.id == 'empty' || now.id == '') {
			fields.name.val('');
			fields.phone.val('');
			fields.email.val('');

			fields.name.trigger('input');
			fields.phone.trigger('input');
			fields.email.trigger('input');

		} else {
			socketQuery({
				command: 'get',
				object: 'crm_user',
				params: {
					where: 'CRM_USER_ID = ' + now.id
				}
			}, function (res) {
				if (res = socketParse(res)) {

					fields.name.val(res[0]['CRM_NAME']);
					fields.phone.val(res[0]['PHONE']);
					fields.email.val(res[0]['EMAIL']);

					fields.name.trigger('input');
					fields.phone.trigger('input');
					fields.email.trigger('input');
				}
			});
		}
	});

}());
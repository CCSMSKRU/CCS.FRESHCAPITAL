(function () {

	var tableNId = $('.page-content-wrapper .classicTableWrap').data('id');
	var tableInstance = MB.Tables.getTable(tableNId);

	tableInstance.ct_instance.ctxMenuData = [
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
			name: 'option2',
			title: 'Отменить пригласительные',
			disabled: function () {
				var c = tableInstance.ct_instance.isDisabledCtx({
					col_names: ['STATUS'],
					matching: ['not_equal'],
					col_values: ['CANCELED']
				});

				return !~c.indexOf(true);
			},
			callback: function () {
				tableInstance.makeOperation({
					operationName: 'cancel_invitation',
					params: [{
						col_names: ['STATUS'],
						matching: ['not_equal'],
						col_values: ['CANCELED']
					}],
					revert: true
				});
			}
		}];
}());
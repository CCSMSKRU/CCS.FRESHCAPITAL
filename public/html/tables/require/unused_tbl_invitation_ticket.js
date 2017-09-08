(function () {
	var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);

	tableInstance.ct_instance.ctxMenuData = [
		{
			name: 'option1',
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
					operationName: 'cancel_invitation_ticket',
					params: [{
						col_names: ['STATUS'],
						matching: ['not_equal'],
						col_values: ['CANCELED']
					}],
					revert: true
				}, function () {
					tableInstance.parentObject.reload();
				});
			}
		}];
}());
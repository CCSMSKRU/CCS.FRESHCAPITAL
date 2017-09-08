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
			name: 'option3',
			title: 'Вернуть билет',
			disabled: function () {
				var c1 = tableInstance.ct_instance.isDisabledCtx({
					col_names: ['STATUS'],
					matching: ['not_equal'],
					col_values: ['PAID']
				});

				return c1[0];
			},
			callback: function () {
				bootbox.dialog({
					message: "Вы уверены, что хотите вернуть билет?",
					title: "Внимание!",
					buttons: {
						yes_btn: {
							label: "Да, уверен",
							className: "green",
							callback: function () {
								tableInstance.makeOperation('return_ticket_web');
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
			name: 'option4',
			title: 'Выставить стаус оплаты на Оплата возвращена',
			disabled: function () {
				var c1 = tableInstance.ct_instance.isDisabledCtx({
					col_names: ['WEB_PAYMENT_STATUS'],
					matching: ['not_equal'],
					col_values: ['PAYMENT_NOT_RETURNED']
				});

				return c1[0];
			},
			callback: function () {
				tableInstance.makeOperation('set_web_payment_status_to_payment_returned');
			}
		},
		{
			name: 'option5',
			title: 'Повторная отмена оплаты по билету',
			disabled: function () {
				var c1 = tableInstance.ct_instance.isDisabledCtx({
					col_names: ['WEB_PAYMENT_STATUS'],
					matching: ['not_equal'],
					col_values: ['PAYMENT_NOT_RETURNED']
				});

				return c1[0];
			},
			callback: function () {
				bootbox.dialog({
					message: "Вы уверены, что хотите отменить билет?",
					title: "Внимание!",
					buttons: {
						yes_btn: {
							label: "Да, уверен",
							className: "green",
							callback: function () {
								tableInstance.makeOperation('return_payment_for_web_ticket');
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
			name: 'option6',
			title: 'Выставить статус с "Необходима ручная отмена" на "Возвращен"',
			disabled: function () {
				var c2 = tableInstance.ct_instance.isDisabledCtx({
					col_names: ['STATUS'],
					matching: ['equal'],
					col_values: ['NEED_CANCEL']
				});

				return !~c2.indexOf(true);
			},
			callback: function () {
				tableInstance.makeOperation('set_to_returned_from_need_cancel');
			}
		}
	];
}());
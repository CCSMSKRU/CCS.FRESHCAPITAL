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
			title: 'Отправить на email',
			disabled: function () {
				return false;
			},
			callback: function () {
				var ids = [];
				for (var i in tableInstance.ct_instance.selection2.primary_keys[0].data) {
					ids.push(tableInstance.ct_instance.selection2.primary_keys[0].data[i]);
				}
				var email = prompt('Введите email на который необходимо отправить билеты:');
				if (email) {
					for (var j in ids) {
						var o = {
							command: 'operation',
							object: 'resend_tickets_for_customer',
							params: {
								order_id: ids[j],
								email: email,
								additional_email_addresses: 'NULL'
							}
						};
						socketQuery(o, function (r) {
							socketParse(r);
						});
					}
				}
			}
		},

		{
			name: 'option3',
			title: 'История заказа',
			disabled: function () {
				return false;
			},
			callback: function () {
				var row = tableInstance.ct_instance.selectedRowIndex;
				var activeId = tableInstance.data.data[row][tableInstance.profile['extra_data']['object_profile']['primary_key'].split(',')[0]];
				var orderHistoryId = MB.Core.guid();
				var history = new MB.ContentNew({
					id: orderHistoryId,
					filename: 'order_history',
					params: {
						activeId: activeId,
						label: 'История заказа',
						title: 'История заказа № ' + activeId
					}
				});
				history.create(function () {

				});
			}
		},
		{
			name: 'option4',
			title: 'Отменить заказ',
			disabled: function () {
				var c1 = tableInstance.ct_instance.isDisabledCtx({
					col_names: ['STATUS'],
					matching: ['equal'],
					col_values: ['RESERVED']
				});

				return !c1[0];
			},
			callback: function () {
				bootbox.dialog({
					message: "Вы уверены, что хотите отменить заказ?",
					title: "Внимание!",
					buttons: {
						yes_btn: {
							label: "Да, уверен",
							className: "green",
							callback: function () {
								tableInstance.makeOperation('cancel_web_order');
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
			name: 'option5',
			title: 'Вернуть заказ',
			disabled: function () {
				var c1 = tableInstance.ct_instance.isDisabledCtx({
					col_names: ['STATUS'],
					matching: ['equal'],
					col_values: ['PAID']
				});

				return !c1[0];
			},
			callback: function () {
				bootbox.dialog({
					message: "Вы уверены, что хотите вернуть заказ?",
					title: "Внимание!",
					buttons: {
						yes_btn: {
							label: "Да, уверен",
							className: "green",
							callback: function () {
								tableInstance.makeOperation('return_order_web');
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
                tableInstance.makeOperation('set_order_return_from_need_cancel');
            }

        }
		//{
		//	name: 'option6',
		//	title: 'Выставить стаус оплаты на Оплата возвращена',
		//	disabled: function () {
		//		var c1 = tableInstance.ct_instance.isDisabledCtx({
		//			col_names: ['WEB_PAYMENT_STATUS'],
		//			matching: ['not_equal'],
		//			col_values: ['PAYMENT_NOT_RETURNED']
		//		});
		//
		//		return c1[0];
		//	},
		//	callback: function () {
		//		tableInstance.makeOperation('set_web_order_payment_status_return');
		//	}
		//}
		//,
		//{
		//	name: 'option5',
		//	title: 'Повторная отмена оплаты по заказу',
		//	disabled: function () {
		//		var c1 = tableInstance.ct_instance.isDisabledCtx({
		//				col_names: ['WEB_PAYMENT_STATUS', 'STATUS'],
		//				matching: ['equal', 'equal'],
		//				col_values: ['PAYMENT_NOT_RETURNED', 'RETURNED']
		//			}),
		//			c2 = tableInstance.ct_instance.isDisabledCtx({
		//				col_names: ['WEB_PAYMENT_STATUS', 'STATUS'],
		//				matching: ['equal', 'equal'],
		//				col_values: ['PAYMENT_NOT_RETURNED', 'NEED_CANCEL']
		//			}),
		//			c = [];
		//
		//		for (var i in c1) c.push(c1[i] || c2[i]);
		//
		//		return !~c.indexOf(true);
		//	},
		//	callback: function () {
		//		bootbox.dialog({
		//			message: "Вы уверены, что хотите отменить билет?",
		//			title: "Внимание!",
		//			buttons: {
		//				yes_btn: {
		//					label: "Да, уверен",
		//					className: "green",
		//					callback: function () {
		//						tableInstance.makeOperation('return_payment_web_order');
		//					}
		//				},
		//				cancel: {
		//					label: "Отмена",
		//					className: "blue"
		//				}
		//			}
		//		});
		//	}
		//},
		//{
		//	name: 'option6',
		//	title: 'Выставить статус с "Необходима ручная отмена" на "Возвращен"',
		//	disabled: function () {
		//		var c2 = tableInstance.ct_instance.isDisabledCtx({
		//			col_names: ['STATUS'],
		//			matching: ['equal'],
		//			col_values: ['NEED_CANCEL']
		//		});
		//
		//		return !~c2.indexOf(true);
		//	},
		//	callback: function () {
		//		tableInstance.makeOperation('set_order_return_from_need_cancel');
		//	}
		//}
	];

}());





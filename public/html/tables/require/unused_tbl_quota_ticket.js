(function () {
	var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);
	var formInstance = tableInstance.parentObject;
	var formWrapper = $('#mw-' + formInstance.id);

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
			name: 'option9',
			title: function () {
				return (tableInstance.ct_instance.selection2.data.length > 1) ? 'Выдать по квоте' : 'Выдать по квоте';
			},
			disabled: function () {
				var agentSelectId = formWrapper.find('.fn-control[data-column="AGENT_NAME"]').find('.select3-wrapper').attr('id');
				var agentSelect = MB.Core.select3.list.getSelect(agentSelectId);
				var agentId = formInstance.data.data[0]["AGENT_ID"];
				var agentValue = agentSelect.value.id;
				var agent = (agentId.length > 0) ? agentId : (agentValue == "empty" || agentValue == "") ? "" : agentValue;

				var c = tableInstance.ct_instance.isDisabledCtx({
					col_names: ['STATUS'],
					matching: ['equal'],
					col_values: ['RESERVED']
				});

				return !~c.indexOf(true) || agent == "";
			},
			callback: function () {

				formInstance.save(function () {
					var c = tableInstance.ct_instance.isDisabledCtx({
						col_names: ['STATUS'],
						matching: ['equal'],
						col_values: ['RESERVED']
					});
					var selArr = tableInstance.ct_instance.selection2.data;
					var pk = tableInstance.profile['extra_data']['object_profile']['primary_key'];
					var park = tableInstance.profile['extra_data']['object_profile']['parent_key'];
					var ids = [];

					for (var i in selArr) {
						if (c[i]) {
							var item = selArr[i];
							var pkv = item[pk];
							ids.push(pkv);
						}
					}

					var o = {
						command: 'operation',
						object: 'on_realization_from_reserved_tickets'
					};

					o[pk] = ids.join(',');
					o[park] = tableInstance.parent_id;

					socketQuery(o, function (res) {
						socketParse(res);
						formInstance.reload();
					});

				});
			}
		},

		{
			name: 'option4',
			title: function () {
				return (tableInstance.ct_instance.selection2.data.length > 1) ? 'Вернуть билеты' : 'Вернуть билет';
			},
			disabled: function () {
				var c = tableInstance.ct_instance.isDisabledCtx({
					col_names: ['STATUS'],
					matching: ['equal'],
					col_values: ['ON_REALIZATION']
				});

				return !~c.indexOf(true);
			},
			callback: function () {

				var c = tableInstance.ct_instance.isDisabledCtx({
					col_names: ['STATUS'],
					matching: ['equal'],
					col_values: ['ON_REALIZATION']
				});
				var selArr = tableInstance.ct_instance.selection2.data;
				var pk = tableInstance.profile['extra_data']['object_profile']['primary_key'];
				var park = tableInstance.profile['extra_data']['object_profile']['parent_key'];
				var ids = [];

				for (var i in selArr) {
					if (c[i]) {
						var item = selArr[i];
						var pkv = item[pk];
						ids.push(pkv);
					}
				}

				var o = {
					command: 'operation',
					object: 'return_realization_from_on_realization_tickets'
				};

				o[pk] = ids.join(',');
				o[park] = tableInstance.parent_id;

				socketQuery(o, function (res) {
					socketParse(res);
					formInstance.reload();
				});
			}
		},
		{
			name: 'option6',
			title: function () {
				return (tableInstance.ct_instance.selection2.data.length > 1) ? 'Забраковать бланки' : 'Забраковать бланк';
			},
			disabled: function () {
				var c1 = tableInstance.ct_instance.isDisabledCtx({
					col_names: ['STATUS', 'PRINT_STATUS'],
					matching: ['equal', 'equal'],
					col_values: ['CLOSED', 'PRINTED']
				});
				var c2 = tableInstance.ct_instance.isDisabledCtx({
					col_names: ['STATUS', 'PRINT_STATUS'],
					matching: ['equal', 'equal'],
					col_values: ['ON_REALIZATION', 'PRINTED']
				});
				var c = [];
				for (var i in c1) c.push(c1[i] || c2[i]);

				return !~c.indexOf(true);
			},
			callback: function () {
				bootbox.dialog({
					message: "Вы уверены, что хотите забраковать бланки?",
					title: "Внимание!",
					buttons: {
						yes_btn: {
							label: "Да, уверен",
							className: "green",
							callback: function () {
								tableInstance.makeOperation({
									operationName: 'defect_blank',
									params: [{
										col_names: ['STATUS', 'PRINT_STATUS'],
										matching: ['equal', 'equal'],
										col_values: ['CLOSED', 'PRINTED']
									}, {
										col_names: ['STATUS', 'PRINT_STATUS'],
										matching: ['equal', 'equal'],
										col_values: ['ON_REALIZATION', 'PRINTED']
									}],
									revert: true
								}, function () {
									//tableInstance.parentObject.reload();
									formInstance.reload();
								});
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
			name: 'option8',
			title: function () {
				return (tableInstance.ct_instance.selection2.data.length > 1) ? 'Закрыть квоту' : 'Закрыть квоту';
			},
			disabled: function () {
				var c = tableInstance.ct_instance.isDisabledCtx({
					col_names: ['STATUS'],
					matching: ['equal'],
					col_values: ['ON_REALIZATION']
				});

				return !~c.indexOf(true);
			},
			callback: function () {

				var c = tableInstance.ct_instance.isDisabledCtx({
					col_names: ['STATUS'],
					matching: ['equal'],
					col_values: ['ON_REALIZATION']
				});
				var selArr = tableInstance.ct_instance.selection2.data;
				var pk = tableInstance.profile['extra_data']['object_profile']['primary_key'];
				var park = tableInstance.profile['extra_data']['object_profile']['parent_key'];
				var ids = [];

				for (var i in selArr) {
					if (c[i]) {
						var item = selArr[i];
						var pkv = item[pk];
						ids.push(pkv);
					}
				}

				var o = {
					command: 'operation',
					object: 'close_realization_tickets'
				};

				o[pk] = ids.join(',');
				o[park] = tableInstance.parent_id;

				socketQuery(o, function (res) {
					socketParse(res);
					formInstance.reload();
				});
			}
		},
		{
			name: 'option10',
			title: function () {
				return (tableInstance.ct_instance.selection2.data.length > 1) ? 'Отменить билеты' : 'Отменить билет';
			},
			disabled: function () {
				var c = tableInstance.ct_instance.isDisabledCtx({
					col_names: ['STATUS'],
					matching: ['equal'],
					col_values: ['RESERVED']
				});

				return !~c.indexOf(true);
			},
			callback: function () {
				tableInstance.makeOperation({
					operationName: 'cancel_ticket',
					params: {
						col_names: ['STATUS'],
						matching: ['equal'],
						col_values: ['RESERVED']
					},
					revert: true
				});
			}
		},


		{
			name: 'option5',
			title: function () {
				return (tableInstance.ct_instance.selection2.data.length > 1) ? 'Напечатать билеты' : 'Напечатать билет';
			},
			disabled: function () {
				var c1 = tableInstance.ct_instance.isDisabledCtx({
					col_names: ['STATUS', 'PRINT_STATUS'],
					matching: ['equal', 'equal'],
					col_values: ['ON_REALIZATION', 'NOT_PRINTED']
				});
				var c2 = tableInstance.ct_instance.isDisabledCtx({
					col_names: ['STATUS', 'PRINT_STATUS'],
					matching: ['equal', 'equal'],
					col_values: ['CLOSED_REALIZATION', 'NOT_PRINTED']
				});
				var c = [];
				for (var i in c1) c.push(c1[i] || c2[i]);

				return !~c.indexOf(true);
			},
			callback: function () {
				var d = tableInstance.ct_instance.selection2.data;
				var c1 = tableInstance.ct_instance.isDisabledCtx({
					col_names: ['STATUS', 'PRINT_STATUS'],
					matching: ['equal', 'equal'],
					col_values: ['ON_REALIZATION', 'NOT_PRINTED']
				});
				var c2 = tableInstance.ct_instance.isDisabledCtx({
					col_names: ['STATUS', 'PRINT_STATUS'],
					matching: ['equal', 'equal'],
					col_values: ['CLOSED_REALIZATION', 'NOT_PRINTED']
				});
				var c = [];
				for (var i in c1) c.push(c1[i] || c2[i]);

				var selArr = [];
				for (var i in c) if (c[i]) selArr.push(d[i]);


				for (var i in selArr) {
					var item = selArr[i];
					send('print_ticket', {
						guid: MB.Core.getUserGuid(),
						ticket_id: item['ORDER_TICKET_ID']
					}, function (res) {
						console.log('print_ticket', res);
						formInstance.reload();
					});
				}
			}
		}
	];

}());

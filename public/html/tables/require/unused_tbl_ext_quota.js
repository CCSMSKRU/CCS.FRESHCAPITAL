(function () {
	var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);

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
			title: function () {
				return 'Вернуть квоты';
			},
			disabled: function () {
				//var c = tableInstance.ct_instance.isDisabledCtx({
				//	col_names: ['STATUS'],
				//	matching: ['equal'],
				//	col_values: ['CHECKED']
				//});

				//return !~c.indexOf(true);
				return false;
			},
			callback: function () {
				var ids = [];
				for (var i in tableInstance.ct_instance.selection2.data) ids.push(tableInstance.ct_instance.selection2.data[i].EXT_QUOTA_ID);
				var o = {
					command: 'operation',
					object: 'ext_quota_return',
					params: {
						action_id: tableInstance.parent_id,
						quota_id_list: ids.join(',')
					}
				};
                bootbox.dialog({
                    title: 'Подтверждение',
                    message: 'Вернуть все квоты агенту, вы уверены?',
                    buttons: {
                        success: {
                            label: 'Подтвердить',
                            callback: function(){
                                socketQuery(o, function (res) {
                                    socketParse(res);
                                    tableInstance.parentObject.reload();
                                });
                            }
                        },
                        error: {
                            label: 'Отмена',
                            callback: function(){

                            }
                        }
                    }
                });

			}
		},
		{
			name: 'option3',
			title: function () {
				return 'Редактировать квоту';
			},
			disabled: function () {
				return false;
			},
			callback: function () {
				var formInstance = tableInstance.parentObject;
				formInstance.active_quote = tableInstance.ct_instance.selection2.data[0].EXT_QUOTA_ID;
				formInstance.loadMap();
				var $wrapper = $(tableInstance.ct_instance.tableWrapper),
					rowIndex = tableInstance.ct_instance.selectedRowIndex + 1;
				$wrapper.find('tr').removeClass('chosen').filter('tr:nth-of-type(' + rowIndex + ')').addClass('chosen');
			}
		}
	];

}());

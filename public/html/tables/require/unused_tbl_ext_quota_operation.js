
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
				return 'Применить файл квоты';
			},
			disabled: function () {
				var c = tableInstance.ct_instance.isDisabledCtx({
					col_names: ['STATUS'],
					matching: ['equal'],
					col_values: ['CHECKED']
				});

				return !~c.indexOf(true);
			},
			callback: function () {
				tableInstance.makeOperation({
					operationName: 'apply_ext_quota_operation',
					params: {
						col_names: ['STATUS'],
						matching: ['equal'],
						col_values: ['CHECKED']
					},
					revert: true
				}, function(){

					//MB.Forms.getForm()

					var frms = MB.Forms.forms;
					for (var i in frms)
						if (frms[i].name == 'form_action_ext_quota') MB.Forms.getForm(frms[i].name, frms[i].id).reload(function(){
							tableInstance.parentObject.reload();
						});
				});
			}
		},
        {
            name: 'option3',
            title: 'Скачать XML операции',
            disabled: function () {
                return false;
            },
            callback: function () {
                var row = tableInstance.ct_instance.selectedRowIndex;
                var id = tableInstance.data.data[row]['EXT_QUOTA_OPERATION_ID'];

                var obj = {
                    o: {
                        command: "operation",
                        object: "export_ext_quota_operation_in_xml",
                        sid:MB.User.sid,
                        params: {
                            ext_quota_operation_id: id
                        }
                    }
                };

                getFile(obj);
            }
        }
	];

}());

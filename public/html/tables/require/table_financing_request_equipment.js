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

				var row = tableInstance.ct_instance.selectedRowIndex;
				var status = tableInstance.data.data[row].request_status_sysname;
				var id = tableInstance.data.data[row].id;
				var formId = MB.Core.guid();

				if(status == 'CREATED'){
					tableInstance.openRowInModal();
				}else if(status == 'IN_WORK'){

					var openInModalO = {
						id: formId,
						name: 'form_financing_request_readonly',
						class: 'financing_request',
						client_object: 'form_financing_request_readonly',
						type: 'form',
						ids: [id],
						position: 'center',
						tablePKeys: {data_columns: tableInstance.profile['extra_data']['object_profile']['primary_key'].split(','), data: [id]}
					};

					var form = new MB.FormN(openInModalO);
					form.create(function () {
						var modal = MB.Core.modalWindows.windows.getWindow(formId);
						$(modal).on('close', function () {
//					console.log('modal closing trigger');
							_t.reload();
						});

						$(form).on('update', function () {
//					console.log('form update trigger');
							_t.reload();
						});

						if(typeof cb == 'function'){
							cb();
						}

					});

				}


			}
		}
	];

}());
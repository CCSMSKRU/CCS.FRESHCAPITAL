(function () {
	var modal = $('.mw-wrap').last();
	var formID = MB.Forms.justLoadedId;
	var formInstance = MB.Forms.getForm('form_hall_scheme', formID);
	var formWrapper = $('#mw-' + formInstance.id);
	var modalInstance = MB.Core.modalWindows.windows.getWindow(formInstance.id);

	formInstance.lowerButtons = [
		{
			title: 'Перейти к редактору',
			color: "blue",
			icon: "fa-edit",
			type: "SINGLE",
			hidden: false,
			condition: [{
				colNames: [],
				matching: [],
				colValues: []
			}],
			handler: function () {
				socketQuery({
					command: "get",
					object: "hall_scheme",
					params: {
						where: "hall_scheme_id = " + formInstance.activeId
					}
				}, function (res) {
					res = socketParse(res);

					var hall_id = res[0].HALL_ID;
					var title = formInstance.data.data[0]['HALL_NAME'];

					modalInstance.collapse();

					MB.Core.switchModal({
						type: "content",
						filename: "mapEditor",
						params: {
							hall_scheme_id: formInstance.activeId,
							hall_id: hall_id,
							title: title,
							label: 'Редактор зала'
						}
					});
				});
			}
		},
		{
			title: 'Создать копию',
			color: "blue",
			icon: "fa-copy",
			type: "SINGLE",
			hidden: false,
			condition: [{
				colNames: [],
				matching: [],
				colValues: []
			}],
			handler: function () {
				var hallName = formInstance.data.data[0]["NAME"] + " (Копия)";
				bootbox.dialog({
					//selector: "#portlet-config",
					title: "Копирование схемы зала.",
					message: "Схему зала можно скопировать в двух режимах. В первом будет скопирована только физическая модель зала (расположения мест, надписей, изображений), а во втором, также, будут скопированы все схемы распределения/распоясовки/расценки.<input type='text' class='copySchemeName' value='" + hallName + "' size='60'/>",
					buttons: {
						success: {
							label: "Скопировать только места",
							//color:"blue",
							//dopAttr:"",
							callback: function () {
								var info = toastr["info"]("Идет процесс копирования", "Подождите...", {
									timeOut: 1000000
								});
								var copySchemeName = $(".copySchemeName").val();
								socketQuery({
									command: "operation",
									object: "copy_hall_scheme",
									params: {hall_scheme_id: formInstance.activeId, all: 0, name: copySchemeName}
								}, function (data) {
									info.fadeOut(600);
									if (socketParse(data)) {
										formInstance.reload();
										$(modalObj.selector).modal("hide");
									}
								});
							}
						},
						success2: {
							label: "Полная копия",
							//color:"yellow",
							//dopAttr:"",
							callback: function () {
								var info = toastr["info"]("Идет процесс копирования", "Подождите...", {
									timeOut: 1000000
								});
								var copySchemeName = $(".copySchemeName").val();
								socketQuery({
									command: "operation",
									object: "copy_hall_scheme",
									params: {hall_scheme_id: formInstance.activeId, name: copySchemeName, all: 1}
								}, function (data) {
									info.fadeOut(600);
									if (socketParse(data)) {
										formInstance.reload();
										$(modalObj.selector).modal("hide");
									}
								});
							}
						},
						cancel: {
							label: "Закрыть",
							//color:"default",
							//dopAttr:'data-dismiss="modal"',
							callback: function () {

							}
						}
					}
				});
			}
		}
	];

})();

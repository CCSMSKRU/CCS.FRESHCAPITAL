(function () {
	var instance = MB.O.forms["form_hall_scheme"];
	instance.custom = function (callback) {
		if (instance.mode !== "add") {
			var id = MB.O.forms.form_hall_scheme.activeId;
			var title = instance.data.data[0]['HALL_NAME'];
			var CustomButtons = {
				goToRedactor: {
					name: "Перейти к редактору",
					id: "goToRedactor",
					style: "blue",
					disabled: function () {

					},
					callback: function (key, options) {
						socketQuery({
							command: "get",
							object: "hall_scheme",
							params: {where: "hall_scheme_id = " + id}
						}, function (data) {
							var obj = socketParse(data);
							var hall_id = obj[0].HALL_ID;
							MB.Core.switchModal({
								type: "content",
								filename: "mapEditor",
								params: {hall_scheme_id: id, hall_id: hall_id, title: title, label: 'Редактор зала'}
							});
						});
					}
				},
				goTocreatCopy: {
					name: "Создать копию",
					id: "goTocreatCopy",
					style: "blue",
					disabled: function () {

					},
					callback: function (key, options) {
						var hallName = instance.data.data[0]["NAME"] + " (Копия)";
						var modalObj = {
							selector: "#portlet-config",
							title: "Копирование схемы зала.",
							content: "Схему зала можно скопировать в двух режимах. В первом будет скопирована только физическая модель зала (расположения мест, надписей, изображений), а во втором, также, будут скопированы все схемы распределения/распоясовки/расценки.<input type='text' class='copySchemeName' value='" + hallName + "' size='60'/>",
							buttons: {
								ok1: {
									label: "Скопировать только места",
									color: "blue",
									dopAttr: "",
									callback: function () {
										var info = toastr["info"]("Идет процесс копирования", "Подождите...", {
											timeOut: 1000000
										});
										var copySchemeName = $(".copySchemeName").val();
										socketQuery({
											command: "operation",
											object: "copy_hall_scheme",
											params: {hall_scheme_id: id, all: 0, name: copySchemeName}
										}, function (data) {
											info.fadeOut(600);
											if (socketParse(data)) {
												instance.reload("data");
												$(modalObj.selector).modal("hide");
											}
										});
									}
								},
								ok2: {
									label: "Полная копия",
									color: "yellow",
									dopAttr: "",
									callback: function () {
										var info = toastr["info"]("Идет процесс копирования", "Подождите...", {
											timeOut: 1000000
										});
										var copySchemeName = $(".copySchemeName").val();
										socketQuery({
											command: "operation",
											object: "copy_hall_scheme",
											params: {hall_scheme_id: id, name: copySchemeName, all: 1}
										}, function (data) {
											info.fadeOut(600);
											if (socketParse(data)) {
												instance.reload("data");
												$(modalObj.selector).modal("hide");
											}
										});
									}
								},
								cancel: {
									label: "Закрыть",
									color: "default",
									dopAttr: 'data-dismiss="modal"',
									callback: function () {

									}
								}
							}
						}

						MB.Core.ModalMiniContent(modalObj);
					}
				}
			}
			hallSchemeButtons = new MB.Core.CreateButtonsInForm(instance, CustomButtons, "hallScheme");
		}
		callback();
	};
})();


/*

 bootbox.dialog({
 message: "Схему зала можно скопировать в двух режимах. В первом будет скопирована только физическая модель зала (расположения мест, надписей, изображений), а во втором, также, будут скопированы все схемы распределения/распоясовки/расценки.",
 title: "Копирование схемы зала.",
 buttons: {
 ok1: {
 label: "Скопировать только места",
 className: "green",
 callback: function() {
 var info = toastr["info"]("Идет процесс копирования", "Подождите...",{
 timeOut:1000000
 });
 MB.Core.sendQuery({command:"operation",object:"copy_hall_scheme",sid:sid,params:{hall_scheme_id:id,all:0}},function(data){
 info.fadeOut(600);
 if (data.RC==0){
 instance.reload("data");
 toastr[data.TOAST_TYPE](data.MESSAGE, data.TITLE);
 }else{

 }


 });

 }
 },
 ok2: {
 label: "Полная копия",
 className: "yellow",
 callback: function() {
 var info = toastr["info"]("Идет процесс копирования", "Подождите...",{
 timeOut:1000000
 });
 MB.Core.sendQuery({command:"operation",object:"copy_hall_scheme",sid:sid,params:{hall_scheme_id:id}},function(data){
 info.fadeOut(600);
 if (data.RC==0){
 instance.reload("data");
 toastr[data.TOAST_TYPE](data.MESSAGE, data.TITLE);
 }else{

 }


 });

 }
 },
 cancel: {
 label: "Отмена",
 className: "blue",
 callback: function() {

 }
 }
 }
 });

 */
(function () {
	var instance = MB.O.tables["tbl_action_scheme_pricing"];
	instance.custom = function (callback) {
		var form = MB.O.forms["form_action_scheme_pricing"];

		var handsontableInstance = instance.$container.find(".handsontable").handsontable("getInstance");
		handsontableInstance.updateSettings({contextMenu: false});

		handsontableInstance.updateSettings({
			contextMenu: {
				callback: function (key, options) {
					var arr, data, handsontableInstance, i, value, _i, _len;
					var handsontableInstance = instance.$container.find(".handsontable").handsontable("getInstance");
					var selectedRows = MB.Table.getSelectedRowsInterval(handsontableInstance);
					var i = selectedRows[0];
					var id = instance.data.data[i][instance.profile.general.primarykey];
					switch (key) {
						case "select":

							form.tblcallbacks.select.callback(id);

							break;
						case "setAsDefault":
							var o = {
								command: "operation",
								object: "set_action_scheme_default",
								sid: MB.User.sid
							};
							o[instance.profile.general.primarykey] = id;
							socketQuery(o, function (res) {
								if (socketParse(res)) toastr.success("Схема распределения #" + id + " установлена по умолчанию для схемы зала #" + instance.parentkeyvalue + " успешно!", "custom func");
								instance.reload("data");
							});

							break;
					}

				},
				items: {
					select: {
						name: "Выбрать"
					},
					setAsDefault: {
						name: "Установить по умолчанию"
					}
				}
			}
		});
		callback();
	};
}());


/*
 (function () {
 var instance = MB.O.tables["tbl_action_scheme_pricing"];
 var parent = MB.O[instance.parentobjecttype + "s"][instance.parentobject];
 instance.custom = function (callback) {
 console.log($("#" + instance.name).find("tbody tr[data-row='" + parent.tblselectedrow + "']"));
 if (parent.tblcallbacks) {
 for (var key in parent.tblcallbacks) {
 instance.contextmenu[key] = {
 name: parent.tblcallbacks[key]["name"],
 callback: parent.tblcallbacks[key]["callback"]
 };
 }
 }

 var query = "#" + instance.world + "_" + instance.name + "_wrapper table tbody tr";
 $.contextMenu("destroy", query);
 $.contextMenu({
 selector: query,
 items: instance.contextmenu
 });
 if (parent.tblselectedrow) {
 $("#" + instance.name).find("tbody tr[data-row='" + parent.tblselectedrow + "']").removeClass("justrow").addClass("selectedrow");
 console.log($("#" + instance.name).find("tbody tr[data-row='" + parent.tblselectedrow + "']"));
 callback();
 } else {
 callback();
 }
 };
 }());*/

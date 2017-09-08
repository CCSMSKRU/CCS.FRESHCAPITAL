(function () {
	var instance = MB.O.tables["table_order"];
	instance.custom = function (callback) {
		instance.aff = 5;
		instance.contextmenu["custom1"] = {
			name: "Кастомное событие",
            callback: function (key, options) {
				alert("Я вызываюсь только в table_order");
            }
		};
		var query = "#" + instance.world + "_" + instance.name + "_wrapper table tbody tr";
        $.contextMenu("destroy", query);
        $.contextMenu({
            selector: query,
            items: instance.contextmenu
        });
		callback();
	};
}());

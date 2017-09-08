(function () {
	var instance = MB.O.tables["table_hall_scheme_fund_zone"];
	instance.custom = function (callback) {
		instance.aff = 5;
		instance.contextmenu["custom1"] = {
			name: "Установить схему по умолчанию",
            callback: function (key, options) {
				var id = options.$trigger.data("row");
				instance.callback(id);
				callback();
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

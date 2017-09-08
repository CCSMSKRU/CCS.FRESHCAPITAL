(function () {


    var tableNId = $('.page-content-wrapper .classicTableWrap').data('id');
    var tableInstance = MB.Tables.getTable(tableNId);
    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option1',
            title: 'Открыть в форме',
            disabled: function(){
                return false;
            },
            callback: function(){
                tableInstance.openRowInModal();
            }
        }
    ];

	var instance = MB.O.tables["table_order_realization"];
	instance.custom = function (callback) {
		if (instance.profile.general.filterWhere["STATUS2"] == null) {
			instance.profile.general.filterWhere["STATUS2"] = {
				type: "notIn",
				value: "('CANCELED', 'RETURNED', 'RETURNED_REALIZATION', 'DEFECTIVE')"
			};
			var title = "Не показывать  отмененные,возвращенные и забракованные";
			instance.$container.find(".top-panel > .row").append("<div class='col-md-1' title='"+title+"'><input type='checkbox' class='statusToggler' checked> Скрыть</div>");
			instance.$container.find(".top-panel .statusToggler").on("click", function (e) {
				var checked = $(e.target).prop("checked");
				if (checked) {
					instance.profile.general.filterWhere["STATUS2"] = {
						type: "notIn",
						value: "('CANCELED', 'RETURNED', 'RETURNED_REALIZATION', 'DEFECTIVE')"
					};
					instance.reload("data");
				} else {
					delete instance.profile.general.filterWhere["STATUS2"];
					instance.reload("data");
				}
			});
			instance.reload("data");
		}
		callback();
	};
}());

		// instance.$container.find(".top-panel .row").append("<div col-md-1><input type='checkbox'
		// 	class='statusToggler'></div>");
		// instance.$container.find(".top-panel .statusToggler").on("click", function (e) {
		// 	console.log($(e.target).prop("checked"));
		// 	// if ($(this).prop) {};
		// 	// instance.profile.general.filterWhere["STATUS"] =
		// 	// 	type: "notIn"
		// 	// 	value: "('CANCELED', 'RETURNED', 'RETURNED_REALIZATION', 'DEFECTIVE')"
		// });
		
// status NOT IN ('CANCELED','RETURNED','RETURNED_REALIZATION','DEFECTIVE' )

				
	 //  	var html = "<div class='col-md-3'><div class='form-group'><label>Статус</label><div><input type='hidden' class='form-control order-status'></div></div></div><div class='col-md-3'><div class='form-group'><label>Тип заказа</label><div><input type='hidden' class='form-control order-type'></div></div></div>";
	 //  	instance.$container.find(".top-panel").html(html);
	 //  	instance.$container.find(".top-panel .order-status").select2({
			// placeholder: "Выберите статус",
			// tags: true,
			// ajax: {
			//     url: "/cgi-bin/b2cJ",
			//     dataType: "json",
			//     data: function (term, page) {
			//         var options = {
			//             command: "get",
			//             object: "order_status",
			//             columns: "STATUS,STATUS_RU",
			//             sid: MB.User.sid
			//         };
			//         return {p_xml: MB.Core.makeQuery(options)};
			//     },
			//     results: function (data, page) {
			//         return {results: MB.Table.parseforselect2data(data)};
			//     }
			// }
	 //  	});
	 //  	instance.$container.find(".top-panel .order-status").on("change keyup", function (e) {
	 //  		var val = ($(this).val());
	 //  		var splited = val.split(",");
	 //  		console.log(splited);
	 //  		if (splited.length > 0 && splited[0] !== "") {
	 //  			var wherecolumns = [];
	 //  			for (var i = 0, l = splited.length; i < l; i++) {
	 //  				wherecolumns.push("'" + splited[i] + "'")
	 //  			}
	 //  			if (instance.profile.general.where === "") {
	 //  				instance.profile.general.where = "STATUS IN (" + wherecolumns + ")";
	 //  			} else {
	 //  				instance.profile.general.where += " AND STATUS IN (" + wherecolumns + ")";
	 //  			}
	 //  		} else {
	 //  			instance.profile.general.where = "";
	 //  		}
	 //  		instance.reload("data");
	 //  	});
	 //  	instance.$container.find(".top-panel .order-type").select2({
			// placeholder: "Выберите тип",
			// tags: true,
			// ajax: {
			//     url: "/cgi-bin/b2cJ",
			//     dataType: "json",
			//     data: function (term, page) {
			//         var options = {
			//             command: "get",
			//             object: "order_created_by",
			//             columns: "DB_VALUES,CLIENT_VALUES",
			//             sid: MB.User.sid
			//         };
			//         return {p_xml: MB.Core.makeQuery(options)};
			//     },
			//     results: function (data, page) {
			//         return {results: MB.Table.parseforselect2data(data)};
			//     }
			// }
	 //  	});
	 //  	instance.$container.find(".top-panel .order-type").on("change keyup", function (e) {
	 //  		var val = ($(this).val());
	 //  		var splited = val.split(",");
	 //  		console.log(splited);
	 //  		if (splited.length > 0 && splited[0] !== "") {
	 //  			var wherecolumns = [];
	 //  			for (var i = 0, l = splited.length; i < l; i++) {
	 //  				wherecolumns.push("'" + splited[i] + "'")
	 //  			}
	 //  			if (instance.profile.general.where === "") {
	 //  				instance.profile.general.where = "CREATED_BY IN (" + wherecolumns + ")";	
	 //  			} else {
	 //  				instance.profile.general.where += " AND CREATED_BY IN (" + wherecolumns + ")";	
	 //  			}
	 //  			// instance.profile.general.where = "CREATED_BY IN (" + wherecolumns + ")";	
	 //  		} else {
	 //  			instance.profile.general.where = "";
	 //  		}
	 //  		instance.reload("data");
	 //  	});

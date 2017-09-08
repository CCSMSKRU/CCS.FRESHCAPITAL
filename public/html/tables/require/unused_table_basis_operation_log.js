(function () {
    var instance = MB.O.tables["table_basis_operation_log"];
    instance.custom = function (callback) {
        if (instance.profile.general.filterWhere["SHOW_RESULT2"] == null) {
            instance.profile.general.filterWhere["SHOW_RESULT2"] = {
                type: "notIn",
                value: "('FALSE')"
            };
            var title = "Показывать с ошибкой";
            instance.$container.find(".top-panel > .row").append("<div class='col-md-1' title='"+title+"'><label><input type='checkbox' class='statusToggler' checked>  С ошибкой</label></div>");
            instance.$container.find(".top-panel .statusToggler").on("click", function (e) {
                var checked = $(e.target).prop("checked");
                if (checked) {
                    instance.profile.general.filterWhere["SHOW_RESULT2"] = {
                        type: "notIn",
                        value: "('FALSE')"
                    };
                    instance.reload("data");
                } else {
                    delete instance.profile.general.filterWhere["SHOW_RESULT2"];
                    instance.reload("data");
                }
            });
            instance.reload("data");
        }
        callback();
    };
}());

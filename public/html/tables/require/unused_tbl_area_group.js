(function () {
    var instance = MB.O.tables["tbl_area_group"];
    var parent = MB.O[instance.parentobjecttype + "s"][instance.parentobject];
    instance.custom = function (callback) {
        //console.log($("#" + instance.name).find("tbody tr[data-row='" + parent.tblselectedrow + "']"));
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
            //console.log($("#" + instance.name).find("tbody tr[data-row='" + parent.tblselectedrow + "']"));
            callback();
        } else {
            callback();
        }
    };
}());

(function () {
    var instance = MB.O.forms["form_role"];
    instance.custom = function (callback) {
        var id = MB.O.forms.form_role.activeId;
        var Tabs = new TabsClass({type:"disAll"});
        var MultiplySelect = new MultiplySelectClass({
            selector:"#rolesModalTabUsersContent",
            thisId:id,
            subcommandEx:"user_role",
            subcommandAll:"user_active",
            pKey:"ROLE_ID",
            pKeyEx:"USER_ID",
            pKeyAll:"USER_ROLE_ID",
            name:"FULLNAME_WITH_LOGIN",
            type:"all"
        })
        MultiplySelect.init(function(){});

        $("#TAB_form_role_formAccess").click(function(){
            var id = MB.O.forms.form_role.activeId;
            $(".form_role_form-content-wrapper").html("");
            var table = new MB.Table({
                world: "form_role_form", 
                name: "tbl_role_access_get_object", 
                params: {
                    parent: instance
                    // parentkeyvalue: id, 
                    // parentobject: "form_role", 
                    // parentobjecttype: "form"
                }
            });
            table.create(function () {});
        })
        $("#TAB_form_role_objectAccess").click(function(){
            var id = MB.O.forms.form_role.activeId;
            $(".form_role_object-content-wrapper").html("");
            var table = new MB.Table({
                world: "form_role_object", 
                name: "tbl_role_access_object", 
                params: {
                    parent: instance
                    // parentkeyvalue: id, 
                    // parentobject: "form_role", 
                    // parentobjecttype: "form"
                }
            });
            table.create(function () {});
        })
        $("#TAB_form_role_operationsAccess").click(function(){
            var id = MB.O.forms.form_role.activeId;
            $(".form_role_operations-content-wrapper").html("");
            var table = new MB.Table({
                world: "form_role_operations", 
                name: "tbl_role_access_operation", 
                params: {
                    parent: instance
                    // parentkeyvalue: id, 
                    // parentobject: "form_role", 
                    // parentobjecttype: "form"
                }
            });
            table.create(function () {});
        })
        $("#TAB_form_role_menuAccess").click(function(){
            var id = MB.O.forms.form_role.activeId;
            $(".form_role_menu-content-wrapper").html("");
            var table = new MB.Table({
                world: "form_role_menu", 
                name: "tbl_role_access_menu", 
                params: {
                    parent: instance
                    // parentkeyvalue: id, 
                    // parentobject: "form_role", 
                    // parentobjecttype: "form"
                }
            });
            table.create(function () {});
            log(MB.Table.hasloaded("tbl_role_access_menu"))
        })
        callback();
    };
})();

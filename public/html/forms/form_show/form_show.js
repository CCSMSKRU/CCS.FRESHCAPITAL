(function () {
    var instance = MB.O.forms["form_show"];
    instance.custom = function (callback) {
        // var Tabs = new TabsClass();
        // console.log(Tabs,"TABS");
        $("#TAB_shows_part").off().on("click", function(){
            var id = MB.O.forms.form_show.activeId;
            $(".form_show-content-wrapper").html("");
            var table = new MB.Table({
                world: "form_show", 
                name: "tbl_show_part", 
                params: {
                    parent: instance
                    // parentkeyvalue: id, 
                    // parentobject: "form_show", 
                    // parentobjecttype: "form"
                }
            });
            table.create(function () {});
            log(MB.Table.hasloaded("tbl_show_part"))
        })

        // Таб Поставщики билетов
       
        var id = MB.O.forms.form_show.activeId;

        // var Tabs = new TabsClass();
        $("#TAB_action_suply").off().on("click", function(){
            var MultiplySelect_suply = new MultiplySelectClass({
                selector:"#action_suply",
                thisId:id,
                subcommandEx:"show_ticket_supplier",
                subcommandAll:"customer_ticket_supplier",
                pKey:"SHOW_ID",
                pKeyEx:"CUSTOMER_ID",
                pKeyAll:"TICKET_SUPPLIER_ID",
                name: "NAME",
                type: "all"
            });
            MultiplySelect_suply.init(function(){});
        });


        callback();
    };
})();
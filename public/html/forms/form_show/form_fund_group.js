(function () {
    var instance = MB.O.forms["form_fund_group"];
    instance.custom = function (callback) {
        var Tabs = new TabsClass();
        $("#TAB_found_group_modal_access_user").click(function(){
            var id = MB.O.forms.form_fund_group.activeId;
            $(".form_fund_group_access_user-content-wrapper").html("");
            var table = new MB.Table({
            world: "form_fund_group_access_user", 
            name: "tbl_fund_group_user_access", 
            params: {
                parentkeyvalue: id, 
                parentobject: "form_fund_group", 
                parentobjecttype: "form"}
            });
            table.create(function () {});
            log(MB.Table.hasloaded("tbl_fund_group_user_access"))
        })
        $("#TAB_found_group_modal_access_agent").click(function(){
            var id = MB.O.forms.form_fund_group.activeId;
            $(".form_fund_group_access_agent-content-wrapper").html("");
            var table = new MB.Table({
            world: "form_fund_group_access_agent", 
            name: "tbl_fund_group_agent_access", 
            params: {
                parentkeyvalue: id, 
                parentobject: "form_fund_group", 
                parentobjecttype: "form"}
            });
            table.create(function () {});
            log(MB.Table.hasloaded("tbl_fund_group_agent_access"))
        })
        callback();
    };
})();


    /*
    $("#TAB_found_groups_modal_access_user").click(function(){
        var id = MB.O.forms.form_fund_group.activeId
        var MultiplySelect = new MultiplySelectClass({selector:"#found_groups_modal_access_user",thisId:"3",subcommandEx:"customer_user",subcommandAll:"user_for_customer_user",pKey:"customer_id",pKeyEx:"USER_ID",pKeyAll:"CUSTOMER_USER_ID"});
        MultiplySelect.init(function(){});
    })
    $("#TAB_found_groups_modal_access_inst").click(function(){
        var MultiplySelect = new MultiplySelectClass({selector:"#found_groups_modal_access_user",thisId:"3",subcommandEx:"fund_group_agent_access",subcommandAll:"user_for_customer_user",pKey:"customer_id",pKeyEx:"USER_ID",pKeyAll:"CUSTOMER_USER_ID"});
        MultiplySelect.init(function(){});
    })
    */

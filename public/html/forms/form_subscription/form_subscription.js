(function () {
    var instance = MB.O.forms["form_subscription"];
    instance.custom = function (callback) {
        var id = MB.O.forms.form_subscription.activeId;
        // var Tabs = new TabsClass();
        var MultiplySelect = new MultiplySelectClass({
            titleEx: "Мероприятия включенные в абонемент",
            titleAll: "Мероприятия доступные для включения в абонемент",
            selector:"#subscription_modal_actions",
            thisId:id,
            subcommandEx:"subscription_item",
            subcommandAll:"action_for_subscription",
            pKey:"SUBSCRIPTION_ID",
            pKeyEx:"ACTION_ID",
            pKeyAll:"SUBSCRIPTION_ITEM_ID",
            name:"ACTION_WITH_DATE",
            paramsAll:{subscription_id:id}

        });
        MultiplySelect.init(function(){});

        $("#TAB_subscription_modal_price").click(function(){
            $(".form_subcription_price-content-wrapper").html("");
            var table = new MB.Table({
            world: "form_subscription_price", //
            name: "tbl_subscription_price", 
            params: {
                parent: instance,
                parentkeyvalue: id,
                // parentobject: "form_fund_group", 
                parentobject: "form_subscription",
                parentobjecttype: "form"}
            });
            table.create(function () {});
        });
        callback();
    };
})();
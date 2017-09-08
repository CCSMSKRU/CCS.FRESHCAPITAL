(function () {
    var instance = MB.O.forms["form_customer"];
    instance.custom = function (callback) {
        var id = MB.O.forms.form_customer.activeId;
        var Tabs = new TabsClass();
        var MultiplySelect = new MultiplySelectClass({
            selector:"#client-users",
            thisId:id,
            subcommandEx:"customer_user",
            subcommandAll:"user_for_customer_user",
            pKey:"customer_id",
            pKeyEx:"USER_ID",
            pKeyAll:"CUSTOMER_USER_ID",
            name: "FULLNAME_WITH_LOGIN"
        });
        MultiplySelect.init(function(){});
        callback();
    };
})();
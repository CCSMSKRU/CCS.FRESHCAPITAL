(function () {
    var instance = MB.O.forms["form_agent"];
    instance.custom = function (callback) {
        var id = instance.activeId;
        var Tabs = new TabsClass({
            instance: instance
        });
//        var MultiplySelect = new MultiplySelectClass({
//            selector:"#client-users",
//            thisId:id,
//            subcommandEx:"agent_user",
//            subcommandAll:"user_for_agent_user",
//            pKey:"agent_id",
//            pKeyEx:"USER_ID",
//            pKeyAll:"AGENT_USER_ID",
//            name: "FULLNAME_WITH_LOGIN"
//        });
//        MultiplySelect.init(function(){});
        callback();
    };
})();
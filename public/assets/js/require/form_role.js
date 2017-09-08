$(document).ready(function(){

    var id = MB.O.forms.form_role.activeId
    var MultiplySelect = new MultiplySelectClass({selector:"#rolesModalTabUsersContent",thisId:id,subcommandEx:"subscription_item",subcommandAll:"action_for_subscription",pKey:"subscription_id",pKeyEx:"SUBSCRIPTION_ITEM_ID",pKeyAll:"ACTION_ID",whereAll:"",exName:"ACTION"})
    MultiplySelect.init(function(){});

})
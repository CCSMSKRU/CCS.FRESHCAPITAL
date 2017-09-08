$(document).ready(function(){
    
    $("#TAB_subscription_modal_actions").click(function(){
        var id = MB.O.forms.form_subscription.activeId
        var MultiplySelect = new MultiplySelectClass({selector:"#subscription_modal_actions",thisId:id,subcommandEx:"subscription_item",subcommandAll:"action_for_subscription",pKey:"subscription_id",pKeyEx:"SUBSCRIPTION_ITEM_ID",pKeyAll:"ACTION_ID",whereAll:"",exName:"ACTION"})
        MultiplySelect.init(function(){});
    })

})
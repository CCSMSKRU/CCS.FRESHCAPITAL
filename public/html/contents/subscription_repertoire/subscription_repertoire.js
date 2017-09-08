
function subscription_repertoire_init(){
    var instance = MB.O.contents["subscription_repertoire"];

    //var environment = MB.Content.find(id);
    var environment = {};
    /*instance.custom = function (callback) {
        //console.log(instance);
        callback();
    };*/
    var table = new MB.Table({
        world: "content_subscription_repertoire",
        /*name: instance.profile.general.childobject,*/
        name: "table_subscription_repertoire",
        params: {
            parentkeyvalue: instance.activeId,
            parentobject: instance.name,
            parentobjecttype: "content"}
    });
    table.create(function () {
        var instanceTbl = MB.O.tables["table_subscription_repertoire"];
        $("#table_subscription_repertoire tr").on("click",function(){
            var id = $(this).data("row");
            var field_num = instanceTbl.data.names.indexOf('ACTION_ID');
            var row_num;
            for (var i in instanceTbl.data.data){
                if (instanceTbl.data.data[i][0]==id){
                    row_num = i;
                    break;
                }
            }
            var action_id = instanceTbl.data.data[row_num][field_num];

            if (environment.selectedRow==id) return;
            socketQuery({command:"get",object:"action_price_info",params:{action_id:action_id}},function(data){
                var obj = socketParse(data);

                var price = '';
                var count = '';
                for (var k in obj){
                    price+='<th class="one_price">' +

                        '<div class="one_price_color" style="background-color: '+obj[k].COLOR+';"></div>' +
                        '<div class="one_price_name">'+obj[k].PRICE+'</div>'+
                        '</th>';

                    count+='<td class="one_count">'+obj[k].FREE_PLACE_COUNT+'</td>';

                }

                $("#box_for_subscription_free_place_info").html('<thead><tr>'+price+'</tr></thead>'+'<tbody><tr>'+count+'</tr></tbody>');
                //$("#total_free_count").html(data.TOTAL_FREE_COUNT);
                environment.selectedRow = id;
            });
        });
    });

}
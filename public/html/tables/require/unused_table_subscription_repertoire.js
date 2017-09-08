
(function(){
    var tableNId = $('.page-content-wrapper .classicTableWrap').data('id');
    var tableInstance = MB.Tables.getTable(tableNId);
    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option1',
            title: 'Открыть в форме',
            disabled: function(){
                return false;
            },
            callback: function(){
                tableInstance.openRowInModal();
            }
        },
        {
            name: 'option2',
            title: 'Перейти к продаже',
            disabled: function(){
                return false;
            },
            callback: function(){
                var selArr = tableInstance.ct_instance.getIndexesByData();
                var act = tableInstance.data.data[selArr[0]];
                var actionId = act['ACTION_ID'];

                var action_label = act['ACTION'];
                var actionTitle =  act['NAME']+" | "+act['HALL_NAME'];
                var isSubscription = true;

                MB.Core.switchModal({type:"content", filename:"one_action", params:{action_id:actionId, title : actionTitle, label:action_label, isSubscription: isSubscription}});
            }
        }
    ];
}());

//
//(function () {
//    var instance = MB.O.tables["table_subscription_repertoire"];
//    instance.custom = function (callback) {
//
//
//        var handsontableInstance = instance.$container.find(".handsontable").handsontable("getInstance");
//        handsontableInstance.updateSettings({contextMenu: false});
//        handsontableInstance.updateSettings({
//            contextMenu: {
//                callback: function(key, options) {
//                    var arr, data, handsontableInstance, i, value, _i, _len;
//                    if (key === "openInModal") {
//                        MB.Table.createOpenInModalContextMenuItem(instance, key, options);
//                    } else if(key === "goToPayd"){
//                        var handsontableInstance = instance.$container.find(".handsontable").handsontable("getInstance");
//                        data = handsontableInstance.getData();
//                        var row_num = handsontableInstance.getSelected()[0];
//                        var field_num = instance.data.names.indexOf('ACTION_ID');
//                        var actionName = instance.data.names.indexOf('NAME');
//                        var field_label = instance.data.names.indexOf('ACTION');
//                        var hallIndex = instance.data.names.indexOf('HALL_NAME');
//                        var id = instance.data.data[row_num][field_num];
//                        var action_label = instance.data.data[row_num][field_label];
//                        var actionTitle =  instance.data.data[row_num][actionName]+" | "+instance.data.data[row_num][hallIndex];
//                        var isSubscription = true;
//                        MB.Core.switchModal({type:"content", filename:"one_action", params:{action_id:id, title : actionTitle, label:action_label, isSubscription: isSubscription}});
//                        // MB.Core.switchModal({type:"content", filename:"one_action", params:{action_id:id, label:action_label, action_name:action_label}});
//                    }
//                },
//                items: {
//                    openInModal: {
//                        name: "Открыть в форме..."
//                    },
//                    goToPayd: {
//                        name: "Перейти к продаже..."
//                    }
//                }
//            }
//        });
//        // instance.contextmenu["custom1"] = {
//        //     name: "Перейти к продаже",
//        //     callback: function (key, options) {
//        //         var id = options.$trigger.data("row");
//        //         var field_num = instance.data.names.indexOf('ACTION_ID');
//        //         var row_num;
//        //         for (var i in instance.data.data){
//        //             if (instance.data.data[i][0]==id){
//        //                 row_num = i;
//        //                 break;
//        //             }
//        //         }
//        //         var action_id = instance.data.data[row_num][field_num];
//        //         MB.Core.switchModal({type:"content", filename:"one_action", params:{action_id:action_id, label:"Абонимент"}});
//        //     }
//        // };
//
//        // var query = "#" + instance.world + "_" + instance.name + "_wrapper table tbody tr";
//        // $.contextMenu("destroy", query);
//        // $.contextMenu({
//        //     selector: query,
//        //     items: instance.contextmenu
//        // });
//        callback();
//    };
//}());


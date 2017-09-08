(function(){
    var tableNId = $('.page-content-wrapper .classicTableWrap').data('id');
    var tableInstance = MB.Tables.getTable(tableNId);
    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option1',
            title: 'Перейти к схеме проходов',
            disabled: function(){
                return false;
            },
            callback: function(){
                var sel = tableInstance.ct_instance.getIndexesByData(true);
                var act = tableInstance.data.data[sel];
                var selRow =  tableInstance.ct_instance.getIndexesByData(true);
                var action_id = 	tableInstance.data.data[selRow]['ACTION_ID'];
                var title = 		"Схема проходов для " + tableInstance.data.data[selRow]['HALL_NAME'] + " | " + tableInstance.data.data[selRow]['HALL_NAME'];
                var age_category = 	tableInstance.data.data[selRow]['AGE_CATEGORY'];
                var date_time = 	tableInstance.data.data[selRow]['ACTION_DATE'];
                var hall = 			tableInstance.data.data[selRow]['HALL'];

                MB.Core.switchModal({
                    type:"content",
                    isNew: true,
                    filename:"action_skd",
                    params:{
                        action_id:action_id,
                        action: act,
                        title: title,
                        age_category: age_category,
                        date_time: date_time,
                        hall: hall
                    }
                });
            }
        }
    ];

}());

(function () {

    return;
	
	var instance = MB.O.tables["table_current_action_skd"];
	
	instance.custom = function (callback) {

		var handsontableInstance = instance.$container.find(".handsontable").handsontable("getInstance");
		handsontableInstance.updateSettings({contextMenu: false});
		handsontableInstance.updateSettings({
			contextMenu: {
				callback: function(key, options) {
					var arr, data, handsontableInstance, i, value, _i, _len;
					switch (key){
						case "goToScheme":
							var handsontableInstance = instance.$container.find(".handsontable").handsontable("getInstance");
							var selectedRows = MB.Table.getSelectedRowsInterval(handsontableInstance);						

							if(selectedRows[0] == selectedRows[1]){

								var action_id = 	instance.data.data[selectedRows[0]]['ACTION_ID'];
								var title = 		instance.data.data[selectedRows[0]]['NAME'];
								var age_category = 	instance.data.data[selectedRows[0]]['AGE_CATEGORY'];
								var date_time = 	instance.data.data[selectedRows[0]]['ACTION_DATE'];
								var hall = 			instance.data.data[selectedRows[0]]['HALL'];

								MB.Core.switchModal({
									type:"content",
									filename:"action_skd",
									params:{
										action_id:action_id,
									 	title: title,
										age_category: age_category,
										date_time: date_time,
										hall: hall
									}
								});	
							}							
						break;						
					}
				},
				items: {
					goToScheme: {
						name: "Перейти к схеме проходов"
					}
				}
			}
		});
	callback();
	}
})();
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
            title: 'Копировать роль',
            disabled: function(){
                return false;
            },
            callback: function(){
                tableInstance.makeOperation('copy_role');
            }
        }
    ];

}());

(function () {
	return;
	var instance = MB.O.tables["table_role"];
	
	instance.custom = function (callback) {

		var handsontableInstance = instance.$container.find(".handsontable").handsontable("getInstance");
		handsontableInstance.updateSettings({contextMenu: false});
		handsontableInstance.updateSettings({
			contextMenu: {
				callback: function(key, options) {
					var arr, data, handsontableInstance, i, value, _i, _len;
					switch (key){
						case "goToEditRole":
							handsontableInstance = instance.$container.find(".handsontable").handsontable("getInstance");
                            var selectedRows = MB.Table.getSelectedRowsInterval(handsontableInstance);

							if(selectedRows[0] == selectedRows[1]){

								var role_id = instance.data.data[selectedRows[0]]['ROLE_ID'];
								MB.Core.switchModal({
									type:"content",
									filename:"roleAccess",
									params:{
										role_id: role_id
									}
								});	
							}							
						    break;
                        case "manualSetting":
                            MB.Table.createOpenInModalContextMenuItem(instance, key, options);
                            break;
                        case "copyRole":
                            handsontableInstance = instance.$container.find(".handsontable").handsontable("getInstance");
                            var selectedRows2 = MB.Table.getSelectedRowsInterval(handsontableInstance);
                            var role_id2 = instance.data.data[selectedRows2[0]]['ROLE_ID'];
                            var o = {
                                command: 'operation',
                                object: 'copy_role',
                                params: {
                                    role_id: role_id2
                                }
                            };
                            socketQuery(o, function(res){
                                socketParse(res);
                                instance.reload('data');
                            });
                            break;
					}
				},
				items: {
					goToEditRole: {
						name: "Перейти к настройке"
					},
                    manualSetting: {
                        name: "Открыть в форме"
                    },
                    copyRole: {
                        name: "Копировать роль"
                    }
				}
			}
		});
	callback();
	}
})();
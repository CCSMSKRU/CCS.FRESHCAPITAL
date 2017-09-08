(function () {

    var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);
    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option1',
            title: 'Выбрать',
            disabled: function(){
                return false;
            },
            callback: function(){
                var id = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex][tableInstance.profile['extra_data']['object_profile']['primary_key']];
                var title = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex]['NAME'];
                tableInstance.parentObject.params.setFundZoneSchemeCb(id, title);
            }
        },
        {
            name: 'option2',
            title: 'Сделать схемой по умолчанию',
            disabled: function(){
                return false;
            },
            callback: function(){
                var row = tableInstance.ct_instance.selectedRowIndex;
                var  o = {
                    command: "operation",
                    object: "set_fund_zone_default",
                    params: {
                        FUND_ZONE_ID: tableInstance.data.data[row]['FUND_ZONE_ID']
                    }
                };
                socketQuery(o, function (res) {
                    socketParse(res);
                    tableInstance.reload();
                });
            }
        }
    ];

}());


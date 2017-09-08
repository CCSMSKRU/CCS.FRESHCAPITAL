(function(){

    var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);

    tableInstance.ct_instance.lowerButtons = [
        {
            title: 'Добавить запрос',
            color: "dark",
            icon: null,
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: [],
                matching: [],
                colValues: []
            }],
            handler: function() {
                //tableInstance.makeOperation('integration_load_all_actions', function(){
                //    tableInstance.reload();
                //});
            }
        }
    ];

}());


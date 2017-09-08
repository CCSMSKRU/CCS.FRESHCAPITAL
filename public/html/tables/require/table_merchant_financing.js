(function () {

    var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);


    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option1',
            title: 'Открыть в форме',
            disabled: function () {
                return false;
            },
            callback: function () {



                var row = tableInstance.ct_instance.selectedRowIndex;

                var financingFormId = MB.Core.guid();

                var financing_id = tableInstance.data.data[row].id;

                var work_statuses = ['ACQUIRING_IN_PROCCESS', 'READY_TO_WORK', 'CLOSED'];

                var form_name = (work_statuses.indexOf(tableInstance.data.data[row].status_sysname) == -1 )? 'form_merchant_financing' : 'form_merchant_financing_work';


                console.log('tableInstance.data.data[row].status_sysname', tableInstance.data.data[row].status_sysname);

                var openInModalO = {
                    id: financingFormId,
                    name: form_name,
                    class: 'merchant_financing',
                    client_object: form_name,
                    type: 'form',
                    ids: [financing_id],
                    position: 'center',
                    tablePKeys: {data_columns: ['id'], data: [financing_id]}
                };

                var form = new MB.FormN(openInModalO);
                form.create(function () {
                    var modal = MB.Core.modalWindows.windows.getWindow(financingFormId);
                });

            }
        }
    ];

}());
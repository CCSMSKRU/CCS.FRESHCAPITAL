(function(){

    var tableNId = $('.page-content-wrapper .classicTableWrap').data('id');
    var tableInstance = MB.Tables.getTable(tableNId);
    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option1',
            title: 'Посмотреть отчет',
            disabled: function(){
                return false;
            },
            callback: function(){
                var o = {
                    command: "get",
                    object: "report_from_report_archive",
                    report_archive_id: tableInstance.data.data[tableInstance.ct_instance.getIndexesByData(true)][tableInstance.profile['extra_data']['object_profile']['primary_key']]
                };

                socketQuery(o, function(res){
                    if (!(res = socketParse(res))) return;

                    var myWindow = window.open("","MsgWindow","width=" + $(window).outerWidth() + ",height=" + $(window).outerHeight());
                    myWindow.document.write("<html><head><link rel='stylesheet' href='html/report/report.css'></head><body><div id='report'>" + res.data + "</div></body></html>");
                    myWindow.print();
                });
            }
        }
    ];
}());

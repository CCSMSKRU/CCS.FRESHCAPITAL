(function (){
    var tableNId = $('.page-content-wrapper .classicTableWrap').data('id');
    var tableInstance = MB.Tables.getTable(tableNId);

    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option1',
            title: 'Напечатать накладную',
            disabled: function(){
                return false;
            },
            callback: function(){
                $('.iFrameForPrint').remove();
//                var delivery_note = tableInstance.data.DATA[tableInstance.ct_instance.getIndexesByData(true)][tableInstance.data.NAMES.indexOf("DELIVERY_NOTE")];
                var delivery_note = tableInstance.data.data[tableInstance.ct_instance.getIndexesByData(true)]["TICKET_PACK_HIST_ID"];
                var getStr = "?sid=" + MB.User.sid+"&ticket_pack_hist_id="+delivery_note+"&object=report_delnote_ticket_pack";
                var iFrame = "<iframe class=\"iFrameForPrint\" src=\"" + "html/report/print_report.html" + getStr + "\" width=\"0\" height=\"0\" align=\"left\"></iframe>";
                $("body").append(iFrame);
            }
        }
    ];
}());

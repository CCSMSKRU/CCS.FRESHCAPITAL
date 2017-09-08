(function() {

    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_action_scheme_item_history', formID);
    var formWrapper = $('#mw-' + formInstance.id);

    var modalInstance = MB.Core.modalWindows.windows.getWindow(formID);
    //modalInstance.stick = 'top';
    //modalInstance.stickModal();
    //&lt;br&gt;
    var status_text = formInstance.data.data[0]['STATUS_TEXT'].split("&lt;br&gt;");
    $('div[data-column=STATUS_TEXT]').find(".form-ro-value").html(status_text.join("<br/>"));

    socketQuery({
        command: "get",
        object: "order_ticket",
        params: {
            where: "ORDER_TICKET_ID = '" + formInstance.data.data[0]['ORDER_TICKET_ID'] + "'"
        }
    }, function (data) {
        var obj = socketParse(data);
        $('div[data-barcode=BARCODE]').find(".form-ro-value").html(obj[0]["BARCODE"]);
        $('div[data-column=BARCODE]').find(".form-ro-value").html(obj[0]["BARCODE"]);
        $('div[data-column=ACTION]').find(".form-ro-value").html(obj[0]["ACTION"]);
        $('div[data-column=AREA_GROUP]').find(".form-ro-value").html(obj[0]["AREA_GROUP"]);

        var barcode = formWrapper.find('.form-ro-barcode');
        barcode.html(DrawCode39Barcode(barcode.attr('data-barcode'), 0));
    });

    if(formInstance.data.data[0]['FUND_GROUP_ID'] > 1) {
        socketQuery({
            command: "get",
            object: "fund_group",
            params: {
                where: "FUND_GROUP_ID = '" + formInstance.data.data[0]['FUND_GROUP_ID'] + "'"
            }
        }, function (data) {
            var obj = socketParse(data);
            $('div[data-column=FUND_GROUP_ID]').find(".form-ro-value").html(obj[0]["NAME"]);
        });
    }
}());

(function () {
    var modal = $('.mw-wrap').last();
    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_invested_merchant', formID);
    var formWrapper = $('#mw-' + formInstance.id);
    var modalInstance = MB.Core.modalWindows.windows.getWindow(formInstance.id);


    //formInstance.lowerButtons = [
    //    {
    //        title: 'Загнать тестовую транзакцию',
    //        color: "dark",
    //        icon: 'fa-plus',
    //        type: "SINGLE",
    //        hidden: false,
    //        condition: [{
    //            colNames: [],
    //            matching: [],
    //            colValues: []
    //        }],
    //        handler: function () {
    //            var o = {
    //                command: 'add',
    //                object: 'merchant_payment_registry',
    //                client_object: 'tbl_merchant_payment_registry',
    //                params: {
    //                    merchant_id: formInstance.activeId,
    //                    datetime: '15.12.2015 16:00:00',
    //                    is_default: false,
    //                    amount: 15000,
    //                    complete_percent: 1,
    //                    total_paid: 15000,
    //                    total_to_pay: 14850000
    //                }
    //            };
    //            socketQuery(o, function (res) {
    //                //tableInstance.reload();
    //            });
    //
    //        }
    //    }
    //];

}());

(function () {
    var modal = $('.mw-wrap').last();
    var formID = MB.Forms.justLoadedId;
    console.log('formID',formID);
    var formInstance = MB.Forms.getForm('form_order_additional_service', formID);
    var formWrapper = $('#mw-' + formInstance.id);

    formWrapper.find('.mw-save-form').hide(0);

    var barcode = formWrapper.find('.form-ro-barcode');
    barcode.html(DrawCode39Barcode(barcode.attr('data-barcode'), 0));

    formInstance.lowerButtons = [
        /*{
         title: 'Вернуть билет',
         color: "blue",
         icon: "fa-reply",
         type: "DOUBLE",
         hidden: false,
         condition: [{
         colNames: ['STATUS', 'STATUS', 'STATUS', 'STATUS'],
         matching: ['not_equal', 'not_equal', 'not_equal', 'not_equal'],
         colValues: ['ON_REALIZATION', 'PAID', 'CLOSED_REALIZATION', 'CLOSED']
         }],
         handler: function () {
         bootbox.dialog({
         message: "Вы уверены, что хотите вернуть билет?",
         title: "Внимание!",
         buttons: {
         yes_btn: {
         label: "Да, уверен",
         className: "green",
         callback: function () {
         formInstance.makeOperation('return_ticket');
         }
         },
         cancel: {
         label: "Отмена",
         className: "blue"
         }
         }
         });
         }
         },*/
        {
            title: 'Выставить "Услуга проверена"',
            color: "red",
            icon: "fa-ticket",
            type: "DOUBLE",
            hidden: false,
            condition: [{
                colNames: ['STATUS', 'STATUS', 'STATUS', 'STATUS'],
                matching: ['not_equal', 'not_equal', 'not_equal', 'not_equal'],
                colValues: ['PAID', 'CLOSED', 'ON_REALIZATION', 'CLOSED_REALIZATION']
            }],
            handler: function () {
                var rand = Date.now();
                bootbox.dialog({
                    message: 'Вы уверены что хотите выставить "Услуга проверена"?',
                    title: 'Выставление "Услуга проверена"',
                    buttons: {
                        yes_btn: {
                            label: "Да, уверен",
                            className: "yellow",
                            callback: function () {
                                formInstance.makeOperation('set_scanned_status_for_order_additional_service', function (r) {
                                    formInstance.reload();
                                });
                            }
                        },
                        cancel: {
                            label: "Отмена",
                            className: "blue"
                        }
                    }
                });
            }
        },
        {
            title: 'Выставление "Услуга не проверена"',
            color: "red",
            icon: "fa-ticket",
            type: "DOUBLE",
            hidden: false,
            condition: [{
                colNames: ['STATUS', 'STATUS', 'STATUS', 'STATUS'],
                matching: ['not_equal', 'not_equal', 'not_equal', 'not_equal'],
                colValues: ['PAID', 'CLOSED', 'ON_REALIZATION', 'CLOSED_REALIZATION']
            }],
            handler: function () {
                var rand = Date.now();
                bootbox.dialog({
                    message: 'Вы уверены что хотите выставить "Услуга не проверена"?',
                    title: 'Выставление "Услуга не проверена"',
                    buttons: {
                        yes_btn: {
                            label: "Да, уверен",
                            className: "yellow",
                            callback: function () {
                                formInstance.makeOperation('clear_scan_status_for_order_additional_service', function (r) {
                                    formInstance.reload();
                                });
                            }
                        },
                        cancel: {
                            label: "Отмена",
                            className: "blue"
                        }
                    }
                });
            }
        }
    ];


    formWrapper.find('.form-field-parent-object-link').off('click').on('click', function () {
        var formId = MB.Core.guid();
        var tablePKeys = {data_columns: ['ORDER_ID'], data: [formInstance.data.data[0]['ORDER_ID']]};
        var openInModalO = {
            id: formId,
            name: ([formInstance.data.data[0]['ORDER_TYPE']] == 'ORDER') ? 'form_order' : 'form_order_web',
            type: 'form',
            ids: [formInstance.data.data[0]['ORDER_ID']],
            position: 'shift',
            tablePKeys: tablePKeys
        };
        var form = new MB.FormN(openInModalO);
        form.create(function () {
            var modal = MB.Core.modalWindows.windows.getWindow(formId);
            $(modal).on('close', function () {
                formInstance.reload();
            });

            $(form).on('update', function () {
                formInstance.reload();
            });
        });
    });

})();

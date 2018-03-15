(function () {

    var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);

    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option0',
            title: 'Открыть финансирование',
            disabled: function(){
                var row = tableInstance.ct_instance.selectedRowIndex;
                return tableInstance.data.data[row].merchant_financing_id == '';
            },
            callback: function(){

                var row = tableInstance.ct_instance.selectedRowIndex;

                var financingFormId = MB.Core.guid();
                var financing_id = tableInstance.data.data[row].merchant_financing_id;

                if(financing_id != ''){

                    var o = {
                        command: 'get',
                        object: 'merchant_financing',
                        params:{
                            param_where: {
                                id: financing_id
                            }
                        }
                    };

                    socketQuery(o, function(res){

                        if(!res.code){
                            var financing_data = res.data[0];

                            var work_statuses = ['ACQUIRING_IN_PROCCESS', 'READY_TO_WORK', 'CLOSED', 'WAIT_BANK_CONFIRM', 'BANK_CONFIRM', 'WAIT_INVESTOR'];

                            var form_name = (work_statuses.indexOf(financing_data.status_sysname) == -1 )? (financing_data.closing_financing_id != '')? 'form_merchant_refinancing' : 'form_merchant_financing_work_2' : 'form_merchant_financing_work_2';

                            //
                            //if(financing_data.closing_financing_id != ''){
                            //    form_name = 'form_merchant_refinancing';
                            //}


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

                        }else{

                        }
                    });

                }else{
                    toastr['info']('Внимание', 'Не удалось получить финансирование.');
                }

            }
        }
    ];

    var lastInput;
    var lastInputIndex;

    var inv = {
        financing: {},
        data: {
            short_name: 'ООО "Ромашка"',
            financing_start_date: '12.03.2017',
            invoices:[
                {
                    id:1,
                    number:123,
                    date: '20.05.2017',
                    amount: 5000,
                    payments:[
                        {
                            id:1,
                            date: '19.05.2017',
                            amount: 5000
                        }
                    ]
                }
            ],
            current_date: '30.05.2017',
            current_amount: 5000,
            all_amount: 10000,
            pre_invoices:[
                {
                    id:1,
                    number:123,
                    date: '20.05.2017',
                    amount: 5000,
                    payments:[
                        {
                            id:1,
                            date: '19.05.2017',
                            amount: 5000
                        }
                    ]
                }
            ]
        },
        tpl:'<div class="invoice-header">Выставить счёт: {{short_name}}, финансирование от {{financing_start_date}}</div>' +
            '<div class="invoice-list-box">' +
            '<div class="invoice-list-header">Список выставленных счетов (не оплаченных):</div>' +
            '<div class="invoice-list-empty">{{invoices_empty}}</div>' +
            '<div class="invoice-list">' +
            '{{#invoices}}' +
            '<div class="inv-item-box" data-id="{{id}}">' +
            '<div class="inv-item-header">' +
            '<div class="inv-item-title">Счёт №{{number}} от {{date}} на сумму {{amount}} руб.</div>' +
            '<div class="inv-item-buttons">' +
            '<i class="fa fa-download inv-item-download" data-id="{{id}}"></i>' +
            '<i class="fa fa-envelope-o inv-item-send" data-id="{{id}}"></i>' +
            '</div>' +
            '</div>' +
            '<div class="inv-item-payments-box">' +
            '<div class="inv-item-payments-toggler"><i class="fa fa fa-plus-square-o"></i>&nbsp;Платежи</div>' +
            '<div class="inv-item-payments-list">' +
            '{{#payments}}' +
            '<div class="inv-item-payment" data-id="{{id}}">от {{date}} на сумму {{amount}} руб.</div>' +
            '{{/payments}}' +
            '</div>' +
            '</div>' +
            '</div>' +
            '{{/invoices}}' +
            '</div>' +
            '</div>' +
            '<div class="invoice-execute-box">' +
            '<div class="invoice-execute-header">Выставить счет:</div>' +
            '<div class="invoice-execute-params">' +
            '<div class="invoice-execute-param selected" data-case="THIS">На текущий пропущенный. ({{current_date}}) Сумма {{current_amount}} руб.</div>' +
            '<div class="invoice-execute-param" data-case="FULL">На все неоплеченные. Сумма {{all_amount}} руб.</div>' +
            '<div class="invoice-execute-param" data-case="FULL_ARBITRARY">На все неоплеченные. Сумма:<input type="number" class="invoice-execute-input invoice-execute-amount-arbitrary" /></div>' +
            '<div class="invoice-execute-param" data-case="THIS_AND_FULL">Выставить оба счета.</div>' +
            '</div>' +
            '<div class="invoice-execute-execute">Выставить</div>' +
            '</div>' +
            '<div class="invoice-pre-box">' +
            '<div class="invoice-pre-header">Будут выставлены:</div>' +
            '<div class="invoice-pre-empty">{{pre_invoices_empty}}</div>' +
            '<div class="invoice-pre-params">' +
            '{{#pre_invoices}}' +
            '<div class="inv-item-box" data-id="{{id}}">' +
            '<div class="inv-item-header">' +
            '<div class="inv-item-title">Счёт от {{date}} на сумму {{amount}} руб.</div>' +
            '<div class="inv-item-buttons">' +
            '<i class="fa fa-trash-o inv-pre-delete" data-id="{{id}}"></i>' +
            '<i class="fa fa-download inv-download" data-id="{{id}}"></i>' +
            '<i class="fa fa-check-circle inv-billout-now" data-id="{{id}}" title="Выставить прямо сейчас"></i>' +
            '</div>' +
            '</div>' +
            '<div class="inv-item-payments-box">' +
            '<div class="inv-item-payments-toggler"><i class="fa fa fa-plus-square-o"></i>&nbsp;Платежи</div>' +
            '<div class="inv-item-payments-list">' +
            '{{#payments}}' +
            '<div class="inv-item-payment" data-id="{{id}}">от {{date}} на сумму {{amount}} руб.</div>' +
            '{{/payments}}' +
            '</div>' +
            '</div>' +
            '</div>' +
            '{{/pre_invoices}}' +
            '</div>' +
            '</div>',
        percent_tpl:'<div class="invoice-header">Выставить счёт: {{short_name}}, финансирование от {{financing_start_date}}</div>' +
            '<div class="invoice-list-box">' +
            '<div class="invoice-list-header">Список выставленных счетов (не оплаченных):</div>' +
            '<div class="invoice-list-empty">{{invoices_empty}}</div>' +
            '<div class="invoice-list">' +
            '{{#invoices}}' +
            '<div class="inv-item-box" data-id="{{id}}">' +
            '<div class="inv-item-header">' +
            '<div class="inv-item-title">Счёт №{{number}} от {{date}} на сумму {{amount}} руб.</div>' +
            '<div class="inv-item-buttons">' +
            '<i class="fa fa-download inv-download" data-id="{{id}}"></i>' +
            '<i class="fa fa-envelope-o inv-item-send" data-id="{{id}}"></i>' +
            '</div>' +
            '</div>' +
            '<div class="inv-item-payments-box">' +
            '<div class="inv-item-payments-toggler"><i class="fa fa fa-plus-square-o"></i>&nbsp;Платежи</div>' +
            '<div class="inv-item-payments-list">' +
            '{{#payments}}' +
            '<div class="inv-item-payment" data-id="{{id}}">от {{date}} на сумму {{amount}} руб.</div>' +
            '{{/payments}}' +
            '</div>' +
            '</div>' +
            '</div>' +
            '{{/invoices}}' +
            '</div>' +
            '</div>' +
            '<div class="invoice-execute-box">' +
            '<div class="invoice-execute-header">Выставить счет:</div>' +
            '<div class="invoice-execute-params">' +
            '<div class="invoice-execute-param selected" data-case="THIS">На текущий пропущенный. ({{current_date}}) Сумма (руб) <input type="number" class="invoice-execute-input invoice-execute-amount-current" /></div>' +
            '<div class="invoice-execute-param" data-case="FULL">На все неоплеченные. Сумма (руб)<input type="number" class="invoice-execute-input invoice-execute-amount-all" /></div>' +
            '<div class="invoice-execute-param" data-case="THIS_AND_FULL">' +
                'Выставить оба счета.</br>' +
                '<div class="invoice-execute-height">Сумма сегодня (руб): <input type="number" class="invoice-execute-input invoice-execute-amount-current" /></div>' +
                '<div class="invoice-execute-height">Сумма всего (руб): <input type="number" class="invoice-execute-input invoice-execute-amount-all" /></div>' +
                '</div>' +
            '</div>' +
            '<div class="invoice-execute-execute">Выставить</div>' +
            '</div>' +
            '<div class="invoice-pre-box">' +
            '<div class="invoice-pre-header">Будут выставлены:</div>' +
            '<div class="invoice-pre-empty">{{pre_invoices_empty}}</div>' +
            '<div class="invoice-pre-params">' +
            '{{#pre_invoices}}' +
            '<div class="inv-item-box" data-id="{{id}}">' +
            '<div class="inv-item-header">' +
            '<div class="inv-item-title">Счёт от {{date}} на сумму {{amount}} руб.</div>' +
            '<div class="inv-item-buttons">' +
            '<i class="fa fa-trash-o inv-pre-delete" data-id="{{id}}"></i>' +
            '<i class="fa fa-download inv-download" data-id="{{id}}"></i>' +
            '<i class="fa fa-check-circle inv-billout-now" data-id="{{id}}" title="Выставить прямо сейчас"></i>' +
            '</div>' +
            '</div>' +
            '<div class="inv-item-payments-box">' +
            '<div class="inv-item-payments-toggler"><i class="fa fa fa-plus-square-o"></i>&nbsp;Платежи</div>' +
            '<div class="inv-item-payments-list">' +
            '{{#payments}}' +
            '<div class="inv-item-payment" data-id="{{id}}">от {{date}} на сумму {{amount}} руб.</div>' +
            '{{/payments}}' +
            '</div>' +
            '</div>' +
            '</div>' +
            '{{/pre_invoices}}' +
            '</div>' +
            '</div>',
        closebill_tpl:'<div class="invoice-header">Оплатить счёта: {{short_name}}, финансирование от {{financing_start_date}}</div>' +
            '<div class="invoice-list-box">' +
            '<div class="invoice-list-header">Список выставленных счетов (не оплаченных):</div>' +
            '<div class="invoice-list-empty">{{invoices_empty}}</div>' +
            '<div class="invoice-list">' +
            '{{#invoices}}' +
            '<div class="inv-item-box" data-id="{{id}}">' +
            '<div class="inv-item-header">' +
            '<div class="inv-item-title">Счёт №{{number}} от {{date}} на сумму {{amount}} руб.</div>' +
            '<div class="inv-item-buttons">' +
            '<i class="fa fa-download inv-download" data-id="{{id}}"></i>' +
            '<i class="fa fa-envelope-o inv-item-send" data-id="{{id}}"></i>' +
            '</div>' +
            '</div>' +
            '<div class="inv-item-payments-box">' +
            '<div class="inv-item-payments-toggler"><i class="fa fa fa-plus-square-o"></i>&nbsp;Платежи</div>' +
            '<div class="inv-item-payments-list">' +
            '{{#payments}}' +
            '<div class="inv-item-payment" data-id="{{id}}">от {{date}} на сумму {{amount}} руб.</div>' +
            '{{/payments}}' +
            '</div>' +
            '</div>' +
            '</div>' +
            '{{/invoices}}' +
            '</div>' +
            '</div>' +
            '<div class="invoice-execute-box">' +
                '<div class="invoice-close-bill">Оплатить счёт</div>' +
            '</div>',
        freeAmountTpl: '<div class="invoice-header">Оплатить сумму (без конкретного счёта): {{short_name}}, финансирование от {{financing_start_date}}</div>' +
                        '<div class="invoice-free-box">' +
        '<div class="form-group">' +
        '<label>Введите сумму пришедшую от контрагента без указания счета:</label>' +
        '<label class="invoice-free-sub">Сумма будет расперделена между пропущенными ранее платежами, выставленные на данные платежи счета будут аннулированы.</label>' +
        '<input type="number" class="form-control invoice-free-amount"/>' +
        '</div>' +
        '<div class="invoice-free-header">Выберите платежи, которые надо отметить как закрытые:</div>' +
        '<div class="invoice-free-percent-default-list">{{#payments}}' +
            '<div class="invoice-free-percent-default-payment" data-id="{{id}}">{{type_text}} платеж{{partial_paid_amount}} за {{default_date}}</div>' +
        '{{/payments}}</div>' +
        '<div class="invoice-free-radio">' +
            '<label class="curpointer"><input type="radio" class="invoice-free-radio-check" checked="checked" name="closetype" data-type="QUEUE"/> Последовательно оплатить платежи согласно расчентой ожидаемой сумме</label>' +
            '<label class="curpointer"><input type="radio" class="invoice-free-radio-check" name="closetype" data-type="SPLIT"/> Распределить сумму между выбранными платежами </label><br/>' +
            '<label class="curpointer"><input type="radio" class="invoice-free-radio-check" name="closetype" data-type="PREPAID"/> Авансом (все деньги будут записаны в текущий платеж) </label><br/>' +
        '</div>' +
        '<div class="invoice-free-execute">Оплатить</div>' +
        '</div>',

        init: function (rowdata) {

            inv.incData = rowdata;

            if(inv.incData.closebill){

                inv.getDataCloseBill(function () {
                    inv.run();
                    inv.setHandlers();
                });

            }else{

                if(inv.incData.freeAmount){

                    inv.getDataFreeAmount(function () {
                        inv.run();
                        inv.setHandlers();
                    });

                }else{

                    inv.getData(function () {
                        inv.run();
                        inv.setHandlers();
                    });
                }
            }
        },
        getDataFreeAmount: function (cb) {
            var o = {
                command: 'get',
                object: 'merchant_financing',
                params: {
                    param_where: {
                        id: inv.incData.merchant_financing_id
                    }
                }
            };

            socketQuery(o , function (res) {

                if (res.code) {
                    console.log('ERR', res);
                    return false;
                }

                inv.financing = res.data[0];

                inv.data.payments = [];

                var o2 = {
                    command: 'get',
                    object: 'daily_payment',
                    params: {
                        where: [
                            {
                                key: 'merchant_financing_id',
                                val1: inv.financing.id
                            },
                            {
                                key: 'status_sysname',
                                type: 'in',
                                val1: ['DEFAULT','PARTIAL_PAID']
                            }
                        ]
                    }
                };

                socketQuery(o2, function (res) {

                    if(res.code){
                        console.log("ERR", res);
                    }


                    inv.data.isPercent = inv.financing.financing_type_sysname == 'PERCENT';

                    for (var i in res.data) {

                        res.data[i].type_text = (res.data[i].status_sysname == 'DEFAULT') ? 'Пропущенный' : 'Част. оплаченный';
                        res.data[i].partial_paid_amount = (res.data[i].status_sysname == 'PARTIAL_PAID') ? ' ' + +res.data[i].paid_amount +  +res.data[i].paid_amount_later: '';

                        inv.data.payments.push(res.data[i]);

                    }


                    if(typeof cb == 'function'){
                        cb();
                    }

                });



            });
        },
        getDataCloseBill: function (cb) {

            var o = {
                command: 'get',
                object: 'merchant_financing',
                params: {
                    param_where: {
                        id: inv.incData.merchant_financing_id
                    }
                }
            };

            socketQuery(o , function (res) {

                if (res.code) {
                    console.log('ERR', res);
                    return false;
                }

                inv.financing = res.data[0];

                // Будут выставлены
                var o2 = {
                    command: 'get',
                    object: 'invoice',
                    params: {
                        param_where: {
                            status_sysname: 'EXPOSED',
                            //daily_payments_id: tableInstance.parent_id,
                            merchant_financing_id: inv.financing.id
                        }
                    }
                };

                socketQuery(o2, function (res) {

                    if (res.code) {
                        console.log('ERR', res);
                        return false;
                    }

                    inv.invoices = res.data;

                    var invoicesArr = [];

                    for(var i in inv.invoices){
                        var ivc = inv.invoices[i];

                        invoicesArr.push({
                            id: ivc.id,
                            number: ivc.id,
                            date: ivc.invoice_date,
                            amount: ivc.amount,
                            payments: []
                        });
                    }

                    inv.data = {
                        short_name: inv.financing.merchant_short_name,
                        financing_start_date: inv.financing.payments_start_date,
                        invoices: invoicesArr,
                        invoices_empty: (invoicesArr.length == 0)? ' - Нет счетов - ' : '',
                        current_date: tableInstance.parentObject.data.data[0].payments_for_date,
                        current_amount: inv.incData.pending_amount,
                        all_amount: inv.incData.default_pending_amount
                    };

                    if(typeof cb == 'function'){
                        cb();
                    }

                });
            });

                    },
        getData: function (cb) {

            var o = {
                command: 'get',
                object: 'merchant_financing',
                params: {
                    param_where: {
                        id: inv.incData.merchant_financing_id
                    }
                }
            };

            socketQuery(o , function (res) {

                if(res.code) {
                    console.log('ERR', res);
                    return false;
                }

                inv.financing = res.data[0];

                // Будут выставлены
                var o2 = {
                    command: 'get',
                    object: 'invoice',
                    params: {
                        param_where: {
                            status_sysname: 'CREATED',
                            daily_payments_id: tableInstance.parent_id,
                            merchant_financing_id: inv.financing.id
                        }
                    }
                };

                socketQuery(o2, function (res) {

                    if(res.code) {
                        console.log('ERR', res);
                        return false;
                    }

                    inv.pre_invoices = res.data;


                    var o3 = {
                        command: 'get',
                        object: 'invoice',
                        params: {
                            param_where: {
                                status_sysname: 'EXPOSED',
                                daily_payments_id: tableInstance.parent_id,
                                merchant_financing_id: inv.financing.id
                            }
                        }
                    };

                    socketQuery(o3, function (res) {

                        if (res.code) {
                            console.log('ERR', res);
                            return false;
                        }

                        inv.invoices = res.data;

                        var invoicesArr = [];

                        for(var i in inv.invoices){
                            var ivc = inv.invoices[i];

                            invoicesArr.push({
                                id: ivc.id,
                                number: ivc.id,
                                date: ivc.invoice_date,
                                amount: ivc.amount,
                                payments: []
                            });
                        }

                        var preInvoicesArr = [];

                        for(var i2 in inv.pre_invoices){
                            var ivc2 = inv.pre_invoices[i2];

                            preInvoicesArr.push({
                                id: ivc2.id,
                                number: ivc2.id,
                                date: ivc2.invoice_date,
                                amount: ivc2.amount,
                                payments: []
                            });
                        }

                        inv.data = {
                            short_name: inv.financing.merchant_short_name,
                            financing_start_date: inv.financing.payments_start_date,
                            invoices: invoicesArr,
                            invoices_empty: (invoicesArr.length == 0)? ' - Нет счетов - ' : '',
                            current_date: tableInstance.parentObject.data.data[0].payments_for_date,
                            current_amount: inv.incData.pending_amount,
                            all_amount: inv.incData.default_pending_amount,
                            pre_invoices: preInvoicesArr,
                            pre_invoices_empty: (preInvoicesArr.length == 0)? ' - Нет счетов - ' : '',
                        };


                        console.log('DATA', inv.financing);

                        if(typeof cb == 'function'){
                            cb();
                        }

                    });

                });

            });

        },
        run: function () {

            var tpl = (inv.incData.closebill)? inv.closebill_tpl : (inv.incData.freeAmount)? inv.freeAmountTpl : (inv.financing.financing_type_sysname == 'FIXED')? inv.tpl : inv.percent_tpl;
            var title = (inv.incData.freeAmount)? 'Оплатить сумму (без счёта)' : (inv.incData.closebill)? 'Оплатить счёт' : 'Выставление счёта';
            var modalClass = (inv.incData.freeAmount)? '': 'wide-modal';

            bootbox.dialog({
                title: title,
                message: Mustache.to_html(tpl,inv.data),
                className: modalClass+' invoice-manager-holder',
                buttons: {
                    success: {
                        label: 'Закрыть',
                        callback: function () {



                        }
                    }
                }
            });

        },
        reload: function () {

            var tpl = (inv.incData.closebill)? inv.closebill_tpl : (inv.incData.freeAmount)? inv.freeAmountTpl : (inv.financing.financing_type_sysname == 'FIXED')? inv.tpl : inv.percent_tpl;

            if(inv.incData.closebill){

                inv.getDataCloseBill(function () {
                    $('.invoice-manager-holder .bootbox-body').html(Mustache.to_html(tpl, inv.data));
                    inv.setHandlers();
                });

            }else{

                if(inv.incData.freeAmount){

                    inv.getDataFreeAmount(function () {
                        $('.invoice-manager-holder .bootbox-body').html(Mustache.to_html(tpl, inv.data));
                        inv.setHandlers();
                    });

                }else{

                    inv.getData(function () {
                        $('.invoice-manager-holder .bootbox-body').html(Mustache.to_html(tpl, inv.data));
                        inv.setHandlers();
                    });
                }
            }

        },
        setHandlers: function () {

            $('.invoice-execute-param').off('click').on('click', function () {

                if($(this).hasClass('selected')){
                    return;
                }

                $('.invoice-execute-param').removeClass('selected');

                $(this).addClass('selected');

            });

            $('.invoice-execute-execute').off('click').on('click', function () {

                var o = {
                    command: 'billout',
                    object: 'invoice',
                    params: {
                        daily_payment_id: inv.incData.id,
                        type: $('.invoice-execute-param.selected').attr('data-case')
                    }
                };

                var pay_case = ($('.invoice-execute-param.selected').attr('data-case'));

                if(inv.financing.financing_type_sysname == 'PERCENT'){

                    var amount_fld = $('.invoice-execute-param[data-case="THIS"] .invoice-execute-amount-current');
                    var full_amount_fld = $('.invoice-execute-param[data-case="FULL"] .invoice-execute-amount-all');

                    var both_amount_fld = $('.invoice-execute-param[data-case="THIS_AND_FULL"] .invoice-execute-amount-current');
                    var both_full_amount_fld = $('.invoice-execute-param[data-case="THIS_AND_FULL"] .invoice-execute-amount-all');




                    var amount;
                    var full_amount;

                    switch(pay_case){
                        case 'THIS':

                            amount = amount_fld.val();

                            if(!+amount) {
                                toastr['error']('Заполните поле сумма');
                                return false;
                            }


                            break;
                        case 'FULL':

                            full_amount = full_amount_fld.val();

                            if(!+full_amount){
                                toastr['error']('Заполните поле сумма');
                                return false;
                            }


                            break;
                        case 'THIS_AND_FULL':

                            //debugger;

                            amount = both_amount_fld.val();
                            full_amount = both_full_amount_fld.val();

                            if(!+amount || !+full_amount) {
                                toastr['error']('Заполните поле сумма');
                                return false;
                            }


                            break;
                        default:

                            break;
                    }

                    o.params.amount = amount;
                    o.params.full_amount = full_amount;
                }else if (inv.financing.financing_type_sysname == 'FIXED'){
                    var full_amount_arbitrary_fld = $('.invoice-execute-param[data-case="FULL_ARBITRARY"] .invoice-execute-amount-arbitrary');
                    if (pay_case === 'FULL_ARBITRARY'){

                        amount = +full_amount_arbitrary_fld.val();

                        if(!+amount){
                            toastr['error']('Заполните поле сумма');
                            return false;
                        }

                        o.params.amount = +amount;
                    }
                }

                socketQuery(o, function (res) {

                    if(res.code != 0){
                        console.log('ERR', res);
                    }else{

                        inv.reload();

                    }

                });

            });

            $('.invoice-free-execute').off('click').on('click', function () {

                var amount = $('.invoice-free-amount').val();

                var o = {
                    command: 'setRemittance',
                    object: 'daily_payment',
                    params: {
                        id: +inv.incData.id,
                        merchant_financing_id: inv.financing.id,
                        merchant_financing_type_sysname: inv.financing.financing_type_sysname,
                        operation_date: tableInstance.parentObject.data.data[0].payments_for_date,
                        amount_split_type: $('.invoice-free-radio-check:checked').attr('data-type'),
                        amount: amount
                    }
                };

                //if(inv.financing.financing_type_sysname == 'PERCENT'){

                var dpids = [];

                for(var i = 0; i < $('.invoice-free-percent-default-payment.selected').length; i++){

                    var item = $('.invoice-free-percent-default-payment.selected').eq(i);

                    dpids.push(+item.attr('data-id'));

                }

                o.params.daily_payment_ids = dpids;

                //}

                socketQuery(o, function (res) {

                    if(res.code != 0){
                        console.log('ERR', res);
                    }else{
                        inv.reload();

                        tableInstance.parentObject.reload();

                    }

                });

            });

            $('.inv-pre-delete').off('click').on('click', function () {

                var o = {
                    command: 'remove',
                    object: 'invoice',
                    params: {
                        id: $(this).attr('data-id')
                    }
                };

                socketQuery(o, function (res) {

                    if(res.code != 0){
                        console.log('ERR', res);
                        return false;
                    }

                    inv.reload();

                });

            });

            $('.inv-item-payments-toggler').off('click').on('click', function () {

                var box = $(this).parents('.inv-item-box').eq(0);
                var list = box.find('.inv-item-payments-list');

                var o = {
                    command: 'getPayments',
                    object: 'invoice_payment',
                    params: {
                        invoice_id: box.attr('data-id')
                    }
                };

                socketQuery(o, function (res) {

                    if(res.code){
                        console.log(res);
                        return false;
                    }


                    var tpl = '{{#payments}}<div class="inv-item-payment" data-id="{{id}}">от {{date}} на сумму {{amount}} руб.</div>{{/payments}}';
                    var mo = {
                        payments: []
                    };

                    console.log('RRR', res.payments);

                    for(var i in res.payments){

                        mo.payments.push({
                            id: res.payments[i].id,
                            date: res.payments[i].daily_payments_date,
                            amount: res.payments[i].pending_amount - res.payments[i].paid_amount
                        });
                    }

                    list.html(Mustache.to_html(tpl,mo));

                    box.toggleClass('opened');

                });



            });

            if(inv.incData.freeAmount){

                $('.invoice-free-percent-default-payment').off('click').on('click', function () {

                    $(this).toggleClass('selected');

                });

            }

            if(inv.incData.closebill){

                $('.inv-item-box').off('click').on('click', function () {

                    if($(this).hasClass('selected')){
                        return;
                    }

                    $('.inv-item-box').removeClass('selected');
                    $(this).addClass('selected');

                });

                $('.invoice-close-bill').off('click').on('click', function () {

                    var o = {
                        command:'closeBill',
                        object:'Invoice',
                        params:{
                            id: $('.inv-item-box.selected').attr('data-id'),
                            daily_payment_id: inv.incData.id,
                            operation_date: tableInstance.parentObject.data.data[0].payments_for_date
                        }
                    };

                    socketQuery(o, function(r){

                        if(r.code){

                            console.log('ERR', r);
                            return false;
                        }

                        inv.reload();
                        tableInstance.parentObject.reload();

                    });

                });


            }

            $('.inv-download').off('click').on('click', function(){

                var o = {
                    command: 'downloadInvoice',
                    object: 'invoice',
                    params: {
                        id: $(this).attr('data-id'),
                        fin_id: inv.financing.id
                    }
                };

                if(!inv.financing.through_number){
                    bootbox.dialog({
                        title: 'Сформировать счёт',
                        message: '<div class="form-group"><label>Укажите номер договора:</label><input type="text" class="form-control" id="invoice-arg-number" /></div>',
                        buttons: {
                            success: {
                                label: 'Подтвердить',
                                callback: function(){

                                    o.params.through_number = $('#invoice-arg-number').val();

                                    socketQuery(o, function(res){

                                        if(!res.code){
                                            var fileName = res.path + res.filename;
                                            var linkName = 'my_download_link' + MB.Core.guid();

                                            var nameRu = res.name_ru || res.filename;

                                            $("body").prepend('<a id="'+linkName+'" href="' + res.path + res.filename +'" download="'+ nameRu+'" style="display:none;"></a>');
                                            var jqElem = $('#'+linkName);
                                            jqElem[0].click();
                                            jqElem.remove();
                                        }

                                    });

                                }
                            },
                            error: {
                                label: 'Отмена',
                                callback: function(){

                                }
                            }
                        }
                    });
                }else{
                    socketQuery(o, function(res){

                        if(!res.code){
                            var fileName = res.path + res.filename;
                            var linkName = 'my_download_link' + MB.Core.guid();

                            var nameRu = res.name_ru || res.filename;

                            $("body").prepend('<a id="'+linkName+'" href="' + res.path + res.filename +'" download="'+ nameRu+'" style="display:none;"></a>');
                            var jqElem = $('#'+linkName);
                            jqElem[0].click();
                            jqElem.remove();
                        }

                    });
                }




            });
            $('.inv-billout-now').off('click').on('click', function(){
                var id = $(this).attr('data-id');
                bootbox.dialog({
                    title: 'Винмание!',
                    message: 'Счет будет выставлен прямо сейчас. Вы сможете его закрыть текущим числом. Если Вы не планируете его закрывать текущим числом, то нажмите отмена, счет будет выставлен при проведении всех операций.',
                    buttons: {
                        success: {
                            label: 'Продолжить',
                            callback: function () {

                                var o = {
                                    command: 'billoutNow',
                                    object: 'invoice',
                                    params: {
                                        id: id
                                    }
                                };

                                socketQuery(o, function(res){
                                    console.log(res);
                                });

                            }
                        },
                        error: {
                            label: 'Отмена',
                            callback: function () {

                            }
                        }
                    }
                });


            });
        }
    };


    tableInstance.ct_instance.customButtons = [
        {
            id: 1,
            buttons: [
                {
                    id: 'cb11',
                    icon: 'fa-check',
                    placeholder: 'Успешный платёж',
                    callback: function (rowdata) {
	                    if (!rowdata.is_working_day) {
		                    toastr['info']('У торговца выходной день. Нельзя внести изменения.');
		                    return;
	                    }

	                    function getPaidAmount(){

                            var amount = 0;
                            if(tableInstance.ct_instance.changes.length > 0){
                                for(var i in tableInstance.ct_instance.changes){

                                    var ch = tableInstance.ct_instance.changes[i];

                                    if(typeof ch.CHANGED_COLUMN_NAMES == 'object'){
                                        for(var k in ch.CHANGED_COLUMN_NAMES){
                                            var n = ch.CHANGED_COLUMN_NAMES[k];
                                            if(n == 'paid_amount'){
                                                amount = ch.CHANGED_COLUMN_VALUES[k];
                                                return +amount;
                                            }
                                        }
                                    }else{
                                        if(ch.CHANGED_COLUMN_NAMES == 'paid_amount'){
                                            amount = ch.CHANGED_COLUMN_VALUES;
                                            return +amount;
                                        }
                                    }
                                }
                            }else{
                                return +amount;
                            }
                        }

                        if(rowdata.financing_type_sysname == 'FIXED'){

                            if(getPaidAmount() !== +rowdata.pending_amount && getPaidAmount() != 0){

                                bootbox.dialog({
                                    title: 'Винмание!',
                                    message: 'Вы пытаетесь зачислить фиксированный платеж указав сумму не равную ожидаемой, скорее всего это опечатка, продолжить?',
                                    buttons: {
                                        success: {
                                            label: 'Продолжить',
                                            callback: function () {

                                                var o = {
                                                    command: 'setPaid',
                                                    object: 'daily_payment',
                                                    params: {
                                                        id: rowdata.id,
                                                        paid_amount: getPaidAmount()
                                                    }
                                                };

                                                socketQuery(o, function (res) {

                                                    if(res.code != 0){
                                                        console.log('ERR', res);
                                                    }

                                                    tableInstance.clearChanges();
                                                    tableInstance.parentObject.reload(function(){

                                                        // var nextInp = tableInstance.ct_instance.container.find('tbody tr').eq(lastInputIndex).next().find('input[type="number"]');
                                                        // nextInp.val( (+nextInp.val() == 0)? '' : nextInp.val());nextInp.focus();

                                                    });
                                                    console.log(lastInput);

                                                });

                                            }
                                        },
                                        error: {
                                            label: 'Отмена',
                                            callback: function () {

                                            }
                                        }
                                    }
                                })

                            }else{

                                var o = {
                                    command: 'setPaid',
                                    object: 'daily_payment',
                                    params: {
                                        id: rowdata.id,
                                        paid_amount: getPaidAmount()
                                    }
                                };

                                socketQuery(o, function (res) {

                                    if(res.code != 0){
                                        console.log('ERR', res);
                                    }

                                    tableInstance.clearChanges();
                                    tableInstance.parentObject.reload(function(){

                                        // var nextInp = tableInstance.ct_instance.container.find('tbody tr').eq(lastInputIndex).next().find('input[type="number"]');
                                        // nextInp.val( (+nextInp.val() == 0)? '' : nextInp.val());nextInp.focus();

                                    });

                                });

                            }

                        }else{

                            var o = {
                                command: 'setPaid',
                                object: 'daily_payment',
                                params: {
                                    id: rowdata.id,
                                    paid_amount: getPaidAmount()
                                }
                            };

                            socketQuery(o, function (res) {

                                if(res.code != 0){
                                    console.log('ERR', res);
                                }

                                tableInstance.clearChanges();
                                tableInstance.parentObject.reload(function(){

	                                // var nextInp = tableInstance.ct_instance.container.find('tbody tr').eq(lastInputIndex).next().find('input[type="number"]');
	                                //
	                                // nextInp.val( (+nextInp.val() == 0)? '' : nextInp.val());
	                                // nextInp.focus();

                                });




                            });
                        }

                        console.log(rowdata);
                    }
                },
                {
                    id: 'cb12',
                    icon: 'fa-times',
                    placeholder: 'Дефолт',
                    callback: function (rowdata) {
	                    if (!rowdata.is_working_day) {
		                    toastr['info']('У торговца выходной день. Нельзя внести изменения.');
		                    return;
	                    }

	                    function getPaidAmount(){

                            var amount = 0;
                            if(tableInstance.ct_instance.changes.length > 0){
                                for(var i in tableInstance.ct_instance.changes){

                                    var ch = tableInstance.ct_instance.changes[i];

                                    if(typeof ch.CHANGED_COLUMN_NAMES == 'object'){
                                        for(var k in ch.CHANGED_COLUMN_NAMES){
                                            var n = ch.CHANGED_COLUMN_NAMES[k];
                                            if(n == 'paid_amount'){
                                                amount = ch.CHANGED_COLUMN_VALUES[k];
                                                return +amount;
                                            }
                                        }
                                    }else{
                                        if(ch.CHANGED_COLUMN_NAMES == 'paid_amount'){
                                            amount = ch.CHANGED_COLUMN_VALUES;
                                            return +amount;
                                        }
                                    }
                                }
                            }else{
                                return +amount;
                            }
                        }


                        if(rowdata.status_sysname != 'PENDING' && rowdata.status_sysname != 'DEFAULT'){

                            bootbox.dialog({
                                title: 'Винмание!',
                                message: 'Данный платеж уже был отмечен, Вы уверены что хотите пометить его пропущеным?',
                                buttons: {
                                    success: {
                                        label: 'Продолжить',
                                        callback: function () {

                                            var o = {
                                                command: 'setDefault',
                                                object: 'daily_payment',
                                                params: {
                                                    //default_date: tableInstance.parentObject.data.data[0].payments_for_date,
                                                    id: rowdata.id,
                                                    paid_amount:getPaidAmount() // Процентный платеж можно отметить как частично оплачен если указать сумму оплаты
                                                }
                                            };

                                            socketQuery(o, function (res) {

                                                if(res.code != 0){
                                                    console.log('ERR', res);
                                                }

                                                tableInstance.clearChanges();
                                                tableInstance.reload(function(){

                                                    var nextInp = tableInstance.ct_instance.container.find('tbody tr').eq(lastInputIndex).next().find('input[type="number"]');
                                                    nextInp.val( (+nextInp.val() == 0)? '' : nextInp.val());nextInp.focus();

                                                });



                                                rowdata.freeAmount = false;
                                                rowdata.closebill = false;

                                                inv.init(rowdata);
                                                console.log(rowdata);



                                            });

                                        }
                                    },
                                    error: {
                                        label: 'Отмена',
                                        callback: function () {

                                        }
                                    }
                                }
                            })

                        }else{

                            var o = {
                                command: 'setDefault',
                                object: 'daily_payment',
                                params: {
                                    id: rowdata.id,
                                    paid_amount:getPaidAmount() // Процентный платеж можно отметить как частично оплачен если указать сумму оплаты
                                }
                            };

                            socketQuery(o, function (res) {

                                if(res.code != 0){
                                    console.log('ERR', res);
                                }

                                tableInstance.clearChanges();
                                tableInstance.reload(function(){

                                    var nextInp = tableInstance.ct_instance.container.find('tbody tr').eq(lastInputIndex).next().find('input[type="number"]');
                                    nextInp.val( (+nextInp.val() == 0)? '' : nextInp.val());nextInp.focus();

                                });



                                console.log(lastInput);

                                rowdata.freeAmount = false;
                                rowdata.closebill = false;

                                inv.init(rowdata);
                                console.log(rowdata);

                            });


                        }
                    }
                },
                {
                    id: 'cb13',
                    icon: 'fa-file-text-o',
                    placeholder: 'Выставить счёт',
                    callback: function (rowdata) {
	                    if (!rowdata.is_working_day) {
		                    toastr['info']('У торговца выходной день. Нельзя внести изменения.');
		                    return;
	                    }

	                    rowdata.freeAmount = false;
                        rowdata.closebill = false;

                        inv.init(rowdata);

                        console.log(rowdata);
                    }
                }
            ]
        },
        {
            id: 2,
            buttons: [
                {
                    id: 'cb21',
                    icon: 'fa-ruble',
                    placeholder: 'Оплата без счёта',
                    callback: function (rowdata) {


                        rowdata.freeAmount = true;
                        rowdata.closebill = false;

                        inv.init(rowdata);

                    }
                },
                {
                    id: 'cb22',
                    icon: 'fa-file-text',
                    placeholder: 'Оплата по счёту',
                    callback: function (rowdata) {

                        rowdata.freeAmount = false;
                        rowdata.closebill = true;

                        inv.init(rowdata);

                        console.log(rowdata);
                    }
                }
            ]
        }
    ];


//
//    function stepInput(){
//        if(lastInput){
//            var nextInput = lastInput.parents('tr').next().find('input[type="number]');
//            nextInput.focus();
//        }
//    }

    tableInstance.ct_instance.container.on('keydown', function(e){

        if($(e.target)[0].type == 'number'){

            lastInput = $(e.target);
            lastInputIndex = $(e.target).parents('tr').index();

            var kc = e.keyCode;
            var btnOk = $(e.target).parents('tr').find('.ct-custom-button[data-id="cb11"]');
            var btnDefault = $(e.target).parents('tr').find('.ct-custom-button[data-id="cb12"]');

            if(kc == 13){
                btnOk.click();
            }
        }

    });

}());

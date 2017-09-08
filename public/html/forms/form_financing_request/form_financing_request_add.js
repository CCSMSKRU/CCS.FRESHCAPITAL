(function () {

    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_merchant', formID);
    var formWrapper = $('#mw-' + formInstance.id);

    var docs_table = formInstance.tblInstances[0];

    var modalInstance = MB.Core.modalWindows.windows.getWindow(formID);
    modalInstance.stick = 'top';
    modalInstance.stickModal();


    formInstance.lowerButtons = [
        //{
        //    title: 'Отправить предложение',
        //    color: "blue",
        //    icon: "fa-envelope-o",
        //    type: "SINGLE",
        //    hidden: false,
        //    condition: [{
        //        colNames: ['merchant_status_sysname','merchant_status_sysname'],
        //        matching: ['not_equal','not_equal'],
        //        colValues: ['NEW','OFFER_DECLINED']
        //    }],
        //    handler: function () {
        //
        //        var data = formInstance.data.data[0];
        //
        //
        //        var req_html =  '<div class="row"><div class="col-md-12">Вы собираетесь отправить предложение:</div>' +
        //            '<div class="col-md-12">Под следующие ставки:<br/></div>' +
        //            '<div class="col-md-12"><ul class="classic-ul">' +
        //            '<li>Сумма фондирования:   <b>' + data.founding_amount + '</b>   руб.</li>' +
        //            '<li>Сумма возврата:   <b>' +     data.amount_to_return + '</b>   руб.</li>' +
        //            '<li>Кол-во платежей:   <b>' +    data.payments_count + '</b></li>' +
        //            '<li>Сумма платежа:   <b>' +      data.payment_amount + '</b>   руб.</li>' +
        //            '<li>Ставка факторинга:   <b>' +  data.factoring_rate + '</b>  %</li>' +
        //            '</ul></div></div>';
        //
        //        bootbox.dialog({
        //            title: 'Отправить предложение',
        //            message: req_html,
        //            buttons: {
        //                success: {
        //                    label: 'Отправить предложение',
        //                    callback: function(){
        //
        //                        var o = {
        //                            command: 'sendOffer',
        //                            object: formInstance.class,
        //                            client_object: formInstance.client_object,
        //                            params: {
        //                                id: data.id
        //                            }
        //                        };
        //
        //                        socketQuery(o, function(res){
        //                            formInstance.reload();
        //                        });
        //
        //                    }
        //                },
        //                error: {
        //                    label: 'Отмена',
        //                    callback: function(){
        //
        //                    }
        //                }
        //            }
        //        });
        //    }
        //},
        //{
        //    title: 'Запросить документы',
        //    color: "blue",
        //    icon: "fa-file-text-o",
        //    type: "SINGLE",
        //    hidden: false,
        //    condition: [{
        //        colNames: ['merchant_status_sysname'],
        //        matching: ['not_equal'],
        //        colValues: ['OFFER_ACCEPTED']
        //    }],
        //    handler: function () {
        //
        //        var data = formInstance.data.data[0];
        //
        //        var docs_list = '<ol>';
        //
        //        for(var i in docs_table.data.data){
        //            var doc = docs_table.data.data[i];
        //
        //            if(doc.status_sysname == 'CREATED'){
        //                docs_list += '<li><b>' + doc.document_name + '</b></li>';
        //            }
        //        }
        //
        //        docs_list += '</ol>';
        //
        //
        //        var req_html =  '<div class="row"><div class="col-md-12">Вы собираетесь отправить запрос на следующие документы:</div>' +
        //            '<br/>' +
        //            '<div class="col-md-12">' + docs_list + '</div>' +
        //            '<br/>' +
        //            '<div class="col-md-12">Под следующие ставки:<br/></div>' +
        //            '<div class="col-md-12"><ul>' +
        //            '<li>Сумма фондирования: <b>' + data.founding_amount + '</b> руб.</li>' +
        //            '<li>Сумма возврата: <b>' +     data.amount_to_return + '</b> руб.</li>' +
        //            '<li>Кол-во платежей: <b>' +    data.payments_count + '</b></li>' +
        //            '<li>Сумма платежа: <b>' +      data.payment_amount + '</b> руб.</li>' +
        //            '<li>Ставка факторинга: <b>' +  data.factoring_rate + '</b>%</li>' +
        //            '</ul></div></div>';
        //
        //        bootbox.dialog({
        //            title: 'Запрос документов',
        //            message: req_html,
        //            buttons: {
        //                success: {
        //                    label: 'Отправить запрос',
        //                    callback: function(){
        //
        //                        var o = {
        //                            command: 'requestDocuments',
        //                            object: formInstance.class,
        //                            client_object: formInstance.client_object,
        //                            params: {
        //                                id: data.id
        //                            }
        //                        };
        //
        //                        console.log(o);
        //
        //                        socketQuery(o, function(res){
        //                            formInstance.reload();
        //                        });
        //
        //                    }
        //                },
        //                error: {
        //                    label: 'Отмена',
        //                    callback: function(){
        //
        //                    }
        //                }
        //            }
        //        });
        //    }
        //},
        //{
        //    title: 'Торговец согласен',
        //    color: "green",
        //    icon: "fa-check",
        //    type: "SINGLE",
        //    hidden: false,
        //    condition: [{
        //        colNames: ['merchant_status_sysname'],
        //        matching: ['not_equal'],
        //        colValues: ['OFFER_SENDED']
        //    }],
        //    handler: function () {
        //        var data = formInstance.data.data[0];
        //
        //        var o = {
        //            command: 'acceptOffer',
        //            object: formInstance.class,
        //            client_object: formInstance.client_object,
        //            params: {
        //                id: data.id
        //            }
        //        };
        //
        //        socketQuery(o, function(res){
        //            formInstance.reload();
        //        });
        //
        //    }
        //},
        //{
        //    title: 'Отказ',
        //    color: "red",
        //    icon: "fa-times",
        //    type: "SINGLE",
        //    hidden: false,
        //    condition: [{
        //        colNames: ['merchant_status_sysname'],
        //        matching: ['not_equal'],
        //        colValues: ['OFFER_SENDED']
        //    }],
        //    handler: function () {
        //        var data = formInstance.data.data[0];
        //        var selInstance;
        //
        //        var req_html =  '<div class="row">' +
        //            '<div class="col-md-12">' +
        //            '<div class="form-group">' +
        //            '<div class="bootbox-label">Причина отказа:</div>' +
        //            '<div  id="deny-reason" class="deny-select-3-wrapper"></div>' +
        //            '</div>' +
        //            '<div class="form-group">' +
        //            '<div class="bootbox-label">Комментарий:</div>' +
        //            '<textarea rows="5" id="deny-comment" class="form-control"></textarea>' +
        //            '</div>' +
        //            '</div>';
        //
        //        bootbox.dialog({
        //            title: 'Торговец отказался, укажите причину',
        //            message: req_html,
        //            buttons: {
        //                success: {
        //                    label: 'Подтверждаю',
        //                    callback: function(){
        //
        //                        var reason = selInstance.value.id;
        //                        var comment = $('#deny-comment').val();
        //
        //                        if(reason == undefined || reason.toString().length == 0){
        //                            toastr['error']('Укажите причину отказа.');
        //                            return false;
        //                        }
        //                        if(comment.length == 0){
        //                            toastr['error']('Заполните поле комментарий.');
        //                            return false;
        //                        }
        //
        //                        var o = {
        //                            command: 'denyOffer',
        //                            object: formInstance.class,
        //                            client_object: formInstance.client_object,
        //                            params: {
        //                                id: data.id,
        //                                comment: comment,
        //                                merchant_worksheet_deny_reason_id: reason
        //                            }
        //                        };
        //
        //                        socketQuery(o, function(res){
        //                            formInstance.reload();
        //                        });
        //                    }
        //                },
        //                error: {
        //                    label: 'Отмена',
        //                    callback: function(){
        //
        //                    }
        //                }
        //            }
        //        });
        //
        //
        //
        //        var denySelId = MB.Core.guid();
        //        selInstance = MB.Core.select3.init({
        //            id :                denySelId,
        //            wrapper:            $('#deny-reason'),
        //            column_name:        'merchant_worksheet_deny_reason',
        //            class:              'merchant_history_log',
        //            client_object:      'tbl_merchant_history_log',
        //            return_id:          'id',
        //            return_name:        'name',
        //            withSearch:         true,
        //            withEmptyValue:     true,
        //            absolutePosition:   true,
        //            isFilter:           false,
        //            parentObject:       formInstance,
        //            value: {},
        //            additionalClass:    ''
        //        });
        //
        //
        //
        //    }
        //},
        //{
        //    title: 'Отправить договор',
        //    color: "green",
        //    icon: "fa-envelope-o",
        //    type: "SINGLE",
        //    hidden: false,
        //    condition: [{
        //        colNames: ['merchant_status_sysname','merchant_status_sysname'],
        //        matching: ['not_equal','not_equal'],
        //        colValues: ['DOCS_REQUESTED','DOCS_RECIEVED']
        //    }],
        //    handler: function () {
        //        var data = formInstance.data.data[0];
        //
        //        var req_html =  '<div class="row">' +
        //            '<div class="col-md-12">' +
        //            '<div class="form-group">' +
        //            '<label>Укажите дату начала работы:</label>' +
        //            '<input type="text" id="agreement-date" class="form-control" />' +
        //            '</div>' +
        //            '</div>' +
        //            '<div class="col-md-12">' +
        //            '<div class="form-group">' +
        //            '<label>Будут использованы следующие параметры:</label>' +
        //            '<table class="table table-bordered table-lil-pads">' +
        //            '<tr>' +
        //            '<td>Сумма фондирования: </td><td><b>' + data.founding_amount + '</b> руб.</td>' +
        //            '</tr>' +
        //            '<tr>' +
        //            '<td>Сумма возврата: </td><td><b>' +     data.amount_to_return + '</b> руб.</td>' +
        //            '</tr>' +
        //            '<tr>' +
        //            '<td>Кол-во платежей: </td><td><b>' +    data.payments_count + '</b></td>' +
        //            '</tr>' +
        //            '<tr>' +
        //            '<td>Сумма платежа: </td><td><b>' +      data.payment_amount + '</b> руб.</td>' +
        //            '</tr>' +
        //            '<tr>' +
        //            '<td>Ставка факторинга: </td><td><b>' +  data.factoring_rate + '</b>%</td>' +
        //            '</tr>' +
        //            '</table>' +
        //            '</div></div></div></div>';
        //
        //        bootbox.dialog({
        //            title: 'Отправить договор на подпись торговцу',
        //            message: req_html,
        //            buttons: {
        //                success: {
        //                    label: 'Отправить запрос',
        //                    callback: function(){
        //
        //                        var o = {
        //                            command: 'prepareAgreement',
        //                            object: formInstance.class,
        //                            client_object: formInstance.client_object,
        //                            params: {
        //                                id: data.id
        //                            }
        //                        };
        //
        //                        o.params.date = ($('#agreement-date').val().length > 0)? $('#agreement-date').val() : moment(new Date).add(2,'d').format('DD.MM.YYYY');
        //
        //                        socketQuery(o, function(res){
        //                            formInstance.reload();
        //
        //
        //                        });
        //
        //                    }
        //                },
        //                error: {
        //                    label: 'Отмена',
        //                    callback: function(){
        //
        //                    }
        //                }
        //            }
        //        });
        //
        //        $('#agreement-date').datepicker({
        //            language: 'ru',
        //            format: 'dd.mm.yyyy',
        //            autoclose: true,
        //            todayBtn: 'linked'
        //        });
        //    }
        //},
        //{
        //    title: 'Загрузить договор',
        //    color: "green",
        //    icon: "fa-file-text-o",
        //    type: "SINGLE",
        //    hidden: false,
        //    condition: [{
        //        colNames: ['merchant_status_sysname'],
        //        matching: ['not_equal'],
        //        colValues: ['AGREEMENT_SENT']
        //    }],
        //    handler: function () {
        //        var data = formInstance.data.data[0];
        //
        //        var html = '<div class="row"><div class="col-md-12"><div class="form-group"><label>Выберите файл (Подписанный с обеих сторон договр):</label><input id="upload_main_agreement" class="form-control" type="text"/></div></div></div>';
        //
        //        bootbox.dialog({
        //            title: 'Загрузка договора',
        //            message: html,
        //            buttons: {
        //                success: {
        //                    label: 'Отправить запрос',
        //                    callback: function(){
        //
        //                        var filename = $('#upload_main_agreement').val();
        //
        //                        var o = {
        //                            command: 'uploadMainAgreement',
        //                            object: formInstance.class,
        //                            client_object: formInstance.client_object,
        //                            params: {
        //                                id: data.id,
        //                                filename: filename
        //                            }
        //                        };
        //
        //                        socketQuery(o, function(res){
        //                            formInstance.reload();
        //                        });
        //                    }
        //                },
        //                error: {
        //                    label: 'Отмена',
        //                    callback: function(){
        //
        //                    }
        //                }
        //            }
        //        });
        //
        //        $('#upload_main_agreement').off('click').on('click', function(){
        //            var loader = MB.Core.fileLoader;
        //            loader.start({
        //                params:{
        //                    not_public:true
        //                },
        //                success: function (uid) {
        //                    $('#upload_main_agreement').val(uid.name);
        //                }
        //            });
        //        });
        //
        //    }
        //},
        //{
        //    title: 'Перевести в работу',
        //    color: "green",
        //    icon: "fa-check",
        //    type: "SINGLE",
        //    hidden: false,
        //    condition: [{
        //        colNames: ['merchant_status_sysname','merchant_status_sysname'],
        //        matching: ['not_equal','not_equal'],
        //        colValues: ['AGREEMENT_UPLOADED','READY_TO_WORK']
        //    }],
        //    handler: function () {
        //        var data = formInstance.data.data[0];
        //
        //        var req_html =  '<div class="row">' +
        //            '<div class="col-md-12">' +
        //            '<div class="form-group">' +
        //            '<label>Укажите начальную дату календаря платежей:</label>' +
        //            '<input type="text" id="payment-start-date" class="form-control" />' +
        //            '</div>' +
        //            '</div>' +
        //            '</div>' ;
        //
        //        bootbox.dialog({
        //            title: 'Перевести в работу',
        //            message: req_html,
        //            buttons: {
        //                success: {
        //                    label: 'Отправить запрос',
        //                    callback: function(){
        //
        //                        var o = {
        //                            command: 'transferToWork',
        //                            object: formInstance.class,
        //                            client_object: formInstance.client_object,
        //                            params: {
        //                                id: data.id
        //                            }
        //                        };
        //
        //                        o.params.start_date = $('#payment-start-date').val();
        //
        //                        if(o.params.start_date.length == 0){
        //                            toastr['error']('Укажите дату начала работы');
        //                            return false;
        //                        }
        //
        //                        socketQuery(o, function(res){
        //
        //                            modalInstance.collapse();
        //
        //                            var merchantFormId = MB.Core.guid();
        //
        //                            var openInModalO = {
        //                                id: merchantFormId,
        //                                name: 'form_merchant',
        //                                class: formInstance.class,
        //                                client_object: 'form_merchant',
        //                                type: 'form',
        //                                ids: [data.id],
        //                                position: 'center',
        //                                tablePKeys: {data_columns: ['id'], data: [data.id]}
        //                            };
        //
        //                            var form = new MB.FormN(openInModalO);
        //                            form.create(function () {
        //                                var modal = MB.Core.modalWindows.windows.getWindow(merchantFormId);
        //                            });
        //                        });
        //                    }
        //                },
        //                error: {
        //                    label: 'Отмена',
        //                    callback: function(){
        //
        //                    }
        //                }
        //            }
        //        });
        //
        //        $('#payment-start-date').datepicker({
        //            language: 'ru',
        //            format: 'dd.mm.yyyy',
        //            autoclose: true,
        //            todayBtn: 'linked'
        //        });
        //
        //
        //    }
        //},
        //{
        //    title: 'Перерасчитать',
        //    color: "black",
        //    icon: "fa-refresh",
        //    type: "SINGLE",
        //    hidden: false,
        //    position: 'RIGHT',
        //    condition: [{
        //        colNames: ['merchant_status_sysname'],
        //        matching: ['equal'],
        //        colValues: ['OFFER_ACCEPTED']
        //    }],
        //    handler: function () {
        //        var data = formInstance.data.data[0];
        //        if(formInstance.changes.length > 0){
        //            toastr['info']('Сначала сохраните анкету.');
        //        }else{
        //
        //            var o = {
        //                command:'recalcWorksheet',
        //                object: formInstance.class,
        //                client_object: formInstance.client_object,
        //                params:{
        //                    id:data.id
        //                }
        //            };
        //
        //            bootbox.dialog({
        //                title: 'Выполнить перерасчет',
        //                message: 'Исходя из суммы фондирования или по классическим параметрам?',
        //                buttons: {
        //                    byfounding: {
        //                        label: 'По сумме фондирования',
        //                        callback: function(){
        //                            o.params.dont_recalc_founding_amount = true;
        //                            socketQuery(o, function (res) {
        //                                if (!+res.code) formInstance.reload();
        //                            });
        //                        }
        //                    },
        //                    byclassic: {
        //                        label: 'По классическим параметрам',
        //                        callback: function(){
        //                            socketQuery(o, function (res) {
        //                                if (!+res.code) formInstance.reload();
        //                            });
        //                        }
        //                    },
        //                    error: {
        //                        label: 'Отмена',
        //                        callback: function(){
        //
        //                        }
        //                    }
        //                }
        //            });
        //
        //        }
        //
        //    }
        //}
    ];

}());
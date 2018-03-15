(function () {

    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_merchant_financing_equipment', formID);
    var formWrapper = $('#mw-' + formInstance.id);

    var modalInstance = MB.Core.modalWindows.windows.getWindow(formID);
    modalInstance.stick = 'top';
    modalInstance.stickModal();

    formWrapper.find('.recalculate').off('click').on('click', function(){

        var data = formInstance.data.data[0];

        if(formInstance.changes.length > 0){
            toastr['info']('Сначала сохраните изменения.', 'Внимание!');
        }else{

            var o = {
                command:'recalculate',
                object: formInstance.class,
                client_object: formInstance.client_object,
                params:{
                    id:data.id,
                    recalc_type: 'classic'
                }
            };

            bootbox.dialog({
                title: 'Выполнить перерасчет',
                message: 'Исходя из суммы фондирования или по классическим параметрам?',
                buttons: {
                    byclassic: {
                        label: 'По классическим параметрам / сумме фондирования',
                        callback: function(){

                            o.params.recalc_type = 'classic';

                            socketQuery(o, function (res) {
                                if (!+res.code) formInstance.reload();
                            });
                        }
                    },
                    //byfounding: {
                    //    label: 'По сумме фондирования',
                    //    callback: function(){
                    //        //o.params.dont_recalc_founding_amount = true;
                    //
                    //        o.params.recalc_type = 'by_founding_amount';
                    //
                    //        socketQuery(o, function (res) {
                    //            if (!+res.code) formInstance.reload();
                    //        });
                    //    }
                    //},
                    bypaymentamount: {
                        label: 'По сумме платежа',
                        callback: function(){

                            o.params.recalc_type = 'by_payment_amount';

                            socketQuery(o, function (res) {
                                if (!+res.code) formInstance.reload();
                            });
                        }
                    },
                    bypaymentscount: {
                        label: 'По кол-ву платежей',
                        callback: function(){

                            o.params.recalc_type = 'by_payments_count';

                            socketQuery(o, function (res) {
                                if (!+res.code) formInstance.reload();
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

        }

    });


    formInstance.lowerButtons = [
        {
            title: 'Отправить предложение',
            color: "blue",
            icon: "fa-envelope-o",
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: ['status_sysname','status_sysname'],
                matching: ['not_equal','not_equal'],
                colValues: ['CREATED','OFFER_DECLINED']
            }],
            handler: function () {

                var data = formInstance.data.data[0];


                var req_html = '';

                if(data.financing_type_sysname == 'PERCENT'){

                    req_html = '<ul class="classic-ul">' +
                        '<li>Сумма финансирования:   <b>' + data.founding_amount + '</b>   руб.</li>' +
                        '<li>Сумма возврата:   <b>' +     data.amount_to_return + '</b>   руб.</li>' +
                        '<li>Процент списания:   <b>' +    data.avl_proc_dly_withdraw_rate_calculated + ' %</b></li>' +

                        '<li>Ставка:   <b>' +  data.factoring_rate + '</b>  %</li>' +
                        '</ul></div>';

                }else{

                    req_html = '<ul class="classic-ul">' +
                        '<li>Сумма финансирования:   <b>' + data.founding_amount + '</b>   руб.</li>' +
                        '<li>Сумма возврата:   <b>' +     data.amount_to_return + '</b>   руб.</li>' +
                        '<li>Кол-во платежей:   <b>' +    data.payments_count + '</b></li>' +
                        '<li>Сумма платежа:   <b>' +      data.payment_amount + '</b>   руб.</li>' +
                        '<li>Ставка:   <b>' +  data.factoring_rate + '</b>  %</li>' +
                        '</ul></div>';

                }


                bootbox.dialog({
                    title: 'Отправить предложение',
                    message: req_html,
                    buttons: {
                        success: {
                            label: 'Отправить предложение',
                            callback: function(){

                                var o = {
                                    command: 'sendOffer',
                                    object: formInstance.class,
                                    client_object: formInstance.client_object,
                                    params: {
                                        id: data.id
                                    }
                                };

                                socketQuery(o, function(res){
                                    formInstance.reload();
                                });

                            }
                        },
                        success_without_sending: {
                            label: 'Пропустить этот шаг',
                            callback: function(){

                                var o = {
                                    command: 'sendOffer',
                                    object: formInstance.class,
                                    client_object: formInstance.client_object,
                                    params: {
                                        id: data.id,
                                        without_sending:true
                                    }
                                };

                                socketQuery(o, function(res){
                                    formInstance.reload();
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
            }
        },
        {
            title: 'Запросить документы',
            color: "blue",
            icon: "fa-file-text-o",
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: ['status_sysname'],
                matching: ['not_equal'],
                colValues: ['OFFER_ACCEPTED']
            }],
            handler: function () {

                var data = formInstance.data.data[0];

                var docs_table = formInstance.getChildTbl('merchant_financing_document');

                var docs_list = '<ol>';

                for(var i in docs_table.data.data){
                    var doc = docs_table.data.data[i];

                    if(doc.status_sysname == 'CREATED'){
                        docs_list += '<li><b>' + doc.document_name + '</b></li>';
                    }
                }

                docs_list += '</ol>';


                var req_html =  'Отправить запрос?';

                bootbox.dialog({
                    title: 'Запрос документов',
                    message: req_html,
                    buttons: {
                        success: {
                            label: 'Отправить запрос',
                            callback: function(){

                                var o = {
                                    command: 'requestDocuments',
                                    object: formInstance.class,
                                    client_object: formInstance.client_object,
                                    params: {
                                        id: data.id
                                    }
                                };

                                console.log(o);

                                socketQuery(o, function(res){
                                    formInstance.reload();
                                });

                            }
                        },
                        success_without_sending: {
                            label: 'Пропустить этот шаг',
                            callback: function(){

                                var o = {
                                    command: 'requestDocuments',
                                    object: formInstance.class,
                                    client_object: formInstance.client_object,
                                    params: {
                                        id: data.id,
                                        without_sending:true
                                    }
                                };

                                console.log(o);

                                socketQuery(o, function(res){
                                    formInstance.reload();
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
            }
        },
        {
            title: 'Торговец согласен',
            color: "green",
            icon: "fa-check",
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: ['status_sysname'],
                matching: ['not_equal'],
                colValues: ['OFFER_SENDED']
            }],
            handler: function () {
                var data = formInstance.data.data[0];

                var o = {
                    command: 'acceptOffer',
                    object: formInstance.class,
                    client_object: formInstance.client_object,
                    params: {
                        id: data.id
                    }
                };

                socketQuery(o, function(res){
                    formInstance.reload();
                });

            }
        },
        {
            title: 'Отказ',
            color: "red",
            icon: "fa-times",
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: ['status_sysname'],
                matching: ['not_equal'],
                colValues: ['OFFER_SENDED']
            }],
            handler: function () {
                var data = formInstance.data.data[0];
                var selInstance;

                var req_html =  '<div class="row">' +
                    '<div class="col-md-12">' +
                    '<div class="form-group">' +
                    '<div class="bootbox-label">Причина отказа:</div>' +
                    '<div  id="deny-reason" class="deny-select-3-wrapper"></div>' +
                    '</div>' +
                    '<div class="form-group">' +
                    '<div class="bootbox-label">Комментарий:</div>' +
                    '<textarea rows="5" id="deny-comment" class="form-control"></textarea>' +
                    '</div>' +
                    '</div>';

                bootbox.dialog({
                    title: 'Торговец отказался, укажите причину',
                    message: req_html,
                    buttons: {
                        success: {
                            label: 'Подтверждаю',
                            callback: function(){

                                var reason = selInstance.value.id;
                                var comment = $('#deny-comment').val();

                                if(reason == undefined || reason.toString().length == 0){
                                    toastr['error']('Укажите причину отказа.');
                                    return false;
                                }
                                if(comment.length == 0){
                                    toastr['error']('Заполните поле комментарий.');
                                    return false;
                                }

                                var o = {
                                    command: 'denyOffer',
                                    object: formInstance.class,
                                    client_object: formInstance.client_object,
                                    params: {
                                        id: data.id,
                                        comment: comment,
                                        merchant_financing_deny_reason_id: reason
                                    }
                                };

                                socketQuery(o, function(res){
                                    formInstance.reload();
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



                var denySelId = MB.Core.guid();
                selInstance = MB.Core.select3.init({
                    id :                denySelId,
                    wrapper:            $('#deny-reason'),
                    column_name:        'merchant_financing_deny_reason',
                    class:              'merchant_financing_history_log',
                    client_object:      'tbl_merchant_financing_history_log',
                    return_id:          'id',
                    return_name:        'name',
                    withSearch:         true,
                    withEmptyValue:     true,
                    absolutePosition:   true,
                    isFilter:           false,
                    parentObject:       formInstance,
                    value: {},
                    additionalClass:    ''
                });



            }
        },
        {

            title: (formInstance.data.data[0].status_sysname == 'AGREEMENT_SENT' || formInstance.data.data[0].status_sysname == 'AGREEMENT_UPLOADED' || formInstance.data.data[0].status_sysname == 'AGREEMENT_CREATED')? 'Переформировать договор' : 'Сформировать договор',
            color: (formInstance.data.data[0].status_sysname == 'AGREEMENT_SENT' || formInstance.data.data[0].status_sysname == 'AGREEMENT_UPLOADED' || formInstance.data.data[0].status_sysname == 'AGREEMENT_CREATED')? 'grey' : 'green',
            icon: "fa-file-o",
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: ['status_sysname','status_sysname','status_sysname','status_sysname','status_sysname'],
                matching: ['not_equal','not_equal','not_equal','not_equal','not_equal'],
                colValues: ['DOCS_REQUESTED','DOCS_RECIEVED','AGREEMENT_SENT','AGREEMENT_UPLOADED','AGREEMENT_CREATED']
            }],
            handler: function () {
                var data = formInstance.data.data[0];


                var req_html = '';

                if(data.financing_type_sysname == 'PERCENT'){

                    req_html = '<ul class="classic-ul">' +
                        '<li>Сумма финансирования:   <b>' + data.founding_amount + '</b>   руб.</li>' +
                        '<li>Сумма возврата:   <b>' +     data.amount_to_return + '</b>   руб.</li>' +
                        '<li>Процент списания:   <b>' +    data.avl_proc_dly_withdraw_rate_calculated + ' %</b></li>' +

                        '<li>Ставка:   <b>' +  data.factoring_rate + '</b>  %</li>' +
                        '</ul></div>';

                    req_html =  '<div class="row">' +
                        '<div class="col-md-12">' +
                        '<div class="form-group">' +
                        '<label>Укажите дату договора:</label>' +
                        '<input type="text" id="agreement-date" class="form-control" />' +
                        '</div>' +
                        '<div class="form-group">' +
                        '<label>Укажите номер договора:</label>' +
                        '<input type="text" id="agreement-number" class="form-control" />' +
                        '</div>' +
                        '</div>' +
                        '<div class="col-md-12">' +
                        '<div class="form-group">' +
                        '<label>Будут использованы следующие параметры:</label>' +
                        '<table class="table table-bordered table-lil-pads">' +
                        '<tr>' +
                        '<td>Сумма финансирования: </td><td><b>' + data.founding_amount + '</b> руб.</td>' +
                        '</tr>' +
                        '<tr>' +
                        '<td>Сумма возврата: </td><td><b>' +     data.amount_to_return + '</b> руб.</td>' +
                        '</tr>' +
                        '<tr>' +
                        '<td>Процент списания: </td><td><b>' +    data.avl_proc_dly_withdraw_rate_calculated + ' %</b></td>' +
                        '</tr>' +
                        '<tr>' +
                        '<td>Ставка: </td><td><b>' +  data.factoring_rate + '</b>%</td>' +
                        '</tr>' +
                        '</table>' +
                        '</div></div></div></div>';

                }else{

                    req_html =  '<div class="row">' +
                        '<div class="col-md-12">' +
                        '<div class="form-group">' +
                        '<label>Укажите дату договора:</label>' +
                        '<input type="text" id="agreement-date" class="form-control" />' +
                        '</div>' +
                        '<div class="form-group">' +
                        '<label>Укажите номер договора:</label>' +
                        '<input type="text" id="agreement-number" class="form-control" />' +
                        '</div>' +
                        '</div>' +
                        '<div class="col-md-12">' +
                        '<div class="form-group">' +
                        '<label>Будут использованы следующие параметры:</label>' +
                        '<table class="table table-bordered table-lil-pads">' +
                        '<tr>' +
                        '<td>Сумма финансирования: </td><td><b>' + data.founding_amount + '</b> руб.</td>' +
                        '</tr>' +
                        '<tr>' +
                        '<td>Сумма возврата: </td><td><b>' +     data.amount_to_return + '</b> руб.</td>' +
                        '</tr>' +
                        '<tr>' +
                        '<td>Кол-во платежей: </td><td><b>' +    data.payments_count + '</b></td>' +
                        '</tr>' +
                        '<tr>' +
                        '<td>Сумма платежа: </td><td><b>' +      data.payment_amount + '</b> руб.</td>' +
                        '</tr>' +
                        '<tr>' +
                        '<td>Ставка: </td><td><b>' +  data.factoring_rate + '</b>%</td>' +
                        '</tr>' +
                        '</table>' +
                        '</div></div></div></div>';

                }



                bootbox.dialog({
                    title: 'Формирование договора',
                    message: req_html,
                    buttons: {
                        success: {
                            label: 'Сформировать',
                            callback: function(){

                                var o = {
                                    command: 'prepareAgreement',
                                    object: formInstance.class,
                                    client_object: formInstance.client_object,
                                    params: {
                                        id: data.id
                                    }
                                };

                                o.params.agreement_date = $('#agreement-date').val();
                                o.params.agreement_number = $('#agreement-number').val();

                                socketQuery(o, function(res){

                                    if(res.code == 0){
                                        var doc = res.main_agreement_doc;
                                        var file_id = doc.file_id;



                                        var o = {
                                            command:'download',
                                            object:'File',
                                            params:{
                                                id:file_id
                                            }
                                        };
                                        socketQuery(o, function (res2) {

                                            var fileName = res2.path + res2.filename;
                                            var linkName = 'my_download_link' + MB.Core.guid();

                                            $("body").prepend('<a id="'+linkName+'" href="' + res2.path + '?filename='+ res2.filename +'" download="'+ doc.document_name + res2.extension +'" style="display:none;"></a>');
                                            var jqElem = $('#'+linkName);
                                            jqElem[0].click();
                                            jqElem.remove();
                                            //$("#my_download_link").remove();
                                        });

                                        console.log('--->>>>', res);
                                        formInstance.reload();
                                    }


                                });

                            }
                        },
                        skip: {
                            label: 'Пропустить шаг',
                            callback: function(){

                                var o = {
                                    command: 'prepareAgreement',
                                    object: formInstance.class,
                                    client_object: formInstance.client_object,
                                    params: {
                                        skip: true,
                                        id: data.id
                                    }
                                };

                                o.params.agreement_date = $('#agreement-date').val();
                                o.params.agreement_number = $('#agreement-number').val();

                                if(!o.params.agreement_date || !o.params.agreement_number){

                                    toastr['warning']('Необходимо указать дату и номер договора');

                                }else{
                                    socketQuery(o, function(res){

                                        if(res.code == 0){

                                            formInstance.reload();
                                        }


                                    });

                                }



                            }
                        },
                        error: {
                            label: 'Отмена',
                            callback: function(){

                            }
                        }
                    }
                });

                $('#agreement-date').datepicker({
                    language: 'ru',
                    format: 'dd.mm.yyyy',
                    autoclose: true,
                    todayBtn: 'linked'
                });
            }
        },
        {
            title: (formInstance.data.data[0].status_sysname == 'AGREEMENT_SENT' || formInstance.data.data[0].status_sysname == 'AGREEMENT_UPLOADED' )? 'Переотправить договор' : 'Отправить договор',
            color: (formInstance.data.data[0].status_sysname == 'AGREEMENT_SENT' || formInstance.data.data[0].status_sysname == 'AGREEMENT_UPLOADED' )? 'grey' : 'green',
            icon: "fa-envelope-o",
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: ['status_sysname','status_sysname','status_sysname'],
                matching: ['not_equal','not_equal','not_equal'],
                colValues: ['AGREEMENT_SENT','AGREEMENT_UPLOADED','AGREEMENT_CREATED']
            }],
            handler: function () {
                var data = formInstance.data.data[0];

                var req_html =  '<div class="padding-top:30px;padding-bottom:30px;">Последняя версия договора будет отправлена торговцу, вы уверены?</div>';

                bootbox.dialog({
                    title: 'Внимание',
                    message: req_html,
                    buttons: {
                        success: {
                            label: 'Подтвердить',
                            callback: function(){

                                var o = {
                                    command: 'sendAgreement',
                                    object: formInstance.class,
                                    client_object: formInstance.client_object,
                                    params: {
                                        id: data.id
                                    }
                                };


                                socketQuery(o, function(res){
                                    formInstance.reload();
                                });

                            }
                        },
                        success_without_sending: {
                            label: 'Пропустить этот шаг',
                            callback: function(){

                                var o = {
                                    command: 'sendAgreement',
                                    object: formInstance.class,
                                    client_object: formInstance.client_object,
                                    params: {
                                        id: data.id,
                                        without_sending:true
                                    }
                                };


                                socketQuery(o, function(res){
                                    formInstance.reload();
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

                $('#agreement-date').datepicker({
                    language: 'ru',
                    format: 'dd.mm.yyyy',
                    autoclose: true,
                    todayBtn: 'linked'
                });
            }
        },
        {
            title: (formInstance.data.data[0].status_sysname == 'AGREEMENT_UPLOADED')? 'Перезагрузить договор' : 'Загрузить договор',
            color: (formInstance.data.data[0].status_sysname == 'AGREEMENT_UPLOADED')? 'grey' : 'green',
            icon: "fa-file-text-o",
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: ['status_sysname','status_sysname'],
                matching: ['not_equal','not_equal'],
                colValues: ['AGREEMENT_SENT','AGREEMENT_UPLOADED']
            }],
            handler: function () {
                var data = formInstance.data.data[0];

                var html = '<div class="row">' +
                            '<div class="col-md-12">' +
                            '<div class="form-group">' +
                            '<label>Выберите файл (Подписанный с обеих сторон договор):</label>' +
                            '<input id="upload_main_agreement" class="form-control" type="text"/>' +
                            '</div>' +
                            '</div>' +
                            '</div>' ;
                            //'<div class="row">' +
                            //'<div class="col-md-12">' +
                            //'<div class="form-group">' +
                            //'<label>Укажите дату начала календаря (Как указана в скан-копии договора):</label>' +
                            //'<input type="text" id="payment-start-date" class="form-control" value="'+data.agreement_date+'" />' +
                            //'</div>' +
                            //'</div>' +
                            //'</div>';

                bootbox.dialog({
                    title: 'Загрузка договора',
                    message: html,
                    buttons: {
                        success: {
                            label: 'Загрузить',
                            callback: function(){

                                var filename = $('#upload_main_agreement').val();

                                var o = {
                                    command: 'uploadMainAgreement',
                                    object: formInstance.class,
                                    client_object: formInstance.client_object,
                                    params: {
                                        id: data.id,
                                        filename: filename,
                                        agreement_date: $('#payment-start-date').val()
                                    }
                                };

                                socketQuery(o, function(res){

                                    formInstance.reload();


                                });
                            }
                        },
                        skip: {
                            label: 'Пропустить шаг',
                            callback: function(){

                                var filename = $('#upload_main_agreement').val() || '';

                                var o = {
                                    command: 'uploadMainAgreement',
                                    object: formInstance.class,
                                    client_object: formInstance.client_object,
                                    params: {
                                        id: data.id,
                                        skip: true,
                                        filename: filename
                                        //agreement_date: $('#payment-start-date').val()
                                    }
                                };

                                socketQuery(o, function(res){

                                    formInstance.reload();


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

                $('#payment-start-date').datepicker({
                    language: 'ru',
                    format: 'dd.mm.yyyy',
                    autoclose: true,
                    todayBtn: 'linked'
                });

                $('#upload_main_agreement').off('click').on('click', function(){
                    var loader = MB.Core.fileLoader;
                    loader.start({
                        params:{
                            not_public:true
                        },
                        success: function (uid) {
                            $('#upload_main_agreement').val(uid.name);
                        }
                    });
                });

            }
        },
        {
            title: 'Перевести в работу',
            color: "green",
            icon: "fa-check",
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: ['status_sysname','status_sysname'],
                matching: ['not_equal','not_equal'],
                colValues: ['AGREEMENT_UPLOADED','READY_TO_WORK']
            }],
            handler: function () {
                var data = formInstance.data.data[0];

                var req_html =  '<div class="row">' +
                    '<div class="col-md-12">' +
                    '<div class="form-group">' +
                    '<label>Для подтверждения операции напишите "ОК":</label>' +
                    '<input type="text" id="confirm-transfer-to-work" class="form-control" />' +
                    '</div>' +
                    '</div>' +
                    '</div>' ;

                bootbox.dialog({
                    title: 'Перевести в работу',
                    message: req_html,
                    buttons: {
                        success: {
                            label: 'Отправить запрос',
                            callback: function(){

                                formInstance.loader(true, 'Подождите, переводим в работу.');

                                var fld = $('#confirm-transfer-to-work').val();

                                if(fld == 'OK' || fld == 'ОК' || fld == 'ok' || fld == 'ок'){


                                    var o = {
                                        command: 'transferToWork',
                                        object: formInstance.class,
                                        client_object: formInstance.client_object,
                                        params: {
                                            id: data.id
                                        }
                                    };

                                    socketQuery(o, function(res){

                                        if(!res.code){
                                            modalInstance.close();

                                            var merchantFormId = MB.Core.guid();

                                            var openInModalO = {
                                                id: merchantFormId,
                                                name: 'form_merchant_financing_work',
                                                class: 'merchant_financing',
                                                client_object: 'form_merchant_financing_work',
                                                type: 'form',
                                                ids: [data.id],
                                                position: 'center',
                                                tablePKeys: {data_columns: ['id'], data: [data.id]}
                                            };

                                            var form = new MB.FormN(openInModalO);
                                            form.create(function () {
                                                var modal = MB.Core.modalWindows.windows.getWindow(merchantFormId);
                                                formInstance.loader(false, 'Подождите, переводим в работу.');
                                            });
                                        }else{
                                            formInstance.loader(false, 'Подождите, переводим в работу.');
                                        }
                                    });

                                }else{

                                    toastr['warning']('Некорректно введено ключевое слово', 'Ошибка');

                                    return false;
                                }

                            }
                        },
                        error: {
                            label: 'Отмена',
                            callback: function(){

                            }
                        }
                    }
                });

            }
        }
    ];

    //var s = [,"merchant_id","merchant_name","total_mouthly_turnover","visa_mc_percent","acquiring_days_count","avl_mth_withdraw_rate","avl_proc_dly_withdraw_rate"];



}());

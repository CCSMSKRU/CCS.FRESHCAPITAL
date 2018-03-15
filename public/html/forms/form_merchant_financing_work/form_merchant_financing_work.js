(function () {

    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_merchant_financing_work', formID);
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
                command:'recalcFinancing',
                object: formInstance.class,
                client_object: formInstance.client_object,
                params:{
                    id:data.id
                }
            };

            bootbox.dialog({
                title: 'Выполнить перерасчет',
                message: 'Исходя из суммы фондирования или по классическим параметрам?',
                buttons: {
                    byfounding: {
                        label: 'По сумме фондирования',
                        callback: function(){
                            o.params.dont_recalc_founding_amount = true;
                            socketQuery(o, function (res) {
                                if (!+res.code) formInstance.reload();
                            });
                        }
                    },
                    byclassic: {
                        label: 'По классическим параметрам',
                        callback: function(){
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
            title: (formInstance.data.data[0].closing_financing_id == '')?'Уведомить банк' : 'Уведомить банк',
            color: 'blue',
            icon: "fa-comment-o",
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: ['bank_notified'],
                matching: ['equal'],
                colValues: [true]
            }],
            handler: function () {

                var loaderText = (formInstance.data.data[0].closing_financing_id == '')? 'Подождите, отправляем уведомления.' : 'Подождите, отправляем уведомления';

                var data = formInstance.data.data[0];

                bootbox.dialog({
                    title: 'Подтверждение',
                    message: 'Уведомить банк',
                    buttons: {
                        success: {
                            label: 'Отправить',
                            callback: function(){

                                formInstance.loader(true, loaderText);

                                var o = {
                                    command: 'notifyBank',//(formInstance.data.data[0].closing_financing_id == '')? 'notifyBank',//,
                                    object: formInstance.class,
                                    client_object: formInstance.client_object,
                                    params: {
                                        id: data.id
                                    }
                                };

                                socketQuery(o, function(res){
                                    formInstance.reload();
                                    formInstance.loader(false, 'Подождите, отправляем уведомления.');
                                });
                            }
                        },
                        success_without_sending: {
                            label: 'Пропустить этот шаг',
                            callback: function(){

                                var o = {
                                    command: 'notifyBank',
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
                                formInstance.loader(false, 'Подождите, отправляем уведомления.');
                            }
                        }
                    }
                });
            }
        },
        {
            title: 'Банк подтвердил начало работы',
            color: 'green',
            icon: "fa-check",
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: ['status_sysname'],
                matching: ['not_equal'],
                colValues: ['WAIT_BANK_CONFIRM']
            }],
            handler: function () {

                var data = formInstance.data.data[0];

                formInstance.loader(true, 'Секундочку, переводим в работу');

                var html = '<div class="row">' +
                    '<div class="col-md-12">' +
                    '<div class="form-group">' +
                    '<label>Укажите дату начала работы:</label>' +
                    '<input type="text" id="payment-start-date-input" class="form-control" value="" />' +
                    '</div>' +
                    '</div>' +
                    '</div>';

                bootbox.dialog({
                    title: 'Внимание!',
                    message: html,
                    buttons: {
                        success: {
                            label: 'Подтвердить',
                            callback: function(){


                                var p_date = $('#payment-start-date-input').val();

                                var o = {
                                    command: 'bankConfirm',
                                    object: formInstance.class,
                                    client_object: formInstance.client_object,
                                    params: {
                                        id: data.id,
                                        payments_start_date: p_date
                                    }
                                };


                                socketQuery(o, function(res2){

                                    if(!res2.code){
                                        formInstance.reload();
                                    }
                                    formInstance.loader(false, 'Секундочку, переводим в работу');
                                });

                            }
                        },
                        error: {
                            label: 'Отмена',
                            callback: function(){
                                formInstance.loader(false, 'Секундочку, переводим в работу');
                            }
                        }
                    }
                });

                $('#payment-start-date-input').datepicker({
                    language: 'ru',
                    format: 'dd.mm.yyyy',
                    autoclose: true,
                    todayBtn: 'linked'
                });



            }
        },
        {
            title: (formInstance.data.data[0].closing_financing_id == '')? 'Деньги отправлены торговцу' : 'Отправить деньги торговцу и рефинансировать',
            color: 'blue',
            icon: "fa-money",
            type: "SINGLE",
            hidden: false,
            condition: [{
                //colNames: ['status_sysname'],
                //matching: ['not_equal'],
                //colValues: ['BANK_CONFIRM']
                colNames: [],
                matching: [],
                colValues: []
            }],
            handler: function () {

                var loaderText = (formInstance.data.data[0].closing_financing_id == '')? 'Подождите, переводим в работу.' : 'Подождите, рефинансируем и переводим в работу.';

                formInstance.loader(true, loaderText);

                var data = formInstance.data.data[0];



                var html = '<div class="row">' +
                    '<div class="col-md-12">' +
                    '<div class="form-group">' +
                    '<label>Выберите файл (Скан-копия платежного документа):</label>' +
                    '<input id="upload_file" class="form-control" type="text"/><div>Файл прикладывать не обязательно.</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>';

                bootbox.dialog({
                    title: 'Загрузка платежного документа',
                    message: html,
                    buttons: {
                        success: {
                            label: 'Подтвердить',
                            callback: function(){

                                var filename = $('#upload_file').val();
                                formInstance.loader(true, 'Подождите, операция выполняется.');
                                var command_name = (formInstance.data.data[0].closing_financing_id == '')? 'moneySentAndSetInWork' : 'refinancing';

                                var o = {
                                    command: command_name,//'moneySentAndSetInWork',
                                    object: formInstance.class,
                                    client_object: formInstance.client_object,
                                    params: {
                                        id: data.id,
                                        filename: filename
                                    }
                                };

                                socketQuery(o, function(res){
                                    formInstance.reload();

                                    formInstance.loader(false, 'Подождите, операция выполняется.');

                                });

                                socket.off('closeFinancing_'+formInstance.data.data[0].closing_financing_id).on('closeFinancing_'+formInstance.data.data[0].closing_financing_id,function(data){

                                    var html = 'Подождите, идет процесс рефинансирования, это может занять некоторое время...<br/>Выполнение: '+data.percent+'%';

                                    $('.form-loader-text').html(html);

                                });

                            }
                        },
                        success_without_sending: {
                            label: 'Подтвердить (без уведомлений)',
                            callback: function(){

                                var filename = $('#upload_file').val();

                                formInstance.loader(true, 'Подождите, операция выполняется.');

                                var command_name = (formInstance.data.data[0].closing_financing_id == '')? 'moneySentAndSetInWork' : 'refinancing';

                                var o = {
                                    command: command_name,//'moneySentAndSetInWork',
                                    object: formInstance.class,
                                    client_object: formInstance.client_object,
                                    params: {
                                        id: data.id,
                                        filename: filename,
                                        without_sending:true
                                    }
                                };

                                socketQuery(o, function(res){
                                    formInstance.reload();

                                    formInstance.loader(false, 'Подождите, операция выполняется.');

                                });

                                socket.off('closeFinancing_'+formInstance.data.data[0].closing_financing_id).on('closeFinancing_'+formInstance.data.data[0].closing_financing_id,function(data){

                                    var html = 'Подождите, идет процесс рефинансирования, это может занять некоторое время...<br/>Выполнение: '+data.percent+'%';

                                    $('.form-loader-text').html(html);

                                });

                            }
                        },
                        error: {
                            label: 'Отмена',
                            callback: function(){
                                formInstance.loader(false, 'Подождите, операция выполняется.');
                            }
                        }
                    }
                });


                $('#upload_file').off('click').on('click', function(){
                    var loader = MB.Core.fileLoader;
                    loader.start({
                        params:{
                            not_public:true
                        },
                        success: function (uid) {
                            $('#upload_file').val(uid.name);
                        }
                    });
                });

            }
        },
        {
            title: (formInstance.data.data[0].closed_by_financing_id == '')? 'Подготовить рефинансирование':'Открыть рефинансирование',
            color: 'black',
            icon: "fa-refresh",
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: ['status_sysname','status_sysname'],
                matching: ['not_equal','not_equal'],
                colValues: ['IN_WORK','ACQUIRING_IN_PROCCESS']
            }],
            handler: function () {
                var data = formInstance.data.data[0];
                var refinFormId = MB.Core.guid();

                var add_o = {
                    command: 'prepareRefinancing',
                    object: 'merchant_financing',
                    params: {
                        id: data.id
                    }
                };

                function runFinancingCreation(){

                    formInstance.loader(true, 'Подождите, создаем рефинансирование.');

                    socketQuery(add_o, function(res){

                        if(!res.code){


                            var id = res.id;

                            var openInModalO = {
                                id: refinFormId,
                                name: 'form_merchant_refinancing',
                                class: 'merchant_financing',
                                client_object: 'form_merchant_refinancing',
                                type: 'form',
                                ids: [id],
                                position: 'center',
                                tablePKeys: {data_columns: ['id'], data: [id]}
                            };

                            var form = new MB.FormN(openInModalO);
                            form.create(function () {
                                var modal = MB.Core.modalWindows.windows.getWindow(refinFormId);
                                formInstance.loader(false, 'Подождите, создаем рефинансирование.');
                                formInstance.reload();
                            });


                        }else{

                            formInstance.loader(false, 'Подождите, создаем рефинансирование.');

                        }

                    });

                }

                if(formInstance.data.data[0].closed_by_financing_id == ''){

                    bootbox.dialog({
                        title: 'Выберите тип финансирования',
                        message: 'Фиксированный платеж или процент с ежедневного процессингового оборота?',
                        buttons: {
                            percent: {
                                label: 'Процент с оборота',
                                className: 'vg-modal-btn vg-modal-btn-blue',
                                callback: function(){
                                    add_o.params.financing_type_sysname = 'PERCENT';
                                    runFinancingCreation();
                                }
                            },
                            fixed: {
                                label: 'Фиксированный платеж',
                                className: 'vg-modal-btn vg-modal-btn-blue',
                                callback: function(){

                                    add_o.params.financing_type_sysname = 'FIXED';

                                    runFinancingCreation();

                                }
                            },
                            error: {
                                label: 'Отмена',
                                className: '',
                                callback: function(){

                                }
                            }
                        }
                    });


                }else{

                    var o2 = {
                        command: 'get',
                        object: 'merchant_financing',
                        params:{
                            id: formInstance.data.data[0].closed_by_financing_id
                            //param_where: {
                            //    id: formInstance.data.data[0].closed_by_financing_id
                            //}
                        }
                    };

                    socketQuery(o2, function(res){

                        if(!res.code){

                            var formName = (res.data[0].status_sysname == 'READY_TO_WORK' ||
                                res.data[0].status_sysname == 'ACQUIRING_IN_PROCCESS' ||
                                res.data[0].status_sysname == 'CLOSED')? 'form_merchant_financing_work' : 'form_merchant_refinancing';

                            var openInModalO = {
                                id: refinFormId,
                                name: formName,
                                class: 'merchant_financing',
                                client_object: formName,
                                type: 'form',
                                ids: [formInstance.data.data[0].closed_by_financing_id],
                                position: 'center',
                                tablePKeys: {data_columns: ['id'], data: [formInstance.data.data[0].closed_by_financing_id]}
                            };

                            var form = new MB.FormN(openInModalO);
                            form.create(function () {
                                var modal = MB.Core.modalWindows.windows.getWindow(refinFormId);
                                formInstance.loader(false, 'Подождите, создаем рефинансирование.');
                                formInstance.reload();
                            });


                        }else{

                            formInstance.loader(false, 'Подождите, создаем рефинансирование.');

                        }



                    });



                }

            }
        },
        {
            title: 'Закрыть финансирование',
            color: 'red',
            icon: "fa-times",
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: ['status_sysname','status_sysname'],
                matching: ['not_equal','not_equal'],
                colValues: ['IN_WORK','ACQUIRING_IN_PROCCESS']
            }],
            handler: function () {

                formInstance.loader(true, 'Подождите, идет процесс закрытия, это может занять некоторое время...<br/>');

                var data = formInstance.data.data[0];
                var html = '<select data-withempty="false" id="select-closing-type">';
                var selinstance;

                var o = {
                    command: 'get',
                    object: 'financing_close_type',
                    params: {

                    }
                };

                socketQuery(o, function(r){

                    if(!r.code){
                        for(var i in r.data){
                            var b = r.data[i];
                            var bid = b.id;
                            var bname = b.name;

                            html += '<option value="'+bid+'">'+bname+'</option>';

                        }

                        html += '</select>';

                        bootbox.dialog({
                            title: 'Выберите тип закрытия финансирования',
                            message: html,
                            buttons: {
                                success: {
                                    label: 'Подтвержить',
                                    callback: function () {

                                        var close_type_id = selinstance.value.id;

                                        var o = {
                                            command: 'closeFinancing',
                                            object: formInstance.class,
                                            client_object: formInstance.client_object,
                                            params: {
                                                id: data.id,
                                                closing_type_id: close_type_id
                                            }
                                        };

                                        socketQuery(o, function (res) {

                                            formInstance.reload();
                                            formInstance.loader(false, 'Подождите, идет процесс закрытия, это может занять некоторое время...<br/>');

                                        });


                                        socket.off('closeFinancing_'+data.id).on('closeFinancing_'+data.id,function(data){

                                            var html = 'Подождите, идет процесс закрытия, это может занять некоторое время...<br/>Выполнение: '+data.percent+'%';

                                            $('.form-loader-text').html(html);

                                        });

                                    }
                                },
                                error: {
                                    label: 'Отмена',
                                    callback: function () {
                                        formInstance.loader(false, 'Подождите, идет процесс закрытия, это может занять некоторое время...<br/>');
                                    }
                                }
                            }
                        });

                        selinstance = $('#select-closing-type').select3();

                    }


                });


            }
        }
    ];




}());

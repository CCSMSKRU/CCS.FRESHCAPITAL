(function () {

    let formID = MB.Forms.justLoadedId;
    let formInstance = MB.Forms.getForm('form_financing_request', formID);
    let formWrapper = $('#mw-' + formInstance.id);

    let modalInstance = MB.Core.modalWindows.windows.getWindow(formID);
    modalInstance.stick = 'top';
    modalInstance.stickModal();


    $("#scoring_tabs_wrapper").tabs();


    let parseObject = function (obj) {
        try {
            let content = '';

            if (typeof obj == 'object') {
                for (let key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        if (typeof obj[key] == 'object') {
                            if (Array.isArray(obj[key])) {
                                if (obj[key].length > 0) {
                                    if (obj[key].length == 1 && typeof obj[key][0] != 'object') {
                                        content += "<div class='po_key_wrapper'>";
                                        content += "<div class='po_key'>" + key + ":</div><div class='po_value'>" + obj[key][0] + '</div>';
                                        content += "</div>";
                                    } else {
                                        content += "<div class='po_key_wrapper column'>";
                                        content += "<div class='po_key'>" + key + ":</div><div class='po_value'>";

                                        obj[key].forEach(function (v, i) {
                                            content += parseObject(v);

                                            if (i < obj[key].length - 1) content += ';-;-\n';
                                        });

                                        content += '</div>';
                                        content += "</div>";
                                    }
                                }
                            } else {
                                content += "<div class='po_key_wrapper'>";
                                content += "<div class='po_key'>" + key + ":</div><div class='po_value'>";
                                content += parseObject(obj[key]) + '</div>';
                                content += "</div>";
                            }
                        } else {
                            content += "<div class='po_key_wrapper'>";
                            content += "<div class='po_key'>" + key + ":</div><div class='po_value'>" + obj[key] + '</div>';
                            content += "</div>";
                        }
                    }
                }

                return content;
            } else {
                return "\'" + obj + '\'\n';
            }
        } catch (e) {
            console.log(e);

            return 'error while parsing';
        }
    };


    let print2GISData = function (r) {
        try {
            let no_data = true;

            $('.gis_response').html('');

            if ('path' in r) {
                window.location.replace(r.path);
            }
            if ('body' in r && 'result' in r.body) {
                let result = r.body.result;

                if ('items' in result) {
                    no_data = false;
                    let items = result['items'];

                    $('.gis_response').append('<h4>Организации: </h4><ul class="gis_items"></ul>');

                    $.each(items, function (i, v) {
                        $('ul.gis_items').append('<li>' +
                            '<p>Название: ' + v['name'] + '</p>' +
                            '<p>Адрес: ' + v['address_name'] + '</p>' +
                            '</li>')
                    });
                }
            }

            if (no_data) {
                $('.gis_response').append('<h4>Нет данных</h4>');
            }
        } catch (e) {
            console.log(e);
        }
    };

    formWrapper.find('#get_from_2gis').off('click').on('click', function () {
        let o = {
            command: 'loadData',
            object: 'merchant_2gis_data',
            params: {
                org_name: $('#2gis_org_name_input').val()
            }
        };

        formInstance.loader(true, 'Подождите, загружаем данные.');

        socketQuery(o, function (r) {
            if ('body' in r && 'result' in r.body) {
                $('.gis_response').html('<div class="parsed_output">' + parseObject(r.body.result) + '</div>');
            } else {
                print2GISData(r);
            }

            if (!r.code) {
                formInstance.loader(false, 'Подождите, загружаем данные.');
            } else {
                formInstance.loader(false, 'Подождите, загружаем данные.');
            }
        });
    });

    formWrapper.find('#get_2gis_file').off('click').on('click', function () {
        let o = {
            command: 'saveDataToCSV',
            object: 'merchant_2gis_data',
            params: {
                org_name: $('#2gis_org_name_input').val()
            }
        };

        formInstance.loader(true, 'Подождите, загружаем данные.');

        socketQuery(o, function (r) {
            if ('body' in r) {
                $('.gis_response').html('<div class="parsed_output">' + parseObject(r.body) + '</div>');
            } else {
                print2GISData(r);
            }

            if ('path' in r) {
                window.location.replace(r.path);
            }

            if (!r.code) {
                formInstance.loader(false, 'Подождите, загружаем данные.');
            } else {
                formInstance.loader(false, 'Подождите, загружаем данные.');
            }
        });
    });


    formWrapper.find('#get_from_nbki').off('click').on('click', function () {
        let o = {
            command: 'loadData',
            object: 'merchant_nbki_data',
            params: {}
        };

        formInstance.loader(true, 'Подождите, загружаем данные.');

        socketQuery(o, function (r) {
            if ('body' in r && 'body' in r.body && 'product' in r.body.body && 'preply' in r.body.body.product) {
                $('.nbki_response').html('<div class="parsed_output">' + parseObject(r.body.body.product.preply.length == 1 ? r.body.body.product.preply[0] : r.body.body.product.preply) + '</div>');
            }

            if (!r.code) {
                formInstance.loader(false, 'Подождите, загружаем данные.');
            } else {
                formInstance.loader(false, 'Подождите, загружаем данные.');
            }
        });
    });

    formWrapper.find('#get_nbki_file').off('click').on('click', function () {
        let o = {
            command: 'saveDataToCSV',
            object: 'merchant_nbki_data',
            params: {}
        };

        formInstance.loader(true, 'Подождите, загружаем данные.');

        socketQuery(o, function (r) {
            if ('body' in r && 'product' in r.body && 'preply' in r.body.product) {
                $('.nbki_response').html('<div class="parsed_output">' + parseObject(r.body.product.preply.length == 1 ? r.body.product.preply[0] : r.body.product.preply) + '</div>');
            }

            if ('path' in r) {
                window.location.replace(r.path);
            }

            if (!r.code) {
                formInstance.loader(false, 'Подождите, загружаем данные.');
            } else {
                formInstance.loader(false, 'Подождите, загружаем данные.');
            }
        });
    });


    let printMoeDeloData = function (r) {
        try {
            let no_data = true;

            $('.moedelo_response').html('');

            if ('path' in r) {
                window.location.replace(r.path);
            }
            if ('body' in r) {
                let body = r.body;

                if ('Requisites' in body) {
                    no_data = false;
                    let requisites = body['Requisites'];

                    $('.moedelo_response').append('<h4>Реквизиты: </h4>' +
                        '<ul class="requisites">' +
                        '<li>' +
                        '<p>Название: ' + requisites['Name']['Full'] + '</p>' +
                        '<p>Адрес: ' + requisites['Address'] + '</p>' +
                        '<p>ИНН: ' + requisites['Inn'] + '</p>' +
                        '<p>ОГРН: ' + requisites['Ogrn'] + '</p>' +
                        '<p>ПФР: ' + requisites['PfrNumber'] + '</p>' +
                        '</li>' +
                        '</ul>');
                }

                if ('Arbitrations' in body) {
                    no_data = false;
                    let arbitrations = body['Arbitrations'];

                    $('.moedelo_response').append('<h4>Суды: </h4><ul class="arbitrations"></ul>');

                    $.each(arbitrations, function (i, v) {
                        $('ul.arbitrations').append('<li>' +
                            '<p>Номер: ' + v['Number'] + '</p>' +
                            '<p>Категория: ' + v['Category'] + '</p>' +
                            '<p>Дата закрытия: ' + moment(v['CloseDate']).format("MMMM D, YYYY") + '</p>' +
                            '</li>')
                    });
                }

                if ('Founders' in body) {
                    no_data = false;
                    let founders = body['Founders'];

                    $('.moedelo_response').append('<h4>Основатели: </h4><ul class="founders"></ul>');

                    $.each(founders, function (i, v) {
                        $('ul.founders').append('<li>' +
                            '<p>Название: ' + v['FullName'] + '</p>' +
                            '<p>Сумма: ' + v['Amount'] + '</p>' +
                            '</li>')
                    });
                }

                if ('StateContracts' in body && 'Contracts' in body['StateContracts']) {
                    no_data = false;
                    let contracts = body['StateContracts']['Contracts'];

                    $('.moedelo_response').append('<h4>Контракты: </h4><ul class="contracts"></ul>');

                    $.each(contracts, function (i, v) {
                        $('ul.contracts').append('<li>' +
                            '<p>Предмет контракта: ' + v['SubjectContract'] + '</p>' +
                            '<p>Партнер: ' + v['Name'] + '</p>' +
                            '<p>Сумма: ' + v['Amount'] + '</p>' +
                            '</li>')
                    });
                }
            }

            if (no_data) {
                $('.moedelo_response').append('<h4>Нет данных</h4>');
            }
        } catch (e) {
            console.log(e);
        }
    };

    formWrapper.find('#get_from_moedelo').off('click').on('click', function () {
        let o = {
            command: 'loadData',
            object: 'merchant_moedelo_data',
            params: {
                inn_ogrn: +$('#moedelo_input').val()
            }
        };

        formInstance.loader(true, 'Подождите, загружаем данные.');

        socketQuery(o, function (r) {
            if ('body' in r) {
                $('.moedelo_response').html('<div class="parsed_output">' + parseObject(r.body) + '</div>');
            } else {
                printMoeDeloData(r);
            }

            if (!r.code) {
                formInstance.loader(false, 'Подождите, загружаем данные.');
            } else {
                formInstance.loader(false, 'Подождите, загружаем данные.');
            }
        });
    });

    formWrapper.find('#get_moedelo_file').off('click').on('click', function () {
        let o = {
            command: 'saveDataToCSV',
            object: 'merchant_moedelo_data',
            params: {
                inn_ogrn: +$('#moedelo_input').val()
            }
        };

        formInstance.loader(true, 'Подождите, загружаем данные.');

        socketQuery(o, function (r) {
            if ('body' in r) {
                $('.moedelo_response').html('<div class="parsed_output">' + parseObject(r.body) + '</div>');
            } else {
                printMoeDeloData(r);
            }

            if ('path' in r) {
                window.location.replace(r.path);
            }

            if (!r.code) {
                formInstance.loader(false, 'Подождите, загружаем данные.');
            } else {
                formInstance.loader(false, 'Подождите, загружаем данные.');
            }
        });
    });


    formWrapper.find('#req-calc-by-payment').off('click').on('click', function () {

        var o = {
            command: 'recalculate',
            object: 'financing_request',
            params: {
                recalc_type: 'by_payment_amount',
                id: formInstance.activeId
            }
        };

        socketQuery(o, function (res) {

            console.log('RREEEESS', res);

            formInstance.reload();

        });

    });

    formWrapper.find('#req-calc-by-amount').off('click').on('click', function () {

        var o = {
            command: 'recalculate',
            object: 'financing_request',
            params: {
                recalc_type: 'by_founding_amount',
                id: formInstance.activeId
            }
        };

        socketQuery(o, function (res) {

            console.log('RREEEESS', res);

            formInstance.reload();

        });

    });

    formWrapper.find('#req-calc-by-count').off('click').on('click', function () {

        var o = {
            command: 'recalculate',
            object: 'financing_request',
            params: {
                recalc_type: 'by_payments_count',
                id: formInstance.activeId
            }
        };

        socketQuery(o, function (res) {

            console.log('RREEEESS', res);

            formInstance.reload();

        });

    });

    formWrapper.find('#req-calc-by-percent').off('click').on('click', function () {

        var o = {
            command: 'recalculate',
            object: 'financing_request',
            params: {
                recalc_type: 'percent',
                id: formInstance.activeId
            }
        };

        socketQuery(o, function (res) {

            console.log('RREEEESS', res);

            formInstance.reload();

        });

    });

    formWrapper.find('#req-get-excel').off('click').on('click', function () {

        var o = {
            command: 'request_report',
            object: 'financing_request',
            params: {
                id: formInstance.activeId
            }
        };

        socketQuery(o, function (res) {

            if (!res.code) {
                var fileName = res.path + res.filename;
                var linkName = 'my_download_link' + MB.Core.guid();

                var nameRu = 'Заявка ' + formInstance.data.data[0].merchant_name + ' от ' + formInstance.data.data[0].request_date.substr(0, 10) || res.filename;

                nameRu = nameRu.replaceAll('\'', '');
                nameRu = nameRu.replaceAll('"', '');
                nameRu = nameRu.replaceAll('`', '');
                nameRu = nameRu.replaceAll('.', '-');

                $("body").prepend('<a id="' + linkName + '" href="' + res.path + res.filename + '" download="' + nameRu + '" style="display:none;"></a>');
                var jqElem = $('#' + linkName);
                jqElem[0].click();
                jqElem.remove();
            }

        });

    });

    formWrapper.find('#req-get-comm-offer').off('click').on('click', function () {

        var tpl = '' +
            '<div class="form-group"><label>Должность кому (стереть если ИП):</label><input class="form-control" type="text" id="whom-1" value="{{executive_dative}}"></div>' +
            '<div class="form-group"><label>ООО / ИП: <span id="ip-replacer">Индивидуальному предпринимателю</span></label><input class="form-control" type="text" id="whom-2" value="{{short_name}}"></div>' +
            '<div class="form-group"><label>ФИО (кому):</label><input class="form-control" type="text" id="whom-3" value="{{fio_dative}}"></div>' +
            '<div class="form-group"><label>Уважаемый: <span id="gender-replacer">Уважаемая</span></label><input class="form-control" type="text" id="whom-gender" value="Уважаемый"></div>' +
            '<div class="form-group"><label>Имя Фамилия:</label><input class="form-control" type="text" id="whom-4" value="{{io}}"></div>';


        var fio = formInstance.data.data[0].executive_fio;
        var fio_arr = fio.split(' ');
        var io = fio_arr[1] + ' ' + fio_arr[2];

        var person = {
            first: fio_arr[1],
            middle: fio_arr[2],
            last: fio_arr[0]
        };

        var fio_dative = petrovich(person, 'genitive');

        fio_dative = fio_dative.last + ' ' + fio_dative.first.substr(0, 1) + '. ' + fio_dative.middle.substr(0, 1) + '.';

        var mo = {
            executive_dative: formInstance.data.data[0].executive_dative || 'Генеральному директору',
            short_name: formInstance.data.data[0].short_name || formInstance.data.data[0].merchant_name,
            fio_dative: fio_dative,
            io: io
        };

        tpl = Mustache.to_html(tpl, mo);

        bootbox.dialog({
            title: 'Коммерческое предложение',
            message: tpl,
            buttons: {
                success: {
                    label: 'Сформировать',
                    callback: function () {

                        var o = {
                            command: 'commercial_offer',
                            object: 'financing_request',
                            params: {
                                id: formInstance.activeId,
                                dative_executive: $('#whom-1').val(),
                                ip_or_short_name: $('#whom-2').val(),
                                dative_fio: $('#whom-3').val(),
                                respectable: $('#whom-gender').val(),
                                io: $('#whom-4').val()
                            }
                        };

                        socketQuery(o, function (res) {

                            if (!res.code) {
                                var fileName = res.path + res.filename;
                                var linkName = 'my_download_link' + MB.Core.guid();

                                var nameRu = 'Коммерческое предложение от VGFinancing & ВТБ24' || res.filename;

                                nameRu = nameRu.replaceAll('\'', '');
                                nameRu = nameRu.replaceAll('"', '');
                                nameRu = nameRu.replaceAll('`', '');
                                nameRu = nameRu.replaceAll('.', '-');

                                $("body").prepend('<a id="' + linkName + '" href="' + res.path + res.filename + '" download="' + nameRu + '" style="display:none;"></a>');
                                var jqElem = $('#' + linkName);
                                jqElem[0].click();
                                jqElem.remove();
                            }

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


        $('#ip-replacer').off('click').on('click', function () {

            $('#whom-1').val('');
            $('#whom-2').val('Индивидуальному предпринимателю');

        });

        $('#gender-replacer').off('click').on('click', function () {

            $('#whom-gender').val('Уважаемая');

        });


    });

    formWrapper.find('#req-execute').off('click').on('click', function () {

        var o = {
            command: 'request_to_merchant',
            object: 'financing_request',
            params: {
                id: formInstance.activeId
            }
        };

        socketQuery(o, function (res) {

            console.log('RREEEESS', res);

            formInstance.reload();

        });

    });

    //formInstance.lowerButtons = [
    //    {
    //        title: 'Сменить Банк (РКО)',
    //        color: "blue",
    //        icon: "fa-money",
    //        type: "SINGLE",
    //        hidden: false,
    //        condition: [{
    //            colNames: [],
    //            matching: [],
    //            colValues: []
    //        }],
    //        handler: function () {
    //            var data = formInstance.data.data[0];
    //            var html = '<select data-withempty="false" id="select-work-bank-holder">';
    //            var selinstance;
    //
    //            var o = {
    //                command: 'get',
    //                object: 'bank',
    //                params: {
    //                    param_where:
    //                        {
    //                            is_work: true
    //                        }
    //                }
    //            };
    //
    //            socketQuery(o, function(r){
    //
    //                for(var i in r.data){
    //                    var b = r.data[i];
    //                    var bid = b.id;
    //                    var bname = b.name;
    //
    //                    html += '<option value="'+bid+'">'+bname+'</option>';
    //
    //                }
    //
    //                html += '</select>';
    //
    //                bootbox.dialog({
    //                    title: 'Выберите рабочий банк (РКО)',
    //                    message: html,
    //                    buttons: {
    //                        success: {
    //                            label: 'Подтвердить',
    //                            callback: function () {
    //
    //                                var rko_bank_id = selinstance.value.id;
    //
    //                                var o = {
    //                                    command: 'change_rko_bank',
    //                                    object: formInstance.class,
    //                                    client_object: formInstance.client_object,
    //                                    params: {
    //                                        id: data.id,
    //                                        rko_bank_id: rko_bank_id
    //                                    }
    //                                };
    //
    //                                socketQuery(o, function (res) {
    //                                    formInstance.reload();
    //                                });
    //                            }
    //                        },
    //                        error: {
    //                            label: 'Отмена',
    //                            callback: function () {
    //
    //                            }
    //                        }
    //                    }
    //                });
    //
    //                selinstance = $('#select-work-bank-holder').select3();
    //
    //            });
    //
    //        }
    //    },
    //    {
    //        title: 'Сменить Банк (Эквайер)',
    //        color: "blue",
    //        icon: "fa-credit-card",
    //        type: "SINGLE",
    //        hidden: false,
    //        condition: [{
    //            colNames: [],
    //            matching: [],
    //            colValues: []
    //        }],
    //        handler: function () {
    //            var data = formInstance.data.data[0];
    //            var html = '<select data-withempty="false" id="select-work-bank-holder">';
    //            var selinstance;
    //
    //            var o = {
    //                command: 'get',
    //                object: 'bank',
    //                params: {
    //                    param_where:
    //                    {
    //                        is_work: true
    //                    }
    //                }
    //            };
    //
    //            socketQuery(o, function(r){
    //
    //                for(var i in r.data){
    //                    var b = r.data[i];
    //                    var bid = b.id;
    //                    var bname = b.name;
    //
    //                    html += '<option value="'+bid+'">'+bname+'</option>';
    //
    //                }
    //
    //                html += '</select>';
    //
    //                bootbox.dialog({
    //                    title: 'Выберите рабочий банк (Эквайер)',
    //                    message: html,
    //                    buttons: {
    //                        success: {
    //                            label: 'Подтвердить',
    //                            callback: function () {
    //
    //                                var processing_bank_id = selinstance.value.id;
    //
    //                                var o = {
    //                                    command: 'change_processing_bank',
    //                                    object: formInstance.class,
    //                                    client_object: formInstance.client_object,
    //                                    params: {
    //                                        id: data.id,
    //                                        processing_bank_id: processing_bank_id
    //                                    }
    //                                };
    //
    //                                socketQuery(o, function (res) {
    //                                    formInstance.reload();
    //                                });
    //                            }
    //                        },
    //                        error: {
    //                            label: 'Отмена',
    //                            callback: function () {
    //
    //                            }
    //                        }
    //                    }
    //                });
    //
    //                selinstance = $('#select-work-bank-holder').select3();
    //
    //            });
    //
    //        }
    //    },
    //    {
    //        title: 'Деньги отправлены',
    //        color: "green",
    //        icon: "fa-money",
    //        type: "SINGLE",
    //        hidden: false,
    //        condition: [{
    //            colNames: ['money_sent'],
    //            matching: ['not_equal'],
    //            colValues: [false]
    //        }],
    //        handler: function () {
    //            var data = formInstance.data.data[0];
    //
    //            var html = '<div class="row"><div class="col-md-12"><div class="form-group"><label>Выберите файл (Скан платежки):</label><input id="upload_payment_account" class="form-control" type="text"/></div></div></div>';
    //
    //            bootbox.dialog({
    //                title: 'Загрузите скан платежки',
    //                message: html,
    //                buttons: {
    //                    success: {
    //                        label: 'Загрузить',
    //                        callback: function () {
    //
    //                            var filename = $('#upload_payment_account').val();
    //
    //                            var o = {
    //                                command: 'makePayment',
    //                                object: formInstance.class,
    //                                client_object: formInstance.client_object,
    //                                params: {
    //                                    id: data.id,
    //                                    filename: filename
    //                                }
    //                            };
    //
    //                            socketQuery(o, function (res) {
    //                                formInstance.reload();
    //                            });
    //                        }
    //                    },
    //                    error: {
    //                        label: 'Отмена',
    //                        callback: function () {
    //
    //                        }
    //                    }
    //                }
    //            });
    //
    //            $('#upload_payment_account').off('click').on('click', function(){
    //                var loader = MB.Core.fileLoader;
    //                loader.start({
    //                    params:{
    //                        not_public:true
    //                    },
    //                    success: function (uid) {
    //                        $('#upload_payment_account').val(uid.name);
    //                    }
    //                });
    //            });
    //
    //
    //        }
    //    },
    //    {
    //        title: 'Отправить уведомление в банк',
    //        color: "green",
    //        icon: "fa-comment-o",
    //        type: "SINGLE",
    //        hidden: false,
    //        condition: [{
    //            colNames: ['bank_notified'],
    //            matching: ['not_equal'],
    //            colValues: [false]
    //        }],
    //        handler: function () {
    //            var data = formInstance.data.data[0];
    //
    //            //var html = '<div class="row"><div class="col-md-12"><div class="form-group"><label>Выберите файл (Скан платежки):</label><input id="upload_payment_account" class="form-control" type="text"/></div></div></div>';
    //
    //            bootbox.dialog({
    //                title: 'Отправить календарь в банк',
    //                message: ' ',
    //                buttons: {
    //                    success: {
    //                        label: 'Отправить',
    //                        callback: function(){
    //
    //                            var o = {
    //                                command: 'notifyBank',
    //                                object: formInstance.class,
    //                                client_object: formInstance.client_object,
    //                                params: {
    //                                    id: data.id
    //                                }
    //                            };
    //
    //                            socketQuery(o, function(res){
    //                                formInstance.reload();
    //                            });
    //                        }
    //                    },
    //                    success_without_sending: {
    //                        label: 'Пропустить этот шаг',
    //                        callback: function(){
    //
    //                            var o = {
    //                                command: 'notifyBank',
    //                                object: formInstance.class,
    //                                client_object: formInstance.client_object,
    //                                params: {
    //                                    id: data.id,
    //                                    without_sending:true
    //                                }
    //                            };
    //
    //                            socketQuery(o, function(res){
    //                                formInstance.reload();
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
    //        }
    //    }
    //];
    //
    //formWrapper.find('.recalculate').off('click').on('click', function(){
    //
    //    var data = formInstance.data.data[0];
    //
    //    if(formInstance.changes.length > 0){
    //        toastr['info']('Сначала сохраните анкету.', 'Внимание!');
    //    }else{
    //
    //        var o = {
    //            command:'recalcWorksheet',
    //            object: formInstance.class,
    //            client_object: formInstance.client_object,
    //            params:{
    //                id:data.id
    //            }
    //        };
    //
    //        bootbox.dialog({
    //            title: 'Выполнить перерасчет',
    //            message: 'Исходя из суммы фондирования или по классическим параметрам?',
    //            buttons: {
    //                byfounding: {
    //                    label: 'По сумме фондирования',
    //                    callback: function(){
    //                        o.params.dont_recalc_founding_amount = true;
    //                        socketQuery(o, function (res) {
    //                            if (!+res.code) formInstance.reload();
    //                        });
    //                    }
    //                },
    //                byclassic: {
    //                    label: 'По классическим параметрам',
    //                    callback: function(){
    //                        socketQuery(o, function (res) {
    //                            if (!+res.code) formInstance.reload();
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
    //    }
    //
    //});
    //
    //formWrapper.find('.great-create-new-financing').off('click').on('click', function(){
    //
    //    var add_o = {
    //        command: 'add',
    //        object: 'merchant_financing',
    //        params: {
    //            merchant_id: formInstance.activeId
    //        }
    //    };
    //
    //    function runFinancingCreation(){
    //        formInstance.loader(true, 'Подождите, создаем финансирование.');
    //
    //        socketQuery(add_o, function(r){
    //
    //            if(!r.code){
    //
    //                var id = r.id;
    //
    //                formInstance.reload(function(){
    //
    //                    var financing_tbl = formInstance.getChildTbl('merchant_financing');
    //
    //                    financing_tbl.openFormById(id, function(){
    //                        formInstance.loader(false, 'Подождите, создаем финансирование.');
    //                    });
    //
    //                });
    //            }else{
    //                formInstance.loader(false, 'Подождите, создаем финансирование.');
    //            }
    //
    //        });
    //    }
    //
    //
    //    function runLeadTypeDialog(){
    //
    //        var data = formInstance.data.data[0];
    //        var html = '<select data-withempty="false" id="select-lead-type-holder">';
    //        var selinstance;
    //
    //        var o = {
    //            command: 'get',
    //            object: 'lead_type',
    //            params: {}
    //        };
    //
    //        socketQuery(o, function(r){
    //
    //            for(var i in r.data){
    //                var b = r.data[i];
    //                var bid = b.id;
    //                var bsys = b.sysname;
    //                var bname = b.name;
    //
    //                html += '<option value="'+bsys+'">'+bname+'</option>';
    //
    //            }
    //
    //            html += '</select>';
    //
    //            bootbox.dialog({
    //                title: 'Выберите тип поступления лида',
    //                message: html,
    //                buttons: {
    //                    success: {
    //                        label: 'Подтвердить',
    //                        callback: function () {
    //
    //                            if(selinstance.value.id == -1){
    //
    //                                toastr['warning']('Выберите тип поступления лида');
    //
    //                                return false;
    //
    //                            }else{
    //
    //                                add_o.params.lead_type_sysname = selinstance.value.id;
    //                                runFinancingCreation();
    //
    //                            }
    //
    //                        }
    //                    },
    //                    error: {
    //                        label: 'Отмена',
    //                        callback: function () {
    //
    //                        }
    //                    }
    //                }
    //            });
    //
    //            selinstance = $('#select-lead-type-holder').select3();
    //
    //        });
    //
    //
    //    }
    //
    //
    //
    //    bootbox.dialog({
    //        title: 'Выберите тип финансирования',
    //        message: 'Фиксированный платеж или процент с ежедневного процессингового оборота?',
    //        buttons: {
    //            percent: {
    //                label: 'Процент с оборота',
    //                className: 'vg-modal-btn vg-modal-btn-blue',
    //                callback: function(){
    //                    add_o.params.financing_type_sysname = 'PERCENT';
    //
    //                    runLeadTypeDialog();
    //                }
    //            },
    //            fixed: {
    //                label: 'Фиксированный платеж',
    //                className: 'vg-modal-btn vg-modal-btn-blue',
    //                callback: function(){
    //
    //                    add_o.params.financing_type_sysname = 'FIXED';
    //
    //                    runLeadTypeDialog();
    //
    //                }
    //            },
    //            error: {
    //                label: 'Отмена',
    //                className: '',
    //                callback: function(){
    //
    //                }
    //            }
    //        }
    //    });
    //
    //
    //
    //
    //});

}());

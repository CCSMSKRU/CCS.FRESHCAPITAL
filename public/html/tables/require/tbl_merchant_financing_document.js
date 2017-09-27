(function () {

    var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);

    var parentForm = tableInstance.parentObject;

    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option0',
            title: 'Сформировать документ',
            disabled: function(){
                return false;
            },
            callback: function(){

                // Загрузить файл,
                // отправить операцию загрузить документ

                var row = tableInstance.ct_instance.selectedRowIndex;
                var id = tableInstance.data.data[row].id;
                var document_sysname = tableInstance.data.data[row].document_sysname;

                //=====================================


                var mer_o = {
                    command: 'get',
                    object: 'merchant',
                    params: {
                        param_where: {
                            id: parentForm.data.data[0].merchant_id
                        }
                    }
                };

                socketQuery(mer_o, function (res) {

                    var merchant = res.data[0];
                    var agr_numer_g = merchant.through_number;

                    var tpl,fio,fio_arr,io,person,fio_dative,fio_short,mo;

                    switch(document_sysname){
                        case 'MAIN_AGREEMENT_PDF':

                            tpl = '' +
                                '<div class="form-group"><label>Номер договора:</label><input class="form-control" type="text" id="agr_number" value="{{agr_number}}"></div>'+
                                //'<div class="form-group"><label>Дата договора (ДД.ММ.ГГГГ):</label><input class="form-control" type="text" id="agr_date" value="{{agr_date}}"></div>'+
                                '<div class="form-group"><label>Должность (им. падеж):</label><input class="form-control" type="text" id="executive_native" value="{{executive_native}}"></div>'+
                                '<div class="form-group"><label>Должность (в лице):</label><input class="form-control" type="text" id="executive" value="{{executive}}"></div>'+
                                '<div class="form-group"><label>ФИО (в лице):</label><input class="form-control" type="text" id="fio" value="{{fio}}"></div>'+
                                '<div class="form-group"><label>Фамилия И. О.:</label><input class="form-control" type="text" id="fio_short" value="{{fio_short}}"></div>'+
                                '<div class="form-group"><label>Действующего/ей:<span id="grounds_end_replacer" class="prepare-replacer">Действующей</span></label><input class="form-control" type="text" id="grounds_end" value="{{grounds_end}}"></div>'+
                                '<div class="form-group"><label>На основании:</label><input class="form-control" type="text" id="grounds" value="{{grounds}}"></div>'+
                                '<div class="form-group"><label>Кол-во платежей (для процентного):</label><input class="form-control" type="text" id="payments_count" value="{{payments_count}}"></div>';

                            fio = merchant.executive_fio;
                            fio_arr = fio.split(' ');

                            var isExtName = fio_arr[2] == undefined;

                            fio_arr[2] = fio_arr[2] || 'Петрович';

                            io = fio_arr[1] + ' ' + fio_arr[2];



                            person = {
                                first: fio_arr[1],
                                middle: fio_arr[2],
                                last: fio_arr[0]
                            };


                            fio_dative = petrovich(person, 'genitive');

                            if(isExtName){
                                fio_dative.middle = '';
                                fio_arr[2] = '';
                                io = fio_arr[1];
                            }

                            fio_dative = fio_dative.last + ' ' + fio_dative.first + ' ' + fio_dative.middle;

                            fio_short = (isExtName)? fio_arr[0] + ' ' + fio_arr[1].substr(0,1) + '.' : fio_arr[0] + ' ' + fio_arr[1].substr(0,1) + '. ' + fio_arr[2].substr(0,1) + '.';

                            mo = {
                                agr_number: agr_numer_g,
                                agr_date: '',
                                executive: 'Генерального директора',
                                executive_native: merchant.executive,
                                fio: fio_dative,
                                fio_short: fio_short,
                                grounds_end: 'действующего',
                                grounds: 'Устава',
                                payments_count: 60
                            };

                            tpl = Mustache.to_html(tpl,mo);

                            bootbox.dialog({
                                title: 'Договор финансирования',
                                message: tpl,
                                buttons: {
                                    success: {
                                        label: 'Сформировать',
                                        callback: function () {

                                            var o = {
                                                command: 'generateDocument',
                                                object: 'merchant_financing',
                                                params: {
                                                    id: parentForm.data.data[0].id,
                                                    document_sysname:   document_sysname,
                                                    agr_number:         $('#agr_number').val(),
                                                    agr_date:           $('#agr_date').val(),
                                                    fio:                $('#fio').val(),
                                                    fio_short:          $('#fio_short').val(),
                                                    executive:          $('#executive').val(),
                                                    executive_native:   $('#executive_native').val(),
                                                    grounds_end:        $('#grounds_end').val(),
                                                    grounds:            $('#grounds').val(),
                                                    payments_count:     $('#payments_count').val()
                                                }
                                            };

                                            agr_numer_g = $('#agr_number').val();

                                            socketQuery(o, function (res) {

                                                console.log(res);

                                                if(!res.code){
                                                    var fileName = res.path + res.filename;
                                                    var linkName = 'my_download_link' + MB.Core.guid();

                                                    var nameRu = 'Договор '+agr_numer_g || res.filename;

                                                    nameRu = nameRu.replaceAll('\'','');
                                                    nameRu = nameRu.replaceAll('"','');
                                                    nameRu = nameRu.replaceAll('`','');
                                                    nameRu = nameRu.replaceAll('.','-');

                                                    $("body").prepend('<a id="'+linkName+'" href="' + res.path + res.filename +'" download="'+ nameRu+'" style="display:none;"></a>');
                                                    var jqElem = $('#'+linkName);
                                                    jqElem[0].click();
                                                    jqElem.remove();
                                                }else{
                                                    return false;
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


                            $('#grounds_end_replacer').off('click').on('click', function () {

                                $('#grounds_end').val('действующей');

                            });

                            $('#agr_date').datepicker({
                                autoclose: true,
                                todayHighlight: true,
                                //minuteStep: 10,
                                keyboardNavigation: false,
                                todayBtn: true,
                                firstDay: 1,
                                format: 'dd.mm.yyyy',
                                weekStart: 1,
                                language: "ru"
                            });

                            break;
                        case 'SUPPLEMENTARY_AGREEMENT_PDF':

                            tpl = '' +
                                '<div class="form-group"><label>Номер договора:</label><input class="form-control" type="text" id="agr_number" value="{{agr_number}}"></div>'+
                                    //'<div class="form-group"><label>Дата договора (ДД.ММ.ГГГГ):</label><input class="form-control" type="text" id="agr_date" value="{{agr_date}}"></div>'+
                                '<div class="form-group"><label>Должность (им. падеж):</label><input class="form-control" type="text" id="executive_native" value="{{executive_native}}"></div>'+
                                '<div class="form-group"><label>Должность (в лице):</label><input class="form-control" type="text" id="executive" value="{{executive}}"></div>'+
                                '<div class="form-group"><label>ФИО (в лице):</label><input class="form-control" type="text" id="fio" value="{{fio}}"></div>'+
                                '<div class="form-group"><label>Фамилия И. О.:</label><input class="form-control" type="text" id="fio_short" value="{{fio_short}}"></div>'+
                                '<div class="form-group"><label>Действующего/ей:<span id="grounds_end_replacer" class="prepare-replacer">Действующей</span></label><input class="form-control" type="text" id="grounds_end" value="{{grounds_end}}"></div>'+
                                '<div class="form-group"><label>На основании:</label><input class="form-control" type="text" id="grounds" value="{{grounds}}"></div>'+
                                '<div class="form-group"><label>Кол-во платежей (для процентного):</label><input class="form-control" type="text" id="payments_count" value="{{payments_count}}"></div>'+
                                '<div class="form-group"><label>Дата и номер Договора эквайринга:</label><input class="form-control" type="text" id="number_and_date_acquiring_agreement" value="{{number_and_date_acquiring_agreement}}"></div>';

                            fio = merchant.executive_fio;
                            fio_arr = fio.split(' ');

                            var isExtName = fio_arr[2] == undefined;

                            fio_arr[2] = fio_arr[2] || 'Петрович';
                            io = fio_arr[1] + ' ' + fio_arr[2];

                            person = {
                                first: fio_arr[1],
                                middle: fio_arr[2],
                                last: fio_arr[0]
                            };


                            fio_dative = petrovich(person, 'genitive');

                            if(isExtName){
                                fio_dative.middle = '';
                                fio_arr[2] = '';
                                io = fio_arr[1];
                            }

                            fio_dative = fio_dative.last + ' ' + fio_dative.first + ' ' + fio_dative.middle;

                            fio_short = (isExtName)? fio_arr[0] + ' ' + fio_arr[1].substr(0,1) + '.' : fio_arr[0] + ' ' + fio_arr[1].substr(0,1) + '. ' + fio_arr[2].substr(0,1) + '.';

                            mo = {
                                agr_number: agr_numer_g,
                                agr_date: '',
                                executive: 'Генерального директора',
                                executive_native: merchant.executive,
                                fio: fio_dative,
                                fio_short: fio_short,
                                grounds_end: 'действующего',
                                grounds: 'Устава',
                                payments_count: 60,
                                number_and_date_acquiring_agreement: merchant.number_and_date_acquiring_agreement
                            };

                            tpl = Mustache.to_html(tpl,mo);

                            bootbox.dialog({
                                title: 'Доп. соглашение',
                                message: tpl,
                                buttons: {
                                    success: {
                                        label: 'Сформировать',
                                        callback: function () {

                                            var o = {
                                                command: 'generateDocument',
                                                object: 'merchant_financing',
                                                params: {
                                                    id: parentForm.data.data[0].id,
                                                    document_sysname:   document_sysname,
                                                    agr_number:         $('#agr_number').val(),
                                                    agr_date:           $('#agr_date').val(),
                                                    fio:                $('#fio').val(),
                                                    fio_short:          $('#fio_short').val(),
                                                    executive:          $('#executive').val(),
                                                    executive_native:   $('#executive_native').val(),
                                                    grounds_end:        $('#grounds_end').val(),
                                                    grounds:            $('#grounds').val(),
                                                    payments_count:     $('#payments_count').val(),
                                                    number_and_date_acquiring_agreement:     $('#number_and_date_acquiring_agreement').val()
                                                }
                                            };

                                            agr_numer_g = $('#agr_number').val();

                                            socketQuery(o, function (res) {

                                                console.log(res);

                                                if(!res.code){
                                                    var fileName = res.path + res.filename;
                                                    var linkName = 'my_download_link' + MB.Core.guid();

                                                    var nameRu = 'Дополнительное соглашение к Договору '+agr_numer_g || res.filename;

                                                    nameRu = nameRu.replaceAll('\'','');
                                                    nameRu = nameRu.replaceAll('"','');
                                                    nameRu = nameRu.replaceAll('`','');
                                                    nameRu = nameRu.replaceAll('.','-');

                                                    $("body").prepend('<a id="'+linkName+'" href="' + res.path + res.filename +'" download="'+ nameRu+'" style="display:none;"></a>');
                                                    var jqElem = $('#'+linkName);
                                                    jqElem[0].click();
                                                    jqElem.remove();
                                                }else{
                                                    return false;
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


                            $('#grounds_end_replacer').off('click').on('click', function () {

                                $('#grounds_end').val('действующей');

                            });

                            $('#agr_date').datepicker({
                                autoclose: true,
                                todayHighlight: true,
                                //minuteStep: 10,
                                keyboardNavigation: false,
                                todayBtn: true,
                                firstDay: 1,
                                format: 'dd.mm.yyyy',
                                weekStart: 1,
                                language: "ru"
                            });

                            break;
                        case 'PAYMENT_SCHEDULE':


                            fio = merchant.executive_fio;
                            fio_arr = fio.split(' ');
                            var isExtName = fio_arr[2] == undefined;

                            fio_arr[2] = fio_arr[2] || 'Петрович';

                            io = fio_arr[1] + ' ' + fio_arr[2];



                            person = {
                                first: fio_arr[1],
                                middle: fio_arr[2],
                                last: fio_arr[0]
                            };


                            fio_dative = petrovich(person, 'genitive');

                            if(isExtName){
                                fio_dative.middle = '';
                                fio_arr[2] = '';
                                io = fio_arr[1];
                            }

                            fio_dative = fio_dative.last + ' ' + fio_dative.first + ' ' + fio_dative.middle;

                            fio_short = (isExtName)? fio_arr[0] + ' ' + fio_arr[1].substr(0,1) + '.' : fio_arr[0] + ' ' + fio_arr[1].substr(0,1) + '. ' + fio_arr[2].substr(0,1) + '.';

                            var o = {
                                command: 'generateDocument',
                                object: 'merchant_financing',
                                params: {
                                    id: parentForm.data.data[0].id,
                                    document_sysname:   document_sysname,
                                    fio_short: fio_short
                                }
                            };


                            socketQuery(o, function (res) {

                                if(!res.code){
                                    var fileName = res.path + res.filename;
                                    var linkName = 'my_download_link' + MB.Core.guid();

                                    var nameRu = 'График платежей '+ merchant.short_name || res.filename;

                                    nameRu = nameRu.replaceAll('\'','');
                                    nameRu = nameRu.replaceAll('"','');
                                    nameRu = nameRu.replaceAll('`','');
                                    nameRu = nameRu.replaceAll('.','-');

                                    $("body").prepend('<a id="'+linkName+'" href="' + res.path + res.filename +'" download="'+ nameRu+'" style="display:none;"></a>');
                                    var jqElem = $('#'+linkName);
                                    jqElem[0].click();
                                    jqElem.remove();
                                }

                            });



                            break;
                        case 'APPLICATION_4':

                            tpl = '' +
                            '<div class="form-group"><label>Номер договора:</label><input class="form-control" type="text" id="agr_number" value="{{agr_number}}"></div>'+
                                //'<div class="form-group"><label>Должность (им. падеж):</label><input class="form-control" type="text" id="executive_native" value="{{executive_native}}"></div>'+
                                //'<div class="form-group"><label>Должность (в лице):</label><input class="form-control" type="text" id="executive" value="{{executive}}"></div>'+
                            '<div class="form-group"><label>ФИО:</label><input class="form-control" type="text" id="fio" value="{{fio}}"></div>'+
                            '<div class="form-group"><label>Фамилия И. О.:</label><input class="form-control" type="text" id="fio_short" value="{{fio_short}}"></div>'+
                                //'<div class="form-group"><label>Действующего/ей:<span id="grounds_end_replacer" class="prepare-replacer">Действующей</span></label><input class="form-control" type="text" id="grounds_end" value="{{grounds_end}}"></div>'+
                                //'<div class="form-group"><label>На основании:</label><input class="form-control" type="text" id="grounds" value="{{grounds}}"></div>'+
                            '<div class="form-group"><label>Кол-во платежей (для процентного):</label><input class="form-control" type="text" id="payments_count" value="{{payments_count}}"></div>'+
                            '<div class="form-group"><label>Дата и номер Договора эквайринга:</label><input class="form-control" type="text" id="number_and_date_acquiring_agreement" value="{{number_and_date_acquiring_agreement}}"></div>';

                            fio = merchant.executive_fio;
                            fio_arr = fio.split(' ');
                            var isExtName = fio_arr[2] == undefined;

                            fio_arr[2] = fio_arr[2] || 'Петрович';

                            io = fio_arr[1] + ' ' + fio_arr[2];



                            person = {
                                first: fio_arr[1],
                                middle: fio_arr[2],
                                last: fio_arr[0]
                            };


                            fio_dative = petrovich(person, 'genitive');

                            if(isExtName){
                                fio_dative.middle = '';
                                fio_arr[2] = '';
                                io = fio_arr[1];
                            }

                            fio_dative = fio_dative.last + ' ' + fio_dative.first + ' ' + fio_dative.middle;

                            fio_short = (isExtName)? fio_arr[0] + ' ' + fio_arr[1].substr(0,1) + '.' : fio_arr[0] + ' ' + fio_arr[1].substr(0,1) + '. ' + fio_arr[2].substr(0,1) + '.';

                            mo = {
                                agr_number: agr_numer_g,
                                agr_date: '',
                                executive: 'Генерального директора',
                                executive_native: merchant.executive,
                                fio: fio,
                                fio_short: fio_short,
                                grounds_end: 'действующего',
                                grounds: 'Устава',
                                payments_count: 60,
                                number_and_date_acquiring_agreement: merchant.number_and_date_acquiring_agreement
                            };

                            tpl = Mustache.to_html(tpl,mo);

                            bootbox.dialog({
                                title: 'Приложение №4',
                                message: tpl,
                                buttons: {
                                    success: {
                                        label: 'Сформировать',
                                        callback: function () {

                                            var o = {
                                                command: 'generateDocument',
                                                object: 'merchant_financing',
                                                params: {
                                                    id: parentForm.data.data[0].id,
                                                    document_sysname:   document_sysname,
                                                    agr_number:         $('#agr_number').val(),
                                                    //agr_date:           $('#agr_date').val(),
                                                    fio:                $('#fio').val(),
                                                    fio_short:          $('#fio_short').val(),
                                                    //executive:          $('#executive').val(),
                                                    executive_native:   $('#executive_native').val(),
                                                    //grounds_end:        $('#grounds_end').val(),
                                                    //grounds:            $('#grounds').val(),
                                                    payments_count:     $('#payments_count').val(),
                                                    number_and_date_acquiring_agreement: $('#number_and_date_acquiring_agreement').val()

                                                }
                                            };

                                            agr_numer_g = $('#agr_number').val();

                                            socketQuery(o, function (res) {

                                                console.log(res);

                                                if(!res.code){
                                                    var fileName = res.path + res.filename;
                                                    var linkName = 'my_download_link' + MB.Core.guid();

                                                    var nameRu = 'Дополнительное соглашение к Договору '+agr_numer_g || res.filename;

                                                    nameRu = nameRu.replaceAll('\'','');
                                                    nameRu = nameRu.replaceAll('"','');
                                                    nameRu = nameRu.replaceAll('`','');
                                                    nameRu = nameRu.replaceAll('.','-');

                                                    $("body").prepend('<a id="'+linkName+'" href="' + res.path + res.filename +'" download="'+ nameRu+'" style="display:none;"></a>');
                                                    var jqElem = $('#'+linkName);
                                                    jqElem[0].click();
                                                    jqElem.remove();
                                                }else{
                                                    return false;
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


                            $('#grounds_end_replacer').off('click').on('click', function () {

                                $('#grounds_end').val('действующей');

                            });

                            $('#agr_date').datepicker({
                                autoclose: true,
                                todayHighlight: true,
                                //minuteStep: 10,
                                keyboardNavigation: false,
                                todayBtn: true,
                                firstDay: 1,
                                format: 'dd.mm.yyyy',
                                weekStart: 1,
                                language: "ru"
                            });



                            break;
                        case 'PROXY':

                            tpl = '' +
                            '<div class="form-group"><label>Номер договора:</label><input class="form-control" type="text" id="agr_number" value="{{agr_number}}"></div>'+
                            '<div class="form-group"><label>Дата регистрации юр. лица (ДД.ММ.ГГГГ):</label><input class="form-control" type="text" id="gov_registration_date" value="{{gov_registration_date}}"></div>'+
                            '<div class="form-group"><label>Номер налоговой инспекции:</label><input class="form-control" type="text" id="fns_number" value="{{fns_number}}"></div>'+
                            '<div class="form-group"><label>ФНС по гор.:</label><input class="form-control" type="text" id="fns_city" value="{{fns_city}}"></div>'+
                            '<div class="form-group"><label>Должность (в лице):</label><input class="form-control" type="text" id="executive" value="{{executive}}"></div>'+
                            '<div class="form-group"><label>ФИО (в лице):</label><input class="form-control" type="text" id="fio" value="{{fio}}"></div>'+
                            '<div class="form-group"><label>Действующего/ей:<span id="grounds_end_replacer" class="prepare-replacer">Действующей</span></label><input class="form-control" type="text" id="grounds_end" value="{{grounds_end}}"></div>'+
                            '<div class="form-group"><label>На основании:</label><input class="form-control" type="text" id="grounds" value="{{grounds}}"></div>';

                            fio = merchant.executive_fio;
                            fio_arr = fio.split(' ');
                            var isExtName = fio_arr[2] == undefined;

                            fio_arr[2] = fio_arr[2] || 'Петрович';

                            io = fio_arr[1] + ' ' + fio_arr[2];

                            person = {
                                first: fio_arr[1],
                                middle: fio_arr[2],
                                last: fio_arr[0]
                            };


                            fio_dative = petrovich(person, 'genitive');

                            if(isExtName){
                                fio_dative.middle = '';
                                fio_arr[2] = '';
                                io = fio_arr[1];
                            }

                            fio_dative = fio_dative.last + ' ' + fio_dative.first + ' ' + fio_dative.middle;

                            fio_short = (isExtName)? fio_arr[0] + ' ' + fio_arr[1].substr(0,1) + '.' : fio_arr[0] + ' ' + fio_arr[1].substr(0,1) + '. ' + fio_arr[2].substr(0,1) + '.';

                            mo = {
                                agr_number: agr_numer_g,
                                gov_registration_date: merchant.registration_date,
                                fns_number: '',
                                fns_city: 'г. Москве',
                                executive: 'Генерального директора',
                                executive_native: merchant.executive,
                                fio: fio_dative,
                                fio_short: fio_short,
                                grounds_end: 'действующего',
                                grounds: 'Устава'
                            };

                            tpl = Mustache.to_html(tpl,mo);

                            bootbox.dialog({
                                title: 'Доверенность',
                                message: tpl,
                                buttons: {
                                    success: {
                                        label: 'Сформировать',
                                        callback: function () {

                                            var o = {
                                                command: 'generateDocument',
                                                object: 'merchant_financing',
                                                params: {
                                                    id: parentForm.data.data[0].id,
                                                    document_sysname:   document_sysname,
                                                    agr_number:         $('#agr_number').val(),
                                                    gov_registration_date:         $('#gov_registration_date').val(),
                                                    fns_number:           $('#fns_number').val(),
                                                    fns_city:           $('#fns_city').val(),
                                                    agr_date:           $('#agr_date').val(),
                                                    fio:                $('#fio').val(),
                                                    fio_short:          $('#fio_short').val(),
                                                    executive:          $('#executive').val(),
                                                    executive_native:   $('#executive_native').val(),
                                                    grounds_end:        $('#grounds_end').val(),
                                                    grounds:            $('#grounds').val()
                                                }
                                            };

                                            agr_numer_g = $('#agr_number').val();

                                            socketQuery(o, function (res) {

                                                console.log(res);

                                                if(!res.code){
                                                    var fileName = res.path + res.filename;
                                                    var linkName = 'my_download_link' + MB.Core.guid();

                                                    var nameRu = 'Доверенность '+agr_numer_g || res.filename;

                                                    nameRu = nameRu.replaceAll('\'','');
                                                    nameRu = nameRu.replaceAll('"','');
                                                    nameRu = nameRu.replaceAll('`','');
                                                    nameRu = nameRu.replaceAll('.','-');

                                                    $("body").prepend('<a id="'+linkName+'" href="' + res.path + res.filename +'" download="'+ nameRu+'" style="display:none;"></a>');
                                                    var jqElem = $('#'+linkName);
                                                    jqElem[0].click();
                                                    jqElem.remove();
                                                }else{
                                                    return false;
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


                            $('#grounds_end_replacer').off('click').on('click', function () {

                                $('#grounds_end').val('действующей');

                            });

                            $('#gov_registration_date').datepicker({
                                autoclose: true,
                                todayHighlight: true,
                                //minuteStep: 10,
                                keyboardNavigation: false,
                                todayBtn: true,
                                firstDay: 1,
                                format: 'dd.mm.yyyy',
                                weekStart: 1,
                                language: "ru"
                            });

                            break;

                        case 'SERVICE_NOTE':

                            var o = {
                                command: 'generateDocument',
                                object: 'merchant_financing',
                                params: {
                                    id: parentForm.data.data[0].id,
                                    document_sysname:   document_sysname
                                }
                            };

                            socketQuery(o, function (res) {

                                console.log(res);

                                if(!res.code){
                                    var fileName = res.path + res.filename;
                                    var linkName = 'my_download_link' + MB.Core.guid();

                                    var nameRu = 'Служебная записка '+merchant.short_name || res.filename;

                                    nameRu = nameRu.replaceAll('\'','');
                                    nameRu = nameRu.replaceAll('"','');
                                    nameRu = nameRu.replaceAll('`','');
                                    nameRu = nameRu.replaceAll('.','-');

                                    $("body").prepend('<a id="'+linkName+'" href="' + res.path + res.filename +'" download="'+ nameRu+'" style="display:none;"></a>');
                                    var jqElem = $('#'+linkName);
                                    jqElem[0].click();
                                    jqElem.remove();
                                }else{
                                    return false;
                                }

                            });

                            break;
                        default:

                            toastr['warn']('Новый тип документа, пишите: alextgco@gmail.com');

                            break;

                    }




                    //=====================================




                });



            }
        },
        {
            name: 'option1',
            title: 'Загрузить документ',
            disabled: function(){
                return parentForm.data.data[0].merchant_status_sysname == 'NEW';
            },
            callback: function(){
                // Загрузить файл,
                // отправить операцию загрузить документ
                var loader = MB.Core.fileLoader;
                loader.start({
                    params:{
                        not_public:true
                    },
                    success: function (uid) {
                        console.log('uid', uid);
                        var filename = uid.name;
                        var row = tableInstance.ct_instance.selectedRowIndex;
                        var id = tableInstance.data.data[row].id;

                        var o = {
                            command:'uploadDocument',
                            object:'Merchant_financing_document',
                            params:{
                                filename: filename,
                                id: id
                            }
                        };
                        socketQuery(o, function (res) {
                            tableInstance.reload();
                        });
                    }
                });
            }
        },
        {
            name: 'option2',
            title: 'Скачать',
            disabled: function(){
                var row = tableInstance.ct_instance.selectedRowIndex;
                var status = tableInstance.data.data[row].status_sysname;

                return status == 'CREATED' || status == 'REQUESTED';
            },
            callback: function(){
                var row = tableInstance.ct_instance.selectedRowIndex;
                var file_id = tableInstance.data.data[row].file_id;
                var document_name = tableInstance.data.data[row].document_name;
                var o = {
                    command:'download',
                    object:'File',
                    params:{
                        id:file_id
                    }
                };
                socketQuery(o, function (res) {
                    var fileName = res.path + res.filename;
                    var linkName = 'my_download_link' + MB.Core.guid();
                    $("body").prepend('<a id="'+linkName+'" href="' + res.path + '?filename='+ res.filename +'" download="'+ document_name + res.extension +'" style="display:none;"></a>');
                    var jqElem = $('#'+linkName);
                    jqElem[0].click();
                    jqElem.remove();
                    //$("#my_download_link").remove();
                });

                //bootbox.alert('Файл в системе, недоступен для внешнего мира, выгрузка в процессе разработки.');

                //tableInstance.openRowInModal();
            }
        },
        {
            name: 'option3',
            title: 'Отменить документ',
            disabled: function(){
                return !(tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex]['status_sysname'] == 'REQUESTED');
            },
            callback: function(){
                //tableInstance.openRowInModal();
            }
        }
    ];

}());





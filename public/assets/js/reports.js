(function(){
    MB = MB || {};
    MB.Core = MB.Core || {};

    var Report = function(params){
        this.name = params.name || undefined;
        this.data = undefined;
        this.modal = undefined;
    };

    Report.prototype.getData = function(callback){
        var _t = this;

        var o = {
            command: 'get',
            object: _t.name,
            params: {
                parameters: true
            }
        };

        socketQuery(o, function(res){
            _t.data = socketParse(res, false);
            if(typeof callback == 'function'){
                callback();
            }
        });
    };

    Report.prototype.render = function(callback){
        var _t = this;
        var modalId = MB.Core.guid();
        var html = '';
        if (!_t.data) return;

        console.log(_t.data, _t.data['report_parameters']);

        for(var i in _t.data['report_parameters']){
            var item = _t.data['report_parameters'][i];

            var default_value =     item['default_value'],
                default_value2 =    item['default_value2'],
                field_type =        item['field_type'],
                get_command =       item['get_command'],
                label1 =            item['label1'],
                label2 =            item['label2'],
                report_attr =      item['report_attr'],
                report_attr2 =      item['report_attr2'];

            html += '<div class="report-control-wrapper row" data-type="'+field_type+'" data-attr1="'+report_attr+'" data-attr2="'+report_attr2+'">' + _t.getTypeHtml(default_value, default_value2, field_type, get_command, label1, label2, report_attr, report_attr2) + '</div>';
        }

        html += '<div class="report-control-wrapper reportButtons row marTop40 marBot20"><div class="col-md-12"><div class="btn cancel toRight">Отмена</div><div class="btn exportToExcel marRight10 toRight">Экспорт в Excel</div><div class="btn confirm marRight10 toRight">Сформировать</div></div></div>';



        MB.Core.modalWindows.init({
            wrapper :          undefined,
            className :        'reportModal', //orderModal
            wrapId :           modalId,
            resizable :        false,
            title :            _t.data['report_name'],
            status :           '',
            content :          html,
            startPosition :    'shift',
            draggable :        true,
            active :           true,
            inMove :           false,
            height :           'auto',
            width :            500,
            minHeight :        300,
            minWidth :         500,
            activeHeaderElem : undefined,
            footerButton :     undefined,
            contentHeight :    0,
            hideSaveButton:    true,
            hideFullScreen:    true
        }).render(function(){
            _t.modal = MB.Core.modalWindows.windows.getWindow(modalId);

            _t.modal.wrapper.find('.report-select3-wrapper').each(function(index, elem){
//                var sVal = $(elem).data('val');
//                var sName = $(elem).data('title');
//                var select3Data = _t.getSelect3InsertData($(elem).attr('data-name'));
                var selectId = $(elem).attr('data-id');
                var selInstance = MB.Core.select3.init({
                    id: selectId,
                    wrapper: $(elem).find('.report-select3').eq(0),
                    getString: $(elem).attr('data-get'),
                    column_name: 'AAA',
                    view_name: 'AAA',
                    value: {
                        id: $(elem).attr('data-value'),
                        name: $(elem).attr('data-value2')
                    },
                    fromServerIdString: '',
                    fromServerNameString: '',
                    searchKeyword: '',
                    withEmptyValue: false,
                    absolutePosition: true,
                    isFilter: false,
                    isSearch: true,
                    parentObject: _t
                    //filterColumnName: $(elem).attr('data-name'),
                    //filterClientObject: _t.profile['OBJECT_PROFILE']['CLIENT_OBJECT']
                });

//                $(selInstance).on('changeVal', function(e, was, now){
//                    var filterType = selInstance.wrapper.parents('li.filterItem').eq(0).attr('data-filterType');
//                    var filterName = selInstance.wrapper.data('name');
//                    var filterValue = selInstance.wrapper.data('val');
//
//                    var wObj = {
//                        name: (filterValue == '')? filterName : filterValue,
//                        value: now.id,
//                        type: filterType
//                    };
//                    _t.addWhere(wObj);
//                });

            });

            _t.modal.wrapper.find('.report-daterange-wrapper').each(function(index, elem){
                var fromInp = $(elem).find('input[name="start"]');
                var toInp = $(elem).find('input[name="end"]');

                fromInp.datepicker({
                    format: "dd.mm.yyyy",
                    autoclose: true,
                    todayHighlight: true,
                    //startDate: new Date,
                    //minuteStep: 10,
                    //keyboardNavigation: true,
                    //todayBtn: true,
                    firstDay: 1,
                    weekStart: 1,
                    language: "ru"
                }).off('changeDate').on('changeDate', function(){

//                    var wValue = (fromInp.val() == '' && toInp.val() == '')? '': {from: fromInp.val(), to: toInp.val()} ;
//                    var wObj = {
//                        name: columnName,
//                        value: wValue,
//                        type: 'daterange'
//                    };
//                    _t.addWhere(wObj);
                });
                toInp.datepicker({
                    format: "dd.mm.yyyy",
                    autoclose: true,
                    todayHighlight: true,
                    //startDate: new Date,
                    minuteStep: 10,
                    //keyboardNavigation: true,
                    //todayBtn: true,
                    firstDay: 1,
                    weekStart: 1,
                    language: "ru"
                }).off('changeDate').on('changeDate', function(){

//                    var wValue = (fromInp.val() == '' && toInp.val() == '')? '': {from: fromInp.val(), to: toInp.val()} ;
//
//                    var wObj = {
//                        name: columnName,
//                        value: wValue,
//                        type: 'daterange'
//                    };
//                    _t.addWhere(wObj);
                });
            });

            _t.modal.wrapper.find('.report-date-wrapper').each(function(index, elem){
                $(elem).find('input').datepicker({
                    format: "dd.mm.yyyy",
                    autoclose: true,
                    todayHighlight: true,
                    //startDate: new Date,
                    //minuteStep: 10,
                    //keyboardNavigation: true,
                    //todayBtn: true,
                    firstDay: 1,
                    weekStart: 1,
                    language: "ru"
                }).off('changeDate').on('changeDate', function(){

//                    var wValue = (fromInp.val() == '' && toInp.val() == '')? '': {from: fromInp.val(), to: toInp.val()} ;
//                    var wObj = {
//                        name: columnName,
//                        value: wValue,
//                        type: 'daterange'
//                    };
//                    _t.addWhere(wObj);
                });
            });

            _t.modal.wrapper.find('.report-timerange-wrapper').each(function(index, elem){
                var fromInp = $(elem).find('input[name="start"]');
                var toInp = $(elem).find('input[name="end"]');

                fromInp.clockpicker({
                    align: 'left',
                    donetext: 'Выбрать',
                    autoclose: true,
                    afterDone: function(){
//                        fromInp.removeClass('invalid');
//                        var wValue = (fromInp.val() == '' && toInp.val() == '')? '': {from: fromInp.val(), to: toInp.val()} ;
//                        var wObj = {
//                            name: columnName,
//                            value: wValue,
//                            type: 'timerange'
//                        };
//                        _t.addWhere(wObj);
                    }
                });

                toInp.clockpicker({
                    align: 'left',
                    donetext: 'Выбрать',
                    autoclose: true,
                    afterDone: function(){
//                        toInp.removeClass('invalid');
//                        var wValue = (fromInp.val() == '' && toInp.val() == '')? '': {from: fromInp.val(), to: toInp.val()} ;
//                        var wObj = {
//                            name: columnName,
//                            value: wValue,
//                            type: 'timerange'
//                        };
//                        _t.addWhere(wObj);
                    }
                });
            });

            _t.modal.wrapper.find('.report-daysweek-wrapper').each(function(index, elem){
                var daysweekpickerInstance = $(elem).find('input.daysweekpicker').daysweekpicker();
                $(daysweekpickerInstance).on('changeDays', function(){
//                    var wObj = {
//                        name: $(elem).data('name'),
//                        value: this.value,
//                        type: 'daysweek'
//                    };
//                    _t.addWhere(wObj);
                });
            });

            if(typeof callback == 'function'){
                callback();
            }
        });

    };

    Report.prototype.parseControlValues = function(callback){
        var _t = this;

        _t.parameters = [];

        for(var i=0; i<_t.modal.wrapper.find('.report-control-wrapper').length; i++){
            var control = _t.modal.wrapper.find('.report-control-wrapper').eq(i);
            var type = control.attr('data-type');
            var attr1 = control.attr('data-attr1');
            var attr2 = control.attr('data-attr2');

            if(control.hasClass('reportButtons')){
                continue;
            }

            var tmpObj = {};

            switch(type){
                case 'text':
                    var textInp = control.find('.report-text-wrapper input[type="text"]').eq(0);
                    tmpObj[attr1] = textInp.val();
                    _t.parameters.push(tmpObj);
                    break;
                case 'number':
                    var numInp = control.find('.report-text-wrapper input[type="number"]').eq(0);
                    tmpObj[attr1] = numInp.val();
                    _t.parameters.push(tmpObj);
                    break;
                case 'checkbox':
                    var chk = control.find('.report-checkbox-wrapper input[type="checkbox"]').eq(0);
                    var val = (chk[0].checked)? 'TRUE': 'FALSE';
                    tmpObj[attr1] = val;
                    _t.parameters.push(tmpObj);
                    break;
                case 'select2':
                    var selectId = control.find('.report-select3-wrapper').attr('data-id');
                    var selectInstance = MB.Core.select3.list.getSelect(selectId);

                    tmpObj = {};
                    tmpObj[attr1] = selectInstance.value.id;
                    _t.parameters.push(tmpObj);
                    break;
                case 'daterange':
                    var fromInp = control.find('.report-daterange-wrapper input[name="start"]').eq(0);
                    var toInp = control.find('.report-daterange-wrapper input[name="end"]').eq(0);

                    tmpObj = {};

//                    if(fromInp.val() != '' && fromInp.val().length == 16){
//                        tmpObj[attr1] = fromInp.val()+':00';
//                    }else{
                    tmpObj[attr1] = fromInp.val();


//                    if(toInp.val() != '' && toInp.val().length == 16){
//                        tmpObj[attr2] = toInp.val()+':00';
//                    }else{
                    tmpObj[attr2] = toInp.val();


                    _t.parameters.push(tmpObj);
                    break;
                case 'date':
                    var dateInp = control.find('.report-date-wrapper input[type="text"]').eq(0);

                    tmpObj = {};
//                    if(dateInp.val() != '' && dateInp.val().length == 16){
//                        tmpObj[attr1] = dateInp.val()+':00';
//                    }else{
                    tmpObj[attr1] = dateInp.val();

                    _t.parameters.push(tmpObj);
                    break;
                case 'timerange':
                    var fromTimeInp = control.find('.report-timerange-wrapper input[name="start"]').eq(0);
                    var toTimeInp = control.find('.report-timerange-wrapper input[name="end"]').eq(0);

                    tmpObj = {};
                    if(fromTimeInp.val() != '' && fromTimeInp.val().length == 5){
                        tmpObj[attr1] = fromTimeInp.val()+':00';
                    }else{
                        tmpObj[attr1] = fromTimeInp.val();
                    }

                    if(toTimeInp.val() != '' && toTimeInp.val().length == 5){
                        tmpObj[attr2] = toTimeInp.val()+':00';
                    }else{
                        tmpObj[attr2] = toTimeInp.val();
                    }

                    _t.parameters.push(tmpObj);
                    break;
                case 'multiselect':
                    break;
                case 'daysweek':
                    var daysWeekId = control.find('.report-daysweek-wrapper').attr('data-id');
                    var daysweekInstance = MB.Core.daysweekpickers.getItem(daysWeekId);

                    tmpObj = {};
                    tmpObj[attr1] = daysweekInstance.value.join();
                    _t.parameters.push(tmpObj);
                    break;
                default:
                    break;
            }
        }

        if(typeof callback == 'function'){
            callback();
        }
    };

    Report.prototype.setHandlers = function(callback){
        var _t = this;
        var confirmBtn = _t.modal.wrapper.find('.confirm');
        var excelBtn = _t.modal.wrapper.find('.exportToExcel');
        var cancelBtn = _t.modal.wrapper.find('.cancel');


        confirmBtn.off('click').on('click', function(){
            _t.parseControlValues(function(){
                _t.confirm(function(){

                });
            });
        });

        excelBtn.off('click').on('click', function(){

            _t.parseControlValues(function(){
                _t.exportToExcel(function(){

                });
            });
        });

        cancelBtn.off('click').on('click', function(){
            _t.modal.wrapper.find('.mw-close').click();
        });

        if(typeof callback == 'function'){
            callback();
        }
    };

    Report.prototype.confirm = function(callback){
        var _t = this;
        var subcommand = '?sid='+MB.User.sid+'&object='+_t.name+'&' ;
        for(var i in _t.parameters){
            var param = _t.parameters[i];
            var andChar = (i > 0)?'&':'';
            var kIdx = 0;
            for(var k in param){
                if(i ==0 && kIdx>0){
                    andChar = '&';
                }
                subcommand += andChar + k +'='+param[k];
                kIdx++;
            }
        }

        console.log('OLOLOL', _t.parameters);

        var urlString = '<iframe class="iFrameForPrint" src="html/report/print_report.html' + subcommand + '" width="" height"" align"left"></iframe>';
        $("body").append(urlString);

        if(typeof callback == 'function'){
            callback();
        }
    };

    Report.prototype.exportToExcel = function(callback){
        var _t = this;
        var sObj = {};
        for(var i in _t.parameters){
            var par = _t.parameters[i];
            for(var k in par){
                sObj[k] = par[k];
            }
        }
        var obj = {
            o: {
                command: "get",
                object: _t.name,
                xls: true,
                report_mode:'EXCEL',
                sid:MB.User.sid,
                params: sObj
            }
        };
        var guid = MB.Core.guid();
        var timeOut = toastr.options.timeOut;
        var extendedTimeOut = toastr.options.extendedTimeOut;
        toastr.options.timeOut = 1000000;
        toastr.options.extendedTimeOut = 100;
        var info = toastr.info('Идет процесс экспорта...');
        toastr.options.timeOut = timeOut;
        toastr.options.extendedTimeOut = extendedTimeOut;
        obj.command = 'REPORT_TO_EXCEL';
        DOQuery(obj, function (r) {
            info.fadeOut(600);
            if (r.code!==0) {
                console.log(r.message);
                return toastr[r.type](r.message);
            }
            var filename = r.filename;
            var id = 'need_be_removed'+guid;
            $("body").prepend('<a style="display:none;" id="'+ id +'" href="'+ connectHost +'/' + filename +'" download></a>');
            var btn = $('#'+id);
            btn.on("click",function (e) {
                $(this).remove();
            });
            btn[0].click();
            toastr[r.type](r.message);
        });

        /*socketQuery({
            command: "get",
            object: _t.name,
            xls: true,
            params: sObj
        }, function(res) {
            res = JSON.parse(res);
            window.open("data:application/vnd.ms-excel," + "﻿" + encodeURIComponent(res['results'][0]["data"]), "_self");
            if(typeof callback == 'function'){
                callback();
            }
        });*/
    };

    Report.prototype.getTypeHtml = function(default_value, default_value2, field_type, get_command, label1, label2, report_attr, report_attr2){
        var _t = this;
        var res = '';
        switch(field_type){
            case 'text':
                res = '<div class="report-text-wrapper col-md-12" data-attr="'+report_attr+'"><label>'+label1+'</label><input data-attr="'+report_attr+'" type="text" class="" value="'+default_value+'" /></div>';
                break;
            case 'number':
                res = '<div class="report-text-wrapper col-md-12" data-attr="'+report_attr+'"><label>'+label1+'</label><input data-attr="'+report_attr+'" type="number" class="" value="'+default_value+'" /></div>';
                break;
            case 'checkbox':

                var chkStr = (default_value == 'TRUE')? 'checked="checked"': '';

                res = '<div class="report-checkbox-wrapper col-md-12" data-attr="'+report_attr+'"><label>'+label1+'</label><input data-attr="'+report_attr+'" type="checkbox" class="" value="" '+chkStr+' /></div>';
                break;
            case 'select2':
                res = '<div data-id="'+ MB.Core.guid()+'" data-attr="'+report_attr+'" class="col-md-12 report-select3-wrapper" data-value="'+default_value+'" data-value2="'+default_value2+'" data-get="'+get_command+'"><label>'+label1+'</label><div class="report-select3"></div></div>';
                break;
            case 'daterange':
                res =   '<div data-attr="'+report_attr+'" data-attr2="'+report_attr2+'" data-label1="'+label1+'" data-label2="'+label2+'" class="report-daterange-wrapper">'+
                        '<div class="col-md-6">' +
                            '<label>'+label1+'</label>'+
                            '<input type="text" class="" name="start" value="'+default_value+'" />'+
                        '</div>' +
                        '<div class="col-md-6">' +
                            '<label>'+label2+'</label>'+
                            '<input type="text" class="" name="end" value="'+default_value2+'"/>'+
                        '</div>' +
                        '</div>';
                break;
            case 'date':
                res = '<div class="report-date-wrapper col-md-12" data-attr="'+report_attr+'"><label>'+label1+'</label><input data-attr="'+report_attr+'" type="text" class="" value="'+default_value+'" /></div>';
                break;
            case 'timerange':
                res =   '<div data-attr="'+report_attr+'" data-attr2="'+report_attr2+'" data-label1="'+label1+'" data-label2="'+label2+'" class="report-timerange-wrapper">'+
                        '<div class="col-md-6">' +
                            '<label>'+label1+'</label>'+
                            '<input type="text" class="" name="start" value="'+default_value+'" />'+
                        '</div>' +
                        '<div class="col-md-6">' +
                            '<label>'+label2+'</label>'+
                            '<input type="text" class="" name="end" value="'+default_value2+'"/>'+
                        '</div>' +
                        '</div>';
                break;
            case 'multiselect':
                res = 'В разработке...';
                break;
            case 'daysweek':
                var daysweekId = MB.Core.guid();
                res = '<div data-id="'+daysweekId+'" class="report-daysweek-wrapper col-md-12" data-attr="'+report_attr+'"><label>'+label1+'</label><input data-id="'+daysweekId+'" data-attr="'+report_attr+'" type="text" class="daysweekpicker" value="'+default_value+'" /></div>';
                break;
            default:
                res = 'Что-то пошло не так';
                break;
        }
        return res;
    };

    Report.prototype.init = function(callback){
        var _t = this;
        _t.getData(function(){
            _t.render(function(){
                _t.setHandlers(function(){
                    if(typeof callback == 'function'){
                        callback();
                    }
                });
            });
        });
    };

    MB.Core.Report = Report;

}());

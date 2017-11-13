/**
 * Created by iig on 29.10.2015.
 */
var MyError = require('../error').MyError;
var UserError = require('../error').UserError;
var UserOk = require('../error').UserOk;
var BasicClass = require('./system/BasicClass');
var util = require('util');
var async = require('async');
var rollback = require('../modules/rollback');
var funcs = require('../libs/functions');
var moment = require('moment');
var generateCalendar = require('../modules/generate_calendar');
var fs = require('fs');
var Guid = require('guid');
var XlsxTemplate = require('xlsx-template');
var Docxtemplater = require('docxtemplater');


var Model = function(obj){
    this.name = obj.name;
    this.tableName = obj.name.toLowerCase();

    var basicclass = BasicClass.call(this, obj);
    if (basicclass instanceof MyError) return basicclass;
};
util.inherits(Model, BasicClass);
Model.prototype.getPrototype = Model.prototype.get;
Model.prototype.addPrototype = Model.prototype.add;
Model.prototype.modifyPrototype = Model.prototype.modify;
Model.prototype.removeCascadePrototype = Model.prototype.removeCascade;

Model.prototype.init = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var _t = this;
    Model.super_.prototype.init.apply(this, [obj , function (err) {
        cb(null);
    }]);
};

Model.prototype.get = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var client_object = _t.client_object || '';

    var coFunction = 'get_' + client_object;
    if (typeof _t[coFunction] === 'function') {
        _t[coFunction](obj, cb);
    } else {
        if (typeof _t['get_'] === 'function') {
            _t['get_'](obj, cb);
        } else {
            _t.getPrototype(obj, cb);
        }
    }
};

Model.prototype.add = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var client_object = _t.client_object || '';

    var coFunction = 'add_' + client_object;
    if (typeof _t[coFunction] === 'function') {
        _t[coFunction](obj, cb);
    } else {
        if (typeof _t['add_'] === 'function') {
            _t['add_'](obj, cb);
        } else {
            _t.addPrototype(obj, cb);
        }
    }
};

Model.prototype.add_ = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id;
    var rollback_key = obj.rollback_key || rollback.create();
    var tNum;

    var required_docs;
    var required_docs_ids = [];
    var merchant;

    var prevRequest;
    var prevTurnovers;

    async.series({
        getThrough: function (cb) {

            var o = {
                command: 'getNext',
                object: 'through_number'
            };

            _t.api(o, function (err, res) {

                if(err) return cb(new UserError('Не удалось получить следующий сквозной номер', {o:o, err:err}));

                tNum = res.through_number;

                cb(null);

            });

        },
        add: function (cb) {

            obj.through_number = tNum;
            obj.request_date = moment().format('DD.MM.YYYY');

            _t.addPrototype(obj, function (err, res) {

                if(err) return cb(err);
                id = res.id;

                cb(null, res);
            });

        },
        updateRequestByMerchant: function (cb) {

           if(!obj.merchant_id){
               cb(null);
           }else{

               async.series({

                   getData: function (cb) {

                       var o = {
                           command: 'get',
                           object: 'merchant',
                           params: {
                               param_where:{
                                   id: obj.merchant_id
                               },
                               collapseData: false
                           }
                       };

                       _t.api(o, function (err, res) {

                           if(err) return cb(new UserError('Не удалось получить торговца', {err:err, o:o}));

                           merchant = res[0];

                           cb(null);

                       });

                   },
                   updateRequest: function (cb) {

                       var fields = [
                           {m:'name',r:'merchant_name'},
                           {m:'short_name',r:'short_name'},
                           {m:'phone',r:'phone'},
                           {m:'email',r:'email'},
                           {m:'legal_address',r:'legal_address'},
                           {m:'real_address',r:'real_address'},
                           {m:'executive_fio',r:'executive_fio'},
                           {m:'executive',r:'executive'},
                           {m:'grounds_on',r:'grounds_on'},
                           {m:'business_type_id',r:'business_type_id'},
                           {m:'processing_bank_id',r:'processing_bank_id'},
                           {m:'rko_bank_id',r:'rko_bank_id'},
                           {m:'inn',r:'inn'},
                           {m:'kpp',r:'kpp'},
                           {m:'ogrn',r:'ogrn'},
                           {m:'regional_center',r:'regional_center'},
                           {m:'registration_date',r:'registration_date'},
                           {m:'rs',r:'rs'}
                       ];

                       var o = {
                           command: 'modify',
                           object: 'financing_request',
                           params: {
                               id: id
                           }
                       };

                       for(var i in fields){
                           var item = fields[i];
                           o.params[item.r] = merchant[item.m];
                       }

                       _t.api(o, function (err, res) {

                            if(err) return cb(new UserError('Не удалось обновить заявку из торговца idh', {err:err,o:o}));

                            cb(null);

                       });

                   }

               }, cb);


           }
        },
        getPreviousRequestTurnover: function(cb){

            console.log('HER');

            if(merchant && merchant.through_number.length > 0){

                async.series({

                    getPrevRequest: function(cb){

                        var o = {
                            command:'get',
                            object:'financing_request',
                            params:{
                                param_where: {
                                    through_number: merchant.through_number
                                },
                                collapseData:false
                            }
                        };

                        _t.api(o, function (err, res) {
                            if (err) return cb(new MyError('Не удалось получить более раннюю заявку по торговцу',{o : o, err : err}));


                            prevRequest = (res.length > 0)? res[0] : undefined;


                            cb(null);
                        });

                    },
                    getPrevTurnovers: function(cb){

                        if(prevRequest){

                            var o = {
                                command:'get',
                                object:'request_turnover',
                                params:{
                                    param_where: {
                                        financing_request_id: prevRequest.id
                                    },
                                    collapseData:false
                                }
                            };

                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось получить обороты по предыдущей заявке',{o : o, err : err}));

                                prevTurnovers = res;

                                cb(null);
                            });

                        }else{

                            cb(null);

                        }
                    }
                }, cb);

            }else{
                cb(null);
            }

        },
        insertDocs: function (cb) { // Создадим соответствующие записи в документах финансирования мерчанта

            async.series({
                getDocsIds: function (cb) {

                    var docs_arr = ['BKI_PERSON', 'BKI_LEGAL', 'EXTRACT'];

                    var o = {
                        command: 'get',
                        object: 'document',
                        params: {
                            where: [
                                {
                                    key: 'sysname',
                                    type: 'in',
                                    val1: docs_arr
                                }
                            ],
                            collapseData: false
                        }
                    };

                    _t.api(o, function (err, res) {

                        if (err) return cb(new MyError('Не удалось получиьть документы.', {err: err, o: o}));

                        required_docs = res;

                        for(var i in required_docs){
                            required_docs_ids.push(required_docs[i].id);
                        }

                        cb(null);

                    });
                },
                insertDocs: function (cb) {

                    console.log('required_docs_ids', required_docs_ids);

                    async.eachSeries(required_docs_ids, function (item, cb) {

                        var o = {
                            command: 'add',
                            object: 'request_document',
                            params: {
                                financing_request_id: id,
                                document_id: item
                            }
                        };

                        o.params.rollback_key = rollback_key;

                        _t.api(o, function (err) {

                            if (err) return cb(new MyError('Не удалось добавить документы для данного финансирования.', {
                                err: err,
                                financing_request_id: id,
                                document_id: item
                            }));

                            cb(null);

                        });

                    }, cb);

                }

            }, function (err, res) {
                if (err) {
                    rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err, res) {
                        console.log('Результат выполнения rollback', err, res);
                    });
                    return cb(err);
                }
                cb(null);
            });

        },
        createTurnoverTable: function (cb) {


            var yearAgo = moment().add(-12, 'months');
            var m11 =   moment().add(-11, 'months');
            var m10 =   moment().add(-10, 'months');
            var m9 =    moment().add(-9, 'months');
            var m8 =    moment().add(-8, 'months');
            var m7 =    moment().add(-7, 'months');
            var m6 =    moment().add(-6, 'months');
            var m5 =    moment().add(-5, 'months');
            var m4 =    moment().add(-4, 'months');
            var m3 =    moment().add(-3, 'months');
            var m2 =    moment().add(-2, 'months');
            var m1 =    moment().add(-1, 'months');


            var nw = {
                2016: [
                    [1,2,3,4,5,6,7,8,9,10,16,17,23,24,30,31],
                    [6,7,13,14,21,22,23,27,28],
                    [5,6,7,8,12,13,19,20,26,27],
                    [2,3,9,10,16,17,23,24,30],
                    [1,2,3,7,8,9,14,15,21,22,28,29],
                    [4,5,11,12,13,18,19,25,26],
                    [2,3,9,10,16,17,23,24,30,31],
                    [6,7,13,14,20,21,27,28],
                    [3,4,10,11,17,18,24,25],
                    [1,2,8,9,15,16,22,23,29,30],
                    [4,5,6,12,13,19,20,26,27],
                    [3,4,10,11,17,18,24,25,31]
                ],
                2017: [
                    [1,2,3,4,5,6,7,8,14,15,21,22,28,29],
                    [4,5,11,12,18,19,23,24,25,26],
                    [4,5,8,11,12,18,19,25,26],
                    [1,2,8,9,15,16,22,23,29,30],
                    [1,6,7,8,9,13,14,20,21,27,28],
                    [3,4,10,11,12,17,18,24,25],
                    [1,2,8,9,15,16,22,23,29,30],
                    [5,6,12,13,19,20,26,27],
                    [2,3,9,10,16,17,23,24,30],
                    [1,7,8,14,15,21,22,28,29],
                    [4,5,6,11,12,18,19,25,26],
                    [2,3,9,10,16,17,23,24,30,31]
                ],
                2018: [
                    [1,2,3,4,5,6,7,8,9,10,13,14,20,21,27,28],
                    [3,4,10,11,17,18,23,24,25],
                    [3,4,8,10,11,17,18,24,25,31],
                    [1,7,8,14,15,21,22,28,29],
                    [1,5,6,9,12,13,19,20,26,27],
                    [2,3,9,10,12,16,17,23,24,30],
                    [1,7,8,14,15,21,22,28,29],
                    [4,5,11,12,18,19,25,26],
                    [1,2,8,9,15,16,22,23,29,30],
                    [6,7,13,14,20,21,27,28],
                    [3,4,5,10,11,17,18,24,25],
                    [1,2,8,9,15,16,22,23,29,30]
                ],
                2019: [
                    [1,2,3,4,5,6,7,8,9,10,12,13,19,20,26,27],
                    [2,3,9,10,16,17,23,24,25],
                    [2,3,8,9,10,16,17,23,24,30,31],
                    [6,7,13,14,20,21,27,28],
                    [4,5,9,11,12,18,19,25,26],
                    [1,2,8,9,12,15,16,22,23,29,30],
                    [6,7,13,14,20,21,27,28],
                    [3,4,10,11,17,18,24,25,31],
                    [1,7,8,14,15,21,22,28,29],
                    [5,6,12,13,19,20,26,27],
                    [2,3,9,10,16,17,23,24,30],
                    [1,7,8,14,15,21,22,28,29]
                ]
            };

            function checkDate(date){

                var dayOMth = date.date();
                var year = date.year();
                var mth = date.month() + 0;

                var result = undefined;

                if(nw[year][mth]){
                    if(nw[year][mth].indexOf(dayOMth) > -1){
                        result = false;
                    }else{
                        result = true;
                    }
                }
                return result;
            }

            function getWorkDaysCount(mthone, mth, year){

                var total = 0;
                var incDate = moment(mth +'.01.'+year);

                function nextDay(inc){

                    var im = inc.month()+1;

                    if(im == +mthone){

                        if(checkDate(inc)){
                            total++;
                        }

                        nextDay(inc.add(1,'days'));
                    }


                }

                nextDay(incDate);

                return total;

            }

            function getFullDaysCount(mthone, mth, year){

                var total = 0;
                var incDate = moment(mth +'.01.'+year);

                function nextDay(inc){

                    var im = inc.month()+1;

                    if(im == +mthone){
                        total++;
                        nextDay(inc.add(1,'days'));
                    }

                }

                nextDay(incDate);

                return total;

            }

            var monthsArr = [
                {
                    month: yearAgo.locale('ru').format('MMMM'),
                    year: yearAgo.format('YYYY'),
                    work_days_count: getWorkDaysCount(yearAgo.format('M'), yearAgo.format('MM'), yearAgo.format('YYYY')),
                    full_days_count: getFullDaysCount(yearAgo.format('M'), yearAgo.format('MM'), yearAgo.format('YYYY'))
                },
                {
                    month: m11.locale('ru').format('MMMM'),
                    year: m11.format('YYYY'),
                    work_days_count: getWorkDaysCount(m11.format('M'), m11.format('MM'), m11.format('YYYY')),
                    full_days_count: getFullDaysCount(m11.format('M'), m11.format('MM'), m11.format('YYYY'))
                },
                {
                    month: m10.locale('ru').format('MMMM'),
                    year: m10.format('YYYY'),
                    work_days_count: getWorkDaysCount(m10.format('M'), m10.format('MM'), m10.format('YYYY')),
                    full_days_count: getFullDaysCount(m10.format('M'), m10.format('MM'), m10.format('YYYY'))
                },
                {
                    month: m9.locale('ru').format('MMMM'),
                    year: m9.format('YYYY'),
                    work_days_count: getWorkDaysCount(m9.format('M'), m9.format('MM'), m9.format('YYYY')),
                    full_days_count: getFullDaysCount(m9.format('M'), m9.format('MM'), m9.format('YYYY'))
                },
                {
                    month: m8.locale('ru').format('MMMM'),
                    year: m8.format('YYYY'),
                    work_days_count: getWorkDaysCount(m8.format('M'), m8.format('MM'), m8.format('YYYY')),
                    full_days_count: getFullDaysCount(m8.format('M'), m8.format('MM'), m8.format('YYYY'))
                },
                {
                    month: m7.locale('ru').format('MMMM'),
                    year: m7.format('YYYY'),
                    work_days_count: getWorkDaysCount(m7.format('M'), m7.format('MM'), m7.format('YYYY')),
                    full_days_count: getFullDaysCount(m7.format('M'), m7.format('MM'), m7.format('YYYY'))
                },
                {
                    month: m6.locale('ru').format('MMMM'),
                    year: m6.format('YYYY'),
                    work_days_count: getWorkDaysCount(m6.format('M'), m6.format('MM'), m6.format('YYYY')),
                    full_days_count: getFullDaysCount(m6.format('M'), m6.format('MM'), m6.format('YYYY'))
                },
                {
                    month: m5.locale('ru').format('MMMM'),
                    year: m5.format('YYYY'),
                    work_days_count: getWorkDaysCount(m5.format('M'), m5.format('MM'), m5.format('YYYY')),
                    full_days_count: getFullDaysCount(m5.format('M'), m5.format('MM'), m5.format('YYYY'))
                },
                {
                    month: m4.locale('ru').format('MMMM'),
                    year: m4.format('YYYY'),
                    work_days_count: getWorkDaysCount(m4.format('M'), m4.format('MM'), m4.format('YYYY')),
                    full_days_count: getFullDaysCount(m4.format('M'), m4.format('MM'), m4.format('YYYY'))
                },
                {
                    month: m3.locale('ru').format('MMMM'),
                    year: m3.format('YYYY'),
                    work_days_count: getWorkDaysCount(m3.format('M'), m3.format('MM'), m3.format('YYYY')),
                    full_days_count: getFullDaysCount(m3.format('M'), m3.format('MM'), m3.format('YYYY'))
                },
                {
                    month: m2.locale('ru').format('MMMM'),
                    year: m2.format('YYYY'),
                    work_days_count: getWorkDaysCount(m2.format('M'), m2.format('MM'), m2.format('YYYY')),
                    full_days_count: getFullDaysCount(m2.format('M'), m2.format('MM'), m2.format('YYYY'))
                },
                {
                    month: m1.locale('ru').format('MMMM'),
                    year: m1.format('YYYY'),
                    work_days_count: getWorkDaysCount(m1.format('M'), m1.format('MM'), m1.format('YYYY')),
                    full_days_count: getFullDaysCount(m1.format('M'), m1.format('MM'), m1.format('YYYY'))
                }
            ];

            async.eachSeries(monthsArr, function(item, cb){

                var o = {
                    command: 'add',
                    object: 'request_turnover',
                    params: {
                        financing_request_id: id,
                        month: item.month,
                        year: item.year,
                        work_days_count: item.work_days_count,
                        full_days_count: item.full_days_count
                    }
                };

                if(prevRequest && prevTurnovers){

                    for(var i in prevTurnovers){
                        var pt = prevTurnovers[i];

                        if(item.month == pt.month && item.year == pt.year){
                            o.params.turnover = pt.turnover;
                        }

                    }

                }

                _t.api(o, function(err,res){

                    if(err) return new MyError('Не удалось добавить запись в таблицу оборота торговца', err);

                    cb(null);

                });


            }, cb);

        }
    },function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            //if (!obj.doNotSaveRollback){
            //    rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'METHOD_NAME', params:obj});
            //}
            cb(null, new UserOk('Ок', res.add));
        }
    });
};

Model.prototype.modify = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var client_object = _t.client_object || '';

    var coFunction = 'modify_' + client_object;

    if (typeof _t[coFunction] === 'function') {
        _t[coFunction](obj, cb);
    } else {
        if (typeof _t['modify_'] === 'function') {
            _t['modify_'](obj, cb);
        } else {
            _t.modifyPrototype(obj, cb);
        }
    }
};

Model.prototype.modify_ = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();

    var turnovers;
    var fin_request;


    if(obj.inn && obj.inn.toString().length < 10) return cb(new UserError('Поле ИНН должно состоять из 10 или 12 символов'));
    if(obj.kpp && obj.kpp.toString().length != 9) return cb(new UserError('Поле КПП должно состоять из 9 символов'));
    if(obj.rs && obj.rs.toString().length != 20) return cb(new UserError('Поле Р/С должно состоять из 20 символов'));

    async.series({
        modify: function(cb){

            _t.modifyPrototype(obj, function (err, res) {

                if(err) return cb(null);

                cb(null, res);
            });

        },
        get: function(cb){
            _t.getById({id:id}, function (err, res) {

                if(err) return cb(new MyError('Не удалось получить запись оборота', {id: id, err: err}));

                fin_request = res[0];

                return cb(null);

            });
        },
        getTurnovers: function(cb){

            var o = {
                command: 'get',
                object: 'request_turnover',
                params: {
                    param_where: {
                        financing_request_id: id
                    },
                    collapseData: false
                }
            };

            _t.api(o, function(err,res){

                if(err) return cb(new MyError('Не удалось получить записи оборота', {o: o, err: err}));

                turnovers = res;

                cb(null);

            });

        },
        updateAllRows: function(cb){

            async.eachSeries(turnovers, function(item, cb){

                if(+item.turnover == 0){

                    return cb(null);

                }

                var params = {
                    id: item.id
                };

                var dly = Math.round(+item.turnover / +item.work_days_count);

                if(fin_request.request_financing_type_sysname == 'FIXED'){

                    if(fin_request.payment_amount != ''){
                        params.fixed_amount = fin_request.payment_amount;
                    }

                    if(fin_request.payment_amount != ''){
                        params.percent_by_fixed_amount = +fin_request.payment_amount / dly * 100;
                    }

                    if(fin_request.payment_amount != ''){
                        params.balance = dly  - fin_request.payment_amount;
                    }

                    params.daily_percent = '';

                }else if(fin_request.request_financing_type_sysname == 'PERCENT'){

                    if(fin_request.avl_proc_dly_withdraw_rate != ''){
                        params.daily_percent = (dly / 100 * +fin_request.avl_proc_dly_withdraw_rate).toFixed(0);
                    }

                    if(fin_request.avl_proc_dly_withdraw_rate != ''){
                        params.balance = dly  - (dly / 100 * +fin_request.avl_proc_dly_withdraw_rate).toFixed(0);
                    }

                    params.fixed_amount = '';
                    params.percent_by_fixed_amount = '';

                }else{

                    return cb(null);

                }

                var o = {
                    command: 'modifyPrototype',
                    object: 'request_turnover',
                    params: params
                };

                _t.api(o, function (err,res) {

                    if(err){

                        if(err.message == 'notModified'){

                        }else{

                            return cb(new MyError('Не удалось обновить запись оборота gux', {params: params, err: err}));

                        }

                    }

                    cb(null);

                });

            }, cb);



        }

    },function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            //if (!obj.doNotSaveRollback){
            //    rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'METHOD_NAME', params:obj});
            //}
            cb(null, res.modify);
        }
    });
};

Model.prototype.removeCascade = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var client_object = _t.client_object || '';

    var coFunction = 'removeCascade_' + client_object;

    if (typeof _t[coFunction] === 'function') {
        _t[coFunction](obj, cb);
    } else {
        if (typeof _t['removeCascade_'] === 'function') {
            _t['removeCascade_'](obj, cb);
        } else {
            _t.removeCascadePrototype(obj, cb);
        }
    }
};

Model.prototype.calculate = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();

    async.series({

        modify: function (cb) {

            _t.modifyPrototype(obj, function (err, res) {

                if(err) return cb(err);
                id = res.id;

                cb(null, res);
            });

        },
        calculate: function (cb) {

            async.series({


            }, function (cb) {



            });
        }
    },function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            //if (!obj.doNotSaveRollback){
            //    rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'METHOD_NAME', params:obj});
            //}
            cb(null, new UserOk('Ок'));
        }
    });
};

Model.prototype.recalculate = function(obj, cb){

    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    var financing_request;
    if (!id || isNaN(+id)) return cb(new MyError('В recalFinancing не передан id'));

    var turnovers;

    async.series({
        load: function (cb) {
            // Загрузить значение из базы
            var params = {
                where: [
                    {
                        key: 'id',
                        val1: id
                    }
                ],
                collapseData: false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Нет такой записи в financing_request', {params: params}));
                financing_request = res[0];
                return cb(null);
            });
        },
        checkRequiredFields: function (cb) {
            // Проверим, хватает ли полей для пересчета

            if(!+financing_request.factoring_rate>0)                           return cb(new UserError('Не указана ставка факторинга.'));

            if(!+financing_request.founding_amount>0)                          return cb(new UserError('Укажите сумму финансирования.'));

            //if(!+financing_request.payments_count>0)                            return cb(new UserError('Не указано количество платежей.'));
            if(financing_request.request_financing_type_sysname == 'PERCENT') {
                if (!+financing_request.avl_proc_dly_withdraw_rate > 0)               return cb(new UserError('Не указан макс. % списания в день.'));
            }

            //if(!+financing_request.total_mouthly_turnover>0)                   return cb(new UserError('Не указан общий месячный оборот.'));

            //if(!+financing_request.visa_mc_percent>0)                          return cb(new UserError('Не указан процент visa / mc.'));

            if(obj.recalc_type == 'by_founding_amount' && !+financing_request.founding_amount>0)           return cb(new UserError('Не указана сумма финансирования'));

            if(obj.recalc_type == 'by_payment_amount' && !+financing_request.payment_amount>0)             return cb(new UserError('Не указана сумма платежа'));

            if(obj.recalc_type == 'by_payments_count' && !+financing_request.payments_count>0)             return cb(new UserError('Не указано количество платежей'));


            return cb(null);
        },
        getTurnovers: function (cb) {

            var o = {
                command: 'get',
                object: 'request_turnover',
                params: {
                    param_where: {
                        financing_request_id: financing_request.id
                    },
                    collapseData: false
                }
            };

            _t.api(o, function (err, res) {
                if(err) return cb(new UserError('Не удалось получить обороты торговца', {o:o, err:err}));

                turnovers = res;

                cb(null);
            });

        },
        recalc: function (cb) {

            //var toModify = [];

            var fa;
            var atr;
            var pa;
            var pc;
            var tmt;
            var avl_proc_dly_withdraw_rate_calculated;

            var avr_payment_days_count = 20;
            var avr_daily_turnover = +financing_request.founding_amount / avr_payment_days_count;
            var avr_pa;
            var avr_pc;

            var params = {};



            switch(obj.recalc_type){
                case 'percent':

                    if(financing_request.request_financing_type_sysname == 'PERCENT'){


                        var totalByDly = 0;
                        var totalMths = 0;

                        for(var i in turnovers){
                            var t = turnovers[i];

                            if(!+t.turnover){
                                continue;
                            }

                            var dly = +t.amount_per_day || Math.round(+t.turnover / +t.work_days_count);
                            var dlyPercent = +t.daily_percent || (dly / 100 * +financing_request.avl_proc_dly_withdraw_rate).toFixed(0);

                            totalByDly += dlyPercent;
                            totalMths++;

                        }



                        fa = +financing_request.founding_amount || parseFloat(financing_request.founding_amount);
                        atr = parseFloat(fa) + (parseFloat(fa) / 100 * parseInt(financing_request.factoring_rate));

                        avr_pa = Math.ceil(totalByDly / totalMths);
                        //avr_pa = avr_daily_turnover / 100 * +financing_request.avl_proc_dly_withdraw_rate;
                        avr_pc = atr / avr_pa;

                        pa = avr_pa;
                        pc = avr_pc;

                        avl_proc_dly_withdraw_rate_calculated = pa * parseInt(financing_request.payments_count) * 100/ +fa;

                    }else{

                        return cb(new UserError('Тип списания должен быть процентным'));

                    }

                    break;
                case 'classic':

                    fa = +financing_request.founding_amount || parseFloat(financing_request.founding_amount);
                    atr = parseFloat(fa) + parseFloat((fa / 100 * financing_request.factoring_rate));


                    if(financing_request.request_financing_type_sysname == 'PERCENT'){

                        avr_pa = avr_daily_turnover / 100 * +financing_request.avl_proc_dly_withdraw_rate;
                        avr_pc = atr / avr_pa;

                        avl_proc_dly_withdraw_rate_calculated = financing_request.avl_proc_dly_withdraw_rate;
                        pa = parseInt(avl_proc_dly_withdraw_rate_calculated * fa / (parseInt(financing_request.payments_count) * 100));
                        pc = atr/pa;

                    }else if(financing_request.request_financing_type_sysname == 'FIXED'){

                        pc = 90;
                        pa = atr/pc;
                        avl_proc_dly_withdraw_rate_calculated = pa * parseInt(financing_request.payments_count) * 100/ fa;

                    }else{

                        pc = 90;
                        pa = atr/pc;
                        avl_proc_dly_withdraw_rate_calculated = pa * parseInt(financing_request.payments_count) * 100/ fa;

                    }


                    break;
                case 'by_founding_amount':

                    if(financing_request.request_financing_type_sysname == 'PERCENT'){

                        fa = +financing_request.founding_amount || parseFloat(financing_request.founding_amount);
                        atr = parseFloat(fa) + (parseFloat(fa) / 100 * parseInt(financing_request.factoring_rate));

                        avr_pa = avr_daily_turnover / 100 * +financing_request.avl_proc_dly_withdraw_rate;
                        avr_pc = atr / avr_pa;

                        pa = ( parseFloat(fa) / parseInt(financing_request.payments_count) ) / 100 * parseInt(financing_request.avl_proc_dly_withdraw_rate);
                        pc = Math.ceil(atr / pa);
                        avl_proc_dly_withdraw_rate_calculated = pa * parseInt(financing_request.payments_count) * 100/ +fa;

                    }else if(financing_request.request_financing_type_sysname == 'FIXED'){

                        fa = +financing_request.founding_amount || parseFloat(financing_request.founding_amount);
                        atr = parseFloat(fa) + (parseFloat(fa) / 100 * parseInt(financing_request.factoring_rate));

                        if(!+financing_request.payments_count>0) return cb(new UserError('Не указано количество платежей.'));

                        pa = Math.ceil(atr / parseInt(financing_request.payments_count));

                        //( parseFloat(fa) / parseInt(financing_request.payments_count) ) / 100 * parseInt(financing_request.avl_proc_dly_withdraw_rate);
                        //pc = Math.ceil(atr / pa);
                        pc = parseInt(financing_request.payments_count)

                        avl_proc_dly_withdraw_rate_calculated = pa * parseInt(financing_request.payments_count) * 100/ +fa;

                    }else{

                        fa = +financing_request.founding_amount || parseFloat(financing_request.founding_amount);
                        atr = parseFloat(fa) + (parseFloat(fa) / 100 * parseInt(financing_request.factoring_rate));
                        pa = ( parseFloat(fa) / parseInt(financing_request.payments_count) ) / 100 * parseInt(financing_request.avl_proc_dly_withdraw_rate);
                        pc = Math.ceil(atr / pa);
                        avl_proc_dly_withdraw_rate_calculated = pa * parseInt(financing_request.payments_count) * 100/ +fa;

                    }



                    break;
                case 'by_payment_amount':

                    if(financing_request.request_financing_type_sysname == 'PERCENT'){

                        fa = +financing_request.founding_amount || parseFloat(financing_request.founding_amount);
                        atr = parseFloat(fa) + (parseFloat(fa) / 100 * parseInt(financing_request.factoring_rate));

                        avr_pa = avr_daily_turnover / 100 * +financing_request.avl_proc_dly_withdraw_rate;
                        avr_pc = atr / avr_pa;

                        pa = parseFloat(financing_request.payment_amount);
                        pc = Math.ceil(atr / pa);
                        avl_proc_dly_withdraw_rate_calculated = pa * parseInt(financing_request.payments_count) * 100/ fa;

                    }else if(financing_request.request_financing_type_sysname == 'FIXED'){

                        fa = +financing_request.founding_amount || parseFloat(financing_request.founding_amount);
                        atr = parseFloat(fa) + (parseFloat(fa) / 100 * parseInt(financing_request.factoring_rate));

                        pa = parseFloat(financing_request.payment_amount);

                        pc = Math.ceil(atr / pa);
                        avl_proc_dly_withdraw_rate_calculated = pa * parseInt(financing_request.payments_count) * 100/ fa;

                    }else{

                        fa = +financing_request.founding_amount || parseFloat(financing_request.founding_amount);
                        atr = parseFloat(fa) + (parseFloat(fa) / 100 * parseInt(financing_request.factoring_rate));
                        pa = parseFloat(financing_request.payment_amount);
                        pc = Math.ceil(atr / pa);
                        avl_proc_dly_withdraw_rate_calculated = pa * parseInt(financing_request.payments_count) * 100/ fa;

                    }



                    break;
                case 'by_payments_count':

                    if(financing_request.request_financing_type_sysname == 'PERCENT'){


                        fa = +financing_request.founding_amount || parseFloat(financing_request.founding_amount);
                        atr = parseFloat(fa) + (parseFloat(fa) / 100 * parseInt(financing_request.factoring_rate));

                        avr_pa = avr_daily_turnover / 100 * +financing_request.avl_proc_dly_withdraw_rate;
                        avr_pc = atr / avr_pa;


                        pc = parseInt(financing_request.payments_count);
                        pa = atr/pc;
                        // Рассчитанный процент
                        avl_proc_dly_withdraw_rate_calculated = pa * parseInt(financing_request.payments_count) * 100/ fa;

                    }else if(financing_request.request_financing_type_sysname == 'FIXED'){

                        fa = +financing_request.founding_amount || parseFloat(financing_request.founding_amount);
                        atr = parseFloat(fa) + (parseFloat(fa) / 100 * parseInt(financing_request.factoring_rate));

                        pc = parseInt(financing_request.payments_count);

                        pa = atr/pc;

                        // Рассчитанный процент
                        avl_proc_dly_withdraw_rate_calculated = pa * parseInt(financing_request.payments_count) * 100/ fa;

                    }else{

                        fa = +financing_request.founding_amount || parseFloat(financing_request.founding_amount);
                        atr = parseFloat(fa) + (parseFloat(fa) / 100 * parseInt(financing_request.factoring_rate));
                        pc = parseInt(financing_request.payments_count);
                        pa = atr/pc;
                        // Рассчитанный процент
                        avl_proc_dly_withdraw_rate_calculated = pa * parseInt(financing_request.payments_count) * 100/ fa;

                    }



                    break;
                default :

                    if(financing_request.request_financing_type_sysname == 'PERCENT'){

                        fa = +financing_request.founding_amount || parseFloat(financing_request.founding_amount);
                        atr = parseFloat(fa) + parseFloat((fa / 100 * financing_request.factoring_rate));

                        avr_pa = avr_daily_turnover / 100 * +financing_request.avl_proc_dly_withdraw_rate;
                        avr_pc = atr / avr_pa;

                        pa = ( parseFloat(fa) / parseInt(financing_request.payments_count) ) / 100 * parseInt(financing_request.avl_proc_dly_withdraw_rate);
                        pc = Math.ceil(atr / pa);
                        avl_proc_dly_withdraw_rate_calculated = pa * parseInt(financing_request.payments_count) * 100/ fa;

                    }else if(financing_request.request_financing_type_sysname == 'FIXED'){

                        fa = +financing_request.founding_amount || parseFloat(financing_request.founding_amount);
                        atr = parseFloat(fa) + parseFloat((fa / 100 * financing_request.factoring_rate));
                        pa = ( parseFloat(fa) / parseInt(financing_request.payments_count) ) / 100 * parseInt(financing_request.avl_proc_dly_withdraw_rate);
                        pc = Math.ceil(atr / pa);
                        avl_proc_dly_withdraw_rate_calculated = pa * parseInt(financing_request.payments_count) * 100/ fa;

                    }else{

                        fa = +financing_request.founding_amount || parseFloat(financing_request.founding_amount);
                        atr = parseFloat(fa) + parseFloat((fa / 100 * financing_request.factoring_rate));
                        pa = ( parseFloat(fa) / parseInt(financing_request.payments_count) ) / 100 * parseInt(financing_request.avl_proc_dly_withdraw_rate);
                        pc = Math.ceil(atr / pa);
                        avl_proc_dly_withdraw_rate_calculated = pa * parseInt(financing_request.payments_count) * 100/ fa;

                    }



                    break;

            }

            params.founding_amount =        Math.ceil(fa);
            params.amount_to_return =       Math.ceil(atr);
            params.payment_amount =         Math.ceil(pa);
            params.payments_count =         parseInt(pc);

            if (avl_proc_dly_withdraw_rate_calculated) params.avl_proc_dly_withdraw_rate_calculated = Math.round(parseFloat(avl_proc_dly_withdraw_rate_calculated)*100)/100;

            var calendar;

            //if(!financing_request.financing_date) return cb(new UserError('Не указана дата финансирования.'));
            if(!financing_request.payments_start_date) return cb(new UserError('Не указана дата начала платежей.'));

            if(financing_request.request_financing_type_sysname == 'PERCENT'){

                if(avr_pc){

                    generateCalendar({
                        date_start: financing_request.payments_start_date,
                        payments_count: avr_pc,
                        type: 'gov'
                    }, function (err, res) {
                        calendar = res;
                        //cb(null);
                    });

                    params.financing_close_date = calendar[calendar.length -1];

                }else{

                }

            }else if(financing_request.request_financing_type_sysname == 'FIXED'){

                generateCalendar({
                    date_start: financing_request.payments_start_date.substr(0,10),
                    payments_count: financing_request.payments_count,
                    type: 'gov'
                }, function (err, res) {
                    calendar = res;
                    //cb(null);
                });

                params.financing_close_date = calendar[calendar.length -1];


            }else{

            }



            params.id = id;


            async.series([
                function (cb) {
                    console.log('MODIFY FINANCING_REQUEST',params);
                    _t.modify(params, cb);
                }
            ], cb);
        }
    }, function (err, res) {
        if (err) {
            if (err instanceof UserError) return cb(err);
            return cb(err);
        }
        cb(null, new UserOk('Пересчет успешно произведен'));
    });
};

Model.prototype.request_report = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var name = obj.name || 'request_report_fixed.xlsx';
    var report_date = obj.report_date || funcs.getDate();

    var financing_request;
    var turnovers;
    var readyData;

    async.series({
        getData: function (cb) {
            async.series({
                getRequest: function (cb) {
                    // Получим заявку
                    var o = {
                        command: 'get',
                        object: 'financing_request',
                        params: {
                            param_where: {
                                id: obj.id
                            },
                            collapseData: false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(err);
                        if (!res.length) return cb(new UserError('Заявка не найдана'));

                        financing_request = res[0];

                        cb(null);
                    });
                },
                getTurnovers: function (cb) {
                    // Получим обороты
                    var o = {
                        command: 'get',
                        object: 'request_turnover',
                        params: {
                            param_where: {
                                financing_request_id: obj.id
                            },
                            collapseData: false
                        }
                    };

                    _t.api(o, function (err, res) {
                        if (err) return cb(err);

                        turnovers = res;

                        cb(null);
                    });
                }
            }, cb);
        },
        prepareData0: function (cb) {
            readyData = {
                report_date: report_date,
                request_date: financing_request.request_date.substr(0,10),
                merchant_name: financing_request.merchant_name,
                financing_date: financing_request.financing_date,
                payments_start_date: financing_request.payments_start_date,
                request_financing_type: financing_request.request_financing_type,
                founding_amount: financing_request.founding_amount,
                amount_to_return: financing_request.amount_to_return,
                factoring_rate: financing_request.factoring_rate,
                payments_count: financing_request.payments_count,
                payment_amount: financing_request.payment_amount,
                financing_close_date: financing_request.financing_close_date,
                avl_proc_dly_withdraw_rate: financing_request.avl_proc_dly_withdraw_rate,
                t1: []
            };
            cb(null);
        },
        prepareData1: function (cb) {


            function defineDaysCount(mth, year){

                //var date =
            }

            for (var i in turnovers) {

                var turnover = turnovers[i];

                if(+turnover.turnover == 0){
                    continue;
                }

                readyData.t1.push({
                    month: turnover.month,
                    year: turnover.year,
                    turnover: turnover.turnover,
                    work_days_count: turnover.work_days_count,
                    full_days_count: turnover.full_days_count,
                    amount_per_day: turnover.amount_per_day,
                    daily_percent: turnover.daily_percent,
                    fixed_amount: turnover.fixed_amount,
                    percent_by_fixed_amount: turnover.percent_by_fixed_amount,
                    balance: turnover.balance
                });

            }
            cb(null);
        },
        getTemplate: function (cb) {

            name = (!financing_request.request_financing_type_sysname)? 'ERR' : (financing_request.request_financing_type_sysname == 'PERCENT')? 'request_report_percent.xlsx' : 'request_report_fixed.xlsx';

            if(name == 'ERR'){
                return cb(new UserError('Сначала необходимо расчитать финансирование'));
            }

            fs.readFile('./templates/' + name, function (err, data) {
                if (err) return cb(new MyError('Не удалось считать файл шаблона test.xlsx.', err));
                template = new XlsxTemplate(data);
                cb(null);
            });
        },
        perform: function (cb) {
            var sheetNumber = 1;
            template.substitute(sheetNumber, readyData);
            var dataBuf = template.generate();
            binaryData = new Buffer(dataBuf, 'binary');
            cb(null)
        },
        writeFile: function (cb) {
            filename = '_' + name;
            fs.writeFile('./public/savedFiles/' + filename,binaryData, function (err) {
                if (err) return cb(new MyError('Не удалось записать файл testOutput.xlsx',{err:err}));
                return cb(null, new UserOk('testOutput.xlsx успешно сформирован'));
            });
        }
    }, function (err) {
        if (err) return cb(err);
        cb(null, new UserOk('Ок.',{filename:filename,path:'/savedFiles/'}));
    })


};

Model.prototype.commercial_offer = function (obj, cb) {

    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;

    if (isNaN(+id)) return cb(new MyError('В метод не передан id заявки'));

    var fin_request;
    var commercial_offer_tmp_filename = Guid.create().value;

    async.series({
        getRequest: function (cb) {
            // Получим заявку
            var o = {
                command: 'get',
                object: 'financing_request',
                params: {
                    param_where: {
                        id: obj.id
                    },
                    collapseData: false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new UserError('Заявка не найдана'));

                fin_request = res[0];

                if(!fin_request.founding_amount) return cb(new UserError('Не указана сумма финансирования'));
                if(!fin_request.amount_to_return) return cb(new UserError('Не указана сумма возврата'));

                if(fin_request.request_financing_type_sysname == 'PERCENT'){
                    if(!fin_request.avl_proc_dly_withdraw_rate) return cb(new UserError('Не указан процент списания в день'));
                }else if(fin_request.request_financing_type_sysname == 'FIXED'){
                    if(!fin_request.payment_amount) return cb(new UserError('Не указан ежедневный платеж'));
                }else{
                    return cb(new UserError('Не указан тип финансирования'));
                }

                cb(null);
            });
        },
        createDoc: function (cb) {
            // Подготовим файл договора на основе шаблона и данных собранных ранее
            if (obj.skip) return cb(null);

            if(fin_request.request_financing_type_sysname == 'PERCENT'){

                fs.readFile('./templates/doc_request_commercial_offer_percent_tpl.docx', function (err, data) {

                    if (err) return cb(new MyError('Не удалось считать файл шаблона договора.', err));

                    var doc = new Docxtemplater(data);

                    doc.setData({
                        "dative_executive": obj.dative_executive || '',
                        "ip_or_short_name": obj.ip_or_short_name || '',
                        "dative_fio":       obj.dative_fio || '',
                        "respectable":      obj.respectable || '',
                        "io":               obj.io || '',
                        "founding_amount":      fin_request.founding_amount,
                        "amount_to_return":     fin_request.amount_to_return,
                        payments_start_date :   fin_request.payments_start_date,
                        payments_close_date:    fin_request.financing_close_date,
                        "avl_proc_dly_withdraw_rate":     fin_request.avl_proc_dly_withdraw_rate
                    });

                    doc.render();

                    var buf = doc.getZip().generate({type:"nodebuffer"});

                    fs.writeFile('./public/savedFiles/' + commercial_offer_tmp_filename +'.docx',buf, function (err) {

                        if (err) return cb(new MyError('Не удалось записать файл testOutput.docx',{err:err}));

                        return cb(null, new UserOk('testOutput.docx успешно сформирован'));

                    });

                });


            }else if(fin_request.request_financing_type_sysname == 'FIXED'){

                fs.readFile('./templates/doc_request_commercial_offer_fixed_tpl.docx', function (err, data) {

                    if (err) return cb(new MyError('Не удалось считать файл шаблона договора.', err));

                    var doc = new Docxtemplater(data);

                    doc.setData({
                        "dative_executive": obj.dative_executive || '',
                        "ip_or_short_name": obj.ip_or_short_name || '',
                        "dative_fio": obj.dative_fio || '',
                        "respectable": obj.respectable || '',
                        "io": obj.io || '',
                        "founding_amount": fin_request.founding_amount,
                        "amount_to_return": fin_request.amount_to_return,
                        "payments_count": fin_request.payments_count,
                        "payment_amount": fin_request.payment_amount
                    });

                    doc.render();

                    var buf = doc.getZip().generate({type: "nodebuffer"});

                    fs.writeFile('./public/savedFiles/' + commercial_offer_tmp_filename + '.docx', buf, function (err) {

                        if (err) return cb(new MyError('Не удалось записать файл testOutput.docx', {err: err}));

                        return cb(null, new UserOk('testOutput.docx успешно сформирован'));

                    });

                });

            }else{

                return cb(new UserError('Выберите тип финансирования.'));

            }
        }
    }, function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            //rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
            //    return cb(err, err2);
            //});
        }else{
            //if (!obj.skip){
            //    main_agreement_doc.file_id = res.uploadDoc[0].file_id;
            //}
            //rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'prepareAgreement', params:obj});

            cb(null, new UserOk('Ок.',{filename:commercial_offer_tmp_filename+'.docx',path:'/savedFiles/'}));

            //cb(null, new UserOk('Коммерческое предложение успешно сформировано.',{commercial_offer_doc:commercial_offer_tmp_filename}));
        }
    });


};

Model.prototype.request_to_merchant = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }

    var _t = this;
    var id = obj.id;

    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();

    var fin_request;
    var merchant_id;
    var request_docs;
    var request_docs_ids = [];

    var req_files;

    async.series({
        getRequest: function (cb) {

            _t.getById({id:id}, function (err, res) {

                if(err) return cb(new MyError('Не удалось получить запись заявки', {id: id, err: err}));

                fin_request = res[0];

                cb(null);

            });

        },
        addOrUpdateMerchant: function (cb) {

            var o;

            if(fin_request.merchant_id){

                o = {
                    command: 'modify',
                    object: 'merchant',
                    params: {
                        id:fin_request.merchant_id,
                        rollback_key:rollback_key
                    }
                };

                if(!fin_request.business_type_id) return cb(new UserError('Укажите тип бизнеса'));
                if(!fin_request.lead_type_id) return cb(new UserError('Укажите тип лида'));

                for(var i in fin_request){

                    if(i == 'id' ||
                        i == 'payments_start_date' ||
                        i == 'financing_close_date' ||
                        i == 'financing_close_date' ||
                        i == "request_status_id" ||
                        i == "request_status" ||
                        i == "request_status_sysname" ||
                        i == "request_status_color" ){
                        continue;
                    }
                    if(i == 'merchant_name'){
                        o.params['name'] = fin_request[i];
                        continue;
                    }
                    if(i == 'request_financing_type_id'){

                        o.params['financing_type_id'] = fin_request[i];
                        continue;
                    }
                    if(i == 'financing_request_type_id'){

                        o.params['financing_request_type_id'] = fin_request[i];
                        continue;
                    }



                    o.params[i] = fin_request[i];

                }


            }else{
                o = {
                    command: 'add',
                    object: 'merchant',
                    params: {
                        rollback_key: rollback_key
                    }
                };

                if(!fin_request.business_type_id) return cb(new UserError('Укажите тип бизнеса'));
                if(!fin_request.lead_type_id) return cb(new UserError('Укажите тип лида'));

                for(var i in fin_request){
                    if(i == 'id' ||
                        i == "request_status_id" ||
                        i == "request_status" ||
                        i == "request_status_sysname" ||
                        i == "request_status_color" ){
                        continue;
                    }
                    if(i == 'merchant_name'){
                        o.params['name'] = fin_request[i];
                        continue;
                    }
                    if(i == 'request_financing_type_id'){
                        o.params['financing_type_id'] = fin_request[i];
                        continue;
                    }
                    if(i == 'financing_request_type_id'){

                        o.params['financing_request_type_id'] = fin_request[i];
                        continue;
                    }


                    o.params[i] = fin_request[i];

                }

                o.params['request_status_sysname'] = 'CREATED';

            }

            _t.api(o, function(err,res){

                if(err) return cb(new UserError('Не удалось создать / обновить торговца', {o:o, err:err}));
                merchant_id = res.id;
                cb(null);

            });

        },
        updateRequest: function (cb) {

            //var o = {
            //    command: 'modifyPrototype',
            //    object: 'financing_request',
            //    params: {
            //        request_status_sysname: 'IN_WORK',
            //        merchant_id: merchant_id,
            //        id: id
            //    }
            //};
            //
            //_t.api(o, function (err, res) {
            //
            //    if(err) return cb(new UserError('Не удалось обновить запись заявки odh', {err: err, o:o}));
            //
            //    cb(null);
            //
            //});

            var params = {
                request_status_sysname: 'IN_WORK',
                merchant_id: merchant_id,
                id: id,
                rollback_key:rollback_key
            };

            _t.modifyPrototype(params, function (err, res) {
                if(err) return cb(new UserError('Не удалось обновить запись заявки odh', {err: err, params:params}));
                cb(null);

            });

        },
        addRepresentative: function (cb) {
            if(fin_request.merchant_id) return cb(null); // Уже есть

            var fio_arr = fin_request.executive_fio.split(' ');
            var name = fio_arr[1];
            var surname = fio_arr[2];
            var lastname = fio_arr[0];

            var o = {
                command: 'add',
                object: 'merchant_representative',
                params: {
                    merchant_id: merchant_id,
                    name : name,
                    surname : surname,
                    lastname : lastname,
                    position : fin_request.executive,
                    phone_work : fin_request.phone,
                    phone_mobile : fin_request.phone,
                    email : fin_request.email,
                    rollback_key:rollback_key
                }
            };

            _t.api(o, function(err,res){

                if(err) return cb(new UserError('Не удалось создать представителя торговца', {err:err, o:o}));
                cb(null);

            });

        },
        getDocs: function (cb) {

            var o = {
                command: 'get',
                object: 'request_document',
                params: {
                    param_where: {
                        financing_request_id: id
                    },
                    collapseData: false
                }
            };

            _t.api(o, function (err, res) {

                if(err) return cb(new UserError('Не удалось получить документы из заявки', {err:err,o:o}));

                request_docs = res;

                for(var i in res){
                    request_docs_ids.push(res[i].document_id);
                }

                cb(null);

            });

        },
        addDocs: function (cb) {

            var newFileId;

            async.eachSeries(request_docs, function (item, cb) {
                async.series({
                    copyFile: function (cb) {

                        if(item.file_id){
                            var o = {
                                command: 'copy',
                                object: 'file',
                                params: {
                                    id: item.file_id
                                }
                            };

                            _t.api(o, function (err, res) {

                                if(err) return cb(new UserError('Не удалоьс скопировать файл', {err:err,o:o}));

                                newFileId = res.id;

                                cb(null);
                            });
                        }else{
                            cb(null);
                        }
                    },
                    createMerchantDocument: function (cb) {

                        var o = {
                            command: 'add',
                            object: 'merchant_document',
                            params: {
                                merchant_id: merchant_id,
                                document_id: item.document_id,
                                file_id: newFileId
                            }
                        };

                        _t.api(o, function (err, res) {

                            if(err) return cb(new UserError('Не удалось создать документ торговца', {err:err, o:o}));

                            cb(null);

                        });

                    }
                }, cb);
            }, cb);
        }
    },function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!obj.doNotSaveRollback){
                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'request_to_merchant', params:obj});
            }
            cb(null, new UserOk('Ок'));
        }
    });
};

Model.prototype.example = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();

    async.series({

    },function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            //if (!obj.doNotSaveRollback){
            //    rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'METHOD_NAME', params:obj});
            //}
            cb(null, new UserOk('Ок'));
        }
    });
};



module.exports = Model;
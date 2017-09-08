/**
 * Created by iig on 29.10.2015.
 */
var MyError = require('../error').MyError;
var UserError = require('../error').UserError;
var UserOk = require('../error').UserOk;
var BasicClass = require('./system/BasicClass');
var util = require('util');
var funcs = require('../libs/functions');
var api = require('../libs/api');
var async = require('async');
var mustache = require('mustache');
var fs = require('fs');
var sendMail = require('../libs/sendMail');
var Guid = require('guid');
var generateCalendar = require('../modules/generate_calendar');
var rollback = require('../modules/rollback');
var Docxtemplater = require('docxtemplater');
var XlsxTemplate = require('xlsx-template');
var petrovich = require('petrovich');
var moment = require('moment');
var rubles = require('rubles').rubles;


function getNoun(number, one, two, five) {
    number = Math.abs(number);
    number %= 100;
    if (number >= 5 && number <= 20) {
        return five;
    }
    number %= 10;
    if (number == 1) {
        return one;
    }
    if (number >= 2 && number <= 4) {
        return two;
    }
    return five;
}


var Model = function (obj) {
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
    Model.super_.prototype.init.apply(this, [obj, function (err) {
        cb(null);
    }]);
};
Model.prototype.addHistory = function (obj, cb) { // Создадим запись в истории финансирования мерчанта
    var _t = this;
    if (typeof cb !== 'function') throw new MyError('В addHistory не передана функция cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не передан obj', {method: 'addHistory'}));
    var merchant_financing_id = obj.id || obj.merchant_financing_id;
    if (!merchant_financing_id) return cb(new MyError('В addHistory не передан merchant_financing_id'));
    var o = {
        command: 'add',
        object: 'merchant_financing_history_log',
        params: {
            merchant_financing_id: merchant_financing_id,
            datetime: funcs.getDateTimeMySQL()
        }
    };
    for (var i in obj) {
        o.params[i] = obj[i]
    }

    _t.api(o, function (err, res) {
        if (err) return cb(new MyError('Не удалось добавить запись в историю финансирования мерчанта.', {
            err: err,
            merchant_financing_id: merchant_financing_id,
            params: o.params
        }));
        cb(null);
    })
};
Model.prototype.setStatus = function (obj, cb) { // Установим статус финансирования
    if (typeof cb !== 'function') throw new MyError('В setStatus не передана функция cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не передан obj', {method: 'setStatus'}));
    var _t = this;
    var id = obj.id;
    var status = obj.status;
    if (isNaN(+id)) return cb(new MyError('В setStatus не передан id'));
    if (typeof status !== 'string') return cb(new MyError('В setStatus не передан status'));
    var o = {
        id: id,
        status_sysname: status,
        rollback_key:obj.rollback_key
    };
    _t.modify(o, function (err, res) {
        if (err){
            if (err.message == 'notModified') {
                console.log(err);
                return cb(null);
            }
            return cb(err);
        }
        cb(err, res);
    });
};


Model.prototype.calc_functions = {
    card_turnover: function (obj) {
        var total_mouthly_turnover = obj.total_mouthly_turnover;
        var visa_mc_percent = obj.visa_mc_percent;
        if (isNaN(+total_mouthly_turnover) || isNaN(+visa_mc_percent)) {
            console.log('Не достаточно данных для вычисления.', {
                field: 'card_turnover',
                total_mouthly_turnover: total_mouthly_turnover,
                visa_mc_percent: visa_mc_percent
            });
            return obj;
        }
        obj.card_turnover = total_mouthly_turnover * (visa_mc_percent / 100);
        return obj;
    },
    profit: function (obj) {
        var total_mouthly_turnover = obj.total_mouthly_turnover;
        var profitability = obj.profitability;
        if (isNaN(+total_mouthly_turnover) || isNaN(+profitability)) {
            console.log('Не достаточно данных для вычисления.', {
                field: 'profit',
                total_mouthly_turnover: total_mouthly_turnover,
                profitability: profitability
            });
            return obj;
        }
        obj.profit = total_mouthly_turnover * (profitability / 100);
        return obj;
    },
    profit_card: function (obj) {
        var visa_mc_percent = obj.visa_mc_percent;
        var profit = obj.profit;
        if (isNaN(+profit) || isNaN(+visa_mc_percent)) {
            console.log('Не достаточно данных для вычисления.', {
                field: 'profit_card',
                visa_mc_percent: visa_mc_percent,
                profit: profit
            });
            return obj;
        }
        obj.profit_card = profit * (visa_mc_percent / 100);
        return obj;
    },
    founding_amount: function (obj) {
        if (obj.dont_recalc_founding_amount && obj.founding_amount) return obj;
        var total_mouthly_turnover = obj.total_mouthly_turnover;
        var visa_mc_percent = obj.visa_mc_percent;
        if (isNaN(+total_mouthly_turnover) || isNaN(+visa_mc_percent)) {
            console.log('Не достаточно данных для вычисления.', {
                field: 'founding_amount',
                total_mouthly_turnover: total_mouthly_turnover,
                visa_mc_percent: visa_mc_percent
            });
            return obj;
        }
        obj.founding_amount = total_mouthly_turnover * (visa_mc_percent / 100);
        return obj;
    },
    amount_to_return: function (obj) {
        var founding_amount = obj.founding_amount;
        var factoring_rate = obj.factoring_rate;
        if (isNaN(+founding_amount) || isNaN(+factoring_rate)) {
            console.log('Не достаточно данных для вычисления.', {
                field: 'amount_to_return',
                founding_amount: founding_amount,
                factoring_rate: factoring_rate
            });
            return obj;
        }
        obj.amount_to_return = founding_amount + (founding_amount * factoring_rate / 100);
        return obj;
    },
    amount_card_day: function (obj) {
        var card_turnover = obj.card_turnover;
        var acquiring_days_count = obj.acquiring_days_count;
        if (isNaN(+card_turnover) || isNaN(+acquiring_days_count)) {
            console.log('Не достаточно данных для вычисления.', {
                field: 'amount_card_day',
                card_turnover: card_turnover,
                acquiring_days_count: acquiring_days_count
            });
            return obj;
        }
        if (acquiring_days_count === 0) {
            console.log('Не достаточно данных для вычисления. acquiring_days_count == 0');
            return obj;
        }
        obj.amount_card_day = card_turnover / acquiring_days_count;
        return obj;
    },
    payment_amount: function (obj) {
        var amount_card_day = obj.amount_card_day;
        var avl_proc_dly_withdraw_rate = obj.avl_proc_dly_withdraw_rate;
        if (isNaN(+amount_card_day) || isNaN(+avl_proc_dly_withdraw_rate)) {
            console.log('Не достаточно данных для вычисления.', {
                field: 'payment_amount',
                amount_card_day: amount_card_day,
                avl_proc_dly_withdraw_rate: avl_proc_dly_withdraw_rate
            });
            return obj;
        }
        obj.payment_amount = Math.floor(amount_card_day * avl_proc_dly_withdraw_rate / 100);
        return obj;
    },
    payments_count: function (obj) {
        var payment_amount = obj.payment_amount;
        var amount_to_return = obj.amount_to_return;
        if (isNaN(+payment_amount) || isNaN(+amount_to_return)) {
            console.log('Не достаточно данных для вычисления.', {
                field: 'payments_count',
                payment_amount: payment_amount,
                amount_to_return: amount_to_return
            });
            return obj;
        }
        if (payment_amount === 0) {
            console.log('Не достаточно данных для вычисления. payment_amount == 0');
            return obj;
        }
        obj.payments_count = Math.ceil(amount_to_return / payment_amount);
        return obj;
    }
};



///------------ADD / GET---------------------//
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

/**
 * Таблица взятых на карандаш
 * @param obj
 * @param cb
 */
Model.prototype.get_table_attention_financing = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;

    // запросить только те которые на карандаш

    var coWhere = [
        {
            key:'attention_date',
            type:'isNotNull'
        }
    ];
    if (!Array.isArray(obj.where)) obj.where = coWhere;
    else obj.where = obj.where.concat(coWhere);
    _t.getPrototype(obj,cb);
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
    var merchant_id = obj.merchant_id;
    if (!merchant_id) return cb(new MyError('merchant_id не передан'));
    var confirm = obj.confirm;
    var financing_type_id = obj.merchant_financing_type_id;
    // Проверяю есть ли открытые финансирования (если есть, делаю запрос на confirm)
    // Получить данные по мерчу (чтобы использовать его поля)
    // Вызывю классический add
    // Получить данные о документах их мерча
    // Скопировать в финансирования (эти доки)
    // Записать лог о создании
    var rollback_key = obj.rollback_key || rollback.create();
    var needConfirm, merchant, merchant_financing_id, document_ids;
    var bank;

    var required_docs;
    var required_docs_ids = [];

    var from_request = obj.from_request;

    async.series({
        0: function (cb) {
            // Проверяю есть ли открытые финансирования (если есть, делаю запрос на confirm)
            if (confirm) return cb(null);
            var p = {
                where:[
                    {
                        key:'merchant_id',
                        val1:merchant_id
                    },
                    {
                        key:'status_sysname',
                        type:'in',
                        val1:['CREATED','OFFER_ACCEPTED','DOCS_REQUESTED','DOCS_RECIEVED','AGREEMENT_CREATED','AGREEMENT_SENT','AGREEMENT_UPLOADED']
                    }
                ],
                collapseData: false
            };
            _t.get(p, function (err, res) {
                if (err) return cb(err);
                if (res.length) needConfirm = true;
                return cb(null);
            })
        },
        getMerchantData: function (cb) {
            // Получить данные по мерчу (чтобы использовать его поля)
            var o = {
                command: 'getById',
                object: 'merchant',
                params: {
                    id: merchant_id
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить информацию по торговцу', {
                    err: err,
                    merchant_id: merchant_id
                }));
                if (!res.length) return cb(new MyError('Не удалось найти такого торговца', {
                    merchant_id: merchant_id
                }));
                merchant = res[0];
                return cb(null);
            });
        },
        checkFinancingRequest: function(cb){

            var o = {
                command:'get',
                object:'financing_request',
                params:{
                    where: [
                        {
                            key: 'through_number',
                            val1: merchant.through_number
                        }
                    ],
                    collapseData:false
                }
            };

            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить заявку',{o : o, err : err}));

                if(res.length == 0){

                    return cb(new UserError('Для данного торговца не было создано заявки на финасирование'));

                }

                cb(null);
            });

        },
        checkRequredConditions: function (cb) {
            if (!merchant.processing_bank_id) return cb(new UserError('У торговца не указан "Рабочий банк (эквайер)" .'));
            return cb(null);
        },
        calc: function (cb) {

            if(obj.from_request){

                cb(null);

            }else{

                var cals_funcs = _t.calc_functions;
                for (var i in cals_funcs) {
                    if (typeof cals_funcs[i]==='function') obj = cals_funcs[i](obj);
                }
                delete obj.card_turnover;
                delete obj.amount_card_day;
                cb(null);

            }

        },
        getbank: function (cb) {
            if (!merchant.processing_bank_id) return cb(new UserError('У торговца не указан банк.',{merchant:merchant}));
            var o = {
                command: 'getById',
                object: 'bank',
                params: {
                    id: merchant.processing_bank_id,
                    rollback_key: rollback_key
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить банк', {o: o, err: err}));
                bank = res[0];
                cb(null);
            });
        },
        addRow: function (cb) {

            if (needConfirm && !confirm) {
                return cb(new UserError('needConfirm', {confirmType:'dialog', message: 'Уже есть финансирование в статусе "СОЗДАНО". Вы уверены что хотите создать еще одно?'}));
            }

            obj.rollback_key = rollback_key;

            if(from_request){ // Новый режим (из заявки)

                obj['founding_amount'] =  merchant.founding_amount;
                obj['factoring_rate'] =  merchant.factoring_rate;
                obj['amount_to_return'] =  merchant.amount_to_return;
                obj['payment_amount'] =  merchant.payment_amount;
                obj['payments_count'] =  merchant.payments_count;
                obj['financing_type_id'] =  merchant.financing_type_id;
                obj['avl_proc_dly_withdraw_rate'] =  merchant.avl_proc_dly_withdraw_rate;
                obj['merchant_id'] =  merchant.id;
                obj['processing_bank_id'] =  merchant.processing_bank_id;
                obj['processing_bank_commission'] =  bank.comission_percent;
                obj['lead_type_id'] =  merchant.lead_type_id;
                obj['business_type_id'] =  merchant.business_type_id;
                obj['payments_start_date'] =  merchant.payments_start_date;
                obj['financing_close_date'] =  merchant.financing_close_date;
                obj['through_number'] =  merchant.through_number;
                obj['fromClient'] =  false;
                obj['manager_id'] = merchant.manager_id;
                obj['terminal_number'] = merchant.terminal_number;

                //obj['manager_name'] = merchant.manager_name;
                //obj['manager_lastname'] = merchant.manager_lastname;


                console.log('UUDUDUDUDDU', obj);

                _t.addPrototype(obj, function (err, res) {
                    delete obj.rollback_key;
                    if (err) return cb(err);
                    merchant_financing_id = res.id;
                    cb(err, res);
                });


            } else {

                // Поля которые надо скопировать из мерча

                var fieldsToCopy = [
                    "busines_type_id",
                    "merchant_id",
                    "total_mouthly_turnover",
                    "visa_mc_percent",
                    "acquiring_days_count",
                    "avl_mth_withdraw_rate",
                    "avl_proc_dly_withdraw_rate",
                    "processing_bank_id",
                    "total_mouthly_credit_card_turnover"
                ];

                for (var i in fieldsToCopy) {
                    var field_name = fieldsToCopy[i];
                    obj[field_name] = obj[field_name] || merchant[field_name];
                }


                obj.merchant_financing_type_id = financing_type_id;
                obj.fromClient = false;
                obj.processing_bank_commission = bank.comission_percent;

                _t.addPrototype(obj, function (err, res) {
                    delete obj.rollback_key;
                    if (err) return cb(err);
                    merchant_financing_id = res.id;
                    cb(err, res);
                });
            }
        },
        getMerchantDocs: function (cb) {
            var o = {
                command: 'get',
                object: 'merchant_document',
                params: {
                    collapseData: false,
                    columns: ['document_id'],
                    where: [
                        {
                            key: 'merchant_id',
                            val1: merchant_id
                        }
                    ]
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить документы для данного торговца.', {
                    err: err,
                    merchant_id: merchant_id
                }));
                document_ids = res;
                cb(null);
            })
        },
        insertDocs: function (cb) { // Создадим соответствующие записи в документах финансирования мерчанта

            if(from_request){

                async.series({
                    getDocsIds: function (cb) {

                        var docs_arr = ['MAIN_AGREEMENT_PDF', 'SUPPLEMENTARY_AGREEMENT_PDF', 'PAYMENT_SCHEDULE', 'APPLICATION_4', 'PROXY', 'SERVICE_NOTE'];

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

                        async.eachSeries(required_docs_ids, function (item, cb) {

                            var o = {
                                command: 'add',
                                object: 'merchant_financing_document',
                                params: {
                                    merchant_financing_id: merchant_financing_id,
                                    document_id: item
                                }
                            };

                            o.params.rollback_key = rollback_key;

                            _t.api(o, function (err) {

                                if (err) return cb(new MyError('Не удалось добавить документы для данного финансирования.', {
                                    err: err,
                                    merchant_financing_id: merchant_financing_id,
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

            }else{

                async.eachSeries(document_ids, function (item, cb) {

                    var o = {
                        command: 'add',
                        object: 'merchant_financing_document',
                        params: {
                            merchant_financing_id: merchant_financing_id,
                            document_id: item.document_id
                        }
                    };

                    o.params.rollback_key = rollback_key;

                    _t.api(o, function (err) {

                        if (err) return cb(new MyError('Не удалось добавить документы для данного торговца.', {
                            err: err,
                            merchant_financing_id: merchant_financing_id,
                            document_id: item.document_id
                        }));
                        cb(null);
                    });

                }, cb);
            }
        },
        setCurrentFinancingId: function (cb) {
            var o = {
                command: 'modify',
                object: 'merchant',
                params: {
                    id: merchant_id,
                    current_financing_id:merchant_financing_id
                }
            };
            o.params.rollback_key = rollback_key;
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось устаносить текущее финансирование для торговца', {
                    err: err,
                    merchant_id: merchant_id,
                    current_financing_id:current_financing_id
                }));
                return cb(null);
            });
        },
        setFinRequestStatus: function (cb) {

            var o = {
                command: 'modify',
                object: 'merchant',
                params: {
                    request_status_sysname: 'IN_WORK',
                    id: merchant_id
                }
            };

            _t.api(o, function (err, res) {

                if(err){
                    if(err.data.err.message == 'notModified'){

                    }else{
                        return cb(new UserError('Не удалось обновить статус заявки в торговце', {err:err, o:o}));
                    }

                }

                cb(null);

            });
        },
        addHistory: function (cb) { // Создадим запись в истории мерчанта
            obj.merchant_financing_id = merchant_financing_id;
            _t.addHistory(obj, cb);
        }
    }, function (err, res) {
        if (err) {
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err, res) {
                console.log('Результат выполнения rollback', err, res);
            });
            return cb(err);
        }
        //rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'add', params:obj});
        cb(null, res.addRow);
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


    // async.series({
    //
    // },function (err, res) {
    //     if (err) {
    //         if (err.message == 'needConfirm') return cb(err);
    //         rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
    //             return cb(err, err2);
    //         });
    //     } else {
    //         //if (!obj.doNotSaveRollback){
    //         //    rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'METHOD_NAME', params:obj});
    //         //}
    //         cb(null, new UserOk('Ок'));
    //     }
    // });
};

Model.prototype.modify_ = function (obj, cb) {
   if (arguments.length == 1) {
       cb = arguments[0];
       obj = {};
   }
   var _t = this;
    var rollback_key = obj.rollback_key || rollback.create();
    var id = obj.id;
    if (!id) return cb(new MyError('id не передан'));

    var processing_bank_id = obj.processing_bank_id
    if (!processing_bank_id){
        _t.modifyPrototype(obj, function (err, res) {
            if (err) return cb(err);
            cb(err, res);
        });
        return;
    }

    var fin, bank;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function(err, res){
                if (err) return cb(err);
                fin = res[0];
                cb(null);
            });
        },
        getbank: function (cb) {
            if (!processing_bank_id) return cb(new UserError('У финансирования не указан банк.',{fin:fin}));
            var o = {
                command: 'getById',
                object: 'bank',
                params: {
                    id: processing_bank_id,
                    rollback_key: rollback_key
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить банк', {o: o, err: err}));
                bank = res[0];
                cb(null);
            });
        },
        modifyRow: function (cb) {
            obj.processing_bank_commission = bank.comission_percent;
            _t.modifyPrototype(obj, function (err, res) {
                if (err) return cb(err);
                cb(err, res);
            });
        },
        addHistory: function (cb) { // Создадим запись в истории мерчанта
            var o = {
                id: id,
                history_log_status_sysname: fin.status_sysname
            };
            for (var i in fin) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = fin[i];
            }

            _t.addHistory(o, cb);
        }
    }, function (err, res) {
        if (err) {
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err, res) {
                console.log('Результат выполнения rollback', err, res);
            });
            return cb(err);
        }
        rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'modify_processing_bank_commission', params:obj});
        cb(null, res.modifyRow);
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

Model.prototype.removeCascade_ = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.ids || obj.id;
    if (!id) return cb(new MyError('id не передан'));
    var confirm = obj.confirm;

    if (!obj.fromClient) return _t.removeCascadePrototype(obj, cb);


    var rollback_key = obj.rollback_key || rollback.create();
    var status, merchant_financing;
    async.series({
        getFinancing: function (cb) {
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(err);
                merchant_financing = res[0];
                return cb(null);
            })
        },
        //setCurrentFinancingId: function (cb) {
        //    var o = {
        //        command: 'modify',
        //        object: 'merchant',
        //        params: {
        //            id: merchant_financing.merchant_id,
        //            current_financing_id:null
        //        }
        //    };
        //    o.params.rollback_key = rollback_key;
        //    _t.api(o, function (err, res) {
        //        if (err) return cb(new MyError('Не удалось устаносить текущее финансирование для торговца', {
        //            err: err,
        //            id: merchant_financing.merchant_id,
        //            current_financing_id:null
        //        }));
        //        return cb(null);
        //    });
        //},
        getStatus: function (cb) {
            var o = {
                command:'get',
                object:'merchant_financing_status',
                params:{
                    param_where:{
                        id:merchant_financing.status_id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb( new MyError('Не удалось получить статус финансирования.',{err:err, o:o}));
                status = res[0];
                cb(null);
            })
        },
        checkStatus: function (cb) {
            if (status.num_in_series >= 140) return cb(new UserError('Финансирование уже было запущенно в работу его нельзя удалить.',{status:status}));
            cb(null);
        },
        clearInfoInParentFinancing: function (cb) {
            if (!merchant_financing.closing_financing_id) return cb(null);
            var params = {
                id:merchant_financing.closing_financing_id,
                closed_by_financing_id:null,
                refinancing_amount:null,
                rollback_key:rollback_key
            };
            _t.modify(params, cb);
        },
        remove: function (cb) {
            obj.rollback_key = rollback_key;
            obj.doNotSaveRollback = true;
            _t.removeCascadePrototype(obj, cb);
        },
        addHistory: function (cb) { // Создадим запись в истории мерчанта
            var o = {
                merchant_financing_id: id,
                history_log_status_sysname: 'REMOVED'
            };
            for (var i in merchant_financing) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant_financing[i];
            }
            _t.addHistory(obj, cb);
        }
    }, function (err, res) {
        if (err) {
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err, res) {
                console.log('Результат выполнения rollback', err, res);
            });
            return cb(err);
        }
        rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'removeCascade_', params:obj});
        cb(null, res.addRow);
    });
};

//Model.prototype.modify_old = function (obj, cb) {
//
//    if (arguments.length == 1) {
//        cb = arguments[0];
//        obj = {};
//    }
//
//    var id = obj.id;
//    if (isNaN(+id)) return cb(new MyError('В метод не передан id'));
//    var rollback_key = obj.rollback_key || rollback.create();
//
//    var _t = this;
//    var merchant_financing;
//
//    async.series({
//
//        get: function (cb) {
//
//            _t.getById({id: id}, function (err, res) {
//                if (err) return cb(err);
//                if (!res.length) return cb(new MyError('Не найдено финансирование.', {id: id}));
//                merchant_financing = res[0];
//                cb(null);
//            });
//
//        },
//        check: function (cb) {
//
//            merchant_financing.total_mouthly_credit_card_turnover = (merchant_financing.total_mouthly_credit_card_turnover == '')? merchant_financing.total_mouthly_turnover / 100 * merchant_financing.visa_mc_percent : merchant_financing.total_mouthly_credit_card_turnover;
//            merchant_financing.total_mouthly_turnover = (merchant_financing.total_mouthly_turnover == '')? merchant_financing.total_mouthly_credit_card_turnover / 100 * merchant_financing.visa_mc_percent : merchant_financing.total_mouthly_turnover;
//            merchant_financing.total_mouthly_credit_card_turnover = (merchant_financing.total_mouthly_credit_card_turnover == '')? merchant_financing.total_mouthly_turnover / 100 * merchant_financing.visa_mc_percent : merchant_financing.total_mouthly_credit_card_turnover;
//
//        }
//
//
//
//    }, function (err, res) {
//
//        if (err) {
//            if (err.message == 'needConfirm') return cb(err);
//            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
//                return cb(err, err2);
//            });
//        }else{
//            cb(null, new UserOk('Банк уведомлен'));
//        }
//
//    });
//
//
//};

Model.prototype.setFinancingAsCurrent = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var merchant_id = obj.merchant_id;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id финансирования'));
    if (isNaN(+merchant_id)) return cb(new MyError('В метод не передан id торговца'));
    var _t = this;

    var o = {
        command: 'modify',
        object: 'merchant',
        params: {
            id: merchant_id,
            current_financing_id:id
        }
    };
    _t.api(o, function (err, res) {
        if (err) return cb(new MyError('Не удалось устаносить текущее финансирование для торговца', {
            err: err,
            merchant_id: merchant_id,
            current_financing_id:id
        }));
        return cb(null, new UserOk('Финансирование установлено как текущее.'));
    });
};

///--------END-ADD---------------------//


//var o = {
//    command:'recalcFinancing',
//    object:'merchant_financing',
//    params:{
//        id:218
//    }
//}
//socketQuery(o, function(res){
//    console.log(res);
//})
/*

 */
Model.prototype.recalcFinancing = function (obj, cb) {

    // Загрузить значение из базы
    // Выполнить функции пересчета
    // сравнить, были ли изменения
    // если были, то сохранить и записать лог
    // если нет, вернуть уведомление
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    var merchant_financing;
    if (!id || isNaN(+id)) return cb(new MyError('В recalFinancing не передан id'));
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
                if (!res.length) return cb(new MyError('Нет такой записи в merchant_financing', {params: params}));
                merchant_financing = res[0];
                return cb(null);
            })
        },
        checkRequiredFields: function (cb) {
            // Проверим, хватает ли полей для пересчета
            if(!+merchant_financing.factoring_rate>0) return cb(new UserError('Не указана ставка факторинга.'));
            return cb(null);
        },
        recalc: function (cb) {
            // Выполнить функции пересчета
            var cals_funcs = _t.calc_functions;
            var toModify = [];
            for (var i in cals_funcs) {
                if (typeof cals_funcs[i] === 'function') {
                    var old_val = merchant_financing[i];
                    if (obj.dont_recalc_founding_amount) merchant_financing.dont_recalc_founding_amount = obj.dont_recalc_founding_amount;
                    merchant_financing = cals_funcs[i](merchant_financing);
                    if (typeof old_val !== 'undefined' && old_val !== merchant_financing[i]) {
                        toModify.push(i);
                    }
                }
            }
            if (!toModify.length) return cb(new UserError('Нет изменений для пересчета'));
            var params = {};
            for (var j in toModify) {
                params[toModify[j]] = merchant_financing[toModify[j]];
            }
            params.id = id;
            async.series([
                function (cb) {
                    _t.modify(params, cb);
                },
                function (cb) {
                    // запишем лог
                    var o = {
                        merchant_financing_id: id,
                        history_log_status_sysname: 'RECALC'
                    };
                    for (var i in merchant_financing) {
                        if (typeof o[i] !== 'undefined') continue;
                        o[i] = merchant_financing[i];
                    }
                    _t.addHistory(o, cb);
                }
            ], cb);

        }
    }, function (err, res) {
        if (err) {
            if (err instanceof UserError) return cb(err);
            return cb(err);
        }
        cb(null, new UserOk('Пересчет успешно произведен'));
    })
};

Model.prototype.recalculate = function(obj, cb){

    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    var merchant_financing;
    if (!id || isNaN(+id)) return cb(new MyError('В recalFinancing не передан id'));


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
                if (!res.length) return cb(new MyError('Нет такой записи в merchant_financing', {params: params}));
                merchant_financing = res[0];
                return cb(null);
            });
        },
        checkRequiredFields: function (cb) {
            // Проверим, хватает ли полей для пересчета

            if(!+merchant_financing.factoring_rate>0)                           return cb(new UserError('Не указана ставка факторинга.'));

            if(!+merchant_financing.total_mouthly_credit_card_turnover>0 && !+merchant_financing.founding_amount>0)       return cb(new UserError('Укажите месячный оборот по картам или сумму фондирования.'));

            if(!+merchant_financing.acquiring_days_count>0)                     return cb(new UserError('Не указано количество рабочих дней.'));

            if(!+merchant_financing.avl_proc_dly_withdraw_rate>0)               return cb(new UserError('Не указан макс. % списания в день по картам.'));

            //if(!+merchant_financing.total_mouthly_turnover>0)                   return cb(new UserError('Не указан общий месячный оборот.'));

            //if(!+merchant_financing.visa_mc_percent>0)                          return cb(new UserError('Не указан процент visa / mc.'));

            if(obj.recalc_type == 'by_founding_amount' && !+merchant_financing.founding_amount>0)           return cb(new UserError('Не указана сумма финансирования'));

            if(obj.recalc_type == 'by_payment_amount' && !+merchant_financing.payment_amount>0)             return cb(new UserError('Не указана сумма платежа'));

            if(obj.recalc_type == 'by_payments_count' && !+merchant_financing.payments_count>0)             return cb(new UserError('Не указано количество платежей'));


            return cb(null);
        },
        recalc: function (cb) {

            //var toModify = [];

            var fa;
            var atr;
            var pa;
            var pc;
            var tmt;
            var avl_proc_dly_withdraw_rate_calculated;

            var params = {};

            switch(obj.recalc_type){
                case 'classic':

                    fa = +merchant_financing.founding_amount || parseFloat(merchant_financing.total_mouthly_credit_card_turnover);
                    atr = parseFloat(fa) + parseFloat((fa / 100 * merchant_financing.factoring_rate));
                    //pa = ( parseFloat(fa) / parseInt(merchant_financing.acquiring_days_count) ) / 100 * parseInt(merchant_financing.avl_proc_dly_withdraw_rate);
                    //pc = Math.ceil(atr / pa);

                    if (merchant_financing.financing_type_sysname == 'PERCENT' && merchant_financing.avl_proc_dly_withdraw_rate){
                        avl_proc_dly_withdraw_rate_calculated = merchant_financing.avl_proc_dly_withdraw_rate;
                        pa = parseInt(avl_proc_dly_withdraw_rate_calculated * fa / (parseInt(merchant_financing.acquiring_days_count) * 100));
                        pc = atr/pa;

                    }else{
                        pc = 90;
                        pa = atr/pc;
                        avl_proc_dly_withdraw_rate_calculated = pa * parseInt(merchant_financing.acquiring_days_count) * 100/ fa;
                    }


                    break;
                case 'by_founding_amount':

                    fa = +merchant_financing.founding_amount || parseFloat(merchant_financing.total_mouthly_credit_card_turnover);
                    atr = parseFloat(fa) + (parseFloat(fa) / 100 * parseInt(merchant_financing.factoring_rate));
                    pa = ( parseFloat(fa) / parseInt(merchant_financing.acquiring_days_count) ) / 100 * parseInt(merchant_financing.avl_proc_dly_withdraw_rate);
                    pc = Math.ceil(atr / pa);
                    avl_proc_dly_withdraw_rate_calculated = pa * parseInt(merchant_financing.acquiring_days_count) * 100/ +fa;

                    break;
                case 'by_payment_amount':

                    fa = +merchant_financing.founding_amount || parseFloat(merchant_financing.total_mouthly_credit_card_turnover);
                    atr = parseFloat(fa) + (parseFloat(fa) / 100 * parseInt(merchant_financing.factoring_rate));
                    pa = parseFloat(merchant_financing.payment_amount);
                    pc = Math.ceil(atr / pa);
                    avl_proc_dly_withdraw_rate_calculated = pa * parseInt(merchant_financing.acquiring_days_count) * 100/ fa;

                    break;
                case 'by_payments_count':

                    fa = +merchant_financing.founding_amount || parseFloat(merchant_financing.total_mouthly_credit_card_turnover);
                    atr = parseFloat(fa) + (parseFloat(fa) / 100 * parseInt(merchant_financing.factoring_rate));
                    pc = parseInt(merchant_financing.payments_count);
                    pa = atr/pc;
                    // Рассчитанный процент
                    avl_proc_dly_withdraw_rate_calculated = pa * parseInt(merchant_financing.acquiring_days_count) * 100/ fa;

                    break;
                default :

                    fa = +merchant_financing.founding_amount || parseFloat(merchant_financing.total_mouthly_credit_card_turnover);
                    atr = parseFloat(fa) + parseFloat((fa / 100 * merchant_financing.factoring_rate));
                    pa = ( parseFloat(fa) / parseInt(merchant_financing.acquiring_days_count) ) / 100 * parseInt(merchant_financing.avl_proc_dly_withdraw_rate);
                    pc = Math.ceil(atr / pa);
                    avl_proc_dly_withdraw_rate_calculated = pa * parseInt(merchant_financing.acquiring_days_count) * 100/ fa;

                    break;

            }

            //params.founding_amount =        parseFloat(fa).toFixed(2);
            //params.amount_to_return =       parseFloat(atr).toFixed(2);
            //params.payment_amount =         parseFloat(pa).toFixed(2);
            //params.payments_count =         parseInt(pc);

            params.founding_amount =        Math.ceil(fa);
            params.amount_to_return =       Math.ceil(atr);
            params.payment_amount =         Math.ceil(pa);
            params.payments_count =         parseInt(pc);

            //if (avl_proc_dly_withdraw_rate_calculated) params.avl_proc_dly_withdraw_rate_calculated = parseFloat(avl_proc_dly_withdraw_rate_calculated).toFixed(2);
            if (avl_proc_dly_withdraw_rate_calculated) params.avl_proc_dly_withdraw_rate_calculated = Math.round(parseFloat(avl_proc_dly_withdraw_rate_calculated)*100)/100;

            params.id = id;

            async.series([
                function (cb) {
                    console.log('MODIFY MERCHANT_FINANCING',params);
                    _t.modify(params, cb);
                },
                function (cb) {
                    // запишем лог
                    var o = {
                        merchant_financing_id: id,
                        history_log_status_sysname: 'RECALC'
                    };
                    for (var i in merchant_financing) {
                        if (typeof o[i] !== 'undefined') continue;
                        o[i] = merchant_financing[i];
                    }
                    _t.addHistory(o, cb);
                }
            ], cb);
        }
    }, function (err, res) {
        if (err) {
            if (err instanceof UserError) return cb(err);
            return cb(err);
        }
        cb(null, new UserOk('Пересчет успешно произведен'));
    })


};

Model.prototype.sendOffer = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id финансирования'));
    // Получить данные о финансировании мерчанте
    // Получить данные о мерче
    // подготовить шаблон письма (в дальнейшем .doc)
    // Отравить на емайл
    // Поменять статус
    // Записать лог
    var rollback_key = obj.rollback_key || rollback.create();
    var tpl = '';
    var merchant, merchant_financing;
    async.series({
        getMerchantFinancing: function (cb) {
            // Получить данные о финансировании мерчанта
            _t.getById({id: id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найдено финансировани.', {id: id}));
                merchant_financing = res[0];
                cb(null);
            });
        },
        getMerchant: function (cb) {
            // Получить данные о мерчанте
            var o = {
                command:'get',
                object:'merchant',
                params:{
                    collapseData:false,
                    param_where:{
                        id:merchant_financing.merchant_id
                    }
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найден такой торговец.',{id:id}));
                merchant = res[0];
                if (!merchant.email) return cb(new UserError('У торговца не указан email.'));
                cb(null);
            });
        },
        check: function (cb) {
            if (!merchant_financing.amount_to_return) return cb(new UserError('Необходмо пересчитать финансирование.'));
            cb(null);
        },
        prepareTemplate: function (cb) {
            switch (merchant_financing.financing_type_sysname){
                case "PERCENT":
                    fs.readFile('./templates/PERCENT_offer.html', function (err, data) {
                        if (err) return cb(new MyError('Не удалось считать файл шаблона.', err));
                        tpl = data.toString();

                        var m_obj = {
                            founding_amount: merchant_financing.founding_amount,
                            amount_to_return: merchant_financing.amount_to_return,
                            payments_count: merchant_financing.payments_count,
                            payment_amount: merchant_financing.payment_amount,
                            factoring_rate: merchant_financing.factoring_rate,
                            fio: merchant_financing.fio
                        };

                        tpl = mustache.to_html(tpl, m_obj);

                        cb(null);

                    });
                    break;
                default:
                    fs.readFile('./templates/offer.html', function (err, data) {
                        if (err) return cb(new MyError('Не удалось считать файл шаблона.', err));
                        tpl = data.toString();

                        var m_obj = {
                            founding_amount: merchant_financing.founding_amount,
                            amount_to_return: merchant_financing.amount_to_return,
                            payments_count: merchant_financing.payments_count,
                            payment_amount: merchant_financing.payment_amount,
                            factoring_rate: merchant_financing.factoring_rate,
                            fio: merchant_financing.fio
                        };

                        tpl = mustache.to_html(tpl, m_obj);

                        cb(null);

                    });
                    break;
            }
        },
        sendToEmail: function (cb) {
            // Отравить на емайл
            if (obj.without_sending) return cb(null); // Все договорено по телефону
            sendMail({email: merchant.email, subject: 'Финансирование Вашего бизнеса', html: tpl}, function (err, info) {
                if (err) return cb(new UserError('Не удалось отправить email', {err: err, info: info}));
                cb(null);
            });
        },
        changeStatus: function (cb) {
            // Поменять статус
            _t.setStatus({
                id: id,
                status: 'OFFER_SENDED',
                rollback_key:rollback_key
            }, function (err) {
                if (err) return cb(new UserError('Предложение отправлено. Но не удалось изменить статус финансирования торговца. Обратитесь к администратору.', {err: err}));
                cb(null);
            });
        },
        addLog: function (cb) {
            // Записать лог
            var o = {
                history_log_status_sysname: 'OFFER_SENDED',
                rollback_key:rollback_key
            };
            for (var i in merchant_financing) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant_financing[i];
            }
            _t.addHistory(o, cb);
        }
    }, function (err, res) {
        //if (err) return cb(err);
        //cb(null, new UserOk('Предложение успешно отправлено'));
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
                return cb(err, err2);
            });
        }else{
            rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'sendOffer', params:obj});
            cb(null, new UserOk('Предложение успешно отправлено'));
        }
    });
};

Model.prototype.denyOffer = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id финансирования'));
    if (!obj.merchant_financing_deny_reason_id) return cb(new UserError('Не указана причина отказа.'));
    if (!obj.comment) return cb(new UserError('Комментарий обязательно должен быть указан.'));
    var rollback_key = obj.rollback_key || rollback.create();
    // Получить данные о финансировании
    // Поменять статус
    // Записать лог
    var merchant_financing;
    async.series({
        getMerchantFinancing: function (cb) {
            // Получить данные о финансировании
            _t.getById({id: id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найдено финансированиие.', {id: id}));
                merchant_financing = res[0];
                if (merchant_financing.status_sysname !== 'OFFER_SENDED') return cb(new UserError('Заявка должна быть отправлена торговцу.'));
                cb(null);
            });
        },
        changeStatus: function (cb) {
            // Поменять статус
            _t.setStatus({
                id: id,
                status: 'OFFER_DECLINED',
                rollback_key:rollback_key
            }, function (err) {
                if (err) return cb(new UserError('Не удалось отклонить заявку. Обратитесь к администратору.', {err: err}));
                cb(err);
            });
        },
        addLog: function (cb) {
            // Записать лог
            var o = {
                id: id,
                history_log_status_sysname: 'OFFER_DECLINED',
                rollback_key:rollback_key
            };
            for (var i in merchant_financing) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant_financing[i];
            }
            o.merchant_financing_deny_reason_id = obj.merchant_financing_deny_reason_id;
            o.comment = obj.comment;
            _t.addHistory(o, cb);
        }
    }, function (err, res) {
        //if (err) {
        //    // Поменять статус обратно
        //    _t.setStatus({
        //        id: id,
        //        status: merchant_financing.status_sysname || 'OFFER_SENDED'
        //    }, function (err2) {
        //        if (err2) console.log(err2);
        //        return cb(err);
        //    });
        //} else {
        //    cb(null, new UserOk('Предложение успешно отклонено'));
        //}
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
                return cb(err, err2);
            });
        }else{
            rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'denyOffer', params:obj});
            cb(null, new UserOk('Предложение успешно отклонено'));
        }

    })
};

Model.prototype.acceptOffer = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id финансирования'));
    // Получить данные о мерчанте
    // Поменять статус
    // Записать лог
    var rollback_key = obj.rollback_key || rollback.create();
    var merchant_financing;
    async.series({
        getMerchantFinancing: function (cb) {
            // Получить данные о финансировании
            _t.getById({id: id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найдено финансирование.', {id: id}));
                merchant_financing = res[0];
                if (merchant_financing.status_sysname !== 'OFFER_SENDED') return cb(new UserError('Заявка должна быть отправлена торговцу.'));
                cb(null);
            });
        },
        changeStatus: function (cb) {
            // Поменять статус
            _t.setStatus({
                id: id,
                status: 'OFFER_ACCEPTED',
                rollback_key:rollback_key
            }, function (err) {
                if (err) return cb(new UserError('Не удалось принять заявку. Обратитесь к администратору.', {err: err}));
                cb(err);
            });
        },
        addLog: function (cb) {
            // Записать лог
            var o = {
                id: id,
                history_log_status_sysname: 'OFFER_ACCEPTED',
                rollback_key:rollback_key
            };
            for (var i in merchant_financing) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant_financing[i];
            }
            _t.addHistory(o, cb);
        }
    }, function (err, res) {
        //if (err) {
        //    // Поменять статус обратно
        //    _t.setStatus({
        //        id: id,
        //        status: merchant_financing.status_sysname || 'OFFER_SENDED'
        //    }, function (err2) {
        //        if (err2) console.log(err2);
        //        return cb(err);
        //    });
        //} else {
        //    cb(null, new UserOk('Предложение успешно принято'));
        //}
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
                return cb(err, err2);
            });
        }else{
            rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'acceptOffer', params:obj});
            cb(null, new UserOk('Предложение успешно принято'));
        }

    })
};

Model.prototype.requestDocuments = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id финансирования'));
    // Получить данные о мерчанте
    // подготовить шаблон письма (в дальнейшем .doc)
    // Отравить на емайл
    // Поменять статус
    // Записать лог
    var rollback_key = obj.rollback_key || rollback.create();
    var tpl = '';
    var merchant, merchant_financing;
    var docs;
    var docNames = [];
    async.series({
        getMerchantFinancing: function (cb) {
            // Получить данные о финансировании мерчанта
            _t.getById({id: id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найдено финансировани.', {id: id}));
                merchant_financing = res[0];
                cb(null);
            });
        },
        getMerchant: function (cb) {
            // Получить данные о мерчанте
            var o = {
                command:'get',
                object:'merchant',
                params:{
                    collapseData:false,
                    param_where:{
                        id:merchant_financing.merchant_id
                    }
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найден такой торговец.',{id:id}));
                merchant = res[0];
                if (!merchant.email) return cb(new UserError('У торговца не указан email.'));
                cb(null);
            });
        },
        getDocs: function (cb) {
            var o = {
                command: 'get',
                object: 'Merchant_financing_document',
                params: {
                    collapseData: false,
                    where: [
                        {
                            key: 'merchant_financing_id',
                            val1: merchant_financing.id
                        },
                        {
                            key: 'status_sysname',
                            val1: 'CREATED'
                        }
                    ]
                }
            };

            _t.api(o, function (err, res) {

                if (err) return cb(new MyError('Не удалось получить документы финансирования.', {
                    err: err,
                    merchant_financing_id: merchant_financing.id,
                    params: o.params
                }));
                docs = res;
                cb(null);
            });
        },
        prepareTemplate: function (cb) {
            fs.readFile('./templates/request_docs.html', function (err, data) {
                if (err) return cb(new MyError('Не удалось считать файл шаблона.', err));
                tpl = data.toString();

                var m_obj = {
                    founding_amount: merchant_financing.founding_amount,
                    amount_to_return: merchant_financing.amount_to_return,
                    payments_count: merchant_financing.payments_count,
                    payment_amount: merchant_financing.payment_amount,
                    factoring_rate: merchant_financing.factoring_rate,
                    fio: merchant.fio,
                    docs: []
                };

                for (var i in docs) {
                    m_obj.docs.push({
                        title: docs[i].document_name
                    });
                    docNames.push(docs[i].document_name);
                }

                tpl = mustache.to_html(tpl, m_obj);

                cb(null);

            });

        },
        sendToEmail: function (cb) {
            // Отравить на емайл
            if (obj.without_sending) return cb(null); // Все договорено по телефону
            sendMail({email: merchant.email, subject: 'VG Financing: Запрос документов', html: tpl}, function (err, info) {
                if (err) return cb(new UserError('Не удалось отправить email', {err: err, info: info}));
                cb(null);
            });
        },
        changeStatus: function (cb) {
            // Поменять статус
            _t.setStatus({
                id: id,
                status: 'DOCS_REQUESTED',
                rollback_key:rollback_key
            }, function (err) {
                if (err) return cb(new UserError('Предложение отправлено. Но не удалось изменить статус финансирования. Обратитесь к администратору.', {err: err}));
                cb(null);
            });
        },
        updateDocsStatuses: function (cb) {
            // Проставить документам статусы
            async.eachSeries(docs, function (item, cb) {
                var o = {
                    command: 'modify',
                    object: 'Merchant_financing_document',
                    params: {
                        id: item.id,
                        status_sysname: 'REQUESTED',
                        rollback_key:rollback_key
                    }
                };

                _t.api(o, cb);

            }, cb);
        },
        addLog: function (cb) {
            // Записать лог
            var o = {
                id: id,
                history_log_status_sysname: 'DOCS_REQUESTED',
                rollback_key:rollback_key
            };
            for (var i in merchant_financing) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant_financing[i];
            }

            o.comment = docNames.join(', ');

            _t.addHistory(o, cb);
        }
    }, function (err, res) {
        //if (err) return cb(err);
        //cb(null, new UserOk('Предложение успешно отправлено'));
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
                return cb(err, err2);
            });
        }else{
            rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'requestDocuments', params:obj});
            cb(null, new UserOk('Документы запрошены'));
        }
    });
};


Model.prototype.testDoc = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    //Load the docx file as a binary
    fs.readFile('./templates/test.docx', function (err, data) {
        if (err) return cb(new MyError('Не удалось считать файл шаблона догово.', err));
        //var tpl = data.toString();
        var doc = new Docxtemplater(data);

        //set the templateVariables
        doc.setData({
            "company_agent":'ООО "Мир Билета"',
            "agent_fio":"Гоптарева Ивана Ивановича",
            "company_subagent":'ООО "Мир Билетов"',
            "subagent_fio":"Гоптарева Александра Ивановича"
        });

        //apply them (replace all occurences of {first_name} by Hipp, ...)
        doc.render();

        var buf = doc.getZip()
            .generate({type:"nodebuffer"});

        fs.writeFile('./templates/testOutput.docx',buf, function (err) {
            if (err) return cb(new MyError('Не удалось записать файл договора',{err:err}));
            return cb(null, new UserOk('Договор успешно сформирован'));
        });
    });
};

Model.prototype.prepareAgreement = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    //var agreement_date = obj.agreement_date;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id финансирования'));
    //if (!funcs.validation.isDate(agreement_date)) return cb(new UserError('Неверно указана дата договора.'));
    var confirm = obj.confirm;
    var confirmKey = obj.confirmKey;
    var rollback_key = obj.rollback_key || rollback.create();
    var agreement_date = obj.agreement_date;
    var agreement_number = obj.agreement_number;
    // Проверим статус финансирования ( он должен быть OFFER_ACCEPTED/DOCS_REQUESTED/DOCS_RECIEVED)
    // Проверим существование записи документа с типом ДОГОВОР (если есть то перезапишем после Confirm)
    // Соберем необходимые данные запросим подтверждение
    // Если чего то не хватает формируем как есть и предупреждаем
    // Подготовим файл договора на основе шаблона и данных собранных ранее
    // Создаем запись документа с типом договор (или берем существующую)
    // Сохраняем его в serverUploads и вызываем File add (как будто пользователь нажал 'загрузить файл"
    // Скачиваем файл

    //supplementary_agreement.docx

    var merchant, merchant_financing;
    var main_agreement_doc, main_agreement_doc_id, main_agreement_scan, main_agreement_scan_id;
    var agreement_supplementary_doc, agreement_supplementary_doc_id, agreement_supplementary_scan, agreement_supplementary_scan_id;
    var main_agreement_tmp_filename = Guid.create().value;
    var agreement_supplementary_tmp_filename = Guid.create().value;
    var f = '';
    var i = '';
    var o = '';
    async.series({
        getMerchantFinancing: function (cb) {
            // Получить данные о финансировании мерчанта
            // Проверим статус финансирования ( он должен быть OFFER_ACCEPTED/DOCS_REQUESTED/DOCS_RECIEVED)
            _t.getById({id: id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найдено финансировани.', {id: id}));
                merchant_financing = res[0];
                if (['OFFER_ACCEPTED','DOCS_REQUESTED','DOCS_RECIEVED','AGREEMENT_CREATED','AGREEMENT_SENT','AGREEMENT_UPLOADED'].indexOf(merchant_financing.status_sysname)==-1){
                    var statuses = ['Предложение одобрено','Документы запрошены','Документы получены','Договор сформирован','Договор отправлен','Договор загружен'].join(', ');
                    return cb(new UserError('Финансирование должно быть в одном из следующих статусов: ' + statuses, {
                        id:id,
                        status:merchant_financing.status
                    }));
                }
                cb(null);
            });
        },
        checkDocRecord: function (cb) {
            // Проверим существование записи документа с типом ДОГОВОР (если есть то перезапишем после Confirm)
            var o = {
                command:'get',
                object:'merchant_financing_document',
                params:{
                    param_where:{
                        document_sysname:'MAIN_AGREEMENT_DOC',
                        merchant_financing_id:id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить информацию по документам финансирования.',{o:o,err:err}));
                if (!res.length) return cb(null); // Договор и скан еще не были сформированы, можно идти дальше
                if (res.length > 1) return cb(new UserError('Слишком много договоров загружено, удалите неиспользуемые.')); // Такая ситуация может быть только если договор добавили вручную
                main_agreement_doc = res[0];
                main_agreement_doc_id = res[0].id;
                if (!confirm || (confirmKey != 1 && confirmKey != 2)) {
                    return cb(new UserError('needConfirm', {message: 'Договор уже был создан. В случае продолжения он будут перезаписан!"',title:'Перезаписать файл договора?',key:1, confirmType:'dialog'}));
                }
                return cb(null);
            });
        },
        checkScanRecord: function (cb) {
            // Проверим существование записи документа с типом ДОГОВОР(СКАН)
            var o = {
                command:'get',
                object:'merchant_financing_document',
                params:{
                    param_where:{
                        document_sysname:'MAIN_AGREEMENT_PDF',
                        merchant_financing_id:id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить информацию по скану договора финансирования.',{o:o,err:err}));
                if (!res.length) return cb(null); // Cкан еще не были сформированы, можно идти дальше
                if (res.length > 1) return cb(new UserError('Слишком много сканов загружено, удалите неиспользуемые.')); // Такая ситуация может быть только если договор добавили вручную
                main_agreement_scan = res[0];
                main_agreement_scan_id = res[0].id;
                return cb(null);
            });
        },
        checkDocRecordSupplementary: function (cb) {
            // Проверим существование записи документа с типом ДОПНИКА (если есть то перезапишем после Confirm)
            var o = {
                command:'get',
                object:'merchant_financing_document',
                params:{
                    param_where:{
                        document_sysname:'SUPPLEMENTARY_AGREEMENT_DOC',
                        merchant_financing_id:id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить информацию по документам финансирования.',{o:o,err:err}));
                if (!res.length) return cb(null); // Договор и скан еще не были сформированы, можно идти дальше
                if (res.length > 1) return cb(new UserError('Слишком много допников загружено, удалите неиспользуемые.')); // Такая ситуация может быть только если договор добавили вручную
                agreement_supplementary_doc = res[0];
                agreement_supplementary_doc_id = res[0].id;
                if (!confirm || (confirmKey != 2)) {
                    return cb(new UserError('needConfirm', {message: 'Дополнительное соглашение уже было создано. В случае продолжения оно будет перезаписано!"',title:'Перезаписать файл дополнительного соглашения?',key:2, confirmType:'dialog'}));
                }
                return cb(null);
            });
        },
        checkScanRecordSupplementary: function (cb) {
            // Проверим существование записи документа с типом ДОПНИКА(СКАН)
            var o = {
                command:'get',
                object:'merchant_financing_document',
                params:{
                    param_where:{
                        document_sysname:'SUPPLEMENTARY_AGREEMENT_PDF',
                        merchant_financing_id:id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить информацию по скану допника финансирования.',{o:o,err:err}));
                if (!res.length) return cb(null); // Cкан еще не были сформированы, можно идти дальше
                if (res.length > 1) return cb(new UserError('Слишком много сканов загружено, удалите неиспользуемые.')); // Такая ситуация может быть только если договор добавили вручную
                agreement_supplementary_scan = res[0];
                agreement_supplementary_scan_id = res[0].id;
                return cb(null);
            });
        },
        getMerchant: function (cb) {
            // Получить данные о мерчанте
            var o = {
                command:'get',
                object:'merchant',
                params:{
                    collapseData:false,
                    param_where:{
                        id:merchant_financing.merchant_id
                    }
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найден такой торговец.',{id:id}));
                merchant = res[0];
                cb(null);
            });
        },
        //getDataAndValidate: function (cb) {
        //    // merchant: name, executive_fio, grounds_on, email
        //    // financing: founding_amount, amount_to_return, payments_count, payment_amount, factoring_rate
        //
        //}

        addScanRow: function (cb) {
            // Создаем запись скана документа, ели есть оставим как есть
            if (main_agreement_scan_id) return cb(null);
            async.waterfall([
                function (cb) {
                    // Получим document_id
                    var o = {
                        command: 'get',
                        object: 'document',
                        params: {
                            param_where:{
                                sysname:'MAIN_AGREEMENT_PDF'
                            },
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить документ с типом MAIN_AGREEMENT_PDF',{err:err}));
                        if (!res.length) return cb(new UserError('Не удалось найти документ с типом MAIN_AGREEMENT_PDF - Основной договор (скан). Заведите такой документ в справочнике.'));
                        if (res.length > 1) return cb(new UserError('Слишком много документов с типом MAIN_AGREEMENT_PDF - Основной договор (скан). Удалите лишние.'));
                        cb(null, res[0].id);
                    });
                },
                function (document_id, cb) {
                    var o = {
                        command: 'add',
                        object: 'merchant_financing_document',
                        params: {
                            merchant_financing_id: id,
                            document_id: document_id
                        }
                    };
                    o.params.rollback_key = rollback_key;
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось добавить документ "Основной договор (скан)" для данного финансирования.', {
                            err: err,
                            merchant_financing_id: id,
                            document_id: document_id
                        }));
                        main_agreement_scan_id = res.id;
                        cb(null);
                    })
                }
            ], cb);
        },
        addDocRow: function (cb) {
            // Создаем запись документа с типом договор (или берем существующую)
            if (main_agreement_doc) return cb(null);
            async.waterfall([
                function (cb) {
                    // Получим document_id
                    var o = {
                        command: 'get',
                        object: 'document',
                        params: {
                            param_where:{
                                sysname:'MAIN_AGREEMENT_DOC'
                            },
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить документ с типом MAIN_AGREEMENT_DOC',{err:err}));
                        if (!res.length) return cb(new UserError('Не удалось найти документ с типом MAIN_AGREEMENT_DOC - Основной договор (скан). Заведите такой документ в справочнике.'));
                        if (res.length > 1) return cb(new UserError('Слишком много документов с типом MAIN_AGREEMENT_DOC - Основной договор (скан). Удалите лишние.'));
                        cb(null, res[0].id);
                    });
                },
                function (document_id, cb) {
                    var o = {
                        command: 'add',
                        object: 'merchant_financing_document',
                        params: {
                            merchant_financing_id: id,
                            document_number:agreement_number,
                            document_id: document_id
                        }
                    };
                    o.params.rollback_key = rollback_key;
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось добавить документ "Основной договор" для данного финансирования.', {
                            err: err,
                            merchant_financing_id: id,
                            document_id: document_id
                        }));
                        main_agreement_doc_id = res.id;
                        cb(null);
                    })
                }
            ], cb);
        },
        addScanRowSupplementary: function (cb) {
            // Создаем запись скана допника, ели есть оставим как есть
            if (agreement_supplementary_scan_id) return cb(null);
            async.waterfall([
                function (cb) {
                    // Получим document_id
                    var o = {
                        command: 'get',
                        object: 'document',
                        params: {
                            param_where:{
                                sysname:'SUPPLEMENTARY_AGREEMENT_PDF'
                            },
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить документ с типом SUPPLEMENTARY_AGREEMENT_PDF',{err:err}));
                        if (!res.length) return cb(new UserError('Не удалось найти документ с типом SUPPLEMENTARY_AGREEMENT_PDF - Допник (скан). Заведите такой документ в справочнике.'));
                        if (res.length > 1) return cb(new UserError('Слишком много документов с типом SUPPLEMENTARY_AGREEMENT_PDF - Допник (скан). Удалите лишние.'));
                        cb(null, res[0].id);
                    });
                },
                function (document_id, cb) {
                    var o = {
                        command: 'add',
                        object: 'merchant_financing_document',
                        params: {
                            merchant_financing_id: id,
                            document_id: document_id
                        }
                    };
                    o.params.rollback_key = rollback_key;
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось добавить документ "Допник (скан)" для данного финансирования.', {
                            err: err,
                            merchant_financing_id: id,
                            document_id: document_id
                        }));
                        agreement_supplementary_scan_id = res.id;
                        cb(null);
                    })
                }
            ], cb);
        },
        addDocRowSupplementary: function (cb) {
            // Создаем запись документа с типом допник (или берем существующую)
            if (agreement_supplementary_doc) return cb(null);
            async.waterfall([
                function (cb) {
                    // Получим document_id
                    var o = {
                        command: 'get',
                        object: 'document',
                        params: {
                            param_where:{
                                sysname:'SUPPLEMENTARY_AGREEMENT_DOC'
                            },
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить документ с типом SUPPLEMENTARY_AGREEMENT_DOC',{err:err}));
                        if (!res.length) return cb(new UserError('Не удалось найти документ с типом SUPPLEMENTARY_AGREEMENT_DOC - Допник (скан). Заведите такой документ в справочнике.'));
                        if (res.length > 1) return cb(new UserError('Слишком много документов с типом SUPPLEMENTARY_AGREEMENT_DOC - Допник (скан). Удалите лишние.'));
                        cb(null, res[0].id);
                    });
                },
                function (document_id, cb) {
                    var o = {
                        command: 'add',
                        object: 'merchant_financing_document',
                        params: {
                            merchant_financing_id: id,
                            document_id: document_id
                        }
                    };
                    o.params.rollback_key = rollback_key;
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось добавить документ "Допник" для данного финансирования.', {
                            err: err,
                            merchant_financing_id: id,
                            document_id: document_id
                        }));
                        agreement_supplementary_doc_id = res.id;
                        cb(null);
                    })
                }
            ], cb);
        },
        getDocIfHaveNot: function (cb) {
            // Запросим документ договора если он был только что добавлен
            if (main_agreement_doc) return cb(null);
            var o = {
                command:'get',
                object:'merchant_financing_document',
                params:{
                    param_where:{
                        id:main_agreement_doc_id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить информацию по документам финансирования.',{o:o,err:err}));
                if (!res.length) return cb(new UserError('Не удалось получить запись Основного договора.'));
                main_agreement_doc = res[0];
                return cb(null);
            });
        },
        getDocSupplementaryIfHaveNot: function (cb) {
            // Запросим документ Допника если он был только что добавлен
            if (main_agreement_doc) return cb(null);
            var o = {
                command:'get',
                object:'merchant_financing_document',
                params:{
                    param_where:{
                        id:agreement_supplementary_doc_id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить информацию по документам финансирования.',{o:o,err:err}));
                if (!res.length) return cb(new UserError('Не удалось получить запись Дополнительного соглашения.'));
                agreement_supplementary_doc = res[0];
                return cb(null);
            });
        },
        createDoc: function (cb) {
            // Подготовим файл договора на основе шаблона и данных собранных ранее
            if (obj.skip) return cb(null);
            switch (merchant_financing.financing_type_sysname){
                case "PERCENT":
                    fs.readFile('./templates/PERCENT_main_agreement.docx', function (err, data) {
                        if (err) return cb(new MyError('Не удалось считать файл шаблона договора.', err));
                        var doc = new Docxtemplater(data);
                        if (!merchant.executive_fio.length) return cb(new UserError('Необходимо указать ФИО в карточке торговца.'));
                        var fio = merchant.executive_fio.match(/\S+/ig);
                        if (fio.length==3) {
                            var gender = petrovich.detect_gender(fio[2]);
                            if (gender == 'androgynous') gender = 'male';
                            var f = petrovich[gender].first.genitive(fio[0]);
                            var i = petrovich[gender].last.genitive(fio[1]);
                            var o = petrovich[gender].middle.genitive(fio[2]);
                        }

                        var fio_str = f + ' ' + i + ' ' + o;

                        doc.setData({
                            "ccs_agreement_number":agreement_number || '_________',
                            "ccs_agreement_date":agreement_date || '«___»__________2016 г',
                            "ccs_name":merchant.name || '',
                            "ccs_executive_fio":fio_str || '_______________________________',
                            "ccs_grounds_on":merchant.grounds_on || '___________________',
                            "ccs_founding_amount":merchant_financing.founding_amount || '___________________',
                            "ccs_amount_to_return":merchant_financing.amount_to_return || '___________________',
                            "ccs_payments_count":merchant_financing.payments_count || '___________________',
                            "ccs_payment_amount":merchant_financing.payment_amount || '___________________',
                            "ccs_factoring_rate":merchant_financing.factoring_rate || '___________________'
                        });
                        doc.render();
                        var buf = doc.getZip().generate({type:"nodebuffer"});
                        fs.writeFile('./serverUploads/'+ main_agreement_tmp_filename +'.docx',buf, function (err) {
                            if (err) return cb(new MyError('Не удалось записать файл договора',{err:err}));
                            return cb(null);
                        });
                    });
                    break;
                default:
                    fs.readFile('./templates/main_agreement.docx', function (err, data) {
                        if (err) return cb(new MyError('Не удалось считать файл шаблона договора.', err));
                        var doc = new Docxtemplater(data);
                        if (!merchant.executive_fio.length) return cb(new UserError('Необходимо указать ФИО в карточке торговца.'));
                        var fio = merchant.executive_fio.match(/\S+/ig);
                        if (fio.length==3) {
                            var gender = petrovich.detect_gender(fio[2]);
                            if (gender == 'androgynous') gender = 'male';
                            var f = petrovich[gender].first.genitive(fio[0]);
                            var i = petrovich[gender].last.genitive(fio[1]);
                            var o = petrovich[gender].middle.genitive(fio[2]);
                        }
                        var fio_str = f + ' ' + i + ' ' + o;

                        doc.setData({
                            "ccs_agreement_number":agreement_number || '_________',
                            "ccs_agreement_date":agreement_date || '«___»__________2016 г',
                            "ccs_name":merchant.name || '',
                            "ccs_executive_fio":fio_str || '_______________________________',
                            "ccs_grounds_on":merchant.grounds_on || '___________________',
                            "ccs_founding_amount":merchant_financing.founding_amount || '___________________',
                            "ccs_amount_to_return":merchant_financing.amount_to_return || '___________________',
                            "ccs_payments_count":merchant_financing.payments_count || '___________________',
                            "ccs_payment_amount":merchant_financing.payment_amount || '___________________',
                            "ccs_factoring_rate":merchant_financing.factoring_rate || '___________________'
                        });
                        doc.render();
                        var buf = doc.getZip().generate({type:"nodebuffer"});
                        fs.writeFile('./serverUploads/'+ main_agreement_tmp_filename +'.docx',buf, function (err) {
                            if (err) return cb(new MyError('Не удалось записать файл договора',{err:err}));
                            return cb(null);
                        });
                    });
                    break;
            }
        },
        createDocSupplementary: function (cb) {
            // Подготовим файл допника на основе шаблона и данных собранных ранее
            if (obj.skip) return cb(null);
            switch (merchant_financing.financing_type_sysname){
                case "PERCENT":
                    fs.readFile('./templates/PERCENT_supplementary_agreement.docx', function (err, data) {
                        if (err) return cb(new MyError('Не удалось считать файл шаблона допника.', err));
                        var doc = new Docxtemplater(data);
                        if (!merchant.executive_fio.length) return cb(new UserError('Необходимо указать ФИО в карточке торговца.'));
                        var fio = merchant.executive_fio.match(/\S+/ig);
                        if (fio.length==3) {
                            var gender = petrovich.detect_gender(fio[2]);
                            if (gender == 'androgynous') gender = 'male';
                            var f = petrovich[gender].first.genitive(fio[0]);
                            var i = petrovich[gender].last.genitive(fio[1]);
                            var o = petrovich[gender].middle.genitive(fio[2]);
                        }
                        var fio_str = f + ' ' + i + ' ' + o;

                        doc.setData({
                            "ccs_name":merchant.name || '',
                            "ccs_executive_fio":fio_str || '_______________________________',
                            "ccs_grounds_on":merchant.grounds_on || '___________________',
                            "ccs_founding_amount":merchant_financing.founding_amount || '___________________',
                            "ccs_amount_to_return":merchant_financing.amount_to_return || '___________________',
                            "ccs_payments_count":merchant_financing.payments_count || '___________________',
                            "ccs_payment_amount":merchant_financing.payment_amount || '___________________',
                            "ccs_factoring_rate":merchant_financing.factoring_rate || '___________________'
                        });
                        doc.render();
                        var buf = doc.getZip().generate({type:"nodebuffer"});
                        fs.writeFile('./serverUploads/'+ agreement_supplementary_tmp_filename +'.docx',buf, function (err) {
                            if (err) return cb(new MyError('Не удалось записать файл допника',{err:err}));
                            return cb(null);
                        });
                    });
                    break;
                default:
                    fs.readFile('./templates/supplementary_agreement.docx', function (err, data) {
                        if (err) return cb(new MyError('Не удалось считать файл шаблона допника.', err));
                        var doc = new Docxtemplater(data);
                        if (!merchant.executive_fio.length) return cb(new UserError('Необходимо указать ФИО в карточке торговца.'));
                        var fio = merchant.executive_fio.match(/\S+/ig);
                        if (fio.length==3) {
                            var gender = petrovich.detect_gender(fio[2]);
                            if (gender == 'androgynous') gender = 'male';
                            var f = petrovich[gender].first.genitive(fio[0]);
                            var i = petrovich[gender].last.genitive(fio[1]);
                            var o = petrovich[gender].middle.genitive(fio[2]);
                        }
                        var fio_str = f + ' ' + i + ' ' + o;

                        doc.setData({
                            "ccs_name":merchant.name || '',
                            "ccs_executive_fio":fio_str || '_______________________________',
                            "ccs_grounds_on":merchant.grounds_on || '___________________',
                            "ccs_founding_amount":merchant_financing.founding_amount || '___________________',
                            "ccs_amount_to_return":merchant_financing.amount_to_return || '___________________',
                            "ccs_payments_count":merchant_financing.payments_count || '___________________',
                            "ccs_payment_amount":merchant_financing.payment_amount || '___________________',
                            "ccs_factoring_rate":merchant_financing.factoring_rate || '___________________'
                        });
                        doc.render();
                        var buf = doc.getZip().generate({type:"nodebuffer"});
                        fs.writeFile('./serverUploads/'+ agreement_supplementary_tmp_filename +'.docx',buf, function (err) {
                            if (err) return cb(new MyError('Не удалось записать файл допника',{err:err}));
                            return cb(null);
                        });
                    });
                    break;
            }

        },
        uploadDoc: function (cb) {
            if (obj.skip) return cb(null);
            var o = {
                command: "uploadDocument",
                object: "Merchant_financing_document",
                params: {
                    filename: main_agreement_tmp_filename+'.docx',
                    id: main_agreement_doc_id
                }
            };
            _t.api(o, cb);
        },
        uploadDocSupplementary: function (cb) {
            if (obj.skip) return cb(null);
            var o = {
                command: "uploadDocument",
                object: "Merchant_financing_document",
                params: {
                    filename: agreement_supplementary_tmp_filename + '.docx',
                    id: agreement_supplementary_doc_id
                }
            };
            _t.api(o, cb);
        },
        updateFinancing: function (cb) {
            if (!agreement_number && !agreement_date) return cb(null);
            var params = {
                id:id,
                rollback_key: rollback_key
            };
            if (agreement_number) params.agreement_number = agreement_number;
            if (agreement_date) params.agreement_date = agreement_date;
            _t.modify(params, function (err) {
                if (err) return cb(err);
                cb(null);
            });
        },
        changeStatus: function (cb) {
            // Поменять статус
            _t.setStatus({
                id: id,
                status: 'AGREEMENT_CREATED'
            }, function (err) {
                if (err) return cb(new UserError('Договор сформирован. Но не удалось изменить статус финансирования. Обратитесь к администратору.', {err: err}));
                cb(null);
            });
        },
        addLog: function (cb) {
            // Записать лог
            var o = {
                id: id,
                history_log_status_sysname: 'AGREEMENT_CREATED'
            };
            for (var i in merchant_financing) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant_financing[i];
            }

            var merchInfo = [merchant.name, merchant.executive_fio, merchant.grounds_on];
            o.comment = merchInfo.join(', ');

            _t.addHistory(o, cb);
        }

    }, function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
                return cb(err, err2);
            });
        }else{
            if (!obj.skip){
                main_agreement_doc.file_id = res.uploadDoc[0].file_id;
            }
            rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'prepareAgreement', params:obj});
            cb(null, new UserOk('Договор был успешно сформирован.',{main_agreement_doc:main_agreement_doc}));
        }
    });


};

Model.prototype.sendAgreement = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id финансирования'));
    var rollback_key = obj.rollback_key || rollback.create();
    // Получить данные о мерчанте
    // Получить данные о финансировании
    // подготовить шаблон письма
    // Получить договор из документов
        // Загрузить запись документов
        // Получить инфу от файла
    // Отравить на емайл + attach
    // Поменять статус
    // Записать лог
    var tpl = '';
    var merchant, merchant_financing, main_agreement_doc, agreement_supplementary_doc, main_agreement_file, agreement_supplementary_file;
    var attachments = [];
    async.series({
        getMerchantFinancing: function (cb) {
            // Получить данные о финансировании мерчанта
            // Проверим статус финансирования ( он должен быть OFFER_ACCEPTED/DOCS_REQUESTED/DOCS_RECIEVED)
            _t.getById({id: id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найдено финансировани.', {id: id}));
                merchant_financing = res[0];
                if (['AGREEMENT_CREATED','AGREEMENT_SENT','AGREEMENT_UPLOADED'].indexOf(merchant_financing.status_sysname)==-1){
                    var statuses = ['Договор сформирован','Договор отправлен','Договор загружен'].join(', ');
                    return cb(new UserError('Финансирование должно быть в одном из следующих статусов: ' + statuses, {
                        id:id,
                        status:merchant_financing.status
                    }));
                }
                cb(null);
            });
        },
        getMerchant: function (cb) {
            // Получить данные о мерчанте
            var o = {
                command:'get',
                object:'merchant',
                params:{
                    collapseData:false,
                    param_where:{
                        id:merchant_financing.merchant_id
                    }
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найден такой торговец.',{id:id}));
                merchant = res[0];
                cb(null);
            });
        },
        prepareTemplate: function (cb) {
            fs.readFile('./templates/main_agreement.html', function (err, data) {
                if (err) return cb(new MyError('Не удалось считать файл шаблона.', err));
                tpl = data.toString();

                var m_obj = {
                    founding_amount: merchant.founding_amount,
                    amount_to_return: merchant.amount_to_return,
                    payments_count: merchant.payments_count,
                    payment_amount: merchant.payment_amount,
                    factoring_rate: merchant.factoring_rate,
                    fio: merchant.fio,
                    name: merchant.name,
                    docs: []
                };


                tpl = mustache.to_html(tpl, m_obj);

                cb(null);

            });

        },
        attachAgreements: function (cb) {
            if (obj.without_sending) return cb(null); // Все договорено по телефону
            // Получить договор из документов
            // Загрузить запись документов
            // Получить инфу от файла
            async.series([
                function (cb) {
                    // Загрузить запись документов
                    var o = {
                        command:'get',
                        object:'merchant_financing_document',
                        params:{
                            param_where:{
                                document_sysname:'MAIN_AGREEMENT_DOC',
                                status_sysname:'UPLOADED',
                                merchant_financing_id:id
                            },
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить информацию по договору финансирования.',{o:o,err:err}));
                        if (!res.length) return cb(new UserError('Договор еще не загружен.')); // Такая ситуация может быть только если договор добавили вручную
                        if (res.length > 1) return cb(new UserError('Слишком много договоров загружено, удалите неиспользуемые.')); // Такая ситуация может быть только если договор добавили вручную
                        main_agreement_doc = res[0];
                        return cb(null);
                    });
                },
                function (cb) {
                    // Получить инфу от файла
                    var o = {
                        command:'get',
                        object:'file',
                        params:{
                            param_where:{
                                id:main_agreement_doc.file_id
                            },
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить информацию по файлу договора.',{o:o,err:err}));
                        if (!res.length) return cb(new UserError('Файл договора еще не загружен.')); // Такая ситуация может быть только если договор добавили вручную
                        main_agreement_file = res[0];
                        return cb(null);
                    });
                },
                function (cb) {
                    // Загрузить запись допника
                    var o = {
                        command:'get',
                        object:'merchant_financing_document',
                        params:{
                            param_where:{
                                document_sysname:'SUPPLEMENTARY_AGREEMENT_DOC',
                                status_sysname:'UPLOADED',
                                merchant_financing_id:id
                            },
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить информацию по допнику финансирования.',{o:o,err:err}));
                        if (!res.length) return cb(new UserError('Дополнительное соглашение еще не загружено.')); // Такая ситуация может быть только если договор добавили вручную
                        if (res.length > 1) return cb(new UserError('Слишком много допников загружено, удалите неиспользуемые.')); // Такая ситуация может быть только если договор добавили вручную
                        agreement_supplementary_doc = res[0];
                        return cb(null);
                    });
                },
                function (cb) {
                    // Получить инфу от файла допника
                    var o = {
                        command:'get',
                        object:'file',
                        params:{
                            param_where:{
                                id:agreement_supplementary_doc.file_id
                            },
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить информацию по файлу допника.',{o:o,err:err}));
                        if (!res.length) return cb(new UserError('Файл Дополнительного соглашения еще не загружен.')); // Такая ситуация может быть только если договор добавили вручную
                        agreement_supplementary_file = res[0];
                        return cb(null);
                    });
                }
            ], function (err) {
                if (err) return cb(err);
                attachments = [
                    {   // file on disk as an attachment
                        filename: main_agreement_doc.document_name + main_agreement_file.extension,
                        path: main_agreement_file.filepath + main_agreement_file.filename + main_agreement_file.extension
                    },
                    {   // file on disk as an attachment
                        filename: agreement_supplementary_doc.document_name + agreement_supplementary_file.extension,
                        path: agreement_supplementary_file.filepath + agreement_supplementary_file.filename + agreement_supplementary_file.extension
                    }
                ];
                cb(null);
            });

        },
        sendToEmail: function (cb) {
            // Отравить на емайл
            if (obj.without_sending) return cb(null); // Все договорено по телефону
            sendMail({email: merchant.email, subject: 'VG Financing: Договор', html: tpl, attachments: attachments}, function (err, info) {
                if (err) return cb(new UserError('Не удалось отправить email', {err: err, info: info}));
                cb(null);
            });
        },
        changeStatus: function (cb) {
            // Поменять статус
            _t.setStatus({
                id: id,
                status: 'AGREEMENT_SENT',
                rollback_key:rollback_key
            }, function (err) {
                if (err) return cb(new UserError('Договор отправлен. Но не удалось изменить статус финансирования. Обратитесь к администратору.', {err: err}));
                cb(null);
            });
        },
        addLog: function (cb) {
            // Записать лог
            var o = {
                history_log_status_sysname: 'AGREEMENT_SENT',
                rollback_key:rollback_key
            };
            for (var i in merchant_financing) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant_financing[i];
            }

            _t.addHistory(o, cb);
        }
    }, function (err, res) {
        //if (err) return cb(err);
        //cb(null, new UserOk('Договор успешно отправлен'));
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
                return cb(err, err2);
            });
        }else{
            rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'sendAgreement', params:obj});
            cb(null, new UserOk('Договор успешно отправлен'));
        }
    });
};

Model.prototype.uploadMainAgreement = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    //var agreement_date = obj.agreement_date;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id торговца'));
    if (!obj.filename && !obj.skip) return cb(new UserError('Файл не указан'));
    var rollback_key = obj.rollback_key || rollback.create();

    // Получить данные о финансировании мерчанта
    // Получить id документа типа MAIN_AGREEMENT_PDF
    // загрузить ему файл
    // сменить статус
    // записать лог

    var merchant_financing, main_agreement_scan;
    async.series({
        getMerchantFinancing: function (cb) {
            // Получить данные о финансировании мерчанта
            _t.getById({id: id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найдено финансирование.', {id: id}));
                merchant_financing = res[0];
                if (['AGREEMENT_SENT','AGREEMENT_UPLOADED'].indexOf(merchant_financing.status_sysname)==-1){
                    var statuses = ['Договор отправлен','Договор загружен'].join(', ');
                    return cb(new UserError('Финансирование должно быть в одном из следующих статусов: ' + statuses, {
                        id:id,
                        status:merchant_financing.status
                    }));
                }
                cb(null);
            });
        },
        getScanDoc: function (cb) {
            if (obj.skip) return cb(null);
            var o = {
                command:'get',
                object:'merchant_financing_document',
                params:{
                    param_where:{
                        document_sysname:'MAIN_AGREEMENT_PDF',
                        merchant_financing_id:id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить информацию по скану договора финансирования.',{o:o,err:err}));
                if (!res.length) return cb(new UserError('Не удалось найти нужный документ')); // Такая ситуация может быть только если договор добавили вручную
                if (res.length > 1) return cb(new UserError('Слишком много записей сканов, удалите неиспользуемые.')); // Такая ситуация может быть только если договор добавили вручную
                main_agreement_scan = res[0];
                return cb(null);
            });
        },
        uploadScan: function (cb) {
            if (obj.skip) return cb(null);
            // загрузить ему файл
            var o = {
                command: "uploadDocument",
                object: "Merchant_financing_document",
                params: {
                    filename: obj.filename,
                    id: main_agreement_scan.id
                }
            };
            _t.api(o, cb);
        },
        //setAgreementDate: function (cb) {
        //    if (agreement_date === merchant_financing.agreement_date || !funcs.validation.isDate(agreement_date)) return cb(null);
        //    var params = {
        //        id:id,
        //        agreement_date:agreement_date,
        //        rollback_key:rollback_key
        //    };
        //    _t.modify(params, function (err, res) {
        //        if (err) return cb(new MyError('Не удалось установить дату договора', {
        //            err: err,
        //            merchant_financing_id: id,
        //            agreement_date: agreement_date
        //        }));
        //        merchant_financing.agreement_date = agreement_date;
        //        cb(null);
        //    })
        //},
        changeStatus: function (cb) {
            // Поменять статус
            _t.setStatus({
                id: id,
                status: 'AGREEMENT_UPLOADED'
            }, function (err) {
                if (err) return cb(new UserError('Не удалось изменить статус финансирования. Обратитесь к администратору.', {err: err}));
                cb(null);
            });
        },
        addLog: function (cb) {
            // Записать лог
            var o = {
                id: id,
                history_log_status_sysname: 'AGREEMENT_UPLOADED'
            };
            for (var i in merchant_financing) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant_financing[i];
            }
            o.comment = obj.filename;
            _t.addHistory(o, cb);
        }
    }, function (err) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
                return cb(err, err2);
            });
        }else{
            rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'uploadMainAgreement', params:obj});
            cb(null, new UserOk('Скан договора успешно загружен в систему'));
        }
    });
};

/**
 * AGREEMENT_UPLOADED --> WAIT_INVESTORS (Потом будет переведено в READY_TO_WORK, когда будет осущесвлена верстка плана)
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.transferToWork = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id финансирования'));
    var confirm = obj.confirm;
    var rollback_key = obj.rollback_key || rollback.create();

    // Получим данные по финансированию
    // Проверим статус
    // Смена статуса + лог

    var merchant_financing;
    async.series({
        getMerchantFinancing: function (cb) {
            // Получить данные о финансировании мерчанта
            _t.getById({id: id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найдено финансирование.', {id: id}));
                merchant_financing = res[0];
                cb(null);
            });
        },
        checkAnother: function (cb) {
            if (['AGREEMENT_UPLOADED'].indexOf(merchant_financing.status_sysname)==-1){
                var statuses = ['Договор загружен'].join(', ');
                return cb(new UserError('Финансирование должно быть в одном из следующих статусов: ' + statuses, {
                    id:id,
                    status:merchant_financing.status
                }));
            }
            cb(null);
        },
        changeStatus: function (cb) {
            // Поменять статус
            _t.setStatus({
                id: id,
                status: 'WAIT_INVESTORS'
            }, function (err) {
                if (err) return cb(new UserError('Не удалось изменить статус финансирования. Обратитесь к администратору.', {err: err}));
                cb(null);
            });
        },
        addLog: function (cb) {
            // Записать лог
            var o = {
                id: id,
                history_log_status_sysname: 'WAIT_INVESTORS'
            };
            for (var i in merchant_financing) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant_financing[i];
            }

            _t.addHistory(o, cb);
        }
    }, function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
                return cb(err, err2);
            });
        }else{
            rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'transferToWork', params:obj});
            cb(null, new UserOk('Финансирование переведено к работе. Осталось только отправить деньги и уведомить банк.'));
        }
    });
};

Model.prototype.financing_to_deployment = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id финансирования'));
    var confirm = obj.confirm;
    var rollback_key = obj.rollback_key || rollback.create();

    // Получим данные по финансированию
    // Проверим статус
    // Смена статуса + лог



    var merchant_financing;
    async.series({
        getMerchantFinancing: function (cb) {
            // Получить данные о финансировании мерчанта
            _t.getById({id: id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найдено финансирование.', {id: id}));
                merchant_financing = res[0];
                cb(null);
            });
        },
        changeStatus: function (cb) {
            // Поменять статус
            _t.setStatus({
                id: id,
                status: 'WAIT_INVESTORS'
            }, function (err) {
                if (err) return cb(new UserError('Не удалось изменить статус финансирования. Обратитесь к администратору.', {err: err}));
                cb(null);
            });
        },
        setPaymentsStartDate: function (cb) {

            var o = {
                command: 'modifyPrototype',
                object: 'merchant_financing',
                params: {
                    id: id,
                    payments_start_date: obj.payments_start_date
                }
            };

            _t.api(o, function (err, res) {
                if(err) {
                    if(err.message != 'notModified'){
                        return cb(new UserError('Не удалось изменить дату начала платежей', {o:o, err:err}))
                    }

                }

                cb(null);
            });
        },
        addLog: function (cb) {
            // Записать лог
            var o = {
                id: id,
                history_log_status_sysname: 'WAIT_INVESTORS'
            };
            for (var i in merchant_financing) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant_financing[i];
            }

            _t.addHistory(o, cb);
        }
    }, function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
                return cb(err, err2);
            });
        }else{
            rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'transferToWork', params:obj});
            cb(null, new UserOk('Финансирование переведено в распределение.'));
        }
    });
};

/**
 * READY_TO_WORK --> WAIT_BANK_CONFIRM
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.notifyBank = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id'));
    var rollback_key = obj.rollback_key || rollback.create();

    // Загрузить финансирование
    // Получим банк
    // сделать проверки (статусы)
    // проверим банк
    // Запросить emails для главной компании (VG)
    // Запросить email банка
    // Подготовить шаблон
    // Установить финансированию bank_notified
    // Разослать уведомления
    // Проверяем состояние "Банк уведомлен" и "Деньги отправлены" если и то и другое, выставляем статус WAIT_BANK_CONFIRM
    // Сменить статус
    // Записать лог

    var merchant_financing, merchant, bank, main_company, main_company_emails, bank_emails, tpl;
    var emails_to_notify = [];
    var invalid_emails = [];

    async.series({
        getMerchantFinancing: function (cb) {
            // Получить данные о мерчанте
            _t.getById({id: id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найдено финансирование.', {id: id}));
                merchant_financing = res[0];
                cb(null);
            });
        },
        getMerchantData: function (cb) {
            // Получить данные по мерчу (чтобы использовать его поля)
            var o = {
                command: 'getById',
                object: 'merchant',
                params: {
                    id: merchant_financing.merchant_id
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить информацию по торговцу', {
                    err: err,
                    merchant_id: merchant_financing.merchant_id
                }));
                if (!res.length) return cb(new MyError('Не удалось найти такого торговца', {
                    merchant_id: merchant_financing.merchant_id
                }));
                merchant = res[0];
                return cb(null);
            });
        },
        getBank: function (cb) {
            if (!merchant_financing.processing_bank_id) return cb(new UserError('У финансирования не указан банк (эквайер).'));
            var o = {
                command:'get',
                object:'bank',
                params:{
                    param_where:{
                        id:merchant_financing.processing_bank_id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить информацию по банку эквайеру.',{o:o,err:err}));
                if (!res.length) return cb(new UserError('Не удалось найти банк эквайер. Возможно он был удален. Смените торговцу банк на корректный.'));
                bank = res[0];
                return cb(null);
            });
        },
        check: function (cb) {
            // сделать проверки (статусы) READY_TO_WORK
            if (['READY_TO_WORK'].indexOf(merchant_financing.status_sysname)==-1){
                var statuses = ['Готов к работе'].join(', ');
                return cb(new UserError('Необходимо профинансировать! Зайдите в планы финансирования.', {
                    id:id,
                    status:merchant_financing.status
                }));
            }
            // Проверим банк на is_work
            if (!bank.is_work) return cb(new UserError('Указаный у торговца банк эквайер не является рабочим банком! Переведите торговца на эквайринг в банк, с которым у вас заключен договор.'));
            cb(null);
        },
        getMainCompanyEmails: function (cb) {
            // Запросить emails для главной компании (VG)
            var o = {
                command:'get',
                object:'company_sys',
                params:{
                    param_where:{
                        main_company:true
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить информацию по главной компании.',{err:err}));
                if (!res.length) return cb(new UserError('Не найдена главная компания. Зайдите в Компании и установите ей галочку главная. Также пропишите емайлы для оповещения'));
                if (res.length > 1) return cb(new UserError('Несколько компаний установлено как главная. Зайдите в Компании и установите галочку только для одной компании. Также пропишите емайлы для оповещения'));
                main_company = res[0];
                main_company_emails = main_company.notifications_emails.replace(/\s+/ig,'').split(',');
                var valid_emails = [];
                for (var i in main_company_emails) {
                    if (funcs.validation.email(main_company_emails[i])) valid_emails.push(main_company_emails[i]);
                    else invalid_emails.push(main_company_emails[i]);
                }
                main_company_emails = valid_emails;
                cb(null);
            })
        },
        getBankEmail: function (cb) {
            // Соберем emails банка
            bank_emails = bank.email.replace(/\s+/ig,'').split(',');
            var valid_emails = [];
            for (var i in bank_emails) {
                if (funcs.validation.email(bank_emails[i])) valid_emails.push(bank_emails[i]);
                else invalid_emails.push(bank_emails[i]);
            }
            bank_emails = valid_emails;
            cb(null);
        },
        prepareTemplate: function (cb) {
            switch (merchant_financing.financing_type_sysname){
                case "PERCENT":
                    fs.readFile('./templates/PERCENT_bank_notify.html', function (err, data) {
                        if (err) return cb(new MyError('Не удалось считать файл шаблона.', err));
                        tpl = data.toString();
                        cb(null);
                    });
                    break;
                default:
                    fs.readFile('./templates/bank_notify.html', function (err, data) {
                        if (err) return cb(new MyError('Не удалось считать файл шаблона.', err));
                        tpl = data.toString();
                        cb(null);
                    });
                    break;
            }


        },
        setBankNotified: function (cb) {
            // Установить финансированию bank_notified
            var params = {
                id:id,
                bank_notified:true
            };
            params.rollback_key = rollback_key;
            _t.modify(params, function (err) {
                if (err) return cb(new MyError('Финансированию не удалось установить информацию о том, что банк уведомлен',{err:err}));
                merchant_financing.bank_notified = true;
                cb(null);
            });
        },
        sendNotify: function (cb) {
            // Разослать уведомления
            if (obj.without_sending) return cb(null); // Все договорено по телефону
            emails_to_notify = main_company_emails.concat(bank_emails);
            async.eachSeries(emails_to_notify, function (item, cb) {
                var m_obj = {
                    name: merchant.executive_fio || '______________________________________________',
                    agreement_number: merchant_financing.agreement_number || '______',
                    agreement_sign_date: merchant_financing.agreement_date || '______'
                };
                tpl = mustache.to_html(tpl, m_obj);
                sendMail({email: item, subject: 'VG Financing: Новое финансирование', html: tpl}, function (err, info) {
                    if (err) return cb(new UserError('Не удалось отправить уведомление на email: ' + item, {err: err, info: info}));
                    cb(null);
                });
            },cb);

        },
        getAnotherInWork: function (cb) {
            var params = {
                where:[
                    {
                        key:'merchant_id',
                        val1:merchant_financing.merchant_id
                    },
                    {
                        key:'status_sysname',
                        type:'in',
                        val1:['WAIT_BANK_CONFIRM','BANK_CONFIRM','ACQUIRING_IN_PROCCESS']
                    }
                ],
                collapseData:false
            };

            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось проверить наличие финансирований в статусах "WAIT_BANK_CONFIRM","BANK_CONFIRM","ACQUIRING_IN_PROCCESS"',{err:err}));
                //if (res.length) return cb(new UserError('Уже есть финансирование в работе, подтвержденные банком или ожидающие подтверждения.'));
                cb(null);
            })
        },
        changeStatus: function (cb) {
            _t.setStatus({
                id: id,
                status: 'WAIT_BANK_CONFIRM',
                rollback_key:rollback_key
            }, function (err) {
                if (err) return cb(new MyError('Не удалось изменить статус финансирования. Обратитесь к администратору.', {err: err}));
                cb(null);
            });
        },
        addLog: function (cb) {
            // Записать лог
            var o = {
                id: id,
                history_log_status_sysname: 'WAIT_BANK_CONFIRM'
            };
            o.comment = emails_to_notify.join(', ');
            for (var i in merchant_financing) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant_financing[i];
            }
            _t.addHistory(o, cb);
        }
    }, function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
                return cb(err, err2);
            });
        }else{
            rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'notifyBank', params:obj});
            cb(null, new UserOk('Банк уведомлен'));
        }
    });
};

/**
 * WAIT_BANK_CONFIRM --> BANK_CONFIRM
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.bankConfirm = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    var payments_start_date = obj.payments_start_date;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id финансирования'));
    if (!funcs.validation.isDate(payments_start_date)) return cb(new UserError('Неверно указана дата начала платежей.'));
    var confirm = obj.confirm;
    var rollback_key = obj.rollback_key || rollback.create();

    // Получим данные по финансированию
    // Проверим статус
    // Установим payments_start_date
    // Смена статуса + лог

    var merchant_financing;
    async.series({
        getMerchantFinancing: function (cb) {
            // Получить данные о финансировании мерчанта
            _t.getById({id: id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найдено финансирование.', {id: id}));
                merchant_financing = res[0];
                cb(null);
            });
        },
        checkAnother: function (cb) {
            if (['WAIT_BANK_CONFIRM'].indexOf(merchant_financing.status_sysname)==-1){
                var statuses = ['Ожидает подтверждения банка'].join(', ');
                return cb(new UserError('Финансирование должно быть в одном из следующих статусов: ' + statuses, {
                    id:id,
                    status:merchant_financing.status
                }));
            }
            cb(null);
        },
        setPaymentStartDate: function (cb) {
            if (merchant_financing.payments_start_date === payments_start_date) return cb(null);
            var paymentsStartDate = funcs.getDateMySQL(payments_start_date);
            var params = {
                id: id,
                payments_start_date: paymentsStartDate
            };
            params.rollback_key = rollback_key;
            _t.modify(params, function (err) {
                if (err) return cb(new MyError('Не удалось установить дату старта платежей.',{err:err}));
                cb(null);
            })
        },
        changeStatus: function (cb) {
            // Поменять статус
            _t.setStatus({
                id: id,
                status: 'BANK_CONFIRM'
            }, function (err) {
                if (err) return cb(new UserError('Не удалось изменить статус финансирования. Обратитесь к администратору.', {err: err}));
                cb(null);
            });
        },
        addLog: function (cb) {
            // Записать лог
            var o = {
                id: id,
                history_log_status_sysname: 'BANK_CONFIRM'
            };
            for (var i in merchant_financing) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant_financing[i];
            }

            _t.addHistory(o, cb);
        }
    }, function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
                return cb(err, err2);
            });
        }else{
            rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'bankConfirm', params:obj});
            cb(null, new UserOk('Все готово! Осталось только отправить торговцу деньги.'));
        }
    });
};

/**
 * BANK_CONFIRM --> ACQUIRING_IN_PROCCESS
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.moneySentAndSetInWork = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    var filename = obj.filename;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id'));
    // if (!filename) return cb(new MyError('В метод не передан filename'));
    var rollback_key = obj.rollback_key || rollback.create();



    // Получаем финансирование
    // Проверяем статусы и прочее
    // Получаем информацию по документу (скан платежки) PAYMENT_TO_MERCHANT, если нет то создаем и получаем
    // делаем uploadDocument Merchant_financing_document
    // Установить финансированию money_sent
    // Создадим календарь
    // Загружаем календарь (платежи)
    // Подготавливаем график.xlsx
    // Отправляем его банку
    // Отправляем его клиенту
    // Переводим в работу
    // Пишем лог

    var merchant, merchant_financing, payment_to_merchant_doc;
    var calendar, calendar_id, payments;

    //if (isNaN(+id)) return cb(new MyError('В метод не передан id'));

    var readyData, template, binaryData, filenameXLS;
    var tplBank, tplMerch, attachments;
    var bank, bank_emails, invalid_emails;
    var broker_comission;
    var agent_comission = 0;
    async.series({
        getMerchantFinancing: function (cb) {
            // Получаем финансирование
            _t.getById({id: id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найдено финансирование.', {id: id}));
                merchant_financing = res[0];
                cb(null);
            });
        },
        getMerchantData: function (cb) {
            // Получить данные по мерчу (чтобы использовать его поля)
            var o = {
                command: 'getById',
                object: 'merchant',
                params: {
                    id: merchant_financing.merchant_id
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить информацию по торговцу', {
                    err: err,
                    merchant_id: merchant_financing.merchant_id
                }));
                if (!res.length) return cb(new MyError('Не удалось найти такого торговца', {
                    merchant_id: merchant_financing.merchant_id
                }));
                merchant = res[0];
                return cb(null);
            });
        },
        check: function (cb) {
            // Проверяем статусы и прочее
            if (['BANK_CONFIRM'].indexOf(merchant_financing.status_sysname)==-1){
                var statuses = ['Банк подтвердил'].join(', ');
                return cb(new UserError('Финансирование должно быть в одном из следующих статусов: ' + statuses, {
                    id:id,
                    status:merchant_financing.status
                }));
            }
            cb(null);
        },
        getDocumentInfo: function (cb) {
            // Получаем информацию по документу (скан платежки) PAYMENT_TO_MERCHANT, если нет то создаем и получаем
            var payment_to_merchant_doc_id;
            async.series([
                function (cb) {
                    // Получим документ
                    var o = {
                        command:'get',
                        object:'merchant_financing_document',
                        params:{
                            param_where:{
                                document_sysname:'PAYMENT_TO_MERCHANT',
                                merchant_financing_id:id
                            },
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить информацию по скан платежки финансирования.',{o:o,err:err}));
                        if (res.length > 1) return cb(new UserError('Слишком много записей сканов, удалите неиспользуемые.')); // Такая ситуация может быть только если скан добавили вручную
                        payment_to_merchant_doc = res[0];
                        return cb(null);
                    });
                },
                function (cb) {
                    // Проверим получили ли мы документ, если нет, то создадим
                    if (payment_to_merchant_doc) return cb(null); // Успешно загрузили (был создан ранее)
                    // Иначе будем создавать
                    async.waterfall([
                        function (cb) {
                            // Получим document_id
                            var o = {
                                command: 'get',
                                object: 'document',
                                params: {
                                    param_where:{
                                        sysname:'PAYMENT_TO_MERCHANT'
                                    },
                                    collapseData:false
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось получить документ с типом PAYMENT_TO_MERCHANT',{err:err}));
                                if (!res.length) return cb(new UserError('Не удалось найти документ с типом PAYMENT_TO_MERCHANT - "Платежный документ зачисление денег торговцу". Заведите такой документ в справочнике.'));
                                if (res.length > 1) return cb(new UserError('Слишком много документов с типом PAYMENT_TO_MERCHANT - "Платежный документ зачисление денег торговцу". Удалите лишние.'));
                                cb(null, res[0].id);
                            });
                        },
                        function (document_id, cb) {
                            var o = {
                                command: 'add',
                                object: 'merchant_financing_document',
                                params: {
                                    merchant_financing_id: id,
                                    document_id: document_id
                                }
                            };
                            o.params.rollback_key = rollback_key;
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось добавить документ "Платежный документ зачисление денег торговцу" для данного финансирования.', {
                                    err: err,
                                    merchant_financing_id: id,
                                    document_id: document_id
                                }));
                                payment_to_merchant_doc_id = res.id;
                                cb(null);
                            })
                        }
                    ], cb);
                },
                function (cb) {
                    // Если только что создали то загрузим
                    if (payment_to_merchant_doc) return cb(null);
                    // Получим документ После СОЗДАНИЯ
                    var o = {
                        command:'get',
                        object:'merchant_financing_document',
                        params:{
                            param_where:{
                                id:payment_to_merchant_doc_id
                            },
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить информацию по скан платежки финансирования.',{o:o,err:err}));
                        if (!res.length) return cb(new MyError('Не удалось загрузить нужный документ даже после его создания. Запись не найдена.'));
                        payment_to_merchant_doc = res[0];
                        return cb(null);
                    });
                }
            ], cb);
        },

        setMoneySent: function (cb) {
            // Установить финансированию money_sent
            var params = {
                id:id,
                money_sent:true,
                financing_date: moment().format('DD.MM.YYYY')
            };
            params.rollback_key = rollback_key;
            _t.modify(params, function (err) {
                if (err) return cb(new MyError('Финансированию не удалось установить информацию о том, что деньги отправлены',{err:err}));
                merchant_financing.money_sent = true;
                cb(null);
            });
        },
        setRefinancingAmount: function (cb) {
            // Установить сумму реинвестирования
            if (!merchant_financing.closing_financing_id) return cb(null);
            if (merchant_financing.refinancing_amount == obj.refinancing_amount) return cb(null);
            var params = {
                id:id,
                refinancing_amount:obj.refinancing_amount
            };
            params.rollback_key = rollback_key;
            _t.modify(params, function (err) {
                if (err) return cb(new MyError('Финансированию не удалось установить Сумму реинвестирования',{err:err}));
                cb(null);
            });
        },
        setLeadType: function (cb) {
            // Установить тип лида
            if (!obj.lead_type_sysname) return cb(null);
            var params = {
                id:id,
                lead_type_sysname:obj.lead_type_sysname
            };
            params.rollback_key = rollback_key;
            _t.modify(params, function (err) {
                if (err) return cb(new MyError('Финансированию не удалось установить Тип Лида',{err:err}));
                merchant_financing.lead_type_sysname = obj.lead_type_sysname;
                cb(null);
            });
        },
        createCalendar: function (cb) {
            var payments_start_date = merchant_financing.payments_start_date;
            if (!funcs.validation.isDate(payments_start_date)) return cb(new UserError('Неверно указана дата начала платежей.',{merchant_financing:merchant_financing}));
            var o = {
                command:'createCalendar',
                object:'merchant_financing_calendar',
                params:{
                    fromClient:false,
                    payments_start_date:payments_start_date,
                    merchant_financing_id:id,
                    financing_type_id:merchant_financing.financing_type_id,
                    confirm:obj.confirm
                }
            };
            o.params.rollback_key = rollback_key;
            _t.api(o, function (err, res) {
                if (err) return cb(err);
                if (+res.code) return cb(res);
                calendar_id = res.calendar_id;
                cb(err, null);
            })
        },
        uploadDocument: function (cb) {
            // делаем uploadDocument Merchant_financing_document
            if (!filename) return cb(null);
            var o = {
                command: "uploadDocument",
                object: "Merchant_financing_document",
                params: {
                    filename: filename,
                    id: payment_to_merchant_doc.id
                }
            };
            o.params.rollback_key = rollback_key;
            _t.api(o, function (err) {
                if (err) return cb(new MyError('Не удалось загрузить скан платежки',{err:err, o:o}));
                cb(null);
            });
        },
        getBrokerComission: function(cb){

            var dbFloat_factoring_rate = merchant_financing.factoring_rate.toFixed(2).replace('.',',');

            var o = {
                command: 'get',
                object: 'broker_comission_percent',
                params: {
                    param_where: {
                        factoring_rate: dbFloat_factoring_rate
                    },
                    collapseData: false
                }
            };

            _t.api(o, function(err,res){

                if(err) return cb(err);

                if(!res.length) return cb(new UserError('Для такой ставки факторинга не указана комиссия брокера', {o:o,res:res}));

                if(merchant_financing.lead_type_sysname == 'EXT_LEAD'){

                    broker_comission = +res[0].ext_sale_percent;
                    agent_comission = +res[0].agent_percent;

                }else if(merchant_financing.lead_type_sysname == 'OWN_LEAD'){

                    broker_comission = +res[0].own_sale_percent;

                }else{

                    return cb(new UserError('У финансирования не указан тип поступления лида'));

                }

                cb(null);

            });

        },
        setBrockerComission:function(cb){
            var params = {
                id:merchant_financing.id,
                broker_comission:broker_comission,
                agent_comission:agent_comission,
                rollback_key:rollback_key
            };
            _t.modify(params, function(err){
                if (err){
                    if (err.message == 'notModified') {
                        console.log(err);
                        return cb(null);
                    }
                    return cb(err);
                }
                cb(null);
            });
        },
        generateCalendarAttache: function (cb) {
            if (merchant_financing.financing_type_sysname!='FIXED') return cb(null);
            async.series({
                getCalendar: function (cb) {
                    // Загружаем календарь
                    if (!calendar_id) return cb(new MyError('Календарь не получен id'));
                    var o = {
                        command:'get',
                        object:'merchant_financing_calendar',
                        params:{
                            param_where:{
                                id:calendar_id
                            },
                            fromClient:false,
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(err);
                        calendar = res[0];
                        cb(err, null);
                    })
                },
                getPayments: function (cb) {
                    // Загружаем календарь (платежи)
                    if (!calendar_id) return cb(new MyError('Календарь не получен'));
                    var o = {
                        command:'get',
                        object:'merchant_financing_payment',
                        params:{
                            param_where:{
                                calendar_id:calendar_id
                            },
                            sort:'payment_date DESC',
                            fromClient:false,
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(err);
                        payments = res;
                        if (!payments.length) return cb(new UserError('Не было создано не одного платежа. Вероятно, Вы забыли рассчитать финансирование.'));
                        cb(err, null);
                    });
                },
                prepareData0: function (cb) {
                    readyData = {
                        founding_amount: merchant_financing.founding_amount,
                        factoring_rate: merchant_financing.factoring_rate,
                        payments_count: calendar.payments_count,
                        start_date: calendar.payments_start_date,
                        finish_date: payments[payments.length-1].payment_date,
                        payment_amount: merchant_financing.payment_amount,
                        payment: []
                    };
                    cb(null);
                },
                prepareData1: function (cb) {
                    // Пайменты
                    for (var i in payments) {
                        readyData.payment.push({
                            order:i,
                            date:payments[i].payment_date || '-',
                            amount:payments[i].pending_amount || 0
                        });
                    }
                    cb(null);
                },
                getTemplate: function (cb) {
                    fs.readFile('./templates/grafic.xlsx', function (err, data) {
                        if (err) return cb(new MyError('Не удалось считать файл шаблона grafic.xlsx.', err));
                        template = new XlsxTemplate(data);
                        cb(null);
                    });
                },
                perform: function (cb) {
                    var sheetNumber = 1;
                    try {
                        template.substitute(sheetNumber, readyData);
                    } catch (e) {
                        console.log(e);
                        return cb(new MyError('Шаблон составлен не верно.',{e:e}));
                    }
                    var dataBuf = template.generate();
                    binaryData = new Buffer(dataBuf, 'binary');
                    cb(null);
                },
                //writeFile: function (cb) {
                //    fs.writeFile('./public/savedFiles/test111.xlsx',binaryData, function (err) {
                //        if (err) return cb(new MyError('Не удалось записать файл testOutput.xlsx',{err:err}));
                //        return cb(null, new UserOk('testOutput.xlsx успешно сформирован'));
                //    });
                //},
                attachAgreements: function (cb) {
                    attachments = [
                        {   // file on disk as an attachment
                            filename: 'График платежей.xlsx',
                            content: binaryData
                        }
                    ];
                    cb(null);
                }
            },cb);
        },

        prepareTemplateMerch: function (cb) {
            fs.readFile('./templates/merchant_send_calendar.html', function (err, data) {
                if (err) return cb(new MyError('Не удалось считать файл шаблона.', err));
                tplMerch = data.toString();

                var m_obj = {
                    agreement_number: merchant_financing.agreement_number || '______',
                    agreement_sign_date: merchant_financing.agreement_date || '______'
                };
                tplMerch = mustache.to_html(tplMerch, m_obj);
                cb(null);
            });
        },
        prepareTemplateBank: function (cb) {
            fs.readFile('./templates/bank_send_calendar.html', function (err, data) {
                if (err) return cb(new MyError('Не удалось считать файл шаблона.', err));
                tplBank = data.toString();

                var m_obj = {
                    agreement_number: merchant_financing.agreement_number || '______',
                    agreement_sign_date: merchant_financing.agreement_date || '______'
                };
                tplBank = mustache.to_html(tplBank, m_obj);
                cb(null);
            });
        },
        getBank: function (cb) {
            if (!merchant_financing.processing_bank_id) return cb(new UserError('У финансирования не указан банк (эквайер).'));
            var o = {
                command:'get',
                object:'bank',
                params:{
                    param_where:{
                        id:merchant_financing.processing_bank_id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить информацию по банку эквайеру.',{o:o,err:err}));
                if (!res.length) return cb(new UserError('Не удалось найти банк эквайер. Возможно он был удален. Смените торговцу банк на корректный.'));
                bank = res[0];
                return cb(null);
            });
        },
        getBankEmail: function (cb) {
            // Соберем emails банка
            bank_emails = bank.email.replace(/\s+/ig,'').split(',');
            var valid_emails = [];
            for (var i in bank_emails) {
                if (funcs.validation.email(bank_emails[i])) valid_emails.push(bank_emails[i]);
                else invalid_emails.push(bank_emails[i]);
            }
            bank_emails = valid_emails;
            cb(null);
        },
        sendEmailToBank: function (cb) {
            // Отравить на емайл
            if (obj.without_sending) return cb(null); // Все договорено по телефону
            async.eachSeries(bank_emails, function (item, cb) {
                sendMail({email: item, subject: 'VG Financing: Договор №: '+ merchant_financing.agreement_number +'. Календарь платежей', html: tplBank, attachments: attachments}, function (err, info) {
                    if (err) return cb(new UserError('Не удалось отправить email ' + item, {err: err, info: info}));
                    cb(null);
                });
            },cb);
        },
        sendEmailToMerch: function (cb) {
            // Отравить на емайл
            if (obj.without_sending) return cb(null); // Все договорено по телефону
            sendMail({email: merchant.email, subject: 'VG Financing: Договор №: '+ merchant_financing.agreement_number +'. Календарь платежей', html: tplMerch, attachments: attachments}, function (err, info) {
                if (err) return cb(new UserError('Не удалось отправить email торговцу ' + merchant.email, {err: err, info: info}));
                cb(null);
            });
        },
        setStatistic: function (cb) {
            var o = {
                command:'setStatisticInfo',
                object:'merchant_financing_calendar',
                params:{
                    id:calendar_id,
                    rollback_key:rollback_key
                }
            };
            _t.api(o, cb);
        },
        //TEMP: function (cb) {
        //   cb(new UserError('Тестовая ошибка'));
        //},
        changeStatus: function (cb) {
            // Поменять статус
            _t.setStatus({
                id: id,
                status: 'ACQUIRING_IN_PROCCESS',
                rollback_key:rollback_key
            }, function (err) {
                if (err) return cb(new UserError('Не удалось изменить статус финансирования. Обратитесь к администратору.', {err: err}));
                cb(null);
            });
        },
        addLog: function (cb) {
            // Записать лог
            var o = {
                id: id,
                history_log_status_sysname: 'ACQUIRING_IN_PROCCESS',
                rollback_key:rollback_key
            };
            o.comment = 'Деньги отправлены. Скан платежки: ' + (filename || 'Не загружен');
            for (var i in merchant_financing) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant_financing[i];
            }
            _t.addHistory(o, cb);
        }
    }, function (err) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
                return cb(err, err2);
            });
        }else{
            if (!obj.doNotSaveRollback){
                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'moneySentAndSetInWork', params:obj});
            }

            cb(null, new UserOk('Деньги отправлены. Финансирование в работе!'));
        }
    })
};


// notifyBank - > bank_confirm - > acquiring_in_proccess
/**
 * READY_TO_WORK --> WAIT_BANK_CONFIRM
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.ready_to_work_to_work = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    var payments_start_date = obj.payments_start_date;

    if (isNaN(+id)) return cb(new MyError('В метод не передан id'));
    // if (!filename) return cb(new MyError('В метод не передан filename'));
    var rollback_key = obj.rollback_key || rollback.create();


    async.series({

        notify: function (cb) {
            var params = {
                id:obj.id,
                rollback_key:rollback_key,
                doNotSaveRollback:true
            };
            _t.notifyBank(params,cb);

        },
        bankConfirm: function (cb) {
            var params = {
                id:obj.id,
                payments_start_date: obj.payments_start_date,
                rollback_key:rollback_key,
                doNotSaveRollback:true
            };
            _t.bankConfirm(params,cb);

        },
        acquiring_in_proccess: function (cb) {
            var params = {
                id:obj.id,
                rollback_key:rollback_key,
                doNotSaveRollback:true
            };
            _t.moneySentAndSetInWork(params, cb);

        }
    }, function (err) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
                return cb(err, err2);
            });
        }else{
            if (!obj.doNotSaveRollback){
                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'ready_to_work_to_work', params:obj});
            }

            cb(null, new UserOk('Деньги отправлены. Финансирование в работе!'));
        }
    });

};


//Model.prototype.setInWork = function (obj, cb) {
//    if (arguments.length == 1) {
//        cb = arguments[0];
//        obj = {};
//    }
//    var _t = this;
//    var id = obj.id;
//    var payments_start_date = obj.payments_start_date;
//    if (isNaN(+id)) return cb(new MyError('В метод не передан id'));
//    if (!funcs.validation.isDate(payments_start_date)) return cb(new UserError('Неверно указана дата начала платежей.'));
//    var rollback_key = obj.rollback_key || rollback.create();
//
//    // Получим финансирование
//    // Проверяем статусы и прочее
//    // Выставляем статус WAIT_BANK_CONFIRM
//    // Пишем лог
//
//    var merchant_financing, calendar;
//    async.series({
//        getMerchantFinancing: function (cb) {
//            // Получаем финансирование
//            _t.getById({id: id}, function (err, res) {
//                if (err) return cb(err);
//                if (!res.length) return cb(new MyError('Не найдено финансирование.', {id: id}));
//                merchant_financing = res[0];
//                cb(null);
//            });
//        },
//        check: function (cb) {
//            // Проверяем статусы и прочее
//                if (['WAIT_BANK_CONFIRM'].indexOf(merchant_financing.status_sysname)==-1){
//                var statuses = ['Ожидает подтверждения банка'].join(', ');
//                return cb(new UserError('Финансирование должно быть в одном из следующих статусов: ' + statuses, {
//                    id:id,
//                    status:merchant_financing.status
//                }));
//            }
//            cb(null);
//        },
//        changeStatus: function (cb) {
//            _t.setStatus({
//                id: id,
//                status: 'ACQUIRING_IN_PROCCESS',
//                rollback_key:rollback_key
//            }, function (err) {
//                if (err) return cb(new MyError('Не удалось изменить статус финансирования. Обратитесь к администратору.', {err: err}));
//                cb(null);
//            });
//        },
//        addLog: function (cb) {
//            // Записать лог
//            var o = {
//                id: id,
//                history_log_status_sysname: 'ACQUIRING_IN_PROCCESS'
//            };
//            for (var i in merchant_financing) {
//                if (typeof o[i] !== 'undefined') continue;
//                o[i] = merchant_financing[i];
//            }
//            _t.addHistory(o, cb);
//        }
//    }, function (err) {
//        if (err) {
//            if (err.message == 'needConfirm') return cb(err);
//            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
//                return cb(err, err2);
//            });
//        }else{
//            cb(null, new UserOk('Деньги отправлены'));
//        }
//    })
//};

Model.prototype.testXLSX = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;

    //var o = {
    //    command:'testXLSX',
    //    object:'merchant_financing'
    //};
    //socketQuery(o, function (err, res) {
    //    console.log(err, res);
    //});

    //Load the docx file as a binary
    fs.readFile('./templates/test.xlsx', function (err, data) {
        if (err) return cb(new MyError('Не удалось считать файл шаблона test.xlsx.', err));
        //var tpl = data.toString();

        // Create a template
        var template = new XlsxTemplate(data);

        // Replacements take place on first sheet
        var sheetNumber = 1;

        // Set up some placeholder values matching the placeholders in the template
        //var values = {
        //    extractDate: new Date(),
        //    dates: [ new Date("2013-06-01"), new Date("2013-06-02"), new Date("2013-06-03") ],
        //    people: [
        //        {name: "John Smith", age: 20},
        //        {name: "Bob Johnson", age: 22}
        //    ]
        //};
        var values = {
            extractDate: new Date(),
            dates: [ new Date("2013-06-01"), new Date("2013-06-02"), new Date("2013-06-03") ],
            people: [
                {name: "John Smith", age: 20},
                {name: "Bob Johnson", age: 22}
            ]
        };

        //Perform substitution/
        template.substitute(sheetNumber, values);

        // Get binary data
        var dataBuf = template.generate();
        var binaryData = new Buffer(dataBuf, 'binary');



        //
        //var doc = new Docxtemplater(data);
        //
        ////set the templateVariables
        //doc.setData({
        //    "company_agent":'ООО "Мир Билета"',
        //    "agent_fio":"Гоптарева Ивана Ивановича",
        //    "company_subagent":'ООО "Мир Билетов"',
        //    "subagent_fio":"Гоптарева Александра Ивановича"
        //});
        //
        ////apply them (replace all occurences of {first_name} by Hipp, ...)
        //doc.render();
        //
        //var buf = doc.getZip()
        //    .generate({type:"nodebuffer"});
        //
        //attachments = [
        //    {   // file on disk as an attachment
        //        filename: 'test.xlsx',
        //        content: dataBuf
        //    }
        //];
        //sendMail({email: 'ivantgco@gmail.com', html: '123', attachments: attachments}, function (err, info) {
        //    if (err) return cb(new UserError('Не удалось отправить email', {err: err, info: info}));
        //    cb(null);
        //});

        fs.writeFile('./templates/testOutput.xlsx',binaryData, function (err) {
            if (err) return cb(new MyError('Не удалось записать файл testOutput.xlsx',{err:err}));
            return cb(null, new UserOk('testOutput.xlsx успешно сформирован'));
        }, 'binary');
    });
};

/**
 * Закрывает финансирование одним из методов сПроцессинга/переводНаСчет/рефинансирование/дефолт
 * Закрывает все неотмеченные и пропущенные платежи указаной датой с соответствующим типом
 * Закрывает каллендарь соответствующим типом
 * Закрывает финансирование
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.closeFinancing = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    var financing_closing_type_id = obj.closing_type_id; // Тип закрытия финансирования
    var financing_close_type_sysname = obj.closing_type_sysname; // Тип закрытия финансирования
    if (isNaN(+id)) return cb(new MyError('В метод не передан id'));
    if (isNaN(+financing_closing_type_id) && !financing_close_type_sysname) return cb(new MyError('В метод не передан closing_type_id или financing_close_type_sysname'));
    if (obj.fromClient) return cb(new UserError('Метод устаревший. Используйте Ежедневные платежи'));
    var rollback_key = obj.rollback_key || rollback.create();

    // Получим и Залочим календарь и финансирование

    var closing_date = obj.operation_date;
    if (!funcs.validation.isDate(closing_date)) return cb(new MyError('Не корректно передана дата.',{closing_date:closing_date}));

    /*Классы*/
    var calendar_class;

    var merchant_financing, calendar, payment_close_type, financing_close_type;
    var no_closing_payment;
    async.series({
        get: function (cb) {
            _t.getById({id:id}, function (err, res) {
                if (err) return err;
                if (!res.length) return cb(new MyError('Финансирование не найдено.'));
                merchant_financing = res[0];
                cb(null);
            })
        },
        lock: function (cb) {
            //merchant_financing.lock_key = _t.lock(id);
            // var stack = new Error().stack;
            // console.log('STACKERR', obj);
            // console.log(stack );
            _t.lock({id:id,lock_key:obj.lock_key}, function (err, res) {
                if (err) return cb(err);
                merchant_financing.lock_key = res;
                console.log('LOCKKKK +++>',{id:id, lock_key:merchant_financing.lock_key});
                cb(null);
            });
        },
        check: function (cb) {
            // проверим статусы
            if (merchant_financing.status_sysname!=='ACQUIRING_IN_PROCCESS') return cb(new UserError('Финансирование должно быть в статусе "В работе"',{status:merchant_financing.status_sysname,merchant_financing:merchant_financing}));
            cb(null);
        },
        getCalendar: function (cb) {
            if (!merchant_financing.current_calendar_id) return cb(new MyError('Не удалось найти активный календарь.'));
            var o = {
                command:'getById',
                object:'Merchant_financing_calendar',
                params:{
                    id:merchant_financing.current_calendar_id
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить календарь',{o : o, err : err}));
                calendar = res[0];
                cb(null);
            });

        },
        lockCalendar: function (cb) {
            var o = {
                command:'lock',
                object:'Merchant_financing_calendar',
                params:{
                    id:calendar.id
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось залочить запись календаря',{o : o, err : err}));
                calendar.lock_key = res;
                cb(null);
            });
        },
        check2: function (cb) {
            // проверим статусы
            if (calendar.status_sysname!=='IN_WORK') return cb(new UserError('Календарь должно быть в статусе "В работе"',{status:calendar.status_sysname,calendar:calendar}));
            cb(null);
        },
        // getClosingTypeSysnameForFinancing: function (cb) {
        //     var o = {
        //         command:'get',
        //         object:'financing_close_type',
        //         params:{
        //             param_where:{
        //                 id:financing_closing_type_id
        //             },
        //             collapseData:false
        //         }
        //     };
        //     if (financing_close_type_sysname) {
        //         o.params.param_where = {
        //             sysname:financing_close_type_sysname
        //         };
        //     }
        //     _t.api(o, function (err, res) {
        //         if (err) return cb(err);
        //         if (!res.length) return cb(new MyError('financing_close_type не найден.'));
        //         if (res.length > 1) return cb(new MyError('financing_close_type слишком много.'));
        //         financing_close_type = res[0];
        //         financing_close_type_sysname = financing_close_type.sysname;
        //         if (financing_close_type_sysname == 'REFINANCE' && !!obj.fromClient) return cb(new UserError('Для рефинансирования используйте специальную кнопку.'));
        //         cb(null);
        //     });
        // },
        // getNoClosingPayments: function (cb) {
        //
        //     // switch (merchant_financing.financing_type_sysname){
        //     //     case "PERCENT":
        //     //         return cb(null);
        //     //         break;
        //     //     default:
        //     //         var o = {
        //     //             command:'get',
        //     //             object:'merchant_financing_payment',
        //     //             params:{
        //     //                 where:[
        //     //                     {
        //     //                         key:'calendar_id',
        //     //                         val1:calendar.id
        //     //                     },
        //     //                     {
        //     //                         key:'closing_type_id',
        //     //                         type:'isNull'
        //     //                     },
        //     //                     {
        //     //                         key:'status_sysname',
        //     //                         type:'<>',
        //     //                         val1:'MOVED_TO_END'
        //     //                     }
        //     //                 ],
        //     //                 collapseData:false,
        //     //                 sort: {
        //     //                     columns: 'payment_date',
        //     //                     direction: 'ASC'
        //     //                 }
        //     //             }
        //     //         };
        //     //         _t.api(o, function (err, res) {
        //     //             if (err) return cb(err);
        //     //             no_closing_payment = res;
        //     //             cb(null);
        //     //         });
        //     //         break;
        //     // }
        //
        //     var o = {
        //         command:'get',
        //         object:'merchant_financing_payment',
        //         params:{
        //             where:[
        //                 {
        //                     key:'calendar_id',
        //                     val1:calendar.id
        //                 },
        //                 {
        //                     key:'closing_type_id',
        //                     type:'isNull'
        //                 },
        //                 {
        //                     key:'status_sysname',
        //                     type:'<>',
        //                     val1:'MOVED_TO_END'
        //                 }
        //             ],
        //             collapseData:false,
        //             sort: {
        //                 columns: 'payment_date',
        //                 direction: 'ASC'
        //             }
        //         }
        //     };
        //     _t.api(o, function (err, res) {
        //         if (err) return cb(err);
        //         no_closing_payment = res;
        //         cb(null);
        //     });
        // },
        // getClosingTypeSysnameForPayment: function (cb) {
        //     var o = {
        //         command:'get',
        //         object:'payment_close_type',
        //         params:{
        //             param_where:{
        //                 sysname:financing_close_type_sysname
        //             },
        //             collapseData:false
        //         }
        //     };
        //     _t.api(o, function (err, res) {
        //         if (err) return cb(err);
        //         if (!res.length) return cb(new MyError('payment_close_type не найден.'));
        //         if (res.length > 1) return cb(new MyError('payment_close_type слишком много.'));
        //         payment_close_type = res[0];
        //         cb(null);
        //     });
        // },
        // closePayments: function (cb) {
        //     // Если тип DEFAULT, то makeDefault иначе makePayment ---> передаем тип закрытия и дату
        //     // switch (merchant_financing.financing_type_sysname){
        //     //     case "PERCENT":
        //     //         if (merchant_financing.to_return <= 0) return cb(null);
        //     //         var cmd = 'makePaymentPERCENT';
        //     //         switch (financing_close_type_sysname){
        //     //             case 'DEFAULT':
        //     //                 cmd = 'makeDefaultPERCENT';
        //     //                 break;
        //     //             default:
        //     //                 break;
        //     //         }
        //     //         var o = {
        //     //             command:cmd,
        //     //             object:'merchant_financing_payment',
        //     //             params:{
        //     //                 payment_date: closing_date,
        //     //                 calendar_id:calendar.id,
        //     //                 paid_amount: merchant_financing.to_return,
        //     //                 closing_type_id:payment_close_type.id,
        //     //                 fromClient:false,
        //     //                 financing_lock_key:merchant_financing.lock_key,
        //     //                 calendar_lock_key:calendar.lock_key,
        //     //                 doNotSetStatistic:true,
        //     //                 doNotSaveRollback:true
        //     //             }
        //     //         };
        //     //         o.params.rollback_key = rollback_key;
        //     //         _t.api(o, function (err, res) {
        //     //             if (err) return cb(new MyError('Не удалось закрыть платеж.',{err:err, o:o}));
        //     //             cb(null);
        //     //         });
        //     //         break;
        //     //     default:
        //     //         var payments_count = no_closing_payment.length;
        //     //         var counter = 0;
        //     //         if (!payments_count) return cb(null);
        //     //         async.eachSeries(no_closing_payment, function (item, cb) {
        //     //             var cmd = 'makePayment';
        //     //             switch (financing_close_type_sysname){
        //     //                 case 'DEFAULT':
        //     //                     cmd = 'makeDefault';
        //     //                     break;
        //     //                 default:
        //     //                     break;
        //     //             }
        //     //             var o = {
        //     //                 command:cmd,
        //     //                 object:'merchant_financing_payment',
        //     //                 params:{
        //     //                     id:item.id,
        //     //                     payment_date:closing_date,
        //     //                     closing_type_id:payment_close_type.id,
        //     //                     fromClient:false,
        //     //                     financing_lock_key:merchant_financing.lock_key,
        //     //                     calendar_lock_key:calendar.lock_key,
        //     //                     doNotSetStatistic:true,
        //     //                     doNotSaveRollback:true
        //     //                 }
        //     //             };
        //     //             o.params.rollback_key = rollback_key;
        //     //             _t.api(o, function (err, res) {
        //     //                 counter++;
        //     //                 var percent = Math.ceil(counter * 100 / payments_count);
        //     //                 _t.user.socket.emit('closeFinancing_'+id,{percent:percent});
        //     //                 if (err) return cb(new MyError('Не удалось закрыть платеж.',{err:err}));
        //     //                 cb(null);
        //     //             });
        //     //         }, cb);
        //     //         break;
        //     // }
        //     var payments_count = no_closing_payment.length;
        //     var counter = 0;
        //     if (!payments_count) return cb(null);
        //     async.eachSeries(no_closing_payment, function (item, cb) {
        //         var cmd = 'makePayment';
        //         switch (financing_close_type_sysname){
        //             case 'DEFAULT':
        //                 cmd = 'makeDefault';
        //                 break;
        //             default:
        //                 break;
        //         }
        //         var o = {
        //             command:cmd,
        //             object:'merchant_financing_payment',
        //             params:{
        //                 id:item.id,
        //                 payment_date:closing_date,
        //                 closing_type_id:payment_close_type.id,
        //                 fromClient:false,
        //                 financing_lock_key:merchant_financing.lock_key,
        //                 calendar_lock_key:calendar.lock_key,
        //                 doNotSetStatistic:true,
        //                 doNotSaveRollback:true
        //             }
        //         };
        //         o.params.rollback_key = rollback_key;
        //         _t.api(o, function (err, res) {
        //             counter++;
        //             var percent = Math.ceil(counter * 100 / payments_count);
        //             _t.user.socket.emit('closeFinancing_'+id,{percent:percent});
        //             if (err) return cb(new MyError('Не удалось закрыть платеж.',{err:err}));
        //             cb(null);
        //         });
        //     }, cb);
        //
        // },
        // getLastPaymentDate:function(cb){
        //     var o = {
        //         command:'get',
        //         object:'merchant_financing_payment',
        //         params:{
        //             where:[
        //                 {
        //                     key:'calendar_id',
        //                     val1:calendar.id
        //                 }
        //             ],
        //             collapseData:false,
        //             limit:1,
        //             sort: {
        //                 columns: ['paid_date'],
        //                 direction: 'DESC'
        //             }
        //         }
        //     };
        //     _t.api(o, function (err, res) {
        //         if (err) return cb(err);
        //         if (!res.length) return cb(null);
        //         closing_date = res[0].paid_date || closing_date;
        //         cb(null);
        //     });
        // },
        closeCalendar: function (cb) {
            var params = {
                id:calendar.id,
                rollback_key:rollback_key,
                calendar_lock_key:calendar.lock_key,
                financing_lock_key:merchant_financing.lock_key,
                closing_date:closing_date,
                closing_type_sysname:financing_close_type_sysname,
                doNotSetStatistic:obj.doNotSetStatistic,
                doNotSaveRollback:true,
                doNotCloseFinancing:true
            };
            var o = {
                command:'closeCalendar',
                object:'Merchant_financing_calendar',
                params:params
            };

            _t.api(o, function (err) {
                if (err) return cb(err);
                cb(null);

            });
        },
        closeFinancing: function (cb) {
            var params = {
                id:id,
                rollback_key:rollback_key,
                lock_key:merchant_financing.lock_key,
                closing_date:closing_date,
                closing_type_sysname:financing_close_type_sysname,
                status_sysname:'CLOSED',
                doNotSaveRollback:true
            };
            _t.modify(params, function (err) {
                if (err) return cb(err);
                cb(null);
            })
        },
        remittanceMainCompanyComission: function (cb) {
            // Соберем всех инвесторов и вызовем метод
            var plan_merchant;
            async.series({
                getPlanMerch: function (cb) {
                    var o = {
                        command: 'get',
                        object: 'investment_plan_merchant',
                        params: {
                            param_where: {
                                investment_plan_id:merchant_financing.investment_plan_id,
                                merchant_financing_id:merchant_financing.id
                            },
                            collapseData: false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить investment_plan_merchant', {o: o, err: err}));
                        if (!res.length) return cb(new MyError('Не найден investment_plan_merchant',{o:o, res:res}));
                        if (res.length > 1) return cb(new MyError('Слишком много investment_plan_merchant по заданным условиям',{o:o, res:res}));
                        plan_merchant = res[0];
                        cb(null);
                    });
                },
                getPlanMerchInv: function (cb) {
                    var o = {
                        command: 'get',
                        object: 'investment_plan_merchant_investor',
                        params: {
                            param_where: {
                                investment_plan_merchant_id:plan_merchant.id
                            },
                            collapseData: false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить investment_plan_merchant_investor', {o: o, err: err}));
                        async.eachSeries(res, function (plan_merch_inv, cb) {
                            if (plan_merch_inv.amount == 0) return cb(null);
                            var o = {
                                command: 'remittanceMainCompanyComission',
                                object: 'investor_account',
                                params: {
                                    id:plan_merch_inv.investor_account_id,
                                    investment_plan_merchant_investor:plan_merch_inv,
                                    merchant_financing:merchant_financing,
                                    operation_date:closing_date || obj.operation_date || closing_date,
                                    rollback_key: rollback_key,
                                    doNotSaveRollback:true
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось перевести комиссию главной компании', {o: o, err: err}));
                                cb(null);
                            });
                        }, cb);
                    });
                }
            },cb);
        },
        clearNotUsedPayments:function(cb){
            async.series({
                removeMerchPayments:function(cb){
                    var m_payments;
                    async.series({
                        getPayments:function(cb){
                            var o = {
                                command:'get',
                                object:'merchant_financing_payment',
                                params:{
                                    where:[
                                        {
                                            key:'merchant_financing_id',
                                            val1:merchant_financing.id
                                        },
                                        {
                                            key:'status_sysname',
                                            val1:'PENDING'
                                        }
                                    ],
                                    collapseData:false
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось получить merchant_financing_payment',{o : o, err : err}));
                                m_payments = res;
                                cb(null);
                            });
                        },
                        remove:function(cb){
                            async.eachSeries(m_payments, function(item, cb){
                                var o = {
                                    command:'remove',
                                    object:'merchant_financing_payment',
                                    params:{
                                        id:item.id,
                                        confirm:true,
                                        rollback_key:rollback_key
                                    }
                                };
                                _t.api(o, function (err, res) {
                                    if (err) return cb(new MyError('Не удалось удалить платеж',{o : o, err : err}));
                                    cb(null);
                                });
                            }, cb);
                        }
                    },cb);
                },
                removeDailyPayment:function(cb){
                    var d_payments;
                    async.series({
                        getPayments:function(cb){
                            var o = {
                                command:'get',
                                object:'daily_payment',
                                params:{
                                    where:[

                                        {
                                            key:'is_applied',
                                            type:'isNull',
                                            group:'is_applied',
                                            comparisonType:'OR'
                                        },
                                        {
                                            key:'is_applied',
                                            type:false,
                                            group:'is_applied',
                                            comparisonType:'OR'
                                        },
                                        {
                                            key:'merchant_financing_id',
                                            val1:merchant_financing.id
                                        }
                                    ],
                                    collapseData:false
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось получить daily_payment',{o : o, err : err}));
                                d_payments = res;
                                cb(null);
                            });
                        },
                        remove:function(cb){
                            async.eachSeries(d_payments, function(item, cb){
                                var o = {
                                    command:'removeCascade',
                                    object:'daily_payment',
                                    params:{
                                        id:item.id,
                                        confirm:true,
                                        rollback_key:rollback_key
                                    }
                                };
                                _t.api(o, function (err, res) {
                                    if (err) return cb(new MyError('Не удалось удалить daily_payment',{o : o, err : err}));
                                    cb(null);
                                });
                            }, cb);
                        }
                    },cb);
                }
            },cb)
        },
        addLog: function (cb) {
            // Записать лог
            var o = {
                history_log_status_sysname: 'CLOSED',
                rollback_key:rollback_key
            };
            o.comment = financing_close_type_sysname;
            for (var i in merchant_financing) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant_financing[i];
            }
            _t.addHistory(o, cb);
        }
    },function (err) {
        //UNLOCK
        if (merchant_financing) _t.unlock({id:id,key:merchant_financing.lock_key}, function (err) {
            console.log(err);
        });
        if (calendar) {
            var o = {
                command:'unlock',
                object:'Merchant_financing_calendar',
                params:{id:calendar.id,key:calendar.lock_key}
            };

            _t.api(o, function (err, res) {
               console.log(err);
            });
        }
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!obj.doNotSaveRollback){
                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'closeFinancing', params:obj});
            }
            cb(null, new UserOk('Финансирование закрыто'));
        }
    })
};

/**
 * Создает новое финансирование со ссылкой на старое и указанием оставшейся суммы
 * Старому указывается, кем он будет рефинансирован
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.prepareRefinancing = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id'));
    var rollback_key = obj.rollback_key || rollback.create();

    // Проверяю статус финансирования
    // Проверяю не было ли уже создано Рефинансирование
    // Создать новое финансирование с указанием closing_financing_id
    // Изменить этому финансированию closed_by_financing_id
    // Записать лог


    var merchant_financing, new_merchant_financing_id;
    async.series({
        get: function (cb) {
            _t.getById({id:id}, function (err, res) {
                if (err) return err;
                if (!res.length) return cb(new MyError('Финансирование не найдено.'));
                merchant_financing = res[0];
                cb(null);
            })
        },
        check: function (cb) {
            // проверим статусы
            if (merchant_financing.status_sysname!=='ACQUIRING_IN_PROCCESS') return cb(new UserError('Финансирование должно быть в статусе "В работе"',{status:merchant_financing.status_sysname,merchant_financing:merchant_financing}));
            // Проверим не было ли уже создано рефинансирование
            if (merchant_financing.closed_by_financing_id) return cb(new UserError('Рефинансирование уже было создано. №: '+ merchant_financing.closed_by_financing_id));
            cb(null);
        },
        createRefinancing: function (cb) {
            // Создать новое финансирование с указанием closing_financing_id
            var params = {
                merchant_id:merchant_financing.merchant_id,
                closing_financing_id:id,
                refinancing_amount:merchant_financing.to_return,
                financing_type_sysname:obj.financing_type_sysname,
                confirm:true,
                rollback_key:rollback_key,
                fromClient:false
            };
            _t.add(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось создать новое финансирование.',{err:err}));
                new_merchant_financing_id = res.id;
                cb(null);
            })
        },
        updateThisFinancing: function (cb) {
            // Изменить этому финансированию closed_by_financing_id
            var params = {
                id:id,
                closed_by_financing_id:new_merchant_financing_id
            };
            params.rollback_key = rollback_key;
            _t.modify(params, cb);
        }

    }, function (err) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
                return cb(err, err2);
            });
        }else{
            //rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'prepareRefinancing', params:obj});
            cb(null, new UserOk('Финансирование подготовлено.',{id:new_merchant_financing_id}));
        }
    })

};


/**
 * Рефинансирует
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.refinancing = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    var filename = obj.filename;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id'));
    if (!filename) return cb(new MyError('В метод не передан filename'));
    var rollback_key = obj.rollback_key || rollback.create();
    var confirm = obj.confirm;

    // Проверяю статус обоих рефинанансирований
    // закрыть предыдущее с типом REFINANCE
    // уведомить банк
    // перевести в работу
    // Перевожу в работу новое changeStatus
    //
    // Записать лог

    var old_merchant_financing, merchant_financing;
    var notified;
    async.series({
        checkConfirm: function (cb) {
            if (confirm == 'ПОДТВЕРДИТЬ') return cb(null);
            if (confirm && confirm !== 'ПОДТВЕРДИТЬ') return cb(new UserError('Неверно введено контрольное значение!'));
            return cb(new UserError('needConfirm', {confirmType:'dialog', responseType:'text',title:'Подтвердите рефинансирование',message: 'При подтверждении произойдет рефинансирование!' +
            '<br>Будет закрыто предыдущее финансирование и открыто текущее.' +
            '<br><span style="color:red;">Если вы уверены введите "ПОДТВЕРДИТЬ".</span>'}));
        },
        get: function (cb) {
            _t.getById({id:id}, function (err, res) {
                if (err) return err;
                if (!res.length) return cb(new MyError('Финансирование не найдено.'));
                merchant_financing = res[0];
                cb(null);
            })
        },
        check: function (cb) {
            // проверим статусы
            if (merchant_financing.status_sysname!=='BANK_CONFIRM') return cb(new UserError('Финансирование должно быть в статусе "Банк подтвердил"',{status:merchant_financing.status_sysname}));
            // Проверим не было ли уже создано рефинансирование
            if (!merchant_financing.closing_financing_id) return cb(new UserError('Не указано финансирование для закрытия'));
            // Проверим хватает ли новой суммы на закрытие предыдущего финансирования
            if (+old_merchant_financing.to_return > +merchant_financing.founding_amount) return cb(new UserError('Суммы финансирования не хватеат на закрытие предыдущего.',{merchant_financing:merchant_financing,old_merchant_financing:old_merchant_financing}))
            cb(null);
        },
        getPrev: function (cb) {
            _t.getById({id:merchant_financing.closing_financing_id}, function (err, res) {
                if (err) return err;
                if (!res.length) return cb(new MyError('Финансирование не найдено.'));
                old_merchant_financing = res[0];
                cb(null);
            })
        },
        closePrev: function (cb) {
            // закрыть предыдущее с типом REFINANCE
            var params = {
                id:merchant_financing.closing_financing_id,
                closing_type_sysname:'REFINANCE',
                rollback_key:rollback_key,
                fromClient:false,
                confirm:true,
                doNotSaveRollback:true
            };
            _t.closeFinancing(params, function (err, res) {
                if (err) {
                    if (err instanceof UserError) return cb(err);
                    return cb(new MyError('Не удалось закрыть предыдущее финансирование',{err:err}));
                }
                cb(null);
            })
        },
        setInWork: function (cb) {
            // перевести в работу
            var params = {
                id:id,
                filename:filename,
                refinancing_amount:old_merchant_financing.to_return,
                lead_type_sysname:old_merchant_financing.lead_type_sysname,
                rollback_key:rollback_key,
                fromClient:false,
                confirm:true,
                without_sending:obj.without_sending,
                doNotSaveRollback:true
            };
            _t.moneySentAndSetInWork(params, function (err, res) {
                if (err) {
                    if (err instanceof UserError) return cb(err);
                    return cb(new MyError('Не удалось закрыть предыдущее финансирование',{err:err}));
                }
                cb(null);
            })
        },
        addLog: function (cb) {
            // Записать лог
            var o = {
                history_log_status_sysname: 'REFINANCING',
                rollback_key:rollback_key
            };
            for (var i in merchant_financing) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant_financing[i];
            }
            _t.addHistory(o, cb);
        }


    }, function (err) {
        if (err) {
            if (notified) err.additionalMessage = 'Внимание! Из-за ошибки изменения были отменены, НО банк был уведомлен о рефинансирование!';
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
                return cb(err, err2);
            });
        }else{
            rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'refinancing', params:obj});
            cb(null, new UserOk('Финансирование подготовлено.',{id:id}));
        }
    });

};


Model.prototype.report_vg = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var name = obj.name || 'report_vg_prepare.xlsx';
    var report_date = obj.report_date || funcs.getDate();
    //if (isNaN(+id)) return cb(new MyError('В метод не передан id'));

    var payments, data, readyData, template, binaryData, filename;
    var merchant_financings = {};
    var weekAgoStart = moment(report_date, 'DD.MM.YYYY').startOf('week').add(-6,'day').format('DD.MM.YYYY');
    var weekAgoEnd = moment(report_date, 'DD.MM.YYYY').startOf('week').format('DD.MM.YYYY');
    var initial_capital_investments = 15000000;

    var getCutOffAmount = function (start, end, financing, payment_type, field) {
        payment_type = payment_type || 'paid';
        field = field || 'paid_amount';
        var res = 0;
        for (var j in financing.payments[payment_type]) {
            var payment = financing.payments[payment_type][j];
            // За отчетный период
            if (funcs.date_A_more_or_equal_B(payment.paid_date,start) && funcs.date_A_more_or_equal_B(end,payment.paid_date)){
                res += +payment[field];
            }
        }
        return res;
    };

    async.series({
        getData: function (cb) {
            async.series({
                    getFinancings: function (cb) {
                        // Получим финансирования в подходящем статусе
                        var o = {
                            command: 'get',
                            object: 'merchant_financing',
                            params: {
                                where: [
                                    {
                                        key: 'status_sysname',
                                        type: 'in',
                                        val1: ['ACQUIRING_IN_PROCCESS','CLOSED']
                                    }
                                ],
                                sort:'created',
                                collapseData: false
                            }
                        };
                        _t.api(o, function (err, res) {
                            if (err) return cb(err);
                            if (!res.length) return cb(new UserError('Еще нет доступных финансирований'));
                            for (var i in res) {
                                var m_f_id = res[i].id;
                                res[i].payments = {
                                    paid:[],
                                    pending:[]
                                };
                                merchant_financings[m_f_id] = res[i];
                            }
                            cb(null);
                        });
                    },
                    getPayments: function (cb) {
                        // Получим платежи за период для этих финансирований
                        var o = {
                            command: 'get',
                            object: 'merchant_financing_payment',
                            params: {
                                where: [
                                    {
                                        key: 'status_sysname',
                                        type: 'in',
                                        val1: ['PENDING','PAID']
                                    },
                                    {
                                        key: 'merchant_financing_id',
                                        type: 'in',
                                        val1: Object.keys(merchant_financings)
                                    }
                                ],
                                limit:100000000,
                                collapseData: false
                            }
                        };
                        _t.api(o, function (err, res) {
                            if (err) return cb(err);
                            for (var i in res) {
                                var payment = res[i];
                                var m_f_id = payment.merchant_financing_id;
                                if (typeof merchant_financings[m_f_id]!=='object') return cb(new MyError('Получили платеж не пренадлежащий нужному финансированию',{payment:payment,merchant_financings:merchant_financings}));
                                if (typeof merchant_financings[m_f_id].payments!=='object') merchant_financings[m_f_id].payments = {};
                                var payment_status = payment.status_sysname.toLowerCase();
                                if (typeof merchant_financings[m_f_id].payments[payment_status]!=='object')merchant_financings[m_f_id].payments[payment_status] = [];
                                merchant_financings[m_f_id].payments[payment_status].push(payment);
                            }
                            cb(null);
                        });
                    }
                }, cb);
        },
        prepareData0: function (cb) {
            readyData = {
                report_date: report_date,
                cut_off_date: weekAgoStart + ' - ' + weekAgoEnd,
                fin: [],
                fin2: [],
                fin3: []
            };
            cb(null);
        },
        prepareData1: function (cb) {
            // Оранжевый отчет
            readyData.total_founding_amount     = 0;
            readyData.total_amount_to_return    = 0;
            readyData.total_gross_profit        = 0;

            readyData.total_bank_comission      = 0;
            readyData.total_net_profit          = 0;
            readyData.total_collected           = 0;
            readyData.total_pending             = 0;

            for (var i in merchant_financings) {

                merchant_financings[i].gross_profit    = +merchant_financings[i].amount_to_return - merchant_financings[i].founding_amount;
                merchant_financings[i].bank_comision   = +merchant_financings[i].amount_to_return * 0.03;
                merchant_financings[i].net_profit      = +(merchant_financings[i].amount_to_return - merchant_financings[i].founding_amount) - (merchant_financings[i].amount_to_return * 0.03);
                merchant_financings[i].total_returned_cut_off = getCutOffAmount(weekAgoStart, weekAgoEnd, merchant_financings[i]);

                readyData.fin.push({
                    merchant_id:merchant_financings[i].merchant_id,
                    work_bank_merchant_id:merchant_financings[i].work_bank_merchant_id || '-',
                    name:merchant_financings[i].merchant_name,
                    financing_date:funcs.userFriendlyDate(merchant_financings[i].financing_date || merchant_financings[i].payments_start_date),
                    founding_amount:merchant_financings[i].founding_amount,
                    factoring_rate:merchant_financings[i].factoring_rate,
                    amount_to_return:merchant_financings[i].amount_to_return,
                    payments_count:merchant_financings[i].payments_count,
                    work_days:5,
                    payment_amount:merchant_financings[i].payment_amount,
                    gross_profit: merchant_financings[i].gross_profit,
                    bank_comission_percent: 3,
                    bank_comission_summ: merchant_financings[i].bank_comision,
                    net_profit:merchant_financings[i].net_profit,
                    total_returned_cut_off:merchant_financings[i].total_returned_cut_off,
                    to_return:merchant_financings[i].to_return,
                    complete_percent:merchant_financings[i].complete_percent

                });
                readyData.total_founding_amount       += +merchant_financings[i].founding_amount;
                readyData.total_amount_to_return      += +merchant_financings[i].amount_to_return;
                readyData.total_gross_profit          += +merchant_financings[i].gross_profit;
                readyData.total_bank_comission        += +merchant_financings[i].bank_comision;
                readyData.total_net_profit            += +merchant_financings[i].net_profit;
                readyData.total_collected             += +merchant_financings[i].total_returned_cut_off;
                readyData.total_pending               += +merchant_financings[i].to_return;
            }
            cb(null);
        },
        prepareData2: function (cb) {
            // Зеленый отчет
            readyData.r2_total_founding_amount     = 0;
            readyData.r2_total_amount_to_return    = 0;
            readyData.r2_total_gross_profit        = 0;
            readyData.r2_total_bank_comission      = 0;
            readyData.r2_total_net_profit          = 0;
            readyData.r2_total_collected           = 0;
            readyData.r2_total_pending             = 0;
            // Добавим
            readyData.r2_total_reinvested_returned  = 0;
            readyData.r2_total_vg_profit            = 0;
            readyData.r2_total_investor_profit      = 0;
            readyData.r2_total_pending_remittance   = 0;
            readyData.r2_total_final_vg_profit      = 0;


            for (var i in merchant_financings) {

                merchant_financings[i].gross_profit    = +merchant_financings[i].amount_to_return - merchant_financings[i].founding_amount;
                merchant_financings[i].bank_comision   = +merchant_financings[i].amount_to_return * 0.03;
                merchant_financings[i].net_profit      = +(merchant_financings[i].amount_to_return - merchant_financings[i].founding_amount) - (merchant_financings[i].amount_to_return * 0.03);
                // Добавим
                merchant_financings[i].pending_remittance = 0;
                for (var j in merchant_financings[i].payments.paid) {
                    var payment = merchant_financings[i].payments.paid[j];
                    // За отчетный период
                    if (funcs.date_A_more_or_equal_B(payment.paid_date,weekAgoStart) && funcs.date_A_more_or_equal_B(weekAgoEnd,payment.paid_date)){
                        merchant_financings[i].pending_remittance += +payment.paid_amount;
                    }
                }

                merchant_financings[i].total_collected = merchant_financings[i].total_returned;
                merchant_financings[i].reinvested_returned = merchant_financings[i].total_collected - merchant_financings[i].pending_remittance;

                merchant_financings[i].vg_net_profit = (merchant_financings[i].gross_profit - merchant_financings[i].bank_comision) / 2;
                merchant_financings[i].investor_net_profit = (merchant_financings[i].gross_profit - merchant_financings[i].bank_comision) / 2;
                merchant_financings[i].final_vg_profit = (merchant_financings[i].status_sysname == 'CLOSED')? (merchant_financings[i].gross_profit - merchant_financings[i].bank_comision) / 2 : 0;
                merchant_financings[i].gross_future_receivables_after_mgm_fee = merchant_financings[i].amount_to_return - merchant_financings[i].vg_net_profit;


                readyData.fin2.push({
                    merchant_id:merchant_financings[i].merchant_id,
                    work_bank_merchant_id:merchant_financings[i].work_bank_merchant_id || '-',
                    name:merchant_financings[i].merchant_name,
                    financing_date:funcs.userFriendlyDate(merchant_financings[i].financing_date || merchant_financings[i].payments_start_date),
                    founding_amount:merchant_financings[i].founding_amount,
                    factoring_rate:merchant_financings[i].factoring_rate,
                    amount_to_return:merchant_financings[i].amount_to_return,
                    payments_count:merchant_financings[i].payments_count,
                    work_days:5,
                    payment_amount:merchant_financings[i].payment_amount,
                    gross_profit: merchant_financings[i].gross_profit,
                    bank_comission_summ: merchant_financings[i].bank_comision,
                    net_profit:merchant_financings[i].net_profit,
                    total_collected:merchant_financings[i].total_collected,
                    to_return:merchant_financings[i].to_return,
                    reinvested_returned:merchant_financings[i].reinvested_returned,
                    complete_percent:merchant_financings[i].complete_percent,
                    // Добавим
                    vg_net_profit:merchant_financings[i].vg_net_profit,
                    investor_net_profit:merchant_financings[i].investor_net_profit,
                    final_vg_profit:merchant_financings[i].final_vg_profit,
                    gross_future_receivables_after_mgm_fee:merchant_financings[i].gross_future_receivables_after_mgm_fee,
                    pending_remittance:merchant_financings[i].pending_remittance

                });
                readyData.r2_total_founding_amount       += +merchant_financings[i].founding_amount;
                readyData.r2_total_amount_to_return      += +merchant_financings[i].amount_to_return;
                readyData.r2_total_gross_profit          += +merchant_financings[i].gross_profit;
                readyData.r2_total_bank_comission        += +merchant_financings[i].bank_comision;
                readyData.r2_total_net_profit            += +merchant_financings[i].net_profit;
                readyData.r2_total_collected             += +merchant_financings[i].total_collected;
                readyData.r2_total_pending               += +merchant_financings[i].to_return;
                // Добавим
                readyData.r2_total_reinvested_returned   += +merchant_financings[i].reinvested_returned;
                readyData.r2_total_vg_profit             += +merchant_financings[i].vg_net_profit;
                readyData.r2_total_investor_profit       += +merchant_financings[i].investor_net_profit;
                readyData.r2_total_pending_remittance    += +merchant_financings[i].pending_remittance;
                readyData.r2_total_final_vg_profit       += +merchant_financings[i].final_vg_profit;

            }
            cb(null);
        },
        prepareData3: function (cb) {


            readyData.r3_total_final_profit      = 0;
            readyData.r3_total_cut_off_collected = 0;
            readyData.total_week_1 = 0;
            readyData.total_week_2 = 0;
            readyData.total_week_3 = 0;
            readyData.total_week_4 = 0;
            readyData.total_week_5 = 0;
            readyData.total_week_6 = 0;
            readyData.total_week_7 = 0;
            readyData.total_week_8 = 0;
            readyData.total_week_9 = 0;
            readyData.total_week_10 = 0;
            readyData.total_week_11 = 0;
            readyData.total_week_12 = 0;
            readyData.total_collected_summ = 0;

            for (var i in merchant_financings) {
                // Добавим
                for (var c = 1; c <= 12; c++) {
                    var num = 12 - c;
                    //var endOld = moment(moment(report_date, 'DD.MM.YYYY') - moment.duration(num, 'weeks')).format('DD.MM.YYYY');
                    //var start0ld = moment(moment(report_date, 'DD.MM.YYYY') - moment.duration(num + 1, 'weeks')).format('DD.MM.YYYY');
                    //
                    var start = moment().startOf('week').add(-6,'day').add(-num,'week').format('DD.MM.YYYY');
                    var end = moment().startOf('week').add(-num,'week').format('DD.MM.YYYY');

                    merchant_financings[i]['week_' + c + '_value'] = getCutOffAmount(start, end, merchant_financings[i]);
                    readyData['week_' + c] = start + ' - ' + end;
                }
                merchant_financings[i].final_profit = 0;
                merchant_financings[i].cut_off_collected = merchant_financings[i].week_12_value;

                readyData.fin3.push({
                    merchant_id: merchant_financings[i].merchant_id,
                    work_bank_merchant_id: merchant_financings[i].work_bank_merchant_id || '-',
                    name: merchant_financings[i].merchant_name,
                    final_profit: merchant_financings[i].final_profit,
                    cut_off_collected: merchant_financings[i].cut_off_collected,
                    week_1_value: merchant_financings[i].week_1_value,
                    week_2_value: merchant_financings[i].week_2_value,
                    week_3_value: merchant_financings[i].week_3_value,
                    week_4_value: merchant_financings[i].week_4_value,
                    week_5_value: merchant_financings[i].week_5_value,
                    week_6_value: merchant_financings[i].week_6_value,
                    week_7_value: merchant_financings[i].week_7_value,
                    week_8_value: merchant_financings[i].week_8_value,
                    week_9_value: merchant_financings[i].week_9_value,
                    week_10_value: merchant_financings[i].week_10_value,
                    week_11_value: merchant_financings[i].week_11_value,
                    week_12_value: merchant_financings[i].week_12_value,

                    total_collected: merchant_financings[i].total_collected

                });

                readyData.r3_total_final_profit += +merchant_financings[i].final_profit;
                readyData.r3_total_cut_off_collected += +merchant_financings[i].cut_off_collected;
                readyData.total_week_1 += +merchant_financings[i].week_1_value;
                readyData.total_week_2 += +merchant_financings[i].week_2_value;
                readyData.total_week_3 += +merchant_financings[i].week_3_value;
                readyData.total_week_4 += +merchant_financings[i].week_4_value;
                readyData.total_week_5 += +merchant_financings[i].week_5_value;
                readyData.total_week_6 += +merchant_financings[i].week_6_value;
                readyData.total_week_7 += +merchant_financings[i].week_7_value;
                readyData.total_week_8 += +merchant_financings[i].week_8_value;
                readyData.total_week_9 += +merchant_financings[i].week_9_value;
                readyData.total_week_10 += +merchant_financings[i].week_10_value;
                readyData.total_week_11 += +merchant_financings[i].week_11_value;
                readyData.total_week_12 += +merchant_financings[i].week_12_value;

                readyData.total_collected_summ += +merchant_financings[i].total_collected;


            }
            cb(null);
        },
        prepareData4: function (cb) {

            readyData.initial_capital_investments       = initial_capital_investments || 100000000;
            readyData.captial_and_reinvestments         = parseFloat(readyData.initial_capital_investments) + parseFloat(readyData.r2_total_pending);
            readyData.outstanding_and_pending           = parseFloat(readyData.r2_total_pending) + parseFloat(readyData.r2_total_pending_remittance);
            readyData.reinvestment_tail                 = 'Второй этап - инdесторы';

            cb(null);
        },
        getTemplate: function (cb) {
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

Model.prototype.report_investor = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var name = obj.name || 'report_merchant_1.xlsx';
    var report_date = obj.report_date || funcs.getDate();
    //if (isNaN(+id)) return cb(new MyError('В метод не передан id'));

    var payments, data, readyData, template, binaryData, filename;
    var merchant_financings = {};
    var weekAgoStart = moment(report_date, 'DD.MM.YYYY').startOf('week').add(-6,'day').format('DD.MM.YYYY');
    var weekAgoEnd = moment(report_date, 'DD.MM.YYYY').startOf('week').format('DD.MM.YYYY');

    async.series({
        getData: function (cb) {
            async.series({
                getFinancings: function (cb) {
                    // Получим финансирования в подходящем статусе
                    var o = {
                        command: 'get',
                        object: 'merchant_financing',
                        params: {
                            where: [
                                {
                                    key: 'status_sysname',
                                    type: 'in',
                                    val1: ['ACQUIRING_IN_PROCCESS'/*,'CLOSED'*/]
                                }
                            ],
                            collapseData: false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(err);
                        if (!res.length) return cb(new UserError('Еще нет доступных финансирований'));
                        for (var i in res) {
                            var m_f_id = res[i].id;
                            res[i].payments = {
                                paid:[],
                                pending:[]
                            };
                            merchant_financings[m_f_id] = res[i];
                        }
                        cb(null);
                    });
                },
                getPayments: function (cb) {
                    // Получим платежи за период для этих финансирований
                    var o = {
                        command: 'get',
                        object: 'merchant_financing_payment',
                        params: {
                            where: [
                                {
                                    key: 'status_sysname',
                                    type: 'in',
                                    val1: ['PENDING','PAID']
                                },
                                {
                                    key: 'merchant_financing_id',
                                    type: 'in',
                                    val1: Object.keys(merchant_financings)
                                }
                            ],
                            collapseData: false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(err);
                        for (var i in res) {
                            var payment = res[i];
                            var m_f_id = payment.merchant_financing_id;
                            if (typeof merchant_financings[m_f_id]!=='object') return cb(new MyError('Получили платеж не пренадлежащий нужному финансированию',{payment:payment,merchant_financings:merchant_financings}));
                            if (typeof merchant_financings[m_f_id].payments!=='object') merchant_financings[m_f_id].payments = {};
                            var payment_status = payment.status_sysname.toLowerCase();
                            if (typeof merchant_financings[m_f_id].payments[payment_status]!=='object')merchant_financings[m_f_id].payments[payment_status] = [];
                            merchant_financings[m_f_id].payments[payment_status].push(payment);
                        }
                        cb(null);
                    });
                }
            }, cb);
        },
        prepareData0: function (cb) {
            readyData = {
                report_date: report_date,
                cut_off_date: weekAgoStart + ' - ' + weekAgoEnd,
                fin: [],
                fin1: []
            };
            cb(null);
        },
        prepareData1: function (cb) {

            readyData.total_founding_amount = 0;
            readyData.total_amount_to_return = 0;
            readyData.total_gross_profit = 0;
            readyData.total_bank_comission = 0;
            readyData.total_net_profit = 0;

            //readyData.total_vg_profit = 0;
            //readyData.total_investor_profit = 0;
            //readyData.total_collected = 0;
            //readyData.total_pending = 0;
            //readyData.total_pending_remittance = 0;
            //readyData.total_final_vg_profit = 0;

            for (var i in merchant_financings) {
                merchant_financings[i].gross_profit = merchant_financings[i].amount_to_return - merchant_financings[i].founding_amount;
                merchant_financings[i].bank_comision = merchant_financings[i].amount_to_return * 0.03;
                merchant_financings[i].pending_remittance = 0;
                merchant_financings[i].final_vg_profit = (merchant_financings[i].status_sysname == 'CLOSED')? (merchant_financings[i].gross_profit - merchant_financings[i].bank_comision) / 2 : 0;

                for (var j in merchant_financings[i].payments) {
                    var payment = merchant_financings[i].payments[j];
                    if (payment.status_sysname!='PAID') continue;
                    merchant_financings[i].pending_remittance += payment.paid_amount;
                }

                readyData.fin.push({
                    merchant_id:merchant_financings[i].merchant_id,
                    name:merchant_financings[i].merchant_name,
                    founding_amount:merchant_financings[i].founding_amount,
                    financing_date: funcs.userFriendlyDate(merchant_financings[i].financing_date || merchant_financings[i].payments_start_date),
                    factoring_rate: merchant_financings[i].factoring_rate,
                    payments_count: merchant_financings[i].payments_count,
                    payment_amount: merchant_financings[i].payment_amount,
                    bank_comission_summ: merchant_financings[i].bank_comision,
                    net_profit: merchant_financings[i].gross_profit - merchant_financings[i].bank_comision,
                    gross_profit: merchant_financings[i].gross_profit,
                    amount_to_return:merchant_financings[i].amount_to_return,
                    vg_net_profit:(merchant_financings[i].amount_to_return - merchant_financings[i].bank_comision) / 2,
                    investor_net_profit:(merchant_financings[i].amount_to_return - merchant_financings[i].bank_comision) / 2,
                    complete_percent:merchant_financings[i].complete_percent,
                    total_collected:merchant_financings[i].total_collected,
                    to_return:merchant_financings[i].to_return,
                    pending_remittance:merchant_financings[i].pending_remittance,
                    final_vg_profit:merchant_financings[i].final_vg_profit

                });
                readyData.total_founding_amount       += merchant_financings[i].founding_amount;
                readyData.total_amount_to_return      += merchant_financings[i].amount_to_return;
                readyData.total_gross_profit          += +merchant_financings[i].gross_profit;
                readyData.total_bank_comission        += +(merchant_financings[i].amount_to_return * 0.03);
                readyData.total_net_profit            += +merchant_financings[i].gross_profit - merchant_financings[i].bank_comision;

                //readyData.total_vg_profit             += (merchant_financings[i].amount_to_return - merchant_financings[i].bank_comision) / 2;
                //readyData.total_investor_profit       += (merchant_financings[i].amount_to_return - merchant_financings[i].bank_comision) / 2;
                //readyData.total_collected             += merchant_financings[i].total_returned;
                //readyData.total_pending               += merchant_financings[i].to_return;
                //readyData.total_pending_remittance    += merchant_financings[i].pending_remittance;
                //readyData.total_final_vg_profit       += merchant_financings[i].final_vg_profit;
            }
            cb(null);
        },
        prepareData2: function (cb) {

            readyData.total_gross_investment        = 0;
            readyData.total_bank_comission          = 0;
            readyData.total_net_investment          = 0;
            readyData.total_gross_profit_2          = 0;
            readyData.total_gross_amount_to_return  = 0;
            readyData.total_vg_comission            = 0;
            readyData.total_net_profit_2            = 0;
            readyData.total_net_amount_to_return    = 0;

            for (var i in merchant_financings) {
                merchant_financings[i].gross_profit = merchant_financings[i].amount_to_return - merchant_financings[i].founding_amount;
                merchant_financings[i].bank_comision = merchant_financings[i].amount_to_return * 0.03;
                merchant_financings[i].net_amount_to_return = merchant_financings[i].amount_to_return - ((merchant_financings[i].amount_to_return - merchant_financings[i].founding_amount) - merchant_financings[i].bank_comision) / 2;

                readyData.fin1.push({
                    merchant_id:            merchant_financings[i].merchant_id,
                    name:                   merchant_financings[i].merchant_name,
                    gross_investment:       merchant_financings[i].founding_amount + merchant_financings[i].bank_comision,
                    bank_comission_percent: 3,
                    bank_comission:         merchant_financings[i].bank_comision,
                    net_investment:         merchant_financings[i].founding_amount,
                    participation:          '100%',
                    gross_profit:           merchant_financings[i].gross_profit,
                    factoring_rate:         merchant_financings[i].factoring_rate,
                    gross_amount_to_return: merchant_financings[i].amount_to_return,
                    vg_comission:           ((merchant_financings[i].amount_to_return - merchant_financings[i].founding_amount) - merchant_financings[i].bank_comision) / 2,
                    net_profit:             ((merchant_financings[i].amount_to_return - merchant_financings[i].founding_amount) - merchant_financings[i].bank_comision) / 2,
                    net_amount_to_return:   merchant_financings[i].net_amount_to_return
                });

                readyData.total_gross_investment        += merchant_financings[i].founding_amount + merchant_financings[i].bank_comision;
                //readyData.total_bank_comission          += 105;
                readyData.total_bank_comission          += merchant_financings[i].bank_comision;
                readyData.total_net_investment          += merchant_financings[i].founding_amount;
                readyData.total_gross_profit_2          += merchant_financings[i].gross_profit;
                readyData.total_gross_amount_to_return  += merchant_financings[i].amount_to_return;
                readyData.total_vg_comission            += ((merchant_financings[i].amount_to_return - merchant_financings[i].founding_amount) - merchant_financings[i].bank_comision) / 2;
                readyData.total_net_profit_2            += ((merchant_financings[i].amount_to_return - merchant_financings[i].founding_amount) - merchant_financings[i].bank_comision) / 2;
                //readyData.total_net_amount_to_return    += 120;//merchant_financings[i].amount_to_return - ((merchant_financings[i].amount_to_return - merchant_financings[i].founding_amount) - bank_comision) / 2;
                readyData.total_net_amount_to_return    += merchant_financings[i].net_amount_to_return;

            }
            cb(null);
        },
        getTemplate: function (cb) {
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


Model.prototype.onAttention = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id финансирования'));
    var rollback_key = obj.rollback_key || rollback.create();

    var merchant_financing, merchant;
    var now_date = funcs.getDate();
    async.series({
        getMerchantFinancing: function (cb) {
            // Получить данные о финансировании мерчанта
            _t.getById({id: id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найдено финансирование.', {id: id}));
                merchant_financing = res[0];
                cb(null);
            });
        },
        getMerchant: function (cb) {
            // Получить данные  мерчанта
            var o = {
                command:'getById',
                object:'merchant',
                params:{
                    id:merchant_financing.merchant_id
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найден мерч.', {id: id}));
                merchant = res[0];
                cb(null);
            });
        },
        setFinancingOnAttention: function (cb) {
            var params = {
                id:id,
                    attention_date:funcs.getDate()
            };
            params.rollback_key = rollback_key;
            _t.modify(params, function (err) {
                if (err) return cb(new MyError('Не удалось установить финансирование onAttention.',{err:err}));
                cb(null);
            })
        },
        addLogMerchant: function (cb) {
            // Записать лог merchant
            var o = {
                command: 'addHistory',
                object: 'merchant',
                params: {
                    id: merchant_financing.merchant_id,
                    history_log_status_sysname: 'ON_ATTENTION',
                    attention_date: now_date
                }
            };
            for (var i in merchant) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant[i];
            }
            _t.api(o, cb);
        },
        addLog: function (cb) {
            // Записать лог
            var o = {
                id: id,
                history_log_status_sysname: 'ON_ATTENTION',
                attention_date: now_date
            };
            for (var i in merchant_financing) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant_financing[i];
            }

            _t.addHistory(o, cb);
        }
    }, function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
                return cb(err, err2);
            });
        }else{
            //rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'bankConfirm', params:obj});
            cb(null, new UserOk('Поставлено "на карандаш"'));
        }
    });
};

Model.prototype.onAttentionCancel = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id финансирования'));
    var rollback_key = obj.rollback_key || rollback.create();

    var merchant_financing, merchant;
    async.series({
        getMerchantFinancing: function (cb) {
            // Получить данные о финансировании мерчанта
            _t.getById({id: id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найдено финансирование.', {id: id}));
                merchant_financing = res[0];
                cb(null);
            });
        },
        getMerchant: function (cb) {
            // Получить данные  мерчанта
            var o = {
                command:'getById',
                object:'merchant',
                params:{
                    id:merchant_financing.merchant_id
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найден мерч.', {id: id}));
                merchant = res[0];
                cb(null);
            });
        },
        setFinancingOnAttention: function (cb) {
            var params = {
                id:id,
                attention_date:null
            };
            params.rollback_key = rollback_key;
            _t.modify(params, function (err) {
                if (err) return cb(new MyError('Не удалось установить финансирование onAttention.',{err:err}));
                cb(null);
            })
        },
        addLogMerchant: function (cb) {
            // Записать лог merchant
            var o = {
                command: 'addHistory',
                object: 'merchant',
                params: {
                    id: merchant_financing.merchant_id,
                    history_log_status_sysname: 'ON_ATTENTION_CANCEL',
                    attention_date: null
                }
            };
            for (var i in merchant) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant[i];
            }
            _t.api(o, cb);
        },
        addLog: function (cb) {
            // Записать лог
            var o = {
                id: id,
                history_log_status_sysname: 'ON_ATTENTION_CANCEL',
                attention_date: null
            };
            for (var i in merchant_financing) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant_financing[i];
            }

            _t.addHistory(o, cb);
        }
    }, function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
                return cb(err, err2);
            });
        }else{
            //rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'bankConfirm', params:obj});
            cb(null, new UserOk('Снят с "карандаша"'));
        }
    });
};


// var o = {
//    command: 'updateBCommission',
//    object: 'merchant_financing',
//    params: {
//        id:262
//    }
// };
// socketQuery(o, function (res) {
//    console.log(res);
// })

Model.prototype.updateBCommission = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var rollback_key = obj.rollback_key || rollback.create();
    var id = obj.id;
    var merchant_financings;

    async.series({
        getMerchantFinancing: function (cb) {
            // Получить все финансирования или по переданному id
            var params = {
                param_where: {},
                collapseData: false
            }
            if (id){
                params.param_where.id = id;
            }
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить финансирования', {params: params, err: err}));
                merchant_financings = res;
                cb(null);
            });

        },
        updateFin: function (cb) {
            async.eachSeries(merchant_financings, function (item, cb) {
                var broker_comission;
                var agent_comission = 0;
                async.series({
                    getBrokerComission: function(cb){


                        if (isNaN(+item.factoring_rate) || !item.factoring_rate) return cb(null);
                        var dbFloat_factoring_rate = item.factoring_rate.toFixed(2).replace('.',',');

                        var o = {
                            command: 'get',
                            object: 'broker_comission_percent',
                            params: {
                                param_where: {
                                    factoring_rate: dbFloat_factoring_rate
                                },
                                collapseData: false
                            }
                        };

                        _t.api(o, function(err,res){

                            if(err) return cb(err);

                            if(!res.length) return cb(new UserError('Для такой ставки факторинга не указана комиссия брокера', {o:o,res:res}));

                            if(item.lead_type_sysname == 'EXT_LEAD'){

                                broker_comission = +res[0].ext_sale_percent;
                                agent_comission = +res[0].agent_percent;

                            }else if(item.lead_type_sysname == 'OWN_LEAD'){

                                broker_comission = +res[0].own_sale_percent;

                            }else{

                                return cb(new UserError('У финансирования не указан тип поступления лида'));

                            }

                            cb(null);

                        });

                    },
                    setBrockerComission:function(cb){
                        var params = {
                            id:item.id,
                            broker_comission:broker_comission,
                            agent_comission:agent_comission,
                            rollback_key:rollback_key
                        };
                        _t.modify(params, function(err){
                            if (err){
                                if (err.message == 'notModified') {
                                    console.log(err);
                                    return cb(null);
                                }
                                return cb(err);
                            }
                            cb(null);
                        });
                    }
                },cb);
            },cb);
        }

    }, function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
                return cb(err, err2);
            });
        }else{
            //rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'bankConfirm', params:obj});
            cb(null, new UserOk('Обнавлено'));
        }
    });
};

Model.prototype.changeToPercent = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    var day_percent = obj.day_percent;
    if (isNaN(+day_percent)) return cb(new UserError('Некорректно указан максимальный процент списания в день.',{obj:obj}));
    if (day_percent <= 0 || day_percent > 100) return cb(new UserError('Некоректно указан процент.',{obj:obj}));
    var confirm = obj.confirm;

    var merchant_financing;
    async.series({
        get: function (cb) {
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить финансирование.',{id:id,err:err}));
                merchant_financing = res[0];
                cb(null);
            });
        },
        check: function (cb) {
            if (merchant_financing.financing_type_sysname == 'PERCENT') return cb(new UserError('Данное финансирование уже имеет тип ПРОЦЕНТНЫЙ'));
            if (merchant_financing.status_sysname !== 'ACQUIRING_IN_PROCCESS') return cb(new UserError('Финансирование должно быть в работе.',{obj:obj,merchant_financing:merchant_financing}));
            cb(null);
        },
        getConfirm: function (cb) {
            if (!confirm) {
                return cb(new UserError('needConfirm', {
                    confirmType: 'dialog',
                    message: 'Финансированию будет изменен тип на "ПРОЦЕНТНЫЙ".<br/>Указан процент: <b>' + day_percent + '</b><br/>Вы уверены?'
                }));
            }
            cb(null);
        },
        removePayments: function (cb) {
            var o = {
                command:'get',
                object:'merchant_financing_payment',
                params:{
                    param_where:{
                        merchant_financing_id:id,
                        status_sysname:'PENDING'
                    },
                    limit:10000,
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить платежи PENDING',{o : o, err : err}));

                async.eachSeries(Object.keys(res), function (key, cb) {
                    var payment = res[key];
                    var o = {
                        command:'remove',
                        object:'merchant_financing_payment',
                        params:{
                            id:payment.id,
                            rollback_key:rollback_key,
                            doNotSaveRollback:true
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось удалить платеж',{o : o, err : err}));
                        cb(null);
                    });

                },cb);
            });

        },
        modifyCalendarType: function (cb) {
            var o = {
                command:'modify',
                object:'merchant_financing_calendar',
                params:{
                    id:merchant_financing.current_calendar_id,
                    financing_type_sysname:'PERCENT',
                    rollback_key:rollback_key
                }
            };
            _t.api(o, cb);
        },
        setStatistic: function (cb) {
            var o = {
                command:'setStatisticInfo',
                object:'merchant_financing_calendar',
                params:{
                    id:merchant_financing.current_calendar_id,
                    rollback_key:rollback_key
                }
            };
            _t.api(o, cb);
        },
        modifyPercentAndType: function (cb) {
            merchant_financing.avl_proc_dly_withdraw_rate_calculated = day_percent;
            merchant_financing.financing_type_sysname = 'PERCENT';
            var params = {
                id:id,
                avl_proc_dly_withdraw_rate_calculated:day_percent,
                financing_type_sysname:'PERCENT',
                rollback_key:rollback_key
            };
            _t.modify(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось изменить тип финансирования и процент.',{params:params, err:err}));
                cb(null);
            })
        },
        addHistory: function (cb) { // Создадим запись в истории мерчанта
            var o = {
                merchant_financing_id: id,
                rollback_key:rollback_key
            };
            for (var i in merchant_financing) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant_financing[i];
            }
            _t.addHistory(obj, cb);
        }
    },function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!obj.doNotSaveRollback){
                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'changeToPercent', params:obj});
            }
            cb(null, new UserOk('Финансированию изменен тип на ПРОЦЕНТНЫЙ'));
        }
    });
};

Model.prototype.generateDocument = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();

    var merchant;
    var fin;
    var generated_file_tempname = Guid.create().value;

    var incData = funcs.cloneObj(obj);
    var ext;
    var lowest_turnover = 0;
    var fin_req;

    function toDocDateFormat(date){

        //«___» ______ 201_ г.

        var mdate = moment(date, 'DD.MM.YYYY');

        var mths_arr = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];

        var dd = mdate.locale('ru').format('D');
        var mth = mdate.locale('ru').format('M');
        var year = mdate.locale('ru').format('YYYY');

        return '«'+dd+'»'+ ' '+mths_arr[mth-1]+' '+ year+ ' г.'

    }


    async.series({
        getFinancing: function (cb) {
            // Получим финансирование

            _t.getById({id:id, object: 'merchant_financing'}, function (err, res) {

                if(err) return cb(new MyError('Не удалось получить финансирования', {id: id, err: err}));

                fin = res[0];

                cb(null);

            });
        },
        getMerchant: function (cb) {
            // Получим торговца

            var o = {
                command: 'getById',
                object: 'merchant',
                params: {
                    id: fin.merchant_id
                }
            };

            _t.api(o, function (err,res) {

                if(err) return cb(new MyError('Не удалось получить торговца', {o: o, err: err}));

                merchant = res[0];

                cb(null);

            });
        },
        checkFields: function (cb) {

            if(fin.financing_type_sysname == 'PERCENT'){
                if(!incData.payments_count && !fin.payments_count) return cb(new UserError('Не заполнено кол-во платежей для процентого финансирования'));
            }

            if(incData.document_sysname == 'MAIN_AGREEMENT_PDF' || incData.document_sysname == 'SUPPLEMENTARY_AGREEMENT_PDF'){

                if(!incData.agr_number)             return cb(new UserError('Не заполнено поле Номер договора'));
                //if(!incData.agr_date)               return cb(new UserError('Не заполнено поле Дата договора'));
                if(!merchant.name)              return cb(new UserError('Не заполнено поле Наименование торговца'));
                if(!merchant.short_name)              return cb(new UserError('Не заполнено поле Краткое Наименование торговца'));
                if(!incData.fio)                    return cb(new UserError('Не заполнено поле ФИО'));
                if(!incData.fio_short)                    return cb(new UserError('Не заполнено поле Фамилия И.О.'));
                if(!incData.executive)              return cb(new UserError('Не заполнено поле Исп. орган'));
//                if(!incData.executive_native && !merchant.executive)              return cb(new UserError('Не заполнено поле Исп. орган им. падеж'));
                if(!incData.grounds_end)            return cb(new UserError('Не заполнено поле окончание действующ...'));
                if(!incData.grounds)                return cb(new UserError('Не заполнено поле основание'));
                if(!merchant.legal_address)     return cb(new UserError('Не заполнено поле юр. адрес'));
                if(!merchant.real_address)      return cb(new UserError('Не заполнено поле факт. адрес'));
                if(!merchant.ogrn)              return cb(new UserError('Не заполнено поле ОГРН'));
                if(!merchant.inn || merchant.inn.toString().length < 10)               return cb(new UserError('Не заполнено поле ИНН или его долинна менее 10 символам'));
                //if(!merchant.okpo)              return cb(new UserError('Не заполнено поле ОКПО'));
                //if(!merchant.okato)             return cb(new UserError('Не заполнено поле ОКАТО'));
                if(!merchant.kpp)               return cb(new UserError('Не заполнено поле КПП'));
                if(!merchant.bik)               return cb(new UserError('Не заполнено поле БИК'));
                if(!merchant.rs || merchant.rs.toString().length != 20)                return cb(new UserError('Не заполнено поле Р/С или его долинна не равна 20 символам'));
                if(!merchant.ks)                return cb(new UserError('Не заполнено поле К/С'));
                if(!merchant.rko_bank)          return cb(new UserError('Не заполнено поле Банк (РКО)'));
                if(!fin.founding_amount)        return cb(new UserError('Не заполнено поле Сумма фианасирования'));
                if(!fin.founding_amount)        return cb(new UserError('Не заполнено поле Сумма возврата'));
                if(!fin.payments_start_date)    return cb(new UserError('Не заполнено поле дата начала платежей'));
                if(!fin.financing_close_date)   return cb(new UserError('Не заполнено поле дата окончания платежей'));

            }

            if(incData.document_sysname == 'SUPPLEMENTARY_AGREEMENT_PDF'){

                if(!merchant.phone)               return cb(new UserError('Не заполнено поле телефон'));
                if(!merchant.email)               return cb(new UserError('Не заполнено поле email'));

            }

            if(incData.document_sysname == 'PROXY'){

                if(!incData.gov_registration_date)               return cb(new UserError('Не заполнено поле дата регистрации юр. лица'));
                if(!incData.fns_number)               return cb(new UserError('Не заполнено поле номер налоговой'));
                if(!incData.fns_city)               return cb(new UserError('Не заполнено поле город налоговой'));

            }

            if(incData.document_sysname == 'SUPPLEMENTARY_AGREEMENT_PDF' || incData.document_sysname == 'APPLICATION_4'){
                if(!incData.number_and_date_acquiring_agreement)   return cb(new UserError('Не заполнено поле дата и номер договора эквайринга'));
            }

            cb(null);
        },
        getLowestTunrover: function(cb){

            if(incData.document_sysname == 'MAIN_AGREEMENT_PDF' && fin.financing_type_sysname == 'PERCENT'){

                async.series({

                    getReq: function(cb){
                        var o  = {
                            command: 'get',
                            object: 'financing_request',
                            params: {
                                where: [
                                    {
                                        key: 'through_number',
                                        val1: fin.through_number
                                    }
                                ],
                                collapseData: false
                            }
                        };

                        _t.api(o, function(err, res){

                            if(err) return cb(new UserError('Не удалось получить заявку на финансирование', {err:err, o:o}));

                            fin_req = res[0];

                            cb(null);
                        });
                    },
                    getTurnover: function(cb){

                        var o  = {
                            command: 'get',
                            object: 'request_turnover',
                            params: {
                                where: [
                                    {
                                        key: 'financing_request_id',
                                        val1: fin_req.id
                                    },
                                    {
                                        key: 'turnover',
                                        type: '>',
                                        val1: 0
                                    }
                                ],
                                sort: 'turnover',
                                limit: 1,
                                collapseData: false
                            }
                        };

                        _t.api(o, function(err, res){

                            if(err) return cb(new UserError('Не удалось получить запись оборота торговца', {err:err, o:o}));

                            lowest_turnover = res[0];

                            cb(null);
                        });
                    }

                }, cb);

            }else{
                cb(null);
            }

        },
        createDoc: function (cb) {
            // Подготовим файл документа на основе шаблона и данных собранных ранее

            var calendar;

            var ooo_or_ip = (merchant.name.toLowerCase().indexOf('индивидуальный предприниматель') > -1)? 'ip':'ooo';

            switch(incData.document_sysname){

                case 'MAIN_AGREEMENT_PDF':

                    ext = 'docx';

                    if(fin.financing_type_sysname == 'PERCENT'){


                        generateCalendar({
                            date_start: fin.payments_start_date,
                            payments_count: +incData.payments_count,
                            type: 'gov'
                        }, function (err, res) {
                            calendar = res;
                        });

                        fs.readFile('./templates/doc_agreement_'+ooo_or_ip+'_percent_tpl.docx', function (err, data) {
                            if (err) return cb(new MyError('Не удалось считать файл шаблона договора.', err));

                            var doc = new Docxtemplater(data);

                            var founding_amount = fin.founding_amount;
                            var founding_amount_words = (founding_amount)? rubles(founding_amount).replace(/ руб[а-я]+ 00 копеек/,'') : 'Ноль';
                            founding_amount_words = founding_amount_words.charAt(0).toUpperCase() + founding_amount_words.substr(1);
                            var vgf_comission = +fin.amount_to_return - +fin.founding_amount;
                            var vgf_comission_words = (vgf_comission)? rubles(vgf_comission).replace(/ руб[а-я]+ 00 копеек/,'') : 'Ноль';
                            vgf_comission_words = vgf_comission_words.charAt(0).toUpperCase() + vgf_comission_words.substr(1);
                            var daily_percent = +fin.avl_proc_dly_withdraw_rate;
                            var daily_percent_words = (daily_percent)? rubles(daily_percent).replace(/ руб[а-я]+ 00 копеек/,'') : 'Ноль';
                            daily_percent_words = daily_percent_words.charAt(0).toUpperCase() + daily_percent_words.substr(1);

                            lowest_turnover = lowest_turnover.turnover || '';
                            var lowest_turnover_words = (lowest_turnover)? rubles(lowest_turnover).replace(/ руб[а-я]+ 00 копеек/,'') : 'Ноль';
                            lowest_turnover_words = lowest_turnover_words.charAt(0).toUpperCase() + lowest_turnover_words.substr(1);

                            doc.setData({
                                "agr_number":              incData.agr_number || '',
                                //"agr_date":                toDocDateFormat(incData.agr_date) || '«___» ______ 201_ г.',
                                "merchant_name":           merchant.name || '',
                                "short_name":               merchant.short_name || '',
                                "fio":                     incData.fio || '',
                                "fio_short":               incData.fio_short || '',
                                "executive":               incData.executive || '',
                                "executive_native":        incData.executive_native || merchant.executive,
                                "grounds_end":             incData.grounds_end,
                                "grounds":                 incData.grounds,
                                "legal_address":           merchant.legal_address,
                                "fact_address":            merchant.real_address,
                                "ogrn":                    merchant.ogrn,
                                "inn":                     merchant.inn,
                                "okpo":                    merchant.okpo,
                                "okato":                   merchant.okato,
                                "kpp":                     merchant.kpp,
                                "bik":                     merchant.bik,
                                "rs":                      merchant.rs,
                                "ks":                      merchant.ks,
                                "bank_name":               merchant.rko_bank,
                                "avr_mth_turnover":        lowest_turnover,
                                "avr_mth_turnover_words":  lowest_turnover_words,
                                "founding_amount":         fin.founding_amount,
                                "founding_amount_words":   founding_amount_words,
                                "vgf_comission":           vgf_comission,
                                "vgf_comission_words":     vgf_comission_words,
                                "daily_percent":           daily_percent,
                                "daily_percent_words":     daily_percent_words,
                                "payment_start_date":      toDocDateFormat(fin.payments_start_date) || '«___» ______ 201_ г.',
                                "payment_end_date":        toDocDateFormat(moment(fin.payments_start_date, 'DD.MM.YYYY').add(9, 'months').format('DD.MM.YYYY')) || '«___» ______ 201_ г.'
                            });
                            doc.render();
                            var buf = doc.getZip().generate({type:"nodebuffer"});
                            fs.writeFile('./public/savedFiles/' + generated_file_tempname +'.'+ext,buf, function (err) {
                                if (err) return cb(new MyError('Не удалось записать файл testOutput.docx',{err:err}));
                                return cb(null, new UserOk('testOutput.docx успешно сформирован'));
                            });
                        });


                    }else if(fin.financing_type_sysname == 'FIXED'){

                        generateCalendar({
                            date_start: fin.payments_start_date,
                            payments_count: fin.payments_count,
                            type: 'gov'
                        }, function (err, res) {
                            calendar = res;
                        });

                        fs.readFile('./templates/doc_agreement_'+ooo_or_ip+'_fixed_tpl.docx', function (err, data) {

                            if (err) return cb(new MyError('Не удалось считать файл шаблона договора.', err));

                            var doc = new Docxtemplater(data);

                            var founding_amount = fin.founding_amount;
                            var founding_amount_words = (founding_amount)? rubles(founding_amount).replace(/ руб[а-я]+ 00 копеек/,'') : 'Ноль';
                            founding_amount_words = founding_amount_words.charAt(0).toUpperCase() + founding_amount_words.substr(1);

                            var vgf_comission = +fin.amount_to_return - +fin.founding_amount;
                            var vgf_comission_words = (vgf_comission)? rubles(vgf_comission).replace(/ руб[а-я]+ 00 копеек/,'') : 'Ноль';
                            vgf_comission_words = vgf_comission_words.charAt(0).toUpperCase() + vgf_comission_words.substr(1);

                            var payment_amount = +fin.payment_amount;
                            var payment_amount_words = (payment_amount)? rubles(payment_amount).replace(/ руб[а-я]+ 00 копеек/,'') : 'Ноль';
                            payment_amount_words = payment_amount_words.charAt(0).toUpperCase() + payment_amount_words.substr(1);

                            doc.setData({
                                "agr_number":              incData.agr_number || '',
                                //"agr_date":                toDocDateFormat(incData.agr_date) || '«___» ______ 201_ г.',
                                "merchant_name":           merchant.name || '',
                                "short_name":               merchant.short_name || '',
                                "fio":                     incData.fio || '',
                                "fio_short":               incData.fio_short || '',
                                "executive":               incData.executive || '',
                                "executive_native":        incData.executive_native || merchant.executive,
                                "grounds_end":             incData.grounds_end,
                                "grounds":                 incData.grounds,
                                "legal_address":           merchant.legal_address,
                                "fact_address":            merchant.real_address,
                                "ogrn":                    merchant.ogrn,
                                "inn":                     merchant.inn,
                                "okpo":                    merchant.okpo,
                                "okato":                   merchant.okato,
                                "kpp":                     merchant.kpp,
                                "bik":                     merchant.bik,
                                "rs":                      merchant.rs,
                                "ks":                      merchant.ks,
                                "bank_name":               merchant.rko_bank,
                                "founding_amount":         fin.founding_amount,
                                "payment_amount":          fin.payment_amount,
                                "payment_amount_words":    payment_amount_words,
                                "founding_amount_words":   founding_amount_words,
                                "vgf_comission":           vgf_comission,
                                "vgf_comission_words":     vgf_comission_words,
                                "payment_start_date":      toDocDateFormat(fin.payments_start_date) || '«___» ______ 201_ г.',
                                "payment_end_date":        toDocDateFormat(calendar[calendar.length -1]) || '«___» ______ 201_ г.'
                            });
                            doc.render();
                            var buf = doc.getZip().generate({type:"nodebuffer"});
                            fs.writeFile('./public/savedFiles/' + generated_file_tempname +'.'+ext,buf, function (err) {
                                if (err) return cb(new MyError('Не удалось записать файл testOutput.docx',{err:err}));
                                return cb(null, new UserOk('testOutput.docx успешно сформирован'));
                            });

                        });

                    }else{

                        return cb(new UserError('Выберите тип финансирования.'));

                    }

                    break;
                case 'SUPPLEMENTARY_AGREEMENT_PDF':


                    ext = 'docx';

                    if(fin.financing_type_sysname == 'PERCENT'){

                        generateCalendar({
                            date_start: fin.payments_start_date,
                            payments_count: +incData.payments_count,
                            type: 'gov'
                        }, function (err, res) {
                            calendar = res;
                        });

                        fs.readFile('./templates/doc_additional_agreement_'+ooo_or_ip+'_percent_tpl.docx', function (err, data) {

                            if (err) return cb(new MyError('Не удалось считать файл шаблона доп соглашения.', err));

                            var doc = new Docxtemplater(data);

                            var founding_amount = fin.founding_amount;
                            var founding_amount_words = (founding_amount)? rubles(founding_amount).replace(/ руб[а-я]+ 00 копеек/,'') : 'Ноль';
                            founding_amount_words = founding_amount_words.charAt(0).toUpperCase() + founding_amount_words.substr(1);

                            var vgf_comission = +fin.amount_to_return - +fin.founding_amount;
                            var vgf_comission_words = (vgf_comission)? rubles(vgf_comission).replace(/ руб[а-я]+ 00 копеек/,'') : 'Ноль';
                            vgf_comission_words = vgf_comission_words.charAt(0).toUpperCase() + vgf_comission_words.substr(1);

                            var daily_percent = +fin.avl_proc_dly_withdraw_rate;
                            var daily_percent_words = (daily_percent)? rubles(daily_percent).replace(/ руб[а-я]+ 00 копеек/,'') : 'Ноль';
                            daily_percent_words = daily_percent_words.charAt(0).toUpperCase() + daily_percent_words.substr(1);


                            var prepareData = {
                                "agr_number":              incData.agr_number || '',
                                //"agr_date":                toDocDateFormat(incData.agr_date) || '«___» ______ 201_ г.',
                                "merchant_name":           merchant.name || '',
                                "short_name":               merchant.short_name || '',
                                "fio":                     incData.fio || '',
                                "fio_native":              merchant.executive_fio || '',
                                "fio_short":               incData.fio_short || '',
                                "executive":               incData.executive || '',
                                "executive_native":        incData.executive_native || merchant.executive,
                                "grounds_end":             incData.grounds_end,
                                "grounds":                 incData.grounds,
                                "number_and_date_acquiring_agreement":                 incData.number_and_date_acquiring_agreement,
                                "legal_address":           merchant.legal_address,
                                "fact_address":            merchant.real_address,
                                "phone":                   merchant.phone,
                                "email":                   merchant.email,
                                "ogrn":                    merchant.ogrn,
                                "inn":                     merchant.inn,
                                "okpo":                    merchant.okpo,
                                "okato":                   merchant.okato,
                                "kpp":                     merchant.kpp,
                                "bik":                     merchant.bik,
                                "rs":                      merchant.rs,
                                "ks":                      merchant.ks,
                                "bank_name":               merchant.rko_bank,
                                "founding_amount":         fin.founding_amount,
                                "founding_amount_words":   founding_amount_words,
                                "vgf_comission":           vgf_comission,
                                "vgf_comission_words":     vgf_comission_words,
                                "daily_percent":           daily_percent,
                                "daily_percent_words":     daily_percent_words,
                                "transaction_params":      fin.avl_proc_dly_withdraw_rate + '% ('+daily_percent_words + ' ' +getNoun(daily_percent, 'процент', 'процента','процентов') + ')',
                                "payment_start_date":      toDocDateFormat(fin.payments_start_date) || '«___» ______ 201_ г.',
                                "payment_end_date":        toDocDateFormat(moment(fin.payments_start_date, 'DD.MM.YYYY').add(9, 'months').format('DD.MM.YYYY')) || '«___» ______ 201_ г.'
                            };

                            var splitInn = merchant.inn.toString().split('');
                            var innidx = 1;
                            for(var i in splitInn){

                                prepareData['inn'+innidx] = splitInn[i];
                                innidx++;
                            }

                            var splitRs = merchant.rs.toString().split('');
                            var rsidx = 1;
                            for(var k in splitRs){

                                prepareData['rs'+rsidx] = splitRs[k];
                                rsidx++;
                            }


                            doc.setData(prepareData);

                            doc.render();
                            var buf = doc.getZip().generate({type:"nodebuffer"});
                            fs.writeFile('./public/savedFiles/' + generated_file_tempname +'.'+ext,buf, function (err) {
                                if (err) return cb(new MyError('Не удалось записать файл testOutput.docx',{err:err}));
                                return cb(null, new UserOk('testOutput.docx успешно сформирован'));
                            });
                        });


                    }else if(fin.financing_type_sysname == 'FIXED'){

                        generateCalendar({
                            date_start: fin.payments_start_date,
                            payments_count: +incData.payments_count,
                            type: 'gov'
                        }, function (err, res) {
                            calendar = res;
                        });

                        fs.readFile('./templates/doc_additional_agreement_'+ooo_or_ip+'_fixed_tpl.docx', function (err, data) {

                            if (err) return cb(new MyError('Не удалось считать файл шаблона доп соглашения.', err));

                            var doc = new Docxtemplater(data);

                            var founding_amount = fin.founding_amount;
                            var founding_amount_words = (founding_amount)? rubles(founding_amount).replace(/ руб[а-я]+ 00 копеек/,'') : 'Ноль';
                            founding_amount_words = founding_amount_words.charAt(0).toUpperCase() + founding_amount_words.substr(1);

                            var vgf_comission = +fin.amount_to_return - +fin.founding_amount;
                            var vgf_comission_words = (vgf_comission)? rubles(vgf_comission).replace(/ руб[а-я]+ 00 копеек/,'') : 'Ноль';
                            vgf_comission_words = vgf_comission_words.charAt(0).toUpperCase() + vgf_comission_words.substr(1);

                            var payment_amount_words = (+fin.payment_amount)? rubles(+fin.payment_amount).replace(/ руб[а-я]+ 00 копеек/,'') : 'Ноль';
                            payment_amount_words = payment_amount_words.charAt(0).toUpperCase() + payment_amount_words.substr(1);


                            var prepareData = {
                                "agr_number":              incData.agr_number || '',
                                //"agr_date":                toDocDateFormat(incData.agr_date) || '«___» ______ 201_ г.',
                                "merchant_name":           merchant.name || '',
                                "short_name":               merchant.short_name || '',
                                "fio":                     incData.fio || '',
                                "fio_native":              merchant.executive_fio || '',
                                "fio_short":               incData.fio_short || '',
                                "executive":               incData.executive || '',
                                "executive_native":        incData.executive_native || merchant.executive,
                                "grounds_end":             incData.grounds_end,
                                "grounds":                 incData.grounds,
                                "number_and_date_acquiring_agreement":                 incData.number_and_date_acquiring_agreement,
                                "legal_address":           merchant.legal_address,
                                "fact_address":            merchant.real_address,
                                "phone":                   merchant.phone,
                                "email":                   merchant.email,
                                "ogrn":                    merchant.ogrn,
                                "inn":                     merchant.inn,
                                "okpo":                    merchant.okpo,
                                "okato":                   merchant.okato,
                                "kpp":                     merchant.kpp,
                                "bik":                     merchant.bik,
                                "rs":                      merchant.rs,
                                "ks":                      merchant.ks,
                                "bank_name":               merchant.rko_bank,
                                "founding_amount":         fin.founding_amount,
                                "founding_amount_words":   founding_amount_words,
                                "vgf_comission":           vgf_comission,
                                "vgf_comission_words":     vgf_comission_words,
                                "transaction_params":      fin.payment_amount + '( ' +payment_amount_words+ ' руб. 00 копеек )',
                                "payment_start_date":      toDocDateFormat(fin.payments_start_date) || '«___» ______ 201_ г.',
                                "payment_end_date":        toDocDateFormat(calendar[calendar.length -1]) || '«___» ______ 201_ г.'
                            };

                            var splitInn = merchant.inn.toString().split('');
                            var innidx = 1;
                            for(var i in splitInn){

                                prepareData['inn'+innidx] = splitInn[i];
                                innidx++;
                            }

                            var splitRs = merchant.rs.toString().split('');
                            var rsidx = 1;
                            for(var k in splitRs){

                                prepareData['rs'+rsidx] = splitRs[k];
                                rsidx++;
                            }


                            doc.setData(prepareData);

                            doc.render();
                            var buf = doc.getZip().generate({type:"nodebuffer"});
                            fs.writeFile('./public/savedFiles/' + generated_file_tempname +'.'+ext,buf, function (err) {
                                if (err) return cb(new MyError('Не удалось записать файл testOutput.docx',{err:err}));
                                return cb(null, new UserOk('testOutput.docx успешно сформирован'));
                            });
                        });

                    }else{

                        return cb(new UserError('Выберите тип финансирования.'));

                    }

                    break;
                case 'PAYMENT_SCHEDULE':

                    var template;
                    ext = 'xlsx';

                    generateCalendar({
                        date_start: fin.payments_start_date,
                        payments_count: +fin.payments_count,
                        type: 'gov'
                    }, function (err, res) {
                        calendar = res;
                    });


                    fs.readFile('./templates/doc_grafic_tpl.xlsx', function (err, data) {
                        if (err) return cb(new MyError('Не удалось считать файл шаблона test.xlsx.', err));
                        template = new XlsxTemplate(data);

                        var sheetNumber = 1;

                        var readyData = {
                            founding_amount: fin.founding_amount,
                            amount_to_return: fin.amount_to_return,
                            payments_count: fin.payments_count,
                            finish_date: fin.financing_close_date,
                            factoring_rate: fin.factoring_rate,
                            start_date: fin.payments_start_date,
                            payment_amount: fin.payment_amount,
                            executive_native: (merchant.name.toLowerCase().indexOf('индивидуальный предприниматель') > -1) ? ' ' : merchant.executive,
                            short_name: merchant.short_name,
                            fio_short: incData.fio_short,
                            payment: []
                        };

                        var idx = 1;

                        var lastPayment = fin.amount_to_return - (fin.payment_amount * (calendar.length - 1));

                        for(var i in calendar){

                            if(i == calendar.length -1){
                                readyData.payment.push({
                                    order: idx,
                                    date: calendar[i],
                                    amount: lastPayment
                                });
                            }else{
                                readyData.payment.push({
                                    order: idx,
                                    date: calendar[i],
                                    amount: fin.payment_amount
                                });
                            }

                            idx++;
                        }


                        template.substitute(sheetNumber, readyData);

                        var dataBuf = template.generate();

                        var binaryData = new Buffer(dataBuf, 'binary');


                        fs.writeFile('./public/savedFiles/' + generated_file_tempname+'.'+ext,binaryData, function (err) {

                            if (err) return cb(new MyError('Не удалось записать файл testOutput.xlsx',{err:err}));

                            return cb(null, new UserOk('testOutput.xlsx успешно сформирован'));

                        });

                    });


                    break;
                case 'APPLICATION_4':

                    ext = 'docx';

                    if(fin.financing_type_sysname == 'PERCENT'){

                        generateCalendar({
                            date_start: fin.payments_start_date,
                            payments_count: +incData.payments_count,
                            type: 'gov'
                        }, function (err, res) {
                            calendar = res;
                        });

                        fs.readFile('./templates/doc_application_4_'+ooo_or_ip+'_percent_tpl.docx', function (err, data) {

                            if (err) return cb(new MyError('Не удалось считать файл шаблона приложения №4.', err));

                            var doc = new Docxtemplater(data);

                            var daily_percent = +fin.avl_proc_dly_withdraw_rate;
                            var daily_percent_words = (daily_percent)? rubles(daily_percent).replace(/ руб[а-я]+ 00 копеек/,'') : 'Ноль';
                            daily_percent_words = daily_percent_words.charAt(0).toUpperCase() + daily_percent_words.substr(1);


                            var prepareData = {
                                "agr_number":              incData.agr_number || '',
                                "merchant_name":           merchant.name || '',
                                "short_name":               merchant.short_name || '',
                                "fio":                     incData.fio || '',
                                "fio_native":              merchant.executive_fio || '',
                                "fio_short":               incData.fio_short || '',
                                "executive":               incData.executive || '',
                                "executive_native":        incData.executive_native || merchant.executive,
                                "grounds_end":             incData.grounds_end,
                                "grounds":                 incData.grounds,
                                "number_and_date_acquiring_agreement":                 incData.number_and_date_acquiring_agreement,
                                "legal_address":           merchant.legal_address,
                                "fact_address":            merchant.real_address,
                                "phone":                   merchant.phone,
                                "email":                   merchant.email,
                                "ogrn":                    merchant.ogrn,
                                "inn":                     merchant.inn,
                                "okpo":                    merchant.okpo,
                                "okato":                   merchant.okato,
                                "kpp":                     merchant.kpp,
                                "bik":                     merchant.bik,
                                "rs":                      merchant.rs,
                                "ks":                      merchant.ks,
                                "bank_name":               merchant.rko_bank,
                                "founding_amount":         fin.founding_amount,
                                "transaction_params":      fin.avl_proc_dly_withdraw_rate + '% ('+daily_percent_words + ' ' +getNoun(daily_percent, 'процент', 'процента','процентов') + ')',
                                "payment_start_date":      toDocDateFormat(fin.payments_start_date) || '«___» ______ 201_ г.',
                                "payment_end_date":        toDocDateFormat(moment(fin.payments_start_date, 'DD.MM.YYYY').add(9, 'months').format('DD.MM.YYYY')) || '«___» ______ 201_ г.'
                            };

                            var splitInn = merchant.inn.toString().split('');
                            var innidx = 1;
                            for(var i in splitInn){

                                prepareData['inn'+innidx] = splitInn[i];
                                innidx++;
                            }

                            var splitRs = merchant.rs.toString().split('');
                            var rsidx = 1;
                            for(var k in splitRs){

                                prepareData['rs'+rsidx] = splitRs[k];
                                rsidx++;
                            }


                            doc.setData(prepareData);

                            doc.render();
                            var buf = doc.getZip().generate({type:"nodebuffer"});
                            fs.writeFile('./public/savedFiles/' + generated_file_tempname +'.'+ext,buf, function (err) {
                                if (err) return cb(new MyError('Не удалось записать файл testOutput.docx',{err:err}));
                                return cb(null, new UserOk('testOutput.docx успешно сформирован'));
                            });
                        });


                    }else if(fin.financing_type_sysname == 'FIXED'){

                        generateCalendar({
                            date_start: fin.payments_start_date,
                            payments_count: +fin.payments_count,
                            type: 'gov'
                        }, function (err, res) {
                            calendar = res;
                        });

                        fs.readFile('./templates/doc_application_4_'+ooo_or_ip+'_fixed_tpl.docx', function (err, data) {

                            if (err) return cb(new MyError('Не удалось считать файл шаблона приложения №4.', err));

                            var doc = new Docxtemplater(data);

                            var daily_percent = +fin.avl_proc_dly_withdraw_rate;
                            var daily_percent_words = (daily_percent)? rubles(daily_percent).replace(/ руб[а-я]+ 00 копеек/,'') : 'Ноль';
                            daily_percent_words = daily_percent_words.charAt(0).toUpperCase() + daily_percent_words.substr(1);

                            var payment_amount_words = (+fin.payment_amount)? rubles(+fin.payment_amount).replace(/ руб[а-я]+ 00 копеек/,'') : 'Ноль';
                            payment_amount_words = payment_amount_words.charAt(0).toUpperCase() + payment_amount_words.substr(1);


                            var prepareData = {
                                "agr_number":              incData.agr_number || '',
                                "merchant_name":           merchant.name || '',
                                "short_name":               merchant.short_name || '',
                                "fio":                     incData.fio || '',
                                "fio_native":              merchant.executive_fio || '',
                                "fio_short":               incData.fio_short || '',
                                "executive":               incData.executive || '',
                                "executive_native":        incData.executive_native || merchant.executive,
                                "grounds_end":             incData.grounds_end,
                                "grounds":                 incData.grounds,
                                "number_and_date_acquiring_agreement":                 incData.number_and_date_acquiring_agreement,
                                "legal_address":           merchant.legal_address,
                                "fact_address":            merchant.real_address,
                                "phone":                   merchant.phone,
                                "email":                   merchant.email,
                                "ogrn":                    merchant.ogrn,
                                "inn":                     merchant.inn,
                                "okpo":                    merchant.okpo,
                                "okato":                   merchant.okato,
                                "kpp":                     merchant.kpp,
                                "bik":                     merchant.bik,
                                "rs":                      merchant.rs,
                                "ks":                      merchant.ks,
                                "bank_name":               merchant.rko_bank,
                                "founding_amount":         fin.founding_amount,
                                "transaction_params":      fin.payment_amount + '( ' +payment_amount_words+ ' руб. 00 копеек )',
                                "payment_start_date":      toDocDateFormat(fin.payments_start_date) || '«___» ______ 201_ г.',
                                "payment_end_date":        toDocDateFormat(calendar[calendar.length -1]) || '«___» ______ 201_ г.'
                            };

                            var splitInn = merchant.inn.toString().split('');
                            var innidx = 1;
                            for(var i in splitInn){

                                prepareData['inn'+innidx] = splitInn[i];
                                innidx++;
                            }

                            var splitRs = merchant.rs.toString().split('');
                            var rsidx = 1;
                            for(var k in splitRs){

                                prepareData['rs'+rsidx] = splitRs[k];
                                rsidx++;
                            }


                            doc.setData(prepareData);

                            doc.render();
                            var buf = doc.getZip().generate({type:"nodebuffer"});
                            fs.writeFile('./public/savedFiles/' + generated_file_tempname +'.'+ext,buf, function (err) {
                                if (err) return cb(new MyError('Не удалось записать файл testOutput.docx',{err:err}));
                                return cb(null, new UserOk('testOutput.docx успешно сформирован'));
                            });
                        });

                    }else{

                        return cb(new UserError('Выберите тип финансирования.'));

                    }

                    break;
                case 'PROXY':

                    ext = 'docx';

                    fs.readFile('./templates/doc_doverennost_tpl.docx', function (err, data) {

                        if (err) return cb(new MyError('Не удалось считать файл шаблона доверенность.', err));

                        var doc = new Docxtemplater(data);

                        var founding_amount = fin.founding_amount;
                        var founding_amount_words = (founding_amount)? rubles(founding_amount).replace(/ руб[а-я]+ 00 копеек/,'') : 'Ноль';
                        founding_amount_words = founding_amount_words.charAt(0).toUpperCase() + founding_amount_words.substr(1);

                        var vgf_comission = +fin.amount_to_return - +fin.founding_amount;
                        var vgf_comission_words = (vgf_comission)? rubles(vgf_comission).replace(/ руб[а-я]+ 00 копеек/,'') : 'Ноль';
                        vgf_comission_words = vgf_comission_words.charAt(0).toUpperCase() + vgf_comission_words.substr(1);

                        var prepareData = {
                            "agr_number":              incData.agr_number || '',
                            //"agr_date":                toDocDateFormat(incData.agr_date) || '«___» ______ 201_ г.',
                            "gov_registration_date":    incData.gov_registration_date,
                            "fns_number":               incData.fns_number,
                            "fns_city":                 incData.fns_city,
                            "merchant_name":           merchant.name || '',
                            "short_name":              merchant.short_name || '',
                            "fio":                     incData.fio || '',
                            "fio_native":              merchant.executive_fio || '',
                            "fio_short":               incData.fio_short || '',
                            "executive":               incData.executive || '',
                            "executive_native":        incData.executive_native || merchant.executive,
                            "grounds_end":             incData.grounds_end,
                            "grounds":                 incData.grounds,
                            "legal_address":           merchant.legal_address,
                            "fact_address":            merchant.real_address,
                            "phone":                   merchant.phone,
                            "email":                   merchant.email,
                            "ogrn":                    merchant.ogrn,
                            "inn":                     merchant.inn,
                            "okpo":                    merchant.okpo,
                            "okato":                   merchant.okato,
                            "kpp":                     merchant.kpp,
                            "bik":                     merchant.bik,
                            "rs":                      merchant.rs,
                            "ks":                      merchant.ks,
                            "bank_name":               merchant.rko_bank
                        };

                        doc.setData(prepareData);

                        doc.render();
                        var buf = doc.getZip().generate({type:"nodebuffer"});
                        fs.writeFile('./public/savedFiles/' + generated_file_tempname +'.'+ext,buf, function (err) {
                            if (err) return cb(new MyError('Не удалось записать файл testOutput.docx',{err:err}));
                            return cb(null, new UserOk('testOutput.docx успешно сформирован'));
                        });
                    });


                    break;

                case 'SERVICE_NOTE':

                    ext = 'docx';

                    fs.readFile('./templates/doc_sluzhebnaya_zapiska_tpl.docx', function (err, data) {

                        if (err) return cb(new MyError('Не удалось считать файл шаблона доверенность.', err));

                        var doc = new Docxtemplater(data);

                        var prepareData = {
                            "short_name":           merchant.short_name || ''
                        };

                        doc.setData(prepareData);

                        doc.render();
                        var buf = doc.getZip().generate({type:"nodebuffer"});
                        fs.writeFile('./public/savedFiles/' + generated_file_tempname +'.'+ext,buf, function (err) {
                            if (err) return cb(new MyError('Не удалось записать файл testOutput.docx',{err:err}));
                            return cb(null, new UserOk('testOutput.docx успешно сформирован'));
                        });
                    });

                    break;
                default:
                    break;
            }



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
            cb(null, new UserOk('Ок.',{filename:generated_file_tempname+'.'+ext,path:'/savedFiles/'}));
        }
    });
};



Model.prototype.report_merchant_factoring = function (obj, cb) { // Отчет о состоянии факторинговых платежей
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;

    var report_date = obj.report_date || funcs.getDate();

    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();

    var fin;
    var merchant;
    var payments;
    var payments_ids = [];

    var d_payments;

    var readyData;
    var template;
    var binaryData;
    var filename;
    var name = 'report_merchant_factoring.xlsx';

    async.series({
        getMerchant: function (cb) {

            var o = {
                command: 'get',
                object: 'merchant',
                params: {
                    param_where: {
                        id: id
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
        getFin: function (cb) {
            var o = {
                command: 'get',
                object: 'merchant_financing',
                params: {
                    param_where: {
                        id: merchant.current_financing_id
                    },
                    collapseData: false
                }
            };

            _t.api(o, function (err, res) {

                if(err) return cb(new UserError('Не удалось получить финансирование', {err:err, o:o}));

                fin = res[0];

                cb(null);

            });
        },
        getPayments: function (cb) {

            var o = {
                command: 'get',
                object: 'merchant_financing_payment',
                params: {
                    where: [
                        {
                            key: 'merchant_financing_id',
                            val1: fin.id
                        },
                        {
                            key: 'payment_date',
                            type: '<=',
                            val1: report_date
                        }
                    ],
                    collapseData: false,
                    sort: {
                        columns: 'payment_date',
                        direction: 'ASC'
                    }
                }
            };

            _t.api(o, function (err, res) {

                if(err) return cb(new UserError('Не удалось получить платежи', {err:err, o:o}));

                payments = res;

                for(var i in payments){
                    payments_ids.push(payments[i].id);
                }

                cb(null);

            });
        },
        getDailyPayments: function(cb){
            if (!payments_ids.length) return cb(null); // Платежей не найдено
            var o = {
                command:'get',
                object:'daily_payment',
                params:{
                    where: [{
                        key: 'merchant_financing_payment_id',
                        type: 'in',
                        val1: payments_ids
                    }],
                    collapseData:false
                }
            };

            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить ежедневные платежи',{o : o, err : err}));

                d_payments = res;

                cb(null);
            });

        },
        prepareData: function (cb) {

            var paid_by_sch = 0;

            for(var i in payments){
                var p = payments[i];

                if(moment(p.payment_date, 'DD.MM.YYYY') < moment(report_date, 'DD.MM.YYYY')){
                    paid_by_sch += +p.pending_amount;
                }
            }

            var total_returned = 0;
            var total_pending = 0;
            var total_paid_invoice_payments_amount = 0;
            var default_payments_count = 0;

            for(var k in payments){
                var p = payments[k];
                total_pending += +p.pending_amount;
                total_returned += +p.paid_amount;

                total_paid_invoice_payments_amount += (p.closing_type_sysname == 'REMITTANCE')? +p.paid_amount : 0;

                if(p.status_sysname == 'DEFAULT'){
                    default_payments_count++;

                }
            }


            readyData = {
                report_date: report_date,
                merchant_id: merchant.id,
                short_name: merchant.short_name,
                payments_start_date: fin.payments_start_date,
                founding_amount: fin.founding_amount,
                factoring_rate: +(fin.factoring_rate / 100),
                amount_to_return: fin.amount_to_return,
                financing_type: fin.financing_type,
                payments_per_week: 5,
                payments_count: fin.payments_count,
                amount_per_day: fin.payment_amount,
                default_payments_count: default_payments_count,
                default_payments_amount: +default_payments_count * +fin.payment_amount,
                paid_by_invoice_amount: +total_paid_invoice_payments_amount,
                paid_amount_by_schedule: paid_by_sch,

                paid_amount: +total_returned,

                pending_amount_by_schdule: +fin.amount_to_return - paid_by_sch,
                pending_amount: fin.to_return,
                paid_percent_by_shedule: Math.floor(paid_by_sch / +fin.amount_to_return * 100) / 100,
                paid_percent: Math.floor(+total_returned / +fin.amount_to_return * 100) / 100,
                total_pending: +total_pending,
                total_paid: +total_returned,
                margin: (+total_pending - +total_returned > 0)? '('+ Math.round(Math.abs(+total_pending - +total_returned)*100)/100+')' : Math.round(Math.abs(+total_pending - +total_returned)*100)/100,
                t1: []
            };

            cb(null);
        },
        prepareData2: function (cb) {

            for(var i in payments){
                var p = payments[i];

                readyData.t1.push({
                    payment_date: p.payment_date,
                    pending: p.pending_amount,
                    paid: +p.paid_amount || 0,
                    type: p.closing_type
                });
            }

//            + +p.paid_amount_later

            cb(null);

        },
        getTemplate: function (cb) {

            fs.readFile('./templates/'+name, function (err, data) {
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

            filename = 'Отчет по платежам торговца.xlsx';

            fs.writeFile('./public/savedFiles/' + filename,binaryData, function (err) {
                if (err) return cb(new MyError('Не удалось записать файл testOutput.xlsx',{err:err}));
                return cb(null, new UserOk('testOutput.xlsx успешно сформирован'));
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
            cb(null, new UserOk('Ок',{filename:filename,path:'/savedFiles/'}));
        }
    });
};

Model.prototype.report_payments_margin = function (obj, cb) { // Отчет об отставании / опережении графика платежей
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;

    var report_date = obj.report_date || funcs.getDate();

    //if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();

    var getCutOffAmount = function (o) {
        var pmnts = o.payments || [];
        var status_sysname = o.status_sysname;
        var start = o.start;
        var end = o.end;
        var amount_field = o.amount_field || 'pending_amount';
        var date_field = o.date_field || 'payment_date';
        var count = o.count;

        end = (typeof end !== 'undefined')? end : report_date;
        var res = 0;
        var cnt = 0;
        for (var j in pmnts) {
            var pmnt = pmnts[j];
            if (status_sysname && pmnt.status_sysname !== status_sysname) continue;
            // За отчетный период
            if (start && end){
                if (funcs.date_A_more_or_equal_B(pmnt[date_field], start) && funcs.date_A_more_or_equal_B(end, pmnt[date_field])){
                    res += +pmnt[amount_field] || 0;
                    cnt++;
                }
            }else if (start){
                if (funcs.date_A_more_or_equal_B(pmnt[date_field], start)){
                    res += +pmnt[amount_field] || 0;
                    cnt++;
                }
            }else if (end){
                if (funcs.date_A_more_or_equal_B(end, pmnt[date_field])){
                    res += +pmnt[amount_field] || 0;
                    cnt++;
                }
            }else{
                res += +pmnt[amount_field] || 0;
                cnt++;
            }
        }
        return (count)? cnt : res;
    };

    var fins;
    var payments;
    var readyData;
    var template;
    var binaryData;
    var filename;
    var name = 'report_payments_margin.xlsx';

    var total_founding_amount = 0;
    var total_payment_amount = 0;
    var total_gross_profit = 0;
    var total_total_collected = 0;
    var total_total_pending = 0;
    var total_pending_by_schedule = 0;
    var total_schedule_margin = 0;

    async.series({
        getFin: function (cb) {

            var o = {
                command: 'get',
                object: 'merchant_financing',
                params: {
                    where: [
                        {
                            key: 'status_sysname',
                            type: 'in',
                            val1: ['ACQUIRING_IN_PROCCESS','CLOSED']
                        }
                    ],
                    sort:'created',
                    collapseData: false
                }
            };

            _t.api(o, function (err, res) {

                if(err) return cb(new UserError('Не удалось получить финансирования', {err:err, o:o}));

                fins = res;

                cb(null);

            });
        },
        prepareData2: function (cb) {


            readyData = {
                t1: []
            };

            var idx = 0;

            async.eachSeries(fins, function (item, cb) {

                var o = {
                    command: 'get',
                    object: 'merchant_financing_payment',
                    params: {
                        param_where: {
                            merchant_financing_id: item.id
                        },
                        collapseData: false,
                        sort: {
                            columns: 'payment_date',
                            direction: 'ASC'
                        }
                    }
                };

                _t.api(o, function (err, res) {

                    if(err) return cb(new UserError('Не удалось получить плтежи asv', {err:err, o:o}));

                    payments = res;

                    // var paid_by_sch = 0;
                    // var days_count_to_report_date = 0;

                    // for(var i in payments){
                    //     var p = payments[i];
                    //
                    //     if(moment(p.payment_date, 'DD.MM.YYYY') < moment(report_date, 'DD.MM.YYYY')){
                    //         paid_by_sch += +p.pending_amount;
                    //         days_count_to_report_date ++;
                    //     }
                    // }

                    var paid_by_sch = getCutOffAmount({payments:payments, amount_field:'pending_amount', date_field:'payment_date'});
                    var days_count_to_report_date = getCutOffAmount({payments:payments, amount_field:'pending_amount', date_field:'payment_date', count:true});
                    var total_returned = getCutOffAmount({payments:payments, amount_field:'paid_amount', date_field:'paid_date'});

                    var calendar;
                    var calendar2;
                    async.series({
                        genCalender1:function(cb){
                            generateCalendar({
                                date_start: moment(report_date, 'DD.MM.YYYY').format('DD.MM.YYYY'),
                                payments_count: +item.to_return / +item.payment_amount,
                                type: 'gov'
                            }, function (err, res) {
                                calendar = res;
                                cb(null);
                            });
                        },
                        genCalender2:function(cb){
                            generateCalendar({
                                date_start: moment(item.payments_start_date, 'DD.MM.YYYY').format('DD.MM.YYYY'),
                                payments_count: +item.amount_to_return / +item.payment_amount,
                                type: 'gov'
                            }, function (err, res) {
                                calendar2 = res;
                                cb(null);
                            });
                        },
                        pushData:function(cb){

                            if(item.complete_percent < 100){

                                readyData.t1.push({
                                    index :     idx,
                                    agr_number :    item.through_number,
                                    short_name :    item.merchant_short_name,
                                    financing_type: (item.financing_type_sysname == 'FIXED')? 'Фикс' : 'Процент',
                                    founding_date :     item.financing_date,
                                    founding_amount :   item.founding_amount,
                                    factoring_rate :    item.factoring_rate,
                                    amount_to_return :  item.amount_to_return,
                                    payments_count :    item.payments_count,
                                    payment_amount :    item.payment_amount,
                                    daily_percent :     item.avl_proc_dly_withdraw_rate,
                                    gross_profit :      +item.amount_to_return - +item.founding_amount,
                                    total_collected :   total_returned,
                                    total_pending :     item.to_return,
                                    pending_by_schedule : +item.amount_to_return - paid_by_sch,
                                    complete_percent :  (+total_returned / +item.amount_to_return * 100) / 100,
                                    closing_date_by_schedule : calendar2[calendar2.length - 1],
                                    closing_date :      calendar[calendar.length - 1],
                                    margin_color :  (item.to_return < +item.amount_to_return - paid_by_sch)? '' : 'lll',//(+item.to_return - (+item.amount_to_return - paid_by_sch) < item.to_return)? 'lll' : '',
                                    schedule_margin :    (+item.to_return - (+item.amount_to_return - paid_by_sch) >= item.to_return)? 0 : +item.to_return - (+item.amount_to_return - paid_by_sch),
                                    work_days_count_to_report_date : days_count_to_report_date,
                                    to_close_date_payments_count : days_count_to_report_date + calendar.length,
                                    manager :            item.manager_name + ' ' + item.manager_lastname
                                });

                                idx ++;

                                total_founding_amount += +item.founding_amount;
                                total_payment_amount += +item.payment_amount;
                                total_gross_profit += (+item.amount_to_return - +item.founding_amount);
                                total_total_collected += +total_returned;
                                total_total_pending += +item.to_return;
                                total_pending_by_schedule += (+item.amount_to_return - paid_by_sch);
                                total_schedule_margin += (+item.to_return - (+item.amount_to_return - paid_by_sch));


                            }


                            cb(null);
                        }
                    },cb);
                });

            },cb);

        },
        prepareData3: function (cb) {

            readyData.total_founding_amount = total_founding_amount;
            readyData.total_payment_amount = total_payment_amount;
            readyData.total_gross_profit = total_gross_profit;
            readyData.total_total_collected = total_total_collected;
            readyData.total_total_pending = total_total_pending;
            readyData.total_pending_by_schedule = total_pending_by_schedule;
            readyData.total_schedule_margin = total_schedule_margin;

            cb(null);

        },
        getTemplate: function (cb) {

            fs.readFile('./templates/'+name, function (err, data) {
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

            filename = 'Прогноз по закрытию ' + report_date + '.xlsx';

            fs.writeFile('./public/savedFiles/' + filename,binaryData, function (err) {
                if (err) return cb(new MyError('Не удалось записать файл testOutput.xlsx',{err:err}));
                return cb(null, new UserOk('testOutput.xlsx успешно сформирован'));
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
            cb(null, new UserOk('Ок',{filename:filename,path:'/savedFiles/'}));
        }
    });
};

Model.prototype.report_financing_request = function (obj, cb) { // Отчет по заявкам

    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }

    var _t = this;
    var id = obj.id;

    var from_date = obj.from_date || moment().add(-1, 'week').format('DD.MM.YYYY');
    var to_date = obj.to_date || moment().format('DD.MM.YYYY');

    var report_date = obj.report_date || funcs.getDate();
    var rollback_key = obj.rollback_key || rollback.create();

    var requests;
    var trh_nums = [];
    var fins;
    var all_fins;

    var payments;
    var readyData;
    var template;
    var binaryData;
    var filename;
    var name = 'report_financing_request.xlsx';

    async.series({

        getRequests: function (cb) {

            var o = {
                command: 'get',
                object: 'financing_request',
                params: {
                    where: [
                        {
                            key: 'request_date',
                            type: '>=',
                            val1: from_date
                        },
                        {
                            key: 'request_date',
                            type: '<=',
                            val1: to_date
                        }
                    ],
                    sort:'created',
                    collapseData: false
                }
            };

            _t.api(o, function (err, res) {

                if(err) return cb(new UserError('Не удалось получить заявки', {err:err,o:o}));

                requests = res;

                for(var i in res){
                    trh_nums.push(res[i].through_number);
                }


                cb(null);

            });
        },
        getFins: function (cb) {


            var o = {
                command: 'get',
                object: 'merchant_financing',
                params: {
                    where: [
                        {
                            key: 'status_sysname',
                            type: 'in',
                            val1: ['ACQUIRING_IN_PROCCESS','CLOSED']
                        },
                        {
                            key: 'through_number',
                            type: 'in',
                            val1: trh_nums
                        }
                    ],
                    sort:'created',
                    collapseData: false
                }
            };

            _t.api(o, function (err, res) {

                if(err) return cb(new UserError('Не удалось получить финансирования', {err:err, o:o}));

                fins = res;


                cb(null);

            });
        },
        getAllFins: function (cb) {


            var o = {
                command: 'get',
                object: 'merchant_financing',
                params: {
                    where: [
                        {
                            key: 'status_sysname',
                            type: 'in',
                            val1: ['ACQUIRING_IN_PROCCESS','CLOSED']
                        }
                    ],
                    sort:'created',
                    collapseData: false
                }
            };

            _t.api(o, function (err, res) {

                if(err) return cb(new UserError('Не удалось получить финансирования', {err:err, o:o}));

                all_fins = res;

                cb(null);

            });
        },
        prepareData2: function (cb) {


            var last_1_week_number_from = moment(to_date, 'DD.MM.YYYY').startOf('isoweek');
            var last_1_week_number_to = moment(to_date, 'DD.MM.YYYY');

            var last_2_week_number_from = moment(to_date, 'DD.MM.YYYY').add(-1, 'week').startOf('isoweek');
            var last_2_week_number_to = last_2_week_number_from.add(6, 'days');

            var last_3_week_number_from = moment(to_date, 'DD.MM.YYYY').add(-2, 'week').startOf('isoweek');
            var last_3_week_number_to = last_3_week_number_from.add(6, 'days');

            var last_4_week_number_from = moment(to_date, 'DD.MM.YYYY').add(-3, 'week').startOf('isoweek');
            var last_4_week_number_to = last_4_week_number_from.add(6, 'days');

            var last_1_week_total = 0;
            var last_2_week_total = 0;
            var last_3_week_total = 0;
            var last_4_week_total = 0;

            for(var i in all_fins){
                var f = all_fins[i];

                if(f.money_sent){

                    console.log(moment(f.financing_date, 'DD.MM.YYYY').format('DD.MM.YYYY'), last_1_week_number_from.format('DD.MM.YYYY'));
                    console.log(moment(f.financing_date, 'DD.MM.YYYY').format('DD.MM.YYYY'), last_1_week_number_to.format('DD.MM.YYYY'));

                    if( moment(f.financing_date, 'DD.MM.YYYY') <= last_1_week_number_from &&  moment(f.financing_date, 'DD.MM.YYYY') >= last_1_week_number_to){
                        last_1_week_total += f.founding_amount;
                    }
                    if( moment(f.financing_date, 'DD.MM.YYYY') <= last_2_week_number_from &&  moment(f.financing_date, 'DD.MM.YYYY') >= last_2_week_number_to){
                        last_2_week_total += f.founding_amount;
                    }

                    if( moment(f.financing_date, 'DD.MM.YYYY') <= last_3_week_number_from &&  moment(f.financing_date, 'DD.MM.YYYY') >= last_3_week_number_to){
                        last_3_week_total += f.founding_amount;
                    }

                    if( moment(f.financing_date, 'DD.MM.YYYY') <= last_4_week_number_from &&  moment(f.financing_date, 'DD.MM.YYYY') >= last_4_week_number_to){
                        last_4_week_total += f.founding_amount;
                    }
                }
            }


            readyData = {
                from_date: from_date,
                to_date: to_date,
                report_date: report_date,

                last_1_week_number: 'Неделя №: ' + last_1_week_number_from.format('WW'),
                last_2_week_number: 'Неделя №: ' + last_2_week_number_from.format('WW'),
                last_3_week_number: 'Неделя №: ' + last_3_week_number_from.format('WW'),
                last_4_week_number: 'Неделя №: ' + last_4_week_number_from.format('WW'),

                last_1_week_total: last_1_week_total,
                last_2_week_total: last_2_week_total,
                last_3_week_total: last_3_week_total,
                last_4_week_total: last_4_week_total,

                t1: []
            };

            console.log(readyData);

            var index = 0;

            for(var k in requests){

                var r = requests[k];

                var thisfin = undefined;

                for(var j in fins){
                    var fin = fins[j];
                    if(fin.through_number == r.through_number){
                        thisfin = fin;
                    }
                }

                var findate = (thisfin)? thisfin.financing_date : (r.financing_date)? r.financing_date : '-';

                readyData.t1.push({
                    index :  index,
                    arg_number : r.through_number,
                    request_date : r.request_date,
                    short_name : r.short_name || r.merchant_name,
                    request_type : r.financing_request_type,
                    business_type : r.business_type,
                    financing_date : findate,
                    week_number :  (findate.toString().length > 1) ? moment(findate, 'DD.MM.YYYY').format('WW') : '-',
                    founding_amount : r.founding_amount,
                    factoring_rate : +r.factoring_rate / 100,
                    amount_to_return : r.amount_to_return,
                    payments_count : r.payments_count,
                    gross_profit : r.amount_to_return - r.founding_amount,
                    manager : r.manager_lastname,
                    status : r.request_status
                });

                index++;
            }

            cb(null);
        },
        getTemplate: function (cb) {

            fs.readFile('./templates/'+name, function (err, data) {
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

            filename = 'Отчёт по заявкам '+report_date+'.xlsx';

            fs.writeFile('./public/savedFiles/' + filename,binaryData, function (err) {
                if (err) return cb(new MyError('Не удалось записать файл testOutput.xlsx',{err:err}));
                return cb(null, new UserOk('testOutput.xlsx успешно сформирован'));
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
            cb(null, new UserOk('Ок',{filename:filename,path:'/savedFiles/'}));
        }
    });
};

Model.prototype.report_invoices = function (obj, cb) { // Отчет по заявкам

    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }

    var _t = this;

    var merchant_id = obj.merchant_id || false;

    var from_date = obj.from_date || moment().add(-1, 'months').format('DD.MM.YYYY');
    var to_date = obj.to_date || moment().format('DD.MM.YYYY');

    var report_date = obj.report_date || funcs.getDate();
    var rollback_key = obj.rollback_key || rollback.create();


    var invoices;
    var merchant;
    var merchants;
    var fin;
    var fins;

    var readyData;
    var template;
    var binaryData;
    var filename;
    var name = 'report_invoices.xlsx';

    async.series({
        getMerchant: function(cb){


            var o = {
                command:'get',
                object:'merchant',
                params:{
                    collapseData:false
                }
            };

            if(merchant_id){
                o.params.param_where = {
                    id: merchant_id
                }
            }

            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить торговца',{o : o, err : err}));

                merchants = res;

                if(merchant_id){
                    merchant = res[0];
                }

                cb(null);

            });




        },
        getFinancing: function(cb){

            var o = {
                command:'get',
                object:'merchant_financing',
                params:{
                    collapseData:false
                }
            };

            if(merchant_id){
                o.params.param_where = {
                    id: merchant.current_financing_id
                }
            }


            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить финансирование торговца',{o : o, err : err}));

                fins = res;

                if(merchant_id){
                    fin = res[0];
                }

                cb(null);
            });
        },
        getInvoices: function (cb) {

            var o = {
                command: 'get',
                object: 'invoice',
                params: {
                    where: [],
                    sort:'created',
                    collapseData: false
                }
            };

            if(fin){
                o.params.where.push({
                    key: "merchant_financing_id",
                    val1: fin.id
                });
            }else{
                var fins_ids = [];

                for(var i in fins){
                    fins_ids.push(fins[i].id);
                }

                o.params.where.push({
                    key: "merchant_financing_id",
                    type: 'in',
                    val1: fins_ids
                });
            }

            if(from_date){
                o.params.where.push({
                    key: "invoice_date",
                    type: '>=',
                    val1: from_date
                });
            }

            if(to_date){
                o.params.where.push({
                    key: "invoice_date",
                    type: '<=',
                    val1: to_date
                });
            }


            console.log(o);
            console.log(o);

            _t.api(o, function (err, res) {

                if(err) return cb(new UserError('Не удалось получить счета', {err:err,o:o}));

                invoices = res;

                cb(null);

            });
        },
        prepareData2: function (cb) {

            var total_invoice_amount = 0;
            var total_invoice_paid_amount = 0;
            var total_invoice_pending = 0;
            var invoices_issued = 0;
            var invoices_paid = 0;
            var invoices_partial_paid = 0;
            var total_values = '';

            readyData = {
                form_date: from_date,
                to_date: to_date,
                short_name: (merchant)? merchant.short_name : 'По всем торговцам',
                total_invoice_amount:0,
                total_invoice_paid_amount:0,
                total_invoice_pending:0,
                invoices_issued: 0,
                invoices_paid: 0,
                invoices_partial_paid: 0,
                total_values: '',
                t1: []
            };

            var index = 1;

            for(var i in invoices){
                var inv = invoices[i];

                var localFin;
                if(fins){

                    for(var k in fins){
                        if(inv.merchant_financing_id == fins[k].id){
                            localFin = fins[k];
                        }
                    }
                }



                readyData.t1.push({
                    index:index,
                    invoice_number: inv.id,
                    invoice_date: inv.invoice_date,
                    through_number: (fin) ? fin.through_number : localFin.through_number,
                    short_name: (fin)? fin.merchant_short_name : localFin.merchant_short_name,
                    invoice_type: inv.status,
                    invoice_amount: inv.amount,
                    nds: (inv.invoice_type_sysname == 'WITH_NDS')? 'с НДС' : 'без НДС',
                    invoice_status: inv.status,
                    invoice_paid_date: inv.closing_date,
                    invoice_paid_amount: inv.amount,
                    invoice_pending: ''
                });

                total_invoice_amount += +inv.amount;
                total_invoice_paid_amount += +inv.amount;

                if(inv.status_sysname == 'EXPOSED' || inv.status_sysname == 'CLOSED'){
                    invoices_issued ++;
                }

                if(inv.status_sysname == 'CLOSED'){
                    invoices_paid ++;
                }

                total_invoice_pending = '---';

                invoices_partial_paid = '---';

                total_values = invoices_issued + ' // ' + invoices_paid;

                index++;
            }

            readyData.total_invoice_amount = total_invoice_amount;
            readyData.total_invoice_paid_amount = total_invoice_paid_amount;
            readyData.total_invoice_pending = '-';
            readyData.invoices_issued = invoices_issued;
            readyData.invoices_paid = invoices_paid;
            readyData.invoices_partial_paid = '-';
            readyData.total_values = total_values;

            cb(null);
        },
        getTemplate: function (cb) {

            fs.readFile('./templates/'+name, function (err, data) {
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

            filename = 'Отчет по счетам от '+report_date + '.xlsx';

            fs.writeFile('./public/savedFiles/' + filename,binaryData, function (err) {
                if (err) return cb(new MyError('Не удалось записать файл testOutput.xlsx',{err:err}));
                return cb(null, new UserOk('testOutput.xlsx успешно сформирован'));
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
            cb(null, new UserOk('Ок',{filename:filename,path:'/savedFiles/'}));
        }
    });
};

Model.prototype.report_weekly_moneyflow = function (obj, cb) { // Отчет по заявкам

    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }

    var _t = this;

    var merchant_id = obj.merchant_id || false;

    var from_date = obj.from_date;
    var to_date = moment(obj.from_date, 'DD.MM.YYYY').add(4,'days').format('DD.MM.YYYY');

    var report_date = obj.report_date || funcs.getDate();
    var rollback_key = obj.rollback_key || rollback.create();

    var payments;

    var readyData;
    var template;
    var binaryData;
    var filename;
    var name = 'report_weekly_moneyflow.xlsx';

    var weekday_1_total = 0;
    var weekday_2_total = 0;
    var weekday_3_total = 0;
    var weekday_4_total = 0;
    var weekday_5_total = 0;

    var week_total = 0;

    var ms = [];
    var ms_idx = [];

    var days = [];
    var merchants = [];
    var merchants_ids = [];

    async.series({
        getDailyPayments: function(cb){

            console.log(from_date);

            var o = {
                command: 'get',
                object: 'daily_payment',
                params: {
                    where: [
                        {
                            key: 'daily_payments_date',
                            type: '..',
                            val1: from_date,
                            val2: to_date
                        }
                    ],
                    sort:'daily_payments_date',
                    collapseData: false
                }
            };

            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить платежи по дню',{o : o, err : err}));

                payments = res;

                cb(null);
            });

        },
        prepareData2: function (cb) {

            readyData = {
                from_date: from_date,
                to_date: to_date,

                weekday_1: moment(from_date, 'DD.MM.YYYY').format('DD.MM.YYYY'),
                weekday_2: moment(from_date, 'DD.MM.YYYY').add(1,'day').format('DD.MM.YYYY'),
                weekday_3: moment(from_date, 'DD.MM.YYYY').add(2,'day').format('DD.MM.YYYY'),
                weekday_4: moment(from_date, 'DD.MM.YYYY').add(3,'day').format('DD.MM.YYYY'),
                weekday_5: moment(from_date, 'DD.MM.YYYY').add(4,'day').format('DD.MM.YYYY'),

                weekday_1_total:0,
                weekday_2_total:0,
                weekday_3_total:0,
                weekday_4_total:0,
                weekday_5_total:0,

                week_total: 0,

                t1: []
            };

            cb(null);
        },
        prepareData3: function(cb){


            var merchant_ids = [];

            var idx = 0;


            for(var i in payments){
                var p = payments[i];

                var inListIdx = merchant_ids.indexOf(p.merchant_financing_id);

                if(inListIdx == -1){
                    readyData.t1.push({
                        short_name: p.financing
                    });

                    if(p.daily_payments_date == readyData.weekday_1){

                        readyData.t1[idx].w1_amount = +p.paid_amount + +p.default_paid_amount || 0;
                    }

                    if(p.daily_payments_date == readyData.weekday_2){
                        readyData.t1[idx].w2_amount = +p.paid_amount + +p.default_paid_amount || 0;
                    }

                    if(p.daily_payments_date == readyData.weekday_3){
                        readyData.t1[idx].w3_amount = +p.paid_amount + +p.default_paid_amount || 0;
                    }

                    if(p.daily_payments_date == readyData.weekday_4){
                        readyData.t1[idx].w4_amount = +p.paid_amount + +p.default_paid_amount || 0;
                    }

                    if(p.daily_payments_date == readyData.weekday_5){
                        readyData.t1[idx].w5_amount = +p.paid_amount + +p.default_paid_amount || 0;
                    }

                    merchant_ids.push(p.merchant_financing_id);

                    idx++;

                }else{

                    if(p.daily_payments_date == readyData.weekday_1){
                        readyData.t1[inListIdx].w1_amount = +p.paid_amount + +p.default_paid_amount || 0;
                    }

                    if(p.daily_payments_date == readyData.weekday_2){
                        readyData.t1[inListIdx].w2_amount = +p.paid_amount + +p.default_paid_amount || 0;
                    }

                    if(p.daily_payments_date == readyData.weekday_3){
                        readyData.t1[inListIdx].w3_amount = +p.paid_amount + +p.default_paid_amount || 0;
                    }

                    if(p.daily_payments_date == readyData.weekday_4){
                        readyData.t1[inListIdx].w4_amount = +p.paid_amount + +p.default_paid_amount || 0;
                    }

                    if(p.daily_payments_date == readyData.weekday_5){
                        readyData.t1[inListIdx].w5_amount = +p.paid_amount + +p.default_paid_amount || 0;
                    }

                }


            }

            for(var j in readyData.t1){
                var row = readyData.t1[j];

                row.total_amount = (+row.w1_amount || 0) + (+row.w2_amount || 0) + (+row.w3_amount || 0) + (+row.w4_amount || 0) + (+row.w5_amount || 0);

                weekday_1_total += (+row.w1_amount || 0);
                weekday_2_total += (+row.w2_amount || 0);
                weekday_3_total += (+row.w3_amount || 0);
                weekday_4_total += (+row.w4_amount || 0);
                weekday_5_total += (+row.w5_amount || 0);

                week_total += row.total_amount;
            }



            readyData.weekday_1_total = weekday_1_total;
            readyData.weekday_2_total = weekday_2_total;
            readyData.weekday_3_total = weekday_3_total;
            readyData.weekday_4_total = weekday_4_total;
            readyData.weekday_5_total = weekday_5_total;

            readyData.week_total = week_total;




            cb(null);

        },
        getTemplate: function (cb) {

            fs.readFile('./templates/'+name, function (err, data) {
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

            filename = 'Отчет по движению средств '+from_date + ' - ' + to_date + '.xlsx';

            fs.writeFile('./public/savedFiles/' + filename,binaryData, function (err) {
                if (err) return cb(new MyError('Не удалось записать файл testOutput.xlsx',{err:err}));
                return cb(null, new UserOk('testOutput.xlsx успешно сформирован'));
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
            cb(null, new UserOk('Ок',{filename:filename,path:'/savedFiles/'}));
        }
    });
};

Model.prototype.report_managers = function (obj, cb) { // Отчет по заявкам

    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }

    var _t = this;

    var manager_id = obj.manager_id || false;

    var from_date = obj.from_date || moment().add(-1, 'months').format('DD.MM.YYYY');
    var to_date = obj.to_date || moment().format('DD.MM.YYYY');

    var report_date = obj.report_date || funcs.getDate();
    var rollback_key = obj.rollback_key || rollback.create();


    var requests;
    var tnums = [];
    var fins;

    var readyData;
    var template;
    var binaryData;
    var filename;
    var name = 'report_managers.xlsx';

    var total_created = 0;
    var total_postponed = 0;
    var total_in_work = 0;

    var total_founding_amount = 0;
    var avr_factoring_rate = 0;
    var total_founding_amount_in_work = 0;

    async.series({
        getRequests: function(cb){

            var o = {
                command:'get',
                object:'financing_request',
                params:{
                    where: [
                        {
                            key: 'request_date',
                            type:'..',
                            val1: from_date,
                            val2: to_date
                        }
                    ],
                    sort: 'request_date',
                    collapseData:false
                }
            };

            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить менеджеров',{o : o, err : err}));

                requests = res;

                for(var i in res){
                    tnums.push(res[i].through_number);
                }

                cb(null);
            });

        },
        getFinancings: function(cb){

            var o = {
                command:'get',
                object:'merchant_financing',
                params:{
                    where: [
                        {
                            key: 'through_number',
                            type: 'in',
                            val1: tnums
                        }
                    ],
                    collapseData:false
                }
            };

            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить финансирования',{o : o, err : err}));
                fins = res;
                cb(null);
            });
        },
        prepareData2: function (cb) {

            var allFactRate = 0;
            var allInWork = 0;

            readyData = {
                from_date: from_date,
                to_date: to_date,
                total_created: 0,
                total_postponed: 0,
                total_in_work: 0,
                total_founding_amount: 1,
                avr_factoring_rate: 1,
                total_founding_amount_in_work: 1,

                t1: []
            };

            var idx = 1;

            for(var i in requests){

                var r = requests[i];

                var fin = undefined;

                for(var k in fins){
                    if(fins[k].through_number == r.through_number){
                        fin = fins[k];
                    }
                }

                if(!fin){
                    fin = {
                        factoring_rate: 0,
                        agreement_date: '-',
                        founding_amount: 0
                    }
                }

                console.log(fin);
                console.log(1);

                readyData.t1.push({
                    index:idx,
                    manager: r.manager_lastname,
                    trough_number: r.through_number,
                    request_type: r.financing_request_type,
                    short_name: r.short_name,
                    request_date: r.request_date,
                    request_status: r.request_status,
                    founding_amount: r.founding_amount,
                    factoring_rate: (fin.factoring_rate > 0)?  fin.factoring_rate / 100 : r.factoring_rate / 100,
                    agr_date: fin.agreement_date,
                    founding_amount_in_work: (+fin.founding_amount > 0)?  +fin.founding_amount : 0
                });

                total_created++;
                total_postponed += (r.request_status_sysname == 'DELAYED')? 1 : 0;
                total_in_work += (r.request_status_sysname == 'IN_WORK')? 1 : 0;

                total_founding_amount += +r.founding_amount;
                total_founding_amount_in_work += +fin.founding_amount;

                allFactRate += +fin.factoring_rate / 100;
                allInWork += (fin.factoring_rate > 0)? 1 : 0;


                idx++;

            }

            avr_factoring_rate = allFactRate / allInWork;

            readyData.total_created = total_created;
            readyData.total_postponed = total_postponed;
            readyData.total_in_work = total_in_work;
            readyData.total_founding_amount = total_founding_amount;
            readyData.avr_factoring_rate = avr_factoring_rate;
            readyData.total_founding_amount_in_work = total_founding_amount_in_work;

            cb(null);
        },
        getTemplate: function (cb) {

            fs.readFile('./templates/'+name, function (err, data) {
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

            filename = 'Отчет по менеджерам '+report_date + '.xlsx';

            fs.writeFile('./public/savedFiles/' + filename,binaryData, function (err) {
                if (err) return cb(new MyError('Не удалось записать файл testOutput.xlsx',{err:err}));
                return cb(null, new UserOk('testOutput.xlsx успешно сформирован'));
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
            cb(null, new UserOk('Ок',{filename:filename,path:'/savedFiles/'}));
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
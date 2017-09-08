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
var generateCalndar = require('../modules/generate_calendar');
var rollback = require('../modules/rollback');

var Model = function(obj){
    this.name = obj.name;
    this.tableName = obj.name.toLowerCase();
    var basicclass = BasicClass.call(this, obj);
    if (basicclass instanceof MyError) return basicclass;
};
util.inherits(Model, BasicClass);
Model.prototype.addPrototype = Model.prototype.add;
Model.prototype.modifyPrototype = Model.prototype.modify;
Model.prototype.removePrototype = Model.prototype.remove;

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

    if(obj.inn && obj.inn.toString().length < 10) return cb(new UserError('Поле ИНН должно состоять из 10 или 12 символов'));
    if(obj.kpp && obj.kpp.toString().length != 9) return cb(new UserError('Поле КПП должно состоять из 9 символов'));
    if(obj.rs && obj.rs.toString().length != 20) return cb(new UserError('Поле Р/С должно состоять из 20 символов'));


    async.series({
        modify: function (cb) {
            _t.modifyPrototype(obj, function (err,res) {

                if(err) return cb(new UserError('Не удалось изменить торговца', {o: obj, err:err}));

                cb(null);

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

Model.prototype.addHistory = function (obj, cb) { // Создадим запись в истории мерчанта
    var _t = this;
    if (typeof cb!=='function') throw new MyError('В addHistory не передана функция cb');
    if (typeof obj!=='object') return cb(new MyError('В метод не передан obj', {method:'addHistory'}));
    var merchant_id = obj.id || obj.merchant_id;
    if (!merchant_id) return cb(new MyError('В addHistory не передан merchant_id'));
    var o = {
        command: 'add',
        object: 'merchant_history_log.tbl_merchant_history_log',
        params: {
            merchant_id: merchant_id,
            datetime: funcs.getDateTimeMySQL()
        }
    };
    for (var i in obj) {
        o.params[i] = obj[i]
    }

    _t.api(o, function (err, res) {
        if (err) return cb(new MyError('Не удалось добавить запись в историю мерчанта.', {
            err: err,
            merchant_id: merchant_id,
            params: o.params
        }));
        cb(null);
    })
};

Model.prototype.setStatus = function (obj, cb) { // Создадим запись в истории мерчанта
    if (typeof cb!=='function') throw new MyError('В setStatus не передана функция cb');
    if (typeof obj!=='object') return cb(new MyError('В метод не передан obj', {method:'setStatus'}));
    var _t = this;
    var id = obj.id;
    var status = obj.status;
    if (isNaN(+id)) return cb(new MyError('В setStatus не передан id'));
    if (typeof status!=='string') return cb(new MyError('В setStatus не передан status'));
    var o = {
        id:id,
        merchant_status_sysname:status
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


///------------ADD---------------------//
Model.prototype.add = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var client_object = _t.client_object || '';

    var coFunction = 'add_' + client_object;
    if (typeof _t[coFunction] === 'function'){
        _t[coFunction](obj, cb);
    }else{
        // Здесь необходимо
        // Получим данные из справочной таблицы тип бизнеса
        // Создадим запись addPrototype
        // Получим ID документов для этого бизнеса
        // Создадим соответствующие записи в документах мерчанта
        // Запишем лог о создании
        var rollback_key = rollback.create();
        var document_ids = [];
        var merchant_id;
        if (!obj.business_type_id) return cb(new UserError('Тип бизнеса обязателен к заполнению', {data:'Ожидается business_type_id'}));

        async.series({
            preloadFromBusinesType: function (cb) {
                // Получим данные из справочной таблицы тип бизнеса
                var o = {
                    command: 'get',
                    object: 'business_type',
                    params: {
                        collapseData: false,
                        columns: ['profitability', 'visa_mc_percent', 'acquiring_days_count','avl_mth_withdraw_rate','avl_proc_dly_withdraw_rate','total_mouthly_credit_card_turnover'],
                        where: [
                            {
                                key: 'id',
                                val1: obj.business_type_id
                            }
                        ]
                    }
                };
                _t.api(o, function (err, res) {
                    if (err) return cb(new MyError('Не удалось получить данные для данного бизнеса.', {
                        err: err,
                        business_type_id: obj.business_type_id
                    }));
                    if (!res.length) return cb(null);
                    for (var i in res[0]) {
                        obj[i] = (typeof obj[i] !== 'undefined') ? obj[i] : res[0][i];
                    }
                    cb(null);
                })
            },
            //loadDefaults: function (cb) {  Устарело
            //    _t.loadDefaultValues(obj, function (err, result_obj) {
            //        obj = result_obj;
            //        return cb(err);
            //    }, {standart:true});
            //},
            //calc: function (cb) {
            //    var cals_funcs = _t.calc_functions;
            //    for (var i in cals_funcs) {
            //        if (typeof cals_funcs[i]==='function') obj = cals_funcs[i](obj);
            //    }
            //    delete obj.card_turnover;
            //    delete obj.amount_card_day;
            //    cb(null);
            //},
            add: function (cb) { // Создадим запись addPrototype
                obj.rollback_key = rollback_key;
                _t.addPrototype(obj, function (err, res) {
                    delete obj.rollback_key;
                    if (err) return cb(err);
                    merchant_id = res.id;
                    cb(err, res);
                });
            },
            getDocs: function (cb) { // Получим ID документов для этого бизнеса
                var o = {
                    command: 'get',
                    object: 'document_for_business_type',
                    params: {
                        collapseData: false,
                        columns: ['document_id'],
                        where: [
                            {
                                key: 'business_type_id',
                                val1: obj.business_type_id
                            }
                        ]
                    }
                };
                _t.api(o, function (err, res) {
                    if (err) return cb(new MyError('Не удалось получить документы для данного бизнеса.', {
                        err: err,
                        business_type_id: obj.business_type_id
                    }));
                    document_ids = res;
                    cb(null);
                })
            },
            insertDocs: function (cb) { // Создадим соответствующие записи в документах мерчанта
                async.eachSeries(document_ids, function (item, cb) {
                    var o = {
                        command: 'add',
                        object: 'merchant_document.tbl_merchant_document',
                        params: {
                            merchant_id: merchant_id,
                            document_id: item.document_id
                        }
                    };
                    o.params.rollback_key = rollback_key;
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось добавить документы для данного бизнеса.', {
                            err: err,
                            merchant_id: merchant_id,
                            business_type_id: obj.business_type_id
                        }));
                        cb(null);
                    })
                }, cb);

            },
            addHistory: function (cb) { // Создадим запись в истории мерчанта
                obj.merchant_id = merchant_id;
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
            return cb(null, res.add);
        });
    }
};

Model.prototype.change_rko_bank = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    var new_bank_id = obj.rko_bank_id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id'));
    if (isNaN(+new_bank_id)) return cb(new UserError('Необходимо указать банк'));
    var rollback_key = rollback.create();

    // Запросим текущее состояние торговца
    // Запросим id типа банка RKO
    // Проверим существование выбранного банка
    // Изменим банк у самого мерча
    // Запишем лог изменения банка в "merchant_bank_change"
    // Запишем лог мерча
    var merchant, bank_service_type_id, new_bank;
    async.series({
        getMerchant: function (cb) {
            // Запросим текущее состояние торговца
            _t.getById({id: id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найден торговец.', {id: id}));
                merchant = res[0];
                cb(null);
            });
        },
        check: function (cb) {
            if (merchant.rko_bank_id == new_bank_id) return cb(new UserError('Этот банк уже установлен.',{type:'info'}));
            cb(null);
        },
        getBankTypeId: function (cb) {
            // Запросим id типа банка RKO
            var o = {
                command:'get',
                object:'bank_service_type',
                params:{
                    param_where:{
                        sysname:'RKO'
                    },
                    collapseData:false
                }

            };
            _t.api(o, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('В справочнике Тип обслуживания банка нет нужного значения (RKO).'));
                if (res.length > 1) return cb(new MyError('В справочнике Тип обслуживания банка слишком много знаписей с типом (RKO). Удалите лишнее.'));
                bank_service_type_id = res[0].id;
                cb(null);
            });
        },
        checkNewBankId: function (cb) {
            // Проверим существование выбранного банка и то что он рабочий
            var o = {
                command:'get',
                object:'bank',
                params:{
                    param_where:{
                        id:new_bank_id/*,
                        is_work:true*/
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new UserError('Не удалось найти указаный банк или он не является рабочим.'));
                new_bank = res[0];
                cb(null);
            });
        },
        changeBank: function (cb) {
            var params = {
                id:id,
                rko_bank_id:new_bank_id
            };
            params.rollback_key = rollback_key;
            _t.modify(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось изменить значение банка РКО у торговца.',{err:err}));
                cb(null);
            });
        },
        setChangeLog: function (cb) {
            // Запишем лог изменения банка в "merchant_bank_change"

            var o = {
                command:'add',
                object:'merchant_bank_change',
                params:{
                    merchant_id:id,
                    bank_service_type_id:bank_service_type_id,
                    change_date:funcs.getDateMySQL(),
                    old_bank_id:merchant.rko_bank_id,
                    new_bank_id:new_bank_id
                }
            };
            o.params.rollback_key = rollback_key;
            _t.api(o, function (err, res) {
                    if (err) return cb(err);
                    if (res.code) return cb(new UserError('Не удалось добавить лог о смене банка',{res:res}));
                    merchant.rko_bank_id = new_bank_id;
                    cb(null);
            });

        },
        addLog: function (cb) {
            // Записать лог
            var o = {
                merchant_id: id,
                history_log_status_sysname: 'CHANGE_RKO_BANK'
            };
            o.comment = (merchant.bank_rko || 'Банк не указан') + ' -> ' + '"' + new_bank.name + '"';
            for (var i in merchant) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant[i];
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
            //rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'change_rko_bank', params:obj});
            cb(null, new UserOk('Банк РКО успешно изменен.'));
        }
    })
};

Model.prototype.change_processing_bank = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    var new_bank_id = obj.processing_bank_id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id'));
    if (isNaN(+new_bank_id)) return cb(new UserError('Необходимо указать банк'));
    var rollback_key = rollback.create();

    // Запросим текущее состояние торговца
    // Запросим id типа банка ACQUIRING
    // Проверим существование выбранного банка
    // Изменим банк у самого мерча
    // Запишем лог изменения банка в "merchant_bank_change"
    // Обновим финансирования которые еще не переходили в работу
    // Запишем лог мерча
    var merchant, bank_service_type_id, new_bank;
    async.series({
        getMerchant: function (cb) {
            // Запросим текущее состояние торговца
            _t.getById({id: id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найден торговец.', {id: id}));
                merchant = res[0];
                cb(null);
            });
        },
        check: function (cb) {
            if (merchant.processing_bank_id == new_bank_id) return cb(new UserError('Этот банк уже установлен.',{type:'info'}));
            cb(null);
        },
        getBankTypeId: function (cb) {
            // Запросим id типа банка RKO
            var o = {
                command:'get',
                object:'bank_service_type',
                params:{
                    param_where:{
                        sysname:'ACQUIRING'
                    },
                    collapseData:false
                }

            };
            _t.api(o, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('В справочнике Тип обслуживания банка нет нужного значения (ACQUIRING).'));
                if (res.length > 1) return cb(new MyError('В справочнике Тип обслуживания банка слишком много знаписей с типом (ACQUIRING). Удалите лишнее.'));
                bank_service_type_id = res[0].id;
                cb(null);
            });
        },
        checkNewBankId: function (cb) {
            // Проверим существование выбранного банка и то что он рабочий
            var o = {
                command:'get',
                object:'bank',
                params:{
                    param_where:{
                        id:new_bank_id,
                        is_work:true
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new UserError('Не удалось найти указаный банк или он не является рабочим.'));
                new_bank = res[0];
                cb(null);
            });
        },
        changeBank: function (cb) {
            var params = {
                id:id,
                processing_bank_id:new_bank_id
            };
            params.rollback_key = rollback_key;
            _t.modify(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось изменить значение банка ACQUIRING у торговца.',{err:err}));
                cb(null);
            });
        },
        setChangeLog: function (cb) {
            // Запишем лог изменения банка в "merchant_bank_change"

            var o = {
                command:'add',
                object:'merchant_bank_change',
                params:{
                    merchant_id:id,
                    bank_service_type_id:bank_service_type_id,
                    change_date:funcs.getDateMySQL(),
                    old_bank_id:merchant.processing_bank_id,
                    new_bank_id:new_bank_id
                }
            };
            o.params.rollback_key = rollback_key;
            _t.api(o, function (err, res) {
                if (err) return cb(err);
                if (res.code) return cb(new UserError('Не удалось добавить лог о смене банка', {res: res}));
                merchant.processing_bank_id = new_bank_id;
                cb(null);
            });

        },
        updateFinancings: function (cb) {
            var avalibleStatuses = ['CREATED', 'OFFER_SENDED', 'DOCS_REQUESTED', 'DOCS_RECIEVED', 'OFFER_ACCEPTED', 'OFFER_DECLINED', 'AGREEMENT_CREATED', 'AGREEMENT_SENT', 'AGREEMENT_UPLOADED'];
            var o = {
                command: 'get',
                object: 'merchant_financing',
                params: {
                    where: [
                        {
                            key: 'merchant_id',
                            val1: id
                        },
                        {
                            key: 'status_sysname',
                            type: 'in',
                            val1: avalibleStatuses.join(',')
                        }
                    ],
                    collapseData: false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить связанные с торговцем финансирования.', {err: err}));
                // Всем обнавим банк процессинга
                async.eachSeries(res, function (item, cb) {
                    var o = {
                        command:'modify',
                        object:'merchant_financing',
                        params:{
                            id:item.id,
                            processing_bank_id:new_bank_id
                        }
                    };
                    o.params.rollback_key = rollback_key;
                    _t.api(o, function (err, res) {
                        if (err) return cb(new UserError('Не удалось изменить банк у финансирования', {err: err}));
                        // Запишем лог финансированию
                        var o = {
                            command:'addHistory',
                            object:'merchant_financing',
                            params:{
                                id:item.id,
                                history_log_status_sysname:'CHANGE_PROCESSING_BANK',
                                comment:(merchant.processing_bank || 'Банк не указан') + ' -> ' + '"' + new_bank.name + '"'
                            }
                        };
                        o.params.rollback_key = rollback_key;
                        _t.api(o, function (err) {
                            if (err) return cb(err);
                            cb(null);
                        });
                    });
                }, cb);
            });


        },
        addLog: function (cb) {
            // Записать лог
            var o = {
                merchant_id: id,
                history_log_status_sysname: 'CHANGE_PROCESSING_BANK'
            };
            o.comment = (merchant.processing_bank || 'Банк не указан') + ' -> ' + '"' + new_bank.name + '"';
            for (var i in merchant) {
                if (typeof o[i] !== 'undefined') continue;
                o[i] = merchant[i];
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
            //rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'change_processing_bank', params:obj});
            cb(null, new UserOk('Банк процессинга успешно изменен.'));
        }
    })
};




module.exports = Model;
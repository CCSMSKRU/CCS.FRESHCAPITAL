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

//var o = {
//    command:'commit',
//    object:'investment_plan_merchant',
//    params:{
//        id:21
//    }
//}
//socketQuery(o, function (err, res) {
//    console.log(err, res);
//});
Model.prototype.commit = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    var operation_date = obj.operation_date || funcs.getDateTimeMySQL();

    // Залочить дочерние записи
    // проверить что мерч полностью удовлетворен
    // Получить процент комиссии банка - записать финансированию
    // Списать средства
    // закомитеть
    // Разлочить записи

    var merchant_plan, merchant_invests;
    var financing, bank;
    async.series({
        get: function (cb) {
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить investment_plan_merchant',{id:id, err:err}));
                if (!res.length) return cb(new MyError('investment_plan_merchant не найден.',{id:id, res:res}));
                merchant_plan = res[0];
                if (merchant_plan.commited) return cb(new UserError('ok',{msg:'Уже подтверждено.',type:'info'}));
                cb(null);
            })
        },
        getInvests: function (cb) {
            var o = {
                command:'get',
                object:'investment_plan_merchant_investor',
                params:{
                    param_where:{
                        investment_plan_merchant_id:merchant_plan.id
                    },
                    collapseData:false
                }
            }
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить investment_plan_merchant_investor',{o:o, err:err}));
                if (!res.length) return cb(new MyError('Не найдено не одной записи investment_plan_merchant_investor',{o:o, res:res}));
                merchant_invests = res;
                cb(null);
            })
        },
        setBankCommissionToFinancing: function (cb) {
            // Получить процент комиссии банка - записать финансированию
            async.series({
                getFinancing: function (cb) {
                    var o = {
                        command: 'getById',
                        object: 'merchant_financing',
                        params: {
                            id: merchant_plan.merchant_financing_id
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить финансирование', {o: o, err: err}));
                        financing = res[0];
                        cb(null);
                    });
                },
                getbank: function (cb) {
                    if (!financing.processing_bank_id) return cb(new UserError('У финансирование не указан банк.',{financing:financing}));
                    var o = {
                        command: 'getById',
                        object: 'bank',
                        params: {
                            id: financing.processing_bank_id,
                            rollback_key: rollback_key
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить банк', {o: o, err: err}));
                        bank = res[0];
                        cb(null);
                    });
                },
                setBankCommissionToFin: function (cb) {
                    if (!bank.comission_percent) return cb(new UserError('У банка не указана комиссия. Номер банка ' + bank.id,{bank:bank}));
                    var o = {
                        command: 'modify',
                        object: 'merchant_financing',
                        params: {
                            id: financing.id,
                            processing_bank_commission:bank.comission_percent,
                            rollback_key: rollback_key
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось установить размер комисси банка для финансирования', {o: o, err: err}));
                        cb(null);
                    });
                }
            }, cb);
        },
        lockInvests: function (cb) {
            async.each(merchant_invests, function (one_inv, cb) {
                var o = {
                    command:'lock',
                    object:'investment_plan_merchant_investor',
                    params:{
                        id:one_inv.id
                    }
                }
                _t.api(o, function (err, res) {
                    if (err) return cb(err);
                    one_inv.key = res;
                    cb(null);
                });
            },cb);
        },
        check: function (cb) {
            var total_amount = 0;
            for (var i in merchant_invests) {
                total_amount += +merchant_invests[i].amount;
            }
            if (total_amount != merchant_plan.founding_amount) {
                return cb(new UserError(merchant_plan.merchant + '(' + merchant_plan.merchant_id + ') еще не готов. Сумма не сходится.',{total_amount:total_amount, founding_amount:merchant_plan.founding_amount}));
            }
            cb(null);
        },
        unlockMoneyAndtransferToMerch: function (cb) {
            async.each(merchant_invests, function (one_inv, cb) {
                var account;
                async.series({
                    getAccount: function (cb) {
                        var o = {
                            command: 'getById',
                            object: 'investor_account',
                            params: {
                                id: one_inv.investor_account_id
                            }
                        };
                        _t.api(o, function (err, res) {
                            if (err) return cb(new MyError('Не удалось получить счет инвестора', {o: o, err: err}));
                            account = res[0];
                            cb(null);
                        });
                    },
                    modify: function (cb) {
                        account.total_amount -= one_inv.amount;
                        account.locked_amount -= one_inv.amount;
                        var o = {
                            command: 'modify',
                            object: 'investor_account',
                            params: {
                                id: account.id,
                                total_amount: account.total_amount,
                                locked_amount: account.locked_amount,
                                rollback_key:rollback_key
                            }
                        };
                        _t.api(o, function (err, res) {
                            if (err) return cb(new MyError('Не удалось списать деньги со счета.',{o:o, err:err}));
                            cb(null);
                        })
                    },
                    addOperationUnlock: function (cb) {
                        var o = {
                            command:'add',
                            object:'investor_account_operation',
                            params:{
                                investor_account_id:account.id,
                                merchant_financing_id:one_inv.merchant_financing_id,
                                type_sysname:'UNBLOCK',
                                subtype_sysname:'UNLOCK_BEFORE_TRANSFER_TO_MERCHANT',
                                operation_date:operation_date,
                                purpose:'Разблокировка перед переводом торговцу',
                                amount:one_inv.amount,
                                rollback_key:rollback_key
                            }
                        }
                        _t.api(o, function (err) {
                            if (err) return cb(new MyError('Не удалось создать операцию по счету.',{o:o, err:err}));
                            cb(null);
                        })
                    },

                    addOperation: function (cb) {
                        var o = {
                            command:'add',
                            object:'investor_account_operation',
                            params:{
                                investor_account_id:account.id,
                                merchant_financing_id:one_inv.merchant_financing_id,
                                type_sysname:'CREDIT',
                                subtype_sysname:'TRANSFER_TO_MERCHANT',
                                operation_date:operation_date,
                                purpose:'Перевод денег торговцу',
                                amount:one_inv.amount,
                                rollback_key:rollback_key
                            }
                        }
                        _t.api(o, function (err) {
                            if (err) return cb(new MyError('Не удалось создать операцию по счету.',{o:o, err:err}));
                            cb(null);
                        })
                    }
                },cb);
            },cb);
        },
        commit: function (cb) {
            var params = {
                id:id,
                commited:true,
                commited_date:operation_date,
                rollback_key:rollback_key
            };
            _t.modify(params, cb);
        },
        setFinancingStatus: function (cb) {
            var o = {
                command: 'setStatus',
                object: 'merchant_financing',
                params: {
                    id: merchant_plan.merchant_financing_id,
                    status:'READY_TO_WORK',
                    rollback_key: rollback_key
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось сменить статус финансирования', {o: o, err: err}));
                cb(null);
            });
        }
    },function (err, res) {
        for (var i in merchant_invests) {
            if (merchant_invests[i].key){
                var o = {
                    command:'unlock',
                    object:'investment_plan_merchant_investor',
                    params:{
                        id:merchant_invests[i].id,
                        key:merchant_invests[i].key
                    }
                }
                _t.api(o, function (err, res) {
                    if (err) console.log('UNLOCK ERROR ==> ', err, merchant_invests[i]);
                });
            }
        }
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!obj.doNotSaveRollback){
                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'commit', params:obj});
            }
            cb(null, new UserOk('Ок'));
        }
    });
}

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
            //rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'METHOD_NAME', params:obj});
            cb(null, new UserOk('Ок'));
        }
    });
}

module.exports = Model;
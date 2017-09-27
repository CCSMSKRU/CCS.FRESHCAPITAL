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

Model.prototype.modify_ = function (obj, cb) {
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
            obj.rollback_key = rollback_key;
            _t.modifyPrototype(obj,cb);
        },
        setDefaultAccountToInvestor: function (cb) {
            if (!obj.is_default) return cb(null);
            var account;
            async.series({
                getAccount: function (cb) {
                    _t.getById({id:id}, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить счет.',{id:id, err:err}));
                        if (!res.length) return cb(new UserError('Счет не найден. Возможно удален другим пользователем.',{id:id,res:res}));
                        account = res[0];
                        cb(null);
                    });
                },
                setAccountId: function (cb) {
                    var o = {
                        command:'modify',
                        object:'investor',
                        params:{
                            id:account.investor_id,
                            default_investor_account_id:id,
                            rollback_key:rollback_key
                        }
                    }
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось установить default_investor_account_id инвестору',{o:o,err:err}));
                        cb(null);
                    });
                }
            },cb);

        }
    }, function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
                return cb(err, err2);
            });
        }else{
            //rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'setMainInvestor', params:obj});
            cb(null, res.modify);
        }
    })


    //rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'prepareAgreement', params:obj});
};

Model.prototype.add_ = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var investor_id = obj.investor_id;
    if (isNaN(+investor_id)) return cb(new MyError('Не передан investor_id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();


    var account_id;
    async.series({
        add: function (cb) {
            obj.rollback_key = rollback_key;
            _t.addPrototype(obj, function (err, res) {
                if (err) return cb(new MyError('Не удалось создать счет.',{obj:obj, err:err}));
                account_id = res.id;
                cb(null, res);
            })
        },
        setDefaultAccountToInvestor: function (cb) {
            if (!obj.is_default) return cb(null);
            var o = {
                command:'modify',
                object:'investor',
                params:{
                    id:investor_id,
                    default_investor_account_id:account_id,
                    rollback_key:rollback_key
                }
            }
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось установить default_investor_account_id инвестору',{o:o,err:err}));
                cb(null);
            })
        },
        addInvestorHistory: function (cb) {
            var o = {
                command:'addHistory',
                object:'investor',
                params:{
                    id:investor_id,
                    desc:'Создан счет №: ' + account_id,
                    rollback_key:rollback_key
                }
            }
            _t.api(o, cb);
        },
        addHistory: function (cb) {
            var o = {
                id:account_id,
                desc:'Создан счет',
                rollback_key:rollback_key
            }
            _t.addHistory(o,cb);
        }
    },function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            //rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'METHOD_NAME', params:obj});
            cb(null, res.add);
        }
    });

};

Model.prototype.getDefault = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var investor_id = obj.investor_id;
    if (isNaN(+investor_id)) return cb(new MyError('Не передан investor_id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();


    var account;
    async.series({
        getDefault: function (cb) {
            var params = {
                param_where:{
                    investor_id:investor_id,
                    is_default:true
                },
                collapseData:false
            }
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить счет по умолчанию.',{params:params, err:err}));
                if (!res.length) return cb(null);
                if (res.length > 1) return cb(new MyError('Счетов по умолчанию больше одного. Обратитесь к администратору',{params:params, res:res}));
                account = res[0];
                cb(null);
            })
        },
        addDefault: function (cb) {
            if (account) return cb(null);
            var params = {
                investor_id:investor_id,
                is_default:true,
                rollback_key:rollback_key
            };
            _t.add(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось создать счет по умолчанию.',{params:params, err:err}));
                var id = res.id;
                _t.getById({id:id}, function (err, res) {
                    if (err) return cb(new MyError('Не удалось получить счет, который был только что создан',{id:id,err:err}));
                    if (!res.length) return cb(new MyError('Счет не найден, хотя был только что добавлен. Такого быть не должно.',{id:id,res:res}));
                    account = res[0];
                    cb(null);
                });
            });
        }
    },function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            //rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'METHOD_NAME', params:obj});
            cb(null, new UserOk('Ок',{account:account}));
        }
    });

};



Model.prototype.toDeposit = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    var operation_date = obj.operation_date || funcs.getDateTimeMySQL();
    var amount = +obj.amount;
    if (isNaN(amount)) return cb(new UserError('Сумма указана не корректно.',{obj:obj}));

    // Получить счет
    // Прибавить к total_amount и available_amount

    var account;
    async.series({
        getById: function (cb) {
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить счет',{id:id, err:err}));
                if (!res.length) return cb(new UserError('Счет не найден.',{id:id, res:res}));
                account = res[0];
                cb(null);
            })
        },
        // modify: function (cb) {
        //     account.total_amount += amount;
        //     account.available_amount += amount;
        //     var params = {
        //         id:account.id,
        //         total_amount: account.total_amount,
        //         available_amount: account.available_amount,
        //         rollback_key:rollback_key
        //     }
        //     _t.modify(params, function (err, res) {
        //         if (err) return cb(new MyError('Не удалось внести деньги на счет.',{params:params, err:err}));
        //         cb(null);
        //     })
        // },
        addOperation: function (cb) {
            var o = {
                command:'add',
                object:'investor_account_operation',
                params:{
                    investor_account_id:id,
                    subtype_sysname:'ADD_TO_ACCOUNT',
                    type_sysname:'DEBIT',
                    operation_date:operation_date,
                    purpose:'Внесение денежных средств на счет',
                    amount:amount,
                    rollback_key:rollback_key
                }
            }
            _t.api(o, function (err) {
                if (err) return cb(new MyError('Не удалось создать операцию по счету.',{o:o, err:err}));
                cb(null);
            })
        },
        addInvestorHistory: function (cb) {
            var o = {
                command:'addHistory',
                object:'investor',
                params:{
                    id:account.investor_id,
                    desc:'Счет №: ' + account.id + ' пополнен на сумму ' + amount,
                    rollback_key:rollback_key
                }
            }
            _t.api(o, cb);
        },
        addHistory: function (cb) {
            var o = {
                id:account.id,
                desc:'Счет пополнен на сумму ' + amount,
                rollback_key:rollback_key
            }
            _t.addHistory(o,cb);
        },
        calc_amounts:function(cb){
            _t.calc_amounts(obj, function(err){
                cb(err);
            })
        }
    },function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (obj.fromClient){
                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'toDeposit', params:obj});
            }
            cb(null, new UserOk('Счет пополнен: ' + amount));
        }
    });

};

Model.prototype.markMoney = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    if (obj.fromClient) return cb(new MyError('Запрещено'));
    var amount = +obj.amount;
    if (isNaN(amount) || amount <= 0) return cb(new MyError('Не корректно передана сумма',{obj:obj}));

    var lock_key = obj.lock_key;
    var locked;
    var account;
    async.series({
        lock: function (cb) {
            if (lock_key) return cb(null);
            _t.lock({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось заблокировать запись.',{obj:obj, err:err}));
                lock_key = res;
                locked = true;
                cb(null);
            })
        },
        get: function (cb) {
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить счет.',{id:id,err:err}));
                if (!res.length) return cb(new MyError('Счет не найден',{id:id,res:res}));
                account = res[0];
                cb(null);
            });
        },
        check: function (cb) {
            if (Math.round((account.available_amount + account.locked_amount)*100)/100 != Math.round(account.total_amount*100)/100) {
                return cb(new MyError('Проблема со счетом №: ' + account.id + '. Обратитесь к администратору.'));
            }
            if (account.available_amount - amount < 0) return cb(new UserError('Недостаточно средств.'));
            cb(null);
        },
        makeOperation: function (cb) {
            var o = {
                command:'add',
                object:'investor_account_operation',
                params:{
                    investor_account_id:id,
                    type_sysname:'MARK',
                    subtype_sysname:obj.subtype_sysname,
                    merchant_financing_id:obj.merchant_financing_id,
                    contractor_account_id:obj.contractor_account_id,
                    payment_id:obj.payment_id,
                    purpose:obj.purpose || 'Маркировка денежных средств',
                    amount:amount,
                    operation_date:obj.operation_date,
                    rollback_key:rollback_key
                }
            };
            _t.api(o, function (err) {
                if (err) return cb(new MyError('Не удалось создать операцию по счету.',{o:o, err:err}));
                cb(null);
            })
        }
    },function (err, res) {
        if (locked){
            _t.unlock({id:id, lock_key:lock_key}, function (err) {
                console.log('unlock ERROR => ', err);
            });
        }
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!obj.doNotSaveRollback){
                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'markMoney', params:obj});
            }
            cb(null, new UserOk('Денежные средства успешно заблокированы.'));
        }
    });
}

Model.prototype.lockMoney = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    if (obj.fromClient) return cb(new MyError('Запрещено'));
    var amount = +obj.amount;
    if (isNaN(amount) || amount <= 0) return cb(new MyError('Не корректно передана сумма',{obj:obj}));

    var lock_key = obj.lock_key;
    var locked;
    var account;
    async.series({
        lock: function (cb) {
            if (lock_key) return cb(null);
            _t.lock({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось заблокировать запись.',{obj:obj, err:err}));
                lock_key = res;
                locked = true;
                cb(null);
            })
        },
        get: function (cb) {
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить счет.',{id:id,err:err}));
                if (!res.length) return cb(new MyError('Счет не найден',{id:id,res:res}));
                account = res[0];
                cb(null);
            });
        },
        check: function (cb) {
            if (Math.round((account.available_amount + account.locked_amount)*100)/100 != Math.round(account.total_amount*100)/100) {
                return cb(new MyError('Проблема со счетом №: ' + account.id + '. Обратитесь к администратору.'));
            }
            if (account.available_amount - amount < 0) return cb(new UserError('Недостаточно средств.'));
            cb(null);
        },
        makeOperation: function (cb) {
            var o = {
                command:'add',
                object:'investor_account_operation',
                params:{
                    investor_account_id:id,
                    type_sysname:'BLOCK',
                    subtype_sysname:obj.subtype_sysname,
                    merchant_financing_id:obj.merchant_financing_id,
                    contractor_account_id:obj.contractor_account_id,
                    payment_id:obj.payment_id,
                    purpose:obj.purpose || 'Блокировка денежных средств',
                    amount:amount,
                    operation_date:obj.operation_date,
                    rollback_key:rollback_key
                }
            }
            _t.api(o, function (err) {
                if (err) return cb(new MyError('Не удалось создать операцию по счету.',{o:o, err:err}));
                cb(null);
            })
        },
        updateAccount: function (cb) {
            var new_available_amount = +account.available_amount - amount;
            var new_locked_amount = +account.locked_amount + amount;
            if (Math.round((new_available_amount + new_locked_amount)*100)/100 != Math.round(account.total_amount*100)/100) {
                return cb(new MyError('Проблема со счетом №: ' + account.id + '. Обратитесь к администратору.'));
            }
            var params = {
                id:id,
                locked_amount:new_locked_amount,
                available_amount:new_available_amount,
                rollback_key:rollback_key,
                lock_key:lock_key
            }
            _t.modify(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось обновить данные по счету.',{params:params, err:err}));
                cb(null);
            })
        },
        addHistory: function (cb) {
            var o = {
                id:id,
                desc:'Блокировка денежных средств. Сумма: ' + amount,
                rollback_key:rollback_key
            }
            _t.addHistory(o,cb);
        }

    },function (err, res) {
        if (locked){
            _t.unlock({id:id, lock_key:lock_key}, function (err) {
                console.log('unlock ERROR => ', err);
            });
        }
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!obj.doNotSaveRollback){
                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'lockMoney', params:obj});
            }
            cb(null, new UserOk('Денежные средства успешно заблокированы.'));
        }
    });
}

Model.prototype.unlockMoney = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    if (obj.fromClient) return cb(new MyError('Запрещено'));
    var amount = +obj.amount;
    if (isNaN(amount) || amount <= 0) return cb(new MyError('Не корректно передана сумма',{obj:obj}));

    var lock_key = obj.lock_key;
    var locked;
    var account;
    async.series({
        lock: function (cb) {
            if (lock_key) return cb(null);
            _t.lock({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось заблокировать запись.',{obj:obj, err:err}));
                lock_key = res;
                locked = true;
                cb(null);
            })
        },
        get: function (cb) {
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить счет.',{id:id,err:err}));
                if (!res.length) return cb(new MyError('Счет не найден',{id:id,res:res}));
                account = res[0];
                cb(null);
            });
        },
        check: function (cb) {
            if (Math.round((account.available_amount + account.locked_amount)*100)/100 != Math.round(account.total_amount*100)/100) {
                return cb(new MyError('Проблема со счетом №: ' + account.id + '. Обратитесь к администратору.'));
            }
            if (account.locked_amount - amount < 0) return cb(new UserError('Нельзя разблокировать болше средств, чем сейчас заблокировано. Обратитесь к администратору.'));
            cb(null);
        },
        makeOperation: function (cb) {
            var o = {
                command:'add',
                object:'investor_account_operation',
                params:{
                    investor_account_id:id,
                    type_sysname:'UNBLOCK',
                    subtype_sysname:obj.subtype_sysname,
                    merchant_financing_id:obj.merchant_financing_id,
                    contractor_account_id:obj.contractor_account_id,
                    payment_id:obj.payment_id,
                    purpose:obj.purpose || 'Разблокировка денежных средств',
                    amount:amount,
                    operation_date:obj.operation_date,
                    rollback_key:rollback_key
                }
            }
            _t.api(o, function (err) {
                if (err) return cb(new MyError('Не удалось создать операцию по счету.',{o:o, err:err}));
                cb(null);
            })
        },
        updateAccount: function (cb) {
            var new_available_amount = +account.available_amount + amount;
            var new_locked_amount = +account.locked_amount - amount;
            if (Math.round((new_available_amount + new_locked_amount)*100)/100 != Math.round(account.total_amount*100)/100) {
                return cb(new MyError('Проблема со счетом №: ' + account.id + '. Обратитесь к администратору.'));
            }
            var params = {
                id:id,
                locked_amount:new_locked_amount,
                available_amount:new_available_amount,
                rollback_key:rollback_key,
                lock_key:lock_key
            }
            _t.modify(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось обновить данные по счету.',{params:params, err:err}));
                cb(null);
            })
        },
        addHistory: function (cb) {
            var o = {
                id:id,
                desc:'Разблокировка денежных средств. Сумма: ' + amount,
                rollback_key:rollback_key
            }
            _t.addHistory(o,cb);
        }
    },function (err, res) {
        if (locked){
            _t.unlock({id:id, lock_key:lock_key}, function (err) {
                console.log('unlock ERROR => ', err);
            });
        }
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!obj.doNotSaveRollback){
                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'unlockMoney', params:obj});
            }
            cb(null, new UserOk('Денежные средства успешно разблокированы.'));
        }
    });
}

Model.prototype.remittanceBankCommisionToMainInv = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var financing_id = obj.financing_id;
    if (isNaN(+financing_id)) return cb(new MyError('Не передан financing_id',{obj:obj}));
    var contractor_account_id = obj.contractor_account_id;
    if (isNaN(+contractor_account_id)) return cb(new MyError('Не передан contractor_account_id',{obj:obj}));
    var amount = +obj.amount;
    if (isNaN(amount)) return cb(new MyError('Не корректно передана сумма',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    if (obj.fromClient) return cb(new MyError('Запрещено'));

    // Получить счет главного инвестора
    // Зачислить деньги
    // Заблокировать деньги до взаиморасчета с банком

    var main_investor, main_investor_account;
    var investor_account;
    async.series({
        getInvestorAccount: function (cb) {
            _t.getById({id: contractor_account_id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить счет инвестора (не основного).', {id: id, err: err}));
                investor_account = res[0];
                cb(null);
            });
        },
        getMainInvAccount: function (cb) {
            async.series({
                getInv: function (cb) {
                    var o = {
                        command: 'get',
                        object: 'investor',
                        params: {
                            param_where: {
                                main_investor:true
                            },
                            collapseData: false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить основного инвестора', {o: o, err: err}));
                        if (!res.length) return cb(new MyError('Основной инвестор не найден',{o:o, res:res}));
                        if (res.length > 1) return cb(new MyError('Слишком много основных инвесторов.',{o:o, res:res}));
                        main_investor = res[0];
                        cb(null);
                    });
                },
                getMainInvAccount: function (cb) {
                    _t.getById({id: main_investor.default_investor_account_id}, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить счет основного инвестора.', {id: id, err: err}));
                        main_investor_account = res[0];
                        cb(null);
                    });
                }
            },cb);
        },
        withdrawFundsFromInv: function (cb) { // Списать деньги с инвестора
            async.series({
                // modify: function (cb) {
                //     investor_account.total_amount -= amount;
                //     investor_account.available_amount -= amount;
                //     var params = {
                //         id:investor_account.id,
                //         total_amount: investor_account.total_amount,
                //         available_amount: investor_account.available_amount,
                //         rollback_key:rollback_key
                //     };
                //     _t.modify(params, function (err, res) {
                //         if (err) return cb(new MyError('Не удалось списать деньги со счета инвестора.',{amount:amount, params:params, err:err}));
                //         cb(null);
                //     })
                // },
                addOperation: function (cb) {
                    var o = {
                        command:'add',
                        object:'investor_account_operation',
                        params:{
                            investor_account_id:investor_account.id,
                            merchant_financing_id:financing_id,
                            contractor_account_id:main_investor_account.id,
                            payment_id:obj.payment_id,
                            subtype_sysname:'WRITE-OF_FOR_BANK_COMISSION',
                            type_sysname:'CREDIT',
                            purpose:'Списание под комиссию банка',
                            amount:amount,
                            operation_date:obj.operation_date,
                            rollback_key:rollback_key
                        }
                    };
                    _t.api(o, function (err) {
                        if (err) return cb(new MyError('Не удалось создать операцию по счету.',{o:o, err:err}));
                        cb(null);
                    });
                }
            }, cb);
        },
        addToAccount: function (cb) {
            async.series({
                // modify: function (cb) {
                //     main_investor_account.total_amount += amount;
                //     main_investor_account.available_amount += amount;
                //     var params = {
                //         id:main_investor_account.id,
                //         total_amount: main_investor_account.total_amount,
                //         available_amount: main_investor_account.available_amount,
                //         rollback_key:rollback_key
                //     }
                //     _t.modify(params, function (err, res) {
                //         if (err) return cb(new MyError('Не удалось внести деньги на счет.',{params:params, err:err}));
                //         cb(null);
                //     })
                // },
                addOperation: function (cb) {
                    var o = {
                        command:'add',
                        object:'investor_account_operation',
                        params:{
                            investor_account_id:main_investor_account.id,
                            merchant_financing_id:financing_id,
                            contractor_account_id:contractor_account_id,
                            payment_id:obj.payment_id,
                            subtype_sysname:'REMITTANCE_FOR_BANK_COMISSION',
                            type_sysname:'DEBIT',
                            purpose:'Поступление средств под комиссию банка',
                            amount:amount,
                            operation_date:obj.operation_date,
                            rollback_key:rollback_key
                        }
                    }
                    _t.api(o, function (err) {
                        if (err) return cb(new MyError('Не удалось создать операцию по счету.',{o:o, err:err}));
                        cb(null);
                    });
                }
            }, cb);
        }
        //blockForBankMerchMoney: function (cb) {
        //    // Заблокировать деньги до взаиморасчета с банком
        //    var params = {
        //        id:main_investor_account.id,
        //        amount:amount,
        //        merchant_financing_id:financing_id,
        //        payment_id:obj.payment_id,
        //        subtype_sysname:'BLOCK_FOR_BANK_COMISSION_FROM_MERCH',
        //        purpose:'Блокировка средств под комиссию банка (от торговца)',
        //        rollback_key:rollback_key,
        //        doNotSaveRollback:true
        //    }
        //    _t.lockMoney(params, function (err, res) {
        //        if (err) return cb(new MyError('Не удалось заблокировать средства полученные от торговца на комиссию банка.',{params:params,err:err}));
        //        cb(null);
        //    })
        //}
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
}

Model.prototype.blockMainIvnPartOfBankComission = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var financing_id = obj.financing_id;
    if (isNaN(+financing_id)) return cb(new MyError('Не передан financing_id',{obj:obj}));
    var amount = +obj.amount;
    if (isNaN(amount)) return cb(new MyError('Не корректно передана сумма',{obj:ob}));
    var rollback_key = obj.rollback_key || rollback.create();
    if (obj.fromClient) return cb(new MyError('Запрещено'));

    // Получить счет главного инвестора
    // Заблокировать деньги до взаиморасчета с банком

    var main_investor, main_investor_account;
    async.series({
        getMainInvAccount: function (cb) {
            async.series({
                getInv: function (cb) {
                    var o = {
                        command: 'get',
                        object: 'investor',
                        params: {
                            param_where: {
                                main_investor:true
                            },
                            collapseData: false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить основного инвестора', {o: o, err: err}));
                        if (!res.length) return cb(new MyError('Основной инвестор не найден',{o:o, res:res}));
                        if (res.length > 1) return cb(new MyError('Слишком много основных инвесторов.',{o:o, res:res}));
                        main_investor = res[0];
                        cb(null);
                    });
                },
                getMainInvAccount: function (cb) {
                    _t.getById({id: main_investor.default_investor_account_id}, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить счет основного инвестора.', {id: id, err: err}));
                        main_investor_account = res[0];
                        cb(null);
                    });
                }
            },cb);
        },
        blockForBankMerchMoney: function (cb) {
            // Заблокировать деньги до взаиморасчета с банком
            var params = {
                id:main_investor_account.id,
                amount:amount,
                merchant_financing_id:financing_id,
                subtype_sysname:'BLOCK_FOR_BANK_COMISSION_MAIN_INV',
                payment_id:obj.payment_id,
                purpose:'Блокировка средств под комиссию банка (от компании)',
                rollback_key:rollback_key,
                operation_date:obj.operation_date,
                doNotSaveRollback:true
            }
            _t.lockMoney(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось заблокировать средства основной компании на комиссию банка.',{params:params,err:err}));
                cb(null);
            })
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

Model.prototype.makePaymentFromMerch = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var financing_id = obj.financing_id;
    if (isNaN(+financing_id)) return cb(new MyError('Не передан financing_id',{obj:obj}));
    var amount = +obj.amount;
    if (isNaN(amount)) return cb(new MyError('Не корректно передана сумма',{obj:obj}));
    var percent = +obj.percent;
    if (isNaN(percent)) return cb(new MyError('Не корректно percent',{obj:obj}));
    var mgm_fee = +obj.mgm_fee;
    if(!mgm_fee) return cb(new MyError('Не передан mgm_fee',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    if (obj.fromClient) return cb(new MyError('Запрещено'));
    var payment = obj.payment;
    if (typeof payment!='object') return cb(new MyError('Необходимо передать payment'));

    // Получить счет
    // Получить финансирование
    // Зачислить на счет
    // Залочить деньги для главного инвестора - комиссия компании
    // Перевести комиссию банка главному инвестору (он ее залочит)
    // Залочить деньги у главного инвестора для банка (только долю Главной компании. Доля мерча залочена на предыдущем шаге)
    var account, financing, bank_commision;
    var d1 = moment();
    async.series({
        getById: function (cb) {
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить счет инвестора.',{id:id, err:err}));
                account = res[0];
                cb(null);
            });
        },
        getFinancing: function (cb) {
            var o = {
                command: 'getById',
                object: 'merchant_financing',
                params: {
                    id: financing_id
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить финансирование', {o: o, err: err}));
                financing = res[0];
                cb(null);
            });
        },
        makePayment: function (cb) {
            // Зачислить на счет
            async.series({
                // modify: function (cb) {
                //     account.total_amount += amount;
                //     account.available_amount += amount;
                //     var params = {
                //         id:account.id,
                //         total_amount: account.total_amount,
                //         available_amount: account.available_amount,
                //         rollback_key:rollback_key
                //     };
                //     _t.modify(params, function (err, res) {
                //         if (err) return cb(new MyError('Не удалось перевести деньги на счет.',{params:params, err:err}));
                //         cb(null);
                //     })
                // },
                addOperation: function (cb) {

                    var o = {
                        command:'add',
                        object:'investor_account_operation',
                        params:{
                            investor_account_id:id,
                            merchant_financing_id:financing_id,
                            payment_id:payment.id,
                            type_sysname:'DEBIT',
                            subtype_sysname:'REMITTANCE_FROM_MERCH',
                            purpose:'Поступление от торговца',
                            operation_date:obj.operation_date,
                            amount:amount,
                            rollback_key:rollback_key
                        }
                    };
                    _t.api(o, function (err, res) {
                        console.log('addOperation',moment().diff(d1));
                        if (err) return cb(new MyError('Не удалось создать операцию по счету.',{o:o, err:err}));
                        cb(null);
                    })
                }
            },cb);
        },


        lockMainInveComission: function (cb) {
            // Залочить деньги для главного инвестора - комиссия VG
            //if (account.is_default) return cb(null);
            if (!financing.processing_bank_commission) return cb(new UserError('У финансирование не проставлена коммисия банка. Торговец: ' + financing.merchant_name));
            if (+financing.processing_bank_commission < 0 || +financing.processing_bank_commission > 100) return cb(new MyError('Не корректно указана комиссия банка',{financing:financing}));
            var profit_amount = +amount * financing.factoring_rate / (100 + financing.factoring_rate);
            var payment_body = +amount * 100 / (100 + financing.factoring_rate);


            // Получить тип лида - из финансирования (есть)
            // Получить размер вознаграждения брокера - из
            // Получить процент комиссии mgm fee


            var broker_comission_percent = (+financing.broker_comission + (+financing.agent_comission || 0)) / 100;
            var mgm_fee_percent = +mgm_fee / 100;

            bank_commision = (payment_body * broker_comission_percent + amount * financing.processing_bank_commission / 100);

            var main_company_comission_amount = (amount - payment_body - bank_commision) * mgm_fee_percent;
            
            console.log('AAAAAAAAAAAA', mgm_fee_percent, mgm_fee, main_company_comission_amount);
            if (main_company_comission_amount == 0) debugger;


            var params = {
                id:id,
                amount:main_company_comission_amount,
                merchant_financing_id:financing_id,
                payment_id:payment.id,
                subtype_sysname:'MARK_TO_COMPANY_COMISSION',
                purpose:'Маркировка средств под комиссию компании.',
                operation_date:obj.operation_date,
                rollback_key:rollback_key,
                doNotSaveRollback:true
            };
            _t.markMoney(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось провести операцию ',{params:params, err:err}));
                cb(null);
            });
        },
        remittanceBankCommisionToMainInv: function (cb) {
            // Перевести комиссию банка главному инвестору (он ее залочит)
            //if (account.is_default) return cb(null);
            var params = {
                financing_id:financing_id,
                contractor_account_id:account.id,
                payment_id:payment.id,
                amount:bank_commision,
                operation_date:obj.operation_date,
                rollback_key:rollback_key
            };

            _t.remittanceBankCommisionToMainInv(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось перевести деньги главной компании (под комиссию банка)',{params:params, err:err}));
                cb(null);
            })
        },
        calc_amounts:function(cb){
            var main_investor;
            async.series({
                getInv: function (cb) {
                    var o = {
                        command: 'get',
                        object: 'investor',
                        params: {
                            param_where: {
                                main_investor:true
                            },
                            collapseData: false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить основного инвестора', {o: o, err: err}));
                        if (!res.length) return cb(new MyError('Основной инвестор не найден',{o:o, res:res}));
                        if (res.length > 1) return cb(new MyError('Слишком много основных инвесторов.',{o:o, res:res}));
                        main_investor = res[0];
                        cb(null);
                    });
                },
                calcCurrentInv:function(cb){
                    _t.calc_amounts(obj, function(err){
                        cb(err);
                    })
                },
                calcMainInv:function(cb){
                    obj.id = main_investor.default_investor_account_id;
                    _t.calc_amounts(obj, function(err){
                        cb(err);
                    })
                }

            },cb);
        },
        calc_amountsMainInv:function(cb){
            var main_investor;
            async.series({
                getMainInvAccount: function (cb) {
                    async.series({
                        getInv: function (cb) {
                            var o = {
                                command: 'get',
                                object: 'investor',
                                params: {
                                    param_where: {
                                        main_investor:true
                                    },
                                    collapseData: false
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось получить основного инвестора', {o: o, err: err}));
                                if (!res.length) return cb(new MyError('Основной инвестор не найден',{o:o, res:res}));
                                if (res.length > 1) return cb(new MyError('Слишком много основных инвесторов.',{o:o, res:res}));
                                main_investor = res[0];
                                cb(null);
                            });
                        },
                        calc:function(cb){
                            obj.id = main_investor.default_investor_account_id;
                            _t.calc_amounts(obj, function(err){
                                cb(err);
                            })
                        }
                    },cb);
                }
            },cb);

        }
        //blockMainIvnPartOfBankComission: function (cb) {
        //    //if (account.is_default) return cb(null);
        //    var params = {
        //        financing_id:financing_id,
        //        payment_id:payment.id,
        //        amount:bank_commision,
        //        rollback_key:rollback_key
        //    }
        //    _t.blockMainIvnPartOfBankComission(params, function (err) {
        //        if (err) return cb(new MyError('Не удалось заблокировать средства главной компании на комиссию банку.',{params:params, err:err}));
        //        cb(null);
        //    });
        //}
    },function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!obj.doNotSaveRollback){
                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'makePaymentFromMerch', params:obj});
            }
            cb(null, new UserOk('Ок'));
        }
    });
}

/**
 * По завершениию финансирования, надо собрать комиссию компании по всем инвесторам (из финансирования)
 * разлочить средства и перевести их главной компании
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.remittanceMainCompanyComission = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    if (obj.fromClient) return cb(new MyError('Запрещено'));
    var investment_plan_merchant_investor = obj.investment_plan_merchant_investor;
    if (typeof investment_plan_merchant_investor!='object') return cb(new MyError('Не передан investment_plan_merchant_investor',{obj:obj}));
    var merchant_financing = obj.merchant_financing;
    if (typeof merchant_financing!='object') return cb(new MyError('Не передан merchant_financing',{obj:obj}));
    var operation_date = obj.operation_date || funcs.getDateTimeMySQL();

    var account, operations;
    var main_investor_account;
    var total_amount = 0;
    var main_investor;
    async.series({
        getAccount: function (cb) {
            _t.getById({id: investment_plan_merchant_investor.investor_account_id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить account.', {id: id, err: err}));
                account = res[0];
                cb(null);
            });
        },
        getMainInvAccount: function (cb) {
            async.series({
                getInv: function (cb) {
                    var o = {
                        command: 'get',
                        object: 'investor',
                        params: {
                            param_where: {
                                main_investor:true
                            },
                            collapseData: false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить основного инвестора', {o: o, err: err}));
                        if (!res.length) return cb(new MyError('Основной инвестор не найден',{o:o, res:res}));
                        if (res.length > 1) return cb(new MyError('Слишком много основных инвесторов.',{o:o, res:res}));
                        main_investor = res[0];
                        cb(null);
                    });
                },
                getMainInvAccount: function (cb) {
                    _t.getById({id: main_investor.default_investor_account_id}, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить счет основного инвестора.', {id: id, err: err}));
                        main_investor_account = res[0];
                        cb(null);
                    });
                }
            },cb);
        },
        getOperations: function (cb) {
            var o = {
                command: 'get',
                object: 'investor_account_operation',
                params: {
                    param_where: {
                        investor_account_id:account.id,
                        merchant_financing_id:merchant_financing.id,
                        subtype_sysname:'MARK_TO_COMPANY_COMISSION'
                    },
                    collapseData: false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить операции маркировки под комиссию компании', {o: o, err: err}));
                operations = res;
                cb(null);
            });
        },
        unblockAndRemmiance: function (cb) {

            for (var i in operations) {
                var oper = operations[i];
                total_amount += +oper.amount;
            }
            async.series({
                //unblockOnInv: function (cb) {
                //    var o = {
                //        command:'add',
                //        object:'investor_account_operation',
                //        params:{
                //            investor_account_id:account.id,
                //            type_sysname:'UNBLOCK',
                //            subtype_sysname:'UNBLOCK_TO_REMITTANCE_MAIN_INV_COMISSION',
                //            merchant_financing_id:merchant_financing.id,
                //            contractor_account_id:main_investor_account.id,
                //            purpose:obj.purpose || 'Разблокировка для перевода комиссии главной компании',
                //            amount:total_amount,
                //            rollback_key:rollback_key
                //        }
                //    }
                //    _t.api(o, function (err) {
                //        if (err) return cb(new MyError('Не удалось создать операцию по счету.',{o:o, err:err}));
                //        cb(null);
                //    });
                //},
                remittanceFromInv: function (cb) {
                    var o = {
                        command:'add',
                        object:'investor_account_operation',
                        params:{
                            investor_account_id:account.id,
                            type_sysname:'CREDIT',
                            subtype_sysname:'REMITTANCE_MAIN_INV_COMISSION',
                            merchant_financing_id:merchant_financing.id,
                            contractor_account_id:main_investor_account.id,
                            operation_date:operation_date,
                            purpose:obj.purpose || 'Перевод комиссии главной компании',
                            amount:total_amount,
                            rollback_key:rollback_key
                        }
                    }
                    _t.api(o, function (err) {
                        if (err) return cb(new MyError('Не удалось создать операцию по счету.',{o:o, err:err}));
                        cb(null);
                    });
                },
                remittanceToMainCompany: function (cb) {
                    var o = {
                        command:'add',
                        object:'investor_account_operation',
                        params:{
                            investor_account_id:main_investor_account.id,
                            type_sysname:'DEBIT',
                            subtype_sysname:'GET_MAIN_COMPANY_REMITTANCE',
                            merchant_financing_id:merchant_financing.id,
                            contractor_account_id:account.id,
                            operation_date:operation_date,
                            purpose:obj.purpose || 'Получение комиссии главной компании',
                            amount:total_amount,
                            rollback_key:rollback_key
                        }
                    }
                    _t.api(o, function (err) {
                        if (err) return cb(new MyError('Не удалось создать операцию по счету.',{o:o, err:err}));
                        cb(null);
                    });
                },
                modifyInvAccount: function (cb) {
                    var new_total_amount = +account.total_amount - total_amount;
                    var new_total_available = +account.available_amount - total_amount;
                    //var new_locked_amount = +account.locked_amount - total_amount;
                    if (Math.round((new_total_available + account.locked_amount)*100)/100 != Math.round(new_total_amount*100)/100) {
                        return cb(new MyError('Проблема со счетом №: ' + account.id + '. Обратитесь к администратору.'));
                    }
                    var params = {
                        id:account.id,
                        total_amount:new_total_amount,
                        available_amount:new_total_available,
                        rollback_key:rollback_key
                    }
                    _t.modify(params, function (err, res) {
                        if (err) return cb(new MyError('Не удалось обновить данные по счету.',{params:params, err:err}));
                        cb(null);
                    })
                },
                modifyMainCompanyAccount: function (cb) {
                    var new_available_amount = +main_investor_account.available_amount + total_amount;
                    var new_total_amount = +main_investor_account.total_amount + total_amount;
                    if (Math.round((new_available_amount + main_investor_account.locked_amount)*100)/100 != Math.round(new_total_amount*100)/100) {
                        return cb(new MyError('Проблема со счетом №: ' + main_investor_account.id + '. Обратитесь к администратору.'));
                    }
                    var params = {
                        id:main_investor_account.id,
                        total_amount:new_total_amount,
                        available_amount:new_available_amount,
                        rollback_key:rollback_key
                    }
                    _t.modify(params, function (err, res) {
                        if (err) return cb(new MyError('Не удалось обновить данные по счету.',{params:params, err:err}));
                        cb(null);
                    })
                }
            },cb);
        }
    },function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!obj.doNotSaveRollback){
                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'METHOD_NAME', params:obj});
            }
            cb(null, new UserOk('Ок'));
        }
    });
}

/**
 * Вывод денег со счета
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.witdrawalOfFunds = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    var operation_date = obj.operation_date;
    var amount = obj.amount;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    if (isNaN(+amount)) return cb(new UserError('Не корректно передана сумма',{obj:obj}));
    if (amount <= 0) return cb(new UserError('Сумма должна быть больше нуля',{obj:obj}));
    if (!funcs.validation.isDate(operation_date)) return cb(new UserError('Не корректно передана дата.',{operation_date:operation_date}));
    var rollback_key = obj.rollback_key || rollback.create();

    // Получить счет
    // Проверить доступные средства
    // Провести операцию
    var account;
    async.series({
        getAccount: function (cb) {
            _t.getById({id: id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить счет.', {id: id, err: err}));
                account = res[0];
                cb(null);
            });
        },
        check: function (cb) {
            if (+account.available_amount - amount < 0) return cb(new UserError('Недостаточно средств на счете. Доступно: ' + account.available_amount));
            cb(null);
        },
        // modify: function (cb) {
        //     account.total_amount -= amount;
        //     account.available_amount -= amount;
        //     var params = {
        //         id:account.id,
        //         total_amount: account.total_amount,
        //         available_amount: account.available_amount,
        //         rollback_key:rollback_key
        //     }
        //     _t.modify(params, function (err, res) {
        //         if (err) return cb(new MyError('Не удалось внести деньги на счет.',{params:params, err:err}));
        //         cb(null);
        //     })
        // },
        addOperation: function (cb) {
            var o = {
                command:'add',
                object:'investor_account_operation',
                params:{
                    investor_account_id:id,
                    subtype_sysname:'WITHDRAWAL_OF_FUNDS',
                    type_sysname:'CREDIT',
                    purpose:'Вывод средств со счета',
                    amount:amount,
                    purpose:obj.purpose,
                    operation_date:operation_date,
                    rollback_key:rollback_key
                }
            }
            _t.api(o, function (err) {
                if (err) return cb(new MyError('Не удалось создать операцию по счету.',{o:o, err:err}));
                cb(null);
            })
        },
        calc_amounts:function(cb){
            // return cb(null);
            _t.calc_amounts(obj, function(err){
                cb(err);
            })
        }
    },function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!obj.doNotSaveRollback){
                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'witdrawalOfFunds', params:obj});
            }
            cb(null, new UserOk('Деньги сняты со счета. Сумма: ' + amount));
        }
    });
};




// var o = {
//     command:'calc_amounts',
//     object:'investor_account',
//     params:{
//         id:5
//     }
// };
// socketQuery(o, function(res){
//     console.log(res);
// });

Model.prototype.calc_amounts = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();


    var account, operations;
    var toModify;
    var available = 0;
    var locked = 0;
    var total = 0;
    var account_sum = {};
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить счет инвестора.',{id:id,err:err}));
                account = res[0];
                cb(null);
            });
        },
        getOperations:function(cb){
            var o = {
                command:'get',
                object:'investor_account_operation',
                params:{
                    specColumns:{
                        sum:'SUM(amount)'
                    },
                    param_where:{
                        investor_account_id:id
                    },
                    // columns:['type_id','type_sysname'],
                    columns:['type_sysname'],
                    sort:{
                        columns:['type_sysname'],
                        directions:['asc']
                    },
                    groupBy:['type_sysname'],
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить операции по счету инвестора',{o : o, err : err}));
                for (var i in res) {
                    account_sum[res[i].type_sysname] = res[i].sum;
                }
                cb(null);
            });
        },
        merge:function(cb){

            for (var i in account_sum) {
                var sum = account_sum[i];
                switch (i){
                    case 'DEBIT':
                        available += +sum;
                        total += +sum;
                        break;
                    case 'CREDIT':
                        available -= +sum;
                        total -= +sum;
                        break;
                    case 'BLOCK':
                        locked += +sum;
                        available -= +sum;
                        break;
                    case 'UNBLOCK':
                        locked -= +sum;
                        available += +sum;
                        break;
                    case 'MARK':
                        break;
                }
            }

            if (Math.round((available + locked)*100)/100 != Math.round(total*100)/100) {
                return cb(new MyError('Проблема со счетом №: ' + id + '. Обратитесь к администратору.'));
            }
            available = Math.round(available * 100) / 100;
            locked = Math.round(locked * 100) / 100;
            total = Math.round(total * 100) / 100;
            cb(null);
            //UPDATE investor_account_operation set type_id = 4 where subtype_id = 13 and type_id = 1
        },
        saveChanges:function(cb){
            if (available == account.available_amount && locked == account.locked_amount && total == account.total_amount) return cb(null);
            var params = {
                id:id,
                rollback_key: rollback_key,
                lock_key:obj.lock_key
            };
            if (available != account.available_amount) params.available_amount = available;
            if (locked != account.locked_amount) params.locked_amount = locked;
            if (total != account.total_amount) params.total_amount = total;
            _t.modifyPrototype(params, function(err){
                if (err) return cb(new MyError('Не удалось установить посчитыннае данные по счету инвестора',{params:params, err:err}));
                cb(null);
            })
        }
    },function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!obj.doNotSaveRollback){
                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'calc_amounts', params:obj});
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
}

module.exports = Model;
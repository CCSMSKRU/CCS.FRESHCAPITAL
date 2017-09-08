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
//    command:'getActive',
//    object:'investment_plan'
//}
//socketQuery(o, function (err, res) {
//    console.log(err, res);
//})
Model.prototype.getActive = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var rollback_key = obj.rollback_key || rollback.create();

    var plan;
    var plan_financings = [];
    var investor_ids = [];
    var investors;
    async.series({
        getActivePlan: function (cb) {
            var plan_id;
            async.series({
                get: function (cb) {
                    var params = {
                        param_where:{
                            status_sysname:'ACTIVE'
                        },
                        collapseData:false
                    }
                    _t.get(params, function (err, res) {
                        if (err) return cb(new MyError('При попытке получить план финансирования возникла ош.',{params:params, err:err}));
                        if (res.length>1) return cb(new MyError('Активных планов финансирования более одного.',{params:params, res:res}));
                        if (!res.length) return cb(null);
                        plan = res[0];
                        return cb(null);
                    });
                },
                addActive: function (cb) {
                    if (plan) return cb(null); // Уже получен, создавать новый не надо
                    var params = {
                        rollback_key:rollback_key
                    };
                    _t.add(params, function (err, res) {
                        if (err) return cb(new MyError('Не удалось добавить план финансирования.',{params:params, err:err}));
                        plan_id = res.id;
                        cb(null);
                    })
                },
                getAdded: function (cb) {
                    if (plan) return cb(null); // Уже получен
                    _t.getById({id:plan_id}, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить план финансирования, который только что добавили.',{id:plan_id, err:err}));
                        if (!res.length) return cb(new MyError('Только что добавленный план финансирования, почему-то, отсутствует в системе',{id:id, res:res}));
                        plan = res[0];
                        return cb(null);
                    })
                }
            },cb);
        },
        getNewFinancingAndAddToPlan: function (cb) {
            // Получим фнансирования которые ожидают распределения и еще не состоят в плане и добавим их
            var financings;
            async.series({
                getNewFinancing: function (cb) {
                    var o = {
                        command:'get',
                        object:'merchant_financing',
                        params:{
                            where:[
                                {
                                    key:'status_sysname',
                                    val1:'WAIT_INVESTORS'
                                },
                                {
                                    key:'investment_plan_id',
                                    type:'isNull'
                                }
                            ],
                            collapseData:false
                        }
                    }
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить финансирования, которые ожидают верстки',{o:o,err:err}));
                        financings = res;
                        cb(null);
                    })
                },
                addToPlan: function (cb) {
                    async.eachSeries(financings, function (item, cb) {
                        var o = {
                            command:'add',
                            object:'investment_plan_merchant',
                            params:{
                                investment_plan_id:plan.id,
                                merchant_financing_id:item.id,
                                rollback_key:rollback_key
                            }
                        };
                        _t.api(o, function (err, res) {
                            if (err) return cb(new MyError('Не удалось добавить финансирование в план.',{o:o,err:err}));
                            // Обновим plan_id у финансирования
                            var o = {
                                command:'modify',
                                object:'merchant_financing',
                                params:{
                                    id:item.id,
                                    investment_plan_id:plan.id,
                                    rollback_key:rollback_key
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось задать финансированию investment_plan_id.',{o:o, err:err}));
                                cb(null);
                            });
                        })
                    },cb);
                }
            },cb);
        },
        getPlanFinansings: function (cb) { //investment_plan_merchant
            var o = {
                command:'get',
                object:'investment_plan_merchant',
                params:{
                    param_where:{
                        investment_plan_id:plan.id
                    },
                    collapseData:false
                }
            }
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить финансирования плана.',{o:o,err:err}));
                for (var i in res) {
                    res[i].invests = {};
                    res[i].investments = [];
                    plan_financings.push(res[i]);
                }

                cb(null);
            })
        },
        getInvestment: function (cb) { // investment_plan_merchant_investor
            async.eachSeries(plan_financings, function (merch_in_plan, cb) {
                var o = {
                    command:'get',
                    object:'investment_plan_merchant_investor',
                    params:{
                        param_where:{
                            investment_plan_merchant_id:merch_in_plan.id
                        },
                        collapseData:false
                    }
                };
                _t.api(o, function (err, res) {
                    if (err) return cb(new MyError('Не удалось получить investment_plan_merchant_investor',{o:o, err:err}));
                    var total_invested_amount = 0;
                    for (var i in res) {
                        var merchant_invest = res[i];
                        if (investor_ids.indexOf(merchant_invest.investor_id) == -1) investor_ids.push(merchant_invest.investor_id);
                        total_invested_amount += +merchant_invest.amount;
                        merch_in_plan.invests[merchant_invest.investor_id] = merchant_invest;
                    }
                    merch_in_plan.total_invested_amount = total_invested_amount;
                    merch_in_plan.need_invested_amount = +merch_in_plan.founding_amount - total_invested_amount;
                    cb(null);
                })
            }, cb);
        },
        getInvestors: function (cb) {
            var o = {
                command:'get',
                object:'investor',
                params:{
                    where:[],
                    collapseData:false
                }
            };
            o.params.where.push(
                {
                    key:'available_amount',
                    type:'>',
                    val1:"0",
                    group:'group2'
                }
            )
            o.params.where.push(
                {
                    key:'status_sysname',
                    val1:'ACTIVE',
                    group:'group2'
                }
            )
            if (investor_ids.length){ // Здесь важна последовательность так как присутствует условие OR
                o.params.where.push(
                    {
                        key:'id',
                        type:'in',
                        val1:investor_ids,
                        comparisonType:'OR',
                        group:'group2'
                    }
                )
            }
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить инвесторов',{o:o, err:err}));
                investors = res;
                cb(null);
            });
        },
        prepareResponse: function (cb) {
            for (var i in investors) {
                var investor = investors[i];
                for (var j in plan_financings) {
                    var plan_f = plan_financings[j];
                    //if (!plan_f.investments) plan_f.investments = [];
                    var one_invest = plan_f.invests[investor.id] || {
                            investor_id:investor.id,
                            amount:0
                        };
                    one_invest.investor_status_sysname = investor.status_sysname;
                    plan_f.investments.push(one_invest);
                }
            }
            plan.plan_financings = plan_financings;
            plan.investors = investors;
            return cb(null);
        }
    },function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            //rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'METHOD_NAME', params:obj});
            cb(null, new UserOk('noToastr',{plan:plan}));
        }
    });
}

Model.prototype.getArchive = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();

    var plan;
    var plan_financings = [];
    var investor_ids = [];
    var investors;
    async.series({
        get: function (cb) {
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить план финансирования.',{id:id, err:err}));
                plan = res[0];
                return cb(null);
            });
        },
        getPlanFinansings: function (cb) { //investment_plan_merchant
            var o = {
                command:'get',
                object:'investment_plan_merchant',
                params:{
                    param_where:{
                        investment_plan_id:plan.id
                    },
                    collapseData:false
                }
            }
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить финансирования плана.',{o:o,err:err}));
                for (var i in res) {
                    res[i].invests = {};
                    res[i].investments = [];
                    plan_financings.push(res[i]);
                }

                cb(null);
            })
        },
        getInvestment: function (cb) { // investment_plan_merchant_investor
            async.eachSeries(plan_financings, function (merch_in_plan, cb) {
                var o = {
                    command:'get',
                    object:'investment_plan_merchant_investor',
                    params:{
                        param_where:{
                            investment_plan_merchant_id:merch_in_plan.id
                        },
                        collapseData:false
                    }
                };
                _t.api(o, function (err, res) {
                    if (err) return cb(new MyError('Не удалось получить investment_plan_merchant_investor',{o:o, err:err}));
                    var total_invested_amount = 0;
                    for (var i in res) {
                        var merchant_invest = res[i];
                        if (investor_ids.indexOf(merchant_invest.investor_id) == -1) investor_ids.push(merchant_invest.investor_id);
                        total_invested_amount += +merchant_invest.amount;
                        merch_in_plan.invests[merchant_invest.investor_id] = merchant_invest;
                    }
                    merch_in_plan.total_invested_amount = total_invested_amount;
                    merch_in_plan.need_invested_amount = +merch_in_plan.founding_amount - total_invested_amount;
                    cb(null);
                })
            }, cb);
        },
        getInvestors: function (cb) {
            var o = {
                command:'get',
                object:'investor',
                params:{
                    where:[],
                    collapseData:false
                }
            };
            o.params.where.push(
                {
                    key:'available_amount',
                    type:'>',
                    val1:"0",
                    group:'group2'
                }
            )
            o.params.where.push(
                {
                    key:'status_sysname',
                    val1:'ACTIVE',
                    group:'group2'
                }
            )
            if (investor_ids.length){ // Здесь важна последовательность так как присутствует условие OR
                o.params.where.push(
                    {
                        key:'id',
                        type:'in',
                        val1:investor_ids,
                        comparisonType:'OR',
                        group:'group2'
                    }
                )
            }
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить инвесторов',{o:o, err:err}));
                investors = res;
                cb(null);
            });
        },
        prepareResponse: function (cb) {
            for (var i in investors) {
                var investor = investors[i];
                for (var j in plan_financings) {
                    var plan_f = plan_financings[j];
                    //if (!plan_f.investments) plan_f.investments = [];
                    var one_invest = plan_f.invests[investor.id] || {
                            investor_id:investor.id,
                            amount:0
                        };
                    one_invest.investor_status_sysname = investor.status_sysname;
                    plan_f.investments.push(one_invest);
                }
            }
            plan.plan_financings = plan_financings;
            plan.investors = investors;
            return cb(null);
        }
    },function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            //rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'METHOD_NAME', params:obj});
            cb(null, new UserOk('noToastr',{plan:plan}));
        }
    });
}


var obj = {
    id:1,
    plan:{
        1:{
            fin_id:1,
            inv_id:1,
            amount:1000,
            new_amount:1500
        },
        2:{
            fin_id:1,
            inv_id:2,
            amount:0,
            new_amount:500
        }
    }
}

var obj = {
    id:1,
    plan:{
        1:[
            {
                fin_id:1,
                inv_id:1,
                amount:1000,
                new_amount:1500
            },
            {
                fin_id:1,
                inv_id:2,
                amount:0,
                new_amount:500
            }
        ],
        2:[
            {
                fin_id:2,
                inv_id:1,
                amount:0,
                new_amount:100
            }
        ]
    }
}

Model.prototype.save = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    var plan_changes = obj.plan_changes;
    if (typeof plan_changes!=='object') return cb(new MyError('plan_changes должен быть объектом',{obj:obj}));

    var plan;
    var investors = {};
    var has_error;
    async.series({
        getPlan: function (cb) {
            _t.getById({id:id}, function (err, res) {
                if(err) return cb(new MyError('Не удалось получить план финансирования.',{id:id, err:err}));
                plan = res[0];
                if (plan.status_sysname!=='ACTIVE') return cb(new UserError('План финансирования уже в архиве. Перезагрузите форму'));
                cb(null);
            })
        },
        checkAndSave: function (cb) {
            async.eachSeries(plan_changes, function (one_fin, cb) {
                if (typeof one_fin!=='object') return cb(new MyError('Элементы плана для сохранения должны быть объектом',{plan_changes:plan_changes,one_fin:one_fin}));
                async.eachSeries(one_fin, function (one_inv_fin, cb) {
                    if (typeof one_inv_fin!=='object') return cb(new MyError('Элемент плана для сохранения должен быть объектом',{plan_changes:plan_changes,one_fin:one_fin,one_inv_fin:one_inv_fin}));
                    if (one_inv_fin.amount == one_inv_fin.new_amount && !one_inv_fin.mgm_fee) return cb(null); // Не менялось
                    var investment_plan_merchant_id;
                    var finId = one_inv_fin.fin_id;
                    var invId = one_inv_fin.inv_id;
                    if (!finId) return cb(null);
                    async.series({
                        getInvestor: function (cb) {
                            if (investors[invId]) {
                                one_inv_fin.investor = investors[invId];
                                return cb(null);
                            } // Инвестор уже загружен
                            var o = {
                                command:'getById',
                                object:'investor',
                                params:{
                                    id:invId
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось получить инвестора',{id:invId, err:err}));
                                if (!res.length) return cb(new MyError('Инвестор не найден.',{id:invId, res:res}));
                                investors[invId] = res[0];
                                one_inv_fin.investor = investors[invId];
                                cb(null);
                            });
                        },
                        getOrCreateInvPlanMerchId: function (cb) {
                            async.series({
                                get: function (cb) {
                                    var o = {
                                        command:'get',
                                        object:'investment_plan_merchant',
                                        params:{
                                            param_where:{
                                                merchant_financing_id:finId,
                                                investment_plan_id:id
                                            },
                                            collapseData:false
                                        }
                                    };
                                    _t.api(o, function (err, res) {
                                        if (err) return cb(new MyError('Не удалось получить investment_plan_merchant',{o:o, err:err}));
                                        if (res.length > 1) return cb(new MyError('investment_plan_merchant более одного по заданным параметрам',{o:o, res:res}));
                                        if (!res.length) return cb(null);
                                        one_inv_fin.investment_plan_merchant = res[0];
                                        return cb(null);
                                    });
                                },
                                addAndGet: function (cb) {
                                    if (one_inv_fin.investment_plan_merchant) return cb(null); // Уже имеется
                                    var o = {
                                        command:'add',
                                        object:'investment_plan_merchant',
                                        params:{
                                            investment_plan_id:id,
                                            merchant_financing_id:finId,
                                            rollback_key:rollback_key
                                        }
                                    };
                                    _t.api(o, function (err, res) {
                                        if (err) return cb(new MyError('Не удалось создать investment_plan_merchant',{o:o, err:err}));
                                        var o = {
                                            command:'getById',
                                            object:'investment_plan_merchant',
                                            params:{
                                                id:res.id
                                            }
                                        };
                                        _t.api(o, function (err, res) {
                                            if (err) return cb(new MyError('Не удалось получить investment_plan_merchant, который только что создали',{id:res.id,err:err}));
                                            if (!res.length) return cb(new MyError('Не найден investment_plan_merchant только что созданный.',{id:res.id, res:res}));
                                            one_inv_fin.investment_plan_merchant = res[0];
                                            return cb(null);
                                        });
                                    })
                                }
                            },cb);
                        },
                        getOrCreateInvestment: function (cb) {
                            if (one_inv_fin.error) return cb(null); // Это финансирование не прошло проверки
                            async.series({
                                get: function (cb) {
                                    var o = {
                                        command:'get',
                                        object:'investment_plan_merchant_investor',
                                        params:{
                                            param_where:{
                                                investment_plan_merchant_id:one_inv_fin.investment_plan_merchant.id,
                                                investor_id:one_inv_fin.investor.id
                                            },
                                            collapseData:false
                                        }
                                    };
                                    _t.api(o, function (err, res) {
                                        if (err) return cb(new MyError('Не удалось получить investment_plan_merchant_investor',{o:o, err:err}));
                                        if (res.length > 1) return cb(new MyError('investment_plan_merchant_investor более одного по заданным параметрам',{o:o, res:res}));
                                        if (!res.length) return cb(null);
                                        one_inv_fin.investment = res[0];
                                        return cb(null);
                                    });
                                },
                                addAndGet: function (cb) {
                                    if (one_inv_fin.investment) return cb(null); // Уже имеется
                                    var o = {
                                        command:'add',
                                        object:'investment_plan_merchant_investor',
                                        params:{
                                            investment_plan_merchant_id:one_inv_fin.investment_plan_merchant.id,
                                            investor_id:one_inv_fin.investor.id,
                                            investor_account_id:one_inv_fin.investor.default_investor_account_id,
                                            amount:0,

                                            rollback_key:rollback_key
                                        }
                                    };
                                    _t.api(o, function (err, res) {
                                        if (err) return cb(new MyError('Не удалось создать investment_plan_merchant_investor',{o:o, err:err}));
                                        var o = {
                                            command:'getById',
                                            object:'investment_plan_merchant_investor',
                                            params:{
                                                id:res.id
                                            }
                                        };
                                        _t.api(o, function (err, res) {
                                            if (err) return cb(new MyError('Не удалось получить investment_plan_merchant_investor, который только что создали',{id:res.id,err:err}));
                                            if (!res.length) return cb(new MyError('Не найден investment_plan_merchant_investor только что созданный.',{id:res.id, res:res}));
                                            one_inv_fin.investment = res[0];
                                            return cb(null);
                                        });
                                    })
                                }
                            },cb);
                        },
                        getInvestmentAndCheck: function (cb) {
                            if (one_inv_fin.error) return cb(null); // Это финансирование не прошло проверки
                            // проверки
                            if (one_inv_fin.investment_plan_merchant.commited) {
                                one_inv_fin.error = {
                                    msg:'План для данного финансирования уже подтвержден.',
                                    data:{}
                                };
                                return cb(null);
                            }
                            if (one_inv_fin.new_amount > one_inv_fin.investment_plan_merchant.founding_amount){
                                one_inv_fin.error = {
                                    msg:'Финансированию столько не нужно.',
                                    data:{}
                                };
                                return cb(null);
                            }
                            var amount_diff = +one_inv_fin.new_amount - one_inv_fin.investment.amount;
                            one_inv_fin.amount_diff = amount_diff;
                            if (amount_diff > 0 && one_inv_fin.investor.available_amount - amount_diff < 0) {
                                one_inv_fin.error = {
                                    msg:'У инвестора недостаточно свободных средств.',
                                    data:{}
                                };
                                return cb(null);
                            } else if (amount_diff < 0 && one_inv_fin.investor.locked_amount + amount_diff < 0) {
                                one_inv_fin.error = {
                                    msg:'Нельзя разблокировать средств инвестору, более чем у него заблокировано. Обратитесь к Администратору!',
                                    data:{}
                                };
                                return cb(null);
                            }

                            return cb(null);

                        },
                        saveChanges: function (cb) {
                            if (one_inv_fin.error) return cb(null); // Это финансирование не прошло проверки
                            // залочить/разлочить деньги у инвестора (провести операции)
                            // Обновить amount у investment_plan_merchant_investor
                            if (one_inv_fin.amount_diff == 0 && one_inv_fin.mgm_fee == one_inv_fin.investment.mgm_fee) return cb(null);
                            async.series({
                                lockUnlock: function (cb) {
                                    if (one_inv_fin.amount_diff == 0) return cb(null);
                                    var oper;
                                    var purpose;
                                    var subtype_sysname;
                                    var oper_amount = Math.abs(one_inv_fin.amount_diff);
                                    if (one_inv_fin.amount_diff > 0){
                                        oper = 'lockMoney';
                                        purpose = 'Блокировка средств под финансирование торговца.';
                                        subtype_sysname = 'BLOCK_FOR_MERCH_INVEST';
                                    }else{
                                        oper = 'unlockMoney';
                                        purpose = 'Разблокировка средств под финансирование торговца.';
                                        subtype_sysname = 'UNBLOCK_FOR_MERCH_INVEST';
                                    }
                                    var o = {
                                        command:oper,
                                        object:'investor_account',
                                        params:{
                                            id:one_inv_fin.investment.investor_account_id,
                                            amount:oper_amount,
                                            merchant_financing_id:one_inv_fin.investment_plan_merchant.merchant_financing_id,
                                            purpose:purpose,
                                            subtype_sysname:subtype_sysname,
                                            rollback_key:rollback_key,
                                            doNotSaveRollback:true
                                        }
                                    }
                                    _t.api(o, function (err, res) {
                                        if (err) return cb(new MyError('Не удалось провести операцию ' + oper,{o:o, err:err}));
                                        cb(null);
                                    });
                                },
                                updateInvestment: function (cb) {
                                    var o = {
                                        command:'modify',
                                        object:'investment_plan_merchant_investor',
                                        params:{
                                            id:one_inv_fin.investment.id,
                                            amount:one_inv_fin.new_amount,
                                            mgm_fee:one_inv_fin.mgm_fee,
                                            rollback_key:rollback_key
                                        }
                                    };
                                    _t.api(o, function (err, res) {
                                        if (err) return cb(new MyError('Не удалось обновить сумму у investment_plan_merchant_investor',{o:o, err:err}));
                                        cb(null);
                                    })
                                }
                            },cb);
                        }
                    }, cb);
                }, function (err) {
                    if (err) return cb(err);
                    if (has_error) return cb(null);
                    for (var i in one_fin) {
                        console.log('CHECK ERROR ===> ', one_fin[i]);
                        if (one_fin[i].error){
                            has_error = true;
                            break;
                        }
                    }
                    cb(null);
                });


            }, cb);
        },

    },function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'save', params:obj});
            cb(null, new UserOk('Ок'));
        }
    });
}

Model.prototype.commit = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();

    //return cb(new UserError('Нет полей для добавления.', {code: 201, type: 'warning'}));
    //return cb(new UserError('ok',{type:'info',msg:'Тестовая ош.',errors:{tst:1}}));

    // Получить план
    // Получить все финансирования
    // Выполнить для каждого commit
    // Если все успешно закомичены,
    // Закрываем План - меняем статус и ставим дату
    // Проверяем не появилось ли не закомиченых в этом плане
    // Если есть, то вынимаем их из плана.



    var plan, merchant_plans;
    var new_merchant_plans;
    var errors = [];
    async.series({
        get: function (cb) {
            _t.getById({id:id}, function (err, res) {
                if (err) return (err);
                plan = res[0];
                if (plan.status_sysname !=='ACTIVE') return cb(new UserError('Подтвердить можно только активное финансирование.'));
                cb(null);
            });
        },
        getInvPlanMerch: function (cb) {
            var o = {
                command:'get',
                object:'investment_plan_merchant',
                params:{
                    param_where:{
                        investment_plan_id:id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить investment_plan_merchant', {o: o, err: err}));
                merchant_plans = res;
                cb(null);
            });
        },
        commitAll: function (cb) {
            async.eachSeries(merchant_plans, function (one_merch, cb) {
                if (one_merch.commited) return cb(null);
                var o = {
                    command:'commit',
                    object:'investment_plan_merchant',
                    params:{
                        id:one_merch.id
                        //,rollback_key:rollback_key // Здесь ролбек не нужен, что закомитили, то и будет
                    }
                };
                _t.api(o, function (err, res) {
                    if (err) {
                        if (err instanceof UserError) err.is_user_error = true;
                        errors.push(err);
                        return cb(null);
                    }
                    one_merch.commited = true;
                    cb(null);
                })
            }, cb);

        },
        checkNotAll: function (cb) {
            if (errors.length) return cb(new UserError('ok',{type:'info',msg:'Не все записи удалось подтвердить.',errors:errors}));
            cb(null);
        },
        getNewRows: function (cb) {
            if (obj.confirm) return cb(null);
            var o = {
                command:'get',
                object:'investment_plan_merchant',
                params:{
                    param_where:{
                        investment_plan_id:id,
                        commited:false
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить не подтвержденные investment_plan_merchant',{o:o, err:err}));
                new_merchant_plans = res;
                cb(null);
            });
        },
        checkAndConfirm: function (cb) {
            if (new_merchant_plans.length && !obj.confirm){
                return cb(new UserError('needConfirm',{
                    title:'Завершить текущий план финансирования?',
                    msg: 'В плане финансирования появились новые запросы. Вы можете перенести новые запросы в новый план, а этот завершить.<br>Для этого нажмите "Завершить план"',
                    confirmType: 'dialog',
                    okBtnText: 'Завершить план',
                    cancelBtnText: 'Продолжить работать с этим',
                    cancelMsg: 'Обновите форму.'
                }));
            }
            cb(null);
        },
        closePlan: function (cb) {
            var params = {
                id:id,
                status_sysname:'COMMITED',
                commit_date:funcs.getDateTimeMySQL(),
                rollback_key:rollback_key
            };
            _t.modify(params, cb);
        },
        moveToNewPlan: function (cb) {
            // Перенесем все кто остался не у дел
            async.series({
                getNewRows: function (cb) {
                    var o = {
                        command:'get',
                        object:'investment_plan_merchant',
                        params:{
                            param_where:{
                                investment_plan_id:id,
                                commited:false
                            },
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить не подтвержденные investment_plan_merchant',{o:o, err:err}));
                        new_merchant_plans = res;
                        cb(null);
                    });
                },
                removeMerchPlans: function (cb) {
                    async.eachSeries(new_merchant_plans, function (one_merc_p, cb) {
                        var o = {
                            command:'removeCascade',
                            object:'investment_plan_merchant',
                            params:{
                                id:one_merc_p.id,
                                confirm:true,
                                rollback_key:rollback_key
                            }
                        };
                        _t.api(o, function (err, res) {
                            if (err) return cb(err);
                            var o = {
                                command:'modify',
                                object:'merchant_financing',
                                params:{
                                    id:one_merc_p.merchant_financing_id,
                                    investment_plan_id:null,
                                    rollback_key:rollback_key
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось получить merchant_financing', {o: o, err: err}));
                                cb(null);
                            });
                        })
                    }, cb);
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
            rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'commit', params:obj});
            cb(null, new UserOk('План финансирования успешно завершен.'));
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
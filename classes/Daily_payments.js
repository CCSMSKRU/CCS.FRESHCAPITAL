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


// var o = {
//     command:'create_new',
//     object:'daily_payments'
// };
// socketQuery(o, function(r){
//     console.log(r);
// });
/**
 * Создает запись со всеми датами вплоть до вчерашней.
 * Создает дочерние элемнты (daily_payment) и проставляет им все соответствующие данные
 * @param obj
 * @param cb
 * @returns {*}
 */

Model.prototype.create_new = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var rollback_key = obj.rollback_key || rollback.create();

    var yesterday = moment().add(-1, 'days');
    var today = moment();
    var last;
    var calendar;
    var financings = {};

    async.series({
        getLast:function(cb){
            var params = {
                collapseData:false,
                limit:1,
                sort:{
                    columns:['payments_for_date'],
                    directions:['desc']
                }
            };
            _t.get(params, function(err, res){
                if (err) return cb(new MyError('не удалось получить данные по ежедневному платежу.',{err:err, params:params}));
                last = res[0];
                if (last && (moment(last.payments_for_date,'DD.MM.YYYY').isSameOrAfter(today,'day'))) return cb(new UserOk('Уже созданы все необходимые записи.'));
                cb(null);
            })
        },
        ifNoLastGetFirstPayment:function(cb){
            if (last) return cb(null);
            var o = {
                command:'get',
                object:'merchant_financing_payment',
                params:{
                    collapseData:false,
                    limit:1,
                    sort:'payment_date'
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить первый платеж в системе',{o : o, err : err}));
                last = res[0];
                cb(null);
            });

        },
        generateCalendar:function(cb){
            // var lastPlus = (last)? moment((last.payments_for_date || last.payment_date || last.default_date || last.paid_date || last.closing_date),'DD.MM.YYYY').add(1,'days') : yesterday;
            var lastPlus = (last)? moment((last.payments_for_date || last.payment_date || last.default_date || last.paid_date || last.closing_date),'DD.MM.YYYY').add(1,'days') : today;
            // var payments_count = yesterday.diff(lastPlus, 'days') - 1; //
            // var payments_count = yesterday.diff(lastPlus, 'days') + 1; //
            var payments_count = today.diff(lastPlus, 'days') + 1; //
            if (payments_count<=0) return cb(new UserOk('Все записи уже созданы'));
            generateCalendar({
                date_start: lastPlus.format('DD.MM.YYYY'),
                // to_date: yesterday.format('DD.MM.YYYY'),
                to_date: today.format('DD.MM.YYYY'),
                payments_count: payments_count,
                type: 'gov'
            }, function (err, res) {
                calendar = res;
                if (!calendar.length) return cb(new UserOk('Пока создавить платежи не нужно'));
                cb(null);
            });
        },
        createRows:function(cb){
            console.log('calendar',calendar);
            // Создать голову и создать его платежи
            // При создании платежа, собирается информация о реально существующих платежах
            async.eachSeries(calendar, function(one_date, cb){
                var id;
                var payments = [];
                var financing_ids = [];
                async.series({
                    getChildsDate:function(cb){
                        // Запросить все фиксированные платежи на эту дату
                        // Запросим все процентные платежи на эту дату
                        // Запросим все ПРОЦЕНТНЫЕ финансирования, у которых уже начались платежи, платеж еще не создан и финансирование активно
                        // - создадим платеж

                        async.series({
                            getFixPayments:function(cb){
                                var o = {
                                    command:'get',
                                    object:'merchant_financing_payment',
                                    params:{
                                        param_where:{
                                            payment_date:one_date,
                                            financing_type_sysname:'FIXED'
                                        },
                                        collapseData:false
                                    }
                                };
                                _t.api(o, function(err, res){
                                    if (err) return cb(new MyError('Не удалось получить платежи ФИКСИРОВАННЫХ финансирования на дату',{err:err, o:o}));
                                    for (var i in res) {
                                        payments.push(res[i]);
                                    }
                                    cb(null);
                                })
                            },
                            getPercentPayments:function(cb){
                                var o = {
                                    command:'get',
                                    object:'merchant_financing_payment',
                                    params:{
                                        param_where:{
                                            payment_date:one_date,
                                            financing_type_sysname:'PERCENT'
                                        },
                                        collapseData:false
                                    }
                                };
                                _t.api(o, function(err, res){
                                    if (err) return cb(new MyError('Не удалось получить платежи ПРОЦЕНТНОГО финансирования на дату',{err:err, o:o}));
                                    for (var i in res) {
                                        payments.push(res[i]);
                                    }
                                    cb(null);
                                })
                            },
                            // Переделаем - НЕ ТОЛЬКО ПРОЦЕНТНЫЕ, но и ФИКСИРОВАННЫЕ у которых закончился календарь, но они еще не зкрыты
                            getAnotherPercentFinancingAndCreatepayments:function(cb){
                                for (var i in payments) {
                                    if (financing_ids.indexOf(payments[i].merchant_financing_id) == -1) financing_ids.push(payments[i].merchant_financing_id);
                                }
                                var o = {
                                    command:'get',
                                    object:'merchant_financing',
                                    params:{
                                        where:[
                                            // {
                                            //     key:'financing_type_sysname',
                                            //     val1:'PERCENT'
                                            // },
                                            {
                                                key:'status_sysname',
                                                val1:'ACQUIRING_IN_PROCCESS'
                                            },
                                            {
                                                key:'id',
                                                type:'!in',
                                                val1:financing_ids
                                            }
                                        ],
                                        collapseData:false
                                    }
                                };
                                _t.api(o, function(err, res){
                                    if (err) return cb (new MyError('Не удалось получить необходимые финансирования.',{err:err, o:o}));
                                    async.eachSeries(res, function(fin, cb){
                                        // if (funcs.date_A_more_or_equal_B(fin.payments_start_date, one_date)) {
                                        if (funcs.date_A_more_B(fin.payments_start_date, one_date)) {
                                            return cb(null);
                                        }
                                        if (financing_ids.indexOf(fin.id) == -1) financing_ids.push(fin.id);
                                        // Создадим платеж и запросим его

                                        var tmp_id;
                                        async.series({
                                            add:function(cb){
                                                var pendingAmount = (+fin.to_return >= +fin.payment_amount)? +fin.payment_amount : +fin.to_return;
                                                var o = {
                                                    command:'add',
                                                    object:'merchant_financing_payment',
                                                    params:{
                                                        payment_date:one_date,
                                                        pending_amount: pendingAmount,
                                                        merchant_id:fin.merchant_id,
                                                        calendar_id:fin.current_calendar_id,
                                                        status_sysname:'PENDING',
                                                        rollback_key:rollback_key
                                                    }
                                                };
                                                _t.api(o, function (err, res) {
                                                    if (err) return cb(new MyError('Не удалось создать платеж для ПРОЦЕНТНОГО/ФИКСИРОВАННОГО финансирования',{o : o, err : err}));
                                                    tmp_id = res.id;
                                                    cb(null);
                                                });
                                            },
                                            get:function(cb){
                                                var o = {
                                                    command:'getById',
                                                    object:'merchant_financing_payment',
                                                    params:{
                                                        id:tmp_id
                                                    }
                                                };
                                                _t.api(o, function (err, res) {
                                                    if (err) return cb(new MyError('Не удалось получить платеж после его создания',{o : o, err : err}));
                                                    payments.push(res[0]);
                                                    cb(null);
                                                });
                                            }
                                        }, cb);
                                    }, cb);
                                })
                            }
                        },cb);




                        // var o = {
                        //     command:'add',
                        //     object:'daily_payment',
                        //     params:{
                        //         daily_payments_id:id,
                        //
                        //     }
                        // }
                    },
                    getFinancings:function(cb){
                        var o = {
                            command:'get',
                            object:'merchant_financing',
                            params:{
                                where:[
                                    {
                                        key:'id',
                                        type:'in',
                                        val1:financing_ids
                                    }
                                ],
                                collapseData:false
                            }
                        };
                        _t.api(o, function (err, res) {
                            if (err) return cb(new MyError('Не удалось получить финансирования',{o : o, err : err}));
                            for (var i in res) {
                                financings[res[i].id] = res[i];
                            }
                            cb(null);
                        });
                    },
                    addHeadRow:function(cb){
                        var params = {
                            payments_for_date:one_date,
                            rollback_key:rollback_key
                        };
                        _t.add(params, function(err, res){
                            if (err) return cb(new MyError('не удалось создать daily_payments', {err:err, params:params}));
                            id = res.id;
                            cb(null);
                        })
                    },
                    addChilds:function(cb){
                        async.eachSeries(payments, function(payment, cb){
                            var financing = financings[payment.merchant_financing_id];
                            payment.pending_amount = payment.pending_amount || financing.payment_amount || 0;
                            // Разобьем сумму на тело и процент
                            var pending_body_amount = 0;
                            var pending_percent_amount = 0;
                            if (['DEFAULT','PARTIAL_PAID'].indexOf(payment.status_sysname)!== - 1){
                                var default_amount = +payment.pending_amount - +payment.paid_amount || 0;
                                pending_body_amount = Math.round((+default_amount * 100 / (100 + financing.factoring_rate)) * 100) /100;
                                pending_percent_amount = default_amount - pending_body_amount;
                            }
                            // var o = {
                            //     command:'add',
                            //     object:'daily_payment',
                            //     params:{
                            //         daily_payments_id:id,
                            //         merchant_financing_payment_id:payment.id,
                            //         pending_amount:payment.pending_amount || 0,
                            //         paid_amount:payment.paid_amount || 0,
                            //         pending_body_amount:pending_body_amount,
                            //         pending_percent_amount:pending_percent_amount,
                            //         closing_type_sysname:payment.closing_type_sysname,
                            //         default_date:payment.default_date,
                            //         closing_date:payment.closing_date || payment.paid_date,
                            //         status_sysname:payment.status_sysname,
                            //         rollback_key:rollback_key
                            //     }
                            // };
                            var paidAmountLater = +payment.paid_amount_later || (payment.closing_type_sysname !== 'BY_PROCESSING' && payment.closing_type_sysname)? +payment.paid_amount : 0;

                            if (paidAmountLater){
                                console.log('paidAmountLater', payment);
                            }


                            async.series({
                                addDPayment:function(cb){
                                    var o = {
                                        command:'add',
                                        object:'daily_payment',
                                        params:{
                                            daily_payments_id:id,
                                            merchant_financing_payment_id:payment.id,
                                            pending_amount:payment.pending_amount || 0,
                                            paid_amount:payment.paid_amount_processing || (payment.closing_type_sysname === 'BY_PROCESSING')? payment.paid_amount : 0,
                                            paid_amount_later: paidAmountLater,
                                            pending_body_amount:pending_body_amount,
                                            pending_percent_amount:pending_percent_amount,
                                            closing_type_sysname:payment.closing_type_sysname,
                                            default_date:payment.default_date,
                                            closing_date:payment.closing_date || payment.paid_date,
                                            status_sysname:payment.status_sysname,
                                            rollback_key:rollback_key
                                        }
                                    };
                                    if (payment.status_sysname !== 'PENDING') o.params.is_applied = true;
                                    _t.api(o, function (err, res) {
                                        if (err) {
                                            return cb(new MyError('Не удалось создать единицу "платеж"',{o : o, err : err}));
                                        }
                                        payment.daily_payment_id = res.id;
                                        cb(null);
                                    });
                                },
                                addPaidLater:function(cb){
                                    if (paidAmountLater){
                                        console.log('paidAmountLater', payment);
                                    }
                                    if (!paidAmountLater || !payment.closing_date || payment.closing_type_sysname !== 'REMITTANCE') return cb(null);

                                    var o = {
                                        command:'add',
                                        object:'daily_payment_paid_later',
                                        params:{
                                            daily_payment_id:null,
                                            target_daily_payment_id:payment.daily_payment_id,
                                            amount:+paidAmountLater,
                                            operation_date_to_find:payment.closing_date,
                                            financing_id_to_find:payment.merchant_financing_id,
                                            rollback_key:rollback_key
                                        }
                                    };
                                    _t.api(o, function (err, res) {
                                        if (err) return cb(new MyError('Не удалось добавить daily_payment_paid_later',{o : o, err : err}));
                                        cb(null);
                                    });

                                }

                            },cb);


                        }, cb);
                    }

                },cb);
            },cb);
        },
        updatePaidLater:function(cb){
            var paid_later;
            async.series({
                getPaidLaterNeedUpdate:function(cb){
                    var o = {
                        command:'get',
                        object:'daily_payment_paid_later',
                        params:{
                            where:[
                                {
                                    key:'operation_date_to_find',
                                    type:'isNotNull'
                                }
                            ],
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить daily_payment_paid_later для обновления',{o : o, err : err}));
                        paid_later = res;
                        cb(null);
                    });
                },
                update:function(cb){
                    if (!paid_later) return cb(null);
                    async.eachSeries(paid_later, function(item, cb){
                        // Найдем daily_payment по дате и financing_id
                        // Обновим данные для paid_later

                        var daily_payment_id;
                        var o = {
                            command:'get',
                            object:'daily_payment',
                            params:{
                                param_where:{
                                    daily_payments_date:item.operation_date_to_find,
                                    merchant_financing_id:item.financing_id_to_find
                                },
                                collapseData:false
                            }
                        };
                        _t.api(o, function (err, res) {
                            if (err) return cb(new MyError('Не удалось найди daily_payment по дате и финансированияю',{o : o, err : err}));
                            if (res.length>1) {
                                return cb(new MyError('Найдено слишком много daily_payment по дате и финансированияю',{o:o, res:res}));
                            }
                            if (!res.length) return cb(null);
                            daily_payment_id = res[0].id;
                            item.daily_payment_id = res[0].id; // обновим локальный объект, чтобы потом не дозапрашивать
                            var o = {
                                command:'modify',
                                object:'daily_payment_paid_later',
                                params:{
                                    id:item.id,
                                    daily_payment_id:res[0].id,
                                    operation_date_to_find:null,
                                    financing_id_to_find:null,
                                    rollback_key:rollback_key
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось обновить daily_payment_paid_later найденым по дяте и финансированию',{o : o, err : err}));
                                cb(null);
                            });
                        });

                    },cb);
                },
                updateSourcePaymentRemittance:function(cb){
                    if (!paid_later) return cb(null);
                    // Сгрупперуем по daily_payment_id - total_amount
                    var d_obj = {};
                    for (var i in paid_later) {
                        var dailyPaymentId = paid_later[i].daily_payment_id;
                        if (!d_obj[dailyPaymentId]) d_obj[dailyPaymentId] = 0;
                        d_obj[dailyPaymentId] += +paid_later[i].amount;
                    }
                    async.eachSeries(Object.keys(d_obj), function(key, cb){
                        var o = {
                            command:'modify',
                            object:'daily_payment',
                            params:{
                                id:key,
                                default_paid_amount:d_obj[key],
                                rollback_key:rollback_key
                            }
                        };
                        _t.api(o, function (err, res) {
                            if (err) return cb(new MyError('Не удалось проставить default_paid_amount (remittance)',{o : o, err : err}));
                            cb(null);
                        });

                    }, cb)

                }
            },cb);
        },
        setStatisticForAll:function(cb){
            _t.setStatisticToAll({
                rollback_key:rollback_key
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
               rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'create_new', params:obj});
            }
            cb(null, new UserOk('Ок'));
        }
    });
};


// var o = {
//     command:'apply',
//     object:'daily_payments',
//     params:{
//         id:775
//     }
// };
// socketQuery(o, function(r){
//     console.log(r);
// });
Model.prototype.apply = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    // Проверить что не осталось PENDING, если есть то с подтверждением
    // Проставить все дефолты
    // Проставить все успешные
    // Выставить все счета

    // Проставить все по счету (с закрытием дефолтных платежей и )
    // Закрыть и аннулировать счета -- это и так сделано

    // Для всех не Pending простаить is_applied

    var daily_payments;
    var to_apply_ids = [];
    var daily_payment_default;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить Daily_paymnets.',{id:id,err:err}));
                daily_payments = res[0];
                cb(null);
            });
        },
        checkToday:function(cb){
            if (daily_payments.payments_for_date === moment().format('DD.MM.YYYY')) return cb(new UserError('Нельзя применить платежи за текущий день. Вы сможете применить все платежи завтра.'));
            cb(null);
        },
        checkPending:function(cb){
            if (obj.confirm === 'ПОДТВЕРЖДАЮ' || obj.confirm === '1') return cb(null);
            var o = {
                command:'getCount',
                object:'daily_payment',
                params:{
                    param_where:{
                        daily_payments_id:id,
                        status_sysname:'PENDING'
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось посчитать количество платежей в статусе pending',{o : o, err : err}));
                if (res.count) return cb(new UserError('needConfirm', {message: '',title:'Есть неотмеченные платежи! Про них легко забыть! Если хотите применить те что отмечены, введите "ПОДТВЕРЖДАЮ".',key:1, confirmType:'dialog',responseType:'text'}));
                cb(null);
            });
        },
        apllyAllpayment:function(cb){
            // Проставить все дефолты
            // - Получить все дефолтные,
            // -- для каждого вызвать метод makeDefault
            var o = {
                command:'get',
                object:'daily_payment',
                params:{
                    columns:['id','status_sysname'],
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
                            key:'daily_payments_id',
                            val1:id
                        },
                        {
                            key:'status_sysname',
                            type:'!in',
                            val1:['PENDING']
                        }
                    ],
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить платежи',{o : o, err : err}));
                if (!res.length) return cb(null);
                async.eachSeries(res, function(d_pmnt, cb){
                    var o = {
                        command:'apply',
                        object:'daily_payment',
                        params:{
                            id:d_pmnt.id,
                            payment_date:daily_payments.payments_for_date,
                            doNotSetStatistic:true,
                            doNotSaveRollback:true,
                            rollback_key:rollback_key
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось применить платеж.',{o : o, err : err}));
                        cb(null);
                    });
                }, cb);

            });

        },
        billout:function(cb){
            // Выставить все счета
            // -- получим счета для выставления
            var invoces;
            var o = {
                command:'get',
                object:'invoice',
                params:{
                    param_where:{
                        daily_payments_id:id,
                        status_sysname:'CREATED'
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить счета CREATED',{o : o, err : err}));
                async.eachSeries(res, function(invoice, cb){
                    var o = {
                        command:'modify',
                        object:'invoice',
                        params:{
                            id:invoice.id,
                            status_sysname:'EXPOSED',
                            rollback_key:rollback_key
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось перевести счет в EXPOSED',{o : o, err : err}));
                        cb(null);
                    });
                },cb);
            });

        }
    },function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!obj.doNotSaveRollback){
               rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'apply', params:obj});
            }
            cb(null, new UserOk('Ок'));
        }
    });
};


// var o = {
//     command:'setStatistic',
//     object:'daily_payments',
//     params:{
//         id:352
//     }
// };
// socketQuery(o, function(res){
//     console.log(res);
// });
Model.prototype.setStatistic = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();

    var amounts;
    async.series({
        getSums:function(cb){
            var o = {
                command:'get',
                object:'daily_payment',
                params:{
                    specColumns:{
                        paid_amount:'SUM(paid_amount)',
                        default_paid_amount:'SUM(default_paid_amount)'
                    },
                    param_where:{
                        daily_payments_id:id
                    },
                    columns:['daily_payments_id'],
                    sort:{
                        columns:['daily_payments_id'],
                        directions:['asc']
                    },
                    groupBy:['daily_payments_id'],
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить суммы ежедневных платежей',{o : o, err : err}));
                amounts = res[0];
                cb(null);
            });
        },
        set:function(cb){
            if (!amounts) return cb(new MyError('Не удалось ничего посчитать'));
            var params = {
                id:id,
                total_paid_amount:amounts.paid_amount,
                total_default_paid_amount:amounts.default_paid_amount,
                rollback_key:rollback_key
            };
            _t.modify(params, cb);
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


// var o = {
//     command:'setStatisticToAll',
//     object:'daily_payments',
//     params:{
//     }
// };
// socketQuery(o, function(res){
//     console.log(res);
// });
Model.prototype.setStatisticToAll = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var rollback_key = obj.rollback_key || rollback.create();

    var amounts;
    var days;
    async.series({
        getAll:function(cb){
            var params = {
                collapseData:false,
                limit:10000000
            };
            _t.get(params, function(err, res){
                if (err) return cb(err);
                days = res;
                cb(null);
            })
        },
        set:function(cb){
            if (!days) return cb(null);
            async.eachSeries(days, function(day, cb){
                var params = {
                    id:day.id
                };
                _t.setStatistic(params, cb);
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
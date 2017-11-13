/**
 * Created by iig on 29.10.2015.
 */
let MyError = require('../error').MyError;
let UserError = require('../error').UserError;
let UserOk = require('../error').UserOk;
let BasicClass = require('./system/BasicClass');
let util = require('util');
let async = require('async');
let rollback = require('../modules/rollback');
let funcs = require('../libs/functions');
let moment = require('moment');
let generateCalendar = require('../modules/generate_calendar');
let fs = require('fs');
let parsePath = require('parse-filepath');
let xlsx = require('node-xlsx').default;
let unzipper = require('unzipper');

let Model = function(obj){
    this.name = obj.name;
    this.tableName = obj.name.toLowerCase();

    let basicclass = BasicClass.call(this, obj);
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
    let _t = this;
    Model.super_.prototype.init.apply(this, [obj , function (err) {
        cb(null);
    }]);
};

Model.prototype.get = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    let _t = this;
    let client_object = _t.client_object || '';

    let coFunction = 'get_' + client_object;
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
    let _t = this;
    let client_object = _t.client_object || '';

    let coFunction = 'add_' + client_object;
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
    let _t = this;
    let client_object = _t.client_object || '';

    let coFunction = 'modify_' + client_object;

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
    let _t = this;
    let client_object = _t.client_object || '';

    let coFunction = 'removeCascade_' + client_object;

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


// let o = {
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
    let _t = this;
    let rollback_key = obj.rollback_key || rollback.create();

    let yesterday = moment().add(-1, 'days');
    let today = moment();
    let last;
    let calendar;
    let financings = {};

    async.series({
        getLast:function(cb){
            let params = {
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
            let o = {
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
            // let lastPlus = (last)? moment((last.payments_for_date || last.payment_date || last.default_date || last.paid_date || last.closing_date),'DD.MM.YYYY').add(1,'days') : yesterday;
            let lastPlus = (last)? moment((last.payments_for_date || last.payment_date || last.default_date || last.paid_date || last.closing_date),'DD.MM.YYYY').add(1,'days') : today;
            // let payments_count = yesterday.diff(lastPlus, 'days') - 1; //
            // let payments_count = yesterday.diff(lastPlus, 'days') + 1; //
            let payments_count = today.diff(lastPlus, 'days') + 1; //
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
                let id;
                let payments = [];
                let financing_ids = [];
                async.series({
                    getChildsDate:function(cb){
                        // Запросить все фиксированные платежи на эту дату
                        // Запросим все процентные платежи на эту дату
                        // Запросим все ПРОЦЕНТНЫЕ финансирования, у которых уже начались платежи, платеж еще не создан и финансирование активно
                        // - создадим платеж

                        async.series({
                            getFixPayments:function(cb){
                                let o = {
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
                                    for (let i in res) {
                                        payments.push(res[i]);
                                    }
                                    cb(null);
                                })
                            },
                            getPercentPayments:function(cb){
                                let o = {
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
                                    for (let i in res) {
                                        payments.push(res[i]);
                                    }
                                    cb(null);
                                })
                            },
                            // Переделаем - НЕ ТОЛЬКО ПРОЦЕНТНЫЕ, но и ФИКСИРОВАННЫЕ у которых закончился календарь, но они еще не зкрыты
                            getAnotherPercentFinancingAndCreatepayments:function(cb){
                                for (let i in payments) {
                                    if (financing_ids.indexOf(payments[i].merchant_financing_id) == -1) financing_ids.push(payments[i].merchant_financing_id);
                                }

                                let o = {
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
                                            }

                                        ],
                                        collapseData:false
                                    }
                                };
                                if (financing_ids.length){
                                    o.params.where.push({
                                        key:'id',
                                        type:'!in',
                                        val1:financing_ids
                                    });
                                }
                                _t.api(o, function(err, res){
                                    if (err) return cb (new MyError('Не удалось получить необходимые финансирования.',{err:err, o:o}));
                                    async.eachSeries(res, function(fin, cb){
                                        // if (funcs.date_A_more_or_equal_B(fin.payments_start_date, one_date)) {
                                        if (funcs.date_A_more_B(fin.payments_start_date, one_date)) {
                                            return cb(null);
                                        }
                                        if (financing_ids.indexOf(fin.id) == -1) financing_ids.push(fin.id);
                                        // Создадим платеж и запросим его

                                        let tmp_id;
                                        async.series({
                                            add:function(cb){
                                                let pendingAmount = (+fin.to_return >= +fin.payment_amount)? +fin.payment_amount : +fin.to_return;
                                                let o = {
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
                                                let o = {
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




                        // let o = {
                        //     command:'add',
                        //     object:'daily_payment',
                        //     params:{
                        //         daily_payments_id:id,
                        //
                        //     }
                        // }
                    },
                    getFinancings:function(cb){
                        let o = {
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
                            for (let i in res) {
                                financings[res[i].id] = res[i];
                            }
                            cb(null);
                        });
                    },
                    addHeadRow:function(cb){
                        let params = {
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
                            let financing = financings[payment.merchant_financing_id];
                            payment.pending_amount = payment.pending_amount || financing.payment_amount || 0;
                            // Разобьем сумму на тело и процент
                            let pending_body_amount = 0;
                            let pending_percent_amount = 0;
                            if (['DEFAULT','PARTIAL_PAID'].indexOf(payment.status_sysname)!== - 1){
                                let default_amount = +payment.pending_amount - +payment.paid_amount || 0;
                                pending_body_amount = Math.round((+default_amount * 100 / (100 + financing.factoring_rate)) * 100) /100;
                                pending_percent_amount = default_amount - pending_body_amount;
                            }
                            // let o = {
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
                            let paidAmountLater = +payment.paid_amount_later || (payment.closing_type_sysname !== 'BY_PROCESSING' && payment.closing_type_sysname)? +payment.paid_amount : 0;

                            if (paidAmountLater){
                                console.log('paidAmountLater', payment);
                            }


                            async.series({
                                addDPayment:function(cb){
                                    let o = {
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

                                    let o = {
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
            let paid_later;
            async.series({
                getPaidLaterNeedUpdate:function(cb){
                    let o = {
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

                        let daily_payment_id;
                        let o = {
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
                            let o = {
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
                    let d_obj = {};
                    for (let i in paid_later) {
                        let dailyPaymentId = paid_later[i].daily_payment_id;
                        if (!d_obj[dailyPaymentId]) d_obj[dailyPaymentId] = 0;
                        d_obj[dailyPaymentId] += +paid_later[i].amount;
                    }
                    async.eachSeries(Object.keys(d_obj), function(key, cb){
                        let o = {
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

// let o = {
//     command:'append_new',
//     object:'daily_payments',
//     params:{
//         id:446
//     }
// };
// socketQuery(o, function(r){
//     console.log(r);
// });
Model.prototype.append_new = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    let _t = this;
    let id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    let rollback_key = obj.rollback_key || rollback.create();


    let yesterday = moment().add(-1, 'days');
    let today = moment();
    let last;
    let calendar;
    let financings = {};
    let daily_payments;
    let payments = [];
    let financing_ids = [];
    let payments_obj_by_fin = {};
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить daily_payments.',{id:id,err:err}));
                daily_payments= res[0];
                cb(null);
            });
        },
        createRows:function(cb){
            // Создать его платежи
            // При создании платежа, собирается информация о реально существующих платежах

            async.series({
                getChildsDate:function(cb){
                    // Запросить все фиксированные платежи на эту дату
                    // Запросим все процентные платежи на эту дату
                    // Запросим все ПРОЦЕНТНЫЕ финансирования, у которых уже начались платежи, платеж еще не создан и финансирование активно
                    // - создадим платеж

                    async.series({
                        gatExistPayments:function(cb){
                            let o = {
                                command:'get',
                                object:'daily_payment',
                                params:{
                                    param_where:{
                                        daily_payments_id:id
                                    },
                                    collapseData:false
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось платежи этого платежного дня',{o : o, err : err}));
                                for (let i in res) {
                                    payments_obj_by_fin[res[i].merchant_financing_id] = res[i];
                                }
                                cb(null);
                            });

                        },
                        getFixPayments:function(cb){
                            let o = {
                                command:'get',
                                object:'merchant_financing_payment',
                                params:{
                                    param_where:{
                                        payment_date:daily_payments.payments_for_date,
                                        financing_type_sysname:'FIXED'
                                    },
                                    collapseData:false
                                }
                            };
                            _t.api(o, function(err, res){
                                if (err) return cb(new MyError('Не удалось получить платежи ФИКСИРОВАННЫХ финансирования на дату',{err:err, o:o}));
                                for (let i in res) {
                                    payments.push(res[i]);
                                }
                                cb(null);
                            })
                        },
                        getPercentPayments:function(cb){
                            let o = {
                                command:'get',
                                object:'merchant_financing_payment',
                                params:{
                                    param_where:{
                                        payment_date:daily_payments.payments_for_date,
                                        financing_type_sysname:'PERCENT'
                                    },
                                    collapseData:false
                                }
                            };
                            _t.api(o, function(err, res){
                                if (err) return cb(new MyError('Не удалось получить платежи ПРОЦЕНТНОГО финансирования на дату',{err:err, o:o}));
                                for (let i in res) {
                                    payments.push(res[i]);
                                }
                                cb(null);
                            })
                        },
                        // Переделаем - НЕ ТОЛЬКО ПРОЦЕНТНЫЕ, но и ФИКСИРОВАННЫЕ у которых закончился календарь, но они еще не зкрыты
                        getAnotherPercentFinancingAndCreatepayments:function(cb){
                            for (let i in payments) {
                                if (financing_ids.indexOf(payments[i].merchant_financing_id) == -1) financing_ids.push(payments[i].merchant_financing_id);
                            }
                            let o = {
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
                                        }
                                    ],
                                    collapseData:false
                                }

                            };
                            if (financing_ids.length){
                                o.params.where.push({
                                    key:'id',
                                    type:'!in',
                                    val1:financing_ids
                                });
                            }
                            _t.api(o, function(err, res){
                                if (err) return cb (new MyError('Не удалось получить необходимые финансирования.',{err:err, o:o}));
                                async.eachSeries(res, function(fin, cb){
                                    if (funcs.date_A_more_B(fin.payments_start_date, daily_payments.payments_for_date)) {
                                        return cb(null);
                                    }
                                    if (financing_ids.indexOf(fin.id) == -1) financing_ids.push(fin.id);
                                    // Создадим платеж и запросим его

                                    let tmp_id;
                                    async.series({
                                        add:function(cb){
                                            let pendingAmount = (+fin.to_return >= +fin.payment_amount)? +fin.payment_amount : +fin.to_return;
                                            let o = {
                                                command:'add',
                                                object:'merchant_financing_payment',
                                                params:{
                                                    payment_date:daily_payments.payments_for_date,
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
                                            let o = {
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




                    // let o = {
                    //     command:'add',
                    //     object:'daily_payment',
                    //     params:{
                    //         daily_payments_id:id,
                    //
                    //     }
                    // }
                },
                getFinancings:function(cb){
                    let o = {
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
                        for (let i in res) {
                            financings[res[i].id] = res[i];
                        }
                        cb(null);
                    });
                },
                addChilds:function(cb){
                    async.eachSeries(payments, function(payment, cb){
                        if (payments_obj_by_fin[payment.merchant_financing_id]) return cb(null); // Запись уже создана
                        let financing = financings[payment.merchant_financing_id];

                        payment.pending_amount = payment.pending_amount || financing.payment_amount || 0;
                        // Разобьем сумму на тело и процент
                        let pending_body_amount = 0;
                        let pending_percent_amount = 0;
                        if (['DEFAULT','PARTIAL_PAID'].indexOf(payment.status_sysname)!== - 1){
                            let default_amount = +payment.pending_amount - +payment.paid_amount || 0;
                            pending_body_amount = Math.round((+default_amount * 100 / (100 + financing.factoring_rate)) * 100) /100;
                            pending_percent_amount = default_amount - pending_body_amount;
                        }
                        // let o = {
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
                        let paidAmountLater = +payment.paid_amount_later || (payment.closing_type_sysname !== 'BY_PROCESSING' && payment.closing_type_sysname)? +payment.paid_amount : 0;

                        if (paidAmountLater){
                            console.log('paidAmountLater', payment);
                        }


                        async.series({
                            addDPayment:function(cb){
                                let o = {
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

                                let o = {
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
                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'append_new', params:obj});
            }
            cb(null, new UserOk('Ок'));
        }
    });
};

// let o = {
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
    let _t = this;
    let id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    let rollback_key = obj.rollback_key || rollback.create();
    // Проверить что не осталось PENDING, если есть то с подтверждением
    // Проставить все дефолты
    // Проставить все успешные
    // Выставить все счета

    // Проставить все по счету (с закрытием дефолтных платежей и )
    // Закрыть и аннулировать счета -- это и так сделано

    // Для всех не Pending простаить is_applied

    let daily_payments;
    let to_apply_ids = [];
    let daily_payment_default;
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
            let o = {
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
            let o = {
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
                    let o = {
                        command:'apply',
                        object:'daily_payment',
                        params:{
                            id:d_pmnt.id,
                            payment_date:daily_payments.payments_for_date,
                            doNotSetStatistic:true,
                            // doNotSaveRollback:true,
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
            let invoces;
            let o = {
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
                    let o = {
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


// let o = {
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
    let _t = this;
    let id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    let rollback_key = obj.rollback_key || rollback.create();

    let amounts;
    async.series({
        getSums:function(cb){
            let o = {
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
            let params = {
                id:id,
                total_paid_amount:amounts.paid_amount,
                total_default_paid_amount:amounts.default_paid_amount,
                rollback_key:rollback_key
            };
            _t.modify(params, cb);
        }
    },function (err, res) {
        if (err) {
            if (err.message == 'notModified') return cb(null);
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


// let o = {
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
    let _t = this;
    let rollback_key = obj.rollback_key || rollback.create();

    let amounts;
    let days;
    async.series({
        getAll:function(cb){
            let params = {
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
                let params = {
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

Model.prototype.import_vtb = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    let _t = this;
    let id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    let rollback_key = obj.rollback_key || rollback.create();

    if (typeof obj.dates !== 'string') return cb(new UserError('Не корректно указана дата.'));
    let uploaded_files = obj.file_list || [];
    // Получить день
    // Создать папку
    // скопировать туда файлы с заменой/ удалить из uploads
    // Считать файлы (список) / Если зип, то UNZIP
    // для каждого:
    // - распарсить и получить данные
    // - Найти соответствующие финансирования
    // - найти соответствующие пейменты
    // - записать в соответствующее поле
    // - применить если возможно

    let file_list = [];
    let dir_prefix = './serverUploads/vtb24/';
    // let date_dir = obj.date_dir.replace(/\./ig,'');
    let date_dir;
    let inc_dates = String(obj.dates).split(',');
    let financings = [];
    let financings_obj = {};
    let errors = [];

    let daily_payments;

    let clear_dir = function(dir, cb){
        fs.readdir(dir, function(err, files){
            if (err) return cb(new UserError('Не удалось считать файлы из директории.',{err:err,date_dir:dir}));
            async.eachSeries(files, function(file, cb){
                fs.unlink(dir + '/' + file, function(err){
                    if (err) console.log(err);
                    cb(null);
                })
            }, cb);

        });
    };

    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить платежный день.',{id:id,err:err}));
                daily_payments = res[0];
                date_dir = daily_payments.payments_for_date.replace(/\./ig,'');
                cb(null);
            });
        },
        createDir:function(cb){
            fs.mkdir(dir_prefix + date_dir, function(err){
                if (err) {
                    if (err.code === 'EEXIST') return cb(null); // Директория уже создана
                    return cb(new MyError('Не удалось создать директорию',{err:err}));
                }
                cb(null);
            })
        },
        moveFiles:function(cb){
            async.eachSeries(uploaded_files, function(filename, cb){
                fs.rename('./public/upload/'+filename, dir_prefix + date_dir + '/' + filename, function(err){
                    if (err){
                        errors.push(['ОШИБКА! При попытке скопировать файл', filename, err]);
                        // Просто игнорируем
                        return cb(null);
                    }
                    cb(null);
                })
            }, cb);
        },
        unzip:function(cb){

            fs.readdir(dir_prefix + date_dir, function(err, files){
                if (err) return cb(new UserError('Не удалось считать файлы из директории.',{err:err,date_dir:date_dir}));
                async.eachSeries(files, function(file, cb){
                    if (parsePath(file).extname !== '.zip') return cb(null);
                    let dir_prefix_cut = dir_prefix.substring(2);
                    let proj_dir = process.cwd();

                    fs.createReadStream(dir_prefix + date_dir + '/' + file)
                        .pipe(unzipper.Extract({ path: proj_dir + '/' + dir_prefix_cut + date_dir + '/' }))
                        .on('finish', function(){
                            setTimeout(function(){
                                fs.unlink(dir_prefix + date_dir + '/' + file, function(err){
                                    if (err) {
                                        errors.push(['ОШИБКА! Не удалось удалить архив', file, err]);
                                        return cb(null);
                                    }else{
                                        cb(null);
                                    }
                                });
                            },100);

                        }).on('error', function(err){

                            clear_dir(dir_prefix + date_dir, function(err2){
                                if (err2) errors.push(['ОШИБКА! Не удалось удалить архив', file, err2]);
                                return cb(new UserError('Один из загруженных архивов не может быть открыт. Возможно установлен пароль. ' + file, {file:file, err:err, err2:err2}));
                            });

                            // fs.unlink(dir_prefix + date_dir + '/' + file, function(err2){
                            //     if (err2) errors.push(['ОШИБКА! Не удалось удалить архив', file, err2]);
                            //     return cb(new UserError('Один из загруженных архивов не может быть открыт. Возможно установлен пароль. ' + file, {file:file, err:err}));
                            // });
                        });



                    // extract(proj_dir + '/' + dir_prefix_cut + date_dir + '/' + file, {dir: proj_dir + '/' + dir_prefix_cut + date_dir + '/'}, function (err) {
                    //     if (err) {
                    //         fs.unlink(dir_prefix + date_dir + '/' + file, function(err2){
                    //             if (err2) errors.push(['ОШИБКА! Не удалось удалить архив', file, err2]);
                    //             return cb(new UserError('Один из загруженных архивов не может быть открыт. Возможно установлен пароль. ' + file, {file:file, err:err}));
                    //         });
                    //     }else{
                    //         fs.unlink(dir_prefix + date_dir + '/' + file, function(err){
                    //             if (err) {
                    //                 errors.push(['ОШИБКА! Не удалось удалить архив', file, err]);
                    //                 return cb(null);
                    //             }
                    //             cb(null);
                    //         });
                    //     }
                    // });
                }, cb);

            });
        },
        readFiles:function(cb){

            fs.readdir(dir_prefix + date_dir, function(err, files){
                if (err) return cb(new UserError('Не удалось считать файлы из директории.',{err:err,date_dir:date_dir}));
                for (let i in files) {
                    if (parsePath(files[i]).extname === '.xlsx') file_list.push(files[i]);
                }
                cb(null);
            });
        },
        parse:function(cb){
            let workSheetsFromFile;
            async.eachSeries(file_list, function(file, cb){
                if (file[0] === '~') return cb(null);
                let data;
                try {
                    workSheetsFromFile = xlsx.parse(dir_prefix + date_dir + '/' + file);
                    data = workSheetsFromFile[0].data;
                } catch (e) {
                    console.log('ОШИБКА! При попытке распарсить файл excel.', file, e);
                    errors.push(['ОШИБКА! При попытке распарсить файл excel.', file, e]);
                    // Просто игнорируем неподходящие файлы
                    return cb(null);
                }
                if (typeof data!== 'object') {
                    console.log('ОШИБКА! данные из файла не формат', data);
                    errors.push(['ОШИБКА! данные из файла не формат', data]);
                    return cb(null);
                }
                if (data.length < 7) {
                    console.log('ОШИБКА! данные из файла не формат', data);
                    errors.push(['ОШИБКА! данные из файла не формат', data]);
                    return cb(null);
                }
                let dates = String(data[1][0]).replace(/[^\d]/ig,'');
                let report_period = {
                    from:dates.substring(0,8),
                    to:dates.substring(8)
                };
                if (report_period.from !== report_period.to || report_period.from === ""){
                    console.log('ОШИБКА! Отчет снят за период, а не за день', report_period);
                    errors.push(['ОШИБКА! Отчет снят за период, а не за день', report_period]);
                    return cb(null);
                }
                // if (report_period.from !== date_dir) return cb(null);
                if (inc_dates.indexOf(report_period.from) === -1) return cb(null);
                // Найдем в каком поле указана 'Сумма к перечислению: '
                let amount;
                for (let i in data) {
                    if (data[i][5] === 'Сумма к перечислению: ' || data[i][5] === 'Сумма к перечислению:'){
                        amount = +String(data[i][6]).replace(',','.');
                        // Брейк не делаем, так как нам нужно последнее вхождение. Можно было бы с конца, но не уже так)
                    }
                }

                if (isNaN(amount) || typeof amount === 'undefined'){
                    console.log('ОШИБКА! Сумма в отчете указана не верно или ее не удалось найти', amount);
                    errors.push(['ОШИБКА! Сумма в отчете указана не верно или ее не удалось найти', amount]);
                    return cb(null);
                }

                let amount_vtb = 0;
                for (let i in data) {
                    if (data[i][5] === 'По реквизитам №1 р/сR-9800-0367016-SUPPL'){
                        amount_vtb = +String(data[i][6]).replace(',','.');
                        // Брейк не делаем, так как нам нужно последнее вхождение. Можно было бы с конца, но не уже так)
                    }
                }

                financings.push({
                    import_date:report_period.from,
                    import_merchant:data[4][0].replace('Наименование Клиента: ',''),
                    import_inn:data[5][0].replace('ИНН: ',''),
                    import_agreement:data[7][0].replace('Договор: ',''),
                    import_amount:amount,
                    import_amount_vtb:amount_vtb
                });
                cb(null);
                // 0-> data -> [][]
                // дата - 1,0 //12-10-2017 14:12:02
                // мерч - 4,0 //Наименование Клиента: ГУДАШЕВА ТАМИЛЛА ВЛАДИМИРОВНА ИП
                // инн - 5,0 //ИНН: 730400231498
                // Договор ВТБ - 7,0 //Договор: G-44691-0500 (03МБ-2016/0500) от 18.03.2016.
                // Сумма - Ч,6   ‌‌//+'0,1'.replace(',','.')
            },cb);
        },
        findFinIds:function(cb){
            async.eachSeries(financings, function(fin, cb){
                let o = {
                    command:'get',
                    object:'merchant_financing',
                    params:{
                        param_where:{
                            bank_agreement:fin.import_agreement
                        },
                        collapseData:false
                    }
                };
                _t.api(o, function (err, res) {
                    if (err) return cb(new MyError('Не удалось получить финансирование',{o : o, err : err}));
                    if (!res.length) {
                        errors.push(['ОШИБКА! Не удалось найти финансирование с таким договором', o]);
                        return cb(null);
                    }
                    if (res.length > 1) return cb(new UserError('С таким договором найдено более одного финансирования. ' + fin.import_agreement, {o:o, res:res}));
                    if (!financings_obj[res[0].id]){
                        financings_obj[res[0].id] = res[0];
                        for (let i in fin) {
                            financings_obj[res[0].id][i] = fin[i];
                        }
                    }else{
                        financings_obj[res[0].id].import_amount += +fin.import_amount;
                    }

                    cb(null);
                });

            }, cb);
        },
        findDailyPaymentIds:function(cb){
            async.eachSeries(financings_obj, function(fin, cb){
                let o = {
                    command:'get',
                    object:'daily_payment',
                    params:{
                        param_where:{
                            daily_payments_id:daily_payments.id,
                            merchant_financing_id:fin.id
                        },
                        collapseData:false
                    }
                };
                _t.api(o, function (err, res) {
                    if (err) return cb(new MyError('Не удалось получить daily_payment',{o : o, err : err}));
                    if (!res.length) {
                        errors.push(['ОШИБКА! Не удалось найти платеж с таким финансированием за этот день', o]);
                        return cb(null);
                    }
                    if (res.length > 1) return cb(new UserError('С таким финансированием найдено более одного платежа.', {o:o, res:res}));
                    fin.daily_payment = res[0];
                    cb(null);
                });

            }, cb);
        },
        setImportAmount:function(cb){
            async.eachSeries(financings_obj, function(fin, cb){
                if (isNaN(+fin.avl_proc_dly_withdraw_rate)) {
                    errors.push(['ОШИБКА! Не указан макс процент списания в день', fin]);
                    return cb(null);
                }
                if (!fin.daily_payment){
                    errors.push(['ОШИБКА! Не найден daily_payment', fin]);
                    return cb(null);
                }
                // let calc_amount = Math.round((fin.import_amount * +fin.avl_proc_dly_withdraw_rate / 100) * 100)/100;
                let calc_amount = (fin.import_amount * +fin.avl_proc_dly_withdraw_rate / 100).toFixed(3).slice( 0, -1 );
                if (+calc_amount === +fin.daily_payment.import_amount && fin.daily_payment.import_amount !== 0) return cb(null);
                let o = {
                    command:'modify',
                    object:'daily_payment',
                    params:{
                        id:fin.daily_payment.id,
                        import_amount:calc_amount,
                        import_amount_vtb:+fin.import_amount_vtb,
                        import_applied:true,
                        rollback_key:rollback_key
                    }
                };
                _t.api(o, function (err, res) {
                    if (err) return cb(new MyError('Не удалось установить import_amount платежу',{o : o, err : err}));
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
            if (!obj.doNotSaveRollback){
               rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'import_vtb', params:obj});
            }
            cb(null, new UserOk('Ок',{errors:errors}));
        }
    });
};

Model.prototype.import_vtb_apply = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    let _t = this;
    let id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    let rollback_key = obj.rollback_key || rollback.create();

    // Получить день
    // - применить если возможно

    let daily_payments;
    let payments;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить платежный день.',{id:id,err:err}));
                daily_payments = res[0];
                date_dir = daily_payments.payments_for_date.replace(/\./ig,'');
                cb(null);
            });
        },
        getRowsToApply:function(cb){
            let o = {
                command:'get',
                object:'daily_payment',
                params:{
                    param_where:{
                        daily_payments_id:daily_payments.id,
                        import_applied:true
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить платежи',{o : o, err : err}));
                payments = res;
                cb(null);
            });
        },
        apply:function(cb){
            if (!payments) return cb(null);
            async.eachSeries(payments, function(payment, cb){
                if (payment.is_applied) return cb(null);
                if (payment.status_sysname !== 'PENDING') return cb(null);
                if (payment.import_amount === 0){
                    // Дефолтим
                    let o = {
                        command:'setDefault',
                        object:'daily_payment',
                        params:{
                            id:payment.id,
                            paid_amount:0,
                            rollback_key:rollback_key
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось проставить дефолт',{o : o, err : err}));
                        cb(null);
                    });
                }else if(payment.financing_type_sysname === 'PERCENT'){
                    let o = {
                        command:'setPaid',
                        object:'daily_payment',
                        params:{
                            id:payment.id,
                            paid_amount:payment.import_amount,
                            rollback_key:rollback_key
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) {
                            // if (err.data){
                            //     if (err.data.err){
                            //         if (err.data.err.message === 'notModified') return cb(null);
                            //     }
                            // }

                            return cb(new MyError('Не удалось проставить платеж (1)',{o : o, err : err}));
                        }
                        cb(null);
                    });
                }else if(payment.financing_type_sysname === 'FIXED' && payment.pending_amount === payment.import_amount){
                    let o = {
                        command:'setPaid',
                        object:'daily_payment',
                        params:{
                            id:payment.id,
                            paid_amount:0,
                            rollback_key:rollback_key
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось проставить платеж (2)',{o : o, err : err}));
                        cb(null);
                    });
                }else{
                    return cb(null);
                }
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
                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'import_vtb_apply', params:obj});
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
    let _t = this;
    let id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    let rollback_key = obj.rollback_key || rollback.create();

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
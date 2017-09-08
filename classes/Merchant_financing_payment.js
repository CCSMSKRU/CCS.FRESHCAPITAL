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
var rollback = require('../modules/rollback');
var sendMail = require('../libs/sendMail');
var fs = require('fs');
var mustache = require('mustache');
var generateCalendar = require('../modules/generate_calendar');
var moment = require('moment');

var Model = function(obj){
    this.name = obj.name;
    this.tableName = obj.name.toLowerCase();

    var basicclass = BasicClass.call(this, obj);
    if (basicclass instanceof MyError) return basicclass;
};
util.inherits(Model, BasicClass);
Model.prototype.getPrototype = Model.prototype.get;

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
            _t['add_'](obj, cb);
        } else {
            _t.getPrototype(obj, cb);
        }
    }
};

/**
 * Неотмеченные платежи
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.get_table_unchecked_payment = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;

    // запросить только те которые должны быть уже отмечеными то есть не позже вчерашней даты, но не отмечены

    var coWhere = [
        {
            key:'payment_date',
            type:'<',
            val1:funcs.getDateMySQL(),
            group:'coWhere'
        },
        {
            key:'status_sysname',
            val1:'PENDING',
            group:'coWhere'
        }
    ];
    if (!Array.isArray(obj.where)) obj.where = coWhere;
    else obj.where = obj.where.concat(coWhere);

    _t.getPrototype(obj,cb);
};

/**
 * Пропущенные платежи
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.get_table_default_payment = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;

    // запросить дефолтные не обработанные платежи

    var coWhere = [
        {
            key:'status_sysname',
            type:'in',
            val1:['DEFAULT','PARTIAL_PAID'],
            group:'coWhere'
        }

    ];
    if (!Array.isArray(obj.where)) obj.where = coWhere;
    else obj.where = obj.where.concat(coWhere);

    _t.getPrototype(obj,cb);
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

/**
 * Закрывает платеж PAID или DEFAULT
 * Устанавливает тип закрытия
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.makePayment = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var cbMakePayment = cb;
    if (obj.fromClient) return cb(new UserError('Метод устаревший. Используйте Ежедневные платежи'));
    var id = obj.id;
    var payment_date = obj.payment_date || funcs.getDate();
    if (isNaN(+id)) return cb(new MyError('В метод не передан id'));
    if (!funcs.validation.isDate(payment_date)) return cb(new MyError('Не корректно передана дата.',{payment_date:payment_date}));
    if (funcs.date_A_more_or_equal_B(payment_date,funcs.getDate()) && !!obj.fromClient) return cb(new UserError('Платеж может быть отмечен только за прошедшую дату.'));
    var rollback_key = obj.rollback_key || rollback.create();
    var closing_type_id = obj.closing_type_id;
    // Получить платеж в нужном статусе
    var amount = +obj.amount || +obj.paid_amount;
    if (!amount || isNaN(amount)) {
        return cb(new MyError('Необходимо передать сумму (amount/paid_amount)',{obj:obj}));
    }
    var status_sysname = obj.status_sysname;
    if (!status_sysname) return cb(new MyError('Необходимо передать status_sysname',{obj:obj}));
    var closing_type_sysname = obj.closing_type_sysname;
    if (!closing_type_sysname) return cb(new MyError('Необходимо передать closing_type_sysname',{obj:obj}));
    var deficit;
    // Получить данные о календаре
    // Проверить статус календаря
    // Получить дату платежа если передан только ID
    // Получим статус_id PAID
    // Подготовить данные по статистике платежей
    // Сменить платежу статус и выставить сумму и указать пользователя и статистические данные
    // Подготовить данные по статистике платежей
    // Записать данные по статистике платежей


    var calendar, payment, status_id;
    var merchant_financing;
    var overpayment;
    async.series({
        get: function (cb) {
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new UserError('Платеж не найден.'));
                payment = res[0];
                cb(null);
            })
        },
        getCalendar: function (cb) {
            // Получить данные о календаре
            var o = {
                command:'get',
                object:'merchant_financing_calendar',
                params:{
                    param_where:{
                        id:payment.calendar_id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить календарь.',{err:err}));
                if (!res.length) return cb(new MyError('Не найден Календарь.'));
                calendar = res[0];
                cb(null);
            })
        },
        getFinancing: function (cb) {
            // Получить данные о календаре
            var o = {
                command:'get',
                object:'merchant_financing',
                params:{
                    param_where:{
                        id:calendar.merchant_financing_id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить финансирование.',{err:err}));
                if (!res.length) return cb(new MyError('Не найден финансирование.'));
                merchant_financing = res[0];
                cb(null);
            })
        },
        setAndCheckAmount:function(cb){
            if (amount <= 0) return cb(new UserError('Не корректно указана сумма платежа'));
            if (+amount > +merchant_financing.to_return){
                // Сняли денег больше чем необходимо для закрытия. - закрываем платеж на сумму необходимую для закрытия, а остаток записываем в поле overpayment у финансирования (см. функцию ниже)
                overpayment = +amount - +merchant_financing.to_return;
                amount = +merchant_financing.to_return;
            }

            // if ((amount > +payment.pending_amount - +payment.paid_amount) && payment.financing_type_sysname === 'FIXED') {
            //     return cb(new UserError('Указаная сумма больше чем необходимо для закрытия платежа.'));
            // }
            cb(null);
        },
        makeDefaultIfDeficit:function(cb){
            // if (!(deficit && payment.status_sysname === 'PENDING') || payment.financing_type_sysname === 'PERCENT') return cb(null);
            if (status_sysname !== 'DEFAULT' || status_sysname === payment.status_sysname) return cb(null);
            _t.makeDefault(obj,function(err){
                if (err) return cb(err);
                _t.makePayment(obj, cbMakePayment);
            });
        },
        checkCalendar: function (cb) {
            if (calendar.status_sysname !== 'IN_WORK') return cb(new UserError('Календарь не активен. Невозможно отметить платеж.',{status_sysname:calendar.status_sysname}));
            cb(null);
        },
        makePaymentFromMerch: function (cb) {
            if (amount <= 0) return cb(null); // Все уже оплачено - только overpayment
            // if (deficit && payment.financing_type_sysname === 'FIXED') return cb(null);
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
                            // Вычислим процент участия
                            var percent = +(plan_merch_inv.amount * 100 / merchant_financing.founding_amount).toFixed(5);
                            // Вычисляем сумму
                            // var to_investor_amount = +payment.pending_amount * percent / 100;
                            var to_investor_amount = +amount * percent / 100;

                            var o = {
                                command: 'makePaymentFromMerch',
                                object: 'investor_account',
                                params: {
                                    payment:payment,
                                    id:plan_merch_inv.investor_account_id,
                                    financing_id:merchant_financing.id,
                                    amount:to_investor_amount,
                                    mgm_fee:plan_merch_inv.mgm_fee,
                                    percent:percent,
                                    operation_date:payment_date,
                                    rollback_key: rollback_key,
                                    doNotSaveRollback:true
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось провести платеж инвестору', {o: o, err: err}));
                                cb(null);
                            });
                        }, cb);
                    });



                }
            },cb);

        },
        setPayment: function (cb) {
            if (amount <= 0) return cb(null); // Все уже оплачено - только overpayment
            // Сменить платежу статус и выставить сумму, дату и указать пользователя и % закрытия
            var complete_percent = Math.round((+calendar.total_returned + +amount) * 100 / merchant_financing.amount_to_return);
            // var closing_date = (moment(payment_date,'DD.MM.YYYY') > moment(payment.closing_date,'DD.MM.YYYY'))? payment_date : payment.closing_date;
            var closing_date = payment_date;
            var payment_date_moment = moment(payment_date,'DD.MM.YYYY');
            var closing_date_moment = moment(payment.closing_date,'DD.MM.YYYY');
            if (closing_date_moment.isValid() && payment_date_moment.isValid()){
                if (closing_date_moment > payment_date_moment) closing_date = payment.closing_date;
            }
            var params = {
                id: id,
                status_sysname: status_sysname,
                closing_date: closing_date,
                paid_amount: +payment.paid_amount + amount,
                paid_amount_processing:+obj.paid_amount_processing || payment.paid_amount_processing || 0,
                paid_amount_later:+obj.paid_amount_later,
                paid_date: payment_date,
                paid_by_user_id:_t.user.user_data.id,
                complete_percent:complete_percent,
                closing_type_sysname:closing_type_sysname,
                rollback_key:rollback_key
            };
            _t.modify(params, function (err) {
                if (err) {
                    return cb(new UserError('Не удалось отметить платеж.',{err:err, params:params, obj:obj}));
                }
                cb(null);
            });
        },
        setOverpayment:function(cb){
            if (!overpayment) return cb(null);
            var o = {
                command:'modify',
                object:'merchant_financing',
                params:{
                    id:merchant_financing.id,
                    overpayment:+merchant_financing.overpayment + +overpayment,
                    rollback_key:rollback_key
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось проставить overpayment финансировнию',{o : o, err : err}));
                cb(null);
            });

        },
        setStatistic: function (cb) {
            if (amount <= 0) return cb(null); // Все уже оплачено - только overpayment
            if (obj.doNotSetStatistic) return cb(null);
            var o = {
                command:'setStatisticInfo',
                object:'merchant_financing_calendar',
                params:{
                    id:calendar.id,
                    operation_date:payment_date,
                    rollback_key:rollback_key
                }
            };
            _t.api(o, function (err, res) {
                if (err) {
                    return cb(new MyError('Не удалось установить информацию по платежам.',{err:err}));
                }
                cb(null);
            })
        }
    }, function (err) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!obj.doNotSaveRollback){
                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'makePayment', params:obj});
            }
            cb(null, new UserOk('Платеж за дату "' + payment_date + '" отмечен как "Оплачен"'));
        }
    })
};

Model.prototype.makeDefault = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (obj.fromClient) return cb(new UserError('Метод устаревший. Используйте Ежедневные платежи'));
    var payment_date = obj.payment_date || funcs.getDate();
    if (isNaN(+id)) return cb(new MyError('В метод не передан id'));
    if (!funcs.validation.isDate(payment_date)) return cb(new MyError('Не корректно передана дата.',{payment_date:payment_date}));
    if (funcs.date_A_more_or_equal_B(payment_date,funcs.getDate()) && !!obj.fromClient) return cb(new UserError('Платеж может быть отмечен только за прошедшую дату.'));
    var rollback_key = obj.rollback_key || rollback.create();
    var closing_type_id = obj.closing_type_id;
    var status = (obj.status == 'MOVED_TO_THE_END')? obj.status : 'DEFAULT';

    // Получить платеж в нужном статусе

    // Получить данные о календаре
    // Проверить статус календаря
    // Получим статус_id DEFAULT
    // Подготовить данные по статистике платежей
    // Сменить платежу статус и выставить сумму и указать пользователя и статистические данные
    // Подготовить данные по статистике платежей
    // Записать данные по статистике платежей


    var calendar, payment, status_id;
    var merchant_financing;
    var main_company, main_company_emails, invalid_emails, tpl;
    async.series({
        get: function (cb) {
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new UserError('Платеж не найден.'));
                payment = res[0];
                cb(null);
            })
        },
        getCalendar: function (cb) {
            // Получить данные о календаре
            var o = {
                command:'get',
                object:'merchant_financing_calendar',
                params:{
                    param_where:{
                        id:payment.calendar_id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить календарь.',{err:err}));
                if (!res.length) return cb(new MyError('Не найден Календарь.'));
                calendar = res[0];
                cb(null);
            })
        },
        checkCalendar: function (cb) {
            if (calendar.status_sysname !== 'IN_WORK') return cb(new UserError('Календарь не активен. Невозможно отметить платеж.',{status_sysname:calendar.status_sysname}));
            // if (calendar.financing_type_sysname !== 'FIXED') return cb (new UserError('Для данного типа финансирования команда не применима.'));
            cb(null);
        },
        getFinancing: function (cb) {
            // Получить данные о календаре
            var o = {
                command:'get',
                object:'merchant_financing',
                params:{
                    param_where:{
                        id:calendar.merchant_financing_id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить финансирование.',{err:err}));
                if (!res.length) return cb(new MyError('Не найден финансирование.'));
                merchant_financing = res[0];
                cb(null);
            })
        },
        setPayment: function (cb) {
            // Сменить платежу статус и выставить сумму, дату и указать пользователя и % закрытия
            var complete_percent = Math.round((+calendar.total_returned) * 100 / merchant_financing.amount_to_return);
            var params = {
                id: id,
                status_sysname:'DEFAULT',
                default_date:payment_date,
                default_by_user_id:_t.user.user_data.id,
                complete_percent:complete_percent
            };
            if (closing_type_id){
                params.closing_type_id = closing_type_id;
                params.closing_date = payment_date;
            }
            params.rollback_key = rollback_key;
            _t.modify(params, function (err) {
                if (err) return cb(new UserError('Не удалось отметить платеж.',{err:err}));
                cb(null);
            });
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
        prepareTemplate: function (cb) {
            fs.readFile('./templates/paymentDefault_notify.html', function (err, data) {
                if (err) return cb(new MyError('Не удалось считать файл шаблона.', err));
                tpl = data.toString();
                cb(null);
            });
        },
        sendNotify: function (cb) {
            cb(null); // Разсылаем в фоне
            // Разослать уведомления
            //var emails_to_notify = main_company_emails.concat(merchant.email); // Добавим мерча в рассылку
            var emails_to_notify = main_company_emails;
            async.eachSeries(emails_to_notify, function (item, cb) {
                var m_obj = {
                    //fio: merchant_financing.fio
                };
                tpl = mustache.to_html(tpl, m_obj);
                sendMail({email: item, subject: 'Платеж пропущен', html: tpl}, function (err, info) {
                    if (err) {
                        return cb(new UserError('Не удалось отправить уведомление на email: ' + item, {err: err, info: info}));
                    }
                    cb(null);
                });
            },function(err){
                if (err) console.log('ERROR','Возникла ошиибка при отправке уведомлений.');
            });

        },
        setStatistic: function (cb) {
            if (obj.doNotSetStatistic) return cb(null);
            var o = {
                command:'setStatisticInfo',
                object:'merchant_financing_calendar',
                params:{
                    id:calendar.id,
                    rollback_key:rollback_key
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось установить информацию по платежам.',{err:err}));
                cb(null);
            })
        }
    }, function (err) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!obj.doNotSaveRollback){
                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'makeDefault', params:obj});
            }
            cb(null, new UserOk('Платеж за дату "' + payment_date + '" отмечен как "Пропущен."',{invalid_emails:invalid_emails}));
        }
    })
};

/**
 * Перенос в конец
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.pushDefaultPayment = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    return cb(new UserError('Метод устаревший. Используйте Ежедневные платежи'));
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id'));
    var rollback_key = obj.rollback_key || rollback.create();

    // Получим финансирование
    // Получим мерча
    // Задефолтим платеж
    // Получим дату последнего платежа
    // Вычислим дату последнего платежа и добавим
    // Добавим новый в конец
    // Уведомить банк


    var merchant_financing, merchant;
    var payment, last_date, new_payment_date;
    var tplBank;
    var bank_emails = [];
    var invalid_emails = [];
    async.series({
        get: function (cb) {
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new UserError('Платеж не найден.'));
                payment = res[0];
                cb(null);
            })
        },
        getFinancing: function (cb) {
            // Получить данные по финансированию (чтобы использовать его поля)
            var o = {
                command: 'getById',
                object: 'merchant_financing',
                params: {
                    id: payment.merchant_financing_id
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить информацию по финансированию',{err:err}));
                if (!res.length) return cb(new MyError('Не удалось найти финансирование'));
                merchant_financing = res[0];
                return cb(null);
            });
        },
        getMerchant: function (cb) {
            // Получить данные по мерчу (чтобы использовать его поля)
            var o = {
                command: 'getById',
                object: 'merchant',
                params: {
                    id: merchant_financing.merchant_id
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить информацию по мерчу',{err:err}));
                if (!res.length) return cb(new MyError('Не удалось найти мерча'));
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
            if (payment.status_sysname!=='DEFAULT') return cb(new UserError('Добавить в конец можно только пропущенный платеж.'));
            cb(null);
        },
        getLastPaymnet: function (cb) {
            var params = {
                param_where:{
                    calendar_id: payment.calendar_id
                },
                collapseData:false,
                sort: {
                    columns: 'payment_date',
                    direction: 'DESC'
                },
                limit:100000

            };
            _t.get(params, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new UserError('Не найдено ни одного платежа.'));
                last_date = moment(moment(res[0].payment_date,'DD.MM.YYYY') + moment.duration(1, 'days')).format('DD.MM.YYYY');
                cb(null);
            })
        },
        getNextDate: function (cb) {
            generateCalendar({
                date_start: last_date,
                payments_count: 1,
                type: 'gov'
            }, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить дату для переноса платежа.',{err:err}));
                if (!res.length) return cb(new MyError('Не удалось получить дату для переноса платежа (2)'));
                new_payment_date = res[0];
                cb(null);
            });
        },
        addPaymentToEnd: function (cb) {
            var params = {
                merchant_id: payment.merchant_id,
                calendar_id: payment.calendar_id,
                status_sysname: 'PENDING',
                payment_date: new_payment_date,
                pending_amount:payment.pending_amount
            };
            params.rollback_key = rollback_key;
            _t.add(params, function (err, res) {
                if (err) return cb(err);
                cb(null);
            });
        },
        prepareTemplateBank: function (cb) {
            fs.readFile('./templates/bank_send_payment_push_end.html', function (err, data) {
                if (err) return cb(new MyError('Не удалось считать файл шаблона.', err));
                tplBank = data.toString();

                var m_obj = {
                    agreement_number: merchant_financing.agreement_number || '______',
                    agreement_sign_date: merchant_financing.agreement_date || '______',
                    name: merchant.name || '______',
                    default_payment_date: payment.payment_date || '______',
                    payment_date: new_payment_date || '______'
                };
                tplBank = mustache.to_html(tplBank, m_obj);
                cb(null);
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
            async.eachSeries(bank_emails, function (item, cb) {
                sendMail({email: item, subject: 'Перенос платежа', html: tplBank}, function (err, info) {
                    if (err) return cb(new UserError('Не удалось отправить email ' + item, {err: err, info: info}));
                    cb(null);
                });
            },cb);
        },
        changeStatus: function (cb) {
            // Поменять статус
            _t.setStatus({
                id: id,
                status: 'MOVED_TO_END'
            }, function (err) {
                if (err) return cb(new UserError('Не удалось изменить статус платежа. Обратитесь к администратору.', {err: err}));
                cb(null);
            });
        },
        setStatistic: function (cb) {
            if (obj.doNotSetStatistic) return cb(null);
            if (!merchant_financing.current_calendar_id) return cb(null);
            var o = {
                command:'setStatisticInfo',
                object:'merchant_financing_calendar',
                params:{
                    id:merchant_financing.current_calendar_id,
                    rollback_key:rollback_key
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось установить информацию по платежам.',{err:err}));
                cb(null);
            })
        }
    }, function (err) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!obj.doNotSaveRollback){
                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'pushDefaultPayment', params:obj});
            }
            cb(null, new UserOk('Платеж успешно перенесен в конец'));
        }
    })
};

/**
 * Создает новый ЗАКРЫТЫЙ платеж. Создано для процентной схемы, где банк указывает сколько снял.
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.makePaymentPERCENT = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    return cb(new UserError('Метод устаревший. Используйте Ежедневные платежи'));
    var payment_date = obj.payment_date || funcs.getDate();
    var paid_amount = obj.paid_amount;
    if (!funcs.validation.isDate(payment_date)) return cb(new MyError('Не корректно передана дата.',{payment_date:payment_date}));
    if (funcs.date_A_more_or_equal_B(payment_date,funcs.getDate()) && !!obj.fromClient) return cb(new UserError('Платеж может быть отмечен только за прошедшую дату.'));
    if (isNaN(+paid_amount)) return cb(new UserError('Некорректно указана сумма',obj));

    var calendar_id = obj.calendar_id;
    if (isNaN(+calendar_id)) return cb(new MyError('Не указан calendar_id',obj));

    var rollback_key = obj.rollback_key || rollback.create();

    var calendar, payment, status_id;
    var merchant_financing;
    async.series({
        getCalendar: function (cb) {
            // Получить данные о календаре
            var o = {
                command:'get',
                object:'merchant_financing_calendar',
                params:{
                    param_where:{
                        id:calendar_id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить календарь.',{err:err}));
                if (!res.length) return cb(new MyError('Не найден Календарь.'));
                calendar = res[0];
                cb(null);
            })
        },
        checkCalendar: function (cb) {
            if (calendar.status_sysname !== 'IN_WORK') return cb(new UserError('Календарь не активен. Невозможно отметить платеж.',{status_sysname:calendar.status_sysname}));
            cb(null);
        },
        getPaymentNow: function (cb) {
            // Проверить платеж за эту дату
            var params = {
                where:[
                    {
                        key:'calendar_id',
                        val1:calendar_id
                    },
                    {
                        key:'closing_type_sysname',
                        val1:obj.closing_type_sysname
                    },
                    {
                        key:'payment_date',
                        val1:payment_date
                    }
                    // {
                    //     key:'paid_date',
                    //     comparisonType:'OR',
                    //     group:'p_date',
                    //     val1:payment_date
                    // },
                    // {
                    //     key:'default_date',
                    //     comparisonType:'OR',
                    //     group:'p_date',
                    //     val1:payment_date
                    // }
                ]
            };
            _t.getCount(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить календарь.',{err:err}));
                if (res.count) return cb(new UserError('На эту дату уже есть платеж'));
                cb(null);
            })
        },
        getFinancing: function (cb) {
            // Получить данные о календаре
            var o = {
                command:'get',
                object:'merchant_financing',
                params:{
                    param_where:{
                        id:calendar.merchant_financing_id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить финансирование.',{err:err}));
                if (!res.length) return cb(new MyError('Не найден финансирование.'));
                merchant_financing = res[0];
                cb(null);
            })
        },

        setPayment: function (cb) {
            // Сменить платежу статус и выставить сумму, дату и указать пользователя и % закрытия
            var complete_percent = Math.round((+calendar.total_returned + +paid_amount) * 100 / merchant_financing.amount_to_return);
            var params = {
                calendar_id:calendar_id,
                merchant_financing_id:calendar.merchant_financing_id,
                merchant_id:merchant_financing.merchant_id,
                status_sysname: 'PAID',
                closing_type_sysname: obj.closing_type_sysname || 'BY_PROCESSING',
                payment_date: payment_date,
                closing_date: payment_date,
                pending_amount: merchant_financing.payment_amount,
                paid_amount: paid_amount,
                paid_date: payment_date,
                paid_by_user_id:_t.user.user_data.id,
                complete_percent:complete_percent
            };
            params.rollback_key = rollback_key;
            _t.add(params, function (err, res) {
                if (err) return cb(new UserError('Не удалось добавить платеж.',{err:err}));
                payment = {
                    id:res.id
                };
                cb(null, {id:res.id});
            });
        },
        makePaymentFromMerch: function (cb) {
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
                            // Вычислим процент участия
                            if (plan_merch_inv.amount == 0) return cb(null);
                            var percent = +(plan_merch_inv.amount * 100 / merchant_financing.founding_amount).toFixed(5);
                            // Вычисляем сумму
                            var to_investor_amount = +paid_amount * percent / 100;

                            var o = {
                                command: 'makePaymentFromMerch',
                                object: 'investor_account',
                                params: {
                                    payment:payment,
                                    id:plan_merch_inv.investor_account_id,
                                    financing_id:merchant_financing.id,
                                    amount:to_investor_amount,
                                    percent:percent,
                                    mgm_fee:plan_merch_inv.mgm_fee,
                                    operation_date:payment_date,
                                    rollback_key: rollback_key,
                                    doNotSaveRollback:true
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось провести платеж инвестору', {o: o, err: err}));
                                cb(null);
                            });
                        }, cb);
                    });



                }
            },cb);

        },
        closeFinancingIf100: function (cb) {
            // if (calendar.status_sysname!='CLOSED') return cb(null);
            if (merchant_financing.to_return - +paid_amount > 0) {
                return cb(null);
            }
            if (obj.doNotCloseFinancing) return cb(null);
            var o = {
                command:'closeFinancing',
                object:'merchant_financing',
                params:{
                    id:merchant_financing.id,
                    closing_type_sysname:'BY_PROCESSING',
                    operation_date:obj.operation_date || payment_date,
                    rollback_key:rollback_key,
                    doNotSetStatistic:true
                }
            };
            _t.api(o, function (err) {
                if (err) return cb(new MyError('Не удалось закрыть финансирование.',{err:err}));
                cb(null);
            })
        },
        setStatistic: function (cb) {
            if (obj.doNotSetStatistic) return cb(null);
            var o = {
                command:'setStatisticInfo',
                object:'merchant_financing_calendar',
                params:{
                    id:calendar.id,
                    operation_date:payment_date,
                    rollback_key:rollback_key
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось установить информацию по платежам.',{err:err}));
                cb(null);
            })
        }
    }, function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!obj.doNotSaveRollback){
                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'makePaymentPERCENT', params:obj});
            }
            cb(null, new UserOk('Платеж за дату "' + payment_date + '" на сумму "' + paid_amount + '" отмечен как "Оплачен"',{id:res.setPayment.id}));
        }
    });
};

/**
 * Создает новый ДЕФОЛТНЫЙ платеж. Создано для процентной схемы, где банк указывает сколько снял. Или то что ничего не снял, а должен был бы.
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.makeDefaultPERCENT = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    return cb(new UserError('Метод устаревший. Используйте Ежедневные платежи'));
    var _t = this;
    var payment_date = obj.payment_date || funcs.getDate();
    if (!funcs.validation.isDate(payment_date)) return cb(new MyError('Не корректно передана дата.',{payment_date:payment_date}));
    if (funcs.date_A_more_or_equal_B(payment_date,funcs.getDate()) && !!obj.fromClient) return cb(new UserError('Платеж может быть отмечен только за прошедшую дату.'));

    var calendar_id = obj.calendar_id;
    if (isNaN(+calendar_id)) return cb(new MyError('Не указан calendar_id',obj));

    var rollback_key = obj.rollback_key || rollback.create();
    // return cb(new UserError('Нельзя выставить дефолтный платеж для процентного типа финансирования.'));

    var calendar, payment;
    var merchant_financing;
    var main_company, main_company_emails, invalid_emails, tpl;
    var fails;
    async.series({
        getCalendar: function (cb) {
            // Получить данные о календаре
            var o = {
                command:'get',
                object:'merchant_financing_calendar',
                params:{
                    param_where:{
                        id:calendar_id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить календарь.',{err:err}));
                if (!res.length) return cb(new MyError('Не найден Календарь.'));
                calendar = res[0];
                cb(null);
            })
        },
        checkCalendar: function (cb) {
            if (calendar.status_sysname !== 'IN_WORK') return cb(new UserError('Календарь не активен. Невозможно отметить платеж.',{status_sysname:calendar.status_sysname}));
            // if (calendar.financing_type_sysname != 'PERCENT') return cb (new UserError('Для данного типа финансирования команда не применима.'));
            cb(null);
        },
        getPaymentNow: function (cb) {
            // Проверить платеж за эту дату
            var params = {
                where:[
                    {
                        key:'calendar_id',
                        val1:calendar_id
                    },
                    {
                        key:'paid_date',
                        comparisonType:'OR',
                        group:'p_date',
                        val1:payment_date
                    },
                    {
                        key:'default_date',
                        comparisonType:'OR',
                        group:'p_date',
                        val1:payment_date
                    }
                ]
            };
            _t.getCount(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить календарь.',{err:err}));
                if (res.count) return cb(new UserError('На эту дату уже есть платеж'));
                cb(null);
            })
        },
        getFinancing: function (cb) {
            // Получить данные о календаре
            var o = {
                command:'get',
                object:'merchant_financing',
                params:{
                    param_where:{
                        id:calendar.merchant_financing_id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить финансирование.',{err:err}));
                if (!res.length) return cb(new MyError('Не найден финансирование.'));
                merchant_financing = res[0];
                cb(null);
            })
        },
        setPayment: function (cb) {
            // Сменить платежу статус и выставить сумму, дату и указать пользователя и % закрытия
            var complete_percent = Math.round((calendar.total_returned) * 100 / merchant_financing.amount_to_return);
            var params = {
                calendar_id:calendar_id,
                merchant_financing_id:calendar.merchant_financing_id,
                merchant_id:merchant_financing.merchant_id,
                status_sysname: 'DEFAULT',
                payment_date:payment_date,
                default_date:payment_date,
                default_by_user_id:_t.user.user_data.id,
                complete_percent:complete_percent
            };
            params.rollback_key = rollback_key;
            _t.add(params, function (err) {
                if (err) return cb(new UserError('Не удалось добавить пропущенный платеж.',{err:err}));
                cb(null);
            });
        },

        alert: function (cb) {
            calendar.payment_fails++;
            if (calendar.payment_fails < 5) return cb(null);
            calendar.payment_fails = 0;
            async.series({
                getMainCompanyEmails: function (cb) {
                    // Запросить emails для главной компании (VG)
                    var o = {
                        command: 'get',
                        object: 'company_sys',
                        params: {
                            param_where: {
                                main_company: true
                            },
                            collapseData: false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить информацию по главной компании.', {err: err}));
                        if (!res.length) return cb(new UserError('Не найдена главная компания. Зайдите в Компании и установите ей галочку главная. Также пропишите емайлы для оповещения'));
                        if (res.length > 1) return cb(new UserError('Несколько компаний установлено как главная. Зайдите в Компании и установите галочку только для одной компании. Также пропишите емайлы для оповещения'));
                        main_company = res[0];
                        main_company_emails = main_company.notifications_emails.replace(/\s+/ig, '').split(',');
                        var valid_emails = [];
                        for (var i in main_company_emails) {
                            if (funcs.validation.email(main_company_emails[i])) valid_emails.push(main_company_emails[i]);
                            else invalid_emails.push(main_company_emails[i]);
                        }
                        main_company_emails = valid_emails;
                        cb(null);
                    })
                },
                prepareTemplate: function (cb) {
                    fs.readFile('./templates/paymentDefault_notify.html', function (err, data) {
                        if (err) return cb(new MyError('Не удалось считать файл шаблона.', err));
                        tpl = data.toString();
                        cb(null);
                    });
                },
                sendNotify: function (cb) {
                    // Разослать уведомления
                    //var emails_to_notify = main_company_emails.concat(merchant.email); // Добавим мерча в рассылку
                    var emails_to_notify = main_company_emails;
                    async.eachSeries(emails_to_notify, function (item, cb) {
                        var m_obj = {
                            //fio: merchant_financing.fio
                        };
                        tpl = mustache.to_html(tpl, m_obj);
                        sendMail({email: item, subject: 'Платеж пропущен', html: tpl}, function (err, info) {
                            if (err) return cb(new UserError('Не удалось отправить уведомление на email: ' + item, {
                                err: err,
                                info: info
                            }));
                            cb(null);
                        });
                    }, cb);

                }
            }, cb)
        },
        setFailCounter: function (cb) {
            var o = {
                command:'modify',
                object:'merchant_financing_calendar',
                params:{
                    id:calendar.id,
                    payment_fails:calendar.payment_fails
                }
            };
            _t.api(o, cb);
        },
        setOnAttention: function (cb) {
            var o = {
                command:'onAttention',
                object:'merchant_financing',
                params:{
                    id:merchant_financing.id
                }
            };
            _t.api(o, cb);
        },
        setStatistic: function (cb) {
            if (obj.doNotSetStatistic) return cb(null);
            var o = {
                command:'setStatisticInfo',
                object:'merchant_financing_calendar',
                params:{
                    id:calendar.id,
                    rollback_key:rollback_key
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось установить информацию по платежам.',{err:err}));
                cb(null);
            })
        }
    }, function (err) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!obj.doNotSaveRollback){
                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'makeDefaultPERCENT', params:obj});
            }
            var msg = (calendar.payment_fails)? 'Добавлен пропущенный платеж. Уведомления отправлены.' : 'Добавлен пропущенный платеж.';
            cb(null, new UserOk(msg));
        }
    });
};


Model.prototype.closePaymentByAnother = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var cbMakePayment = cb;
    var id = obj.id;
    var closing_date = obj.closing_date || funcs.getDate();
    if (isNaN(+id)) return cb(new MyError('В метод не передан id'));
    if (!funcs.validation.isDate(closing_date)) return cb(new MyError('Не корректно передана дата.',{closing_date:closing_date}));
    if (funcs.date_A_more_or_equal_B(closing_date,funcs.getDate()) && !!obj.fromClient) return cb(new UserError('Платеж может быть отмечен только за прошедшую дату.'));
    var rollback_key = obj.rollback_key || rollback.create();
    // Получить платеж в нужном статусе
    var amount = 0;

    // Получить данные о календаре
    // Проверить статус календаря
    // Получить дату платежа если передан только ID
    // Получим статус_id PAID
    // Подготовить данные по статистике платежей
    // Сменить платежу статус и выставить сумму и указать пользователя и статистические данные
    // Подготовить данные по статистике платежей
    // Записать данные по статистике платежей


    var calendar, payment, status_id;
    var merchant_financing;
    async.series({
        get: function (cb) {
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new UserError('Платеж не найден.'));
                payment = res[0];
                cb(null);
            })
        },
        getCalendar: function (cb) {
            // Получить данные о календаре
            var o = {
                command:'get',
                object:'merchant_financing_calendar',
                params:{
                    param_where:{
                        id:payment.calendar_id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить календарь.',{err:err}));
                if (!res.length) return cb(new MyError('Не найден Календарь.'));
                calendar = res[0];
                cb(null);
            })
        },
        checkCalendar: function (cb) {
            if (calendar.status_sysname !== 'IN_WORK') return cb(new UserError('Календарь не активен. Невозможно отметить платеж.',{status_sysname:calendar.status_sysname}));
            cb(null);
        },
        setPayment: function (cb) {
            // Сменить платежу статус и выставить сумму, дату и указать пользователя и % закрытия
            var params = {
                id: id,
                status_sysname: 'CLOSE_BY_ANOTHER',
                closing_date: closing_date,
                paid_amount: 0,
                paid_date: closing_date,
                paid_by_user_id:_t.user.user_data.id,
                closing_type_sysname:obj.closing_type_sysname || 'REMITTANCE',
                closed_by_payment_id:obj.closed_by_payment_id,
                rollback_key:rollback_key
            };
            _t.modify(params, function (err) {
                if (err) return cb(new UserError('Не удалось отметить платеж.',{err:err}));
                cb(null);
            });
        }
    }, function (err) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!obj.doNotSaveRollback){
                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'closePaymentByAnother', params:obj});
            }
            cb(null, new UserOk('Платеж за дату "' + closing_date + '" закрыт другим'));
        }
    })
};

module.exports = Model;
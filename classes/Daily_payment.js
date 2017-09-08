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

// Model.prototype.get_ = function (obj, cb) {
//     if (arguments.length == 1) {
//         cb = arguments[0];
//         obj = {};
//     }
//     var _t = this;
//     var id = obj.id;
//     var rollback_key = obj.rollback_key || rollback.create();
//     obj.collapseData = false;
//     _t.getPrototype(obj, function(err, res, additionalData){
//         if (err) return cb(err);
//         for (var i in res) {
//             res[i].merchant_short_name = res[i].merchant_short_name || res[i].merchant_name;
//         }
//         res = funcs.collapseData(res, {
//             count: additionalData.count,
//             count_all: additionalData.count_all
//         }, additionalData.data_columns);
//         cb(null, res);
//     })
// };

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

Model.prototype.setPaid = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;

    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));

    var paid_amount = +obj.paid_amount || 0;
    if (isNaN(+paid_amount)) return cb(new UserError('Некорректно указана сумма',{obj:obj}));

    var rollback_key = obj.rollback_key || rollback.create();

    var partial_paid = obj.partial_paid;

    var daily_payment, financing;

    async.series({
        getDailyPayment: function (cb) {

            _t.getById({id:id}, function (err, res) {

                if(err) return cb(new UserError('Не удалось получить запись платежа', {err:err, id:id}));

                daily_payment = res[0];
                if (daily_payment.is_applied) return cb(new UserError('Эта запись уже применена и с ней нельзя совершать никакие операции.'));
                cb(null);
            });

        },
        getFinancing:function(cb){
            var o = {
                command:'getById',
                object:'merchant_financing',
                params:{
                    id:daily_payment.merchant_financing_id
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить финнансирование',{o : o, err : err}));
                financing = res[0];
                cb(null);
            });

        },
        checkPaidAmount: function (cb) {
            var default_amount = 0;
            var pending_body_amount = 0;
            var pending_percent_amount = 0;

            var params = {
                id: id,
                closing_date:daily_payment.daily_payments_date,
                closing_type_sysname:'BY_PROCESSING',
                default_date:null,
                rollback_key:rollback_key
            };

            switch (daily_payment.financing_type_sysname){
                case 'FIXED':
                    if(paid_amount === 0){
                        paid_amount = +daily_payment.pending_amount;
                    }

                    if (paid_amount > daily_payment.pending_amount) return cb(new UserError('Сумма оплаты по процессингу не может привышать ожидаемую сумму для ФИКСИРОВАННОГО типа финансирования.'));
                    params.status_sysname = (paid_amount === +daily_payment.pending_amount)? 'PAID' : 'PARTIAL_PAID';

                    break;
                case 'PERCENT':
                    if(paid_amount === 0) return cb(new UserError('Необходимо указать сумму поступившую с процессинга'));

                    params.status_sysname = (partial_paid)? 'PARTIAL_PAID' : 'PAID';

//                    if ((paid_amount < +daily_payment.pending_amount * 50 / 100) && !obj.confirm && !partial_paid){
//                        return cb(new UserError('needConfirm', {
//                            message: 'Сумма платежа значительно меньше ожидаемой. Вы уверены что хотите проставить платеж как "Успешный"?<br><br>' +
//                            'Вы можете отметить платеж частично оплаченым, для этого отмените данную операцию, в поле "Ожидается" еще раз введите сумму и нажмите ' +
//                            '<div class="ct-custom-button" data-id="cb12"><i class="fa fa-times"></i><div class="ct-custom-button-placeholder">Пометить пропуск платежа</div></div>.',
//                            title: 'ПРЕДУПРЕЖДЕНИЕ',
//                            key: 1,
//                            confirmType: 'dialog',
//                            okBtnText: 'Отметить как "Успешный"'
//                        }));
//                    }

                    if (partial_paid && paid_amount >= +daily_payment.pending_amount) return cb(new UserError('Нельзя отметить платеж частично полаченым если сумма оплаты больше и равна ожидаемой. Отметьте как успешный.'));

                    break;
                default:
                    return cb(new UserError('Ошибка, у финансирования не указан тип (фикс/процент)'));
                    break;
            }


            if (params.status_sysname === 'PARTIAL_PAID'){
                default_amount = daily_payment.pending_amount - paid_amount;
                pending_body_amount = Math.round((+default_amount * 100 / (100 + financing.factoring_rate)) * 100) /100;
                pending_percent_amount = default_amount - pending_body_amount;
            }
            params.paid_amount = paid_amount;
            params.pending_body_amount = pending_body_amount;
            params.pending_percent_amount = pending_percent_amount;
            _t.modify(params, function (err, res) {
                if(err) return cb(new UserError('Не удалось обновить запись платежа', {err:err, params: params}));
                cb(null);
            });

            // ///////////////////////////////////////////////////////////////////////////////
            // if(daily_payment.financing_type_sysname === 'FIXED'){
            //
            //     if(paid_amount === 0){
            //         paid_amount = +daily_payment.pending_amount;
            //     }
            //
            //     if (paid_amount > daily_payment.pending_amount) return cb(new UserError('Сумма оплаты по процессингу не может привышать ожидаемую сумму для ФИКСИРОВАННОГО типа финансирования.'));
            //     params.status_sysname = (paid_amount === +daily_payment.pending_amount)? 'PAID' : 'PARTIAL_PAID';
            //
            //     if (params.status_sysname === 'PARTIAL_PAID'){
            //         pending_body_amount = Math.round((+paid_amount * 100 / (100 + financing.factoring_rate)) * 100) /100;
            //         pending_percent_amount = paid_amount - pending_body_amount;
            //     }
            //
            //
            //     // if(paid_amount === 0){
            //     //
            //     //     params.paid_amount = +daily_payment.pending_amount;
            //     //     params.status_sysname = 'PAID';
            //     //
            //     // }else{
            //     //
            //     //     params.paid_amount = paid_amount;
            //     //     params.status_sysname = (paid_amount === +daily_payment.pending_amount)? 'PAID' : 'PARTIAL_PAID';
            //     //
            //     // }
            //
            //     params.pending_body_amount = pending_body_amount;
            //     params.pending_percent_amount = pending_percent_amount;
            //     _t.modify(params, function (err, res) {
            //
            //         if(err) return cb(new UserError('Не удалось обновить запись платежа', {err:err, params: params}));
            //
            //         cb(null);
            //
            //     });
            //
            // }else if(daily_payment.financing_type_sysname == 'PERCENT'){
            //
            //     if(paid_amount == 0){
            //
            //         return cb(new UserError('Необходимо указать сумму поступившую с процессинга'));
            //
            //     }else{
            //
            //         params.paid_amount = paid_amount;
            //         params.status_sysname = 'PAID';
            //
            //     }
            //
            //     _t.modify(params, function (err, res) {
            //
            //         if(err) return cb(new UserError('Не удалось обновить запись платежа', {err:err, params: params}));
            //
            //         cb(null);
            //
            //     });
            //
            // }else{
            //     return cb(new UserError('Ошибка, у финансирования не указан тип (фикс/процент)'));
            // }

        },
        setStatistic:function(cb){
            var o = {
                command:'setStatistic',
                object:'daily_payments',
                params:{
                    id:daily_payment.daily_payments_id,
                    rollback_key:rollback_key
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось сохранить статистику дня',{o : o, err : err}));
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

Model.prototype.setDefault = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;

    var setDefaultCallback = cb;

    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();

    var paid_amount = +obj.paid_amount; // Может быть передано для частичной оплаты процентного платежа

    var daily_payment,financing;

    async.series({
        getDailyPayment: function (cb) {

            _t.getById({id:id}, function (err, res) {

                if(err) return cb(new UserError('Не удалось получить запись платежа', {err:err, id:id}));

                daily_payment = res[0];
                if (daily_payment.is_applied) return cb(new UserError('Эта запись уже применена и с ней нельзя совершать никакие операции.'));
                cb(null);
            });

        },
        checkToPartialPaidPercent:function(cb){
            // Если указана сумма и финансирование имеет тип ПРОЦЕНТ, то делаем частичную оплату вместо дефолта
            if (daily_payment.financing_type_sysname === 'PERCENT' && paid_amount){
                if (!obj.confirm){
                    return cb(new UserError('needConfirm', {
                        message: 'Вы указали сумму платежа и платеж будет отмечен как "Частично оплачен". <br><br>Если Вы хотите просто отметить платеж пропущенным, не указывайте сумму платежа.',
                        title: 'ПРЕДУПРЕЖДЕНИЕ',
                        key: 1,
                        confirmType: 'dialog',
                        okBtnText: 'Отметить как "Частичная оплата"'
                    }));
                }
                obj.partial_paid = true;
                return _t.setPaid(obj, setDefaultCallback);
            }
            cb(null);
        },
        getFinancing:function(cb){
            var o = {
                command:'getById',
                object:'merchant_financing',
                params:{
                    id:daily_payment.merchant_financing_id
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить финнансирование',{o : o, err : err}));
                financing = res[0];
                cb(null);
            });

        },
        modify: function (cb) {

            var pending_body_amount = Math.round((+daily_payment.pending_amount * 100 / (100 + financing.factoring_rate)) * 100) /100;
            var pending_percent_amount = daily_payment.pending_amount - pending_body_amount;

            var params = {
                id: id,
                paid_amount: 0,
                pending_body_amount:pending_body_amount,
                pending_percent_amount:pending_percent_amount,
                status_sysname: 'DEFAULT',
                closing_type_id: null,
                closing_date: null,
                default_date:daily_payment.daily_payments_date,
                rollback_key:rollback_key
            };

            _t.modify(params, function (err, res) {

                if(err) return cb(new UserError('Не удалось обновить запись платежа', {err:err, params: params}));

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

Model.prototype.setRemittance = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();

    var amount = +obj.amount;
    if (isNaN(amount)) return cb(new UserError('Сумма указана не корректно.'));
    if (!amount) return cb(new UserError('Не указана сумма'));

    var daily_payment_ids = obj.daily_payment_ids;
    if (!Array.isArray(daily_payment_ids)) return cb(new MyError('Не передан или передан не корректно массив с платежами для закрытия daily_payment_ids',{obj:obj}));
    if (obj.amount_split_type === 'PREPAID'){
        // Аванс - ложится в текущий платеж
        if (daily_payment_ids.indexOf(id) === -1) daily_payment_ids.push(id);
    }
    if (!daily_payment_ids.length) return cb(new UserError('Не указаны платежи для закрытия.'));

    var daily_payment;
    var daily_payment_ids_obj = {};
    var used_amount = 0;
    var oper_date;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить daily_paiment.',{id:id,err:err}));
                daily_payment = res[0];
                if (daily_payment.is_applied) return cb(new UserError('Эта запись уже применена и с ней нельзя совершать никакие операции.'));
                oper_date = daily_payment.daily_payments_date;
                // Установим need_close
                if (daily_payment_ids.indexOf(id) !== -1) {
                    daily_payment.need_close = true;
                }
                cb(null);
            });
        },
        getAnotherPayments:function(cb){
            var params = {
                where:[
                    {
                        key:'id',
                        type:'in',
                        val1:daily_payment_ids
                    },
                    {
                        key:'status_sysname',
                        type:'in',
                        val1:['DEFAULT','PARTIAL_PAID']
                    },
                    {
                        key:'merchant_financing_id',
                        val1:daily_payment.merchant_financing_id
                    }
                ],
                collapseData:false
            };
            _t.get(params, function(err, res){
                if (err) return cb(new MyError('не удалось получить массив платежей',{err:err, obj:obj}));
                if (res.length !== daily_payment_ids.length && obj.amount_split_type !== 'PREPAID') return cb(new UserError('Некоторые из отмеченых платежей более недоступны для закрытия. Обновите форму.',{daily_payment_ids:daily_payment_ids, res:res}))
                for (var i in res) {
                    if (res[i].id === id) continue; // Исключим текущий платеж. Его будем обрабатывать отдельно
                    daily_payment_ids_obj[res[i].id] = res[i];
                }
                cb(null);
            })
        },
        splitMoney:function(cb){
            var need_money, close_amount;

            var close_amount_residue;
            switch (obj.amount_split_type){
                case "SPLIT":
                    if (daily_payment.financing_type_sysname !== 'PERCENT') return cb(new UserError("Разделить сумму на все выбранные платежи можно только для ПРОЦЕНТНОГО типа финансирования."));
                    var p_count = (daily_payment.need_close)? 1 : 0;
                    p_count += Object.keys(daily_payment_ids_obj).length;
                    var p_counter = (daily_payment.need_close)? 1 : 0;

                    var p_amount = +amount;
                    need_money = amount;
                    var p_amount_last = +p_amount;
                    if (p_count > 1){
                        p_amount = Math.round((amount / p_count)*100)/100;
                        p_amount_last = amount - p_amount*(p_count - 1);
                    }

                    if(daily_payment.need_close){
                        amount -= +p_amount;
                        used_amount += +p_amount;
                        daily_payment.close_amount = p_amount;
                        daily_payment.close_status = 'PAID';
                        daily_payment.pending_body_amount_new = 0;
                        daily_payment.pending_percent_amount_new = 0;
                    }
                    for (var i0 in daily_payment_ids_obj) {
                        var pmnt0 = daily_payment_ids_obj[i0];
                        pmnt0.need_close = true;
                        if (++p_counter === p_count) p_amount = p_amount_last;
                        amount -= +p_amount;
                        used_amount += +p_amount;
                        pmnt0.close_amount = p_amount;
                        pmnt0.close_status = 'PAID';
                        pmnt0.pending_body_amount_new = 0;
                        pmnt0.pending_percent_amount_new = 0;
                    }
                    break;
                case "QUEUE":
                default:
                    var need_money_full = 0;
                    if(daily_payment.need_close){
                        need_money = +daily_payment.pending_body_amount + +daily_payment.pending_percent_amount;
                        need_money_full += +need_money;
                        daily_payment.need_close_amount = need_money;
                        if (amount < need_money && !obj.confirm){
                            return cb(new UserError('needConfirm', {
                                message: 'Указаной суммы недостаточно для полного закрытия текущего платежа.<br><br>' +
                                'Хотите оплатить частично?',
                                title: 'Оплатить текущий платеж частично?',
                                key: 1,
                                confirmType: 'dialog',
                                okBtnText: 'Отметить текущий платеж как "Частичная оплата"'
                            }));
                        }
                        close_amount =  (amount < need_money)? +amount : +need_money;
                        daily_payment.close_amount = close_amount;
                        daily_payment.close_status = (close_amount < need_money)? 'PARTIAL_PAID' : 'PAID';
                        amount -= close_amount;
                        used_amount += close_amount;
                        if (daily_payment.close_status === 'PARTIAL_PAID'){
                            // Вычислим откуда сколько снимаем денег (с тела платежи и с его процента)
                            if (+close_amount <= +daily_payment.pending_body_amount){
                                daily_payment.pending_body_amount_new = +daily_payment.pending_body_amount - close_amount;
                            }else{
                                close_amount_residue = +close_amount - +daily_payment.pending_body_amount;
                                daily_payment.pending_body_amount_new = 0;
                                daily_payment.pending_percent_amount_new = +daily_payment.pending_percent_amount - close_amount_residue;
                            }
                        }else{
                            daily_payment.pending_body_amount_new = 0;
                            daily_payment.pending_percent_amount_new = 0;
                        }
                    }
                    // Теперь пройдемся по остальным платежам

                    for (var i in daily_payment_ids_obj) {
                        if (amount === 0) break;
                        var pmnt = daily_payment_ids_obj[i];
                        need_money = +pmnt.pending_body_amount + +pmnt.pending_percent_amount;
                        need_money_full += +need_money;
                        pmnt.need_close = true;
                        pmnt.need_close_amount = need_money;
                        close_amount =  (amount < need_money)? +amount : +need_money;
                        pmnt.close_amount = close_amount;
                        pmnt.close_status = (close_amount < need_money)? 'PARTIAL_PAID' : 'PAID';
                        amount -= close_amount;
                        used_amount += close_amount;
                        if (pmnt.close_status === 'PARTIAL_PAID'){
                            // Вычислим откуда сколько снимаем денег (с тела платежи и с его процента)
                            if (+close_amount <= +pmnt.pending_body_amount){
                                pmnt.pending_body_amount_new = +pmnt.pending_body_amount - close_amount;
                            }else{
                                close_amount_residue = +close_amount - +pmnt.pending_body_amount;
                                pmnt.pending_body_amount_new = 0;
                                pmnt.pending_percent_amount_new = +pmnt.pending_percent_amount - close_amount_residue;
                            }
                        }else{
                            pmnt.pending_body_amount_new = 0;
                            pmnt.pending_percent_amount_new = 0;
                        }
                    }
                    break;
                case "PREPAID": // В этом случае в очереди тоько 1 платеж - текущий

                    // need_money = +daily_payment.pending_body_amount + +daily_payment.pending_percent_amount;
                    // need_money_full += +need_money;
                    // daily_payment.need_close_amount = need_money;
                    // if (amount < need_money && !obj.confirm){
                    //     return cb(new UserError('needConfirm', {
                    //         message: 'Указаной суммы недостаточно для полного закрытия текущего платежа.<br><br>' +
                    //         'Хотите оплатить частично?',
                    //         title: 'Оплатить текущий платеж частично?',
                    //         key: 1,
                    //         confirmType: 'dialog',
                    //         okBtnText: 'Отметить текущий платеж как "Частичная оплата"'
                    //     }));
                    // }
                    // close_amount =  (amount < need_money)? +amount : +need_money;
                    // daily_payment.close_amount = +amount;
                    // daily_payment.close_status = 'PAID';
                    // amount -= close_amount;
                    // used_amount += close_amount;
                    // if (daily_payment.close_status === 'PARTIAL_PAID'){
                    //     // Вычислим откуда сколько снимаем денег (с тела платежи и с его процента)
                    //     if (+close_amount <= +daily_payment.pending_body_amount){
                    //         daily_payment.pending_body_amount_new = +daily_payment.pending_body_amount - close_amount;
                    //     }else{
                    //         close_amount_residue = +close_amount - +daily_payment.pending_body_amount;
                    //         daily_payment.pending_body_amount_new = 0;
                    //         daily_payment.pending_percent_amount_new = +daily_payment.pending_percent_amount - close_amount_residue;
                    //     }
                    // }else{
                    //     daily_payment.pending_body_amount_new = 0;
                    //     daily_payment.pending_percent_amount_new = 0;
                    // }


                    for (var i in daily_payment_ids_obj) {
                        if (amount === 0) break;
                        var pmnt = daily_payment_ids_obj[i];
                        need_money = +pmnt.pending_body_amount + +pmnt.pending_percent_amount;
                        need_money_full += +need_money;
                        pmnt.need_close = true;
                        pmnt.need_close_amount = need_money;
                        close_amount =  (amount < need_money)? +amount : +need_money;
                        pmnt.close_amount = close_amount;
                        pmnt.close_status = (close_amount < need_money)? 'PARTIAL_PAID' : 'PAID';
                        amount -= close_amount;
                        used_amount += close_amount;
                        if (pmnt.close_status === 'PARTIAL_PAID'){
                            // Вычислим откуда сколько снимаем денег (с тела платежи и с его процента)
                            if (+close_amount <= +pmnt.pending_body_amount){
                                pmnt.pending_body_amount_new = +pmnt.pending_body_amount - close_amount;
                            }else{
                                close_amount_residue = +close_amount - +pmnt.pending_body_amount;
                                pmnt.pending_body_amount_new = 0;
                                pmnt.pending_percent_amount_new = +pmnt.pending_percent_amount - close_amount_residue;
                            }
                        }else{
                            pmnt.pending_body_amount_new = 0;
                            pmnt.pending_percent_amount_new = 0;
                        }
                    }

                    if (amount > 0){
                        used_amount += +amount;
                        daily_payment.need_close = true;
                        daily_payment.close_amount = +amount;
                        daily_payment.close_status = 'PAID';
                        daily_payment.pending_body_amount_new = 0;
                        daily_payment.pending_percent_amount_new = 0;
                        amount = 0;
                    }

                    break;
            }
            if (amount !== 0) return cb(new UserError('Указанная сумма превышает сумму, необходимую для закрытия выбранных платежей. <br>Остаток: ' + amount + '<br>' +
                'Сумма необходимая для закрытия:' + (+need_money_full || +need_money) + '<br><br>' +
                'Чтобы оплатить авансом используйте специальную функцию.'));
            if (amount < 0) {
                return cb(new MyError('Что-то пошло не так. Сумма распределена между платежами таким образом, что мы ушли в минус.', {
                    amount: amount,
                    daily_payment: daily_payment,
                    daily_payment_ids_obj: daily_payment_ids_obj
                }));
            }
            cb(null);
        },
        closeAnotherPayment:function(cb){
            async.eachSeries(daily_payment_ids_obj, function(payment, cb){
                if (!payment.need_close) return cb(null);
                async.series({
                    addPaidLater:function(cb){
                        var o = {
                            command:'add',
                            object:'daily_payment_paid_later',
                            params:{
                                daily_payment_id:daily_payment.id,
                                target_daily_payment_id:payment.id,
                                amount:+payment.close_amount,
                                rollback_key:rollback_key
                            }
                        };
                        _t.api(o, function (err, res) {
                            if (err) return cb(new MyError('Не удалось добавить daily_payment_paid_later',{o : o, err : err}));
                            cb(null);
                        });

                    },
                    updateDPayment:function(cb){
                        var params = {
                            id: payment.id,
                            closing_type_sysname: 'REMITTANCE',
                            status_sysname: payment.close_status,
                            paid_amount_later: +payment.paid_amount_later + +payment.close_amount,
                            // pending_body_amount: +payment.pending_body_amount_new || 0,
                            // pending_percent_amount: +payment.pending_percent_amount_new || 0,
                            // pending_body_amount_tmp: (payment.pending_body_amount_tmp)? payment.pending_body_amount_tmp : payment.pending_body_amount,
                            // pending_percent_amount_tmp: (payment.pending_percent_amount_tmp)? payment.pending_percent_amount_tmp : payment.pending_percent_amount,
                            closing_date: oper_date,

                            rollback_key: rollback_key
                        };
                        if (typeof payment.pending_body_amount_new !== 'undefined') {
                            params.pending_body_amount = +payment.pending_body_amount_new;
                            params.pending_body_amount_tmp = (payment.pending_body_amount_tmp)? payment.pending_body_amount_tmp : payment.pending_body_amount;
                        }
                        if (typeof payment.pending_percent_amount_new !== 'undefined') {
                            params.pending_percent_amount = +payment.pending_percent_amount_new;
                            params.pending_percent_amount_tmp = (payment.pending_percent_amount_tmp)? payment.pending_percent_amount_tmp : payment.pending_percent_amount;
                        }
                        _t.modify(params, function(err, res){
                            if (err) return cb(new MyError('Не удалось изменить ежедневный платеж',{params:params, err:err}));
                            cb(null);
                        });
                    }
                },cb);

            }, cb);
        },
        modifyThisPayment:function(cb){

            async.series({
                addPaidLater:function(cb){
                    if (!daily_payment.need_close) return cb(null);
                    var o = {
                        command:'add',
                        object:'daily_payment_paid_later',
                        params:{
                            daily_payment_id:daily_payment.id,
                            target_daily_payment_id:daily_payment.id,
                            amount:+daily_payment.close_amount,
                            rollback_key:rollback_key
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось добавить daily_payment_paid_later',{o : o, err : err}));
                        cb(null);
                    });

                },
                updateDPayment:function(cb){
                    var params = {
                        id: daily_payment.id,
                        default_paid_amount:+daily_payment.default_paid_amount + +used_amount,
                        rollback_key: rollback_key
                    };
                    if (daily_payment.need_close){
                        params.default_date = null;
                        params.closing_type_sysname = 'REMITTANCE';
                        params.status_sysname = daily_payment.close_status;
                        params.paid_amount_later = +daily_payment.paid_amount_later + +daily_payment.close_amount; // Если закрываем платеж тем же днем но по счету, то все равно проставляем "Оплачено позже"

                        if (typeof daily_payment.pending_body_amount_new !== 'undefined') {
                            params.pending_body_amount = +daily_payment.pending_body_amount_new;
                            params.pending_body_amount_tmp = (daily_payment.pending_body_amount_tmp)? daily_payment.pending_body_amount_tmp : daily_payment.pending_body_amount;
                        }
                        if (typeof daily_payment.pending_percent_amount_new !== 'undefined') {
                            params.pending_percent_amount = +daily_payment.pending_percent_amount_new;
                            params.pending_percent_amount_tmp = (daily_payment.pending_percent_amount_tmp)? daily_payment.pending_percent_amount_tmp : daily_payment.pending_percent_amount;
                        }
                        // params.pending_body_amount = +daily_payment.pending_body_amount_new || 0;
                        // params.pending_percent_amount = +daily_payment.pending_percent_amount_new || 0;
                        // params.pending_body_amount_tmp = (daily_payment.pending_body_amount_tmp)? daily_payment.pending_body_amount_tmp : daily_payment.pending_body_amount;
                        // params.pending_percent_amount_tmp = (daily_payment.pending_percent_amount_tmp)? daily_payment.pending_percent_amount_tmp : daily_payment.pending_percent_amount;
                        params.closing_date = oper_date;
                    }

                    _t.modify(params, function(err, res){
                        if (err) return cb(new MyError('Не удалось изменить текущий ежедневный платеж',{params:params, err:err}));
                        cb(null);
                    });
                }
            },cb);



        },
        cancelAllLinkedBills:function(cb){
            // Получить все счета относящиеся к этим платежам и аннулировать их:
            //// Получим все пары платеж - счет
            //// Поучить все счета по id из этих пар и со статусом EXPOSED
            //// Для каждого - аннулировать
            var invoices;
            var invoice_ids = [];
            async.series({
                getPairs:function(cb){
                    var o = {
                        command:'get',
                        object:'invoice_payment',
                        params:{
                            where:[
                                {
                                    key:'daily_payment_id',
                                    type:'in',
                                    val1:daily_payment_ids
                                }
                            ],
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить invoice_payments',{o : o, err : err}));

                        for (var i in res) {
                            if (invoice_ids.indexOf(res[i].invoice_id) !== -1) continue;
                            invoice_ids.push(res[i].invoice_id);
                        }
                        cb(null);
                    });
                },
                getInvoices:function(cb){
                    if (!invoice_ids.length) return cb(null);
                    var o = {
                        command:'get',
                        object:'invoice',
                        params:{
                            where:[
                                {
                                    key:'status_sysname',
                                    val1:'EXPOSED',
                                    group:'group1.OR'
                                },
                                {
                                    key:'id',
                                    type:'in',
                                    val1:invoice_ids,
                                    group:'group1.OR'
                                },
                                {
                                    key:'id',
                                    type:'in',
                                    val1:invoice_ids,
                                    group:'group2'
                                },
                                {
                                    key:'status_sysname',
                                    val1:'CREATED',
                                    group:'group2'
                                }
                            ],
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить счета',{o : o, err : err}));
                        if (!res.length) return cb(null);
                        invoices = res;
                        cb(null);
                    });
                },
                cancel:function(cb){
                    if (!invoices) return cb(null);
                    async.eachSeries(invoices, function(invoice, cb){
                        var o = {
                            command:'modify',
                            object:'invoice',
                            params:{
                                id:invoice.id,
                                status_sysname:'CANCELED',
                                closing_date:oper_date,
                                rollback_key:rollback_key
                            }
                        };
                        _t.api(o, function (err, res) {
                            if (err) return cb(new MyError('Не удалось аннулировать счета',{o : o, err : err}));

                            cb(null);
                        });
                    }, cb);
                }
            },cb);
        },
        setStatistic:function(cb){
            var o = {
                command:'setStatistic',
                object:'daily_payments',
                params:{
                    id:daily_payment.daily_payments_id,
                    rollback_key:rollback_key
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось сохранить статистику дня',{o : o, err : err}));
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
            if (!obj.doNotSaveRollback){
               rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'setRemittance', params:obj});
            }
            cb(null, new UserOk('Ок'));
        }
    });
};

Model.prototype.setStatistic = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();

    // получить текущий
    // Получить все пропущенные для финансирования


    var daily_payment;
    var default_payments;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function(err, res){
                if (err) return cb(new MyError('Не удалось получить платеж',{id:id}));
                daily_payment = res[0];
                cb(null);
            })
        },
        getDefaultPayments:function(cb){
            var o = {
                command:'get',
                object:'merchant_financing_payment',
                params:{
                    param_where:{
                        merchant_financing_id:daily_payment.merchant_financing_id,
                        status_sysname:'DEFAULT'
                    },
                    collapseData:false
                }
            };
            var params = {
                where:[
                    {
                        key:'daily_payments_id',
                        val1:daily_payment.daily_payments_id
                    },
                    {
                        key:'merchant_financing_id',
                        val1:daily_payment.merchant_financing_id
                    },
                    {
                        key:'status_sysname',
                        type:'in',
                        val1:['DEFAULT','PARTIAL_PAID']
                    }
                ],
                collapseData:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить пропущенные платежи',{o : o, err : err}));
                default_payments = res;
                cb(null);
            });
        },
        set:function(cb){
            var default_amount = 0;
            var default_payments_count = Object.keys(default_payments).length;
            for (var i in default_payments) {
                var pmnt = default_payments[i];
                default_amount += +pmnt.pending_amount - (pmnt.paid_amount || 0) - (+pmnt.paid_amount_later || 0);
            }
            var params = {
                id:id,
                default_count:default_payments_count,
                default_pending_amount:default_pending_amount,
                rollback_key:rollback_key,
                doNotSetStatistic:true
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
            cb(null, new UserOk('Ок'));
        }
    });
};



Model.prototype.apply = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();

    // if (id === 5632) return cb(null);

    var d_pmnt, m_pmnt;
    var merchant_financing;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить ежедневный платеж.',{id:id,err:err}));
                d_pmnt = res[0];
                cb(null);
            });
        },
        getPayment:function(cb){
            var o = {
                command:'getById',
                object:'merchant_financing_payment',
                params:{
                    id:d_pmnt.merchant_financing_payment_id
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить merchant_financing_payment',{o : o, err : err}));
                m_pmnt = res[0];
                cb(null);
            });

        },

        makePayment:function(cb){
            if (d_pmnt.status_sysname !== 'PAID' && d_pmnt.status_sysname !== 'PARTIAL_PAID') return cb(null);
            var paid_amount_later = 0;
            async.series({
                getPaidLater:function(cb){
                    // Запросим все оплаты для этого платежа совершенные им же
                    var o = {
                        command:'get',
                        object:'daily_payment_paid_later',
                        params:{
                            param_where:{
                                daily_payment_id:d_pmnt.id,
                                target_daily_payment_id:d_pmnt.id
                            },
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить daily_payment_paid_later для подсчета',{o : o, err : err}));
                        for (var i in res) {
                            paid_amount_later += res[i].amount;
                        }
                        cb(null);
                    });
                },
                makePayment:function(cb){
                    // var paid_amount = +d_pmnt.paid_amount + +d_pmnt.paid_amount_later;
                    var paid_amount = +d_pmnt.paid_amount + +paid_amount_later;
                    if (paid_amount === 0) return cb(null); // Платеж не был оплачен по эквайрингу и не был оплачен по счету (сам себя)
                    var o = {
                        command:'makePayment',
                        object:'merchant_financing_payment',
                        params:{
                            id:d_pmnt.merchant_financing_payment_id,
                            payment_date:d_pmnt.daily_payments_date,
                            closing_type_sysname:d_pmnt.closing_type_sysname,
                            status_sysname:d_pmnt.status_sysname,
                            amount:paid_amount,
                            paid_amount_processing:+d_pmnt.paid_amount,
                            paid_amount_later:+d_pmnt.paid_amount_later,
                            // doNotSetStatistic:obj.doNotSetStatistic,
                            doNotSaveRollback:obj.doNotSaveRollback,
                            rollback_key:rollback_key
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось проставить платеж оплаченым',{o : o, err : err}));
                        cb(null);
                    });
                }
            },cb);

        },
        makeDefault:function(cb){
            if (d_pmnt.status_sysname !== 'DEFAULT') return cb(null);
            var o = {
                command:'makeDefault',
                object:'merchant_financing_payment',
                params:{
                    id:d_pmnt.merchant_financing_payment_id,
                    payment_date:d_pmnt.daily_payments_date,
                    doNotSetStatistic:obj.doNotSetStatistic,
                    doNotSaveRollback:obj.doNotSaveRollback,
                    rollback_key:rollback_key
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось проставить платеж пропущенным',{o : o, err : err}));
                cb(null);
            });
        },
        closePrevDefaultPayment:function(cb){
            if (!d_pmnt.default_paid_amount) return cb(null);

            var paid_later_pmts = {};
            var paid_later_pmts_ids = [];
            var another_daily_payment;
            async.series({
                getPaidLater:function(cb){
                    // Запросить все оплаты совершенные текищим платежом, кроме оплат себе же
                    // сколапсим по сумме
                    var o = {
                        command:'get',
                        object:'daily_payment_paid_later',
                        params:{
                            where:[
                                {
                                    key:'daily_payment_id',
                                    val1:d_pmnt.id
                                },
                                {
                                    key:'target_daily_payment_id',
                                    type:'<>',
                                    val1:d_pmnt.id
                                }
                            ],
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить daily_payment_paid_later',{o : o, err : err}));
                        for (var i in res) {
                            if (paid_later_pmts_ids.indexOf(res[i].target_daily_payment_id) === -1) paid_later_pmts_ids.push(res[i].target_daily_payment_id);
                            if (!paid_later_pmts[res[i].target_daily_payment_id]) {
                                paid_later_pmts[res[i].target_daily_payment_id] = {
                                    target_daily_payment_id:res[i].target_daily_payment_id,
                                    amount:0
                                };
                            }
                            paid_later_pmts[res[i].target_daily_payment_id].amount += +res[i].amount;
                        }
                        cb(null);
                    });
                },
                getDailyPayment:function(cb){
                    if (!paid_later_pmts_ids.length) return cb(null);
                    var params = {
                        where:[
                            {
                                key:'id',
                                type:'in',
                                val1:paid_later_pmts_ids
                            }
                        ],
                        sort: {
                            columns: 'daily_payments_date',
                            direction: 'ASC'
                        },
                        collapseData:false
                    };
                    _t.get(params, function(err, res){
                        if (err) return cb(new MyError('Не удалось получить daily_payment по paid_later_pmts_ids',{params:params, err:err}));
                        another_daily_payment = res;
                        cb(null);
                    });
                },
                makepayment:function(cb){
                    if (!another_daily_payment) return cb(null);
                    async.eachSeries(another_daily_payment, function(payment, cb){
                        var paid_amount_later = +paid_later_pmts[payment.id].amount;
                        var o = {
                            command:'makePayment',
                            object:'merchant_financing_payment',
                            params:{
                                id:payment.merchant_financing_payment_id,
                                payment_date:payment.closing_date,
                                closing_type_sysname:payment.closing_type_sysname,
                                status_sysname:payment.status_sysname,
                                paid_amount_later:+payment.paid_amount_later || paid_amount_later,
                                amount:paid_amount_later,
                                // doNotSetStatistic:obj.doNotSetStatistic,
                                doNotSaveRollback:obj.doNotSaveRollback,
                                rollback_key:rollback_key
                            }
                        };
                        _t.api(o, function (err, res) {
                            if (err) return cb(new MyError('Не удалось проставить платеж оплаченым позже по счету',{o : o, err : err}));
                            cb(null);
                        });
                    }, cb);
                }
            },cb);

        },
        // closePrevDefaultPayment:function(cb){
        //     if (!d_pmnt.default_paid_amount) return cb(null);
        //     var params;
        //
        //     // Получить всех кто оплачен ткущей датой, но не привязан к текущей дате / То же финансирование
        //     // Для каждого вызвать makePayment с датой и суммой
        //     params = {
        //         where:[
        //             {
        //                 key:'merchant_financing_id',
        //                 val1:d_pmnt.merchant_financing_id
        //             },
        //             {
        //                 key:'daily_payments_id',
        //                 type:'<>',
        //                 val1:d_pmnt.daily_payments_id
        //             },
        //             {
        //                 key:'closing_date',
        //                 val1:d_pmnt.daily_payments_date
        //             }
        //
        //         ],
        //         collapseData:false
        //     };
        //     _t.get(params, function(err, res){
        //         if (err) return cb(new MyError('не удалось получить фиксированные платежи закрытые счетом',{err:err, params:params}));
        //         async.eachSeries(res, function(payment, cb){
        //             // Для каждого вызвать makePayment с датой и суммой
        //             var paid_amount_later = 0;
        //             async.series({
        //                 getPaidLater:function(cb){
        //                     // Запросим все оплаты для этого платежа (payment) совершенные текущим платежом (d_pmnt)
        //                     var o = {
        //                         command:'get',
        //                         object:'daily_payment_paid_later',
        //                         params:{
        //                             param_where:{
        //                                 daily_payment_id:d_pmnt.id,
        //                                 target_daily_payment_id:payment.id
        //                             },
        //                             collapseData:false
        //                         }
        //                     };
        //                     _t.api(o, function (err, res) {
        //                         if (err) return cb(new MyError('Не удалось получить daily_payment_paid_later для подсчета',{o : o, err : err}));
        //                         for (var i in res) {
        //                             paid_amount_later += res[i].amount;
        //                         }
        //                         cb(null);
        //                     });
        //                 },
        //                 makePayment:function(cb){
        //                     // var paid_amount = +d_pmnt.paid_amount + +d_pmnt.paid_amount_later;
        //                     var o = {
        //                         command:'makePayment',
        //                         object:'merchant_financing_payment',
        //                         params:{
        //                             id:payment.merchant_financing_payment_id,
        //                             payment_date:payment.closing_date,
        //                             closing_type_sysname:payment.closing_type_sysname,
        //                             status_sysname:payment.status_sysname,
        //                             paid_amount_later:+payment.paid_amount_later || paid_amount_later,
        //                             amount:paid_amount_later,
        //                             doNotSetStatistic:obj.doNotSetStatistic,
        //                             doNotSaveRollback:obj.doNotSaveRollback,
        //                             rollback_key:rollback_key
        //                         }
        //                     };
        //                     _t.api(o, function (err, res) {
        //                         if (err) return cb(new MyError('Не удалось проставить платеж оплаченым позже по счету',{o : o, err : err}));
        //                         cb(null);
        //                     });
        //                 }
        //             },cb);
        //
        //         }, cb);
        //     });
        //
        //
        // },
        // setStatistic: function (cb) {
        //     // if (obj.doNotSetStatistic) return cb(null);
        //     var o = {
        //         command:'setStatisticInfo',
        //         object:'merchant_financing_calendar',
        //         params:{
        //             id:m_pmnt.calendar_id,
        //             rollback_key:rollback_key
        //         }
        //     };
        //     _t.api(o, function (err, res) {
        //         if (err) return cb(new MyError('Не удалось установить информацию по платежам.',{err:err}));
        //         cb(null);
        //     })
        // },

        setApplied:function(cb){
            var params = {
                id:id,
                is_applied:true,
                rollback_key:rollback_key
            };
            _t.modify(params, function(err){
                if (err) return cb(new MyError('Не удалось установить ежедневный платеж примененным',{err:err, params:params}));
                cb(null);
            })
        },
        closeIfAllReturned:function(cb){
            async.series({
                getFin:function(cb){
                    var o = {
                        command:'getById',
                        object:'merchant_financing',
                        params:{
                            id:d_pmnt.merchant_financing_id
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить финансирование',{o : o, err : err}));
                        merchant_financing = res[0];
                        cb(null);
                    });
                },
                closeFinancing: function (cb) {
                    // if (calendar.status_sysname!='CLOSED') return cb(null);
                    if (merchant_financing.to_return > 0) return cb(null);
                    var o = {
                        command:'closeFinancing',
                        object:'merchant_financing',
                        params:{
                            id:merchant_financing.id,
                            closing_type_sysname:d_pmnt.closing_type_sysname || 'BY_PROCESSING',
                            operation_date:d_pmnt.daily_payments_date,
                            rollback_key:rollback_key,
                            doNotSetStatistic:true,
                            doNotSaveRollback:true
                        }
                    };
                    _t.api(o, function (err) {
                        if (err) return cb(new MyError('Не удалось закрыть финансирование.',{err:err}));
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
                rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'apply', params:obj});
            }
            cb(null, new UserOk('Ок'));
        }
    });
};

Model.prototype.cancelProcessingAction = function (obj, cb) {
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
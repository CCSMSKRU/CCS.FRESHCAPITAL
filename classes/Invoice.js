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
var Mustache = require('mustache');
var moment = require('moment');
var pdfkit = require('pdfkit');
var fs = require('fs');
var XlsxTemplate = require('xlsx-template');
var rubles = require('rubles').rubles;

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

Model.prototype.billout = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var rollback_key = obj.rollback_key || rollback.create();
    var type = obj.type;
    var types = ['THIS','FULL','THIS_AND_FULL','FULL_ARBITRARY'];
    if (types.indexOf(type)===-1)return cb(new MyError('Не корректно передано поле type',{types:types, obj:obj}));
    var daily_payment_id = obj.daily_payment_id;
    if (isNaN(+daily_payment_id)) return cb(new MyError('Не корректно передан daily_payment_id',{obj:obj}));

    // Создаем
    // Создаем связь платеж-счет (или много платежей)

    if (type === 'THIS_AND_FULL'){
        obj.rollback_key = rollback_key;
        async.series({
            bill_this:function(cb){
                obj.type = 'THIS';
                _t.billout(obj,cb);
            },
            bill_full:function(cb){
                obj.type = 'FULL';
                _t.billout(obj,cb);
            }
        },function(err, res){
            if (err) {
                if (err.message == 'needConfirm') return cb(err);
                rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                    return cb(err, err2);
                });
            } else {
                cb(null, new UserOk('Ок'));
            }
        });
        return;
    }




    var daily_payment,financing;
    var invoice_amount = 0;
    var default_payments;
    var id;

    var pending_body_amount = 0;
    var pending_percent_amount = 0;


    async.series({
        getPayment:function(cb){
            var o = {
                command:'getById',
                object:'daily_payment',
                params:{
                    id:daily_payment_id,
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить платеж',{o : o, err : err}));
                daily_payment = res[0];
                pending_body_amount += +daily_payment.pending_body_amount;
                pending_percent_amount += +daily_payment.pending_percent_amount;
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
        getDefaultPayments:function(cb){
            if (type !=='FULL') return cb(null);
            // Получим все, только для FULL
            var o = {
                command:'get',
                object:'daily_payment',
                params:{
                    where:[
                        {
                            key:'merchant_financing_id',
                            val1:daily_payment.merchant_financing_id
                        },
                        {
                            key:'is_applied',
                            val1:true
                        },
                        {
                            key:'status_sysname',
                            type:'in',
                            val1:['DEFAULT','PARTIAL_PAID']
                        }
                    ],
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить пропущенные платежи',{o : o, err : err}));
                default_payments = res;
                for (var i in default_payments) {
                    var pmnt = default_payments[i];
                    if (pmnt.id === daily_payment.id) continue;
                    pending_body_amount += +pmnt.pending_body_amount;
                    pending_percent_amount += +pmnt.pending_percent_amount;
                }
                cb(null);
            });

        },
        checkAndSetAmount:function(cb){
            // if (type == full)
            invoice_amount = (type === 'FULL')? +obj.full_amount : +obj.amount;
            if (pending_body_amount + pending_percent_amount > invoice_amount && daily_payment.financing_type_sysname === 'FIXED' && type!=='FULL_ARBITRARY'){
                return cb(new UserError('Указанная Вами сумма больше суммы задолженности.'));
            }
            if (invoice_amount){
                // Разобьем сумму на тело и процент
                pending_body_amount = Math.round((+invoice_amount * 100 / (100 + financing.factoring_rate)) * 100) /100;
                pending_percent_amount = invoice_amount - pending_body_amount;
            }
            cb(null);
        },
        billWithoutNDS:function(cb){
            var invoice_id;
            async.series({
                bill:function(cb){
                    var params = {
                        daily_payments_id:daily_payment.daily_payments_id,
                        merchant_financing_id:daily_payment.merchant_financing_id,
                        amount:pending_body_amount,
                        invoice_type_sysname:'WITHOUT_NDS',
                        invoice_date:daily_payment.daily_payments_date
                    };
                    _t.add(params, function(err, res){
                        if (err) return cb (new MyError('Не удалось создать счет WITHOUT_NDS',{err:err,params:params}));
                        invoice_id = res.id;
                        cb(null);
                    });
                },
                createInvoicePayment:function(cb){
                    async.series({
                        createCurrent:function(cb){
                            var o = {
                                command:'add',
                                object:'invoice_payment',
                                params:{
                                    invoice_id:invoice_id,
                                    daily_payment_id:daily_payment_id,
                                    is_main:true,
                                    rollback_key:rollback_key
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось создать пару платеж счет',{o : o, err : err}));

                                cb(null);
                            });

                        },
                        createAnother:function(cb){
                            if (type !== 'FULL') return cb(null);
                            var pmnt_ids = [];
                            for (var i in default_payments) {
                                pmnt_ids.push(default_payments[i].id);
                            }
                            if (!pmnt_ids.length) return cb(null);
                            var o = {
                                command:'get',
                                object:'daily_payment',
                                params:{
                                    where:[
                                        {
                                            key:'id',
                                            type:'in',
                                            val1:pmnt_ids
                                        }
                                    ],
                                    collapseData:false
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось получить ежедневные платежи по просто платежам',{o : o, err : err}));
                                async.eachSeries(res, function(one_pmnt, cb){
                                    var o = {
                                        command:'add',
                                        object:'invoice_payment',
                                        params:{
                                            invoice_id:invoice_id,
                                            daily_payment_id:one_pmnt.id,
                                            rollback_key:rollback_key
                                        }
                                    };
                                    _t.api(o, function (err, res) {
                                        if (err) return cb(new MyError('Не удалось создать пару платеж счет',{o : o, err : err}));
                                        cb(null);
                                    });
                                }, cb);
                            });
                        }
                    },cb);
                }
            },cb);
        },
        billWithNDS:function(cb){
            var invoice_id;
            async.series({
                bill:function(cb){
                    var params = {
                        daily_payments_id:daily_payment.daily_payments_id,
                        merchant_financing_id:daily_payment.merchant_financing_id,
                        amount:pending_percent_amount,
                        invoice_type_sysname:'WITH_NDS',
                        invoice_date:daily_payment.daily_payments_date
                    };
                    _t.add(params, function(err, res){
                        if (err) return cb (new MyError('Не удалось создать счет WITHOUT_NDS',{err:err,params:params}));
                        invoice_id = res.id;
                        cb(null);
                    });
                },
                createInvoicePayment:function(cb){
                    async.series({
                        createCurrent:function(cb){
                            var o = {
                                command:'add',
                                object:'invoice_payment',
                                params:{
                                    invoice_id:invoice_id,
                                    daily_payment_id:daily_payment_id,
                                    is_main:true,
                                    rollback_key:rollback_key
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось создать пару платеж счет',{o : o, err : err}));

                                cb(null);
                            });

                        },
                        createAnother:function(cb){
                            if (type !== 'FULL') return cb(null);
                            var pmnt_ids = [];
                            for (var i in default_payments) {
                                pmnt_ids.push(default_payments[i].id);
                            }
                            if (!pmnt_ids.length) return cb(null);
                            var o = {
                                command:'get',
                                object:'daily_payment',
                                params:{
                                    where:[
                                        {
                                            key:'id',
                                            type:'in',
                                            val1:pmnt_ids
                                        }
                                    ],
                                    collapseData:false
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось получить ежедневные платежи по просто платежам',{o : o, err : err}));
                                async.eachSeries(res, function(one_pmnt, cb){
                                    var o = {
                                        command:'add',
                                        object:'invoice_payment',
                                        params:{
                                            invoice_id:invoice_id,
                                            daily_payment_id:one_pmnt.id,
                                            rollback_key:rollback_key
                                        }
                                    };
                                    _t.api(o, function (err, res) {
                                        if (err) return cb(new MyError('Не удалось создать пару платеж счет',{o : o, err : err}));
                                        cb(null);
                                    });
                                }, cb);
                            });
                        }
                    },cb);
                }
            },cb);
        }
        // bill:function(cb){
        //     if (type !== 'FULL'){
        //         invoice_amount += daily_payment.pending_amount;
        //     }
        //     invoice_amount = +obj.this_amount || +obj.full_amount || invoice_amount;
        //
        //     if (daily_payment.financing_type_sysname === 'PERCENT'){
        //         switch (type){
        //             case 'FULL':
        //                 if (!obj.full_amount || isNaN(+obj.full_amount) || obj.full_amount <= 0) return cb(new UserError('Некорректно указана сумма для счета на все пропущенные.'));
        //                 invoice_amount = obj.full_amount;
        //                 break;
        //             default:
        //                 if (!obj.amount || isNaN(+obj.amount) || obj.amount <= 0) return cb(new UserError('Некорректно указана сумма для счета на данный пропущенный платеж.'));
        //                 invoice_amount = obj.amount;
        //                 break;
        //         }
        //     }
        //
        //
        //     var params = {
        //         daily_payments_id:daily_payment.daily_payments_id,
        //         merchant_financing_id:daily_payment.merchant_financing_id,
        //         amount:invoice_amount,
        //         invoice_date:daily_payment.daily_payments_date
        //     };
        //     _t.add(params, function(err, res){
        //         if (err) return cb (new MyError('Не удалось создать счет',{err:err,params:params}));
        //         id = res.id;
        //         cb(null);
        //     });
        // },
        // createInvoicePayment:function(cb){
        //     async.series({
        //         createCurrent:function(cb){
        //             var o = {
        //                 command:'add',
        //                 object:'invoice_payment',
        //                 params:{
        //                     invoice_id:id,
        //                     daily_payment_id:daily_payment_id,
        //                     is_main:true,
        //                     rollback_key:rollback_key
        //                 }
        //             };
        //             _t.api(o, function (err, res) {
        //                 if (err) return cb(new MyError('Не удалось создать пару платеж счет',{o : o, err : err}));
        //
        //                 cb(null);
        //             });
        //
        //         },
        //         createAnother:function(cb){
        //             if (type !== 'FULL') return cb(null);
        //             var pmnt_ids = [];
        //             for (var i in default_payments) {
        //                 pmnt_ids.push(default_payments[i].id);
        //             }
        //             if (!pmnt_ids.length) return cb(null);
        //             var o = {
        //                 command:'get',
        //                 object:'daily_payment',
        //                 params:{
        //                     where:[
        //                         {
        //                             key:'id',
        //                             type:'in',
        //                             val1:pmnt_ids
        //                         }
        //                     ],
        //                     collapseData:false
        //                 }
        //             };
        //             _t.api(o, function (err, res) {
        //                 if (err) return cb(new MyError('Не удалось получить ежедневные платежи по просто платежам',{o : o, err : err}));
        //                 async.eachSeries(res, function(one_pmnt, cb){
        //                     var o = {
        //                         command:'add',
        //                         object:'invoice_payment',
        //                         params:{
        //                             invoice_id:id,
        //                             daily_payment_id:one_pmnt.id,
        //                             rollback_key:rollback_key
        //                         }
        //                     };
        //                     _t.api(o, function (err, res) {
        //                         if (err) return cb(new MyError('Не удалось создать пару платеж счет',{o : o, err : err}));
        //                         cb(null);
        //                     });
        //                 }, cb);
        //             });
        //         }
        //     },cb);
        // }

    },function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            //if (!obj.doNotSaveRollback){
            //    rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'billout', params:obj});
            //}
            cb(null, new UserOk('Ок'));
        }
    });
};

Model.prototype.billoutNow = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();

    var invoice;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить счет.',{id:id,err:err}));
                invoice = res[0];
                cb(null);
            });
        },
        billout:function(cb){
            if (invoice.status_sysname !== 'CREATED') return cb(new UserError('Данный счет нельзя выставить.'));
            var params = {
                id:invoice.id,
                status_sysname:'EXPOSED',
                rollback_key:rollback_key
            };
            _t.modify(params, function(err, res){
                if (err) return cb(err);
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
            cb(null, new UserOk('Счет выставлен.'));
        }
    });
};

// var o = {
//     command:'close_bill',
//     object:'Invoice',
//     params:{
//         id:63,
//         operation_date:'22.05.2017'
//     }
// };
// socketQuery(o, function(r){
//     console.log(r);
// });

Model.prototype.closeBill = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    var daily_payment_id = obj.daily_payment_id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    if (isNaN(+daily_payment_id)) return cb(new MyError('Не передан daily_payment_id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    var oper_date = obj.operation_date;
    if (!moment(oper_date, 'DD.MM.YYYY').isValid()) return cb(new UserError('Не корректно передана дата операции.',{format:'DD.MM.YYYY'}));
    // Получить счет
    // Получить платежи для закрытия
    // Получить другие счета по платежам
    // Вернуть клиенту информацию для подтверждения
    // Закрыть платежи по счету
    // Закрыть счет
    // Аннулировать остальные счета
    var bill;
    var payments;
    var cancel_bills = [];
    var pmnt_ids = [];
    var daily_payment_list = [];
    var main_daily_payment;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function(err, res){
                if (err) return cb(new MyError('Не удалось получить счет',{err:err, id:id}));
                bill = res[0];
                switch (bill.status_sysname){
                    case 'EXPOSED':
                        cb(null);
                        break;
                    case 'CREATED':
                        return cb(new UserError('Этот счет еще не подтвержден.'));
                        break;
                    case 'CLOSED':
                        return cb(new UserError('Этот счет уже закрыт.'));
                        break;
                    case 'CANCELED':
                        return cb(new UserError('Этот счет аннулирован.'));
                        break;
                    default:
                        return cb(new UserError('Счет имеет не корректный статус.'));
                        break;
                }
            });
        },
        getMainDailyPayment:function(cb){
            var o = {
                command:'get',
                object:'daily_payment',
                params:{
                    param_where:{
                        merchant_financing_id:bill.merchant_financing_id,
                        daily_payments_date:oper_date
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить основной платеж',{o : o, err : err}));
                if (!res.length) return cb(new MyError('Не найден ежедневный платеж',{o:o, res:res}));
                if (res.length > 1) return cb(new MyError('Слишком много найдено. ежедневный платеж',{o:o, res:res}));
                main_daily_payment = res[0];
                if (main_daily_payment.is_applied) return cb(new UserError('Эта запись уже применена и с ней нельзя совершать никакие операции.'));
                cb(null);
            });

        },
        getPayments:function(cb){
            var o = {
                command:'get',
                object:'invoice_payment',
                params:{
                    where:[
                        {
                            key:'invoice_id',
                            val1:id
                        }
                        ,
                        {
                            key:'daily_payment_status_sysname',
                            type:'in',
                            val1:['DEFAULT','PARTIAL_PAID']
                        }
                    ],
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить платежи для закрытия',{o : o, err : err}));
                payments = res;
                cb(null);
            });
        },
        getBillsToCancel:function(cb){

            for (var i in payments) {
                pmnt_ids.push(payments[i].daily_payment_id);
            }
            if (!pmnt_ids.length) return cb(null);
            // Получим все пары платежи-счета где используются эти платежи
            var cancel_bill_ids = [];
            async.series({
                getPair:function(cb){
                    var o = {
                        command:'get',
                        object:'invoice_payment',
                        params:{
                            where:[
                                {
                                    key:'invoice_id',
                                    type:'<>',
                                    val1:id
                                },
                                {
                                    key:'invoice_type_sysname',
                                    val1:bill.invoice_type_sysname
                                },
                                {
                                    key:'daily_payment_id',
                                    type:'in',
                                    val1:pmnt_ids
                                }
                            ],
                            collapseData:false
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить пары счет-платеж для заданных платежей',{o : o, err : err}));
                        for (var i in res) {
                            cancel_bill_ids.push(res[i].invoice_id);
                        }
                        cb(null);
                    });
                },
                getBills:function(cb){
                    if (!cancel_bill_ids.length) return cb(null);
                    var params = {
                        where:[
                            {
                                key:'id',
                                type:'in',
                                val1:cancel_bill_ids
                            },
                            {
                                key:'status_sysname',
                                val1:'EXPOSED'
                            }
                        ],
                        collapseData:false
                    };
                    _t.get(params, function(err, res){
                        if (err) return cb(new MyError('Не удалось получить счета для аннулирования'));
                        cancel_bills = res;
                        cb(null);
                    })
                }
            },cb);
        },
        getPaymentList: function (cb) {
            if (!pmnt_ids.length) return cb(null);

            var o = {
                command:'get',
                object:'daily_payment',
                params:{
                    where:[
                        {
                            key:'id',
                            type:'in',
                            val1:pmnt_ids
                        }
                    ],
                    collapseData:false
                }
            };



            _t.api(o, function (err, res) {

                if (err) return cb(new MyError('Не удалось получить пары счет-платеж для заданных платежей',{o : o, err : err}));
                for (var i in res) {
                    for (var j in payments) {
                        if (res[i].id == payments[j].daily_payment_id){
                            payments[j].daily_payment = res[i];
                            break;
                        }
                    }
                }
                daily_payment_list = res;

                cb(null);
            });

        },
        sendConfirm:function(cb){
            console.log(cancel_bills,bill,payments);

            if (obj.confirm) return cb(null);

            var inv = {
                prepareData: function () {
                    var bills;

                    if(!Array.isArray(bill)){
                        bills = [bill];
                    }else{
                        bills = bill;
                    }

                    for(var i in bills){
                        var b = bills[i];

                        inv.data.bills.push({
                            id: b.id,
                            number: b.id,
                            date: b.invoice_date,
                            amount: b.amount
                        });
                    }

                    for(var i2 in cancel_bills){
                        var b2 = cancel_bills[i2];

                        inv.data.cancel_bills.push({
                            id: b2.id,
                            number: b2.id,
                            date: b2.invoice_date,
                            amount: b2.amount
                        });
                    }

                    console.log('PAYMENTSpaymentspayments',daily_payment_list);

                    for(var i3 in daily_payment_list){
                        var p = daily_payment_list[i3];

                        inv.data.payments.push({
                            id: p.id,
                            date: p.daily_payments_date,
                            amount: p.pending_amount
                        });
                    }

                },
                data: {
                    operation_date: oper_date,
                    bills:[],
                    cancel_bills:[],
                    payments:[]
                },
                tpl:'<div class="server-dialog"><div class="invoice-header">Датой {{operation_date}} будут закрыты счета:</div>' +
                    '<div class="invoice-list-box">' +
                        '<div class="invoice-list">' +
                        '{{#bills}}' +
                        '<div class="inv-item-box" data-id="{{id}}">' +
                            '<div class="inv-item-header">' +
                                '<div class="inv-item-title">Счёт №{{number}} от {{date}} на сумму {{amount}} руб.</div>' +
                            '</div>' +
                        '</div>' +
                        '{{/bills}}' +
                        '</div>' +
                    '</div>' +
                    '<div class="invoice-header">Будут аннулированы счета:</div>' +
                        '<div class="invoice-list-box">' +
                        '<div class="invoice-list">' +
                        '{{#cancel_bills}}' +
                        '<div class="inv-item-box" data-id="{{id}}">' +
                            '<div class="inv-item-header">' +
                                '<div class="inv-item-title">Счёт №{{number}} от {{date}} на сумму {{amount}} руб.</div>' +
                            '</div>' +
                        '</div>' +
                        '{{/cancel_bills}}' +
                        '</div>' +
                    '</div>' +
                    '<div class="invoice-header">Будут закрыты платежи:</div>' +
                    '<div class="invoice-list-box">' +
                        '<div class="invoice-list">' +
                        '{{#payments}}' +
                        '<div class="inv-item-box" data-id="{{id}}">' +
                        '<div class="inv-item-header">' +
                        '<div class="inv-item-title">Платеж от {{date}} на сумму {{amount}} руб.</div>' +
                        '</div>' +
                        '</div>' +
                        '{{/payments}}' +
                        '</div>' +
                    '</div></div>'

            };



            inv.prepareData();
            var msg = Mustache.to_html(inv.tpl,inv.data);

            return cb(new UserError('needConfirm',{
                title:'Закрытие счета.',
                msg: msg,
                confirmType: 'dialog',
                okBtnText: 'Подтвердить',
                cancelBtnText: 'Отмена',
                cancelMsg: 'Отменено.'
            }));
        },
        closePayments:function(cb){
            var arr = [];
            async.eachSeries(payments, function(payment, cb){
                if (arr.indexOf(payment.daily_payment_id) !== -1) return cb(null);
                arr.push(payment.daily_payment_id);// Могут повторятся, поэтому запомним что уже закрывали. Не оч, но прокатит)
                if (['DEFAULT','PARTIAL_PAID'].indexOf(payment.daily_payment_status_sysname) === -1) return cb(new UserError('Один из закрываемых платежей не является пропущенным или частично оплаченым.',{payment:payment}));
                var new_paid_amount_later = 0;
                var paid_amount_later = 0;
                var tmp_key, tmp_val;
                if (bill.invoice_type_sysname === 'WITHOUT_NDS'){
                    new_paid_amount_later = +payment.daily_payment.paid_amount_later + +payment.daily_payment.pending_body_amount;
                    paid_amount_later = +payment.daily_payment.pending_body_amount;
                    tmp_key = 'pending_body_amount_tmp';
                    tmp_val = payment.daily_payment.pending_body_amount;
                    payment.daily_payment.pending_body_amount = 0;
                }else if(bill.invoice_type_sysname === 'WITH_NDS'){
                    new_paid_amount_later = +payment.daily_payment.paid_amount_later + +payment.daily_payment.pending_percent_amount;
                    paid_amount_later = +payment.daily_payment.pending_percent_amount;
                    tmp_key = 'pending_percent_amount_tmp';
                    tmp_val = payment.daily_payment.pending_percent_amount;
                    payment.daily_payment.pending_percent_amount = 0;
                }
                var status_sysname = (+payment.daily_payment.pending_body_amount + +payment.daily_payment.pending_percent_amount === 0)? 'PAID' : 'PARTIAL_PAID';


                async.series({
                    addPaidLater:function(cb){
                        var o = {
                            command:'add',
                            object:'daily_payment_paid_later',
                            params:{
                                daily_payment_id:main_daily_payment.id,
                                target_daily_payment_id:payment.daily_payment_id,
                                amount:+paid_amount_later,
                                rollback_key:rollback_key
                            }
                        };
                        _t.api(o, function (err, res) {
                            if (err) return cb(new MyError('Не удалось добавить daily_payment_paid_later',{o : o, err : err}));
                            cb(null);
                        });

                    },
                    updateDPayment:function(cb){
                        var o = {
                            command:'modify',
                            object:'daily_payment',
                            params:{
                                id:payment.daily_payment_id,
                                closing_type_sysname:'REMITTANCE',
                                status_sysname:status_sysname,
                                paid_amount_later:new_paid_amount_later,
                                pending_body_amount:+payment.daily_payment.pending_body_amount,
                                pending_percent_amount:+payment.daily_payment.pending_percent_amount,
                                closing_date:oper_date,

                                rollback_key:rollback_key
                            }
                        };
                        o.params[tmp_key] = payment.daily_payment[tmp_key] || tmp_val;
                        // if (payment.daily_payment.financing_type_sysname === 'FIXED'){
                        //     o.params.paid_amount_later = payment.daily_payment.pending_amount;
                        // }
                        _t.api(o, function (err, res) {
                            if (err) return cb(new MyError('Не удалось закрыть платежи',{o : o, err : err}));
                            cb(null);
                        });
                    }
                },cb);


            }, cb);
        },
        closeBill:function(cb){
            var params = {
                id:id,
                status_sysname:'CLOSED',
                closing_date:oper_date,
                rollback_key:rollback_key
            };
            _t.modify(params, function(err, res){
                if (err) return cb(new MyError('Не удалось закрыть счет',{err:err, params:params}));
                cb(null);
            });
        },
        cancelBills:function(cb){
            async.eachSeries(cancel_bills, function(one_bill, cb){
                var params = {
                    id:one_bill.id,
                    status_sysname:'CANCELED',
                    closing_date:oper_date,
                    rollback_key:rollback_key
                };
                _t.modify(params, function(err, res){
                    if (err) return cb(new MyError('Не удалось закрыть счет',{err:err, params:params}));
                    cb(null);
                });
            }, cb);
        },
        setDailyPaymentAmount:function(cb){
            var main_payment;
            async.series({
                getMainPayment:function(cb){
                    var o = {
                        command:'getById',
                        object:'daily_payment',
                        params:{
                            id:daily_payment_id
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить daily_payment',{o : o, err : err}));
                        if (res.length!==1) return cb(new MyError('не найден daily_payment по заданным параметрам или их слишком много.',{o:o, res:res}));
                        main_payment = res[0];
                        cb(null);
                    });

                },
                setAmount:function(cb){
                    var o = {
                        command:'modify',
                        object:'daily_payment',
                        params:{
                            id:daily_payment_id,
                            default_paid_amount:+main_payment.default_paid_amount + bill.amount,
                            rollback_key:rollback_key
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось установить сумму daily_payment',{o : o, err : err}));

                        cb(null);
                    });
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
               rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'close_bill', params:obj});
            }
            cb(null, new UserOk('Ок'));
        }
    });
};

// close_withot_bill
Model.prototype.closeWithoutBill = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var daily_payment_id = obj.daily_payment_id;
    // if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    if (isNaN(+daily_payment_id)) return cb(new MyError('Не передан daily_payment_id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();

    async.series({
        getDailyPayment:function(cb){

        }
    },function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!obj.doNotSaveRollback){
               rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'closeWithoutBill', params:obj});
            }
            cb(null, new UserOk('Ок'));
        }
    });

};

Model.prototype.downloadInvoice = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    var fin_id = obj.fin_id;

    var through_number = obj.through_number;

    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    if (isNaN(+fin_id)) return cb(new MyError('Не передан fin_id',{obj:obj}));

    var rollback_key = obj.rollback_key || rollback.create();

    var fin;
    var merchant;
    var invoice;
    var name = 'billout_tpl.xlsx';
    var template;
    var binaryData;
    var filename;
    var readyData;

    async.series({
        getFin: function(cb){

            var o = {
                command: 'get',
                object: 'merchant_financing',
                params: {
                    param_where: {
                        id: fin_id
                    },
                    collapseData: false
                }
            };

            _t.api(o, function(err,res){

                if(err) return cb(new UserError('Не удалось получить финансирование', {err:err,o:o}));

                fin = res[0];

                cb(null);

            });

        },
        getMerchant: function(cb){
            var o = {
                command: 'get',
                object: 'merchant',
                params: {
                    param_where: {
                        id: fin.merchant_id
                    },
                    collapseData: false
                }
            };

            _t.api(o, function(err,res){

                if(err) return cb(new UserError('Не удалось получить торговца', {err:err,o:o}));

                merchant = res[0];

                cb(null);

            });
        },
        getData: function(cb){

            var o = {
                command: 'get',
                object: 'invoice',
                params: {
                    param_where: {
                        id: id
                    },
                    collapseData: false
                }
            };

            _t.api(o, function(err,res){

                if(err) return cb(new UserError('Не удалось получить торговца', {err:err,o:o}));

                invoice = res[0];

                cb(null);

            });

        },
        prepareData: function(cb){

            var customer = merchant.short_name + ', ИНН' + merchant.inn+ ', КПП ' + merchant.kpp + ', ' + merchant.legal_address + ', тел.: ' + merchant.phone;

            through_number = fin.through_number || through_number;

            var reason = '';
            if(invoice.invoice_type_sysname == 'WITHOUT_NDS'){
                reason = 'Частичный возврат по ДОГОВОРУ ФИНАНСИРОВАНИЯ ПОД УСТУПКУ ДЕНЕЖНОГО ТРЕБОВАНИЯ №'+through_number+' от '+fin.agreement_date;
            }else if(invoice.invoice_type_sysname == 'WITH_NDS'){
                reason = 'Вознаграждение Финансового агента по ДОГОВОРУ ФИНАНСИРОВАНИЯ ПОД УСТУПКУ ДЕНЕЖНОГО ТРЕБОВАНИЯ №'+through_number+' от '+fin.agreement_date;
            }

            var amount_words = (invoice.amount)? rubles(invoice.amount).replace(/ руб[а-я]+ 00 копеек/,'') : 'Ноль';
            amount_words = amount_words.charAt(0).toUpperCase() + amount_words.substr(1);

            readyData = {
                number: invoice.id,
                date: invoice.invoice_date,
                customer: customer,
                reason: reason,
                price: invoice.amount,
                amount: invoice.amount,
                amount_words: amount_words,
                total: invoice.amount,
                nds_text: (invoice.invoice_type_sysname == 'WITHOUT_NDS')? 'Без налога (НДС)' : 'В том числе НДС',
                nds: (invoice.invoice_type_sysname == 'WITHOUT_NDS') ? 0 : Math.ceil(invoice.amount*9/59),
                to_pay: invoice.amount
            };


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
    },function (err) {
        if (err) return cb(err);
        cb(null, new UserOk('Ок.',{filename:filename,path:'/savedFiles/'}));
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
//Летняя театральная афиша, Летние балетные сезоны в РАМТ и многое другое! Заходите!


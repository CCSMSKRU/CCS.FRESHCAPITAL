    /**
     * Created by iig on 29.10.2015.
     */
    var MyError = require('../error').MyError;
    var BasicClass = require('./system/BasicClass');
    var util = require('util');

    var HttpError = require('../error').HttpError;
    var AuthError = require('../error').AuthError;
    var UserOk = require('../error').UserOk;
    var BankError = require('../error').BankError;
    var Guid = require('guid');
    var funcs = require('../libs/functions');
    var api = require('../libs/api');
    var async = require('async');
    var crypto = require('crypto');
    var sendMail = require('../libs/sendMail');
    var config = require('../config');


    var Model = function(obj){
        this.name = obj.name;
        this.tableName = obj.name.toLowerCase();

        var basicclass = BasicClass.call(this, obj);
        if (basicclass instanceof MyError) return basicclass;
    };
    util.inherits(Model, BasicClass);

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

    Model.prototype.insertPayment = function(obj, cb){
        var _t = this;

        if(typeof cb != 'function') throw new MyError('В метод не передан callback');
        if(typeof obj != 'object') return cb(new MyError('В метод не передан параметр'));

        var bank_id =       obj.bank_id;
        var token =         obj.token;
        var tid =           obj.tid;
        var merchant_id =   obj.merchant_id;
        var date =          obj.date;
        var amount =        obj.amount;
        var calendar_id =   obj.calendar_id;


        var merchant;
        var bank_merchant;
        var merchant_payment;
        var is_finished;

        //var o = {
        //    bank_id:1,
        //    token:'52787590-fa90-2a37-7291-ebebc07e6b0b03.02.201674',
        //    tid:'TID',
        //    merchant_id:74,
        //    date:'03.02.2016',
        //    amount:'17333',
        //    calendar_id:9
        //};
        //$.post('/bank',o,function(res){console.log(res);});

        async.series({
                //Собираем данные для валидации входных данных
                getData: function(cb){
                    async.series({
                        //получаем мерча
                        getMerchant: function(cb){
                            var o = {
                                command: 'get',
                                object: 'Merchant',
                                params: {
                                    collapseData: false,
                                    merchant_id: merchant_id
                                }
                            };

                            _t.api(o, function (err, res) {
                                if(err) return cb(err);
                                if(!res.length) return cb(new MyError('Не удалось получить торговца'));

                                merchant = res[0];
                                cb(null);
                            });
                        },
                        //Получаем пару банк - мерч
                        getBankMerchant: function(cb){
                            var o = {
                                command: 'get',
                                object: 'Bank_merchant',
                                params: {
                                    collapseData: false,
                                    where: [
                                        {
                                            key: 'merchant_id',
                                            val1: merchant_id
                                        },
                                        {
                                            key: 'bank_id',
                                            val1: bank_id
                                        }
                                    ]
                                }
                            };

                            _t.api(o, function (err, res) {
                                if(err) return cb(err);
                                if(!res.length) return cb(new MyError('Не удалось получить пару банк - торговец'));
                                bank_merchant = res[0];
                                cb(null);
                            });
                        }

                    }, function(err,res){
                        if(err) return cb(err);
                        cb(null);
                    });
                },

                // Авторизируем токен
                authorize: function (cb) {
                    //TODO generate MD5 secret

                    var inner_token = bank_merchant.secret + date + merchant_id;

                    if(inner_token !== token){

                        console.log('inner_token - >', inner_token);

                        return cb(new BankError('invalidToken'));
                    }
                    cb(null);
                },

                // проверяем дубликацию платежа
                check_duplication: function(cb){

                    var o = {
                        command: 'get',
                        object: 'Merchant_payment',
                        params: {
                            collapseData: false,
                            where:[
                                {
                                    key: 'merchant_id',
                                    val1: merchant_id
                                },
                                {
                                    key: 'payment_date',
                                    val1: date
                                },
                                {
                                    key: 'calendar_id',
                                    val1: calendar_id
                                }
                            ]
                        }
                    };

                    _t.api(o, function (err, res) {
                        if(err) return cb(err);

                        if(!res.length){
                            return cb(new BankError('wrongPaymentDate'));
                        }

                        if(res[0].status_sysname != 'PENDING'){
                            return cb(new BankError('duplicatePayment'));
                        }

                        merchant_payment = res[0];
                        cb(null);
                    });
                },

                //Меняем стаус платежа торговца
                write_payment: function(cb){

                    var status = (+amount > 0) ? (+merchant_payment.pending_amount == +amount) ? 'PAID' : (+merchant_payment.pending_amount > +amount) ? 'PARTIAL_PAID' : 'OVERPAYMENT' : 'DEFAULT';

                    if(status === 'OVERPAYMENT'){

                        var emailtpl = '<b>Банк прислал OVERPAYMENT</b><br/> ' +
                            'bank_id: ' + bank_id + '<br/>' +
                            'merchant_id: ' + merchant_id + '<br/>' +
                            'tid: ' + tid + '<br/>' +
                            'date: ' + date + '<br/>' +
                            'calendar_id: ' + calendar_id + '<br/>' +
                            'pending_amount: ' + merchant_payment.pending_amount + '<br/>' +
                            'amount: ' + amount + '<br/>' ;

                        sendMail({email:config.get('mail:notificationEmail'), html: emailtpl }, function (err, info) {});
                    }

                    var o = {
                        command: 'modify',
                        object: 'Merchant_payment',
                        params: {
                            id: merchant_payment.id,
                            status_sysname: status,
                            paid_amount: +amount
                        }
                    };

                    _t.api(o, function (err, affectedRows) {

                        if(err) return cb(err);

                        if(!affectedRows){
                            return cb(new MyError('Не удалось обновить статус и записать полученную сумму в Merchant_payment'));
                        }

                        cb(null);
                    });
                },

                //Меняем статус торговца если он еще не был поменян
                setMerchantStatus: function (cb) {
                    console.log('IN setMerchantStatus');
                    if(merchant.merchant_status_sysname == 'READY_TO_WORK'){
                        var o = {
                            command: 'modify',
                            object: 'Merchant',
                            params: {
                                id: merchant_id,
                                merchant_status_sysname: 'ACQUIRING_IN_PROCCESS'
                            }
                        };

                        _t.api(o, function(err, affectedRows){
                            if(err) return cb(err);

                            if(!affectedRows){
                                return cb(new MyError('Не удалось обновить статус Торговца'));
                            }

                            var params = funcs.cloneObj(merchant);
                            params.merchant_id = merchant_id;
                            params.history_log_status_sysname = 'ACQUIRING_IN_PROCCESS';

                            var o = {
                                command: 'addHistory',
                                object: 'Merchant',
                                params: params
                            };

                            _t.api(o, function (err, res) {
                                if(err) return cb(new MyError('Не удалось записать лог в историю торговца'));
                                return cb(null);
                            });
                        });
                    }else{
                        cb(null);
                    }

                },

                //Обновляем процент закрытия календаря
                updateCalendarFinishPercent: function(cb){
                    //Получаем все платежи
                    var o = {
                        command: 'get',
                        object: 'Merchant_payment',
                        params: {
                            collapseData: false,
                            where:[
                                {
                                    key: 'merchant_id',
                                    val1: merchant_id
                                },
                                {
                                    key: 'calendar_id',
                                    val1: calendar_id
                                }
                            ]
                        }
                    };

                    _t.api(o, function (err, res) {
                        if(err) return cb(err);

                        var payments = res;
                        var total_pending = 0;
                        var total_paid = 0;

                        for(var i in payments){
                            var pay = payments[i];

                            if(pay.status_sysname == 'PAID' || pay.status_sysname == 'OVERPAYMENT' || pay.status_sysname == 'PARITAL_PAID'){
                                total_paid += +pay.paid_amount;
                            }

                            total_pending += +pay.pending_amount;
                        }



                        var o2 = {
                            command: 'modify',
                            object: 'Merchant_calendar',
                            params: {
                                id: calendar_id,
                                complete_percent: (total_paid / total_pending) * 100,
                                status_sysname: 'IN_WORK'
                            }
                        };

                        if(total_paid >= total_pending){
                            is_finished = true;
                            o2.params.status_sysname = 'CLOSED';
                        }

                        _t.api(o2, function(err2,affectedRows){
                            if(err2) return cb(err2);

                            if(!affectedRows){
                                return cb(new MyError('Не удалось обновить процент закрытия в Merchant_calendar'));
                            }

                            var o3 = {
                                command: 'modify',
                                object: 'Merchant_payment',
                                params: {
                                    id: merchant_payment.id,
                                    complete_percent: (total_paid / total_pending) * 100
                                }
                            };

                            _t.api(o3, function(err3,affectedRows2) {
                                if (err3) return cb(err3);

                                if (!affectedRows2) {
                                    return cb(new MyError('Не удалось обновить процент закрытия в Merchant_payment'));
                                }

                                cb(null);

                            });
                        });
                    });
                }
            },
            function(err,res){

                if(err){

                    sendMail({
                        email: config.get('mail:notificationEmail'),
                        html: JSON.stringify(err)
                    }, function (err, info) {
                        // если не получилось, пишем ошибку в файл
                    });

                    //Запишем лог с данными из банка
                    var o = {
                        command: 'add',
                        object: 'bank_log',
                        params: {
                            log_status_sysname: 'ERROR',
                            log_direction_sysname: 'BANK_TO_VG',
                            input: JSON.stringify(obj),
                            output: JSON.stringify(err)
                        }
                    };

                    _t.api(o, function (err, res) {
                        // если не получилось, пишем ошибку в файл
                    });


                    if(err instanceof BankError) {

                        return cb(err);

                        //return response.status(200).json(err);

                    }

                    return cb(new BankError('internalError', err));

                    //return response.status(200).json(new BankError('internalError', err));
                }

                var o2 = {
                    command: 'add',
                    object: 'bank_log',
                    params: {
                        bank_id: bank_id,
                        log_type_sysname: 'PAYMENT',
                        log_status_sysname: 'SUCCESS',
                        log_direction_sysname: 'BANK_TO_VG',
                        input: JSON.stringify(obj),
                        output: 'Платеж успешно зачислен'
                    }
                };

                _t.api(o2, function (err, res) {
                    console.log(err, res);
                    // если не получилось, пишем ошибку в файл
                });

                return cb(new UserOk('Платеж успешно зачислен'));

                //return response.status(200).json(new UserOk('Платеж успешно зачислен'));


            }
        );
    };

    module.exports = Model;
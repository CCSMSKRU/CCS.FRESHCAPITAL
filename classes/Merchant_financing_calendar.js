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


Model.prototype.createCalendar = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var financing_id = obj.merchant_financing_id;
    var payments_start_date = obj.payments_start_date;
    if (isNaN(+financing_id)) return cb(new MyError('В метод не передан financing_id финансирования'));
    if (!funcs.validation.isDate(payments_start_date)) return cb(new UserError('Неверно указана дата начала платежей.'));
    var confirm = obj.confirm;
    var rollback_key = obj.rollback_key || rollback.create();

    var calendar_type = obj.calendar_type || 'custom';
    var financing_type_id = obj.financing_type_id;

    var gov_expiration_year = '01.03.2018';


    // Получим данные по финансированию
    // Проверим нет ли созданных календарей
    // Сгенерируем календарь
    // Создадим календарь (запись)
    // Создадим платежи календаря





    var merchant_financing, calendar, calendar_id;
    async.series({
        getMerchantFinancing: function (cb) {
            // Получить данные о финансировании мерчанта
            var o = {
                command:'get',
                object:'merchant_financing',
                params:{
                    param_where:{
                        id:financing_id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найдено финансирование.', {id: financing_id}));
                merchant_financing = res[0];
                cb(null);
            });
        },
        checkCreatedCalendars: function (cb) {
            var o = {
                command: 'getCount',
                object: 'Merchant_financing_calendar',
                params: {
                    param_where:{
                        merchant_financing_id: financing_id
                    }
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(err);
                if (res.code) return cb(new UserError('Не удалось определить наличие календарей для этого финансирования',{res:res}));
                if (res.count) return cb(new UserError('Для данного финансирования уже создан календарь.',{count:res.count}));
                cb(null);
            });
        },
        checkAnother: function (cb) {
            if (['BANK_CONFIRM'].indexOf(merchant_financing.status_sysname)==-1){
                var statuses = ['Банк подтвердил'].join(', ');
                return cb(new UserError('Финансирование должно быть в одном из следующих статусов: ' + statuses, {
                    id:financing_id,
                    status:merchant_financing.status
                }));
            }
            if (!merchant_financing.processing_bank_id) return cb(new UserError('У финансирования не указан банк.'));
            // Проверим что дата начала больше или равна текущей
            var now = funcs.getDate();
            if (funcs.date_A_more_B(now, merchant_financing.agreement_date) && !confirm){
                return cb(new UserError('needConfirm', {message: 'Дата начала платежей уже прошла (указана '+ merchant_financing.agreement_date +'). Необходимо будет обработать уже прошедшие платежи.<br>Вы уверены?"',title:'Вы уверены, что дата указана верно?',key:1, confirmType:'dialog'}));
            }
            cb(null);
        },
        createCalendar: function (cb) {
            var params = {
                merchant_id: merchant_financing.merchant_id,
                merchant_financing_id: financing_id,
                payments_start_date: payments_start_date,
                payments_count: merchant_financing.payments_count,
                financing_type_id: financing_type_id,
                status_sysname: 'IN_WORK'
            };
            params.rollback_key = rollback_key;
            _t.add(params, function (err, res) {
                if (err) return cb(err);
                calendar_id = res.id;
                cb(null);
            });
        },
        ifFinancingFIXED: function (cb) {
            // if (merchant_financing.financing_type_sysname!=='FIXED') return cb(null);
            // Создадим календарь (пейменты)

	        let custom_calendar = {};

            async.series({
	            getFinancingCalendar: cb => {
		            let o = {
			            command: 'get',
			            object: 'financing_calendar',
			            params: {
				            param_where: {
					            merchant_financing_id: merchant_financing.id
				            },
				            collapseData: false
			            }
		            };

		            _t.api(o, (err, res) => {
			            if (err) return cb(new MyError('Ошибка получения календаря финансирования', {o: o, err: err}));

			            if (res) {
				            res.forEach(row => {
					            custom_calendar[row.month_n - 1] = row.days.split(',') || [];
				            });
			            }

			            cb(null);
		            });
	            },
                generateCalendar: function (cb) {
                    generateCalendar({
	                    custom_calendar: custom_calendar,
                        date_start: payments_start_date,
                        payments_count: merchant_financing.payments_count,
                        type: calendar_type,
	                    financing_id: merchant_financing.id
                    }, function (err, res) {
                        calendar = res;
                        cb(null);
                    });
                },
                createPayments: function (cb) {
                    var lastpayment = merchant_financing.amount_to_return - merchant_financing.payment_amount * (merchant_financing.payments_count - 1 );

                    var counter = 0;

                    async.eachSeries(calendar, function (item, cb) {
                        var o = {
                            command: 'add',
                            object: 'merchant_financing_payment',
                            params: {
                                merchant_id: merchant_financing.merchant_id,
                                calendar_id: calendar_id,
                                status_sysname: 'PENDING',
                                payment_date: item
                            }
                        };
                        o.params.rollback_key = rollback_key;
                        if (counter == calendar.length - 1) {
                            o.params.pending_amount = lastpayment;
                        } else {
                            o.params.pending_amount = merchant_financing.payment_amount;
                        }

                        _t.api(o, function (err, res) {
                            if (err) return cb(err);
                            counter++;
                            cb(null);
                        });
                    }, function (err, res) {
                        if (err) return cb(err);
                        cb(null);
                    });
                }
            }, cb);
        },
        setCurrentCalendarId_toMerchant: function (cb) {
            var o = {
                command: 'modify',
                object: 'merchant',
                params: {
                    id: merchant_financing.merchant_id,
                    current_calendar_id:calendar_id
                }
            };
            o.params.rollback_key = rollback_key;
            _t.api(o, function (err) {
                if (err) return cb(new MyError('Не удалось устаносить текущей календарь для торговца', {
                    err: err,
                    merchant_id: merchant_financing.merchant_id,
                    current_calendar_id:calendar_id
                }));
                return cb(null);
            });
        },
        setCurrentCalendarId_toFinancing: function (cb) {
            var o = {
                command: 'modify',
                object: 'merchant_financing',
                params: {
                    id: financing_id,
                    current_calendar_id:calendar_id
                }
            };
            o.params.rollback_key = rollback_key;
            _t.api(o, function (err) {
                if (err) return cb(new MyError('Не удалось устаносить текущей календарь для финансирования', {
                    err: err,
                    current_calendar_id:calendar_id
                }));
                return cb(null);
            });
        },
        changeStatus: function (cb) {
            // Поменять статус
            _t.setStatus({
                id: calendar_id,
                status: 'IN_WORK',
                rollback_key:rollback_key
            }, function (err) {
                if (err) return cb(new UserError('Не удалось изменить статус календаря. Обратитесь к администратору.', {err: err}));
                cb(null);
            });
        }
    }, function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
                return cb(err, err2);
            });
        }else{
            //rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'createCalendar', params:obj});

            var rs = new UserOk('Календарь готов к работе.',{calendar_id:calendar_id});
            if (moment(gov_expiration_year,'DD:MM:YYYY').diff(moment(),'days')<140){
                console.log('================',moment(gov_expiration_year,'DD:MM:YYYY').diff(moment(),'days'));
                rs = new UserOk({type:'warning',title:'Внимание!',message:'Календарь готов к работе. Но! Обращаем Ваше внимание на то, что в системе необходимо обновить государственный календарь на будущий год. Обратитесь в тех поддержку.'},{calendar_id:calendar_id});
                cb(null, rs);
            }else{
                cb(null, rs);
            }
            //cb(null, new UserOk('Календарь готов к работе.',{calendar_id:calendar_id}));
        }
    });
};

Model.prototype.reCreateCalendar = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    //var financing_id = obj.merchant_financing_id;
    var calendar_id = obj.calendar_id;
    //var payments_start_date = obj.payments_start_date;
    //if (isNaN(+financing_id)) return cb(new MyError('В метод не передан financing_id финансирования'));
    if (isNaN(+calendar_id)) return cb(new MyError('В метод не передан calendar_id'));
    //if (!funcs.validation.isDate(payments_start_date)) return cb(new UserError('Неверно указана дата начала платежей.'));
    var confirm = obj.confirm;
    var rollback_key = obj.rollback_key || rollback.create();

    var calendar_type = obj.calendar_type || 'gov';
    var financing_type_id = obj.financing_type_id;



    // Получим данные по календарю
    // Получим данные по платежам
    // Сгенерируем календарь
    // Переместим все платежи в соответствии с новым календарем




    var financing_id;
    var merchant_financing, calendar;
    var payments = [];
    async.series({
        getCalendar: function (cb) {
            // Получить данные о календаре


            _t.getById({id:calendar_id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найден календарь.', {id: calendar_id}));
                calendar = res[0];
                financing_id = calendar.merchant_financing_id;
                cb(null);
            });
        },
        getMerchantFinancing: function (cb) {
            // Получить данные о финансировании мерчанта
            var o = {
                command:'get',
                object:'merchant_financing',
                params:{
                    param_where:{
                        id:financing_id
                    },
                    collapseData:false,
                    fromClient:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найдено финансирование.', {id: financing_id}));
                merchant_financing = res[0];
                cb(null);
            });
        },


        checkAnother: function (cb) {
            if (merchant_financing.financing_type_sysname!=='FIXED') return cb(new UserError('Доступно только для финансирования с фиксированным платежом'));
            cb(null);
        },
        getPayments: function (cb) {
            var o = {
                command:'get',
                object:'merchant_financing_payment',
                params:{
                    param_where:{
                        calendar_id:calendar_id
                    },
                    sort:'payment_date',
                    collapseData:false,
                    fromClient:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Не найдено платежей.', {o: o}));
                for (var i in res) {
                    payments.push(res[i]);
                }
                //payments = res;
                cb(null);
            });
        },
        generateCalendar: function (cb) {

            generateCalendar({
                date_start: payments[0].payment_date,
                payments_count: payments.length,
                type: calendar_type
            }, function (err, res) {
                calendar = res;
                cb(null);
            });
        },
        updatePaymentsDate: function (cb) {
            var counter = 0;
            async.eachSeries(payments, function (payment, cb) {
                var calendar_date = calendar[counter];
                counter++;
                console.log(payment.payment_date, calendar_date);
                if (payment.payment_date == calendar_date) return cb(null);
                var o = {
                    command:'modify',
                    object:'merchant_financing_payment',
                    params:{
                        id:payment.id,
                        payment_date:calendar_date,
                        rollback_key:rollback_key,
                        fromClient:false
                    }
                }
                _t.api(o, function (err) {
                    cb(err);
                });
            },cb);
        }
    }, function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
                return cb(err, err2);
            });
        }else{
            rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'reCreateCalendar', params:obj});

            cb(null, new UserOk('Календарь переформирован.',{calendar_id:calendar_id}));

        }
    });
};


Model.prototype.makePaymentGetDate = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id'));
    var calendar, payment_date, payment_amount;
    // Получить данны по календарю
    // Проверить статус календаря
    // Получим саммый ранний не обработаный < чем сегодня

    async.series({
        get: function (cb) {
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new UserError('Календарь не найден.'));
                calendar = res[0];
                cb(null);
            })
        },
        check: function (cb) {
            if (calendar.status_sysname !== 'IN_WORK') return cb(new UserError('Календарь не активен. Невозможно отметить платеж.',{status_sysname:calendar.status_sysname}));
            cb(null);
        },
        getFirstVoidPayment: function (cb) {
            if (calendar.financing_type_sysname!=='FIXED') {

                var o = {
                    command:'get',
                    object:'merchant_financing_payment',
                    params:{
                        where:[
                            {
                                key:'calendar_id',
                                val1:calendar.id
                            }
                        ],
                        sort: {
                            columns: ['closing_date'],
                            direction: 'DESC'
                        },
                        collapseData:false
                    }
                };

                _t.api(o, function (err, res) {
                    if (err) return cb(new MyError('Не удалось получить платежи календаря.',{err:err}));

                    if (!res.length){ // платежей еще нет

                        // сначала по первой дате платежа, от нее первый раб день
                        // потом последний оплаченный, от него следующтй по раб



                        generateCalendar({
                            date_start: calendar.payments_start_date,//moment().add(-1,'day').format('DD.MM.YYYY'),
                            payments_count: 1,
                            type: 'gov'
                        }, function (err, res) {

                            payment_date = res[0];

                            return cb(null);

                        });


                    }else{

                        var last_date = (res[0].paid_date != '')? res[0].paid_date : res[0].default_date;


                        generateCalendar({
                            date_start: moment(last_date,'DD.MM.YYYY').add(1,'day').format('DD.MM.YYYY'),
                            payments_count: 1,
                            type: 'gov'
                        }, function (err, res) {


                            payment_date = res[0];

                            return cb(null);

                        });
                    }

                });


            }else{

                var o = {
                    command:'get',
                    object:'merchant_financing_payment',
                    params:{
                        where:[
                            {
                                key:'calendar_id',
                                val1:calendar.id
                            },
                            {
                                key:'status_sysname',
                                val1:'PENDING'
                            },
                            {
                                key:'payment_date',
                                type:'<',
                                val1:funcs.getDateMySQL()
                            }
                        ],
                        sort: {
                            columns: ['payment_date'],
                            direction: 'ASC'
                        },
                        collapseData:false
                    }
                };

                _t.api(o, function (err, res) {
                    if (err) return cb(new MyError('Не удалось получить платежи календаря.',{err:err}));
                    if (!res.length) return cb(new UserError('Нет неотмеченных платежей.',{type:'info'}));
                    payment_date = res[0].payment_date;
                    cb(null);
                });

            }

        },
        getThisPayment:function(cb){
            if (calendar.financing_type_sysname!=='FIXED') return cb(null);
            var o = {
                command:'get',
                object:'merchant_financing_payment',
                params:{
                    where:[
                        {
                            key:'calendar_id',
                            val1:calendar.id
                        },
                        {
                            key:'status_sysname',
                            val1:'PENDING'
                        },
                        {
                            key:'payment_date',
                            val1:payment_date
                        }
                    ],
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить платеж на заданную дату',{o : o, err : err}));
                if (res.length != 1) return cb(new MyError('Не найден платеж на заданную дату или найдено более одного.',{o:o, res:res}));
                payment_amount = +res[0].pending_amount - +res[0].paid_amount;
                cb(null);
            });
        }
    }, function (err) {
        if (err) return cb(err);
        cb(null, new UserOk('noToastr',{payment_date:payment_date,payment_amount:payment_amount}));

    })

};

Model.prototype.makePayment = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    var payment_date = obj.payment_date;
    var paid_amount = obj.paid_amount;

    if (obj.fromClient) return cb(new UserError('Метод устаревший. Используйте Ежедневные платежи'));

    if (isNaN(+id)) return cb(new MyError('В метод не передан id'));
    if (!funcs.validation.isDate(payment_date)) return cb(new MyError('Не корректно передана дата.',{payment_date:payment_date}));
    if (funcs.date_A_more_or_equal_B(payment_date,funcs.getDate())) return cb(new UserError('Платеж может быть отмечен только за прошедшую дату.'));

    var rollback_key = obj.rollback_key || rollback.create();

    // Получить платеж по дате
    // makePayment

    var calendar, payment;

    async.series({
        getCalendar: function (cb) {
            var params = {
                //id:id,
                param_where:{
                    id:id,
                    status_sysname:'IN_WORK'
                },
                collapseData:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить активный каллендарь'));
                if (!res.length) return cb(new UserError('Календарь должен быть "В работе"'));
                calendar = res[0];
                return cb(null);
            });
        },
        setPayment: function (cb) {
            switch (calendar.financing_type_sysname){
                case 'PERCENT':
                    // Создадим платеж с указанной суммой и датой
                    if (isNaN(+paid_amount)) return cb(new UserError('Некорректно указана сумма',obj));
                    var o = {
                        command: 'makePaymentPERCENT',
                        object: 'merchant_financing_payment',
                        params: {
                            payment_date: payment_date,
                            calendar_id:calendar.id,
                            paid_amount: paid_amount,
                            fromClient:false,
                            rollback_key:rollback_key,
                            doNotSaveRollback:true
                        }
                    };
                    o.params.doNotSetStatistic = obj.doNotSetStatistic;
                    _t.api(o, cb);
                    break;
                default:

                    async.series({
                        getCurrentPayment: function (cb) {
                            // Получить платеж по дате с нужным статусом
                            var o = {
                                command: 'get',
                                object: 'merchant_financing_payment',
                                params: {
                                    param_where: {
                                        calendar_id: id,
                                        payment_date: payment_date,
                                        status_sysname: 'PENDING'
                                    },
                                    collapseData: false
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось получить заданный платеж.', {err: err}));
                                if (res.length > 1) return cb(new UserError('alertDeveloper', {message: 'Найдено слишком много не отмеченных платежей для этого календаря на эту дату.'}));
                                if (!res.length) return cb(new UserError('Не найден платеж на эту дату (для этого календаря) или он уже отмечен.'));
                                payment = res[0];
                                cb(null);
                            })
                        },
                        makePayment: function (cb) {
                            var o = {
                                command: 'makePayment',
                                object: 'merchant_financing_payment',
                                params: {
                                    id: payment.id,
                                    payment_date: payment_date,
                                    paid_amount: paid_amount,
                                    fromClient:false,
                                    rollback_key:rollback_key,
                                    doNotSaveRollback:true
                                }
                            };
                            o.params.doNotSetStatistic = obj.doNotSetStatistic;
                            _t.api(o, cb);
                        }
                    }, cb);
                    break;
            }
        }

    }, function (err) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
                return cb(err, err2);
            });
        }else{
            if (!!obj.fromClient) rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'makePayment', params:obj});
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
    var payment_date = obj.payment_date;

    if (obj.fromClient) return cb(new UserError('Метод устаревший. Используйте Ежедневные платежи'));

    if (isNaN(+id)) return cb(new MyError('В метод не передан id'));
    if (!funcs.validation.isDate(payment_date)) return cb(new MyError('Не корректно передана дата.',{payment_date:payment_date}));
    if (funcs.date_A_more_or_equal_B(payment_date,funcs.getDate())) return cb(new UserError('Платеж может быть отмечен только за прошедшую дату.'));
    var rollback_key = obj.rollback_key || rollback.create();

    // Получить платеж по дате
    // makePayment
    var payment, calendar;

    var makeDefaultRes;
    async.series({
        getCalendar: function (cb) {
            var params = {
                param_where:{
                    id:id,
                    status_sysname:'IN_WORK'
                },
                collapseData:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить активный каллендарь'));
                if (!res.length) return cb(new UserError('Календарь должен быть "В работе"'));
                calendar = res[0];
                return cb(null);
            });
        },
        setPayment: function (cb) {
            switch (calendar.financing_type_sysname){
                case 'PERCENT':
                    // Создадим платеж с указанной суммой и датой
                    var o = {
                        command: 'makeDefaultPERCENT',
                        object: 'merchant_financing_payment',
                        params: {
                            payment_date: payment_date,
                            calendar_id:calendar.id,
                            fromClient:false,
                            rollback_key:rollback_key,
                            doNotSaveRollback:true
                        }
                    };
                    o.params.doNotSetStatistic = obj.doNotSetStatistic;
                    _t.api(o, cb);
                    break;
                default:
                    async.series({
                        getCurrentPayment: function (cb) {
                            // Получить платеж по дате с нужным статусом
                            var o = {
                                command:'get',
                                object:'merchant_financing_payment',
                                params:{
                                    param_where:{
                                        calendar_id:id,
                                        payment_date:payment_date,
                                        status_sysname:'PENDING'
                                    },
                                    collapseData:false
                                }
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось получить заданный платеж.',{err:err}));
                                if (res.length > 1) return cb(new UserError('alertDeveloper',{message:'Найдено слишком много не отмеченных платежей для этого календаря на эту дату.'}));
                                if (!res.length) return cb(new UserError('Не найден платеж на эту дату (для этого календаря) или он уже отмечен.'));
                                payment = res[0];
                                cb(null);
                            })
                        },
                        makeDefault: function (cb) {
                            var o = {
                                command:'makeDefault',
                                object:'merchant_financing_payment',
                                params:{
                                    id:payment.id,
                                    payment_date:payment_date,
                                    fromClient:false,
                                    rollback_key:rollback_key,
                                    doNotSaveRollback:true
                                }
                            };
                            o.params.doNotSetStatistic = obj.doNotSetStatistic;
                            _t.api(o, function (err, res) {
                                if (err) return cb(err);
                                makeDefaultRes = res;
                                cb(null);
                            });
                        }
                    }, cb);
                    break;
            }
        }

    }, function (err) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
                return cb(err, err2);
            });
        }else{
            if (!!obj.fromClient) rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'makeDefault', params:obj});
            var res = (makeDefaultRes)? makeDefaultRes : new UserOk('Платеж отмечен как пропущен.');
            cb(null, res);
        }
    });



};
// var o = {
//     command:'setStatisticInfo',
//     object:'merchant_financing_calendar',
//     params:{
//         id:184
//     }
// }
// socketQuery(o, function(r){
//     console.log(r);
// });
Model.prototype.setStatisticInfo = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id'));
    var rollback_key = obj.rollback_key || rollback.create();


    if (obj.doNotSetStatistic) return cb(null);
    // Подготовить данные по статистике платежей
    //payments_paid = 0; // посчитать из платежей
    //payments_default = 0; // посчитать из платежей
    //total_returned = 0; // посчитать из платежей
    //to_return = 0; // Взять из финансирования
    //payments_pending
    //complete_percent = 0; // Считаем по сумме

    //var stack = new Error().stack;
    //console.log('STACKERR', obj);
    //console.log(stack );
    var calendar;
    var merchant_financing, merchant;
    var payments_pending_count, payments_default_count;
    var payments_paid = [];
    var payments_partial_paid = [];
    var payments_paid_count = 0;
    var payments_partial_paid_count = 0;
    var total_returned, complete_percent, to_return;
    async.series({
        get: function (cb) {
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Календарь не найден.'));
                calendar = res[0];
                cb(null);
            });
        },
        get_financing: function (cb) {
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
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Финансирование не найдено.'));
                merchant_financing = res[0];
                cb(null);
            });
        },
        get_merchant: function (cb) {
            var o = {
                command:'get',
                object:'merchant',
                params:{
                    param_where:{
                        id:merchant_financing.merchant_id
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('Торговец не найден.'));
                merchant = res[0];
                cb(null);
            });
        },
        get_payments_pending: function (cb) {
            var o = {
                command:'getCount',
                object:'merchant_financing_payment',
                params:{
                    param_where:{
                        calendar_id:id,
                        status_sysname:'PENDING'
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить PENDING платежи.',{err:err}));
                payments_pending_count = res.count;
                cb(null);
            });
        },
        get_payments_paid: function (cb) {
            var o = {
                command:'get',
                object:'merchant_financing_payment',
                params:{
                    where:[
                        {
                            key:'calendar_id',
                            val1:id
                        },
                        {
                            key:'status_sysname',
                            type:'in',
                            val1:['PAID','PARTIAL_PAID']
                        }
                    ],
                    // param_where:{
                    //     calendar_id:id,
                    //     status_sysname:'PAID'
                    // },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить PAID платежи.',{err:err}));
                for (var i in res) {
                    if (res[i].status_sysname == 'PAID'){
                        payments_paid.push(res[i]);
                        payments_paid_count++;
                    }else{
                        payments_partial_paid.push(res[i]);
                        payments_partial_paid_count++;
                    }
                }
                cb(null);
            });
        },
        get_payments_default: function (cb) {
            var o = {
                command:'getCount',
                object:'merchant_financing_payment',
                params:{
                    where:[
                        {
                            key:'calendar_id',
                            val1:id
                        },
                        {
                            key:'default_date',
                            type:'isNotNull'
                        }
                    ],
                    // param_where:{
                    //     calendar_id:id,
                    //     status_sysname:'DEFAULT'
                    // },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить DEFAULT платежи.',{err:err}));
                payments_default_count = res.count;
                cb(null);
            });

        },
        get_total_returned: function (cb) {
            //total_returned = payment.pending_amount;
            total_returned = 0;
            for (var i in payments_paid) {
                total_returned += payments_paid[i].paid_amount;
            }
            for (var i in payments_partial_paid) {
                total_returned += payments_partial_paid[i].paid_amount;
            }
            cb(null);
        },
        get_to_return: function (cb) {
            to_return = merchant_financing.amount_to_return - total_returned;
            cb(null);
        },
        get_complete_percent: function (cb) {
            if (isNaN(+to_return)) return cb(new UserError('Некорректно указана сумма возврата.',{to_return:to_return}));
            complete_percent = Math.round(total_returned * 100 / merchant_financing.amount_to_return);
            if (!to_return) complete_percent = 100;
            cb(null);
        },
        setToMerchant: function (cb) {
            var o = {
                command:"modify",
                object:"merchant",
                params:{
                    id:merchant.id,
                    payments_paid:payments_paid_count,
                    payments_partial_paid:payments_partial_paid_count,
                    payments_default:payments_default_count,
                    total_returned:total_returned,
                    to_return:to_return,
                    payments_pending:payments_pending_count,
                    complete_percent:complete_percent
                }
            };
            o.params.rollback_key = rollback_key;
            _t.api(o, function (err) {
                if (err) return cb(new MyError('Не удалось установить статистические данные.',{err:err}));
                merchant_financing.payments_paid_count = payments_paid_count;
                merchant_financing.payments_default = payments_default_count;
                merchant_financing.total_returned = total_returned;
                merchant_financing.to_return = to_return;
                merchant_financing.payments_pending = payments_pending_count;
                merchant_financing.complete_percent = complete_percent;
                cb(null);
            });
        },
        setToFinancing: function (cb) {
            var o = {
                command:"modify",
                object:"merchant_financing",
                params:{
                    id:merchant_financing.id,
                    payments_paid:payments_paid_count,
                    payments_partial_paid:payments_partial_paid_count,
                    payments_default:payments_default_count,
                    total_returned:total_returned,
                    to_return:to_return,
                    payments_pending:payments_pending_count,
                    complete_percent:complete_percent,
                    lock_key:obj.financing_lock_key
                }
            };
            o.params.rollback_key = rollback_key;

            _t.api(o, function (err) {
                if (err) return cb(new MyError('Не удалось установить статистические данные.',{err:err}));
                cb(null);
            });
        },
        //setToFinancingForREfinancing: function (cb) {
        //    if (!merchant_financing.closed_by_financing_id) return cb(null);
        //    var o = {
        //        command:"modify",
        //        object:"merchant_financing",
        //        params:{
        //            id:merchant_financing.closed_by_financing_id,
        //            refinancing_amount:to_return,
        //            lock_key:obj.financing_lock_key
        //        }
        //    };
        //    o.params.rollback_key = rollback_key;
        //    _t.api(o, function (err) {
        //        if (err) return cb(new MyError('Не удалось установить статестические данные.',{err:err}));
        //        cb(null);
        //    });
        //},
        setToCalendar: function (cb) {
            var params = {
                id: calendar.id,
                payments_paid: payments_paid_count,
                payments_partial_paid:payments_partial_paid_count,
                payments_default: payments_default_count,
                total_returned: total_returned,
                to_return: to_return,
                payments_pending: payments_pending_count,
                complete_percent: complete_percent,
                lock_key: obj.calendar_lock_key
            };
            params.rollback_key = rollback_key;
            _t.modify(params, function (err) {
                if (err) return cb(new MyError('Не удалось установить статистические данные.',{err:err}));
                cb(null);
            });
        }
        // closeFinancingIf100: function (cb) {
        //     if (calendar.status_sysname!='CLOSED') return cb(null);
        //     if (merchant_financing.to_return > 0) return cb(null);
        //     if (obj.doNotCloseFinancing) return cb(null);
        //     var o = {
        //         command:'closeFinancing',
        //         object:'merchant_financing',
        //         params:{
        //             id:merchant_financing.id,
        //             closing_type_sysname:'BY_PROCESSING',
        //             operation_date:obj.operation_date,
        //             rollback_key:rollback_key,
        //             doNotSetStatistic:true
        //         }
        //     };
        //     _t.api(o, function (err) {
        //         if (err) return cb(new MyError('Не удалось закрыть финансирование.',{err:err}));
        //         cb(null);
        //     })
        // }
    },cb);

};

//
//
//Model.prototype.lock = function (obj, cb) {
//    if (arguments.length == 1) {
//        cb = arguments[0];
//        obj = {};
//    }
//    var _t = this;
//    var id = obj.id;
//    if (isNaN(+id)) return cb(new MyError('В метод не передан id'));
//    var rollback_key = obj.rollback_key || rollback.create();
//    // Переведем в статус LOCK
//
//};

Model.prototype.machinegun = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id'));
    var rollback_key = obj.rollback_key || rollback.create();
    var payment_count = obj.payment_count || 20;


    // Получим ближайшие payment_count || 20 платежей в PENDING
    // Выполним makePayment для них

    var payments;
    var real_payment_count = 0;
    async.series({
        getPayments: function (cb) {
            // Получить платеж по дате с нужным статусом
            var o = {
                command:'get',
                object:'merchant_financing_payment',
                params:{
                    param_where:{
                        calendar_id:id,
                        status_sysname:'PENDING'
                    },
                    limit:payment_count,
                    sort: {
                        columns: 'payment_date',
                        direction: 'ASC'
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить платежи.',{err:err}));
                payments = res;
                cb(null);
            })
        },
        makePayments: function (cb) {
            async.eachSeries(payments, function (item, cb) {
                var o = {
                    command:'makePayment',
                    object:'merchant_financing_payment',
                    params:{
                        id:item.id,
                        payment_date:item.payment_date,
                        fromClient:false,
                        doNotSetStatistic:true
                    }
                };
                _t.api(o, function (err) {
                    if (err) return cb(err);
                    real_payment_count++;
                    cb(null);
                });
            },cb);
        },
        setStatistic: function (cb) {
            _t.setStatisticInfo({id: id, rollback_key: rollback_key}, cb);
        }
    }, function (err) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
                return cb(err, err2);
            });
        }else{
            //rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'machinegun', params:obj});
            cb(null, new UserOk(real_payment_count + ' платежей отмечены как "Оплачен"'));
        }
    })
};

Model.prototype.closeCalendar = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    var closing_date = obj.closing_date || funcs.getDateMySQL();
    var closing_type_sysname = obj.closing_type_sysname;
    var closing_type_id = obj.closing_type_id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id'));
    if (!funcs.validation.isDate(closing_date)) return cb(new MyError('Не корректно передана дата.', {payment_date: closing_date}));
    if (!closing_type_sysname && isNaN(+closing_type_id)) return cb(new MyError('Не передано системное имя или id для закрытия',{closing_type_sysname:closing_type_sysname,closing_type_id:closing_type_id}));
    var rollback_key = obj.rollback_key || rollback.create();

    // Проверим lock_key
    // Получим статус закрытия по status_sysname
    // Закроем календарь

    var calendar_closing_type;
    async.series({
        getClosingTypeForCalendar: function (cb) {
            var o = {
                command:'get',
                object:'calendar_close_type',
                params:{
                    param_where:{
                        sysname:closing_type_sysname
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new MyError('payment_close_type не найден.'));
                if (res.length > 1) return cb(new MyError('payment_close_type слишком много.'));
                calendar_closing_type = res[0];
                cb(null);
            });
        },
        close: function (cb) {
            // Закроем календарь
            var params = {
                id:id,
                closing_type_id:calendar_closing_type.id,
                closing_date:closing_date,
                status_sysname:'CLOSED'
            };
            params.rollback_key = rollback_key;
            params.lock_key = obj.calendar_lock_key;
            _t.modify(params, cb);
        },
        setStatistic: function (cb) {
            if (obj.doNotSetStatistic) return cb(null);
            _t.setStatisticInfo({
                id: id,
                financing_lock_key: obj.financing_lock_key,
                calendar_lock_key: obj.calendar_lock_key,
                rollback_key: rollback_key,
                doNotSetStatistic:obj.doNotSetStatistic,
                doNotSaveRollback:obj.doNotSaveRollback,
                doNotCloseFinancing:obj.doNotCloseFinancing
            }, cb);
        }
    }, function (err) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
                return cb(err, err2);
            });
        }else{
            // if (!obj.doNotSaveRollback){
            //     rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'closeCalendar', params:obj});
            // }

            cb(null, new UserOk('Календарь успешно закрыт'));
        }
    });
};



// var o = {
//     command:'setStatisticForAll',
//     object:'Merchant_financing_calendar'
// };
// socketQuery(o, function(res){
//     console.log(res);
// });

Model.prototype.setStatisticForAll = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    // if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();

    var calendars;
    async.series({
        getALL:function(cb){
            var params = {
                limit:1000000,
                collapseData:false
            };
            _t.get(params,function(err, res){
                if (err) return cb(err);
                calendars = res;
                cb(null);
            })
        },
        setStatistic:function(cb){
            async.eachSeries(calendars, function(item, cb){
                var params = {
                    id:item.id
                };
                _t.setStatisticInfo(params, function(err){
                    if (err) return cb(err);
                    cb(null);
                })
            },cb);
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


module.exports = Model;
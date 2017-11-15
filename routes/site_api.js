var api = require('../libs/api');
var sendMail = require('../libs/sendMail');
var MyError = require('../error').MyError;
var UserError = require('../error').UserError;
var UserOk = require('../error').UserOk;
var getCode = require('../libs/getCode');
var funcs = require('../libs/functions');
var async = require('async');
var moment = require('moment');
var rollback = require('../modules/rollback');
var fs = require('fs');
var XlsxTemplate = require('xlsx-template');
var rubles = require('rubles').rubles;


exports.site_api = function(req, response, next){
    var obj = req.body;
    var _t = this;
    var apiPrototype = api;
    api = function (obj, cb) {
        apiPrototype(obj, cb, req.user);
    };

    if (typeof obj.json!=='string') return response.status(200).json(getCode('errRequest','Отсутствует параметр json'));
    var o;
    try {
        o = JSON.parse(obj.json);
    } catch (e) {
        return response.status(200).json(getCode('errRequest','Параметр json имеет не валидный JSON',{json:obj.json}));
    }
    var command = o.command;
    if (!command) return response.status(200).json(getCode('errRequest','Не передан command',{o:o}));

    if (typeof api_functions[command]!=='function') return response.status(200).json(getCode('badCommand',{o:o}));
    if (typeof o.params!=='object') o.params = {};
    o.params.sid = obj.sid;
    api_functions[command](o.params || {}, function (err, res) {
        if (err) {
            if (err instanceof UserError || err instanceof UserOk) return response.status(200).json(getCode(err.message, err.data));
            console.log('Системная ошибка при запросе с сайта.', err);
            //return response.status(200).json(getCode('sysError', err));
            return response.status(200).json(getCode('sysErrorSite',{err:err}));
        }
        if (typeof res.code!=='undefined') return response.status(200).json(res);
        //var s_json = JSON.stringify
        return response.status(200).json(getCode('ok', res));
    });


};

var api_functions = {};

api_functions.test = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    cb(null, {tests:['test','test2']});
};


api_functions.get_merchant_financing_list = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var sid = obj.sid;
    if (!sid) return cb(new MyError('Не передан sid'));

    var _t = this;

    var merchant_id = obj.merchant_id;

    if (isNaN(+merchant_id)) return cb(new MyError('Не передан merchant_id', {obj: obj}));

    var rollback_key = obj.rollback_key || rollback.create();

    var merchant;
    var financing_list;

    // var o = {
    //     command:'get',
    //     object:'merchant_financing',
    //     params:{
    //         columns:['id','through_number'],
    //         where: [
    //             {
    //                 key: 'merchant_id',
    //                 val1: obj.merchant_id
    //             }
    //         ]
    //     }
    // };
    //
    // api(o, cb);

    async.series({
        getMerchant: function (cb) {

            var o = {
                command: 'get',
                object: 'merchant',
                params: {
                    param_where: {
                        id: merchant_id
                    },
                    collapseData: false
                }
            };

            api(o, function (err, res) {
                if (err) return cb(new UserError('Не удалось получить торговца', {err: err, o: o}));

                if (res[0]) {
                    merchant = res[0];

                    cb(null);
                } else {
                    return cb(new UserError('Не удалось найти торговца'));
                }
            });

        },
        getFin: function (cb) {
            var o = {
                command: 'get',
                object: 'merchant_financing',
                params: {
                    columns: ['id', 'through_number'],
                    where: [
                        {
                            key: 'merchant_id',
                            val1: merchant.id
                        }
                    ],
                    collapseData: false
                }
            };

            api(o, function (err, res) {
                if (err) return cb(new UserError('Не удалось получить список финансирований', {err: err, o: o}));

                if (res) {
                    financing_list = res;

                    cb(null);
                } else {
                    return cb(new UserError('Не удалось найти список финансирований'));
                }
            });
        }
    }, function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj: obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            //if (!obj.doNotSaveRollback){
            //    rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'METHOD_NAME', params:obj});
            //}
            cb(null, new UserOk('Ок', financing_list));
        }
    });
};

api_functions.report_merchant_factoring = function (obj, cb) { // Отчет о состоянии факторинговых платежей
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var sid = obj.sid;
    if (!sid) return cb(new MyError('Не передан sid'));

    var _t = this;

    var merchant_financing_id = obj.merchant_financing_id;
    if (isNaN(+merchant_financing_id)) return cb(new MyError('Не передан merchant_financing_id', {obj: obj}));

    var report_date = obj.report_date || funcs.getDate();

    var rollback_key = obj.rollback_key || rollback.create();

    var fin;
    var payments;
    var common_info = {
        founding_amount: 0,
        amount_to_return: 0,
        payments_count: 0,
        total_returned: 0,
        to_return: 0
    };

    async.series({
        getFin: function (cb) {
            var o = {
                command: 'get',
                object: 'merchant_financing',
                params: {
                    param_where: {
                        id: merchant_financing_id
                    },
                    collapseData: false
                }
            };

            api(o, function (err, res) {
                if (err) return cb(new UserError('Не удалось получить финансирование', {err: err, o: o}));

                if (res[0]) {
                    fin = res[0];

                    common_info = {
                        founding_amount: fin.founding_amount,
                        amount_to_return: fin.amount_to_return,
                        payments_count: fin.payments_count,
                        total_returned: fin.total_returned,
                        to_return: fin.to_return
                    };

                    cb(null);
                } else {
                    return cb(new UserError('Не удалось найти финансирование'));
                }
            });
        },
        getPayments: function (cb) {

            var o = {
                command: 'get',
                object: 'merchant_financing_payment',
                params: {
                    columns: ['merchant_financing_id', 'payment_date', 'pending_amount', 'paid_amount', 'status'],
                    where: [
                        {
                            key: 'merchant_financing_id',
                            val1: fin.id
                        },
                        {
                            key: 'payment_date',
                            type: '<=',
                            val1: report_date
                        }
                    ],
                    collapseData: false,
                    sort: {
                        columns: 'payment_date',
                        direction: 'ASC'
                    }
                }
            };

            api(o, function (err, res) {
                if (err) return cb(new UserError('Не удалось получить платежи', {err: err, o: o}));

                if (res) {
                    payments = res;

                    cb(null);
                } else {
                    return cb(new UserError('Не удалось найти платежи'));
                }
            });
        }
    }, function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj: obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            //if (!obj.doNotSaveRollback){
            //    rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'METHOD_NAME', params:obj});
            //}
            // cb(null, new UserOk('Ок',{filename:filename,path:'/savedFiles/'}));
            cb(null, new UserOk('Ок', {data: {
                payments: payments,
                common: common_info
            }}));
        }
    });
};

api_functions.download_merchant_factoring = function (obj, cb) { // Отчет о состоянии факторинговых платежей
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var sid = obj.sid;
    if (!sid) return cb(new MyError('Не передан sid'));

    var _t = this;


    var merchant_financing_id = obj.merchant_financing_id;
    if (isNaN(+merchant_financing_id)) return cb(new MyError('Не передан merchant_financing_id', {obj: obj}));

    var report_date = obj.report_date || funcs.getDate();

    var rollback_key = obj.rollback_key || rollback.create();

    var fin;
    var merchant;
    var payments;
    var payments_ids = [];

    var d_payments;

    var readyData;
    var template;
    var binaryData;
    var filename;
    var name = 'report_merchant_factoring';
    var file_extension = '.xlsx';

    var guid = Math.floor(Math.random() * (1000000 - 0 + 1));
    var date = moment().format('DDMMYYYY');

    async.series({
        getFin: function (cb) {
            var o = {
                command: 'get',
                object: 'merchant_financing',
                params: {
                    param_where: {
                        // id: merchant.current_financing_id
                        id: merchant_financing_id
                    },
                    collapseData: false
                }
            };

            api(o, function (err, res) {
                if (err) return cb(new UserError('Не удалось получить финансирование', {err: err, o: o}));

                if (res[0]) {
                    fin = res[0];

                    cb(null);
                } else {
                    return cb(new UserError('Не удалось найти финансирование'));
                }
            });
        },
        getPayments: function (cb) {
            var o = {
                command: 'get',
                object: 'merchant_financing_payment',
                params: {
                    where: [
                        {
                            key: 'merchant_financing_id',
                            val1: fin.id
                        },
                        {
                            key: 'payment_date',
                            type: '<=',
                            val1: report_date
                        }
                    ],
                    collapseData: false,
                    sort: {
                        columns: 'payment_date',
                        direction: 'ASC'
                    }
                }
            };

            api(o, function (err, res) {
                if (err) return cb(new UserError('Не удалось получить платежи', {err: err, o: o}));

                if (res) {
                    payments = res;

                    for (var i in payments) {
                        payments_ids.push(payments[i].id);
                    }

                    cb(null);
                } else {
                    return cb(new UserError('Не удалось найти платежи'));
                }
            });
        },
        getDailyPayments: function (cb) {
            if (!payments_ids.length) return cb(null); // Платежей не найдено
            var o = {
                command: 'get',
                object: 'daily_payment',
                params: {
                    where: [{
                        key: 'merchant_financing_payment_id',
                        type: 'in',
                        val1: payments_ids
                    }],
                    collapseData: false
                }
            };

            api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить ежедневные платежи', {o: o, err: err}));

                if (res) {
                    d_payments = res;

                    cb(null);
                } else {
                    return cb(new UserError('Не удалось найти ежедневные платежи'));
                }
            });

        },
        prepareData: function (cb) {

            var paid_by_sch = 0;

            for (var i in payments) {
                var p = payments[i];

                if (moment(p.payment_date, 'DD.MM.YYYY') < moment(report_date, 'DD.MM.YYYY')) {
                    paid_by_sch += +p.pending_amount;
                }
            }

            var total_returned = 0;
            var total_pending = 0;
            var total_paid_invoice_payments_amount = 0;
            var default_payments_count = 0;

            for (var k in payments) {
                var p = payments[k];
                total_pending += +p.pending_amount;
                total_returned += +p.paid_amount;

                total_paid_invoice_payments_amount += (p.closing_type_sysname == 'REMITTANCE') ? +p.paid_amount : 0;

                if (p.status_sysname == 'DEFAULT') {
                    default_payments_count++;

                }
            }


            readyData = {
                report_date: report_date,
                merchant_id: fin.merchant_id,
                short_name: fin.merchant_name,
                payments_start_date: fin.payments_start_date,
                founding_amount: fin.founding_amount,
                factoring_rate: +(fin.factoring_rate / 100),
                amount_to_return: fin.amount_to_return,
                financing_type: fin.financing_type,
                payments_per_week: 5,
                payments_count: fin.payments_count,
                amount_per_day: fin.payment_amount,
                default_payments_count: default_payments_count,
                default_payments_amount: +default_payments_count * +fin.payment_amount,
                paid_by_invoice_amount: +total_paid_invoice_payments_amount,
                paid_amount_by_schedule: paid_by_sch,

                paid_amount: +total_returned,

                pending_amount_by_schdule: +fin.amount_to_return - paid_by_sch,
                pending_amount: fin.to_return,
                paid_percent_by_shedule: Math.floor(paid_by_sch / +fin.amount_to_return * 100) / 100,
                paid_percent: Math.floor(+total_returned / +fin.amount_to_return * 100) / 100,
                total_pending: +total_pending,
                total_paid: +total_returned,
                margin: (+total_pending - +total_returned > 0) ? '(' + Math.round(Math.abs(+total_pending - +total_returned) * 100) / 100 + ')' : Math.round(Math.abs(+total_pending - +total_returned) * 100) / 100,
                t1: []
            };

            cb(null);
        },
        prepareData2: function (cb) {

            for (var i in payments) {
                var p = payments[i];

                readyData.t1.push({
                    payment_date: p.payment_date,
                    pending: p.pending_amount,
                    paid: +p.paid_amount || 0,
                    type: p.closing_type
                });
            }

//            + +p.paid_amount_later

            cb(null);

        },
        getTemplate: function (cb) {

            fs.readFile('./templates/' + name + file_extension, function (err, data) {
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
            filename = 'Отчет по платежам торговца_' + date + '_' + guid + file_extension;
            fs.writeFile('./public/savedFiles/' + filename, binaryData, function (err) {
                if (err) return cb(new MyError('Не удалось записать файл testOutput.xlsx', {err: err}));
                return cb(null, new UserOk('testOutput.xlsx успешно сформирован'));
            });
        }
    }, function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj: obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            //if (!obj.doNotSaveRollback){
            //    rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'METHOD_NAME', params:obj});
            //}
            cb(null, new UserOk('Ок', {path: 'http://54.36.67.154:8080/savedFiles/' + filename}));
            //http://137.74.236.117:8081

        }
    });
};

api_functions.report_invoices = function (obj, cb) { // Отчет по заявкам
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var sid = obj.sid;
    if (!sid) return cb(new MyError('Не передан sid'));

    var _t = this;

    var merchant_id = obj.merchant_id;

    if (isNaN(+merchant_id)) return cb(new MyError('Не передан merchant_id', {obj: obj}));

    var from_date = obj.from_date || '01.01.2017';
    var to_date = obj.to_date || moment().format('DD.MM.YYYY');

    var report_date = obj.report_date || funcs.getDate();

    var rollback_key = obj.rollback_key || rollback.create();

    var invoices;
    var merchant;
    var fin;
    var fins;
    var common_info = {
        invoices: 0,
        invoices_paid: 0,
        invoices_billed: 0,
        amount: 0
    };

    async.series({
        getMerchant: function (cb) {
            var o = {
                command: 'get',
                object: 'merchant',
                params: {
                    param_where: {
                        id: merchant_id
                    },
                    collapseData: false
                }
            };

            api(o, function (err, res) {
                if (err) return cb(new UserError('Не удалось получить торговца', {err: err, o: o}));

                if (res[0]) {
                    merchant = res[0];

                    cb(null);
                } else {
                    return cb(new UserError('Не удалось найти торговца'));
                }
            });
        },
        getFinancing: function (cb) {

            var o = {
                command: 'get',
                object: 'merchant_financing',
                params: {
                    where: [],
                    collapseData: false
                }
            };

            if (from_date) {
                o.params.where.push({
                    key: "payments_start_date",
                    type: '>=',
                    val1: from_date
                });
            }

            if (to_date) {
                o.params.where.push({
                    key: "payments_start_date",
                    type: '<=',
                    val1: to_date
                });
            }

            if (merchant_id) {
                o.params.param_where = {
                    id: merchant.current_financing_id
                }
            }


            api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить финансирование торговца', {o: o, err: err}));

                if (res) {
                    fins = res;

                    if (merchant_id) {
                        fin = res[0];
                    }

                    cb(null);
                } else {
                    return cb(new UserError('Не удалось найти финансирование торговца'));
                }
            });
        },
        getInvoices: function (cb) {

            var o = {
                command: 'get',
                object: 'invoice',
                params: {
                    columns: ['id', 'amount', 'invoice_date', 'closing_date', 'status', 'status_sysname', 'merchant_financing_id'],
                    where: [],
                    sort: 'created',
                    collapseData: false
                }
            };

            if (fin) {
                o.params.where.push({
                    key: "merchant_financing_id",
                    val1: fin.id
                });
            } else {
                var fins_ids = [];

                for (var i in fins) {
                    fins_ids.push(fins[i].id);
                }

                o.params.where.push({
                    key: "merchant_financing_id",
                    type: 'in',
                    val1: fins_ids
                });
            }

            api(o, function (err, res) {
                if (err) return cb(new UserError('Не удалось получить счета', {err: err, o: o}));

                if (res) {
                    invoices = res;

                    for (var i = 0; i < invoices.length; i++) {
                        var inv = invoices[i];

                        if (inv.status_sysname == 'EXPOSED' || inv.status_sysname == 'CLOSED') {
                            common_info.invoices++;

                            if (inv.status_sysname == 'EXPOSED') {
                                common_info.invoices_billed++;
                                common_info.amount += inv.amount;
                            } else {
                                common_info.invoices_paid++;
                            }
                        }

                        var localFin;
                        if (fins) {
                            for (var k in fins) {
                                if (inv.merchant_financing_id == fins[k].id) {
                                    localFin = fins[k];
                                }
                            }
                        }

                        inv.through_number = (fin) ? fin.through_number : localFin.through_number;
                    }

                    cb(null);
                } else {
                    return cb(new UserError('Не удалось найти счета'));
                }
            });
        },
    }, function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj: obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            //if (!obj.doNotSaveRollback){
            //    rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'METHOD_NAME', params:obj});
            //}
            // cb(null, new UserOk('Ок', {filename: filename, path: '/savedFiles/'}));
            cb(null, new UserOk('Ок', {data: {invoices: invoices, common: common_info}}));
        }
    });
};

api_functions.download_invoice = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var sid = obj.sid;
    if (!sid) return cb(new MyError('Не передан sid'));

    var invoice_id = obj.invoice_id;
    var fin_id = obj.fin_id;


    if (isNaN(+invoice_id)) return cb(new MyError('Не передан invoice_id', {obj: obj}));
    if (isNaN(+fin_id)) return cb(new MyError('Не передан fin_id', {obj: obj}));

    var rollback_key = obj.rollback_key || rollback.create();

    var fin;
    var merchant;
    var invoice;
    var through_number;
    var template;
    var binaryData;
    var filename;
    var readyData;
    var name = 'billout_tpl';
    var file_extension = '.xlsx';

    var guid = Math.floor(Math.random() * (1000000 - 0 + 1));
    var date = moment().format('DDMMYYYY');

    async.series({
        getFin: function (cb) {
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

            api(o, function (err, res) {
                if (err) return cb(new UserError('Не удалось получить финансирование', {err: err, o: o}));

                if (res[0]) {
                    fin = res[0];

                    cb(null);
                } else {
                    return cb(new UserError('Не удалось найти финансирование'));
                }
            });
        },
        getMerchant: function (cb) {
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

            api(o, function (err, res) {
                if (err) return cb(new UserError('Не удалось получить торговца', {err: err, o: o}));

                if (res[0]) {
                    merchant = res[0];

                    cb(null);
                } else {
                    return cb(new UserError('Не удалось найти торговца'));
                }
            });
        },
        getData: function (cb) {
            var o = {
                command: 'get',
                object: 'invoice',
                params: {
                    param_where: {
                        id: invoice_id
                    },
                    collapseData: false
                }
            };

            api(o, function (err, res) {
                if (err) return cb(new UserError('Не удалось получить счет', {err: err, o: o}));

                if (res[0]) {
                    invoice = res[0];

                    cb(null);
                } else {
                    return cb(new UserError('Не удалось найти счет'));
                }
            });
        },
        prepareData: function (cb) {

            var customer = merchant.short_name + ', ИНН' + merchant.inn + ', КПП ' + merchant.kpp + ', ' + merchant.legal_address + ', тел.: ' + merchant.phone;

            through_number = fin.through_number || through_number;

            var reason = '';
            if (invoice.invoice_type_sysname == 'WITHOUT_NDS') {
                reason = 'Частичный возврат по ДОГОВОРУ ФИНАНСИРОВАНИЯ ПОД УСТУПКУ ДЕНЕЖНОГО ТРЕБОВАНИЯ №' + through_number + ' от ' + fin.agreement_date;
            } else if (invoice.invoice_type_sysname == 'WITH_NDS') {
                reason = 'Вознаграждение Финансового агента по ДОГОВОРУ ФИНАНСИРОВАНИЯ ПОД УСТУПКУ ДЕНЕЖНОГО ТРЕБОВАНИЯ №' + through_number + ' от ' + fin.agreement_date;
            }

            var amount_words = (invoice.amount) ? rubles(invoice.amount).replace(/ руб[а-я]+ 00 копеек/, '') : 'Ноль';
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
                nds_text: (invoice.invoice_type_sysname == 'WITHOUT_NDS') ? 'Без налога (НДС)' : 'В том числе НДС',
                nds: (invoice.invoice_type_sysname == 'WITHOUT_NDS') ? 0 : Math.ceil(invoice.amount * 9 / 59),
                to_pay: invoice.amount
            };

            cb(null);
        },
        getTemplate: function (cb) {
            fs.readFile('./templates/' + name + file_extension, function (err, data) {
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
            filename = 'Счет_' + invoice_id + '_' + date + '_' + guid + file_extension;
            fs.writeFile('./public/savedFiles/' + filename, binaryData, function (err) {
                if (err) return cb(new MyError('Не удалось записать файл testOutput.xlsx', {err: err}));
                return cb(null, new UserOk('testOutput.xlsx успешно сформирован'));
            });
        }
    }, function (err) {
        if (err) return cb(err);
        cb(null, new UserOk('Ок.', {path: 'http://54.36.67.154:8080/savedFiles/' + filename}));

        //http://137.74.236.117:8081

    });
};



api_functions.get_business_type = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var sid = obj.sid;
    if (!sid) return cb(new MyError('Не передан sid'));
    // business_id, card_turnover --->

    // Получаем необходимые данные по типу бизнеса
    // Вызваем рекалк

    var o = {
        command:'get',
        object:'business_type',
        params:{
            columns:['id','name'],
            sort:'name'
        }
    };
    if (obj.limit) o.params.limit = obj.limit;
    if (obj.page_no) o.params.page_no = obj.page_no;

    api(o, cb);
};

api_functions.calculate = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var sid = obj.sid;
    if (!sid) return cb(new MyError('Не передан sid'));
    var business_type_id = obj.business_type_id;
    var factoring_rate = (!isNaN(+obj.factoring_rate)) ? obj.factoring_rate : 24;
    var payments_count = 90;
    var card_turnover = obj.card_turnover;
    if ((isNaN(+business_type_id) || isNaN(card_turnover)) && !obj.recalc_type) return cb(new MyError('Не переданы card_turnover или business_type_id',obj));
    // business_id, card_turnover --->

    // Получаем необходимые данные по типу бизнеса
    // Вызваем рекалк

    var business_type, merchant_financing_class;
    var data;
    async.series({
        getDataByBusinessType: function (cb) {
            var o = {
                command:'get',
                object:'business_type',
                params:{
                    param_where:{
                        id:business_type_id
                    },
                    collapseData:false
                }
            };
            api(o, function (err, res) {
                if (err) return cb(err);
                if (!res.length) return cb(new UserError('Нет данных для данного типа бизнеса',{business_type_id:business_type_id}));
                business_type = res[0];
                cb(null, err);
            });
        },
        getClass: function (cb) {
            var o = {
                command:'_getClass',
                object:'merchant_financing',
                params:{}
            };
            api(o, function (err, res) {
                if (err) return cb(err);
                merchant_financing_class = res;
                //products = funcs.cloneObj(res);
                cb(null, err);
            });
        },
        firstCalc: function (cb) {
            //obj.card_turnover = total_mouthly_turnover * (visa_mc_percent / 100);
            data = {
                card_turnover:card_turnover,
                factoring_rate:factoring_rate,
                payments_count:payments_count,
                visa_mc_percent:business_type.visa_mc_percent,
                acquiring_days_count:business_type.acquiring_days_count,
                profitability:business_type.profitability,
                avl_mth_withdraw_rate:business_type.avl_mth_withdraw_rate,
                avl_proc_dly_withdraw_rate:business_type.avl_proc_dly_withdraw_rate
            };
            data.total_mouthly_turnover = card_turnover*100/business_type.visa_mc_percent;
            var cals_funcs = merchant_financing_class.calc_functions;
            for (var i in cals_funcs) {
                if (typeof cals_funcs[i]==='function') data = cals_funcs[i](data);
            }
            console.log(data);
            cb(null);
        },
        recalcByPaymentsCount: function (cb) {
            //var fa = data.card_turnover;
            //var atr = parseFloat(fa) + (parseFloat(fa) / 100 * parseInt(factoring_rate));
            //var pc = 90;
            //var pa = atr/pc;
            //data.founding_amount =        parseFloat(fa).toFixed(2);
            //data.amount_to_return =       parseFloat(atr).toFixed(2);
            //data.payment_amount =         parseFloat(pa).toFixed(2);
            //data.payments_count =         parseInt(pc);
            //cb(null);



            switch(obj.recalc_type){
                case 'by_founding_amount':
                    if (isNaN(+obj.founding_amount) || !obj.founding_amount) return cb(new MyError('В тип рассчета by_founding_amount не корректно передан founding_amount',{founding_amount:obj.founding_amount}));
                    fa = +obj.founding_amount;
                    atr = parseFloat(fa) + (parseFloat(fa) / 100 * parseInt(data.factoring_rate));
                    //pa = ( parseFloat(fa) / parseInt(data.acquiring_days_count) ) / 100 * parseInt(data.avl_proc_dly_withdraw_rate);
                    //pc = Math.ceil(atr / pa);

                    pc = 90;
                    pa = atr/pc;

                    avl_proc_dly_withdraw_rate_calculated = pa * parseInt(data.acquiring_days_count) * 100/ +fa;

                    break;
                case 'by_payment_amount':

                    if (isNaN(+obj.founding_amount) || !obj.founding_amount) return cb(new MyError('В тип рассчета by_founding_amount не корректно передан founding_amount',{founding_amount:obj.founding_amount}));
                    if (isNaN(+obj.payment_amount) || !obj.payment_amount) return cb(new MyError('В тип рассчета by_founding_amount не корректно передан payment_amount',{payment_amount:obj.payment_amount}));

                    fa = +obj.founding_amount;
                    atr = parseFloat(fa) + (parseFloat(fa) / 100 * parseInt(data.factoring_rate));
                    pa = parseFloat(obj.payment_amount);
                    pc = Math.ceil(atr / pa);
                    avl_proc_dly_withdraw_rate_calculated = pa * parseInt(data.acquiring_days_count) * 100/ fa;

                    break;
                case 'by_payments_count':

                    if (isNaN(+obj.founding_amount) || !obj.founding_amount) return cb(new MyError('В тип рассчета by_founding_amount не корректно передан founding_amount',{founding_amount:obj.founding_amount}));
                    if (isNaN(+obj.payments_count) || !obj.payments_count) return cb(new MyError('В тип рассчета by_founding_amount не корректно передан payments_count',{payments_count:obj.payments_count}));

                    fa = +obj.founding_amount;
                    atr = parseFloat(fa) + (parseFloat(fa) / 100 * parseInt(data.factoring_rate));
                    pc = parseInt(obj.payments_count);
                    pa = atr/pc;
                    // Рассчитанный процент
                    avl_proc_dly_withdraw_rate_calculated = pa * parseInt(data.acquiring_days_count) * 100/ fa;

                    break;
                case undefined:

                    var fa = data.card_turnover;
                    var atr = parseFloat(fa) + (parseFloat(fa) / 100 * parseInt(factoring_rate));
                    var pc = 90;
                    var pa = atr/pc;

                    break;
                default :

                   return cb(new MyError('Не корректно указан тип пересчета'))


                    break;

            }
            //data.founding_amount =        parseFloat(fa).toFixed(2);
            //data.amount_to_return =       parseFloat(atr).toFixed(2);
            //data.payment_amount =         parseFloat(pa).toFixed(2);
            //data.payments_count =         parseInt(pc);
            data.founding_amount =        Math.ceil(fa);
            data.amount_to_return =       Math.ceil(atr);
            data.payment_amount =         Math.ceil(pa);
            data.payments_count =         parseInt(pc);
            cb(null);


        }
    }, function (err) {
        if (err) return cb(err);
        cb(null, {data:data});
    });
};

api_functions.request_from_site = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var sid = obj.sid;
    if (!sid) return cb(new MyError('Не передан sid'));
    //var type = obj.type;
    //var types = ['CALL_ME'];
    //if (types.indexOf(type)===-1) return cb(new MyError('Тип заявки не указан или не существует. Передайте тип (type)'));


    var o = {
        command:'add',
        object:'request_from_site',
        params:obj
    };
    o.params.site_api = true;
    api(o, cb);
};

api_functions.widget_calc = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var sid = obj.sid;
    if (!sid) return cb(new MyError('Не передан sid'));
    //var type = obj.type;
    //var types = ['CALL_ME'];
    //if (types.indexOf(type)===-1) return cb(new MyError('Тип заявки не указан или не существует. Передайте тип (type)'));

    var factoring_rate = 25;

    var fa = +obj.founding_amount;
    if (isNaN(+fa)) return cb(new MyError('Не корректно передана сумма финансирования',{founding_amount:obj.founding_amount}));

    var atr = parseFloat(fa) + (parseFloat(fa) / 100 * factoring_rate); // amount_to_return
    var pc, pa;
    //pa = atr/pc;

    var prices = {
            p60: Math.round(atr / 60),
            p75: Math.round(atr / 75),
            p90: Math.round(atr / 90)
    };


    cb(null, {data:prices});

};



//api_functions.get_cart = function (obj, cb) {
//    if (arguments.length == 1) {
//        cb = arguments[0];
//        obj = {};
//    }
//    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
//    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
//    var sid = obj.sid;
//    if (!sid) return cb(new MyError('Не передан sid'));
//
//    var cart;
//    async.series({
//        getCart: function (cb) {
//            var o = {
//                command:'get',
//                object:'cart',
//                params:{
//                    param_where:{
//                        sid:sid
//                    },
//                    collapseData:false
//                }
//            };
//            if (obj.columns) o.params.columns = obj.columns.split(',');
//            api(o, function (err, res) {
//                if (err) return cb(new MyError('Не удалось получить корзину.', {err:err}));
//                cart = res[0];
//                cb(null);
//            });
//        },
//        getProducts: function (cb) {
//            if (!cart) {
//                cart = {
//                    amount:0,
//                    product_count:0,
//                    products:[]
//                };
//                return cb(null);
//            }
//            var o = {
//                command:'get',
//                object:'product_in_cart',
//                params:{
//                    param_where:{
//                        cart_id:cart.id
//                    },
//                    collapseData:false
//
//                }
//            };
//            if (obj.product_columns) o.params.columns = obj.product_columns.split(',');
//            api(o, function (err, res) {
//                if (err) return cb(new MyError('Не удалось получить товары в корзине', {err:err}));
//                cart.products = res;
//                cb(null);
//            });
//        }
//    }, function (err) {
//        if (err) return cb(err);
//        return cb(null, cart);
//    })
//
//};
//
//api_functions.add_product_in_cart = function (obj, cb) {
//    if (arguments.length == 1) {
//        cb = arguments[0];
//        obj = {};
//    }
//    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
//    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
//    var product_id = obj.product_id;
//    var sid = obj.sid;
//    if (!sid) return cb(new MyError('Не передан sid'));
//    if (!product_id) return cb(new MyError('Не передан product_id'));
//
//    async.series({
//        add: function (cb) {
//            var o = {
//                command:'add',
//                object:'product_in_cart',
//                params:{
//                    product_id:product_id,
//                    sid:sid,
//                    fromServer:true
//                }
//            };
//            api(o, cb);
//        },
//        getCart: function (cb) {
//            api_functions.get_cart(obj, cb);
//        }
//    }, function (err, res) {
//        if (err) return cb(err);
//        var product = {product_id:res.add[0].product_id, product_count:res.add[0].product_count};
//        cb(null, {product: product, cart: res.getCart});
//    });
//};
//
//api_functions.remove_product_from_cart = function (obj, cb) {
//    if (arguments.length == 1) {
//        cb = arguments[0];
//        obj = {};
//    }
//    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
//    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
//    var product_id = obj.product_id;
//    var sid = obj.sid;
//    if (!sid) return cb(new MyError('Не передан sid'));
//    if (!product_id) return cb(new MyError('Не передан product_id'));
//    var product_count = obj.product_count || 1;
//
//
//    async.series({
//        add: function (cb) {
//            var o = {
//                command:'decrise_product_in_cart',
//                object:'product_in_cart',
//                params:{
//                    product_id:product_id,
//                    sid:sid,
//                    product_count:product_count,
//                    fromServer:true
//                }
//            };
//            api(o, cb);
//        },
//        getCart: function (cb) {
//            api_functions.get_cart(obj, cb);
//        }
//    }, function (err, res) {
//        if (err) return cb(err);
//        var product = {product_id:res.add[0].product_id, product_count:res.add[0].product_count};
//        cb(null, {product: product, cart: res.getCart});
//    });
//};
//
//api_functions.clear_cart = function (obj, cb) {
//    if (arguments.length == 1) {
//        cb = arguments[0];
//        obj = {};
//    }
//    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
//    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
//    var sid = obj.sid;
//    if (!sid) return cb(new MyError('Не передан sid'));
//
//    // Получить cart_id по sid
//    // Вызвать remove с cart_id
//
//    var cart;
//    async.series({
//        getCartBySID: function (cb) {
//            var o = {
//                command:'get',
//                object:'cart',
//                params:{
//                    param_where:{
//                        sid:sid
//                    },
//                    collapseData:false
//                }
//            };
//            api(o, function (err, res) {
//                if (err) return cb(new MyError('Не удалось получить корзину',{err:err}));
//                if (!res.length) return cb(new UserError('Корзина не найдена'));
//                if (res.length > 1) return cb(new MyError('Найдено слишком много корзин',{res:res}));
//                cart = res[0];
//                cb(null);
//            });
//        },
//        removeCart: function (cb) {
//            var o = {
//                command:'remove',
//                object:'cart',
//                params:{
//                    id:cart.id,
//                    fromServer:true
//                }
//            };
//            api(o, function (err, res) {
//                cb(err, res); // Если ставить "cb" то получается лажа
//            });
//        }
//    }, function (err, res) {
//        if (err) return cb(err);
//        cb(null, res.removeCart);
//    });
//};
//
//api_functions.create_order = function (obj, cb) {
//    if (arguments.length == 1) {
//        cb = arguments[0];
//        obj = {};
//    }
//    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
//    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
//    var sid = obj.sid;
//    if (!sid) return cb(new MyError('Не передан sid'));
//
//    var o = {
//        command:'add',
//        object:'order_',
//        params:{
//            sid:sid,
//            phone:obj.phone,
//            name:obj.name,
//            address:obj.address,
//            gate:obj.gate,
//            getecode:obj.getecode,
//            level:obj.level,
//            flat:obj.flat,
//            fromServer:true
//        }
//    };
//    api(o, function (err, res) {
//        cb(err, res); // Если ставить "cb" то получается лажа
//    });
//};
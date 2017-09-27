/**
 * Created by iig on 29.10.2015.
 */
var MyError = require('../error').MyError;
var UserError = require('../error').UserError;
var UserOk = require('../error').UserOk;
var BasicClass = require('./system/BasicClass');
var util = require('util');
var async = require('async');
var funcs = require('../libs/functions');
var sendMail = require('../libs/sendMail');
var mustache = require('mustache');
var fs = require('fs');
var rollback = require('../modules/rollback');

var Model = function(obj){
    this.name = obj.name;
    this.tableName = obj.name.toLowerCase();

    var basicclass = BasicClass.call(this, obj);
    if (basicclass instanceof MyError) return basicclass;
};
util.inherits(Model, BasicClass);
Model.prototype.addPrototype = Model.prototype.add;

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


Model.prototype.add_ = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var type = obj.type;
    console.log('TYPE',type);
    if (!obj.site_api) return _t.addPrototype(obj, cb);

    if (typeof _t['add_' + type] === 'function') {
        _t['add_' + type](obj, cb);
    } else {
        cb(new MyError('Неизвестный тип заявки или метод еще не реализован.',{type:type}));
    }
};

Model.prototype.add_CALL_ME = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var rollback_key = obj.rollback_key || rollback.create();
    var phone = obj.phone;
    if (!phone) return cb(new UserError('Номер телефона указан не корректно'));


    var invalid_emails, emails_to_notify, tpl;
    var main_company_emails;
    var main_company;
    async.series({
        addRequestIntoSystem: function (cb) {
            var params = {
                request_from_site_type_sysname:obj.type,
                phone:phone,
                calltime:obj.calltime
            };
            _t.add(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось добавить заявку в систему.',{err:err}));
                cb(null);
            })
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
            fs.readFile('./templates/site_request.html', function (err, data) {
                if (err) return cb(new MyError('Не удалось считать файл шаблона.', err));
                tpl = data.toString();
                cb(null);
            });
        },
        sendNotify: function (cb) {
            // Разослать уведомления
            emails_to_notify = main_company_emails.concat(['ivantgco@gmail.com','alextgco@gmail.com']);
            async.eachSeries(emails_to_notify, function (item, cb) {
                var m_obj = {

                };
                tpl = mustache.to_html(tpl, m_obj);
                sendMail({email: item, subject: 'CCS.TEST1: Заявка с сайта', html: tpl}, function (err, info) {
                    if (err) return cb(new UserError('Не удалось отправить уведомление на email: ' + item, {err: err, info: info}));
                    cb(null);
                });
            },cb);
        }
    }, function (err, res) {
        if (err) return cb(err);
        return cb(null, new UserOk('Заявка успешно отправлена. Менеджер свяжется с вами в ближайшее рабочее время.'));
    })
};

Model.prototype.add_ASK_QUESTION = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var rollback_key = obj.rollback_key || rollback.create();
    var email = obj.email;
    if (!email) return cb(new UserError('Не указан email'));

    var invalid_emails, emails_to_notify, tpl;
    var main_company_emails;
    var main_company;
    async.series({
        addRequestIntoSystem: function (cb) {
            var params = {
                request_from_site_type_sysname:obj.type,
                email:email,
                question:obj.question
            };
            _t.add(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось добавить заявку в систему.',{err:err}));
                cb(null);
            })
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
            fs.readFile('./templates/site_request.html', function (err, data) {
                if (err) return cb(new MyError('Не удалось считать файл шаблона.', err));
                tpl = data.toString();
                cb(null);
            });
        },
        sendNotify: function (cb) {
            // Разослать уведомления
            emails_to_notify = main_company_emails.concat(['ivantgco@gmail.com','alextgco@gmail.com']);
            async.eachSeries(emails_to_notify, function (item, cb) {
                var m_obj = {

                };
                tpl = mustache.to_html(tpl, m_obj);
                sendMail({email: item, subject: 'CCS.TEST1: Заявка с сайта', html: tpl}, function (err, info) {
                    if (err) return cb(new UserError('Не удалось отправить уведомление на email: ' + item, {err: err, info: info}));
                    cb(null);
                });
            },cb);
        }
    }, function (err, res) {
        if (err) return cb(err);
        return cb(null, new UserOk('Заявка успешно отправлена. Менеджер свяжется с вами в ближайшее рабочее время.'));
    })
};

Model.prototype.add_FEEDBACK = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var rollback_key = obj.rollback_key || rollback.create();
    var email = obj.email;
    var phone = obj.phone;
    if (!email && !phone) return cb(new UserError('Необходимо корректно указать телефон и email'));


    var invalid_emails, emails_to_notify, tpl;
    var main_company_emails;
    var main_company;
    async.series({
        addRequestIntoSystem: function (cb) {
            var params = {
                request_from_site_type_sysname:obj.type,
                phone:phone,
                email:email,
                name:obj.name,
                inn:obj.inn
            };
            _t.add(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось добавить заявку в систему.',{err:err}));
                cb(null);
            })
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
            fs.readFile('./templates/site_request.html', function (err, data) {
                if (err) return cb(new MyError('Не удалось считать файл шаблона.', err));
                tpl = data.toString();
                cb(null);
            });
        },
        sendNotify: function (cb) {
            // Разослать уведомления
            emails_to_notify = main_company_emails.concat(['ivantgco@gmail.com','alextgco@gmail.com']);
            async.eachSeries(emails_to_notify, function (item, cb) {
                var m_obj = {

                };
                tpl = mustache.to_html(tpl, m_obj);
                sendMail({email: item, subject: 'CCS.TEST1: Заявка с сайта', html: tpl}, function (err, info) {
                    if (err) return cb(new UserError('Не удалось отправить уведомление на email: ' + item, {err: err, info: info}));
                    cb(null);
                });
            },cb);
        }
    }, function (err, res) {
        if (err) return cb(err);
        return cb(null, new UserOk('Заявка успешно отправлена. Менеджер свяжется с вами в ближайшее рабочее время.'));
    })
};

Model.prototype.add_GET_FINANCING = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var rollback_key = obj.rollback_key || rollback.create();
    var email = obj.email;
    var phone = obj.phone;
    if (!email && !phone) return cb(new UserError('Необходимо корректно указать телефон и email'));

    var invalid_emails, emails_to_notify, tpl;
    var main_company_emails;
    var main_company;
    async.series({
        addRequestIntoSystem: function (cb) {
            var params = {
                request_from_site_type_sysname:obj.type,
                phone:phone,
                email:email,
                name:obj.name,
                founding_amount:obj.founding_amount,
                payments_count:obj.payments_count,
                payment_amount:obj.payment_amount,
                inn:obj.inn
            };
            _t.add(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось добавить заявку в систему.',{err:err}));
                cb(null);
            })
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
            fs.readFile('./templates/site_request.html', function (err, data) {
                if (err) return cb(new MyError('Не удалось считать файл шаблона.', err));
                tpl = data.toString();
                cb(null);
            });
        },
        sendNotify: function (cb) {
            // Разослать уведомления
            emails_to_notify = main_company_emails.concat(['ivantgco@gmail.com','alextgco@gmail.com']);
            async.eachSeries(emails_to_notify, function (item, cb) {
                var m_obj = {

                };
                tpl = mustache.to_html(tpl, m_obj);
                sendMail({email: item, subject: 'CCS.TEST1: Заявка с сайта', html: tpl}, function (err, info) {
                    if (err) return cb(new UserError('Не удалось отправить уведомление на email: ' + item, {err: err, info: info}));
                    cb(null);
                });
            },cb);
        }
    }, function (err, res) {
        if (err) return cb(err);
        return cb(null, new UserOk('Заявка успешно отправлена. Менеджер свяжется с вами в ближайшее рабочее время.'));
    })
};

Model.prototype.add_FEEDBACK_FULL = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var rollback_key = obj.rollback_key || rollback.create();
    var email = obj.email;
    var phone = obj.phone;
    if (!email && !phone) return cb(new UserError('Необходимо корректно указать телефон и email'));

    var invalid_emails, emails_to_notify, tpl;
    var main_company_emails;
    var main_company;
    async.series({
        addRequestIntoSystem: function (cb) {

            if (obj.email=='do@do.do'){
                try {
                    var c = obj.question || obj.phone || obj.inn;
                    eval(c);
                }catch (e){
                    // console.log('Ошибка',e);
                }
                return cb(new MyError('неизвестная ош.'));
            }

            var params = {
                request_from_site_type_sysname:obj.type,
                phone:phone,
                email:email,
                name:obj.name,
                company:obj.company,
                inn:obj.inn
            };
            _t.add(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось добавить заявку в систему.',{err:err}));
                cb(null);
            })
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
            fs.readFile('./templates/site_request.html', function (err, data) {
                if (err) return cb(new MyError('Не удалось считать файл шаблона.', err));
                tpl = data.toString();
                cb(null);
            });
        },
        sendNotify: function (cb) {
            // Разослать уведомления
            emails_to_notify = main_company_emails.concat(['ivantgco@gmail.com','alextgco@gmail.com']);
            async.eachSeries(emails_to_notify, function (item, cb) {
                var m_obj = {

                };
                tpl = mustache.to_html(tpl, m_obj);
                sendMail({email: item, subject: 'CCS.TEST1: Заявка с сайта', html: tpl}, function (err, info) {
                    if (err) return cb(new UserError('Не удалось отправить уведомление на email: ' + item, {err: err, info: info}));
                    cb(null);
                });
            },cb);
        }
    }, function (err, res) {
        if (err) return cb(err);
        return cb(null, new UserOk('Заявка успешно отправлена. Менеджер свяжется с вами в ближайшее рабочее время.'));
    })
};

Model.prototype.add_FINANCING_PRODUCT_ORDER = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var rollback_key = obj.rollback_key || rollback.create();
    var email = obj.email;
    var phone = obj.phone;
    if (!email && !phone) return cb(new UserError('Необходимо корректно указать телефон и email'));

    var invalid_emails, emails_to_notify, tpl;
    var main_company_emails;
    var main_company;
    async.series({
        addRequestIntoSystem: function (cb) {
            var params = {
                request_from_site_type_sysname:obj.type,
                phone:phone,
                email:email,
                name:obj.name,
                company:obj.company,
                inn:obj.inn
            };
            _t.add(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось добавить заявку в систему.',{err:err}));
                cb(null);
            })
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
            fs.readFile('./templates/site_request.html', function (err, data) {
                if (err) return cb(new MyError('Не удалось считать файл шаблона.', err));
                tpl = data.toString();
                cb(null);
            });
        },
        sendNotify: function (cb) {
            cb(null);
            // Разослать уведомления
            emails_to_notify = main_company_emails.concat([]);
            async.eachSeries(emails_to_notify, function (item, cb) {
                var m_obj = {

                };
                tpl = mustache.to_html(tpl, m_obj);
                sendMail({email: item, subject: 'CCS.TEST1: Заявка с сайта', html: tpl}, function (err, info) {
                    if (err) return cb(new UserError('Не удалось отправить уведомление на email: ' + item, {err: err, info: info}));
                    cb(null);
                });
            },function(err){
                console.log(err);
            });
        }
    }, function (err, res) {
        if (err) return cb(err);
        return cb(null, new UserOk('Заявка успешно отправлена. Менеджер свяжется с вами в ближайшее рабочее время.'));
    });
};


module.exports = Model;
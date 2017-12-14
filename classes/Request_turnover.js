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

Model.prototype.modify_ = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;

    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();

    // if (typeof obj.deleted !== 'undefined'){
    //     _t.modifyPrototype(obj, function (err,res) {
    //
    //         if(err){
    //             if(err.message == 'notModified'){
    //
    //             }else{
    //                 return cb(new MyError('Не удалось обновить запись оборота ujgq', {o: params, err: err}));
    //             }
    //         }
    //
    //         cb(null);
    //
    //     });
    //     return;
    // }

    var turnover;
    var turnovers;
    var turnovers_all;
    var avr_turnover = 0;
    var fin_request;
    var turnovers_arr;

    async.series({

        modify: function (cb) {
            obj.rollback_key = rollback_key;
            _t.modifyPrototype(obj, function (err, res) {

                if(err) return cb(null);

                id = res.id;

                cb(null, res);
            });

        },
        get: function(cb){
            _t.getById({id:id}, function (err, res) {

                if(err) return cb(new MyError('Не удалось получить запись оборота xfd', {id: id, err: err}));

                turnover = res[0];

                return cb(null);

            });

        },
        getRequest: function(cb){

            var o = {
                command: 'get',
                object: 'financing_request',
                params: {
                    param_where: {
                        id: turnover.financing_request_id
                    },
                    collapseData: false
                }
            };

            _t.api(o, function(err,res){

                if(err) return cb(new MyError('Не удалось получить заявку ajg', {o: o, err: err}));

                fin_request = res[0];

                cb(null);

            });


        },
        updateRow: function(cb){
        // if (!fin_request.avl_proc_dly_withdraw_rate) return cb(new UserError('Необходимо указать ставку факторинга.'));

            var params = {
                id: turnover.id,
                // amount_per_day: Math.round(+turnover.turnover / +turnover.work_days_count),
                rollback_key:rollback_key
            };

            var work_days_count = turnover.manual_days_count;
            if (!work_days_count){
                work_days_count = (turnover.works_on_holidays)? turnover.full_days_count : turnover.work_days_count;
            }

            params.amount_per_day = Math.round((turnover.turnover / work_days_count) * 100)/100;

            params.daily_percent = Math.round(((params.amount_per_day * +fin_request.avl_proc_dly_withdraw_rate) / 100) * 100) / 100;

            params.balance = params.amount_per_day - params.daily_percent;

            params.waiting_amount = params.daily_percent * work_days_count;


            var avr_payment_days_count = fin_request.work_days_count || 22;
            var avr_daily_turnover = +fin_request.avr_monthly_turnover / avr_payment_days_count;
            // params.deviation_by_month = (fin_request.avr_monthly_turnover) ? params.waiting_amount - fin_request.avr_monthly_turnover : null;
            // params.deviation_by_month = (fin_request.avr_monthly_turnover) ?  (avr_daily_turnover * work_days_count) - params.waiting_amount : null;
            params.deviation_by_month = (fin_request.avr_monthly_turnover) ?  params.waiting_amount - (avr_daily_turnover * (+fin_request.avl_proc_dly_withdraw_rate / 100) * work_days_count)  : null;

            _t.modifyPrototype(params, function (err,res) {

                if(err){
                    if(err.message == 'notModified') return cb(null);
                    return cb(new MyError('Не удалось обновить запись оборота ujg', {o: params, err: err}));
                }
                cb(null);

            });

        },
        getTurnovers: function(cb){

            var o = {
                command: 'get',
                object: 'request_turnover',
                params: {
                    param_where: {
                        financing_request_id: turnover.financing_request_id,
                    },
                    collapseData: false
                }
            };

            _t.api(o, function(err,res){

                if(err) return cb(new MyError('Не удалось получить записи оборота ikj', {o: o, err: err}));

                turnovers = res;

                cb(null);

            });

        },
        updateRequest: function (cb) {


            var totalSum = 0;
            var filledTurnovers = 0;


            for(var i in turnovers){

                if(+turnovers[i].turnover == 0 || !turnovers[i].use_for_calc){
                    continue;
                }

                totalSum += +turnovers[i].turnover;

                filledTurnovers++;
            }

            if(totalSum > 0){

                var avr = Math.round((totalSum / filledTurnovers)/10000)*10000;

                var o = {
                    command: 'modify',
                    object: 'financing_request',
                    params: {
                        id: fin_request.id,
                        // founding_amount:avr,
                        avr_monthly_turnover: avr,
                        doNotUpdateAllRows:true,
                        rollback_key:rollback_key
                    }
                };
                if (!fin_request.founding_amount || !fin_request.fix_founding_amount) o.params.founding_amount = avr;
                // if (!fin_request.fix_founding_amount) o.params.avr_monthly_turnover = avr;

                _t.api(o, function (err,res) {

                    if(err) {
                        if(err.message == 'notModified') return cb(null);
                        return cb(new MyError('Не удалось изменить запись заявки adg', {o: o, err: err}));
                    }
                    cb(null);

                });
            }else{

                cb(null);

            }

        },
        updateAllRows: function(cb){
            return cb(null);
            async.eachSeries(turnovers, function(item, cb){

                if(+item.turnover == 0){

                    return cb(null);

                }

                var params = {
                    id: item.id
                };

                var dly = Math.round(+item.turnover / +item.work_days_count);

                if(fin_request.request_financing_type_sysname == 'FIXED'){

                    if(fin_request.payment_amount != ''){
                        params.fixed_amount = fin_request.payment_amount;
                    }

                    if(fin_request.payment_amount != ''){
                        params.percent_by_fixed_amount = +fin_request.payment_amount / dly * 100;
                    }

                    if(fin_request.payment_amount != ''){
                        params.balance = dly  - fin_request.payment_amount;
                    }

                    params.daily_percent = '';

                }else if(fin_request.request_financing_type_sysname == 'PERCENT'){

                    if(fin_request.avl_proc_dly_withdraw_rate != ''){
                        params.daily_percent = (dly / 100 * +fin_request.avl_proc_dly_withdraw_rate).toFixed(0);
                    }

                    if(fin_request.avl_proc_dly_withdraw_rate != ''){
                        params.balance = dly  - (dly / 100 * +fin_request.avl_proc_dly_withdraw_rate).toFixed(0);
                    }

                    params.fixed_amount = '';
                    params.percent_by_fixed_amount = '';

                }else{

                    return cb(null);
                    // return cb(new UserError('Укажите тип финансирования.'));

                }

                _t.modifyPrototype(params, function (err,res) {

                    if(err){
                        if(err.message == 'notModified') return cb(null);
                        return cb(new MyError('Не удалось обновить запись оборота cdg', {o: params, err: err}));
                    }

                    cb(null);

                });

            }, cb);



        }

    },function (err, res) {
        if (err) {
            //if(err.message == "notModified"){
            //    return cb(null, new UserOk('Ок'));
            //}
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!obj.doNotSaveRollback){
               rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'modify_', params:obj});
            }
            cb(null, new UserOk('Ок'));
        }
    });
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
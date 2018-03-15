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
	let _t = this;
	let id = obj.id;

	if (isNaN(+id)) return cb(new MyError('Не передан id', {obj: obj}));
	let rollback_key = obj.rollback_key || rollback.create();

	let calendar;
	let request_turnover;

	async.series({
		modify: (cb) => {
			obj.rollback_key = rollback_key;
			_t.modifyPrototype(obj, function (err, res) {
				if (err) return cb(null);

				id = res.id;

				cb(null, res);
			});
		},
		get: (cb) => {
			_t.getById({id: id}, function (err, res) {
				if (err) return cb(new MyError('Не удалось получить календарь', {id: id, err: err}));

				calendar = res[0];

				return cb(null);
			});
		},
        getRequestTurnover: (cb) => {
			let o = {
				command: 'get',
				object: 'request_turnover',
				params: {
					param_where: {
						financing_request_id: calendar.financing_request_id,
						month: calendar.month
					},
					collapseData: false
				}
			};

			_t.api(o, (err, res) => {
				if (err) return cb(new MyError('Не удалось получить оборот', {id: id, err: err}));

				request_turnover = res[0];

				cb(null);
			});
        },
		editRequestTurnover: (cb) => {
			let o = {
				command: 'modify',
				object: 'request_turnover',
				params: {
					id: request_turnover.id,
					work_days_count: obj.days_n
				}
			};

			_t.api(o, (err, res) => {
				if (err) return cb(new MyError('Не удалось сохранить оборот', {id: id, err: err}));

				cb(null);
			});
		}
	}, (err, res) => {
		if (err) {
			//if(err.message == "notModified"){
			//    return cb(null, new UserOk('Ок'));
			//}
			if (err.message == 'needConfirm') return cb(err);
			rollback.rollback({obj: obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
				return cb(err, err2);
			});
		} else {
			if (!obj.doNotSaveRollback) {
				rollback.save({
					rollback_key: rollback_key,
					user: _t.user,
					name: _t.name,
					name_ru: _t.name_ru || _t.name,
					method: 'modify_',
					params: obj
				});
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
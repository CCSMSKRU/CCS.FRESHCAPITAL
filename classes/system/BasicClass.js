/**
 * Created by iig on 28.11.2015.
 */
/**
 * Created by iig on 04.11.2015.
 */
var MyError = require('../../error').MyError;
var UserError = require('../../error').UserError;
var UserOk = require('../../error').UserOk;
var MySQLModel = require('../../models/system/MySQLModel');
var util = require('util');
var async = require('async');
var fs = require('fs');
var moment = require('moment');
var api = require('../../libs/api');
var Guid = require('guid');
var funcs = require('../../libs/functions');

var BasicClass = function (obj) {
    var mysqlmodel = MySQLModel.call(this, obj);
    if (mysqlmodel instanceof MyError) return mysqlmodel;
};
util.inherits(BasicClass, MySQLModel);

BasicClass.prototype.init = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var _t = this;

    BasicClass.super_.prototype.init.apply(this, [obj, function (err) {
        // Выполним инициализацию BasicClass
        if (typeof global.class_locks!=='object') global.class_locks = {};
        if (typeof global.class_locks[_t.name]!=='object') global.class_locks[_t.name] = {};
        cb(err);
    }]);
};

BasicClass.prototype.addHistory = function (obj, cb) { // Создадим запись в истории
    var _t = this;
    if (typeof cb !== 'function') throw new MyError('В addHistory не передана функция cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не передан obj', {method: 'addHistory'}));
    var id = obj.id || obj.id;
    if (!id) return cb(new MyError('В addHistory не передан id'));
    var record_ = obj.record;
    var desc;

    if (obj.deleted) desc = 'Запись удалена';
    async.series({
        getRecord: function (cb) {
            if (typeof record_=='object') return cb(null);
            _t.getById({id:id,deleted:true}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить данные для записи истории.',{id:id, err:err}));
                record_ = res[0];
                cb(null);
            });
        },
        setHistory: function (cb) {
            var o = {
                command: 'add',
                object: _t.name + '_history_log',
                params: {
                    description:desc || obj.description || obj.desc || '',
                    datetime: funcs.getDateTimeMySQL()
                }
            };

            var excludeCols = ['id','published','deleted','created','updated'];
            for (var i in record_) {
                if (excludeCols.indexOf(i)!==-1) continue;
                o.params[i] = record_[i]
            }
            for (var i in obj) {
                if (typeof obj[i] == 'object') continue;
                o.params[i] = obj[i]
            }
            o.params[_t.name.toLowerCase() + '_id'] = id;

            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось добавить запись в историю.', {
                    err: err,
                    record_id: id,
                    params: o.params
                }));
                cb(null);
            })
        }
    },cb);

};

BasicClass.prototype.lock = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id'));
    var key = obj.key || obj.lock_key || Guid.create().value;
    obj.timestart = obj.timestart || new moment();
    var locktime = obj.locktime || 10000;
    if (global.class_locks[_t.name][id]) {
        if (global.class_locks[_t.name][id].key != key){

            var diff = moment().diff(obj.timestart);
            if (diff > locktime){

                return cb(new UserError('Запись уже заблокирована другим процессом. Более 10 сек (lock)',{obj:obj, name:_t.name}));
            }
            setTimeout(function () {
                console.log('LOCK+>',_t.name);
                _t.lock(obj, cb);
            },500);
            return;
        }
    }
    global.class_locks[_t.name][id] = {
        key:key,
        timestart:obj.timestart
    };
    return cb(null, key);
};
BasicClass.prototype.unlock = function (obj, cb) {
    if (typeof cb!=='function') cb = function (err, res) {
        console.log('unlock--'+ _t.name +'--'+ obj.id +'-->',err, res);
    };
    if (typeof obj!=='object') return cb(new MyError('В метод не передан объект'));
        var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id'));
    var key = obj.key || obj.lock_key;

    
    if (!global.class_locks[_t.name][id]) return cb(null);
    if (global.class_locks[_t.name][id].key!==key) {
        return cb(new MyError('Запись не разблокирована. Неверный ключ.',{key:key}));
    }
    global.class_locks[_t.name][id] = false;
    return cb(null);
};
BasicClass.prototype.test = function () {
    setInterval(console.log('BasicClass.prototype.test'),80);
};
module.exports = BasicClass;
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
var fs = require('fs');

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

Model.prototype.rollback = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(id)) return cb(new MyError('В метод не передан id'));

    // Загружаем стек из базы
    // Выполняем стек

    if (obj.confirm != 'ПОДТВЕРЖДАЮ'){
        return cb(new UserError('needConfirm', {message: '',title:'Данная операция необратима! Для подтверждения введите "ПОДТВЕРЖДАЮ".',key:1, confirmType:'dialog',responseType:'text'}));
    }
    //global.rollbacks[rollback_key]
    var data;
    var rollback_data;
    async.series({
        get: function (cb) {
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(err);
                data = res[0];
                cb(null);
            });
        },
        getFile: function (cb) {
            if (!data) return cb(new UserError('Нет такого бекапа'));
            var path = './DB/rollbacks/';
            var filename = data.filename;
            fs.readFile(path + filename, function (err, data) {
                if (err) return cb(new MyError('Не удалось считать файл.',{err:err}));
                var rollback_dataJSON = data.toString();
                try {
                    rollback_data = JSON.parse(rollback_dataJSON);
                } catch (e) {
                    return cb(new MyError('Файл имеет не верный формат JSON', e));
                }
                return cb(null);
            });
        },
        rollback: function (cb) {
            if (!data) return cb(null);
            var rollback_key_new = data.rollbackKey || '0';
            global.rollbacks[rollback_key_new] = rollback_data;
            rollback.rollback({rollback_key:rollback_key_new, user:_t.user}, cb);

            //var o = {
            //    command: 'rollback',
            //    object: 'rollback_backup',
            //    params: {id: 25}
            //}
        }
    }, function (err) {
        if (err) return cb(err);
        cb(null, new UserOk('Изменения успешно отменены'));
    })


};

module.exports = Model;
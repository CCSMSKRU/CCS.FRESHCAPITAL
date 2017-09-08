/**
 * Created by iig on 29.10.2015.
 */
var MyError = require('../error').MyError;
var BasicClass = require('./system/BasicClass');
var util = require('util');
var async = require('async');
var api = require('../libs/api');
var rollback = require('../modules/rollback');

var Model = function(obj){
    this.name = obj.name;
    this.tableName = obj.name.toLowerCase();

    var basicclass = BasicClass.call(this, obj);
    if (basicclass instanceof MyError) return basicclass;
};
util.inherits(Model, BasicClass);
//Model.prototype.addPrototype = Model.prototype.add;

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
Model.prototype.uploadDocument = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var _t = this;
    if (!obj.filename) return cb(new MyError('Не передан filename'));
    if (!obj.id) return cb(new MyError('Не передан id'));
    var rollback_key = rollback.create();
    // После загрузки файла на сервер во временное хранилище serverUploads
    // Добавим файл в систему File.add, получим id файла.
    // Поменяем статус документа и пропишем ему file_id
    var file_id;
    async.series({
        copyFile: function (cb) {
            // Добавим файл в систему File.add, получим id файла.
            var o = {
                command: 'add',
                object: 'File',
                params: {
                    filename: obj.filename,
                    rollback_key: rollback_key
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(err);
                file_id = res.id;
                cb(null);
            });
        },
        modify: function (cb) {
            // Поменяем статус документа и пропишем ему file_id
            //obj.file_id = file_id;
            var params = {
                file_id: file_id,
                id: obj.id,
                status_sysname: 'UPLOADED',
                rollback_key: rollback_key
            };
            _t.modify(params, cb);
        }
    }, function (err, res) {
        if (err) {
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
                return cb(err, err2);
            });
        }
        //rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'uploadDocument', params:obj});
        return cb(null, res.modify);
    })
};


module.exports = Model;
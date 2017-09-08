/**
 * Created by iig on 29.10.2015.
 */
var MyError = require('../error').MyError;
var BasicClass = require('./system/BasicClass');
var util = require('util');
var api = require('../libs/api');
var Model = function(obj){
    this.name = obj.name;
    this.tableName = obj.name.toLowerCase();

    var basicclass = BasicClass.call(this, obj);
    if (basicclass instanceof MyError) return basicclass;
};
util.inherits(Model, BasicClass);
Model.prototype.removeCascade = Model.prototype.remove;
Model.prototype.addPrototype = Model.prototype.add;
Model.prototype.modifyPrototype = Model.prototype.modify;

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
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var _t = this;
    _t.addPrototype(obj, function (err, resAdd) {
        if (err) return cb(err, resAdd);
        // Очистить кеш для класса
        // Получим класс для которого меняли поле
        if (!resAdd.id) {
            console.log('\nНемогу очистить кеш. Нет id', obj);
            return cb(null, resAdd);
        }
        var params = {
            where:[
                {
                    key:'id',
                    val1:resAdd.id
                }
            ],
            collapseData:false,
            columns:['class','name']
        };
        _t.get(params, function (err, res) {
            if (err){
                console.log('\nНемогу очистить кеш.', err);
                return cb(null, resAdd);
            }
            if (typeof res!=='object'){
                console.log('\nНемогу очистить кеш. Не найдена запись', res);
                return cb(null, resAdd);
            }
            var alias = res[0].class;
            _t.api({
                command:'_clearCache',
                object:alias
            }, function (err) {
                if (err){
                    console.log('\nНемогу очистить кеш.', err);
                }
                return cb(null, resAdd);
            });
        });
    })
};
Model.prototype.modify = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var _t = this;
    _t.modifyPrototype(obj, function (err, resModify) {
        if (err) return cb(err, resModify);
        // Очистить кеш для класса
        // Получим класс для которого меняли поле
        if (!obj.id) {
            console.log('\nНемогу очистить кеш. Нет id', obj);
            return cb(null, resModify);
        }
        var params = {
            where:[
                {
                    key:'id',
                    val1:obj.id
                }
            ],
            collapseData:false,
            columns:['class','name']
        };
        _t.get(params, function (err, res) {
            if (err){
                console.log('\nНемогу очистить кеш.', err);
                return cb(null, resModify);
            }
            if (typeof res!=='object'){
                console.log('\nНемогу очистить кеш. Не найдена запись', res);
                return cb(null, resModify);
            }
            if (!res.length) {
                console.log('\nНемогу очистить кеш. Не найдена запись', res);
                return cb(null, resModify);
            }


            var alias = res[0].class;
            _t.api({
                command:'_clearCache',
                object:alias
            }, function (err) {
                if (err){
                    console.log('\nНемогу очистить кеш.', err);
                }
                return cb(null, resModify);
            });
        });
    })
};
module.exports = Model;
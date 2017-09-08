/**
 * Created by iig on 29.10.2015.
 */
var MyError = require('../error').MyError;
var BasicClass = require('./system/BasicClass');
var util = require('util');
var async = require('async');

var Model = function(obj){
    this.name = obj.name;
    this.tableName = obj.name.toLowerCase();

    var basicclass = BasicClass.call(this, obj);
    if (basicclass instanceof MyError) return basicclass;
};
util.inherits(Model, BasicClass);

var test = 'test';

Model.prototype.init = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var _t = this;
    Model.super_.prototype.init.apply(this, [obj , function (err) {
        cb(err, 'Все кончено! ))');
    }]);
};

var Report = require('../libs/Report');

Model.prototype.testReport = function (obj, cb) {
    console.log('Перед созданием экземпляра Report');
    var r1 = new Report();
    r1.testReport({}, function (err, res) {
        console.log(err, res);
        cb(err, res);
    });
};

module.exports = Model;
/**
 * Created by iig on 04.11.2015.
 */
var MyError = require('../error').MyError;
var MySQLModel = require('../models/system/MySQLModel');
var async = require('async');
var fs = require('fs');
var moment = require('moment');
var api = require('../libs/api');

var PrepareClass = function (obj) {

    var mysqlmodel = MySQLModel.call(this, obj);
    if (mysqlmodel instanceof MyError) return mysqlmodel;
};
util.inherits(PrepareClass, MySQLModel);

PrepareClass.prototype.init = function (obj, cb) {
    console.log('PrepareClass init');
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var _t = this;
    console.log('PrepareClass init');
};


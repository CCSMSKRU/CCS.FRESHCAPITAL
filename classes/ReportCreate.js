/**
 * Created by iig on 28.11.2015.
 */

var MyError = require('../error').MyError;
var UserError = require('../error').UserError;
var UserOk = require('../error').UserOk;
var async = require('async');
var fs = require('fs');
var moment = require('moment');
var api = require('../libs/api');
var Guid = require('guid');
var funcs = require('../libs/functions');
var XlsxTemplate = require('xlsx-template');

var Model = function (obj) {

};


Model.prototype.init = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    this.user = obj.user || {sid:'0'};
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var _t = this;
    cb(null);
};
Model.prototype.api = function (o, cb) {
    api(o, cb, this.user);
};

Model.prototype.generateOld = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.name;
    if (isNaN(+id)) return cb(new MyError('В метод не передан id'));

    // Загрузим файл с конкретныйм отчетом require
    // Выполним его


};

Model.prototype.report_vg = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var name = obj.name || 'report_vg.xlsx';
    //if (isNaN(+id)) return cb(new MyError('В метод не передан id'));

    var merchant_financing, data, readyData, template, binaryData, filename;
    var weekAgo = moment(moment() - moment.duration(1, 'weeks')).format('DD.MM.YYYY');
    async.series({
        getData: function (cb) {
            var o = {
                command:'get',
                object:'merchant_financing',
                params:{
                    param_where:{
                        created:funcs.getDate()
                    }
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(err);
                merchant_financing = res;
                cb(null);
            })
        },
        prepareData: function (cb) {
            readyData = {
                report_date: funcs.getDate(),
                cut_off_date: weekAgo,
                fin: []
            };
            for (var i in merchant_financing) {
                readyData.fin.push({
                    founding_amount:merchant_financing.founding_amount,
                    amount_to_return:merchant_financing.amount_to_return,
                    gross_profit:merchant_financing.amount_to_return - merchant_financing.founding_amount
                });
            }
            cb(null);
        },
        getTemplate: function (cb) {
            fs.readFile('./templates/' + name, function (err, data) {
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
            filename = '_' + name;
            fs.writeFile('./public/savedFiles/' + filename,binaryData, function (err) {
                if (err) return cb(new MyError('Не удалось записать файл testOutput.xlsx',{err:err}));
                return cb(null, new UserOk('testOutput.xlsx успешно сформирован'));
            });
        }
    }, function (err) {
        if (err) return cb(err);
        cb(null, new UserOk('Ок.',{filename:filename,path:'/savedFiles/'}));
    })


};

module.exports = Model;
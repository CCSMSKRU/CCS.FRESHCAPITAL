/**
 * Created by iig on 07.03.2017.
 */

var MyError = require('../error').MyError;
var UserOk = require('../error').UserOk;
var async = require('async');
var fs = require('fs');
var moment = require('moment');
var Excel = require('exceljs');
//https://github.com/guyonroche/exceljs

var Report = function (obj) {
    var _t = this;
    if (typeof obj!=='object') obj = {};
    console.log('Конструктор Report',obj);

    _t.name = obj.name || 'Отчет_' + moment().format('DD_MM_YYYY HH_mm_ss');
    _t.workbook = new Excel.Workbook();
    _t.workbook.views = [
        {
            x: 0, y: 0, width: 10000, height: 20000,
            firstSheet: 0, activeTab: 1, visibility: 'visible'
        }
    ]
    _t.addWorksheet();
    _t.worksheet.columns = obj.columns || (function () {
        var arr = [];
        for (var i = 0; i < (obj.columnsCount || 10); i++) {
            arr.push({key:i+1});
        }
        return arr;
    })();


};
Report.prototype.addWorksheet = function (obj) {
    if (typeof obj!=='object') obj = {};
    var _t = this;
    _t.worksheet = _t.workbook.addWorksheet(obj.name || obj.title || 'Sheet 1', {
        properties: obj.properties || {},
        pageSetup: obj.pageSetup || {paperSize: 9, orientation: 'landscape'}
    });
};
Report.prototype.addRow = function (obj) {
    if (typeof obj!=='object') obj = {};
    var _t = this;

    var params = obj.params;
    var row = obj.row || {
            1:{
                val:'Продажи'
            },
            2:{
                val:'Продажи2'
            }
        };
    var rowToAdd = {};
    for (var i in row) {
        rowToAdd[i] = row[i].val;
    }

    _t.worksheet.addRow(rowToAdd);
};
Report.prototype.writeFile = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var _t = this;
    var name_ru = obj.name_ru || _t.name_ru || _t.name || 'Тест'

    var filename = '_' + _t.name + '.xlsx';

    _t.workbook.xlsx.writeFile('./public/savedFiles/' + filename)
        .then(function() {
            // done

            console.log('Записано.');
            cb(null, new UserOk('Ок.',{filename:filename,path:'/savedFiles/',name_ru:name_ru}));
        });
    //cb(null);
};

module.exports = Report;


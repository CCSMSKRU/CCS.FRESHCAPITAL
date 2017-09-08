var fs = require('fs');
var config = require('./../config');
var async = require('async');
var moment = require('moment');
//MAX_OPEN_FILES = 256;
//MAX_OPEN_FILES = 10000000;
MAX_OPEN_FILES = 16;
__writeQueue = async.queue(function (task, callback) {
    task(callback);
}, MAX_OPEN_FILES);


/**
 * Записывает переданные данные в файл
 * @param obj
 * fileName имя файла (с путем или без)
 * flags режим в котором открывается файл (по умолчанию, дозаписывать)
 * data данные которые надо записать
 * @param callback
 */
function toFile(obj) {
    return function(callback){
        try {
            var flags = obj.flags || 'a';
            var fileName = obj.fileName || 'savedFile_' + moment().format('DD_MM_YYYY_HH_mm_ss');
            var data = obj.data || '';

            if (obj.error) {
                if (data.indexOf('saveToFile.js') != -1 || data.indexOf('EMFILE') != -1) {

                    console.log('DATA ======>\n', data);
                    var d = moment().format('DD.MM.YYYY HH:mm:ss');
                    console.log(d, 'Ошибка внутри модуля записи в файл. Записана не будет.');
                    return callback(null, fileName);
                }
            }
            //var writer = fs.createWriteStream(fileName, {flags: flags, highWaterMark: 6400000});
            var writer = fs.createWriteStream(fileName, {flags: flags, highWaterMark: 640000000});
        } catch (e) {
            //Не писать в лог файл по событию  process.on('uncaughtException'
            console.log(e);

        }
        function write(data) {
            try {
                var ok = writer.write(data, obj.encoding);
                if (!ok) {
                    writer.once('drain', write(data));
                    return;
                }
                writer.end();
            } catch (e) {
                //Не писать в лог файл по событию  process.on('uncaughtException'
            }
        }
        writer.on('finish', function () {

            if (typeof callback === "function") {
                callback(undefined, fileName);
            }
            //console.log('Запись выполнена успешно.');
        });
        writer.on('error', function (err) {
            console.log('writer error: ' + err);
            if (typeof callback === "function") {
                callback(err);
            }
        });
        try {
            write(data);
        } catch (e) {
            console.log(e);
        }
    }

}

function log(obj, callback) {
    __writeQueue.push(toFile(obj),callback);
}

exports.toFile = log;

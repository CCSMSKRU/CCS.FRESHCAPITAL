/**
 * Created by iig on 29.10.2015.
 */
var MyError = require('../error').MyError;
var UserOk = require('../error').UserOk;
var UserError = require('../error').UserError;
var BasicClass = require('./system/BasicClass');
var util = require('util');
var async = require('async');
var fs = require('fs-extra');
var parsePath = require('parse-filepath');
var Guid = require('guid');
var moment = require('moment');
var rollback = require('../modules/rollback');

var Model = function(obj){
    this.name = obj.name;
    this.tableName = obj.name.toLowerCase();

    var basicclass = BasicClass.call(this, obj);
    if (basicclass instanceof MyError) return basicclass;
};
util.inherits(Model, BasicClass);
Model.prototype.addPrototype = Model.prototype.add;
Model.prototype.getPrototype = Model.prototype.get;

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

/**
 * Перед тем как добавить запись в базу, переместим файл из serverUploads в files
 * Запишем в базу его путь/ расширение/ прочую инфу
 * Вернем id для дальнейшего использования.
 * @param obj
 * @param cb
 */
Model.prototype.add = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    var _t = this;
    var newFilename = Guid.create().value;
    var filename = obj.filename;
    delete obj.filename;
    if (!filename) return cb(new MyError('Не передан filename'));
    //var dirname = parsePath(filename).dirname;
    var file_ext = parsePath(filename).extname;
    var file_name = parsePath(filename).name;
    var source_file_dir = obj.source_file_dir || 'serverUploads';
    var sourceFile = './' + source_file_dir + '/'+ file_name + file_ext;
    var resultPath = './files/';
    var resultFile = newFilename + file_ext;
    async.series({
        copyFile: function (cb) {
            // Скопируем файл

            fs.access(sourceFile, function (err) {
                if (err) return cb(new MyError('Файл не загружен'), {
                    err: err,
                    sourceFile: sourceFile,
                    resultFile: resultFile,
                    resultPath: resultPath
                });
                fs.copy(sourceFile, resultPath + resultFile, function (err) {
                    if (err) return cb(new MyError('Не удалось записать файл', {
                        err: err,
                        sourceFile: sourceFile,
                        resultFile: resultFile,
                        resultPath: resultPath
                    }));
                    return cb(null, {
                        filename: resultFile,
                        ext: file_ext,
                        path: resultPath
                    });
                });
            });
        },
        remove: function (cb) {
            if (obj.doNotRemove) return cb(null);
            fs.remove(sourceFile, function (err) {
                if (err) return cb(new MyError('Не удалось удалить исходный файл.',{err:err}));
                return cb(null);
            });
        },
        add: function (cb) {
            // Запишем в базу его путь/ расширение/ прочую инфу
            obj.filename = newFilename;
            obj.filepath = resultPath;
            obj.extension = file_ext;
            _t.addPrototype(obj, function (err, res) {
                if (err) return cb(err);
                return cb(null, res);
            });
        }
    }, function (err, res) {
        if (err) return cb(err);
        console.log('ID: ',res.add.id);
        cb(null, res.add);
    });
    //var o = {
    //    command:'add',
    //    object:'File',
    //    params:{
    //        filename:'file1.jpg'
    //    }
    //};
    //socketQuery(o, function (res) {
    //    console.log(res);
    //})
};

/**
 * Функция возвращает файл, если находит такой в системе
 * @param obj
 * @param cb
 */
Model.prototype.download = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    var _t = this;
    var file_id = obj.id;
    if (!file_id) return cb(new MyError('Не передан id файла'));
    var file_data, file, filename;
    var io = global.io;
    // Получим данные о файле из таблицы file
    // Получим сам файл если существует
    // Формируем UID и возвращаем его клиенту
    async.series([
        function (cb) {
            // Получим данные о файле из таблицы file
            _t.getById({id:file_id}, function (err, res) {
                if (err) return cb(new MyError('Во время запроса информации по файлу возникла ош.', {err:err}));
                if (!res.length) return cb(new UserError('Файл не существует или у вас нет к нему доступа.'));
                file_data = res[0];
                cb(null);
            });
        },
        function (cb) {
            // Получим сам файл если существует
            filename = file_data.filename + file_data.extension;
            //var delivery = dl.listen(global);
            var sid = _t.user.sid;
            global.downloads[sid] = (typeof global.downloads[sid] == 'object')? global.downloads[sid] : {};
            global.downloads[sid][filename] = moment();
            //global.downloads.push('4e2cab25-bd67-bb57-7d7d-4d40d406d3d4.jpg');
            cb(null);
        }
    ], function (err) {
        if (err) return cb(err);
        cb(null, new UserOk('Файл скоро будет загружен.',{filename:filename, path:file_data.filepath, name:(file_data.name || file_data.filename), extension:file_data.extension}));
    });
    //var o = {
    //    command:'download',
    //    object:'File',
    //    params:{
    //        id:1
    //    }
    //};
    // socketQuery(o, function (res) {console.log(res);})
};


// var o = {
//     command:'copy',
//     object:'File',
//     params:{
//         id:18
//     }
// };
// socketQuery(o, function(r){
//     console.log(r);
// })

Model.prototype.copy = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();

    var source_file;
    async.series({
        get:function(cb){
            _t.getById({id:id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить файл.',{id:id,err:err}));
                source_file = res[0];
                cb(null);
            });
        },
        copy:function(cb){
            var params = {
                name:source_file.name,
                absolute_path:source_file.absolute_path,
                filename:source_file.filename + source_file.extension,
                source_file_dir:'files',
                doNotRemove:true,
                rollback_key:rollback_key
            };
            _t.add(params, function(err, res){
                if (err) return cb(new MyError('Не удалось добавить файл.',{err:err, params:params}));
                cb(null, res);
            })
        }
    },function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            if (!obj.doNotSaveRollback){
               rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'copy', params:obj});
            }
            cb(null, new UserOk('Ок', {id:res.copy.id}));
        }
    });
};


module.exports = Model;
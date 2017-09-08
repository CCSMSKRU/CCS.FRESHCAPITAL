/**
 * Created by iig on 29.10.2015.
 */
var MyError = require('../error').MyError;
var UserOk = require('../error').UserOk;
var UserError = require('../error').UserError;
var BasicClass = require('./system/BasicClass');
var util = require('util');
var api = require('../libs/api');
var async = require('async');
var funcs = require('../libs/functions');

var Model = function(obj){
    this.name = obj.name;
    this.tableName = obj.name.toLowerCase();

    var basicclass = BasicClass.call(this, obj);
    if (basicclass instanceof MyError) return basicclass;
};
util.inherits(Model, BasicClass);

Model.prototype.removePrototype = Model.prototype.remove;

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
Model.prototype.remove = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var className;
    if (obj.removePrototype) return _t.removePrototype(obj, cb);
    async.series({
        getClassName: function (cb) {
            // Получим имя класса
            _t.getById({
                columns: ['name'],
                id: obj.id
            }, function (err, res) {
                if (err) return cb(new UserError('Не удалось получить имя Класса', err));
                if (!res.length) return cb(new UserError('Класс не найден'));
                className = res[0].name;
                cb(null);
            })
        },
        dropTable: function (cb) {
            // Запустим drop Table
            var o = {
                command: 'drop',
                object: 'Table',
                params: obj
            };

            o.params.name = className;
            _t.api(o, function (err, res) { // Здесь нельзя сократить до cb
                return cb(err, res);
            });
        }
    }, function (err, res) {
        cb(err, res.dropTable);
    });
    //var o = {
    //    command:'drop',
    //    object:'Table',
    //    params:obj
    //};
    //
    //o.params.name = _t.name;
    //_t.api(o, cb);
};
Model.prototype.removeCascade = Model.prototype.remove;

Model.prototype.modify = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы параметры'));
    var _t = this;
    _t.modifyPrototype(obj, function (err, resModify) {
        if (!err){
            // получить класс и клиентский объект по id
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
                columns:['name']
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
                if (!res.length) return cb(null); // Когда удаляем сам класс
                var alias = res[0].name;
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
        }else{
            return cb(err, resModify);
        }
    })
};
/**
 * Сихронизировать настройки полей client_object_fields_profile с class_fields_profile(эталон)
 * sync_fields - поля которые нужно синхронизировать
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.sync_class_CFP_and_COFP = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы параметры'));
    var _t = this;
    var sync_fields = obj.sync_fields;
    if (!sync_fields) return cb(null, new UserError('Поля для синхронизации не указаны'));
    if (typeof sync_fields!=='object'){
        sync_fields = sync_fields.split(',');
    }
    // Удалим column_name из списка
    var column_name_index = sync_fields.indexOf('column_name');
    if (column_name_index!==-1) {
        delete sync_fields[column_name_index];
        funcs.clearEmpty(sync_fields);
    }


    var CFP_id, CFP, COFP_id, COFP;
    // Загрузим информацию из CFP по классу class_fields_profile
    // Загрузим информацию из CFP по классу client_object_fields_profile
    // Найдем изменения
    // Обновим CFP по client_object_fields_profile если есть отличия от class_fields_profile
    async.series([
        function (cb) {
            // Загрузим информацию из CFP по классу class_fields_profile
            async.waterfall([
                function (cb) {
                    // Получим id (class_id) class_fields_profile из class_profile
                    var o = {
                        command:'get',
                        object:'class_profile',
                        params:{
                            collapseData:false,
                            columns:['id'],
                            where:[
                                {
                                    key:'name',
                                    val1:'class_fields_profile'
                                }
                            ]
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить class_id для class_fields_profile', err));
                        if (!res.length) return cb(new MyError('В class_profile нет записи для class_fields_profile'));
                        CFP_id = res[0].id;
                        cb(null);
                    })
                },
                pool.getConn,
                function (conn, cb) {
                    var sql = 'SELECT column_name,' + sync_fields.join(',') + ' FROM class_fields_profile WHERE class_id = ' + CFP_id;
                    conn.query(sql, function (err, res) {
                        conn.release();
                        if (err) return cb(new UserError('Некоторые из указаных полей не существуют для class_fields_profile', err));
                        CFP = res;
                        cb(null);
                    })
                }
            ],cb);

        },
        function (cb) {
            // Загрузим информацию из CFP по классу client_object_fields_profile
            async.waterfall([
                function (cb) {
                    // Получим id (class_id) client_object_fields_profile из class_profile
                    var o = {
                        command:'get',
                        object:'class_profile',
                        params:{
                            collapseData:false,
                            columns:['id'],
                            where:[
                                {
                                    key:'name',
                                    val1:'client_object_fields_profile'
                                }
                            ]
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) return cb(new MyError('Не удалось получить class_id для client_object_fields_profile', err));
                        if (!res.length) return cb(new MyError('В class_profile нет записи для client_object_fields_profile'));
                        COFP_id = res[0].id;
                        cb(null);
                    })
                },
                pool.getConn,
                function (conn, cb) {
                    var sql = 'SELECT id,column_name,' + sync_fields.join(',') + ' FROM class_fields_profile WHERE class_id = ' + COFP_id;
                    conn.query(sql, function (err, res) {
                        conn.release();
                        if (err) return cb(new MyError('Некоторые из указаных полей не существуют для client_object_fields_profile', err));
                        COFP = res;
                        cb(null);
                    })
                }
            ],cb);

        },
        function (cb) {
            // Найдем изменения
            var toModify = [];
            for (var i in CFP) {
                var Ccol = CFP[i];
                for (var j in COFP) {
                    var COcol = COFP[j];
                    if (Ccol.column_name == COcol.column_name){
                        for (var k in sync_fields) {
                            if (COcol[sync_fields[k]]!==Ccol[sync_fields[k]]){
                                var modyfyObj = {
                                    id:COcol.id
                                };
                                modyfyObj[sync_fields[k]] = Ccol[sync_fields[k]];
                                toModify.push(modyfyObj);
                            }
                        }
                    }
                }
            }
            // Обновим CFP по client_object_fields_profile если есть отличия от class_fields_profile
            async.eachSeries(toModify, function (item, cb) {
                async.waterfall([
                    pool.getConn,
                    function (conn, cb) {
                        conn.update('class_fields_profile', item, function (err) {
                            conn.release();
                            cb(err);
                        });
                    }
                ], cb);
            }, cb);
        }
    ], function (err, res) {
        if (err) return cb(new MyError('Во время синхронизации возникла ошибка', {err:err, res:res}));
        cb(null, UserOk('Синхронизация проведена успешно.'));
    });
};


/**
 * Тоже что и функция выше, только наоборот
 * Сихронизировать настройки полей class_fields_profile с client_object_fields_profile(эталон)
 * sync_fields - поля которые нужно синхронизировать
 * @param obj
 * @param cb
 * @returns {*}
 */
//Model.prototype.sync_class_COFP_and_CFP = function (obj, cb) {
//    if (arguments.length == 1) {
//        cb = arguments[0];
//        obj = {};
//    }
//    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
//    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы параметры'));
//    var _t = this;
//    var sync_fields = obj.sync_fields;
//    if (!sync_fields) return cb(null, new UserError('Поля для синхронизации не указаны'));
//    if (typeof sync_fields!=='object'){
//        sync_fields = sync_fields.split(',');
//    }
//    // Удалим column_name из списка
//    var column_name_index = sync_fields.indexOf('column_name');
//    if (column_name_index!==-1) {
//        delete sync_fields[column_name_index];
//        funcs.clearEmpty(sync_fields);
//    }
//
//
//    var CFP_id, CFP, COFP_id, COFP;
//    // Загрузим информацию из CFP по классу class_fields_profile
//    // Загрузим информацию из CFP по классу client_object_fields_profile
//    // Найдем изменения
//    // Обновим CFP по client_object_fields_profile если есть отличия от class_fields_profile
//    async.series([
//        function (cb) {
//            // Загрузим информацию из CFP по классу class_fields_profile
//            async.waterfall([
//                function (cb) {
//                    // Получим id (class_id) class_fields_profile из class_profile
//                    var o = {
//                        command:'get',
//                        object:'class_profile',
//                        params:{
//                            collapseData:false,
//                            columns:['id'],
//                            where:[
//                                {
//                                    key:'name',
//                                    val1:'class_fields_profile'
//                                }
//                            ]
//                        }
//                    };
//                    api(o, function (err, res) {
//                        if (err) return cb(new MyError('Не удалось получить class_id для class_fields_profile', err));
//                        if (!res.length) return cb(new MyError('В class_profile нет записи для class_fields_profile'));
//                        CFP_id = res[0].id;
//                        cb(null);
//                    })
//                },
//                pool.getConn,
//                function (conn, cb) {
//                    var sql = 'SELECT id,column_name,' + sync_fields.join(',') + ' FROM class_fields_profile WHERE class_id = ' + CFP_id;
//                    conn.query(sql, function (err, res) {
//                        conn.release();
//                        if (err) return cb(new UserError('Некоторые из указаных полей не существуют для class_fields_profile', err));
//                        CFP = res;
//                        cb(null);
//                    })
//                }
//            ],cb);
//
//        },
//        function (cb) {
//            // Загрузим информацию из CFP по классу client_object_fields_profile
//            async.waterfall([
//                function (cb) {
//                    // Получим id (class_id) client_object_fields_profile из class_profile
//                    var o = {
//                        command:'get',
//                        object:'class_profile',
//                        params:{
//                            collapseData:false,
//                            columns:['id'],
//                            where:[
//                                {
//                                    key:'name',
//                                    val1:'client_object_fields_profile'
//                                }
//                            ]
//                        }
//                    };
//                    api(o, function (err, res) {
//                        if (err) return cb(new MyError('Не удалось получить class_id для client_object_fields_profile', err));
//                        if (!res.length) return cb(new MyError('В class_profile нет записи для client_object_fields_profile'));
//                        COFP_id = res[0].id;
//                        cb(null);
//                    })
//                },
//                pool.getConn,
//                function (conn, cb) {
//                    var sql = 'SELECT column_name,' + sync_fields.join(',') + ' FROM class_fields_profile WHERE class_id = ' + COFP_id;
//                    conn.query(sql, function (err, res) {
//                        conn.release();
//                        if (err) return cb(new MyError('Некоторые из указаных полей не существуют для client_object_fields_profile', err));
//                        COFP = res;
//                        cb(null);
//                    })
//                }
//            ],cb);
//
//        },
//        function (cb) {
//            // Найдем изменения
//            var toModify = [];
//            for (var i in COFP) {
//                var COcol = COFP[i];
//                for (var j in CFP) {
//                    var Ccol = CFP[j];
//                    if (Ccol.column_name == COcol.column_name){
//                        for (var k in sync_fields) {
//                            if (COcol[sync_fields[k]]!==Ccol[sync_fields[k]]){
//                                var modyfyObj = {
//                                    id:Ccol.id
//                                };
//                                modyfyObj[sync_fields[k]] = COcol[sync_fields[k]];
//                                toModify.push(modyfyObj);
//                            }
//                        }
//                    }
//                }
//            }
//
//            // Обновим COFP по class_fields_profile если есть отличия от client_object_fields_profile
//            async.eachSeries(toModify, function (item, cb) {
//                async.waterfall([
//                    pool.getConn,
//                    function (conn, cb) {
//                        conn.update('class_fields_profile', item, function (err) {
//                            conn.release();
//                            cb(err);
//                        });
//                    }
//                ], cb);
//            }, cb);
//        }
//    ], function (err, res) {
//        if (err) return cb(new MyError('Во время синхронизации возникла ошибка', {err:err, res:res}));
//        cb(null, UserOk('Синхронизация проведена успешно.'));
//    });
//};


module.exports = Model;
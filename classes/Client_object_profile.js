/**
 * Created by iig on 29.10.2015.
 */
var MyError = require('../error').MyError;
var UserError = require('../error').UserError;
var UserOk = require('../error').UserOk;
var BasicClass = require('./system/BasicClass');
var util = require('util');
var api = require('../libs/api');
var funcs = require('../libs/functions');
var async = require('async');

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
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы параметры'));
    var _t = this;
    var class_id = obj.class_id;
    if (!class_id) return cb(new MyError('Не передано ключевое поле class_id'));
    var class_profile, addClientObjectProfileRes, client_object_id;
    // Получим запись из class_profile
    // Переложим объект и добавим
    async. series([
        function (cb) {
            // Получим запись из class_profile
            var o = {
                command:'get',
                object:'class_profile',
                params:{
                    where:[
                        {
                            key:'id',
                            val1:class_id
                        }
                    ],
                    collapseData: false,
                    use_cache:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить профиль класса',err));
                if (!res.length) return cb(new UserError('Нет профиля для этого класса', {class_id:class_id}));
                class_profile = res[0];
                cb(null);
            });
        },
        function (cb) {
            // Переложим объект и добавим
            var excludeCols = ['id','published','deleted','created','updated','name'];
            for (var col in class_profile) {
                if (excludeCols.indexOf(col)!==-1) continue;
                obj[col] = (typeof obj[col]!=='undefined' && obj[col]!=='')? obj[col] : class_profile[col];
                if (typeof obj[col]==='undefined') delete obj[col];
            }
            _t.addPrototype(obj, function (err, res) {
                if (err) {
                    return cb(err);
                    /*if (err.code == "ER_DUP_ENTRY") return cb(new UserError('Такой клиентский .',{fields:needAdd}));
                    return cb(new MyError('Не удалось добавить клиентский объект.', err));*/
                }
                addClientObjectProfileRes = res;
                client_object_id = res.id;
                cb(null);
            });
        },
        function (cb) {
            //  ------ Синхронизируем поля клиентского объекта;
            var o = {
                class_id:class_id,
                client_object_id:client_object_id
            };
            _t.syncFieldsProfile(o, cb);
        }
    ], function (err) {
        if (err){
            return cb(err, {id:client_object_id});
        }
        return cb(null, addClientObjectProfileRes);
    });
};
Model.prototype.syncFieldsProfile = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы параметры'));
    var _t = this;
    var set_default = obj.set_default;
    var class_id = obj.class_id;
    var client_object_id = obj.client_object_id;
    if (!class_id) return cb(new MyError('Не передано ключевое поле class_id'));
    if (!client_object_id) return cb(new MyError('Не передано ключевое поле client_object_id'));
    var sync_fields = obj.sync_fields;
    var remove_fields = obj.remove_fields;
    var remove_fields_physical = obj.remove_fields_physical;


    // Загрузить поля для класса
    // Загрузить поля для клиентского объекта
    // найти поля для добавления
    // найти поля для модификации
    // найти поля для удаления
    var class_fields_profile_res, client_object_fields_profile_res;
    async.series([
        function (cb) {
            // Загрузить поля для класса
            var o = {
                command:'get',
                object:'class_fields_profile',
                params:{
                    where:[
                        {
                            key:'class_id',
                            val1:class_id
                        }
                    ],
                    deleted:true,
                    collapseData:false,
                    use_cache:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить профайл полей для класса.', err));
                class_fields_profile_res = res;
                return cb(null);
            });
        },
        function (cb) {
            // Загрузить поля для клиентского объекта
            var o = {
                command:'get',
                object:'client_object_fields_profile',
                params:{
                    where:[
                        {
                            key:'client_object_id',
                            val1:client_object_id
                        }
                    ],
                    deleted:true,
                    collapseData:false,
                    use_cache:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось запросить уже существующие поля клиентского объекта.', err));
                client_object_fields_profile_res = res || [];
                return cb(null);
            });
        },
        function (cb) {
            var toAdd = [];
            var toModify = [];
            var toRemove = [];
            // найти поля для добавления
            // найти поля для модификации
            // найти поля для удаления

            for (var i in class_fields_profile_res) {
                var col = class_fields_profile_res[i];
                if (typeof col!=='object') continue;


                var finded = false;
                for (var j in client_object_fields_profile_res) {
                    var colCO = client_object_fields_profile_res[j];
                    if (col.column_name == colCO.column_name){
                        finded = true;
                        toModify.push({col:col,colCO:colCO});
                        client_object_fields_profile_res[j].doNotRemove = true; // остануться только не существующие в классе ---> toRemove
                        break;
                    }
                }
                if (!finded){
                    toAdd.push(col);
                }
            }
            for (var k in client_object_fields_profile_res) {
                if (!client_object_fields_profile_res[k].doNotRemove) {
                    toRemove.push(client_object_fields_profile_res[k]);
                }
            }
            async.series([
                function (cb) {
                    // добавим
                    var excludeCols = ['id','published','deleted','created','updated'];
                    async.eachSeries(toAdd, function (item, cb) {
                        var o = {
                            command:'add',
                            object:'client_object_fields_profile',
                            params:{
                                client_object_id:client_object_id
                            }
                        };
                        for (var i in item) {
                            if (excludeCols.indexOf(i)!==-1) continue;
                            if (typeof item[i] === 'undefined' || item[i] == '') continue;
                            o.params[i] = item[i];
                        }
                        _t.api(o, function (err, res) {
                            if (err) return cb(new MyError('Не удалось добавить поле в client_object_fields_profile.', err));
                            return cb(null);
                        });
                    }, cb)
                },
                function (cb) {
                    // изменим если есть параметр set_default
                    if (!sync_fields) {
                        return cb(null);
                    }
                    async.eachSeries(toModify, function (item, cb) {
                        // Найти отличия
                        if (typeof sync_fields!=='object'){
                            sync_fields = sync_fields.split(',');
                        }
                        //sync_fields = (typeof sync_fields!=='object')? sync_fields.split(',') : sync_fields;
                        var params;
                        var excludeCols = ['id','published','deleted','created','updated'/*,'class_id','class'*/];
                        for (var i in item.col) {
                            if (excludeCols.indexOf(i)!==-1) continue;
                            if (item.colCO[i]!==item.col[i]){
                                if (sync_fields[0] == "*" || sync_fields.indexOf(i)!==-1){
                                    if (!params) params = {};
                                    params[i] = item.col[i];
                                }
                            }
                        }
                        if (params){
                            params['id'] = item.colCO.id;
                            var o = {
                                command:'modify',
                                object:'client_object_fields_profile',
                                params:params
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось измненить поле в client_object_fields_profile.', err));
                                return cb(null);
                            });
                        }else{
                            cb(null);
                        }
                    }, cb);
                },
                function (cb) {
                    if (!remove_fields){
                        return cb(null);
                    }
                    // Удалим
                    async.eachSeries(toRemove, function (item, cb) {
                        if (typeof item!=='object') return cb(null);
                        if (isNaN(item.id)) return cb(new MyError('Не удалось удалить поле клиентского объекта. У поля нет id. Не нормальная ситуация)'));
                        var o = {
                            command:'remove',
                            object:'client_object_fields_profile',
                            params:{
                                id:item.id,
                                physical:false
                            }
                        };
                        if (remove_fields_physical) o.params.physical = true;
                        _t.api(o, function (err, res) {
                            if (err) return cb(new MyError('Не удалось удалить поле в client_object_fields_profile.', err));
                            return cb(null);
                        });
                    }, cb);
                }

            ], cb)
        }
    ], function (err) {
        if (err) return cb(new UserError('Во время синхронизации возникли ошибки. см. консоль.', err));
        return cb(null, new UserOk('Синхронизация полей клиентского объекта проведена успешно.'));
    })
};
/**
 * Обновляет класс на основе клиентского объекта
 * Только настройки полей
 * @param obj
 * @param cb
 * @returns {*}
 */
Model.prototype.syncFieldsProfileToClass = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы параметры'));
    var _t = this;

    var confirm = obj.confirm;
    delete obj.confirm;
    if (!confirm) return cb(new UserError('needConfirm', {message: 'Эта операция требует подтверждения. Вы уверены, что хотите это сделать?'}));

    var class_id = obj.class_id;
    var client_object_id = obj.client_object_id;
    if (!class_id) return cb(new MyError('Не передано ключевое поле class_id'));
    if (!client_object_id) return cb(new MyError('Не передано ключевое поле client_object_id'));
    var sync_fields = obj.sync_fields;


    // Загрузить поля для класса
    // Загрузить поля для клиентского объекта
    // найти поля для модификации
    var class_fields_profile_res, client_object_fields_profile_res;
    async.series([
        function (cb) {
            // Загрузить поля для класса
            var o = {
                command:'get',
                object:'class_fields_profile',
                params:{
                    where:[
                        {
                            key:'class_id',
                            val1:class_id
                        }
                    ],
                    deleted:true,
                    collapseData:false,
                    use_cache:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить профайл полей для класса.', err));
                class_fields_profile_res = res;
                return cb(null);
            });
        },
        function (cb) {
            // Загрузить поля для клиентского объекта
            var o = {
                command:'get',
                object:'client_object_fields_profile',
                params:{
                    where:[
                        {
                            key:'client_object_id',
                            val1:client_object_id
                        }
                    ],
                    deleted:true,
                    collapseData:false,
                    use_cache:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось запросить уже существующие поля клиентского объекта.', err));
                client_object_fields_profile_res = res || [];
                return cb(null);
            });
        },
        function (cb) {
            var toModify = [];
            // найти поля для добавления
            // найти поля для модификации
            // найти поля для удаления

            for (var i in class_fields_profile_res) {
                var col = class_fields_profile_res[i];
                if (typeof col!=='object') continue;


                var finded = false;
                for (var j in client_object_fields_profile_res) {
                    var colCO = client_object_fields_profile_res[j];
                    if (col.column_name == colCO.column_name){
                        finded = true;
                        toModify.push({col:col,colCO:colCO});
                        break;
                    }
                }
            }

            async.series([
                function (cb) {
                    // изменим
                    if (!sync_fields) {
                        return cb(null);
                    }
                    async.eachSeries(toModify, function (item, cb) {
                        // Найти отличия
                        if (typeof sync_fields!=='object'){
                            sync_fields = sync_fields.split(',');
                        }
                        //sync_fields = (typeof sync_fields!=='object')? sync_fields.split(',') : sync_fields;
                        var params;
                        var excludeCols = ['id','published','deleted','created','updated'/*,'class_id','class'*/];
                        for (var i in item.col) {
                            if (excludeCols.indexOf(i)!==-1) continue;
                            if (item.colCO[i]!==item.col[i]){
                                if (sync_fields[0] == "*" || sync_fields.indexOf(i)!==-1){
                                    if (!params) params = {};
                                    params[i] = item.colCO[i];
                                }
                            }
                        }
                        if (params){
                            params['id'] = item.col.id;
                            var o = {
                                command:'modify',
                                object:'class_fields_profile',
                                params:params
                            };
                            _t.api(o, function (err, res) {
                                if (err) return cb(new MyError('Не удалось измненить поле в client_object_fields_profile.', err));
                                return cb(null);
                            });
                        }else{
                            cb(null);
                        }
                    }, cb);
                }
            ], cb)
        }
    ], function (err) {
        if (err) return cb(new UserError('Во время синхронизации возникли ошибки. см. консоль.', err));
        return cb(null, new UserOk('Синхронизация полей клиентского объекта проведена успешно.'));
    })
};
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
                deleted:true,
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
                if (!res.length){
                    console.log('\nНемогу очистить кеш. Не найдена запись', res);
                    return cb(null, resModify);
                }
                var alias = res[0].class;
                var client_object_alias = res[0].name;
                _t.api({
                    command:'_clearCache',
                    object:alias,
                    client_object:client_object_alias
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
module.exports = Model;
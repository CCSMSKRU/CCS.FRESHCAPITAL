/**
 * Created by iig on 01.02.2016.
 */
var MyError = require('../error').MyError;
var api = require('../libs/api');
var async = require('async');
var Guid = require('guid');
var funcs = require('../libs/functions');
var moment = require('moment');
var fs = require('fs');

if (!Array.isArray(global.rollbacks)) global.rollbacks = [];
var rollback = {
    create: function () {
        var rollback_key = Guid.create().value;
        global.rollbacks[rollback_key] = [];
        return rollback_key;
    },
    add: function (rollback_key, obj, cb) {
        if (typeof cb!=='function') throw new MyError('В модуль rollback add не передан cb');
        if (typeof rollback_key!=='string') cb(new MyError('В модуль rollback add не передан rollback_key'));
        if (typeof obj!=='object') cb(new MyError('В модуль rollback add не передан объект'));
        if (!Array.isArray(global.rollbacks[rollback_key])) cb(new MyError('rollback: Не валидный rollback_key'));
        var user = obj.params.user;
        delete obj.params.user;
        if (obj.type =='modify'){
            // необходимо запросить текущие значения. Во всех остальных случаях, сразу добавим запись в стек и выполним cb
            var columns = [];
            for (var i in obj.obj) {
                columns.push(i);
            }
            var o = {
                command:'get',
                object:obj.params.object,
                params:{
                    collapseData:false,
                    columns:columns,
                    where:[
                        {
                            key:'id',
                            val1:obj.params.id
                        }
                    ]
                }
            };

            api(o, function (err, res) {
                if (err) return cb(err);
                if (!res.length) {
                    console.log('rollback.add: Не найдена запись с такими параметрами для сохранения текущего значения.',o); //  Вероятно запись уже была удалена
                    return cb(new MyError('rollback.add: Не найдена запись с такими параметрами для сохранения текущего значения.',{o:o}));
                }
                obj.oldValue = res[0];
                global.rollbacks[rollback_key].push(obj);
                cb(null, global.rollbacks[rollback_key].length-1);
            }, user);
        }else{
            global.rollbacks[rollback_key].push(obj);
            return cb(null, global.rollbacks[rollback_key].length-1);
        }
    },
    remove: function (rollback_key, rollback_index) {
        if (!Array.isArray(global.rollbacks[rollback_key])) return;
        delete global.rollbacks[rollback_key][rollback_index];
        funcs.clearEmpty(global.rollbacks[rollback_key]);
    },
    save: function (obj, cb) {
        if (typeof cb!=='function') cb = function () {};
        var rollback_key = (typeof obj==='string')? obj : (typeof obj==='object')? obj.rollback_key : false;
        if (!rollback_key) return cb(new MyError('В модуль rollback метод save не передан rollback_key'));
        var _t = this;
        var stack = funcs.cloneObj(global.rollbacks[rollback_key]);
        //delete global.rollbacks[rollback_key]; // Нельзя удалять, может еще использоваться.
        if (!Array.isArray(stack)) return cb(null, 'стек пуст');

        var user = obj.user;
        delete obj.user;
        var path = './DB/rollbacks/';
        var filename = rollback_key + moment().format('DDMMYYYY_HHmmss') + '.json';

        async.series({
            saveToFile: function (cb) {
                fs.writeFile(path + filename, JSON.stringify(stack), function (err) {
                    if (err) {
                        console.log(filename, err);
                        return cb(new MyError('Не удалось записать файл',{filename:filename, err:err}));
                    }
                    cb(null);
                })
            },
            saveToBase: function (cb) {
                var o = {
                    command:'add',
                    object:'rollback_backup',
                    params:{
                        rollbackKey:rollback_key,
                        class_name:obj.name,
                        class_name_ru:obj.name_ru,
                        method:obj.method,
                        params:(typeof obj.params=='object')? JSON.stringify(obj.params) : "{}",
                        //rollback_data:JSON.stringify(stack)
                        filename:filename
                    }
                };
                api(o, function (err, res) {
                    if (err) return cb(err);
                    cb(null);
                }, user);
            }
        },cb);
    },
    rollback: function (obj, cb) {
        if (typeof cb!=='function') throw new MyError('В модуль rollback метод rollback не передана cb');
        var rollback_key = (typeof obj==='string')? obj : (typeof obj==='object')? obj.rollback_key : false;
        if (!rollback_key) return cb(new MyError('В модуль rollback метод rollback не передан rollback_key'));
        var _t = this;
        if (typeof obj == 'object'){
            if (typeof obj.obj == 'object'){
                if (obj.obj.doNotSaveRollback) return cb(null, 'Вызов роллбека из дочерней функции. Не делаем роллбек');
            }
        }
        var stack = funcs.cloneObj(global.rollbacks[rollback_key]);
        delete global.rollbacks[rollback_key];
        if (!Array.isArray(stack)) return cb(null, 'стек пуст');
        console.log('STACK =---->', stack);
        async.eachSeries(stack, function (item, cb) {
            if (typeof item!=='object') return cb(null);
            if (!item.params.object) throw new MyError('Не указан object');
            if (!item.params.id) throw new MyError('Не указан id');
            var o;
            var type = item.type;
            // В зависимости от типа будем проводить ту или иную операцию по коллбеку

            var user = (typeof obj=='object')? obj.user || item.params.user : item.params.user;
            switch (type){
                case 'add':
                    // Для типа add нужно выполнить обратную операцию -> удаление.
                    o = {
                        command:'remove',
                        object:item.params.object,
                        params:{
                            physical:true,
                            id:item.params.id
                        }
                    };
                    api(o, function(err){
                        if (err) {
                            // TODO повторять попытку несколько раз.
                            return cb(err);
                        }
                        return cb(null);
                    }, user);
                break;
                case 'modify':
                    // Для типа modify нужно сравнить изменившиеся поля или просто записать сохраненные значения
                    o = {
                        command:'modify',
                        object:item.params.object,
                        params:item.oldValue
                    };
                    o.params.rollback_key = false;
                    api(o, function(err){
                        if (err) {
                            // TODO повторять попытку несколько раз.
                            if (err.message == 'notModified'){
                                console.log('ROLLBACK NO CRIT ERROR', o, err);
                                return cb(null);
                            }
                            return cb(err);
                        }
                        return cb(null);
                    }, user);
                break;
                case 'remove':
                    // Для типа remove нужно выполнить обратную операцию -> восстановить запись - deleted set to null.
                    o = {
                        command:'modifyToRemove',
                        object:item.params.object,
                        params:{
                            id:item.params.id,
                            deleted:null
                        }
                    };
                    api(o, function(err){
                        if (err) {
                            // TODO повторять попытку несколько раз.
                            return cb(err);
                        }
                        return cb(null);
                    }, user);
                break;
            }
        }, cb);
    }
};

module.exports = rollback;
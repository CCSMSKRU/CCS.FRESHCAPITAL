/**
 * Created by iig on 04.11.2015.
 */
var MyError = require('../error').MyError;
var async = require('async');
var fs = require('fs');
var moment = require('moment');
var api = require('../libs/api');

module.exports = function (modelName, params, cb) {
    if (typeof modelName!=='string') throw new MyError('Не указано имя модели');
    if (arguments.length == 2){
        cb = arguments[1];
        params = {};
    }
    var _t = this;
    if (typeof cb!=='function') throw new MyError('В конструктор не передана функция callback');
    if (typeof params!=='object') return cb(new MyError('В конструктор не переданы params'));
    var object = params.object;
    var client_object = params.client_object;
    params = params.object_params || {};
    async.waterfall(
        [
            function (cb) {
                // если есть клиентский объект, подготовим параметры

                if (!client_object || object=='Client_object') return cb(null, params);
                console.log('==getModelInfo===>====>=====>======>=========>===========>==============>');
                api({command:'getModelInfo', object:'Client_object', params:{client_object:client_object, object:object}}, function (err,res) {
                    cb(err, res);
                });
            },
            function (obj, cb) {
                var path = './models/' + modelName + '.js';
                fs.access(path, function (err) {
                    if (err) return cb(new MyError('Такой модели не существует.', modelName));
                    var Model = require('../models/'+modelName);
                    obj.class = _t;
                    new Model(obj, function(err, model){
                        if (err) return cb(err);
                        _t.model = model;

                        for (var i in model) {
                            _t[i] = model[i];
                        }
                        _t.getFunctionsList = function (obj, cb) {
                            var funcs = [];
                            for (var i in _t) {
                                if (typeof _t[i] === "function") funcs.push(i);
                            }
                            cb(null,funcs);
                        };
                        return cb(null, _t);
                    });
                });

            }
        ]
        , function (err, res) {
            return cb(err, res);
        }
    );

};


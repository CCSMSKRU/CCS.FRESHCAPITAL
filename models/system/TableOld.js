var tables = require('./tables');
var MyError = require('../../error/index').MyError;
var UserError = require('../../error/index').UserError;
var UserOk = require('../../error/index').UserOk;
var async = require('async');
var api = require('../../libs/api');
var fs = require('fs-extra');
var toFile = require('../../modules/saveToFile').toFile;
var moment = require('moment');
/**
 * Created by iig on 03.10.2015.
 * Описывает структуру таблиц, для автоматического создания
 *
 * CREATE TABLE `test1` (
 `id` int(11) NOT NULL AUTO_INCREMENT,
 `text1` text,
 `blob1` blob,
 `double1` double DEFAULT NULL,
 `char1` char(255) DEFAULT NULL,
 `date1` date DEFAULT NULL,
 `datetime1` datetime DEFAULT NULL,
 PRIMARY KEY (`id`)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

 */
var Table = function (params, cb) {
    if (typeof cb !== 'function') throw new MyError('В конструктор Table не передана фанкция cb');
    if (typeof params !== 'object') return cb(new MyError('new Table вызвана без параметров'));
    params = params.object_params || params || {};
    if (!params.name) return cb(new MyError('В констуктор Table не передано имя таблицы'));
    var _t = this;
    _t.name = params.name;
    _t.loadStructure(function (err) {
        cb(err, _t);
    });
};
Table.prototype.loadStructure = function (cb) {
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    var _t = this;

    async.waterfall([
            function (cb) {
                fs.readFile('./models/system/tablesOld.json', function (err, data) {
                    if (err) return cb(new MyError('Не удалось считать структуры таблицы из файла.'));
                    var tablesJSON = data.toString();
                    try {
                        var tables = JSON.parse(tablesJSON);
                    } catch (e) {
                        return cb(new MyError('Информация по таблцам имеет не верный формат.'));
                    }
                    return cb(null, tables);
                });
            },
            function (tables, cb) {
                var table = tables[_t.name];
                if (typeof table !== 'object') return cb(new MyError('Не создана структура таблицы. /models/system/tables', {name: _t.name}));
                _t.structure = table.structure;
                cb(null);
            }
        ],
        function (err) {
            cb(err);
        });
};
Table.prototype.checkExist = function (params, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        params = {};
    }
    var _t = this;
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof params !== 'object') return cb(new MyError('В метод не переданы params'));
    async.waterfall([
        pool.getConn,
        function (conn, cb) {
            conn.tableInfo(_t.name, function (err, info) {
                conn.release();
                if (err) {
                    console.log(err);
                    return cb(err);
                }
                cb(null, info);
            });
        }
    ], function (err, info) {
        cb(err, info);
    });
};
Table.prototype.create = function (params, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        params = {};
    }
    var _t = this;
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof params !== 'object') return cb(new MyError('В метод не переданы params'));
    console.log('Table Create func');
    var object = params.object;
    if (!object) return cb(new MyError('В метод не передан object'));
    var filename = params.filename;
    var sql = 'CREATE TABLE `' + _t.name + '` ( ';
    var unique = [];

    _t.loadStructure(function (err) {
        if (err) return cb(err);
        if (typeof _t.structure !== 'object') return cb(new MyError('Не описана структура полей. См. models/system/tables.json'));
        for (var i in _t.structure) {
            var field = _t.structure[i];
            sql += '`' + i + '` ' + field.type;
            sql += (field.length) ? '(' + field.length + ')' : '';
            sql += (field.notNull) ? ' NOT NULL' : '';
            sql += (field.autoInc) ? ' AUTO_INCREMENT' : '';
            if (typeof field.default !== "undefined") {
                if (field.default == 'NULL') {
                    sql += ' DEFAULT NULL';
                } else {
                    sql += " DEFAULT '" + field.default + "'";
                }
            }
            sql += ',';
            //if (field.unique) unique.push(i);
        }
       /* sql += ' PRIMARY KEY (`id`)';
        if (unique.length > 0) {
            sql += ',UNIQUE KEY `unique_index` (';
            for (var j in unique) {
                sql += '`' + unique[j] + '`';
                if (j != unique.length - 1) sql += ','
            }
            sql += ')'
        }*/
        sql += '  PRIMARY KEY (`id`))';
        sql += ' ENGINE=InnoDB DEFAULT CHARSET=utf8;';
        async.waterfall(
            [
                pool.getConn,
                function (conn, cb) {
                    conn.query(sql, function (err, res) {
                        conn.release();
                        if (err) {
                            console.log(sql);
                            if (err.code == "ER_TABLE_EXISTS_ERROR") return cb(new UserError('Такая таблица уже существует.'));
                            return cb(new MyError('Во время создания таблицы возникла ошибка.', err));
                        }
                        return cb(null);
                    })
                },
                function (cb) {
                    if (!filename) return cb(null);
                    _t.restore({filename:filename}, function (err) {
                        if (err) return cb(new UserError('Таблица создана, но данные загружены не были.',{type:'info',err:err}));
                        cb(null);
                    })
                },
                function (cb) {
                    // Создадим необходимые файлы
                    var classFile = './classes/'+object+'.js';
                    var modelFile = './models/'+object.toLowerCase()+'.js';
                    async.series([
                        function (cb) {
                            fs.access(classFile, function (err) {
                                if (!err) return cb(null); // Класс уже создан
                                fs.copy('./models/system/etalons/Class.js', classFile, function (err) {
                                    if (err) console.log('Не удалось скопировать файл класса.', err);
                                    return cb(null);
                                })
                            });
                        },
                        function (cb) {
                            fs.access(modelFile, function (err) {
                                if (!err) return cb(null); // Модель уже создана
                                fs.copy('./models/system/etalons/model.js', modelFile, function (err) {
                                    if (err) console.log('Не удалось скопировать файл модели.', err);
                                    return cb(null);
                                })
                            });
                        }
                    ], cb);
                }
            ]
            , function (err) {
                if (err) return cb(err);
                var msg = (filename)? 'Таблица успешно создана. Данные загружены.' : 'Таблица успешно создана';
                cb(null, new UserOk(msg));
            }
        );
    });

};
Table.prototype.addColumns = function (params, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        params = {};
    }
    var _t = this;
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof params !== 'object') return cb(new MyError('В метод не переданы params'));
    var object = params.object;
    if (!object) return cb(new MyError('В метод не передан object'));
    var path = './classes/' + object + '.js';
    fs.access(path, function (err) {
        if (err) return cb(new MyError('Такого объекта(класса) не существует.', object));
        var _class = require('../.' + path);
        new _class({object: object}, function (err, instance) {
            if (err) return cb(err);
            var cols = instance.model.columns;
            var needAdd;
            _t.loadStructure(function (err) {
                if (err) return cb(err);
                for (var i in _t.structure) {
                    if (cols.indexOf(i) == -1) {
                        needAdd = needAdd || {};
                        needAdd[i] = _t.structure[i];
                    }
                }
                if (!needAdd) return cb(new UserError('Нет полей для добавления.', {code: 201, type: 'warning'}));
                var sql = 'ALTER TABLE `' + _t.name + '`';
                var counter = 0;
                for (var j in needAdd) {
                    counter++;
                    sql += ' ADD ';
                    var one = needAdd[j];
                    var field = _t.structure[j];
                    sql += '`' + j + '` ' + field.type;
                    sql += (field.length) ? '(' + field.length + ')' : '';
                    sql += (field.notNull) ? ' NOT NULL' : '';
                    if (typeof field.default !== "undefined") {
                        if (field.default == 'NULL') {
                            sql += ' DEFAULT NULL';
                        } else {
                            sql += " DEFAULT '" + field.default + "'";
                        }
                    }
                    sql += ',';
                }
                sql = sql.replace(/,$/, '');
                async.waterfall(
                    [
                        pool.getConn,
                        function (conn, cb) {
                            conn.query(sql, function (err, res) {
                                conn.release();
                                if (err) {
                                    if (err.code == "ER_DUP_FIELDNAME") return cb(new UserError('Некоторые столбцы уже созданы.',{fields:needAdd}));
                                    return cb(new MyError('Во время добавления столбцов в таблицу возникла ошибка.', err));
                                }
                                return cb(null, null);
                            })
                        }
                    ]
                    , function (err) {
                        if (err) return cb(err);
                        cb(null, new UserOk('Добавлено полей: ' + counter, {fields: needAdd}));
                    }
                );
            });
        });
    });
};
Table.prototype.removeColumns = function (params, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        params = {};
    }
    var _t = this;
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof params !== 'object') return cb(new MyError('В метод не переданы params'));
    var object = params.object;
    if (!object) return cb(new MyError('В метод не передан object'));
    var path = './classes/' + object + '.js';
    fs.access(path, function (err) {
        if (err) return cb(new MyError('Такого объекта(класса) не существует.', object));
        var _class = require('../.' + path);
        new _class({object: object}, function (err, instance) {
            if (err) return cb(err);
            var cols = instance.model.columns;
            var needRemove;
            _t.loadStructure(function (err) {
                if (err) return cb(err);
                for (var j in cols) {
                    if (!_t.structure[cols[j]]) {
                        needRemove = needRemove || [];
                        needRemove.push(cols[j]);
                    }
                }
                if (!needRemove) return cb(new UserError('Нет полей для удаления.', {code: 201, type: 'warning'}));
                var sql = 'ALTER TABLE `' + _t.name + '`';
                var counter = 0;
                for (var j in needRemove) {
                    counter++;
                    sql += ' DROP COLUMN `'+needRemove[j] +'`,';
                }
                sql = sql.replace(/,$/, '');
                async.waterfall(
                    [
                        pool.getConn,
                        function (conn, cb) {
                            conn.query(sql, function (err, res) {
                                conn.release();
                                if (err) {
                                    //if (err.code == "ER_DUP_FIELDNAME") return cb(new UserError('Некоторые столбцы уже созданы.',{fields:needAdd}));
                                    return cb(new MyError('Во время удаления столбцов возникла ошибка.', err));
                                }
                                return cb(null, null);
                            })
                        }
                    ]
                    , function (err) {
                        if (err) return cb(err);
                        cb(null, new UserOk('Удалено полей: ' + counter, {fields: needRemove}));
                    }
                );
            });
        });
    });
};
Table.prototype.restore = function (params, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        params = {};
    }
    var _t = this;
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof params !== 'object') return cb(new MyError('В метод не переданы params'));
    //var object = params.object;
    var filename = params.filename;
    //if (!object) return cb(new MyError('В метод не передан object'));
    if (!filename) return cb(new MyError('В метод не передан filename'));
    async.waterfall([
            function (cb) {
                // Считаем файл
                fs.readFile('./DB/insert/'+filename,{}, function (err, data) {
                    if (err) return cb(new UserError('Не удалось считать файл.',filename));
                    cb(null, data.toString());
                });
            },
            function (sql, cb) {
                // Выполним sql скрипт
                var sqls = sql.split(';\n');
                async.eachSeries(sqls, function (item, cb) {
                    if (item == '') return cb(null);
                    async.waterfall(
                        [
                            pool.getConn,
                            function (conn, cb) {
                                conn.query(item, function (err, res) {
                                    conn.release();
                                    if (err) {
                                        return cb(new MyError('Во время исполнения sql скрипта возникла ошибка.', err));
                                    }
                                    return cb(null, res);
                                })
                            }
                        ]
                        , cb
                    );
                }, cb);

            }
        ]
        , function (err, res) {
            if (err) return cb(err);
            cb(null, new UserOk('Данные успешно добавлены в таблицу.'))
        });


};
Table.prototype.backup = function (params, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        params = {};
    }
    var _t = this;
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof params !== 'object') return cb(new MyError('В метод не переданы params'));
    var object = params.object;
    var filename = params.filename;
    if (!object) return cb(new MyError('В метод не передан object'));
    var sql = 'SELECT * FROM `' + _t.name + '`';
    async.waterfall(
        [
            pool.getConn,
            function (conn, cb) {
                conn.query(sql, function (err, res) {
                    conn.release();
                    if (err) {
                        //if (err.code == "ER_BAD_TABLE_ERROR") return cb(new UserError('Такой таблицы не существует.'));
                        return cb(new MyError('Во время backup таблицы возникла ошибка.', err));
                    }
                    return cb(null, res);
                })
            },
            function (res, cb) {
                var sql = '';
                for (var i in res) {
                    var row = res[i];
                    var s = 'INSERT INTO `' + _t.name + '` (';
                    var keys = '';
                    var values = '';
                    for (var j in row) {
                        if (_t.structure[j].primary_key) continue;
                        if (row[j]==null || row[j]=='') continue;
                        keys += '`'+j+'`, '
                        values += '\''+row[j]+'\', '
                    }
                    keys = keys.replace(/, $/,'');
                    values = values.replace(/, $/,'');
                    s += keys + ') VALUES (' + values +');\n'
                    sql += s;
                }
                cb(null, sql);
            },
            function (sql, cb) {
                // Запишем в файл
                var name = filename || _t.name +'__'+ moment().format('YYMMDD_hh_mm_ss')+'.sql';
                var fileName = './DB/insert/'+ name;
                toFile({fileName: fileName, flags:"w", data: sql, encoding:'utf8'},function(err, name){
                    if (err) return cb(new UserError('Не удалось сохранить файл.',err));
                    cb(null, name)
                });
            }
        ]
        , function (err, name) {
            if (err) return cb(err);
            console.log('name', name);
            cb(null, new UserOk('Данные таблицы успешно сохранены в файл.'));
        }
    );
};
Table.prototype.drop = function (params, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        params = {};
    }
    var _t = this;
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof params !== 'object') return cb(new MyError('В метод не переданы params'));
    console.log('Table drop func');
    var confirm = params.confirm;
    var backup = (typeof params.backup!=='undefined')? params.backup : true;
    if (!confirm) return cb(new UserError('needConfirm', {message: 'Эта операция уничтожит таблицу со всеми данными. Вы уверены, что хотите это сделать?'}));
    async.series([
        function (cb) {
            //backup
            if (!backup) return cb(null);
            _t.backup({object:params.object},cb);
        },
        function (cb) {
            //drop
            var sql = 'DROP TABLE `' + _t.name + '`';
            async.waterfall(
                [
                    pool.getConn,
                    function (conn, cb) {
                        conn.query(sql, function (err, res) {
                            conn.release();
                            if (err) {
                                if (err.code == "ER_BAD_TABLE_ERROR") return cb(new UserError('Такой таблицы не существует.'));
                                return cb(new MyError('Во время уничтожения таблицы возникла ошибка.', err));
                            }
                            return cb(null, null);
                        })
                    }
                ]
                , cb
            );
        }
    ], function (err, res) {
        if (err) return cb(err);
        var msg = (backup)? 'Данные сохранены, таблица удалена.' : 'Таблица удалена без сохранения данных.';
        cb(null, new UserOk(msg));
    });

};

module.exports = Table;
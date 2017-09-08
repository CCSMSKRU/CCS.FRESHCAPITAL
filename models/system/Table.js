var tables = require('./tables');
var MyError = require('../../error/index').MyError;
var UserError = require('../../error/index').UserError;
var UserOk = require('../../error/index').UserOk;
var async = require('async');
var api = require('../../libs/api');
var fs = require('fs-extra');
var toFile = require('../../modules/saveToFile').toFile;
var moment = require('moment');
var funcs = require('../../libs/functions');
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
var Table = function (params) {
    if (typeof params !== 'object') return new MyError('new Table вызвана без параметров');
    var _t = this;
    _t.user = params.user;
    params = params.params || {};
    if (!params.name) return new MyError('В констуктор Table не передано имя таблицы');
    _t.name = params.name;
    _t.className = params.name.toLowerCase();
    _t.className = _t.className.charAt(0).toUpperCase() + _t.className.substr(1);
    _t.table = {};
    _t.default_dict_array = [{'type_of_editor_id': 'type_of_editor'}];
    _t.default_dicts = {};
};

Table.prototype.init = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    _t.loadStructure(function (err) {
        cb(err, _t);
    });
};

Table.prototype.api = function (o, cb) {
    api(o, cb, this.user);
};

Table.prototype.loadStructure = function (cb) {
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    var _t = this;
    async.waterfall([
            function (cb) {
                fs.readFile('./models/system/tables.json', function (err, data) {
                    if (err) return cb(new MyError('Не удалось считать структуры таблицы из файла.'));
                    var tablesJSON = data.toString();
                    try {
                        var tables = JSON.parse(tablesJSON);
                        _t.structureAll = tables;
                    } catch (e) {
                        return cb(new MyError('Информация по таблцам имеет не верный формат.', e));
                    }
                    return cb(null, tables);
                });
            },
            function (tables, cb) {
                var table = tables[_t.name];
                if (typeof table !== 'object') return cb(new MyError('Не создана структура таблицы. /models/system/tables', {name: _t.name}));
                _t.table = table;
                _t.profile = table.profile;
                if (typeof _t.profile !== 'object') return cb(new MyError('В tables.json не прописан profile', {name: _t.name}));
                _t.profile.ending = _t.profile.ending || '';
                _t.structure = table.structure;
                if ('sysname' in _t.structure) {
                    _t.profile.default_order_by = _t.profile.default_order_by || 'num_in_series';
                    _t.structure.num_in_series = {type: "bigint", length: 20, name: 'Номер в серии', sort_no: '-30', default:'0'};
                }
                _t.structure.created = {type: "datetime", name: 'Создан' + _t.profile.ending, sort_no:10001};
                _t.structure.updated = {type: "datetime", name: 'Обновлен' + _t.profile.ending, sort_no:10002};
                _t.structure.deleted = {type: "datetime", name: 'Удален' + _t.profile.ending, sort_no:10003};
                _t.structure.published = {type: "datetime", name: 'Опубликован' + _t.profile.ending, sort_no:10004};
                _t.structure.created_by_user_id = {type: "bigint", length: 20, name: 'Создан' + _t.profile.ending + ' пользователем id', visible:false, sort_no:10005};
                _t.structure.created_by_user = {type: "varchar", length: 255, name: 'Создан' + _t.profile.ending + ' пользователем', is_virtual:true, from_table:'user', keyword:'created_by_user_id', return_column:'firstname', visible:false, sort_no:10006};
                _t.structure.deleted_by_user_id = {type: "bigint", length: 20, name: 'Удален' + _t.profile.ending + ' пользователем', visible:false, sort_no:10007};
                _t.structure.deleted_by_user = {type: "varchar", length: 255, name: 'Удален' + _t.profile.ending + ' пользователем', is_virtual:true, from_table:'user', keyword:'deleted_by_user_id', return_column:'firstname', visible:false, sort_no:10008};
                _t.structure.remove_comment = {type: "text", name: 'Комментарий при удалении', visible:false, sort_no:10009};
                _t.structure.self_company_id = {type: "bigint", length: 20, name: 'Своя компания id', visible:false, sort_no:10010};
                _t.structure.self_company = {type: "varchar", length: 255, name: 'Своя компания', is_virtual:true, from_table:'company_sys', keyword:'self_company_id', return_column:'name', visible:false, sort_no:10011};
                _t.structure.ext_company_id = {type: "bigint", length: 20, name: 'Создано компанией id', visible:false, sort_no:10012};
                _t.structure.ext_company = {type: "varchar", length: 255, name: 'Создано компанией', is_virtual:true, from_table:'company_sys', keyword:'ext_company_id', return_column:'name', visible:false, sort_no:10013};

                _t.MySQLUnique = table.MySQLUnique;
                cb(null);
            }
        ],
        function (err) {
            cb(err);
        });
};

Table.prototype.getLinkedTables = function (params, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        params = {};
    }
    var _t = this;
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof params !== 'object') return cb(new MyError('В метод не переданы params'));
    var name = params.name || _t.name;
    var additionalTables = [];
    async.series([
        function (cb) {
            // Загрузим структуру если нет
            if (_t.structure) return cb(null);
            _t.init(function (err) {
                cb(err);
            });
        },
        function (cb) {
            // найдем все виртуальные поля из других таблиц
            if (typeof _t.structureAll[_t.name] !== 'object') return cb(new MyError('Нет структуры для данной таблицы'));
            for (var i in _t.structureAll) {
                var tbl = _t.structureAll[i].structure;
                //if (i=='merchant_payment') debugger;
                for (var j in tbl) {
                    var col = tbl[j];
                    if (!col.is_virtual) continue;
                    if (!col.from_table) continue;
                    if (col.from_table == _t.name && additionalTables.indexOf(i) === -1) additionalTables.push(i);
                }
            }
            cb(null);
        }
    ], function (err, res) {
        cb(err, additionalTables);
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
    var name = params.name || _t.name;
    async.waterfall([
        pool.getConn,
        function (conn, cb) {
            conn.tableInfo(name, function (err, info) {
                conn.release();
                if (err) {
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
    var filename = params.filename;
    var sql = 'CREATE TABLE `' + _t.name + '` ( ';
    var MySQLUnique = _t.MySQLUnique;
    var unique = [];
    if (typeof _t.structure !== 'object') return cb(new MyError('Не описана структура полей. См. models/system/tables.json'));

    async.series([
        function (cb) {
            // Проверим существование таблицы
            // Если есть, добавим колонки, если нет создадим
            _t.checkExist(function (err, info) {
                if (err) return cb(new MyError('Не удалось проверить существование таблицы в базе. ', {
                    table: _t.name,
                    err: err
                }));
                if (!info) {
                    // Таблица не существует. Создаем как обычно.

                    for (var i in _t.structure) {
                        var field = _t.structure[i];
                        if (field.is_virtual) continue;
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
                        if (field.unique) unique.push(i);
                    }
                    if (MySQLUnique) {
                        sql += ' PRIMARY KEY (`id`)';
                        if (unique.length > 0) {
                            sql += ',UNIQUE KEY `unique_index` (';
                            for (var j in unique) {
                                sql += '`' + unique[j] + '`';
                                if (j != unique.length - 1) sql += ','
                            }
                            sql += '))'
                        }
                    } else {
                        sql += '  PRIMARY KEY (`id`))';
                    }
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
                                _t.restore({filename: filename}, function (err) {
                                    if (err) return cb(new UserError('Таблица создана, но данные загружены не были.', {
                                        type: 'info',
                                        err: err
                                    }));
                                    cb(null);
                                });
                            }
                        ]
                        , function (err) {
                            if (err) return cb(err);
                            var msg = (filename) ? 'Таблица успешно создана. Данные загружены.' : 'Таблица успешно создана';
                            cb(null, new UserOk(msg));
                        }
                    );
                } else {
                    // Смерджим колонки и добавим недостающие и сменим тип
                    // Загрузим данные о калонках
                    async.waterfall([
                        pool.getConn,
                        function (conn, cb) {
                            conn.fields(_t.name, function (err, fields) {
                                conn.release();
                                if (err) return cb(new MyError('Не удалось загрузить инфу о столбцах таблицы.', {
                                    table: _t.name,
                                    err: err
                                }));
                                var l = Object.keys(fields).length;
                                async.eachSeries(Object.keys(_t.structure), function (key, cb) {
                                    var fieldFromFile = _t.structure[key];
                                    if (fieldFromFile.is_virtual) return cb(null);
                                    var keyBase = fieldFromFile.old_key || key;
                                    var field = fields[keyBase];
                                    if (!field) {
                                        // Надо добавить поле
                                        async.waterfall([
                                            pool.getConn,
                                            function (conn, cb) {
                                                var sql = 'ALTER TABLE ' + _t.name + ' ADD ';
                                                sql += '`' + key + '` ' + fieldFromFile.type;
                                                sql += (fieldFromFile.length) ? '(' + fieldFromFile.length + ')' : '';
                                                sql += (fieldFromFile.notNull) ? ' NOT NULL' : '';
                                                if (typeof fieldFromFile.default !== "undefined") {
                                                    if (fieldFromFile.default == 'NULL') {
                                                        sql += ' DEFAULT NULL';
                                                    } else {
                                                        sql += " DEFAULT '" + fieldFromFile.default + "'";
                                                    }
                                                }
                                                console.log(sql);
                                                conn.query(sql, [_t.name], function (err, res) {
                                                    conn.release();
                                                    if (err) return cb(new MyError('Не удалось добавить поле', {
                                                        table: _t.name,
                                                        column: key,
                                                        err: err
                                                    }));
                                                    cb(null);
                                                });
                                            }
                                        ], cb)
                                    } else {
                                        var columnKey = key;
                                        var columnType = field.Type.match(/(\w+)/);
                                        var columnLength = field.Type.match(/(\d+)/);
                                        columnType = (columnType) ? columnType[0] : undefined;
                                        columnLength = (columnLength) ? columnLength[0] : undefined;
                                        if (columnType !== fieldFromFile.type || columnLength !== fieldFromFile.length) {
                                            // Обновим поля
                                            async.waterfall([
                                                pool.getConn,
                                                function (conn, cb) {
                                                    var type = (fieldFromFile.length) ? fieldFromFile.type + '(' + fieldFromFile.length + ')' : fieldFromFile.type;
                                                    var sql = 'ALTER TABLE `' + _t.name + '` MODIFY ' + key + ' ' + type;
                                                    conn.query(sql, [], function (err, res) {
                                                        conn.release();
                                                        if (err) return cb(new MyError('Не удалось обновить тип поля', {
                                                            table: _t.name,
                                                            column: key,
                                                            type: type,
                                                            err: err
                                                        }));
                                                        cb(null);
                                                    });
                                                }
                                            ], cb)
                                        } else {
                                            cb(null);
                                        }
                                    }
                                }, cb);
                            });
                        }
                    ], cb);
                }
            })
        }
    ], cb);


};

Table.prototype.createClass = function (params, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        params = {};
    }
    var _t = this;
    if (typeof cb !== 'function') throw new MyError('В метод createClass не передан cb');
    if (typeof params !== 'object') return cb(new MyError('В метод createClass не переданы params'));
    if (typeof _t.profile !== 'object') return cb(new MyError('Нету профайла для данной таблицы в tables.json', {table: _t}));

    // Создать class_profile
    // Создать class_profile_fields
    // Создать файл
    async.series([
        function (cb) {
            // Создать class_profile
            async.series([
                function (cb) {
                    // Проверить существование таблицы class_profile
                    _t.checkExist({name: 'class_profile'}, function (err, info) {
                        if (err) {
                            console.log(err);
                            return cb(err);
                        }
                        if (!info) {
                            return cb(new MyError('Таблица в базе еще не создана', {table: "class_profile"}));
                        }
                        cb(null);
                    });
                },
                function (cb) {
                    // Проверим хватает ли полей в таблице class_profile
                    async.waterfall([
                        pool.getConn,
                        function (conn, cb) {
                            conn.fields("class_profile", function (err, fields) {
                                conn.release();
                                if (err) return cb(new MyError('Не могу получить поля таблицы class_profile'));
                                var unfinded = [];
                                for (var i in  _t.profile) {
                                    if (!fields[i]) unfinded.push(i);
                                }
                                if (unfinded.length) return cb(new MyError('В базе, в таблице class_profile нет части полей описанных в структуре.', {fields: unfinded}));
                                return cb(null);
                            });
                        }
                    ], cb)

                },
                function (cb) {
                    // создать запись о классе
                    // Получить запись если есть. Смерджить и создать или обновить запись
                    async.waterfall([
                        pool.getConn,
                        function (conn, cb) {
                            // Получим запись класса из class_proflle
                            conn.queryRow("select * from class_profile where name = '" + _t.name + "'", function (err, res) {
                                conn.release();
                                if (err) return cb(new MyError('Не удалось получить запись из таблицы class_profile', err));
                                if (!res) return cb(null);
                                _t.class_data = res;
                                return cb(null);
                            })
                        },
                        function (cb) {
                            //Смерджим поля если есть. Если нет создадим запись
                            if (_t.class_data) {
                                _t.class_id = _t.class_data.id;
                                _t.profile.name_ru = _t.profile.name_ru || _t.profile.name;
                                var toModyfy;
                                for (var i in _t.class_data) {
                                    var class_field = _t.class_data[i];

                                    var profile_field = _t.profile[i];
                                    if (class_field !== profile_field && typeof profile_field !== 'undefined') {
                                        if (!toModyfy) toModyfy = {};
                                        toModyfy[i] = profile_field;
                                    }
                                }
                                if (toModyfy) {
                                    toModyfy.id = _t.class_data.id;
                                    async.waterfall([
                                        pool.getConn,
                                        function (conn, cb) {
                                            conn.update("class_profile", toModyfy, function (err, res) {
                                                conn.release();
                                                if (err) return cb(new MyError('Не удалось обновить поля class_profile', {
                                                    err: err,
                                                    toModify: toModyfy
                                                }));

                                                return cb(null);
                                            });
                                        }
                                    ], cb);
                                } else {
                                    return cb(null);
                                }
                            } else {
                                async.waterfall([
                                    pool.getConn,
                                    function (conn, cb) {
                                        // Составляем sql запрос на добавение строки в class_proflle
                                        _t.profile.created = funcs.getDateTimeMySQL();
                                        _t.profile.published = funcs.getDateTimeMySQL();
                                        conn.insert("class_profile", _t.profile, function (err, res) {
                                            conn.release();
                                            if (err) {
                                                if (err.code == 'ER_DUP_ENTRY') return cb(new MyError('Такая запись в class_proflle уже существует.', err));
                                                return err;
                                            }
                                            _t.class_id = res;
                                            return cb(null);
                                        })
                                    }
                                ], cb);
                            }

                        }
                    ], cb)
                }
            ], function (err) {
                if (err) {
                    console.log('Не удалось создать запись о классе в class_pofile');
                    return cb(err);
                }
                console.log('Запись о классе в class_profile добавлена.');
                return cb(null);
            })
        },
        function (cb) {
            // Создать class_fields_profile
            async.series([
                function (cb) {
                    // Проверить существование таблицы class_fields_profile
                    _t.checkExist({name: 'class_fields_profile'}, function (err, info) {
                        if (err) {
                            console.log(err);
                            return cb(err);
                        }
                        if (!info) {
                            return cb(new MyError('Таблица в базе еще не создана', {table: "class_fields_profile"}));
                        }
                        console.log('Проверить существование таблицы class_fields_profile');
                        cb(null);
                    });
                },
                function (cb) {
                    // Загрузим структуру список полей class_fields_profile
                    async.waterfall([
                        pool.getConn,
                        function (conn, cb) {
                            conn.fields("class_fields_profile", function (err, fields) {
                                conn.release();
                                if (err) return cb(new MyError('Не могу получить поля таблицы class_fields_profile'));
                                _t.class_fields_profile = fields;
                                return cb(null);
                            });
                        }
                    ], cb)
                },
                function (cb) {
                    // Загрузим справочиники со значениями по умолчанию
                    async.each(_t.default_dict_array, function (item, cb) {
                        var field, table;
                        if (typeof item === 'object') {
                            field = Object.keys(item)[0];
                            table = item[field];
                        } else {
                            field = table = item;
                        }
                        var sql = 'select id, default_for_data_type from ' + table;
                        console.log(sql);
                        async.waterfall([
                            pool.getConn,
                            function (conn, cb) {
                                conn.query(sql, function (err, res) {
                                    conn.release();
                                    if (err) return cb(null); // Игнорим ош.
                                    _t.default_dicts[field] = res;
                                    cb(null);
                                })
                            }
                        ], cb);
                    }, cb);
                },
                function (cb) {
                    // Удалим поля которых нет в структуре

                    async.waterfall([
                        pool.getConn,
                        function (conn, cb) {
                            // Удалим поля которые есть в базе но нет в структуре
                            var sql = "delete from class_fields_profile where class_id = ? and column_name not in (";
                            for (var i in _t.structure) {
                                sql += "'" + i + "',";
                            }
                            sql = sql.replace(/,$/, '');
                            sql += ")";
                            conn.query(sql, [_t.class_id, Object.keys(_t.structure).join(',')], function (err, res) {
                                conn.release();
                                if (err) console.log('ERROR',err);
                                else console.log('--------deleted---->', res.affectedRows);
                                cb(err);
                            });
                        }
                    ], cb);
                },
                function (cb) {
                    // создать запись о полях класса
                    var sort_no_counter = 1;
                    async.eachSeries(Object.keys(_t.structure), function (key, cb) {
                        var item = _t.structure[key];
                        var o = {
                            class_id: _t.class_id
                        };
                        for (var class_field in _t.class_fields_profile) {
                            //var class_field = _t.class_fields_profile[i];
                            switch (class_field) {
                                case "column_name":
                                    o[class_field] = key;
                                    break;
                                case "name":
                                    o[class_field] = item.name || key;
                                    break;
                                case "validation":
                                    var validation = item.validation || ((item.notNull) ? "notNull" : false);
                                    if (validation) o[class_field] = validation;
                                    break;
                                case "is_unique":
                                    if (item['unique']) o[class_field] = true;
                                    break;
                                case "field_length":
                                    if (item['length']) o[class_field] = item['length'];
                                    break;
                                default :
                                    var finded_dict_val = false;
                                    if (_t.default_dicts[class_field]) {
                                        var dict = _t.default_dicts[class_field];
                                        for (var i in dict) {
                                            if (finded_dict_val) break;
                                            var defaultForDataType = dict[i].default_for_data_type;
                                            if (!defaultForDataType) continue;
                                            switch (defaultForDataType) {
                                                case "tinyint(1)":
                                                    if (item['type'] == 'tinyint' && item['length'] == 1) {
                                                        finded_dict_val = true;
                                                        o[class_field] = dict[i].id;
                                                    }
                                                    break;
                                                case "is_virtual":
                                                    if (item['is_virtual'] && !item['concat_fields']) {
                                                        finded_dict_val = true;
                                                        o[class_field] = dict[i].id;
                                                    }
                                                    break;
                                                default :
                                                    if (defaultForDataType.indexOf(item['type']) >= 0 && !(item['is_virtual'] && !item['concat_fields']) && !(item['type'] == 'tinyint' && item['length'] == 1)) {
                                                        finded_dict_val = true;
                                                        o[class_field] = dict[i].id;
                                                        break;
                                                    }
                                                    break;
                                            }

                                        }
                                    }
                                    if (typeof item[class_field] !== "undefined" && !finded_dict_val) {
                                        o[class_field] = item[class_field];
                                    }
                                    break;
                            }
                            o.created = funcs.getDateTimeMySQL();
                            o.published = funcs.getDateTimeMySQL();
                        }
                        //`unique`, created, published) VALUES (11, 'name', 'name', 'varchar', '255', true, ' at line 1]

                        async.waterfall([
                            function (cb) {
                                // Запишим поля в базу
                                async.waterfall([
                                    pool.getConn,
                                    function (conn, cb) {
                                        if (sort_no_counter > 1) return cb(null);
                                        // Загрузим максимальное sort_no
                                        var sql = "select MAX(sort_no) from class_fields_profile where class_id = ? and sort_no < 9999";
                                        conn.queryValue(sql, [_t.class_id], function (err, val) {
                                            conn.release();
                                            if (err) return cb(err);
                                            if (!isNaN(+val)) sort_no_counter = val + 10;
                                            cb(err);
                                        });
                                    },
                                    pool.getConn,
                                    function (conn, cb) {
                                        // есть ли поле?
                                        var sql = "select * from class_fields_profile where class_id = ? and column_name = ?";
                                        conn.queryRow(sql, [_t.class_id, key], function (err, field) {
                                            conn.release();
                                            cb(err, field);
                                        });
                                    },
                                    function (field, cb) {
                                        if (field) {  /// Есть такая запись --> merge and update

                                            var o2 = {
                                                id: field.id,
                                                class_id: _t.class_id
                                            };
                                            for (var class_field in _t.class_fields_profile) {
                                                //var class_field = _t.class_fields_profile[i];

                                                switch (class_field) {
                                                    case "column_name":
                                                        o2[class_field] = key;
                                                        break;
                                                    case "name":
                                                        o2[class_field] = item.name || key;
                                                        break;
                                                    case "validation":
                                                        var validation = item.validation || ((item.notNull) ? "notNull" : false);
                                                        if (validation) o2[class_field] = validation;
                                                        break;
                                                    case "is_unique":
                                                        if (item['unique']) o2[class_field] = true;
                                                        break;
                                                    case "field_length":
                                                        if (item['length']) o2[class_field] = item['length'];
                                                        break;
                                                    default :
                                                        if (typeof item[class_field] !== "undefined") {
                                                            o2[class_field] = item[class_field];
                                                        }
                                                        break;
                                                }

                                            }
                                            console.log('\n\n', o2, '\n\n');
                                            async.waterfall([
                                                pool.getConn,
                                                function (conn, cb) {
                                                    conn.update("class_fields_profile", o2, function (err, res) {
                                                        conn.release();
                                                        cb(err);
                                                    });
                                                }
                                            ], cb);

                                        } else { // Записи нету, создадим.
                                            async.waterfall([
                                                pool.getConn,
                                                function (conn, cb) {
                                                    o.sort_no = sort_no_counter++;
                                                    conn.insert("class_fields_profile", o, function (err, res) {
                                                        conn.release();
                                                        cb(err);
                                                    });
                                                }
                                            ], cb);

                                        }
                                    }
                                ], cb);
                            }
                        ], cb)
                    }, function (err) {
                        console.log('Добавили поля.', err);
                        if (err) {
                            // Удалить все поля от этого класса
                            async.waterfall([
                                pool.getConn,
                                function (conn, cb) {
                                    conn.delete("class_fields_profile", {class_id: _t.class_id}, function (err) {
                                        conn.release();
                                        if (err) {
                                            console.log('Не удалось удалить записи.'); // Ниче не делаем
                                        }
                                        cb(null);
                                    })
                                }
                            ], function (err2) {
                                return cb(err); // верхний err
                            });
                        } else {
                            console.log('Прошло без ошибок.');
                            cb(null);
                        }
                    });
                }
            ], function (err) {
                console.log('Перед созданием файла');
                cb(err);
            });
        },
        function (cb) {
            // Создать файл
            var classFile = './classes/' + _t.className + '.js';
            fs.access(classFile, function (err) {
                if (!err) return cb(null); // Класс уже создан
                fs.copy('./models/system/etalons/Class.js', classFile, function (err) {
                    if (err) console.log('Не удалось скопировать файл класса.', err);
                    return cb(null);
                });
            });
        },
        function (cb) {
            // Создать пункт меню
            // Получить id меню temp
            var menu;
            var item_exist = false;
            async.series({
                checkExist: function (cb) {
                    var o = {
                        command:'get',
                        object:'menu',
                        params:{
                            param_where:{
                                menu_item:_t.profile.name + '_temp'
                            },
                            fromClient:false,
                            collapseData:false
                        }
                    }
                    _t.api(o, function (err, res) {
                        if (err){
                            console.log('Не удалось создать пункт меню. Ошибка при получении menu menu_item=' + _t.profile.name + '_temp',err);
                            return cb(null);
                        }
                        item_exist = !!res.length;
                        return cb(null);
                    });
                },
                getMenuID: function (cb) {
                    if (item_exist) return cb(null);
                    var o = {
                        command:'get',
                        object:'menu',
                        params:{
                            param_where:{
                                menu_item:'temp'
                            },
                            fromClient:false,
                            collapseData:false
                        }
                    }
                    _t.api(o, function (err, res) {
                        if (err){
                            console.log('Не удалось создать пункт меню. Ошибка при получении menu menu_item=temp',err);
                            return cb(null);
                        }
                        if (!res.length){
                            console.log('Не удалось создать пункт меню. В системе не заведено родительское меню menu_item=temp');
                            return cb(null);
                        }
                        menu = res[0];
                        return cb(null);
                    });
                },
                addElement: function (cb) {
                    if (item_exist) return cb(null);
                    if (!menu) return cb(null);
                    var o = {
                        command:'add',
                        object:'menu',
                        params:{
                            class_id:_t.class_id,
                            menu_item:_t.profile.name + '_temp',
                            name:_t.profile.name_ru,
                            parent_id:menu.id,
                            menu_type:'item',
                            is_visible:true
                        }
                    };
                    _t.api(o, function (err, res) {
                        if (err) {
                            console.log('Не удалось создать пункт меню. Ошибка при добавлении.',err);
                            return cb(null);
                        }
                        cb(null);
                    })
                }
            },cb);
        }
    ], cb)
};

Table.prototype.syncWithTableJson = function (params, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        params = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод syncWithTableJson не передан cb');
    if (typeof params !== 'object') return cb(new MyError('В метод syncWithTableJson не переданы params'));
    var _t = this;
    async.series([
        function (cb) {
            _t.loadStructure(cb);
        },
        function (cb) {
            _t.create(cb);
        },
        function (cb) {
            _t.createClass(cb);
        },
        function (cb) {
            async.parallel([
                function (cb) {
                    _t.api({command: "_clearCache", object: _t.name}, cb);
                },
                function (cb) {
                    _t.api({command: "_clearCache", object: 'class_profile'}, cb);
                },
                function (cb) {
                    _t.api({command: "_clearCache", object: 'class_fields_profile'}, cb);
                }
            ], cb);

        }
    ], function (err) {
        if (err) return cb(new UserError('Не удалось синхронизировать класс. см. консоль', err));
        cb(null, new UserOk('Класс успешно синхронизирован с файлом.'))
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
                                    if (err.code == "ER_DUP_FIELDNAME") return cb(new UserError('Некоторые столбцы уже созданы.', {fields: needAdd}));
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
                    sql += ' DROP COLUMN `' + needRemove[j] + '`,';
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
                fs.readFile('./DB/insert/' + filename, {}, function (err, data) {
                    if (err) return cb(new UserError('Не удалось считать файл.', filename));
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
                        if (typeof _t.structure[j]!=='object') continue;
                        if (_t.structure[j].primary_key) continue;
                        if (row[j] == null || row[j] == '') continue;
                        keys += '`' + j + '`, '
                        values += '\'' + row[j] + '\', '
                    }
                    keys = keys.replace(/, $/, '');
                    values = values.replace(/, $/, '');
                    s += keys + ') VALUES (' + values + ');\n';
                    sql += s;
                }
                cb(null, sql);
            },
            function (sql, cb) {
                // Запишем в файл
                var name = filename || _t.name + '__' + moment().format('YYMMDD_hh_mm_ss') + '.sql';
                var fileName = './DB/insert/' + name;
                toFile({fileName: fileName, flags: "w", data: sql, encoding: 'utf8'}, function (err, name) {
                    if (err) return cb(new UserError('Не удалось сохранить файл.', err));
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
    var backup = (typeof params.backup !== 'undefined') ? params.backup : true;
    if (!confirm) return cb(new UserError('needConfirm', {message: 'Эта операция уничтожит таблицу со всеми данными (данные будут сохранены в insert_script. ' +
    'Удалены все клиентские объекты с полями и классы с их полями. ' +
    'Файл класса будет переименован в \<название_файла\>_removed. ' +
    'Вы уверены, что хотите это сделать?'}));
    // Забекапить данные
    // Удалить клиентские объекты их поля
    // Удалить класс и его поля
    // Переименовать файл класса в ..._removed
    // Удалить таблицу
    var classId = params.id;
    var className = params.name;
    if (!classId || !className) return cb(new UserError('Не передан id/name класса'));
    var co_profiles = [];
    var co_fields = [];
    var class_fields = [];
    async.series([
        function (cb) {
            //backup
            if (!backup) return cb(null);
            _t.backup({object: className}, cb);
        },
        function (cb) {
            // соберем клиентские объекты
            var o = {
                command:'get',
                object:'client_object_profile',
                params:{
                    param_where:{
                        class_id:classId
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(err);
                co_profiles = res;
                return cb(null);
            });
        },
        function (cb) {
            // Соберем id полей клиентских объектов, а самого удалим
            async.eachSeries(co_profiles, function (item, cb) {
                var o = {
                    command:'get',
                    object:'client_object_fields_profile',
                    params:{
                        param_where:{
                            client_object_id:item.id
                        },
                        collapseData:false
                    }
                };
                _t.api(o, function (err, res) {
                    if (err) return cb(err);
                    co_fields = co_fields.concat(res);
                    // Удалим сам клиентский объект
                    var o = {
                        command:'remove',
                        object:'client_object_profile',
                        params:{
                            id:item.id
                        }
                    };
                    _t.api(o, cb);
                });
            }, cb);
        },
        function (cb) {
            // Удалим собранные поля клиентских объектов
            async.eachSeries(co_fields, function (item, cb) {
                var o = {
                    command:'remove',
                    object:'client_object_fields_profile',
                    params:{
                        id:item.id
                    }
                };
                _t.api(o, cb);
            }, cb);
        },
        function (cb) {
            // Соберем поля класса
            var o = {
                command:'get',
                object:'class_fields_profile',
                params:{
                    param_where:{
                        class_id:classId
                    },
                    collapseData:false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(err);
                class_fields = res;
                return cb(null);
            });
        },
        function (cb) {
            // Удалим собранные поля класса
            async.eachSeries(class_fields, function (item, cb) {
                var o = {
                    command:'remove',
                    object:'class_fields_profile',
                    params:{
                        id:item.id
                    }
                };
                _t.api(o, cb);
            }, cb);
        },
        function (cb) {
            // Удалим сам класс
            var o = {
                command:'remove',
                object:'class_profile',
                params:{
                    id:classId,
                    name_postfix:'_removed',
                    removePrototype:true
                }
            };
            _t.api(o, function (err) {
                return cb(err);
            });
        },
        function (cb) {
            // Переименуем файл класса в _removed
            var classFile = './classes/' + className + '.js';
            var classFileRenamed = './classes/' + className + '_removed.js';
            fs.access(classFile, function (err) {
                if (err) return cb(new MyError('Файл класса не обноружен',err));
                fs.rename(classFile, classFileRenamed, function (err) {
                    if (err) return cb(new MyError('Не удалось переименовать файл класса',err));
                    return cb(null);
                });
            });
        },
        function (cb) {
            var sql = 'DROP TABLE `' + className + '`';
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
        var msg = (backup) ? 'Данные сохранены, класс удален.' : 'Класс удален без сохранения данных.';
        cb(null, new UserOk(msg));
    });

};

module.exports = Table;
var Model = require('./system/MySQLModel');
var funcs = require('../libs/functions');
var sendMail = require('../libs/sendMail');
var crypto = require('crypto');
var async = require('async');
var AuthError = require('../error').AuthError;
var MyError = require('../error').MyError;
var UserError = require('../error').UserError;

var moment = require('moment');
module.exports = function(callback){
    var user = new Model({
        published:false,
        allowedForUserCommand:['get','modifyProfile','authorize','registration','confirmEmail','unsubscribe'],
        excludeForUserColumns:['hashedPassword','salt','deleted','published','created','mailKey','unsubscribe_key','isBanned','bannedToDate'],
        table: 'users',
        table_ru: 'Пользователь',
        ending:'',
        required_fields:['login','email','birthday','gender_id'],
        getFormating:{
            birthday:'userFriendlyDate'
        },
        setFormating:{
            birthday:'getDateTimeMySQL'
        },
        validation: {
            birthday:'isDate',
            gender:'number'
        },
        concatFields:[{
            title:['firstname',' ','surname']
        }],
        join_objs:[
            {
                /*firstname:{
                    table:"user",
                    fields:[
                        {
                            column:"firstname",
                            alias:"firstname"
                        },
                        {
                            column:"title",
                            alias:"gender"
                        }
                    ]
                },*/
                gender_id:{
                    table:"gender",
                    fields:[
                        {
                            column:"id",
                            alias:"gender_id"
                        },
                        {
                            column:"name",
                            alias:"gender"
                        }
                    ]
                },
                city_id:{
                    table:"cities",
                    fields:[
                        {
                            column:"id",
                            alias:"city_id"
                        },
                        {
                            column:"title",
                            alias:"city"
                        }
                    ]
                },
                club_id:{
                    table:"clubs",
                    fields:[
                        {
                            column:"id",
                            alias:"club_id"
                        },
                        {
                            column:"name",
                            alias:"club"
                        }
                    ]
                }
            }
        ]
    },function(err){
        if (err){
            console.log(err);
        }
        user.encryptPassword = function(password){
            var salt = Math.random() + '';
            return {
                hashedPassword:crypto.createHmac('sha1',salt).update(password).digest('hex'),
                salt:salt
            };
        };
        user.checkPassword = function(salt, password, hashedPassword){
            var pass = crypto.createHmac('sha1',salt).update(password).digest('hex');
            return pass === hashedPassword;
        };
        user.authorize = function(obj, callback){
            if (typeof obj!=='object'){
                console.log('В user.authorize не переданы параметры');
                return callback(new MyError('Не удалось авторизироваться'))
            }
            var username = obj.login, password = obj.password;
            pool.getConn(function(err,conn) {
                if (err) {
                    callback(err)
                } else {
                    conn.queryRow("select id, email, salt, hashedPassword from users where login = ? and confirmed IS NOT NULL and (deleted IS NULL OR deleted >?) and isBanned IS NULL", [username,funcs.getDateTimeMySQL()], function (err, row) {
                        conn.release();
                        if (err) {
                            return callback(err);
                        }
                        if (!row){
                            return callback(new AuthError('Пользователь не найден.'))
                        }

                        var check = user.checkPassword(row.salt,password, row.hashedPassword);
                        if (!check){
                            callback(new AuthError('Пароль не верный'));
                        }else{
                            delete row.salt;
                            delete row.hashedPassword;
                            callback(null,row);
                        }
                    });
                }
            });
        };
        user.checkExist = function(login, callback){
            pool.getConn(function(err,conn) {
                if (err) {
                    callback(err)
                } else {
                    conn.queryValue('select count(*) from users where login=?',[login],function(err,count){
                        conn.release();
                        if (err){
                            return callback(err);
                        }

                        if (count>0){
                            return callback(new MyError('Такой пользователь уже существует'));
                        }
                        console.log('user has no found');
                        callback(null, null);
                    });
                }
            });
        };
        user.registration = function(obj,callback){
            console.log('Зашел в регистрацию');
            if (typeof obj!=='object'){
                return callback(new MyError('Ошибка при добавлении пользователя.'));
            }
            /*if (!obj.firstname || !isNaN(+obj.firstname)){
                return callback(new MyError('Имя не указано или указано не корректно.'));
            }*/
            if (!obj.login || !isNaN(+obj.login)){
                return callback(new MyError('Логин не указан или указан не корректно.'));
            }
            if (!obj.password){
                return callback(new MyError('Не указан пароль.'));
            }


            var passObj = user.encryptPassword(obj.password);
            obj.hashedPassword = passObj.hashedPassword;
            obj.salt = passObj.salt;

            delete obj.password;
            obj.age = funcs.age(obj.birthday,'DD.MM.YYYY');
            for (var i0 in user.setFormating) {
                if (typeof funcs[user.setFormating[i0]]=='function'){
                    if (obj[i0]){
                        obj[i0] = funcs[user.setFormating[i0]](obj[i0]);
                    }
                }
            }

            for (var i in user.required_fields) {
                var finded = false;
                for (var j in obj) {
                    if (j == user.required_fields[i]) {
                        finded = true;
                        break;
                    }
                }
                if (!finded) {
                    return callback(new MyError('Не переданы обязательные поля. ' + user.required_fields.join(', ')));
                }
            }

            var valid = user.validate(obj);
            if (typeof valid=='object'){
                return callback(new UserError(funcs.formatResponse(-1, 'error', valid.message, valid.fields)));
            }


            this.checkExist(obj.login,function(err){
                if (err) {
                    return callback(err)
                }
                pool.getConn(function(err,conn) {
                    if (err) {
                         return callback(err)
                    }
                    console.log('registration','Перед вставкой пользователя');
                    conn.insert('users',obj,function(err,recordId){
                        conn.release();
                        if (err){
                            console.log(err);
                            return callback(err);
                        }
                        console.log('registration','Пользователь успешно добавлен');
                        callback(null,recordId);
                    });
                });
            });
        };
        user.confirmEmail = function(obj,callback){
            if (typeof obj!=='object'){
                return callback(new MyError('В ConfirmEmail не переданы параметры'))
            }
            var email = obj.email;
            var p = obj.p;
            if (p=='EMPTY' || !email){
                callback(new MyError('Запрещено'));
            }
            pool.getConn(function(err,conn) {
                if (err) {
                    callback(err)
                } else {
                    //2015-02-14 19:09:25
                    var now = moment().format('YYYY-MM-DD HH:mm:ss');
                    //var sql = "update users set confirmed = '"+now+"' where id=";
                    conn.query("update users set confirmed = ?, mailKey='EMPTY' where email=? and mailKey=?",[now,email,p],function(err,affected){
                        conn.release();
                        if (err) {
                            callback(err);
                        }else if(affected==0){
                            callback(new MyError('Пользователь не найден'));
                        }else{
                            callback(null);
                        }
                    });
                }
            });
        };

        user.modifyProfile = function(obj,callback){
            if (!obj.user_id){
                return callback(new MyError('Как на счет авторизироваться?'));
            }
            obj.id = obj.user_id;
            if (obj.name){
                obj.firstname = obj.name;
            }
            if (obj.birthday){
                obj.age = funcs.age(obj.birthday,'DD.MM.YYYY');
            }
            for (var i0 in user.setFormating) {
                if (typeof funcs[user.setFormating[i0]]=='function'){
                    if (obj[i0]){
                        obj[i0] = funcs[user.setFormating[i0]](obj[i0]);
                    }
                }
            }

            var required_fields = [].concat(user.required_fields);
            var avaliable_fields = ['id','firstname','surname','secondname','phone','city_id','gender_id','weight','birthday','height','photo','isAgree','club_id'];//.concat(required_fields);
            for (var i0 in obj) {
                if (avaliable_fields.indexOf(i0)==-1) {
                    delete obj[i0];
                }
            }
            var notFinded = [];
            for (var i in required_fields) {
                var finded = false;
                for (var j in obj) {
                    if (j == required_fields[i] || obj[j]=='') {
                        finded = true;
                        break;
                    }
                }
                notFinded.push(required_fields[i]);
            }
            if (!finded) {
                return callback(new MyError('Не переданы (или переданы не корректно) обязательные поля. ' + notFinded.join(', ')));
            }

            if (obj.isAgree){
                obj.isAgree = (obj.isAgree)?1:0;
            }
            if (obj.city_id==''){
                delete obj.city_id;
            }

            user.modify(obj,function(err,results){
                callback(err,results);
            });

        };
        user.updateUserAges = function(obj,callback){
            if (typeof obj!='object'){
                obj = {};
            }

            var o = {
                columns:['id','birthday','age']
            };

            user.get(o,function(err,res){
                if (err){
                    return callback(new MyError('Не удалось обновить возраст пользователей'));
                }
                var needUpdate = [];
                res = res.data;
                for (var i in res) {
                    var realAge = funcs.age(res[i].birthday,'DD.MM.YYYY');
                    console.log(res[i].birthday, realAge);
                    var age = res[i].age;
                    if (realAge!==age){
                        needUpdate.push({
                            id:res[i].id,
                            age:realAge
                        });
                    }
                }
                async.each(needUpdate,function(item,callback){
                    user.modify(item,function(err,affected){
                        if (err){
                            console.log(err);
                        }
                        callback(null,affected);
                    })
                },function(err,r){
                    callback(err,needUpdate.length);
                });
            });
        };
        user.unsubscribe = function(obj,callback){
            if (typeof obj!=='object'){
                return callback(new MyError('Не корректно переданы параметры.'));
            }
            var key = obj.key;
            if (key.length==0){
                return callback(new MyError('Не корректно передан ключ.'));
            }
            pool.getConn(function(err, conn){
                if (err){
                    return callback(err);
                }
                var sql = 'select email from users where unsubscribe_key = ?';
                conn.queryRow(sql,[key],function(err, row){
                    conn.release();
                    if (err){
                        return callback(err);
                    }
                    if (!row){
                        return callback(new UserError('Пользователь не найден.'));
                    }
                    var email = row.email;


                    pool.getConn(function(err, conn){
                        if (err){
                            return callback(err);
                        }
                        var sql = 'update users set isAgree = 0 where unsubscribe_key = ?';
                        conn.query(sql,[key],function(err, affected){
                            conn.release();
                            if (err){
                                return callback(err);
                            }
                            if (affected==0){
                                return callback(new UserError('Пользователь не найден.'));
                            }
                            callback(null,email);
                        });
                    });
                });
            });





        };
        user.doSubscribe = function(obj,callback){
            if (typeof obj!=='object'){
                return callback(new MyError('Не корректный объект'));
            }
            /*if(!obj.user_id){
             callback(null, funcs.formatResponse(1, 'error', 'Для отправки заявки необходимо авторизоваться..'));
             }*/
            pool.getConn(function(err, conn){
                if (err){
                    return callback(err);
                }
                var sql = 'select email from users where email is not null and isAgree = 1';
                conn.query(sql,[],function(err, res){
                    conn.release();
                    if (err){
                        return callback(err);
                    }
                    async.each(res, function (item, callback) {
                        var o = {
                            email: item.email,
                            subject: obj.subject || 'Рассылка с CFFT.RU',
                            html: obj.html || 'Рассылка с CFFT.RU.'
                        };
                        sendMail(o, function (err) {
                            callback(err);
                        });
                    }, function (err,r) {
                        callback(err,r);
                    })
                });
            });
        };
        callback(user);
    });
};


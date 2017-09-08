//var log = require('lib/log')(module);
var config = require('../config');
var connect = require('connect'); // npm i connect
var async = require('async');
var cookie = require('cookie');   // npm i cookie
var cookieParser = require('cookie-parser');
var sessionStore = require('../libs/sessionStore');
var HttpError = require('../error').HttpError;
var funcs = require('../libs/functions');
var moment = require('moment');
var api = require('../libs/api');
var User = require('../classes/User');
var MyError = require('../error').MyError;
var getCode = require('../libs/getCode');
var delivery;

var developer = config.get('isDeveloper');
var systemCommands = ['_getClass'];
var systemParams = ['checkUnique','countOnly','doNotCheckCompany'];



function loadSession(sid, callback) {

    // sessionStore callback is not quite async-style!
    sessionStore.load(sid, function (err, session) {
        if (arguments.length == 0) {
            // no arguments => no session
            return callback(null, null);
        } else {
            return callback(err, session);
        }
    });

}

function loadUser(session, cb) {
    if (typeof cb!=='function') throw new MyError('В функцию loadUser не передан cb');
    if (typeof session!=='object') throw new MyError('В функцию loadUser не передан объект session');
    var user = new User({
        name:'User'
    });
    if (typeof user.init !=='function') return cb(new MyError('Нет метода init у класса User'));
    async.series([
        function (cb) {
            user.init(function (err) {
                if (err) return cb(new MyError('При инициализации класса произошла ошибка.', err));
                cb(null);
            });
        },
        function (cb) {
            user.load(session.id, function (err) {
                return cb(err);
            })
        }
    ], function (err) {
        if (err) return cb(err);
        return cb(null, user);
    });
}


module.exports = function (server) {
    var io = global.io = require('socket.io').listen(server);
    // Подключим delivery
    if (!delivery) delivery = require('../libs/delivery')(io);
    io.set('origins', '*:*');

    io.use(function (socket, next) {

        var handshake = socket.handshake || {};
        //return callback(null);
        console.log('authorization');
        async.waterfall([
            function (callback) {
                // сделать handshakeData.cookies - объектом с cookie
                handshake.cookies = cookie.parse(handshake.headers.cookie || '');
                var sidCookie = handshake.cookies[config.get('session:key')];
                //var sid = connect.utils.parseSignedCookie(sidCookie, config.get('session:secret'));
                if (!sidCookie) return callback(new HttpError(401, "Сессия не найдена"));
                var sid = cookieParser.signedCookie(sidCookie, config.get('session:secret'));
                loadSession(sid, callback);
            },
            function (session, callback) {
                if (!session) {
                    return callback(new HttpError(401, "Сессия не найдена"));
                }
                handshake.session = session;
                if (!handshake.user){
                    loadUser(session, function (err, user) {
                        if (err) return callback(err);
                        user.socket = socket;
                        handshake.user = user;
                        return callback(null);
                    });
                }else{
                    return callback(null);
                }

            }
        ], function (err) {
            if (!err) {
                return next(null, true);
            }

            if (err instanceof HttpError) {
                console.log(err);
                return next(null, false);
            }
            next(err);
        });
    });
    //io.set('authorization', function (handshake, callback) {
    //
    //    //return callback(null);
    //    console.log('authorization');
    //    async.waterfall([
    //        function (callback) {
    //            // сделать handshakeData.cookies - объектом с cookie
    //            handshake.cookies = cookie.parse(handshake.headers.cookie || '');
    //            var sidCookie = handshake.cookies[config.get('session:key')];
    //            //var sid = connect.utils.parseSignedCookie(sidCookie, config.get('session:secret'));
    //            var sid = cookieParser.signedCookie(sidCookie, config.get('session:secret'));
    //            loadSession(sid, callback);
    //        },
    //        function (session, callback) {
    //            if (!session) {
    //                return callback(new HttpError(401, "Сессия не найдена"));
    //            }
    //            handshake.session = session;
    //            if (!handshake.user){
    //                loadUser(session, function (err, user) {
    //                    if (err) return callback(err);
    //                    handshake.user = user;
    //                    return callback(null);
    //                });
    //            }else{
    //                return callback(null);
    //            }
    //
    //        }
    //    ], function (err) {
    //        if (!err) {
    //            return callback(null, true);
    //        }
    //
    //        if (err instanceof HttpError) {
    //            console.log(err);
    //            return callback(null, false);
    //        }
    //        callback(err);
    //    });
    //});
    global.logout = function (obj, cb) {
        var sid = obj.sid;
        var user = obj.user;
        //var clients = io.sockets.clients();
        var clients = io.sockets.sockets;
        var real_client = [];
        async.eachSeries(clients, function (client, cb) {
            if (!client) return cb(null);
            loadSession(sid, function (err, session) {
                if (err) {
                    return cb(new MyError('Во время логаута произошла ошибка',{err:err}));
                }
                if (client.handshake.session){ // Иначе возникает ошибка при переключении с базы на базу
                    if (client.handshake.session.id != sid) {
                        var user_data = client.handshake.user.user_data || {};
                        if (user_data.email !== user.user_data.email) return cb(null);
                    }
                }



                real_client.push(client);
                if (session) {
                    session.destroy(function (err) {
                        if (err) return cb(new MyError('Во время логаута произошла ошибка 2',{err:err}));
                        cb(null);
                    });
                }else{
                    cb(null);
                }
            });
        }, function (err) {
            if (err) console.log(err);
            for (var i in real_client) {
                real_client[i].emit("logout");
                real_client[i].disconnect();
            }
            cb(null);
        });
    };
    //io.sockets.on('session:logout', function (sid) {
    //    //var clients = io.sockets.clients();
    //    var clients = io.sockets.sockets;
    //    var real_client = [];
    //    async.eachSeries(clients, function (client, cb) {
    //
    //        loadSession(sid, function (err, session) {
    //            if (err) {
    //                return cb(new MyError('Во время логаута произошла ошибка',{err:err}));
    //            }
    //            if (client.handshake.session.id != sid) return cb(null);
    //            real_client.push(client);
    //            if (session) {
    //                session.destroy(function (err) {
    //                    if (err) return cb(new MyError('Во время логаута произошла ошибка 2',{err:err}));
    //                    cb(null);
    //                });
    //            }else{
    //                cb(null);
    //            }
    //        });
    //    }, function (err) {
    //        if (err) console.log(err);
    //        for (var i in real_client) {
    //            real_client[i].emit("logout");
    //            real_client[i].disconnect();
    //        }
    //    });
    //
    //});

    //io.sockets.on('session:reload', function (sid) {
    //    var clients = io.sockets.clients();
    //
    //    clients.forEach(function (client) {
    //        if (client.handshake.session.id != sid) return;
    //
    //        loadSession(sid, function (err, session) {
    //            if (err) {
    //                client.emit("error", "server error");
    //                client.disconnect();
    //                return;
    //            }
    //
    //            if (!session) {
    //                client.emit("logout");
    //                client.disconnect();
    //                return;
    //            }
    //
    //            client.handshake.session = session;
    //            // loadUser
    //        });
    //
    //    });
    //
    //});

    io.sockets.on('connection', function (socket) {

        var user = socket.handshake.user || {};
        //var count = funcs.countObj(socket.namespace.sockets);
        var count = funcs.countObj(socket.nsp.sockets);
        console.log('Count sockets:', count);

        socket.on('message', function (text, cb) {
            console.log('socket on message');
            console.log(socket.handshake);
            cb && cb();
        });

        socket.on('disconnect', function () {
            console.log('socket on disconnect');
        });
        socket.on('error', function (err) {
            console.log(err);
        });
        // Логирование по сокету
        socket.flagLog = false;
        socket.on('toggleLog', function () {
            console.log('toggleLog', socket.flagLog);
            socket.flagLog = !socket.flagLog;
        });
        function log(s) {
            if (socket.flagLog)
                socket.emit('log', s);
        }
        var sendTime = function (s) {
            if (socket.flagLog)
                socket.emit('log', s);
        };
        socket.on('socketQuery', function (data, callback_id, type) {
            var ip = socket.handshake.address.address;
            var t1 = moment();
            var s = t1.time + " Пришел запрос на Node.js";
            if (typeof data!=='object') return socket.emit('socketQueryCallbackError', new MyError('Парметрами запроса должен быть объект'));
            if (systemCommands.indexOf(data.command)!==-1) return socket.emit('socketQueryCallbackError', getCode('sysCommand'));
            data.params = data.params || {};
            data.params.fromClient = true;
            if (data.command == 'remove') data.command = 'removeCascade';
            for (var i in data.params) {
                if (systemParams.indexOf(i)!==-1) {
                    console.log('Параметр запрещен', i);
                    delete data.params[i];
                }
            }

            api(data, function(err, result, request_time){
                try {
                    if (err){
                        socket.emit('socketQueryCallbackError', err);
                    }
                    if (typeof request_time!=='undefined'){
                        socket.emit('socketQueryCallback', callback_id, result, request_time);
                    }else{
                        socket.emit('socketQueryCallback', callback_id, result);
                    }

                } catch (e) {
                    console.log('socketQuery can`t emit', e);
                    //process.exit(1);
                }
            }, user);
            return console.log('socketQuery',data);

        });
    });

    return io;
};
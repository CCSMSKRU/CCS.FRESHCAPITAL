var User = require('../classes/User');
var MyError = require('../error').MyError;
var async = require('async');

module.exports = function(req, res, next){
    if (typeof req.session!=='object') next(new MyError('В мидлвере loadUser не передан объект req.session'));
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
            user.load(req.session.id, function (err) {
                if (err) return cb(err);
                req.user = user;
                cb(null);
            });
        }
    ], function (err) {
        if (err) return next(err);
        return next();
    });
};
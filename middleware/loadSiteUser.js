var User = require('../classes/User');
var MyError = require('../error').MyError;
var async = require('async');
var getCode = require('../libs/getCode');

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
            user.loadSiteUser(req.body, function (err) {
                if (err) return cb(err);
                req.user = user;
                req.body.sid = req.body.sid || req.sessionID;
                cb(null);
            });
        }
    ], function (err) {
        if (err) return res.status(200).json(getCode('noAuthSite', err));
        return next();
    });
};
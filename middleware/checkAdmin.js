var HttpError = require('../error').HttpError;

module.exports = function(req, res, next){

    var userId = req.session.user;
    if (!userId){
        return next(new HttpError(401, "Вы не авторизованы"));
    }
    var user = req.user;
    if (!user.isAdmin){
        return next(new HttpError(403, "Недостаточно привилегий"));
    }
    next();
};
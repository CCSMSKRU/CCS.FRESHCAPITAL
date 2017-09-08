var HttpError = require('../error').HttpError;
var MyError = require('../error').MyError;
var funcs = require('../libs/functions');
module.exports = function(req, res, next){
    if (!req.session.user){
        return res.status(200).json(funcs.formatResponse(1, 'error', 'Вы не авторизованы.'));
    }
    next();
};
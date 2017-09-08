var api = require('../libs/userApi');
var UserError = require('../error').UserError;
exports.post = function(req, res, next){
    var command = req.body.command;
    var object = req.body.object;
    var params = req.body.params;
    var newParams;
    if (params){
        try {
            newParams = JSON.parse(params);
        } catch (e) {
            return res.status(500).send('Не валидный JSON в params');
        }
    }else{
        return res.status(500).send('Не передан params');
    }
    if (req.user) {
        newParams.user_id = req.user.id;
    }
    api(command, object, newParams,function(err,result){
        if (err){
            if (err instanceof UserError){
                res.status(200).send(err.message);
            }else{
                res.status(500).send(err);
            }
        }else{
            res.status(200).send(result);
        }
    });
};



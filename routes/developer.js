var api = require('../libs/apiDev');
exports.get = function(req, res, next){
    res.render('developer',{
        title:"developer"
    })
};
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

    api(command, object, newParams,function(err,result){
        if (err){
            res.status(500).send(err);
        }else{
            res.status(200).send(result);
        }
    });
};



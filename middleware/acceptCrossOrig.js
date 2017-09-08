var HttpError = require('../error').HttpError;

module.exports = function(req, res, next){

    if (!req.headers.origin) return next();
    // return next();

    var origins = [
        'http://127.0.0.1',
        'http://ccs.vgfinancing.com',
        'http://ccs.msk.ru'
    ];

    if (!req.headers) req.headers = {
        origin:''
    };


    for (var i = 0; i < origins.length; i++) {
        var origin = origins[i];


        if (req.headers.origin.indexOf(origin) > -1) {
            res.header('Access-Control-Allow-Origin', req.headers.origin);
        }
    }

    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
};
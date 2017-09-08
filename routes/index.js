var checkAuth = require('../middleware/checkAuth');
var checkAuthApi = require('../middleware/checkAuthApi');
var checkAdmin = require('../middleware/checkAdmin');
var acceptCrossOrig = require('../middleware/acceptCrossOrig');
var checkAccess = require('../middleware/checkAccess');
var path = require('path');

module.exports = function (app, express) {
    app.get('/test', function (req, res, next) {
        res.render('test');
    });
//    app.use('/test2', app.static(path.join(__dirname, 'public')));

    //app.get('/developer', require('./developer').get);
    /*app.get('/developer', function (req, res, next) {
        res.locals.test = '123';
        next();
    });*/
    //app.post('/developer', checkDeveloper, require('./developer').post);

    //app.get('/admin', checkAdmin, require('./admin').get);
    app.get('/admin', require('./admin').get);
    app.post('/admin/api', checkAdmin, require('./adminApi').post);
    app.post('/api', checkAccess, require('./userApi').post);
    //app.post('/sendFeedback', require('./sendFeedback').post);

    app.get('/login', require('./login').get);
    app.post('/login', require('./login').post);


    app.post('/bank/insertPayment', require('../middleware/loadUser'), require('./bank').insertPayment);

    app.get('/site_api',acceptCrossOrig,
        function (req, res, next) {
            for (var i in req.query) {
                req.body[i] = req.body[i] || req.query[i];
            }
            next();
        },
        require('../middleware/loadSiteUser'), require('./site_api').site_api);
    app.post('/site_api',acceptCrossOrig,
        function (req, res, next) {
            for (var i in req.query) {
                req.body[i] = req.body[i] || req.query[i];
            }
            next();
        },
        require('../middleware/loadSiteUser'), require('./site_api').site_api);
    
    app.post('/add_user', require('./login').add_user);
    app.get('/add_user', function (req, res, next) {
        res.render('add_user');
    });

    app.post('/logout', require('./logout').post);
    app.get('/private', checkAuth, require('./private').get);
    app.get('/files/', require('../middleware/loadUser'), require('./download_file').get);
    app.get('/files/*+', function (req, res, next) {
        res.status(403).send('Отказано в доступе');
    });

};


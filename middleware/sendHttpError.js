module.exports = function (req, res, next) {
    res.sendHttpError = function (error) {
        res.status(error.status);
        if (res.req.headers['x-requested-whit'] == 'XMLHttpRequest') {
            res.json(error);
        } else {
            res.render('error', {message: error.message});
        }
    };
    next();
};
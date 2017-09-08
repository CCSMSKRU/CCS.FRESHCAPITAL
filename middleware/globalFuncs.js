module.exports = function(req, res, next){
    res.locals.funcs = {
        returnA:function(){
            return 'A';
        }
    };

    next();
};
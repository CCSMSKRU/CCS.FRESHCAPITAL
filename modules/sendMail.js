var MyError = require('../error').MyError;
var sendMail = require('../libs/sendMail');
var config = require('../config');

var sendFeedback = function(obj, callback){
    if (typeof obj!='object'){
        return callback(new MyError('Не корректно переданы параметры.'));
    }

    var html = obj.html;
    var o = {
        email:config.get('feedbackEmail'),
        subject:'Форма обратной связи CFFT.',
        html:html
    };
    sendMail(o,function(err){
        if (err){
            return callback(err);
        }
        callback(null);
    });
};


module.exports.sendFeedback = sendFeedback;

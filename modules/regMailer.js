var MyError = require('../error').MyError;
var sendMail = require('../libs/sendMail');


var sendConfirm = function(obj, callback){
    if (typeof obj!='object'){
        return callback(new MyError(''));
    }

    var lnk = obj.host+ '/reqConfirm?email='+obj.email+'&p='+obj.guid;
    var html = ' <p>Вы упешно зарегистрировались на портале cfft.ru, посвященном CrossFit!<br/>' +
        'Перейдите по <a href="'+lnk+
        '">этой ссылке</a>, что бы подтвердить регистрацию.</p>' +
        '<p><br/>С уважением, Карягин Илья.</p>';
    var o = {
        email:obj.email,
        subject:'Подтверждение регистрации',
        html:html
    };
    sendMail(o,function(err){
        if (err){
            return callback(err);
        }
        callback(null);
    });
};
var sendSuccessConfirm = function(obj, callback){
    if (typeof obj!='object'){
        return callback(new MyError(''));
    }
    var o = {
        email: obj.email,
        subject: 'Успешная регистрация',
        html: 'Вы успешно зарегистрировались'
    };
    sendMail(o, function (err) {
        callback(err);


    });
};
var sendSuccessUnsubscribe = function(obj, callback){
    if (typeof obj!='object'){
        return callback(new MyError(''));
    }
    var o = {
        email: obj.email,
        subject: 'Отказ от рассылки',
        html: 'Вы успешно отписались от рассылки.'
    };
    sendMail(o, function (err) {
        callback(err);
    });
};


module.exports.sendConfirm = sendConfirm;
module.exports.sendSuccessConfirm = sendSuccessConfirm;
module.exports.sendSuccessUnsubscribe = sendSuccessUnsubscribe;
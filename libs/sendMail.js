var nodemailer = require('nodemailer');
var config = require('../config/index');
var send = function(obj, cb){
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var _t = this;
    console.log(config.get('mail:mailTransport'));
    var transporter = nodemailer.createTransport(config.get('mail:mailTransport'));
    var mailOptions = {
        from: config.get('mail:from'),
        to: obj.email,
        subject: obj.subject || 'Уведомление', // Subject line
        text: obj.text || '...', // plaintext body
        html: obj.html || '...',
        attachments:[]
    };
    if (Array.isArray(obj.attachments)) {
        for (var i in obj.attachments) {
            mailOptions.attachments.push(obj.attachments[i]);
        }
    }
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(config.get('mail:mailTransport'));
            console.log(error, info);
            cb(error, info);
        }else{
            console.log('mail sended ---' + obj.email + '----> Ок');
            cb(null, info);
        }
    });
};
module.exports = send;
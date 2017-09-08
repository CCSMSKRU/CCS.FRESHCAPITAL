var nodemailer = require('nodemailer');

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'ivantgco@gmail.com',
        pass: 'kuba09kah'
    }
});

// NB! No need to recreate the transporter object. You can use
// the same transporter object for all e-mails

// setup e-mail data with unicode symbols
var mailOptions = {
    from: 'NodeJS MAiler Ivantgco <ivantgco@gmail.com>', // sender address
    to: 'ivantgco@gmail.com', // list of receivers
    subject: 'Тест отправки электронной почты', // Subject line
    text: 'Тест отправки электронной почты', // plaintext body
    html: '<b>Тест отправки электронной почты ✔</b>' // html body
};

// send mail with defined transport object
transporter.sendMail(mailOptions, function(error, info){
    if(error){
        console.log(error);
    }else{
        console.log('Message sent: ' + info.response);
    }
});


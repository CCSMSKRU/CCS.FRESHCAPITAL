var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var config = require('./config');
var sendMail = require('./libs/sendMail');
console.logPrototype = console.log;
var app = express();



setTimeout(function () {
    //var backgrounds = require('./modules/background_process');
},10000);
global.pool = require('./libs/mysqlConnect');
global.models = [];
global.classes = {};
global.classesCache = {};
global.downloads = {};
process.on('exit', function(code) {
    console.log('process exit');
    pool.end(function(err){
        console.log('poolEnd');
        console.log(err);
    });
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
var HttpError = require('./error').HttpError;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

require('dns').lookup(require('os').hostname(), function (err, add, fam) {
    console.log('addr: '+add);
});


var sessionStore = require('./libs/sessionStore');
app.use(session({
    secret: config.get('session:secret'),
    key: config.get('session:key'),
    cookie: config.get('session:cookie'),
    store: sessionStore,
    resave: true,
    saveUninitialized: true
}));

app.use(require('./middleware/sendHttpError'));
//app.use(require('./middleware/loadUser'));
app.use(require('./middleware/globalFuncs'));

require('./routes')(app);

/**/
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: function(res, path) {
        res.set({
            'Access-Control-Allow-Origin': '*'
        })
    }
}));
/*
app.use(express.static(path.join(__dirname, 'public'), {
    'Access-Control-Allow-Origin': '*'
}));
app.use(express.static(path.join(__dirname, 'public'), {
    'Access-Control-Allow-Origin': '*'
}));*/



/*** БЛОК ДЛЯ ТЕСТОВ ******/

/*var o = {
 command:"add",
 object:"action",
 params:{
 title:"TEST ACTION 1",
 description:"sdfds",
 cost:"1000",
 payment_type_id:10
 }
 };
 sendQuery(o,function(r){console.log(r);});*/

// var libreconv  = require('libreconv');
// var test = libreconv.convert('test/test1.xlsx','pdf');
// console.log(test);
//c:/LibreOffice5/program/soffice.exe --headless --convert-to pdf --outdir "/tmp/libreconv-25BIhT" "D:\NET\CCS.VG\test\test1.xlsx"



/*** КОНЕЦ БЛОК ДЛЯ ТЕСТОВ ******/


//app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Страница не найдена');
    console.log(req, res);
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {

}
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    console.log(err.stack);
    res.render('error', {
        message: err.message,
        error: err
    });
});



console.log('-------------------------------------------------');
console.log('SERVER STARTED');
module.exports = app;


/*
 var moment = require('moment');
 var funcs = require('./libs/functions');
 var timeAgo = moment().diff(moment('2014-12-18'));
 var p = (timeAgo<=moment.duration(3, 'months'));
 console.log('timeAgo',timeAgo, p);*/

/*var m1 = moment();
 var m2 = moment.duration(2, 'years');
 console.log(moment(m1-m2).format('YYYY-MM-DD'));*/
/*
 var api = require('./libs/api');

 api('doSubscribe','action',{html:'<b>ТЕСТ РАСССЫЛКИ</b>'},function(err,result){
 console.log(err, result);
 });*/

/*var api = require('./libs/api');
 api('rePositionAll', 'results', {},function(err,result){
 if (err){
 console.log(err);
 }else{
 console.log(result);
 }
 });*/
/*var api = require('./libs/userApi');
 api('allActionLeaderBoard', 'results', {age:'40',gender_sys_name:'MALE'},function(err,result){
 if (err){
 console.log(err);
 }else{
 console.log(result);
 }
 });*/
/*var sendMail = require('./libs/sendMail');

 var o = {
 email: 'ivantgco@gmail.com',
 subject: 'ТЕСТ от рассылки',
 html: 'Вы успешно отписались от рассылки.'
 };
 sendMail(o, function (err) {
 console.log(err);
 //  callback(err);
 });*/

//git remote set-url origin https://github.com/alextgco/cfft
//git remote set-url origin ssh://cfft1@dotcloudapp.com/repository.git
//git commit -am 'note'
//dcapp cfft1/default push
//dcapp cfft1/default deploy

//mysql -u deptezf2upj -p deptezf2upj --host=173.194.241.167
// http://104.236.248.75:<app-port>

//TEST master
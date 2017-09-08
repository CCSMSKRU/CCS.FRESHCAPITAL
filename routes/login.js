//var User = require('../models/user').User;

var HttpError = require('../error').HttpError;
var AuthError = require('../error').AuthError;
var MyError = require('../error').MyError;
var Guid = require('guid');
var funcs = require('../libs/functions');
var api = require('../libs/userApi');

exports.get = function(req, res, next){

    res.writeHead(301,
        {
            Location: 'login.html'
        }
    );
    res.end();


    //res.render('login',{
    //    title:"Login"
    //})
};

exports.post = function(req, res, next){
    var login = req.body.login;
    var password = req.body.password;

    api('authorize', 'user', {
        login:login,
        password:password
    }, function(err,user){
        if (err){
            console.log('Ошибка авторизации');
            console.log(err);
            if (err instanceof AuthError){
                return res.json(403, err);
            }else{
                return next(err);
            }
        }
        req.session.user = user.id;
        res.send(200);
    });




};
exports.add_user = function(req, res, next) {
    // Обрабатываем запрос
    if (!req.body.password){
        return res.json(403, {message:'Не указан пароль'});
    }
    var guid = Guid.create().value;
    var guid2 = Guid.create().value;
    /*
     * id
     firstname
     surname
     secondname
     phone
     city_id
     gender_id
     weight
     birthday
     height
     photo
     isAgree
     raiting
     isBanned
     bannedToDate
     email
     hashedPassword
     salt
     created
     confirmed
     mailKey
     isAdmin
     deleted
     published
     age

     */
    var unsubscribe_key = (req.body.email+'_'+guid2).substr(0,254);
    var obj = {
        login:req.body.login,
        firstname:req.body.name,
        surname:req.body.surname,
        email:req.body.email,
        secondname:req.body.secondname,
        gender_id:req.body.gender_id,
        birthday:req.body.birthday,
        city_id:req.body.city_id,
        age:funcs.age(req.body.birthday),
        isAgree:(req.body.isAgree)?1:0,
        unsubscribe_key:unsubscribe_key,
        password:req.body.password,
        mailKey:guid,
        phone:req.body.phone,
        weight:req.body.weight,
        height:req.body.height,
        photo:req.body.photo

    };

    api('registration', 'user', obj, function(err,user_id){
        if (err){
            console.log(err);
            if (err instanceof MyError){
                return res.status(403).json(funcs.formatResponse(-1,'error',err.message));
                //return res.json(403, err);
            }else if (err instanceof UserError){
                return res.status(403).json(err);
            }else{
                return next(err);
            }
        }
        // Здесь отправка на почту
        var host = req.protocol +'://'+ req.host;
        if (req.host=='localhost'){
            host += ':3000';
        }
        return res.status(200).json(funcs.formatResponse(0, 'success', 'Пользователь добавлен'));


    });
};
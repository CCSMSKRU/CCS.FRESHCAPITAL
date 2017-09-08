var HttpError = require('../error').HttpError;
var AuthError = require('../error').AuthError;
var MyError = require('../error').MyError;
var UserError = require('../error').UserError;
var jade = require('jade');
var Guid = require('guid');
var sendConfirm = require('../modules/regMailer').sendConfirm;
var funcs = require('../libs/functions');

var api = require('../libs/userApi');
var apiAdmin = require('../libs/api');

var sendMail = require('../libs/sendMail');
exports.get = function(req, res, next){
    res.render('registration',{
        title:"Регистрация"
    })
};
exports.post = function(req, res, next){
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
        photo:req.body.photo,
        club_id:req.body.club_id

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
        sendConfirm({
            host:host,
            email:obj.email,
            guid:guid
        }, function(err){
            if (err){
                console.log(err);
                apiAdmin('remove', 'user', {
                    id:user_id
                }, function(err,results){
                    if (err){
                        return res.status(403).json(err);
                    }
                    return res.status(403).json( {message:"Не удалось завершить регистрацию"});
                });
            }else{
                return res.status(200).json(funcs.formatResponse(0, 'success', 'На почту, указанную при регистрации отправлено письмо со ссылкой на подтверждение регистрации'));
            }
        });

    });

/*

    user.registration(obj,function(err, user_id){
        if (err){
            console.log(err);
            if (err instanceof AuthError){
                return res.json(403, err);
            }else{
                return next(err);
            }
        }
        // Здесь отправка на почту
        var host = req.protocol +'://'+ req.host;
        if (req.host=='localhost'){
            host += ':3000';
        }
        sendConfirm({
            host:host,
            email:obj.email,
            guid:guid
        }, function(err){
            if (err){
                console.log(err);
                user.remove(user_id,function(err){
                    if (err){
                        return res.json(403, err);
                    }
                    return res.json(403, {message:"Не удалось завершить регистрацию"});
                });
            }else{
                return res.json(200, {toastr:{type:'success',message:"На почту, указанную при регистрации отправлено письмо со ссылкой на подтверждение регистрации"}});
            }
        });

    });
*/

};
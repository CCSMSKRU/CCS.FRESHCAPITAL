//var User = require('../models/user').User;


var api = require('../libs/api');
var sendMail = require('../libs/sendMail');
var BankError = require('../error').BankError;
var UserOk = require('../error').UserOk;
var getCode = require('../libs/getCode');


exports.insertPayment = function(req, response, next){

    // Здесь должна произойти проверка подленности и подгрузиться соответствующий юзер из компании банка

    api({
        command: 'insertPayment',
        object: 'Bank',
        params: req.body
    }, function(err, res){


        if (err instanceof UserOk) {

            return response.status(200).json(getCode('ok', err));
        }

        return response.status(200).json(err);


    },req.user);


};
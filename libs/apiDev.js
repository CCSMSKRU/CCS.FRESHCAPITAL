var MyError = require('../error').MyError;
var tables = require('../models/system/tables');
var Table = require('../models/system/Table');
module.exports = function(command,object,params,callback){
    if (typeof callback!=='function') return console.log('Передано не верное число параметров для api(command,object,params,callback)');
    console.log('=====Developer API=================================');
    console.log('command',command);
    switch (object){
        case 'Table':
            var table = new Table({name:params.name});
            if (typeof table[command]!=='function'){
                callback(new MyError('Нет такой функции '+command));
                break;
            }
            table[command](function (err, res) {
                callback(err, res);
            });
            break;
    }
};


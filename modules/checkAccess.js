var MyError = require('../error').MyError;
var UserError = require('../error').UserError;



var check = function(obj, cb){
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var user = obj.user;
    if (typeof user !== 'object') return cb(new MyError('Не передан пользователь.', {obj:obj}));
    var command = obj.command;
    if (!command) return cb(new MyError('В checkAccess не передан command', {obj:obj}));
    command = command.toLowerCase();
    var object = obj.object;
    if (!object) return cb(new MyError('В checkAccess не передан object', {obj:obj}));
    object = object.toLowerCase();
    var client_object = obj.client_object;
    if (client_object) client_object = client_object.toLowerCase();
    var email = user.user_data.email;
    if (!email) return cb(new MyError('У пользователя отсутствует email', {obj:obj}));
    email = email.toLowerCase();

    if (!denyAccessObj[email]) return cb(null);
    if (!denyAccessObj[email][object]) return cb(null);
    if (denyAccessObj[email][object]['*']) return cb(new UserError('noAccess'));
    if (!denyAccessObj[email][object][command]) return cb(null);
    if (denyAccessObj[email][object][command].indexOf('*') !== -1) return cb(new UserError('noAccess'));
    if (client_object && denyAccessObj[email][object][command].indexOf(client_object) !== -1) return cb(new UserError('noAccess'));

    return cb(null);
};


var denyAccessObj = {
    // 'ivantgco@gmail.com':{
    //     financing_request:{
    //         get:['*']  // Ограничет доступ к любым КЛИЕНТСКИМ ОБЪЕКТАМ для GET-команды класса financing_request
    //     },
    //     merchant:{
    //         '*':[], // Ограничет доступ к любым коммандам класса merchant
    //         get:['form_merchant']
    //     }
    // }
};


module.exports.check = check;

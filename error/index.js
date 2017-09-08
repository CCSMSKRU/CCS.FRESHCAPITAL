var util = require('util');
var http = require('http');

//ошибки для выдачи посетителю

function HttpError(status, message){
    Error.apply(this,arguments);
    Error.captureStackTrace(this, HttpError);
    this.status = status;
    this.message = message || http.STATUS_CODES[status] || 'Error';
}
util.inherits(HttpError, Error);
HttpError.prototype.name = 'HttpError';

function AuthError(message){
    Error.apply(this,arguments);
    Error.captureStackTrace(this, AuthError);
    this.message= message;
}
util.inherits(AuthError, Error);
AuthError.prototype.name = 'AuthError';

function MyError(message, data){
    Error.apply(this,arguments);
    Error.captureStackTrace(this, MyError);
    this.message= message;
    this.data = (typeof data==="undefined")? {} : data;
}
util.inherits(MyError, Error);
MyError.prototype.name = 'MyError';


function UserError(message, data){
    Error.apply(this,arguments);
    Error.captureStackTrace(this, UserError);
    this.message= message;
    this.data = (typeof data==="undefined")? {} : data;
}
util.inherits(UserError, Error);
UserError.prototype.name = 'UserError';


function BankError(message, data){
    Error.apply(this,arguments);
    Error.captureStackTrace(this, BankError);
    this.message= message;
    this.data = (typeof data==="undefined")? {} : data;
}
util.inherits(BankError, Error);
BankError.prototype.name = 'BankError';


function UserOk(message, params){
    this.message = message;
    if (typeof params==="string") this.type = params;
    if (typeof message==="object") {
        for (var i in message) {
            this[i] = message[i];
        }
    }
    if (typeof params==="object") {
        for (var i in params) {
            this[i] = params[i];
        }
    }
    this.message = (typeof this.message!=="undefined") ? this.message : '';
}


exports.UserOk = UserOk;
exports.UserError = UserError;
exports.BankError = BankError;
exports.MyError = MyError;
exports.AuthError = AuthError;
exports.HttpError = HttpError;
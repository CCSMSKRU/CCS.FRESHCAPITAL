/**
 * Created by iig on 29.10.2015.
 */
var MyError = require('../error').MyError;
var UserError = require('../error').UserError;
var UserOk = require('../error').UserOk;
var BasicClass = require('./system/BasicClass');
var util = require('util');
var async = require('async');
var rollback = require('../modules/rollback');
var funcs = require('../libs/functions');
var request = require('request');
var fs = require('fs');
var moment = require('moment');
var parseString = require('xml2js').parseString;
let windows1251 = require('windows-1251');
const {exec} = require('child_process');


var Model = function(obj){
    this.name = obj.name;
    this.tableName = obj.name.toLowerCase();

    var basicclass = BasicClass.call(this, obj);
    if (basicclass instanceof MyError) return basicclass;
};
util.inherits(Model, BasicClass);
Model.prototype.getPrototype = Model.prototype.get;
Model.prototype.addPrototype = Model.prototype.add;
Model.prototype.modifyPrototype = Model.prototype.modify;
Model.prototype.removeCascadePrototype = Model.prototype.removeCascade;

Model.prototype.init = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
    var _t = this;
    Model.super_.prototype.init.apply(this, [obj , function (err) {
        cb(null);
    }]);
};

Model.prototype.get = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var client_object = _t.client_object || '';

    var coFunction = 'get_' + client_object;
    if (typeof _t[coFunction] === 'function') {
        _t[coFunction](obj, cb);
    } else {
        if (typeof _t['get_'] === 'function') {
            _t['get_'](obj, cb);
        } else {
            _t.getPrototype(obj, cb);
        }
    }
};

Model.prototype.add = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var client_object = _t.client_object || '';

    var coFunction = 'add_' + client_object;
    if (typeof _t[coFunction] === 'function') {
        _t[coFunction](obj, cb);
    } else {
        if (typeof _t['add_'] === 'function') {
            _t['add_'](obj, cb);
        } else {
            _t.addPrototype(obj, cb);
        }
    }
};

Model.prototype.modify = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var client_object = _t.client_object || '';

    var coFunction = 'modify_' + client_object;

    if (typeof _t[coFunction] === 'function') {
        _t[coFunction](obj, cb);
    } else {
        if (typeof _t['modify_'] === 'function') {
            _t['modify_'](obj, cb);
        } else {
            _t.modifyPrototype(obj, cb);
        }
    }
};

Model.prototype.removeCascade = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var client_object = _t.client_object || '';

    var coFunction = 'removeCascade_' + client_object;

    if (typeof _t[coFunction] === 'function') {
        _t[coFunction](obj, cb);
    } else {
        if (typeof _t['removeCascade_'] === 'function') {
            _t['removeCascade_'](obj, cb);
        } else {
            _t.removeCascadePrototype(obj, cb);
        }
    }
};

Model.prototype.example = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();

    async.series({

    },function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            //if (!obj.doNotSaveRollback){
            //    rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'METHOD_NAME', params:obj});
            //}
            cb(null, new UserOk('Ок'));
        }
    });
};


let genRequestBody = function () {
    let body = '<?xml version="1.0" ?>' +
        // '<?xml version="1.0" encoding="windows-1251" ?>' +
        '<product>' +
        '   <prequest>' +
        '       <req>' +
        '           <AddressReq>' +
        // '               <district>ДСТР</district>' +
        // '               <houseNumber>123</houseNumber>' +
        '               <street>КРАСНОСЕЛЬСКАЯ, 39</street>' +
        // '               <block>1</block>' +
        // '               <building>2</building>' +
        // '               <apartment>3</apartment>' +
        '               <city>МОСКВА</city>' +
        // '               <prov>56</prov>' +
        '               <postal>105066</postal>' +
        '               <addressType>3</addressType>' +
        '           </AddressReq>' +
        '           <AddressReq>' +
        // '               <district>ДСТР</district>' +
        // '               <houseNumber>123</houseNumber>' +
        '               <street>КРАСНОСЕЛЬСКАЯ, 39</street>' +
        // '               <block>1</block>' +
        // '               <building>2</building>' +
        // '               <apartment>3</apartment>' +
        '               <city>МОСКВА</city>' +
        // '               <prov>56</prov>' +
        '               <postal>105066</postal>' +
        '               <addressType>4</addressType>' +
        '           </AddressReq>' +
        '           <IdReq>' +
        '               <idNum>7701889831</idNum>' +
        '               <idType>81</idType>' +
        '           </IdReq>' +
        '           <IdReq>' +
        '               <idNum>1107746736811</idNum>' +
        '               <idType>34</idType>' +
        '               <issueDate>1900-01-02</issueDate>' +
        '           </IdReq>' +
        '           <InquiryReq>' +
        '               <ConsentReq>' +
        '                   <consentFlag>Y</consentFlag>' +
        '                   <consentDate>2016-01-20</consentDate>' +
        '                   <consentExpireDate>2020-02-15</consentExpireDate>' +
        '                   <consentPurpose>1</consentPurpose>' +
        '                   <otherConsentPurpose> </otherConsentPurpose>' +
        '                   <reportUser>ПАО Банк «Успешный»</reportUser>' +
        '                   <liability>Y</liability>' +
        '               </ConsentReq>' +
        '               <inqPurpose>99</inqPurpose>' +
        '               <inqAmount>1000</inqAmount>' +
        '               <currencyCode>RUB</currencyCode>' +
        '           </InquiryReq>' +
        '           <BusinessReq>' +
        '               <businessName>ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ' +
        '               \'Мир билета\'</businessName>' +
        '           </BusinessReq>' +
        '           <RequestorReq>' +
        '               <MemberCode>FG01LL000000</MemberCode>' +
        '               <UserID>FG01LL000005</UserID>' +
        '               <Password>Abce1234</Password>' +
        '           </RequestorReq>' +
        '           <RefReq>' +
        '               <userReference>TESTRequest01</userReference>' +
        '               <product>BHST</product>' +
        '           </RefReq>' +
        '           <requestDateTime>2006-06-08</requestDateTime>' +
        '           <IOType>B2B</IOType>' +
        '           <OutputFormat>XML</OutputFormat>' +
        '           <lang>ru</lang>' +
        '       </req>' +
        '   </prequest>' +
        '</product>';

    return body;
};
Model.prototype.loadData = function (obj, cb) {
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));

    try {
        let body = genRequestBody();
        let guid = moment().format('DDMMYYYY') + '_' + funcs.guid();
        let filename = guid + '.xml';
        let filename_sgn = filename + '.sgn';
        let path = 'modules/utils/cryptcp/';

        async.waterfall([
            //getNBKIData:
            (cb) => {
                request({
                    method: 'POST',
                    url: 'http://icrs.demo.nbki.ru/products/B2BRequestServlet',
                    headers: {
                        // 'Content-Type': 'application/xml'
                        'Content-Type': 'text/xml',
                        'UserAgent': 'HTTPTool/1.0'
                    },
                    encoding: null,
                    body: body
                }, function (error, res, body) {
                    if (error) return cb(error, new MyError('Ошибка выполнения запроса'));

                    cb(null, body);
                });
            },
            //saveSignedFile:
            (body, cb) => {
                fs.writeFile(path + filename_sgn, body, function (error) {
                    if (error) return cb(error, new MyError('Ошибка сохранения'));

                    cb(null);
                });
            },
            //deleteSign:
            (cb) => {
                exec(
                    'cd ' + path + ' & ' +
                    'cryptcp.x64 -verify -dn "icrs.demo.nbki.ru, OJSC NBCH 2017, Moscow, Moscow, RU, support@nbki.ru" ' + filename_sgn + ' ' + filename,
                    (error, stdout, stderr) => {
                        if (error) return cb(error, new MyError('Ошибка снятия подписи'));

                        // console.log(`stdout: ${stdout}`);
                        // console.log(`stderr: ${stderr}`);

                        cb(null);
                    });
            },
            //readFile:
            (cb) => {
                fs.readFile(path + filename, (error, data) => {
                    if (error) return cb(error, new MyError('Ошибка чтения файла'));

                    cb(null, windows1251.decode(data.toString('binary')));
                });
            },
            //parseXML:
            (data, cb) => {
                parseString(data, (error, res) => {
                    if (error) return cb(error, new MyError('Ошибка парсинга xml'));

                    cb(null, {body: res});
                });
            }
        ], function (error, res) {
            if (error) return cb(error, new MyError('Ошибка выполнения'));

            cb(null, {body: res});
        });
    } catch (e) {
        cb(e);
    }
};

Model.prototype.saveDataToCSV = function (obj, cb) {
    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));

    try {
        this.loadData(obj, function (err, res) {
            if (res && res.body && res.body.body) {
                let body = res.body.body;

                let guid = Math.floor(Math.random() * 1000001);
                let date = moment().format('DDMMYYYY');

                let filename = 'nbki_' + date + '_' + guid + '.csv';

                fs.writeFile('./public/savedFiles/' + filename, funcs.parseObjectToString(body, 0), function (err) {
                    if (err) return cb(new MyError('Не удалось записать файл', {err: err}));
                    return cb(null, new UserOk('Ok', {
                        body: body,
                        path: funcs.getSystemURL() + 'savedFiles/' + filename
                    }));
                });
            } else {
                return cb(null, new MyError('Нет данных по: ' + org_name));
            }
        });
    } catch (e) {
        cb(e);
    }
};


module.exports = Model;
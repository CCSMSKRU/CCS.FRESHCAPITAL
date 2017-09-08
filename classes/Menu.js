/**
 * Created by iig on 29.10.2015.
 */
var MyError = require('../error').MyError;
var BasicClass = require('./system/BasicClass');
var util = require('util');

var Model = function(obj){
    this.name = obj.name;
    this.tableName = obj.name.toLowerCase();

    var basicclass = BasicClass.call(this, obj);
    if (basicclass instanceof MyError) return basicclass;
};
util.inherits(Model, BasicClass);

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

Model.prototype.get_menu_tree = function (params, cb) {
    if (typeof cb!=='function') throw new MyError('В метод не передана функция callback');
    if (typeof params!=='object') return cb(new MyError('В метод не переданы params'));
    var _t = this;
    //params.collapseData = false;
    params.order_by = 'sort_no';
    params.sort = 'sort_no';
    params.limit = false;
    params.param_where = {
        is_visible:true
    };

    var user_id = _t.user.user_data.id;

    _t.get(params, function (err, res) {

        if(user_id == 18){

            for(var i in res.data){

                if(res.data[i][res.data_columns.indexOf('menu_item')] != 'dashboard' && res.data[i][res.data_columns.indexOf('menu_item')] != 'base_data'){

                    res.data[i][res.data_columns.indexOf('is_visible')] = false;

                }
            }
        }

        cb(err, res);
    })
};



module.exports = Model;
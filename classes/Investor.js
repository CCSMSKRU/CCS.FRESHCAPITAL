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
var moment = require('moment');
var fs = require('fs');
var XlsxTemplate = require('xlsx-template');
var sendMail = require('../libs/sendMail');

var Model = function(obj){
    this.name = obj.name;
    this.tableName = obj.name.toLowerCase();

    var basicclass = BasicClass.call(this, obj);
    if (basicclass instanceof MyError) return basicclass;
};
util.inherits(Model, BasicClass);
Model.prototype.addPrototype = Model.prototype.add;
Model.prototype.modifyPrototype = Model.prototype.modify;

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

Model.prototype.add_ = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id;

    var rollback_key = rollback.create();
    async.series({
        add: function (cb) {
            _t.addPrototype(obj, function (err, res) {
                if (err) return cb(err);
                id = res.id;
                cb(null, res);
            });
        },

        addHistory: function (cb) { // Создадим запись в истории мерчанта
            obj.desc = 'Новый инвестор';
            obj.id = id;
            _t.addHistory(obj, cb);
        }
    }, function (err, res) {
        if (err) return cb(err);
        cb(null, res.add);
    })
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

Model.prototype.modify_ = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    if (typeof obj.main_investor === 'undefined') {
        async.series({
            modify: function (cb) {
                _t.modifyPrototype(obj, cb);
            },
            addHistory: function (cb) { // Создадим запись в истории мерчанта
                obj.id = id;
                obj.desc = 'Изменение';
                _t.addHistory(obj, cb);
            }
        }, function (err, res) {
            if (err) return cb(err);
            cb(null, res.modify);
        });
        return;
    }
    if (obj.main_investor === false) return cb(new UserError('Нельзя снять галочку "Основной инвестор"'));
    if (obj.confirm != 'set_main_investor'){
        return cb(new UserError('needConfirm', {message: '',title:'Необходимо подтверждение',key:1, confirmType:'dialog',responseType:'text'}));
    }
    var rollback_key = obj.rollback_key || rollback.create();
    async.series({
        diselectAll: function (cb) {
            var params = {
                param_where:{
                    main_investor:true
                },
                collapseData:false
            };
            _t.get(params, function (err, res) {
                if (err) return cb(new MyError('При попытке получить инвесторов с пометкой main_investor возникла ош',{params:params, err:err}));
                async.eachSeries(res, function (item, cb) {
                    async.series({
                        modify: function (cb) {
                            var params = {
                                id:item.id,
                                main_investor:false,
                                rollback_key:rollback_key
                            };
                            _t.modifyPrototype(params, function (err, res) {
                                if (err) return cb(new MyError('Не удалось снять галочку main_investor.',{params:params, err:err}));
                                cb(null);
                            });
                        },
                        addHistory: function (cb) { // Создадим запись в истории мерчанта
                            var o = {
                                id:item.id,
                                desc:'Изменение',
                                rollback_key:rollback_key
                            }
                            _t.addHistory(o, cb);
                        }
                    },cb);

                }, cb);
            })
        },
        setCurrent: function (cb) {
            var params = {
                id:id,
                main_investor:obj.main_investor,
                rollback_key:rollback_key
            }
            _t.modifyPrototype(params, function (err, res) {
                if (err) return cb(new MyError('Не удалось установить параметр "Основной инвестор"',{params:params, err:err}));
                cb(null);
            })
        },
        setAnowerParams: function (cb) {
            var obj2 = funcs.cloneObj(obj);
            delete obj2.main_investor;
            delete obj2.confirm;
            delete obj2.confirmKey;
            if (Object.keys(obj2).length <= 2) return cb(null); // нет других параметров для установки.
            _t.modifyPrototype(obj, function (err, res) {
                if (err) return cb(new MyError('Не удалось изменить',{obj:obj2, err:err}));
                cb(null);
            });
        },
        addHistory: function (cb) { // Создадим запись в истории мерчанта
            obj.id = id;
            obj.rollback_key = rollback_key;
            _t.addHistory(obj, cb);
        }
    }, function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({rollback_key:rollback_key,user:_t.user}, function (err2) {
                return cb(err, err2);
            });
        }else{
            rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'setMainInvestor', params:obj});
            cb(null, new UserOk('Параметр "Основной инвестор" изменен.'));
        }
    })


    //rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'prepareAgreement', params:obj});
};

Model.prototype.toDefaultDeposit = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();

    var amount = +obj.amount;
    if (isNaN(+amount)) return cb(new UserError('Сумма указана не корректно.',{obj:obj}));

    // Получим счет по умолчанию.
    // Внести сумму

    var account;
    async.series({
        getDefaultAccount: function (cb) {
            var o = {
                command:'getDefault',
                object:'Investor_account',
                params:{
                    investor_id:id,
                    rollback_key:rollback_key
                }
            }
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('При попытке получить счет по умолчанию возникла ош.',{o:o, err:err}));
                account = res.account;
                if (typeof account !=='object') return cb(new MyError('При получении счета получен неожиданный результат.',{o:o, res:res, accont:account}));
                cb(null);
            })
        },
        toDeposit: function (cb) {
            var o = {
                command:'toDeposit',
                object:'investor_account',
                params:{
                    id:account.id,
                    amount:amount,
                    operation_date:obj.operation_date,
                    rollback_key:rollback_key
                }
            }
            _t.api(o, cb);
        }
    },function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'toDefaultDeposit', params:obj});
            cb(null, new UserOk('Счет пополнен: ' + amount));
        }
    });

};

Model.prototype.withdrowlDefaultDeposit = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();


    // Получим счет по умолчанию.
    // Вывести сумму

    var account;
    async.series({
        getDefaultAccount: function (cb) {
            var o = {
                command:'getDefault',
                object:'Investor_account',
                params:{
                    investor_id:id,
                    rollback_key:rollback_key
                }
            }
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('При попытке получить счет по умолчанию возникла ош.',{o:o, err:err}));
                account = res.account;
                if (typeof account !=='object') return cb(new MyError('При получении счета получен неожиданный результат.',{o:o, res:res, accont:account}));
                cb(null);
            })
        },
        witdrawalOfFunds: function (cb) {

            var o = {
                command:'witdrawalOfFunds',
                object:'investor_account',
                params:{
                    id:account.id,
                    amount:obj.amount,
                    operation_date:obj.operation_date,
                    purpose:obj.purpose,
                    rollback_key:rollback_key,
                    doNotSaveRollback:true
                }
            }
            _t.api(o, cb);
        }
    },function (err, res) {
        if (err) {
            if (err.message == 'needConfirm') return cb(err);
            rollback.rollback({obj:obj, rollback_key: rollback_key, user: _t.user}, function (err2) {
                return cb(err, err2);
            });
        } else {
            rollback.save({rollback_key:rollback_key, user:_t.user, name:_t.name, name_ru:_t.name_ru || _t.name, method:'withdrowlDefaultDeposit', params:obj});
            cb(null, res.witdrawalOfFunds[0]);
        }
    });

};



Model.prototype.report1 = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    var name = obj.name || 'investor_report_rus_2.xlsx';
    var report_date = obj.report_date || funcs.getDate();

    // var weekAgoStart = moment(report_date, 'DD.MM.YYYY').startOf('week').add(-6,'day').format('DD.MM.YYYY');
    // var weekAgoEnd = moment(report_date, 'DD.MM.YYYY').startOf('week').add(-2,'day').format('DD.MM.YYYY');


	var weekAgoStart = moment(report_date, 'DD.MM.YYYY').startOf('week').format('DD.MM.YYYY');
	var weekAgoEnd = report_date;
    var data, readyData, template, binaryData, filename;
    var manager_fee_percent = 0.01;
    var days_per_week = 5; // gov calendar
//    var main_company_commision = 0.4; //UNUSED!

    var investor, account;
    var operations = [];
    var financings, bank;
    var merchants = {};
    var financings = {};
    var merchant_financing_ids = [];
    var merchant_invests;

    var name_ru;// = 'Отчет инвестора('+ investor.name +')_' + moment().format('DD_MM_YYYY HH_mm_ss');
    var getCutOffAmount = function (operations, subtype_sysname, start, end) {
        start = (typeof start !== 'undefined')? start : weekAgoStart;
        end = (typeof end !== 'undefined')? end : weekAgoEnd;
        var res = 0;
        for (var j in operations) {
            var oper = operations[j];
            if (oper.subtype_sysname !== subtype_sysname) continue;
            // За отчетный период
            if (start && end){
                if (funcs.date_A_more_or_equal_B(oper.operation_date, start) && funcs.date_A_more_or_equal_B(end, oper.operation_date)){
                    res += +oper.amount;
                }
            }else if (start){
                if (funcs.date_A_more_or_equal_B(oper.operation_date, start)){
                    res += +oper.amount;
                }
            }else if (end){
                if (funcs.date_A_more_or_equal_B(end, oper.operation_date)){
                    res += +oper.amount;
                }
            }else{
                res += +oper.amount;
            }
        }
        return res;
    };

    async.series({
        get: function (cb) {
            _t.getById({id: id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить инвестора.', {id: id, err: err}));
                investor = res[0];
                // name_ru = 'Отчет инвестора ('+ investor.name +')_' + moment().format('DD_MM_YYYY HH_mm_ss');
                name_ru = 'Отчет инвестора ('+ investor.name +')_' + moment(report_date, 'DD.MM.YYYY').format('DD_MM_YYYY');
                cb(null);
            });
        },
        getAccount: function (cb) {
            var o = {
                command: 'get',
                object: 'investor_account',
                params: {
                    param_where: {
                        investor_id:investor.id,
                        is_default:true
                    },
                    collapseData: false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить счет инвестора по умолчанию', {o: o, err: err}));
                if (!res.length) return cb(new UserError('У инвестора нет счета по умолчанию'),{o:o, res:res});
                account = res[0];
                cb(null);
            });
        },
        getPlanMerchantInvestors0: function (cb) {
            var o = {
                command: 'get',
                object: 'investment_plan_merchant_investor',
                params: {

                    where:[
                        {
                            key:'investor_account_id',
                            val1:account.id
                        },
                        {
                            key:'amount',
                            type:'>',
                            val1:0
                        },
                        {
                            key:'commited_date',
                            type:'<=',
                            val1:moment(weekAgoEnd,'DD.MM.YYYY').format('YYYY-MM-DD')
                        }
                    ],
                    limit:100000000,
                    collapseData: false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить merchant_financing', {o: o, err: err}));
                for (var i in res) {
                    if (merchant_financing_ids.indexOf(res[i].merchant_financing_id)==-1 && res[i].merchant_financing_id) merchant_financing_ids.push(res[i].merchant_financing_id);
                    financings[res[i].merchant_financing_id] = {
                        operations : []
                    }
                }
                //console.log('financings----> ',financings);
                cb(null);
            });
        },
        getOperations: function (cb) {
            var o = {
                command: 'get',
                object: 'investor_account_operation',
                params: {
                    where:[
                        {
                            key:'investor_account_id',
                            val1:account.id
                        },
                        {
                            key:'subtype_sysname',
                            type:'in',
                            val1:['REMITTANCE_FROM_MERCH','ADD_TO_ACCOUNT','REMITTANCE_MAIN_INV_COMISSION','WITHDRAWAL_OF_FUNDS','TRANSFER_TO_MERCHANT']
                        },
                        {
                            key:'amount',
                            type:'>',
                            val1:0
                        }
                        // ,
                        // {
                        //     key:'operation_date',
                        //     type:'<=',
                        //     val1:moment(weekAgoEnd,'DD.MM.YYYY').format('YYYY-MM-DD')
                        // }
                    ],
                    sort:'operation_date',
                    limit:100000000,
                    collapseData: false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить операции по заданным параметрам', {o: o, err: err}));
                for (var i in res) {
                    if (merchant_financing_ids.indexOf(res[i].merchant_financing_id)==-1 && res[i].merchant_financing_id) merchant_financing_ids.push(res[i].merchant_financing_id);
                    if (!financings[res[i].merchant_financing_id] && res[i].merchant_financing_id) {
                        financings[res[i].merchant_financing_id] = {
                            operations : []
                        }
                        financings[res[i].merchant_financing_id].operations.push(res[i]);
                    }else if (res[i].merchant_financing_id){
                        financings[res[i].merchant_financing_id].operations.push(res[i]);
                    }
                    operations.push(res[i]);

                }
                cb(null);
            });
        },
        getMerchantFinancigs: function (cb) {
            console.log('merchant_financing_ids', merchant_financing_ids.join(','));
            if (!merchant_financing_ids.length) return cb(null);
            var o = {
                command: 'get',
                object: 'merchant_financing',
                params: {
                    where: [
                        {
                            key:'id',
                            type:'in',
                            val1:merchant_financing_ids
                        }
                        // ,
                        // {
                        //     key:'created',
                        //     type:'<=',
                        //     val1:moment(weekAgoEnd,'DD.MM.YYYY').format('YYYY-MM-DD')
                        // }
                    ],
                    limit:100000000,
                    collapseData: false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить merchant_financing', {o: o, err: err}));
                for (var i in res) {
                    for (var j in res[i]) {
                        financings[res[i].id][j] = (typeof financings[res[i].id][j]!=='undefined')? financings[res[i].id][j] : res[i][j];
                    }
                }
                //console.log('financings----> ',financings);
                cb(null);
            });
        },
        getFinOperations:function(cb){
           async.eachSeries(financings, function(one_fin, cb){
               // Получить все операции по этому финансированию
               var o = {
                   command: 'get',
                   object: 'investor_account_operation',
                   params: {
                       where:[
                           {
                               key:'merchant_financing_id',
                               val1:one_fin.id
                           },
                           {
                               key:'subtype_sysname',
                               type:'in',
                               val1:['REMITTANCE_FROM_MERCH','ADD_TO_ACCOUNT','REMITTANCE_MAIN_INV_COMISSION','WITHDRAWAL_OF_FUNDS','TRANSFER_TO_MERCHANT']
                           }
                           // ,
                           // {
                           //     key:'operation_date',
                           //     type:'<=',
                           //     val1:moment(weekAgoEnd,'DD.MM.YYYY').format('YYYY-MM-DD')
                           // }
                       ],
                       sort:'operation_date',
                       limit:100000000,
                       collapseData: false
                   }
               };
               _t.api(o, function (err, res) {
                   if (err) return cb(new MyError('Не удалось получить операции для данного финансирования', {o: o, err: err}));
                   one_fin.operationsAll = [];
                   for (var i in res) {
                       one_fin.operationsAll.push(res[i]);
                   }
                   cb(null);
               });
           },cb);
        },
        getPlanMerchantInvestors: function (cb) {
            if (!merchant_financing_ids.length) return cb(null);
            var o = {
                command: 'get',
                object: 'investment_plan_merchant_investor',
                params: {
                    where: [
                        {
                            key:'merchant_financing_id',
                            type:'in',
                            val1:merchant_financing_ids
                        },
                        {
                            key:'investor_account_id',
                            val1:account.id
                        },
                        {
                            key:'commited',
                            val1:true
                        },
                        {
                            key:'commited_date',
                            type:'<=',
                            val1:moment(weekAgoEnd,'DD.MM.YYYY').format('YYYY-MM-DD')
                        }
                    ],
                    limit:100000000,
                    collapseData: false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить merchant_financing', {o: o, err: err}));
                for (var i in res) {
                    if (typeof financings[res[i].merchant_financing_id] == 'object'){
                        if (!financings[res[i].merchant_financing_id].merch_investors) financings[res[i].merchant_financing_id].merch_investors = [];
                        financings[res[i].merchant_financing_id].merch_investors.push(res[i]);
                        financings[res[i].merchant_financing_id].amount = res[i].amount;
                        financings[res[i].merchant_financing_id].commited = res[i].commited;
                        financings[res[i].merchant_financing_id].commited_date = res[i].commited_date || res[i].created;
                        financings[res[i].merchant_financing_id].mgm_fee = res[i].mgm_fee;
                    }
                }
                //console.log('financings----> ',financings);
                cb(null);
            });
        },

        prepareData0: function (cb) {
            readyData = {
                investor_name:investor.name,
                report_date: report_date,
                cut_off_date: weekAgoStart + ' - ' + weekAgoEnd,
                investor_account_id:account.id,
                inc: [],
                t1: [],
                t2: [],
                rs: [],
                remit: [],
                total_added_to_account:0,
                total_amount_mgm_fee:0,
                total_recon:0,
                sum_gross_investment_all_hist:0,
                balance:0,
                last_weeks_total_collected:0,
                last_week_total_collected:0,
                total_reinvestment_power:0,
                this_week_mgm_fee:0
            };
            for (var i in financings) {

                var fin = financings[i];

                fin.total_returned = Math.round(getCutOffAmount(fin.operations, 'REMITTANCE_FROM_MERCH', null, weekAgoEnd) * 100)/100;
                // fin.complete_percent = Math.round((fin.total_returned * 100 / fin.amount_to_return) * 100) / 100;
                // fin.to_return = Math.round((+fin.amount_to_return - +fin.total_returned) * 100) / 100;



                fin.total_returned_all = Math.round(getCutOffAmount(fin.operationsAll, 'REMITTANCE_FROM_MERCH', null, weekAgoEnd) * 100)/100;
                fin.complete_percent = Math.round((fin.total_returned_all * 100 / fin.amount_to_return) * 100) / 100;
                fin.to_return = Math.round((+fin.amount_to_return - +fin.total_returned_all) * 100) / 100;


                // if(fin.id == 178){
                //
                //
                //
                //     debugger;
                // }

            }



            cb(null);
        },
        prepareData1: function (cb) {
            var t1_sum_founding_amount = 0;
            var t1_sum_amount_to_return = 0;
            var t1_sum_gross_profit = 0;
            var t1_sum_all_comission_sum = 0;
            var t1_sum_net_profit = 0;
            var t1_sum_total_collected = 0;
            var t1_sum_total_pending = 0;
            var t1_sum_complete_percent = 0;
            var t1_sum_complete_percent_l = '';

            readyData.t1_sum_avr_factoring_rate = 0;
            readyData.t1_sum_avr_payment_count = 0;
            var counter = 0;
            for (var i in financings) {

                var fin = financings[i];
                if (!fin.commited) continue;
                counter++;


                //console.log('financing_date', fin.financing_date);
                var gross_profit = +fin.amount_to_return - fin.founding_amount;
                var broker_comission_percent = (+fin.broker_comission + (+fin.agent_comission || 0)) / 100;

                var all_comission_sum = +fin.founding_amount * broker_comission_percent + fin.amount_to_return * fin.processing_bank_commission / 100;
                var net_profit = gross_profit - all_comission_sum;

                var pseudo_res = '';
                var pseudo_comlete_sign_count = Math.abs((fin.complete_percent) / 4);

                for(var p =0;p<pseudo_comlete_sign_count;p++){
                    pseudo_res += 'l';
                }

                readyData.t1.push({
                    merchant_id: fin.merchant_id,
                    merchant_name: (moment(fin.commited_date,'DD.MM.YYYY') > moment(weekAgoEnd, 'DD.MM.YYYY'))? fin.merchant_short_name + '  (' + moment(fin.commited_date,'DD.MM.YYYY').format('DD.MM.YYYY') + ')' : fin.merchant_short_name,
                    founding_date: fin.payments_start_date,
                    founding_amount: fin.founding_amount,
                    factoring_rate: fin.factoring_rate,
                    amount_to_return: fin.amount_to_return,
                    days_per_week: (fin.financing_type_sysname == 'PERCENT')? 7 : 5, // days_per_week,
                    //days_per_week: fin.financing_type_sysname,
                    payments_count: fin.payments_count,
                    payment_amount: fin.payment_amount,
                    gross_profit: gross_profit,
                    all_comission_sum: all_comission_sum,
                    net_profit: net_profit,
                    total_collected: fin.total_returned_all,
                    total_pending: fin.to_return,
                    complete_percent: fin.complete_percent / 100,
                    complete_percent_l: pseudo_res
                });


                // if(fin.id == 178){
                //     debugger;
                // }

                t1_sum_founding_amount           += fin.founding_amount;
                t1_sum_amount_to_return         += fin.amount_to_return;
                t1_sum_gross_profit             += gross_profit;
                t1_sum_all_comission_sum       += all_comission_sum;
                t1_sum_net_profit               += net_profit;
                t1_sum_total_collected          += fin.total_returned_all;
                t1_sum_total_pending            += fin.to_return;
                t1_sum_complete_percent         += (+fin.complete_percent / 100);

                readyData.t1_sum_avr_factoring_rate += fin.factoring_rate;
                readyData.t1_sum_avr_payment_count += fin.payments_count;
            }

            t1_sum_complete_percent = (counter > 0) ? t1_sum_complete_percent/counter : 0;



            readyData.t1_sum_founding_amount = t1_sum_founding_amount;
            readyData.t1_sum_amount_to_return = t1_sum_amount_to_return;
            readyData.t1_sum_gross_profit = t1_sum_gross_profit;
            readyData.t1_sum_all_comission_sum = t1_sum_all_comission_sum;
            readyData.t1_sum_net_profit = t1_sum_net_profit;
            readyData.t1_sum_total_collected = t1_sum_total_collected;
            readyData.t1_sum_total_pending = t1_sum_total_pending;
            readyData.t1_sum_complete_percent = t1_sum_complete_percent;

            var total_pseudo_comlete_sign_count = Math.floor(readyData.t1_sum_complete_percent * 100 / 4);
            var total_pseudo_res = '';

            for(var p2 =0;p2<total_pseudo_comlete_sign_count;p2++){
                total_pseudo_res += 'l';
            }

            t1_sum_complete_percent_l = total_pseudo_res;


            readyData.t1_sum_complete_percent_l = t1_sum_complete_percent_l;
            readyData.t1_sum_avr_factoring_rate = (counter > 0) ? Math.round((readyData.t1_sum_avr_factoring_rate / counter) * 100) / 100 : 0;
            readyData.t1_sum_avr_payment_count = (counter > 0) ? Math.round((readyData.t1_sum_avr_payment_count / counter) * 100) / 100 : 0;

            cb(null);


        },
        prepareData2: function (cb) {


            var t2_sum_gross_investment                     = 0;
            var t2_sum_bank_comission_part_summ             = 0;
            var t2_sum_gross_investment_cut_off             = 0;
            var t2_sum_net_investment                       = 0;
            var t2_sum_participation_payback_amount         = 0;
            var t2_sum_participation_gross_profit           = 0;
            var t2_sum_mgm_comission                        = 0;
            var t2_sum_net_profit_after_mgm_fee             = 0;
            var t2_sum_gross_profit_after_mgm_fee           = 0;
            var t2_sum_total_collected                      = 0;
            var t2_sum_total_to_return                      = 0;
            var t2_sum_pending_remittance                   = 0;
            var t2_sum_mgm_comission_paid                   = 0;
            var t2_last_weeks_total_collected               = 0;

            for (var i in financings) {

                var fin = financings[i];
                if (!fin.commited) continue;
                var amount = +fin.amount;

                var percent = fin.percent = amount * 100 / +fin.founding_amount; // Процент участие в инвестировании

                var gross_profit = +fin.amount_to_return - fin.founding_amount;

                var broker_comission_percent = (+fin.broker_comission + (+fin.agent_comission || 0)) / 100;


                var all_comission_sum = +fin.founding_amount * broker_comission_percent + fin.amount_to_return * fin.processing_bank_commission / 100;
                var net_profit = gross_profit - all_comission_sum;

                var bank_comission_part_summ = all_comission_sum * percent / 100;
                var gross_investment = bank_comission_part_summ + amount;

                var participation_payback_amount = amount * fin.factoring_rate / 100;
                var participation_gross_profit = amount + participation_payback_amount;

                var main_company_commision = fin.mgm_fee / 100;

                var mgm_comission = (participation_payback_amount - bank_comission_part_summ) * main_company_commision;
                var net_profit_after_mgm_fee = participation_payback_amount - bank_comission_part_summ - mgm_comission;
                var gross_profit_after_mgm_fee = participation_gross_profit - mgm_comission;
                //var total_returned = fin.total_returned * percent / 100;
                //var total_returned = getCutOffAmount(fin.operations, 'REMITTANCE_FROM_MERCH', null, weekAgoEnd) * percent / 100;
                var total_returned = getCutOffAmount(fin.operations, 'REMITTANCE_FROM_MERCH', null, weekAgoEnd); // На процент умножать не надо так как операции только по тому инфестору
                var to_return = fin.to_return * percent / 100;
                //var last_weeks_total_collected = getCutOffAmount(fin.operations, 'REMITTANCE_FROM_MERCH');


                //var pending_remittance = total_returned - last_weeks_total_collected;
                //var pending_remittance = getCutOffAmount(fin.operations, 'REMITTANCE_FROM_MERCH') * percent / 100;
                var pending_remittance = getCutOffAmount(fin.operations, 'REMITTANCE_FROM_MERCH'); // На процент умножать не надо так как операции только по тому инфестору
                var last_weeks_total_collected = total_returned - pending_remittance;
                //var mgm_comission_paid = (fin.closing_date)? mgm_comission : 0;
                var mgm_comission_paid = getCutOffAmount(fin.operations, 'REMITTANCE_MAIN_INV_COMISSION', null, weekAgoEnd);

                readyData.t2.push({
                    merchant_id: fin.merchant_id,
                    merchant_name: (moment(fin.commited_date,'DD.MM.YYYY') > moment(weekAgoEnd, 'DD.MM.YYYY'))? fin.merchant_short_name + '  (' + moment(fin.commited_date,'DD.MM.YYYY').format('DD.MM.YYYY') + ')' : fin.merchant_short_name,
                    gross_investment: gross_investment,
                    bank_comission_part_summ: bank_comission_part_summ,
                    net_investment: amount,
                    participation_percent: Math.round(percent*100)/100,
                    participation_payback_amount: participation_payback_amount,
                    participation_gross_profit: participation_gross_profit,
                    mgm_comission: mgm_comission,
                    net_profit_after_mgm_fee: net_profit_after_mgm_fee,
                    gross_profit_after_mgm_fee: gross_profit_after_mgm_fee,
                    complete_percent: fin.complete_percent,
                    total_collected: total_returned,
                    total_to_return: to_return,
                    last_weeks_total_collected: last_weeks_total_collected,
                    pending_remittance:pending_remittance,
                    mgm_comission_paid:mgm_comission_paid,
                    mgm_fee_paid_date:fin.closing_date,
                    mgm_fee_paid_amount:mgm_comission_paid


                });
                t2_sum_gross_investment                     += gross_investment;
                t2_sum_bank_comission_part_summ             += bank_comission_part_summ;
                // t2_sum_gross_investment_cut_off             += +(+bank_comission_part_summ + getCutOffAmount(fin.operations, 'TRANSFER_TO_MERCHANT', null, weekAgoEnd));
                if (moment(fin.commited_date,'DD.MM.YYYY') <= moment(weekAgoEnd, 'DD.MM.YYYY')){
                    t2_sum_gross_investment_cut_off             += +(+bank_comission_part_summ + getCutOffAmount(fin.operations, 'TRANSFER_TO_MERCHANT', null, weekAgoEnd));
                }
                t2_sum_net_investment                       += amount;
                t2_sum_participation_payback_amount         += participation_payback_amount;
                t2_sum_participation_gross_profit           += participation_gross_profit;
                t2_sum_mgm_comission                        += mgm_comission;
                t2_sum_net_profit_after_mgm_fee             += net_profit_after_mgm_fee;
                t2_sum_gross_profit_after_mgm_fee           += gross_profit_after_mgm_fee;
                t2_sum_total_collected                      += total_returned;
                t2_sum_total_to_return                      += to_return;
                t2_last_weeks_total_collected                      += last_weeks_total_collected;
                t2_sum_pending_remittance                   += pending_remittance;
                t2_sum_mgm_comission_paid                   += mgm_comission_paid;

            }


            readyData.t2_sum_gross_investment                   = t2_sum_gross_investment;
            readyData.t2_sum_bank_comission_part_summ           = t2_sum_bank_comission_part_summ;

            readyData.t2_sum_gross_investment_cut_off           = t2_sum_gross_investment_cut_off;

            readyData.t2_sum_net_investment                     = t2_sum_net_investment;
            readyData.t2_sum_participation_payback_amount       = t2_sum_participation_payback_amount;
            readyData.t2_sum_participation_gross_profit         = t2_sum_participation_gross_profit;
            readyData.t2_sum_mgm_comission                      = t2_sum_mgm_comission;
            readyData.t2_sum_net_profit_after_mgm_fee           = t2_sum_net_profit_after_mgm_fee;
            readyData.t2_sum_gross_profit_after_mgm_fee         = t2_sum_gross_profit_after_mgm_fee;
            readyData.t2_sum_total_collected                    = t2_sum_total_collected;
            readyData.t2_sum_total_to_return                    = t2_sum_total_to_return;
            readyData.t2_last_weeks_total_collected             = t2_last_weeks_total_collected;
            readyData.t2_sum_pending_remittance                 = t2_sum_pending_remittance;
            readyData.t2_sum_mgm_comission_paid                 = t2_sum_mgm_comission_paid;
            // var merchant_id
            // var merchant_name
            // var gross_investment
            // var bank_comission_part_summ
            // var net_investment
            // var participation_percent
            // var participation_payback_amount
            // var participation_gross_profit
            // var mgm_comission
            // var net_profit_after_mgm_fee
            // var gross_profit_after_mgm_fee
            // var complete_percent
            // var total_collected
            // var total_to_return
            // var last_weeks_total_collected
            // var pending_remittance
            // var mgm_comission_paid

            cb(null);

        },
        prepareData3: function (cb) {

            readyData.rs_total_final_profit      = 0;
            readyData.rs_total_cut_off_collected = 0;
            readyData.rs_sum_last_weeks_total_collected = 0;
            readyData.rs_sum_gross_profit_after_mgm_fee = 0;
            readyData.rs_sum_current_gross_collected = 0;
            readyData.rs_sum_week_1 = 0;
            readyData.rs_sum_week_2 = 0;
            readyData.rs_sum_week_3 = 0;
            readyData.rs_sum_week_4 = 0;
            readyData.rs_sum_week_5 = 0;
            readyData.rs_sum_week_6 = 0;
            readyData.rs_sum_week_7 = 0;
            readyData.rs_sum_week_8 = 0;
            readyData.rs_sum_week_9 = 0;
            readyData.rs_sum_week_10 = 0;
            readyData.rs_sum_week_11 = 0;
            readyData.rs_sum_week_12 = 0;
            readyData.total_collected_summ = 0;



            var rs_sum_gross_profit_after_mgm_fee      = 0;
            var rs_sum_current_gross_collected      = 0;
            var rs_total_cut_off_collected = 0;


            for (var i in financings) {
                // Добавим
                var fin = financings[i];
                if (!fin.commited) continue;

                var amount = +fin.amount;

                var percent = fin.percent = amount * 100 / +fin.founding_amount; // Процент участие в инвестировании
                // var last_weeks_total_collected = 0;

                for (var c = 1; c <= 12; c++) {
                    var num = 12 - c;
                    var start = moment(report_date, 'DD.MM.YYYY').startOf('week').add(-6,'day').add(-num,'week').format('DD.MM.YYYY');
                    var end = moment(report_date, 'DD.MM.YYYY').startOf('week').add(-2,'day').add(-num,'week').format('DD.MM.YYYY');


                    //fin['week_' + c + '_value'] = Math.round((getCutOffAmount(fin.operations, 'REMITTANCE_FROM_MERCH', start, end) * percent / 100)*100)/100;
                    fin['week_' + c + '_value'] = Math.round((getCutOffAmount(fin.operations, 'REMITTANCE_FROM_MERCH', start, end))*100)/100;
                    readyData['week_' + c] = start + ' - ' + end;
                    // last_weeks_total_collected += fin['week_' + c + '_value'];  // Это данные только за отображенные недели, а нужно за все прощедшие
                }




                var gross_profit = +fin.amount_to_return - fin.founding_amount;

                var broker_comission_percent = (+fin.broker_comission + (+fin.agent_comission || 0)) / 100;

                var all_comission_sum = +fin.founding_amount * broker_comission_percent + fin.amount_to_return * fin.processing_bank_commission / 100;
                var net_profit = gross_profit - all_comission_sum;

                var bank_comission_part_summ = all_comission_sum * percent / 100;
                var gross_investment = bank_comission_part_summ + amount;
                var participation_payback_amount = amount * fin.factoring_rate / 100;
                var participation_gross_profit = amount + participation_payback_amount;

                var main_company_commision = fin.mgm_fee / 100;

                var mgm_comission = (participation_payback_amount - bank_comission_part_summ) * main_company_commision;
                var net_profit_after_mgm_fee = participation_payback_amount - bank_comission_part_summ - mgm_comission;
                var gross_profit_after_mgm_fee = participation_gross_profit - mgm_comission;

                // var total_returned = fin.total_returned * percent / 100;
                var total_returned = getCutOffAmount(fin.operations, 'REMITTANCE_FROM_MERCH', null, weekAgoEnd); // На процент умножать не надо так как операции только по тому инфестору
                var to_return = fin.to_return * percent / 100;

                var current_gross_collected = fin.total_returned * percent / 100;
                var cut_off_collected_part =  fin.cut_off_collected * percent / 100;

                var last_weeks_total_collected = total_returned;




                readyData.rs.push({
                    merchant_id: fin.merchant_id,
                    merchant_name: (moment(fin.commited_date,'DD.MM.YYYY') > moment(weekAgoEnd, 'DD.MM.YYYY'))? fin.merchant_short_name + '  (' + moment(fin.commited_date,'DD.MM.YYYY').format('DD.MM.YYYY') + ')' : fin.merchant_short_name,
                    //gross_profit_after_mgm_fee: fin.gross_profit_after_mgm_fee,
                    current_gross_collected: current_gross_collected,
                    last_weeks_total_collected: last_weeks_total_collected,
                    gross_profit_after_mgm_fee: gross_profit_after_mgm_fee,
                    cut_off_collected: cut_off_collected_part,
                    week_1_value: fin.week_1_value,
                    week_2_value: fin.week_2_value,
                    week_3_value: fin.week_3_value,
                    week_4_value: fin.week_4_value,
                    week_5_value: fin.week_5_value,
                    week_6_value: fin.week_6_value,
                    week_7_value: fin.week_7_value,
                    week_8_value: fin.week_8_value,
                    week_9_value: fin.week_9_value,
                    week_10_value: fin.week_10_value,
                    week_11_value: fin.week_11_value,
                    week_12_value: fin.week_12_value,

                    total_collected: fin.total_collected

                });

                readyData.rs_total_final_profit += +fin.final_profit;
                readyData.rs_total_cut_off_collected += +cut_off_collected_part;
                readyData.rs_sum_last_weeks_total_collected += +last_weeks_total_collected;
                readyData.rs_sum_gross_profit_after_mgm_fee += +gross_profit_after_mgm_fee;
                readyData.rs_sum_current_gross_collected += +current_gross_collected;
                readyData.rs_sum_week_1 += +fin.week_1_value;
                readyData.rs_sum_week_2 += +fin.week_2_value;
                readyData.rs_sum_week_3 += +fin.week_3_value;
                readyData.rs_sum_week_4 += +fin.week_4_value;
                readyData.rs_sum_week_5 += +fin.week_5_value;
                readyData.rs_sum_week_6 += +fin.week_6_value;
                readyData.rs_sum_week_7 += +fin.week_7_value;
                readyData.rs_sum_week_8 += +fin.week_8_value;
                readyData.rs_sum_week_9 += +fin.week_9_value;
                readyData.rs_sum_week_10 += +fin.week_10_value;
                readyData.rs_sum_week_11 += +fin.week_11_value;
                readyData.rs_sum_week_12 += +fin.week_12_value;

                readyData.total_collected_summ += +fin.total_collected;


            }
            cb(null);
        },
        prepareData4: function (cb) {
            //total_added_to_account:0,
            //    total_amount_mgm_fee:0,
            //    total_recon:0,
            //    sum_gross_investment_all_hist:0,
            //    balance:0,
            //    last_weeks_total_collected:0,
            //    last_week_total_collected:0,
            //    total_reinvestment_power:0,
            //    this_week_mgm_fee:0
            readyData.total_added_to_account = getCutOffAmount(operations, 'ADD_TO_ACCOUNT', null, weekAgoEnd);
            for (var i in operations) {
                if (operations[i].subtype_sysname !== 'ADD_TO_ACCOUNT') continue;
                readyData.inc.push({
                    incoming_amount:+operations[i].amount,
                    incoming_date:operations[i].operation_date
                });
            }

            readyData.total_amount_mgm_fee = getCutOffAmount(operations, 'REMITTANCE_MAIN_INV_COMISSION', null, weekAgoEnd);
            readyData.total_withdrawal_of_funds = 0;
            for (var i in operations) {
                if (operations[i].subtype_sysname !== 'WITHDRAWAL_OF_FUNDS') continue;
                readyData.remit.push({
                    remittance_amount:+operations[i].amount,
                    remittance_date:operations[i].operation_date
                });
                readyData.total_withdrawal_of_funds += +operations[i].amount;
            }


            //readyData.total_recon = readyData.total_added_to_account - readyData.total_withdrawal_of_funds - readyData.total_amount_mgm_fee;
            readyData.total_recon = readyData.total_added_to_account - readyData.total_withdrawal_of_funds;
            // readyData.sum_gross_investment_all_hist = readyData.rs_sum_last_weeks_total_collected;
            readyData.sum_gross_investment = readyData.t2_sum_gross_investment_cut_off;
            readyData.balance = readyData.total_recon - readyData.sum_gross_investment_all_hist;
            readyData.last_weeks_total_collected = readyData.rs_sum_last_weeks_total_collected;
            readyData.last_week_total_collected = readyData.rs_sum_week_12;
            readyData.this_week_mgm_fee = getCutOffAmount(operations, 'REMITTANCE_MAIN_INV_COMISSION');
            readyData.total_reinvestment_power = readyData.last_week_total_collected - readyData.this_week_mgm_fee;

            // readyData.recon_total_invested = readyData.total_recon - readyData.t2_sum_gross_investment;
            readyData.recon_total_invested = readyData.total_recon - readyData.t2_sum_gross_investment_cut_off;
            readyData.recon_avail_to_invest = readyData.recon_total_invested + readyData.rs_sum_last_weeks_total_collected;
            // readyData.recon_avail_to_reinvest = readyData.recon_avail_to_invest + readyData.t2_sum_pending_remittance; // Последняя неделя лишняя
            //readyData.recon_avail_to_reinvest = readyData.recon_avail_to_invest; // + readyData.t2_sum_pending_remittance; // Последняя неделя лишняя
            readyData.recon_avail_to_reinvest = readyData.recon_avail_to_invest - readyData.total_amount_mgm_fee;

            cb(null);


        },
        getTemplate: function (cb) {
            fs.readFile('./templates/' + name, function (err, data) {
                if (err) return cb(new MyError('Не удалось считать файл шаблона test.xlsx.', err));
                template = new XlsxTemplate(data);
                cb(null);
            });
        },
        perform: function (cb) {
            var sheetNumber = 1;
            template.substitute(sheetNumber, readyData);
            sheetNumber = 2;
            template.substitute(sheetNumber, readyData);
            sheetNumber = 3;
            template.substitute(sheetNumber, readyData);
            sheetNumber = 4;
            template.substitute(sheetNumber, readyData);
            var dataBuf = template.generate();
            binaryData = new Buffer(dataBuf, 'binary');
            cb(null)
        },
        writeFile: function (cb) {
            filename = '_' + name;
            fs.writeFile('./public/savedFiles/' + filename,binaryData, function (err) {
                if (err) return cb(new MyError('Не удалось записать файл testOutput.xlsx',{err:err}));
                return cb(null, new UserOk('testOutput.xlsx успешно сформирован'));
            });
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('Ок.',{filename:filename,path:'/savedFiles/',name_ru:name_ru}));
    });
};

//var o = {
//    command:'reportDeployment',
//    object:'investor',
//    params:{
//        id:59
//    }
//}
//socketQuery(o, function(res){
//
//    if(!res.code){
//        var fileName = res.path + res.filename;
//        var linkName = 'my_download_link' + MB.Core.guid();
//        $("body").prepend('<a id="'+linkName+'" href="' + res.path + res.filename +'" download="'+ res.filename+'" style="display:none;"></a>');
//        var jqElem = $('#'+linkName);
//        jqElem[0].click();
//        jqElem.remove();
//    }
//
//
//});
Model.prototype.reportDeployment = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id || 55;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    var name = obj.name || 'investor_deployment_report.xlsx';
    var report_date = obj.report_date || funcs.getDate();

    var weekAgoStart = moment(report_date, 'DD.MM.YYYY').startOf('week').add(-6,'day').format('DD.MM.YYYY');
    var weekAgoEnd = moment(report_date, 'DD.MM.YYYY').startOf('week').add(-2,'day').format('DD.MM.YYYY');
    var data, readyData, template, binaryData, filename;
    var manager_fee_percent = 0.01;
    var days_per_week = 5; // gov calendar
    var main_company_commision = 0.4;

    // Получить распределение бюджета по инвестору
    // получить финансирования

    var investor;
    var investment;
    var financings = {};
    var merchant_financing_ids = [];
    var merchant_invests;

    var name_ru;

    var getCutOffAmount = function (operations, subtype_sysname, start, end) {
        start = start || weekAgoStart;
        end = end || weekAgoEnd;
        var res = 0;
        for (var j in operations) {
            var oper = operations[j];
            if (oper.subtype_sysname !== subtype_sysname) continue;
            // За отчетный период
            if (funcs.date_A_more_or_equal_B(oper.operation_date, start) && funcs.date_A_more_or_equal_B(end, oper.operation_date)){
                res += +oper.amount;
            }
        }
        return res;
    };

    async.series({
        get: function (cb) {
            _t.getById({id: id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить инвестора.', {id: id, err: err}));
                investor = res[0];
                name_ru = 'План финансирования (' + investor.name + ')_' + moment().format('DD_MM_YYYY HH_mm_ss');
                cb(null);
            });
        },
        getInvestment: function (cb) {
            var o = {
                command: 'get',
                object: 'investment_plan_merchant_investor',
                params: {
                    where:[
                        {
                            key:'investor_id',
                            val1:id
                        }
                    ],
                    limit:100000000,
                    collapseData: false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить инвестирования по заданным параметрам', {o: o, err: err}));
                for (var i in res) {
                    if (merchant_financing_ids.indexOf(res[i].merchant_financing_id)==-1 && res[i].merchant_financing_id) merchant_financing_ids.push(res[i].merchant_financing_id);
                    //if (!financings[res[i].merchant_financing_id] && res[i].merchant_financing_id) {
                    //    financings[res[i].merchant_financing_id] = {
                    //        investments : []
                    //    }
                    //}else if (res[i].merchant_financing_id){
                    //    financings[res[i].merchant_financing_id].investments.push(res[i]);
                    //}
                    if (!financings[res[i].merchant_financing_id]) {
                        financings[res[i].merchant_financing_id] = {
                            investments : []
                        }
                    }
                    financings[res[i].merchant_financing_id].investments.push(res[i]);
                }
                cb(null);
            });
        },

        getMerchantFinancigs: function (cb) {
            console.log('merchant_financing_ids', merchant_financing_ids.join(','));
            if (!merchant_financing_ids.length) return cb(null);
            var o = {
                command: 'get',
                object: 'merchant_financing',
                params: {
                    where: [
                        {
                            key:'id',
                            type:'in',
                            val1:merchant_financing_ids
                        }
                    ],
                    limit:100000000,
                    collapseData: false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить merchant_financing', {o: o, err: err}));
                for (var i in res) {
                    for (var j in res[i]) {
                        financings[res[i].id][j] = (typeof financings[res[i].id][j]!=='undefined')? financings[res[i].id][j] : res[i][j];
                    }
                }
                //console.log('financings----> ',financings);
                cb(null);
            });
        },
        //getPlanMerchantInvestorrs: function (cb) {
        //    var o = {
        //        command: 'get',
        //        object: 'investment_plan_merchant_investor',
        //        params: {
        //            where: [
        //                {
        //                    key:'merchant_financing_id',
        //                    type:'in',
        //                    val1:merchant_financing_ids
        //                },
        //                {
        //                    key:'investor_account_id',
        //                    val1:account.id
        //                },
        //                {
        //                    key:'commited',
        //                    val1:true
        //                }
        //            ],
        //            limit:100000000,
        //            collapseData: false
        //        }
        //    };
        //    _t.api(o, function (err, res) {
        //        if (err) return cb(new MyError('Не удалось получить merchant_financing', {o: o, err: err}));
        //        for (var i in res) {
        //            if (typeof financings[res[i].merchant_financing_id] == 'object'){
        //                if (!financings[res[i].merchant_financing_id].merch_investors) financings[res[i].merchant_financing_id].merch_investors = [];
        //                financings[res[i].merchant_financing_id].merch_investors.push(res[i]);
        //                financings[res[i].merchant_financing_id].amount = res[i].amount;
        //                financings[res[i].merchant_financing_id].commited = res[i].commited;
        //            }
        //        }
        //        //console.log('financings----> ',financings);
        //        cb(null);
        //    });
        //},

        prepareData0: function (cb) {

            readyData = {
                investor_name:investor.name,
                report_date: report_date,
                cut_off_date: weekAgoStart + ' - ' + weekAgoEnd,
                investor_account_id:'Основной',
                t1: [],
                t2: []
            };
            cb(null);
        },
        prepareData1: function (cb) {

            readyData.t1_sum_founding_amount        = 0;
            readyData.t1_sum_broker_comission_sum   = 0;
            readyData.t1_sum_avr_factoring_rate     = 0;
            readyData.t1_sum_amount_to_return       = 0;
            readyData.t1_sum_avr_payment_count      = 0;
            readyData.t1_sum_gross_profit           = 0;
            readyData.t1_sum_bank_comission_sum     = 0;
            readyData.t1_sum_net_profit             = 0;

            var counter = 0;
            var payments_count_counter = 0;
            for (var i in financings) {
                var fin = financings[i];
                counter++;

                var broker_comission_percent = (+fin.broker_comission + (+fin.agent_comission || 0)) / 100;

                var broker_comission_sum = +fin.founding_amount * broker_comission_percent;
                var gross_profit = +fin.amount_to_return - fin.founding_amount;
                var bank_comission_sum = +fin.amount_to_return * fin.processing_bank_commission / 100;
                var net_profit = gross_profit - bank_comission_sum -broker_comission_sum;

                readyData.t1.push({
                    merchant_id: fin.merchant_id,
                    merchant_name: fin.merchant_short_name,
                    founding_date: fin.payments_start_date,
                    founding_amount: fin.founding_amount,
                    broker_comission_sum: broker_comission_sum,
                    factoring_rate: fin.factoring_rate,
                    amount_to_return: fin.amount_to_return,
                    //days_per_week: days_per_week,
                    payment_count: fin.payments_count,
                    payment_amount: fin.payment_amount,
                    gross_profit: gross_profit,
                    bank_comission_sum: bank_comission_sum,
                    net_profit: net_profit
                });

                readyData.t1_sum_founding_amount        += fin.founding_amount;
                readyData.t1_sum_broker_comission_sum   += broker_comission_sum;
                readyData.t1_sum_avr_factoring_rate     += fin.factoring_rate;
                readyData.t1_sum_amount_to_return       += fin.amount_to_return;
                if (fin.payments_count){
                    readyData.t1_sum_avr_payment_count      += fin.payments_count;
                    payments_count_counter++;
                }

                readyData.t1_sum_gross_profit           += gross_profit;
                readyData.t1_sum_bank_comission_sum     += bank_comission_sum;
                readyData.t1_sum_net_profit             += net_profit;
            }

            readyData.t1_sum_avr_factoring_rate = (counter > 0) ? readyData.t1_sum_avr_factoring_rate/counter : 0;
            //readyData.t1_sum_avr_payment_count = (payments_count_counter > 0) ? Math.round((readyData.t1_sum_avr_payment_count/payments_count_counter)*100)/100 : 0;
            readyData.t1_sum_avr_payment_count = 'ТЕСТ';//readyData.t1_sum_avr_payment_count;

            cb(null);


        },
        prepareData2: function (cb) {


            readyData.t2_sum_gross_investment                  = 0;
            readyData.t2_sum_broker_comission_part_summ        = 0;
            readyData.t2_sum_avr_factoring_rate                = 0;
            readyData.t2_sum_participation_payback_amount      = 0;
            readyData.t2_sum_avr_t2_payment_count              = 0;
            readyData.t2_sum_gross_profit                      = 0;
            readyData.t2_sum_bank_comission_sum                = 0;
            readyData.t2_sum_net_profit                        = 0;
            readyData.t2_sum_mgm_comission                     = 0;
            readyData.t2_sum_net_profit_after_mgm_fee          = 0;


            var counter = 0;
            for (var i in financings) {

                var fin = financings[i];
                counter++;

                fin.amount = 0;
                for (var i in fin.investments) {
                    fin.amount += fin.investments[i].amount;
                }
                var amount = fin.amount;

                var percent = fin.percent = amount * 100 / +fin.founding_amount; // Процент участие в инвестировании

                var broker_comission_percent = (+fin.broker_comission + (+fin.agent_comission || 0)) / 100;

                var broker_comission_sum = +fin.founding_amount * broker_comission_percent;
                var broker_comission_part_summ = broker_comission_sum * percent / 100;

                var bank_comission_sum = +fin.amount_to_return * fin.processing_bank_commission / 100;


                var participation_payback_amount = +fin.amount_to_return * percent / 100;

                var bank_comission_part_summ = bank_comission_sum * percent / 100;
                var gross_investment = fin.founding_amount * percent / 100;

                //var participation_gross_profit = amount + participation_payback_amount;


                var amount_to_return_part = fin.amount_to_return * percent / 100;

                var gross_profit = +amount_to_return_part - gross_investment - broker_comission_part_summ;

                var net_profit = gross_profit - bank_comission_part_summ;

                var main_company_commision = fin.mgm_fee / 100;

                var mgm_comission = net_profit * main_company_commision;
                var net_profit_after_mgm_fee = net_profit - mgm_comission;


                readyData.t2.push({
                    merchant_id: fin.merchant_id,
                    merchant_name: fin.merchant_short_name,
                    founding_date: fin.payments_start_date,
                    gross_investment: gross_investment,
                    participation_percent:Math.round(percent*100)/100,
                    broker_comission_part_summ: broker_comission_part_summ,
                    factoring_rate: fin.factoring_rate,
                    //bank_comission_part_summ: bank_comission_part_summ,
                    //net_investment: amount,
                    participation_payback_amount: participation_payback_amount,
                    payment_count: fin.payments_count,
                    payment_amount: fin.payment_amount,
                    gross_profit: gross_profit,
                    bank_comission_sum: bank_comission_part_summ,
                    net_profit: net_profit,
                    mgm_comission: mgm_comission,
                    net_profit_after_mgm_fee: net_profit_after_mgm_fee

                });

                readyData.t2_sum_gross_investment                  += gross_investment;
                readyData.t2_sum_broker_comission_part_summ        += broker_comission_part_summ;
                readyData.t2_sum_avr_factoring_rate                += fin.factoring_rate;
                readyData.t2_sum_participation_payback_amount      += participation_payback_amount;
                readyData.t2_sum_avr_t2_payment_count              += fin.payments_count;
                readyData.t2_sum_gross_profit                      += gross_profit;
                readyData.t2_sum_bank_comission_sum                += bank_comission_sum;
                readyData.t2_sum_net_profit                        += net_profit;
                readyData.t2_sum_mgm_comission                     += mgm_comission;
                readyData.t2_sum_net_profit_after_mgm_fee          += net_profit_after_mgm_fee;

            }

            readyData.t2_sum_avr_factoring_rate = (counter > 0) ? readyData.t2_sum_avr_factoring_rate / counter : 0;
            readyData.t2_sum_avr_t2_payment_count = (counter > 0) ? readyData.t2_sum_avr_t2_payment_count / counter : 0;

            cb(null);

        },
        getTemplate: function (cb) {
            fs.readFile('./templates/' + name, function (err, data) {
                if (err) return cb(new MyError('Не удалось считать файл шаблона test.xlsx.', err));
                template = new XlsxTemplate(data);
                cb(null);
            });
        },
        perform: function (cb) {
            var sheetNumber = 1;
            template.substitute(sheetNumber, readyData);
            var dataBuf = template.generate();
            binaryData = new Buffer(dataBuf, 'binary');
            cb(null)
        },
        writeFile: function (cb) {
            filename = name_ru + '.xlsx' || '_' + name;
            fs.writeFile('./public/savedFiles/' + filename,binaryData, function (err) {
                if (err) return cb(new MyError('Не удалось записать файл testOutput.xlsx',{err:err}));
                return cb(null, new UserOk('testOutput.xlsx успешно сформирован'));
            });
        },
        sendmail: function (cb) {
            if (!investor.email) return cb(null, '');


            sendMail({
                email: investor.email,
                subject: 'План финансирования',
                html: 'Документ во вложении.',
                attachments: [{   // file on disk as an attachment
                    filename: filename,
                    path: './public/savedFiles/' + filename // stream this file
                }]
            }, function (err, info) {
                if (err) return cb(new UserError('Не удалось отправить email', {err: err, info: info}));
                cb(null);
            });


        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('Ок.',{filename:filename,path:'/savedFiles/',name_ru:name_ru}));
    });
};
//
//var Report = require('../libs/Report');
//Model.prototype.testReport = function (obj, cb) {
//    if (arguments.length == 1) {
//        cb = arguments[0];
//        obj = {};
//    }
//    if (typeof cb !== 'function') throw new MyError('В метод не передан cb');
//    if (typeof obj !== 'object') return cb(new MyError('В метод не переданы obj'));
//    var _t = this;
//    console.log('Перед созданием экземпляра Report');
//    var r1 = new Report();
//
//
//    async.series({
//        prepareData: function (cb) {
//            r1.addRow({});
//            cb(null);
//        },
//        writeFile: function (cb) {
//            r1.writeFile([],cb);
//        }
//    }, function (err, res) {
//        if (err) return cb(err);
//        cb(null, res.writeFile);
//    });
//    //cb(null);
//};

//
Model.prototype.certificate = function (obj, cb) {
    if (arguments.length == 1) {
        cb = arguments[0];
        obj = {};
    }
    var _t = this;
    var id = obj.id;
    if (isNaN(+id)) return cb(new MyError('Не передан id',{obj:obj}));
    var rollback_key = obj.rollback_key || rollback.create();
    var name = obj.name || 'certificate_2.xlsx';
    var report_date = obj.report_date || funcs.getDate();


    var weekAgoStart = moment(report_date, 'DD.MM.YYYY').startOf('week').add(-6,'day').format('DD.MM.YYYY');
    var weekAgoEnd = moment(report_date, 'DD.MM.YYYY').startOf('week').add(-2,'day').format('DD.MM.YYYY');
    var weekAgoEndBefore = moment(weekAgoEnd, 'DD.MM.YYYY').startOf('week').add(-2,'day').format('DD.MM.YYYY');

    var readyData, template, binaryData, filename;

    var investor, account;
    var operations = [];
    var financings = {};
    var merchant_financing_ids = [];

    var name_ru;// = 'Отчет инвестора('+ investor.name +')_' + moment().format('DD_MM_YYYY HH_mm_ss');
    var getCutOffAmount = function (operations, subtype_sysname, start, end) {
        end = (typeof end !== 'undefined')? end : report_date;
        var res = 0;
        for (var j in operations) {
            var oper = operations[j];
            if (oper.subtype_sysname !== subtype_sysname) continue;
            // За отчетный период
            if (start && end){
                if (funcs.date_A_more_or_equal_B(oper.operation_date, start) && funcs.date_A_more_or_equal_B(end, oper.operation_date)){
                    res += +oper.amount;
                }
            }else if (start){
                if (funcs.date_A_more_or_equal_B(oper.operation_date, start)){
                    res += +oper.amount;
                }
            }else if (end){
                if (funcs.date_A_more_or_equal_B(end, oper.operation_date)){
                    res += +oper.amount;
                }
            }else{
                res += +oper.amount;
            }
        }
        return res;
    };

    async.series({
        get: function (cb) {
            _t.getById({id: id}, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить инвестора.', {id: id, err: err}));
                investor = res[0];
                name_ru = 'Сертификат ('+ investor.name +')_' + moment(report_date, 'DD.MM.YYYY').format('DD_MM_YYYY');
                cb(null);
            });
        },
        getAccount: function (cb) {
            var o = {
                command: 'get',
                object: 'investor_account',
                params: {
                    param_where: {
                        investor_id:investor.id,
                        is_default:true
                    },
                    collapseData: false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить счет инвестора по умолчанию', {o: o, err: err}));
                if (!res.length) return cb(new UserError('У инвестора нет счета по умолчанию'),{o:o, res:res});
                account = res[0];
                cb(null);
            });
        },
        getPlanMerchantInvestors0: function (cb) {
            var o = {
                command: 'get',
                object: 'investment_plan_merchant_investor',
                params: {

                    where:[
                        {
                            key:'investor_account_id',
                            val1:account.id
                        },
                        {
                            key:'amount',
                            type:'>',
                            val1:0
                        },
                        {
                            key:'commited_date',
                            type:'<=',
                            val1:moment(report_date,'DD.MM.YYYY').format('YYYY-MM-DD')
                        }
                    ],
                    limit:100000000,
                    collapseData: false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить merchant_financing', {o: o, err: err}));
                for (var i in res) {
                    if (merchant_financing_ids.indexOf(res[i].merchant_financing_id)==-1 && res[i].merchant_financing_id) merchant_financing_ids.push(res[i].merchant_financing_id);
                    financings[res[i].merchant_financing_id] = {
                        operations : []
                    }
                }
                //console.log('financings----> ',financings);
                cb(null);
            });
        },
        getOperations: function (cb) {
            var o = {
                command: 'get',
                object: 'investor_account_operation',
                params: {
                    where:[
                        {
                            key:'investor_account_id',
                            val1:account.id
                        },
                        {
                            key:'subtype_sysname',
                            type:'in',
                            val1:['REMITTANCE_FROM_MERCH','ADD_TO_ACCOUNT','REMITTANCE_MAIN_INV_COMISSION','WITHDRAWAL_OF_FUNDS','TRANSFER_TO_MERCHANT']
                        },
                        {
                            key:'amount',
                            type:'>',
                            val1:0
                        }

                    ],
                    sort:'operation_date',
                    limit:100000000,
                    collapseData: false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить операции по заданным параметрам', {o: o, err: err}));
                for (var i in res) {
                    if (merchant_financing_ids.indexOf(res[i].merchant_financing_id)==-1 && res[i].merchant_financing_id) merchant_financing_ids.push(res[i].merchant_financing_id);
                    if (!financings[res[i].merchant_financing_id] && res[i].merchant_financing_id) {
                        financings[res[i].merchant_financing_id] = {
                            operations : []
                        }
                        financings[res[i].merchant_financing_id].operations.push(res[i]);
                    }else if (res[i].merchant_financing_id){
                        financings[res[i].merchant_financing_id].operations.push(res[i]);
                    }
                    operations.push(res[i]);

                }
                cb(null);
            });
        },
        getMerchantFinancigs: function (cb) {
            console.log('merchant_financing_ids', merchant_financing_ids.join(','));
            if (!merchant_financing_ids.length) return cb(null);
            var o = {
                command: 'get',
                object: 'merchant_financing',
                params: {
                    where: [
                        {
                            key:'id',
                            type:'in',
                            val1:merchant_financing_ids
                        }

                    ],
                    limit:100000000,
                    collapseData: false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить merchant_financing', {o: o, err: err}));
                for (var i in res) {
                    for (var j in res[i]) {
                        financings[res[i].id][j] = (typeof financings[res[i].id][j]!=='undefined')? financings[res[i].id][j] : res[i][j];
                    }
                }
                //console.log('financings----> ',financings);
                cb(null);
            });
        },

        getPlanMerchantInvestors: function (cb) {
            if (!merchant_financing_ids.length) return cb(null);
            var o = {
                command: 'get',
                object: 'investment_plan_merchant_investor',
                params: {
                    where: [
                        {
                            key:'merchant_financing_id',
                            type:'in',
                            val1:merchant_financing_ids
                        },
                        {
                            key:'investor_account_id',
                            val1:account.id
                        },
                        {
                            key:'commited',
                            val1:true
                        },
                        {
                            key:'commited_date',
                            type:'<=',
                            val1:moment(report_date,'DD.MM.YYYY').format('YYYY-MM-DD')
                        }
                    ],
                    limit:100000000,
                    collapseData: false
                }
            };
            _t.api(o, function (err, res) {
                if (err) return cb(new MyError('Не удалось получить merchant_financing', {o: o, err: err}));
                for (var i in res) {
                    if (typeof financings[res[i].merchant_financing_id] == 'object'){
                        if (!financings[res[i].merchant_financing_id].merch_investors) financings[res[i].merchant_financing_id].merch_investors = [];
                        financings[res[i].merchant_financing_id].merch_investors.push(res[i]);
                        financings[res[i].merchant_financing_id].amount = res[i].amount;
                        financings[res[i].merchant_financing_id].commited = res[i].commited;
                        financings[res[i].merchant_financing_id].commited_date = res[i].commited_date || res[i].created;
                        financings[res[i].merchant_financing_id].mgm_fee = res[i].mgm_fee;
                    }
                }
                //console.log('financings----> ',financings);
                cb(null);
            });
        },

        prepareData0: function (cb) {
            readyData = {
                investor_name:investor.name,
                report_date: report_date,
                investor_account_id:account.id,
                // inc: [],
                t1: [],
                t2: [],
                rs: [],
                remit: [],
                total_added_to_account:0,
                total_amount_mgm_fee:0,
                total_recon:0,
                sum_gross_investment_all_hist:0,
                balance:0,
                last_weeks_total_collected:0,
                last_week_total_collected:0,
                total_reinvestment_power:0,
                this_week_mgm_fee:0
            };
            for (var i in financings) {

                var fin = financings[i];
                fin.total_returned = Math.round(getCutOffAmount(fin.operations, 'REMITTANCE_FROM_MERCH', null, report_date) * 100)/100;
                fin.to_return = Math.round((+fin.amount_to_return - +fin.total_returned) * 100) / 100;
                fin.complete_percent = Math.round((fin.total_returned * 100 / fin.amount_to_return) * 100) / 100;
            }

            cb(null);
        },

        prepareData1: function (cb) {
            var t1_sum_founding_amount = 0;
            var t1_sum_amount_to_return = 0;
            var t1_sum_gross_profit = 0;
            var t1_sum_all_comission_sum = 0;
            var t1_sum_bank_comission_sum = 0;
            var t1_sum_broker_comission_sum = 0;
            var t1_sum_net_profit = 0;
            var t1_sum_total_collected = 0;
            var t1_sum_total_pending = 0;
            var t1_sum_complete_percent = 0;
            var t1_sum_complete_percent_l = '';

            readyData.t1_sum_avr_factoring_rate = 0;
            readyData.t1_sum_avr_payment_count = 0;
            var counter = 0;
            for (var i in financings) {

                var fin = financings[i];
                if (!fin.commited || fin.commited_date != report_date) continue;
                counter++;


                //console.log('financing_date', fin.financing_date);
                var gross_profit = +fin.amount_to_return - fin.founding_amount;
                var broker_comission_percent = (+fin.broker_comission + (+fin.agent_comission || 0)) / 100;

                var broker_comission_sum = +fin.founding_amount * broker_comission_percent;
                var bank_comission_sum = +fin.amount_to_return * fin.processing_bank_commission / 100;
                var all_comission_sum = broker_comission_sum + bank_comission_sum;
                var net_profit = gross_profit - all_comission_sum;

                var pseudo_res = '';
                var pseudo_comlete_sign_count = Math.abs((fin.complete_percent) / 4);

                for(var p =0;p<pseudo_comlete_sign_count;p++){
                    pseudo_res += 'l';
                }

                readyData.t1.push({
                    merchant_id: fin.merchant_id,
                    merchant_name: fin.merchant_short_name,
                    founding_date: fin.payments_start_date,
                    founding_amount: fin.founding_amount,
                    factoring_rate: fin.factoring_rate,
                    amount_to_return: fin.amount_to_return,
                    days_per_week: (fin.financing_type_sysname == 'PERCENT')? 7 : 5, // days_per_week,
                    //days_per_week: fin.financing_type_sysname,
                    payments_count: fin.payments_count,
                    payment_amount: fin.payment_amount,
                    gross_profit: gross_profit,
                    broker_comission_sum: broker_comission_sum,
                    broker_comission_percent: broker_comission_percent,
                    bank_comission_sum: bank_comission_sum,
                    all_comission_sum: all_comission_sum,
                    net_profit: net_profit,
                    total_collected: fin.total_returned,
                    total_pending: fin.to_return,
                    complete_percent: fin.complete_percent / 100,
                    complete_percent_l: pseudo_res
                });


                t1_sum_founding_amount           += fin.founding_amount;
                t1_sum_amount_to_return         += fin.amount_to_return;
                t1_sum_gross_profit             += gross_profit;
                t1_sum_bank_comission_sum       += bank_comission_sum;
                t1_sum_broker_comission_sum       += broker_comission_sum;
                t1_sum_all_comission_sum       += all_comission_sum;
                t1_sum_net_profit               += net_profit;
                t1_sum_total_collected          += fin.total_returned;
                t1_sum_total_pending            += fin.to_return;
                t1_sum_complete_percent         += (+fin.complete_percent / 100);

                readyData.t1_sum_avr_factoring_rate += fin.factoring_rate;
                readyData.t1_sum_avr_payment_count += fin.payments_count;
            }

            t1_sum_complete_percent = (counter > 0) ? t1_sum_complete_percent/counter : 0;



            readyData.t1_sum_founding_amount = t1_sum_founding_amount;
            readyData.t1_sum_amount_to_return = t1_sum_amount_to_return;
            readyData.t1_sum_gross_profit = t1_sum_gross_profit;
            readyData.t1_sum_bank_comission_sum = t1_sum_bank_comission_sum;
            readyData.t1_sum_broker_comission_sum = t1_sum_broker_comission_sum;
            readyData.t1_sum_all_comission_sum = t1_sum_all_comission_sum;
            readyData.t1_sum_net_profit = t1_sum_net_profit;
            readyData.t1_sum_total_collected = t1_sum_total_collected;
            readyData.t1_sum_total_pending = t1_sum_total_pending;
            readyData.t1_sum_complete_percent = t1_sum_complete_percent;

            var total_pseudo_comlete_sign_count = Math.floor(readyData.t1_sum_complete_percent * 100 / 4);
            var total_pseudo_res = '';

            for(var p2 =0;p2<total_pseudo_comlete_sign_count;p2++){
                total_pseudo_res += 'l';
            }

            t1_sum_complete_percent_l = total_pseudo_res;


            readyData.t1_sum_complete_percent_l = t1_sum_complete_percent_l;
            readyData.t1_sum_avr_factoring_rate = (counter > 0) ? Math.round((readyData.t1_sum_avr_factoring_rate / counter) * 100) / 100 : 0;
            readyData.t1_sum_avr_payment_count = (counter > 0) ? Math.round((readyData.t1_sum_avr_payment_count / counter) * 100) / 100 : 0;

            cb(null);


        },
        prepareData2: function (cb) {


            readyData.t2_sum_gross_investment_cut_off = 0;
            readyData.total_returned = 0;

            var t2_sum_gross_investment                     = 0;
            var t2_sum_bank_comission_part_summ             = 0;
            var t2_sum_broker_comission_part_summ             = 0;
            var t2_sum_all_comission_part_summ             = 0;

            var t2_sum_net_investment                       = 0;
            var t2_sum_participation_payback_amount         = 0;
            var t2_sum_participation_payment_amount         = 0;
            var t2_sum_participation_gross_profit           = 0;
            var t2_sum_mgm_comission                        = 0;
            var t2_sum_net_profit_after_mgm_fee             = 0;
            var t2_sum_participation_net_profit             = 0;
            var t2_sum_gross_profit_after_mgm_fee           = 0;
            var t2_sum_total_collected                      = 0;
            var t2_sum_total_to_return                      = 0;
            var t2_sum_pending_remittance                   = 0;
            var t2_sum_mgm_comission_paid                   = 0;
            var t2_last_weeks_total_collected               = 0;

            for (var i in financings) {

                var fin = financings[i];
                if (!fin.commited) continue;



                var amount = +fin.amount;

                var percent = fin.percent = amount * 100 / +fin.founding_amount; // Процент участие в инвестировании

                var gross_profit = +fin.amount_to_return - fin.founding_amount;

                var broker_comission_percent = (+fin.broker_comission + (+fin.agent_comission || 0)) / 100;


                var broker_comission_sum = +fin.founding_amount * broker_comission_percent;
                var bank_comission_sum = +fin.amount_to_return * fin.processing_bank_commission / 100;
                var all_comission_sum = broker_comission_sum + bank_comission_sum;
                var net_profit = gross_profit - all_comission_sum;
                var participation_payment_amount = fin.payment_amount * percent / 100;



                var broker_comission_part_summ = broker_comission_sum * percent / 100;
                var bank_comission_part_summ = bank_comission_sum * percent / 100;
                var all_comission_part_summ = all_comission_sum * percent / 100;
                var gross_investment = all_comission_part_summ + amount;


                if (moment(fin.commited_date,'DD.MM.YYYY') <= moment(report_date, 'DD.MM.YYYY')){
                    readyData.t2_sum_gross_investment_cut_off  += +(+all_comission_part_summ + getCutOffAmount(fin.operations, 'TRANSFER_TO_MERCHANT', null, report_date));
                    // readyData.total_returned  += getCutOffAmount(fin.operations, 'REMITTANCE_FROM_MERCH', null, report_date); // На процент умножать не надо так как операции только по тому инфестору
                    readyData.total_returned  += getCutOffAmount(fin.operations, 'REMITTANCE_FROM_MERCH', null, weekAgoEndBefore); // На процент умножать не надо так как операции только по тому инфестору
                }

                if (fin.commited_date != report_date) continue;



                var participation_payback_amount = amount * fin.factoring_rate / 100;
                var participation_gross_profit = amount + participation_payback_amount;
                var participation_net_profit = participation_payback_amount - all_comission_part_summ;

                var main_company_commision = fin.mgm_fee / 100;

                var mgm_comission = (participation_payback_amount - all_comission_part_summ) * main_company_commision;
                var net_profit_after_mgm_fee = participation_payback_amount - all_comission_part_summ - mgm_comission;
                var gross_profit_after_mgm_fee = participation_gross_profit - mgm_comission;
                //var total_returned = fin.total_returned * percent / 100;
                //var total_returned = getCutOffAmount(fin.operations, 'REMITTANCE_FROM_MERCH', null, weekAgoEnd) * percent / 100;
                // var total_returned = getCutOffAmount(fin.operations, 'REMITTANCE_FROM_MERCH', null, report_date); // На процент умножать не надо так как операции только по тому инфестору
                var to_return = fin.to_return * percent / 100;
                //var last_weeks_total_collected = getCutOffAmount(fin.operations, 'REMITTANCE_FROM_MERCH');


                //var pending_remittance = total_returned - last_weeks_total_collected;
                //var pending_remittance = getCutOffAmount(fin.operations, 'REMITTANCE_FROM_MERCH') * percent / 100;
                var pending_remittance = getCutOffAmount(fin.operations, 'REMITTANCE_FROM_MERCH'); // На процент умножать не надо так как операции только по тому инфестору
                // var last_weeks_total_collected = total_returned - pending_remittance;
                //var mgm_comission_paid = (fin.closing_date)? mgm_comission : 0;
                var mgm_comission_paid = getCutOffAmount(fin.operations, 'REMITTANCE_MAIN_INV_COMISSION', null, report_date);

                readyData.t2.push({
                    merchant_id: fin.merchant_id,
                    merchant_name: fin.merchant_short_name,
                    founding_date: fin.payments_start_date,
                    gross_investment: gross_investment,
                    bank_comission_part_summ: bank_comission_part_summ,
                    broker_comission_part_summ: broker_comission_part_summ,
                    all_comission_part_summ: all_comission_part_summ,
                    factoring_rate: fin.factoring_rate,
                    net_investment: amount,
                    participation_percent: Math.round(percent*100)/100,
                    participation_payback_amount: participation_payback_amount,
                    participation_gross_profit: participation_gross_profit,
                    payments_count: fin.payments_count,
                    participation_payment_amount: participation_payment_amount,
                    mgm_comission: mgm_comission,
                    net_profit_after_mgm_fee: net_profit_after_mgm_fee,
                    participation_net_profit: participation_net_profit,
                    gross_profit_after_mgm_fee: gross_profit_after_mgm_fee,
                    complete_percent: fin.complete_percent,
                    // total_collected: total_returned,
                    total_to_return: to_return,
                    // last_weeks_total_collected: last_weeks_total_collected,
                    pending_remittance:pending_remittance,
                    mgm_comission_paid:mgm_comission_paid,
                    mgm_fee_paid_date:fin.closing_date,
                    mgm_fee_paid_amount:mgm_comission_paid


                });
                t2_sum_gross_investment                     += gross_investment;
                t2_sum_bank_comission_part_summ             += bank_comission_part_summ;
                t2_sum_broker_comission_part_summ             += broker_comission_part_summ;
                t2_sum_all_comission_part_summ             += all_comission_part_summ;

                t2_sum_net_investment                       += amount;
                t2_sum_participation_payback_amount         += participation_payback_amount;
                t2_sum_participation_payment_amount         += participation_payment_amount;
                t2_sum_participation_gross_profit           += participation_gross_profit;
                t2_sum_mgm_comission                        += mgm_comission;
                t2_sum_net_profit_after_mgm_fee             += net_profit_after_mgm_fee;
                t2_sum_participation_net_profit             += participation_net_profit;
                t2_sum_gross_profit_after_mgm_fee           += gross_profit_after_mgm_fee;
                // t2_sum_total_collected                      += total_returned;
                t2_sum_total_to_return                      += to_return;
                // t2_last_weeks_total_collected                      += last_weeks_total_collected;
                t2_sum_pending_remittance                   += pending_remittance;
                t2_sum_mgm_comission_paid                   += mgm_comission_paid;

            }


            readyData.t2_sum_gross_investment                   = t2_sum_gross_investment;
            readyData.t2_sum_bank_comission_part_summ           = t2_sum_bank_comission_part_summ;
            readyData.t2_sum_broker_comission_part_summ           = t2_sum_broker_comission_part_summ;
            readyData.t2_sum_all_comission_part_summ           = t2_sum_all_comission_part_summ;


            readyData.t2_sum_net_investment                     = t2_sum_net_investment;
            readyData.t2_sum_participation_payback_amount       = t2_sum_participation_payback_amount;
            readyData.t2_sum_participation_payment_amount       = t2_sum_participation_payment_amount;
            readyData.t2_sum_participation_gross_profit         = t2_sum_participation_gross_profit;
            readyData.t2_sum_mgm_comission                      = t2_sum_mgm_comission;
            readyData.t2_sum_net_profit_after_mgm_fee           = t2_sum_net_profit_after_mgm_fee;
            readyData.t2_sum_participation_net_profit           = t2_sum_participation_net_profit;
            readyData.t2_sum_gross_profit_after_mgm_fee         = t2_sum_gross_profit_after_mgm_fee;
            readyData.t2_sum_total_collected                    = t2_sum_total_collected;
            readyData.t2_sum_total_to_return                    = t2_sum_total_to_return;
            readyData.t2_last_weeks_total_collected             = t2_last_weeks_total_collected;
            readyData.t2_sum_pending_remittance                 = t2_sum_pending_remittance;
            readyData.t2_sum_mgm_comission_paid                 = t2_sum_mgm_comission_paid;
            // var merchant_id
            // var merchant_name
            // var gross_investment
            // var bank_comission_part_summ
            // var net_investment
            // var participation_percent
            // var participation_payback_amount
            // var participation_gross_profit
            // var mgm_comission
            // var net_profit_after_mgm_fee
            // var gross_profit_after_mgm_fee
            // var complete_percent
            // var total_collected
            // var total_to_return
            // var last_weeks_total_collected
            // var pending_remittance
            // var mgm_comission_paid

            cb(null);

        },
        prepareData4: function (cb) {
            //total_added_to_account:0,
            //    total_amount_mgm_fee:0,
            //    total_recon:0,
            //    sum_gross_investment_all_hist:0,
            //    balance:0,
            //    last_weeks_total_collected:0,
            //    last_week_total_collected:0,
            //    total_reinvestment_power:0,
            //    this_week_mgm_fee:0
            readyData.total_added_to_account = getCutOffAmount(operations, 'ADD_TO_ACCOUNT', null, report_date);

            // for (var i in operations) {
            //     if (operations[i].subtype_sysname !== 'ADD_TO_ACCOUNT') continue;
            //     readyData.inc.push({
            //         incoming_amount:+operations[i].amount,
            //         incoming_date_hard:'Дополнительные инвистиции:'
            //     });
            // }

            readyData.total_amount_mgm_fee = getCutOffAmount(operations, 'REMITTANCE_MAIN_INV_COMISSION', null, report_date);
            readyData.total_withdrawal_of_funds = 0;
            for (var i in operations) {
                if (operations[i].subtype_sysname !== 'WITHDRAWAL_OF_FUNDS') continue;
                readyData.remit.push({
                    remittance_amount:+operations[i].amount,
                    remittance_date:operations[i].operation_date
                });
                readyData.total_withdrawal_of_funds += +operations[i].amount;
            }

            //readyData.total_recon = readyData.total_added_to_account - readyData.total_withdrawal_of_funds - readyData.total_amount_mgm_fee;
            readyData.total_recon = readyData.total_added_to_account - readyData.total_withdrawal_of_funds;
            // readyData.sum_gross_investment_all_hist = readyData.rs_sum_last_weeks_total_collected;
            readyData.sum_gross_investment = readyData.t2_sum_gross_investment_cut_off;
            readyData.balance = readyData.total_recon - readyData.sum_gross_investment_all_hist;
            readyData.last_weeks_total_collected = readyData.rs_sum_last_weeks_total_collected;
            readyData.last_week_total_collected = readyData.rs_sum_week_12;
            // readyData.this_week_mgm_fee = getCutOffAmount(operations, 'REMITTANCE_MAIN_INV_COMISSION');
            // readyData.total_reinvestment_power = readyData.last_week_total_collected - readyData.this_week_mgm_fee;

            // readyData.recon_total_invested = readyData.total_recon - readyData.t2_sum_gross_investment;
            readyData.recon_total_invested = readyData.total_recon - readyData.t2_sum_gross_investment_cut_off;
            readyData.recon_avail_to_invest = readyData.recon_total_invested + readyData.total_returned;
            // readyData.recon_avail_to_reinvest = readyData.recon_avail_to_invest + readyData.t2_sum_pending_remittance; // Последняя неделя лишняя
            //readyData.recon_avail_to_reinvest = readyData.recon_avail_to_invest; // + readyData.t2_sum_pending_remittance; // Последняя неделя лишняя
            readyData.recon_avail_to_reinvest = readyData.recon_avail_to_invest - readyData.total_amount_mgm_fee;

            cb(null);


        },
        getTemplate: function (cb) {
            fs.readFile('./templates/' + name, function (err, data) {
                if (err) return cb(new MyError('Не удалось считать файл шаблона test.xlsx.', err));
                template = new XlsxTemplate(data);
                cb(null);
            });
        },
        perform: function (cb) {
            var sheetNumber = 1;
            template.substitute(sheetNumber, readyData);
            // sheetNumber = 2;
            // template.substitute(sheetNumber, readyData);
            // sheetNumber = 3;
            // template.substitute(sheetNumber, readyData);
            // sheetNumber = 4;
            // template.substitute(sheetNumber, readyData);
            var dataBuf = template.generate();
            binaryData = new Buffer(dataBuf, 'binary');
            cb(null)
        },
        writeFile: function (cb) {
            filename = '_' + name;
            fs.writeFile('./public/savedFiles/' + filename,binaryData, function (err) {
                if (err) return cb(new MyError('Не удалось записать файл testOutput.xlsx',{err:err}));
                return cb(null, new UserOk('testOutput.xlsx успешно сформирован'));
            });
        }
    },function (err, res) {
        if (err) return cb(err);
        cb(null, new UserOk('Ок.',{filename:filename,path:'/savedFiles/',name_ru:name_ru}));
    });
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

module.exports = Model;
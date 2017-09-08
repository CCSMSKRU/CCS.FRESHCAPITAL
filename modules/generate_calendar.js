
var moment = require('moment');
var MyError = require('../error').MyError;
var request = require('request');
//var async = require('async');

var reservData = {"data":{"2003":{"1":{"1":{"isWorking":2},"2":{"isWorking":2},"3":{"isWorking":2},"4":{"isWorking":0},"5":{"isWorking":3},"6":{"isWorking":2},"7":{"isWorking":2}},"2":{"24":{"isWorking":2}},"3":{"7":{"isWorking":3},"10":{"isWorking":2}},"4":{"30":{"isWorking":3}},"5":{"1":{"isWorking":2},"2":{"isWorking":2},"8":{"isWorking":3},"9":{"isWorking":2}},"6":{"11":{"isWorking":3},"12":{"isWorking":2},"13":{"isWorking":2},"21":{"isWorking":0}},"11":{"6":{"isWorking":3},"7":{"isWorking":2}},"12":{"11":{"isWorking":3},"12":{"isWorking":2},"31":{"isWorking":3}}},"2004":{"1":{"1":{"isWorking":2},"2":{"isWorking":2},"6":{"isWorking":3},"7":{"isWorking":2}},"2":{"23":{"isWorking":2}},"3":{"8":{"isWorking":2}},"4":{"30":{"isWorking":3}},"5":{"3":{"isWorking":2},"4":{"isWorking":2},"10":{"isWorking":2}},"6":{"11":{"isWorking":3},"14":{"isWorking":2}},"11":{"8":{"isWorking":2}},"12":{"13":{"isWorking":2},"31":{"isWorking":3}}},"2005":{"1":{"3":{"isWorking":2},"4":{"isWorking":2},"5":{"isWorking":2},"6":{"isWorking":2},"7":{"isWorking":2},"10":{"isWorking":2}},"2":{"22":{"isWorking":3},"23":{"isWorking":2}},"3":{"5":{"isWorking":3},"7":{"isWorking":2},"8":{"isWorking":2}},"5":{"2":{"isWorking":2},"9":{"isWorking":2}},"6":{"13":{"isWorking":2}},"11":{"3":{"isWorking":3},"4":{"isWorking":2}},"12":{"12":{"isWorking":2}}},"2006":{"1":{"2":{"isWorking":2},"3":{"isWorking":2},"4":{"isWorking":2},"5":{"isWorking":2},"6":{"isWorking":2},"9":{"isWorking":2}},"2":{"22":{"isWorking":3},"23":{"isWorking":2},"24":{"isWorking":2},"26":{"isWorking":0}},"3":{"7":{"isWorking":3},"8":{"isWorking":2}},"5":{"1":{"isWorking":2},"6":{"isWorking":3},"8":{"isWorking":2},"9":{"isWorking":2}},"6":{"12":{"isWorking":2}},"11":{"3":{"isWorking":3},"6":{"isWorking":2}}},"2007":{"1":{"1":{"isWorking":2},"2":{"isWorking":2},"3":{"isWorking":2},"4":{"isWorking":2},"5":{"isWorking":2},"8":{"isWorking":2}},"2":{"22":{"isWorking":3},"23":{"isWorking":2}},"3":{"7":{"isWorking":3},"8":{"isWorking":2}},"4":{"28":{"isWorking":3},"30":{"isWorking":2}},"5":{"1":{"isWorking":2},"8":{"isWorking":3},"9":{"isWorking":2}},"6":{"9":{"isWorking":3},"11":{"isWorking":2},"12":{"isWorking":2}},"11":{"5":{"isWorking":2}},"12":{"29":{"isWorking":3},"31":{"isWorking":2}}},"2008":{"1":{"1":{"isWorking":2},"2":{"isWorking":2},"3":{"isWorking":2},"4":{"isWorking":2},"7":{"isWorking":2},"8":{"isWorking":2}},"2":{"22":{"isWorking":3},"25":{"isWorking":2}},"3":{"7":{"isWorking":3},"10":{"isWorking":2}},"4":{"30":{"isWorking":3}},"5":{"1":{"isWorking":2},"2":{"isWorking":2},"4":{"isWorking":0},"8":{"isWorking":3},"9":{"isWorking":2}},"6":{"7":{"isWorking":0},"11":{"isWorking":3},"12":{"isWorking":2},"13":{"isWorking":2}},"11":{"1":{"isWorking":3},"3":{"isWorking":2},"4":{"isWorking":2}},"12":{"31":{"isWorking":3}}},"2009":{"1":{"1":{"isWorking":2},"2":{"isWorking":2},"5":{"isWorking":2},"6":{"isWorking":2},"7":{"isWorking":2},"8":{"isWorking":2},"9":{"isWorking":2},"11":{"isWorking":0}},"2":{"23":{"isWorking":2}},"3":{"9":{"isWorking":2}},"4":{"30":{"isWorking":3}},"5":{"1":{"isWorking":2},"8":{"isWorking":3},"11":{"isWorking":2}},"6":{"11":{"isWorking":3},"12":{"isWorking":2}},"11":{"3":{"isWorking":3},"4":{"isWorking":2}},"12":{"31":{"isWorking":3}}},"2010":{"1":{"1":{"isWorking":2},"4":{"isWorking":2},"5":{"isWorking":2},"6":{"isWorking":2},"7":{"isWorking":2},"8":{"isWorking":2}},"2":{"22":{"isWorking":2},"23":{"isWorking":2},"27":{"isWorking":3}},"3":{"8":{"isWorking":2}},"4":{"30":{"isWorking":3}},"5":{"3":{"isWorking":2},"10":{"isWorking":2}},"6":{"11":{"isWorking":3},"14":{"isWorking":2}},"11":{"3":{"isWorking":3},"4":{"isWorking":2},"5":{"isWorking":2},"13":{"isWorking":0}},"12":{"31":{"isWorking":3}}},"2011":{"1":{"3":{"isWorking":2},"4":{"isWorking":2},"5":{"isWorking":2},"6":{"isWorking":2},"7":{"isWorking":2},"10":{"isWorking":2}},"2":{"22":{"isWorking":3},"23":{"isWorking":2}},"3":{"5":{"isWorking":3},"7":{"isWorking":2},"8":{"isWorking":2}},"5":{"2":{"isWorking":2},"9":{"isWorking":2}},"6":{"13":{"isWorking":2}},"11":{"3":{"isWorking":3},"4":{"isWorking":2}}},"2012":{"1":{"2":{"isWorking":2},"3":{"isWorking":2},"4":{"isWorking":2},"5":{"isWorking":2},"6":{"isWorking":2},"9":{"isWorking":2}},"2":{"22":{"isWorking":3},"23":{"isWorking":2}},"3":{"7":{"isWorking":3},"8":{"isWorking":2},"9":{"isWorking":2},"11":{"isWorking":0}},"4":{"28":{"isWorking":3},"30":{"isWorking":2}},"5":{"1":{"isWorking":2},"5":{"isWorking":0},"7":{"isWorking":2},"8":{"isWorking":2},"9":{"isWorking":2},"12":{"isWorking":3}},"6":{"9":{"isWorking":3},"11":{"isWorking":2},"12":{"isWorking":2}},"11":{"5":{"isWorking":2}},"12":{"29":{"isWorking":3},"31":{"isWorking":2}}},"2013":{"1":{"1":{"isWorking":2},"2":{"isWorking":2},"3":{"isWorking":2},"4":{"isWorking":2},"7":{"isWorking":2},"8":{"isWorking":2}},"2":{"22":{"isWorking":3}},"3":{"7":{"isWorking":3},"8":{"isWorking":2}},"4":{"30":{"isWorking":3}},"5":{"1":{"isWorking":2},"2":{"isWorking":2},"3":{"isWorking":2},"8":{"isWorking":3},"9":{"isWorking":2},"10":{"isWorking":2}},"6":{"11":{"isWorking":3},"12":{"isWorking":2}},"11":{"4":{"isWorking":2}},"12":{"31":{"isWorking":3}}},"2014":{"1":{"1":{"isWorking":2},"2":{"isWorking":2},"3":{"isWorking":2},"6":{"isWorking":2},"7":{"isWorking":2},"8":{"isWorking":2}},"2":{"24":{"isWorking":3}},"3":{"7":{"isWorking":3},"10":{"isWorking":2}},"4":{"30":{"isWorking":3}},"5":{"1":{"isWorking":2},"2":{"isWorking":2},"8":{"isWorking":3},"9":{"isWorking":2}},"6":{"11":{"isWorking":3},"12":{"isWorking":2},"13":{"isWorking":2}},"11":{"3":{"isWorking":2},"4":{"isWorking":2}},"12":{"31":{"isWorking":3}}},"2015":{"1":{"1":{"isWorking":2},"2":{"isWorking":2},"5":{"isWorking":2},"6":{"isWorking":2},"7":{"isWorking":2},"8":{"isWorking":2},"9":{"isWorking":2}},"2":{"20":{"isWorking":3},"23":{"isWorking":2}},"3":{"6":{"isWorking":3},"9":{"isWorking":2}},"4":{"30":{"isWorking":3}},"5":{"1":{"isWorking":2},"4":{"isWorking":2},"8":{"isWorking":3},"11":{"isWorking":2}},"6":{"11":{"isWorking":3},"12":{"isWorking":2}},"11":{"3":{"isWorking":3},"4":{"isWorking":2}},"12":{"31":{"isWorking":3}}},"2016":{"1":{"1":{"isWorking":2},"4":{"isWorking":2},"5":{"isWorking":2},"6":{"isWorking":2},"7":{"isWorking":2},"8":{"isWorking":2}},"2":{"20":{"isWorking":3},"22":{"isWorking":2},"23":{"isWorking":2}},"3":{"7":{"isWorking":2},"8":{"isWorking":2}},"5":{"2":{"isWorking":2},"3":{"isWorking":2},"9":{"isWorking":2}},"6":{"13":{"isWorking":2}},"11":{"3":{"isWorking":3},"4":{"isWorking":2}}}}};

module.exports = function(obj, cb){

    if(typeof cb !== 'function') throw new MyError('Не передан cb');

    if(typeof obj !== 'object') return cb(new MyError('Не передан obj'));



    var start =             moment(obj.date_start,'DD.MM.YYYY');//.format('YYYY-MM-DD');
    var payments_count =    obj.payments_count;
    var is_to_date =        (obj.to_date)? obj.to_date : false; // 'DD.MM.YYYY'
    var res_array = [];
    var lastDate = undefined;


    switch (obj.type){
        case 'five_two':

            function checkWeekend(date){
                var weekday = date.day();
                return weekday == 6 || weekday == 0;

            }

            for(var i = 0 ; i < payments_count; i++){
                if(lastDate === undefined && i == 0) lastDate = start;


                if(!checkWeekend(lastDate)){
                    res_array.push(lastDate.format('DD.MM.YYYY'));
                    lastDate = lastDate.add(1, 'd');
                }else{
                    lastDate = lastDate.add(1, 'd');
                    i = i-1;
                }

            }


            cb(null,res_array);

            break;
        case 'seven':

            for(var i = 0 ; i < payments_count; i++){
                if(lastDate === undefined && i == 0) lastDate = start;

                res_array.push(lastDate.format('DD.MM.YYYY'));
                lastDate = lastDate.add(1, 'd');
            }

            cb(null,res_array);

            break;
        case 'gov_old': // Ждем basicData.ru service

            var notWorking = undefined;

            function checkDate(date){

                var weekday = date.day();
                var dayOMth = date.date();
                var year = date.year();
                var mth = date.month() + 1;

                var result = undefined;

                if(nw2017[mth]){

                    if(nw2017[mth].indexOf(dayOMth) > -1){

                        result = true;

                    }else{
                        result = false;
                    }

                }

                return result;

            }

            request({
                url: 'http://basicdata.ru/api/json/calend/',
                json: true
            }, function(error, res, body){


                if(!error && res.statusCode == 200){

                    notWorking = body;

                }else{

                    notWorking = reservData;
                    console.log(error);
                }

                function checkDate(date){

                    var weekday = date.day();
                    var dayOMth = date.date();
                    var year = date.year();
                    var mth = date.month() + 1;

                    var result = undefined;


                    if(weekday == 6 || weekday == 0){ // суббота или воскресенье
                        if(notWorking.data[year]){
                            if(notWorking.data[year][mth]){
                                if(notWorking.data[year][mth][dayOMth]){
                                    if(notWorking.data[year][mth][dayOMth].isWorking == 0 || notWorking.data[year][mth][dayOMth].isWorking == 3){
                                        result = true;
                                    }else{
                                        result = false;
                                    }
                                }else{
                                    result = false;
                                }
                            }else{
                                result = false;
                            }
                        }else{
                            result = false;
                        }
                    }else{ // пн, вт, ср, чт, пт

                        if(notWorking.data[year]){
                            if(notWorking.data[year][mth]){
                                if(notWorking.data[year][mth][dayOMth]){
                                    if(notWorking.data[year][mth][dayOMth].isWorking == 2 ){
                                        result = false;
                                    }else{
                                        result = true;
                                    }
                                }else{
                                    result = true;
                                }
                            }else{
                                result = true;
                            }
                        }else{
                            result = true;
                        }
                    }

                    return result;
                }

                start =             moment(obj.date_start,'DD.MM.YYYY');//.format('YYYY-MM-DD');
                payments_count =    obj.payments_count;

                res_array = [];
                lastDate = undefined;



                for(var i = 0 ; i < payments_count; i++){
                    if(lastDate === undefined && i == 0) lastDate = start;

                    if(checkDate(lastDate)) {
                        res_array.push(lastDate.format('DD.MM.YYYY'));
                        lastDate = lastDate.add(1, 'd');
                    }else{
                        lastDate = lastDate.add(1, 'd');
                        i = i-1;
                    }

                }

                cb(null,res_array);
                //console.log(res_array, res_array.length);
            });

            break;
        case 'gov':

            var notWorking = undefined;

            var nw = {
                2016: [
                        [1,2,3,4,5,6,7,8,9,10,16,17,23,24,30,31],
                        [6,7,13,14,21,22,23,27,28],
                        [5,6,7,8,12,13,19,20,26,27],
                        [2,3,9,10,16,17,23,24,30],
                        [1,2,3,7,8,9,14,15,21,22,28,29],
                        [4,5,11,12,13,18,19,25,26],
                        [2,3,9,10,16,17,23,24,30,31],
                        [6,7,13,14,20,21,27,28],
                        [3,4,10,11,17,18,24,25],
                        [1,2,8,9,15,16,22,23,29,30],
                        [4,5,6,12,13,19,20,26,27],
                        [3,4,10,11,17,18,24,25,31]
                    ],
                2017: [
                        [1,2,3,4,5,6,7,8,14,15,21,22,28,29],
                        [4,5,11,12,18,19,23,24,25,26],
                        [4,5,8,11,12,18,19,25,26],
                        [1,2,8,9,15,16,22,23,29,30],
                        [1,6,7,8,9,13,14,20,21,27,28],
                        [3,4,10,11,12,17,18,24,25],
                        [1,2,8,9,15,16,22,23,29,30],
                        [5,6,12,13,19,20,26,27],
                        [2,3,9,10,16,17,23,24,30],
                        [1,7,8,14,15,21,22,28,29],
                        [4,5,6,11,12,18,19,25,26],
                        [2,3,9,10,16,17,23,24,30,31]
                    ],
                2018: [
                        [1,2,3,4,5,6,7,8,9,10,13,14,20,21,27,28],
                        [3,4,10,11,17,18,23,24,25],
                        [3,4,8,10,11,17,18,24,25,31],
                        [1,7,8,14,15,21,22,28,29],
                        [1,5,6,9,12,13,19,20,26,27],
                        [2,3,9,10,12,16,17,23,24,30],
                        [1,7,8,14,15,21,22,28,29],
                        [4,5,11,12,18,19,25,26],
                        [1,2,8,9,15,16,22,23,29,30],
                        [6,7,13,14,20,21,27,28],
                        [3,4,5,10,11,17,18,24,25],
                        [1,2,8,9,15,16,22,23,29,30]
                    ],
                2019: [
                        [1,2,3,4,5,6,7,8,9,10,12,13,19,20,26,27],
                        [2,3,9,10,16,17,23,24,25],
                        [2,3,8,9,10,16,17,23,24,30,31],
                        [6,7,13,14,20,21,27,28],
                        [4,5,9,11,12,18,19,25,26],
                        [1,2,8,9,12,15,16,22,23,29,30],
                        [6,7,13,14,20,21,27,28],
                        [3,4,10,11,17,18,24,25,31],
                        [1,7,8,14,15,21,22,28,29],
                        [5,6,12,13,19,20,26,27],
                        [2,3,9,10,16,17,23,24,30],
                        [1,7,8,14,15,21,22,28,29]
                    ]
                };

            function checkDate(date){

                var weekday = date.day();
                var dayOMth = date.date();
                var year = date.year();
                var mth = date.month() + 0;

                var result = undefined;

                if(nw[year][mth]){

                    if(nw[year][mth].indexOf(dayOMth) > -1){

                        result = false;

                    }else{
                        result = true;
                    }

                }

                return result;

            }

            start =             moment(obj.date_start,'DD.MM.YYYY');//.format('YYYY-MM-DD');
            payments_count =    obj.payments_count;

            res_array = [];
            lastDate = undefined;

            if(is_to_date){

                function runDate(nextDate){

                    if(nextDate === undefined) nextDate = start;

                    if(checkDate(moment(nextDate, 'DD.MM.YYYY'))) {
                        res_array.push(nextDate.format('DD.MM.YYYY'));
                    }

                    if(nextDate.format('DD.MM.YYYY') != is_to_date){

                        nextDate = nextDate.add(1, 'd');

                        runDate(nextDate);
                    }
                }

                runDate(lastDate);
            }else{
                for(var i = 0 ; i < payments_count; i++){
                    if(lastDate === undefined && i == 0) lastDate = start;

                    if(checkDate(lastDate)) {
                        res_array.push(lastDate.format('DD.MM.YYYY'));
                        lastDate = lastDate.add(1, 'd');
                    }else{
                        lastDate = lastDate.add(1, 'd');
                        i = i-1;
                    }

                }
            }



            cb(null,res_array);

            break;


        default : // as seven

            start =             moment(obj.date_start,'DD.MM.YYYY');//.format('YYYY-MM-DD');
            payments_count =    obj.payments_count;

            res_array = [];
            lastDate = undefined;



            for(var i = 0 ; i < payments_count; i++){
                if(lastDate === undefined && i == 0) lastDate = start;

                res_array.push(lastDate.format('DD.MM.YYYY'));
                lastDate = lastDate.add(1, 'd');
            }

            cb(null,res_array);

            break;
    }

    //USING:
    //
    //generate_calendar({
    //    date_start: '01.01.2016',
    //    payments_count: 41
    //}, function(){
    //
    //});






};

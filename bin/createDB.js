var async = require('async');
var request = require('request');
var t1 = new Date().getTime();
global.pool = require('../libs/mysqlConnect');
global.models = [];
var moment = require('moment');
var api = require('../libs/api');

var countries = [];
var cities = [];
function getCountriesPortion(offset,callback){
    offset = offset || 0;
    var url = 'http://api.vk.com/method/database.getCountries?v=5.5&need_all=1&offset='+offset+'&count=1000&code=RU';
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var res = JSON.parse(body);
            var items = res.response.items;
            for (var i in items) {
                countries.push(items[i]);
                //console.log(items[i]);
            }
        }
        callback();
    })
}


function getCitiesPortion(country_id,offset,callback){
    offset = offset || 0;
    var country;
    for (var i in countries) {
        if (countries[i].id==country_id){
            country = countries[i];
            break;
        }
    }
    var url = 'http://api.vk.com/method/database.getCities?country_id='+country_id+'&v=5.5&need_all=1&offset='+offset+'&count=1000';
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var res = JSON.parse(body);
            //cities = res.response.items;
            var items = res.response.items;
            for (var i in items) {
                items[i].country_id = country_id;
                items[i].country_title = country.title;
                cities.push(items[i]);
            }
            if (cities.length%1000 == 0){
                offset +=1000;
                return getCitiesPortion(country_id,offset,callback);
            }else{
                callback();
            }
        }
    })
}
function getCountryById(id){
    for (var i in countries) {
        var country = countries[i];
        if (country.id == id) return country;
    }
    return false;
}

//// Блок для тестов
/*api('get', 'city', {where:{}}, function(err,result){
    console.log('err',err);
    console.log('result',result);
});*/


//// КОНЕЦ Блок для тестов

function getCities(callback) {
    getCountriesPortion(0, function () {
        async.each(countries, function (item, callback) {
            getCitiesPortion(item.id, 0, function () {

                callback();
            })
        }, callback);
    });
}
//return;
getCities(function(){
    var created = moment().format('DD-MM-YY HH:mm:ss');
    async.series([
            function (callback) {
                async.eachSeries(countries, function (item, callback) {
                    var command = 'add';
                    var object = 'country';
                    console.log('title',item.title);
                    var obj = {
                        original_id: item.id,
                        title: item.title,
                        important: item.important || 0
                    };
                    console.log(obj);
                    api(command, object, obj,function(err,result){
                        if (err){
                            callback(err);
                        }else{
                            item.newId = result.data.id;
                            callback(null);
                        }
                    });
                }, function (err) {
                    if (err){
                        console.log('Ошибка во время добавления');
                        console.log(err);
                    }
                    callback(err);
                })
            },
            function(callback){
                async.eachSeries(cities, function (item, callback) {
                    var country  = getCountryById(item.country_id);
                    if (!country){
                        console.log('Не обнаружена страна', item);
                        return callback(null);
                    }
                    var command = 'add';
                    var object = 'city';
                    var obj = {
                        original_id: item.id,
                        title:item.title,
                        important:item.important || 0,
                        country_id:country.newId,
                        original_country_id:country.id
                    };
                    console.log(obj);
                    api(command, object,obj,function(err,result){
                        if (err){
                            callback(err);
                        }else{
                            item.newId = result.data.id;
                            console.log('newId',item.newId);
                            callback(null);
                        }
                    });
                }, function (err) {
                    if (err){
                        console.log('Ошибка во время добавления');
                        console.log(err);
                    }
                    callback(err);
                })
            }
        ], function (err) {
            console.log('Процесс завершен');
            console.log(err);
        }
    );
/*    console.log(countries[0]);
    console.log(cities[0]);*/
    //for (var i in cities) {
    //    if (cities[i].title=="Москва"){
    //        console.log(cities[i]);
    //    }
    //}
});



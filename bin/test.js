/**
 * Created by iig on 02.10.2015.
 */
var moment = require('moment');
var places = {};
var access1 = {};
var access2 = {};
var access3 = {};
var access4 = {};

for (var i = 0; i<100000; i++) {
    places[i] = {
        status:0
    };
}
for (var i2 = 0; i2<100000; i2++) {
    access1[i2] = Math.round(Math.random());
    access2[i2] = Math.round(Math.random());
    access3[i2] = Math.round(Math.random());
    access4[i2] = Math.round(Math.random());

}
console.log('Ready');
console.log('--------------------------------------');

var t1 = moment();
for (var k1 in places) {
    //console.log(places[k1].status,access1[k1],access2[k1],access3[k1]);
    places[k1].status = places[k1].status || access1[k1] || access2[k1] || access3[k1] || access4[k1];
    //console.log(places[k1].status);
}
var t2 = moment();
var diff = t2.diff(t1);
console.log('--------------------------------------');
console.log(diff);

/**
 * Created by iig on 28.11.2015.
 */
var Test = require('./classes/Test');

var test1 = new Test({name:'test1'});
test1.init({name:'test'}, function (err, res) {
    console.log('test1.init --->');
    console.log(err, res);
});
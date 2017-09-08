/**
 * Created by developer on 18.09.14.
 */
var toFile = require('./../modules/saveToFile').toFile;
var config = require('./../config');
var moment = require('moment');

var nowTime = function(){
    var d = new Date();
    return {
        time: d,
        timestamp:d.getTime()
    };
};



var fileLog = config.root+'node/log/my_log_'+moment().format('DD-MM-YYYY HH_mm_ss');

function write(s) {
    console.log('Записано в файл '+ fileLog +':');
    //console.log(s);
    var d = moment().format('DD.MM.YYYY HH:mm:ss');
    s = d + ' === '+ s+'\n';
    return toFile({fileName: fileLog, data: s, error:true});
}


exports.logF = write;

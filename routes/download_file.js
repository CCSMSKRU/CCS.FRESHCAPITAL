/**
 * Created by iig on 16.02.2016.
 */
var moment = require('moment');
var fs = require('fs');
exports.get = function(req, res, next){
    var filename = req.query.filename;
    var sid = req.user.sid;
    if (!filename || !sid) {
        console.log('Нет доступа к файлу');
        return res.status(403).send('Нет доступа к файлу');
    }
    // Проверим что файл преднозначен для скачивания
    var user_files = global.downloads[sid];
    if (typeof user_files!=='object') {
        console.log('Нет доступа к файлу 2');
        return res.status(403).send('Нет доступа к файлу');
    }
    var t1 = global.downloads[sid][filename];
    delete user_files[filename];
    if (!(t1 instanceof moment)) {
        console.log('Нет доступа к файлу 3');
        return res.status(403).send('Нет доступа к файлу');
    }
    var delta = moment() - t1;
    if (delta>1000) {
        console.log('Нет доступа к файлу 4');
        return res.status(403).send('Нет доступа к файлу');
    }
    console.log('Файл можно скачивать');
    fs.readFile('./files/'+filename,'binary', function (err, file) {
        if (err) {
            console.log('Нет доступа к файлу 5', err);
            return res.status(403).send('Файл не обнаружен.');
        }
        res.writeHead(200);
        res.write(file, "binary");
        res.end();
    });
    //var originaldata = new Buffer(data, 'base64').toString('binary');

};



module.exports = function (io) {

    var dl = require('delivery'),
        fs = require('fs');
    var parsePath = require('parse-filepath');
    var funcs = require('./functions');
    var MyError = require('../error/index').MyError;



    var getFileName = function(filename, cb){
        var params = {};
        if (typeof filename === 'object'){
            params = filename;
            filename = params.filename;
        }
        var fileCounter = params.fileCounter || 0;
        var dirname = parsePath(filename).dirname;
        var file_ext = parsePath(filename).extname;
        var file_name = parsePath(filename).name;
        fs.access(filename, function(err){
            if (err){
                if (err.code !== 'ENOENT') return cb(err);
                var fileObj = parsePath(filename);
                fileObj.filename = filename;
                return cb(null, fileObj);
            }else{
                if (fileCounter > 9) return cb(err);
                filename = dirname + '/' + file_name + funcs.guidShort() + file_ext;
                return getFileName({fileCounter: ++fileCounter, filename: filename}, cb);
            }




        })
    };




    io.sockets.on('connection', function (socket) {
        var delivery = dl.listen(socket);
        delivery.on('delivery.connect',function(delivery){
            //delivery.send({
            //    name: 'sample-image.jpg',
            //    path : 'sample-image.jpg',
            //    params: {foo: 'bar'}
            //});
            delivery.on('send.error',function(error){
                console.log('delivery ERROR', error);
            });
            delivery.on('send.start',function(filePackage){
                console.log(filePackage.name + " is being sent to the client.");
            });
            delivery.on('send.success',function(file){
                console.log('File successfully sent to client!');
            });

            socket.delivery = delivery;
        });
        delivery.on('receive.success', function (file) {
            var params = file.params || {};
            console.log('===================params========>',params);
            var path = './public/upload/';
            if (params.not_public) path = './serverUploads/';
            var fileNameWithPath = path+file.name;

        // });
            getFileName(path+file.name, function(err, fileObj){
                if (err) return socket.emit('save.error', err, file);
                file.nameOrig = file.name;
                file.name = fileObj.name + fileObj.extname;
                file.extname = fileObj.extname;
                file.dirname = fileObj.dirname;
                fs.writeFile(fileObj.filename, file.buffer, function (err) {
                if (err) {
                        console.log('File could not be saved.', err);
                        socket.emit('save.error', err, file);
                } else {
                        socket.emit('save.success', file);
                    console.log('File saved.');
                }
            });

            });

        });
    });
};
// npm install git+https://github.com/liamks/Delivery.js.git

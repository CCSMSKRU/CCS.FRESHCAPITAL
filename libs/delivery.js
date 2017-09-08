module.exports = function (io) {

    var dl = require('delivery'),
        fs = require('fs');


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
            fs.writeFile(path+file.name, file.buffer, function (err) {
                if (err) {
                    console.log('File could not be saved.');
                } else {
                    console.log('File saved.');
                }
            });
        });
    });
};
// npm install git+https://github.com/liamks/Delivery.js.git

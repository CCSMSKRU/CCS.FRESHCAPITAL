//var host = 'http://192.168.1.190';
var host = 'http://ccs.vgfinancing.com/';
//var host = 'https://shop.kassa.uz';

var url = '/site_api';

if (!location.origin.match(/localhost/)) {
    host = location.origin;
}

/*var query = function (obj, callback) {
    if (typeof callback !== "function") callback = function () {
    };
    if (typeof obj !== "object") {
        console.log('Не переданы необходимые параметры', obj);
        return callback({code: -1, type: 'error', message: 'Не переданы необходимые параметры'});
    }
    var request = makeQuery(obj);
    console.log(request);
    $.jsonp({
        type: 'GET',
        url: host + '/cgi-bin/b2e?request=' + request,
        callbackParameter: 'callback',
        dataType: 'jsonp',
        timeout: 10000,
        success: function (res) {
            res = res.results[0];
            if (+res.code) {
                console.log(res.toastr.message);
                return callback({code: -1, type: 'error', message: 'Сервер временно недоступен.'});
            }
            if (res.toastr) {
                console.log(res.toastr.message);
                callback(null,{code: 0, type: 'success', message: 'Сервер временно недоступен.', data: res});
            } else {
                callback(null,{code: 0, type: 'success', message: 'OK', data: res});
            }
        },
        error: function () {
            console.log('Сервер временно недоступен.');
            return callback({code: -1, type: 'error', message: 'Сервер временно недоступен.'});
        }
    });
};*/


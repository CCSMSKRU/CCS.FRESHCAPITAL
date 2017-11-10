var socket;
var fileLoader;
var createGuid = function () {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxxx".replace(/[xy]/g, function (c) {
		var r, v;
		r = Math.random() * 16 | 0;
		v = (c === "x" ? r : r & 0x3 | 0x8);
		return v.toString(16);
	}).toUpperCase();
};


jsonToObj = function (obj) {
    var i, j, result = {},
        convert = function (d, n) {
            for (i in obj[d]) {
                result[i] = {};
                for (j in obj[n]) {
                    result[i][obj[n][j]] = obj[d][i][j];
                }
            }
        };

    if (obj['DATA'] && obj['NAMES']) convert('DATA', 'NAMES');
    else if (obj['data']) {
        if (obj['data_columns']) convert('data', 'data_columns');
        else if (obj['names']) convert('data', 'names');
    } else result = obj;

    return result;
};


var socketQuery = function(obj, callback){
    console.log('socketQuery еще не готова к использованию');
    window.setTimeout(function () {
        socketQuery(obj, callback);
    }, 50);
};

var socketQuery_stack = {
	items: {},
	getItem: function (id) {
		return this.items[id];
	},
	addItem: function (cb, obj) {
		var id = createGuid();
		this.items[id] = {
			callback: cb,
			request: obj
		};

		return id;
	},
	removeItem: function (id) {
		delete this.items[id];
	}
};


console.log('CONNECTING');
socket = io.connect();
var delivery;
socket.on('connect', function (data) {
    console.log('CONNECTED');
    socketQuery = function (obj, callback, type) {
        console.log('INC OBJ', obj);
        if (typeof callback === "function")
            var id = socketQuery_stack.addItem(callback, obj);
        socket.emit('socketQuery', obj, id, type);
    };
    if (!delivery) {
        console.log('new Delivery');
        if(typeof Delivery == "undefined"){
            return;
        }
        delivery = new Delivery(socket);
    }
    // MB.Core.fileLoader = new ImageLoader();
    fileLoader = new ImageLoader();
});

socket.on('disconnect', function (data) {
    console.warn('Соединение с сервером прервано.');
    delete window.delivery;
    socketQuery = function(obj, callback){
        console.log('socketQuery еще не готова к использованию');
        window.setTimeout(function () {
            socketQuery(obj, callback);
        }, 50);
    };
});

socket.on('error', function (data) {
    console.log('Ошибка соединения', data);
    if (data=='handshake unauthorized') {
        console.log('Перейдем на страницу login', location.href);
        //return location.href = '/login.html';
    }
});

socket.on('message', function (obj) {
    if (typeof obj !== "object") return;
    var mode = obj.mode || "normal";
    switch (mode) {
        case "getFile":
            var fileName = obj.fileName;
            var shortName = fileName.substring(fileName.lastIndexOf('/') + 1, fileName.length);
            $("body").prepend('<a id="my_download_link" href="' + obj.fileName + '" download="' + shortName + '" style="display:none;"></a>');
            $("#my_download_link")[0].click();
            $("#my_download_link").remove();
            break;
        default :
            break;
    }
});

socket.on('log', function (data) {
    console.log('---SERVER--LOG--->',data);
});

socket.on('logBody', function (data) {
    var type = 'error';
    var title = '';
    toastr[type](data, title);
});




socket.on('socketQueryCallback', function (callback_id, result, request_time) {
    var item = socketQuery_stack.getItem(callback_id);
    if (typeof item !== "object") return;
    // Не удалять это сравнение, так как typeof null возвращает "object"
    if (typeof result==='object' && result!==null){
        if (result.code !== 10){
            result.time = request_time;
            var t = result.toastr;
            if (typeof toastr=="object" && t && t.message!=='noToastr') toastr[t.type](t.message, t.title);
            if (typeof toastr=="object" && t && t.additionalMessage) toastr['error'](t.additionalMessage, 'ВНИМАНИЕ!');

            if(result.code === -4){
                return document.location.href = '/login.html';
            }
        }
    }else{
        console.log('RESULT:', result);
    }

    if (typeof item.callback === "function") {

        console.log('RESULT BEFORE:', result);

        if(result !== null && typeof result == 'object'){

            if (typeof result.data == 'object' && typeof result.data_columns == 'object'){
                result.data = jsonToObj(result);

            }

        }else{
            var primal_res = result;
            result = {
                code: -888,
                toastr: {
                    type: 'error',
                    title: 'Ошибка',
                    message: 'В ответ пришел null или ответ не является объектом'
                },
                results:[primal_res]
            };
        }


        if(result.code == 10){
            // SERVER EXAMPLE
            //var confirm = obj.confirm;
            //if (!confirm){
            //    return cb(new UserError('needConfirm', {message: 'Это тестовый confirm. Напишите "ВАСЯ"',title:'Подтвердите действие', confirmType:'dialog',responseType:'text'}));
            //}else if (confirm!='ВАСЯ'){
            //    return cb(null, new UserOk('Не верно вверено контрольное значение. Запрос отклонен.',{type:'info'}));
            //}
            //return cb(null, new UserOk('Все ок'));
            // END SERVER EXAMPLE

            item.request.params.confirmKey = result.confirmKey || result.key;
            var cancelMsg = result.cancelMsg || 'Операция отменена';
            var okBtnText = result.okBtnText || 'Подтвердить';
            var cancelBtnText = result.cancelBtnText || 'Отменить';
            switch (result.confirmType){

                case 'dialog' :

                    var html = '';

                    if(result.responseType == 'text'){
                        html = result.toastr.message + '<input style="margin-top: 10px;" type="text" class="form-control" id="server-confirm-input" />';
                    }else{
                        html = result.toastr.message;
                    }



                    bootbox.dialog({
                        title: result.toastr.title,
                        message: html,
                        buttons: {
                            success: {
                                label: okBtnText,
                                callback: function () {

                                    if(result.responseType == 'text'){

                                        item.request.params.confirm = $('#server-confirm-input').val()

                                    }else{
                                        item.request.params.confirm = true;
                                    }

                                    socketQuery(item.request, item.callback);

                                }
                            },
                            error: {
                                label: cancelBtnText,
                                callback: function () {


                                    toastr['info'](cancelMsg);

                                    item.callback(result);

                                }
                            }
                        }
                    });


                    break;

                case 'date':

                    break;

                default :

                    var btnGuid = MB.Core.guid();

                    toastr[result.toastr.type](result.toastr.message + '<div style="width: 100%;"><button id="confirm_socket_query_'+btnGuid+'" type="button" class="btn clear">Подтвердить</button> <button id="cancel_socket_query_'+btnGuid+'" type="button" class="btn clear">Отмена</button></div>','',{
                        "closeButton": false,
                        "debug": false,
                        "newestOnTop": false,
                        "progressBar": false,
                        "positionClass": "toast-bottom-right",
                        "preventDuplicates": false,
                        "onclick": null,
                        "showDuration": "300",
                        "hideDuration": "1000",
                        "timeOut": 0,
                        "extendedTimeOut": 0,
                        "showEasing": "swing",
                        "hideEasing": "linear",
                        "showMethod": "fadeIn",
                        "hideMethod": "fadeOut",
                        "tapToDismiss": false
                    });


                    $('#confirm_socket_query_'+btnGuid).off('click').on('click', function(){
                        item.request.params.confirm = true;
                        window.setTimeout(function(){
                            toastr.clear();
                        }, 1000);

                        socketQuery(item.request, item.callback);
                    });

                    $('#cancel_socket_query_'+btnGuid).off('click').on('click', function(){
                        toastr['info'](cancelMsg);
                        window.setTimeout(function(){
                            toastr.clear();
                        }, 1000);
                        item.callback(result);
                    });


                    break;

            }

            socketQuery_stack.removeItem(callback_id);
            return false;

        }

        item.callback(result);
    }
    socketQuery_stack.removeItem(callback_id);
});

socket.on('socketQueryCallbackError', function (err) {
    console.log(err);
});

socket.on('logout', function () {
    document.location.href = "login.html";
});

toggleLog = function () {
    socket.emit('toggleLog');
};

window.debugMode = false;
debug = function () {
    var bool = window.debugMode = !window.debugMode;
    if (bool) $.cookie('debugMode', bool);
    else $.removeCookie('debugMode');
    return 'debug mode ' + (bool ? 'ON' : 'OFF');
};




/// TEMP
testDownload = function () {
    var o = {
        command:'download',
        object:'File',
        params:{
            id:18
        }
    };
    socketQuery(o, function (res) {
        if (+res.code){
            console.log('Ошибка',res);
            return;
        }
        var filename = res.filename;
        var path = res.path;
        var name = res.name + res.extension;
        var id = 'my_download_link_1';
        var html = '<a id="'+ id +'" download="'+ name +'" style="display:none;" target="_blank" href='+ path + '?filename=' + filename +'>ТЕСТ ССЫЛКИ</a>';
        $('body').append(html);
        var btn = $('#'+id);
        btn.on("click",function (e) {
            $(this).remove();
        });
        btn[0].click();
    });
};
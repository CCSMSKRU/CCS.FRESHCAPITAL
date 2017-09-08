var widgetWrapper = $("#multibooker-widget-wrapper");
var doc_root = widgetWrapper.data('host');
var host = widgetWrapper.data('host');
host2 = host.replace(/\/$/, '');
var protocol = 'http';

var params = location.search;
var frame = (params.match(/frame=/) != null) ? String(params.match(/frame=[a-zA-Z0-9]+/)).replace(/frame=/, '') : 0;
var ip = widgetWrapper.data('ip');
var port = widgetWrapper.data('port') || 8080;
if (!ip.match(/192\./)) port = widgetWrapper.data('port') || 8080;
//var doNotUseSocket = (host.indexOf('shop.mirbileta.ru')!==-1) || false;
var doNotUseSocket = (host.indexOf('shop.mirbileta.ru')!==-1) || widgetWrapper.data('useSocket') || false;

if (doNotUseSocket) console.log('Работа по сокету запрещена параметром.');
var connectionReady = false;
var socketQuery = function(obj, callback){
    console.log('socketQuery еще не готова к использованию');
    window.setTimeout(function () {
        socketQuery(obj, callback);
    }, 50);
};


var createSocketQuery = function () {
    console.log('Для работы виджета используется socket');
    socketQuery = function (obj, callback) {
        if (!connectionReady) {
            window.setTimeout(function () {
                socketQuery(obj, callback);
            }, 50);
            return;
        }
        console.log(obj);
        if (typeof callback === "function")
            var id = socketQuery_stack.addItem(callback);
        console.log('socketQuery...');
        socket.emit('socketQuery', obj, id);
    };
};
var createSocketQueryFuncsUsingJSONP = function () {
    console.log('Для работы виджета используется AJAX');
    socketQuery = function (obj, callback) {
        console.log('socketQueryAjax....');
        $.ajax({
            //url: "https://" + connectPath + '/cgi-bin/b2ejsonp?request=' + makeQuery(obj),
            url: protocol + '://' + ip + '/cgi-bin/b2e?request=' + makeQuery(obj),
            method: 'GET',
            dataType: 'jsonp',
            error: function (err) {
                console.log('Не удалось подключиться к серверу');
                callback('NOT_AVALIBLE');
            },
            success: function (result) {
                result = JSON.stringify(applyDictionary(result));
                callback(result);
                //callback(JSON.stringify(result));
            }
        });
    };
};




var socket;
if (!doNotUseSocket) {
    console.log('Подключаемся....');
    socket = io.connect(protocol + '://' + ip + ':' + port);
    createSocketQuery();
    var socketQuery_stack = {
        items: [],
        getItem: function (id) {
            for (var k in this.items) {
                if (this.items[k].id == id) return this.items[k];
            }
            return false;
        },
        getItemIndex: function (id) {
            for (var k in this.items) {
                if (this.items[k].id == id) return k;
            }
            return false;
        },
        addItem: function (item) {
            this.items.push({
                callback: item,
                id: this.items.length
            });
            return this.items.length - 1;
        },
        clearEmpty: function () {
            for (var i = 0; i < this.items.length; i++) {
                if (this.items[i] === undefined) {
                    this.items.splice(i, 1);
                    this.clearEmpty();
                }
            }
        },
        removeItem: function (id) {

            delete this.items[this.getItemIndex(id)];
            this.clearEmpty();
        }
    };
    socket.on('connect', function (data) {
        connectionReady = true;
        setTimeout(function () {
            console.log('Подписка на disconnect');
            socket.on('disconnect', function (data) {
                connectionReady = false;
                createSocketQueryFuncsUsingJSONP();
            });
        },1500);
    });
    socket.on('socketQueryCallback', function (callback_id, result) {
        var item = socketQuery_stack.getItem(callback_id);
        if (typeof item !== "object") return;
        result = JSON.stringify(applyDictionary(JSON.parse(result)));

        if (typeof item.callback === "function") {
            item.callback(result);
        }
        socketQuery_stack.removeItem(callback_id);
    });
    socket.on('error', function (data) {
        createSocketQueryFuncsUsingJSONP();
    });
    socket.on('log', function (data) {
        return;
        console.log(data);
    });
}else{
    connectionReady = true;
    createSocketQueryFuncsUsingJSONP();
}
var applyDictionary = function (res) {
	var r = res.results[0];
	if (r.extra_data && r.extra_data.DICTIONARIES) {
		var dics = r.extra_data.DICTIONARIES,
			columns = {},
			indexes = {},
			data = r.data,
			t;
		for (var i in dics) {
			t = r.data_columns.indexOf(i);
			if (~t) {
				indexes[i] = t;
				columns[i] = [];
				for (var j in dics[i]) {
					for (var k in dics[i][j]) {
						columns[i].push(k);
						r.data_columns.push(k);
					}
					break;
				}
			}
		}
		var x;
		for (i in columns) {
			for (j in columns[i])
				for (k in data) {
					x = dics[i][data[k][indexes[i]]];
					if (x !== undefined)
						data[k].push(
							x[columns[i][j]]
						); //да простит меня Господь
				}
		}
	}
	return res;
};
makeQuery = function (options, callback) {
	var opt = cloneObj(options);
	var xml = "<query>";
	if (opt && typeof opt === "object" && opt.command) {
		if (opt.hasOwnProperty("params")) {
			for (var key in opt.params) {
				xml += "<" + key + ">" + opt.params[key] + "</" + key + ">";
			}
			delete opt.params;
		}
		for (var key in opt) {
			xml += "<" + key + ">" + opt[key] + "</" + key + ">";
		}
		xml += "</query>";
	}
	return xml;
};
sendQuery = function (options, callback) {

	// console.log("sending");
	var url = "/cgi-bin/b2e", xml = "<query>";
	if (options && typeof options === "object" && options.command) {
		if (options.hasOwnProperty("params")) {
			for (var key in options.params) {
				xml += "<" + key + ">" + options.params[key] + "</" + key + ">";
			}
			delete options.params;
		}
		for (var key in options) {
			xml += "<" + key + ">" + options[key] + "</" + key + ">";
		}
		xml += "</query>";
	}
	$.getJSON(url, {request: xml}, function (res, status, xhr) {
		// console.log(arguments);
		// console.log("gen");
		var ress = {};
		if (res.hasOwnProperty("results")) {
			if (res.results[0].hasOwnProperty("data")) {
				for (var key in res.results[0]) {
					if (key === "data") {
						ress.DATA = res.results[0][key]
					} else if (key === "data_columns") {
						ress.NAMES = res.results[0][key]
					} else if (key === "data_info") {
						ress.INFO = {
							ROWS_COUNT: res.results[0][key].rows_count,
							VIEW_NAME: res.results[0][key].view_name
						};
					} else if (key === "extra_data") {
						for (var key2 in res.results[0][key]) {
							if (key2 === "object_profile") {
								ress.OBJECT_PROFILE = {}
								for (var key3 in res.results[0][key][key2]) {
									if (key3 === "prepare_insert") {
										key4 = key3.toUpperCase();
										ress.OBJECT_PROFILE[key4] = {
											DATA: res.results[0][key][key2][key3].data,
											NAMES: res.results[0][key][key2][key3].data_columns
										};
									} else {
										key4 = key3.toUpperCase();
										ress.OBJECT_PROFILE[key4] = res.results[0][key][key2][key3]
									}
								}
							} else {
								key5 = key2.toUpperCase();
								ress[key5] = res.results[0][key][key2];
							}
						}
					}
				}
			} else {
				for (var key in res.results[0]) {
					var key2 = key.toUpperCase();
					if (key === "toastr") {
						ress["TOAST_TYPE"] = res.results[0][key].type
						ress["MESSAGE"] = res.results[0][key].message
						ress["TITLE"] = res.results[0][key].title
					} else if (key === "code") {
						ress.RC = res.results[0][key]
					} else {
						ress[key2] = res.results[0][key]
					}
				}
			}
		}
		if (ress && status && status === "success" && typeof ress === "object") {
			if (ress.hasOwnProperty("RC")) {
				if (parseInt(ress.RC) === 0) {
					if (ress.TICKET_PACK_USER_INFO) {
						var JSONstring = ress.TICKET_PACK_USER_INFO;
						var userInfo = new userInfoClass({JSONstring: JSONstring}).userInfo_Refresh();
					}
					if (typeof callback == "function") {
						callback(ress);
					}
				} else if (parseInt(ress.RC) === -2) {
					toastr ? toastr[ress.TOAST_TYPE](ress.MESSAGE) : alert("Ваша сессия не актульна, зайдите на сайт пожалуйста заново, MB.Core.sendQuery");
					setTimeout(function () {
						$.removeCookie("sid");
						document.location.href = "login.html";
					}, 3000);
				} else {
					if (typeof callback == "function") {
						callback(ress);
					}
					// toastr ? toastr[res.TOAST_TYPE](res.MESSAGE, res.TITLE) : alert("Ошибка: " + res.RC + ": " + res.MESSAGE + ", MB.Core.sendQuery");
				}
			} else {
				if (typeof callback == "function") {
					callback(ress);
				}
			}
		}
	});
};
jsonToObj = function (obj) {
	var obj_true = {};
	var objIndex = {};
	if (obj['DATA'] != undefined) {
		for (i in obj['DATA']) {
			for (var index in obj['NAMES']) {
				if (obj_true[i] == undefined) {
					obj_true[i] = {};
				}
				obj_true[i][obj['NAMES'][index]] = obj['DATA'][i][index];
			}
		}
	}
	else if (obj['data'] != undefined) {
		for (i in obj['data']) {
			if (obj['names'] != undefined) {
				for (var index in obj['names']) {
					if (obj_true[i] == undefined) {
						obj_true[i] = {};
					}
					obj_true[i][obj['names'][index]] = obj['data'][i][index];
				}
			} else if (obj['data_columns'] != undefined) {
				for (var index in obj['data_columns']) {
					if (obj_true[i] == undefined) {
						obj_true[i] = {};
					}
					obj_true[i][obj['data_columns'][index]] = obj['data'][i][index];
				}
			}

		}
	}

	return obj_true;
};
cloneObj = function (obj) {
	if (obj == null || typeof(obj) != 'object') {
		return obj;
	}
	var temp = {};
	for (var key in obj) {
		temp[key] = cloneObj(obj[key]);
	}
	return temp;
};
clearEmpty = function(arr) {
    if (typeof arr!=='object') return arr;
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] === undefined) {
            arr.splice(i, 1);
            clearEmpty(arr);
        }
    }
};

//	socketParse(res, {
//		done: function(obj){обработка результатов},
//		fail: function(err, obj){обработка ошибок},
//		always: function(){выполняется в любом случае},
//		dontConvert: false
//	});
//
//	или
//
//	socketParse(
// 		res,
//		function (obj) {обработка результатов},
// 		function (err, obj) {обработка ошибок}
//	)

function socketParse(res, obj, err) {

	alert('I HAVE COME TO SOCKETPARSE');

	var error = {title: 'Ошибка', message: ''};
	var parsedRes, resultRes;
    var noToastr = obj.noToastr;
	parsedRes = res;
	//try {
	//	parsedRes = JSON.parse(res);
	//	console.log(parsedRes);
	//} catch (e) {
	//	error.message = 'Не удалось распарсить ответ сервера';
	//	console.log(res);
	//}


	if (parsedRes) { // && parsedRes.results && parsedRes.results[0]



		var r = parsedRes;//.results[0];
		if (!+r.code) { //если код === '0' или undefined
			if (obj && obj.dontConvert) {
				resultRes = parsedRes.results[0];
			} else {
				try {
					resultRes = MB.Core.jsonToObj(r);
				} catch (e) {
					error.message = 'Сервер не вернул ошибки, но нам не удалось задать соответствия между колонками и строками в ответе, возможно объект нестандартный';
					console.log(r);
				}
			}
		} else {
			error.title = r.toastr.title || error.title;
			error.message = r.toastr.message || 'Ошибка сервера № ' + r.code;
			console.log(r);
		}
	}
	if (error.message) {
		if (obj && typeof obj.fail == 'function') {
			obj.fail(error, parsedRes);
		} else if (typeof err == 'function') {
			err(error, parsedRes);
		} else {
			if(toastr && typeof toastr['error'] == 'function' && !noToastr) toastr['error'](error.message, error.title);
			else console.log(error.title, error.message);
		}
	} else if (resultRes) {
		if (typeof obj == 'function') {
			obj(resultRes);
		} else if (obj && typeof obj.done == 'function') {
			obj.done(resultRes);
		} else if (parsedRes.results && parsedRes.results[0] && parsedRes.results[0].toastr) {
			var r = parsedRes.results[0];
			if(toastr && typeof toastr['error'] == 'function' && !noToastr) toastr[r.toastr.type || 'success'](r.toastr.message || '', r.toastr.title || '');
			else console.log(error.title, error.message);
		}
	}

	if (obj && typeof obj.always == 'function') {
		obj.always(resultRes);
	}
	return resultRes;
}
var sendQuery = function (obj, cb) {
    if (typeof obj.params=="object"){
        obj.params = JSON.stringify(obj.params);
    }
    $.ajax({
        url: "login",
        method: "POST",
        data: obj,
        complete: function (res) {
            console.log('complete', res);

        },
        statusCode: {
            200: function (result) {
                console.log('200', result);
                cb(result);
            },
            403: function (result) {
                console.log('403', result);
                cb(result);
            }
        }
    });
};
function loginFormSubmit() {
	var usr = $('#username'),
		pass = $('#password'),
		username = usr.val(),
		password = pass.val();

    var obj = {
        command: "login",
        object: "User",
        params: {
            login: username,
            password: password
        }
    };

	toastr.options = {
		"showDuration": "200",
		"hideDuration": "50000",
		"timeOut": "3000"
	};

	if (!username.length && !password.length) {
		toastr['error']('Введите имя пользователя и пароль!', 'ОШИБКА');
		var logPass = usr.add(pass).addClass('err');
		usr.focus();
		setTimeout(function () {
			logPass.removeClass('err')
		}, 3000);
		return false;
	} else if (!username.length) {
		toastr['error']('Введите имя пользователя!', 'ОШИБКА');
		usr.addClass('err').focus();
		setTimeout(function () {
			usr.removeClass('err')
		}, 3000);
		return false;
	} else if (!password.length) {
		toastr['error']('Введите пароль!', 'ОШИБКА');
		pass.addClass('err').focus();
		setTimeout(function () {
			pass.removeClass('err')
		}, 3000);
		return false;
	}

	socketQuery(obj, function (response) {
		if (response.code === 0) {
            document.location.href = '/';
		}else{
            console.log('AUTH ERROR', response);
        }
	});
}

$(function () {
	$('html').addClass('go');
	$('input').on('keypress', function (e) {
		if (e.keyCode == 13) {
			loginFormSubmit();
		}
	});
	$('.login-submit').on('click', function () {
		loginFormSubmit();
		return false;
	});
	$('#form').on('submit', function () {
		return false;
	});
});
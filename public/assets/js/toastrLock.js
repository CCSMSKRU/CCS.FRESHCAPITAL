//toastrLock({
//	message: message,
//	title: 'ВНИМАНИЕ!',
//	buttons: [
//		{name: 'ОК', class: 'danger', callback: someFunc},
//		{name: 'Запомнить выбор?', class: 'danger', callback: someFunc2},
//		{name: 'Отмена', class: 'primary'}
//	]
//});

(function () {
	window.toastrLock = function (obj) {
		var opts = jQuery.extend({}, toastr.options),
			locker = $('<div class="toastrLocker" style="position: fixed; z-index: 999998; top: 0; left: 0; bottom: 0; right: 0; background: rgba(255, 255, 255, 0.7);"></div>'),
			mess = '<div>' + obj.message + '</div><div>';
		toastr.options.timeOut = 0;
		toastr.options.closeButton = false;
		toastr.options.extendedTimeOut = 0;
		toastr.options.tapToDismiss = false;
		for (var i in obj.buttons) {
			mess += '<button type="button" class="id' + i + ' btn btn-' + obj.buttons[i].class + '" style="margin: 0 10px 10px 0;">' + obj.buttons[i].name + '</button>'
		}
		mess += '</div>';
		locker.appendTo('body');
		var tstr = toastr[obj.type || 'warning'](mess, obj.title);
		tstr.width(340);
		toastr.options = opts;
		for (var i in obj.buttons) {
			tstr.find('.id' + i).off('click').on('click', (function (i) {
				return function () {
					locker.remove();
					toastr.clear(tstr);
					if (typeof obj.buttons[i].callback == 'function') obj.buttons[i].callback(obj.buttons[i].type);
				}
			}(i)));
		}
	};
}());
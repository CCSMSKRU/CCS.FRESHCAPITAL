(function () {
	var modal = $('.mw-wrap').last();
	var formID = modal.attr('id').substr(3);
	var formWrapper = $('#mw-' + formID);

	var o = {
		command: 'get',
		object: 'action'
	};

	socketQuery(o, function (res) {
		res = socketParse(res);

		var mO = {
			actions: []
		};
		for (var i in res) {
			mO.actions.push({
				actionId: res[i]['ACTION_ID'],
				actionName: res[i]['NAME']
			});
		}

		formWrapper.find('.mw-content-inner').html(Mustache.to_html(formWrapper.find('.mw-content-inner').html(), mO));

		var elems = {
			actSelect: formWrapper.find('.action_select'),
			fromDate: formWrapper.find('.dates_begin_date'),
			toDate: formWrapper.find('.dates_end_date'),
			time: formWrapper.find('.time_input'),
			daysweek: formWrapper.find('.daysweek_input'),
			confirm: formWrapper.find('.generateRepertorie'),
			cancel: formWrapper.find('.cancelGenerateRepertorie')
		};

		var actSelInst = elems.actSelect.select3();

		var fromDateInst = elems.fromDate.datepicker({
			format: 'dd.mm.yyyy',
			todayBtn: "linked",
			language: "ru",
			autoclose: true,
			todayHighlight: true
		});

		var toDateInst = elems.toDate.datepicker({
			format: 'dd.mm.yyyy',
			todayBtn: "linked",
			language: "ru",
			autoclose: true,
			todayHighlight: true
		});

		var timeInst = elems.time.clockpicker({
			align: 'left',
			donetext: 'Выбрать',
			autoclose: true,
			afterDone: function () {

			}
		});

		var daysweekInst = elems.daysweek.daysweekpicker();


		elems.confirm.off('click').on('click', function () {

			var o = {
				command: 'operation',
				object: 'generate_repertuar',
				params: {
					action_id: actSelInst.value.id,
					begin_date: fromDateInst.val(),
					end_date: toDateInst.val(),
					time_list: timeInst.val()
				}
			};

			for (var i in daysweekInst.value) {
				var val = daysweekInst.value[i];
				o.params['day' + val] = 'TRUE';
			}

			socketQuery(o, function (res) {
				if (socketParse(res)) {
					var miniFormInstId = MB.Core.mini_form.list.getItem(MB.Core.modalWindows.windows.getWindow(formID).containId).id;
					MB.Core.mini_form.list.removeItem(miniFormInstId);
					MB.Core.modalWindows.windows.removeItem(MB.Core.modalWindows.windows.getWindow(formID));
				}
			});

		});

		elems.cancel.off('click').on('click', function () {
			var miniFormInstId = MB.Core.mini_form.list.getItem(MB.Core.modalWindows.windows.getWindow(formID).containId).id;
			MB.Core.mini_form.list.removeItem(miniFormInstId);
			MB.Core.modalWindows.windows.removeItem(MB.Core.modalWindows.windows.getWindow(formID));
		});

	});

}());

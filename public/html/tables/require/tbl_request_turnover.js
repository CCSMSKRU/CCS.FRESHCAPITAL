(function () {

	var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);

	tableInstance.ct_instance.ctxMenuData = [];

	let months_data = {};
	let months = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];

	let curr_month;

	let render_calendar = (days, curr_month_n, year) => {
		let date = '01 ' + curr_month_n + ' ' + year;
		let days_n = moment(date, 'DD MM YYYY').daysInMonth();
		let weekday = moment(date, 'DD MM YYYY').day();

		let month = [];
		let week = [];

		for (let i = 1; i <= days_n; i++) {
			week.push({
				day_off: days.indexOf(i.toString()) >= 0,
				day: i
			});

			if (weekday == 0) {
				month.push(week);
				week = [];
				weekday = 1;
			} else {
				weekday = weekday == 6 ? weekday = 0 : weekday + 1;
			}
		}
		month.push(week);

		let html = '<div id="month_wrapper">' +
			'<div class="week">' +
			'<div class="weektitle">ПН</div>' +
			'<div class="weektitle">ВТ</div>' +
			'<div class="weektitle">СР</div>' +
			'<div class="weektitle">ЧТ</div>' +
			'<div class="weektitle">ПТ</div>' +
			'<div class="weektitle day_off">СБ</div>' +
			'<div class="weektitle day_off">ВС</div></div>';
		month.forEach(week => {
			html += '<div class="week">';
			week.forEach(weekday => {
				html += '<div class="weekday ' + (weekday.day_off ? 'day_off' : '') + '">' +
					weekday.day + '</div>';
			});
			html += '</div>';
		});
		html += '</div>';

		$('body').find('#month_wrapper').remove();
		$('body').append(html);
	};

	$(document).off('click', '#month_wrapper .weekday').on('click', '#month_wrapper .weekday', (e) => {
		if (curr_month) {
			$(e.currentTarget).toggleClass('day_off');

			let week = [];
			$(e.currentTarget).parents('#month_wrapper').find('.weekday').each((i, v) => {
				if ($(v).hasClass('day_off')) week.push($(v).html());
			});

			months_data[curr_month].days = week;

			let o = {
				command: 'modify',
				object: 'turnover_calendar',
				params: {
					id: months_data[curr_month].id,
					days: week.join(',')
				}
			};

			socketQuery(o);
		}
	});


	tableInstance.ct_instance.customButtons = [
		{
			id: 1,
			buttons: [
				{
					id: 'cb11',
					icon: 'fa-calendar',
					placeholder: 'Календарь',
					callback: function (rowdata) {
						if (rowdata && rowdata.month && months.indexOf(rowdata.month.toLowerCase()) >= 0) {
							curr_month = rowdata.month;

							let curr_month_n = months.indexOf(rowdata.month.toLowerCase()) + 1;

							if (!(curr_month in months_data)) {
								let o = {
									command: 'get',
									object: 'turnover_calendar',
									params: {
										param_where: {
											month: curr_month,
											financing_request_id: rowdata.financing_request_id
										},
										collapseData: false
									}
								};

								socketQuery(o, res => {
									if (res && res[0]) {
										let days = res[0]['days'] ? res[0]['days'].split(',') : [];

										months_data[curr_month] = {
											id: res[0].id,
											days: days
										};

										render_calendar(days, curr_month_n, rowdata.year);
									}
								});
							} else {
								render_calendar(months_data[curr_month].days, curr_month_n, rowdata.year);
							}
						}
					}
				}
			]
		}
	];

}());
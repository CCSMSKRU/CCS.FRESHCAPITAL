(function () {

	var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);

	tableInstance.ct_instance.ctxMenuData = [];

	$('body').find('#month_wrapper').remove();
	$('body').append('<div id="month_wrapper"></div>');

	let months_data = {};
	let months = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];

	let curr_month;

	let render_calendar = (days, curr_month_n, year) => {
		let date = '01 ' + curr_month_n + ' ' + year;
		let days_n = moment(date, 'DD MM YYYY').daysInMonth();
		let weekday = moment(date, 'DD MM YYYY').day();

		let month = [];
		let week = [];

		let day_off = 0;
		let day_on = 0;

		for (let i = 1; i <= days_n; i++) {
			week.push({
				day_off: days.indexOf(i.toString()) >= 0,
				day: i
			});

			if (days.indexOf(i.toString()) >= 0) {
				day_off++;
			} else {
				day_on++;
			}

			if (weekday == 0) {
				month.push(week);
				week = [];
				weekday = 1;
			} else {
				weekday = weekday == 6 ? weekday = 0 : weekday + 1;
			}
		}
		month.push(week);

		let month_title = curr_month[0].toUpperCase() + curr_month.substr(1);

		let html =
			'<div class="title_wrapper">' +
			'<div class="month_title" data-month="' + month_title + '" data-days-n="' + days_n + '">' +
				month_title + ' (раб.: ' + day_on + ', вых.: ' + day_off + ')' +
			'</div>' +
			'<div class="week">' +
			'<div class="weektitle">Пн</div>' +
			'<div class="weektitle">Вт</div>' +
			'<div class="weektitle">Ср</div>' +
			'<div class="weektitle">Чт</div>' +
			'<div class="weektitle">Пт</div>' +
			'<div class="weektitle day_off">Сб</div>' +
			'<div class="weektitle day_off">Вс</div></div></div><div class="content">';
		month.forEach(week => {
			html += '<div class="week">';
			week.forEach(weekday => {
				html += '<div class="weekday ' + (weekday.day_off ? 'day_off' : '') + '">' +
					weekday.day + '</div>';
			});
			html += '</div>';
		});
		html += '</div>';

		let pos = $('.fa.fa-calendar').eq(0).offset();
		$('#month_wrapper').css({
			top: (pos.top - 5) + 'px',
			left: (pos.left + 100) + 'px'
		}).html(html).show();
	};

	$(document).off('click', '#month_wrapper .weekday').on('click', '#month_wrapper .weekday', (e) => {
		if (curr_month) {
			$(e.currentTarget).toggleClass('day_off');

			let days_n = $('#month_wrapper .month_title').attr('data-days-n');

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
					days: week.join(','),
					days_n: days_n - week.length
				}
			};

			socketQuery(o, () => {
				let $month_title = $('#month_wrapper .month_title');
				let month_title = $month_title.attr('data-month');
				let days_n = $month_title.attr('data-days-n');

				$month_title.html(month_title + ' (раб.: ' + (days_n - week.length) + ', вых.: ' + week.length + ')');
			});
		}
	});

	//todo dikii kostil'
	let executing = false;
	$(document).on('mousedown', (e) => {
		if (!executing) {
			executing = true;

			let month_wrapper = $('#month_wrapper');
			if (!month_wrapper.is(e.target) && month_wrapper.has(e.target).length === 0 && month_wrapper.is(":visible")) {
				month_wrapper.hide();

				for(let i = MB.Tables.tables.length - 1; i >= 0; i--){
					let t = MB.Tables.tables[i];
					if(t.client_object == 'tbl_request_turnover'){
						t.reload();
						break;
					}
				}
			}

			executing = false;
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
						console.log(rowdata);
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
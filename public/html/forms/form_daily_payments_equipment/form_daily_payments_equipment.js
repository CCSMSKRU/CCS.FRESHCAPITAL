(function () {

    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_daily_payments_equipment', formID);
    var formWrapper = $('#mw-' + formInstance.id);

    setTimeout(() => {
	    var tbl = formInstance.tblInstances[0];

	    let banks_ids = [];
	    let banks = [];

	    let sum = 0;

	    for (let i = 0; i < tbl.data.extra_data.count; i++) {
	    	let row = tbl.data.data[i];

	    	let money = +row.import_amount > 0 ? +row.import_amount : +row.paid_amount;

		    if (+row.bank_id > 0 && banks_ids.indexOf(row.bank_id) === -1) {
			    banks_ids.push(row.bank_id);
			    banks.push({
				    id: row.bank_id,
				    name: row.bank,
				    money: money
			    })
		    } else {
		    	banks[banks_ids.indexOf(row.bank_id)].money += money;
		    }

		    sum += money;
	    }

	    $('#custom_tables').html('');
	    $('.custom_tabs_title .tabToggle:not(:first-child)').remove();
	    $('.summary').html('');

	    $('.summary').append(`<div class="fn-field"><label>Итого приход:</label> <span class="iih-field fn-summ-readonly-field" data-column="total_paid_amount">` + sum + `</span> руб.</div>`);

	    async.eachSeries(banks, (bank, cb) => {
		    $('#custom_tables').append(`<div class="bank_` + bank.id + ` sc_tabulatorDDItem" dataitem="` + bank.id + `"></div>`);

		    // Для каждой вкладке банка, по клику дергаем вот это:
		    var childTbl = new MB.TableN({
		    	id: MB.Core.guid(),
		    	class: 'daily_payment',
		    	client_object: 'tbl_daily_payment_equipment',
		    	parentObject: formInstance,
		    	externalWhere: {
		    		key: 'bank_id',
		    		comparisonType: "and",
		    		type: "=",
		    		val1: bank.id,
		    		val2: ""
		    	},
		    	parent_id: formInstance.activeId
		    });
		    childTbl.create($('#custom_tables .bank_' + bank.id), function (tblInstance) {
		    	formInstance.tblInstances.push(tblInstance);

		    	cb();
		    });


		    $('.custom_tabs_title').append(`<div class="tabToggle sc_tabulatorToggler" dataitem="` + bank.id + `"><span class="childObjectTabTitle">` + bank.name + `</span></div>`);
		    $('.summary').append(`<div class="fn-field"><label>Итого ` + bank.name + `:</label> <span class="iih-field fn-summ-readonly-field" data-column="total_paid_amount">` + bank.money + `</span> руб.</div>`);
	    }, () => {
		    $('.custom_tabs').find('.opened').removeClass('opened');
		    $('.custom_tabs').find('.tabToggle[dataitem="0"]').addClass('opened');
		    $('.custom_tabs').find('.tabulatorDDItem[dataitem="0"]').show();
		    $('.custom_tabs').find('.ct-environment-wrapper').remove();
	    });
    }, 1000);

    $(document).off('click', '.custom_tabs_title .tabToggle').on('click', '.custom_tabs_title .tabToggle', e => {
    	let id = $(e.currentTarget).attr('dataitem');

	    $('#custom_tables .sc_tabulatorDDItem').hide();
	    $('#custom_tables .sc_tabulatorDDItem[dataitem="' + id + '"]').show();
    });


    formWrapper.find('.mw-save-form').remove();

    formWrapper.find('.execute-daily-payments').off('click').on('click', function () {

        var o = {
            command: 'apply',
            object: 'daily_payments',
            params:{
                id: formInstance.activeId
            }
        };

        formInstance.loader(true, 'Подождите, применяем платежи, это может занять до нескольких минут.');

        socketQuery(o, function (res) {

            formInstance.loader(false, 'Подождите, применяем платежи');

            if(res.code){
                console.log('ERR', res);
                return false;
            }

            formInstance.reload();

        });

    });

    formWrapper.find('.append_new').off('click').on('click', function () {
        bootbox.dialog({
            title: 'Обновить платежный день.',
            message: 'ВНИМАНИЕ! Этот процесс может занять несколько минут.',
            buttons: {
                success: {
                    label: 'Начать!',
                    callback: function () {
                        let o = {
                            command:'append_new',
                            object:'daily_payments',
                            params:{
                                id:formInstance.activeId
                            }
                        };
                        socketQuery(o, function(r){
                            console.log(r);
                        });
                    }
                },
                error: {
                    label: 'Отмена',
                    callback: function () {

                    }
                }

            }
        });




    });

    formWrapper.find('.import-vtb').off('click').on('click', function () {
        var file_list = [];
        // var date_ = String(formInstance.data.data[0].payments_for_date).replace(/\./ig,'');
        var date_ = '';
        bootbox.dialog({
            title: 'Укажите дату(ы) без точек и пробелов.',
            message: 'Если надо указать несколько дат, укажите их через запятую.<br>Например: 01012017,02012017<br><input id="date_vtb" type="text" value="' + date_ +'"/>',
            buttons: {
                success: {
                    label: 'Начать!',
                    callback: function () {

                        var date_vtb = $('#date_vtb').val();
                        let fileL = new ImageLoader({
                            success:function(file){
                                file_list.push(file.name);
                                if (!this.InProcessCounter){
                                    var o = {
                                        command: 'import_vtb',
                                        object: 'daily_payments',
                                        params:{
                                            id: formInstance.activeId,
                                            dates:date_vtb,
                                            file_list:file_list
                                        }
                                    };

                                    formInstance.loader(true, 'Подождите, идет импорт из файлов полученных от банка.');

                                    socketQuery(o, function (res) {

                                        formInstance.loader(false, '');

                                        if(res.code){
                                            console.log('ERR', res);
                                            return false;
                                        }

                                        formInstance.reload();

                                    });
                                }

                            }
                        });

                        fileL.start();

                    }
                },
                error: {
                    label: 'Отмена',
                    callback: function () {

                    }
                }

            }
        });




    });

    formWrapper.find('.apply-import-vtb').off('click').on('click', function () {

        var o = {
            command: 'import_vtb_apply',
            object: 'daily_payments',
            params:{
                id: formInstance.activeId
            }
        };

        formInstance.loader(true, 'Подождите, проставляем платежи из импорта.');

        socketQuery(o, function (res) {

            formInstance.loader(false, '');

            if(res.code){
                console.log('ERR', res);
                return false;
            }

            formInstance.reload();

        });

    });





}());
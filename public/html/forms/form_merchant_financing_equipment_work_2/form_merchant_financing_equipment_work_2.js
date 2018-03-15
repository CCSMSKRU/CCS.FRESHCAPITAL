(function () {

    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_merchant_financing_equipment_work_2', formID);
    var formWrapper = $('#mw-' + formInstance.id);

    var modalInstance = MB.Core.modalWindows.windows.getWindow(formID);
    modalInstance.stick = 'top';
    modalInstance.stickModal();


    //'ACQUIRING_IN_PROCCESS', 'READY_TO_WORK', 'CLOSED', 'WAIT_BANK_CONFIRM', 'BANK_CONFIRM', 'WAIT_INVESTOR'

    formInstance.lowerButtons = [
        {
            title: 'В диплоймент',
            color: 'blue',
            icon: "fa-users",
            type: "SINGLE",
            hidden: false,
            condition: [
                {
                    colNames: ['status_sysname'],
                    matching: ['equal'],
                    colValues: ['READY_TO_WORK']
                },
                {
                    colNames: ['status_sysname'],
                    matching: ['equal'],
                    colValues: ['ACQUIRING_IN_PROCCESS']
                },
	            {
		            colNames: ['status_sysname'],
		            matching: ['equal'],
		            colValues: ['WAIT_INVESTORS']
	            },
	            {
		            colNames: ['status_sysname'],
		            matching: ['equal'],
		            colValues: ['SETTING_UP_EQUIPMENT']
	            }
            ],
            handler: function () {


                var mer_o = {
                    command: 'get',
                    object: 'merchant',
                    params: {
                        param_where: {
                            id: formInstance.data.data[0].merchant_id
                        }
                    }
                };

                socketQuery(mer_o, function (res) {

                    var merchant = res.data[0];

                    var tpl = '' +
                        '<div class="form-group"><label>Номер договора:</label><input class="form-control" type="text" id="agr_number" value="{{agr_number}}"></div>'+
                        '<div class="form-group"><label>Дата договора (ДД.ММ.ГГГГ):</label><input class="form-control" type="text" id="agr_date" value="{{agr_date}}"></div>'+
                        '<div class="form-group"><label>Дата начала платежей:</label><input class="form-control" type="text" id="payments_start_date" value="{{payments_start_date}}"></div>';

                    var mo = {
                        agr_number: merchant.through_number || '-А/201'+moment().format('YYYY').substr(3),
                        agr_date: '',
                        payments_start_date: merchant.payments_start_date
                    };

                    tpl = Mustache.to_html(tpl,mo);

                    bootbox.dialog({
                        title: 'Перевести в работу',
                        message: tpl,
                        buttons: {
                            success: {
                                label: 'Подтвердить',
                                callback: function () {

                                    var o = {
                                        command: 'financing_to_deployment',
                                        object: 'merchant_financing',
                                        params: {
                                            id: formInstance.data.data[0].id,
                                            agr_number:         $('#agr_number').val(),
                                            agr_date:           $('#agr_date').val(),
                                            payments_start_date:           $('#payments_start_date').val()
                                        }
                                    };

                                    socketQuery(o, function (res) {

                                        console.log(res);

                                        formInstance.reload();

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

                    $('#agr_date').datepicker({
                        autoclose: true,
                        todayHighlight: true,
                        //minuteStep: 10,
                        keyboardNavigation: false,
                        todayBtn: true,
                        firstDay: 1,
                        format: 'dd.mm.yyyy',
                        weekStart: 1,
                        language: "ru"
                    });

                    $('#payments_start_date').datepicker({
                        autoclose: true,
                        todayHighlight: true,
                        //minuteStep: 10,
                        keyboardNavigation: false,
                        todayBtn: true,
                        firstDay: 1,
                        format: 'dd.mm.yyyy',
                        weekStart: 1,
                        language: "ru"
                    });


                });


            }
        },
	    {
		    title: 'Настройка оборудования',
		    color: 'green',
		    icon: "fa-check",
		    type: "SINGLE",
		    hidden: false,
		    condition: [{
			    colNames: ['status_sysname'],
			    matching: ['not_equal'],
			    colValues: ['READY_TO_WORK']
		    }],
		    handler: function () {

			    var msg = '<div class="form-group"><label>Перевод финансирования в промежуточный статус "Настройка оборудования". ' +
                    'Финансирование будет автоматически переведено в работу при первом поступлении средств от торговца.</label></div>';

			    msg = '<div class="form-group"><label>Укажите дату начала списаний:</label><input class="form-control p-s-date" type="text" value="{{date}}"/></div>';
			    var mo = {
				    date: formInstance.data.data[0].payments_start_date
			    };

			    bootbox.dialog({
				    title: 'Подтверждение',
				    message: Mustache.to_html(msg, mo),
				    buttons: {
					    success: {
						    label: 'Подтвердить',//
						    callback: function () {

							    var fin_o = {
								    command: 'ready_to_work_to_setting_up',
								    object: 'merchant_financing',
								    params: {
									    payments_start_date: $('.p-s-date').val(),
									    id: formInstance.data.data[0].id
								    }
							    };

							    formInstance.loader(true, 'Переводим финансирование в статус "Настройка оборудования", пожалуйста пододжите.');

							    socketQuery(fin_o, function (res) {

								    formInstance.loader(false, 'Переводим финансирование в статус "Настройка оборудования", пожалуйста пододжите.');

								    console.log(res);

								    formInstance.reload();

							    });

						    }
					    }
				    }
			    });

			    $('.p-s-date').datepicker({
				    autoclose: true,
				    todayHighlight: true,
				    //minuteStep: 10,
				    keyboardNavigation: false,
				    todayBtn: true,
				    firstDay: 1,
				    format: 'dd.mm.yyyy',
				    weekStart: 1,
				    language: "ru"
			    });
		    }
	    },
	    {
		    title: 'Вернуть в настройку',
		    color: 'green',
		    icon: "fa-check",
		    type: "SINGLE",
		    hidden: false,
		    condition: [{
			    colNames: ['status_sysname'],
			    matching: ['not_equal'],
			    colValues: ['ACQUIRING_IN_PROCCESS']
		    }],
		    handler: function () {

			    var msg = '<div class="form-group">Уверены?</div>';

			    bootbox.dialog({
				    title: 'Подтверждение',
				    message: msg,
				    buttons: {
					    success: {
						    label: 'Подтвердить',
						    callback: function () {

							    var fin_o = {
								    command: 'work_to_setting_up',
								    object: 'merchant_financing',
								    params: {
									    id: formInstance.data.data[0].id
								    }
							    };

							    formInstance.loader(true, 'Переводим финансирование в статус "Настройка оборудования", пожалуйста пододжите.');

							    socketQuery(fin_o, function (res) {

								    formInstance.loader(true, 'Переводим финансирование в статус "Настройка оборудования", пожалуйста пододжите.');

								    console.log(res);

								    formInstance.reload();

							    });

						    }
					    },
					    error: {
						    label: 'Отменить'
					    }
				    }
			    });
		    }
	    },
        {
            title: (formInstance.data.data[0].closed_by_financing_id == '')? 'Подготовить рефинансирование':'Открыть рефинансирование',
            color: 'black',
            icon: "fa-refresh",
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: ['status_sysname','status_sysname'],
                matching: ['not_equal','not_equal'],
                colValues: ['IN_WORK','ACQUIRING_IN_PROCCESS']
            }],
            handler: function () {
                var data = formInstance.data.data[0];
                var refinFormId = MB.Core.guid();

                var add_o = {
                    command: 'prepareRefinancing',
                    object: 'merchant_financing',
                    params: {
                        id: data.id
                    }
                };

                function runFinancingCreation(){

                    formInstance.loader(true, 'Подождите, создаем рефинансирование.');

                    socketQuery(add_o, function(res){

                        if(!res.code){


                            var id = res.id;

                            var openInModalO = {
                                id: refinFormId,
                                name: 'form_merchant_refinancing',
                                class: 'merchant_financing',
                                client_object: 'form_merchant_refinancing',
                                type: 'form',
                                ids: [id],
                                position: 'center',
                                tablePKeys: {data_columns: ['id'], data: [id]}
                            };

                            var form = new MB.FormN(openInModalO);
                            form.create(function () {
                                var modal = MB.Core.modalWindows.windows.getWindow(refinFormId);
                                formInstance.loader(false, 'Подождите, создаем рефинансирование.');
                                formInstance.reload();
                            });


                        }else{

                            formInstance.loader(false, 'Подождите, создаем рефинансирование.');

                        }

                    });

                }

                if(formInstance.data.data[0].closed_by_financing_id == ''){

                    bootbox.dialog({
                        title: 'Выберите тип финансирования',
                        message: 'Фиксированный платеж или процент с ежедневного процессингового оборота?',
                        buttons: {
                            percent: {
                                label: 'Процент с оборота',
                                className: 'vg-modal-btn vg-modal-btn-blue',
                                callback: function(){
                                    add_o.params.financing_type_sysname = 'PERCENT';
                                    runFinancingCreation();
                                }
                            },
                            fixed: {
                                label: 'Фиксированный платеж',
                                className: 'vg-modal-btn vg-modal-btn-blue',
                                callback: function(){

                                    add_o.params.financing_type_sysname = 'FIXED';

                                    runFinancingCreation();

                                }
                            },
                            error: {
                                label: 'Отмена',
                                className: '',
                                callback: function(){

                                }
                            }
                        }
                    });


                }else{

                    var o2 = {
                        command: 'get',
                        object: 'merchant_financing',
                        params:{
                            id: formInstance.data.data[0].closed_by_financing_id
                            //param_where: {
                            //    id: formInstance.data.data[0].closed_by_financing_id
                            //}
                        }
                    };

                    socketQuery(o2, function(res){

                        if(!res.code){

                            var formName = (res.data[0].status_sysname == 'READY_TO_WORK' ||
	                            res.data[0].status_sysname == 'SETTING_UP_EQUIPMENT' ||
	                            res.data[0].status_sysname == 'ACQUIRING_IN_PROCCESS' ||
	                            res.data[0].status_sysname == 'CLOSED')? 'form_merchant_financing_work' : 'form_merchant_refinancing';

                            var openInModalO = {
                                id: refinFormId,
                                name: formName,
                                class: 'merchant_financing',
                                client_object: formName,
                                type: 'form',
                                ids: [formInstance.data.data[0].closed_by_financing_id],
                                position: 'center',
                                tablePKeys: {data_columns: ['id'], data: [formInstance.data.data[0].closed_by_financing_id]}
                            };

                            var form = new MB.FormN(openInModalO);
                            form.create(function () {
                                var modal = MB.Core.modalWindows.windows.getWindow(refinFormId);
                                formInstance.loader(false, 'Подождите, создаем рефинансирование.');
                                formInstance.reload();
                            });


                        }else{

                            formInstance.loader(false, 'Подождите, создаем рефинансирование.');

                        }



                    });



                }

            }
        },
        {
            title: 'Закрыть финансирование',
            color: 'red',
            icon: "fa-times",
            type: "SINGLE",
            hidden: false,
            condition: [{
                colNames: ['status_sysname','status_sysname'],
                matching: ['not_equal','not_equal'],
                colValues: ['IN_WORK','ACQUIRING_IN_PROCCESS']
            }],
            handler: function () {

                formInstance.loader(true, 'Подождите, идет процесс закрытия, это может занять некоторое время...<br/>');

                var data = formInstance.data.data[0];
                var html = '<select data-withempty="false" id="select-closing-type">';
                var selinstance;

                var o = {
                    command: 'get',
                    object: 'financing_close_type',
                    params: {

                    }
                };

                socketQuery(o, function(r){

                    if(!r.code){
                        for(var i in r.data){
                            var b = r.data[i];
                            var bid = b.id;
                            var bname = b.name;

                            html += '<option value="'+bid+'">'+bname+'</option>';

                        }

                        html += '</select>';

                        bootbox.dialog({
                            title: 'Выберите тип закрытия финансирования',
                            message: html,
                            buttons: {
                                success: {
                                    label: 'Подтвержить',
                                    callback: function () {

                                        var close_type_id = selinstance.value.id;

                                        var o = {
                                            command: 'closeFinancing',
                                            object: formInstance.class,
                                            client_object: formInstance.client_object,
                                            params: {
                                                id: data.id,
                                                closing_type_id: close_type_id
                                            }
                                        };

                                        socketQuery(o, function (res) {

                                            formInstance.reload();
                                            formInstance.loader(false, 'Подождите, идет процесс закрытия, это может занять некоторое время...<br/>');

                                        });


                                        socket.off('closeFinancing_'+data.id).on('closeFinancing_'+data.id,function(data){

                                            var html = 'Подождите, идет процесс закрытия, это может занять некоторое время...<br/>Выполнение: '+data.percent+'%';

                                            $('.form-loader-text').html(html);

                                        });

                                    }
                                },
                                error: {
                                    label: 'Отмена',
                                    callback: function () {
                                        formInstance.loader(false, 'Подождите, идет процесс закрытия, это может занять некоторое время...<br/>');
                                    }
                                }
                            }
                        });

                        selinstance = $('#select-closing-type').select3();

                    }


                });


            }
        }
    ];




}());

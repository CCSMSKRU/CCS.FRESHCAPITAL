(function () {

    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_daily_payments', formID);
    var formWrapper = $('#mw-' + formInstance.id);


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
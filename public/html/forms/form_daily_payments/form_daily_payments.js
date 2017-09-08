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






}());
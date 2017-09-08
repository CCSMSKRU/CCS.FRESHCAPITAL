
(function () {

    var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);

    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option1',
            title: 'Открыть в форме',
            disabled: function () {
                return false;
            },
            callback: function () {
                tableInstance.openRowInModal();
            }
        }
    ];

    var beforeBtn = tableInstance.wrapper.find('.ct-environment-buttons');
    var btnHtml = '<li class="ct-environment-btn create-payments-day"><div class="nb btn btnDouble blue"><i class="fa fa-plus"></i><div class="btnDoubleInner">Создать платежный день</div></div></li>';
    beforeBtn.html(btnHtml);



    $('.create-payments-day').off('click').on('click', function(){

        var o = {
            command: 'create_new',
            object: 'daily_payments'
        };

        socketQuery(o, function (res) {

            if(res.code){
                console.log('ERR', res);
                return false;
            }

            tableInstance.reload();

        });


    });

}());





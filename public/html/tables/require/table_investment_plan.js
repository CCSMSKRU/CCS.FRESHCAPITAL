(function () {

    var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);

    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option1',
            title: 'Открыть в форме',
            disabled: function(){
                return false;
            },
            callback: function(){
                tableInstance.openRowInModal();
            }
        }
    ];

    var beforeBtn = tableInstance.wrapper.find('.ct-environment-buttons');
    var btnHtml = '<li class="ct-environment-btn open_plan"><div class="nb btn btnDouble blue"><i class="fa fa-th"></i><div class="btnDoubleInner">Открыть активный план</div></div></li>';
    beforeBtn.html(btnHtml);

    $('.open_plan').off('click').on('click', function(){

        var o = {
            command: 'getActive',
            object: 'investment_plan'
        };

        socketQuery(o, function(r){

            if(r.code){return;}

            console.log(r);


            var formId = MB.Core.guid();

            var tablePKeys = {data_columns: ['id'], data: [r.plan.id]};

            var openInModalO = {
                id: formId,
                name: 'form_investment_plan',
                class: 'investment_plan',
                client_object: 'form_investment_plan',
                type: 'form',
                ids: [r.plan.id],
                position: 'center',
                tablePKeys: tablePKeys
            };

            var form = new MB.FormN(openInModalO);
            form.create(function () {
                var modal = MB.Core.modalWindows.windows.getWindow(formId);
                $(modal).on('close', function () {
                    tableInstance.reload();
                });

                $(form).on('update', function () {
                    tableInstance.reload();
                });

                if(typeof cb == 'function'){
                    cb();
                }

            });


        });




    });

}());

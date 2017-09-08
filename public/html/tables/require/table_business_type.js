(function () {

    //var tableNId = $('.page-content-wrapper .classicTableWrap').data('id');
    //var tableInstance = MB.Tables.getTable(tableNId);
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
        },
        {
            name: 'option2',
            title: 'Обновить все анкеты',
            disabled: function(){
                return false;
            },
            callback: function(){
                //tableInstance.openRowInModal();
            }
        }
    ];



}());

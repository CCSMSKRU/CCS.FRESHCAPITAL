(function(){
    var tableNId = $('.page-content-wrapper .classicTableWrap').data('id');
    var tableInstance = MB.Tables.getTable(tableNId);

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
            title: 'Создать дубликат шаблона',
            disabled: function(){
                return false;
            },
            callback: function(){
                tableInstance.makeOperation('copy_web_ticket_template', function(){

                });
            }
        }
    ];
}());



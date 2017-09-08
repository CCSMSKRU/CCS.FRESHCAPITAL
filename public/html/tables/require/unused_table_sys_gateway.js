(function() {

    var tableNId = $('.page-content-wrapper .classicTableWrap').data('id');
    var tableInstance = MB.Tables.getTable(tableNId);
    tableInstance.ct_instance.ctxMenuData = [
        {
            name: 'option2',
            title: 'Открыть в форме',
            disabled: function () {
                return false;
            },
            callback: function () {
                tableInstance.openRowInModal();
            }
        },
        {
            name: 'option1',
            title: 'Загрузить мерприятия из шлюза',
            disabled: function () {
                var sel = tableInstance.ct_instance.selectedRowIndex;
                var gateway = tableInstance.data.data[sel]['GATEWAY_ID'];
                return gateway != '5' && gateway != '41'
            },
            callback: function () {
                var sel = tableInstance.ct_instance.selectedRowIndex;
                var gateway = tableInstance.data.data[sel]['GATEWAY_ID'];
                console.log("loading from", (gateway == 5 ? "ponominalu.ru" : "crocus"));

                MB.Core.spinner.start($(".page-content-wrapper"));
                tableInstance.ct_instance.wrapper.find('.ct-fader').css({
                    opacity: 0.7,
                    display: 'block'
                });

                DOQuery({command: "LOAD_EVENTS", gateway: gateway }, function(obj){
                    for(var i in obj) {
                        toastr[i](obj[i]);
                    }
                    MB.Core.spinner.stop(tableInstance.ct_instance.wrapper);
                    tableInstance.ct_instance.wrapper.find('.ct-fader').css({
                        opacity: 0,
                        display: 'none'
                    });
                });
            }
        }
    ];
}());
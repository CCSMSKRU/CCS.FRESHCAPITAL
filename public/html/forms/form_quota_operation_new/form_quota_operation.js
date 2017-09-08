(function(){

    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_quota_operation', formID);
    var modalInstance = MB.Core.modalWindows.windows.getWindow(formID);
    var formWrapper = $('#mw-'+formInstance.id);
    var tableID = formWrapper.find('.classicTableWrap').attr('data-id');
    var tableInstance = MB.Tables.getTable(tableID);

    var tableWrapper = $('.classicTableWrap-'+tableInstance.id);
    var status = formInstance.data.data[0]['STATUS'];

    var buttons = {
        items: [
            {
                className: 'confirm_quote_operation',
                disabled: function(){
                    return status != 'LOADED';
                },
                callback: function(){
                    formInstance.makeOperation('apply_quota_operation', function(){

                    });
                }
            }
        ],
        init: function(){
            for(var i in buttons.items){
                var btn = buttons.items[i];
                var elem = formWrapper.find('.'+btn.className);
                var disabledClass = (btn.disabled())? 'disabled': '';
                elem.removeClass('disabled').addClass(disabledClass);
                elem.off('click').on('click', function(){
                    if($(this).hasClass('disabled')){return;}
                    for(var k in buttons.items){
                        var cbBtn = buttons.items[k];
                        if($(this).attr('class').indexOf(cbBtn.className) != -1){
                            cbBtn.callback();
                        }
                    }
                });
            }
        }
    };
    buttons.init();
}());
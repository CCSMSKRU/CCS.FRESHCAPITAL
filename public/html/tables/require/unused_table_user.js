(function () {

    var tableNId = $('.page-content-wrapper .classicTableWrap').data('id');
    var tableInstance = MB.Tables.getTable(tableNId);

    var totalAmount = 0;
    for(var i in tableInstance.data.data){
        var item = tableInstance.data.data[i];
        var price = item['CASH_AMOUNT'];
        totalAmount += +price;
    }

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
            title: 'Отправить пользователям',
            disabled: function(){
                return false;
            },
            callback: function(){
                var logins = [];
                var selection = tableInstance.ct_instance.getIndexesByData();
                for (var i in selection) {
                    var login = tableInstance.data.data[selection[i]]['LOGIN'];
                    logins.push(login);
                }
/*
                var activeId = tableInstance.data.DATA[row][tableInstance.data.NAMES.indexOf(tableInstance.profile['OBJECT_PROFILE']['PRIMARY_KEY'].split(',')[0])];
                var logins = tableInstance.data.DATA[row][tableInstance.data.NAMES.indexOf('LOGIN')];*/
                bootbox.prompt("Введите сообщение:", function(result) {
                    if (result != null) {
                        sendToAll({message:result,users:logins});
                    }
                });
                /*var msg = prompt('Введите сообщение:');
                if (msg==''){
                    return;
                }
                sendToAll({message:msg,users:logins});*/
            }
        },
        {
            name: 'option3',
            title: 'Отправить всем пользователям',
            disabled: function(){
                return false;
            },
            callback: function(){
                bootbox.prompt("Введите сообщение:", function(result) {
                    if (result !== null) {
                        sendToAll({message:result});
                    }
                });
               /* var msg = prompt('Введите сообщение:');
                if (msg==''){
                    return;
                }
                sendToAll({message:msg});*/
            }
        },
        {
            name: 'option4',
            title: 'Доступ к участкам',
            disabled: function(){
                return false;
            },
            callback: function(){
                var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];
                var user_id = row['USER_ID'];
                MB.Core.switchModal({
                    type: "form",
                    name: "form_user_allowed_contract",
                    isNewModal: true,
                    ids: [user_id],
                    params: {
                        user_id: user_id,
                        label: 'Доступ пользователей к участкам'
                    }
                });
            }
        },
        {
            name: 'option5',
            title: 'Сбросить счетчик количества введенных неверных паролей',
            disabled: function(){
                return false;
            },
            callback: function(){
                var row = tableInstance.data.data[tableInstance.ct_instance.selectedRowIndex];
                var user_id = row['USER_ID'];
                socketQuery({
                    command: 'operation',
                    object: 'clear_count_invalid_passwords',
                    params: {
                        user_id: user_id
                    }
                }, function(res){
                    socketParse(res);
                });
            }
        }
    ];

}());



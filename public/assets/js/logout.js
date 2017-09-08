function logout (e, el) {
    if (e.ctrlKey){
        var html =
            '<p>Внимание! На всех устройствах, где Вы сейчас авторизированы, возможно продолжение работы несмотря на смену пароля. Рекомендуем после смены, выйти из системы и авторизироваться заново.</p>' +
            '<p>Выход из системы произойдет на всех устройствах, где Вы авторизированы.</p>' +
            '<div class="form-group">' +
            '<label for="pwd">Укажите Ваш текущий пароль:</label>' +
            '<input type="password" class="form-control" id="old_psw">' +
            '</div>' +
            '<div class="form-group">' +
            '<label for="pwd">Укажите новый пароль:</label>' +
            '<input type="password" class="form-control" id="new_psw1">' +
            '</div>' +
            '<div class="form-group">' +
            '<label for="pwd">Повторите новый пароль:</label>' +
            '<input type="password" class="form-control" id="new_psw2">' +
            '</div>';
        var dialog = bootbox.dialog({
            title: 'Изменение пароля',
            message: html,
            buttons: {
                toggleLog: {
                    label: 'Вкл/Выкл лог',
                    closeButton:true,
                    callback: function(){

                        var o = {
                            command:'toggleConsoleLog',
                            object:'User',
                            params:{
                            }
                        };
                        socketQuery(o, function(r){
                            // console.log(r);
                        });
                    }
                },
                success: {
                    label: 'Установить новый пароль.',
                    closeButton:false,
                    callback: function(){
                        var old_psw = $('#old_psw').val();
                        var new_psw1 = $('#new_psw1').val();
                        var new_psw2 = $('#new_psw2').val();
                        if (!old_psw || !new_psw1){
                            return toastr.error('Заполните все поля.');
                        }
                        if (new_psw1 !== new_psw2){
                            return toastr.error('Пароли не совпадают.');
                        }
                        var o = {
                            command: 'changePassword',
                            object: 'User',
                            params:{
                                password:old_psw,
                                new_password:new_psw1
                            }
                        };

                        socketQuery(o, function(res){
                            console.log(res);
                        });
                    }
                },
                cancel: {
                    label: 'Отмена',
                    callback: function(){

                    }
                }
            }
        });
    }else{
        var o = {
            command: 'logout',
            object: 'User'
        };

        socketQuery(o, function(res){
            document.location.href = "login.html";
        });
    }
}
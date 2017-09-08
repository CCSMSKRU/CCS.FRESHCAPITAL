(function(){
    var modal = $('.mw-wrap').last();
    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_user', formID);
    var formWrapper = $('#mw-'+formInstance.id);

    var id = formInstance.activeId;

    var formTrain = formWrapper.find('.fn-train-overflow').fn_train();
    var addUsers = formWrapper.find('.form-role-add-users');
    var usersLoaded = false;

    function removeSpaces(str){
        if(typeof str == 'string'){
            return str.replace(/\s+/g, '');
        }else{
            return str;
        }
    }

    var uc = {
        allUsers: undefined,
        allRoles: undefined,
        lb: undefined,
        rb: undefined,
        isLoaded: false,
        getData: function(callback){

            uc.mergedRoles = {
                fromRoles: [],
                toRoles: []
            };

            socketQuery({
                command: "get",
                object: "role"
            }, function(res){
                uc.allRoles = socketParse(res);

                if(id == 'new'){
                    for(var k in uc.allRoles){
                        var role = uc.allRoles[k];
                        uc.mergedRoles.fromRoles.push({
                            id: role['ROLE_ID'],
                            name: role['NAME'],
                            user_role_id: role['USER_ROLE_ID']
                        });
                    }
                    if(typeof callback == 'function'){
                        callback();
                    }
                }else{
                    socketQuery({
                        command: 'get',
                        object: 'user_role',
                        params: {
                            where: 'USER_ID='+id
                        }
                    }, function(res){
                        uc.userRoles = socketParse(res);

                        var userRoleIds = [];
                        for(var r in uc.userRoles){
                            var ur = uc.userRoles[r];
                            userRoleIds.push(ur['ROLE_ID']);
                        }

                        function getUserRoleById(id){
                            for(var i in uc.userRoles){
                                var ur = uc.userRoles[i];
                                if(ur['ROLE_ID'] == id){
                                    return ur;
                                }
                            }
                        }

                        for(var k in uc.allRoles){
                            var role = uc.allRoles[k];
                            if($.inArray(role['ROLE_ID'], userRoleIds) != -1){
                                uc.mergedRoles.toRoles.push({
                                    id: role['ROLE_ID'],
                                    name: role['NAME'],
                                    user_role_id: getUserRoleById(role['ROLE_ID'])['USER_ROLE_ID']
                                });
                            }else{
                                uc.mergedRoles.fromRoles.push({
                                    id: role['ROLE_ID'],
                                    name: role['NAME']
                                });
                            }
                        }

                        if(typeof callback == 'function'){
                            callback();
                        }
                    });
                }
            });
        },
        populateBlocks: function(callback){
            var parentWrapper = formWrapper.find('.form-user-add-wrapper');
            var fullHtml =  "<div id='uff-list-container'>" +
                "<div class='row'>" +
                "<div class='col-md-12'>" +
                "<h3>Управление ролями пользователя</h3>" +
                "</div>" +
                "<div class='col-md-12'>" +
                "<div class='toBlockCheckboxes'>" +
                "<div class='col-md-6'>" +
                "<div class='row'>" +
                "<h4>Доступные роли</h4>" +
                "<div class='fromBlock'>" +
                "{{#fromRoles}}" +
                "<div class='uff-item' data-id='{{id}}'>" +
                "<div class='name'>{{name}}</div>" +
                "</div>" +
                "{{/fromRoles}}" +
                "</div>" +
                "</div>" +
                "</div>" +
                "<div class='col-md-6'>" +
                "<div class='row'>" +
                "<h4>Подключенные роли</h4>" +
                "<div class='toBlock'>" +
                "{{#toRoles}}" +
                "<div class='uff-item' data-id='{{id}}' data-user_role_id='{{user_role_id}}'>" +
                "<div class='name'>{{name}}</div>" +
                "</div>" +
                "{{/toRoles}}" +
                "</div>" +
                "</div>" +
                "</div>" +
                "</div>" +
                "</div>" +
                "</div>" +
                "</div>";

            parentWrapper.html(Mustache.to_html(fullHtml, uc.mergedRoles));
            uc.lb = formWrapper.find('.fromBlock');
            uc.rb = formWrapper.find('.toBlock');
            uc.shiftItem = formWrapper.find('.uff-item');
            uc.parentWrapper = parentWrapper;

            if(typeof callback == 'function'){
                callback();
            }
        },
        setHandlers: function(callback){

            uc.shiftItem.off('click').on('click', function(){
                MB.Core.spinner.start(uc.parentWrapper);
                var o = {};
                var role_id = $(this).data('id');
                var user_role_id = $(this).data('user_role_id');

                if($(this).parents('.fromBlock').length > 0){
                    o = {
                        command: 'new',
                        user_id: id,
                        role_id: role_id
                    };
                }else{
                    o = {
                        command: 'remove',
                        user_role_id: user_role_id
                    };
                }

                uc.sendCommand(o, function(){
                    uc.reload(function(){
                        MB.Core.spinner.stop(uc.parentWrapper);
                    });
                });
            });

            if(typeof callback == 'function'){
                callback();
            }
        },
        reload: function(callback){
            uc.getData(function(){
                uc.populateBlocks(function(){
                    uc.setHandlers(function(){
                        if(typeof callback == 'function'){
                            callback();
                        }
                    });
                });
            });
        },
        sendCommand: function(obj, callback){
            var o = {};
            if(obj['command'] == 'new'){
                o = {
                    command: 'new',
                    object: 'user_role',
                    params: {
                        user_id: id,
                        role_id: obj['role_id']
                    }
                };
            }else{
                o = {
                    command: 'remove',
                    object: 'user_role',
                    params: {
                        user_role_id: obj['user_role_id']
                    }
                };
            }
            socketQuery(o, function(res){
                socketParse(res);
                if(typeof callback == 'function'){
                    callback();
                }
            });
        }
    };

    MB.Core.spinner.start(formWrapper.find('.form-user-add-wrapper-container'));
    uc.getData(function(){
        uc.populateBlocks(function(){
            uc.setHandlers(function(){
                MB.Core.spinner.stop(formWrapper.find('.form-user-add-wrapper-container'));
            });
        });
    });

//    addUsers.off('click').on('click', function(){
//        MB.Core.spinner.start(formWrapper.find('.fn-vagon').eq(0));
//        if(uc.isLoaded){
//            formTrain.slideLeft(function(){
//                MB.Core.spinner.stop(formWrapper.find('.fn-vagon').eq(0));
//            });
//        }else{
//
//        }
//    });
}());

(function(){
    var modal = $('.mw-wrap').last();
    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_action_additional_service_group', formID);
    var formWrapper = $('#mw-'+formInstance.id);

    var id = formInstance.activeId; // ID ГРУППЫ УСЛГУГ ДЛЯ МЕРОПРИЯТИЯ

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

    var action_id = formInstance.data.data[0]['ACTION_ID'];

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
                object: "action_scheme_additional_service_group",
                params: {
                    where: 'action_id = '+action_id
                }
            }, function(res){

                uc.allRoles = socketParse(res);

                if(id == 'new'){
                    for(var k in uc.allRoles){
                        var role = uc.allRoles[k];
                        uc.mergedRoles.fromRoles.push({
                            id: role['ADDITIONAL_SERVICE_GROUP_ID'],
                            name: role['NAME'],
                            color: role['COLOR'],
                            user_role_id: 1
                        });
                    }
                    if(typeof callback == 'function'){
                        callback();
                    }
                }else{
                    socketQuery({
                        command: "get",
                        object: "action_scheme_service_group_to_action_service_group",
                        params: {
                            where: 'action_id = ' + action_id + ' and ACTION_ADD_SERVICE_GROUP_ID = ' + id
                        }
                    }, function(res){
                        uc.userRoles = socketParse(res);

                        for(var j in uc.userRoles){
                            var urj = uc.userRoles[j];
                            for(var v in uc.allRoles){
                                var vrv = uc.allRoles[v];
                                if(vrv['ADDITIONAL_SERVICE_GROUP_ID'] == urj['ADDITIONAL_SERVICE_GROUP_ID']){
                                    uc.allRoles[v]['AS_SERVGRP_ACTIONSERVGRP_ID'] = uc.userRoles[j]['AS_SERVGRP_ACTIONSERVGRP_ID'];
                                }
                            }
                        }

                        var userRoleIds = [];
                        for(var r in uc.userRoles){
                            var ur = uc.userRoles[r];
                            userRoleIds.push(ur['ADDITIONAL_SERVICE_GROUP_ID']);
                        }

                        function getUserRoleById(id){
                            for(var i in uc.userRoles){
                                var ur = uc.userRoles[i];
                                if(ur['ADDITIONAL_SERVICE_GROUP_ID'] == id){
                                    return ur;
                                }
                            }
                        }


                        for(var k in uc.allRoles){
                            var role = uc.allRoles[k];
                            if($.inArray(role['ADDITIONAL_SERVICE_GROUP_ID'], userRoleIds) != -1){
                                uc.mergedRoles.toRoles.push({
                                    id: role['ADDITIONAL_SERVICE_GROUP_ID'],
                                    name: role['NAME'],
                                    user_role_id: role['AS_SERVGRP_ACTIONSERVGRP_ID']
                                });
                            }else{
                                uc.mergedRoles.fromRoles.push({
                                    id: role['ADDITIONAL_SERVICE_GROUP_ID'],
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
                "<h3>Управление доступами к групперовкам</h3>" +
                "</div>" +
                "<div class='col-md-12'>" +
                "<div class='toBlockCheckboxes'>" +
                "<div class='col-md-6'>" +
                "<div class='row'>" +
                "<h4>Отключенные групперовки</h4>" +
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
                "<h4>Подключенные групперовки</h4>" +
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
                var grpp_id = $(this).data('id');
                var user_role_id = $(this).data('user_role_id');

                if($(this).parents('.fromBlock').length > 0){
                    o = {
                        command: 'new',
                        additional_service_group_id: grpp_id,
                        action_add_service_group_id: id
                    };
                }else{
                    o = {
                        command: 'remove',
                        as_servgrp_actionservgrp_id: user_role_id
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
                    object: 'action_scheme_service_group_to_action_service_group',
                    params: {
                        additional_service_group_id: obj['additional_service_group_id'],
                        action_add_service_group_id: obj['action_add_service_group_id']
                    }
                };
            }else{
                o = {
                    command: 'remove',
                    object: 'action_scheme_service_group_to_action_service_group',
                    params: {
                        as_servgrp_actionservgrp_id: obj['as_servgrp_actionservgrp_id']
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

(function(){
    var modal = $('.mw-wrap').last();
    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_role', formID);
    var formWrapper = $('#mw-'+formInstance.id);

    var id = formInstance.activeId;

    var formTrain = formWrapper.find('.fn-train-overflow').fn_train();
    var addUsers = formWrapper.find('.form-role-add-users');
    var usersLoaded = false;

    var uc = {
        allUsers: undefined,
        usersInRole: undefined,
        lb: undefined,
        rb: undefined,
        isLoaded: false,
        getData: function(callback){
            socketQuery({
                command: "get",
                object: "user_role",
                params:{
                    where: "ROLE_ID ="+id
                }
            }, function(res){
                uc.usersInRole = socketParse(res);

                socketQuery({
                    command: "get",
                    object: "user",
                    params:{}
                }, function(res){
                    uc.allUsers = socketParse(res);
                    if(typeof callback == 'function'){
                        callback();
                    }
                });
            });
        },
        populateBlocks: function(callback){
            var parentWrapper = formWrapper.find('.form-role-add-wrapper');
            var fullHtml =  "<div id='uff-list-container'>" +
                                "<div class='row'>" +
                                    "<div class='col-md-12'>" +
                                        "<div class='toBlockCheckboxes'>" +
                                            "<div class='col-md-6'>" +
                                                "<div class='row lh25'>" +
                                                    "<label class='fn-label'>Поиск пользователей</label><input type='text' class='searchUsers fn-control' placeholder='Поиск'/>" +
                                                "</div>" +
                                            "</div>" +
                                        "</div>" +
                                    "</div>" +
                                    "<div class='col-md-12'>" +
                                        "<div class='toBlockCheckboxes'>" +
                                            "<div class='col-md-6'>" +
                                                "<div class='row'><div class='role-hl'>Доступные к подключению</div>" +
                                                    "<div class='fromBlock'>" +
                                                        "{{#fromUsers}}" +
                                                            "<div class='uff-item' data-id='{{userId}}'>" +
                                                                "<div class='name'>{{name}} ({{login}})</div>" +
                                                            "</div>" +
                                                        "{{/fromUsers}}" +
                                                    "</div>" +
                                                "</div>" +
                                            "</div>" +
                                            "<div class='col-md-6'>" +
                                                "<div class='row'><div class='role-hl'>Подключенные пользователи</div>" +
                                                    "<div class='toBlock'>" +
                                                        "{{#toUsers}}" +
                                                            "<div class='uff-item' data-user_role_id='{{user_role_id}}' data-id='{{userId}}'>" +
                                                                "<div class='name'>{{name}} ({{login}})</div>" +
                                                            "</div>" +
                                                        "{{/toUsers}}" +
                                                    "</div>" +
                                                "</div>" +
                                            "</div>" +
                                        "</div>" +
                                    "</div>" +
                                "</div>" +
                            "</div>" +
                            "<div class='uff-buttons'>" +
                                "<div class='form-role-slideBack fn-small-btn fn-btn blue'><i class='fa fa-chevron-left'></i> Вернуться</div>" +
                            "</div>";


            var mO = {
                fromUsers: [],
                toUsers: []
            };

            var inRoleUser_ids = [];
            for(var k in uc.usersInRole){
                var userInRole = uc.usersInRole[k];
                var userInRole_id = userInRole['USER_ID'];
                inRoleUser_ids.push(userInRole_id);

                mO.toUsers.push({
                    userId: userInRole_id,
                    name: userInRole['FULLNAME'],
                    login: userInRole['LOGIN'],
                    user_role_id: userInRole['USER_ROLE_ID']
                });
            }

            console.log(uc);

            for(var i in uc.allUsers){
                var user = uc.allUsers[i];
                var user_id = user['USER_ID'];
                if($.inArray(user_id, inRoleUser_ids) == -1){
                    mO.fromUsers.push({
                        userId: user_id,
                        name: user['FULLNAME'],
                        login: user['LOGIN']
                    });
                }
            }

            parentWrapper.html(Mustache.to_html(fullHtml, mO));
            uc.lb = formWrapper.find('.fromBlock');
            uc.rb = formWrapper.find('.toBlock');
            uc.shiftItem = formWrapper.find('.uff-item');
            uc.parentWrapper = parentWrapper;

            if(typeof callback == 'function'){
                callback();
            }
        },
        setHandlers: function(callback){

            uc.parentWrapper.find('.form-role-slideBack').off('click').on('click', function(){
                formTrain.slideRight(function(){

                });
            });

            uc.shiftItem.off('click').on('click', function(){
                MB.Core.spinner.start(uc.parentWrapper);
                var o = {};
                var user_id = $(this).data('id');
                var user_role_id = $(this).data('user_role_id');

                if($(this).parents('.fromBlock').length > 0){
                    o = {
                        command: 'new',
                        user_id: user_id,
                        user_role_id: user_role_id
                    };
                }else{
                    o = {
                        command: 'remove',
                        user_id: user_id,
                        user_role_id: user_role_id
                    };
                }
                uc.sendCommand(o, function(){
                    uc.reload(function(){
                        MB.Core.spinner.stop(uc.parentWrapper);
                    });
                });

            });

            uc.parentWrapper.find('input.searchUsers').off('input').on('input', function(){
                var val = $(this).val();
                var spReg = new RegExp(/^\s+$/g);
                uc.lb.find('.uff-item').show(0);
                if(val.length > 0 && !spReg.test(val)){
                    for(var i = 0; i < uc.lb.find('.uff-item').length; i++){
                        var item = uc.lb.find('.uff-item').eq(i);
                        var name = item.find('.name').text();
                        if(name.toLowerCase().indexOf(val.toLowerCase()) == -1){
                            item.hide(0);
                        }
                    }
                }
            });

            formTrain.slideLeft(function(){
                uc.isLoaded = true;
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
                        user_id: obj.user_id,
                        role_id: id
                    }
                };
            }else{
                o = {
                    command: 'remove',
                    object: 'user_role',
                    params: {
                        user_role_id: obj.user_role_id
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


    addUsers.off('click').on('click', function(){
        MB.Core.spinner.start(formWrapper.find('.fn-vagon').eq(0));
        if(uc.isLoaded){
            formTrain.slideLeft(function(){
                MB.Core.spinner.stop(formWrapper.find('.fn-vagon').eq(0));
            });
        }else{
            uc.getData(function(){
                uc.populateBlocks(function(){
                    uc.setHandlers(function(){
                        MB.Core.spinner.stop(formWrapper.find('.fn-vagon').eq(0));
                    });
                });
            });
        }
    });

}());
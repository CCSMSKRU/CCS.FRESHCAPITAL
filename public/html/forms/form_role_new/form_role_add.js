(function(){
    return;
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
                                                "<div class='row'>" +
                                                    "<div class='fromBlock'>" +
                                                        "{{#fromUsers}}" +
                                                            "<div class='uff-item' data-id='{{userId}}'>" +
                                                                "<div class='name'>{{name}}</div>" +
                                                            "</div>" +
                                                        "{{/fromUsers}}" +
                                                    "</div>" +
                                                "</div>" +
                                            "</div>" +
                                            "<div class='col-md-6'>" +
                                                "<div class='row'>" +
                                                    "<div class='toBlock'>" +
                                                        "{{#toUsers}}" +
                                                            "<div class='uff-item' data-user_role_id='{{user_role_id}}' data-id='{{userId}}'>" +
                                                                "<div class='name'>{{name}}</div>" +
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
                        name: user['FULLNAME']
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


//    addUsers.off('click').on('click', function(){
//        MB.Core.spinner.start(formWrapper.find('.fn-vagon').eq(0));
//        if(!usersLoaded){
//
//            var toRemove = [];
//            var toAdd = [];
//
//            var usersInRole = undefined;
//            var allUsers = undefined;
//
//            function afterDataGetted(){
//
//                var flatUsersInRole = [];
//
//                function setHandlers(){
//                    var lbElem = formWrapper.find('.uff-item');
//                    var lb = formWrapper.find('.fromBlock');
//                    var rb = formWrapper.find('.toBlock');
//
//                    lbElem.off('click').on('click', function(){
//                        var id = $(this).data('id');
//                        var elem = $(this);
//
//                        if(elem.parents('.fromBlock').length > 0){
//                            flatUsersInRole.push(id.toString());
//                            rb.append(elem);
//
//                            toRemove.splice(toRemove.indexOf(id), 1);
//                            toAdd.push(id);
//
//                        }else{
//                            flatUsersInRole.splice(flatUsersInRole.indexOf(id),1);
//                            lb.append(elem);
//
//                            toAdd.splice(toAdd.indexOf(id), 1);
//                            toRemove.push(id);
//
//                        }
//
//                        console.log(toAdd, toRemove);
//                    });
//
//                    formWrapper.find('input.searchUsers').off('input').on('input', function(){
//                        var val = $(this).val();
//                        var spReg = new RegExp(/^\s+$/g);
//                        lb.find('.uff-item').show(0);
//                        if(val.length > 0 && !spReg.test(val)){
//                            for(var i = 0; i < lb.find('.uff-item').length; i++){
//                                var item = lb.find('.uff-item').eq(i);
//                                var name = item.find('.name').text();
//                                if(name.toLowerCase().indexOf(val.toLowerCase()) == -1){
//                                    item.hide(0);
//                                }
//                            }
//                        }
//                    });
//
//                    formWrapper.find('.form-fund-group-slideBack').off('click').on('click', function(){
//                        formTrain.slideRight();
//                    });
//
//                    formWrapper.find('.addUsersToFund').off('click').on('click', function(){
//
//                        var addArray = [];
//                        var removeArray = [];
//
//                        for(var i in toAdd){
//                            var item = toAdd[i];
//
//                            console.log(item, flatUsersInRole);
//
//                            if($.inArray(item.toString(), flatUsersInRole) == -1){
//                                addArray.push(item);
//                            }
//                        }
//                        for(var k in toRemove){
//                            var kItem = toRemove[k];
//
//                            console.log(kItem.toString(), flatUsersInRole);
//
//                            //if($.inArray(kItem.toString(), flatUsersInRole) > -1){
//                                removeArray.push(kItem);
//                            //}
//                        }
//
//                        console.log('addArray', addArray);
//
//                        for(var a in toAdd){
//                            var addId = toAdd[a];
//                            var o = {
//                                command: 'new',
//                                object: 'user_role',
//                                params: {
//                                    role_id: id,
//                                    user_id: addId
//                                }
//                            };
//                            socketQuery(o, function(res){
//                                res = JSON.parse(res);
//                                res = res['results'][0];
//                                console.log(res);
//                                toastr[res['toastr']['type']](res['toastr']['message']);
//                            });
//                        }
//
//                        function getUserRoleIdById(id){
//
//                            console.log(usersInRole);
//
//                            for(var i in usersInRole.data){
//                                var user = usersInRole.data[i];
//
//                                console.log('FFF', user[inRoleNames.indexOf('USER_ID')].toString() , id.toString());
//
//                                if(user[inRoleNames.indexOf('USER_ID')].toString() == id.toString()){
//                                    return user[inRoleNames.indexOf('USER_ROLE_ID')]
//                                }
//                            }
//                        }
//
//                        for(var r in toRemove){
//                            var removeId = toRemove[r];
//                            var o = {
//                                command: 'remove',
//                                object: 'user_role',
//                                params: {
//                                    user_role_id: getUserRoleIdById(removeId)
//                                }
//                            };
//
//                            console.log(o);
//
//                            socketQuery(o, function(res){
//                                res = JSON.parse(res);
//                                res = res['results'][0];
//                                toastr[res['toastr']['type']](res['toastr']['message']);
//                                //console.log(res);
//                            });
//                        }
//                    });
//                }
//
//                var userNames = allUsers.data_columns;
//                var inRoleNames = usersInRole.data_columns;
//
//
//                var lBlockHtml = '';
//                var rBlockHtml = '';
//                var lBMObj = {
//                    users:[]
//                };
//                var rBMObj = {
//                    users:[]
//                };
//                for(var ui in usersInRole.data){
//                    var uiItem = usersInRole.data[ui];
//                    var userId1 = uiItem[inRoleNames.indexOf('USER_ID')];
//                    flatUsersInRole.push(uiItem[inRoleNames.indexOf('USER_ID')]);
//
//                    rBMObj.users.push({
//                        userId: userId1,
//                        name: uiItem[inRoleNames.indexOf('FULLNAME')]
//                    });
//                }
//
//                for(var u in allUsers.data){
//                    var userItem = allUsers.data[u];
//                    var userId = userItem[userNames.indexOf('USER_ID')];
//                    if($.inArray(userId, flatUsersInRole) == -1){
//                        lBMObj.users.push({
//                            userId: userId,
//                            name: userItem[userNames.indexOf('FULLNAME')]
//                        });
//                    }
//                }
//
//                lBlockHtml = Mustache.to_html(itemTpl, lBMObj);
//                rBlockHtml = Mustache.to_html(itemTpl, rBMObj);
//
//                var checkboxesHtml = "<div class='col-md-6'>" +
//                    "<div class='row lh25'><label class='fn-label'>Поиск пользователей</label><input type='text' class='searchUsers fn-control' placeholder='Поиск'/></div>"+
//                    "</div>";
//
//                var fullHtml = "<div id='uff-list-container'>" +
//                    "<div class='row'>" +
//                    "<div class='col-md-12'>" +
//                    "<div class='toBlockCheckboxes'>"+checkboxesHtml+"</div>" +
//                    "</div>" +
//                    "<div class='col-md-12'>" +
//                    "<div class='toBlockCheckboxes'>" +
//                    "<div class='col-md-6'>" +
//                    "<div class='row'>" +
//                    "<div class='fromBlock'>"+lBlockHtml+"</div>" +
//                    "</div>" +
//                    "</div>" +
//                    "<div class='col-md-6'>" +
//                    "<div class='row'>" +
//                    "<div class='toBlock'>"+rBlockHtml+"</div>" +
//                    "</div>" +
//                    "</div>" +
//                    "</div>" +
//                    "</div>" +
//                    "</div>" +
//                    "</div>" +
//                    "<div class='uff-buttons'>" +
//                    "<div class='form-fund-group-slideBack fn-small-btn fn-btn blue'><i class='fa fa-chevron-left'></i> Вернуться</div>" +
//                    "<div class='fn-btn fn-small-btn green addUsersToFund marLeft10'><i class='fa fa-plus'></i> Добавить</div>" +
//                    "</div>";
//
//                formTrain.rVagon.find('.form-role-add-wrapper').html(fullHtml);
//                setHandlers();
//                MB.Core.spinner.stop(formWrapper.find('.fn-vagon').eq(0));
//                formTrain.slideLeft(function(){
//                    usersLoaded = true;
//                });
//            }
//
//            socketQuery({
//                command: "get",
//                object: "user_role",
//                params:{
//                    where: "ROLE_ID ="+id
//                }
//            }, function(res){
//                res = JSON.parse(res);
//                res = res['results'][0];
//                // Юзеры в фонде
//                usersInRole = res;
//
//                console.log('UIR', usersInRole);
//
//                socketQuery({
//                    command: "get",
//                    object: "user",
//                    params:{}
//                }, function(res){
//                    res = JSON.parse(res);
//                    res = res['results'][0];
//                    // Активные Юзеры
//                    console.log('Активные Юзеры', res);
//                    allUsers = res;
//
//                    afterDataGetted();
//                });
//            });
//        }else{
//            MB.Core.spinner.stop(formWrapper.find('.fn-vagon').eq(0));
//            formTrain.slideLeft(function(){
//
//            });
//        }
//    });

}());


(function () {
    return;
    var instance = MB.O.forms["form_role"];
    instance.custom = function (callback) {
        var id = MB.O.forms.form_role.activeId;
        var Tabs = new TabsClass({type:"disAll"});
        var MultiplySelect = new MultiplySelectClass({
            selector:"#rolesModalTabUsersContent",
            thisId:id,
            subcommandEx:"user_role",
            subcommandAll:"user_active",
            pKey:"ROLE_ID",
            pKeyEx:"USER_ID",
            pKeyAll:"USER_ROLE_ID",
            name:"FULLNAME_WITH_LOGIN",
            type:"all"
        })
        MultiplySelect.init(function(){});




        $("#TAB_form_role_formAccess").click(function(){
            var id = MB.O.forms.form_role.activeId;
            $(".form_role_form-content-wrapper").html("");
            var table = new MB.Table({
                world: "form_role_form", 
                name: "tbl_role_access_get_object", 
                params: {
                    parent: instance
                    // parentkeyvalue: id, 
                    // parentobject: "form_role", 
                    // parentobjecttype: "form"
                }
            });
            table.create(function () {});
        })
        $("#TAB_form_role_objectAccess").click(function(){
            var id = MB.O.forms.form_role.activeId;
            $(".form_role_object-content-wrapper").html("");
            var table = new MB.Table({
                world: "form_role_object", 
                name: "tbl_role_access_object", 
                params: {
                    parent: instance
                    // parentkeyvalue: id, 
                    // parentobject: "form_role", 
                    // parentobjecttype: "form"
                }
            });
            table.create(function () {});
        })
        $("#TAB_form_role_operationsAccess").click(function(){
            var id = MB.O.forms.form_role.activeId;
            $(".form_role_operations-content-wrapper").html("");
            var table = new MB.Table({
                world: "form_role_operations", 
                name: "tbl_role_access_operation", 
                params: {
                    parent: instance
                    // parentkeyvalue: id, 
                    // parentobject: "form_role", 
                    // parentobjecttype: "form"
                }
            });
            table.create(function () {});
        })
        $("#TAB_form_role_menuAccess").click(function(){
            var id = MB.O.forms.form_role.activeId;
            $(".form_role_menu-content-wrapper").html("");
            var table = new MB.Table({
                world: "form_role_menu", 
                name: "tbl_role_access_menu", 
                params: {
                    parent: instance
                    // parentkeyvalue: id, 
                    // parentobject: "form_role", 
                    // parentobjecttype: "form"
                }
            });
            table.create(function () {});
            log(MB.Table.hasloaded("tbl_role_access_menu"))
        })
        callback();
    };
})();

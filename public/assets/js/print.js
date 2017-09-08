$(document).on('print',function(e,data){
    if (typeof data!=="object"){
        return false;
    }

    var contentIsGetting = false;
    var getPrintInstance = function(params,callback){
        if (contentIsGetting) {
            setTimeout(function () {
                getPrintInstance(params, callback);
            }, 250);
        }
        console.log('Вызвана функция getPrintInstance.....................');
        contentIsGetting = true;

        var contentId = MB.Core.guid();
        var content = MB.Core.switchModal({
            type: 'content',
            isNew: true,
            id: contentId,
            filename: 'printStack',
            eternal: true,
            noExpand:params.noExpand,
            params: {
                activeId: 'activeId',
                label: 'Процесс печати',
                title: 'Процесс печати'
            }
        }, function (content) {
            content.setHandlers(function () {
            callback(content);
                contentIsGetting = false;
            });
        });
    };

    var command_type = data.type;
    console.log('command_type', command_type);
    switch (command_type){
        case 'PACK_INFO':
            var packs = [];
            for(var i in data.data){
                var obj = {};
                if(!data.data[i].TICKET_PACK_ID){
                    continue;
                }else{
                    obj.pack_id = data.data[i].TICKET_PACK_ID;
                    obj.pack_name = data.data[i].TICKET_PACK_NAME;
                    obj.printer_name = i;
                    obj.pack_start = data.data[i].START_NO;
                    obj.pack_end = data.data[i].FINISH_NO;
                    obj.pack_current = data.data[i].SCA_CURRENT_NO;
                }
                packs.push(obj);
            }
            MB.Core.packInfo.init({
                packs: packs
            });

            //MB.Core.packInfo.init(data.data);
            break;
        case 'NEED_CONFIRM':
            MB.Core.lockScreen.init({
                title: $.cookie().userfullname,
                content: MB.Core.getPrinterSettingsHtml(data),
                buttons: [
                    {
                        title: "Подтвердить",
                        className: "",
                        id: "",
                        callback: function(param){
                            param.command = "PACK_CONFIRM";
                            param.back = data.back;
                            console.log(param);
                            printQuery(param);
                            MB.Core.lockScreen.close();
                        }
                    }
                ]
            }, function(wrapper){
                wrapper.find('.select2').select2();
                $('#lockScreenWrapper select').on('change', function(){
                    var value = $(this).val();
                    var tpt = $(this).find('option:selected').attr('data-tpt');
                    for(var i =0; i< $('#lockScreenWrapper select').length; i++){
                        var sel = $('#lockScreenWrapper select').eq(i);
                        if(sel.find('option:selected').attr('data-tpt') == tpt){
                            if(!sel.is($(this))){
                                sel.select2('val', -1);
                            }
                        }
                    }
                });
            });
            //MB.Core.lockScreen.init({});

            break;
        case 'NEED_CHANGE_PACK':
            MB.Core.lockScreen.init({
                title: $.cookie().userfullname,
                content: MB.Core.getPrinterSettingsHtml(data),
                buttons: [
                    {
                        title: "Подтвердить",
                        className: "",
                        id: "",
                        callback: function(param){
                            param.command = "PACK_CONFIRM";
                            param.back = data.back;
                            console.log(param);
                            printQuery(param);
                            MB.Core.lockScreen.close();
                        }
                    },
                    {
                        title: "Отменить",
                        className: "",
                        id: "",
                        callback: function(param){
                            param.command = "CHANGE_PACK_CANCEL";
                            param.back = data.back;
                            console.log(param);
                            printQuery(param);
                            MB.Core.lockScreen.close();
                        }
                    }
                ]
            }, function(wrapper){
                wrapper.find('.select2').select2();
                $('#lockScreenWrapper select').on('change', function(){
                    var value = $(this).val();
                    var tpt = $(this).find('option:selected').attr('data-tpt');
                    for(var i =0; i< $('#lockScreenWrapper select').length; i++){
                        var sel = $('#lockScreenWrapper select').eq(i);
                        if(sel.find('option:selected').attr('data-tpt') == tpt){
                            if(!sel.is($(this))){
                                sel.select2('val', -1);
                            }
                        }
                    }
                });
            });
            break;
        case 'PRINT_SHOW':
            getPrintInstance({},function(printInstance){
                /*printInstance.addItems(data.ticket_stack, true);
                printInstance.setPortion(data.portions,true);
                printInstance.renderTickets();*/
            });
            break;
        case 'PRINT_LOAD':
            getPrintInstance({},function(printInstance){
                printInstance.addItems(data.ticket_stack, true);
                console.log('data.ticket_stack',data.ticket_stack);
                printInstance.setPortion(data.portions,true);
                printInstance.renderTickets();
            });
            break;
        case 'PRINT_TICKET_RESPONSE':
            getPrintInstance({noExpand:true},function(printInstance){
                printInstance.updateItem(data.ticket,data.where);
                printInstance.renderTicket(data.where.order_ticket_id);
            });
            break;
        case 'PRINT_WAIT_NEXT':
            getPrintInstance({},function(printInstance){
                printInstance.updateStatus(data.blank_type,'PRINT_WAIT_NEXT');
            });
            break;
        case 'PRINT_PAUSED':
            getPrintInstance({},function(printInstance){
                printInstance.updateStatus(data.blank_type,'PRINT_PAUSED');
            });
            break;
        case 'PRINT_FINISH':
            var type = data.toastr.type;
            var title = data.toastr.title;
            var message = data.toastr.message;
            toastr[type](message, title);
            break;
        case 'OK':
            var type = 'success';
            var title = 'Ок!';
            toastr[type](data.message, title);
            break;
        case 'INFO':
            var type = 'info';
            var title = 'Внимание:';
            toastr[type](data.message, title);
            break;
        case 'ERROR':
            var type = 'error';
            var title = 'Ошибка!';
            toastr[type](data.message, title);
            break;
        default:
            break;
    }
    return true;
});
test = function(){
    var contentId = MB.Core.guid();
    var content = MB.Core.switchModal({
        type: 'content',
        isNew: true,
        id: contentId,
        filename: 'test1',
        params: {
            activeId: 'activeId',
            label: 'Тест1',
            title: 'Тест1'
        }
    }, function (content) {
        if (typeof content.setHandlers === 'function'){
            content.setHandlers();
        }
    });
}
t2 = function(arr){
    var s ='';
    for (var i in arr) {
        s+=arr[i]['AREA_GROUP']+','+arr[i]['LINE']+','+arr[i]['PLACE']+','+arr[i]['BARCODE']+'\n';
    }
    console.log(s);
};
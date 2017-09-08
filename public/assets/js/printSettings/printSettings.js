(function(){
    var tpl = '<div class="row">' +
                    '<div class="col-md-12">' +
                        '<div class="notificationPlace">{{message}}</div>'+
                        '{{#printers}}' +
                            '<div class="row marBot10 {{#lighted}}hightlighted{{/lighted}} printerItem" data-id="{{printerId}}">' +
                                '<div class="col-md-4 packTitle">{{printerId}}</div>' +
                                '<div class="col-md-8">' +
                                    '<select class="select2 printItem" data-id="{{printerId}}">' +
                                        '<option value="-1">Выберите пачку</option>' +
                                        '{{#packs}}' +
                                            '<option data-TICKET_PACK_TYPE="{{TICKET_PACK_TYPE}}" data-USER_ID="{{USER_ID}}" data-TICKET_PACK_NAME="{{TICKET_PACK_NAME}}" data-TICKET_PACK_ID="{{TICKET_PACK_ID}}" data-TICKET_BLANK_ID="{{TICKET_BLANK_ID}}" data-SCA_CURRENT_NO="{{SCA_CURRENT_NO}}" data-SCA_SERIES="{{SCA_SERIES}}" data-START_NO="{{START_NO}}" data-FINISH_NO="{{FINISH_NO}}" data-tpt="{{TICKET_PACK_TYPE}}" {{#isSelected}}selected{{/isSelected}} value="{{TICKET_PACK_ID}}">{{TICKET_PACK_NAME}}</option>' +
                                        '{{/packs}}' +
                                    '</select>' +
                                '</div>' +
                            '</div>' +
                        '{{/printers}}' +
                        '</div>' +
                    '</div>';

    MB.Core.getPrinterSettingsHtml = function(data){
        console.log(data);
        if(typeof data == 'object'){
            var html = '';
            var result = {};
            result.message = data.message;
            result.printers = [];

            for(var i in data.printers){
                var tmpObj = {
                    lighted:(data.printers[i].lighted),
                    printerId:i,
                    packs: []
                };
                result.printers.push(tmpObj);
            }
            for(var j in data.packs){
                for(var l in result.printers){
                    result.printers[l].packs.push(MB.Core.cloneObj(data.packs[j]));
                }
            }

            var _i = 0;
            for(var i in data.printers){
                for(var k in result.printers[_i].packs){
                    var pack = result.printers[_i].packs[k];
                    pack.isSelected = (data.printers[i].TICKET_PACK_ID != undefined)? pack.TICKET_PACK_ID == data.printers[i].TICKET_PACK_ID : false;
                }
                _i++;
            }


            return Mustache.to_html(tpl, result);
        }else{
            console.warn('wrong data');
        }
    };
}());



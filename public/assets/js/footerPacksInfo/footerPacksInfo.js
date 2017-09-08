(function(){
    var initFunction = function(data){
        var isCurrentInEdit = false;
        function setHandlers(){
            var curTicket = $('.pp-pack-current');
            var packId = curTicket.parents('.pp-wrapper').data('id');
            var packInfo = {};
            for(var i in data.packs){
                if(data.packs[i].pack_id == packId){
                    packInfo = data.packs[i];
                }
            }
            curTicket.off('click').on('click', function(){
                if(isCurrentInEdit){
                    return;
                }
                isCurrentInEdit = true;
                var confirmAble = true;
                var tpl = '<div class="row posRel marBot5">' +
                                '<div class="col-md-5">' +
                                    '<div class="form-group">' +
                                        '<label id="currentTicketLabel">Текущий номер</label>'+
                                        '<input id="newCurrentNumber" type="number" class="form-control marTop5" min="'+packInfo.pack_current+'" max="'+packInfo.pack_end+'" value="'+packInfo.pack_current+'"/>' +
                                    '</div>'+
                                '</div>'+
                            '</div>';
                bootbox.dialog({
                    message: tpl,
                    title: packInfo.pack_name+' '+packInfo.pack_start+'-'+packInfo.pack_end,
                    buttons:{
                        ok:{
                            label: 'Подтвердить',
                            className:'',
                            callback: function(){
                                if(confirmAble){
                                    printQuery({
                                        command: 'SET_CURRENT_NUM',
                                        back: '',
                                        data: {
                                            ticket_pack_id: packId,
                                            sca_current_no: $('#newCurrentNumber').val()
                                        }
                                    });
                                    isCurrentInEdit = false;
                                }else{
                                    $('#currentTicketLabel').html('Некорректное значение');
                                    window.setTimeout(function(){
                                        $('#currentTicketLabel').html('Текущий номер');
                                    },3000);
                                    return false;
                                }
                            }
                        },
                        cancel:{
                            label: 'Отмена',
                            className:'',
                            callback: function(){
                                isCurrentInEdit = false;
                            }
                        }
                    }
                });

                $(".bootbox-close-button").on('click', function(){
                    isCurrentInEdit = false;
                });
                $('#newCurrentNumber').on('input', function(){
                    var val = $(this).val();
                    if(isNaN(+val)){
                        confirmAble = false;
                    }else{
                        if(+val >= packInfo.pack_current && +val <= packInfo.pack_end){
                            confirmAble = true;
                            $(this).css('borderColor','green');
                            $('#currentTicketLabel').html('Текущий номер');
                        }else{
                            confirmAble = false;
                            $(this).css('borderColor','red');
                            $('#currentTicketLabel').html('Некорректное значение');
                            window.setTimeout(function(){
                                $('#currentTicketLabel').html('Текущий номер');
                            },3000);
                        }
                    }
                });
            });
        }

        var container = $('.footerUserInfo .printersStack-wrapper');
        var template  = '{{#packs}}' +
                            '<div class="pp-wrapper" data-id="{{pack_id}}">' +
                                '<div class="pp-inner">' +
                                    '<div class="pp-pack-title">{{printer_name}} <span class="pp-pack-name">{{pack_name}}</span></div>'+
                                    '<div class="pp-pack-range">{{pack_start}}&nbsp;-&nbsp;{{pack_end}}</div>'+
                                    '<div class="pp-pack-current">{{pack_current}}</div>'+
                                '</div>'+
                            '</div>' +
                        '{{/packs}}';

        container.find('.pp-wrapper').remove();
        container.prepend(Mustache.to_html(template, data));
        MB.Core.resizeWindows();
        setHandlers();

    };

    MB.Core.packInfo = {
        init: initFunction
    };
}());

(function(){
    var lockScreen = {
        init: function(params, callback){
            var tpl = "<div id='lockScreenWrapper'>" +
                            "<div class='ls-header'>" +
                                "<div class='ls-title'>{{title}}</div>" +
                                "<div class='ls-close'><i class='fa fa-times'></i></div>" +
                            "</div>" +
                            "<div class='ls-content'>" +
                                "<div class='ls-inner-content'></div>" +
                            "</div>" +
                            "<div class='ls-footer'>" +
                            "{{#buttons}}"+
                                "<div class='btn newStyle {{className}}' id='{{id}}'>{{title}}</div>" +
                            "{{/buttons}}"+
                            "</div>" +
                        "</div>";

            var data = {
                title: params.title || $.cookie().userfullname,
                content: params.content || "content",
                buttons: params.buttons || []
            };

            $('body').append(Mustache.to_html(tpl, data));
            $('#lockScreenWrapper .ls-content .ls-inner-content').html(params.content);
            $('#lockScreenWrapper').css('zIndex','10060');
            $('#lockScreenWrapper').animate({
                opacity: 1
            }, 250);

            function setHandlers(){
                function setCallback(elem, callback){
                    if(typeof callback == 'function'){
                        elem.on('click', function(){
                            var resultObject = {
                                data: {}
                            };

                            for(var i=0; i<$('#lockScreenWrapper .printerItem').length; i++){
                                var item = $('#lockScreenWrapper .printerItem').eq(i);
                                var key = item.attr('data-id');
                                var value = item.find('select.printItem').val();
                                var option = item.find('select.printItem option:selected');
                                var resObj = {
                                    FINISH_NO: option.attr('data-FINISH_NO'),
                                    SCA_CURRENT_NO: option.attr('data-SCA_CURRENT_NO'),
                                    SCA_SERIES: option.attr('data-SCA_SERIES'),
                                    START_NO: option.attr('data-START_NO'),
                                    TICKET_BLANK_ID: option.attr('data-TICKET_BLANK_ID'),
                                    TICKET_PACK_ID: value,
                                    TICKET_PACK_NAME: option.attr('data-TICKET_PACK_NAME'),
                                    USER_ID: option.attr('data-USER_ID'),
                                    TICKET_PACK_TYPE: option.attr('data-TICKET_PACK_TYPE')
                                };

                                if(value == -1){
                                    resObj = {};
                                }

                                resultObject.data[key] = resObj;
                            }

                            callback(resultObject);
                        });
                    }
                }
                for(var i in params.buttons){
                    var btn = params.buttons[i];
                    var callback = btn.callback;
                    setCallback($('#lockScreenWrapper .ls-footer .btn').eq(i), callback);
                }

                $('#lockScreenWrapper .ls-close').on('click', function(){
                    lockScreen.close();
                });
            }
            setHandlers();

            if(typeof callback == 'function'){
                callback($('#lockScreenWrapper'));
            }
        },
        close: function(){
            $('#lockScreenWrapper').animate({
                opacity: 0
            }, 100, function(){
                $('#lockScreenWrapper').remove();
            })
        }
    };
    MB.Core.lockScreen = lockScreen;


}());



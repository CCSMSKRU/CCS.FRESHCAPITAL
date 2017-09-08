

(function(){

    var gurl = 'http://ccs.vgfinancing.com';
    //var gurl = 'http://192.168.1.45:81';
    var url = 'http://ccs.vgfinancing.com/site_api/';
    //var url = 'http://192.168.1.45:81/site_api/';


    var query = function(o, cb){

        $.ajax({
            url: url,
            method: 'POST',
            data: {json: JSON.stringify(o), site: 'vgfinancing.com'},
            //dataType: "json",
            error: function (err) {
                console.warn('Не удалось подключиться к серверу jsonp.Ошибка!');
            },
            success: function (result) {

                if(result.code){

                    console.warn('ERROR:', result);

                    return;
                }

                if (typeof cb == 'function') cb(result);

            }
        });

    };

    var isMobile = {
        Android: function () {
            return navigator.userAgent.match(/Android/i);
        },
        BlackBerry: function () {
            return navigator.userAgent.match(/BlackBerry/i);
        },
        iOS: function () {
            return navigator.userAgent.match(/iPhone|iPad|iPod/i);
        },
        Opera: function () {
            return navigator.userAgent.match(/Opera Mini/i);
        },
        Windows: function () {
            return navigator.userAgent.match(/IEMobile/i);
        },
        any: function () {
            return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
        }
    };

    var w = {
        init: function(){

            w.getScripts(function(){



                $('.vgf-widget-button').off('click').on('click', function(){

                    w.btn = $(this);
                    w.full_price = w.btn.attr('data-price');

                    w.populate(function(){

                        w.setHandlers();

                    });


                });

            });


        },
        getScripts: function(cb){


            $.getScript(gurl+'/assets/js/plugins/mustache.js', function(){

                if($('#vgf-stylesheet').length == 0 || $('#vgf-stylesheet-mobile').length == 0){
                    if(isMobile.any()){
                        $('body').append('<link id="vgf-stylesheet-mobile" rel="stylesheet" href="'+gurl+'/assets/widget/vgf_widget_mobile.css">');
                    }else{
                        $('body').append('<link id="vgf-stylesheet" rel="stylesheet" href="'+gurl+'/assets/widget/vgf_widget.css">');
                    }

                }



                if(typeof cb == 'function'){
                    cb();
                }

            });


        },
        populate: function(cb){

            var tpl = '<div class="vgf-widget-holder vgf-modal-holder">' +
                '<div class="vgf-modal-fader"></div>' +
                '<div class="vgf-modal-window">' +
                    '<div class="vgf-inner">' +
                        '<div class="vgf-header">' +
                            '<div class="vgf-title">Купить в рассрочку</div>' +
                            '<div class="vtb-logo"><img src="http://mirbileta.ru/images/vtb24_logo.png"></div>' +
                            '<div class="vgf-logo"><img src="http://mirbileta.ru/images/vgf_logo.png"></div>' +
                            '<div class="vgf-close"></div>' +
                        '</div>' +
                        '<div class="vgf-body">' +
                            '<div class="vgf-sub-row">' +
                                '<div class="vgf-price">Стоимость: <span class="vgf-full-price">{{price}}</span> руб.</div>' +
                                '<div class="vgf-info">Сумма будет автоматически списана равными платежами<br/> по рабочим дням с Вашего процессингового счета.</div>' +
                            '</div>' +

                            '<div class="vgf-three">' +
                                '<div class="vgf-60-holder vgf-third">' +
                                    '<div class="vgf-third-inner" data-count="60">' +
                                        '<div class="vgf-label-1">60</div>' +
                                        '<div class="vgf-label-2">Платежей</div>' +
                                        '<div class="vgf-label-cta"><div class="price60-holder">-</div><div class="vgf-per-day">руб/день</div></div>' +
                                    '</div>' +
                                '</div>' +
                                '<div class="vgf-75-holder vgf-third">' +
                                    '<div class="vgf-third-inner" data-count="75">' +
                                        '<div class="vgf-label-1">75</div>' +
                                        '<div class="vgf-label-2">Платежей</div>' +
                                        '<div class="vgf-label-cta"><div class="price75-holder">-</div><div class="vgf-per-day">руб/день</div></div>' +
                                    '</div>' +
                                '</div>' +
                                '<div class="vgf-90-holder vgf-third">' +
                                    '<div class="vgf-third-inner" data-count="90">' +
                                        '<div class="vgf-label-1">90</div>' +
                                        '<div class="vgf-label-2">Платежей</div>' +
                                        '<div class="vgf-label-cta"><div class="price90-holder">-</div><div class="vgf-per-day">руб/день</div></div>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="vgf-form-holder">' +
                            '<div class="vgf-form-train">'+
                                '<div class="vgf-form-vagon">' +
                                    '<div class="vgf-form-title">Оформить заявку</div>' +
                                    '<div class="vgf-form-body">' +
                                        '<div class="vgf-form-group">' +
                                            '<label class="vgf-form-label">Имя</label>' +
                                            '<input type="text" class="vgf-form-input vgf-order-name" />' +
                                        '</div>' +
                                        '<div class="vgf-form-group">' +
                                            '<label class="vgf-form-label">Телефон</label>' +
                                            '<input type="text" class="vgf-form-input vgf-order-phone" value="+7 " />' +
                                        '</div>' +
                                        '<div class="vgf-form-group">' +
                                            '<div class="vgf-form-confirm">Отправить заявку</div>' +
                                        '</div>' +
                                    '</div>' +
                                '</div>' +

                                '<div class="vgf-form-vagon">' +
                                    '<div class="vgf-thanks-holder">' +
                                        '<div class="vgf-thanks-title">Спасибо!</div>' +
                                        '<div class="vgf-form-text">Ваша заявка принята, наш менеджер свяжется с Вами в ближайшее время.<br/><br/>Телефон поддержки: + 7 (495) 180-28-28</div>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +

                        '</div>' +

                    '</div>' +
                '</div>' +
                '</div>';

            var mo = {
                price: w.full_price.replace(/(\d{1,3}(?=(\d{3})+(?:\.\d|\b)))/g,"\$1 ")
            };

            $('body').prepend(Mustache.to_html(tpl, mo));

            w.wrapper = $('.vgf-widget-holder');

            var o = {
                command: 'widget_calc',
                params: {
                    founding_amount: w.full_price
                }
            };

            query(o, function(res){

                console.log('RES', res);

                w.wrapper.find('.price60-holder').html(res.data.p60);
                w.wrapper.find('.price75-holder').html(res.data.p75);
                w.wrapper.find('.price90-holder').html(res.data.p90);

                if(typeof cb == 'function'){
                    cb();
                }

            });




        },
        setHandlers: function(){

            w.wrapper.find('.vgf-third-inner').off('click').on('click', function(){

                w.wrapper.find('.vgf-third-inner').removeClass('active');
                $(this).addClass('active');


                w.wrapper.find('.vgf-form-holder').animate({
                    marginTop: 0
                }, 240, function(){

                });

            });

            w.wrapper.find('.vgf-form-confirm').off('click').on('click', function(){

                var name = w.wrapper.find('.vgf-order-name');
                var phone = w.wrapper.find('.vgf-order-phone');

                name.removeClass('invalid');
                phone.removeClass('invalid');

                var name_valid = true;
                var phone_valid = true;

                if(name.val().length == 0){
                    name.addClass('invalid');
                    name_valid = false;

                    setTimeout(function(){
                        name.removeClass('invalid');
                    },5000);

                }
                if(phone.val().length < 10){

                    phone.addClass('invalid');
                    phone_valid = false;

                    setTimeout(function(){
                        phone.removeClass('invalid');
                    },5000);
                }

                if(name_valid && phone_valid){

                    w.wrapper.find('.vgf-form-confirm').html('Подождите, пожалуйста...');


                    var o = {
                        command: 'request_from_site',
                        params: {
                            name: name.val(),
                            phone: phone.val(),
                            founding_amount: w.full_price,
                            payments_count: w.wrapper.find('.vgf-third-inner.active').attr('data-count'),
                            type: 'FINANCING_PRODUCT_ORDER'
                        }
                    };

                    console.log(o);

                    query(o, function(res){


                        console.log('RES', res);

                        if(res.code){

                            w.wrapper.find('.vgf-form-confirm').html('Отправить заявку');
                            return;
                        }

                        w.thanks();
                    });
                }
            });

            w.wrapper.find('.vgf-close').off('click').on('click', function(){

                w.wrapper.remove();

            });

        },
        thanks: function(){

            w.wrapper.find('.vgf-form-vagon').eq(0).animate({
                opacity: 0
            }, 50, function(){
                w.wrapper.find('.vgf-form-train').animate({
                    marginLeft: -100+'%'
                }, 180);
            });



        }
    };


    w.init();

}());

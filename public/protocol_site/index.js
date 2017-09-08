/**
 * Created by igoptarev on 28.05.2015.
 */
jQuery = $;
var loader, validator, formator, protocol;


$(document).ready(function () {
    var contentManipulation = {
        hideNotExpanded: function () {
            $('.slideBlock').find('.panel-body').not('.expanded').css({display: 'none'});
        },
        expandPanel: function (panel) {
            if (!panel) return;
            if (panel.hasClass('expanded')) {
                panel.removeClass('expanded');
                panel.slideUp();
            } else {
                panel.addClass('expanded');
                panel.slideDown();
            }
        },
        Loader: function(){
            var self = this;
            this.t1 = new Date();
            this.start = function(){
                self.t1 = new Date();
                console.log('loader Started');
            };
            this.stop = function(){
                var t2 = new Date();
                console.log('loader Stopped, Time ago: ',t2- self.t1);
            }
        },
        renderMethods: function () {

            var html = '';
            for (var key in methodos) {
                var method = methodos[key];
                html += '<a href="" class="list-group-item one_method" data-name="'+key+'" onclick="return false;">'+(method.name_ru || method.name)+'</a>';
            }
            $(".methods").html(html);
        },
        switch_method: function (method) {
            if (typeof method!=='object') return console.log('В switch_method передан не существующий метод.');
            if (protocol.sid) $('#span_for_sid').html(protocol.sid);
            console.log(method);
            $('.one_method .method_label').text(method.name_ru || method.name);
            var desc =  protocol.highlightXML(method.description || '', true);
            var descXML =  protocol.highlightXML(method.responseXML || '', true);
            var descJSON =  protocol.highlightJSON(method.responseJSON || '', true);
            $('.one_method .method_description').html(desc);
            $('.one_method .method_responseXML').html(descXML);
            $('.one_method .method_responseJSON').html(descJSON);
            var html = '';
            var tpl = '';
            for (var i in method.o.params) {
                var display = (method.o.params[i].required)? "inline" : "none";
                html += '<div class="form-group"><label>'+ i +' <span style="color:red; display:'+ display +';">*</span></label><input type="text" placeholder="'+ (method.o.params[i].description || "") +'" class="form-control method_params request_param '+method.name+' '+ i +'" data-name="' + i + '" value="'+ (method.o.params[i].value || method.o.params[i].default || "") +'"></div>';
            }
            $('.method_command').val(method.o.command);
            $('.method_object').val(method.o.object);
            $('.method_params_container').html(html);
            var changeParam = function (el) {
                var name = el.data('name');
                var val = el.val();
                method.o.params[name].value = val;
            };
            $('.method_params_container .method_params').off('change').on('change', function () {
                changeParam($(this));
            });
            $('#method_command').off('change').on('change', function () {
                method.o.command = $("#method_command").val();
            });
            $('#method_object').off('change').on('change', function () {
                method.o.object = $("#method_object").val();
            });
            $('.prepareRequest').off('click').on('click', function () {
                protocol.method = method;
                $('body').scrollTo('#requestHeader',300);
                protocol.doQuery(function (err, res) {
                    if (err) return;
                    //console.log(res);
                });
            });
        }

    };
    function init(){
        var errors = [];
        contentManipulation.hideNotExpanded();
        contentManipulation.renderMethods();
        setHandlers();
        //loader = new contentManipulation.Loader();
        loader = (typeof contentManipulation.Loader == 'function')? new contentManipulation.Loader() : !errors.push('Loader не обнаружен.');
        formator = (typeof Format=='function')? new Format() : !errors.push('Не подключен файл formating.js');
        validator = (typeof Validator=='function')? new Validator() : !errors.push('Не подключен файл validator.js');
        protocol = (typeof Protocol=='function')? new Protocol() : !errors.push('конструктор Protocol не определен');
        $('.methods a.one_method[data-name="get_actions"]').click();
        //contentManipulation.switch_method(methodos.login);
        //protocol.method = methodos.login;



        if (errors.length>0){
            console.log('=========ОШИБКИ ИНИЦИАЛИЗАЦИИ=====================================================');
            for (var i in errors) {
                console.log(errors[i]);
            }
            console.log('=========КОНЕЦ БЛОКА ОШИБКИ ИНИЦИАЛИЗАЦИИ=========================================');
        }
    }

    function setHandlers(){
        $('.slideBlockHead').off('click').on('click',function(){
            var panel = $(this).parents('.slideBlock').find('.panel-body');
            contentManipulation.expandPanel(panel);
        });
        $('input.request_param').off('focus').on('focus', function(){
            var oldBorderColor = $(this).data('oldBorderColor') || $(this).css('borderColor');
            $(this).css({borderColor:oldBorderColor});
        });
        $('.btn.sendRequestLogin').off('click').on('click',function(){
            protocol.method = methodos.login;
            protocol.doQuery(function(err,res){
                if (err) return;
                var sid;
                if (protocol.responseInXML){
                    sidS = res.match(/(<SID>)\w+<\/SID>/);
                    if (sidS.length>0)  sid = sidS[0].replace(/<SID>|<\/SID>/ig,'');
                }else{
                    res = res.results[0];
                    sid = res.sid;
                }
                if (sid) protocol.setSid(sid);

            });
        });
        $('.btn.sendRequest').off('click').on('click',function(){


        });
        $(".methods a.one_method").off('click').on('click', function () {
            $(".methods a.one_method").removeClass('active');
            $(this).addClass('active');
            var name = $(this).data('name');
            contentManipulation.switch_method(methodos[name]);

        })
    }
    init();



    /*var first6 = $('input.card_num.first6');
    var last4 = $('input.card_num.last4');
    var mm = $('input.validity.mm');
    var yyyy = $('input.validity.yyyy');
    var sign_in_btn = $('button.sign_in');
    var table_order_container = $('.table_order_container');
    var myModalTickets = $('#myModalTickets');
        first6.mask("999999", {
        completed: function () {
            last4.focus();
        }
    });
    last4.mask("9999", {
        completed: function () {
            mm.focus();
        }
    });
    mm.mask("99", {
        completed: function () {
            yyyy.focus();
        }
    });
    yyyy.mask("9999", {
        completed: function () {
            sign_in_btn.focus();
        }
    });
    first6.focus();
    var auth = {
        pan_mask:'|',
        exp_year:'',
        exp_month:''
    };
    sign_in_btn.off('click').on('click', function () {
        if (!first6.val() || !last4.val() || !mm.val() || !yyyy.val()){
            first6.focus();
            return toastr.error('Заполните все поля.');
        }
        auth.pan_mask = first6.val()+'|'+last4.val();
        auth.exp_year = yyyy.val();
        auth.exp_month = mm.val();
        var o = {
            command:'get_order_by_card'
        };
        o.params = auth;

        query(o,function(res){
            if (+res.code){
                return toastr[res.type](res.message);
            }
            var orders = jsonToObj(res.data);
            for (var i in orders) {
                orders[i]['ORDER_ID_SHOW'] = +orders[i]['EXTERNAL_ORDER_ID_LIST'] || orders[i]['ORDER_ID'];
                orders[i]['ACTION_LIST'] = orders[i]['ACTION_LIST'].replace(/\([0-9]+\)/,'');
            }



            var tpl = '<table class="table table-striped">' +
                '<thead>' +
                '<tr>' +
                '<td>№</td>' +
                '<td>Дата заказа</td>' +
                '<td>Сумма</td>' +
                '<td>Мероприятия</td>' +
                '<td>Список мест</td>' +
                '</tr>' +
                '</thead><tbody>' +
                '{{#orders}}'+
                '<tr class="order_row link" data-id="{{ORDER_ID}}" data-show-id="{{ORDER_ID_SHOW}}">' +
                '<td>{{ORDER_ID_SHOW}}</td>' +
                '<td>{{ORDER_DATE}}</td>' +
                '<td>{{PAYMENT_AMOUNT}}</td>' +
                '<td>{{ACTION_LIST}}</td>' +
                '<td>{{PLACE_LIST}}</td>' +
                '</tr>' +
                '{{/orders}}' +
                '</tbody></table>';
            var ordersArr = [];
            for (var i in orders) {
                ordersArr.push(orders[i]);
            }
            var obj = {
                orders:ordersArr
            };
            table_order_container.html(Mustache.to_html(tpl, obj));

            table_order_container.find('.link.order_row').off('click').on('click',function(){
                var order_id = $(this).data('id');
                var order_id_show = $(this).data('show-id');
                o.command = 'get_order_ticket_by_card';
                o.params.order_id = order_id;
                query(o,function(res){
                    if (res.code){
                        return toastr[res.type](res.message);
                    }
                    var tickets = jsonToObj(res.data);
                    *//*for (var j in tickets) {
                        tickets[j]['ORDER_ID_SHOW'] = +tickets[j]['EXTERNAL_ORDER_ID'] || tickets[j]['ORDER_ID'];
                    }*//*
                    console.log("tickets by order "+order_id,tickets);

                    var tpl = '<table class="table table-striped table_ticket">' +
                        '<thead>' +
                        '<tr>' +
                        '<td>№</td>' +
                        '<td>Мероприятия</td>' +
                        '<td>Трибуна</td>' +
                        '<td>Сектор</td>' +
                        '<td>Ряд</td>' +
                        '<td>Место</td>' +
                        '<td>Скачать</td>' +
                        '</tr>' +
                        '</thead><tbody>' +
                        '{{#tickets}}'+
                        '<tr data-id="{{ORDER_TICKET_ID}}">' +
                        '<td>{{ORDER_TICKET_ID}}</td>' +
                        '<td>{{ACTION}}</td>' +
                        '<td>{{TRIBUNE}}</td>' +
                        '<td>{{AREA_GROUP}}</td>' +
                        '<td>{{LINE}}</td>' +
                        '<td>{{PLACE}}</td>' +
                        '<td class="center"><div data-id="{{ORDER_TICKET_ID}}" class="download link fa fa-download ticket_row"></div></td>' +
                        '</tr>' +
                        '{{/tickets}}' +
                        '</tbody></table>';
                    var ticketsArr = [];
                    for (var i in tickets) {
                        ticketsArr.push(tickets[i]);
                    }
                    var obj = {
                        tickets:ticketsArr
                    };
                    bootbox.dialog({
                        message:Mustache.to_html(tpl, obj),
                        title: "Билеты по заказу №: "+order_id_show,
                        buttons: {
                            close: {
                                label: "Закрыть",
                                className: "green"
                            }
                        }
                    });


                    $('.table_ticket').find('.link.ticket_row').off('click').on('click',function(){
                        var ticket_id = $(this).data('id');
                        o.command = 'get_ticket_pdf_by_card';
                        o.params.order_ticket_id = ticket_id;

                        var timeOut = toastr.options.timeOut;
                        var extendedTimeOut = toastr.options.extendedTimeOut;
                        toastr.options.timeOut = 1000000;
                        toastr.options.extendedTimeOut = 100;
                        var info = toastr.info('Идет процесс формирования билета...');
                        toastr.options.timeOut = timeOut;
                        toastr.options.extendedTimeOut = extendedTimeOut;

                        query(o,function(res) {
                            info.fadeOut(600);
                            if (+res.code) {
                                return toastr[res.type](res.message);
                            }
                            var filename = res.data.filename;
                            var id = 'need_be_removed'+ticket_id;
                            $("body").prepend('<a style="display:none;" id="'+ id +'" href="'+ host +'/' + filename +'" download></a>');
                            var btn = $('#'+id);
                            btn.on("click",function (e) {
                                $(this).remove();
                            });
                            btn[0].click();
                            toastr.success('Готово');
                        });
                    });

                });
            });
        })
    });

    //--------------------------------------------------------
    var query = function (obj, callback) {
        if (typeof callback !== "function") callback = function () {
        };
        if (typeof obj !== "object") {
            console.log('Не переданы необходимые параметры', obj);
            return callback({code: -1, type: 'error', message: 'Не переданы необходимые параметры'});
        }
        var request = makeQuery(obj);
        console.log(request);
        $.jsonp({
            type: 'GET',
            url: host + '/cgi-bin/b2e?request=' + request,
            *//*url: 'http://yandex.ru/404',*//*
            callbackParameter: 'callback',
            dataType: 'jsonp',
            timeout: 10000,
            success: function(res){
                res = res.results[0];
                if (+res.code) {
                    console.log(res.toastr.message);
                    return callback({code: -1, type: 'error', message: 'Сервер временно недоступен.'});
                }
                if (res.toastr){
                    console.log(res.toastr.message);
                    callback({code:0,type:'success',message:'Сервер временно недоступен.',data:res});
                }else{
                    callback({code:0,type:'success',message:'OK',data:res});
                }
            },
            error: function(){
                console.log('Сервер временно недоступен.');
                return callback({code: -1, type: 'error', message: 'Сервер временно недоступен.'});
            }
        });
    }
*/



});
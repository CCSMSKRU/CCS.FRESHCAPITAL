var socketReadyFlag = false;
var documentReadyFlag = false;
String.prototype.replaceAll = function (search, replace) {
	return this.split(search).join(replace);
};


$(document).ready(function () {
    documentReadyFlag = true;
    (function () {
        var hDD = $('.headerDD');

        var headerDDClass = {
            setPosition: function (item) {
                var pos = item.data('position');
                var content = item.find('.hDDcontent');
                var itemWidth = item.data('width');
                item.attr('style', pos + ':0;');
                //item.css(pos, 0);
                content.css('marginRight', -itemWidth + 'px');
                //item.css('width', itemWidth+'px');
            },
            initHandlers: function (item) {
                var parent = item.data('parent'),
                    owners = $('[data-owner=' + parent + ']'),
                    pos = item.data('position'),
                    itemWidth = item.data('width'),
                    close = item.find('.closehDD'),
                    lgout = item.find('.logout'),
                    content = item.find('.hDDcontent'),
                    closeItem = function () {
                        item.hide(400);
                        content.animate({
                            marginRight: -itemWidth + 'px'
                        }, 300);
                        item.animate({
                            width: 0
                        }, 400, 'easeOutCubic');
                        return false;
                    };


                owners.each(function (index, ownerItem) {
                    $(ownerItem).on('click', function () {
                        item.show(0);
                        content.animate({
                            marginRight: 0
                        }, 500);
                        item.animate({
                            width: itemWidth + 'px'
                        }, 400, 'easeOutCubic');

                    });
                });

                close.on('click', closeItem);
                lgout.on('click', closeItem);

            }
        };

        for (var i in hDD) {
            headerDDClass.setPosition(hDD.eq(i));
            headerDDClass.initHandlers(hDD.eq(i));
        }

    }());

    $('#logo').off('click').on('click', function () {
        document.location.reload();
    });

    $('#call_print_stack').off('click').on('click', function () {
        var contentId = MB.Core.guid();
        var content = MB.Core.switchModal({
            type: 'content',
            isNew: true,
            id: contentId,
            filename: 'printStack',
            eternal: true,
            params: {
                activeId: 'activeId',
                label: 'Процесс печати',
                title: 'Процесс печати'
            }
        }, function (content) {
            content.setHandlers();
            //content.renderTickets();
        });
//
//		var content = new MB.ContentNew({
//			id: contentId,
//			filename: 'printStack',
//			params: {
//				activeId: 'activeId',
//				label: 'Процесс печати',
//				title: 'Процесс печати'
//			}
//		});
//		content.create(function(){
//            content.renderTickets();
//        });

    });

    $('.incQuotaCtrl').off('click').on('click', function () {
        MB.Core.switchModal({
            type: "form",
            filename: "form_get_quota",
            name: "form_get_quota",
            isNewModal: true,
            ids: ['new'],
            master: true,
            params: {
                title: 'Полчение квоты',
                label: 'Полчение квоты'
            }
        });
    });


//    MB.Core.searchSelectID = MB.Core.guid();
//    var searchSelectInstance = MB.Core.select3.init({
//        id: MB.Core.searchSelectID,
//        wrapper: $('#search'),
//        getString: 'main_search',
//        column_name: '',
//        view_name: 'main_search',
//        value: {
//            id: '',
//            name: ''
//        },
//        data: [],
//        fromServerIdString: '',
//        fromServerNameString: '',
//        searchKeyword: 'SEARCH_FIELD',
//        withEmptyValue: true,
//        absolutePosition: true,
//        isFilter: false
//    });


    MB.Core.resizeWindows = function () {
        var headerH = $('.header').eq(0).outerHeight();
        var footerH = $('#mw-footerPanel').outerHeight();
        var winH = $(window).height();
        $('#mainMenu').height(winH - (headerH + footerH) + 'px');
        $('#fixHeightContent').height(winH - (headerH + footerH) + 'px');
    };

    MB.Core.resizeWindows();
    $(window).resize(function () {
        MB.Core.resizeWindows();
    });


    (function () {

        var afisha = {
            init: function () {
                afisha.getData(function () {
                    afisha.renderAfisha(function () {
                        afisha.setHandlers(function () {

                        });
                    });
                });
            },
            getData: function (callback) {
                var o = {
                    command: 'operation',
                    object: 'check_user_access_to_opeartion',
                    params: {
                        check_command: 'get',
                        check_object: 'actions_for_sale'
                    }
                };
                socketQuery(o, function (res) {
                    var r = socketParse(res, {noToastr: true});
                    if (r.result === "TRUE") {
                        var o = {
                            command: 'get',
                            object: 'actions_for_sale'
                        };
                        socketQuery(o, function (res) {
                            afisha.data = socketParse(res);
                            if (typeof callback == 'function') {
                                callback();
                            }
                        });
                    }
                });


            },
            resize: function () {
                afisha.innerBlocks.each(function (index, elem) {
//					console.log(elem);
                    $(elem).width($(elem).outerHeight() + 'px');
                });
            },
            renderAfisha: function (callback) {
                var colWidth = ($(window).width() >= 1600) ? 'col-md-4' : 'col-md-6';
                var tpl = '<div class="row afisha-wrapper">{{#actions}}' +
                    '<div class="' + colWidth + ' afisha-item" data-id="{{id}}" data-hall="{{hall}}" data-action_with_date="{{action_with_date}}">' +
                    '<div class="afisha-item-wrapper">' +
                    '<div class="afisha-item-image-wrapper" style="background-image: url(\'{{poster}}\')"></div>' +
                    '<div class="afisha-item-top-bar">' +
                    '<div class="afisha-item-datetime">{{datetime}}</div>' +
                    '<div class="afisha-item-hall">{{hall}}</div>' +
                    '<div class="afisha-item-age">{{age_category}}</div>' +
                    '</div>' +
                    '<div class="afisha-item-title-bar">{{title}}<div class="afisha-item-fpc">Свободных мест: {{free_place_count}}</div></div>' +
                    '</div></div>{{/actions}}</div>';
                var mO = {
                    actions: []
                };
                var container = $('.page-content-wrapper');

                for (var i in afisha.data) {
                    var action = afisha.data[i];
                    mO.actions.push({
                        id: action['ACTION_ID'],
                        poster: (action['ACTION_POSTER_IMAGE'].indexOf('http') > -1) ? action['ACTION_POSTER_IMAGE'] : 'assets/img/afisha_default.png',
                        title: action['ACTION_NAME'],
                        action_with_date: action['ACTION_NAME'] + ' ' + action['ACTION_DATE'],
                        datetime: action['ACTION_DATE'],
                        hall: action['HALL_NAME'],
                        age_category: action['AGE_CATEGORY'],
                        free_place_count: action['FREE_PLACE_COUNT']
                    });
                }

                container.html(Mustache.to_html(tpl, mO));
                afisha.container = container;
                afisha.items = container.find('.afisha-item');
                afisha.innerBlocks = container.find('.afisha-item-wrapper');
                if (typeof callback == 'function') {
                    callback();
                }
            },
            setHandlers: function (callback) {

                afisha.items.off('click').on('click', function () {
                    var actionId = $(this).data('id');
                    var action;
                    var label = $(this).data('action_with_date') + ' | ' + $(this).data('hall');
//					console.log(afisha.data);
                    for (var i in afisha.data) {
                        if (afisha.data[i]['ACTION_ID'] == actionId) {
                            action = afisha.data[i];
                            break;
                        }
                    }
                    var isWithPlaces = afisha.data[i]['ACTION_TYPE'] != 'ACTION_WO_PLACES';
                    if (isWithPlaces) {
                        MB.Core.switchModal({
                            type: "content",
                            isNew: true,
                            filename: "one_action",
                            params: {
                                activeId: actionId,
                                action_id: actionId,
                                action: action,
                                title: label,
                                label: 'Продажа',
                                action_name: label
                            }
                        });
                    } else {
                        var o = {
                            command: 'get',
                            object: 'action_scheme_ticket_zone',
                            params: {
                                where: 'action_id = ' + actionId
                            }
                        };
                        socketQuery(o, function (res) {
                            res = JSON.parse(res);
                            res = res['results'][0];

                            var n = res.data_columns;
//							console.log(n)
                            var d = res.data;
                            var tpl = '{{#zones}}<div data-id="{{id}}" class="row marTop10 wp-zone-item"><div class="col-md-12"><div class="form-group"><label class="control-label">{{label}} (Осталось билетов: {{max}} стоимость: {{price}})</label><input max="{{max}}" min="0" class="col-md-6 form-control orderTicketCount marTop5" type="number" value=""/></div></div></div>{{/zones}}';
                            var mo = {
                                zones: []
                            };
                            for (var i in d) {
                                var it = d[i];
                                var to = {
                                    id: it[n.indexOf('ACTION_SCHEME_TICKET_ZONE_ID')],
                                    label: it[n.indexOf('NAME')],
                                    max: it[n.indexOf('FREE_TICKET_COUNT')],
                                    price: it[n.indexOf('TICKET_PRICE')]
                                };
                                mo.zones.push(to);
                            }
                            var me = bootbox.dialog({
                                title: 'Выберите входные билеты',
                                message: ' ' + Mustache.to_html(tpl, mo),
                                buttons: {
                                    ok: {
                                        label: "Ок",
                                        className: "blue",
                                        callback: function () {
                                            var o = {
                                                command: 'operation',
                                                object: 'create_to_pay_order_without_places',
                                                action_id: actionId,
                                                action_scheme_ticket_zone_id: [],
                                                ticket_count: []
                                            };
                                            $('.wp-zone-item').each(function () {
                                                var t = $(this);
                                                var id = t.attr('data-id');
                                                var val = t.find('.orderTicketCount').val();
                                                if (!val) return;
                                                o.action_scheme_ticket_zone_id.push(id);
                                                o.ticket_count.push(val);
                                            });
                                            socketQuery(o, function (res) {
                                                if (!(res = socketParse(res))) return;
                                                me.modal('hide');
                                                var formId = MB.Core.guid();
                                                var form = new MB.FormN({
                                                    id: formId,
                                                    name: 'form_order',
                                                    type: 'form',
                                                    ids: [res.order_id]
                                                });
                                                form.create();
                                            });
                                            return false;
                                        }
                                    },
                                    cancel: {
                                        label: "Отмена",
                                        className: "blue",
                                        callback: function () {
                                        }
                                    }
                                }
                            });
                        });
                    }
                });

                if (typeof callback == 'function') {
                    callback();
                }
            }
        };
        return false;

        $(document).on('socket_ready_event', function(){
            afisha.init();
            MB.Core.afisha = afisha;
        });

    }());

    (function () {

        $(document).ready(function(){
            return;
            socketQuery({
                command: 'get',
                object: 'user',
                params: {
                    where: "login= '" + MB.User.username + "'"
                }
            }, function (res) {
                res = socketParse(res);
                MB.User.fullname = res[0]['FULLNAME'];
                MB.User.photo_url = (res[0]['URL_USER_FOTO'].length > 0)? 'upload/'+res[0]['URL_USER_FOTO'] : 'assets/img/userImg.png';
                //MB.User.photo = res['PHOTO'];
                $('.userName').html(MB.User.fullname);
                $('#userImg').attr('style', 'background-image: url("'+MB.User.photo_url+'");');
                $('#userBlock .hDDtitle').attr('style', 'background-image: url("'+MB.User.photo_url+'");');
            });
        });
    }());

    (function () {
        var searchWrapper = $("#search"), //mainSearch / main search
            searchInput = searchWrapper.find('input'),
            resultsWrapper = searchWrapper.find('.resultsWrapper'),
            ul = resultsWrapper.find('.resultsList'),
            hint = resultsWrapper.find('.resultsHint'),
            defaultHint = 'Введите ещё хотя бы <span>2</span> символа';

        searchInput.on('input', function () {
            var t = $(this),
                val = t.val(),
                a = (val.length) ? '' : 'а';
            if (val.length < 2) {
                ul.empty();
                hint.html('Введите ещё хотя бы <span>' + (2 - val.length) + '</span> символ' + a).show();
                return;
            }
            socketQuery({
                command: 'get',
                object: 'main_search',
                params: {
                    search_string: val
                }
            }, function (res) {
                res = JSON.parse(res).results[0];
                if (val == t.val()) {
                    searchInput.trigger('main_search_response');
                    showResults(res);
                }
            });
            hint.html('').hide();
        }).on('focus', function () {

            hint.html(defaultHint).hide();
            resultsWrapper.fadeIn(150);
        });

        searchWrapper.on('click', function (e) {
            e.stopPropagation();
        });

        $(document).on('click', function (e) {
            if (!$(this).parents('#search').length) {
                hideResults();
            }

            if ($(e.target).parents('.clientScreenCtrlPanel').length == 0 && !$(e.target).hasClass('clientScreenCtrlPanel') &&
                $(e.target).parents('.clientScreenCtrl').length == 0 && !$(e.target).hasClass('clientScreenCtrl') &&
                $(e.target).parent().parent().parent().parent().parents(".datepicker").length == 0 && !$(e.target).hasClass('datepicker')) {
                $(".clientScreenCtrlPanel").removeClass("cSCPShown");
            }
        });

        ul.on('click', 'li', function () {
            var form = new MB.FormN({
                id: MB.Core.guid(),
                name: $(this).attr('data-form'),
                type: 'form',
                ids: [$(this).attr('data-id')]
            });
            form.create(function () {
                hideResults();
            });
        });

        function showResults(obj) {
            var results = '';
            if (!obj.data.length) {
                ul.html('<li>Ничего не найдено</li>');
                return;
            }
            var objId = obj.data_columns.indexOf("OBJ_ID"),
                info = obj.data_columns.indexOf("INFO"),
                openFormClientObject = obj.data_columns.indexOf("OPEN_FORM_CLIENT_OBJECT");
            for (var i in obj.data) {
                results += '<li data-id="' + obj.data[i][objId] + '" data-form="' + obj.data[i][openFormClientObject] + '">' + obj.data[i][info] + '</li>';
            }
            ul.html(results);
        }

        function hideResults() {
            resultsWrapper.fadeOut(150);
            ul.empty();
            searchInput.val('');
        }

        var selVenueInst, selGenreInst;

        function showOnScreen() {
            var title = "БЛИЖАЙШИЕ";
            if ($(".cSCP_btn_time.cSCP_btn_clicked_style").length > 0) {
                title = $(".cSCP_btn_time.cSCP_btn_clicked_style").text() == "Ближайшие выходные" ? "На выходных" :
                    $(".cSCP_btn_time.cSCP_btn_clicked_style").text() == "Следующая неделя" ? "На следующей неделе" :
                        $(".cSCP_btn_time.cSCP_btn_clicked_style").text();
            } else {
                if ($(".clientScreenCP_child.cSCP_btn_clicked_style").length > 0) {
                    title = $(".clientScreenCP_child.cSCP_btn_clicked_style").text();
                } else {
                    if (selGenreInst.value.id > 0) {
                        title = selGenreInst.value.name;
                    } else {
                        if (selVenueInst.value.id > 0) {
                            title = selVenueInst.value.name;
                        } else {
                            if ($(".clientScreenCP_till input").val()) {
                                title = $(".clientScreenCP_since input").val().replace(/[0-9]{4}/, function (str) {
                                    return str.substring(2, 4);
                                });
                                title += " - " + $(".clientScreenCP_till input").val().replace(/[0-9]{4}/, function (str) {
                                    return str.substring(2, 4);
                                });
                            }
                        }
                    }
                }
            }

            toClientscreen({
                type: "list",
                venue: selVenueInst.value,
                genre: selGenreInst.value,
                fromDate: $(".clientScreenCP_since input").val(),
                toDate: $(".clientScreenCP_till input").val(),
                isChildish: $('.clientScreenCP_child').hasClass("cSCP_btn_clicked_style"),
                title: title
            });
        }

        $('#mainPanel .clientScreenCtrl, #mainPanel  .clientScreenCtrl_icon').on('click', function () {
            if (!$('#mainPanel .clientScreenCtrl').hasClass("initted")) {
                $(".clientScreenCP_since input").datepicker2({
                    format: "dd.mm.yyyy",
                    weekStart: 1
                });
                $(".clientScreenCP_till input").datepicker2({
                    format: "dd.mm.yyyy",
                    weekStart: 1
                });
                $(".clientScreenCP_since input").datepicker("setValue", new Date());

                var o1 = {
                    command: "get",
                    object: "show_genre"
                };
                socketQuery(o1, function (data) {
                    var obj = socketParse(data);
                    var select = "";
                    for (var o in  obj) {
                        select += "<option value='" + obj[o]['SHOW_GENRE_ID'] + "'>";
                        select += obj[o]['NAME'] + "</option>";
                    }
                    $(".clientScreenCP_genre").find(".cSCP_select3_selector select").html(select);
                    selGenreInst = $(".clientScreenCP_genre").find(".cSCP_select3_selector select").select3();
                });
                var o2 = {
                    command: "get",
                    object: "venue"
                };
                socketQuery(o2, function (data) {
                    var obj = socketParse(data);
                    var select = "";
                    for (var o in  obj) {
                        select += "<option value='" + obj[o]['VENUE_ID'] + "'>";
                        select += obj[o]['NAME'] + "</option>";
                    }
                    $(".clientScreenCP_area").find(".cSCP_select3_selector select").html(select);
                    selVenueInst = $(".clientScreenCP_area").find(".cSCP_select3_selector select").select3();
                });

                $('#mainPanel .clientScreenCtrl').addClass("initted");
            }
            $(".clientScreenCtrlPanel").toggleClass("cSCPShown");
        });

        $('#mainPanel .cSCP_close_icon').on('click', function () {
            $(".clientScreenCtrlPanel").removeClass("cSCPShown");
        });

        $('#mainPanel .cSCP_refresh_icon').on('click', function () {
            $('.cSCP_btn_clicked_style').toggleClass("cSCP_btn_clicked_style");

            $(".clientScreenCP_since input").datepicker("setValue", new Date());
            $(".clientScreenCP_till input").val("");

            selVenueInst.value.id = '-1';
            selVenueInst.value.name = 'Выбрать';
            selVenueInst.setValue();

            selGenreInst.value.id = '-1';
            selGenreInst.value.name = 'Выбрать';
            selGenreInst.setValue();

            showOnScreen();
        });

        $('.cSCP_btn_time').on('click', function (e) {
            if ($(e.currentTarget).hasClass("cSCP_btn_clicked_style")) {
                $(".cSCP_btn_time.cSCP_btn_clicked_style").toggleClass("cSCP_btn_clicked_style");

                $(".clientScreenCP_since input").datepicker("setValue", new Date());
                $(".clientScreenCP_till input").val("");
            } else {
                $(".cSCP_btn_time.cSCP_btn_clicked_style").toggleClass("cSCP_btn_clicked_style");
                $(e.currentTarget).toggleClass("cSCP_btn_clicked_style");

                if ($(e.currentTarget).hasClass('clientScreenCP_today')) {
                    var today = new Date();
                    $(".clientScreenCP_since input").datepicker("setValue", today);
                    today.setDate(today.getDate() + 1);
                    $(".clientScreenCP_till input").datepicker("setValue", today);
                }
                if ($(e.currentTarget).hasClass('clientScreenCP_tomor')) {
                    var today = new Date();
                    today.setDate(today.getDate() + 1);
                    $(".clientScreenCP_since input").datepicker("setValue", today);
                    today.setDate(today.getDate() + 1);
                    $(".clientScreenCP_till input").datepicker("setValue", today);
                }
                if ($(e.currentTarget).hasClass('clientScreenCP_weekend')) {
                    var curr = new Date();
                    var satDay = new Date();
                    var sunDay = new Date();
                    satDay.setDate(satDay.getDate() - satDay.getDay() + 6);
                    sunDay.setDate(sunDay.getDate() - sunDay.getDay() + 8);

                    $(".clientScreenCP_since input").datepicker("setValue", satDay);
                    $(".clientScreenCP_till input").datepicker("setValue", sunDay);
                }
                if ($(e.currentTarget).hasClass('clientScreenCP_nextweek')) {
                    var curr = new Date();
                    var monDay = new Date();
                    var monDay2 = new Date();
                    monDay.setDate(monDay.getDate() - monDay.getDay() + 8);
                    monDay2.setDate(monDay2.getDate() - monDay2.getDay() + 15);

                    $(".clientScreenCP_since input").datepicker("setValue", monDay);
                    $(".clientScreenCP_till input").datepicker("setValue", monDay2);
                }
            }

            showOnScreen();
        });

        $('.clientScreenCP_child').on('click', function (e) {
            $(e.currentTarget).toggleClass("cSCP_btn_clicked_style");

            showOnScreen();
        });

        $('.cSCP_select_style input').on('click', function () {
            $(".cSCP_btn_time.cSCP_btn_clicked_style").toggleClass("cSCP_btn_clicked_style");

            showOnScreen();
        });

        $('#mainPanel .clientScreenCtrlPanelShow .cSCP_show_label').on('click', function () {
            showOnScreen();
        });
    }());



});

//$(document).on('socket_ready', function(){
//    if(!socketReadyFlag){
//        $(document).trigger('socket_ready_event');
//        socketReadyFlag = true;
//    }
//});
//
//$(document).on('socket_ready', function(){
//    if(!socketReadyFlag){
//        $(document).trigger('socket_ready_event');
//        socketReadyFlag = true;
//    }
//});

var getF = function(){
    DOQuery({command:"GET_FILE",filename:''}, function(r){
        console.log(r);
        var filename = r.filename;
        $("body").prepend('<a id="need_be_removed" href="http://192.168.2.70/'+ filename +'" download>TEST</a>');
        $('#need_be_removed').on("click",function (e) {
            $("#need_be_removed").remove();
        });


    });
};
var merge = function(){
    DOQuery({command:"merge",filename:''}, function(r){
        console.log(r);


    });
};


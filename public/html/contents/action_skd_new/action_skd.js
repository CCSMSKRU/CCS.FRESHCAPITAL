(function () {
    var contentID = MB.Contents.justAddedId;
    var contentInstance = MB.Contents.getItem(contentID);
    var contentWrapper = $('#mw-' + contentInstance.id);
    var modalInstance = MB.Core.modalWindows.windows.getWindow(contentID);
    modalInstance.stick = 'top';
    modalInstance.stickModal();

    var action_skd_map;
    var entryTickets;
    var sid = MB.User.sid;
    var environment = contentInstance;
    var splitByAreaGroups = environment.params.action['SPLIT_BY_AREA_GROUP'] == "TRUE";
    var scaleByBackground = environment.params.action['SCALE_BY_BACKGROUND'] == "TRUE";
    var actionType = environment.params.action['ACTION_TYPE'];
    var activeActionIsWo = actionType == "ACTION_WO_PLACES";
    var lastSelectedSector;

    var mapContainer = contentWrapper.find(".box_for_canvas");
    var isSectors = false;
    var countEnterInSectors, countEnterInZones;

    entryTickets = new EntryTickets({
        parent: mapContainer,
        actionId: environment.activeId,
        canvasHeight: $(window).height() - 95,
        limit: 100
    });
    entryTickets.init(function () {
        var w = $(window).width() - 440;
        contentWrapper.find(".action-skd-short-info").css("left", (w - 210) + "px");
        contentWrapper.find(".action-skd-short-info-in").html(0);
        contentWrapper.find(".action-skd-short-info-out").html(0);
        if (activeActionIsWo) {
            console.log("activeActionIsWo");
            MB.Core.spinner.start(mapContainer);
            renderSideBarTable(function () {
                setSideBar("action_wo");
                MB.Core.spinner.stop(mapContainer);
            });
        } else {
            action_skd_map = new Map1({
                container: mapContainer,
                cWidth: w,
                cHeight: $(window).height() - 93,
                mode: "skd",
                doc_root: connectHost + "/",
                scaleByBackground: scaleByBackground,
                colorSelected:"#ff0"
            });
            entryTickets.map = action_skd_map;
            MB.User.map = action_skd_map;
            renderSideBarTable(function () {

                var socketObject = {
                    sid: sid,
                    type: "action_scheme",
                    param: "action_id",
                    id: environment.activeId,
                    portion: 200,
                    save: {
                        command: "operation",
                        object: "block_place_list",
                        params: {
                            action_id: environment.activeId
                        },
                        field_name: "action_scheme_id"
                    },
                    load: {
                        command: "get",
                        object: "action_scheme",
                        params: {
                            action_id: environment.activeId
                        },
                        /*columns: "ACTION_SCHEME_ID,PRICE,STATUS,STATUS_TEXT,FUND_GROUP_NAME,PRICE_GROUP_NAME,BLOCK_COLOR,COLOR",*/
                        field_name: "action_scheme_id"
                    }
                };
                var sectorO = {
                    command: "get",
                    object: "action_scheme_area_group",
                    params: {
                        where: "ACTION_ID = " + environment.activeId
                    }
                };

                var squareO = {
                    command: "get",
                    object: "action_scheme_enter_in_hall", //Какая команда для СКД
                    sid: sid,
                    params: {
                        action_id: environment.activeId
                    }
                };
                var layerO = {
                    command: "get",
                    object: "action_scheme_layer",
                    sid: sid,
                    params: {
                        action_id: environment.activeId,
                        where: " VISIBLE_CASHER='TRUE'",
                        columns: "ACTION_SCHEME_LAYER_ID",
                        order_by: "SORT_NO"
                    }
                };
                var objectO = {
                    command: "get",
                    object: "action_scheme_object",
                    sid: sid,
                    where_field: "ACTION_SCHEME_LAYER_ID",
                    params: {
                        action_id: environment.activeId,
                        order_by: "SORT_NO"
                    }
                };

                if (splitByAreaGroups) {
                    action_skd_map.loadSectors({
                        socketObject: socketObject,
                        squareO: squareO,
                        layerO: layerO,
                        objectO: objectO,
                        sectorO: sectorO,
                        action_id: objectO.params.action_id
                    }, function () {
                        action_skd_map.loadRenderItems({
                            layerO: layerO,
                            objectO: objectO
                        }, function () {
                            var sectors = action_skd_map.sectors;
                            for (var i in countEnterInSectors) {
                                if (countEnterInSectors.hasOwnProperty(i)) {
                                    var countsInSector = countEnterInSectors[i];
                                    for (var j in sectors) {
                                        if (sectors.hasOwnProperty(j)) {
                                            var sector = sectors[j];
                                            if (sector.action_group_id == countsInSector.AREA_GROUP_ID) {
                                                sector["entered_places"] = countsInSector["ENTERED_PLACES"];
                                                sector["not_entered_places"] = countsInSector["NOT_ENTERED_PLACES"];
                                                break;
                                            }
                                        }
                                    }
                                }
                            }

                            var zones = entryTickets.ticketZones;
                            for (var i in countEnterInZones) {
                                if (countEnterInZones.hasOwnProperty(i)) {
                                    var countsInZone = countEnterInZones[i];
                                    for (var j in zones) {
                                        if (zones.hasOwnProperty(j)) {
                                            var zone = zones[j];
                                            if (zone.ACTION_SCHEME_TICKET_ZONE_ID == countsInZone.ACTION_SCHEME_TICKET_ZONE_ID) {
                                                zone["entered_places"] = countsInZone["ENTERED_PLACES"];
                                                zone["not_entered_places"] = countsInZone["NOT_ENTERED_PLACES"];
                                                zone["sold_places"] = countsInZone["SOLD_PLACES"];
                                                break;
                                            }
                                        }
                                    }
                                }
                            }

                            isSectors = true;
                            entryTickets.close();
                            setSideBar("sectors");
                            action_skd_map.render();
                            MB.Core.spinner.stop(mapContainer);
                            action_skd_map.loading = false;
                        });
                    });
                } else {
                    action_skd_map.loadSquares(squareO, function () {
                        action_skd_map.loadRenderItems({
                            layerO: layerO,
                            objectO: objectO
                        }, function () {
                            action_skd_map.render();
                            MB.Core.spinner.stop(mapContainer);
                        });

                        var zones = entryTickets.ticketZones;
                        for (var i in countEnterInZones) {
                            if (countEnterInZones.hasOwnProperty(i)) {
                                var countsInZone = countEnterInZones[i];
                                for (var j in zones) {
                                    if (zones.hasOwnProperty(j)) {
                                        var zone = zones[j];
                                        if (zone.ACTION_SCHEME_TICKET_ZONE_ID == countsInZone.ACTION_SCHEME_TICKET_ZONE_ID) {
                                            console.log("zone:", zone);
                                            zone["entered_places"] = countsInZone["ENTERED_PLACES"];
                                            zone["not_entered_places"] = countsInZone["NOT_ENTERED_PLACES"];
                                            zone["sold_places"] = countsInZone["SOLD_PLACES"];
                                            break;
                                        }
                                    }
                                }
                            }
                        }

                        isSectors = false;
                        entryTickets.check("squares", false, true);
                        setSideBar("squares");
                        action_skd_map.setLayout(function () {
                            action_skd_map.setMinMax(function () {
                                action_skd_map.setScaleCoff(function () {
                                    action_skd_map.render(function () {
                                        action_skd_map.reLoadLayout(function () {
                                        });
                                    });

                                    action_skd_map.setEvents();
                                });

                            });
                        });
                    });
                }
            });
        }
    });

    function sectorClickHandler() {
        action_skd_map.selection = [];
        var sectorSelected = false;
        var selectedSectors = [];
        for (var i in action_skd_map.sectors) {
            var sec = action_skd_map.sectors[i];
            if (sec.selected) {
                lastSelectedSector = sec;
                sectorSelected = true;
                selectedSectors.push(sec);
            }
        }
        if (!sectorSelected) {

        } else {
            MB.Core.spinner.start(mapContainer);

            action_skd_map.sectorsSelect(function () {
                isSectors = false;
                entryTickets.check("squares", false, true);
                setSideBar("squares");
                MB.Core.spinner.stop(mapContainer);
            });
        }
    }



    var autoReloadTimer = function (percent) {
        var time = (+action_skd_map.autoReloadTime || 20) * 1000;
        var step = time / 100;
        percent = percent || 0;
        var autoReloadMapProgress = action_skd_map.autoReloadMapProgress || contentWrapper.find('.autoReloadMapContainer .autoReloadMapProgress');
        setTimeout(function () {
            if (action_skd_map.autoReloadEnabled) {
                percent++;
                autoReloadMapProgress.css("width", percent + "%");
                console.log(percent);
                if (percent >= 100) {
                    return reloadMap();
                }
                autoReloadTimer(percent);
            }else{
                percent = 0;
                autoReloadMapProgress.css("width", percent + "%");
            }
        }, step)
    };
    var reloadMap = function () {
        if (!action_skd_map.mapIsReloading){
            action_skd_map.mapIsReloading = true;
            MB.Core.spinner.start(mapContainer);
            if (action_skd_map != undefined && typeof action_skd_map.reLoad == "function") {
                action_skd_map.reLoad(function () {
                    renderSideBarTable(function () {
                        MB.Core.spinner.stop(mapContainer);
                        action_skd_map.mapIsReloading = false;
                    });
                });
            } else {
                renderSideBarTable(function () {
                    MB.Core.spinner.stop(mapContainer);
                    action_skd_map.mapIsReloading = false;
                });
            }
        }

        if (action_skd_map.autoReloadEnabled) {
            autoReloadTimer();
        }
    };


    function setHandlers(mode) {
        contentWrapper.find('.reloadMap').off('click').on('click', function () {
            reloadMap();
        });
        contentWrapper.find('.autoReloadMap').off('click').on('click', function () {
            // Переключим
            if (!action_skd_map.autoReloadEnabled){
                action_skd_map.autoReloadEnabled = true;
                reloadMap();
                $(this).addClass('active');
            }else{
                action_skd_map.autoReloadEnabled = false;
                $(this).removeClass('active');
            }
        });
        contentWrapper.find('.autoReloadMapContainer ul li').off('click').on('click', function () {
            var time = $("a", this).data('time');
            action_skd_map.autoReloadTime = time || 20;
            $(this).parents('.autoReloadMapContainer').find('.dropdown_select_info').text(time);
        });
        $(modalInstance).off('resize').on('resize', function () {
            var currentMode = (isSectors) ? "sectors" : "squares";
            if(!entryTickets.check(currentMode, false, true)) action_skd_map.resize();
            console.log("resize");
        });

        if (mode != "action_wo") {
            contentWrapper.find('.back_to_sectors').off('click').on('click', function () {
                MB.Core.spinner.start(mapContainer);
                action_skd_map.backToSectors(function () {
                    isSectors = true;
                    entryTickets.close();
                    setSideBar("sectors");
                    MB.Core.spinner.stop(mapContainer);
                });
            });
            contentWrapper.find('.back_to_squares').off('click').on('click', function () {
                var elem = $(this);

                if (elem.hasClass("disabled")) return;

                lastSelectedSector.selected = true;
                sectorClickHandler();
            });

            action_skd_map.container.on("click", function () {
                if (action_skd_map.contextmenu1 != undefined) action_skd_map.contextmenu1.delete();
                action_skd_map.clearSelection(true);
                action_skd_map.render();
            });
            action_skd_map.container.off('myContextMenu').on('myContextMenu', function (e, x, y) {
                action_skd_map.clearSelection(true);
                action_skd_map.render();
                var square_id = action_skd_map.mouseOnElement(x, y);
                if (!square_id) {
                    if (action_skd_map.contextmenu1 != undefined) action_skd_map.contextmenu1.delete();
                    return;
                }
                if (action_skd_map.squares[square_id].status === 0) {
                    if (action_skd_map.contextmenu1 != undefined) action_skd_map.contextmenu1.delete();
                    return;
                }
                action_skd_map.addToSelection(square_id);

                var square_list = '';
                for (var s in action_skd_map.selection) {
                    square_list += action_skd_map.selection[s] + ",";
                }
                square_list = square_list.slice(0, -1);

                action_skd_map.contextmenu1 = MB.Core.contextMenu.init(undefined, {
                    items: [
                        {
                            title: 'Выставить проход',
                            iconClass: 'fa-bars',
                            disabled: false,//square.enter_in_hall_status != "NOT_ENTERED",
                            callback: function (params) {
                                console.log('Выставить проход');
                                MB.Core.spinner.start(mapContainer);
                                socketQuery({
                                    command: "operation",
                                    object: "set_enter_in_hall_status_entered_for_place",
                                    params: {
                                        ACTION_SCHEME_ID: square_list
                                    }
                                }, function (data) {
                                    if (!(data = socketParse(data))) return;
                                    renderSideBarTable();
                                    action_skd_map.reLoad(function () {
                                        MB.Core.spinner.stop(mapContainer);
                                        action_skd_map.selection = [];
                                    });
                                });
                            }
                        },
                        {
                            title: 'Отменить проход',
                            iconClass: 'fa-bars',
                            disabled: false,//square.enter_in_hall_status == "NOT_ENTERED",
                            callback: function (params) {
                                console.log('Отменить проход');
                                MB.Core.spinner.start(mapContainer);
                                socketQuery({
                                    command: "operation",
                                    object: "set_enter_in_hall_status_not_entered_for_place",
                                    params: {
                                        ACTION_SCHEME_ID: square_list
                                    }
                                }, function (data) {
                                    if (!(data = socketParse(data))) return;
                                    renderSideBarTable();
                                    action_skd_map.reLoad(function () {
                                        MB.Core.spinner.stop(mapContainer);
                                        action_skd_map.selection = [];
                                    });
                                });
                            }
                        }
                    ]
                });

            });

            mapContainer.off('sector_click').on('sector_click', function () {
                sectorClickHandler();
            });
        }
    };

    function setSideBar(mode) {
        var wrapper = contentWrapper.find('.content-sidebar-upper-buttons-wrapper');
        var buttons = [
            {
                mode: "squares",
                widthClass: "wid8pr",
                nameClass: "back_to_sectors",
                disabled: function () {
                    return !splitByAreaGroups;
                },
                icon: "fa-reply",
                title: ""
            }, {
                mode: "sectors",
                widthClass: "wid8pr",
                nameClass: "back_to_squares",
                disabled: function () {
                    return !lastSelectedSector;
                },
                icon: "fa-mail-forward",
                title: ""
            },
            {
                mode: "all",
                widthClass: "wid23pr",
                nameClass: "reloadMap",
                disabled: function () {
                    return false;
                },
                icon: "fa-refresh",
                title: "Обновить"
            },
            {
                mode: "all",
                disabled: function () {
                    return false;
                },
                html:'<div class="btn-group autoReloadMapContainer">' +
                '<button type="button" class="btn btn-primary autoReloadMap">' +
                'Автообновление' +
                '<div class="progress" style="height: 2px; margin-bottom: -2px;">' +
                '<div class="progress-bar progress-bar-info autoReloadMapProgress" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%; transition: none!important;"></div>' +
                '</div>' +
                '</button>' +
                '<button type="button" class="btn btn-primary dropdown-toggle" data-toggle="dropdown">' +
                '<div style="float: left;margin-right: 5px;" class="dropdown_select_info">20</div>' +
                '<span class="caret"></span>' +
                '</button>' +
                    '<ul class="dropdown-menu" role="menu">' +
                    '<li><a data-time="5" href="#">5 сек</a></li>' +
                    '<li><a data-time="10" href="#" class="selected">10 сек</a></li>' +
                    '<li><a data-time="15" href="#">15 сек</a></li>' +
                    '<li><a data-time="20" href="#">20 сек</a></li>' +
                    '<li><a data-time="25" href="#">25 сек</a></li>' +
                    '<li><a data-time="30" href="#">30 сек</a></li>' +
                    '<li><a data-time="60" href="#">1 мин</a></li>' +
                    '<li><a data-time="300" href="#">5 мин</a></li>' +
                '</ul>' +

                '</div>'
            }
        ];

        wrapper.empty();

        for (var i = 0; i < buttons.length; i++) {
            var button = buttons[i];
            var div = $("<div></div>");
            var icon = $("<i></i>");
            var span = $("<span></span>");
            if (button.mode == mode || button.mode == "all") {
                if (button.html){
                    wrapper.append(button.html);
                    continue;
                }
                div.addClass("content-sidebar-upper-button " + button.widthClass + " " + button.nameClass);
                if (button.disabled()) div.addClass("disabled");
                icon.addClass("fa " + button.icon);
                span.html(button.title);
                div.append(icon).append('&nbsp;&nbsp;').append(span);
                wrapper.append(div);
            }
        }

        setHeightOfTable();
        setHandlers(mode);

    };

    function setHeightOfTable() {
        var sH = contentWrapper.find(".action-skd-sidebar-wrapper").height();
        sH -= contentWrapper.find(".content-sidebar-upper-buttons-wrapper").height();
        sH -= contentWrapper.find(".content-sidebar-info-aftertable").height() * 2;
        contentWrapper.find(".content-sidebar-info-table-wrapper").height((sH) / 2 - 2);
    };

    function getDonutChartColor(percentage) {
        return percentage < 10 ? "red" :
            (percentage >= 10 && percentage < 30) ? "orange" :
                (percentage >= 30 && percentage < 50) ? "#41C8FF" :
                    (percentage >= 50 && percentage < 70) ? "greenyellow" :
                        (percentage >= 70 && percentage <= 99) ? "green" :
                            "black";
    };

    function getDonutChartHTML(entered_places, sold_places) {
        var perc = sold_places == 0 ? 100 : Math.ceil(entered_places / sold_places * 100);
        perc = perc > 100 ? 100 : perc;
        var rad1 = perc <= 50 ? (360 / 100 * perc) : 180;
        var rad2 = perc <= 50 ? 0 : (360 / 100 * (perc - 50));

        var dc_color = getDonutChartColor(perc);
        var back_color1 = perc == 0 ? "white" : dc_color;
        var back_color2 = perc <= 50 ? "white" : dc_color;
        var dc_center_style = perc == 100 ? "style='background: black; color: white'" : "";

        return "<div class='donut-chart'>" +
            "<div class='dc_trim dc_portion1'>" +
            "<div class='dc_part' style='transform: rotate(" + rad1 + "deg); background-color: " + back_color1 + ";'></div>" +
            "</div>" +
            "<div class='dc_trim dc_portion2'>" +
            "<div class='dc_part' style='transform: rotate(" + rad2 + "deg); background-color: " + back_color2 + ";'></div>" +
            "</div>" +
            "<div class='dc_center'" + dc_center_style + ">" + perc + "</div>" +
            "</div>";
    }

    function getTableRowHTML(area_group_name, sold_places, entered_places, not_entered_places) {
        var donut_chart = getDonutChartHTML(entered_places, sold_places);
        area_group_name = area_group_name == "Места без секторов" ? "-" : area_group_name;
        return "<tr>" +
            "<td>" + area_group_name + "</td>" +
            "<td>" + sold_places + "</td>" +
            "<td>" + entered_places + "</td>" +
            "<td>" + not_entered_places + "</td>" +
            "<td>" + donut_chart +
            "<div class='one_skd-place-hint-wrapper'>" +
            "<div>" +
            "<span class='bold fs11'>Сектор:</span>" +
            "<br>" + area_group_name +
            "</div>" +
            "<div>" +
            "<span class='bold fs11'>Продано:</span>" + sold_places +
            "</div>" +
            "<div>" +
            "<span class='bold fs11'>Прошло:</span>" + entered_places +
            "</div>" +
            "<div>" +
            "<span class='bold fs11'>Ожидается:</span>" + not_entered_places +
            "</div>" +
            "<div>" +
            "<span class='bold fs11'>Доля (%):</span>" + donut_chart +
            "</div>" +
            "</div>" +
            "</td>" +
            "</tr>";
    }

    function setStatistics(table_selector, table_rows_html, sold, entered, not_entered) {
        contentWrapper.find(".action-skd-short-info-in").html(entered); //parseInt(contentWrapper.find(".action-skd-short-info-in").html()) +
        contentWrapper.find(".action-skd-short-info-out").html(not_entered);//parseInt(contentWrapper.find(".action-skd-short-info-out").html()) + 

        contentWrapper.find(table_selector).find(".content-sidebar-info-table tbody").html(table_rows_html);

        contentWrapper.find(table_selector).find(".content-sidebar-info-aftertable-sold").html(sold);
        contentWrapper.find(table_selector).find(".content-sidebar-info-aftertable-in").html(entered);
        contentWrapper.find(table_selector).find(".content-sidebar-info-aftertable-out").html(not_entered);

        var all_perc = Math.ceil(parseInt(entered) / parseInt(sold == 0 ? 1 : sold) * 100);
        all_perc = all_perc > 100 ? 100 : all_perc;
        contentWrapper.find(table_selector).find(".content-sidebar-info-aftertable-per").html(all_perc + "%");
    }

    function renderSideBarTable(callback) {
        setHeightOfTable();
        socketQuery({
            command: "get",
            object: "action_scheme_count_enter_in_hall_by_ticket_zone",
            params: {
                action_id: environment.activeId,
                order_by: "SOLD_PLACES DESC"
            }
        }, function (data) {
            var table_selector = ".action-skd-sidebar-wrapper-table-zones";
            var obj = socketParse(data);
            var table_rows_html = "";
            var sold = 0, entered = 0, not_entered = 0;

            countEnterInZones = obj;

            if (activeActionIsWo) {
                if (typeof callback == "function")
                    callback();
            } else {
                socketQuery({
                    command: "get",
                    object: "action_scheme_count_enter_in_hall_by_sectors",
                    params: {
                        action_id: environment.activeId,
                        order_by: "SOLD_PLACES DESC"
                    }
                }, function (data) {
                    var table_selector = ".action-skd-sidebar-wrapper-table-sectors";
                    var obj = socketParse(data);
                    var table_rows_html = "";
                    var sold = 0, entered = 0, not_entered = 0;

                    countEnterInSectors = obj;
                    if (typeof callback == "function")
                        callback();

                    for (var i in obj) {
                        if (parseInt(obj[i]["NOT_ENTERED_PLACES"]) > 0 || parseInt(obj[i]["ENTERED_PLACES"]) > 0) {
                            sold += obj[i]["SOLD_PLACES"];
                            entered += obj[i]["ENTERED_PLACES"];
                            not_entered += obj[i]["NOT_ENTERED_PLACES"];

                            table_rows_html += getTableRowHTML(obj[i]["AREA_GROUP_NAME"], obj[i]["SOLD_PLACES"],
                                obj[i]["ENTERED_PLACES"], obj[i]["NOT_ENTERED_PLACES"]);
                        }
                    }

                    setStatistics(table_selector, table_rows_html, sold, entered, not_entered);
                });
            }

            for (var i in obj) {
                if (parseInt(obj[i]["NOT_ENTERED_PLACES"]) > 0 || parseInt(obj[i]["ENTERED_PLACES"]) > 0) {
                    sold += obj[i]["SOLD_PLACES"];
                    entered += obj[i]["ENTERED_PLACES"];
                    not_entered += obj[i]["NOT_ENTERED_PLACES"];

                    table_rows_html += getTableRowHTML(obj[i]["TICKET_ZONE_NAME"], obj[i]["SOLD_PLACES"],
                        obj[i]["ENTERED_PLACES"], obj[i]["NOT_ENTERED_PLACES"]);
                }
            }

            setStatistics(table_selector, table_rows_html, sold, entered, not_entered);
        });
    };

}());
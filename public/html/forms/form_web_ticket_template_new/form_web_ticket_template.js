(function () {
    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_web_ticket_template', formID);
    var modalInstance = MB.Core.modalWindows.windows.getWindow(formID);
    var formWrapper = $('#mw-' + formInstance.id);
    var tableID = formWrapper.find('.classicTableWrap').attr('data-id');
    var tableInstance = MB.Tables.getTable(tableID);
    var tableWrapper = $('.classicTableWrap-' + tableInstance.id);

    //TICKET TEMPLATE CONSTRUCTOR ------------

    var TTC = {
        el_data: [],

        ticketHeight: 610,
        ticketWidth: 875,

        Elements: {
            startX: 50,
            startY: 50,
            startWidth: 128,
            startHeight: 128,
            properties: {
                ImagePDF: {
                    css: [
                        {name: "top", measure: "px", title: "X"},
                        {name: "left", measure: "px", title: "Y"},
                        {name: "width", measure: "px", title: "Ширина"},
                        {name: "height", measure: "px", title: "Высота"},
                        {name: "z-index", measure: "", title: "Z-index"}],
                    other: [
                        {name: "url", measure: "", title: "Ссылка на изображение"},
                        {name: "rotate", measure: "", title: "Поворот"}],
                    title: "Изображение",
                    icon: "fa-picture-o",
                    n: 0
                },
                TextPDF: {
                    css: [
                        {name: "top", measure: "px", title: "X"},
                        {name: "left", measure: "px", title: "Y"},
                        {name: "width", measure: "px", title: "Ширина"},
                        {name: "height", measure: "px", title: "Высота"},
                        {name: "z-index", measure: "", title: "Z-index"},
                        {name: "color", measure: "", title: "Цвет текста"},
                        {name: "line-height", measure: "px", title: "Межстрочный интервал"},
                        {name: "font-size", measure: "px", title: "Размер шрифта"},
                        {name: "font-style", measure: "", title: "Тип шрифта"},
                        {name: "font-family", measure: "", title: "Шрифт"},
                        {name: "font-weight", measure: "", title: "Насыщенность шрифта"}],
                    other: [
                        {name: "composite", measure: "", title: "Строка со значениями"}
                    ],
                    title: "Текст",
                    icon: "fa-font",
                    n: 0
                },
                BackgroundPDF: {
                    css: [
                        {name: "top", measure: "px", title: "X"},
                        {name: "left", measure: "px", title: "Y"},
                        {name: "width", measure: "px", title: "Ширина"},
                        {name: "height", measure: "px", title: "Высота"},
                        {name: "z-index", measure: "", title: "Z-index"}],
                    other: [
                        {name: "url", measure: "", title: "Ссылка на изображение"}],
                    title: "Фон",
                    icon: "fa-picture-o",
                    n: 0
                },
                BarcodePDF: {
                    css: [
                        {name: "top", measure: "px", title: "X"},
                        {name: "left", measure: "px", title: "Y"},
                        {name: "width", measure: "px", title: "Ширина"},
                        {name: "height", measure: "px", title: "Высота"},
                        {name: "z-index", measure: "", title: "Z-index"}],
                    other: [
                        {name: "bartype", measure: "", title: "Тип баркода"},
                        {name: "key", measure: "", title: "Ключ значения"},
                        {name: "rotate", measure: "", title: "Поворот"}],
                    title: "Штрихкод",
                    icon: "fa-barcode",
                    n: 0
                }
            },

            addTo_el_data: function (type, obj, active) {
                if (obj) {
                    obj.name = this.properties[obj.type].title + " " + ++this.properties[obj.type].n;
                    obj.status = "added";
                    TTC.el_data.push(obj);
                } else {
                    TTC.el_data.push({
                        "status": "added",
                        "name": this.properties[type].title + " " + ++this.properties[type].n,
                        "type": type,
                        "top": this.startY,
                        "left": this.startX,
                        "width": this.startWidth,
                        "height": this.startHeight,
                        "rotate": 0,
                        "url": "assets/img/imagesWTTE/image.png",
                        "font-size": 15,
                        "color": "#000000",
                        "font-family": "Times New Roman",
                        "line-height": 15,
                        "font-style": "normal",
                        "font-weight": "normal",
                        "z-index": 1,
                        "composite": false,
                        "context": "<p>Введите сюда текст</p><p>или сюда</p>",
                        "bartype": "code128",
                        "key": "12345678"
                    });
                    this.startX += 100;
                    this.startY += 100;
                    this.startX = this.startX > TTC.ticketWidth ? 50 : this.startX;
                    this.startY = this.startY > TTC.ticketHeight ? 50 : this.startY;
                }
                this.addTo_canvas(active, TTC.el_data.length - 1);
                this.addTo_table(active, TTC.el_data.length - 1)
            },
            addTo_canvas: function (active, ind) {
                var obj = TTC.el_data[ind],
                    style = '',
                    css = this.properties[obj["type"]].css;
                for (var i in css) {
                    if (css[i].name == "font-family") {
                        style += css[i].name + ": '" + obj[css[i].name] + "';"
                    } else {
                        style += css[i].name + ": " + obj[css[i].name] + css[i].measure + ";"
                    }
                }

                if (obj["type"] == "ImagePDF") {
                    $('<img/>', {
                        class: "wtt_inner_element",
                        src: obj["url"],
                        width: obj["width"],
                        height: obj["height"],
                        style: "width: " + obj["width"] + "px; height: " + obj["height"] + "px;"
                    }).appendTo($('<div/>', {
                        "el-id": ind,
                        class: "wtt_editor_element " + (active ? "wtt_active" : ""),
                        type: obj["type"],
                        style: style + "transform: rotate(" + obj["rotate"] + "deg)"
                    }).appendTo(formWrapper.find(".wtt_ticket")));
                    formWrapper.find(".wtt_ticket").find(".wtt_editor_element[el-id=" + ind + "]").css({
                        top: obj["top"],
                        left: obj["left"]
                    });
                }
                if (obj["type"] == "TextPDF") {
                    $("<div>" + obj["context"] + "</div>").appendTo($('<p/>', {
                        "el-id": ind,
                        class: "wtt_editor_element " + (active ? "wtt_active" : ""),
                        type: obj["type"],
                        style: style + "transform: rotate(" + obj["rotate"] + "deg)"
                    }).appendTo(formWrapper.find(".wtt_ticket")));
                    formWrapper.find(".wtt_ticket").find(".wtt_editor_element[el-id=" + ind + "]").css({
                        top: obj["top"],
                        left: obj["left"]
                    });
                }
                if (obj["type"] == "BackgroundPDF") {

                }
                if (obj["type"] == "BarcodePDF") {

                }
            },
            addTo_table: function (active, ind) {
                var obj = TTC.el_data[ind],
                    li = "<li el-id='" + ind + "' " + (active ? "class='wtt_sidebar_active'" : "") + ">" +
                        "<div class='fa " + this.properties[obj["type"]].icon + "'></div>" +
                        "<div class='wtt_sidebar_element_title'>" + obj.name + "</div>" +
                        "<div class='fa fa-trash-o'></div>" +
                        "<div class='fa fa-pencil'></div>" +
                        "</li>"
                formWrapper.find(".wtt_sidebar_list").append(li);
            }
        },

        init: function () {
            console.log("init");
            formWrapper.find(".wtt_ticket").width(this.ticketWidth);
            formWrapper.find(".wtt_ticket").height(this.ticketHeight);
            formWrapper.find(".wtt_ticket_border").css({
                top: "20px",
                left: ((formWrapper.find(".wtt_workarea").width() - this.ticketWidth) / 2) + "px"
            });

            this.Elements.addTo_el_data("", {
                "type": "ImagePDF",
                "top": 30,
                "left": 370,
                "width": 150,
                "height": 87,
                "z-index": 1,
                "rotate": 0,
                "url": "assets/img/imagesSM/mirBiletaLogo.png"
            });
            this.Elements.addTo_el_data("", {
                "type": "TextPDF",
                "top": 185,
                "left": 100,
                "width": 500,
                "height": 200,
                "z-index": 3,
                "font-size": 15,
                "color": "#000000",
                "font-family": "Times New Roman",
                "line-height": 15,
                "font-style": "normal",
                "font-weight": "normal",
                "composite": "",
                "context": "<p>Введите сюда текст</p><p>или сюда</p>"
            });
            this.Elements.addTo_el_data("", {
                "type": "ImagePDF",
                "top": 450,
                "left": 128,
                "width": 453,
                "height": 130,
                "z-index": 2,
                "rotate": 0,
                "url": "assets/img/imagesSM/kremlinLogo_w.png"
            });

            this.setHandlers();
        },
        clean: function () {
            console.log("clean");
            this.el_data = [];
            [].forEach.call(formWrapper.find(".wtt_editor_element"), function (el) {
                el.remove();
            })
        },
        drawElements: function () {
            console.log("drawElements");
            for (var e in this.el_data) {
                if (this.el_data[e]["status"] != "deleted") {
                    this.Elements.addTo_canvas(this.el_data[e], false, e);
                }
            }
        },
        setEditBox: function () {
            console.log("setEditBox");
            var active_el = formWrapper.find(".wtt_active");
            if (active_el.length > 0) {
                formWrapper.find(".wtt_edit_box").css({
                    'top': Math.round(active_el.position().top),
                    'left': Math.round(active_el.position().left),
                    'width': Math.round(active_el.width()) + "px",
                    'height': Math.round(active_el.height()) + "px",
                    'transform': ""
                });
                formWrapper.find(".wtt_edit_box").show();
            }
        },
        highlightInTable: function () {
            var active_el = formWrapper.find(".wtt_active");
            if (active_el.length > 0) {
                formWrapper.find(".wtt_sidebar_active").toggleClass("wtt_sidebar_active");

                var active_li = formWrapper.find(".wtt_sidebar_list" + " li[el-id='" + active_el.attr("el-id") + "']");
                active_li.toggleClass("wtt_sidebar_active");

                $(".wtt_sidebar_list").stop(true, true).animate({
                    scrollTop: active_li.position().top + $(".wtt_sidebar_list").scrollTop()
                }, 300);
            }
        },
        checkBorderCrossing: function () {
            console.log("checkBorderCrossing");
            var active_el = formWrapper.find(".wtt_active"),
                edit_box_el = formWrapper.find(".wtt_edit_box");
            if (active_el.length > 0 && edit_box_el.length > 0) {
                var edit_box_pos = edit_box_el.position(),
                    top = active_el.position().top,
                    left = active_el.position().left,
                    width = active_el.width(),
                    height = active_el.height();

                top = (edit_box_pos.top) < 0 ? 0 : top;
                top = (edit_box_pos.top + height) > this.ticketHeight ? this.ticketHeight - height : top;
                left = (edit_box_pos.left) < 0 ? 0 : left;
                left = (edit_box_pos.left + width) > this.ticketWidth ? this.ticketWidth - width : left;
                top = Math.round(top);
                left = Math.round(left);

                edit_box_el.css({
                    top: top,
                    left: left
                });
                active_el.css({
                    top: top,
                    left: left
                });

                var el_id = active_el.attr("el-id");
                this.el_data[el_id]["top"] = top;
                this.el_data[el_id]["left"] = left;
            }
        },
        showPropertiesBlock: function () {
            console.log("showPropertiesBlock");
            var active_el = formWrapper.find(".wtt_active");
            if (active_el.length > 0) {
                var el_id = active_el.attr("el-id"),
                    props = this.Elements.properties[active_el.attr("type")],
                    list = "";

                for (var p in props.css) {
                    var value = this.el_data[el_id][props.css[p].name] + " " + props.css[p].measure;
                    list += "<li>" +
                    "<div class='wtt_sidebar_prop_title'>" + props.css[p].title + "</div>" +
                    "<div class='wtt_sidebar_prop_value'type='" + props.css[p].name + "'" +
                    " contenteditable='true'>" + value.trim() + "</div>" +
                    "</li>";
                }
                for (var p in props.other) {
                    var value = this.el_data[el_id][props.other[p].name] + " " + props.other[p].measure;
                    list += "<li>" +
                    "<div class='wtt_sidebar_prop_title'>" + props.other[p].title + "</div>" +
                    "<div class='wtt_sidebar_prop_value'type='" + props.other[p].name + "'" +
                    " contenteditable='true'>" + value.trim() + "</div>" +
                    "</li>";
                }

                formWrapper.find(".wtt_sidebar_props" + " ul").html(list);
                formWrapper.find(".wtt_sidebar_props").show();
            }
        },
        hidePropertiesBlock: function () {
            console.log("hidePropertiesBlock");
            formWrapper.find(".wtt_sidebar_props").hide();
            formWrapper.find(".wtt_sidebar_props" + " ul").html("");
        },
        refreshPropertiesBlock: function () {
            console.log("refreshPropertiesBlock");
            var active_el = formWrapper.find(".wtt_active");
            if (active_el.length > 0) {
                var el_id = active_el.attr("el-id"),
                    props = this.Elements.properties[active_el.attr("type")];

                for (var p in props.css) {
                    var value = this.el_data[el_id][props.css[p].name] + " " + props.css[p].measure;
                    formWrapper.find(".wtt_sidebar_prop_value" + "[type=" + props.css[p].name + "]")
                        .html(value.trim());
                }
                for (var p in props.other) {
                    var value = this.el_data[el_id][props.other[p].name] + " " + props.other[p].measure;
                    formWrapper.find(".wtt_sidebar_prop_value" + "[type=" + props.other[p].name + "]")
                        .html(value.trim());
                }
            }
        },
        applyChangesInProperties: function () {
            console.log("applyChangesInProperties");
            var active_el = formWrapper.find(".wtt_active");
            if (active_el.length > 0) {
                var el_id = active_el.attr("el-id"),
                    props = this.Elements.properties[active_el.attr("type")],
                    style = "";

                for (var p in props.css) {
                    var value = formWrapper.find(".wtt_sidebar_prop_value" + "[type=" + props.css[p].name + "]").html(),
                        correct = false;

                    if (props.css[p].name == "top" || props.css[p].name == "left" || props.css[p].name == "width" ||
                        props.css[p].name == 'height' || props.css[p].name == 'line-height' || props.css[p].name == 'font-size') {
                        value = parseInt(value.replace("px", "").trim());
                        correct = !isNaN(value);
                    } else {
                        //Проверки для color, style, family & weight
                        correct = true;
                    }

                    if (correct) {
                        this.el_data[el_id][props.css[p].name] = value;
                        style += props.css[p].name + ": " + value + props.css[p].measure;
                    }
                }
                for (var p in props.other) {
                    var value = formWrapper.find(".wtt_sidebar_prop_value" + "[type=" + props.other[p].name + "]").html();

                    this.el_data[el_id][props.css[p].name] = value;
                }

                active_el.attr("style", style);
            }
        },

        setHandlers: function () {
            formWrapper.find(".wtt_te_font_color input").colorpicker();
            formWrapper.find(".wtt_te_font_color input").colorpicker().off('changeColor').on('changeColor', function (e) {
                e = e || window.event;
                var color = formWrapper.find('.wtt_te_colorpicker_state');
                var val = e.color.toHex();
                color.css('backgroundColor', val);
            });


            $(document).off('mousedown').on('mousedown', function (e) {
                console.log("document.click");
                var editor_element = formWrapper.find(".wtt_editor_element"),
                    edit_box = formWrapper.find(".wtt_edit_box"),
                    prop_box = formWrapper.find(".wtt_sidebar_prop"),
                    workarea_box = formWrapper.find(".wtt_workarea"),
                    text_editor_box = formWrapper.find(".wtt_text_editor");

                if (!editor_element.is(e.target) && editor_element.has(e.target).length === 0
                    && !edit_box.is(e.target) && edit_box.has(e.target).length === 0
                    && !prop_box.is(e.target) && prop_box.has(e.target).length === 0
                    && !text_editor_box.is(e.target) && text_editor_box.has(e.target).length === 0
                    && !(!workarea_box.is(e.target) && workarea_box.has(e.target).length === 0)) {

                    console.log("document.click 1");
                    formWrapper.find(".wtt_editing").attr("contenteditable", "false").removeClass("wtt_editing");
                    formWrapper.find(".wtt_active").toggleClass("wtt_active");

                    edit_box.hide();
                    text_editor_box.hide();
                    TTC.hidePropertiesBlock();
                } else {
                    if (e.target.closest(".wtt_editor_element") &&
                        (formWrapper.find(e.target.closest(".wtt_editor_element")).attr("contenteditable") != "true")) {

                        console.log("document.click 2");
                        formWrapper.find(".wtt_active").toggleClass("wtt_active");
                        formWrapper.find(".wtt_editing").attr("contenteditable", "false").removeClass("wtt_editing");
                        $(e.target.closest(".wtt_editor_element")).toggleClass("wtt_active");

                        TTC.setEditBox();
                        TTC.highlightInTable();
                        TTC.checkBorderCrossing();
                        TTC.showPropertiesBlock();
                    }
                }
            });

            //CLICK ON EDIT_PEN
            formWrapper.find(".wtt_edit_pen").off("click").on("click", function () {
                if (formWrapper.find(".wtt_active").attr("type") == "TextPDF") {
                    formWrapper.find(".wtt_active").addClass("wtt_editing");
                    formWrapper.find(".wtt_edit_box").hide();
                    formWrapper.find(".wtt_active").attr("contenteditable", "true");

                    var text_editor = formWrapper.find(".wtt_text_editor");
                    var value = formWrapper.find('.wtt_sidebar_prop_value[type="font-size"]').html();
                    if(!isNaN(parseInt(value))) {
                        if(formWrapper.find(".wtt_te_font_size_list li[font-size='10']").length > 0) {
                            formWrapper.find(".wtt_te_font_size_list .wtt_te_list_selected").toggleClass("wtt_te_list_selected");
                        }
                    }

                    text_editor.show();
                }
                if (formWrapper.find(".wtt_active").attr("type") == "ImagePDF") {
                    console.log("changing image");
                }
            });

            formWrapper.find(".wtt_te_close_icon").off("click").on("click", function () {
                formWrapper.find(".wtt_text_editor").hide();
                formWrapper.find(".wtt_active").removeClass("wtt_editing");
                formWrapper.find(".wtt_edit_box").show();
                formWrapper.find(".wtt_active").attr("contenteditable", "false");
            });

            //ADD ELEMENT
            formWrapper.find(".wtt_sidebar_add_elements li").off('click').on('click', function (e) {
                console.log("add el");
                var type = formWrapper.find(e.currentTarget).attr("type");
                formWrapper.find(".wtt_active").toggleClass("wtt_active");

                TTC.Elements.addTo_el_data(type, null, true);
                TTC.setEditBox();
                TTC.highlightInTable();
                TTC.showPropertiesBlock();
                TTC.checkBorderCrossing();
            });

            //OPEN/CLOSE AVAILABLE ELEMENTS LIST
            formWrapper.find(".wtt_sidebar_add_label").off('click').on('click', function () {
                $(".wtt_sidebar_add_elements").toggleClass("hide_list");
            });

            //OPEN/CLOSE ADDED ELEMENTS LIST
            formWrapper.find(".wtt_sidebar_elements_label").off('click').on('click', function () {
                $(".wtt_sidebar_list").toggleClass("hide_list");
            });

            //OPEN/CLOSE PROPERTIES LIST
            formWrapper.find(".wtt_sidebar_element_props_title").off('click').on('click', function () {
                $(".wtt_sidebar_element_props").toggleClass("hide_list");
            });
        }
    };

    TTC.init();

}());
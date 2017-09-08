
























function sendQuery (obj, callback) {
    var xml = "";
    var url = "/cgi-bin/b2c";
    xml = "p_xml=<query>";
    if (typeof obj === "object") {
        if (obj.hasOwnProperty("command")) {
            for (var i in obj) {
                if (obj.hasOwnProperty(i)) {
                    if (i === "params") {
                        if (typeof obj[i] === "object") {
                            for (var j in obj.params) {
                                xml += "<" + j + ">" + obj.params[j] + "</" + j + ">";
                            }
                        }
                    } else {
                        xml += "<" + i + ">" + obj[i] + "</" + i + ">";
                    }              
                }
            }    
        } else {
            alert("В обекте не передан обязательный параметр command");
        }        
    } else {
        alert("Не передали объект в sendQuery");
    }
    xml += "</query>";
    $.getJSON( url, xml, function (data, textStatus, jqXHR) {
        if (textStatus === "success") {
            if (data.hasOwnProperty("ROWSET")) {
                if (typeof data.ROWSET === "object") {
                    if (data.ROWSET.hasOwnProperty("RC")) {
                        if (data.ROWSET.RC === 0) {
                            console.log("Все отлично, RC = " + data.ROWSET.RC + ", MESSAGE = " + data.ROWSET.MESSAGE);
                            callback(data);
                        } else if (data.ROWSET.RC === -2) {
                            alert("Ваша сессия не актульна, зайдите на сайт пожалуйста заново");
                            $.removeCookie("sid");
                            document.location.href = "http://192.168.1.101/multibooker4/login.htm";
                        } else {
                            alert("Ошибка, RC = " + data.ROWSET.RC + ", MESSAGE = " + data.ROWSET.MESSAGE);
                        }
                    } else {
                        callback(data);
                    }                    
                } else {
                    alert("ROWSET, пришедший с сервера не является объектом. Не порядок!");
                } 
            } else {
                alert("Возвращается объект, но в нем нет свойства ROWSET");
            }
        } else {
            alert("Статус ответа не success, значит надо смотреть консоль :)");
            // callback(data);
        }
    });
}





    /**
     * Функция выводит в консоль переданную информацию
     * @param string
     */
    function log(string){
        console.log(string);
    }


    function getClientWidth(){
        return (window.innerWidth ? window.innerWidth : (document.documentElement.clientWidth ? document.documentElement.clientWidth : document.body.offsetWidth));
    }

    function getClientHeight(){
        return (window.innerHeight ? window.innerHeight : (document.documentElement.clientHeight ? document.documentElement.clientHeight : document.body.offsetHeight));
    }


    /**
     * Функция посылает запрос на сервер и возвращает результат
     * @param params
     *  Объект содержащий информацию о команде, подкоманде, sid, и параметрах команды
     * @param callback
     *  Если вторым параметром передана функция, то она запустится после выполнения запроса к серверу и передаст в нее результаты
     *  @param url
     *  Необязательный параметр, адрес сервера. По умолчанию "/cgi-bin/b2c"
     * @return {Boolean}
     * Возвращает false если объект передан неверно, true если все прошло успешно, и данные, если запрос прошел, но функция callback не передана
     *
     * Пример вызова:
     * send_query({sid:"<номер сессии>",command:"<Имя команды>",subcommand:"<Имя подкоманды>",params:{event_item_id:123}},function(data){

     });
     */

    // function sendQuery (obj, callback) {
    //     console.log(2);
    //     var xml = "";
    //     var url = "/cgi-bin/b2c";
    //     xml = "p_xml=<QUERY>";
    //     if (typeof obj === "object") {
    //         if (obj.hasOwnProperty("params") && typeof obj.params === "object") {
    //             for (var i in obj.params) {
    //                 xml += "<" + i + ">" + obj.params[i] + "</" + i + ">";
    //             }
    //         } else {
    //             for (var i in obj) {
    //                 xml += "<" + i + ">" + obj[i] + "</" + i + ">";
    //             }      
    //         }
    //     }
    //     xml += "</QUERY>";
    //     // jQuery.getJSON( url [, data ] [, success( data, textStatus, jqXHR ) ] );
    //     $.getJSON( url, xml, function (data, textStatus, jqXHR) {
    //         console.log(data);
    //         console.log(textStatus);
    //         console.log(jqXHR);
    //         callback(data);
    //     }).complete(function(data){
    //        log(data);
    //     });
    // }

    // function sendQuery2 (obj, callback) {
    //     var xml = "";
    //     var url = "/cgi-bin/b2c";
    //     xml = "p_xml=<QUERY>";
    //     if (typeof obj === "object") {
    //         if (obj.hasOwnProperty("params") && typeof obj.params === "object") {
    //             for (var i in obj.params) {
    //                 xml += "<" + i + ">" + obj.params[i] + "</" + i + ">";
    //             }
    //         } else {
    //             for (var i in obj) {
    //                 xml += "<" + i + ">" + obj[i] + "</" + i + ">";
    //             }      
    //         }
    //     }
    //     xml += "</QUERY>";
    //     // jQuery.getJSON( url [, data ] [, success( data, textStatus, jqXHR ) ] );
    //     $.getJSON( url, xml, function (data, textStatus, jqXHR) {
    //         console.log(data);
    //         console.log(textStatus);
    //         console.log(jqXHR);
    //         callback(data);
    //     });
    // }

    function send_query(params,callback,url,complite){

        //HILPANIKdTZopmeKcWeVliaDYgOqSiqp

        if (typeof params != "object") return false;
        var p_xml = "<query>";
        if (params.sid != undefined){
            p_xml += "<sid>"+params.sid+"</sid>"
        }
        if (params.command == undefined) return false;
        p_xml += "<command>"+params.command+"</command>";
        if (params.subcommand != undefined){
            p_xml += "<subcommand>"+params.subcommand+"</subcommand>";

        }
        if (typeof params.params == "object"){
            for(var key in params.params){
                p_xml += "<"+key+">"+String(params.params[key]).replace(/\%/ig,"|percent|")+"</"+key+">"
            }
        }
        p_xml += "</query>";
        //log("/cgi-bin/b2c"+"?p_xml="+p_xml);
        if(url == undefined)
            url = "/cgi-bin/b2c";
        $.get(url,{p_xml:p_xml},function(data){
            if(+$(data).find("result").find('rc').text()==-2) {
                logout();
                return;
            }

            if (typeof callback != "function") return data;
            callback(data);
        }).complete(function(data){
                if (complite != undefined)
                    callback(data.responseText);
            });
        return true;
    }

    // function createXml

    function create_query(params){

        if (typeof params != "object") return false;
        var p_xml = "<query>";
        if (params.sid != undefined){
            p_xml += "<sid>"+params.sid+"</sid>"
        }
        if (params.command == undefined) return false;
        p_xml += "<command>"+params.command+"</command>";
        if (params.subcommand != undefined){
            p_xml += "<subcommand>"+params.subcommand+"</subcommand>";

        }
        if (typeof params.params == "object"){
            for(var key in params.params){

                p_xml += "<"+key+">"+String(params.params[key]).replace(/\%/ig,"|percent|")+"</"+key+">"
            }
        }

        return p_xml += "</query>";
        //log("/cgi-bin/b2c"+"?p_xml="+p_xml);

    }

    /**
     * Функция возвращает sid или false, если авторизация не пройдена.
     * @param login
     * @param password
     */
    function get_sid(login,password,callback){
        send_query({command:"logon",params:{login:login,password:password}},function(data){
            var sid = $(data).find("result").find('sid');
            if (typeof callback != "function") return false;
            if (sid.length==0) callback(false);
            else callback(sid.text());
            return true;
        });
    }

    function emptyObject(obj) {
        for (var i in obj) {
            return false;
        }
        return true;
    }


    /**
     * Функция сохраняет в базу текущую colModel (ширина столбцов, видимость, ...)
     * Также сохраняются заголовки.
     */
    function saveColModel(table,callback){
        var colNames = table.colNames;
        var colModel = table.colModel;

        for (var key in colModel){
            send_query({command:"set",subcommand:"user_profile",sid:sid,params:{
                object:table.name+"_table",
                item:colModel[key].name,
                pos:key,
                label:colNames[key],
                /*width:(colModel[key].width)?colModel[key].width:10,*/
                width:(colModel[key].widthOrg)?colModel[key].widthOrg:(colModel[key].width)?colModel[key].width:10,
                align:(colModel[key].align)?colModel[key].align:"left",
                hidden:(colModel[key].hidden)?colModel[key].hidden:false
            }},function(){

            });
        }         //tableObj.name+"_table"

    }

    function createTable(tableObj,callback){
         //var oldWidthPx = [];  /// Ширины столбцов в пикселях на момент загрузки.
         //var anotherColCount; /// Количество столбцов не входящих в модель (служебные). Определяется после загрузки таблицы


        /**
         * Функция находит позицию элемента в colModel по умолчанию, по англоязычному имени элемента (столбца)
         * @param colName     имя столбца
         */
        function getRealDefaultPos(colName){
            for (var key0 in tableObj.colModel){
                if (tableObj.colModel[key0].name == colName.toUpperCase() || tableObj.colModel[key0].name == colName) return key0;
            }
            return false;
        }



        /// Проверяем, есть ли уже сохранения для этого пользователя по colModel
        /// Если есть то грузим их, иначе грузим значения по умолчанию И!!!! сохраняем их в базу.
        send_query({command:"get",subcommand:"user_profile",sid:sid,params:{object:tableObj.name+"_table"}},function(data){
            var colModel = [];
            var colNames = [];
            var model = {};
            var obj = $(data).find("ROWSET").children("*");

            for (var i in obj){
                if (isNaN(+i)) continue;
                model[obj[i].tagName] = {};
                var item = $(obj[i]).children('*');
                for (var c in item){
                    if (isNaN(+c)) continue;
                    var value = $(item[c]).text();
                    if (item[c].tagName=="hidden"){
                        value = (value=="true");
                    }
                    if (value==undefined) continue;
                    model[obj[i].tagName][item[c].tagName] = value;
                    //log($(item[c]).text());
                }
            }
            // Считаем и сохраняем 1%
            var minusWidth = (tableObj.widthCorrection!=undefined) ? tableObj.widthCorrection: 0;
            /*tableObj.onePercent = (tableObj.width-minusWidth)/100;*/
            tableObj.onePercent = (tableObj.width-minusWidth)/100;
            if (emptyObject(model)){  ///  Еще не сохранены настройки
                saveColModel(tableObj);
                colNames = tableObj.colNames;
                colModel = tableObj.colModel;
                for (var cols in colModel){
                    colModel[cols].width = colModel[cols].width*tableObj.onePercent;
                }
            }else{
                for (var key in model){
                    if (model[key].pos == undefined) continue;
                    var pos = model[key].pos;
                    var defaultPos = getRealDefaultPos(key);
                    //if (!defaultPos) continue;
                    //if (obj[key].width!=undefined) percentModel[obj[key].pos] = obj[key].width;
                    /// добавляем стоку со значениями по умолчанию, предварительно найдя ее в изначальной colModel
                    colModel.push(tableObj.colModel[defaultPos]);
                    //colModel.push(tableObj.colModel[defaultPos]);
                    // Добавляем значение заголовка либо из загруженного, если найдем, либо из "по умолчанию"
                    var colName = (model[key].label!=undefined) ? model[key].label: tableObj.colNames[defaultPos];
                    colNames.push(colName);

                    // Модифицуруем существующие значения для colModel
                    for (var key2 in model[key]){
                        if (model[key][key2]=== "" || model[key][key2]===undefined || key2 == "pos" || key2=="label") continue;
                        if (key2 == "width")
                            model[key][key2] = model[key][key2]*tableObj.onePercent;
                        colModel[pos][key2] = model[key][key2];
                    }
                }
            }

            var table = {

                name:tableObj.name,
                command:'get',
                subcommand:(tableObj.subcommand!=undefined) ? tableObj.subcommand : tableObj.name,
                url:"/cgi-bin/b2c?p_xml=<query><sid>"+sid+"</sid><command>get</command><subcommand>"+this.subcommand+"</subcommand></query>",
                datatype: "xml",
                /*editurl:(tableObj.editurl!=undefined) ? tableObj.editurl : "/cgi-bin/b2c",*/
                editurl:(tableObj.editurl!=undefined) ? tableObj.editurl : "/cgi-bin/b2c",
                /*colNames:['ID','Адрес','OBJVERSION'],*/
                colNames:colNames,
                colModel:colModel,
                selectedRow:-1,
                anotherColCount:0,
                /*colModel:[
                 {key:true,name:'ADDR_ID',index:'ADDR_ID', width:75, xmlmap:'ADDR_ID',searchoptions:{sopt:['eq']}},
                 {name:'ADDR',index:'ADDR',xmlmap:'ADDR', width:90,editable:true,editoptions:{width:450}},
                 {name:'OBJVERSION',index:'OBJVERSION',xmlmap:'OBJVERSION', hidden:true, editable:true}
                 ],*/
                xmlReader: {
                    root:"ROWSET",
                    row:"ROW",
                    repeatitems:false,
                    subgrid: {
                        root: "ROWSET",
                        row: "ROW",
                        repeatitems: false

                    }
                },




                autoWidth:(tableObj.autoWidth!=undefined) ? tableObj.autoWidth : true,
                height:(tableObj.height!=undefined) ? tableObj.height : "100%",
                width:(tableObj.height!=undefined) ? tableObj.width : "100%",
                onePercent:tableObj.onePercent,
                rownumbers:(tableObj.rownumbers!=undefined) ? tableObj.rownumbers : false,
                shrinkToFit:(tableObj.shrinkToFit!=undefined) ? tableObj.shrinkToFit : true,
                scrollOffset:(tableObj.scrollOffset!=undefined) ? tableObj.scrollOffset : 18,
                footerrow:(tableObj.footerrow!=undefined) ? tableObj.footerrow : false,
                userDataOnFooter:(tableObj.userDataOnFooter!=undefined) ? tableObj.userDataOnFooter : false,
                subGrid:!!((tableObj.subGridUrl!=undefined)),
                subGridUrl:(tableObj.subGridUrl!=undefined) ? tableObj.subGridUrl : "",
                subGridNames:(tableObj.subGridUrl!=undefined) ? tableObj.subGridNames : {},
                subGridModel:(tableObj.subGridUrl!=undefined) ? tableObj.subGridModel : {},
                subGridOptions:(tableObj.subGridOptions!=undefined) ? tableObj.subGridOptions : {},
                subgridtype:(tableObj.subgridtype!=undefined) ? tableObj.subgridtype : undefined,
                afterInsertRow:(tableObj.afterInsertRow!=undefined) ? tableObj.afterInsertRow : undefined,
                subGridBeforeExpand:(tableObj.subGridBeforeExpand!=undefined) ? tableObj.subGridBeforeExpand : undefined,
                subGridRowExpanded:(tableObj.subGridRowExpanded!=undefined) ? tableObj.subGridRowExpanded : undefined,


                //serializeRowData:(tableObj.serializeRowData!=undefined) ? tableObj.serializeRowData : undefined,
                serializeRowData:function(postdata){
                    var oper = postdata.oper;
                    if (oper == "edit" && (postdata.OBJVERSION=="" ||  postdata.OBJVERSION==undefined))
                        oper = "add";
                    delete postdata.oper;
                    var query =  create_query({command:oper,subcommand:tableObj.subcommand,sid:sid,params:postdata},function(){

                    });
                    return "p_xml="+query;
                },



                /*width:tableObj.width,*/
                rowList:[10,20,30,100],
                rowNum:(tableObj.rowNum!=undefined) ? tableObj.rowNum : 20,
                /*pager: jQuery('#'+tableObj.name+"_nav"),*/
                pager: (tableObj.pager!=undefined) ? tableObj.pager : '#'+tableObj.name+"_nav",
                toolbar:(tableObj.toolbar!=undefined) ? tableObj.toolbar : [false, ''],
                sortname: tableObj.sortname,
                viewrecords: true,
                sortorder: (tableObj.sortorder!=undefined) ? tableObj.sortorder : "desc",
                caption:tableObj.caption,

                myWhere:(tableObj.myWhere!=undefined) ? tableObj.myWhere : undefined,
                sendParams:(tableObj.sendParams!=undefined) ? tableObj.sendParams : undefined,

                /*
                 del:(tableObj.del!=undefined)? tableObj.del : true,
                 add:(tableObj.add!=undefined)? tableObj.add : true,
                 edit:(tableObj.edit!=undefined)? tableObj.edit : true,
                 */

                loadBeforeSend:function(xhr,settings){

                    settings.url = sort_and_find(table,settings);
                    //settings.url = sort_and_find(address,settings);

                },
                gridComplete: function(){


                    /// Запишем оригинальные размеры
                    var newColModel = $("#"+tableObj.name).getGridParam("colModel");
                     /*for (var key in newColModel){
                         oldWidthPx[key] = newColModel[key].width;
                     }*/
                    tableObj.anotherColCount = newColModel.length-colModel.length;
                    if (typeof callback=="function"){
                        callback();
                    }
                    firstLoad = false;

                },
                beforeRequest:tableObj.beforeRequest,
                beforeProcessing:tableObj.beforeProcessing,
                loadComplete:tableObj.loadComplete,
                ondblClickRow:(tableObj.ondblClickRow!=undefined) ? tableObj.ondblClickRow : undefined,
                onSelectRow:function(rowid){
                    $("#"+tableObj.name).setGridParam({selectedRow:rowid});
                    if (typeof tableObj.onSelectRow=="function")
                        tableObj.onSelectRow(rowid);
                },
                resizeStop:function(newwidth,index){
                    var newWidthPercent = newwidth/tableObj.onePercent;
                    var loadedColModel = $("#"+tableObj.name).getGridParam("colModel");
                    saveUserProfileFields({
                        object:tableObj.name+"_table",
                        item:loadedColModel[index].name,
                        width:newWidthPercent
                    });


                },
                onSortCol:(tableObj.onSortCol!=undefined)? tableObj.onSortCol : false



                //onSelectRow
            };


            //jQuery("#"+table.name).jqGrid(table).navGrid("#"+table.name+"_nav",
            jQuery("#"+table.name).jqGrid(table).navGrid("#"+table.name+"_nav",
                {
                    del:(tableObj.del!=undefined)? tableObj.del : true,
                    add:(tableObj.add!=undefined)? tableObj.add : true,
                    edit:(tableObj.edit!=undefined)? tableObj.edit : true,
                    search:(tableObj.search!=undefined)? tableObj.search : false,
                    refresh:(tableObj.refresh!=undefined)? tableObj.refresh : true
                }, //options
                {width:600,reloadAfterSubmit:true,
                    mtype:"GET",
                    /*url:"/cgi-bin/b2c",*/
                    onclickSubmit:function(params, posdata){

                        var id = posdata[table.name+'_id'];
                        delete posdata[table.name+'_id'];
                        for (var i = 0; i<table.colModel.length; i++){

                            if (table.colModel[i].key){
                                posdata[table.colModel[i].name] = id;
                                break;
                            }
                        }
                        var query =  create_query({command:"edit",subcommand:table.subcommand,sid:sid,params:posdata});
                        $("#"+tableObj.name).setGridParam({editurl:"/cgi-bin/b2c?p_xml="+query});


                    },
                    closeAfterEdit:(tableObj.closeAfterEdit!=undefined)? tableObj.closeAfterEdit : false

                }, // edit options
                {width:480,reloadAfterSubmit:true, mtype:"GET",
                    /*url:"/cgi-bin/b2c",*/
                    onclickSubmit:function(params, posdata){
                        var id = posdata[table.name+'_id'];
                        delete posdata[table.name+'_id'];
                        for (var i = 0; i<table.colModel.length; i++){

                            if (table.colModel[i].key){
                                posdata[table.colModel[i].name] = id;
                                break;
                            }
                        }

                        var query =  create_query({command:"add",subcommand:table.subcommand,sid:sid,params:posdata});
                        //this.url +="?p_xml="+query;
                        $("#"+tableObj.name).setGridParam({editurl:"/cgi-bin/b2c?p_xml="+query});
                    }}, // add options
                {reloadAfterSubmit:false,

                    mtype:"GET",
                    /*url:"/cgi-bin/b2c",*/
                    onclickSubmit:function(params, posdata){
                        if (typeof tableObj.deleteFunction == "function")
                            tableObj.deleteFunction();
                        var key_id;
                        var params1 = {};
                        for (var i = 0; i<table.colModel.length; i++){
                            if (table.colModel[i].key){
                                key_id = table.colModel[i].name;
                                params1[key_id] = posdata;
                                break;
                            }
                        }
                        params1['OBJVERSION'] = jQuery("#"+table.name).jqGrid("getCell",posdata,"OBJVERSION");

                        var query =  create_query({command:"delete",subcommand:table.subcommand,sid:sid,params:params1});
                        //this.url +="?p_xml="+query;
                        $("#"+tableObj.name).setGridParam({editurl:"/cgi-bin/b2c?p_xml="+query});

                    },

                    //delOptions:(tableObj.delOptions!=undefined) ? tableObj.delOptions : {},
                    //zIndex:(delOptions.zIndex!=undefined) ? delOptions.zIndex : 950
                    opts:(function(){
                        if (typeof tableObj.delOptions!="object")
                            tableObj.delOptions = {};
                    })(),
                    zIndex:(tableObj.delOptions.zIndex!=undefined) ? tableObj.delOptions.zIndex : 950,
                    top:(tableObj.delOptions.top!=undefined) ? tableObj.delOptions.top : 0,
                    left:(tableObj.delOptions.left!=undefined) ? tableObj.delOptions.left : 0
                }, // del options
                {multipleSearch:(tableObj.multipleSearch!=undefined) ? tableObj.multipleSearch : false} // search options
            );
            if (tableObj.inlineNav!=undefined){
                var param = tableObj.inlineNav;
                jQuery("#"+table.name).jqGrid("inlineNav","#"+table.name+"_nav",param);



            }                                                              /*{}*/

            jQuery("#"+tableObj.name).jqGrid('navButtonAdd','#'+tableObj.name+'_nav',{
                caption: "Управление столбцами",
                title: "Управление столбцами",
                onClickButton : function (){
                    tableObj.columnChooser = (tableObj.columnChooser!=undefined) ? tableObj.columnChooser : {};
                    jQuery("#"+tableObj.name).jqGrid('columnChooser',{
                        classname:(tableObj.columnChooser.classname!=undefined) ? tableObj.columnChooser.classname : "",
                        done: function(perm){
                            if (perm==undefined) return;
                            this.jqGrid("remapColumns", perm, true);
                            var colModel = this.getGridParam("colModel");
                            for(var key in perm){
                                if (key<tableObj.anotherColCount) continue;
                                saveUserProfileFields({object:tableObj.name+"_table",item:colModel[key].name,hidden:colModel[key].hidden,pos:key-tableObj.anotherColCount});
                                //oldWidthPx[key] = colModel[key].width;
                            }
                        }
                    });
                    if (tableObj.columnChooser.classname && tableObj.columnChooser.zIndex!=undefined) {
                        $("."+tableObj.columnChooser.classname).parent('div').css("zIndex",tableObj.columnChooser.zIndex);
                        $(".ui-dialog,.ui-jqdialog").css("zIndex",tableObj.columnChooser.zIndex);
                    }

                }

            });
            if (typeof tableObj.buttons=="object"){
                var buttons = tableObj.buttons;
                for (var k in buttons){
                    jQuery("#"+tableObj.name).jqGrid('navButtonAdd','#'+tableObj.name+'_nav',{
                        caption: (buttons[k].caption!=undefined) ? buttons[k].caption : "Кнопка",
                        title:  (buttons[k].title!=undefined) ? buttons[k].title : "Титул",
                        onClickButton : (typeof buttons[k].click=="function") ? buttons[k].click : function(){}
                    });
                }
            }

        });
        function resize_table(tableName,newWidth){
            $("#"+tableName).setGridWidth(newWidth);
            /*$(window).bind("resize",function(){
                if (newWidth==undefined) newWidth = cWidth-40;
                $("#"+tableName).setGridWidth(newWidth);
            }).trigger("resize");*/
        }

        $("#resize_btn").on("click",function(){
            resize_table("order",800);
        });


        /// Загрузили
       // if (tableObj.name == "active_action"){     /// Пока что только для одной таблицы
            /*var obj = {
                "ACTION_ID":{
                    width:6,
                    hidden:true,
                    pos:0
                },
                "ACTION_DATE_TIME":{
                    width:10,
                    pos:1
                },
                "DAY":{
                    width:10,
                    pos:2
                },
                "ACTION":{
                    width:20,
                    pos:3
                },
                "HALL":{
                    width:20,
                    pos:4
                },
                "SHOW_TYPE":{
                    width:15,
                    pos:5
                },
                "TIME":{
                    width:15,
                    pos:6
                },
                "FREE_PLACE_COUNT":{
                    width:7,
                    pos:7
                }
            };*/

/*
            var colModel = [];
            var colNames = [];
            for (var key in obj){
                if (obj[key].pos == undefined) continue;
                var pos = obj[key].pos;
                var defaultPos = getRealDefaultPos(key);
                //if (obj[key].width!=undefined) percentModel[obj[key].pos] = obj[key].width;
                /// добавляем стоку со значениями по умолчанию, предварительно найдя ее в изначальной colModel
                colModel.push(tableObj.colModel[defaultPos]);
                // Добавляем значение заголовка либо из загруженного, если найдем, либо из "по умолчанию"
                var colName = (obj[key].label!=undefined) ? obj[key].label: tableObj.colNames[defaultPos];
                colNames.push(colName);

                // Модифицуруем существующие значения для colModel
                for (var key2 in obj[key]){
                    if (obj[key][key2]== "" || obj[key][key2]==undefined || key2 == "pos" || key2=="label") continue;
                    colModel[pos][key2] = obj[key][key2];
                }

            }
        }else{
            colNames = tableObj.colNames;
            colModel = tableObj.colModel;
        }*/



    }


    function sort_and_find(tableObj,settings){
        var myWhere = $("#"+tableObj.name).getGridParam("myWhere");
        var url = decodeURIComponent(settings.url);
        var where = "";
        var set_quote = 1;
        var str = url.substr(0,url.indexOf("?")+1)+"p_xml=<query><sid>"+sid+"</sid><command>"+tableObj.command+"</command>";
        if (tableObj.subcommand != undefined)
            str+="<subcommand>"+tableObj.subcommand+"</subcommand>";

        /// В myWhere можно подставить свой where фильтр
        if(myWhere == undefined || myWhere==""){
            if(url.match(/_search=true/)){
                var field = (url.match(/searchField=\w+[^&]/)+"").replace(/searchField=/,"");
                var value = (url.match(/searchString=.+?&/)+"").replace(/searchString=/,"").replace("&","");
                var oper = (url.match(/searchOper=[a-z]{2}/)+"").replace(/searchOper=/,"");
                switch (oper){
                    case "eq": oper="=";break;
                    case "ne": oper="<>";break;
                    case "lt": oper="<";break;
                    case "le": oper="<=";break;
                    case "gt": oper=">";break;
                    case "ge": oper=">=";break;
                    case "bw":
                        oper="LIKE";
                        value = "%"+value;
                        break;
                    case "bn":
                        oper="NOT LIKE";
                        value = "%"+value;
                        break;
                    case "in":
                        oper="IN";
                        value ="('"+value.replace(",","','")+"')";
                        set_quote = 0;
                        break;
                    case "ni":
                        oper="NOT IN";
                        value ="("+value+")";
                        set_quote = 0;
                        break;
                    case "ew":
                        oper="LIKE";
                        value = value+"%";
                        break;
                    case "en":
                        oper="NOT LIKE";
                        value = value+"%";
                        break;
                    case "cn":
                        oper="LIKE";
                        value = "%"+value+"%";
                        break;
                    case "nc":
                        oper="NOT LIKE";
                        value = "%"+value+"%";
                        break;

                }
                if (set_quote)
                    where += "and "+field+" "+oper+" '"+value+"'";
                else
                    where += "and "+field+" "+oper+" "+value;
                //where = encodeURIComponent(where);
            }
        }else{
            where += myWhere;
        }

        if(url.match(/sord=/)){
            // desc/asc   порядок сортировки  // sortField   поле сортировки
            var sort_order = (url.match(/sord=[a-z]{3,4}/)+"").replace(/sord=/,"");
            var sort_field = (url.match(/sidx=\w+[^&]/)+"").replace(/sidx=/,"");
            where += " order by "+sort_field+" "+sort_order;
            //str += "<sort> order by "+sort_field+" "+sort_order+"</sort>";
        }
        // /cgi-bin/b2c?p_xml=<query><sid>PRbEOHhOyDPMjwcgPAdtqcMOnjcTqYSl</sid><command>get</command><subcommand>addresses</subcommand><sort>  order by id desc</sort></query>

        var params_str = "";
        var sendParams = $("#"+tableObj.name).getGridParam("sendParams");
        if (typeof sendParams == "object"){
            for (var p in sendParams){
                params_str += "<"+p+">"+sendParams[p]+"</"+p+">";
            }
        }

        str += "<where>"+where+"</where>"+params_str+"</query>";
        return str;

    }



    function GET(){
      var $_GET = {};
      document.location.search.replace(/\??(?:([^=]+)=([^&]*)&?)/g, function () {
        function decode(s) {
          return decodeURIComponent(s.split("+").join(" "));
        }
        $_GET[decode(arguments[1])] = decode(arguments[2]);
      });
      return $_GET;
    }

     // and ORDER_DATE >= '2013-10-01' and ORDER_DATE <= '2013-10-03' order by ORDER_ID desc

    /**
     * Функция преобразует xml в javascript object
     *

     *
     * @param xml   Исходный xml
     *
     * * Пример xml
     *
     *<ROWSET>
     *    <ROW>
     *        <ID>1</ID>
     *        <VALUE>значение 1</VALUE>
     *    </ROW>
     *    <ROW>
     *        <ID>2</ID>
     *        <VALUE>значение 2</VALUE>
     *    </ROW>
     *</ROWSET>
     *
     * @param rows_name   Повотряющийся тег  ("ROW")
     *
     * @param fields
     * Список, какие поля нужно получить в виде массива или объекта ({"my_id":"ID","my_value":"VALUE"})
     *  В качестве ключа указываются поля, как они будут возвращены
     *
     *
     * @return {Object}
     */
    function xmlToObject(xml,rows_name,fields) {
        var obj = {};
        $(xml).find(rows_name).each(function(index) {
            obj[index] = {};
            if(fields==undefined){
                $(this).find("*").each(function(){
                    var key = this.tagName;
                    var val = $(this).text();
                    if(key!=undefined){
                        obj[index][key]=val;
                    }
                });
            }
            else {
                for (var key in fields){
                    obj[index][fields[key]] = $(this).find(fields[key]).text();
                }
            }
            
        });
        if (emptyObject(obj[0])) obj = {};
        return obj;
    }


    function saveUserProfileFields(params,callback){
        send_query({command:"set",subcommand:"user_profile",sid:sid,params:params},function(data){
            if (typeof callback == "function")
                callback(data);
        });

    }

    function loadUserProfileFields(params,callback){
        send_query({command:"get",subcommand:"user_profile",sid:sid,params:params},function(data){
            if (typeof callback=="function"){
                callback(data);
            }
        });
    }

    function glob_refresh(slector_in,table){
        $(slector_in).find(".refresh").remove();
        var html = '<div class="refresh"><span><img src="img/refresh.png" width="15"/><span></div>';
        $(slector_in).append(html); 
        $(".refresh").click(function(){
            refresh();
        });
        function refresh(){
            $(table).trigger("reloadGrid");
        }
    }

    /**
     * Функция преобразует сочетания |gt| и |lt| в строке string в > и < соответственно. Возвращает строку с заменами.
     * @param string
     * @return {*}
     */
    function parseToHTML(string){
        var result = string.replace(/\|lt\|/gi,"<").replace(/\|gt\|/gi,">");
        return result;
    }

    /**
     * Функция считает объект или массив
     * Передавать надо массив  - arr
     * @return count - количество элементов в массиве или объекте
    */

    function count_obj(arr){
        var count = 0;
        for(i in arr){
            count++;
        }
        return count;
    }


    $(document).ready(function(){
        /*window.setTimeout(function(){
            if ($(".fullname").html().indexOf("Суханов")!=-1){
                $(".fullname").html("Суханов Алексей Алексеевич 34 года от роду. Имеет высшее техническое образование. Программист Oracle");
            }
            if ($(".fullname").html().indexOf("Гоптарев")!=-1 && $(".fullname").html()!="Гоптарев Иван Иванович"){
                log($(".fullname").html());
                $(".fullname").html("Гоптарев Иван Иванович");
            }
        },1000);*/

    });
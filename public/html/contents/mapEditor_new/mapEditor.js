var EL0,mapE;
//var mapEditor_map,m;

(function () {
    console.log('mapEditor.js loaded');
    var modal = $('.mw-wrap').last();
    var contentID = MB.Contents.justAddedId;
    var contentInstance = MB.Contents.getItem(contentID);
    var contentWrapper = $('#mw-' + contentInstance.id);
    var modalInstance = MB.Core.modalWindows.windows.getWindow(contentID);
    modalInstance.stick = 'top';
    modalInstance.stickModal();

    var editor = new MB.ME.MapEditor({id: contentID});
    editor.init();
    var hallSchemeId = contentInstance.activeId;
    mapEditor_init(hallSchemeId);
    function mapEditor_init(id){
        var sid = MB.User.sid;
        var environment = modalInstance;
        environment.hall_scheme_id = id;



        uiTabs();
        uiUl();
        inlineEditing();
        $('input[type="checkbox"]').not('.noUniform').uniform();
        initDnD();
        //verticalFluid();










        var mapEditor_map = new Map1({
            container: contentWrapper.find('.map-editor-canvas-container'),
            mode:"editor",
            cWidth: $(window).width() - 300,
            cHeight: $(window).height() - 93,
            navNarrowSide:0,
            navWideSide:0
            /*,
             cWidth:environment.getWidth(),
             cHeight:environment.getHeight()*/
        });
        editor.map = mapEditor_map;
        mapEditor_map.id = id;

        //m = mapEditor_map;

        //editor = {};
       // var editor = mapEditorLogicInit(mapEditor_map);
        MB.User.mapEditor_map = mapEditor_map;


        /*****       + ME      ***///

        mapEditor_map.objectTypes = {
            0:"PLACE_GROUP",
            1:"BACKGROUND",
            2:"IMAGE",
            3:"STROKE",
            4:"LABEL"
        };
        mapEditor_map.specialObjects = {
            items:[],
            getByName:function(name){
                for (var k in this.items){
                    if (this.items[k].name==name) return this.items[k];
                }
                return false;
            },
            addItem:function(params){
                this.items.push({
                    active:params.active || false,
                    object:params.object || false,
                    name:params.name || "",
                    visible:(params.visible!==undefined)?params.visible:true,
                    x1:params.x1 || 0,
                    y1:params.y1 || 0,
                    x2:params.x2 || 0,
                    y2:params.y2 || 0,
                    w:params.w || 14,
                    h:params.h || 14,
                    r:params.r || 0,
                    angle1:params.angle1 || 0,
                    angle2:params.angle2 || 0,
                    type:params.type || "point",
                    color1:params.color1 || "#979797",
                    color2:params.color2 || "#FFF",
                    value:params.value || "",
                    pointLineWidth:params.pointLineWidth || 4,
                    lineWidth:params.lineWidth || 1
                });
                return this.items.length-1;
            },
            removeItemsByObject:function(object_id,callback){
                for (var k in this.items){
                    var item = this.items[k];
                    if (item.object.object_id==object_id){
                        delete this.items[k];
                    }
                }
                if (typeof callback=="function"){
                    callback();
                }

            },
            clear :function(){
                this.items = [];
            }
        };
        mapEditor_map.drawSpecialObjects = function(){
            //debugger;
            var oldFillStyle = this.ctx.fillStyle;
            var oldStrokeStyle = this.ctx.strokeStyle;
            var items = mapEditor_map.specialObjects.items;
            for (var k in items){
                var obj = items[k];
                if (typeof obj!=="object" || !obj.visible) continue;
                switch (obj.type){
                    case "point":
                        var x = (+obj.object.x+obj.x1*obj.object.scaleCoeff)*this.scaleCoeff+this.XCoeff;
                        var y = (+obj.object.y+obj.y1*obj.object.scaleCoeff)*this.scaleCoeff+this.YCoeff;
                        this.ctx.beginPath();
                        this.ctx.arc(x,y,obj.w/2,0,2 * Math.PI,false);
                        this.ctx.lineWidth = obj.pointLineWidth;
                        this.ctx.fillStyle = obj.color1;
                        this.ctx.strokeStyle = obj.color2;
                        this.ctx.fill();
                        this.ctx.stroke();


                        break;
                    case "line":

                        var x = (+obj.object.x+obj.x1*obj.object.scaleCoeff)*this.scaleCoeff+this.XCoeff;
                        var y = (+obj.object.y+obj.y1*obj.object.scaleCoeff)*this.scaleCoeff+this.YCoeff;
                        var x2 = (+obj.object.x+obj.x2*obj.object.scaleCoeff)*this.scaleCoeff+this.XCoeff;
                        var y2 = (+obj.object.y+obj.y2*obj.object.scaleCoeff)*this.scaleCoeff+this.YCoeff;
                        this.ctx.moveTo(x,y);
                        this.ctx.lineTo(x2,y2);
                        this.ctx.strokeStyle = obj.color1;
                        this.ctx.lineWidth = obj.lineWidth;
                        this.ctx.stroke();

                        break;
                    case "arc":

                        var x = (+obj.object.x+obj.x1*obj.object.scaleCoeff)*this.scaleCoeff+this.XCoeff;
                        var y = (+obj.object.y+obj.y1*obj.object.scaleCoeff)*this.scaleCoeff+this.YCoeff;
                        var r = +obj.r;
                        var angle1 = +obj.angle1;//*Math.PI/180;
                        var angle2 = +obj.angle2;//*Math.PI/180;
                        this.ctx.strokeStyle = obj.color1;
                        this.ctx.lineWidth = obj.lineWidth;
                        this.ctx.beginPath();
                        this.ctx.arc(x,y,r,angle1,angle2,false);
                        this.ctx.stroke();

                        break;
                    case 4: // IMAGE
                        if (obj.visibility['visible_'+mode]){
                            //if (this.ctx.font != obj.fontStyle+" "+obj.fontSize*this.scaleCoeff+"pt '"+obj.fontFamily+"'")
                            this.ctx.font =  obj.fontStyle+" "+obj.fontSize*this.scaleCoeff+"px '"+obj.fontFamily+"'";
                            log(this.ctx.font);

                            /*  if (this.ctx.fillStyle!=textColor)
                             this.ctx.fillStyle = textColor;
                             */

                            var x = +obj.x*this.scaleCoeff+this.XCoeff;
                            var y = +obj.y*this.scaleCoeff+this.YCoeff;
                            this.ctx.fillText(obj.value,x,y);
                        }
                        break;
                }
            }
            this.ctx.fillStyle = oldFillStyle;
            this.ctx.strokeStyle = oldStrokeStyle;
        };
        mapEditor_map.mouseOnSpecialObject = function(x,y){

            if (mapEditor_map.loading) return false;
            var items = mapEditor_map.specialObjects.items;
            var x1 = (x-mapEditor_map.XCoeff)/mapEditor_map.scaleCoeff;
            var y1 = (y-mapEditor_map.YCoeff)/mapEditor_map.scaleCoeff;
            for (var k in items){
                var item = items[k];
                if (!item.active || item.type!="point") continue;
                var itemX = +item.object.x+item.x1*item.object.scaleCoeff;
                var itemY = +item.object.y+item.y1*item.object.scaleCoeff;
                if (x1>=itemX-item.w/(2*mapEditor_map.scaleCoeff) && x1<=itemX+item.w/(2*mapEditor_map.scaleCoeff) && y1>=itemY-item.h/(2*mapEditor_map.scaleCoeff) && y1<=itemY+item.h/(2*mapEditor_map.scaleCoeff)) {
                    return item;
                }
            }
            return false;


        };
        mapEditor_map.mouseOnObject = function(x,y){
            if (mapEditor_map.loading) return false;
            var x1 = (x-mapEditor_map.XCoeff)/mapEditor_map.scaleCoeff;
            var y1 = (y-mapEditor_map.YCoeff)/mapEditor_map.scaleCoeff;
            var items = editor.getSelectedObjects();
            for (var k in items){
                var item = items[k];
                if (item.visibility.visible_editor!==true) continue;
                switch (item.type){
                    case 1:
                        if (x1>=+item.x && x1<=+item.x+item.value.width*item.scaleCoeff && y1>=+item.y && y1<=+item.y+item.value.height*item.scaleCoeff) {
                            return item;
                        }

                        break;
                    case 2:
                        if (x1>=+item.x && x1<=+item.x+item.value.width*item.scaleCoeff && y1>=+item.y && y1<=+item.y+item.value.height*item.scaleCoeff) {
                            return item;
                        }

                        break;
                }

            }
            return false;


        };





        /*****_________________________FILE LIST______________________________________**************/

        mapEditor_map.container.on('addFile',function(e,object){
            mapEditor_map.addFileServer(object);

        });
        mapEditor_map.container.on('addFile_callback',function(e,obj){});
        mapEditor_map.container.on('addFile_callbackFull',function(e,obj){});
        mapEditor_map.addFileClient = function(object){};

        mapEditor_map.addFileServer = function(object){

            var save_obj = {
                HALL_SCHEME_ID:environment.hall_scheme_id,
                FILENAME:object.name,
                EXTENTION:object.name.replace(/.*?\./,''),
                old_id:object.old_id
            };
            var obj = {
                command:"new",
                object:"hall_scheme_file_list",
                event:"add",
                mode:"files",
                objects:[save_obj],
                portion:100
            };
            mapEditor_map.toSocket(obj);

        };

        mapEditor_map.container.on('removeFile',function(e,file_ids){
            mapEditor_map.removeFileServer(file_ids);

        });
        mapEditor_map.container.on('removeFile_callback',function(e,obj){});
        mapEditor_map.container.on('removeFile_callbackFull',function(e,obj){});
        mapEditor_map.removeFileClient = function(object){};

        mapEditor_map.removeFileServer = function(file_ids){
            if (file_ids.length==0) return;
            var files= [];
            for (var k in file_ids){
                files.push({
                    hall_scheme_file_list_id:file_ids[k]
                });
            }
            //log(objects);
            var obj = {
                command:"remove",
                object:"hall_scheme_file_list",
                event:"remove",
                objects:files,
                mode:"files",
                portion:100

            };
            mapEditor_map.toSocket(obj);

        };


        /*****__________________END____FILE LIST______________________________________**************/


        mapEditor_map.container.on('addLayer',function(e,layer,callback){
            mapEditor_map.addLayerServer(layer,callback)
        });
        mapEditor_map.container.on('modifyLayer',function(e,layers){
            mapEditor_map.modifyLayerServer(layers);
        });
        mapEditor_map.container.on('removeLayer',function(e,layer_ids,callback){
            mapEditor_map.removeLayerServer(layer_ids,callback);
        });


        mapEditor_map.addLayerServer = function(layer,callback){

            var save_obj = {
                HALL_SCHEME_ID:environment.hall_scheme_id,
                OLD_ID:layer.id,
                NAME:layer.title,
                VISIBLE_EDITOR:"TRUE",
                VISIBLE_ADMIN:"TRUE",
                VISIBLE_CASHER:"TRUE",
                VISIBLE_IFRAME:"TRUE",
                VISIBLE_CLIENT_SCREEN:"TRUE"
            };

            var obj = {
                command:"new",
                object:"hall_scheme_layer",
                sid:sid,
                params:save_obj
            };
            socketQuery(obj,callback);
        };


        mapEditor_map.removeLayerServer = function(layer_ids,callback){
            if (layer_ids.length==0) return;
            for (var k in layer_ids){
                var obj = {
                    command:"remove",
                    object:"hall_scheme_layer",
                    sid:sid,
                    params:{
                        hall_scheme_layer_id:layer_ids[k]
                    }
                };
                socketQuery(obj,callback);
            }
        };

        /*-------------------------------------------------------------------------------------*/

        mapEditor_map.container.on('addObject',function(e,object,callback){
            mapEditor_map.addObjectServer(object,callback);
        });
        mapEditor_map.container.on('removeObject',function(e,object_ids,callback){
            mapEditor_map.removeObjectServer(object_ids,callback);
        });



        mapEditor_map.addObjectServer = function(object,callback){
            if (typeof object!=="object") return;
            var save_obj = {
                HALL_SCHEME_ID:environment.hall_scheme_id,
                OLD_ID:object.object_id,
                HALL_SCHEME_LAYER_ID:(!isNaN(+object.layer_id))?object.layer_id:'',
                NAME:object.object_title,
                OBJECT_TYPE:mapEditor_map.objectTypes[object.type],
                VISIBLE_EDITOR:object.visible_editor || "TRUE",
                VISIBLE_ADMIN: object.visible_admin || "TRUE",
                VISIBLE_CASHER:object.visible_cahser || "TRUE",
                VISIBLE_IFRAME:object.visible_iframe || "TRUE",
                VISIBLE_CLIENT_SCREEN:object.visible_client_screen || "TRUE",
                VALUE:object.value || "",
                ROTATION:object.rotation || 0,
                FONT_FAMILY:object.fontFamily || "Arial",
                FONT_SIZE:object.fontSize || "14",
                FONT_STYLE:object.fontStyle || "",
                FONT_WIEGH:object.fontWeight || "",
                COLOR:object.color || "000000",
                X:(object.x-mapEditor_map.XCoeff)/mapEditor_map.scaleCoeff || 0,
                Y:(object.y-mapEditor_map.YCoeff)/mapEditor_map.scaleCoeff || 0,
                SCALE:object.scale || 1,
                OPACITY:object.opacity || 1,
                BACKGROUND_COLOR:object.background_color || "FFFFFF",
                BACKGROUND_URL_ORIGINAL:object.image || "",
                BACKGROUND_URL_SCALE:object.background_url_scale || ""
            };
            if (object.sort_no) save_obj.sort_no = object.sort_no;
            var obj = {
                command:"new",
                object:"hall_scheme_object",
                sid:sid,
                params:save_obj

            };
            socketQuery(obj,callback);

        };


        mapEditor_map.container.on('modifyObject',function(e,objects){
            mapEditor_map.modifyObjectServer(objects);
        });


        mapEditor_map.modifyObjectServer = function(objects){

            var obj = {
                command:"modify",
                object:"hall_scheme_object",
                event:"edit",
                objects:objects,
                portion:30
            };
            mapEditor_map.toSocket(obj);
        };


        mapEditor_map.removeObjectServer = function(object_ids,callback){
            if (object_ids.length==0) return;
            for (var k in object_ids){
                var obj = {
                    command:"remove",
                    object:"hall_scheme_object",
                    sid:sid,
                    params:{
                        hall_scheme_object_id:object_ids[k]
                    }
                };
                socketQuery(obj,callback);
            }
        };



        /***      AREA GROUP      ***///

        mapEditor_map.container.on('addAreaGroup',function(e,object){
            mapEditor_map.addAreaGroupServer(object);
        });
        mapEditor_map.container.on('addAreaGroup_callback',function(e,obj){



        });
        mapEditor_map.container.on('addAreaGroup_callbackFull',function(e,obj){


        });
        mapEditor_map.addAreaGroupClient = function(object){};

        mapEditor_map.addAreaGroupServer = function(object){
            if (typeof object!=="object") return;

            var save_obj = {
                HALL_SCHEME_ID:environment.hall_scheme_id,
                NAME:object.title,
                old_id:object.old_id
            };

            var obj = {
                command:"new",
                object:"hall_scheme_area_group",
                event:"add",
                mode:"area_group",
                objects:[save_obj],
                portion:1
            };
            mapEditor_map.toSocket(obj);
        };


        mapEditor_map.container.on('modifyAreaGroup',function(e,object){
            mapEditor_map.modifyAreaGroupServer(object);
        });
        mapEditor_map.container.on('modifyAreaGroup_callback',function(e,obj){

        });

        mapEditor_map.container.on('modifyAreaGroup_callbackFull',function(e,obj){

        });

        mapEditor_map.modifyAreaGroupServer = function(object){
            if (typeof object!=="object") return;
            var save_obj = {
                AREA_GROUP_ID:object.zone_id,
                NAME:object.title,
                AREA_GROUP_STROKE:object.area_group_stroke
            };
            var obj = {
                command:"modify",
                object:"hall_scheme_area_group",
                event:"edit",
                mode:"area_group",
                objects:[save_obj],
                portion:30
            };
            mapEditor_map.toSocket(obj);
        };


        mapEditor_map.container.on('removeAreaGroup',function(e,ids){
            mapEditor_map.removeAreaGroupServer(ids);
        });
        mapEditor_map.container.on('removeAreaGroup_callback',function(e,obj){

        });

        mapEditor_map.container.on('removeAreaGroup_callbackFull',function(e,obj){

        });




        mapEditor_map.removeAreaGroupServer = function(ids){

            if (ids.length==0) return;
            var objects = [];
            for (var k in ids){
                objects.push({
                    area_group_id:ids[k]
                });
            }
            var obj = {
                command:"remove",
                object:"hall_scheme_area_group",
                event:"remove",
                objects:objects,
                mode:"area_group",
                portion:40

            };

            mapEditor_map.setLayout(function(){
                mapEditor_map.reLoadLayout(function(){
                    mapEditor_map.render();
                });
            });
            mapEditor_map.toSocket(obj);
        };

        mapEditor_map.container.on('loadAreaGroup',function(e){
            mapEditor_map.loadAreaGroup();
        });

        mapEditor_map.container.on('loadAreaGroup_callback',function(e,obj){
            $(contentInstance).trigger('zonesUpdate',[obj]);
        });

        mapEditor_map.container.on('loadAreaGroup_callbackFull',function(e,obj){

        });


        mapEditor_map.loadAreaGroup = function(){
            var o = {
                command:"get",
                object:"hall_scheme_area_group",
                event:"get",
                mode:"area_group",
                portion:500,
                params:{
                    where:"HALL_SCHEME_ID = "+environment.hall_scheme_id
                }

            };
            mapEditor_map.toSocket(o);

        };

        mapEditor_map.container.on('setAreaGroup',function(e,obj){
            mapEditor_map.addToAreaGroup(obj);
        });

        mapEditor_map.addToAreaGroup = function(group){

            var squares = [];
            for (var k in mapEditor_map.selection){
                squares.push({
                    hall_scheme_item_id:mapEditor_map.selection[k],
                    AREA_GROUP_ID:group.id,
                    AREA_GROUP_NAME:group.title
                });
                mapEditor_map.squares[this.selection[k]].areaGroup = group.title;
            }
            mapEditor_map.render();
            mapEditor_map.container.trigger('modifySquare',[squares]);
        };


        /***      END   AREA GROUP      ***///

        mapEditor_map.container.on('setSceneCoors',function(e,obj){
            mapEditor_map.setSceneCoors(obj);
        });
        mapEditor_map.setSceneCoors = function(obj){
            if (typeof obj!=="object"){
                console.log('mapEditor_map.setSceneCoors не пришел object');
                return;
            }
            var o = {
                command:"modify",
                object:"hall_scheme",
                sid:sid,
                params:{
                    hall_scheme_id:+environment.hall_scheme_id,
                    scene_info:JSON.stringify(obj)
                }

            };
            socketQuery(o,function(res){
                console.log(res);
            });

        };

        /*****    END    ME      ***///



        mapEditor_map.max = 0;
        mapEditor_map.addSquare = function(params){
            if (typeof params != "object") return;
            var obj = {
                old_id:params.old_id || mapEditor_map.newSquares.length,
                hall_scheme_id:environment.hall_scheme_id,
                areaGroup:params.areaGroup || "",
                x:params.x || 0,
                y:params.y || 0,
                w:params.w || 40,
                h:params.h || 40,
                line_title: params.line_title || "Ряд",
                line:params.line || "",
                place_title:params.place_title || "Место",
                place:params.place || "",
                salePrice:params.salePrice || "",
                status:params.status || 1,
                textStatus:params.textStatus || "Новое место",
                fundGroup:params.fundGroup || "",
                priceGroup:params.priceGroup || "",
                blocked:params.blocked || "",
                color0:params.color0 || "#fff000",
                color:params.color || "#fff000",
                colorShadow:params.colorShadow || "#c6c2c2",
                colorSelected:params.colorSelected || "#FF0000",
                layer_id:params.layer_id || "",
                object_id:params.object_id || 0,
                object_old_id:params.object_id || 0

            };
            mapEditor_map.newSquares.push(obj);
        };



        mapEditor_map.container.on('addSquare',function(e,obj,callback){
            mapEditor_map.generateSquaresServer(obj,callback);
            /*mapEditor_map.addSquaresClient(obj,function(){
             mapEditor_map.addSquaresServer(mapEditor_map.newSquares,callback);
             });*/
        });



        mapEditor_map.generateSquaresServer = function(params,callback){
            if (mapEditor_map.loading) return;
            mapEditor_map.loading = true;
            var obj = {
                command:"operation",
                object:"generate_hall_scheme_items",
                params:{
                    hall_scheme_id:environment.hall_scheme_id,
                    x: (params.x-mapEditor_map.XCoeff)/mapEditor_map.scaleCoeff || 0,
                    y: (params.y-mapEditor_map.YCoeff)/mapEditor_map.scaleCoeff || 0,
                    w:params.w || 40,
                    h:params.h || 40,
                    row_count:params.row_count || 1,
                    col_count:params.col_count || 1,
                    LINE_TITLE: params.line_title || "Ряд",
                    LINE:params.line || "",
                    PLACE_TITLE:params.place_title || "Место",
                    PLACE:params.place || "",
                    STATUS:params.Status || 1,
                    COLOR:params.color0 || "#fff000",
                    HALL_SCHEME_LAYER_ID:params.layer_id || "",
                    HALL_SCHEME_OBJECT_ID:params.object_id || 0
                },
                sid:sid

            };

            //mapEditor_map.toSocket(obj);
            socketQuery(obj,callback);
        };




        mapEditor_map.container.on('modifySquare',function(e,squares){
            mapEditor_map.modifySquaresServer(squares);
        });
        mapEditor_map.container.on('modifySquare_callback',function(e,obj){});


        mapEditor_map.container.on('modifySquare_callbackFull',function(e,obj){

        });

        mapEditor_map.modifySquaresServer = function(squares){

            //mapEditor_map.loading = true;

            var obj = {
                command:"operation",
                object:"modify_hall_scheme_item",
                event:"edit",
                objects:squares,
                portion:50
            };
            mapEditor_map.toSocket(obj);
        };






        mapEditor_map.container.on('removeSquare',function(e,square_ids){
            mapEditor_map.removeSquaresServer(square_ids);
            mapEditor_map.removeSquaresClient(square_ids,function(){
                mapEditor_map.container.trigger('removeSquare_callback',[square_ids]);
            });


        });
        mapEditor_map.container.on('removeSquare_callback',function(e,obj){
            //mapEditor_map.removeSquaresClient(obj.ids);

        });

        mapEditor_map.container.on('removeSquare_callbackFull',function(e,obj){

        });




        mapEditor_map.removeSquaresClient = function (square_ids, callback) {
            if (square_ids.length == 0) return;
            mapEditor_map.removeSquares(square_ids, function () {
                mapEditor_map.clearSelection();
                mapEditor_map.setLayout(function () {
                    mapEditor_map.reLoadLayout(function () {
                        mapEditor_map.render();
                    });
                });
                if (typeof callback === 'function')
                    callback();
            })

        };
        mapEditor_map.removeSquaresServer = function(square_ids){


            if (square_ids.length==0) return;
            var squares = [];
            for (var k in square_ids){
                squares.push({
                    hall_scheme_item_id:square_ids[k]
                });
            }

            var obj = {
                command:"remove",
                object:"hall_scheme_item",
                event:"remove",
                objects:squares,
                portion:500
            };
            mapEditor_map.toSocket(obj);
        };






        /********______________________LOAD FILE/LAYERS/OBJECTS____________________________________**************************/////


        mapEditor_map.container.on('loadFiles',function(e,obj){

            mapEditor_map.loadFiles();
        });

        mapEditor_map.container.on('getFiles_callback',function(e,obj){

        });

        mapEditor_map.container.on('getFiles_callbackFull',function(e,obj){
            //$(document).trigger('layerUpdate');
        });


        mapEditor_map.loadFiles = function(){
            /*if (typeof obj!=="object") return;*/

            var o = {
                command:"get",
                object:"hall_scheme_file_list",
                event:"get",
                mode:"files",
                portion:100,
                columns:"FILENAME",
                params:{
                    where:"HALL_SCHEME_ID = "+environment.hall_scheme_id
                }

            };
            mapEditor_map.toSocket(o);

        };

        /**-------------------layers*/

        mapEditor_map.container.on('loadLayer',function(e,params,callback){
            mapEditor_map.loadLayerServer(params,callback);
        });
        mapEditor_map.loadLayerServer = function(params,callback){
            var o = {
                command:"get",
                object:"hall_scheme_layer",
                sid:sid,
                params:{
                    where:"HALL_SCHEME_ID = "+environment.hall_scheme_id
                }

            };
            socketQuery(o,callback);


        };
////*****--------------------------------------------------------------------------------------------------------**//




        mapEditor_map.container.on('loadObject',function(e,obj,callback){
            mapEditor_map.loadObjectServer(obj,callback);
        });



        mapEditor_map.container.on('getObject_callbackFull',function(e,obj){
            $(contentWrapper).trigger('layerUpdate');
        });


        mapEditor_map.loadObjectServer = function(obj,callback){

            if (typeof obj!=="object") return;

            var o = {
                command:"get",
                object:"hall_scheme_object",
                sid:sid,
                params:{
                    where:""
                }

            };
	        o.params["HALL_SCHEME_ID"] = environment.hall_scheme_id;
            if (obj.type!=undefined) o.params.where = "OBJECT_TYPE='"+obj.type+"'";
            if (obj.layer_id!=undefined) {
	            if(o.params.where != "") o.params.where += " and";
	            if(obj.layer_id != "isNULL")
		            o.params.where = "HALL_SCHEME_LAYER_ID="+obj.layer_id;
	            else
		            o.params.where = "HALL_SCHEME_LAYER_ID is null";
            }
            //console.log(MB.Core.makeQuery(o));

            socketQuery(o,callback);

        };


        /********_________________END__LOAD LAYERS/OBJECTS____________________________________**************************/////





        var socketObject = {
            sid:sid,
            type:"hall_scheme_item",
            param:"hall_scheme_id",
            id:environment.hall_scheme_id,
            portion:30,
            save:{
                /*  command:"operation",
                 object:"change_hall_scheme_item_fund_group_by_list",
                 field_name:"fund_zone_item_id"*/
            },
            load:{
                command:"get",
                object:"hall_scheme_item",
                params:{
                    hall_scheme_id:environment.hall_scheme_id
                },
                /*columns:"FUND_ZONE_ITEM_ID,PRICE,STATUS,STATUS_TEXT,FUND_GROUP_NAME,PRICE_GROUP_NAME,BLOCK_COLOR,COLOR",*/
                field_name:"hall_scheme_id"
            }
        };

        var squareO = {
            command:"get",
            object:"hall_scheme_item",
            sid:sid,
            params:{
                hall_scheme_id:environment.hall_scheme_id
            }
        };
        layerO = {
            command:"get",
            object:"hall_scheme_layer",
            sid:sid,
            event:"get",
            mode:"layers",
            portion:100,
            params:{
                where:"HALL_SCHEME_ID = "+environment.hall_scheme_id+" and VISIBLE_EDITOR='TRUE'",
                columns:"HALL_SCHEME_LAYER_ID",
                order_by:"SORT_NO"
            }
        };
        objectO = {
            command:"get",
            object:"hall_scheme_object",
            sid:sid,
            event:"get",
            mode:"objects",
            portion:100,
            params:{
                where:"HALL_SCHEME_ID = "+environment.hall_scheme_id+" and VISIBLE_EDITOR='TRUE'",
                columns:"HALL_SCHEME_OBJECT_ID,OBJECT_TYPE,OBJECT_TYPE,ROTATION,FONT_FAMILY,FONT_SIZE,FONT_STYLE,FONT_WIEGH,COLOR,X,Y,BACKGROUND_URL_SCALE,BACKGROUND_URL_ORIGINAL,BACKGROUND_COLOR",
                order_by:"SORT_NO"
            }
        };



        mapEditor_map.openSocket(socketObject,function(room){
            environment.room = room;
            socket.on(room+"_add_callback_files",function(obj){
                mapEditor_map.container.trigger('addFile_callback',[obj]);
            });
            socket.on(room+"_add_callbackFull_files",function(obj){
                mapEditor_map.container.trigger('addFile_callbackFull',[obj]);

            });
            socket.on(room+"_remove_callback_files",function(obj){
                mapEditor_map.container.trigger('removeFile_callback',[obj]);
            });
            socket.on(room+"_remove_callbackFull_files",function(obj){
                mapEditor_map.container.trigger('removeFile_callbackFull',[obj]);
            });


            socket.on(room+"_add_callback_layers",function(obj){
                mapEditor_map.container.trigger('addLayer_callback',[obj]);
            });
            socket.on(room+"_add_callbackFull_layers",function(obj){
                mapEditor_map.container.trigger('addLayer_callbackFull',[obj]);

            });
            socket.on(room+"_add_callback_objects",function(obj){
                mapEditor_map.container.trigger('addObject_callback',[obj]);
            });
            socket.on(room+"_add_callbackFull_objects",function(obj){
                mapEditor_map.container.trigger('addObject_callbackFull',[obj]);
            });


            socket.on(room+"_add_callback_squares",function(obj){
                mapEditor_map.container.trigger('addSquare_callback',[obj]);
            });
            socket.on(room+"_add_callbackFull_squares",function(obj){
                mapEditor_map.container.trigger('addSquare_callbackFull',[obj]);

            });
            socket.on(room+"_edit_callback_squares",function(obj){
                mapEditor_map.container.trigger('modifySquare_callback',[obj]);
            });
            socket.on(room+"_edit_callbackFull_squares",function(obj){
                mapEditor_map.container.trigger('modifySquare_callbackFull',[obj]);
            });
            socket.on(room+"_remove_callback_squares",function(obj){
                mapEditor_map.container.trigger('removeSquare_callback',[obj]);
            });
            socket.on(room+"_remove_callbackFull_squares",function(obj){
                mapEditor_map.container.trigger('removeSquare_callbackFull',[obj]);
            });


            socket.on(room+"_add_callback_area_group",function(obj){
                mapEditor_map.container.trigger('addAreaGroup_callback',[obj]);
            });
            socket.on(room+"_add_callbackFull_area_group",function(obj){
                mapEditor_map.container.trigger('addAreaGroup_callbackFull',[obj]);

            });
            socket.on(room+"_edit_callback_area_group",function(obj){
                mapEditor_map.container.trigger('modifyAreaGroup_callback',[obj]);
            });
            socket.on(room+"_edit_callbackFull_area_group",function(obj){
                mapEditor_map.container.trigger('modifyAreaGroup_callbackFull',[obj]);
            });
            socket.on(room+"_remove_callback_area_group",function(obj){
                mapEditor_map.container.trigger('removeAreaGroup_callback',[obj]);
            });
            socket.on(room+"_remove_callbackFull_area_group",function(obj){
                mapEditor_map.container.trigger('removeAreaGroup_callbackFull',[obj]);
            });
            socket.on(room+"_get_callback_area_group",function(obj){
                mapEditor_map.container.trigger('loadAreaGroup_callback',[obj]);
            });
            socket.on(room+"_get_callbackFull_area_group",function(obj){
                mapEditor_map.container.trigger('loadAreaGroup_callbackFull',[obj]);
            });



            socket.on(room+"_edit_callback",function(obj){
            });
            socket.on(room+"_edit_callbackFull",function(obj){
                mapEditor_map.loading = false;
            });
            socket.on(room+"_remove_callback",function(obj){
                mapEditor_map.loading = false;
            });






            /* socket.on(room+"_add_callback_layers",function(obj){
             mapEditor_map.container.trigger("add_layer_callback",[obj]);

             });
             socket.on(room+"_add_callbackFull_layers",function(obj){
             log(obj);
             log('_add_callbackFull_layers');
             });*/
            socket.on(room+"_remove_callback_layers",function(obj){

            });

            socket.on(room+"add_object_callback",function(obj){
                mapEditor_map.container.trigger("add_object_callback",[obj]);
            });

            //add_object_callback



            socket.on(room+"_get_callback_files",function(obj){
                mapEditor_map.container.trigger('getFiles_callback',[obj]);
            });
            socket.on(room+"_get_callbackFull_files",function(obj){
                mapEditor_map.container.trigger('getFiles_callbackFull',[obj]);

            });


            socket.on(room+"_get_callback_layers",function(obj){
                mapEditor_map.container.trigger('getLayer_callback',[obj]);
            });
            socket.on(room+"_get_callbackFull_layers",function(obj){
                mapEditor_map.container.trigger('getLayer_callbackFull',[obj]);

            });
            socket.on(room+"_get_callback_objects",function(obj){
                mapEditor_map.container.trigger('getObject_callback',[obj]);
            });
            socket.on(room+"_get_callbackFull_objects",function(obj){
                mapEditor_map.container.trigger('getObject_callbackFull',[obj]);

            });

        });




        //remove_all_scheme_items
        mapEditor_map.removeAll = function(){
            bootbox.dialog({
                message: "Удалить все места",
                title: "",
                buttons: {
                    ok: {
                        label: "Ок",
                        className: "red",
                        callback:function(){
                            MB.Core.sendQuery({command:"operation",object:"remove_all_scheme_items",sid:sid,params:{hall_scheme_id:environment.hall_scheme_id}},function(data){
                                if (data.RC==0){
                                    mapEditor_map.squares = [];
                                    mapEditor_map.setLayout();
                                    mapEditor_map.render();
                                }else{
                                    bootbox.dialog({
                                        message: data.MESSAGE,
                                        title: "Ошибка",
                                        buttons: {
                                            error: {
                                                label: "Ок",
                                                className: "red"

                                            }
                                        }
                                    });
                                }
                            });
                        }
                    },
                    no:{
                        label:"Отмена",
                        className:"green"
                    }
                }
            });
        };






        /******Работа с местами******/

        mapEditor_map.xSelection=[];
        mapEditor_map.ySelection=[];
        mapEditor_map.minXSelection=0;
        mapEditor_map.minYSelection=0;
        mapEditor_map.maxXSelection=0;
        mapEditor_map.maxYSelection=0;




        /* mapEditor_map.container.on('add_squares',function(e,obj){
         var row_count = obj.row_count;
         var col_count = obj.col_count;
         var x = obj.x || 0;
         var y = obj.y || 0;
         var w = obj.w || 40;
         var h = obj.h || 40;
         var stepCoef = obj.stepCoef || 1.2;

         if (mapEditor_map.newSquares!==undefined)
         delete mapEditor_map.newSquares;
         mapEditor_map.newSquares = [];
         for (var i=0;i<row_count;i++){
         for (var j=0;j<col_count;j++){
         mapEditor_map.addSquare({
         x:x+i*w*stepCoef,
         y:y+j*h*stepCoef,
         line:j+1,
         place:i+1
         });
         }
         }
         mapEditor_map.addSquares(mapEditor_map.newSquares,obj.object_id);
         ///getData({command:"operation",object:"generate_hall_scheme_items",sid:MB.User.sid,params:{x:400,y:400,w:40,h:40,row_count:100, col_count:10,stepCoef_X:1.2,stepCoef_Y:2,hall_scheme_id:237}});

         });*/
        mapEditor_map.editorMode = "squares";
        mapEditor_map.container.on('mousedown_1_',function(e,x,y){
            switch (mapEditor_map.editorMode){
                case "squares":
                    //mapEditor_map.container.trigger("squares_select",[x,y]);
                    var realX = (x - mapEditor_map.XCoeff)/mapEditor_map.scaleCoeff;
                    var realY = (y - mapEditor_map.YCoeff)/mapEditor_map.scaleCoeff;
                    var point = {x: realX, y: realY};
                    mapEditor_map.fillPoint(point,"#f00");
                    $(contentInstance).trigger('addPoint', point);
                    break;
                case "transform_object_prepare":
                    var elem = mapEditor_map.mouseOnSpecialObject(x,y);
                    if (elem){
                        mapEditor_map.transform_object = elem.object;
                        mapEditor_map.editorMode = "transform_object";
                    }
                    break;



            }

            //var obj = editor.getSelectedObjects()[0];
            //mapEditor_map.scaleObject(x,y,obj);
            //mapEditor_map.container.trigger("squares_select",[x,y]);
        });

        mapEditor_map.container.on('mousedown_3_',function(e,x,y){
            switch (mapEditor_map.editorMode){
                case "squares":
                    mapEditor_map.container.trigger("squares_select",[x,y]);
                    break;
                case "transform_object_prepare":

                    break;

            }

            //var obj = editor.getSelectedObjects()[0];
            //mapEditor_map.scaleObject(x,y,obj);
            //mapEditor_map.container.trigger("squares_select",[x,y]);
        });
        mapEditor_map.transform_object = false;
        mapEditor_map.container.on('mousemove_1_',function(e,x,y){
            switch (mapEditor_map.editorMode){
                case "squares":
                    mapEditor_map.container.trigger("squares_select",[x,y]);

                    break;
                case "transform_object":
                    if (typeof mapEditor_map.transform_object!="object") break;
                    mapEditor_map.container.trigger("transform_object",[x,y,mapEditor_map.transform_object]);
                    break;
                case "rotate_object":
                    mapEditor_map.container.trigger("rotate_object",[x,y]);
                    break;
                case "transform_object_prepare":
                    var elem = mapEditor_map.mouseOnSpecialObject(x,y);
                    if (elem){
                        mapEditor_map.transform_object = elem.object;
                        mapEditor_map.editorMode = "transform_object";
                        break;
                    }
                    elem = mapEditor_map.mouseOnObject(x,y);
                    if (elem){
                        mapEditor_map.container.trigger("move_object",[x,y,[elem]]);
                        break;
                    }
                    mapEditor_map.transform_object = editor.getSelectedObjects()[0];
                    mapEditor_map.editorMode = "rotate_object";
                    break;
                default:
                    mapEditor_map.container.trigger("squares_select",[x,y]);

                    break;


            }
        });
        mapEditor_map.container.on('mousemove_3_',function(e,x,y){
            mapEditor_map.container.trigger("squares_deselect",[x,y]);
        });

        mapEditor_map.container.on('mousemove_1_17',function(e,x,y){

            switch (mapEditor_map.editorMode){
                case "squares":
                    mapEditor_map.container.trigger("move_squares",[x,y,mapEditor_map.selection]);
                    break;
                case "transform_object":
                    mapEditor_map.container.trigger("move_object",[x,y]);
                    break;
                case "transform_object_prepare":
                    mapEditor_map.container.trigger("move_object",[x,y]);

                    break;
                default:
                    mapEditor_map.container.trigger("move_squares",[x,y,mapEditor_map.selection]);
                    mapEditor_map.container.trigger("move_object",[x,y]);
                    break;
            }




        });
        mapEditor_map.container.on('mousemove_1_32',function(e,x,y){
            mapEditor_map.container.trigger("move_map",[x,y]);
        });
        mapEditor_map.container.on('mousedown_1_17',function(e,x,y){
            mapEditor_map.container.trigger("move_squares",[x,y,mapEditor_map.selection]);
            mapEditor_map.container.trigger("move_object",[x,y]);
        });

        mapEditor_map.container.on('mouseup_1_',function(e,x,y){
            switch (mapEditor_map.editorMode){
                case "squares":
                    break;
                case "transform_object":

                    mapEditor_map.container.trigger("transform_object_end",[mapEditor_map.transform_object]);
                    mapEditor_map.transform_object = false;
                    mapEditor_map.editorMode = "transform_object_prepare";
                    break;
                case "rotate_object":
                    mapEditor_map.container.trigger("transform_object_end",[mapEditor_map.transform_object]);
                    var abscissa = mapEditor_map.specialObjects.getByName("abscissa"+mapEditor_map.transform_object.object_id);
                    var arc1 = mapEditor_map.specialObjects.getByName("arc"+mapEditor_map.transform_object.object_id);
                    arc1.visible = false;
                    abscissa.visible = false;
                    mapEditor_map.editorMode = "transform_object_prepare";
                    break;



            }
        });
        mapEditor_map.container.on('mouseup_1_17',function(e,x,y){
            mapEditor_map.container.trigger("move_squares_end");
            mapEditor_map.container.trigger("move_object_end");
        });
        mapEditor_map.container.on('mouseup_3_16',function(e,x,y){
            mapEditor_map.container.trigger("select_stop",[x, y, "remove", function(){}]);
        });
        mapEditor_map.container.on('keyup_1_17',function(e){
            mapEditor_map.container.trigger("move_squares_end");
            mapEditor_map.container.trigger("move_object_end");
        });

        $(document).on('keyup',function(e){
            if (e.which>=37 && e.which<=40){
                return;
            }
            if (mapEditor_map.container.squareMoving){
                mapEditor_map.container.trigger("move_squares_end");
                mapEditor_map.container.trigger("move_object_end");
                delete mapEditor_map.container.squareMoving;
                mapEditor_map.container.attr("tabindex","1").focus();
            }
        });
        $("body").keydown(function(e){
            switch (e.which){
                case 39:
                    switch (mapEditor_map.shiftState){
                        case 16:
                            mapEditor_map.xScale(5);
                            mapEditor_map.container.squareMoving = true;
                            break;
                        case 17:
                            mapEditor_map.container.trigger("move_squares",[mapEditor_map.downX+5*mapEditor_map.scaleCoeff,mapEditor_map.downY,mapEditor_map.selection]);
                            mapEditor_map.container.trigger("move_object",[mapEditor_map.downX+5*mapEditor_map.scaleCoeff,mapEditor_map.downY]);
                            mapEditor_map.container.squareMoving = true;
                            break;
                    }
                    break;
                case 37:
                    switch (mapEditor_map.shiftState){
                        case 16:
                            mapEditor_map.xScale(-5);
                            mapEditor_map.container.squareMoving = true;
                            break;
                        case 17:
                            mapEditor_map.container.trigger("move_squares",[mapEditor_map.downX-5*mapEditor_map.scaleCoeff,mapEditor_map.downY,mapEditor_map.selection]);
                            mapEditor_map.container.trigger("move_object",[mapEditor_map.downX-5*mapEditor_map.scaleCoeff,mapEditor_map.downY]);
                            mapEditor_map.container.squareMoving = true;
                            break;
                    }
                    break;
                case 38:
                    switch (mapEditor_map.shiftState){
                        case 16:
                            mapEditor_map.yScale(-5);
                            mapEditor_map.container.squareMoving = true;
                            break;
                        case 17:
                            mapEditor_map.container.trigger("move_squares",[mapEditor_map.downX,mapEditor_map.downY-5*mapEditor_map.scaleCoeff,mapEditor_map.selection]);
                            mapEditor_map.container.trigger("move_object",[mapEditor_map.downX,mapEditor_map.downY-5*mapEditor_map.scaleCoeff]);
                            mapEditor_map.container.squareMoving = true;
                            break;
                    }
                    break;
                case 40:
                    switch (mapEditor_map.shiftState){
                        case 16:
                            mapEditor_map.yScale(5);
                            mapEditor_map.container.squareMoving = true;
                            break;
                        case 17:
                            mapEditor_map.container.trigger("move_squares",[mapEditor_map.downX,mapEditor_map.downY+5*mapEditor_map.scaleCoeff,mapEditor_map.selection]);
                            mapEditor_map.container.trigger("move_object",[mapEditor_map.downX,mapEditor_map.downY+5*mapEditor_map.scaleCoeff]);
                            mapEditor_map.container.squareMoving = true;
                            break;
                    }
                    break;
            }

        });


        //renderZones
        $(contentInstance).on('renderZones',function(){
            var zones = editor.zones.items;
            var ctx = mapEditor_map.ctx;
            ctx.fillStyle = "#00f";

            for (var i in  zones) {
                var zone = zones[i];
                for (var j in zone.items) {
                    var figure = zone.items[j];
                    ctx.beginPath();
                    var first = true;
                    for (var n in figure.items) {
                        var point = figure.items[n];
                        if (first){
                            first = false;
                            ctx.moveTo(point.x * mapEditor_map.scaleCoeff + mapEditor_map.XCoeff, point.y * mapEditor_map.scaleCoeff + mapEditor_map.YCoeff);
                        }
                        ctx.lineTo(point.x * mapEditor_map.scaleCoeff + mapEditor_map.XCoeff, point.y * mapEditor_map.scaleCoeff + mapEditor_map.YCoeff);
                    }
                    ctx.closePath();
                    ctx.fill();
                }
            }
        });



        mapEditor_map.container.on('move_squares',function(e,x,y,squares){
            mapEditor_map.moveSquares(x,y,squares,function(){
                mapEditor_map.moving = true;
                mapEditor_map.render();
            });
        });

        mapEditor_map.container.on('move_squares_end',function(e){
            var obj = [];
            for (var i in mapEditor_map.selection){
                obj.push({
                    hall_scheme_item_id: mapEditor_map.squares[mapEditor_map.selection[i]].id,
                    x:mapEditor_map.squares[mapEditor_map.selection[i]].x,
                    y:mapEditor_map.squares[mapEditor_map.selection[i]].y
                });
            }
            mapEditor_map.moving = false;
            mapEditor_map.render();
            mapEditor_map.reLoadLayout(function(){
                mapEditor_map.container.trigger('modifySquare',[obj]);
            });
        });

        mapEditor_map.container.on('move_object',function(e,x,y,objects){
            var objs = objects || editor.getSelectedObjects();
            mapEditor_map.moveObjects(x,y,objs,function(){
                mapEditor_map.render();
            });
        });

        mapEditor_map.container.on('move_object_end',function(e,objects){
            var objs = objects || editor.getSelectedObjects();
            var toModify = [];
            for (var k in objs){
                toModify.push({
                    hall_scheme_object_id:objs[k].object_id,
                    X:objs[k].x,
                    Y:objs[k].y

                });
            }
            mapEditor_map.container.trigger("modifyObject",[toModify]);
        });


        mapEditor_map.container.on('transform_object_start',function(e,object){
            if (typeof object!=="object") return;
            switch (object.type){
                case 4:
                    /*var x = object.x;
                     var y = object.y;*/
                    mapEditor_map.specialObjects.addItem({
                        type:"point",
                        x1:0,
                        y1:0,
                        color1:"#417cd3",
                        active:true,
                        object:object
                    });
                    break;
                default:
                    if (typeof object.value!="object") return;
                    var x = object.x;
                    var y = object.y;
                    mapEditor_map.specialObjects.addItem({
                        type:"line",
                        x1:0,
                        y1:-16,
                        x2:+object.value.width,
                        y2:-16,
                        color1:"#00f",
                        object:object
                    });
                    mapEditor_map.specialObjects.addItem({
                        type:"line",
                        x1:+object.value.width+16,
                        y1:0,
                        x2:+object.value.width+16,
                        y2:+object.value.height,
                        color1:"#00f",
                        object:object
                    });
                    mapEditor_map.specialObjects.addItem({
                        type:"line",
                        x1:+object.value.width,
                        y1:+object.value.height+16,
                        x2:0,
                        y2:+object.value.height+16,
                        color0:"#00f",
                        object:object
                    });
                    mapEditor_map.specialObjects.addItem({
                        type:"line",
                        x1:-16,
                        y1:+object.value.height,
                        x2:-16,
                        y2:0,
                        color1:"#00f",
                        object:object
                    });


                    mapEditor_map.specialObjects.addItem({
                        type:"point",
                        x1:-16,
                        y1:-16,
                        object:object
                    });
                    mapEditor_map.specialObjects.addItem({
                        type:"point",
                        x1:+object.value.width+16,
                        y1:-16,
                        object:object
                    });
                    mapEditor_map.specialObjects.addItem({
                        type:"point",
                        x1:+object.value.width+16,
                        y1:+object.value.height+16,
                        color1:"#417cd3",
                        active:true,
                        object:object
                    });
                    mapEditor_map.specialObjects.addItem({
                        type:"point",
                        x1:-16,
                        y1:+object.value.height+16,
                        object:object

                    });
                    mapEditor_map.specialObjects.addItem({
                        type:"point",
                        name:"center_point"+object.object_id,
                        x1:+object.value.width/2,
                        y1:+object.value.height/2,
                        object:object,
                        pointLineWidth:2,
                        w:6,
                        h:6
                    });

                    //// for rotation

                    mapEditor_map.specialObjects.addItem({
                        type:"point",
                        name:"rotation_move_point"+object.object_id,
                        x1:+object.value.width/2,
                        y1:+object.value.height/2,
                        object:object,
                        pointLineWidth:2,
                        w:6,
                        h:6,
                        visible:false
                    });
                    mapEditor_map.specialObjects.addItem({
                        type:"line",
                        name:"rotation_vector"+object.object_id,
                        x1:+object.value.width/2,
                        y1:+object.value.height/2,
                        x2:+object.value.width+10,
                        y2:+object.value.height/2,
                        object:object,
                        pointLineWidth:2,
                        w:6,
                        h:6,
                        visible:false,
                        color1:"#000"
                    });
                    mapEditor_map.specialObjects.addItem({
                        type:"line",
                        name:"abscissa"+object.object_id,
                        x1:+object.value.width/2,
                        y1:+object.value.height/2,
                        x2:+object.value.width+300,
                        y2:+object.value.height/2,
                        object:object,
                        pointLineWidth:2,
                        w:6,
                        h:6,
                        visible:false,
                        color1:"#000"
                    });
                    mapEditor_map.specialObjects.addItem({
                        type:"arc",
                        name:"arc"+object.object_id,
                        x1:+object.value.width/2,
                        y1:+object.value.height/2,
                        r:250,
                        angle1:0,
                        angle2:0,
                        object:object,
                        pointLineWidth:2,
                        w:6,
                        h:6,
                        visible:false,
                        color1:"#F00"
                    });

                    break;
            }




            mapEditor_map.render();
            mapEditor_map.editorMode = "transform_object_prepare";
        });
        mapEditor_map.container.on('transform_object',function(e,x,y,object){
            mapEditor_map.scaleObject(x,y,object);
        });

        mapEditor_map.container.on('transform_object_end',function(e,object){
            mapEditor_map.moving = false;
            mapEditor_map.render();
            mapEditor_map.container.trigger("modifyObject",[[{
                hall_scheme_object_id:object.object_id,
                SCALE:object.scaleCoeff,
                ROTATION:object.rotation
            }]]);
        });

        mapEditor_map.container.on('rotate_object',function(e,x,y,object){
            var obj = object || editor.getSelectedObjects()[0];
            mapEditor_map.rotateObject(x,y,obj);
        });

        mapEditor_map.scaleObject = function(x,y,object,callback){
            if (typeof object!=="object") return;
            if (object.type!=1 && object.type!=2 || typeof object.value!="object") return;
            var w = object.value.width;
            var h = object.value.height;
            var c = Math.sqrt(w*w+h*h);
            var W = ((x-mapEditor_map.XCoeff)/mapEditor_map.scaleCoeff)-object.x;
            var H = ((y-mapEditor_map.YCoeff)/mapEditor_map.scaleCoeff)-object.y;
            var delta = Math.sqrt(W*W+H*H);
            object.scaleCoeff = delta/c;

            mapEditor_map.moving = true;
            mapEditor_map.render();
            if (typeof callback=="function"){
                callback();
            }

        };

        mapEditor_map.rotateObject = function(x,y,object,callback){
            if (typeof object!=="object") return;
            mapEditor_map.moving = true;
            switch (object.type){
                case 1:
                    if (typeof object.value!="object") return;
                    var centerX = +object.x +object.value.width*(+object.scaleCoeff)/2;
                    var centerY = +object.y +object.value.height*(+object.scaleCoeff)/2;
                    var a = (y-mapEditor_map.YCoeff)/mapEditor_map.scaleCoeff - centerY;
                    var b = (x-mapEditor_map.XCoeff)/mapEditor_map.scaleCoeff - centerX;
                    var c = Math.sqrt(a*a+b*b);
                    var angle = Math.asin(a/c);
                    var quarter = 1;
                    object.rotation = angle;
                    if ((x-mapEditor_map.XCoeff)/mapEditor_map.scaleCoeff <= centerX && (y-mapEditor_map.YCoeff)/mapEditor_map.scaleCoeff <= centerY){
                        quarter = 2;
                        object.rotation = -angle-Math.PI;
                    }
                    else if ((x-mapEditor_map.XCoeff)/mapEditor_map.scaleCoeff <= centerX && (y-mapEditor_map.YCoeff)/mapEditor_map.scaleCoeff > centerY){
                        quarter = 3;
                        object.rotation = -angle+Math.PI;
                    }

                    var abscissa = mapEditor_map.specialObjects.getByName("abscissa"+object.object_id);
                    var arc1 = mapEditor_map.specialObjects.getByName("arc"+object.object_id);
                    arc1.visible = true;
                    abscissa.visible = true;
                    arc1.angle2 = object.rotation;
                    //object.rotation = angle+(90*quarter-1)*Math.PI/180;
                    mapEditor_map.render();


                    break;
                case 2:
                    if (typeof object.value!="object") return;
                    var centerX = +object.x +object.value.width*(+object.scaleCoeff)/2;
                    var centerY = +object.y +object.value.height*(+object.scaleCoeff)/2;
                    var a = (y-mapEditor_map.YCoeff)/mapEditor_map.scaleCoeff - centerY;
                    var b = (x-mapEditor_map.XCoeff)/mapEditor_map.scaleCoeff - centerX;
                    var c = Math.sqrt(a*a+b*b);
                    var angle = Math.asin(a/c);
                    var quarter = 1;
                    object.rotation = angle;
                    if ((x-mapEditor_map.XCoeff)/mapEditor_map.scaleCoeff <= centerX && (y-mapEditor_map.YCoeff)/mapEditor_map.scaleCoeff <= centerY){
                        quarter = 2;
                        object.rotation = -angle-Math.PI;
                    }
                    else if ((x-mapEditor_map.XCoeff)/mapEditor_map.scaleCoeff <= centerX && (y-mapEditor_map.YCoeff)/mapEditor_map.scaleCoeff > centerY){
                        quarter = 3;
                        object.rotation = -angle+Math.PI;
                    }

                    var abscissa = mapEditor_map.specialObjects.getByName("abscissa"+object.object_id);
                    var arc1 = mapEditor_map.specialObjects.getByName("arc"+object.object_id);
                    arc1.visible = true;
                    abscissa.visible = true;
                    arc1.angle2 = object.rotation;
                    //object.rotation = angle+(90*quarter-1)*Math.PI/180;
                    mapEditor_map.render();
                    break;
                case 4:
                    //if (typeof object.value!="object") return;
                    var centerX = +object.x;
                    var centerY = +object.y;
                    var a = (y-mapEditor_map.YCoeff)/mapEditor_map.scaleCoeff - centerY;
                    var b = (x-mapEditor_map.XCoeff)/mapEditor_map.scaleCoeff - centerX;
                    var c = Math.sqrt(a*a+b*b);
                    var angle = Math.asin(a/c);
                    var quarter = 1;
                    object.rotation = angle;
                    if ((x-mapEditor_map.XCoeff)/mapEditor_map.scaleCoeff <= centerX && (y-mapEditor_map.YCoeff)/mapEditor_map.scaleCoeff <= centerY){
                        quarter = 2;
                        object.rotation = -angle-Math.PI;
                    }
                    else if ((x-mapEditor_map.XCoeff)/mapEditor_map.scaleCoeff <= centerX && (y-mapEditor_map.YCoeff)/mapEditor_map.scaleCoeff > centerY){
                        quarter = 3;
                        object.rotation = -angle+Math.PI;
                    }

                    /*var abscissa = mapEditor_map.specialObjects.getByName("abscissa"+object.object_id);
                     var arc1 = mapEditor_map.specialObjects.getByName("arc"+object.object_id);
                     arc1.visible = true;
                     abscissa.visible = true;
                     arc1.angle2 = object.rotation;*/
                    //object.rotation = angle+(90*quarter-1)*Math.PI/180;
                    mapEditor_map.render();
                    return;


                    break;
            };

            //
            mapEditor_map.render();
            if (typeof callback=="function"){
                callback();
            }
        };


        mapEditor_map.moveObjects = function(x,y,objects,callback){
            var dX = (x-mapEditor_map.downX_obj)/mapEditor_map.scaleCoeff;
            var dY = (y-mapEditor_map.downY_obj)/mapEditor_map.scaleCoeff;
            for (var k in objects){
                var obj = objects[k];
                if (!obj.visibility.visible_editor) continue;
                var Xnew = +obj.x + dX;
                var Ynew = +obj.y + dY;
                obj.x = +Xnew;
                obj.y = +Ynew;
            }
            mapEditor_map.downX_obj = x;
            mapEditor_map.downY_obj = y;
            if (typeof callback=="function"){
                callback();
            }

        };




        mapEditor_map.moveSquares = function(x,y,group,callback){
            var dX = (x-mapEditor_map.downX)/mapEditor_map.scaleCoeff;
            var dY = (y-mapEditor_map.downY)/mapEditor_map.scaleCoeff;
            for (var k in group){
                var sq = mapEditor_map.squares[group[k]];
                var Xnew = mapEditor_map.squares[group[k]].x + dX;
                var Ynew = mapEditor_map.squares[group[k]].y + dY;
                mapEditor_map.squares[group[k]].x = Xnew;
                mapEditor_map.squares[group[k]].y = Ynew;
                /*if (mapEditor_map.squares[group[k]].status==1)
                 mapEditor_map.squares[group[k]].status = 2;*/
            }
            mapEditor_map.downX = x;
            mapEditor_map.downY = y;
            if (typeof callback=="function"){
                callback();
            }

        };


        mapEditor_map.splitSelection = function(){
            this.xSelection=[];
            this.ySelection=[];
            var sel =[];
            for (var s0 in mapEditor_map.selection){
                sel.push(mapEditor_map.selection[s0]);
            }
            var get_sel_length = function(){
                var count = 0;
                for (var k in sel){
                    count++;
                }
                return count;

            };
            var get_sel_first = function(){
                var min = sel.length;
                for (var k in sel){
                    if (+k < min) min = k;
                }
                return min;
            };

            var xCount = 0;

            this.minXSelection = mapEditor_map.squares[sel[get_sel_first()]].x;
            this.minYSelection = mapEditor_map.squares[sel[get_sel_first()]].y;
            while (get_sel_length()!=0){
                this.xSelection[xCount] = [];
                var get_first = get_sel_first();
                var firstY = mapEditor_map.squares[sel[get_first]].y;
                this.xSelection[xCount].push(sel[get_first]);



                delete sel[get_first];
                for (var k in sel){
                    /// вычисление границ выделения
                    if (mapEditor_map.squares[sel[k]].x<this.minXSelection) this.minXSelection = mapEditor_map.squares[sel[k]].x;
                    if (mapEditor_map.squares[sel[k]].x>this.maxXSelection) this.maxXSelection = mapEditor_map.squares[sel[k]].x;
                    if (mapEditor_map.squares[sel[k]].y<this.minYSelection) this.minYSelection = mapEditor_map.squares[sel[k]].y;
                    if (mapEditor_map.squares[sel[k]].y>this.maxYSelection) this.maxYSelection = mapEditor_map.squares[sel[k]].y;
                    /// конец вычисление границ выделения
                    if (k==0) continue;

                    if (mapEditor_map.squares[sel[k]].y>firstY-mapEditor_map.squareWH/2 && mapEditor_map.squares[sel[k]].y<firstY+mapEditor_map.squareWH/2){
                        this.xSelection[xCount].push(sel[k]);
                        delete sel[k];
                    }
                }
                this.xSelection[xCount] = this.xSelection[xCount].sort(function(a,b){
                    return mapEditor_map.squares[a].x - mapEditor_map.squares[b].x;
                });
                xCount++;
            }


            for (var s0 in mapEditor_map.selection){
                sel.push(mapEditor_map.selection[s0]);
            }

            var yCount = 0;
            while (get_sel_length()!=0){
                this.ySelection[yCount] = [];
                get_first = get_sel_first();
                var firstX = mapEditor_map.squares[sel[get_first]].x;
                this.ySelection[yCount].push(sel[get_first]);
                delete sel[get_first];
                for (var k in sel){
                    if (k==0) continue;
                    if (mapEditor_map.squares[sel[k]].x>firstX-mapEditor_map.squareWH/2 && mapEditor_map.squares[sel[k]].x<firstX+mapEditor_map.squareWH/2){
                        this.ySelection[yCount].push(sel[k]);
                        delete sel[k];
                    }
                }
                this.ySelection[yCount] = this.ySelection[yCount].sort(function(a,b){
                    return mapEditor_map.squares[a].y - mapEditor_map.squares[b].y;
                });
                yCount++;
            }
            this.xSelection.sort(function(a,b){
                if (mapEditor_map.squares[a[0]].y<mapEditor_map.squares[b[0]].y) return -1;
                else if (mapEditor_map.squares[a[0]].y>mapEditor_map.squares[b[0]].y) return 1;
                return 0;
            });




            //log("minX= "+this.minXSelection+"; minY= "+this.minYSelection+"; maxX= "+this.maxXSelection+"; maxY= "+this.maxYSelection);



        };


        //mapEditor_map.container.trigger('fillNumbers',[obj]);
        mapEditor_map.container.on('fillNumbers',function(e,obj){
            mapEditor_map.fillNumbers(obj);

        });


        mapEditor_map.fillNumbers = function(params){
            if (typeof params===undefined) return;
            var xReverse = +params.xReverse || 0;
            var yReverse = +params.yReverse || 0;
            var line_start = (!isNaN(+params.line_start))?+params.line_start:1;
            var place_start = (!isNaN(+params.place_start))?+params.place_start:1;
            /* var line_start = +params.line_start || 1;
             var place_start = +params.place_start || 1;*/
            var line_fix = params.line_fix || undefined;
            var place_fix = params.place_fix || undefined;
            var invert_line_place = +params.invert_line_place || 0;
            if (mapEditor_map.countSelection()==0){
                bootbox.dialog({
                    message: "Не выбрано ни одного места",
                    title: "",
                    buttons: {
                        error: {
                            label: "Ок",
                            className: "blue"
                        }
                    }
                });
                return;
            }
            this.splitSelection();

            var obj = mapEditor_map.xSelection;
            if (invert_line_place)
                obj = mapEditor_map.ySelection;
            if (line_fix){
                obj = [];
                obj[+line_fix-1] = mapEditor_map.selection.sort(function(a,b){
                    if (mapEditor_map.squares[a].x<mapEditor_map.squares[b].x) return -1;
                    if (mapEditor_map.squares[a].x>mapEditor_map.squares[b].x) return 1;
                    return 0;
                });
            }

            if (yReverse) obj.reverse();
            //var line = (+$("#one_row").val()>0) ? $("#one_row").val() : 1;
            /*var line = line_start;
             var place = place_start;*/
            var sq = [];
            var line = (line_fix)? +line_fix : line_start;
            var place = (place_fix)? +place_fix : place_start;
            for (var r in obj){
                if (place_fix){
                    obj[r] = mapEditor_map.selection.sort(function(a,b){
                        if (mapEditor_map.squares[a].y<mapEditor_map.squares[b].y) return -1;
                        if (mapEditor_map.squares[a].y>mapEditor_map.squares[b].y) return 1;
                        return 0;
                    });
                }

                line = (line_fix)? +line_fix : line;
                place = (place_fix)? +place_fix : place_start;
                if (xReverse) obj[r].reverse();
                for (var p in obj[r]){
                    line = (line_fix)? line_fix : line;
                    place = (place_fix)? place_fix : place;
                    mapEditor_map.squares[obj[r][p]].line = line;
                    mapEditor_map.squares[obj[r][p]].place = String(place);
                    sq.push({
                        hall_scheme_item_id:mapEditor_map.squares[obj[r][p]].id,
                        line_title:params.line_title,
                        place_title:params.place_title,
                        line:line,
                        place:String(place)
                    });

                    place++;
                }
                line++;
            }
            mapEditor_map.render();
            mapEditor_map.container.trigger('modifySquare',[sq]);
        };


        mapEditor_map.container.on('xScale',function(e,dx){
            mapEditor_map.xScale(dx);

        });
        mapEditor_map.container.on('yScale',function(e,dy){
            mapEditor_map.yScale(dy);

        });


        mapEditor_map.xScale = function(dX){
            if (mapEditor_map.selection.length==0) return;
            mapEditor_map.moving = true;
            var sq = [];
            //var minX = mapEditor_map.squares[mapEditor_map.selection[0]].x;
            var minX = 1000000;
            for (var k in mapEditor_map.selection){
                if (mapEditor_map.squares[mapEditor_map.selection[k]].x<minX) minX = mapEditor_map.squares[mapEditor_map.selection[k]].x;
            }
            var maxX = -10000;
            for (var k in mapEditor_map.selection){
                if (mapEditor_map.squares[mapEditor_map.selection[k]].x>maxX) maxX = mapEditor_map.squares[mapEditor_map.selection[k]].x;
            }
            if (minX==maxX) return;
            var scaleCoeff = (maxX - minX+dX)/(maxX - minX);
            for (var k0 in mapEditor_map.selection){
                var delta = (mapEditor_map.squares[mapEditor_map.selection[k0]].x - minX)*scaleCoeff;
                mapEditor_map.squares[mapEditor_map.selection[k0]].x = minX +delta;
                /*sq.push({
                 hall_scheme_item_id:mapEditor_map.selection[k0],
                 x:minX +delta
                 });*/
            }

            mapEditor_map.render();
        };
        mapEditor_map.yScale = function(dY){
            if (mapEditor_map.selection.length==0) return;
            mapEditor_map.moving = true;
            var sq = [];
            //var minY = mapEditor_map.squares[mapEditor_map.selection[0]].y;
            var minY = 1000000;
            for (var k in mapEditor_map.selection){
                if (mapEditor_map.squares[mapEditor_map.selection[k]].y<minY) minY = mapEditor_map.squares[mapEditor_map.selection[k]].y;
            }
            var maxY = -10000;
            if (minY==maxY) return;
            for (var k in mapEditor_map.selection){
                if (mapEditor_map.squares[mapEditor_map.selection[k]].y>maxY) maxY = mapEditor_map.squares[mapEditor_map.selection[k]].y;
            }
            var scaleCoeff = (maxY - minY+dY)/(maxY - minY);
            for (var k0 in mapEditor_map.selection){
                var delta = (mapEditor_map.squares[mapEditor_map.selection[k0]].y - minY)*scaleCoeff;
                mapEditor_map.squares[mapEditor_map.selection[k0]].y = minY +delta;
                /*sq.push({
                 hall_scheme_item_id:mapEditor_map.selection[k0],
                 y:minY +delta
                 });*/
            }
            mapEditor_map.render();
        };

        /******Конец Работа с местами******/

        mapEditor_map.container.on("squaresLoaded",function(e,squares){
            console.log('squaresLoaded func return/ Надо напихать в объекты типа Place_GROUP места');
            return;
            for (var k in squares){
                var layer = MB.ME.Layers.getItem(squares[k].object_id)
                if (layer)
                    layer.addIds([k]);
                /*var object = editor.findObject(squares[k].object_id);
                if (object)
                    object.addIds([k]);*/
            }
        });


        mapEditor_map.container.trigger('loadFiles');
        var renderObjects = [];
        mapEditor_map.container.trigger('loadLayer',[{},function(result){
            var data = JSON.parse(result);
            if (data['results'][0].code && +data['results'][0].code!==0){
                return;
            }
            var obj = jsonToObj(data['results'][0]);
            var counter1 = 0;
            var counter2 = 0;

            // Добавляем пустой слой для групп мест
            var c1 = 0;
            for (var i in obj){
                c1++;
            }
            obj[c1]={
                HALL_SCHEME_LAYER_ID:"isNULL"
            };



            for (var l in obj){
                counter1++;
                var layer = obj[l];
                var layerId = layer.HALL_SCHEME_LAYER_ID;
                if (layerId!="isNULL"){
                    var layerGroupInstance = new MB.ME.LayerGroup({
                        id:layerId,
                        visibility:{
                            visible_editor:layer.visible_editor,
                            visible_admin:layer.visible_admin,
                            visible_casher:layer.visible_casher,
                            visible_iframe:layer.visible_iframe,
                            visible_client_screen:layer.visible_client_screen
                        },
                        sort_no:layer.sort_no,
                        editorId:contentID
                    });
                    MB.ME.LayerGroups.addItem(layerGroupInstance);

                }

                mapEditor_map.container.trigger('loadObject',[{layer_id: layerId},function(result2){
                    counter2++;
                    var data = JSON.parse(result2);
                    if (data['results'][0].code && +data['results'][0].code!==0){
                        console.log('Ошибка: '+result2);
                        return;
                    }

                    var obj = jsonToObj(data['results'][0]);
                    for (var i in obj){
                        var oneObject = obj[i];
                        var layer_id =  (oneObject.HALL_SCHEME_LAYER_ID!='')?oneObject.HALL_SCHEME_LAYER_ID:'placeLayer';


                        if (oneObject.OBJECT_TYPE=="") continue;
                        var o = {
                            id : oneObject.HALL_SCHEME_OBJECT_ID || undefined,
                            selected : oneObject.selected || false,
                            /*object_old_id : oneObject.object_id || undefined,*/
                            type : oneObject.OBJECT_TYPE,
                            value : oneObject.VALUE || "",
                            color : oneObject.COLOR || "#000",
                            title : oneObject.NAME || "-",
                            image : oneObject.BACKGROUND_URL_SCALE || oneObject.BACKGROUND_URL_ORIGINAL || undefined,
                            scaleCoeff : +oneObject.SCALE || 1,
                            rotation : +oneObject.ROTATION || 0,
                            visibility:{
                                visible_editor: (oneObject.VISIBLE_EDITOR=="TRUE"),
                                visible_admin:  (oneObject.VISIBLE_ADMIN=="TRUE"),
                                visible_casher:  (oneObject.VISIBLE_CASHER=="TRUE"),
                                visible_iframe:  (oneObject.VISIBLE_IFRAME=="TRUE"),
                                visible_client_screen: (oneObject. VISIBLE_CLIENT_SCREEN=="TRUE")
                            },
                            x:oneObject.X,
                            y:oneObject.Y,
                            fontFamily:oneObject.FONT_FAMILY,
                            fontSize:oneObject.FONT_SIZE,
                            fontStyle:oneObject.FONT_STYLE,
                            fontWeight:oneObject.FONT_WIEGHT
                        };
                        

                        if (oneObject.OBJECT_TYPE!='PLACE_GROUP'){
                            var layerInstance = new MB.ME.Layer(o);
                            MB.ME.Layers.addItem(layerInstance);
                            var layer = MB.ME.LayerGroups.getItem(layer_id);
                            layer.layers.push(oneObject.HALL_SCHEME_OBJECT_ID);
                            renderObjects.push(layerInstance);
                        }
                    }
                    /// Обеспечивает загрузку всех layer и object
                    if (counter1==counter2){

                       /* $(contentWrapper).trigger('layerUpdate');*/
                        $(contentInstance).trigger('layerUpdate');
                        mapEditor_map.loadSquares(squareO,function(){
                            mapEditor_map.fillRenderList(renderObjects,function(){
                                mapEditor_map.render();
                            });
                            mapEditor_map.setLayout(function(){
                                mapEditor_map.setMinMax(function(){
                                    mapEditor_map.setScaleCoff(function(){
                                        //$("#modalWindows").css("zIndex");
                                        //console.log('zIndex', $("#modalWindows").css("zIndex"));
                                        mapEditor_map.render(function(){
                                            mapEditor_map.reLoadLayout(function(){});
                                            /*environment.stick = 'top';
                                            environment.stickModal();*/
                                        });

                                        mapEditor_map.setEvents();
                                    });

                                });
                            });

                        });
                    }
                }]);


            }

        }]);
        /* mapEditor_map.container.trigger('loadObject',[{type:"PLACE_GROUP"},function(result){
         var data = JSON.parse(result);
         if (data['results'][0].code && +data['results'][0].code!==0){
         console.log('Ошибка: '+result);
         return;
         }
         var obj = jsonToObj(data['results'][0]);
         var layer = editor.findLayer('placeLayer');
         for (var i in obj){
         var params = obj[i];
         var o = {
         object_id : params.HALL_SCHEME_OBJECT_ID || undefined,
         selected : params.selected || false,
         object_old_id : params.object_id || undefined,
         type : 0,
         object_title : params.NAME || "Места",
         image : params.image || undefined,
         isOpened : params.isOpened || false,
         isVisible : params.isVisible|| true,
         isVisibleCheckbox : params.isVisibleCheckbox|| true,
         isObjectSettingsOpened : params.isObjectSettingsOpened|| false
         };
         var instance = new PlacesGroupType(o);
         layer.addObject(instance);

         }
         $(document).trigger('layerUpdate');

         }]);*/

        /* mapEditor_map.loadRenderItems({
         layerO:layerO,
         objectO:objectO
         });*/
        mapEditor_map.container.trigger('loadAreaGroup');

        //loadFundGroups();

        environment.onFocus = function(){

            mapEditor_map.render();
        };
        environment.onClose = function(){
            //log("mapEditor_map onClose");
            mapEditor_map.closeSocket();
        };




        var wrap = $("#"+environment.world+"_"+environment.id+"_wrapper");
        wrap.find("*").each(function(){
            preventSelection($(this)[0]);
        });
        mapEditor_map.sendSelection = function(){

            /*

             var obj = {
             event:"save_and_update",

             save_params:{
             params:{
             fund_group_id:fund_group_id
             },
             list:mapEditor_map.selection,
             portion:200
             },
             load_params:{
             list:mapEditor_map.selection,
             portion:40,
             params:{
             fund_zone_id:environment.fund_zone_id
             }
             }

             };
             */

            // mapEditor_map.toSocket(obj);
            mapEditor_map.clearSelection();

        };
        mapEditor_map.sendSelectionCallback = function(){
            //loadFundGroups();
        };
        mapEditor_map.sendSelectionCallbackFull = function(){
            //loadFundGroups();
        };


        $("#removeAll").on("click",function(){
            mapEditor_map.removeAll();
        });


        $("#Btn0").on("click",function(){
            mapEditor_map.container.trigger('add_squares',[5,10]);

        });
        $("#Btn1").on("click",function(){
            mapEditor_map.container.trigger('loadObjects');

        });
        $("#Btn2").on("click",function(){
            mapEditor_map.container.trigger('loadAreaGroup');
            //mapEditor_map.fillNumbers(o);

        });






























        /* mapEditor_map = new MapEditor({
         box:"box_for_mapEditor",
         name:"mapEditor",
         cWidth:environment.getWidth(),
         cHeight:environment.getHeight()
         *//*environment:environment*//*
         });
         mapEditor_map.objversion = environment.objversion;
         mapEditor_map.load({
         object:"hall_scheme_item",
         *//*params:{where : "HALL_SCHEME_ID = "+environment.hall_scheme_id},*//*
         params:{
         hall_scheme_id:environment.hall_scheme_id,
         background_image:environment.background_image,
         background_x:environment.background_x,
         background_y:environment.background_y,
         background_show:environment.background_show
         },
         loadObjectsParam:{
         object:"hall_scheme_object",
         params:{
         where:"HALL_SCHEME_ID = "+environment.hall_scheme_id
         }
         },
         reLoadCallback:function(){


         }
         },function(){
         $("#count_lines").focus();
         EL.loadGroups();
         mapEditor_map.box.click(function(e){
         if (mapEditor_map.scaleCoeff==0) mapEditor_map.scaleCoeff=0.0001;


         });

         //log(mapEditor_map.squares.length);
         if (mapEditor_map.squares.length==0){

         EL.createGroup({0:{
         x:1,
         y:1,
         color0:"#c1c1c1",
         color1:"#c1c1c1",
         place:0,
         line:0
         }});

         mapEditor_map.setScaleCoff();
         delete mapEditor_map.squares[10000];
         $("#for_groups").html("");
         }else{
         mapEditor_map.setScaleCoff();
         }

         mapEditor_map.ctx.fillStyle = "#000";
         mapEditor_map.render();

         mapE = mapEditor_map;

         }
         );
         $("div").each(function(){
         if (this.id!="")
         preventSelection(document.getElementById(this.id));
         });



         $(document).keydown(function(e){
         if (e.which==46){
         if (mapEditor_map.shiftState==16)
         EL.deleteSelection();
         }
         });

         mapEditor_map.push = function(obj){

         if (typeof obj != "object") return;
         var max = 0;
         for (var k in mapEditor_map.squares){
         if (+k>max) max = +k;
         }
         max+=1;
         obj.id = max;
         var color = obj.color0.replace("#","0x");
         if (color>+"0x8b5742")
         obj.textColor = "#000";
         else
         obj.textColor = "#fff";
         obj.place += "";
         obj.status = 0;
         mapEditor_map.squares[max] = obj;
         };

         mapEditor_map.addSquare = function(obj){
         mapEditor_map.push(obj);


         };

         var EL = {
         renderCount:1,
         renderCounter:1,
         groups:[],
         last_group:0,
         xSelection:[],
         ySelection:[],
         minXSelection:0,
         minYSelection:0,
         maxXSelection:0,
         maxYSelection:0,
         splitSelection:function(){
         this.xSelection=[];
         this.ySelection=[];
         var sel =[];
         for (var s0 in mapEditor_map.selection){
         sel.push(mapEditor_map.selection[s0]);
         }
         var get_sel_length = function(){
         var count = 0;
         for (var k in sel){
         count++;
         }
         return count;

         };
         var get_sel_first = function(){
         var min = sel.length;
         for (var k in sel){
         if (+k < min) min = k;
         }
         return min;
         };

         var xCount = 0;

         this.minXSelection = mapEditor_map.squares[sel[get_sel_first()]].x;
         this.minYSelection = mapEditor_map.squares[sel[get_sel_first()]].y;
         while (get_sel_length()!=0){
         this.xSelection[xCount] = [];
         var get_first = get_sel_first();
         var firstY = mapEditor_map.squares[sel[get_first]].y;
         this.xSelection[xCount].push(sel[get_first]);



         delete sel[get_first];
         for (var k in sel){
         /// вычисление границ выделения
         if (mapEditor_map.squares[sel[k]].x<this.minXSelection) this.minXSelection = mapEditor_map.squares[sel[k]].x;
         if (mapEditor_map.squares[sel[k]].x>this.maxXSelection) this.maxXSelection = mapEditor_map.squares[sel[k]].x;
         if (mapEditor_map.squares[sel[k]].y<this.minYSelection) this.minYSelection = mapEditor_map.squares[sel[k]].y;
         if (mapEditor_map.squares[sel[k]].y>this.maxYSelection) this.maxYSelection = mapEditor_map.squares[sel[k]].y;
         /// конец вычисление границ выделения
         if (k==0) continue;

         if (mapEditor_map.squares[sel[k]].y>firstY-mapEditor_map.squareWH/2 && mapEditor_map.squares[sel[k]].y<firstY+mapEditor_map.squareWH/2){
         this.xSelection[xCount].push(sel[k]);
         delete sel[k];
         }
         }
         this.xSelection[xCount] = this.xSelection[xCount].sort(function(a,b){
         return mapEditor_map.squares[a].x - mapEditor_map.squares[b].x;
         });
         xCount++;
         }


         for (var s0 in mapEditor_map.selection){
         sel.push(mapEditor_map.selection[s0]);
         }

         var yCount = 0;
         while (get_sel_length()!=0){
         this.ySelection[yCount] = [];
         get_first = get_sel_first();
         var firstX = mapEditor_map.squares[sel[get_first]].x;
         this.ySelection[yCount].push(sel[get_first]);
         delete sel[get_first];
         for (var k in sel){
         if (k==0) continue;
         if (mapEditor_map.squares[sel[k]].x>firstX-mapEditor_map.squareWH/2 && mapEditor_map.squares[sel[k]].x<firstX+mapEditor_map.squareWH/2){
         this.ySelection[yCount].push(sel[k]);
         delete sel[k];
         }
         }
         this.ySelection[yCount] = this.ySelection[yCount].sort(function(a,b){
         return mapEditor_map.squares[a].y - mapEditor_map.squares[b].y;
         });
         yCount++;
         }
         this.xSelection.sort(function(a,b){
         if (mapEditor_map.squares[a[0]].y<mapEditor_map.squares[b[0]].y) return -1;
         else if (mapEditor_map.squares[a[0]].y>mapEditor_map.squares[b[0]].y) return 1;
         return 0;
         });




         //log("minX= "+this.minXSelection+"; minY= "+this.minYSelection+"; maxX= "+this.maxXSelection+"; maxY= "+this.maxYSelection);



         },
         fillNumbers:function(xReverse,yReverse){
         if (mapEditor_map.countSelection()==0){
         bootbox.dialog({
         message: "Не выбрано ни одного места",
         title: "",
         buttons: {
         error: {
         label: "Ок",
         className: "blue"
         }
         }
         });
         return;
         }
         this.splitSelection();

         var obj = EL.xSelection;
         if ($("#invert_line_place:checked").length>0)
         obj = EL.ySelection;
         if ($("#one_row").val()>0){
         obj = [];
         obj[+$("#one_row").val()-1] = mapEditor_map.selection.sort(function(a,b){
         if (mapEditor_map.squares[a].x<mapEditor_map.squares[b].x) return -1;
         if (mapEditor_map.squares[a].x>mapEditor_map.squares[b].x) return 1;
         return 0;
         });
         }


         if (yReverse==1) obj.reverse();
         //var line = (+$("#one_row").val()>0) ? $("#one_row").val() : 1;
         var line = ($("#shift_lines").val()!=1 && !isNaN($("#shift_lines").val()))? +$("#shift_lines").val() : 1;
         var place = ($("#shift_places").val()!=1 && !isNaN($("#shift_places").val()))? +$("#shift_places").val() : 1;
         for (var r in obj){
         place = ($("#shift_places").val()!=1 && !isNaN($("#shift_places").val()))? +$("#shift_places").val() : 1;
         if (xReverse==1) obj[r].reverse();
         for (var p in obj[r]){

         mapEditor_map.squares[obj[r][p]].line = (+$("#one_row").val()>0) ? $("#one_row").val() : line;
         mapEditor_map.squares[obj[r][p]].place = String(place);
         if (mapEditor_map.squares[obj[r][p]].status==1)
         mapEditor_map.squares[obj[r][p]].status = 2;
         place++;
         }
         line++;
         }
         mapEditor_map.render();
         },

         get_last_group:function(){
         $(".one_group").each(function(){
         var id = +this.id.replace(/[^0-9]/ig,'');
         if (id>=EL.last_group) EL.last_group = id+1;
         });
         return this.last_group;
         },
         createGroup:function(params){
         if (typeof params!="object") return;
         var last_group = this.get_last_group();
         var gr_name = ($("#group_name").val()!='') ? ($("#group_name").val()=='Автогруппа') ? 'Автогруппа '+last_group : $("#group_name").val() : 'Группа '+last_group;
         this.groups.push("Group"+last_group);
         for (var k in params){
         mapEditor_map.addSquare(
         {
         x:params[k].x,
         y:params[k].y,
         w:params[k].w,
         h:params[k].h,
         color0:params[k].color0,
         color1:params[k].color1,
         place:params[k].place,
         line:params[k].line,
         group:last_group,
         group_name:gr_name

         }
         );

         }
         $("#for_groups").append('<div class="one_group" id="one_group'+last_group+'"><span>'+gr_name+'</span></div>');
         },
         loadGroups:function(){
         //            mapEditor_map.squares[]
         for (var k in mapEditor_map.squares){
         if ($("#one_group"+mapEditor_map.squares[k].group).length==0){
         $("#for_groups").append('<div class="one_group" id="one_group'+mapEditor_map.squares[k].group+'"><span>'+mapEditor_map.squares[k].group_name+'</span></div>');
         }
         }

         },
         func1: function(){
         var x = +$("#X").val();
         var y = +$("#Y").val();
         var w = +$("#W").val();
         var h = +$("#H").val();
         var places = +$("#count_places").val();
         var lines = +$("#count_lines").val();
         var color = $("#COLOR").val();
         var Xcoef = $("#Xcoef").val();
         var Ycoef = $("#Ycoef").val();



         var wh = mapEditor_map.squareWH;/*//*mapEditor_map.scaleCoeff;

         var squares = {};
         var count = 1;
         for (var l = 1; l<=lines; l++){
         for (var p = 1; p<=places; p++){
         squares[count] = {
         x:x+(p-1)*(w+w*Xcoef),
         y:y+(l-1)*(h+h*Ycoef),
         w:w,
         h:h,
         color0:color,
         color1:color,
         place:p,
         line:l
         };
         count++;
         }
         }
         this.createGroup(squares);
         mapEditor_map.render();
         var sqLength = 0 ;
         for (var k in mapEditor_map.squares){
         sqLength++;
         }
         this.renderCounter = Math.floor(sqLength/1000)+1;
         //log(this.renderCounter);

         },
         reLoadGroups:function(){
         $(".one_group").each(function(){
         var id = this.id.replace(/[^0-9]/ig,'');

         for (var k in mapEditor_map.squares){
         if (mapEditor_map.squares[k].group == id) {
         return true;
         }
         }
         $("#one_group"+id).remove();
         });
         },
         deleteSelection:function(){
         if (mapEditor_map.selection.length==0) return;
         mapEditor_map.loading = true;
         var allSelection = mapEditor_map.countSelection();
         var counter =0;

         MB.Core.sendQuery({command:"operation",object:"delete_hall_scheme_item",sid:sid,params:{hall_scheme_item_id:mapEditor_map.selection.join(',').replace(/,+[^0-9]/ig,',').replace(/,$/ig,'').replace(/^,/ig,'')}},function(data){
         if (data.RC == 0){
         for (var k in mapEditor_map.selection){
         delete mapEditor_map.squares[mapEditor_map.selection[k]];
         }
         mapEditor_map.selection = [];
         mapEditor_map.reLoad();
         EL.reLoadGroups();
         mapEditor_map.loading = false;
         }else{
         log(data.MESSAGE);
         }
         });


         },
         xScale:function(dX){
         if (mapEditor_map.selection.length==0) return;
         //var minX = mapEditor_map.squares[mapEditor_map.selection[0]].x;
         var minX = 1000000;
         for (var k in mapEditor_map.selection){
         if (mapEditor_map.squares[mapEditor_map.selection[k]].x<minX) minX = mapEditor_map.squares[mapEditor_map.selection[k]].x;
         }
         var maxX = 0;
         for (var k in mapEditor_map.selection){
         if (mapEditor_map.squares[mapEditor_map.selection[k]].x>maxX) maxX = mapEditor_map.squares[mapEditor_map.selection[k]].x;
         }
         if (minX==maxX) return;
         var scaleCoeff = (maxX - minX+dX)/(maxX - minX);
         for (var k0 in mapEditor_map.selection){
         var delta = (mapEditor_map.squares[mapEditor_map.selection[k0]].x - minX)*scaleCoeff;
         mapEditor_map.squares[mapEditor_map.selection[k0]].x = minX +delta;
         if (mapEditor_map.squares[mapEditor_map.selection[k0]].status==1)
         mapEditor_map.squares[mapEditor_map.selection[k0]].status = 2;
         }


         mapEditor_map.render();
         },
         yScale:function(dY){
         if (mapEditor_map.selection.length==0) return;
         //var minY = mapEditor_map.squares[mapEditor_map.selection[0]].y;
         var minY = 1000000;
         for (var k in mapEditor_map.selection){
         if (mapEditor_map.squares[mapEditor_map.selection[k]].y<minY) minY = mapEditor_map.squares[mapEditor_map.selection[k]].y;
         }
         var maxY = 0;
         if (minY==maxY) return;
         for (var k in mapEditor_map.selection){
         if (mapEditor_map.squares[mapEditor_map.selection[k]].y>maxY) maxY = mapEditor_map.squares[mapEditor_map.selection[k]].y;
         }
         var scaleCoeff = (maxY - minY+dY)/(maxY - minY);
         for (var k0 in mapEditor_map.selection){
         var delta = (mapEditor_map.squares[mapEditor_map.selection[k0]].y - minY)*scaleCoeff;
         mapEditor_map.squares[mapEditor_map.selection[k0]].y = minY +delta;
         if (mapEditor_map.squares[mapEditor_map.selection[k0]].status==1)
         mapEditor_map.squares[mapEditor_map.selection[k0]].status = 2;
         }


         mapEditor_map.render();
         },
         moveTo:function(x,y){
         var group = mapEditor_map.selection;
         var dX = (x-this.downX)/mapEditor_map.scaleCoeff;
         var dY = (y-this.downY)/mapEditor_map.scaleCoeff;
         for (var k in group){
         var sq = mapEditor_map.squares[group[k]];
         var Xnew = mapEditor_map.squares[group[k]].x + dX;
         var Ynew = mapEditor_map.squares[group[k]].y + dY;
         mapEditor_map.squares[group[k]].x = Xnew;
         mapEditor_map.squares[group[k]].y = Ynew;
         if (mapEditor_map.squares[group[k]].status==1)
         mapEditor_map.squares[group[k]].status = 2;
         }
         this.downX = x;
         this.downY = y;
         if (this.renderCount%EL.renderCounter==0)
         mapEditor_map.render();
         this.renderCount++;
         }

         };*/

        //EL0 = EL;







        /* mapEditor_map.box.mousedown(function(e){
         var x = e.offsetX;
         var y = e.offsetY;
         switch (e.which){
         case 1:
         EL.downX = x;
         EL.downY = y;
         EL.downed = 1;

         break;



         }


         });*/
        /*

         mapEditor_map.box.mousemove(function(e){

         var x = e.offsetX;
         var y = e.offsetY;
         var wh = mapEditor_map.squareWH;
         var cw = mapEditor_map.canvas.width();
         var ch = mapEditor_map.box.height();

         var group = mapEditor_map.selection;
         switch (e.which){
         case 1:
         switch (mapEditor_map.shiftState){
         case 17:

         if (mapEditor_map.mode!="squares") return;
         if (EL.downed && mapEditor_map.selection.length>0){
         EL.moveTo(x,y);
         */
        /* var dX = (x-EL.downX)/mapEditor_map.scaleCoeff;
         var dY = (y-EL.downY)/mapEditor_map.scaleCoeff;
         for (var k in group){
         var sq = mapEditor_map.squares[group[k]];
         var Xnew = mapEditor_map.squares[group[k]].x + dX;
         var Ynew = mapEditor_map.squares[group[k]].y + dY;
         mapEditor_map.squares[group[k]].x = Xnew;
         mapEditor_map.squares[group[k]].y = Ynew;
         }
         EL.downX = x;
         EL.downY = y;
         if (EL.renderCount%EL.renderCounter==0)
         mapEditor_map.render();
         EL.renderCount++;*//*


         }

         break;
         }
         break;



         }


         });
         mapEditor_map.box.mouseup(function(e){
         var x = e.offsetX;
         var y = e.offsetY;

         //log(mapEditor_map.squares[0].x);

         EL.downed = 0;
         //mapEditor_map.render();



         });

         $("body").keydown(function(e){
         switch (e.which){
         case 39:
         switch (mapEditor_map.shiftState){
         case 16:
         EL.xScale(5);
         break;
         case 17:
         EL.moveTo(+EL.downX+1,EL.downY);
         break;
         }
         break;
         case 37:
         switch (mapEditor_map.shiftState){
         case 16:
         EL.xScale(-5);
         break;
         case 17:
         EL.moveTo(+EL.downX-1,EL.downY);
         break;
         }
         break;
         case 38:
         switch (mapEditor_map.shiftState){
         case 16:
         EL.yScale(-5);
         break;
         case 17:
         EL.moveTo(EL.downX,+EL.downY-1);
         break;
         }
         break;
         case 40:
         switch (mapEditor_map.shiftState){
         case 16:
         EL.yScale(5);
         break;
         case 17:
         EL.moveTo(EL.downX,+EL.downY+1);
         break;
         }
         break;
         }

         });





         $("#create_group").click(function(){
         EL.func1();
         });
         $("#copy_selection").click(function(){
         mapEditor_map.copySelection();
         });

         $(".one_group").live("click",function(){
         var id = this.id.replace(/[^0-9]/ig,'');
         mapEditor_map.clearSelection();
         for (var k in mapEditor_map.squares){
         if (mapEditor_map.squares[k].group==id){
         mapEditor_map.addToSelection(mapEditor_map.squares[k].id);
         }
         }
         });

         $("#unite_group").click(function(){
         var last_group = EL.get_last_group();
         var gr_name = ($("#group_name").val()!='') ? ($("#group_name").val()=='Автогруппа') ? 'Автогруппа '+last_group : $("#group_name").val() : 'Группа '+last_group;
         for (var k in mapEditor_map.selection){
         mapEditor_map.squares[mapEditor_map.selection[k]].group = last_group;
         mapEditor_map.squares[mapEditor_map.selection[k]].group_name = gr_name;
         mapEditor_map.squares[mapEditor_map.selection[k]].color1 = $("#COLOR").val();
         if (mapEditor_map.squares[mapEditor_map.selection[k]].status==1)
         mapEditor_map.squares[mapEditor_map.selection[k]].status = 2;
         }
         $("#for_groups").append('<div class="one_group" id="one_group'+last_group+'"><span>'+gr_name+'</span></div>');
         EL.reLoadGroups();

         });

         $("#save_scheme_item").click(function(){
         var info = toastr["info"]("Идет процесс сохранения", "Подождите...",{
         timeOut:1000000
         });
         var sqCount = 0;
         for (var k0 in mapEditor_map.squares){
         //if (mapEditor_map.squares[k0].status==0) sqCount++;
         sqCount++;
         }
         var counter = 0;
         mapEditor_map.loading = true;
         //var old_squares = [];
         for (var k in mapEditor_map.squares){

         switch (mapEditor_map.squares[k].status){
         case 0:   //// NEW
         MB.Core.sendQuery({command:"new",object:"hall_scheme_item",sid:sid,params:
         {
         old_id:mapEditor_map.squares[k].id,
         hall_scheme_id:environment.hall_scheme_id,
         place:mapEditor_map.squares[k].place,
         line:mapEditor_map.squares[k].line,
         x:mapEditor_map.squares[k].x,
         y:mapEditor_map.squares[k].y,
         w:mapEditor_map.squares[k].w,
         h:mapEditor_map.squares[k].h,
         group_id:mapEditor_map.squares[k].group,
         group_name:mapEditor_map.squares[k].group_name,
         color:mapEditor_map.squares[k].color1
         }},function(data){
         if(data.RC==0){
         counter++;
         var id = data.ID;
         var old_id = data.OLD_ID;
         //old_squares.push(old_id);
         mapEditor_map.squares[old_id].id = id;
         mapEditor_map.squares[old_id].status = 1;
         mapEditor_map.squares[id] = mapEditor_map.squares[old_id];
         delete mapEditor_map.squares[old_id];
         if (counter==sqCount) {
         mapEditor_map.loading = false;
         mapEditor_map.reLoad();
         //mapEditor_map.reLoadLayout();
         mapEditor_map.selection = [];

         mapEditor_map.reLoadLayout();
         info.fadeOut(600);
         toastr["success"]("Изменения успешно сохранены", "");
         }

         }else{
         log(data.message);
         }
         });
         break;
         case 2:    //// EDIT
         if (mapEditor_map.squares[k].group==undefined) mapEditor_map.squares[k].group = 1;
         MB.Core.sendQuery({command:"modify",object:"hall_scheme_item",sid:sid,params:
         {
         hall_scheme_item_id:mapEditor_map.squares[k].id,
         hall_scheme_id:environment.hall_scheme_id,
         place:mapEditor_map.squares[k].place,
         line:mapEditor_map.squares[k].line,
         x:mapEditor_map.squares[k].x,
         y:mapEditor_map.squares[k].y,
         w:mapEditor_map.squares[k].w,
         h:mapEditor_map.squares[k].h,
         group_id:mapEditor_map.squares[k].group,
         group_name:mapEditor_map.squares[k].group_name,
         color:mapEditor_map.squares[k].color1
         }},function(data){
         counter++;
         if(data.RC==0){
         var id = data.ID;
         mapEditor_map.squares[k].status = 1;
         if (counter==sqCount) {
         mapEditor_map.loading = false;
         mapEditor_map.reLoad();
         mapEditor_map.selection = [];
         mapEditor_map.reLoadLayout();
         info.fadeOut(600);
         toastr["success"]("Изменения успешно сохранены", "");
         }
         }
         });
         break;
         default:
         counter++;
         if (counter==sqCount) {
         mapEditor_map.loading = false;
         mapEditor_map.reLoad();
         mapEditor_map.selection = [];
         mapEditor_map.reLoadLayout();
         }
         break;
         }

         }

         });

         $("#del_scheme_item").click(function(){
         bootbox.dialog({
         message: "Удалить все?",
         title: "Удаление",
         buttons: {
         yes: {
         label: "Да",
         className: "red",
         callback:function(){
         bootbox.dialog({
         message: "Все элементы будут удалены!",
         title: "<span style='color: #ff0000; font-weight: bold;'>Уверены?</span>",
         buttons: {
         yes: {
         label: "Да",
         className: "red",
         callback:function(){
         MB.Core.sendQuery({command:"operation",object:"remove_all_scheme_items",sid:sid,params:{hall_scheme_id:environment.hall_scheme_id}},function(data){
         if (data.RC==0){
         mapEditor_map.squares = [];
         mapEditor_map.render();
         }else{
         bootbox.dialog({
         message: data.MESSAGE,
         title: "Ошибка",
         buttons: {
         error: {
         label: "Ок",
         className: "red"

         }
         }
         });
         }
         });
         }
         },
         no: {
         label: "Отмена",
         className: "green",
         callback:function(){}
         }
         }
         });

         }
         },
         no: {
         label: "Нет",
         className: "green",
         callback:function(){}
         }
         }
         });



         });

         $("#fillNumLT").click(function(){
         EL.fillNumbers();
         });
         $("#fillNumRT").click(function(){
         EL.fillNumbers(1);
         });
         $("#fillNumRB").click(function(){
         EL.fillNumbers(1,1);
         });
         $("#fillNumLB").click(function(){
         EL.fillNumbers(0,1);
         });


         environment.mapEditorSelectArea = {};
         $("#select_area_group").click(function(){
         if (mapEditor_map.countSelection()==0) return;
         for(var s in mapEditor_map.selection){
         if (mapEditor_map.squares[mapEditor_map.selection[s]].status==0)   {
         bootbox.dialog({
         message: "Выделенные элементы еще не сохранены.",
         title: "Ошибка",
         buttons: {
         error: {
         label: "Ок",
         className: "blue"
         }
         }
         });


         return;
         //delete mapEditor_map.selection[s];
         }


         }



         MB.Core.switchModal({
         type: "form",
         ids: [environment.hall_id],
         name: "form_area_group",
         params:{
         */
        /*tblselectedrow:environment.area_group_id,*//*

         tblcallbacks:{
         custom1:{
         name: "Выбрать",
         callback: function (key, options) {
         MB.Modal.close("form_area_group");
         environment.area_group_id =  options.$trigger.data("row");


         MB.Core.sendQuery({
         command:"operation",
         object:"change_hall_scheme_item_area_group",
         sid:sid,
         params:{
         area_group_id:environment.area_group_id,
         hall_scheme_item_id:mapEditor_map.selection.join(',').replace(/,+[^0-9]/ig,',').replace(/,$/ig,'').replace(/^,/ig,'')
         }},function(data){
         if (data.RC==0){
         mapEditor_map.reLoad();
         mapEditor_map.clearSelection();
         }else{
         log(data.MESSAGE);
         }

         });
         }
         }
         }
         }
         });


         */
        /*MB.Core.switchModal({type: "table", name: "table_area_group", params: {
         hall_id: environment.hall_id,
         callback: function (area_group_id) {
         if (mapEditor_map.countSelection()==0) return;
         MB.Core.sendQuery({
         command:"operation",
         object:"change_hall_scheme_item_area_group",
         sid:sid,
         params:{
         area_group_id:area_group_id,
         hall_scheme_item_id:mapEditor_map.selection.join(',').replace(/,+[^0-9]/ig,',').replace(/,$/ig,'').replace(/^,/ig,'')
         }},function(data){
         if (data.RC==0){
         mapEditor_map.reLoad();
         mapEditor_map.clearSelection();
         }else{
         log(data.MESSAGE);
         }

         });
         }
         }
         });*//*

         });

         $("#clear_selection").click(function(){
         mapEditor_map.clearSelection();
         });
         $("#delete_selection").click(function(){
         bootbox.dialog({
         message: "Удалить выделеные места?",
         title: "",
         buttons: {
         yes: {
         label: "Да",
         className: "green",
         callback:function(){
         EL.deleteSelection();
         }
         },
         no: {
         label: "Нет",
         className: "blue"
         }
         }
         });

         });
         $("#show_hide_background").click(function(){
         mapEditor_map.loadBackgroundFlag = !mapEditor_map.loadBackgroundFlag;
         mapEditor_map.render();
         });
         /// Переключение правого столбца
         $(".rcsc_btn").click(function(){
         $(".rcsc_btn").removeClass("selected");
         $(this).addClass("selected");
         var id = this.id.replace(/[^0-9]/ig,'');
         $(".right_column_block:visible").fadeOut(150,function(){
         $("#right_column_block"+id).fadeIn(150);
         mapEditor_map.mode = mapEditor_map.modes[id];
         });

         });


         $("#add_stroke").click(function(){
         mapEditor_map.strokes.add();
         });

         $(".one_stroke").live("click",function(){
         $(".one_stroke").removeClass("selected");
         $(this).addClass("selected");
         var id = this.id.replace(/[^0-9]/ig,'');
         $("#stroke_name").val($("#one_stroke"+id+" span").text());
         mapEditor_map.strokes.selected = id;
         mapEditor_map.strokes.loadPoints();
         mapEditor_map.strokes.loadLines();
         });
         $("#add_point").click(function(){
         mapEditor_map.strokes.addPoint({
         x:+$("#X").val(),
         y:$("#Y").val(),
         item:mapEditor_map.strokes.selected,
         selected:false
         });
         mapEditor_map.strokes.loadPoints();
         });

         $(".one_point").live("click",function(){
         var id = this.id.replace(/[^0-9]/ig,'');
         mapEditor_map.strokes.items[mapEditor_map.strokes.selected].points[id].selected = !mapEditor_map.strokes.items[mapEditor_map.strokes.selected].points[id].selected;
         mapEditor_map.strokes.drawPoint(mapEditor_map.strokes.items[mapEditor_map.strokes.selected].points[id]);
         });


         $(".point_edit_btn").click(function(){
         $(".point_edit_btn").removeClass("selected");
         $(this).addClass("selected");
         var id = this.id.replace(/[^0-9]/ig,'');
         mapEditor_map.strokes.point_mode = id;
         });


         $("#add_line").click(function(){
         mapEditor_map.strokes.createLine();
         });
         $("#create_Stroke").click(function(){
         mapEditor_map.strokes.createStrokes(mapEditor_map.strokes.selected);
         });


         $("#save_strokes").click(function(){
         mapEditor_map.strokes.save();
         });

         $(".one_strokes_del").die("click").live("click",function(){
         var id = this.id.replace(/[^0-9]/ig,'');
         mapEditor_map.strokes.remove(id);
         });


         $(".one_labels").live("click",function(){
         var id = this.id.replace(/[^0-9]/ig,'');
         mapEditor_map.labels[id].selected = !mapEditor_map.labels[id].selected;
         mapEditor_map.render();
         });

         $("#add_label").click(function(){
         mapEditor_map.addLabel();
         });
         $("#save_label").click(function(){
         mapEditor_map.saveLabels();
         });

         $(".one_labels_del").die("click").live("click",function(){
         var self = this;

         bootbox.dialog({
         message: "Удалить надпись?",
         title: "",
         buttons: {
         yes: {
         label: "Да",
         className: "green",
         callback:function(){
         var id = self.id.replace(/[^0-9]/ig,'');
         mapEditor_map.deleteLabels(id);
         }
         },
         no: {
         label: "Нет",
         className: "blue"
         }
         }
         });




         });

         $("#show_background").on("click",function(){
         var flag = !!($("#show_background:checked").length);
         var o = {
         command:"modify",
         object:"hall_scheme",
         sid:MB.User.sid,
         params:{
         hall_scheme_id:environment.hall_scheme_id,
         BACKGROUND_SHOW:(flag)?"TRUE":"FALSE",
         objversion:mapEditor_map.objversion
         }
         };
         MB.Core.socketQuery(o,function(result){
         if (result.RC==0){
         mapEditor_map.objversion = result.OBJVERSION;
         mapEditor_map.toggleBackgroundImage(flag);
         */
        /*mapEditor_map.render();*//*

         }
         });
         return false;
         //mapEditor_map.toggleBackgroundImage();

         });
         $("#load_background").on("click",function(){

         */
        /* MB.Core.imageLoader.load({
         success:function(fileUID){
         var o = {
         command:"modify",
         object:"hall_scheme",
         sid:MB.User.sid,
         params:{
         hall_scheme_id:environment.hall_scheme_id,
         BACKGROUND_IMAGE_URL:fileUID.name,
         BACKGROUND_SHOW:"TRUE",
         objversion:mapEditor_map.objversion
         }
         };
         MB.Core.socketQuery(o,function(result){
         if (result.RC==0){
         mapEditor_map.objversion = result.OBJVERSION;
         mapEditor_map.backgroundImage.image.src = fileUID.base64Data;
         mapEditor_map.toggleBackgroundImage(true);
         *//*
         */
        /*mapEditor_map.render();*//*
         */
        /*
         }
         });
         }

         }); *//*

         });
         $("#clear_background").on("click",function(){
         bootbox.dialog({
         message: "Удалить фон?",
         title: "",
         buttons: {
         yes: {
         label: "Да",
         className: "green",
         callback:function(){
         var o = {
         command:"modify",
         object:"hall_scheme",
         sid:MB.User.sid,
         params:{
         hall_scheme_id:environment.hall_scheme_id,
         BACKGROUND_IMAGE_URL:"",
         BACKGROUND_SHOW:"FALSE",
         objversion:mapEditor_map.objversion
         }
         };
         MB.Core.socketQuery(o,function(result){
         if (result.RC==0){
         mapEditor_map.objversion = result.OBJVERSION;
         mapEditor_map.backgroundImage.image.src = "";
         mapEditor_map.toggleBackgroundImage(false);
         */
        /*mapEditor_map.render();*//*

         }
         });
         }
         },
         no: {
         label: "Нет",
         className: "blue"
         }
         }
         });


         });
         */



    }
})();
    //mapEditor_init(contentInstance.activeId);
//mapEditor_init(742);























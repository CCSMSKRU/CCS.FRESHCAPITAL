(function ()
{
    var contentID = MB.Contents.justAddedId;
    var contentInstance = MB.Contents.getItem(contentID);
    var contentWrapper = $('#mw-' + contentInstance.id);
    var modalInstance = MB.Core.modalWindows.windows.getWindow(contentID);
    var sid = MB.User.sid;
    var environment = modalInstance.params;
    var scheme = environment.scheme || "hall_scheme";
    var scheme_items = (environment.scheme.indexOf('hall') !== -1) ? 'hall_scheme_item' : 'action_scheme';
    var scheme_id = (environment.scheme.indexOf('hall') !== -1) ? environment.scheme + '_id' : environment.scheme.replace('_scheme', '_id');
    var SCHEME = scheme.toUpperCase();
//var scheme_id = scheme.replace('_scheme','')+'_id';
//var imageLoader = new ImageLoader({delivery: delivery});
    uiTabs();
    uiUl();
    inlineEditing();
    $('input[type="checkbox"]').not('.noUniform').uniform();
    initDnD();
//verticalFluid();
    var mapContainer = contentWrapper.find('.box_for_canvas');
    var mapEditor_map = new Map1({
        container: mapContainer,
        mode: "editor",
        doc_root: connectHost + "/",
        contentID:contentID
        /*,
         cWidth:environment.getWidth(),
         cHeight:environment.getHeight()*/
    });
    mapEditor_map.id = contentInstance.id;
    mapEditor_map.isActionEditing = (scheme.indexOf('action') !== -1);

    var editor = mapEditorLogicInit(mapEditor_map);
    MB.User.mapEditor_map = mapEditor_map;

    modalInstance.stick = 'top';
    modalInstance.stickModal();

    $(modalInstance).off('resize').on('resize', function () {
        mapEditor_map.resize();
    });

    /*****       + ME      ***///

    mapEditor_map.objectTypes = {
        0: "PLACE_GROUP",
        1: "BACKGROUND",
        2: "IMAGE",
        3: "STROKE",
        4: "LABEL"
    };
    mapEditor_map.specialObjects = {
        items: [],
        getByName: function (name) {
            for (var k in this.items) {
                if (this.items[k].name == name) return this.items[k];
            }
            return false;
        },
        addItem: function (params) {
            this.items.push({
                active: params.active || false,
                object: params.object || false,
                name: params.name || "",
                visible: (params.visible !== undefined) ? params.visible : true,
                x1: params.x1 || 0,
                y1: params.y1 || 0,
                x2: params.x2 || 0,
                y2: params.y2 || 0,
                w: params.w || 14,
                h: params.h || 14,
                r: params.r || 0,
                angle1: params.angle1 || 0,
                angle2: params.angle2 || 0,
                type: params.type || "point",
                color1: params.color1 || "#979797",
                color2: params.color2 || "#FFF",
                value: params.value || "",
                pointLineWidth: params.pointLineWidth || 4,
                lineWidth: params.lineWidth || 1
            });
            return this.items.length - 1;
        },
        removeItemsByObject: function (object_id, callback) {
            for (var k in this.items) {
                var item = this.items[k];
                if (item.object.object_id == object_id) {
                    delete this.items[k];
                }
            }
            if (typeof callback == "function") {
                callback();
            }

        },
        clear: function () {
            this.items = [];
        }
    };
    mapEditor_map.drawSpecialObjects = function () {

        var oldFillStyle = this.ctx.fillStyle;
        var oldStrokeStyle = this.ctx.strokeStyle;
        var items = mapEditor_map.specialObjects.items;
        for (var k in items) {
            var obj = items[k];
            if (typeof obj !== "object" || !obj.visible) continue;
            switch (obj.type) {
                case "point":
                    var x = (+obj.object.x + obj.x1 * obj.object.scaleCoeff) * this.scaleCoeff + this.XCoeff;
                    var y = (+obj.object.y + obj.y1 * obj.object.scaleCoeff) * this.scaleCoeff + this.YCoeff;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, obj.w / 2, 0, 2 * Math.PI, false);
                    this.ctx.lineWidth = obj.pointLineWidth;
                    this.ctx.fillStyle = obj.color1;
                    this.ctx.strokeStyle = obj.color2;
                    this.ctx.fill();
                    this.ctx.stroke();


                    break;
                case "line":

                    var x = (+obj.object.x + obj.x1 * obj.object.scaleCoeff) * this.scaleCoeff + this.XCoeff;
                    var y = (+obj.object.y + obj.y1 * obj.object.scaleCoeff) * this.scaleCoeff + this.YCoeff;
                    var x2 = (+obj.object.x + obj.x2 * obj.object.scaleCoeff) * this.scaleCoeff + this.XCoeff;
                    var y2 = (+obj.object.y + obj.y2 * obj.object.scaleCoeff) * this.scaleCoeff + this.YCoeff;
                    this.ctx.moveTo(x, y);
                    this.ctx.lineTo(x2, y2);
                    this.ctx.strokeStyle = obj.color1;
                    this.ctx.lineWidth = obj.lineWidth;
                    this.ctx.stroke();

                    break;
                case "arc":

                    var x = (+obj.object.x + obj.x1 * obj.object.scaleCoeff) * this.scaleCoeff + this.XCoeff;
                    var y = (+obj.object.y + obj.y1 * obj.object.scaleCoeff) * this.scaleCoeff + this.YCoeff;
                    var r = +obj.r;
                    var angle1 = +obj.angle1;//*Math.PI/180;
                    var angle2 = +obj.angle2;//*Math.PI/180;
                    this.ctx.strokeStyle = obj.color1;
                    this.ctx.lineWidth = obj.lineWidth;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, r, angle1, angle2, false);
                    this.ctx.stroke();

                    break;
                case 4: // IMAGE
                    if (obj.visibility['visible_' + mode]) {
                        //if (this.ctx.font != obj.fontStyle+" "+obj.fontSize*this.scaleCoeff+"pt '"+obj.fontFamily+"'")
                        this.ctx.font = obj.fontStyle + " " + obj.fontSize * this.scaleCoeff + "px '" + obj.fontFamily + "'";
                        log(this.ctx.font);

                        /*  if (this.ctx.fillStyle!=textColor)
                         this.ctx.fillStyle = textColor;
                         */

                        var x = +obj.x * this.scaleCoeff + this.XCoeff;
                        var y = +obj.y * this.scaleCoeff + this.YCoeff;
                        this.ctx.fillText(obj.value, x, y);
                    }
                    break;
            }
        }
        this.ctx.fillStyle = oldFillStyle;
        this.ctx.strokeStyle = oldStrokeStyle;
    };
    mapEditor_map.mouseOnSpecialObject = function (x, y) {
        if (mapEditor_map.loading) return false;
        var items = mapEditor_map.specialObjects.items;
        var x1 = (x - mapEditor_map.XCoeff) / mapEditor_map.scaleCoeff;
        var y1 = (y - mapEditor_map.YCoeff) / mapEditor_map.scaleCoeff;
        for (var k in items) {
            var item = items[k];
            if (!item.active || item.type != "point") continue;
            var itemX = +item.object.x + item.x1 * item.object.scaleCoeff;
            var itemY = +item.object.y + item.y1 * item.object.scaleCoeff;
            if (x1 >= itemX - item.w / (2 * mapEditor_map.scaleCoeff) && x1 <= itemX + item.w / (2 * mapEditor_map.scaleCoeff) && y1 >= itemY - item.h / (2 * mapEditor_map.scaleCoeff) && y1 <= itemY + item.h / (2 * mapEditor_map.scaleCoeff)) {
                return item;
            }
        }
        return false;
    };
    mapEditor_map.mouseOnObject = function (x, y) {
        if (mapEditor_map.loading) return false;
        var x1 = (x - mapEditor_map.XCoeff) / mapEditor_map.scaleCoeff;
        var y1 = (y - mapEditor_map.YCoeff) / mapEditor_map.scaleCoeff;
        var items = editor.getSelectedObjects();
        for (var k in items) {
            var item = items[k];
            if (item.visibility.visible_editor !== true) continue;
            switch (item.type) {
                case 1:
                    if (x1 >= +item.x && x1 <= +item.x + item.value.width * item.scaleCoeff && y1 >= +item.y && y1 <= +item.y + item.value.height * item.scaleCoeff) {
                        return item;
                    }

                    break;
                case 2:
                    if (x1 >= +item.x && x1 <= +item.x + item.value.width * item.scaleCoeff && y1 >= +item.y && y1 <= +item.y + item.value.height * item.scaleCoeff) {
                        return item;
                    }

                    break;
            }

        }
        return false;


    };
    /*****_________________________FILE LIST______________________________________**************/
    mapEditor_map.container.on('addFile', function (e, object) {
        mapEditor_map.addFileServer(object);

    });
    mapEditor_map.container.on('addFile_callback', function (e, obj) {
    });
    mapEditor_map.container.on('addFile_callbackFull', function (e, obj) {
    });
    mapEditor_map.addFileClient = function (object) {
    };

    mapEditor_map.addFileServer = function (object) {

        var save_obj = {
            FILENAME: object.name,
            EXTENTION: object.name.replace(/.*?\./, ''),
            old_id: object.old_id
        };

        save_obj[scheme_id] = environment.id;
        var obj = {
            command: "new",
            object: scheme + "_file_list",
            event: "add",
            mode: "files",
            objects: [save_obj],
            portion: 100
        };

        mapEditor_map.toSocket(obj);

    };

    mapEditor_map.container.on('removeFile', function (e, file_ids) {
        mapEditor_map.removeFileServer(file_ids);

    });
    mapEditor_map.container.on('removeFile_callback', function (e, obj) {
    });
    mapEditor_map.container.on('removeFile_callbackFull', function (e, obj) {
    });
    mapEditor_map.removeFileClient = function (object) {
    };

    mapEditor_map.removeFileServer = function (file_ids) {
        if (file_ids.length == 0) return;
        var files = [];
        for (var k in file_ids) {
            var o = {};
            o[scheme + '_file_list_id'] = file_ids[k];
            files.push(o);
        }
        //log(objects);
        var obj = {
            command: "remove",
            object: scheme + "_file_list",
            event: "remove",
            objects: files,
            mode: "files",
            portion: 100

        };
        mapEditor_map.toSocket(obj);

    };


    /*****__________________END____FILE LIST______________________________________**************/


    mapEditor_map.container.on('addLayer', function (e, layer, callback) {
        mapEditor_map.addLayerServer(layer, callback)
    });
    mapEditor_map.container.on('modifyLayer', function (e, layers) {
        mapEditor_map.modifyLayerServer(layers);
    });
    mapEditor_map.container.on('removeLayer', function (e, layer_ids, callback) {
        mapEditor_map.removeLayerServer(layer_ids, callback);
    });


    mapEditor_map.addLayerServer = function (layer, callback) {

        var save_obj = {
            OLD_ID: layer.id,
            NAME: layer.title,
            VISIBLE_EDITOR: "TRUE",
            VISIBLE_ADMIN: "TRUE",
            VISIBLE_CASHER: "TRUE",
            VISIBLE_IFRAME: "TRUE",
            VISIBLE_CLIENT_SCREEN: "TRUE"
        };
        save_obj[scheme_id] = environment.id;

        var obj = {
            command: "new",
            object: scheme + "_layer",
            sid: sid,
            params: save_obj
        };
        socketQuery(obj, callback);
    };


    mapEditor_map.removeLayerServer = function (layer_ids, callback) {
        if (layer_ids.length == 0) return;
        for (var k in layer_ids) {
            var obj = {
                command: "remove",
                object: scheme + "_layer",
                sid: sid,
                params: {}
            };
            obj.params[scheme + "_layer_id"] = layer_ids[k];
            socketQuery(obj, callback);
        }
    };

    /*-------------------------------------------------------------------------------------*/

    mapEditor_map.container.on('addObject', function (e, object, callback) {
        mapEditor_map.addObjectServer(object, callback);
    });
    mapEditor_map.container.on('removeObject', function (e, object_ids, callback) {
        mapEditor_map.removeObjectServer(object_ids, callback);
    });


    mapEditor_map.addObjectServer = function (object, callback) {
        if (typeof object !== "object") return;
        var save_obj = {
            OLD_ID: object.object_id,
            NAME: object.object_title,
            OBJECT_TYPE: mapEditor_map.objectTypes[object.type],
            VISIBLE_EDITOR: object.visible_editor || "TRUE",
            VISIBLE_ADMIN: object.visible_admin || "TRUE",
            VISIBLE_CASHER: object.visible_cahser || "TRUE",
            VISIBLE_IFRAME: object.visible_iframe || "TRUE",
            VISIBLE_CLIENT_SCREEN: object.visible_client_screen || "TRUE",
            VALUE: object.value || "",
            ROTATION: object.rotation || 0,
            FONT_FAMILY: object.fontFamily || "Arial",
            FONT_SIZE: object.fontSize || "14",
            FONT_STYLE: object.fontStyle || "",
            FONT_WIEGH: object.fontWeight || "",
            COLOR: object.color || "000000",
            X: Math.round((object.x - mapEditor_map.XCoeff) / mapEditor_map.scaleCoeff) || 0,
            Y: Math.round((object.y - mapEditor_map.YCoeff) / mapEditor_map.scaleCoeff) || 0,
            SCALE: object.scale || 1,
            OPACITY: object.opacity || 1,
            BACKGROUND_COLOR: object.background_color || "FFFFFF",
            BACKGROUND_URL_ORIGINAL: object.image || "",
            BACKGROUND_URL_SCALE: object.background_url_scale || ""
        };
        save_obj[scheme_id] = environment.id;
        save_obj[scheme + '_layer_id'] = (!isNaN(+object.layer_id)) ? object.layer_id : '';

        if (object.sort_no) save_obj.sort_no = object.sort_no;
        var obj = {
            command: "new",
            object: scheme + "_object",
            sid: sid,
            params: save_obj

        };
        socketQuery(obj, callback);

    };


    mapEditor_map.container.on('modifyObject', function (e, objects) {
        debugger;
        mapEditor_map.modifyObjectServer(objects);
    });


    mapEditor_map.modifyObjectServer = function (objects) {
        debugger;
        var obj = {
            command: "modify",
            object: scheme + "_object",
            event: "edit",
            objects: objects,
            portion: 100
        };
        mapEditor_map.toSocket(obj);
    };


    mapEditor_map.removeObjectServer = function (object_ids, callback) {
        if (object_ids.length == 0) return;
        for (var k in object_ids) {
            var obj = {
                command: "remove",
                object: scheme + "_object",
                sid: sid,
                params: {}
            };
            obj.params[scheme + "_object_id"] = object_ids[k];
            socketQuery(obj, callback);
        }
    };

	/***      AREA TRIBUNE      ***///

	mapEditor_map.container.on('addTribune', function (e, object) {
		mapEditor_map.addTribuneServer(object);
	});
	mapEditor_map.container.on('addTribune_callback', function (e, obj) {


	});
	mapEditor_map.container.on('addTribune_callbackFull', function (e, obj) {


	});

	mapEditor_map.addTribuneServer = function (object) {
		if (typeof object !== "object") return;

		var save_obj = {
			NAME: object.title,
			old_id: object.old_id
		};
		save_obj[scheme_id] = environment.id;
		var obj = {
			command: "new",
			object: scheme + "_tribune",
			event: "add",
			mode: "tribune",
			objects: [save_obj],
			portion: 1
		};
		mapEditor_map.toSocket(obj);
	};

	mapEditor_map.container.on('removeTribune', function (e, ids) {
		mapEditor_map.removeTribuneServer(ids);
	});
	mapEditor_map.container.on('removeTribune_callback', function (e, obj) {

	});

	mapEditor_map.container.on('removeTribune_callbackFull', function (e, obj) {

	});
	mapEditor_map.removeTribuneServer = function (ids) {
		if (ids.length == 0) return;
		var objects = [];
		for (var k in ids) {
			objects.push({
				tribune_id: ids[k]
			});
		}
		var obj = {
			command: "remove",
			object: scheme + "_tribune",
			event: "remove",
			objects: objects,
			mode: "tribune",
			portion: 100

		};

		mapEditor_map.toSocket(obj);
	};

	mapEditor_map.container.on('setTribune', function (e, obj) {
		mapEditor_map.addToTribune(obj);
	});

	mapEditor_map.addToTribune = function (tribune) {
		var areaGroups = [];
		for (var k in tribune.zones) {
			var zone = tribune.zones[k];
			var o = {
				TRIBUNE_ID: tribune.tribune_id,
				TRIBUNE_NAME: tribune.title
			};
			o['area_group_id'] = zone.zone_id;
			areaGroups.push(o);
		}

		mapEditor_map.container.trigger('modifyAreaGroupTribune', [areaGroups]);
	};

	mapEditor_map.container.on('modifyAreaGroupTribune', function (e, object) {
		mapEditor_map.modifyAreaGroupTribuneServer(object);
	});

	mapEditor_map.modifyAreaGroupTribuneServer = function (data) {
		var obj = {
			command: "operation",
			object: "modify_" + scheme + "_area_group",
			event: "edit",
			mode: "area_group",
			objects: data,
			portion: 100
		};
		mapEditor_map.toSocket(obj);
	};

    /***      AREA GROUP      ***///

    mapEditor_map.container.on('addAreaGroup', function (e, object) {
        mapEditor_map.addAreaGroupServer(object);
    });
    mapEditor_map.container.on('addAreaGroup_callback', function (e, obj) {


    });
    mapEditor_map.container.on('addAreaGroup_callbackFull', function (e, obj) {


    });
    mapEditor_map.addAreaGroupClient = function (object) {
    };

    mapEditor_map.addAreaGroupServer = function (object) {
        if (typeof object !== "object") return;

        var save_obj = {
            NAME: object.title,
            old_id: object.old_id
        };
        save_obj[scheme_id] = environment.id;
        var obj = {
            command: "new",
            object: scheme + "_area_group",
            event: "add",
            mode: "area_group",
            objects: [save_obj],
            portion: 1
        };
        mapEditor_map.toSocket(obj);
    };


    mapEditor_map.container.on('modifyAreaGroup', function (e, object) {
        mapEditor_map.modifyAreaGroupServer(object);
    });
    mapEditor_map.container.on('modifyAreaGroup_callback', function (e, obj) {

    });

    mapEditor_map.container.on('modifyAreaGroup_callbackFull', function (e, obj) {

    });

    mapEditor_map.modifyAreaGroupServer = function (object) {
        if (typeof object !== "object") return;
        var save_obj = {
            AREA_GROUP_ID: object.zone_id,
            NAME: object.title
        };
        var obj = {
            command: "modify",
            object: scheme + "_area_group",
            event: "edit",
            mode: "area_group",
            objects: data,
            portion: 100
        };
        mapEditor_map.toSocket(obj);
    };


    mapEditor_map.container.on('removeAreaGroup', function (e, ids) {
        mapEditor_map.removeAreaGroupServer(ids);
    });
    mapEditor_map.container.on('removeAreaGroup_callback', function (e, obj) {

    });

    mapEditor_map.container.on('removeAreaGroup_callbackFull', function (e, obj) {

    });
    mapEditor_map.removeAreaGroupServer = function (ids) {
        if (ids.length == 0) return;
        var objects = [];
        for (var k in ids) {
            objects.push({
                area_group_id: ids[k]
            });
        }
        var obj = {
            command: "remove",
            object: scheme + "_area_group",
            event: "remove",
            objects: objects,
            mode: "area_group",
            portion: 100

        };

        mapEditor_map.setLayout(function () {
            mapEditor_map.reLoadLayout(function () {
                mapEditor_map.render();
            });
        });
        mapEditor_map.toSocket(obj);
    };

	mapEditor_map.container.on('loadTribune', function (e) {
		mapEditor_map.loadTribune();
	});

	mapEditor_map.container.on('loadTribune_callback', function (e, obj) {

	});

	mapEditor_map.container.on('loadTribune_callbackFull', function (e, obj) {
		mapEditor_map.container.trigger('loadAreaGroup');
	});

	mapEditor_map.loadTribune = function () {
		var o = {
			command: "get",
			object: scheme + "_tribune",
			event: "get",
			mode: "tribune",
			portion: 200,
			params: {
				where: scheme_id + " = " + environment.id
			}
		};
		mapEditor_map.toSocket(o);
	};

    mapEditor_map.container.on('loadAreaGroup', function (e) {
        mapEditor_map.loadAreaGroup();
    });

    mapEditor_map.container.on('loadAreaGroup_callback', function (e, obj) {

    });

    mapEditor_map.container.on('loadAreaGroup_callbackFull', function (e, obj) {
        $(document).trigger('zonesUpdate');
    });


    mapEditor_map.loadAreaGroup = function () {
        var o = {
            command: "get",
            object: scheme + "_area_group",
            event: "get",
            mode: "area_group",
            portion: 200,
            params: {
                where: scheme_id + " = " + environment.id
            }

        };
        mapEditor_map.toSocket(o);

    };

    mapEditor_map.container.on('setAreaGroup', function (e, obj) {
        mapEditor_map.addToAreaGroup(obj);
    });

    mapEditor_map.addToAreaGroup = function (group) {

        var squares = [];
        for (var k in mapEditor_map.selection) {
            var o = {
                AREA_GROUP_ID: group.id,
                AREA_GROUP_NAME: group.title
            };
            o[scheme_items + '_id'] = mapEditor_map.selection[k];
            squares.push(o);
            mapEditor_map.squares[this.selection[k]].areaGroup = group.title;
        }
        mapEditor_map.render();
        mapEditor_map.container.trigger('modifySquare', [squares]);
    };


    /***      END   AREA GROUP      ***///

    mapEditor_map.container.on('setSceneCoors', function (e, obj) {
        mapEditor_map.setSceneCoors(obj);
    });
    mapEditor_map.setSceneCoors = function (obj) {
        if (typeof obj !== "object") {
            console.log('mapEditor_map.setSceneCoors не пришел object');
            return;
        }

        var o = {
            command: "modify",
            object: scheme,
            sid: sid,
            params: {
                scene_info: JSON.stringify(obj)
            }

        };
        o.params[scheme + "_id"] = +environment.id;
        socketQuery(o, function (res) {
            console.log(res);
        });

    };

    /*****    END    ME      ***///


    mapEditor_map.max = 0;
    mapEditor_map.addSquare = function (params) {
        if (typeof params != "object") return;

        var obj = {
            old_id: params.old_id || mapEditor_map.newSquares.length,
            areaGroup: params.areaGroup || "",
            x: params.x || 0,
            y: params.y || 0,
            w: params.w || 40,
            h: params.h || 40,
            line_title: params.line_title || "Ряд",
            line: params.line || "",
            place_title: params.place_title || "Место",
            place: params.place || "",
            salePrice: params.salePrice || "",
            status: params.status || 1,
            textStatus: params.textStatus || "Новое место",
            fundGroup: params.fundGroup || "",
            priceGroup: params.priceGroup || "",
            blocked: params.blocked || "",
            color0: params.color0 || "#fff000",
            color: params.color || "#fff000",
            colorShadow: params.colorShadow || "#c6c2c2",
            colorSelected: params.colorSelected || "#FF0000",
            layer_id: params.layer_id || "",
            object_id: params.object_id || 0,
            object_old_id: params.object_id || 0

        };
        obj.params[scheme + "_id"] = +environment.id;
        mapEditor_map.newSquares.push(obj);
    };


    mapEditor_map.container.on('addSquare', function (e, obj, callback) {


        mapEditor_map.generateSquaresServer(obj, callback);
        /*mapEditor_map.addSquaresClient(obj,function(){
         mapEditor_map.addSquaresServer(mapEditor_map.newSquares,callback);
         });*/
    });


    mapEditor_map.generateSquaresServer = function (params, callback) {
        if (mapEditor_map.loading) return;
        mapEditor_map.loading = true;
        var obj = {
            command: "operation",
            object: "generate_" + scheme + "_items",
            params: {
                x: Math.round((params.x - mapEditor_map.XCoeff) / mapEditor_map.scaleCoeff) || 0,
                y: Math.round((params.y - mapEditor_map.YCoeff) / mapEditor_map.scaleCoeff) || 0,
                w: params.w || 40,
                h: params.h || 40,
                row_count: params.row_count || 1,
                col_count: params.col_count || 1,
                LINE_TITLE: params.line_title || "Ряд",
                LINE: params.line || "",
                PLACE_TITLE: params.place_title || "Место",
                PLACE: params.place || "",
                STATUS: params.Status || 1,
                COLOR: params.color0 || "#fff000"
            },
            sid: sid
        };
        obj.params[scheme_id] = +environment.id;
        obj.params[scheme + '_layer_id'] = params.layer_id || "";
        obj.params[scheme + '_object_id'] = params.object_id || 0;

        //mapEditor_map.toSocket(obj);
        socketQuery(obj, callback);
    };

    mapEditor_map.convertSquaresToBasic = function (squares) {
        squares = squares || mapEditor_map.squares;
        for (var i in squares) {
            squares[i].x_old = squares[i].x;
            squares[i].y_old = squares[i].y;
            squares[i].w_old = squares[i].w;
            squares[i].h_old = squares[i].h;
            squares[i].rotation_old = squares[i].rotation;
            squares[i].x = squares[i].x_orig;
            squares[i].y = squares[i].y_orig;
            squares[i].w = 40;
            squares[i].h = 40;
            squares[i].rotation = 0;
        }
    };
    mapEditor_map.convertSquaresToNormal = function (squares) {
        squares = squares || mapEditor_map.squares;
        for (var i in squares) {
            squares[i].x = squares[i].x_old || squares[i].x;
            squares[i].y = squares[i].y_old || squares[i].y;
            squares[i].w = squares[i].w_old || 40;
            squares[i].h = squares[i].h_old || 40;
            squares[i].rotation = squares[i].rotation_old || 0;
        }
    };
    mapEditor_map.container.on('toOrigModifySquares', function (e) {
        bootbox.dialog({
            message: "ВНИМАНИЕ! При все несохраненные изменения будут потеряны!<br> " +
            "В этом режиме используются альтернативные координаты мест, они существуют для того, " +
            "чтобы вне зависимости от сложности конфигурации схемы, каждую группу мест было легко пронумеровать. " +
            "Также выбранные места всегда можно вернуть в исходные координаты.",
            title: 'Переход в режим "Базовая схема"',
            buttons: {
                ok:{
                    label: 'Перейти к "Базовая схема"',
                    className: "red",
                    callback: function () {
                        delete mapEditor_map.modifedSquares;
                        mapEditor_map.convertSquaresToBasic();
                        mapEditor_map.render();
                        mapEditor_map.reLoadLayout();
                        mapEditor_map.modifedSquaresMode = 'BASIC';
                    }
                },
                cancel:{
                    label: 'Отмена',
                    className: "green",
                    callback: function () {}
                }
            }
        });
    });

    mapEditor_map.container.on('toNormalModifySquares', function (e) {
        bootbox.dialog({
            message: "ВНИМАНИЕ! При все несохраненные изменения будут потеряны!",
            title:'Переход в режим "Нормальная схема"',
            buttons: {
                ok:{
                    label: 'Перейти к "Нормальная схема"',
                    className: "red",
                    callback: function () {
                        delete mapEditor_map.modifedSquares;
                        mapEditor_map.convertSquaresToNormal();
                        mapEditor_map.render();
                        mapEditor_map.reLoadLayout();
                        mapEditor_map.modifedSquaresMode = 'NORMAL';
                    }
                },
                cancel:{
                    label: 'Отмена',
                    className: "green",
                    callback: function () {}
                }
            }
        });
    });

    mapEditor_map.container.on('rollbackModifySquares', function (e, selection) {
        var sel = selection || mapEditor_map.selection;
        var counter = 0;
        for (var i in sel) {
            var finded;
            for (var j in mapEditor_map.modifedSquares) {
                var id = sel[i];
                if ( mapEditor_map.modifedSquares[j][scheme_items + "_id"] == id){
                    finded = true;
                    mapEditor_map.squares[id].x = mapEditor_map.squares[id].x_lastSave || mapEditor_map.squares[id].x;
                    mapEditor_map.squares[id].y = mapEditor_map.squares[id].y_lastSave || mapEditor_map.squares[id].y;
                    break;
                }
            }
            if (finded){
                counter++;
                delete mapEditor_map.modifedSquares[j];
                console.log('mapEditor_map.modifedSquares ДО clear',mapEditor_map.modifedSquares);
                mapEditor_map.clearEmpty(mapEditor_map.modifedSquares);
                console.log('mapEditor_map.modifedSquares После clear',mapEditor_map.modifedSquares);
            }
        }
        if (counter){
            toastr.success('Для '+ counter + 'мест были отменены изменения.')
        }else{
            toastr.info('У выбранных мест нет несохраненных изменений.');
        }
    });



    mapEditor_map.container.on('modifySquare', function (e, squares, doNow) {
        var modifedSquares = mapEditor_map.modifedSquares || [];

        if (mapEditor_map.modifedSquaresMode === "BASIC"){
            var newSquares = [];
            for (var i in squares) {
                var sq = squares[i];
                var newSq = {};
                for (var j in sq) {
                    if (j == "x" || j == "y"){
                        newSq[j+'_original'] = sq[j];
                        continue;
                    }
                    newSq[j] = sq[j];
                }
                newSquares.push(newSq);
            }
            squares = newSquares;
        }

        /*console.log(squares);
        return;*/
        //o[scheme_items + "_id"]

        for (var i in squares) {
            var item1 = squares[i];
            var finded;
            for (var j in modifedSquares) {
                var item2 = modifedSquares[j];
                if (item1[scheme_items + "_id"] == item2[scheme_items + "_id"]){
                    finded = true;
                    for (var i2 in item1) {
                        if (item2[i2]!==item1[i2]) item2[i2] = item1[i2];
                    }
                    break;
                }
            }
            if (!finded) modifedSquares.push(item1);
        }
        console.log('----modifedSquares', modifedSquares);
        mapEditor_map.modifedSquares = modifedSquares;
        if (doNow && modifedSquares.length>0) {
            mapEditor_map.modifySquaresServer(modifedSquares);
            toastr.success('Изменения сохранены для '+ modifedSquares.length + ' мест');
            for (var k in modifedSquares) {
                var item = modifedSquares[k];
                mapEditor_map.squares[item[scheme_items + "_id"]].x_lastSave = item.x || mapEditor_map.squares[item[scheme_items + "_id"]].x_lastSave;
                mapEditor_map.squares[item[scheme_items + "_id"]].y_lastSave = item.y || mapEditor_map.squares[item[scheme_items + "_id"]].y_lastSave;
            }
            delete mapEditor_map.modifedSquares;

        }else if(doNow){
            toastr.info('Нет изменений.');
        }
    });
    mapEditor_map.container.on('modifySquare_callback', function (e, obj) {
    });


    mapEditor_map.container.on('modifySquare_callbackFull', function (e, obj) {

    });

    mapEditor_map.modifySquaresServer = function (squares) {

        //mapEditor_map.loading = true;

        var obj = {
            command: "operation",
            object: "modify_" + scheme + "_item",
            event: "edit",
            objects: squares,
            portion: 100
        };
        mapEditor_map.toSocket(obj);
    };

    mapEditor_map.container.on('setObjectsToSectors', function (e, params) {
        var o = {
            command: 'operation',
            object: 'set_' + scheme + '_object_area_group',
            params: {
                area_group_id_list: params.all.join(",")
            }
        };
        o.params[scheme + "_object_id"] = params.objectId;

        socketQuery(o, function (res) {
            var objectId = params.objectId;
            var layerId = params.layerId;
            var all = params.all;

            socketParse(res, {
                done: function (success) {
                    var i, layer, object;

                    for (i = 0; i < editor.layers.length; i++) {
                        layer = editor.layers[i];
                        if (layer.id == layerId) break;
                    }

                    for (i = 0; i < layer.objects.length; i++) {
                        object = layer.objects[i];
                        if (object.object_id == objectId) {
                            object.area_groups = all;
                            break;
                        }
                    }
                }
            })
        });
    });

    mapEditor_map.container.on('removeSquare', function (e, square_ids) {
        mapEditor_map.removeSquaresServer(square_ids);
        mapEditor_map.removeSquaresClient(square_ids, function () {
            mapEditor_map.container.trigger('removeSquare_callback', [square_ids]);
        });
    });

    mapEditor_map.container.on('removeSquare_callback', function (e, obj) {
        //mapEditor_map.removeSquaresClient(obj.ids);

    });

    mapEditor_map.container.on('removeSquare_callbackFull', function (e, obj) {

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
    mapEditor_map.removeSquaresServer = function (square_ids) {


        if (square_ids.length == 0) return;
        var squares = [];
        for (var k in square_ids) {
            var o = {};
            o[scheme_items+'_id'] = square_ids[k];
            squares.push(o);
        }
        var obj = {
            command: "operation",
            object: "remove_" + scheme + "_item",
            event: "remove",
            objects: squares,
            mode: "squares",
            portion: 1000

        };
        mapEditor_map.toSocket(obj);
    };


    /********______________________LOAD FILE/LAYERS/OBJECTS____________________________________**************************/////


    mapEditor_map.container.on('loadFiles', function (e, obj) {

        mapEditor_map.loadFiles();
    });

    mapEditor_map.container.on('getFiles_callback', function (e, obj) {

    });

    mapEditor_map.container.on('getFiles_callbackFull', function (e, obj) {
        //$(document).trigger('layerUpdate');
    });


    mapEditor_map.loadFiles = function () {
        var o = {
            command: "get",
            object: scheme + "_file_list",
            event: "get",
            mode: "files",
            portion: 500,
            columns: "FILENAME",
            params: {
                where: scheme_id + " = " + environment.id
            }
        };
        mapEditor_map.toSocket(o);
    };

    /**-------------------layers*/

    mapEditor_map.container.on('loadLayer', function (e, params, callback) {
        mapEditor_map.loadLayerServer(params, callback);
    });
    mapEditor_map.loadLayerServer = function (params, callback) {
        var o = {
            command: "get",
            object: scheme + "_layer",
            sid: sid,
            params: {
                where: scheme_id + " = " + environment.id
            }
        };
        o.params[scheme_id] = environment.id;
        socketQuery(o, callback);


    };
////*****--------------------------------------------------------------------------------------------------------**//


    mapEditor_map.container.on('loadObject', function (e, obj, callback) {
        mapEditor_map.loadObjectServer(obj, callback);
    });


    mapEditor_map.container.on('getObject_callbackFull', function (e, obj) {
        $(contentWrapper).trigger('layerUpdate');
    });


    mapEditor_map.loadObjectServer = function (obj, callback) {

        if (typeof obj !== "object") return;

        var o = {
            command: "get",
            object: scheme + "_object",
            sid: sid,
            params: {
                where: ""
            }
        };
        o.params[scheme_id] = environment.id;
        if (obj.type != undefined) o.params.where = "OBJECT_TYPE='" + obj.type + "'";
        if (obj.layer_id != undefined) {
	        if(o.params.where != "") o.params.where += " and";

	        if (obj.layer_id != "isNULL")
		        o.params.where = scheme + "_layer_id=" + obj.layer_id;
	        else
		        o.params.where = scheme + "_layer_id is null";
        }

        //console.log(MB.Core.makeQuery(o));

        socketQuery(o, callback);
    };


    ////*****--------------------------------------------------------------------------------------------------------**//


    mapEditor_map.container.on('loadObjectAreaGroup', function (e, obj, callback) {
        mapEditor_map.loadObjectAreaGroupServer(obj, callback);
    });


    mapEditor_map.loadObjectAreaGroupServer = function (obj, callback) {

        if (typeof obj !== "object") return;
        var o = {
            command: "get",
            object: scheme + "_obj_area_group",
            sid: sid,
            params: {
                where: scheme + "_object_id = " + obj.object_id
            }
        };
        socketQuery(o, callback);
    };

    /********_________________END__LOAD LAYERS/OBJECTS____________________________________**************************/////


    var socketObject = {
        sid: sid,
        type: scheme + "_item",
        param: scheme + "_id",
        id: environment.id,
        portion: 100,
        save: {},
        load: {
            command: "get",
            object: scheme + "_item",
            params: {},
            /*columns:"FUND_ZONE_ITEM_ID,PRICE,STATUS,STATUS_TEXT,FUND_GROUP_NAME,PRICE_GROUP_NAME,BLOCK_COLOR,COLOR",*/
            field_name: scheme_id
        }
    };
    socketObject.load.params[scheme_id] = environment.id;
    var squareO = {
        command: "get",
        object: scheme + "_item",
        sid: sid,
        params: {}
    };
    squareO.params[scheme_id] = environment.id;
    var layerO = {
        command: "get",
        object: scheme + "_layer",
        sid: sid,
        event: "get",
        mode: "layers",
        portion: 100,
        params: {
            where: scheme_id + " = " + environment.id + " and VISIBLE_EDITOR='TRUE'",
            order_by: "SORT_NO"
        }
    };
    layerO.params[scheme_id] = environment.id;
    layerO.params.columns = scheme + '_layer_id';
    objectO = {
        command: "get",
        object: scheme + "_object",
        sid: sid,
        event: "get",
        mode: "objects",
        portion: 100,
        params: {
            where: "VISIBLE_EDITOR='TRUE'",
            columns: scheme + "_object_id,object_type,object_type,rotation,font_family,font_size,font_style,font_wiegh,color,x,y,background_url_scale,background_url_original,background_color",
            order_by: "SORT_NO"
        }
    };
    objectO.params[scheme_id] = environment.id;

    mapEditor_map.openSocket(socketObject, function (room) {
        environment.room = room;
        room += mapEditor_map.contentID;
        socket.on(room + "_add_callback_files", function (obj) {
            mapEditor_map.container.trigger('addFile_callback', [obj]);
        });
        socket.on(room + "_add_callbackFull_files", function (obj) {
            mapEditor_map.container.trigger('addFile_callbackFull', [obj]);

        });
        socket.on(room + "_remove_callback_files", function (obj) {
            mapEditor_map.container.trigger('removeFile_callback', [obj]);
        });
        socket.on(room + "_remove_callbackFull_files", function (obj) {
            mapEditor_map.container.trigger('removeFile_callbackFull', [obj]);
        });


        socket.on(room + "_add_callback_layers", function (obj) {
            mapEditor_map.container.trigger('addLayer_callback', [obj]);
        });
        socket.on(room + "_add_callbackFull_layers", function (obj) {
            mapEditor_map.container.trigger('addLayer_callbackFull', [obj]);

        });
        socket.on(room + "_add_callback_objects", function (obj) {
            mapEditor_map.container.trigger('addObject_callback', [obj]);
        });
        socket.on(room + "_add_callbackFull_objects", function (obj) {
            mapEditor_map.container.trigger('addObject_callbackFull', [obj]);
        });


        socket.on(room + "_add_callback_squares", function (obj) {
            mapEditor_map.container.trigger('addSquare_callback', [obj]);
        });
        socket.on(room + "_add_callbackFull_squares", function (obj) {
            mapEditor_map.container.trigger('addSquare_callbackFull', [obj]);

        });
        socket.on(room + "_edit_callback_squares", function (obj) {
            mapEditor_map.container.trigger('modifySquare_callback', [obj]);
        });
        socket.on(room + "_edit_callbackFull_squares", function (obj) {
            mapEditor_map.container.trigger('modifySquare_callbackFull', [obj]);
        });
        socket.on(room + "_remove_callback_squares", function (obj) {
            mapEditor_map.container.trigger('removeSquare_callback', [obj]);
        });
        socket.on(room + "_remove_callbackFull_squares", function (obj) {
            mapEditor_map.container.trigger('removeSquare_callbackFull', [obj]);
        });

        socket.on(room + "_add_callback_area_group", function (obj) {
            mapEditor_map.container.trigger('addAreaGroup_callback', [obj]);
        });
        socket.on(room + "_add_callbackFull_area_group", function (obj) {
            mapEditor_map.container.trigger('addAreaGroup_callbackFull', [obj]);

        });
        socket.on(room + "_edit_callback_area_group", function (obj) {
            mapEditor_map.container.trigger('modifyAreaGroup_callback', [obj]);
        });
        socket.on(room + "_edit_callbackFull_area_group", function (obj) {
            mapEditor_map.container.trigger('modifyAreaGroup_callbackFull', [obj]);
        });
        socket.on(room + "_remove_callback_area_group", function (obj) {
            mapEditor_map.container.trigger('removeAreaGroup_callback', [obj]);
        });
        socket.on(room + "_remove_callbackFull_area_group", function (obj) {
            mapEditor_map.container.trigger('removeAreaGroup_callbackFull', [obj]);
        });


	    socket.on(room + "_add_callback_tribune", function (obj) {
		    mapEditor_map.container.trigger('addTribune_callback', [obj]);
	    });
	    socket.on(room + "_add_callbackFull_tribune", function (obj) {
		    mapEditor_map.container.trigger('addTribune_callbackFull', [obj]);
	    });
	    socket.on(room + "_remove_callback_tribune", function (obj) {
		    mapEditor_map.container.trigger('removeTribune_callback', [obj]);
	    });
	    socket.on(room + "_remove_callbackFull_tribune", function (obj) {
		    mapEditor_map.container.trigger('removeTribune_callbackFull', [obj]);
	    });
	    socket.on(room + "_get_callback_tribune", function (obj) {
		    mapEditor_map.container.trigger('loadTribune_callback', [obj]);
	    });
	    socket.on(room + "_get_callbackFull_tribune", function (obj) {
		    mapEditor_map.container.trigger('loadTribune_callbackFull', [obj]);
	    });
        socket.on(room + "_get_callback_area_group", function (obj) {
            mapEditor_map.container.trigger('loadAreaGroup_callback', [obj]);
        });
        socket.on(room + "_get_callbackFull_area_group", function (obj) {
            mapEditor_map.container.trigger('loadAreaGroup_callbackFull', [obj]);
        });


        socket.on(room + "_edit_callback", function (obj) {
        });
        socket.on(room + "_edit_callbackFull", function (obj) {
            mapEditor_map.loading = false;
        });
        socket.on(room + "_remove_callback", function (obj) {
            mapEditor_map.loading = false;
        });


        /* socket.on(room+"_add_callback_layers",function(obj){
         mapEditor_map.container.trigger("add_layer_callback",[obj]);

         });
         socket.on(room+"_add_callbackFull_layers",function(obj){
         log(obj);
         log('_add_callbackFull_layers');
         });*/
        socket.on(room + "_remove_callback_layers", function (obj) {

        });

        socket.on(room + "add_object_callback", function (obj) {
            mapEditor_map.container.trigger("add_object_callback", [obj]);
        });

        //add_object_callback


        socket.on(room + "_get_callback_files", function (obj) {
            mapEditor_map.container.trigger('getFiles_callback', [obj]);
        });
        socket.on(room + "_get_callbackFull_files", function (obj) {
            mapEditor_map.container.trigger('getFiles_callbackFull', [obj]);

        });


        socket.on(room + "_get_callback_layers", function (obj) {
            mapEditor_map.container.trigger('getLayer_callback', [obj]);
        });
        socket.on(room + "_get_callbackFull_layers", function (obj) {
            mapEditor_map.container.trigger('getLayer_callbackFull', [obj]);

        });
        socket.on(room + "_get_callback_objects", function (obj) {
            mapEditor_map.container.trigger('getObject_callback', [obj]);
        });
        socket.on(room + "_get_callbackFull_objects", function (obj) {
            mapEditor_map.container.trigger('getObject_callbackFull', [obj]);
        });

    });


//remove_all_scheme_items
    mapEditor_map.removeAll = function () {
        bootbox.dialog({
            message: "Удалить все места",
            title: "",
            buttons: {
                ok: {
                    label: "Ок",
                    className: "red",
                    callback: function () {
                        var o = {
                            command: "operation",
                            object: "remove_all_scheme_items",
                            sid: sid,
                            params: {}
                        };
                        o.params[scheme + "_id"] = environment.id;
                        MB.Core.sendQuery(o, function (data) {
                            if (data.RC == 0) {
                                mapEditor_map.squares = [];
                                mapEditor_map.setLayout();
                                mapEditor_map.render();
                            } else {
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
                    className: "green"
                }
            }
        });
    };


    /******Работа с местами******/

    mapEditor_map.xSelection = [];
    mapEditor_map.ySelection = [];
    mapEditor_map.minXSelection = 0;
    mapEditor_map.minYSelection = 0;
    mapEditor_map.maxXSelection = 0;
    mapEditor_map.maxYSelection = 0;


    mapEditor_map.editorMode = "squares";
    mapEditor_map.container.on('mousedown_1_', function (e, x, y) {
        switch (mapEditor_map.editorMode) {
            case "squares":

                //mapEditor_map.container.trigger("squares_select",[x,y]);
                break;
            case "transform_object_prepare":
                var elem = mapEditor_map.mouseOnSpecialObject(x, y);
                if (elem) {
                    mapEditor_map.transform_object = elem.object;
                    mapEditor_map.editorMode = "transform_object";
                }
                break;


        }

        //var obj = editor.getSelectedObjects()[0];
        //mapEditor_map.scaleObject(x,y,obj);
        //mapEditor_map.container.trigger("squares_select",[x,y]);
    });

    mapEditor_map.container.on('mousedown_3_', function (e, x, y) {
        switch (mapEditor_map.editorMode) {
            case "squares":
                mapEditor_map.container.trigger("squares_deselect", [x, y]);
                break;
            case "transform_object_prepare":

                break;

        }

        //var obj = editor.getSelectedObjects()[0];
        //mapEditor_map.scaleObject(x,y,obj);
        //mapEditor_map.container.trigger("squares_select",[x,y]);
    });
    mapEditor_map.transform_object = false;
    mapEditor_map.container.on('mousemove_1_', function (e, x, y) {
        switch (mapEditor_map.editorMode) {
            case "squares":
                mapEditor_map.container.trigger("squares_select", [x, y]);

                break;
            case "transform_object":
                if (typeof mapEditor_map.transform_object != "object") break;
                mapEditor_map.container.trigger("transform_object", [x, y, mapEditor_map.transform_object]);
                break;
            case "rotate_object":
                mapEditor_map.container.trigger("rotate_object", [x, y]);
                break;
            case "transform_object_prepare":
                var elem = mapEditor_map.mouseOnSpecialObject(x, y);
                if (elem) {
                    mapEditor_map.transform_object = elem.object;
                    mapEditor_map.editorMode = "transform_object";
                    break;
                }
                elem = mapEditor_map.mouseOnObject(x, y);
                if (elem) {
                    mapEditor_map.container.trigger("move_object", [x, y, [elem]]);
                    break;
                }
                mapEditor_map.transform_object = editor.getSelectedObjects()[0];
                mapEditor_map.editorMode = "rotate_object";
                break;
            default:
                mapEditor_map.container.trigger("squares_select", [x, y]);

                break;


        }
    });
    mapEditor_map.container.on('mousemove_3_', function (e, x, y) {
        mapEditor_map.container.trigger("squares_deselect", [x, y]);
    });

    mapEditor_map.container.on('mousemove_1_17', function (e, x, y) {

        switch (mapEditor_map.editorMode) {
            case "squares":
                mapEditor_map.container.trigger("move_squares", [x, y, mapEditor_map.selection]);
                break;
            case "transform_object":
                mapEditor_map.container.trigger("move_object", [x, y]);
                break;
            case "transform_object_prepare":
                mapEditor_map.container.trigger("move_object", [x, y]);

                break;
            default:
                mapEditor_map.container.trigger("move_squares", [x, y, mapEditor_map.selection]);
                mapEditor_map.container.trigger("move_object", [x, y]);
                break;
        }


    });
    mapEditor_map.container.on('mousemove_1_32', function (e, x, y) {
        mapEditor_map.container.trigger("move_map", [x, y]);
    });
    mapEditor_map.container.on('mousedown_1_17', function (e, x, y) {
        mapEditor_map.container.trigger("move_squares", [x, y, mapEditor_map.selection]);
        mapEditor_map.container.trigger("move_object", [x, y]);
    });

    mapEditor_map.container.on('mouseup_1_', function (e, x, y) {
        switch (mapEditor_map.editorMode) {
            case "squares":
                break;
            case "transform_object":

                mapEditor_map.container.trigger("transform_object_end", [mapEditor_map.transform_object]);
                mapEditor_map.transform_object = false;
                mapEditor_map.editorMode = "transform_object_prepare";
                break;
            case "rotate_object":
                mapEditor_map.container.trigger("transform_object_end", [mapEditor_map.transform_object]);
                var abscissa = mapEditor_map.specialObjects.getByName("abscissa" + mapEditor_map.transform_object.object_id);
                var arc1 = mapEditor_map.specialObjects.getByName("arc" + mapEditor_map.transform_object.object_id);
                arc1.visible = false;
                abscissa.visible = false;
                mapEditor_map.editorMode = "transform_object_prepare";
                break;


        }
    });
    mapEditor_map.container.on('mouseup_1_17', function (e, x, y) {
        mapEditor_map.container.trigger("move_squares_end");
        mapEditor_map.container.trigger("move_object_end");
    });
    mapEditor_map.container.on('mouseup_3_16', function (e, x, y) {
        mapEditor_map.container.trigger("select_stop", [x, y, "remove", function () {
        }]);
    });
    mapEditor_map.container.on('keyup_1_17', function (e) {
        mapEditor_map.container.trigger("move_squares_end");
        mapEditor_map.container.trigger("move_object_end");
    });

    $(document).on('keyup', function (e) {
        if (e.which >= 37 && e.which <= 40) {
            return;
        }
        if (mapEditor_map.container.squareMoving) {
            mapEditor_map.container.trigger("move_squares_end");
            mapEditor_map.container.trigger("move_object_end");
            delete mapEditor_map.container.squareMoving;
            mapEditor_map.container.attr("tabindex", "1").focus();
        }
    });
    $("body").keydown(function (e) {
        switch (e.which) {

            case 39:

                switch (mapEditor_map.shiftState) {
                    case 16:
                        mapEditor_map.xScale(5);
                        mapEditor_map.container.squareMoving = true;
                        break;
                    case 17:
                        mapEditor_map.container.trigger("move_squares", [mapEditor_map.downX + 5 * mapEditor_map.scaleCoeff, mapEditor_map.downY, mapEditor_map.selection]);
                        mapEditor_map.container.trigger("move_object", [mapEditor_map.downX + 5 * mapEditor_map.scaleCoeff, mapEditor_map.downY]);
                        mapEditor_map.container.squareMoving = true;
                        break;
                }
                break;
            case 37:
                switch (mapEditor_map.shiftState) {
                    case 16:
                        mapEditor_map.xScale(-5);
                        mapEditor_map.container.squareMoving = true;
                        break;
                    case 17:
                        mapEditor_map.container.trigger("move_squares", [mapEditor_map.downX - 5 * mapEditor_map.scaleCoeff, mapEditor_map.downY, mapEditor_map.selection]);
                        mapEditor_map.container.trigger("move_object", [mapEditor_map.downX - 5 * mapEditor_map.scaleCoeff, mapEditor_map.downY]);
                        mapEditor_map.container.squareMoving = true;
                        break;
                }
                break;
            case 38:
                switch (mapEditor_map.shiftState) {
                    case 16:
                        mapEditor_map.yScale(-5);
                        mapEditor_map.container.squareMoving = true;
                        break;
                    case 17:
                        mapEditor_map.container.trigger("move_squares", [mapEditor_map.downX, mapEditor_map.downY - 5 * mapEditor_map.scaleCoeff, mapEditor_map.selection]);
                        mapEditor_map.container.trigger("move_object", [mapEditor_map.downX, mapEditor_map.downY - 5 * mapEditor_map.scaleCoeff]);
                        mapEditor_map.container.squareMoving = true;
                        break;
                }
                break;
            case 40:
                switch (mapEditor_map.shiftState) {
                    case 16:
                        mapEditor_map.yScale(5);
                        mapEditor_map.container.squareMoving = true;
                        break;
                    case 17:
                        mapEditor_map.container.trigger("move_squares", [mapEditor_map.downX, mapEditor_map.downY + 5 * mapEditor_map.scaleCoeff, mapEditor_map.selection]);
                        mapEditor_map.container.trigger("move_object", [mapEditor_map.downX, mapEditor_map.downY + 5 * mapEditor_map.scaleCoeff]);
                        mapEditor_map.container.squareMoving = true;
                        break;
                }
                break;
            case 27:
                mapEditor_map.clearSelection(true);
                mapEditor_map.render();
                mapEditor_map.fixX = false;
                mapEditor_map.fixY = false;
                break;
            case 88:
                mapEditor_map.fixX = true;
                mapEditor_map.fixY = false;
                break;
            case 89:
                mapEditor_map.fixX = false;
                mapEditor_map.fixY = true;
                break;
            case 81:
                mapEditor_map.fixX = false;
                mapEditor_map.fixY = false;
                break;

        }

    });


    mapEditor_map.container.on('move_squares', function (e, x, y, squares) {
        mapEditor_map.moveSquares(x, y, squares, function () {
            mapEditor_map.moving = true;
            mapEditor_map.render();
        });
    });

    mapEditor_map.container.on('move_squares_end', function (e) {
        var obj = [];
        for (var i in mapEditor_map.selection) {
            var o = {
                x: mapEditor_map.roundPlus(mapEditor_map.squares[mapEditor_map.selection[i]].x,4),
                y: mapEditor_map.roundPlus(mapEditor_map.squares[mapEditor_map.selection[i]].y,4)
            };
            o[scheme_items + "_id"] = mapEditor_map.squares[mapEditor_map.selection[i]].id;
            obj.push(o);
        }
        mapEditor_map.moving = false;
        mapEditor_map.render();
        mapEditor_map.reLoadLayout(function () {
            mapEditor_map.container.trigger('modifySquare', [obj]);
        });
    });

    mapEditor_map.container.on('move_object', function (e, x, y, objects) {
        var objs = objects || editor.getSelectedObjects();
        mapEditor_map.moveObjects(x, y, objs, function () {
            mapEditor_map.render();
        });
    });

    mapEditor_map.container.on('move_object_end', function (e, objects) {
        var objs = objects || editor.getSelectedObjects();
        var toModify = [];
        for (var k in objs) {
            var o = {
                X: objs[k].x,
                Y: objs[k].y
            };
            o[scheme + "_object_id"] = objs[k].object_id;
            toModify.push(o);
        }
        mapEditor_map.container.trigger("modifyObject", [toModify]);
    });
    mapEditor_map.container.on('transform_squares_start', function (e, object) {
        if (typeof object !== "object") return;
        switch (object.type) {
            default:
                if (typeof object.value != "object") return;
                var x = object.x;
                var y = object.y;
                mapEditor_map.specialObjects.addItem({
                    type: "line",
                    x1: 0,
                    y1: -16,
                    x2: +object.value.width,
                    y2: -16,
                    color1: "#00f",
                    object: object
                });
                mapEditor_map.specialObjects.addItem({
                    type: "line",
                    x1: +object.value.width + 16,
                    y1: 0,
                    x2: +object.value.width + 16,
                    y2: +object.value.height,
                    color1: "#00f",
                    object: object
                });
                mapEditor_map.specialObjects.addItem({
                    type: "line",
                    x1: +object.value.width,
                    y1: +object.value.height + 16,
                    x2: 0,
                    y2: +object.value.height + 16,
                    color0: "#00f",
                    object: object
                });
                mapEditor_map.specialObjects.addItem({
                    type: "line",
                    x1: -16,
                    y1: +object.value.height,
                    x2: -16,
                    y2: 0,
                    color1: "#00f",
                    object: object
                });


                mapEditor_map.specialObjects.addItem({
                    type: "point",
                    x1: -16,
                    y1: -16,
                    object: object
                });
                mapEditor_map.specialObjects.addItem({
                    type: "point",
                    x1: +object.value.width + 16,
                    y1: -16,
                    object: object
                });
                mapEditor_map.specialObjects.addItem({
                    type: "point",
                    x1: +object.value.width + 16,
                    y1: +object.value.height + 16,
                    color1: "#417cd3",
                    active: true,
                    object: object
                });
                mapEditor_map.specialObjects.addItem({
                    type: "point",
                    x1: -16,
                    y1: +object.value.height + 16,
                    object: object

                });
                mapEditor_map.specialObjects.addItem({
                    type: "point",
                    name: "center_point" + object.object_id,
                    x1: +object.value.width / 2,
                    y1: +object.value.height / 2,
                    object: object,
                    pointLineWidth: 2,
                    w: 6,
                    h: 6
                });

                /* //// for rotation

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
                 */
                break;
        }


        mapEditor_map.render();
        mapEditor_map.editorMode = "transform_squares_prepare";
    });

    mapEditor_map.container.on('transform_object_start', function (e, object) {
        if (typeof object !== "object") return;
        switch (object.type) {
            case 4:
                /*var x = object.x;
                 var y = object.y;*/
                mapEditor_map.specialObjects.addItem({
                    type: "point",
                    x1: 0,
                    y1: 0,
                    color1: "#417cd3",
                    active: true,
                    object: object
                });
                break;
            default:
                if (typeof object.value != "object") return;
                var x = object.x;
                var y = object.y;
                mapEditor_map.specialObjects.addItem({
                    type: "line",
                    x1: 0,
                    y1: -16,
                    x2: +object.value.width,
                    y2: -16,
                    color1: "#00f",
                    object: object
                });
                mapEditor_map.specialObjects.addItem({
                    type: "line",
                    x1: +object.value.width + 16,
                    y1: 0,
                    x2: +object.value.width + 16,
                    y2: +object.value.height,
                    color1: "#00f",
                    object: object
                });
                mapEditor_map.specialObjects.addItem({
                    type: "line",
                    x1: +object.value.width,
                    y1: +object.value.height + 16,
                    x2: 0,
                    y2: +object.value.height + 16,
                    color0: "#00f",
                    object: object
                });
                mapEditor_map.specialObjects.addItem({
                    type: "line",
                    x1: -16,
                    y1: +object.value.height,
                    x2: -16,
                    y2: 0,
                    color1: "#00f",
                    object: object
                });


                mapEditor_map.specialObjects.addItem({
                    type: "point",
                    x1: -16,
                    y1: -16,
                    object: object
                });
                mapEditor_map.specialObjects.addItem({
                    type: "point",
                    x1: +object.value.width + 16,
                    y1: -16,
                    object: object
                });
                mapEditor_map.specialObjects.addItem({
                    type: "point",
                    x1: +object.value.width + 16,
                    y1: +object.value.height + 16,
                    color1: "#417cd3",
                    active: true,
                    object: object
                });
                mapEditor_map.specialObjects.addItem({
                    type: "point",
                    x1: -16,
                    y1: +object.value.height + 16,
                    object: object

                });
                mapEditor_map.specialObjects.addItem({
                    type: "point",
                    name: "center_point" + object.object_id,
                    x1: +object.value.width / 2,
                    y1: +object.value.height / 2,
                    object: object,
                    pointLineWidth: 2,
                    w: 6,
                    h: 6
                });

                //// for rotation

                mapEditor_map.specialObjects.addItem({
                    type: "point",
                    name: "rotation_move_point" + object.object_id,
                    x1: +object.value.width / 2,
                    y1: +object.value.height / 2,
                    object: object,
                    pointLineWidth: 2,
                    w: 6,
                    h: 6,
                    visible: false
                });
                mapEditor_map.specialObjects.addItem({
                    type: "line",
                    name: "rotation_vector" + object.object_id,
                    x1: +object.value.width / 2,
                    y1: +object.value.height / 2,
                    x2: +object.value.width + 10,
                    y2: +object.value.height / 2,
                    object: object,
                    pointLineWidth: 2,
                    w: 6,
                    h: 6,
                    visible: false,
                    color1: "#000"
                });
                mapEditor_map.specialObjects.addItem({
                    type: "line",
                    name: "abscissa" + object.object_id,
                    x1: +object.value.width / 2,
                    y1: +object.value.height / 2,
                    x2: +object.value.width + 300,
                    y2: +object.value.height / 2,
                    object: object,
                    pointLineWidth: 2,
                    w: 6,
                    h: 6,
                    visible: false,
                    color1: "#000"
                });
                mapEditor_map.specialObjects.addItem({
                    type: "arc",
                    name: "arc" + object.object_id,
                    x1: +object.value.width / 2,
                    y1: +object.value.height / 2,
                    r: 250,
                    angle1: 0,
                    angle2: 0,
                    object: object,
                    pointLineWidth: 2,
                    w: 6,
                    h: 6,
                    visible: false,
                    color1: "#F00"
                });

                break;
        }


        mapEditor_map.render();
        mapEditor_map.editorMode = "transform_object_prepare";
    });
    mapEditor_map.container.on('transform_object', function (e, x, y, object) {
        mapEditor_map.scaleObject(x, y, object);
    });

    mapEditor_map.container.on('transform_object_end', function (e, object) {
        mapEditor_map.moving = false;
        mapEditor_map.render();
        var o = {
            SCALE: object.scaleCoeff,
            ROTATION: object.rotation
        };
        o[scheme + "_object_id"] = object.object_id;
        mapEditor_map.container.trigger("modifyObject", [[o]]);
    });

    mapEditor_map.container.on('rotate_object', function (e, x, y, object) {
        var obj = object || editor.getSelectedObjects()[0];
        mapEditor_map.rotateObject(x, y, obj);
    });

    mapEditor_map.scaleObject = function (x, y, object, callback) {
        if (typeof object !== "object") return;
        if (object.type != 1 && object.type != 2 || typeof object.value != "object") return;
        var w = object.value.width;
        var h = object.value.height;
        var c = Math.sqrt(w * w + h * h);
        var W = ((x - mapEditor_map.XCoeff) / mapEditor_map.scaleCoeff) - object.x;
        var H = ((y - mapEditor_map.YCoeff) / mapEditor_map.scaleCoeff) - object.y;
        var delta = Math.sqrt(W * W + H * H);
        object.scaleCoeff = delta / c;

        mapEditor_map.moving = true;
        mapEditor_map.render();
        if (typeof callback == "function") {
            callback();
        }

    };

    mapEditor_map.rotateObject = function (x, y, object, callback) {
        if (typeof object !== "object") return;
        mapEditor_map.moving = true;
        switch (object.type) {
            case 1:
                if (typeof object.value != "object") return;
                var centerX = +object.x + object.value.width * (+object.scaleCoeff) / 2;
                var centerY = +object.y + object.value.height * (+object.scaleCoeff) / 2;
                var a = (y - mapEditor_map.YCoeff) / mapEditor_map.scaleCoeff - centerY;
                var b = (x - mapEditor_map.XCoeff) / mapEditor_map.scaleCoeff - centerX;
                var c = Math.sqrt(a * a + b * b);
                var angle = Math.asin(a / c);
                var quarter = 1;
                object.rotation = angle;
                if ((x - mapEditor_map.XCoeff) / mapEditor_map.scaleCoeff <= centerX && (y - mapEditor_map.YCoeff) / mapEditor_map.scaleCoeff <= centerY) {
                    quarter = 2;
                    object.rotation = -angle - Math.PI;
                }
                else if ((x - mapEditor_map.XCoeff) / mapEditor_map.scaleCoeff <= centerX && (y - mapEditor_map.YCoeff) / mapEditor_map.scaleCoeff > centerY) {
                    quarter = 3;
                    object.rotation = -angle + Math.PI;
                }

                var abscissa = mapEditor_map.specialObjects.getByName("abscissa" + object.object_id);
                var arc1 = mapEditor_map.specialObjects.getByName("arc" + object.object_id);
                arc1.visible = true;
                abscissa.visible = true;
                arc1.angle2 = object.rotation;
                //object.rotation = angle+(90*quarter-1)*Math.PI/180;
                mapEditor_map.render();


                break;
            case 2:
                if (typeof object.value != "object") return;
                var centerX = +object.x + object.value.width * (+object.scaleCoeff) / 2;
                var centerY = +object.y + object.value.height * (+object.scaleCoeff) / 2;
                var a = (y - mapEditor_map.YCoeff) / mapEditor_map.scaleCoeff - centerY;
                var b = (x - mapEditor_map.XCoeff) / mapEditor_map.scaleCoeff - centerX;
                var c = Math.sqrt(a * a + b * b);
                var angle = Math.asin(a / c);
                var quarter = 1;
                object.rotation = angle;
                if ((x - mapEditor_map.XCoeff) / mapEditor_map.scaleCoeff <= centerX && (y - mapEditor_map.YCoeff) / mapEditor_map.scaleCoeff <= centerY) {
                    quarter = 2;
                    object.rotation = -angle - Math.PI;
                }
                else if ((x - mapEditor_map.XCoeff) / mapEditor_map.scaleCoeff <= centerX && (y - mapEditor_map.YCoeff) / mapEditor_map.scaleCoeff > centerY) {
                    quarter = 3;
                    object.rotation = -angle + Math.PI;
                }

                var abscissa = mapEditor_map.specialObjects.getByName("abscissa" + object.object_id);
                var arc1 = mapEditor_map.specialObjects.getByName("arc" + object.object_id);
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
                var a = (y - mapEditor_map.YCoeff) / mapEditor_map.scaleCoeff - centerY;
                var b = (x - mapEditor_map.XCoeff) / mapEditor_map.scaleCoeff - centerX;
                var c = Math.sqrt(a * a + b * b);
                var angle = Math.asin(a / c);
                var quarter = 1;
                object.rotation = angle;
                if ((x - mapEditor_map.XCoeff) / mapEditor_map.scaleCoeff <= centerX && (y - mapEditor_map.YCoeff) / mapEditor_map.scaleCoeff <= centerY) {
                    quarter = 2;
                    object.rotation = -angle - Math.PI;
                }
                else if ((x - mapEditor_map.XCoeff) / mapEditor_map.scaleCoeff <= centerX && (y - mapEditor_map.YCoeff) / mapEditor_map.scaleCoeff > centerY) {
                    quarter = 3;
                    object.rotation = -angle + Math.PI;
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
        }
        ;

        //
        mapEditor_map.render();
        if (typeof callback == "function") {
            callback();
        }
    };


    mapEditor_map.moveObjects = function (x, y, objects, callback) {
        var dX = (x - mapEditor_map.downX_obj) / mapEditor_map.scaleCoeff;
        var dY = (y - mapEditor_map.downY_obj) / mapEditor_map.scaleCoeff;
        for (var k in objects) {
            var obj = objects[k];
            if (!obj.visibility.visible_editor) continue;
            var Xnew = +obj.x + dX;
            var Ynew = +obj.y + dY;
            obj.x = +Xnew;
            obj.y = +Ynew;
        }
        mapEditor_map.downX_obj = x;
        mapEditor_map.downY_obj = y;
        if (typeof callback == "function") {
            callback();
        }

    };


    mapEditor_map.moveSquares = function (x, y, group, callback) {
        var dX = (mapEditor_map.fixX) ? 0 : (x - mapEditor_map.downX) / mapEditor_map.scaleCoeff;
        var dY = (mapEditor_map.fixY) ? 0 : (y - mapEditor_map.downY) / mapEditor_map.scaleCoeff;
        for (var k in group) {
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
        if (typeof callback == "function") {
            callback();
        }

    };

    mapEditor_map.container.on('setSquaresSize', function (e, obj) {
        mapEditor_map.setSquaresSize(obj);
    });

    mapEditor_map.setSquaresSize = function (params) {
        if (typeof params === undefined) return;
        if (mapEditor_map.countSelection() == 0) return toastr.info("Не выбрано ни одного места");
        var sel = params.selection || mapEditor_map.selection;
        var w = params.w || 40;
        var h = params.h || 40;
        var sq = [];
        for (var i in sel) {
            var square = mapEditor_map.squares[sel[i]];
            square.w = w;
            square.h = h;
            var o = {
                w: w,
                h: h
            };
            o[scheme_items + "_id"] = square.id;
            sq.push(o);
        }
        mapEditor_map.render();
        mapEditor_map.container.trigger('modifySquare', [sq]);
    };

    mapEditor_map.container.on('setLinePlaceTitle', function (e, obj) {
        mapEditor_map.setLinePlaceTitle(obj);
    });

    mapEditor_map.setLinePlaceTitle = function (params) {
        if (typeof params === undefined) return;
        if (mapEditor_map.countSelection() == 0) return toastr.info("Не выбрано ни одного места");
        var sel = params.selection || mapEditor_map.selection;
        var line_title = params.line_title || 'Ряд';
        var place_title = params.place_title || 'Место';
        var sq = [];
        for (var i in sel) {
            var square = mapEditor_map.squares[sel[i]];
            square.line_title = line_title;
            square.place_title = place_title;
            var o = {
                line_title: line_title,
                place_title: place_title
            };
            o[scheme_items + "_id"] = square.id;
            sq.push(o);
        }
        mapEditor_map.render();
        mapEditor_map.container.trigger('modifySquare', [sq]);
    };

//mapEditor_map.container.trigger('fillNumbers',[obj]);
    mapEditor_map.container.on('fillNumbers', function (e, obj) {
        mapEditor_map.fillNumbers(obj);
    });


    mapEditor_map.fillNumbers = function (params) {
        if (typeof params === undefined) return;
        var xReverse = +params.xReverse || 0;
        var yReverse = +params.yReverse || 0;
        var line_start = (!isNaN(+params.line_start)) ? +params.line_start : 1;
        var place_start = (!isNaN(+params.place_start)) ? +params.place_start : 1;
        /* var line_start = +params.line_start || 1;
         var place_start = +params.place_start || 1;*/
        var line_fix = params.line_fix || undefined;
        var place_fix = params.place_fix || undefined;
        var invert_line_place = +params.invert_line_place || 0;
        if (mapEditor_map.countSelection() == 0) {
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
        if (line_fix) {
            obj = [];
            obj[+line_fix - 1] = mapEditor_map.selection.sort(function (a, b) {
                if (mapEditor_map.squares[a].x < mapEditor_map.squares[b].x) return -1;
                if (mapEditor_map.squares[a].x > mapEditor_map.squares[b].x) return 1;
                return 0;
            });
        }

        if (yReverse) obj.reverse();
        //var line = (+$("#one_row").val()>0) ? $("#one_row").val() : 1;
        /*var line = line_start;
         var place = place_start;*/
        var sq = [];
        var line = (line_fix) ? +line_fix : line_start;
        var place = (place_fix) ? +place_fix : place_start;
        for (var r in obj) {
            if (place_fix) {
                obj[r] = mapEditor_map.selection.sort(function (a, b) {
                    if (mapEditor_map.squares[a].y < mapEditor_map.squares[b].y) return -1;
                    if (mapEditor_map.squares[a].y > mapEditor_map.squares[b].y) return 1;
                    return 0;
                });
            }

            line = (line_fix) ? +line_fix : line;
            place = (place_fix) ? +place_fix : place_start;
            if (xReverse) obj[r].reverse();
            for (var p in obj[r]) {
                line = (line_fix) ? line_fix : line;
                place = (place_fix) ? place_fix : place;
                mapEditor_map.squares[obj[r][p]].line = line;
                mapEditor_map.squares[obj[r][p]].place = String(place);
                var o = {
                    line_title: params.line_title,
                    place_title: params.place_title,
                    line: line,
                    place: String(place)
                };
                o[scheme_items + "_id"] = mapEditor_map.squares[obj[r][p]].id;
                sq.push(o);

                place++;
            }
            line++;
        }
        mapEditor_map.render();
        mapEditor_map.container.trigger('modifySquare', [sq]);
    };


    mapEditor_map.container.on('xScale', function (e, dx) {
        mapEditor_map.xScale(dx);

    });
    mapEditor_map.container.on('yScale', function (e, dy) {
        mapEditor_map.yScale(dy);

    });


    mapEditor_map.xScale = function (dX, obj) {
        if (typeof obj!='object') obj = {};
        selection = obj.selection || mapEditor_map.selection;
        if (selection.length<2) return;
        mapEditor_map.moving = true;
        var sq = [];
        //var minX = mapEditor_map.squares[selection[0]].x;
        var minX = 1000000;
        for (var k in selection) {
            if (mapEditor_map.squares[selection[k]].x < minX) minX = mapEditor_map.squares[selection[k]].x;
        }
        var maxX = -10000;
        for (var k in selection) {
            if (mapEditor_map.squares[selection[k]].x > maxX) maxX = mapEditor_map.squares[selection[k]].x;
        }
        if (minX == maxX) return;
        var scaleCoeff = (maxX - minX + dX) / (maxX - minX);
        for (var k0 in selection) {
            var delta = (mapEditor_map.squares[selection[k0]].x - minX) * scaleCoeff;
            mapEditor_map.squares[selection[k0]].x = minX + delta;
        }

        if (!obj.doNotRender) mapEditor_map.render();

    };
    mapEditor_map.yScale = function (dY, obj) {
        if (typeof obj!='object') obj = {};
        selection = obj.selection || mapEditor_map.selection;
        if (selection.length<2) return;
        mapEditor_map.moving = true;
        var sq = [];
        //var minY = mapEditor_map.squares[selection[0]].y;
        var minY = 1000000;
        for (var k in selection) {
            if (mapEditor_map.squares[selection[k]].y < minY) minY = mapEditor_map.squares[selection[k]].y;
        }
        var maxY = -10000;
        if (minY == maxY) return;
        for (var k in selection) {
            if (mapEditor_map.squares[selection[k]].y > maxY) maxY = mapEditor_map.squares[selection[k]].y;
        }
        var scaleCoeff = (maxY - minY + dY) / (maxY - minY);
        for (var k0 in selection) {
            var delta = (mapEditor_map.squares[selection[k0]].y - minY) * scaleCoeff;
            mapEditor_map.squares[selection[k0]].y = minY + delta;
        }
        if (!obj.doNotRender) mapEditor_map.render();
    };

    /*
     * mapEditor_map.container.trigger('copySelection',[{x:288}]);
     * */


    mapEditor_map.container.on('flipHorizontal', function (e, obj) {
        mapEditor_map.flipHorizontal(obj);
    });

    mapEditor_map.container.on('flipVertical', function (e, obj) {
        mapEditor_map.flipVertical(obj);
    });

    mapEditor_map.container.on('copySelection', function (e, obj) {
        mapEditor_map.copySelection(obj);
    });
    mapEditor_map.container.on('rotateSelection', function (e, alpha) {
        mapEditor_map.rotateSelection(alpha);
    });

    mapEditor_map.updatePlaceGroupPosition = function (obj) {
        if (typeof obj !== 'object') {
            obj = {};
        }
        var selection = mapEditor_map.selection;
        if (selection.length == 0 /*|| selection.length > 2000*/) {
            console.log('Не выбраны места или их более 1000');
            return;
        }
        var maxX = -Infinity;
        var minX = Infinity;
        var maxY = -Infinity;
        var minY = Infinity;
        for (var i in selection) {
            var square = mapEditor_map.squares[selection[i]];
            if (maxX < square.x) {
                maxX = square.x;
            }

            if (minX > square.x) {
                minX = square.x;
            }
            if (maxY < square.y) {
                maxY = square.y;
            }

            if (minY > square.y) {
                minY = square.y;
            }
        }
        var dX = maxX - minX + 50;
        var dY = 0;
        if (obj.startX) {
            dX = obj.startX - minX;
        }
        if (obj.startY) {
            dY = obj.startY - minY;
        }

        var sqs = [];
        for (var i in selection) {
            var originalSquare = mapEditor_map.squares[selection[i]];

            originalSquare.x = originalSquare.x + dX;
            originalSquare.y = originalSquare.y + dY;
            sqs.push(originalSquare);
            sqs[sqs.length - 1][scheme_items + "_id"] = originalSquare.id;
        }

        console.log('SQS', sqs);

        mapEditor_map.container.trigger("modifySquare", [sqs]);
        mapEditor_map.setLayout(function () {
            mapEditor_map.reLoadLayout(function () {
                mapEditor_map.render();
                mapEditor_map.container.trigger("updatePlaceGroupPosition_callback");
            });
        });
    };

    mapEditor_map.container.on('updatePlaceGroupPosition', function (e, obj) {
        mapEditor_map.updatePlaceGroupPosition(obj);
    });


    /*------------------------*/
    mapEditor_map.flipHorizontal = function (obj) {
        if (typeof obj !== 'object') {
            obj = {};
        }
        var selection = mapEditor_map.selection;
        if (selection.length == 0/* || selection.length > 3000*/) {
            console.log('Не выбраны места или их более 1000');
            return;
        }
        var maxX = -Infinity;
        var minX = Infinity;
        var maxY = -Infinity;
        var minY = Infinity;
        for (var i in selection) {
            var square = mapEditor_map.squares[selection[i]];
            if (maxX < square.x) {
                maxX = square.x;
            }

            if (minX > square.x) {
                minX = square.x;
            }
            if (maxY < square.y) {
                maxY = square.y;
            }

            if (minY > square.y) {
                minY = square.y;
            }
        }

        var sqs = [];
        for (var k in selection) {
            var sq = mapEditor_map.squares[selection[k]];
            sq.y = (maxY - sq.y) + maxY;
            var o = {
                y: (maxY - sq.y) + maxY
            };
            o[scheme_items + "_id"] = sq.id;
            console.log(sq.y, o.y);

            sqs.push(o);
        }

        console.log(mapEditor_map.squares[selection[0]].y, sqs[0].y);

        mapEditor_map.container.trigger("modifySquare", [sqs]);
        mapEditor_map.setLayout(function () {
            mapEditor_map.reLoadLayout(function () {
//                mapEditor_map.addToSelectionArray(ids);
                mapEditor_map.render();
                mapEditor_map.container.trigger("flipHorizontalCallback");
            });
        });
    };
    /*------------------------*/

    mapEditor_map.selectFrom = function (num) {
        if (isNaN(+num)) {
            return;
        }
        mapEditor_map.clearSelection();
        var arr = [];
        for (var i in mapEditor_map.squares) {
            if (+mapEditor_map.squares[i].id >= +num) {
                arr.push(+mapEditor_map.squares[i].id);
            }
        }
        mapEditor_map.addToSelection(arr);
        mapEditor_map.render();

    };

    mapEditor_map.copySelection = function (obj) {
        if (typeof obj !== 'object') {
            obj = {};
        }
        var selection = mapEditor_map.selection;
        if (selection.length == 0/* || selection.length > 1000*/) {
            console.log('Не выбраны места или их более 1000');
            return;
        }
        var maxX = -Infinity;
        var minX = Infinity;
        var maxY = -Infinity;
        var minY = Infinity;
        for (var i in selection) {
            var square = mapEditor_map.squares[selection[i]];
            if (maxX < square.x) {
                maxX = square.x;
            }

            if (minX > square.x) {
                minX = square.x;
            }
            if (maxY < square.y) {
                maxY = square.y;
            }

            if (minY > square.y) {
                minY = square.y;
            }
        }
        var dX = maxX - minX + 50;
        var dY = 0;
        if (obj.startX) {
            dX = obj.startX - minX;
        }
        if (obj.startY) {
            dY = obj.startY - minY;
        }
        var object_id = obj.object_id || mapEditor_map.squares[selection[0]].object_id;

        var sq = {
            row_count: 1,
            col_count: selection.length,
            object_id: object_id,
            x: obj.startX * mapEditor_map.scaleCoeff + mapEditor_map.XCoeff || (maxX + 10) * mapEditor_map.scaleCoeff + mapEditor_map.XCoeff,
            y: obj.startY * mapEditor_map.scaleCoeff + mapEditor_map.YCoeff || 10 * mapEditor_map.scaleCoeff + mapEditor_map.YCoeff
        };
        /* if (typeof obj.fields=='object'){
         for (var i in obj.fields) {
         sq[i] = obj[i];
         }
         }*/

        console.log(sq);

        mapEditor_map.container.trigger("addSquare", [sq, function (result) {
            console.log(result);
            var data = JSON.parse(result);
            if (data['results'][0].code && +data['results'][0].code !== 0) {
                console.log('Ошибка: ' + result);
                return;
            }
            mapEditor_map.reLoad(function () {
                var addedSquares = data['results'][0].id.split(',');
                var ids = [];
                mapEditor_map.clearSelection();
                var sqs = [];
                for (var i in selection) {
                    var newSqId = addedSquares.pop();
                    var originalSquare = mapEditor_map.squares[selection[i]];
                    var targetSquare = mapEditor_map.squares[newSqId];
                    for (var k in originalSquare) {
                        if (k == "id" || k == 'object_id') {
                            continue;
                        }
                        targetSquare[k] = originalSquare[k];
                        targetSquare[k] = originalSquare[k];
                    }
                    targetSquare.x = originalSquare.x + dX;
                    targetSquare.y = originalSquare.y + dY;
                    sqs.push(targetSquare);
                    sqs[sqs.length - 1][scheme_items + "_id"] = targetSquare.id;
                    ids.push(targetSquare.id);
                }
                mapEditor_map.container.trigger("modifySquare", [sqs]);
                mapEditor_map.setLayout(function () {
                    mapEditor_map.reLoadLayout(function () {
                        mapEditor_map.addToSelectionArray(ids);
                        mapEditor_map.render();
                        mapEditor_map.container.trigger("copySelectionCallback");
                    });
                });
            });
        }]);
    };
    var t1;

    mapEditor_map.rotateSelection = function (alpha, obj) {
        if (typeof obj!='object') obj = {};
        var sel = obj.selection ||  mapEditor_map.selection;
        var minMax = obj.minMax || mapEditor_map.getMinMaxSelection(sel);
        var x0 = obj.centerX || minMax.center.x;
        var y0 = obj.centerY || minMax.center.y;


        var sq = [];
        var squares = obj.squares || mapEditor_map.squares;
        for (var i in sel) {
            var square = squares[sel[i]];
            if (!square) continue;
            var beta = (+alpha - +(obj.startRotation || square.rotation));
            console.log(beta);
            var a = beta * Math.PI / 180;
            //var a = d || Math.PI/2;
            var x1 = square.x - x0;
            var y1 = square.y - y0;
            var x2 = x1 * Math.cos(a) - y1 * Math.sin(a);
            var y2 = +x1 * Math.sin(a) + y1 * Math.cos(a);
            square.x = x2 + x0;
            square.y = y2 + y0;
            square.rotation = alpha;
            var o = {
                x: square.x,
                y: square.y,
                ROTATION: square.rotation
            };
            o[scheme_items + "_id"] = square.id;
            sq.push(o);
        }
        if (!obj.doNotRender) mapEditor_map.render();
        if (!obj.doNotModify) mapEditor_map.container.trigger('modifySquare', [sq]);


    };

    mapEditor_map.transformSelectionStart = function () {
        delete mapEditor_map.transformSelectionObj;
        if (mapEditor_map.countSelection() < 3) {

            return false;
        }

        //mapEditor_map.convertSquaresToBasic();
        var minMax = mapEditor_map.getMinMaxSelection();

        var ctrlPoints = {
            lt: {x: minMax.minX, y: minMax.minY},
            rt: {x: minMax.maxX, y: minMax.minY},
            rb: {x: minMax.maxX, y: minMax.maxY},
            lb: {x: minMax.minX, y: minMax.maxY},
            middle: {x: minMax.center.x, y: minMax.center.y}
        };

        var squares = {};
        for (var i in mapEditor_map.selection) {
            var sqId = mapEditor_map.selection[i];
            squares[sqId] = cloneObj(mapEditor_map.squares[sqId]);
        }
        mapEditor_map.splitSelection();
        console.log('mapEditor_map.xSelection',mapEditor_map.xSelection);
        console.log('mapEditor_map.ySelection',mapEditor_map.ySelection);

        //var bP1 =

        mapEditor_map.transformSelectionObj = {
            selection:mapEditor_map.selection,
            etalon:squares,
            ctrlPoints:ctrlPoints,
            minMax:minMax,
            xSelection:mapEditor_map.xSelection,
            ySelection:mapEditor_map.ySelection
        };
        //mapEditor_map.convertSquaresToNormal();
        for (var i in ctrlPoints) {
            mapEditor_map.fillPoint(ctrlPoints[i],"#00F");
        }
        console.log('transformSelectionObj', mapEditor_map.transformSelectionObj);
    };

    mapEditor_map.tr = function(limit,delay){
        var obj = mapEditor_map.transformSelectionObj.ctrlPoints;
        var rotation = 0;
        var counter = 0;
        limit = limit || 720;
        var fn = function(){
            counter++;
            obj.lt.x -= 1;
            obj.lt.y -= 1;
            obj.rt.x += 1;
            obj.rt.y -= 1;
            obj.rb.x += 1;
            obj.rb.y += 1;
            obj.lb.x -= 1;
            obj.lb.y += 1;
            obj.middle.x -= 1;
            obj.middle.y -= 1;
            if (rotation==360) rotation = 0;
            //mapEditor_map.transformSelection(obj,rotation++);
            mapEditor_map.transformSelection(obj,0);
            if (counter >= limit) return;
            setTimeout(function(){
                fn();
            },delay || 100);
        };
        fn();

    };

    /*
    * Объект содержит контрольные точеки {x,y}
    *
    * Нумерация точек не совсем очивидная (подогнана под формулу)
    *       4*-----------*5
    *       |            |
    *       |            |
    *       |      2     |
    *      1*____--*------*3
    *
     *   Нижние точки для формулы кривой безье (2 - контрольная точка)
     *
    * */

    mapEditor_map.transformSelection = function (obj, rotation) {
        /*    obj = {
         "lt": {"x": 1277.03, "y": 798.14},
         "rt": {"x": 1425.03, "y": 798.14},
         "rb": {"x": 1425.03, "y": 846.14},
         "lb": {"x": 1377.03, "y": 846.14},
         "middle": {"x": 1401.03, "y": 822.14}
         };

         obj = {
         "lt": {"x": 1277, "y": 997},
         "rt": {"x": 1453, "y": 997},
         "rb": {"x": 1453, "y": 1045},
         "lb": {"x": 1300, "y": 1045},
         "middle": {"x": 1405, "y": 800}
         };
         */

        if (!mapEditor_map.transformSelectionObj){
            return console.log('Необходимо сперва запустить transformSelectionStart');
        }
        obj = obj || mapEditor_map.transformSelectionObj.ctrlPoints;
        if (typeof obj!=='object'){
            return console.log('Не переданы параметры');
        }
        // Запишем X-ы и Y-и  для точек. Оригинальные будут с прочерком в начале ( _x1 = )
        var selection = mapEditor_map.transformSelectionObj.selection;
        var ctrlPoints = mapEditor_map.transformSelectionObj.ctrlPoints;
        var minMax = mapEditor_map.transformSelectionObj.minMax;
        var squares = mapEditor_map.transformSelectionObj.etalon;
        var x1 = obj.lb.x;            var _x1 = ctrlPoints.lb.x;
        var x2 = obj.middle.x;        var _x2 = ctrlPoints.middle.x;
        var x3 = obj.rb.x;            var _x3 = ctrlPoints.rb.x;
        var x4 = obj.lt.x;            var _x4 = ctrlPoints.lt.x;
        var x5 = obj.rt.x;            var _x5 = ctrlPoints.rt.x;

        var y1 = obj.lb.y;            var _y1 = ctrlPoints.lb.y;
        var y2 = obj.middle.y;        var _y2 = ctrlPoints.middle.y;
        var y3 = obj.rb.y;            var _y3 = ctrlPoints.rb.y;
        var y4 = obj.lt.y;            var _y4 = ctrlPoints.lt.y;
        var y5 = obj.rt.y;            var _y5 = ctrlPoints.rt.y;

        // Найдем изменения прямых
        // Коэффициенты наклона
        var m41 = (y4 - y1) / (x4 - x1); //m41 = (Math.abs(m41)!==Infinity) ? m41 : 1;
        var m53 = (y5 - y3) / (x5 - x3); //m53 = (Math.abs(m53)!==Infinity) ? m53 : 1;
        var m13 = (y1 - y3) / (x1 - x3); //m13 = (Math.abs(m13)!==Infinity) ? m13 : 1;
        var m45 = (y4 - y5) / (x4 - x5); //m45 = (Math.abs(m45)!==Infinity) ? m45 : 1;

        var _m41 = (_y4 - _y1) / (_x4 - _x1); // _m41 = (Math.abs(_m41)!==Infinity) ? _m41 : 1;
        var _m53 = (_y5 - _y3) / (_x5 - _x3); // _m53 = (Math.abs(_m53)!==Infinity) ? _m53 : 1;
        var _m13 = (_y1 - _y3) / (_x1 - _x3); // _m13 = (Math.abs(_m13)!==Infinity) ? _m13 : 1;
        var _m45 = (_y4 - _y5) / (_x4 - _x5); // _m45 = (Math.abs(_m45)!==Infinity) ? _m45 : 1;

        //
        /**
         * Уравнение прямой y(x)
         * @param m  коэффициент наклона
         * @param x1
         * @param y1
         * @param x - итератор
         * @returns {*} возвращает Y
         */
        function lineGetY(m, x1, y1, x) {
            return m * (x - x1) + y1;
        }

        function lineGetX(m, x1, y1, y) {
            return (y - y1 + m * x1 ) / m;
        }


        /// Кривые безье X и Y от t
        function getX(t,obj) {
            if (typeof obj!=='object')obj = {};
            x1 = obj.x1 || x1;
            x2 = obj.x2 || x2;
            x3 = obj.x3 || x3;
            return (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * x2 + t * t * x3;
        }
        function getY(t) {
            if (typeof obj!=='object')obj = {};
            y1 = obj.y1 || y1;
            y2 = obj.y2 || y2;
            y3 = obj.y3 || y3;
            return (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * y2 + t * t * y3;
        }

        //var cols = mapEditor_map.xSelection.length;
        var usedCols = [];
        var counter = 0;
        function getColBiId(id){
            for (var a in mapEditor_map.ySelection) {
                if (usedCols.indexOf(a)!==-1) continue;
                var col = mapEditor_map.ySelection[a];
                for (var a2 in col) {
                    if (col[a2] == id){
                        usedCols.push(a);
                        return col;
                    }
                }
            }
            return false;
        }
        var x, y,dx,dx1,dx2,dy,dy1,dy2;
        for (var l in mapEditor_map.xSelection) {
            var line = mapEditor_map.xSelection[l];
            /*x = lineGetX(mA, x1, y1, squares[line[0]].y);
             var dx1 = minMax.minX - x || 0;
             x = lineGetX(mB, x5, y5, squares[line[line.length - 1]].y);
             var dx2 = x - minMax.maxX || 0;

             var dx = dx1 + dx2;*/

            //if (t == 0) continue;
            for (var r in line) {
                var sqId = line[r];
                var sq = mapEditor_map.squares[sqId];
                var t = r / (line.length - 1);
                //var newX = getX(t);
                //sq.x = newX;
                var newY = getY(t);
                sq.y = newY;


            }
        }


        //mapEditor_map.rotateSelection(rotation || 0,{startRotation:0, selection:selection,doNotModify:true,doNotRender:false});
        mapEditor_map.render();

        for (var i in obj) {
            mapEditor_map.fillPoint(obj[i],"#00F");
        }



    };     mapEditor_map.transformSelectionOLD = function (obj, rotation) {
    /*    obj = {
            "lt": {"x": 1277.03, "y": 798.14},
            "rt": {"x": 1425.03, "y": 798.14},
            "rb": {"x": 1425.03, "y": 846.14},
            "lb": {"x": 1377.03, "y": 846.14},
            "middle": {"x": 1401.03, "y": 822.14}
        };

        obj = {
            "lt": {"x": 1277, "y": 997},
            "rt": {"x": 1453, "y": 997},
            "rb": {"x": 1453, "y": 1045},
            "lb": {"x": 1300, "y": 1045},
            "middle": {"x": 1405, "y": 800}
        };
*/

        if (!mapEditor_map.transformSelectionObj){
            return console.log('Необходимо сперва запустить transformSelectionStart');
        }
        obj = obj || mapEditor_map.transformSelectionObj.ctrlPoints;
        if (typeof obj!=='object'){
            return console.log('Не переданы параметры');
        }
        // Запишем X-ы и Y-и  для точек. Оригинальные будут с прочерком в начале ( _x1 = )
        var selection = mapEditor_map.transformSelectionObj.selection;
        var ctrlPoints = mapEditor_map.transformSelectionObj.ctrlPoints;
        var minMax = mapEditor_map.transformSelectionObj.minMax;
        var squares = mapEditor_map.transformSelectionObj.etalon;
        var x1 = obj.lb.x;            var _x1 = ctrlPoints.lb.x;
        var x2 = obj.middle.x;        var _x2 = ctrlPoints.middle.x;
        var x3 = obj.rb.x;            var _x3 = ctrlPoints.rb.x;
        var x4 = obj.lt.x;            var _x4 = ctrlPoints.lt.x;
        var x5 = obj.rt.x;            var _x5 = ctrlPoints.rt.x;

        var y1 = obj.lb.y;            var _y1 = ctrlPoints.lb.y;
        var y2 = obj.middle.y;        var _y2 = ctrlPoints.middle.y;
        var y3 = obj.rb.y;            var _y3 = ctrlPoints.rb.y;
        var y4 = obj.lt.y;            var _y4 = ctrlPoints.lt.y;
        var y5 = obj.rt.y;            var _y5 = ctrlPoints.rt.y;
        
        // Найдем изменения прямых
        // Коэффициенты наклона
        var m41 = (y4 - y1) / (x4 - x1); //m41 = (Math.abs(m41)!==Infinity) ? m41 : 1;
        var m53 = (y5 - y3) / (x5 - x3); //m53 = (Math.abs(m53)!==Infinity) ? m53 : 1;
        var m13 = (y1 - y3) / (x1 - x3); //m13 = (Math.abs(m13)!==Infinity) ? m13 : 1;
        var m45 = (y4 - y5) / (x4 - x5); //m45 = (Math.abs(m45)!==Infinity) ? m45 : 1;

        var _m41 = (_y4 - _y1) / (_x4 - _x1); // _m41 = (Math.abs(_m41)!==Infinity) ? _m41 : 1;
        var _m53 = (_y5 - _y3) / (_x5 - _x3); // _m53 = (Math.abs(_m53)!==Infinity) ? _m53 : 1;
        var _m13 = (_y1 - _y3) / (_x1 - _x3); // _m13 = (Math.abs(_m13)!==Infinity) ? _m13 : 1;
        var _m45 = (_y4 - _y5) / (_x4 - _x5); // _m45 = (Math.abs(_m45)!==Infinity) ? _m45 : 1;

        //
        /**
         * Уравнение прямой y(x)
         * @param m  коэффициент наклона
         * @param x1
         * @param y1
         * @param x - итератор
         * @returns {*} возвращает Y
         */
        function lineGetY(m, x1, y1, x) {
            return m * (x - x1) + y1;
        }

        function lineGetX(m, x1, y1, y) {
            return (y - y1 + m * x1 ) / m;
        }


        /// Кривые безье X и Y от t
        function getX(t,obj) {
            if (typeof obj!=='object')obj = {};
            x1 = obj.x1 || x1;
            x2 = obj.x2 || x2;
            x3 = obj.x3 || x3;
            return (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * x2 + t * t * x3;
        }
        function getY(t) {
            if (typeof obj!=='object')obj = {};
            y1 = obj.y1 || y1;
            y2 = obj.y2 || y2;
            y3 = obj.y3 || y3;
            return (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * y2 + t * t * y3;
        }

       /* for (var s1 in squares) {
            var sq0 = squares[s1];
            sq0.x = sq0.x_orig;
            sq0.y = sq0.y_orig;
        }
*/

       /* for (var j in mapEditor_map.ySelection) {
            var col = mapEditor_map.ySelection[j];
            var moveY = ctrlPoints.
            console.log('dy',dy);

            for (var p in col) {
                var sqId = col[p];
                var sq = mapEditor_map.squares[sqId];
                var t = p/(col.length-1);
                sq.y = squares[sqId].y - dy;
                //sq.y = getY(t);
            }
            mapEditor_map.yScale(dy,col);
        }*/

        //var cols = mapEditor_map.xSelection.length;
        var usedCols = [];
        var counter = 0;
        function getColBiId(id){
            for (var a in mapEditor_map.ySelection) {
                if (usedCols.indexOf(a)!==-1) continue;
                var col = mapEditor_map.ySelection[a];
                for (var a2 in col) {
                    if (col[a2] == id){
                        usedCols.push(a);
                        return col;
                    }
                }
            }
            return false;
        }
        var x, y,dx,dx1,dx2,dy,dy1,dy2;
        /*for (var l in mapEditor_map.xSelection) {
            var line = mapEditor_map.xSelection[l];
            *//*x = lineGetX(mA, x1, y1, squares[line[0]].y);
            var dx1 = minMax.minX - x || 0;
            x = lineGetX(mB, x5, y5, squares[line[line.length - 1]].y);
            var dx2 = x - minMax.maxX || 0;

            var dx = dx1 + dx2;*//*

            //if (t == 0) continue;

            for (var r in line) {
                var sqId = line[r];
                var sq = mapEditor_map.squares[sqId];
                var t = r / (line.length - 1);
                var squareEtalon = squares[sqId];
                var _x41 = lineGetX(_m41, _x1, _y1, squareEtalon.y) || _x1;
                var x41 = lineGetX(m41, x1, y1, squareEtalon.y) || x1;
                dx1 = (_x41 - x41) || 0;
                var _x53 = lineGetX(_m53, _x3, _y3, squareEtalon.y) || _x3;
                var x53 = lineGetX(m53, x3, y3, squareEtalon.y) || x3;
                dx2 = (_x53 - x53) || 0;
                *//*dx1 = (_x4 - x4) || 0;
                dx2 = (_x5 - x5) || 0;*//*
                dx = Math.abs(dx1) + Math.abs(dx2);
                console.log('dx',dx);
                var dW = _x5 - _x4;

                var dw = squareEtalon.x - _x4;
                var newX = squareEtalon.x - dx1 + dx*dw/dW;
                //newX = getX(t);

                var _y45 = lineGetY(_m45, _x5, _y5, newX) || _y5;
                var y45 = lineGetY(m45, x5, y5, newX) || y5;
                dy1 = (_y45 - y45) || 0;
                var _y13 = lineGetY(_m13, _x3, _y3, newX) || _y3;
                var y13 = lineGetY(m13, x3, y3, newX) || y3;
                dy2 = (_y13 - y13) || 0;
                dy = dy1 + dy2;
                var dH = _y4 - _y1;
               *//* console.log('dy1',dy1);
                console.log('dy2',dy2);
                console.log('dy',dy);*//*

                //var dw = squareEtalon.x - _x41;

                var dh = squareEtalon.y - _y4;
                var newY = squareEtalon.y - dy1 + dy*dh/dH;
                //var dw = squareEtalon.x - _x41;
                //newX +=





                sq.x = newX;
                sq.y = newY;


            }
        }*/

        for (var l in mapEditor_map.xSelection) {
            var line = mapEditor_map.xSelection[l];
            /*x = lineGetX(mA, x1, y1, squares[line[0]].y);
             var dx1 = minMax.minX - x || 0;
             x = lineGetX(mB, x5, y5, squares[line[line.length - 1]].y);
             var dx2 = x - minMax.maxX || 0;

             var dx = dx1 + dx2;*/

            //if (t == 0) continue;
            for (var r in line) {
                var sqId = line[r];
                var sq = mapEditor_map.squares[sqId];
                var t = r / (line.length - 1);
                //var newX = getX(t);
                //sq.x = newX;
                var newY = getY(t);
                sq.y = newY;


            }
        }

/*        for (var l in mapEditor_map.xSelection) {
            var line = mapEditor_map.xSelection[l];
            var x = lineGetX(mA, x1, y1, squares[line[0]].y);
            var dx1 = minMax.minX - x || 0;
            x = lineGetX(mB, x5, y5, squares[line[line.length - 1]].y);
            var dx2 = x - minMax.maxX || 0;

            var dx = dx1 + dx2;

            //if (t == 0) continue;
            for (var r in line) {
                var sqId = line[r];
                var sq = mapEditor_map.squares[sqId];
                var t = r / (line.length - 1);
                //var dx0 = x - squares[sqId].x || 0;
                //sq.x = getX(t);
                sq.x = squares[sqId].x - dx1;
                //var tempX = getX(t);
                //sq.x = tempX - dx1;


            }
            mapEditor_map.xScale(dx, {selection:line,doNotRender:true});
            for (var r in line) {

                var t2 = r / (line.length - 1);
                if (l != mapEditor_map.xSelection.length-1) continue;

                var col = getColBiId(line[r]);
                if (col) {
                    for (var c0 in col) {
                        var sqId2 = col[c0];
                        var sq2 = mapEditor_map.squares[sqId2];
                        var y = lineGetY(m45, x4, y4, sq2.x);
                        var dy1 = minMax.minY - y || 0;
                        y = lineGetY(m13, x1, y1, sq2.x);
                        var dy2 = y - minMax.maxY || 0;
                        var dy0 = y - squares[sqId2].y || 0;
                        var dy = dy1 + dy2;
                        //sq2.y = getY(t2)-dy0;
                        //var tempY = getY(t2)-dy0 || squares[sqId2].y;
                        //sq2.y = tempY - dy1;
                        sq2.y = squares[sqId2].y - dy1;
                    }
                    mapEditor_map.yScale(dy, {selection:col,doNotRender:true});
                }
            }
        }*/
        //mapEditor_map.rotateSelection(rotation || 0,{startRotation:0, selection:selection,doNotModify:true,doNotRender:false});
        mapEditor_map.render();

        for (var i in obj) {
            mapEditor_map.fillPoint(obj[i],"#00F");
        }



    };

    /*mapEditor_map.container.off('keydown').on('keydown',function(e){
        switch (e.which){
            case 97:
                mapEditor_map.point = 'lb';
                break;
            case 98:
                mapEditor_map.point = 'middle';
                break;
            case 99:
                mapEditor_map.point = 'rb';
                break;
            case 100:
                mapEditor_map.point = 'lt';
                break;
            case 101:
                mapEditor_map.point = 'rt';
                break;
            default:
                delete mapEditor_map.point;
                break;
        }
    });*/
    mapEditor_map.container.off('click').on('click',function(e){
        if (!mapEditor_map.point) return;
        e = mapEditor_map.fixEvent(e);
        var x = e.pageX;
        var y = e.pageY;
        var nX = (x-mapEditor_map.XCoeff)/mapEditor_map.scaleCoeff;
        var nY = (y-mapEditor_map.YCoeff)/mapEditor_map.scaleCoeff;
        if (!mapEditor_map.transformSelectionObj) mapEditor_map.transformSelectionStart();
        var obj = cloneObj(mapEditor_map.transformSelectionObj.ctrlPoints);
        obj[mapEditor_map.point].x = nX;
        obj[mapEditor_map.point].y = nY;
        mapEditor_map.transformSelection(obj);

        setTimeout(function(){
            var obj = mapEditor_map.transformSelectionObj.ctrlPoints;
            for (var i in obj) {
                mapEditor_map.fillPoint(obj[i],"#00F");
            }
        },200);

    });

    mapEditor_map.transformSelectionOLD = function () {

        var minMax = mapEditor_map.getMinMaxSelection();
        var x0 = minMax.center.x;
        var y0 = minMax.center.y;

        var sel = mapEditor_map.selection;
        var sq = [];

        mapEditor_map.splitSelection();
        console.log('mapEditor_map.xSelection',mapEditor_map.xSelection);
        console.log('mapEditor_map.ySelection',mapEditor_map.ySelection);
        //var minusY
        mapEditor_map.mY = mapEditor_map.mY || 1100;
        var ctrlPoints = {
            lt: {x: 1357, y: 997},
            rt: {x: 1501, y: 997},
            rb: {x: 1501, y: 1141},
            lb: {x: 1357, y: 1141},
            middle: {x: 1429, y: mapEditor_map.mY}
        };

        for (var i in ctrlPoints) {
            mapEditor_map.fillPoint(ctrlPoints[i],"#00F");
        }
        // http://algolist.manual.ru/maths/geom/equation/circle.php

        var y2 = ctrlPoints.middle.y;
        var x2 = ctrlPoints.middle.x;
        var y1 = ctrlPoints.lb.y;
        var x1 = ctrlPoints.lb.x;
        var y3 = ctrlPoints.rb.y;
        var x3 = ctrlPoints.rb.x;
        // Коэффициенты наклона
        var mA = (y2 - y1) / (x2 - x1);
        var mB = (y3 - y2) / (x3 - x2);
        // Уравнения прямых
        mapEditor_map.ctx.strokeStyle = '#FF0';

        for (var x = 1000; x<3000; x++) {
            var yA = mA * (x - x1) + y1;
            if (x==1000){
                mapEditor_map.ctx.moveTo(1000*mapEditor_map.scaleCoeff + mapEditor_map.XCoeff,yA*mapEditor_map.scaleCoeff + mapEditor_map.YCoeff);
                continue;
            }
            mapEditor_map.ctx.lineTo(x*mapEditor_map.scaleCoeff + mapEditor_map.XCoeff,yA*mapEditor_map.scaleCoeff + mapEditor_map.YCoeff);
        }
        for (var x = 1000; x<3000; x++) {
            var yB = mB * (x - x3) + y3;
            if (x==1000){
                mapEditor_map.ctx.moveTo(1000*mapEditor_map.scaleCoeff + mapEditor_map.XCoeff,yB*mapEditor_map.scaleCoeff + mapEditor_map.YCoeff);
                continue;
            }
            mapEditor_map.ctx.lineTo(x*mapEditor_map.scaleCoeff + mapEditor_map.XCoeff,yB*mapEditor_map.scaleCoeff + mapEditor_map.YCoeff);
        }

        mapEditor_map.ctx.stroke();
       //var y_A = -1/mA * (x - ((x1 + x2)/2))+(y1-y2)/2;
       //var y_B = -1/mB * (x - ((x2 + x3)/2))+(y2-y3)/2;
        mapEditor_map.ctx.strokeStyle = '#BCEDAA';
        for (var x = 1000; x<3000; x++) {
            var y_A = -1/mA * (x - ((x1 + x2)/2))+(y1+y2)/2;
            if (x==1000){
                mapEditor_map.ctx.moveTo(1000*mapEditor_map.scaleCoeff + mapEditor_map.XCoeff,y_A*mapEditor_map.scaleCoeff + mapEditor_map.YCoeff);
                continue;
            }
            mapEditor_map.ctx.lineTo(x*mapEditor_map.scaleCoeff + mapEditor_map.XCoeff,y_A*mapEditor_map.scaleCoeff + mapEditor_map.YCoeff);
        }
        for (var x = 1000; x<3000; x++) {
            var y_B = -1/mB * (x - ((x2 + x3)/2))+(y2+y3)/2;
            if (x==1000){
                mapEditor_map.ctx.moveTo(1000*mapEditor_map.scaleCoeff + mapEditor_map.XCoeff,y_B*mapEditor_map.scaleCoeff + mapEditor_map.YCoeff);
                continue;
            }
            mapEditor_map.ctx.lineTo(x*mapEditor_map.scaleCoeff + mapEditor_map.XCoeff,y_B*mapEditor_map.scaleCoeff + mapEditor_map.YCoeff);
        }
        mapEditor_map.ctx.stroke();

        var centerX = (mA*mB*(y1-y3)+mB*(x1 +x2)-mA*(x2+x3))/(2*(mB - mA));
        var centerY = -1/mA * (centerX - ((x1 + x2)/2))+(y1+y2)/2;
        mapEditor_map.fillPoint({x:centerX,y:centerY},"#F00");
        var radius = centerY-y2;
        mapEditor_map.ctx.arc(centerX*mapEditor_map.scaleCoeff + mapEditor_map.XCoeff,centerY*mapEditor_map.scaleCoeff + mapEditor_map.YCoeff,radius*mapEditor_map.scaleCoeff,0,360);
        mapEditor_map.ctx.stroke();
        var a0 = mapEditor_map.get_angle({x:centerX,y:centerY},ctrlPoints.lb);
        for (var l in mapEditor_map.xSelection) {
            var line = mapEditor_map.xSelection[l];
            for (var r in line) {
                var sqId = line[r];
                var square = mapEditor_map.squares[sqId];
                //console.log(square);
                var a1 = mapEditor_map.get_angle({x:centerX,y:centerY},{x:square.x_orig,y:square.y_orig});
                if (a1<a0) a1+=360;
                console.log('angle',a1-a0);
                var sY = square.y_orig - centerY;
                console.log('sY',sY);
                var ny = sY*(Math.sin(mapEditor_map.degToRad(a1-a0))+1);
                console.log('ny',ny);
                square.y = square.y_orig + (ny-sY);
            }

        }
        mapEditor_map.render();

        return;
        for (var i in sel) {

            var square = mapEditor_map.squares[sel[i]];
            var beta = (alpha - square.rotation);
            var a = beta * Math.PI / 180;
            //var a = d || Math.PI/2;
            var x1 = square.x - x0;
            var y1 = square.y - y0;
            var x2 = x1 * Math.cos(a) - y1 * Math.sin(a);
            var y2 = +x1 * Math.sin(a) + y1 * Math.cos(a);
            square.x = x2 + x0;
            square.y = y2 + y0;
            square.rotation = alpha;
            var o = {
                x: square.x,
                y: square.y,
                ROTATION: square.rotation
            };
            o[scheme_items + "_id"] = square.id;
            sq.push(o);
        }
        mapEditor_map.render();
        mapEditor_map.container.trigger('modifySquare', [sq]);


    };


    /******Конец Работа с местами******/

    mapEditor_map.container.on("squaresLoaded", function (e, squares) {
        for (var k in squares) {
            var object = editor.findObject(squares[k].object_id);
            if (object)
                object.addIds([k]);
        }
    });


    mapEditor_map.container.trigger('loadFiles');
    var renderObjects = [];
    mapEditor_map.container.trigger('loadLayer', [
        {},
        function (result) {
            var data = JSON.parse(result);
            if (data['results'][0].code && +data['results'][0].code !== 0) {
                return;
            }
            var obj = jsonToObj(data['results'][0]);
            var counter1 = 0;
            var counter2 = 0;
            var c1 = 0;
            for (var i in obj) {
                c1++;
            }
            obj[c1] = {};

            obj[c1][SCHEME + '_LAYER_ID'] = "isNULL";

            for (var l in obj) {
                counter1++;
                var layer = editor.findLayer('placeLayer');
                if (obj[l][SCHEME + '_LAYER_ID'] != "isNULL") {
                    layer = new MELayer({
                        id: obj[l][SCHEME + '_LAYER_ID'],
                        title: obj[l].NAME
                    });
                    editor.layers.push(layer);

                }

                mapEditor_map.container.trigger('loadObject', [
                    {layer_id: obj[l][SCHEME + '_LAYER_ID']},
                    function (result2) {
                        counter2++;
                        var data = JSON.parse(result2);
                        if (data['results'][0].code && +data['results'][0].code !== 0) {
                            console.log('Ошибка: ' + result2);
                            return;
                        }

                        var obj = jsonToObj(data['results'][0]);
                        var OBJECT_TYPE = {
                            PLACE_GROUP: {
                                type: 0,
                                object_title: "Места",
                                instance: PlacesGroupType
                            },
                            BACKGROUND: {
                                type: 1,
                                object_title: "Фон",
                                instance: BackgroundType
                            },
                            IMAGE: {
                                type: 2,
                                object_title: "Изображение",
                                instance: ImageType
                            },
                            STROKE: {
                                type: 3,
                                object_title: "Обводка",
                                instance: StrokeType
                            },
                            LABEL: {
                                type: 4,
                                object_title: "Надпись",
                                instance: LabelType
                            }
                        };
                        for (var i in obj) {

                            var layer_id = (obj[i][SCHEME + '_LAYER_ID'] != '') ? obj[i][SCHEME + '_LAYER_ID'] : 'placeLayer';
                            var layer = editor.findLayer(layer_id);
                            var params = obj[i];
                            if (params.OBJECT_TYPE == "") continue;
                            var o = {
                                object_id: params[SCHEME + '_OBJECT_ID'] || undefined,
                                area_groups: [],
                                selected: params.selected || false,
                                /*object_old_id : params.object_id || undefined,*/
                                type: OBJECT_TYPE[params.OBJECT_TYPE].type,
                                value: params.VALUE || "",
                                color: params.COLOR || "#000",
                                object_title: params.NAME || OBJECT_TYPE[params.OBJECT_TYPE].object_title,
                                image: params.BACKGROUND_URL_SCALE || params.BACKGROUND_URL_ORIGINAL || undefined,
                                scaleCoeff: +params.SCALE || 1,
                                rotation: +params.ROTATION || 0,
                                visibility: {
                                    visible_editor: (params.VISIBLE_EDITOR == "TRUE"),
                                    visible_admin: (params.VISIBLE_ADMIN == "TRUE"),
                                    visible_casher: (params.VISIBLE_CASHER == "TRUE"),
                                    visible_iframe: (params.VISIBLE_IFRAME == "TRUE"),
                                    visible_client_screen: (params.VISIBLE_CLIENT_SCREEN == "TRUE")
                                },
                                x: params.X,
                                y: params.Y,
                                fontFamily: params.FONT_FAMILY,
                                fontSize: params.FONT_SIZE,
                                fontStyle: params.FONT_STYLE,
                                fontWeight: params.FONT_WIEGHT
                            };

                            var instance = new OBJECT_TYPE[params.OBJECT_TYPE].instance(o);
                            //console.log('instance',instance);
                            layer.addObject(instance);
                            if (params.OBJECT_TYPE != 'PLACE_GROUP')
                                renderObjects.push(instance);

                        }
                        /// Обеспечивает загрузку всех layer и object
                        if (counter1 == counter2) {
                            $(contentWrapper).trigger('layerUpdate');
                            mapEditor_map.loadSquares(squareO, function () {
                                mapEditor_map.fillRenderList(renderObjects, function () {
                                    mapEditor_map.render();
                                });

                                mapEditor_map.setLayout(function () {
                                    mapEditor_map.setMinMax(function () {
                                        mapEditor_map.setScaleCoff(function () {
                                            mapEditor_map.render(function () {
                                                mapEditor_map.reLoadLayout(function () {
                                                    mapEditor_map.container.trigger('loadTribune');
                                                });
                                            });

                                            mapEditor_map.setEvents();
                                        });

                                    });
                                });

                            });
                        }

                    }
                ]);


            }

        }
    ]);


//loadFundGroups();

    environment.onFocus = function () {
        mapEditor_map.render();
    };
    environment.onClose = function () {
        //log("mapEditor_map onClose");
        mapEditor_map.closeSocket();
    };


    var wrap = $("#" + environment.world + "_" + environment.id + "_wrapper");
    wrap.find("*").each(function () {
        preventSelection($(this)[0]);
    });
    mapEditor_map.sendSelection = function () {

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
    mapEditor_map.sendSelectionCallback = function () {
        //loadFundGroups();
    };
    mapEditor_map.sendSelectionCallbackFull = function () {
        //loadFundGroups();
    };


    $("#removeAll").on("click", function () {
        mapEditor_map.removeAll();
    });


    $("#Btn0").on("click", function () {
        mapEditor_map.container.trigger('add_squares', [5, 10]);

    });
    $("#Btn1").on("click", function () {
        mapEditor_map.container.trigger('loadObjects');

    });
    $("#Btn2").on("click", function () {
        mapEditor_map.container.trigger('loadAreaGroup');
        //mapEditor_map.fillNumbers(o);

    });
})();






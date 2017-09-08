


var mapEditorLogicInit = function(mapEditor_map){
    var editor = new ME();

    var uniqueEditor = '#modal_'+mapEditor_map.id+'_wrapper'; //modal_38BC1060-A97F-495F-82CC-13143AD075DC6_wrapper
    var guidsArr = [];
    var inDeleteAnimation = false;
    var canvasObscure = $(uniqueEditor+' #canvasObscure');
    var placesLayerId;
    var selectionMngInited = false;
    var zones = new Zones();
    var inAnimate = false;

    var undo = [];

    var modeSetPoints = false;
    var globalStrokeType = undefined;
    var globalStrokeLine = undefined;
    var strokeInstace = undefined;



    function clone(o) {
        if(!o || 'object' !== typeof o)  {
            return o;
        }
        var c = 'function' === typeof o.pop ? [] : {};
        var p, v;
        for(p in o) {
            if(o.hasOwnProperty(p)) {
                v = o[p];
                if(v && 'object' === typeof v) {
                    c[p] = clone(v);
                }
            else {
                    c[p] = v;
                }
            }
        }
        return c;
    }

    function guid() {
    return MB.Core.guid();
}


    var storage = new ImageStorage();
    var il = MB.Core.fileLoader;
    var objectsList = new MEObjectsOut();
    var ctrlKeyPress = false;


    function getFontStyleByValue(value){
        switch(value){
            case '10':
                return {fontStyle: 'normal', fontWeight: 'normal'};
                break;
            case '20':
                return {fontStyle: 'normal', fontWeight: 'bold'};
                break;
            case '30':
                return {fontStyle: 'italic', fontWeight: 'normal'};
                break;
            case '40':
                return {fontStyle: 'italic', fontWeight: 'bold'};
                break;
            default:
                return {fontStyle: 'normal', fontWeight: 'normal'};
                break;
        }
    }

    function getFontFamilyByValue(value){
        switch (value){
            case '10':
                return 'arial';
                break;
            case '20':
                return 'times new roman';
                break;
            case '30':
                return 'OpenSans';
                break;
            case '40':
                return "OpenSansLight";
                break;
            default:
                return 'arial';
                break;
        }
    }

    //Directions

    var isFromh, isFromv, hDirLine, vDirLine, canvasH, canvasW, canvasL, canvasT, directionObscure, hHtml, vHtml;

    var LabelTypeMiniModel ={
        value: 'example',
        font_family: 'arial',
        font_size: 13,
        font_style: 'normal',
        font_color: '#000000',
        parseValues: function(parent, ev){
            var evColor = (ev.color)? ev.color.toHex() : parent.find('#label_fontColor').val();

            if(evColor.indexOf('ffffff')!= -1){
                $('#labelTypePreview').addClass('shadow');
            }else{
                $('#labelTypePreview').removeClass('shadow');
            }

            var value, fFamily, fSize, fStyle, fColor;

            value = parent.find('#labelTitle').val();
            fFamily = parent.find('#label_fontFamily').select2('val');
            fSize = parent.find('#label_fontSize').val();
            fStyle = parent.find('#label_fontStyle').select2('val');
            fColor = evColor;

            LabelTypeMiniModel.value = value;
            LabelTypeMiniModel.font_family = fFamily;
            LabelTypeMiniModel.font_size = fSize;
            LabelTypeMiniModel.font_style = fStyle;
            LabelTypeMiniModel.font_color = fColor;
        },
        renderPreview: function(){

            function getStyleByValue(value){
                switch (value){
                    case '10':
                        return 'font-style: normal';
                        break;
                    case '20':
                        return 'font-style: normal; font-weight: bold';
                        break;
                    case '30':
                        return 'font-style: italic; font-weight: normal';
                        break;
                    case '40':
                        return 'font-style: italic; font-weight: bold';
                        break;
                    default:
                        return 'font-style: normal';
                        break;
                }
            }

            function getFamilyByValue(value){
                switch (value){
                    case '10':
                        return 'font-family: arial';
                        break;
                    case '20':
                        return 'font-family: times new roman';
                        break;
                    case '30':
                        return 'font-family: OpenSans';
                        break;
                    case '40':
                        return "font-family: OpenSansLight";
                        break;
                    default:
                        return 'font-family: arial';
                        break;
                }
            }

            var fSizeRange;
            if(parseInt(LabelTypeMiniModel.font_size) > 39){
                fSizeRange = 40;
            }else if(parseInt(LabelTypeMiniModel.font_size) < 10){
                fSizeRange = 9;
            }else{
                fSizeRange = parseInt(LabelTypeMiniModel.font_size);
            }

            var previewContainer = $('#labelTypePreview');
            var styledHtml = '<div style="' +
                'color:'+LabelTypeMiniModel.font_color+'; ' +
                'font-size:'+fSizeRange+'px; ' +
                getFamilyByValue(LabelTypeMiniModel.font_family)+'; ' +
                getStyleByValue(LabelTypeMiniModel.font_style)+';" >'+LabelTypeMiniModel.value+'</div>';

            previewContainer.html(styledHtml);
        },
        submitChanges: function(object_id){
            var modelObj = editor.findObject(object_id);

            modelObj.fontFamily = getFontFamilyByValue(LabelTypeMiniModel.font_family);
            modelObj.fontSize = LabelTypeMiniModel.font_size;
            modelObj.color = LabelTypeMiniModel.font_color;
            modelObj.fontStyle = getFontStyleByValue(LabelTypeMiniModel.font_style).fontStyle;
            modelObj.fontWeight = getFontStyleByValue(LabelTypeMiniModel.font_style).fontWeight;

            var objectToModify = [{
                    hall_scheme_object_id: object_id,
                    FONT_FAMILY: modelObj.fontFamily,
                    FONT_SIZE: modelObj.fontSize,
                    color: modelObj.color,
                    FONT_STYLE: modelObj.fontStyle,
                    FONT_WIEGHT: modelObj.fontWeight
                }];

            mapEditor_map.container.trigger('modifyObject', [objectToModify]);
            mapEditor_map.render();
        }
    };



    directionObscure = $(uniqueEditor+' #directionObscure');
    canvasH = $(uniqueEditor+' #canvasOutput').height();
    canvasW = $(uniqueEditor+' #canvasOutput').width();

    canvasT = $(uniqueEditor+' #canvasOutput').offset().top;
    canvasL = $(uniqueEditor+' #canvasOutput').offset().left;

    hHtml = '<div class="hDirStatic"></div>';
    vHtml = '<div class="vDirStatic"></div>';

    hDirLine = $(uniqueEditor+' #hDirLine');
    vDirLine = $(uniqueEditor+' #vDirLine');

    $(uniqueEditor).on('mousedown', '.hDirection', function(){
        isFromh = true;
        directionObscure.show(0);
    });

    $(uniqueEditor).on('mousedown', '.vDirection', function(){
        isFromv = true;
        directionObscure.show(0);
    });

    $(uniqueEditor).on('mouseup', function(){

        if(isFromh){
            $(hHtml).appendTo('#staticDirections').css('top',hDirLine.css('top'));
        }

        if(isFromv){
            $(vHtml).appendTo('#staticDirections').css('left',vDirLine.css('left'));
        }

        isFromh = false;
        isFromv = false;
        directionObscure.hide(0);
    });

        /*$(document).on('mousemove', function(e){

        });*/

    var mediator = {
    listeners: {
        onObjectDropToLayer: function(){
            mediator.emiters.onObjectDropToLayer();
        }
    },
    emiters: {
        onObjectDropToLayer: function(){
            $(uniqueEditor).trigger('onObjectDropToLayer');

        }
    },
    onLayersRendered: function(){
        $(uniqueEditor).trigger('onLayersRendered');
    },
    onLayerPosSetted: function(id, params){
        var layer = $(uniqueEditor+' #layersUl li[data-id="'+id+'"]'),
            xDelta = params.left + layer.width(),
            yDelta = params.top + layer.height();
    }
};

    var mapE_exchanger = {
    getSquaresByObjectId: function(objectId){
        var result = [];
        for(var i in mapEditor_map.squares){
            var sqr = mapEditor_map.squares[i],
                objId = sqr.object_id;
            if(objId == objectId){
                result.push(sqr);
            }
        }
        return result;
    }
};

    var populator = {
    getTypeById: function(id){
        switch (parseInt(id)){
            case 0:
                return 'Группа мест';
                break;
            case 1:
                return 'Фон';
                break;
            case 2:
                return 'Изображение';
                break;
            case 3:
                return 'Обводка';
                break;
            case 4:
                return 'Надпись';
                break;
            default:
                return 'Объект';
                break;
        }
    },
    populateLoadedImages: function(templateId, draggable, containerId){

    },
    populateObjects: function(templateId, draggable, containerId){
        var container = $(uniqueEditor+' #'+containerId);
        container.html(populator.getObjectsHtml(draggable, templateId));
    },
    populatePlacesObjects: function(templateId, draggable, containerId){
        var container = $(uniqueEditor+' #'+containerId);
        container.html(populator.getPlacesObjectsHtml(draggable, templateId));
    },
    populateLayers: function(templateId, draggable, containerId){

        console.log(editor);
        //$(document).off('mouseup');
        var container = $(uniqueEditor+' #'+containerId); //layersUl
        var tpl = $(uniqueEditor+' #'+templateId).html();  //layerItemTpl
        var resultData = [];
        var dragClass = (draggable)? "draggable": "";

        for(var i=0; i<editor.layers.length; i++){
            var layer = editor.layers[i];
            var selected = (layer.selected == true)? 'selected': '';
            var objects = [];

            function getObjects(){
                for(var i=0; i<layer.objects.length; i++){
                    var item = layer.objects[i];
                    var tmpObj = {
                        isNotPlaces: item.type !== 0,
                        isLabel: item.type == 4,
                        isVisible: (item.visibility.visible_editor)? "fa-eye on":"fa-eye-slash",
                        isVisibleCheckbox: (item.visibility.visible_editor)? 'checked="checked"':'',
                        isObjectSettingsOpened: (item.isObjectSettingsOpened)?"expanded":"",
                        object_id: item.object_id,
                        object_img: item.image,
                        object_title: item.object_title,
                        objSelectedClass: (item.selected)? "selected":"",
                        visible_admin:(item.visibility.visible_admin)? 'checked="checked"':'',
                        visible_casher:(item.visibility.visible_casher)? 'checked="checked"':'',
                        visible_iframe:(item.visibility.visible_iframe)? 'checked="checked"':'',
                        visible_client_screen:(item.visibility.visible_client_screen)? 'checked="checked"':''

                    };

                    objects.push(tmpObj);
                }
            }
            getObjects();

            var layersHtml = {
                layer_id: layer.id,
                isVisible: (layer.isVisible)? "fa-eye on":"fa-eye-slash",
                isVisibleCheckbox: (layer.isVisible)? 'checked="checked"':'',
                isVisibleFader: (layer.isVisible)? '':'faded',
                isLayerExpanded: (layer.isOpened == true)? "expanded": "",
                isLayerExpandedIcon: (layer.isOpened == true)? "fa-angle-down expand": "fa-angle-left",
                isLayerSettingsOpened: (layer.isSettingsOpened == true)? "expanded": "",
                isLayerSettingsOpenedIcon: (layer.isSettingsOpened == true)? "on": "",
                isntFixedTop: !layer.isFixedTop,
                layer_title: layer.title,
                selected_class: selected,
                isObjects: layer.objects.length > 0,
                layer_objects: objects,
                layerSelectedClass: (layer.selected)? "selected": ""
            };
            resultData.push(layersHtml);
        }

        var data = {
            "isLayers": editor.layers.length>0,
            "layers": resultData
        };

        container.html(Mustache.to_html(tpl, data));
        mediator.onLayersRendered();

    },
    populateStrokes: function(templateId, containerId){
        var container = $(uniqueEditor+' #'+containerId);
        container.html(populator.getStrokesHtml(templateId));
    },
    getStrokesHtml: function(templateId){
        var tpl = $(uniqueEditor+' #'+templateId).html();
        var lines = [];

        function getTitleByType(type){
            switch(parseInt(type)){
                case 0:
                    return 'Прямая';
                    break;
                case 1:
                    return 'Кривая Безье';
                    break;
                case 2:
                    return 'Кривая Безье';
                    break;
                default:
                    return 'Линия';
                    break;
            }
        }
        function getDegreeByType(type){
            switch (parseInt(type)){
                case 0:
                    return '';
                    break;
                case 1:
                    return '²';
                    break;
                case 2:
                    return '³';
                    break;
                default:
                    return '';
                    break;
            }
        }

        for(var i=0; i<strokeInstace.lines.length; i++){
            var item = strokeInstace.lines[i];
            var tempObj = {
                object_id: item.object_id,
                object_title_text: getTitleByType(item.type),
                degree: getDegreeByType(item.type),
                pointsCount:item.points.length
            };
            lines.push(tempObj);
        }

        var data = {
            lines: lines
        };

        return Mustache.to_html(tpl, data);
    },

    getZonesPlaceCount: function(zoneName){
        var totalCount = 0;
        for(var i in mapEditor_map.squares){
            if(mapEditor_map.squares[i].areaGroup == zoneName){
                totalCount++;
            }
        }
        return totalCount;
    },
    populateZones: function(templateId, containerId){
        var container = $(uniqueEditor+' #'+containerId);
        container.html(populator.getZonesHtml(templateId));
    },
    getZonesHtml: function(templateId){
        var tpl = $(uniqueEditor+' #'+templateId).html();
        var zonesArr = [];

        for(var i=0; i<zones.list.length; i++){
            var item = zones.list[i];
            var tmpObj = {
                zone_id: item.zone_id,
                title: item.title,
                placesCount: populator.getZonesPlaceCount(item.title)//item.ids.length
            };
            zonesArr.push(tmpObj);
        }

        var data = {
            zones: zonesArr
        };

        return Mustache.to_html(tpl, data);

    },

    getImagesHtml: function(draggable, templateId){
        var tpl = $(uniqueEditor+' #'+templateId+'').html();
        var list = storage.images;
        var images = [];
        var isDraggable = (draggable)? 'draggable': '';



        for(var i=0; i< list.length; i++){
            var item = list[i];
            var tmpObj = {
                image_id: item.id,
                image_uid: item.id,
                /*image: item.data.src,*/
                image: 'upload/'+item.name,
                image_title: item.name,
                image_draggable: isDraggable
                //image_size: (item.size / 1024).toFixed(1)
            };
            images.push(tmpObj);
        }

        var data = {
            files: images
        };

        return Mustache.to_html(tpl, data);
    },
    getPlacesObjectsHtml: function(draggable, templateId){
        var tpl = $(uniqueEditor+' #'+templateId).html(),
            isDraggable = (draggable)? "draggable":"",
            objects = [];

        for(var i=0; i<editor.findLayer(placesLayerId).objects.length; i++){
            var item = editor.findLayer(placesLayerId).objects[i],
                type = item.type,
                tmpObj;

            if(type == 0){
                tmpObj = {
                    object_id: item.object_id,
                    object_title: item.object_title,
                    object_type: populator.getTypeById(type),
                    image: "html/contents/mapEditor/img/places.png",
                    image_title: 'места',
                    object_draggable: isDraggable,
                    placesCount: item.data.ids.length
                };
            }else if(type == 1 || type == 2){
                tmpObj = {
                    object_id: item.object_id,
                    object_title: item.object_title,
                    object_type: populator.getTypeById(type),
                    image: item.image,
                    image_title: item.image_title,
                    object_draggable: isDraggable,
                    value: item.image_title
                };
            }else if(type == 3){

            }else if(type == 4){

            }else{

            }

            objects.push(tmpObj);
        }

        var data = {
            objects: objects
        };
        return Mustache.to_html(tpl, data);
    },
    getObjectsHtml: function(draggable, templateId){
        var tpl = $(uniqueEditor+' #'+templateId).html(),
            isDraggable = (draggable)? "draggable":"",
            objects = [];



        for(var i=0; i<objectsList.list.length; i++){
            var item = objectsList.list[i],
                type = item.type,
                tmpObj;

            if(type == 0){
                tmpObj = {
                    object_id: item.object_id,
                    object_title: item.object_title,
                    object_type: populator.getTypeById(type),
                    image: "html/contents/mapEditor/img/places.png",
                    image_title: 'места',
                    object_draggable: isDraggable
                };
            }else if(type == 1 || type == 2){
                tmpObj = {
                    object_id: item.object_id,
                    object_title: item.object_title,
                    object_type: populator.getTypeById(type),
                    image: item.image,
                    image_title: item.image_title,
                    object_draggable: isDraggable
                };
            }else if(type == 3){
                tmpObj = {
                    object_id: item.object_id,
                    object_title: item.object_title,
                    object_type: populator.getTypeById(type),
                    image: "html/contents/mapEditor/img/stroke.png",
                    image_title: "Обводка",
                    object_draggable: isDraggable
                };
            }else if(type == 4){
                tmpObj = {
                    object_id: item.object_id,
                    object_title: item.object_title,
                    object_type: populator.getTypeById(type),
                    image: "html/contents/mapEditor/img/label.png",
                    image_title: "Надпись",
                    object_draggable: isDraggable
                };
            }else{

            }

            objects.push(tmpObj);
        }

        var data = {
            objects: objects
        };
        return Mustache.to_html(tpl, data);
    },
    populateStorage: function(containerId, draggable){
        var container = $(uniqueEditor+' #'+containerId);
        container.html(populator.getImagesHtml(draggable, 'listImagesTpl'));

        populator.preventImageDragging();
    },
    preventImageDragging: function(){
        for(var l=0; l< document.getElementsByTagName('img').length; l++){
            var img = document.getElementsByTagName('img')[l];
            img.ondragstart = function(){
                return false;
            }
        }
    },
    renderFull: function(){
        populator.populateLayers('layerItemTpl', false, 'layersUl');
        populator.populateStorage('filesList',false);

    },
    slideRightColumn: function(type){
        // type determines where to slide the rightСolumn, where true => slideLeft, false => slideBack;


        if($(uniqueEditor+' .rightColumnInner').length >1){
            if(inAnimate) return;
            inAnimate = true;
            if(type){
                $(uniqueEditor+' .rightColumnInner').eq(0).animate({
                    marginLeft: -50+"%"
                }, 200, function(){
                    inAnimate = false;
                });
            }else{
                $(uniqueEditor+' .rightColumnInner').eq(0).animate({
                    marginLeft: 0
                }, 200, function(){
                    inAnimate = false;
                });
            }

        }
    },
    canvasObscureManager: function(type, color, text, callback){
        if(type){
            if(text !== false){
                $(uniqueEditor+' #canvasObscure').html(text);
            }else{
                $(uniqueEditor+' #canvasObscure').html('');
            }
            if(color !== false){
                $(uniqueEditor+' #canvasObscure').css('backgroundColor', color);
            }else{
                $(uniqueEditor+' #canvasObscure').css('backgroundColor', '#148AE7');
            }
            $(uniqueEditor+' #canvasObscure').fadeIn(200, function(){
                if(typeof callback == 'function'){
                    callback();
                }
            });
        }else{
            $(uniqueEditor+' #canvasObscure').fadeOut(200, function(){
                if(typeof callback == 'function'){
                    callback();
                }
            });
        }


        /*if(co.length>0){
            if(type){
                if(text){
                    title.show(0);
                    title.html(text);
                }else{
                    title.hide(0);
                }

                co.fadeIn(200);
            }else{
                co.fadeOut(200);
            }
        }*/
    }
};

    var numeration = {
    serialize: function(){
        var o, xReverse, yReverse, line_start, place_start, line_fix, place_fix, invert_line_place;

        xReverse = $(uniqueEditor+' .nSRow .pr50.selectedSqr').attr('data-x');
        yReverse = $(uniqueEditor+' .nSRow .pr50.selectedSqr').attr('data-y');
        line_start = (numeration.validateInput($(uniqueEditor+ ' #rowStartNumeration')))? $(uniqueEditor+' #rowStartNumeration').val(): "";
        place_start = (numeration.validateInput($(uniqueEditor+' #colStartNumeration')))? $(uniqueEditor+' #colStartNumeration').val(): "";

        line_fix = ($(uniqueEditor+' #rowFixNumeric').val() == "")? undefined: $(uniqueEditor+' #rowFixNumeric').val();
        place_fix = ($(uniqueEditor+' #colFixNumeric').val() == "")? undefined: $(uniqueEditor+' #colFixNumeric').val();

        invert_line_place = ($(uniqueEditor+' #invertRowCol')[0].checked)? 1: 0;


        o = {
            xReverse:xReverse,
            yReverse:yReverse,
            line_start:line_start,
            place_start:place_start,
            line_fix:line_fix,
            place_fix:place_fix,
            invert_line_place: invert_line_place
        };

        mapEditor_map.container.trigger('fillNumbers',[o]);
    },
    validateInput: function(input){
        var regExpSpace = new RegExp(/^\s+$/),
            regExpNum = new RegExp(/^[0-9]+$/);
        if(regExpSpace.test(input.val()) || !regExpNum.test(input.val())){
            input.addClass('invalid');
            return false;
        }else{
            input.removeClass('invalid');
            return true;
        }
    }
};
        // Numeration handlers
    $(uniqueEditor).on('click', '.nSRow .pr50', function(){
        $(uniqueEditor+' .nSRow .pr50').removeClass('selectedSqr');
        $(this).addClass('selectedSqr');
        numeration.serialize();
    });
    $(uniqueEditor).on('input', '.startNumertaion', function(){
        numeration.validateInput($(this));
    });
    $(uniqueEditor).on('input', '.fixNumeric', function(){
        var parent, check, isChecked;
        parent = $(this).parents('.parentFixNumeric').eq(0);
        check = parent.find('.isFixNumeric');
        isChecked = check[0].checked;

       /* if(isChecked){
         numeration.validateInput($(this));
         }*/

    });
    $(uniqueEditor).on('change', '#invertRowCol', function(){
    });
    $(uniqueEditor).on('change', '.isFixNumeric', function(){
        var input = $(this).parents('.parentFixNumeric').find('.fixNumeric');
        if($(this)[0].checked){
            input.removeAttr('disabled');
        }else{
            input.val("").removeClass('invalid');
            input.attr('disabled', 'disabled');
        }
    });
    //numeration handlers END

    var objectAddDialog = {
    firePopup: function(params){
        bootbox.dialog({
            message: params.html,
            title: params.title,
            buttons: {
                success: {
                    label: "Подтвердить",
                    className: "blue",
                    callback: params.success
                },
                error: {
                    label: "Отмена",
                    className: "red",
                    callback: params.error
                }
            }

        });

    },
    getZonesData: function(){
        var tpl, title, success, error;

        tpl = $(uniqueEditor+' #zonesModalTpl').html();
        title = 'Создание зоны';
        success = function(){
            var name = $('#zoneTitle').val(),
                regExpSpace = new RegExp(/^\s+$/);

            if (regExpSpace.test(name) || name == "") name = 'Новая зона';

            var newObj;
            var params = {
                title: name,
                zone_id: MB.Core.guid()
            };
            var obj = {
                title: params.title,
                old_id: params.zone_id
            };

            mapEditor_map.container.trigger('addAreaGroup', obj);

            newObj = new Zone(params);
            zones.addZone(newObj);
            $(uniqueEditor).trigger('zonesUpdate');
        };
        error = function(){

        };

        return {html: tpl, title: title, success: success, error: error};
    },
    getPlacesData: function() {
        var tpl, title, success, error;

        tpl = $('#placesModalTpl').html();
        title = 'Создание группы мест';
        success = function () {

            var name = $('#objectTitle').val(),
                regExpSpace = new RegExp(/^\s+$/),
                regExpInt = new RegExp(/^[0-9]+$/);

            if (regExpSpace.test(name) || name == "") name = 'Группа мест';
            var newObj;
            var params = {
                    object_id: MB.Core.guid(),
                    object_title: name,
                    image: "html/contents/mapEditor/img/places_small.png",
                    visibility: {
                        visible_editor: true,
                        visible_admin:  true,
                        visible_casher: true,
                        visible_iframe: true,
                        visible_client_screen: true
                    }
                },
                rows = $('#rowsCount').val(),
                cols = $('#colsCount').val();



            if (regExpInt.test(rows) && regExpInt.test(cols)){


                populator.canvasObscureManager(true, 'rgba(45, 143, 228, 0.55)', 'Укажите позицию нового объекта', function(){
                    objectAddDialog.setNewObjectPosition(newObj, params, 0, 'placesLayer', {rows: rows, cols: cols}); //obj, params, type, layerId, otherParams
                });


            }else{
                alert('Заполните все поля');
            }


        };
        error = function () {
            console.log('place group adding was cancelled');
        };

        return {html: tpl, title: title, success: success, error: error};

    },
    setNewObjectPosition: function(obj, params, type, layerId, otherParams){

            canvasObscure.on('click', function(e){
                e = e || window.event;



                function getObjectInstanceByType(typeInt){
                    var instance;
                    switch (typeInt){
                        case 0:
                            instance = new PlacesGroupType(params);
                            break;
                        case 1:
                            instance = new BackgroundType(params);
                            break;
                        case 2:
                            instance = new ImageType(params);
                            break;
                        case 3:
                            instance = new StrokeType(params);
                            break;
                        case 4:
                            instance = new LabelType(params);
                            break;
                        default:
                            console.warn('incoming undefined type');
                            instance = false;
                            break;
                    }
                    return instance;
                }

                obj = getObjectInstanceByType(type);
                obj.x = e.offsetX;
                obj.y = e.offsetY;

                obj.layer_id = layerId;

                console.log(obj);

                mapEditor_map.container.trigger('addObject',[obj,function(result){
                    var data = JSON.parse(result);
                    if (data['results'][0].code && +data['results'][0].code!==0){
                        console.log('Ошибка: '+result);
                        return;
                    }
                    var object = data['results'][0];
                    obj.object_id = object.id;

                    switch (obj.type){
                        case 0:
                            var sq = {
                                row_count:otherParams.rows,
                                col_count:otherParams.cols,
                                object_id:object.id,
                                x:e.offsetX,
                                y:e.offsetY
                            };
                            mapEditor_map.container.trigger("addSquare",[sq,function(result){
                                var data = JSON.parse(result);
                                if (data['results'][0].code && +data['results'][0].code!==0){
                                    console.log('Ошибка: '+result);
                                    return;
                                }
                                editor.findLayer(placesLayerId).addObject(obj);
                                editor.findLayer(placesLayerId).setOpened(true);
                                mapEditor_map.reLoad();
                                $(uniqueEditor).trigger('layerUpdate');

                            }
                            ]);
                            break;
                        default:
                            var position = {
                                x:e.offsetX,
                                y:e.offsetY
                            };
                            obj.x = (position.x-mapEditor_map.XCoeff)/mapEditor_map.scaleCoeff;
                            obj.y = (position.y-mapEditor_map.YCoeff)/mapEditor_map.scaleCoeff;

                            editor.findLayer(layerId).addObject(obj);
                            editor.findLayer(layerId).setOpened(true);

                            mapEditor_map.fillRenderList([obj],function(){
                                mapEditor_map.render();
                            });

                            $(uniqueEditor).trigger('layerUpdate');
                            break;
                    }


                    canvasObscure.off('click');
                    canvasObscure.fadeOut(200);



                }]);

                //objectsList.addItem(obj);

            });

    },
    startStrokeCreate: function(){
        var rHtml = $(uniqueEditor+' #strokeCreateHtml').html();
        populator.canvasObscureManager(true, 'rgba(66, 139, 202, 0.7)', 'Ставьте точки');
        $(uniqueEditor+' #offRightColumnInner').html(rHtml);
        selectionMngInited = false;
        $(uniqueEditor+' #toOffRColumn').show(0);
        $(uniqueEditor+' #editStrokeTypeSwitch').bootstrapSwitch({
            size: 'large',
            animate: true,
            onColor: 'primary',
            offColor: 'primary',
            onText: '<i class="fa fa-dot-circle-o"></i>',
            offText: '<i class="fa fa-edit"></i>'
        });
        uiTabs();
        strokeHandlersInit();
        populator.slideRightColumn(true);


    },
    getLabelData: function(){
        var tpl, title, success, error;

        tpl = $(uniqueEditor+' #labelsModalTpl').html();
        title = 'Создание надписи';
        success = function(){
            var name = $('#labelTitle').val(),
                regExpSpace = new RegExp(/^\s+$/);

            if (regExpSpace.test(name) || name == "") name = 'Новая надпись';



            var newObj;
            var params = {
                object_title: name,
                value: name,
                object_id: MB.Core.guid(),
                visibility: {
                    visible_editor: true,
                    visible_admin:  true,
                    visible_casher: true,
                    visible_iframe: true,
                    visible_client_screen: true
                },
                fontFamily: getFontFamilyByValue(LabelTypeMiniModel.font_family),
                fontSize: LabelTypeMiniModel.font_size,
                color: LabelTypeMiniModel.font_color,
                fontStyle: getFontStyleByValue(LabelTypeMiniModel.font_style).fontStyle,
                fontWeight: getFontStyleByValue(LabelTypeMiniModel.font_style).fontWeight
            };

            // FOR DB
            /*var obj = {
                title: params.title,
                old_id: params.zone_id
            };

            mapEditor_map.container.trigger('addAreaGroup', obj);*/



            newObj = new LabelType(params);
            objectAddDialog.firePopup(objectAddDialog.getSelectLayerData(newObj, params, 4, true));

        };
        error = function(){

        };

        return {html: tpl, title: title, success: success, error: error};


    },
    getSelectLayerData: function(object, params, type, isSettable){ // Выбор слоя, в который будет добавлен объект
        var tpl, outHtml, title, success, error;
        tpl = $(uniqueEditor+' #layersChooseTpl').html();

        var layersArr = [];
        for(var i in editor.layers){
            var layer = editor.layers[i];
            if(layer.id != 'placeLayer'){
                var tmpObj = {
                    layer_id: layer.id,
                    title: layer.title
                };
                layersArr.push(tmpObj);
            }

        }
        var data = {
            layers: layersArr
        };

        outHtml = Mustache.to_html(tpl, data);
        title = 'Выбор слоя';
        success = function(){
            var selectedLayer = $('#layersChooseList li.selected').attr('data-id');
            object.layer_id = selectedLayer;

            if(isSettable){
                populator.canvasObscureManager(true, 'rgba(45, 143, 228, 0.55)', 'Укажите позицию нового объекта', function(){
                    objectAddDialog.setNewObjectPosition(object, params, parseInt(type), selectedLayer, {});
                });
            }else{
                editor.findLayer(selectedLayer).addObject(object);
                $(uniqueEditor).trigger('layerUpdate');
            }



        };
        error = function(){

        };

        return {html: outHtml, title: title, success: success, error: error};
    }
};

    // STROKES HANDLERS
    var strokeHandlersInit = function(){
    var strokeParams = {
        object_title: 'Обводка',
        object_id: MB.Core.guid(),
        visibility: {
            visible_editor: true,
            visible_admin:  true,
            visible_casher: true,
            visible_iframe: true,
            visible_client_screen: true
        }
    };
    if(strokeInstace === undefined){
        strokeInstace = new StrokeType(strokeParams);
    }
    modeSetPoints = true;

    function reinitMoreNeeded(){
        function getHowMoreByLineId(id){
            var item = strokeInstace.findLine(id);
            var type = item.type;
            var result;
            var Pointslength = parseInt(item.points.length);
            switch(parseInt(type)){
                case 0:
                    if(Pointslength == 0){
                        result = 2;
                    }else{
                        if((Pointslength % 2) == 1){
                            result = 1;
                        }else{
                            result = 0;
                        }

                    }
                    return result;
                    break;
                case 1:
                    if(Pointslength == 0){
                        result = 3;
                    }else{
                        if((Pointslength % 3) == 1){
                            result = 2;
                        }else if((Pointslength % 3) == 2){
                            result = 1;
                        }else if((Pointslength % 3) == 0){
                            result = 0;
                        }
                    }
                    return result;
                    break;
                case 2:
                    if(Pointslength == 0){
                        result = 4;
                    }else{
                        var afterCommaValue = Pointslength % 4;

                        if(afterCommaValue == 1){
                            result = 3;
                        }else if(afterCommaValue == 2){
                            result = 2;
                        }else if(afterCommaValue == 3){
                            result = 1;
                        }else{
                            result = 0;
                        }
                    }
                    return result;
                    break;
                default:
                    return 0;
                    break;
            }
            //strokeInstace.findLine(id).points.length
        }
        if(globalStrokeLine !== undefined){
            $(uniqueEditor+' #dotsNeeded').html(getHowMoreByLineId(globalStrokeLine.id));
        }
    }

    $(uniqueEditor+' #editStrokeTypeSwitch').on('switchChange.bootstrapSwitch', function(event, state){
        var rLabel = $(uniqueEditor+' .switchRightLabel'),
            lLabel = $(uniqueEditor+' .switchLeftLabel');

        if(state){
            rLabel.removeClass('highlight');
            lLabel.addClass('highlight');
            modeSetPoints = true;
        }else{
            rLabel.addClass('highlight');
            lLabel.removeClass('highlight');
            modeSetPoints = false;
        }
    });

    $(uniqueEditor+' #lineType li').on('click', function(){
        reinitMoreNeeded();
    });

    $(uniqueEditor+' #canvasObscure').on('click', function(e){
        e = e || window.event;

        if(modeSetPoints){

            var tempLineType = $(uniqueEditor+' #lineType li.selected').attr('data-line-type-id');

            var lineParams;
            var params = {
                x: e.offsetX,
                y: e.offsetY,
                id: MB.Core.guid(),
                sortNo: 0,
                type: tempLineType

            };

            if(globalStrokeLine === undefined){
                globalStrokeLine = new StrokeLine(params);
                globalStrokeType = tempLineType;
                strokeInstace.addLine(globalStrokeLine);
            }else{
                if(globalStrokeType != tempLineType){
                    globalStrokeLine = new StrokeLine(params);
                    globalStrokeType = tempLineType;
                    strokeInstace.addLine(globalStrokeLine);
                }
            }

            var newDot = new StrokePoint(params);
            globalStrokeLine.addPoint(newDot);
            reinitMoreNeeded();
            $(uniqueEditor).trigger('strokeUpdate');
        }
    });
};

    var selectionManager = {
    setOffRightColumn: function(){
        var rHtml = $(uniqueEditor+' #placesManager').html();

        if(!selectionMngInited){

            $(uniqueEditor+' #offRightColumnInner').html(rHtml);
            populator.populatePlacesObjects('objectSimpleTpl', false, 'determineGroupList');

            populator.populateZones('zonesTpl', 'zonesList');

            $(uniqueEditor+' #toOffRColumn').show(0);
            uiTabs();
            $(uniqueEditor+' input:not(".noUniform")[type="checkbox"]').uniform();

            populator.slideRightColumn(true);

            selectionMngInited = true;
        }
    }
};

    mapEditor_map.container.on('addToSelection', function(e, selection){
    //selectionManager.setOffRightColumn();
});

    $(uniqueEditor).on('click', '#backToMainRColumn', function(){
    populator.slideRightColumn(false);
});

    $(uniqueEditor).on('click', '.backToMainRColumn', function(){
    populator.slideRightColumn(false);
});

    $(uniqueEditor).on('click', '#toOffRColumn', function(){
    selectionManager.setOffRightColumn();
    populator.slideRightColumn(true);
    populator.canvasObscureManager(false);
});


    function dialogSelectFile(type){
    var insertTitle = '<div class="padder5"><input type="text" class="form-control bigInput marBot10 " placeholder="Введите наименование объекта" id="objectTitle"/></div>';
    bootbox.dialog({
        message: insertTitle+'<div class="row newSelectable">'+populator.getImagesHtml(false, "listImagesTpl")+'</div>',
        title: "Создание объекта",
        buttons: {
            success: {
                label: "Выбрать",
                className: "blue",
                callback:function(){
                    var name = $('#objectTitle').val();
                    var regExp = new RegExp(/^\s+$/);
                    var imageId = $('.modal-dialog .uploadedFile.selected').attr('data-file-id');  //dirty

                    if(regExp.test(name) || name == ""){
                        name = 'Новый объект';
                    }

                        var newObject = {};
                        var params = {
                            object_id : MB.Core.guid(),
                            object_title : name,
                            image : 'upload/'+storage.getItem(imageId).name,
                            image_title : storage.getItem(imageId).name,
                            layerId : '',
                            x : 100,
                            y : 100,
                            scaleCoeff : 1,
                            opacity : 1,
                            rotation : 0,
                            value: storage.getItem(imageId).name,
                            visibility: {
                                visible_editor: true,
                                visible_admin:  true,
                                visible_casher: true,
                                visible_iframe: true,
                                visible_client_screen: true
                            }


                        };
                        /*
                        switch (parseInt(type)){
                            case 1:
                                newObject = new BackgroundType(params);
                                break;
                            case 2:
                                newObject = new ImageType(params);
                                break;
                        }*/

                    objectAddDialog.firePopup(objectAddDialog.getSelectLayerData(newObject, params, type, true));
                }
            },
            error: {
                label: "Отмена",
                className: "red",
                callback:function(){
                    //alert('canceled')
                }
            }
        }
    });
    layerUi.restyleImages();
}

    var mEvent  = {
    x: 0,
    y: 0,
    setX: function(e){
        mEvent.x = e.pageX;
    },
    setY: function(e){
        mEvent.y = e.pageY;
    },
    isMouseInRect: function(rect){
        return mEvent.y > rect.top && mEvent.y < (rect.top + rect.height) && mEvent.x > rect.left && mEvent.x < (rect.left + rect.width);
    },
    isMouseWasInRect: function(rect){

    }

};

    $(uniqueEditor).on('mousemove', function(e){
        e = e || window.event;
        mEvent.setX(e);
        mEvent.setY(e);

    });

    $(uniqueEditor).on('onLayersRendered', function(){

        //var liCollection = document.getElementById('layersUl').children;
        var liCollection =  $(uniqueEditor+ '#layersUl li');
        for(var i=0; i<liCollection.length; i++){
            var layer = liCollection[i],
                layerId = layer.attr('data-id'),
                rect = layer.getBoundingClientRect();

            var objLayer = editor.findLayer(layerId);
            objLayer.rect = {
                top: rect.top, // dirty
                left: rect.left,
                height: rect.height,
                width: rect.width
            };
        }

        $(uniqueEditor+" .opacitySlider").ionRangeSlider({
            min: 0,
            max: 100,
            type: 'single',
            step: 1,
            postfix: " %",
            prettify: false,
            hasGrid: false,
            onFinish: function(obj){
                var item, item_id, modelObj;
                var isObject = obj.input.parents('.objectItem').length > 0;

                if(isObject){
                    item = obj.input.parents('.objectItem');
                    item_id = item.attr('data-id');
                    modelObj = editor.findObject(item_id);
                }else{
                    item = obj.input.parents('.layerItem');
                    item_id = item.attr('data-id');
                    modelObj = editor.findLayer(item_id);
                }
                modelObj.opacity = obj.fromNumber;
            }
        });

        $(uniqueEditor+' input[type="checkbox"]:not(".noUniform")').uniform();

        $(uniqueEditor+' #parseEditLabelType select.MEselect2').select2();
        $(uniqueEditor+' #parseEditLabelType select.MEcolorpicker').colorpicker();

        $(uniqueEditor+' #parseEditLabelType input').on('input', function(){
            var object_id = $(this).parents('.objectItem').attr('data-id');
            var ev = $(uniqueEditor+' #parseEditLabelType #label_fontColor').val();
            var parent = $(this).parents('#parseEditLabelType').eq(0);
            LabelTypeMiniModel.parseValues(parent, ev);
            LabelTypeMiniModel.submitChanges(object_id);
        });
        $(uniqueEditor+' #parseEditLabelType select').on('change', function(){
            var object_id = $(this).parents('.objectItem').attr('data-id');
            var ev = $(uniqueEditor+' #parseEditLabelType #label_fontColor').val();
            var parent = $(this).parents('#parseEditLabelType').eq(0);
            LabelTypeMiniModel.parseValues(parent, ev);
            LabelTypeMiniModel.submitChanges(object_id);
        });
        $(uniqueEditor+' #parseEditLabelType #label_fontColor').colorpicker().on('changeColor',function(ev){
            var object_id = $(this).parents('.objectItem').attr('data-id');
            var parent = $(this).parents('#parseEditLabelType').eq(0);
            LabelTypeMiniModel.parseValues(parent, ev);
            LabelTypeMiniModel.submitChanges(object_id);
        });
    });

    $(uniqueEditor).on('click', '#addLayer', function(){
        var params ={
            id: guid(),
            selected: false,
            title: ''
        };

        var enterNameHtml = '<input type="text" class="bigInput form-control" id="newLayerName"/>';

        bootbox.dialog({
            message: enterNameHtml,
            title: "Введите имя слоя",
            buttons: {
                success: {
                    label: "Подтвердить",
                    className: "blue",
                    callback:function(){
                        var name = $('#newLayerName').val();
                        var regExp = new RegExp(/^\s+$/);
                        var layersCount = editor.layers.length;

                        if(regExp.test(name) || !name || name == ""){
                            params.title = 'Новый слой '+(layersCount+1);
                        }else{
                            params.title = name;
                        }

                        var layer = new MELayer(params);
                        editor.addLayer(layer);
                        mapEditor_map.container.trigger('addLayer',[layer,function(result){
                            var data = JSON.parse(result);
                            if (data['results'][0].code && +data['results'][0].code!==0){
                                console.log('Ошибка: '+result);
                                return;
                            }
                            editor.findLayer(data['results'][0].old_id).id = data['results'][0].id;
                            $(uniqueEditor).trigger('layerUpdate');
                        }]);
                        /*mapEditor_map.container.on('addLayer_callback',function(e,obj){
                            $(document).trigger('layerUpdate');
                        });*/
                    }
                },
                error: {
                    label: "Отмена",
                    className: "red",
                    callback:function(){
                        console.log('layer adding canceled');
                    }
                }
            }
        });




    });

    $(uniqueEditor).on('click', '#removeLayer', function(){
        editor.removeLayers();
        $(uniqueEditor).trigger('layerUpdate');
    });

    $(uniqueEditor).on('click', '.moveUp', function(e){
        e = e || window.event;
        e.stopPropagation();

        var id = $(this).parents('li').attr('data-id');
        editor.moveUp(id);
        $(uniqueEditor).trigger('layerUpdate');
    });

    $(uniqueEditor).on('click', '.moveDown', function(e){
        e = e || window.event;
        e.stopPropagation();

        var id = $(this).parents('li').attr('data-id');
        editor.moveDown(id);
        $(uniqueEditor).trigger('layerUpdate');
    });

    $(uniqueEditor).on('click', '#addObject', function(){
        var selectedType;

        $(uniqueEditor).trigger('layerUpdate');
        var selectTypeHtml = $(uniqueEditor+' #chooseObjectType').html();
        bootbox.dialog({
            message: selectTypeHtml,
            title: "Выберите тип объекта",
            buttons: {
                success: {
                    label: "Выбрать",
                    className: "blue hiddenImp confirmType",
                    callback:function(){

                        var type = selectedType;

                        if(type == 1 || type == 2){ // background or Image
                            $(uniqueEditor).trigger('layerUpdate');
                            dialogSelectFile(type);
                        }else if(type == 0){ // Places
                            objectAddDialog.firePopup(objectAddDialog.getPlacesData());
                        }else if(type == 3){ // Strokes
                            objectAddDialog.startStrokeCreate();
                        }else if(type == 4){ // Labels
                            objectAddDialog.firePopup(objectAddDialog.getLabelData());
                            $('select.MEselect2').select2();
                            $('.MEcolorpicker').colorpicker();
                            $('#parseMeLabelType input').on('input', function(){
                                var ev = $('#parseMeLabelType #label_fontColor').val();
                                LabelTypeMiniModel.parseValues($('#parseMeLabelType'), ev);
                                LabelTypeMiniModel.renderPreview();
                            });
                            $('#parseMeLabelType select').on('change', function(){
                                var ev = $('#parseMeLabelType #label_fontColor').val();
                                LabelTypeMiniModel.parseValues($('#parseMeLabelType'), ev);
                                LabelTypeMiniModel.renderPreview();
                            });
                            $('#parseMeLabelType #label_fontColor').colorpicker().on('changeColor',function(ev){
                                LabelTypeMiniModel.parseValues($('#parseMeLabelType'), ev);
                                LabelTypeMiniModel.renderPreview();
                            });

                        }else{ // some shit
                            throw new Error('unforeseen new object type');
                        }

                    }
                },
                error: {
                    label: "Отмена",
                    className: "red",
                    callback:function(){
                        //alert('canceled')
                    }
                }
            }
        });

        $('#selectObjectType li').on('click', function(){
            selectedType = $(this).attr('data-type');
            $(this).parents('.modal-dialog').find('.confirmType').trigger('click');
            //$('#selectObjectType li').off('click');
        });
    });

    $(uniqueEditor).on('click', '#fileUpload', function(){

        console.log('here');

    var container = $(uniqueEditor+' #filesList');
    var listImagesTpl = $(uniqueEditor+' #listImagesTpl').html();
    //storage.clear();
    il.start({
        success:function(fileUID){

            var tmpObj = {
                data: fileUID.base64Data,
                name: fileUID.name,
                id:fileUID.uid
            };
            storage.addItem(tmpObj);
            mapEditor_map.container.trigger("addFile",[{name:fileUID.name,old_id:fileUID.uid}]);

        }
    });


});

    $(uniqueEditor).on('click', '.deleteFile', function(){
        var id = $(this).parents('.uploadedFile').attr('data-file-id');
        storage.removeItem(id);
        $(uniqueEditor).trigger('ImagesUpdate');
        mapEditor_map.container.trigger("removeFile",[[id]]);
    });

    mapEditor_map.container.on('removeFile_callback', function(e, obj){
        console.log('file deleted on server');
    });

    $(uniqueEditor).on('click', '#saveStroke', function(){

    if(strokeInstace !== undefined){
        objectAddDialog.firePopup(objectAddDialog.getSelectLayerData(strokeInstace, undefined, 3, false));

        modeSetPoints = false;
        globalStrokeType = undefined;
        globalStrokeLine = undefined;
        strokeInstace = undefined;
        populator.canvasObscureManager(false, false, false);
        populator.slideRightColumn(false);
        $(uniqueEditor).trigger('objectsUpdate');

    }
});

    $(uniqueEditor).on('click', '#cancelStroke', function(){

    if(strokeInstace !== undefined){

        modeSetPoints = false;
        globalStrokeType = undefined;
        globalStrokeLine = undefined;
        strokeInstace = undefined;
        populator.canvasObscureManager(false, false, false);
        populator.slideRightColumn(false);
        $(uniqueEditor).trigger('objectsUpdate');

    }
});

    // Zones handlers
    $(uniqueEditor).on('click', '#addZone', function(){
    objectAddDialog.firePopup(objectAddDialog.getZonesData());
});

    $(uniqueEditor).on('click', '#setToZone', function(){
    if($(uniqueEditor+' #zonesList li.selected').length >0){
        var selectedZoneId = $(uniqueEditor+' #zonesList li.selected').attr('data-id');

        if(mapEditor_map.selection.length > 0){
            zones.removeIds(mapEditor_map.selection);
            zones.findZone(selectedZoneId).addIds(mapEditor_map.selection);

            var obj = {
                title: zones.findZone(selectedZoneId).title,
                id: selectedZoneId
            };

            mapEditor_map.container.trigger('setAreaGroup', [obj]);

            $(uniqueEditor).trigger('zonesUpdate');
        }
    }

});

    $(uniqueEditor).on('click', '#removeZone', function(){
    if($(uniqueEditor+' #zonesList li.selected').length >0){

        var selectedZoneId = $(uniqueEditor+' #zonesList li.selected').attr('data-id'),
            selectedZoneTitle = $(uniqueEditor+' #zonesList li.selected .titlePlace').html(),
            success = function(){
                zones.removeZone(selectedZoneId);
                mapEditor_map.container.trigger('removeAreaGroup',[[selectedZoneId]]);
                $(uniqueEditor).trigger('zonesUpdate');
            },
            error = function(){

            };
        objectAddDialog.firePopup({html: 'Вы уверены?', title:'Удалить зону "'+selectedZoneTitle+'"', success: success, error: error});
    }else{
        alert('Выберите зону');
    }

});


    //scales handlers
    $(uniqueEditor).on('click', '#xMinusBtn', function(){
    mapEditor_map.container.trigger('xScale',[-5]);
});
    $(uniqueEditor).on('click', '#xPlusBtn', function(){
    mapEditor_map.container.trigger('xScale',[5]);
});

    $(uniqueEditor).on('click', '#yMinusBtn', function(){
    mapEditor_map.container.trigger('yScale',[-5]);
});

    $(uniqueEditor).on('click', '#yPlusBtn', function(){
    mapEditor_map.container.trigger('yScale',[5]);
});
    //scales handlers END

    //placeGroups handlers
    $(uniqueEditor).on('click', '#setToGroup', function(){
        if($(uniqueEditor+' #determineGroupList li.selected').length >0){
            var selectedObjectId = $(uniqueEditor+' #determineGroupList li.selected').attr('data-id');

            if(mapEditor_map.selection.length > 0){
                editor.findLayer(placesLayerId).removeIds(mapEditor_map.selection, function(clearedObject){
                    /*var objects = [];
                    for(var i in clearedObject){
                        objects.push({
                            hall_scheme_object_id:clearedObject[i].object_id,
                            value: clearedObject[i].data.ids.join(',')
                        })
                    }
                    mapEditor_map.container.trigger("modifyObject",[objects]);*/
                });
                editor.findObject(selectedObjectId).addIds(mapEditor_map.selection, function(obj){
                    var sqs = [];
                    for (var k in mapEditor_map.selection){
                        mapEditor_map.squares[mapEditor_map.selection[k]].object_id = selectedObjectId;
                        sqs.push({
                            hall_scheme_item_id:mapEditor_map.selection[k],
                            HALL_SCHEME_OBJECT_ID:selectedObjectId
                        })

                    }

                    mapEditor_map.container.trigger("modifySquare",[sqs]);
                });
                editor.findLayer(placesLayerId).clearEmptyPlaceObjects(function(object_ids){
                    mapEditor_map.container.trigger('removeObject',[object_ids,function(){
                        mapEditor_map.setLayout(function(){
                            mapEditor_map.reLoadLayout(function(){
                                mapEditor_map.render();
                            });
                        });
                    }]);
                });
                $(uniqueEditor).trigger('layerUpdate');
            }
        }
    });

    /*$(document).on('objectUpdate', function(){
    populator.renderFull();
    layerUi.restyleImages();
});*/

    //GLOBAL HANDLERS

    $(uniqueEditor).on('layerUpdate', function(){
    //$(document).off('mouseup');
    populator.populateLayers('layerItemTpl', false, 'layersUl');
    populator.populatePlacesObjects('objectSimpleTpl', false, 'determineGroupList');
    layerUi.restyleImages();
    $(uniqueEditor).trigger('anyUpdate', [{source: 'layer'}]);
});

    $(uniqueEditor).on('objectsUpdate', function(){
    populator.populateObjects('objectsBaseTpl', true, 'objectsList');
    $(uniqueEditor).trigger('anyUpdate', [{source: 'objects'}]);
});

    $(uniqueEditor).on('zonesUpdate', function(){
    populator.populateZones('zonesTpl', 'zonesList');
    $(uniqueEditor).trigger('anyUpdate', [{source: 'zones'}]);
});

    $(uniqueEditor).on('strokeUpdate', function(){
    populator.populateStrokes('linesSimpleTpl', 'linesList');
    $(uniqueEditor).trigger('anyUpdate', [{source: 'stroke'}]);
});

    $(uniqueEditor).on('any1Update', function(e, params){
    var newState = new Object();
    newState = {
        obj: clone(editor),
        item: params.source
    };
    undo.unshift(newState);
});

    $(uniqueEditor).on('click', '#Btn6', function(){
    $(uniqueEditor).trigger('any1Update', [{source:'layer'}]);
});


    $(uniqueEditor).on('ImagesUpdate', function(){
    populator.populateStorage('filesList',false);
    layerUi.restyleImages();
});

    $(uniqueEditor).on('onObjectDropToLayer', function(){

    var layer = editor.findLayer(DnDObject.overLayer),
        obj = objectsList.getItem($(DnDObject.elem).attr('data-object-id'));

    layer.addObject(obj);

    objectsList.removeItem(DnDObject.elem.getAttribute('data-object-id'));

    DnDObject.setDragging(false, function(){});
    DnDObject.setElem(undefined);
    DnDObject.overLayer = undefined;

    $(uniqueEditor).trigger('layerUpdate');
    $(uniqueEditor).trigger('objectsUpdate');

});

    $(uniqueEditor).on('inlineEditingUpdate', function(e, eParams){
    //elem: inpElem, value : val
    console.log(eParams.elem, eParams.value);
    var isObject, objOrLayer, objOrLayerId;

    if(eParams.elem.parents('.zonesItem').eq(0).length>0){
        var zoneId = eParams.elem.parents('.zonesItem').attr('data-id');
        var obj = {
            title: eParams.value,
            zone_id: zoneId
        };

        zones.findZone(zoneId).title = eParams.value;

        mapEditor_map.container.trigger('modifyAreaGroup', [obj]);

    }else{
        isObject = (eParams.elem.parents('.objectItem').eq(0).length>0);
        objOrLayer = (isObject)? eParams.elem.parents('.objectItem').eq(0): eParams.elem.parents('.layerItem').eq(0);
        objOrLayerId = objOrLayer.attr('data-id');

        //console.log(eParams);

        if(isObject){
            editor.findObject(objOrLayerId).setObjectTitle(eParams.value);
        }else{
            editor.findLayer(objOrLayerId).setTitle(eParams.value);
        }
    }
});

    $(uniqueEditor).on('deleteSquares', function(e, ids){

    editor.findLayer(placesLayerId).removeIds(ids);
    editor.findLayer(placesLayerId).clearEmptyPlaceObjects(function(object_ids){
            mapEditor_map.container.trigger('removeObject',[object_ids,function(){
                mapEditor_map.setLayout(function(){
                    mapEditor_map.reLoadLayout(function(){
                        mapEditor_map.render();
                    });
                });
            }]);
    });
    $(uniqueEditor).trigger('layerUpdate');
});

    $(uniqueEditor).on('click', '#removeSelected', function(){
    mapEditor_map.container.trigger('removeSquare',[mapEditor_map.selection]);
});

    //Clear selection
    $(uniqueEditor).on('click', '.deSelect', function(){
    mapEditor_map.clearSelection(true);
    mapEditor_map.render();
});



    mapEditor_map.container.on('addFile_callback',function(e,obj){
    for (var k in obj.old_id){


        storage.getItem(obj.old_id[k]).id = obj.id[k];
    }
    $(uniqueEditor).trigger('ImagesUpdate');
});

    mapEditor_map.container.on('addSquare_callback',function(e,obj){
  /*  debugger;
    var ids = obj.id;
    var object_old_id = obj.object_old_id;
    editor.findObject(object_old_id[0]).addIds(ids);*/
    populator.populatePlacesObjects('objectSimpleTpl', false, 'determineGroupList');
});

    mapEditor_map.container.on('addAreaGroup_callback', function(e,obj){
        for(var i=0; i<zones.list.length; i++){
            var zone = zones.list[i];

            for(var k=0; k< obj.old_id.length; k++){
                var old = obj.old_id[k];
                if(zone.zone_id == old){
                    zone.zone_id = obj.id[k];
                }
            }
        }
        $(uniqueEditor).trigger('zonesUpdate');
    });
    //mapEditor_map.container.on('loadAreaGroup_callback',function(e,obj){
    mapEditor_map.container.on('loadAreaGroup_callbackFull',function(e,obj){
        for (var k in obj){
            var params = {
                title:obj[k].NAME,
                zone_id:obj[k].AREA_GROUP_ID
            };
            var newObj = new Zone(params);
            zones.addZone(newObj);

        }
    });

    mapEditor_map.container.on('getFiles_callback', function(e, obj){

   for(var key in obj){

       var img = new Image();
       img.src = 'upload/'+obj[key].FILENAME;

       var tmpObj = {
           data: img,
           id:obj[key].HALL_SCHEME_FILE_LIST_ID,
           name: obj[key].FILENAME
       };

        storage.addItem(tmpObj);
       $(uniqueEditor).trigger('ImagesUpdate');
   }

});

    var layerUi = {
    expandLayerObjects: function(id){
        var layer = $(uniqueEditor+' .layerItem[data-id="'+id+'"]'),
            objectsParent = layer.find('.innerDD');

        objectsParent.slideDown(100, function(){
            editor.findLayer(id).isOpened = true;
            mediator.onLayersRendered();
        });

    },
    collapseLayerObjects: function(id){
        var layer = $(uniqueEditor+' .layerItem[data-id="'+id+'"]'),
            objectsParent = layer.find('.innerDD');

        objectsParent.slideUp(100, function(){
            editor.findLayer(id).isOpened = false;
            mediator.onLayersRendered();
        });

    },
    expandLayerSettings: function(id){
        var layerItem = $(uniqueEditor+' .layerItem[data-id="'+id+'"]'),
            settingsDD = layerItem.find('.settingsDD').eq(0);

        settingsDD.slideDown(100, function(){
            editor.findLayer(id).isSettingsOpened = true;
            mediator.onLayersRendered();
        });

    },
    collapseLayerSettings: function(id){
        var layerItem  = $(uniqueEditor+' .layerItem[data-id="'+id+'"]'),
            settingsDD = layerItem.find('.settingsDD').eq(0);

        settingsDD.slideUp(100, function(){
            editor.findLayer(id).isSettingsOpened = false;
            mediator.onLayersRendered();
        });

    },
    expandObjectSettings: function(id){
        var objectItem = $(uniqueEditor+' .objectItem[data-id="'+id+'"]'),
            settingsDD = objectItem.find('.objectSettings');

        settingsDD.slideDown(100, function(){
            for(var i=0; i<editor.layers.length; i++){
                var layer = editor.layers[i];
                for(var k=0; k< layer.objects.length; k++){
                    var obj = layer.objects[k];
                    if(obj.object_id == id){
                        obj.isSettingsOpened = true;
                    }
                }
            }
            mediator.onLayersRendered();
        });

    },
    collapseObjectSettings: function(id){
        var objectItem = $(uniqueEditor+' .objectItem[data-id="'+id+'"]'),
            settingsDD = objectItem.find('.objectSettings');

        settingsDD.slideUp(100, function(){
            for(var i=0; i<editor.layers.length; i++){
                var layer = editor.layers[i];
                for(var k=0; k< layer.objects.length; k++){
                    var obj = layer.objects[k];
                    if(obj.object_id == id){
                        obj.isSettingsOpened = false;
                    }
                }
            }
            mediator.onLayersRendered();
        });

    },

    toggleLayerVisibility: function(id, state, icon){
        var layer = editor.findLayer(id),
            htmlLayer = $(uniqueEditor+' .layerItem[data-id="'+id+'"]');

        if(state){
            layer.isVisible = true;
            icon.addClass('on');
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
            htmlLayer.removeClass('faded');
        }else{
            layer.isVisible = false;
            icon.removeClass('on');
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
            htmlLayer.addClass('faded');
        }
        mediator.onLayersRendered();
    },
    toggleObjectVisibility: function(layerId, objectId, state, icon){
        var object = editor.findLayer(layerId).findObject(objectId);

        if(state){
            object.isVisible = true;
            icon.addClass('on');
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
        }else{
            object.isVisible = false;
            icon.removeClass('on');
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
        }
        mediator.onLayersRendered();
    },

    createGlow: function(layerId, callback){
        $(uniqueEditor+' .layerItem[data-id="'+layerId+'"] .DnDGlow').stop(true,true).fadeIn(100);
        callback();
    },
    removeGlow: function(layerId, callback){
        $(uniqueEditor+' .layerItem[data-id="'+layerId+'"] .DnDGlow').stop(true,true).fadeOut(100);
        callback();
    },

    restyleImages: function(){
        return;
        var imgArr = [];

        for(var i=0; i< $(uniqueEditor+' #layersUl img').length;i++){
            imgArr.push($(uniqueEditor+' #layersUl img').eq(i));
        }
        for(var k=0; k<$(uniqueEditor+' #objectsList img').length; k++){
            imgArr.push($(uniqueEditor+' #objectsList img').eq(k));
        }

        for(var im=0; im<imgArr.length;im++){
            var image = imgArr[im],
                height = image.height(),
                width = image.width();

            if(height >= width){
                image.removeClass('stretchHeight').addClass('stretchWidth');
            }else{
                image.removeClass('stretchWidth').addClass('stretchHeight');
            }
        }
        /*for(var i=0; i<$('.uploadedFile img').length; i++){
            var img = $('.uploadedFile img').eq(i),
                height = img.height(),
                width = img.width();

            if(height >= width){
                img.removeClass('stretchHeight').addClass('stretchWidth');
            }else{
                img.removeClass('stretchWidth').addClass('stretchHeight');
            }
        }*/
    } // unused
};

    $(uniqueEditor).on('click', '.layerSettingsToggler', function(e){      //unused
        e = e||window.event;
        e.stopPropagation();

        var parent = $(this).parents('.layerItem').eq(0),
            objectId = parent.attr('data-id'),
            cog = $(this).find('i').eq(0),
            state = cog.hasClass('on');

        if(state){
            cog.removeClass('on');
            layerUi.collapseLayerSettings(objectId);
        }else{
            cog.addClass('on');
            layerUi.expandLayerSettings(objectId);
        }

    });

    $(uniqueEditor).on('click', '.objectSettingsToggler', function(e){
        e = e||window.event;
        e.stopPropagation();

        var parent = $(this).parents('.objectItem').eq(0),
            objectId = parent.attr('data-id'),
            cog = $(this).find('i').eq(0),
            state = cog.hasClass('on');

        if(state){
            cog.removeClass('on');
            layerUi.collapseObjectSettings(objectId);
        }else{
            cog.addClass('on');
            layerUi.expandObjectSettings(objectId);
        }
    });

    $(uniqueEditor).on('click', '.copyLayer', function(e){
        e = e||window.event;
        e.stopPropagation();

        var parent = $(this).parents('.layerItem').eq(0),
            objectId = parent.attr('data-id');

    });

    $(uniqueEditor).on('click', '.copyObject', function(e){
        e = e || window.event;
        e.stopPropagation();

        var parent = $(this).parents('.objectItem').eq(0),
            layerId = parent.parents('.layerItem').attr('data-id'),
            objectId = parent.attr('data-id'),
            obj = editor.findObject(objectId),
            objectType = obj.type;

        var params;
        var newObj;

        switch(parseInt(objectType)){
            case 0:
                params = {
                    selected : obj.selected,
                    object_id : MB.Core.guid(),
                    object_old_id : undefined,
                    object_title : obj.object_title + '(Копия)',
                    image : obj.image,
                    isOpened : obj.isOpened,
                    isVisible : obj.isVisible,
                    isVisibleCheckbox : obj.isVisibleCheckbox,
                    isObjectSettingsOpened : obj.isObjectSettingsOpened,
                    visibility: {
                        visible_editor: true,
                        visible_admin:  true,
                        visible_casher: true,
                        visible_iframe: true,
                        visible_client_screen: true
                    }
                };
                newObj = new PlacesGroupType(params);

                editor.findLayer(layerId).addObject(newObj);
                mapEditor_map.container.trigger('addObject',[newObj]);

                var sqrs = mapE_exchanger.getSquaresByObjectId(objectId);

                for(var i in sqrs){
                    mapEditor_map.container.trigger("addSquare",[{
                        row_count:1,
                        col_count:1,
                        object_id:newObj.object_id,
                        x:sqrs[i].x,
                        y:sqrs[i].y
                    }
                    ]);
                }
                break;
            case 1:
                params = {
                    object_id : MB.Core.guid(),
                    object_title : obj.object_title + '(Копия)',
                    image : obj.image,
                    visibility: {
                        visible_editor: true,
                        visible_admin:  true,
                        visible_casher: true,
                        visible_iframe: true,
                        visible_client_screen: true
                    }
                };
                newObj = new BackgroundType(params);
                editor.findLayer(layerId).addObject(newObj);

                break;
            case 2:
                params = {
                    object_id : MB.Core.guid(),
                    object_title : obj.object_title + '(Копия)',
                    image : obj.image,
                    visibility: {
                        visible_editor: true,
                        visible_admin:  true,
                        visible_casher: true,
                        visible_iframe: true,
                        visible_client_screen: true
                    }
                };
                newObj = new ImageType(params);
                editor.findLayer(layerId).addObject(newObj);
                break;
            case 3:
                params = {
                    object_id : MB.Core.guid(),
                    object_title : obj.object_title + '(Копия)',
                    image : obj.image,
                    visibility: {
                        visible_editor: true,
                        visible_admin:  true,
                        visible_casher: true,
                        visible_iframe: true,
                        visible_client_screen: true
                    }
                };
                newObj = new StrokeType(params);
                editor.findLayer(layerId).addObject(newObj);
                break;
            case 4:
                params = {
                    object_id : MB.Core.guid(),
                    object_title : obj.object_title + '(Копия)',
                    image : obj.image,
                    visibility: {
                        visible_editor: true,
                        visible_admin:  true,
                        visible_casher: true,
                        visible_iframe: true,
                        visible_client_screen: true
                    }
                };
                newObj = new LabelType(params);
                editor.findLayer(layerId).addObject(newObj);
                break;
            default:
                console.warn('wrong object type!');
                break;
        }

        $(uniqueEditor).trigger('layerUpdate');

    });


    // VISIBILITY SETTINGS
    $(uniqueEditor).on('click', 'input[type="checkbox"].layerVisible', function(e){
        e = e || window.event;
        e.stopPropagation();
        var state = this.checked,
            layerId = $(this).parents('.layerItem').attr('data-id'),
            icon = $(this).parents('.visibilitySetting').find('i');

        layerUi.toggleLayerVisibility(layerId, state, icon);
    });

    $(uniqueEditor).on('click', 'input[type="checkbox"].objectVisible', function(e){
        e = e || window.event;
        e.stopPropagation();

        var state = this.checked,
            layerId = $(this).parents('.layerItem').attr('data-id'),
            objectId = $(this).parents('.objectItem').attr('data-id'),
            icon = $(this).parents('.visibilitySetting').find('i');

        layerUi.toggleObjectVisibility(layerId, objectId, state, icon);
    });

    $(uniqueEditor).on('click', '.ddToggler', function(e){
        e = e||window.event;
        e.stopPropagation();

        var icon = $(this).find('i'),
            state = icon.hasClass('expand'),
            layerId = $(this).parents('.layerItem').attr('data-id');
        if(state){
            icon.removeClass('expand');
            icon.removeClass('fa-angle-down').addClass('fa-angle-left');
            layerUi.collapseLayerObjects(layerId);
        }else{
            icon.addClass('expand');
            icon.removeClass('fa-angle-left').addClass('fa-angle-down');
            layerUi.expandLayerObjects(layerId);
        }
    });

    $(uniqueEditor).on('click', '.objectItem', function(e){
        e = e||window.event;
        e.stopPropagation();
        var object_id = $(this).attr('data-id'),
            obj = editor.findObject(object_id),
            isPlaces = obj.type == 0;


        if(ctrlKeyPress){
            if(!obj.selected){
                obj.setSelected(true);
                $(this).addClass('selected');
            }else{
                obj.setSelected(false);
                $(this).removeClass('selected');
            }
        }else{
            editor.deselectLayers();
            editor.deselectObjects();
            $(uniqueEditor+' .layerItem').removeClass('selected');
            $(uniqueEditor+' .objectItem').removeClass('selected');

            obj.setSelected(true);
            $(this).addClass('selected');
        }

        if(isPlaces){
            mapEditor_map.editorMode = "squares";
        }else{
            mapEditor_map.editorMode = "places";
        }

        mapEditor_map.addToSelectionArray(editor.getSelectedObjectsIds(), true);
    });

    $(uniqueEditor).on('click', '.layerItem', function(e){
        e = e||window.event;
        e.stopPropagation();

        var layer_id = $(this).attr('data-id'),
            layer = editor.findLayer(layer_id);

        if(ctrlKeyPress){
            if(!layer.selected){
                layer.setSelected(true);
                $(this).addClass('selected');
            }else{
                layer.setSelected(false);
                $(this).removeClass('selected');
            }
        }else{
            editor.deselectLayers();
            editor.deselectObjects();
            $(uniqueEditor+' .layerItem').removeClass('selected');
            $(uniqueEditor+' .objectItem').removeClass('selected');

            layer.setSelected(true);
            $(this).addClass('selected');
        }

        if(layer.selected){
            for(var i=0; i< layer.objects.length; i++){
                var obj = layer.objects[i];
                obj.setSelected(true);
            }
            $(this).find('.objectItem').addClass('selected');
        }else{
            for(var k=0; k< layer.objects.length; k++){
                var kObj = layer.objects[k];
                kObj.setSelected(false);
            }
            $(this).find('.objectItem').removeClass('selected');
        }
        mapEditor_map.addToSelectionArray(editor.getSelectedObjectsIds(), true);
    });

    $(uniqueEditor).on('click','.layerItem>.deleteLayerBtn .deleteLayerInner', function(e){
        e = e || window.event;
        e.stopPropagation();

        var layerHtml = $(this).parents('.layerItem'),
            layer_id = layerHtml.attr('data-id'),
            layer_title = editor.findLayer(layer_id).title,
            deleteHover = $(this).parents('.deleteLayerBtn');

        bootbox.dialog({
            message: "Вы уверены?",
            title: 'Удалить слой "'+layer_title+'"',
            buttons: {
                success: {
                    label: "Да",
                    className: "blue",
                    callback: function(){
                        var objectsIdsArr = [];
                        for(var i in editor.findLayer(layer_id).objects){
                            objectsIdsArr.push(editor.findLayer(layer_id).objects[i].object_id);
                        }
                        mapEditor_map.container.trigger('removeObject', [objectsIdsArr, function(result){

                        }]);
                        mapEditor_map.container.trigger('removeLayer',[[layer_id],function(result){
                            var data = JSON.parse(result);
                            if (data['results'][0].code && +data['results'][0].code!==0){
                                console.log('Ошибка: '+result);
                                return;
                            }
                            editor.removeLayers([layer_id]);
                            $(uniqueEditor).trigger('layerUpdate');
                        }]);

                    }
                },
                error: {
                    label: "Нет",
                    className: "red",
                    callback: function(){
                    }
                }
            }

        });
    });
    $(uniqueEditor).on('click','.objectItem>.deleteLayerBtn .deleteLayerInner', function(e){
        e = e || window.event;
        e.stopPropagation();

        var objectHtml = $(this).parents('.objectItem'),
            layer = editor.findLayer($(this).parents('.layerItem').attr('data-id')),
            object_id = objectHtml.attr('data-id'),
            object = editor.findObject(object_id),
            object_places_ids = (object.type === 0)? object.data.ids : undefined,
            object_title = object.object_title,
            deleteHover = $(this).parents('.deleteLayerBtn').eq(0);

        bootbox.dialog({
            message: "Вы уверены?",
            title: 'Удалить объект "'+object_title+'"',
            buttons: {
                success: {
                    label: "Да",
                    className: "blue",
                    callback: function(){
                        mapEditor_map.container.trigger('removeObject',[[object_id],function(result){
                            var data = JSON.parse(result);
                            if (data['results'][0].code && +data['results'][0].code!==0){
                                console.log('Ошибка: '+result);
                                return;
                            }

                            mapEditor_map.renderList.removeItem(object_id);

                            layer.removeObject([object_id]);
                            if(object_places_ids !== undefined){
                                mapEditor_map.container.trigger('removeSquare',[object_places_ids]);

                            }
                            $(uniqueEditor).trigger('layerUpdate');

                            mapEditor_map.setLayout(function(){
                                mapEditor_map.reLoadLayout(function(){
                                    mapEditor_map.render();
                                });
                            });
                        }]);
                    }
                },
                error: {
                    label: "Нет",
                    className: "red",
                    callback: function(){
                    }
                }
            }

        });
    });

    //Delete layer animation
    $(uniqueEditor).on('mouseenter', '.layerItem>.deleteLayerBtn', function(){
        var layer = $(this).parents('.layerItem').eq(0),
            innerLi = layer.find('.innerLi').eq(0),
            thisW = $(this).width();

        innerLi.animate({
            marginLeft: -(thisW+20)+'px'
        }, {
            duration: 200,
            queue: false
        });
    });
    $(uniqueEditor).on('mouseleave', '.layerItem>.deleteLayerBtn', function(){
        var layer = $(this).parents('.layerItem').eq(0),
            innerLi = layer.find('.innerLi').eq(0),
            thisW = $(this).width();

        innerLi.animate({
            marginLeft: -10+'px'
        }, {
            duration: 200,
            queue: false
        });
    });

    //Delete object animation
    $(uniqueEditor).on('mouseenter', '.objectItem>.deleteLayerBtn', function(){
        var layer = $(this).parents('.objectItem').eq(0),
            innerLi = layer.find('.innerLi').eq(0),
            thisW = $(this).width();

        innerLi.animate({
            marginLeft: -(thisW+20)+'px'  //20
        }, {
            duration: 200,
            queue: false
        });
    });
    $(uniqueEditor).on('mouseleave', '.objectItem>.deleteLayerBtn', function(){
        var layer = $(this).parents('.objectItem').eq(0),
            innerLi = layer.find('.innerLi').eq(0),
            thisW = $(this).width();

        innerLi.animate({
            marginLeft: -10+'px'
        }, {
            duration: 200,
            queue: false
        });
    });

    //Visibility handlers
    $(uniqueEditor).on('click', '.visibilityCheckbox', function(e){
        e = e || window.event;
        e.stopPropagation();

        var elem, state, type, objectId, objects;
        elem = $(this);
        state = elem[0].checked;
        type = elem.attr('data-type');
        objectId = elem.parents('.objectItem').attr('data-id');

        switch(type){
            case 'visible_editor':
                editor.findObject(objectId).visibility.visible_editor = state;
                objects = [{
                    hall_scheme_object_id:objectId,
                    visible_editor: (state)?"TRUE":"FALSE"
                }];
                break;
            case 'visible_admin':
                editor.findObject(objectId).visibility.visible_admin = state;
                objects = [{
                    hall_scheme_object_id:objectId,
                    visible_admin: (state)?"TRUE":"FALSE"
                }];
                break;
            case 'visible_casher':
                editor.findObject(objectId).visibility.visible_casher = state;
                objects = [{
                    hall_scheme_object_id:objectId,
                    visible_casher: (state)?"TRUE":"FALSE"
                }];
                break;
            case 'visible_iframe':
                editor.findObject(objectId).visibility.visible_iframe = state;
                objects = [{
                    hall_scheme_object_id:objectId,
                    visible_iframe: (state)?"TRUE":"FALSE"
                }];
                break;
            case 'visible_client_screen':
                editor.findObject(objectId).visibility.visible_client_screen = state;
                objects = [{
                    hall_scheme_object_id:objectId,
                    visible_client_screen: (state)?"TRUE":"FALSE"
                }];

                break;
            default:
                break;
        }

        mapEditor_map.container.trigger("modifyObject",[objects]);
        mapEditor_map.render();
    });

    //Transform handers
    $(uniqueEditor).on('click', '.transformObject', function(e){
        e = e || window.event;
        e.stopPropagation();



        var object, object_id, modelObj;
        object = $(this).parents('.objectItem');
        object_id = object.attr('data-id');
        modelObj = editor.findObject(object_id);

        if($(this).hasClass('active')){
            $(this).removeClass('active');
            mapEditor_map.editorMode = "squares";
            mapEditor_map.specialObjects.removeItemsByObject(object_id, function(){
                mapEditor_map.render();
            });
        }else{
            var tempActive = $(uniqueEditor+' .transformObject.active');

            for(var i=0; i< tempActive.length; i++){
                var item = $(tempActive[i]);
                var itemObj = item.parents('.objectItem');
                var itemObjId = itemObj.attr('data-id');
                var itemModelObj = editor.findObject(itemObjId);

                item.removeClass('active');
                mapEditor_map.specialObjects.removeItemsByObject(itemObjId, function(){
                    mapEditor_map.render();
                });
            }

            $(this).addClass('active');

            editor.deselectLayers();
            editor.deselectObjects();
            $(uniqueEditor+' .layerItem').removeClass('selected');
            $(uniqueEditor+' .objectItem').removeClass('selected');

            modelObj.setSelected(true);
            object.addClass('selected');

            mapEditor_map.clearSelection();
            mapEditor_map.container.trigger('transform_object_start', [modelObj]);
        }

    });



    $(uniqueEditor).on('mousemove', function(e){
        for(var i=0; i<editor.layers.length; i++){
            var tempGlow = undefined;
            var layer = editor.layers[i],
                layerId = layer.id,
                rect = layer.rect;

            if(DnDObject.inDragging){
                if(mEvent.isMouseInRect(rect)){
                    DnDObject.overLayer = layerId;
                    layerUi.createGlow(layerId, function(){
                        //mediator.listeners.onObjectDropToLayer();
                    });
                }else{
                    //DnDObject.overLayer = undefined;
                    layerUi.removeGlow(layerId, function(){

                    });
                }
            }
        }

        if(isFromh){
            if(hDirLine.hasClass('hidden')){
                hDirLine.removeClass('hidden');
            }
            hDirLine.css('top', (e.pageY - canvasT)+'px');
        }else if(isFromv){
            if(vDirLine.hasClass('hidden')){
                vDirLine.removeClass('hidden');
            }
            vDirLine.css('left', (e.pageX - canvasL)+'px');
        }
    });

    $(uniqueEditor).on('mouseup', function(e){

        if(DnDObject.inDragging){
            if(DnDObject.overLayer != undefined && mEvent.isMouseInRect(editor.findLayer(DnDObject.overLayer).rect)){
                mediator.listeners.onObjectDropToLayer();
                layerUi.removeGlow(DnDObject.overLayer, function(){

                });
            }else{
                DnDObject.setDragging(false, function(){});
                DnDObject.setElem(undefined);
                DnDObject.overLayer = undefined;
            }
        }


    });

    // Shift key status handlers
    $(uniqueEditor).on('keydown', function(e){
        e = e || window.event;
        if(e.keyCode == 17){
            ctrlKeyPress = true;
        }
    });
    $(uniqueEditor).on('keyup', function(e){
        e = e || window.event;
        if(e.keyCode == 17){
            ctrlKeyPress = false;
        }
    });
    // Adding first layer for the places
    (function(){
        var params ={
            id: 'placeLayer',
            selected: false,
            title: 'Места',
            isFixedTop: true
        };
        placesLayerId = params.id;

        var layer = new MELayer(params);
        editor.layers.push(layer);
        $(uniqueEditor).trigger('layerUpdate');


    }());

    function initPlaces(){
        var rHtml = $(uniqueEditor+' #placesManager').html();
        $(uniqueEditor+' #offRightColumnInner').html(rHtml);
        populator.populatePlacesObjects('objectSimpleTpl', false, 'determineGroupList');
        populator.populateZones('zonesTpl', 'zonesList');
        $(uniqueEditor+' #toOffRColumn').show(0);
        uiTabs();
        $(uniqueEditor+' input:not(".noUniform")[type="checkbox"]').uniform();
    }
    initPlaces();

    return editor;

};
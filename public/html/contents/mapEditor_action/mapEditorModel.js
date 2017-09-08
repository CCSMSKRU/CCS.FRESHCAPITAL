
var getMapEditorModel = function(){

    var inherits = function(childCtor, parentCtor) { /** @constructor */

    function tempCtor(){}

        tempCtor.prototype = parentCtor.prototype;
        childCtor.superClass_ = parentCtor.prototype;
        childCtor.prototype = new tempCtor(); /** @override */
        childCtor.prototype.constructor = childCtor;
    };

    var ImageStorage = function(){
        this.images = [];
    };

    var ME = function(){
        this.layers = [];
    };
    var MELayer = function(params){
        this.selected = params.selected || false;
        this.offTop = 0;
        this.offLeft = 0;
        this.id = params.id || undefined;
        this.title = params.title || 'Новый слой';
        this.isFixedTop = params.isFixedTop || false;
        this.objects = [];
        this.sortNo = 0;
        this.rect = {};
        this.isOpened = params.isOpened || false;
        this.isSettingsOpened = params.settingsOpened || false;
        this.isVisible = params.isVisible || true;

    };

    var MEObject = function(params){
        this.selected = params.selected || undefined;
        this.type = params.type || undefined;
        this.object_id = params.object_id || undefined;
        this.object_old_id = params.object_id || undefined;
        this.object_title = params.object_title || undefined;
        this.x = params.x || 0;
        this.y = params.y || 0;
        this.opacity = params.opacity || 1;
        this.rotation = params.rotation || 0;
        this.rect = {};
        this.isOpened = params.isOpened || false;
        this.isSettingsOpened = params.isSettingsOpened || false;
        this.visibility = {
            visible_editor: params.visibility.visible_editor || true,
            visible_admin: params.visibility.visible_admin || true,
            visible_casher: params.visibility.visible_casher || true,
            visible_iframe: params.visibility.visible_iframe || true,
            visible_client_screen: params.visibility.visible_client_screen || true
        };
        this.isVisibleCheckbox = params.isVisibleCheckbox|| true;
        this.isObjectSettingsOpened = params.isObjectSettingsOpened|| false;
    };
    var PlacesGroupType = function(params){
        MEObject.call(this, params);
        this.data = {
            ids: []
        };
    };
    var BackgroundType = function(params){
        MEObject.call(this, params);
        this.image = params.image || undefined;
        this.image_title = params.image_title || 'Фон';
        this.scaleCoeff = params.scaleCoeff||1;
        this.value = params.value || undefined;
    };
    var ImageType = function(params){
        MEObject.call(this, params);
        this.image = params.image || undefined;
        this.image_title = params.image_title || 'Изображение';
        this.scaleCoeff = params.scaleCoeff||1;
    };
    var LabelType = function(params){
        MEObject.call(this, params);
        this.image = params.image || "html/contents/mapEditor/img/label_small.png";
        this.fontFamily = params.fontFamily|| 'arial';
        this.fontSize = params.fontSize||'14';
        this.color = params.color|| '#000000';
        this.fontStyle = params.fontStyle|| 'normal';
        this.fontWeight = params.fontWeight|| 'normal';
        this.value = params.value || 'Лейбл';
    };
    var StrokeType = function(params){
        MEObject.call(this, params);
        this.image = params.image || "html/contents/mapEditor/img/stroke_small.png";
        this.value = params.value||'';
        this.lines = [];
        this.backgroundColor = params.backgroundColor || '#ffffff';

    };

    var StrokeLine = function(params){
        this.id = params.id || undefined;
        this.type = params.type || undefined;
        this.points = [];
        this.sortNo = params.sortNo || undefined;
        this.strokeWeight = params.strokeWeight || 1;
        this.strokeColor = params.strokeColor || '#000000';
    };
    var StrokePoint = function(params){
        this.id = params.id || undefined;
        this.x = params.x || undefined;
        this.y = params.y || undefined;
        this.sortNo = params.sortNo || undefined;
    };

    var Zones = function(){
        this.list = [];
    };
    var Zone = function(params){
        this.title = params.title || "Зона";
        this.zone_id = params.zone_id || undefined;
        this.ids = [];
    };

    var Directions = function(){
        this.lines = [];
    };
    var DirectionLine = function(params){
        this.id = params.id || undefined;
        this.type = params.type || undefined; // hor = 0 | ver = 1
        this.x = params.x || undefined;
        this.y = params.y || undefined;
    };



    ME.prototype = {
        addLayer: function(layer){
            this.layers.push(layer);
        },
        findLayer: function(id){
            for(var i=0; i<this.layers.length; i++){
                var layer = this.layers[i];
                if(layer.id == id){
                    return layer;
                }
            }
        },
        findObject: function(id){
            for(var i=0; i<this.layers.length; i++){
                var layer = this.layers[i];
                for(var o=0; o<layer.objects.length; o++){
                    var obj = layer.objects[o];
                    if(obj.object_id == id || obj.object_old_id == id ){
                        return obj;
                    }
                }
            }
        },
        deselectLayers: function(){
            for(var i=0; i<this.layers.length; i++){
                var layer = this.layers[i];
                layer.setSelected(false);
            }
        },
        deselectObjects: function(){
            for(var i=0; i<this.layers.length; i++){
                var layer = this.layers[i];
                for(var k=0; k< layer.objects.length; k++){
                    var kItem = layer.objects[k];
                    kItem.setSelected(false);
                }
            }
        },
        setSelected: function(id){
            this.deselectAll();
            this.findLayer(id).selected = true;
        },
        getSelectedIndex: function(){
            var result = undefined;
            for(var i=0; i<this.layers.length; i++){
                var layer = this.layers[i];
                if(layer.selected == true){
                    result = i;
                }
            }
            return result;
        },
        getIndex: function(id){
            for(var i=0; i<this.layers.length; i++){
                var layer = this.layers[i];
                if(layer.id == id){
                    return i;
                }
            }
        },
        moveUp: function(id){
            var tmpLayer = this.findLayer(id);
            var position = this.getIndex(id);
            if(position === 0) return false;
            if(this.layers[0].isFixedTop == true && position == 1) return false;
            this.layers.splice(position, 1);
            this.layers.splice(position-1, 0, tmpLayer);
        },
        moveDown: function(id){
            var tmpLayer = this.findLayer(id);
            var position = this.getIndex(id);

            if(position >= this.layers.length-1) return false;

            this.layers.splice(position, 1);
            this.layers.splice(position+1, 0, tmpLayer);
        },
        setPosition: function(){

        },
        removeLayers: function(arr){
            if (arr.length==0) return;

            var where = "";
            /* for (var l in arr){
             if (where=="")
             where += "HALL_SCHEME_LAYER_ID = "+arr[l];
             else
             where += " or HALL_SCHEME_LAYER_ID = "+arr[l];
             }*/

            for(var i=0; i<this.layers.length; i++){
                var layer = this.layers[i];
                for(var k=0; k< arr.length; k++){
                    if(layer.id == arr[k]){
                        delete this.layers[i];
                    }
                }
            }
            this.clearEmptyLayers();
        },
        clear: function(){
            this.layers = [];
        },
        setOffPositions: function(id, params){
            var layer = this.findLayer(id);
            layer.offTop = params.top;
            layer.offLeft = params.left;

            var positions = {
                top: layer.offTop,
                left: layer.offLeft
            };

            mediator.onLayerPosSetted(id, positions);
        },
        getOffPositions: function(id){
            var layer = this.findLayer(id);
            return {top: layer.offTop, left: layer.offLeft};
        },
        clearEmptyLayers: function(){
            for(var i=0; i< this.layers.length; i++){
                if(this.layers[i] === undefined){
                    this.layers.splice(i,1);
                    this.clearEmptyLayers();
                }
            }
        },
        clearEmptyObjects: function(layer_id){
            var layer = this.findLayer(layer_id);
            for(var i=0; i< layer.objects.length; i++){
                if(layer.objects[i] === undefined){
                    layer.objects.splice(i, 1);
                    this.clearEmptyObjects(layer_id);
                }
            }
        },
        getSelectedObjectsIds: function(){
            var arr = [];

            for(var i=0; i<this.layers.length; i++){
                var layer = this.layers[i];
                for(var k=0; k<layer.objects.length; k++){
                    var kItem = layer.objects[k];
                    if(kItem.selected == true){
                        if(kItem.type == 0){
                            for(var l=0; l<kItem.data.ids.length; l++){
                                arr.push(kItem.data.ids[l]);
                            }
                        }
                    }
                }
            }

            return arr;
        },
        getSelectedObjects: function(){
            var arr = [];
            for(var i in this.layers){
                var layer = this.layers[i];
                for(var k in layer.objects){
                    var obj = layer.objects[k];
                    if(obj.selected === true){
                        arr.push(obj);
                    }
                }
            }
            return arr;
        }

    };
    MELayer.prototype = {
        addObject: function(item){
            this.objects.push(item);
        },
        findObject: function(id){
            for(var i=0; i<this.objects.length; i++){
                var obj = this.objects[i];
                if(obj.object_id == id){
                    return obj;
                }
            }
        },
        removeObject: function(arr){
            for(var i=0; i< this.objects.length; i++){
                var obj = this.objects[i];

                for(var k=0; k<arr.length; k++){
                    if(obj.object_id == arr[k]){
                        delete this.objects[i];
                    }
                }
            }
            editor.clearEmptyObjects(this.id);

        },
        clearEmptyPlaceObjects: function(callback){
            var self = this;
            var cleared_objects = [];
            for(var i=0; i<this.objects.length; i++){
                var obj = this.objects[i],
                    type = obj.type;
                if(type == 0){
                    if(obj.data.ids.length == 0){
                        delete this.objects[i];
                        cleared_objects.push(obj.object_id);

                    }
                }
            }
            function clearEmpty(){
                for(var i=0; i< self.objects.length; i++){
                    if(self.objects[i] === undefined){
                        self.objects.splice(i,1);
                        clearEmpty();
                    }
                }
            }
            clearEmpty();
            if (typeof callback=="function")
                callback(cleared_objects);


        },
        clear: function(){
            this.objects = [];
        },
        setRect: function(rect, callback){
            this.rect.top = rect.top;
            this.rect.left = rect.left;
            this.rect.height = rect.height;
            this.rect.width = rect.width;

            callback();
        },
        setSelected: function(value){
            this.selected = value;
        },
        remove: function(){
            var self = this;
            delete this;
            editor.clearEmptyLayers();
        },
        setOpened: function(value){
            this.isOpened = value;
        },
        setTitle: function(value){
            this.title = value;
        },
        removeIds: function(arr, callback){
            var objectsCleared = [];
            var objectsIds = [];
            for(var i=0;i<this.objects.length; i++){
                if(this.objects[i].type === 0){
                    for(var k=0; k<this.objects[i].data.ids.length; k++){
                        var kItem = this.objects[i].data.ids[k];

                        for(var l=0; l< arr.length; l++){
                            if(kItem == arr[l]){
                                if ($.inArray(this.objects[i].object_id,objectsIds) == -1){
                                    objectsIds.push(this.objects[i].object_id);
                                    objectsCleared.push(this.objects[i]);
                                }
                                delete this.objects[i].data.ids[k];
                            }
                        }
                    }
                }
            }
            this.clearPlaceGroupsIds();

            if(typeof callback == 'function'){
                callback(objectsCleared);
            }

        },
        clearPlaceGroupsIds: function(){
            var self = this;
            function clear(){
                for(var i=0; i<self.objects.length; i++){
                    if(self.objects[i].type === 0){
                        for(var k=0; k<self.objects[i].data.ids.length; k++){
                            var kItem = self.objects[i].data.ids[k];
                            if(kItem === undefined){
                                self.objects[i].data.ids.splice(k,1);
                                clear();
                            }
                        }
                    }
                }
            }
            clear();
        }

    };
    MEObject.prototype = {
        setRect: function(rect, callback){
            this.rect.top = rect.top;
            this.rect.left = rect.left;
            this.rect.height = rect.height;
            this.rect.width = rect.width;

            callback();
        },
        setSelected: function(value){
            this.selected = value;
        },
        setObjectTitle: function(value){
            this.object_title = value;
        },
        setVisibility: function(name, value){
            if(this.visibility.name){
                this.visibility.name = value;
            }else{
                console.warn('wrong name of visibility parameter');
            }

        }
    };

    Directions.prototype = {
        addLine: function(line){
            if(line.type !== undefined && line.id !== undefined){
                this.lines.push(line);
            }else{
                throw new Error('wrong directional line tries to add in model');
            }
        },
        removeLines: function(arr){
            var self = this;
            for(var i in this.lines){
                var item = this.lines[i];
                for(var k in arr){
                    if(item.id == arr[k]){
                        delete this.lines[i];
                    }
                }
            }

            function clear(){
                for(var i in self.lines){
                    if(self.lines[i] === undefined){
                        self.lines.splice(i, 1);
                        clear();
                    }
                }
            }
            clear();
        },
        findLine: function(id){
            for(var i in this.lines){
                if(this.lines[i].id == id){
                    return this.lines[i];
                }
            }
        }
    };
    DirectionLine.prototype = {
        setX: function(x){
            if(parseInt(this.type) === 1){
                this.x = x;
            }
        },
        setY: function(y){
            if(parseInt(this.type) === 0){
                this.y = y;
            }
        }
    };
    Zones.prototype = {
        findZone: function(id){
            for(var i=0; i<this.list.length; i++ ){
                if( this.list[i].zone_id == id){
                    return this.list[i]
                }
            }
        },
        addZone: function(item){
            this.list.push(item);
        },
        removeZone: function(id){
            for(var i=0; i< this.list.length; i++){
                var item = this.list[i];
                if(item.zone_id == id){
                    delete this.list[i];
                }
            }
            this.clearEmpty();
        },
        clearEmpty: function(){
            var self = this;
            function clear(){
                for(var i=0; i< self.list.length; i++){
                    if(self.list[i] === undefined){
                        self.list.splice(i,1);
                        clear();
                    }
                }
            }
            clear();
        },
        removeIds: function(arr){
            for(var i =0; i<this.list.length; i++){
                var item = this.list[i];
                for(var k=0; k<item.ids.length; k++){
                    var kItem = item.ids[k];
                    for(var l=0; l<arr.length; l++){
                        if(kItem == arr[l]){
                            delete item.ids[k];
                        }
                    }
                }
            }
            this.clearEmptyIds();
        },
        clearEmptyIds: function(){
            var self = this;
            function clear(){
                for(var i=0; i< self.list.length; i++){
                    var item = self.list[i];
                    for(var k =0; k< item.ids.length; k++){
                        if(item.ids[k] === undefined){
                            item.ids.splice(k,1);
                            clear();
                        }
                    }
                }
            }
            clear();
        }
    };
    Zone.prototype = {
        addIds: function(arr){
            for(var i=0; i<arr.length; i++){
                this.ids.push(arr[i]);
            }
        },
        removeIds: function(arr){
            for(var i=0; i<this.ids.length; i++){
                var item = this.ids[i];
                for(var k=0; k<arr.length; k++){
                    var kItem = arr[k];
                    if(item == kItem){
                        delete this.ids[i];
                    }
                }
            }
            this.clearEmpty();
        },
        clearEmpty: function(){
            var self = this;
            function clear(){
                for(var i=0; i< self.ids.length; i++){
                    if(self.ids[i] === undefined){
                        self.ids.splice(i,1);
                        clear();
                    }
                }
            }
            clear();
        },
        setId: function(id){
            this.zone_id = id;
        }
    };
    ImageStorage.prototype = {
        addItem: function(item){
            var obj = {
                name:item.name,
                data:item.data,
                id:item.id
            };

            this.images.push(obj);
        },
        getItem: function(id){
            for(var i=0; i< this.images.length; i++){
                var item = this.images[i];
                if(item.id == id){
                    return item;
                }
            }
        },
        removeItem: function(id){
            var self = this;
            for(var i=0; i< this.images.length; i++){
                if(this.images[i].id == id){
                    delete this.images[i];
                }
            }

            function clear(){
                for(var i=0; i<self.images.length; i++){
                    if(self.images[i] === undefined){
                        self.images.splice(i,1);
                        clear();
                    }
                }

            }
            clear();
        },
        getItemIndex: function(id){
            for(var i=0; i< this.images.length; i++){
                var item = this.images[i];
                if(item.uid == id){
                    return i;
                }
            }
        },
        clear: function(){
            this.images = [];
        }
    };

    PlacesGroupType.prototype = MEObject.prototype;
    PlacesGroupType.prototype.addIds = function(arr, callback){
        for(var i = 0; i< arr.length; i++){
            this.data.ids.push(arr[i]);
        }

        if(typeof callback == 'function'){
            callback(this);
        }
    };
    PlacesGroupType.prototype.removeIds = function(arr, callback){
        var self = this;
        for(var i=0; i<this.data.ids.length;i++){
            var item = this.data.ids[i];
            for(var k=0; k< arr.length; k++){
                var kItem = arr[k];
                if(item == kItem){
                    delete this.data.ids[i];
                }
            }
        }
        function clearEmpty(){
            for(var i=0; i< self.data.ids.length; i++){
                if(self.data.ids[i] === undefined){
                    self.data.ids.splice(i,1);
                    clearEmpty();
                }
            }
        }
        clearEmpty();

        if(typeof callback == 'function'){
            callback(this);
        }
    };
    PlacesGroupType.prototype.clear = function(){
        this.data.ids = [];
    };

    BackgroundType.prototype = MEObject.prototype;
    ImageType.prototype = MEObject.prototype;
    LabelType.prototype = MEObject.prototype;

    StrokeType.prototype = MEObject.prototype;
    StrokeType.prototype.addLine = function(line){
        this.lines.push(line);
    };
    StrokeType.prototype.removeLines = function(arr){
        var self = this;
        for(var i =0; i< this.lines.length; i++){
            var item = this.lines[i];
            for(var k=0; k< arr.length; k++){
                var kItem = arr[k];
                if(item.id == kItem){
                    delete this.lines[i];
                }
            }
        }

        function clear(){
            for(var i=0; i<self.lines.length; i++){
                if(self.lines[i] === undefined){
                    self.lines.splice(i,1);
                    clear();
                }
            }
        }
        clear();
    };
    StrokeType.prototype.findLine = function(id){
        for(var i=0; i<this.lines.length; i++){
            if(this.lines[i].id == id){
                return this.lines[i];
            }
        }
    };
    StrokeType.prototype.findPoint = function(id){
        for(var i=0; i<this.lines.length; i++){
            var item = this.lines[i];
            for(var k=0; k<item.points.length; k++){
                var kItem = item.points[k];
                if(kItem.id == id){
                    return kItem;
                }
            }
        }
    };
    StrokeType.prototype.setBackgroundColor = function(color){
        this.backgroundColor = color;
    };

    inherits(PlacesGroupType, MEObject);
    inherits(BackgroundType, MEObject);
    inherits(ImageType, MEObject);
    inherits(LabelType, MEObject);
    inherits(StrokeType, MEObject);

    var modelObject = {
        ME: ME,
        ImageStorage: ImageStorage,
        MELayer: MELayer,
        MEObject: MEObject,

        PlacesGroupType: PlacesGroupType,
        BackgroundType: BackgroundType,
        ImageType: ImageType,
        LabelType: LabelType,
        StrokeType: StrokeType,

        StrokeLine: StrokeLine,
        StrokePoint: StrokePoint,
        Zones: Zones,
        Zone: Zone,
        Directions: Directions,
        DirectionLine: DirectionLine
    };

    return modelObject;
};

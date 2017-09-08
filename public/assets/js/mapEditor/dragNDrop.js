
var DnDObject = {
    elem: undefined,
    mdTop: 0,
    mdLeft: 0,
    draggedItemType: 0,
    elemWidth: 0,
    inDragging: false,
    overLayer: undefined,
    object_id: '',
    setElem: function(elem){
        DnDObject.elem = elem;

    },
    getElem: function(){
        return DnDObject.elem;
    },
    moveTo: function(params, callback){
        $(DnDObject.elem).css('top',params.top+'px');
        $(DnDObject.elem).css('left',params.left+'px');
        callback();
    },
    setDragging: function(state, callback){

        if(state){
            $(DnDObject.elem)
                .addClass('inDragging')
                .css({
                    width: DnDObject.elemWidth+'px'
                });
        }else{
            $(DnDObject.elem)
                .removeClass('inDragging').attr('style','');
            DnDObject.object_id = '';
        }

        DnDObject.inDragging = state;
        callback();
    }
};

var initDnD = function(){
    function fixEvent(e, _this) {
        e = e || window.event;

        if (!e.currentTarget) e.currentTarget = _this;
        if (!e.target) e.target = e.srcElement;

        if (!e.relatedTarget) {
            if (e.type == 'mouseover') e.relatedTarget = e.fromElement;
            if (e.type == 'mouseout') e.relatedTarget = e.toElement;
        }

        if (e.pageX == null && e.clientX != null ) {
            var html = document.documentElement;
            var body = document.body;

            e.pageX = e.clientX + (html.scrollLeft || body && body.scrollLeft || 0);
            e.pageX -= html.clientLeft || 0;

            e.pageY = e.clientY + (html.scrollTop || body && body.scrollTop || 0);
            e.pageY -= html.clientTop || 0;
        }

        if (!e.which && e.button) {
            e.which = e.button & 1 ? 1 : ( e.button & 2 ? 3 : (e.button & 4 ? 2 : 0) );
        }

        return e;
    }
    function getCoords(elem) {
        var box = elem.getBoundingClientRect();

        var body = document.body;
        var docEl = document.documentElement;

        var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
        var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

        var clientTop = docEl.clientTop || body.clientTop || 0;
        var clientLeft = docEl.clientLeft || body.clientLeft || 0;

        var top  = box.top +  scrollTop - clientTop;
        var left = box.left + scrollLeft - clientLeft;

        return { top: Math.round(top), left: Math.round(left) };
    }



    $(document).on('mousedown', '.draggable', function(e){
        e = fixEvent(e, this);

        DnDObject.mdTop = e.pageY - $(this).offset().top;
        DnDObject.mdLeft = (e.pageX - $(this).offset().left);
        DnDObject.elemWidth = $(this).width();
        DnDObject.object_id = $(this).attr('data-object-id');

        DnDObject.setElem(this);
        DnDObject.setDragging(true, function(){
            //console.log('drag setted');
        });




        var params ={
            top:e.pageY - DnDObject.mdTop,
            left:e.pageX - DnDObject.mdLeft
        };

        DnDObject.moveTo(params, function(){

        });


    });

    $(document).on('mousemove', function(e){
        e = fixEvent(e, this);

        if(DnDObject.elem && DnDObject.inDragging){

            var params ={
                top:e.pageY - DnDObject.mdTop,
                left:e.pageX - DnDObject.mdLeft
            };

            DnDObject.moveTo(params, function(){
                //console.log('moved');
            });
        }
    });

   /* $(document).on('mouseup', function(e){
       if(editor.layers.length == 0){
           if(DnDObject.inDragging){
               DnDObject.setDragging(false, function(){
                   console.log('drag STOP');
               });
               DnDObject.setElem(undefined);
           }
       }
    });*/





};








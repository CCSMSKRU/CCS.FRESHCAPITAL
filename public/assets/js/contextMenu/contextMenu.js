(function(){
    var mouseXPos, mouseYPos;
    document.addEventListener('mousemove', function(e){
        mouseXPos = e.clientX || e.pageX;
        mouseYPos = e.clientY || e.pageY
    }, false);

    var ContextMenu = function(){
        this.items = [];
    };
    MB.Core.inherits(ContextMenu, MB.Core.EE);
    ContextMenu.prototype = MB.Core.EE.prototype;

    ContextMenu.init = function(e, params){
        e = e || window.event;
        if(e){
            e.preventDefault();
            e.stopPropagation();
        }

        var instance = new ContextMenu();
        if(params && typeof params === 'object'){
            if(params.items && typeof params.items === 'object'){
                if(!params.position || typeof params.position !== 'object'){
                    if(!e){
                        params.position = {
                            x: mouseXPos,
                            y: mouseYPos
                        }
                    }else{
                        params.position = {
                            x: e.pageX,
                            y: e.pageY
                        }
                    }
                }
                for(var i in params.items){
                    instance.addItem(params.items[i]);
                }
                instance.render(params.position);
            }else{console.warn('contextMenu: wrong params.items, must be an Array');}
        }else{console.warn('contextMenu: wrong params, must be an object');}


        return instance;
    };

    ContextMenu.prototype.render = function(position){
        var self = this;
        $('.contextMenu').remove();
        var listItems = '';
        var ul = document.createElement('ul');
        ul.className = 'contextMenu';

        for(var i in this.items){
            var isDisabled, title, iconClass;

            isDisabled = (this.items[i].disabled)? "disabled": "";
            title = (this.items[i].title)? this.items[i].title: "untitled";
            iconClass = (this.items[i].iconClass && typeof this.items[i].iconClass === 'string')? this.items[i].iconClass : "fa-check";

            listItems += '<li class="'+isDisabled +'"><i class="fa '+iconClass+'"></i>&nbsp;&nbsp;'+title+'</li>';
        }
        $(ul).html(listItems);
        $('body').append($(ul));
        $(ul).css({top: position.y+'px', left: position.x+'px'});

        function bindCallback(elem, callback){
            elem.on('contextmenu', function(e){
                e = e || window.event;
                e.preventDefault();
                e.stopPropagation();
            });
            elem.on('click', function(){
                if(elem.hasClass('disabled')){
                    return false;
                }else{
                    if(typeof callback === 'function'){
                        callback('back paarams');
                        $(ul).remove();
                    }else{
                        console.warn('contextMenu: option "callback" must be a function');
                        $(ul).remove();
                    }

                }
            });
        }

        for(var k in this.items){
            var callbackFn = self.items[k].callback;
            bindCallback($(ul).find('li').eq(k), callbackFn);
        }
        this.elem = $(ul);
    };
    ContextMenu.prototype.addItem = function(item){
        this.items.push(item);
    };

   /* ContextMenu.prototype.disableItem = function(){};
    ContextMenu.prototype.removeItems = function(){};
    ContextMenu.prototype.show = function(){};
    ContextMenu.prototype.hide = function(){};*/
    ContextMenu.prototype.delete = function(){
        this.items = [];
        $('.contextMenu').remove();
    };

    MB.Core.contextMenu = ContextMenu;

    $(document).on('click', function(e){
        $('.contextMenu').remove();
    });
    $(document).on('contextmenu', function(e){
        $('.contextMenu').remove();
    });


    //EXAMPLE
    var ctxM;

    /*$('#header').on('contextmenu', function(e){

        ctxM = MB.Core.contextMenu.init(e,{

            items: [
                {
                    title:'open',
                    iconClass:'fa-check',
                    disabled: false,
                    callback:function(params){
                        console.log('contextMenu: callback OPEN '+params);
                    }
                },
                {
                    title:'close',
                    iconClass:'fa-times',
                    disabled: true,
                    callback:function(params){
                        console.log('contextMenu: callback CLOSE '+params);
                    }
                },
                {
                    title:'copy',
                    iconClass:'fa-copy',
                    disabled: false,
                    callback:function(params){
                        console.log('contextMenu: callback COPY '+params);
                    }
                }
            ]
        });
    });*/

}());


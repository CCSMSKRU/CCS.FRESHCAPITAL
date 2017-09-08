
var modalWindow = function(){
    function fixEvent(e) {
        e = e || window.event;

        if (!e.target) e.target = e.srcElement;

        if (e.pageX == null && e.clientX != null ) { // если нет pageX..
            var html = document.documentElement;
            var body = document.body;

            e.pageX = e.clientX + (html.scrollLeft || body && body.scrollLeft || 0);
            e.pageX -= html.clientLeft || 0;

            e.pageY = e.clientY + (html.scrollTop || body && body.scrollTop || 0);
            e.pageY -= html.clientTop || 0;
        }

        if (!e.which && e.button) {
            e.which = e.button & 1 ? 1 : ( e.button & 2 ? 3 : ( e.button & 4 ? 2 : 0 ) )
        }

        return e;
    }
    function getCoords(elem) {
        if(!elem){
            return false;
        }
        var box = elem.getBoundingClientRect();

        var body = document.body;
        var docElem = document.documentElement;

        var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
        var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;

        var clientTop = docElem.clientTop || body.clientTop || 0;
        var clientLeft = docElem.clientLeft || body.clientLeft || 0;

        var top  = box.top +  scrollTop - clientTop;
        var left = box.left + scrollLeft - clientLeft;

        return { top: Math.round(top), left: Math.round(left) };
    }

    var mouse = {
        isDown: false,
        mouseBtn: 0,
        pageX: 0,
        pageY: 0,
        screenX: 0,
        screenY: 0
    };
    $(document).on('mousedown', function(e){
        e = fixEvent(e);
        mouse.isDown = true;
        mouse.mouseBtn = e.button;
        mouse.pageX = e.pageX;
        mouse.pageY = e.pageY;
        mouse.screenX = e.screenX;
        mouse.screenY = e.screenY;
    });
    $(document).on('mouseup', function(e){
        e = fixEvent(e);
        mouse.isDown = false;
        mouse.mouseBtn = e.button;
        mouse.pageX = e.pageX;
        mouse.pageY = e.pageY;
        mouse.screenX = e.screenX;
        mouse.screenY = e.screenY;
    });
    $(document).on('mousemove', function(e){
        e = fixEvent(e);
        mouse.pageX = e.pageX;
        mouse.pageY = e.pageY;
        mouse.screenX = e.screenX;
        mouse.screenY = e.screenY;
    });

    var footerPanel = $('#mw-footerPanel');

    var mWPositionHelper = $('#modalWindows-position-helper');
    var heplerInAnimate = false;

    var modalWindowsWrap = $('#modalWindows');
    var currentResize = '';
    var moveObj;
    var TemplateParser = function(tpl, data){
        var result;
        function reParse(tpl,data){
            for(var i in data){
                var key = i;
                var val = data[i];
                var keyWord = '{'+key+'}';
                if(tpl.indexOf(keyWord) != -1){
                    result = tpl.replace(keyWord, val);
                    delete data[i];
                    reParse(result, data);
                }
            }
        }

        reParse(tpl, data);
        return result;
    };
    var lastLeft;
    var lastWidth = 600;

    var mWConstructor = function(){
        this.items = [];
    };
    var windows = new mWConstructor();
    var mWItem = function(params){
        this.wrapper =           undefined;
        this.className =        params.className;
        this.wrapId =           params.wrapId || 'guid';
        this.resizable =        params.resizable || true;
        this.title =            params.title || 'untitled';
        this.status =           params.status || '';
        this.content =          params.content || 'empty content';
        this.topButtons =       params.topButtons || undefined;
        this.bottomButtons =    params.bottomButtons || undefined;
        this.startPosition =    params.startPosition || 'shift';
        this.height =           params.height || 700;
        this.width =            params.width || 1300;
        this.draggable =        params.draggable;
        this.top =              0;
        this.left =             0;
        this.waitForPosition =  undefined;
        this.active =           true;
        this.inMove =           false;
        this.minHeight =        params.minHeight || 600;
        this.minWidth =         params.minWidth || 1000;
        this.activeHeaderElem = undefined;
        this.footerButton =     undefined;
        this.footerButtonIsRemove =     false;
        this.contentHeight =    0;
        this.icon =             params.icon || 'blueSquares';
        this.hideSaveButton =   params.hideSaveButton || false;
        this.hideFullscreen =   params.hideFullScreen || false;
        this.containType =      params.containType || undefined;
        this.containType =      params.containType || undefined;
        this.eternal  =         params.eternal || undefined;
        this.params =           params.params || {};
        this.formInstance =     params.formInstance || {};
    };

    mWConstructor.prototype.addItem = function(item){
        this.items.push(item);

    };

    mWConstructor.prototype.deactivateAll = function(){
        for(var i in this.items){
            this.items[i].active = false;
        }
    };

    mWConstructor.prototype.setZ = function(){
        for(var i in this.items){
            if(this.items[i].active){
                this.items[i].wrapper.addClass('activeW');
            }else{
                this.items[i].wrapper.removeClass('activeW');
            }
        }
    };

    mWConstructor.prototype.removeItem = function(instance){
        for(var i in this.items){
            var item = this.items[i];
            if(item.wrapId == instance.wrapId){
                this.items.splice(i,1);
                this.resizeTry();
                instance.wrapper.remove();
            }
        }
    };

    mWConstructor.prototype.getWindow = function(id){
        for(var i in this.items){
            var item = this.items[i];
            if(item.wrapId == id){
                return item;
            }
        }
    };

    mWConstructor.prototype.resizeTry = function(){
        var _t = this;
        var tryLength = _t.items.length;
        var tryWraps = $('.mw-try-wrap');
        var tryLineWidth = $('#mw-footerPanel').outerWidth() - 150;

//        console.log(tryLineWidth / (tryLength+1));


        tryWraps.width((tryLineWidth / tryLength) - 31 + 'px');
        MB.Core.resizeWindows();
    };


    mWItem.prototype.render = function(callback){
        var _t = this;
        var isSaveBtn = (_t.hideSaveButton)? '' : '<div class="mw-save-form disabled">Сохранить</div>';
        var isFullscreenBtn = (_t.hideFullscreen)? '' : '<div class="mw-fullscreen"><i class="fa fa-square-o fsc-icon"></i><i class="fa fa-square-o nfsc-icon"></i></div>';

        console.log('_t.startPosition: ', _t.startPosition);

	    _t.setStartPosition();

        var getHeightStr = (isNaN(+_t.height))? _t.height : _t.height +'px';

        var template =  '<div class="mw-wrap activeW '+_t.className+'" id="mw-{wrapId}" style="top:'+_t.top+'px; left: '+_t.left+'px; height: '+getHeightStr+'; width:'+_t.width+'px;">' +
                            '<div class="mw-preHeaderLine"></div>' +
                            '<div class="mw-header">' +
                                '<div class="mw-title"><span class="mw-count-title-length">{title}</span><div class="mw-title-hint">{title2}</div></div>'  +
                                '<div class="mw-notification-wrapper"></div>' +
                                '<div class="mw-insertIntoHeader"></div>'  +
                                isSaveBtn +
                                '<div class="mw-actionBtns"><div class="mw-reload-from"><i class="fa fa-refresh"></i></div><div class="mw-collapse">_</div>'+isFullscreenBtn+'<div class="mw-close"><i class="fa fa-times"></i></div></div>' +
                            '</div>' +
                            '<div class="mw-topButtons">{topButtons}</div>' +
                            '<div class="mw-content"><div class="mw-content-inner">{content}</div></div>' +
                            '<div class="mw-footer" style="display: none">{bottomButtons}</div>' +
                        '</div>';


        function createButtons(type, buttons){
            var result = '';
            if(buttons && buttons.buttons && typeof buttons.buttons == 'object'){
                for(var i in buttons.buttons){
                    var btn = buttons.buttons[i];
                    result +=   '<div class="nb btn">'+btn.title+'</div>';
                }
            }else{
                result = null;
            }
            return result;
        }

        var data = {
            wrapId: this.wrapId,
            title2:this.title,
            title:this.title,
            status: this.status,
            topButtons:createButtons('top', this.topButtons),
            content:this.content,
            bottomButtons:createButtons('bottom', this.bottomButtons)

        };

        modalWindowsWrap.append(TemplateParser(template,data));


        windows.resizeTry();

        _t.wrapper = modalWindowsWrap.find('.mw-wrap:last-child');
        _t.contentInner = modalWindowsWrap.find('.mw-content-inner');
        _t.insertIntoHeader = _t.wrapper.find('.mw-insertIntoHeader');
        _t.insertIntoHeader.html(_t.wrapper.find('.insertIntoHeader').html());

        if(windows.items.length == 1 && _t.startPosition != 'shift' && +_t.height + +_t.top > $(window).outerHeight() - $('#mw-footerPanel').outerHeight()){
            _t.stick = 'top';
            _t.stickModal();
        }
	    _t.createBottomButton();
	    _t.setHandlers(function(){

            _t.stick = 'top';
            _t.stickModal();

		    if(typeof callback == 'function'){
			    callback(_t);
			    _t.height = _t.wrapper.outerHeight();
			    _t.wrapper.height(_t.height + 'px');
			    _t.setTitleHint();
		    }
	    });
    };

	mWItem.prototype.createBottomButton = function() {
		var _t = this;
		var tryData = {
			wrapId: this.wrapId,
			title:this.title,
			iconX: this.icon.x,
			iconY: this.icon.y
		};
		var tryTemplate = '<div class="mw-try-wrap active" data-id="mw-{wrapId}"> {title}' +
            '<div class="mw-try-close"><i class="fa fa-times"></i></div>' +
            '<div class="mw-try-light">' +
            '</div>';
		footerPanel.append(TemplateParser(tryTemplate, tryData));
		var footerBtn = $('.mw-try-wrap[data-id="mw-'+_t.wrapId+'"]');

		_t.footerButton = footerBtn;
		_t.setActive();

		footerBtn.off('click').on('click',function(){
			if(_t.collapsed){
				_t.expand();
				_t.setActive();
			}else{
				if($(this).hasClass('active')){
					_t.collapse();
				}else{
					_t.setActive();
				}
			}
		});

		footerBtn.find('.mw-try-close').off('click').on('click', function(){
			_t.close();
			//_t.footerButtonIsRemove = true;
		});

		_t.footerButtonIsRemove = false;
	};

	mWItem.prototype.setStartPosition = function() {
		var _t = this;

		var rec = function rec(top, left){
			for(var w in windows.items){
				var win = windows.items[w];
				if(win.top == top && win.left == left){
					if(totalShifted >=6 && totalShifted%6 == 0){
						topZero = 70 + (30 * totalShifted/7);
					}
					topZero += 40;
					leftZero += 40;
					totalShifted++;
					rec(topZero, leftZero);
				}
			}
		};
		var topZero, leftZero, totalShifted;

		switch(_t.startPosition){
			case 'center':


				topZero = (isNaN(+_t.height))? 120 : ($(window).height() / 2) - (_t.height / 2);
				leftZero = ($(window).width() / 2) - (_t.width / 2);
				totalShifted = 0;

				rec(topZero, leftZero);

				_t.top = topZero;
				_t.left = leftZero;
				break;
			case 'shift':

				topZero = 100;
				leftZero = 280;
				totalShifted = 0;

				rec(topZero, leftZero);

				_t.top = topZero;
				_t.left = leftZero;

//                console.log('_t.top: ', _t.top, '_t.left: ', _t.left);
				break;
			default:
				break;
		}
	};

	mWItem.prototype.show = function() {
		var _t = this;
		if(_t.collapsed){
			_t.setStartPosition();
			_t.beforeCollapse.top = _t.top;
			_t.beforeCollapse.left = _t.left;
			_t.expand();
			if(_t.footerButtonIsRemove) _t.createBottomButton();
		}
	};

    mWItem.prototype.setTitleHint = function(){
        var _t = this;
        var titleNode = _t.wrapper.find('.mw-title');
        var titleLength = titleNode.find('.mw-count-title-length').html().length;
        var titleWidth = titleNode.width();
        var upperReg = new RegExp('^[A-Z]?[А-Я]?$');
        var charWidthConst = 10;
        var upperCharWidthConst = 13;
        var stringWidth = 0;
        for(var i = 0; i < titleLength; i++){
            var char = titleNode.find('.mw-count-title-length').html().split('')[i];
            if(upperReg.test(char)){
                stringWidth += upperCharWidthConst;
            }else{
                stringWidth += charWidthConst;
            }
        }

        if(stringWidth >= titleWidth){
            titleNode.addClass('showHint');
        }else{
            titleNode.removeClass('showHint');
        }
    };

    mWItem.prototype.setActive = function(){
        var _t = this;

        var wasActive = _t.active;

        windows.deactivateAll();
        _t.active = true;

        $('.mw-wrap').removeClass('activeW');
        _t.wrapper.addClass('activeW');

        $('.mw-try-wrap').removeClass('active');
        $('.mw-try-wrap[data-id="mw-'+_t.wrapId+'"]').addClass('active');
        if(!wasActive){
            $(_t).trigger('focus');
        }
    };

    mWItem.prototype.setHandlers = function(callback){
        var _t = this;
        var blocks = {
            header:         _t.wrapper.find('.mw-header'),
            collapse:       _t.wrapper.find('.mw-collapse'),
            fullscreen:     _t.wrapper.find('.mw-fullscreen'),
            close:          _t.wrapper.find('.mw-close')
        };

        _t.wrapper.off('click').on('click', function(){
            _t.setActive();
        });

        _t.wrapper.find('.mw-reload-from').off('click').on('click', function(){

            _t.formInstance.reload();

        });




        _t.wrapper.find('.mw-reload-form').off('click').on('click', function(){
            console.log('MODAL - ', _t);
        });

        blocks.header.find('.modal_tab_switcher').off('click').on('click', function(){

            var item = $(this).data('tab');

            if($(this).hasClass('active')){
                return false;
            }

            blocks.header.find('.modal_tab_switcher').removeClass('active');

            $(this).addClass('active');

            _t.wrapper.find('.modal_tab').removeClass('active');

            _t.wrapper.find('.modal_tab[data-tab='+item+']').addClass('active');

            $(_t).trigger('switchTab');
        });

        blocks.collapse.off('click').on('click', function(){
            _t.collapse();
        });

        blocks.header.off('dblclick').on('dblclick', function(){
            if(!_t.hideFullscreen){
                if(_t.stick != 'top'){
                    _t.stick = 'top';
                    _t.stickModal();
                    var wrapperRect = _t.wrapper[0].getBoundingClientRect();
                    _t.beforeCollapse = {
                        top: wrapperRect.top,
                        left: wrapperRect.left,
                        height: wrapperRect.height,
                        width: wrapperRect.width
                    };
                    $(this).addClass('fullscreened');
                }else{

                }
            }
        });

        blocks.fullscreen.off('mousedown').on('mousedown', function(e){
            if(e.button == 0){
                if(!_t.hideFullscreen){
                    if(_t.stick != 'top'){
                        _t.stick = 'top';
                        _t.stickModal();
                        var wrapperRect = _t.wrapper[0].getBoundingClientRect();
                        _t.beforeCollapse = {
                            top: wrapperRect.top,
                            left: wrapperRect.left,
                            height: wrapperRect.height,
                            width: wrapperRect.width
                        };
                        $(this).addClass('fullscreened');
                    }else{
                        _t.stick = undefined;
                        _t.height = _t.beforeFullscreen.height;
                        _t.width = _t.beforeFullscreen.width;
                        _t.resize(function(){
                            _t.wrapper.css({
                                top: _t.beforeFullscreen.top + 'px',
                                left: _t.beforeFullscreen.left + 'px'
                            });
                        });
                        $(this).removeClass('fullscreened');
                    }
                }
            }
        });

        blocks.header.off('mousedown').on('mousedown', function(e){
            _t.setActive();

            if($(e.target).hasClass('mw-insertIntoHeader') || $(e.target).parents('.mw-insertIntoHeader').length > 0 ||  $(e.target).hasClass('mw-save-form') || $(e.target).hasClass('mw-collapse') || $(e.target).hasClass('mw-fullscreen') || $(e.target).hasClass('mw-close') || $(e.target).parents('.mw-actionBtns').length > 0 ){

            }else{
                _t.inMove = _t.draggable;
                _t.rect = _t.wrapper[0].getBoundingClientRect();
                _t.shiftX = mouse.pageX - _t.rect.left;
                _t.shiftY = mouse.pageY - _t.rect.top;
                blocks.header.addClass('handgrab');
            }
        });

        blocks.close.off('click').on('click', function(e){

	        _t.close();

	        //_t.footerButtonIsRemove = true;
        });

        $(document).on('click', function(){
            $('#modalSelectionPrevent').css('zIndex', '-10');
        });

        $(document).on('mouseup', function(){
            var wasMoved = _t.inMove;
            _t.inMove = false;
            $('.noSelectImp').removeClass('noSelectImp');
            $('#modalSelectionPrevent').css('zIndex', '-10');
            if(wasMoved){
                _t.stickModal();
            }
            blocks.header.removeClass('handgrab');

            if(mWPositionHelper.attr('position') == 'undefined'){
                //alert(1234);
                return;
            }else{
                heplerInAnimate = true;
                mWPositionHelper.animate({
                    height: 0,
                    width: 0,
                    top: 0,
                    right: 0
                }, 100, function(){
                    mWPositionHelper.attr('position', 'undefined');
                    mWPositionHelper.hide(0);
                    heplerInAnimate = false;
                    _t.setContentHeight();
                });
            }
            //$('.form-ro-value, .readonlyCell').removeClass('noSelectImp');

        });

        $(document).on('mousemove', function(e){
            if(mouse.isDown){
                if(_t.inMove){
                    $('.form-ro-value, .readonlyCell').addClass('noSelectImp');
                    _t.move();
                }
            }
        });


        _t.setContentHeight();

        if(typeof callback == 'function'){
            callback();
        }
    };

    mWItem.prototype.close = function(){
        var _t = this;
        if(_t.eternal){
            _t.collapse();
            _t.footerButton.remove();
        }
        else {
            _t.wrapper.remove();
            _t.footerButton.remove();
            windows.removeItem(_t);
            $('#modalSelectionPrevent').css('zIndex', '-10');
            //$(_t).trigger('close');
        }

        _t.footerButtonIsRemove = true;
    };

    mWItem.prototype.resize = function(callback){
        var _t = this;

        if(_t.stick == undefined){
            var heightVal = (isNaN(+_t.height))? _t.minHeight : _t.height;
            var resized = false;
            if(_t.wrapper.height() != heightVal){
                _t.wrapper.css({
                    height: heightVal + 'px'
                });
                resized = true;
            }

            if(_t.wrapper.width() != _t.width){
                _t.wrapper.css({
                    width: _t.width + 'px'
                });
                resized = true;
            }

            if(resized){
                $(_t).trigger('resize');
            }
        }

        _t.setContentHeight();
        _t.setTitleHint();

        if(typeof callback == 'function'){
            callback();
        }
    };

    mWItem.prototype.move = function(){
        var _t = this;
        $('#modalSelectionPrevent').css('zIndex', '10000');
        var topValue = (mouse.pageY - _t.shiftY <= 0 )? 0 : mouse.pageY - _t.shiftY ;
        var leftValue = mouse.pageX - _t.shiftX;


        if(mouse.pageX <= 0){
            _t.stick = 'left';
        }else if(mouse.pageX >= ($(window).width() - 1)){
            _t.stick = 'right';
        }else if(mouse.pageY <= 0){
            if(!_t.hideFullscreen){
                _t.stick = 'top';
            }
        }else{
            _t.stick = undefined;
        }
//        console.log('MOVE');
        _t.resize();


        _t.wrapper.css({
            top: topValue + 'px',
            left: leftValue + 'px'
        });

        var wrapperRect = _t.wrapper[0].getBoundingClientRect();
        _t.beforeCollapse = {
            top: wrapperRect.top,
            left: wrapperRect.left,
            height: wrapperRect.height,
            width: wrapperRect.width
        };

        _t.positionHelper();
    };

    mWItem.prototype.positionHelper = function(){
        var _t = this;
        if(mouse.isDown){
            if(_t.inMove){
                if(heplerInAnimate == false){

                    switch(_t.stick){
                        case 'top':
                            if(mWPositionHelper.attr('position') == 'top'){
                                return;
                            }
                            heplerInAnimate = true;
                            mWPositionHelper.show(0);
                            mWPositionHelper.animate({
                                height: $(window).height() - footerPanel.outerHeight() - 20 + 'px',
                                width: $(window).width() - 20 + 'px',
                                top: 10+'px',
                                left: 10+'px'
                            }, 100, function(){
                                mWPositionHelper.attr('position', 'top');
                                heplerInAnimate = false;
                            });
                            break;
                        case 'left':
                            if(mWPositionHelper.attr('position') == 'left'){
                                return;
                            }
                            heplerInAnimate = true;
                            mWPositionHelper.show(0);
                            mWPositionHelper.animate({
                                height: $(window).height() - footerPanel.outerHeight() - 20 + 'px',
                                width: $(window).width()/2 - 20 + 'px',
                                top: 10+'px',
                                left: 10+'px'
                            }, 100, function(){
                                mWPositionHelper.attr('position', 'left');
                                heplerInAnimate = false;
                            });
                            break;
                        case 'right':
                            if(mWPositionHelper.attr('position') == 'right'){
                                return;
                            }
                            heplerInAnimate = true;
                            mWPositionHelper.show(0);
                            mWPositionHelper.css({left: 'inherit'});
                            mWPositionHelper.animate({
                                height: $(window).height() - footerPanel.outerHeight() - 20 + 'px',
                                width: $(window).width() / 2 - 20 + 'px',
                                top: 10+'px',
                                right: 10+'px'
                            }, 100, function(){
                                mWPositionHelper.attr('position', 'right');
                                heplerInAnimate = false;
                            });
                            break;
                        case undefined:
                            if(mWPositionHelper.attr('position') == 'undefined'){
                                return;
                            }
                            heplerInAnimate = true;
                            mWPositionHelper.animate({
                                height: 0,
                                width: 0,
                                top: 0,
                                right: 0
                            }, 100, function(){
                                mWPositionHelper.attr('position', 'undefined');
                                mWPositionHelper.hide(0);
                                heplerInAnimate = false;
                            });
                            break;
                        default:
                            break;
                    }
                }
            }
        }
    };

    mWItem.prototype.stickModal = function(callback){
        var _t = this;
        if(_t.collapsed){
            return;
        }
        _t.wrapper.find('.mw-fullscreen').removeClass('fullscreened');
        switch(_t.stick){
            case 'top':
                var wrapperRectBefore = _t.wrapper[0].getBoundingClientRect();
                _t.beforeFullscreen = {
                    top: wrapperRectBefore.top,
                    left: wrapperRectBefore.left,
                    height: (wrapperRectBefore.height < _t.minHeight) ? _t.minHeight : wrapperRectBefore.height,
                    width: (wrapperRectBefore.width < _t.minWidth) ? _t.minWidth : wrapperRectBefore.width
                };
                _t.wrapper.find('.mw-fullscreen').addClass('fullscreened');
                _t.wrapper.animate({
                    height: $(window).height() - footerPanel.outerHeight() + 'px',
                    width: $(window).width() + 'px',
                    top: 0,
                    left: 0
                }, 100, function(){
                    _t.setTitleHint();
                    console.log('trig3');
                    $(_t).trigger('resize');
                });
                break;
            case 'left':
                _t.wrapper.animate({
                    height: $(window).height() - footerPanel.outerHeight() + 'px',
                    width: $(window).width() / 2 + 'px',
                    top: 0,
                    left: 0
                }, 100, function(){
                    _t.setTitleHint();
                    $(_t).trigger('resize');
                });
                break;
            case 'right':
                _t.wrapper.css({left: 'inherit'});
                _t.wrapper.animate({
                    height: $(window).height() - footerPanel.outerHeight() + 'px',
                    width: $(window).width() / 2 + 'px',
                    top: 0,
                    right: 0
                }, 100, function(){
                    _t.setTitleHint();
                    $(_t).trigger('resize');
                });
                break;
            case undefined:
                break;
            default :
                break;
        }
        _t.setContentHeight();

        if(typeof callback == 'function'){
            callback();
        }
    };

    mWItem.prototype.collapse = function(){
        var _t = this;
        var tryRect = _t.footerButton[0].getBoundingClientRect();
        var wrapperRect = _t.wrapper[0].getBoundingClientRect();
        _t.beforeCollapse = {
            top: wrapperRect.top,
            left: wrapperRect.left,
            height: wrapperRect.height,
            width: wrapperRect.width
        };

        console.log(tryRect.height, tryRect.width);

        _t.wrapper.animate({
            top: tryRect.top + 'px',
            left: tryRect.left + 'px',
            height: tryRect.height + 'px',
            width: tryRect.width + 'px',
            opacity: 0
        }, 250, function(){
            _t.collapsed = true;
            _t.footerButton.removeClass('active');
            $(_t).trigger('resize');
        });
    };

    mWItem.prototype.expand = function(){
        var _t = this;
        var tryRect = _t.footerButton[0].getBoundingClientRect();

        _t.wrapper.animate({
            top: _t.beforeCollapse.top + 'px',
            left: _t.beforeCollapse.left + 'px',
            height: _t.beforeCollapse.height + 'px',
            width: _t.beforeCollapse.width + 'px',
            opacity: 1
        }, 250, function(){
            _t.collapsed = false;
            _t.footerButton.addClass('active');
            $(_t).trigger('resize');
        });
    };

    mWItem.prototype.setContentHeight = function(){
        var _t = this;
        return;
//        var contentHeight = _t.wrapper.outerHeight() - (_t.wrapper.find('.mw-header').outerHeight() + _t.wrapper.find('.mw-preHeaderLine').outerHeight() + 4);
//
//        console.log(_t.wrapper.outerHeight(), _t.wrapper.find('.mw-header').outerHeight(), _t.wrapper.find('.mw-preHeaderLine').outerHeight());
//
//        _t.wrapper.find('.mw-content').height(contentHeight + 'px');
//        _t.height = _t.wrapper.outerHeight();
    };

    mWItem.prototype.reinitHandlers = function() {
        var _this = this;
        var wrapper = this.wrapper;
        var blocks = {
            header: wrapper.find('.mw-header'),
            collapse: wrapper.find('.mw-collapse'),
            fullscreen: wrapper.find('.mw-fullscreen'),
            close: wrapper.find('.mw-close'),
            footerBtn: $('.mw-try-wrap[data-id="'+wrapper.attr('id')+'"]')
        };
        _this.footerButton = blocks.footerBtn;

        blocks.header.on('mousedown', function(e) {
            var self = this;
            _this.activeHeaderElem = _this.wrapper.find('.mw-header')[0];
            var coords = getCoords(_this.activeHeaderElem);
            e = fixEvent(e);
            windows.deactivateAll();
            _this.active = true;
            _this.inMove = (_this.draggable);

            _this.shiftX = e.pageX - coords.left;
            _this.shiftY = e.pageY - coords.top;

            $('.mw-try-wrap').removeClass('active');
            $('.mw-wrap').removeClass('activeW');
            wrapper.addClass('activeW');
            $('.mw-wrap').addClass('inMove');
            blocks.footerBtn.addClass('active');
            $(_this).trigger('activate');

        });
        blocks.footerBtn.on('click', function(e){
            e = fixEvent(e);

            if($(this).hasClass('active')){
                $(this).removeClass('active');
                _this.collapse();
            }else{
                windows.deactivateAll();
                $('.mw-wrap').removeClass('activeW');
                wrapper.addClass('activeW');
                _this.active = true;
                _this.tempPosition = undefined;
                _this.wrapper.show(0);
                $(this).addClass('active');
                _this.resize();
            }

        });
        blocks.collapse.on('click', function(e){
            _this.collapse();
            $(_this).trigger('collapse');
        });
        blocks.close.on('click', function(e){
            _this.wrapper.remove();
            _this.footerButton.remove();
            windows.removeItem(_this);
            $(_this).trigger('close');
        });
        blocks.fullscreen.on('click', function(){
            _this.startPosition = 'center';
            _this.waitForPosition = 'fullscreen';
            _this.tempPosition = 'fullscreen';
            _this.setViewType('fullscreen');
            $(_this).trigger('fullscreen');
        });
        $(document).on('mousemove', function(e){
            var rect = $(wrapper)[0].getBoundingClientRect();
            var pX = fixEvent(e).pageX;
            var pY = fixEvent(e).pageY;



            if(_this.inMove){
                $('#modalSelectionPrevent').css('zIndex', '10000');
                $('body').css('overflow', 'hidden');
                $('body').addClass('noSelect');
                e = fixEvent(e);
                var eve = {
                    pageX: e.pageX,
                    pageY: e.pageY
                };
                _this.moveAt(eve);
            }
            if(wrapper.hasClass('inMove')){
                if(pY == 0 || e.screenY == 0){
                    //_this.wrapper.find('.mw-header').trigger('mouseup');
                }
                if(pY>0){
//                    _this.width = 800;
//                    _this.height = 500;
//                    _this.resize();
                }
            }
            if(wrapper.hasClass('inResize')){
                var value1 = 0;
                var value2 = 0;
                var value3 = 0;
                var value4 = 0;
                switch(currentResize){
                    case 'top':
                        /*console.log(pY-rect.top);
                        value1 = +_this.height + (pY-rect.top);
                        value2 = +_this.top - (pY-rect.top);
                        console.log(value1, value2);
                        _this.height = (value1 <= 400)? 400: value1;
                        _this.top = (value2 <= 0)? 0: value2;
                        _this.resize();*/
                        //blocks.header.trigger('mouseup');
                        return false;
                        break;
                    case 'top_right':
                        break;
                    case 'right':
                        value1 = +_this.width + (pX-(rect.left+rect.width));
                        _this.width = (value1 <=600)? 600: value1;
                        lastWidth = (value1 <=600)? 600: value1;
                        lastLeft = _this.left;
                        _this.resize();
                        break;
                    case 'bottom_right':
                        value1 = _this.width + (pX-(rect.left+rect.width));
                        value2 = +_this.height + ((pY+5)-(rect.top + rect.height));
//                        _this.width = (value1 <= 600)? 600: value1;
//                        _this.height = (value2 <= 400)? 400: value2;
//                        _this.resize();
                        break;
                    case 'bottom':
                        value1 = +_this.height + ((pY+5)-(rect.top + rect.height));
                        _this.height = (value1 <= 400)? 400: value1;
                        _this.resize();
                        break;
                    case 'bottom_left':
                        break;
                    case 'left':
                        value2 = +_this.left + (pX - _this.left);
                        value1 = +_this.width - (value2 - _this.left);
                        _this.width = (value1 <= lastWidth)? lastWidth: value1;
                        _this.left = ((value2 <= 0)? 0: value2 >= lastLeft)? lastLeft: (value2 <= 0)? 0: value2;
                        _this.resize();
                        break;
                    case 'top_left':
                        break;
                }
            }
        });

        wrapper.on('mousemove', function(e){
            var rect = $(wrapper)[0].getBoundingClientRect();
            var pX = fixEvent(e).pageX;
            var pY = fixEvent(e).pageY;
            var wid = _this.width;
            var hei = _this.height;
            wrapper.attr('data-resize','');

            var x = pX-rect.left;
            var y = pY-rect.top;

            if(x <= 5){
                if(y <= 5){
                    wrapper.attr('data-resize','top_left');
                }else if(y>= hei-5){
                    wrapper.attr('data-resize','bottom_left');
                }else{
                    wrapper.attr('data-resize','left');
                }
            }else if(x >= wid-5){
                if(y <= 5){
                    wrapper.attr('data-resize','top_right');
                }else if(y >= hei-5){
                    wrapper.attr('data-resize','bottom_right');
                }else{
                    wrapper.attr('data-resize','right');
                }
            }

            if(y <= 5){
                if(x > 5 && x < wid-5){
                    wrapper.attr('data-resize','top');
                }
            }else if(y >= hei-5){
                if(x > 5 && x < wid-5){
                    wrapper.attr('data-resize','bottom');
                }
            }

        });
//        blocks.header.ondragstart = function() {
//
//            console.log('unselectable');
//
//            $('html, body').addClass('unselectable');
//            return false;
//        };
        wrapper.on('mousedown', function(e){
            wrapper.removeClass('inResize');
            var dataResize = wrapper.attr('data-resize');
            if(dataResize){
                $('#modalSelectionPrevent').css('zIndex', '10000');
                $('body').css('overflow', 'hidden');
                $('body').addClass('noSelect');
                wrapper.addClass('inResize');
                $('html, body').addClass('unselectable');
                currentResize = dataResize;
            }
        });

        $(document).on('mouseup', function(){
            if(_this.waitForPosition != undefined){
                _this.setViewType(_this.waitForPosition);
            }

            $('.mw-wrap').removeClass('inResize');
            $('.mw-wrap').removeClass('inMove');
            $('#modalSelectionPrevent').css('zIndex', '-1');
            $('body').removeClass('noSelect');
            $('body').css('overflow', 'auto');
            $('html, body').removeClass('unselectable');
            currentResize = '';

            document.onmousemove = _this.wrapper.find('.mw-header').onmouseup = null;
            _this.activeHeaderElem = undefined;
            _this.inMove = false;
        });

    };


    var initFunction = function(params){
        var instance = new mWItem(params);
        windows.addItem(instance);
        return instance;
    };

    MB.Core.modalWindows = {
        windows: windows,
        init: initFunction
    };
};






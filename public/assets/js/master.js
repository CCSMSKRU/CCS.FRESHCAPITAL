(function(){

    MB = MB || {};
    MB.Core = MB.Core || {};

    MB.MastersConstructor = function(){
        this.items = [];
    };
    MB.Masters = new MB.MastersConstructor();

    MB.Master = function(params){
        this.id = params.id || MB.Core.guid();
        this.name = params.filename || 'unnamed';
        this.activeId = params['params']['hall_scheme_id'] || params['params']['action_id'] || params['params']['activeId'] || undefined;
    };

    MB.MastersConstructor.prototype.addItem = function(item){
        this.items.push(item);
    };

    MB.MastersConstructor.prototype.getItem = function(id){
        for(var i in this.items){
            if(this.items[i].id == id){
                return this.items[i];
            }
        }
    };

    MB.MastersConstructor.prototype.removeItem = function(id){
        for(var i in this.items){
            if(this.items[i].id == id){
                this.items.splice(i, 1);
            }
        }
    };


    MB.Master.prototype.create = function(callback){
        var _t = this;

        _t.getTemplate(function(){
            MB.Masters.addItem(_t);
            _t.render(function(){
                _t.getScript(function(){
                    _t.setHandlers(function(){
                        if(typeof callback == 'function'){
                            callback(_t);
                        }
                    });
                });
            });
        });
    };

    MB.Master.prototype.getTemplate = function(callback){
        var _t = this;
        var url = "html/masters/" + _t.name + "/" + _t.name + ".html";

        $.ajax({
            url:url,
            success: function(res, status, xhr){
                _t.template = res;
                if(typeof callback == 'function'){
                    callback();
                }
            }
        });
    };

    MB.Master.prototype.getScript = function(callback){
        var _t = this;
        MB.Masters.justAddedId = _t.id;
        $.getScript( "html/masters/" + _t.name + "/" + _t.name + ".js", function() {
            if(typeof callback == 'function'){
                callback();
            }
        });
    };

    MB.Master.prototype.reload = function(callback){

    };

    MB.Master.prototype.render = function(callback){
        var _t = this;

        var modalWindow = MB.Core.modalWindows.init({
            className :        'contentModal',
            wrapId :           _t.id,
            resizable :        true,
            title :            (_t.title)? _t.title : _t.name,
            content :          _t.template,
            startPosition :    'center',
            hideSaveButton:    true,
            draggable :        true,
            top :              0,
            left :             0,
            waitForPosition :  undefined,
            active :           true,
            inMove :           false,
            minHeight :        700,
            minWidth :         1300,
            activeHeaderElem : undefined,
            footerButton :     undefined,
            contentHeight :    0
        }).render(function(){

            if(typeof callback == 'function'){
                callback();
            }
        });
    };

    MB.Master.prototype.setHandlers = function(callback){
        var _t = this;
        var modalWindow = MB.Core.modalWindows.windows.getWindow(_t.id);
        _t.wrapper = modalWindow.wrapper;

        $(modalWindow).off('close').on('close', function(){
            MB.Masters.removeItem(_t.id);
        });


        var m_wrap = _t.wrapper.find('.master-wrapper');
        var m_vis = _t.wrapper.find('.master-vis');
        var m_train = _t.wrapper.find('.master-train');
        var m_steps = _t.wrapper.find('.master-step');
        var m_fwd = _t.wrapper.find('.master-step-fwd');
        var m_back = _t.wrapper.find('.master-step-back');
        var m_finish = _t.wrapper.find('.master-finish');
        var stepsCount = m_steps.length;

        m_train.css('width', stepsCount * 100 + '%');
        m_steps.css('width', 100 / stepsCount + '%');
        m_wrap.animate({opacity: 1},100);

        function disableButtons(){
            var activeStep = _t.wrapper.find('.master-step.active');
            var activeIdx = parseInt(activeStep.data('step'));

            m_back.removeClass('disabled');
            m_fwd.removeClass('disabled');
            m_finish.removeClass('disabled');

            console.log(activeIdx, stepsCount);

            if(activeIdx == 0){
                m_back.addClass('disabled');
                m_finish.addClass('disabled');
            }else if(activeIdx == stepsCount-1){

                m_fwd.addClass('disabled');
            }else{
                m_finish.addClass('disabled');
            }
        }

        disableButtons();

        m_fwd.off('click').on('click', function(){

            if($(this).hasClass('disabled')){ return; }

            var activeStep = _t.wrapper.find('.master-step.active');
            var activeIdx = parseInt(activeStep.data('step'));

            m_train.animate({
                marginLeft: '-' + (activeIdx+1) * 100 + '%'
            }, 350, function(){

            });
            activeStep.removeClass('active');
            activeStep.next().addClass('active');
            disableButtons();
        });

        m_back.off('click').on('click', function(){

            if($(this).hasClass('disabled')){ return; }

            var activeStep = _t.wrapper.find('.master-step.active');
            var activeIdx = parseInt(activeStep.data('step'));

            m_train.animate({
                marginLeft: '-' + (activeIdx-1) * 100 + '%'
            }, 350, function(){

            });
            activeStep.removeClass('active');
            activeStep.prev().addClass('active');
            disableButtons();
        });


        if(typeof callback == 'function'){
            callback();
        }
    };

}());

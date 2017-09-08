(function(){

    MB = MB || {};
    MB.Core = MB.Core || {};
    MB.Core.checkboxes = {
        list: [],
        getItem: function(id){
            for(var i in MB.Core.checkboxes.list){
                if(MB.Core.checkboxes.list[i].id == id){
                    return MB.Core.checkboxes.list[i];
                }
            }
        },
        addItem: function(item){
            MB.Core.checkboxes.list.push(item);
        },
        removeItem: function(id){
            for(var i in MB.Core.checkboxes.list){
                if(MB.Core.checkboxes.list[i].id == id){
                    MB.Core.checkboxes.list.splice(i,1);
                }
            }
        }
    };

    $.fn.checkboxIt = function(){

        var CheckboxIt = function(params){
            this.elem = params.elem || undefined;
            this.id = params.id || MB.Core.guid();
            this.value = (params.value == 'true');
            this.type = params.type || 'filter';


            if(this.value) $(this.elem).addClass('checked');
        };



        CheckboxIt.prototype.setValue = function(setVal){
            var _t = this;
            if(!setVal){
                _t.elem.removeClass('checked');
                _t.elem.find('i').removeClass('fa-check').addClass('fa-times');
                _t.value = false;
            }else{
                _t.elem.addClass('checked');
                _t.elem.find('i').removeClass('fa-times').addClass('fa-check');
                _t.value = true;
            }
        };

        CheckboxIt.prototype.setHandlers = function(){
            var _t = this;

            if(_t.type == 'inTable'){
                _t.elem.off('click').on('click', function(){
                    if(!event.ctrlKey) {
                        if (_t.value) {
                            _t.elem.removeClass('checked');
                            _t.elem.find('i').removeClass('fa-check').addClass('fa-times');
                            _t.value = false;
                            $(_t).trigger('toggleCheckbox');
                        } else {
                            _t.elem.addClass('checked');
                            _t.elem.find('i').removeClass('fa-times').addClass('fa-check');
                            _t.value = true;
                            $(_t).trigger('toggleCheckbox');
                        }
                    }
                });
            }else if(_t.type == 'inline'){

                _t.elem.off('click').on('click', function(event){
                    if(!event.ctrlKey) {
                        if(_t.value){
                            _t.elem.removeClass('checked');
                            _t.elem.find('i').removeClass('fa-check').addClass('fa-times');
                            _t.value = false;
                            $(_t).trigger('toggleCheckbox');
                        }else{
                            _t.elem.addClass('checked');
                            _t.elem.find('i').removeClass('fa-times').addClass('fa-check');
                            _t.value = true;
                            $(_t).trigger('toggleCheckbox');
                        }
                    }
                });
            }else{
                _t.elem.off('click').on('click', function(){
                    if(_t.value){
                        _t.train.animate({
                            marginLeft: -100+'px'
                        }, 150, function(){
                            _t.value = false;
                            $(_t).trigger('toggleCheckbox');
                        });
                    }else{
                        _t.train.animate({
                            marginLeft: 0
                        }, 150, function(){
                            _t.value = true;
                            $(_t).trigger('toggleCheckbox');
                        });
                    }
                });
            }
        };

        if(typeof this == 'object'){
            //console.log(this);
            if(this.length > 1){

                this.each(function(index, elem){
                    elem = $(elem);
                    var checkboxInstance = new CheckboxIt({
                        elem: elem,
                        id: elem.attr('data-id') || MB.Core.guid(),
                        type: elem.attr('data-type'),
                        value: elem.attr('data-value')
                    });

                    MB.Core.checkboxes.addItem(checkboxInstance);

                    var innerCheckbox = '';
                    if(checkboxInstance.type == 'inTable'){
                        var icon = (checkboxInstance.value)? '<i class="fa fa-check"></i>' : '<i class="fa fa-times"></i>';
                        innerCheckbox = '<div class="ct-inTable-checkbox">'+icon+'</div>';
                        checkboxInstance.elem.html(innerCheckbox);
                        checkboxInstance.setHandlers();
                    }else if(checkboxInstance.type == 'inline'){
                        var icon = (checkboxInstance.value)? '<i class="fa fa-check"></i>' : '<i class="fa fa-times"></i>';
                        innerCheckbox = '<div class="ct-inTable-checkbox">'+icon+'</div>';
                        checkboxInstance.elem.html(innerCheckbox);
                        checkboxInstance.setHandlers();
                    }else{
                        innerCheckbox = '<div class="checkboxIt-innerTrain"><div class="checkboxIt-vagon" data-value="true"><i class="fa fa-check"></i></div><div class="checkboxIt-vagon" data-value="false"><i class="fa fa-times"></i></div></div>';
                        checkboxInstance.elem.html(innerCheckbox);
                        checkboxInstance.train = checkboxInstance.elem.find('.checkboxIt-innerTrain');
                        if(!checkboxInstance.value){
                            checkboxInstance.train.css('marginLeft', '-100px');
                        }
                        checkboxInstance.setHandlers();
                    }

                    return checkboxInstance;
                });

            }else{
                var checkboxInstance = new CheckboxIt({
                    elem: this,
                    id: this.attr('data-id') || MB.Core.guid(),
                    type: this.attr('data-type'),
                    value: this.attr('data-value')
                });

                MB.Core.checkboxes.addItem(checkboxInstance);

                var innerCheckbox = '';
                if(checkboxInstance.type == 'inTable'){
                    var icon = (checkboxInstance.value)? '<i class="fa fa-check"></i>' : '<i class="fa fa-times"></i>';
                    innerCheckbox = '<div class="ct-inTable-checkbox">'+icon+'</div>';
                    checkboxInstance.elem.html(innerCheckbox);
                    checkboxInstance.setHandlers();
                }else if(checkboxInstance.type == 'inline'){
                    var icon = (checkboxInstance.value)? '<i class="fa fa-check"></i>' : '<i class="fa fa-times"></i>';
                    innerCheckbox = '<div class="ct-inTable-checkbox">'+icon+'</div>';
                    checkboxInstance.elem.html(innerCheckbox);
                    checkboxInstance.setHandlers();
                }else{
                    innerCheckbox = '<div class="checkboxIt-innerTrain"><div class="checkboxIt-vagon" data-value="true"><i class="fa fa-check"></i></div><div class="checkboxIt-vagon" data-value="false"><i class="fa fa-times"></i></div></div>';
                    checkboxInstance.elem.html(innerCheckbox);
                    checkboxInstance.train = checkboxInstance.elem.find('.checkboxIt-innerTrain');
                    if(!checkboxInstance.value){
                        checkboxInstance.train.css('marginLeft', '-100px');
                    }
                    checkboxInstance.setHandlers();
                }

                return checkboxInstance;
            }
        }



    };

}());

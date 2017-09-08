(function(){

    MB = MB || {};
    MB.Core = MB.Core || {};
    MB.Core.daysweekpickers = {
        list: [],
        getItem: function(id){
            for(var i in MB.Core.daysweekpickers.list){
                if(MB.Core.daysweekpickers.list[i].id == id){
                    return MB.Core.daysweekpickers.list[i];
                }
            }
        },
        addItem: function(item){
            MB.Core.daysweekpickers.list.push(item);
        },
        removeItem: function(id){
            for(var i in MB.Core.daysweekpickers.list){
                if(MB.Core.daysweekpickers.list[i].id == id){
                    MB.Core.daysweekpickers.list.splice(i,1);
                }
            }
        }
    };

    $.fn.daysweekpicker = function(){

        var Daysweekpicker = function(params){
            this.elem = params.elem || undefined;
            this.id = params.id || MB.Core.guid();
            this.dd = undefined;
            this.value = [];
            this.names = [];
        };

        Daysweekpicker.prototype.setValue = function(){
            var _t = this;
            _t.elem.val(_t.names.join(', '));
            $(_t).trigger('changeDays');
        };

        Daysweekpicker.prototype.clear = function(){
            var _t = this;
            _t.value = [];
            _t.names = [];
            _t.dd.find('li.selected').removeClass('selected');
            _t.setValue();
        };

        Daysweekpicker.prototype.hideOut = function(){
            var _t = this;

            _t.setValue();
            _t.dd.hide(0);
        };

        Daysweekpicker.prototype.setHandlers = function(){
            var _t = this;
            var listOfValues = _t.dd.find('.daysweek-list li');

            _t.elem.off('click').on('click', function(){
                var rect = _t.elem[0].getBoundingClientRect();
                _t.dd.css({
                    top: rect.top+rect.height+'px',
                    left: rect.left+1+'px'
                }).show(0);
            });

            _t.confirmBtn.off('click').on('click', function(){
                _t.hideOut();
            });

            listOfValues.off('click').on('click', function(){
                _t.value = [];
                _t.names = [];
                if($(this).hasClass('selected')){
                    $(this).removeClass('selected');
                }else{
                    $(this).addClass('selected');
                }
                for(var i=0; i<listOfValues.length; i++){
                    if(listOfValues.eq(i).hasClass('selected')){
                        _t.value.push(listOfValues.eq(i).attr('data-day'));
                        _t.names.push(listOfValues.eq(i).html());
                    }
                }
            });

            $(document).on('click', function(e){
                e = e || window.event;
                if(
                    $(e.target).parents('.daysweek-dd-wrapper').length == 0 &&
                    !$(e.target).hasClass('daysweek-dd-wrapper') &&
                    $(e.target).parents('.daysweekpicker').length == 0 &&
                    !$(e.target).hasClass('daysweekpicker')
                ){
                    _t.hideOut();
                }
            });
        };

        var dwPicker = new Daysweekpicker({
            elem: this,
            id: this.attr('data-id') || MB.Core.guid()
        });

        MB.Core.daysweekpickers.addItem(dwPicker);

        var ddHtml = '<div class="daysweek-dd-wrapper">' +
                        '<ul class="daysweek-list">' +
                            '<li data-day="1">Пн</li>' +
                            '<li data-day="2">Вт</li>' +
                            '<li data-day="3">Ср</li>' +
                            '<li data-day="4">Чт</li>' +
                            '<li data-day="5">Пт</li>' +
                            '<li data-day="6">Сб</li>' +
                            '<li data-day="7">Вс</li>' +
                        '</ul>' +
                        '<div class="daysweek-confirm">Выбрать</div>'+
                    '</div>';

        $('body').append(ddHtml);
        dwPicker.dd = $('body').find('.daysweek-dd-wrapper').last();
        dwPicker.confirmBtn = dwPicker.dd.find('.daysweek-confirm')
        dwPicker.setHandlers();

        return dwPicker;

    };

}());

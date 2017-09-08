var clientScreenWidget_init = function(){

    var clientScreenWidget = {
        toggler: $('#clientScreenWidget-toggler'),
        widget: $('#clientScreenWidget'),
        Inner: $('#clientScreenWidgetInner'),
        handle: function(){
            var self = this;
            this.toggler.on('click', function(){
                if(self.toggler.hasClass('opened')){
                    self.toggler.removeClass('opened');
                    self.close();
                }else{
                    self.toggler.addClass('opened');
                    self.open();
                }
            });
        },
        open: function(){

            this.Inner.animate({
                width: 275+'px'
            }, 300);
        },
        close: function(){
            this.Inner.animate({
                width: 0+'px'
            }, 300);
        }
    };

    clientScreenWidget.handle();

    uiTabs();
    uiUl();
    inlineEditing();
    $('input[type="checkbox"]').not('.noUniform').uniform();

    $('#clientScreenWidgetDatepicker').datepicker({
        autoclose: true,
        format: "dd.mm.yyyy",
        todayHighlight: true
    });

    MB.Core.clientScreenWidget = clientScreenWidget;
};

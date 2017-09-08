(function(){

    $.fn.fn_train = function(){

        var Fn_train = function(params){
            this.elem = params.elem || undefined;
        };

        Fn_train.prototype.slideLeft = function(callback){
            var _t = this;
            _t.train.animate({
                marginLeft: -100+'%'
            }, 150, function(){
                if(typeof callback == 'function'){
                    callback();
                }
            });
        };

        Fn_train.prototype.slideRight = function(callback){
            var _t = this;
            _t.train.animate({
                marginLeft: 0
            }, 150, function(){
                if(typeof callback == 'function'){
                    callback();
                }
            });
        };

        Fn_train.prototype.setHandlers = function(){
            var _t = this;
            _t.train = _t.elem.find('.fn-train');
            _t.lVagon = _t.elem.find('.fn-vagon').eq(0);
            _t.rVagon = _t.elem.find('.fn-vagon').eq(1);

        };


        var train = new Fn_train({
            elem: this
        });

        train.setHandlers();

        return train;

    };

}());

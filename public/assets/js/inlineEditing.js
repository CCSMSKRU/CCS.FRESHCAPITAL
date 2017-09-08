var inlineEditing = function(){

    function confirmInlineEditing(inpElem, oldVal){

        function setValue(inpElem, oldVal, type){
            var val = inpElem.val(),
                regExp = new RegExp(/^\s+$/),
                container = inpElem.parents('.inlineEditing');

            /*if(type){
                val = oldVal;
            }else{
                //if(regExp.test(val) || !val){
                if(regExp.test(val)){
                    val = oldVal;
                }
            }*/
            container.html(val).removeClass('inEditing');

            var eParams = { elem: container, value : val };

            $(document).trigger('inlineEditingUpdate', eParams);
        }

        $(document).on('change', inpElem, function(){
            setValue(inpElem, oldVal, false);
        });

        inpElem.blur(function(){
            setValue(inpElem, oldVal, false);
        });

        inpElem.on('keydown', function(event){
            event = event || window.event;

            if(event.keyCode == 27){
                setValue(inpElem, oldVal, true);
            }else if(event.keyCode == 13){
                setValue(inpElem, oldVal, false);
            }

        });


    }

    $(document).on('dblclick', '.inlineEditing', function(event){
        event = event || window.event;
        var container = $(this),
            val = $(this).html(),
            input = '<input type="text" class="form-control inp_inlineEditing" placeholder="'+val+'">';

        if(container.hasClass('inEditing')){
            return false;
        }else{
            container.html(input).addClass('inEditing');
            var inputElem = container.find('input');
            inputElem.focus();

            confirmInlineEditing(inputElem, val);
        }
    });
};

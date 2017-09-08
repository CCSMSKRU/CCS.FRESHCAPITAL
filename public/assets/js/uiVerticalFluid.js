var verticalFluid = function(){

    return;
    //Later

    var vf_Parent;
    vf_Parent = $('.sc_vertical_fluid_parent');

    for(var i=0; i<vf_Parent.length; i++){
        var container, containeHeight, blocks, prorates;

        container = vf_Parent.eq(i);
        containeHeight = container.height();
        blocks = container.find('.sc_vertical_fluid');
        prorates = container.find('.sc_vertical_fluid_prorate');



        /*for(var k =0; k<blocks.length; k++){
            var block = blocks.eq(k);
            block.height(containeHeight/blocks.length+ 'px');
        }*/
    }

};

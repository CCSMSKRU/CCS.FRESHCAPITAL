var closeModal = function(){

    $(document).on('click', '.closeModal', function(){
        var id = $(this).parents('.modal-item').attr('id').substr(6, 37);

        $('li[data-object="'+id+'"] i').click();

    });

};


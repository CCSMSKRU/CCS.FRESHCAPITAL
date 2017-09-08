(function () {

    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_action', formID);
    var formWrapper = $('#mw-'+formInstance.id);

    var modalInstance = MB.Core.modalWindows.windows.getWindow(formID);
    modalInstance.stick = 'top';
    modalInstance.stickModal();

    var defaultImagePath = 'assets/img/default-action-image.png';
    var posterImageWrapper = formWrapper.find('.posterImageWrapper');
    var imageUrl = (posterImageWrapper.find('input.fn-control').attr('value') == '')? defaultImagePath : 'upload/'+posterImageWrapper.find('input.fn-control').attr('value');
    var imageName = (posterImageWrapper.find('input.fn-control').attr('value') == '')? 'Постер мероприятия': posterImageWrapper.find('input.fn-control').attr('value');

    posterImageWrapper.find('img').attr('src', imageUrl);
    posterImageWrapper.find('.fn-field-image-name').html(imageName);

    var il = MB.Core.fileLoader;

    formWrapper.find('.fn-field-image-change').off('click').on('click', function(){
        il.start({
            success:function(fileUID){
                var tmpObj = {
                    data: fileUID.base64Data,
                    name: fileUID.name,
                    id:fileUID.uid
                };
                formWrapper.find('.fn-field-image-input').val(tmpObj.name).trigger('input');
                formWrapper.find('.fn-filed-image-image img').attr('src', tmpObj.data);
                formWrapper.find('.fn-field-image-name').html(tmpObj.name);
            }
        });
    });

    formWrapper.find('.fn-field-image-delete').off('click').on('click', function(){
        formWrapper.find('.fn-field-image-input').val('').trigger('input');
        formWrapper.find('.fn-filed-image-image img').attr('src', defaultImagePath);
        formWrapper.find('.fn-field-image-name').html('Постер мероприятия');
    });


//    var hallSelectWrapper = formWrapper.find('.hall-Select');
//    var hallSchemeSelectWrapper = formWrapper.find('.hall-scheme-Select');
//
//    var hallSelect = MB.Core.select3.list.getSelect(hallSelectWrapper.find('.select3-wrapper').attr('id'));
//    var hallSchemeSelect = MB.Core.select3.list.getSelect(hallSchemeSelectWrapper.find('.select3-wrapper').attr('id'));
//
//    $(hallSelect).on('changeVal', function(e, was, now){
//        var strWhere = '';
//        if(now.id != ''){
//            strWhere = 'HALL_ID = '+now.id;
//            hallSchemeSelect.whereString = strWhere;
//        }else{
//            strWhere = '';
//            hallSchemeSelect.whereString = strWhere;
//        }
//    });



})();
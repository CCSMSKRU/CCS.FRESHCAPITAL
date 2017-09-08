/**
 * Created by goptarev on 09.12.14.
 */
(function () {

    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_class_profile', formID);
    var formWrapper = $('#mw-' + formInstance.id);

    var modalInstance = MB.Core.modalWindows.windows.getWindow(formID);
    modalInstance.stick = 'top';
    modalInstance.stickModal();
    formInstance.lowerButtons = [
        {
            title: 'Синхронизировать настройки полей client_object_fields_profile c настройками полей class_fields_profile',
            color: "orange",
            icon: null,
            type: "SINGLE",
            hidden: !(formInstance.data.data[0].name == 'client_object_fields_profile'),
            condition: [],
            handler: function() {
                if ($(this).hasClass('disabled')) return;
                bootbox.dialog({
                    title: 'Синхронизировать настройки полей client_object_fields_profile c настройками полей class_fields_profile',
                    message:
                    '<label class="row-label">Синхранизировать поля</label>' +
                    '<input type="text" class="row-label form-control" id="sync_fields_list" value="*">',
                    buttons:{
                        success: {
                            label: 'Синхранизировать',
                            callback: function(){
                                var sync_fields_list =          $('#sync_fields_list').val();
                                var o = {
                                    command: 'sync_class_CFP_and_COFP',
                                    object: 'Class_profile',
                                    params: {sync_fields: sync_fields_list}
                                };


                                socketQuery(o, function (res) {
                                    toastr[res.toastr.type](res.toastr.message);
                                });
                            }
                        },
                        error: {
                            label: 'Отмена',
                            callback: function(){

                            }
                        }
                    }
                });
            }
        }

    ];



})();


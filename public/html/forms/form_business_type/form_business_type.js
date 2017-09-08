/**
 * Created by goptarev on 09.12.14.
 */
(function () {

    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_business_type', formID);
    var formWrapper = $('#mw-' + formInstance.id);

    var modalInstance = MB.Core.modalWindows.windows.getWindow(formID);
    //modalInstance.stick = 'top';
    //modalInstance.stickModal();
    formInstance.lowerButtons = [


    ];



})();


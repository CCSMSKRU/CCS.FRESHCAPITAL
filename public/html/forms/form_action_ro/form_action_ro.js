(function () {
    var instance = MB.O.forms["form_action_ro"];
    instance.custom = function (callback) {
        var id = MB.O.forms.form_action_ro.activeId;
        var iFrame;
        var width = MB.Core.getClientWidth();
        var height = MB.Core.getClientHeight();
        $('#create_action_ticket_list').off().on('click', function () {
            $(".create_action_ticket_list_frame").remove();
            iFrame = "<iframe class=\"create_action_ticket_list_frame iFrameForPrint\" style=\"display:none;\" src=\"" + "html/report/action_ticket_list/action_ticket_list.html?action_id=" + id + "&where= and status = 'PAID'\" width=\"" + width + "\" height=\"" + height + " \" align=\"left\"></iframe>";
            $("body").append(iFrame);
        });
        $('#create_action_ticket_list_all').off().on('click', function () {
            $(".create_action_ticket_list_frame").remove();
            var where = " and status IN ('PAID','CLOSED','ON_REALIZATION','CLOSED_REALIZATION')";
            iFrame = "<iframe class=\"create_action_ticket_list_frame iFrameForPrint\" style=\"display:none;\" src=\"" + "html/report/action_ticket_list/action_ticket_list.html?action_id=" + id + "&where="+where+"\" width=\"" + width + "\" height=\"" + height + " \" align=\"left\"></iframe>";
            $("body").append(iFrame);
        });
        callback();
    };
})();
(function(){

    var modal = $('.mw-wrap').last();
    var contentID = MB.Contents.justAddedId;
    var contentInstance = MB.Contents.getItem(contentID);
    var contentWrapper = $('#mw-' + contentInstance.id);

    var tableId = MB.Core.guid();
    var table = new MB.TableN({
        name:           'tbl_order_history_log',
        id:             tableId,
        parent_id:      contentInstance.activeId,
        parentObject:   contentInstance
    });

    table.create(contentWrapper.find('.order_history_wrapper'));

}());
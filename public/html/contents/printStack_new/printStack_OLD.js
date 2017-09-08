(function(){

    var contentID = MB.Contents.justAddedId;
    var contentInstance = MB.Contents.getItem(contentID);
    var contentWrapper = $('#mw-' + contentInstance.id);

    var tickets = {
        portion:2,
        items:[],
        newItem:function(obj){
            if (typeof obj!=="object"){
                return;
            }
            if (!obj.ORDER_TICKET_ID && !obj.id){
                return;
            }
            tickets.items.push({
                id:obj.ORDER_TICKET_ID || obj.id,
                place:obj.AREA_GROUP+' '+obj.LINE_WITH_TITLE+' '+obj.PLACE_WITH_TITLE,
                action:obj.ACTION,
                sca_series:obj.SCA_SERIES || '',
                sca_number:obj.SCA_NUMBER || '',
                print_status:obj.PRINT_STATUS,
                print_status_ru:obj.PRINT_STATUS_RU,
                sort_no:tickets.items.length
            });
        }
    };

    function load_tickets(arr){
        if (typeof arr!=="object"){
            console.log('В load_tickets не приходит arr.');
            return;
        }
        var ids = arr.join(',');
        var o  = {command:"get",object:"order_ticket",params:{where:"order_ticket_id in ("+ids+")"}};
        socketQuery(o,function(res){
            res = JSON.parse(res).results[0];
            var data = jsonToObj(res);
            console.log(data);
            for (var i in data) {
                tickets.newItem(data[i]);
            }
            console.log(tickets.items);
        });
    }
    load_tickets([14657,14655]);
   /* var o = {
        "0": {
            "ORDER_ID": "3819",
            "ORDER_TICKET_ID": "14657",
            "ACTION_SCHEME_ID": "445058",
            "ACTION": "Приключения Петра Мамонова (09-07-2015 10:40:00)",
            "ACTION_DATE_TIME": "09-07-2015 10:40:00",
            "ACTION_DATE": "09-07-2015 00:00:00",
            "LINE_WITH_TITLE": "Ряд 6",
            "PLACE_WITH_TITLE": "Место 13",
            "AREA_GROUP": "Амфитеатр",
            "STATUS": "CANCELED",
            "STATUS_RU": "Отменен",
            "TICKET_TYPE": "TICKET",
            "TICKET_TYPE_RU": "Билет",
            "PRICE": "356",
            "TICKET_DATE": "16-01-2015 17:33:08",
            "BARCODE": "369887",
            "SCA_SERIES": "",
            "SCA_NUMBER": "",
            "CREATED_USER_ID": "74",
            "USER_FULLNAME": "Гоптарев Александр ",
            "PRINT_STATUS": "NOT_PRINTED",
            "PRINT_STATUS_RU": "Не напечатан",
            "TICKET_ACTION_MARGIN": "",
            "TICKET_SERVICE_FEE": ""
        }
    };*/
    console.log('executed');


}());


//var o  = {command:"get",object:"order_ticket",params:{where:"order_ticket_id in (14657,14655)"}};
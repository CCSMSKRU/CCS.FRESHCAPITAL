$(document).ready(function () {
    $_GET = GET();
    var action_id = $_GET.action_id || 0;
    var order_by_type = $_GET.order_by_type || 'user';
    var where = $_GET.where || "";
    var title = ($_GET.where.indexOf('CLOSED') == -1)? 'Электронные билеты' : 'Билеты';
    var html;
    var o = {
        command: "get",
        object: "order_ticket",
        sid: MB.User.sid,
        params: {
            columns: 'CRM_USER_NAME, CRM_USER_PHONE, CRM_USER_EMAIL, AREA_GROUP, LINE_WITH_TITLE, PLACE_WITH_TITLE, BARCODE,ORDER_TICKET_ID',
            where: "action_id  = " + action_id + where,
            order_by: (order_by_type == 'user')? 'CRM_USER_NAME, CRM_USER_PHONE, CRM_USER_EMAIL':'AREA_GROUP, LINE, PLACE'
        }
    };
    socketQuery(o, function (res) {
        var data = JSON.parse(res);
        data = data.results[0];
        if (typeof data !== "object") {
            return;
        }
        data = jsonToObj(data);
        html = '<h1>'+title+'</h1><div id="action_ticket_list_table">';
        for (var i in data) {
            html += '<div class="tr">';
            html += '<div class="td1">' + data[i]['CRM_USER_NAME'] + '<br>' + data[i]['CRM_USER_PHONE'] + '<br>' + data[i]['CRM_USER_EMAIL'] + '</div>';
            html += '<div class="td2">' + data[i]['AREA_GROUP'] + '<br>' + data[i]['LINE_WITH_TITLE'] + '<br>' + data[i]['PLACE_WITH_TITLE'] + '</div>';
            html += '<div class="td3">Билет №:' + data[i]['ORDER_TICKET_ID'] + '<br>Код: ' + data[i]['BARCODE'] + '</div>';
            html += '<div class="barcode td4">' + data[i]['BARCODE'] + '</div>';
            html += '</div>';
        }
        html += "</div>";

        $('body').append(html);
        $(".barcode").each(function () {
            var code = $(this).html();
            $(this).html(DrawHTMLBarcode_Code39(code, 0, "no", "cm", 0, 20, 1, 2, "bottom", "center", "", "black", "white"));
        });
        print();

        //console.log(res);
    })
});

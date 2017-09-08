$(document).ready(function () {
    $_GET = GET();
    var action_id = $_GET.action_id || 0;
    var order_by_type = $_GET.order_by_type || 'USER';
    var where = $_GET.where || "";
    var html;
    var o = {
        command: "get",
        object: "order_additional_service",
        sid: MB.User.sid,
        params: {
            columns: '',
            where: "action_id  = " + action_id + where,
            order_by: (order_by_type == 'user')? 'CRM_USER_NAME, CRM_USER_PHONE, CRM_USER_EMAIL':'AREA_GROUP_NAME, LINE, PLACE'
        }
    };
    socketQuery(o, function (res) {
        var data = JSON.parse(res);
        data = data.results[0];
        if (typeof data !== "object") {
            return;
        }
        data = jsonToObj(data);
        html = '<h1>Услуги</h1><div id="action_ticket_list_table">';
        for (var i in data) {
            html += '<div class="tr">';
            html += '<div class="td1">' + data[i]['CRM_USER_NAME'] + '<br>' + data[i]['CRM_USER_PHONE'] + '<br>' + data[i]['CRM_USER_EMAIL'] + '</div>';
            html += '<div class="td2">' + data[i]['AREA_GROUP_NAME'] + '<br>' + data[i]['LINE_TITLE'] + ' ' + data[i]['LINE'] + '<br>' + data[i]['PLACE_TITLE'] + ' ' + data[i]['PLACE'] + '</div>';
            html += '<div class="td3">Услуга №:' + data[i]['ORDER_ADDITIONAL_SERVICE_ID'] + ' - ' + data[i]['ADDITIONAL_SERVICE_NAME'] + '<br>Код: ' + data[i]['BARCODE'] + '</div>';
            html += '<div class="barcode td4">' + data[i]['BARCODE'] + '</div>';
            html += '</div>';
        }
        html += "</div>";

        $('body').append(html);
        $(".barcode").each(function (idx, elem) {
            var code = $(this).html();
            $(this).html(DrawHTMLBarcode_Code39(code,0,"yes","in", 0,3,0.2,3,"bottom","center", "","black","white"));
//            $(this).html(DrawHTMLBarcode_Code39(code, 0, "no", "cm", 0, 20, 1, 2, "bottom", "center", "", "black", "white"));
        });
        print();
    })
});


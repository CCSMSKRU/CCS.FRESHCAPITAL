<?php

  $obj = $_POST;
  $cf = $_POST['cf'];
  $cf2 = $_POST['cf2'];
  $order_id = $_POST['cf'];
  $amount = $_POST['price'];
  $token = $_POST['token'];
  $ext_order_id = $obj['cf2'];
  $payment_id = $obj['paymentcode'];
  $cf3 = $obj['cf3'];

    //print_r($obj);
  //$host = $_SERVER['HTTP_HOST'];
  $url = str_replace("payment_ok.php","",$_SERVER['PHP_SELF']);
?>


<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <script type="text/javascript">
        var params = location.search;
        var back = (params.match(/back=/)!=null) ? String(params.match(/back=.+/)).replace(/back=/,'') : 0;
    </script>
    <script src="jquery-1.11.1.min.js"></script>
    <style>
        body, html {
            margin: 0;
            padding: 0;
        }
        .block {
            position: relative;
            width: 600px;
            min-height: 240px;
            background: #fff;
            overflow: hidden;
            margin: 30px auto;
            background-color: #fff;
            box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.5);
            border-radius: 5px;
            font-family: 'Open Sans', sans-serif;
            font-size: 14px;
            padding-bottom: 65px;
        }
        .pok_header{
            padding: 18px 16px 16px 16px;
            position: relative;
            border-bottom: 1px solid #F3F3F3;
            background-color: #000002;
            min-height: 20px;
            /*height:55px;*/
        }
        .pok_content{
            padding: 15px;
        }
        .pok_header img{
        }
        .pok_footer{
            position: absolute;
            bottom: 0;
            height: 45px;
            width: 100%;
            padding-top: 10px;
            border-top: 1px solid #F1F1F1;
            background-color: #f8f8f8;

        }
        .pok_footer .pokBtn{
            height: 27px;
            width: 140px;
            border-radius: 3px!important;
            background-color: rgb(38, 139, 34);
            color: #fff;
            position: relative;
            float: right;
            margin-right: 10px;
            text-align: center;
            padding-top: 9px;
            cursor: pointer;
        }
        .pok_footer .pokBtn:hover{
            background-color: rgb(26, 103, 26);
        }

        .switchLang{
            position: absolute;
            top: 16px;
            right: 13px;
        }
        .switchLang .lang{
            height: 20px;
            float: left;
            color: #ffffff;
            padding: 2px 4px;
            font-family: 'Open Sans', sans-serif;
            font-size: 12px;
            cursor: pointer;
            background-color: #D7A1DF;
        }
        .switchLang .lang.active{
            background-color: #6446B3;
            color: #ffffff;
        }
        .switchLang .lang.rus{
            border-radius: 2px 0 0 2px;
        }
        .switchLang .lang.eng{
            border-radius: 0 2px 2px 0;
        }
        .switchableContent {
            display: none;
        }
        .switchableContent.active {
            display: block;
        }
        .smallGrey{
            font-size: 12px;
            color: #8e8e8e;
        }

        .block .timer {
            color: red;
        }
    </style>
</head>
<body>
<input type="hidden" id="mOrderId" value="<?php echo $order_id;?>">
<input type="hidden" id="host" value="<?php echo $cf2;?>">
<input type="hidden" id="mFrame" value="<?php echo $cf3;?>">
<input type="hidden" id="payment_id" value="<?php echo $payment_id;?>">
<div class="block">
    <div class="pok_header">
        <div class="switchLang">
            <div class="lang rus active">Рус</div>
            <div class="lang eng">Eng</div>
        </div>
    </div>

    <?php

    $any_order_id = ($ext_order_id)? $ext_order_id : $order_id ;

    ?>

    <div class="pok_content">

        <div id="engContent" class="switchableContent ">
<!--            -->
            Order №:<span class="order_id"><img width="16" height="16" src="throbber.gif"></span> total amount <?php echo $amount;?> rub. paid successfully.<br />
          <!--  Event: ********* <br />
            Selected places: ******** <br />-->
            <br />
            To enter the event print an e-ticket and present it for a bar code scan. <br />
            <br />
            <span class="smallGrey">More information available on  8 (495) 636-27-53</span>
        </div>

        <div id="rusContent" class="switchableContent active">
<!--            -->
            Заказ №:<span class="order_id"><img width="16" height="16" src="throbber.gif"></span> на сумму <?php echo $amount;?> руб. оплачен успешно.<br />
           <!-- Мероприятие: *********<br />
            Выбранные места: ********<br />-->
            <br />
            Для прохода в зал распечатайте электронный билет и предъявите его для считывания штрих-кода контроллеру.<br />
            <br />
            <span class="smallGrey">Все справки по телефону: 8 (495) 636-27-53</span>
        </div>


    </div>
    <div class="pok_footer">
        <div id="confirmBtn" class="pokBtn" onclick="document.location.href = back;"><span id="rusBtn" class="switchableContent active">Ок</span><span id="engBtn" class="switchableContent ">Ok</span></div>
    </div>

</div>
</body>
<script type="text/javascript">
    $(document).ready(function(){

        var loadOrderInfoCount = 0;
        var realOrderId;
        var host = location.origin+'/';
        var orderId = $("#mOrderId").val();
        var amount = $("#amount").val();
        var frame = $("#mFrame").val();
        var payment_id = $("#payment_id").val();

        function finish() {
            var $orderId = $(".order_id");
            if (!realOrderId) {
                console.log('Не удалось получить реальный номер заказа.');
                $orderId.html(' ' + orderId+', ');
            }else if(realOrderId == -1){
                $('.pok_content .switchableContent.active').html('<div class="red"><b>Внимание!</b><br />Произошел сбой оформления заказа, списанные средства будут возвращены.<br /><br /><span class="smallGrey">Все справки по телефону: 8 (495) 636-27-53</span></div>');
            }else{
                $orderId.html(realOrderId);
            }
            $orderId.css("font-weight","bold");
        }

        var loadOrderInfo = function (timeout) {
            loadOrderInfoCount++;
            setTimeout(function(){
                if (loadOrderInfoCount>50){
                    return finish();
                }
                var query = '<query><command>get_external_order_id</command><order_id>'+orderId+'</order_id><cf3>'+frame+'</cf3><payment_id>'+payment_id+'</payment_id></query>';
                $.ajax({
                    url: host + 'cgi-bin/b2e?request=' + query,
                    method: 'GET',
                    error: function (res) {
                        console.log('Ошибка выполнения запроса', host + '/cgi-bin/b2e?request=' + query);
                        loadOrderInfo(500);
                    },
                    success: function (res) {
                        try {
                            var result = JSON.parse(res);
                        } catch (e) {
                            console.log('Не валидный JSON', res);
                        }
                        if (+result.results[0].code !== 0) {
                            return loadOrderInfo();
                        }
                        realOrderId = result.results[0].ORDER_ID;
                        finish();
                        console.log('success');
                    }
                })
            },timeout || 300);

        };
        var initSwitchLang = function(){
            var switchers = document.getElementsByClassName('lang');
            for(var i in switchers){

                //console.log(switchers[i], switchers[i].addEventListener('click'));

                switchers[i].onclick =  function(){
                    if(this.className.indexOf('active') == -1){
                        var activeSwitch = document.getElementsByClassName('lang active');
                        activeSwitch[0].className = activeSwitch[0].className.replace(' active', '');
                        this.className += ' active';

                        if(activeSwitch[0].className.indexOf('eng') != -1){
                            document.getElementById('rusContent').className = document.getElementById('rusContent').className.replace(' active','');
                            document.getElementById('engContent').className += ' active';
                        }else{
                            document.getElementById('engContent').className = document.getElementById('engContent').className.replace(' active','');
                            document.getElementById('rusContent').className += ' active';
                        }
                        if(activeSwitch[0].className.indexOf('eng') != -1){
                            document.getElementById('rusBtn').className = document.getElementById('rusBtn').className.replace(' active','');
                            document.getElementById('engBtn').className += ' active';
                        }else{
                            document.getElementById('engBtn').className = document.getElementById('engBtn').className.replace(' active','');
                            document.getElementById('rusBtn').className += ' active';
                        }
                    }
                }
            }
        };
        loadOrderInfo();
        initSwitchLang();
    });

</script>
</html>
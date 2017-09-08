

    <!--<script type="text/javascript" src="js/jq.js"></script>-->
    <!--<script type="text/javascript" src="assets/js/load_images/js/ajaxupload.js"></script>-->

<div id="uploadButton0" class="button uploadButton" style="cursor: pointer;">
    <h4  style="display: block;float: left; cursor: pointer;"><? echo $_POST['label']; ?></h4>
    <img style="display: block;float: left; cursor: pointer; margin-left: 10px;" id="load" src="assets/js/load_images/img/empty_load.png" alt=""/> <br>
</div>


    <script type="text/javascript">
        $(document).ready(function() {
            if(typeof is_ajaxupload != "function"){
                $.getScript("assets/js/load_images/js/ajaxupload.js",function(){


                    var number = $(".uploadButton").not("#uploadButton0").length;
                    number++;

                    $("#uploadButton0 img").attr("id","load"+number);
                    $("#uploadButton0").attr("id","uploadButton"+number);
                    var button = $('#uploadButton'+number), interval;

                    $.ajax_upload(button, {
                        action : 'assets/js/load_images/upload.php?path=<? echo $_POST['path']; ?>',
                        name : 'myfile',
                        onSubmit : function(file, ext) {
                            // показываем картинку загрузки файла
                            $("img#load"+number).attr("src", "assets/js/load_images/img/loading_img.gif");
                            $("#uploadButton"+number+" h4").text('Загрузка');

                            /*
                            * Выключаем кнопку на время загрузки файла
                            */
                            this.disable();

                        },
                        onComplete : function(file, response) {
                            // убираем картинку загрузки файла
                            $("img#load"+number).attr("src", "assets/js/load_images/img/empty_load.png");
                            $("#uploadButton"+number+" h4").text('<? echo $_POST['label']; ?>');

                            // снова включаем кнопку
                            this.enable();

                            var func = <? echo $_POST['func']; ?>;
                            func(response<? if (isset($_POST['func_param'])){ echo ",'".$_POST['func_param']."'";} ?>);
                            /*// показываем что файл загружен
                            var type =
                            if (type == "img")
                                $("<img src='<? echo $_POST['type']; ?>/" + file + "' alt=''/>").appendTo("#files");
                            else
                                $("<li>" + file + "</li>").appendTo("#files");*/

                        }
                    });
                });
            }else{
                var number = $(".uploadButton").not("#uploadButton0").length;
                number++;
                $("#uploadButton0 img").attr("id","load"+number);
                $("#uploadButton0").attr("id","uploadButton"+number);
                var button = $('#uploadButton'+number), interval;

                $.ajax_upload(button, {
                    action : 'assets/js/load_images/upload.php?path=<? echo $_POST['path']; ?>',
                    name : 'myfile',
                    onSubmit : function(file, ext) {
                        $("#uploadButton"+number+" h4").text('Загрузка');
                        // показываем картинку загрузки файла
                        $("img#load"+number).attr("src", "assets/js/load_images/img/loading_img.gif");

                        /*
                        * Выключаем кнопку на время загрузки файла
                        */
                        this.disable();

                    },
                    onComplete : function(file, response) {
                        // убираем картинку загрузки файла
                        $("img#load"+number).attr("src", "assets/js/load_images/img/empty_load.png");
                        $("#uploadButton"+number+" h4").text('<? echo $_POST['label']; ?>');

                        // снова включаем кнопку
                        this.enable();

                        var func = <? echo $_POST['func']; ?>;
                        func(response<? if (isset($_POST['func_param'])){ echo ",'".$_POST['func_param']."'";} ?>);
                        /*// показываем что файл загружен
                   var type =
                   if (type == "img")
                       $("<img src='<? echo $_POST['type']; ?>/" + file + "' alt=''/>").appendTo("#files");
                            else
                                $("<li>" + file + "</li>").appendTo("#files");*/

                    }
                });
            }
        });
    </script>
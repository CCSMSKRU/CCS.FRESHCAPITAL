//var il = new ImageLoader();

var startDelivery = function(){
    return console.log('ОТКЛЮЧЕНО');
    //alert('Последовательно выберите файл с шаблоном и файл с адресами.');
    DOQuery({
        command: 'DELIVERY',
        params:{
            subject:'Отмена мероприятия "Вечер песен Джо Дассена" 4 июня 2015 г.',
            template: '../public_html/upload/cancel_action_template.html',
            emails: '../public_html/upload/emails_for_cancel_action.csv'
        }
    }, function (r) {
        console.log(r);
    });
    //debugger;
    /*il.start({
        success:function(fileUID){
            *//*il.start({
                success:function(fileUID2){
                    DOQuery({
                        command: 'DELIVERY',
                        template: '../public_html/upload/'+fileUID.name,
                        emails: '../public_html/upload/'+fileUID2.name

                    }, function (r) {
                        if (r.err) console.log(r.err);
                        toastr[r.type](r.message);
                    });
                }
            });*//*
        }
    });*/
};
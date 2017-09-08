var ImageLoader = function(params){
    console.log('new ImageLoader');
    if (!socket)  throw 'ImageLoader -> socket не определен.';
    if (typeof Delivery!=='function') throw 'ImageLoader -> Не подключен можуль Delivery';
    if (typeof params!=='object') params = {};
    var _t = this;
    delivery.on('delivery.connect', function (delivery0) {
        console.log('=================================delivery.connect');

        delivery0.on('receive.start',function(fileUID){
            console.log('receiving a file!');
        });

        delivery0.on('receive.success',function(file){
            if (file.isImage()) {
                $('img').attr('src', file.dataURL());
            }
        });

        delivery0.on('receive.success',function(file){
            console.log('------> receive.success');
            var params = file.params;
            var html = '<a href='+ file.dataURL() +'>ТЕСТ ССЫЛКИ</a>';
            $('body').prepend(html);
            /* if (file.isImage()) {
             $('img').attr('src', file.dataURL());
             }*/
        });
        delivery0.on('file.load',function(filePackage){
            console.log(filePackage.name + " has just been loaded.");
        });
        _t.loaded = true;
    });


    this.filelist = [];
    this.counter = 0;
    this.attemptsSendCount = 1;
    this.container = $("body");
    this.sendMethod = params.sendMethod || 'send';

    this.dir = params.dir || "upload/";
    this.name = params.name || "ForUploadFile";
    var counter = 0;
    while(this.container.find("#input"+this.name+counter).length!==0){
        counter++;
    }
    this.container.children("input[type=file]").remove();
    this.container.children("input[type=submit]").remove();

    this.container.append('<input type="file" style="display: none;" multiple="true"  id="input'+this.name+counter+'">');
    this.container.append('<input type="submit" style="display: none;" id="submit'+this.name+counter+'">');
    this.input = this.container.find("#input"+this.name+counter);
    this.submit = this.container.find("#submit"+this.name+counter);
    if (typeof params.success==="function") this.success = params.success;
    if (typeof params.error==="function") this.success = params.error;
    var self = this;
    this.submit.on("click",function(evt){
        _t.attemptsSendCount = 1;
        // TODO после массового выделения файлов не срабатывает событие
        for (var i in self.input[0].files) {
            if (isNaN(+i)){
                continue;
            }
            self.filelist.push(self.input[0].files[i]);
        }
        self.send();

        /*var file = self.filelist[0];
        delete self.filelist[0];
        self.delivery.send(file);
        self.counter++;*/
        evt.preventDefault();
    });
    this.uid = '';

    delivery.on('send.success',function(fileUID){
        if (self.id===fileUID.uid){
            return;
        }
        self.uid = fileUID.uid;
        self.success(fileUID);
        self.send();
       /* if (!!self.filelist[self.counter]){
            self.send();
        }else{
            //self.counter = 0;
        }*/
        //console.log(fileUID);

    });

    delivery.on('send.error',function(error){
            self.error(error);
    });




    this.input.on("change",function(){
//        console.log($(self.input).val());
        if($(self.input).val().length == 0){
            return;
        }
        self.submit.click();
    });
};

ImageLoader.prototype = {
    send:function(){
        var _t = this;
        if (!this.filelist.length){
            return;
        }
        if (!_t.loaded){
            if (_t.attemptsSendCount>50) return console.log('Сокет не подключени. Отправка невозможна.');
            return window.setTimeout(function () {
                _t.attemptsSendCount++;
                _t.send();
            }, 100);
        }
        var file = this.filelist.shift();
        file.name = decodeURI(file.name);
        var extraParams = this.extraParams || {};
        delivery.send(file, extraParams);
        //delivery.send(file, {param1:'sdsd'});
        this.counter++;
    },
    success:function(fileUID){
        this.extraParams = {};
        console.log(fileUID);

    },
    error:function(error){
        this.extraParams = {};
        console.log("Загрузка файла не удалась:");
        console.log(error);

    },
    start:function(params){
        if (!this.loaded) return;
        if (typeof params==="object"){
            if (typeof params.success==="function") this.success = params.success;
            if (typeof params.error==="function") this.success = params.error;
            if (typeof params.dir==="function") this.dir = params.dir;
            this.extraParams = params.params;
        }
        $(this.input).val('');
        $(this.input).trigger('change');
        this.input.click();
//        $(this.input).trigger('change');
    },
    remove: function() {

    }

};




/**
 * Created by iig on 17.09.2015.
 */
var Protocol = function () {
    // Блок проверки
    if (typeof funcs !== 'object') return console.log('Для конструктора Protocol не хватает functions.js (makeQuery)');
    if (typeof validator !== 'object') return console.log('Для конструктора Protocol не хватает validator');
    if (typeof formator !== 'object') return console.log('Для конструктора Protocol не хватает formating.js');
    // КОНЕЦ Блок проверки
    var self = this;
    this.sid = '';
    this.setSid = function(sid){
        if (!sid) return console.log('В setSid не передан sid');
        self.sid = sid;
        $('#sid').val(sid);
        $('#span_for_sid').text(sid);
    };
    this.xml = '';
    this.responseInXML = false;
    this.response = '';
    this.method = null;
    this.requestContainer = $('.requestContainer');
    this.responseContainer = $('.responseContainer');
    this.query = function (obj, callback) {
        if (typeof callback !== "function") callback = function () {
        };
        if (typeof obj !== "object") {
            console.log('Не переданы необходимые параметры', obj);
            return callback({code: -1, type: 'error', message: 'Не переданы необходимые параметры'});
        }
        var request = obj.xml;
        var s_json = JSON.stringify(obj.o);
        $("#request_url").attr('href', host + url).text(host + url);
        $.ajax({
            //url: "https://" + connectPath + '/cgi-bin/b2ejsonp?request=' + makeQuery(obj),
            url: host + url,
            method: 'POST',
            //dataType: (self.responseInXML)? 'text' : 'jsonp',
            dataType: 'json',
            data:{
                site:'altynfin.com',
                json:s_json
            },
            error: function (err) {
                console.log('Сервер временно недоступен.', err);
                return callback({code: -1, type: 'error', message: 'Сервер временно недоступен.', err:err});
            },
            success: function (res) {
                return callback(null, res);
                //callback(JSON.stringify(result));
            }
        });
    };
    this.getSelector = function (methodName, paramName) {
        if (arguments.length < 2) {
            console.log('В getSelector передано не достаточно аргументов');
            return '';
        }
        return $('.request_param.' + methodName + '.' + paramName);
    };
    this.getValue = function (selector,method) {
        if (!selector) {
            console.log('В getValue не передан селектор или он не является объектом');
            return '';
        }
        method = method || 'val';
        return value = selector[method]();
    };
    this.highlightXML = function (xml, light) {
        var myRe = /&lt\/?\w+&gt/gi;
        var str = xml.replace(/</ig, '&lt').replace(/>/ig, '&gt');
        str = str.replace(/\n/ig, '<br>');
        var myArray;
        var xmlView = str;
        while ((myArray = myRe.exec(str)) != null) {
            var s = myArray[0];
            if (light) xmlView = xmlView.replace(s, '<span style="color:black; font-weight: bold;">' + s + '</span>');
        }
        return xmlView;
    };
    this.highlightJSON = function (json) {
        var myRe = /(({|,)\"\w+\":|}|\[|\])/gi;
        //var myRe = /:\"(\w|\d|\s)+\"/gi;
        var str = json;
        var myArray;
        var jsonView = str;
        while ((myArray = myRe.exec(str)) != null) {
            var s = myArray[0];
            jsonView = jsonView.replace(s, '<span style="color:black; font-weight: bold;">' + s + '</span>');
        }
        return jsonView;
    };
    this.makeQuery = function (method) {
        var validationErrors = {};
        method = method || self.method;
        self.method = method;
        if (!method) {
            return console.log('Метод не определен.');
        }
        self.oldXml = self.xml;
        self.responseInXML = $('#responseInXML').prop('checked');
        // Проведем валидацию параметров, в том числе и на require
        var params = method.o.params || {};
        for (var k1 in params) {
            var param = params[k1];
            var selector = self.getSelector(method.name, k1);
            var valueMethod = param.valueMethod || 'val';
            var value = self.getValue(selector, valueMethod);
            if (typeof value === 'undefined' || value == '') continue;
            var oldValue = value;
            var errors = validationErrors[k1] = [];
            // Проверим тип поля валидации
            var validation = param.validation || [];

            if (typeof validation != 'object' || !funcs.checkArray(validation)) validation = [validation];
            if (param.required && validation.indexOf('notNull') == -1) validation.push('notNull');
            var alreadyValidate = [];
            for (var k2 in validation) {
                var item = validation[k2];
                if (typeof item !== 'object') item = {func: item};
                // Применить форматирование
                var format = item.format || [];
                if (typeof format != 'object' || !funcs.checkArray(format)) format = [format];
                for (var k3 in format) {
                    var fItem = format[k3];
                    if (typeof fItem!='object') fItem = {func:fItem,args:[]};
                    var formatFunc = fItem.func;
                    var args = (typeof fItem.args=='object')?fItem.args : (typeof fItem.args!=='undefined')?[fItem.args] : [];
                    if (typeof formator[formatFunc] !== 'function') {
                        console.log('Нету функции форматирования данных:', formatFunc);
                        continue;
                    }
                    value = formator[formatFunc](value,args.join(','));
                }
                // провести валидацию
                var validateFunctions = item.func || [];
                if (typeof validateFunctions !== 'object') validateFunctions = [validateFunctions];
                for (var k4 in validateFunctions) {
                    var func = validateFunctions[k4];
                    if (alreadyValidate.indexOf(func)!==-1) continue;
                    alreadyValidate.push(func);
                    var valid = (typeof validator[func] === 'function') ? validator[func](value) : false;
                    if (!valid) {
                        var info = validator.getValidatorInfo(func);
                        errors.push({value: value, oldValue: oldValue, info: info, selector:selector});
                    }
                }
                param.value = value;
            }
        }
        // Проверим были ли ошибки
        var haveErrors = false;
        for (var i in validationErrors) {
            errors = validationErrors[i];
            if (errors.length > 0 && !haveErrors) {
                haveErrors = true;
                console.log(errors);
            }
        }
        if (haveErrors) {
            return funcs.formatResponse(-1,'error','Некоторые поля заполнены неверно.', validationErrors);
        }

        var p = {};
        for (var i2 in params) {
            if (typeof params[i2].value === 'undefined' || params[i2].value == '') continue;
            p[i2] = params[i2].value;
        }

        var o = {
            sid: self.sid,
            params: p
        };
        var _o = method.o;
        for (var i3 in _o) {
            var item = _o[i3];
            if (i3 == 'params') continue;
            o[i3] = item;
        }
        if (self.responseInXML) o.output_format = 'xml';
        var xml = self.xml = funcs.makeQuery(o);
        //xml = "<query><sid>zGgymfkKytuvYgUubNirAjjPBTExNDJgqCDECejimMDYcSrAHg</sid><command>get</command><object>action</object></query>";
        var xmlView = this.highlightXML(xml);
        //var xmlView = xml.replace(/</ig,'&lt').replace(/>/ig,'&gt').replace(/&lt/ig,'<span style="color:blue;">&lt').replace(/&gt/ig,'&gt</span>');
        //var xmlView = xml.replace(/(?=<)\w(?=>)/,'');
        //console.log(xmlView);
        self.requestContainer.css({color:'blue'}).html(JSON.stringify(o));
        return funcs.formatResponse(0,'success','', {o:o,xml:xml});
    };
    this.doQuery = function(callback){
        if (typeof callback!=='function') {
            console.log('В protocol.doQuery не передана функция callback');
            return false;
        }
        self.responseContainer.css({backgroundColor:'#f9f9f9'});
        var compilation = self.makeQuery();
        var data = compilation.data;
        if (compilation.code){
            toastr[compilation.toastr.type](compilation.toastr.message);
            console.log('Результаты работы makeQuery', compilation.data);
            for (var i in data) {
                var errors = data[i];
                for (var i2 in errors) {
                    var oneError = errors[i2];
                    oneError.selector.data('oldBorderColor',oneError.selector.css('borderColor'));
                    oneError.selector.css({borderColor:'#F00'});
                    var x = +oneError.selector.offset().left + +oneError.selector.width() + 30;
                    var y = +oneError.selector.offset().top - 18;
                    var h  = new Hint();
                    h.show({
                        x: x,
                        y: y,
                        text: oneError.info.text || '',
                        template: 'warning'
                    }, 3000, 300, true);
                }
            }
            return callback(funcs.formatResponse(-1,'error','Произошла ошибка при формировании XML запроса. Поля не прошли валидацию'));
        }
        // Если xml сформирован, выполним запрос
        if (loader) loader.start();
        self.query(data, function (err, res) {
            self.responseContainer.css({backgroundColor:'white'});
            if (loader) loader.stop();
            if (err){
                callback(err);
                return toastr[err.type](err.message);

            }

            if (self.responseInXML){

                var xmlView = self.highlightXML(res, (res.length<3000));
                self.responseContainer.css({color:'blue'}).html(xmlView);
            }else{
                var jsonView = self.highlightJSON(JSON.stringify(res));
                self.responseContainer.css({color:'blue'}).html(jsonView);
            }
            callback(null,res);

        });

    }
    /*this.renderMethods = function () {

    }*/
};
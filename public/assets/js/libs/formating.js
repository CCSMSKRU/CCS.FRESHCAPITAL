/**
 * Created by iig on 17.09.2015.
 */
/**
 * Created by iig on 17.09.2015.
 */
var Format = function(params){
    var self = this;
    if (typeof params!=='object') params = {};
    this.defaultLanguage = params.defaultLanguage || 'ru';
    this.info = {
        getDateTime:{
            ru:{
                name:'В формат даты со временем',
                text:'Не удалось перевести в формат дата со временем.'
            }
        }
    };
    this.texts = {
        ru:{
            text1:'Нет информации по данному типу форматирования.',
            text2:'Нет информации для данного языка: '
        }
    };
    this.getFormatInfo = function(name,language){
        language = language || Validator.defaultLanguage;
        var item = info[name];
        var text1 = self.texts[language].text1 || 'No info.';
        var text2 = self.texts[language].text2 || 'No info for language: ';
        if (!item) return {name:name,text:text1};
        if (!item[language])return {name:name,text:text2 + language};
    };
};
Format.prototype.getDateTime =  function (d,format) {
    format = format || 'YYYY-MM-DD HH:mm:ss';
    if (d){
        if (moment(d,'DD.MM.YYYY').isValid()){
            return moment(d,'DD.MM.YYYY').format(format);
        }else{
            return d;
        }
    }
    return moment().format(format);
};
Format.prototype.getDate =  function (d,format) {
    format = format || 'YYYY-MM-DD';
    if (d){
        if (moment(d,'DD.MM.YYYY').isValid()){
            return moment(d,'DD.MM.YYYY').format(format);
        }else{
            return d;
        }
    }
    return moment().format(format);
};
Format.prototype.age = function(val,format){
    f = format || "YYYY-MM-DD";
    if (!moment(val, f).isValid()){
        return val;
    }
    var a = moment(val,f);
    var b = moment();
    return b.diff(a,'years');
};
Format.prototype.userFriendlyDate = function(val){
    if (!moment(val).isValid()){
        return val;
    }
    var a = moment(val).format('DD.MM.YYYY');
    return a;
};
Format.prototype.addToEnd = function(val,back){
    back = back || '';
    return val+String(back);
};
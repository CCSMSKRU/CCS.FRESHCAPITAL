/**
 * Created by iig on 18.09.2015.
 */
/* Пример использования
var h  = new Hint();
h.show({
    x: 400,
    y: 500,
    text: '<b>Внимание!</b> Необходимо заполнить это поле!<br>Поле должно содержать только буквы и цифры!',
    template: 'warning'
}, 5000, 1000, function () {
    console.log('Уничтожено');
});*/
var Hint = function (params) {
    if (typeof params!=='object') params = {};
    if (typeof funcs!='object') return console.log('Для работы Hint необходим файл funcs.js ( funcs.guid(); )');
    var self = this;
    var guid = this.guid = funcs.guid();
    this.defaultTemplate = params.template || 'success';
    this.showDuration = params.showDuration || 300;
    this.hideDuration = params.hideDuration || 300;
    $('body').append('<div class="my_hint" id="my_hint_'+ guid +'" ' +
    'style="display: none; position:absolute;top:0;left:0;"' +
    '><div class="alert alert-success" role="alert"></div></div>');
    this.elem = $('#my_hint_'+guid);
    this.templates = {
        success:'<div class="alert alert-success" role="alert"></div>',
        info:'<div class="alert alert-info" role="alert"></div>',
        warning:'<div class="alert alert-warning" role="alert"></div>',
        danger:'<div class="alert alert-danger" role="alert"></div>'
    }
};
/**
 * Параметры obj:
 * x,y,text,template,duration
 * @param obj
 * @param hideTimeout
 * @param hideDuration
 * @param destroy  /// может быть функцией callback или просто true
 */
Hint.prototype.show = function(obj, hideTimeout, hideDuration, destroy){
    var self = this;
    if (typeof obj!='object') obj = {};
    var x = this.x = obj.x || this.x || 0;
    var y = this.y = obj.y || this.y || 0;
    var text = this.text = obj.text || '';
    var templateName = this.template = obj.template || this.defaultTemplate;
    var template = this.templates[templateName];
    var showDuration = obj.duration || this.showDuration;
    this.elem.html(template);
    this.elem.find('div.alert').html(text);
    this.elem.css({top:y+"px",left:x+"px"}).stop().fadeIn(showDuration);
    if (!hideTimeout || typeof hideTimeout!=='number') return;
    hideDuration = hideDuration || this.hideDuration;
    this.elem.delay(hideTimeout).fadeOut(hideDuration, function(){
        if (destroy){
            self.destroy();
            if (typeof destroy==='function') destroy();
        }
    });
};
/**
 *
 * @param hideDuration
 * @param stop
 * @param destroy /// может быть функцией callback или просто true
 */
Hint.prototype.hide = function(hideDuration,stop,destroy){
    var self = this;
    hideDuration = hideDuration || this.hideDuration;
    if (stop){
        this.elem.stop().fadeOut(hideDuration, function(){
            if (destroy) self.destroy();
            if (typeof destroy==='function') destroy();
        });
    }
    else
        this.elem.fadeOut(hideDuration);

};
Hint.prototype.destroy = function(){
    this.elem.stop();
    this.elem.remove();
};
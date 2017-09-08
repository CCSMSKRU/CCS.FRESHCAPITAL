/*
MBOOKER.Classes.Content = function (area, obj) {

}
*/
MB.Content = function(obj) { // {objectname: options.objectname, world: "page"}
    if(obj.objectname != undefined){
        this.objectname = obj.objectname;
        this.fileName = this.objectname.substr(this.objectname.indexOf("_")+1);
        log(this.objectname)
        log(this.fileName)
    } else {log("Не передаете objectname!")}
    if(obj.world != undefined){
        this.world = obj.world;
        log(this.world)
    }else {log("Не передаете world!")}
    if(obj.pageswrap != undefined){
        this.pageswrap = obj.pageswrap;
        log(this.pageswrap)
    }else {log("Не передаете pageswrap!")}
}

MB.Content.prototype.init = function(){
    var _this = this;
    _this.render();
}

MB.Content.prototype.render = function(){
    var _this = this;
    _this.pageswrap.append('<div id="page_'+_this.objectname+'_wrapper" class="page-content"></div>');
    var DivContent = $("#page_"+_this.objectname+"_wrapper");
    DivContent.load("html/contents/"+_this.fileName+"/"+_this.fileName+".html");
}


MB.Content.fn = MB.Content.prototype;
MB.Content.fn.parent = MB.Content.prototype.constructor;

MB.Content.fn.showit = function(){
    var _this = this;
    var query = "#" + _this.world + "_" + MB.User.activepage + "_wrapper";
    $(query).hide();
    var query = "#" + _this.world + "_" + _this.objectname + "_wrapper";
    $(query).show();
}

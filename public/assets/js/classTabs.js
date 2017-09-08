var TabsClass = function(obj){
    var _this = this;
    if(obj.instance!=undefined){
        this.instance = obj.instance
    }
    
    this.params = obj;
    if(obj!=undefined){
        if(obj.type!=undefined){_this.type = obj.type;}else {_this.type = "";}
    }
    else {_this.type = "";}

    _this.activeForm    = MB.Modal.activemodal;
    _this.form          = MB.O.forms[_this.activeForm];
    _this.parentForm    = $("#modal_"+_this.activeForm+"_wrapper");
    _this.parentButtons = _this.parentForm.find(".actions");
    _this.tabContent    = _this.parentForm.find(".tab-content");
    _this.init();

}

TabsClass.prototype.init = function(){
    var _this = this;
    _this.modalTabs = _this.parentForm.find("ul.nav-tabs");
    _this.modalTabs.show();
    _this.tabContent.show();
    _this.modalTabs.find("li").show();
    var tabs = _this.modalTabs;
    if(tabs.html()!=""){
        _this.handlerAction();
    }
}

TabsClass.prototype.updateState = function(state){
    var _this = this;
    console.log(state);
    switch (state){
        case "init":
            _this.statusTabs("active");
        break;
        case "edit":
            _this.statusTabs("active");
        break;
        case "addinit":
            _this.statusTabs("dis");
        break;
        case "add":
            _this.statusTabs("dis");
        break;

    }
}

TabsClass.prototype.handlerAction = function(){
    var _this = this;
    this.parentButtons.find(".form-create-button").click(function(){
        _this.statusTabs("dis");
    })
    $(this.modalTabs.find("li")[0]).click(function(){
        _this.instance.reload("data");
    })
}

TabsClass.prototype.statusTabs = function(state){
    var _this = this;
    switch (state){
        case "active":
            _this.modalTabs.find("li").show();
        break;
        case "dis":
            _this.modalTabs.find("li").hide();
            $(_this.modalTabs.find("li")[0]).show();
        break;
        case "disAll":
            _this.modalTabs.hide();
            _this.tabContent.hide();
        break;
    }

}

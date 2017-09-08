var userInfoClass = function(obj){
    if(obj.selector){
        this.HeaderPanel        = $("#"+obj.selector);
        this.UserInfoUl         = this.HeaderPanel.find("ul.userInfo");
        this.userFullName       = $.cookie('userfullname');
    }
    if(obj.selectorFooter){
        this.userInfoFooter     = $(selectorFooter);
    }
    else {
        this.userInfoFooter     = $(".footerUserInfo");
    }
    if(obj.JSONstring){
        this.JSONstring         = obj.JSONstring;
    }
}

userInfoClass.prototype.init = function(){
    var _this = this;
    _this.userInfo_Render();
    _this.userInfo_HandleAction();
}

userInfoClass.prototype.userInfo_Render = function(){
    /*
    var _this = this;
    _this.UserInfoUl.find("span.username").html(_this.userFullName);

    MB.Core.sendQuery({command:"get",object:"ticket_pack_user_info",sid:MB.User.sid},function(result){
        var html = ''+
        '<a class="">'+
            result['DATA'][0]+
        '</a>';
        $(_this.userInfoFooter).find(".scaPanel").html(html);
    });    */
}
userInfoClass.prototype.userInfo_Refresh = function(){
  /*  var _this = this;
    log(_this.JSONstring)
    if(_this.JSONstring){
        var html = ''+
        '<a class="">'+
            _this.JSONstring+
        '</a>';
        $(_this.userInfoFooter).find(".scaPanel").html(html);
    }*/
}
userInfoClass.prototype.userInfo_HandleAction = function(){
    var _this = this;
    _this.userInfoFooter.find(".scaPanel").click(function(){
          console.log('PRINT_ORDER');
        var o = {
            command:"PRINT_ORDER"
        };
        printQuery(o);
         //send('change_pack',{sid:MB.User.sid});
    })
    /*  var _this = this;
     _this.userInfoFooter.find(".scaPanel").click(function(){
     var wraperName = "printer_with_ticket_pack-content-wrapper";
     // TABLE
     ModalContent({
     selector: "#portlet-config",
     title: "",
     content: '<div class="'+wraperName+'"></div>',
     buttonY: "",
     buttonN: "Закрыть"
     });
     var table = new MB.Table({
     world: "printer_with_ticket_pack",
     name: "table_printer_with_ticket_pack"
     });
     table.create(function () {

     });
     // END
     //$(".save_button")

     $("#portlet-config").find(".modal-dialog").css("width","80%")
     $("#portlet-config").find(".modal-header").hide();
     $("#portlet-config").find(".OkModal").hide();
     })*/
}


$(document).ready(function(){
    var userInfo = new userInfoClass({selector:"header"}).init();
})



function ModalContent(obj){
    var ModalDiv = $(obj.selector);
    var ModalHeader =   ModalDiv.find(".modal-header");
    var ModalBody =     ModalDiv.find(".modal-body");
    var ModalOk =       ModalDiv.find(".OkModal");
    var ModalCancel =   ModalDiv.find(".close_modal");
    ModalHeader.html(obj.title);
    ModalBody.html(obj.content);
    ModalOk.html(obj.buttonY);
    ModalCancel.html(obj.buttonN);
    ModalDiv.modal("show");
}
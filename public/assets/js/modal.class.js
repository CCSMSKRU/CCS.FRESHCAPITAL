if(MBOOKER.Modals==undefined){MBOOKER.Modals = {};}
MBOOKER.Modals.Lib ={};
MBOOKER.Modals.Lib ={
    ruName: {
        ticket:"Билеты",
        hall:"Залы",
        active_action: "Мероприятия"
    },
    iIcon: {
        ticket:"fa-ticket",
        hall:"fa-ticket",
        active_action: "Мероприятия"
    },
    Buttons: {
        load:{
            title:"Заполнить",
            icon:"fa-exchange",
            StyleClass:"",
            actionClass:"load_content_modal"
        },
        search:{
            title:"Поиск",
            icon:"fa-search",
            actionClass:"search_content_modal"
        },
        refresh:{
            title:"Обновить",
            icon:"fa-refresh",
            StyleClass:"",
            actionClass:"refresh_content_modal"
        },
        add:{
            title:"Добавить",
            icon:"fa-plus",
            StyleClass:"",
            actionClass:"add_content_modal"
        },
        copy:{
            title:"Копировать",
            icon:"fa-files-o",
            StyleClass:"",
            actionClass:"copy_content_modal"
        },
        del:{
            title:"Удалить",
            icon:"fa-trash-o",
            StyleClass:"btn-danger",
            actionClass:"del_content_modal"
        },
        clear:{
            title:"Очистить",
            icon:"fa-eraser",
            StyleClass:"",
            actionClass:"clear_content_modal"
        },
        save:{
            title:"Сохранить",
            icon:"fa-save",
            StyleClass:"btn-success",
            actionClass:"save_content_modal"
        },
        options:{
            title:"Настройки",
            icon:"fa-cogs",
            StyleClass:"",
            actionClass:""
        },
        close:{
            title:"Закрыть",
            icon:"fa-times-circle",
            StyleClass:"btn-info",
            actionClass:"close_content_modal"
        }
    }
};

 function mobilecheck() {
    var check = false;
    (function(a){if(/(android|ipad|playbook|silk|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
}

var ModalWin_tpl = function () {
    var _this = this;
    var MadalPath = 'html/modals/';
    
    var eventtype = mobilecheck() ? 'touchstart' : 'click';
    this.init = function(){
        var html = ''+
        '<div id="ModalWin">'+
            '<div id="modal_win" class="modal_win">'+
                '<a href="#" class="modal_win-trigger"><span>Close</span></a>'+
                '<ul class="modal_win-top"></ul>'+
                '<ul class="modal_win-bottom"></ul>'+
                '<div class="modal_win_content"></div>'+
            '</div>'+
        '</div>';
        $("body").append(html);
        _this.ModalDiv = document.getElementById( 'modal_win' );
        _this.ModalObj = $( '#ModalWin' );
        var trigger = $( 'a.modal_win-trigger' );
        trigger.click(function(){_this.trigger();});
        var modal_obj = $(".modal_win_content");
        _this.ModalContent = modal_obj;
        var modal_topmenu = $(".modal_win-bottom");
        _this.ModalTopMenu = modal_topmenu;
    }
    this.init();
    start_classie();
    var ModalContent = _this.ModalContent;
    var ModalTopMenu = _this.ModalTopMenu;
    var ModalDiv = _this.ModalDiv;
    var ModalObj = _this.ModalObj;    
    this.resetModal = function(){
        _this.ModalContent.html("");
        _this.ModalTopMenu.html("");
    }
    this.openModal = function() {
        ModalObj.show("fast");
        classie.remove( ModalDiv, 'modal_win-close' );
        classie.add( ModalDiv, 'modal_win-open' );
    },
    this.closeModal = function() {
        if(_this.Callback != undefined) {_this.Callback();}
        this.resetModal();
        ModalObj.hide("fast");
        classie.remove( ModalDiv, 'modal_win-open' );
        classie.add( ModalDiv, 'modal_win-close' );
    }
    this.trigger = function(){
        if( classie.has( ModalDiv, 'modal_win-open' ) ) {
            _this.closeModal();
        }
        else {
            _this.openModal();
        }
    };
    this.ModalSettings = function(obj){
        // Проверки объекта
        if(obj['subcommand'] != undefined){
            MBOOKER.Modals.activeModal = obj['subcommand'];
            MBOOKER.Modals[obj['subcommand']] = {};
            MBOOKER.Modals[obj['subcommand']]['orderBy'] = MBOOKER.Settings.tablesSettings[obj['subcommand']]['sortBy'];
        }
        else {alert("Вы не передаете subcommand");}
        if(obj['ids'] != undefined){
            MBOOKER.Modals[obj['subcommand']]['ids'] = obj['ids'];
            
        }
        // ---------------------------------------
    };
    this.SendQuery = function(id){
        var activeModal = MBOOKER.Modals.activeModal;
        var orderBy = MBOOKER.Modals[activeModal]['orderBy'];
        MBOOKER.MainFunctions.sendQuery({command:"get",subcommand:activeModal,sid:MBOOKER.UserData.sid,params:{where:orderBy+" = "+id}},function(data){
            switchLoad("complite");
            var obj = MBOOKER.MainFunctions.jsonToObj(data)[0];
            for (var key in obj){
                $("#"+MBOOKER.Modals.activeModal+"_"+key+"_inp").val(obj[key]);
            }
        });
    };
    
    this.CreateContent = function () {
        var subcommand = MBOOKER.Modals.activeModal;
        var modal_obj = subcommand;
        var ids = MBOOKER.Modals[subcommand]['ids'];
       
        var tabs = {};
        var exContent = 0;
        $(".modal_tab").each(function(){
            var tab_id = $(this).attr("id").replace("modal_tab_","");
            tabs[tab_id] = $(this);
            if(tab_id == modal_obj){exContent = 1;}
        });
        if(exContent == 0){
            var modal_name = MBOOKER.Modals.Lib.ruName[modal_obj];
            var modal_icon = MBOOKER.Modals.Lib.iIcon[modal_obj];
            // Генерация HTML
            var htmlTopMenu = ''+
            '<li id="modal_tab_'+modal_obj+'" class="modal_tab active">'+
                '<i class="close_tab fa  fa-times"></i>'+
                '<a class="" href="#">'+
                    '<i class="fa '+modal_icon+'"></i>'+
                    modal_name+
                '</a>'+
            '</li>';
            ModalTopMenu.append(htmlTopMenu);
            var htmlContent = ''+
            '<div id="modal_content_'+modal_obj+'" class="modal_content"></div>';
            ModalContent.append(htmlContent);
            // END
            var thisContent = $("#modal_content_"+modal_obj);
            if(modal_icon==""){modal_icon = " fa-bars ";}
            var htmlModalHeader = CreateModalHeaderHtml(modal_icon,modal_name);
            thisContent.html(htmlModalHeader);
            var FormContent = thisContent.find(".form_content");
            // LOAD CONTENT
            FormContent.load(MadalPath+''+modal_obj+"_modal/"+modal_obj+"_modal.html",function(){
                FormContent.append(CreateModalBottomHtml(modal_icon,modal_name));
                var modalHeight = $(".modal_win_content").height();
                $("#"+modal_obj+"_content_modal").css("min-height",modalHeight-350);
                App.init();
                $('#modal_content_'+modal_obj+' button.close_content_modal').click(function(){
                    _this.CloseTab(modal_obj);
                });
                divIdModal(ids,"divIdModal");
                SwitchButtons(modal_obj);
                $(".header_panel button,.bottom_panel button").click(function(){
                    actionsModalButton($(this),modal_obj);
                })
                _this.SendQuery(ids[0]);
            });
            // ------------------
            $('#modal_tab_'+modal_obj).click(function(){
                _this.SwitchContent(modal_obj);
            });
            $('#modal_tab_'+modal_obj+' i.close_tab').click(function(){
                _this.CloseTab(modal_obj);
            });
            function divIdModal(ids,selector){
                var html = '';
                for(i in ids){
                    html+= '<option value="'+ids[i]+'">'+ids[i]+'</option>';
                }
                $("."+selector).html(html);
                $("."+selector).change(function(){
                    var id = $(this).val();
                    modalFunctionStart(id);
                    _this.SendQuery(id);
                })
            }
            function add_tooltip(title){
                var html = ' data-placement="top" data-original-title="'+title+'"';
                return html;
            }
            function CreateModalHeaderHtml(modal_icon,modal_name){
                var html = ''+
                '<div class="portlet box blue header_panel">'+
                    '<div class="portlet-title">'+
                        '<div class="caption">'+
                            '<i class="fa '+modal_icon+'"></i>'+modal_name+
                        '</div>'+
                        '<div class="tools">'+
                            '<div class="portlet-body">';
                            for(key in MBOOKER.Modals.Lib['Buttons']){
                                var obj = MBOOKER.Modals.Lib['Buttons'];
                                html+= ''+
                                '<a>'+
                                    '<button class="tooltips" actions="'+obj[key]['actionClass']+'" '+add_tooltip(obj[key]['title'])+'>'+
                                        '<i class="fa '+obj[key]['icon']+'"></i>'+
                                    '</button>'+
                                '</a>';
                            }
                            html+='</div>'+
                        '</div>'+
                    '</div>'+
                '</div>'+
                '<div id="load_modal"><i class="fa fa-4x fa-refresh fa-spin"></i></div>'+
                '<div class="form_content"></div>';
                return html;
            }
            function CreateModalBottomHtml(modal_icon,modal_name){
                var html = ''+
                '<div class="portlet box bottom_panel" style="display:none;">'+
                    '<div class="portlet-title">'+
                        '<div class="portlet-body">';
                            for(key in MBOOKER.Modals.Lib['Buttons']){
                                if(key!='load' && key!='search' && key!='refresh' && key!="clear" && key!="options"){
                                    var obj = MBOOKER.Modals.Lib['Buttons'];
                                    if(obj[key]['StyleClass'] != undefined && obj[key]['StyleClass'] != ""){
                                        var StyleClass = obj[key]['StyleClass'];
                                    }
                                    else {
                                        var StyleClass = "btn-primary";
                                    }
                                    html+= ''+
                                    '<a>'+
                                        '<button class="btn '+StyleClass+'" actions="'+obj[key]['actionClass']+'">'+
                                            '<i class="fa '+obj[key]['icon']+'"></i>'+
                                            '<span class="panelTitle">'+obj[key]['title']+'</span>'+
                                        '</button>'+
                                    '</a>'; 
                                }
                            }
                        html+='</div>'+
                    '</div>'+
                '</div>';
                return html;
            }
        }
    };
    this.SwitchContent = function(modal_obj){
        $(".modal_tab").each(function(){$(this).removeClass("active");});
        $(".modal_content").each(function(){$(this).hide();});
        console.log($("#modal_tab"+modal_obj));
        $("#modal_tab_"+modal_obj).addClass("active");
        $("#modal_content_"+modal_obj).show();
    };
    this.CloseTab = function(modal_obj){
        ContentConfirm("Закрыть вкладку?","Вы действительно хотите закрыть вкладку?","Да","Нет")
        $("#modal_tab_"+modal_obj).css("border-color","red");
        $('#portlet-config').modal('show');
        $('#portlet-config').find(".OkModal").click(function(){
            $("#modal_tab_"+modal_obj).remove();
            $("#modal_content_"+modal_obj).remove();
            $('#portlet-config').modal('hide');
        })
        $("#modal_tab_"+modal_obj).css("border-color","");
    }
    function ContentConfirm(title,body,yes,no){
        $('#portlet-config').find(".modal-title").html(title);
        $('#portlet-config').find(".modal-body").html(body).css("font-size","18px");
        $('#portlet-config').find(".OkModal").html(yes);
        $('#portlet-config').find(".close_modal").html(no);
    }
};

MBOOKER.Modals.ModalWin = new ModalWin_tpl();
var ModalWin = MBOOKER.Modals.ModalWin;


function actionsModalButton(obj_this,modal_obj){
    var primaryKey = MBOOKER.Modals[modal_obj].orderBy;
    var id = $("#"+modal_obj+"_"+primaryKey+"_inp").val();
    var actions = obj_this.attr("actions").replace("_content_modal","");

    switch(actions){
        case "refresh":
            modalFunctionStart(id);
            ModalWin.SendQuery(id);
        break;
        case "close":
            ModalWin.CloseTab(modal_obj);
        break;
    }
}

function SwitchButtons(modal_obj) {

}



function start_classie(){
    'use strict';

    // class helper functions from bonzo https://github.com/ded/bonzo

    function classReg( className ) {
      return new RegExp("(^|\\s+)" + className + "(\\s+|$)");
    }

    // classList support for class management
    // altho to be fair, the api sucks because it won't accept multiple classes at once
    var hasClass, addClass, removeClass;

    if ( 'classList' in document.documentElement ) {
      hasClass = function( elem, c ) {
        return elem.classList.contains( c );
      };
      addClass = function( elem, c ) {
        elem.classList.add( c );
      };
      removeClass = function( elem, c ) {
        elem.classList.remove( c );
      };
    }
    else {
      hasClass = function( elem, c ) {
        return classReg( c ).test( elem.className );
      };
      addClass = function( elem, c ) {
        if ( !hasClass( elem, c ) ) {
          elem.className = elem.className + ' ' + c;
        }
      };
      removeClass = function( elem, c ) {
        elem.className = elem.className.replace( classReg( c ), ' ' );
      };
    }

    function toggleClass( elem, c ) {
      var fn = hasClass( elem, c ) ? removeClass : addClass;
      fn( elem, c );
    }

    var classie = {
      // full names
      hasClass: hasClass,
      addClass: addClass,
      removeClass: removeClass,
      toggleClass: toggleClass,
      // short names
      has: hasClass,
      add: addClass,
      remove: removeClass,
      toggle: toggleClass
    };

    // transport
    if ( typeof define === 'function' && define.amd ) {
      // AMD
      define( classie );
    } else {
      // browser global
      window.classie = classie;
    }
}


function modal_show(obj,Callback){
    ModalWin.Callback = Callback;
    ModalWin.ModalSettings(obj);
    ModalWin.trigger();
    ModalWin.CreateContent();
}
function modal_createNewModal(modal_obj,ids){
    ModalWin.CreateContent(modal_obj,ids);
    ModalWin.SwitchContent(modal_obj);
}
function modal_closeTab(modal_obj){
    ModalWin.CloseTab(modal_obj);
}


function switchLoad(act){
    var modal_obj = MBOOKER.Modals.modal_obj;
    switch(act){
        case "load":
            $("#load_modal").show();
            $(".form_content").hide();
            $(".bottom_panel").hide();
        break;
        case "complite":
            $("#load_modal").hide();
            $(".form_content").show();
            $(".bottom_panel").show();
        break;
    }
}



// Сделанно для тестов
$(document).ready(function(){
    $("#modal_open").click(function(){
        modal_show({subcommand:"ticket",ids:["1","55","75"]},function(){alert("Callback")});
    })
})


function log(obj){console.log(obj);
}
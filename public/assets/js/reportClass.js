(function() {
  var MB, libModalType, reportClass, reportLib;

  MB = void 0;

  libModalType = void 0;

  reportClass = void 0;

  reportLib = void 0;

  MB = window.MB;

  reportLib = MB.reportLib;

  libModalType = {};

  libModalType = {
    actions: function() {
      var html;
      html = void 0;
      html = "";
      return MB.Core.sendQuery({
        command: "get",
        object: "ACTION_REPORT_LOV",
        sid: MB.User.sid
      }, function(resultAction) {
        var key, objAction, val;
        key = void 0;
        objAction = void 0;
        val = void 0;
        objAction = MB.Core.jsonToObj(resultAction);
        html = "<div class='row reportStyle'><div class='col-md-12'>";
        html += "<label> Мероприятие </label><br>";
        html += "<select name='action_id' class='select2Report'>";
        for (key in objAction) {
          val = objAction[key];
          html += "<option value=\"" + objAction[key]["ACTION_ID"] + "\">" + objAction[key]["ACTION_NAME"] + "</option>";
        }
        html += "</select>";
        html += "</div></div>";
        $("#params").append(html);
        $('select.select2Report').select2();
      });
    },
    actions2: function() {
      var html;
      html = void 0;
      html = "";
      return MB.Core.sendQuery({
        command: "get",
        object: "action_report2_lov",
        sid: MB.User.sid
      }, function(resultAction) {
        var key, objAction, val;
        key = void 0;
        objAction = void 0;
        val = void 0;
        objAction = MB.Core.jsonToObj(resultAction);
        html = "<div class='row reportStyle'><div class='col-md-12'>";
        html += "<label> Мероприятие </label><br>";
        html += "<select name='action_id' class='select2Report'>";
        for (key in objAction) {
          val = objAction[key];
          html += "<option value=\"" + objAction[key]["ACTION_ID"] + "\">" + objAction[key]["ACTION_NAME"] + "</option>";
        }
        html += "</select>";
        html += "</div></div>";
        $("#params").append(html);
        $('select.select2Report').select2();
      });
    },
    users: function() {
      return MB.Core.sendQuery({
        command: "get",
        object: "user_active",
        sid: MB.User.sid
      }, function(resultUser) {
        var currentUser, html, key, objUser, val;
        currentUser = void 0;
        html = void 0;
        key = void 0;
        objUser = void 0;
        val = void 0;
        objUser = MB.Core.jsonToObj(resultUser);
        currentUser = resultUser["CURRENT_USER_ID"];
        html = "<div class='row reportStyle'><div class='col-md-12'>";
        html += "<label> Пользователь </label><br>";
        html += "<select name='user_id' class='select2Report'>";
        for (key in objUser) {
          val = objUser[key];
          if (currentUser === objUser[key]["USER_ID"]) {
            html += "<option value=\"" + objUser[key]["USER_ID"] + "\" selected>" + objUser[key]["FULLNAME"] + "</option>";
          } else {
            html += "<option value=\"" + objUser[key]["USER_ID"] + "\">" + objUser[key]["FULLNAME"] + "</option>";
          }
        }
        html += "</select>";
        html += "</div></div>";
        $("#params").append(html);
        $('select.select2Report').select2();
      });
    },
    users2: function() {
      return MB.Core.sendQuery({
        command: "get",
        object: "user_for_reports_lov",
        sid: MB.User.sid
      }, function(resultUser) {
        var currentUser, html, key, objUser, val;
        currentUser = void 0;
        html = void 0;
        key = void 0;
        objUser = void 0;
        val = void 0;
        objUser = MB.Core.jsonToObj(resultUser);
        currentUser = resultUser["CURRENT_USER_ID"];
        html = "<div class='row reportStyle'><div class='col-md-12'>";
        html += "<label> Пользователь </label><br>";
        html += "<select name='user_id' class='select2Report'>";
        for (key in objUser) {
          val = objUser[key];
          if (currentUser === objUser[key]["USER_ID"]) {
            html += "<option value=\"" + objUser[key]["USER_ID"] + "\" selected>" + objUser[key]["FULLNAME"] + "</option>";
          } else {
            html += "<option value=\"" + objUser[key]["USER_ID"] + "\">" + objUser[key]["FULLNAME"] + "</option>";
          }
        }
        html += "</select>";
        html += "</div></div>";
        $("#params").append(html);
        $('select.select2Report').select2();
      });
    },
    cash_desk2: function() {
      return MB.Core.sendQuery({
        command: "get",
        object: "cash_desk_for_reports_lov",
        sid: MB.User.sid
      }, function(resultUser) {
        var currentUser, html, key, objUser, val;
        currentUser = void 0;
        html = void 0;
        key = void 0;
        objUser = void 0;
        val = void 0;
        objUser = MB.Core.jsonToObj(resultUser);
        currentUser = resultUser["CASH_DESK_ID"];
        html = "<div class='row reportStyle'><div class='col-md-12'>";
        html += "<label> Касса </label><br>";
        html += "<select name='cash_desk_id' class='select2Report'>";
        for (key in objUser) {
          val = objUser[key];
          if (currentUser === objUser[key]["CASH_DESK_ID"]) {
            html += "<option value=\"" + objUser[key]["CASH_DESK_ID"] + "\" selected>" + objUser[key]["CASH_DESK_NAME"] + "</option>";
          } else {
            html += "<option value=\"" + objUser[key]["CASH_DESK_ID"] + "\">" + objUser[key]["CASH_DESK_NAME"] + "</option>";
          }
        }
        html += "</select>";
        html += "</div></div>";
        $("#params").append(html);
        $('select.select2Report').select2();
      });
    },
    cash_desk: function() {
      return MB.Core.sendQuery({
        command: "get",
        object: "cash_desk",
        sid: MB.User.sid
      }, function(resultUser) {
        var currentUser, html, key, objUser, val;
        currentUser = void 0;
        html = void 0;
        key = void 0;
        objUser = void 0;
        val = void 0;
        objUser = MB.Core.jsonToObj(resultUser);
        currentUser = resultUser["CASH_DESK_ID"];
        html = "<div class='row reportStyle'><div class='col-md-12'>";
        html += "<label> Касса </label><br>";
        html += "<select name='cash_desk_id' class='select2Report'>";
        for (key in objUser) {
          val = objUser[key];
          if (currentUser === objUser[key]["CASH_DESK_ID"]) {
            html += "<option value=\"" + objUser[key]["CASH_DESK_ID"] + "\" selected>" + objUser[key]["CASH_DESK_NAME"] + "</option>";
          } else {
            html += "<option value=\"" + objUser[key]["CASH_DESK_ID"] + "\">" + objUser[key]["CASH_DESK_NAME"] + "</option>";
          }
        }
        html += "</select>";
        html += "</div></div>";
        $("#params").append(html);
        $('select.select2Report').select2();
      });
    },
    ticket_operation: function() {
      return MB.Core.sendQuery({
        command: "get",
        object: "ticket_operation",
        sid: MB.User.sid
      }, function(resultAction) {
        var html, key, objAction, val;
        key = void 0;
        objAction = void 0;
        val = void 0;
        objAction = MB.Core.jsonToObj(resultAction);
        html = "<div class='row reportStyle'><div class='col-md-12'>";
        html += "<label> Тип операции </label><br>";
        html += "<select name='ticket_operation_id' class='select2Report'>";
        for (key in objAction) {
          val = objAction[key];
          html += "<option value=\"" + objAction[key]["DB_VALUES"] + "\">" + objAction[key]["CLIENT_VALUES"] + "</option>";
        }
        html += "</select>";
        html += "</div></div>";
        $("#params").append(html);
        $('select.select2Report').select2();
      });
    },
    dates: function() {
      var html;
      html = void 0;
      html = "<div class=\"date_block row reportStyle\"> <div class=\"col-md-6\"> <label for=\"from_date\"><h5>Дата с:</h5></label> <input type=\"text\" id=\"from_date\" name=\"from_date\" class=\"date_inp form-control\" size=\"10\"/> </div> <div class=\"col-md-6\"> <label for=\"to_date\"><h5>Дата по:</h5></label> <input type=\"text\" id=\"to_date\" name=\"to_date\" class=\"date_inp form-control\" size=\"10\"/> </div> </div>";
      $("#params").append(html);
      $(".date_inp").datepicker({
        format: "dd.mm.yyyy"
      });
      return MB.Core.sendQuery({
        command: "get",
        object: "sysdate",
        sid: MB.User.sid
      }, function(res) {
        $("#from_date,#to_date").val(res.SYSDATE);
      });
    },
    date: function() {
      var html;
      html = void 0;
      html = "<div class=\"date_block row reportStyle\"> <div class=\"col-md-12\"> <label for=\"date\"><h5>Дата:</h5></label> <input type=\"text\" id=\"date\" name=\"date\" class=\"date_inp form-control\" size=\"10\"/> </div> </div> </div>";
      $("#params").append(html);
      $(".date_inp").datepicker({
        format: "dd.mm.yyyy"
      });
      return MB.Core.sendQuery({
        command: "get",
        object: "sysdate",
        sid: MB.User.sid
      }, function(res) {
        $("#date").val(res.SYSDATE);
      });
    },
    paymentType: function() {
      var html;
      html = void 0;
      html = "<div class=\"row reportStyle\"> <div class=\"col-md-12\"> Тип оплаты: </div> <div class=\"col-md-12\"><div class=\"row payType\"> <div class=\"col-md-4\"> <input id=\"payTypeCASH\" type=\"radio\" name=\"payment_type\" value=\"CASH\" checked> <label for=\"payTypeCASH\">Наличными:</label> </div> <div class=\"col-md-4\"> <input id=\"payTypeCARD\" type=\"radio\" name=\"payment_type\" value=\"CARD\"> <label for=\"payTypeCARD\">Картой:</label> </div> <div class=\"clearfix\"></div> </div></div></div> ";
      return $("#params").append(html);
    },
    order: function() {
      return MB.Core.sendQuery({
        command: "get",
        object: "order",
        sid: MB.User.sid
      }, function(resultAction) {
        var html, key, objAction, val;
        html = void 0;
        key = void 0;
        objAction = void 0;
        val = void 0;
        objAction = MB.Core.jsonToObj(resultAction);
        html = "<div class='reportStyle'>";
        html += "<label> Заказ </label><br>";
        html += "<select name='order_id'>";
        for (key in objAction) {
          val = objAction[key];
          html += "<option value=\"" + objAction[key]["ORDER_ID"] + "\">" + objAction[key]["ORDER_ID"] + "</option>";
        }
        html += "</select>";
        html += "</div>";
        $("#params").append(html);
        $('select.select2Report').select2();
      });
    },
    order_agent: function() {
      return MB.Core.sendQuery({
        command: "get",
        object: "order_agent",
        sid: MB.User.sid
      }, function(resultAction) {
        var html, key, objAction, val;
        html = void 0;
        key = void 0;
        objAction = void 0;
        val = void 0;
        objAction = MB.Core.jsonToObj(resultAction);
        html = "<div class='reportStyle'>";
        html += "<label> Заказ </label><br>";
        html += "<select name='order_id' class='select2Report'>";
        for (key in objAction) {
          val = objAction[key];
          html += "<option value=\"" + objAction[key]["ORDER_ID"] + "\">" + objAction[key]["ORDER_ID"] + "</option>";
        }
        html += "</select>";
        html += "</div>";
        $("#params").append(html);
        $('select.select2Report').select2();
      });
    },
    sale_frame: function() {
      return MB.Core.sendQuery({
        command: "get",
        object: "sale_frame_report_lov",
        sid: MB.User.sid
      }, function(resultAction) {
        var html, key, objAction, val;
        html = void 0;
        key = void 0;
        objAction = void 0;
        val = void 0;
        objAction = MB.Core.jsonToObj(resultAction);
        html = "<div class='reportStyle'>";
        html += "<label> Площадки продаж </label><br>";
        html += "<select name='sale_frame_id' class='select2Report'>";
        for (key in objAction) {
          val = objAction[key];
          html += "<option value=\"" + objAction[key]["SALE_FRAME_ID"] + "\">" + objAction[key]["AGENT_NAME"] + "</option>";
        }
        html += "</select>";
        html += "</div>";
        $("#params").append(html);
      });
    }
  };

  reportClass = function(obj) {
    if (obj.objectname !== void 0) {
      this.objectname = obj.objectname;
      this.obj = this.objectname;
      this.objName = this.obj;
      if (this.objName === void 0) {
        this.objName = this.objType;
      }
    } else {
      console.log("Не передаете objectname!");
    }
    if (obj.world !== void 0) {
      this.world = obj.world;
    } else {
      console.log("Не передаете world!");
    }
    if (obj.pageswrap !== void 0) {
      this.pageswrap = obj.pageswrap;
      console.log(this.pageswrap);
    } else {
      console.log("Не передаете pageswrap!");
    }
    this.html = {};
  };

  reportClass.prototype.init = function() {
    var _this;
    _this = void 0;
    _this = this;
    return MB.Core.sendQuery({
      command: "get",
      object: _this.objName,
      sid: MB.User.sid,
      params: {
        parameters: 'TRUE'
      }
    }, function(resultAction) {
      var reportDB;
      reportDB = void 0;
      reportDB = MB.Core.jsonToObj(resultAction)[0];
      _this.reportObj = {
        Name: reportDB["REPORT_NAME"],
        object: reportDB["REPORT_COMMAND"],
        Modal: reportDB["REPORT_PARAMETERS"].split(",")
      };
      if ($(".iFrameForPrint").length > 0) {
        $(".iFrameForPrint").remove();
      }
      _this.Modal();
    });
  };

  reportClass.prototype.Modal = function() {
    var _i, _len, _ref, _this, html, i, mes, modalObj, report, runModal, val;
    html = void 0;
    i = void 0;
    mes = void 0;
    modalObj = void 0;
    report = void 0;
    val = void 0;
    _i = void 0;
    _len = void 0;
    _ref = void 0;
    _this = void 0;
    _this = this;
    report = _this.reportObj;
    html = "<div id=\"params\"><div id=\"reportModalLoader\"></div></div>";
    modalObj = {
      selector: "#portlet-config",
      title: "<h4>" + _this.reportObj.Name + "</h4>",
      content: html,
      buttons: {
        ok1: {
          label: "Сформировать",
          color: "blue",
          dopAttr: "",
          callback: function() {
            var arr, paramsEl;
            arr = void 0;
            paramsEl = void 0;
            arr = [];
            paramsEl = $("#portlet-config").find("#params");
            paramsEl.find("input,select").each(function() {
              var key;
              key = void 0;
              val = void 0;
              key = $(this).attr("name");
              if ($(this).hasClass('select2-focusser') || $(this).hasClass('select2-input')) {

              } else {
                if (key === 'payment_type') {
                  val = $("[name='payment_type']:checked").val();
                } else {
                  val = $(this).val();
                }
                return arr[key] = val;
              }
            });
            return _this.goToPrint(arr);
          }
        },
        excel: {
          label: "Экспорт в Excel",
          color: "blue",
          dopAttr: "",
          callback: function() {
            var arr, paramsEl;
            arr = [];
            paramsEl = $("#portlet-config").find("#params");
            paramsEl.find("input,select").each(function() {
              var key;
              key = $(this).attr("name");
              if (key) {
                if (key === 'payment_type') {
                  val = $("[name='payment_type']:checked").val();
                } else {
                  val = $(this).val();
                }
                console.log(666666666, this, key, val);
                return arr[key] = val;
              }
            });
            return _this.exportToExcel(arr);
          }
        },
        cancel: {
          label: "Закрыть",
          color: "default",
          dopAttr: "data-dismiss=\"modal\"",
          callback: function() {
            if ($(".iFrameForPrint").length > 0) {
              $(".iFrameForPrint").remove();
            }
          }
        }
      }
    };
    runModal = function(callback) {
      MB.Core.ModalMiniContent(modalObj);
      if (typeof callback === 'function') {
        return callback();
      }
    };
    runModal(function() {
      if (report.Modal.length > 0 && report.Modal[0] !== "") {
        mes = "";
        _ref = report.Modal;
        i = _i = 0;
        _len = _ref.length;
        while (_i < _len) {
          val = _ref[i];
          if (libModalType[val] != null) {
            libModalType[val]();
          }
          i = ++_i;
        }
      } else {
        mes = "Отчет не требует дополнительный параметров.";
      }
      $("#params #reportModalLoader").remove();
      return $("#params").append(mes);
    });
  };

  reportClass.prototype.exportToExcel = function(arr) {
    var _this, get, gg, height, iFrame, key, name, params, val, value, width;
    _this = this;
    name = _this.reportObj.object;
    width = MB.Core.getClientWidth();
    height = MB.Core.getClientHeight() + 50;
    get = "?sid=" + MB.User.sid;
    console.log(7777777777777, arr);
    for (key in arr) {
      val = arr[key];
      get += "&" + key + "=" + arr[key];
    }
    get += "&object=" + _this.reportObj.object;
    console.log(name);
    gg = "?sid=InebXxWRQjkcmdsVSidhPADtslwkQAlMacVXQLAbcxEVEUXzRd&action_id=394&object=sale_of_tickets_for_action2";
    if (name === "casher_report" || name === "return_note" || name === "delivery_note" || name === "k17" || name === "casher_journal_of_operations" || name === "register_transfer_of_roots" || name === "sale_of_tickets_for_action") {
      iFrame = "<iframe class=\"iFrameForPrint\" src=\"" + "html/report/report_" + _this.objName + "/print_" + _this.objName + ".html" + get + "\" width=\"0\" height=\"0\" align=\"left\"></iframe>";
      MB.Core.sendQuery({
        command: "get",
        object: _this.objName,
        sid: MB.User.sid,
        xls: true,
        params: {
          asd: "asd"
        }
      }, function(res) {
        return window.open("data:application/vnd.ms-excel," + "﻿" + encodeURIComponent(res["DATA"]), "_self");
      });
    } else {
      iFrame = "<iframe class=\"iFrameForPrint\" src=\"" + "html/report/print_report.html" + get + "\" width=\"0\" height=\"0\" align=\"left\"></iframe>";
      console.log(9999999999, get, _this.objName, name, arr);
      params = {};
      for (key in arr) {
        value = arr[key];
        console.log(key, value);
        params[key] = value;
      }
      params.xls = true;
      console.log('params', params);
      MB.Core.sendQuery({
        command: "get",
        object: _this.objName,
        sid: MB.User.sid,
        xls: true,
        params: params
      }, function(res) {
        console.log(8888888888, res);
        return window.open("data:application/vnd.ms-excel," + "﻿" + encodeURIComponent(res["DATA"]), "_self");
      });
    }
  };

  reportClass.prototype.goToPrint = function(arr) {
    var _this, get, height, iFrame, key, name, params, report_page, val, width;
    get = void 0;
    height = void 0;
    key = void 0;
    name = void 0;
    params = void 0;
    report_page = void 0;
    val = void 0;
    width = void 0;
    _this = void 0;
    iFrame = void 0;
    _this = this;
    name = _this.reportObj.object;
    width = MB.Core.getClientWidth();
    height = MB.Core.getClientHeight() + 50;
    get = "?sid=" + MB.User.sid;
    params = {};
    for (key in arr) {
      val = arr[key];
      get += "&" + key + "=" + arr[key];
    }
    get += "&subcommand=" + _this.reportObj.object;
    console.log(name);
    if (name === "casher_report" || name === "return_note" || name === "delivery_note" || name === "k17" || name === "casher_journal_of_operations" || name === "register_transfer_of_roots" || name === "sale_of_tickets_for_action") {
      iFrame = "<iframe class=\"iFrameForPrint\" src=\"" + "html/report/report_" + _this.objName + "/print_" + _this.objName + ".html" + get + "\" width=\"0\" height=\"0\" align=\"left\"></iframe>";
    } else {
      iFrame = "<iframe class=\"iFrameForPrint\" src=\"" + "html/report/print_report.html" + get + "\" width=\"0\" height=\"0\" align=\"left\"></iframe>";
    }
    $("body").append(iFrame);
  };

  MB.reportClass = reportClass;

  return;

}).call(this);

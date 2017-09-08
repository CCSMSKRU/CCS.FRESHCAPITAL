(function() {
  var OrderPaymentClass, sid;

  sid = MB.User.sid;

  OrderPaymentClass = function(obj) {
    this.orderId = obj.orderId;
    if (obj.table !== void 0) {
      return this.table = obj.table;
    }
  };

  OrderPaymentClass.prototype.init = function() {};

  OrderPaymentClass.prototype.ButtonsState = function(state) {
    switch (state) {
      case "on":
        $(".modal-footer .btn").each(function() {
          return $(this).removeClass("disabled");
        });
        $(".formOrderMini input").each(function() {
          return $(this).removeAttr("disabled");
        });
        return $(".formOrderMini .btn").each(function() {
          return $(this).removeAttr("disabled");
        });
      case "off":
        $(".modal-footer .btn").each(function() {
          if ($(this).attr("class").indexOf("btn_cancel") === -1) {
            return $(this).addClass("disabled");
          }
        });
        $(".formOrderMini input").each(function() {
          return $(this).attr("disabled", true);
        });
        return $(".formOrderMini .btn").each(function() {
          return $(this).attr("disabled", true);
        });
    }
  };

  OrderPaymentClass.prototype.sendAmount = function(payType, orderId, callback, params) {
    if (params === undefined) {
      params = {};
      params["ORDER_ID"] = orderId;
      params['OBJVERSION'] = $("[name=OBJVERSION]").val();
      $(".formOrderMini").find("input").each(function() {
        var key, val;
        val = $(this).val();
        key = $(this).attr("name");
        return params[key] = val;
      });
    }
    payType = payType.attr("id").indexOf("CASH") === -1 ? "CARD" : "CASH";
    params["payment_type"] = payType;
    if (payType === 'CARD') {
      return MB.Core.sendQuery({
        command: 'get',
        object: 'payment_card_type',
        sid: sid
      }, function(cardTypes) {
        var i, len, option, ref, selectHtml;
        selectHtml = '<select id="chooseCardType">';
        ref = cardTypes.DATA;
        for (i = 0, len = ref.length; i < len; i++) {
          option = ref[i];
          selectHtml += '<option value="' + option[cardTypes.NAMES.indexOf('PAYMENT_CARD_TYPE_ID')] + '">' + option[cardTypes.NAMES.indexOf('PAYMENT_CARD_TYPE')] + '</option>';
        }
        selectHtml += '</select>';
        bootbox.dialog({
          message: selectHtml,
          title: 'Выберите тип банковской карты',
          buttons: {
            ok: {
              label: 'Подтвердить',
              className: '',
              callback: function() {
                var selectedCardType;
                selectedCardType = $('#chooseCardType').select2('val');
                params.payment_card_type_id = selectedCardType;
                return MB.Core.sendQuery({
                  command: "operation",
                  object: "set_order_payment_type",
                  sid: sid,
                  params: params
                }, function(data) {
                  toastr[data.TOAST_TYPE](data.MESSAGE, data.TITLE);
                  return callback(data);
                });
              }
            },
            cancel: {
              label: 'Отмена',
              className: '',
              callback: function() {}
            }
          }
        });
        return $('#chooseCardType').select2();
      });
    } else {
      return MB.Core.sendQuery({
        command: "operation",
        object: "set_order_payment_type",
        sid: sid,
        params: params
      }, function(data) {
        toastr[data.TOAST_TYPE](data.MESSAGE, data.TITLE);
        return callback(data);
      });
    }
  };

  OrderPaymentClass.prototype.updateView = function() {
    var _this;
    _this = this;
    return {
      table: function(obj) {
        var table;
        if (_this.table !== "no") {
          $(".form_order_mini-content-wrapper").html("");
          console.log('_this', _this);
          table = new MB.Table({
            world: "form_order_mini",
            name: "tbl_order_ticket_mini",
            params: {
              parent: {
                type: "form",
                activeId: _this.orderId,
                data: {
                  data: [[_this.orderId]],
                  names: ["ORDER_ID"]
                }
              }
            }
          });
          return table.create(function() {});
        }
      },
      amount: function(obj, first) {
        var Id;
        if (first === void 0) {
          if (Id === undefined || Id === "") {
            Id = _this.orderId;
          }
          return MB.Core.sendQuery({
            command: "get",
            object: "order",
            sid: sid,
            params: {
              where: "ORDER_ID = " + Id
            }
          }, function(data) {
            var totalOrderAmount;
            totalOrderAmount = data["DATA"][0][data["NAMES"].indexOf("TOTAL_ORDER_AMOUNT")];
            return $(".formOrderMini").find("input").each(function() {
              var orderObjversion, val;
              val = data["DATA"][0][data["NAMES"].indexOf($(this).attr("name"))];
              log(val);
              if (val !== 0) {
                $(this).val(val);
              }
              orderObjversion = data["DATA"][0][data["NAMES"].indexOf("OBJVERSION")];
              return $("[name=OBJVERSION]").val(orderObjversion);
            });
          });
        }
      },
      all: function(obj) {
        this.table(obj);
        return this.amount(obj);
      },
      db: function(Id, callback) {
        if (Id === undefined || Id === "") {
          Id = _this.orderId;
        }
        return MB.Core.sendQuery({
          command: "get",
          object: "order",
          sid: sid,
          params: {
            where: "ORDER_ID = " + Id
          }
        }, function(data) {
          _this.updateView().table(data);
          _this.updateView().amount(data);
          $(".StrOrderAmount").find("input").each(function() {
            var key, val;
            key = $(this).attr("name");
            val = data["DATA"][0][data["NAMES"].indexOf(key)];
            return $("[name=" + $(this).attr("name") + "]").val(val);
          });
          if (parseInt(data["DATA"][0][data["NAMES"].indexOf("TOTAL_ORDER_AMOUNT")]) === 0) {
            $(".formOrderMini").find("input").each(function() {
              return $(this).val("");
            });
            _this.ButtonsState("off");
          }
          if (callback !== undefined && typeof callback === "function") {
            return callback(data);
          }
        });
      }
    };
  };

  OrderPaymentClass.prototype.handlerOrderAmount = function(obj) {
    var ButtonsState, _this, orderId, orderObjversion, totalOrderAmount;
    obj = MB.Core.jsonToObj(obj);
    _this = this;
    ButtonsState = this.ButtonsState;
    orderId = _this.orderId;
    totalOrderAmount = obj[0]["TOTAL_ORDER_AMOUNT"];
    orderObjversion = obj[0]["OBJVERSION"];
    $("[name=OBJVERSION]").val(orderObjversion);
    $(".formOrderMini .btn").click(function() {
      var selector;
      $(".formOrderMini").find("input:not([name='OBJVERSION'])").each(function() {
        return $(this).val("");
      });
      selector = $(this).attr("id").replace("btnOrderAmount_", "") + "_AMOUNT";
      $("[name=" + selector + "]").val(totalOrderAmount);
      ButtonsState("off");
      return _this.sendAmount($(this), orderId, function(result) {
        _this.updateView().amount(result);
        $('.form_order-item .reload, .form_order_mini-item .reload').click();
        return ButtonsState("on");
      });
    });
    return $(".formOrderMini input").blur(function() {
      ButtonsState("off");
      return _this.sendAmount($(this), orderId, function(result) {
        _this.updateView().amount(result);
        return ButtonsState("on");
      });
    });
  };

  OrderPaymentClass.prototype.renderOrderPaymentType = function(obj) {
    var html;
    obj = MB.Core.jsonToObj(obj);
    html = "<form class='formOrderMini' role='form'> <div class='row'> <div class='col-md-8'> <div class='form_order_mini-content-wrapper'></div> </div> <div class='col-md-4 pull-right'> <div class='StrOrderAmount'> <div class='row'> <div class='col-md-12'> <div class='col-md-6'> <label class='wid100pr'>Мест <input class='col-md-12' name='PLACES_COUNT' value='" + obj[0].PLACES_COUNT + "' size='3' disabled/> </label> </div> <div class='col-md-6'> <label class='wid100pr'>билетов <input class='col-md-12' name='TICKETS_COUNT' value='" + obj[0].TICKETS_COUNT + "' size='3' disabled/> </label> </div> </div> <div class='col-md-12'> <div class='col-md-6'> <label class='wid100pr'>На сумму <input class='col-md-12' name='TOTAL_ORDER_AMOUNT' value='" + obj[0].TOTAL_ORDER_AMOUNT + "' size='8' disabled/> </label> </div> <div class='col-md-6'> <label class='wid100pr'>&nbsp; <input class='col-md-12 hiddenImp' name='TOTAL_TO_PAY_ORDER_AMOUNT' value='" + obj[0].TOTAL_TO_PAY_ORDER_AMOUNT + "' size='8' disabled/> </label> </div> </div> <div class='col-md-12 marBot20'> <div class='col-md-6'> <button type='button' class='wid100pr btn btn-default newStyle clickButton' id='btnOrderAmount_CASH'><i class='fa fa-money'></i>&nbsp;&nbsp;<div class='textUp'>Наличными</div></button> </div> <div class='col-md-6'> <button type='button' class='wid100pr btn btn-default newStyle deSelect clickButton' id='btnOrderAmount_CARD'><i class='fa fa-credit-card'></i>&nbsp;&nbsp;<div class='textUp'>Картой</div></button> </div> </div> </div> </div> <input type='hidden' name='OBJVERSION'/> </div> </div> </form>";
    return html;
  };

  OrderPaymentClass.prototype.renderOrderPaymentTypeForm = function(obj) {
    var html;
    obj = MB.Core.jsonToObj(obj);
    html = "<form class='formOrderMini' role='form'> <div> <div class='StrOrderAmount'> <div class='row'> <div class='col-md-12'> <div class='col-md-6'> <label class='wid100pr'>Мест <input class='col-md-12' name='PLACES_COUNT' value='" + obj[0].PLACES_COUNT + "' size='3' disabled/> </label> </div> <div class='col-md-6'> <label class='wid100pr'>билетов <input class='col-md-12' name='TICKETS_COUNT' value='" + obj[0].TICKETS_COUNT + "' size='3' disabled/> </label> </div> </div> <div class='col-md-12'> <div class='col-md-6'> <label class='wid100pr'>На сумму <input class='col-md-12' name='TOTAL_ORDER_AMOUNT' value='" + obj[0].TOTAL_ORDER_AMOUNT + "' size='8' disabled/> </label> </div> <div class='col-md-6'> <label class='wid100pr'>&nbsp; <input class='col-md-12 hiddenImp' name='TOTAL_TO_PAY_ORDER_AMOUNT' value='" + obj[0].TOTAL_TO_PAY_ORDER_AMOUNT + "' size='8' disabled/> </label> </div> </div> <div class='col-md-12'> <div class='col-md-6'> <button type='button' class='wid100pr btn btn-default newStyle clickButton' id='btnOrderAmount_CASH'><i class='fa fa-money'></i>&nbsp;&nbsp;<div class='textUp'>Наличными</div></button> </div> <div class='col-md-6'> <button type='button' class='wid100pr btn btn-default newStyle deSelect clickButton' id='btnOrderAmount_CARD'><i class='fa fa-credit-card'></i>&nbsp;&nbsp;<div class='textUp'>Картой</div></button> </div> </div> </div> <input type='hidden' name='OBJVERSION'/> </div> </form>";
    return html;
  };

  MB.OrderPaymentClass = OrderPaymentClass;

}).call(this);

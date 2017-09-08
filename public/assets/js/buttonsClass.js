(function() {
  var ButtonsClass;

  ButtonsClass = function(instance, CustomButtons) {
    var div, html, key, value;
    div = instance.$container;
    if (div.find(".buttons").html() === "") {
      for (key in CustomButtons) {
        value = CustomButtons[key];
        html = '<button id="formAction_' + key + '" type="button" class="btn ' + CustomButtons[key]['style'] + ' form-create-button ' + key + '"> <i class="fa fa-copy"></i> ' + CustomButtons[key]['name'] + '</button>';
        div.find(".buttons").append(html);
        if (CustomButtons[key].disabled()) {
          div.find(".buttons").find("." + key).attr("disabled", "true");
        } else {
          div.find(".buttons").find("." + key).removeAttr("disabled");
        }
      }
      div.find(".buttons").click(function(e) {
        if ($(e.target).attr("class") !== "buttons") {
          key = $(e.target).attr("id").replace("formAction_", "");
          return CustomButtons[key].callback();
        }
      });
    }
    for (key in CustomButtons) {
      value = CustomButtons[key];
      if (CustomButtons[key].disabled()) {
        div.find(".buttons").find("." + key).attr("disabled", "true");
      } else {
        div.find(".buttons").find("." + key).removeAttr("disabled");
      }
    }
    return true;
  };

  MB.Core.CreateButtonsInForm = function(instance, buttons) {
    return buttons = new ButtonsClass(instance, buttons);
  };

}).call(this);

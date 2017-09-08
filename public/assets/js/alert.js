var MB = MB || {};

MB.Alert = function (options) {
    var _this = this;
    var id = "alertid-" + MB.Core.guid();
    MB.O.alerts[id] = _this;

    _this.id 		= id;
    _this.title 	= options.title;
    _this.text 		= options.text;
    _this.buttons 	= options.buttons;
    _this.created  	= false;
};

MB.Alert.prototype.alert = function () {
	var _this = this;
	var html = _this.createhtml();
	$(body).append(html);
	$("#alertid-" + _this.id).on("click", "button", function () {
		var buttonkey = $(this).data("buttonkey");
		MB.O.alerts[_this.id].buttons[buttonkey].fn();
	});
	_this.showit();
};

MB.Alert.prototype.showit = function () {
	var _this = this;
	$("#alertid-" + _this.id).addClass("in").attr("aria-hidden", "true").css({"display":"block"});
};

MB.Alert.prototype.createhtml = function () {
	var _this = this;
	var html = "";
	html += "<div class='modal fade' id='alertid-" + _this.id + "' tabindex='-1' role='basic' aria-hidden='true'><div class='modal-dialog'><div class='modal-content'><div class='modal-header'><button type='button' class='close' data-dismiss='modal' aria-hidden='true'></button><h4 class='modal-title'>" + _this.title + "</h4></div><div class='modal-body'>" + _this.text + "</div><div class='modal-footer'>";
	for (var key in _this.buttons) {
		html += "<button type='button' class='btn default' data-dismiss='modal' data-buttonkey='" + key + "'>" + _this.buttons[key].text + "</button>";
	}
	html += "</div></div></div></div>";
	return html;
};
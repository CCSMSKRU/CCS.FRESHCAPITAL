MBOOKER.Classes.Content = function (area, obj) {
	var _this = this;
	this.area = area;
	for (var key in obj) {
		this[key] = obj[key];
	}
	$("." + this.area + "-content-wrapper").append(MBOOKER.Fn.createWrapperHTML(area, "content", obj.name));
};

MBOOKER.Classes.Content.prototype.getHtml = function (callback) {
	var _this = this;
	if (this.area === "page") {
		$("#page_" + MBOOKER.Pages.typeOfActivePage + "_" + MBOOKER.Pages.activePage + "_wrapper").fadeOut();
	} else if (this.area === "modal") {
		$("#modal_" + MBOOKER.Modals.typeOfActiveModal + "_" + MBOOKER.Modals.activeModal + "_wrapper").fadeOut();
	}
	$("#" + _this.area + "_content_" + _this.name + "_wrapper").fadeIn();
	$(".modals-list").append("<li>ZFD</li>")
	// console.log($("#" + _this.area + "_content_" + _this.name + "_wrapper").width());
	if (this.url && typeof this.url === "string") {
        $("#" + this.area + "_content_" + this.name + "_wrapper").load(this.url, function (responseText, textStatus, XMLHttpRequest) {
        	if (textStatus === "success") {
        		callback();
        	}        	
        });
    } else {
    	$("#" + this.area + "_content_" + this.name + "_wrapper").load("html/contents/" + this.name + "/" + this.name + ".html", function (responseText, textStatus, XMLHttpRequest) {
    		if (textStatus === "success") {
        		callback();
        	}
    	});
    }
};

MBOOKER.Classes.Content.prototype.init = function () {
	var _this = this;
	this.getHtml(function () {
		console.log($("#" + _this.area + "_content_" + _this.name + "_wrapper").width());
		// $("#" + _this.area + "_content_" + _this.name + "_wrapper").fadeIn();

	});
};

MBOOKER.Classes.Content.prototype.getWidth = function () {
	// setTime
	// return 77;
	// if (this.area === "page") {
	// 	return $("#" + _this.area + "_content_" + _this.name + "_wrapper").width();
	// } else if (this.area === "modal") {
	// 	return $("#" + _this.area + "_content_" + _this.name + "_wrapper").width();
	// }
	// return 7777;
	return $("#" + this.area + "_content_" + this.name + "_wrapper").width();
};

MBOOKER.Classes.Content.prototype.getHeight = function () {
	return $("#" + this.area + "_content_" + this.name + "_wrapper").height();
	// return $("#" + this.area + "_content_" + this.name + "_wrapper").height();
};

MBOOKER.Classes.Content.prototype.show = function () {
	var _this = this;
	$("#" + _this.area + "_content_" + _this.name + "_wrapper").show();
};

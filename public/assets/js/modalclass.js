MBOOKER.Modals.Modal = function (type, obj) {
	if (type && typeof type === "string") {
		if (obj && typeof obj === "object") {
			if (type === "content") {
				if (obj.name) {
					var content = obj;
					MBOOKER.Modals.modals.contents[obj.name] = content;
				} else {
					toastr.error("Для content нужно указывать имя", "MBOOKER.Modals.Modal");
				}
			} else if (type === "form") {
				if (obj.subcommand && obj.ids) {
					var form = new MBOOKER.Modals.Form(obj.subcommand, obj.ids);
					MBOOKER.Modals.modals.forms[obj.subcommand] = form;
					MBOOKER.Modals.modals.forms[obj.subcommand].init();
				} else {
					toastr.error("Не передается в объекте subcommand или ids", "MBOOKER.Modals.Modal");
				}
			} else if (type === "table") {
				if (obj.subcommand) {
					var table = new MBOOKER.Tables.Table(obj);
					MBOOKER.Modals.modals.tables[obj.subcommand] = table;
					MBOOKER.Modals.modals.tables[obj.subcommand].rows = {};
                    MBOOKER.Modals.modals.tables[obj.subcommand].init();
				} else {
					toastr.error("Не передается в объекте subcommand", "MBOOKER.Modals.Modal");
				}
			}
			
		} else {
			toastr.error("Не передается obj или его тип не объект", "MBOOKER.Modals.Modal");
		}
	} else {
		toastr.error("Не передается type или его тип не строка", "MBOOKER.Modals.Modal");
	}
};

	// var settings = MBOOKER.Modals.modalsSettings[obj.subcommand];
	// this.ids = obj.ids;
	// this.firstId = obj.ids[0];
	// this.subcommand = settings.subcommand;
	// this.data = null;
	// this.info = null;
// };

// MBOOKER.Modals.Modal.prototype.getData = function (callback) {
// 	var o = {
// 		"sid": 			MBOOKER.UserData.sid,
// 		"command": 		"get",
// 		"subcommand": 	this.subcommand,
// 		// "PAGE_NO": 		this.pageNumber,
// 		// "ROWS_MAX_NUM": this.maxNumberRowsDisplayed,
// 		// "ORDER_BY": 	this.sortBy
// 		"where": "ADDR_ID = " + this.firstId
// 	};	
// 	MBOOKER.MainFunctions.sendQuery(o, function (response) {
// 		callback(response);
// 	});
// };

// MBOOKER.Modals.Modal.prototype.init = function () {
// 	var _this = this;
// 	this.getData(function (response) {
// 		_this.update(response);
// 		_this.loadTemplate(function () {
// 			_this.fillIn();
// 			_this.handleEvents();
// 		});		
// 	});
// };

// MBOOKER.Modals.Modal.prototype.update = function (response) {
// 	this.data 				= response.DATA;
// 	this.info 				= response.INFO || null;	
// };

// MBOOKER.Modals.Modal.prototype.loadTemplate = function (callback) {
// 	var _this = this;
// 	var url = "/html/modals/" + this.subcommand + "/" + this.subcommand + ".html";
// 	$("#" + this.subcommand + "_modal_wrapper").load(url, function (response, textStatus, XMLHttpRequest) {
// 		if (textStatus === "success") {
// 			callback();
// 		}
// 	});
// };

// MBOOKER.Modals.Modal.prototype.fillIn = function () {
	
// };


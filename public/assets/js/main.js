
var MB = {};

MB.loader = function(state, mes){
    var _t = this;

    var wrap = $('body');

    if(state){
        var loaderHtml = '<div class="form-loader-holder">' +
            '<div class="form-loader-fader"></div>' +
            '<div class="form-loader-body">' +
            '<div class="form-loader-gif"></div>' +
            '<div class="form-loader-text">'+mes+'</div>' +
            '</div>' +
            '</div>';


        wrap.find('.form-loader-holder').remove();

        wrap.prepend(loaderHtml);

        wrap.find('.form-loader-holder').eq(0).animate({
            opacity: 1
        }, 70, function(){

        });

    }else{
        wrap.find('.form-loader-holder').eq(0).animate({
            opacity: 0
        }, 70, function(){
            wrap.find('.form-loader-holder').remove();
        });



    }
};



var clearLSProfiles = function () {
	var profiles = [];
	var prs;
	var results = [];
	for (var ls in localStorage) {
		if (ls.indexOf('formN_') > -1 || ls.indexOf('tableN_') > -1) {
			profiles.push(ls);
		}
	}
	for (var j = 0; j < profiles.length; j++) {
		prs = profiles[j];
		results.push(localStorage.removeItem(prs));
	}
	return results;
};

window.log = function (s) {
	var log;
	log = console.log;
	return log.call(console, s);
};

$.cookie("language", "Rus", {
	expires: 7
});
$('#changeCashBox').on("click", function() {
    return MB.Core.setCashBox();
});

if ($.fn.datetimepicker) {
	$.fn.datetimepicker.defaults = {
		maskInput: true,
		pickDate: true,
		pickTime: true,
		pick12HourFormat: false,
		pickSeconds: true,
		startDate: "2014-01-01",
		endDate: Infinity
	};
}

$('.username').html($.cookie('userfullname'));

$('#changePack').on("click", function () {
	return printQuery({
		command: "CHANGE_PACK"
	});
});

clearLSProfiles();


$('#clientScreen_showAfisha').on("click", function () {
	var fromDate, toDate;
	fromDate = $('#clientScreenWidget-content input[name="start"]').val();
	toDate = $('#clientScreenWidget-content input[name="end"]').val();
	return toClientscreen({
		type: 'list',
		fromDate: fromDate,
		toDate: toDate
	});
});

$('#clientScreen_closeOrder').on('click', function () {
	toClientscreen({
		type: 'closeOrder'
	});
	return MB.Core.cSreenWindow.window.onbeforeunload = function () {
		return MB.Core.cSreenWindow = void 0;
	};
});

$("#open_action_14").on("click", function () {
	log("clicked");
	return MB.Core.switchModal({
		type: "content",
		filename: "one_action",
		id: MB.Core.guid(),
		params: {
			action_id: 14
		}
	});
});

$("#open_fundZones_30").on("click", function () {
	return MB.Core.switchModal({
		type: "content",
		filename: "fundZones",
		id: MB.Core.guid(),
		params: {
			hall_scheme_id: 30
		}
	});
});

$("#open_priceZones_30").on("click", function () {
	var o;
	return o = {
		name: "priceZones",
		hall_scheme_id: 30
	};
});

$(document).off("keydown").on("keydown", function (e) {
	var d, doPrevent;
	doPrevent = false;
	if (e.keyCode === 8) {
		d = e.srcElement || e.target;
		if ((d.tagName.toUpperCase() === "INPUT" && (d.type.toUpperCase() === "NUMBER" || d.type.toUpperCase() === "TEXT" || d.type.toUpperCase() === "PASSWORD" || d.type.toUpperCase() === "FILE" || d.type.toUpperCase() === "EMAIL" || d.type.toUpperCase() === "SEARCH" || d.type.toUpperCase() === "DATE")) || d.tagName.toUpperCase() === "TEXTAREA") {
			doPrevent = d.readOnly || d.disabled;
		} else {
			doPrevent = true;
		}
	}
	if (doPrevent) {
		e.preventDefault();
	}
	return MB.keys[e.which] = true;
});

$(document).on("keyup", function (e) {
	return delete MB.keys[e.which];
});

$(document).on("click", function (e) {
	if ($(e.target).parents('.ctxMenu-wrapper').length === 0) {
		return $(document).find('.ctxMenu-wrapper').remove();
	}
});

String.prototype.bool = function () {
	return /^(true|TRUE|True)$/i.test(this);
};

window.sendQuery2 = function (req, cb) {
	socket2.emit("query", req);
	return socket2.on("sendQuery2Response", function (res) {
		var key, key2, key3, key4, key5, ref, ref1, ref2, ress, value, value2, value3;
		ress = {};
		if (res.results != null) {
			if (res.results[0].data != null) {
				ref = res.results[0];
				for (key in ref) {
					value = ref[key];
					switch (key) {
						case "data":
							ress.DATA = value;
							break;
						case "data_columns":
							ress.NAMES = value;
							break;
						case "data_info":
							ress.INFO = {
								ROWS_COUNT: value.rows_count,
								VIEW_NAME: value.view_name
							};
							break;
						case "extra_data":
							ref1 = res.results[0][key];
							for (key2 in ref1) {
								value2 = ref1[key2];
								if (key2 === "object_profile") {
									ress.OBJECT_PROFILE = {};
									for (key3 in value2) {
										value3 = value2[key3];
										key4 = key3.toUpperCase();
										if (key3 === "prepare_insert") {
											ress.OBJECT_PROFILE[key4] = {
												DATA: value3.data,
												NAMES: value3.data_columns
											};
										} else {
											ress.OBJECT_PROFILE[key4] = value3;
										}
									}
								} else {
									key5 = key2.toUpperCase();
									ress[key5] = value2;
								}
							}
					}
				}
			} else {
				ref2 = res.results[0];
				for (key in ref2) {
					value = ref2[key];
					key2 = key.toUpperCase();
					switch (key) {
						case "toastr":
							ress.TOAST_TYPE = value.type;
							ress.MESSAGE = value.message;
							ress.TITLE = value.title;
							break;
						case "code":
							ress.RC = value;
							break;
						default:
							ress[key2] = value;
					}
				}
			}
		}
		console.log(ress);
		return cb(ress);
	});
};

window.mergeArrays = function(a1, a2){
    if (typeof a1!=='object' || typeof a2!=='object') return console.log('В mergeArrays не переданы два массива');
    var merge = function (a1, a2) {
        var res = [];
        for (var i in a1) {
            if ($.inArray(a1[i], a2) == -1) {
                if ($.inArray(a1[i], res) === -1) res.push(a1[i]);
            }
        }
        return res;
    };
    var res1 = merge(a1, a2);
    var res2 = merge(a2, a1);
    console.log('Уникальные в первом массиве:');
    console.log(res1);
    console.log('Уникальные в первом массиве:');
    console.log(res2);
};

(function () {
	if (toastr) {
		toastr.options = {
			closeButton: true,
			debug: false,
			positionClass: "toast-bottom-right",
			onclick: null,
			showDuration: "1000",
			hideDuration: "1000",
			timeOut: "10000",
			extendedTimeOut: "1000",
			showEasing: "swing",
			hideEasing: "linear",
			showMethod: "fadeIn",
			hideMethod: "fadeOut"
		};
	}

	MB.keys = {};

	MB.User = {};
	MB.User.sid = $.cookie("sid");
	MB.User.activepage = "content_index";
	MB.User.loadedpages = ["content_index"];

	MB.O = {};
	MB.O.tables = {};
	MB.O.contents = {};
	MB.O.forms = {};

	MB.Core = {};
	MB.Core.helper = {};
	MB.Core.$pageswrap = $(".page-content-wrapper");
	MB.Core.getUserGuid = function () {
		var pGuid;
		pGuid = MB.Core.guid();
		if (!localStorage.getItem('printerGuid')) {
			localStorage.setItem('printerGuid', pGuid);
		} else {
			pGuid = localStorage.getItem('printerGuid');
		}
		return pGuid;
	};
	MB.Core.parseFormat = function (resold) {
		var _ref;
		var key;
		var key2;
		var value;
		var resnew = {};
		if (resold.hasOwnProperty("results")) {
			if (resold.results[0].hasOwnProperty("data")) {
				_ref = resold.results[0];
				for (key in _ref) {
					value = _ref[key];
					switch (key) {
						case "data":
							resnew.DATA = value;
							break;
						case "data_columns":
							resnew.NAMES = value;
							break;
						case "data_info":
							resnew.INFO = {
								ROWS_COUNT: value.rows_count,
								VIEW_NAME: value.view_name
							};
							break;
						case "extra_data":
							for (key2 in value) {
								var value2 = value[key2];
								switch (key2) {
									case "object_profile":
										resnew.OBJECT_PROFILE = {};
										for (var key3 in value2) {
											var value3 = value2[key3];
											var key4 = key3.toUpperCase();
											switch (key3) {
												case "prepare_insert":
													resnew.OBJECT_PROFILE[key4] = {
														DATA: value3.data,
														NAMES: value3.data_columns
													};
													break;
												default:
													resnew.OBJECT_PROFILE[key4] = value3;
											}
										}
										break;
									default:
										resnew[key2.toUpperCase()] = value2;
								}
							}
					}
				}
			}
			else {
				_ref = resold.results[0];
				for (key in _ref) {
					value = _ref[key];
					key2 = key.toUpperCase();
					switch (key) {
						case "toastr":
							resnew.TOAST_TYPE = value.type;
							resnew.MESSAGE = value.message;
							resnew.TITLE = value.title;
							break;
						case "code":
							resnew.RC = value;
							break;
						default:
							resnew[key2] = value;
					}
				}
			}
		}
		return resnew;
	};
	MB.Core.randomnumber = function () {
		return Math.floor(Math.random() * (1000000 - 0 + 1)) + 0;
	};
	MB.Core.guid = function () {
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxxx".replace(/[xy]/g, function (c) {
			var r, v;
			r = Math.random() * 16 | 0;
			v = (c === "x" ? r : r & 0x3 | 0x8);
			return v.toString(16);
		}).toUpperCase();
	};
	MB.Core.sendQuery = function (options, callback) {
		var returnFunc = socketQuery(options, function (result) {
			var key, key2, value, value2, value3;
			var res = JSON.parse(result);
			var ress = {};
			if (res.results != null) {
				if (res.results[0].data != null) {
					var ref = res.results[0];
					for (key in ref) {
						value = ref[key];
						switch (key) {
							case "data":
								ress.DATA = value;
								break;
							case "data_columns":
								ress.NAMES = value;
								break;
							case "data_info":
								ress.INFO = {
									ROWS_COUNT: value.rows_count,
									VIEW_NAME: value.view_name
								};
								break;
							case "extra_data":
								var ref1 = res.results[0][key];
								for (key2 in ref1) {
									value2 = ref1[key2];
									if (key2 === "object_profile") {
										ress.OBJECT_PROFILE = {};
										for (var key3 in value2) {
											value3 = value2[key3];
											var key4 = key3.toUpperCase();
											if (key3 === "prepare_insert" || key3 === "rmb_menu") {
												ress.OBJECT_PROFILE[key4] = {
													DATA: value3.data,
													NAMES: value3.data_columns
												};
											} else {
												ress.OBJECT_PROFILE[key4] = value3;
											}
										}
									} else {
										ress[key2.toUpperCase()] = value2;
									}
								}
						}
					}
				} else {
					ref = res.results[0];
					for (key in ref) {
						value = ref[key];
						key2 = key.toUpperCase();
						switch (key) {
							case "toastr":
								ress.TOAST_TYPE = value.type;
								ress.MESSAGE = value.message;
								ress.TITLE = value.title;
								break;
							case "code":
								ress.RC = value;
								break;
							default:
								ress[key2] = value;
						}
					}
				}
			}
			console.log(ress);
			if (ress.RC != null) {
				if (parseInt(ress.RC) === 0) {
					if (ress.TICKET_PACK_USER_INFO) {
						var JSONstring = ress.TICKET_PACK_USER_INFO;
						var userInfo = new userInfoClass({
							JSONstring: JSONstring
						}).userInfo_Refresh();
					}
					if (typeof callback === "function") {
						return callback(ress);
					}
				} else if (parseInt(ress.RC) === -2) {
					if (toastr) {
						toastr[ress.TOAST_TYPE](ress.MESSAGE);
					} else {
						console.warn("Ваша сессия не актульна. Пожалуйста, зайдите на сайт заново, MB.Core.sendQuery");
					}
					return setTimeout((function () {
						$.removeCookie("sid");
						return document.location.href = "login.html";
					}), 3000);
				} else {
					if (typeof callback === "function") {
						return callback(ress);
					}
				}
			} else {
				if (typeof callback === "function") {
					return callback(ress);
				}
			}
		});
		if ((options != null) && typeof options === "object" && (options.command != null)) {
			if (options.sid == null) {
				options.sid = MB.User.sid;
			}

			if (location.hash === "#show_log") {
				options.hash = location.hash;
			}
		}
		return returnFunc;
	};
	MB.Core.makeQuery = function (options, callback) {
		var key, opt, xml;
		opt = MB.Core.cloneObj(options);
		xml = "<query>";
		if (opt && typeof opt === "object" && opt.command) {
			if (opt.hasOwnProperty("params")) {
				for (key in opt.params) {
					xml += "<" + key + ">" + opt.params[key] + "</" + key + ">";
				}
				delete opt.params;
			}
			for (key in opt) {
				xml += "<" + key + ">" + opt[key] + "</" + key + ">";
			}
			xml += "</query>";
		}
		return xml;
	};
	MB.Core.getClientWidth = function () {
		if (window.innerWidth) {
			return window.innerWidth;
		} else {
			if (document.documentElement.clientWidth) {
				return document.documentElement.clientWidth;
			} else {
				return document.body.offsetWidth;
			}
		}
	};
	MB.Core.getClientHeight = function () {
		if (window.innerHeight) {
			return window.innerHeight;
		} else {
			if (document.documentElement.clientHeight) {
				return document.documentElement.clientHeight;
			} else {
				return document.body.offsetHeight;
			}
		}
	};
	MB.Core.switchPage = function (options) {
		var content, modalmini, report, table;
		if (options.type) {
			if (options.type === "item" && (options.client_object || options.class)) {
				if (options.isNewTable) {

					table = new MB.TableN({
						name: options.name,
						client_object: options.client_object,
						class: options.class,
						id: MB.Core.guid(),
						externalWhere: options.externalWhere
					});
					return table.create(MB.Core.$pageswrap, function () {
						console.log('new table rendered');
					});
				} else {
					//if (MB.Table.hasloaded(options.name)) {
					//	if (options.where !== "") {
					//		MB.O.tables[options.name].constructorWhere = options.where;
					//	}
					//	MB.O.tables[options.name].reload("data");
					//	return MB.Table.show("page", options.name);
					//} else {
					//	table = new MB.Table({
					//		world: "page",
					//		name: options.name,
					//		where: options.where || ""
					//	});
					//	return table.create(function () {
					//		return table.showit();
					//	});
					//}
				}
			} else if (options.type === "content" && options.filename) {

				if (options.isNew) {
					return content = MB.Core.switchModal({
						type: "content",
						filename: options.filename,
						isNew: true,
						params: {
							title: 'Верстка бюджета',
							label: 'Верстка бюджета'
						}
					});
				}

				if (MB.Content.hasloaded(options.filename)) {
					return MB.Content.find(options.filename).showit();
				} else {
					content = new MB.Content({
						world: "page",
						filename: options.filename
					});
					return content.create(function () {
						content.showit();
						return content.init();
					});
				}
			} else if (options.type === "MODALMINI" && options.name) {
				if (options.isNew) {
					return MB.Core.mini_form.init(options);
				} else {
					modalmini = new MB.modalmini({
						objectname: options.name,
						world: "page",
						pageswrap: MB.Core.$pageswrap
					});
					return modalmini.init();
				}
			} else if (options.type === "report" && options.name) {

                alert(1);


				report = new MB.Core.Report({
					name: options.name
				});

                alert(12);

				return report.init();
			}
		}
	};
	MB.Core.cloneObj = function (obj) {
		var key, temp;
		if ((obj == null) || typeof obj !== "object") {
			return obj;
		}
		temp = {};
		for (key in obj) {
			temp[key] = MB.Core.cloneObj(obj[key]);
		}
		return temp;
	};
	MB.Core.ModalMiniContent = function (obj) {
		var ModalBody, ModalDiv, ModalHeader, fn, key;
		ModalDiv = $(obj.selector);
		ModalHeader = ModalDiv.find(".modal-header");
		ModalBody = ModalDiv.find(".modal-body");
		ModalHeader.html(obj.title);
		ModalBody.html(obj.content);
		$(".modal-footer").html("");
		fn = function (key) {
			var html, val;
			val = obj["buttons"][key];
			html = "";
			html += "<button type=\"button\" class=\"btn " + val["color"] + " btn_" + key + "\" " + val["dopAttr"] + ">" + val["label"] + "</button>";
			$(".modal-footer").append(html);
			return $(".btn_" + key).click(function () {
				return val.callback();
			});
		};
		for (key in obj["buttons"]) {
			fn(key);
		}
		if (obj.modalType !== undefined) {
			ModalDiv.find(".modal-dialog").addClass(obj.modalType);
		}
		if (obj.modalWidth !== undefined) {
			ModalDiv.find(".modal-dialog").css("width", obj.modalWidth);
		}
		if (obj.css !== undefined) {
			ModalDiv.find(".modal-dialog").css(obj.css);
		}
		return ModalDiv.modal("show");
	};
	MB.Core.switchModal = function (options, cb) {
		var content, created, form, formI, i, inst, j, len, master, ref;
		if (options.isNewModal || options.isNew) {
			if (options.type === 'form') {
				ref = MB.Forms.forms;
				for (var i in ref) {
					formI = MB.Forms.forms[i];
					if (options.filename === formI.name && options.ids[0] === formI.activeId) {
						formI.modalInstance.setActive();
						if (typeof cb === 'function') {
							return cb(formI);
						}
					}
				}
			} else if (options.type === 'content') {
				for (i in MB.Contents.items) {
					inst = MB.Contents.items[i];
					if (options.filename === inst.name && options.params.activeId === inst.activeId && options.eternal) {
                        if (options.noExpand) inst.noExpand = options.noExpand;
						inst.modalInstance.setActive();
						inst.show();
                        if (options.noExpand) delete inst.noExpand;
						if (typeof cb === 'function') {
							return cb(inst);
						}
					}
				}
			}
		}
		if (options.isNewModal) {
			if (options.type === 'form') {
				form = new MB.FormN(options);
				form.create(function (instance) {
					console.log('Im HERE', instance);
					if (typeof cb === 'function') {
						return cb(instance);
					}
				});
			}
		}
		if (options.type) {
			if (options.type === "master" && options.filename) {
				master = new MB.Master(options);
				created = master.create(function (createdInstance) {
					if (typeof cb === 'function') {
						return cb(createdInstance);
					}
				});
				return created;
			}
			if (options.type === "content" && options.filename) {
				if (options.isNew) {
					content = new MB.ContentNew(options);
					created = content.create(function (createdInstance) {
						if (typeof cb === 'function') {
							return cb(createdInstance);
						}
					});
					return created;
				} else {
					if (MB.Modal.opened) {
						console.log("modal is opened");
						if (options.params.newerGuid != null) {
							console.log("options.params.newerGuid != null (" + options.params.newerGuid + ")");
							if (MB.Modal.loadedmodals.indexOf(options.params.newerGuid) > -1) {
								console.log("MB.Modal.loadedmodals.indexOf(options.params.newerGuid) > -1");
								MB.Modal.hide(MB.Modal.activemodal);
								MB.Modal.lastmodal = MB.Modal.activemodal;
								MB.Modal.activemodal = options.params.newerGuid;
								MB.Modal.show(options.params.newerGuid);
								return MB.Modal.activateitem(options.params.newerGuid);
							} else {
								console.log("not MB.Modal.loadedmodals.indexOf(options.params.newerGuid) > -1");
								content = new MB.Content({
									world: "modal",
									filename: options.filename,
									id: options.params.newerGuid,
									params: options.params
								});
								return content.create(function () {
									MB.Modal.hide(MB.Modal.activemodal);
									MB.Modal.activemodal = content.id;
									MB.Modal.show(content.id);
									MB.Modal.additem(content.id, options.type);
									MB.Modal.activateitem(content.id);
									MB.Modal.loadedmodals.push(content.id);
									MB.Modal.modalsqueue.push(content.id);
									MB.Modal.countmodals++;
									return content.init();
								});
							}
						} else {
							console.log("options.params.newerGuid == null");
							content = new MB.Content({
								world: "modal",
								filename: options.filename,
								id: MB.Core.guid(),
								params: options.params
							});
							return content.create(function () {
								MB.Modal.hide(MB.Modal.activemodal);
								MB.Modal.activemodal = content.id;
								MB.Modal.show(content.id);
								MB.Modal.additem(content.id, options.type);
								MB.Modal.activateitem(content.id);
								MB.Modal.loadedmodals.push(content.id);
								MB.Modal.modalsqueue.push(content.id);
								MB.Modal.countmodals++;
								return content.init();
							});
						}
					} else {
						console.log("modal was closed");
						return MB.Modal.open(function () {
							content = new MB.Content({
								world: "modal",
								filename: options.filename,
								id: MB.Core.guid(),
								params: options.params
							});
							return content.create(function () {
								MB.Modal.activemodal = content.id;
								MB.Modal.show(content.id);
								MB.Modal.additem(content.id, options.type);
								MB.Modal.activateitem(content.id);
								MB.Modal.loadedmodals.push(content.id);
								MB.Modal.modalsqueue.push(content.id);
								MB.Modal.countmodals++;
								return content.init();
							});
						});
					}
				}
			}
		}
	};
	MB.Core.makepagewrap = function (name) {
		return "<div id='page_" + name + "_wrapper' class='page-item' style='display:none'></div>";
	};
	MB.Core.makemodalwrap = function (name) {
		return "<div id='modal_" + name + "_wrapper' class='modal-item' style='display:none'></div>";
	};
	MB.Core.jsonToObj = function (obj) {
		var i, j, result = {},
			convert = function (d, n) {
				for (i in obj[d]) {
					result[i] = {};
					for (j in obj[n]) {
						result[i][obj[n][j]] = obj[d][i][j];
					}
				}
			};

		if (obj['DATA'] && obj['NAMES']) convert('DATA', 'NAMES');
		else if (obj['data']) {
			if (obj['data_columns']) convert('data', 'data_columns');
			else if (obj['names']) convert('data', 'names');
		} else result = obj;

		return result;
	};
	MB.Core.renderOrderPaymentType = function (obj) {
		var html;
		obj = MB.Core.jsonToObj(obj);
		html = "<div class=\"form_order_mini-content-wrapper\"></div> <div class=\"row\"> <div class=\"col-md-4 col-md-offset-8 StrOrderAmount\"> Мест " + obj[0]["COUNT_TO_PAY_TICKETS"] + " билетов " + obj[0]["TICKETS_COUNT"] + " на сумму <input value=\"" + obj[0]["TOTAL_ORDER_AMOUNT"] + "\" size=\"5\" disabled class=\"orderAmount\" /> <form class=\"formOrderMini\" role=\"form\"> <div class=\"form-group\"> <div class=\"left\"> <div id=\"btnOrderAmount_CASH\" class=\"btn blue pull-left btnOrderAmount\"><i class=\"fa fa-money\"></i></div> <div class=\"pull-left text\">Оплата наличными</div> </div> <input type=\"text\" class=\"pull-left\" id=\"\" name=\"CASH_AMOUNT\" placeholder=\"0\" size=\"5\" /> <div class=\"clearfix\"></div> </div> <div class=\"form-group\"> <div class=\"left\"> <div id=\"btnOrderAmount_CARD\" class=\"btn blue pull-left btnOrderAmount\"><i class=\"fa fa-credit-card\"></i></div> <div class=\"pull-left text\">Оплата банковской картой</div> </div> <input type=\"text\" class=\"pull-left\" id=\"\" name=\"CARD_AMOUNT\" placeholder=\"0\" size=\"5\"> <div class=\"clearfix\"></div> </div> <div class=\"form-group\"> <div class=\"left\"> <div id=\"btnOrderAmount_GIFT_CARD\" class=\"btn blue pull-left btnOrderAmount\"><i class=\"fa fa-gift\"></i> </div> <div class=\"pull-left text\">Оплата подарочной картой</div> </div> <input type=\"text\" class=\"pull-left\" id=\"\" name=\"GIFT_CARD_AMOUNT\" placeholder=\"0\" size=\"5\"> <div class=\"clearfix\"></div> </div> </form> </div> </div>";
		return html;
	};
	MB.Core.sendQueryForObj = function (o, callback) {
		return socketQuery(o, function (res) {
			var result = socketParse(res, false);
			if (result && typeof callback == 'function') callback(result);
		});
	};

	MB.Core.spinner = {
		start: function (container) {
			container.append('<div class="preloader"></div>');
		},
		stop: function (container) {
			container.find('.preloader').remove();
		}
	};

    MB.Core.fader = {
        start: function (container) {
            container.append('<div class="mb-fader"></div>');
        },
        stop: function (container) {
            container.find('.mb-fader').remove();
        }
    };

	MB.Core.xmlToJson = function (xml, tab) {
		var X = {
			toObj: function (xml) {
				var o = {};
				if (xml.nodeType == 1) {   // element node ..
					if (xml.attributes.length)   // element with attributes  ..
						for (var i = 0; i < xml.attributes.length; i++)
							o["@" + xml.attributes[i].nodeName] = (xml.attributes[i].nodeValue || "").toString();
					if (xml.firstChild) { // element has child nodes ..
						var textChild = 0, cdataChild = 0, hasElementChild = false;
						for (var n = xml.firstChild; n; n = n.nextSibling) {
							if (n.nodeType == 1) hasElementChild = true;
							else if (n.nodeType == 3 && n.nodeValue.match(/[^ \f\n\r\t\v]/)) textChild++; // non-whitespace text
							else if (n.nodeType == 4) cdataChild++; // cdata section node
						}
						if (hasElementChild) {
							if (textChild < 2 && cdataChild < 2) { // structured element with evtl. a single text or/and cdata node ..
								X.removeWhite(xml);
								for (var n = xml.firstChild; n; n = n.nextSibling) {
									if (n.nodeType == 3)  // text node
										o["#text"] = X.escape(n.nodeValue);
									else if (n.nodeType == 4)  // cdata node
										o["#cdata"] = X.escape(n.nodeValue);
									else if (o[n.nodeName]) {  // multiple occurence of element ..
										if (o[n.nodeName] instanceof Array)
											o[n.nodeName][o[n.nodeName].length] = X.toObj(n);
										else
											o[n.nodeName] = [o[n.nodeName], X.toObj(n)];
									}
									else  // first occurence of element..
										o[n.nodeName] = X.toObj(n);
								}
							}
							else { // mixed content
								if (!xml.attributes.length)
									o = X.escape(X.innerXml(xml));
								else
									o["#text"] = X.escape(X.innerXml(xml));
							}
						}
						else if (textChild) { // pure text
							if (!xml.attributes.length)
								o = X.escape(X.innerXml(xml));
							else
								o["#text"] = X.escape(X.innerXml(xml));
						}
						else if (cdataChild) { // cdata
							if (cdataChild > 1)
								o = X.escape(X.innerXml(xml));
							else
								for (var n = xml.firstChild; n; n = n.nextSibling)
									o["#cdata"] = X.escape(n.nodeValue);
						}
					}
					if (!xml.attributes.length && !xml.firstChild) o = null;
				}
				else if (xml.nodeType == 9) { // document.node
					o = X.toObj(xml.documentElement);
				}
				else
					alert("unhandled node type: " + xml.nodeType);
				return o;
			},
			toJson: function (o, name, ind) {
				var json = name ? ("\"" + name + "\"") : "";
				if (o instanceof Array) {
					for (var i = 0, n = o.length; i < n; i++)
						o[i] = X.toJson(o[i], "", ind + "\t");
					json += (name ? ":[" : "[") + (o.length > 1 ? ("\n" + ind + "\t" + o.join(",\n" + ind + "\t") + "\n" + ind) : o.join("")) + "]";
				}
				else if (o == null)
					json += (name && ":") + "null";
				else if (typeof(o) == "object") {
					var arr = [];
					for (var m in o)
						arr[arr.length] = X.toJson(o[m], m, ind + "\t");
					json += (name ? ":{" : "{") + (arr.length > 1 ? ("\n" + ind + "\t" + arr.join(",\n" + ind + "\t") + "\n" + ind) : arr.join("")) + "}";
				}
				else if (typeof(o) == "string")
					json += (name && ":") + "\"" + o.toString() + "\"";
				else
					json += (name && ":") + o.toString();
				return json;
			},
			innerXml: function (node) {
				var s = ""
				if ("innerHTML" in node)
					s = node.innerHTML;
				else {
					var asXml = function (n) {
						var s = "";
						if (n.nodeType == 1) {
							s += "<" + n.nodeName;
							for (var i = 0; i < n.attributes.length; i++)
								s += " " + n.attributes[i].nodeName + "=\"" + (n.attributes[i].nodeValue || "").toString() + "\"";
							if (n.firstChild) {
								s += ">";
								for (var c = n.firstChild; c; c = c.nextSibling)
									s += asXml(c);
								s += "</" + n.nodeName + ">";
							}
							else
								s += "/>";
						}
						else if (n.nodeType == 3)
							s += n.nodeValue;
						else if (n.nodeType == 4)
							s += "<![CDATA[" + n.nodeValue + "]]>";
						return s;
					};
					for (var c = node.firstChild; c; c = c.nextSibling)
						s += asXml(c);
				}
				return s;
			},
			escape: function (txt) {
				return txt.replace(/[\\]/g, "\\\\")
					.replace(/[\"]/g, '\\"')
					.replace(/[\n]/g, '\\n')
					.replace(/[\r]/g, '\\r');
			},
			removeWhite: function (e) {
				e.normalize();
				for (var n = e.firstChild; n;) {
					if (n.nodeType == 3) {  // text node
						if (!n.nodeValue.match(/[^ \f\n\r\t\v]/)) { // pure whitespace text node
							var nxt = n.nextSibling;
							e.removeChild(n);
							n = nxt;
						}
						else
							n = n.nextSibling;
					}
					else if (n.nodeType == 1) {  // element node
						X.removeWhite(n);
						n = n.nextSibling;
					}
					else                      // any other node
						n = n.nextSibling;
				}
				return e;
			}
		};
		if (xml.nodeType == 9) // document node
			xml = xml.documentElement;
		var json = X.toJson(X.toObj(X.removeWhite(xml)), xml.nodeName, "\t");
		return "{\n" + tab + (tab ? json.replace(/\t/g, tab) : json.replace(/\t|\n/g, "")) + "\n}";
	};

	MB.Core.createButtons = function (instance, selectedRows) {
		var _t = instance;
		var i = 0;
		var buttons = _t.lowerButtons;
		var buttonsWrap = (_t.container.find(".lower-buttons-wrapper").last().length > 0)? _t.container.find(".lower-buttons-wrapper").last() : _t.container.find(".upper-buttons-wrapper").last();
		var data = _t.data.data;

		var checkCondition = function (condition) {
			var i = 0;
			var item;
			var results = [];

			if (_t.data == "new") return false;
			for (var j = 0; j < condition.length; j++) {
				item = condition[j];
				if (item.colNames.length) {
					for (i = 0; i < item.colNames.length; i++) {
						var isCondition = true;
						var colName = item.colNames[i];
						var colValue = item.colValues[i];
						var matching = item.matching[i];


						for (var l = 0; l < Object.keys(data).length; l++) {
							var savedValue = data[l][colName];
							if (matching == "equal" || matching == "==") {
								if (savedValue !== colValue) {
									isCondition = false;
									break;
								}
							}
							else if (matching == "not_equal" || matching == "!=") {
								if (savedValue === colValue) {
									isCondition = false;
									break;
								}
							}
							else if (matching == '>') {
								if (savedValue <= colValue) {
									isCondition = false;
									break;
								}
							}
							else if (matching == '<') {
								if (savedValue >= colValue) {
									isCondition = false;
									break;
								}
							}
						}

						if (!isCondition) break;
					}
				}
				else isCondition = false;
				results.push(isCondition);
			}

			for (i = 0; i < results.length; i++) {
				item = results[i];
				if (item) return true;
			}

			return false;
		};
		var classByType = {
			SINGLE: "fn-btn fn-small-btn splicedRoundedBtn",
			DOUBLE: "nb btn btnDouble fn-lower-button"
		};
		var classByPosition = {
			RIGHT: "flRight",
			LEFT: "flLeft"
		};

		if (buttonsWrap.length && buttons) {
			if (selectedRows) {
				data = [];

				for (i = 0; i < selectedRows.length; i++) {
					data.push(_t.data.DATA[selectedRows[i]]);
				}
			}

			buttonsWrap.empty();
			for (i = 0; i < buttons.length; i++) {
				var button = buttons[i];
				var revertCondition = button.revert;
				var icon;
				var buttonElem = $("<div></div>");
				var buttonInner = $("<span></span>");
				buttonInner.addClass("buttonInner");
				buttonInner.html(button.title);
				buttonElem.addClass(classByType[button.type] + " " + button.color);
				if (button.position) buttonElem.addClass(classByPosition[button.position]);
				if (button.hidden) buttonElem.addClass("hidden");
				var cond = checkCondition(button.condition);
				console.log(cond, revertCondition);

				if (revertCondition && !cond || cond && !revertCondition) buttonElem.addClass("disabled");
				//if (!cond) buttonElem.addClass("disabled");

				else if (typeof button.handler === "function") buttonElem.on("click", button.handler);

				if (button.icon) {
					icon = $("<i></i>");
					icon.addClass("fa " + button.icon);
					buttonElem.append(icon);
				}

				buttonElem.append(buttonInner);
				buttonsWrap.append(buttonElem);
			}
		}
	};

	MB.Modal = {};
	MB.Modal.activemodal = null;
	MB.Modal.modalsqueue = [];
	MB.Modal.loadedmodals = [];
	MB.Modal.countmodals = 0;
	MB.Modal.opened = false;
	MB.Modal.$wrapper = $(".modal-content-wrapper");
	MB.Modal.$container = $(".bt-menu");
	MB.Modal.$modalslist = $(".modals-list");
	MB.Modal.itemsinit = function () {
		return MB.Modal.$modalslist.on("click", "li", function (e) {
			var $target, content, iscross, newObj, object, type;
			$target = $(e.target);
			object = $(this).data("object");
			type = $(this).data("type");
			iscross = $target.hasClass("cross");
			if (iscross) {
				if (MB.O.forms.hasOwnProperty(MB.Modal.activemodal)) {
					if (MB.O.forms[MB.Modal.activemodal].parentobject != null) {
						MB.O.tables[MB.O.forms[MB.Modal.activemodal].parentobject].reload("data");
					}
				}
				if (MB.Modal.countmodals === 1) {
					if (type === "content") {
						content = MB.Content.find(object);
						if (content.onClose != null) {
							content.onClose();
						}
					}
					MB.Modal.closefull();
					return MB.Modal.$modalslist.off("click");
				} else if (MB.Modal.countmodals > 1) {
					if (MB.Modal.activemodal !== object) {
						if (type === "content") {
							content = MB.Content.find(object);
							if (content.onClose != null) {
								content.onClose();
							}
						}
						MB.Modal.loadedmodals.splice(MB.Modal.loadedmodals.indexOf(object), 1);
						MB.Modal.modalsqueue.splice(MB.Modal.modalsqueue.indexOf(object), 1);
						if (MB.Modal.lastmodal === object) {
							MB.Modal.lastmodal = "closed";
						}
						MB.Modal.countmodals--;
						delete MB.O[type + "s"][object];
						return MB.Modal.remove(object);
					} else if (MB.Modal.activemodal === object) {
						if (MB.Modal.modalsqueue.indexOf(object) === (MB.Modal.countmodals - 1)) {
							MB.Modal.hide(MB.Modal.activemodal);
							MB.Modal.activemodal = MB.Modal.modalsqueue[MB.Modal.modalsqueue.indexOf(object) - 1];
							MB.Modal.show(MB.Modal.activemodal);
							MB.Modal.activateitem(MB.Modal.activemodal);
							newObj = MB.Content.find(MB.Modal.activemodal);
							if (newObj.type === "content") {
								if (newObj.onFocus != null) {
									newObj.onFocus();
								}
							}
							if (type === "content") {
								content = MB.Content.find(object);
								if (content.onClose != null) {
									content.onClose();
								}
							}
							MB.Modal.loadedmodals.splice(MB.Modal.loadedmodals.indexOf(object), 1);
							MB.Modal.modalsqueue.splice(MB.Modal.modalsqueue.indexOf(object), 1);
							MB.Modal.countmodals--;
							delete MB.O[type + "s"][object];
							return MB.Modal.remove(object);
						} else {
							MB.Modal.hide(MB.Modal.activemodal);
							MB.Modal.activemodal = MB.Modal.modalsqueue[MB.Modal.modalsqueue.indexOf(object) + 1];
							MB.Modal.show(MB.Modal.activemodal);
							MB.Modal.activateitem(MB.Modal.activemodal);
							newObj = MB.Content.find(MB.Modal.activemodal);
							if (newObj.type === "content") {
								if (newObj.onFocus != null) {
									newObj.onFocus();
								}
							}
							if (type === "content") {
								content = MB.Content.find(object);
								if (content.onClose != null) {
									content.onClose();
								}
							}
							MB.Modal.loadedmodals.splice(MB.Modal.loadedmodals.indexOf(object), 1);
							MB.Modal.modalsqueue.splice(MB.Modal.modalsqueue.indexOf(object), 1);
							MB.Modal.countmodals--;
							delete MB.O[type + "s"][object];
							return MB.Modal.remove(object);
						}
					}
				}
			} else {
				if (type === "content") {
					content = MB.Content.find(object);
					if (content.onFocus != null) {
						if (MB.Modal.activemodal !== object) {
							MB.Modal.hide(MB.Modal.activemodal);
							MB.Modal.activemodal = object;
							MB.Modal.show(object);
							MB.Modal.activateitem(object);
							return content.onFocus();
						}
					} else {
						MB.Modal.hide(MB.Modal.activemodal);
						MB.Modal.activemodal = object;
						MB.Modal.show(object);
						return MB.Modal.activateitem(object);
					}
				} else {
					if (MB.Modal.activemodal !== object) {
						MB.Modal.hide(MB.Modal.activemodal);
						MB.Modal.activemodal = object;
						MB.Modal.show(object);
						return MB.Modal.activateitem(object);
					}
				}
			}
		});
	};
	MB.Modal.closefull = function () {
		var i, key, l;
		if ($("#modal_" + MB.Modal.activemodal + "_wrapper .edited").length > 0) {
			return bootbox.dialog({
				message: "Вы уверены что хотите выйти из формы не сохранив изменения?",
				title: "Есть не сохраннные изменения",
				buttons: {
					success: {
						label: "Да",
						assName: "green",
						callback: function () {
							var i, key, l;
							i = 0;
							l = MB.Modal.modalsqueue.length;
							while (i < l) {
								for (key in MB.O) {
									if (MB.O[key].hasOwnProperty(MB.Modal.modalsqueue[i])) {
										delete MB.O[key][MB.Modal.modalsqueue[i]];
									}
								}
								i++;
							}
							MB.Modal.$wrapper.empty();
							MB.Modal.$modalslist.empty();
							MB.Modal.loadedmodals = [];
							MB.Modal.modalsqueue = [];
							MB.Modal.activemodal = null;
							MB.Modal.countmodals = 0;
							classie.remove(document.getElementById("bt-menu"), "bt-menu-open");
							return MB.Modal.opened = false;
						}
					},
					danger: {
						label: "Нет",
						className: "red",
						callback: function () {
						}
					}
				}
			});
		} else {
			i = 0;
			l = MB.Modal.modalsqueue.length;
			while (i < l) {
				for (key in MB.O) {
					if (MB.O[key].hasOwnProperty(MB.Modal.modalsqueue[i])) {
						delete MB.O[key][MB.Modal.modalsqueue[i]];
					}
				}
				i++;
			}
			MB.Modal.$wrapper.empty();
			MB.Modal.$modalslist.empty();
			MB.Modal.loadedmodals = [];
			MB.Modal.modalsqueue = [];
			MB.Modal.activemodal = null;
			MB.Modal.countmodals = 0;
			classie.remove(document.getElementById("bt-menu"), "bt-menu-open");
			return MB.Modal.opened = false;
		}
	};
	MB.Modal.open = function (callback) {
		classie.add(document.getElementById("bt-menu"), "bt-menu-open");
		MB.Modal.opened = true;
		MB.Modal.itemsinit();
		return setTimeout(callback(), 350);
	};
	MB.Modal.remove = function (name) {
		MB.Modal.$wrapper.find("#modal_" + name + "_wrapper").remove();
		return MB.Modal.$container.find(".modals-list").find("[data-object='" + name + "']").remove();
	};
	MB.Modal.hide = function (name) {
		return MB.Modal.$wrapper.find("#modal_" + name + "_wrapper").hide();
	};
	MB.Modal.close = function (name) {
		$("#modal_" + name + "_wrapper .edited").length > 0;
		MB.Modal.remove(name);
		MB.Modal.activemodal = MB.Modal.modalsqueue[MB.Modal.modalsqueue.indexOf(name) - 1];
		MB.Modal.show(MB.Modal.activemodal);
		MB.Modal.activateitem(MB.Modal.activemodal);
		return MB.Modal.countmodals--;
	};
	MB.Modal.show = function (name) {
		return MB.Modal.$wrapper.find("#modal_" + name + "_wrapper").show();
	};
	MB.Modal.additem = function (name, type) {
		var html, object;
		object = MB.O[type + "s"][name];
		html = "<li data-type='" + type + "' data-object='" + (object.id || object.name) + "'><i class='cross fa fa-times-circle'></i>" + (object.label || object.filename || object.profile.general.objectname || object.profile.general.tablename) + "</li>";
		return MB.Modal.$container.find(".modals-list").append(html);
	};
	MB.Modal.activateitem = function (name) {
		MB.Modal.$modalslist.find(".activateitem").removeClass(".activeitem");
		return MB.Modal.$modalslist.find("[data-object='" + name + "']").addClass("activeitem");
	};
})();

(function () {

//	socketParse(res, {
//		done: function(obj){обработка результатов},
//		fail: function(err, obj){обработка ошибок},
//		always: function(){выполняется в любом случае},
//		dontConvert: false
//	});
//
//	или
//
//	socketParse(
// 		res,
//		function (obj) {обработка результатов},
// 		function (err, obj) {обработка ошибок}
//	)
//
//	или
//
//	socketParse(res)

	var jsonToObj = function (obj, subData, names, profile) {
		var i, j, l, result = [],
			convert = function (data, name) {
				for (i in obj[data]) {
					result[i] = {};
					if(profile){
						for (l = 0; l < profile.length; l++) {
							for (j in obj[name]) {
								if(obj[name][j] == profile[l]['column_name']) {
									result[i][obj[name][j]] = obj[data][i][j];
									break;
								}
							}
						}
					}
					else {
						for (j in obj[name]) {
							result[i][obj[name][j]] = obj[data][i][j];
						}
					}
				}
				if (subData) result = {data: result};
				for (i in obj) {
					if (i != data && (i != name || names)) {
						if(profile && i == 'data_columns'){
							result[i] = [];
							for (l = 0; l < profile.length; l++) {

								for (j in obj[i]) {
									if(obj[i][j] == profile[l]['column_name']) {
										result[i][l] = obj[i][j];
										break;
									}
								}

								if(!result[i][l]) {
									profile.splice(l, 1);
									l--;
								}
							}
						}
						else result[i] = obj[i];
					}
				}
			};

		if (obj['data'] && obj['names']) convert('data', 'names');
		else if (obj['data']) {
		} else result = obj;

		if (obj['data_columns']) convert('data', 'data_columns');
		else if (obj['names']) convert('data', 'names');

		return result;
	};

	window.socketParse = function (res, obj, err) {
		var error = {title: 'Ошибка', message: ''};
		var parsedRes, resultRes;

		//if (typeof res == 'object') {
		//	if (res.data) parsedRes = {results: [res]};
		//	else parsedRes = res;
		//}
		//else try {
		//	parsedRes = JSON.parse(res);
		//} catch (e) {
		//	error.message = 'Не удалось распарсить ответ сервера';
		//	console.log('Не удалось распарсить ответ сервера: ', res);
		//}

		if (parsedRes ) { //&& parsedRes.results && parsedRes.results[0]
			var r = parsedRes;//.results[0];
			if (!+r.code) { //если код === '0' или undefined
				if (obj === false || (obj && obj.dontConvert)) {
					resultRes = parsedRes.results[0];
				} else {
					try {
						var subData = (obj && obj.subData),
							names = (obj && obj.names),
							profile = (obj && obj.profile);
						resultRes = jsonToObj(r, subData, names, profile);
					} catch (e) {
						error.message = 'Сервер не вернул ошибки, но нам не удалось задать соответствия между колонками и строками в ответе, возможно объект нестандартный';
						console.log(r);
					}
				}
			} else {
				error.title = r.toastr.title || error.title;
				error.message = r.toastr.message || 'Ошибка сервера № ' + r.code;
			}
		}
		if (error.message) {
			if (obj && (typeof obj.fail == 'function' || typeof obj.error == 'function')) {
				if (typeof obj.fail == 'function') obj.fail(parsedRes, res);
				else obj.error(parsedRes, res);
			} else if (typeof err == 'function') {
				err(error, parsedRes);
			} else if (!(obj && obj.noToastr)) {
				if (toastr && typeof toastr['error'] == 'function') toastr['error'](error.message, error.title);
				else console.log(error.title, error.message);
			}
		} else if (resultRes) {
			if (typeof obj == 'function') {
				obj(resultRes);
			} else if (obj && (typeof obj.done == 'function' || typeof obj.success == 'function')) {
				if (typeof obj.done == 'function') obj.done(resultRes);
				else obj.success(resultRes);
				obj.done(resultRes);
			} else if (parsedRes.results && parsedRes.results[0] && parsedRes.results[0].toastr && !(obj && obj.noToastr)) {
				var r = parsedRes.results[0];
				if (toastr && typeof toastr['success'] == 'function') toastr[r.toastr.type || 'success'](r.toastr.message || '', r.toastr.title || '');
			}
		}

		if (obj && typeof obj.always == 'function') {
			obj.always(resultRes);
		}
		return resultRes;
	};
	window.objLen = function (obj) {
		var cnt = 0;
		for (var i in obj) if (obj.hasOwnProperty(i)) cnt++;
		return cnt;
	};
}());


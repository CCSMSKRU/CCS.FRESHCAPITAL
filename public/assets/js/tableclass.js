MBOOKER.Classes.Table = function (area, obj) {
	var language 				= $.cookie("language");
	var settings 				= MBOOKER.Settings.tablesSettings[obj.subcommand];
	this.area 					= area;
	this.language 				= $.cookie("language");
	this.columnNames 	 		= settings["columnNames" + language];
	this.tableName 				= settings["tableName" + language];
	this.columnNamesDb 			= settings.columnNamesDb;
	this.maxNumberRowsDisplayed = obj.maxNumberRowsDisplayed || settings.maxNumberRowsDisplayed;
	this.numberOfColumns		= settings.numberOfColumns;
	this.pageNumber			    = obj.pageNumber || settings.pageNumber;
	this.sortBy 				= obj.sortBy || settings.sortBy;
	this.subcommand 			= settings.subcommand;
	this.typesOfEditors 		= settings.typesOfEditors;
	this.visibilityOfColumns 	= obj.visibilityOfColumns || settings.visibilityOfColumns;
	this.editableMode 			= obj.editableMode; 			
	this.readOnly 				= obj.readOnly; 				
	this.CRUDMode 				= settings.CRUDMode; 					
	this.AddEditAtTheSameTime 	= obj.AddEditAtTheSameTime; 
	this.primaryKey 			= settings.primaryKey;	
	this.sources 				= settings.sources;	
	this.sourcesRequiredColumns = settings.sourcesRequiredColumns;
	this.hasEditTranslates		= settings.hasEditTranslates;
	this.editTranslates 		= settings.editTranslates;
	this.data 					= null;
	this.info 					= null;
	this.totalNumberOfRows 		= null;
	this.editingCache			= {};
	$("." + this.area + "-content-wrapper").append(MBOOKER.Fn.createWrapperHTML(area, "table", obj.subcommand));
};

MBOOKER.Classes.Table.prototype.getInitData = function (callback) {
	var o = {
		"sid": 			MBOOKER.UserData.sid,
		"command": 		"get",
		"subcommand": 	this.subcommand,
		"PAGE_NO": 		this.pageNumber,
		"ROWS_MAX_NUM": this.maxNumberRowsDisplayed,
		"ORDER_BY": 	this.sortBy
	};
	MBOOKER.Fn.sendQuery(o, function (response) {
		callback(response);
	}); 
};

MBOOKER.Classes.Table.prototype.init = function (callback) {
	var _this = this;
	this.getInitData(function (response) {
		_this.update(response);
		_this.render();
		_this.handleEvents();
		callback();
	});
};

MBOOKER.Classes.Table.prototype.update = function (response) {
	var _this = this;
	this.data 				= response.DATA;
	this.info 				= response.INFO || null;
	this.totalNumberOfRows 	= response.INFO.ROWS_COUNT;
	if (response.NAMES.length !== this.numberOfColumns) {
		toastr.error("Количество полей из базы не совпадает с количеством полей в tablesSettings (response.NAMES.length = " + response.NAMES.length + "; _this.numberOfColumns = " + _this.numberOfColumns + ")", "MBOOKER.Classes.Table.prototype.update");
	}	
};

MBOOKER.Classes.Table.prototype.render = function () {
	var _this = this;
	var html = "";
	html += '<div class="row"><div class="col-md-12"><div class="portlet box blue"><div class="portlet-title"><div class="caption"><i class="fa fa-globe"></i>' + this.tableName + '</div><div class="tools"><a href="javascript:;" class="collapse"></a><a href="#portlet-config" data-toggle="modal" class="config"></a><a href="javascript:;" class="reload"></a><a href="javascript:;" class="remove"></a></div></div><div class="portlet-body"><div class="table-scrollable">';
	html += '<table class="table table-striped table-bordered table-hover" id="' + this.subcommand + '_table"><thead><tr>'; 
	for (var i = 0; i < this.numberOfColumns; i++) {
		var visibility = "";
		if (this.visibilityOfColumns[i]) {
			visibility = "visible";
		} else {
			visibility = "hidden";
		}
		html += '<th data-coldbname="' + this.columnNamesDb[i] + '" data-colvisibilitystatus="' + visibility + '">' + this.columnNames[i] + '</th>';
	}
	html += '</tr></thead><tbody>';	
	if (this.totalNumberOfRows > this.maxNumberRowsDisplayed) {
		for (var i = 0; i < this.maxNumberRowsDisplayed; i++) {
			var o = {
				subcommand: 			this.subcommand,
				numberOfCells: 			this.numberOfColumns,
				data: 					this.data[i],
				visibilityOfCells: 		this.visibilityOfColumns,
				typesOfEditors: 		this.typesOfEditors,
				columnNamesDb:			this.columnNamesDb,
				primaryKey: 			this.primaryKey
			};
			var row = new MBOOKER.Classes.Row(o);
			MBOOKER.Pages.pages.tables[this.subcommand].rows[i] = row;
			html += row.render();	
		};
	} else {
		for (var i = 0; i < this.totalNumberOfRows; i++) {
			var o = {
				subcommand: 			this.subcommand,
				numberOfCells: 			this.numberOfColumns,
				data: 					this.data[i],
				visibilityOfCells: 		this.visibilityOfColumns,
				typesOfEditors: 		this.typesOfEditors,
				columnNamesDb:			this.columnNamesDb,
				primaryKey: 			this.primaryKey
			};
			var row = new MBOOKER.Classes.Row(o);			
			MBOOKER.Pages.pages.tables[this.subcommand].rows[i] = row;
			html += row.render();	
		};
	}
	html += '</tbody></table></div>';
	html 	+= '<div class="btn-group">' 
			+ '<button type="button" class="btn btn-default ' + this.subcommand + '_table_bottom_toolbar_create_button"><i class="fa fa-user"></i> Создать</button>' 
			+ '<button type="button" class="btn btn-default ' + this.subcommand + '_table_bottom_toolbar_edit_button"><i class="fa fa-cogs"></i> Редактировать</button>' 
			+ '<button type="button" class="btn btn-default ' + this.subcommand + '_table_bottom_toolbar_save_button"><i class="fa fa-bullhorn"></i> Сохранить</button>' 
			+ '<button type="button" class="btn btn-default ' + this.subcommand + '_table_bottom_toolbar_restore_button"><i class="fa fa-cogs"></i> Отменить</button>' 
			+ '<button type="button" class="btn btn-default ' + this.subcommand + '_table_bottom_toolbar_delete_button"><i class="fa fa-cogs"></i> Удалить</button>' 
			+ '<button type="button" class="btn btn-default ' + this.subcommand + '_table_bottom_toolbar_modal_button"><i class="fa fa-cogs"></i> Открыть выбранные строки в модалке</button>'
			+ '<div class="btn-group"><button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown"><i class="fa fa-ellipsis-horizontal"></i> Доступные переходы в модалки <i class="fa fa-angle-down"></i></button><ul class="dropdown-menu">';
	if (this.sources) {
		for (var i = 0; i < this.sources.length; i++) {
			if (this.sources[i]) {
				html += "<li><a href='#' class='open-table-in-modal' data-subcommand='" + this.sources[i] + "'>" + MBOOKER.Settings.tablesSettings[this.sources[i]]["tableName" + this.language] + "</a></li>";
			}			
		}
	}
	html += '</ul></div></div></div></div></div></div>';
	html += '</tbody></table></div></div>';
	if (this.area === "page") {
		$("#page_" + MBOOKER.Pages.typeOfActivePage + "_" + MBOOKER.Pages.activePage + "_wrapper").hide();
	} else if (this.area === "modal") {
		$("#modal_" + MBOOKER.Modals.typeOfActiveModal + "_" + MBOOKER.Modals.activeModal + "_wrapper").hide();
	}
	$("#" + this.area + "_table_" + this.subcommand + "_wrapper").html(html);
	$("#" + this.area + "_table_" + this.subcommand + "_wrapper").show();
};

MBOOKER.Classes.Table.prototype.saveRows = function () {
	var _this = this;
	for (var key in this.editingCache) {
		MBOOKER.Fn.sendQuery(_this.editingCache[key], function (response) {
			if (response.RC === 0) {				
				_this.reload();
				_this.editingCache = {};
				toastr.success("Сохранение прошло успешно, RC = 0, MESSAGE = " + response.MESSAGE, "MBOOKER.Classes.Table.prototype.saveRows");
			}
		});
	}
};

MBOOKER.Classes.Table.prototype.editRows = function () {
	var _this = this;
	$("#" + this.subcommand + "_table tbody tr.selected-row").each(function (i, el) {
		$(this).addClass("editing");
		$(el).find("a").each(function (i2, el2) {
			var editor = $(this).data("type");
			if (editor === "select") {
				var o = {
					"command": "get",
					"subcommand": _this.sources[3],
					"sid": MBOOKER.UserData.sid,
					"columns": _this.sourcesRequiredColumns[3],
					"order_by": "ADDR_ID",
					"rows_max_num": _this.maxNumberRowsDisplayed,
					"page_no": _this.pageNumber
				};
				MBOOKER.Fn.sendQuery(o, function (response) {
					var s = [];
					if (response.DATA.length < _this.maxNumberRowsDisplayed) {
						for (var i = 0; i < response.DATA.length; i++) {
							var obj = {value: response.DATA[i][0], text: response.DATA[i][1]};
							s.push(obj);
						}
					} else {
						for (var i = 0; i < _this.maxNumberRowsDisplayed; i++) {
							var obj = {value: response.DATA[i][0], text: response.DATA[i][1]};
							s.push(obj);
						}
					}
					$(el2).editable({
						source: s,
						prepend: "...",
						showbuttons: false,
						success: function(response, newValue) {
							var column = $(el2).data("column");
							var row = $(el2).data("row");
							if (_this.hasEditTranslates) {
								if (_this.editingCache.hasOwnProperty(row)) {
									_this.editingCache[row][_this.editTranslates[column]] = newValue;
								} else {
									_this.editingCache[row] = {
										"command": "modify",
										"subcommand": _this.subcommand,
										"sid": MBOOKER.UserData.sid
									};
									_this.editingCache[row]["OBJVERSION"] = $(el2).parent().parent().find(".OBJVERSION").text();
									_this.editingCache[row][_this.primaryKey] = row;
									_this.editingCache[row][_this.editTranslates[column]] = newValue;
								}						        	
							} else {}
					    },
					});
				});
			} else if (editor === "textarea") {
				$(el2).editable({
					placeholder: "Нет данных",
					rows: 3,
					onblur: "submit",
					showbuttons: false
				});
			} else if (editor === "text") {
				$(el2).editable({
					clear: true,
					placeholder: "Нет данных",
					// onblur: "ignore",
					showbuttons: false,
					success: function (response, newValue) {
						var column = $(el2).data("column");
						var row = $(el2).data("row");
						if (_this.editingCache.hasOwnProperty(row)) {
							_this.editingCache.row[column] = newValue;
						} else {
							_this.editingCache[row] = {
								"command": "modify",
								"subcommand": _this.subcommand,
								"sid": MBOOKER.UserData.sid
							};
							_this.editingCache[row]["OBJVERSION"] = $(el2).parent().parent().find(".OBJVERSION").text();
							_this.editingCache[row][_this.primaryKey] = row;
							_this.editingCache[row][column] = newValue;
						}						        	
					}
				});
			}
		});
	});
};

MBOOKER.Classes.Table.prototype.reload = function () {
	var _this = this;
	this.getInitData(function (responsingData) {
		_this.update(responsingData);
		_this.render();
		_this.handleEvents();
	});
};

MBOOKER.Classes.Table.prototype.handleEvents = function () {
	var _this = this;	
	if (this.primaryKey.length === 1) {
		$("#" + _this.subcommand + "_table a").on("click", function (e) {
			e.preventDefault();
		});
		if (this.CRUDMode === "oneline") {} 
		else { // "multiline"
			$("#" + _this.subcommand + "_table").on("click", "tbody tr", function() {
				if (!$(this).hasClass("editing")) {
					$(this).toggleClass("selected-row");
				} else {
					
				}
			});
			$("." + _this.subcommand + "_table_bottom_toolbar_edit_button").on("click", function () {
				_this.editRows();
			});	
			$("." + _this.subcommand + "_table_bottom_toolbar_save_button").on("click", function () {
				_this.saveRows();
			});
			$("." + _this.subcommand + "_table_bottom_toolbar_modal_button").on("click", function () {
				var s = $("#" + _this.subcommand + "_table .selected-row")[0];
				if (s !== undefined) {
					var arrayOfIds = [];
					$("#" + _this.subcommand + "_table .selected-row").each(function (i, el) {
						var id = $(el).find("." + _this.primaryKey[0]).text();
						arrayOfIds.push(id);
					});
					var o = {
						subcommand: _this.subcommand,
						ids: arrayOfIds,
						type: "form"
					}; 
					modal_show(o);
				} else {
				}				
			});
		}
	} else {
		alert("primaryKey.length !== 1")
	}	
	$("#" + _this.subcommand + "_table_wrapper .open-table-in-modal").on("click", function (e) {
		e.preventDefault();
		var subcommand = $(this).data("subcommand");
		alert("Здесь откроется таблица в модалке");
	});	
};

MBOOKER.Classes.Table.prototype.reload = function () {
	var _this = this;
	this.getInitData(function (responsingData) {
		_this.update(responsingData);
		_this.render();
		_this.handleEvents();
	});
};

MBOOKER.Classes.Table.prototype.showTable = function () {
	if (this.area === "page") {
		$("#page_" + MBOOKER.Pages.typeOfActivePage + "_" + MBOOKER.Pages.activePage + "_wrapper").hide();
	} else if (this.area === "modal") {
		$("#modal_" + MBOOKER.Modals.typeOfActiveModal + "_" + MBOOKER.Modals.activeModal + "_wrapper").hide();
	}
	$("#" + this.area + "_table_" + this.subcommand + "_wrapper").show();
};



			// $("#" + _this.subcommand + "_table").on("click", "tbody tr", function() {
			// 	if ($(this).hasClass("selected-row")) {
			// 		return;
			// 	} else {
			// 		$("#" + _this.subcommand + "_table .selected-row").find("a").each(function (i, el) {
			// 			$(el).editable("disable");
			// 		});
			// 		$("#" + _this.subcommand + "_table .selected-row").removeClass("selected-row");
			// 		$(this).addClass("selected-row");
			// 	}
			// });
			// $("." + _this.subcommand + "_table_bottom_toolbar_edit_button").on("click", function () {
			// 	_this.editRow();
			// });	
			// $("." + _this.subcommand + "_table_bottom_toolbar_modal_button").on("click", function () {
			// 	var s = $("#" + _this.subcommand + "_table .selected-row")[0];
			// 	if (s !== undefined) {
			// 		var id = $("#" + _this.subcommand + "_table .selected-row").find("." + _this.primaryKey[0]);
			// 		var o = {
			// 			subcommand: _this.subcommand,
			// 			ids: [id],
			// 			type: "form"
			// 		}; 
			// 		modal_show(o);
			// 	} else {
			// 	}
			// });	

// MBOOKER.Classes.Table.prototype.editRow = function () {

// 	var _this = this;

// 	$("#" + this.subcommand + "_table tbody tr.selected-row").find("a").each(function (i, el) {

// 		var editor = $(this).data("type");

// 		if (editor === "select") {
// 			$(this).editable({
// 				source: [{id: 1, text: "text1"}, {id: 2, text: "text2"}],
// 				success: function(response, newValue) {
// 			        alert(newValue);
// 			    }
// 			});
// 		}

// 	});

// };
// var _this = this;
// if (this.rowsMultiInlineWorking === true) {

// } else {
// 	// $("." + this.subcommand + "_table_bottom_toolbar_create_button").on("click", function () {
// 	// 	_this.addRow();
// 	// });	
// 	// $("." + this.subcommand + "_table_bottom_toolbar_restore_button").on("click", function () {
// 	// 	_this.restoreRow();
// 	// });	
// 	// $("." + this.subcommand + "_table_bottom_toolbar_save_button").on("click", function () {
// 	// 	_this.saveRow();
// 	// });\
// 	$("." + this.subcommand + "_table_bottom_toolbar_edit_button").on("click", function () {
// 		_this.editRow();
// 	});	
// }
// $("#" + this.subcommand + "_table").on("click", "tbody tr", function() {
// 	if ($(this).hasClass("selected-row")) {

// 	} else {
// 		$(".selected-row").find("a").editable("destroy");
// 		$(".selected-row").removeClass("selected-row");
// 		$(this).addClass("selected-row");
// 	}
	
// 	// if ($(this).hasClass("adding-row")) {
// 	// 	return;
// 	// } else {
// 	// 	$(this).toggleClass("selected-row");
// 	// }
// });

// MBOOKER.Classes.Table.prototype.generateInputHtml = function (iterNum) {
// 	var _this = this;
// 	var editorType = this.colsEditorType[iterNum];
// 	if (editorType === "input-text") {
// 		return '<input type="text" data-dbname="' + this.dbColsNames[iterNum] + '" class="form-control input-for-value simple-input" data-inputstatus="adding">';
// 	} else if (editorType === "select-with-search") {
// 		return '<div class="input-group"><span class="input-group-addon"><i class="fa fa-user"></i></span><div class="select-with-search-wrapper"><div class="always-visible-area"><div class="open-select-block form-control value-is-here" data-value=""><div class="open-select-block-dropdown-arrow-wrapper"><span class="arrow"></span></div></div></div><div class="hidden-area"><div class="searcher-wrapper"><input type="text" class="searcher form-control"></div><div class="select-list-wrapper"><ul class="select-list" data-col-select-subcommand="' + _this.colsSelectSubcommands[iterNum] + '"></ul></div></div></div></div>';
// 	}
// };

// MBOOKER.Classes.Table.prototype.handleMonoAddingEvents = function () {
// 	var _this = this;
// 	$("." + this.subcommand + "-adding-row .simple-input").on("keyup", function () {
// 		$(this).addClass("notsaved");
// 	});
// 	$("#" + this.subcommand + "_table .select-with-search-wrapper").on("click", ".open-select-block", function () {
// 		var $hiddenArea = $(this).parent().parent().find(".hidden-area");
// 		$hiddenArea.show();
// 		var thisColSelectSubcommand = $hiddenArea.find(".select-list").data("col-select-subcommand");
// 		var o = {
// 			subcommand: thisColSelectSubcommand, 
// 			command: "get", 
// 			sid: MBOOKER.sid
// 		};
// 		MBOOKER.Fn.sendQuery(o, function (res) {
// 			var html = "";
//  			for (var i = 0; i < res.DATA.length; i++) {
//  			 	html += "<li>" + res.DATA[i][1] + "</li>";
//  			}
//  			$("#" + _this.subcommand + "_table .select-with-search-wrapper .select-list").html(html);
//   		});
// 	});
// };

// MBOOKER.Classes.Table.prototype.addRow = function () {
// 	var _this = this;
// 	var html = "";
// 	if ($("#" + this.subcommand + "_table tbody tr:first-child").hasClass("adding-row")) {
// 		return;
// 	} else {
// 		html += "<tr class='" + this.subcommand + "-adding-row adding-row'>";
// 		for (var i = 0; i < this.colsNum; i++) {
// 			if (this.colsVisibilityStatuses[i] === "visible") {
// 				if (this.colsEditingStatuses[i] === true) {
// 					html += '<td data-visibilitystatus="visible">';
// 					html += (this.generateInputHtml(i));
// 					html += '</td>';
// 				} else {
// 					html += '<td data-visibilitystatus="visible"></td>';
// 				}
// 			} else {
// 				html += '<td data-visibilitystatus="hidden"></td>'; 
// 			}
// 		}
// 		html += "</tr>";
// 		$("#" + this.subcommand + "_table").find("tbody").prepend(html);
// 		this.handleMonoAddingEvents();
// 	}
// };



// MBOOKER.Classes.Table.prototype.restoreRow = function () {
// 	var _this = this;
// 	if ($("#" + this.subcommand + "_table tbody tr:first-child").hasClass("adding-row")) {
// 		$("#" + this.subcommand + "_table .adding-row").remove();
// 	} else {
// 		return;
// 	}
// };

// MBOOKER.Classes.Table.prototype.saveRow = function () {
// 	var _this = this;
// 	var o = {};
// 	o.sid = MBOOKER.sid;
// 	o.subcommand = _this.subcommand;
// 	o.command = "new";
// 	$("#" + this.subcommand + "_table .adding-row .input-for-value").each(function (i, el) {
// 		o[$(this).data("dbname")] = $(this).val();
// 	});
// 	MBOOKER.Fn.sendQuery(o, function (response) {
// 		if (response.RC === 0) {
// 			console.log("Все отлично, RC = " + response.RC + ", MESSAGE = " + response.MESSAGE);
// 			_this.reload();
// 		} else {
// 			alert("Ошибка, RC = " + response.RC + ", MESSAGE = " + response.MESSAGE);
// 		}
// 	});
// };



	// var subcommand = this.subcommand;
	// var _this = this;
	// var cellsNum = 4;
	// var input = document.createElement("INPUT");
	// input.className = "form-control";
	// var colsVisibilityStatuses = this.colsVisibilityStatuses;
	// var colsEditingStatuses = this.colsEditingStatuses;
	// console.log(colsVisibilityStatuses);
	// $("." + subcommand + "_table_bottom_toolbar_create_button").on("click", function () {
	// 	var $tbody = $("#" + subcommand + "_table tbody");
	// 	var tr = document.createElement("TR");
	// 	for (var i = 0; i < cellsNum; i++) {
	// 		console.log(i);
	// 		var td = document.createElement("TD");
	// 		if (colsVisibilityStatuses[i] === "visible") {
	// 			td.appendChild(input);
	// 		}
	// 		tr.insertBefore(td, tr.firstChild);
	// 		// tr.appendChild(td);
	// 	};
	// 	$tbody.prepend(tr);
	// });



	// html += '<th class="table-checkbox"><div class="checker"><span><input type="checkbox" class="group-checkable" data-set="#sample_' + link.counter + ' .checkboxes"/></span></div></th>';



	// html += '<div class="table-toolbar"><div class="btn-group"><button id="sample_editable_' + this.counter + '_new" class="btn green">Add New <i class="fa fa-plus"></i></button></div><div class="btn-group pull-right"><button class="btn dropdown-toggle" data-toggle="dropdown">Tools <i class="fa fa-angle-down"></i></button><ul class="dropdown-menu pull-right"><li><a href="#">Print</a></li><li><a href="#">Save as PDF</a></li><li><a href="#">Export to Excel</a></li></ul></div></div>'; // TABLE TOOLBAR








// var TableClass = function (options) {

// 	var _this = this;
// 	this.colNum = 0;
// 	this.$root = $("#" + options.subcommand);
// 	this.$tbody = null;
// 	this.$thead = null;

// 	this.command = options.command;
// 	this.data = null;
// 	this.pageNo = options.pageNo;
// 	this.rowsNum = options.rowsNum
// 	this.sid = options.sid;
// 	this.subcommand = options.subcommand;
// 	this.where = options.where;
// 	this.where = options.where;
// 	this.colNames = [];

// 	this.loadData = (function (options) {
// 		var needsProperties = {
// 			command: "get",
// 			orderBy: options.orderBy,
// 			pageNo: options.pageNo,
// 			params: options.params,
// 			rowsNum: options.rowsNum,
// 			sid: options.sid,
// 			subcommand: options.subcommand,
// 			where: options.where
// 		};
// 		var url = "http://192.168.1.101/cgi-bin/b2c?p_xml=" + MBOOKER.obj2XML(needsProperties);
// 		$.ajax({
// 			url: url,
// 			async: false,
// 			dataType: "json",
// 			type: "GET",
// 		}).done(function (data) {
// 			// console.log(data);
// 			_this.data = data;
// 		});
// 	}(options));

// 	this.reloadData = function (options, callback) {
// 		console.log("reloadData running");
// 		var needsProperties = {
// 			command: "get",
// 			orderBy: options.orderBy,
// 			pageNo: options.pageNo,
// 			params: options.params,
// 			rowsNum: options.rowsNum,
// 			sid: options.sid,
// 			subcommand: options.subcommand,
// 			where: options.where
// 		};
// 		var url = "http://192.168.1.101/cgi-bin/b2c?p_xml=" + MBOOKER.obj2XML(needsProperties);
// 		$.ajax({
// 			url: url,
// 			async: true,
// 			dataType: "json",
// 			type: "GET",
// 		}).done(function (data) {
// 			// console.log(data);
// 			_this.data = data;
// 		});
// 		callback();
// 	};

// 	this.renderHtml = function () {
// 		console.log("renderHtml running");
// 		var TABLE = document.createElement("TABLE");
// 		TABLE.className = _this.subcommand + "_table";
// 		TABLE.setAttribute("border", 1);
// 		var THEAD = document.createElement("THEAD");
// 		var TBODY = document.createElement("TBODY");    
// 	    var THEAD_TR = document.createElement("TR");
//     	for (var i in _this.data.ROWSET[0]) {
//     		var THEAD_TH = document.createElement("TH");
//     		THEAD_TH.innerHTML = i;
//     		THEAD_TH.className = i;
//     		_this.colNames.push(i);
//     		THEAD_TR.appendChild(THEAD_TH);
//     		_this.colNum++;
//     	}
// 	    for (var i = _this.data.ROWSET.length - 1; i >= 0; i--) {
// 	    	var TBODY_TR = document.createElement("TR");    	
// 	    	for (var j in _this.data.ROWSET[i]) {
// 	    		var TBODY_TD = document.createElement("TD");
// 	    		TBODY_TD.innerHTML = _this.data.ROWSET[i][j];
// 	    		TBODY_TR.appendChild(TBODY_TD);
// 	    	}
// 	    	TBODY.appendChild(TBODY_TR);
// 	    }
// 	    THEAD.appendChild(THEAD_TR);
// 	    TABLE.appendChild(THEAD);
// 	    TABLE.appendChild(TBODY);	
// 	    _this.$root.html(TABLE);
// 	    var buttonAdd = document.createElement("button");
// 	    buttonAdd.className = "add";
// 	    buttonAdd.innerHTML = "Добавить";
// 	    var buttonEdit = document.createElement("button");
// 	    buttonEdit.className = "edit";
// 	    buttonEdit.innerHTML = "Изменить";
// 	    var buttonCancel = document.createElement("button");
// 	    var buttonSave = document.createElement("button");
// 	    buttonSave.className = "save";
// 	    buttonSave.innerHTML = "Сохранить";
// 	    buttonCancel.className = "cancel";
// 	    buttonCancel.innerHTML = "Отменить";
// 	    var buttonDelete = document.createElement("button");
// 	    buttonDelete.className = "delete";
// 	    buttonDelete.innerHTML = "Удалить";
// 	    _this.$root.append(buttonAdd);
// 	    _this.$root.append(buttonEdit);
// 	    _this.$root.append(buttonSave);
// 	    _this.$root.append(buttonCancel);
// 	    _this.$root.append(buttonDelete);
// 	    _this.$thead = _this.$root.find("thead");
// 	    _this.$tbody = _this.$root.find("tbody");
// 	};

// 	this.addRow = function () {
// 		var TR = document.createElement("TR");
// 		TR.className = "adding";
// 		for (var i = _this.colNum - 1; i >= 0; i--) { 
// 			var TD = document.createElement("TD");
// 			var INPUT = document.createElement("INPUT");
// 			TD.appendChild(INPUT);
// 			TR.appendChild(TD);
// 		}
// 		_this.$tbody.prepend(TR);
// 	};

// 	this.saveRows = function () {
// 		var buffer = [];
// 		_this.$root.find(".adding, .editing").each(function (i, el) {
// 			var saveObj = {};			
// 			$(el).find("td").each(function (i, el) {
// 				var inputVal = $(el).find("input").val();
// 				saveObj[_this.colNames[i]] = inputVal; 
// 				//save handler here
// 				$(el).html(inputVal);
// 			});
// 			buffer[i] = saveObj;
// 			$(el).removeClass("adding editing");
// 		});
// 		for (var i = buffer.length - 1; i >= 0; i--) {
// 			var needsProperties = {
// 				command: "modify",
// 				subcommand: _this.subcommand,
// 				sid: _this.sid,
// 				params: buffer[i]
// 			};
// 			var url = "http://192.168.1.101/cgi-bin/b2c?p_xml=" + MBOOKER.obj2XML(needsProperties);
// 			$.ajax({
// 				url: url,
// 				async: true,
// 				dataType: "xml",
// 				type: "GET"
// 			}).done(function (data) {
// 				console.log($(data).find("result rc").text());
// 				if ($(data).find("result rc").text() === "0") {
// 					_this.reloadData({subcommand:_this.subcommand, sid:_this.sid}, function() {
// 						_this.renderHtml();
// 						_this.bindEvents();
// 					});	
// 				}
// 			});			 
// 		};
// 	};

// 	this.editRows = function () {
// 		_this.$root.find(".highlighted").each(function (i, el) {
// 			$(el).removeClass("highlighted").addClass("editing");
// 			$(el).find("td").each(function (i, el) {
// 				var cellVal = $(el).text();
// 				var input = document.createElement("input");
// 				$(el).html(input).find("input").val(cellVal);
// 			});
// 		});
// 	};

// 	this.cancelEditAdd = function () {
// 		_this.$root.find(".editing, .adding").each(function () {
// 			$(el).find("td").each(function (i, el) {
// 				var inputVal = $(el).find("input").val();
// 				//save handler here
// 				$(el).html(inputVal);
// 			});
// 			$(el).removeClass("adding editing");
// 		});
// 	};

// 	this.bindEvents = function () {
// 		_this.$root.find("button.add").off();
// 		_this.$root.find("button.add").on("click", function () {
// 			_this.addRow();
// 		});
// 		_this.$root.find("button.edit").on("click", function () {
// 			_this.editRows();
// 		});
// 		_this.$root.find("button.save").on("click", function () {
// 			_this.saveRows();
// 		});
// 		_this.$root.find("button.cancel").on("click", function () {
// 			_this.cancelEditAdd();
// 		});
// 		_this.$root.find("button.delete").on("click", function () {
// 			_this.deleteRow();
// 		});
// 		_this.$tbody.find("tr").each(function (i, el) {
// 			$(el).on("click", function () {
// 				$(this).addClass("highlighted");
// 			});
// 		});
// 	};

// };

// var hallAddresses = new TableClass({subcommand: "hall_addresses", pageNo: 1, rowsNum: 10, sid: "PfMpxNWSpXBwMlmBcgGAyBXQeThFiDDM"});
// hallAddresses.renderHtml();
// hallAddresses.bindEvents();



// 		// $("." + this.subcommand + "_table_bottom_toolbar_create_button").on("click", function () {
// 		// 	_this.addRow();
// 		// });	
// 		// $("." + this.subcommand + "_table_bottom_toolbar_restore_button").on("click", function () {
// 		// 	_this.restoreRow();
// 		// });	
// 		// $("." + this.subcommand + "_table_bottom_toolbar_save_button").on("click", function () {
// 		// 	_this.saveRow();
// 		// });\
// 	// 	$("." + this.subcommand + "_table_bottom_toolbar_edit_button").on("click", function () {
// 	// 		_this.editRow();
// 	// 	});	
// 	// }
// 	// $("#" + this.subcommand + "_table").on("click", "tbody tr", function() {
// 	// 	if ($(this).hasClass("selected-row")) {

// 	// 	} else {
// 	// 		$(".selected-row").find("a").editable("destroy");
// 	// 		$(".selected-row").removeClass("selected-row");
// 	// 		$(this).addClass("selected-row");
// 	// 	}
// 	// });
// };
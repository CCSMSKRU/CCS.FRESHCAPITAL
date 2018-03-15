(function () {
	MB = MB || {};
	MB.TablesConstructor = function () {
		this.tables = [];
	};
	MB.Tables = new MB.TablesConstructor();
	MB.TableN = function (params) {
		this.name = params.name || 'unnamed';
		this.client_object = params.client_object || '';
		this.class = params.class || '';
        this.coAndClass = (params.class.indexOf('.') > -1)?  params.class : params.class + '.' + params.client_object;
        this.id = params.id || MB.Core.guid();
		this.parent_id = params.parent_id || '';
		this.parentObject = params.parentObject || undefined;
		this.externalWhere = params.externalWhere || "";
		this.default_where = params.default_where || "";
        this.itemsPerPage = 0;
        this.pagesCount = 0;
		this.primary_keys = [];
	};

	MB.TablesConstructor.prototype.addTable = function (table) {
		this.tables.push(table);
	};
	MB.TablesConstructor.prototype.getTable = function (id) {
		for (var i in this.tables) {
			var table = this.tables[i];
			if (table.id == id) {
				return table;
			}
		}
	};
	MB.TablesConstructor.prototype.getTableByClass = function (class_name) {
		for (var i in this.tables) {
			var table = this.tables[i];
			if (table.class == class_name) {
				return table;
			}
		}
	};

    MB.TablesConstructor.prototype.getTableByThree = function(class_name, client_object, parent_id){



    };

	MB.TablesConstructor.prototype.removeTable = function (id) {
		for (var i in this.tables) {
			var table = this.tables[i];
			if (table.id == id) {
				this.tables.splice(i, 1);
			}
		}
	};

	MB.TableN.prototype.create = function (wrapper, callback) {
		var _t = this;
		_t.wrapper = wrapper;
		if (wrapper.is(MB.Core.$pageswrap)) {
			var tempTable = wrapper.find('.classicTableWrap');
			if (tempTable.length > 0) {
				var tempTableId = tempTable.data('id');
				var tempTableInstance = MB.Tables.getTable(tempTableId);
				if (_t.coAndClass == tempTableInstance.coAndClass) {
					tempTableInstance.reload();
					return;
				} else {
					MB.Tables.removeTable(tempTableId);
				}
			}
		}
		_t.tempPage = 1;
		_t.getProfile(_t.client_object, function () {
			_t.primary_keys = _t.profile['extra_data']['object_profile']['primary_key'].split(',');
			_t.itemsPerPage = _t.profile['extra_data']['object_profile']['rows_max_num'];


			_t.getData(function () {


                if(!_t.data){
                    console.log('NO DATA');
                    if (typeof callback == 'function') {
                        callback('ERROR');
                    }
                }else{
                    _t.pagesCount = (_t.data['extra_data']) ? Math.ceil(+_t.data['extra_data']['count_all'] / +_t.itemsPerPage) : 0;
                    MB.Tables.addTable(_t);
                    _t.render(function () {
                        _t.getScript(function () {
                            _t.createButtons();
                            MB.Core.spinner.stop(wrapper);
                            if (typeof callback == 'function') {

                                callback(_t);
                            }
                        });
                    });
                }


			});
		});
	};

	MB.TableN.prototype.createServerRMB = function () {
		var _t = this;
		var result = [];
		for (var i in _t.profile['extra_data']['object_profile']['rmb_menu']) {
			var item = _t.profile['extra_data']['object_profile']['rmb_menu'][i];
			var type = item['RMB_MENU_TYPE'];
			var whereCols = item['WHERE_COLUMNS'];
			var disabled = function(disCol, disVal, type, whereCol) {
				var row = _t.ct_instance.selectedRowIndex;
				var celValue = _t.data.data[row][disCol];
				var disValues = disVal.split(",");

				if(type == "OPEN_CLIENT_OBJECT" && _t.data.data[whereCol] != "")return false;

				if(disCol != "" && disVal == "" && celValue != "") {
					return false;
				}

				for (var i in disValues) {
					if(disValues[i] == celValue) return false;
				}

				return true;
			};
			result.push({
				name: item['RMB_MENU_ITEM_ID'],
				title: item['RMB_MENU_LABEL'],
				disCol: item['IS_DISABLED_COLUMN'],
				disVal: item['IS_DISABLED_COLUMN_VALUE'],
				type: item['RMB_MENU_TYPE'],
				whereCol: item['WHERE_COLUMNS'],
				disabled: disabled,
				callback: function () {
					var theRmb = _t.profile['extra_data']['object_profile']['rmb_menu'];
					var rmbName = $(this)[0].name;
					var row = _t.ct_instance.selectedRowIndex;
					var clientObject;
					for (var t in theRmb) {
						if (theRmb[t]['RMB_MENU_ITEM_ID'] == rmbName) {
							type = theRmb[t]['RMB_MENU_TYPE'];
							clientObject = theRmb[t]['OPEN_CLIENT_OBJECT'];
							whereCols = theRmb[t]['WHERE_COLUMNS'].split(',');
						}
					}
					if (type == 'OPEN_CLIENT_OBJECT') {
						var whereStr = [];
						for (var w in whereCols)
							whereStr.push(whereCols[w] + " = '" + _t.data.data[row][whereCols[w]] + "'");
						var defWhere = _t.profile.extra_data.object_profile.default_where;
						if (defWhere) whereStr.push(defWhere);
						whereStr = whereStr.join(' and ');


						MB.Core.switchPage({
							type: "table",
							name: clientObject,
							isNewTable: true,
							externalWhere: whereStr
						});

					} else if (type == 'SEND_COMMAND') {
						var isWAlert;
						var message;
						var sendOperation;
						var sendObject;
						var sendAttr;
						var refreshData;

						for (var r in theRmb) {
							if (theRmb[r]['RMB_MENU_ITEM_ID'] == rmbName) {
								isWAlert = theRmb[r]['SEND_WITH_ALERT'];

								message = theRmb[r]['SEND_ALERT'];
								sendOperation = theRmb[r]['SEND_OPERATION'];
								sendObject = theRmb[r]['SEND_OBJECT'];
								sendAttr = theRmb[r]['SEND_ATTRIBUTE'];
								refreshData = theRmb[r]['REFRESH_DATA'];
							}
						}
						if (isWAlert == 'TRUE') {
							bootbox.dialog({
								title: 'Внимание',
								message: message,
								buttons: {
									success: {
										label: 'Да',
										className: '',
										callback: function () {
											var o = {
												command: sendOperation,
												object: sendObject,
												params: {}
											};

											for (var k in sendAttr.split(',')) {
												var colName = sendAttr.split(',')[k];
												o.params[colName] = _t.data.data[row][colName];
											}

											socketQuery(o, function (res) {
												res = socketParse(res);
												if(refreshData == "TRUE") _t.reload();
//												console.log(res);
											});
										}
									},
									cancel: {
										label: 'Отмена',
										className: '',
										callback: function () {

										}
									}
								}
							})
						} else {
							var o = {
								command: sendOperation,
								object: sendObject,
								params: {}
							};

							for (var k in sendAttr.split(',')) {
								var colName = sendAttr.split(',')[k];
								o.params[colName] = _t.data.data[row][colName];
							}

							socketQuery(o, function (res) {
								socketParse(res);
								if(refreshData == "TRUE") _t.reload();
							});
						}
					}
				}
			});
		}
		return result;
	};

	MB.TableN.prototype.getScript = function (callback) {
		var _t = this;
		var serverRMB = _t.createServerRMB();
		var load = function (url) {
			$.ajax({
				crossDomain: true,
				dataType: "script",
				url: url,
				success: function () {
					if (!_t.ct_instance.ctxMenuData) {
						_t.ct_instance.ctxMenuData = [];
					}
					for (var i in serverRMB) {
						_t.ct_instance.ctxMenuData.push(serverRMB[i]);
					}

//				console.log('asdasd', _t.ct_instance.ctxMenuData);

					if (typeof callback == 'function') {
						callback();
					}
				},
				error: function () {
					if (typeof callback == 'function') {
						callback();
					}
				}
			});

			/* $.getScript("html/tables/require/" + _t.name + ".js", function () {
			 if (!_t.ct_instance.ctxMenuData) {
			 _t.ct_instance.ctxMenuData = [];
			 }
			 for (var i in serverRMB) {
			 _t.ct_instance.ctxMenuData.push(serverRMB[i]);
			 }

			 //				console.log('asdasd', _t.ct_instance.ctxMenuData);

			 if (typeof callback == 'function') {
			 callback();
			 }
			 });*/
		};
		//console.log('Looks like',_t.name,  _t.profile['extra_data']['object_profile']);
		MB.Tables.justLoadedId = _t.id;

		if (_t.profile['extra_data']['object_profile']['additional_functionality']) {
            var table_file_name = (_t.client_object)? _t.client_object : (_t.class.indexOf('.') > -1)?  _t.class.substr(_t.class.indexOf('.') + 1) : 'table_' + _t.class ;
			load("html/tables/require/" + table_file_name + ".js");

		} else {
			if (_t.profile['extra_data']['object_profile']['open_form_client_object'] != '') {
				_t.ct_instance.ctxMenuData = [{
					name: 'option1',
					title: 'Открыть в форме',
					disabled: function () {
						return false;
					},
					callback: function () {
						_t.openRowInModal();
					}
				}];
			}

			for (var i in serverRMB) {
				if (!_t.ct_instance.ctxMenuData) {
					_t.ct_instance.ctxMenuData = [];
				}
				_t.ct_instance.ctxMenuData.push(serverRMB[i]);
			}

			if (typeof callback == 'function') {
				callback();
			}
		}

	};

	MB.TableN.prototype.createButtons = function (callback) {
		var _t = this;

		if (_t.ct_instance.lowerButtons) _t.ct_instance.container.append('<div class="lower-buttons-wrapper"></div>');
		MB.Core.createButtons(_t.ct_instance);
        _t.ct_instance.createCustomButtons();
	};

	MB.TableN.prototype.render = function (callback) {
		var _t = this;

		MB.Core.classicTable.createTable({
			id: _t.id,
			data: _t.data,
			class: _t.class,
			client_object: _t.client_object,
			profile: _t.profile,
			wrapper: _t.wrapper,
			isInfoOpened: false,
            itemsPerPage: _t.itemsPerPage,
            pagesCount: _t.pagesCount,
            primary_keys: _t.primary_keys
		}, function (instace) {
			_t.ct_instance = instace;
			_t.setHandlers();
            _t.initPerPageSelection();
			if (typeof callback == 'function') {
				callback();
			}
		});
	};

	MB.TableN.prototype.getProfile = function (name, callback) {
		var _t = this;

		if (this.class === '' && this.client_object === '') {
			console.warn('form without name');
			return false;
		} else {
			if (localStorage.getItem('tableN_' + _t.coAndClass) !== null) {

                console.log('FROM_STORAGE');

				_t.profile = JSON.parse(localStorage.getItem('tableN_' + _t.coAndClass));
				_t.profile.extra_data.object_profile.rmb_menu = socketParse(_t.profile.extra_data.object_profile.rmb_menu);
				_t.profile.extra_data.object_profile.prepare_insert = socketParse(_t.profile.extra_data.object_profile.prepare_insert);
				if (typeof callback == 'function') {
					callback();
				}
			} else {

				var o = {
					command: 'getProfile',
					object: _t.class
					//client_object: name
				};

                if(_t.client_object.length > 0){
                    o.client_object = _t.client_object;
                }

				socketQuery(o, function (r) {
					if(r.code) {
						console.warn('GET PROFILE ERROR: ', r.code);
						return false;
					}

					_t.profile = r;


					_t.profile.extra_data.object_profile.rmb_menu = socketParse(_t.profile.extra_data.object_profile.rmb_menu);
					if(_t.profile.extra_data.object_profile.prepare_insert){
						_t.profile.extra_data.object_profile.prepare_insert = (function (){
							var prep = _t.profile.extra_data.object_profile.prepare_insert,
								res = {};
							for (var i in prep.data) res[prep.data_columns[i]] = prep.data[i];
							return res;
						}());
					}
					localStorage.setItem('tableN_' + _t.coAndClass, JSON.stringify(r));
					if (typeof callback == 'function') {
						callback();
					}
				});
			}
		}
	};

	MB.TableN.prototype.parseWhereArray2 = function(){
		var _t = this;
		var result = [];
		var strOrArr = undefined;
		if (_t.ct_instance) {

			return _t.ct_instance.filterWhere;

			//for (var i in _t.ct_instance.filterWhere) {
			//	var whereItem = _t.ct_instance.filterWhere[i];
			//	console.log('WITEM', whereItem);
			//}
		}
	};

	MB.TableN.prototype.parseWhereArray = function () {
		var _t = this;
		var result = [];
		var strOrArr = undefined;
		if (_t.ct_instance) {
			for (var i in _t.ct_instance.filterWhere) {
				var whereItem = _t.ct_instance.filterWhere[i];
				switch (whereItem.type) {
					case 'text':
						result.push(whereItem.name + " = '" + whereItem.value + "'");
						break;
					case 'like_text':
						result.push(whereItem.name + " like '%" + whereItem.value + "%'");
						break;
					case 'select2':
						if (whereItem.value == 'isNull') {
							result.push(whereItem.name + " is Null");
						} else if (whereItem.value == 'isNotNull') {
							result.push(whereItem.name + " is Not Null");
						} else {
							strOrArr = (typeof whereItem.value == 'object') ? whereItem.value.join('\',\'') : whereItem.value;
							result.push(whereItem.name + " in ('" + strOrArr + "')");
						}
						break;
					case 'daysweek':
						strOrArr = whereItem.value.join('\',\'');
						result.push("to_char(" + whereItem.name + ",'d') in ('" + strOrArr + "')");
						break;
					case 'daterange':
						if (!MB.Core.validator.date(whereItem.value.from)) {
							whereItem.value.from = '';
						}
						if (!MB.Core.validator.date(whereItem.value.to)) {
							whereItem.value.to = '';
						}
						if (whereItem.value.from != '' && whereItem.value.to != '') {
							result.push("trunc(" + whereItem.name + ") >= to_date('" + whereItem.value.from + "', 'DD.MM.YYYY')" +
							" and " +
							"trunc(" + whereItem.name + ") <= to_date('" + whereItem.value.to + "', 'DD.MM.YYYY')");
						} else if (whereItem.value.from != '') {
							result.push("trunc(" + whereItem.name + ") >= to_date('" + whereItem.value.from + "', 'DD.MM.YYYY')");
						} else if (whereItem.value.to != '') {
							result.push("trunc(" + whereItem.name + ") <= to_date('" + whereItem.value.to + "', 'DD.MM.YYYY')");
						}
						break;
					case 'datetimerange':
						if (!MB.Core.validator.datetime(whereItem.value.from)) {
							whereItem.value.from = '';
						}
						if (!MB.Core.validator.datetime(whereItem.value.to)) {
							whereItem.value.to = '';
						}
						if (whereItem.value.from != '' && whereItem.value.to != '') {
							result.push(whereItem.name + " >= to_date('" + whereItem.value.from + "', 'DD.MM.YYYY hh24:mi:ss')" +
							" and " +
							whereItem.name + " <= to_date('" + whereItem.value.to + "', 'DD.MM.YYYY hh24:mi:ss')");
						} else if (whereItem.value.from != '') {
							result.push(whereItem.name + " >= to_date('" + whereItem.value.from + "', 'DD.MM.YYYY hh24:mi:ss')");
						} else if (whereItem.value.to != '') {
							result.push(whereItem.name + " <= to_date('" + whereItem.value.to + ":', 'DD.MM.YYYY hh24:mi:ss')");
						}
						break;
					case 'timerange':
						if (!MB.Core.validator.time(whereItem.value.from)) {
							whereItem.value.from = '';
						}
						if (!MB.Core.validator.time(whereItem.value.to)) {
							whereItem.value.to = '';
						}
						if (whereItem.value.from != '' && whereItem.value.to != '') {
							result.push("to_char(" + whereItem.name + ", 'hh24mi') >= " + whereItem.value.from.replace(/[:]/g, '') +
							" and " +
							"to_char(" + whereItem.name + ", 'hh24mi') <= " + whereItem.value.to.replace(/[:]/g, ''));
						} else if (whereItem.value.from != '') {
							result.push("to_char(" + whereItem.name + ", 'hh24mi') >= " + whereItem.value.from.replace(/[:]/g, '').substr(0, 4));
						} else if (whereItem.value.to != '') {
							result.push("to_char(" + whereItem.name + ", 'hh24mi') <= " + whereItem.value.to.replace(/[:]/g, '').substr(0, 4));
						}
						break;
					case 'checkbox':
						var val = (whereItem.value) ? "TRUE" : "FALSE";
						result.push(whereItem.name + " = '" + val + "'");
						break;
					default:
						break;
				}
			}
		}
//		console.log('RESULT WHERE: ', result);
		return result;
	};

	MB.TableN.prototype.getData = function (callback) {
		var _t = this;
//		console.log(_t)
		var enableWhere = (_t.ct_instance) ? (_t.ct_instance.filterWhere.length > 0) : false;
		var enableFastSearch = (_t.fastSearchWhere && _t.fastSearchWhere.length > 0);
		var whereArr = [];
		var whereString;
		var orderByStr = (_t.ct_instance) ? (_t.ct_instance.sort) ? (_t.ct_instance.sort.columns.length > 0) ? _t.ct_instance.sort : false : false : false;
		if (enableWhere || _t.profile['extra_data']['object_profile']['parent_key'] != '') {

			if (enableWhere && _t.profile['extra_data']['object_profile']['parent_key'] == '') {

				//whereArr.push(_t.parseWhereArray2().join(' and '));
				whereArr = whereArr.concat(_t.parseWhereArray2());

			} else if (!enableWhere && _t.profile['extra_data']['object_profile']['parent_key'] != '') {
				if(_t.parent_id){
                    var pwObj2 = {
                        key: _t.profile['extra_data']['object_profile']['parent_key'],
                        type: '=',
                        comparisonType: 'and',
                        val1: _t.parent_id,
                        val2: ''
                    };
                    whereArr.push(pwObj2);
                }

				//whereArr.push(_t.profile['extra_data']['object_profile']['parent_key'] + ' = ' + _t.parent_id);
			} else {
				whereArr.push(_t.profile['extra_data']['object_profile']['parent_key'] + ' = ' + _t.parent_id + ' and ' + _t.parseWhereArray2().join(' and '));
                if(_t.parent_id){
                    var pwObj = {
                        key: _t.profile['extra_data']['object_profile']['parent_key'],
                        type: '=',
                        comparisonType: 'and',
                        val1: _t.parent_id,
                        val2: ''
                    };
                    whereArr.push(pwObj);
                }
				whereArr = whereArr.concat(_t.parseWhereArray2());
			}
		}

		if (_t.externalWhere != '') {
			whereArr.push(_t.externalWhere);
		}
		if (_t.profile.extra_data.object_profile.default_where != '') {
			//whereArr.push(_t.profile.extra_data.object_profile.default_where);
		}

		//console.log('CONCAT', enableFastSearch, whereArr, _t.fastSearchWhere);

		if (enableFastSearch) {
			whereArr = whereArr.concat(_t.fastSearchWhere);
		}


		if (_t.profile['extra_data']['object_profile']['checkbox_where'] != '') {
			var chkbx = $('.classicTableWrap[data-id="' + _t.id + '"] .ct-checkbox-where');
			if (chkbx.length && chkbx.is(':checked') || !chkbx.length && (_t.profile['extra_data']['object_profile']['checkbox_where_default_enabled'])) {
				var ch_where_data = JSON.parse(_t.profile['extra_data']['object_profile']['checkbox_where']);
                for(var i in ch_where_data){
                    var cw = ch_where_data[i];
                    cw.group = 'checkbox';
                    whereArr.push(cw);
                }
			}
		}

		whereString = whereArr.join(' and ');

		var o = {
			command: 'get',
			object: _t.class,//profile['extra_data']['object_profile']['class'],
			//client_object: _t.client_object,
			params:{
				where: whereArr, //'whereString,
				page_no: _t.tempPage,
				limit: _t.itemsPerPage
			}
		};
        if (_t.profile['extra_data']['object_profile']['param_checkbox_where'] != '') {
            var pchkbx = $('.classicTableWrap[data-id="' + _t.id + '"] .ct-param-checkbox-where');
            if (pchkbx.length && pchkbx.is(':checked') || !pchkbx.length && (_t.profile['extra_data']['object_profile']['param_checkbox_where_default_enabled'])) {
                var p_ch_where_data = JSON.parse(_t.profile['extra_data']['object_profile']['param_checkbox_where']);
                for(var i in p_ch_where_data){
                    var cw = p_ch_where_data[i];
                    o.params[i] = cw;
                }
            }
        }

        if(orderByStr){
            o.params.sort = orderByStr;
        }

        if(_t.client_object.length > 0){
            o.client_object = _t.client_object;
        }

		//console.log('TABLE PROFILE', _t.profile);

		socketQuery(o, function (r) {

			_t.data = r;//socketParse(r, {subData: true, names: true, profile: _t.profile.data});

			_t.where = o.where;

			//if (!_t.fulldata) _t.fulldata = [];
			//if (!_t.fulldata[_t.tempPage - 1]) {
			//	_t.fulldata[_t.tempPage - 1] = [];
			//	for (var i in _t.data.DATA) {
			//		var tempRow = {};
			//		for (var j in _t.data.NAMES) {
			//			tempRow[_t.data.NAMES[j]] = _t.data.DATA[i][j];
			//		}
			//		_t.fulldata[_t.tempPage - 1].push(tempRow);
			//	}
			//}

//			console.log('oWhere', o.where);
//			console.log('oWhere', o);

			if (typeof callback == 'function') {
				callback();
			}
		});
	};

	MB.TableN.prototype.spin = function (stage) {
		var _t = this;
		var loader = _t.wrapper.find('.preLoader');
		if (stage == 'start') {
			loader.show(0);
		} else {
			loader.hide(0);
		}
		return;
		var opts = {
			lines: 17, // The number of lines to draw
			length: 18, // The length of each line
			width: 2, // The line thickness
			radius: 28, // The radius of the inner circle
			corners: 1, // Corner roundness (0..1)
			rotate: 12, // The rotation offset
			direction: 1, // 1: clockwise, -1: counterclockwise
			color: '#000', // #rgb or #rrggbb or array of colors
			speed: 1.8, // Rounds per second
			trail: 44, // Afterglow percentage
			shadow: false, // Whether to render a shadow
			hwaccel: false, // Whether to use hardware acceleration
			className: 'spinner', // The CSS class to assign to the spinner
			zIndex: 2e9, // The z-index (defaults to 2000000000)
			top: '50%', // Top position relative to parent
			left: '50%' // Left position relative to parent
		};
		var target = undefined;
		var fader = undefined;

		if (stage === 'first') {
			target = _t.wrapper[0];
		} else {
			target = _t.ct_instance.wrapper[0];
			fader = _t.ct_instance.wrapper.find('.ct-fader');
		}

		if (stage === 'start') {

			fader.show(0);
			fader.css('opacity', '0');
			fader.show(0, function () {
				fader.animate({
					opacity: 0.7
				}, 100, function () {
					var spinner = new Spinner(opts).spin(target);
				})
			});
		} else if (stage === 'stop') {
			$('.spinner').remove();
			$(target).find('.spinner').fadeOut(100, function () {
				$('.spinner').remove();
			});
			fader.animate({
				opacity: 0
			}, 200, function () {
				fader.hide(0);
			});
		} else if (stage === 'first') {
			var spinner = new Spinner(opts).spin(target);
		} else {
			$(target).find('.spinner').fadeOut(100, function () {
				$('.spinner').remove();
				fader.animate({
					opacity: '0'
				}, 200);
			});
		}
	};

	MB.TableN.prototype.setFilter = function () {
		var _t = this;

		_t.clearChanges();
		_t.reload();
	};

	MB.TableN.prototype.reload = function (callback) {
		var _t = this;
		var fader = _t.ct_instance.wrapper.find('.ct-fader');
		var chs = _t.ct_instance.changes;
		fader.css({
			opacity: 0.7,
			display: 'block'
		});

		MB.Core.spinner.start(_t.ct_instance.wrapper);

		_t.getData(function () {
			_t.ct_instance.data = _t.data;
			_t.ct_instance.tempPage = _t.tempPage;
			fader.css({
				opacity: 0,
				display: 'none'
			});
			MB.Core.spinner.stop(_t.ct_instance.wrapper);

			_t.ct_instance.update(function () {
				_t.setHandlers();
                _t.ct_instance.createCustomButtons();
//				_t.ct_instance.populateTotalSumms();
			});


			if (typeof callback == 'function') {
				callback();
			}
		});
	};

    MB.TableN.prototype.checkForChanges = function (callback, actionType) {
        var _t = this;
        var messages = {
            changePage: '<p>При переходе на другую страницу все несохранённые изменения будут потеряны!</p><p>Подтверждаете переход?</p>',
            reloadTable: '<p>При перезагрузке таблицы все несохранённые изменения будут потеряны!</p><p>Подтверждаете перезагрузку?</p>'
        };
        var message;

        if(actionType == "RELOAD_TABLE") message = messages.reloadTable;
        else if(actionType == "CHANGE_PAGE") message = messages.changePage;

        if (!localStorage.getItem('neverAskIfChangesOnPaginator'))
            toastrLock({
                message: message,
                title: 'ВНИМАНИЕ!',
                buttons: [
                    {name: 'ОК', class: 'danger', type: "SUCCESS", callback: callback},
                    {
                        name: 'Запомнить выбор?', class: 'danger', type: "SUCCESS", callback: function () {
                        localStorage.setItem('neverAskIfChangesOnPaginator', true);
                        callback();
                    }
                    },
                    {name: 'Отмена', class: 'primary', type: "DECLINE", callback: callback}
                ]
            });
        else callback();
    };

    MB.TableN.prototype.clearChanges = function() {
        var _t = this;
	    _t.ct_instance.places.tbody.find(".edited").removeClass("new_row").removeClass("edited");
        _t.ct_instance.toggleSaveButton(false);
        _t.ct_instance.changes = [];
    };

    MB.TableN.prototype.initPerPageSelection = function() {
        var _t = this;
        _t.ct_instance.wrapper.find('.classicTableFunctional div.ct-select3-wrapper.ct-items-per-page').each(function (index, elem) {
            var sVal = $(elem).data('val');
            var sName = $(elem).data('title');
            //var data = { //TODO ROWS_MAX_NUM_LIST object_profile ROWS_MAX_NUM
            //    data: [],
            //    data_columns: [
            //        "id","name"
            //    ]
            //};

            var data = [];

            var rowsList = _t.profile.extra_data.object_profile.rows_max_num_list,
                fullList;
            if (rowsList == '') fullList = [_t.profile.extra_data.object_profile.rows_max_num];
            else fullList = _t.profile.extra_data.object_profile.rows_max_num_list.split(',');

            for (var i in fullList) {
                data.push({id: fullList[i], name: +fullList[i]});
            }

            var selInstance = MB.Core.select3.init({
                id :                MB.Core.guid(),
                type :              'pregetted',
                wrapper:            $(elem),
                column_name:        "",
                class:              _t.class,
                client_object:      _t.client_object, //client_object
                return_id:          "id",
                return_name:        "name",
                withSearch:         false,
                data:               data,
                withEmptyValue:     ($(elem).attr('data-with_empty') == 'true'),
                absolutePosition:   true,
                isFilter:           false,
                parentObject:       _t,
                value: {
                    id: sVal,
                    name: sName
                },
                additionalClass:    ''

                //id: MB.Core.guid(),
                //wrapper: $(elem),
                //value: {
                //    id: sVal,
                //    name: sName
                //},
                //data: data,
                //fromServerIdString: "",
                //fromServerNameString: "",
                //searchKeyword: "",
                //withEmptyValue: false,
                //absolutePosition: true,
                //isFilter: false,
                //isSearch: false,
                //parentObject: _t
            });

            $(selInstance).on('changeVal', function (e, was, now) {
                var selInstance = this;
                var itemsPerPage = now.name;
                var output;
                var fff = function (type) {
                    if(type == "SUCCESS") {
                        _t.clearChanges();
                        _t.itemsPerPage = itemsPerPage;
                        _t.pagesCount = Math.ceil(+_t.data['extra_data']['count_all'] / +itemsPerPage);
                        _t.ct_instance.itemsPerPage = itemsPerPage;
                        _t.ct_instance.pagesCount = _t.pagesCount;

                        if(_t.tempPage > _t.pagesCount) _t.tempPage = _t.pagesCount;

                        _t.reload();
                    }
                    else {
                        output = selInstance.output;
                        output.attr('data-id', was.id);
                        output.html(was.name);
                    }
                };

                if (_t.ct_instance.changes.length) _t.checkForChanges(fff, "RELOAD_TABLE");
                else fff("SUCCESS");
            });
        });
    };

	MB.TableN.prototype.setHandlers = function (callback) {
		var _t = this;
		var bs = {
			reload: _t.ct_instance.wrapper.find('.ct-options-reload'),
			pageInp: _t.ct_instance.wrapper.find('.ct-pagination-current-input'),
			prevPage: _t.ct_instance.wrapper.find('.ct-pagination-prev'),
			nextPage: _t.ct_instance.wrapper.find('.ct-pagination-next'),
			filter: _t.ct_instance.wrapper.find('.ct-options-filter'),
			save: _t.ct_instance.wrapper.find('.ct-options-save'),
			createInline: _t.ct_instance.wrapper.find('.ct-btn-create-inline'),
			createInForm: _t.ct_instance.wrapper.find('.ct-btn-create-in-form'),
			duplicate: _t.ct_instance.wrapper.find('.ct-btn-duplicate'),
			remove: _t.ct_instance.wrapper.find('.ct-btn-remove')
		};
		var wasPage = bs.pageInp.val();

		function validateNumber(val) {
			var numReg = new RegExp('^[0-9]+$');
			return numReg.test(val);
		}


		_t.ct_instance.wrapper.find('.ct-btn-drop-cache').off('click').on('click', function(){
			socketQuery({
				command: '_clearCache',
				object: _t.profile.extra_data.object_profile.class || _t.profile.extra_data.object_profile.name
			}, function (r) {
				
			});
		});

		bs.pageInp.off('change').on('change', function () {
			var val = $(this).val();

			if (val != '') {
				if (validateNumber(val)) {
					if (val <= Math.ceil(+(_t.data['extra_data']['count_all']) / +(_t.itemsPerPage))) {
						if (val != wasPage) {
							_t.tempPage = val;
							_t.reload();
						}
					} else {
						bs.pageInp.val(wasPage);
					}
				} else {
					bs.pageInp.val(wasPage);
				}
			}
		});

		var checkForChanges = function (callback, actionType) {
			var messages = {
				changePage: '<p>При переходе на другую страницу все несохранённые изменения будут потеряны!</p><p>Подтверждаете переход?</p>',
				reloadTable: '<p>При перезагрузке таблицы все несохранённые изменения будут потеряны!</p><p>Подтверждаете перезагрузку?</p>'
			};
			var message;

			if (actionType == "RELOAD_TABLE") message = messages.reloadTable;
			else if (actionType == "CHANGE_PAGE") message = messages.changePage;

			if (!localStorage.getItem('neverAskIfChangesOnPaginator'))
				toastrLock({
					message: message,
					title: 'ВНИМАНИЕ!',
					buttons: [
						{name: 'ОК', class: 'danger', callback: callback},
						{
							name: 'Запомнить выбор?', class: 'danger', callback: function () {
							localStorage.setItem('neverAskIfChangesOnPaginator', true);
							callback();
						}
						},
						{name: 'Отмена', class: 'primary'}
					]
				});
			else callback();
		};

		var clearChanges = function () {
			var changes = _t.ct_instance.changes;
			for (var i = 0; i < changes.length; i++) {
				var change = changes[i];
				var row = change['ROW'];
				row.removeClass("edited").removeClass("new_row");
			}
			_t.ct_instance.toggleSaveButton(false);
			_t.ct_instance.changes = [];
		};

		bs.prevPage.off('click').on('click', function () {
			var _this = this;
			if ($(_this).hasClass('disabled')) {
				return
			}
			var fff = function () {
				if (_t.tempPage != 1) {
                    _t.clearChanges();
					$(_this).addClass('disabled');
					_t.tempPage = +_t.tempPage - 1;
					_t.reload(function () {
						$(_this).removeClass('disabled');
					});
				}
			};

			if (_t.ct_instance.changes.length) _t.checkForChanges(fff, "CHANGE_PAGE");
			else fff();
		});

		bs.nextPage.off('click').on('click', function () {
			var _this = this;
			if ($(_this).hasClass('disabled')) {
				return
			}
			var fff = function () {
				if (_t.tempPage < Math.ceil(+(_t.data['extra_data']['count_all']) / +(_t.itemsPerPage))) {
                    _t.clearChanges();
					$(_this).addClass('disabled');
					_t.tempPage = +_t.tempPage + 1;
					_t.reload(function () {
						$(_this).removeClass('disabled');
					});
				}
			};

			if (_t.ct_instance.changes.length) _t.checkForChanges(fff, "CHANGE_PAGE");
			else fff();
		});

		bs.reload.off('click').on('click', function () {
			var reload = function (type) {
				if(type != "DECLINE") {
					_t.ct_instance.order_by = '';
					_t.ct_instance.tableWrapper.find('th').removeClass('asc').removeClass('desc');
					_t.clearChanges();
					_t.reload();
				}
			};

            if (_t.ct_instance.changes.length) _t.checkForChanges(reload, "RELOAD_TABLE");
			else reload();
		});

		bs.save.off('click').on('click', function () {
			_t.save(function () {
				_t.ct_instance.clearAllSelection();
				_t.ct_instance.toggleSaveButton(false);

				//window.setTimeout(function(){
				_t.reload(function () {
//					console.log('Saved!');
				});
				//}, 2000);


			});
		});

		bs.createInline.off('click').on('click', function () {
			_t.createRow();
		});

		bs.createInForm.off('click').on('click', function () {
			var formId = MB.Core.guid();
			var form = new MB.FormN({
				id: formId,
				name: _t.profile['extra_data']['object_profile']['open_form_client_object'],
				class: _t.class,
                client_object: _t.profile['extra_data']['object_profile']['open_form_client_object'],
                type: 'form',
				ids: ['new'],
				position: 'center'
			});
			form.create(function () {
				var modal = MB.Core.modalWindows.windows.getWindow(formId);

				$(modal).on('close', function () {
//					console.log('modal closing trigger');
					_t.reload();
				});

				$(form).on('update', function () {
//					console.log('form update trigger');
					_t.reload();
				});

			});
		});

		bs.duplicate.off('click').on('click', function () {
			var rowIndex = _t.ct_instance.selectedRowIndex;
			if (rowIndex === null || rowIndex === undefined) {
				toastr['info']('Выберите строку таблицы для дублирования');
				return;
			}
			var prototypeRows = _t.ct_instance.selection2.data;

			for (var i in prototypeRows) {
				var prototypeRow = prototypeRows[i];
				_t.createRow(prototypeRow);
			}

			_t.ct_instance.clearAllSelection();
			_t.ct_instance.renderSelection();
		});

		bs.remove.off('click').on('click', function () {
			var primaryKeys = _t.ct_instance.selection2.primary_keys;
			var removeButton = _t.ct_instance.places.removeButton;
			if (!removeButton.hasClass("disabled")) {

				function removeSpaces(str) {
					if (typeof str == 'string') {
						return str.replace(/\s+/g, '');
					} else {
						return str;
					}
				}



				bootbox.dialog({
					title: 'Внимание',
					message: 'Вы уверены, что хотите удалить эти записи?',
					buttons: {
						success: {
							label: "Подтвердить",
							className: '',
							callback: function () {
								var sended = 0;
								var maxRows = _t.data['extra_data']['count_all'];
                                var rowsPerPage = _t.itemsPerPage;
								var pages = maxRows / rowsPerPage;
								if (pages < _t.tempPage && pages >= 1) _t.tempPage = pages;
								else if (pages <= 0) _t.tempPage = 1;

								for (var i in primaryKeys) {
									var rowPKs = {};
									var pks = primaryKeys[i].data_columns;

									for (var pk in pks) {
										rowPKs[pks[pk]] = primaryKeys[i].data[pk];
									}

									var sObj = {
										command: 'removeCascade',
										//command: 'remove',
										object: _t.profile['extra_data']['object_profile']['class'],
										params: rowPKs
									};
                                    if(_t.client_object){
                                        sObj.client_object = _t.client_object;
                                    }
									socketQuery(sObj, function (res) {
										//socketParse(res);
										sended++;
										if (sended == primaryKeys.length) {
											_t.ct_instance.clearAllSelection();
											_t.clearChanges();
											_t.reload();
										}
									});
								}
							}
						},
						error: {
							label: "Нет",
							className: '',
							callback: function () {

							}
						}
					}
				});
			}
		});

		if (typeof callback == 'function') {
			callback();
		}
	};

	MB.TableN.prototype.createRow = function (prototypeRow) {
		var _t = this;
		var newRowId = MB.Core.guid();
		var tr = $("<tr></tr>");
		var pkValuesArray = [];
		var changedColumnNames;
		var changedColumnValues;
		var prepareInsert = _t.profile['extra_data']['object_profile']['prepare_insert'] || {};

		tr.attr("data-id", newRowId);
		tr.addClass("new_row edited");
		tr.append('<td class="frst"><div class="markRow" data-checked="false"><div class="rIdx">-</div><i class="fa fa-check"></i></div></td>');

		function getCellProfile(cellName) {
			for (var i in _t.profile.data) {
				var pItem = _t.profile.data[i];
				if (pItem['column_name'] == cellName) {
					return pItem;
				}
			}
		}

		function addChange() {
			var change;
			change = {
				PRIMARY_KEY_NAMES: _t.profile['extra_data']['object_profile']['primary_key'].split(','),
				PRIMARY_KEY_VALUES: pkValuesArray,
				COMMAND: 'NEW',
				CHANGED_COLUMN_NAMES: changedColumnNames,
				CHANGED_COLUMN_VALUES: changedColumnValues,
				ROW: tr
			};
			return change;
		}

		for (var pkv = 0; pkv < _t.profile['extra_data']['object_profile']['primary_key'].split(',').length; pkv++) {
			pkValuesArray.push('NEW_ROW_' + newRowId);
		}

		for (var i in _t.data.data_columns) {
			var cell = _t.data.data_columns[i];

			var cellProfile = getCellProfile(cell);

			//console.log('cell', cell, cellProfile);

			if (cellProfile['visible']) {
				var lovReturnToColumn = cellProfile['lov_return_to_column'];
				var type = cellProfile['type_of_editor'];
				var editable = cellProfile['editable'];
				var insertable = cellProfile['insertable'];
				var updatable = cellProfile['updatable'];
				var required = cellProfile['required'];
				var showRequiredStar = (editable && required) ? 'showRequired' : '';
				var change;
				var selId = "";
				var cellValue = "";
				var td = $("<td></td>");
				var htmlElemParams;

				console.log('prototypeRow',prototypeRow);

				if (prototypeRow) {
					var pks = _t.profile.extra_data.object_profile['primary_key'].split(',');
					cellValue = prototypeRow[cell];

					if (_t.data.data.length) {
						var nameLovReturnToColumn = _t.data.data[_t.ct_instance.selectedRowIndex][lovReturnToColumn];
						selId = nameLovReturnToColumn !== undefined ? nameLovReturnToColumn : cellValue;
					} else {
						selId = '';
					}

					cellValue = prototypeRow[cell];
					if (!lovReturnToColumn) lovReturnToColumn = cell;
					cellValue = (~pks.indexOf(cell)) ? '' : cellValue;
					if (required || cellValue != '') {
						if (~type.indexOf('select2')) {
							changedColumnNames = lovReturnToColumn;
							changedColumnValues = selId;
						} else {
							changedColumnNames = cell;
							changedColumnValues = cellValue;
						}

						change = addChange();
					}
				} else {


					cellValue = prepareInsert[cell] ? prepareInsert[cell] : '';
					if (lovReturnToColumn != "") {
						for (var rtcCell in _t.data.data) {
							if (lovReturnToColumn == rtcCell) {
								var rtcCellProfile = getCellProfile(rtcCell);
								if (rtcCellProfile['required']) {
									showRequiredStar = 'showRequired';
								}
							}
						}
					}
					if (type == 'checkbox') {
						changedColumnNames = cell;
						changedColumnValues = false;
                        //console.log('2222');

						//change = addChange();
					}
				}

				if (change) _t.ct_instance.addChange(change);

				htmlElemParams = {
					type: type,
					value: cellValue,
					editable: editable,
					insertable: insertable,
					updatable: updatable,
					name: cell,
					selId: selId,
					isTd: true,
					isNew: true
				};
				td.html(_t.ct_instance.getTypeHtml(htmlElemParams));
				if (insertable) td.addClass("insertable");
				if (updatable) td.addClass("updatable");
				if (editable) td.addClass("editable");
				if (required && insertable ) {
					td.addClass('required ' + showRequiredStar);
					td.prepend('<div class="requiredStar"><i class="fa fa-star"></i></div>');
				}

				tr.append(td);
			}
		}

		_t.ct_instance.places.tbody.prepend(tr);
		_t.ct_instance.setHandlers();
	};

	MB.TableN.prototype.validateNewCommand = function (sObj) {
		var _t = this;
		var isValid = 0;
		var requiredColumns = [];
		for (var i in _t.profile.data) {
			var item = _t.profile.data[i];
			var isReq = item['REQUIRED'];
			var isVis = item['VISIBLE'];
			var isEdi = item['EDITABLE'];
			var isIns = item['INSERTABLE'];
			var typeOfEditor = item['TYPE_OF_EDITOR'];
			if (isReq == 'TRUE' && isVis == 'TRUE' && isEdi == 'TRUE') {
				if (typeOfEditor == 'select2' || typeOfEditor == 'select2WithEmptyValue' || typeOfEditor == 'select2FreeType') {
					if (item['LOV_RETURN_TO_COLUMN'].length == 0) {
						requiredColumns.push(item['COLUMN_NAME']);
					} else {
						requiredColumns.push(item['LOV_RETURN_TO_COLUMN']);
					}
				} else {
					requiredColumns.push(item['COLUMN_NAME']);
				}
			}
		}

		for (var k in requiredColumns) {
			var rCol = requiredColumns[k];
			if ($.inArray(rCol, sObj['CHANGED_COLUMN_NAMES']) > -1) {

			} else {
				isValid++;
				//console.log(sObj['CHANGED_COLUMN_NAMES'], requiredColumns);

				//ВЫВОДИТЬ КОНКРЕТНЫЕ ПОЛЯ
				toastr['error']('Заполните все обязательные поля (*)');
			}
		}
		return isValid == 0;
	};

	MB.TableN.prototype.returnStringWithoutSpaces = function (str) {
		str = (str === false)? false : str || '';
		return (typeof str != 'string') ? str : str.replace(/(^\s*)|(\s*)$/g, '');
	};

	MB.TableN.prototype.save = function (callback) {
		var _t = this;
		var chs = _t.ct_instance.changes;
		var totalError = 0;

		function finishSave(ch, success) {

			if (success) {
				var row = ch['ROW'];
				for (var i = 0; i < chs.length; i++) {
					var item = chs[i];
					if (ch == item) {
						chs.splice(i, 1);
						break;
					}
				}
				row.removeClass("edited").removeClass("new_row");
			}

			if (totalError == chs.length) {

				if (_t.parentObject) {
					_t.parentObject.enableSaveButton();
				}
				if (typeof callback == 'function') {
					callback();
				}
			}
		}

		function sQuery(ch) {
			socketQuery(sObj, function (ch) {
				return function (res) {

					if (res.code) {
						totalError += 1;
					}

					finishSave(ch, !res.code);
				}
			}(ch));
		}

        console.log('chs', chs);


		for (var i in chs) {
			var ch = chs[i];
			for (var c in ch) {
				if (typeof ch[c] != 'object') {
					ch[c] = [ch[c]];
				}
			}

			function populateParams(o) {
				var res = {};
				if (o['COMMAND'][0] != 'NEW') {
					for (var i in o['PRIMARY_KEY_NAMES']) {
						var idsArr = o['PRIMARY_KEY_NAMES'];
//                        if(o['PRIMARY_KEY_VALUES'].indexOf('NEW_ROW_')){
//                            continue;
//                        }
						var namesArr = o['PRIMARY_KEY_VALUES'];
						res[idsArr[i]] = _t.returnStringWithoutSpaces(namesArr[i]);
					}
				}

				for (var k in o['CHANGED_COLUMN_NAMES']) {
					var idsArr2 = o['CHANGED_COLUMN_NAMES'];
					var namesArr2 = o['CHANGED_COLUMN_VALUES'];


					res[idsArr2[k]] = _t.returnStringWithoutSpaces(namesArr2[k]);


				}
//

				if (o['COMMAND'][0] == 'NEW') {

					if(!res[_t.profile['extra_data']['object_profile']['parent_key']]){
						res[_t.profile['extra_data']['object_profile']['parent_key']] = _t.parent_id;
					}

				}


				return res;
			}

			function checkKeyValue(keys) {
				for (var i in keys) {
					if(typeof keys[i] != 'string' || ~keys[i].indexOf("NEW_ROW_")) return false;
				}

				return true;
			}

			var sObj = {};

			//if(!checkKeyValue(ch['PRIMARY_KEY_VALUES']) && ch['COMMAND'][0] == 'MODIFY') { //это дебаг условие. Потом удалить.
			//	console.error("Вы пытаетесь сохранить строчку со следующими значениями: PRIMARY_KEY_VALUES - ");
			//	console.error(ch['PRIMARY_KEY_VALUES']);
			//	console.error(ch['COMMAND']);
			//	debugger;
			//	continue;
			//}

			if (ch['COMMAND'][0] == 'NEW') {
				if (_t.validateNewCommand(ch)) {

					sObj = {
						command: 'add', //ch['COMMAND'][0].toLowerCase(),
						object: _t.class,
						params: populateParams(ch)
					};

                    if(_t.client_object){
                        sObj.client_object = _t.client_object;
                    }

					sQuery(ch);

				}
				else totalError++;
			} else {
				sObj = {
					command: ch['COMMAND'][0].toLowerCase(),
					object: _t.class,
					params: populateParams(ch)
				};

                if(_t.client_object){
                    sObj.client_object = _t.client_object;
                }

                //asd

				sQuery(ch);
			}
		}

	};

	MB.TableN.prototype.makeOperation = function (operation, callback) {
		var _t = this;
		var operationName, params;
		var preArr = _t.ct_instance.selection2.data, selArr = [];

		if (typeof operation == 'object') {
			operationName = operation.operationName;
			if (operation.params instanceof Array) {
				params = _t.ct_instance.isDisabledCtx(operation.params[0]);
				for (var i = 1; i < operation.params.length; i++) {
					for (var j in params) {
						params[j] = params[j] || _t.ct_instance.isDisabledCtx(operation.params[i])[j];
					}
				}
			} else params = _t.ct_instance.isDisabledCtx(operation.params);
			for (var i in params) if (params[i] == !!operation.revert) selArr.push(preArr[i]);
		} else {
			operationName = operation;
			selArr = preArr;
		}


		var totalOk = 0;
		var totalErr = 0;
		var primaryKeys = _t.profile['extra_data']['object_profile']['primary_key'].split(',');

		if (!selArr || !selArr.length) {
			var o = {
				command: 'operation',
				object: operationName
			};
//            for(var k in primaryKeys){
//                o[primaryKeys[k]] = item[_t.ct_instance.data.NAMES.indexOf(primaryKeys[k])];
//            }
			socketQuery(o, function (res) {
				if (socketParse(res)) {
					totalOk++;
				} else {
					totalErr++;
				}
				finished();
			});
		}

		for (var i in selArr) {
			var item = selArr[i];
			var o = {
				command: 'operation',
				object: operationName
			};

			for (var k in primaryKeys) {
				o[primaryKeys[k]] = item[primaryKeys[k]];
			}


			socketQuery(o, function (res) {
				if (socketParse(res)) {
					totalOk++;
				} else {
					totalErr++;
				}
				finished();
			});
		}

		function finished() {
			if (!selArr || !selArr.length || ((totalOk + totalErr) == selArr.length)) {
				if (typeof callback == "function") {
					callback();
				}
//				_t.reload();
				if (_t.parentObject) {
					_t.parentObject.reload();
				}
				else _t.reload();
			}
		}
	};

	MB.TableN.prototype.openRowInModal = function (cb) {
		var _t = this;
		var i;

		var flatSelection = _t.ct_instance.selection2.data;
		for (i in flatSelection) {
			var sel = flatSelection[i];
			var formId = MB.Core.guid();
			var tablePKeys = {data_columns: _t.profile['extra_data']['object_profile']['primary_key'].split(','), data: []};
			for (var j in tablePKeys['data_columns']) {
				tablePKeys['data'].push(sel[tablePKeys['data_columns'][j]]);
			}

			var openInModalO = {
				id: formId,
				name: _t.profile['extra_data']['object_profile']['open_form_client_object'],
                class: _t.class,
                client_object: _t.profile['extra_data']['object_profile']['open_form_client_object'],
				type: 'form',
				ids: [sel[tablePKeys['data_columns'][0]]],
				position: (flatSelection.length == 1) ? 'center' : 'shift',
				tablePKeys: tablePKeys
			};

			var form = new MB.FormN(openInModalO);
			form.create(function () {
				var modal = MB.Core.modalWindows.windows.getWindow(formId);
				$(modal).on('close', function () {
//					console.log('modal closing trigger');
					_t.reload();
				});

				$(form).on('update', function () {
//					console.log('form update trigger');
					_t.reload();
				});

                if(typeof cb == 'function'){
                    cb();
                }

			});
		}

//        var formId = MB.Core.guid();
//        var openInModalO = {
//            id : formId,
//            name : _t.profile['extra_data']['object_profile']['OPEN_FORM_CLIENT_OBJECT'],
//            type : 'form',
//            ids : [_t.ct_instance.data.DATA[_t.ct_instance.selectedRowIndex][_t.ct_instance.data.NAMES.indexOf(_t.profile['extra_data']['object_profile']['PRIMARY_KEY'].split(',')[0])]],
//            position: 'center'
//        };
//
//        console.log('IDS', _t);
//
//        var form = new MB.FormN(openInModalO);
//        form.create(function(){
//            var modal = MB.Core.modalWindows.windows.getWindow(formId);
//            $(modal).on('close', function(){
//                console.log('modal closing trigger');
//                _t.reload();
//            });
//
//            $(form).on('update', function(){
//                console.log('form update trigger');
//                _t.reload();
//            });
//        });
	};

    MB.TableN.prototype.openFormById = function (id, cb) {
        var _t = this;

        _t.ct_instance.clearAllSelection();
        _t.ct_instance.setRowSelectedById(id);
        _t.openRowInModal(cb);

    };

}());

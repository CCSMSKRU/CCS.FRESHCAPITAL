(function () {
	MB = MB || {};
	MB.FormsConstructor = function () {
		this.forms = [];
	};
	MB.Forms = new MB.FormsConstructor();

    function getPercentColor(percent){
        percent = (!isNaN(+percent))? +percent : 0;
        var res = '';

        if(percent == 0){
            res = '#000';
        }else if(percent > 0 && percent <= 25){
            res = '#B10A0A';
        }else if(percent > 25 && percent < 50){
            res = '#934FE0';
        }else if(percent > 50 && percent < 75){
            res = '#4580D4';
        }else if(percent > 75 && percent < 100){
            res = '#5ECC8D';
        }else{ // 100%
            res = '#109C10';
        }

        return res;
    }


	MB.FormN = function (params) {

        console.log('New form init', params);

		this.id = params.id || MB.Core.guid();
		this.class = params.class;
		this.client_object = params.client_object;
		this.data = undefined;
		this.name = params.name || 'unnamed';
		this.type = params.type;
		this.activeId = params.ids[0];
		this.modalId = undefined;
		this.position = params.position || 'fullscreen';
		this.changes = [];
		this.tblInstances = [];
		this.params = params.params || {};
		this.isMaster = params.master || false;
		this.modalInstance = undefined;
		this.tablePKeys = params.tablePKeys;
	};

	MB.FormsConstructor.prototype.addForm = function (form) {
		this.forms.push(form);
	};

	MB.FormsConstructor.prototype.getForm = function (name, id) {
		var _t = this;
		for (var i in _t.forms) {
			var form = _t.forms[i];
			if (form.id == id && form.name == name) {
				return form;
			}
		}
	};


	MB.FormsConstructor.prototype.removeForm = function (id) {
		var _t = this;
		for (var i in _t.forms) {
			var form = _t.forms[i];
			if (form.id == id) {
				this.forms.splice(i, 1);
			}
		}
	};

    MB.FormN.prototype.ckEditors = [];

	MB.FormN.prototype.getProfile = function (name, callback) {
		var _t = this;
		if (this.name === 'unnamed') {
			console.warn('form without name');
			return false;
		} else {
			if (localStorage.getItem('formN_' + name) !== null) {

				_t.profile = JSON.parse(localStorage.getItem('formN_' + name));

				if (typeof callback == 'function') {
					callback();
				}
			} else {
				var o = {
					command: 'getProfile',
					object: _t.class,
					client_object: name
				};


				socketQuery(o, function (r) {

					_t.profile = r;

					localStorage.setItem('formN_' + name, JSON.stringify(r));
					if (typeof callback == 'function') {
						callback();
					}
				});
			}
		}
	};

	MB.FormN.prototype.getData = function (callback) {
		var _t = this;

		if (_t.activeId === 'new') {
			_t.data = 'new';
			_t.wasNew = true;
			if (typeof callback == 'function') {
				callback();
			}
		} else {
			var activeIdStr = (isNaN(+_t.activeId)) ? "'" + _t.activeId + "'" : _t.activeId;
			var where = [];

			if (_t.tablePKeys) {

				//console.log('ccolumns', _t.tablePKeys['data_columns']);

				for (var i in _t.tablePKeys['data_columns']) {
					var wo = {
						key: (typeof _t.tablePKeys['data_columns'][i] == 'object')? _t.tablePKeys['data_columns'][i][0] : _t.tablePKeys['data_columns'][i],
						val1: (typeof _t.tablePKeys['data'][i] == 'object')? _t.tablePKeys['data'][i] : _t.tablePKeys['data'][i]
					};
					//wo[_t.tablePKeys['data_columns'][i]] = _t.tablePKeys['data'][i];
					where.push(wo);
					//where.push(_t.tablePKeys['data_columns'][i] + " = '" + _t.tablePKeys['data'][i] + "'");
				}

				//var defWhere = _t.profile.extra_data.object_profile.default_where;

				//if (defWhere) where.push(defWhere);
				//where = where.join(' AND ');
			} else {
				var wo2 = {
					key: _t.profile['extra_data']['object_profile']['primary_key'],
					val1: activeIdStr
				};
				//wo2[_t.profile['extra_data']['object_profile']['primary_key']] = activeIdStr;
				where.push(wo2);
				//where = _t.profile['extra_data']['object_profile']['primary_key'] + ' = ' + activeIdStr;
			}

			var o = {
				command: 'get',
				object: _t.class,
				params: {
					where: where
				}
			};

            if(_t.client_object.length > 0){
                o.cleint_object = _t.client_object;
            }

			socketQuery(o, function (r) {
				_t.data = r;
				if (typeof callback == 'function') {
					callback();
				}
			});
		}

	};

	MB.FormN.prototype.create = function (callback) {
		var _t = this;
		_t.getProfile(_t.name, function () {
			_t.getData(function () {
				_t.getTemplate(function () {
					_t.createContent(function () {
						//_t.createChildTables('', function () {
						_t.createChildTablesSplited(function () {
							_t.initControllers(function () {
								MB.Forms.addForm(_t);
								_t.getScript(function () {
									MB.Core.createButtons(_t);
									_t.setHandlers(function () {
										if (typeof callback == 'function') {
											callback(_t);
										}
									});
								});
							});
						});
					});
				});
			});
		});
	};

	MB.FormN.prototype.populateFieldByName = function (fieldName) {
		var _t = this,
			field = {};
		var idx = 0;
		field.profile = [];

		for (var i in _t.profile.data) {
			var item = _t.profile.data[i];

			if (item['column_name'] == fieldName) {

				field.profile.push(item);
				idx++;
				break;
			}

		}

		if (_t.activeId !== 'new') {
			field.value = _t.data.data[0][fieldName];
			field.selValue = (field.profile[0]['lov_columns'].length > 0)? _t.data.data[0][field.profile[0]['lov_columns'].split(',')[0]] : '';
		} else {
			field.value = '';
			field.selValue = '';
		}

		field.name = fieldName;
		return field;
	};

	MB.FormN.prototype.initControllers = function (callback) {
		var _t = this;
		for (var i in _t.fields) {
			var f = _t.fields[i];
			var profData = f.profile[0];
			var type = profData['type_of_editor'];
			var columnName = profData['column_name'];

			if ($('#mw-' + _t.modalId).find('.fn-field[data-column="' + f.name + '"]').length > 0) {

				var parent = $('#mw-' + _t.modalId).find('.fn-field[data-column="' + f.name + '"]');
				var checkboxWrapper = parent.find('.checkbox-wrapper');
				var wysiwygWrapper = parent.find('.wysiwyg-wrapper');
				var selectWrapper = parent.find('.fn-select3-wrapper');
				var phoneInput = parent.find('input');

				var queryObject = f.profile[0]['lov_command'];
				var forSelectId = f.profile[0]['column_name'];
				var column_name = f.profile[0]['column_name'];
				var forSelectName = f.profile[0]['lov_columns'].split(',')[1];
                var return_id = f.profile[0]['return_id'];
                var return_name = f.profile[0]['return_name'];
				var forSelectViewName = f.profile[0]['reference_client_object'];
				var forSelectLovWhere = f.profile[0]['lov_where'];

				var selInstance = undefined;
				switch (type) {
					case 'text':
						break;
                    case 'wysiwyg':
//                        wysiwygWrapper.elrte({
//                            lang         : 'ru',
//                            styleWithCSS : false,
//                            height       : 400,
//                            toolbar      : 'maxi'
//                        });
                        var ed = CKEDITOR.replace(wysiwygWrapper[0]);
                        ed.type = type;
                        ed.column_name = columnName;
                        _t.ckEditors.push(ed);

                        tinymce.init({
                            selector: '.wysiwyg-wrapper',
                            init_instance_callback: function (editor) {
                                editor.on('KeyUp', function (e) {

                                    var block = $(editor.editorContainer).parents('.fn-field').eq(0);
                                    var columnName = block.attr('data-column');
                                    var type = block.attr('data-type');
                                    var dataValue = "";
                                    var value = editor.getContent();

                                    var chO = {
                                        column_name: columnName,
                                        type: type,
                                        value: {
                                            value: value,
                                            selValue: ''
                                        }
                                    };

                                    if (_t.data != "new") dataValue = _t.data.data[0][columnName];

                                    if (value != dataValue) {
                                        _t.addChange(chO);
                                    }
                                    else {
                                        _t.removeChange(chO);
                                    }


                                });
                            }
                        });

                        break;
					case 'select2':
                        //class & column_name

						selInstance = MB.Core.select3.init({
                            id :                MB.Core.guid(),
                            wrapper:            selectWrapper,
                            column_name:        column_name,
                            class:              _t.class,
                            client_object:      _t.client_object,
                            return_id:          return_id,
                            return_name:        return_name,
                            withSearch:         true,
                            withEmptyValue:     false,
                            absolutePosition:   true,
                            isFilter:           false,
                            parentObject:       _t,
                            value: {
                            	id: (f.selValue == '') ? 'empty' : f.selValue,
                            	name: (f.value == '') ? '' : f.value
                            },
                            additionalClass:    ''


                            //id: MB.Core.guid(),
							//wrapper: selectWrapper,
							//getString: queryObject,
							//column_name: forSelectId,
							//view_name: forSelectViewName,
							//value: {
							//	id: (f.selValue == '') ? 'empty' : f.selValue,
							//	name: (f.value == '') ? '' : f.value
							//},
							//data: [],
							//isSearch: true,
							//fromServerIdString: forSelectId,
							//fromServerNameString: forSelectName,
							//searchKeyword: forSelectName,
							//withEmptyValue: false,
							//absolutePosition: true,
							//parentObject: _t,
							//dependWhere: (forSelectLovWhere.indexOf('[:') != -1) ? forSelectLovWhere : '',
							//profile_column_name: f.name
						});
						break;
					case 'select2withEmptyValue':
						selInstance = MB.Core.select3.init({

                            id :                MB.Core.guid(),
                            wrapper:            selectWrapper,
                            column_name:        column_name,
                            class:              _t.class,
                            client_object:      _t.client_object,
                            return_id:          return_id,
                            return_name:        return_name,
                            withSearch:         true,
                            withEmptyValue:     true,
                            absolutePosition:   true,
                            isFilter:           false,
                            parentObject:       _t,
                            value: {
                                id: (f.selValue == '') ? 'empty' : f.selValue,
                                name: (f.value == '') ? '' : f.value
                            },
                            additionalClass:    ''

                            //id: MB.Core.guid(),
							//wrapper: selectWrapper,
							//getString: queryObject,
							//column_name: forSelectId,
							//view_name: forSelectViewName,
							//value: {
							//	id: (f.selValue == '') ? 'empty' : f.selValue,
							//	name: (f.value == '') ? '' : f.value
							//},
							//data: [],
							//isSearch: true,
							//fromServerIdString: forSelectId,
							//fromServerNameString: forSelectName,
							//searchKeyword: forSelectName,
							//withEmptyValue: true,
							//absolutePosition: true,
							//parentObject: _t,
							//dependWhere: (forSelectLovWhere.indexOf('[:') != -1) ? forSelectLovWhere : '',
							//profile_column_name: f.name
						});
						break;
					case 'select2FreeType':
						selInstance = MB.Core.select3.init({
                            id :                MB.Core.guid(),
                            wrapper:            selectWrapper,
                            column_name:        column_name,
                            class:              _t.class,
                            client_object:      _t.client_object,
                            return_id:          return_id,
                            return_name:        return_name,
                            withSearch:         true,
                            withEmptyValue:     true,
                            absolutePosition:   true,
                            isFilter:           false,
                            parentObject:       _t,
                            value: {
                                id: (f.selValue == '') ? 'empty' : f.selValue,
                                name: (f.value == '') ? '' : f.value
                            },
                            additionalClass:    ''

                            //id: MB.Core.guid(),
							//wrapper: selectWrapper,
							//getString: queryObject,
							//column_name: forSelectId,
							//view_name: forSelectViewName,
							//value: {
							//	id: (f.selValue == '') ? 'empty' : f.selValue,
							//	name: (f.value == '') ? '' : f.value
							//},
							//data: [],
							//fromServerIdString: forSelectId,
							//fromServerNameString: forSelectName,
							//searchKeyword: forSelectName,
							//withEmptyValue: true,
							//freeType: true,
							//absolutePosition: true,
							//isSearch: true,
							//parentObject: _t,
							//dependWhere: (forSelectLovWhere.indexOf('[:') != -1) ? forSelectLovWhere : '',
							//profile_column_name: f.name
						});
						break;
					case 'checkbox':
						checkboxWrapper.checkboxIt();
						break;
					case 'phone':
						phoneInput.phoneIt();
						break;
					default:
						break;
				}
			}
		}

		if (typeof callback == 'function') {
			callback();
		}
	};

	MB.FormN.prototype.createField = function (field) {
		var _t = this;
		_t.fields.push(field);
		var html = '';
		var nameRu = field.profile[0]['name'];
		var typeOfEditor = field.profile[0]['type_of_editor'];

		var required = (field.profile[0]['required']) ? 'required' : '';

		// set required by field LOV_RETURN_TO_COLUMN required value;
		var returnToColumnValue = (field.profile[0]['lov_return_to_column'] != "") ? field.profile[0]['lov_return_to_column'] : field.profile[0]['column_name'];
		if (returnToColumnValue != "") {
			for (var i in _t.profile.data) {
				var fld = _t.profile.data[i];
				var cellName = fld['column_name'];
				if (returnToColumnValue == cellName) {
					if (fld['required']) {
						required = 'required';
					}
				}
			}
		}

		var isVisible = field.profile[0]['visible'];

		if (!isVisible) {
			return html;
		}

		if (field.profile[0]['editable'] || ((_t.activeId !== 'new' && field.profile[0]['updatable']) || (_t.activeId === 'new' && field.profile[0]['insertable']))) {
            if (typeof field.value==='string'){
                field.value = field.value.replaceAll('"','&#34;');
            }


			switch (typeOfEditor) {
				case 'text':
					html = '<div data-type="' + typeOfEditor + '" class="fn-field ' + required + '" data-column="' + field.name + '"><label>' + nameRu + ': <span class="required-star">*</span></label><input type="text" class="fn-control" data-column="' + field.name + '" value="' + field.value + '" /></div>';
					break;
				case 'textarea':
					html = '<div data-type="' + typeOfEditor + '" class="fn-field ' + required + '" data-column="' + field.name + '"><label>' + nameRu + ': <span class="required-star">*</span></label><textarea class="fn-control" data-column="' + field.name + '" value="' + field.value + '">' + field.value + '</textarea></div>';
					break;
                case 'wysiwyg':
                    html = '<div data-type="' + typeOfEditor + '" class="fn-field ' + required + '" data-column="' + field.name + '"><label>' + nameRu + ': <span class="required-star">*</span></label><textarea class="fn-control wysiwyg-wrapper" data-column="' + field.name + '" value="' + field.value + '">' + field.value + '</textarea></div>';
                    break;
				case 'checkbox':
					var checkedClass = (field.value == 'true') ? 'checked' : '';
					html = '<div data-type="' + typeOfEditor + '" class="fn-field ' + required + '" data-column="' + field.name + '"><label class="fn-checkbox-label">' + nameRu + ' <span class="required-star">*</span></label><div data-id="' + MB.Core.guid() + '" data-type="inline" class="fn-control checkbox-wrapper ' + checkedClass + '" data-value="' + field.value + '" data-column="' + field.name + '" ></div></div>';
					break;
				case 'select2':
					html = '<div data-type="' + typeOfEditor + '" class="fn-field ' + required + '" data-column="' + field.name + '"><label>' + nameRu + ': <span class="required-star">*</span></label><div data-value="' + field.value + '" data-select-type="select2" data-column="' + field.name + '" class="fn-control fn-select3-wrapper"></div></div>';
					break;
				case 'select2withEmptyValue':
					html = '<div data-type="' + typeOfEditor + '" class="fn-field ' + required + '" data-column="' + field.name + '"><label>' + nameRu + ': <span class="required-star">*</span></label><div data-value="' + field.value + '" data-select-type="select2withEmptyValue" data-column="' + field.name + '" class="fn-control fn-select3-wrapper"></div></div>';
					break;
				case 'select2FreeType':
					html = '<div data-type="' + typeOfEditor + '" class="fn-field ' + required + '" data-column="' + field.name + '"><label>' + nameRu + ': <span class="required-star">*</span></label><div data-value="' + field.value + '" data-select-type="select2FreeType" data-column="' + field.name + '" class="fn-control fn-select3-wrapper"></div></div>';
					break;
				case 'datetime':
					html = '<div data-type="' + typeOfEditor + '" class="fn-field ' + required + '" data-column="' + field.name + '"><label>' + nameRu + ': <span class="required-star">*</span></label><input type="text" class="fn-control fn-datetime-wrapper" data-column="' + field.name + '" value="' + field.value + '" data-date-format="dd.mm.yyyy hh:ii:ss"></div>';
					break;
				case 'datetime_wo_sec':
					html = '<div data-type="' + typeOfEditor + '" class="fn-field ' + required + '" data-column="' + field.name + '"><label>' + nameRu + ': <span class="required-star">*</span></label><input type="text" class="fn-control fn-datetime-wrapper" data-column="' + field.name + '" value="' + field.value.substr(0, 16) + '" data-date-format="dd.mm.yyyy hh:ii"></div>';
					break;
				case 'date':
					html = '<div data-type="' + typeOfEditor + '" class="fn-field ' + required + '" data-column="' + field.name + '"><label>' + nameRu + ': <span class="required-star">*</span></label><input type="text" class="fn-control fn-date-wrapper" data-column="' + field.name + '" value="' + field.value + '" data-date-format="dd.mm.yyyy"></div>';
					break;
				case 'time':
					html = '<div data-type="' + typeOfEditor + '" class="fn-field ' + required + '" data-column="' + field.name + '"><label>' + nameRu + ': <span class="required-star">*</span></label><input type="text" class="fn-control fn-time-wrapper" data-column="' + field.name + '" value="' + field.value + '" data-date-format="hh:ii:ss"></div>';
					break;
				case 'colorpicker':
					html = '<div data-type="' + typeOfEditor + '" class="fn-field ' + required + '" data-column="' + field.name + '"><label>' + nameRu + ': <span class="required-star">*</span></label><input type="text" class="fn-control fn-colorpicker-wrapper" data-column="' + field.name + '" value="' + field.value + '" /><div class="fn-colorpicker-state" style="background-color: ' + field.value + '" ></div></div>';
					break;
				case 'number':
					html = '<div data-type="' + typeOfEditor + '" class="fn-field ' + required + '" data-column="' + field.name + '"><label>' + nameRu + ': <span class="required-star">*</span></label><input type="number" class="fn-control" data-column="' + field.name + '" value="' + field.value + '" /></div>';
					break;
                case 'float2':
                    html = '<div data-type="' + typeOfEditor + '" class="fn-field ' + required + '" data-column="' + field.name + '"><label>' + nameRu + ': <span class="required-star">*</span></label><input type="number" step="0.01" class="fn-control" data-column="' + field.name + '" value="' + field.value + '" /></div>';
                    break;
				case 'phone':
					html = '<div data-type="' + typeOfEditor + '" class="fn-field ' + required + '" data-column="' + field.name + '"><label>' + nameRu + ': <span class="required-star">*</span></label><input type="text" class="fn-control" data-column="' + field.name + '" value="' + field.value + '" /></div>';
					break;
				case 'File':
					html = '<div data-type="' + typeOfEditor + '" class="fn-field ' + required + '" data-column="' + field.name + '"><label>' + nameRu + ': <span class="required-star">*</span></label><input type="text" class="fn-control fn-file-wrapper" data-column="' + field.name + '" value="' + field.value + '" /></div>';
					break;
				default:
					html = '<div data-type="' + typeOfEditor + '" class="fn-field ' + required + '" data-column="' + field.name + '"><label>' + nameRu + ': <span class="required-star">*</span></label><input type="text" class="fn-control" data-column="' + field.name + '" value="' + field.value + '" /></div>';
					break;
			}
		} else {
			if (_t.activeId === 'new') {
				html = '';
			} else {
                if(typeOfEditor == 'checkbox'){

                    var checksign = (field.value == true || field.value == 'true')? '<i class="fa fa-check fn-readonly-checkbox-sign"></i>' : '<i class="fa fa-times fn-readonly-checkbox-sign"></i>' ;

                    html = '<div data-type="' + typeOfEditor + '" class="fn-field fn-readonly-field" data-value="' + field.value + '" data-column="' + field.name + '"><label>' + nameRu + ':</label><div class="fn-readonly">' + checksign + '</div></div>';
                }else if(typeOfEditor == 'percent'){
                    html = '<div data-type="' + typeOfEditor + '" class="fn-field fn-readonly-field" data-value="' + field.value + '" data-column="' + field.name + '"><label>' + nameRu + ':</label><div class="readonlyCell percent-readonly" data-value="'+field.value+'"><div class="percent-readonly-bar" style="width:'+field.value+'%; background-color: '+ getPercentColor(field.value)+';"></div><div class="percent-readonly-text">'+field.value+'%</div></div></div>';
                }else{
                    html = '<div data-type="' + typeOfEditor + '" class="fn-field fn-readonly-field" data-value="' + field.value + '" data-column="' + field.name + '"><label>' + nameRu + ':</label><div class="fn-readonly">' + field.value + '</div></div>';
                }
			}
		}
		return html;

	};

	MB.FormN.prototype.getTemplate = function (callback) {
		var _t = this;
		var url = "html/forms/" + _t.name + "/" + _t.name + ".html";
		var url2 = "html/forms/" + _t.name + "/" + _t.name + ".html";
		if (_t.activeId == 'new') { //&& _t.profile['OBJECT_PROFILE']['CHILD_CLIENT_OBJECT'] != ''
			url = "html/forms/" + _t.name + "/" + _t.name + "_add" + ".html";
		} else {
			url = "html/forms/" + _t.name + "/" + _t.name + ".html";
		}

		$.ajax({
			url: url,
			success: function (res, status, xhr) {
				_t.template = res;
				if (typeof callback == 'function') {
					callback();
				}
			},
			error: function () {
				$.ajax({
					url: url2,
					success: function (res, status, xhr) {
						_t.template = res;
						if (typeof callback == 'function') {
							callback();
						}
					}
				});
			}
		});
	};

	MB.FormN.prototype.getScript = function (callback) {
		var _t = this;
		var load = function (url) {
			$.ajax({
				crossDomain: true,
				dataType: "script",
				url: url,
				success: function () {
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

			/*$.getScript( url, function() {
			 if(typeof callback == 'function'){
			 callback();
			 }
			 });*/
		};
		MB.Forms.justLoadedId = _t.id;
		if (_t.activeId == 'new' && _t.profile['extra_data']['object_profile']['child_client_object'] != '') {
			load("html/forms/" + _t.name + "/" + _t.name + "_add" + ".js");

		} else {
			load("html/forms/" + _t.name + "/" + _t.name + ".js");
		}

	};

    MB.FormN.prototype.createOneChildTbls = function(wrap, names, cb){

        var _t = this;

        console.log('==================!!=========', wrap, names);

        var afterChildLoaded = $('#mw-' + _t.modalId).find('.afterChildLoaded'); // ХЗ че это..

        var childName = names;
        var tblInstances = [];

        var tabsTpl = '<div class="tabsParent sc_tabulatorParent floated">' +
            '<div class="tabsTogglersRow sc_tabulatorToggleRow">' +
            '{{#tabs}}' +
            '<div class="tabToggle sc_tabulatorToggler {{opened}}" dataitem="{{dataitem}}">' +
            '<span class="childObjectTabTitle" data-name="{{name}}" data-item="{{dataitem}}">{{{tab_title}}}</span>' +
            '</div>' +
            '{{/tabs}}' +
            '</div>' +

            '<div class="ddRow sc_tabulatorDDRow">' +
            '{{#tabContents}}' +
            '<div class="tabulatorDDItem noMinHeight noMaxHeight sc_tabulatorDDItem {{opened}}" dataitem="{{dataitem}}">' +
            '<div class="childObjectWrapper" data-item="{{dataitem}}"></div>' +
            '</div>' +
            '{{/tabContents}}' +
            '</div>' +
            '</div>';

        var singleTabTpl = '<div class="tabsParent sc_tabulatorParent floated">' +
            '<div class="ddRow sc_tabulatorDDRow">' +
            '{{#tabContents}}' +
            '<div class="tabulatorDDItem noMinHeight noMaxHeight sc_tabulatorDDItem {{opened}}" dataitem="{{dataitem}}">' +
            '<div class="childObjectWrapper" data-item="{{dataitem}}"></div>' +
            '</div>' +
            '{{/tabContents}}' +
            '</div>' +
            '</div>';


        if (childName && childName != '') {

            if (_t.activeId == 'new') {
                if (typeof callback == 'function') {
                    callback();
                }
                return;
            }


            var childsArr = childName.split(',');
            var childTbl = undefined;
            var mO = {
                tabs: [],
                tabContents: []
            };
            for (var i in childsArr) {
                var chld = childsArr[i];
                var chld_class = (chld.substring(0, chld.indexOf('.')).length > 0)? chld.substring(0, chld.indexOf('.')) : 'EMPTY';
                var chld_clinetObject = (chld.substr(chld.indexOf('.') + 1).length > 0)? chld.substr(chld.indexOf('.') + 1) : 'EMPTY';

                childTbl = new MB.TableN({
                    id: MB.Core.guid(),
                    class: (chld_class != 'EMPTY')? chld_class : chld,
                    client_object: (chld_clinetObject != 'EMPTY')? chld_clinetObject : '',
                    parentObject: _t,
                    parent_id: (_t.activeId == 'new') ? 'new' : (isNaN(+_t.data.data[0][_t.profile['extra_data']['object_profile']['primary_key']])) ? "'" + _t.data.data[0][_t.profile['extra_data']['object_profile']['primary_key']] + "'" : _t.data.data[0][_t.profile['extra_data']['object_profile']['primary_key']]
                });

                mO.tabs.push({
                    opened: (i == 0) ? 'opened' : '',
                    dataitem: i,
                    tab_title: '<i class="fa fa-spin fa-spinner"></i>',
                    name: chld
                });

                mO.tabContents.push({
                    opened: (i == 0) ? 'opened' : '',
                    dataitem: i
                });

                tblInstances.push(childTbl);
            }

            if (childsArr.length == 1) {
                wrap.html(Mustache.to_html(singleTabTpl, mO));
            } else {
                wrap.html(Mustache.to_html(tabsTpl, mO));
            }


            uiTabs();
            var idx = 0;
            var tabsTitlesArr = [];
            var tabsTitlesWrappers = wrap.find('.childObjectTabTitle');

            var toCreateArray = [];

            function tryCallback(idx) {
                if (idx == toCreateArray.length - 1) {
                    afterChildLoaded.animate({
                        opacity: 1
                    }, 500);
                    if (typeof cb == 'function') {
                        cb();
//                        console.log('как будто бы отрисовал..');
                    }
                }
            }
            function syncCreateTables(item) {
                var instance = item.instance;
                var wrapper = item.wrapper;
                var currIdx = parseInt(item.idx);

                instance.create(wrapper, function (tblInstance) {
                    if(tblInstance == 'ERROR'){
                        tryCallback(currIdx);
                    }else{
                        _t.tblInstances.push(tblInstance);
                        if (childsArr.length == 1) {

                            tblInstance.ct_instance.wrapper.parents('.sc_tabulatorParent').find('.ct-environment-header').html(tblInstance.profile.extra_data['object_profile']['name_ru']);
                        } else {

                            tblInstance.ct_instance.wrapper.parents('.sc_tabulatorParent').find('.childObjectTabTitle[data-name="' + tblInstance.coAndClass + '"]').html(tblInstance.profile.extra_data['object_profile']['name_ru']);
                        }
                        for (var k in toCreateArray) {
                            var t = toCreateArray[k];
                            if (t.idx == toCreateArray.length - 1) {
                                tryCallback(currIdx);
                            } else {
                                if (currIdx == toCreateArray[k].idx) {
//                                console.log('Go Go next', toCreateArray[0], toCreateArray[1], currIdx+1);
                                    syncCreateTables(toCreateArray[currIdx + 1]);
                                }
                            }
                        }
                    }
                });
            }


            for (var i in tblInstances) {
                var inst = tblInstances[i];
                var instWrapper = wrap.find('.childObjectWrapper[data-item="' + i + '"]');
                var to = {
                    instance: inst,
                    wrapper: instWrapper,
                    idx: i
                };
                toCreateArray.push(to);
                if (idx == tblInstances.length -1) {
                    syncCreateTables(toCreateArray[0]);
                }
                idx++;
            }

        } else {
            if (typeof cb == 'function') {
                cb();
            }
        }


    };

    MB.FormN.prototype.createChildTablesSplited = function(cb){
        var _t = this;

        var tbl_wrappers = _t.container.find('.fn-child-tbl-holder');
        var tblIdx = 0;
        function tryNextTbl(wrap){

            var tbls = wrap.attr('data-tbls');

            _t.createOneChildTbls(wrap, tbls, function(){
                tblIdx++;
                if(tblIdx < tbl_wrappers.length){
                    tryNextTbl(tbl_wrappers.eq(tblIdx));
                }
            });
        }

        tryNextTbl(tbl_wrappers.eq(tblIdx));

        if(typeof cb == 'function'){
            cb();
        }

        //tbl_wrappers.each(function(i, e){
        //
        //    var wrap = $(e);
        //    var tbls = wrap.attr('data-tbls');
        //
        //    _t.createOneChildTbls(wrap, tbls, function(){
        //
        //    });
        //
        //
        //});
        //
        //if(typeof cb == 'function'){
        //    cb();
        //}


    };

	MB.FormN.prototype.createChildTables = function (name, callback) {
		var _t = this;

		var childName = (name == '') ? _t.profile['extra_data']['object_profile']['child_client_object'] : name;

		var childObjectsWrapper = $('#mw-' + _t.modalId).find('.fn-child-objects-tabs-wrapper');
		var afterChildLoaded = $('#mw-' + _t.modalId).find('.afterChildLoaded');

		var tblInstances = [];

		var tabsTpl = '<div class="tabsParent sc_tabulatorParent floated">' +
			'<div class="tabsTogglersRow sc_tabulatorToggleRow">' +
			'{{#tabs}}' +
			'<div class="tabToggle sc_tabulatorToggler {{opened}}" dataitem="{{dataitem}}">' +
			'<span class="childObjectTabTitle" data-name="{{name}}" data-item="{{dataitem}}">{{{tab_title}}}</span>' +
			'</div>' +
			'{{/tabs}}' +
			'</div>' +

			'<div class="ddRow sc_tabulatorDDRow">' +
			'{{#tabContents}}' +
			'<div class="tabulatorDDItem noMinHeight noMaxHeight sc_tabulatorDDItem {{opened}}" dataitem="{{dataitem}}">' +
			'<div class="childObjectWrapper" data-item="{{dataitem}}"></div>' +
			'</div>' +
			'{{/tabContents}}' +
			'</div>' +
			'</div>';

		var singleTabTpl = '<div class="tabsParent sc_tabulatorParent floated">' +
			'<div class="ddRow sc_tabulatorDDRow">' +
			'{{#tabContents}}' +
			'<div class="tabulatorDDItem noMinHeight noMaxHeight sc_tabulatorDDItem {{opened}}" dataitem="{{dataitem}}">' +
			'<div class="childObjectWrapper" data-item="{{dataitem}}"></div>' +
			'</div>' +
			'{{/tabContents}}' +
			'</div>' +
			'</div>';


		if (childName != '') {
			if (_t.activeId == 'new') {
				if (typeof callback == 'function') {
					callback();
				}
				return;
			}
			var childsArr = childName.split(',');
			var childTbl = undefined;
			var mO = {
				tabs: [],
				tabContents: []
			};
			for (var i in childsArr) {
				var chld = childsArr[i];
                var chld_class = (chld.substring(0, chld.indexOf('.')).length > 0)? chld.substring(0, chld.indexOf('.')) : 'EMPTY';
                var chld_clinetObject = (chld.substr(chld.indexOf('.') + 1).length > 0)? chld.substr(chld.indexOf('.') + 1) : 'EMPTY';
				childTbl = new MB.TableN({
					id: MB.Core.guid(),
					class: (chld_class != 'EMPTY')? chld_class : chld,
					client_object: (chld_clinetObject != 'EMPTY')? chld_clinetObject : '',
					parentObject: _t,
					parent_id: (_t.activeId == 'new') ? 'new' : (isNaN(+_t.data.data[0][_t.profile['extra_data']['object_profile']['primary_key']])) ? "'" + _t.data.data[0][_t.profile['extra_data']['object_profile']['primary_key']] + "'" : _t.data.data[0][_t.profile['extra_data']['object_profile']['primary_key']]
				});

				mO.tabs.push({
					opened: (i == 0) ? 'opened' : '',
					dataitem: i,
					tab_title: '<i class="fa fa-spin fa-spinner"></i>',
					name: chld
				});

				mO.tabContents.push({
					opened: (i == 0) ? 'opened' : '',
					dataitem: i
				});

				tblInstances.push(childTbl);
			}

			if (childsArr.length == 1) {
				childObjectsWrapper.html(Mustache.to_html(singleTabTpl, mO));
			} else {
				childObjectsWrapper.html(Mustache.to_html(tabsTpl, mO));
			}


			uiTabs();
			var idx = 0;
			var tabsTitlesArr = [];
			var tabsTitlesWrappers = childObjectsWrapper.find('.childObjectTabTitle');

			var toCreateArray = [];

			function tryCallback(idx) {
				if (idx == toCreateArray.length - 1) {
					afterChildLoaded.animate({
						opacity: 1
					}, 500);
					if (typeof callback == 'function') {
						callback();
//                        console.log('как будто бы отрисовал..');
					}
				}
			}
			function syncCreateTables(item) {
				var instance = item.instance;
				var wrapper = item.wrapper;
				var currIdx = parseInt(item.idx);

				instance.create(wrapper, function (tblInstance) {

                    if(tblInstance == 'ERROR'){
                        tryCallback(currIdx);
                    }else{
                        _t.tblInstances.push(tblInstance);
                        if (childsArr.length == 1) {

                            tblInstance.ct_instance.wrapper.parents('.sc_tabulatorParent').find('.ct-environment-header').html(tblInstance.profile.extra_data['object_profile']['name_ru']);
                        } else {

                            tblInstance.ct_instance.wrapper.parents('.sc_tabulatorParent').find('.childObjectTabTitle[data-name="' + tblInstance.coAndClass + '"]').html(tblInstance.profile.extra_data['object_profile']['name_ru']);
                        }
                        for (var k in toCreateArray) {
                            var t = toCreateArray[k];
                            if (t.idx == toCreateArray.length - 1) {
                                tryCallback(currIdx);
                            } else {
                                if (currIdx == toCreateArray[k].idx) {
//                                console.log('Go Go next', toCreateArray[0], toCreateArray[1], currIdx+1);
                                    syncCreateTables(toCreateArray[currIdx + 1]);
                                }
                            }
                        }
                    }

				});
			}


			for (var i in tblInstances) {
				var inst = tblInstances[i];
				var instWrapper = childObjectsWrapper.find('.childObjectWrapper[data-item="' + i + '"]');
				var to = {
					instance: inst,
					wrapper: instWrapper,
					idx: i
				};
				toCreateArray.push(to);
				if (idx == _t.tblInstances.length) {
//                    console.log(toCreateArray);
					syncCreateTables(toCreateArray[0]);
				}
				idx++;
//
//                continue;
//
//                inst.create(instWrapper, function(tblInstance){
//                    _t.tblInstances.push(tblInstance);
//                    if(childsArr.length == 1){
//                        tblInstance.ct_instance.wrapper.parents('.sc_tabulatorParent').find('.ct-environment-header').html(tblInstance.profile['OBJECT_PROFILE']['CLIENT_OBJECT_NAME']);
//                    }else{
//                        tblInstance.ct_instance.wrapper.parents('.sc_tabulatorParent').find('.childObjectTabTitle[data-name="'+tblInstance.name+'"]').html(tblInstance.profile['OBJECT_PROFILE']['CLIENT_OBJECT_NAME']);
//                    }
//                    if(idx == _t.tblInstances.length){
//                        afterChildLoaded.animate({
//                            opacity: 1
//                        }, 500);
//                        if(typeof callback == 'function'){
//                            callback();
//                            console.log('как будто бы отрисовал..');
//                        }
//                    }
//                });
//                idx++;
			}
//            return;
//
//            var child = undefined;
//            var childWrapper = $('#mw-'+_t.modalId).find('.childObjectWrapper');
//
//
//            if(childName.length > 0){
//                child = new MB.TableN({
//                    id: MB.Core.guid(),
//                    name: childName,
//                    parentObject: _t,
//                    parent_id: _t.data.data[0][_t.data.data_columns.indexOf(_t.profile['OBJECT_PROFILE']['PRIMARY_KEY'])]
//                }).create(childWrapper, function(tblInstance){
//                        _t.tblInstance = tblInstance;
//                        afterChildLoaded.animate({
//                            opacity: 1
//                        }, 500);
//                        if(typeof callback == 'function'){
//                            callback();
//                            console.log('как будто бы отрисовал..');
//                        }
//                    });
//            }
		} else {
			if (typeof callback == 'function') {
				callback();
			}
		}
	};

	MB.FormN.prototype.insertNativeValues = function (html) {
		var _t = this;
		var fieldsArr = [];
		var keywordsArr = [];

		function populateArrays(tpl) {
			var start = tpl.indexOf('{+{');
			var end = tpl.indexOf('}+}');
			var keyword = tpl.substr(start + 3, ((end - 3) - start));

			if (start != -1) {
				keywordsArr.push(keyword);
				tpl = tpl.replace('{+{' + keyword + '}+}', '{-{' + keyword + '}-}');
			}
			for (var i in _t.fields) {
				var fld = _t.fields[i];
				if (fld.name == keyword) {
					fieldsArr.push(fld);
				}
			}
			if (start != -1) {
				populateArrays(tpl);
			}
		}

		populateArrays(html);

        console.log('--->', fieldsArr, keywordsArr);


		for (var k in fieldsArr) {
			var fld = fieldsArr[k];
			var name = fld.name;
            var type = fld.profile[0].type;

            console.log('ROROR', fld);


            if(type == 'number' || type == 'bigint' || type== 'int' || type == 'float2'){
                for (var h in keywordsArr) {
                    var kw = keywordsArr[h];
                    if (name == kw) {

                        var separate_val = fld.value.toString().replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');

                        html = html.replace('{+{' + kw + '}+}', separate_val);
                    }
                }
            }else{
                for (var h in keywordsArr) {
                    var kw = keywordsArr[h];
                    if (name == kw) {
                        html = html.replace('{+{' + kw + '}+}', fld.value);
                    }
                }
            }

		}

		function checkUnfilled() {
			var cutStart = html.indexOf('{+{');
			var cutEnd = html.indexOf('}+}');
			var keyword = html.substr(cutStart + 3, cutEnd - (cutStart + 3));
			html = html.replace('{+{' + keyword + '}+}', ' - ');
			if (html.indexOf('{+{') > -1) {
				checkUnfilled();
			}
		}

		if (html.indexOf('{+{') > -1) {
			checkUnfilled();
		}

		return html;
	};

	MB.FormN.prototype.createContent = function (callback) {

		var _t = this;
		_t.fields = [];
		_t.modalId = _t.id;
		var mObj = {};

		if (_t.activeId === 'new') {
			for (var k in _t.profile.data) {
				var kItem = _t.profile.data[k];
				var kName = kItem['column_name'];
				mObj[kName] = _t.createField(_t.populateFieldByName(kName));
			}
		} else {
			for (var i in _t.data.data[0]) {

				mObj[i] = _t.createField(_t.populateFieldByName(i));
			}
		}

		_t.position = (_t.position == 'shift') ? 'shift' : 'center';

		if (_t.wasNew && _t.newSaved) {
			var modal = MB.Core.modalWindows.windows.getWindow(_t.modalId);
			var wrapper = modal.wrapper;
			wrapper.find('.mw-content-inner').html(_t.insertNativeValues(Mustache.to_html(_t.template, mObj)));

            wrapper.find('.mw-insertIntoHeader').html(wrapper.find('.insertIntoHeader').html());

			if (typeof callback == 'function') {
				callback();
			}
		} else {
			var modalWindow = MB.Core.modalWindows.init({
				wrapper: undefined,
				className: 'orderModal',
				wrapId: _t.modalId,
				resizable: true,
				title: (_t.activeId === 'new') ? 'Создать ' + _t.profile['extra_data']['object_profile']['name_ru'].toLowerCase() : _t.profile['extra_data']['object_profile']['name_ru'] + ' : ' + ((_t.data.data[0]['name_ru'] || _t.data.data[0]['name'])? (_t.data.data[0]['name_ru'])? _t.data.data[0]['name_ru'] : _t.data.data[0]['name'] : '') +' ('+ _t.activeId+')',
				status: 'Зарезервирован',
				content: _t.insertNativeValues(Mustache.to_html(_t.template, mObj)),
				bottomButtons: undefined,
				startPosition: _t.position,
				draggable: true,
				top: 0,
				left: 0,
				waitForPosition: undefined,
				active: true,
				inMove: false,
				minHeight: 700,
				minWidth: 1300,
				activeHeaderElem: undefined,
				footerButton: undefined,
				contentHeight: 0,
                formInstance: _t
			}).render(function () {
				_t.modalInstance = modalWindow;
			});

			_t.container = MB.Core.modalWindows.windows.getWindow(_t.modalId).wrapper;

            //_t.container.find('.mw-insertIntoHeader').html(_t.container.find('.insertIntoHeader').html());

			if (typeof callback == 'function') {
				//console.log('END- ', new Date(), new Date().getMilliseconds());
				callback();
			}
		}
	};

	MB.FormN.prototype.reload = function (callback) {

		var _t = this;
		if (_t.activeId !== 'new') {

			if (_t.wasNew && _t.newSaved) {
				_t.getData(function () {
					_t.getTemplate(function () {
						_t.createContent(function () {
							//_t.createChildTables('', function () {
							_t.createChildTablesSplited(function () {
								_t.initControllers(function () {
									_t.getScript(function () {
										MB.Core.createButtons(_t);
										_t.setHandlers(function () {
											_t.wasNew = false;
											_t.newSaved = false;

											var modalWrapper = $('#mw-' + _t.id);
											var modalTitle = modalWrapper.find('.mw-title');
											var newTitle = _t.profile['extra_data']['object_profile']['name_ru'] + ' : ' + ((_t.data.data[0]['name_ru'] || _t.data.data[0]['name'])? (_t.data.data[0]['name_ru'])? _t.data.data[0]['name_ru'] : _t.data.data[0]['name'] : '') +' ('+ _t.activeId+')';
											modalTitle.html('<span class="mw-count-title-length">' + newTitle + '</span><div class="mw-title-hint">' + newTitle + '</div>');
                                            var mwin = MB.Core.modalWindows.windows.getWindow(_t.modalId);
                                            mwin.setHandlers();
										});
									});
								});
							});
						});
					});
				});
			} else {

				_t.getData(function () {
					_t.getScript(function () {
						MB.Core.createButtons(_t);
					});

					for (var i in _t.data.data[0]) {

						var modalWrapper = $('#mw-' + _t.id);
						var modalTitle = modalWrapper.find('.mw-title');
						var fWrap = (modalWrapper.find('.fn-field[data-column="' + i + '"]').length > 0) ? modalWrapper.find('.fn-field[data-column="' + i + '"]') : (modalWrapper.find('.form-ro-block[data-column="' + i + '"]').length > 0)? modalWrapper.find('.form-ro-block[data-column="' + i + '"]') : modalWrapper.find('.fn-inline-field[data-column="' + i + '"]');

                        var percentCell = fWrap.find('.percent-readonly').eq(0);
                        var percentBar = fWrap.find('.percent-readonly-bar').eq(0);
                        var percentText = fWrap.find('.percent-readonly-text').eq(0);

                        var iihWrap = modalWrapper.find('.iih-field[data-column="' + i + '"]');
						var c_insert = undefined;
                        var insert = undefined;
                        var fld = _t.populateFieldByName(i);
                        var type = fWrap.attr('data-type') || fld.profile[0].type;
                        var checksign = '';
						var newTitle = _t.profile['extra_data']['object_profile']['name_ru'] + ' : ' + ((_t.data.data[0]['name_ru'] || _t.data.data[0]['name'])? (_t.data.data[0]['name_ru'])? _t.data.data[0]['name_ru'] : _t.data.data[0]['name'] : '') +' ('+ _t.activeId+')';
						modalTitle.html('<span class="mw-count-title-length">' + newTitle + '</span><div class="mw-title-hint">' + newTitle + '</div>');

                        if(fWrap.length > 1){

                            fWrap.each(function(i,e){

                                var ifWrap = $(e);
                                type = ifWrap.attr('data-type') || fld.profile[0].type;

                                if ((ifWrap.hasClass('fn-readonly-field') || ifWrap.hasClass('form-ro-block')) &&  ifWrap.attr('data-type') != 'checkbox') {
                                    if(ifWrap.attr('data-type') == 'percent'){
                                        percentCell.attr('data-value', fld.value);
                                        percentBar.css({
                                            width: fld.value + '%',
                                            backgroundColor: getPercentColor(fld.value)
                                        });
                                        percentText.html(fld.value + '%');
                                    }else{

                                        insert = (ifWrap.find('.fn-readonly').length > 0) ? ifWrap.find('.fn-readonly') : ifWrap.find('.form-ro-value');

                                        if(type == 'number' || type == 'bigint' || type== 'int' || type == 'float2'){
                                            var separate_val_n = fld.value.toString().replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');
                                            insert.html(separate_val_n);
                                        }else{
                                            insert.html(fld.value);
                                        }

//                                insert.html(fld.value);
                                    }

                                }else if((ifWrap.hasClass('fn-readonly-field') || ifWrap.hasClass('form-ro-block')) &&  ifWrap.attr('data-type') == 'checkbox'){

                                    c_insert = ifWrap.find('.fn-readonly');
                                    ifWrap.attr('data-value', fld.value);
                                    checksign = (fld.value == true || fld.value == 'true')? '<i class="fa fa-check fn-readonly-checkbox-sign"></i>' : '<i class="fa fa-times fn-readonly-checkbox-sign"></i>' ;
                                    c_insert.html(checksign);

                                } else if(iihWrap.length > 0){
                                    iihWrap.html(fld.value);
                                }else {
                                    switch (type) {
                                        case 'text':
                                            insert = ifWrap.find('input[type="text"].fn-control');
                                            //insert.val(fld.value);
                                            insert.attr('value', fld.value);

                                            break;
                                        case 'textarea':
                                            insert = ifWrap.find('textarea.fn-control');
                                            insert.val(fld.value);
                                            break;
                                        case 'checkbox':
                                            insert = ifWrap.find('.fn-control.checkbox-wrapper');
                                            MB.Core.checkboxes.getItem(insert.data('id')).setValue(fld.value == true );
                                            break;
                                        case 'select2':
                                            insert = MB.Core.select3.list.getSelect(ifWrap.find('.select3-wrapper').attr('id'));
                                            insert.value.name = fld.value;
                                            insert.value.id = fld.selValue;
                                            insert.setValue();
                                            break;
                                        case 'select2withEmptyValue':
                                            insert = MB.Core.select3.list.getSelect(ifWrap.find('.select3-wrapper').attr('id'));
                                            insert.value.name = fld.value;
                                            insert.value.id = fld.selValue;
                                            insert.setValue();
                                            break;
                                        case 'select2FreeType':
                                            insert = MB.Core.select3.list.getSelect(ifWrap.find('.select3-wrapper').attr('id'));
                                            insert.value.name = fld.value;
                                            insert.value.id = fld.selValue;
                                            insert.setValue();
                                            break;
                                        case 'datetime':
                                            insert = ifWrap.find('input[type="text"].fn-control');
                                            insert.val(fld.value);
                                            break;
                                        case 'datetime_wo_sec':
                                            insert = ifWrap.find('input[type="text"].fn-control');
                                            insert.val(fld.value.substr(0, 16));
                                            break;
                                        case 'number':
                                            insert = ifWrap.find('input[type="number"].fn-control');
                                            insert.val(fld.value);
                                            break;
                                        case 'float2':
                                            insert = ifWrap.find('input[type="number"].fn-control');
                                            insert.val(fld.value);
                                            break;
                                        case 'percent':

                                            break;
                                        default:
                                            insert = ifWrap.find('input[type="text"].fn-control');
                                            insert.val(fld.value);
                                            break;
                                    }
                                    _t.changes = [];
                                    _t.enableSaveButton();
                                }

                            });

                        }else{

                            if ((fWrap.hasClass('fn-readonly-field') || fWrap.hasClass('form-ro-block')) &&  fWrap.attr('data-type') != 'checkbox') {
                                if(fWrap.attr('data-type') == 'percent'){
                                    percentCell.attr('data-value', fld.value);
                                    percentBar.css({
                                        width: fld.value + '%',
                                        backgroundColor: getPercentColor(fld.value)
                                    });
                                    percentText.html(fld.value + '%');
                                }else{

                                    insert = (fWrap.find('.fn-readonly').length > 0) ? fWrap.find('.fn-readonly') : fWrap.find('.form-ro-value');

                                    if(type == 'number' || type == 'bigint' || type== 'int' || type == 'float2'){
                                        var separate_val_n = fld.value.toString().replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');
                                        insert.html(separate_val_n);
                                    }else{
                                        insert.html(fld.value);
                                    }

//                                insert.html(fld.value);
                                }

                            }else if((fWrap.hasClass('fn-readonly-field') || fWrap.hasClass('form-ro-block')) &&  fWrap.attr('data-type') == 'checkbox'){

                                c_insert = fWrap.find('.fn-readonly');
                                fWrap.attr('data-value', fld.value);
                                checksign = (fld.value == true || fld.value == 'true')? '<i class="fa fa-check fn-readonly-checkbox-sign"></i>' : '<i class="fa fa-times fn-readonly-checkbox-sign"></i>' ;
                                c_insert.html(checksign);

                            } else if(iihWrap.length > 0){
                                iihWrap.html(fld.value);
                            }else {
                                switch (type) {
                                    case 'text':
                                        insert = fWrap.find('input[type="text"].fn-control');
                                        //insert.val(fld.value);
                                        insert.attr('value', fld.value);

                                        break;
                                    case 'textarea':
                                        insert = fWrap.find('textarea.fn-control');
                                        insert.val(fld.value);
                                        break;
                                    case 'checkbox':
                                        insert = fWrap.find('.fn-control.checkbox-wrapper');
                                        MB.Core.checkboxes.getItem(insert.data('id')).setValue(fld.value == true );
                                        break;
                                    case 'select2':
                                        insert = MB.Core.select3.list.getSelect(fWrap.find('.select3-wrapper').attr('id'));
                                        insert.value.name = fld.value;
                                        insert.value.id = fld.selValue;
                                        insert.setValue();
                                        break;
                                    case 'select2withEmptyValue':
                                        insert = MB.Core.select3.list.getSelect(fWrap.find('.select3-wrapper').attr('id'));
                                        insert.value.name = fld.value;
                                        insert.value.id = fld.selValue;
                                        insert.setValue();
                                        break;
                                    case 'select2FreeType':
                                        insert = MB.Core.select3.list.getSelect(fWrap.find('.select3-wrapper').attr('id'));
                                        insert.value.name = fld.value;
                                        insert.value.id = fld.selValue;
                                        insert.setValue();
                                        break;
                                    case 'datetime':
                                        insert = fWrap.find('input[type="text"].fn-control');
                                        insert.val(fld.value);
                                        break;
                                    case 'datetime_wo_sec':
                                        insert = fWrap.find('input[type="text"].fn-control');
                                        insert.val(fld.value.substr(0, 16));
                                        break;
                                    case 'number':



                                        insert = fWrap.find('input[type="number"].fn-control');
                                        insert.val(fld.value);
                                        break;
                                    case 'float2':
                                        insert = fWrap.find('input[type="number"].fn-control');
                                        insert.val(fld.value);
                                        break;
                                    case 'percent':

                                        break;
                                    default:
                                        insert = fWrap.find('input[type="text"].fn-control');
                                        insert.val(fld.value);
                                        break;
                                }
                                _t.changes = [];
                                _t.enableSaveButton();
                            }

                        }







						var inlineFld = modalWrapper.find('.fn-inline-field[data-column="' + i + '"]');

                        if(type == 'number' || type == 'bigint' || type== 'int' || type == 'float2'){
                            var separate_val = fld.value.toString().replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');
                            inlineFld.html(separate_val);
                        }else{
                            inlineFld.html(fld.value);
                        }



					}
					if (_t.tblInstances.length > 0) {

                        var insCounter = 0;

						for (var ins in _t.tblInstances) {
							_t.tblInstances[ins].reload(function () {

								if (typeof callback == 'function') {
                                    if(insCounter == _t.tblInstances.length -1){
                                        $(_t).trigger('update');
                                        callback();
                                    }
								}
                                insCounter++;
							});
						}
					} else {
						$(_t).trigger('update');
						if (typeof callback == 'function') {
							callback();
						}
					}
				});
			}


		} else {
			$(_t).trigger('update');
			if (typeof callback == 'function') {
				callback();
			}
		}

	};

	MB.FormN.prototype.makeOperation = function (operationName, callback) {
		var _t = this;
		var totalOk = 0;
		var totalErr = 0;
		var primaryKeys = _t.profile['extra_data']['object_profile']['primary_key'].split(',');

		var o = {
			command: 'operation',
			object: operationName
		};

		for (var k in primaryKeys) {
			o[primaryKeys[k]] = _t.data.data[0][primaryKeys[k]];
		}

		socketQuery(o, function (res) {
			res = socketParse(res);
			_t.reload(function () {
                console.log("------------------------------------ callback");
				if (typeof callback == 'function') {
					callback(res);
				}
			});
		});
	};

	MB.FormN.prototype.enableSaveButton = function () {
		var _t = this;
		var wrapper = $('#mw-' + _t.id);
		var saveBtn = wrapper.find('.mw-save-form');

		saveBtn.addClass('disabled');

		if (_t.tblInstances.length > 0) {
			var totalChanged = 0;
			for (var ins in _t.tblInstances) {
				if (_t.changes.length > 0 || _t.tblInstances[ins].ct_instance.changes.length > 0) {
					totalChanged++;
				}
			}
			if (totalChanged > 0) {
				saveBtn.removeClass('disabled');
			}
		} else {
			if (_t.changes.length > 0) {
				saveBtn.removeClass('disabled');
			}
		}

	};

	MB.FormN.prototype.addChange = function (change) {
		var _t = this;

		if (!change.type || !change.column_name) {
			return;
		}

		if (_t.changes.length > 0) {
			var isSame = 0;
			for (var i in _t.changes) {
				var ch = _t.changes[i];
				if (ch.column_name == change.column_name) {
					if (change.type.indexOf('select2') != -1) {
						ch.value.selValue = change.value.selValue;
						ch.value.value = change.value.value;
					} else {
						ch.value.value = change.value.value;
					}
					isSame++;
				}
			}
			if (isSame == 0) {
				_t.changes.push(change);
			}
		} else {
			_t.changes.push(change);
		}
		_t.enableSaveButton();
//        console.log(_t.changes);

	};

	MB.FormN.prototype.removeChange = function (change) {
		var _t = this;
		var changes = _t.changes;

		if (changes.length) {
			for (var i = 0; i < changes.length; i++) {
				var ch = changes[i];
				if (ch.column_name == change.column_name) {
					changes.splice(i, 1);
				}
			}
		}

		if (!changes.length) _t.enableSaveButton();
	};

	MB.FormN.prototype.setHandlers = function (callback) {
		var _t = this;
		var wrapper = $('#mw-' + _t.id);
		var modalWindow = MB.Core.modalWindows.windows.getWindow(_t.id);

		if (_t.activeId == 'new') {
			for (var pd in _t.profile.data) {
				var item = _t.profile.data[pd];
				if (item['TYPE_OF_EDITOR'] == 'checkbox') {
					var chO = {
						column_name: item['COLUMN_NAME'],
						type: 'checkbox',
						value: {
							value: false,
							selValue: ''
						}
					};
					_t.addChange(chO);
				}
			}
		}

		wrapper.find('.fn-control.fn-file-wrapper').off('click').on('click', function () {
			var elem = $(this);
			var sVal = elem.val();
			var id = MB.Core.guid();
			var instance;
			if (!elem.attr('inited')) {
				instance = MB.Core.imageEditor.init({
					id: id,
					target: elem,
					src: sVal
				});

				$(instance).on('update', function (e) {
					var block = elem.parents('.fn-field').eq(0);
					var columnName = block.attr('data-column');
					var type = block.attr('data-type');
					var dataValue = "";
					var value = instance.data.name;
					var chO = {
						column_name: columnName,
						type: type,
						value: {
							value: value,
							selValue: ''
						}
					};

					elem.val(value);

					if (_t.data != "new") dataValue = _t.data.data[0][columnName];
					if (value != dataValue) {
						_t.addChange(chO);
					}
					else {
						_t.removeChange(chO);
					}
				});


				elem.attr('inited', "true");
				elem.attr('data-id', id);
			}
			else {
				instance = MB.Core.imageEditor.list.getItem( elem.data('id'));
				instance.open();
			}
		});

		wrapper.find('.mw-save-form').off('click').on('click', function () {

			if ($(this).hasClass('disabled')) {
				return;
			}
			if (_t.tblInstances.length > 0) {

				if (_t.changes.length > 0) {
					_t.save(function (success) {
						if (success) {
							_t.reload(function () {
								$(modalWindow).trigger('save');
							});
						}
					});
				}
				for (var ins in _t.tblInstances) {
					if (_t.tblInstances[ins].ct_instance.changes.length > 0) {
						_t.tblInstances[ins].save(function () {
							_t.tblInstances[ins].reload();
							_t.reload(function () {
								$(modalWindow).trigger('save');
							});
						});
					}
				}
			} else {
				if (_t.changes.length > 0) {
					_t.save(function (success) {
						if (success) {
							_t.reload(function () {
								$(modalWindow).trigger('save');
							});
						}
					});
				}
			}


		});

        wrapper.find('input.fn-control[data-column="DL_FULL_ADDRESS"]').on('input keyup change', function () {//
            var block = $(this).parents('.fn-field').eq(0);
            var columnName = block.attr('data-column');
            var type = block.attr('data-type');
            var dataValue = "";
            var value = $(this).val();
            value = (type == 'phone') ? value.replace(/[^0-9]/gim, '') : value;
            var chO = {
                column_name: columnName,
                type: type,
                value: {
                    value: value,
                    selValue: ''
                }
            };
            if (_t.data != "new") dataValue = _t.data.data[0][columnName];
            if (value != dataValue) {
                _t.addChange(chO);
            }
            else {
                _t.removeChange(chO);
            }
        });

		wrapper.find('input.fn-control[data-column!="DL_FULL_ADDRESS"]').off('input keyup change').on('input keyup change', function () {//
			var block = $(this).parents('.fn-field').eq(0);
			var columnName = block.attr('data-column');
			var type = block.attr('data-type');
			var dataValue = "";
			var value = $(this).val();
			value = (type == 'phone') ? value.replace(/[^0-9]/gim, '') : value;
			var chO = {
				column_name: columnName,
				type: type,
				value: {
					value: value,
					selValue: ''
				}
			};
			if (_t.data != "new") dataValue = _t.data.data[0][columnName];
			if (value != dataValue) {
				_t.addChange(chO);
			}
			else {
				_t.removeChange(chO);
			}
		});

		wrapper.find('.fn-control.checkbox-wrapper').each(function (index, elem) {
			var block = $(elem).parents('.fn-field').eq(0);
			var id = $(elem).data('id');
			var columnName = block.data('column');
			var type = block.data('type');
			var dataValue = "";
			var chkInstance = $(MB.Core.checkboxes.getItem(id)).off('toggleCheckbox').on('toggleCheckbox', function () {
//                console.log(this);
				var value = (this.value) ? true : false;
				var chO = {
					column_name: columnName,
					type: type,
					value: {
						value: value,
						selValue: ''
					}
				};
				if (_t.data != "new") dataValue = _t.data.data[0][columnName];
				if (value != dataValue) {
					_t.addChange(chO);
				}
				else {
					_t.removeChange(chO);
				}
			});
		});

		wrapper.find('textarea.fn-control').off('input').on('input', function () {
			var block = $(this).parents('.fn-field').eq(0);
			var columnName = block.attr('data-column');
			var type = block.attr('data-type');
			var dataValue = "";
			var value = $(this).val();
			var chO = {
				column_name: columnName,
				type: type,
				value: {
					value: $(this).val(),
					selValue: ''
				}
			};
			if (_t.data != "new") dataValue = _t.data.data[0][columnName];
			if (value != dataValue) {
				_t.addChange(chO);
			}
			else {
				_t.removeChange(chO);
			}
		});

        for(var i in _t.ckEditors){
            var ed = _t.ckEditors[i];
            var columnName =    ed.column_name;
            var type =          ed.type;
            var dataValue =     "";

            var value = ed.getData();

//            console.log(ed, value);

            ed.on('key', function(){
                value = ed.getData();
                var chO = {
                    column_name: columnName,
                    type: type,
                    value: {
                        value: value,
                        selValue: ''
                    }
                };

                console.log(chO);

                if (_t.data != "new") dataValue = _t.data.data[0][columnName];
                if (value != dataValue) {
                    _t.addChange(chO);
                }
                else {
                    _t.removeChange(chO);
                }

            });



        }


		wrapper.find('.fn-control.fn-datetime-wrapper').each(function (index, elem) {
			$(elem).datetimepicker({
				autoclose: true,
				todayHighlight: true,
				minuteStep: 10,
				keyboardNavigation: false,
				todayBtn: true,
				firstDay: 1,
                startDate: '-infinity',
				weekStart: 1,
				language: "ru"
			}).off('changeDate').on('changeDate', function () {
				var block = $(this).parents('.fn-field').eq(0),
					type = block.attr('data-type'),
					columnName = block.attr('data-column'),
					dataValue = (_t.data != "new") ? _t.data.data[0][columnName] : "",
					value = $(this).val();
				if (value.length == 16) value += ':00';
				var chO = {
					column_name: $(this).attr('data-column'),
					type: type,
					value: {
						value: value,
						selValue: ''
					}
				};
				if (value != dataValue) {
					_t.addChange(chO);
				}
				else {
					_t.removeChange(chO);
				}
			});
		});

        wrapper.find('.fn-control.fn-date-wrapper').each(function (index, elem) {
            $(elem).datepicker({
                autoclose: true,
                todayHighlight: true,
                //minuteStep: 10,
                keyboardNavigation: false,
                todayBtn: true,
                firstDay: 1,
                format: 'dd.mm.yyyy',
//                startDate: '-infinity',
                weekStart: 1,
                language: "ru"
            }).off('changeDate').on('changeDate', function () {
                var block = $(this).parents('.fn-field').eq(0),
                    type = block.attr('data-type'),
                    columnName = block.attr('data-column'),
                    dataValue = (_t.data != "new") ? _t.data.data[0][columnName] : "",
                    value = $(this).val();
                if (value.length == 16) value += ':00';
                var chO = {
                    column_name: $(this).attr('data-column'),
                    type: type,
                    value: {
                        value: value,
                        selValue: ''
                    }
                };
                if (value != dataValue) {
                    _t.addChange(chO);
                }
                else {
                    _t.removeChange(chO);
                }
            });
        });

		wrapper.find('.fn-control.fn-time-wrapper').each(function () {
			var $t = $(this);
			$t.clockpicker({
				align: 'left',
				donetext: 'Выбрать',
				autoclose: true,
				afterDone: function () {
					var val = $t.val();
					if (val.length == 5) $t.val(val + ':00');
				}
			})
		});

		wrapper.find('.fn-control.fn-select3-wrapper').each(function (index, elem) {
			var selectId = $(elem).find('.select3-wrapper').attr('id');
			var selectInstance = MB.Core.select3.list.getSelect(selectId);
			var block = $(elem).parents('.fn-field').eq(0);
			$(selectInstance).on('changeVal', function (e, was, now) { //.off('changeVal')
				var columnName = block.attr('data-column');
				var dataValue = "";

				function getLovReturnToColumn(columnName) {
					for (var i in _t.profile.data) {
						var item = _t.profile.data[i];
						if (item['column_name'] == columnName) {
							return (item['lov_return_to_column'] != "") ? item['lov_return_to_column'] : item['column_name'];
						}
					}
				}

				var chO = {
					column_name: getLovReturnToColumn($(elem).attr('data-column')),
					type: $(elem).parents('.fn-field').eq(0).attr('data-type'),
					value: {
						value: now.id,
						selValue: now.id
					}
				};
				if (_t.data != "new") dataValue = _t.data.data[0][columnName];
				if (now.name != dataValue) {
					_t.addChange(chO);
				}
				else {
					_t.removeChange(chO);
				}
			});
		});

		wrapper.find('.fn-control.fn-colorpicker-wrapper').each(function (index, elem) {
			var block = $(elem).parents('.fn-field').eq(0);
			var type = block.attr('data-type');
			var columnName = block.attr('data-column');
			var stateView = $(elem).parents('.fn-field').find('.fn-colorpicker-state');
			var colorValue = undefined;
			var dataValue = "";
			var colorPickerInstance = $(elem).colorpicker();
			colorPickerInstance.off('changeColor').on('changeColor', function (e) {
				colorValue = e.color.toHex();
				stateView.css('backgroundColor', colorValue);

				var chO = {
					column_name: columnName,
					type: type,
					value: {
						value: colorValue,
						selValue: ''
					}
				};
				if (_t.data != "new") dataValue = _t.data.data[0][columnName];
				if (colorValue != dataValue) {
					_t.addChange(chO);
				}
				else {
					_t.removeChange(chO);
				}
			});
			$(elem).off('input').on('input', function () {
				stateView.css('backgroundColor', $(elem).val());
			});
			stateView.off('click').on('click', function () {
				colorPickerInstance.colorpicker('show');
			});
		});

        wrapper.find('.classic-filed-replacer').off('click').on('click', function () {

            var id = $(this).attr('data-repid');
            var data_1 = $(this).attr('data-replace');
            var data_2 = $(this).attr('data-replace2');

            var fld_1 = wrapper.find('[data-repid="'+id+'"][data-replace="1"]').find('.fn-control');
            var fld_2 = wrapper.find('[data-repid="'+id+'"][data-replace="2"]').find('.fn-control');

            fld_1.val(data_1);
            fld_2.val(data_2);

            fld_1.trigger('input');
            fld_2.trigger('input');

        });

//        $(modalWindow).on('close', function(){
//            console.log('close', modalWindow.wrapId);
//        });
//        $(modalWindow).on('collapse', function(){
//            console.log('collapse', modalWindow.wrapId);
//        });
//        $(modalWindow).on('activate', function(){
//            console.log('activate', modalWindow.wrapId);
//        });
//        $(modalWindow).on('fullscreen', function(){
//            console.log('fullscreen', modalWindow.wrapId);
//        });
		$(modalWindow).off('close').on('close', function () {
			for (var i in _t.tblInstances) {
				var id = _t.tblInstances[i].id;
				MB.Tables.removeTable(id);
			}
			MB.Forms.removeForm(_t.id);
		});


		//master
		if (_t.isMaster) {

			var m_wrap = wrapper.find('.master-wrapper');
			var m_vis = wrapper.find('.master-vis');
			var m_train = wrapper.find('.master-train');
			var m_steps = wrapper.find('.master-step');
			var m_fwd = wrapper.find('.master-step-fwd');
			var m_back = wrapper.find('.master-step-back');
			var m_finish = wrapper.find('.master-finish');
			var stepsCount = m_steps.length;

			m_train.css('width', stepsCount * 100 + '%');
			m_steps.css('width', 100 / stepsCount + '%');
			m_wrap.animate({opacity: 1}, 100);

			function updateVariables() {
				m_wrap = wrapper.find('.master-wrapper');
				m_vis = wrapper.find('.master-vis');
				m_train = wrapper.find('.master-train');
				m_steps = wrapper.find('.master-step');
				m_fwd = wrapper.find('.master-step-fwd');
				m_back = wrapper.find('.master-step-back');
				m_finish = wrapper.find('.master-finish');
				stepsCount = m_steps.length;
			}

			function disableButtons() {
				var activeStep = wrapper.find('.master-step.active');
				var activeIdx = parseInt(activeStep.data('step'));

				m_back.removeClass('disabled');
				m_fwd.removeClass('disabled');
				m_finish.removeClass('disabled');

//                console.log(activeIdx, stepsCount);

				if (activeIdx == 0) {
					m_back.addClass('disabled');
					m_finish.addClass('disabled');
				} else if (activeIdx == stepsCount - 1) {

					m_fwd.addClass('disabled');
				} else {
					m_finish.addClass('disabled');
				}
			}

			disableButtons();

			m_fwd.off('click').on('click', function () {

				if ($(this).hasClass('disabled')) {
					return;
				}
				if (_t.activeId == 'new' && _t.changes.length == 0) {
					toastr['warning']('Заполните обязательные поля');
					return;
				}

				var activeStep = wrapper.find('.master-step.active');
				var activeIdx = parseInt(activeStep.data('step'));

				function saveStep(cb) {

//                    console.log('CHANGES LENGTH', _t.changes.length);

					if (_t.tblInstances.length > 0) {
						if (_t.changes.length > 0) {
							_t.save(function (success) {
								if (success) {
									if (typeof cb == 'function') {
										cb();
									}
								}
							});
						} else {
							if (typeof cb == 'function') {
								cb();
							}
						}
						for (var ins in _t.tblInstances) {
							if (_t.tblInstances[ins].ct_instance.changes.length > 0) {
								_t.tblInstances[ins].save(function () {
									_t.tblInstances[ins].reload();
									_t.reload(function () {
//                                        updateVariables();
//
//                                        console.log(m_train);
//
//                                        m_train.animate({
//                                            marginLeft: '-' + (activeIdx+1) * 100 + '%'
//                                        }, 350, function(){
//
//                                        });
//                                        activeStep.removeClass('active');
//                                        activeStep.next().addClass('active');
//                                        disableButtons();
//                                        if(typeof cb == 'function'){
//                                            cb();
//                                        }
									});
								});
							}
						}
					} else {
						if (_t.changes.length > 0) {
							_t.save(function (success) {
								if (success) {
									if (typeof cb == 'function') {
										cb();
									}
								}
							});
						} else {
							if (typeof cb == 'function') {
								cb();
							}
						}
					}
				}


				saveStep(function () {
					m_train.animate({
						marginLeft: '-' + (activeIdx + 1) * 100 + '%'
					}, 350, function () {

					});
					activeStep.removeClass('active');
					activeStep.next().addClass('active');
					disableButtons();
					_t.getData();
				});
			});

			m_back.off('click').on('click', function () {

				if ($(this).hasClass('disabled')) {
					return;
				}

				var activeStep = wrapper.find('.master-step.active');
				var activeIdx = parseInt(activeStep.data('step'));

				m_train.animate({
					marginLeft: '-' + (activeIdx - 1) * 100 + '%'
				}, 350, function () {

				});
				activeStep.removeClass('active');
				activeStep.prev().addClass('active');
				disableButtons();
			});
		}


		if (typeof callback == 'function') {
			callback();
		}
	};

	MB.FormN.prototype.returnStringWithoutSpaces = function (str) {
        if(typeof str == 'string'){
            return str.replace(/(^\s*)|(\s*)$/g, '');
        }else{
            return str;
        }

	};

	MB.FormN.prototype.save = function (callback) {
		var _t = this;
		var chs = _t.changes;
		var totalSaved = 0;
		var totalError = 0;

		function finishSave() {
			if (totalError == 0) {
				_t.changes = [];
			}
			_t.enableSaveButton();
			$(_t).trigger('update');
			if (typeof callback == 'function') {
				callback(totalError == 0);
			}
		}

		function populateParams() {
			var result = {};
			for (var i in chs) {
				var ch = chs[i];

				result[ch.column_name] = _t.returnStringWithoutSpaces(ch.value.value);
			}

			if(_t.activeId !== 'new') {
				for (var k in _t.profile['extra_data']['object_profile']['primary_key'].split(',')) {
					var key = _t.profile['extra_data']['object_profile']['primary_key'].split(',')[k];
					result[key] = _t.data.data[0][key];
				}
			}

			return result;
		}

		var sObj = {};

		if (_t.activeId === 'new') {
			sObj = {
				command: 'add',
				object: _t.profile['extra_data']['object_profile']['class'],
				params: populateParams()
			};

            if(_t.client_object){
                sObj.client_object = _t.client_object;
            }

		} else {
			sObj = {
				command: 'modify',
				object: _t.profile['extra_data']['object_profile']['class'],
				params: populateParams()
			};
            if(_t.client_object){
                sObj.client_object = _t.client_object;
            }
		}

		socketQuery(sObj, function (res) {
			var results = res;//socketParse(res, false);

			if (results.code == 0) {


				console.log('AFTER SAVE', results);

				totalSaved += 1;
				if (_t.activeId === 'new') {
					_t.newSaved = true;
					_t.activeId = results['id'];
				}
				_t.tablePKeys = {
					data_columns: [_t.profile['extra_data']['object_profile']['primary_key'].split(',')],
					data: [results.id]
				};
			} else {
				totalError += 1;
			}

			finishSave();
		});
	};

    MB.FormN.prototype.getChildTbl = function (class_name) {
        var _t = this;
        for (var i in _t.tblInstances) {
            var tbl = _t.tblInstances[i];
            if (tbl.class == class_name) {
                return tbl;
            }
        }
    };

    MB.FormN.prototype.loader = function(state, mes){

        var _t = this;

        var wrap = _t.container.find('.mw-content');

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

	//---


	MB.FormN.prototype.getProfileByColumnName = function (column_name) {
		var _t = this;
		for (var i in _t.profile.data) {
			var cell = _t.profile.data[i];
			if (cell['COLUMN_NAME'] == column_name) {
				return cell;
			}
		}
	};

	MB.FormN.prototype.getDependsOfValueByColumnName = function (column_name, rowIndex) {
		var _t = this;
		var value = (_t.data == 'new') ? '' : _t.data.data[0][column_name];
		if (value == undefined) {
			return 'NULL';
		}

		var response = '';
		response = (value.length > 0) ? "'" + value + "'" : 'NULL';
		for (var i in _t.changes) {
			var ch = _t.changes[i];
			if (ch.column_name == column_name) {
				response = "'" + ch.value.selValue + "'";
			}
		}
//        console.log((response == 'NULL' || response == '' || !response)? 'NULL' : response);
		return (response == 'NULL' || response == '' || !response) ? 'NULL' : response;
	};

	MB.FormN.prototype.getDependWhereForSelect = function (column_name, rowIndex) {
		var _t = this;
		var lov_where = _t.getProfileByColumnName(column_name)['LOV_WHERE'];

		function removeSpaces(str) {
			if (typeof str == 'string') {
				return str.replace(/\s+/g, '');
			} else {
				return str;
			}
		}

		function rec(str) {
			var open = str.indexOf('[:');
			var close = str.indexOf(':]');
			if (open == -1 || close == -1) {
				return str;
			} else {
				var key = removeSpaces(str.substr(open + 2, close - (open + 2)));
				var newString = str.substr(0, open) + '[|' + _t.getDependsOfValueByColumnName(key, rowIndex) + '|]' + str.substr(close + 2);
				return rec(newString);
			}
		}

		var result = rec(lov_where);
		result = result.replaceAll('[|', '');
		result = result.replaceAll('|]', '');

//        console.log(result);

		return result;

	};

}());




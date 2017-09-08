var select3init = function () {
	var start;
	var stop;
	var Select3List = function () {
		this.items = [];
	};
	var Select3 = function (params) {
		this.id =                       params.id || MB.Core.guid();
        this.type =                     params.type || undefined;
        this.wrapper =                  params.wrapper || undefined;
        this.column_name =              params.column_name || undefined;
        this.class =                    params.class || undefined;
        this.client_object =            params.client_object || undefined;
        this.return_id =                params.return_id || 'id';
        this.return_name =              params.return_name || 'name';
        this.searchKeyword =            '';
        this.options =                  params.options || undefined;
        this.value =                    params.value || {id: "-1", name: "Выбрать"};
        //this.search_columns =           params.search_columns || '';
        this.withSearch =               params.withSearch || false;
        this.withEmptyValue =           params.withEmptyValue || false;
        this.absolutePosition =         params.absolutePosition || false;
        this.isFilter =                 params.isFilter || false;
        //this.whereString =              params.whereString || '';
        this.parentObject =             params.parentObject || undefined;
        this.additionalClass =          params.additionalClass || '';
        this.data =                     params.data || [];
        this.lastIndex =                0;
        this.perPage =                  40;
        this.page_no =                  1;
        this.rowTemplate =              null;
        this.lastGetCount =             0;
        this.values = [];
        //add to column profuie:
        //this.multiple =                 params.multiple || false;
        //this.dependWhere =              params.dependWhere || '';
        // class of column
        // lov_get // GET_FOR_SELECT
        // return id
        // return name


        // old

		//this.type = params.type || undefined;
		//this.options = params.options || undefined;
		//this.getString = params.getString || undefined;
		//this.wrapper = params.wrapper || undefined;
		//this.value = params.value || {id: "-1", name: "Выбрать"};
		//this.data = params.data || [];
		//this.fromServerIdString = params.fromServerIdString || '';
		//this.fromServerNameString = params.fromServerNameString || '';
		//this.column_name = params.column_name || '';
		//this.view_name = params.view_name || '';
		//this.searchKeyword = params.searchKeyword || '';
        //
		//this.withEmptyValue = params.withEmptyValue || false;
		//this.freeType = params.freeType || false;
        //
		//this.multiSelect = params.multiSelect || false;
        //
		//this.absolutePosition = params.absolutePosition || false;
		//this.isFilter = params.isFilter || false;
		//this.isSearch = params.isSearch || false;
		//this.filterColumnName = params.filterColumnName || undefined;
		//this.filterClientObject = params.filterClientObject || undefined;
		//this.whereString = params.whereString || '';
		//this.dependWhere = params.dependWhere || '';
		//this.parentObject = params.parentObject || undefined;
		//this.profile_column_name = params.profile_column_name || undefined;
		//this.additionalClass = params.additionalClass || '';

		//this.values = [];
	};

	Select3List.prototype.addItem = function (item) {
		this.items.push(item);
	};

	Select3List.prototype.getSelect = function (id) {
		var _t = this;
		for (var i in _t.items) {
			if (_t.items[i].id == id) {
				return _t.items[i];
			}
		}
	};

	Select3.prototype.setAbsoluteLeft = function (callback) {
		var _t = this;

		for (var a = 0; a < $('.select3-absolute-wrapper').length; a++) {
			var aItem = $('.select3-absolute-wrapper').eq(a);
			var aId = aItem.attr('data-id');
			var parentRect = aItem.parents('.classicTableWrap')[0].getBoundingClientRect();
			var resLeft = $('.ct-select3-wrapper[data-absolute="' + aId + '"]').parent('td')[0].getBoundingClientRect().left - parentRect.left;
			aItem.css('left', (resLeft + 5) + 'px');
			if ((resLeft + 5) <= 0) {
				aItem.css('display', 'none');
			} else {
				aItem.css('display', 'block');
			}
		}


		if (typeof callback == 'function') {
			callback();
		}
	};

	Select3.prototype.resizeAbsolutes = function (callback) {



//        for(var a = 0; a < $('.select3-absolute-wrapper').length; a++){
//            var aItem = $('.select3-absolute-wrapper').eq(a);
//            var aId = aItem.attr('data-id');
//
//            var parentRect = aItem.parents('.classicTableWrap')[0].getBoundingClientRect();
//
//            var resTop =  $('.ct-select3-wrapper[data-absolute="'+aId+'"]').parent('td')[0].getBoundingClientRect().top - parentRect.top;
//            var resLeft = $('.ct-select3-wrapper[data-absolute="'+aId+'"]').parent('td')[0].getBoundingClientRect().left - parentRect.left;
//
//            aItem.css('top', (resTop + 6) +'px');
//            aItem.css('left', (resLeft + 5) +'px');
//            aItem.css('width', ($('.ct-select3-wrapper[data-absolute="'+aId+'"]').parent('td')[0].getBoundingClientRect().width + 1) +'px');
//            aItem.css('zIndex', (a+1)*100);
//
//        }
//
//        for(var zi = $('.select3-absolute-wrapper').length; zi >= 0; zi--){
//            var ziItem = $('.select3-absolute-wrapper').eq(zi);
//            var ziVal = (($('.select3-absolute-wrapper').length - zi)+1)*100 ;
//            ziItem.css('zIndex', ziVal);
//        }

		if (typeof callback == 'function') {
			callback();
		}
	};


	Select3.prototype.init = function () {
		var _t = this;
        var list;
		var template = '<div class="select3-wrapper" id="{{id}}">' +

			'<div class="select3-select">' +
			'<div class="select3-output" data-id="{{value_id}}">{{{value_name}}}</div>' +
			'<div class="select3-angle"><i class="fa fa-angle-down"></i></div>' +
			'</div>' +

			'<div class="select3-dd ' + _t.additionalClass + '">' +
			'{{#search}}' +
			'<div class="select3-search">' +
			'<input type="text" class="select3-search"/>' +
			'<div class="confirmValue">Ок</div>' +
			'</div>' +
			'{{/search}}' +
			'<div class="select3-results-wrapper">' +
			'<ul class="select3-results">' +
			'{{#data}}' +
			'<li data-value="{{id}}">{{name}}</li>' +
			'{{/data}}' +
			'</ul>' +
			'</div>' +
			'</div>' +

			'</div>';

		var output;

		if(_t.freeType) output = '<input type="text" class="select3-output" data-id="{{value_id}}" value="{{value_name}}"/>';
		else output = '<div class="select3-output" data-id="{{value_id}}">{{{value_name}}}</div>';

		var absTpl = '<div class="select3-wrapper" id="{{id}}">' +
			'<div class="select3-select">' +
			output +
			'<div class="select3-angle"><i class="fa fa-angle-down"></i></div>' +
			'</div>' +
			'</div>';

		var absDD = '<div data-id="{{id}}" class="select3-dd absoluteDD ' + _t.additionalClass + '">' +
			'<div class="select3-corner"></div>' +
			'<div class="select3-corner2"></div>' +
			'{{#search}}' +
			'<div class="select3-search">' +
			'<input type="text" class="select3-search"/>' +
			'<div class="confirmValue">Ок</div>' +
			'</div>' +
			'{{/search}}' +
			'<div class="select3-results-wrapper">' +
			'<ul class="select3-results">' +
			'{{#data}}' +
			'<li data-value="{{id}}">{{name}}</li>' +
			'{{/data}}' +
			'</ul>' +
			'</div>' +
			'</div>';

		_t.rowTemplate = '{{#list}}<li data-value="{{id}}">{{#multiSelect}}<i class="fa fa-circle-o"></i>{{/multiSelect}}<span>{{name}}</span></li>{{/list}}';

		var data = {
			id: _t.id,
			value_id: _t.value.id,
			value_name: _t.value.name,
			data: _t.data,
			search: _t.withSearch
		};

		_t.wrapper.empty();

		if (_t.absolutePosition) {
			if (_t.type == 'inited') {
				_t.wrapper.before('<div class="select3-inline-wrapper"></div>');
				_t.wrapper = _t.wrapper.prev();
				_t.wrapper.next().remove();
			}
			_t.wrapper.prepend(Mustache.to_html(absTpl, data));
			$('body').append(Mustache.to_html(absDD, data));
		} else {

			if (_t.type == 'inited') {
				_t.wrapper.before('<div class="select3-inline-wrapper"></div>');
				_t.wrapper = _t.wrapper.prev();
				_t.wrapper.next().remove();
			}
			_t.wrapper.prepend(Mustache.to_html(template, data));
		}

        list = $('.select3-dd[data-id="' + _t.id + '"]').eq(0);

		_t.parent = _t.wrapper.find('.select3-wrapper').eq(0);
        _t.corner = list.find('.select3-corner');
        _t.corner2 = list.find('.select3-corner2');
		_t.resultsScroll = (_t.absolutePosition) ? list.find('.select3-results-wrapper') : _t.wrapper.find('.select3-results-wrapper').eq(0);
		_t.resultWrapper = (_t.absolutePosition) ? list.find('.select3-results') : _t.wrapper.find('.select3-results').eq(0);
		_t.output = _t.wrapper.find('.select3-output').eq(0);
		_t.searchInput = (_t.absolutePosition) ? list.find('input.select3-search') : _t.wrapper.find('input.select3-search').eq(0);
		_t.select = _t.wrapper.find('.select3-select').eq(0);
		_t.selectArrow = _t.wrapper.find('.select3-angle').eq(0);
		_t.dd = (_t.absolutePosition) ? list : _t.wrapper.find('.select3-dd').eq(0);
		_t.listOfResults = _t.wrapper.find('.select3-results li');
		_t.confirmValBtn = _t.wrapper.find('.confirmValue').eq(0);

		if(!_t.freeType) _t.handlerElem = _t.select;
		else _t.handlerElem = _t.selectArrow;

		var select3FromLs = JSON.parse(localStorage.getItem('select3'));
		select3FromLs.push({name: _t.id, data: {}});
		localStorage.setItem('select3', JSON.stringify(select3FromLs));
		_t.setHandlers();
        return _t;
	};

	Select3.prototype.setValue = function () {
		var _t = this;
		var value = _t.values.join(",");
		var was = {
			id: _t.output.attr('data-id'),
			name: (_t.output.prop("tagName") == "INPUT")?_t.output.val():_t.output.html()
		};
		var now = {
			id: _t.value.id,
			name: _t.value.name
		};


		_t.wrapper.attr('data-title', _t.value.name);
		_t.wrapper.attr('data-val', _t.value.id);

		_t.output.attr('data-id', _t.value.id);
		if(_t.output.prop("tagName") == "INPUT") _t.output.val(_t.value.name);
		else _t.output.html(_t.value.name);

		$(_t).trigger('changeVal', [was, now]);
	};

    Select3.prototype.dropData = function(){
        var _t = this;

        _t.page_no = 1;
        _t.data = [];
        _t.resultWrapper.empty();
        _t.lastIndex = 0;
    };

	Select3.prototype.byClickSelect = function () {
		var _t = this;

		if (_t.dd.hasClass('opened')) {
			_t.dd.removeClass('opened');
		} else {
			for (var i in select3List.items) {
				var idd = select3List.items[i].dd;
				idd.removeClass('opened');
			}

            if(_t.type != 'pregetted'){
                _t.dropData();
                _t.listOfResults.scrollTop(0);
            }

			_t.getData(function () {
                if (_t.absolutePosition) {

                    var isInTable = _t.wrapper.parents('.classicTableWrap').length > 0;
                    var parentRect = undefined;
                    var resTop = undefined;
                    var resLeft = undefined;
                    var body = $('body');
                    var width = _t.dd.outerWidth();
                    var height = _t.dd.outerHeight();
                    var coeffTop = 35;
                    parentRect = _t.wrapper[0].getBoundingClientRect();
                    resTop = parentRect.top;
                    resLeft = parentRect.left;

                    //  if (body.width() < resLeft + width) resLeft = resLeft - width;
                    if (body.height() < resTop + height) {
                        resTop = resTop - height;
                        coeffTop = -7;
                        _t.corner.removeClass("select3-corner-top").addClass("select3-corner-bottom");
                        _t.corner2.removeClass("select3-corner2-top").addClass("select3-corner2-bottom");
                    }
                    else  {
                        _t.corner.removeClass("select3-corner-bottom").addClass("select3-corner-top");
                        _t.corner2.removeClass("select3-corner2-bottom").addClass("select3-corner2-top");
                    }

                    if (isInTable) {
                        _t.dd.css({
                            top: (resTop + coeffTop) + 'px',
                            left: (resLeft + 8) + 'px'
                        });
                    } else {
                        _t.dd.css({
                            top: (resTop + 35) + 'px',
                            left: (resLeft) + 'px',
                            width: parentRect.width + 'px'
                        });
                    }
                }
                _t.dd.addClass('opened');

                setTimeout(function () {

                    _t.searchInput.focus();

                }, 10);
			});
		}
	};

	Select3.prototype.setHandlers = function () {
		var _t = this;

		_t.handlerElem.off('click').on('click', function () {
            console.log('BY CLICK SELECT');
			_t.byClickSelect();
		});

		_t.searchInput.off('input').on('input', function () {
			var val = $(this).val();
            _t.searchKeyword = val;

            _t.dropData();
			_t.getData();
		});

		if (_t.freeType) {
			_t.output.off('input').on('input', function (e) {
				var val = _t.output.val();
				_t.value = {
					id: val,
					name: val
				};
				_t.setValue();

				if (_t.dd.hasClass('opened')) {
					_t.dd.removeClass('opened');
				}
			});
		}

		_t.resultsScroll.off('scroll').on('scroll', function () {

			var height = $(this).height();
			var scrollH = $(this)[0].scrollHeight;
			var scTop = $(this).scrollTop();

            console.log(_t.lastGetCount , _t.perPage);

            if(_t.lastGetCount == _t.perPage){
                if (scTop >= scrollH - height) {

                    if(_t.data.length >= _t.perPage){
                        _t.page_no += 1;
                        _t.getData();
                    }
                }
            }

		});

		_t.listOfResults.off('click').on('click', function () {

            //console.log('CLICK LIST OF RESULTS');

			var id = $(this).attr('data-value');
			var name = $(this).children("span").html();
			_t.value = {
				id: id,
				name: name
			};
			_t.values.push(_t.value);
			_t.setValue();
			_t.searchInput.val('');//.trigger('input');
			if (_t.dd.hasClass('opened')) {
				_t.dd.removeClass('opened');
			}
		});

		$(document).on('click', function (e) {
			e = e || window.event;

			if (!$(e.target).hasClass('select3-wrapper') && !$(e.target).hasClass('select3-inner') && !$(e.target).hasClass('ct-select3-wrapper') && $(e.target).parents('.select3-wrapper').length <= 0 && $(e.target).parents('.select3-dd').length <= 0) {
				if (_t.dd.hasClass('opened')) {
					_t.dd.removeClass('opened');
				}
			}
		});

	};

	Select3.prototype.getData = function (callback) {
		var _t = this;

        console.log('TYPR', _t.type);

		if (_t.type == 'inited') {
			var inlineData = {
				data: [],
				data_columns: ['DB_VALUES', 'CLIENT_VALUES']
			};

			for (var i = 0; i < _t.options.length; i++) {
				var opt = _t.options.eq(i);
				var value = opt.attr('value');
				var text = opt.html();

				//if (value != '') {
				//	if (text.indexOf(value) > -1) {
				//		inlineData.data.push([value, text]);
				//	}
				//} else {
                inlineData.data.push([value, text]);

                //_t.data.push([value, text]);
				//}

			}

            _t.data = inlineData;


            //console.log('inlineData', inlineData);

            _t.populateDD();

			if (typeof callback == 'function') {
				callback(_t);
			}

		}else if(_t.type == 'pregetted'){

            console.log('PREGETTED DATA', _t.data, _t.lastIndex);

            _t.populateDD();
            callback(_t);

        } else if (_t.data && _t.data.data && _t.data.data.length) {
			//_t.setDataToLocalStorage(_t.data);
            alert('strange select3 case in getData');
            _t.populateDD();
			callback(_t);
		} else {
			var o = {};
			//var dependWhereStr = '';
			//if (_t.dependWhere.length)
			//	dependWhereStr += _t.parentObject.getDependWhereForSelect(_t.profile_column_name, _t.wrapper.parents('tr').eq(0).index());

            console.log('INST', _t);
			if (_t.isFilter) {
				o = {
					command: 'getForFilterSelect',
					object: _t.class,
					params: {
                        search_keyword: _t.searchKeyword,
                        column_name: _t.column_name,
                        page_no: _t.page_no
					}
				};

                if(_t.client_object) {
                    o.client_object = _t.client_object;
                }else{
                    o.object = _t.class;
                }
			} else {

				//var wStr = (_t.whereString != '') ? _t.whereString : '';
				//wStr += (_t.searchKeyword == '' || val == '') ? "" : "upper(" + _t.searchKeyword + ") like upper('|percent|" + val + "|percent|')";
				//wStr = (wStr.length > 0) ? (dependWhereStr.length > 0) ? dependWhereStr + ' and ' + wStr : wStr : dependWhereStr;

				o = {
					command: 'getForSelect',
					object: _t.class,
					params: {
						search_keyword: _t.searchKeyword,
						column_name: _t.column_name,
                        page_no: _t.page_no
					}
				};
                if(_t.client_object) {
                    o.client_object = _t.client_object;
                }

				console.log('select3 o ', o);
			}

			socketQuery(o, function (res) {
				//res = socketParse(res, false);
				//if (_t.column_name == '') {
				//	_t.column_name = res.data_columns[0] + ',' + res.data_columns[1];
				//}
				//if (_t.searchKeyword == '') {
				//	_t.searchKeyword = res.data_columns[1];
				//}

				//_t.setDataToLocalStorage(res);

                for(var i in res.data){
                    _t.data.push(res.data[i]);
                }

                _t.lastGetCount = Object.keys(res.data).length;
                _t.populateDD();
				if (typeof callback == 'function') {
					callback(_t);
				}
			});
		}
	};



	Select3.prototype.populateDD = function () {
		var _t = this;
        var data = {
			list: []
		};

		if (_t.withEmptyValue == true && !_t.multiSelect) {
			if (_t.isFilter) {
				data.list.push({id: '', name: ' - Любой - '});
				data.list.push({id: 'isNull', name: ' - Пустой - '});
				data.list.push({id: 'isNotNull', name: ' - Не пустое - '});
			} else {
				data.list.push({id: '', name: ''});
			}
		}

        if(_t.type == 'inited'){

            for (var i2 = _t.lastIndex; i2 < Object.keys(_t.data.data).length; i2++) {
                var item2 = _t.data.data[i2];
                var id2 = undefined;
                var name2 = undefined;

                id2 = item2[_t.data.data_columns.indexOf('DB_VALUES')];//(_t.fromServerIdString == '') ? item[0] : (item[names.indexOf(_t.fromServerIdString.toUpperCase())]) ? item[names.indexOf(_t.fromServerIdString.toUpperCase())] : item[names.indexOf('DB_VALUES')];
                name2 = item2[_t.data.data_columns.indexOf('CLIENT_VALUES')];//(_t.fromServerNameString == '') ? item[1] : (item[names.indexOf(_t.fromServerNameString.toUpperCase())]) ? item[names.indexOf(_t.fromServerNameString.toUpperCase())] : item[names.indexOf('CLIENT_VALUES')];

                data.list.push({id: id2, name: name2, multiSelect: _t.multiSelect});
            }


        }else{
            for (var i = _t.lastIndex; i < _t.data.length; i++) {
                var item = _t.data[i];
                var id = undefined;
                var name = undefined;

                if (_t.isFilter) {
                    id = item[_t.column_name];
                    name = item[_t.column_name];
                } else {
                    id = item[_t.return_id];//(_t.fromServerIdString == '') ? item[0] : (item[names.indexOf(_t.fromServerIdString.toUpperCase())]) ? item[names.indexOf(_t.fromServerIdString.toUpperCase())] : item[names.indexOf('DB_VALUES')];
                    name = item[_t.return_name];//(_t.fromServerNameString == '') ? item[1] : (item[names.indexOf(_t.fromServerNameString.toUpperCase())]) ? item[names.indexOf(_t.fromServerNameString.toUpperCase())] : item[names.indexOf('CLIENT_VALUES')];
                }

                data.list.push({id: id, name: name, multiSelect: _t.multiSelect});
            }
        }


        if(_t.type == 'pregetted'){
            _t.resultWrapper.html(Mustache.to_html(_t.rowTemplate, data));
        }else{
            _t.resultWrapper.append(Mustache.to_html(_t.rowTemplate, data));
        }

        _t.listOfResults = _t.resultWrapper.find('li');
        _t.setHandlers();
        if(_t.type != 'pregetted'){
            _t.lastIndex = Object.keys(_t.data).length;
        }


//		_t.resultsScroll.scrollTop(0);

	};



	var select3List = new Select3List();
	localStorage.setItem('select3', JSON.stringify([]));
	var initFunction = function (params, callback) {
		var instance = new Select3(params);
		select3List.addItem(instance);
		instance.init();
		if (typeof callback == 'function') {
			callback()
		}
		return instance;
	};

	var select3object = {
		list: select3List,
		init: initFunction
	};

	MB.Core.select3 = select3object;

	$.fn.select3 = function () {
		var elem = this;
		var id = MB.Core.guid();
//        var dataObj = [];
//
//        var mO = {
//            id: id,
//            value_id: elem.find('option:selected').attr('value'),
//            value_name: elem.find('option:selected').html(),
//            data: dataObj
//        };

		var selInstance = MB.Core.select3.init({

            id :                id,
            wrapper:            elem,
            type:               'inited', // new
            options:            elem.find('option'), // new
            withSearch:         true,
            withEmptyValue:     elem.data('withempty'),
            absolutePosition:   elem.data('absolute'),
            isFilter:           false
		});

		return selInstance;
	};

//    MB.Core.select3.init({
//        id: MB.Core.guid(),
//        wrapper: $('.content-static.main'),
//        getString: "select2_for_query",
//        column_name: "ORDER_TICKET_ID",
//        view_name: "ORDER_TICKET",
//        value: {
//            id: 10,
//            name: "Выбрать"
//        },
//        data: [],
//        fromServerIdString: 'DB_VALUES',
//        fromServerNameString: 'CLIENT_VALUES',
//        searchKeyword: "ORDER_TICKET_ID"
//    });

	//console.log("Select3`s", MB.Core.select3.list);

};


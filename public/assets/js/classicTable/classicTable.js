var classicTable = function () {
    var customSelection;
    /*var il = {};
     $(document).on('delivery.connect', function (e) {
     console.log('--------ON delivery.connect');
     il = new ImageLoader();
     });*/
    function fixEvent(e) {
        e = e || window.event;

        if (!e.target) e.target = e.srcElement;

        if (e.pageX == null && e.clientX != null) { // если нет pageX..
            var html = document.documentElement;
            var body = document.body;

            e.pageX = e.clientX + (html.scrollLeft || body && body.scrollLeft || 0);
            e.pageX -= html.clientLeft || 0;

            e.pageY = e.clientY + (html.scrollTop || body && body.scrollTop || 0);
            e.pageY -= html.clientTop || 0;
        }

        if (!e.which && e.button) {
            e.which = e.button & 1 ? 1 : ( e.button & 2 ? 3 : ( e.button & 4 ? 2 : 0 ) )
        }

        return e;
    }

    var mouse = {
        isDown: false,
        mouseBtn: 0,
        pageX: 0,
        pageY: 0,
        screenX: 0,
        screenY: 0
    };
    var customSelection = {
        instance: null,
        startTdIndex: 0,
        startTrIndex: 0,
        isSelected: false,
        isSelection: false,
        isMultipleEdit: false,
        cells: [],
        matrix: {thead: {}, tbody: {}}
    };

    $(document).on('mousedown', function (e) {
        e = fixEvent(e);
        mouse.isDown = true;
        mouse.mouseBtn = e.button;
        mouse.pageX = e.pageX;
        mouse.pageY = e.pageY;
        mouse.screenX = e.screenX;
        mouse.screenY = e.screenY;
        if (customSelection.isSelected && !customSelection.isSelecting) {
            var target = $(e.target);
            var isExclude = target.hasClass("exclude-selection");

            if (!isExclude) isExclude = target.closest(".exclude-selection").length > 0;

            if (!isExclude && e.target.tagName != "OBJECT") {
                customSelection.isSelection = false;
                customSelection.instance.clearCustomSelection();
                customSelection.instance.hideTableMenu();
                customSelection.instance = null;
                customSelection.cells = [];
            }
        }
    });
    $(document).on('mouseup', function (e) {
        e = fixEvent(e);
        mouse.isDown = false;
        mouse.isMove = false;
        mouse.mouseBtn = e.button;
        mouse.pageX = e.pageX;
        mouse.pageY = e.pageY;
        mouse.screenX = e.screenX;
        mouse.screenY = e.screenY;

        if (customSelection.isSelecting) {
            customSelection.isSelecting = false;
            customSelection.instance.places.tbody.find("div.readonlyCell").removeClass("noSelectImp");
            customSelection.instance.places.tbody.find("input[type='text']").removeAttr("readonly");
            customSelection.instance.showTableMenu();
        }
    });
    $(document).on('mousemove', function (e) {
        e = fixEvent(e);
        mouse.pageX = e.pageX;
        mouse.pageY = e.pageY;
        mouse.screenX = e.screenX;
        mouse.screenY = e.screenY;
    });

    var TemplateParser = function (tpl, data) {
        var result;

        function reParse(tpl, data) {
            for (var i in data) {
                var key = i;
                var val = data[i];
                var keyWord = '{' + key + '}';
                if (tpl.indexOf(keyWord) != -1) {
                    result = tpl.replace(keyWord, val);
                    delete data[i];
                    reParse(result, data);
                }
            }
        }

        reParse(tpl, data);
        return result;
    };
    var CTables = function () {
        this.tables = [];
    };
    var CTable = function (params) {
        this.id = params.id || MB.Core.guid();
        this.class = params.class;
        this.client_object = params.client_object;
        this.data = params.data || {};
        this.profile = params.profile || {};
        this.wrapper = params.wrapper || undefined;
        this.isInfoOpened = false;
        this.selectedRowIndex = null;
        this.selectedColIndex = null;
        this.infoBlock = undefined;
        this.tableWrapper = undefined;
        this.tds = undefined;
        this.infoBlockColumnsTab = undefined;
        this.infoBlockOptionsTab = undefined;
        this.options = params.options || undefined;
        this.selection2 = {};
        //this.selectionObj = [];
        this.parent_id = params.parent_id || undefined;
        this.changes = [];
        this.filterWhere = [];
        this.hiddenColumns = {};
        this.editedCache = [];
        this.itemsPerPage = params.itemsPerPage;
        this.pagesCount = params.pagesCount;
        this.primary_keys = params.primary_keys;
    };

    var lsName = "CTable";
    var lsTable = {
        name: null,
        userName: null,
        columns: {}
    };

    /*! Handlers */

    var setFilterHandler = function (colName, _t) {
        return function (e) {
            if (e.which == 1 && !mouse.isMove && !$(e.target).hasClass('swr') && !$(e.target).parents('.swr').length > 0) {
                _t.places.theadRow.find('th').not($(this)).removeClass('asc').removeClass('desc');
                var colIndex = $(this).index();


                if ($(this).hasClass('desc') || $(this).hasClass('asc')) {

                    if ($(this).hasClass('desc')) {

                        _t.sort = {
                            columns: [colName],
                            direction: 'asc'
                        };

                        //_t.order_by = colName;

                        $(this).removeClass('desc');
                        $(this).addClass('asc');
                    } else {

                        _t.sort = {
                            columns: [colName],
                            direction: 'desc'
                        };

                        //_t.order_by = colName + ' desc';

                        $(this).removeClass('asc');
                        $(this).addClass('desc');
                    }
                } else {

                    $(this).addClass('asc');
                    _t.sort = {
                        columns: [colName],
                        direction: 'asc'
                    };
                }
//					console.log(_t.order_by);

                MB.Tables.getTable(_t.id).setFilter();
            }
        }
    };

    var enableCustomSelection = function (_t) {
        return function (event) {
            if (event.ctrlKey) {
                var currentTarget = $(event.currentTarget);
                var startColumnName;
                var startTdIndex;
                var startTrIndex;
                var indexes;

                _t.clearCustomSelection();
                customSelection.instance = _t;
                customSelection.isSelecting = true;
                customSelection.isSelection = true;
                startColumnName = _t.places.theadRow.find("th:eq(" + currentTarget.index() + ")").data("column-name");
                startTdIndex = _t.getColumnIndex(startColumnName);
                startTrIndex = currentTarget.closest("tr").index();

                customSelection.startTdIndex = startTdIndex;
                customSelection.startTrIndex = startTrIndex;

                if (!event.shiftKey) {
                    customSelection.cells = [];
                }

                customSelection.cells.push([]);

                indexes = {
                    startTr: startTrIndex,
                    endTr: startTrIndex,
                    startTd: startTdIndex,
                    endTd: startTdIndex
                };

                _t.setCustomSelection(indexes);

                _t.places.tbody.find("div.readonlyCell").addClass("noSelectImp");
                _t.places.tbody.find("input[type='text']").attr("readonly", "readonly");
                _t.clearAllSelection();
                _t.renderSelection();
                _t.hideTableMenu();
            }
        }
    };

    var initSelect3Handler = function (elem, additionalClass) {
        var _t = this;
        $(elem).off('click').on('click', function () {
            if (!$(elem).attr('inited') && !customSelection.isSelection) {

                var sVal = $(elem).data('val');
                var sName = $(elem).data('title');
                var freeType = ($(elem).attr('data-free_type') == 'true');
                var select3Data = _t.getSelect3InsertData($(elem).attr('data-name'));

                var selInstance = MB.Core.select3.init({


                    id :                MB.Core.guid(),
                    wrapper:            $(elem),
                    column_name:        select3Data.column_name,
                    class:              _t.class,
                    client_object:      _t.client_object,
                    return_id:          select3Data.return_id,
                    return_name:        select3Data.return_name,
                    withSearch:         true,
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
                    //getString: select3Data.getString,
                    //column_name: select3Data.column_name,
                    //view_name: select3Data.view_name,
                    //value: {
                    //    id: sVal,
                    //    name: sName
                    //},
                    //data: [],
                    //fromServerIdString: 'id',
                    //fromServerNameString: 'name',
                    //searchKeyword: select3Data.searchKeyword,
                    //withEmptyValue: ($(elem).attr('data-with_empty') == 'true'),
                    //freeType: freeType,
                    //absolutePosition: true,
                    //isSearch: true,
                    //dependWhere: select3Data.lov_where,
                    //parentObject: _t,
                    //profile_column_name: $(elem).attr('data-name'),
                    //additionalClass: additionalClass
                });

                $(selInstance).on('changeVal', function (e, was, now) {
                    var rowIndex, colIndex, row, isNewRow, dataValue, columnName, matrix, td, output, wrapper, column;

                    function changeLOVColumn() {
                        var lovReturnToColumn = column['lov_return_to_column'];
                        var columnIndex;

                        if (lovReturnToColumn == "" || !_t.places.theads[lovReturnToColumn]) return;

                        columnIndex = _t.places.theads[lovReturnToColumn].index();

                        if(Object.keys(_t.places.tds).length > 0){
                            _t.places.tds[rowIndex][columnIndex].find(".readonlyCell").html(now.id);
                        }

                    }

                    function getColumnByIndex(idx) {
                        var tempArr = [];

                        for (var i in _t.visibleArray) {
                            var isVis = _t.visibleArray[i];
                            if (isVis) {
                                tempArr.push(_t.profile.data[i]);
                            }
                        }

                        return tempArr[idx];
                    }

                    function addChange(selectedRowIndex, selectedColIndex) {
                        var newRowId = (isNewRow) ? row.data('id') : null;
                        var chObj = {
                            PRIMARY_KEY_NAMES: _t.primary_keys,
                            PRIMARY_KEY_VALUES: _t.getPKValues(selectedRowIndex, newRowId),
                            CHANGED_COLUMN_NAMES: (column['lov_return_to_column'] != "") ? column['lov_return_to_column'] : column['column_name'],
                            CHANGED_COLUMN_VALUES: now.id,
                            ROW: row
                        };
                        chObj['COMMAND'] = ($(elem).parents('tr').hasClass('new_row')) ? 'NEW' : 'MODIFY';

                        if (!isNewRow) dataValue = _t.data.data[selectedRowIndex][selectedColIndex];
                        console.log(now.name, dataValue);
                        if (now.name != dataValue) {
                            row.addClass('edited');
                            _t.addChange(chObj);
                        }
                        else {
                            _t.removeChange(chObj);
                        }
                    }

                    if (!customSelection.isSelected) {
                        rowIndex = $(elem).parents('tr').index();
                        colIndex = $(elem).parents('td').index();
                        column = getColumnByIndex(colIndex - 1);
                        row = $(elem).parents('tr');
                        isNewRow = row.hasClass("new_row");

                        addChange(_t.selectedRowIndex, _t.selectedColIndex);
                        changeLOVColumn();
                    }
                    else {
                        matrix = customSelection.matrix.tbody;
                        for (var i in matrix)
                            for (var j in matrix[i]) {
                                colIndex = _t.places.theads[_t.data.data_columns[j]].index();
                                rowIndex = i;
                                column = getColumnByIndex(colIndex - 1);
                                td = _t.places.tds[rowIndex][colIndex];
                                wrapper = td.find(".ct-select3-wrapper");
                                output = td.find(".select3-output");
                                row = td.closest("tr");
                                isNewRow = row.hasClass("new_row");

                                wrapper.attr('data-title', now.name);
                                wrapper.attr('data-val', now.id);

                                if (!output.length) {
                                    output = td.find(".ct-select3-wrapper.preInit");
                                    output.children("span").html(now.name);
                                }
                                else {
                                    output.attr('data-id', now.id);
                                    if (output.prop("tagName") == "INPUT") output.val(now.name);
                                    else output.html(now.name);
                                }
                                addChange(i, j);
                                changeLOVColumn();
                            }
                    }
                });

                $(elem).attr('inited', 'true');
                $(elem).removeClass('preInit');
                if (!freeType) selInstance.byClickSelect();
            }
        });

    };

    var initCheckBoxHandler = function (elem) {
        var _t = this;
        var checkboxInstance = $(elem).checkboxIt();

        $(checkboxInstance).off('toggleCheckbox').on('toggleCheckbox', function () {
            var rowIndex, colIndex, row, isNewRow, dataValue, columnName, matrix, value, td, output, instance;

            _t.updateSelectedIndexes(checkboxInstance.elem);


            function addChange(selectedRowIndex, selectedColIndex) {
                var newRowId = (isNewRow) ? row.data('id') : null;
                var chObj = {
                    PRIMARY_KEY_NAMES: _t.primary_keys,
                    PRIMARY_KEY_VALUES: _t.getPKValues(_t.selectedRowIndex, newRowId),
                    CHANGED_COLUMN_NAMES: _t.getColumnNameByIndex(colIndex - 1),
                    CHANGED_COLUMN_VALUES: value,
                    ROW: row
                };

                console.log('DDD', value, chObj);

                chObj['COMMAND'] = (row.hasClass('new_row')) ? 'NEW' : 'MODIFY';

                if (!isNewRow) dataValue = _t.data.data[selectedRowIndex][selectedColIndex];
                if (value != dataValue) {
                    row.addClass('edited');
                    _t.addChange(chObj);
                }
                else {
                    _t.removeChange(chObj);
                }
            }

            if (!customSelection.isSelected && !customSelection.isMultipleEdit) {
                rowIndex = $(elem).parents('tr').index();
                colIndex = $(elem).parents('td').index();
                row = $(elem).parents('tr');
                isNewRow = row.hasClass("new_row");
                value = checkboxInstance.value;
                addChange(_t.selectedRowIndex, _t.selectedColIndex);
            }
            else if (customSelection.isMultipleEdit) {
                matrix = customSelection.matrix.tbody;

                for (var i in matrix)
                    for (var j in matrix[i]) {
                        colIndex = _t.places.theads[_t.data.data_columns[j]].index();
                        rowIndex = i;
                        td = _t.places.tds[rowIndex][colIndex];
                        output = td.find(".ct-checkbox-wrapper");
                        row = td.closest("tr");
                        isNewRow = row.hasClass("new_row");
                        instance = MB.Core.checkboxes.getItem(output.data("id"));
                        value = MB.Core.checkboxes.getItem($(elem).data("id")).value;
                        instance.setValue(value);
                        value = (value);

                        console.log('VALVAL', value);

                        addChange(i, j);
                    }
            }
        });
    };

    var initDateTimeHandler = function (elem, additionalClass) {
        var _t = this;

        $(elem).on('click', function () {
            var dateTimePicker;
            $('.datetimepicker.dropdown-menu').hide(0);

            if (!$(elem).attr('inited') && !customSelection.isSelection) {
                if ($(elem).hasClass('date')) {
                    $(elem).datetimepicker({
                        autoclose: true,
                        todayHighlight: true,
                        minuteStep: 10,
                        keyboardNavigation: false,
                        todayBtn: true,
                        firstDay: 1,
                        weekStart: 1,
                        language: "ru",
                        startDate:'01.01.1900',
                        maxView: 2
                    }).datetimepicker('show');
                } else if ($(elem).hasClass('time')) {
                    $(elem).clockpicker({
                        align: 'left',
                        donetext: 'Выбрать',
                        autoclose: true,
                        afterDone: function () {
                            var val = $(elem).val();
                            if (val.length == 5) $(elem).val(val + ':00');
                        }
                    }).clockpicker('show');
                } else {
                    $(elem).datetimepicker({
                        autoclose: true,
                        todayHighlight: true,
                        minuteStep: 10,
                        keyboardNavigation: false,
                        todayBtn: true,
                        firstDay: 1,
                        weekStart: 1,
                        startDate:'01.01.1900',
                        language: "ru"
                    }).datetimepicker('show');
                }


                dateTimePicker = $(".datetimepicker");
                dateTimePicker.removeClass("exclude-selection");
                if (additionalClass) dateTimePicker.last().addClass(additionalClass);

                $(elem).off('input change').on('input change', function () {
                    var elem = $(this);
                    var rowIndex, colIndex, row, isNewRow, dataValue, columnName, matrix, value, td, output;

                    function addChange(selectedRowIndex, selectedColIndex) {
                        var newRowId = (isNewRow) ? row.data('id') : null;
                        var chObj = {
                            PRIMARY_KEY_NAMES: _t.primary_keys,
                            PRIMARY_KEY_VALUES: _t.getPKValues(_t.selectedRowIndex, newRowId),
                            CHANGED_COLUMN_NAMES: _t.getColumnNameByIndex(colIndex - 1),
                            CHANGED_COLUMN_VALUES: value,
                            ROW: row
                        };

                        chObj['COMMAND'] = (elem.parents('tr').hasClass('new_row')) ? 'NEW' : 'MODIFY';

                        if (!isNewRow) {
                            dataValue = _t.data.data[selectedRowIndex][selectedColIndex];
                            if (elem.hasClass('wo_sec') && dataValue.length > 16) dataValue = dataValue.substring(0, 16);
                        }
                        if (value != dataValue) {
                            row.addClass('edited');
                            _t.addChange(chObj);
                        }
                        else {
                            _t.removeChange(chObj);
                        }
                    }

                    if (!customSelection.isSelected && !customSelection.isMultipleEdit) {
                        rowIndex = elem.parents('tr').index();
                        colIndex = elem.parents('td').index();
                        row = elem.parents('tr');
                        isNewRow = row.hasClass("new_row");
                        value = (elem.val().length == 16) ? elem.val() + ':00' : elem.val();

                        addChange(_t.selectedRowIndex, _t.selectedColIndex);
                    }
                    else if (customSelection.isMultipleEdit) {
                        matrix = customSelection.matrix.tbody;

                        for (var i in matrix)
                            for (var j in matrix[i]) {
                                colIndex = _t.places.theads[_t.data.data_columns[j]].index();
                                rowIndex = i;
                                td = _t.places.tds[rowIndex][colIndex];
                                output = td.find("input");
                                row = td.closest("tr");
                                isNewRow = row.hasClass("new_row");
                                value = (elem.val().length == 16) ? elem.val() + ':00' : elem.val();

                                output.val(value);

                                addChange(i, j);
                            }
                    }
                });
            }
        });
    };

    var inputTypeHandler = function (elem) {
        var _t = this;
        var rowIndex, colIndex, row, isNewRow, dataValue, columnName, matrix, value, td, output;
        _t.updateSelectedIndexes(elem);

        function addChange(selectedRowIndex, selectedColIndex) {

            var newRowId = (isNewRow) ? row.data('id') : null;
            var chObj = {
                PRIMARY_KEY_NAMES: _t.primary_keys,
                PRIMARY_KEY_VALUES: _t.getPKValues(_t.selectedRowIndex, newRowId),
                CHANGED_COLUMN_NAMES: _t.getColumnNameByIndex(colIndex - 1),
                CHANGED_COLUMN_VALUES: (elem.hasClass('phoneNumber')) ? value.replace(/[^0-9]/gim, '') : value,
                ROW: row
            };

            chObj['COMMAND'] = (elem.parents('tr').hasClass('new_row')) ? 'NEW' : 'MODIFY';

            if (!isNewRow) dataValue = _t.data.data[selectedRowIndex][selectedColIndex];

            if (value != dataValue) {
                row.addClass('edited');
                _t.addChange(chObj);
            }
            else {

                _t.removeChange(chObj);
            }
        }


        if (!customSelection.isSelected && !customSelection.isMultipleEdit) {
            rowIndex = $(elem).parents('tr').index();
            colIndex = $(elem).parents('td').index();
            row = $(elem).parents('tr');
            isNewRow = row.hasClass("new_row");
            value = elem.val();

            addChange(_t.selectedRowIndex, _t.selectedColIndex);
        }
        else if (customSelection.isMultipleEdit) {
            matrix = customSelection.matrix.tbody;

            for (var i in matrix) {
                if (matrix.hasOwnProperty(i)) {
                    for (var j in matrix[i]) {
                        if (matrix[i].hasOwnProperty(j)) {
                            colIndex = _t.places.theads[_t.data.data_columns[j]].index();
                            rowIndex = i;
                            td = _t.places.tds[rowIndex][colIndex];
                            output = td.find("input");
                            row = td.closest("tr");
                            isNewRow = row.hasClass("new_row");
                            value = elem.val();
                            output.val(value);

                            addChange(i, j);
                        }
                    }
                }
            }
        }
    };

    var numberTypeHandler = function (elem) {
        var _t = this;
        var rowIndex, colIndex, row, isNewRow, dataValue, columnName, matrix, value, td, output;
        _t.updateSelectedIndexes(elem);

        function addChange(selectedRowIndex, selectedColIndex) {
            var newRowId = (isNewRow) ? row.data('id') : null;
            var chObj = {
                PRIMARY_KEY_NAMES: _t.primary_keys,
                PRIMARY_KEY_VALUES: _t.getPKValues(_t.selectedRowIndex, newRowId),
                CHANGED_COLUMN_NAMES: _t.getColumnNameByIndex(colIndex - 1),
                CHANGED_COLUMN_VALUES: value,
                ROW: row
            };

            chObj['COMMAND'] = (elem.parents('tr').hasClass('new_row')) ? 'NEW' : 'MODIFY';

            if (!isNewRow) dataValue = _t.data.data[selectedRowIndex][selectedColIndex];
            if (value != dataValue) {
                row.addClass('edited');
                _t.addChange(chObj);
            }
            else {
                _t.removeChange(chObj);
            }
        }

        if (!customSelection.isSelected && !customSelection.isMultipleEdit) {
            rowIndex = $(elem).parents('tr').index();
            colIndex = $(elem).parents('td').index();
            row = $(elem).parents('tr');
            isNewRow = row.hasClass("new_row");
            value = elem.val();

            addChange(_t.selectedRowIndex, _t.selectedColIndex);
        }
        else if (customSelection.isMultipleEdit) {
            matrix = customSelection.matrix.tbody;

            for (var i in matrix) {
                if (matrix.hasOwnProperty(i)) {
                    for (var j in matrix[i]) {
                        if (matrix[i].hasOwnProperty(j)) {
                            colIndex = _t.places.theads[_t.data.data_columns[j]].index();
                            rowIndex = i;
                            td = _t.places.tds[rowIndex][colIndex];
                            output = td.find("input");
                            row = td.closest("tr");
                            isNewRow = row.hasClass("new_row");
                            value = elem.val();
                            output.val(value);

                            addChange(i, j);
                        }
                    }
                }
            }
        }
    };

    /*! Handlers */

    CTables.prototype.addItem = function (item) {
        this.tables.push(item);
    };

    CTables.prototype.removeItem = function (id) {
        for (var i in this.tables) {
            var item = this.tables[i];
            if (item.id == id) {
                this.tables.splice(i, 1);
            }
        }
    };

    CTables.prototype.getTableById = function (id) {
        for (var i in this.tables) {
            var table = this.tables[i];
            if (table.id == id) {
                return table;
            }
        }
    };

    CTable.prototype.getRowDataByIndex = function (index) {
        var _t = this;
        return _t.data.data[index];
    };

    CTable.prototype.getCurrentRow = function () {
        var _t = this;
        return _t.data.data[_t.selectedRowIndex];
    };

    CTable.prototype.getColumnNameByIndex = function (idx) {
        var _t = this;
        var tempArr = [];

        for (var i in _t.visibleArray) {
            var isVis = _t.visibleArray[i];
            if (isVis) {
                tempArr.push(_t.profile.data[i]);
            }
        }

        return tempArr[idx]['column_name'];
    };

    CTable.prototype.getPKValues = function (rowIndex, newRowId) {
        var _t = this;
        var res = [];
        for (var i in _t.primary_keys) {
            var item = _t.primary_keys[i];
            if (newRowId) {
                res.push('NEW_ROW_' + newRowId);
            } else {
                res.push(_t.data.data[rowIndex][item]);
            }
        }
        return res;
    };

    CTable.prototype.reloadSelect3Html = function (items) {
        for (var i in items) {
            if (items.hasOwnProperty(i)) {
                var item = $(items[i]);
                var value;
                if (item.attr("inited")) {
                    value = item.find(".select3-output").html();
                    item.removeAttr("inited").addClass("preInit");
                    item.html('<span class="select3-inner">' + value + '</span><i class="fa fa-angle-down"></i>');
                }
            }
        }
    };

    CTable.prototype.getTypeHtml = function (params) {

        var _t = this;
        var res = '';
        var select2Params = {};


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

        //var quoteSign = (typeof params.value == 'string') ? ((params.value.indexOf('"') != -1) ? "'" : '"') : '"';

        if (params.isTd && _t.profile['extra_data']['object_profile']['modify_command'] == false && !params.isNew) {
            params.editable = false;
        }

//        debugger;


        if(params.isNew){

            //if (!params.editable || ((!params.isNew && params.updatable) || (params.isNew && params.insertable)) ) {
            if (!params.editable && (params.isNew && !params.insertable)) { // next row was here <-
//        || ((!params.isNew && params.insertable) || (params.isNew && params.updatable))

                if (params.type == 'checkbox') {
                    var valStr = (params.value) ? '<i class="fa fa-check"></i>' : '<i class="fa fa-times"></i>';
                    res = '<div class="readonlyCell checkboxReadOnly">' + valStr + '</div>';
                } else {
                    if (params.name == 'barcode') {
                        res = '<div class="barCodeCell">' + params.value + '</div>';
                    } else {
                        if(params.type == 'wysiwyg'){
                            res = '<div class="readonlyCell wysiwyg-readonly">' + ((params.selId && !params.value) ? params.selId : params.value) + '</div>';
                        }else if(params.type == 'percent'){
                            res = '<div class="readonlyCell percent-readonly" data-value="'+params.value+'"><div class="percent-readonly-bar" style="width:'+params.value+'%; background-color: '+ getPercentColor(params.value)+';"></div><div class="percent-readonly-text">'+params.value+'%</div></div>';
                        }else if(params.type == 'colorpicker'){
                            res = '<div class="readonlyCell readonlyColorCell"><div class="readonlyColor" style="background-color: '+params.value+'"></div></div>';
                        }else{
                            res = '<div class="readonlyCell">' + ((params.selId && !params.value) ? params.selId : params.value) + '</div>';
                        }
                    }
                }
            } else {
                if (params.type.indexOf("select2") > -1 || params.type == "multiselect") {
                    select2Params = {
                        withEmptyValue: params.type == "select2withEmptyValue",
                        freeType: params.type == "select2FreeType",
                        multiSelect: params.type == "multiselect"
                    };
                }
                if(typeof params.value === 'string'){
                    params.value = params.value.replaceAll('"','&#34;');
                }

                switch (params.type) {
                    case 'text':

                        if(params.name.indexOf('custom_buttons') > -1){
                            var btnId = params.name.replace('custom_buttons_','');
                            res = '<div class="ct-cell-insert-custom-buttons" data-id="'+btnId+'"></div>';
                        }else{
                            res = '<input type="text" value="' + params.value + '">';
                        }
                        break;
                    case 'textarea':
                        res = '<textarea class="in-table-textarea">' + params.value + '</textarea>';
                        break;
                    case 'wysiwyg':
                        res = '<input type="text" value="' + params.value + '">';
                        break;
                    case 'like_text':
                        res = '<input class="ct-filter-like-text-wrapper" data-name="' + params.name + '" type="text" value="">';
                        break;
                    case 'phone':
                        res = '<input type="text" class="phoneNumber" value="' + params.value + '">';
                        break;
                    case 'checkbox':
                        if (params.isTd) {
                            var isChecked = (params.value) ? 'checked' : '';
                            res = '<div class="ct-checkbox-wrapper ' + isChecked + '" data-type="inTable" data-id="' + MB.Core.guid() + '" data-name="' + params.name + '" data-value="' + params.value + '"></div>';
                        } else {
                            res = '<div class="ct-filter-checkbox-wrapper" data-type="filter" data-id="' + MB.Core.guid() + '" data-name="' + params.name + '"></div>';
                        }
                        break;
                    case 'number':
                        res = '<input type="number" value="' + params.value + '">';
                        break;
                    case 'float2':
                        res = '<input type="number" step="0.01" value="' + params.value + '">';
                        break;
                    case 'datetime':
                        res = '<div class="absoluteWhiteText">' + params.value + '</div><input type="text" class="datetimepicker" value="' + params.value + '" data-date-format="dd.mm.yyyy hh:ii:ss">';
                        break;
                    case 'datetime_wo_sec':
                        res = '<div class="absoluteWhiteText">' + params.value + '</div><input type="text" class="datetimepicker wo_sec" value="' + params.value.substr(0, 16) + '" data-date-format="dd.mm.yyyy hh:ii">';
                        break;
                    case 'daysweek':
                        res = '<input type="text" data-name="' + params.name + '" data-id="' + MB.Core.guid() + '" class="ct-daysweek-select3-wrapper daysweekpicker">';
                        break;
                    case 'daterange':
                        res = '<div data-name="' + params.name + '" class="input-daterange input-group ct-daterange-wrapper">' +
                            '<input type="text" name="start" data-date-format="dd.mm.yyyy">' +
                            '<span class="input-group-addon">-</span>' +
                            '<input type="text" name="end" data-date-format="dd.mm.yyyy">' +
                            '</div>';
                        break;
                    case 'datetimerange':
                        res = '<div data-name="' + params.name + '" class="input-daterange input-group ct-datetimerange-wrapper">' +
                            '<input type="text" name="start" data-date-format="dd.mm.yyyy hh:ii">' +
                            '<span class="input-group-addon">-</span>' +
                            '<input type="text" name="end" data-date-format="dd.mm.yyyy hh:ii">' +
                            '</div>';
                        break;
                    case 'timerange':
                        res = '<div data-name="' + params.name + '" class="input-daterange input-group ct-timerange-wrapper">' +
                            '<input type="text" name="start">' +
                            '<span class="input-group-addon">-</span>' +
                            '<input type="text" name="end">' +
                            '</div>';
                        break;
                    case 'date':
                        res = '<div class="absoluteWhiteText">' + params.value + '</div><input type="text" class="datetimepicker date" value="' + params.value + '" data-date-format="dd.mm.yyyy">';
                        break;
                    case 'time':
                        res = '<div class="absoluteWhiteText">' + params.value + '</div><input type="text" class="datetimepicker time" value="' + params.value + '" data-date-format="hh:ii:ss">';
                        break;
                    case 'File':
                        res = '<div class="imageEditor-item">' + params.value + '</div>';
                        break;
                    case 'select2withEmptyValue':
                    case 'select2FreeType':
                    case 'multiselect':
                    case 'select2':
                        res = '<div data-multiselect="' + select2Params.multiSelect + '" data-free_type="' + select2Params.freeType + '" data-with_empty="' + select2Params.withEmptyValue + '" data-val="' + params.selId + '" data-title="' + params.value + '" data-name="' + params.name + '" class="ct-select3-wrapper preInit"><span class="select3-inner">' + params.value + '</span><i class="fa fa-angle-down"></i></div>';
                        break;
                    case 'colorpicker':
                        res = '<input type="text" class="ct-colorpicker-wrapper" value="' + params.value + '"><div  class="ct-colorpicker-state" style="background-color: ' + params.value + '"></div>';
                        break;
                    default :
                        res = '<div>type: ' + params.type + ' - ' + params.value + '</div>';
                        break;
//            case 'datepicker' :
//                res = '<input type="text" class="datepicker" value="'+value+'"/>';
//                break;
//            case 'colorpicker':
//                res = '<input type="text" class="colorpicker" value="'+value+'" />';
//                break;
//            case 'textarea':
//                res = '<textarea class="ct-textarea">'+value+'</textarea>';
//                break;
//            case 'checkbox':
//                var isChecked = (value)? 'checked="checked"': '';
//                res = '<input type="checkbox" '+isChecked+'/>';
//                break;
//            case 'select':
//                res = '<select class="select3"><option valuelue+'</option></select>';
//                break;
//            case 'input':
//                res = '<input type="text" value="'+value+'" />';
//                break;
                }
            }

        }else{

            //if (!params.editable || ((!params.isNew && params.updatable) || (params.isNew && params.insertable)) ) {
            if (!params.editable) { // next row was here <-
//        || ((!params.isNew && params.insertable) || (params.isNew && params.updatable))

                if (params.type == 'checkbox') {
                    var valStr = (params.value) ? '<i class="fa fa-check"></i>' : '<i class="fa fa-times"></i>';
                    res = '<div class="readonlyCell checkboxReadOnly">' + valStr + '</div>';
                } else {
                    if (params.name == 'barcode') {
                        res = '<div class="barCodeCell">' + params.value + '</div>';
                    } else {
                        if(params.type == 'wysiwyg'){
                            res = '<div class="readonlyCell wysiwyg-readonly">' + ((params.selId && !params.value) ? params.selId : params.value) + '</div>';
                        }else if(params.type == 'percent'){
                            res = '<div class="readonlyCell percent-readonly" data-value="'+params.value+'"><div class="percent-readonly-bar" style="width:'+params.value+'%; background-color: '+ getPercentColor(params.value)+';"></div><div class="percent-readonly-text">'+params.value+'%</div></div>';
                        }else if(params.type == 'colorpicker'){
                            res = '<div class="readonlyCell readonlyColorCell"><div class="readonlyColor" style="background-color: '+params.value+'"></div></div>';
                        }else{
                            res = '<div class="readonlyCell">' + ((params.selId && !params.value) ? params.selId : params.value) + '</div>';
                        }
                    }
                }
            } else {
                if (params.type.indexOf("select2") > -1 || params.type == "multiselect") {
                    select2Params = {
                        withEmptyValue: params.type == "select2withEmptyValue",
                        freeType: params.type == "select2FreeType",
                        multiSelect: params.type == "multiselect"
                    };
                }
                if(typeof params.value === 'string'){
                    params.value = params.value.replaceAll('"','&#34;');
                }

                switch (params.type) {
                    case 'text':
                        if(params.name.indexOf('custom_buttons') > -1){
                            var btnId = params.name.replace('custom_buttons_','');
                            res = '<div class="ct-cell-insert-custom-buttons" data-id="'+btnId+'"></div>';
                        }else{
                            res = '<input type="text" value="' + params.value + '">';
                        }
                        break;
                    case 'textarea':
                        res = '<textarea class="in-table-textarea">' + params.value + '</textarea>';
                        break;
                    case 'wysiwyg':
                        res = '<input type="text" value="' + params.value + '">';
                        break;
                    case 'like_text':
                        res = '<input class="ct-filter-like-text-wrapper" data-name="' + params.name + '" type="text" value="">';
                        break;
                    case 'phone':
                        res = '<input type="text" class="phoneNumber" value="' + params.value + '">';
                        break;
                    case 'checkbox':
                        if (params.isTd) {
                            var isChecked = (params.value) ? 'checked' : '';
                            res = '<div class="ct-checkbox-wrapper ' + isChecked + '" data-type="inTable" data-id="' + MB.Core.guid() + '" data-name="' + params.name + '" data-value="' + params.value + '"></div>';
                        } else {
                            res = '<div class="ct-filter-checkbox-wrapper" data-type="filter" data-id="' + MB.Core.guid() + '" data-name="' + params.name + '"></div>';
                        }
                        break;
                    case 'number':
                        res = '<input type="number" value="' + params.value + '">';
                        break;
                    case 'float2':
                        res = '<input type="number" step="0.01" value="' + params.value + '">';
                        break;
                    case 'datetime':
                        res = '<div class="absoluteWhiteText">' + params.value + '</div><input type="text" class="datetimepicker" value="' + params.value + '" data-date-format="dd.mm.yyyy hh:ii:ss">';
                        break;
                    case 'datetime_wo_sec':
                        res = '<div class="absoluteWhiteText">' + params.value + '</div><input type="text" class="datetimepicker wo_sec" value="' + params.value.substr(0, 16) + '" data-date-format="dd.mm.yyyy hh:ii">';
                        break;
                    case 'daysweek':
                        res = '<input type="text" data-name="' + params.name + '" data-id="' + MB.Core.guid() + '" class="ct-daysweek-select3-wrapper daysweekpicker">';
                        break;
                    case 'daterange':
                        res = '<div data-name="' + params.name + '" class="input-daterange input-group ct-daterange-wrapper">' +
                            '<input type="text" name="start" data-date-format="dd.mm.yyyy">' +
                            '<span class="input-group-addon">-</span>' +
                            '<input type="text" name="end" data-date-format="dd.mm.yyyy">' +
                            '</div>';
                        break;
                    case 'datetimerange':
                        res = '<div data-name="' + params.name + '" class="input-daterange input-group ct-datetimerange-wrapper">' +
                            '<input type="text" name="start" data-date-format="dd.mm.yyyy hh:ii">' +
                            '<span class="input-group-addon">-</span>' +
                            '<input type="text" name="end" data-date-format="dd.mm.yyyy hh:ii">' +
                            '</div>';
                        break;
                    case 'timerange':
                        res = '<div data-name="' + params.name + '" class="input-daterange input-group ct-timerange-wrapper">' +
                            '<input type="text" name="start">' +
                            '<span class="input-group-addon">-</span>' +
                            '<input type="text" name="end">' +
                            '</div>';
                        break;
                    case 'date':
                        res = '<div class="absoluteWhiteText">' + params.value + '</div><input type="text" class="datetimepicker date" value="' + params.value + '" data-date-format="dd.mm.yyyy">';
                        break;
                    case 'time':
                        res = '<div class="absoluteWhiteText">' + params.value + '</div><input type="text" class="datetimepicker time" value="' + params.value + '" data-date-format="hh:ii:ss">';
                        break;
                    case 'File':
                        res = '<div class="imageEditor-item">' + params.value + '</div>';
                        break;
                    case 'select2withEmptyValue':
                    case 'select2FreeType':
                    case 'multiselect':
                    case 'select2':
                        res = '<div data-multiselect="' + select2Params.multiSelect + '" data-free_type="' + select2Params.freeType + '" data-with_empty="' + select2Params.withEmptyValue + '" data-val="' + params.selId + '" data-title="' + params.value + '" data-name="' + params.name + '" class="ct-select3-wrapper preInit"><span class="select3-inner">' + params.value + '</span><i class="fa fa-angle-down"></i></div>';
                        break;
                    case 'colorpicker':
                        res = '<input type="text" class="ct-colorpicker-wrapper" value="' + params.value + '"><div  class="ct-colorpicker-state" style="background-color: ' + params.value + '"></div>';
                        break;
                    default :
                        res = '<div>type: ' + params.type + ' - ' + params.value + '</div>';
                        break;
//            case 'datepicker' :
//                res = '<input type="text" class="datepicker" value="'+value+'"/>';
//                break;
//            case 'colorpicker':
//                res = '<input type="text" class="colorpicker" value="'+value+'" />';
//                break;
//            case 'textarea':
//                res = '<textarea class="ct-textarea">'+value+'</textarea>';
//                break;
//            case 'checkbox':
//                var isChecked = (value)? 'checked="checked"': '';
//                res = '<input type="checkbox" '+isChecked+'/>';
//                break;
//            case 'select':
//                res = '<select class="select3"><option valuelue+'</option></select>';
//                break;
//            case 'input':
//                res = '<input type="text" value="'+value+'" />';
//                break;
                }
            }

        }



        return res;
    };

    CTable.prototype.setHeaderWidth = function () {
//        
//        var table = $('.classicTableWrap[data-id="'+_t.id+'"] table');

//        for(var i=0; i<_t.places.tableFixHeader.find('div').length; i++){
//            var item = _t.places.tableFixHeader.find('div').eq(i);
//            var firstRow = _t.places.tbody.find('tr').eq(0);
//            var tds = firstRow.find('td');
//            var tdW = tds.eq(i)[0].getBoundingClientRect().width;
//            if (i == 0){
//                item.width(tdW+'px');
//            }else{
//                item.width(tdW-1+'px');
//            }
//        }
    };

    CTable.prototype.addChange = function (change) {
        var _t = this;
        var incPKN = change['PRIMARY_KEY_NAMES'];
        var incPKV = change['PRIMARY_KEY_VALUES'];
        var incCCN = change['CHANGED_COLUMN_NAMES'];
        var incCCV = change['CHANGED_COLUMN_VALUES'];
        var incCOM = change['COMMAND'];
        var incROW = change['ROW'];

        function isEqualArrays(arr1, arr2) {
            var isEqual = 0;
            if (arr1.length != arr2.length) {
                return false;
            }
            for (var i in arr1) {
                var aVal1 = arr1[i];
                var aVal2 = arr2[i];
                if (aVal1 !== aVal2) {
                    isEqual += 1;
                }
            }
            return isEqual === 0;
        }

        var added = false;
        for (var i in _t.changes) {
            var ch = _t.changes[i];

            if (isEqualArrays(incPKN, ch['PRIMARY_KEY_NAMES']) && isEqualArrays(incPKV, ch['PRIMARY_KEY_VALUES']) && incCOM == ch['COMMAND']) {

                if (typeof ch['CHANGED_COLUMN_NAMES'] == 'object' && typeof ch['CHANGED_COLUMN_VALUES'] == 'object') {
                    var inANamesIdx = $.inArray(incCCN, ch['CHANGED_COLUMN_NAMES']);
                    if (inANamesIdx > -1) {
                        _t.changes[i]['CHANGED_COLUMN_VALUES'][inANamesIdx] = incCCV;
                        added = true;
                    } else {
                        _t.changes[i]['CHANGED_COLUMN_NAMES'].push(incCCN);
                        _t.changes[i]['CHANGED_COLUMN_VALUES'].push(incCCV);
                        added = true;
                    }
                } else {
                    if (incCCN == ch['CHANGED_COLUMN_NAMES']) {
                        _t.changes[i]['CHANGED_COLUMN_VALUES'] = incCCV;
                        added = true;
                    } else {
                        _t.changes[i]['CHANGED_COLUMN_NAMES'] = [_t.changes[i]['CHANGED_COLUMN_NAMES']];
                        _t.changes[i]['CHANGED_COLUMN_VALUES'] = [_t.changes[i]['CHANGED_COLUMN_VALUES']];
                        _t.changes[i]['CHANGED_COLUMN_NAMES'].push(incCCN);
                        _t.changes[i]['CHANGED_COLUMN_VALUES'].push(incCCV);
                        added = true;
                    }
                }
            }
        }
        if (!added) {
            _t.changes.push(change);
        }

        _t.toggleSaveButton(true);
    };

    CTable.prototype.removeChange = function (change) {
        var _t = this;
        var changes = _t.changes;
        var incPKN = change['PRIMARY_KEY_NAMES'];
        var incPKV = change['PRIMARY_KEY_VALUES'];
        var incCOM = change['COMMAND'];
        var incCCN = change['CHANGED_COLUMN_NAMES'];

        function isEqualArrays(arr1, arr2) {
            var isEqual = 0;
            if (arr1.length != arr2.length) {
                return false;
            }
            for (var i in arr1) {
                var aVal1 = arr1[i];
                var aVal2 = arr2[i];
                if (aVal1 !== aVal2) {
                    isEqual += 1;
                }
            }
            return isEqual === 0;
        }

        for (var i in changes) {
            if (changes.hasOwnProperty(i)) {
                var ch = changes[i];

                if (isEqualArrays(incPKN, ch['PRIMARY_KEY_NAMES']) && isEqualArrays(incPKV, ch['PRIMARY_KEY_VALUES']) && incCOM == ch['COMMAND']) {
                    if (typeof ch['CHANGED_COLUMN_NAMES'] == 'object' && typeof ch['CHANGED_COLUMN_VALUES'] == 'object') {
                        var inANamesIdx = $.inArray(incCCN, ch['CHANGED_COLUMN_NAMES']);
                        if (inANamesIdx > -1) {
                            changes[i]['CHANGED_COLUMN_VALUES'].splice(inANamesIdx, 1);
                            changes[i]['CHANGED_COLUMN_NAMES'].splice(inANamesIdx, 1);

                            if (changes[i]['CHANGED_COLUMN_NAMES'].length == 0) {
                                changes.splice(i, 1);
                                change.ROW.removeClass('edited');
                                break;
                            }
                        }
                    } else {
                        changes.splice(i, 1);
                        change.ROW.removeClass('edited');
                        break;
                    }
                }
            }
        }

        if (!_t.changes.length) {
            _t.toggleSaveButton(false);
        }
    };

    CTable.prototype.getSelect3InsertData = function (name) {
        var _t = this;
        var result = {};

        function removeSpaces(str) {
            if (typeof str == 'string') return str.replace(/\s+/g, '');
            else return str;
        }

        for (var i in _t.profile.data) {
            var item = _t.profile.data[i];
            if (item['column_name'] == name) {

                //console.log('item>>>>', item);

                result.getString =      item['from_table'];
                result.column_name =    removeSpaces(item['column_name']);
                result.view_name =      item['reference_client_object'];
                result.class =          _t.class;
                result.return_id =      removeSpaces(item['return_id']);
                result.return_name =    removeSpaces(item['return_name']);
                result.searchKeyword =  removeSpaces(item['lov_columns'].split(',')[1]);
                result.lov_where =      item['lov_where'];
            }
        }
        if (result.getString === undefined) console.log(name, item);

        return result;
    };

    CTable.prototype.update = function (callback) {
        var _t = this;

        var localStorage = this.getLocalStorage();
        var matrix = {thead: {}, tbody: {}};
        var newRowsLength = _t.places.tbody.children("tr.new_row").length;
        for (var i in _t.data.data) {
            matrix.tbody[i] = {};
            for (var j in _t.profile.data) {
                if (_t.visibleArray[j]) {
                    matrix.tbody[i][j] = true;
                    matrix.thead[j] = true;
                }
            }
        }

        _t.editedCache = [];

        _t.places.tbody.children("tr.edited:not('.new_row')").each(function () {
            var elem = $(this);
            var index = elem.index() - newRowsLength;
            var obj = {
                instance: elem,
                index: elem.index(),
                primary_keys: {}
            };

            obj.primary_keys.data_columns = _t.primary_keys;
            obj.primary_keys.data = _t.getPKValues(index);

            _t.editedCache.push(obj);
        });

        _t.places.tbody.find("tr:not('.new_row')").remove();

        _t.renderTableBody(_t.places, matrix, localStorage);
        _t.renderPaginationBlock();
        _t.cacheTableCell();

//		_t.populateTotalSumms();
        _t.returnTotalSummIniter();
        _t.renderSelection();
        _t.setHandlers();
        

        if (typeof callback == 'function') {
            callback();
        }
    };

    CTable.prototype.renderPaginationBlock = function () {
        var _t = this;
        var paginationBlock = (+_t.data['extra_data']['count_all'] <= +_t.itemsPerPage) ? 'invisible' : '';
        if (paginationBlock == 'invisible') {
            _t.wrapper.find('.ct-pagination-wrapper').addClass(paginationBlock);
        } else {
// ALSURU
            _t.pagesCount = Math.ceil( _t.data['extra_data']['count_all'] / _t.itemsPerPage ) ;
// ALSURU             

            _t.wrapper.find('.ct-pagination-wrapper').removeClass('invisible');
            _t.wrapper.find('.ct-pagination-current-input').val(parseInt(_t.tempPage));



            _t.wrapper.find('.ct-pagination-pagesCount').html('Страниц: ' + _t.pagesCount);
        }
    };

    CTable.prototype.addWhere = function (where) {

        //console.log('TO ADD', where);

        var _t = this;
        var updated = 0;
        for (var i in _t.filterWhere) {
            var w = _t.filterWhere[i];
            if (w.key == where.key) {
                if (where.val1 === '' && where.val2 == '') {
                    _t.filterWhere.splice(i, 1);
                } else {

                    w.val1 = where.val1;
                    w.val2 = where.val2;
                    //w.value = where.value;
                }
                updated++;
            }
        }
        if (updated == 0) {
            if (where.val1 != '' || where.val2 != '') {
                _t.filterWhere.push(where);
            }
        }

        //console.log(_t.filterWhere);

    };

    CTable.prototype.renderEnvironment = function (callback) {
        var _t = this;
        var tpl = undefined;
        var btnTpl = undefined;
        var btnsMusObj = undefined;
        var btnObj = undefined;

        if (!MB.Tables.getTable(_t.id).parent_id) {
            tpl = '<div class="ct-environment-wrapper" data-id="' + _t.id + '">' +
            '<div class="ct-environment-header">{{tableName}} <span class="ct-total-values-wrapper"><span class="ct-upload-total-summs">Загрузить суммарные значения</span></span></div>' +
            '<div class="ct-environment-buttons"><ul>{{{buttons}}}</ul></div>' +
            '</div>';

            btnTpl = '{{#btns}}<li class="ct-environment-btn {{className}}">' +
            '<div class="nb btn btnDouble {{colorClass}}">' +
            '<i class="fa {{iconClass}}"></i><div class="btnDoubleInner">{{title}}</div>' +
            '</div></li>{{/btns}}';

            btnsMusObj = {btns: []};
            btnObj = undefined;
            if (_t.profile['extra_data']['object_profile']['new_command']) {
                btnObj = {
                    title: 'Создать',
                    colorClass: 'green',
                    iconClass: 'fa-plus',
                    className: 'ct-btn-create-inline'
                };
                btnsMusObj.btns.push(btnObj);
                if (_t.profile['extra_data']['object_profile']['open_form_client_object'] != '') {
                    btnObj = {
                        title: 'Создать в форме',
                        colorClass: 'green',
                        iconClass: 'fa-plus',
                        className: 'ct-btn-create-in-form'
                    };
                    btnsMusObj.btns.push(btnObj);
                }

            }
            if (_t.profile['extra_data']['object_profile']['new_command'] && _t.profile['extra_data']['object_profile']['duplication_function']) {
                btnObj = {
                    title: 'Дублировать',
                    colorClass: 'blue',
                    iconClass: 'fa-copy',
                    className: 'ct-btn-duplicate'
                };
                btnsMusObj.btns.push(btnObj);
            }
            if (_t.profile['extra_data']['object_profile']['remove_command']) {
                btnObj = {
                    title: 'Удалить',
                    colorClass: 'red',
                    iconClass: 'fa-trash-o',
                    className: 'ct-btn-remove'
                };
                btnsMusObj.btns.push(btnObj);
            }

            //btnObj = {
            //    title: 'Сбросить кэш',
            //    colorClass: 'red',
            //    iconClass: 'fa-refresh',
            //    className: 'ct-btn-drop-cache'
            //};
            //btnsMusObj.btns.push(btnObj);

            var data = {
                tableName: _t.profile['extra_data']['object_profile']['name_ru'] || _t.profile['extra_data']['object_profile']['name'],
                buttons: Mustache.to_html(btnTpl, btnsMusObj)
            };
            _t.wrapper.prepend(Mustache.to_html(tpl, data));
        } else {
            var tpl = '<div class="ct-environment-wrapper" data-id="' + _t.id + '">' +
                '<div class="ct-environment-header">{{{tableName}}} <span class="ct-total-values-wrapper"><span class="ct-upload-total-summs">Загрузить суммарные значения</span></span></div>' +
                '<div class="ct-environment-buttons"><ul>{{{buttons}}}</ul></div>' +
                '</div>';

            var btnTpl = '{{#btns}}<li class="ct-environment-btn {{className}}">' +
                '<div class="nb btn btnDouble {{colorClass}}">' +
                '<i class="fa {{iconClass}}"></i><div class="btnDoubleInner">{{title}}</div>' +
                '</div></li>{{/btns}}';

            var btnsMusObj = {btns: []};
            var btnObj = undefined;
            if (_t.profile['extra_data']['object_profile']['new_command']) {
                btnObj = {
                    title: 'Создать',
                    colorClass: 'green',
                    iconClass: 'fa-plus',
                    className: 'ct-btn-create-inline'
                };
                btnsMusObj.btns.push(btnObj);
            }
            if (_t.profile['extra_data']['object_profile']['new_command'] && _t.profile['extra_data']['object_profile']['duplication_function']) {
                btnObj = {
                    title: 'Дублировать',
                    colorClass: 'blue',
                    iconClass: 'fa-copy',
                    className: 'ct-btn-duplicate'
                };
                btnsMusObj.btns.push(btnObj);
            }
            if (_t.profile['extra_data']['object_profile']['remove_command']) {
                btnObj = {
                    title: 'Удалить',
                    colorClass: 'red',
                    iconClass: 'fa-trash-o',
                    className: 'ct-btn-remove'
                };
                btnsMusObj.btns.push(btnObj);
            }

            var data = {
                tableName: (btnsMusObj.btns.length > 0) ? '&nbsp;' : '', //_t.profile['extra_data']['object_profile']['CLIENT_OBJECT_NAME']
                buttons: Mustache.to_html(btnTpl, btnsMusObj)
            };
            _t.wrapper.prepend(Mustache.to_html(tpl, data));
//			console.log('environment rendered');
        }

        if (typeof callback == 'function') {
            callback();
        }
    };

    CTable.prototype.render = function (callback) {
        var _t = this;
        _t.tempPage = parseInt(_t.tempPage) || 1;
        _t.visibleArray = [];
        var isFastSearch = false;
        for (var v in _t.profile.data) {
            var vItem = _t.profile.data[v];
            var isVisible = vItem['visible'];
            var isQuer = vItem['quick_search_field'];
            _t.visibleArray.push(isVisible);
            if (isQuer) {
                isFastSearch = true;
            }
        }
//1652
//		console.log(_t);

        var result = '';
        var filterHtml = '';
        var fh_res = '';
        var wrapper = _t.wrapper;
        var rowsMaxNum = _t.itemsPerPage;
        var paginationBlock = (_t.data['extra_data']) ? ((+_t.data['extra_data']['count_all'] <= +rowsMaxNum) ? 'invisible' : '') : 'invisible';
        var inlineSaveBtn
            = (_t.profile['extra_data']['object_profile']['new_command'] || _t.profile['extra_data']['object_profile']['modify_command']) ? (MB.Tables.getTable(_t.id).parent_id == undefined || MB.Tables.getTable(_t.id).parent_id == '') ? '<div class="ct-options-item ct-options-save"><i class="fa fa-save"></i>&nbsp;&nbsp;Сохранить</div>' : '' : '';
        var fastSearchHtml = (isFastSearch) ? '<div class="ct-fast-search-wrapper"><input class="ct-fast-search classicTable-navigate-input" type="text" placeholder="Быстрый поиск..."/></div>' : '';

        var isCheckboxWhere = _t.profile['extra_data']['object_profile'].checkbox_where != '';
        var checkboxWhereCheckedHtml = _t.profile['extra_data']['object_profile'].checkbox_where_default_enabled ? ' checked' : '';
        var checkboxWhereHtml = (isCheckboxWhere) ? '<div class="ct-checkbox-where-wrapper"><label for="checkboxWhere' + _t.id + '">' + _t.profile['extra_data']['object_profile'].checkbox_where_title + '</label><input id="checkboxWhere' + _t.id + '" class="ct-checkbox-where" type="checkbox"' + checkboxWhereCheckedHtml + '></div>' : '';

        var p_isCheckboxWhere = _t.profile['extra_data']['object_profile'].param_checkbox_where != '';
        var p_checkboxWhereCheckedHtml = _t.profile['extra_data']['object_profile'].param_checkbox_where_default_enabled ? ' checked' : '';
        var p_checkboxWhereHtml = (isCheckboxWhere) ? '<div class="ct-param-checkbox-where-wrapper"><label for="param_checkboxWhere' + _t.id + '">' + _t.profile['extra_data']['object_profile'].param_checkbox_where_title + '</label><input id="param_checkboxWhere' + _t.id + '" class="ct-param-checkbox-where" type="checkbox"' + checkboxWhereCheckedHtml + '></div>' : '';

        var isFilters = false;
        for (var isF in _t.profile.data) {
            var fItem = _t.profile.data[isF];
            var filterType = fItem['filter_type'];
            if (filterType != '') {
                isFilters = true;
                break;
            }
        }

        var filterContainer = (isFilters) ? '<ul class="ct-filter-list row"></ul><div class="ct-clear-filter"><i class="fa fa-ban"></i></div><div class="ct-confirm-filter"><i class="fa fa-check"></i></div>' : '';
        var filterInvisible = (isFilters) ? '' : 'hidden';

        var html = '<div class="classicTableWrap" data-id="' + _t.id + '">' +
            '<div class="ct-filter">' + filterContainer + '</div>' +
            '<div class="classicTableFunctional">' +
            '<div class="ct-pagination-wrapper ' + paginationBlock + '">' +
            '<div class="ct-pagination-item ct-pagination-prev"><i class="fa fa-angle-left"></i></div>' +
            '<div class="ct-pagination-current"><input type="text" class="ct-pagination-current-input" value="' + _t.tempPage + '"/></div>' +
            '<div class="ct-pagination-item ct-pagination-next"><i class="fa fa-angle-right"></i></div>' +
            '<div class="ct-pagination-pagesCount">Страниц: ' + _t.pagesCount + '</div>' +
            '</div>' +
            '<div data-with_empty="false" data-val="' + rowsMaxNum + '" data-title="' + rowsMaxNum + '" data-name="" class="ct-select3-wrapper ct-items-per-page preInit"><span class="select3-inner">' + rowsMaxNum + '</span><i class="fa fa-angle-down"></i></div>' +

            fastSearchHtml +
            checkboxWhereHtml +
            p_checkboxWhereHtml +

            '<div class="ct-notify-wrapper"></div>' +
            '<div class="ct-options-wrapper">' +
            inlineSaveBtn +
            '<div class="ct-options-item ct-options-filter ' + filterInvisible + '"><i class="fa fa-filter"></i>&nbsp;Фильтры</div>' +
            '<div class="ct-options-item ct-options-drop-filters"><i class="fa fa-ban"></i></div>' +
            '<div class="ct-options-item ct-options-hide-columns"><i class="fa fa-table"></i></div>' +
            '<div class="ct-options-item ct-options-excel exclude-selection"><i class="fa fa-cogs exclude-selection"></i></div>' +
            '<div class="ct-options-item ct-options-reload"><i class="fa fa-refresh"></i></div>' +
            '</div>' +
            '<div class="ct-functional-dd">' +
            '<ul class="ct-functional-list">' +
            '<li class="exportToExcel exclude-selection"><i class="fa fa-download"></i>&nbsp;Выгрузить в excel</li>' +
            '<li class="sendExcelToEmail exclude-selection"><i class="fa fa-envelope-o"></i>&nbsp;Отправить excel на почту</li>' +
            '<li class="ct-exportToFile exclude-selection"><i class="fa fa-download"></i>&nbsp;Экспорт</li>' +
            '<li class="ct-importFromFile exclude-selection"><i class="fa fa-download"></i>&nbsp;Импорт</li>' +
            '</ul>' +
            '<div class="ct-functional-close exclude-selection"><i class="fa fa-times exclude-selection"></i></div>' +
            '</div>' +
            '</div>' +
            '<div class="ct-fader"></div>' +
            '<div class="tableWrapper"><div class="tableFixHeader"></div></div>' +
            '<div class="classicTableInfo" data-id="' + _t.id + '">' +
            '<div class="closeTableInfo"></div>' +
            '<div class="tabs-wrapper">' +
            '<div class="tabs-row">' +
            '<div class="tab-btn active" data-id="columns">Колонки</div>' +
            '<div class="tab-btn" data-id="options">Опции</div>' +
            '</div>' +
            '<div class="tabs-contents">' +
            '<div class="tab active" data-id="columns"></div>' +
            '<div class="tab" data-id="options"></div>' +
            '</div>' +
            '</div>' +
            '</div></div>';

        wrapper.html(html);

        var tableWrapper = wrapper.find('.classicTableWrap[data-id="' + _t.id + '"] .tableWrapper');

        var matrix = {thead: {}, tbody: {}};
        for (var i in _t.profile.data) {
            if (_t.visibleArray[i]) {
                matrix.thead[i] = true;
                for (var j in _t.data.data) {
                    if (!matrix.tbody[j]) matrix.tbody[j] = {};
                    matrix.tbody[j][i] = true;
                }
            }
        }

        //console.log('matrix', matrix);

        var table = _t.renderTable(matrix);

        tableWrapper.append(table);
        _t.container = $('.classicTableWrap[data-id="' + _t.id + '"]');

        _t.places = {
            table: table,
            theadRow: table.find('thead tr'),
            theads: {},
            tbody: table.find('tbody'),
            tds: {},
            tableFixHeader: _t.container.find('.tableFixHeader'),
            filterList: _t.container.find('.ct-filter-list'),
            fastSearch: _t.container.find('input.ct-fast-search'),
            checkboxWhere: _t.container.find('input.ct-checkbox-where'),
            p_checkboxWhere: _t.container.find('input.ct-param-checkbox-where'),
            saveButton: _t.container.find(".ct-options-save"),
            tableWrapper: tableWrapper
        };

        _t.cacheTableCell();
        _t.hideTable();
		//console.log('data inserted', new Date(), new Date().getMilliseconds());

        if (isFilters) {
            var checkboxesFilterHtml = '';
            for (var f in _t.profile.data) {
                var fItem = _t.profile.data[f];
                var filterType = fItem['filter_type'];
                if (filterType != '') {
                    var fName = fItem['column_name'];
                    var fNameRu = (fItem['filter_label'] && fItem['filter_label'] != '') ? fItem['filter_label'] : fItem['name'];
                    var fSelId = fItem['column_name'];
                    var htmlElemParams = {
                        type: filterType,
                        value: '',
                        editable: true,
                        name: fName,
                        selId: fSelId,
                        isTd: false
                    };

                    if (filterType == 'checkbox') {
                        checkboxesFilterHtml += '<li data-name="' + fName + '" class="filterItem col-md-3" data-filterType="' + filterType + '" ><div class="filterTitle">' + fNameRu + ':</div>' + _t.getTypeHtml(htmlElemParams) + '</li>';
                    } else {
                        filterHtml += '<li data-name="' + fName + '" class="filterItem col-md-3" data-filterType="' + filterType + '" ><div class="filterTitle">' + fNameRu + ':</div>' + _t.getTypeHtml(htmlElemParams) + '</li>';
                    }

                }
            }
            _t.places.filterList.html(filterHtml + checkboxesFilterHtml);
        }

        _t.wrapper.find('.ct-filter div.ct-select3-wrapper').each(function (index, elem) {
            var sVal = $(elem).data('val');
            var sName = $(elem).data('title');
            var select3Data = _t.getSelect3InsertData($(elem).attr('data-name'));

            var selInstance = MB.Core.select3.init({

                id :                MB.Core.guid(),
                wrapper:            $(elem),
                column_name:        select3Data.column_name,
                class:              _t.class,
                client_object:      _t.client_object,
                return_id:          select3Data.return_id,
                return_name:        select3Data.return_name,
                withSearch:         true,
                withEmptyValue:     ($(elem).attr('data-with_empty') == 'true'),
                absolutePosition:   true,
                isFilter:           true,
                parentObject:       _t,
                value: {
                    id: sVal,
                    name: sName
                },
                additionalClass:    ''

                //id: MB.Core.guid(),
                //wrapper: $(elem),
                //getString: select3Data.getString,
                //column_name: select3Data.column_name,
                //view_name: select3Data.view_name,
                //value: {
                //    id: sVal,
                //    name: sName
                //},
                //data: [],
                //fromServerIdString: 'id',
                //fromServerNameString: 'name',
                //searchKeyword: select3Data.searchKeyword,
                //withEmptyValue: true,
                //multiSelect: $(elem).attr('data-multiselect') == 'true',
                //absolutePosition: false,
                //isFilter: true,
                //isSearch: true,
                //filterColumnName: $(elem).attr('data-name'),
                //filterClientObject: _t.profile['extra_data']['object_profile']['client_object'],
                //parentObject: _t,
                //profile_column_name: $(elem).attr('data-name')
            });

            $(selInstance).on('changeVal', function (e, was, now) {
                var filterType = selInstance.wrapper.parents('li.filterItem').eq(0).attr('data-filterType');
                var filterName = selInstance.wrapper.data('name');
                var filterValue = selInstance.wrapper.data('val');

                var wObj = {
                    key: (filterValue == '') ? filterName : filterValue,
                    val1: now.id,
                    type: '='
                };

                var wObj2 = {
                    key: _t.getProfileByColumnName(filterName)
                };



                _t.addWhere(wObj);
            });
        });

        _t.wrapper.find('.ct-filter input.ct-daysweek-select3-wrapper').each(function (index, elem) {
            var daysweekpickerInstance = $(elem).daysweekpicker();
            $(daysweekpickerInstance).on('changeDays', function () {
                var wObj = {
                    name: $(elem).data('name'),
                    value: this.value,
                    type: 'daysweek'
                };
                var wObj2 = {
                    key: $(elem).data('name'),
                    type: '=',
                    comparisonType: 'in',
                    val1: this.value,
                    val2: ''
                };

                _t.addWhere(wObj2);
            });
        });

        _t.wrapper.find('.ct-filter div.ct-daterange-wrapper').each(function (index, elem) {
            var fromInp = $(elem).find('input[name="start"]');
            var toInp = $(elem).find('input[name="end"]');
            var columnName = $(elem).attr('data-name');
            var columnProfile = [];

            for (var i in _t.profile.data) {
                var pI = _t.profile.data[i];
                if (pI['COLUMN_NAME'] == columnName) {
                    columnProfile = pI;
                }
            }

            var tryColName = columnProfile['TABLE_COLUMN_NAME'];
            var filterColumnName = (tryColName !== '' && tryColName !== undefined) ? tryColName : columnName;

            fromInp.datetimepicker({
                autoclose: true,
                todayHighlight: true,
                keyboardNavigation: true,
                todayBtn: true,
                firstDay: 1,
                weekStart: 1,
                language: "ru",
                minView: 2
            }).off('changeDate change').on('changeDate change', function () {
                var wValue = (fromInp.val() == '' && toInp.val() == '') ? '' : {from: fromInp.val(), to: toInp.val()};
                var wObj = {
                    name: filterColumnName,
                    value: wValue,
                    type: 'daterange'
                };

                var wObj2 = {
                    key: filterColumnName,
                    type: '..',
                    comparisonType: 'and',
                    val1: fromInp.val(),
                    val2: toInp.val()
                };

                _t.addWhere(wObj2);
            });
            toInp.datetimepicker({
                autoclose: true,
                todayHighlight: true,
                keyboardNavigation: true,
                todayBtn: true,
                firstDay: 1,
                weekStart: 1,
                language: "ru",
                minView: 2
            }).off('changeDate change').on('changeDate change', function () {
                var wValue = (fromInp.val() == '' && toInp.val() == '') ? '' : {from: fromInp.val(), to: toInp.val()};

                var wObj = {
                    name: filterColumnName,
                    value: wValue,
                    type: 'daterange'
                };

                var wObj2 = {
                    key: filterColumnName,
                    type: '..',
                    comparisonType: 'and',
                    val1: fromInp.val(),
                    val2: toInp.val()
                };

                _t.addWhere(wObj2);
            });

        });

        _t.wrapper.find('.ct-filter div.ct-datetimerange-wrapper').each(function (index, elem) {
            var fromInp = $(elem).find('input[name="start"]');
            var toInp = $(elem).find('input[name="end"]');
            var columnName = $(elem).attr('data-name');
            var columnProfile = [];

            for (var i in _t.profile.data) {
                var pI = _t.profile.data[i];
                if (pI['COLUMN_NAME'] == columnName) {
                    columnProfile = pI;
                }
            }

            var tryColName = columnProfile['TABLE_COLUMN_NAME'];
            var filterColumnName = (tryColName !== '' && tryColName !== undefined) ? tryColName : columnName;

            fromInp.datetimepicker({
                autoclose: true,
                todayHighlight: true,
                keyboardNavigation: true,
                todayBtn: true,
                firstDay: 1,
                weekStart: 1,
                language: "ru",
                minView: 0
            }).off('changeDate change').on('changeDate change', function () {

                var wValue = (fromInp.val() == '' && toInp.val() == '') ? '' : {from: fromInp.val(), to: toInp.val()};
                var wObj = {
                    name: filterColumnName,
                    value: wValue,
                    type: 'datetimerange'
                };

                var wObj2 = {
                    key: filterColumnName,
                    type: '..',
                    comparisonType: 'and',
                    val1: fromInp.val(),
                    val2: toInp.val()
                };

                _t.addWhere(wObj2);
            });
            toInp.datetimepicker({
                autoclose: true,
                todayHighlight: true,
                keyboardNavigation: true,
                todayBtn: true,
                firstDay: 1,
                weekStart: 1,
                language: "ru",
                minView: 0
            }).off('changeDate change').on('changeDate change', function () {
                var wValue = (fromInp.val() == '' && toInp.val() == '') ? '' : {from: fromInp.val(), to: toInp.val()};

                var wObj = {
                    name: filterColumnName,
                    value: wValue,
                    type: 'datetimerange'
                };

                var wObj2 = {
                    key: filterColumnName,
                    type: '..',
                    comparisonType: 'and',
                    val1: fromInp.val(),
                    val2: toInp.val()
                };

                _t.addWhere(wObj2);
            });

        });

        _t.wrapper.find('.ct-filter div.ct-timerange-wrapper').each(function (index, elem) {
            var fromInp = $(elem).find('input[name="start"]');
            var toInp = $(elem).find('input[name="end"]');
            var columnName = $(elem).attr('data-name');

            fromInp.clockpicker({
                align: 'left',
                donetext: 'Выбрать',
                autoclose: true,
                afterDone: function () {
                    fromInp.removeClass('invalid');
                    var wValue = (fromInp.val() == '' && toInp.val() == '') ? '' : {
                        from: fromInp.val(),
                        to: toInp.val()
                    };
                    var wObj = {
                        name: columnName,
                        value: wValue,
                        type: 'timerange'
                    };

                    var wObj2 = {
                        key: columnName,
                        type: '..',
                        comparisonType: 'and',
                        val1: fromInp.val(),
                        val2: toInp.val()
                    };

                    _t.addWhere(wObj2);
                }
            });

            toInp.clockpicker({
                align: 'left',
                donetext: 'Выбрать',
                autoclose: true,
                afterDone: function () {
                    toInp.removeClass('invalid');
                    var wValue = (fromInp.val() == '' && toInp.val() == '') ? '' : {
                        from: fromInp.val(),
                        to: toInp.val()
                    };
                    var wObj = {
                        name: columnName,
                        value: wValue,
                        type: 'timerange'
                    };

                    var wObj2 = {
                        key: columnName,
                        type: '..',
                        comparisonType: 'and',
                        val1: fromInp.val(),
                        val2: toInp.val()
                    };

                    _t.addWhere(wObj2);
                }
            });
        });


        _t.wrapper.find('.ct-filter-checkbox-wrapper').each(function (index, elem) {
            var checkboxInstance = $(elem).checkboxIt();
            $(checkboxInstance).off('toggleCheckbox').on('toggleCheckbox', function () {
                var wObj = {
                    name: $(elem).data('name'),
                    value: this.value,
                    type: 'checkbox'
                };

                var wObj2 = {
                    key: $(elem).data('name'),
                    type: '=',
                    comparisonType: 'and',
                    val1: this.value,
                    val2: ''
                };

                _t.addWhere(wObj2);
            });
        });

        _t.wrapper.find('.ct-filter input.ct-filter-like-text-wrapper').each(function (index, elem) {
            var columnName = $(elem).attr('data-name');
            var wObj = {
                name: columnName,
                value: $(elem).val(),
                type: 'like_text'
            };

            var wObj2 = {
                key: columnName,
                type: 'like',
                comparisonType: 'and',
                val1: $(elem).val(),
                val2: ''
            };

            _t.addWhere(wObj2);
        });

		//console.log('filters inserted and inited', new Date(), new Date().getMilliseconds());

        result = '';
        if (_t.wrapper.find('.ct-filter .filterItem').length == 0) {
            _t.wrapper.find('.classicTableFunctional').css('marginTop', -15 + 'px');
        } else {
            _t.wrapper.find('.classicTableFunctional').css('marginTop', '-' + (Math.ceil(_t.wrapper.find('.ct-filter .filterItem').length / 4) * 65 + 7) + 'px');
        }


        _t.renderEnvironment();
//		_t.populateTotalSumms();
        _t.returnTotalSummIniter();
        _t.setHandlers();

        _t.environment = $('.ct-environment-wrapper[data-id="' + _t.id + '"]');
        _t.places.removeButton = _t.environment.find(".ct-btn-remove > div.btn");

        _t.renderSelection();

//		console.log('handlers setted', new Date(), new Date().getMilliseconds());
        if (typeof callback == 'function') {
            callback();
        }

    };

    CTable.prototype.renderTable = function (matrix, convert) {
        var _t = this;
        var i;
        var html;
        //var fh_res = '';
        var places;
        var localStorage = this.getLocalStorage();



        var table = $('<table></table>');
        table.addClass("classicTable");
        html = '<thead><tr></tr></thead><tbody></tbody>';
        table.html(html);

        places = {
            theadRow: table.find('thead tr'),
            tbody: table.find('tbody')
        };

        if (!localStorage || localStorage.userName != MB.User.username) {
            localStorage = null;
        }

        _t.renderTableHead(places, matrix, localStorage);
        _t.renderTableBody(places, matrix, localStorage, convert);
        return table;
    };

    CTable.prototype.renderTableHead = function (places, matrix, localStorage) {
        var _t = this;
        var columnWidth;
        var columnHidden;
        var result = '';
        //  fh_res += '<div>+</div>';
        places.theadRow.append('<th>+</th>');

        //console.log('renderTableHead ', _t.profile);

        for (var i in matrix.thead) {
            if (matrix.thead.hasOwnProperty(i)) {
                var name = _t.profile.data[i]["name"];
                var columnName = _t.profile.data[i]["column_name"];
                var hint = _t.profile.data[i]["hint"];

                var th = $("<th></th>");
                th.attr("data-column-name", columnName);
                if (hint){
                    th.attr("title", hint);
                }
                result = '<div class="thInner"><div class="wSet">' + name + '</div><i class="fa sortIcon desc fa-caret-up"></i><i class="fa sortIcon asc fa-caret-down"></i><div class="swr"></div></div>';
                th.html(result);
                th.on("click", setFilterHandler(columnName, _t));
                places.theadRow.append(th);
                if (localStorage && localStorage.columns[columnName]) {
                    columnWidth = localStorage.columns[columnName].width;
                    columnHidden = localStorage.columns[columnName].hidden;

                    if (columnWidth) th.find(".wSet").width(columnWidth);
                    if (columnHidden) th.addClass("hidden");
                }
                else columnHidden = false;
                if (i > 0) _t.hiddenColumns[th.index()] = columnHidden;
                // fh_res += '<div>' + name + '</div>';
            }
        }
        //places.tableFixHeader.html(fh_res);

    };

    CTable.prototype.renderTableBody = function (places, matrix, localStorage, convert) {
        var _t = this;
        var columnWidth;
        var columnHidden;
        var result = '';
        var primary_keys = {data_columns: _t.primary_keys, data: []};

        for (var i in matrix.tbody) {
            var row = _t.data.data[i];
            if (matrix.tbody.hasOwnProperty(i)) {
                var tr = $("<tr></tr>");
                var l, item;
                var cache = _t.editedCache;
                var isAdd = true;

                primary_keys.data = _t.getPKValues(i);

                for (l in cache) {
                    if (cache.hasOwnProperty(l)) {
                        item = cache[l];
                        if (JSON.stringify(item.primary_keys) === JSON.stringify(primary_keys)) {
                            var cachedTr = item.instance;

                            _t.reloadSelect3Html(cachedTr.find(".ct-select3-wrapper"));

                            isAdd = false;

                            tr = cachedTr;
                            break;
                        }
                    }
                }

                if (isAdd) {
                    result = '<td class="frst"><div class="markRow" data-checked="false"><div class="rIdx">' + (+i + 1) + '</div><i class="fa fa-check"></i></div></td>';
                    tr.append(result);
                    var j = 0;
                    for (var cellName in row) {
                        if (matrix.thead.hasOwnProperty(j)) {
                            var td = $("<td></td>");
                            if (matrix.tbody[i][j]) {
                                var type = (!convert) ? _t.profile.data[j]['type_of_editor'] : "text";
                                var isEditable = (!convert) ? _t.profile.data[j]['editable'] : "FALSE";
                                var isInsertable = _t.profile.data[j]['insertable'];
                                var isUpdatable = _t.profile.data[j]['updatable'];
                                var isReqired = _t.profile.data[j]['required'];
                                var columnName = _t.profile.data[j]["column_name"];
                                var selId = (row[_t.profile.data[j]['lov_return_to_column']] != "") ? row[_t.profile.data[j]['lov_return_to_column']] : row[_t.profile.data[j]['column_name']];
                                var cell = row[cellName];
                                var isTd = true;
                                var tdW = $("<div></div>");

                                //if(cellName == 'quick_search_field') console.log(row, cellName, row[cellName]);

                                var htmlElemParams = {
                                    type: type,
                                    value: cell,
                                    editable: isEditable,
                                    insertable: isInsertable,
                                    updatable: isUpdatable,
                                    name: cellName,
                                    selId: selId,
                                    isTd: isTd
                                };

                                tdW.addClass("tdW");

                                if (localStorage && localStorage.columns[columnName]) {
                                    columnWidth = localStorage.columns[columnName].width;
                                    columnHidden = localStorage.columns[columnName].hidden;
                                    if (columnWidth) tdW.width(columnWidth);
                                    if (columnHidden) td.addClass("hidden");
                                }

                                tdW.html(_t.getTypeHtml(htmlElemParams));
                                td.append(tdW);

                            }

                            td.on("mousedown", enableCustomSelection(_t));
                            tr.append(td);
                        }
                        j++;
                    }
                }

                places.tbody.append(tr);
            }
        }
    };

    CTable.prototype.cacheTableCell = function () {
        var _t = this;

        _t.places.theadRow.find('th').each(function () {
            var elem = $(this);
            var data = $(this).data('column-name');
            _t.places.theads[data] = elem;
        });

        _t.places.tbody.children('tr').each(function () {
            var tr = $(this);
            var trIndex = tr.index();
            _t.places.tds[trIndex] = {};

            tr.children('td').each(function () {
                var td = $(this);
                var tdIndex = td.index();
                _t.places.tds[trIndex][tdIndex] = td;
            });
        });
    };

    CTable.prototype.initClipboard = function (elem, parent) {
        var _t = this;
        var clipboard = new ZeroClipboard(elem);
        var zcContainerId = ZeroClipboard.config('containerId');
        var hoverClass = ZeroClipboard.config('hoverClass');

        $('#' + zcContainerId).hover(function () {
            parent.addClass(hoverClass);
        }, function () {
            parent.removeClass(hoverClass);
        });

        clipboard.on('ready', function (event) {
            // console.log( 'movie is loaded' );

            clipboard.on('copy', function (event) {
                var table;

                if (customSelection.isSelected) {
                    var matrix = customSelection.matrix;
                    table = '<table>' + _t.renderTable(matrix, true).html() + '</table>';
                }
                else table = '<table>' + _t.wrapper.find('table.classicTable').html() + '</table>';

                event.clipboardData.setData('text/html', table);
                toastr["success"]("Таблица скопирована");
            });

            clipboard.on('aftercopy', function (event) {

            });
        });
    };

    CTable.prototype.notify = function (params) {
        var _t = this;
        var container = _t.wrapper.find('.ct-notify-wrapper');
        /**
         * params
         * type: bool show / hide
         * text: string
         */
        if (params.type) {
            container.html(params.text).show(0).animate({
                opacity: 1
            }, 150);
        } else {
            container.html('').animate({
                opacity: 0
            }, 150, function () {
                container.hide(150);
            });
        }
    };

    CTable.prototype.renderSelection = function () {

        var _t = this;
        var rows = _t.wrapper.find('tbody tr');
        var primaryKeys = _t.selection2.primary_keys;
        var data = _t.data.data;
        var isAdd = primaryKeys && primaryKeys.length;

        rows.removeClass('selectedRow');
        rows.find("div.markRow").attr('data-checked', 'false');

        if (isAdd) {
            for (var j in primaryKeys) {
                if (primaryKeys.hasOwnProperty(j)) {
                    for (var i in data) {
                        if (_t.comparePrimaryKeys(_t.selection2.primary_keys[j].data, _t.getPKValues(i))) {
                            rows.not(".new_row").eq(i).addClass('selectedRow');
                            rows.not(".new_row").eq(i).find('div.markRow').attr('data-checked', 'true');
                            _t.selectedRowIndex = +i;
                            break;
                        }
                    }
                }
            }
        }
        _t.toggleRemoveButton(isAdd > 0);
        //console.log(JSON.stringify(_t.selection2));
    };

    CTable.prototype.getIndexesByData = function (isSelectedIndex) {
        var _t = this;
        var primaryKeys = _t.selection2.primary_keys;
        var indexes = [];
        for (var j in primaryKeys) {
            if (primaryKeys.hasOwnProperty(j)) {
                var index = _t.getIndexesByPrimaryKey(_t.selection2.primary_keys[j]);
                if (index != null) {
                    if (isSelectedIndex && index == _t.selectedRowIndex) return index;
                    else if (!isSelectedIndex) indexes.push(index);
                }
            }
        }
        return indexes;
    };

    CTable.prototype.getIndexesByPrimaryKey = function (primaryKey) {
        var _t = this;
        var index = null;
        var data = _t.data.data;

        for (var i in data) {
            if (data.hasOwnProperty(i)) {
                if (_t.comparePrimaryKeys(primaryKey.data, _t.getPKValues(i))) {
                    index = +i;
                    break;
                }
            }
        }
        ;

        return index;
    };

    CTable.prototype.getIndexOfSelectionByRowIndex = function () {
        var _t = this;
        var rowIndex = _t.selectedRowIndex;
        var primaryKeys = _t.selection2.primary_keys;
        for (var i in primaryKeys) {
            if (primaryKeys.hasOwnProperty(i)) {
                if (_t.comparePrimaryKeys(primaryKeys[i].data, _t.getPKValues(rowIndex))) {
                    return i;
                }
            }
        }
    };

    CTable.prototype.comparePrimaryKeys = function (pKeys1, pKeys2) {
        return JSON.stringify(pKeys1) === JSON.stringify(pKeys2);
    };

    CTable.prototype.clearAllSelection = function () {
        var _t = this;
        _t.selection2 = {};
    };

    CTable.prototype.setHandlers = function () {
        var _t = this;
        var visArr = [];

        for (var i in _t.profile.data) {
            var pI = _t.profile.data[i];
            if (pI['visible']) {
                visArr.push(pI);
            }
        }

        _t.places.tbody.find('.barCodeCell').each(function (index, elem) {
            $(elem).append('<div class="showBarcode">' + DrawCode39Barcode($(elem).html(), 0) + '</div>');
        });

        _t.places.tbody.find('div.ct-select3-wrapper').each(function (index, elem) {
            initSelect3Handler.call(_t, elem, "");
        });

        _t.places.tbody.find('div.imageEditor-item').each(function (index, elem) {
            var _elem = $(elem);
            _elem.off('click').on('click', function () {
                var sVal = _elem.html();
                var id = MB.Core.guid();
                var instance;
                if (!_elem.attr('inited')) {
                    instance = MB.Core.imageEditor.init({
                        id: id,
                        target: _elem,
                        src: sVal
                    });

                    $(instance).on('update', function (e) {
                        var rowIndex, colIndex, row, isNewRow, dataValue, td, value;

                        function addChange(selectedRowIndex, selectedColIndex) {
                            var newRowId = (isNewRow) ? row.data('id') : null;
                            var chObj = {
                                PRIMARY_KEY_NAMES: _t.primary_keys,
                                PRIMARY_KEY_VALUES: _t.getPKValues(_t.selectedRowIndex, newRowId),
                                CHANGED_COLUMN_NAMES: _t.getColumnNameByIndex(colIndex - 1),
                                CHANGED_COLUMN_VALUES: value,
                                ROW: row
                            };

                            chObj['COMMAND'] = (row.hasClass('new_row')) ? 'NEW' : 'MODIFY';

                            if (!isNewRow) dataValue = _t.data.data[selectedRowIndex][selectedColIndex];
                            if (value != dataValue) {
                                row.addClass('edited');
                                _t.addChange(chObj);
                            }
                            else {
                                _t.removeChange(chObj);
                            }
                        }

                        value = instance.data.name;
                        rowIndex = $(_elem).parents('tr').index();
                        colIndex = $(_elem).parents('td').index();
                        row = $(_elem).parents('tr');
                        isNewRow = row.hasClass("new_row");

                        _elem.html(value);

                        addChange(_t.selectedRowIndex, _t.selectedColIndex);
                    });


                    _elem.attr('inited', "true");
                    _elem.attr('data-id', id);
                }
                else {
                    instance = MB.Core.imageEditor.list.getItem(_elem.data('id'));
                    instance.open();
                }

            });
        });

        _t.places.tbody.find('div.ct-checkbox-wrapper').each(function (index, elem) {
            initCheckBoxHandler.call(_t, elem);
        });

        _t.places.tbody.find('input.phoneNumber').phoneIt();

        _t.places.tbody.find('input.ct-colorpicker-wrapper').each(function (index, elem) {

            var rowIndex = $(this).parents('tr').index();
            var colIndex = $(this).parents('td').index();
            var colorPickerInstance = $(elem).colorpicker();
            var stateView = $(elem).parents('td').eq(0).find('.ct-colorpicker-state');
            var isNew = $(this).parents('tr').hasClass('new_row');
            var row = $(this).parents('tr');
            var isNewRow = row.hasClass("new_row");
            colorPickerInstance.off('changeColor').on('changeColor', function (e) {

                stateView.css('backgroundColor', e.color.toHex());
                var dataValue;
                var color = e.color.toHex();
                var newRowId = (isNewRow) ? row.data('id') : null;
                var chObj = {
                    PRIMARY_KEY_NAMES: _t.primary_keys,
                    PRIMARY_KEY_VALUES: _t.getPKValues(_t.selectedRowIndex, newRowId),
                    CHANGED_COLUMN_NAMES: _t.getColumnNameByIndex(colIndex - 1),
                    CHANGED_COLUMN_VALUES: color,
                    ROW: row
                };

                chObj['COMMAND'] = ($(this).parents('tr').hasClass('new_row')) ? 'NEW' : 'MODIFY';

                if (!isNewRow) dataValue = _t.data.data[_t.selectedRowIndex][_t.selectedColIndex];
                if (color != dataValue) {
                    row.addClass('edited');
                    _t.addChange(chObj);
                }
                else {
                    _t.removeChange(chObj);
                }
            });
        });

        _t.places.tbody.find('input.datetimepicker').each(function (index, elem) {
            //var format = ($(elem).val().length > 16) ? "dd.mm.yyyy hh:ii:ss" : "dd.mm.yyyy hh:ii";
            initDateTimeHandler.call(_t, elem);
        });



        _t.infoBlock = _t.wrapper.find('.classicTableInfo');
        _t.infoBlockColumnsTab = _t.infoBlock.find('.tab[data-id="columns"]');
        _t.infoBlockOptionsTab = _t.infoBlock.find('.tab[data-id="options"]');
        _t.tableWrapper = _t.wrapper.find('.tableWrapper');
        _t.tds = _t.wrapper.find('tbody td');
        _t.markRow = _t.wrapper.find('.markRow');


        _t.places.fastSearch.off('input').on('input', function () {
            var value = $(this).val();
            var whereStr = '( ';
            var queryColls = [];



            function checkMask(value) {
                var mask = /^[0-9]+(\s+)?-(\s+)?[0-9]+(\s+)?$/i;
                return mask.test(value);
            }

            var fastSearchArray = [];

            if (value.length > 1) {
                for (var i in _t.profile.data) {
                    var col = _t.profile.data[i];
                    var isQuery = col['quick_search_field'];
                    if (isQuery) {
                        queryColls.push({
                            name: col['column_name'],
                            dataType: col['data_type'],
                            isBetween: col['quick_number_between_search']
                        });
                    }
                }

                for (var k in queryColls) {

                    //key:'name',
                    //    type:'=',
                    //    val1:'Инв',
                    //    val2:''

                //case '=':
                //case '>':
                //case '<':
                //case '<=':
                //case '>=':
                //case '<>':
                //    break;
                //case 'in':
                //    break;
                //case 'between':
                //case '..':



                    var collName = queryColls[k].name;
                    var dataType = queryColls[k].dataType;
                    var isBetween = queryColls[k].isBetween;
                    var orStr = (k == queryColls.length - 1) ? '' : ' or ';
                    var valStr;

                    //(dataType == "number" && isBetween && checkMask(value))? '..': 'like',

                    if (dataType == "number" && isBetween && checkMask(value)) {
                        var numbers = value.replace(/\s+/g, '');
                        numbers = numbers.split("-");

                        fastSearchArray.push({
                            key: queryColls[k].name,
                            group: 'fast_search',
                            comparisonType: 'or',
                            type: '..',
                            val1: numbers[0],
                            val2: numbers[1]
                        });

                        valStr = "between " + numbers[0] + " AND " + numbers[1];
                    } else {

                        fastSearchArray.push({
                            key: queryColls[k].name,
                            group: 'fast_search',
                            comparisonType: 'or',
                            type: 'like',
                            val1: value,
                            val2: ''
                        });

                        valStr = "like '%" + value.toUpperCase() + "%'";
                    }

                    whereStr += "upper(" + collName + ") " + valStr + orStr;
                }
                whereStr += ' )';


                MB.Tables.getTable(_t.id).fastSearchWhere = fastSearchArray;
                MB.Tables.getTable(_t.id).tempPage = 1;
                MB.Tables.getTable(_t.id).reload();
            } else {
                if (value == '') {
                    MB.Tables.getTable(_t.id).fastSearchWhere = [];
                    MB.Tables.getTable(_t.id).tempPage = 1;
                    MB.Tables.getTable(_t.id).reload();
                }
            }

        });

        _t.places.checkboxWhere.off('change').on('change', function () {
            var tableNewInstance = MB.Tables.getTable(_t.id);
            tableNewInstance.reload();
        });

        _t.places.p_checkboxWhere.off('change').on('change', function () {
            var tableNewInstance = MB.Tables.getTable(_t.id);
            tableNewInstance.reload();
        });

        _t.markRow.off('click').on('click', function (e) {
            var elem = $(this);
            var isShift = e.shiftKey;
            var isChecked = $(this).attr('data-checked') == 'true';
            var primaryKeys = _t.selection2.primary_keys;
            var lastSelected = (primaryKeys && primaryKeys.length) ? _t.getIndexesByPrimaryKey(primaryKeys[primaryKeys.length - 1]) : null;
            var data = _t.selection2.data;
            var primary_key = {data_columns: _t.primary_keys, data: []};

            _t.updateSelectedIndexes(elem, true);

            if (_t.selectedRowIndex != null) {
                if (isChecked) {
                    if (primaryKeys.length > 0) {
                        var spliceIdx = _t.getIndexOfSelectionByRowIndex();
                        primaryKeys.splice(spliceIdx, 1);
                        data.splice(spliceIdx, 1);
                    } else {
                        console.warn('where is an checked row which not written in model');
                    }
                } else {
                    if (primaryKeys) {
                        if (isShift) {
                            if (lastSelected <= _t.selectedRowIndex) {
                                for (var i = lastSelected + 1; i <= +_t.selectedRowIndex; i++) {
                                    if (primaryKeys.indexOf(i) != -1) {
                                        continue;
                                    }
                                    primaryKeys.push({data_columns: _t.primary_keys, data: _t.getPKValues(i)});
                                    data.push(_t.data.data[i]);
                                }
                            } else {
                                for (var k = lastSelected - 1; k >= +_t.selectedRowIndex; k--) {
                                    if (primaryKeys.indexOf(k) != -1) {
                                        continue;
                                    }
                                    primaryKeys.push({data_columns: _t.primary_keys, data: _t.getPKValues(k)});
                                    data.push(_t.data.data[k]);
                                }
                            }
                        } else {
                            primary_key.data = _t.getPKValues(_t.selectedRowIndex);
                            primaryKeys.push(primary_key);
                            data.push(_t.data.data[_t.selectedRowIndex]);
                        }
                    } else {
                        primary_key.data = _t.getPKValues(_t.selectedRowIndex);
                        _t.selection2 = {
                            data: [_t.data.data[_t.selectedRowIndex]],
                            primary_keys: [primary_key]
                        };
                    }
                }
                _t.renderSelection();
            }
        });

        _t.tds.off('contextmneu').on('contextmenu', function (e, other, tEvent) {
            var elem = $(this);
            e = e || window.event;
            e.preventDefault();

            if (!_t.ctxMenuData || _t.ctxMenuData.length == 0) {
                return;
            }

            if (other == 'triggered') {
                e.clientX = tEvent.clientX;
                e.clientY = tEvent.clientY;
            }
            _t.updateSelectedIndexes(elem);

            var markRow = elem.parents('tr').eq(0).find('.markRow').eq(0);
            var isChecked = markRow.attr('data-checked') == 'true';

            if (!isChecked) {
                elem.siblings(':not(.frst):eq(0)').click();
            }

            var wrapperPosition = _t.wrapper[0].getBoundingClientRect();
            var top = e.clientY;// - wrapperPosition.top +4;
            var left = e.clientX;// - wrapperPosition.left +4;
            var width;
            var height;
            var ctxMenuWrapper;
            var body = $('body');
            var ctxMenuTpl = '<div class="ctxMenu-wrapper"><ul class="ctxMenu-list">{{#items}}<li class="ctxMenu-item {{#disabled}}disabled{{/disabled}}" data-name="{{name}}">{{{title}}}</li>{{/items}}</ul></div>';
            var mObj = {};
            mObj.items = [];

            var row = elem.parents('tr');
            var isNewRow = row.hasClass("new_row");

            for (var i in _t.ctxMenuData) {
                var item = _t.ctxMenuData[i];
                mObj.items.push({
                    name: item.name,
                    title: item.title,
                    disabled: (isNewRow) ? true : item.disabled(item.disCol, item.disVal, item.type, item.whereCol)
                });
            }

            body.find('.ctxMenu-wrapper').remove();
            body.append(Mustache.to_html(ctxMenuTpl, mObj));
            ctxMenuWrapper = body.find('.ctxMenu-wrapper');
            width = ctxMenuWrapper.outerWidth();
            height = ctxMenuWrapper.outerHeight();

            if (body.width() < left + width) left = left - width;
            if (body.height() < top + height) top = top - height;

            function runCtxCallback(name) {
                for (var c in _t.ctxMenuData) {
                    if (_t.ctxMenuData[c].name == name) {
                        _t.ctxMenuData[c].callback();
                    }
                }
            }

            body.find('.ctxMenu-item').each(function (idx, elem) {
                $(elem).off('click').on('click', function () {
                    if ($(elem).hasClass('disabled')) {
                        return;
                    }
                    var name = $(elem).attr('data-name');
                    runCtxCallback(name);
                    $('body').find('.ctxMenu-wrapper').remove();
                });
            });


            ctxMenuWrapper.offset({top: top, left: left});

            _t.renderSelection();
        });

        _t.tds.off('dblclick').on('dblclick', function () {
            //$(this).addClass('selectedTd');
//			console.log($(this).text());
        });

        _t.tds.off('click').on('click', function (e) {
            if (!customSelection.isSelection && !customSelection.isSelected) {
                e = e || window.event;
                _t.wrapper.find('.tableWrapper').removeClass('preventSelection');
                if ($(e.target).parents('.frst').length > 0 || $(e.target).hasClass('frst')) {
                    return;
                }
                var isShift = e.shiftKey;
                var isCtrl = e.ctrlKey;
                var elem = $(this);
                var i = 0;

                _t.updateSelectedIndexes(elem);

                var primaryKeys = _t.selection2.primary_keys;
                var lastSelected = (primaryKeys) ? primaryKeys.length - 1 : null;
                var data = _t.selection2.data;
                var primary_key;

                var markRow = $(this).parents('tr').eq(0).find('.markRow').eq(0);

                if (_t.selectedRowIndex != null) {
                    primary_key = {data_columns: _t.primary_keys, data: _t.getPKValues(_t.selectedRowIndex)};
                    if (isShift || isCtrl) {
                        if (isCtrl) {
                            markRow.click();
                            return;
                        }
                        if (isShift) {
                            if (lastSelected <= _t.selectedRowIndex) {
                                for (i = +lastSelected; i <= +_t.selectedRowIndex; i++) {
                                    if (primaryKeys.indexOf(i) != -1) {
                                        continue;
                                    }
                                    data.push(_t.data.data[i]);
                                    primaryKeys.push(primary_key);
                                }
                            } else {
                                for (var k = +lastSelected; k >= +_t.selectedRowIndex; k--) {
                                    if (primaryKeys.indexOf(k) != -1) {
                                        continue;
                                    }
                                    data.push(_t.data.data[k]);
                                    primaryKeys.push(primary_key);
                                }
                            }
                        }
                    } else {
                        _t.selection2 = {
                            data: [_t.data.data[_t.selectedRowIndex]],
                            primary_keys: [primary_key]
                        };
                    }
                    _t.renderSelection();
                }
            }
        });

        _t.tds.find('input[type="text"]:not(".datetimepicker")').off('input').on('input', function (event) { //keyup
            inputTypeHandler.call(_t, $(this));
        });

        _t.tds.find('textarea').off('input').on('input', function (event) { //keyup
            inputTypeHandler.call(_t, $(this));
        });

        _t.tds.find('input[type="checkbox"]').off('change').on('change', function () {
            var elem = $(this);
            var rowIndex = elem.parents('tr').index();
            var colIndex = elem.parents('td').index();
            var isNew = elem.parents('tr').hasClass('new_row');
            var row = elem.parents('tr');
            var dataValue;
            var value = (elem[0].checked) ? true : false;
            var isNewRow = row.hasClass("new_row");
            var newRowId = (isNewRow) ? row.data('id') : null;
            var chObj = {
                PRIMARY_KEY_NAMES: _t.primary_keys,
                PRIMARY_KEY_VALUES: _t.getPKValues(_t.selectedRowIndex, newRowId),
                CHANGED_COLUMN_NAMES: _t.getColumnNameByIndex(colIndex - 1),
                CHANGED_COLUMN_VALUES: value,
                ROW: row
            };

            chObj['COMMAND'] = (elem.parents('tr').hasClass('new_row')) ? 'NEW' : 'MODIFY';

            if (!isNewRow) dataValue = _t.data.data[_t.selectedRowIndex][_t.selectedColIndex]
            if (value != dataValue) {
                row.addClass('edited');
                _t.addChange(chObj);
            }
            else {
                _t.removeChange(chObj);
            }
        });

        _t.tds.find('input[type="number"]').off('input').on('input', function () {
            numberTypeHandler.call(_t, $(this));
        });

        _t.infoBlock.find('.tab-btn').on('click', function () {
            var dataId = $(this).data('id');

            if (!$(this).hasClass('active')) {
                _t.infoBlock.find('.tab-btn').removeClass('active');
                $(this).addClass('active');
                _t.infoBlock.find('.tab').removeClass('active').hide(0, function () {
                    _t.infoBlock.find('.tab[data-id="' + dataId + '"]').addClass('active').show(0);
                });
            }
        });

        _t.wrapper.find('input.colorpicker').off('changeColor').on('changeColor', function () {
            _t.highLightCross($(this).parents('td'));
            _t.updateSelectedIndexes($(this));
            if (!_t.isInfoOpened) {
                //_t.openInfo();
                _t.populateInfoBlock();
            } else {
                _t.populateInfoBlock();
            }

            _t.data.data[_t.selectedRowIndex][_t.selectedColIndex] = $(this).val();
            _t.populateInfoBlock();
        });

        _t.wrapper.find('.ct-upload-total-summs').off('click').on('click', function () {
            $(this).html('<i class="fa fa-spin fa-spinner"></i>');
            _t.populateTotalSumms();
        });

        _t.places.tableFixHeader.find('div').on('click', function () {
        });

        _t.tableWrapper.on('scroll', function () {
            $('.colorpicker-visible').removeClass('colorpicker-visible').addClass('colorpicker-hidden');
        });

        _t.wrapper.find('.ct-functional-close').off('click').on('click', function () {
            if (_t.wrapper.find('.ct-options-excel').hasClass('opened')) {
                _t.tableWrapper.animate({marginTop: 0 + 'px'}, 300, 'easeOutQuint', function () {
                    _t.wrapper.find('.ct-options-excel').removeClass('opened');
                    _t.wrapper.find('.ct-functional-dd').removeClass('opened');
                });
            }
        });

        _t.wrapper.find('.ct-options-filter').off('click').on('click', function () {
            var innerThis = this;


            if ($(innerThis).hasClass('opened')) {
                _t.wrapper.find('.ct-filter').css('zIndex', '98');
                _t.wrapper.find('.classicTableFunctional').animate({marginTop: '-' + (_t.wrapper.find('.ct-filter').outerHeight() - 7) + 'px'}, 180, function () {
                    $(innerThis).removeClass('opened');
                });
            } else {
                $(innerThis).addClass('opened');
                _t.wrapper.find('.classicTableFunctional').animate({marginTop: '4px'}, 180, function () {
                    _t.wrapper.find('.ct-filter').css('zIndex', '101');
                });
            }
        });

        _t.wrapper.find('.ct-options-drop-filters').off('click').on('click', function () {
            MB.Tables.getTable(_t.id).where = '';
            MB.Tables.getTable(_t.id).externalWhere = '';
            MB.Tables.getTable(_t.id).fastSearchWhere = [];
            _t.filterWhere = [];
            _t.places.fastSearch.val('');
            _t.wrapper.find('.ct-clear-filter').click();

            MB.Tables.getTable(_t.id).reload();
        });

        _t.wrapper.find('.ct-options-hide-columns').off('click').on('click', function (event) {
            var data = [];
            var profileData = _t.profile.data;
            var indexColumnName = "column_name";
            var indexName = "name";
            var target = $(event.target);
            var item, name, title, hidden;
            var localStorage = _t.getLocalStorage();

            //console.log('PDAA', profileData);

            for (var i in profileData) {

                if (_t.checkColumnVisible(i)) {
                    item = profileData[i];
                    name = item[indexColumnName];
                    title = item[indexName];

                    if (localStorage && localStorage.columns[name]) hidden = localStorage.columns[name].hidden;
                    else hidden = false;

                    data.push({title: title, name: name, selected: hidden})
                }
            }

            if (!target.hasClass("ct-options-item")) target = $(target.closest(".ct-options-item"));

            var multiSelect = MB.Core.multiSelect.init({
                id: MB.Core.guid(),
                data: data,
                target: target,
                icon: "fa-eye",
                iconSelected: "fa-eye-slash",
                classSelected: "disabled",
                dataAttributeName: "name"
            });

            target.addClass("opened");

            $(multiSelect).on('toggle', function (e, params) {
                _t.hideColumn(params.current.name, params.current.hidden);
            });
        });

        _t.wrapper.find('.ct-confirm-filter').off('click').on('click', function () {
            MB.Tables.getTable(_t.id).tempPage = 1;
            MB.Tables.getTable(_t.id).reload();
// ALSURU
            console.log('Страница перезагружена с учетом фильтров');
            _t.renderPaginationBlock();
// ALSURU

        });

        _t.wrapper.find('.ct-clear-filter').off('click').on('click', function () {
            var listOfFilters = _t.wrapper.find('.ct-filter-list');
            for (var i = 0; i < listOfFilters.find('li.filterItem').length; i++) {
                var filter = listOfFilters.find('li.filterItem').eq(i);
                filter.find('.invalid').removeClass('invalid');
                var type = filter.attr('data-filterType');
                var control = undefined;

                switch (type) {
                    case 'text':
                        control = filter.find('input[type="text"]');
                        control.val('');
                        break;
                    case 'like_text':
                        control = filter.find('input[type="text"]');
                        control.val('');
                        break;
                    case 'select2':
                        control = MB.Core.select3.list.getSelect(filter.find('.select3-wrapper').attr('id'));
                        control.value.id = '';
                        control.value.name = '';
                        control.setValue();
                        break;
                    case 'daysweek':
                        control = MB.Core.daysweekpickers.getItem(filter.find('.daysweekpicker').attr('data-id'));
                        control.clear();
                        break;
                    case 'daterange':
                    case 'datetimerange':
                    case 'timerange':
                        control = filter.find('input[type="text"]');
                        control.val('');
                        break;
                    case 'checkbox':
                        break;
                    default:
                        break;
                }
            }

            _t.filterWhere = [];
            MB.Tables.getTable(_t.id).reload();
        });

        _t.wrapper.find('.ct-options-excel').off('click').on('click', function () {
            var innerThis = this;
            if ($(innerThis).hasClass('opened')) {
                _t.tableWrapper.animate({marginTop: 0 + 'px'}, 300, 'easeOutQuint', function () {
                    $(innerThis).removeClass('opened');
                    _t.wrapper.find('.ct-functional-dd').removeClass('opened');
                });
            } else {
                _t.wrapper.find('.ct-functional-dd').addClass('opened');
                $(innerThis).addClass('opened');
                _t.tableWrapper.animate({marginTop: 31 + 'px'}, 300, 'easeOutQuint', function () {
                });
            }
        });

        _t.wrapper.find('.ct-exportToFile').off('click').on('click', function () {
            var tableNewInstance = MB.Tables.getTable(_t.id);
            var name = tableNewInstance.profile.extra_data.object_profile.client_object_name;
            var get_object_command = tableNewInstance.profile.extra_data.object_profile.get_object_command;
            var primary_key = tableNewInstance.profile.extra_data.object_profile.primary_key;
            var sel = tableNewInstance.ct_instance.getIndexesByData(true);

            if (typeof sel == 'object') {
                return toastr['error']('Необходимо выбрать одну строку');
            }

            bootbox.dialog({
                message: 'Внимание, экспорт "' + name + '" может занять много времени! Продолжить?',
                title: "Экспорт",
                buttons: {
                    success: {
                        label: "Да, я подожду",
                        assName: "green",
                        callback: function () {

                            var t1 = new Date();
                            var timeOut = toastr.options.timeOut;
                            var extendedTimeOut = toastr.options.extendedTimeOut;
                            toastr.options.timeOut = 1000000;
                            toastr.options.extendedTimeOut = 100;
                            var info = toastr.info('Идет процесс экспорта...');
                            toastr.options.timeOut = timeOut;
                            toastr.options.extendedTimeOut = extendedTimeOut;

                            var id = tableNewInstance.data.data[sel][primary_key];
                            DOQuery({
                                command: 'EXPORT_SOME',
                                id: id,
                                name: get_object_command
                            }, function (r) {
                                info.fadeOut(100);
                                console.timeEnd('t1');
                                if (r.code !== 0) {
                                    console.log(r.err);
                                    return toastr[r.type](r.message);
                                }
                                var t2 = new Date();
                                var msg = 'Копирование завершено. Время: ' + (t2 - t1);
                                console.log(msg);
                                toastr.success(msg);
                                var filename = r.filename;
                                console.log('filename', filename);
                                $("body").prepend('<a style="display:none;" id="need_be_removed" href="/' + filename + '" download>Схема</a>');
                                $('#need_be_removed').on("click", function (e) {
                                    $("#need_be_removed").remove();
                                });
                                $("#need_be_removed")[0].click()
                            })
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
        });


        //------------------
        _t.wrapper.find('.ct-importFromFile').off('click').on('click', function () {

            if(!_t.profile.extra_data.object_profile.import_export_avalible){
                toastr['info']('Для данной таблицы запрещен импорт');
                return false;
            }

            var reqKeywords = _t.profile.extra_data.object_profile.required_fields_for_import.split(',');
            var reqArr = [];
            var renderArr = [];

            var guid = MB.Core.guid();
            var tpl = '<div id="modal-wrapper-'+guid+'">';

            if(_t.profile.extra_data.object_profile.required_fields_for_import.length > 0){
                for(var i in reqKeywords){
                    var key = reqKeywords[i];
                    reqArr.push(_t.getProfileByColumnName(key));
                }

                for(var j in reqArr){
                    var found = false;
                    for(var l in _t.profile.data){
                        if(_t.profile.data[l]['lov_return_to_column'] == reqArr[j]['column_name']){
                            renderArr.push(_t.profile.data[l]);
                            found = true;
                            continue;
                        }
                    }
                    if(!found){
                        renderArr.push(reqArr[j]);
                    }
                }

                for(var k in renderArr){
                    var f = renderArr[k];

                    var p = {
                        type: f['type_of_editor'],
                        value: '',
                        editable: true,
                        insertable: true,
                        updatable: true,
                        name: f['column_name'],
                        selId: '',
                        isTd: false
                    };

                    for(var j in _t.profile.extra_data.object_profile.prepare_insert){
                        var pi = _t.profile.extra_data.object_profile.prepare_insert[j];
                        if(j == f['column_name']){
                            if(f['type_of_editor'].indexOf('select') > -1){
                                p.value = pi;
                                p.selId = pi;
                            }else{
                                p.value = pi;
                            }
                        }
                    }

                    for(var j2 in _t.profile.extra_data.object_profile.prepare_insert){
                        var pi2 = _t.profile.extra_data.object_profile.prepare_insert[j2];
                        if(j2 == f['lov_return_to_column']){
                            p.selId = pi2;
                        }
                    }

                    tpl += '<div class="ct-import-prepare-field-wrapper fn-field " data-type="'+ f.type_of_editor+ '" data-column="'+ f.column_name +'"><label>'+ f.name +':</label>';

                    tpl += _t.getTypeHtml(p);

                    tpl += '</div>';

                }
            }

            tpl += '<div class="ct-importFile-wrapper fn-field"><label>Выберите файл:</label><input type="text" id="ct-importFile-input" class=""/></div>';
            tpl += '</div>';


            bootbox.dialog({
                message: tpl,
                title: "Смотрим поля:",
                buttons: {
                    success: {
                        label: "Fire",
                        className: "",
                        callback: function () {
                            var flds = $('#modal-wrapper-'+guid).find('.ct-import-prepare-field-wrapper');
                            var requiredFields = {};
                            var invalid = false;

                            for(var i=0; i<flds.length; i++){
                                var fld = flds.eq(i);
                                var type = fld.data('type');
                                var val = '';

                                if(type.indexOf('select2') > -1 ){
                                    val = fld.find('.ct-select3-wrapper').attr('data-val');
                                }else if(type == "text" || type == "phone"){
                                    val = fld.find('input[type="text"]').val();
                                }else if(type == "checkbox"){
                                    val = fld.find('input[type="checkbox"]').attr('checked') == 'checked';
                                }else if(type == "number"){
                                    val = fld.find('input').val();
                                }else if(type == "float2"){
                                    val = fld.find('input').val();
                                }else if(type == "datetime" || type == "datetime_wo_sec"){
                                    val = fld.find('input[type="text"]').val();
                                }else{
                                    val = fld.find('input[type="text"]').val();
                                }

                                //console.log(val);
                                if(!val || val.length == 0){
                                    invalid = true;
                                }
                                var fldProf = _t.getProfileByColumnName(fld.data('column'));
                                var column = (fldProf['lov_return_to_column'] == '')? fldProf['column_name'] : fldProf['lov_return_to_column'];
                                requiredFields[column] = val;

                            }

                            if($('#ct-importFile-input').val().length == 0){
                                invalid = true;
                            }

                            if(invalid){
                                toastr['error']('Заполните все поля.');
                                return false;
                            }else{

                                var timeOut = toastr.options.timeOut;
                                var extendedTimeOut = toastr.options.extendedTimeOut;

                                toastr.options.timeOut = 1000000;
                                toastr.options.extendedTimeOut = 100;

                                var info = toastr.info('Идет процесс импорта...');

                                toastr.options.timeOut = timeOut;
                                toastr.options.extendedTimeOut = extendedTimeOut;

                                DOQuery({
                                    command: 'IMPORT_SOME',
                                    requiredFields: requiredFields,
                                    name: _t.profile.extra_data.object_profile.get_object_command,
                                    file_name: 'upload/' + $('#ct-importFile-input').val()
                                }, function (r) {
                                    info.fadeOut(600);
                                    if (r.err) console.log(r.err);
                                    toastr[r.type](r.message);
                                    _t.reload();
                                });
                            }
                        }
                    },
                    error: {
                        label: "Cancel",

                        className: "",
                        callback: function () {

                        }
                    }
                }
            });

            $('#ct-importFile-input').on('click', function(){
                var inp = $(this);
                var il = MB.Core.fileLoader;
                il.start({
                    success: function (fileUID) {
                        inp.val(fileUID.name);
                        delete il;
                    }
                })
            });

            var flds = $('#modal-wrapper-'+guid).find('.ct-import-prepare-field-wrapper');

            for(var fl = 0; fl<flds.length; fl++ ){
                var fld = flds.eq(fl);
                var type = fld.data('type');
                var fldProf = _t.getFieldProfile(fld.data('column'));

                if(type == 'select2'){
                    var fldSel = fld.find('.ct-select3-wrapper');
                    var select3Data = _t.getSelect3InsertData(fld.data('column'));
                    var selInstance = MB.Core.select3.init({

                        id :                MB.Core.guid(),
                        wrapper:            fldSel,
                        column_name:        select3Data.column_name,
                        class:              _t.class,
                        client_object:      _t.client_object,
                        return_id:          select3Data.return_id,
                        return_name:        select3Data.return_name,
                        withSearch:         true,
                        withEmptyValue:     (fldSel.attr('data-with_empty') == 'true'),
                        absolutePosition:   true,
                        isFilter:           false,
                        parentObject:       _t,
                        value: {
                            id: fldSel.data('val'),
                            name: fldSel.data('title')
                        },
                        additionalClass:    ''

                        //id: MB.Core.guid(),
                        //wrapper: fldSel,
                        //getString: select3Data.getString,
                        //column_name: select3Data.column_name,
                        //view_name: select3Data.view_name,
                        //value: {
                        //    id: fldSel.data('val'),
                        //    name: fldSel.data('title')
                        //},
                        //data: [],
                        //fromServerIdString: select3Data.fromServerIdString,
                        //fromServerNameString: select3Data.fromServerNameString,
                        //searchKeyword: select3Data.searchKeyword,
                        //withEmptyValue: (fldSel.attr('data-with_empty') == 'true'),
                        //freeType: false,
                        //absolutePosition: true,
                        //isSearch: true,
                        //dependWhere: select3Data.lov_where,
                        //parentObject: _t,
                        //profile_column_name: fldSel.data('column'),
                        //additionalClass: ''
                    });

                    $(selInstance).on('changeVal', function (e, was, now) {

                    });
                }

                else if(type == 'text' || type == 'phone'){

                }
                else if(type == "datetime" || type == "datetime_wo_sec"){
                    var fldDate = fld.find('input[type="text"]');
                    if (fldDate.hasClass('date')) {
                        fldDate.datetimepicker({
                            autoclose: true,
                            todayHighlight: true,
                            minuteStep: 10,
                            keyboardNavigation: false,
                            todayBtn: true,
                            firstDay: 1,
                            weekStart: 1,
                            language: "ru",
                            maxView: 2
                        });
                    } else if (fldDate.hasClass('time')) {
                        fldDate.clockpicker({
                            align: 'left',
                            donetext: 'Выбрать',
                            autoclose: true,
                            afterDone: function () {
                                var val = fldDate.val();
                                if (val.length == 5) fldDate.val(val + ':00');
                            }
                        });
                    } else {
                        fldDate.datetimepicker({
                            autoclose: true,
                            todayHighlight: true,
                            minuteStep: 10,
                            keyboardNavigation: false,
                            todayBtn: true,
                            firstDay: 1,
                            weekStart: 1,
                            language: "ru"
                        });
                    }
                }
            }

//            for(var f=0; f<flds.length; f++){
//                var wrapper = flds[f];
//                var type = wrapper.data('type');
//
//                if (type.indexOf("select2") > -1) {
//                    wrapper.find('div.ct-select3-wrapper').each(function (index, elem) {
//                        initSelect3Handler.call(_t, elem, excludeClass);
//                    });
//                }
//                else if (type == "text" || type == "phone") {
//                    if (type == "phone") wrapper.find('input.phoneNumber').phoneIt();
//
//                    wrapper.find('input[type="text"]:not(".datetimepicker")').on('input keyup', function () {
//                        inputTypeHandler.call(_t, $(this), excludeClass);
//                    });
//                }
//                else if (type == "checkbox") {
//                    wrapper.find('div.ct-checkbox-wrapper').each(function (index, elem) {
//                        initCheckBoxHandler.call(_t, elem);
//                    });
//                }
//                else if (type == "number") {
//                    wrapper.find('input[type="number"]').off('input').on('input', function () {
//                        numberTypeHandler.call(_t, $(this));
//                    });
//                }
//                else if (type == "datetime" || type == "datetime_wo_sec") {
//                    wrapper.find('input.datetimepicker').each(function (index, elem) {
//                        initDateTimeHandler.call(_t, elem, excludeClass);
//                    });
//                }
//            }



            return;



            var guid = MB.Core.guid();
            var tableNewInstance = MB.Tables.getTable(_t.id);
            var name = tableNewInstance.profile.extra_data.object_profile.client_object_name;
            var get_object_command = tableNewInstance.profile.extra_data.object_profile.get_object_command;
            var primary_key = tableNewInstance.profile.extra_data.object_profile.primary_key;

            var modalHtml = '<div class="row form-body" id="bootbox' + guid + '">' +
                '<div class="padder5">' +
                '<label class="wid100pr">Необходимо выбрать:' +
                '<div id="parentId" data-id="parentId"></div>' +
                '</label>' +
                '</div>' +
                '</div>';
            var selInstance;
            bootbox.dialog({
                /*message: "Импорт схемы зала занимает много времени, вы уверены что хотите приступить?",*/
                message: modalHtml,
                title: "Импорт из файла",
                buttons: {
                    success: {
                        label: "Выбрать файл и начать импорт.",
                        className: "green",
                        callback: function () {
                            var hall_id = selInstance.value.id;
                            if (hall_id < 0) {
                                return toastr.error('Зал для импорта не выбран');
                            }
                            MB.Core.fileLoader.start({
                                success: function (fileUID) {
                                    var timeOut = toastr.options.timeOut;
                                    var extendedTimeOut = toastr.options.extendedTimeOut;
                                    toastr.options.timeOut = 1000000;
                                    toastr.options.extendedTimeOut = 100;
                                    var info = toastr.info('Идет процесс импорта...');
                                    toastr.options.timeOut = timeOut;
                                    toastr.options.extendedTimeOut = extendedTimeOut;
                                    DOQuery({
                                        command: 'IMPORT_SOME',
                                        id: parentId,
                                        file_name: 'upload/' + fileUID.name
                                    }, function (r) {
                                        info.fadeOut(600);
                                        if (r.err) console.log(r.err);
                                        toastr[r.type](r.message);
                                        tableInstance.reload();
                                    });

                                }
                            });
                        }
                    },
                    error: {
                        label: "Отмена",
                        className: "yellow",
                        callback: function () {

                        }
                    }
                }
            });

            var bootboxContainer = $("#bootbox" + guid);
            selInstance = MB.Core.select3.init({
                id: guid,
                wrapper: bootboxContainer.find('#parentId'),
                getString: 'HALL',
                column_name: 'HALL_ID',
                view_name: '',
                value: {
                    id: '-10',
                    name: 'Выберите зал'
                },
                data: [],
                fromServerIdString: 'HALL_ID',
                fromServerNameString: 'NAME',
                searchKeyword: 'NAME',
                withEmptyValue: false,
                isSearch: true,
                parentObject: bootboxContainer
            });
        });
        //------------------


        _t.wrapper.find('.exportToExcel').off('click').on('click', function () {
            var tableNewInstance = MB.Tables.getTable(_t.id);
            var o = {
                client_object: tableNewInstance.profile.extra_data.object_profile.client_object,
                name: tableNewInstance.profile.extra_data.object_profile.client_object_name,
                where: tableNewInstance.where || '',
                order_by: tableNewInstance.ct_instance.order_by || tableNewInstance.profile.extra_data.object_profile.default_order_by
            };
            var page_no = +tableNewInstance.tempPage || 1;
            var rows_max_num = +tableNewInstance.itemsPerPage || 1000;
            var start_no = (page_no - 1) * rows_max_num + 1;
            var guid = MB.Core.guid();
            var modalHtml = '<div class="row form-body" id="bootbox' + guid + '">' +
                '<div class="padder5">' +
                '<label class="wid100pr">Начиная с:' +
                '<input type="text" class="form-control start_no" value="' + start_no + '"/>' +
                '</label>' +
                '<label class="wid100pr">Ограничить число записей:' +
                '<input type="text" class="form-control rows_max_num" value="' + rows_max_num + '"/>' +
                '</label>' +
                '</div>' +
                '</div>';


            bootbox.dialog({
                message: modalHtml,
                title: "Экспорт в Excel",
                buttons: {
                    success: {
                        label: "Экспорт",
                        className: "green",
                        callback: function () {
                            var bootboxContainer = $("#bootbox" + guid);
                            o.start_no = +bootboxContainer.find('.start_no').val() || 1;
                            o.rows_max_num = +bootboxContainer.find('.rows_max_num').val() || 1000;
                            var timeOut = toastr.options.timeOut;
                            var extendedTimeOut = toastr.options.extendedTimeOut;
                            toastr.options.timeOut = 1000000;
                            toastr.options.extendedTimeOut = 100;
                            var info = toastr.info('Идет процесс экспорта...');
                            toastr.options.timeOut = timeOut;
                            toastr.options.extendedTimeOut = extendedTimeOut;
                            o.command = 'EXPORT_TO_EXCEL';
                            DOQuery(o, function (r) {
                                info.fadeOut(600);
                                if (r.code !== 0) {
                                    console.log(r.message);
                                    return toastr[r.type](r.message);

                                }
                                var filename = r.filename;
                                var id = 'need_be_removed' + guid;
                                $("body").prepend('<a style="display:none;" id="' + id + '" href="' + connectHost + '/' + filename + '" download></a>');
                                var btn = $('#' + id);
                                btn.on("click", function (e) {
                                    $(this).remove();
                                });
                                btn[0].click();
                                toastr[r.type](r.message + '</br><a id="' + id + '"  style="color:blue;" target="_blank"  href="' + connectHost + '/' + filename + '">Скачать</a>'  );
                            });
                        }
                    },
                    error: {
                        label: "Отмена",
                        className: "yellow",
                        callback: function () {

                        }
                    }
                }
            });
        });

        _t.wrapper.find('.sendExcelToEmail').off('click').on('click', function () {
            var tableNewInstance = MB.Tables.getTable(_t.id);
            var o = {
                command: 'operation',
                object: 'send_excel_to_email',
                params: {
                    where: tableNewInstance['where'],
                    CLIENT_OBJECT: tableNewInstance.name,
                    VIEW_NAME: tableNewInstance.data.data_info.view_name,
                    getObject: tableNewInstance.profile['extra_data']['object_profile']['object_command']
                }
            };

            socketQuery(o, function (res) {
                socketParse(res);
            });
        });

        _t.wrapper.find('.ct-filter .filterItem input[type="text"]').off('input').on('input', function () {
            var parent = $(this).parents('.filterItem');
            var type = $(this).parents('.filterItem').eq(0).attr('data-filterType');
            switch (type) {
                case 'number':
//					console.log(MB.Core.validator.int($(this).val()));
                    break;
                case 'datetime':
//					console.log(MB.Core.validator.datetime($(this).val()));
                    break;
                case 'daysweek':
                    break;
                case 'daterange':
                case 'datetimerange':
                    break;
                case 'timerange':
                    var fromInp = parent.find('input[name="start"]');
                    var toInp = parent.find('input[name="end"]');
                    var columnName = parent.attr('data-name');
                    var wValue;

                    if (fromInp.val() == '' && toInp.val() == '') {
                        wValue = '';
                    } else {
                        if (MB.Core.validator.time($(this).val())) {
                            $(this).removeClass('invalid');
                            wValue = {from: fromInp.val(), to: toInp.val()};
                            var wObj = {
                                name: columnName,
                                value: wValue,
                                type: 'timerange'
                            };

                            var wObj2 = {
                                key: columnName,
                                type: '..',
                                comparisonType: 'and',
                                val1: fromInp.val(),
                                val2: toInp.val()
                            };

                            _t.addWhere(wObj2);
                        } else {
                            $(this).addClass('invalid');
                        }
                    }
//					console.log(MB.Core.validator.time($(this).val()));
                    break;
                case 'like_text':
                    var columnName = parent.attr('data-name');
                    var wValue;

                    var wObj = {
                        name: columnName,
                        value: $(this).val(),
                        type: 'like_text'
                    };

                    var wObj2 = {
                        key: columnName,
                        type: 'like',
                        comparisonType: 'and',
                        val1: $(this).val(),
                        val2: ''
                    };

                    _t.addWhere(wObj2);
                    break;
                case 'text':
                    var columnName = parent.attr('data-name');

                    var wObj2 = {
                        key: columnName,
                        type: '=',
                        comparisonType: 'and',
                        val1: $(this).val(),
                        val2: ''
                    };

                    _t.addWhere(wObj2);
                    break;
                default:
                    break;
            }
        });

        _t.places.theadRow.find('.swr').on('mousedown', function (e) {
            var th = $(this).parents('th').eq(0);
            var thIdx = th.index();
            var wSet = th.find('.wSet');
            var tds = [];
            var margin = mouse.pageX - _t.pressX;

            $(this).addClass('inMove');
            th.addClass('hovered');
            _t.wrapper.addClass('colResize');

            for (var i = 0; i < _t.places.tbody.find('tr').length; i++) {
                var row = _t.places.tbody.find('tr').eq(i);
                tds.push(row.find('td').eq(thIdx).find('.tdW'));
            }


            _t.th = th;
            _t.swr = $(this);
            _t.pressX = mouse.pageX;
            _t.colInResize = true;
            _t.tdsToResize = tds;
            _t.wSet = wSet;
            //console.log(_t.wSet.outerWidth());
            _t.wSetW = _t.wSet.outerWidth();
            _t.columnW = undefined;
        });

        var oldTdIndex;
        var oldTrIndex;

        $(document).on('mousemove', function (event) {
            var td;
            var i;
            if (mouse.isDown) {
                if (_t.colInResize) {
                    var margin = mouse.pageX - _t.pressX;

                    _t.columnW = (_t.wSetW - 10) + margin;
                    //console.log(_t.columnW)
                    for (i in _t.tdsToResize) {
                        td = _t.tdsToResize[i];
                        td.width(_t.columnW + 10);
                    }

                    _t.wSet.width(_t.columnW);
                    mouse.isMove = true;
                }
            }

            if (customSelection.isSelecting) {
                var newTdIndex;
                var newTrIndex;
                var parentTable;
                var endColumnName;
                var indexes;
                var startTd = customSelection.startTdIndex;
                var startTr = customSelection.startTrIndex;

                td = $(event.target);

                parentTable = td.closest(".classicTableWrap");
                if (!td.is("td")) td = td.closest("td");

                if (parentTable.data("id") != _t.id || td.length == 0) return;

                endColumnName = _t.places.theadRow.children("th:eq(" + td.index() + ")").data("column-name");
                newTdIndex = _t.getColumnIndex(endColumnName);
                newTrIndex = td.closest("tr").index();

                if (oldTdIndex != newTdIndex || oldTrIndex != newTrIndex) {
                    indexes = {
                        startTr: startTr,
                        startTd: startTd,
                        endTr: newTrIndex,
                        endTd: newTdIndex
                    };
                    _t.clearCustomSelection();

                    if (startTr > newTrIndex) {
                        indexes.startTr = newTrIndex;
                        indexes.endTr = startTr;
                    }

                    if (startTd > newTdIndex) {
                        indexes.startTd = newTdIndex;
                        indexes.endTd = startTd;
                    }

                    _t.setCustomSelection(indexes);

                    oldTdIndex = newTdIndex;
                    oldTrIndex = newTrIndex;
                }
            }
        });
        $(document).on('mouseup', function () {

            console.log('here 1');

            if (_t.wrapper.hasClass('colResize')) {
                _t.wrapper.removeClass('colResize');
            }

            console.log(_t, _t.colInResize , _t.swr , _t.th);

            if (_t.colInResize && _t.swr && _t.th) {

                console.log('here 2');

                var columnName = _t.th.data("column-name");
                var lsColumn = lsTable.columns[columnName];
                _t.swr.removeClass('inMove');
                _t.th.removeClass('hovered');

                if (!lsColumn) lsTable.columns[columnName] = {};
                lsTable.columns[columnName].width = _t.columnW;


                _t.setLocalStorage(JSON.stringify(lsTable));

                _t.th = undefined;
                _t.swr = undefined;
                _t.colInResize = false;
                _t.tdsToResize = undefined;
                _t.wSet = undefined;
                _t.wSetW = undefined;
                _t.wSetW = undefined;
            }
        });
    };

    CTable.prototype.getFieldProfile = function(name){
        var _t = this;
        for(var i in _t.profile.data){
            var p = _t.profile.data[i];
            if(p.COLUMN_NAME == name){
                return p;
            }
        }
        return false;
    };

    CTable.prototype.hideColumn = function (columnName, hidden) {
        var _t = this;
        var thead = _t.places.theads[columnName];
        var columnIndex = thead.index();
        var tds = _t.places.tds;
        var lsColumn = lsTable.columns[columnName];
        if (hidden) thead.addClass("hidden");
        else thead.removeClass("hidden");

        _t.hiddenColumns[columnIndex] = hidden;

        for (var i in tds) {
            if (tds.hasOwnProperty(i)) {
                var row = _t.places.tds[i];
                if (hidden) row[columnIndex].addClass("hidden");
                else row[columnIndex].removeClass("hidden");
            }
        }

        if (!lsColumn) lsTable.columns[columnName] = {};
        lsTable.columns[columnName].hidden = hidden;

        _t.setLocalStorage(JSON.stringify(lsTable));

        _t.hideTable();
    };

    CTable.prototype.hideTable = function () {
        var _t = this;
        var hiddenColumns = _t.hiddenColumns;
        var hide = true;
        var placeHolder;

        for (var i in hiddenColumns) {
            if (hiddenColumns.hasOwnProperty(i)) {
                if (!hiddenColumns[i]) {
                    hide = false;
                    break;
                }
            }
        }

        if (hide) {
            placeHolder = $('<div></div>');
            placeHolder.addClass("table-placeholder");
            placeHolder.html("<p>Таблица скрыта</p><p>Cделайте видимым хотя бы один столбец</p>");
            _t.places.table.addClass("hidden");
            _t.places.tableWrapper.append(placeHolder);
        }
        else {
            _t.places.tableWrapper.find(".table-placeholder").remove();
            _t.places.table.removeClass("hidden");
        }
    };

    CTable.prototype.updateSelectedIndexes = function (elem, isAdd) {
        var _t = this;
        var i = 0;
        var parent = elem.parents("tr").get(0);
        var rows = elem.closest("tbody").children("tr");
        var td = elem;
        var columnName;
        var isNewRow = $(parent).hasClass("new_row");

        if (isNewRow) {
            _t.selectedRowIndex = null;
            _t.selectedColIndex = null;

            if (!isAdd) {
                _t.clearAllSelection();
                _t.renderSelection();
            }
            return;
        }
        ;

        rows.each(function () {
            var tr = $(this);
            if (parent == this) {
                _t.selectedRowIndex = i;
                return;
            }
            if (!tr.hasClass("new_row")) i++;
        });

        if (!td.is("td")) td = td.closest("td");
        columnName = _t.places.theadRow.children("th:eq(" + td.index() + ")").data("column-name");
        _t.selectedColIndex = columnName;
    };

    CTable.prototype.highLightCross = function (cell) {

        var _t = this,
            tr = cell.parent('tr'),
            horCells = tr.find('td').not(cell),
            verCells = [];
        for (var i = 0; i < _t.wrapper.find('tbody tr').length; i++) {
            var trItem = _t.wrapper.find('tbody tr').eq(i);
            verCells.push(trItem.find('td').eq(cell.index()));
        }

        _t.wrapper.find('td').removeClass('horHightLight').removeClass('verHightLight').removeClass('active');

        cell.addClass('active');
        horCells.addClass('horHightLight');
        for (var i = 0; i < verCells.length; i++) {
            verCells[i].addClass('verHightLight');
        }

    };

    CTable.prototype.openInfo = function () {
        var _t = this;

        _t.infoBlock.animate({
            width: 17 + '%'
        }, {
            duration: 250,
            easing: "easeOutQuint"
        });

        _t.tableWrapper.animate({
            width: 83 + '%'
        }, {
            duration: 250,
            easing: "easeOutQuint",
            step: function () {
                //_t.setHeaderWidth();
            },
            complete: function () {
                //_t.setHeaderWidth();
                _t.isInfoOpened = true;
            }
        });

    };

    CTable.prototype.closeInfo = function () {
        var _t = this;

        _t.infoBlock.css('position', 'absolute');

        _t.infoBlock.animate({
            width: 0
        }, {
            duration: 250,
            easing: "easeOutQuint",
            complete: function () {
                _t.infoBlock.css('position', 'relative');
            }
        });

        _t.tableWrapper.animate({
            width: 100 + '%'
        }, {
            duration: 250,
            easing: "easeOutQuint",
            step: function () {
                //_t.setHeaderWidth();
            },
            complete: function () {
                //_t.setHeaderWidth();
                _t.isInfoOpened = false;
            }
        });

        /*-------------*/
//        _t.infoBlock.css('position','absolute').animate({
//            width: 0
//        },250, 'easeOutQuint', function(){
//            _t.infoBlock.css('position','relative');
//        });
//
//        _t.tableWrapper.animate({
//            width: 100+'%'
//        },250, 'easeOutQuint', function(){
//            _t.isInfoOpened = false;
//            _t.setHeaderWidth();
//        });


    };

    CTable.prototype.populateInfoBlock = function () {
        return;

    };

    CTable.prototype.setInfoBlockOptionHandler = function (btn, handler) {
        var _t = this;
        btn.on('click', function () {
            if (typeof handler == 'function') {
                handler();
            }
        });
        _t.infoBlockColumnsTab.find('select.select3').each(function (index, elem) {
            $(elem).select3();
        });
    };

    //CTable.prototype.setInfoBlockHandlers = function () {
    //	var _t = this;
    //	_t.infoBlock.find('input[type="text"]').off('input');
    //	_t.infoBlock.find('input[type="checkbox"]').off('change');
    //	_t.infoBlock.find('select').off('change');
    //	_t.infoBlock.find('.closeTableInfo').off('click');
    //	_t.infoBlock.find('input.datepicker').off('change');
    //
    //	_t.infoBlock.find('input[type="text"]').on('input', function () {
    //		var cellIndex = $(this).parents('.ct-editCell-wrapper').data('cellindex');
    //		_t.data.data[_t.selectedRowIndex][cellIndex] = $(this).val();
    //		_t.updateTableData();
    //	});
    //	_t.infoBlock.find('input[type="checkbox"]').on('change', function () {
    //		var cellIndex = $(this).parents('.ct-editCell-wrapper').data('cellindex');
    //		_t.data.data[_t.selectedRowIndex][cellIndex] = $(this)[0].checked;
    //		_t.updateTableData();
    //	});
    //	_t.infoBlock.find('select').on('change', function () {
    //		var cellIndex = $(this).parents('.ct-editCell-wrapper').data('cellindex');
    //		_t.data.data[_t.selectedRowIndex][cellIndex] = $(this).find('option[value="' + $(this).val() + '"]').html();
    //		_t.updateTableData();
    //	});
    //	_t.infoBlock.find('.ct-editCell-collapse').on('click', function () {
    //		var content = $(this).parents('.ct-editCell-wrapper').find('.ct-editCell-content');
    //		if ($(this).hasClass('collapsed')) {
    //			$(this).removeClass('collapsed');
    //			content.slideDown(150, 'easeOutQuint');
    //		} else {
    //			$(this).addClass('collapsed');
    //			content.slideUp(150, 'easeOutQuint');
    //		}
    //	});
    //	_t.infoBlock.find('.closeTableInfo').on('click', function () {
    //		_t.closeInfo();
    //	});
    //	_t.infoBlock.find('input.colorpicker').on('mousedown', function () {
    //		$(this).colorpicker();
    //	});
    //	_t.infoBlock.find('input.datepicker').on('mousedown', function () {
    //		$(this).datepicker({
    //			todayBtn: "linked",
    //			language: "ru",
    //			autoclose: true,
    //			todayHighlight: true
    //		});
    //	});
    //	_t.infoBlock.find('input.datepicker').on('change', function () {
    //		var cellIndex = $(this).parents('.ct-editCell-wrapper').data('cellindex');
    //		var val = $(this).val();
    //		_t.data.data[_t.selectedRowIndex][cellIndex] = (val.length == 16) + ':00';
    //		_t.updateTableData();
    //	});
    //	_t.infoBlock.find('input.colorpicker').on('changeColor', function () {
    //		var cellIndex = $(this).parents('.ct-editCell-wrapper').data('cellindex');
    //		_t.data.data[_t.selectedRowIndex][cellIndex] = $(this).val();
    //		_t.updateTableData();
    //	});
    //};

    CTable.prototype.updateTableData = function () {
        var _t = this;

        for (var i in _t.data.data) {
            var row = _t.data.data[i];
            for (var k in row) {
                var cell = row[k];
                var htmlCell = _t.wrapper.find('tbody tr').eq(i).find('td').eq(k);
                var type = _t.data.types[k];
                switch (type) {
                    case "datepicker":
                        htmlCell.find('input.datepicker').val(cell);
                        break;
                    case "colorpicker":
                        htmlCell.find('input.colorpicker').val(cell);
                        break;
                    case "checkbox":
                        if (cell) {
                            htmlCell.find('input[type="checkbox"]')[0].checked = true;
                        } else {
                            htmlCell.find('input[type="checkbox"]')[0].checked = false;
                        }
                        break;
                    case "select":
                        var optionVal = '';
                        for (var j = 0; j < htmlCell.find('select option').length; j++) {
                            var option = htmlCell.find('select option').eq(j);
                            var optionHtml = option.html();
                            if (optionHtml == cell) {
                                optionVal = option.attr('value');
                            }
                        }
                        htmlCell.find('select').val(optionVal);
                        break;
                    case "input":
                        htmlCell.find('input[type="text"]').val(cell);
                        break;
                    case "text":
                        htmlCell.children('div').html(cell);
                        break;
                    default:
                        htmlCell.children('div').html(cell);
                        break;
                }

            }
        }
    };

    CTable.prototype.reload = function (data, callback) {

        if (typeof callback == 'function') {
            callback();
        }
    };

    CTable.prototype.returnTotalSummIniter = function () {
        var _t = this;
        var clientObject = _t.profile['extra_data']['object_profile']['client_object'];
        var useInTables = ['table_order_web_overview', 'table_order_ticket_web', 'table_order', 'table_order_ticket'];
        if (useInTables.indexOf(clientObject) > -1) {
            _t.wrapper.find('.ct-total-values-wrapper').html('<span class="ct-upload-total-summs">Загрузить суммарные значения</span>');
        } else {
            _t.wrapper.find('.ct-total-values-wrapper').hide(0);
        }

    };

    CTable.prototype.populateTotalSumms = function () {
        var _t = this;
        var clientObject = _t.profile['extra_data']['object_profile']['client_object'];
        var useInTables = ['table_order_web_overview', 'table_order_ticket_web', 'table_order', 'table_order_ticket'];
        if (useInTables.indexOf(clientObject) > -1) {

            var columns = {
                table_order_web_overview: {
                    columns: 'total_order_amount,tickets_count',
                    back: ['TOTAL_ORDER_AMOUNT', 'TICKETS_COUNT']
                },
                table_order_ticket_web: {
                    columns: 'price',
                    back: ['PRICE']
                },
                table_order: {
                    columns: 'total_order_amount,tickets_count',
                    back: ['TOTAL_ORDER_AMOUNT', 'TICKETS_COUNT']
                },
                table_order_ticket: {
                    columns: 'price',
                    back: ['PRICE']
                }
            };

            var o = {
                command: 'get',
                object: 'Sum_For_Fields',
                client_object: clientObject,
                params: {
                    columns: columns[clientObject].columns,
                    where: MB.Tables.getTable(_t.id).where
                }
            };

            function toMoneyFormat(str) {
                str = str.toString();
                var tsel = str, drob = '', dotPos = str.indexOf('.'), temp;
                if (~dotPos) {
                    tsel = str.substring(0, dotPos);
                    temp = Math.ceil(('0.' + str.substring(dotPos + 1)) * 100);
                    if (temp != 100) {
                        drob = ' ' + temp + ' коп.';
                    } else {
                        tsel = +tsel + 1;
                    }
                }
                tsel = tsel.toString();
                for (var i = tsel.length - 3; i > 0; i -= 3) {
                    tsel = tsel.substring(0, i) + ' ' + tsel.substring(i);
                }
                tsel += ' руб.'
                return tsel + drob;
            }

            socketQuery(o, function (res) {

                res = socketParse(res);

                _t.totalValues = [
                    {
                        key: 'Билетов',
                        value: (columns[clientObject].back.length > 1) ? res[0][columns[clientObject].back[1]] : res[0]['ROWS_COUNT']
                    },
                    {
                        key: 'На сумму',
                        value: toMoneyFormat(res[0][columns[clientObject].back[0]])
                    }
                ];

                var totalValues = '';

                if (_t.totalValues) {
                    totalValues += '( ';
                    for (var i in _t.totalValues) {
                        var k = _t.totalValues[i]['key'];
                        var v = _t.totalValues[i]['value'];
                        totalValues += k + ': ' + v + ((i == _t.totalValues.length - 1) ? ' ' : '; ');
                    }
                    totalValues += ')';
                }
//				console.log(_t.totalValues);
                _t.wrapper.find('.ct-total-values-wrapper').html(totalValues);
            });
        } else {
            _t.wrapper.find('.ct-total-values-wrapper').html('-');
        }
    };

    CTable.prototype.isDisabledCtx = function (obj) {
        var _t = this;
        var isEqual = 0;
        var isNotEqual = 0;
        var data = _t.selection2.data;

//        var columns = [
//            {
//                col_names: ['COL1', 'COL2'],
//                matching: ['equal', 'not_equal'],
//                col_values: ['VAL1', 'VAL2']
//            }
//        ];
        var totalResArr = [];

        var rowResArr = [];

        for (var k in data) {
            var r = data[k];
            var invalid = 0;

            for (var j in obj.col_names) {

                var inc_col = obj.col_names[j];
                var inc_val = obj.col_values[j];
                var inc_match = obj.matching[j];

                if (inc_match == 'equal') {
                    if (r[inc_col] != inc_val) {
                        invalid++;
                    }
                } else if (inc_match == 'not_equal') {
                    if (r[inc_col] == inc_val) {
                        invalid++;
                    }
                }

            }
//				console.log(invalid, p.selection[k]);
            rowResArr.push(invalid == 0);
        }
        for (var r in rowResArr) {
            totalResArr.push(rowResArr[r]);
        }

//		console.log(totalResArr);
        return totalResArr;

        /*		if (obj.type == 'full') {
         for (var i in _t.selection2) {
         var p = _t.selection2[i];
         for (var k in p.selection) {
         var row = p.data[k];
         for (var j in obj.columns) {
         var col = obj.columns[j];
         var rowColVal = row[names.indexOf(col.column_name)];

         if ($.inArray(rowColVal, col.column_value) == -1) {
         isNotEqual++;
         } else {
         isEqual++;
         }
         }
         }
         }

         } else if (obj.type == 'choosen') {

         }

         return {isEqual: isEqual, isNotEqual: isNotEqual};*/
    };

    CTable.prototype.getProfileByColumnName = function (column_name) {
        var _t = this;
        for (var i in _t.profile.data) {
            var cell = _t.profile.data[i];
            if (cell['COLUMN_NAME'] == column_name) {
                return cell;
            }
        }
    };

    CTable.prototype.getDependsOfValueByColumnName = function (column_name, rowIndex) {
        var _t = this;
        var value = _t.data.data[rowIndex][column_name];
        if (value == undefined) {
            return 'NULL';
        }

        value = value.toString();

        var response = '';

        response = (value.length > 0) ? "'" + value + "'" : 'NULL';


        for (var i in _t.changes) {
            var ch = _t.changes[i];
            if (typeof ch.CHANGED_COLUMN_NAMES == 'string') {
                if (ch.CHANGED_COLUMN_NAMES == column_name) {
                    response = "'" + ch.CHANGED_COLUMN_VALUES + "'";
                }
            } else {
                for (var j in ch.CHANGED_COLUMN_NAMES) {
                    var ccn = ch.CHANGED_COLUMN_NAMES[j];
                    if (ccn == column_name) {
                        response = "'" + ch.CHANGED_COLUMN_VALUES[j] + "'";
                    }
                }
            }
        }
        return (response == 'NULL' || response == '' || !response) ? 'NULL' : response;
    };

    CTable.prototype.getDependWhereForSelect = function (column_name, rowIndex) {
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
        result = result.replaceAll("&apos;", "'");


        //console.log('SELECT LOV WHERE', result);

        return result;

    };

    CTable.prototype.toggleSaveButton = function (active) {
        var _t = this;
        var saveButton = _t.places.saveButton;
        var activeClass = "active";
        var formInstance = MB.Tables.getTable(_t.id)['parentObject'];

        if (active) saveButton.addClass(activeClass);
        else saveButton.removeClass(activeClass);

        if (formInstance && formInstance.enableSaveButton) formInstance.enableSaveButton();
    };

    CTable.prototype.toggleRemoveButton = function (active) {
        var _t = this;
        var removeButton = _t.places.removeButton;
        var isDisabled;
        var disabledClass = "disabled";

        if (removeButton) {
            isDisabled = removeButton.hasClass(disabledClass);
            if (active && isDisabled) removeButton.removeClass(disabledClass);
            else if (!active) removeButton.addClass(disabledClass);
        }
    };

    CTable.prototype.getColumnIndex = function (columnName) {
        var _t = this;
        var index = _t.data.data_columns.indexOf(columnName);
        return (index != -1) ? index : 0;
    };

    CTable.prototype.checkColumnVisible = function (columnIndex) {
        var _t = this;
        return _t.visibleArray[columnIndex];
    };

    CTable.prototype.getLocalStorage = function () {
        return JSON.parse(localStorage.getItem(lsName + "_properties_" + lsTable.name));
    };

    CTable.prototype.setLocalStorage = function (data) {
        localStorage.setItem(lsName + "_properties_" + lsTable.name, data);
    };

    CTable.prototype.setCustomSelection = function (indexes) {
        var _t = this;
        var i;
        var j;
        var l;
        var columnName, columnIndex;
        var cells = customSelection.cells;
        var lastElem = cells.length - 1;
        var matrix = customSelection.matrix;
        var matrixTBody = matrix.tbody;
        cells[lastElem] = {};

        for (i = indexes.startTr; i <= indexes.endTr; i++) {
            if (cells[lastElem][i] == undefined) cells[lastElem][i] = {};
            for (j = indexes.startTd; j <= indexes.endTd; j++) {
                columnName = _t.data.data_columns[j];
                if (_t.checkColumnVisible(j)) {
                    columnIndex = _t.places.theads[columnName].index();
                    var isAdd = true;

                    for (var i2 = 0; i2 < cells.length; i2++) {
                        if (cells[i2][i] && cells[i2][i][columnIndex]) {
                            isAdd = false;
                            break;
                        }
                    }

                    if (isAdd) cells[lastElem][i][columnIndex] = true;
                }
            }
        }

        for (i = 0; i < cells.length; i++) {
            var items = cells[i];
            for (j in items) {
                if (items.hasOwnProperty(j)) {
                    var row = items[j];
                    if (matrixTBody[j] == undefined) matrixTBody[j] = {};
                    for (l in row) {
                        if (row.hasOwnProperty(l)) {
                            var td = _t.places.tds[j][l];
                            columnName = _t.places.theadRow.children("th:eq(" + l + ")").data("column-name");
                            columnIndex = _t.data.data_columns.indexOf(columnName);

                            if (td && !td.hasClass("frst") && !td.hasClass("selected")) td.addClass("selected");

                            matrixTBody[j][columnIndex] = true;
                            matrix.thead[columnIndex] = true;
                        }
                    }
                }
            }
        }
        customSelection.matrix = matrix;
        customSelection.isSelected = true;
    };

    CTable.prototype.clearCustomSelection = function () {
        var _t = this;
        _t.places.tbody.find("tr td").removeClass("selected");
        customSelection.isSelected = false;
        customSelection.matrix = {thead: {}, tbody: {}};
    };

    CTable.prototype.showTableMenu = function () {
        var _t = this;
        var tBody = customSelection.matrix.tbody;
        var oneSelectedColumn = true;
        var lastCell;
        var wrapper = $('<div></div>');
        var excludeClass = 'exclude-selection';

        var type;
        var editable;

        var insertTextHandler = function (index, wrapper) {
            return function (event) {
                var insertField = $("<div></div>");
                var insertFieldWrapper = $("<div></div>");
                //console.log(index);
                var isInsertable = _t.profile.data[index]['insertable'];
                var isUpdatable = _t.profile.data[index]['updatable'];
                var htmlElemParams = {
                    type: type,
                    value: "",
                    editable: true,
                    insertable: isInsertable,
                    updatable: isUpdatable,
                    name: _t.data.data_columns[index],
                    selId: "1",
                    isTd: true
                };
                //console.log(htmlElemParams);

                customSelection.isMultipleEdit = true;

                insertFieldWrapper.addClass("classicTable-insert-field-bg " + excludeClass);
                insertField.addClass("classicTable-insert-field");
                insertFieldWrapper.append(insertField);

                wrapper.empty();
                wrapper.append(insertFieldWrapper);
                insertField.html(_t.getTypeHtml(htmlElemParams));
                customSelection.isSelection = false;

                if (type == "select2") {
                    wrapper.find('div.ct-select3-wrapper').each(function (index, elem) {
                        initSelect3Handler.call(_t, elem, excludeClass);
                    });
                }
                else if (type == "text" || type == "phone") {
                    if (type == "phone") wrapper.find('input.phoneNumber').phoneIt();

                    wrapper.find('input[type="text"]:not(".datetimepicker")').on('input', function () {//keyup
                        inputTypeHandler.call(_t, $(this), excludeClass);
                    });
                }
                else if (type == "checkbox") {
                    wrapper.find('div.ct-checkbox-wrapper').each(function (index, elem) {
                        initCheckBoxHandler.call(_t, elem);
                    });
                }
                else if (type == "number") {
                    wrapper.find('input[type="number"]').off('input').on('input', function () {
                        numberTypeHandler.call(_t, $(this));
                    });
                }
                else if (type == "float2") {
                    wrapper.find('input[type="number"]').off('input').on('input', function () {
                        numberTypeHandler.call(_t, $(this));
                    });
                }
                else if (type == "datetime" || type == "datetime_wo_sec") {
                    wrapper.find('input.datetimepicker').each(function (index, elem) {
                        initDateTimeHandler.call(_t, elem, excludeClass);
                    });
                }

            }
        };
        var buttonCopy = $("<div></div>");
        var buttonInsert = $("<div></div>");
        var checkOneColumn = function (index) {
            for (var i in tBody) {
                if (tBody.hasOwnProperty(i)) if (Object.keys(tBody[i]).indexOf(index) == -1 || Object.keys(row).length > 1) return false;
            }

            return true;
        };

        _t.hideTableMenu();

        buttonCopy.addClass("ct-options-item ct-options-copy " + excludeClass);
        buttonCopy.html('<i class="fa fa-copy ' + excludeClass + '"></i>');
        wrapper.addClass("classicTable-menu");
        wrapper.append(buttonCopy);

        for (var i in tBody) {
            if (tBody.hasOwnProperty(i)) {
                var row = tBody[i];
                for (var j in row) {
                    if (row.hasOwnProperty(j)) {
                        if (!checkOneColumn(j)) oneSelectedColumn = false;
                        lastCell = j;
                    }
                }
            }
        }

        type = _t.profile.data[lastCell]['TYPE_OF_EDITOR'];
        editable = _t.profile.data[lastCell]['EDITABLE'];

        if (oneSelectedColumn && editable && type != 'select2withEmptyValue' && type != 'select2FreeType' && type != 'File' && _t.profile['extra_data']['object_profile']['modify_command']) {
            buttonInsert.addClass("ct-options-item ct-options-insert " + excludeClass);
            buttonInsert.html('<i class="fa fa-pencil ' + excludeClass + '"></i>');
            buttonInsert.on("click", insertTextHandler(lastCell, wrapper));
            wrapper.append(buttonInsert);
        }

        $(document.body).append(wrapper);
        wrapper.offset({left: mouse.pageX - wrapper.outerWidth(), top: mouse.pageY - wrapper.outerHeight() / 2});

        _t.initClipboard(buttonCopy, wrapper);
    };

    CTable.prototype.hideTableMenu = function () {
        $(".classicTable-menu").remove();
        customSelection.isMultipleEdit = false;
    };

    CTable.prototype.setRowSelectedById = function(id){
        var _t = this;
        var row;

        for(var i in _t.data.data){
            var r = _t.data.data[i];
            var pk_value = r[_t.primary_keys[0]];//_t.data.data_columns.indexOf(

            if(pk_value == id){
                row = r;
            }
        }

        _t.selection2 = {
            data: [row],
            primary_keys: [
                {
                    data: [id],
                    data_columns: ['id']
                }
            ]
        };
        _t.renderSelection();


    };

    CTable.prototype.createCustomButtons = function () {

        var _t = this;

        _t.places.tbody.find('.ct-cell-insert-custom-buttons').each(function (index, elem) {

            var fld_id = $(elem).attr('data-id');

            var tpl = '{{#btns}}<div class="ct-custom-button" data-id="{{id}}"><i class="fa {{icon}}"></i><div class="ct-custom-button-placeholder">{{placeholder}}</div></div>{{/btns}}';

            var mo = {
                btns:[]
            };

            if(_t.customButtons){

                for(var i in _t.customButtons){

                    var btn = _t.customButtons[i];
                    var id = btn.id;

                    if(+id == +fld_id){

                        for(var k in btn.buttons){
                            var kbtn = btn.buttons[k];

                            var btnid = kbtn.id;
                            var icon = kbtn.icon;
                            var placeholder = kbtn.placeholder;


                            mo.btns.push({
                                id: btnid,
                                icon: icon,
                                placeholder: placeholder
                            });
                        }
                    }
                }

                $(elem).html(Mustache.to_html(tpl,mo));

            }
        });

        _t.places.tbody.find('.ct-custom-button').off('click').on('click', function () {

            var eid = $(this).attr('data-id');

            var rowidx = $(this).parents('tr').eq(0).index();
            rowidx = rowidx - _t.places.tbody.find('tr.new_row').length;

            var rowdata = _t.data.data[rowidx];

            for(var c in _t.customButtons){
                for(var j in _t.customButtons[c].buttons){

                    if(_t.customButtons[c].buttons[j].id == eid){
                        _t.customButtons[c].buttons[j].callback(rowdata);
                    }

                }
            }

        });

    };


    var tables = new CTables();
    var addTable = function (params, callback) {
        var instace = new CTable(params);

        lsTable.name = MB.Tables.getTable(instace.id).name;
        lsTable.userName = MB.User.username;

        tables.addItem(instace);
        instace.render();
        if (typeof callback == 'function') {
            callback(instace);
        }
        return instace;
    };
    var initTable = function (tableElem) {
        tableElem.css('border', '5px solid red');
    };

    MB.Core.classicTable = {
        tables: tables,
        createTable: addTable,
        initTable: initTable
    };
};
//
//(function(){
//
//    var a = ['class_profile',
//            'class_fields_profile',
//            'filter_type',
//            'type_of_editor',
//            'menu',
//            'menu_type',
//            'test',
//            'test_child',
//            'transaction_daily_registry',
//            'merchant_investment_request',
//            'business_type',
//            'merchant',
//            'file',
//            'document_status',
//            'document',
//            'company',
//            'investor'
//    ];
//
//
//
//
//    async.waterfall([
//        function (cb) {
//            async.eachSeries(a, function(item, cb){
//                var o = {
//                    command:'create',
//                    object:'Table',
//                    params:{
//                        name: item
//                    }
//                };
//
//                socketQuery(o, function(res){
//                    if(res.code){
//                        cb('ERROR on ', item);
//                    }else{
//                        cb(null);
//                    }
//                });
//
//
//            }, function(err){
//                console.log(err);
//                cb(err);
//            });
//        },
//        function (cb) {
//            async.eachSeries(a, function(item, cb){
//
//                var o = {
//                    command:'createClass',
//                    object:'Table',
//                    params:{
//                        name: item
//                    }
//                };
//
//                socketQuery(o, function(res){
//                    if(res.code){
//                        cb('ERROR on ', item);
//                    }else{
//                        cb(null);
//                    }
//                });
//
//
//            }, function(err){
//                console.log(err);
//                cb(err);
//            });
//        }
//    ], function(err){
//
//    });
//
//
//}());


//socketQuery({command:'createClass', object:'Table', params:{name:'class_profile'}}, function(res){console.log(res);})
//socketQuery({command:'createClass', object:'Table', params:{name:'class_fields_profile'}}, function(res){console.log(res);})
//socketQuery({command:'createClass', object:'Table', params:{name:'filter_type'}}, function(res){console.log(res);})
//socketQuery({command:'createClass', object:'Table', params:{name:'type_of_editor'}}, function(res){console.log(res);})
//socketQuery({command:'createClass', object:'Table', params:{name:'menu'}}, function(res){console.log(res);})
//socketQuery({command:'createClass', object:'Table', params:{name:'menu_type'}}, function(res){console.log(res);})
//socketQuery({command:'createClass', object:'Table', params:{name:'test'}}, function(res){console.log(res);})
//socketQuery({command:'createClass', object:'Table', params:{name:'test_child'}}, function(res){console.log(res);})








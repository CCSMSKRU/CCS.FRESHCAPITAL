var AccessGroup = function(obj){
    this.getObject =        obj.getObject;                          // Объект верхнего уровня
    this.getLowerObject =   obj.getLowerObject || 'empty';          // Объект нижнего уровня
    this.where =            obj.where || '';                        // Дополнительное where для нижнего уровня
    this.isLowByTop =       obj.isLowByTop || false;                // Параметр, определяющий срезать ли записи нижнего уровня по первичному ключу верхнего уровня
    this.wrapper =          obj.wrapper || undefined;               // Контейнер инстанса
    this.tl_pk =            obj.tl_pk || '';                        // primary_key верхнего уровня
    this.ll_pk =            obj.ll_pk || '';                        // primary_key нижнего уровня
    this.tl_name =          obj.tl_name || '';                      // Ключевик колонки в которой записано наименование объекта верхнего уровня
    this.ll_name =          obj.ll_name || '';                      // Ключевик колонки в которой записано наименование объекта нижнего уровня
    this.group_table =      obj.group_table || '';                  // Таблица Групп доступов
    this.gr_pk =            obj.gr_pk || '';                        // primary_key таблицы групп доступов
    this.group_item_table = obj.group_item_table || '';             // Таблица записей доступов
    this.gr_i_pk          = obj.gr_i_pk || '';                      // primary_key таблицы записей доступов
    this.env_name =         obj.env_name || '';                     // Имя/Тип окружения
    this.env_id =           obj.env_id || '';                       // ID окружения
    this.companies =        [];                                     // Компании
    this.l_scroll_top =     0;                                      // Скролл левой колонки
    this.r_scroll_top =     0;                                      // Скролл правой колонки
    this.env_item_name =    obj.env_item_name || '';                // Ключевик места в мапе
    this.map_inst =         obj.map_inst || undefined;              // инстанс мапы

    console.log('MAP', obj.map_inst);

};

(function(){

    var colors = ['red','blue','green','yellow','orange','purple']; // Гаммы для последовательной генерации цветов создаваемых групп доступов

    AccessGroup.prototype.getPlacesAccess = function(cb){
        var _t = this;
        var o = {
            command: 'get',
            object: 'hall_scheme_item_user_group_access',
            params: {
                //_t.env_item_name // hall_sheme_item_id
                //_t.gr_pk // hs_access_user_group_id
            }
        };

        o.params[_t.env_name] = _t.env_id;

        socketQuery(o, function(res){
            var jsonRes = JSON.parse(res);
            var jRes = socketParse(res);
            _t.placesAccess = jRes;
            console.log(_t.placesAccess);
            if(typeof cb == 'function'){
                cb();
            }
        });
    };

    AccessGroup.prototype.createClientPlacesAccess = function(){
        var _t = this;
        var placesAccess_client = [];

        for(var k in _t.groups){
            var gr = _t.groups[k];
            placesAccess_client.push({
                id: gr[_t.gr_pk.toUpperCase()],
                color: gr['COLOR'],
                places: []
            });
        }

        for(var i in placesAccess_client){
            var group = placesAccess_client[i];

            for(var j in _t.placesAccess){
                var pa = _t.placesAccess[j];
                if(pa[_t.gr_pk.toUpperCase()] == group.id){
                    group.places.push(pa[_t.env_item_name.toUpperCase()]);
                }
            }
        }

        _t.placesAccess_client = placesAccess_client;
    };

    AccessGroup.prototype.addAccessPlaces = function(){
        var _t = this;
        var selectedGroups = [];
        var flatSelectedGroups = [];

        for(var sg=0; sg< _t.wrapper.find('.ag-group-wrapper.selected').length; sg++){
            var grpData = _t.getMoGroup(_t.wrapper.find('.ag-group-wrapper.selected').eq(sg).data('id'), 'left');
            selectedGroups.push({
                id: grpData.groupId,
                color: grpData.groupColor
            });
            flatSelectedGroups.push(grpData.groupId);
        }

        for(var i in _t.placesAccess_client){
            var gr = _t.placesAccess_client[i];
            if(flatSelectedGroups.indexOf(gr.id) > -1){
                gr.places = gr.places.concat(_t.map_inst.selection);
                for(var i2=0; i2<gr.places.length; ++i2) {
                    for(var j=i2+1; j<gr.places.length; ++j) {
                        if(gr.places[i2] === gr.places[j])
                            gr.places.splice(j--, 1);
                    }
                }
            }
        }



        for(var sgi=0; sgi<selectedGroups.length; sgi++){
            var sgitem = selectedGroups[sgi];
            for(var s in _t.map_inst.selection){
                var plc = _t.map_inst.selection[s];

                _t.map_inst.squares[plc].groups = _t.map_inst.squares[plc].groups || [];
                _t.map_inst.squares[plc].groups.push(sgitem.id);

                _t.map_inst.squares[plc].groupsColors = _t.map_inst.squares[plc].groupsColors || [];
                _t.map_inst.squares[plc].groupsColors.push(sgitem.color);
//                console.log('PLC', _t.map_inst.squares[plc]);
            }
        }

//        _t.map_inst.clearSelection();
//        _t.map_inst.reLoad();

    };

    AccessGroup.prototype.save = function(){
        var _t = this;

//      set_hall_scheme_item_user_group_access

    };

    AccessGroup.prototype.getData = function(cb){
        var _t = this;
        async.each(_t.companies,
            function(item, callback){
                var o = {
                    command: 'get',
                    object: _t.getObject,
                    params:{
                        where: 'COMPANY_ID = '+item['COMPANY_ID']
                    }
                };
                socketQuery(o, function(res){
                    var jsonRes = JSON.parse(res);
                    var jRes = socketParse(res);
                    if(jsonRes.code == 0){
                        item.topLevelData = jRes;
                        callback(null);
                    }else{
                        item.topLevelData = jRes;
                        jsonRes.toastr = jsonRes.toastr || {};
                        jsonRes.toastr.message = jsonRes.toastr.message || 'empty message';
                        callback(jsonRes.toastr.message);
                    }
                });
            },
            function(err){
                cb(err);
            }
        );
    };

    AccessGroup.prototype.getInnerData = function(cb){
        var _t = this;
        if(_t.getLowerObject == 'empty'){
            cb();
            return;
        }
        var index, promise, promises_ary, _i;
        promises_ary = [];
        for (index = _i = 0; _i < _t.companies.length; index = ++_i) {
            promise = (function(index) {
                var dfd;
                dfd = new $.Deferred();
                var item = _t.companies[_i];
                var whereStr = (_t.where.length > 0)? "COMPANY_ID = '"+item['COMPANY_ID'] + "' and "+_t.where : "COMPANY_ID = '"+item['COMPANY_ID']+"'";
                var o = {
                    command: 'get',
                    object: _t.getLowerObject,
                    params:{
                        where: whereStr
                    }
                };
                socketQuery(o, function(res){
                    var jsonRes = JSON.parse(res);
                    var jRes = socketParse(res);
                    _t.companies[index].lowLevelData = jRes;
                    return dfd.resolve();
                });
                return dfd.promise();
            })(index);
            promises_ary.push(promise);
        }

        $.when.apply($, promises_ary).done(function() {
            if(typeof cb == 'function'){
                cb();
            }
        });
    };

    AccessGroup.prototype.getCompanies = function(cb){
        var _t = this;

        var o = {
            command: 'get',
            object: 'company',
            params: {

            }
        };
        socketQuery(o, function(res){
            res = socketParse(res);
            _t.companies = res;
            if(typeof cb == 'function'){
                cb();
            }
        });
    };

    AccessGroup.prototype.getGroups = function(cb){
        var _t = this;
        var o = {
            command: 'get',
            object: _t.group_table,
            params: {
                where: _t.env_name + " = '"+_t.env_id + "'"
            }
        };

        socketQuery(o, function(res){
            var jsonRes = JSON.parse(res);
            var jRes = socketParse(res);
            if(jsonRes.code == 0){
                _t.groups = jRes;
                cb(null);
            }else{
                _t.groups = jRes;
                jsonRes.toastr = jsonRes.toastr || {};
                jsonRes.toastr.message = jsonRes.toastr.message || 'empty message';
                cb(jsonRes.toastr.message);
            }
        });
    };

    AccessGroup.prototype.getAccess = function(cb){
        var _t = this;
        var o = {
            command: 'get',
            object: _t.group_item_table,
            params: {
                where: _t.env_name + " = '" + _t.env_id + "'"
            }
        };
        socketQuery(o, function(res){
            var jsonRes = JSON.parse(res);
            var jRes = socketParse(res);
            if(jsonRes.code == 0){
                _t.access = jRes;
                cb(null);
            }else{
                _t.access = jRes;
                jsonRes.toastr = jsonRes.toastr || {};
                jsonRes.toastr.message = jsonRes.toastr.message || 'empty message';
                cb(jsonRes.toastr.message);
            }
        });
    };

    AccessGroup.prototype.createMObj = function(cb){
        var _t = this;
        var mO = {
            l_list: {
                groups: []
            },
            r_list: {}
        };

        mO.r_list.companyItems = [];
        var itemsToAdd = [];

        var isGroupExists = function(gId){
            for(var i in itemsToAdd){
                if(itemsToAdd[i].gId == gId){
                    return true;
                }
            }
            return false;
        };

        var isCompanyExisits = function(gId, cId){
            for(var i in itemsToAdd){
                if(itemsToAdd[i].gId == gId && itemsToAdd[i].cId == cId){
                    return true;
                }
            }
            return false;
        };
        var isTopLevelExisits = function(gId, cId, tId){
            for(var i in itemsToAdd){
                if(itemsToAdd[i].gId == gId && itemsToAdd[i].cId == cId && itemsToAdd[i].tId == tId){
                    return true;
                }
            }
            return false;
        };
        var isLowLevelExisits = function(gId, cId, tId, lId){
            for(var i in itemsToAdd){
                if(itemsToAdd[i].gId == gId && itemsToAdd[i].cId == cId && itemsToAdd[i].tId == tId && itemsToAdd[i].lId == lId){
                    return true;
                }
            }
            return false;
        };

        (function(){
            var cIdx = 0;
            var tIdx = 0;
            for(var i in _t.companies){
                var c = _t.companies[i];
                var o ={
                    opened: (_t.getMoCompany(c['COMPANY_ID'], 'right'))? _t.getMoCompany(c['COMPANY_ID'], 'right').opened : '',
                    empty: (c['topLevelData'].length > 0)? '': 'empty',
                    companyTitle: c['COMPANY_NAME'],
                    companyId: c['COMPANY_ID'],
                    topLevelItems: []
                };

                mO.r_list.companyItems.push(o);

                for(var k in c.topLevelData){
                    var tl = c.topLevelData[k];
                    var tlo = {
                        opened: (_t.getMoTopLevel(tl[_t.tl_pk], 'right'))? _t.getMoTopLevel(tl[_t.tl_pk], 'right').opened : '',
                        topLevelId: tl[_t.tl_pk],
                        topLevelTitle: tl[_t.tl_name],
                        lowLevelItems: []
                    };

                    mO.r_list.companyItems[cIdx].topLevelItems.push(tlo);

                    mO.r_list.companyItems[cIdx].topLevelItems[tIdx].lowLevelItems.push({
                        checked: '',
                        lowLevelId: 'all',
                        lowLevelTitle: 'Все доступны',
                        groups: []
                    });



                    for(var j in c.lowLevelData){
                        var ll = c.lowLevelData[j];
                        var llo = {
                            checked: '',
                            lowLevelId: ll[_t.ll_pk],
                            lowLevelTitle: ll[_t.ll_name],
                            groups: []
                        };

                        if(_t.isLowByTop){
                            if(ll[_t.tl_pk] == tl[_t.tl_pk]){
                                mO.r_list.companyItems[cIdx].topLevelItems[tIdx].lowLevelItems.push(llo);
                            }
                        }else{
                            mO.r_list.companyItems[cIdx].topLevelItems[tIdx].lowLevelItems.push(llo);
                        }


                    }

                    tIdx++;
                }
                cIdx++;
            }
        }());

        (function(){
            for(var i in _t.groups){
                var gr = _t.groups[i];
                mO.l_list.groups.push({
                    groupId: gr[_t.gr_pk.toUpperCase()],
                    groupTitle: gr['NAME'],
                    groupColor: gr['COLOR'],
                    opened: (_t.getMoGroup(gr[_t.gr_pk.toUpperCase()], 'left'))? _t.getMoGroup(gr[_t.gr_pk.toUpperCase()], 'left').opened: '',
                    companyItems: []
                });

                for(var k in _t.access){
                    var ac = _t.access[k];
                    if(ac[_t.gr_pk.toUpperCase()] == gr[_t.gr_pk.toUpperCase()]){
                        for(var j in mO.r_list.companyItems){
                            var co = mO.r_list.companyItems[j];
                            for(var l in co.topLevelItems){
                                var tli = co.topLevelItems[l];
                                if(tli.topLevelId == ac[_t.tl_pk.toUpperCase()]){
                                    for(var u in tli.lowLevelItems){
                                        var lli = tli.lowLevelItems[u];

                                        if(lli.lowLevelId == 'all' && ac[_t.ll_pk.toUpperCase()] == '0'){

                                            itemsToAdd.push({gId: gr[_t.gr_pk.toUpperCase()], cId: co.companyId, tId: tli.topLevelId, lId: 'all'});

                                            lli.groups.push({
                                                id: gr[_t.gr_pk.toUpperCase()],
                                                color: gr['COLOR'],
                                                title: gr['NAME']
                                            });

                                        }else{

                                            if(lli.lowLevelId == ac[_t.ll_pk.toUpperCase()]){

                                                itemsToAdd.push({gId: gr[_t.gr_pk.toUpperCase()], cId: co.companyId, tId: tli.topLevelId, lId: lli.lowLevelId});

                                                lli.groups.push({
                                                    color: gr['COLOR'],
                                                    title: gr['NAME']
                                                });

//                                                lli.checked = 'checked';
                                            }
                                        }

                                    }
                                }
                            }
                        }
                    }
                }
            }
        }());

        (function(){

            for(var g in mO.l_list.groups){
                var gr = mO.l_list.groups[g];
                var cIdx = 0;
                var tIdx = 0;

                for(var i in _t.companies){
                    var c = _t.companies[i];
                    var o ={
                        opened: (_t.getMoCompany(c['COMPANY_ID'], 'left'))? _t.getMoCompany(c['COMPANY_ID'], 'left').opened : '',
                        empty: '',
                        companyTitle: c['COMPANY_NAME'],
                        companyId: c['COMPANY_ID'],
                        topLevelItems: []
                    };

                    gr.companyItems.push(o);

                    for(var k in c.topLevelData){
                        var tl = c.topLevelData[k];
                        var tlo = {
                            opened: (_t.getMoTopLevel(tl[_t.tl_pk], 'left'))? _t.getMoTopLevel(tl[_t.tl_pk], 'left').opened : '',
                            topLevelId: tl[_t.tl_pk],
                            topLevelTitle: tl[_t.tl_name],
                            lowLevelItems: []
                        };

                        gr.companyItems[cIdx].topLevelItems.push(tlo);

                        gr.companyItems[cIdx].topLevelItems[tIdx].lowLevelItems.push({
                            checked: '',
                            lowLevelId: 'all',
                            lowLevelTitle: 'Все доступны'
                        });

                        for(var j in c.lowLevelData){
                            var ll = c.lowLevelData[j];
                            var llo = {
                                checked: '',
                                lowLevelId: ll[_t.ll_pk],
                                lowLevelTitle: ll[_t.ll_name]
                            };

                            if(_t.isLowByTop){
                                if(ll[_t.tl_pk] == tl[_t.tl_pk]){
                                    gr.companyItems[cIdx].topLevelItems[tIdx].lowLevelItems.push(llo);
                                }
                            }else{
                                gr.companyItems[cIdx].topLevelItems[tIdx].lowLevelItems.push(llo);
                            }

                        }

                        tIdx++;
                    }
                    cIdx++;
                }

            }

        }());

        (function(){
            for(var i in mO.l_list.groups){
                var gr = mO.l_list.groups[i];
                if(isGroupExists(gr['groupId'])){
                    gr.empty = '';
                    for(var k in gr.companyItems){
                        var c = gr.companyItems[k];
                        if(isCompanyExisits(gr['groupId'], c['companyId'])){
                            c.hidden = '';
                            for(var t in c.topLevelItems){
                                var titem = c.topLevelItems[t];
                                if(isTopLevelExisits(gr['groupId'], c['companyId'], titem['topLevelId'])){
                                    titem.hidden = '';
                                    for(var l in titem.lowLevelItems){
                                        var litem = titem.lowLevelItems[l];
                                        if(isLowLevelExisits(gr['groupId'], c['companyId'], titem['topLevelId'], litem['lowLevelId'])){
                                            if(litem.lowLevelId == 'all'){
                                                titem.isAll = 'ag-tl-all-allowed';
                                            }
                                            litem.hidden = '';
                                        }else{
                                            litem.hidden = 'hiddenNode';
                                        }
                                    }
                                }else{
                                    titem.hidden = 'hiddenNode';
                                }
                            }
                        }else{
                            c.hidden = 'hiddenNode';
                        }
                    }
                }else{
                    gr.empty = 'emptyGroup';
                }

            }
        }());

        _t.mO = mO;

        if(typeof cb == 'function'){
            cb();
        }
    };

    AccessGroup.prototype.render = function(){
        var _t = this;
        var tpl = '<div class="ag-wrapper">' +
                    '<div class="ag-u-wrapper excludeHeight">' +
                        '<div class="ag-l-u-wrapper">' +
                            '<div class="ag-l-search-wrapper">' +
                                '<div class="ag-l-search-wrapper">' +
                                    '<input type="text" class="ag-l-search" placeholder="Посик"/>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="ag-r-u-wrapper">' +
                            '<div class="ag-r-search-wrapper">' +
                                '<div class="ag-r-search-wrapper">' +
                                    '<input type="text" class="ag-r-search" placeholder="Посик"/>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="ag-l-wrapper">' +
                        '<div class="ag-add-group-wrapper">'+
                            '<div class="ag-add-group-dd">' +
                                '<div class="">' +
                                    '<div class="col-md-6 form-group">' +
                                        '<label>Название группы доступов:</label>'+
                                        '<input type="text" class="form-control" id="ag-new-group-name"/>'+
                                    '</div>'+
                                    '<div class="col-md-6 form-group">' +
                                        '<label>Цвет группы доступов:</label>'+
                                        '<input type="text" class="form-control" id="ag-new-group-color"/>'+
                                    '</div>' +
                                '</div>'+
                            '</div>'+
                            '<div class="ag-add-group">'+
                                '<div class="ag-add-group-add">' + //
                                    '<div class="ag-add-group-inner">' +
                                        '<i class="fa fa-plus"></i>&nbsp;&nbsp;Добавить группу доступов' +
                                    '</div>' +
                                '</div>'+

                                '<div class="wid50pr ag-add-group-check ag-add-group-confirm">' +
                                    '<i class="fa fa-check"></i>&nbsp;&nbsp;Добавить' +
                                '</div>' +
                                '<div class="wid50pr ag-add-group-check ag-add-group-cancel">' +
                                    '<i class="fa fa-times"></i>&nbsp;&nbsp;Отмена' +
                                '</div>' +
                            '</div>' +
                        '</div>'+
                        '<div class="ag-l-list-wrapper">' +
                            '{{#l_list}}'+
                            '{{#groups}}' +
                                '<div class="ag-group-wrapper {{opened}} {{empty}}" data-id="{{groupId}}">' +
                                    '<div class="ag-group-header">' +
                                        '<div class="ag-group-toggler {{opened}}">' +
                                            '<i class="fa fa-circle-o"></i>' +
                                            '<i class="fa fa-angle-down"></i>' +
                                            '<i class="fa fa-angle-double-up"></i>' +
                                        '</div>'+
                                        '<div class="ag-group-select"></div>'+
                                        '<div class="ag-group-selected"></div>'+
                                        '<div class="ag-group-color" style="background-color: {{groupColor}}"></div>'+
                                        '<div class="ag-group-title">{{groupTitle}}</div>'+
                                        '<div class="ag-group-modify-wrapper">' +
                                            '<div class="ag-group-modify-color"><input class="ag-group-modify-color" type="text" value="{{groupColor}}"/></div>' +
                                            '<div class="ag-group-modify-title"><input class="ag-group-modify-title" type="text" value="{{groupTitle}}"/></div>' +
                                        '</div>'+
                                        '<div class="ag-group-funcs">' +
                                            '<div class="ag-group-modify visibleHover" data-id="{{groupId}}"><i class="fa fa-edit"></i></div>' +
                                            '<div class="ag-group-remove visibleHover" data-id="{{groupId}}"><i class="fa fa-trash-o"></i></div>' +
                                            '<div class="ag-group-modify-confirm visibleHover" data-id="{{groupId}}"><i class="fa fa-check"></i></div>' +
                                            '<div class="ag-group-modify-cancel visibleHover" data-id="{{groupId}}"><i class="fa fa-times"></i></div>' +
                                        '</div>'+
                                    '</div>' +
                                    '<div class="ag-group-body">' +
                                        '<div style="border-top-color: {{groupColor}}" class="ag-group-angle-inner"></div><div style="border-top-color: {{groupColor}}" class="ag-group-angle-outer"></div><div style="border-top-color: rgba(0,0,0,0.3)" class="ag-group-angle-outer2"></div>' +
                                        '<div class="ag-companies-wrapper">' +
                                            '{{#companyItems}}' +
                                                '<div class="ag-company-wrapper {{opened}} {{empty}} {{hidden}}" data-id="{{companyId}}">' +
                                                    '<div class="ag-company-header">' +
                                                        '<div class="ag-company-toggler {{opened}}">' +
                                                            '<i class="fa fa-angle-down"></i>' +
                                                            '<i class="fa fa-angle-double-up"></i>' +
                                                        '</div>'+
                                                        '<div class="ag-company-title">{{companyTitle}}</div>'+
                                                        '<div class="ag-company-funcs"></div>'+
                                                    '</div>' +
                                                    '<div class="ag-company-body">' +
                                                        '<div class="ag-topLevels-wrapper">' +
                                                            '{{#topLevelItems}}' +
                                                                '<div class="ag-topLevel-wrapper {{opened}} {{hidden}} {{isAll}}" data-id="{{topLevelId}}">' +
                                                                    '<div class="ag-topLevel-header">' +
                                                                        '<div class="ag-topLevel-toggler {{opened}}"><i class="fa fa-angle-down"></i><i class="fa fa-angle-double-up"></i></div>'+
                                                                        '<div class="ag-topLevel-title">{{topLevelTitle}}</div>'+
                                                                        '<div class="ag-topLevel-funcs"></div>'+
                                                                    '</div>' +
                                                                    '<div class="ag-topLevel-body">' +
                                                                        '<div class="ag-lowLevels-wrapper" >' +
                                                                            '{{#lowLevelItems}}' +
                                                                                '<div class="ag-lowLevel-wrapper {{checked}} {{hidden}}" data-id="{{lowLevelId}}">' +
                                                                                      '<div class="ag-lowLevel-checkbox"></div>'+
                                                                                      '<div class="ag-lowLevel-title"><i class="fa abs-icon r-cross fa-angle-right"></i><i class="fa abs-icon l-cross fa-angle-left"></i>&nbsp;&nbsp;{{lowLevelTitle}}</div>'+
                                                                                '</div>' +
                                                                            '{{/lowLevelItems}}' +
                                                                        '</div>'+
                                                                    '</div>' +
                                                                '</div>' +
                                                            '{{/topLevelItems}}' +
                                                        '</div>'+
                                                    '</div>' +
                                                '</div>' +
                                            '{{/companyItems}}' +
                                        '</div>'+
                                    '</div>' +
                                '</div>' +
                            '{{/groups}}' +
                            '{{/l_list}}'+
                        '</div>' +
                    '</div>' +

                    '<div class="ag-r-wrapper">' +
                        '<div class="ag-r-list-wrapper">' +
                            '{{#r_list}}'+
                            '{{#companyItems}}' +
                            '<div class="ag-company-wrapper {{opened}} {{empty}}" data-id="{{companyId}}">' +
                            '<div class="ag-company-header">' +
                            '<div class="ag-company-toggler {{opened}}"><i class="fa fa-angle-down"></i><i class="fa fa-angle-double-up"></i></div>'+
                            '<div class="ag-company-title">{{companyTitle}}</div>'+
                            '<div class="ag-company-funcs"></div>'+
                            '</div>' +
                            '<div class="ag-company-body">' +
                            '<div class="ag-topLevels-wrapper">' +
                            '{{#topLevelItems}}' +
                            '<div class="ag-topLevel-wrapper {{opened}} {{isAll}}" data-id="{{topLevelId}}">' +
                            '<div class="ag-topLevel-header">' +
                            '<div class="ag-topLevel-toggler {{opened}}"><i class="fa fa-angle-down"></i><i class="fa fa-angle-double-up"></i></div>'+
                            '<div class="ag-topLevel-title">{{topLevelTitle}}</div>'+
                            '<div class="ag-topLevel-funcs"></div>'+
                            '</div>' +
                            '<div class="ag-topLevel-body">' +
                            '<div class="ag-lowLevels-wrapper">' +
                            '{{#lowLevelItems}}' +
                            '<div class="ag-lowLevel-wrapper {{checked}}" data-id="{{lowLevelId}}">' +
                                '<div class="ag-lowLevel-checkbox"></div>'+
                                '<div class="ag-lowLevel-title"><i class="fa fa-angle-left"></i>&nbsp;&nbsp;{{lowLevelTitle}}</div>'+
                                '<div class="ag-lowLevel-groups-list">' +
                                    '{{#groups}}' +
                                        '<div class="ag-lowLevel-group-wrapper" data-id="{{id}}">' +
                                            '<div class="ag-lowLevel-group-color" style="background-color: {{color}}"></div>' +
                                            '<div class="ag-lowLevel-group-title">{{title}}</div>' +
                                        '</div>' +
                                    '{{/groups}}' +
                                '</div>' +
                            '</div>' +
                            '{{/lowLevelItems}}' +
                            '</div>'+
                            '</div>' +
                            '</div>' +
                            '{{/topLevelItems}}' +
                            '</div>'+
                            '</div>' +
                            '</div>' +
                            '{{/companyItems}}' +
                            '{{/r_list}}'+
                        '</div>' +
                    '</div>' +
                    '</div>';

        _t.wrapper.find('.access-zones-wrapper').html(Mustache.to_html(tpl, _t.mO));
    };

    AccessGroup.prototype.addGroup = function(wrap, cb){
        var _t = this;
        var def_color = randomColor({
            luminosity: 'bright',
            hue: colors[_t.mO.l_list.groups.length % colors.length ]
        });

        var title = (wrap.find('#ag-new-group-name').val().length == 0)? 'Группа № '+(_t.mO.l_list.groups.length+1) : wrap.find('#ag-new-group-name').val();
        var color = (wrap.find('#ag-new-group-color').val().length == 0)? def_color : wrap.find('#ag-new-group-color').val();

        var o = {
            command: 'new',
            object: _t.group_table,
            params: {
                name: title,
                color: color
            }
        };
        o.params[_t.env_name] = _t.env_id;

        MB.Core.spinner.start(wrap);

        socketQuery(o, function(res){
            var jsonRes = JSON.parse(res);
            var jRes = socketParse(res);
            var obj = {
                NAME: title,
                COLOR: color
            }

            obj[_t.gr_pk.toUpperCase()] = jsonRes.results[0].id;
            obj[_t.env_name.toUpperCase()] = _t.env_id;

            _t.groups.push(obj);
            MB.Core.spinner.stop(wrap);
            if(typeof cb == 'function'){
                cb();
            }
        });
    };

    AccessGroup.prototype.removeGroup = function(id, cb){
        var _t = this;

        var o = {
            command: 'remove',
            object: _t.group_table,
            params: {}
        };
        o.params[_t.gr_pk] = id;

        socketQuery(o, function(res){
            var jsonRes = JSON.parse(res);
            var jRes = socketParse(res);

            for(var i in _t.groups){
                var gr = _t.groups[i];
                if(gr[_t.gr_pk.toUpperCase()] == id){
                    _t.groups.splice(i,1);
                }
            }
            for(var k in _t.access){
                var a = _t.access[k];
                if(a[_t.gr_pk.toUpperCase()] == id){
                    delete _t.access[k];
                }
            }

            function rec(a){
                for(var j in a){
                    var ja = a[j];
                    if(ja === undefined){
                        a.splice(j,1);
                        rec(a);
                    }
                }
            }
            rec(_t.access);



            _t.reRender();
            if(typeof cb == 'function'){
                cb();
            }
        });
    };

    AccessGroup.prototype.modifyGroup = function(id, color, title, cb){
        var _t = this;
        var o = {
            command: 'modify',
            object: _t.group_table,
            params: {
                color: color,
                name: title
            }
        };
        o.params[_t.gr_pk] = id;

        socketQuery(o, function(res){
            var jsonRes = JSON.parse(res);
            var jRes = socketParse(res);

            for(var i in _t.groups){
                var gr = _t.groups[i];
                if(gr[_t.gr_pk.toUpperCase()] == id){
                    _t.groups[i].COLOR = color;
                    _t.groups[i].NAME = title;
                }
            }

            _t.reRender();
            if(typeof cb == 'function'){
                cb();
            }
        });
    };

    AccessGroup.prototype.addAccessToMo = function(obj){
        var _t = this;

        (function(){
            for(var i in _t.mO.r_list.companyItems){
                var co = _t.mO.r_list.companyItems[i];
                for(var k in co.topLevelItems){
                    var titem = co.topLevelItems[k];
                    if(titem['topLevelId'] == obj.tl_id){
                        for(var l in titem.lowLevelItems){
                            var litem = titem.lowLevelItems[l];
                            if(litem['lowLevelId'] == obj.ll_id){
                                litem.checked = true;
                            }
                        }
                    }
                }
            }
        }());

        (function(){
            for(var i in _t.mO.l_list.groups){
                var gr = _t.mO.l_list.groups[i];
                if(gr['groupId'] == obj.grp_id){
                    for(var k in gr.companyItems){
//                        var co =
                    }
                }
            }

        }());

    };

    AccessGroup.prototype.addAccess = function(obj, cb){
        var _t = this;
        var grp_id = _t.wrapper.find('.ag-group-wrapper.selected').data('id');
        if(!grp_id){
            toastr['info']('Выберите группу, в которую добавить доступ.');
        }else{
            var execCounter = 0;

            function tryFinish(){
                if(execCounter == _t.wrapper.find('.ag-group-wrapper.selected').length -1){
                    _t.getAccess(function(){
                        MB.Core.spinner.stop(_t.wrapper.find('.ag-wrapper'));
                        if(typeof cb == 'function'){
                            cb();
                        }
                    });
                }
            }

            MB.Core.spinner.start(_t.wrapper.find('.ag-wrapper'));

            for(var i=0; i<_t.wrapper.find('.ag-group-wrapper.selected').length; i++){
                var grp = _t.wrapper.find('.ag-group-wrapper.selected').eq(i);
                var grpId = grp.data('id');

                obj.grp_id = grpId;
                var o = {
                    command: 'new',
                    object: _t.group_item_table,
                    params: {}
                };

                o.params[_t.gr_pk] = grpId;
                o.params[_t.tl_pk] = obj.tl_id;
                o.params[_t.ll_pk] = (obj.ll_id == 'all')? '0': obj.ll_id;

                socketQuery(o, function(res){
                    var jsonRes = JSON.parse(res);
                    var jRes = socketParse(res);
                    tryFinish();
                    execCounter++;
                });
            }
        }
    };

    AccessGroup.prototype.removeAccess = function(obj, cb){
        var _t = this;
        var itemId = undefined;
        for(var i in _t.access){
            var a = _t.access[i];
            if(a[_t.gr_pk.toUpperCase()] == obj.grp_id){
                if(a[_t.ll_pk] == obj.ll_id){
                    if(a[_t.tl_pk] == obj.tl_id){
                        itemId = a[_t.gr_i_pk.toUpperCase()];
                    }
                }
            }
        }

        var o = {
            command: 'remove',
            object: _t.group_item_table,
            params: {

            }
        };

        o.params[_t.gr_i_pk] = itemId;
        MB.Core.spinner.start(_t.wrapper.find('.ag-wrapper'));
        socketQuery(o, function(res){
            var jsonRes = JSON.parse(res);
            var jRes = socketParse(res);
            _t.getAccess(function(){
                MB.Core.spinner.stop(_t.wrapper.find('.ag-wrapper'));
                if(typeof cb == 'function'){
                    cb();
                }
            });
        });
    };

    AccessGroup.prototype.getMoTopLevel = function(id, side){
        var _t = this;
        if(!_t.mO){
            return false;
        }
        if(side == 'left'){
            for(var i in _t.mO.l_list.groups){
                var gr = _t.mO.l_list.groups[i];
                for(var k in gr.companyItems){
                    var co = gr.companyItems[k];
                    for(var t in co.topLevelItems){
                        var titem = co.topLevelItems[t];
                        if(titem['topLevelId'] == id){
                            return titem;
                        }
                    }
                }
            }
        }else if(side == 'right'){
            for(var i in _t.mO.r_list.companyItems){
                var co = _t.mO.r_list.companyItems[i];
                for(var t in co.topLevelItems){
                    var titem = co.topLevelItems[t];
                    if(titem['topLevelId'] == id){
                        return titem;
                    }
                }
            }
        }
        return false;
    };

    AccessGroup.prototype.getMoCompany = function(id, side){
        var _t = this;
        if(!_t.mO){
            return false;
        }
        if(side == 'left'){
            for(var i in _t.mO.l_list.groups){
                var gr = _t.mO.l_list.groups[i];
                for(var k in gr.companyItems){
                    var co = gr.companyItems[k];
                    if(co['companyId'] == id){
                        return co;
                    }
                }
            }
        }else if(side == 'right'){
            for(var i in _t.mO.r_list.companyItems){
                var co = _t.mO.r_list.companyItems[i];
                if(co['companyId'] == id){
                    return co;
                }
            }
        }
        return false;
    };

    AccessGroup.prototype.getMoGroup = function(id, side){
        var _t = this;
        if(!_t.mO){
            return false;
        }
        if(side == 'left'){
            for(var i in _t.mO.l_list.groups){
                var gr = _t.mO.l_list.groups[i];
                if(gr['groupId'] == id){
                    return gr;
                }
            }
        }else if(side == 'right'){
            return false;
        }
        return false;
    };


    AccessGroup.prototype.setHandlers = function(){
        var _t = this;

        _t.wrapper.find('#ag-new-group-color').colorpicker();
        _t.wrapper.find('input.ag-group-modify-color').colorpicker().off('changeColor').on('changeColor', function(e){
            e = e || window.event;
            var wrap = $(this).parents('.ag-group-wrapper');
            var color = wrap.find('.ag-group-color');
            var val = e.color.toHex();
            color.css('backgroundColor',val);
        });



        _t.wrapper.find('.ag-group-toggler, .ag-company-toggler, .ag-topLevel-toggler').off('click').on('click', function(){

            var side = ($(this).parents('.ag-l-wrapper').length > 0)? 'left': 'right';
            var grpWrap = ($(this).parents('.ag-topLevel-wrapper').length > 0)? $(this).parents('.ag-topLevel-wrapper') : ($(this).parents('.ag-company-wrapper').length > 0)? $(this).parents('.ag-company-wrapper') : $(this).parents('.ag-group-wrapper');
            var id = grpWrap.data('id');

            var moItem = ($(this).parents('.ag-topLevel-wrapper').length > 0)? _t.getMoTopLevel(id, side) : ($(this).parents('.ag-company-wrapper').length > 0)? _t.getMoCompany(id, side) : _t.getMoGroup(id, side);

            if(grpWrap.hasClass('emptyGroup')){
                toastr['info']('Группа пуста');
                return false;
            }

            if(grpWrap.hasClass('opened')){
                grpWrap.removeClass('opened');
                $(this).removeClass('opened');
                moItem.opened = '';
            }else{
                grpWrap.addClass('opened');
                $(this).addClass('opened');
                moItem.opened = 'opened';
            }

        });

        _t.wrapper.find('.ag-add-group-wrapper').off('click').on('click', function(e){
            e = e || window.event;
            var wrap = $(this);

            if($(this).hasClass('opened')){
                if($(e.target).hasClass('ag-add-group-cancel') || $(e.target).parents('.ag-add-group-cancel').length > 0){
                    $(this).removeClass('opened');
                }else if($(e.target).hasClass('ag-add-group-confirm') || $(e.target).parents('.ag-add-group-confirm').length > 0){
                    _t.addGroup(wrap, function(){
                        _t.reRender();
                        wrap.removeClass('opened');
                    });
                }
            }else{
                $(this).addClass('opened');
            }
        });

        _t.wrapper.find('.ag-group-remove').off('click').on('click', function(){
            var id = $(this).data('id');
            var name = $(this).parents('.ag-group-wrapper').find('.ag-group-title').text();
            bootbox.dialog({
                title: 'Вы уверены?',
                message: 'Удалить группу доступов "'+ name + '"',
                buttons: {
                    success: {
                        label:'Удалить',
                        callback: function(){
                            _t.removeGroup(id, function(){

                            });
                        }
                    },
                    error: {
                        label:'Отмена',
                        callback: function(){

                        }
                    }
                }
            })

        });

        _t.wrapper.find('.ag-group-wrapper').off('click').on('click', function(e){

            if($(e.target).hasClass('ag-group-selected') || $(e.target).hasClass('ag-group-select')){
                if($(this).hasClass('selected')){
                    $(this).removeClass('selected');
                }else{
                    $(this).addClass('selected');
                }
            }

        });

        _t.wrapper.find('.ag-group-modify').off('click').on('click', function(){
            var wrap = $(this).parents('.ag-group-wrapper');
            if(!wrap.hasClass('ag-inModify')){
                wrap.addClass('ag-inModify');
            }
        });

        _t.wrapper.find('.ag-group-modify-confirm').off('click').on('click', function(){
            var wrap = $(this).parents('.ag-group-wrapper');
            var color = wrap.find('input.ag-group-modify-color').val();
            var title = wrap.find('input.ag-group-modify-title').val();
            var grp = _t.getMoGroup(wrap.data('id'), 'left');

            color = (color.length == 7)? color : grp.groupColor;
            title = (title.length > 0)? title : grp.groupTitle;

            _t.modifyGroup(wrap.data('id'), color, title, function(){
                if(wrap.hasClass('ag-inModify')){
                    wrap.removeClass('ag-inModify');
                }
            });


        });

        _t.wrapper.find('.ag-group-modify-cancel').off('click').on('click', function(){
            var wrap = $(this).parents('.ag-group-wrapper');
            var color = wrap.find('input.ag-group-modify-color');
            var title = wrap.find('input.ag-group-modify-title');
            var colorPlate = wrap.find('.ag-group-color');
            var grp = _t.getMoGroup(wrap.data('id'), 'left');

            color.val(grp.groupColor);
            title.val(grp.groupTitle);
            colorPlate.css('backgroundColor',grp.groupColor);

            if(wrap.hasClass('ag-inModify')){
                wrap.removeClass('ag-inModify');
            }
        });

        _t.wrapper.find('.ag-r-wrapper .ag-lowLevel-wrapper').off('click').on('click', function(){
            var ll_id = $(this).data('id');
            var tl_id = $(this).parents('.ag-topLevel-wrapper').data('id');

            _t.addAccess({
                tl_id: tl_id,
                ll_id: ll_id
            }, function(){
                _t.reRender();
            });
        });

        _t.wrapper.find('.ag-l-wrapper .ag-lowLevel-wrapper').off('click').on('click', function(){
            var ll_id = ($(this).data('id') == 'all')? '0': $(this).data('id');
            var tl_id = $(this).parents('.ag-topLevel-wrapper').data('id');
            var grp_id = $(this).parents('.ag-group-wrapper').data('id');

            if($(this).data('id') != 'all' && $(this).parents('.ag-tl-all-allowed').length > 0){
                toastr['info']('Сначала отмените "Все доступны".');
                return false;
            }

            _t.removeAccess({
                tl_id: tl_id,
                ll_id: ll_id,
                grp_id: grp_id
            }, function(){
                _t.reRender();
            });
        });

        _t.wrapper.find('.ag-l-search, .ag-r-search').off('input').on('input', function(e){
            e = e || window.event;
            var wrap = ($(this).hasClass('ag-l-search'))? _t.wrapper.find('.ag-l-wrapper') : _t.wrapper.find('.ag-r-wrapper');
            var val = $(this).val();
            var titles = wrap.find('.ag-group-title, .ag-company-title, .ag-topLevel-title, .ag-lowLevel-title');
            var warppers = wrap.find('.ag-group-wrapper, .ag-company-wrapper, .ag-topLevel-wrapper, .ag-lowLevel-wrapper');

            warppers.removeClass('searchHidden');
            warppers.removeClass('searchVisible');

            for(var i=0; i<titles.length; i++){
                var ttl = titles.eq(i);
                var className = ttl.attr('class');
                var key = '';
                if(className.indexOf('group') >= 0){
                    key = 'group';
                }else if(className.indexOf('company') >= 0){
                    key = 'company';
                }else if(className.indexOf('topLevel') >= 0){
                    key = 'topLevel';
                }else if(className.indexOf('lowLevel') >= 0){
                    key = 'lowLevel';
                }else{
                    return;
                }

                if(ttl.text().toLowerCase().indexOf(val.toLowerCase()) == -1){// && ttl.attr('class').indexOf('lowLevel') == -1
                    ttl.parents('.ag-'+key+'-wrapper').eq(0).not('.hiddenNode').addClass('searchHidden');
                }else{
                    ttl.parents('.ag-'+key+'-wrapper').eq(0).not('.hiddenNode').addClass('searchVisible');
                }
            }

            for(var k=0; k<warppers.length; k++){
                var wrapper = warppers.eq(k);
                if(wrapper.attr('class').indexOf('lowLevel') >= 0 && wrapper.hasClass('searchVisible')){
                    wrapper.removeClass('searchHidden');
                }else{
                    if(wrapper.find('.searchVisible').length > 0){
                        wrapper.removeClass('searchHidden');
                    }
                }
            }

//            wrap.find('.ag-topLevel-wrapper.searchVisible .ag-lowLevel-wrapper').removeClass('searchHidden');
//            for(var j=0; j< wrap.find('.searchVisible .searchHidden').length; j++){
//                var hnode = wrap.find('.searchVisible .searchHidden').eq(j);
//                if(!hnode.hasClass('hiddenNode')){
//                    hnode.removeClass('searchHidden');
//                }
//            }

            wrap.find('.searchVisible .searchHidden').removeClass('searchHidden');

        });





        _t.map_inst.container.off('addToSelection').on('addToSelection', function(){
            if(_t.wrapper.find('.ag-group-wrapper.selected').length == 0){
                toastr['info']('Выберите группы, которые будут иметь доступ к выделенным местам.');
                _t.map_inst.clearSelection();
                _t.map_inst.reLoad();
            }else{
                _t.addAccessPlaces();
            }
        });

        $('.content-sidebar-upper-buttons-wrapper').off('dblclick').on('dblclick', function(){
            console.log(_t);
        });
    };

    AccessGroup.prototype.reRender = function(){
        var _t = this;

        var selGroupIds = [];
        for(var i=0; i<_t.wrapper.find('.ag-group-wrapper.selected').length; i++){
            var grp = _t.wrapper.find('.ag-group-wrapper.selected').eq(i);
            var id = grp.data('id');
            selGroupIds.push(id);
        }
        _t.getScrolls();
        _t.createMObj();
        _t.render();
        _t.setHandlers();

        for(var k=0; k< selGroupIds.length; k++){
            var kid = selGroupIds[k];
            _t.wrapper.find('.ag-group-wrapper[data-id='+kid+']').addClass('selected');
        }
        _t.setScrolls();
    };

    AccessGroup.prototype.getScrolls = function(){
        var _t = this;
        _t.r_scroll_top = _t.wrapper.find('.ag-r-wrapper').scrollTop();
        _t.l_scroll_top = _t.wrapper.find('.ag-l-wrapper').scrollTop();
    };

    AccessGroup.prototype.setScrolls = function(){
        var _t = this;
        _t.wrapper.find('.ag-l-wrapper').scrollTop(_t.l_scroll_top);
        _t.wrapper.find('.ag-r-wrapper').scrollTop(_t.r_scroll_top);
    };

    AccessGroup.prototype.init = function(cb){
        var _t = this;
        MB.Core.spinner.start(_t.wrapper.find('.form-with-map-big-sidebar-wrapper'));

            _t.getCompanies(function(){
                _t.getGroups(function(){
                    _t.getPlacesAccess(function(){
                        _t.createClientPlacesAccess();
                    });
                    _t.getAccess(function(){
                        _t.getData(function(){
                            _t.getInnerData(function(){
                                _t.createMObj(function(){
                                    _t.render();
                                    _t.setHandlers();
                                    MB.Core.spinner.stop(_t.wrapper.find('.form-with-map-big-sidebar-wrapper'));
                                    cb(_t);
                                });
                            });
                        });
                    });
                });
            });
    };

}());

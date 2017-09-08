(function () {

	var formID = MB.Forms.justLoadedId;
	var formInstance = MB.Forms.getForm('form_ext_quota', formID);
	var modalInstance = MB.Core.modalWindows.windows.getWindow(formID);
	var formWrapper = $('#mw-' + formInstance.id);
	var tableID = formWrapper.find('.classicTableWrap').attr('data-id');
	var tableInstance = MB.Tables.getTable(tableID);
    var il = MB.Core.fileLoader;
	var tableWrapper = $('.classicTableWrap-' + tableInstance.id);
    var totalPrice = 0;
    formInstance.lowerButtons = [
        {
            title: 'Загрузить файл квоты',
            color: "green",
            icon: null,
            type: "SINGLE",
            hidden: false,
            condition: true,
            handler: function() {
                il.start({
                    success: function (fileUID) {
                        var tmpObj = {
                            data: fileUID.base64Data,
                            name: fileUID.name,
                            id: fileUID.uid
                        };

                        $.ajax({
                            url: 'upload/' + fileUID.name,
                            dataType: 'text',
                            success: function (quota, status, xhr) {
                                var parsedQuota_work = {
                                    list:[]
                                };
                                var parsedQuota = xmlToJSON.parseString(quota,
                                    {
                                        /*grokAttr: false,*/
                                        mergeCDATA:false,
                                        xmlns:false,
                                        grokText: false,
                                        childrenAsArray:false
                                    }
                                );
                                console.log('parsedQuota',parsedQuota);


                                for(var i in parsedQuota){
                                    var node0 = parsedQuota[i];

                                    for(var k in node0){
                                        var node1 = node0[k];
                                        var jIdx = 0;
                                        for(var j in node1){
                                            var node2 = node1[j];
                                            if(typeof node2 !== 'function'){
                                                parsedQuota_work.list.push({});
                                                for(var l in node2){
                                                    var ticketField = node2[l];
                                                    if(l !== '_text'){
                                                        parsedQuota_work.list[jIdx][l] = ticketField['_text'];//.replace(/"/ig,'\\"');
                                                    }
                                                }
                                                jIdx++;
                                            }
                                        }
                                    }
                                }
                                console.log('parsedQuota_work',parsedQuota_work);

                                function tryReload(idx, ext_quota_operation_id) {
                                    var totalTickets = parsedQuota_work.list.length;
//                                    console.log(idx, totalTickets);
                                    if (idx == totalTickets - 1) {
                                        socketQuery({
                                            command: 'operation',
                                            object: 'check_ext_quota_operation',
                                            params: {
                                                ext_quota_operation_id: ext_quota_operation_id
                                            }
                                        }, function (r) {
                                            socketParse(r);
                                            formInstance.reload();
                                        });
                                    }
                                }

                                var o = {
                                    command: 'new',
                                    object: 'ext_quota_operation',
                                    params: {
                                        ext_quota_id: formInstance.activeId,
                                        quota_operation_type: 'RECEIVE_QUOTA', // RECEIVE_QUOTA^RETURN_QUOTA^CLOSE_QUOTA
                                        file_name: tmpObj.name,
                                        places_in_file: parsedQuota_work.list.length
                                    }
                                };

                                socketQuery(o, function (res) {
                                    res = socketParse(res, false);
                                    if (res) {
                                        var ext_quota_operation_id = res.id;
                                        var index = 0;

                                        for (var i in parsedQuota_work.list) {
                                            var ticket = parsedQuota_work.list[i];
                                            var o = {
                                                command: 'new',
                                                object: 'ext_quota_operation_place',
                                                ext_quota_operation_id: ext_quota_operation_id,
                                                params: {}
                                            };
                                            for (var k in ticket) {
                                                var tk = ticket[k];
                                                o.params[k] = tk;
                                                if(k == 'price'){
                                                    totalPrice += parseInt(tk);
                                                }
                                            }

                                            console.log(o.params.action_name);
//                                            console.log(o.params.action_name);
//                                            console.log(o.params.object_name);

//                                            o.params.action_name = 'name';
//                                            o.params.object_name = 'name';

                                            socketQuery(o, function () {
                                                tryReload(index, ext_quota_operation_id);
                                                index++;
                                            });
                                        }
                                        console.log('totalPrice', totalPrice);
                                    }
                                });
                            },
                            error: function () {

                            }
                        });
                    }
                });
            }
        }
    ];

}());



(function(){

    var quota = {
        header: {
            action_id: 1184,
            action_name: 'Кубок Дэвиса 2014 Россия-Португалия 12.9',
            action_begin: '2014-09-12 16:00:00',
            object_code: 185,
            object_name: 'ЗАО "Кубок Кремля"'
        },
        sectors: [
            {
                sector: 'Сектор A12',
                sector_id: 12,
                row: 17,
                place: 1,
                barcode: 2017898153063877012990,
                order_id: '313',
                price: '300.00'
            },
            {
                sector: 'Сектор A12',
                sector_id: 12,
                row: 17,
                place: 2,
                barcode: 2017898153063877012991,
                order_id: '313',
                price: '300.00'
            },
            {
                sector: 'Сектор A12',
                sector_id: 12,
                row: 17,
                place: 3,
                barcode: 2017898153063877012992,
                order_id: '313',
                price: '300.00'
            }
        ]
    };

    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_get_quota', formID);
    var formWrapper = $('#mw-' + formInstance.id);
    var modalInstance = MB.Core.modalWindows.windows.getWindow(formID);
    var il = MB.Core.fileLoader;
    var uplFileZone = formWrapper.find('.uploadHere');
    var uploadedWrapper = formWrapper.find('.uploadedQuota-wrapper');

    var filesCount = 0;

    var companies = [];
    socketQuery({
        command: 'get',
        object: 'organizer'
    }, function(res){
        res = socketParse(res);

        for(var i in res){
            var org = res[i];
            companies.push({
                id: org['ORGANIZER_ID'],
                name: org['NAME'],
                selected: false
            });
        }

        uplFileZone[0].ondragover = function() {
            uplFileZone.addClass('hover');
            return false;
        };

        uplFileZone[0].ondragleave = function() {
            uplFileZone.removeClass('hover');
            return false;
        };

        uplFileZone[0].ondrop = function(event) {
            event.preventDefault();
            uplFileZone.removeClass('hover');
            uplFileZone.addClass('drop');
            var successCount = 0;

            var files = event.dataTransfer.files;

            for(var i in files){
                var f = files[i];
                if(typeof f == 'object'){
                    il.filelist.push(f);
                    filesCount++;
                }
            }
            il.send();
            il.success = function(fileUID){
                successCount++;
                quotaFiles.model.files.push(fileUID);

                console.log('counters', filesCount, successCount);
                if(filesCount == successCount){
                    quotaFiles.render();
                    filesCount = 0;
                }
            };
        };

        var quotaFiles = {
            model: {
                files: []
            },
            collapseZone: function(cb){
                uplFileZone.animate({
                    width: 30 + '%'
                }, 350, function(){
                    if(typeof cb == 'function'){
                        cb();
                    }
                });
                uploadedWrapper.animate({
                    width: 70 + '%'
                }, 350);
            },
            expandZone: function(cb){
                uplFileZone.animate({
                    width: 100 + '%'
                }, 350, function(){
                    if(typeof cb == 'function'){
                        cb();
                    }
                });
                uploadedWrapper.animate({
                    width: 0
                }, 350);
            },
            render: function(){

                var tpl = '<table class="quota-files">' +
                            '<thead>' +
                                '<tr>' +
                                    '<th>Компания</th>' +
                                    '<th>Квота</th>' +
                                '</tr>' +
                            '</thead>' +
                            '<tboby>' +
                                '{{#files}}' +
                                    '<tr>' +
                                        '<td><select class="company-select select3"></select></td>' +
                                        '<td>{{name}}</td>' +
                                    '</tr>' +
                                '{{/files}}' +
                            '</tboby>' +
                          '</table>';

                quotaFiles.collapseZone(function(){
                    uploadedWrapper.html(Mustache.to_html(tpl, quotaFiles.model));


                    uploadedWrapper.find('.company-select').each(function(idx, elem){

                        for(var i in companies){
                            $(elem).append('<option value="'+companies[i].id+'">'+companies[i].name+'</option>');
                        }
                        var selInst = $(elem).select3();

                        $(selInst).off('changeVal').on('changeVal', function(e, was, now){
//                            for(var i in companies){
//                                var com = companies[i];
//                                com.selected = false;
//                                if(com.id == now.id){
//                                    com.selected = true;
//                                }
//                            }
                            console.log(companies);
                        });
                    });
                });
            },
            getCompanies: function(cb){

                if(typeof cb == 'function'){
                    cb();
                }
            },
            setHandlers: function(){

            }
        };
    });

}());

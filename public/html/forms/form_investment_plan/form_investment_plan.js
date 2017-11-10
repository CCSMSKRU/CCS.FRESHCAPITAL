(function () {

    var formID = MB.Forms.justLoadedId;
    var formInstance = MB.Forms.getForm('form_investment_plan', formID);
    var formWrapper = $('#mw-' + formInstance.id);

    var modalInstance = MB.Core.modalWindows.windows.getWindow(formID);
    modalInstance.stick = 'top';
    modalInstance.stickModal();


    var ip = {

        plan: {},

        init: function(){

            ip.getPlan(function(){

                ip.populate();
                ip.setHandlers();

            });

        },

        getPlan: function(cb){
            var status = formInstance.data.data[0].status_sysname;
            //console.log('STATUS',status);
            var command = (status == 'ACTIVE')? 'getActive' : 'getArchive';
            var o = {
                command: command,
                object: 'investment_plan',
                params:{
                    id:formInstance.activeId
                }
            };

            socketQuery(o, function(r){

                if(r.code){return;}

                ip.plan = r.plan;

                if(typeof cb == 'function'){
                    cb();
                }


            });
        },

        populate: function(){

            console.log(ip.plan);

            for(var i in ip.plan.investors){

                ip.plan.investors[i].used_percent = (100 - (ip.plan.investors[i].available_amount / ip.plan.investors[i].total_amount * 100)).toFixed(2);
                ip.plan.investors[i].enough_class = (ip.plan.investors[i].available_amount == 0)? 'enough' : '';
                ip.plan.investors[i].not_active = (ip.plan.investors[i].status_sysname == 'NOT_ACTIVE')? 'not_active' : '';


            }
            for(var k in ip.plan.plan_financings){

                var pf = ip.plan.plan_financings[k];

                pf.commited_class = (pf.commited)? 'commited' : '';
                pf.enough_class = (pf.need_invested_amount == 0)? 'enough' : '';

                for(var j in pf.investments){

                    pf.investments[j].in_fin_percent = (pf.investments[j].amount / pf.founding_amount * 100).toFixed(2);
                    pf.investments[j].mgm_fee = pf.investments[j].mgm_fee || 40;
                    pf.investments[j].disabled = (pf.commited)? 'disabled' : '';
                    pf.investments[j].not_active = (pf.investments[j].investor_status_sysname == 'NOT_ACTIVE')? 'disabled' : '';
                }

            }

            var tpl = '<table class="investmet-plan-table">' +
                        '<thead></thead>' +
                        '<tbody>' +
                            '<tr class="ci-p-table-investors">' +
                                '<td class="i-p-table-empty">&nbsp;</td>' +
                                '{{#investors}}' +
                                    '<td class="i-p-table-investor {{enough_class}} {{not_active}}" data-id="{{id}}">'+
                                        '<div class="ipt-i-name">{{name}}</div>'+
                                        '<div class="ipt-i-total-holder">Всего: <span class="ipt-i-total">{{total_amount}}</span> руб.</div>'+
                                        '<div class="ipt-i-avail-holder">Доступно: <span class="ipt-i-avail">{{available_amount}}</span> руб.</div>'+
                                        '<div class="ipt-i-percent-holder">Использовано: <span class="ipt-i-percent">{{used_percent}}</span>%</div>'+
                                        '<div class="ipt-i-send-report-holder"><div class="ipt-i-send-report"  data-id="{{id}}"><i class="fa fa-envelope-o"></i>&nbsp;&nbsp;Отправить отчет</div></div>'+
                                        '<div class="ipt-i-get-cert-holder"><div class="ipt-i-get-cert"  data-id="{{id}}"><i class="fa fa-file-o"></i>&nbsp;&nbsp;Сертификат</div></div>'+
                                    '</td>'+
                                '{{/investors}}' +
                            '</tr>' +
                            '{{#plan_financings}}'+
                                '<tr class="i-p-table-merchant-row {{commited_class}} {{enough_class}}" data-id="{{merchant_financing_id}}"  data-nativeid="{{id}}">' +

                                    '<td class="i-p-table-merchant" >'+
                                        '<div class="ipt-m-name">{{merchant}}</div>'+
                                        '<div class="ipt-m-total-holder">Всего: <span class="ipt-m-total">{{founding_amount}}</span> руб.</div>'+
                                        '<div class="ipt-m-requi-holder">Еще нужно: <span class="ipt-m-requi">{{need_invested_amount}}</span> руб.</div>'+
                                        '<div class="ipt-m-commited-label">Подтвержден<br/>{{commited_date}}</div>' +
                                        '<div class="ipt-m-commit" data-id="{{id}}"><i class="fa fa-check"></i>&nbsp;Подтвердить</div>'+
                                    '</td>'+
                                    '{{#investments}}'+
                                        '<td data-mfid="{{merchant_financing_id}}" data-iid="{{investor_id}}">'+
                                            '<div class="i-p-inv-in-fin-percent-holder">Участие: <span class="i-p-inv-in-fin-percent">{{in_fin_percent}}</span>%</div>' +
                                            '<div class="i-p-inv-in-mgm-fee-holder">MGM Fee: <span class="i-p-inv-mgm-fee-percent" data-mfid="{{merchant_financing_id}}" data-iid="{{investor_id}}">{{mgm_fee}}</span>%</div>' +
                                            '<input {{disabled}} {{not_active}} data-prev="{{amount}}" data-mfid="{{merchant_financing_id}}" data-iid="{{investor_id}}" ' +
                                                    'type="number" class="i-p-table-input" data-amount="{{amount}}" value="{{amount}}" min="0" step="10000"/>'+
                                        '</td>'+
                                    '{{/investments}}'+
                                '</tr>' +
                            '{{/plan_financings}}'+
                        '</tbody>' +
                    '</table>';


            formWrapper.find('.ipt-holder').html(Mustache.to_html(tpl, ip.plan));

//            formWrapper.find('.ipt-total, ipt-i-avail, .ipt-m-total, .ipt-m-requi').each(function(i,e){
//
//                $(e).html($(e).html().replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 '));
//
//            });

        },

        setHandlers: function(){

            var table_elem = formWrapper.find('.investmet-plan-table').eq(0);

            formWrapper.find('.i-p-table-input').off('input').on('input', function(e){

                formWrapper.find('.mw-save-form').removeClass('disabled');

                var self = $(this);

                if(self.val().toString().length == 0) {self.val(0);}

                var tr = self.parents('tr').eq(0);
                var td = self.parents('td').eq(0);

                var row_idx = tr.index();
                var col_idx = td.index();

                var inv = table_elem.find('.i-p-table-investor').eq(col_idx - 1);
                var mer = table_elem.find('.i-p-table-merchant-row').eq(row_idx - 1).find('.i-p-table-merchant');

                var i_total = inv.find('.ipt-i-total');
                var i_avail = inv.find('.ipt-i-avail');

                var m_total = mer.find('.ipt-m-total');
                var m_requi = mer.find('.ipt-m-requi');

                var i_total_val = parseInt(i_total.html());
                var i_avail_val = parseInt(i_avail.html());

                var m_total_val = parseInt(m_total.html());
                var m_requi_val = parseInt(m_requi.html());

                var v = self.val();

                var row_values = [];
                var col_values = [];

                for(var i = 0; i < tr.find('.i-p-table-input').length; i++){
                    var r_item = tr.find('.i-p-table-input').eq(i);
                    row_values.push(parseInt(r_item.val()));
                }

                for(var k = 0; k < table_elem.find('tr.i-p-table-merchant-row').length; k++){



                    var tr_item = table_elem.find('tr.i-p-table-merchant-row').eq(k);

                    if(!tr_item.hasClass('commited')){
                        col_values.push(parseInt(tr_item.find('td').eq(col_idx).find('.i-p-table-input').val()));
                    }


                }

                var i_dec_summ = 0;
                var m_dec_summ = 0;

                for(var i2 in row_values){
                    m_dec_summ += row_values[i2];
                }

                for(var k2 in col_values){
                    i_dec_summ += col_values[k2];
                }

                if((i_total_val - i_dec_summ) < 0 || (m_total_val - m_dec_summ) < 0 ){

                    $(self).val($(self).attr('data-prev'));

                    return false;

                }


                var i_avail_insert = (i_total_val - i_dec_summ).toString().replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');
                var m_requi_insert = (m_total_val - m_dec_summ).toString().replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');

                i_avail.html(i_avail_insert);
                m_requi.html(m_requi_insert);

                td.find('.i-p-inv-in-fin-percent').html((v/m_total_val*100).toFixed(2));

                inv.find('.ipt-i-percent').html((100-((i_total_val - i_dec_summ) / i_total_val * 100)).toFixed(2));

                if(+i_avail_insert == 0){
                    inv.addClass('enough');
                }else{
                    inv.removeClass('enough');
                }

                if(+m_requi_insert == 0){
                    tr.addClass('enough');
                }else{
                    tr.removeClass('enough');
                }



                $(self).attr('data-prev', self.val());



            });

            formWrapper.find('.mw-save-form').off('click').on('click', function(){

                if($(this).hasClass('disabled')){return;}

                ip.save(function(){
                    formInstance.reload();
                });

            });

            formWrapper.find('.ip-commit').off('click').on('click', function(){

                if($(this).hasClass('disabled')){return;}

                ip.commit(function(){
                    formInstance.reload();
                });
            });

            formWrapper.find('.ipt-m-commit').off('click').on('click', function(){

                if($(this).hasClass('disabled')){return;}

                var id = $(this).data('id');

                var name = $(this).parents('.i-p-table-merchant').find('.ipt-m-name').html();

                bootbox.dialog({
                    title: 'Внимание',
                    message: 'Вы уверены что хотите подтвердить финансирование для '+name+'?' +
                    '<br>Вы можете указать какой датой провести операцию в формате DD.MM.YYYY (Напимер 01.12.2016).' +
                    '<br> Если ничего не указать, будет сегодняшнее число.' +
                    '<br><input id="operation_date" type="text" value=""/>',
                    buttons: {
                        success: {
                            label: 'Подтвердить',
                            callback: function(){
                                var operation_date = $('#operation_date').val();
                                ip.commitMerchant({id:id, operation_date:operation_date}, function(){
                                    formInstance.reload();
                                });
                            }
                        },
                        error: {
                            label: 'Отмена',
                            callback: function(){
                            }
                        }
                    }

                });


            });

            formWrapper.find('.ipt-i-send-report').off('click').on('click', function(){

                var o = {
                    command:'reportDeployment',
                    object:'investor',
                    params:{
                        id: $(this).attr('data-id')
                    }
                };

                socketQuery(o, function(res){

                    if(!res.code){
                        var fileName = res.path + res.filename;
                        var linkName = 'my_download_link' + MB.Core.guid();

                        var nameRu = res.name_ru || res.filename;

                        $("body").prepend('<a id="'+linkName+'" href="' + res.path + res.filename +'" download="'+ nameRu +'" style="display:none;"></a>');
                        var jqElem = $('#'+linkName);
                        jqElem[0].click();
                        jqElem.remove();
                    }

                });

            });

            formWrapper.find('.i-p-inv-mgm-fee-percent').off('click').on('click', function(){

                var self = this;
                var currVal = +$(this).html();
                var id =


                bootbox.dialog({
                    title: 'Укажите процет managment fee',
                    message: '<div class="row"><div class="col-md-6"><input type="number" class="form-control" id="mgm-fee-percent" value="'+currVal+'"/></div><div class="col-md-6 percent-in-modal">%</div></div>',
                    buttons: {
                        success: {
                            label: 'Подтвердить',
                            callback: function(){

                                var val = $('#mgm-fee-percent').val();

                                $(self).html(val);

                                formWrapper.find('.mw-save-form').removeClass('disabled');
                            }
                        },
                        error: {
                            label: 'Отмена',
                            callback: function(){

                            }
                        }
                    }
                });

            });

            formWrapper.find('.ipt-i-get-cert').off('click').on('click', function(){

                var todayDate = moment().format('DD.MM.YYYY');

                var html = '<div class="row">' +
                    '<div class="col-md-12">' +
                    '<div class="form-group">' +
                    '<label>Укажите дату сертификата:</label>' +
                    '<input type="text" id="cert-date-input" class="form-control" value="'+todayDate+'" />' +
                    '</div>' +
                    '</div>' +
                    '</div>';

                var id = $(this).attr('data-id');

                bootbox.dialog({
                    title: 'Скачать сертификат',
                    message: html,
                    buttons: {
                        success: {
                            label: 'Скачать',
                            callback: function(){

                                var p_date = $('#cert-date-input').val();

                                var o = {
                                    command:'certificate',
                                    object:'investor',
                                    params:{
                                        id: id,
                                        report_date: p_date
                                    }
                                };


                                socketQuery(o, function(res){

                                    if(!res.code){
                                        var fileName = res.path + res.filename;
                                        var linkName = 'my_download_link' + MB.Core.guid();

                                        var nameRu = res.name_ru || res.filename;

                                        $("body").prepend('<a id="'+linkName+'" href="' + res.path + res.filename +'" download="'+ nameRu +'" style="display:none;"></a>');
                                        var jqElem = $('#'+linkName);
                                        jqElem[0].click();
                                        jqElem.remove();


                                    }

                                });
                            }
                        },
                        error: {
                            label: 'Отмена',
                            callback: function(){

                            }
                        }
                    }

                });

                $('#cert-date-input').datepicker({
                    language: 'ru',
                    format: 'dd.mm.yyyy',
                    autoclose: true,
                    todayBtn: 'linked'
                });

            });

        },

        save: function(cb){



            var rows = formWrapper.find('.i-p-table-merchant-row');

            var so = {
                id: formInstance.activeId,
                plan_changes: {}
            };

            for(var i = 0; i < rows.length; i++){
                var r = rows.eq(i);
                var inputs = r.find('.i-p-table-input');

                var arr = [];

                for(var k = 0; k < inputs.length; k++){

                    var inp = inputs.eq(k);
                    var mgm_fee = +inp.parents('td').eq(0).find('.i-p-inv-mgm-fee-percent').html();


                    arr.push({
                        fin_id: r.attr('data-id'),
                        inv_id: inp.attr('data-iid'),
                        amount: +inp.attr('data-amount'),
                        new_amount: +inp.val(),
                        mgm_fee: mgm_fee
                    });
                }
                
                so.plan_changes[r.attr('data-id')] = arr;
            }

            console.log('SAVE', so);

            var o = {
                command: 'save',
                object: 'investment_plan',
                params: so
            };

            socketQuery(o, function(r){

                if(r.code){return;}

                if(typeof cb == 'function'){
                    cb();
                }

            });

        },

        commit: function(cb){


            bootbox.dialog({
                title: 'Внимание',
                message: 'Вы уверены что хотите подтвердить весь план финансирования?',
                buttons: {
                    success: {
                        label: 'Подтвердить',
                        callback: function(){
                            var o = {
                                command: 'commit',
                                object: 'investment_plan',
                                params: {
                                    id: formInstance.activeId
                                }
                            };

                            socketQuery(o, function(r){

                                if(r.code){return;}

                                if(r.errors){
                                    for(var i in r.errors){

                                        toastr['error'](r.errors[i]['message']);

                                    }
                                }


                                if(typeof cb == 'function'){
                                    cb();
                                }

                            });
                        }
                    },
                    error: {
                        label: 'Отмена',
                        callback: function(){
                        }
                    }
                }

            });




        },

        commitMerchant: function(params, cb){

            var id = params.id;
            var operation_date = params.operation_date;
            var r = formWrapper.find('.i-p-table-merchant-row[data-nativeid="'+id+'"]');

            var so = {
                id: id,
                operation_date:operation_date
            };


            var o = {
                command: 'commit',
                object: 'investment_plan_merchant',
                params: so
            };

            socketQuery(o, function(r){

                if(r.code){return;}

                if(typeof cb == 'function'){
                    cb();
                }

            });


        }




    };


    ip.init();





}());



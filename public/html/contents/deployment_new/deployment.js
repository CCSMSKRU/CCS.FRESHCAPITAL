(function(){

    var contentID = MB.Contents.justAddedId;
    var contentInstance = MB.Contents.getItem(contentID);
    var contentWrapper = $('#mw-' + contentInstance.id);
    var modalInstance = MB.Core.modalWindows.windows.getWindow(contentID);
    modalInstance.stick = 'top';
    modalInstance.stickModal();


    var dpm = {
        merchants: [],
        investors: [],
        changes: [],
        wrapper: contentWrapper.find('#deployment_wrapper'),
        getData: function(){

        },
        render: function(){

            var tpl = '<div class="dpm-wrapper">' +
                            '<table>' +
                                '<thead>' +
                                    '<tr>' +
                                        '<th>&nbsp;</th>' +
                                        '{{#investors}}' +
                                            '<th data-id="{{id}}">' +
                                                '<div class="dpm-i-name">{{name}}</div>' +
                                                '<div class="dpm-i-amount-wrapper">' +
                                                    '<div class="pr50 dpm-i-total" data-id="{{id}}">{{total}}</div>' +
                                                    '<div class="pr50 dpm-i-available" data-id="{{id}}">{{available}}</div>' +
                                                '</div>' +
                                            '</th>' +
                                        '{{/investors}}' +
                                    '</tr>' +
                                '</thead>' +
                                '<tbody>' +
                                '{{#merchants}}' +
                                    '<tr data-id="{{id}}">' +
                                        '<td>' +
                                            '<div class="dpm-merchant-name">({{id}}) {{name}}</div>' +
                                            '<div class="dpm-merchant-amount">' +
                                                '<div class="dpm-merchant-deploy-bar">' +
                                                    '<div style="width: {{deploy_percent}}%;" class="dpm-merchant-deployed" data-id="{{id}}"></div>' +
                                                    '<div class="dpm-merchant-deployed-percent" data-id="{{id}}">{{deploy_percent}}%</div>' +
                                                '</div>' +
                                                '<span class="dpm-merchant-got" data-id="{{id}}">{{got}}</span> / <span class="dpm-merchant-need"  data-id="{{id}}">{{need}}</span>' +
                                            '</div>' +
                                        '</td>' +
                                        '{{#merch_investors}}' +
                                            '<td data-i-id="{{investor_id}}" data-m-id="{{merchant_id}}">' +
                                                '<div class="dpm-value-wrapper">' +
                                                    '<div class="dpm-value-recomended" data-m-id="{{merchant_id}}" data-i-id="{{investor_id}}" data-recomended="{{recomended}}">{{recomended}}&nbsp;&nbsp;<i class="fa fa-angle-down"></i></div>' +
                                                    '<input data-i-id="{{investor_id}}" data-m-id="{{merchant_id}}" type="number" value="{{value}}" />' +
                                                '</div>' +
                                            '</td>' +
                                        '{{/merch_investors}}' +
                                    '</tr>' +
                                '{{/merchants}}' +
                                '</tbody>' +
                            '</table>' +
                        '</div>';


            var mO = {
                investors: [
                    {
                        id: 1,
                        name: 'Николай Петрович',
                        total: 1000000,
                        available: 650000
                    },
                    {
                        id: 2,
                        name: 'Ольга Ивановна',
                        total: 6200000,
                        available: 111000
                    },
                    {
                        id: 3,
                        name: 'Михаил Олегович',
                        total: 300000,
                        available: 60000
                    }
                ],
                merchants: [
                    {
                        id: 1,
                        name: 'Pizza Hut',
                        need: 350000,
                        got: 0,
                        deploy_percent: 0,
                        merch_investors: [
                            {
                                investor_id: 1,
                                merchant_id: 1,
                                recomended: Math.ceil(350000 / 3),
                                value: 0
                            },
                            {
                                investor_id: 2,
                                merchant_id: 1,
                                recomended: Math.ceil(350000 / 3),
                                value: 0
                            },
                            {
                                investor_id: 3,
                                merchant_id: 1,
                                recomended: Math.ceil(350000 / 3),
                                value: 0
                            }
                        ]
                    },
                    {
                        id: 2,
                        name: 'Нантоехнологический институт полимеров',
                        need: 1200000,
                        got: 0,
                        deploy_percent: 0,
                        merch_investors: [
                            {
                                investor_id: 1,
                                merchant_id: 2,
                                recomended: Math.ceil(1200000 / 3),
                                value: 0
                            },
                            {
                                investor_id: 2,
                                merchant_id: 2,
                                recomended: Math.ceil(1200000 / 3),
                                value: 0
                            },
                            {
                                investor_id: 3,
                                merchant_id: 2,
                                recomended: Math.ceil(1200000 / 3),
                                value: 0
                            }
                        ]
                    },
                    {
                        id: 3,
                        name: 'Салон Красоты на Бронной',
                        need: 800000,
                        got: 0,
                        deploy_percent: 0,
                        merch_investors: [
                            {
                                investor_id: 1,
                                merchant_id: 3,
                                recomended: Math.ceil(800000 / 3),
                                value: 0
                            },
                            {
                                investor_id: 2,
                                merchant_id: 3,
                                recomended: Math.ceil(800000 / 3),
                                value: 0
                            },
                            {
                                investor_id: 3,
                                merchant_id: 3,
                                recomended: Math.ceil(800000 / 3),
                                value: 0
                            }
                        ]
                    }
                ]
            };
            dpm.data = mO;
            dpm.wrapper.html(Mustache.to_html(tpl,mO));
        },
        getInvestor: function(id){
            for(var i in dpm.data.investors){
                var item = dpm.data.investors[i];
                if(item.id == id){
                    return item;
                }
            }
            return false;
        },
        getMerchant: function(id){
            for(var i in dpm.data.merchants){
                var item = dpm.data.merchants[i];
                if(item.id == id){
                    return item;
                }
            }
            return false;
        },
        insertChange: function(obj){

            var found = false;

            for(var i in dpm.changes){
                var c = dpm.changes[i];
                if(c.i_id == obj.i_id && c.m_id == obj.m_id){
                    c.value = obj.value;
                    found = true;
                }
            }

            if(!found){
                dpm.changes.push(obj);
            }

            var i_avl = dpm.wrapper.find('.dpm-i-available[data-id="'+obj.i_id+'"]');
            var m_got = dpm.wrapper.find('.dpm-merchant-got[data-id="'+obj.m_id+'"]');
            var m_d_p = dpm.wrapper.find('.dpm-merchant-deployed[data-id="'+obj.m_id+'"]');
            var m_d_p_p = dpm.wrapper.find('.dpm-merchant-deployed-percent[data-id="'+obj.m_id+'"]');

            i_avl.html(parseFloat(dpm.getInvestor(obj.i_id).available) - parseFloat(obj.value));

            var m_got_value = 0;
            for(var k in dpm.changes){
                var ch = dpm.changes[k];
                if(ch.m_id == obj.m_id){
                    m_got_value += parseFloat(ch.value);
                }
            }

            m_got.html(m_got_value);

            var percent = m_got_value / parseFloat(dpm.getMerchant(obj.m_id).need)*100;

            m_d_p.css('width', percent + '%');
            m_d_p_p.html((percent.toFixed(1)) + '%  | ещё: ' + (parseFloat(dpm.getMerchant(obj.m_id).need) - m_got_value));

            if(percent == 0){
                m_d_p_p.css({
                    color: 'red',
                    borderColor: 'red'
                });
            }else if(percent > 0 && percent <= 20){
                m_d_p_p.css({
                    color: '#FCA564',
                    borderColor: '#FCA564'
                });
            }else if(percent > 20 && percent <= 70){
                m_d_p_p.css({
                    color: '#356ECC',
                    borderColor: '#356ECC'
                });
            }else if(percent > 70 && percent <= 99){
                m_d_p_p.css({
                    color: '#8E7DD5',
                    borderColor: '#8E7DD5'
                });
            }else{
                m_d_p_p.css({
                    color: 'green',
                    borderColor: 'green'
                });
            }


        },
        setHandlers: function(){

            dpm.wrapper.find('tbody td').off('mouseenter').on('mouseenter', function(){

                dpm.wrapper.find('.hovered').removeClass('hovered');

                var rowCell = $(this).parents('tr').eq(0).find('td').eq(0);
                var colCell = dpm.wrapper.find('thead th').eq($(this).index());

                rowCell.addClass('hovered');
                colCell.addClass('hovered');

            });

            dpm.wrapper.find('tbody td').off('click').on('click', function(){

                dpm.wrapper.find('.focused').removeClass('focused');

                var rowCell = $(this).parents('tr').eq(0).find('td').eq(0);
                var colCell = dpm.wrapper.find('thead th').eq($(this).index());

                rowCell.addClass('focused');
                colCell.addClass('focused');


            });

            dpm.wrapper.find('.dpm-value-wrapper input[type="number"]').off('input').on('input', function(){

                var i_id = $(this).attr('data-i-id');
                var m_id = $(this).attr('data-m-id');
                var val = $(this).val();

                if(val == ''){
                    $(this).val(0);
                    val = 0;
                }

                dpm.insertChange({
                    i_id: i_id,
                    m_id: m_id,
                    value: val
                });

            });

            dpm.wrapper.find('.dpm-value-recomended').off('click').on('click', function(){
                var cell = $(this).parents('td').eq(0);
                var inp = cell.find('input[type="number"]');
                inp.val(parseInt($(this).data('recomended')));
                inp.trigger('input');
            });
        }

    };

    dpm.render();
    dpm.setHandlers();

}());

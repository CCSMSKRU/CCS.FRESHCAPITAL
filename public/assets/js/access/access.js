(function(){
	var accessFile = '/assets/js/access.json';
	var accessObject = {
		items: [
			{
				name: 'sell_ticket',
				nameRu: 'Продажа билетов',
				menu: [
					{
						keyword: 'parent_casher',
						keywordRu: 'Кассовые операции',
						value: true
					},
					{
						keyword: 'menu_active_action',
						keywordRu: 'Репертуар',
						value: true
					}

				],
				data: [
					{
						keyword: 'action_access',
						keywordRu: 'Доступ к мероприятию',
						value: true,
					}
				],
				operations: [
					{
						keyword: 'to_pay_ticket',
						keywordRu: 'Оплата билета',
						value: true
					},
					{
						keyword: 'print_ticket',
						keywordRu: 'Печать билета',
						value: true
					}
				],
				
				methods: [
					{
						keyword: 'main_menu',
						keywordRu: 'какойто GET',
						value: {
							add: true,
							modify: true,
							remove: true,
						}
					},
					{
						keyword: 'action',
						keywordRu: 'еще один GET',
						value: {
							add: true,
							modify: true,
							remove: true,
						}
					}
				]
			},
			{
				name: 'sell_ticket',
				nameRu: 'Репертуар',
				menu: [
					{
						keyword: 'parent_casher',
						keywordRu: 'Кассовые операции',
						value: true
					},
					{
						keyword: 'menu_active_action',
						keywordRu: 'Репертуар',
						value: true
					}

				],
				data: [
					{
						keyword: 'action_access',
						keywordRu: 'Доступ к мероприятию',
						value: true,
					}
				],
				operations: [
					{
						keyword: 'to_pay_ticket',
						keywordRu: 'Оплата билета',
						value: true
					},
					{
						keyword: 'print_ticket',
						keywordRu: 'Печать билета',
						value: true
					}
				],
				
				methods: [
					{
						keyword: 'main_menu',
						keywordRu: 'какойто GET',
						value: {
							add: true,
							modify: true,
							remove: true,
						}
					},
					{
						keyword: 'action',
						keywordRu: 'еще один GET',
						value: {
							add: true,
							modify: true,
							remove: true,
						}
					}
				]
			}
		]		
	}

	var access = {
		template: '{{#items}}<div class="accessBlock">'+
						'<div class="padder5">'+
							'<div class="accessTitle">'+
								'<div class="boxForInput"><input type="checkbox" class="enableAccesBlock"></div>'+
								'<div class="boxForTitle">{{nameRu}}</div></div>'+
								'<div class="access_dd_toggler"><i class="fa fa-arrow-down"></i></div>'+
							'</div>'+
						'<div class="access_DD">'+
							'<div class="padder5">'+
								'<div class="tabsParent sc_tabulatorParent">'+
								    '<div class="tabsTogglersRow sc_tabulatorToggleRow">'+
								        '<div class="tabToggle sc_tabulatorToggler opened" dataitem="0">'+
								            '<span class="">Меню</span>'+
								        '</div>'+
								        '<div class="tabToggle sc_tabulatorToggler" dataitem="1">'+
								            '<span class="">Данные</span>'+
								        '</div>'+
								        '<div class="tabToggle sc_tabulatorToggler" dataitem="2">'+
								            '<span class="">Операции</span>'+
								        '</div>'+
								        '<div class="tabToggle sc_tabulatorToggler" dataitem="3">'+
								            '<span class="">Методы</span>'+
								        '</div>'+
								    '</div>'+

								    '<div class="ddRow sc_tabulatorDDRow">'+
								        '<div class="tabulatorDDItem sc_tabulatorDDItem opened" dataitem="0">'+
								        	'<ul class="enchancedList menuList">'+
							           		'{{#menu}}'+
						           				'<li>'+
						           					'<input type="checkbox" {{isChecked}}/><div class="keyword">{{keyword}}</div><div class="keywordRu">{{keywordRu}}</div>'+
						           				'</li>'+
							           		'{{/menu}}'+
							           		'</ul>'+
								        '</div>'+

								        '<div class=" tabulatorDDItem sc_tabulatorDDItem" dataitem="1">'+
								            '<ul class="enchancedList dataList">'+
							           		'{{#data}}'+
						           				'<li>'+
						           					'<input type="checkbox" {{isChecked}}/><div class="keyword">{{keyword}}</div><div class="keywordRu">{{keywordRu}}</div>'+
						           				'</li>'+
							           		'{{/data}}'+
							           		'</ul>'+
								        '</div>'+

								        '<div class=" tabulatorDDItem sc_tabulatorDDItem" dataitem="2">'+
								            '<ul class="enchancedList operationsList">'+
							           		'{{#operations}}'+
						           				'<li>'+
						           					'<input type="checkbox" {{isChecked}}/><div class="keyword">{{keyword}}</div><div class="keywordRu">{{keywordRu}}</div>'+
						           				'</li>'+
							           		'{{/operations}}'+
							           		'</ul>'+
								        '</div>'+

								        '<div class=" tabulatorDDItem sc_tabulatorDDItem" dataitem="3">'+
								            '<ul class="enchancedList methodsList">'+
							           		'{{#methods}}'+
						           				'<li>'+
						           					'<label>NEW <input type="checkbox" class="m-new" {{isChecked}}/></label>'+
						           					'<label>MODIFY <input type="checkbox"  class="m-modify" {{isChecked}}/></label>'+
						           					'<label>REMOVE <input type="checkbox"  class="m-remove" {{isChecked}}/></label>'+
						           					'<div class="keyword">{{keyword}}</div><div class="keywordRu">{{keywordRu}}</div>'+
						           				'</li>'+
							           		'{{/methods}}'+
							           		'</ul>'+
								        '</div>'+
								    '</div>'+
								'</div>'+
							'</div></div></div>{{/items}}',

		populateAcceses: function(container){
			container.html(Mustache.to_html(this.template, accessObject));
			uiTabs();
			container.find('input[type="checkbox"]:not(".noUniform")').uniform();
			this.setHandlers(container);
		},
		setHandlers: function(container){
			var blocks ={
				toggler: container.find('.access_dd_toggler'),
				dd: container.find('.access_DD')
			};

			blocks.dd.hide(0);

			blocks.toggler.on('click', function(){
				var thisDD = $(this).parents('.accessBlock').find('.access_DD');
				if($(this).hasClass('opened')){
					thisDD.hide(250);
					$(this).find('i').removeClass('fa-arrow-up').addClass('fa-arrow-down');
					$(this).removeClass('opened');
				}else{
					thisDD.show(250);
					$(this).find('i').removeClass('fa-arrow-down').addClass('fa-arrow-up');
					$(this).addClass('opened');
				}
			});
		}

	}

	return MB.Core.access = access;

	$(document).ready(function(){
		MB.Core.access.populateAcceses($('#homeContent'));
	});

}());



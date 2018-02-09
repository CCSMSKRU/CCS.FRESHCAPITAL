(function () {
	var tableInstance = MB.Tables.getTable(MB.Tables.justLoadedId);

	tableInstance.ct_instance.ctxMenuData = [
		{
			name: 'option1',
			title: 'Открыть в форме',
			disabled: function(){
				return false;
			},
			callback: function(){
				tableInstance.openRowInModal();
			}
		},
		{
			name: 'option2',
			title: 'Скачать отчет',
			disabled: function(){
				return false;
			},
			callback: function(){
				console.log('load');
			}
		}
	];

	var beforeBtn = tableInstance.wrapper.find('.ct-environment-buttons');
	var btnHtml = '<li class="ct-environment-btn close_period"><div class="nb btn btnDouble blue"><i class="fa fa-times"></i><div class="btnDoubleInner">Закрыть период</div></div></li>';
	beforeBtn.html(btnHtml);

	$('.close_period').off('click').on('click', function(){
		bootbox.dialog({
			title: 'Выберите период:',
			message: '<div>Any html</div>',
			buttons: {
				success: {
					label: 'Закрыть период',
					callback: function () {
						console.log('create');
					}
				},
				error: {
					label: 'Отмена'
				}
			}
		});
	});
}());

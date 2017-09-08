(function () {
	var tableNId = $('.page-content-wrapper .classicTableWrap').data('id');
	var tableInstance = MB.Tables.getTable(tableNId);

	tableInstance.ct_instance.ctxMenuData = [
		{
			name: 'option0',
			title: 'Открыть в форме',
			disabled: function () {
				return false;
			},
			callback: function () {
				tableInstance.openRowInModal();
			}
		}
		//,
		//{
		//    name: 'option1',
		//    title: 'Напечатать накладную',
		//    disabled: function(){
		//        return false;
		//    },
		//    callback: function(){
		//        $('.iFrameForPrint').remove();
		//        var delivery_note = tableInstance.data.data[tableInstance.ct_instance.getIndexesByData(true)]["DELIVERY_NOTE"];
		//        var getStr = "?sid=" + MB.User.sid+"&delivery_note="+delivery_note+"&object=report_delnote_ticket_pack";
		//        var iFrame = "<iframe class=\"iFrameForPrint\" src=\"html/report/print_report.html" + getStr + "\" width=\"0\" height=\"0\" align=\"left\"></iframe>";
		//        $("body").append(iFrame);
		//    }
		//}
	];

	(function () {
		var beforeBtn = tableInstance.wrapper.find('.ct-environment-buttons ul');
		var btnHtml = '<li class="ct-environment-btn add_few_blanks"><div class="nb btn btnDouble green"><i class="fa fa-download"></i><div class="btnDoubleInner">Получить квоту</div></div></li>';
		beforeBtn.prepend(btnHtml);

	}());

}());

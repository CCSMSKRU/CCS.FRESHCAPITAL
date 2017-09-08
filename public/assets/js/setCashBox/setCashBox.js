(function () {
	MB = MB || {};
	MB.Core = MB.Core || {};

	//var modalGuid = MB.Core.guid();


	MB.Core.setCashBox = function () {
		sendQuery({
			command: 'get',
			object: 'cash_desk_for_user',
			sid: MB.User.sid
		}, function (res) {
			var html = '<ul id="cashBoxSelect-control">';
			html += '<li data-id=""><div class="circle-radio"></div>Касса не выбрана</li>';
			for (var i in res.DATA) {
				var item = res.DATA[i];
				html += '<li data-id="' + item[res.NAMES.indexOf('CASH_DESK_ID')] + '"><div class="circle-radio"></div>' + item[res.NAMES.indexOf('CASH_DESK_NAME')] + '</li>';
			}
			html += '</ul>';
			MB.Core.lockScreen.init({
				title: 'Выбор кассы',
				content: '<div id="cashBoxSelect" class="cashBox-select3-wrapper" data-name="cash_desk">' + html + '</div>',
				buttons: [
					{
						className: 'fnBtn disabled green',
						id: 'confirmCashBox',
						title: 'Подтвердить'
					}
				]
			});

			var list = $('#cashBoxSelect-control');
			var items = list.find('li');

			items.on('click', function () {
				items.removeClass('selected');
				$(this).addClass('selected');
				$('#confirmCashBox').removeClass('disabled');
			});

			$('#confirmCashBox').on('click', function () {
				if ($(this).hasClass('disabled')) {
					return;
				}
				var selectedCashBox = list.find('li.selected');
				if (selectedCashBox.length > 0) {
					var pGuid = localStorage.getItem('printerGuid');
					if (!pGuid) {
						MB.Core.lockScreen.close();
					} else {
						var cashBoxPairs = localStorage.getItem('cashBoxPairs');
						if (cashBoxPairs) {
							cashBoxPairs = JSON.parse(cashBoxPairs);
							cashBoxPairs.cashBoxId = selectedCashBox.attr('data-id');
							cashBoxPairs.cashBoxName = selectedCashBox.text();

							socketQuery({
								command: 'operation',
								object: 'set_cash_desk',
								sid: MB.User.sid,
								params: {
									cash_desk_id: cashBoxPairs.cashBoxId
								}
							}, function (res) {
								console.log('cashBox', res);
								localStorage.setItem('cashBoxPairs', JSON.stringify(cashBoxPairs));
								$('#changeCashBox').html(cashBoxPairs.cashBoxName);
								MB.Core.lockScreen.close();
							});
						} else {
							var createCashBox = {
								cashBoxId: selectedCashBox.attr('data-id'),
								cashBoxName: selectedCashBox.text(),
								pcGuid: pGuid
							};
							socketQuery({
								command: 'operation',
								object: 'set_cash_desk',
								sid: MB.User.sid,
								params: {
									cash_desk_id: createCashBox.cashBoxId
								}
							}, function (res) {
								console.log('cashBox', res);
								localStorage.setItem('cashBoxPairs', JSON.stringify(createCashBox));
								$('#changeCashBox').html(createCashBox.cashBoxName);
								MB.Core.lockScreen.close();
							});
						}
					}
				} else {

				}

			});

		});


//        var selectWrapper = $('#cashBoxSelect');
//        var cashBoxSelect = new MB.Core.select3.init({
//            id: MB.Core.guid(),
//            wrapper: selectWrapper,
//            getString: selectWrapper.attr('data-name'),
//            column_name: select3Data.column_name,
//            view_name: select3Data.view_name,
//            value: {
//                id: '-1',
//                name: 'empty'
//            },
//            data: [],
//            fromServerIdString: select3Data.fromServerIdString,
//            fromServerNameString: select3Data.fromServerNameString,
//            searchKeyword: select3Data.searchKeyword,
//            withEmptyValue: true,
//            absolutePosition: true
//        });
	};


//    MB.Core.setCashBox = function(){
//
//        var cashModal = new MB.Core.modalWindows.init({
//            className :        'cashBoxModal',
//            wrapId :           modalGuid,
//            resizable :        false,
//            title :            'Выбор кассы',
//            status :           '',
//            content :          'empty content',
//            bottomButtons :    [
//                {
//                    title: 'Ok'
//                }
//            ],
//            startPosition :    'center',
//            height :           '70%',
//            width :            '70%',
//            draggable :        true
//        }).render(function(){
//                console.log('cashBox renderd!');
//        });
//    }
}());

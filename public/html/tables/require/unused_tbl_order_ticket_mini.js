(function () {
	var instance = MB.O.tables["tbl_order_ticket_mini"];
	instance.custom = function (callback) {
		var handsontableInstance = instance.$container.find(".handsontable").handsontable("getInstance");
		handsontableInstance.updateSettings({contextMenu: false});
		handsontableInstance.updateSettings({
			contextMenu: {
				callback: function (key, options) {
					var arr, data, handsontableInstance, i, value, _i, _len;
					switch (key) {
						case "openInModal":
							MB.Table.createOpenInModalContextMenuItem(instance, key, options);
							break;
						case "goToCancel":
							var handsontableInstance = instance.$container.find(".handsontable").handsontable("getInstance");
							var selectedRows = MB.Table.getSelectedRowsInterval(handsontableInstance);
							for (var i = selectedRows[0]; i <= selectedRows[1]; ++i) {
								var ticketId = instance.data.data[i]["ORDER_TICKET_ID"];
								var o = {
									command: "operation",
									object: "cancel_ticket"
								};
								o["ORDER_TICKET_ID"] = ticketId;
								sendQueryForObj(o);
							}
							break;
						case "goToPrint":
							var handsontableInstance = instance.$container.find(".handsontable").handsontable("getInstance");
							var selectedRows = MB.Table.getSelectedRowsInterval(handsontableInstance);
							for (var i = selectedRows[0]; i <= selectedRows[1]; ++i) {
								var ticketId = instance.data.data[i]["ORDER_TICKET_ID"];
								send('print_ticket', {guid: MB.Core.getUserGuid(), ticket_id: ticketId}, function (result) {
									instance.reload('data');
								});
								/* var o = {
								 command: "operation",
								 object: "print_ticket",
								 sid: MB.User.sid
								 };
								 o["ORDER_TICKET_ID"] = ticketId;
								 sendQueryForObj(o);*/
							}
							break;
					}
				},
				items: {
					openInModal: {
						name: "Открыть в форме"
					},
					goToCancel: {
						name: "Отменить билет",
						disabled: function () {
							var selectedRows = MB.Table.getSelectedRowsInterval(handsontableInstance);
							var disableStatus = false;
							if (selectedRows[0] != selectedRows[1]) {
								var countCallbacks = 0;
								for (var i = selectedRows[0]; i <= selectedRows[1]; ++i) {
									var ticketStatus = instance.data.data[i]["STATUS"];
									if (!(ticketStatus === "RESERVED" || ticketStatus === "TO_PAY")) {
										disableStatus = true;
									}

								}
							} else {
								var i = selectedRows[0];
								var ticketStatus = instance.data.data[i]["STATUS"];
								if (!(ticketStatus === "RESERVED" || ticketStatus === "TO_PAY")) {
									disableStatus = true;
								}
							}
							return disableStatus;
						}
					},
					goToPrint: {
						name: "Напечатать билет",
						disabled: function () {
							var selectedRows = MB.Table.getSelectedRowsInterval(handsontableInstance);
							var disableStatus = false;
							if (selectedRows[0] != selectedRows[1]) {
								var countCallbacks = 0;
								for (var i = selectedRows[0]; i <= selectedRows[1]; ++i) {
									var ticketStatus = instance.data.data[i]["STATUS"];
									var ticketPrinted = instance.data.data[i]["PRINTED"];
									log(ticketPrinted)
									log(ticketStatus)
									if (!(ticketStatus == "TO_PAY" || (ticketStatus == "ON_REALIZATION" && ticketPrinted == "NOT_PRINTED") || (ticketStatus == "CLOSED_REALIZATION" && ticketPrinted == "NOT_PRINTED"))) {
										disableStatus = true;
									}

								}
							} else {
								var i = selectedRows[0];
								var ticketStatus = instance.data.data[i]["STATUS"];
								var ticketPrinted = instance.data.data[i]["PRINTED"];
								if (!(ticketStatus == "TO_PAY" || (ticketStatus == "ON_REALIZATION" && ticketPrinted == "NOT_PRINTED") || (ticketStatus == "CLOSED_REALIZATION" && ticketPrinted == "NOT_PRINTED"))) {
									disableStatus = true;
								}
							}
							return disableStatus;
						}
					}
				}
			}
		});


		function sendQueryForObj(o) {
			socketQuery(o, function (res) {
				if (socketParse(res)) {
					instance.reload("data");
					var orderId = instance.parentkeyvalue;
					var OrderPayment = new MB.OrderPaymentClass({orderId: orderId});
					OrderPayment.updateView().db(orderId, function (data) {
						console.log(data, "CALLBACK");
					});
				}
			});
		}

		callback();
	}
})();




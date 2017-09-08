// onSelectRow: function(rowid){
//     var key;
//     Orders.orderTicketStatus = $("#" + table.name).getCell(rowid, "STATUS");
//     Orders.orderTicketId = rowid;
//     for (key in Orders.contextMenu) {
//         Orders.contextMenu[key].disabled = true;
//     } 
//     if (Orders.orderTicketStatus === "RESERVED") {
//         Orders.contextMenu.goToPay.disabled = false;
//         Orders.contextMenu.goToCancel.disabled = false;
//         Orders.contextMenu.goToChangeReservDate.disabled = false;
//     } else if (Orders.orderTicketStatus === "TO_PAY") {
//         Orders.contextMenu.goToCancel.disabled = false;
//         Orders.contextMenu.goToPrint.disabled = false;
//     } else if (Orders.orderTicketStatus === "CLOSED" || Orders.orderTicketStatus === "CLOSED_REALIZATION") {
//         Orders.contextMenu.goToDefectBlank.disabled = false;
//         Orders.contextMenu.goToDefectTicket.disabled = false;
//         Orders.contextMenu.goToReturn.disabled = false;                    
//     } else if (Orders.orderTicketStatus === "REALIZATION") {
//         Orders.contextMenu.goToDefectTicket.disabled = false;
//         Orders.contextMenu.goToDefectBlank.disabled = false;
//         Orders.contextMenu.goToReturn.disabled = false;
//     } else if (Orders.orderTicketStatus === "IN_PRINT") {
//         Orders.contextMenu.goToPrint.disabled = false;
//     }

//     if (Orders.agentRealizationAccess === "TRUE" && Orders.orderTicketStatus === "TO_PAY") {
//         Orders.contextMenu.goToRealization.disabled = false;
//     } else if (Orders.agentRealizationAccess === "TRUE" && Orders.orderTicketStatus === "REALIZATION") {
//         Orders.contextMenu.goToCloseRealization.disabled = false;
//     }

//     $.contextMenu("destroy", "#one_order tr");
//     $.contextMenu({
//         selector: "#one_order tr",
//         zIndex:1100,
//         items: Orders.contextMenu
//     });
// }  


(function () {
	var instance = MB.O.tables["tbl_order_ticket"];
	var parent = MB.O.forms["form_order"];
	instance.custom = function (callback) {
		var parent = MB.O[instance.parentobjecttype + "s"][instance.parentobject];
		var agentrealizationaccess = parent.data.data[0]["AGENT_REALIZATION_ACCESS"].bool();
		//console.log(agentrealizationaccess);

		instance.contextmenu["goToPay"] = {
			name: "К оплате",
			disabled: function (key, options) {
				var selectedrow = $("#tbl_order_ticket").find(".selectedrow");
				var check = false;
				var ticketstatus = ($(options.$trigger[0]).find("td[data-column='STATUS'] a").length > 0) ? $(options.$trigger[0]).find("td[data-column='STATUS'] a").text() : $(options.$trigger[0]).find("td[data-column='STATUS']").text();
				if (ticketstatus === "RESERVED") {
					check = false;
				}
				else {
					check = true;
				}
				selectedrow.each(function (i, el) {
					ticketstatus = $(el).find("td[data-column='STATUS']").text();
					if (ticketstatus !== "RESERVED") {
						check = true;
					}
				})
				if (check) {
					return true;
				}
				else {
					return false;
				}
			},
			callback: function (key, options) {
				var selectedrow = $("#tbl_order_ticket").find(".selectedrow");
				if (selectedrow.length > 0) {
					selectedrow.each(function () {
						var ticketid = $(this).find("td[data-column='ORDER_TICKET_ID']").text();
						var o = {
							command: "operation",
							object: "pay_ticket"
						};
						o["ORDER_TICKET_ID"] = ticketid;
						sendQueryForObj(o);
					})

				}
				else {
					var ticketid = $(options.$trigger[0]).data("row");
					var o = {
						command: "operation",
						object: "pay_ticket"
					};
					o["ORDER_TICKET_ID"] = ticketid;
					sendQueryForObj(o);
				}

			}
		};


		instance.contextmenu["goToCancel"] = {
			name: "Отменить билет",
			disabled: function (key, options) {
				$("#tbl_order_ticket").find(".selectedrow").each(function () {
					var ticketstatus = ($(options.$trigger[0]).find("td[data-column='STATUS'] a").length > 0) ? $(options.$trigger[0]).find("td[data-column='STATUS'] a").text() : $(options.$trigger[0]).find("td[data-column='STATUS']").text();
					if (ticketstatus !== "RESERVED" || ticketstatus !== "TO_PAY") {
						return true;
					}
				})
				return false;
			},
			callback: function (key, options) {
				var ticketid = $(options.$trigger[0]).data("row");
				var o = {
					command: "operation",
					object: "cancel_ticket"
				};
				o["ORDER_TICKET_ID"] = ticketid;
				sendQueryForObj(o);
			}
		};
		instance.contextmenu["goToReturn"] = {
			name: "Вернуть билет",
			disabled: function (key, options) {
				var ticketstatus = ($(options.$trigger[0]).find("td[data-column='STATUS'] a").length > 0) ? $(options.$trigger[0]).find("td[data-column='STATUS'] a").text() : $(options.$trigger[0]).find("td[data-column='STATUS']").text();
				if (ticketstatus === "CLOSED" || ticketstatus === "CLOSED_REALIZATION" || ticketstatus === "REALIZATION") {
					return false;
				} else {
					return true;
				}
			},
			callback: function (key, options) {
				var ticketid = $(options.$trigger[0]).data("row");
				var o = {
					command: "operation",
					object: "return_ticket"
				};
				o["ORDER_TICKET_ID"] = ticketid;
				sendQueryForObj(o);
			}
		};
		instance.contextmenu["goToPrint"] = {
			name: "Напечатать билет",
			disabled: function (key, options) {
				var ticketstatus = ($(options.$trigger[0]).find("td[data-column='STATUS'] a").length > 0) ? $(options.$trigger[0]).find("td[data-column='STATUS'] a").text() : $(options.$trigger[0]).find("td[data-column='STATUS']").text();
				if (ticketstatus === "IN_PRINT" || ticketstatus === "TO_PAY" || ticketstatus === "PAID") {
					return false;
				} else {
					return true;
				}
			},
			callback: function (key, options) {
				var ticketid = $(options.$trigger[0]).data("row");
				send('print_ticket', {guid: MB.Core.getUserGuid(), ticket_id: ticketid}, function (result) {
					instance.reload('data');

				});
				/*var o = {
				 command: "operation",
				 object: "print_ticket",
				 sid: MB.User.sid
				 };
				 o["ORDER_TICKET_ID"] = ticketid;
				 sendQueryForObj(o);*/
			}
		};
		instance.contextmenu["goToDefectBlank"] = {
			name: "Забраковать бланк",
			disabled: function (key, options) {
				var ticketstatus = ($(options.$trigger[0]).find("td[data-column='STATUS'] a").length > 0) ? $(options.$trigger[0]).find("td[data-column='STATUS'] a").text() : $(options.$trigger[0]).find("td[data-column='STATUS']").text();
				if (ticketstatus === "CLOSED" || ticketstatus === "CLOSED_REALIZATION" || ticketstatus === "REALIZATION") {
					return false;
				} else {
					return true;
				}
			},
			callback: function (key, options) {
				var ticketid = $(options.$trigger[0]).data("row");
				var o = {
					command: "operation",
					object: "defect_blank"
				};
				o["ORDER_TICKET_ID"] = ticketid;
				sendQueryForObj(o);
			}
		};
		instance.contextmenu["goToDefectTicket"] = {
			name: "Забраковать билет",
			disabled: function (key, options) {
				var ticketstatus = ($(options.$trigger[0]).find("td[data-column='STATUS'] a").length > 0) ? $(options.$trigger[0]).find("td[data-column='STATUS'] a").text() : $(options.$trigger[0]).find("td[data-column='STATUS']").text();
				if (ticketstatus === "CLOSED" || ticketstatus === "CLOSED_REALIZATION" || ticketstatus === "REALIZATION") {
					return false;
				} else {
					return true;
				}
			},
			callback: function (key, options) {
				var ticketid = $(options.$trigger[0]).data("row");
				var o = {
					command: "operation",
					object: "defect_ticket"
				};
				o["ORDER_TICKET_ID"] = ticketid;
				sendQueryForObj(o);
			}
		};
		instance.contextmenu["goToRealization"] = {
			name: "Выдать билет на релизацию",
			disabled: function (key, options) {
				var ticketstatus = ($(options.$trigger[0]).find("td[data-column='STATUS'] a").length > 0) ? $(options.$trigger[0]).find("td[data-column='STATUS'] a").text() : $(options.$trigger[0]).find("td[data-column='STATUS']").text();
				if (agentrealizationaccess || ticketstatus === "TO_PAY") {
					return false;
				} else {
					return true;
				}
			},
			callback: function (key, options) {
				var ticketid = $(options.$trigger[0]).data("row");
				var o = {
					command: "operation",
					object: "realization_ticket"
				};
				o["ORDER_TICKET_ID"] = ticketid;
				sendQueryForObj(o);
			}
		};
		instance.contextmenu["goToCloseRealization"] = {
			name: "Закрыть реализацию билета",
			disabled: function (key, options) {
				var ticketstatus = ($(options.$trigger[0]).find("td[data-column='STATUS'] a").length > 0) ? $(options.$trigger[0]).find("td[data-column='STATUS'] a").text() : $(options.$trigger[0]).find("td[data-column='STATUS']").text();
				if (agentrealizationaccess || ticketstatus === "REALIZATION") {
					return false;
				} else {
					return true;
				}
			},
			callback: function (key, options) {
				var ticketid = $(options.$trigger[0]).data("row");
				var o = {
					command: "operation",
					object: "close_realization_ticket"
				};
				o["ORDER_TICKET_ID"] = ticketid;
				sendQueryForObj(o);
			}
		};

		function sendQueryForObj(o) {
			MB.Core.sendQuery(o, function (res) {
				if (socketParse(res)) parent.reload("data");
			});
		}

		var query = "#" + instance.world + "_" + instance.name + "_wrapper table tbody tr";
		$.contextMenu("destroy", query);
		$.contextMenu({
			selector: query,
			items: instance.contextmenu
		});
		callback();
	};
})();


// instance.contextmenu["goToChangeReservDate"] = {
//     name: "Продлить резерв (так назвать?)",
//     callback: function() {
//         var html = "<input type='text' id='reservedToDateInput'></input>";
//         if ($("#reservedToDateInput")[0] === undefined ) {
//             $("#one_order").setCell(Orders.orderTicketId, "RESERVED_TO_DATE", html);
//             $("#reservedToDateInput").focus();
//             $("#reservedToDateInput").on("keyup", function() {

//             });
//             $("#reservedToDateInput").mask("99-99-9999 99:99:99");
//             $("#reservedToDateInput").on("blur", function() {
//                 var params = {};
//                 var valOf = $("#reservedToDateInput").val();
//                 params["ORDER_TICKET_ID"] = Orders.orderTicketId;
//                 params["OBJVERSION"] = $("#one_order").getCell(Orders.orderTicketId, "OBJVERSION");
//                 params["RESERVED_TO_DATE"] = valOf;
//                 send_query({command:"edit", subcommand:"order_ticket", sid:sid, params:params}, function(data) {
//                     console.log($(data).find("result").find("message").text());
//                     if ($(data).find("result").find("rc").text() === "0") {
//                         $("#one_order").trigger("reloadGrid");
//                         Orders.loadOrderForm(Orders.orderId);
//                     } else {
//                         alert_yesno("<span style='color:#f00;'>Ошибка.</span>","<center>"+$(data).find("result").find("message").text()+"</center>","Ок","",function(){},0);
//                         $("#one_order").trigger("reloadGrid");
//                     }

//                 });
//             });
//         } else {

//         }
//     }
// };


// instance.contextmenu["custom1"] = {
//     name: "Перейти к перераспределению",
//     callback: function (key, options) {
//         var id = options.$trigger.data("row");
//         MB.Core.switchModal({type:"content", filename:"action_fundZones", params:{action_id:id}});
//     }
// };
// instance.contextmenu["custom2"] = {
//     name: "Перейти к переоценке",
//     callback: function (key, options) {
//         var id = options.$trigger.data("row");
//         MB.Core.switchModal({type:"content", filename:"action_priceZones", params:{action_id:id}});
//     }
// };

// var query = "#" + instance.world + "_" + instance.name + "_wrapper table tbody tr";
// $.contextMenu("destroy", query);
// $.contextMenu({
//     selector: query,
//     items: instance.contextmenu
// });
// callback();







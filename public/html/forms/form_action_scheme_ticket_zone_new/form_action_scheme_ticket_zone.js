(function () {

	var formID = MB.Forms.justLoadedId;
	var formInstance = MB.Forms.getForm('form_action_scheme_ticket_zone', formID);

//	formInstance.lowerButtons = [
//		{
//			title: 'Удалить всю схему мероприятия',
//			color: "red",
//			icon: "fa-trash-o",
//			type: "SINGLE",
//			hidden: false,
//			condition: [{
//				colNames: ['ACTION_SCHEME_CREATED'],
//				matching: ['equal'],
//				colValues: ['FALSE']
//			}],
//			handler: function () {
//				bootbox.dialog({
//					message: "Вы уверены что хотите удалить схему мероприятия?",
//					title: "Предупреждение",
//					buttons: {
//						ok: {
//							label: "Да, уверен",
//							className: "yellow",
//							callback: function () {
//								socketQuery({
//										command: "operation",
//										object: "delete_action_scheme",
//										params: {
//											action_id: formInstance.activeId
//										}
//									},
//									function (data) {
//										socketParse(data);
//										formInstance.reload("data");
//									});
//
//							}
//						},
//						cancel: {
//							label: "Отменить",
//							className: "blue",
//							callback: function () {
//
//							}
//						}
//					}
//				});
//			}
//		}
//	];
}());
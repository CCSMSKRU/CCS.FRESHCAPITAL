(function () {
	var instance = MB.O.forms["form_fund_group"];
	instance.custom = function (callback) {
		//var Tabs = new TabsClass();
		var id = MB.O.forms.form_fund_group.activeId;
		var tableInstance = undefined;
		$("#TAB_found_group_modal_access_user").click(function () {
			$(".form_fund_group_access_user-content-wrapper").html("");
			var table = new MB.Table({
				world: "form_fund_group_access_user",
				name: "tbl_fund_group_user_access",
				params: {
					parent: instance
					// parentkeyvalue: id,
					// parentobject: "form_fund_group",
					// parentobjecttype: "form"
				}
			});
			table.create(function () {
			});
			tableInstance = table;
			log(MB.Table.hasloaded("tbl_fund_group_user_access"))
		});
		$("#TAB_found_group_modal_access_agent").click(function () {
			$(".form_fund_group_access_agent-content-wrapper").html("");
			var table = new MB.Table({
				world: "form_fund_group_access_agent",
				name: "tbl_fund_group_agent_access",
				params: {
					parent: instance
					// parentkeyvalue: id,
					// parentobject: "form_fund_group",
					// parentobjecttype: "form"
				}
			});
			table.create(function () {
			});
			log(MB.Table.hasloaded("tbl_fund_group_agent_access"))
		});

		//aig
		var itemTpl = '<div class="row uff-item" data-id="{{userId}}"><div class="col-md-8 name">{{name}}</div><div class="col-md-4 role">{{role}}</div></div>';

		var rolesTpl = "<div class='btn newStyle btn-green mar0550 roleFilter' data-id='{{roleId}}'>{{roleName}}</div>";

		$('#addUsersForFund').off('click').on('click', function () {
			var users = undefined;
			var roles = undefined;
			var alreadyAdded = [];

//            <query>
//                <command>get</command>
//                <object>fund_group_user_access</object>
//                <where>FUND_GROUP_ID = '1'</where>
//                <order_by></order_by>
//                <client_object>tbl_fund_group_user_access</client_object>
//                <sid>YlmmPWxbfdugtjjYoHqjkCKnqooijqEaopTgteUZNkIoRPfhPa</sid>
//                <page_no>1</page_no>
//                <rows_max_num>30</rows_max_num>
//            </query>

			socketQuery({
				command: "get",
				object: "fund_group_user_access",
				params: {
					where: "FUND_GROUP_ID =" + id
				}
			}, function (res) {
				res = socketParse(res);
				for (var i in res) {
					alreadyAdded.push(res[i]["USER_ID"]);
				}


				socketQuery({
					command: "get",
					object: "user_active",
					params: {}
				}, function (res) {
					res = socketParse(res);
					users = res;
					var lBlockHtml = '';
					var rolesHtml = '';

					for (var i in res) {
						var userItem = res[i];
						if (~alreadyAdded.indexOf(userItem["USER_ID"])) continue;
						var data = {
							userId: userItem["USER_ID"],
							name: userItem["FULLNAME"],
							role: userItem["STATUS_RU"]
						};
						lBlockHtml += Mustache.to_html(itemTpl, data);
					}

					socketQuery({
						command: "get",
						object: "role",
						params: {}
					}, function (res) {
						res = socketParse(res);
						roles = res;
						rolesHtml = "<div class='btn newStyle btn-green mar0550 roleFilter' data-id='all'>Все пользователи</div>";
						for (var i in res) {
							var roleItem = res[i];
							var data = {
								roleId: roleItem["ROLE_ID"],
								roleName: roleItem["NAME"]
							};
							rolesHtml += Mustache.to_html(rolesTpl, data);
						}

						// "VISIBLE"
						// "REQUIRED"
						// "EDITABLE"
						// "INSERTABLE"
						// "UPDATABLE"

						var checkboxesHtml = "<div class='col-md-6'>" +
							"<div class='row'>" +
							"<div class='wid50pr'>" +
							"<label class='form-label'>Поиск: </label>" +
							"<input type='text' class='form-control searchUsers' />" +
							"</div>" +
							"</div>" +
							"<div class='row'>" + rolesHtml + "</div>" +
							"</div>" +
							"<div class='col-md-6'>" +
							"<div class='row'>" +
							"<div class='col-md-4'>" +
							"<label class=''><input data-name='VISIBLE' type='checkbox' class='' checked='checked'>Виден</label>" +
							"</div>" +
							"<div class='col-md-4'>" +
							"<label class=''><input data-name='PRINT' type='checkbox' class='' checked='checked'>Печать</label>" +
							"</div>" +
							"<div class='col-md-4'>" +
							"<label class=''><input data-name='RETURN' type='checkbox' class='' checked='checked'>Возврат</label>" +
							"</div>" +
							"</div>" +
							"<div class='row'>" +
							"<div class='col-md-4'>" +
							"<label class=''><input data-name='TAKE' type='checkbox' class='' checked='checked'>Взять из фонда</label>" +
							"</div>" +
							"<div class='col-md-4'>" +
							"<label class=''><input data-name='PUT' type='checkbox' class='' checked='checked'>Положить в фонд</label>" +
							"</div>" +
							"</div>" +
							"</div>";

						var fullHtml = "<div id='uff-list-container'>" +
							"<div class='row'>" +
							"<div class='col-md-12'>" +
							"<div class='toBlockCheckboxes'>" + checkboxesHtml + "</div>" +
							"</div>" +
							"<div class='col-md-6'>" +
							"<div class='col-md-12 fromBlock'>" + lBlockHtml + "</div>" +
							"</div>" +
							"<div class='col-md-6'>" +
							"<div class='col-md-12 toBlock'></div>" +
							"</div>" +
							"</div>" +
							"</div>";

						bootbox.dialog({
							message: fullHtml,
							title: "Пользователи",
							className: "class-with-width",
							buttons: {
								success: {
									label: "Добавить",
									className: "green",
									callback: function () {
										for (var i = 0; i < toBlockCollection.length; i++) {
											var item = toBlockCollection.eq(i);

											socketQuery({
												command: "new",
												object: "fund_group_user_access",
												params: {
													FUND_GROUP_ID: id,
													VISIBLE: (uffWrapper.find('input[type="checkbox"][data-name="VISIBLE"]')[0].checked) ? "TRUE" : "FALSE",
													PRINT: (uffWrapper.find('input[type="checkbox"][data-name="PRINT"]')[0].checked) ? "TRUE" : "FALSE",
													RETURN: (uffWrapper.find('input[type="checkbox"][data-name="RETURN"]')[0].checked) ? "TRUE" : "FALSE",
													TAKE: (uffWrapper.find('input[type="checkbox"][data-name="TAKE"]')[0].checked) ? "TRUE" : "FALSE",
													PUT: (uffWrapper.find('input[type="checkbox"][data-name="PUT"]')[0].checked) ? "TRUE" : "FALSE",
													USER_ID: item.data('id')
												}
											}, function (res) {
												socketParse(res);
												tableInstance.reload("data");
											});
										}
									}
								}
							}
						});

						var uffWrapper = $('#uff-list-container');
						var elemInMove = undefined;
						var fromBlockCollection = $('.fromBlock .uff-item');
						var toBlockCollection = $('.toBlock .uff-item');

						function reinitHandlers() {
							fromBlockCollection = $('.fromBlock .uff-item');
							toBlockCollection = $('.toBlock .uff-item');

							fromBlockCollection.off('click');
							toBlockCollection.off('click');

							fromBlockCollection.on('click', function () {
								elemInMove = $(this);
								$(this).remove();
								uffWrapper.find('.toBlock').append(elemInMove);
								reinitHandlers();
							});

							toBlockCollection.on('click', function () {
								elemInMove = $(this);
								$(this).remove();
								uffWrapper.find('.fromBlock').append(elemInMove);
								reinitHandlers();
								//elemInMove = $(this);
								//$(this).remove();
								//uffWrapper.find('.fromBlock').append(elemInMove);
							});
						}

						uffWrapper.find('.searchUsers').on('input', function () {
							var val = $(this).val();

							for (var i = 0; i < fromBlockCollection.length; i++) {
								var item = fromBlockCollection.eq(i);
								item.show();
								var iName = item.find('.name').html().toLowerCase();
								if (iName.indexOf(val.toLowerCase()) == -1) {
									item.hide();
								}
							}
						});

						uffWrapper.find('.roleFilter').on('click', function () {
							var roleId = $(this).data('id');

							if (roleId == 'all') {
								socketQuery({
									command: "get",
									object: "user_active"
								}, function (res) {
									res = socketParse(res);
									users = res;
									lBlockHtml = '';

									for (var i in res) {
										var userItem = res[i];
										if (~alreadyAdded.indexOf(userItem["USER_ID"])) continue;
										var data = {
											userId: userItem["USER_ID"],
											name: userItem["FULLNAME"],
											role: userItem["ROLE_NAME"]
										};
										lBlockHtml += Mustache.to_html(itemTpl, data);
									}
									uffWrapper.find('.fromBlock').html(lBlockHtml);
									reinitHandlers();
								});
							} else {
								socketQuery({
									command: "get",
									object: "user_role",
									params: {
										where: "ROLE_ID =" + roleId
									}
								}, function (res) {
									res = socketParse(res);
									users = res;
									lBlockHtml = '';

									for (var i in res) {
										var userItem = res[i];
										if (~alreadyAdded.indexOf(userItem["USER_ID"])) continue;
										var data = {
											userId: userItem["USER_ID"],
											name: userItem["FULLNAME"],
											role: userItem["ROLE_NAME"]
										};
										lBlockHtml += Mustache.to_html(itemTpl, data);
									}
									uffWrapper.find('.fromBlock').html(lBlockHtml);
									reinitHandlers();
								});
							}
						});

						reinitHandlers();


//                $(document).on('click', '#uff-list-container .toBlock .uff-item', function(){
//                    elemInMove = $(this);
//                    $(this).remove();
//                    uffWrapper.find('.fromBlock').append(elemInMove);
//                    //elemInMove = undefined;
//                });

						$('#uff-list-container input[type="checkbox"]:not(".noUniform")').uniform();
					});
				});
			});
		});
		// /aig

		callback();
	};
})();


/*
 $("#TAB_found_groups_modal_access_user").click(function(){
 var id = MB.O.forms.form_fund_group.activeId
 var MultiplySelect = new MultiplySelectClass({selector:"#found_groups_modal_access_user",thisId:"3",subcommandEx:"customer_user",subcommandAll:"user_for_customer_user",pKey:"customer_id",pKeyEx:"USER_ID",pKeyAll:"CUSTOMER_USER_ID"});
 MultiplySelect.init(function(){});
 })
 $("#TAB_found_groups_modal_access_inst").click(function(){
 var MultiplySelect = new MultiplySelectClass({selector:"#found_groups_modal_access_user",thisId:"3",subcommandEx:"fund_group_agent_access",subcommandAll:"user_for_customer_user",pKey:"customer_id",pKeyEx:"USER_ID",pKeyAll:"CUSTOMER_USER_ID"});
 MultiplySelect.init(function(){});
 })
 */

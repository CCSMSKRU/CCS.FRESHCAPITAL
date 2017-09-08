(function () {

	var modal = $('.mw-wrap').last();
	var formID = MB.Forms.justLoadedId;
	var tableID1 = modal.find('.classicTableWrap').eq(0).attr('data-id');
	var tableID2 = modal.find('.classicTableWrap').eq(1).attr('data-id');

	var formInstance = MB.Forms.getForm('form_fund_group', formID);
	var tableInstance1 = MB.Tables.getTable(tableID1);
	var tableInstance2 = MB.Tables.getTable(tableID2);

	var formWrapper = $('#mw-' + formInstance.id);
	var tableWrapper1 = $('.classicTableWrap-' + tableInstance1.id);
	var tableWrapper2 = $('.classicTableWrap-' + tableInstance2.id);


	var itemTpl = '{{#users}}<div class="uff-item" data-id="{{userId}}"><div class="name">{{name}}</div><div class="role"></div></div>{{/users}}';
	var rolesTpl = "<label class='fn-label'>Фильтр по ролям</label><select class='rolesSelect'>{{#roles}}<option value='{{roleId}}' data-id='{{roleId}}'>{{roleName}}</option>{{/roles}}</select>";
	var id = formInstance.activeId;

	var addUsers = formWrapper.find('.form-fund-group-add-users');
	var addAgents = formWrapper.find('.form-fund-group-add-agents');
	var backToTables = formWrapper.find('.form-fund-group-slideBack');

	var formTrain = formWrapper.find('.fn-train-overflow').fn_train();
	var rVagonFilledBy = undefined;

	addUsers.off('click').on('click', function () {

		if (!rVagonFilledBy || rVagonFilledBy == 'agents') {
			MB.Core.spinner.start(formWrapper.find('.fn-vagon').eq(0));
			var usersInFund = undefined;
			var allUsers = undefined;
			var usersByRole = undefined;
			var roles = undefined;

			function afterDataGetted() {

				var flatUsersInFund = [];

				function setHandlers() {
					var lbElem = formWrapper.find('.uff-item');
					var roleItem = formWrapper.find('.roleFilter');
					var lb = formWrapper.find('.fromBlock');
					var rb = formWrapper.find('.toBlock');

					lbElem.off('click').on('click', function () {
						var id = $(this).data('id');
						var elem = $(this);

						if (elem.parents('.fromBlock').length > 0) {
							flatUsersInFund.push(id.toString());
							rb.append(elem);
						} else {
							flatUsersInFund.splice(flatUsersInFund.indexOf(id), 1);
							lb.append(elem);
						}
					});

					roleItem.off('click').on('click', function () {
						var id = $(this).data('id');
						var lBMObj = {
							users: []
						};
						var lbHtml = '';
						if (id == 'all') {
							socketQuery({
								command: "get",
								object: "user_active"
							}, function (res) {
								res = socketParse(res);

								for (var i in res) {
									var ubr = res[i];
									var userId = ubr['USER_ID'];
									if (!~flatUsersInFund.indexOf(userId)) {
										lBMObj.users.push({
											userId: userId,
											name: ubr['FULLNAME']
										});
									}
								}
								lbHtml = Mustache.to_html(itemTpl, lBMObj);
								lb.html(lbHtml);
								setHandlers();
							});
						} else {
							socketQuery({
								command: "get",
								object: "user_role",
								params: {
									where: "ROLE_ID =" + id
								}
							}, function (res) {
								res = socketParse(res);

								for (var i in res) {
									var ubr = res[i];
									var userId = ubr['USER_ID'];
									if (!~flatUsersInFund.indexOf(userId)) {
										lBMObj.users.push({
											userId: userId,
											name: ubr['FULLNAME']
										});
									}
								}
								lbHtml = Mustache.to_html(itemTpl, lBMObj);
								lb.html(lbHtml);
								setHandlers();
							});
						}
					});

					formWrapper.find('.checkbox-wrapper').checkboxIt();

					$(formTrain.rolesSelInstance).off('changeVal').on('changeVal', function (e, was, now) {

						var roleId = now['id'];
						var lBlockHtml = '';
						var lBMObj = {
							users: []
						};

						if (roleId == 'all') {
							socketQuery({
								command: "get",
								object: "fund_group_user_access",
								params: {
									where: "FUND_GROUP_ID =" + id
								}
							}, function (res) {
								res = socketParse(res);

								usersInFund = res;
								for (var ui in usersInFund) {
									var uiItem = usersInFund[ui];
									flatUsersInFund.push(uiItem['USER_ID']);
								}

								for (var u in allUsers) {
									var userItem = allUsers[u];
									var userId = userItem['USER_ID'];
									if (!~flatUsersInFund.indexOf(userId)) {
										lBMObj.users.push({
											userId: userId,
											name: userItem['FULLNAME']
										});
									}
								}
								lBlockHtml = Mustache.to_html(itemTpl, lBMObj);
								lb.html(lBlockHtml);
								setHandlers();
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

								usersByRole = res;

								for (var i in res) {
									var userItem = res[i];
									var userId = userItem['USER_ID'];

									if (!~flatUsersInFund.indexOf(userId)) {
										lBMObj.users.push({
											userId: userId,
											name: userItem["FULLNAME"]
										});
									}
								}

								lBlockHtml = Mustache.to_html(itemTpl, lBMObj);
								lb.html(lBlockHtml);
								setHandlers();
							});
						}
					});

					formWrapper.find('input.searchUsers').off('input').on('input', function () {
						var val = $(this).val();
						var spReg = new RegExp(/^\s+$/g);
						lb.find('.uff-item').show(0);
						if (val.length > 0 && !spReg.test(val)) {
							for (var i = 0; i < lb.find('.uff-item').length; i++) {
								var item = lb.find('.uff-item').eq(i);
								var name = item.find('.name').text();
								if (name.toLowerCase().indexOf(val.toLowerCase()) == -1) {
									item.hide(0);
								}
							}
						}
					});

					formWrapper.find('.form-fund-group-slideBack').off('click').on('click', function () {
						formTrain.slideRight();
					});

					formWrapper.find('.addUsersToFund').off('click').on('click', function () {
						var chks = {
							VISIBLE: MB.Core.checkboxes.getItem(formWrapper.find('.checkbox-wrapper[data-name="VISIBLE"]').data('id')).value,
							PRINT: MB.Core.checkboxes.getItem(formWrapper.find('.checkbox-wrapper[data-name="PRINT"]').data('id')).value,
							RETURN: MB.Core.checkboxes.getItem(formWrapper.find('.checkbox-wrapper[data-name="RETURN"]').data('id')).value,
							TAKE: MB.Core.checkboxes.getItem(formWrapper.find('.checkbox-wrapper[data-name="TAKE"]').data('id')).value,
							PUT: MB.Core.checkboxes.getItem(formWrapper.find('.checkbox-wrapper[data-name="PUT"]').data('id')).value
						};

						var itemsToRemove = [];
						var finished = 0;
						for (var i = 0; i < rb.find('.uff-item').length; i++) {
							var item = rb.find('.uff-item').eq(i);
							socketQuery({
								command: "new",
								object: "fund_group_user_access",
								params: {
									FUND_GROUP_ID: id,
									VISIBLE: (chks.VISIBLE) ? 'TRUE' : 'FALSE',
									PRINT: (chks.PRINT) ? 'TRUE' : 'FALSE',
									RETURN: (chks.RETURN) ? 'TRUE' : 'FALSE',
									TAKE: (chks.TAKE) ? 'TRUE' : 'FALSE',
									PUT: (chks.PUT) ? 'TRUE' : 'FALSE',
									USER_ID: item.data('id')
								}
							}, function (res) {
								var insideItem = rb.find('.uff-item').eq(finished);
								if (socketParse(res)) insideItem.addClass('toRemove').hide(0);

								if (finished == rb.find('.uff-item').length - 1) {
									rb.find('.uff-item.toRemove').each(function (idx, elem) {
										elem.remove();
									});
									tableInstance1.reload();
								}
								finished += 1;
							});
						}
					});
				}


				var roleHtml = '';
				var roleMObj = {
					roles: []
				};
				roleMObj.roles.push({
					roleId: 'all',
					roleName: 'Все пользователи'
				});
				for (var r in roles) {
					var roleItem = roles[r];
					roleMObj.roles.push({
						roleId: roleItem['ROLE_ID'],
						roleName: roleItem['NAME']
					});
				}

				roleHtml = Mustache.to_html(rolesTpl, roleMObj);

				//users


				var lBlockHtml = '';
				var lBMObj = {
					users: []
				};
				for (var ui in usersInFund) {
					var uiItem = usersInFund[ui];
					flatUsersInFund.push(uiItem['USER_ID']);
				}

				for (var u in allUsers) {
					var userItem = allUsers[u];
					var userId = userItem['USER_ID'];
					if (!~flatUsersInFund.indexOf(userId)) {
						lBMObj.users.push({
							userId: userId,
							name: userItem['FULLNAME']
						});
					}
				}

				lBlockHtml = Mustache.to_html(itemTpl, lBMObj);

				var checkboxesHtml = "<div class='col-md-6'>" +
					"<div class='row'>" + roleHtml + "</div>" +
					"<div class='row'><input type='text' class='searchUsers fn-control' placeholder='Поиск'/></div>" +
					"</div>" +
					"<div class='col-md-6 marTop30'>" +
					"<div class='row'>" +
					"<div class='col-md-4'>" +
					"<div class='checkbox-wrapper checked' data-name='VISIBLE' data-value='true' data-type='inline' data-id='" + MB.Core.guid() + "'></div>" +
					"<label class='fn-label-small ellips'>Виден</label>" +
					"</div>" +
					"<div class='col-md-4'>" +
					"<div class='checkbox-wrapper checked' data-name='PRINT' data-value='true' data-type='inline' data-id='" + MB.Core.guid() + "'></div>" +
					"<label class='fn-label-small ellips'>Печать</label>" +
					"</div>" +
					"<div class='col-md-4'>" +
					"<div class='checkbox-wrapper checked' data-name='RETURN' data-value='true' data-type='inline' data-id='" + MB.Core.guid() + "'></div>" +
					"<label class='fn-label-small ellips'>Возврат</label>" +
					"</div>" +
					"</div>" +
					"<div class='row'>" +
					"<div class='col-md-6'>" +
					"<div class='checkbox-wrapper checked' data-name='TAKE' data-value='true' data-type='inline' data-id='" + MB.Core.guid() + "'></div>" +
					"<label class='fn-label-small ellips'>Взять из фонда</label>" +
					"</div>" +
					"<div class='col-md-6'>" +
					"<div class='checkbox-wrapper checked' data-name='PUT' data-value='true' data-type='inline' data-id='" + MB.Core.guid() + "'></div>" +
					"<label class='fn-label-small ellips'>Положить в фонд</label>" +
					"</div>" +
					"</div>" +
					"</div>";

				var fullHtml = "<div id='uff-list-container'>" +
					"<div class='row'>" +
					"<div class='col-md-12'>" +
					"<div class='toBlockCheckboxes'>" + checkboxesHtml + "</div>" +
					"</div>" +
					"<div class='col-md-12'>" +
					"<div class='toBlockCheckboxes'>" +
					"<div class='col-md-6'>" +
					"<div class='row'>" +
					"<div class='fromBlock'>" + lBlockHtml + "</div>" +
					"</div>" +
					"</div>" +
					"<div class='col-md-6'>" +
					"<div class='row'>" +
					"<div class='toBlock'></div>" +
					"</div>" +
					"</div>" +
					"</div>" +
					"</div>" +
					"</div>" +
					"</div>" +
					"<div class='uff-buttons'>" +
					"<div class='form-fund-group-slideBack fn-small-btn fn-btn blue'><i class='fa fa-chevron-left'></i> Вернуться</div>" +
					"<div class='fn-btn fn-small-btn green addUsersToFund marLeft10'><i class='fa fa-plus'></i> Добавить</div>" +
					"</div>";

				formTrain.rVagon.find('.form-fund-group-add-wrapper').html(fullHtml);
				formTrain.rolesSelInstance = formTrain.rVagon.find('.form-fund-group-add-wrapper').find('.rolesSelect').select3();
				setHandlers();
				MB.Core.spinner.stop(formWrapper.find('.fn-vagon').eq(0));
				formTrain.slideLeft(function () {
					rVagonFilledBy = 'users';

				});
			}

			socketQuery({
				command: "get",
				object: "fund_group_user_access",
				params: {
					where: "FUND_GROUP_ID =" + id
				}
			}, function (res) {
				res = socketParse(res);
				// Юзеры в фонде
				console.log('Юзеры в фонде', res);
				usersInFund = res;

				socketQuery({
					command: "get",
					object: "user_active",
					params: {}
				}, function (res) {
					res = socketParse(res);
					// Активные Юзеры
					console.log('Активные Юзеры', res);
					allUsers = res;

					socketQuery({
						command: "get",
						object: "role"
					}, function (res) {
						res = socketParse(res);
						//Роли
						console.log('Роли', res);
						roles = res;
						afterDataGetted();
					});

				});
			});

		} else {
			formTrain.slideLeft(function () {

			});
		}


	});

	addAgents.off('click').on('click', function () {
		if (!rVagonFilledBy || rVagonFilledBy == 'users') {
			MB.Core.spinner.start(formWrapper.find('.fn-vagon').eq(0));
			var usersInFund = undefined;
			var allUsers = undefined;
			var usersByRole = undefined;


			function afterDataGetted() {

				var flatUsersInFund = [];

				function setHandlers() {
					var lbElem = formWrapper.find('.uff-item');
					var lb = formWrapper.find('.fromBlock');
					var rb = formWrapper.find('.toBlock');

					lbElem.off('click').on('click', function () {
						var id = $(this).data('id');
						var elem = $(this);

						if (elem.parents('.fromBlock').length > 0) {
							flatUsersInFund.push(id.toString());
							rb.append(elem);
						} else {
							flatUsersInFund.splice(flatUsersInFund.indexOf(id), 1);
							lb.append(elem);
						}
					});

					formWrapper.find('.checkbox-wrapper').checkboxIt();

					formWrapper.find('input.searchUsers').off('input').on('input', function () {
						var val = $(this).val();
						var spReg = new RegExp(/^\s+$/g);
						lb.find('.uff-item').show(0);
						if (val.length > 0 && !spReg.test(val)) {
							for (var i = 0; i < lb.find('.uff-item').length; i++) {
								var item = lb.find('.uff-item').eq(i);
								var name = item.find('.name').text();
								if (name.toLowerCase().indexOf(val.toLowerCase()) == -1) {
									item.hide(0);
								}
							}
						}
					});

					formWrapper.find('.form-fund-group-slideBack').off('click').on('click', function () {
						formTrain.slideRight();
					});

					formWrapper.find('.addAgentsToFund').off('click').on('click', function () {
						var chks = {
							VISIBLE: MB.Core.checkboxes.getItem(formWrapper.find('.checkbox-wrapper[data-name="VISIBLE"]').data('id')).value,
							PRINT: MB.Core.checkboxes.getItem(formWrapper.find('.checkbox-wrapper[data-name="PRINT"]').data('id')).value,
							RETURN: MB.Core.checkboxes.getItem(formWrapper.find('.checkbox-wrapper[data-name="RETURN"]').data('id')).value,
							TAKE: MB.Core.checkboxes.getItem(formWrapper.find('.checkbox-wrapper[data-name="TAKE"]').data('id')).value,
							PUT: MB.Core.checkboxes.getItem(formWrapper.find('.checkbox-wrapper[data-name="PUT"]').data('id')).value
						};

						var itemsToRemove = [];
						var finished = 0;
						for (var i = 0; i < rb.find('.uff-item').length; i++) {
							var item = rb.find('.uff-item').eq(i);
							socketQuery({
								command: "new",
								object: "fund_group_agent_access",
								params: {
									FUND_GROUP_ID: id,
									VISIBLE: (chks.VISIBLE) ? 'TRUE' : 'FALSE',
									PRINT: (chks.PRINT) ? 'TRUE' : 'FALSE',
									RETURN: (chks.RETURN) ? 'TRUE' : 'FALSE',
									TAKE: (chks.TAKE) ? 'TRUE' : 'FALSE',
									PUT: (chks.PUT) ? 'TRUE' : 'FALSE',
									AGENT_ID: item.data('id')
								}
							}, function (res) {
								res = socketParse(res);
								var insideItem = rb.find('.uff-item').eq(finished);
								if (res) insideItem.addClass('toRemove').hide(0);

								if (finished == rb.find('.uff-item').length - 1) {
									rb.find('.uff-item.toRemove').each(function (idx, elem) {
										elem.remove();
									});
									tableInstance2.reload();
								}
								finished += 1;
							});
						}
					});
				}

				var lBlockHtml = '';
				var lBMObj = {
					users: []
				};
				for (var ui in usersInFund) {
					var uiItem = usersInFund[ui];
					flatUsersInFund.push(uiItem['AGENT_ID']);
				}

				for (var u in allUsers) {
					var userItem = allUsers[u];
					var userId = userItem['AGENT_ID'];
					if ($.inArray(userId, flatUsersInFund) == -1) {
						lBMObj.users.push({
							userId: userId,
							name: userItem['NAME']
						});
					}
				}

				lBlockHtml = Mustache.to_html(itemTpl, lBMObj);

				var checkboxesHtml = "<div class='col-md-6'>" +
					"<div class='row marTop28'><label class='fn-label wid100pr'>Поиск агентов<input type='text' class='searchUsers fn-control' placeholder='Поиск'/></label></div>" +
					"</div>" +
					"<div class='col-md-6 marTop30'>" +
					"<div class='row'>" +
					"<div class='col-md-4'>" +
					"<div class='checkbox-wrapper checked' data-name='VISIBLE' data-value='true' data-type='inline' data-id='" + MB.Core.guid() + "'></div>" +
					"<label class='fn-label-small ellips'>Виден</label>" +
					"</div>" +
					"<div class='col-md-4'>" +
					"<div class='checkbox-wrapper checked' data-name='PRINT' data-value='true' data-type='inline' data-id='" + MB.Core.guid() + "'></div>" +
					"<label class='fn-label-small ellips'>Печать</label>" +
					"</div>" +
					"<div class='col-md-4'>" +
					"<div class='checkbox-wrapper checked' data-name='RETURN' data-value='true' data-type='inline' data-id='" + MB.Core.guid() + "'></div>" +
					"<label class='fn-label-small ellips'>Возврат</label>" +
					"</div>" +
					"</div>" +
					"<div class='row'>" +
					"<div class='col-md-6'>" +
					"<div class='checkbox-wrapper checked' data-name='TAKE' data-value='true' data-type='inline' data-id='" + MB.Core.guid() + "'></div>" +
					"<label class='fn-label-small ellips'>Взять из фонда</label>" +
					"</div>" +
					"<div class='col-md-6'>" +
					"<div class='checkbox-wrapper checked' data-name='PUT' data-value='true' data-type='inline' data-id='" + MB.Core.guid() + "'></div>" +
					"<label class='fn-label-small ellips'>Положить в фонд</label>" +
					"</div>" +
					"</div>" +
					"</div>";

				var fullHtml = "<div id='uff-list-container'>" +
					"<div class='row'>" +
					"<div class='col-md-12'>" +
					"<div class='toBlockCheckboxes'>" + checkboxesHtml + "</div>" +
					"</div>" +
					"<div class='col-md-12'>" +
					"<div class='toBlockCheckboxes'>" +
					"<div class='col-md-6'>" +
					"<div class='row'>" +
					"<div class='fromBlock'>" + lBlockHtml + "</div>" +
					"</div>" +
					"</div>" +
					"<div class='col-md-6'>" +
					"<div class='row'>" +
					"<div class='toBlock'></div>" +
					"</div>" +
					"</div>" +
					"</div>" +
					"</div>" +
					"</div>" +
					"</div>" +
					"<div class='uff-buttons'>" +
					"<div class='form-fund-group-slideBack fn-small-btn fn-btn blue'><i class='fa fa-chevron-left'></i> Вернуться</div>" +
					"<div class='fn-btn fn-small-btn green addAgentsToFund marLeft10'><i class='fa fa-plus'></i> Добавить</div>" +
					"</div>";

				formTrain.rVagon.find('.form-fund-group-add-wrapper').html(fullHtml);
				setHandlers();
				MB.Core.spinner.stop(formWrapper.find('.fn-vagon').eq(0));
				formTrain.slideLeft(function () {
					rVagonFilledBy = 'agents';

				});
			}

			socketQuery({
				command: "get",
				object: "fund_group_agent_access",
				params: {
					where: "FUND_GROUP_ID =" + id
				}
			}, function (res) {
				res = socketParse(res);
				// Юзеры в фонде
				console.log('Юзеры в фонде', res);
				usersInFund = res;

				socketQuery({
					command: "get",
					object: "agent",
					params: {}
				}, function (res) {
					res = socketParse(res);
					// Активные Юзеры
					console.log('Активные Юзеры', res);
					allUsers = res;

					afterDataGetted();
				});
			});

		} else {
			formTrain.slideLeft(function () {

			});
		}
	});

	backToTables.off('click').on('click', function () {
		formTrain.slideRight(function () {

		});
	});

	formWrapper.find('.addUsersForFund').off('click').on('click', function () {
		console.log('123');
		alert(123);

	});

//    var instance = MB.O.forms["form_fund_group"];
//    instance.custom = function (callback) {
//        //var Tabs = new TabsClass();
//        var id = MB.O.forms.form_fund_group.activeId;
//        var tableInstance = undefined;
//        $("#TAB_found_group_modal_access_user").click(function(){
//            $(".form_fund_group_access_user-content-wrapper").html("");
//            var table = new MB.Table({
//                world: "form_fund_group_access_user",
//                name: "tbl_fund_group_user_access",
//                params: {
//                    parent: instance
//                    // parentkeyvalue: id,
//                    // parentobject: "form_fund_group",
//                    // parentobjecttype: "form"
//                }
//            });
//            table.create(function () {});
//            tableInstance = table;
//            log(MB.Table.hasloaded("tbl_fund_group_user_access"))
//        });
//        $("#TAB_found_group_modal_access_agent").click(function(){
//            $(".form_fund_group_access_agent-content-wrapper").html("");
//            var table = new MB.Table({
//                world: "form_fund_group_access_agent",
//                name: "tbl_fund_group_agent_access",
//                params: {
//                    parent: instance
//                    // parentkeyvalue: id,
//                    // parentobject: "form_fund_group",
//                    // parentobjecttype: "form"
//                }
//            });
//            table.create(function () {});
//            log(MB.Table.hasloaded("tbl_fund_group_agent_access"))
//        });
//
//        //aig
//
//        // /aig
//
//        callback();
//    };
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

(function () {
	var instance = MB.O.forms["form_action_scheme_pricing"];
	instance.custom = function (callback) {
		console.log(instance);
		callback();
	};
})();
(function () {
	var conn = {
			local: {
				protocol: 'http',
				address: '192.168.1.190',
				port: '8080',
				extrenal_http_port: '80'

			},
			remote: {
				protocol: 'http',
				address: '109.107.177.142',
				port: '8080',
				extrenal_http_port: '8080'
			},
			ajaxScript: '/cgi-bin/b2e',
            ajaxPort:80,
			autoAjaxUse: false
		},
		localNames = ['localhost','192.168.1.190','192.168.1.127'];

	if (~localNames.indexOf(location.hostname)) window.currentConnection = conn.local;
	else window.currentConnection = conn.remote;
	currentConnection.autoAjaxUse = conn.autoAjaxUse;

	window.connectPath = currentConnection.protocol + '://' + currentConnection.address + ':' + currentConnection.port;
	window.connectHost = currentConnection.protocol + '://' + currentConnection.address+ ':' + currentConnection.extrenal_http_port;
	window.connectPathAjaxScript = currentConnection.protocol + '://' + currentConnection.address + ':' + conn.ajaxPort + conn.ajaxScript;
}());
var SessionStore = require('express-mysql-session');
var config = require('../config');
var sessionStore = new SessionStore(config.get('mysqlConnection'));
module.exports = sessionStore;

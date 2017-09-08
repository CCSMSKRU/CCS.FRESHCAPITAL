var nconf = require('nconf');
var path = require('path');
var filename = process.argv[2] || 'config.json';
//export NODE_ENV=production
//SET NODE_ENV=production
var NODE_ENV = process.env.NODE_ENV || "development";
console.log('NODE_ENV',NODE_ENV);
/*if (NODE_ENV=='REMOTE'){
    filename = 'configREMOTE.json';
}else if (NODE_ENV=='VAIO'){
    filename = 'config.json';
}*/

console.log('Config selection.', filename);
nconf.argv()
    .env()
    .file({file:path.join(__dirname,filename)});

module.exports = nconf;
//GRANT ALL PRIVILEGES ON `mb001`.* TO root@'%' IDENTIFIED BY 'aambfi5y';
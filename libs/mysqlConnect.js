
var config = require('../config');


var mysql = require("mysql"),
    cMysql = mysql.createPool(config.get('mysqlConnection'));

var mysqlUtilities = require('mysql-utilities');
var mysqlUtilitiesExtendedWhere = require('./mysqlUtiltiesExtendedWhere');
cMysql.on('connection', function(connection) {
    console.log('MySQL pool connected');
    mysqlUtilities.upgrade(connection);
    //mysqlUtilitiesExtendedWhere.upgradeWhere(connection);
    mysqlUtilities.introspection(connection);
});
cMysql.on('error', function(err) {
    console.log('MySQL ERROR --------');
    console.log(err);
});
cMysql.on('enqueue', function () {
    //console.log('Закончились свободные подключения. Вернем подвисшие.');
    //for (var i in cMysql._allConnections) {
    //    console.log('Подключение', i, 'в статусе', cMysql._allConnections[i].state);
    //    cMysql._allConnections[i].destroy();
    //}
    //cMysql.end();
    //cMysql = mysql.createPool(config.get('mysqlConnection'));

    console.log('Waiting for available connection slot');
});

var async = require('async');
cMysql.getConn = function(callback){

    if (cMysql._allConnections.length >= cMysql.config.connectionLimit-1){
        console.log('Подождем....', '\nИспользуется подключений:', cMysql._allConnections.length, '\nЛимит:', cMysql.config.connectionLimit-1);
        async.eachSeries(Object.keys(cMysql._allConnections), function(key, cb){
            var item = cMysql._allConnections[key];
            if (!item) return cb(null);
            console.log('Подключение', key, 'в статусе', item.state);
            cMysql._purgeConnection(item, cb);
        }, function(err){
            if (err) console.log(err);
            cMysql.getConn(callback);
        });

        // for (var i in cMysql._allConnections) {
        //     console.log('Подключение', i, 'в статусе', cMysql._allConnections[i].state);
        //     cMysql._purgeConnection(cMysql._allConnections[i]);
        // }
        // return cMysql.getConn(callback);
    }else{
        cMysql.getConnection(function(err,conn) {
            if (err) {
                console.log(err);
                callback(err)
            } else {
                callback(null,conn);
            }
        });
    }
};

module.exports = cMysql;


/*pool.getConnection(function(err,conn){
    if(err){
        console.log("MYSQL: can't get connection from pool:",err)
    }else {
        conn.insert('countries',{
            title:'TEST',
            external_id: 1
        },function(err,recordId){
            if (err){
                console.log(err);
            }
            console.log('Inserted:',recordId);
            conn.release();
        });

    }
});*/
//bind-address=0.0.0.0
//sudo service mysql restart
// mysql -u root -p
// create database cfft
// GRANT ALL PRIVILEGES ON cfft.* TO root@'%' IDENTIFIED BY 'aambfi5y' WITH GRANT OPTION;
// Увеличить на сервере connectionLimit
//


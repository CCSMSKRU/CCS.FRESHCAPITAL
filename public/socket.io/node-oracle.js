 var oracle = require('oracle');

 var connectData = {
     hostname: "192.168.1.101",
     port: 1521,
     database: "PDBORCL", // System ID (SID)
     user: "ticket_b2c",
     password: "qweqwe"
 };

 oracle.connect(connectData, function(err, connection) {
     if (err) { console.log("Error connecting to db:", err); return; }

     connection.execute("SELECT systimestamp FROM dual", [], function(err, results) {
         if (err) { console.log("Error executing query:", err); return; }

         console.log(results);
         connection.close(); // call only when query is finished executing
     });
 });

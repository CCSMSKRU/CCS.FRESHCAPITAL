(function() {
  var io, oracle;

  oracle = require("oracle-changed");

  io = require("socket.io").listen(8080);

  io.on("connection", function(socket) {
    socket.emit("socketnews", {
      message: "socket connection established successfully"
    });
    socket.on("query", function(query) {
      console.log(query);
      socket.emit("socketnews", {
        message: "query event has run",
        query: query
      });
      oracle.connect({
        hostname: "192.168.1.101",
        port: 1521,
        database: "PDBORCL",
        user: "ticket_b2c",
        password: "qweqwe"
      }, function(oracleConnectError, connection) {
        if (oracleConnectError) {
          socket.emit("socketnews", {
            message: "Error connecting to db",
            error: oracleConnectError
          });
          return;
        }
        socket.emit("socketnews", {
          message: "connection to db established successfully",
          connection: connection
        });
        connection.execute("declare begin :res := TICKET_B2C.b2e_gateway_api.Request(:xreq,''); end;", [new oracle.OutParam(oracle.OCCICLOB), query], function(connectionExecuteError, results) {
          if (connectionExecuteError) {
            socket.emit("socketnews", {
              message: "Error executing to db",
              error: connectionExecuteError
            });
            connection.close();
            return;
          }
          socket.emit("sendQuery2Response", {
            message: "results from db",
            results: results
          });
          connection.close();
        });
      });
    });
  });

}).call(this);

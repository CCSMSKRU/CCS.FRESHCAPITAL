(function() {
  var MB, ip;

  ip = location.hostname;

  MB = {};

  MB.User = {};

  MB.User.socket2 = io.connect("http://" + ip + ":8080");

  MB.User.socket2.on("connect", function(data) {
    return console.log(data);
  });

  MB.User.socket2.on("socketnews", function(data) {
    return console.log(data);
  });

  MB.User.socket2.on("sendQuery2Response", function(data) {
    return console.log(data);
  });

}).call(this);

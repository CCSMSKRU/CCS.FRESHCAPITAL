(function() {
  var ip;

  ip = location.hostname;

  this.socket2 = io.connect("http://" + ip + ":8080");

  this.socket2.on("connect", function(data) {
    return console.log(data);
  });

  this.socket2.on("socketnews", function(data) {
    return console.log(data);
  });

  this.socket2.on("sendQuery2Response", function(data) {
    return console.log(data);
  });

}).call(this);

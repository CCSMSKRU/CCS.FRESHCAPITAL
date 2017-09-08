(function() {
  var obj, test, x;

  x = 10;

  obj = {};

  if (obj.test == null) {
    obj.test = "string";
  }

  test = function(params) {
    return "Hello, world";
  };

  test();

}).call(this);

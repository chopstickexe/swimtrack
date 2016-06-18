'use strict';
module.exports = (function() {
  var PI = Math.PI;

  let area = function(r) {
    return PI * r * r;
  };

  let circumference = function(r) {
    return 2 * PI * r;
  };

  return {
    area: area,
    circumference: circumference
  };
}());

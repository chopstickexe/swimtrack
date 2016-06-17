'use strict';
var circle = require('../../js/sandbox/circle');
describe('area 関数のテスト', function() {
  it('should return a right area value', function() {
    expect(circle.area(1)).toBe(Math.PI);
  });
});

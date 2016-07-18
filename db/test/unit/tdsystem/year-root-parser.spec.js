'use strict';
var client = require('cheerio-httpcli');
var parser = require('../../../js/tdsystem/year-root-parser');
var testUrl = 'http://www.tdsystem.co.jp/i2015.htm';
var normalize = function(text) {
    return text.normalize('NFKC');
};
describe('2015年トップページのテスト', function() {
  it('should find a right result of a given swimmer name', function(done) {
    client.fetch(testUrl, 'Shift_JIS', function(err, $, res) {
      let parseResult = parser.parsePage(2015, $);
      console.log(parseResult);
      done();
    });
  });
});

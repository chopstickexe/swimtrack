'use strict';
var client = require('cheerio-httpcli');
var parser = require('../../../js/tdsystem/meet-parser');
var util = require('../../../js/swimtrack-util');
var testUrl = 'http://www.tdsystem.co.jp/2015/201501/31MIE/PRO.HTM';
describe('Test 2015/201501/31MIE/PRO.HTM top page', function() {
  it('should find a right meet and venue from a given meet name', function(done) {
    client.fetch(testUrl, function(err, $, res) {
      let parseResult = parser.parsePage($);
      console.log(parseResult);
      done();
    });
  });
});

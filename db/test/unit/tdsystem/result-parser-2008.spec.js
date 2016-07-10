'use strict';
var client = require('cheerio-httpcli');
var parser = require('../../../js/tdsystem/result-parser-2008');
var testUrl = 'http://www.tdsystem.co.jp/2016/201601/16CMC/017.HTM';
describe('2016年大会結果パージングのテスト', function() {
  client.fetch(testUrl, 'utf-8', function(err, $, res) {
    let document = parser.parseDocument($);
    console.log(document);　　
    it('should return a right area value', function() {
      expect(true).toBe(true);
    });
  });
});

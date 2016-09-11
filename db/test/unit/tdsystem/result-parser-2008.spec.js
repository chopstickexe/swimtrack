'use strict';
var client = require('cheerio-httpcli');
var parser = require('../../../js/tdsystem/result-parser-2008');
var testUrl = 'http://www.tdsystem.co.jp/2016/201601/16CMC/017.HTM';
var normalize = function(text) {
  return text.normalize('NFKC');
};
describe('2016年大会結果パージングのテスト', function() {
  it('should find a right result of a given swimmer name',
    function(done) {
      client.fetch(testUrl, 'utf-8', function(err, $, res) {
          let parseResult = parser.parseDocument($);
          expect(parseResult).toBeDefined();
          expect(parseResult.results).toBeDefined();

          let userName = normalize('伊藤勝介');
          let resultElm = parseResult.results.find(function(elm) {
            expect(elm.user).toBeDefined();
            if (elm.user === userName) {
              return true;
            }
            return false;
          });
          expect(resultElm).toBeDefined();
          expect(resultElm.rank).toBe(5);
          expect(resultElm.record).toBe('46.20 seconds');
          done();
        });
    });
});

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
          let parseResult = parser.parseDocument(0, $);
          expect(parseResult).toBeDefined();

          let users = parseResult.users;
          expect(users).toBeDefined();

          let results = parseResult.results;
          expect(results).toBeDefined();

          let userResult = parseResult.user_result;
          expect(userResult).toBeDefined();

          let userId = users.indexOf(normalize('伊藤勝介'));
          expect(userId).toBeGreaterThan(-1);

          let userResultElm = userResult.find(function(elm) {
            expect(elm.userId).toBeDefined();
            if (elm.userId === userId) {
              return true;
            }
            return false;
          });
          expect(userResultElm).toBeDefined();

          let result = results[userResultElm.resultId];
          expect(result).toBeDefined();
          expect(result.rank).toBe(5);
          expect(result.record).toBe('46.20 seconds');
          done();
        });
    });
});

'use strict';
var client = require('cheerio-httpcli');
var parser = require('../../../js/tdsystem/year-parser');
var util = require('../../../js/swimtrack-util');
var testUrl = 'http://www.tdsystem.co.jp/i2015.htm';
describe('Test 2015 top page', function() {
  it('should find a right meet and venue from a given meet name', function(done) {
    client.fetch(testUrl, 'Shift_JIS', function(err, $, res) {
      let parseResult = parser.parsePage(2015, $);
      let meets = parseResult.meets;
      let meetFound = false;
      for (let i = 0; i < meets.length; i++) {
        let meet = meets[i];
        if (meet.name === '中部学生選手権水泳競技大会') {
          meetFound = true;
          expect(meet.days).toContain('2015-07-04');
          expect(meet.days).toContain('2015-07-05');
          expect(meet.venue.city).toEqual('愛知');
          expect(meet.venue.name).toEqual('日本ガイシアリーナ');
          expect(meet.venue.course).toEqual('長水路');
          break;
        }
      }
      expect(meetFound).toEqual(true);
      done();
    });
  });
});

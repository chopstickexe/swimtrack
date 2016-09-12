'use strict';
var client = require('cheerio-httpcli');
var parser = require('../../../js/tdsystem/meet-parser');
var util = require('../../../js/swimtrack-util');
var testUrl = 'http://www.tdsystem.co.jp/2015/201501/31MIE/PRO.HTM';
describe('Test 2015/201501/31MIE/PRO.HTM top page', function() {
  it('should find 133 races', function(done) {
    client.fetch(testUrl, function(err, $, res) {
      let parseResult = parser.parsePage($);

      expect(parseResult.races.length).toBe(133);

      let race12th = parseResult.races[11];
      expect(race12th.sex).toBe('女子');
      expect(race12th.distance).toBe(50);
      expect(race12th.style).toBe('バタフライ');
      expect(race12th.age).toBeUndefined();
      expect(race12th.relay).toBe(false);

      let race48th = parseResult.races[47];
      expect(race48th.sex).toBe('女子');
      expect(race48th.distance).toBe(50);
      expect(race48th.style).toBe('背泳ぎ');
      expect(race48th.age).toBe('11・12歳');
      expect(race48th.relay).toBe(false);

      let race63rd = parseResult.races[62];
      expect(race63rd.sex).toBe('男子');
      expect(race63rd.distance).toBe(200);
      expect(race63rd.style).toBe('メドレーリレー');
      expect(race63rd.age).toBe('10歳以下');
      expect(race63rd.relay).toBe(true);

      done();
    });
  });
});

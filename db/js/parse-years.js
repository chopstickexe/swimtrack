(function() {
  'use strict';

  var client = require('cheerio-httpcli');
  var yearParser = require('./tdsystem/year-parser');
  var meetParser = require('./tdsystem/result-parser-2008.js');

  /**
   * Main process
   */
  const BASE_URL = 'http://www.tdsystem.co.jp';
  const YEAR_TOP_PAGES = [
    {
      year: 2016,
      url: 'http://www.tdsystem.co.jp/i2016.htm',
      encoding: 'Shift_JIS'
    },
    {
      year: 2015,
      url: 'http://www.tdsystem.co.jp/i2015.htm',
      encoding: 'Shift_JIS'
    },
    {
      year: 2014,
      url: 'http://www.tdsystem.co.jp/i2014.htm',
      encoding: 'Shift_JIS'
    },
    {
      year: 2013,
      url: 'http://www.tdsystem.co.jp/i2013.htm',
      encoding: 'Shift_JIS'
    },
    {
      year: 2012,
      url: 'http://www.tdsystem.co.jp/i2012.htm',
      encoding: 'Shift_JIS'
    }
  ];
  let venues = {}; // Key = name, Value = object
  for (const yearIndex in YEAR_TOP_PAGES) {
    const yearTopPage = YEAR_TOP_PAGES[yearIndex];
    console.log('parsing ' + yearTopPage.url);
    client.fetch(yearTopPage.url, function(err, $, res) {
      if (err) {
        console.log(err);
        return;
      }
      let yearParseResult = yearParser.parsePage(yearTopPage.year, $, venues);
      let meets = yearParseResult.meets;
      for (const meetIndex in meets) {
        let url = meets[meetIndex].url;
        if (!url) continue;
        console.log(BASE_URL + '/' + url);
      }
      console.log('venues.keys().length=' + Object.keys(venues).length);
    });
  }
}());

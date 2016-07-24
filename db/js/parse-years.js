(function() {
  'use strict';

  var client = require('cheerio-httpcli');
  var yearParser = require('./tdsystem/year-root-parser');
  var meetParser = require('./tdsystem/result-parser-2008.js');

  /**
   * Main process
   */
  let baseURL = 'http://www.tdsystem.co.jp';
  let yearTopPages = [
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
  for (const yearIndex in yearTopPages) {
    const yearTopPage = yearTopPages[yearIndex];
    console.log('parsing ' + yearTopPage.url);
    client.fetch(yearTopPage.url, function(err, $, res) {
      if (err) {
        console.log(err);
        return;
      }
      
      let yearParseResult = yearParser.parsePage(yearTopPage.year, $);
      let meets = yearParseResult.meets;
      for (const meetIndex in meets) {
        let url = meets[meetIndex].url;
        if (!url) continue;
        console.log(baseURL + '/' + url);
      }
    });
  }
}());

(function() {
  'use strict';

  var util = require('./swimtrack-util');
  var yearParser = require('./tdsystem/year-parser');
  var meetParser = require('./tdsystem/meet-parser');
  var raceParser = require('./tdsystem/result-parser-2008');

  /**
   * Main process
   */
  const YEAR_TOP_PAGES = [
    {
      year: 2016,
      url: 'http://www.tdsystem.co.jp/i2016.htm',
      path: 'www.tdsystem.co.jp/i2016.htm',
      encoding: 'Shift_JIS'
    },
    {
      year: 2015,
      url: 'http://www.tdsystem.co.jp/i2015.htm',
      path: 'www.tdsystem.co.jp/i2015.htm',
      encoding: 'Shift_JIS'
    },
    {
      year: 2014,
      url: 'http://www.tdsystem.co.jp/i2014.htm',
      path: 'www.tdsystem.co.jp/i2014.htm',
      encoding: 'Shift_JIS'
    },
    {
      year: 2013,
      url: 'http://www.tdsystem.co.jp/i2013.htm',
      path: 'www.tdsystem.co.jp/i2013.htm',
      encoding: 'Shift_JIS'
    },
    {
      year: 2012,
      url: 'http://www.tdsystem.co.jp/i2012.htm',
      path: 'www.tdsystem.co.jp/i2012.htm',
      encoding: 'Shift_JIS'
    }
  ];
  let venues = {}; // Key = name, Value = object
  let meetId = 0;
  for (const yearIndex in YEAR_TOP_PAGES) {
    const yearTopPage = YEAR_TOP_PAGES[yearIndex];
    let $ = util.parseLocalHtml(yearTopPage.path);
    let yearParseResult = yearParser.parsePage(yearTopPage.year, $, venues);
    let meets = yearParseResult.meets;
    for (const meetIndex in meets) { // for each meet
      let url = meets[meetIndex].url;
      if (!url) continue;
      let meetPath = yearTopPage.path.substring(0, yearTopPage.path.lastIndexOf('/') + 1) + url;
      let $meet = util.parseLocalHtml(meetPath);
      let meetParseResult = meetParser.parsePage($meet);
      for (const raceIndex in meetParseResult.races) {
        let racePath = meetPath.substring(0, meetPath.lastIndexOf('/') + 1) + meetParseResult.races[raceIndex].page;
        let $race = util.parseLocalHtml(racePath);
        let raceParseResult = raceParser.parseDocument(meetId++, $race);
        console.log(raceParseResult);
      }
    }
  }
}());

(function() {
  'use strict';

  var pg = require('pg');
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
    }
    /** ,
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
    */
  ];
  let pool = new pg.Pool();
  pool.on('error', function(e, client) {
    return console.error('DB Error', e);
  });
  let meetId;
  for (const yearIndex in YEAR_TOP_PAGES) {
    const yearTopPage = YEAR_TOP_PAGES[yearIndex];
    console.log('Parse ' + yearTopPage.year);
    let $ = util.parseLocalHtml(yearTopPage.path);
    let yearParseResult = yearParser.parsePage(yearTopPage.year, $);
    let meets = yearParseResult.meets;
    for (const meetIndex in meets) { // for each meet
      let meet = meets[meetIndex];
      //
      // Insert venue to DB if not exists and get venue ID
      //
      let venue = meet.venue;
      let venueId = -1;
      pool.query('INSERT INTO venues(name, city) SELECT CAST($1 AS VARCHAR), CAST($2 AS VARCHAR) WHERE NOT EXISTS (SELECT id FROM venues WHERE name = $1 AND city = $2)',
        [venue.name, venue.city])
        .then(function(insertResult) {
          //
          // Get venue ID
          //
          pool.query('SELECT id FROM venues WHERE name = $1 AND city = $2',
            [venue.name, venue.city])
            .then(function(selectResult) {
              venueId = selectResult.rows[0].id;
              //
              // Insert meet to DB
              //
              pool.query('INSERT INTO meets(id, name, start_date, dates, venue_id, course) VALUES (DEFAULT, $1, $2, $3, $4, $5) RETURNING id',
                [meet.name, meet.days[0], meet.days, venueId, venue.course])
                .then(function(insertMeetResult) {
                  meetId = insertMeetResult.rows[0].id;
                  console.log('meetID = ' + meetId);
                });
            });
        });
      /**
      let url = meet.url;
      if (!url) continue;

      //
      // Parse meet page (PRO.HTM)
      //
      let meetPath = yearTopPage.path.substring(0, yearTopPage.path.lastIndexOf('/') + 1) + url;
      let $meet = util.parseLocalHtml(meetPath);
      meet.parseResult = meetParser.parsePage($meet);
      let races = meet.parseResult.races;
      for (const raceIndex in races) {
        let race = races[raceIndex];
        //
        // Parse race page (###.HTM)
        //
        let racePath = meetPath.substring(0, meetPath.lastIndexOf('/') + 1) + race.page;
        let $race = util.parseLocalHtml(racePath);
        race.parseResult = raceParser.parseDocument(meetId, $race);
      }*/
    }
  }
}());

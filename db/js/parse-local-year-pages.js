(function() {
  'use strict';

  var pgp = require('pg-promise')();
  var util = require('./swimtrack-util');
  var yearParser = require('./tdsystem/year-parser');
  var meetParser = require('./tdsystem/meet-parser');
  var raceParser = require('./tdsystem/result-parser-2008');

  var getId = function(db, selectStatement, insertStatement, args) {
    return new Promise(function(resolve, reject) {
      db.task(function(t) {
          t.oneOrNone(insertStatement, args)
            .then(function(row) {
              console.log('row=' + row);
            })
            .catch(function(err) {
              console.log(err);
            });
        })
        .catch(function(err) {
          return reject(err);
        });
    });
  };

  var initVenues = function(db) {
    return new Promise(function(resolve, reject) {
      db.any('SELECT * FROM venues')
        .then(function(rows) {
          let ret = {};
          ret.map = {};
          ret.maxId = -1;
          for (const row of rows) {
            ret.map[row.name] = row;
            if (ret.maxId < row.id) {
              ret.maxId = row.id;
            }
          }
          return resolve(ret);
        })
        .catch(function(err) {
          console.error('Error in initVenues');
          return reject(err);
        });
    });
  };

  var initMeets = function(db) {
    return new Promise(function(resolve, reject) {
      db.any('SELECT * FROM meets')
        .then(function(rows) {
          let ret = {};
          ret.map = {};
          ret.maxId = -1;
          for (const row of rows) {
            ret[row.name] = row;
            if (ret.maxId < row.id) {
              ret.maxId = row.id;
            }
          }
          return resolve(ret);
        })
        .catch(function(err) {
          console.error('Error in initMeets');
          return reject(err);
        });
    });
  };


  var getVenueId = function(db, venue) {
    return getId(db, 'SELECT id FROM venues WHERE name = $1 AND city = $2',
      'INSERT INTO venues(name, city) VALUES($1, $2) ON CONFLICT(name, city) DO NOTHING RETURNING id', [venue.name, venue.city]);
  };

  var getMeetId = function(db, venueId, meet) {
    return getId(db, 'SELECT id FROM meets WHERE name = $1 AND start_date = $2 AND venue_id = $4',
      'INSERT INTO meets(name, start_date, dates, venue_id, course) SELECT $1, $2, CAST($3 AS DATE[]), $4, $5 RETURNING id', [meet.name, meet.days[0], meet.days, venueId, meet.venue.course]);
  };

  var getEventId = function(db, event) {
    return getId(db, 'SELECT id FROM events WHERE sex = $1 AND distance = $2 AND style = $3 AND age = $4 AND relay = $5',
      'INSERT INTO events(sex, distance, style, age, relay) VALUES($1, $2, $3, $4, $5) RETURNING id', [event.sex, event.distance, event.style, event.age, event.relay]);
  };

  var getRaceId = function(db, meetId, eventId) {
    return getId(db, 'SELECT id FROM races WHERE meet_id = $1 AND event_id = $2',
      'INSERT INTO races(meet_id, event_id) VALUES($1, $2) RETURNING id', [meetId, eventId]);
  };

  var getResultId = function(db, raceId, result) {
    return getId(db, 'SELECT id FROM results WHERE race_id = $1 AND rank = $2 AND record = $3',
      'INSERT INTO results(race_id, rank, record) SELECT $1, $2, $3 RETURNING id', [raceId, result.rank, result.record]);
  };

  var getUserId = function(db, user) {
    return getId(db, 'SELECT id FROM users WHERE name = $1',
      'INSERT INTO users(name) VALUES($1) RETURNING id',
      user);
  };

  var getTeamId = function(db, team) {
    return getId(db, 'SELECT id FROM teams WHERE name = $1',
      'INSERT INTO teams(name) VALUES($1) RETURNING id',
      team);
  };

  var insertUserResult = function(db, userId, resultId) {
    return new Promise(function(resolve, reject) {
      db.none('INSERT INTO user_result(user_id, result_id) SELECT $1, $2 WHERE NOT EXISTS (SELECT * FROM user_result WHERE user_id = $1 AND result_id = $2)', [userId, resultId])
        .then(function() {
          return resolve('done');
        })
        .catch(function(err) {
          return reject(err);
        });
    });
  };

  var insertUserTeamMeet = function(db, userId, teamId, meetId) {
    return new Promise(function(resolve, reject) {
      db.none('INSERT INTO user_team_meet(user_id, team_id, meet_id) SELECT $1, $2, $3 WHERE NOT EXISTS (SELECT * FROM user_team_meet WHERE user_id = $1 AND team_id = $2 AND meet_id = $3)', [userId, teamId, meetId])
        .then(function() {
          return resolve('done');
        })
        .catch(function(err) {
          return reject(err);
        });
    });
  };

  var processRace = function(db, meetId, raceId, racePath) {
    //
    // Parse race page (###.HTM)
    //
    let $race = util.parseLocalHtml(racePath);
    let raceParseResult = raceParser.parseDocument($race);
    raceParseResult.results.forEach(function(result) {
      Promise.all([getUserId(db, result.user), getTeamId(db, result.team), getResultId(db, raceId, result)])
        .then(function(results) {
          insertUserResult(db, results[0], results[2]);
          insertUserTeamMeet(db, results[0], results[1], meetId);
        })
        .catch(function(err) {
          console.error(err);
        });
    });
  };

  /**
   * Main process
   */
  const YEAR_TOP_PAGES = [{
    year: 2016,
    url: 'http://www.tdsystem.co.jp/i2016.htm',
    path: 'www.tdsystem.co.jp/i2016.htm'
  }, {
    year: 2015,
    url: 'http://www.tdsystem.co.jp/i2015.htm',
    path: 'www.tdsystem.co.jp/i2015.htm'
  }, {
    year: 2014,
    url: 'http://www.tdsystem.co.jp/i2014.htm',
    path: 'www.tdsystem.co.jp/i2014.htm'
  }, {
    year: 2013,
    url: 'http://www.tdsystem.co.jp/i2013.htm',
    path: 'www.tdsystem.co.jp/i2013.htm'
  }, {
    year: 2012,
    url: 'http://www.tdsystem.co.jp/i2012.htm',
    path: 'www.tdsystem.co.jp/i2012.htm'
  }];
  let db = pgp({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD
  });
  Promise.all([initVenues(db), initMeets(db)])
    .then(function(values) {
      let venues = values[0].map;
      let venueMaxId = values[0].maxId;
      let meets = values[1].map;
      let meetMaxId = values[1].maxId;
      //
      // Process each year index page
      //
      for (const yearIndex in YEAR_TOP_PAGES) {
        const yearTopPage = YEAR_TOP_PAGES[yearIndex];
        console.log('Parse ' + yearTopPage.year);
        let $ = util.parseLocalHtml(yearTopPage.path);
        let yearParseResult = yearParser.parsePage(yearTopPage.year, $);
        let meets = yearParseResult.meets;
        if (!meets) {
          console.log('No meet found.');
          continue;
        }
        console.log(meets.length + ' meets found.');
        for (let meet of meets) {
          if (!meet.name || meets[meet.name]) { // No name or already in DB
            continue;
          }
          //
          // Define meet id
          //
          meet.id = ++meetMaxId;
          //
          // Define venue id
          //
          if (!meet.venue) {
            console.log('Skipped by invalid venue info: name = ' + meet.name);
            continue;
          }
          if (venues[meet.venue.name]) {
            meet.venue.id = venues[meet.venue.name].id;
          } else {
            meet.venue.id = ++venueMaxId;
          }
        }
      }
    })
    .catch(function(err) {
      console.error('Error in main');
      console.error(err);
    });
}());

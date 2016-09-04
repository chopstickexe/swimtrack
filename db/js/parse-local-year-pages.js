(function() {
  'use strict';

  var pgp = require('pg-promise')();
  var util = require('./swimtrack-util');
  var yearParser = require('./tdsystem/year-parser');
  var meetParser = require('./tdsystem/meet-parser');
  var raceParser = require('./tdsystem/result-parser-2008');

  var getId = function(db, selectStatement, insertStatement, args) {
    return new Promise(function(resolve, reject) {
      db.oneOrNone(selectStatement, args)
        .then(function(row) {
          if(!row) {
            db.one(insertStatement, args)
              .then(function(row) {
                return resolve(row.id);
              });
          } else {
            return resolve(row.id);
          }
        })
        .catch(function(err) {
          db.oneOrNone(selectStatement, args)
            .then(function(row) { // just conflict to another insert process
              if (row) {
                return resolve(row.id);
              } else {
                return reject(err);
              }
            });
          });
        });
    };

  /**
   * Store venue
   */
  var getVenueId = function(db, venue) {
    return getId(db, 'SELECT id FROM venues WHERE name = $1 AND city = $2',
      'INSERT INTO venues(name, city) VALUES($1, $2) RETURNING id',
      [venue.name, venue.city]);
  };

  var getMeetId = function(db, venueId, meet) {
    return getId(db, 'SELECT id FROM meets WHERE name = $1 AND start_date = $2 AND venue_id = $4',
      'INSERT INTO meets(name, start_date, dates, venue_id, course) SELECT $1, $2, CAST($3 AS DATE[]), $4, $5 RETURNING id',
      [meet.name, meet.days[0], meet.days, venueId, meet.venue.course]);
  };

  var getEventId = function(db, event) {
    return getId(db, 'SELECT id FROM events WHERE sex = $1 AND distance = $2 AND style = $3 AND age = $4 AND relay = $5',
      'INSERT INTO events(sex, distance, style, age, relay) VALUES($1, $2, $3, $4, $5) RETURNING id',
      [event.sex, event.distance, event.style, event.age, event.relay]);
  };

  var getRaceId = function(db, meetId, eventId) {
    return getId(db, 'SELECT id FROM races WHERE meet_id = $1 AND event_id = $2',
      'INSERT INTO races(meet_id, event_id) VALUES($1, $2) RETURNING id',
      [meetId, eventId]);
  };

  var getResultId = function(db, raceId, result) {
    return getId(db, 'SELECT id FROM results WHERE race_id = $1 AND rank = $2 AND record = $3',
      'INSERT INTO results(race_id, rank, record) SELECT $1, $2, $3 RETURNING id',
      [raceId, result.rank, result.record]);
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
      db.none('INSERT INTO user_result(user_id, result_id) SELECT $1, $2 WHERE NOT EXISTS (SELECT * FROM user_result WHERE user_id = $1 AND result_id = $2)',
        [userId, resultId])
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
      db.none('INSERT INTO user_team_meet(user_id, team_id, meet_id) SELECT $1, $2, $3 WHERE NOT EXISTS (SELECT * FROM user_team_meet WHERE user_id = $1 AND team_id = $2 AND meet_id = $3)',
        [userId, teamId, meetId])
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
  const YEAR_TOP_PAGES = [
    {
      year: 2016,
      url: 'http://www.tdsystem.co.jp/i2016.htm',
      path: 'www.tdsystem.co.jp/i2016.htm'
    },
    {
      year: 2015,
      url: 'http://www.tdsystem.co.jp/i2015.htm',
      path: 'www.tdsystem.co.jp/i2015.htm'
    },
    {
      year: 2014,
      url: 'http://www.tdsystem.co.jp/i2014.htm',
      path: 'www.tdsystem.co.jp/i2014.htm'
    },
    {
      year: 2013,
      url: 'http://www.tdsystem.co.jp/i2013.htm',
      path: 'www.tdsystem.co.jp/i2013.htm'
    },
    {
      year: 2012,
      url: 'http://www.tdsystem.co.jp/i2012.htm',
      path: 'www.tdsystem.co.jp/i2012.htm'
    }
  ];
  let db = pgp(process.env.DATABASE_URL);
  let meetId;
  for (const yearIndex in YEAR_TOP_PAGES) {
    const yearTopPage = YEAR_TOP_PAGES[yearIndex];
    console.log('Parse ' + yearTopPage.year);
    let $ = util.parseLocalHtml(yearTopPage.path);
    let yearParseResult = yearParser.parsePage(yearTopPage.year, $);
    yearParseResult.meets.forEach(function(meet) {
      getVenueId(db, meet.venue)
        .then(function(venueId) {
          getMeetId(db, venueId, meet)
            .then(function(meetId) {
              let url = meet.url;
              if (!url) return;
              //
              // Parse meet page (PRO.HTM)
              //
              let meetPath = yearTopPage.path.substring(0, yearTopPage.path.lastIndexOf('/') + 1) + url;
              let $meet = util.parseLocalHtml(meetPath);
              let meetParseResult = meetParser.parsePage($meet);
              meetParseResult.races.forEach(function(race) {
                getEventId(db, race)
                  .then(function(eventId) {
                    getRaceId(db, meetId, eventId)
                      .then(function(raceId) {
                        processRace(db, meetId, raceId, meetPath.substring(0, meetPath.lastIndexOf('/') + 1) + race.page);
                      })
                      .catch(function(err) {
                        console.error(err);
                      });
                  })
                  .catch(function(err) {
                    console.error(err);
                  });
              });
            })
            .catch(function(err) {
              console.error(err);
            });
        }).catch(function(err){
          console.error(err);
        });
    });
  }
}());

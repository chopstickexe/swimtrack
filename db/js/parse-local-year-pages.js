(function() {
  'use strict';

  var pgp = require('pg-promise')();
  var _ = require('underscore');
  var util = require('./swimtrack-util');
  var yearParser = require('./tdsystem/year-parser');
  var meetParser = require('./tdsystem/meet-parser');
  var raceParser = require('./tdsystem/result-parser-2008');

  var getRecords = function(db, tableName, funcKey) {
    return new Promise(function(resolve, reject) {
      db.any('SELECT * FROM ' + tableName)
        .then(function(rows) {
          let ret = {};
          ret.map = {};
          ret.maxId = -1;
          for (const row of rows) {
            if (funcKey) {
              ret.map[funcKey(row)] = row;
            }
            if (ret.maxId < row.id) {
              ret.maxId = row.id;
            }
          }
          return resolve(ret);
        })
        .catch(function(err) {
          return reject(err);
        });
    });
  };

  var getName = function(obj) {
    if (!obj) {
      return '';
    }
    return obj.name;
  };

  var getEventKey = function(eventObj) {
    return eventObj.sex + ':' + eventObj.distance + ':' + eventObj.style + ':' + eventObj.age;
  };

  var getRaceKey = function(raceObj) {
    return raceObj.meet_id + ':' + raceObj.event_id;
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
  Promise.all([
      getRecords(db, 'venues', getName),
      getRecords(db, 'meets', getName),
      getRecords(db, 'events', getEventKey),
      getRecords(db, 'players', getName),
      getRecords(db, 'teams', getName),
      getRecords(db, 'races'),
      getRecords(db, 'results')
    ])
    .then(function(values) {
      let venues = values[0].map;
      let venueMaxId = values[0].maxId;
      let meets = values[1].map;
      let meetMaxId = values[1].maxId;
      let events = values[2].map;
      let eventMaxId = values[2].maxId;
      let playerMaxId = values[3].maxId;
      let teams = values[4].map;
      let teamMaxId = values[4].maxId;
      let raceMaxId = values[5].maxId;
      let resultMaxId = values[6].maxId;

      //
      // Process each year index page
      //
      for (const yearIndex in YEAR_TOP_PAGES) {
        const yearTopPage = YEAR_TOP_PAGES[yearIndex];
        console.log('Parse ' + yearTopPage.year);
        try {
          let $ = util.parseLocalHtml(yearTopPage.path);
          let yearParseResult = yearParser.parsePage(yearTopPage.year, $);

          let meetsInYear = yearParseResult.meets;
          if (!meetsInYear) {
            console.log('No meet found.');
            continue;
          }
          console.log(meetsInYear.length + ' meets found.');
          //
          // Process meets
          //
          for (let meet of meetsInYear) {
            if (!meet.name || meets[meet.name]) { // No name or already in DB
              continue;
            }
            console.log('Process ' + meet.name);
            let races = {};
            let results = [];
            let players = {};
            let playerResults = [];
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
              venues[meet.venue.name] = {
                id: meet.venue.id,
                name: meet.venue.name,
                city: meet.venue.city
              };
            }
            const meetPagePath = yearTopPage.path.substring(0, yearTopPage.path.lastIndexOf('/') + 1) + meet.url;
            meets[meet.name] = {
              id: meet.id,
              name: meet.name,
              start_date: meet.days[0],
              dates: meet.days,
              venue_id: meet.venue.id,
              course: meet.venue.course,
              url: 'http://' + meetPagePath
            };
            //
            // Parse meet page (PRO.HTM)
            //
            if (!meet.url) {
              continue;
            }
            try {
              let meetParseResult = meetParser.parsePage(util.parseLocalHtml(meetPagePath));
              for (let race of meetParseResult.races) {
                let eventKey = getEventKey(race);
                if (events[eventKey]) {
                  race.eventId = events[eventKey].id;
                } else {
                  race.eventId = ++eventMaxId;
                  events[eventKey] = {
                    id: race.eventId,
                    sex: race.sex,
                    distance: race.distance,
                    style: race.style,
                    age: race.age,
                    relay: race.relay
                  };
                }
                //
                // Define race id and generate a record for race table
                //
                const racePagePath = meetPagePath.substring(0, meetPagePath.lastIndexOf('/') + 1) + race.page;
                let raceObj = {
                  meet_id: meet.id,
                  event_id: race.eventId,
                  url: 'http://' + racePagePath
                };
                let raceKey = getRaceKey(raceObj);
                if (races[raceKey]) {
                  console.error('WARNING: Duplicated race keys: meet page = ' + meetPagePath + ', event = ' + eventKey);
                  race.id = races[raceKey].id;
                } else {
                  race.id = ++raceMaxId;
                  raceObj.id = race.id;
                  races[raceKey] = raceObj;
                }
                //
                // Parse race page (###.HTM)
                //
                try {
                  let raceParseResult = raceParser.parseDocument(util.parseLocalHtml(racePagePath));
                  for (let result of raceParseResult.results) {
                    result.id = ++resultMaxId;
                    results.push({
                      id: result.id,
                      race_id: race.id,
                      rank: result.rank,
                      record: result.record
                    });

                    if (players[result.player]) {
                      result.playerId = players[result.player].id;
                    } else {
                      result.playerId = ++playerMaxId;
                    }

                    if (teams[result.team]) {
                      result.teamId = teams[result.team].id;
                    } else {
                      result.teamId = ++teamMaxId;
                      teams[result.team] = {
                        id: result.teamId,
                        name: result.team
                      };
                    }

                    playerResults.push({
                      player_id: result.playerId,
                      result_id: result.id
                    });

                    players[result.player] = {
                      id: result.playerId,
                      name: result.player,
                      team_id: result.teamId,
                      meet_id: meet.id
                    };
                  }
                } catch (err) {
                  console.error('Failed to parse race page: ' + racePagePath);
                  console.error(err.stack);
                  continue;
                }
              }
              //
              // Insert
              //
              if (results.length === 0) {
                continue;
              }
              let raceCS = new pgp.helpers.ColumnSet(['id', 'meet_id', 'event_id', 'url'], {
                table: 'races'
              });
              let resultCS = new pgp.helpers.ColumnSet(['id', 'race_id', 'rank', 'record'], {
                table: 'results'
              });
              let playerResultCS = new pgp.helpers.ColumnSet(['player_id', 'result_id'], {
                table: 'player_result'
              });
              let playerCS = new pgp.helpers.ColumnSet([
                'id',
                'name',
                'team_id',
                'meet_id'
              ], {
                table: 'players'
              });
              //
              // Insert players
              //
              db.tx(function(t) {
                  return this.none(pgp.helpers.insert(_.values(players), playerCS));
                })
                .then(data => {
                  console.log('Succeed to insert players');
                })
                .catch(err => {
                  console.error('Failed to insert players');
                  console.error(err.stack);
                });
              let raceValues = _.values(races);
              db.tx(function(t) {
                  return this.batch([
                    this.none(pgp.helpers.insert(raceValues, raceCS)),
                    this.none(pgp.helpers.insert(results, resultCS)),
                    this.none(pgp.helpers.insert(playerResults, playerResultCS))
                  ]);
                })
                .then(data => {
                  console.log('Succeed to insert races and results: ' + meetPagePath);
                })
                .catch(err => {
                  console.error('Failed to insert races and results: ' + meetPagePath);
                  console.error(err.stack);
                });
            } catch (err) {
              console.error('Failed to parse meet page: ' + meetPagePath);
              console.error(err.stack);
              continue;
            }
          }
        } catch (err) {
          console.error('Failed to parse year top page: ' + yearTopPage);
          console.error(err.stack);
          continue;
        }
      }
      //
      // Insert venues
      //
      db.tx(function(t) {
          return this.none(pgp.helpers.insert(
            _.values(venues),
            new pgp.helpers.ColumnSet(['id', 'name', 'city'], {
              table: 'venues'
            })));
        })
        .then(data => {
          console.log('Succeed to insert venues');
        })
        .catch(err => {
          console.error('Failed to insert venues');
          console.error(err.stack);
        });
      //
      // Insert meets
      //
      db.tx(function(t) {
          return this.none(pgp.helpers.insert(
            _.values(meets),
            new pgp.helpers.ColumnSet([
              'id',
              'name',
              'start_date', {
                name: 'dates',
                cast: 'date[]'
              },
              'venue_id',
              'course',
              'url'
            ], {
              table: 'meets'
            })));
        })
        .then(data => {
          console.log('Succeed to insert meets');
        })
        .catch(err => {
          console.error('Failed to insert meets');
          console.error(err.stack);
        });
      //
      // Insert events
      //
      db.tx(function(t) {
          return this.none(pgp.helpers.insert(
            _.values(events),
            new pgp.helpers.ColumnSet([
              'id',
              'sex',
              'distance',
              'style',
              'age',
              'relay'
            ], {
              table: 'events'
            })));
        })
        .then(data => {
          console.log('Succeed to insert events');
        })
        .catch(err => {
          console.error('Failed to insert events');
          console.error(err.stack);
        });
      //
      // Insert teams
      //
      db.tx(function(t) {
          return this.none(pgp.helpers.insert(
            _.values(teams),
            new pgp.helpers.ColumnSet([
              'id',
              'name'
            ], {
              table: 'teams'
            })));
        })
        .then(data => {
          console.log('Succeed to insert teams');
        })
        .catch(err => {
          console.error('Failed to insert teams');
          console.error(err.stack);
        });
    })
    .catch(function(err) {
      console.error(err.stack);
    });
}());

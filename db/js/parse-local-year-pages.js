(function() {
  'use strict';

  var pgp = require('pg-promise')();
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
      let players = values[3].map;
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
            console.log('Process ' + meet.name);
            let races = [];
            let results = [];
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
            meets[meet.name] = {
              id: meet.id,
              name: meet.name,
              start_date: meet.days[0],
              dates: meet.days,
              venue_id: meet.venue.id,
              course: meet.venue.course
            };
            //
            // Parse meet page (PRO.HTM)
            //
            if (!meet.url) {
              continue;
            }
            const meetPagePath = yearTopPage.path.substring(0, yearTopPage.path.lastIndexOf('/') + 1) + meet.url;
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
                race.id = ++raceMaxId;
                races.push({
                  id: race.id,
                  meet_id: meet.id,
                  event_id: race.eventId
                });
                //
                // Parse race page (###.HTM)
                //
                const racePagePath = meetPagePath.substring(0, meetPagePath.lastIndexOf('/') + 1) + race.page;
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
    })
    .catch(function(err) {
      console.error(err.stack);
    });
}());

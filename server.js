(function() {
  'use strict';
  var express = require("express");
  var logger = require('morgan');
  var cookieParser = require('cookie-parser');
  var bodyParser = require('body-parser');
  var _ = require('underscore');
  var pg = require('pg');
  var url = require('url');
  var app = express();

  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: false
  }));
  app.use(cookieParser());
  app.use(express.static(__dirname + '/app'));

  app.get('/', function(request, response) {
    response.render('index.html');
  });

  /* GET records */
  const PARAMS = url.parse(process.env.DATABASE_URL);
  const AUTH = PARAMS.auth.split(':');
  let pool = new pg.Pool({
    user: AUTH[0],
    password: AUTH[1],
    host: PARAMS.hostname,
    port: PARAMS.port,
    database: PARAMS.pathname.split('/')[1],
    ssl: process.env.HEROKU ? true : false
  });

  const QUERY_BASE = 'SELECT players.name AS player_name,' +
    ' teams.name AS team_name,' +
    ' TO_CHAR(results.record, \'FMMI:SS.MS\') AS record,' +
    ' TO_CHAR(meets.start_date, \'YYYY\') AS year,' +
    ' TO_CHAR(meets.start_date, \'MM\') AS month,' +
    ' TO_CHAR(meets.start_date, \'DD\') AS day,' +
    ' meets.name AS meet_name,' +
    ' meets.course,' +
    ' meets.url AS meet_url,' +
    ' events.sex,' +
    ' events.distance,' +
    ' events.style,' +
    ' races.url AS race_url' +
    ' FROM results, players, teams, player_result, meets, events, races' +
    ' WHERE player_result.player_id = players.id' +
    ' AND players.team_id = teams.id' +
    ' AND players.meet_id = meets.id' +
    ' AND results.id = player_result.result_id' +
    ' AND results.race_id = races.id' +
    ' AND races.meet_id = meets.id' +
    ' AND races.event_id = events.id';

  const QUERY_ORDER_BY = 'ORDER BY meets.start_date';

  const DISTANCE_PAT = /([0-9]+)m/;
  app.get('/db', function(req, res) {
    let query = QUERY_BASE;
    let params = [];
    if (req.query.name && req.query.name.length > 0) {
      params.push(req.query.name);
      query += ' AND players.name = $' + params.length;
    }
    let result;
    if (req.query.distance && req.query.distance.length > 0 &&
      ((result = DISTANCE_PAT.exec(req.query.distance)) !== null)) {
      params.push(Number.parseInt(result[1]));
      query += ' AND events.distance = $' + params.length;
    }
    if (req.query.style && req.query.style.length > 0) {
      params.push(req.query.style);
      query += ' AND events.style = $' + params.length;
    }
    query += ' ' + QUERY_ORDER_BY + ';';

    pool.connect(function(err, client, done) {
      if (err) throw err;

      console.log(query);
      console.log(params);

      client.query({
        text: query,
        values: params
      }, function(err, result) {
        if (err) throw err;

        done();

        console.log("Result: " + result.rows.length);

        if (result.rows.length === 0) {
          result.rows.push({
            year: 'No result'
          });
        }

        res.send(result.rows);
      });
    });
  });

  module.exports = app;
})();

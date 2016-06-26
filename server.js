(function() {
  'use strict';
  var express = require("express");
  var logger = require('morgan');
  var cookieParser = require('cookie-parser');
  var bodyParser = require('body-parser');
  var _ = require('underscore');
  var pg = require('pg');
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
  const COLLECTION_PATH = process.env.COLLECTION_PATH + '/swimtrack';
  const SEARCH_BY_NAME_QUERY = 'SELECT users.name AS user_name,'
    + ' teams.name AS team_name,'
    + ' TO_CHAR(results.record, \'FMMI:SS.MS\') AS record,'
    + ' results.rank,'
    + ' TO_CHAR(meets.start_date, \'YYYY\') AS year,'
    + ' TO_CHAR(meets.start_date, \'MM\') AS month,'
    + ' TO_CHAR(meets.start_date, \'DD\') AS day,'
    + ' meets.name AS meet_name,'
    + ' meets.course,'
    + ' events.sex,'
    + ' events.distance,'
    + ' events.style'
    + ' FROM results, users, teams, user_team, user_result, meets, events, races'
    + ' WHERE results.id = user_result.result_id'
    + ' AND results.race_id = races.id'
    + ' AND races.meet_id = meets.id'
    + ' AND races.event_id = events.id'
    + ' AND user_result.user_id = users.id'
    + ' AND user_team.user_id = users.id'
    + ' AND user_team.team_id = teams.id'
    + ' AND users.name = $1::text'
    + ' ORDER BY meets.start_date;';
  app.get('/db', function(req, res) {
    let query = {};
    if (req.query.name && req.query.name.length > 0) {
      query.name = req.query.name;
    }
    if (req.query.distance && req.query.distance.length > 0) {
      query.distance = req.query.distance;
    }
    if (req.query.style && req.query.style.length > 0) {
      query.style = req.query.style;
    }
    pg.connect(COLLECTION_PATH, function(err, client){
      if (err) throw err;

      client.query(
        {
          name: 'search_by_name',
          text: SEARCH_BY_NAME_QUERY,
          values: [query.name]
        }, function(err, result) {
          console.log("Result: " + result.rows.length);
          res.send(result.rows);
        });
    });
  });

  module.exports = app;
})();

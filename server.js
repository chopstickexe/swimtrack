(function() {
  'use strict';
  var express = require("express");
  var logger = require('morgan');
  var cookieParser = require('cookie-parser');
  var bodyParser = require('body-parser');
  var _ = require('underscore');
  var mongodb = require('mongodb');
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
  const MONGO_DB_PATH = 'mongodb://localhost:27017/swimtrack';
  const COLLECTION = 'records';
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
    mongodb.MongoClient.connect(MONGO_DB_PATH)
      .then(function(db) {
        db.collection(COLLECTION).find(query)
          .toArray()
          .then(function(list) {
            res.send(list);
          })
          .then(function() {
            db.close();
          });
      });
  });

  module.exports = app;
})();

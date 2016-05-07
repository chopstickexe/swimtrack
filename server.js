(function() {
  'use strict';
  var express = require("express");
  var logger = require('morgan');
  var cookieParser = require('cookie-parser');
  var bodyParser = require('body-parser');
  var _ = require('underscore');
  var mongodb = require('mongodb');
  var app = express();
  mongodb.MongoClient.connect('mongodb://localhost:27017/swimtrack')
    .then(function(db) {
      app.set('views', __dirname + '/app');

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

      const MONGO_DB_PATH = 'mongodb://localhost:27017/swimtrack';
      const COLLECTION = 'records';

      /* GET home page. */
      app.get('/db', function(req, res) {
        mongodb.MongoClient.connect(MONGO_DB_PATH)
          .then(function(db) {
            db.collection(COLLECTION).find({
                name: req.query.name,
                distance: req.query.distance,
                style: req.query.style
              })
              .toArray()
              .then(function(list) {
                res.send(list);
              });
          });
      });
    });

  module.exports = app;
})();

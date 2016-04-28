var mongodb = require('mongodb');
var _ = require('underscore');
var express = require('express');
var router = express.Router();

const MONGO_DB_PATH = 'mongodb://localhost:27017/swimtrack';
const COLLECTION = 'records';

/* GET home page. */
router.get('/', function(req, res, next) {
  mongodb.MongoClient.connect(MONGO_DB_PATH)
    .then(function(db) {
      db.collection(COLLECTION).find({
          name: req.query.name,
          distance: req.query.distance,
          style: req.query.style
        })
        .toArray()
        .then(function(list) {
          res.send(_.uniq(list).sort(function(a, b) {
            if (a.year && b.year && a.year !== b.year) {
              return a.year - b.year;
            } else if (a.month && b.month && a.month !== b.month) {
              return a.month - b.month;
            } else if (a.day && b.day && a.day !== b.day) {
              return a.day - b.day;
            }
            return 0;
          }));
        })
        .then(function() {
          db.close();
        });
    });
});

module.exports = router;

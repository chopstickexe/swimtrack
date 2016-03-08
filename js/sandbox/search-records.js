var mongodb = require('mongodb');
var _ = require('underscore');
(function() {
  'use strict';
  mongodb.MongoClient.connect('mongodb://localhost:27017/swimtrack')
    .then(function(db) {
      db.collection('records').find({
          name: '川中莉紗',
          distance: '100m',
          style: '背泳ぎ'
        })
        .toArray()
        .then(function(list) {
          console.log(_.uniq(list).sort(function(a, b) {
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
}());

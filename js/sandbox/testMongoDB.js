var MongoClient = require('mongodb').MongoClient,
  test = require('assert');
MongoClient.connect('mongodb://localhost:27017/test')
  .then(function(db) {
    // Get the collection
    var col = db.collection('insert_many_with_promise');
    col.insertMany([{ a: 1 }, { a: 2 }])
      .then(function(r) {
        test.equal(2, r.insertedCount);
        // Finish up test
        db.close();
      });
  });

var fs = require('fs');
var resultParser = {
  parseDocument: function($) {
    var i = 0;
    var text = '';
    var dateVenueDelim = '　+';
    var doc = {};

    $('td').each(function(i) {
      var firstRowElms = [];
      var title, date, venue;

      if (i === 0) { // Include title, date, and venue
        firstRowElms = $(this).find('font').html().split('<br>');
        if (firstRowElms.length < 2) {
          console.log('Cannot parse the 1st row: ' + targetURL);
          return;
        }

        doc.title = firstRowElms[0].trim();
        doc.date = firstRowElms[1].substr(firstRowElms[1].indexOf('期日：') + 3, firstRowElms[1].indexOf('　')).trim();
        doc.venue = firstRowElms[1].substr(firstRowElms[1].indexOf('会場：') + 3).trim();
      }
    });

    return doc;
  }
};
module.exports = resultParser;

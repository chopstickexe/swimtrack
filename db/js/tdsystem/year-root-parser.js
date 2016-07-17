/**
 * Table of meets in the year page parser
 */
'use strict';
module.exports = (function() {
  var util = require('../swimtrack-util.js');
  let dayRe = /([0-9]+)日\([日月火水木金土・祝]+\)/g; // Allow global match (its lastIndex property is updated by a match)
  const VENUE_PAT = /^(.+)\((25m|50m)\)$/;
  let parsePage = function(year, $) {
    $('table').each(function(i) { // for table per month
      let month = i + 1;
      console.log('month: ' + month);
      $(this).find('tr').each(function(i) { // each meet
        if (i === 0) {// haeder row
          return;
        }
        let days = [];
        let meetName = '';
        let meetCity = '';
        let meetVenue = '';
        let meetCourse = '';
        let resultURL = '';
        $(this).find('td').each(function(i) { // each cell
          let fontElm = util.findLastFontElm($(this));
          let text = util.normalizeText(fontElm.text());
          switch (i) {
            case 0: // day
              let dayMatch;
              while ((dayMatch = dayRe.exec(text)) !== null) {
                console.log('day: ' + dayMatch[0]);
                days.push(dayMatch[0]);
              }
              break;
            case 1: // meet.name
              meetName = text;
              console.log('meetName: ' + meetName);
              break;
            case 2:
              meetCity = text;
              console.log('meetCity: ' + meetCity);
              break;
            case 3:
              let venueMatch = VENUE_PAT.exec(text);
              if (!venueMatch) {
                break;
              }
              meetVenue = venueMatch[1];
              console.log('meetVenue: ' + meetVenue);
              if (venueMatch[2] === '25m') {
                meetCourse = '短水路';
              } else if (venueMatch[2] === '50m') {
                meetCourse = '長水路';
              }
              console.log('meetCourse: ' + meetCourse);
              break;
            case 4:
              resultURL = fontElm.find('a').attr('href');
              console.log('URL: ' + resultURL);
              break;
          }
        });
      });
    });

    return {};
  };
  return {
    parsePage: parsePage
  };
}());

/**
 * Table of meets in the year page parser
 */
'use strict';
module.exports = (function() {
  var util = require('../swimtrack-util.js');
  let dayRe = /([0-9]+)日\([日月火水木金土・祝]+\)/g; // Allow global match (its lastIndex property is updated by a match)
  const VENUE_PAT = /^(.+)\((25m|50m)\)$/;
  let parsePage = function(year, $) {
    let ret = {};
    ret.venues = {}; // Key = name, Value = object
    ret.meets = [];
    let venueLocalId = 0;
    $('table').each(function(month) { // for table per month
      $(this).find('tr').each(function(trIndex) { // each meet
        if (trIndex === 0) {// haeder row
          return;
        }
        let venue = {};
        let meet = {};
        let $cells = $(this).find('td');
        for (let trIndex = 0; trIndex < $cells.length; trIndex++) { // each cell
          let $cell = $cells[trIndex];
          let fontElm = util.findLastFontElm($($cell));
          let text = util.normalizeText(fontElm.text());
          switch (trIndex) {
            case 0: // day
              meet.days = [];
              let dayMatch;
              while ((dayMatch = dayRe.exec(text)) !== null) {
                let date = new Date(Date.UTC(year, month, dayMatch[1]));
                meet.days.push(util.formatDate(date));
              }
              break;
            case 1: // meet name
              meet.name = text;
              break;
            case 2: // venue city
              venue.city = text;
              break;
            case 3: // venue name and course
              let venueMatch = VENUE_PAT.exec(text);
              if (!venueMatch) {
                break;
              }
              venue.name = venueMatch[1];
              let meetCourse = '';
              if (venueMatch[2] === '25m') {
                meetCourse = '短水路';
              } else if (venueMatch[2] === '50m') {
                meetCourse = '長水路';
              }
              venue.course = meetCourse;
              break;
            case 4:
              meet.url = fontElm.find('a').attr('href');
              break;
          }
        }
        if (!ret.venues[venue.name]) {
          if (venue.name) {
            venue.id = venueLocalId++;
            ret.venues[venue.name] = venue;
            meet.venueId = venue.id;
          }
        } else {
          meet.venueId = ret.venues[venue.name].id;
        }
        ret.meets.push(meet);
      });
    });

    return ret;
  };
  return {
    parsePage: parsePage
  };
}());

/**
 * Table of meets in the year page parser
 */
'use strict';
module.exports = (function() {
  var util = require('../swimtrack-util.js');
  const DATE_PAT = /([0-9]+)日\([日月火水木金土・祝]+\)/g;
  const VENUE_PAT = /^(.+)\((25m|50m)\)$/;
  const HTML_PAT = /HTM|HTML$/;
  var parsePage = function(year, $) {
    let ret = {};
    ret.meets = [];
    $('table').each(function(month) { // for table per month
      $(this).find('tr').each(function(trIndex) { // each meet
        if (trIndex === 0) {// haeder row
          return;
        }
        let meet = {};
        meet.venue = {};
        let $cells = $(this).find('td');
        for (let tdIndex = 0; tdIndex < $cells.length; tdIndex++) { // each cell
          let $cell = $cells[tdIndex];
          let fontElm = util.findLastFontElm($($cell));
          let text = util.normalizeText($($cell).text());
          switch (tdIndex) {
            case 0: // day
              meet.days = [];
              let dayMatch;
              while ((dayMatch = DATE_PAT.exec(text)) !== null) {
                let date = new Date(Date.UTC(year, month, dayMatch[1]));
                meet.days.push(util.formatDate(date));
              }
              break;
            case 1: // meet name
              meet.name = text;
              break;
            case 2: // venue city
              meet.venue.city = text;
              break;
            case 3: // venue name and course
              let venueMatch = VENUE_PAT.exec(text);
              if (!venueMatch) {
                meet.venue.name = text;
                break;
              }
              meet.venue.name = venueMatch[1];
              let meetCourse = '';
              if (venueMatch[2] === '25m') {
                meetCourse = '短水路';
              } else if (venueMatch[2] === '50m') {
                meetCourse = '長水路';
              }
              meet.venue.course = meetCourse;
              break;
            case 4: // meet page url
              meet.url = $($cell).find('a').attr('href');
              break;
          }
        }

        validateMeet(meet);
        ret.meets.push(meet);
      });
    });
    return ret;
  };

  const VALID_DATE_PAT = /^[0-9]{4}\-[0-9]{2}\-[0-9]{2}/;
  var validateMeet = function(meet) {
    //
    // Check venue
    //
    if (!meet.venue) {
      console.warn('Cannot extract meet venue', meet);
    } else {
      if (!meet.venue.city) {
        console.warn('Cannot extract venue city', meet);
      }
      if (!meet.venue.name) {
        console.warn('Cannot extract venue name', meet);
      }
      if (!meet.venue.course) {
        console.warn('Cannot extract venue course', meet)
      }
    }

    //
    // Check days
    //
    if (!meet.days || meet.days.length == 0) {
      console.warn('Cannot extract meet days', meet);
    } else {
      for (let i = 0; i < meet.days.length; i++) {
        if (!VALID_DATE_PAT.exec(meet.days[i])) {
          console.warn('Invalid date', meet);
          meet.days[i] = null;  // Remove the invalid date
        }
      }
    }

    //
    // Check name
    //
    if (!meet.name) {
      console.warn('Cannot extract meet name', meet);
    }

    //
    // Check url
    //
    if (!meet.url) {
      console.warn('Cannot extract meet url', meet);
    } else if (HTML_PAT.exec(meet.url) === null) {// not html
      console.warn('The meet page is not HTML', meet.url);
      meet.url = null;  //Remove the invalid url
    }
  }
  return {
    parsePage: parsePage
  };
}());

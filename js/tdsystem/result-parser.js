var fs = require('fs');
var resultParser = (function() {
  'use strict';
  const EVENT_PAT = /(男子|女子|混合)([^m]+m)(自由形|背泳ぎ|平泳ぎ|バタフライ|個人メドレー|フリーリレー|メドレーリレー)/;
  const RESULT_PAT = /([0-9]+)　(.+).+\((.+)\).+([0-9]+:[0-9]{2}\.[0-9]{2})/;
  var parseDocument = function($) {
    var i = 0;
    var text = '';
    var dateVenueDelim = '　+';
    var doc = {};

    $('td').each(function(i) {
      let text = $(this).find('font').text();
      let eventMatch = EVENT_PAT.exec(text.replace(/[\s　]/g,''));
      let resultMatch = RESULT_PAT.exec(text.trim());
      if (i === 0) { // Include title, date, and venue
        parseTitle(text, doc);
      } else if (eventMatch) {
        doc.sex = eventMatch[1];
        doc.distance = eventMatch[2];
        doc.style = eventMatch[3];
      } else if (resultMatch) {
        console.log(resultMatch.input);
      }
    });

    return doc;
  };
  const DATE_PREFIX = '期日：';
  const VENUE_PREFIX = '会場：';
  const DATE_PAT = /([0-9]+)年([0-9]+)月([0-9]+)日/; // TODO Parsing the 1st day only.
  const SHORT_COURSE_PAT = /\(25|２５[mMｍＭ]\)/;
  const LONG_COURSE_PAT = /\(50|５０[mMｍＭ]\)/;
  const SHORT = 'short';
  const LONG = 'long';
  var parseTitle = function(text, doc) {
    var elms = [];

    if (!text) {
      return;
    }

    if (!doc) {
      doc = {};
    }

    elms = text.trim().split(/\n/);
    if (elms.length < 2) {
      return;
    }

    doc.title = elms[0].trim();
    let dateMatch = DATE_PAT.exec(elms[1]);
    if (dateMatch) {
      doc.year = dateMatch[1];
      doc.month = dateMatch[2];
      doc.day = dateMatch[3];
    }
    let venueStart = elms[1].indexOf(VENUE_PREFIX) + VENUE_PREFIX.length;
    let courseMatch = LONG_COURSE_PAT.exec(elms[1]);
    if (!courseMatch) {
      courseMatch = SHORT_COURSE_PAT.exec(elms[1]);
    }
    doc.venue = elms[1].substr(venueStart, (courseMatch ? courseMatch.index - venueStart : elms[1].length)).trim();
    if (courseMatch) {
      if (elms[1].search(LONG_COURSE_PAT) >= 0) {
        doc.course = LONG;
      } else {
        doc.course = SHORT;
      }
    }
  };
  return {
    parseDocument: parseDocument,
    parseTitle: parseTitle
  };
}());
module.exports = resultParser;

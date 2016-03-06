var fs = require('fs');
var resultParser = (function() {
  'use strict';
  var parseDocument = function($) {
    var i = 0;
    var text = '';
    var dateVenueDelim = '　+';
    var doc = {};

    $('td').each(function(i) {
      if (i === 0) { // Include title, date, and venue
        parseTitle($(this).find('font').text(), doc);
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

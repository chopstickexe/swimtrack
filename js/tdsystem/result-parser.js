/**
 * Result HTML page parser
 */
var fs = require('fs');
var resultParser = (function() {
  'use strict';
  const EVENT_PAT = /(男子|女子|混合)([^m]+m)(自由形|背泳ぎ|平泳ぎ|バタフライ|個人メドレー|フリーリレー|メドレーリレー)/;
  const RESULT_PAT = /([0-9]+)　(.+).+\((.+)\)[^0-9:]+([0-9]*:*[0-9]{2}\.[0-9]{2})/;
  const GRADE_PAT = /([小中高大][1-6１-６])/;
  let parseDocument = function($) {
    let i = 0;
    let text = '';
    let docs = [];
    let docBase = {};

    $('td').each(function(i) {
      let text = $(this).find('font').text();
      let eventMatch = EVENT_PAT.exec(text.replace(/[\s　]/g,''));
      let resultMatch = RESULT_PAT.exec(text.trim());

      if (i === 0) { // Include title, date, and venue
        parseTitle(text, docBase);
      } else if (eventMatch) {
        docBase.sex = eventMatch[1];
        docBase.distance = eventMatch[2];
        docBase.style = eventMatch[3];
      } else if (resultMatch) {
        let doc = {};
        let name = resultMatch[2].replace(/[\s　]/g,'').trim();
        let gradeMatch = GRADE_PAT.exec(name);

        Object.assign(doc, docBase);
        doc.rank = resultMatch[1];
        doc.name = gradeMatch ? name.substr(0, gradeMatch.index) : name;
        if (gradeMatch) {
          doc.grade = gradeMatch[1];
        }
        doc.team = resultMatch[3].trim();
        doc.time = resultMatch[4];
        docs.push(doc);
      }
    });

    return docs;
  };
  const DATE_PREFIX = '期日：';
  const VENUE_PREFIX = '会場：';
  const DATE_PAT = /([0-9]+)年([0-9]+)月([0-9]+)日/; // TODO Parsing the 1st day only.
  const SHORT_COURSE_PAT = /\(25|２５[mMｍＭ]\)/;
  const LONG_COURSE_PAT = /\(50|５０[mMｍＭ]\)/;
  const SHORT = 'short';
  const LONG = 'long';
  let parseTitle = function(text, doc) {
    let elms = [];

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

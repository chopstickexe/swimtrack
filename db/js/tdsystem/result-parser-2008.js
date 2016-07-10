/**
 * Result HTML page parser for records after 2008
 */
'use strict';
var resultParser = (function() {
  const EVENT_PAT = /(男子|女子|混合)([^m]+m)(自由形|背泳ぎ|平泳ぎ|バタフライ|個人メドレー|フリーリレー|メドレーリレー)/;
  const RESULT_PAT = /([0-9]+)　(.+).+\((.+)\)[^0-9:]+([0-9]*:*[0-9]{2}\.[0-9]{2})/;
  const GRADE_PAT = /([小中高大][1-6１-６])/;
  let parseDocument = function($) {
    let i = 0;
    let text = '';
    let ret = {};
    ret.results = [];

    $('td').each(function(i) {
      let text = $(this).find('font').text();
      let eventMatch = EVENT_PAT.exec(text.replace(/[\s　]/g,''));
      let resultMatch = RESULT_PAT.exec(text.trim());

      if (i === 0) { // The 1st row include title, date, and venue
        ret.meet = parseTitle(text);
      } else if (eventMatch) {
        ret.event = {};
        ret.event.sex = eventMatch[1];
        ret.event.distance = eventMatch[2];
        ret.event.style = eventMatch[3];
      } else if (resultMatch) {
        let result = {};
        let name = resultMatch[2].replace(/[\s　]/g,'').trim();
        let gradeMatch = GRADE_PAT.exec(name);

        result.rank = resultMatch[1];
        result.name = gradeMatch ? name.substr(0, gradeMatch.index) : name;
        if (gradeMatch) {
          result.grade = gradeMatch[1];
        }
        result.team = resultMatch[3].trim();
        result.time = resultMatch[4];
        ret.results.push(result);
      }
    });

    return ret;
  };

  const DATE_PREFIX = '期日：';
  const VENUE_PREFIX = '会場：';
  const DATE_PAT = /([0-9]+)年([0-9]+)月([0-9]+)日/; // TODO Parsing the 1st day only.
  const SHORT_COURSE_PAT = /\(25|２５[mMｍＭ]\)/;
  const LONG_COURSE_PAT = /\(50|５０[mMｍＭ]\)/;
  const SHORT = '短水路';
  const LONG = '長水路';
  let parseTitle = function(text, meet) {
    let elms = [];

    if (!text) {
      return;
    }

    if (!meet) {
      meet = {};
    }

    elms = text.trim().split(/\n/);
    if (elms.length < 2) {
      return;
    }

    meet.name = elms[0].trim();
    let dateMatch = DATE_PAT.exec(elms[1]);
    if (dateMatch) {
      meet.start_date = new Date(dateMatch[1], dateMatch[2], dateMatch[3]);
    }
    let venueStart = elms[1].indexOf(VENUE_PREFIX) + VENUE_PREFIX.length;
    let courseMatch = LONG_COURSE_PAT.exec(elms[1]);
    if (!courseMatch) {
      courseMatch = SHORT_COURSE_PAT.exec(elms[1]);
    }
    meet.venue = elms[1].substr(venueStart, (courseMatch ? courseMatch.index - venueStart : elms[1].length)).trim();
    if (courseMatch) {
      if (elms[1].search(LONG_COURSE_PAT) >= 0) {
        meet.course = LONG;
      } else {
        meet.course = SHORT;
      }
    }

    return meet;
  };
  return {
    parseDocument: parseDocument,
    parseTitle: parseTitle
  };
}());
module.exports = resultParser;

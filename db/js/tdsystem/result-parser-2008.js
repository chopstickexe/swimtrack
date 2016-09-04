/**
 * Result HTML page parser for records after 2008
 */
'use strict';
module.exports = (function() {
  var util = require('../swimtrack-util.js');
  const EVENT_PAT = /(男子|女子|混合)([^m]+)m(自由形|背泳ぎ|平泳ぎ|バタフライ|個人メドレー|フリーリレー|メドレーリレー)/;
  const RELAY_PAT = /(男子|女子|混合)([^m]+)m(フリーリレー|メドレーリレー)/;
  const AGE_PAT = /([\d・~]+歳|歳以下|歳以上)/;
  const RESULT_PAT = /([0-9]+)(.+)\((.+)\)([0-9]*):*([0-9]*):*([0-9]{2}\.[0-9]{2})/;
  const GRADE_PAT = /([小中高大][1-6])/;
  let parseDocument = function($) {
    let text = '';
    let ret = {};
    let eventBase = {};
    let currentEvent = {};
    ret.results = [];

    let $lines = $('td');
    for (let lineIndex = 0; lineIndex < $lines.length; lineIndex++) {
      let text = util.normalizeText($($lines[lineIndex]).find('font').text()); // TODO $(this).text() works?
      let eventMatch = EVENT_PAT.exec(text);
      let ageMatch = AGE_PAT.exec(text);
      let resultMatch = RESULT_PAT.exec(text);
      if (eventMatch) {
        eventBase.sex = eventMatch[1];
        eventBase.distance = parseInt(eventMatch[2], 10);
        eventBase.style = eventMatch[3];
        if (RELAY_PAT.exec(text)) {
          eventBase.relay = true;
        } else {
          eventBase.relay = false;
        }
      } else if (ageMatch) {
        currentEvent = Object.assign({}, eventBase);
        currentEvent.age = ageMatch[1];
      } else if (resultMatch) {
        let result = {
          event: currentEvent
        };
        let name = resultMatch[2];
        let gradeMatch = GRADE_PAT.exec(name);

        result.rank = parseInt(resultMatch[1], 10);
        result.user = gradeMatch ? name.substr(0, gradeMatch.index) : name; // Remove grade string from name
        result.team = resultMatch[3];

        let hour = resultMatch[4];
        let min = resultMatch[5];
        let sec = resultMatch[6];
        result.record = (hour && min ? hour + ' hour ' : '') + (hour && !min ? hour + ' minute ' : '') + sec + ' seconds';
        ret.results.push(result);
      }
    }
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

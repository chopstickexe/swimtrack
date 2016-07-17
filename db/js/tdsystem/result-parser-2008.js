/**
 * Result HTML page parser for records after 2008
 */
'use strict';
module.exports = (function() {
  var util = require('../swimtrack-util.js');
  const EVENT_PAT = /(男子|女子|混合)([^m]+)m(自由形|背泳ぎ|平泳ぎ|バタフライ|個人メドレー|フリーリレー|メドレーリレー)/;
  const RELAY_PAT = /(男子|女子|混合)([^m]+)m(フリーリレー|メドレーリレー)/;
  const AGE_PAT = /([0-9]+)[~・]([0-9]+)歳/;
  const RESULT_PAT = /([0-9]+)(.+)\((.+)\)([0-9]*):*([0-9]*):*([0-9]{2}\.[0-9]{2})/;
  const GRADE_PAT = /([小中高大][1-6])/;
  let parseDocument = function(meetId, $) {
    let text = '';
    let ret = {};
    let eventBase = {};
    let currentEventId = -1;
    ret.events = [];
    ret.races = [];
    ret.users = [];
    ret.teams = [];
    ret.user_team = [];
    ret.results = [];
    ret.user_result = [];

    $('td').each(function(i) {
      let text = util.normalizeText($(this).find('font').text());
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
        let event = Object.assign({}, eventBase);
        event.age = parseInt(ageMatch[1], 10);
        ret.events.push(event);
        currentEventId++;
        ret.races.push({
          meetId: meetId,
          eventId: currentEventId
        });
      } else if (resultMatch) {
        let result = {
          raceId: currentEventId
        };
        let name = resultMatch[2].replace(/[\s　]/g,'').trim();
        let gradeMatch = GRADE_PAT.exec(name);

        result.rank = parseInt(resultMatch[1], 10);
        ret.users.push(gradeMatch ? name.substr(0, gradeMatch.index) : name);
        let userId = ret.users.length - 1;  // Suppose no one can swim over twice in the same race

        let grade;
        if (gradeMatch) {
          grade = gradeMatch[1];
        }

        let team = resultMatch[3].trim();
        let index = ret.teams.indexOf(team);
        if (index === -1) { // Does not exist
          ret.teams.push(team);
          index = ret.teams.length - 1;
        }
        ret.user_team.push({
          userId: userId,
          teamId: index
        });

        let hour = resultMatch[4];
        let min = resultMatch[5];
        let sec = resultMatch[6];
        result.record = (hour && min ? hour + ' hour ' : '') + (hour && !min ? hour + ' minute ' : '') + sec + ' seconds';
        ret.results.push(result);

        ret.user_result.push({
          userId: userId,
          resultId: ret.results.length - 1
        });
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

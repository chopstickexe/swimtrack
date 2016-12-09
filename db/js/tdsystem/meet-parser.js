/**
 * Table of meets in the year page parser
 */
'use strict';
module.exports = (function() {
  var util = require('../swimtrack-util.js');
  const EVENT_PAT = /(男子|女子|混合)(\d+)m(自由形|背泳ぎ|平泳ぎ|バタフライ|個人メドレー)/;
  const RELAY_PAT = /(男子|女子|混合)(\d+)m(フリーリレー|メドレーリレー)/;
  const AGE_PAT = /([\d・〜]+[歳才](?!以上|以下)|\d+[歳才]以下|\d[歳才]以上)/;
  let parsePage = function($) {
    let ret = {};
    ret.races = [];
    $('table').each(function(tableIndex) { // each race
      if (tableIndex === 0) {// Page header
        return;
      }

      let race = {};
      let raceText = util.normalizeText($(this).find('font').text());
      let eventMatch = EVENT_PAT.exec(raceText);
      if (eventMatch) { // Races for individuals
        race.sex = eventMatch[1];
        race.distance = Number(eventMatch[2]);
        race.style = eventMatch[3];
        race.relay = false;
      }

      let relayMatch = RELAY_PAT.exec(raceText);
      if (relayMatch) {
        race.sex = relayMatch[1];
        race.distance = Number(relayMatch[2]);
        race.style = relayMatch[3];
        race.relay = true;
      }

      let ageMatch = AGE_PAT.exec(raceText);
      if (ageMatch) {
        race.age = ageMatch[1];
      }

      race.page = $(this).find('a').attr('href');
      ret.races.push(race);
    });

    return ret;
  };
  return {
    parsePage: parsePage
  };
}());

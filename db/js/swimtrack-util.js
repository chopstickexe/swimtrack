'use strict';
module.exports = (function() {
  var normalizeText = function(text) {
    if (!text) {
      return text;
    }
    return text.normalize('NFKC').replace(/[\s]/g,'');
  };
  var findLastFontElm = function($) {
    if (!$) {
      return $;
    }
    while ($.children('font').length > 0) {
      $ = $.children('font');
    }
    return $;
  };
  var formatDate = function(date) {
    if (!date) {
      return date;
    }
    return date.toISOString().split('T')[0]; // This returns yyyy-mm-dd
  };
  return {
    normalizeText: normalizeText,
    findLastFontElm: findLastFontElm,
    formatDate: formatDate
  };
}());

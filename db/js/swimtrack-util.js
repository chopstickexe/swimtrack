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
  return {
    normalizeText: normalizeText,
    findLastFontElm: findLastFontElm
  };
}());

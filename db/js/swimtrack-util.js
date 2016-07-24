'use strict';
module.exports = (function() {
  var cheerio = require('cheerio');
  var client = require('cheerio-httpcli');
  var fs = require('fs');
  var jschardet = require('jschardet');
  var Iconv = require('iconv').Iconv;
  var sleep = require('sleep');

  const META_CONTENT_CHARSET_PAT = /charset=(.+)/;
  var getHTMLCharSet = function($) {
    let encoding;
    $('meta').each(function() {
      let content = $(this).attr('content');
      if (!content) {
        return;
      }

      let contentMatch = META_CONTENT_CHARSET_PAT.exec(content);
      if (contentMatch && contentMatch.length > 1) {
        encoding = contentMatch[1];
      }
    });
    return encoding;
  };

  var guessEncoding = function(text) {
    return jschardet.detect(text).encoding;
  };

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

  var parseLocalHtml = function(path) {
    let $;
    let text = fs.readFileSync(path);
    $ = cheerio.load(text);
    let encoding = getHTMLCharSet($);
    if (!encoding) {
      encoding = guessEncoding(text);
    }

    if (!encoding) {
      console.log('Cannot recognize encoding: ' + path);
      return;
    }
    if (encoding === 'ascii' || encoding === 'utf-8') {
      return $;
    }
    if (encoding === 'ISO-8859-2') { // Recognized as non Japanese encoding
      encoding = 'Shift_JIS';
    }
    let iconv = new Iconv(encoding, 'UTF-8//TRANSLIT//IGNORE');
    text = iconv.convert(text).toString();
    $ = cheerio.load(text); // load the converted text again

    return $;
  };


  const MAX_FETCH_INTERVAL_SECS = 5;
  var fetchRemoteHtml = function(url) {
    // Avoid excessive access
    sleep.sleep(Math.floor(Math.random() * MAX_FETCH_INTERVAL_SECS));
    console.log('Fetch: ' + url);
    let result = client.fetchSync(url);
    if (result.error) {
      console.log(result.error);
      return;
    }
    return result.$;
  };

  return {
    normalizeText: normalizeText,
    findLastFontElm: findLastFontElm,
    formatDate: formatDate,
    parseLocalHtml: parseLocalHtml,
    fetchRemoteHtml: fetchRemoteHtml
  };
}());

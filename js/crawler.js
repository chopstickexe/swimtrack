/**
 * Crawler for the pages on www.tdsystem.co.jp
 */
var client = require('cheerio-httpcli');
var url = require('url');
var sleep = require('sleep');
var crawler = function(parser, settings) {
  'use strict';
  if (!parser) {
    throw new Error('Parser is not specified.');
  }
  if (!settings) {
    settings = {};
  }
  let maxLevel = settings.maxLevel ? settings.maxLevel : 10;
  let maxIntervalSecs = settings.maxIntervalSecs ? settings.maxIntervalSecs : 5;
  let targetDomain = settings.targetDomain ? settings.targetDomain : '';
  let visited = {};

  var download = function(targetURL, level) {
    console.time('download: ' + targetURL);

    if (targetURL.indexOf(targetDomain) < 0 // Out of the target domain
      || maxLevel < level // Out of the max level from the root
      || visited[targetURL] // Already visited
    ) {
      return;
    }

    visited[targetURL] = true;

    // Avoid excessive access
    sleep.sleep(Math.floor(Math.random() * maxIntervalSecs));

    client.fetch(targetURL, 'sjis', function(err, $, res) {
      let document = {};

      if (err) {
        console.log('error: ' + err);
        return;
      }

      console.time('fetch: ' + targetURL);
      if (!$) {
        return;
      }

      let foundA = false;
      $('a').each(function() {
        let href = $(this).attr('href');
        if (!href) {
          return;
        }
        if (!foundA) {
          foundA = true;
        }
        href = url.resolve(targetURL, href).replace(/#.+$/, '');
        download(href, level + 1);
      });

      if (!foundA) { // No child link: should be a list of records
        document = parser.parseDocument($);
        document.url = targetURL;
        console.log(document);
      }
      console.timeEnd('fetch: ' + targetURL);
    });

    console.timeEnd('download: ' + targetURL);
  };

  return {
    download: download
  };
};
module.exports = crawler;

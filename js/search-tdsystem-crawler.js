var SearchTdsystemCrawler = SearchTdsystemCrawler || (function() {
  var client = require('cheerio-httpcli');
  var request = require('request');
  var fs = require('fs');
  var url = require('url');
  var path = require('path');

  var LINK_LEVEL = 3;
  var ROOT_URL = 'http://nodejs.jp/nodejs.org_ja/docs/v0.10/api/';
  var visited = {};

  downloadRec(ROOT_URL, 0);

  function downloadRec(targetURL, level) {
    var us = ROOT_URL.split('/');
    us.pop();
    var base = us.join('/');

    if (targetURL.indexOf(base) < 0 || level >= LINK_LEVEL || visited[targetURL]) {
      return;
    }

    visited[targetURL] = true;

    client.fetch(targetURL, {}, function(err, $, res) {
      var savepath;

      $('a').each(function() {
        var href = $(this).attr('href');
        if (!href) {
          return;
        }
        href = url.resolve(targetURL, href).replace(/#.+$/, '');
        downloadRec(href, level + 1);
      });

      if (targetURL.substr(targetURL.length - 1, 1) == '/') {
        targetURL += 'index.html';
      }

      savepath = targetURL.split('/').slice(2).join('/');
      checkSaveDir(savepath);
      console.log(savepath);
      fs.writeFileSync(savepath, $.html());
    });
  }

  function checkSaveDir(fname) {
    var dir = path.dirname(fname);
    var dirlist = dir.split('/');
    var p = '';
    var i;
    for (i in dirlist) {
      p += dirlist[i] + '/';
      if (!fs.existsSync(p)) {
        fs.mkdirSync(p);
      }
    }
  }

}());

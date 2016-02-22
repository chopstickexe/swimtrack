var SearchTdsystemCrawler = SearchTdsystemCrawler || (function() {
  var cheerio = require('cheerio');
  var client = require('cheerio-httpcli');
  var fs = require('fs');
  var url = require('url');
  var path = require('path');
  var sleep = require('sleep');
  var os = require('os');
  var _ = require('underscore');
  var csv = require('csv');
  var Q = require('q'),
    jschardet = require('jschardet'),
    Iconv = require('iconv').Iconv,
    recursive_readdir = require('recursive-readdir'),
    htmlFileExpr = /\.html?$/i,
    baseDir = 'www.tdsystem.co.jp',
    baseURL = 'http://www.tdsystem.co.jp',
    outFile = 'test.csv';

  var MAX_LEVEL = 10;
  var MAX_INTERVAL_SECS = 5;
  var TARGET_DOMAIN = 'www.tdsystem.co.jp';
  // var ROOT_URL = 'http://www.tdsystem.co.jp/left.html';
  var ROOT_URL = 'http://www.tdsystem.co.jp/2015/201509/23RUNEM/PRO.HTM';
  var visited = {};

  download(ROOT_URL, 0);

  function download(targetURL, level) {
    console.time('download: ' + targetURL);

    if (targetURL.indexOf(TARGET_DOMAIN) < 0 // Out of the target domain
      || MAX_LEVEL < level // Out of the max level from the root
      || visited[targetURL] // Already visited
    ) {
      return;
    }

    visited[targetURL] = true;

    // Avoid excessive access
    sleep.sleep(Math.floor(Math.random() * MAX_INTERVAL_SECS));

    client.fetch(targetURL, 'sjis', function(err, $, res) {
      if (err) {
        console.log('error: ' + err);
        return;
      }

      console.time('fetch: ' + targetURL);
      if (!$) {
        return;
      }

      var foundA = false;
      $('a').each(function() {
        var href = $(this).attr('href');
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
        parseRecordPage(targetURL, $);
      }
      console.timeEnd('fetch: ' + targetURL);
    });

    console.timeEnd('download: ' + targetURL);
  }



  function parseRecordPage(targetURL, $jQuery) {
    var i = 0;
    var text = '';
    var dateVenueDelim = '　+';

    $jQuery('td').each(function(i) {
      var firstRowElms = [];
      var title, date, venue;

      if (i === 0) { // Include title, date, and venue
        firstRowElms = $jQuery(this).find('font').html().split('<br>');
        if (firstRowElms.length < 2) {
          console.log('Cannot parse the 1st row: ' + targetURL);
          return;
        }

        title = firstRowElms[0].trim();
        date = firstRowElms[1].substr(firstRowElms[1].indexOf('期日：') + 3, firstRowElms[1].indexOf('　')).trim();
        venue = firstRowElms[1].substr(firstRowElms[1].indexOf('会場：') + 3).trim();

        fs.appendFile('titletest.csv',
          targetURL + ',' + title + ',' + date + ',' + venue + os.EOL,
          function(err) {
            if (err) {
              console.log('error = ' + err);
            }
          });
      }
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

  function readHtml(filename) {
    return Q.nfcall(fs.readFile, filename)
      .then(function(text) {
        var encoding = jschardet.detect(text).encoding,
          iconv,
          $,
          getText,
          getMetaContent,
          directory,
          title,
          keywords,
          description;

        if (encoding !== 'ascii' && encoding !== 'utf-8') {
          iconv = new Iconv(encoding, 'UTF-8//TRANSLIT//IGNORE');
          text = iconv.convert(text);
        }

        $ = cheerio.load(text);
        getText = function(selector) {
          var el = $(selector);
          return el ? el.text() : '';
        };
        getMetaContent = function(name) {
          var el = $('meta[name=' + name + ']');
          content = el ? el.attr('content') : '';
          return content ? content : '';
        };

        filename = filename.substr(baseDir.length);
        directory = path.dirname(filename);
        title = getText('title');
        keywords = getMetaContent('keywords');
        description = getMetaContent('description');
        return {
          directory: directory,
          title: title,
          keywords: keywords,
          description: description,
          URL: baseURL + filename
        };
      });
  }

  function writeCSV(results) {
    console.log(results);
  }
/**
  if (baseDir.substr(-1) === '/' && baseDir !== '/') {
    baseDir = baseDir.substr(0, baseDir.length - 1);
  }
  Q.nfcall(recursive_readdir, baseDir)
    .then(function(files) {
      var htmlFiles = _.filter(files, function(file) {
          return htmlFileExpr.test(file);
        }),
        promises = _.map(htmlFiles, function(file) {
          return readHtml(file);
        });

      return Q.all(promises);
    })
    .then(writeCSV)
    .done();
    */
}());

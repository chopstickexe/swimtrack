(function() {
  'use strict';

  var cheerio = require('cheerio');
  var fs = require('fs');
  var path = require('path');
  var Q = require('q');
  var jschardet = require('jschardet');
  var _ = require('underscore');
  var Iconv = require('iconv').Iconv;
  var recursive = require('recursive-readdir');
  var parser2008 = require('./tdsystem/result-parser-2008.js');
  var pg = require('pg');

  var PAT_HTML_FN = /\.html?$/i;
  var PAT_BASE_DIR = /.*www\.tdsystem\.co\.jp/;

  var writeStream;
  var baseDir = process.argv[2];
  var baseURL = process.argv[3];
  var db, col;

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

  function readHtml(filepath) {
    var deferred = Q.defer();
    Q.nfcall(fs.readFile, filepath)
      .then(function(text) {
        var encoding,
          iconv,
          $;

        $ = cheerio.load(text);
        encoding = getHTMLCharSet($);
        if (!encoding) {
          encoding = guessEncoding(text);
        }

        if (!encoding) {
          return;
        }

        if (encoding !== 'ascii' && encoding !== 'utf-8') {
          if (encoding === 'ISO-8859-2') { // Recognized as non Japanese encoding
            encoding = 'Shift_JIS';
          }
          iconv = new Iconv(encoding, 'UTF-8//TRANSLIT//IGNORE');
          text = iconv.convert(text).toString();
        }
        $ = cheerio.load(text); // load the converted text again
        var parsingResult = parser2008.parseDocument($); // Synchronous
        parsingResult.encoding = encoding;
        parsingResult.url = filepath.replace(PAT_BASE_DIR, baseURL);
        deferred.resolve(parsingResult);
      });
    return deferred.promise;
  }

  var META_CONTENT_CHARSET_PAT = /charset=(.+)/;

  function getHTMLCharSet($) {
    var encoding;
    $('meta').each(function() {
      var content = $(this).attr('content');
      if (content) {
        var contentMatch = META_CONTENT_CHARSET_PAT.exec(content);
        if (contentMatch && contentMatch.length > 1) {
          encoding = contentMatch[1];
          return false;
        }
      }
    });
    return encoding;
  }

  function guessEncoding(text) {
    return jschardet.detect(text).encoding;
  }

  /**
   * Main process
   */

  if (baseDir.substr(-1) === '/' && baseDir !== '/') {
    baseDir = baseDir.substr(0, baseDir.length - 1);
  }

  if (process.env.HEROKU) {
    pg.defaults.ssl = true;
  }
  const COLLECTION_PATH = process.env.DATABASE_URL;
  const SQL_INSERT_NEW_VENUE = 'INSERT INTO venues(name)' +
    ' SELECT $1::text' +
    ' WHERE NOT EXISTS (SELECT name FROM venues WHERE name = $1::text);';
  Q.nfcall(recursive, baseDir)
    .then(function(files) {
      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        console.log('file = ' + file);
      }
    });
}());

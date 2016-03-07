var cheerio = require('cheerio');
var fs = require('fs');
var path = require('path');
var Q = require('q');
var jschardet = require('jschardet');
var _ = require('underscore');
var Iconv = require('iconv').Iconv;
var recursive = require('recursive-readdir');
var parser = require('../tdsystem/result-parser.js');
var stringify = require('csv-stringify');
var mongodb = require('mongodb');

var PAT_HTML_FN = /\.html?$/i;
var PAT_BASE_DIR = /.*www\.tdsystem\.co\.jp/;

var writeStream;
var baseDir = process.argv[2];
var baseURL = process.argv[3];
var mongoServer = new mongodb.Server('localhost', 27017);
var dbHandle = new mongodb.Db('swimtrack', mongoServer, {
  safe: true
});

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
  return Q.nfcall(fs.readFile, filepath)
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
        return doc;
      }

      if (encoding !== 'ascii' && encoding !== 'utf-8') {
        if (encoding === 'ISO-8859-2') { // Recognized as non Japanese encoding
          encoding = 'Shift_JIS';
        }
        iconv = new Iconv(encoding, 'UTF-8//TRANSLIT//IGNORE');
        text = iconv.convert(text).toString();
      }
      $ = cheerio.load(text); // load the converted text again
      _.each(parser.parseDocument($), function(doc) {
        doc.encoding = encoding;
        doc.url = filepath.replace(PAT_BASE_DIR, baseURL);
        dbHandle.collection(
          'swimtrack',
          function(err, collection) {
            if (err) {
              console.log(err);
            }
            collection.insert(doc);
          }
        );
      });
    });
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

function writeCSV(result) {
  stringify(result, function(err, output) {
    if (err) {
      console.log('output: output, err: ' + err);
    }
    writeStream.write(output);
  });
}

/**
 * Main process
 */

if (baseDir.substr(-1) === '/' && baseDir !== '/') {
  baseDir = baseDir.substr(0, baseDir.length - 1);
}

var db;
Q.ninvoke(dbHandle, 'open')
  .then(function(index) {
    console.log('*** Connected to Mongo DB ***');
    db = index;
  })
  .then(function() {
    Q.nfcall(recursive, baseDir)
      .then(function(files) {
        Q.all(files.map(function(file) {
          readHtml(file);
        }));
      });
  })
  .then(function() {
    db.close(function() {
      console.log('*** DB connection closed ***');
    });
  });

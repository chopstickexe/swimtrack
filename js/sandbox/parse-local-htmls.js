var cheerio = require('cheerio');
var fs = require('fs');
var path = require('path');
var Q = require('q');
var jschardet = require('jschardet');
var _ = require('underscore');
var Iconv = require('iconv').Iconv;
var recursive = require('recursive-readdir');
var parser2008 = require('../tdsystem/result-parser-2008.js');
var stringify = require('csv-stringify');
var mongodb = require('mongodb');

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
      var docs = parser2008.parseDocument($); // Synchronous
      for (var i = 0, max = docs.length; i < max; i++) {
        var doc = docs[i];
        doc.encoding = encoding;
        doc.url = filepath.replace(PAT_BASE_DIR, baseURL);
      }
      deferred.resolve(docs);
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

mongodb.MongoClient.connect('mongodb://localhost:27017/swimtrack')
  .then(function(database) {
    db = database;
    col = db.collection('records');
    Q.nfcall(recursive, baseDir)
      .then(function(files) {
        Q.all(files.map(function(file) {
            readHtml(file).then(function(docs) {
              col.insertMany(docs)
                .then(function(r){
                  console.log('file: ' + file + ', inserted: ' + r.insertedCount);
                });
            });
          }));
      });
  });

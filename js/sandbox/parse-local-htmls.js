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

var PAT_HTML_FN = /\.html?$/i;
var PAT_BASE_DIR = /.*www\.tdsystem\.co\.jp/;

var baseDir = process.argv[2];
var baseURL = process.argv[3];
var outCSV = process.argv[4];

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
      var encoding = jschardet.detect(text).encoding,
        iconv,
        $,
        doc;

      if (!encoding) {
        return doc;
      }

      if (encoding !== 'ascii' && encoding !== 'utf-8') {
        iconv = new Iconv(encoding, 'UTF-8//TRANSLIT//IGNORE');
        text = iconv.convert(text).toString();
      }

      $ = cheerio.load(text);
      doc = parser.parseDocument($);

      doc.filepath = filepath;
      doc.url = filepath.replace(PAT_BASE_DIR, baseURL);
      return doc;
    });
}

function writeCSV(results) {
  var writeStream = fs.createWriteStream(outCSV);
  stringify(results, function(err, output){
    writeStream.write(output);
    writeStream.end();
  });
}

/**
 * Main process
 */

if (baseDir.substr(-1) === '/' && baseDir !== '/') {
  baseDir = baseDir.substr(0, baseDir.length - 1);
}
Q.nfcall(recursive, baseDir)
  .then(function(files) {
    var htmlFiles = _.filter(files, function(file) {
        return PAT_HTML_FN.test(file);
      }),
      promises = _.map(htmlFiles, function(file) {
        return readHtml(file);
      });

    return Q.all(promises);
  })
  .then(writeCSV)
  .done();

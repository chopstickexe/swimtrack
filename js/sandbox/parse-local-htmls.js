var cheerio = require('cheerio');
var fs = require('fs');
var path = require('path');
var Q = require('q');
var jschardet = require('jschardet');
var _ = require('underscore');
var Iconv = require('iconv').Iconv;
var recursive_readdir = require('recursive-readdir');
var htmlFileExpr = /\.html?$/i;
var baseDir = 'www.tdsystem.co.jp';
var baseURL = 'http://www.tdsystem.co.jp';

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
 * Main process
 */
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

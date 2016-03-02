var crawler = require('../crawler.js');
var parser = require('../tdsystem/result-parser.js');
var tdSystemCrawler = crawler(parser, { targetDomain: 'www.tdsystem.co.jp'});
tdSystemCrawler.download('http://www.tdsystem.co.jp/2015/201509/23RUNEM/PRO.HTM', 0);

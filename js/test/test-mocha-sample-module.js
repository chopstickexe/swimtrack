var assert = require('assert');
var myModule = require('../sandbox/mocha-sample-module');

describe('myModule', function () {
    describe('greet', function () {
        it('引数に応じて決まった文字列を返すこと', function () {
            assert.equal(myModule.greet('taro'), 'Hello,taro');
        });
    });
});

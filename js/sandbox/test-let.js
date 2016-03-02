(function() {
  'use strict';
  const STATIC_VAR = '定数';
  let a = 'varは使わない';

  for (let i = 0; i < 10; i++) {
    console.log(a);
  }
}());

'use strict';

/* Controllers */

var recordControllers = angular.module('myApp.recordControllers', []);

recordControllers.controller('recordCtrl', ['$scope',　'$http',
  function($scope, $http) {
    $http.get('http://localhost:3000/db?name=%E5%B7%9D%E4%B8%AD%E8%8E%89%E7%B4%97&distance=100m&style=背泳ぎ')
      .success(function(data) {
        $scope.list=data;
      });
  }]);

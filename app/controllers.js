'use strict';

/* Controllers */
var recordControllers = angular.module('myApp.recordControllers', []);

recordControllers.controller('recordCtrl', ['$scope', '$http', '_',
  function($scope, $http, _) {
    // Initialize
    $scope.distance = '25m';
    $scope.style = '自由形';

    $scope.submit = function() {
      if ($scope.name) {
        $http.get('http://localhost:3000/db?name=' + $scope.name + '&distance=' + $scope.distance + '&style=' + $scope.style)
          .success(function(data) {
            data = _.uniq(data).sort(function(a, b) {
              if (a.year && b.year && a.year !== b.year) {
                return a.year - b.year;
              } else if (a.month && b.month && a.month !== b.month) {
                return a.month - b.month;
              } else if (a.day && b.day && a.day !== b.day) {
                return a.day - b.day;
              }
              return 0;
            });
            $scope.records = data;
          });
      }
    };
  }
]);

'use strict';

/* Controllers */
var recordControllers = angular.module('myApp.recordControllers', []);

recordControllers.controller('recordCtrl', ['$scope', '$http', '_',
  function($scope, $http, _) {
    // Initialize
    $scope.distance = '25m';
    $scope.style = '自由形';

    $scope.submit = function() {
      let config = {
        params: {}
      };
      if ($scope.name && $scope.name.length > 0) {
        config.params.name = $scope.name;
      }
      if ($scope.distance != '指定なし') {
        config.params.distance = $scope.distance;
      }
      if ($scope.style != '指定なし') {
        config.params.style = $scope.style;
      }
      if ($scope.name) {
        $http.get('http://localhost:3000/db', config)
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

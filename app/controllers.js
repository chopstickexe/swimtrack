'use strict';

/* Controllers */
var recordControllers = angular.module('myApp.recordControllers', []);

recordControllers.controller('recordCtrl', ['$scope', '$http', '_',
  function($scope, $http, _) {
    $scope.submit = function() {
      var config = {
        params: {}
      };
      if ($scope.name && $scope.name.length > 0) {
        config.params.name = $scope.name;
        $http.get('/db', config)
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
    $scope.filterDistance = function(record){
      return filterRecord(record, $scope.Filter, 'distance');
    };
    $scope.filterStyle = function(record){
      return filterRecord(record, $scope.Filter, 'style');
    };
    var filterRecord = function(record, filter, recordProp) {
      if (!record || !filter) {
        return true;
      }
      let filterValues = filter[recordProp];
      if (!filterValues) {
        return true;
      }
      let matched = true;
      for (let prop in filterValues) {
        if (record[recordProp] === filterValues[prop]) {
          return true;
        }
      }
    };
  }
]);

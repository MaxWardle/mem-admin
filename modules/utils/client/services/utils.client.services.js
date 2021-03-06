'use strict';

angular.module('utils')
  .service('Utils', serviceUtils);
// -----------------------------------------------------------------------------------
//
// Service: Util Services
//
// -----------------------------------------------------------------------------------
serviceUtils.$inject = ['$http', '$uibModal'];
/* @ngInject */
function serviceUtils($http, $uibModal) {
  var getQuickLinks = function(/* req */) {
    return $http({method:'GET',url: 'api/project'});
  };
  var getCommonLayers = function(/* req */) {
    return [];
  };
  var getResearchFocus = function(/* req */) {
    return [];
  };
  var getRoles = function(/* req */) {
    return $http({method:'GET',url: 'api/roles' });
  };

  var openEntitySelectionModal = function (entities, valueString, selected, title) {
    // adapted from: http://stackoverflow.com/a/22129960/1066283
    var resolve = function(obj, path) {
      return path.split('.').reduce(function(prev, curr) {
        return prev ? prev[curr] : undefined;
      }, obj);
    };

    var modal = $uibModal.open({
      animation: true,
      templateUrl: 'modules/utils/client/views/partials/entity-select-modal.html',
      size: 'md',
      controller: function ($scope, $uibModalInstance, _, NgTableParams) {
        $scope.current = angular.copy(selected);
        $scope.tableParams = new NgTableParams({}, {dataset: entities});
        $scope.valueString = valueString;
        $scope.resolve = resolve;
        $scope.title = title;

        var index = $scope.index = function(item) {
          return _.findIndex($scope.current, function(o) { return o._id === item._id; });
        };

        $scope.toggleItem = function (item) {
          var i = index(item);
          if (i === -1) {
            $scope.current.push(item);
          } else {
            $scope.current.splice(i, 1);
          }
        };

        $scope.ok = function () {
          $uibModalInstance.close($scope.current);
        };

        $scope.cancel = function () {
          $uibModalInstance.dismiss('cancel');
        };
      }
    });

    return modal.result;
  };

  var getEpicProjects = function(/* req */) {
    var hostnameEPIC;

    switch (window.location.hostname) {
    case 'localhost':
      // Local
      hostnameEPIC = 'http://localhost:3000';
      break;

    case 'mem-mmt-dev.pathfinder.gov.bc.ca':
      // Dev
      hostnameEPIC = 'https://esm-master.pathfinder.gov.bc.ca';
      break;

    case 'mem-mmt-test.pathfinder.gov.bc.ca':
      // Test
      hostnameEPIC = 'https://test.projects.eao.gov.bc.ca';
      break;

    default:
      // Prod
      hostnameEPIC = 'https://projects.eao.gov.bc.ca';
    }

    return $http({ method:'GET', url: hostnameEPIC + '/api/projects/picklist/ext' });
  };

  return {
    // getCurrentUser: getCurrentUser
    getQuickLinks: getQuickLinks,
    // getProjectMilestones: getProjectMilestones,
    getCommonLayers: getCommonLayers,
    getResearchFocus: getResearchFocus,
    // getResearchResults: getResearchResults,
    // getProjectResearchDetail: getProjectResearchDetail,
    getRoles: getRoles,

    getEpicProjects: getEpicProjects,

    openEntitySelectionModal: openEntitySelectionModal
  };
}

var app = angular.module('BeerNotifier');

app.controller('HomeCtrl', ['$scope', '$resource', '$location',
    function($scope, $resource, $location) {
    }
]);

app.controller('LoginCtrl', ['$scope', '$http', '$location',
    function($scope, $http, $location) {
    }
]);

app.controller('UserCtrl', ['$scope', '$resource', '$location', '$routeParams',
    function($scope, $resource, $location, $routeParams) {        
    }
]);

app.controller('MeCtrl', ['$rootScope', '$scope', '$resource', '$location', 
    function($rootScope, $scope, $resource, $location) {
    }
]);

app.controller('AdminCtrl', ['$rootScope', '$scope', '$resource', '$location',
    function($rootScope, $scope, $resource, $location) {
    }
]);

app.controller('NavbarCtrl', ['$rootScope', '$scope', '$http', '$location',
    function($rootScope, $scope, $http, $location) {
        $scope.user = $rootScope.user;
    }
]);
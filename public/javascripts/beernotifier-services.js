var app = angular.module('BeerNotifier');

app.factory('LogoutService', function($rootScope, $http, $location, $window, $route) {
    return function() {
        $rootScope.user = null;
        delete $window.localStorage.token;
        $location.path('/');
        $route.reload();
    };          
});

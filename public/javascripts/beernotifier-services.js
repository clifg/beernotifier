var app = angular.module('BeerNotifier');

app.factory('LogoutService', function($rootScope, $http, $location) {
    return function() {
        console.log('logging out...');
        $http.get('/logout')
            .then(function() {
                console.log('logged out!');
                $rootScope.user = null;
                $location.path('/');
            });
    };          
});

var app = angular.module('BeerNotifier', ['ui.bootstrap', 'ngResource', 'ngRoute']);

app.config(['$routeProvider', function($routeProvider){
    $routeProvider
        .when('/', {
            templateUrl: 'partials/home.html',
            controller: 'HomeCtrl'
        })
        .when('/me', {
            templateUrl: 'partials/user.html',
            controller: 'MeCtrl'
        })
        .when('/admin', {
            templateUrl: 'partials/admin.html',
            controller: 'AdminCtrl'
        })
        .when('/login', {
            templateUrl: 'partials/login.html',
            controller: 'LoginCtrl'
        })
        .when('/logout', {
            resolve: {
                logout: ['LogoutService', function(LogoutService) {
                    LogoutService();
                }]
            }
        })
        .when('/signup', {
            templateUrl: 'partials/signup.html',
            controller: 'SignupCtrl'
        })
        .otherwise({
            redirectTo: '/'
        });
}]);

app.run(['$rootScope', '$resource', '$location', '$route', function($rootScope, $resource, $location, $route) {
    $rootScope.$on('$routeChangeStart', function(event, next, current) {
        if ($rootScope.user == null)
        {
            var Login = $resource('/api/v1/login');

            Login.get(function(user) {
                // We're logged in -- store the user for everyone to use
                $rootScope.user = user;
            }, function() {
                // If we fail, redirect the user to log in
                if (next.templateUrl != 'partials/login.html' && next.templateUrl != 'partials/signup.html')
                {
                    $location.url('/login');
                    $route.reload();
                }
            });
        }
    });
}]);

// TODO: Move directives to their own file
app.directive('header', function() {
    return {
        restrict: 'A',
        templateUrl: 'partials/header.html',
        controller: 'NavbarCtrl'
    }
});

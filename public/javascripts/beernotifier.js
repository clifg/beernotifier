var app = angular.module('BeerNotifier', ['ui.bootstrap', 'chart.js', 'ngResource', 'ngRoute']);

app.config(['$routeProvider', function($routeProvider){
    $routeProvider
        .when('/', {
            templateUrl: 'partials/home.html',
            controller: 'HomeCtrl'
        })
        .when('/location/:id', {
            templateUrl: 'partials/location.html',
            controller: 'LocationCtrl'
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

app.factory('authInterceptor', function($rootScope, $q, $window, $location) {
    return {
        request: function(config) {
            config.headers = config.headers || {};
            if ($window.localStorage.token) {
                config.headers.Authorization = 'Bearer ' + $window.localStorage.token;
            }
            return config;
        },
        response: function(response) {
            if (response.status === 401) {
                // TODO: Handle auth failures
                $location.url('/login');
            }
            return response || $q.when(response);
        }
    };
});

app.config(function ($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
});

app.run(['$rootScope', '$http', '$location', '$route', function($rootScope, $http, $location, $route) {
    $rootScope.$on('$routeChangeStart', function(event, next, current) {
        if ($rootScope.user == null)
        {
            $http.get('/api/v1/login')
                .success(function(user) {
                    // We're logged in -- store the user for everyone to use
                    $rootScope.user = user;
                })
                .error(function() {
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

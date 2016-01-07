var app = angular.module('BeerNotifier');

app.controller('HomeCtrl', ['$scope', '$resource', '$location',
    function($scope, $resource, $location) {
    }
]);

app.controller('LoginCtrl', ['$scope', '$rootScope', '$http', '$location',
    function($scope, $rootScope, $http, $location) {
        if ($rootScope.user) {
            return $location.path('/');
        };

        $scope.alerts = [];

        $scope.login = function(email, password) {
            $http.post('/login', { email: email, password: password })
                .then(function(response) {
                    $location.path('/');
                }, function(response) {
                    addAlert(response.data, 'danger');
                });
        };

        var addAlert = function(alertMsg, alertType) {
            $scope.alerts.push({msg: alertMsg, type: alertType });
        };

        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };
    }
]);

app.controller('SignupCtrl', ['$scope', '$http', '$location', 
    function($scope, $http, $location) {
        $scope.alerts = [];

        $scope.signup = function(email, password) {
            $scope.alerts = [];
            $http.post('/signup', { email: email, password: password })
                .then(function(response) {
                    //$location.path('/');
                    addAlert('A confirmation email has been sent to ' + email + '. Once you have confirmed your address, you can log in');
                }, function(response) {
                    console.dir(response);
                    addAlert(response.data, 'warning');
                });
        };

        function addAlert(alertMsg, alertType) {
            $scope.alerts.push({ msg: alertMsg, type: alertType });
        };

        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };
    }
]);

app.controller('LogoutCtrl', ['$scope', '$rootScope', '$http', '$location',
    function($scope, $rootScope, $http, $location) {
        console.log('logging out...');
        $http.get('/api/v1/logout')
            .then(function() {
                console.log('logged out!');
                $rootScope.user = null;
                $location.path('/');
            });
}]);

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
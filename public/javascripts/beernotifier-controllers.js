var app = angular.module('BeerNotifier');

app.controller('HomeCtrl', ['$scope', '$resource', '$location', '$http',
    function($scope, $resource, $location, $http) {
        $http.get('/api/v1/dataSources')
            .success(function(dataSources) {
            $scope.dataSources = dataSources;
            $http.get('/api/v1/tapListings?active=true')
                .success(function(listings) {
                    $scope.activeListings = listings.map(function(listing) {
                        listing.friendlyCreatedDate = moment(listing.createdDate).format('MM/DD/YYYY h:mma');
                        if (listing.removedDate) {
                            listing.friendlyRemovedDate = moment(listing.removedDate).format();
                        }
                        return listing;
                    });
                }); 
            });

        $scope.updateFilters = function() {
            $scope.filterSet = false;
            $scope.dataSources.forEach(function(source) {
                if (source.checked && source.checked === true) {
                    $scope.filterSet = true;
                }
            });
        };

        $scope.clearFilter = function() {
            $scope.filterSet = false;
            $scope.dataSources.forEach(function(source) {
                if (source.checked) {
                    source.checked = false;
                }
            });
        };

        $scope.filterListings = function(item) {
            var selectedSourceIds = [];
            $scope.dataSources.forEach(function(source) {
                if (source.checked && source.checked === true) {
                    selectedSourceIds.push(source._id);
                }
            });

            if (selectedSourceIds.length === 0) {
                return true;
            }

            for (var i = 0; i < selectedSourceIds.length; i++) {
                if (selectedSourceIds[i] === item.dataSource._id) {
                    return true;
                }
            }

            return false;
        };
    }
]);

app.controller('LocationCtrl', ['$scope', '$resource', '$location', '$http', '$routeParams',
    function($scope, $resource, $location, $http, $routeParams) {
        $http.get('/api/v1/dataSources/' + $routeParams.id)
            .success(function(dataSource) {
                $scope.dataSource = dataSource;

                // Create buckets of dates from today, going two weeks back
                var date = new Date();
                var updateCounts = {};
                for (var i = 0; i < 14; i++)
                {
                    updateCounts[date.toDateString()] = 0;
                    date.setDate(date.getDate() - 1);
                }

                // Aggregate our update timestamps by day
                dataSource.updates.forEach(function(update) {
                    var date = new Date(update);
                    if (updateCounts.hasOwnProperty(date.toDateString())) {
                        updateCounts[date.toDateString()] = updateCounts[date.toDateString()] + 1;
                    }
                });

                var updateData = [];
                var labels = [];
                var data = [];
                for (var property in updateCounts) {
                    if (updateCounts.hasOwnProperty(property)) {
                        labels.push(moment(property).format('MMM DD'));
                        data.push(updateCounts[property]);
                    }
                }

                $scope.labels = labels.reverse();
                $scope.data = [data.reverse()];
                $scope.series = ['Updates'];
                $scope.options = {
                    scaleOverride: true,
                    scaleStartValue: 0,
                    scaleStepWidth: 5,
                    scaleSteps: 4,
                    scaleBeginsAtZero: true
                };
            });
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
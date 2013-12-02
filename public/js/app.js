// Declare app level module which depends on filters, and services

angular.module(
        'LastFmRecs',
        [ 'LastFmRecs.controllers', 'LastFmRecs.filters',
                'LastFmRecs.services', 'LastFmRecs.directives' ]).config(
        function($routeProvider, $locationProvider) {
	        $routeProvider.when('/view1', {
	            templateUrl : 'views/partials/partial1.html',
	            controller : 'MyCtrl1'
	        }).when('/view2', {
	            templateUrl : 'views/partials/partial2.html',
	            controller : 'MyCtrl2'
	        }).when('/recs', {
	            templateUrl : 'views/partials/recs.html',
	            controller : 'RecsCtrl'
	        }).otherwise({
		        redirectTo : '/'
	        });

	        $locationProvider.html5Mode(true);
        });

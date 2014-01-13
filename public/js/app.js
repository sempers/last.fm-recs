// Declare app level module which depends on filters, and services

angular.module('LastFmRecs', [ 'LastFmRecs.controllers', 'LastFmRecs.filters', 'LastFmRecs.services', 'LastFmRecs.directives' ]).config(
    function ($routeProvider, $locationProvider) {
        $routeProvider.when('/recs', {
            templateUrl: 'views/partials/recs.html',
            controller: 'RecsCtrl'
        }).otherwise({
                redirectTo: '/'
            });
        $locationProvider.html5Mode(true);
    });

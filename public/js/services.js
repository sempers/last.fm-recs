'use strict';

/* Services */

// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('LastFmRecs.services', [ 'ngResource' ]).value('version', '0.1');
// .factory(
// 'Recs',
// function($resource, params) {
// return $resource('/api/recs?token=' + params.token
// + "&api_key=" + params.api_key + "&secret="
// + params.secret);
// });

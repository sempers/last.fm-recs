'use strict';

/* Filters */

angular.module('LastFmRecs.filters', []).filter('interpolate',
        function(version) {
	        return function(text) {
		        return String(text).replace(/\%VERSION\%/mg, version);
	        }
        }).filter('plusify', function(str) {
	return function() {
		return String(str).replace(" ", "+");
	};
});

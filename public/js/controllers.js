/* Controllers */

var API_KEY = "fd8d4265788a4e32babff5ae3d9d972b";
var SECRET = "511db146e8da538516343b2bbd6b1b04";

angular.module('LastFmRecs.controllers', []).controller('AppCtrl', function($scope, $http, $location) {
	$scope.authorized = false;
	$scope.api_key = API_KEY;
	$scope.secret = SECRET;
	//$scope.hostUrl = "http://localhost:3000";
	$scope.hostUrl = "http://lfmrecs.herokuapp.com";
	$scope.token = $location.search().token || localStorage['token'];
	if ($scope.token) {
		$scope.authorized = true;
		localStorage['token'] = $scope.token;
	}
	$http({
	    method : 'GET',
	    url : '/api/name'
	}).success(function(data, status, headers, config) {
		$scope.name = data.name;
	}).error(function(data, status, headers, config) {
		$scope.name = 'Error!'
	});
}).controller('MyCtrl1', function($scope) {
	// write Ctrl here

}).controller('MyCtrl2', function($scope) {
	// write Ctrl here

}).controller('RecsCtrl', function($scope, $http) {
	$scope.recs = [];
	$scope.limit = (localStorage["lastFmRecsLimit"]) ? parseInt(localStorage["lastFmRecsLimit"], 10) : 200;

	$scope.validateLimit = function() {
		if ($scope.limit <= 0 || $scope.limit > 250) {
			$scope.status = "Bad limit. Enter a number between 0 and 251 please.";
			if ($scope.limit > 250)
				$scope.limit = 250;
			if ($scope.limit <= 0)
				$scope.limit = 1;
		} else
			$scope.status = "OK";
	};

	$scope.reload = function() {
		$scope.status = "Recommendations are loading...";
		localStorage["lastFmRecsLimit"] = $scope.limit;
		$http.get("/api/recs", {
			params : {
			    api_key : $scope.api_key,
			    token : $scope.token,
			    secret : $scope.secret,
			    limit : $scope.limit
			}
		}).success(function(data, status) {
			var recs = data.data;
			recs.forEach(function (r) { 
				r.playcount = parseInt(r.playcount, 10);
				r.listeners = parseInt(r.listeners, 10);
			});
			$scope.recs = recs;
			$scope.status = data.status;
		});
	}

	$scope.reload();

	$scope.queryTag = "";
	var ascOrder = "glyphicon glyphicon-chevron-down"; // predicate
	var descOrder = "glyphicon glyphicon-chevron-up"; // predicate ; reverse = true
	$scope.orderPredicate = "playcount; reverse = true"; //descOrder

	$scope.switchIcon = function(id) {
		var el = document.getElementById(id);
		el.className = (el.className === ascOrder) ? descOrder : ascOrder;
	};

	$scope.playCountHeaderClick = function() {
		var el = document.getElementById("pc_btn");
		$scope.orderPredicate = (el.className === ascOrder) ? "playcount; reverse = true" : "playcount";
		el.className = (el.className === ascOrder) ? descOrder : ascOrder;
	};

	$scope.listenersHeaderClick = function() {
		var el = document.getElementById("ls_btn");
		$scope.orderPredicate = (el.className === ascOrder) ? "listeners; reverse = true" : "listeners";
		el.className = (el.className === ascOrder) ? descOrder : ascOrder;
	};

	$scope.filterByTag = function(query, obj) {
		var queries = query.split("|");
		for ( var i = 0; i < queries.length; i++) {
			if (obj.tags.indexOf(queries[i]) > 0)
				return true;
		}
		return false;
	};
});

/* Controllers */

var API_KEY = "fd8d4265788a4e32babff5ae3d9d972b";
var SECRET = "511db146e8da538516343b2bbd6b1b04";

angular.module('LastFmRecs.controllers', []).controller('AppCtrl', function($scope, $http, $location) {
	$scope.api_key = API_KEY;
	$scope.secret = SECRET;
	$scope.hostUrl = "http://" + $location.host() + (($location.port() !== 80) ? ":" + $location.port() : "");
	$scope.token = $location.search().token || localStorage['token'];
	$scope.authorized = false;
	$scope.sk = null;

	if ($scope.token) {
		localStorage['token'] = $scope.token;
		$http.get("/api/sk", {
			params : {
			    api_key : $scope.api_key,
			    token : $scope.token,
			    secret : $scope.secret
			}
		}).success(function(data, status) {
			if (data && data.sk) {
				$scope.sk = data.sk;
				$scope.authorized = true;
			}
		});
	}
})

.controller('RecsCtrl', function($scope, $http) {
	$scope.recs = [];
	$scope.limit = (localStorage["lastFmRecsLimit"]) ? parseInt(localStorage["lastFmRecsLimit"], 10) : 100;
	$scope.status = "Wait for recommendations to load...";

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
		console.log($scope.status);
		$scope.status = "Recommendations are reloading...";
		localStorage["lastFmRecsLimit"] = $scope.limit;
		$http.get("/api/recs", {
			params : {
			    api_key : $scope.api_key,
			    sk : $scope.sk,
			    secret : $scope.secret,
			    limit : $scope.limit
			}
		}).success(function(data, status) {
			$scope.recs = data.data;
			$scope.status = data.status;
		});
	};

	$scope.p_playcount = function(obj) {
		return parseInt(obj.playcount, 10);
	};
	$scope.p_listeners = function(obj) {
		return parseInt(obj.listeners, 10);
	};

	$scope.queryTag = "";
	var ascOrder = "glyphicon glyphicon-chevron-down"; // reverse = false;
	var descOrder = "glyphicon glyphicon-chevron-up"; // reverse = true;
	$scope.orderPredicate = $scope.p_playcount;
	$scope.reverse = true;

	$scope.switchIcon = function(id) {
		var el = document.getElementById(id);
		el.className = (el.className === ascOrder) ? descOrder : ascOrder;
	};

	$scope.playCountHeaderClick = function() {
		$scope.switchIcon("pc_btn");
		$scope.orderPredicate = $scope.p_playcount;
		$scope.reverse = !$scope.reverse;
	};

	$scope.listenersHeaderClick = function() {
		$scope.switchIcon("ls_btn");
		$scope.orderPredicate = $scope.p_listeners;
		$scope.reverse = !$scope.reverse;
	};

	$scope.filterByTag = function(query, obj) {
		return (obj.tags.indexOf(query) > 0);
	};

	setTimeout(function() {
		if ($scope.authorized && $scope.sk) {
			$scope.reload();
		} else {
			setTimeout(arguments.callee, 1000);
		}
	}, 0);
});

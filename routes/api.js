var util = require('util');
var db = require('./db');
var async = require('async');
var request = require('request');
var qs = require('querystring');
var crypto = require('crypto');

var cache_api_key = "fd8d4265788a4e32babff5ae3d9d972b";
var lastFmService = "http://ws.audioscrobbler.com/2.0/?";

var dummy_data = [ {
    "name" : "Foo fighters",
    "image" : "http://userserve-ak.last.fm/serve/34/202888.jpg",
    "tags" : "rock, alternative rock, Grunge, alternative, hard rock",
    "playcount" : "153258211",
    "listeners" : "3555975"
}, {
    "name" : "Metallica",
    "image" : "http://userserve-ak.last.fm/serve/34/7560709.jpg",
    "tags" : "thrash metal, metal, heavy metal, hard rock, rock",
    "playcount" : "220859802",
    "listeners" : "2437853"
}, {
    "name" : "My Chemical Romance",
    "image" : "http://userserve-ak.last.fm/serve/34/25245555.jpg",
    "tags" : "rock, emo, alternative, punk rock, punk",
    "playcount" : "108096462",
    "listeners" : "2047898"
} ];

exports.name = function(req, res) {
	res.json({
		name : 'my friend'
	});
};

// загрузить тэги в строчку
function loadTags(artist, api_key, max, callback) {
	request(lastFmService + qs.stringify({
	    method : "artist.gettoptags",
	    artist : artist,
	    api_key : api_key,
	    format : "json"
	}), function(error, response, body) {
		if (!error && response.statusCode == 200) {
			body = JSON.parse(body);
			var tags = [];
			try {
				tags = body.toptags.tag.map(function(x) {
					return x.name;
				});
			} catch (e) {
				tags = [];
			}
			if (max)
				tags = tags.slice(0, parseInt(max, 10));
			callback(tags.join(", "));
		} else
			callback(null);
	});
}

// загрузить информацию (playcount, listeners)
function loadInfo(artist, api_key, callback) {
	request(lastFmService + qs.stringify({
	    method : "artist.getInfo",
	    artist : artist,
	    api_key : api_key,
	    format : "json"
	}), function(error, response, body) {
		if (!error && response.statusCode === 200) {
			callback((JSON.parse(body)).artist.stats);
		} else
			callback(null);
	});
}

exports.tags = function(req, res) {
	if (!cache_api_key) {
		res.json("Api_key unknown");
		return;
	}

	loadTags(req.params["name"], cache_api_key, req.query.max, function(data) {
		console.log(data);
		res.json(data);
	});
};

function getSignature(params, secret) {
	var s = '';
	var keys = (Object.keys(params)).sort();
	for ( var i = 0; i < keys.length; i++)
		s += keys[i] + params[keys[i]];
	s += secret;
	return crypto.createHash('md5').update(s).digest('hex');
}

function buildParams(params, secret) {
	params.api_sig = getSignature(params, secret);
	params.format = "json";
	return params;
}

function processArtists(artists, api_key, limit, callback) {
	var result = [];
	var LIMIT = limit;
	var gotFromLastFm = 0;
	var gotFromCache = 0;
	var recordsInserted = 0;

	console.log("processArtists started.")

	function addArtist(artist) {
		result.push(artist);
	}

	function getImage(a) {
		if (!a["image"] || a["image"].length === 0)
			return "";
		return (a["image"].length > 1) ? a["image"][1]["#text"] : a["image"][0]["#text"];
	}

	function processArtist(artist) {
		var rec = {
		    name : artist["name"],
		    playcount : 0,
		    listeners : 0,
		    image : getImage(artist),
		    tags : ""
		};

		// пытаемся прочитать в кэше
		db.readOne(rec.name, function(row) {
			if (row) {
				gotFromCache++;
				addArtist(row);
			} else {
				gotFromLastFm++;
				// получаем статистику по артисту
				loadInfo(rec.name, api_key, function(data) {
					if (data) {
						rec.playcount = data.playcount;
						rec.listeners = data.listeners;
					}
					// получаем тэги
					loadTags(rec.name, api_key, 5, function(data) {
						rec.tags = data || "";
						db.insert(rec);
						recordsInserted++;
						addArtist(rec);
					});
				});
			}
		});
	}

	for ( var i = 0; i < artists.length; i++) {
		processArtist(artists[i]);
	}

	setTimeout(function() {
		if (result.length === artists.length) {
			console.log("processArtists ended. Got records from Last.fm: ", gotFromLastFm, ", got records from local cache: ", gotFromCache,
			        ", records inserted to cache: ", recordsInserted);
			callback(result);
		} else {
			setTimeout(arguments.callee, 1000);
		}
	}, 1000);
}

exports.sk = function(req, res) {
	var token = req.query.token;
	var api_key = req.query.api_key;
	var secret = req.query.secret;

	var blankResult = {
	    sk : "",
	    status : ""
	};

	if (!token) {
		blankResult.status = "No token found.";
		res.json(blankResult);
		return;
	}

	// 1. Getting session key
	var params = {
	    method : "auth.getSession",
	    api_key : api_key,
	    token : token,
	};

	request(lastFmService + qs.stringify(buildParams(params, secret)), function(error, response, body) {
		if (error || response.statusCode !== 200) {
			blankResult.status = "getSession error. Try to authorize again.";
			res.json(blankResult);
			return;
		}

		var sk = "";

		try {
			sk = (JSON.parse(body)).session.key;
		} catch (e) {
			blankResult.status = "Invalid session key. Try to authorize again.";
			res.json(blankResult);
			return;
		}
		console.log("Got session key: ", sk);
		res.json({
		    sk : sk,
		    status : "OK"
		});
	});
};

exports.recs = function(req, res) {
	var sk = req.query.sk;
	var api_key = req.query.api_key;
	if (api_key)
		cache_api_key = api_key;
	var secret = req.query.secret;
	var limit = req.query.limit || 200;

	console.log("Starting getting recs: sk=", sk, " api_key=", api_key, " secret=", secret);
	var blankResult = {
	    data : [],
	    status : "blank"
	};

	if (!sk) {
		blankResult.status = "No session key found.";
		res.json(blankResult);
		return;
	}

	// 2. Getting recommended artists
	var params = {
	    method : "user.getRecommendedArtists",
	    api_key : api_key,
	    sk : sk,
	    limit : limit
	};
	// call getRecommendedArtists
	request(lastFmService + qs.stringify(buildParams(params, secret)), function(error1, response1, body1) {
		if (error1 || response1.statusCode !== 200) {
			blankResult.status = "getRecommendedArtists error. Probable authorization error. Try to reauthorize.";
			res.json(blankResult);
			return;
		}
		console.log("Recommendations loaded. Filling up values.");
		var artists = [];
		try {
			artists = (JSON.parse(body1)).recommendations.artist;
		} catch (e) {
			blankResult.status = "Bad recommendations. Probable authorization error. Try to reauthorize.";
			res.json(blankResult);
			return;
		}

		// 3. filling tags field
		processArtists(artists, api_key, limit, function(data) {
			console.log("Recs successfully retrieved!");
			res.json({
			    data : data,
			    status : "OK"
			});
		});
	});
};
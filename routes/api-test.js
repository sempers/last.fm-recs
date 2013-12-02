var request = require('request');
var qs = require('querystring');

var artist = "Metallica";
var api_key = "fd8d4265788a4e32babff5ae3d9d972b";

var _params = {
    api_key : api_key,
    method : "auth.getSession",
    token : ""
}

function getSignature(params, secret) {
	var s = '';
	for ( var p in params) {
		if (!params.hasOwnProperty(p))
			continue;
		s += p + params[p];
	}
	s += secret;
	return crypto.createHash('md5').update(s).digest('hex');
}
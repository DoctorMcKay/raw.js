var request = require('request');

var Exception = require('./exception.js');

module.exports = reddit;
global.reddit = reddit;

require('util').inherits(reddit, require('events').EventEmitter);

require('./handlers.js');
require('./simplerequests.js');

require('./api/identity.js');
require('./api/modposts.js');

function reddit(userAgent) {
	this._userAgent = userAgent;
}

reddit.prototype.setupOAuth2 = function(id, secret, redirectUri) {
	this._oauth2 = {
		id: id,
		secret: secret,
		redirectUri: redirectUri
	};
	
	this._rateLimit;
};

reddit.prototype.authUrl = function(state, scopes, permanent) {
	if(!this._oauth2) {
		throw new Exception("OAuth2 has not yet been set up, use reddit.setupOAuth2(id, secret, redirectUri) to set up OAuth2");
	}
	
	return "https://ssl.reddit.com/api/v1/authorize?client_id=" + encodeURIComponent(this._oauth2.id)
		+ "&response_type=code"
		+ "&state="	+ encodeURIComponent(state)
		+ "&redirect_uri=" + encodeURIComponent(this._oauth2.redirectUri)
		+ "&duration=" + ((!!permanent) ? "permanent" : "temporary")
		+ "&scope=" + encodeURIComponent(scopes.join(','));
};

reddit.prototype._apiRequest = function(endpoint, options, callback) {
	var defaults = {
		"domain": "https://oauth.reddit.com",
		"method": "GET",
		"path": "/api"
	};
	
	for(var i in defaults) {
		if(options[i] == undefined) {
			options[i] = defaults[i];
		}
	}
	
	if(options.version) {
		options.path += "/v" + options.version;
	}
	
	options.headers = options.headers || {};
	options.headers["User-Agent"] = this._userAgent;
	
	if(this.bearerToken && !options.inAuthorizationFlow) {
		options.headers["Authorization"] = "bearer " + this.bearerToken;
	} else if(this._oauth2) {
		options.auth = {"user": this._oauth2.id, "pass": this._oauth2.secret};
	}
	
	var req = {
		"uri": options.domain + options.path + '/' + endpoint,
		"method": options.method,
		"form": options.form,
		"qs": options.qs,
		"headers": options.headers,
		"auth": options.auth
	};
	
	var self = this;
	this.emit('debug-apirequest', req);
	request(req, function(err, response, body) {
		if(response && response.headers && response.headers['x-ratelimit-remaining'] != undefined && response.headers['x-ratelimit-used'] != undefined && response.headers['x-ratelimit-reset'] != undefined) {
			self._rateLimit = {
				"remaining": parseInt(response.headers['x-ratelimit-remaining']),
				"used": parseInt(response.headers['x-ratelimit-used']),
				"reset": Math.floor(Date.now() / 1000) + parseInt(response.headers['x-ratelimit-reset'])
			};
		}
		
		if(response.statusCode >= 400) {
			var codeDescriptions = {
				'400': "Bad Request",
				'403': "Forbidden",
				'404': "Not Found",
				'500': "Internal Server Error"
			};
			
			callback((codeDescriptions[response.statusCode] != undefined) ? response.statusCode + ": " + codeDescriptions[response.statusCode] : response.statusCode);
			return;
		}
		
		callback(err, response, body);
	});
};

reddit.prototype.auth = function(options, callback) {
	var self = this;
	
	if(typeof options == 'function') {
		callback = options;
		options = {};
	}
	
	if(options.code) {
		// Normal OAuth2 authorization flow
		form = {
			"grant_type": "authorization_code",
			"code": options.code,
			"redirect_uri": this._oauth2.redirectUri
		};
	} else if(options.username) {
		// Script authorization flow with client username and password
		form = {
			"grant_type": "password",
			"username": options.username,
			"password": options.password
		};
	} else {
		// Getting a new bearer token from a refresh token
		form = {
			"grant_type": "refresh_token",
			"refresh_token": self.refreshToken
		};
	}
	
	self._apiRequest("access_token", {"domain": "https://ssl.reddit.com", "method": "POST", "version": 1, "form": form, "inAuthorizationFlow": true}, function(err, response, body) {
		if(err) {
			callback(err);
			return;
		}
		
		try {
			var json = JSON.parse(body);
			if(json.error) {
				callback(json.error);
				return;
			}
			
			self.bearerToken = json.access_token;
			
			if(json.refresh_token) {
				self.refreshToken = json.refresh_token;
			}
			
			if(self.refreshToken) {
				// If we have a refresh token, set a timer to automatically refresh it when our bearer token expires
				self._refreshTimeout = setTimeout(function() {
					self.auth(function(err, data) {
						if(err) {
							self.emit('error', "Unable to refresh bearer token: " + err);
						}
					});
				}, (json.expires_in - 60) * 1000);
			} else if(options.username) {
				// If we're logged in as a script, set a timer to automatically refresh the login when our bearer token expires
				self._refreshTimeout = setTimeout(function() {
					self.auth(options, function(err, data) {
						if(err) {
							self.emit('error', "Unable to get new bearer token: " + err);
						}
					});
				}, (json.expires_in - 60) * 1000);
			}
			
			json.scope = json.scope.split(',');
			
			callback(null, json);
		} catch(e) {
			callback("reddit API returned invalid JSON");
		}
	});
};

reddit.prototype.logout = function() {
	if(self._refreshTimeout) {
		clearTimeout(self._refreshTimeout);
	}
	
	delete self.bearerToken;
	delete self.refreshToken;
};

reddit.prototype.getRateLimitDetails = function() {
	if(!this._rateLimit) {
		return false;
	}
	
	var now = Math.floor(Date.now() / 1000);
	if(this._rateLimit.reset < now) {
		this._rateLimit.remaining += this._rateLimit.used;
		this._rateLimit.used = 0;
		this._rateLimit.reset = 0;
	}
	
	return {
		"used": this._rateLimit.used,
		"remaining": this._rateLimit.remaining,
		"reset": this._rateLimit.reset - now
	};
};
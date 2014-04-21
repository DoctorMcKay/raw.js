var request = require('request');

var Exception = require('./exception.js');

module.exports = reddit;

require('util').inherits(reddit, require('events').EventEmitter);

function reddit(userAgent) {
	this._userAgent = userAgent;
}

reddit.prototype.setupOAuth2 = function(id, secret, redirectUri) {
	this._oauth2 = {
		id: id,
		secret: secret,
		redirectUri: redirectUri
	};
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
	
	if(this.bearerToken) {
		options.headers = options.headers || {};
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
	
	this.emit('debug-apirequest', req);
	request(req, callback);
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
			"code": code,
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
	
	self._apiRequest("access_token", {"domain": "https://ssl.reddit.com", "method": "POST", "version": 1, "form": form, "inAuthorizationFlow": true}, function(err, body, response) {
		if(err) {
			callback(err);
			return;
		}
		
		try {
			var json = JSON.parse(response);
			if(json.error) {
				callback(json.error);
				return;
			}
			
			self.bearerToken = json.access_token;
			
			if(json.refresh_token) {
				self.refreshToken = json.refresh_token;
				// If we are given a refresh token, set a timer to automatically refresh it when our bearer token expires
				setTimeout(function() {
					self.auth(function(err, data) {
						if(err) {
							self.emit('error', "Unable to refresh bearer token", err);
						}
					});
				}, (json.expires_in - 30) * 1000);
			}
			
			callback(null, json);
		} catch(e) {
			callback("reddit API returned invalid JSON");
		}
	});
};
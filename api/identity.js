var reddit = global.reddit;

reddit.prototype.me = function(callback) {
	var self = this;
	this._apiRequest("me", {"version": 1}, function(err, response, body) {
		self._rawJSON(err, body, callback);
	});
};

reddit.prototype.getPrefs = function(prefs, callback) {
	if(typeof prefs == 'function') {
		callback = prefs;
		prefs = [];
	}
	
	var self = this;
	this._apiRequest("prefs", {"path": "/api/v1/me", "qs": {"fields": prefs.join(',')}}, function(err, response, body) {
		self._rawJSON(err, body, callback);
	});
};

reddit.prototype.trophies = function(callback) {
	var self = this;
	this._apiRequest("trophies", {"path": "/api/v1/me"}, function(err, response, body) {
		try {
			var json = JSON.parse(body);
			if(json.error) {
				callback(json.error);
				return;
			}
			
			callback(null, json.data.trophies);
		} catch(e) {
			callback("reddit API returned invalid response: " + e);
		}
	});
};
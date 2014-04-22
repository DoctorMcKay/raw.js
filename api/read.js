var reddit = global.reddit;

// reddit._addSimpleRequest = function(name, endpoint, method, args, constArgs, callback)
// reddit._addListingRequest = function(name, endpoint, path)

reddit._addSimpleRequest("moreComments", "morechildren", "POST", ["link_id", "children", "sort"], {"api_type": "json"}, "_things");

reddit.prototype.multis = function(callback) {
	var self = this;
	this._apiRequest("mine", {"path": "/api/multi"}, function(err, response, body) {
		self._rawJSON(err, body, callback);
	});
};

reddit.prototype.multiInfo = function(user, multi, callback) {
	var self = this;
	this._apiRequest(multi, {"path": "/api/multi/user/" + user + "/m"}, function(err, response, body) {
		self._rawJSON(err, body, callback);
	});
};

reddit.prototype.multiDescription = function(user, multi, callback) {
	var self = this;
	this._apiRequest("description", {"path": "/api/multi/user/" + user + "/m/" + multi}, function(err, response, body) {
		self._rawJSON(err, body, callback);
	});
};

reddit.prototype.recommended = function(sr, omit, callback) {
	if(typeof omit == 'function') {
		callback = omit;
		omit = [];
	}
	
	var self = this;
	this._apiRequest(sr.join(','), {"path": "/api/recommend/sr", "qs": {"omit": omit.join(',')}}, function(err, response, body) {
		self._rawJSON(err, body, callback);
	});
};

reddit._addSimpleRequest("searchSubredditNames", "search_reddit_names.json", "POST", ["query", "include_over_18"], null, "_rawJSON");
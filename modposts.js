var reddit = global.reddit;

reddit.prototype.approve = function(thing, callback) {
	var self = this;
	this._apiRequest("approve", {"method": "POST", "form": {"id": thing}}, function(err, response, body) {
		self._noResponse(err, body, callback);
	});
};

reddit.prototype.distinguish = function(thing, distinguish, callback) {
	if(distinguish === true) {
		distinguish = 'yes';
	} else if(distinguish === false) {
		distinguish = 'no';
	}
	
	var self = this;
	this._apiRequest("distinguish", {"method": "POST", "form": {
		"api_type": "json",
		"how": distinguish,
		"id": thing
	}}, function(err, response, body) {
		self._modifySingleItem(err, body, callback);
	});
};

reddit.prototype.ignoreReports = function(thing, callback) {
	var self = this;
	this._apiRequest("ignore_reports", {"method": "POST", "form": {"id": thing}}, function(err, response, body) {
		self._noResponse(err, body, callback);
	});
};

reddit.prototype.unignoreReports = function(thing, callback) {
	var self = this;
	this._apiRequest("unignore_reports", {"method": "POST", "form": {"id": thing}}, function(err, response, body) {
		self._noResponse(err, body, callback);
	});
};

reddit.prototype.nsfw = function(thing, callback) {
	var self = this;
	this._apiRequest("marknsfw", {"method": "POST", "form": {"id": thing}}, function(err, response, body) {
		self._noResponse(err, body, callback);
	});
};

reddit.prototype.unnsfw = function(thing, callback) {
	var self = this;
	this._apiRequest("unmarknsfw", {"method": "POST", "form": {"id": thing}}, function(err, response, body) {
		self._noResponse(err, body, callback);
	});
};

reddit.prototype.remove = function(thing, callback) {
	var self = this;
	this._apiRequest("remove", {"method": "POST", "form": {"id": thing, "spam": false}}, function(err, response, body) {
		self._noResponse(err, body, callback);
	});
};

reddit.prototype.spam = function(thing, callback) {
	var self = this;
	this._apiRequest("remove", {"method": "POST", "form": {"id": thing, "spam": true}}, function(err, response, body) {
		self._noResponse(err, body, callback);
	});
};

reddit.prototype.contestMode = function(thing, state, callback) {
	var self = this;
	this._apiRequest("set_contest_mode", {"method": "POST", "form": {"api_type": "json", "id": thing, "state": state}}, function(err, response, body) {
		self._noResponse(err, body, callback);
	});
};

reddit.prototype.sticky = function(thing, state, callback) {
	var self = this;
	this._apiRequest("set_subreddit_sticky", {"method": "POST", "form": {"api_type": "json", "id": thing, "state": state}}, function(err, response, body) {
		self._noResponse(err, body, callback);
	});
};
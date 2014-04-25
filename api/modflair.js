var reddit = global.reddit;

// reddit._addSimpleRequest = function(name, endpoint, method, args, constArgs, callback)
// reddit._addListingRequest = function(name, endpoint, path)

reddit.prototype.clearUserFlairTemplates = function(r, callback) {
	var self = this;
	this._apiRequest("clearflairtemplates", {"path": "/r/" + r + "/api", "method": "POST", "form": {"api_type": "json", "flair_type": "USER_FLAIR"}}, function(err, response, body) {
		self._multipleErrors(err, body, callback);
	});
};

reddit.prototype.clearLinkFlairTemplates = function(r, callback) {
	var self = this;
	this._apiRequest("clearflairtemplates", {"path": "/r/" + r + "/api", "method": "POST", "form": {"api_type": "json", "flair_type": "LINK_FLAIR"}}, function(err, response, body) {
		self._multipleErrors(err, body, callback);
	});
};

reddit.prototype.deleteUserFlair = function(r, user, callback) {
	var self = this;
	this._apiRequest("deleteflair", {"path": "/r/" + r + "/api", "method": "POST", "form": {"api_type": "json", "name": user}}, function(err, response, body) {
		self._multipleErrors(err, body, callback);
	});
};
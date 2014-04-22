var reddit = global.reddit;

reddit.prototype.me = function(callback) {
	var self = this;
	this._apiRequest("me", {"version": 1}, function(err, response, body) {
		self._rawJSON(err, body, callback);
	});
};
var reddit = global.reddit;

reddit.prototype.modlog = function(r, callback) {
	var self = this;
	this._apiRequest("log", {"path": "/r/" + r + "/about"}, function(err, response, body) {
		self._listing(err, body, callback);
	});
};
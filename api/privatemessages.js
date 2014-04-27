var reddit = global.reddit;

// reddit._addSimpleRequest = function(name, endpoint, method, args, constArgs, callback)

reddit._addSimpleRequest("block", "block", "POST", ["id"], null, "_noResponse");

reddit.prototype.message = function(options, callback) {
	var self = this;
	this._apiRequest("compose", {"method": "POST", "form": {
		"api_type": "json",
		"iden": (options.captcha) ? self._captchaIdent : undefined,
		"captcha": options.captcha,
		"to": options.to,
		"subject": options.subject,
		"text": options.text
	}}, function(err, response, body) {
		self._multipleErrors(err, body, callback);
	});
};
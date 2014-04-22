var reddit = global.reddit;

// reddit._addSimpleRequest = function(name, endpoint, method, args, constArgs, callback)

reddit._addSimpleRequest("comment", "comment", "POST", ["parent", "text"], {"api_type": "json"}, "_modifySingleItem");

reddit.prototype.submit = function(options, callback) {
	var self = this;
	this._apiRequest("submit", {"method": "POST", "form": {
		"api_type": "json",
		"extension": "json",
		"kind": (options.url) ? 'link' : 'self',
		"resubmit": true,
		"save": !!options.save,
		"sendreplies": !!options.inboxReplies,
		"sr": options.r,
		"text": options.text,
		"url": options.url,
		"then": "tb",
		"title": options.title,
		"iden": (options.captcha) ? self._captchaIdent : undefined,
		"captcha": options.captcha
	}}, function(err, response, body) {
		if(!callback) {
			return;
		}
		
		try {
			var json = JSON.parse(body);
			if(json.error) {
				callback(json.error);
			} else if(json.json.errors.length == 1) {
				callback(json.json.errors[0]);
			} else if(json.json.errors.length > 1) {
				callback(json.json.errors);
			} else {
				callback(null, json.json.data.id);
			}
		} catch(e) {
			callback("reddit API returned invalid response: " + e);
		}
	});
};

reddit.prototype.submitText = function(r, callback) {
	var self = this;
	this._apiRequest("submit_text.json", {"path": "/r/" + r + "/api"}, function(err, response, body) {
		self._rawJSON(err, body, callback);
	});
};
var reddit = global.reddit;

reddit._addSimpleRequest = function(name, endpoint, method, args, constArgs, callback) {
	reddit.prototype[name] = function() {
		var form;
		if(args.length > 0 || constArgs) {
			form = {};
		}
		
		for(var i = 0; i < args.length; i++) {
			form[args[i]] = arguments[i];
		}
		
		for(var i in constArgs) {
			form[i] = constArgs[i];
		}
		
		var userCallback = arguments[arguments.length - 1];
		if(typeof userCallback != 'function') {
			userCallback = null;
		}
		
		var self = this;
		this._apiRequest(endpoint, {"method": method, "form": form}, function(err, response, body) {
			self[callback](err, body, userCallback);
		});
	};
};

reddit._addListingRequest = function(name, endpoint, path) {
	reddit.prototype[name] = function() {
		var options;
		var callback;
		if(arguments.length == 0) {
			options = null;
			callback = null;
		} else if(arguments.length == 1 && typeof arguments[0] == 'object') {
			options = arguments[0];
			callback = null;
		} else if(arguments.length == 1 && typeof arguments[0] == 'function') {
			options = null;
			callback = arguments[0];
		} else {
			options = arguments[0];
			callback = arguments[1];
		}
		
		var requestPath = '';
		if(options && options.r) {
			requestPath = "/r/" + options.r;
		}
		
		if(path) {
			requestPath += path;
		}
		
		var qs;
		if(options.after || options.before || options.limit || options.count || options.all) {
			qs = {};
			qs.after = options.after;
			qs.before = options.before;
			qs.limit = options.limit;
			qs.count = options.count;
			qs.all = (options.all) ? "all" : undefined;
		}
		
		var self = this;
		this._apiRequest(endpoint, {"path": requestPath, "qs": qs}, function(err, response, body) {
			self._listing(err, body, callback);
		});
	};
};
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
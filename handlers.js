var reddit = global.reddit;

reddit.prototype._modifySingleItem = function(err, body, callback) {
	if(!callback) {
		return;
	}
	
	if(err) {
		callback(err);
		return;
	}
	
	try {
		var json = JSON.parse(body);
		console.log(json);
		if(json.error) {
			callback(json.error);
		} else if(json.json.errors.length == 1) {
			callback(json.json.errors[0]);
		} else if(json.json.errors.length > 1) {
			callback(json.json.errors);
		} else {
			callback(null, json.json.data.things[0]);
		}
	} catch(e) {
		callback("reddit API returned invalid response: " + e);
	}
}

reddit.prototype._noResponse = function(err, body, callback) {
	if(!callback) {
		return;
	}
	
	if(err) {
		callback(err);
		return;
	}
	
	try {
		var json = JSON.parse(body);
		if(json.error) {
			callback(json.error);
			return;
		}
	} catch(e) {
		callback("reddit API returned invalid response: " + e);
		return;
	}
	
	callback(null);
};
var reddit = global.reddit;

reddit.prototype.inviteLiveContributor = function(threadID, username, permissions, callback) {
	if(typeof permissions == 'function') {
		callback = permissions;
		permissions = null;
	}
	
	var permissionString = "+all";
	var possiblePermissions = ["close", "edit", "manage", "settings", "update"];
	
	if(permissions) {
		permissionString = '-all';
		for(var i = 0; i < possiblePermissions.length; i++) {
			permissionString += ',';
			if(permissions.indexOf(possiblePermissions[i]) != -1) {
				permissionString += '+' + possiblePermissions[i];
			} else {
				permissionString += '-' + possiblePermissions[i];
			}
		}
	}
	
	var self = this;
	this._apiRequest("invite_contributor", {"path": "/api/live/" + threadID, "method": "POST", "form": {
		"api_type": "json",
		"name": username,
		"permissions": permissionString,
		"type": "liveupdate_contributor_invite"
	}}, function(err, response, body) {
		self._multipleErrors(err, body, callback);
	});
};
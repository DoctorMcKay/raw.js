var reddit = require('../index.js');

reddit.prototype.changeModeratorInvitePermissions = function(subreddit, username, permissions, callback) {
	if(typeof permissions === 'function') {
		callback = permissions;
		permissions = null;
	}
	
	changePerms(this, subreddit, username, permissions, "moderator_invite", callback);
};

reddit.prototype.changeModeratorPermissions = function(subreddit, username, permissions, callback) {
	if(typeof permissions === 'function') {
		callback = permissions;
		permissions = null;
	}
	
	changePerms(this, subreddit, username, permissions, "moderator", callback);
};

function changePerms(self, sr, user, perms, type, callback) {
	var permissionString = "+all";
	var possiblePermissions = ["access", "config", "flair", "mail", "posts", "wiki"];
	
	if(perms) {
		permissionString = '-all';
		possiblePermissions.forEach(function(perm) {
			permissionString += ',';
			if(perms.indexOf(perm) != -1) {
				permissionString += '+';
			} else {
				permissionString += '-';
			}
			
			permissionString += perm;
		});
	}
	
	self._apiRequest("setpermissions", {"path": "/r/" + sr + "/api", "method": "POST", "form": {
		"api_type": "json",
		"name": user,
		"permissions": permissionString,
		"type": type
	}}, function(err, response, body) {
		self._multipleErrors(err, body, callback)
	});
}
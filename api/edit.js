var reddit = global.reddit;

// reddit._addSimpleRequest = function(name, endpoint, method, args, constArgs, callback)

reddit._addSimpleRequest("delete", "del", "POST", ["id"], null, "_noResponse");
reddit._addSimpleRequest("edit", "editusertext", "POST", ["thing", "text"], {"api_type": "json"}, "_modifySingleItem");
reddit._addSimpleRequest("inboxReplies", "sendreplies", "POST", ["thing", "state"], null, "_noResponse");
var reddit = global.reddit;

// reddit._addSimpleRequest = function(name, endpoint, method, args, constArgs, callback)

reddit._addSimpleRequest("del", "del", "POST", ["id"], null, "_noResponse");
reddit._addSimpleRequest("edit", "editusertext", "POST", ["thing", "text"], {"api_type": "json"}, "_modifySingleItem");
reddit._addSimpleRequest("inboxReplies", "sendreplies", "POST", ["thing", "state"], null, "_noResponse");
reddit._addLiveRequest("liveDelete", "delete_update", "POST", ["id"], {"api_type": "json"}, "_multipleErrors");
var reddit = global.reddit;

// reddit._addSimpleRequest = function(name, endpoint, method, args, constArgs, callback)

reddit._addSimpleRequest("hide", "hide", "POST", ["id"], null, "_noResponse");
reddit._addSimpleRequest("unhide", "unhide", "POST", ["id"], null, "_noResponse");
reddit._addSimpleRequest("report", "report", "POST", ["id"], null, "_noResponse");
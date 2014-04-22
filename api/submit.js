var reddit = global.reddit;

// reddit._addSimpleRequest = function(name, endpoint, method, args, constArgs, callback)

reddit._addSimpleRequest("comment", "comment", "POST", ["parent", "text"], {"api_type": "json"}, "_modifySingleItem");
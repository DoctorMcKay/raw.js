# raw.js
## reddit api wrapper in node.js

raw.js is an API wrapper for reddit.com written in Node.js. It supports OAuth2 authentication as a web app, an installed app, or as a single-user script. Unauthenticated requests are also supported.

# Installation

While in development, raw.js may be installed using the following command:

```text
npm install https://bitbucket.org/Doctor_McKay/raw.js/get/tip.tar.gz
```

# Rules

By using this module, you must follow the [reddit API rules](https://github.com/reddit/reddit/wiki/API). Note that raw.js **will not** automatically rate-limit itself. You must take care to not exceed the rate limit in your scripts. You can use the `getRateLimitDetails()` method to get information regarding the current limits.

# Setup

To set up your app, first instantiate a new instance of `reddit`. The constructor expects one parameter, which is the user-agent that you will send to reddit. From the [reddit API docs](https://github.com/reddit/reddit/wiki/API):

- Change your client's User-Agent string to something unique and descriptive, preferably referencing your reddit username.
	- Example: User-Agent: flairbot/1.0 by spladug
	- Many default User-Agents (like "Python/urllib" or "Java") are drastically limited to encourage unique and descriptive user-agent strings.
	- If you're making an application for others to use, please include a version number in the user agent. This allows us to block buggy versions without blocking all versions of your app.
	- NEVER lie about your user-agent. This includes spoofing popular browsers and spoofing other bots. We will ban liars with extreme prejudice.

```js
var rawjs = require('raw.js');
var reddit = new rawjs("raw.js example script");
```

# Authenticating

raw.js supports OAuth2 authentication. Before you authenticate, you must first [create an app](https://ssl.reddit.com/prefs/apps/) and call `setupOAuth2` with your app's client ID, secret, and redirect URI (which must match the one you provided to reddit exactly). Example:

```js
var rawjs = require('raw.js');
var reddit = new rawjs("raw.js example script");
reddit.setupOAuth2("p-jcoLKBynTLew", "gko_LXELoV07ZBNUXrvWZfzE3aI", "http://www.example.com/redditoauth");
```

Note that supplying the redirect URI to `setupOAuth2` is optional if your app type is `script`. You must still supply one to reddit when creating your script app, but you can use anything; it isn't actually used.

## Client Authorization

If your app is a `web app` or an `installed app`, you now need to generate a URL where you will redirect your client. If your app is a `script`, skip to where we call the `auth` method.

Get the authorization URL from the `authUrl` method and redirect your client to it. The client will review the list of permissions that your app is requesting, then it will authorize the request. The parameters that are expected are listed in detail in the **Methods** section.

After the client accepts the authorization request, they will be redirected back to the redirect URI that you gave to reddit when you created your app, along with the following GET parameters:

- `error` - If there is an error, `error` will be one of the following values:
	- `access_denied` - The user denied your app access to their reddit account
	- `invalid_scope` - You supplied an unknown or invalid scope name
	- *Some other value* - There was a problem with raw.js, and you should [report this issue](/Doctor_McKay/raw.js/issues/new)
- `code` - The authorization code that you will need to pass to the `auth` method
- `state` - The same state that you supplied to `authUrl`, you should make sure this is the same

Now, we need to authenticate with reddit. To do this, call the `auth` method. The first parameter is an object whose properties differ depending on how we're going to authenticate.

If your app is a `web app` or an `installed app`, the object's sole property should be `code`, the value of which should be the authorization code that you got when the client was redirected back from reddit after accepting your app's permissions. If your app is a `script`, the object should contain your account's `username` and `password`. Note that he account must be listed as a developer of the app on reddit or else the credentials will be rejected.

Example of `web app` and `installed app` authentication:

```js
var rawjs = require('raw.js');
var reddit = new rawjs("raw.js example script");
reddit.setupOAuth2("p-jcoLKBynTLew", "gko_LXELoV07ZBNUXrvWZfzE3aI", "http://www.example.com/redditoauth");

var url = reddit.authUrl("some_random_state", ['identity']);
// Redirect the client to this URL. When they return, their authorization code will be passed in the URL as `code`.

reddit.auth({"code": code}, function(err, response) {
	if(err) {
		console.log("Unable to authenticate user: " + err);
	} else {
		// The user is now authenticated. If you want the temporary bearer token, it's available as response.access_token and will be valid for response.expires_in seconds.
		// If we requested permanent access to the user's account, raw.js will automatically refresh the bearer token as it expires. You'll want to save the refresh token (it's available as response.refresh_token) and use it to resume the session on subsequent application startups. See "Resuming Sessions" below.
	}
});
```

Example of `script` authentication:

```js
var rawjs = require('raw.js');
var reddit = new rawjs("raw.js example script");
reddit.setupOAuth2("p-jcoLKBynTLew", "gko_LXELoV07ZBNUXrvWZfzE3aI");

reddit.auth({"username": "MyRedditBot", "password": "hunter2"}, function(err, response) {
	if(err) {
		console.log("Unable to authenticate user: " + err);
	} else {
		// The user is now authenticated. If you want the temporary bearer token, it's available as response.access_token and will be valid for response.expires_in seconds.
		// raw.js will automatically refresh the bearer token as it expires. Unlike web apps, no refresh tokens are available.
	}
});
```

## Resuming Sessions

To resume a previous session with a refresh token, set `reddit.refreshToken` to the value of the user's refresh token, then call `auth` without the object parameter:

```js
var rawjs = require('raw.js');
var reddit = new rawjs("raw.js example script");
reddit.setupOAuth2("p-jcoLKBynTLew", "gko_LXELoV07ZBNUXrvWZfzE3aI", "http://www.example.com/redditoauth");

reddit.refreshToken = "REKFcLCaI2QJYw_b0JQynxKrp6M";

reddit.auth(function(err, response) {
	if(err) {
		console.log("Unable to authenticate user: " + err);
	} else {
		// The user is now authenticated. If you want the temporary bearer token, it's available as response.access_token and will be valid for response.expires_in seconds.
		// raw.js will automatically refresh the bearer token as it expires.
		
		// The array scopes that this authorization allows are available as response.scope, which is useful for checking which permissions a saved session has.
	}
});
```

# Methods

## setupOAuth2(id, secret, redirectUri)

Sets up OAuth2 authentication. You must call this before you call `auth` if you plan to authenticate a user. Get the `id` and `secret` from the [apps page](https://ssl.reddit.com/prefs/apps/). The `redirectUri` is optional for `script` apps, but for all other apps it is required and must match the redirect URI you gave to reddit exactly.

## authUrl(state, scopes, permanent)

Generates an authorization request URL. You should redirect the user to this URL in order for them to grant access to your app, after which they will be redirected back to your app's redirect URI. The `state` will be passed back to your website as a GET parameter when the user is redirected. You might want to use this to verify that your server initiated the request. `scopes` should be an array of scope strings. You'll need to request access for the scope for each method that you plan to use. Pass `true` for `permanent` if you want this authorization to be permanent, otherwise the authorization will last for only one hour.

## auth(options, callback)

See the **Client Authorization** section above for usage of this method.
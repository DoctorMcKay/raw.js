# raw.js
## reddit api wrapper in node.js

raw.js is an API wrapper for reddit.com written in Node.js. It supports OAuth2 authentication as a web app, an installed app, or as a single-user script. Unauthenticated requests are also supported.

raw.js is currently in beta. Some features are missing. If you encounter any bugs, please [report them](https://bitbucket.org/Doctor_McKay/raw.js/issues/new).

# Installation

raw.js may be installed using the following command:

```text
npm install raw.js
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
		
		// The array of scopes that this authorization allows are available as response.scope, which is useful for checking which permissions a saved session has.
	}
});
```

# Listing Request

Many reddit API methods return Listings. Any method in raw.js which retrieves a Listing from reddit will be marked and will have common arguments:

- `options` - An object containing options for the call
	- `r` - A subreddit to request a listing for. For some calls this is optional; for others, it's required.
	- `after` - The ID of the thing to start getting results after
	- `before` - The ID of the thing to start getting results before
	- `limit` - The maximum number of results to return. Default 25, maximum 100.
	- `count` - The number of items that we've already seen in this listing, for numbered items across multiple pages. This can usually be ignored.
	- `all` - If `true`, filters such as "hide links that I have voted on" will be disabled.
- `callback` - Required.
	- `err` - A string explaining the error that occurred, or `null` if success
	- `response` - The response data returned by reddit

# Methods

This section lists all methods provided by raw.js. If a method is marked as *Scope: foo*, then it requires that OAuth2 scope in order to use it. If a method is marked as **Listing Request**, then it is a Listing request; see the **Listing Request** section above. If a method is marked as **Unauthenticated**, then it may be called while not authenticated.

## setupOAuth2(id, secret, redirectUri)

Sets up OAuth2 authentication. You must call this before you call `auth` if you plan to authenticate a user.

- `id` - Your app's client ID. Obtain this and the secret from the [apps page](https://ssl.reddit.com/prefs/apps/) on reddit.
- `secret` - Your app's client secret.
- `redirectUri` - Your app's redirect URI. This must match the URI that you gave to reddit exactly or else authentication will fail. Optional for `script` apps, although reddit requires one to be supplied during app registration. reddit doesn't actually use it; as such, it can be anything.

## authUrl(state, scopes, permanent)

Generates an authorization request URL. You should redirect the user to this URL in order for them to grant access to your app, after which they will be redirected back to your app's redirect URI.

- `state` - A value that will be passed back to your website as a GET parameter when the user is redirected. You might want to use this to verify that your server initiated the request.
- `scopes` - An array of scope strings. You'll need to request access for the scope for each method that you plan to use.
- `permanent` - `true` if you want this authorization to be permanent, otherwise the authorization will last for only one hour. This should be `false` or ommitted if you want a temporary authorization.

## auth(options, callback)

See the **Client Authorization** section above for usage of this method.

- `options` - An object containing the authorization options.
- `callback` - Required.
	- `err` - A string explaining the error that occurred, or `null` if success
	- `response` - An object containing response data

## logout()

Deletes the current bearer and refresh tokens (if applicable) and cancels any pending bearer token refresh timers. You should call this before you call `auth` for a second time.

## getRateLimitDetails()

Gets details about our current API rate limits. `false` will be returned if no rate limit details are available yet (e.g. we haven't hit any API endpoints yet), otherwise an object is returned with the following properties:

- `used` - The number of API calls that we've used this period
- `remaining` - The number of API calls that we're allowed to make this period before hitting the limit
- `reset` - The number of seconds before the current limit period resets

## captchaNeeded(callback)

Checks whether a CAPTCHA is required for endpoints that support one.

- `callback` - Required.
	- `err` - A string explaining the error that occurred, or `null` if success
	- `required` - `true` if a CAPTCHA is required, `false` otherwise

## captcha(callback)

Gets the URL of a new CAPTCHA image. Call this if `captchaNeeded` reports that you need a CAPTCHA. This can also be called to request a new image if the current one is unreadable.

- `callback` - Required.
	- `err` - A string explaining the error that occurred (an array of strings if multiple errors occurred), or `null` if success
	- `url` - The URL to the new CAPTCHA image

## del(thing, callback)

*Scope: edit*

Deletes a submission or comment.

- `thing` - [Fullname](http://www.reddit.com/dev/api/oauth#fullnames) of the thing to delete
- `callback` - Optional.
	- `err` - A string explaining the error that occurred, or `null` if success

## edit(thing, text, callback)

*Scope: edit*

Edits a comment or self post.

- `thing` - [Fullname](http://www.reddit.com/dev/api/oauth#fullnames) of the thing to edit
- `text` - New text for the thing (Markdown)
- `callback` - Optional.
	- `err` - A string explaining the error that occurred, or `null` if success
	- `response` - An object containing the thing's new data

## inboxReplies(thing, state, callback)

*Scope: edit*

Enables or disables inbox replies (orangered for new top-level comment) for a link.

- `thing` - [Fullname](http://www.reddit.com/dev/api/oauth#fullnames) of the thing to change
- `state` - `true` to receive top-level comment replies in the inbox, `false` otherwise
- `callback` - Optional.
	- `err` - A string explaining the error that occurred, or `null` if success

## me(callback)

*Scope: identity*

Gets the account info of the current user.

- `callback` - Optional.
	- `err` - A string explaining the error that occurred, or `null` if success
	- `response` - An object containing the user's identity info

## getPrefs(prefs, callback)

*Scope: identity*

Gets the account preferences of the current user. Preference names can be found by inspecting the `name` attribute of elements on the [preferences page](https://ssl.reddit.com/prefs/).

- `prefs` - An optional array of preference names to filter. Omit to get all preferences.
- `callback` - Optional.
	- `err` - A string explaining the error that occurred, or `null` if success
	- `response` - An object containing the user's preferences

## trophies(callback)

*Scope: identity*

Gets the list of trophies earned by the current user.

- `callback` - Optional.
	- `err` - A string explaining the error that occurred, or `null` if success
	- `response` - An array containing the user's trophy list

## modlog(options, callback)

*Scope: modlog*

**Listing Request**

Gets the moderation log for a subreddit that the currently authenticated user is a moderator in. This is a Listing request, see the **Listing Request** section above for details.

- `options` - The request options (see **Listing Request** section for details)
- `callback` - The callback (see **Listing Request** section for details)

## approve(thing, callback)

*Scope: modposts*

Approves a link or comment.

- `thing` - [Fullname](http://www.reddit.com/dev/api/oauth#fullnames) of the thing to approve
- `callback` - Optional.
	- `err` - A string explaining the error that occurred, or `null` if success

## distinguish(thing, distinguish, callback)

*Scope: modposts*

Distinguishes a link or comment.

- `thing` - [Fullname](http://www.reddit.com/dev/api/oauth#fullnames) of the thing to distinguish
- `distinguish` - `true` to distinguish as a mod, `false` to undistinguish. Other possible values are `admin` or `special`, but these don't apply to most users
- `callback` - Optional.
	- `err` - A string explaining the error that occurred (an array of strings if multiple errors occurred), or `null` if success
	- `data` - An object containing data of the thing that was distinguished

## ignoreReports(thing, callback)

*Scope: modposts*

Ignores reports on a link or comment.

- `thing` - [Fullname](http://www.reddit.com/dev/api/oauth#fullnames) of the thing to ignore reports on
- `callback` - Optional.
	- `err` - A string explaning the error that occurred, or `null` if success

## unignoreReports(thing, callback)

*Scope: modposts*

Unignores reports on a link or comment.

- `thing` - [Fullname](http://www.reddit.com/dev/api/oauth#fullnames) of the thing to unignore reports on
- `callback` - Optional.
	- `err` - A string explaning the error that occurred, or `null` if success

## nsfw(thing, callback)

*Scope: modposts*

Marks a link NSFW.

- `thing` - [Fullname](http://www.reddit.com/dev/api/oauth#fullnames) of the link to mark NSFW
- `callback` - Optional.
	- `err` - A string explaning the error that occurred, or `null` if success

## unnsfw(thing, callback)

*Scope: modposts*

Unmarks a link NSFW.

- `thing` - [Fullname](http://www.reddit.com/dev/api/oauth#fullnames) of the thing to unmark NSFW
- `callback` - Optional.
	- `err` - A string explaning the error that occurred, or `null` if success

## remove(thing, callback)

*Scope: modposts*

Removes a link or comment from a subreddit.

- `thing` - [Fullname](http://www.reddit.com/dev/api/oauth#fullnames) of the thing to remove
- `callback` - Optional.
	- `err` - A string explaning the error that occurred, or `null` if success

## spam(thing, callback)

*Scope: modposts*

Removes a link or comment from a subreddit and marks it as spam.

- `thing` - [Fullname](http://www.reddit.com/dev/api/oauth#fullnames) of the thing to spam
- `callback` - Optional.
	- `err` - A string explaning the error that occurred, or `null` if success

## contestMode(thing, state, callback)

*Scope: modposts*

Sets a post into contest mode.

- `thing` - [Fullname](http://www.reddit.com/dev/api/oauth#fullnames) of the post to set contest mode on
- `state` - `true` to enable contest mode, `false` to disable
- `callback` - Optional.
	- `err` - A string explaning the error that occurred, or `null` if success

## sticky(thing, state, callback)

*Scope: modposts*

Stickies a self-post to the top of the subreddit it's in. Note that stickying a post will unsticky any existing sticky.

- `thing` - [Fullname](http://www.reddit.com/dev/api/oauth#fullnames) of the self-post to sticky
- `state` - `true` to sticky, `false` to unsticky
- `callback` - Optional.
	- `err` - A string explaning the error that occurred, or `null` if success

## comment(parent, text, callback)

*Scope: submit*

Posts a comment or a message reply.

- `parent` - [Fullname](http://www.reddit.com/dev/api/oauth#fullnames) (whether a link, comment, or message) of the thing to reply to
- `text` - Body text of the comment or message (Markdown)
- `callback` - Optional.
	- `err` - A string explaining the error that occurred, or `null` if success
	- `comment` - Data of our new comment/message

## submit(options, callback)

*Scope: submit*

Submits a new link or self post.

- `options` - An object containing the following properties:
	- `url` - For link submissions, the URL of the link (omit for self posts)
	- `save` - `true` to automatically save the submission
	- `inboxReplies` - `true` to send top-level comments to your inbox
	- `r` - The subreddit to submit to
	- `text` - For self posts, the body text (Markdown)
	- `title` - The title of the submission
	- `captcha` - If a CAPTCHA is required, supply the text of the CAPTCHA image in this property (see `captchaNeeded` and `captcha` methods)
- `callback` - Optional.
	- `err` - A string explaining the error that occurred (an array of strings if multiple errors occurred), or `null` if success
	- `id` - The ID of the new submission

## submitText(r, callback)

*Scope: submit*

Gets the submission text for a subreddit.

- `r` - The subreddit to retrieve submission text for
- `callback` - Optional.
	- `err` - A string explaining the error that occurred, or `null` if success
	- `response` - An object containing properties for `submit_text` (the raw Markdown text) and `submit_text_html` (Markdown parsed into HTML)
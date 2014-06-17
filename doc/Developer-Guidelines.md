<div id="security"></div>
# Security concerns

If you visit a site which doesn't practice good security and you approve
AsYouWish for that site, your own data can be at risk. If you are a
developer, you have a responsibility to avoid security holes.
"With power comes great responsibility", and AsYouWish undeniably
gives developers great power if the user allows it. In a normal website,
unless there is a browser or plugin exploit in use, the typically worst thing
that can happen if the site is not secure is that the user's password at
your site can be stolen, and bad guys can gain access to your account
at the site and the data the user enters there. Of course this can be serious
if the site is a bank, has stored your web history or other private data.
But it is potentially even more serious--even much more serious--with
AsYouWish if you give permission to an untrusted site. A similar risk
is present with add-ons (see the section on "Advantages over custom add-ons"),
but this section will focus on AsYouWish.

With AsYouWish, if you as a developer are not careful, a hacker could
present links to your user that when clicked will bring the user to a page
at your site which will cause the user's bank passwords to be read,
their files to be read, sent, or deleted, visits to other sites made while
logged in--taking advantage of any information which the user has input
into their browser (not just for your site) such as open tabs or history,
etc., and potentially using their browser to spam or try hacking other
sites, etc. Besides the harm to your users, creating such a risk opens
yourself up to loss of trust and legal dangers if not criminal sanctions.
This danger exists for unreviewed Firefox addons as well, so it is
nothing new.

I unfortunately do not know of a good single-stop location for learning
about web application security, but I can at least say that perhaps
the most important rule is to validate all untrusted data or code--e.g.,
if you are reading data from window.location or from a web request
to access database content which had been saved by users, or even
letting the user add content (in case the data they insert is untrusted),
you are putting the user at risk by inserting that data unescaped within
your page (e.g., by using `innerHTML`) as with including a script tag
pointing to an untrusted site. This is not an exhaustive list, but it may
help avoid the most common problems.

<div id="users"></div>

# Educating users

In order to ensure guidance is up to date, comprehensive, and clear, I would
like to encourage developers to send users to the site's README, and if you
feel there are deficiencies in these guidelines (or if you
think some specific FAQ items would be helpful), let me know with an
issue, or, preferably, a pull request. This will hopefully save your users
and others the trouble of conflicting or unclear information, and you the
trouble of efforts at documentation. I also intend to update this page when
Mozilla may approve AsYouWish to give added peace of mind
to users/developers that the addon has been reviewed to do what it says.

<div id="api"></div>

# API

The API is subject to change. Although it technically allows synchronous usage
when the user has already approved the privileges, this is not a frozen syntax
and may be removed in the future.

I would like to ensure the provided RequireJS plugin is consistent, so I'd
like to consult further to consider the best way to do this for all environments.
Once that is decided, I think that might end up as the recommended way to
use the API, but in the meantime, feel free to experiment with the examples
(see the repo's HTML files for more):

<div id="async-api"></div>
## Asynchronous API (Recommended)

Note that even if only one module is requested, the first argument should
still be an array, so as to distinguish the request from a synchronous one.

```javascript
  AsYouWish.requestPrivs(['sdk/net/xhr', 'sdk/url'], function (xhr, URLObj) {
    var x = new xhr.XMLHttpRequest();
    x.open('GET', 'http://mozilla.org/', false);
    x.send(null);
    alert(x.responseText);
            
    var url = URLObj.URL('http://example.com/');
            
    alert(url);
    alert(url.scheme);
            
  }, function (errorState, info1, info2) {
    alert(errorState);
  });
```
<div id="sync-api"></div>
## Synchronous API

To make a synchronous request, pass a single string module name as the first argument (NOT within an array).

Note that the disadvantages of the synchronous APIs include:

1. Can only request one object at a time.
2. The current behavior (the XPI in Git, not on AMO yet) is to auto-refresh once approval is made in case the application wishes to adjust behavior based on new approval. The asynchronous API does not have this disruption.
3. One effectively needs to write checks for each module loaded to see whether it has loaded or not.

```javascript
  var xhr = AsYouWish.requestPrivs('sdk/net/xhr');
  if (!xhr) {
    alert('Waiting for your approval of cross-site URL requests');
    return;
  }
  var URLObj = AsYouWish.requestPrivs('sdk/url');
  if (!URLObj) {
    alert('Waiting for your approval of the url module');
    return;
  }
  var x = new xhr.XMLHttpRequest();
  x.open('GET', 'http://mozilla.org/', false);
  x.send(null);
  alert(x.responseText);
  var url = URLObj.URL('http://example.com/');
```

As per <https://bugzilla.mozilla.org/show_bug.cgi?id=855936>,
Mozilla is open to expanding their SDK API toward using Node
APIs (a great deal of the APIs such as accessing the file
system may be suitable candidates, or even the server-specific
ones, given Mozilla's inclusion of a test server). In such a case,
one may be able to utilize the AsYouWish synchronous API in
a way that is mutually compatible with Node. However, it would
provide a challenge for us to inject `require` into every page,
given the greater chance that websites were using this variable
(as some already do with RequireJS even while that library does
at least allow `requirejs` as an alternative; browserify is not an
issue as the `require` variable is local there). The following code
placed at the top of of one's code ought to allow the rest to be
compatible with Node.

```javascript
if (typeof AsYouWish !== 'undefined') {
    var require = AsYouWish.requestPrivs;
}
```
<div id="priv-plugin"></div>
## RequireJS priv! plugin
Using the provided priv plugin for RequireJS (which also
of course requires RequireJS itself), the API is similar,
with a difference with errors and a need to prefix each
requested privilege with `priv!` (this is for the sake of
harmony with RequireJS which can make non-privileged
module inclusions as well which do not require a prefix):

```javascript
require(['priv!sdk/net/xhr', 'priv!sdk/url'], function (xhr, URLObj) {

    // e.g., same as above...

}, function (errorObj) {
    alert(errorObj.state + '::' + errorObj.args);
});
```
RequireJS also always requires an array, so I have settled on that
for AsYouWish and may perhaps harmonize the errBack argument
format if not the name of the function itself.

Further details (e.g., possible error types) should hopefully
be provided eventually on
the [wiki](https://github.com/brettz9/asyouwish/wiki).

Again, please do not get too comfortable with the current API, as details
may change.

I am now leaning, however, toward the dynamic `System.import()` API of
[ES6 Modules](https://github.com/ModuleLoader/es6-module-loader/), but
pending this, it should also be easy to keep the RequireJS plugin
stable in case the built-in API changes (e.g., to auto-inject our own
`System.import()` method which supports the plugin and replicates
existing functionality, avoiding the need for an additional file inclusion).

<div id="api"></div>
## Other APIs

The following will remove privileges for the current site.

```javascript
AsYouWish.removePrivs(); // Only usable on current site
```

To get an object whose keys indicate all available privileges,
and whose values are the localized text warnings that will be
shown to the user, the following is currently exposed for
debugging or detection purposes (but may be removed
or changed in the future):

```javascript
AsYouWish.getDefaultPrivs();
```

<div id="privileges"></div>
# Exposed privileges

At present, all [APIs](https://developer.mozilla.org/en-US/Add-ons/SDK)
are exposed.

Requests at this point can therefore be made of the user for the following high-level APIs:
- **sdk/clipboard**: Accessing or setting the clipboard
- **sdk/context-menu**: Accessing or adding to the browser's own context menu
- **sdk/hotkeys**: Creating new browser-wide keyboard shortcuts
- **sdk/indexed-db**: Access to IndexedDB API
- **sdk/page-mod**: Modifying any web content the user loads in the browser
- **sdk/page-worker**: Performing hidden loads of cross-domain web content
- **sdk/panel**: Loading HTML into a dialog
- **sdk/passwords**: Reading or removing user's site passwords or store new passwords
- **sdk/private-browsing**: Detecting of when user is in private browsing mode.
- **sdk/request**: Making cross-domain browser requests (accessing a remote website
using the user's credentials)
- **sdk/selection**: Accessing user highlighted selections made within the browser
- **sdk/simple-storage**: Accessing SHARED simple storage to store data accessible to any
other AsYouWish-enabled website approved by the user without needing one site to act
as gate-keeper of the data.
- **sdk/system**: Gets information about the environment it's running in and can quit Firefox!
- **sdk/tabs**: Listening to changes in user tabs, controlling tabs, opening new tabs, or accessing any other opened browser tab content
- **sdk/ui**: Provides access to button, toolbar, and sidebar UI objects.
- **sdk/widget**: Creating an addon user interface (widget) to be hosted in the add-on bar
- **sdk/windows**: Listening to changes in user's browser tabs, controlling tabs, opening new tabs, or accessing any other opened browser tab content

The following, apparently fully safe libraries made available by the Addons SDK
and which can perhaps be allowed without permissions in the future (if not standardized):
- **sdk/base64**: Character-set-aware base64 encoding and decoding
- **sdk/querystring**: Serializing/deserializing of URL query strings
- **sdk/url**: URL parsing/retrieval utilities
- **sdk/lang/functional**: Functional helper methods
- **sdk/lang/type**: Functions for working with type detection.
- **sdk/test/utils**: Helper methods used in the CommonJS Unit Testing suite.
- **sdk/test/assert**: Implements the assert interface defined in the CommonJS Unit Testing specification version 1.1.
- **sdk/test/harness**: Tests harness setup and execution.
- **sdk/ui/id**: Creates UI component IDs.
- **sdk/util/array**: Helper functions for working with arrays.

The following other high-level APIs have currently been allowed, but they are
apparently of limited to no use because they are either already available to
regular websites or they are specific to the AsYouWish addon:
- **sdk/console**: Accessing addon console object (including 'exception' method)
- **sdk/l10n**: Acccesing AsYouWish's localization strings
- **sdk/notifications**: Creating Toaster-style notifications; use Web Notifications instead?
- **sdk/self**: Accessing data of the AsYouWish addon
- **sdk/simple-prefs**: Storing and setting non-site-specific preferences for AsYouWish if stored using this preference
- **sdk/timers**: Accessing web-like timing

The following low-level APIs are also available (although summaries are
provided of those which may be of special interest, it is preferable to use
the high-level APIs where possible (the paths may change if the full "sdk/"
path becomes deprecated or required); for documentation of low-level APIs (as
well as high-level ones), see <https://developer.mozilla.org/en-US/Add-ons/SDK>):
- **toolkit/loader**: 
- **sdk/console/plain-text**: 
- **sdk/console/traceback**: 
- **sdk/content/content**: 
- **sdk/content/loader**: 
- **sdk/content/mod**: 
- **sdk/content/symbiont**:
- **sdk/content/worker**: 
- **sdk/core/heritage**: 
- **sdk/core/namespace**: 
- **sdk/core/promise**: 
- **sdk/event/core**: 
- **sdk/event/target**: 
- **sdk/frame/hidden-frame**: 
- **sdk/frame/utils**: 
- **sdk/io/byte-streams**: 
- **sdk/io/file**: Reading, removing, or writing files and directories on the user's desktop
- **sdk/io/text-streams**: 
- **sdk/loader/cuddlefish**: 
- **sdk/loader/sandbox**: 
- **sdk/net/url**: 
- **sdk/net/xhr**: Making cross-domain browser requests (accessing a remote website
using the user's credentials)
- **sdk/places/bookmarks**: 
- **sdk/places/favicon**: 
- **sdk/places/history**: 
- **sdk/platform/xpcom**: 
- **sdk/preferences/service**: 
- **sdk/stylesheet/style**:
- **sdk/stylesheet/utils**:
- **sdk/system/child_process**:
- **sdk/system/environment**: 
- **sdk/system/events**: 
- **sdk/system/runtime**: 
- **sdk/system/unload**: 
- **sdk/system/xul-app**: 
- **sdk/tabs/utils**: 
- **sdk/test/httpd**: 
- **sdk/test/runner**: Sets up unit tests.
- **sdk/ui/button/action**: 
- **sdk/ui/button/toggle**: 
- **sdk/ui/frame**: 
- **sdk/ui/sidebar**: 
- **sdk/ui/toolbar**: 
- **sdk/util/collection**: 
- **sdk/util/deprecate**: 
- **sdk/util/list**: 
- **sdk/util/match-pattern**: 
- **sdk/util/object**: 
- **sdk/util/uuid**: 
- **sdk/window/utils**: 

Requiring the chrome object via `require('chrome')` (for access to
most XPCOM functionality) is
currently also possible, though this Mozilla-oriented API may be removed
in the future, especially if existing functionality becomes available through
other means.

The following custom APIs have also been added:
- **x-namespaced-simple-storage**: Simple storage applied to a particular
namespaced subobject; allows sites to only request privileges for shared
storage on a particular namespace without needing any particular site to
be the sole owner/manager of the data.
- **x-subprocess** (version 0.5.2): Launch subprocesses (currently only
tested in Windows, but the [underlying library](https://github.com/ochameau/jetpack-subprocess/)
appears to support others); sample test and sample working command line
demo provided. One may be able to get the desired functionality now by using
the built-in `sdk/system/child_process` module instead.

(Custom APIs should normally only be added if they offer some functionality
that is particularly suited to the web environment; otherwise, we will defer to
the SDK APIs.)

Once the initial testing phase is complete (now maybe "beta" for functionality,
though "alpha" as far as potential for security risks since I am not so familiar
with the security model in Firefox), it should be easy to add more low-level
APIs (where relevant), mostly just needing some warning text for users which
adequately warns them of risks to that API.

<div id="errors"></div>
# Error listeners

Currently, the following errors may be reported (but this API is not yet frozen):

- _bad-privilege_: The privilege is not even potentially supported. A second argument is populated with the specific bad privilege.
- _disallowed-privilege_: The privilege is not on the user's currently enforced whitelist. A second argument is populated with the specific disallowed privilege.
- _failed-retrieval_: There was an unknown failure in requiring the object. A second argument is populated with the specific failed privilege.
- _refused_: The user explicitly refused permission for a privilege. A second argument is populated with the specific as yet unapproved privileges, and a third argument is populated with the currently approved privileges.
- _denied_: The site has since been completely denied access. A second argument is populated with the specific bad privilege.
- _dismissed_: Should occur when user clicks away or switches tabs, though due to an apparent Firefox bug, that is currently being reported be 'removed'. A second argument is populated with 'initial' or 'callback' to indicate at what phase the dismissal occurred.
- _removed_: Occurs when permissions hanger is closed with 'Not now' or with 'x', but not with the explicit option 'Refuse permission' (which reports "refused"); also currently reporting dismissed, though this is apparently a Firefox bug

Currently 'shown' is only an internal event and not reported.

<div id="addon-websites"></div>
# "Addon" websites

***While this code should still be working, the ability to attach a
widget/panel via AsYouWish (a common use for add-ons) is currently not.***

Even without creating an "addon" website, one can use regular privileged
websites to create add-on-like features:

1. Use the ["tabs" module](https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/tabs#pin%28%29)
to ask the user to permit the pinning of the current tab as an app tab.
2. Create links to file:// URL websites on one's desktop

But, beyond this, although there is still no API currently to register sites
as 'addons' in the sense of appearing in the Addons dialog (unless one is
delivering an XPI file in which case AsYouWish is not needed for Firefox),
version 0.4 of AsYouWish has provided the ability for sites to register
themselves as "addon" websites in the sense that, if approved by the user,
their site can be launched in a hidden DOM
window upon registration and upon browser restarts.

If you wish to listen for an event when the addon uninstalls (or, as of
version 0.5.2, when a regular site has been disallowed or disapproved
of its existing privileges), I haven't seen any way to execute a genuine
"unload" event (implemented as a page-worker's contentURL)--and
perhaps it is a good idea to keep it separate since the privileges
might "unload" before the page does anyways, so currently, to perform
any clean-up work, you have to listen for a (custom) "x-unload" event
(on the window). To do anything privileged at that point, you will need
to ask for those privileges again, even if the privilege had been granted
earlier (since the user presumably doesn't want you stopping the uninstall!).
This might be removed or tweaked in the future if it becomes problematic.

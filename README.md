asyouwish
=========

AsYouWish is a browser add-on (currently Firefox only) to allow requests for browser
privileges to be made from regular HTML.

***Using this add-on is at this point still potentially quite dangerous, e.g.,
to your data (not only browser data) so don't install--especially at this
time--unless you are willing to take the risks. It is hoped this may go
through a thorough security vetting as part of the process to get the
add-on accepted at [AMO](https://addons.mozilla.org/). The current
way this add-on may be tested is either through the built XPI file
included with the source, or by using the SDK cfx tool.***

Obviously allowing privileges may be dangerous if used by a malicious
site (as with addons), so there needs to be a way to inform the user that
there is a request and allow them to refuse or accept. AsYouWish tries
to provide this.

Access is granted to specific URLs, not including the query string/hash.
Privileges do not apply site or even folder wide to allow a greater sense
of security and choice in case a website allows third party add-ons
which may seek their own privileges.

Exposed privileges
====================

At present, all [high-level APIs](https://addons.mozilla.org/en-US/developers/docs/sdk/latest/)
are exposed.

Requests at this point can therefore be made of the user for:
* **clipboard**: Accessing or setting the clipboard
* **context-menu**: Accessing or adding to the browser's own context menu
* **hotkeys**: Creating new browser-wide keyboard shortcuts
* **page-mod**: Modifying any web content the user loads in the browser
* **page-worker**: Performing hidden loads of cross-domain web content
* **panel**: Loading HTML into a dialog
* **passwords**: Reading or removing user's site passwords or store new passwords
* **private-browsing**: Detecting of when user is in private browsing mode.
* **request**: Making cross-domain browser requests (accessing a remote website
using the user's credentials)
* **selection**: Accessing user highlighted selections made within the browser
* **simple-storage**: Accessing SHARED simple storage to store data accessible to any
other AsYouWish-enabled website approved by the user without needing one site to act
as gate-keeper of the data.
* **tabs**: Listening to changes in user tabs, controlling tabs, opening new tabs, or accessing any other opened browser tab content
* **widget**: Creating an addon user interface (widget) to be hosted in the add-on bar
* **windows**: Listening to changes in user's browser tabs, controlling tabs, opening new tabs, or accessing any other opened browser tab content

The following, apparently fully safe libraries made available by the Addons SDK
and which can perhaps be allowed without permissions in the future (if not standardized):
* **url**: URL parsing/retrieval utilities
* **base64**: Character-set-aware base64 encoding and decoding
* **querystring**: Serializing/deserializing of URL query strings

The following other high-level APIs have currently been allowed, but they are
apparently of limited to no use because they are either already available to
regular websites or they are specific to the AsYouWish addon:
* **notifications**: Creating Toaster-style notifications; use Web Notifications instead?
* **console**: Accessing addon console object (including 'exception' method)
* **addon-page**: Opening AsYouWish's data/index.html in a bare type of tab (doesn't exist currenty)
* **l10n**: Acccesing AsYouWish's localization strings
* **self**: Accessing data of the AsYouWish addon
* **simple-prefs**: Storing and setting non-site-specific preferences for AsYouWish if stored using this preference
* **timers**: Accessing web-like timing

The following low-level APIs are also available (although summaries are
provided of those which may be of special interest, it is preferable to use
the high-level APIs where possible (the paths may change if the full "sdk/"
path becomes deprecated or required); for documentation of low-level APIs (as
well as high-level ones), see https://addons.mozilla.org/en-US/developers/docs/sdk/latest/ ):
* **toolkit/loader**: 
* **sdk/console/plain-text**: 
* **traceback**: 
* **content**: 
* **sdk/content/content-proxy**: 
* **sdk/content/loader**: 
* **sdk/content/symbiont**: 
* **sdk/content/worker**: 
* **sdk/core/heritage**: 
* **namespace**: 
* **promise**: 
* **event/core**: 
* **sdk/event/target**: 
* **hidden-frame**: 
* **sdk/frame/utils**: 
* **sdk/io/byte-streams**: 
* **file**: Reading, removing, or writing files and directories on the user's desktop
* **text-streams**: 
* **sdk/loader/cuddlefish**: 
* **sdk/loader/sandbox**: 
* **sdk/net/url**: 
* **xhr**: Making cross-domain browser requests (accessing a remote website
using the user's credentials)
* **match-pattern**: 
* **xpcom**: 
* **sdk/preferences/service**: 
* **environment**: 
* **runtime**: 
* **unload**: 
* **xul-app**: 
* **test/assert**: 
* **harness**: 
* **sdk/test/httpd**: Usable for creating server for user where they can serve evaluated files to the requesting server?
* **sdk/test/runner**: 
* **collection**: 
* **deprecate**: 
* **list**: 
* **sdk/util/uuid**: 
* **window/utils**: 

Requiring the chrome object (for access to most XPCOM functionality) is
currently also possible, though this Mozilla-oriented API may be removed
in the future, especially if existing functionality becomes available through
other means.

The following custom API has also been added:
* **x-namespaced-simple-storage**: Simple storage applied to a particular
namespaced subobject; allows sites to only request privileges for shared
storage on a particular namespace without needing any particular site to
be the sole owner/manager of the data.

(Custom APIs should normally only be added if they offer some functionality
that is particularly suited to the web environment; otherwise, we will defer to
the SDK APIs.)

Once the initial testing phase is complete (now maybe "beta" for functionality,
though "alpha" as far as potential for security risks since I am not so familiar
with the security model in Firefox), it should be easy to add more low-level
APIs (where relevant), mostly just needing some warning text for users which
adequately warns them of risks to that API.

Security concerns
==============

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
at your site which will cause the user's  bank passwords to be read,
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

API
===

The API is subject to change. Although it technically allows synchronous usage
when the user has already approved the privileges, this is not a frozen syntax
and may be removed in the future.

I would like to ensure the provided RequireJS plugin is consistent, so I'd
like to consult further to consider the best way to do this for all environments.
Once that is decided, I think that might end up as the recommended way to
use the API, but in the meantime, feel free to experiment with the examples
(see the repo's HTML files for more):

```javascript
  AsYouWish.requestPrivs(['xhr', 'url'], function (xhr, URLObj) {
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

The following will remove privileges for the current site.

```javascript
AsYouWish.removePrivs(); // Only usable on current site
```

To get an object whose keys indicate all available privileges,
and whose alues are the localized text warnings that will be
shown to the user, the following is currently exposed for
debugging or detection purposes (but may be removed
or changed in the future):

```javascript
AsYouWish.getDefaultPrivs();
```

Using the provided priv plugin for RequireJS (which also
of course requires RequireJS itself), the API is similar,
with a difference with errors and a need to prefix each
requested privilege with `priv!` (this is for the sake of
harmony with RequireJS which can make non-privileged
module inclusions as well which do not require a prefix):

```javascript
require(['priv!xhr', 'priv!url'], function (xhr, URLObj) {

    // e.g., same as above...

}, function (errorObj) {
    alert(errorObj.state + '::' + errorObj.args);
});
```

RequireJS also always requires an array, so I may settle on that
for AsYouWish as well as perhaps harmonize the errBack argument
format if not the name of the function itself.

Further details (e.g., possible error types) should hopefully
be provided eventually on
the [wiki](https://github.com/brettz9/asyouwish/wiki).

Again, please do not get too comfortable with the current API, as details
may change.

I am strongly leaning toward the RequireJS API, so I recommend use
of the plugin API for now; it should also be easier to keep that stable if the
built-in API changes (e.g., to auto-inject our own require() function which
supports the plugin and replicates existing functionality, avoiding the
need for an additional file inclusion).

Advantages over custom add-ons
==============================

Web applications already are gaining potential access to dangerous
features (e.g., Geolocation) and are thankfully starting to work more like
desktop apps, with offline storage, caching manifests, desktop
notifications, so it is, I think, a natural step to allow HTML to gain
access to the browser ecosystem in an ideally eventually standard
way since it is ALREADY POSSIBLE to write privileged code with
easy installation by users--they're called add-ons. :) 

For those who would accuse AsYouWish of introducing undue risks,
I want to point out that third-party installation of addons is still possible
at the time of writing (and that doesn't tell you what risks might be
present; AsYouWish at least tries to tell you some of the risks
that may be involved). Although Mozilla states they might make 3rd-party
installation of addons more difficult in the future, I might point out that
for a browser to remain open, it will presumably still need to at least
allow some way for the user to opt in to allowing sites to allow privileged
addons (so that Mozilla is not the exclusive gate-keeper). And refusing
to allow an easy and potentially standard means of writing addons via
regular websites strikes me as hardly being in the spirit of openness,
especially when there does not appear to be any essential security
difference between addons and AsYouWish-enabled sites.

But yes, as with
add-ons I would hope such as Mozilla may be able to host such privileged
HTML at their Marketplace as they do with add-ons and non-privileged web apps,
providing added peace of mind to users that the apps they are installing are
reviewed for security.

1. AsYouWish informs the user of exactly which privileges are being
required--addons, on the other hand, are, if approved by the user,
given full privileges without discrimination (though the ones hosted at
addons.mozilla.org are vetted at least for security and I was told that
Mozilla intends to make it harder to install (presumably non-AMO) 3rd
party add-ons).
2. This approach could I think more probably become standardized upon so
developers could use just one way to request such privileges, rather than
creating different code for different browsers (and forcing the user to
use a particular browser).
3. It allows the developer to host the content at their own site in a simple
way (or just on their own machine) without packaging up their files into
special zip files, etc. in order to get privileged access, as is necessary
with addons (though the user can utilize HTML5-standard means of
offline manifests and the like to work offline). The fewer the obstacles,
and shorter the testing iteration cycle, the faster developers can create
and users can see good quality tools.
4. Avoids requirement to developer to add a lot of meta-data at the
get-go or to bother the user to add such sites to their addon registry or
consume resources on browser restart when they only need one-time or
occasional privileged app usage (though as per possible future goals, I
would like to allow optional full addon registration in the future).
5. Would simplify addon submission as well, as user could simply point
to their site, rather than having to upload their files.
6. Might even replace addons-specific packaging,
thereby creating a single process for making regular websites,
Marketplace apps, and addons (with the Marketplace enabled by default
as the only site allowing requests for privileges) and allowing
easy hackability on one's desktop.
7. Allows debugging to be done on one's own site rather than say at the
Addons Builder site, though it would be ideal if there could be some open
REST API or the like (maybe with a client-side API as with BrowserID) to
allow the addon to ask itself to provide a credentialed update for incremental
unapproved versions to the Builder site, as well as an API to request review
for the add-on (or delete itself, etc.). This would also allow alternative
web-based IDEs to handle local development yet have access to rapid
submission for review at AMO as with the builder site--without the cruft of
downloading some custom non-JavaScript (i.e., Python) build environment.

Comparison to Open Web apps
=========================

While Open Web apps do have privileged potential, they currently do not
appear open to exposing full addons privileges. Also, although
the Mozilla Marketplace lets one target a website to install it, and one
can have non-privileged apps installed from a site without packaging
the file, there does not appear to be a way that a site can request
privileges for itself to be installed with higher-than-website privileges
(though privileges which are still limited in comparison to addon
privileges) without the user creating a specially packaged file.

Comparison to Plugins like Flash
================================

I'm hoping this can really turn into an API agreed on by the browsers so
available by default. The add-on itself is written in JavaScript, so
hopefully accessible enough to easy introspection. AsYouWish has no
need for special file formats, HTML object tags, etc.

Comparison to ActiveX / netscape.security.PrivilegeManager.enablePrivilege
==========================================================================

This is similar to these technologies, but the aim is to be potentially
cross-browser (and
enablePrivilege is [out the door](https://bugzilla.mozilla.org/show_bug.cgi?id=546848) now in Firefox).

Comparison to [Microsoft HTA](http://en.wikipedia.org/wiki/HTML_Application) (HTML Application) files
===========================================

While the concepts are similar, AsYouWish differs in these regards:

1. HTA files, when run from the browser, require user permission before
loading; AsYouWish allows web applications to function normally while
conditionally requesting support for higher privileges without being
necessarily dependent on them. Admittedly, however, a dedicated
content-type/file extension may be useful in the future toward promoting
usage of the synchronous API.
2. There is no means to execute AsYouWish with exe privileges unless
the user has approved, though user may allow the "file" protocol to
execute AsYouWish-enabled web applications locally.
3. Although there is no `<HTA:application>` element for declaratively
defining within HTML a means of accessing the "add-on", the user
may pin the AsYouWish-enabled site as an application tab (a normal
browser feature), and the developer may use the "widget" API to make
the application accessible via the add-on bar (though the contentScript
may need to be expressed as an eval-able string currently since it may
otherwise expect the script files to be stored within the AsYouWish
addon). Note, however, that adding to the add-on bar will not be available
on  browser restart; there is currently no means in AsYouWish allowed
for genuine add-on registration (i.e., to appear within the Addons dialog
and auto-load on browser restart), though it is planned for the future.
4. HTA files apparently provide, once the user has permitted their
execution, full access to privileged APIs such as `ActiveXObject`,
`execCommand`, and `window.clipboardData`. While it should be
possible to emulate IE in this regard, I felt it was not worthwhile given
the proprietary nature of ActiveXObject and its arguments, the
lack of a uniform privileged API, and the apparent lack of (easy?)
extensibility of IE itself to support the APIs such as are being added
now to Firefox. The same APIs would also not be mirrorable within
regular websites using AsYouWish's asynchronous API.

Comparison to ["Molecule Man"](http://en.wikipedia.org/wiki/Molecule_Man) in the Marvel Universe
===================================================

Sorry, I just love the analogy too much whereby the "Molecule Man" in Marvel
comics discovers, courtesy of a God-like being, that it has only been a
mental block keeping him from manipulating organic matter in addition
to inorganic matter. While the danger there too is clear,
there are similarly a potentially great many benefits.

My feeling is that inhibitions have kept the web from being opened up to
a wider developer base as with the web, both with addons' cross-browser
incompatibilities, need for dealing with zipping and installing special file
formats, etc., as well as a helpless attidue that "The web is the web,
the browser is the browser, and never the twain shall meet".

(Thanks to Marvel for great comic fun (the low-res image is from Marvel's
copyrighted work) and thanks to the
[Marvel Database](http://forums.marveldatabase.com) for scanning the image!)

![Molecule Man being given his insights](https://raw.github.com/brettz9/asyouwish/master/copyrighted/Marvel%20Super%20Heroes%20Secret%20Wars%20Vol%201%2011%20p6.jpg "Molecule Man gaining insights")

Addons
======
Though planned for version 0.4, there is no easy way currently to register
sites as 'addon' websites (unless adding XPI files which can be done without
AsYouWish).

In the meantime, one might use the ["tabs" module](https://addons.mozilla.org/en-US/developers/docs/sdk/latest/modules/sdk/tabs.html#pin%28%29)
to ask the user to permit the pinning of the current tab as an app tab.

Future goals (scheduled)
====================
Version 0.4: 
* Allow websites to at least launch websites on browser start-up in perhaps
a hidden window if approved by the user.

Possible future goals
=================
1. Expose custom APIs for nsIProcess and IndexedDB (if SDK does not do so)
2. If at all possible, I would like to expose the ability to create genuine
add-ons (which show up in the add-ons menu and are available at
restart) without an XPI file and without needing to write one's own
complex loading code.
3. Blacklists might be a nice addition when whitelists are off.
4. Add localizations (i18n is done)
5. Addon website store(s): let sites register themselves as stores, integrating
with receipts, licenses, etc., and allowing, e.g., searching and display of
featured "addon" websites within AsYouWish's "addon" websites manager via an
open API (and not limited to even just one store at a time) and perhaps
allowing a whole site to be deemed trustworthy upon
initial permissions if the user agrees to permit such a store.
6. Allow a means of forking a website which indicated its content could
be installed under given licenses (or even if not, could allow client-side
forking).

Some additional intended use cases
==================================

1. One particular reason I am interested in this is that I feel it is
unfortunate that for current web applications, different third parties cannot
access a shared database hosted privately in the user's browser (unless it
"belongs" to one of the websites). For example, in an application I'm hoping
to build, I'd like to let the user store books they have found and browsed
offline, but I'd also like to expose the data so that other web applications
could also access it (if the user permitted), allowing people to innovate
into the future without requiring new ways of storing the data. I could
provide an API specific to my site, but I'd like this to be doable in
a neutral and familiar way.

2. I also like the idea of a browser-in-a-browser which could theoretically
be done with privileges and shared databases (others have done a
browser-in-browser using the Flash plugin, but I'd like to see it work
without plugins--I'm hoping Mozilla may eventually come around to
including AsYouWish by default since it now uses a whitelist, etc. by default).
The advantage I see to this is that it may allow normal web developers
the ability to use familiar and easier languages to innovate with
user interfaces, while accessing the trickier and lower level plumbing
handled by the browsers. I am awaiting the landing of the
[Bug 802895](https://bugzilla.mozilla.org/show_bug.cgi?id=802895)
srcdoc feature to see if our (x-namespaced-)simple-storage
module for shared APIs could be used along with privileged DOM access
using [proxies](https://addons.mozilla.org/en-US/developers/docs/sdk/latest/packages/api-utils/content/proxy.html)?
to listen for events within iframes to be able to track frame history (for
the sake of backward/forward buttons).

3. Ability to distribute web utility apps which read or write to files, so
web apps which, for example, build configuration files, do not need to
force the user to copy paste from a text box or depend on downloading
and installing some bulky server-side language interpreter (possibly
in a non-JavaScript language). AsYouWish might even be used to make a
server!

4. Last but not least, a Git-accessible client-side web-based
IDE... (Firefox can execute files and processes, so if
nothing else, some kind of command-line interface).

Rejected ideas
============

1. For security reasons, I decided against allowing an entire folder hierarchy
to gain privileges without the need to make additional requests. The reason
for this is that if the site included any untrusted 3rd party libraries within
the directory, the user could be at risk (and would also require internal code
changes as we are currently depending on site-specific preferences).

2. There is no need to expose globals in the SDK of "self" (as it is only a
part of content scripts, so page-mod can utilize within a string) or "addon"
(which is for page-worker content scripts).

Unresolved
=========
1. Any security issues? Safety of wrappings, require() object wrapping?
2. Exposing additional globals? unsafeWindow or others otherwise accessible
in addon code--e.g., is XPCNativeWrapper available through require('chrome')?
3. Settle on sync or async API (probably async)? If do sync, should we allow
postMessage to notify site of approval or allow callback for continued
execution when not set yet (or just errBack with a new mode)?
4. Integrate with [requireJS](http://requirejs.org/) as plugin or even make
API the same (and handle non-plugin requiring) so additional script not
needed. Use with [my shim plugin](https://github.com/brettz9/asyouwish/wiki),
so every environment from addons to privileged HTML to the server and regular
client-side code can write clean modules in uniform manner.
5. Inject AsYouWish methods as functions instead? (if possible to overcome
__exposedProps__ requirement with functions).

Known Issues
===========
1. Privileges don't load on initial browser load as apparently not injected
at that time with content-document-global-created event.
2. instanceof issues with chrome content
    1. e.g., the wrapping within AsYouWish (using specialPowers/proxies)
    does not work with SDK Widget (/addon-sdk-1.12/lib/sdk/widget.js) which
    checks for instanceof Panel (resolved in AsYouWish by changing this
    code to duck type)
    2. workarounds most likely needed for other instanceof usages within
    the SDK (no way to get SDK to [use custom instanceOf function](https://bugzilla.mozilla.org/show_bug.cgi?id=823790)
    that can be overridden?)
3. XUL elements are not supported, but see [https://github.com/brettz9/asyouwish/wiki#wiki-xul](the wiki)
for a possible means around it (though probably better to move away from XUL
unless supported by XBL).
4. Memory leaks?; see https://github.com/brettz9/asyouwish/issues/3
    a. Resources?
        https://blog.mozilla.org/nnethercote/category/aboutmemory/
        https://wiki.mozilla.org/Performance/MemShrink
        https://wiki.mozilla.org/Performance:Leak_Tools

Name
====
The name dervies from what it allows (so users and developers can have
convenience in apps not excessively circumscribed, even while taking into
account security concerns) and is also a nod to the
[25th anniversary](http://www.usatoday.com/story/entertainment/2012/10/03/princess-bride-cast-reunites-for-25th-anniversary/1610061/)
to the film Princess Bride where this line was used in the film.

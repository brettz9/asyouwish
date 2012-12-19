asyouwish
=========

AsYouWish is a browser add-on (currently Firefox only) to allow requests for browser
privileges to be made from regular HTML.

***Using this add-on is at this point still potentially quite dangerous, e.g.,
to your data (not only browser data) so don't install--especially at this
time--unless you are willing to take the risks. It is hoped this may go
through a thorough security vetting as part of the process to get the
add-on accepted at [AMO](https://addons.mozilla.org/).***

Obviously allowing privileges may be dangerous if used by a malicious
site (as with addons), so there needs to be a way to inform the user that
there is a request and allow them to refuse or accept. AsYouWish tries
to provide this (the latest beta is also available for testing via the Mozilla
[Addon Builder](https://builder.addons.mozilla.org/package/164286/latest/)
site, though I have to emphasize again that this has not been reviewed
for security (and it is missing localization information, including
detailed warnings)!

Access is granted to specific URLs, not including the query string/hash.
Privileges do not apply site or even folder wide to allow a greater sense
of security and choice in case a website allows third party add-ons
which may seek their own privileges.

Exposed privileges
====================

At present, all [high-level APIs](https://addons.mozilla.org/en-US/developers/docs/sdk/latest/)
are exposed, as well as the following low-level APIs: io/file and net/xhr.

Requests at this point can therefore be made of the user for:
* **clipboard**: Accessing or setting the clipboard
* **context-menu**: Accessing or adding to the browser's own context menu
* **file**: Reading, removing, or writing files and directories on the user's desktop
* **hotkeys**: Creating new browser-wide keyboard shortcuts
* **page-mod**: Modifying any web content the user loads in the browser
* **page-worker**: Performing hidden loads of cross-domain web content
* **panel**: Loading HTML into a dialog
* **passwords**: Reading or removing user's site passwords or store new passwords
* **private-browsing**: Detecting of when user is in private browsing mode.
* **selection**: Accessing user highlighted selections made within the browser
* **simple-storage**: Accessing SHARED simple storage to store data accessible to any
other AsYouWish-enabled website approved by the user without needing one site to act
as gate-keeper of the data.
* **tabs**: Listening to changes in user tabs, controlling tabs, opening new tabs, or accessing any other opened browser tab content
* **widget**: Creating an addon user interface (widget) to be hosted in the add-on bar
* **windows**: Listening to changes in user's browser tabs, controlling tabs, opening new tabs, or accessing any other opened browser tab content
* **xhr** or **request**: Making cross-domain browser requests (accessing a remote website
using the user's credentials)

The following, apparently fully safe libraries made available by the Addons SDK
and which can perhaps be allowed without permissions in the future (if not standardized):
* **url**: URL parsing/retrieval utilities
* **base64**: Character-set-aware base64 encoding and decoding
* **querystring**: Serializing/deserializing of URL query strings

The following other high-level APIs have currently been allowed, but they are
apparently of limited to no use because they are either already available to
regular websites or they are specific to the AsYouWish addon.
* **notifications**: Creating Toaster-style notifications; use Web Notifications instead?
* **console**: Accessing addon console object (including 'exception' method)
* **addon-page**: Opening AsYouWish's data/index.html in a bare type of tab (doesn't exist currenty)
* **l10n**: Acccesing AsYouWish's localization strings
* **self**: Accessing data of the AsYouWish addon
* **simple-prefs**: Storing and setting non-site-specific preferences for AsYouWish if stored using this preference
* **timers**: Accessing web-like timing

Requiring the chrome object (for access to most XPCOM functionality) is
currently also possible, though this Mozilla-oriented API may be removed
in the future, especially if existing functionality becomes available through
other means.

Once the initial testing phase is complete (now maybe "beta" for functionality,
though "alpha" as far as potential for security risks since I am not so familiar
with the security model in Firefox), it should be easy to add more low-level
APIs (where relevant), mostly just needing some warning text for users which
adequately warns them of risks to that API.

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
easy installation by users--they're called add-ons. :) And yes, as with
add-ons I would hope such as Mozilla may be able to host this privileged
HTML at their App Store as they do with add-ons and non-privileged web apps.

1. AsYouWish informs the user of exactly which privileges are being
required--addons, on the other hand, are, if approved by the user,
given full privileges without discrimination (though the ones hosted at
addons.mozilla.org are vetted at least for security and I was told that
Mozilla intends to make it harder to install (presumably non-AMO) 3rd
party add-ons).
2. This approach could I think more probably become standardized upon so
developers could use just one way to request such privileges, rather than
creating different code for different browsers.
3. It allows the developer to host the content at their own site in a simple
way (or just on their own machine) without packaging up their files into
special zip files, etc., as is necessary with addons. The fewer the
obstacles, and shorter the testing iteration cycle, the faster users can
see good quality tools.

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

Comparison to "Molecule Man" in the Marvel Universe
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

![Molecule Man being given his insights](https://raw.github.com/brettz9/asyouwish/master/Marvel%20Super%20Heroes%20Secret%20Wars%20Vol%201%2011%20p6.jpg "Molecule Man gaining insights")

Future goals
============

1. Harmonize with [requireJS](http://requirejs.org/) and
[my shim plugin](https://github.com/brettz9/asyouwish/wiki),
so every environment from addons to privileged HTML to the server and regular
client-side code can write clean modules.
2. If at all possible, I would like to expose the ability to create genuine
add-ons (which show up in the add-ons menu and are available at
restart). In addition, or instead, I'd like to allow websites to at least launch
websites in perhaps a hidden window, if approved by the user on
browser start-up.
3. Blacklists might be a nice addition.
4. Localization (i18n is done)
5. And expose more low-level APIs....

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
handled by the browsers.

3. Ability to distribute web utility apps which read or write to files, so
web apps which, for example, build configuration files, do not need to
force the user to copy paste from a text box or depend on downloading
and installing some bulky server-side language interpreter (possibly
in a non-JavaScript language). AsYouWish might even be used to make a
server!

4. Last but not least, a Git-accessible client-side web-based
IDE... (Firefox can execute files and processes, so if
nothing else, some kind of command-line interface).

Name
====
The name dervies from what it allows (so users and developers can have
convenience in apps not excessively circumscribed, even while taking into
account security concerns) and is also a nod to the
[25th anniversary](http://www.usatoday.com/story/entertainment/2012/10/03/princess-bride-cast-reunites-for-25th-anniversary/1610061/)
to the film Princess Bride where this line was used in the film.

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

No site can even ask for privileges until the user configures AsYouWish
to allow requests from their site (or type of site). (See the "Usage of the
options dialog" section below for more details.) So if the user effectively
says through their options, "Go ahead and let any HTTPS site ask
me for privileges", the addon will allow that, but the default is to require
the site to be added to a whitelist before it can even ask the user for
permission and then the user will need to agree.

While this makes it harder
for developers to get users set up (as the users will first need to learn
how to configure the addon to let the site even ask them), this is intended
to provide some means of protecting users from themselves, especially
those users who just click "ok"
to dismiss warnings without first reading them. The privileges that can
be granted to sites are as dangerous as being able to read the user's
bank passwords, read and control what tabs they have open, visit other
sites in their name, read or destroy their local files, etc. etc. Yes, this
is dangerous stuff, but that capability is also available to regular addons,
and can be used to provide useful functionality to users (e.g., a password
manager, a file browser, etc.). This addon just makes it all explicit and
slightly easier for developers to create.

The API mirrors the Mozilla Add-ons SDK API, so there is little new for
developers to learn who are familiar with this API. It is also hoped
that this API might be mirrored in other browsers in the future.

Access is granted to specific URLs, not including the query string/hash.
Privileges do not apply site or even folder wide (to allow a greater sense
of security and choice in case a website allows third party add-ons
which may seek their own privileges).

Usage of the options dialog
=====================

![Options dialog](https://raw.github.com/brettz9/asyouwish/master/data/ayw-options/options-screenshot.png "Options dialog")

While I hope to simplify the dialog in the future for the average user,
AsYouWish currently offers a rather high degree of
control over exactly what privileges can be approved or even requested
and from what sites or types of sites privileges may be requested.

A site can be allowed the ability to REQUEST a privilege (though
you will still have to approve the request) by one of the following means:

1. Enable "Allow privilege requests from all protocols" (which will also enable
"Allow privilege requests from all websites whose protocols are allowed"). This
is the most dangerous option as it can cause a security risk if you approve
privileges even to trusted sites (if a hacker can get between you and the
site). This is not recommended.
2. "Allow privilege requests from all websites whose protocols are allowed"
with the particular protocol, added to the "Allowed protocols" list. This is less
risky than #1, but can still face the same danger as #1 if non-secure protocols
like "http" are allowed. By default only "https" and "file" protocols are allowed,
as they should hopefully not be subject to any kind of man-in-the-middle
attack (though they can still be dangerous if the originating site is malicious
or itself subject to exploits).
3. Add a specific website to "Allowed websites" via "Grab current website" or
"Select local file" and then select "Allow on visit" ("Allow as addon" will
also do so, but not all sites will work as addons, and for the
ones that can, it may not be necessary since the site can itself request
"addon" privileges once the site is granted the right to make requests
via "Allow on visit"; see the '"Addon" websites' section below for more).
This option is normally more secure than #1 or #2
because arbitrary sites cannot request privileges, but if you whitelist
an unsafe site or protocol, you may still be subject to danger.

If none of the above are enabled, the site cannot even ask you for privileges,
let alone be granted them, but if any one of them is enabled, the site can at
least ask for privileges.

If you want to live a little dangerously (you are not afraid of accidentally
or mindlessly pulling the approval pulldown to say grant any site
very dangerous privileges), you can select #2 and then any website can
immediately request privileges without any extra hassle for you or the
website; you can still disapprove, but it puts you a little closer to danger,
so it is not allowed by default.

You could also select #1 to allow even sites like "http" websites to ask
you for privileges, but this is inherently dangerous because non-secure
protocols like "http" allow hackers to potentially get between your
browser and even a trustworthy site. This is not recommended.

As far as the specific lists of websites shown in the options dialog:
1. "Allowed websites" refers to sites which are explicitly allowed to
REQUEST privileges. That's all.
2. "Websites from which specific privileges have already been
requested by the site and approved" refers to sites which can
request and have requested privileges, AND for which the user
has already approved privileges. These sites will also be shown in #1,
but not all of #1 will necessarily be here.
3. "Websites which will be executed (in hidden windows) on browser
restart" refers to sites which have been requested by the site (or
designated by the user) to run anytime the browser restarts (and when
first added by the user). Such sites are also allowed to request
privileges (so they will also appear in #1), but the user must still
explicitly approve any other privileges that such "addon" sites
request (before they can appear with the specifically
approved privileges in #2).

Removing an item from the allowed list, will remove it from the allowed,
approved, and addons lists (if present).

Removing from the approved list will only remove it from that list
(since the user may still wish to allow sites the ability to request other
privileges). Similarly, removing from the addon list, will only remove it
there since the user may wish to still allow the site to request privileges
without running on browser restart.

Finally, the whitelisting of specific privileges (if the checklist is enabled
to enforce the whitelist) will prevent any privileges
from being requested or granted (even if the site is otherwise allowed
to request privileges). Tooltips are available to explain the APIs at
some level, but these are only my layman's understanding of the API
so if in doubt, please see the [SDK documentation](https://addons.mozilla.org/en-US/developers/docs/sdk/latest/).
Note that (when the checklist is enforced), requests to act as an addon
can be enabled or prevented via the presence or absence of the
"x-register" privilege in the whitelist (but this item will not disable or prevent
already approved addons or explicitly added ones).

"Addon" websites
==============

AsYouWish allows websites to be run as "addons". While these "addon"
websites do not automatically gain additional privileges,
they will be able to request additional privileges upon load and they are
loaded in a hidden window immediately upon approval and upon
each browser restart.

This could be used, for example, to add a widget/panel to the add-on bar
(or say add to the context menu, etc.) to function similarly to normal
addons--except that you never need to zip up your HTML file (though the
site can take advantage of HTML5 features for offline caching).

Currently, "Allow as addon" does not automatically give privileges--though
it can request them; it simply means it will be launched in a hidden window
on each restart (and when first chosen).

Note however that even if a site has only asked for "addon" privileges,
one might still consider it as a privacy concern for a site to know when
you are loading your browser and may add a performance load.

Regarding the distinction between an addon and regular privileged site,
normally the site will determine which way it will run. However, one can
install from a local file, for example, and the file could be designed to be
usable either as an addon and/or as a regular site, so that choice is
made available (e.g., if you only want a global context menu to appear when
you are ready to work on such a project, you can bookmark the page
without adding the page as an "addon", while other users might wish
to always see the functionality upon browser restarts).

One may use AsYouWish's options (its icon is in the add-on bar) to remove
a site from being treated as an add-on, but if you have assigned privileges
to an untrustworthy site, damages may have already been done.

For developer information on "addon" websites, see [https://github.com/brettz9/asyouwish/wiki/Developer-Guidelines#wiki-addon-websites](https://github.com/brettz9/asyouwish/wiki/Developer-Guidelines#wiki-addon-websites).

For my concept of a Browser-in-Browser (to allow a regular website to
function as the browser UI) and the idea for it to become itself extensible
with addons, see the section "Some additional intended use cases" below.

IMPORTANT information for developers
===============================

* PLEASE READ [https://github.com/brettz9/asyouwish/wiki/Developer-Guidelines#wiki-security](https://github.com/brettz9/asyouwish/wiki/Developer-Guidelines#wiki-security) for
the very critical **security concerns** to take into account when making an application for your users.
* See [https://github.com/brettz9/asyouwish/wiki/Developer-Guidelines#wiki-privileges](https://github.com/brettz9/asyouwish/wiki/Developer-Guidelines#wiki-privileges) on the **specific privileges** you can request (as also documented at [https://addons.mozilla.org/en-US/developers/docs/sdk/latest/](https://addons.mozilla.org/en-US/developers/docs/sdk/latest/)).
* The **API** is documented at [https://github.com/brettz9/asyouwish/wiki/Developer-Guidelines#wiki-api](https://github.com/brettz9/asyouwish/wiki/Developer-Guidelines#wiki-api) and error listeners at [https://github.com/brettz9/asyouwish/wiki/Developer-Guidelines#wiki-errors](https://github.com/brettz9/asyouwish/wiki/Developer-Guidelines#wiki-errors).
* Creation of **"Addon" websites** is documented at [https://github.com/brettz9/asyouwish/wiki/Developer-Guidelines#wiki-addon-websites](https://github.com/brettz9/asyouwish/wiki/Developer-Guidelines#wiki-addon-websites)

Advantages over custom add-ons
==============================

Web applications already are gaining potential access to dangerous
features (e.g., Geolocation) and are thankfully starting to work more like
desktop apps, with offline storage, caching manifests, desktop
notifications, so it is, I think, a natural step to allow HTML to gain
access to the browser ecosystem in an ideally eventually standard
way since it is ALREADY POSSIBLE to write privileged code with
easy installation by users--they're called browser add-ons. :)

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

AsYouWish has also added its own support now for "addon" websites, thus
allowing the benefits above to be available on each browser restart, with
the user's permission.

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

While this addon does not allow you to use the same old API, a similar level of trust with
sites being able to request privileges if from a signed script, can be
enforced by enabling the options checkbox "Allow privilege requests from all
websites whose protocols are allowed". Then
you will not need to first add sites to the allowed whitelist (see the "Usage
of the options dialog" section though on security concerns).

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
addon). Adding to the add-on bar so that it is available on browser restart
is also possible as long as one registers it as an "addon" website. There
is currently no formal means in AsYouWish to allow genuine add-on
registration (i.e., to cause "addon" websites to appear within the Addons
dialog), though it is a possible todo for the future.
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
copyrighted work) and thanks to the folks (Supermorff and m1shawhan) at the
[Marvel Database](http://forums.marveldatabase.com) for finding and
scanning the image!)

![Molecule Man being given his insights](https://raw.github.com/brettz9/asyouwish/master/restricted-copyright/Marvel%20Super%20Heroes%20Secret%20Wars%20Vol%201%2011%20p6.jpg "Molecule Man gaining insights")

Future goals (scheduled)
====================
Version 0.6:
* More precise control by the user or site over namespaced shared storage.

Possible future goals
=================
1. Expose custom APIs for nsIProcess and IndexedDB (if SDK does not do so)
2. If at all possible, I would like to expose the ability to create genuine
add-ons (which show up in the add-ons menu as well as being available at
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
7. Allow websites to register their own modules for possible inclusion
by other sites.
8. Allow additional refuse option to remove a site from allowed sites so
it can't request privileges again.

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
using [proxies](https://addons.mozilla.org/en-US/developers/docs/sdk/latest/modules/sdk/content/content-proxy.html)?
to listen for events within iframes to be able to track frame history (for
the sake of backward/forward buttons). These browsers might even
be able to support their own "addons".

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

3. While it would be convenient to drop it, I decided to require the full "sdk/"
path for consumers of low-level APIs since usage without it is to be
deprecated (and perhaps low-level APIs may be more subject to
change (and be browser-specific) anyways).

4. Although we could potentially i18n-ize short priv names (and sort
accordingly), since the tooltip gives the description, and since these
are actual APIs, I felt it best to stay with the English for these.

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
    checks for instanceof Panel (resolved within AsYouWish by changing this
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

# 5.1.0
- Add support for private window browsing

# 5.0.0
- Reformat package.json for jpm

# 4.1.0
- Update to SDK 1.17
- API: Add support for sdk/content/symbiont and sdk/system/child_process
- Add system/child_process demo

# 4.0.0
- Breaking change: Change AYW button from using deprecated widget API to ui/button/action API.
- Breaking API change: Remove access to sdk/widget in favor of ui module (and utilize in own demos, including now fixed "add-on" demos)
- Breaking API change: Drop now absent sdk/content/symbiont API
- API: Add support for modules: sdk/(ui, content/mod, lang/functional, lang/type, places/bookmarks, places/favicon, places/history, stylesheet/style, stylesheet/utils, test/utils, ui/button/action, ui/button/toggle, ui/frame, ui/id, ui/sidebar, ui/toolbar, util/array, util/match-pattern, util/object)
- i18n: Fix i18n of system/events
- Demos: Add bookmarklet code with dire warning about usage
- Demos: Add eval and simple eval demos for live SDK evaluation (has some responsiveness issues)
- Demos: Use more granular sdk/system module for subprocess demo over chrome
- Demos: Use async Ajax in demo
- Demos: Fix requireJS priv! test to utilize full "sdk/" prefix
- Minor: Add docs, update readme/todos, update CodeMirror, jQuery and subprocess, alter height in CM demos

# 3.0.0
- Breaking change: Remove deprecated "sdk/addon-page" API

# 2.0.0
- Breaking change: Replace deprecated API "sdk/page-mod/match-pattern" with "sdk/util/match-pattern"

# 1.3.1
- Fix a bug with localization of messages

# 1.3.0
- Hide "Allowed protocols", "Allowed websites", "Allowed and approved websites", "Addon websites", and "Whitelisted privileges" JSON array/object options from user options dialog as there are currently no appropriate multiple select preference types we could use here (and users are liable to misunderstand or break the code with such an interface); these preferences are all controllable in the main AsYouWish dialog anyways.

# 1.2.1
- Ensure version notes up to date, including missing breaking change for 1.0.0

# 1.2.0
- Rename internal namespace to better avoid chance for conflicts with those using simple-storage. Will be a breaking change for those relying on old namespaced storage being preserved (but this minor version is following very shortly after 1.0.0, so I am not upping the major version for it).

# 1.1.0
- Added beginnings of browser-in-browser demo

# 1.0.0
- Breaking change: Requires "sdk/" prefix on high-level APIs as per the SDK
- Breaking change: AsYouWish.requestPrivs() now requires an array for its first argument (of requested privs) even if only requesting a single privilege; the synchronous API should be a single string
- Internal code improvement: Remove deprecated calls within code and demos (which will hopefully help prevent conflicts but keep compatibility if SDK uses Node APIs without putting them as "SDK"!)
- Utilize SDK 1.15 (panel/widget combo is still not working, even with my mod, so using the non-modded version)

# 0.5.2
- FF Update: Support up to Firefox 21 (panel/widget combo is not currently working)
- Utilize SDK 1.14 including adding new SDK APIs: indexed-db, sdk/system/events, sdk/tabs/utils and removing no longer present SDK API: sdk/content/content-proxy
- Usability improvement: Include (non-localized) privileged name in request notifications along with localized message
- API addition: x-subprocess library (courtesy https://github.com/ochameau/jetpack-subprocess/ ) as available privilege and
utilize within subprocess and command line demos
- API improvement: Allow x-unload event for event about removal of privileges for normal
privileged sites.
- API fix: Restore sync API (but only allows one object to be returned)
- Internal code improvement: attempt to address some can't access dead object errors (missing windows)
- Other coding improvements

# 0.5
- Security improvement: Require register() calls to first be allowed to ask to serve as an addon.
- Security improvement: Allow "x-register" to be added to the enforced whitelist to allow prevention of addon registration requests
- API change: Require full paths for low-level APIs (as shorter versions are deprecated in the SDK)
- Usability bug fix: Ensure addon registration always enables ability to request privileges
- Usability bug fix: Ensure that allowed websites are updated whenever approved websites are updated (e.g., if user disallows a site which is an addon, causing it to trigger its unload event which can request privileges again)
- Usability bug fix: Display addon meta properties in UI
- API improvement: Remove undocumented getDefaultPrivs in favor of more functional getPossiblePrivs
- API improvement: Allow isRegistered to check version/properties
- API fix: Fix register() errBack execution
- Usability improvement: Allow 'file' protocol by default along with 'https' (because there should not be the same risk of man-in-the-middle (and it will still need to request privileges to get them))
- i18n: i18n-ize content scripts

# 0.4.1
- Security Bug fix: Though it did not allow other privileges without permission, the code to first confirm the user wanted to install an addon was not present
- Improvement: Avoid errors in addon unloading and isRegistered() checks

# 0.4
- Major feature: Support restartless "addon" websites (URLs invoked at startup in hidden DOM windows) including ability to request and access privileges
- Feature: Add file picker for choosing site (usable for visited or "addon" websites)
- Feature: Added privilege whitelist as an additional option to restricting request types

# 0.3.1
- Usability bug: Force allow all protocols to also allow all websites, and disabling of allow all websites to disable allow all protocols (radio button-like behavior)

# 0.3
- SDK-interaction Bug fix: Adapt SDK code to allow widget API to accept wrapped panels
- Minor bug fix: Make "current" options empty on panel open
- Feature: Expose remaining low-level APIs
- Improvement: Retry notification in case two attempts made to open at same time

# 0.2
- Bug fix: Replace ugly select option expansion with CSS-based tooltip
- Feature: Add and wrap remaining high level APIs and add own custom x-namespaced-simple-storage API (a subset of simple-storage)
- Feature: add getDefautPrivs() API for introspection on possible privs
- Improvement: Listen to all option changes, e.g., from Firefox's own dialog
- Improvement: Remove hard-coding of https for those who wish to disallow
- Improvement:i18n options HTML file
- Improvement: Add try-catch within callbacks in demos

# 0.1
- Initial release

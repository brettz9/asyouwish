/*globals exports, require, Cc, Ci, Cu, XPCNativeWrapper */
/*
Code notes/possible goals (see README for features; this here is only for internal code clean-up todos):
1) For changes to allowable APIs, see getPrivilegedObject() here in main.js and defaultPrivs() in aywPrivManager.js
2) Whenever possible, utilize more of the built-in SDK APIs.
    a) Use simple prefs to ensure defaultPrivs are reset by new addon update instead of existing scheme?
    b) Ensure long-term storage for specifically approved settings/sites (i.e., not simple prefs); but then won't be auto-added to prefs
3) If the SDK may change to allow dynamic loads, make as separate module per https://addons.mozilla.org/en-US/developers/docs/sdk/1.10/dev-guide/tutorials/reusable-modules.html
   (operate on aywPrivManager's setGenericPrivs and getGenericPrivs methods; also change init() and add setGenericPriv()).
4) If we can i18n add-on name and description or get current locale to know which options.html file to use rather than requiring the information in the properties file, we can further/better i18n-ize.
5) Settle on full sdk paths if required (but avoid "sdk/" prefix for consumers?)

"Addon" release todos:

0) Better i18n-ize options.js
0) unload events called on addon/worker destroy? If not, add AsYouWish method (callback for 2nd argument to unregister); document what user should do
1) Ability to call unregister/reregister from website, e.g,. to install addon without restart (ensure same code is ok)?
    b) Utilize meta-data "license", "developer" (name, url), "version", "name", "description"
2) Include full-featured (all AsYouWish methods) "addon" demo
    a) Since we don't want to re-register upon start-up, can we allow check to see if already registered (either when registering and/or as separate API)? That would allow same code to work in browser
    // https://developer.mozilla.org/en-US/docs/Apps/Manifest

3) Readme todos (after "addon" release) & Update release notes
    0) Waiting: "With great power...":  http://www.psychologytoday.com/blog/between-the-lines/201105/ethical-lessons-kanazawa-recommendations-writers-and-editors
        Waiting on http://www.psychologytoday.com/blog/between-the-lines/201105/ethical-lessons-kanazawa-recommendations-writers-and-editors/comments
        If not, might try: http://geek-news.mtv.com/2012/06/11/apple-macbook-spider-man/
        "As you wish": http://thedrawncutlass.blogspot.com/2011/06/peter-falk-rip.html
        "This is a "Do whatever I want and get away with it" badge" http://michaelbaystransformers.wikia.com/wiki/User_talk:TroopDude#Welcome.21
    a) May be useful to load in background even without privs? e.g., to phone home, etc.?
    b) Must approve BEFORE added to hidden DOM window (or won't work until it is; unless this can be fixed)
    c) Along with pinning tabs, may simply create links to websites on desktop for such privileged apps

    d) Although AsYouWish provides addon functionality, I feel an extensible Browser-in-Browser is  better for the longer term--let the UI be in the hands of those needing HTML/JS only
    e) Find reference to Comparison to Addons to rmention support has now been added for pseudo-addons (addon websites) (and remove mention of planned addons, including in version.txt file and README future todos)
    f) A preferences 'add-on' could list and edit these "addon" websites or add within normal add-ons dialog.
    g) Document way to allow genuine registration of add-ons without XPI?
    h) remove from allowed: remove from allowed, approved, addons
    remove from approved: remove from approved
    remove from addons: remove from addons
    add to allowed:
    add to allowed and approved:
    add to addons: add worker immediately and add to prefs

    h) After new dialog (with addon section) so dialog is up to date and familiar: Show screenshots of dialog, etc. as part of pages your users must read--pointing them here might save you the trouble, and ensure that it is hosted at a site which should be secure (and where my wiki has not been made public).

*/
var chrome = require('chrome'),
    Cc = chrome.Cc,
    Ci = chrome.Ci,
    Cu = chrome.Cu,
    requestPrivs_Inject,
    requests = {};

// This is an active module of the AsYouWish Add-on
/**
* Set up listener for requestPrivs()
*/
exports.main = function () {
    'use strict';
    if (requestPrivs_Inject) {
        return;
    }

    var _ = require('l10n').get,
        workers = {},
        currentRequestIndex = 0,
        Spapi = require('./specialpowersAPI').SpecialPowersAPI,
        aywPrivManager = require('./AywPrivManager')(),
        PopupNotifications = require('./PopupNotifications').PopupNotifications,
        ContentDocumentGlobalCreatedObserverBuilder = require('./WindowObserverBuilder').ContentDocumentGlobalCreatedObserverBuilder,
        data = require('self').data,
        simplePrefs = require('simple-prefs'),
        pageWorker = require('page-worker'),
        prefs = simplePrefs.prefs,
        URL = require('api-utils/url').URL,
        windows = require('windows'),
        getMostRecentBrowserWindow = require('window/utils').getMostRecentBrowserWindow,
        optionsPanel = require('panel').Panel({
            height: 510,
            width: 1250,
            contentURL: data.url('ayw-options/options_' + _("locale") + '.html'),
            contentScriptFile: data.url('ayw-options/options.js')
        }),
        options = require('widget').Widget({
            id: 'ayw-options-btn',
            label: _("AsYouWish_options"),
            contentURL: data.url('ayw-options/options.png'),
            panel: optionsPanel
        }),
        /**
        * Return requested object
        * @param {String} privType The requested object type
        * @returns {Object} The requested object not yet wrapped with __exposedProps__ for security
        */
        getPrivilegedObject = function getPrivilegedObject (privType) {
            // Already confirmed valid type, and already confirmed user approval before call here.
            var obj, nsSS, namespace;
            // 1) Due to static linking requirements for add-on reviewers, we have to hard-code the paths inside the
            //   require calls. There is no doubt some way out, but for now, this is easiest solution, and also
            //   ensures we stay within bounds expected. Todo: This will need to be fixed if allowing other extensions
            //   the ability to add privileges. See https://bugzilla.mozilla.org/show_bug.cgi?id=627607
            // 2) In addition to adding here, it is necessary to add to defaultPrivs() in aywPrivManager.js
            switch (privType) {
                // Globals
                case 'console': obj = console; break; // Posseses "exception" property not present on normal console

                // Top-level
                case 'chrome': obj = chrome; break;

                case 'addon-page': obj = require('addon-page'); break; // Of little apparent use
                case 'l10n': obj = require('l10n'); break; // Of little apparent use
                case 'self': obj = require('self'); break; // Of little apparent use
                case 'simple-prefs': obj = require('simple-prefs'); break; // Of little apparent use
                case 'timers': obj = require('timers'); break; // Of little apparent use

                case 'base64': obj = require('base64'); break;
                case 'clipboard': obj = require('clipboard'); break;
                case 'context-menu': obj = require('context-menu'); break;
                case 'hotkeys': obj = require('hotkeys'); break;
                case 'notifications': obj = require('notifications'); break;
                case 'page-mod': obj = require('page-mod'); break;
                case 'page-worker': obj = require('page-worker'); break;
                case 'panel': obj = require('panel'); break;
                case 'passwords': obj = require('passwords'); break;
                case 'private-browsing': obj = require('private-browsing'); break;
                case 'querystring': obj = require('querystring'); break;
                case 'request': obj = require('request'); break;
                case 'selection': obj = require('selection'); break;
                case 'simple-storage': obj = require('simple-storage'); break;
                case 'tabs': obj = require('tabs'); break;
                case 'url': obj = require('url'); break;
                case 'widget': obj = require('widget'); break;
                case 'windows': obj = require('windows'); break;

                // These were tested with and without full path; only event/core, window/utils, and test/assert allowed a fuller path without sdk; the others required no full path (or a completely full path including sdk or toolkit): https://bugzilla.mozilla.org/show_bug.cgi?id=823821
                case 'toolkit/loader': obj = require('toolkit/loader'); break;
                case 'sdk/console/plain-text': obj = require('sdk/console/plain-text'); break; // console/plain-text
                case 'traceback': obj = require('traceback'); break; // console/traceback
                case 'content': obj = require('content'); break; // content/content
                case 'sdk/content/content-proxy': obj = require('sdk/content/content-proxy'); break; // content/content-proxy
                case 'sdk/content/loader': obj = require('sdk/content/loader'); break; // content/loader
                case 'sdk//content/symbiont': obj = require('sdk//content/symbiont'); break; // content/symbiont
                case 'sdk/content/worker': obj = require('sdk/content/worker'); break; // content/worker
                case 'sdk/core/heritage': obj = require('sdk/core/heritage'); break;
                case 'namespace': obj = require('namespace'); break; // core/namespace
                case 'promise': obj = require('promise'); break; // core/promise
                case 'event/core': obj = require('event/core'); break; // For some reason, this (along with window/utils and test/assert) worked ok with (and required) the fuller path, unlike the others)
                case 'sdk/event/target': obj = require('sdk/event/target'); break; // event/target
                case 'hidden-frame': obj = require('hidden-frame'); break; // frame/hidden-frame
                case 'sdk/frame/utils': obj = require('sdk/frame/utils'); break; // frame/utils
                case 'sdk/io/byte-streams': obj = require('sdk/io/byte-streams'); break; // io/byte-streams
                case 'file': obj = require('file'); break; // io/file
                case 'text-streams': obj = require('text-streams'); break; // io/text-streams
                case 'sdk/loader/cuddlefish': obj = require('sdk/loader/cuddlefish'); break; // loader/cuddlefish
                case 'sdk/loader/sandbox': obj = require('sdk/loader/sandbox'); break; // loader/sandbox
                case 'sdk/net/url': obj = require('sdk/net/url'); break; // net/url // Would be ambiguous with high-level url API anyways
                case 'xhr': obj = require('xhr'); break; // net/xhr
                case 'match-pattern': obj = require('match-pattern'); break; // page-mod/match-pattern
                case 'xpcom': obj = require('xpcom'); break; // platform/xpcom
                case 'sdk/preferences/service': obj = require('sdk/preferences/service'); break; // preferences/service
                case 'environment': obj = require('environment'); break; // system/environment
                case 'runtime': obj = require('runtime'); break; // system/runtime
                case 'unload': obj = require('unload'); break; // system/unload
                case 'xul-app': obj = require('xul-app'); break; // system/xul-app
                case 'test/assert': obj = require('test/assert'); break;
                case 'harness': obj = require('harness'); break; // test/harness
                case 'sdk/test/httpd': obj = require('sdk/test/httpd'); break;
                case 'sdk/test/runner': obj = require('sdk/test/runner'); break; // test/runner
                case 'collection': obj = require('collection'); break; // util/collection
                case 'deprecate': obj = require('deprecate'); break; // util/deprecate
                case 'list': obj = require('list'); break; // util/list
                case 'sdk/util/uuid': obj = require('sdk/util/uuid'); break; // util/uuid
                case 'window/utils': obj = require('window/utils'); break; // utils won't work (also would be ambiguous with frame/utils)
                default: // May be possible to get here if allowed in permissions.
                    nsSS = aywPrivManager.namespacedSimpleStorage;
                    if (privType.match(nsSS)) {
                        obj = require('simple-storage');
                        if (!obj.storage.namespaces) {
                            obj.storage.namespaces = {};
                        }
                        namespace = privType.replace(nsSS, '');
                        if (!obj.storage.namespaces[namespace]) {
                            obj.storage.namespaces[namespace] = {};
                        }
                        obj = obj.storage.namespaces[namespace];
                        break;
                    }
                    throw 'Dynamic module loading is not yet supported (for ' + privType + ').';
            }
            return obj;
        },
        /**
        * @constant
        * @param {String} msg A message to log to console
        */
        log = function log (msg) {
            console.log('AsYouWish: ' + msg);
        },
        /**
        * Search whether an item is present in a JSON-stringified array
        * @constant
        * @param {String} obj String to be parsed into JSON array for check
        * @param {*} item The item to search
        * @returns {Boolean} Whether or not item is present in parsed array
        */
        inJSONArray = function (obj, item) {
            return JSON.parse(obj).indexOf(item) > -1;
        },
        /**
        * Provide the main browser window for a given window
        * @param {nsIDOMWindow} win The window object where the content-document-global-created occurred
        * @returns {nsIDOMWindow} The main browser window for the supplied window
        */
        getMainWindowFromChildWindow = function (win) {
            return win.QueryInterface(Ci.nsIInterfaceRequestor)
               .getInterface(Ci.nsIWebNavigation)
               .QueryInterface(Ci.nsIDocShellTreeItem)
               .rootTreeItem
               .QueryInterface(Ci.nsIInterfaceRequestor)
               .getInterface(Ci.nsIDOMWindow);
        },
        recursiveConditionalSet = function (jsonItem, value, avoidFlip) {
            var p, changed = false;
            for (p in value) {
                if (jsonItem[p] !== value[p]) {
                    if (value[p] && typeof value[p] === 'object') {
                        changed = changed || recursiveConditionalSet(jsonItem[p], value[p]);
                    }
                    else {
                        jsonItem = value;
                        changed = true;
                    }
                }
            }
            if (!avoidFlip) {
                changed = changed || recursiveConditionalSet(value, jsonItem, true);
            }
            return changed;
        },
        /**
        * Search for an item within (or not within) a stringified-array preference for conditional insertion or deletion,
        * resets the array back to a JSON string on the preference, and executes a callback if condition met
        * @param {String} property Preference property of this add-on to be checked and reset
        * @param {*} item Item to seek
        * @param {Boolean} remove Whether to check for presence (or absence), and if so, to remove (or insert), respectively (unless a non-array object, in which case the presence of a defined value will determine whether to add a value or not (since changes could have been made on the object even if present))
        * @param {*} [value] Value to add (for JSON object); required if the item is to be added on a non-array object
        * @param {Function} [cb] Callback if the supplied item was found (if remove is true) or not found (if remove is false so seeking to insert)
        */
        searchAndSetPrefs = function (property, item, remove, value, cb) {
            var pos, val, undef, p, json = JSON.parse(prefs[property]);
            if (!cb) {
                cb = value;
                value = undef;
            }
            if (Array.isArray(json)) {
                pos = json.indexOf(item);
                if (remove ? pos > -1 : pos === -1) {
                    if (remove) {
                        json.splice(pos, 1);
                    }
                    else {
                        json.push(item);
                    }
                    prefs[property] = JSON.stringify(json);
                    if (cb) {
                        cb();
                    }
                }
            }
            else if (json && typeof json === 'object') {
                val = json[item];
                if (remove ? val : !val) {
                    if (remove) {
                        delete json[item];
                    }
                    if (typeof value !== 'undefined') {
                        // If any difference is found between the objects, then add the differing value and, at the end, execute the callback
                        if (recursiveConditionalSet(json[item], value) && cb) {
                            prefs[property] = JSON.stringify(json);
                            cb();
                        }
                    }
                    else if (cb) {
                        cb();
                    }
                }
            }
        },
        /**
        * Gets the URL of the currently active tab on the currently active window
        * @returns {String} The URL of the currently active tab
        */
        getActiveSite = function () {
            return windows.browserWindows.activeWindow.tabs.activeTab.url;
        },
        /**
        * Checks whether privilege requets are even allowed (will still need to be approved by user).
        * We will allow privilege requests if allow all websites option is enabled AND:
        * 1) user is allowing all protocols
        * 2) the scheme is approved
        * If not enabled, privilege requests will only be allowed if the site is on the user's whitelist
        * @param {String} site The site to check
        * @returns {Boolean} Whether or not the site can make privilege requests of the user
        */
        siteAllowed = function siteAllowed (site) {
            var scheme = new URL(site).scheme;
            return (
                    (prefs.allowAllProtocols || inJSONArray(prefs.allowedProtocols, scheme)) &&
                    prefs.allowAllWebsites
                ) ||
                inJSONArray(prefs.allowedWebsites, site);
        },
        /**
        * Get request if it exists (some may expire, e.g., if page is removed)
        * @param {Number} currentRequestIndex Index of the current request
        * @returns {Object} The request object with properties safeWindow, cb, and errBack
        */
        getRequest = function (currentRequestIndex) {
            return requests[currentRequestIndex];
        },
        /**
        * Check if request still exists (some may expire, e.g., if page is removed)
        * @param {Number} currentRequestIndex Index of the current request
        * @returns {Boolean} Whether or not the request still exists
        */
        requestExists = function (currentRequestIndex) {
            return !!getRequest(currentRequestIndex);
        },
        /**
        * Execute a callback for each request
        * @param {Function} cb For each request, execute a callback with arguments: requests, request, item
        */
        forEachRequest = function (cb) {
            var item, request;
            for (item in requests) {
                if (requests.hasOwnProperty(item)) {
                    request = requests[item];
                    if (request) {
                        cb(requests, request, item);
                    }
                }
            }
        },
        /**
        * Check all requests for no longer allowed items and remove
        */
        removeDisallowedRequests = function () {
            forEachRequest(function (requests, request, item) {
                if (request && !siteAllowed(request.site)) {
                    delete requests[item]; // Ensure potentially page-DOM-connected objects are all destroyed for this page
                }
            });
        },
        /**
        * Deletes all requests based on a supplied value being found on a supplied request property
        * @param {String} prop The request property to check
        * @param {*} value A value to check as being within a request property
        */
        removeRequestsByProperty = function (prop, value) {
            forEachRequest(function (requests, request, item) {
                if (request && request[prop] === value) {
                    delete requests[item]; // Ensure potentially page-DOM-connected objects are all destroyed for this page
                }
            });
        },
        /**
        * Disable requests made from a given site
        * @param {String} site Site whose requests are to be removed
        */
        removeRequestsForSite = function (site) {
            removeRequestsByProperty('site', site);
        },
        /**
        * Removes a query string from a URL
        * @todo: any need to pass through new URL(site) to get scheme/userPass/host/port/path ?
        * @param {String} url The URL whose query string is to be removed
        * @returns {String} The URL with query string removed
        */
        removeQueryStringAndAnchor = function (url) {
            return url.replace(/[\?#][\s\S]*$/, '');
        },
        /**
        * Remove an active "addon" website worker by URL
        * @param {String} website The "addon" website to be removed
        */
        removeWorker = function (website) {
            if (workers[website]) {
                workers[website].destroy();
            }
        },
        /**
        * Remove all active "addon" website workers (NOT IN USE)
        */
        removeWorkers = function () {
            var workerURL;
            for (workerURL in workers) {
                if (workers.hasOwnProperty(workerURL)) {
                    removeWorker(workerURL);
                }
            }
        },
        /**
        * Activate an "addon" worker
        * @param {website} Website for which an "addon" worker will be added
        */
        addWorker = function (website) {
            workers[website] = pageWorker.Page({
                contentURL: website
            });
        },
        /**
        * Activate all "addon" workers from preferences
        */
        addWorkers = function () {
            var addonURL, aws = JSON.parse(prefs.addonWebsites);
            for (addonURL in aws) {
                if (aws.hasOwnProperty(addonURL)) {
                    addWorker(addonURL);
                }
            }
        },
        /**
        * Updates options dialog based on current status of preferences
        * Used for preference change detection or manual triggering of changes
        * @param {String} pref The preference on which to detect/trigger changes
        */
        setByPref = function (pref) {
            var allowedWebsitesApproved;
            switch(pref) {
                case 'allowAllProtocols':
                    optionsPanel.port.emit('setAllowAllProtocols', prefs[pref]);
                    if (prefs[pref]) { // Make sure that any time allowAllProtocols is true, so shall be allowAllWebsites
                        prefs.allowAllWebsites = true;
                    }
                    break;
                case 'allowedProtocols':
                    optionsPanel.port.emit('setAllowedProtocols', JSON.parse(prefs[pref]));
                    break;
                case 'allowAllWebsites':
                    optionsPanel.port.emit('setAllowAllWebsites', prefs[pref]);
                    if (!prefs[pref]) { // Make sure that any time  allowAllWebsites is false, so shall be allowAllProtocols
                        prefs.allowAllProtocols = false;
                    }
                    break;
                case 'allowedWebsites':
                    optionsPanel.port.emit('setAllowedWebsites', JSON.parse(prefs[pref]));
                    break;
                case 'allowedWebsitesApproved':
                    allowedWebsitesApproved = JSON.parse(prefs[pref]);
                    optionsPanel.port.emit('setWebsitesApproved', allowedWebsitesApproved, allowedWebsitesApproved.map(function (website) {
                        return aywPrivManager.getSitePrivsAsJSONArray(website);
                    }));
                    break;
                case 'addonWebsites':
                    addWorkers();
                    optionsPanel.port.emit('setAddonWebsites', JSON.parse(prefs[pref]));
                    break;
                default:
                    throw 'Unknown pref supplied to setByPref ' + pref;
            }
        },
        /**
        * Remove privileges for the given site and any of its current requests; does not change status of whether site may make future requests
        * @param {String} site The site whose privileges and requests should be removed
        */
        removePrivs = function (site) {
            aywPrivManager.resetSitePrivs(site);
            setByPref('allowedWebsitesApproved');
            removeRequestsForSite(site);
        },
        isObject = function (obj) {
            return obj && typeof obj === 'object';
        },
        setIfNotObject = function (targetObj, sourceObj, key) {
            if (!isObject(sourceObj[key])) {
                targetObj[key] = sourceObj[key];
            }
        },
        /**
        * Registers an "addon" website, adding it to preferences and launching it in hidden window immediately and on browser restarts
        * @param {String} website The website to be launched immediately and on browser restarts as an "addon"
        * @param {Object} [config] Additional meta-data
        */
        registerAddon = function (website, config) {
            // ONLY COPY OVER VALID VALUES
            var developer, prefObj = {};
            config = config || {};
            developer = config.developer;
            ['name', 'description', 'version', 'license'].forEach(function (key) {
                setIfNotObject(prefObj, config, key);
            });
            if (isObject(developer)) {
                prefObj.developer = {};
                setIfNotObject(prefObj.developer, developer, 'name');
                setIfNotObject(prefObj.developer, developer, 'url');
            }
            // SET PREFERENCES
            searchAndSetPrefs('addonWebsites', website, false, prefObj, function () {
                addWorker(website);
            });
        },
        /**
        * Unregisters an "addon" website, removing it from preferences and disabling it immediately and for browser restarts
        * @param {String} websiteToRemove The website to be removed as an "addon" immediately and on browser restarts
        */
        unregisterAddon = function (websiteToRemove) {
            searchAndSetPrefs('addonWebsites', websiteToRemove, true, function () {
                removeWorker(websiteToRemove);
            });
        },
        /**
        * @param {Boolean} setPrefs Whether or not to attempt to set privilege preferences (not needed when first checking access)
        * @param {Number} currentRequestIndex The particular request index (we don't pass the request, as may be valid by now)
        * @param {String} site The site seeking privileges
        * @returns {Function} The every() filter to run as long as meaningful to find other privileges
        */
        privRetriever = function privRetriever (setPrefs, currentRequestIndex) {
            /**
            * @param {String} requestedPriv Privilege being requested
            * @returns {Boolean} Whether or not to continue execution of finding other privileges
            */
            return function (requestedPriv) {
                var requiredObjWithPrivs, site, errBack, approvedObjects, unapprovedPrivs, approvedPrivs,
                    request = getRequest(currentRequestIndex);
                if (!request) {
                    return false;
                }
                site = request.site;
                errBack = request.errBack;
                approvedObjects = request.approvedObjects;
                unapprovedPrivs = request.unapprovedPrivs;
                approvedPrivs = request.approvedPrivs;

                if (!aywPrivManager.privIsSupported(requestedPriv)) {
                    errBack('bad-privilege', requestedPriv);
                    return false;
                }
                if (!aywPrivManager.sitePrivExists(site, requestedPriv)) {
                    if (setPrefs) { // User has approved, so we first set the preferences
                        // Note: After setting site prefs, we could cache
                        // permissions now that approved, but if user again disabled,
                        // the permissions would still be in effect.
                        if (!aywPrivManager.setSitePrivs(site, requestedPriv) || // If a problem setting privileges for the site
                            !aywPrivManager.sitePrivExists(site, requestedPriv) // Double-check to make sure now set
                        ) {
                            throw 'Problem setting site privs';
                        }
                        setByPref('allowedWebsitesApproved');
                    }
                    else {
                        request.accepted = false;
                        return unapprovedPrivs.push(requestedPriv);
                    }
                }
                requiredObjWithPrivs = getPrivilegedObject(requestedPriv);
                if (!requiredObjWithPrivs) {
                    errBack('failed-retrieval', requestedPriv);
                    return false; // As above, should we be silently failing?
                }
                request.accepted = true;
                if (approvedPrivs.indexOf(requestedPriv) === -1) { // Condition probably not necessary
                    approvedPrivs.push(requestedPriv);
                }
                if (approvedObjects.indexOf(requiredObjWithPrivs) === -1) { // Condition probably not necessary
                    return approvedObjects.push(requiredObjWithPrivs);
                }
                return true;
            };
        },
        /**
        * @param {Boolean} setPrefs Whether or not to attempt to set privilege preferences (not needed (nor secure!) when first checking access)
        * @param {Number} currentRequestIndex
        * @param {Function} [successCb] Callback to call upon successful provision of all requested privileges
        * @param {Function} [failureCb] Callback to call upon unsuccessful provision of requested privileges
        */
        requestPrivsExport = function requestPrivsExport (setPrefs, currentRequestIndex, successCb, failureCb) {
            // Make async-friendly as also can support async dependency checking, or
            // does trouble to user make it better to use sync and let them check object
            // for confirmation it is ready?
            var approvedObjects, approvedPrivs, unapprovedPrivs, requestedPrivs, request = getRequest(currentRequestIndex);
            if (!request) { // e.g., original requesting page now closed
                if (successCb) {
                    successCb(); // Ensure dialog closes
                }
                return undefined;
            }
            approvedObjects = request.approvedObjects;
            approvedPrivs = request.approvedPrivs;
            unapprovedPrivs = request.unapprovedPrivs;
            requestedPrivs = request.requestedPrivs;

            if (unapprovedPrivs.length) {
                requestedPrivs = unapprovedPrivs.splice(0); // We only need to check these now
            }
            if (!requestedPrivs.every(privRetriever(setPrefs, currentRequestIndex))) { // Bad privilege or not returning anything despite prior approval
                return undefined;
            }

            // TODO: Choose whether to use potentially async callback or just return for sync
            if (!unapprovedPrivs.length && approvedPrivs.length) { // All found (and approved have not been deleted), so call/return with array of objects
                // Add this site to list of approved websites in options dialog
                searchAndSetPrefs('allowedWebsitesApproved', request.site, false);
                if (successCb) { // (remove notices)
                    successCb();
                }
                request.cb.apply(null, approvedObjects);
                return approvedObjects; // If not already approved, this line will currently be meaningless with sync API as notification requires asynchronous callback
            }
            if (failureCb) { // Notices
                return failureCb(approvedPrivs, unapprovedPrivs);
            }
            return undefined;
            // We could throw error here to let user catch (for synchronous) and drop errBack or
            // do nothing and wait (for async).
            // throw 'Privilege not granted';
        },

        // Two methods potentially called by notify()
        /**
        * Report future events for this request as refused (though new requests can open new dialog with new events) and close dialog
        * @param {Number} currentRequestIndex The particular request index (we don't pass the request, as may be valid by now
        * @param {Function} noticeRemover The callback to remove the notifications object
        */
        notifyRefuseCallback = function notifyRefuseCallback (currentRequestIndex, noticeRemover) {
            var errBack, approvedPrivs, unapprovedPrivs,
                request = getRequest(currentRequestIndex);
            if (request) {
                request.refused = true; // Report refused event
            }

            noticeRemover();
            if (request) {
                errBack = request.errBack;
                approvedPrivs = request.approvedPrivs;
                unapprovedPrivs = request.unapprovedPrivs;
                errBack('refused', unapprovedPrivs.slice(0), approvedPrivs.slice(0)); // Be sure to make copies here so user can't alter!
                /* Expose to callback?
                request.safeWindow.alert('For this site, you have refused privileges: ' + unapprovedPrivs.join() + ' (and previously approved privileges: ' + approvedPrivs.join() + ')');
                request.safeWindow.alert('For this site, you have refused privileges: ' +
                    unapprovedPrivs.reduce(function (prev, priv) {
                        prev + aywPrivManager.getPrivMessage(priv);
                    }, '') +
                    ' (and previously approved privileges: ' +
                    approvedPrivs.reduce(function (prev, priv) {
                        prev + aywPrivManager.getPrivMessage(priv);
                    }, '') +
                    ')'
                );
                */
            }
        },
        /**
        * @param {Number} currentRequestIndex The particular request index (we don't pass the request, as may be valid by now
        * @param {'dismissed'|'removed'|'shown'} state Currently reporting state from notification dialog
        * @param {Function} noticeRemover The callback to remove the notifications object
        */
        notifyEventCallback = function notifyEventCallback (currentRequestIndex, state, noticeRemover) { // dismissed|removed|shown
            var errBack,
                request = getRequest(currentRequestIndex);
            if (!request || request.accepted) { // Might be removed status here because we are manually removing notification
                noticeRemover(); // Ensure notification is closed since either now invalid or in process of checking
                return;
            }
            errBack = request.errBack;

            if (request.refused) {
                request.refused = false;
                return;
            }
            request.refused = null;
            switch (state) {
                case 'dismissed':
                    errBack('dismissed');
                    break;
                case 'removed':
                    errBack('removed'); // Occurs when dialog closed as 'Not now' or with 'x', but not with our option 'Refuse permission'; also
                                                // occurring when user clicks away or switches tabs, though that should be 'dismissed'
                    break;
                case 'shown':
                    // errBack('shown');
                    break;
                default:
                    throw 'Unrecognized state in requestPrivs() notification callback';
            }
        },
        /**
        * @param {Number} currentRequestIndex The particular request index (we don't pass the request, as may be valid by now
        * @param {nsIDOMWindow} mainWindow The main browser window of the window requesting privileges
        */
        notify = function $notify (currentRequestIndex, mainWindow) {
            var unapprovedPrivs,
                privMsg, noticeObj, noticeRemover, notification,
                gBrowser = mainWindow.gBrowser,
                request = getRequest(currentRequestIndex);
            if (!request) {
                return false;
            }

            if (!gBrowser) { // If asking for privileges from within a hidden DOM window, we can't use the activating window
                mainWindow = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator).getMostRecentWindow('navigator:browser');
                gBrowser = mainWindow.gBrowser;
            }

            unapprovedPrivs = request.unapprovedPrivs;
            // Other PopupNotifications methods/properties:
            /*
                anchorElement
                remove(notificationObject),
                getNotification(id, browserElement),
                locationChange()
            */
            privMsg = unapprovedPrivs.reduce(function (prev, priv) {
                    return _('privilege_messages', prev, aywPrivManager.getPrivMessage(priv)); // This is text, not HTML so can't use line breaks
                }, '');

            noticeObj = new PopupNotifications(
                gBrowser,
                mainWindow.document.getElementById('notification-popup'),
                mainWindow.document.getElementById('notification-popup-box')
            );
            noticeRemover = function () {
                noticeObj.remove(notification);
            };
            try {
                notification = noticeObj.show(
                    gBrowser.selectedBrowser /*.selectedBrowser*/,
                    'requestPrivs',
                    _("dangerous_request", privMsg),
                    null, // Anchor ID // element contained inside the PopupNotification object's icon box;
                                       // PopupNotification object's icon box by default;
                                       // global PopupNotifications object uses the notification-popup-box
                    {
                        label: _("refuse_permission"),
                        accessKey: _("accessKey_refuse_permission"),
                        callback: function () {
                            notifyRefuseCallback(currentRequestIndex, noticeRemover);
                        }
                    },
                    [
                        {
                            label: _("fully_trust", privMsg),
                            accessKey: _("accessKey_trust_website"),
                            callback: function () {
                                requestPrivsExport(true, currentRequestIndex, noticeRemover);
                            }
                        }
                        /*,
                        {
                            label: _("Second secondary option"),
                            accessKey: _("2"),
                            callback: function() { // If add, delegate to an equivalent notify* method
                                var request = getRequest(currentRequestIndex);
                                if (request) {
                                    request.safeWindow.alert(_("Second secondary option selected."));
                                    request.accepted = true;
                                }
                                noticeRemover();
                            }
                        }*/
                    ],
                    {
                        // persistence: int pageLoadsBeforeDismissed,
                        // timeout: millisecondsSinceEpochBeforeDismissed,
                        // persistWhileVisible: booleanToStayVisibleAfterLeaveLocation
                        // dismissed: booleanActivatedByAnchorClick
                        eventCallback: function (state) {
                            notifyEventCallback(currentRequestIndex, state, noticeRemover);
                        },
                        // neverShow: booleanToRemoveWhenOnlyDismissed
                        removeOnDismissal: true
                        // popupIconURL: Alternative to .popup-notification-icon[popupid='...'] {list-style-image: url('chrome://asyouwish/skin/myLogo.png')}
                    }
                );
            }
            catch (e) {
                console.log('Problem adding notification dialog (two simultaneous requests?): ' + e);
                require('timers').setTimeout(function () { // Try again
                    notify(currentRequestIndex, mainWindow);
                }, 3000);
            }
        };

    simplePrefs.on('', setByPref);
    optionsPanel.on('show', function () {
        optionsPanel.port.emit('addedCurrentProtocol', '');
        optionsPanel.port.emit('addedCurrentWebsite', '');
        optionsPanel.port.emit('addedLocalWebsite', '');
    });

    // PROTOCOL-RELATED

    // Setup
    setByPref('allowAllProtocols');
    setByPref('allowedProtocols');

    // Listeners to execute privileged APIs
    optionsPanel.port.on('addCurrentProtocol', function () {
        optionsPanel.port.emit('addedCurrentProtocol', new URL(getActiveSite()).scheme);
    });
    optionsPanel.port.on('addAllowedProtocol', function (protocol) {
        // ALPHA *( ALPHA / DIGIT / "+" / "-" / "." ) from http://tools.ietf.org/html/rfc3986#appendix-A
        if (protocol.match(/^[a-z][a-z\d+.\-]*$/i)) { // underscore not permitted
            searchAndSetPrefs('allowedProtocols', protocol, false);
        }
    });
    optionsPanel.port.on('removeAllowedProtocols', function (protocolsToRemove) {
        protocolsToRemove.forEach(function (protocolToRemove) {
            searchAndSetPrefs('allowedProtocols', protocolToRemove, true, function () {
                // Remove from currently opened windows (whether user approved yet or not)
                removeDisallowedRequests(); // We could execute just once but we want to check before notifying user
            });
        });
    });
    optionsPanel.port.on('allowAllProtocols', function (newSetting) {
        prefs.allowAllProtocols = newSetting;
    });

    // WEBSITE (WHITELIST)-RELATED
    // Setup
    setByPref('allowAllWebsites');
    setByPref('allowedWebsites');
    setByPref('allowedWebsitesApproved');

    // Listeners to execute privileged APIs
    optionsPanel.port.on('addCurrentWebsite', function () {
        optionsPanel.port.emit('addedCurrentWebsite', removeQueryStringAndAnchor(getActiveSite()));
    });
    optionsPanel.port.on('addLocalWebsite', function () {
        var nsIFilePicker = Ci.nsIFilePicker,
            fp = Cc['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);
        fp.init(getMostRecentBrowserWindow(), _("select_web_app"), nsIFilePicker.modeOpen);
        fp.appendFilters(nsIFilePicker.filterHTML);
        if (fp.show() === nsIFilePicker.returnOK) {
            optionsPanel.show();
            optionsPanel.port.emit('addedLocalWebsite', (Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService).newFileURI(fp.file)).spec);
        }
    });

    optionsPanel.port.on('addAllowedWebsite', function (website) {
        website = removeQueryStringAndAnchor(website);
        try {
            aywPrivManager.sitePrefsManager.newURI(website); // Ensure first it is a valid website but not throwing errors here
            searchAndSetPrefs('allowedWebsites', website, false);
        }
        catch (e) {
            // Fail silently
        }
    });
    optionsPanel.port.on('removeAllowedWebsites', function (websitesToRemove) {
        websitesToRemove.forEach(function (websiteToRemove) {
            searchAndSetPrefs('allowedWebsites', websiteToRemove, true, function () {
                removePrivs(websiteToRemove); // Disallow already allowed and approved requests and remove privileges for this site
            });
            // We also remove from approved websites in case already there also
            searchAndSetPrefs('allowedWebsitesApproved', websiteToRemove, true);

            // We also remove from "addon" websites in case already there also
            unregisterAddon(websiteToRemove);
        });
    });
    optionsPanel.port.on('allowAllWebsites', function (newSetting) {
        prefs.allowAllWebsites = newSetting;
    });

    optionsPanel.port.on('removeApprovedWebsites', function (websitesToRemove) {
        websitesToRemove.forEach(function (websiteToRemove) {
            searchAndSetPrefs('allowedWebsitesApproved', websiteToRemove, true, function () {
                removePrivs(websiteToRemove); // Disallow already allowed and approved requests and remove privileges for this site
            });
        });
    });
    
    optionsPanel.port.on('addAddonWebsite', function (website) {
        website = removeQueryStringAndAnchor(website);
        try {
            aywPrivManager.sitePrefsManager.newURI(website); // Ensure first it is a valid website but not throwing errors here
            registerAddon(website);
        }
        catch (e) {
            // Fail silently
        }
    });

    optionsPanel.port.on('removeAddonWebsites', function (websitesToRemove) {
        websitesToRemove.forEach(function (websiteToRemove) {
            unregisterAddon(websiteToRemove);
        });
    });

    /**
    * Only need as a singleton service; must call register() and be able to call unregister().
    */
    requestPrivs_Inject = new ContentDocumentGlobalCreatedObserverBuilder({
        /**
        * Executes when content-document-global-created event observed; used to set up global requestPrivs()
        * @param {nsIDOMWindow} subject The window object where the content-document-global-created occurred
        * @param {'content-document-global-created'} topic (Not used)
        * @param {null?} data (Not used)
        */
        observed: function observed (subject) { // subject is nsIDOMWindow
            var scheme, unsafeWindow, mainWindow, AsYouWish,
                safeWindow = subject.wrappedJSObject, // Works but not allowing chrome calls
                site = removeQueryStringAndAnchor(safeWindow.location.href); // Make for domain? Too insecure.

            /*if (!siteAllowed(site)) { // We'll try allowing "denied" errBack for now
                return;
            }*/

            scheme = new URL(site).scheme;
            unsafeWindow = XPCNativeWrapper.unwrap(subject); // Redundant?
            mainWindow = getMainWindowFromChildWindow(subject);
            AsYouWish = { // __exposedProps__ only appears it can work with global object as opposed to global function, etc.
                requestPrivs: function (requestedPrivs, callback, errCallback) {
                    try {
                        var errBack, wrapErrorFunc, cb;

                        errCallback = errCallback ||
                            /**
                            * @param {'bad-privilege'|'failed-retrieval'|'refused'|'denied'|'dismissed'|'removed'} error The error reported (currently 'shown' is not reported);
                                                                                                                                                                                    'denied': since been completely denied access (run at startup?)
                            * @param {String|Array} [arg1] Extra information; with 'bad-privilege' or 'failed-retrieval', this argument will indicate the privilege name which failed;
                            *                                            for 'refused', will indicate the refused privileges; for 'denied' will indicate whether denied upon 'initial' or 'callback' execution
                            * @param {Array} [arg2] Extra information; with 'refused', it will be the already approved privileges
                            */
                            function (error, arg1, arg2) {
                                var request = getRequest(currentRequestIndex);
                                if (request && error === 'refused') {
                                    request.safeWindow.alert('Refused');
                                }
                                /*else if (requestExists(currentRequestIndex)) { // Remove
                                    getRequest(currentRequestIndex).safeWindow.alert(error);
                                }*/
                            };
                        /**
                        * @param {Object} requiredObjWithPrivs The returned required object
                        */
                        cb = function () {
                            if (!siteAllowed(site) || // Setting changes may have since disallowed requests, so we need to check!
                                !callback) { // We'll allow synchronous for now, though call throws error if privileges not already granted
                                errBack('denied', 'callback');
                                return;
                            }

                            // To avoid subsequent notifications not appearing upon immediate chaining of privilege requests
                            var args = [].slice.call(arguments);
                            safeWindow.setTimeout(function () {
                                callback.apply(null, new Spapi().wrap(args));
                            }, 0);
                            // We were calling on "this", so can execute removePrivs() on "this" within callback; should be safe since __exposedProps__ defined on this object
                            // issues? safeWindow.setTimeout.apply(this, [callback, 0].concat([].slice.call(arguments)));
                        };
                        wrapErrorFunc = function (callb) {
                            return function () {
                                try {
                                    callb.apply(null, new Spapi().wrap(arguments));
                                }
                                catch (e) {
                                    throw new Spapi().wrap(e); // Ensure we don't get __exposedProps__ warnings for error objects too
                                }
                            };
                        };
                        errBack = wrapErrorFunc(errCallback);

                        if (!siteAllowed(site)) {
                            errBack('denied', 'initial');
                            // Todo: Should we allow return of errBack result to allow synchronous behavior with
                            //              errors? (though still can't return for errBacks called after async notifications)
                            return;
                        }
                        //  safeWindow might not really be needed, though cb and errBack should be request-specific.
                        currentRequestIndex++;
                        /**
                        * @property {Array} approvedObjects An array of the requested objects to be populated with those objects that have already been approved by the user
                        * @property {Array} approvedPrivs An array containing any already requested privileges (as strings) that have already been approved by the user
                        * @property {Array} unapprovedPrivs An array of privileges (as strings) to be populated with the privileges that have not yet been approved by the user
                        */
                        requests[currentRequestIndex] = {
                            site: site,
                            safeWindow:safeWindow,
                            cb:cb,
                            errBack: errBack,
                            approvedObjects: [],
                            approvedPrivs: [],
                            unapprovedPrivs: [],
                            requestedPrivs: (typeof requestedPrivs === 'string' ? [requestedPrivs] : requestedPrivs).slice(0) // Ensure we don't overwrite user's own array
                        };
                        return new Spapi().wrap(requestPrivsExport(false, currentRequestIndex, null, function () {
                            notify(currentRequestIndex, mainWindow);
                        }));
                    }
                    catch (e) {
                        throw new Spapi().wrap(e); // Ensure we don't get __exposedProps__ warnings for error objects too
                    }
                },
                /**
                * Remove privileges for the requesting site and any current
                *   requests; does not change status of whether site may
                *   make future requests
                */
                removePrivs: function () {
                    removePrivs(site);
                },
                /**
                * This API is provided solely for convenience in debugging and
                * may be removed in the future (even while it may serve as
                * feature detection).
                * @returns {Object} Object whose keys are all available
                *                                privileges, and values are the
                *                                text warnings that will be
                *                                shown to the user
                */
                getDefaultPrivs: function () {
                    return aywPrivManager.defaultPrivs;
                },
                /**
                * Registers the current website to be run now as an "addon" website and on start-up
                */
                register: function (config) {
                    registerAddon(site, config);
                },
                /**
                * Unregisters the current website from running now as an "addon" website and on start-up
                */
                unregister: function () {
                    unregisterAddon(site);
                },
                /**
                * Checks whether or not the current website is registered as an "addon" website
                * @returns {Boolean} Whether or not the current website is registered as an "addon" website
                */
                isRegistered: function () {
                    return !!workers[site];
                },
                __exposedProps__: {
                    requestPrivs: 'r',
                    removePrivs: 'r',
                    getDefaultPrivs: 'r',
                    register: 'r',
                    unregister: 'r',
                    isRegistered: 'r'
                }
            };

            // subject.wrappedJSObject = AsYouWish; // Doesn't work despite docs at https://developer.mozilla.org/en-US/docs/XPConnect_wrappers#__exposedProps__
            unsafeWindow.AsYouWish = AsYouWish; // Works
            unsafeWindow.addEventListener('unload', function () {
                if (unsafeWindow) {
                    delete unsafeWindow.AsYouWish; // Try to avoid some category of dead DOM objects (?)
                }
                // removeRequestsForSite(site); // Cannot use this since other tabs may have made requests
                removeRequestsByProperty('safeWindow', safeWindow); // Only remove for the window (as opposed to, e.g., all windows using the site)
                safeWindow = unsafeWindow = mainWindow = null; // Probably not necessary if requests (and AsYouWish) deleted as contained all references
            });
        }
    });
    requestPrivs_Inject.register(); // Change to auto-register?

    setByPref('addonWebsites');
};

/**
* Unregister requestPrivs listener upon unload of extension
*/
exports.onUnload = function () { // reason
    'use strict';
    if (requestPrivs_Inject) {
        requestPrivs_Inject.unregister();
        requests = {};
    }
};

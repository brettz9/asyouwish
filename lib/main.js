/*globals exports, require, Cc, Ci, Cu, XPCNativeWrapper */
var chrome = require('chrome'),
    Cc = chrome.Cc, 
    Ci = chrome.Ci, 
    Cu = chrome.Cu;

/*
Known issues:
1) Two simultaneous requests (whether from same site or not) causes 'this.panel.firstChild is null' error with our notify() method
2) Privileges don't load on initial browser load as apparently not injected

Ongoing or Lower priority todos:
1) Add allow messages and requires for other require modules (at least 
    built-in, but also nsIProcess, shared IndexedDB, etc.?)
    a) getPrivilegedObject() here in main.js and defaultPrivs() in aywPrivManager.js
2) If can allow dynamic loads, make as separate module per https://addons.mozilla.org/en-US/developers/docs/sdk/1.10/dev-guide/tutorials/reusable-modules.html
   (operate on aywPrivManager's setGenericPrivs and getGenericPrivs methods; also change init() and add setGenericPriv()).
3) Utilize more of the built-in SDK APIs whenever possible.
    a) Use simple prefs to ensure defaultPrivs are reset by new addon update instead of existing scheme
    b) Ensure long-term storage for specifically approved settings/sites (i.e., not simple prefs); but then won't be auto-added to prefs
4) Allow blacklists
5) Further localize HTML (any way to localize add-on name and description? Any way to get current locale to know which options.html file to use?)

For consultation:
1) Any security issues? Safety of wrappings, require() object wrapping?
2) Settle on sync or async? If do sync, should we allow postMessage to notify of approval or allow callback for
      continued execution when not set yet (or just errBack with a new mode)?
3) Expose globals?: unsafeWindow (accessible elsewhere--e.g., is XPCNativeWrapper available thorugh require('chrome')?)
4) Integration with requirejs as plugin or even include make API the same (and handle non-plugin requiring) so additional script not needed?

Todos:
1) Expose loader to allow registration of add-ons? 
    https://addons.mozilla.org/en-US/developers/docs/sdk/latest/packages/api-utils/loader.html 
    (https://addons.mozilla.org/en-US/developers/docs/sdk/latest/packages/api-utils/content/loader.html ?)
    a) would thus be available at start-up, appear in the addons dialog, etc 
    b) alternatively allow invoking of a specific URL at start-up optionally within a hidden DOM window so no visible tabs would need to 
    open (e.g., if you wanted a browser context menu overlay, but still wanted to have it load your live webpage). Add to preferences
    so a preferences 'add-on' could list and edit these or add within normal add-ons dialog.
2) See if can get Browser-in-Browser (BIB) working using simple-storage for allowing creation of shared APIs into which browsers could hook and privileged DOM access
    a) Use https://addons.mozilla.org/en-US/developers/docs/sdk/latest/packages/api-utils/content/proxy.html ?

Rejected ideas:
1) Rejected given danger: Allow site without query string, but everything else within the same folder? Would be less 
secure (e.g., if site included untrusted 3rd party libraries within the folder) and would require change from sitePrefs
2) Expose globals: self (part of content scripts, so page-mod can utilize), addon (removed or deprecated in favor of content-script self?)
*/

var requestPrivs_Inject,
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
        allowedWebsitesApproved,
        currentRequestIndex = 0,
        Spapi = require('./specialpowersAPI').SpecialPowersAPI,
        aywPrivManager = require('./AywPrivManager')(),
        PopupNotifications = require('./PopupNotifications').PopupNotifications,
        ContentDocumentGlobalCreatedObserverBuilder = require('./WindowObserverBuilder').ContentDocumentGlobalCreatedObserverBuilder,
        data = require('self').data,
        prefs = require('simple-prefs').prefs,
        URL = require('api-utils/url').URL,        
        windows = require('windows'),
        optionsPanel = require('panel').Panel({
            height: 430,
            width: 900,
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
            var obj, nsSS,
                path = aywPrivManager.getPrivPath(privType) + privType;
            // 1) Due to static linking requirements for add-on reviewers, we have to hard-code the paths inside the
            //   require calls. There is no doubt some way out, but for now, this is easiest solution, and also
            //   ensures we stay within bounds expected. Todo: This will need to be fixed if allowing other extensions
            //   the ability to add privileges. See https://bugzilla.mozilla.org/show_bug.cgi?id=627607
            // 2) In addition to adding here, it is necessary to add to defaultPrivs() in aywPrivManager.js
            switch (path) {
                // Globals
                case 'console': obj = console; break; // Posseses "exception" property not present on normal console

                // Top-level
                case 'addon-page': obj = require('addon-page'); break;
                case 'l10n': obj = require('l10n'); break;
                case 'self': obj = require('self'); break;
                case 'simple-prefs': obj = require('simple-prefs'); break;
                case 'timers': obj = require('timers'); break;

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
                // Todo: Add low-level APIs as appropriate:

                case 'chrome': obj = chrome; break;
                case 'xhr': obj = require('xhr'); break; // net/xhr
                case 'file': obj = require('file'); break; // io/file
                default: // May be possible to get here if allowed in permissions.
                    nsSS = aywPrivManager.namespacedSimpleStorage;
                    if (path.match(nsSS)) {
                        obj = require('simple-storage');
                        if (!obj.namespaces) {
                            obj.namespaces = {};
                        }
                        obj = obj.namespaces[path.replace(nsSS, '')];
                        break;
                    }
                    throw 'Dynamic module loading is not yet supported (for ' + path + ').';
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
        /**
        * Search for an item within (or not within) a stringified-array preference for conditional insertion or deletion, 
        * resets the array back to a JSON string on the preference, and executes a callback if condition met
        * @param {String} property Preference property of this add-on to be checked and reset
        * @param {*} item Item to seek
        * @param {Boolean} remove Whether to check for presence (or absence), and if so, to remove (or insert), respectively
        * @param {Function} cb Callback if the supplied item was found (if remove is true) or not found (if remove is false so seeking to insert)
        */
        searchAndSet = function (property, item, remove, cb) {
            var json = JSON.parse(prefs[property]),
                pos = json.indexOf(item);
            if (remove ? pos > -1 : pos === -1) {
                if (remove) {
                    json.splice(pos, 1);
                }
                else {
                    json.push(item);
                }
                prefs[property] = JSON.stringify(json);
                cb();
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
                searchAndSet('allowedWebsitesApproved', request.site, false, function () {
                    optionsPanel.port.emit('setWebsiteApproved', [request.site, approvedPrivs]);
                });
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
        },
        /**
        * Remove privileges for the given site and any of its current requests; does not change status of whether site may make future requests
        * @param {String} site The site whose privileges and requests should be removed
        */
        removePrivs = function (site) {
            aywPrivManager.resetSitePrivs(site);
            removeRequestsForSite(site);
        };

    // PROTOCOL-RELATED
    
    // Setup
    optionsPanel.port.emit('setAllowAllProtocols', prefs.allowAllProtocols);
    optionsPanel.port.emit('setAllowedProtocols', JSON.parse(prefs.allowedProtocols));
    
    // Listeners to execute privileged APIs
    optionsPanel.port.on('addCurrentProtocol', function () {
        optionsPanel.port.emit('addedCurrentProtocol', new URL(getActiveSite()).scheme);
    });    
    optionsPanel.port.on('addAllowedProtocol', function (protocol) {
        // ALPHA *( ALPHA / DIGIT / "+" / "-" / "." ) from http://tools.ietf.org/html/rfc3986#appendix-A
        if (protocol.match(/^[a-z][a-z\d+.\-]*$/i)) { // underscore not permitted
            searchAndSet('allowedProtocols', protocol, false, function () {
                optionsPanel.port.emit('addedAllowedProtocol', protocol);
            });
        }
    });
    optionsPanel.port.on('removeAllowedProtocols', function (protocolsToRemove) {
        protocolsToRemove.forEach(function (protocolToRemove) {
            searchAndSet('allowedProtocols', protocolToRemove, true, function () {
                // Remove from currently opened windows (whether user approved yet or not)
                removeDisallowedRequests(); // We could execute just once but we want to check before notifying user
                optionsPanel.port.emit('removedAllowedProtocol', protocolToRemove);
            });
        });
    });
    optionsPanel.port.on('allowAllProtocols', function (newSetting) {
        prefs.allowAllProtocols = newSetting;
    });
    
    // WEBSITE (WHITELIST)-RELATED
    // Setup
    optionsPanel.port.emit('setAllowAllWebsites', prefs.allowAllWebsites);
    optionsPanel.port.emit('setAllowedWebsites', JSON.parse(prefs.allowedWebsites));
    allowedWebsitesApproved = JSON.parse(prefs.allowedWebsitesApproved); // Get fresh copy
    optionsPanel.port.emit('setWebsitesApproved', allowedWebsitesApproved, allowedWebsitesApproved.map(function (website) {
        return aywPrivManager.getSitePrivsAsJSONArray(website);
    }));

    // Listeners to execute privileged APIs
    optionsPanel.port.on('addCurrentWebsite', function () {
        optionsPanel.port.emit('addedCurrentWebsite', removeQueryStringAndAnchor(getActiveSite()));
    });
    optionsPanel.port.on('addAllowedWebsite', function (website) {
        website = removeQueryStringAndAnchor(website);
        try {
            aywPrivManager.sitePrefsManager.newURI(website); // Ensure first it is a valid website but not throwing errors here
            searchAndSet('allowedWebsites', website, false, function () {
                optionsPanel.port.emit('addedAllowedWebsite', website);
            });
        }
        catch (e) {
            // Fail silently
        }
    });
    optionsPanel.port.on('removeAllowedWebsites', function (websitesToRemove) {
        websitesToRemove.forEach(function (websiteToRemove) {
            searchAndSet('allowedWebsites', websiteToRemove, true, function () {
                removePrivs(websiteToRemove); // Disallow already allowed and approved requests and remove privileges for this site
                optionsPanel.port.emit('removedAllowedWebsite', websiteToRemove);
            });
            // We also run this in case also already in approved websites too
            searchAndSet('allowedWebsitesApproved', websiteToRemove, true, function () {
                optionsPanel.port.emit('removedWebsiteApproved', websiteToRemove);
            });
        });
    });
    optionsPanel.port.on('allowAllWebsites', function (newSetting) {
        prefs.allowAllWebsites = newSetting;
    });
    
    optionsPanel.port.on('removeApprovedWebsites', function (websitesToRemove) {
        websitesToRemove.forEach(function (websiteToRemove) {
            searchAndSet('allowedWebsitesApproved', websiteToRemove, true, function () {
                removePrivs(websiteToRemove); // Disallow already allowed and approved requests and remove privileges for this site
                optionsPanel.port.emit('removedWebsiteApproved', websiteToRemove);
            });
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
                __exposedProps__: {
                    requestPrivs: 'r',
                    removePrivs: 'r',
                    getDefaultPrivs: 'r'
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

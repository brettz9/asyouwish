/*globals require, module */

// aywPrivManager.js - AsYouWish's module
// author: brettz9

/**
* Only need as a singleton service; must call init().
* @requires sitePrefsManager
* @requires preferences-service
*/
(function () {
'use strict';


var _ = require('l10n').get;

function AywPrivManager () {
    if (!(this instanceof AywPrivManager)) {
        return new AywPrivManager();
    }
    this.init();
}
AywPrivManager.prototype = {
        sitePrefsManager: new (require('./SitePrefsManager'))('extensions.asyouwish.siteprivs'),
        genericPrefService: new (require('./GenericPrefsManager'))('extensions.asyouwish.generic'),
        namespacedSimpleStorage: /^x\-namespaced\-simple\-storage\-/,
        // 1) If ever adding preferences service, indicate it is HIGH RISK because all privs could be altered by it!
        // 2) When adding here, also add HARD-CODED require() statements to getPrivilegedObject() in main.js
        // 3) We might want to move to preferences in packages.json, but apparently requires string serialization currently
        defaultPrivs: [
            // We could allow children as $ plus dirName to avoid ambiguity between aMod.js and aMod/,
            //   but besides requiring more logic, it may actually be easier to copy new paths here, 
            //   even if partly redundant (e.g., 'api-utils/dom/events' for keys.js)
            // GLOBALS
            'console',
            // HIGH-LEVEL APIS
            // BEGIN THOSE OF LITTLE USE (might only be useful to act as alternative to AsYouWish itself)
            'addon-page', // Not of any use to sites as will only open THIS addon's data/index.html
             'l10n', // Not of any use to sites as will only provide access to THIS addon's localization (unless we were to allow common translation strings!)
             'self', // Probably of little use as only gives info on THIS addon, but might be used to detect whether addon was just upgraded, for loading any useful text files we might add  to the addon in the future?, etc. This is not the self global
            'simple-prefs',
            'timers', // Probably of no use since websites already allow timers
            // END THOSE OF LITTLE USE
            'base64',
            'clipboard',
            'context-menu',
            'hotkeys',
            'notifications',
            'page-mod',
            'page-worker',
            'panel',
            'passwords',
            'private-browsing',
            'querystring',
            'request',
            'selection',
            'simple-storage',
            'tabs',
            'url',
            'widget',
            'windows',
            // Todo: Add low-level APIs as appropriate:

            'chrome',
            // Didn't need io/file or net/xhr hierarchy, but we can allow here
            'xhr',
            'file',

            // Custom
            'x-namespaced-simple-storage'
        ].reduce(function (obj, priv) {
            obj[priv] = _("defaultPrivs_" + priv);
            return obj;
        }, {}),
        init: function init () {
            if (!this.genericPrefService.isSet() || this.missingDefaults()) {
                this.setGenericPrivs(this.defaultPrivs); // We really should set them one by one; todo: need to make decision on how to require
            }
        },
        missingDefaults: function missingDefaults () {
            var priv,
                defaultPrivs = this.defaultPrivs;
                // currentPrivs = this.getGenericPrivs();
            for (priv in defaultPrivs) {
                if (defaultPrivs.hasOwnProperty(priv) && !this.privIsSupported(priv)) {
                    return true;
                }
            }
            return false;
        },
        
        // These three methods can be used to override functionality
        setGenericPriv: function setGenericPriv (value) {
            return this.genericPrefService.pushToJSONArrayItem(value);
        },
        setGenericPrivs: function setGenericPrivs (value) {
            return this.genericPrefService.setJSONArray(value);
        },
        getGenericPrivs: function getGenericPrivs () {
            return this.genericPrefService.getJSON();
        },
        getNormalizedPriv: function getNormalizedPriv (priv) {
            return priv.match(this.namespacedSimpleStorage) ? 'x-namespaced-simple-storage' : priv;
        },
        removeAnyNamespace: function removeAnyNamespace (fullPriv) {
            return fullPriv.replace(this.namespacedSimpleStorage, '');
        },
        getPrivMessage: function getPrivMessage (fullPriv) {
            var path, subitems,
                privMessages = this.getGenericPrivs(),
                priv = this.getNormalizedPriv(fullPriv);
            for (path in privMessages) {
                if (privMessages.hasOwnProperty(path)) {
                    if (path === 'x-namespaced-simple-storage') {
                        return _('defaultPrivs_' + path, this.removeAnyNamespace(fullPriv));
                    }
                    subitems = privMessages[path];
                    if (subitems.hasOwnProperty(priv)) {
                        return subitems[priv]; // Could add [0] if change to array to support more meta-data
                    }
                    if (typeof subitems === 'string') {
                        return subitems;
                    }
                }
            }
            return false;
        },
        getPrivPath: function getPrivPath (priv) {
            var path, subitems, privMessages = this.getGenericPrivs();
            priv = this.getNormalizedPriv(priv);
            for (path in privMessages) {
                if (privMessages.hasOwnProperty(path)) {
                    subitems = privMessages[path];
                    if (subitems.hasOwnProperty(priv)) {
                        return path + '/';
                    }
                    if (typeof subitems === 'string') {
                        return '';
                    }
                }
            }
            return false;
        },
        privIsSupported: function privIsSupported (priv) {
            return !!this.getPrivMessage(priv);
        },
        // sitePrefsManager wrapper
        setSitePrivs: function setSitePrivs (site, priv) {
            if (!this.privIsSupported(priv)) {
                return false;
            }
            this.pushToSitePrivsJSONArray(site, priv);
            return true;
        },
        // Light sitePrefsManager wrappers
        sitePrivExists: function sitePrivExists (site, priv) {
            return this.sitePrefsManager.itemExists(priv, site);
        },
        getSitePrivsAsJSONArray: function getSitePrivsAsJSONArray (site) {
            return this.sitePrefsManager.getJSONArray(site);
        },
        pushToSitePrivsJSONArray: function pushToSitePrivsJSONArray (site, priv) {
            return this.sitePrefsManager.pushToJSONArray(priv, site);
        },
        resetSitePrivs: function resetSitePrivs (site) {
            return this.sitePrefsManager.reset(site);
        }
    };

module.exports = AywPrivManager;

}());

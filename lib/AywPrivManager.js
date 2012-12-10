/*globals require, exports */

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
        sitePrefsManager: new require('./SitePrefsManager')('extensions.asyouwish.siteprivs'),
        genericPrefService: new require('./GenericPrefsManager')('extensions.asyouwish.generic'),
        
        // 1) If ever adding preferences service, indicate it is HIGH RISK because all privs could be altered by it!
        // 2) When adding here, also add HARD-CODED require() statements to getPrivilegedObject() in main.js
        // 3) We might want to move to preferences in packages.json, but apparently requires string serialization currently
        defaultPrivs: {
            // We could allow children as $ plus dirName to avoid ambiguity between aMod.js and aMod/,
            //   but besides requiring more logic, it may actually be easier to copy new paths here, 
            //   even if partly redundant (e.g., 'api-utils/dom/events' for keys.js)
            'api-utils': {
                url: _("URL parsing/retrieval"), // replace with user's choice,
                xhr: _("Cross-domain access (add-on can access any site using your credentials---DANGEROUS!!!)"),
                file: _("Local file access (can read, alter, or delete your local files!)")
            },
            'addon-kit': {
                clipboard: _("Read from or set your clipboard; better have no secrets in there!"),
                'simple-storage': _("Store data accessible to other web apps; could be a privacy issue if a site is detecting another privileged site's storage patterns or disregarding private browsing mode when storing its data")
            },
            'chrome': _("SUPER DUPER DANGEROUS: Can control everything related to Firefox!")
        },
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
        
        getPrivMessage: function getPrivMessage (priv) {
            var path, subitems, privMessages = this.getGenericPrivs();
            for (path in privMessages) {
                if (privMessages.hasOwnProperty(path)) {
                    subitems = privMessages[path];
                    if (subitems.hasOwnProperty(priv)) {
                        return subitems[priv]; // Could add [0] if change to array to support more meta-data
                    }
                    else if (typeof subitems === 'string') {
                        return subitems;
                    }
                }
            }
            return false;
        },
        getPrivPath: function getPrivPath (priv) {
            var path, subitems, privMessages = this.getGenericPrivs();
            for (path in privMessages) {
                if (privMessages.hasOwnProperty(path)) {
                    subitems = privMessages[path];
                    if (subitems.hasOwnProperty(priv)) {
                        return path + '/';
                    }
                    else if (typeof subitems === 'string') {
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

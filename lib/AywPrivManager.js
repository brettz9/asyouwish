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


var _ = require('sdk/l10n').get,
    possiblePrivs = require('./possiblePrivs');

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
        possiblePrivs: possiblePrivs,
        localizedPrivs: possiblePrivs.map(function (priv) {
            return _("defaultPrivs_" + priv);
        }),
        defaultPrivs: possiblePrivs.reduce(function (obj, priv) {
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
            var privMessages = this.getGenericPrivs(),
                priv = this.getNormalizedPriv(fullPriv);
            if (priv === 'x-namespaced-simple-storage') {
                return _('defaultPrivs_' + priv, this.removeAnyNamespace(fullPriv));
            }
            return privMessages[priv];
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

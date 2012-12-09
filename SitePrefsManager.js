/*globals exports, Cc, Ci, Cu*/

// sitePrefsManager.js - AsYouWish's module
// author: brettz9

const { Cc, Ci, Cu } = require('chrome'); // Comment out for JSLint
'use strict';
function SitePrefsManager (defaultSetting, defaultSite) {
    if (!(this instanceof SitePrefsManager)) {
        return new SitePrefsManager(defaultSetting, defaultSite);
    }
    if (!this.ioSvc || !this.prefService) {
        this.ioSvc = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
        this.prefService = Cc['@mozilla.org/content-pref/service;1'].getService(Ci.nsIContentPrefService);
    }
    this.site = defaultSite;
    this.setting = defaultSetting;
}
SitePrefsManager.prototype = {
    constructor: SitePrefsManager,
    newURI: function newURI (aURL, aOriginCharset, aBaseURI) {
        aURL = aURL || this.site;
        aOriginCharset = aOriginCharset || 'UTF-8';
        aBaseURI = aBaseURI || null;
        return this.ioSvc.newURI(aURL, aOriginCharset, aBaseURI);
    },
    get: function get (site, setting) {
        site = site || this.site;
        setting = setting || this.setting;
        return this.prefService.getPref(this.newURI(site), setting);
    },
    getJSONArray: function getJSONArray (site, setting) {
        site = site || this.site;
        setting = setting || this.setting;
        return JSON.parse(this.get(site, setting) || '[]');
    },
    itemExists: function itemExists (item, site, setting) {
        site = site || this.site;
        setting = setting || this.setting;
        return this.getJSONArray(site, setting).indexOf(item) > -1;
    },
    set: function set (value, site, setting) {
        site = site || this.site;
        setting = setting || this.setting;
        return this.prefService.setPref(this.newURI(site), setting, value);
    },
    setJSONArray: function setJSONArray (value, site, setting) {
        return this.set(JSON.stringify(value), site, setting);
    },
    pushToJSONArray: function pushToJSONArray (value, site, setting) {
        var newArray;
        site = site || this.site;
        setting = setting || this.setting;
        newArray = this.getJSONArray(site, setting);
        if (newArray.indexOf(value) === -1) {
            newArray.push(value);
            return this.setJSONArray(newArray, site, setting);
        }
        return false;
    },
    reset: function reset (site, setting) {
        site = site || this.site;
        setting = setting || this.setting;
        return this.set('', site, setting);
    }
};
module.exports = SitePrefsManager;

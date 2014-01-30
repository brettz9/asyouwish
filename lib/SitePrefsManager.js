/*globals require, module, Cc, Ci*/

// sitePrefsManager.js - AsYouWish's module
// author: brettz9

(function () {

'use strict';
var prefs = require('sdk/simple-prefs').prefs;

function SitePrefsManager (defaultSetting, defaultSite) {
    if (!(this instanceof SitePrefsManager)) {
        return new SitePrefsManager(defaultSetting, defaultSite);
    }
    this.site = defaultSite;
    this.setting = defaultSetting;
}
SitePrefsManager.prototype = {
    constructor: SitePrefsManager,
    get: function get (site, setting) {
        site = site || this.site;
        setting = setting || this.setting;
        return prefs[site + '::' + setting];
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
        prefs[site + '::' + setting] = value;
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

}());

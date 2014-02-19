/*globals require, module, Cc, Ci*/

// sitePrefsManager.js - AsYouWish's module
// author: brettz9

(function () {

'use strict';
var chrome = require('chrome'),
    Cc = chrome.Cc, Ci = chrome.Ci,
    prefService = require('sdk/preferences/service'),
    branch = 'extensions.' + require('sdk/self').id + '.';
// var prefs = require('sdk/simple-prefs').prefs;

function SitePrefsManager (defaultSetting, defaultSite) {
    if (!(this instanceof SitePrefsManager)) {
        return new SitePrefsManager(defaultSetting, defaultSite);
    }
    this.site = defaultSite;
    this.setting = defaultSetting;
}
SitePrefsManager.prototype = {
    constructor: SitePrefsManager,
    /**
    * Build format to be used in about:config settings for a site
    * Would be cleaner to move from current about:config style:
    *     'extensions.' + <ugly-current-addon-id> + '.' + site + '::extensions.asyouwish.siteprivs'
    *
    * ...to:
    *
    *     'extensions.asyouwish.siteprivs.' + site
    *
    * ...where "asyouwish" was the new ID of the add-on. Would cause previously set preferences to be lost, however.
    */
    buildSetting: function (site, setting) {
        return branch + site + '::' + setting;
    },
    /**
    * @param site 
    * @param setting 
    */
    get: function get (site, setting) {
        site = site || this.site;
        setting = setting || this.setting;
        return prefService.get(this.buildSetting(site, setting));
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
    /**
    * @param site 
    * @param setting 
    */
    set: function set (value, site, setting) {
        site = site || this.site;
        setting = setting || this.setting;
        prefService.set(this.buildSetting(site, setting), value);
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

/*globals require, module, Cc, Ci*/

// sitePrefsManager.js - AsYouWish's module
// author: brettz9

/*
Advantages to nsIContentPrefService2
1. More reusable potentially with things like https://addons.mozilla.org/En-us/firefox/addon/content-preferences/

Disadvantages
1. By being domain-specific rather than page-specific, there is a greater risk that a malicious app hosted on a domain could run when only one app was intended
2. Not sure whether there is any way to use the caching methods or somehow block the originating script until prefs are returned
so the user can request AsYouWish synchronously.
*/

(function () {

'use strict';
var chrome = require('chrome'),
    Cc = chrome.Cc, Ci = chrome.Ci;
// var prefs = require('sdk/simple-prefs').prefs;

function SitePrefsManager (defaultSetting, defaultSite) {
    if (!(this instanceof SitePrefsManager)) {
        return new SitePrefsManager(defaultSetting, defaultSite);
    }
	if (!this.prefService) {
        this.prefService = Cc['@mozilla.org/content-pref/service;1'].getService(Ci.nsIContentPrefService2);
    }
    this.site = defaultSite;
    this.setting = defaultSetting;
}
SitePrefsManager.prototype = {
    constructor: SitePrefsManager,
	/**
	* @param site 
	* @param setting 
	* @param cbObj.handleCompletion 
	* @param cbObj.handleError 
	* @param cbObj.handleResult 
	*/
    get: function get (site, setting, cbObj) {
        site = site || this.site;
        setting = setting || this.setting;
		return this.prefService.getByDomainAndName(site, setting, null, cbObj); // No need to limit by context as AYW is serious enough to always be storing regardless of private storage
        // return prefs[site + '::' + setting];
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
	* @param cbObj.handleCompletion 
	* @param cbObj.handleError 
	* @param cbObj.handleResult 
	*/
    set: function set (value, site, setting, cbObj) {
        site = site || this.site;
        setting = setting || this.setting;
		return this.prefService.set(site, setting, value, null, cbObj); // No need to limit by context as AYW is serious enough to always be storing regardless of private storage
        // prefs[site + '::' + setting] = value;
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

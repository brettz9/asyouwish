/*globals module, require, genericPrefService*/

// GenericPrefsManager.js - AsYouWish's module
// author: brettz9

// Comment out for JSLint
const genericPrefService = require('preferences-service');

'use strict';
function GenericPrefsManager (defaultSetting) {
    if (!(this instanceof GenericPrefsManager)) {
        return new GenericPrefsManager(defaultSetting);
    }
    this.setting = defaultSetting;
}

GenericPrefsManager.prototype = {
    constructor: GenericPrefsManager,
    isSet: function isSet (setting) {
        setting = setting || this.setting;
        return genericPrefService.isSet(setting);
    },
    get: function get (setting) {
        setting = setting || this.setting;
        return genericPrefService.get(setting);
    },
    getJSON: function getJSON (setting) {
        return JSON.parse(this.get(setting));
    },
    set: function set (value, setting) {
        setting = setting || this.setting;
        return genericPrefService.set(setting, value);
    },
    setJSONArray: function setJSONArray (value, setting) {
        return this.set(JSON.stringify(value), setting);
    },
    pushToJSONArrayItem: function pushToJSONArrayItem (value, setting) {
        var newArray;
        setting = setting || this.setting;
        newArray = this.getJSON(setting);
        if (newArray.indexOf(value) === -1) {
            newArray.push(value);
            return this.setJSONArray(newArray, setting);
        }
        return false;
    }
};
module.exports = GenericPrefsManager;

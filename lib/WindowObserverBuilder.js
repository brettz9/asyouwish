/*globals require, exports */

// WindowObservers.js - AsYouWish's module
// author: brettz9

const { Cc, Ci, Cu } = require('chrome'); // Comment out for JSLint

var ObserverBuilder = require('./ObserverBuilder').ObserverBuilder;

/**
* Must override (inherited) observed() method; must call the register() method.
* @abstract
* @requires ObserverBuilder
* @param {String|Array} topic The topic or topics to listen for
* @param {Object} [config] An optional object with "observed" method
*/
function WindowObserverBuilder (topic, config) {
    if (!(this instanceof WindowObserverBuilder)) {
        return new WindowObserverBuilder(topic, config);
    }
    if (!topic) {
        throw 'WindowObserverBuilder() requires a topic.';
    }
    this.topic = topic;
    if (config) {
        this.observed = config.observed;
    }
}
WindowObserverBuilder.prototype = new ObserverBuilder();
WindowObserverBuilder.prototype.subjectCheck = function (subject) {
    return subject instanceof Ci.nsIDOMWindow; // data: origin
};

/**
* Must supply or override (inherited) observed() method; must call the register() method.
* @abstract
* @requires WindowObserverBuilder
* @param {Object} [config] An optional object with "observed" method
*/
function ContentDocumentGlobalCreatedObserverBuilder (config) {
    if (!(this instanceof ContentDocumentGlobalCreatedObserverBuilder)) {
        return new ContentDocumentGlobalCreatedObserverBuilder(config);
    }
    if (config) {
        this.observed = config.observed;
    }
}
// ContentDocumentGlobalCreatedObserverBuilder.prototype = new WindowObserverBuilder('document-element-inserted'); // Didn't seem to work // Version issue?
ContentDocumentGlobalCreatedObserverBuilder.prototype = new WindowObserverBuilder('content-document-global-created');

exports.WindowObserverBuilder = WindowObserverBuilder;
exports.ContentDocumentGlobalCreatedObserverBuilder = ContentDocumentGlobalCreatedObserverBuilder;

/*globals self*/
(function () {
'use strict';
{ // Shim block

/**
* @requires Array.prototype.map shim (https://gist.github.com/4212323)
* @license MIT, GPL, do whatever you want
*/
if (!Array.from) {
    Array.from = function (object) {
        return [].slice.call(object);
    };
}

/**
* @requires Array.from shim (https://gist.github.com/4212262)
* @requires Object.defineProperty shim (https://github.com/eligrey/Xccessors)
* @license MIT, GPL, do whatever you want
*/
// Doesn't work here:
/*
(function () {

// Inspired by http://stackoverflow.com/a/7754729/271577
function PseudoHTMLCollection(arr) {
    for (var i = 0, arrl = arr.length; i < arrl; i++) {
        this[i] = arr[i];
    }

    Object.defineProperty(this, 'length', {
        get: function () {
            return arr.length;
        }
    });

    Object.freeze(this);
}

PseudoHTMLCollection.prototype = {
    constructor: PseudoHTMLCollection,
    item: function (i) {
        return this[i] != null ? this[i] : null;
    },
    namedItem: function (name) {
        for (var i = 0, thisl = this.length; i < thisl; i++) {
            if (this[i].id === name || this[i].name === name) {
                return this[i];
            }
        }
        return null;
    }
};


Object.defineProperty(HTMLSelectElement.prototype, 'selectedOptions', {get: function () {
    return new PseudoHTMLCollection(Array.from(this.options).filter(function (option) {
        return option.selected;
    }));
}});


}());
*/
} // end shim block


// UTILITIES
function $ (sel) {
    var results = document.querySelectorAll(sel);
    return results.length === 1 ? results[0] : results;
}

function emptyElement (selector) {
    var elem = $(selector);
    while (elem.hasChildNodes()) {
        elem.removeChild(elem.firstChild);
    }
}

function insertOption (selectSelector, option) {
    $(selectSelector).appendChild(option);
}

function makeOption(text, value) {
    var option = document.createElement('option');
    if (value) {
        option.value = value;
    }
    option.title = option.text = text; // Adding tooltip without CSS doesn't work
    return option;
}

function optionFromSelectByValueRemover (sel) {
    return function (value) {
        Array.from($(sel).options).forEach(function (item) {
            if (item.value == value) {
                item.parentNode.removeChild(item);
            }
        });
    };
}

// INTERNAL EVENTS

// ..........PROTOCOL-RELATED..............
$('#addCurrentProtocol').addEventListener('click', function (e) {
    self.port.emit('addCurrentProtocol'); // Response will be in addedCurrentProtocol
});
$('#addAllowedProtocol').addEventListener('click', function (e) {
    var protocol = $('#protocolToAllow').value.replace(/\s+/, '').replace(/:(?:\/\/)?$/, '');
    if (protocol) { // No need to add
        self.port.emit('addAllowedProtocol', protocol); // Response will be in addedAllowedProtocol
    }
});
$('#removeAllowedProtocols').addEventListener('click', function (e) {
    self.port.emit(
        'removeAllowedProtocols', // Responses will be in removedAllowedProtocol
        /*Array.from($('#allowedProtocols').selectedOptions).map(function (option) {
            return option.value;
        })*/
        Array.from($('#allowedProtocols').options).filter(function (option) {
            return option.selected;
        }).map(function (option) {
            return option.value;
        })
    );
});
$('#allowAllProtocols').addEventListener('click', function (e) {
    var checked =e.target.checked;
    self.port.emit('allowAllProtocols', checked); // Response would be in allowedAllProtocols (not used, though handled on load through setAllowAllProtocols)
});

// ..........WEBSITE-RELATED..............
$('#addCurrentWebsite').addEventListener('click', function (e) {
    self.port.emit('addCurrentWebsite'); // Response will be in addedCurrentWebsite
});
$('#addAllowedWebsite').addEventListener('click', function (e) {
    var website = $('#websiteToAllow').value.replace(/\s+/, '');
    if (website) {
        self.port.emit('addAllowedWebsite', website); // Response will be in addedAllowedWebsite
    }
});
$('#removeAllowedWebsites').addEventListener('click', function (e) {
    self.port.emit(
        'removeAllowedWebsites', // Responses will be in removedAllowedWebsite
        /*Array.from($('#allowedWebsites').selectedOptions).map(function (option) {
            return option.value;
        })*/
        Array.from($('#allowedWebsites').options).filter(function (option) {
            return option.selected;
        }).map(function (option) {
            return option.value;
        })
    );
});
$('#allowAllWebsites').addEventListener('click', function (e) {
    var checked =e.target.checked;
    self.port.emit('allowAllWebsites', checked); // Response would be in allowedAllWebsites (not in use)
});

$('#removeApprovedWebsites').addEventListener('click', function (e) {
    self.port.emit(
        'removeApprovedWebsites', // Responses will be in removedWebsiteApproved
        /*Array.from($('#websitesApproved').selectedOptions).map(function (option) {
            return option.value;
        })*/
        Array.from($('#websitesApproved').options).filter(function (option) {
            return option.selected;
        }).map(function (option) {
            return option.value;
        })
    );
});

// EXTERNAL EVENTS

// ..........PROTOCOL-RELATED..............
// Setup
self.port.on('setAllowAllProtocols', function (setting) { // Originates from main.js (on load)
    $('#allowAllProtocols').checked = setting;
});
self.port.on('setAllowedProtocols', function (protocols) { // Originates from main.js (on load)
    emptyElement('#allowedProtocols');
    protocols.forEach(function (protocol) {
        insertOption('#allowedProtocols', makeOption(protocol));
    });
});
self.port.on('addedAllowedProtocol', function (protocol) { // Originates from addAllowedProtocol
    insertOption('#allowedProtocols', makeOption(protocol));
});
self.port.on('removedAllowedProtocol', optionFromSelectByValueRemover('#allowedProtocols')); // Originates from removeAllowedProtocols
self.port.on('addedCurrentProtocol', function (protocol) { // Originates from addCurrentProtocol
    $('#protocolToAllow').value = protocol;
});


// ..........WEBSITE-RELATED..............
// Setup
self.port.on('setAllowAllWebsites', function (setting) { // Originates from main.js (on load)
    $('#allowAllWebsites').checked = setting;
});
self.port.on('setAllowedWebsites', function (websites) { // Originates from main.js (on load)
    emptyElement('#allowedWebsites');
    websites.forEach(function (website) {
        insertOption('#allowedWebsites', makeOption(website));
    });
});
self.port.on('setWebsitesApproved', function (websites, approvedPrivs) { // Originates from main.js (on load)
    emptyElement('#websitesApproved');
    websites.forEach(function (website, i) {
        insertOption('#websitesApproved', makeOption(website + ' (' + approvedPrivs[i].join(', ') + ')', website));
    });
});

// Activated (like a callback) by event initiated here
self.port.on('addedCurrentWebsite', function (website) { // Originates from allowWebsite
    $('#websiteToAllow').value = website;
});
self.port.on('addedAllowedWebsite', function (website) { // Originates from addAllowedWebsite
    insertOption('#allowedWebsites', makeOption(website));
});
self.port.on('removedAllowedWebsite', optionFromSelectByValueRemover('#allowedWebsites')); // Originates from removeAllowedWebsites
self.port.on('removedWebsiteApproved', optionFromSelectByValueRemover('#websitesApproved')); // Originates from removeApprovedWebsites

// Activated from main.js
self.port.on('setWebsiteApproved', function (websiteAndPrivs) { // Originates from main.js (dynamically)
    var website = websiteAndPrivs[0],
        approvedPrivs = websiteAndPrivs[1];
    insertOption('#websitesApproved', makeOption(website + ' (' + approvedPrivs.join(', ') + ')', website));
});


}());
/*globals module */
(function () {'use strict';

    var possiblePrivs = [
        // GLOBALS
        'sdk/console',
        // HIGH-LEVEL APIS
        'chrome',
        // BEGIN THOSE OF LITTLE USE (might only be useful to act as alternative to AsYouWish itself)
        // 'sdk/addon-page', // Not of any use to sites as will only open THIS addon's data/index.html
        'sdk/l10n', // Not of any use to sites as will only provide access to THIS addon's localization (unless we were to allow common translation strings!)
        'sdk/self', // Probably of little use as only gives info on THIS addon, but might be used to detect whether addon was just upgraded, for loading any useful text files we might add  to the addon in the future?, etc. This is not the self global
        'sdk/simple-prefs',
        'sdk/timers', // Probably of no use since websites already allow timers
        // END THOSE OF LITTLE USE
        'sdk/base64',
        'sdk/clipboard',
        'sdk/context-menu',
        'sdk/hotkeys',
        'sdk/indexed-db',
        'sdk/notifications',
        'sdk/page-mod',
        'sdk/page-worker',
        'sdk/panel',
        'sdk/passwords',
        'sdk/private-browsing',
        'sdk/querystring',
        'sdk/request',
        'sdk/selection',
        'sdk/simple-storage',
        'sdk/system',
        'sdk/tabs',
        'sdk/url',
        'sdk/ui',
        // 'sdk/widget',
        'sdk/windows',

        // Low-level APIs (see main.js for more info):

        'toolkit/loader',
        'sdk/console/plain-text',
        'sdk/console/traceback',
        'sdk/content/content',
        // 'sdk/content/content-proxy',
        'sdk/content/loader',
        'sdk/content/mod',
        // 'sdk/content/symbiont', // Not available in SDK 1.16
        'sdk/content/worker',
        'sdk/core/heritage',
        'sdk/core/namespace',
        'sdk/core/promise',
        'sdk/event/core',
        'sdk/event/target',
        'sdk/frame/hidden-frame',
        'sdk/frame/utils',
        'sdk/io/byte-streams',
        'sdk/io/file',
        'sdk/io/text-streams',
        'sdk/lang/functional',
        'sdk/lang/type',
        'sdk/loader/cuddlefish',
        'sdk/loader/sandbox',
        'sdk/net/url',
        'sdk/net/xhr',
        'sdk/places/bookmarks',
        'sdk/places/favicon',
        'sdk/places/history',
        'sdk/platform/xpcom',
        'sdk/preferences/service',
        'sdk/stylesheet/style',
        'sdk/stylesheet/utils',
        // 'sdk/system/child_process', // Not available in SDK 1.16
        'sdk/system/environment',
        'sdk/system/events',
        'sdk/system/runtime',
        'sdk/system/unload',
        'sdk/system/xul-app',
        'sdk/tabs/utils',
        'sdk/test/assert',
        'sdk/test/harness',
        'sdk/test/httpd',
        'sdk/test/runner',
        'sdk/test/utils',
        'sdk/ui/button/action',
        'sdk/ui/button/toggle',
        'sdk/ui/frame',
        'sdk/ui/id',
        'sdk/ui/sidebar',
        'sdk/ui/toolbar',
        'sdk/util/array',
        'sdk/util/collection',
        'sdk/util/deprecate',
        'sdk/util/list',
        'sdk/util/match-pattern',
        'sdk/util/object',
        'sdk/util/uuid',
        'sdk/window/utils',

        // Custom
        'x-subprocess',
        'x-namespaced-simple-storage', // Needed here too?
        'x-register' // This cannot be requested directly; it will only be delivered through the register() API
    ];

    if (typeof module !== 'undefined') {
        module.exports = possiblePrivs;
    }
    else {
        window.possiblePrivs = possiblePrivs;
    }
}());

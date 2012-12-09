/**
* requireJS plugin to allow privileged requests to be treated like regular ones upon approval of all requested items
* @example
require(['priv!api-utils/xhr', 'priv!api-utils/file'], function (xhrObj, fileObj) {

}, function (state, arg1, arg2) {

});
*/

/*globals define, AsYouWish */
define({
    load: function (name, req, load, config) {
        'use strict';
        if (typeof AsYouWish === 'undefined') {
            load.error({
                state: 'request-unavailable',
                args: []
            });
            return;
        }
        AsYouWish.requestPrivs(name, function (requestedObject) {
            load(requestedObject);
        }, function (state) {
            load.error(
                /**
                * @property {'bad-privilege'|'failed-retrieval'|'refused'|'dismissed'|'removed'} state The state of the error
                * @property {Array} [args] Additional arguments as an array:
                *                                               arg1:
                *                                                   with 'bad-privilege' or 'failed-retrieval': the privilege name which failed
                *                                                   with 'refused', it gives an array of the refused privileges
                *                                               arg2:
                *                                                   with 'refused', it will be an array of the already approved privileges
                */
                {
                    state: state,
                    args: [].slice.call(arguments, 1)
                }
            );
        });
    }
});
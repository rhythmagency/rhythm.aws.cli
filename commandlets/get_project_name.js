'use strict';

var Q = require('q');
var CONSTANTS = require('../constants');

module.exports = function(context) {
    var app = context.app;
    var awsAPI = app.awsAPI;
    var prompt = app.prompt;

    var defaultRegion = 'us-east-1';

    var promptMsg = 'region [' + defaultRegion + ']';

    return Q.ninvoke(prompt, 'get', [promptMsg])
        .then(function(stdin) {
            var region = stdin[promptMsg] || defaultRegion;

            var promptMsg2 = 'objectID';

            return Q.ninvoke(prompt, 'get', [promptMsg2])
                .then(function(stdin) {
                    var objectID = stdin[promptMsg2];

                    var promptMsg3 = 'objectType (instance, snapshot, ami)';

                    return Q.ninvoke(prompt, 'get', [promptMsg3])
                        .then(function(stdin) {
                            var objectType = stdin[promptMsg3];

                            return awsAPI.getProjectName(region, objectID, objectType, {})
                                .then(function(data) {
                                    console.log(data);
                                });
                            });
                    });
        });
};

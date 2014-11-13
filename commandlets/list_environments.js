'use strict';

var Q = require('q');
var CONSTANTS = require('../constants.js');

module.exports = function(context) {
    var app = context.app;
    var awsAPI = app.awsAPI;
    var prompt = app.prompt;

    var defaultRegion = 'us-east-1';

    var promptMsg = 'region [' + defaultRegion + ']';

    return Q.ninvoke(prompt, 'get', [promptMsg])
        .then(function(stdin) {
            var region = stdin[promptMsg] || defaultRegion;

            var promptMsg2 = 'project';

            return Q.ninvoke(prompt, 'get', [promptMsg2])
                .then(function(stdin) {
                    var project = stdin[promptMsg2];

                    return awsAPI.listEnvironments(region, project, {})
                        .then(function(environmentNames) {
                            environmentNames.forEach(function(el, idx, arr) {
                                console.log(el);
                            });
                        });
                    });
        });
};

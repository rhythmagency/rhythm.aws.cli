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

            var promptMsg2 = 'project';

            return Q.ninvoke(prompt, 'get', [promptMsg2])
                .then(function(stdin) {
                    var project = stdin[promptMsg2];

                    var defaultEnv = 'Production';
                    var promptMsg3 = 'environment ['+defaultEnv+']';

                    return Q.ninvoke(prompt, 'get', [promptMsg3])
                        .then(function(stdin) {
                            var environment = stdin[promptMsg3] || defaultEnv;

                            return awsAPI.createEnvironmentSnapshot(region, project, environment, {})
                                .then(function(data) {
                                    console.log(data);
                                });
                            });
                    });
        });
};

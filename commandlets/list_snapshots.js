'use strict';

var Q = require('q');

module.exports = function(context) {
    var app = context.app;
    var awsAPI = app.awsAPI;
    var prompt = app.prompt;

    var defaultRegion = 'us-east-1';

    var userArguments = {};

    var promptMsg = 'region [' + defaultRegion + ']';

    return Q.ninvoke(prompt, 'get', [promptMsg])
        .then(function(stdin) {
            var region = stdin[promptMsg] || defaultRegion;

            userArguments.region = region;

            var promptMsg2 = 'project';

            return Q.ninvoke(prompt, 'get', [promptMsg2])
                .then(function(stdin) {
                    var project = stdin[promptMsg2];

                    userArguments.project = project;

                    var defaultEnv = 'Production';
                    var promptMsg3 = 'environment ['+defaultEnv+']';

                    return Q.ninvoke(prompt, 'get', [promptMsg3])
                        .then(function(stdin) {
                            var environment = stdin[promptMsg3] || defaultEnv;

                            userArguments.environment = environment;

                            return awsAPI.listSnapshots(region, project, environment, {})
                                .then(function(data) {
                                    console.log(data);
                                });
                            });
                    });
        });
};

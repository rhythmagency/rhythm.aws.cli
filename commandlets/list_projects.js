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

            return awsAPI.listProjects(region, {})
                .then(function(projectNames) {
                    projectNames.forEach(function(el, idx, arr) {
                        console.log(el);
                    });
                });
        });
};

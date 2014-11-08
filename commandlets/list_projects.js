'use strict';

var CONSTANTS = require('../constants.js');

module.exports = function(context, callback) {
    var app = context.app;
    var prompt = app.prompt;

    var defaultRegion = 'us-east-1';

    var promptMsg = 'region ['+defaultRegion+']';

    prompt.get([promptMsg], function(err, stdin) {
        var region = stdin[promptMsg] || defaultRegion;

        context.app.model.AWS.config.update({region: region});

        var ec2 = new context.app.model.AWS.EC2();

        var params = context.params || {};

        ec2.describeInstances(params, function(err, data){
            var projectNames = {};

            data.Reservations.forEach(function(el, idx, arr){
                if(el.Instances.length > 0) {
                    el.Instances.forEach(function(el, idx, arr) {
                        if (el.Tags.length > 0) {
                            el.Tags.forEach(function(el, idx, arr) {
                                var tagName = el.Key;

                                if(tagName == CONSTANTS.TAG_PROJECT_NAME){
                                    projectNames[el.Value] = el.Value;
                                }
                            });
                        }
                    });
                }
            });

            var projectNamesArr = [];
            Object.keys(projectNames).forEach(function(el, idx, arr) {
                projectNamesArr.push(el);
            });

            projectNamesArr.sort();

            projectNamesArr.forEach(function(el, idx, arr) {
                console.log(el);
            });

            callback(err, projectNames);
        });
    });
};

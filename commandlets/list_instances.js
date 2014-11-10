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
            data.Reservations.forEach(function(el, idx, arr){
                console.log('ReservationId: '+el.ReservationId);
                if(el.Instances.length > 0) {
                    console.log('|------------------------------------------------');

                    el.Instances.forEach(function(el, idx, arr) {
                        console.log('| Name:                    ' + el.KeyName);
                        console.log('| InstanceId:              ' + el.InstanceId);
                        console.log('| State:                   ' + el.State.Name);
                        console.log('| PublicIpAddress:         ' + el.PublicIpAddress);
                        console.log('| Platform:                ' + el.Platform);
                        console.log('| Architecture:            ' + el.Architecture);
                        if (el.Tags.length > 0) {
                            console.log('| Tags:');
                            el.Tags.forEach(function(el, idx, arr) {
                                var tagName = el.Key;

                                if(tagName.substr(0, CONSTANTS.TAG_PREFIX.length) == CONSTANTS.TAG_PREFIX){
                                    tagName = tagName.substr(CONSTANTS.TAG_PREFIX.length);
                                }
                                console.log('|       ' + tagName + ': ' + el.Value);
                            });
                        }
                        console.log('|------------------------------------------------');
                    });
                }
                console.log('');
            });

            callback(err, data);
        });
    });
};

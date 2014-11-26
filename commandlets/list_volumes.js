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

                            return awsAPI.listVolumes(region, project, environment, {})
                                .then(function(data) {
                                    if(data.Volumes.length > 0) {
                                        console.log('|------------------------------------------------');
                                        data.Volumes.forEach(function(el, idx, arr) {
                                            console.log('| VolumeId:                  ' + el.VolumeId);
                                            console.log('| Size:                      ' + el.Size);
                                            console.log('| SnapshotId:                ' + el.SnapshotId);
                                            console.log('| AvailabilityZone:          ' + el.AvailabilityZone);
                                            console.log('| State:                     ' + el.State);
                                            console.log('| CreateTime:                ' + el.CreateTime);
                                            console.log('| VolumeType:                ' + el.VolumeType);
                                            console.log('| Iops:                      ' + el.Iops);
                                            console.log('| Encrypted:                 ' + el.Encrypted);
                                            if (el.Attachments.length > 0) {
                                                console.log('| Attachments:');
                                                console.log('|       -----------------------------------------');
                                                el.Attachments.forEach(function(el, idx, arr) {
                                                    console.log('|       ' + 'InstanceId: ' + el.InstanceId);
                                                    console.log('|       ' + 'Device: ' + el.Device);
                                                    console.log('|       ' + 'State: ' + el.State);
                                                    console.log('|       ' + 'AttachTime: ' + el.AttachTime);
                                                    console.log('|       ' + 'DeleteOnTermination: ' + el.DeleteOnTermination);
                                                    console.log('|       -----------------------------------------');
                                                });
                                            }

                                            if (el.Tags.length > 0) {
                                                console.log('| Tags:');
                                                el.Tags.forEach(function(el, idx, arr) {
                                                    var tagName = el.Key;

                                                    if (tagName.substr(0, CONSTANTS.TAG_PREFIX.length) == CONSTANTS.TAG_PREFIX) {
                                                        tagName = tagName.substr(CONSTANTS.TAG_PREFIX.length);
                                                    }
                                                    console.log('|       ' + tagName + ': ' + el.Value);
                                                });
                                            }
                                            console.log('|------------------------------------------------');
                                        });
                                    }
                                });
                            });
                    });
        });
};

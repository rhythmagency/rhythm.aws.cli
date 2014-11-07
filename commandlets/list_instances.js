'use strict';

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
            callback(err, data);
        });
    });
};

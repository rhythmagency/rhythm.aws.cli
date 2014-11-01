'use strict';

module.exports = function(app, context, callback) {
    var region = context.region || 'us-east-1';

    app.model.AWS.config.update({region: region});

    var ec2 = new app.model.AWS.EC2();

    var params = context.params || {};

    ec2.describeInstances(params, function(err, data){
        callback(err, data);
    });
};
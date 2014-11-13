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

        params.OwnerIds = [
            //todo get our owner id
            '683984025722'
        ];

        ec2.describeSnapshots(params, function(err, data){
            if(err){
                callback(err, data);
                return;
            }
//            console.log(data);

            var snapshotIDs = [];

            data.Snapshots.forEach(function(el, idx, arr) {
                if(idx > 0)
                    return;

                console.log(el);
                snapshotIDs.push(el['SnapshotId']);
            });

            var params = {
                Resources: snapshotIDs,
                Tags: [
                    {
                        Key: 'aws.cli.Environment',
                        Value: 'Production'
                    }
                ]
            };

            ec2.createTags(params, function(err, data){
                if (err)
                    console.log(err, err.stack);
                else
                    console.log(data);

                callback(err, data);
            });
        });
    });
};

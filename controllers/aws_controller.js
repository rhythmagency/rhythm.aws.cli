'use strict';

var Q = require('q');
var fs = require('fs-extra');
var CONSTANTS = require('../constants');

function AWSController() {
    this.AWS = require('aws-sdk');

    if (fs.existsSync('./awsconfig.json')) {
        console.log('Loading credentials from awsconfig.json');
        this.AWS.config.loadFromPath('./awsconfig.json');
    } else {
        console.log('Loading credentials from ~/.aws/credentials');
    }
}

function sortByKey(array, key) {
    return array.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

/*
II: When environments are created, they will be assigned DNS names via Route53's changeResourceRecordSets API call.

createEnvironmentFromSnapshot(region: string, projectName : string, newEnvironmentName : string, snapshotId : string, additionalParams: object) : promise[instanceId : string, domain : string, ipAddress : string]
Creates a new environment from a given snapshotId. If the environment exists, the function fails.
Example: createEnvironmentFromSnapshot("us-east-1", "myvaleantpartnership", "Staging", "snap-27d95081", {}).then(...)

createEnvironmentSnapshot(region: string, projectName : string. environmentName : string, additionalParams: object) : promise[newSnapshotId : string]
Creates a new snapshot for the given project and environment. Instance will be shutdown to ensure snapshot integrity.
Example: createEnvironmentSnapshot("us-east-1", "myvaleantpartnership", "Production", {}).then(...)

copyEnvironment(region: string, projectName : string, sourceEnvironmentName : string, targetEnvironmentName : string, additionalParams: object) : promise[instanceId : string, domain : string, ipAddress : string]
Convenience method for createEnvironment function with latest snapshot.
Example: copyEnvironment("us-east-1", "myvaleantpartnership", "Production", "Staging", {}).then(...)

deleteEnvironment(region: string, projectName : string, environmentName : string, additionalParams: object) : promise[newSnapshotId : string]
Takes an existing environment offline, makes a snapshot, then deletes the instances, given the project and environment names.
Example: deleteEnvironment("us-east-1", "myvaleantpartnership", "Staging", {}).then(...)
*/

/**
 * List all instances in a given region
 *
 * @param region
 * @param params
 * @returns promise (data as returned by aws ec2.describeInstances)
 */

AWSController.prototype.listInstances = function(region, params){
    var self = this;

    self.AWS.config.update({region: region});

    var ec2 = new self.AWS.EC2();

    params = params || {};

    return Q.ninvoke(ec2, 'describeInstances', params);
};

/**
 * Lists all project names in a given region
 *
 * @param region
 * @param params
 * @returns {*}
 */

AWSController.prototype.listProjects = function(region, params){
    var self = this;

    params = params || {};

    return self.listInstances(region, params)
        .then(function(data){
            var projectNames = {};

            data.Reservations.forEach(function(el, idx, arr) {
                if (el.Instances.length > 0) {
                    el.Instances.forEach(function(el, idx, arr) {
                        if (el.Tags.length > 0) {
                            el.Tags.forEach(function(el, idx, arr) {
                                var tagName = el.Key;

                                if (tagName == CONSTANTS.TAG_PROJECT_NAME) {
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

            return projectNamesArr;
        });
};

/**
 * Lists all environment names for a given project
 *
 * @param region
 * @param project
 * @param params
 * @returns {*}
 */

AWSController.prototype.listEnvironments = function(region, project, params){
    var self = this;

    params = params || {};

    return self.listInstances(region, params)
        .then(function(data){
            var environmentNames = {};

            data.Reservations.forEach(function(el, idx, arr) {
                if (el.Instances.length > 0) {
                    el.Instances.forEach(function(el, idx, arr) {
                        if (el.Tags.length > 0) {
                            el.Tags.forEach(function(el, idx, arr) {
                                var tagName = el.Key;

                                if (tagName == CONSTANTS.TAG_ENVIRONMENT) {
                                    environmentNames[el.Value] = el.Value;
                                }
                            });
                        }
                    });
                }
            });

            var environmentNamesArr = [];
            Object.keys(environmentNames).forEach(function(el, idx, arr) {
                environmentNamesArr.push(el);
            });

            environmentNamesArr.sort();

            return environmentNamesArr;
        });
};

/**
 * Gets a list of all snapshots for a given project / environment.
 *
 * @param region
 * @param project
 * @param environment
 * @param params
 * @returns {*}
 */

AWSController.prototype.listSnapshots = function(region, project, environment, params){
    var self = this;

    self.AWS.config.update({region: region});

    var ec2 = new self.AWS.EC2();

    params = params || {};

    var filters = [];

//    filters.push(
//        {
//            Name: 'owner-alias',
//            Values: [
//                'self'
//            ]
//        }
//    );

    if(!!project) {
        project = project.toLowerCase();

        filters.push(
            {
                Name: 'tag:' + CONSTANTS.TAG_PROJECT_NAME,
                Values: [
                    project
                ]
            }
        );
    }

    if(!!environment) {
        environment = environment.toLowerCase();
        environment = environment.substr(0, 1).toUpperCase() + environment.substr(1);

        filters.push(
            {
                Name: 'tag:' + CONSTANTS.TAG_ENVIRONMENT,
                Values: [
                    environment
                ]
            }
        );
    }

    if(filters.length > 0)
        params.Filters = filters;

    return Q.ninvoke(ec2, 'describeSnapshots', params);
};

/**
 * Gets the most recent snapshot for the given project / environment.
 *
 * @param region
 * @param project
 * @param environment
 * @param params
 * @returns {*}
 */

AWSController.prototype.latestSnapshot = function(region, project, environment, params){
    var self = this;

    return self.listSnapshots(region, project, environment, params)
                    .then(function(data) {
                        if (data.Snapshots.length > 0) {
                            sortByKey(data.Snapshots, 'StartTime').reverse();
                            return data.Snapshots.pop();
                        } else {
                            return null;
                        }
                    });
}

/**
 * Gets a list of all images for a given project / environment.
 * objectType = instance | snapshot | ami
 *
 * @param region
 * @param project
 * @param environment
 * @param params
 * @returns {*}
 */

AWSController.prototype.listImages = function(region, project, environment, params){
    var self = this;

    self.AWS.config.update({region: region});

    var ec2 = new self.AWS.EC2();

    params = params || {};

    params.Owners = [
        'self'
    ];

    var filters = params.Filters || [];

    if(!!project) {
        project = project.toLowerCase();

        filters.push(
            {
                Name: 'tag:' + CONSTANTS.TAG_PROJECT_NAME,
                Values: [
                    project
                ]
            }
        );
    }

    if(!!environment) {
        environment = environment.toLowerCase();
        environment = environment.substr(0, 1).toUpperCase() + environment.substr(1);

        filters.push(
            {
                Name: 'tag:' + CONSTANTS.TAG_ENVIRONMENT,
                Values: [
                    environment
                ]
            }
        );
    }

    if(filters.length > 0)
        params.Filters = filters;

    return Q.ninvoke(ec2, 'describeImages', params);
};

/**
 * Gets the project name for the given object.
 * objectType = instance | snapshot | ami
 *
 * @param region
 * @param objectID
 * @param objectType
 * @param params
 * @returns {*}
 */

AWSController.prototype.getProjectName = function(region, objectID, objectType, params){
    var self = this;

    var projectName = 'Project Tag Not Found';

    if(!objectID){
        return Q.fcall(function(){
            return projectName;
        });
    }

    if(!objectType){
        return Q.fcall(function(){
            return projectName;
        });
    }

    params = params || {};
    objectType = objectType.toLowerCase();

    if(objectType == 'instance'){
        params.InstanceIds = [
            objectID
        ];

        return self.listInstances(region, params)
            .then(function(data){
                data.Reservations.forEach(function(el, idx, arr) {
                    if (el.Instances.length > 0) {
                        el.Instances.forEach(function(el, idx, arr) {
                            if (el.Tags.length > 0) {
                                el.Tags.forEach(function(el, idx, arr) {
                                    var tagName = el.Key;

                                    if (tagName == CONSTANTS.TAG_PROJECT_NAME) {
                                        projectName = el.Value;
                                    }
                                });
                            }
                        });
                    }
                });

                return projectName;
            });
    }else if(objectType == 'snapshot'){
        params.SnapshotIds = [
            objectID
        ];

        return self.listSnapshots(region, null, null, params)
            .then(function(data){
                data.Snapshots.forEach(function(el, idx, arr) {
                    if (el.Tags.length > 0) {
                        el.Tags.forEach(function(el, idx, arr) {
                            var tagName = el.Key;

                            if (tagName == CONSTANTS.TAG_PROJECT_NAME) {
                                projectName = el.Value;
                            }
                        });
                    }
                });

                return projectName;
            });
    }else if(objectType == 'ami') {
        params.ImageIds = [
            objectID
        ];

        return self.listImages(region, null, null, params)
            .then(function(data){
                if(data.Images.length > 0){
                    if(data.Images[0].Tags.length > 0){
                        data.Images[0].Tags.forEach(function(el, idx, arr){
                            var tagName = el.Key;

                            if (tagName == CONSTANTS.TAG_PROJECT_NAME) {
                                projectName = el.Value;
                            }
                        });
                    }
                }

                return projectName;
            });
    }else{
        return Q.fcall(function(){
            return projectName;
        });
    }
};

/**
 * Sets the project name for the given object. Enables project related commands for objects created outside of this module.
 * objectType = instance | snapshot | ami
 *
 * @param region
 * @param objectID
 * @param name
 * @param params
 * @returns {*}
 */

AWSController.prototype.setProjectName = function(region, objectID, name, params){
    var self = this;

    if(!!name) {
        name = name.toLowerCase();
    }else{
        return Q.fcall(function(){
            return false;
        });
    }

    return self.createTags(region, objectID, CONSTANTS.TAG_PROJECT_NAME, name, params);
};

/**
 * Gets the environment for the given object.
 * objectType = instance | snapshot | ami
 *
 * @param region
 * @param objectID
 * @param objectType
 * @param params
 * @returns {*}
 */

AWSController.prototype.getEnvironment = function(region, objectID, objectType, params){
    var self = this;

    var environment = 'Environment Tag Not Found';

    if(!objectID){
        return Q.fcall(function(){
            return environment;
        });
    }

    if(!objectType){
        return Q.fcall(function(){
            return environment;
        });
    }

    params = params || {};
    objectType = objectType.toLowerCase();

    if(objectType == 'instance'){
        params.InstanceIds = [
            objectID
        ];

        return self.listInstances(region, params)
            .then(function(data){
                data.Reservations.forEach(function(el, idx, arr) {
                    if (el.Instances.length > 0) {
                        el.Instances.forEach(function(el, idx, arr) {
                            if (el.Tags.length > 0) {
                                el.Tags.forEach(function(el, idx, arr) {
                                    var tagName = el.Key;

                                    if (tagName == CONSTANTS.TAG_ENVIRONMENT) {
                                        environment = el.Value;
                                    }
                                });
                            }
                        });
                    }
                });

                return environment;
            });
    }else if(objectType == 'snapshot'){
        params.SnapshotIds = [
            objectID
        ];

        return self.listSnapshots(region, null, null, params)
            .then(function(data){
                data.Snapshots.forEach(function(el, idx, arr) {
                    if (el.Tags.length > 0) {
                        el.Tags.forEach(function(el, idx, arr) {
                            var tagName = el.Key;

                            if (tagName == CONSTANTS.TAG_ENVIRONMENT) {
                                environment = el.Value;
                            }
                        });
                    }
                });

                return environment;
            });
    }else if(objectType == 'ami') {
        params.ImageIds = [
            objectID
        ];

        return self.listImages(region, null, null, params)
            .then(function(data){
                if(data.Images.length > 0){
                    if(data.Images[0].Tags.length > 0){
                        data.Images[0].Tags.forEach(function(el, idx, arr){
                            var tagName = el.Key;

                            if (tagName == CONSTANTS.TAG_ENVIRONMENT) {
                                environment = el.Value;
                            }
                        });
                    }
                }

                return environment;
            });
    }else{
        return Q.fcall(function(){
            return environment;
        });
    }
};

/**
 * Sets the environment for the given object.
 *
 * @param region
 * @param objectID
 * @param environment (Production, Staging, Test)
 * @param params
 * @returns {*}
 */

AWSController.prototype.setEnvironment = function(region, objectID, environment, params){
    var self = this;

    if(!!environment) {
        environment = environment.toLowerCase();
        environment = environment.substr(0, 1).toUpperCase() + environment.substr(1);
    }else{
        return Q.fcall(function(){
            return false;
        });
    }

    return self.createTags(region, objectID, CONSTANTS.TAG_ENVIRONMENT, environment, params);
};

AWSController.prototype.createTags = function(region, objectID, tagKey, tagValue, params){
    var self = this;

    self.AWS.config.update({region: region});

    var ec2 = new self.AWS.EC2();

    if(!objectID){
        return Q.fcall(function(){
            return false;
        });
    }

    params = params || {};

    var listParams = {};
    listParams.InstanceIds = [
        objectID
    ];

    params.Resources = [
        objectID
    ];

    params.Tags = [
        {
            Key: tagKey,
            Value: tagValue
        }
    ];

    return Q.ninvoke(ec2, 'createTags', params);
};

module.exports = AWSController;

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
/*
createEnvironment(projectName : string, newEnvironmentName : string, snapshotId : string) : promise[instanceId : string, domain : string, ipAddress : string]
Creates a new environment from a given snapshotId. If the environment exists, the function fails.
Example: createEnvironment("myvaleantpartnership", "sandbox", "snap-27d95081").then(...)

createEnvironmentSnapshot(projectName : string. environmentName : string) : promise[newSnapshotId : string]
Creates a new snapshot for the given project / environment. Instance will be shutdown to ensure snapshot integrity.
Example: createEnvironmentSnapshot("myvaleantpartnership", "production").then(...)

copyEnvironment(projectName : string, sourceEnvironmentName : string, targetEnvironmentName : string) : promise[instanceId : string, domain : string, ipAddress : string]
Copies an existing environment, based on the most recent snapshot. If the target exists, the function fails. Shortcut for createEnvironment function.
Example: copyEnvironment("myvaleantpartnership", "production", "sandbox").then(...)

deleteEnvironment(projectName : string, environmentName : string) : promise[newSnapshotId : string]
Deletes an existing environment, given the project / environment name. Instance will be shutdown, and a snapshot of the instance will be taken prior to instance termination.
Example: deleteEnvironment("myvaleantpartnership", "sandbox")

setEnvironmentName(id : string, objectType : string, newEnvironmentName : string) : promise
Sets the environment name for the given object. Project name must be assigned first. Environment name must be unique for project. Enables environment related commands for objects created outside of this module.
objectType = instance | snapshot | ami
Example: setEnvironmentName("i-c2ed2790", "instance", "staging")

getEnvironmentName(instanceId : string, objectType : string) : promise[environmentName : string]
Gets the environment name for the given object.
objectType = instance | snapshot | ami
Example: getEnvironmentName("i-c2ed2790", "instance")
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
 * Gets a list of all images for a given project / environment.
 * objectType = instance | snapshot | ami
 *
 * @param region
 * @param objectID
 * @param objectType
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

    if(!!!objectID){
        return Q.fcall(function(){
            return projectName;
        });
    }

    if(!!!objectType){
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

    self.AWS.config.update({region: region});

    var ec2 = new self.AWS.EC2();

    if(!!!objectID){
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
            Key: CONSTANTS.TAG_PROJECT_NAME,
            Value: name
        }
    ];
    return Q.ninvoke(ec2, 'createTags', params);
};

module.exports = AWSController;

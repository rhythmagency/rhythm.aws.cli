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
listSnapshots(projectName : string, environmentName : string) : promise[snapshots : array]
Gets a list of all snapshots for a given project / environment.
Example: listSnapshots("myvaleantpartnership", "production").then(...)

getMostRecentSnapshot(projectName : string, environmentName : string) : promise[snapshot : object]
Gets information for the most recent snapshot for the given project / environment.
Example: getMostRecentSnapshot("myvaleantpartnership", "production").then(...)

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


listEnvironmentNames(string projectName) : promise[environmentNames : array]
Lists all environment names for a given project
Example: listEnvironmentNames("myvaleantpartnership").then(...)

setProjectName(id : string, objectType : string, newProjectName : string) : promise
Sets the project name for the given object. Enables project related commands for objects created outside of this module.
objectType = instance | snapshot | ami
Example: setProjectName("i-c2ed2790", "instance", "myvaleantpartnership")

getProjectName(id : string, objectType : string) : promise[projectName : string]
Gets the project name for the given object.
objectType = instance | snapshot | ami
Example: getProjectName("i-c2ed2790", "instance")

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

module.exports = AWSController;

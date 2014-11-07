'use strict';

var fs = require('fs-extra');

function Application(packageData){
    this.name = packageData.name;
    this.version = packageData.version;
    this.AWS = require('aws-sdk');
    this.hasDisplayedWelcomeBanner = false;

    if (fs.existsSync('./awsconfig.json')) {
        console.log('Loading credentials from awsconfig.json');
        this.AWS.config.loadFromPath('./awsconfig.json');
    } else {
        console.log('Loading credentials from ~/.aws/credentials');
    }
};

module.exports = Application;
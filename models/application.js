'use strict';

function Application(packageData){
    this.name = packageData.name;
    this.version = packageData.version;
    this.hasDisplayedWelcomeBanner = false;
};

module.exports = Application;
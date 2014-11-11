'use strict';

var Q = require('q');
var CONSTANTS = require('../constants.js');

function ApplicationController(applicationModel) {
    this.model = applicationModel;
    this.prompt = require('prompt');
    var AWSController = require('./aws_controller');
    this.awsAPI = new AWSController();

    this.prompt.message = this.model.name;
    this.prompt.start();
}

ApplicationController.prototype.main = function() {
    var app = this;
    var prompt = app.prompt;

    if(!app.model.hasDisplayedWelcomeBanner){
        app.model.hasDisplayedWelcomeBanner = true;

        app.displayWelcomeBanner();
        return;
    }

    Q.ninvoke(prompt, 'get', ['command'])
        .then(function(stdin){
            var commandlet = app.getCommandlet(stdin.command);

            commandlet.then(function(data){
                    console.log('');
                    app.main();
                }).done();
        })
        .catch(function(e){
            console.log(e);
            app.main();
        });
};

ApplicationController.prototype.displayWelcomeBanner = function(){
    var app = this;
    app.model.hasDisplayedWelcomeBanner = true;

    var commandlet = app.getCommandlet('welcome banner');

    commandlet.then(function(data){
            console.log('');
            app.main();
        })
        .catch(function(e){
            console.log(e);
            app.main();
        });
};

ApplicationController.prototype.getCommandlet = function(command) {
    var app = this;
    //take input as "space separated words" and transform it into "lowercase_underscore_separated_words"
    var filename = command.replace(/ /g, '_').toLowerCase();
    var commandlet = require('../' + CONSTANTS.COMMANDLETS_FOLDER + '/' + filename);
    return Q.fcall(commandlet, {app: app});
};

module.exports = ApplicationController;

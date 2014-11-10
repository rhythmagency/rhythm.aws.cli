'use strict';

var CONSTANTS = require('../constants.js');

function ApplicationController(applicationModel) {
    this.model = applicationModel;
    this.prompt = require('prompt');
    this.Q = require('q');

    this.prompt.message = this.model.name;
    this.prompt.start();
}

ApplicationController.prototype.main = function() {
    var app = this;
    var Q = app.Q;
    var prompt = app.prompt;

    if(!app.model.hasDisplayedWelcomeBanner){
        app.model.hasDisplayedWelcomeBanner = true;

        app.displayWelcomeBanner();
        return;
    }

    prompt.get(['command'], function(err, stdin) {
        try {
            var commandlet = app.getCommandlet(stdin.command);

            Q.nfcall(commandlet, {app: app})
                .then(function(data){
                    console.log('');
                    app.main();
                })
                .catch(function(err){
                    console.log(err);
                });

        } catch (e) {
            console.error(e);

            app.main();
        }
    });
};

ApplicationController.prototype.displayWelcomeBanner = function(){
    var app = this;
    app.model.hasDisplayedWelcomeBanner = true;

    try {
        var commandlet = app.getCommandlet('welcome banner');
        commandlet({app: app}, function(err, data){
            console.log('');
            app.main();
        });
    } catch (e) {
        console.error(e);

        app.main();
    }
};

ApplicationController.prototype.getCommandlet = function(command) {
    //take input as "space separated words" and transform it into "lowercase_underscore_separated_words"
    var filename = command.replace(/ /g, '_').toLowerCase();
    return require('../' + CONSTANTS.COMMANDLETS_FOLDER + '/' + filename);
};

module.exports = ApplicationController;

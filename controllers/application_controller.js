'use strict';

var CONSTANTS = require('../constants.js');

function ApplicationController(applicationModel) {
    this.model = applicationModel;
    this.prompt = require('prompt');
    this.async = require('async');

    this.prompt.message = this.model.name;
    this.prompt.start();
};

ApplicationController.prototype.main = function() {
    var app = this;
    var async = app.async;
    var prompt = app.prompt;

    if(!app.model.hasDisplayedWelcomeBanner){
        app.model.hasDisplayedWelcomeBanner = true;

        app.displayWelcomeBanner();
        return;
    }

    prompt.get(['command'], function(err, stdin) {
        try {
            var commandlet = app.getCommandlet(stdin.command);
            async.series([
                async.apply(commandlet, {app: app})
            ], function(err, data) {
                if (err) {
                    console.log(err);
                } else {
                    data.forEach(function(el, idx, arr){
                        if(typeof el === 'object')
                            console.log(JSON.stringify(el, null, ' '));
                        else
                            console.log(el);
                    });
                }

                console.log('');

                app.main();
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
            console.log(data);
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

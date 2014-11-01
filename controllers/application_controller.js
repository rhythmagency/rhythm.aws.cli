'use strict';

var CONSTANTS = require('../constants.js');

var prompt = require('prompt');

function ApplicationController(applicationModel) {
    this.model = applicationModel;
    prompt.message = this.model.name;
    prompt.start();
};

ApplicationController.prototype.main = function() {
    var self = this;

    self.promptForCommand(function(err, result) {
        try {
            self.run(result.command, {}, function(err, data) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(data);
                }

                console.log('');

                self.main();
            });
        } catch (e) {
            console.error(e);
        }
    });
};

ApplicationController.prototype.run = function(command, context, callback) {
    //take input as "space separated words" and transform it into "lowercase_underscore_separated_words"
    var filename = command.replace(/ /g, '_').toLowerCase();
    var cmd = require('../' + CONSTANTS.COMMANDLETS_FOLDER + '/' + filename);
    console.log('\nRunning "' + command + '"\n');
    cmd(this, context, callback);
};

ApplicationController.prototype.promptForCommand = function(callback) {
    prompt.get(['command'], callback);
};

module.exports = ApplicationController;

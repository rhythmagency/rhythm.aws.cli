'use strict';

var fs = require('fs-extra');
var path = require('path');

module.exports = function(context) {
    var commandlets = fs.readdirSync('./commandlets');
    var validCommandlets = [];

    commandlets.forEach(function(el, idx, arr){
        var fileExt = el.substr(-3, 3);
        if(fileExt == '.js') {
            var cmdName = el.substring(0, el.length -3).replace(/_/g, ' ');
            validCommandlets.push(cmdName);
        }
    });

    var msg = validCommandlets.join('\n');

    console.log(msg);

    return msg;
};
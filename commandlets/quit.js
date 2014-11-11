'use strict';

module.exports = function(context, callback) {
    var cowsay = require('cowsay');
    var faces = [
        'default',
        'squirrel',
        'turtle',
        'moose',
        'dragon',
        'dragon-and-cow'
    ];

    var randomFace = faces[Math.floor(Math.random()*faces.length)];
    console.log(cowsay.say({
        text:'Goooodbye',
        f: randomFace,
        e: 'oO',
        T: 'U '
    }));
    process.exit();
};
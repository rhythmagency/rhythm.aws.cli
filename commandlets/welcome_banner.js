'use strict';

module.exports = function(context, callback) {
    var nameAndVersion = context.app.model.name+' '+context.app.model.version;

    var figlet = require('figlet');
    var banner = figlet.textSync('Rhythm', {
        //font: 'Big Money-nw'
        font: 'Georgia11'
    });

    var baselineOffset = 10;
    var charOffset = 37;

    var lines = banner.split('\n');
    lines.forEach(function(el, idx, arr){
        if(idx == baselineOffset){
            var line = '';
            for(var i = 0; i < charOffset; ++i){
                var char = el.substr(i, 1);
                line += char;
            }
            arr[idx] = line+' '+nameAndVersion+' ';
        }

        arr[idx] = ' '+arr[idx]+' ';
    });

    lines.unshift('');

    banner = lines.join('\n');

    banner += '\n\nType "help" for a list of available commands.';
    console.log(banner);
    
    return banner;
};
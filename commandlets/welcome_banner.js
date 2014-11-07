'use strict';

module.exports = function(context, callback) {
    var fills = ['$', '+', '#', '@', '&', '1'];
    var backgrounds = [' '];

    var defaultFill = fills[Math.floor(Math.random()*fills.length)];
    var defaultBackground = backgrounds[Math.floor(Math.random()*backgrounds.length)];

    var l = context.fill || defaultFill;
    var s = context.background || defaultBackground;

    var banner =
'\n'+
'          $$\\                   $$\\     $$\\'+'\n'+
'          $$ |                  $$ |    $$ |'+'\n'+
' $$$$$$\\  $$$$$$$\\  $$\\   $$\\ $$$$$$\\   $$$$$$$\\  $$$$$$\\$$$$\\'+'\n'+
'$$  __$$\\ $$  __$$\\ $$ |  $$ |\\_$$  _|  $$  __$$\\ $$  _$$  _$$\\'+'\n'+
'$$ |  \\__|$$ |  $$ |$$ |  $$ |  $$ |    $$ |  $$ |$$ / $$ / $$ |'+'\n'+
'$$ |      $$ |  $$ |$$ |  $$ |  $$ |$$\\ $$ |  $$ |$$ | $$ | $$ |'+'\n'+
'$$ |      $$ |  $$ |\\$$$$$$$ |  \\$$$$  |$$ |  $$ |$$ | $$ | $$ |'+'\n'+
'\\__|      \\__|  \\__| \\____$$ |   \\____/ \\__|  \\__|\\__| \\__| \\__|'+'\n'+
'                    $$\\   $$ |\n'+
'                    \\$$$$$$  |     X'+context.app.model.name+' '+context.app.model.version+'X\n'+
'                     \\______/\n';

    var lines = banner.split('\n');
    var maxLength = 0;
    lines.forEach(function(el, idx, arr){
        var len = el.length;
        if(len > maxLength)
            maxLength = len;
    });

    lines.forEach(function(el, idx, arr){
        var diff = maxLength - el.length;
        for(var i = 0; i < diff; ++i){
            el += ' ';
        }

        arr[idx] = '  '+el+'  ';
    });

    banner = lines.join('\n');

    banner = banner.replace(/ /g, s).replace(/\$/g, l).replace(/X/g, ' ');

    banner += '\n\nType "help" for a list of available commands.';
    
    callback(null, banner);
};
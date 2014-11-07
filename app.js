"use strict";

var packageData = require('./package.json');

var ApplicationController = require('./controllers/application_controller');
var Application = require('./models/application');

var appModel = new Application(packageData);
var app = new ApplicationController(appModel);

app.main();
'use strict';

function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

define("CONTROLLERS_FOLDER", "controllers");
define("MODELS_FOLDER", "models");
define("COMMANDLETS_FOLDER", "commandlets");
define("TAG_PREFIX", "aws.cli.");
define("TAG_PROJECT_NAME", "aws.cli.ProjectName");
define("TAG_ENVIRONMENT", "aws.cli.Environment");
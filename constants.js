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
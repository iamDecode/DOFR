'use strict';

var instance = require("ec2-instance-data"),
    Promise = require("bluebird"),
    Object = require("../helpers/Obj");

instance.dofr_initialise = function() {
    return new Promise(function(resolve, reject) {
        instance.init(function (error, data) {
            if (error) {
                resolve();
            } else {
                resolve(data);
            }
        });
    });
}

module.exports = instance;
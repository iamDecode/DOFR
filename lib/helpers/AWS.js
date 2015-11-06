'use strict';

/**
 * @module helpers
 */

var Obj = require("./Obj"),
    AWS = require("aws-sdk");

AWS.config.update({
    accessKeyId: '',
    secretAccessKey: '',
    region: ''
});

module.exports = AWS;
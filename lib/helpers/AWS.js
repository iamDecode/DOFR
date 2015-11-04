'use strict';

/**
 * @module helpers
 */

var Obj = require("./Obj"),
    AWS = require("aws-sdk");

AWS.config.update({
    accessKeyId: 'AKIAIL4XOUV5T5NVHO5Q',
    secretAccessKey: '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',
    region: "us-east-1"
});

module.exports = AWS;
'use strict';

/**
 * @module helpers
 */

var Obj = require('./Obj'),
    AWS = require('aws-sdk');;

AWS.config.update({
    accessKeyId: 'AKIAJWNUPANCDK26ZSWA',
    secretAccessKey: '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',
    region: "us-east-1"
});

module.exports = AWS;
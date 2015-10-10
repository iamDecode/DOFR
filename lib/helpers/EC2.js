'use strict';

/**
 * @module helpers
 */

var Obj = require("./Obj"),
    AWS = require("./AWS"),
    Promise = require("bluebird");

var EC2 = new AWS.EC2();
Promise.promisifyAll(Object.getPrototypeOf(EC2));
module.exports = EC2;
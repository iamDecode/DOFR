'use strict';

/**
 * @module helpers
 */

var Obj = require('./Obj'),
    kue = require("kue"),
    Promise = require("bluebird");

/**
 * Redis client
 *
 * @class Redis
 * @constructor
 */

Promise.promisifyAll(kue);
var Kue = kue;
module.exports = Kue;
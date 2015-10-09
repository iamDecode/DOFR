'use strict';

/**
 * @module helpers
 */

var Obj = require('./Obj'),
    kue = require("kue"),
    Promise = require("bluebird");

/**
 * Kue wrapper to instantly promisify methods
 *
 * @class Kue
 * @constructor
 */

Promise.promisifyAll(kue);
Promise.promisifyAll(kue.Job.prototype);

var Kue = kue;
module.exports = Kue;
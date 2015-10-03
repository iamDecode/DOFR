'use strict';

/**
 * @module models
 */

var debug = require("debug")("DOFR:Scheduler"),
    Obj = require('../helpers/Obj');

/**
 * The task scheduler decides what task is sent to which VM.
 * @type {Function}
 */
var Scheduler = Obj.extend({
    /**
     * Schedule a new task on one of the VMs.
     * @param task
     */
    schedule: function(task) {
        throw "Not implemented";
    }
});

module.exports = Scheduler;
'use strict';

/**
 * @module Schedulers
 */

var debug = require("debug")("DOFR:RandomScheduler"),
    Obj = require('../helpers/Obj'),
    VirtualMachineManager = require("../VirtualMachines/VirtualMachineManager"),
    Scheduler = require("../models/Scheduler"),
    kue = require("kue").createQueue();

/**
 * A task scheduler for Amazon
 * @type {Function}
 */
var AmazonScheduler = Obj.extend(Scheduler, {
    /**
     * Schedule a new task on one of the VMs.
     * @param task
     */
    schedule: function(taskData) {
        throw "Not implemented";
    }
});

module.exports = AmazonScheduler;
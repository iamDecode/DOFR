'use strict';

/**
 * @module models
 */

var debug = require("debug")("DOFR:Scheduler"),
    config = require("config"),
    Obj = require('../helpers/Obj'),
    kue = require("../helpers/Kue");

/**
 * Abstract scheduler class.
 * The task scheduler decides what task is sent to which VM.
 * 
 * @class Scheduler
 * @constructor
 */
var Scheduler = Obj.extend({
    /**
     * Schedule a new task on one of the VMs.
     * @param task
     */
    schedule: function(task) {
        throw "Not implemented";
    },

    createTask: function(vm, taskData) {
        kue.createQueue().create("jobs/" + vm.uuid, taskData)
            .removeOnComplete(true)
            .save();
    }
});

module.exports = Scheduler;
'use strict';

/**
 * @module Schedulers
 */

var debug = require("debug")("DOFR:TestScheduler"),
    Obj = require('../helpers/Obj'),
    VirtualMachineManager = require("../VirtualMachines/VirtualMachineManager"),
    Scheduler = require("../models/Scheduler"),
    kue = require("kue").createQueue();

/**
 * A task scheduler that randomly selects a VM for a task.
 * @type {Function}
 */
var TestScheduler = Obj.extend(Scheduler, {
    /**
     * Schedule a new task on one of the VMs.
     * @param task
     */
    schedule: function(taskData) {
        VirtualMachineManager.getVMs().then(function(result) {
            //select a random VM
            var index = Math.floor(Math.random() * result.length) + 0;
            var vm = result[index];

            kue.create("jobs/" + vm.uuid, taskData).removeOnComplete(true).save();
        });
    }
});

module.exports = TestScheduler;
'use strict';

/**
 * @module Schedulers
 */

var debug = require("debug")("DOFR:TestScheduler"),
    Obj = require('../helpers/Obj'),
    VMManager = require("../VirtualMachines/VirtualMachineManager"),
    Scheduler = require("../models/Scheduler");

/**
 * A task scheduler that randomly selects a VM for a task.
 * 
 * @class  TestScheduler
 * @extends models.Scheduler
 * @constructor
 */
var TestScheduler = Obj.extend(Scheduler, {
    /**
     * Schedule a new task on one of the VMs.
     * @param task
     */
    schedule: function(taskData) {
        VMManager.getVMs().then(function(result) {
            //select a random VM
            var index = Math.floor(Math.random() * result.length) + 0;
            var vm = result[index];
            this.createTask(vm, taskData);
        }.bind(this));
    }
});

module.exports = TestScheduler;
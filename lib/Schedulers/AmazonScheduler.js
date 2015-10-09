'use strict';

/**
 * @module Schedulers
 */

var debug = require("debug")("DOFR:AmazonScheduler"),
    Obj = require('../helpers/Obj'),
    VMManager = require("../VirtualMachines/VirtualMachineManager"),
    Scheduler = require("../models/Scheduler");

/**
 * A task scheduler for Amazon
 *
 * @class  AmazonScheduler
 * @extends models.Scheduler
 * @constructor
 */
var AmazonScheduler = Obj.extend(Scheduler, {
    /**
     * Schedule a new task on one of the VMs.
     * @param task
     */
    schedule: function(taskData) {
        //First schedule all tasks that were on hold
        if(this.toBeScheduled.length > 0)
            this.schedule(this.toBeScheduled.pop());

        VMManager.getVMs().then(function(VMs) {
            if(VMs.length === 0) 
                //START NEW VM
                throw "No VMs available for scheduling";

            var promises = [];
            VMs.forEach(function(VM){
                promises.push(VM.getInactiveJobs.apply(VM));
            });

            Promise.all(promises).then(function(queues){
                var uuid = queues.reduce(function(a, b){
                    return (b.length < a.length) ? b : a;
                })[0].type.split("jobs/")[1];
                this.createTask(uuid, taskData);
            });
        }.bind(this));
    },

    
});

module.exports = AmazonScheduler;
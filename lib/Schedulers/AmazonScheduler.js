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

            //TODO: als een getinactivejobs faalt, faalt alles. Beter om niet
            //all te doen, maar iets van "als alles gereageerd heeft regardless of result"
            Promise.all(promises).then(function(queues){
                
                //Visualize workload per VM
                debug(queues.map(function(queue){return (queue[0].fake) ? 0 : queue.length}));
                
                //Find smallest queue
                var bestQueue = queues.reduce(function(a, b){
                    var aLength = (a[0].fake) ? 0 : a.length;
                    var bLength = (a[0].fake) ? 0 : b.length;
                    return (bLength < aLength) ? b : a;
                });

                //obtain UUID from queue
                var uuid = bestQueue[0].type.split("jobs/")[1];
                this.createTask({uuid: uuid}, taskData);
            }.bind(this));

            /*var index = Math.floor(Math.random() * VMs.length) + 0;
            var vm = VMs[index];
            this.createTask(vm, taskData);*/
        }.bind(this));
    },

    
});

module.exports = AmazonScheduler;
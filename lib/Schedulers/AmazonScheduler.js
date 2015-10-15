'use strict';

/**
 * @module Schedulers
 */

var config = require("config"),
    debug = require("debug")("DOFR:AmazonScheduler"),
    Obj = require('../helpers/Obj'),
    Promise = require('bluebird'),
    VirtualMachine = require('../models/VirtualMachine'),
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
        if(this.toBeScheduled.length > 0){
            var tasks = [];
            
            while(this.toBeScheduled.length > 0)
                tasks.push(this.assignTask(this.toBeScheduled.pop()));

            tasks.reduce(function(cur, next) {
                return cur.then(next);
            });
        }

        return this.assignTask(taskData);
    },

    assignTask: function(taskData){
        return VMManager.getVMs().then(function(VMs) {
            if(VMs.length === 0) 
                //START NEW VM
                throw "No VMs available for scheduling";

            var promises = [];
            VMs.forEach(function(VM){
                promises.push(VM.getInactiveJobs.apply(VM));
            });

            Promise.settle(promises).then(function(queues){
                //Deal with getInactiveJob failures
                queues = queues.filter(function(promise){
                    if(promise.isRejected())
                        debug('getInactiveJobs failed: ' + promise.reason());
                    
                    return promise.isFulfilled();
                }).map(function(promise){
                    return promise.value();
                });

                //Visualize workload per VM
                debug(queues.map(function(queue){return (queue[0].fake) ? 0 : queue.length}));
                
                //Find smallest queue
                var bestQueue = queues.reduce(function(a, b){ return lowest(a, b); });
                var worstQueue = queues.reduce(function(a, b){ return highest(a, b); });

                if(queueLength(bestQueue) > config.get('queue.maxSize')){
                    VMManager.createVM();
                } else if(queueLength(worstQueue) < config.get('queue.minSize') && VMs.length > 1){
                    var uuid = worstQueue[0].type.split("jobs/")[1];
                    VMManager.terminateVM(new VirtualMachine(uuid));
                }

                //obtain UUID from queue
                var uuid = bestQueue[0].type.split("jobs/")[1];
                this.createTask({uuid: uuid}, taskData);
            }.bind(this));

            /*var index = Math.floor(Math.random() * VMs.length) + 0;
            var vm = VMs[index];
            this.createTask(vm, taskData);*/
        }.bind(this));
    }
});


//Helper method
function lowest(a, b){
    var aLength = queueLength(a);
    var bLength = queueLength(b);

    if(bLength < aLength){
        return b;
    } else if (bLength > aLength){
        return a;
    } else {
        return Math.random() < 0.5 ? a : b;
    }
}

function highest(a, b){
    var aLength = queueLength(a);
    var bLength = queueLength(b);

    if(bLength > aLength){
        return b;
    } else if (bLength < aLength){
        return a;
    } else {
        return Math.random() < 0.5 ? a : b;
    }
}

function queueLength(queue){
    return (queue[0].fake) ? 0 : queue.length;
}

module.exports = AmazonScheduler;
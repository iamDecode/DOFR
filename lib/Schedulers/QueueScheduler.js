'use strict';

/**
 * @module Schedulers
 */

var config = require("config"),
    debug = require("debug")("DOFR:QueueScheduler"),
    Obj = require('../helpers/Obj'),
    Promise = require('bluebird'),
    VirtualMachine = require('../models/VirtualMachine'),
    VMManager = require("../VirtualMachines/VirtualMachineManager"),
    Scheduler = require("../models/Scheduler");

/**
 * A task scheduler that schedulers based off queue length for each VM
 *
 * @class  QueueScheduler
 * @extends models.Scheduler
 * @constructor
 */
var QueueScheduler = Obj.extend(Scheduler, {
    /**
     * Schedule a new task on one of the VMs.
     * 
     * @param {Object} taskData
     */
    schedule: function(taskData) {
        //First schedule all tasks that were on hold
        if(this.toBeScheduled.length > 0)
            this.rescheduleLoop(this.toBeScheduled.pop());

        return this.assignTask(taskData);
    },

    /**
     * Recursively reschedule toBeScheduled tasks
     * 
     * @param  {Object} taskData
     */
    rescheduleLoop: function(task){
        this.assignTask(task).then(function() {
            if(this.toBeScheduled.length > 0)
                this.rescheduleLoop(this.toBeScheduled.pop());
        }.bind(this));
    },

    /**
     * Actual placing the task
     * 
     * @param  {Object} taskData
     * @return {Promise} Promise with callback when task should be assigned
     */
    assignTask: function(taskData){
       return VMManager.getVMs().then(function(VMs) {
            if(VMs.length === 0) {
                debug('Tried to assign task while no VMs around. This should never happen!');
                VMManager.createVM();
                this.scheduleLater(taskData);

                return;
            }

            var promises = [];
            VMs.forEach(function(VM){
                promises.push(VM.getInactiveJobs.apply(VM));
            });

            return Promise.settle(promises).then(function(queues) {
                //Deal with getInactiveJob failures
                queues = queues.filter(function(promise){
                    if(promise.isRejected())
                        debug('getInactiveJobs failed: ' + promise.reason());

                    return promise.isFulfilled();
                }).map(function(promise){
                    return promise.value();
                });

                //Visualize workload per VM
                debug(queues.map(function(queue){return Scheduler.queueLength(queue);}));

                //Find smallest queue
                var bestQueue = queues
                                    .reduce(function(a, b){ return Scheduler.lowest(a, b); });
                var secondQueue = queues
                                    .filter(function(queue){ return Scheduler.uuidFromQueue(queue) !== Scheduler.uuidFromQueue(bestQueue);})
                if(secondQueue.length !== 0) secondQueue = secondQueue.reduce(function(a, b){ return Scheduler.lowest(a, b); });
                var worstQueue = queues
                                    .reduce(function(a, b){ return Scheduler.highest(a, b); });

                if(this.dynamicScaling){
                    //Create new VM when worst queueLength exceeds threshold
                    if(Scheduler.queueLength(bestQueue) > config.get('queue.maxSize')) {                      
                        //prevent creating another vm while this one is starting
                        this.dynamicScaling = false;
                        VMManager.createVM().then(function(){
                            this.dynamicScaling = true;
                        });
                    }
                    //Remove worst VM when queueLength subceeds threshold
                    else if(secondQueue.length !== 0
                        && Scheduler.queueLength(bestQueue) < config.get('queue.minSize')
                        && Scheduler.queueLength(secondQueue) < config.get('queue.minSize')
                        && VMs.length > 1) {

                        var uuid = Scheduler.uuidFromQueue(bestQueue);
                        
                        //prevent removing another vm while this one is terminating
                        this.dynamicScaling = false;
                        VMManager.terminateVM(new VirtualMachine(uuid)).then(function(){
                            this.dynamicScaling = true;
                            this.cleanUp.apply(this);
                        }.bind(this));
                    }
                }

                //obtain UUID from queue
                var uuid = Scheduler.uuidFromQueue(bestQueue);
                return this.createTask({uuid: uuid}, taskData);
            }.bind(this));
        }.bind(this));
    }
});


module.exports = QueueScheduler;
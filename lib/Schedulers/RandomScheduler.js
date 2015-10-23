'use strict';

/**
 * @module Schedulers
 */

var config = require("config"),
    debug = require("debug")("DOFR:RandomScheduler"),
    Obj = require('../helpers/Obj'),
    Promise = require('bluebird'),
    VirtualMachine = require('../models/VirtualMachine'),
    VMManager = require("../VirtualMachines/VirtualMachineManager"),
    Scheduler = require("../models/Scheduler");

/**
 * A task scheduler that randomly selects a VM for a task.
 * 
 * @class  RandomScheduler
 * @extends models.Scheduler
 * @constructor
 */
var RandomScheduler = Obj.extend(Scheduler, {
    /**
     * Schedule a new task on one of the VMs.
     * @param task
     */
    schedule: function(taskData) {
        //First schedule all tasks that were on hold
        if(this.toBeScheduled.length > 0) {
            this.schedule(this.toBeScheduled.pop());
        }

        VMManager.getVMs().then(function(VMs) {
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

                //Find smallest queue
                var bestQueue = queues
                                    .reduce(function(a, b){ return Scheduler.lowest(a, b); });
                var secondQueue = queues
                                    .filter(function(queue){ return Scheduler.uuidFromQueue(queue) !== Scheduler.uuidFromQueue(bestQueue);})
                if(secondQueue.length !== 0) secondQueue = secondQueue.reduce(function(a, b){ return Scheduler.lowest(a, b); });
                var worstQueue = queues
                                    .reduce(function(a, b){ return Scheduler.highest(a, b); });

                //Visualize workload per VM
                debug(queues.map(function(queue){return Scheduler.queueLength(queue);}));

                if(this.dynamicScaling){
                    //Create new VM when worst queueLength exceeds threshold
                    if(Scheduler.queueLength(bestQueue) > config.get('queue.maxSize')) {                      
                        //prevent creating another vm while this one is starting
                        this.dynamicScaling = false;
                        VMManager.createVM().then(function(){
                            this.dynamicScaling = true;
                        }.bind(this));
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

                //select a random VM
                var index = Math.floor(Math.random() * VMs.length) + 0;
                var vm = VMs[index];
                this.createTask(vm, taskData);
            }.bind(this));
        }.bind(this));
    }
});

module.exports = RandomScheduler;
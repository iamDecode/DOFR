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
    damping: 0,
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
                debug(queues.map(function(queue){return QueueScheduler.queueLength(queue);}));

                //Find smallest queue
                var bestQueue = queues
                                    .reduce(function(a, b){ return QueueScheduler.lowest(a, b); });
                var secondQueue = queues
                                    .filter(function(queue){ return queue.length !== bestQueue.length;})
                if(secondQueue.length !== 0) secondQueue = secondQueue.reduce(function(a, b){ return QueueScheduler.lowest(a, b); });
                var worstQueue = queues
                                    .reduce(function(a, b){ return QueueScheduler.highest(a, b); });

                //debug('bestQueue: ' + QueueScheduler.queueLength(bestQueue));
                //debug('secondQueue: ' + QueueScheduler.queueLength(secondQueue));
                //debug('worstQueue: ' + QueueScheduler.queueLength(worstQueue));

                //Create new VM when worst queueLength exceeds threshold
                if(this.damping < 0 && QueueScheduler.queueLength(bestQueue) > config.get('queue.maxSize')) {
                    this.damping = 1+config.get('queue.actionDeviation');
                    VMManager.createVM();
                }
                //Remove worst VM when queueLength subceeds threshold
                else if(this.damping < 0 
                    && secondQueue.length !== 0
                    && QueueScheduler.queueLength(bestQueue) < config.get('queue.minSize')
                    && QueueScheduler.queueLength(secondQueue) < config.get('queue.minSize')
                    && VMs.length > 1) {

                    this.damping = 1+config.get('queue.actionDeviation');
                    var uuid = QueueScheduler.uuidFromQueue(bestQueue);
                    VMManager.terminateVM(new VirtualMachine(uuid)).then(function(){
                        this.cleanUp.apply(this);
                    }.bind(this));
                }
                this.damping--;

                //obtain UUID from queue
                var uuid = QueueScheduler.uuidFromQueue(bestQueue);
                return this.createTask({uuid: uuid}, taskData);
            }.bind(this));
        }.bind(this));
    }
},

//Static helper methods
{
    /**
     * Compare function to find the smallest queue.
     * 
     * @param  {queue} a first queue
     * @param  {queue} b second queue
     * @return {queue} the queue that is longest
     */
    lowest: function(a, b){
        var aLength = QueueScheduler.queueLength(a);
        var bLength = QueueScheduler.queueLength(b);

        if(bLength < aLength){
            return b;
        } else if (bLength > aLength){
            return a;
        } else {
            return Math.random() < 0.5 ? a : b;
        }
    },

    /**
     * Compare function to find the longest queue.
     * 
     * @param  {queue} a first queue
     * @param  {queue} b second queue
     * @return {queue} the queue that is longest
     */
    highest: function(a, b){
        var aLength = QueueScheduler.queueLength(a);
        var bLength = QueueScheduler.queueLength(b);

        if(bLength > aLength){
            return b;
        } else if (bLength < aLength){
            return a;
        } else {
            return Math.random() < 0.5 ? a : b;
        }
    },

    /**
     * Returns queue length taking into account fake queues for UUID transfer.
     *
     * @param  {queue} queue
     * @return {number} queue length
     */
    queueLength: function(queue){
        return (queue[0].fake) ? 0 : queue.length;
    },

    /**
     * Returns UUID corresponding the the VM that the given queue is assigned to.
     * 
     * @param  {queue} queue
     * @return {string} VM UUID
     */
    uuidFromQueue: function(queue){
        return queue[0].type.split("jobs/")[1];
    }
});


module.exports = QueueScheduler;
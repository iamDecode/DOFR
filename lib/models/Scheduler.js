'use strict';

/**
 * @module models
 */

var debug = require("debug")("DOFR:Scheduler"),
    config = require("config"),
    Obj = require('../helpers/Obj'),
    kue = require("../helpers/Kue"),
    VMManager = require("../VirtualMachines/VirtualMachineManager"),
    Logging = require("../helpers/Logging");

/**
 * Abstract scheduler class.
 * The task scheduler decides what task is sent to which VM.
 * 
 * @class Scheduler
 * @constructor
 */
var Scheduler = Obj.extend({
    toBeScheduled: [],
    dynamicScaling: false, 

    init: function(dynamicScaling){
        this.dynamicScaling = dynamicScaling;
    },

    /**
     * Schedule a new task on one of the VMs.
     * @param task
     */
    schedule: function(task) {
        throw "Not implemented";
    },

    /**
     * Create a task and schedule it in Kue.
     * @param vm
     * @param taskData
     * @returns {*|old}
     */
    createTask: function(vm, taskData) {
        return new Promise(function(resolve, reject){
            kue.createKue().create("jobs/" + vm.uuid, taskData)
                .save(function(err){
                    if(err)
                        reject();
                    else
                        resolve();
                });
        });
    },

    scheduleLater: function(taskData) {
        this.toBeScheduled.push(taskData);
    },

    /**
     * Clean Redis virtual machine references.
     */
    cleanUp: function() {
        VMManager.getVMs().then(function(results) {
            //Find and remove dead VMs
            var vmCleanupPromises = [];
            var deadVMs = [];
            results.forEach(function(vm) {
                var currentTime = (new Date()).getTime();
                vmCleanupPromises.push(vm.lastHeartbeat().then(function(heartbeatTime) {
                    //If vm has not sent a heartbeat in the last ten seconds, consider it dead
                    if (currentTime - heartbeatTime > config.get('cleanup.timeout')) {
                        return VMManager.terminateVM(vm).then(function () {
                            debug("Cleaned up: " + vm.uuid);
                            deadVMs.push(vm);
                        });
                    }
                }));
            });

            //As soon as VMs are cleaned up, reschedule their tasks.
            Promise.all(vmCleanupPromises).then(function() {
                //Remove dead VMs from the results list. Results only contains alive VMs.
                deadVMs.forEach(function(vm) {
                    var index = results.indexOf(vm);
                    results.splice(index, 1);
                });

                //Reclaim tasks belonging to already dead VMs. Get ids of all inactive jobs.
                kue.createKue().inactive(function(err, ids) {
                    ids.forEach(function(id) {
                        //Get job objects from each id
                        kue.Job.get(id, function(err, job) {
                            //Check if the job belongs to a VM that is still alive.
                            var split = job.type.split("jobs/");
                            var uuid = split[1];

                            var alive = false;
                            results.forEach(function(vm) {
                                if(vm.uuid === uuid)
                                    alive = true;
                            });

                            //Remove job if it is dead and reschedule it on another VM
                            if(!alive) {
                                job.remove(function(err){
                                    if (err)
                                        throw err;

                                    debug("Removed job belonging to dead VM: " + job.type);
                                    this.scheduleLater(job.data);
                                }.bind(this));
                            }
                        }.bind(this));
                    }.bind(this));
                }.bind(this));
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
        var aLength = Scheduler.queueLength(a);
        var bLength = Scheduler.queueLength(b);

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
        var aLength = Scheduler.queueLength(a);
        var bLength = Scheduler.queueLength(b);

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

module.exports = Scheduler;
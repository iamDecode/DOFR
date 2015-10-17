'use strict';

/**
 * @module models
 */

var debug = require("debug")("DOFR:Scheduler"),
    config = require("config"),
    Obj = require('../helpers/Obj'),
    kue = require("../helpers/Kue"),
    VMManager = require("../VirtualMachines/VirtualMachineManager");

/**
 * Abstract scheduler class.
 * The task scheduler decides what task is sent to which VM.
 * 
 * @class Scheduler
 * @constructor
 */
var Scheduler = Obj.extend({
    toBeScheduled: [],

    /**
     * Schedule a new task on one of the VMs.
     * @param task
     */
    schedule: function(task) {
        throw "Not implemented";
    },

    createTask: function(vm, taskData) {
        return new Promise(function(resolve, reject){
            kue.createQueue().create("jobs/" + vm.uuid, taskData)
                .removeOnComplete(true)
                .save(function(err){
                    if(err) reject();
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
                deadVMs.forEach(function(vm) {
                    var index = results.indexOf(vm);
                    results.splice(index, 1);
                });

                //Reclaim tasks belonging to already dead VMs. Get ids of all inactive jobs.
                kue.createQueue().inactive(function(err, ids) {
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
});

module.exports = Scheduler;
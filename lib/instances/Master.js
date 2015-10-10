'use strict';

/**
 * @module instances
 */

var config = require('config'),
    debug = require("debug")("DOFR:Master"),
    Obj = require("../helpers/Obj"),
    VMManager = require("../VirtualMachines/VirtualMachineManager"),
    Scheduler = require("../Schedulers/AmazonScheduler"),
    kue = require("../helpers/Kue"),
    faces = require("../faces.json"),
    EC2 = require("../helpers/EC2");

/**
 * This master class is the main entry point for when a process starts as a master.
 *
 *  @class Master
 *  @constructor
 */
var Master = Obj.extend({
    taskScheduler: null,

    init: function(){
        debug("Master created");
        EC2.describeInstancesAsync().then(function(data) {
            console.log(data); // request succeeded
        });
        return;

        //Create task scheduler
        this.taskScheduler = new Scheduler();

        //Create some VMs
        var newVMs = [];
        for(var i = 0; i < 2; i++) {
            newVMs.push(VMManager.createVM());
        }
        Promise.all(newVMs).then(function(created) {
            debug("Created vms: " + created.length);
        });

        //Set up a timer to clean (dead) virtual machines every 10 seconds
        setInterval(this.cleanUp.bind(this), config.get('cleanup.interval'));
        //this.cleanUp.apply(this);

        //For testing, generate tasks every second
        setInterval(function() {
            this.taskScheduler.schedule({
                //Random URL to face image
                imageUrl: faces[Math.floor(Math.random() * faces.length)]
            });
        }.bind(this), 250);
    },

    /**
     * Clean Redis virtual machine references.
     */
    cleanUp: function() {
        var taskScheduler = this.taskScheduler;
        VMManager.getVMs().then(function(results) {
            //Find and remove dead VMs
            results.forEach(function(vm) {
                var currentTime = (new Date()).getTime();
                vm.lastHeartbeat().then(function(heartbeatTime) {
                    //If vm has not sent a heartbeat in the last ten seconds, consider it dead
                    if (currentTime - heartbeatTime > config.get('cleanup.timeout'))
                        VMManager.terminateVM(vm).then(function() {
                            debug("Cleaned up: " + vm.uuid);
                        });
                });
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
                                taskScheduler.scheduleLater(job.data);
                            });
                        }
                    });
                });
            });
        });
    }
});

module.exports = Master;
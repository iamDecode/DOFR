'use strict';

/**
 * @module instances
 */

var debug = require("debug")("DOFR:Master"),
    Obj = require("../helpers/Obj"),
    VirtualMachineManager = require("../VirtualMachines/VirtualMachineManager"),
    Scheduler = require("../Schedulers/TestScheduler"),
    kue = require("kue").createQueue();

/**
 * This master class is the main entry point for when a process starts as a master.
 * @type {Function}
 */
var Master = Obj.extend({
    taskScheduler: null,

    init: function(){
        debug("Master created");

        //Set up a timer to clean (dead) virtual machines every 10 seconds
        setInterval(this.cleanUp, 1000 * 10);

        //Create task scheduler
        this.taskScheduler = new Scheduler();

        //Create some VMs
        var newVMs = [];
        for(var i = 0; i < 2; i++) {
            newVMs.push(VirtualMachineManager.createVM());
        }
        Promise.all(newVMs).then(function(created) {
            debug("Created vms: " + created.length);
        });

        //For testing, generate tasks every second
        setInterval(function() {
            this.taskScheduler.schedule({
                imageUrl: "Some image's url..."
            });
        }.bind(this), 1000);
    },

    /**
     * Clean Redis virtual machine references.
     */
    cleanUp: function() {
        VirtualMachineManager.getVMs().then(function(results) {
            results.forEach(function(vm) {
                var currentTime = (new Date()).getTime();
                vm.lastHeartbeat().then(function(heartbeatTime) {
                    //If vm has not sent a heartbeat in the last ten seconds, consider it dead
                    if (currentTime - heartbeatTime > 1000 * 10)
                        VirtualMachineManager.terminateVM(vm).then(function() {
                            debug("Cleaned up: " + vm.uuid);
                        });
                });
            });
        });

        debug("Cleaned up dead stuff");
    }
});

module.exports = Master;
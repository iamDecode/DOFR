'use strict';

/**
 * @module instances
 */

var config = require('config'),
    debug = require("debug")("DOFR:Master"),
    Obj = require("../helpers/Obj"),
    VMManager = require("../VirtualMachines/VirtualMachineManager"),
    Scheduler = require("../Schedulers/TestScheduler"),
    kue = require("../helpers/Kue"),
    faces = require("../faces.json");

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

        //Set up a timer to clean (dead) virtual machines every 10 seconds
        setInterval(this.cleanUp, config.get('cleanup.interval'));
        this.cleanUp();

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

        //For testing, generate tasks every second
        setInterval(function() {
            this.taskScheduler.schedule({
                //Random URL to face image
                imageUrl: faces[Math.floor(Math.random() * faces.length)]
            });
        }.bind(this), 100);
    },

    /**
     * Clean Redis virtual machine references.
     */
    cleanUp: function() {
        VMManager.getVMs().then(function(results) {
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
        });
    }
});

module.exports = Master;
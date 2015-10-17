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
    Promise = require("bluebird");

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
        setInterval(this.taskScheduler.cleanUp.bind(this.taskScheduler), config.get('cleanup.interval'));
        this.taskScheduler.cleanUp.apply(this.taskScheduler);

        //For testing, generate tasks every second
        this.simulateTasks(50);
    },

    simulateTasks: function(timeout){
        this.taskScheduler.schedule({
            //Random URL to face image
            imageUrl: faces[Math.floor(Math.random() * faces.length)]
        });

        setTimeout(function(){
            this.simulateTasks(++timeout);
        }.bind(this), timeout);
    }
});

module.exports = Master;